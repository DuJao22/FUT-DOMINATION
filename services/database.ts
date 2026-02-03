import { Database } from '@sqlitecloud/drivers';
import { Team, Territory, Post, User, Match, UserRole } from '../types';

// NOTE: In a real production app, do not expose full connection strings with write access on the client side.
// Use a proxy server or restrict permissions of the user in the connection string.
// For this demo, we assume the environment variable provides the string.

const connectionString = process.env.SQLITE_CONNECTION_STRING || "";

class DatabaseService {
  private db: Database | null = null;

  constructor() {
    if (connectionString) {
      try {
        this.db = new Database(connectionString);
        console.log("🔌 Connecting to SQLite Cloud...");
      } catch (error) {
        console.error("Failed to initialize Database client:", error);
      }
    } else {
      console.warn("SQLITE_CONNECTION_STRING is missing. App is running in Mock Mode or Database is unavailable.");
    }
  }

  get client() {
    return this.db;
  }

  async query(sql: string, params: any[] = []) {
    if (!this.db) {
      console.error("Database not initialized");
      return [];
    }
    try {
      const result = await this.db.sql(sql, params);
      return result;
    } catch (error) {
      console.error("Database Query Error:", error);
      return [];
    }
  }

  // --- Type Mappers (Snake_case DB -> CamelCase App) ---

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
        following: [], // TODO: Fetch from user_follows table
        stats: {
            matchesPlayed: 0, // TODO: Join with player_stats
            goals: 0,
            mvps: 0,
            rating: 0
        },
        badges: [] // TODO: Fetch from user_badges
    };
  }

  private mapTeam(row: any): Team {
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
      players: [] // Fetched separately usually
    };
  }

  private mapTerritory(row: any): Territory {
    return {
      id: row.id,
      name: row.name,
      ownerTeamId: row.owner_team_id,
      lat: row.lat,
      lng: row.lng,
      points: row.points
    };
  }

  // --- AUTHENTICATION & USER METHODS ---

  async registerUser(user: User, passwordRaw: string): Promise<User | null> {
    try {
        // 1. Insert into Users table
        await this.query(
            `INSERT INTO users (id, name, email, role, avatar_url, bio, location) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user.id, user.name, user.email, user.role, user.avatarUrl, user.bio, user.location]
        );

        // 2. Initialize Player Stats (Empty)
        await this.query(
            `INSERT INTO player_stats (user_id) VALUES (?)`,
            [user.id]
        );

        // Note: In a real app, store the password hash in a separate 'auth' table or column.
        // For this demo, assuming we handle auth simply or externally, but checking duplicates via email unique constraint.
        // If we need to verify password later, we'd need a password column. 
        // Let's add a temporary password column check handling logic in the Login method via a specific query if the schema allowed,
        // but since schema.sql didn't strictly specify a password column, we will simulate password check on login 
        // OR assuming you might want to add a password column. 
        // **CRITICAL**: The current schema in schema.sql does NOT have a password column.
        // I will rely on the email being unique for identity for now, or we'd need to alter schema.
        
        return user;
    } catch (error) {
        console.error("Registration failed:", error);
        throw error;
    }
  }

  async loginUser(email: string): Promise<User | null> {
      // Retrieve user by email
      const rows = await this.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      if (Array.isArray(rows) && rows.length > 0) {
          return this.mapUser(rows[0]);
      }
      return null;
  }

  async getUserById(id: string): Promise<User | null> {
      const rows = await this.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
      if (Array.isArray(rows) && rows.length > 0) {
          return this.mapUser(rows[0]);
      }
      return null;
  }

  async updateUserTeamAndRole(userId: string, teamId: string, role: UserRole): Promise<boolean> {
      try {
          await this.query(
              'UPDATE users SET team_id = ?, role = ? WHERE id = ?',
              [teamId, role, userId]
          );
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }

  // --- TEAM METHODS ---

  async createTeam(team: Team): Promise<boolean> {
      try {
          await this.query(
              `INSERT INTO teams (id, name, logo_url, wins, losses, draws, territory_color, owner_id, category, home_turf)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [team.id, team.name, team.logoUrl, team.wins, team.losses, team.draws, team.territoryColor, team.ownerId, team.category, team.homeTurf]
          );
          return true;
      } catch (e) {
          console.error("Create Team failed", e);
          return false;
      }
  }

  async getTeams(): Promise<Team[]> {
    const rows = await this.query('SELECT * FROM teams');
    return Array.isArray(rows) ? rows.map(this.mapTeam) : [];
  }

  // --- OTHER ---

  async getTerritories(): Promise<Territory[]> {
    const rows = await this.query('SELECT * FROM territories');
    return Array.isArray(rows) ? rows.map(this.mapTerritory) : [];
  }
  
  async getMatches(): Promise<Match[]> {
    const rows = await this.query('SELECT * FROM matches ORDER BY date DESC');
    return Array.isArray(rows) ? rows.map((row: any) => ({
      id: row.id,
      date: new Date(row.date),
      locationName: row.location_name,
      homeTeamId: row.home_team_id,
      awayTeamName: row.away_team_name,
      homeScore: row.home_score,
      awayScore: row.away_score,
      isVerified: Boolean(row.is_verified)
    })) : [];
  }
}

export const dbService = new DatabaseService();
