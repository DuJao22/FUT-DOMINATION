-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    team_id TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Estatísticas do Jogador (1:1 com users)
CREATE TABLE IF NOT EXISTS player_stats (
    user_id TEXT PRIMARY KEY,
    matches_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    mvps INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Tabela de Badges/Conquistas
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Tabela de Times
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
    FOREIGN KEY(owner_id) REFERENCES users(id)
);

-- Tabela de Territórios (Mapa)
CREATE TABLE IF NOT EXISTS territories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_team_id TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    points INTEGER DEFAULT 0,
    FOREIGN KEY(owner_team_id) REFERENCES teams(id)
);

-- Tabela de Partidas
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL, -- ISO8601 String
    location_name TEXT NOT NULL,
    home_team_id TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0, -- Boolean stored as 0/1
    FOREIGN KEY(home_team_id) REFERENCES teams(id)
);

-- Tabela de Posts (Feed)
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    timestamp TEXT NOT NULL,
    team_id TEXT,
    FOREIGN KEY(author_id) REFERENCES users(id),
    FOREIGN KEY(team_id) REFERENCES teams(id)
);

-- --- SEED DATA (Dados Iniciais baseados no Mock) ---

-- Inserir Usuários
INSERT INTO users (id, name, email, role, team_id, avatar_url, bio, location) VALUES 
('u1', 'Alex "The Striker" Silva', 'alex@futdomination.com', 'OWNER', 't1', 'https://i.pravatar.cc/150?u=a042581f4e29026024d', 'Living for the goal. Captain of Neon FC.', 'Sao Paulo, Brazil'),
('u2', 'Rival Captain', 'rival@enemy.com', 'OWNER', 't2', 'https://i.pravatar.cc/150?u=rival', 'We own the streets.', 'Rio de Janeiro, Brazil'),
('u3', 'Diego Wall', 'd@test.com', 'PLAYER', 't1', 'https://i.pravatar.cc/150?u=u3', 'None shall pass.', 'Sao Paulo, Brazil'),
('u4', 'Lucas Speed', 'l@test.com', 'PLAYER', 't1', 'https://i.pravatar.cc/150?u=u4', 'Catch me if you can.', 'Sao Paulo, Brazil'),
('u5', 'Bruno Mid', 'b@test.com', 'PLAYER', 't1', 'https://i.pravatar.cc/150?u=u5', 'Maestro.', 'Sao Paulo, Brazil');

-- Inserir Stats
INSERT INTO player_stats (user_id, matches_played, goals, mvps, rating) VALUES
('u1', 45, 32, 5, 8.5),
('u3', 40, 0, 2, 7.8),
('u4', 38, 12, 3, 8.0),
('u5', 42, 5, 8, 9.1);

-- Inserir Badges
INSERT INTO user_badges (user_id, badge_name) VALUES
('u1', '👑 King of the Hood'),
('u1', '🔥 Top Scorer'),
('u3', '🧱 The Wall'),
('u5', '🧠 Playmaker');

-- Inserir Times
INSERT INTO teams (id, name, logo_url, wins, losses, draws, territory_color, owner_id, category) VALUES
('t1', 'Neon FC', 'https://picsum.photos/200/200?random=1', 12, 2, 1, '#39ff14', 'u1', 'Society'),
('t2', 'Shadow Strikers', 'https://picsum.photos/200/200?random=2', 8, 5, 3, '#ef4444', 'u2', 'Futsal');

-- Inserir Territórios
INSERT INTO territories (id, name, owner_team_id, lat, lng, points) VALUES
('area1', 'Downtown Arena', 't1', 40.7128, -74.0060, 500),
('area2', 'Westside Park', 't2', 40.7200, -74.0100, 200),
('area3', 'North Courts', NULL, 40.7300, -74.0000, 350),
('area4', 'Harbor Field', 't1', 40.7050, -74.0150, 600);

-- Inserir Partidas
INSERT INTO matches (id, date, location_name, home_team_id, away_team_name, home_score, away_score, is_verified) VALUES
('m1', '2023-10-25T10:00:00Z', 'Downtown Arena', 't1', 'Iron Legs', 5, 3, 1),
('m2', '2023-10-20T14:30:00Z', 'Westside Park', 't1', 'Shadow Strikers', 2, 2, 1);

-- Inserir Posts
INSERT INTO posts (id, author_id, content, image_url, likes, timestamp, team_id) VALUES
('p1', 'u2', 'We are taking Downtown Arena next week! Be ready Neon FC.', NULL, 24, '2023-10-27T09:00:00Z', 't2'),
('p2', 'u1', 'Great training session today. Domination is ours.', 'https://picsum.photos/600/300', 45, '2023-10-27T08:00:00Z', 't1');
