create table users (
    id text not null primary key,
    username text not null unique,
    email text not null unique,
    password text not null,
    email_verified boolean not null default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    deleted_at timestamp
)