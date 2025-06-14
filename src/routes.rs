use axum::http::StatusCode;
use axum::response::{Html, IntoResponse};
use axum::{Router};
use axum::extract::State;
use axum::routing::{get, post};
use tera::Context;
use tower_cookies::CookieManagerLayer;
use crate::handlers::auth::github::{github_oauth_callback, github_oauth_start};
use crate::handlers::auth::refresh::refresh;
use crate::handlers::auth::signin::sign_in;
use crate::handlers::auth::signout::sign_out;
use crate::handlers::auth::signup::sign_up;
use crate::state::AppState;
use tower_http::services::ServeDir;

pub fn app_router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(health))
        .route("/", get(index))
        .nest("/auth", auth_routes(state.clone()))
        .route("/login", get(login_page))
        .nest_service("/static", ServeDir::new("static"))
        .fallback(handler_404)
        .with_state(state)
}

async fn health() -> impl IntoResponse {
    (StatusCode::OK, "Server is healthy")
}


async fn login_page(State(state): State<AppState>) -> Html<String> {
    let ctx = Context::new();
    match state.tera.render("login.html", &ctx) {
        Ok(rendered) => Html(rendered),
        Err(e) => {Html(format!("Error rendering template: {}", e))},
    }
}
async fn handler_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "The requested resource was not found")
}

async fn index(State(state): State<AppState>) -> Html<String> {
    let mut ctx = Context::new();
    ctx.insert("name", "quantinium");

    match state.tera.render("index.html", &ctx) {
        Ok(rendered) => Html(rendered),
        Err(e) => Html(format!("Error rendering template: {}", e)),
    }
}

fn auth_routes(state: AppState) -> Router<AppState> {
    Router::new()
        .route("/signup", post(sign_up))
        .route("/signin", post(sign_in))
        .route("/signout", post(sign_out))
        .route("/refresh", post(refresh))
        .route("/github", get(github_oauth_start))
        .route("/github/callback", get(github_oauth_callback))
        .with_state(state)
        .layer(CookieManagerLayer::new())
}
