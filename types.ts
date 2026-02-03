export enum UserRole {
  OWNER = 'OWNER',
  PLAYER = 'PLAYER', // Usually assigned by Owner
  FAN = 'FAN'        // Free user
}

export interface PlayerStats {
  matchesPlayed: number;
  goals: number;
  mvps: number;
  rating: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  stats?: PlayerStats;
  badges?: string[];
  subscriptionActive?: boolean; // For Owners
  following: string[]; // Array of Team IDs the user follows
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  wins: number;
  losses: number;
  draws: number;
  territoryColor: string;
  players: User[];
  ownerId: string;
  category: 'Society' | 'Futsal' | 'Field';
  homeTurf?: string; // Bairro Base
}

export interface Territory {
  id: string;
  name: string;
  ownerTeamId: string | null;
  lat: number;
  lng: number;
  points: number; // Value of the territory
}

export interface Match {
  id: string;
  date: Date;
  locationName: string;
  homeTeamId: string;
  awayTeamName: string; // Simplified for MVP if away team isn't on platform
  homeScore: number;
  awayScore: number;
  isVerified: boolean;
}

export interface Comment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole; // To distinguish Owner vs Player posts
  content: string;
  imageUrl?: string;
  likes: number;
  timestamp: Date;
  teamId: string; // Mandatory for team feed logic
  comments: Comment[];
  matchContext?: {
    opponentName: string;
    result?: string; // "5-3 Win"
    location?: string;
  };
}

export type ImageResolution = '1K' | '2K' | '4K';