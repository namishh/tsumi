create table refresh_tokens (
    id text primary key,
    token text unique not null,
    userId text not null,
    created_at TIMESTAMP not null default current_timestamp,
    foreign key (userId) references users(id) on delete cascade
);

create table reset_tokens (
    id text primary key,
    token text unique not null,
    expires_at timestamp not null default current_timestamp,
    userId text not null,
    created_at timestamp not null default current_timestamp,
    foreign key (userId) references users(id) on delete cascade
);

create table email_verification_tokens (
    id text primary key,
    token text unique not null,
    expires_at timestamp not null default current_timestamp,
    userId text not null,
    created_at timestamp not null default current_timestamp,
    foreign key (userId) references users(id) on delete cascade
);