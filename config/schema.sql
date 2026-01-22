CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    cover_photo_id INTEGER,
    created_at TEXT,
    updated_at TEXT,
    slug TEXT,
    published_at TEXT,
    first_photo_taken_at TEXT
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body text,
    user_id INTEGER,
    photo_id INTEGER,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE google_authorizations (
    id INTEGER NOT NULL,
    scope TEXT,
    token_type TEXT,
    encrypted_access_token TEXT,
    encrypted_access_token_iv TEXT,
    encrypted_refresh_token TEXT,
    encrypted_refresh_token_iv TEXT,
    expires_at TEXT,
    user_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE photo_versions (
    id INTEGER NOT NULL,
    size TEXT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    photo_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    filename TEXT
);

CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    created_at TEXT,
    updated_at TEXT,
    path TEXT,
    album_id INTEGER,
    caption text,
    mime_type TEXT,
    google_id TEXT,
    taken_at TEXT,
    width INTEGER,
    height INTEGER,
    camera_make TEXT,
    camera_model TEXT,
    focal_length numeric,
    aperture_f_number numeric,
    iso_equivalent INTEGER,
    exposure_time TEXT,
    lat TEXT,
    lon TEXT
);

CREATE TABLE plus_ones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    photo_id INTEGER NOT NULL,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE redirects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    "from" TEXT,
    "to" TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT DEFAULT '' NOT NULL,
    uid TEXT,
    provider TEXT,
    name TEXT,
    created_at TEXT,
    updated_at TEXT,
    admin boolean DEFAULT false,
    encrypted_password TEXT DEFAULT '' NOT NULL,
    reset_password_token TEXT,
    reset_password_sent_at TEXT,
    remember_created_at TEXT,
    confirmation_token TEXT,
    confirmed_at TEXT,
    confirmation_sent_at TEXT
);
