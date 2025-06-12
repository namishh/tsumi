use diesel::r2d2::{ConnectionManager, Pool};
use diesel::SqliteConnection;
use tera::Tera;

type DbPool = Pool<ConnectionManager<SqliteConnection>>;
#[derive(Clone)]
pub struct AppState {
    pub tera: Tera,
    pub db_pool: DbPool,
}
