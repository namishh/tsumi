use chrono::NaiveDateTime;
use diesel::Insertable;
use serde::{Deserialize, Serialize};
use validator::Validate;
use crate::db::models::user_model::UserModel;

pub mod signup;
pub mod signin;
pub mod signout;
pub mod refresh;
pub mod github;

#[derive(Validate, Deserialize,Insertable,  Debug)]
#[diesel(table_name = crate::db::schema::users)]
pub struct SignUpRequest {
    #[validate(length(min = 3, max = 50, message = "Username must be between 3 and 50 characters.\
    ."))]
    pub name: String,

    #[validate(email(message = "Email must be a valid email."))]
    pub email: String,

    #[validate(length(min = 8, max = 128, message = "Password must be between 8 and 128 characters"))]
    pub password: String,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = crate::db::schema::email_verification_tokens)]
pub struct NewEmailVerificationTable {
    pub token: String,
    pub expires_at: String,
}

#[derive(Validate, Deserialize,Insertable,  Debug)]
#[diesel(table_name = crate::db::schema::users)]
pub struct SignInRequest {
    #[validate(email(message = "Email must be a valid email."))]
    pub email: String,

    #[validate(length(min = 8, max = 128, message = "Password must be between 8 and 128 characters"))]
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignUpResponse {
    pub id: String,
    pub username: String,
    pub email: String,
    pub email_verified: bool,
    pub created_at: NaiveDateTime,
}

impl From<UserModel> for SignUpResponse {
    fn from(user: UserModel) -> Self {
        Self {
            id: user.id,
            username: user.name,
            email: user.email,
            email_verified: user.email_verified,
            created_at: user.created_at,
        }
    }
}