use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

/// Simple in-memory metrics collector for performance monitoring
pub struct MetricsCollector {
    /// Total requests handled
    requests_total: AtomicU64,
    /// Requests currently in progress
    requests_active: AtomicU64,
    /// Total response time in milliseconds
    response_time_total: AtomicU64,
    /// Number of database queries
    db_queries_total: AtomicU64,
    /// Total database query time in milliseconds
    db_time_total: AtomicU64,
}

impl MetricsCollector {
    pub fn new() -> Self {
        Self {
            requests_total: AtomicU64::new(0),
            requests_active: AtomicU64::new(0),
            response_time_total: AtomicU64::new(0),
            db_queries_total: AtomicU64::new(0),
            db_time_total: AtomicU64::new(0),
        }
    }

    /// Record a request start
    pub fn request_start(&self) {
        self.requests_total.fetch_add(1, Ordering::Relaxed);
        self.requests_active.fetch_add(1, Ordering::Relaxed);
    }

    /// Record a request end
    pub fn request_end(&self, duration: Duration) {
        self.requests_active.fetch_sub(1, Ordering::Relaxed);
        self.response_time_total
            .fetch_add(duration.as_millis() as u64, Ordering::Relaxed);
    }

    /// Record a database query
    pub fn db_query(&self, duration: Duration) {
        self.db_queries_total.fetch_add(1, Ordering::Relaxed);
        self.db_time_total
            .fetch_add(duration.as_millis() as u64, Ordering::Relaxed);
    }

    /// Get current metrics snapshot
    pub fn snapshot(&self) -> MetricsSnapshot {
        let requests = self.requests_total.load(Ordering::Relaxed);
        let response_time = self.response_time_total.load(Ordering::Relaxed);
        let db_queries = self.db_queries_total.load(Ordering::Relaxed);
        let db_time = self.db_time_total.load(Ordering::Relaxed);

        MetricsSnapshot {
            requests_total: requests,
            requests_active: self.requests_active.load(Ordering::Relaxed),
            avg_response_time_ms: if requests > 0 {
                response_time / requests
            } else {
                0
            },
            db_queries_total: db_queries,
            avg_db_time_ms: if db_queries > 0 {
                db_time / db_queries
            } else {
                0
            },
        }
    }

    /// Reset all metrics
    pub fn reset(&self) {
        self.requests_total.store(0, Ordering::Relaxed);
        self.requests_active.store(0, Ordering::Relaxed);
        self.response_time_total.store(0, Ordering::Relaxed);
        self.db_queries_total.store(0, Ordering::Relaxed);
        self.db_time_total.store(0, Ordering::Relaxed);
    }
}

impl Default for MetricsCollector {
    fn default() -> Self {
        Self::new()
    }
}

/// Snapshot of current metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsSnapshot {
    pub requests_total: u64,
    pub requests_active: u64,
    pub avg_response_time_ms: u64,
    pub db_queries_total: u64,
    pub avg_db_time_ms: u64,
}

lazy_static! {
    pub static ref METRICS: Arc<MetricsCollector> = Arc::new(MetricsCollector::new());
}

/// Helper to time a scope
#[macro_export]
macro_rules! time_scope {
    ($metrics:expr, $name:ident) => {
        let _guard = $name;
    };
}

/// RAII guard for timing operations
pub struct TimerGuard {
    start: Instant,
    collector: Arc<MetricsCollector>,
    is_db: bool,
}

impl TimerGuard {
    pub fn new(collector: Arc<MetricsCollector>) -> Self {
        collector.request_start();
        Self {
            start: Instant::now(),
            collector,
            is_db: false,
        }
    }

    pub fn for_db(collector: Arc<MetricsCollector>) -> Self {
        Self {
            start: Instant::now(),
            collector,
            is_db: true,
        }
    }
}

impl Drop for TimerGuard {
    fn drop(&mut self) {
        let duration = self.start.elapsed();
        if self.is_db {
            self.collector.db_query(duration);
        }
        self.collector.request_end(duration);
    }
}
