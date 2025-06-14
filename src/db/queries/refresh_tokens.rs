use diesel::dsl::{AsSelect, SqlTypeOf};
use diesel::prelude::*;
use diesel::sqlite::Sqlite;
use chrono::{Utc};
use crate::db::models::refresh_token::{NewRefreshToken, RefreshTokens};
use crate::db::schema::refresh_tokens;
use diesel::SelectableHelper;

type SqlType = SqlTypeOf<AsSelect<RefreshTokens, Sqlite>>;
type BoxedQuery<'a> = refresh_tokens::BoxedQuery<'a, Sqlite, SqlType>;

impl RefreshTokens {
    pub fn all() -> BoxedQuery<'static> {
        refresh_tokens::table.select(RefreshTokens::as_select()).into_boxed()
    }

    pub fn by_token(conn: &mut SqliteConnection, tok: &str) -> QueryResult<RefreshTokens> {
        refresh_tokens::table
            .select(RefreshTokens::as_returning())
            .filter(refresh_tokens::token.eq(tok))
            .get_result(conn)
    }

    pub fn token_exists(conn: &mut SqliteConnection, token: &str) -> QueryResult<bool> {
        use diesel::dsl::{exists, select};
        select(exists(refresh_tokens::table.filter(refresh_tokens::token.eq(token))))
            .get_result(conn)
    }

    pub fn delete_by_token(conn: &mut SqliteConnection, token: &str) -> QueryResult<usize> {
        diesel::delete(refresh_tokens::table.filter(refresh_tokens::token.eq(token)))
            .execute(conn)
    }

    pub fn is_expired(conn: &mut SqliteConnection, token: &str) -> QueryResult<bool> {
        use diesel::dsl::{exists, select};
        let now = Utc::now().naive_utc();

        select(exists(
            refresh_tokens::table
                .filter(refresh_tokens::token.eq(token))
                .filter(refresh_tokens::expires_at.lt(now))
        )).get_result(conn)
    }

    pub fn create(conn: &mut SqliteConnection, token: &str, user_id: &str, days: i64) -> QueryResult<RefreshTokens> {
        let now = Utc::now();
        let expires_at = now + chrono::Duration::days(days);

        let new_token = NewRefreshToken {
            id: uuid::Uuid::new_v4().to_string(),
            token: token.to_owned(),
            user_id: user_id.to_owned(),
            expires_at: expires_at.naive_utc(),
            created_at: now.naive_utc(),
        };

        diesel::insert_into(refresh_tokens::table)
            .values(&new_token)
            .returning(RefreshTokens::as_select())
            .get_result(conn)
    }
}