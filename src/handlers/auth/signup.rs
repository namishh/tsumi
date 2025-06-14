use axum::extract::State;
use axum::Json;
use axum::response::Result;
use bcrypt::{hash, DEFAULT_COST};
use diesel::prelude::*;
use uuid::Uuid;
use validator::Validate;
use crate::state::AppState;
use crate::db::models::user_model::{UserModel, NewUser};
use crate::db::schema::users;
use crate::errors::AuthError;
use crate::handlers::auth::{SignUpRequest, SignUpResponse};

pub async fn sign_up(
    State(state): State<AppState>,
    Json(payload): Json<SignUpRequest>,
) -> Result<Json<SignUpResponse>, AuthError> {
    tracing::info!("Processing signup request for email: {}", payload.email);

    payload.validate()
        .map_err(|err| AuthError::validation(format!("Invalid signup data: {}", err)))?;

    let mut conn = state.db_pool.get()
        .map_err(|e| {
            tracing::error!("Failed to get database connection: {}", e);
            AuthError::internal("Database connection failed")
        })?;

    let email_exists = users::table
        .filter(users::email.eq(&payload.email))
        .select(UserModel::as_select())
        .first(&mut conn)
        .optional()
        .map_err(|e| {
            tracing::error!("Database query failed while checking email existence: {}", e);
            AuthError::database("Failed to verify email availability")
        })?;

    if email_exists.is_some() {
        tracing::info!("Signup attempt with existing email: {}", payload.email);
        return Err(AuthError::conflict("Email address is already registered"));
    }

    let username_exists = users::table
        .filter(users::name.eq(&payload.name))
        .select(UserModel::as_select())
        .first(&mut conn)
        .optional()
        .map_err(|e| {
            tracing::error!("Database query failed while checking username existence: {}", e);
            AuthError::database("Failed to verify username availability")
        })?;

    if username_exists.is_some() {
        tracing::info!("Signup attempt with existing username: {}", payload.name);
        return Err(AuthError::conflict("Username is already taken"));
    }

    let hashed_password = hash(&payload.password, DEFAULT_COST)
        .map_err(|e| {
            tracing::error!("Password hashing failed: {}", e);
            AuthError::internal("Failed to process password")
        })?;

    let user_id = Uuid::new_v4().to_string();

    let new_user = NewUser {
        id: user_id,
        name: payload.name,
        email: payload.email,
        password: hashed_password,
        email_verified: false,
        created_at: chrono::Utc::now().naive_utc(),
    };

    let user = diesel::insert_into(users::table)
        .values(&new_user)
        .returning(UserModel::as_returning())
        .get_result(&mut conn)
        .map_err(|e| {
            tracing::error!("Failed to create user in database: {}", e);
            match e {
                diesel::result::Error::DatabaseError(
                    diesel::result::DatabaseErrorKind::UniqueViolation, _
                ) => AuthError::conflict("Email or username already exists"),
                _ => AuthError::database("Failed to create user account"),
            }
        })?;

    tracing::info!("Successfully created user account: {}", user.id);

    // TODO: Send email verification
    // email_service::send_verification_email(&user.email, &user.id).await?;

    Ok(Json(SignUpResponse::from(user)))
}
