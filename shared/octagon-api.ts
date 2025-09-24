// Octagon API Types
export interface OctagonFighter {
  id: string;
  name: string;
  nickname?: string;
  weight_class: string;
  record?: {
    wins: number;
    losses: number;
    draws: number;
  };
  nationality?: string;
  image_url?: string;
  rank?: number;
  age?: number;
  height?: string;
  reach?: string;
  stance?: string;
  wins?: number;
  losses?: number;
  draws?: number;
}

export interface OctagonDivision {
  id: string;
  name: string;
  weight_limit?: string;
  fighters?: OctagonFighter[];
}

export interface OctagonRankings {
  [division: string]: OctagonFighter[];
}

// Transformed types for our app
export interface AppFighter {
  id: string;
  name: string;
  nickname: string;
  record: { wins: number; losses: number; draws: number; nc?: number };
  weightClass: string;
  rank?: string;
  age?: number;
  height?: string;
  reach?: string;
  stance?: string;
  nationality?: string;
  imageUrl?: string;
  stats: {
    striking: number;
    grappling: number;
    stamina: number;
    chin: number;
    heart: number;
    fightIQ: number;
  };
}
