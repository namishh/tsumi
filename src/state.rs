use diesel::r2d2::{ConnectionManager, Pool};
use diesel::SqliteConnection;
use tera::Tera;
use crate::config::Config;

type DbPool = Pool<ConnectionManager<SqliteConnection>>;
#[derive(Clone)]
pub struct AppState {
    pub tera: Tera,
    pub db_pool: DbPool,
    pub config: &'static Config
}
