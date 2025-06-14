use std::error::Error;
use axum::extract::{Query, State};
use axum::response::Redirect;
use http::header;
use reqwest::Client;
use serde::Deserialize;
use tower_cookies::{Cookie, Cookies};
use tower_cookies::cookie::SameSite;
use crate::state::AppState;
use crate::utils::{create_jwt};
use std::fmt;
use time::Duration;

// todo: prevent csrf attacks
// todo: add persistent logins
#[derive(Deserialize)]
pub struct GithubCallback {
    code: String,
}

#[derive(Deserialize)]
struct GithubToken {
    access_token: String,
}

#[derive(Deserialize)]
struct GithubUser {
    login: String,
}

#[derive(Debug)]
pub enum GithubOAuthError {
    NetworkError(reqwest::Error),
    GitHubError(String),
    JsonParseError(String),
    InvalidResponse(String),
    JwtCreationError(String),
    ConfigError(String),
    CsrfError,
    SessionError(String),
}

impl fmt::Display for GithubOAuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            GithubOAuthError::NetworkError(err) => write!(f, "Network error: {}", err),
            GithubOAuthError::GitHubError(err) => write!(f, "GitHub API error: {}", err),
            GithubOAuthError::JsonParseError(err) => write!(f, "JSON parse error: {}", err),
            GithubOAuthError::InvalidResponse(err) => write!(f, "Invalid response: {}", err),
            GithubOAuthError::JwtCreationError(err) => write!(f, "JWT creation failed: {}", err),
            GithubOAuthError::ConfigError(err) => write!(f, "Configuration error: {}", err),
            GithubOAuthError::CsrfError => write!(f, "CSRF validation failed"),
            GithubOAuthError::SessionError(err) => write!(f, "Session error: {}", err),
        }
    }
}

impl Error for GithubOAuthError {}

pub async fn github_oauth_start(State(state): State<AppState>) -> Redirect {
    let client_id = state.config.github_auth_client_id();
    Redirect::to(&format!("https://github\
    .com/login/oauth/authorize?client_id={}&scope=read:user", client_id))
}

pub async fn github_oauth_callback(State(state):State<AppState>, params: Query<GithubCallback>,
                                   cookies:
Cookies) ->
                                                                                        Redirect {
    handle_github_oauth(params, cookies, &state).await.unwrap_or_else(|e| {
        tracing::error!("OAuth error: {}", e);
        Redirect::to("/login?error=oauth_failed")
    })
}
async fn handle_github_oauth(params: Query<GithubCallback>, cookies: Cookies, state: &AppState
) ->
                                                                               Result<Redirect, GithubOAuthError> {
    let client = Client::new();

    tracing::info!("Processing github oauth callback, {}", params.code);

    let token = exchange_code_for_token(&client, &params.code, &state).await?;
    let user = get_github_user(&client, &token.access_token).await?;
    let jwt = create_jwt(&user.login, &state).await.map_err(|e|
        GithubOAuthError::JwtCreationError(e.to_string()))?;

    let cookie = Cookie::build(("auth_token", jwt))
        .http_only(true)
        .path("/")
        .secure(true)
        .same_site(SameSite::Strict)
        .max_age(Duration::hours(8))
        .build();

    cookies.add(cookie);

    tracing::info!("Successfully processed github oauth callback");
    Ok(Redirect::to("/"))
}

async fn get_github_user(client: &Client, access_token: &str) -> Result<GithubUser, GithubOAuthError> {
    let response = client
        .get("https://api.github.com/user")
        .header(header::ACCEPT, "application/json")
        .header(header::USER_AGENT, "tsumi/1.0")
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
        .map_err(GithubOAuthError::NetworkError)?;

    let status = response.status();
    if !response.status().is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());

        return Err(GithubOAuthError::InvalidResponse(format!(
            "User API failed with status {}: {}",
            status,
            error_text
        )));
    }

    let user = response
        .json::<GithubUser>()
        .await
        .map_err(|e| GithubOAuthError::JsonParseError(format!("Failed to parse GitHub user response: {}", e)))?;


    Ok(user)
}

async fn exchange_code_for_token(client: &Client, code: &str, state: &AppState) ->
                                                                                 Result<GithubToken, GithubOAuthError> {

    let response = client
        .post("https://github.com/login/oauth/access_token")
        .header(header::ACCEPT, "application/json")
        .header(header::USER_AGENT, "tsumi/1.0")
        .json(&serde_json::json!({
            "code": code,
            "client_id": state.config.github_auth_client_id(),
            "client_secret": state.config.github_auth_client_secret(),
        })).send().await.map_err(GithubOAuthError::NetworkError)?;

    if !response.status().is_success() {
        return Err(GithubOAuthError::InvalidResponse(format!(
            "Token exchange failed with status: {}",
            response.status()
        )));
    }

    let response_text = response.text().await.map_err(GithubOAuthError::NetworkError)?;
    match serde_json::from_str(&response_text) {
        Ok(token) => Ok(token),
        Err(_) => {
            match serde_json::from_str(&response_text) {
                Ok(error) => Err(GithubOAuthError::GitHubError(error)),
                Err(json_err) => Err(GithubOAuthError::JsonParseError(json_err.to_string())),
            }
        }
    }
}