mod config;

use axum::{Json, Router, http::StatusCode, response::Html, routing::get, serve, extract::State};
use chrono::Utc;
use diesel::prelude::*;
use serde::Serialize;
use std::{net::SocketAddr};
use tera::{Context, Tera};
use tokio::net::TcpListener;

use crate::config::config;

#[derive(Serialize)]
struct Response {
    status_code: u16,
    data: String,
    timestamp: String,
}

pub fn establish_connection(database_url: &str) -> SqliteConnection {
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

#[tokio::main]
async fn main() {
    let config = config().await;
    establish_connection(config.db_url());

    let tera = Tera::new("templates/**/*").unwrap_or_else(|_| panic!("Couldn't find templates"));

    let app = Router::new()
        .route("/", get(hello))
        .route("/index", get(index))
        .with_state(tera);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server listening at http://{}", addr);

    let listener = TcpListener::bind(addr).await.unwrap();
    serve(listener, app).await.unwrap();
}

async fn index(tera: State<Tera>) -> Html<String> {
    let mut ctx = Context::new();
    ctx.insert("name", "world");

    match tera.render("index.html", &ctx) {
        Ok(rendered) => Html(rendered),
        Err(e) => Html(format!("Error rendering template: {}", e)),
    }
}

async fn hello() -> Json<Response> {
    let res = Response {
        status_code: StatusCode::OK.as_u16(),
        data: "hello".to_string(),
        timestamp: Utc::now().to_rfc3339(),
    };

    Json(res)
}

