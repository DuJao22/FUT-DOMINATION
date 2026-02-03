import { Database } from '@sqlitecloud/drivers';
import { Team, Territory, Post, User, Match, UserRole } from '../types';

// Fallback Hardcoded String
const FALLBACK_CONNECTION_STRING = "sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/FUT_DOM.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc";

// NOTE: Uses the connection string from vite.config.ts (process.env) or the fallback
const connectionString = process.env.SQLITE_CONNECTION_STRING || FALLBACK_CONNECTION_STRING;

// Use namespaced tables to avoid conflicts with old/broken schemas
// Bumped to v2 to ensure fresh tables after fixing the binding parameter bug
const TABLES = {
    USERS: 'app_users_v2',
    TEAMS: 'app_teams_v2',
    MATCHES: 'app_matches_v2',
    TERRITORIES: 'app_territories_v2'
};

class DatabaseService {
  private db: Database | null = null;

  constructor() {
    if (connectionString) {
      try {
        this.db = new Database(connectionString);
        console.log("🔌 Database Client Initialized.");
      } catch (error) {
        console.error("❌ Failed to initialize Database client constructor:", error);
      }
    } else {
      console.error("❌ CRITICAL: SQLITE_CONNECTION_STRING is missing. Database will not work.");
    }
  }

  // --- INITIALIZATION ---
  async initSchema() {
      if (!this.db) {
          console.error("❌ Database not initialized during initSchema call.");
          return;
      }
      console.log("🏗️ Verifying Database Schema...");
      
      const queries = [
          `CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL,
            team_id TEXT,
            avatar_url TEXT,
            bio TEXT,
            location TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS ${TABLES.TEAMS} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo_url TEXT,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            draws INTEGER DEFAULT 0,
            territory_color TEXT,
            owner_id TEXT,
            category TEXT,
            home_turf TEXT
          )`,
          `CREATE TABLE IF NOT EXISTS ${TABLES.MATCHES} (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            location_name TEXT NOT NULL,
            home_team_id TEXT NOT NULL,
            away_team_name TEXT NOT NULL,
            home_score INTEGER DEFAULT 0,
            away_score INTEGER DEFAULT 0,
            is_verified INTEGER DEFAULT 0
          )`,
          `CREATE TABLE IF NOT EXISTS ${TABLES.TERRITORIES} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner_team_id TEXT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            points INTEGER DEFAULT 0
          )`,
          // Initialize default territories
          `INSERT OR IGNORE INTO ${TABLES.TERRITORIES} (id, name, lat, lng, points) VALUES 
           ('area1', 'Arena Central', 40.7128, -74.0060, 500),
           ('area2', 'Parque do Oeste', 40.7200, -74.0100, 200),
           ('area3', 'Quadras do Norte', 40.7300, -74.0000, 350),
           ('area4', 'Campo do Porto', 40.7050, -74.0150, 600)`
      ];

      for (const sql of queries) {
          try {
              // Schema init uses direct execution without params
              await this.db.sql(sql);
          } catch (e) {
              console.log("⚠️ Schema info:", e);
          }
      }
      console.log("✅ Schema Verified.");
  }

  async query(sql: string, params: any[] = []) {
    if (!this.db) {
      throw new Error("Banco de dados não inicializado.");
    }
    try {
      // FIX: Handle undefined values by converting to null
      const safeParams = params.map(p => p === undefined ? null : p);
      
      // CRITICAL FIX: Spread the arguments. 
      // The driver expects: db.sql(query, arg1, arg2, ...)
      // Passing an array as the second argument counts as 1 parameter, causing "Wrong number of parameters" error.
      const result = await this.db.sql(sql, ...safeParams);
      return result;
    } catch (error) {
      console.error("❌ Database Query Error:", error, "SQL:", sql);
      throw error; 
    }
  }

  // --- Type Mappers ---

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
        following: [], 
        stats: { matchesPlayed: 0, goals: 0, mvps: 0, rating: 0 },
        badges: [] 
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
      players: []
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

  // --- AUTH METHODS ---

  async registerUser(user: User, passwordRaw: string): Promise<User | null> {
    const safeEmail = user.email.trim().toLowerCase();
    
    try {
        console.log(`Attempting to register user: ${safeEmail}`);
        await this.query(
            `INSERT INTO ${TABLES.USERS} (id, name, email, role, avatar_url, bio, location) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user.id, user.name, safeEmail, user.role, user.avatarUrl, user.bio, user.location]
        );
        console.log("✅ User successfully persisted.");
        return { ...user, email: safeEmail };
    } catch (error) {
        console.error("🚨 Registration Fatal Error:", error);
        throw error;
    }
  }

  async loginUser(email: string): Promise<User | null> {
      const safeEmail = email.trim().toLowerCase();
      try {
        const rows = await this.query(`SELECT * FROM ${TABLES.USERS} WHERE email = ? LIMIT 1`, [safeEmail]);
        if (Array.isArray(rows) && rows.length > 0) {
            return this.mapUser(rows[0]);
        }
        return null;
      } catch (e) {
        console.error("Login Query Error", e);
        throw e;
      }
  }

  async getUserById(id: string): Promise<User | null> {
      try {
        const rows = await this.query(`SELECT * FROM ${TABLES.USERS} WHERE id = ? LIMIT 1`, [id]);
        if (Array.isArray(rows) && rows.length > 0) {
            return this.mapUser(rows[0]);
        }
        return null;
      } catch (e) {
          return null;
      }
  }

  async updateUserTeamAndRole(userId: string, teamId: string, role: UserRole): Promise<boolean> {
      try {
          await this.query(
              `UPDATE ${TABLES.USERS} SET team_id = ?, role = ? WHERE id = ?`,
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
              `INSERT INTO ${TABLES.TEAMS} (id, name, logo_url, wins, losses, draws, territory_color, owner_id, category, home_turf)
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
    try {
        const rows = await this.query(`SELECT * FROM ${TABLES.TEAMS}`);
        const teams = Array.isArray(rows) ? rows.map(this.mapTeam) : [];
        
        for (const team of teams) {
            if(team.ownerId) {
                const owner = await this.getUserById(team.ownerId);
                if(owner) team.players.push(owner);
            }
        }
        return teams;
    } catch (e) {
        console.error("Get Teams Error", e);
        return [];
    }
  }

  // --- MATCH & TERRITORY METHODS ---

  async createMatch(match: Match): Promise<boolean> {
      try {
          await this.query(
              `INSERT INTO ${TABLES.MATCHES} (id, date, location_name, home_team_id, away_team_name, home_score, away_score, is_verified)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [match.id, match.date.toISOString(), match.locationName, match.homeTeamId, match.awayTeamName, match.homeScore, match.awayScore, match.isVerified ? 1 : 0]
          );
          
          if (match.homeScore > match.awayScore) {
              await this.query(`UPDATE ${TABLES.TEAMS} SET wins = wins + 1 WHERE id = ?`, [match.homeTeamId]);
          } else if (match.homeScore < match.awayScore) {
              await this.query(`UPDATE ${TABLES.TEAMS} SET losses = losses + 1 WHERE id = ?`, [match.homeTeamId]);
          } else {
              await this.query(`UPDATE ${TABLES.TEAMS} SET draws = draws + 1 WHERE id = ?`, [match.homeTeamId]);
          }

          return true;
      } catch (e) {
          console.error("Create Match failed", e);
          return false;
      }
  }

  async getTerritories(): Promise<Territory[]> {
    try {
        const rows = await this.query(`SELECT * FROM ${TABLES.TERRITORIES}`);
        return Array.isArray(rows) ? rows.map(this.mapTerritory) : [];
    } catch (e) {
        return [];
    }
  }
  
  async getMatches(): Promise<Match[]> {
    try {
        const rows = await this.query(`SELECT * FROM ${TABLES.MATCHES} ORDER BY date DESC`);
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
    } catch (e) {
        return [];
    }
  }
}

export const dbService = new DatabaseService();