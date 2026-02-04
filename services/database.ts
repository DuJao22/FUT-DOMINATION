import { Database } from '@sqlitecloud/drivers';
import { Team, Territory, Post, User, Match, UserRole, Notification, NotificationType, Court, MatchStatus } from '../types';

// Fallback Hardcoded String - Updated to match user provided string exactly
const FALLBACK_CONNECTION_STRING = "sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/FUT_DOM.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc";

// NOTE: Uses the connection string from vite.config.ts (process.env) or the fallback
const connectionString = process.env.SQLITE_CONNECTION_STRING || FALLBACK_CONNECTION_STRING;

// Use namespaced tables to avoid conflicts with old/broken schemas
const TABLES = {
    USERS: 'app_users_v2',
    TEAMS: 'app_teams_v2',
    MATCHES: 'app_matches_v2',
    TERRITORIES: 'app_territories_v2',
    NOTIFICATIONS: 'app_notifications_v2',
    COURTS: 'app_courts_v2'
};

class DatabaseService {
  private db: Database | null = null;

  constructor() {
    this.initClient();
  }

  private initClient() {
    if (connectionString) {
      try {
        // Create a new instance.
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
            onboarding_completed INTEGER DEFAULT 0,
            position TEXT,
            shirt_number INTEGER,
            is_starter INTEGER DEFAULT 0,
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
            home_turf TEXT,
            city TEXT,
            state TEXT,
            neighborhood TEXT
          )`,
          `CREATE TABLE IF NOT EXISTS ${TABLES.COURTS} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            cep TEXT,
            number TEXT,
            phone TEXT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            registered_by_team_id TEXT
          )`,
          `CREATE TABLE IF NOT EXISTS ${TABLES.MATCHES} (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            location_name TEXT NOT NULL,
            court_id TEXT,
            home_team_id TEXT NOT NULL,
            away_team_name TEXT NOT NULL,
            away_team_id TEXT,
            home_score INTEGER DEFAULT 0,
            away_score INTEGER DEFAULT 0,
            is_verified INTEGER DEFAULT 0,
            status TEXT DEFAULT 'FINISHED',
            stats_json TEXT
          )`,
          `CREATE TABLE IF NOT EXISTS ${TABLES.TERRITORIES} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner_team_id TEXT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            points INTEGER DEFAULT 0
          )`,
          `CREATE TABLE IF NOT EXISTS ${TABLES.NOTIFICATIONS} (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            related_id TEXT,
            related_image TEXT,
            is_read INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            action_data TEXT
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
              await this.query(sql); 
          } catch (e) {
              console.log("⚠️ Schema info:", e);
          }
      }
      
      // Migration: Add new columns safely
      try {
          const tableInfo = await this.query(`PRAGMA table_info(${TABLES.TEAMS})`);
          if (Array.isArray(tableInfo)) {
              const existingColumns = tableInfo.map((col: any) => col.name);
              
              if (!existingColumns.includes('city')) {
                  await this.query(`ALTER TABLE ${TABLES.TEAMS} ADD COLUMN city TEXT`);
                  console.log("✅ Migrated: Added 'city' to teams");
              }
              if (!existingColumns.includes('state')) {
                  await this.query(`ALTER TABLE ${TABLES.TEAMS} ADD COLUMN state TEXT`);
                  console.log("✅ Migrated: Added 'state' to teams");
              }
              if (!existingColumns.includes('neighborhood')) {
                  await this.query(`ALTER TABLE ${TABLES.TEAMS} ADD COLUMN neighborhood TEXT`);
                  console.log("✅ Migrated: Added 'neighborhood' to teams");
              }
          }
          
          // User Migrations
          const userInfo = await this.query(`PRAGMA table_info(${TABLES.USERS})`);
          if (Array.isArray(userInfo)) {
              const existingColumns = userInfo.map((col: any) => col.name);
              if (!existingColumns.includes('is_starter')) {
                  await this.query(`ALTER TABLE ${TABLES.USERS} ADD COLUMN is_starter INTEGER DEFAULT 0`);
                  console.log("✅ Migrated: Added 'is_starter' to users");
              }
          }

          // Match Migrations
          const matchTableInfo = await this.query(`PRAGMA table_info(${TABLES.MATCHES})`);
          if (Array.isArray(matchTableInfo)) {
              const existingColumns = matchTableInfo.map((col: any) => col.name);
              
              if (!existingColumns.includes('court_id')) {
                  await this.query(`ALTER TABLE ${TABLES.MATCHES} ADD COLUMN court_id TEXT`);
                  console.log("✅ Migrated: Added 'court_id' to matches");
              }
              
              if (!existingColumns.includes('away_team_id')) {
                  await this.query(`ALTER TABLE ${TABLES.MATCHES} ADD COLUMN away_team_id TEXT`);
                  console.log("✅ Migrated: Added 'away_team_id' to matches");
              }

              if (!existingColumns.includes('status')) {
                  await this.query(`ALTER TABLE ${TABLES.MATCHES} ADD COLUMN status TEXT DEFAULT 'FINISHED'`);
                  console.log("✅ Migrated: Added 'status' to matches");
              }
              if (!existingColumns.includes('stats_json')) {
                  await this.query(`ALTER TABLE ${TABLES.MATCHES} ADD COLUMN stats_json TEXT`);
                  console.log("✅ Migrated: Added 'stats_json' to matches");
              }
          }

      } catch (e) {
        console.warn("⚠️ Schema migration check skipped or failed:", e);
      }

      console.log("✅ Schema Verified.");
  }

  async query(sql: string, params: any[] = [], retries = 3) {
    if (!this.db) {
        this.initClient();
        if (!this.db) throw new Error("Banco de dados não inicializado.");
    }

    try {
      const safeParams = params.map(p => p === undefined ? null : p);
      const result = await this.db.sql(sql, ...safeParams);
      return result;
    } catch (error: any) {
      const errorMsg = (error?.message || String(error)).toLowerCase();
      
      if (retries > 0 && (
          errorMsg.includes('disconnected') || 
          errorMsg.includes('connection') || 
          errorMsg.includes('connect') ||
          errorMsg.includes('unavailable')
      )) {
          console.warn(`⚠️ Database connection error: ${errorMsg}. Retrying... (${retries} attempts left)`);
          this.initClient();
          await new Promise(resolve => setTimeout(resolve, 1500));
          return this.query(sql, params, retries - 1);
      }

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
        badges: [],
        onboardingCompleted: Boolean(row.onboarding_completed),
        position: row.position,
        shirtNumber: row.shirt_number,
        isStarter: Boolean(row.is_starter)
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
      city: row.city,
      state: row.state,
      neighborhood: row.neighborhood,
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

  private mapCourt(row: any): Court {
      return {
          id: row.id,
          name: row.name,
          address: row.address,
          cep: row.cep,
          number: row.number,
          phone: row.phone,
          lat: row.lat,
          lng: row.lng,
          registeredByTeamId: row.registered_by_team_id
      };
  }

  private mapNotification(row: any): Notification {
      return {
          id: row.id,
          userId: row.user_id,
          type: row.type as NotificationType,
          title: row.title,
          message: row.message,
          relatedId: row.related_id,
          relatedImage: row.related_image,
          read: Boolean(row.is_read),
          timestamp: new Date(row.timestamp),
          actionData: row.action_data ? JSON.parse(row.action_data) : undefined
      }
  }

  // --- AUTH METHODS ---

  async registerUser(user: User, passwordRaw: string): Promise<User | null> {
    const safeEmail = user.email.trim().toLowerCase();
    try {
        console.log(`Attempting to register user: ${safeEmail}`);
        await this.query(
            `INSERT INTO ${TABLES.USERS} (id, name, email, role, avatar_url, bio, location, onboarding_completed) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [user.id, user.name, safeEmail, user.role, user.avatarUrl, user.bio, user.location]
        );
        console.log("✅ User successfully persisted.");
        return { ...user, email: safeEmail, onboardingCompleted: false };
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

  async updateUserProfile(user: User): Promise<boolean> {
      try {
          await this.query(
              `UPDATE ${TABLES.USERS} SET name = ?, bio = ?, location = ?, avatar_url = ? WHERE id = ?`,
              [user.name, user.bio, user.location, user.avatarUrl, user.id]
          );
          return true;
      } catch (e) {
          console.error("Update Profile Failed:", e);
          return false;
      }
  }

  async updatePlayerDetails(userId: string, data: { position: string; shirtNumber: number; isStarter: boolean; bio: string }): Promise<boolean> {
      try {
          await this.query(
              `UPDATE ${TABLES.USERS} SET position = ?, shirt_number = ?, is_starter = ?, bio = ? WHERE id = ?`,
              [data.position, data.shirtNumber || null, data.isStarter ? 1 : 0, data.bio, userId]
          );
          return true;
      } catch(e) {
          console.error("Failed to update player details", e);
          return false;
      }
  }

  // --- ONBOARDING METHODS ---

  async completeOnboarding(
      userId: string, 
      role: UserRole, 
      profileData: { name: string; location: string; position?: string; shirtNumber?: number; avatarUrl?: string; },
      teamData?: { name: string; homeTurf: string; category: string; logoUrl: string; city: string; state: string; neighborhood: string; }
  ): Promise<{ success: boolean; user?: User; team?: Team }> {
      try {
          await this.query(
              `UPDATE ${TABLES.USERS} 
               SET name = ?, location = ?, role = ?, position = ?, shirt_number = ?, avatar_url = ?, onboarding_completed = 1 
               WHERE id = ?`,
              [profileData.name, profileData.location, role, profileData.position || null, profileData.shirtNumber || null, profileData.avatarUrl, userId]
          );

          let newTeam: Team | undefined;
          if (role === UserRole.OWNER && teamData) {
              const teamId = `t-${Date.now()}`;
              newTeam = {
                  id: teamId,
                  name: teamData.name,
                  logoUrl: teamData.logoUrl,
                  wins: 0, losses: 0, draws: 0,
                  territoryColor: '#39ff14',
                  players: [],
                  ownerId: userId,
                  category: teamData.category as any,
                  homeTurf: teamData.homeTurf,
                  city: teamData.city,
                  state: teamData.state,
                  neighborhood: teamData.neighborhood
              };

              await this.createTeam(newTeam);
              await this.query(`UPDATE ${TABLES.USERS} SET team_id = ? WHERE id = ?`, [teamId, userId]);
          }

          const updatedUser = await this.getUserById(userId);
          return { success: true, user: updatedUser!, team: newTeam };

      } catch (e) {
          console.error("Onboarding Error:", e);
          return { success: false };
      }
  }

  // --- TEAM METHODS ---

  async createTeam(team: Team): Promise<boolean> {
      try {
          await this.query(
              `INSERT INTO ${TABLES.TEAMS} (id, name, logo_url, wins, losses, draws, territory_color, owner_id, category, home_turf, city, state, neighborhood)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [team.id, team.name, team.logoUrl, team.wins, team.losses, team.draws, team.territoryColor, team.ownerId, team.category, team.homeTurf, team.city, team.state, team.neighborhood]
          );
          return true;
      } catch (e) {
          console.error("Create Team failed", e);
          return false;
      }
  }

  async addPlayerByEmail(email: string, teamId: string): Promise<{ success: boolean, message: string, user?: User }> {
      const safeEmail = email.trim().toLowerCase();
      try {
          const rows = await this.query(`SELECT * FROM ${TABLES.USERS} WHERE email = ? LIMIT 1`, [safeEmail]);
          if (!Array.isArray(rows) || rows.length === 0) {
              return { success: false, message: "Usuário não encontrado." };
          }
          const user = this.mapUser(rows[0]);
          if (user.teamId) {
              return { success: false, message: "Este jogador já está em outro time." };
          }
          await this.query(
              `UPDATE ${TABLES.USERS} SET team_id = ?, role = 'PLAYER' WHERE id = ?`,
              [teamId, user.id]
          );
          
          // Send Notification to Player
          this.createNotification(user.id, 'TEAM_INVITE', 'Você foi adicionado!', `Um time te adicionou diretamente ao elenco.`, teamId, undefined, { teamId });

          return { success: true, message: "Jogador adicionado!", user: { ...user, teamId, role: UserRole.PLAYER } };
      } catch (e) {
          console.error("Add Player Error:", e);
          return { success: false, message: "Erro interno." };
      }
  }

  async getTeams(): Promise<Team[]> {
    try {
        const rows = await this.query(`SELECT * FROM ${TABLES.TEAMS}`);
        const teams = Array.isArray(rows) ? rows.map(this.mapTeam) : [];
        for (const team of teams) {
            const playerRows = await this.query(`SELECT * FROM ${TABLES.USERS} WHERE team_id = ?`, [team.id]);
            if(Array.isArray(playerRows)) {
                team.players = playerRows.map(this.mapUser);
            }
        }
        return teams;
    } catch (e) {
        console.error("Get Teams Error", e);
        return [];
    }
  }

  // --- NOTIFICATIONS SYSTEM ---

  async getNotifications(userId: string): Promise<Notification[]> {
      try {
          const rows = await this.query(`SELECT * FROM ${TABLES.NOTIFICATIONS} WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20`, [userId]);
          return Array.isArray(rows) ? rows.map(this.mapNotification) : [];
      } catch(e) {
          console.error("Get Notifications Error", e);
          return [];
      }
  }

  async createNotification(
      userId: string, 
      type: NotificationType, 
      title: string, 
      message: string, 
      relatedId?: string, 
      relatedImage?: string,
      actionData?: any
  ) {
      try {
          const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await this.query(
              `INSERT INTO ${TABLES.NOTIFICATIONS} (id, user_id, type, title, message, related_id, related_image, action_data)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [id, userId, type, title, message, relatedId, relatedImage, actionData ? JSON.stringify(actionData) : null]
          );
      } catch(e) {
          console.error("Create Notification Error", e);
      }
  }

  async markNotificationRead(notifId: string) {
      try {
          await this.query(`UPDATE ${TABLES.NOTIFICATIONS} SET is_read = 1 WHERE id = ?`, [notifId]);
      } catch(e) { console.error(e); }
  }

  async deleteNotification(notifId: string) {
      try {
          await this.query(`DELETE FROM ${TABLES.NOTIFICATIONS} WHERE id = ?`, [notifId]);
      } catch(e) { console.error(e); }
  }

  // --- MARKET ACTIONS ---

  async requestTrial(playerId: string, teamId: string): Promise<boolean> {
      try {
          // 1. Get Team Owner
          const teams = await this.query(`SELECT owner_id, name, logo_url FROM ${TABLES.TEAMS} WHERE id = ?`, [teamId]);
          if (!Array.isArray(teams) || teams.length === 0) return false;
          const team = teams[0];

          // 2. Get Player Info
          const player = await this.getUserById(playerId);
          if (!player) return false;

          // 3. Create Notification for Owner
          await this.createNotification(
              team.owner_id,
              'TRIAL_REQUEST',
              'Pedido de Avaliação',
              `${player.name} (${player.position || 'Livre'}) quer fazer um teste no seu time.`,
              playerId,
              player.avatarUrl,
              { playerId, teamId }
          );

          return true;
      } catch(e) {
          console.error("Request Trial Error", e);
          return false;
      }
  }

  async acceptTrial(notifId: string, teamId: string, playerId: string): Promise<boolean> {
      try {
          // Add player to team
          await this.query(
              `UPDATE ${TABLES.USERS} SET team_id = ?, role = 'PLAYER' WHERE id = ?`,
              [teamId, playerId]
          );

          // Mark notification as read
          await this.markNotificationRead(notifId);

          // Notify Player
          const teams = await this.query(`SELECT name, logo_url FROM ${TABLES.TEAMS} WHERE id = ?`, [teamId]);
          const teamName = teams[0]?.name || "O Time";
          const teamLogo = teams[0]?.logo_url;

          await this.createNotification(
              playerId,
              'TEAM_INVITE',
              'Teste Aprovado! ⚽',
              `Parabéns! ${teamName} aceitou seu pedido. Você agora faz parte do elenco.`,
              teamId,
              teamLogo
          );

          return true;
      } catch(e) {
          console.error(e);
          return false;
      }
  }

  // --- COURTS METHODS ---
  async getCourts(): Promise<Court[]> {
      try {
          const rows = await this.query(`SELECT * FROM ${TABLES.COURTS}`);
          return Array.isArray(rows) ? rows.map(this.mapCourt) : [];
      } catch(e) {
          console.error("Get Courts Failed", e);
          return [];
      }
  }

  async createCourt(court: Court): Promise<boolean> {
      try {
          await this.query(
              `INSERT INTO ${TABLES.COURTS} (id, name, address, cep, number, phone, lat, lng, registered_by_team_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [court.id, court.name, court.address, court.cep, court.number, court.phone, court.lat, court.lng, court.registeredByTeamId]
          );
          return true;
      } catch(e) {
          console.error("Create Court Failed", e);
          return false;
      }
  }

  // --- MATCH & TERRITORY METHODS ---

  async createMatch(match: Match): Promise<boolean> {
      try {
          await this.query(
              `INSERT INTO ${TABLES.MATCHES} (id, date, location_name, court_id, home_team_id, away_team_name, away_team_id, home_score, away_score, is_verified, status, stats_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                  match.id, 
                  match.date.toISOString(), 
                  match.locationName, 
                  match.courtId || null, 
                  match.homeTeamId, 
                  match.awayTeamName, 
                  match.awayTeamId || null, 
                  match.homeScore ?? 0, 
                  match.awayScore ?? 0, 
                  match.isVerified ? 1 : 0,
                  match.status || 'FINISHED',
                  match.goals ? JSON.stringify(match.goals) : null
              ]
          );
          
          if (match.status === 'FINISHED') {
              // Update stats only if finished
              const homeS = match.homeScore ?? 0;
              const awayS = match.awayScore ?? 0;

              if (homeS > awayS) {
                  await this.query(`UPDATE ${TABLES.TEAMS} SET wins = wins + 1 WHERE id = ?`, [match.homeTeamId]);
              } else if (homeS < awayS) {
                  await this.query(`UPDATE ${TABLES.TEAMS} SET losses = losses + 1 WHERE id = ?`, [match.homeTeamId]);
              } else {
                  await this.query(`UPDATE ${TABLES.TEAMS} SET draws = draws + 1 WHERE id = ?`, [match.homeTeamId]);
              }
              
              // Update Player Stats (Goals)
              if (match.goals) {
                 for (const goal of match.goals) {
                    // Simple increment for MVP/Goals
                    await this.query(`UPDATE app_users_v2 SET stats = json_set(stats, '$.goals', COALESCE(json_extract(stats, '$.goals'), 0) + 1) WHERE id = ?`, [goal.playerId]); 
                 }
              }
          }

          // --- NOTIFICATION LOGIC FOR INVITES ---
          // If scheduling pending, notify opponent owner
          if ((match.status === 'PENDING' || match.status === 'SCHEDULED') && match.awayTeamId) {
             const teamRes = await this.query(`SELECT owner_id, name, logo_url FROM ${TABLES.TEAMS} WHERE id = ?`, [match.awayTeamId]);
             const homeTeamRes = await this.query(`SELECT name, logo_url FROM ${TABLES.TEAMS} WHERE id = ?`, [match.homeTeamId]);
             
             if (Array.isArray(teamRes) && teamRes.length > 0 && Array.isArray(homeTeamRes) && homeTeamRes.length > 0) {
                 const awayOwnerId = teamRes[0].owner_id;
                 const homeName = homeTeamRes[0].name;
                 const homeLogo = homeTeamRes[0].logo_url;
                 
                 await this.createNotification(
                     awayOwnerId,
                     'MATCH_INVITE',
                     'Convite para Jogo!',
                     `${homeName} quer jogar contra você dia ${match.date.toLocaleDateString()}.`,
                     match.homeTeamId,
                     homeLogo,
                     { matchId: match.id, teamId: match.homeTeamId } // teamId here is "who invited"
                 );
             }
          }

          return true;
      } catch (e) {
          console.error("Create Match failed", e);
          return false;
      }
  }

  async updateMatchStatus(matchId: string, status: MatchStatus, verified: boolean): Promise<boolean> {
      try {
          await this.query(
              `UPDATE ${TABLES.MATCHES} SET status = ?, is_verified = ? WHERE id = ?`,
              [status, verified ? 1 : 0, matchId]
          );
          return true;
      } catch(e) {
          console.error(e);
          return false;
      }
  }

  async updateMatchDateAndStatus(matchId: string, newDate: Date, status: MatchStatus, updatedByTeamId: string): Promise<boolean> {
      try {
          await this.query(
              `UPDATE ${TABLES.MATCHES} SET date = ?, status = ? WHERE id = ?`,
              [newDate.toISOString(), status, matchId]
          );

          // Get Match Details to find opponent
          const matches = await this.query(`SELECT * FROM ${TABLES.MATCHES} WHERE id = ?`, [matchId]);
          if(Array.isArray(matches) && matches.length > 0) {
              const m = matches[0];
              // If updatedBy is home, notify away owner. If updatedBy is away, notify home owner.
              const targetTeamId = m.home_team_id === updatedByTeamId ? m.away_team_id : m.home_team_id;
              const sourceTeamId = updatedByTeamId;

              const targetTeamRes = await this.query(`SELECT owner_id FROM ${TABLES.TEAMS} WHERE id = ?`, [targetTeamId]);
              const sourceTeamRes = await this.query(`SELECT name, logo_url FROM ${TABLES.TEAMS} WHERE id = ?`, [sourceTeamId]);

              if(targetTeamRes.length > 0 && sourceTeamRes.length > 0) {
                   await this.createNotification(
                       targetTeamRes[0].owner_id,
                       'MATCH_UPDATE',
                       'Contra-proposta Recebida',
                       `${sourceTeamRes[0].name} sugeriu uma nova data para o jogo.`,
                       sourceTeamId,
                       sourceTeamRes[0].logo_url,
                       { matchId, proposedDate: newDate.toISOString() }
                   );
              }
          }

          return true;
      } catch(e) {
          console.error(e);
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
            courtId: row.court_id,
            homeTeamId: row.home_team_id,
            awayTeamName: row.away_team_name,
            awayTeamId: row.away_team_id,
            homeScore: row.home_score,
            awayScore: row.away_score,
            isVerified: Boolean(row.is_verified),
            status: row.status as MatchStatus || 'FINISHED',
            goals: row.stats_json ? JSON.parse(row.stats_json) : []
        })) : [];
    } catch (e) {
        return [];
    }
  }
}

export const dbService = new DatabaseService();