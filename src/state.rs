use tera::Tera;

#[derive(Clone, Debug)]
pub struct AppState {
    pub tera: Tera,
    pub database_url: String,
}
