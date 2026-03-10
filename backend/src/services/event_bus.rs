use redis::{aio::ConnectionManager, AsyncCommands, Client};
use serde_json::Value;
use std::env;

/// A cloneable Redis event bus for pub/sub messaging between services.
#[derive(Clone)]
pub struct EventBus {
    conn: ConnectionManager,
}

impl EventBus {
    /// Connect to Redis, retrying up to 30 times.
    pub async fn new() -> Result<Self, String> {
        let url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
        let client = Client::open(url.clone())
            .map_err(|e| format!("Redis client error: {}", e))?;

        let mut retries = 0;
        loop {
            match ConnectionManager::new(client.clone()).await {
                Ok(conn) => {
                    log::info!("Redis connected at {}", url);
                    return Ok(EventBus { conn });
                }
                Err(e) => {
                    retries += 1;
                    if retries >= 30 {
                        return Err(format!("Failed to connect to Redis after 30 attempts: {}", e));
                    }
                    log::warn!("Redis connection attempt {}/30 failed: {}. Retrying...", retries, e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                }
            }
        }
    }

    /// Publish a JSON event to a Redis channel.
    /// Channel naming convention: `playout:{channel_id}`, `audit`, `analytics:{channel_id}`
    pub async fn publish(&self, channel: &str, event_type: &str, payload: Value) {
        let mut conn = self.conn.clone();
        let message = serde_json::json!({
            "event": event_type,
            "data": payload,
            "ts": chrono::Utc::now().timestamp_millis(),
        });
        let msg_str = message.to_string();
        if let Err(e) = conn.publish::<_, _, ()>(channel, msg_str).await {
            log::warn!("EventBus publish error on '{}': {}", channel, e);
        }
    }

    /// Subscribe to a Redis channel and process each message with a callback.
    /// This is a blocking call — run it inside tokio::spawn.
    pub async fn subscribe<F>(redis_url: &str, channel: &str, mut handler: F)
    where
        F: FnMut(String) + Send + 'static,
    {
        let client = match Client::open(redis_url) {
            Ok(c) => c,
            Err(e) => {
                log::error!("EventBus subscribe: failed to open client: {}", e);
                return;
            }
        };

        let conn = match client.get_async_connection().await {
            Ok(c) => c,
            Err(e) => {
                log::error!("EventBus subscribe: failed to get connection: {}", e);
                return;
            }
        };

        let mut pubsub = conn.into_pubsub();

        if let Err(e) = pubsub.subscribe(channel).await {
            log::error!("EventBus subscribe: failed to subscribe to '{}': {}", channel, e);
            return;
        }

        log::info!("EventBus subscribed to '{}'", channel);

        use futures_util::StreamExt;
        let mut stream = pubsub.into_on_message();
        while let Some(msg) = stream.next().await {
            if let Ok(payload) = msg.get_payload::<String>() {
                handler(payload);
            }
        }
    }
}
