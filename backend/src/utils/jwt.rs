use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,      // Subject (user id)
    pub username: String, // Username
    pub role: String,     // User role
    pub exp: i64,         // Expiration time
    pub iat: i64,         // Issued at
}

impl Claims {
    pub fn new(user_id: String, username: String, role: String) -> Self {
        let now = Utc::now();
        let expiration = env::var("JWT_EXPIRATION")
            .unwrap_or_else(|_| "86400".to_string())
            .parse::<i64>()
            .unwrap_or(86400);

        Claims {
            sub: user_id,
            username,
            role,
            iat: now.timestamp(),
            exp: (now + Duration::seconds(expiration)).timestamp(),
        }
    }
}

pub fn generate_token(claims: &Claims) -> Result<String, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set in production");
    let encoding_key = EncodingKey::from_secret(secret.as_bytes());

    encode(&Header::default(), claims, &encoding_key)
}

pub fn validate_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set in production");
    let decoding_key = DecodingKey::from_secret(secret.as_bytes());

    let token_data = decode::<Claims>(token, &decoding_key, &Validation::default())?;
    Ok(token_data.claims)
}
