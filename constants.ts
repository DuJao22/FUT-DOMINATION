import { Team, Territory, User, UserRole, Post, Match } from './types';

// --- BANCO DE DADOS LIMPO (FRESH START) ---

// Mantemos apenas 1 Usuário Dono para você conseguir acessar o sistema inicialmente.
export const MOCK_AUTH_DB = [
  {
    id: 'admin_user',
    name: 'Admin do Clube',
    email: 'admin@fut.com',
    password: '123',
    role: UserRole.OWNER,
    teamId: 'team_01', // Vinculado ao time inicial
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Clube&background=random',
    bio: 'Conta administrativa.',
    location: 'Brasil',
    following: ['team_01'],
    badges: [],
    stats: { matchesPlayed: 0, goals: 0, mvps: 0, rating: 0 },
    onboardingCompleted: true
  }
];

// Helper to get players for a team
const getPlayersForTeam = (teamId: string): User[] => {
  // Cast to unknown then User[] to handle extra properties like password in mock data
  return MOCK_AUTH_DB.filter(u => u.teamId === teamId) as unknown as User[];
}

// Fallback user
export const CURRENT_USER = MOCK_AUTH_DB[0] as unknown as User;

// Mantemos 1 Time Genérico (Vazio) para o Dono gerenciar
export const MOCK_TEAMS: Team[] = [
  {
    id: 'team_01',
    name: 'Novo Time FC',
    logoUrl: 'https://via.placeholder.com/200/000000/FFFFFF/?text=LOGO',
    wins: 0,
    losses: 0,
    draws: 0,
    territoryColor: '#39ff14', // Neon default
    players: getPlayersForTeam('team_01'),
    ownerId: 'admin_user',
    category: 'Society',
    homeTurf: 'Sem Local'
  }
];

// Territórios resetados (Sem Dono)
export const MOCK_TERRITORIES: Territory[] = [
  { id: 'area1', name: 'Arena Central', ownerTeamId: null, lat: 40.7128, lng: -74.0060, points: 500 },
  { id: 'area2', name: 'Parque do Oeste', ownerTeamId: null, lat: 40.7200, lng: -74.0100, points: 200 },
  { id: 'area3', name: 'Quadras do Norte', ownerTeamId: null, lat: 40.7300, lng: -74.0000, points: 350 },
  { id: 'area4', name: 'Campo do Porto', ownerTeamId: null, lat: 40.7050, lng: -74.0150, points: 600 },
];

// Sem Posts (Feed Vazio)
export const MOCK_POSTS: Post[] = [];

// Sem Partidas (Histórico Vazio)
export const MOCK_MATCHES: Match[] = [];