use actix_cors::Cors;
use actix_web::{dev::Service, middleware, web, App, HttpServer};
use dotenv::dotenv;
use futures::future::FutureExt;
use sqlx::postgres::PgPoolOptions;
use std::env;

mod api;
mod config;
mod models;
mod services;
mod utils;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();
    env_logger::init();

    // Database connection
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    log::info!("Database connected successfully");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    log::info!("Migrations completed");

    // Ensure default assets are correctly paths and processed
    if let Err(e) = services::startup::ensure_default_assets(&pool).await {
        log::error!("❌ Startup check failed: {}", e);
    }

    // Server configuration
    let host = env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = env::var("SERVER_PORT").unwrap_or_else(|_| "8181".to_string());
    let bind_address = format!("{}:{}", host, port);

    // Ensure HLS directory exists
    let hls_path =
        env::var("HLS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/hls".to_string());
    std::fs::create_dir_all(&hls_path).expect("Failed to create HLS directory");

    // Ensure Assets directory exists
    let assets_path =
        env::var("ASSETS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());
    std::fs::create_dir_all(&assets_path).ok(); // Optional

    log::info!("Starting server at {}", bind_address);

    // Initial configuration for services
    services::auth::configure();
    services::database::configure();

    // Start Playout Engine
    let engine = std::sync::Arc::new(services::engine::PlayoutEngine::new(pool.clone()));
    let engine_clone = engine.clone();
    tokio::spawn(async move {
        engine_clone.start().await;
    });

    // Start HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        let hls_serve_path =
            env::var("HLS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/hls".to_string());
        let assets_serve_path =
            env::var("ASSETS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(engine.clone()))
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .wrap_fn(|req, srv| {
                let engine = req
                    .app_data::<web::Data<std::sync::Arc<services::engine::PlayoutEngine>>>()
                    .cloned();
                let path = req.path().to_string();
                let query = req.query_string().to_string();

                // Robust Client IP Detection (X-Forwarded-For > X-Real-IP > PeerAddr)
                let client_ip = req
                    .headers()
                    .get("x-forwarded-for")
                    .and_then(|v| v.to_str().ok())
                    .and_then(|s| s.split(',').next())
                    .and_then(|s| s.trim().parse::<std::net::IpAddr>().ok())
                    .or_else(|| {
                        req.headers()
                            .get("x-real-ip")
                            .and_then(|v| v.to_str().ok())
                            .and_then(|s| s.parse::<std::net::IpAddr>().ok())
                    })
                    .or_else(|| req.peer_addr().map(|a| a.ip()));

                if let (Some(eng_ref), Some(ip)) = (engine.clone(), client_ip) {
                    if path.starts_with("/hls/")
                        && (path.ends_with(".m3u8") || path.ends_with(".ts"))
                    {
                        let is_preview_query = query.contains("preview=true");
                        let user_agent = req
                            .headers()
                            .get("user-agent")
                            .and_then(|h| h.to_str().ok())
                            .unwrap_or("")
                            .to_lowercase();
                        let referer = req
                            .headers()
                            .get("referer")
                            .and_then(|h| h.to_str().ok())
                            .unwrap_or("")
                            .to_string();

                        // Dashboard heuristic: has ?preview=true OR has dashboard referer
                        let is_dashboard = is_preview_query || referer.contains(":3010");

                        let hls_sid = req.cookie("hls_sid").map(|c| c.value().to_string());
                        let path_clone = path.clone();
                        tokio::spawn(async move {
                            if is_dashboard {
                                log::debug!("[HLS-SESSION] Dashboard Activity from: {}", ip);
                                let mut p_ips = eng_ref.preview_ips.lock().await;
                                p_ips.insert(ip, std::time::Instant::now());
                            } else {
                                // Check if this IP is a recent previewer
                                let is_previewer = {
                                    let mut p_ips = eng_ref.preview_ips.lock().await;
                                    p_ips.retain(|_, v| {
                                        v.elapsed() < std::time::Duration::from_secs(60)
                                    });
                                    p_ips.contains_key(&ip)
                                };

                                let is_vlc = user_agent.contains("vlc");
                                let no_referer = referer.is_empty();

                                if !is_previewer || is_vlc || no_referer {
                                    // Robust Session ID: Use Cookie if present, fallback to IP+UA
                                    let sid =
                                        hls_sid.unwrap_or_else(|| format!("{}-{}", ip, user_agent));

                                    log::info!(
                                        "[HLS-SESSION] Viewer: {} (SID: {}) for {}",
                                        ip,
                                        sid,
                                        path_clone
                                    );
                                    let mut sessions = eng_ref.hls_sessions.lock().await;
                                    sessions.insert(sid, std::time::Instant::now());
                                }
                            }
                        });
                    }
                }

                let fut = srv.call(req);
                async move {
                    let mut res = fut.await?;

                    // If no session cookie, set one for HLS viewers (manifest only for efficiency)
                    if path.starts_with("/hls/")
                        && path.ends_with(".m3u8")
                        && res.request().cookie("hls_sid").is_none()
                    {
                        let sid = uuid::Uuid::new_v4().to_string();
                        let cookie = actix_web::cookie::Cookie::build("hls_sid", sid)
                            .path("/hls")
                            .max_age(actix_web::cookie::time::Duration::minutes(30))
                            .finish();
                        res.response_mut().add_cookie(&cookie).ok();
                    }

                    Ok(res)
                }
                .boxed_local()
            })
            .configure(api::routes::configure)
            .service(actix_files::Files::new("/hls", &hls_serve_path).show_files_listing())
            .service(actix_files::Files::new("/assets", &assets_serve_path).show_files_listing())
    })
    .bind(&bind_address)?
    .run()
    .await
}
