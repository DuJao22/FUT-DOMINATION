import { Database } from '@sqlitecloud/drivers';
import { 
  User, Team, Match, Territory, Court, PickupGame, 
  Notification, UserRole, MatchStatus, Post 
} from '../types';

// Fallback connection string for stability
const FALLBACK_CONNECTION_STRING = "sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/FUT_DOM.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc";

export class DatabaseService {
  private db: Database | null = null;
  private connectionString: string;

  constructor() {
    this.connectionString = process.env.SQLITE_CONNECTION_STRING || FALLBACK_CONNECTION_STRING;
    this.connect();
  }

  private connect() {
      try {
          this.db = new Database(this.connectionString);
      } catch (error) {
          console.error("❌ Failed to initialize SQLite Cloud driver:", error);
          this.db = null;
      }
  }

  private escape(str: string): string {
      if (!str) return "";
      return str.replace(/'/g, "''");
  }

  public async executeQuery(sql: string, retries = 3): Promise<any> {
      for (let i = 0; i < retries; i++) {
          try {
              if (!this.db) this.connect();
              if (!this.db) throw new Error("Database driver not initialized");
              return await this.db.sql(sql);
          } catch (error: any) {
              const errMsg = error?.message || JSON.stringify(error);
              if (i === retries - 1) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
      }
  }

  // --- INITIALIZATION ---
  async initSchema(): Promise<void> {
    try {
        await this.executeQuery('SELECT 1;'); // Warmup
        
        // Ensure core tables exist
        await this.executeQuery(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL, team_id TEXT, avatar_url TEXT, bio TEXT, location TEXT, position TEXT, shirt_number INTEGER, onboarding_completed INTEGER DEFAULT 0, likes INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
        await this.executeQuery(`CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, name TEXT NOT NULL, logo_url TEXT, bio TEXT, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, draws INTEGER DEFAULT 0, territory_color TEXT, owner_id TEXT, category TEXT, home_turf TEXT, city TEXT, state TEXT, neighborhood TEXT, FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL);`);
        await this.executeQuery(`CREATE TABLE IF NOT EXISTS territories (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_team_id TEXT, lat REAL NOT NULL, lng REAL NOT NULL, points INTEGER DEFAULT 0);`);
        await this.executeQuery(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT, type TEXT, title TEXT, message TEXT, related_id TEXT, related_image TEXT, read INTEGER DEFAULT 0, timestamp TEXT, action_data TEXT);`);
        
        // ... (Other tables assumed to exist or created via similar logic if needed)
        // Kept minimal for lightness as requested.
        
        console.log("✅ Database Ready");
    } catch (error) {
        console.error("❌ Schema Sync Failed.", error);
    }
  }

  // --- MAPPERS ---
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
          stats: { matchesPlayed: row.matches_played || 0, goals: row.goals || 0, mvps: row.mvps || 0, rating: row.rating || 0 },
          badges: row.badges ? row.badges.split(',') : [],
          following: row.following ? row.following.split(',') : []
      };
  }

  private mapTeam(row: any, players: User[] = []): Team {
      return {
          id: row.id,
          name: row.name,
          logoUrl: row.logo_url,
          bio: row.bio,
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

  // --- CORE METHODS ---

  async getTeams(): Promise<Team[]> {
    try {
        const teamsData = await this.executeQuery(`SELECT * FROM teams`);
        const usersData = await this.executeQuery(`SELECT * FROM users WHERE team_id IS NOT NULL`);
        const allPlayers = usersData.map((u: any) => this.mapUser(u));
        return teamsData.map((t: any) => {
            const teamPlayers = allPlayers.filter(p => p.teamId === t.id);
            return this.mapTeam(t, teamPlayers);
        });
    } catch (e) { return []; }
  }

  async getFreeAgents(): Promise<User[]> {
      try {
          const rows = await this.executeQuery(`SELECT u.* FROM users u WHERE (u.team_id IS NULL OR u.team_id = '') AND u.role != 'OWNER' ORDER BY u.created_at DESC LIMIT 50`);
          return rows.map((r: any) => this.mapUser(r));
      } catch (e) { return []; }
  }

  async getTeamFollowers(teamId: string): Promise<User[]> {
      try {
          const rows = await this.executeQuery(`SELECT u.* FROM users u JOIN user_follows uf ON u.id = uf.user_id WHERE uf.team_id = '${teamId}'`);
          return rows.map((r: any) => this.mapUser(r));
      } catch (e) { return []; }
  }

  // --- ACTIONS ---

  async registerUser(user: User, password?: string): Promise<boolean> { 
      try { 
          const safeName = this.escape(user.name); 
          await this.executeQuery(`INSERT INTO users (id, name, email, role, avatar_url, bio, location, onboarding_completed, likes) VALUES ('${user.id}', '${safeName}', '${user.email}', '${user.role}', '${user.avatarUrl}', '', '${user.location}', 0, 0)`); 
          await this.executeQuery(`INSERT INTO player_stats (user_id) VALUES ('${user.id}')`);
          return true; 
      } catch (e) { throw e; } 
  }

  async loginUser(email: string): Promise<User | null> { 
      const rows = await this.executeQuery(`SELECT id FROM users WHERE email = '${email}'`); 
      if (rows.length > 0) return this.getUserById(rows[0].id); 
      return null; 
  }

  async completeOnboarding(userId: string, role: UserRole, profileData: any, teamData?: any): Promise<{success: boolean, user?: User}> {
      try {
          const safeName = this.escape(profileData.name);
          let q = `UPDATE users SET name = '${safeName}', location = '${profileData.location}', avatar_url = '${profileData.avatarUrl}', role = '${role}', onboarding_completed = 1`;
          if (role === UserRole.PLAYER) q += `, position = '${profileData.position}', shirt_number = ${profileData.shirtNumber}`;
          q += ` WHERE id = '${userId}'`;
          await this.executeQuery(q);

          if (role === UserRole.OWNER && teamData) {
              const newTeamId = `t-${Date.now()}`;
              await this.executeQuery(`INSERT INTO teams (id, name, logo_url, territory_color, owner_id, category, home_turf, city, state, neighborhood, wins, losses, draws) VALUES ('${newTeamId}', '${this.escape(teamData.name)}', '${teamData.logoUrl}', '#39ff14', '${userId}', '${teamData.category}', '${teamData.homeTurf}', '${teamData.city}', '${teamData.state}', '${teamData.neighborhood}', 0, 0, 0)`);
              await this.executeQuery(`UPDATE users SET team_id = '${newTeamId}' WHERE id = '${userId}'`);
          }
          const updatedUser = await this.getUserById(userId);
          return { success: true, user: updatedUser || undefined };
      } catch (e) { return { success: false }; }
  }

  // --- GAMEPLAY FEATURES ---

  async claimTerritory(territoryId: string, teamId: string): Promise<{success: boolean, message: string}> {
      try {
          // Check if territory exists
          const t = await this.executeQuery(`SELECT id, owner_team_id FROM territories WHERE id = '${territoryId}'`);
          if (t.length === 0) return { success: false, message: "Território inválido." };
          
          if (t[0].owner_team_id === teamId) return { success: false, message: "Você já domina este local." };

          // Update Owner
          await this.executeQuery(`UPDATE territories SET owner_team_id = '${teamId}' WHERE id = '${territoryId}'`);
          
          // Optional: Create a global post about the conquest
          const team = await this.executeQuery(`SELECT name, logo_url FROM teams WHERE id = '${teamId}'`);
          if(team.length > 0) {
              const postId = `p-${Date.now()}`;
              const content = `O ${team[0].name} acabou de conquistar um novo território! 🚩`;
              await this.executeQuery(`INSERT INTO posts (id, author_id, author_role, content, image_url, likes, timestamp, team_id, match_opponent, match_result, match_location) VALUES ('${postId}', 'SYSTEM', 'OWNER', '${this.escape(content)}', '${team[0].logo_url}', 0, '${new Date().toISOString()}', '${teamId}', '', '', '')`);
          }

          return { success: true, message: "Território conquistado!" };
      } catch (e) {
          console.error(e);
          return { success: false, message: "Erro ao conquistar." };
      }
  }

  async sendTeamInvite(teamId: string, playerId: string): Promise<boolean> {
      try {
          const team = await this.executeQuery(`SELECT name, logo_url FROM teams WHERE id = '${teamId}'`);
          if (team.length === 0) return false;

          await this.createNotification({
              userId: playerId,
              type: 'TEAM_INVITE',
              title: 'Proposta de Transferência',
              message: `O ${team[0].name} quer te contratar!`,
              relatedId: teamId,
              relatedImage: team[0].logo_url,
              actionData: { teamId, playerId }
          });
          return true;
      } catch (e) { return false; }
  }

  // --- STANDARD GETTERS & SETTERS (Simplified) ---
  
  async getTerritories(): Promise<Territory[]> { try { const rows = await this.executeQuery(`SELECT * FROM territories`); return rows.map((row: any) => ({ id: row.id, name: row.name, ownerTeamId: row.owner_team_id, lat: row.lat, lng: row.lng, points: row.points })); } catch (e) { return []; } }
  async getCourts(): Promise<Court[]> { try { const rows = await this.executeQuery(`SELECT * FROM courts`); return rows.map((row: any) => ({ id: row.id, name: row.name, address: row.address, cep: row.cep, number: row.number, phone: row.phone, lat: row.lat, lng: row.lng, registeredByTeamId: row.registered_by_team_id, isPaid: !!row.is_paid, rating: row.rating || 0, ratingCount: row.rating_count || 0 })); } catch (e) { return []; } }
  async getPickupGames(): Promise<PickupGame[]> { try { const rows = await this.executeQuery(`SELECT * FROM pickup_games WHERE date >= date('now', '-1 day') ORDER BY date ASC`); return rows.map((row: any) => ({ id: row.id, hostId: row.host_id, hostName: row.host_name, title: row.title, description: row.description, date: new Date(row.date), locationName: row.location_name, lat: row.lat, lng: row.lng, maxPlayers: row.max_players, price: row.price, confirmedPlayers: row.confirmed_players ? JSON.parse(row.confirmed_players) : [] })); } catch (e) { return []; } }
  async getUserById(id: string): Promise<User | null> { try { const rows = await this.executeQuery(`SELECT u.*, s.matches_played, s.goals, s.mvps, s.rating FROM users u LEFT JOIN player_stats s ON u.id = s.user_id WHERE u.id = '${id}'`); if (rows.length === 0) return null; const userRow = rows[0]; const followRows = await this.executeQuery(`SELECT team_id FROM user_follows WHERE user_id = '${id}'`); const following = followRows.map((f: any) => f.team_id); return { ...this.mapUser(userRow), following }; } catch (e) { return null; } }
  async getUsersByIds(ids: string[]): Promise<User[]> { if (ids.length === 0) return []; try { const idsStr = ids.map(id => `'${id}'`).join(','); const rows = await this.executeQuery(`SELECT u.* FROM users u WHERE u.id IN (${idsStr})`); return rows.map((r: any) => this.mapUser(r)); } catch (e) { return []; } }
  async getNotifications(userId: string): Promise<Notification[]> { try { const rows = await this.executeQuery(`SELECT * FROM notifications WHERE user_id = '${userId}' ORDER BY timestamp DESC`); return rows.map((row: any) => ({ id: row.id, userId: row.user_id, type: row.type, title: row.title, message: row.message, relatedId: row.related_id, relatedImage: row.related_image, read: !!row.read, timestamp: new Date(row.timestamp), actionData: row.action_data ? JSON.parse(row.action_data) : undefined })); } catch (e) { return []; } }
  async getMatches(): Promise<Match[]> { try { const rows = await this.executeQuery(`SELECT * FROM matches ORDER BY date DESC`); return rows.map((row: any) => ({ id: row.id, date: new Date(row.date), locationName: row.location_name, courtId: row.court_id, homeTeamId: row.home_team_id, awayTeamName: row.away_team_name, awayTeamId: row.away_team_id, homeScore: row.home_score, awayScore: row.away_score, isVerified: !!row.is_verified, status: row.status as MatchStatus, goals: row.goals ? JSON.parse(row.goals) : [] })); } catch (e) { return []; } }
  async getPosts(): Promise<Post[]> { try { const rows = await this.executeQuery(`SELECT p.*, u.name as author_name FROM posts p LEFT JOIN users u ON p.author_id = u.id ORDER BY p.timestamp DESC LIMIT 50`); return rows.map((row: any) => ({ id: row.id, authorId: row.author_id, authorName: row.author_name || 'Desconhecido', authorRole: row.author_role as UserRole, content: row.content, imageUrl: row.image_url, likes: row.likes || 0, timestamp: new Date(row.timestamp), teamId: row.team_id, comments: [], matchContext: row.match_opponent ? { opponentName: row.match_opponent, result: row.match_result, location: row.match_location } : undefined })); } catch (e) { return []; } }

  // Other atomic updates
  async createNotification(notif: Partial<Notification>) { const id = `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`; const ts = new Date().toISOString(); await this.executeQuery(`INSERT INTO notifications (id, user_id, type, title, message, related_id, related_image, read, timestamp, action_data) VALUES ('${id}', '${notif.userId}', '${notif.type}', '${notif.title}', '${notif.message}', '${notif.relatedId || ''}', '${notif.relatedImage || ''}', 0, '${ts}', '${JSON.stringify(notif.actionData || {})}')`); }
  async markNotificationRead(id: string): Promise<void> { try { await this.executeQuery(`UPDATE notifications SET read = 1 WHERE id = '${id}'`); } catch (e) {} }
  async requestTrial(userId: string, teamId: string): Promise<boolean> { try { const teamRows = await this.executeQuery(`SELECT owner_id FROM teams WHERE id = '${teamId}'`); const userRows = await this.executeQuery(`SELECT name, avatar_url FROM users WHERE id = '${userId}'`); if (teamRows.length > 0 && userRows.length > 0) { await this.createNotification({ userId: teamRows[0].owner_id, type: 'TRIAL_REQUEST', title: 'Pedido de Teste', message: `${userRows[0].name} quer entrar no seu time.`, relatedId: userId, relatedImage: userRows[0].avatar_url, actionData: { teamId, playerId: userId } }); return true; } return false; } catch (e) { return false; } }
  async acceptTrial(notifId: string, teamId: string, playerId: string): Promise<boolean> { try { await this.executeQuery(`UPDATE users SET team_id = '${teamId}', role = 'PLAYER' WHERE id = '${playerId}'`); await this.markNotificationRead(notifId); const teamRows = await this.executeQuery(`SELECT name, logo_url FROM teams WHERE id = '${teamId}'`); if (teamRows.length > 0) { await this.createNotification({ userId: playerId, type: 'SYSTEM', title: 'Proposta Aceita!', message: `Bem-vindo ao ${teamRows[0].name}.`, relatedId: teamId, relatedImage: teamRows[0].logo_url }); } return true; } catch (e) { return false; } }
  
  // Cleaned up unused / redundant methods for production build
  async saveTeamProfile(id: string, ownerId: string, name: string, logoUrl: string, bio: string): Promise<boolean> { try { await this.executeQuery(`UPDATE teams SET name = '${this.escape(name)}', logo_url = '${logoUrl}', bio = '${this.escape(bio)}' WHERE id = '${id}'`); return true; } catch (e) { return false; } }
  async updateUserProfile(user: User): Promise<boolean> { try { await this.executeQuery(`UPDATE users SET name = '${this.escape(user.name)}', bio = '${this.escape(user.bio || "")}', location = '${user.location}', avatar_url = '${user.avatarUrl}' WHERE id = '${user.id}'`); return true; } catch (e) { return false; } }
  async promotePlayerToOwner(userId: string, teamId: string): Promise<{success: boolean, message: string}> { try { await this.executeQuery(`UPDATE users SET role = 'OWNER' WHERE id = '${userId}'`); return { success: true, message: 'Jogador promovido.' }; } catch (e) { return { success: false, message: 'Erro.' }; } }
  async removePlayerFromTeam(userId: string): Promise<{success: boolean}> { try { await this.executeQuery(`UPDATE users SET team_id = NULL, role = 'PLAYER' WHERE id = '${userId}'`); return { success: true }; } catch (e) { return { success: false }; } }
  async followTeam(userId: string, teamId: string): Promise<boolean> { try { await this.executeQuery(`INSERT INTO user_follows (user_id, team_id) VALUES ('${userId}', '${teamId}')`); return true; } catch(e) { return false; } }
  async unfollowTeam(userId: string, teamId: string): Promise<boolean> { try { await this.executeQuery(`DELETE FROM user_follows WHERE user_id = '${userId}' AND team_id = '${teamId}'`); return true; } catch(e) { return false; } }
  async likePlayer(targetUserId: string, likerUserId: string, likerName: string): Promise<boolean> { if (targetUserId === likerUserId) return false; try { await this.executeQuery(`UPDATE users SET likes = likes + 1 WHERE id = '${targetUserId}'`); await this.createNotification({ userId: targetUserId, type: 'PROFILE_LIKE', title: 'Novo Curtida!', message: `${likerName} curtiu seu perfil.`, relatedId: likerUserId }); return true; } catch (e) { return false; } }
  async createCourt(court: Court): Promise<void> { try { await this.executeQuery(`INSERT INTO courts (id, name, address, cep, number, phone, lat, lng, registered_by_team_id, is_paid, rating, rating_count) VALUES ('${court.id}', '${this.escape(court.name)}', '${this.escape(court.address)}', '${court.cep}', '${court.number}', '${court.phone}', ${court.lat}, ${court.lng}, '${court.registeredByTeamId}', ${court.isPaid ? 1 : 0}, 0, 0)`); } catch (e) { console.error(e); } }
  async createMatch(match: Match): Promise<boolean> { try { const goalsJson = JSON.stringify(match.goals || []); await this.executeQuery(`INSERT INTO matches (id, date, location_name, court_id, home_team_id, away_team_name, away_team_id, home_score, away_score, is_verified, status, goals) VALUES ('${match.id}', '${match.date.toISOString()}', '${match.locationName}', '${match.courtId || ''}', '${match.homeTeamId}', '${match.awayTeamName}', '${match.awayTeamId || ''}', ${match.homeScore || 0}, ${match.awayScore || 0}, ${match.isVerified ? 1 : 0}, '${match.status}', '${goalsJson}')`); if (match.status === 'PENDING' && match.awayTeamId) { const teams = await this.executeQuery(`SELECT owner_id FROM teams WHERE id = '${match.awayTeamId}'`); if (teams.length > 0) { await this.createNotification({ userId: teams[0].owner_id, type: 'MATCH_INVITE', title: 'Desafio de Jogo', message: `Novo desafio marcado em ${match.locationName}.`, actionData: { matchId: match.id, proposedDate: match.date.toISOString() } }); } } return true; } catch (e) { return false; } }
  async createPost(post: Post): Promise<boolean> { try { await this.executeQuery(`INSERT INTO posts (id, author_id, author_role, content, image_url, likes, timestamp, team_id, match_opponent, match_result, match_location) VALUES ('${post.id}', '${post.authorId}', '${post.authorRole}', '${this.escape(post.content)}', '${post.imageUrl || ''}', 0, '${post.timestamp.toISOString()}', '${post.teamId}', '${post.matchContext?.opponentName || ''}', '${post.matchContext?.result || ''}', '${post.matchContext?.location || ''}')`); return true; } catch(e) { return false; } }
  async createPickupGame(game: PickupGame): Promise<boolean> { try { const playersJson = JSON.stringify(game.confirmedPlayers); await this.executeQuery(`INSERT INTO pickup_games (id, host_id, host_name, title, description, date, location_name, lat, lng, max_players, price, confirmed_players) VALUES ('${game.id}', '${game.hostId}', '${game.hostName}', '${this.escape(game.title)}', '${this.escape(game.description)}', '${game.date.toISOString()}', '${game.locationName}', ${game.lat}, ${game.lng}, ${game.maxPlayers}, ${game.price || 0}, '${playersJson}')`); return true; } catch (e) { return false; } }
  async deletePickupGame(gameId: string): Promise<boolean> { try { await this.executeQuery(`DELETE FROM pickup_games WHERE id = '${gameId}'`); return true; } catch (e) { return false; } }
  async joinPickupGame(gameId: string, userId: string, date: Date | string): Promise<{success: boolean, message?: string}> { try { const rows = await this.executeQuery(`SELECT confirmed_players, max_players FROM pickup_games WHERE id = '${gameId}'`); if (rows.length === 0) return { success: false, message: 'Jogo não encontrado' }; const game = rows[0]; const players = game.confirmed_players ? JSON.parse(game.confirmed_players) : []; if (players.length >= game.max_players) return { success: false, message: 'Jogo lotado' }; if (players.includes(userId)) return { success: true }; players.push(userId); await this.executeQuery(`UPDATE pickup_games SET confirmed_players = '${JSON.stringify(players)}' WHERE id = '${gameId}'`); return { success: true }; } catch (e) { return { success: false, message: 'Erro' }; } }
  async leavePickupGame(gameId: string, userId: string): Promise<boolean> { try { const rows = await this.executeQuery(`SELECT confirmed_players FROM pickup_games WHERE id = '${gameId}'`); if (rows.length === 0) return false; let players = rows[0].confirmed_players ? JSON.parse(rows[0].confirmed_players) : []; players = players.filter((id: string) => id !== userId); await this.executeQuery(`UPDATE pickup_games SET confirmed_players = '${JSON.stringify(players)}' WHERE id = '${gameId}'`); return true; } catch (e) { return false; } }
  async rateCourt(courtId: string, userId: string, rating: number): Promise<boolean> { try { await this.executeQuery(`INSERT OR REPLACE INTO court_ratings (court_id, user_id, rating) VALUES ('${courtId}', '${userId}', ${rating})`); return true; } catch (e) { return false; } }
  async updateMatchStatus(matchId: string, status: MatchStatus, isVerified: boolean): Promise<boolean> { try { await this.executeQuery(`UPDATE matches SET status = '${status}', is_verified = ${isVerified ? 1 : 0} WHERE id = '${matchId}'`); return true; } catch (e) { return false; } }
  async updateMatchDateAndStatus(matchId: string, date: Date, status: MatchStatus, teamId: string): Promise<boolean> { try { await this.executeQuery(`UPDATE matches SET date = '${date.toISOString()}', status = '${status}' WHERE id = '${matchId}'`); return true; } catch (e) { return false; } }
}

export const dbService = new DatabaseService();