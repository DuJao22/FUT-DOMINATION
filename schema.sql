-- Enable foreign keys support
PRAGMA foreign_keys = ON;

-- Drop tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS territories;
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS users;

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

-- 2. Player Stats Table (One-to-One with Users)
CREATE TABLE IF NOT EXISTS player_stats (
    user_id TEXT PRIMARY KEY,
    matches_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    mvps INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. User Badges Table (One-to-Many)
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

-- 5. User Follows Team (Many-to-Many)
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

-- 8. Posts Table (Feed)
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_role TEXT, -- Denormalized for simpler queries
    content TEXT NOT NULL,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    timestamp TEXT NOT NULL,
    team_id TEXT,
    -- Match Context Fields
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

-- --- SEED DATA (Synced with constants.ts) ---

-- Insert Users
INSERT OR IGNORE INTO users (id, name, email, role, team_id, avatar_url, bio, location) VALUES 
('u1', 'Alex "O Artilheiro" Silva', 'alex@futdomination.com', 'OWNER', 't1', 'https://i.pravatar.cc/150?u=a042581f4e29026024d', 'Vivendo pelo gol. Capitão do Neon FC.', 'São Paulo, Brasil'),
('u3', 'Diego Paredão', 'd@test.com', 'PLAYER', 't1', 'https://i.pravatar.cc/150?u=u3', 'Ninguém passa.', 'São Paulo, Brasil'),
('u4', 'Lucas Ligeiro', 'l@test.com', 'PLAYER', 't1', 'https://i.pravatar.cc/150?u=u4', 'Velocidade pura.', 'São Paulo, Brasil'),
('u5', 'Bruno Maestro', 'b@test.com', 'PLAYER', 't1', 'https://i.pravatar.cc/150?u=u5', 'O cérebro do time.', 'São Paulo, Brasil'),
('u2', 'Capitão Rival', 'rival@enemy.com', 'OWNER', 't2', 'https://i.pravatar.cc/150?u=rival', 'Vamos dominar tudo.', 'Rio de Janeiro, Brasil'),
('u99', 'Capitão Ferro', 'ferro@t3.com', 'OWNER', 't3', 'https://i.pravatar.cc/150?u=ferro', 'Raça e suor.', 'São Paulo, Brasil');

-- Insert Stats
INSERT OR IGNORE INTO player_stats (user_id, matches_played, goals, mvps, rating) VALUES
('u1', 45, 32, 5, 8.5),
('u3', 40, 0, 2, 7.8),
('u4', 38, 12, 3, 8.0),
('u5', 42, 5, 8, 9.1);

-- Insert Badges
INSERT OR IGNORE INTO user_badges (user_id, badge_name) VALUES
('u1', '👑 Rei do Bairro'),
('u1', '🔥 Artilheiro'),
('u3', '🧱 A Muralha'),
('u5', '🧠 Playmaker');

-- Insert Teams
INSERT OR IGNORE INTO teams (id, name, logo_url, wins, losses, draws, territory_color, owner_id, category, home_turf) VALUES
('t1', 'Neon FC', 'https://picsum.photos/200/200?random=1', 12, 2, 1, '#39ff14', 'u1', 'Society', 'Centro'),
('t2', 'Shadow Strikers', 'https://picsum.photos/200/200?random=2', 8, 5, 3, '#ef4444', 'u2', 'Futsal', 'Zona Oeste'),
('t3', 'Pernas de Pau', 'https://picsum.photos/200/200?random=3', 5, 10, 0, '#fbbf24', 'u99', 'Field', 'Zona Norte');

-- Insert User Follows
INSERT OR IGNORE INTO user_follows (user_id, team_id) VALUES
('u1', 't1');

-- Insert Territories
INSERT OR IGNORE INTO territories (id, name, owner_team_id, lat, lng, points) VALUES
('area1', 'Arena Central', 't1', 40.7128, -74.0060, 500),
('area2', 'Parque do Oeste', 't2', 40.7200, -74.0100, 200),
('area3', 'Quadras do Norte', NULL, 40.7300, -74.0000, 350),
('area4', 'Campo do Porto', 't1', 40.7050, -74.0150, 600);

-- Insert Matches
INSERT OR IGNORE INTO matches (id, date, location_name, home_team_id, away_team_name, home_score, away_score, is_verified) VALUES
('m1', DATETIME('now', '-2 days'), 'Arena Central', 't1', 'Pernas de Pau', 5, 3, 1),
('m2', DATETIME('now', '-7 days'), 'Parque do Oeste', 't1', 'Shadow Strikers', 2, 2, 1);

-- Insert Posts
INSERT OR IGNORE INTO posts (id, author_id, author_role, content, image_url, likes, timestamp, team_id, match_opponent, match_location, match_result) VALUES
('p1', 'u2', 'OWNER', 'Vamos tomar a Arena Central semana que vem! Se prepare Neon FC. As ruas serão vermelhas. 🔴', NULL, 24, DATETIME('now', '-1 hour'), 't2', 'Neon FC', 'Arena Central', NULL),
('p2', 'u1', 'OWNER', 'Ótimo treino hoje. A dominação é nossa. Confiram o novo uniforme no estúdio!', 'https://picsum.photos/600/300', 45, DATETIME('now', '-2 hours'), 't1', NULL, NULL, NULL),
('p3', 'u5', 'PLAYER', 'Atuação de MVP ontem à noite! 🧠⚽️', NULL, 120, DATETIME('now', '-1 day'), 't1', 'Pernas de Pau', NULL, 'Vitória 5-0'),
('p4', 'u99', 'OWNER', 'Procurando amistosos para terça-feira. Chamem na DM!', NULL, 5, DATETIME('now', '-2 days'), 't3', NULL, NULL, NULL);

-- Insert Post Comments
INSERT OR IGNORE INTO post_comments (id, post_id, author_name, content, timestamp) VALUES
('c1', 'p1', 'Torcedor123', 'Fala muito!', DATETIME('now')),
('c2', 'p3', 'Treinador', 'Jogou muito Bruno!', DATETIME('now'));
