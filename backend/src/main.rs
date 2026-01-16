use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpServer};
use dotenv::dotenv;
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
    let port = env::var("SERVER_PORT").unwrap_or_else(|_| "8081".to_string());
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

        // Use local vars for closures
        let hls_serve_path =
            env::var("HLS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/hls".to_string());
        let assets_serve_path =
            env::var("ASSETS_PATH").unwrap_or_else(|_| "/var/lib/onepa-playout/assets".to_string());

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(engine.clone()))
            .wrap(cors)
            .wrap(middleware::Logger::default())
            //.wrap(middleware::DefaultHeaders::new().add(("Access-Control-Allow-Origin", "*"))) // Removed to avoid duplicate headers with Cors middleware
            .configure(api::routes::configure)
            .service(actix_files::Files::new("/hls", &hls_serve_path).show_files_listing())
            .service(actix_files::Files::new("/assets", &assets_serve_path).show_files_listing())
    })
    .bind(&bind_address)?
    .run()
    .await
}
