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
pub async fn bridge_redis_to_broadcaster(redis_channel: &str, tx: WsBroadcaster) {
    let url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let channel = redis_channel.to_string();
    tokio::spawn(async move {
        EventBus::subscribe(&url, &channel, move |msg| {
            let _ = tx.send(msg);
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

    let (response, mut session, mut stream) = actix_ws::handle(&req, body)?;

    let mut rx = broadcaster.subscribe();

    actix_web::rt::spawn(async move {
        let mut ping_interval =
            tokio::time::interval(tokio::time::Duration::from_secs(30));

        loop {
            tokio::select! {
                // Forward Redis events to the WebSocket client
                Ok(msg) = rx.recv() => {
                    if session.text(msg).await.is_err() {
                        break;
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
