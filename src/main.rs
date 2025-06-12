mod config;
mod models;
mod schema;
mod state;
mod routes;

use axum::{serve};
use diesel::prelude::*;
use std::net::{IpAddr, SocketAddr};
use tera::{Tera};
use tokio::net::TcpListener;

use crate::config::config;
use crate::routes::app_router;
use crate::state::*;


pub fn establish_connection(database_url: &str) -> SqliteConnection {
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

#[tokio::main]
async fn main() {
    let config = config().await;
    establish_connection(config.db_url());

    let tera = Tera::new("templates/**/*").unwrap_or_else(|_| panic!("Couldn't find templates"));

    let app_state = AppState {
        tera,
        database_url: config.db_url().to_string(),
    };

    let app = app_router(app_state.clone());

    let addr = SocketAddr::from((config.server_host().parse::<IpAddr>().expect("Invalid IP \
    Address"), config
        .server_port
    ()));

    tracing::info!("Server listening at http://{}", addr);

    let listener = TcpListener::bind(addr).await.expect("Failed to bind");
    serve(listener, app).await.expect("Failed to run server");
}