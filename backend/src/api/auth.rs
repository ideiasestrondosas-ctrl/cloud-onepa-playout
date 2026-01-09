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
    // Query user from database
    let user_result = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(&credentials.username)
        .fetch_optional(pool.get_ref())
        .await;

    match user_result {
        Ok(Some(user)) => {
            // Verify password
            match verify(&credentials.password, &user.password_hash) {
                Ok(true) => {
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
                _ => HttpResponse::Unauthorized()
                    .json(serde_json::json!({"error": "Invalid credentials"})),
            }
        }
        Ok(None) => {
            HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid credentials"}))
        }
        Err(_) => {
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

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/login", web::post().to(login))
        .route("/logout", web::post().to(logout))
        .route("/register", web::post().to(register));
}
