use crate::utils::jwt;
use actix_web::{dev::ServiceRequest, web, Error, HttpMessage};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use sqlx::PgPool;

/// JWT validation middleware.
///
/// On every mutating request (POST / PUT / PATCH / DELETE), an audit log entry
/// is written asynchronously so it never blocks the main request path.
#[allow(dead_code)]
pub async fn validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> Result<ServiceRequest, (Error, ServiceRequest)> {
    let token = credentials.token();

    match jwt::validate_token(token) {
        Ok(claims) => {
            // Audit logging — fire-and-forget for mutating methods
            let method = req.method().to_string();
            if matches!(method.as_str(), "POST" | "PUT" | "PATCH" | "DELETE") {
                if let Some(pool) = req.app_data::<web::Data<PgPool>>() {
                    let pool = pool.clone();
                    let user_id = claims.sub.clone();
                    let path = req.path().to_string();
                    let ip = req
                        .connection_info()
                        .realip_remote_addr()
                        .unwrap_or("unknown")
                        .to_string();

                    tokio::spawn(async move {
                        let action = format!("{} {}", method, path);
                        // Extract resource name from path: /api/playlists → playlists
                        let resource = path
                            .trim_start_matches('/') // strip leading slash
                            .split('/')
                            .find(|s| !s.is_empty() && *s != "api" && *s != "v2")
                            .unwrap_or("unknown")
                            .to_string();

                        let _ = sqlx::query(
                            r#"INSERT INTO audit_logs
                               (user_id, action, resource, ip_address)
                               VALUES ($1::uuid, $2, $3, $4::inet)"#,
                        )
                        .bind(&user_id)
                        .bind(&action)
                        .bind(&resource)
                        .bind(&ip)
                        .execute(pool.get_ref())
                        .await;
                    });
                }
            }

            req.extensions_mut().insert(claims);
            Ok(req)
        }
        Err(_) => Err((actix_web::error::ErrorUnauthorized("Invalid token"), req)),
    }
}
