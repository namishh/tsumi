use chrono::NaiveDateTime;
use diesel::{Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug)]
#[diesel(table_name = crate::db::schema::users)]
pub struct UserModel {
    pub id: String,
    pub name: String,
    pub email: String,
    pub password: String,
    pub email_verified: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Insertable, Serialize, Deserialize, Debug)]
#[diesel(table_name = crate::db::schema::users)]
pub struct NewUser {
    pub id: String,
    pub name: String,
    pub email: String,
    pub password: String,
    pub email_verified: bool,
    pub created_at: NaiveDateTime
}
