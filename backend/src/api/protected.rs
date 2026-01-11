use actix_files::NamedFile;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Serialize)]
pub struct ProtectedAsset {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub is_video: bool,
}

async fn list_protected_assets() -> impl Responder {
    let protected_dir = "/var/lib/onepa-playout/assets/protected";
    let mut assets = Vec::new();

    if let Ok(entries) = fs::read_dir(protected_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.file_name().and_then(|n| n.to_str()) != Some("README.md") {
                let name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();
                let metadata = entry.metadata().ok();
                let extension = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                let is_video = ["mp4", "mkv", "mov", "avi"].contains(&extension.as_str());

                // Return the WEB path, not the filesystem path, so the frontend can preview it
                // Actually, the selector needs the web path for preview, but maybe mapping for backend?
                // The current implementation returns filesystem path.
                // Let's standardise on returning the web path for the 'path' field to be consistent with Settings.
                // Or we can keep it as is, but Settings toggle uses hardcoded web path.
                // Users might want to select ANY file.
                // Let's return the local filesystem path for now, but note that web usage needs /assets/ prefix.
                // Wait! Settings.jsx setDefaultMedia uses the path from here.
                // If this returns /var/lib/..., Settings saves /var/lib/...
                // Then Layout tries to load src="/var/lib/..." -> 404.
                // WE MUST RETURN THE WEB PATH.

                assets.push(ProtectedAsset {
                    name: name.clone(),
                    path: format!("/assets/protected/{}", name),
                    size: metadata.map(|m| m.len()).unwrap_or(0),
                    is_video,
                });
            }
        }
    }

    HttpResponse::Ok().json(assets)
}

async fn get_protected_asset(filename: web::Path<String>, req: HttpRequest) -> impl Responder {
    let path_str = format!("/var/lib/onepa-playout/assets/protected/{}", filename);
    let path = Path::new(&path_str);

    if !path.exists() {
        return HttpResponse::NotFound().json(serde_json::json!({"error": "File not found"}));
    }

    match NamedFile::open_async(path).await {
        Ok(named_file) => named_file.into_response(&req),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to open file"})),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_protected_assets))
        .route("/{filename}", web::get().to(get_protected_asset));
}
