// use bcrypt::{hash, DEFAULT_COST};
// use crate::db::models::user_model::{NewUser, UserError, UserModel};
// use diesel::{RunQueryDsl, SqliteConnection, result::Error as DieselError, SelectableHelper};
// use diesel::r2d2::{ConnectionManager, PooledConnection};
// use diesel::result::DatabaseErrorKind;
// 
// pub fn create_user(conn: &mut PooledConnection<ConnectionManager<SqliteConnection>>, username: String, email:
// String, password:
// String)
//                    -> Result<UserModel, UserError>{
//     use crate::db::schema::users;
// 
//     let hashed_password = hash(password, DEFAULT_COST)
//         .map_err(|e| UserError::InternalServerError(format!("Password hashing failed: {}", e)))?;
// 
//     let new_user = NewUser {
//         id: uuid::Uuid::new_v4().to_string(),
//         username,
//         email,
//         password: hashed_password,
//         email_verified: false,
//     };
// 
//     diesel::insert_into(users::table)
//         .values(&new_user)
//         .returning(UserModel::as_returning())
//         .get_result(conn)
//         .map_err(|e| match e {
//             DieselError::DatabaseError(DatabaseErrorKind::UniqueViolation, _) => {
//                 UserError::InternalServerError("User with this email or username already exists".to_string())
//             },
//             _ => UserError::InternalServerError(format!("Database error: {}", e))
//         })
// }