use axum::extract::State;
use axum::handler::HandlerWithoutStateExt;
use axum::http::StatusCode;
use axum::response::{Html, IntoResponse};
use axum::Router;
use axum::routing::get;
use tera::Context;
use crate::schema::users::dsl::users;
use crate::state::AppState;

pub fn app_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(root))
        .route("/index", get(index))
        .fallback(handler_404)
        .with_state(state)
}

async fn root() -> &'static str {
    "Server is running"
}

async fn handler_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "The requested resource was not found")
}
async fn index(state: State<AppState>) -> Html<String> {
    let mut ctx = Context::new();
    ctx.insert("name", "quantinium");

    match state.tera.render("index.html", &ctx) {
        Ok(rendered) => Html(rendered),
        Err(e) => Html(format!("Error rendering template: {}", e)),
    }
}
