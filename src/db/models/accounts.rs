use chrono::NaiveDateTime;
use diesel::{Queryable, Selectable};
use serde::{Deserialize, Serialize};

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug)]
#[diesel(table_name = crate::db::schema::accounts)]
pub struct UserModel {
    pub id: String,
    pub user_id: String,
    pub provider: String,
    pub provider_account_id: String,
    pub refresh_token : String,
    pub access_token : String,
    pub expires_at: NaiveDateTime,
    pub token_type: String,
    pub scope: Option<String>,
    pub session_state: Option<String>,
}
