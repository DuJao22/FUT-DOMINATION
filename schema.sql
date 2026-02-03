-- Enable foreign keys support
PRAGMA foreign_keys = ON;

-- --- CLEAN SLATE PROTOCOL ---
-- Drop tables if they exist to clear all old data
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS territories;
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS users;

-- --- RECREATE EMPTY STRUCTURE ---

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('OWNER', 'PLAYER', 'FAN')),
    team_id TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Player Stats Table
CREATE TABLE IF NOT EXISTS player_stats (
    user_id TEXT PRIMARY KEY,
    matches_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    mvps INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    territory_color TEXT,
    owner_id TEXT,
    category TEXT CHECK(category IN ('Society', 'Futsal', 'Field')),
    home_turf TEXT,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. User Follows Team
CREATE TABLE IF NOT EXISTS user_follows (
    user_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 6. Territories Table
CREATE TABLE IF NOT EXISTS territories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_team_id TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    points INTEGER DEFAULT 0,
    FOREIGN KEY(owner_team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 7. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    location_name TEXT NOT NULL,
    home_team_id TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    FOREIGN KEY(home_team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 8. Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_role TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    timestamp TEXT NOT NULL,
    team_id TEXT,
    match_opponent TEXT,
    match_result TEXT,
    match_location TEXT,
    FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 9. Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- --- NO SEED DATA ---
-- The database is now completely empty.
-- Users must register via the app (or you can insert a manual admin here if needed).
