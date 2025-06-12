use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{Html, IntoResponse};
use axum::Router;
use axum::routing::{get, post};
use tera::Context;
use crate::handlers::users::create_user::create_user;
use crate::handlers::users::get_user::get_user;
use crate::state::AppState;

pub fn app_router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(health))
        .route("/index", get(index))
        .nest("/v1/users", user_routes(state.clone()))
        .fallback(handler_404)
        .with_state(state)
}

async fn health() -> impl IntoResponse {
    (StatusCode::OK, "Server is healthy")
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

fn user_routes(state: AppState) -> Router<AppState> {
    Router::new()
        .route("/{id}", get(get_user))
        .route("/create", post(create_user))
        .with_state(state)
}