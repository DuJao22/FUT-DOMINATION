
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
  
  // Social
  likes: number;

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
  bio?: string; // NEW: Biography for the profile
  wins: number;
  losses: number;
  draws: number;
  territoryColor: string;
  players: User[];
  ownerId: string;
  category: TeamCategory;
  homeTurf?: string; // Nome amigável (ex: Base Osasco)
  
  // Structured Location Data for Rankings
  city?: string;
  state?: string;
  neighborhood?: string;
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
  isPaid: boolean; // NEW: Distinguish Paid vs Free courts
  
  // Ratings
  rating: number;
  ratingCount: number;
}

export type MatchStatus = 'SCHEDULED' | 'FINISHED' | 'PENDING' | 'CANCELLED';

export interface MatchGoal {
    playerId: string;
    playerName: string;
    minute?: number;
    teamId: string;
}

export interface Match {
  id: string;
  date: Date;
  locationName: string;
  courtId?: string; // Optional link to a registered court
  homeTeamId: string;
  awayTeamName: string; // Kept for legacy or non-platform teams
  awayTeamId?: string;  // Link to platform team
  
  // Scores can be optional if scheduled
  homeScore?: number;
  awayScore?: number;
  
  status: MatchStatus;
  isVerified: boolean;

  // New: List of goals for detailed stats
  goals?: MatchGoal[];
}

export interface PickupGame {
  id: string;
  hostId: string;
  hostName: string;
  title: string; // Ex: "Fut de Terça"
  description: string;
  date: Date;
  locationName: string;
  lat: number;
  lng: number;
  maxPlayers: number;
  price?: number; // Optional cost
  confirmedPlayers: string[]; // Array of User IDs
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
export type NotificationType = 'TRIAL_REQUEST' | 'TEAM_INVITE' | 'NEW_FOLLOWER' | 'SYSTEM' | 'MATCH_INVITE' | 'MATCH_UPDATE' | 'PICKUP_JOIN' | 'PROFILE_LIKE';

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
      matchId?: string;
      proposedDate?: string;
      gameId?: string;
  };
}
