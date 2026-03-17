use redis::{aio::ConnectionManager, AsyncCommands, Client};
use serde::{de::DeserializeOwned, Serialize};
use std::env;

/// Simple Redis-based caching service for frequently accessed data
pub struct CacheService {
    connection: ConnectionManager,
}

impl CacheService {
    /// Create a new cache service instance
    pub async fn new() -> Result<Self, String> {
        let url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
        let client = Client::open(url.clone())
            .map_err(|e| format!("Failed to create Redis client: {}", e))?;
        
        let connection = ConnectionManager::new(client)
            .await
            .map_err(|e| format!("Failed to create Redis connection: {}", e))?;
        
        log::info!("Redis cache service initialized");
        
        Ok(Self { connection })
    }

    /// Get a value from cache
    pub async fn get<T: DeserializeOwned>(&mut self, key: &str) -> Result<Option<T>, String> {
        let value: Option<String> = self
            .connection
            .get(key)
            .await
            .map_err(|e| format!("Redis get error: {}", e))?;

        match value {
            Some(v) => {
                let deserialized: T = serde_json::from_str(&v)
                    .map_err(|e| format!("Redis deserialize error: {}", e))?;
                Ok(Some(deserialized))
            }
            None => Ok(None),
        }
    }

    /// Set a value in cache with expiration
    pub async fn set<T: Serialize>(&mut self, key: &str, value: &T, ttl_seconds: u64) -> Result<(), String> {
        let serialized = serde_json::to_string(value)
            .map_err(|e| format!("Redis serialize error: {}", e))?;

        self.connection
            .set_ex::<_, _, ()>(key, serialized, ttl_seconds)
            .await
            .map_err(|e| format!("Redis set error: {}", e))?;

        Ok(())
    }

    /// Delete a key from cache
    pub async fn delete(&mut self, key: &str) -> Result<(), String> {
        self.connection
            .del::<_, ()>(key)
            .await
            .map_err(|e| format!("Redis delete error: {}", e))?;

        Ok(())
    }

    /// Check if a key exists
    pub async fn exists(&mut self, key: &str) -> Result<bool, String> {
        let exists: bool = self
            .connection
            .exists(key)
            .await
            .map_err(|e| format!("Redis exists error: {}", e))?;

        Ok(exists)
    }
}

/// Cache keys for different data types
pub mod keys {
    pub const SETTINGS: &str = "cache:settings";
    pub const SCHEDULE_PREFIX: &str = "cache:schedule:";
    pub const PLAYLIST_PREFIX: &str = "cache:playlist:";
    pub const MEDIA_PREFIX: &str = "cache:media:";
    
    /// Get schedule cache key for a date range
    pub fn schedule_key(start: &str, end: &str) -> String {
        format!("cache:schedule:{}:{}", start, end)
    }
    
    /// Get playlist cache key
    pub fn playlist_key(id: &str) -> String {
        format!("cache:playlist:{}", id)
    }
    
    /// Get media list cache key with filters
    pub fn media_list_key(page: i64, limit: i64, media_type: Option<&str>, search: Option<&str>) -> String {
        format!("cache:media:list:{}:{}:{:?}:{:?}", page, limit, media_type, search)
    }
}

/// Default TTL values (in seconds)
pub mod ttl {
    pub const SETTINGS: u64 = 30;       // 30 seconds for settings
    pub const SCHEDULE: u64 = 5;        // 5 seconds for schedule
    pub const PLAYLIST: u64 = 10;       // 10 seconds for playlists
    pub const MEDIA_LIST: u64 = 10;      // 10 seconds for media lists
}
