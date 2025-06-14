use std::env;
use dotenvy::dotenv;
use tokio::sync::OnceCell;

#[derive(Debug)]
struct ServerConfig {
    host: String,
    port: u16,
}

#[derive(Debug)]
struct DatabaseConfig {
    url: String,
}

#[derive(Debug)]
struct CorsConfig {
    allowed_origins: Vec<String>,
}

#[derive(Debug)]
struct AccessTokenConfig {
    secret: String,
    expires_at: i64
}

#[derive(Debug)]
struct RefreshTokenConfig {
    secret: String,
    expires_at: i64,
    cookie_name: String,
}

#[derive(Debug)]
struct GithubOAuthConfig {
    client_id: String,
    client_secret: String,
}

#[derive(Debug)]
struct JWTConfig {
    access_token: AccessTokenConfig,
    refresh_token: RefreshTokenConfig
}

#[derive(Debug)]
pub struct Config {
    server: ServerConfig,
    db: DatabaseConfig,
    cors: CorsConfig,
    jwt: JWTConfig,
    github: GithubOAuthConfig
}

impl Config {
    pub fn db_url(&self) -> &str {
        &self.db.url
    }

    pub fn server_host(&self) -> &str {
        &self.server.host
    }

    pub fn server_port(&self) -> u16 {
        self.server.port
    }

    pub fn cors_origin(&self) -> Vec<&str> {
        self.cors.allowed_origins.iter().map(String::as_str).collect()
    }

    pub fn access_token_secret(&self) -> &str {
        &self.jwt.access_token.secret
    }

    pub fn access_token_expires_at(&self) -> i64 {
        self.jwt.access_token.expires_at
    }

    pub fn refresh_token_secret(&self) -> &str {
        &self.jwt.refresh_token.secret
    }

    pub fn refresh_token_expires_at(&self) -> i64 {
        self.jwt.refresh_token.expires_at
    }

    pub fn refresh_token_cookie_name(&self) -> &str {
        &self.jwt.refresh_token.cookie_name
    }
    
    pub fn github_auth_client_id(&self) -> &str {
        &self.github.client_id
    }
    pub fn github_auth_client_secret(&self) -> &str {
        &self.github.client_secret
    }
}

pub static CONFIG: OnceCell<Config> = OnceCell::const_new();

async fn init_config() -> Config {
    dotenv().ok();

    let server_config = ServerConfig {
        host: env::var("HOST").unwrap_or_else(|_| String::from("127.0.0.1")),
        port: env::var("PORT").unwrap_or_else(|_| String::from("8000")).parse::<u16>().unwrap(),
    };

    let database_config = DatabaseConfig {
        url: env::var("DATABASE_URL").expect("DATABASE_URL must be set")
    };

    let cors_config = CorsConfig {
        allowed_origins: env::var("CORS_ORIGIN").expect("CORS_ORIGIN must be set").split(",").map(String::from).collect(),
    };

    let access_token_config = AccessTokenConfig {
        secret: env::var("ACCESS_SECRET").expect("ACCESS_SECRET must be set"),
        expires_at: env::var("ACCESS_EXPIRES").expect("ACCESS_EXPIRES must be set").parse::<i64>
        ().expect("ACCESS_EXPIRES must be a number"),
    };

    let refresh_token_config = RefreshTokenConfig {
        secret: env::var("REFRESH_TOKEN").expect("REFRESH_TOKEN must be set"),
        expires_at: env::var("REFRESH_EXPIRES").expect("REFRESH_EXPIRES must be set")
            .parse::<i64>().expect("REFRESH_EXPIRES must be a number"),
        cookie_name: env::var("COOKIE_NAME").expect("COOKIE_NAME must be set")
    };

    let github_oauth_config = GithubOAuthConfig {
        client_id: env::var("GITHUB_OAUTH_CLIENT_ID").expect("GITHUB_OAUTH_CLIENT_ID muse be \
        set"),
        client_secret: env::var("GITHUB_OAUTH_CLIENT_SECRET").expect("GITHUB_OAUTH_CLIENT_SECRET \
        must be set")
    };

    let jwt_config = JWTConfig {
        access_token: access_token_config,
        refresh_token: refresh_token_config
    };


    Config {
        server: server_config,
        db: database_config,
        cors:cors_config,
        jwt: jwt_config,
        github: github_oauth_config
    }
}

pub async fn config() -> &'static Config {
    CONFIG.get_or_init(init_config).await
}
