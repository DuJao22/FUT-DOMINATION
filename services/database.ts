import { Database } from '@sqlitecloud/drivers';

// NOTE: In a real production app, do not expose full connection strings with write access on the client side.
// Use a proxy server or restrict permissions of the user in the connection string.
// For this demo, we assume the environment variable provides the string.

const connectionString = process.env.SQLITE_CONNECTION_STRING || "";

class DatabaseService {
  private db: Database | null = null;

  constructor() {
    if (connectionString) {
      this.db = new Database(connectionString);
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
      return await this.db.sql(sql, params);
    } catch (error) {
      console.error("Database Query Error:", error);
      throw error;
    }
  }

  // Example method to get all teams
  async getTeams() {
    return this.query('SELECT * FROM teams');
  }

  // Example method to get territories
  async getTerritories() {
    return this.query('SELECT * FROM territories');
  }
}

export const dbService = new DatabaseService();