-- Your SQL goes here
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    github_id TEXT,
    google_id TEXT,
    custom_css TEXT,
    theme TEXT DEFAULT 'gruvbox',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_versions (
    id TEXT PRIMARY KEY,
    post_id TEXT REFERENCES posts(id),
    content TEXT NOT NULL,
    commit_message TEXT,
    version_number INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);