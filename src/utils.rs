use std::error::Error;
use base64::Engine;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use jsonwebtoken::{encode, EncodingKey, Header};
use rand::Rng;
use serde::Serialize;
use time::{Duration, OffsetDateTime};
use crate::state::AppState;

#[derive(Serialize)]
struct Claims {
    sub: String,
    exp: usize,
    iat: usize,
    iss: String,
}

pub async fn create_jwt(user_id: &str, state: &AppState) -> Result<String, Box<dyn Error>> {
    // todo: make the time dynamic
    let expiration = OffsetDateTime::now_utc() + Duration::hours(24);
    let now = OffsetDateTime::now_utc();
    let claims = Claims {
        sub: user_id.to_owned(),
        exp: expiration.unix_timestamp() as usize,
        iat: now.unix_timestamp() as usize,
        iss: "tsumi".to_string(),
    };

    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(state.config
                                                                         .access_token_secret()
        .as_bytes()))?;
    Ok(token)
}

fn generate_csrf_token() -> String {
    use rand::Rng;
    let mut rng = rand::rng();
    let bytes: [u8; 32] = rng.random();
    BASE64_URL_SAFE_NO_PAD.encode(&bytes)
}