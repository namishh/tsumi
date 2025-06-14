use axum::Json;
use axum::response::{IntoResponse, Response};
use http::StatusCode;
use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("User with identifier '{id}' not found")]
    NotFound { id: String },

    #[error("Internal server error: {message}")]
    InternalServerError { message: String },

    #[error("Validation failed: {message}")]
    ValidationError { message: String },

    #[error("Database operation failed: {message}")]
    DatabaseError { message: String },

    #[error("Resource conflict: {message}")]
    Conflict { message: String },

    #[error("Unauthorized: {message}")]
    Unauthorized { message: String },
}

#[derive(Debug, Serialize, Deserialize)]
struct ErrorResponse {
    error: ErrorDetails,
    timestamp: chrono::DateTime<chrono::Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    request_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ErrorDetails {
    code: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    details: Option<serde_json::Value>,
}

impl AuthError {
    pub fn not_found(id: impl Into<String>) -> Self {
        Self::NotFound { id: id.into() }
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self::ValidationError { message: message.into() }
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::Unauthorized { message: message.into() }
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict { message: message.into() }
    }

    pub fn database(message: impl Into<String>) -> Self {
        Self::DatabaseError { message: message.into() }
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::InternalServerError { message: message.into() }
    }

    pub fn status_code(&self) -> StatusCode {
        match self {
            Self::NotFound { .. } => StatusCode::NOT_FOUND,
            Self::ValidationError { .. } => StatusCode::BAD_REQUEST,
            Self::Unauthorized { .. } => StatusCode::UNAUTHORIZED,
            Self::Conflict { .. } => StatusCode::CONFLICT,
            Self::DatabaseError { .. } | Self::InternalServerError { .. } => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
        }
    }

    pub fn error_code(&self) -> &'static str {
        match self {
            Self::NotFound { .. } => "NOT_FOUND",
            Self::ValidationError { .. } => "VALIDATION_ERROR",
            Self::Unauthorized { .. } => "UNAUTHORIZED",
            Self::Conflict { .. } => "CONFLICT",
            Self::DatabaseError { .. } => "DATABASE_ERROR",
            Self::InternalServerError { .. } => "INTERNAL_SERVER_ERROR",
        }
    }

    pub fn should_log(&self) -> bool {
        matches!(self, Self::DatabaseError { .. } | Self::InternalServerError { .. })
    }
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        if self.should_log() {
            tracing::error!("Internal error occurred: {}", self);
        }

        let status = self.status_code();
        let error_response = ErrorResponse {
            error: ErrorDetails {
                code: self.error_code().to_string(),  // Convert to String
                message: self.to_string(),
                details: None,
            },
            timestamp: chrono::Utc::now(),
            request_id: None, // Could be populated from request extensions
        };

        (status, Json(error_response)).into_response()
    }
}

impl From<validator::ValidationErrors> for AuthError {
    fn from(err: validator::ValidationErrors) -> Self {
        Self::validation(err.to_string())
    }
}