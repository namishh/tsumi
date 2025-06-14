use chrono::Duration;
use jsonwebtoken::{encode, decode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use crate::config::config;
use crate::errors::AuthError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub exp: usize,
    pub iat: usize,
    pub user_id: String,
}

pub async fn create_access_token(user_id: &str) -> Result<String, AuthError> {
    let config = config().await;
    let secret = config.access_token_secret();
    let now = chrono::Utc::now();
    let expire = Duration::hours(config.access_token_expires_at());
    let exp = (now + expire).timestamp() as usize;
    let iat = now.timestamp() as usize;

    let claim = Claims {
        iat,
        exp,
        user_id: user_id.to_string(),
    };

    encode(&Header::default(), &claim, &EncodingKey::from_secret(secret.as_ref()))
        .map_err(|e| AuthError::internal(format!("Failed to create access token: {}", e)))
}

pub async fn create_refresh_token(user_id: &str) -> Result<String, AuthError> {
    let config = config().await;
    let secret = config.refresh_token_secret();
    let now = chrono::Utc::now();
    let expire = Duration::hours(config.refresh_token_expires_at());
    let exp = (now + expire).timestamp() as usize;
    let iat = now.timestamp() as usize;

    let claim = Claims {
        iat,
        exp,
        user_id: user_id.to_string(),
    };

    encode(&Header::default(), &claim, &EncodingKey::from_secret(secret.as_ref()))
        .map_err(|e| AuthError::internal(format!("Failed to create refresh token: {}", e)))
}

pub async fn decode_access_token(access_token: &str) -> Result<TokenData<Claims>, AuthError> {
    let config = config().await;
    let secret = config.access_token_secret();

    let validation = Validation::default();

    decode::<Claims>(
        access_token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    )
        .map_err(|e| {
            match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                    AuthError::unauthorized("Access token has expired")
                }
                jsonwebtoken::errors::ErrorKind::InvalidToken => {
                    AuthError::unauthorized("Invalid access token")
                }
                jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                    AuthError::unauthorized("Invalid token signature")
                }
                _ => AuthError::internal(format!("Failed to decode access token: {}", e))
            }
        })
}

pub async fn decode_refresh_token(refresh_token: &str) -> Result<TokenData<Claims>, AuthError> {
    let config = config().await;
    let secret = config.refresh_token_secret();

    let validation = Validation::default();
    decode::<Claims>(
        refresh_token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    )
        .map_err(|e| {
            match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                    AuthError::unauthorized("Refresh token has expired")
                }
                jsonwebtoken::errors::ErrorKind::InvalidToken => {
                    AuthError::unauthorized("Invalid refresh token")
                }
                jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                    AuthError::unauthorized("Invalid token signature")
                }
                _ => AuthError::internal(format!("Failed to decode refresh token: {}", e))
            }
        })
}

pub fn extract_user_id_from_claims(claims: &Claims) -> &str {
    &claims.user_id
}

pub fn is_token_close_to_expiry(claims: &Claims, threshold_minutes: i64) -> bool {
    let now = chrono::Utc::now().timestamp() as usize;
    let threshold_seconds = (threshold_minutes * 60) as usize;

    claims.exp.saturating_sub(now) <= threshold_seconds
}