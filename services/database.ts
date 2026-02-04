import { 
  User, Team, Match, Territory, Court, PickupGame, 
  Notification, UserRole, MatchStatus
} from '../types';
import { 
  MOCK_AUTH_DB, MOCK_TEAMS, MOCK_TERRITORIES, MOCK_MATCHES 
} from '../constants';

const STORAGE_KEYS = {
  USERS: 'fut_dom_users',
  TEAMS: 'fut_dom_teams',
  MATCHES: 'fut_dom_matches',
  TERRITORIES: 'fut_dom_territories',
  COURTS: 'fut_dom_courts',
  PICKUP_GAMES: 'fut_dom_pickups',
  NOTIFICATIONS: 'fut_dom_notifications'
};

class DatabaseService {
  private delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private save<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private load<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  }

  async initSchema(): Promise<void> {
    await this.delay();
    // Initialize with mock data if empty
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.save(STORAGE_KEYS.USERS, MOCK_AUTH_DB);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
      this.save(STORAGE_KEYS.TEAMS, MOCK_TEAMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TERRITORIES)) {
      this.save(STORAGE_KEYS.TERRITORIES, MOCK_TERRITORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
      this.save(STORAGE_KEYS.MATCHES, MOCK_MATCHES);
    }
  }

  // --- GETTERS ---
  
  async getTeams(): Promise<Team[]> {
    await this.delay();
    return this.load<Team[]>(STORAGE_KEYS.TEAMS, []);
  }

  async getMatches(): Promise<Match[]> {
    await this.delay();
    const matches = this.load<Match[]>(STORAGE_KEYS.MATCHES, []);
    // Restore dates from JSON strings
    return matches.map(m => ({ ...m, date: new Date(m.date) }));
  }

  async getTerritories(): Promise<Territory[]> {
    await this.delay();
    return this.load<Territory[]>(STORAGE_KEYS.TERRITORIES, []);
  }

  async getCourts(): Promise<Court[]> {
    await this.delay();
    return this.load<Court[]>(STORAGE_KEYS.COURTS, []);
  }

  async getPickupGames(): Promise<PickupGame[]> {
    await this.delay();
    const games = this.load<PickupGame[]>(STORAGE_KEYS.PICKUP_GAMES, []);
    return games.map(g => ({ ...g, date: new Date(g.date) }));
  }

  async getUserById(id: string): Promise<User | undefined> {
    await this.delay(100);
    const users = this.load<User[]>(STORAGE_KEYS.USERS, []);
    return users.find(u => u.id === id);
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    await this.delay(100);
    const users = this.load<User[]>(STORAGE_KEYS.USERS, []);
    return users.filter(u => ids.includes(u.id));
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    await this.delay();
    const all = this.load<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all
        .filter(n => n.userId === userId)
        .map(n => ({ ...n, timestamp: new Date(n.timestamp) }))
        .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // --- ACTIONS ---

  async registerUser(user: User, password?: string): Promise<boolean> {
    await this.delay();
    const users = this.load<User[]>(STORAGE_KEYS.USERS, []);
    if (users.some(u => u.email === user.email)) {
      throw new Error("UNIQUE constraint failed: Email already exists");
    }
    // In a real app we would hash password. Here we simulate it being stored or ignored as auth is simple.
    users.push(user);
    this.save(STORAGE_KEYS.USERS, users);
    return true;
  }

  async loginUser(email: string): Promise<User | null> {
    await this.delay();
    const users = this.load<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.email === email);
    return user || null;
  }

  async createCourt(court: Court): Promise<void> {
    await this.delay();
    const courts = this.load<Court[]>(STORAGE_KEYS.COURTS, []);
    courts.push(court);
    this.save(STORAGE_KEYS.COURTS, courts);
  }

  async createMatch(match: Match): Promise<boolean> {
    await this.delay();
    const matches = this.load<Match[]>(STORAGE_KEYS.MATCHES, []);
    matches.push(match);
    this.save(STORAGE_KEYS.MATCHES, matches);
    
    // Notify opponent
    if (match.status === 'PENDING' && match.awayTeamId) {
        const teams = this.load<Team[]>(STORAGE_KEYS.TEAMS, []);
        const opponentTeam = teams.find(t => t.id === match.awayTeamId);
        if (opponentTeam) {
            this.sendNotification({
                id: `n-${Date.now()}`,
                userId: opponentTeam.ownerId,
                type: 'MATCH_INVITE',
                title: 'Desafio Recebido',
                message: `O time mandante marcou um jogo contra você em ${match.locationName}.`,
                read: false,
                timestamp: new Date(),
                actionData: { matchId: match.id, proposedDate: match.date.toISOString() }
            });
        }
    }
    return true;
  }

  async createPickupGame(game: PickupGame): Promise<boolean> {
      await this.delay();
      const games = this.load<PickupGame[]>(STORAGE_KEYS.PICKUP_GAMES, []);
      games.push(game);
      this.save(STORAGE_KEYS.PICKUP_GAMES, games);
      return true;
  }

  async updateTeamInfo(id: string, name: string, logoUrl: string): Promise<void> {
      await this.delay();
      const teams = this.load<Team[]>(STORAGE_KEYS.TEAMS, []);
      const idx = teams.findIndex(t => t.id === id);
      if (idx !== -1) {
          teams[idx].name = name;
          teams[idx].logoUrl = logoUrl;
          this.save(STORAGE_KEYS.TEAMS, teams);
      }
  }

  async updateUserProfile(user: User): Promise<boolean> {
      await this.delay();
      const users = this.load<User[]>(STORAGE_KEYS.USERS, []);
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
          users[idx] = user;
          this.save(STORAGE_KEYS.USERS, users);
          return true;
      }
      return false;
  }

  async completeOnboarding(userId: string, role: UserRole, profileData: any, teamData: any): Promise<{success: boolean, user?: User}> {
      await this.delay();
      const users = this.load<User[]>(STORAGE_KEYS.USERS, []);
      const userIdx = users.findIndex(u => u.id === userId);
      
      if (userIdx === -1) return { success: false };

      const user = users[userIdx];
      user.role = role;
      user.name = profileData.name;
      user.location = profileData.location;
      user.avatarUrl = profileData.avatarUrl;
      user.onboardingCompleted = true;

      if (role === UserRole.PLAYER) {
          user.position = profileData.position;
          user.shirtNumber = profileData.shirtNumber;
      }

      let newTeamId;
      if (role === UserRole.OWNER && teamData) {
          const teams = this.load<Team[]>(STORAGE_KEYS.TEAMS, []);
          const newTeam: Team = {
              id: `t-${Date.now()}`,
              name: teamData.name,
              logoUrl: teamData.logoUrl,
              wins: 0, losses: 0, draws: 0,
              territoryColor: '#39ff14',
              players: [user],
              ownerId: user.id,
              category: teamData.category,
              homeTurf: teamData.homeTurf,
              city: teamData.city,
              state: teamData.state,
              neighborhood: teamData.neighborhood
          };
          teams.push(newTeam);
          this.save(STORAGE_KEYS.TEAMS, teams);
          
          user.teamId = newTeam.id;
          newTeamId = newTeam.id;
      }

      users[userIdx] = user;
      this.save(STORAGE_KEYS.USERS, users);

      return { success: true, user };
  }

  async requestTrial(userId: string, teamId: string): Promise<boolean> {
      await this.delay();
      const teams = this.load<Team[]>(STORAGE_KEYS.TEAMS, []);
      const team = teams.find(t => t.id === teamId);
      const user = await this.getUserById(userId);

      if (team && user) {
          this.sendNotification({
              id: `n-${Date.now()}`,
              userId: team.ownerId,
              type: 'TRIAL_REQUEST',
              title: 'Pedido de Teste',
              message: `${user.name} quer entrar no seu time.`,
              relatedId: user.id,
              relatedImage: user.avatarUrl,
              read: false,
              timestamp: new Date(),
              actionData: { teamId, playerId: userId }
          });
          return true;
      }
      return false;
  }

  async acceptTrial(notifId: string, teamId: string, playerId: string): Promise<boolean> {
      await this.delay();
      const users = this.load<User[]>(STORAGE_KEYS.USERS, []);
      const teams = this.load<Team[]>(STORAGE_KEYS.TEAMS, []);

      const userIdx = users.findIndex(u => u.id === playerId);
      const teamIdx = teams.findIndex(t => t.id === teamId);

      if (userIdx !== -1 && teamIdx !== -1) {
          const user = users[userIdx];
          user.teamId = teamId;
          user.role = UserRole.PLAYER; // Assume player role in team
          
          teams[teamIdx].players.push(user);
          
          this.save(STORAGE_KEYS.USERS, users);
          this.save(STORAGE_KEYS.TEAMS, teams);
          this.markNotificationRead(notifId);
          
          // Notify player
          this.sendNotification({
              id: `n-welcome-${Date.now()}`,
              userId: playerId,
              type: 'SYSTEM',
              title: 'Proposta Aceita!',
              message: `Você agora faz parte do ${teams[teamIdx].name}.`,
              relatedId: teamId,
              relatedImage: teams[teamIdx].logoUrl,
              read: false,
              timestamp: new Date()
          });

          return true;
      }
      return false;
  }

  async addPlayerByEmail(email: string, teamId: string): Promise<{ success: boolean, message: string, user?: User }> {
      await this.delay();
      const users = this.load<User[]>(STORAGE_KEYS.USERS, []);
      const userIdx = users.findIndex(u => u.email === email);
      
      if (userIdx === -1) {
          return { success: false, message: 'Usuário não encontrado' };
      }
      
      const user = users[userIdx];
      user.teamId = teamId;
      user.role = UserRole.PLAYER;
      
      const teams = this.load<Team[]>(STORAGE_KEYS.TEAMS, []);
      const teamIdx = teams.findIndex(t => t.id === teamId);
      if (teamIdx !== -1) {
          if (!teams[teamIdx].players.some(p => p.id === user.id)) {
              teams[teamIdx].players.push(user);
              this.save(STORAGE_KEYS.TEAMS, teams);
          }
      }

      this.save(STORAGE_KEYS.USERS, users);
      
      return { success: true, message: 'Jogador adicionado', user };
  }

  async markNotificationRead(id: string): Promise<void> {
      const notifs = this.load<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      const idx = notifs.findIndex(n => n.id === id);
      if (idx !== -1) {
          notifs[idx].read = true;
          this.save(STORAGE_KEYS.NOTIFICATIONS, notifs);
      }
  }

  async updateMatchStatus(matchId: string, status: MatchStatus, isVerified: boolean): Promise<boolean> {
      await this.delay();
      const matches = this.load<Match[]>(STORAGE_KEYS.MATCHES, []);
      const idx = matches.findIndex(m => m.id === matchId);
      if (idx !== -1) {
          matches[idx].status = status;
          matches[idx].isVerified = isVerified;
          this.save(STORAGE_KEYS.MATCHES, matches);
          return true;
      }
      return false;
  }

  async updateMatchDateAndStatus(matchId: string, date: Date, status: MatchStatus, teamId: string): Promise<boolean> {
      await this.delay();
      const matches = this.load<Match[]>(STORAGE_KEYS.MATCHES, []);
      const idx = matches.findIndex(m => m.id === matchId);
      if (idx !== -1) {
          matches[idx].date = date;
          matches[idx].status = status;
          this.save(STORAGE_KEYS.MATCHES, matches);
          
          // Notify other team
          const match = matches[idx];
          const otherTeamId = match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId;
          if (otherTeamId) {
             const teams = this.load<Team[]>(STORAGE_KEYS.TEAMS, []);
             const otherTeam = teams.find(t => t.id === otherTeamId);
             if (otherTeam) {
                 this.sendNotification({
                     id: `n-${Date.now()}`,
                     userId: otherTeam.ownerId,
                     type: 'MATCH_UPDATE',
                     title: 'Contra-proposta',
                     message: 'Nova data sugerida para o jogo.',
                     read: false,
                     timestamp: new Date(),
                     actionData: { matchId: match.id, proposedDate: date.toISOString() }
                 });
             }
          }
          return true;
      }
      return false;
  }

  async joinPickupGame(gameId: string, userId: string, date: Date | string): Promise<{success: boolean, message?: string}> {
      await this.delay();
      const games = this.load<PickupGame[]>(STORAGE_KEYS.PICKUP_GAMES, []);
      const idx = games.findIndex(g => g.id === gameId);
      if (idx !== -1) {
          if (!games[idx].confirmedPlayers.includes(userId)) {
              if (games[idx].confirmedPlayers.length >= games[idx].maxPlayers) {
                  return { success: false, message: 'Jogo lotado' };
              }
              games[idx].confirmedPlayers.push(userId);
              this.save(STORAGE_KEYS.PICKUP_GAMES, games);
              return { success: true };
          }
      }
      return { success: false, message: 'Jogo não encontrado' };
  }

  async leavePickupGame(gameId: string, userId: string): Promise<boolean> {
      await this.delay();
      const games = this.load<PickupGame[]>(STORAGE_KEYS.PICKUP_GAMES, []);
      const idx = games.findIndex(g => g.id === gameId);
      if (idx !== -1) {
          games[idx].confirmedPlayers = games[idx].confirmedPlayers.filter(id => id !== userId);
          this.save(STORAGE_KEYS.PICKUP_GAMES, games);
          return true;
      }
      return false;
  }

  // --- INTERNAL HELPERS ---
  
  private async sendNotification(notif: Notification) {
      const notifs = this.load<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      notifs.push(notif);
      this.save(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }
}

export const dbService = new DatabaseService();
