use chrono::NaiveDateTime;
use diesel::{Insertable, Queryable, Selectable};
use serde::{Serialize};

#[derive(Selectable, Queryable)]
#[diesel(table_name = crate::db::schema::refresh_tokens)]
pub struct RefreshTokens {
    pub id: String,
    pub token: String,
    pub user_id: String,
    pub expires_at: NaiveDateTime,
    pub created_at: NaiveDateTime,
}

#[derive(Insertable, Serialize)]
#[diesel(table_name = crate::db::schema::refresh_tokens)]
pub struct NewRefreshToken {
    pub id: String,
    pub token: String,
    pub user_id: String,
    pub expires_at: NaiveDateTime,
    pub created_at: NaiveDateTime,
}
