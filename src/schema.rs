// @generated automatically by Diesel CLI.

diesel::table! {
    post_versions (id) {
        id -> Nullable<Text>,
        post_id -> Nullable<Text>,
        content -> Text,
        commit_message -> Nullable<Text>,
        version_number -> Integer,
        created_at -> Nullable<Text>,
    }
}

diesel::table! {
    posts (id) {
        id -> Nullable<Text>,
        user_id -> Nullable<Text>,
        slug -> Text,
        title -> Text,
        content -> Text,
        is_published -> Nullable<Integer>,
        created_at -> Nullable<Text>,
        updated_at -> Nullable<Text>,
    }
}

diesel::table! {
    users (id) {
        id -> Nullable<Text>,
        username -> Text,
        email -> Text,
        password_hash -> Nullable<Text>,
        github_id -> Nullable<Text>,
        google_id -> Nullable<Text>,
        custom_css -> Nullable<Text>,
        theme -> Nullable<Text>,
        created_at -> Nullable<Text>,
    }
}

diesel::joinable!(post_versions -> posts (post_id));
diesel::joinable!(posts -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    post_versions,
    posts,
    users,
);
