use crate::models::user::{User, Profile};
use crate::utils::jwt::{generate_token, Claims};
use actix_web::{web, HttpResponse, Responder};
use bcrypt::{hash, verify, DEFAULT_COST};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};
use uuid::Uuid;

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
    pub profile_id: Option<i32>,
    pub profile_name: Option<String>,
    pub permissions: Vec<String>,
}

#[derive(Deserialize)]
pub struct CreateProfileRequest {
    pub name: String,
    pub permissions: Vec<String>,
}

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub permissions: Vec<String>,
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
                        Ok(token) => {
                            // Fetch profile permissions if profile_id exists
                            let mut permissions = user.permissions.clone().unwrap_or_default();
                            let mut profile_name = None;
                            
                            if let Some(pid) = user.profile_id {
                                if let Ok(Some(profile)) = sqlx::query_as::<_, Profile>("SELECT * FROM profiles WHERE id = $1")
                                    .bind(pid)
                                    .fetch_optional(pool.get_ref())
                                    .await 
                                {
                                    if permissions.is_empty() {
                                        permissions = profile.permissions;
                                    }
                                    profile_name = Some(profile.name);
                                }
                            }

                            HttpResponse::Ok().json(LoginResponse {
                                token,
                                user: UserInfo {
                                    id: user.id.to_string(),
                                    username: user.username,
                                    role: user.role,
                                    profile_id: user.profile_id,
                                    profile_name,
                                    permissions,
                                },
                            })
                        },
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
    pub permissions: Option<Vec<String>>,
    pub profile_id: Option<i32>,
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
        "INSERT INTO users (username, password_hash, role, permissions, profile_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    )
    .bind(&req.username)
    .bind(&password_hash)
    .bind(&req.role)
    .bind(req.permissions.as_ref().unwrap_or(&vec![]))
    .bind(req.profile_id)
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
    // Perform a manual join conceptually by fetching both or using a join query.
    // For simplicity, let's fetch users and then enrich with profile info or use a JOIN query.
    #[derive(FromRow)]
    struct UserWithProfileName {
        id: Uuid,
        username: String,
        role: String,
        permissions: Option<Vec<String>>,
        profile_id: Option<i32>,
        profile_name: Option<String>,
        profile_permissions: Option<Vec<String>>,
    }

    let query = r#"
        SELECT u.id, u.username, u.role, u.permissions, u.profile_id, p.name as profile_name, p.permissions as profile_permissions
        FROM users u
        LEFT JOIN profiles p ON u.profile_id = p.id
        ORDER BY u.id
    "#;

    let users_result = sqlx::query_as::<_, UserWithProfileName>(query)
        .fetch_all(pool.get_ref())
        .await;

    match users_result {
        Ok(users) => {
            let user_infos: Vec<UserInfo> = users
                .into_iter()
                .map(|u| {
                    let effective_permissions = if let Some(up) = u.permissions {
                        if up.is_empty() { u.profile_permissions.unwrap_or_default() } else { up }
                    } else {
                        u.profile_permissions.unwrap_or_default()
                    };

                    UserInfo {
                        id: u.id.to_string(),
                        username: u.username,
                        role: u.role, // Legacy role, or maybe u.profile_name?
                        profile_id: u.profile_id,
                        profile_name: u.profile_name,
                        permissions: effective_permissions,
                    }
                })
                .collect();
            HttpResponse::Ok().json(user_infos)
        }
        Err(e) => {
            log::error!("Failed to fetch users linked: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to fetch users"}))
        },
    }
}

// PROFILE CRUD HANDLERS

async fn list_profiles(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Profile>("SELECT * FROM profiles ORDER BY id")
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(profiles) => HttpResponse::Ok().json(profiles),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to fetch profiles"})),
    }
}

async fn create_profile(req: web::Json<CreateProfileRequest>, pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Profile>(
        "INSERT INTO profiles (name, permissions) VALUES ($1, $2) RETURNING *"
    )
    .bind(&req.name)
    .bind(&req.permissions)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(profile) => HttpResponse::Created().json(profile),
        Err(_) => HttpResponse::BadRequest().json(serde_json::json!({"error": "Profile name already exists"})),
    }
}

async fn update_profile(path: web::Path<i32>, req: web::Json<UpdateProfileRequest>, pool: web::Data<PgPool>) -> impl Responder {
    let profile_id = path.into_inner();
    
    // Check if system profile
    // Use query_as instead of query! macro to avoid compile-time DB check failure
    #[derive(FromRow)]
    struct SystemCheck {
        is_system: bool,
    }

    let check = sqlx::query_as::<_, SystemCheck>("SELECT is_system FROM profiles WHERE id = $1")
        .bind(profile_id)
        .fetch_optional(pool.get_ref())
        .await;

    if let Ok(Some(rec)) = check {
        if rec.is_system {
             // System profiles (Administrator) can potentially be edited for permissions, but maybe restricted?
             // User said: "must always have the administrator profile as default and must not be deleted."
             // "give the possibility to edit... those profiles". Assuming editing permissions is OK.
             // But let's prevent renaming safely implicitly (update doesn't touch name).
        }
    } else {
        return HttpResponse::NotFound().json(serde_json::json!({"error": "Profile not found"}));
    }

    let result = sqlx::query_as::<_, Profile>(
        "UPDATE profiles SET permissions = $1 WHERE id = $2 RETURNING *"
    )
    .bind(&req.permissions)
    .bind(profile_id)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(profile) => HttpResponse::Ok().json(profile),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to update profile"})),
    }
}

async fn delete_profile(path: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder {
    let profile_id = path.into_inner();

    // Check if system
    #[derive(FromRow)]
    struct SystemCheck {
        is_system: bool,
    }

    let check = sqlx::query_as::<_, SystemCheck>("SELECT is_system FROM profiles WHERE id = $1")
        .bind(profile_id)
        .fetch_optional(pool.get_ref())
        .await;

    match check {
        Ok(Some(rec)) => {
            if rec.is_system {
                return HttpResponse::BadRequest().json(serde_json::json!({"error": "Cannot delete system profile"}));
            }
        },
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Profile not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"})),
    }

    // Check usage
    // count(*) returns i64
    let usage = sqlx::query_as::<_, (i64,)>("SELECT count(*) FROM users WHERE profile_id = $1")
        .bind(profile_id)
        .fetch_one(pool.get_ref())
        .await;
    
    if let Ok(u) = usage {
        if u.0 > 0 {
            return HttpResponse::BadRequest().json(serde_json::json!({"error": "Cannot delete profile assigned to users"}));
        }
    }

    let result = sqlx::query("DELETE FROM profiles WHERE id = $1")
        .bind(profile_id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Profile deleted"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to delete profile"})),
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
        .route("/users/{id}", web::delete().to(delete_user))
        .route("/profiles", web::get().to(list_profiles))
        .route("/profiles", web::post().to(create_profile))
        .route("/profiles/{id}", web::put().to(update_profile))
        .route("/profiles/{id}", web::delete().to(delete_profile));
}
