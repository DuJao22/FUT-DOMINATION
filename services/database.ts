import { Database } from '@sqlitecloud/drivers';
import { Team, Territory, Post, User, Match } from '../types';

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
      // @ts-ignore - The types from esm.sh might vary slightly, treating as generic driver
      const result = await this.db.sql(sql, params);
      return result;
    } catch (error) {
      console.error("Database Query Error:", error);
      // Fallback for demo stability if DB is unreachable
      return [];
    }
  }

  // --- Type Mappers (Snake_case DB -> CamelCase App) ---

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

  // --- Methods ---

  async getTeams(): Promise<Team[]> {
    const rows = await this.query('SELECT * FROM teams');
    return Array.isArray(rows) ? rows.map(this.mapTeam) : [];
  }

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