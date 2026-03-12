use crate::services::engine::PlayoutEngine;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

/// A registry mapping channel UUIDs to their dedicated PlayoutEngine instances.
/// Shared across all Actix workers via `web::Data<Arc<ChannelRegistry>>`.
pub struct ChannelRegistry {
    engines: Mutex<HashMap<Uuid, Arc<PlayoutEngine>>>,
}

impl ChannelRegistry {
    pub fn new() -> Self {
        ChannelRegistry {
            engines: Mutex::new(HashMap::new()),
        }
    }

    /// Retrieve the engine for a channel, if it has been registered.
    pub async fn get(&self, id: Uuid) -> Option<Arc<PlayoutEngine>> {
        self.engines.lock().await.get(&id).cloned()
    }

    /// Register (or replace) an engine for a channel.
    pub async fn insert(&self, id: Uuid, engine: Arc<PlayoutEngine>) {
        self.engines.lock().await.insert(id, engine);
    }

    /// Remove and return the engine for a channel (used on channel deletion).
    pub async fn remove(&self, id: Uuid) -> Option<Arc<PlayoutEngine>> {
        self.engines.lock().await.remove(&id)
    }

    /// List all registered channel IDs.
    pub async fn channel_ids(&self) -> Vec<Uuid> {
        self.engines.lock().await.keys().cloned().collect()
    }
}
