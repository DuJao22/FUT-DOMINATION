import { Database } from '@sqlitecloud/drivers';
import { 
  User, Team, Match, Territory, Court, PickupGame, 
  Notification, UserRole, MatchStatus, MatchGoal 
} from '../types';

// Fallback connection string for development/demo stability
const FALLBACK_CONNECTION_STRING = "sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/FUT_DOM.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc";

class DatabaseService {
  private db: Database;
  private connectionString: string;

  constructor() {
    // Ensure we have a valid string. If process.env is empty/undefined, use fallback.
    this.connectionString = process.env.SQLITE_CONNECTION_STRING || FALLBACK_CONNECTION_STRING;
    
    if (!this.connectionString) {
        console.error("CRITICAL: SQLITE_CONNECTION_STRING is missing and no fallback found.");
    }
    
    this.db = new Database(this.connectionString);
  }

  /**
   * Wrapper for SQL execution with Retry/Reconnect logic.
   * This fixes "Connection unavailable" errors by re-initializing the driver if it disconnects.
   */
  private async executeQuery(sql: string): Promise<any> {
      try {
          return await this.db.sql(sql);
      } catch (error: any) {
          const errMsg = error?.message || JSON.stringify(error);
          
          // Detect disconnection or connection availability issues
          if (
              errMsg.includes("Connection unavailable") || 
              errMsg.includes("Disconnected") || 
              errMsg.includes("Socket closed") ||
              errMsg.includes("Network Error")
          ) {
              console.warn("⚠️ DB Connection lost. Reconnecting and retrying...", errMsg);
              
              // Force re-initialization of the driver
              try {
                  this.db = new Database(this.connectionString);
                  // Small delay to allow socket handshake
                  await new Promise(resolve => setTimeout(resolve, 500));
                  // Retry the query once
                  return await this.db.sql(sql);
              } catch (retryError) {
                  console.error("❌ Retry failed:", retryError);
                  throw retryError;
              }
          }
          
          throw error;
      }
  }

  // --- HARD RESET (DEV ONLY) ---
  async hardReset(): Promise<boolean> {
      try {
          console.warn("⚠️ INICIANDO RESET COMPLETO DO BANCO DE DADOS...");
          
          // 1. Disable FK checks to allow dropping tables in any order
          await this.executeQuery('PRAGMA foreign_keys = OFF;');

          // 2. Drop ALL Tables
          const tables = [
              'notifications',
              'pickup_games',
              'court_ratings', // New
              'courts',
              'matches',
              'territories',
              'teams',
              'user_follows',
              'player_likes', // New
              'user_badges',
              'player_stats',
              'users',
              'posts',         // Legacy tables just in case
              'post_comments'  // Legacy tables just in case
          ];

          for (const table of tables) {
              await this.executeQuery(`DROP TABLE IF EXISTS ${table};`);
          }

          // 3. Re-enable FK checks
          await this.executeQuery('PRAGMA foreign_keys = ON;');

          console.log("✅ Tabelas removidas. Recriando Schema...");

          // 4. Re-run init to create fresh tables
          await this.initSchema();
          
          return true;
      } catch (e) {
          console.error("❌ Falha no Hard Reset:", e);
          return false;
      }
  }

  // --- INITIALIZATION ---

  async initSchema(): Promise<void> {
    try {
        // Enable Foreign Keys
        await this.executeQuery('PRAGMA foreign_keys = ON;');

        // 1. Users & Profiles
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                team_id TEXT,
                avatar_url TEXT,
                bio TEXT,
                location TEXT,
                position TEXT,
                shirt_number INTEGER,
                onboarding_completed INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0, -- NEW: Profile Likes
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // NEW: Player Likes Table
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS player_likes (
                target_user_id TEXT NOT NULL,
                liked_by_user_id TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (target_user_id, liked_by_user_id)
            );
        `);

        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS player_stats (
                user_id TEXT PRIMARY KEY,
                matches_played INTEGER DEFAULT 0,
                goals INTEGER DEFAULT 0,
                mvps INTEGER DEFAULT 0,
                rating REAL DEFAULT 0.0,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS user_badges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                badge_name TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS user_follows (
                user_id TEXT NOT NULL,
                team_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, team_id)
            );
        `);

        // 2. Teams
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS teams (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                logo_url TEXT,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                draws INTEGER DEFAULT 0,
                territory_color TEXT,
                owner_id TEXT,
                category TEXT,
                home_turf TEXT,
                city TEXT,
                state TEXT,
                neighborhood TEXT,
                FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `);

        // 3. Territories
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS territories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                owner_team_id TEXT,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                points INTEGER DEFAULT 0
            );
        `);

        // 4. Matches
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                location_name TEXT NOT NULL,
                court_id TEXT,
                home_team_id TEXT NOT NULL,
                away_team_name TEXT,
                away_team_id TEXT,
                home_score INTEGER DEFAULT 0,
                away_score INTEGER DEFAULT 0,
                is_verified INTEGER DEFAULT 0,
                status TEXT,
                goals TEXT -- JSON
            );
        `);

        // 5. Courts (New)
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS courts (
                id TEXT PRIMARY KEY,
                name TEXT,
                address TEXT,
                cep TEXT,
                number TEXT,
                phone TEXT,
                lat REAL,
                lng REAL,
                registered_by_team_id TEXT,
                is_paid INTEGER,
                rating REAL DEFAULT 0,
                rating_count INTEGER DEFAULT 0
            );
        `);

        // NEW: Court Ratings Table
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS court_ratings (
                court_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                rating INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (court_id, user_id)
            );
        `);

        // 6. Pickup Games (New)
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS pickup_games (
                id TEXT PRIMARY KEY,
                host_id TEXT,
                host_name TEXT,
                title TEXT,
                description TEXT,
                date TEXT,
                location_name TEXT,
                lat REAL,
                lng REAL,
                max_players INTEGER,
                price REAL,
                confirmed_players TEXT -- JSON
            );
        `);

        // 7. Notifications (New)
        await this.executeQuery(`
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                type TEXT,
                title TEXT,
                message TEXT,
                related_id TEXT,
                related_image TEXT,
                read INTEGER DEFAULT 0,
                timestamp TEXT,
                action_data TEXT -- JSON
            );
        `);

        // --- AUTO-MIGRATIONS (SELF-HEALING) ---
        // Tries to add columns if they are missing from older DB versions.
        try { await this.executeQuery(`ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0;`); } catch (e) {}
        try { await this.executeQuery(`ALTER TABLE users ADD COLUMN position TEXT;`); } catch (e) {}
        try { await this.executeQuery(`ALTER TABLE users ADD COLUMN shirt_number INTEGER;`); } catch (e) {}
        try { await this.executeQuery(`ALTER TABLE users ADD COLUMN likes INTEGER DEFAULT 0;`); } catch (e) {}
        try { await this.executeQuery(`ALTER TABLE courts ADD COLUMN is_paid INTEGER DEFAULT 0;`); } catch (e) {}
        try { await this.executeQuery(`ALTER TABLE courts ADD COLUMN rating REAL DEFAULT 0;`); } catch (e) {}
        try { await this.executeQuery(`ALTER TABLE courts ADD COLUMN rating_count INTEGER DEFAULT 0;`); } catch (e) {}
        
        // Fix for missing location columns in teams table
        try { await this.executeQuery(`ALTER TABLE teams ADD COLUMN city TEXT;`); } catch (e) {}
        try { await this.executeQuery(`ALTER TABLE teams ADD COLUMN state TEXT;`); } catch (e) {}
        try { await this.executeQuery(`ALTER TABLE teams ADD COLUMN neighborhood TEXT;`); } catch (e) {}

        console.log("✅ Database Schema Synced with SQLite Cloud");
    } catch (error) {
        console.error("❌ Schema Sync Failed. Check Connection.", error);
    }
  }

  // --- MAPPERS (Snake -> Camel) ---

  private mapUser(row: any): User {
      return {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role as UserRole,
          teamId: row.team_id || undefined,
          avatarUrl: row.avatar_url,
          bio: row.bio,
          location: row.location,
          onboardingCompleted: !!row.onboarding_completed,
          position: row.position,
          shirtNumber: row.shirt_number,
          likes: row.likes || 0,
          stats: {
              matchesPlayed: row.matches_played || 0,
              goals: row.goals || 0,
              mvps: row.mvps || 0,
              rating: row.rating || 0
          },
          badges: row.badges ? row.badges.split(',') : [], // Simplified badges
          following: row.following ? row.following.split(',') : []
      };
  }

  private mapTeam(row: any, players: User[] = []): Team {
      return {
          id: row.id,
          name: row.name,
          logoUrl: row.logo_url,
          wins: row.wins,
          losses: row.losses,
          draws: row.draws,
          territoryColor: row.territory_color,
          ownerId: row.owner_id,
          category: row.category,
          homeTurf: row.home_turf,
          city: row.city,
          state: row.state,
          neighborhood: row.neighborhood,
          players: players
      };
  }

  // --- GETTERS ---

  async getTeams(): Promise<Team[]> {
    try {
        const teamsData = await this.executeQuery(`SELECT * FROM teams`);
        const usersData = await this.executeQuery(`SELECT * FROM users WHERE team_id IS NOT NULL`);
        
        // Map users to clean objects first
        const allPlayers = usersData.map((u: any) => this.mapUser(u));

        return teamsData.map((t: any) => {
            const teamPlayers = allPlayers.filter(p => p.teamId === t.id);
            return this.mapTeam(t, teamPlayers);
        });
    } catch (e) {
        console.error("getTeams error:", e);
        return [];
    }
  }

  async getMatches(): Promise<Match[]> {
    try {
        const rows = await this.executeQuery(`SELECT * FROM matches ORDER BY date DESC`);
        return rows.map((row: any) => ({
            id: row.id,
            date: new Date(row.date),
            locationName: row.location_name,
            courtId: row.court_id,
            homeTeamId: row.home_team_id,
            awayTeamName: row.away_team_name,
            awayTeamId: row.away_team_id,
            homeScore: row.home_score,
            awayScore: row.away_score,
            isVerified: !!row.is_verified,
            status: row.status as MatchStatus,
            goals: row.goals ? JSON.parse(row.goals) : []
        }));
    } catch (e) {
        console.error("getMatches error:", e);
        return [];
    }
  }

  async getTerritories(): Promise<Territory[]> {
    try {
        const rows = await this.executeQuery(`SELECT * FROM territories`);
        return rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            ownerTeamId: row.owner_team_id,
            lat: row.lat,
            lng: row.lng,
            points: row.points
        }));
    } catch (e) { return []; }
  }

  async getCourts(): Promise<Court[]> {
    try {
        const rows = await this.executeQuery(`SELECT * FROM courts`);
        return rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            address: row.address,
            cep: row.cep,
            number: row.number,
            phone: row.phone,
            lat: row.lat,
            lng: row.lng,
            registeredByTeamId: row.registered_by_team_id,
            isPaid: !!row.is_paid,
            rating: row.rating || 0,
            ratingCount: row.rating_count || 0
        }));
    } catch (e) { return []; }
  }

  async getPickupGames(): Promise<PickupGame[]> {
    try {
        const rows = await this.executeQuery(`SELECT * FROM pickup_games WHERE date >= date('now', '-1 day') ORDER BY date ASC`);
        return rows.map((row: any) => ({
            id: row.id,
            hostId: row.host_id,
            hostName: row.host_name,
            title: row.title,
            description: row.description,
            date: new Date(row.date),
            locationName: row.location_name,
            lat: row.lat,
            lng: row.lng,
            maxPlayers: row.max_players,
            price: row.price,
            confirmedPlayers: row.confirmed_players ? JSON.parse(row.confirmed_players) : []
        }));
    } catch (e) { return []; }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
        // Fetch User + Stats
        const rows = await this.executeQuery(`
            SELECT u.*, s.matches_played, s.goals, s.mvps, s.rating
            FROM users u 
            LEFT JOIN player_stats s ON u.id = s.user_id
            WHERE u.id = '${id}'
        `);
        
        if (rows.length === 0) return null;
        
        const userRow = rows[0];
        
        // Fetch Badges
        const badgeRows = await this.executeQuery(`SELECT badge_name FROM user_badges WHERE user_id = '${id}'`);
        const badges = badgeRows.map((b: any) => b.badge_name);

        // Fetch Follows
        const followRows = await this.executeQuery(`SELECT team_id FROM user_follows WHERE user_id = '${id}'`);
        const following = followRows.map((f: any) => f.team_id);

        return {
            ...this.mapUser(userRow),
            badges,
            following
        };
    } catch (e) {
        console.error("getUserById error:", e);
        return null;
    }
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
      if (ids.length === 0) return [];
      try {
          const idsStr = ids.map(id => `'${id}'`).join(',');
          const rows = await this.executeQuery(`
            SELECT u.*, s.matches_played, s.goals, s.mvps, s.rating
            FROM users u
            LEFT JOIN player_stats s ON u.id = s.user_id
            WHERE u.id IN (${idsStr})
          `);
          return rows.map((r: any) => this.mapUser(r));
      } catch (e) { return []; }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
      try {
          const rows = await this.executeQuery(`SELECT * FROM notifications WHERE user_id = '${userId}' ORDER BY timestamp DESC`);
          return rows.map((row: any) => ({
              id: row.id,
              userId: row.user_id,
              type: row.type,
              title: row.title,
              message: row.message,
              relatedId: row.related_id,
              relatedImage: row.related_image,
              read: !!row.read,
              timestamp: new Date(row.timestamp),
              actionData: row.action_data ? JSON.parse(row.action_data) : undefined
          }));
      } catch (e) { return []; }
  }

  // --- AUTH & USER MGMT ---

  async registerUser(user: User, password?: string): Promise<boolean> {
      try {
          await this.executeQuery(`
            INSERT INTO users (id, name, email, role, avatar_url, bio, location, onboarding_completed, likes)
            VALUES ('${user.id}', '${user.name}', '${user.email}', '${user.role}', '${user.avatarUrl}', '${user.bio}', '${user.location}', 0, 0)
          `);
          // Init stats
          await this.executeQuery(`INSERT INTO player_stats (user_id) VALUES ('${user.id}')`);
          return true;
      } catch (e) {
          console.error(e);
          throw e; // Rethrow for UI to show "Email exists"
      }
  }

  async loginUser(email: string): Promise<User | null> {
      try {
          const rows = await this.executeQuery(`SELECT id FROM users WHERE email = '${email}'`);
          if (rows.length > 0) {
              return this.getUserById(rows[0].id);
          }
          return null;
      } catch (e) {
          console.error("Login Error:", e);
          throw e;
      }
  }

  async completeOnboarding(userId: string, role: UserRole, profileData: any, teamData?: any): Promise<{success: boolean, user?: User}> {
      try {
          // 1. Update User Profile
          let updateQuery = `
            UPDATE users SET 
            name = '${profileData.name}', 
            location = '${profileData.location}', 
            avatar_url = '${profileData.avatarUrl}',
            role = '${role}',
            onboarding_completed = 1
          `;
          
          if (role === UserRole.PLAYER) {
              updateQuery += `, position = '${profileData.position}', shirt_number = ${profileData.shirtNumber}`;
          }
          
          updateQuery += ` WHERE id = '${userId}'`;
          await this.executeQuery(updateQuery);

          // 2. Create Team if Owner
          if (role === UserRole.OWNER && teamData) {
              const newTeamId = `t-${Date.now()}`;
              await this.executeQuery(`
                INSERT INTO teams (id, name, logo_url, territory_color, owner_id, category, home_turf, city, state, neighborhood, wins, losses, draws)
                VALUES ('${newTeamId}', '${teamData.name}', '${teamData.logoUrl}', '#39ff14', '${userId}', '${teamData.category}', '${teamData.homeTurf}', '${teamData.city}', '${teamData.state}', '${teamData.neighborhood}', 0, 0, 0)
              `);
              
              // Link user to team
              await this.executeQuery(`UPDATE users SET team_id = '${newTeamId}' WHERE id = '${userId}'`);
          }

          const updatedUser = await this.getUserById(userId);
          return { success: true, user: updatedUser || undefined };
      } catch (e) {
          console.error(e);
          return { success: false };
      }
  }

  // --- INTERACTION ACTIONS (Likes & Ratings) ---

  async likePlayer(targetUserId: string, likerUserId: string, likerName: string): Promise<boolean> {
      if (targetUserId === likerUserId) return false;
      try {
          // Try insert. Will fail if already liked due to Primary Key (target, liker)
          await this.executeQuery(`
            INSERT INTO player_likes (target_user_id, liked_by_user_id) 
            VALUES ('${targetUserId}', '${likerUserId}')
          `);
          
          // Increment counter
          await this.executeQuery(`UPDATE users SET likes = likes + 1 WHERE id = '${targetUserId}'`);

          // Notify Target
          await this.createNotification({
              userId: targetUserId,
              type: 'PROFILE_LIKE',
              title: 'Novo Curtida!',
              message: `${likerName} curtiu seu perfil de jogador.`,
              relatedId: likerUserId,
              // Ideally pass liker avatar too, but simplified here
          });

          return true;
      } catch (e: any) {
          if (e.message?.includes('UNIQUE')) return false; // Already liked
          console.error(e);
          return false;
      }
  }

  async rateCourt(courtId: string, userId: string, rating: number): Promise<boolean> {
      try {
          // Insert or Replace (Upsert)
          await this.executeQuery(`
            INSERT OR REPLACE INTO court_ratings (court_id, user_id, rating)
            VALUES ('${courtId}', '${userId}', ${rating})
          `);

          // Recalculate Average for the Court
          const rows = await this.executeQuery(`SELECT AVG(rating) as avg, COUNT(*) as count FROM court_ratings WHERE court_id = '${courtId}'`);
          const newAvg = rows[0].avg || 0;
          const newCount = rows[0].count || 0;

          await this.executeQuery(`UPDATE courts SET rating = ${newAvg}, rating_count = ${newCount} WHERE id = '${courtId}'`);
          
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }

  // --- ACTIONS ---

  async createCourt(court: Court): Promise<void> {
      try {
          await this.executeQuery(`
            INSERT INTO courts (id, name, address, cep, number, phone, lat, lng, registered_by_team_id, is_paid, rating, rating_count)
            VALUES ('${court.id}', '${court.name}', '${court.address}', '${court.cep}', '${court.number}', '${court.phone}', ${court.lat}, ${court.lng}, '${court.registeredByTeamId}', ${court.isPaid ? 1 : 0}, 0, 0)
          `);
      } catch (e) { console.error(e); }
  }

  async createMatch(match: Match): Promise<boolean> {
      try {
          const goalsJson = JSON.stringify(match.goals || []);
          await this.executeQuery(`
            INSERT INTO matches (id, date, location_name, court_id, home_team_id, away_team_name, away_team_id, home_score, away_score, is_verified, status, goals)
            VALUES ('${match.id}', '${match.date.toISOString()}', '${match.locationName}', '${match.courtId || ''}', '${match.homeTeamId}', '${match.awayTeamName}', '${match.awayTeamId || ''}', ${match.homeScore || 0}, ${match.awayScore || 0}, ${match.isVerified ? 1 : 0}, '${match.status}', '${goalsJson}')
          `);

          // Notify Opponent
          if (match.status === 'PENDING' && match.awayTeamId) {
              const teams = await this.executeQuery(`SELECT owner_id FROM teams WHERE id = '${match.awayTeamId}'`);
              if (teams.length > 0) {
                  await this.createNotification({
                      userId: teams[0].owner_id,
                      type: 'MATCH_INVITE',
                      title: 'Desafio de Jogo',
                      message: `Novo desafio marcado em ${match.locationName}.`,
                      actionData: { matchId: match.id, proposedDate: match.date.toISOString() }
                  });
              }
          }
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }

  async createPickupGame(game: PickupGame): Promise<boolean> {
      try {
          const playersJson = JSON.stringify(game.confirmedPlayers);
          await this.executeQuery(`
            INSERT INTO pickup_games (id, host_id, host_name, title, description, date, location_name, lat, lng, max_players, price, confirmed_players)
            VALUES ('${game.id}', '${game.hostId}', '${game.hostName}', '${game.title}', '${game.description}', '${game.date.toISOString()}', '${game.locationName}', ${game.lat}, ${game.lng}, ${game.maxPlayers}, ${game.price || 0}, '${playersJson}')
          `);
          return true;
      } catch (e) { return false; }
  }

  async updateTeamInfo(id: string, name: string, logoUrl: string): Promise<void> {
      try {
          await this.executeQuery(`UPDATE teams SET name = '${name}', logo_url = '${logoUrl}' WHERE id = '${id}'`);
      } catch (e) { console.error(e); }
  }

  async updateUserProfile(user: User): Promise<boolean> {
      try {
          await this.executeQuery(`
            UPDATE users SET 
            name = '${user.name}', 
            bio = '${user.bio}', 
            location = '${user.location}', 
            avatar_url = '${user.avatarUrl}'
            WHERE id = '${user.id}'
          `);
          return true;
      } catch (e) { return false; }
  }

  async requestTrial(userId: string, teamId: string): Promise<boolean> {
      try {
          const teamRows = await this.executeQuery(`SELECT owner_id FROM teams WHERE id = '${teamId}'`);
          const userRows = await this.executeQuery(`SELECT name, avatar_url FROM users WHERE id = '${userId}'`);
          
          if (teamRows.length > 0 && userRows.length > 0) {
              await this.createNotification({
                  userId: teamRows[0].owner_id,
                  type: 'TRIAL_REQUEST',
                  title: 'Pedido de Teste',
                  message: `${userRows[0].name} quer entrar no seu time.`,
                  relatedId: userId,
                  relatedImage: userRows[0].avatar_url,
                  actionData: { teamId, playerId: userId }
              });
              return true;
          }
          return false;
      } catch (e) { return false; }
  }

  async acceptTrial(notifId: string, teamId: string, playerId: string): Promise<boolean> {
      try {
          // Update User
          await this.executeQuery(`UPDATE users SET team_id = '${teamId}', role = 'PLAYER' WHERE id = '${playerId}'`);
          // Mark notif read
          await this.markNotificationRead(notifId);
          
          // Notify Player
          const teamRows = await this.executeQuery(`SELECT name, logo_url FROM teams WHERE id = '${teamId}'`);
          if (teamRows.length > 0) {
              await this.createNotification({
                  userId: playerId,
                  type: 'SYSTEM',
                  title: 'Proposta Aceita!',
                  message: `Bem-vindo ao ${teamRows[0].name}.`,
                  relatedId: teamId,
                  relatedImage: teamRows[0].logo_url
              });
          }
          return true;
      } catch (e) { return false; }
  }

  async addPlayerByEmail(email: string, teamId: string): Promise<{ success: boolean, message: string, user?: User }> {
      try {
          const rows = await this.executeQuery(`SELECT id FROM users WHERE email = '${email}'`);
          if (rows.length === 0) return { success: false, message: 'Usuário não encontrado' };
          
          const userId = rows[0].id;
          await this.executeQuery(`UPDATE users SET team_id = '${teamId}', role = 'PLAYER' WHERE id = '${userId}'`);
          
          const user = await this.getUserById(userId);
          return { success: true, message: 'Jogador adicionado', user: user || undefined };
      } catch (e) { return { success: false, message: 'Erro de DB' }; }
  }

  async updateMatchStatus(matchId: string, status: MatchStatus, isVerified: boolean): Promise<boolean> {
      try {
          await this.executeQuery(`UPDATE matches SET status = '${status}', is_verified = ${isVerified ? 1 : 0} WHERE id = '${matchId}'`);
          return true;
      } catch (e) { return false; }
  }

  async updateMatchDateAndStatus(matchId: string, date: Date, status: MatchStatus, teamId: string): Promise<boolean> {
      try {
          await this.executeQuery(`UPDATE matches SET date = '${date.toISOString()}', status = '${status}' WHERE id = '${matchId}'`);
          
          // Notify other party logic could be here (simplified)
          return true;
      } catch (e) { return false; }
  }

  async joinPickupGame(gameId: string, userId: string, date: Date | string): Promise<{success: boolean, message?: string}> {
      try {
          const rows = await this.executeQuery(`SELECT confirmed_players, max_players FROM pickup_games WHERE id = '${gameId}'`);
          if (rows.length === 0) return { success: false, message: 'Jogo não encontrado' };
          
          const game = rows[0];
          const players = game.confirmed_players ? JSON.parse(game.confirmed_players) : [];
          
          if (players.length >= game.max_players) return { success: false, message: 'Jogo lotado' };
          if (players.includes(userId)) return { success: true }; // Already joined
          
          players.push(userId);
          await this.executeQuery(`UPDATE pickup_games SET confirmed_players = '${JSON.stringify(players)}' WHERE id = '${gameId}'`);
          return { success: true };
      } catch (e) { return { success: false, message: 'Erro de conexão' }; }
  }

  async leavePickupGame(gameId: string, userId: string): Promise<boolean> {
      try {
          const rows = await this.executeQuery(`SELECT confirmed_players FROM pickup_games WHERE id = '${gameId}'`);
          if (rows.length === 0) return false;
          
          let players = rows[0].confirmed_players ? JSON.parse(rows[0].confirmed_players) : [];
          players = players.filter((id: string) => id !== userId);
          
          await this.executeQuery(`UPDATE pickup_games SET confirmed_players = '${JSON.stringify(players)}' WHERE id = '${gameId}'`);
          return true;
      } catch (e) { return false; }
  }

  // --- INTERNAL HELPER ---
  async createNotification(notif: Partial<Notification>) {
      const id = `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const ts = new Date().toISOString();
      const actionJson = JSON.stringify(notif.actionData || {});
      
      await this.executeQuery(`
        INSERT INTO notifications (id, user_id, type, title, message, related_id, related_image, read, timestamp, action_data)
        VALUES ('${id}', '${notif.userId}', '${notif.type}', '${notif.title}', '${notif.message}', '${notif.relatedId || ''}', '${notif.relatedImage || ''}', 0, '${ts}', '${actionJson}')
      `);
  }

  async markNotificationRead(id: string): Promise<void> {
      try {
          await this.executeQuery(`UPDATE notifications SET read = 1 WHERE id = '${id}'`);
      } catch (e) { console.error(e); }
  }
}

export const dbService = new DatabaseService();