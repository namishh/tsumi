create table accounts (
    _id text primary key not null,
    userId text not null,
    type text not null,
    provider text not null,
    providerAccountId text not null,
    refresh_token text not null,
    access_token text not null,
    expires_at timestamp not null,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    foreign key (userId) references users(_id) on delete cascade,
    unique(provider, providerAccountId)
)