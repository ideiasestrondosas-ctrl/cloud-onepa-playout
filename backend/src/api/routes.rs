use actix_web::web;

use super::{auth, health, media, playlists, playout, schedule};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg
        // Health check
        .service(web::scope("/api/health").configure(health::configure))
        // Authentication
        .service(web::scope("/api/auth").configure(auth::configure))
        // Media management
        .service(web::scope("/api/media").configure(media::configure))
        // Playlists
        .service(web::scope("/api/playlists").configure(playlists::configure))
        // Schedule
        .service(web::scope("/api/schedule").configure(schedule::configure))
        // Playout control
        .service(web::scope("/api/playout").configure(playout::configure));
}
