use crate::models::user::User;
use crate::utils::jwt::{generate_token, Claims};
use actix_web::{web, HttpResponse, Responder};
use bcrypt::{hash, verify, DEFAULT_COST};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Serialize)]
pub struct UserInfo {
    pub id: String,
    pub username: String,
    pub role: String,
}

async fn login(credentials: web::Json<LoginRequest>, pool: web::Data<PgPool>) -> impl Responder {
    log::info!("Login attempt for username: {}", credentials.username);

    // Query user from database
    let user_result = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(&credentials.username)
        .fetch_optional(pool.get_ref())
        .await;

    match user_result {
        Ok(Some(user)) => {
            log::info!("User found: {}", user.username);
            log::debug!("Password hash from DB: {}", user.password_hash);
            log::debug!("Password provided: {}", credentials.password);

            // Verify password
            match verify(&credentials.password, &user.password_hash) {
                Ok(true) => {
                    log::info!("Password verified successfully for user: {}", user.username);
                    // Generate JWT token
                    let claims = Claims::new(
                        user.id.to_string(),
                        user.username.clone(),
                        user.role.clone(),
                    );

                    match generate_token(&claims) {
                        Ok(token) => HttpResponse::Ok().json(LoginResponse {
                            token,
                            user: UserInfo {
                                id: user.id.to_string(),
                                username: user.username,
                                role: user.role,
                            },
                        }),
                        Err(_) => HttpResponse::InternalServerError()
                            .json(serde_json::json!({"error": "Failed to generate token"})),
                    }
                }
                Ok(false) => {
                    log::warn!(
                        "Password verification failed (returned false) for user: {}",
                        user.username
                    );
                    HttpResponse::Unauthorized()
                        .json(serde_json::json!({"error": "Invalid credentials"}))
                }
                Err(e) => {
                    log::error!(
                        "Bcrypt verification error for user {}: {:?}",
                        user.username,
                        e
                    );
                    HttpResponse::Unauthorized()
                        .json(serde_json::json!({"error": "Invalid credentials"}))
                }
            }
        }
        Ok(None) => {
            log::warn!("User not found: {}", credentials.username);
            HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid credentials"}))
        }
        Err(e) => {
            log::error!("Database error during login: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

async fn logout() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Logged out successfully"
    }))
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub role: String,
}

async fn register(req: web::Json<RegisterRequest>, pool: web::Data<PgPool>) -> impl Responder {
    // Hash password
    let password_hash = match hash(&req.password, DEFAULT_COST) {
        Ok(hash) => hash,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to hash password"}))
        }
    };

    // Insert user into database
    let result = sqlx::query(
        "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
    )
    .bind(&req.username)
    .bind(&password_hash)
    .bind(&req.role)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Created()
            .json(serde_json::json!({"message": "User created successfully"})),
        Err(_) => {
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Username already exists"}))
        }
    }
}

#[derive(Deserialize)]
pub struct ChangePasswordRequest {
    pub password: String,
}

async fn change_password(
    path: web::Path<uuid::Uuid>,
    req: web::Json<ChangePasswordRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let user_id = path.into_inner();

    // Hash new password
    let password_hash = match hash(&req.password, DEFAULT_COST) {
        Ok(hash) => hash,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to hash password"}))
        }
    };

    let result = sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
        .bind(&password_hash)
        .bind(user_id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(result) => {
            if result.rows_affected() > 0 {
                HttpResponse::Ok()
                    .json(serde_json::json!({"message": "Password updated successfully"}))
            } else {
                HttpResponse::NotFound().json(serde_json::json!({"error": "User not found"}))
            }
        }
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

async fn list_users(pool: web::Data<PgPool>) -> impl Responder {
    let users = sqlx::query_as::<_, User>("SELECT * FROM users ORDER BY id")
        .fetch_all(pool.get_ref())
        .await;

    match users {
        Ok(users) => {
            let user_infos: Vec<UserInfo> = users
                .into_iter()
                .map(|u| UserInfo {
                    id: u.id.to_string(),
                    username: u.username,
                    role: u.role,
                })
                .collect();
            HttpResponse::Ok().json(user_infos)
        }
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to fetch users"})),
    }
}

async fn delete_user(path: web::Path<uuid::Uuid>, pool: web::Data<PgPool>) -> impl Responder {
    let user_id = path.into_inner();
    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(result) => {
            if result.rows_affected() > 0 {
                HttpResponse::Ok().json(serde_json::json!({"message": "User deleted successfully"}))
            } else {
                HttpResponse::NotFound().json(serde_json::json!({"error": "User not found"}))
            }
        }
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/login", web::post().to(login))
        .route("/logout", web::post().to(logout))
        .route("/register", web::post().to(register))
        .route("/users", web::get().to(list_users))
        .route("/users/{id}/password", web::put().to(change_password))
        .route("/users/{id}", web::delete().to(delete_user));
}
