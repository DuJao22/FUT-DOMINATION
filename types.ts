
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
  
  // Onboarding Control
  onboardingCompleted: boolean;

  // New fields for Team Management
  position?: 'GK' | 'DEF' | 'MID' | 'FWD'; 
  isStarter?: boolean;
  shirtNumber?: number;
  
  // Custom Lineup Coordinates (0-100%)
  lineupX?: number; 
  lineupY?: number;
}

export type TeamCategory = 'Sub-15' | 'Sub-17' | 'Sub-20' | 'Adulto/Livre' | 'Veterano' | 'Society' | 'Futsal';

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
  category: TeamCategory;
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

export interface Court {
  id: string;
  name: string;
  address: string;
  cep: string;
  number: string;
  phone: string;
  lat: number;
  lng: number;
  registeredByTeamId: string;
}

export interface Match {
  id: string;
  date: Date;
  locationName: string;
  courtId?: string; // Optional link to a registered court
  homeTeamId: string;
  awayTeamName: string; // Kept for legacy or non-platform teams
  awayTeamId?: string;  // Link to platform team
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

// --- NEW NOTIFICATION TYPES ---
export type NotificationType = 'TRIAL_REQUEST' | 'TEAM_INVITE' | 'NEW_FOLLOWER' | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string; // Recipient
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // ID of the user/team involved
  relatedImage?: string; // Avatar or Logo
  read: boolean;
  timestamp: Date;
  actionData?: {
      teamId?: string;
      playerId?: string;
  };
}