// ── services/storage.rs — Trait-based Storage Backend (Phase 5) ──────────────
//
// Supports two backends, selected via STORAGE_BACKEND env var:
//   - "local"  (default) — reads/writes files on the local volume mount
//   - "s3"               — reads/writes to MinIO / AWS S3 via object_store crate
//
// Usage:
//   let store = StorageBackend::from_env();
//   store.put("media/foo.mp4", bytes).await?;
//   let bytes = store.get("media/foo.mp4").await?;
//   let url   = store.public_url("media/foo.mp4");

use std::env;
use std::path::{Path, PathBuf};
use tokio::fs;
use bytes::Bytes;

// ── Trait ────────────────────────────────────────────────────────────────────

#[async_trait::async_trait]
pub trait Storage: Send + Sync {
    /// Store bytes at `key` (e.g. "media/foo.mp4").
    async fn put(&self, key: &str, data: Bytes) -> Result<(), StorageError>;
    /// Retrieve bytes stored at `key`.
    async fn get(&self, key: &str) -> Result<Bytes, StorageError>;
    /// Delete the object at `key`.
    async fn delete(&self, key: &str) -> Result<(), StorageError>;
    /// Check if `key` exists.
    async fn exists(&self, key: &str) -> bool;
    /// Return a public-accessible URL for `key` (presigned for S3, file path for local).
    fn public_url(&self, key: &str) -> String;
}

// ── Error type ────────────────────────────────────────────────────────────────

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("S3 error: {0}")]
    S3(String),
    #[error("Not found: {0}")]
    NotFound(String),
}

// ── Local backend ─────────────────────────────────────────────────────────────

pub struct LocalStorage {
    root: PathBuf,
    public_base: String,
}

impl LocalStorage {
    pub fn new(root: impl Into<PathBuf>, public_base: impl Into<String>) -> Self {
        Self { root: root.into(), public_base: public_base.into() }
    }
}

#[async_trait::async_trait]
impl Storage for LocalStorage {
    async fn put(&self, key: &str, data: Bytes) -> Result<(), StorageError> {
        let path = self.root.join(key);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await?;
        }
        fs::write(&path, data).await?;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Bytes, StorageError> {
        let path = self.root.join(key);
        if !path.exists() {
            return Err(StorageError::NotFound(key.to_string()));
        }
        let data = fs::read(&path).await?;
        Ok(Bytes::from(data))
    }

    async fn delete(&self, key: &str) -> Result<(), StorageError> {
        let path = self.root.join(key);
        if path.exists() {
            fs::remove_file(&path).await?;
        }
        Ok(())
    }

    async fn exists(&self, key: &str) -> bool {
        self.root.join(key).exists()
    }

    fn public_url(&self, key: &str) -> String {
        format!("{}/{}", self.public_base.trim_end_matches('/'), key)
    }
}

// ── S3 backend (MinIO-compatible) ─────────────────────────────────────────────

pub struct S3Storage {
    client: object_store::aws::AmazonS3,
    bucket: String,
    public_base: String,
}

impl S3Storage {
    /// Build from environment variables:
    ///   S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION, S3_PUBLIC_BASE
    pub fn from_env() -> Result<Self, StorageError> {
        let endpoint  = env::var("S3_ENDPOINT").unwrap_or_else(|_| "http://minio:9000".to_string());
        let bucket    = env::var("S3_BUCKET").unwrap_or_else(|_| "onepa-media".to_string());
        let access    = env::var("S3_ACCESS_KEY").unwrap_or_else(|_| "minioadmin".to_string());
        let secret    = env::var("S3_SECRET_KEY").unwrap_or_else(|_| "minioadmin".to_string());
        let region    = env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".to_string());
        let public_base = env::var("S3_PUBLIC_BASE").unwrap_or_else(|_| format!("{}/{}", endpoint, bucket));

        let client = object_store::aws::AmazonS3Builder::new()
            .with_endpoint(&endpoint)
            .with_bucket_name(&bucket)
            .with_access_key_id(&access)
            .with_secret_access_key(&secret)
            .with_region(&region)
            .with_allow_http(true)  // MinIO over plain HTTP in local Docker
            .build()
            .map_err(|e| StorageError::S3(e.to_string()))?;

        Ok(Self { client, bucket, public_base })
    }
}

#[async_trait::async_trait]
impl Storage for S3Storage {
    async fn put(&self, key: &str, data: Bytes) -> Result<(), StorageError> {
        use object_store::ObjectStore;
        let path = object_store::path::Path::from(key);
        self.client.put(&path, data.into()).await
            .map_err(|e| StorageError::S3(e.to_string()))?;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Bytes, StorageError> {
        use object_store::ObjectStore;
        let path = object_store::path::Path::from(key);
        let result = self.client.get(&path).await
            .map_err(|e| match e {
                object_store::Error::NotFound { .. } => StorageError::NotFound(key.to_string()),
                other => StorageError::S3(other.to_string()),
            })?;
        let data = result.bytes().await
            .map_err(|e| StorageError::S3(e.to_string()))?;
        Ok(data)
    }

    async fn delete(&self, key: &str) -> Result<(), StorageError> {
        use object_store::ObjectStore;
        let path = object_store::path::Path::from(key);
        self.client.delete(&path).await
            .map_err(|e| StorageError::S3(e.to_string()))?;
        Ok(())
    }

    async fn exists(&self, key: &str) -> bool {
        use object_store::ObjectStore;
        let path = object_store::path::Path::from(key);
        self.client.head(&path).await.is_ok()
    }

    fn public_url(&self, key: &str) -> String {
        format!("{}/{}", self.public_base.trim_end_matches('/'), key)
    }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/// Shared storage backend type — boxed trait object.
pub type StorageBackend = Box<dyn Storage>;

/// Construct the active storage backend from environment.
/// STORAGE_BACKEND=local (default) or s3
#[allow(dead_code)]
pub fn storage_from_env() -> StorageBackend {
    let backend = env::var("STORAGE_BACKEND").unwrap_or_else(|_| "local".to_string());
    match backend.as_str() {
        "s3" => {
            match S3Storage::from_env() {
                Ok(s) => {
                    log::info!("[Storage] Backend: S3/MinIO ({})", env::var("S3_ENDPOINT").unwrap_or_default());
                    Box::new(s)
                }
                Err(e) => {
                    log::error!("[Storage] S3 init failed: {} — falling back to local", e);
                    let root = env::var("MEDIA_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
                    Box::new(LocalStorage::new(root, "/media"))
                }
            }
        }
        _ => {
            let root = env::var("MEDIA_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/media".to_string());
            log::info!("[Storage] Backend: Local ({})", root);
            Box::new(LocalStorage::new(root, "/media"))
        }
    }
}
