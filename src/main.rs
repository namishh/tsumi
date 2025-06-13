extern crate core;

use axum::serve;
use std::net::{IpAddr, SocketAddr};
use diesel::r2d2::{ConnectionManager, Pool};
use diesel_migrations::{embed_migrations, EmbeddedMigrations};
use tracing_subscriber::prelude::*;
use tera::Tera;
use tokio::net::TcpListener;
use diesel::sqlite::SqliteConnection;

mod config;
mod state;
mod routes;
mod handlers;
mod db;
mod services;
mod utils;

use crate::config::config;
use crate::routes::app_router;
use crate::state::AppState;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations/");

#[tokio::main]
async fn main() {
    init_tracing();
    let config = config().await;

    let manager = ConnectionManager::<SqliteConnection>::new(config.db_url().to_string());
    let pool = Pool::builder().build(manager).expect("Failed to create pool.");

    let tera = Tera::new("templates/**/*").unwrap_or_else(|_| panic!("Couldn't find templates"));

    let app_state = AppState {
        tera,
        db_pool: pool,
        config,
    };

    let app = app_router(app_state.clone());

    let addr = SocketAddr::from((
        config.server_host().parse::<IpAddr>().expect("Invalid IP Address"),
        config.server_port()
    ));

    tracing::info!("Server listening at http://{}", addr);

    let listener = TcpListener::bind(addr).await.expect("Failed to bind");
    serve(listener, app).await.expect("Failed to run server");
}

fn init_tracing() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init()
}