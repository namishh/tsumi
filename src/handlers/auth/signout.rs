use axum::extract::State;
use axum::Json;
use serde::Serialize;
use tower_cookies::{Cookie, Cookies};

use crate::state::AppState;
use crate::db::models::refresh_token::RefreshTokens;
use crate::errors::AuthError;
use crate::utils::get_db_conn;

#[derive(Debug, Serialize)]
pub struct SignOutResponse {
    pub message: String,
    pub signed_out_at: chrono::DateTime<chrono::Utc>,
}

pub async fn sign_out(
    State(state): State<AppState>,
    cookies: Cookies,
) -> Result<Json<SignOutResponse>, AuthError> {
    tracing::info!("Processing sign out request");

    let refresh_token = cookies
        .get("refresh_token")
        .ok_or_else(|| {
            tracing::debug!("No refresh token found in cookies");
            AuthError::unauthorized("No active session found")
        })?;

    let mut conn = get_db_conn(&state)
        .map_err(|e| {
            tracing::error!("Failed to get database connection during sign out: {}", e);
            AuthError::internal("Database connection failed")
        })?;

    let token_exists = RefreshTokens::token_exists(&mut conn, refresh_token.value())
        .map_err(|e| {
            tracing::error!("Failed to verify refresh token existence: {}", e);
            AuthError::database("Failed to verify session")
        })?;

    if !token_exists {
        tracing::warn!("Attempt to sign out with invalid refresh token");
        remove_refresh_token_cookie(&cookies);
        return Err(AuthError::unauthorized("Invalid or expired session"));
    }

    RefreshTokens::delete_by_token(&mut conn, refresh_token.value())
        .map_err(|e| {
            tracing::error!("Failed to delete refresh token during sign out: {}", e);
            AuthError::database("Failed to invalidate session")
        })?;

    remove_refresh_token_cookie(&cookies);

    tracing::info!("User successfully signed out");

    Ok(Json(SignOutResponse {
        message: "Successfully signed out".to_string(),
        signed_out_at: chrono::Utc::now(),
    }))
}

fn remove_refresh_token_cookie(cookies: &Cookies) {
    let mut cookie = Cookie::new("refresh_token", "");
    cookie.set_path("/");
    cookie.set_http_only(true);
    cookie.set_secure(true);
    cookie.set_same_site(tower_cookies::cookie::SameSite::Strict);
    cookie.set_max_age(time::Duration::seconds(0));

    cookies.add(cookie);
}