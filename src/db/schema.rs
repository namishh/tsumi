// @generated automatically by Diesel CLI.

diesel::table! {
    accounts (id) {
        id -> Text,
        user_id -> Text,
        #[sql_name = "type"]
        type_ -> Text,
        provider -> Text,
        provider_account_id -> Text,
        refresh_token -> Text,
        access_token -> Text,
        expires_at -> Timestamp,
        token_type -> Text,
        scope -> Nullable<Text>,
        session_state -> Nullable<Text>,
    }
}

diesel::table! {
    email_verification_tokens (id) {
        id -> Text,
        token -> Text,
        expires_at -> Timestamp,
        user_id -> Text,
        created_at -> Timestamp,
    }
}

diesel::table! {
    post_tags (id) {
        id -> Text,
        post_id -> Text,
        tag_id -> Text,
    }
}

diesel::table! {
    post_versions (id) {
        id -> Text,
        post_id -> Text,
        user_id -> Text,
        title -> Text,
        content -> Text,
        description -> Text,
        commit_hash -> Text,
        commit_message -> Text,
        created_at -> Timestamp,
    }
}

diesel::table! {
    posts (id) {
        id -> Text,
        user_id -> Text,
        title -> Text,
        description -> Text,
        slug -> Text,
        content -> Text,
        is_published -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    refresh_tokens (id) {
        id -> Text,
        token -> Text,
        expires_at -> Timestamp,
        user_id -> Text,
        created_at -> Timestamp,
    }
}

diesel::table! {
    reset_tokens (id) {
        id -> Text,
        token -> Text,
        expires_at -> Timestamp,
        user_id -> Text,
        created_at -> Timestamp,
    }
}

diesel::table! {
    tags (id) {
        id -> Text,
        name -> Text,
    }
}

diesel::table! {
    users (id) {
        id -> Text,
        name -> Text,
        email -> Text,
        password -> Text,
        email_verified -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
    }
}

diesel::joinable!(accounts -> users (user_id));
diesel::joinable!(email_verification_tokens -> users (user_id));
diesel::joinable!(post_tags -> posts (post_id));
diesel::joinable!(post_tags -> tags (tag_id));
diesel::joinable!(post_versions -> posts (post_id));
diesel::joinable!(post_versions -> users (user_id));
diesel::joinable!(posts -> users (user_id));
diesel::joinable!(refresh_tokens -> users (user_id));
diesel::joinable!(reset_tokens -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    accounts,
    email_verification_tokens,
    post_tags,
    post_versions,
    posts,
    refresh_tokens,
    reset_tokens,
    tags,
    users,
);
