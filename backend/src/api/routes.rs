use actix_web::web;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .service(web::scope("/auth").configure(crate::api::auth::configure))
            .service(web::scope("/health").configure(crate::api::health::configure))
            .service(web::scope("/media").configure(crate::api::media::configure))
            .service(web::scope("/playlists").configure(crate::api::playlists::configure))
            .service(web::scope("/playout").configure(crate::api::playout::configure))
            .service(web::scope("/schedule").configure(crate::api::schedule::configure))
            .service(web::scope("/settings").configure(crate::api::settings::configure))
            .service(web::scope("/templates").configure(crate::api::templates::configure))
            .service(web::scope("/protected").configure(crate::api::protected::configure)),
    );
}
