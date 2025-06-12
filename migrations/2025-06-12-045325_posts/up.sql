create table posts (
    id text primary key ,
    userId text not null,
    title text not null,
    description text not null,
    slug text not null,
    content text not null,
    is_published boolean not null default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    foreign key (userId) references users(id) on delete cascade,
    unique (userId, slug)
);

create table tags (
    id text primary key,
    name text unique not null
);

create table post_tags (
    post_id text not null,
    tag_id text not null,
    primary key (post_id, tag_id),
    foreign key (post_id) references posts(id) on delete cascade,
    foreign key (tag_id) references tags(id) on delete cascade
);

create table post_versions (
    id text primary key,
    post_id text not null,
    userId text not null,
    title text not null,
    content text not null,
    description text not null,
    commit_hash text not null,
    commit_message text not null,
    created_at timestamp not null default current_timestamp,
    foreign key (post_id) references posts(id) on delete cascade,
    foreign key (userId) references users(id) on delete cascade
);