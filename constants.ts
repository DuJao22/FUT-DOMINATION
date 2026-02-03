import { Team, Territory, User, UserRole, Post, Match } from './types';

// Mock Database of Users with Passwords for Authentication
export const MOCK_AUTH_DB = [
  {
    id: 'u1',
    name: 'Alex "O Artilheiro" Silva',
    email: 'dono@fut.com',
    password: '123',
    role: UserRole.OWNER,
    teamId: 't1',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    bio: 'Vivendo pelo gol. Capitão do Neon FC.',
    location: 'São Paulo, Brasil',
    following: ['t1'],
    badges: ['👑 Rei do Bairro', '🔥 Artilheiro'],
    stats: { matchesPlayed: 45, goals: 32, mvps: 5, rating: 8.5 }
  },
  {
    id: 'u3',
    name: 'Diego Paredão',
    email: 'goleiro@fut.com',
    password: '123',
    role: UserRole.PLAYER,
    teamId: 't1',
    avatarUrl: 'https://i.pravatar.cc/150?u=u3',
    bio: 'Ninguém passa.',
    location: 'São Paulo, Brasil',
    following: ['t1'],
    badges: ['🧱 A Muralha'],
    stats: { matchesPlayed: 40, goals: 0, mvps: 2, rating: 7.8 }
  },
  {
    id: 'u4',
    name: 'Lucas Ligeiro',
    email: 'atacante@fut.com',
    password: '123',
    role: UserRole.PLAYER,
    teamId: 't1',
    avatarUrl: 'https://i.pravatar.cc/150?u=u4',
    bio: 'Velocidade pura.',
    location: 'São Paulo, Brasil',
    following: ['t1'],
    badges: [],
    stats: { matchesPlayed: 38, goals: 12, mvps: 3, rating: 8.0 }
  },
  {
    id: 'u5',
    name: 'Bruno Maestro',
    email: 'meia@fut.com',
    password: '123',
    role: UserRole.PLAYER,
    teamId: 't1',
    avatarUrl: 'https://i.pravatar.cc/150?u=u5',
    bio: 'O cérebro do time.',
    location: 'São Paulo, Brasil',
    following: ['t1'],
    badges: ['🧠 Playmaker'],
    stats: { matchesPlayed: 42, goals: 5, mvps: 8, rating: 9.1 }
  },
  {
    id: 'fan1',
    name: 'João Torcedor',
    email: 'torcedor@fut.com',
    password: '123',
    role: UserRole.FAN,
    teamId: undefined, // Fans might not belong to a team directly
    avatarUrl: 'https://i.pravatar.cc/150?u=fan1',
    bio: 'Apaixonado por várzea.',
    location: 'Osasco, Brasil',
    following: ['t1', 't2'],
    badges: ['📣 Super Fã'],
    stats: undefined
  },
  {
    id: 'u2',
    name: 'Capitão Rival',
    email: 'rival@fut.com',
    password: '123',
    role: UserRole.OWNER,
    teamId: 't2',
    avatarUrl: 'https://i.pravatar.cc/150?u=rival',
    bio: 'Vamos dominar tudo.',
    location: 'Rio de Janeiro, Brasil',
    following: ['t2'],
    badges: [],
    stats: { matchesPlayed: 20, goals: 10, mvps: 1, rating: 7.5 }
  }
];

// Helper to get players for a team (derived from the auth db)
const getPlayersForTeam = (teamId: string): User[] => {
  return MOCK_AUTH_DB.filter(u => u.teamId === teamId);
}

// Fallback user for initial load if needed (though we will use auth now)
export const CURRENT_USER = MOCK_AUTH_DB[0];

export const MOCK_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Neon FC',
    logoUrl: 'https://picsum.photos/200/200?random=1',
    wins: 12,
    losses: 2,
    draws: 1,
    territoryColor: '#39ff14', // Neon Green
    players: getPlayersForTeam('t1'),
    ownerId: 'u1',
    category: 'Society',
    homeTurf: 'Centro'
  },
  {
    id: 't2',
    name: 'Shadow Strikers',
    logoUrl: 'https://picsum.photos/200/200?random=2',
    wins: 8,
    losses: 5,
    draws: 3,
    territoryColor: '#ef4444', // Red
    players: getPlayersForTeam('t2'),
    ownerId: 'u2',
    category: 'Futsal',
    homeTurf: 'Zona Oeste'
  },
  {
    id: 't3',
    name: 'Pernas de Pau',
    logoUrl: 'https://picsum.photos/200/200?random=3',
    wins: 5,
    losses: 10,
    draws: 0,
    territoryColor: '#fbbf24', // Gold
    players: [],
    ownerId: 'u99',
    category: 'Field',
    homeTurf: 'Zona Norte'
  }
];

export const MOCK_TERRITORIES: Territory[] = [
  { id: 'area1', name: 'Arena Central', ownerTeamId: 't1', lat: 40.7128, lng: -74.0060, points: 500 },
  { id: 'area2', name: 'Parque do Oeste', ownerTeamId: 't2', lat: 40.7200, lng: -74.0100, points: 200 },
  { id: 'area3', name: 'Quadras do Norte', ownerTeamId: null, lat: 40.7300, lng: -74.0000, points: 350 },
  { id: 'area4', name: 'Campo do Porto', ownerTeamId: 't1', lat: 40.7050, lng: -74.0150, points: 600 },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'u2',
    authorName: 'Capitão Rival',
    authorRole: UserRole.OWNER,
    content: 'Vamos tomar a Arena Central semana que vem! Se prepare Neon FC. As ruas serão vermelhas. 🔴',
    likes: 24,
    timestamp: new Date(Date.now() - 3600000),
    teamId: 't2',
    comments: [
      { id: 'c1', authorName: 'Torcedor123', content: 'Fala muito!', timestamp: new Date() }
    ],
    matchContext: {
      opponentName: 'Neon FC',
      location: 'Arena Central'
    }
  },
  {
    id: 'p2',
    authorId: 'u1',
    authorName: 'Alex "O Artilheiro"',
    authorRole: UserRole.OWNER,
    content: 'Ótimo treino hoje. A dominação é nossa. Confiram o novo uniforme no estúdio!',
    imageUrl: 'https://picsum.photos/600/300',
    likes: 45,
    timestamp: new Date(Date.now() - 7200000),
    teamId: 't1',
    comments: []
  },
  {
    id: 'p3',
    authorId: 'u5',
    authorName: 'Bruno Maestro',
    authorRole: UserRole.PLAYER,
    content: 'Atuação de MVP ontem à noite! 🧠⚽️',
    likes: 120,
    timestamp: new Date(Date.now() - 86400000),
    teamId: 't1',
    comments: [
        { id: 'c2', authorName: 'Treinador', content: 'Jogou muito Bruno!', timestamp: new Date() }
    ],
    matchContext: {
        opponentName: 'Pernas de Pau',
        result: 'Vitória 5-0'
    }
  },
  {
    id: 'p4',
    authorId: 'u99',
    authorName: 'Capitão Ferro',
    authorRole: UserRole.OWNER,
    content: 'Procurando amistosos para terça-feira. Chamem na DM!',
    timestamp: new Date(Date.now() - 90000000),
    likes: 5,
    teamId: 't3',
    comments: []
  }
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    date: new Date(Date.now() - 86400000 * 2),
    locationName: 'Arena Central',
    homeTeamId: 't1',
    awayTeamName: 'Pernas de Pau',
    homeScore: 5,
    awayScore: 3,
    isVerified: true
  },
  {
    id: 'm2',
    date: new Date(Date.now() - 86400000 * 7),
    locationName: 'Parque do Oeste',
    homeTeamId: 't1',
    awayTeamName: 'Shadow Strikers',
    homeScore: 2,
    awayScore: 2,
    isVerified: true
  }
];