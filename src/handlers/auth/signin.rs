use axum::extract::State;
use axum::Json;
use bcrypt::verify;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use time::Duration;
use tower_cookies::{Cookie, Cookies};
use validator::Validate;
use crate::config::config;
use crate::db::models::refresh_token::{NewRefreshToken, RefreshTokens};
use crate::db::models::user_model::UserModel;
use crate::db::schema::{refresh_tokens, users};
use crate::errors::AuthError;
use crate::handlers::auth::SignInRequest;
use crate::services::jwt::{create_access_token, create_refresh_token};
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct SignInResponse {
    pub user: UserModel,
    pub message: String,
    pub signed_in_at: chrono::DateTime<chrono::Utc>,
}

pub async fn sign_in(
    State(state): State<AppState>,
    cookies: Cookies,
    Json(payload): Json<SignInRequest>,
) -> Result<Json<SignInResponse>, AuthError> {
    tracing::info!("Processing sign in request for email: {}", payload.email);

    let config = config().await;

    payload.validate()
        .map_err(|err| AuthError::validation(format!("Invalid sign in data: {}", err)))?;

    let mut conn = state.db_pool.get()
        .map_err(|e| {
            tracing::error!("Failed to get database connection: {}", e);
            AuthError::internal("Database connection failed")
        })?;

    let user = users::table
        .filter(users::email.eq(&payload.email))
        .select(UserModel::as_select())
        .first(&mut conn)
        .optional()
        .map_err(|e| {
            tracing::error!("Database query failed while finding user: {}", e);
            AuthError::database("Failed to verify user credentials")
        })?
        .ok_or_else(|| {
            tracing::info!("Sign in attempt with non-existent email: {}", payload.email);
            AuthError::unauthorized("Invalid email or password")
        })?;

    let password_valid = verify(&payload.password, &user.password)
        .map_err(|e| {
            tracing::error!("Password verification failed: {}", e);
            AuthError::internal("Authentication processing failed")
        })?;

    if !password_valid {
        tracing::info!("Invalid password attempt for user: {}", user.id);
        return Err(AuthError::unauthorized("Invalid email or password"));
    }

    if !user.email_verified {
        tracing::info!("Sign in attempt with unverified email: {}", user.email);
        return Err(AuthError::unauthorized("Please verify your email address before signing in"));
    }

    cleanup_existing_tokens(&mut conn, &cookies, &user.id).await?;

    let new_access_token = create_access_token(&user.id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create access token for user {}: {}", user.id, e);
            AuthError::internal("Failed to generate authentication tokens")
        })?;

    let new_refresh_token = create_refresh_token(&user.id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create refresh token for user {}: {}", user.id, e);
            AuthError::internal("Failed to generate authentication tokens")
        })?;

    let new_refresh_token_record = NewRefreshToken {
        id: uuid::Uuid::new_v4().to_string(),
        token: new_refresh_token.clone(),
        user_id: user.id.clone(),
        expires_at: chrono::Utc::now().naive_utc() + chrono::Duration::days(config.refresh_token_expires_at
        ()),
        created_at: chrono::Utc::now().naive_utc(),
    };

    diesel::insert_into(refresh_tokens::table)
        .values(&new_refresh_token_record)
        .execute(&mut conn)
        .map_err(|e| {
            tracing::error!("Failed to store refresh token for user {}: {}", user.id, e);
            AuthError::database("Failed to create user session")
        })?;

    set_auth_cookies(&cookies, &new_access_token, &new_refresh_token, &config);

    tracing::info!("User {} successfully signed in", user.id);

    Ok(Json(SignInResponse {
        user: UserModel::from(user),
        message: "Successfully signed in".to_string(),
        signed_in_at: chrono::Utc::now(),
    }))
}

async fn cleanup_existing_tokens(
    conn: &mut SqliteConnection,
    cookies: &Cookies,
    user_id: &str,
) -> Result<(), AuthError> {
    if let Some(cookie_refresh_token) = cookies.get("refresh_token") {
        let token_value = cookie_refresh_token.value();

        let existing_token = refresh_tokens::table
            .filter(refresh_tokens::token.eq(token_value))
            .select(RefreshTokens::as_select())
            .first(conn)
            .optional()
            .map_err(|e| {
                tracing::error!("Failed to query existing refresh token: {}", e);
                AuthError::database("Failed to verify existing session")
            })?;

        if let Some(token) = existing_token {
            if token.user_id != user_id {
                tracing::warn!("Token mismatch detected, cleaning up tokens for user: {}", user_id);
                diesel::delete(refresh_tokens::table.filter(refresh_tokens::user_id.eq(user_id)))
                    .execute(conn)
                    .map_err(|e| {
                        tracing::error!("Failed to delete user tokens: {}", e);
                        AuthError::database("Failed to clean up user sessions")
                    })?;
            } else {
                diesel::delete(refresh_tokens::table.filter(refresh_tokens::token.eq(token_value)))
                    .execute(conn)
                    .map_err(|e| {
                        tracing::error!("Failed to delete existing refresh token: {}", e);
                        AuthError::database("Failed to update user session")
                    })?;
            }
        }
    }

    Ok(())
}

fn set_auth_cookies(
    cookies: &Cookies,
    access_token: &str,
    refresh_token: &str,
    config: &crate::config::Config,
) {
    // Access token cookie
    let access_cookie = Cookie::build(("access_token", access_token))
        .path("/")
        .secure(true) // Only secure in production
        .http_only(true)
        .same_site(tower_cookies::cookie::SameSite::Strict)
        .max_age(Duration::minutes(config.access_token_expires_at()))
        .build()
        .into_owned();

    // Refresh token cookie
    let refresh_cookie = Cookie::build(("refresh_token", refresh_token))
        .path("/")
        .secure(true)
        .http_only(true)
        .same_site(tower_cookies::cookie::SameSite::Strict)
        .max_age(Duration::days(config.refresh_token_expires_at()))
        .build()
        .into_owned();

    cookies.remove(Cookie::from("access_token"));
    cookies.remove(Cookie::from("refresh_token"));

    cookies.add(access_cookie);
    cookies.add(refresh_cookie);
}