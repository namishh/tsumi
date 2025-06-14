use axum::extract::State;
use axum::Json;
use serde::Serialize;
use time::Duration;
use tower_cookies::{Cookie, Cookies};

use crate::state::AppState;
use crate::db::models::refresh_token::RefreshTokens;
use crate::errors::AuthError;
use crate::services::jwt::{create_access_token, create_refresh_token, decode_refresh_token};
use crate::utils::get_db_conn;

#[derive(Debug, Serialize)]
pub struct RefreshResponse {
    pub access_token: String,
    pub message: String,
    pub refreshed_at: chrono::DateTime<chrono::Utc>,
}

pub async fn refresh(
    State(state): State<AppState>,
    cookies: Cookies,
) -> Result<Json<RefreshResponse>, AuthError> {
    tracing::info!("Processing token refresh request");

    let refresh_token_cookie = cookies
        .get("refresh_token")
        .ok_or_else(|| {
            tracing::debug!("No refresh token found in cookies");
            AuthError::unauthorized("No refresh token provided")
        })?;

    let refresh_token_value = refresh_token_cookie.value();

    let decoded_token = decode_refresh_token(refresh_token_value)
        .await
        .map_err(|e| {
            tracing::warn!("Failed to decode refresh token: {}", e);
            AuthError::unauthorized("Invalid or malformed refresh token")
        })?;

    let user_id = &decoded_token.claims.user_id;
    tracing::debug!("Processing token refresh for user: {}", user_id);

    let mut conn = get_db_conn(&state)
        .map_err(|e| {
            tracing::error!("Failed to get database connection during token refresh: {}", e);
            AuthError::internal("Database connection failed")
        })?;

    let token_record = RefreshTokens::by_token(&mut conn, refresh_token_value)
        .map_err(|e| {
            tracing::warn!("Refresh token not found in database: {}", e);
            AuthError::unauthorized("Invalid refresh token")
        })?;

    if token_record.user_id != *user_id {
        tracing::error!("Token user ID mismatch. Token user: {}, Decoded user: {}",
                       token_record.user_id, user_id);
        // Clean up the invalid token
        let _ = RefreshTokens::delete_by_token(&mut conn, refresh_token_value);
        return Err(AuthError::unauthorized("Token validation failed"));
    }

    let is_expired = RefreshTokens::is_expired(&mut conn, &token_record.token)
        .map_err(|e| {
            tracing::error!("Failed to check token expiration: {}", e);
            AuthError::database("Failed to validate token expiration")
        })?;

    if is_expired {
        tracing::info!("Expired refresh token used for user: {}", user_id);
        let _ = RefreshTokens::delete_by_token(&mut conn, refresh_token_value);
        return Err(AuthError::unauthorized("Refresh token has expired"));
    }

    RefreshTokens::delete_by_token(&mut conn, refresh_token_value)
        .map_err(|e| {
            tracing::error!("Failed to delete old refresh token: {}", e);
            AuthError::database("Failed to invalidate old token")
        })?;

    let new_access_token = create_access_token(user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create new access token for user {}: {}", user_id, e);
            AuthError::internal("Failed to generate new access token")
        })?;

    let new_refresh_token = create_refresh_token(user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create new refresh token for user {}: {}", user_id, e);
            AuthError::internal("Failed to generate new refresh token")
        })?;

    RefreshTokens::create(
        &mut conn,
        &new_refresh_token,
        user_id,
        state.config.refresh_token_expires_at(),
    )
        .map_err(|e| {
            tracing::error!("Failed to store new refresh token for user {}: {}", user_id, e);
            AuthError::database("Failed to store new refresh token")
        })?;

    set_refresh_token_cookie(&cookies, &new_refresh_token, &state);

    tracing::info!("Successfully refreshed tokens for user: {}", user_id);

    Ok(Json(RefreshResponse {
        access_token: new_access_token,
        message: "Tokens refreshed successfully".to_string(),
        refreshed_at: chrono::Utc::now(),
    }))
}

fn set_refresh_token_cookie(cookies: &Cookies, refresh_token: &str, state: &AppState) {
    let remove_cookie = Cookie::build(("refresh_token", ""))
        .http_only(true)
        .path("/")
        .secure(true)
        .same_site(tower_cookies::cookie::SameSite::Strict)
        .max_age(Duration::seconds(0)) // Expire immediately
        .build()
        .into_owned();

    cookies.add(remove_cookie);

    let refresh_cookie = Cookie::build(("refresh_token", refresh_token))
        .http_only(true)
        .path("/")
        .secure(true) // Only secure in production
        .same_site(tower_cookies::cookie::SameSite::Strict)
        .max_age(Duration::days(state.config.refresh_token_expires_at()))
        .build()
        .into_owned();

    cookies.add(refresh_cookie);
}