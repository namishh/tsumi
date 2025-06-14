-- Your SQL goes here
create table accounts (
    id text primary key not null,
    user_id text unique not null,
    type text not null,
    provider text not null,
    provider_account_id text not null,
    refresh_token text not null,
    access_token text not null,
    expires_at timestamp not null,
    token_type text not null default 'Bearer',
    scope text,
    session_state text,
    foreign key (user_id) references users(id) on delete cascade,
    unique(provider, provider_account_id)
);

create table users (
    id text primary key not null,
    name text unique not null,
    email text unique not null,
    password text not null,
    email_verified boolean not null default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    deleted_at timestamp
);

create table email_verification_tokens (
    id text primary key not null,
    token text unique not null,
    expires_at timestamp not null,
    user_id text not null,
    created_at timestamp not null default current_timestamp,
    foreign key (user_id) references users(id) on delete cascade
);

create table refresh_tokens (
    id text primary key not null,
    token text unique not null,
    expires_at timestamp not null,
    user_id text not null,
    created_at timestamp not null default current_timestamp,
    foreign key (user_id) references users(id) on delete cascade
);

create table posts (
    id text primary key not null,
    user_id text not null,
    title text not null,
    description text not null,
    slug text not null,
    content text not null,
    is_published boolean not null default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    foreign key (user_id) references users(id) on delete cascade,
    unique (user_id, slug)
);

create table tags (
    id text primary key not null,
    name text unique not null
);

create table post_tags (
    id text primary key not null,
    post_id text not null,
    tag_id text not null,
    unique (post_id, tag_id),
    foreign key (post_id) references posts(id) on delete cascade,
    foreign key (tag_id) references tags(id) on delete cascade
);

create table reset_tokens (
    id text primary key not null,
    token text unique not null,
    expires_at timestamp not null,
    user_id text not null,
    created_at timestamp not null default current_timestamp,
    foreign key (user_id) references users(id) on delete cascade
);

create table post_versions (
    id text primary key not null,
    post_id text not null,
    user_id text not null,
    title text not null,
    content text not null,
    description text not null,
    commit_hash text not null,
    commit_message text not null,
    created_at timestamp not null default current_timestamp,
    foreign key (post_id) references posts(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade
);

create index idx_posts_slug on posts(slug);
create index idx_posts_user_id on posts(user_id);
create index idx_post_tags_post_id on post_tags(post_id);
create index idx_post_tags_tag_id on post_tags(tag_id);
create index idx_post_versions_commit_hash on post_versions(commit_hash);