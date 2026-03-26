use crate::services::event_bus::EventBus;
use crate::utils::jwt;
use actix_web::{web, HttpRequest, HttpResponse};
use actix_ws::Message;
use futures_util::StreamExt;
use std::env;
use tokio::sync::broadcast;

/// Shared broadcast sender — all WebSocket sessions receive events via this channel.
pub type WsBroadcaster = broadcast::Sender<String>;

/// Create a broadcaster with capacity for 256 pending messages.
pub fn create_broadcaster() -> WsBroadcaster {
    broadcast::channel::<String>(256).0
}

/// Spawn a task that forwards Redis pub/sub events to the in-process broadcaster.
/// Call once at server startup for each Redis channel you want to relay.
pub async fn bridge_redis_to_broadcaster(pattern: &str, tx: WsBroadcaster) {
    let url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let pattern_str = pattern.to_string();
    tokio::spawn(async move {
        EventBus::psubscribe(&url, &pattern_str, move |msg, channel| {
            // Encode channel + message into a single JSON for the broadcaster
            let relay = serde_json::json!({
                "source": channel,
                "payload": msg
            });
            let _ = tx.send(relay.to_string());
        })
        .await;
    });
}

/// WebSocket handler — `GET /api/v2/events?token=<JWT>`
///
/// Clients authenticate via query-string token (Bearer header unavailable for WS upgrades).
/// After upgrade, the server forwards every Redis event published to the `playout:*`
/// and `analytics:*` channels as a JSON text frame.
pub async fn ws_handler(
    req: HttpRequest,
    body: web::Payload,
    broadcaster: web::Data<WsBroadcaster>,
) -> Result<HttpResponse, actix_web::Error> {
    // Authenticate via query param: ?token=<JWT>
    let token = req
        .query_string()
        .split('&')
        .find_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            let key = parts.next()?;
            let val = parts.next()?;
            if key == "token" { Some(val.to_string()) } else { None }
        })
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("Missing token"))?;

    jwt::validate_token(&token)
        .map_err(|_| actix_web::error::ErrorUnauthorized("Invalid token"))?;

    // Optional channel_id for filtering
    let channel_id = req.query_string().split('&').find_map(|pair| {
        let mut parts = pair.splitn(2, '=');
        let key = parts.next()?;
        let val = parts.next()?;
        if key == "channel_id" {
            Some(val.to_string())
        } else {
            None
        }
    });

    let (response, mut session, mut stream) = actix_ws::handle(&req, body)?;
    let mut rx = broadcaster.subscribe();

    actix_web::rt::spawn(async move {
        let mut ping_interval = tokio::time::interval(tokio::time::Duration::from_secs(30));

        loop {
            tokio::select! {
                // Forward Redis events to the WebSocket client
                Ok(msg) = rx.recv() => {
                    // Try to parse the relay JSON
                    if let Ok(relay) = serde_json::from_str::<serde_json::Value>(&msg) {
                        let source = relay["source"].as_str().unwrap_or("");
                        let payload = relay["payload"].as_str().unwrap_or("");

                        // Filter: if channel_id matches or is default
                        let mut should_send = false;
                        if let Some(ref cid) = channel_id {
                            // Message is for channel cid: playout:{cid} or analytics:{cid}
                            if source == format!("playout:{}", cid) || source == format!("analytics:{}", cid) {
                                should_send = true;
                            }
                        } else {
                            // Legacy/default behavior
                            if source == "playout:default" || source == "analytics:default" {
                                should_send = true;
                            }
                        }

                        if should_send {
                            if session.text(payload).await.is_err() {
                                break;
                            }
                        }
                    }
                }
                // Process incoming frames (pong / close)
                Some(Ok(frame)) = stream.next() => {
                    match frame {
                        Message::Close(_) => break,
                        Message::Ping(data) => {
                            if session.pong(&data).await.is_err() {
                                break;
                            }
                        }
                        _ => {}
                    }
                }
                // Send keep-alive ping every 30 seconds
                _ = ping_interval.tick() => {
                    if session.ping(b"").await.is_err() {
                        break;
                    }
                }
                else => break,
            }
        }

        let _ = session.close(None).await;
    });

    Ok(response)
}
