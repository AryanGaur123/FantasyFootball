export interface League {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  status: string;
  sport: string;
  season_type: string;
  settings: LeagueSettings;
}

export interface LeagueSettings {
  name: string;
  season: string;
  total_rosters: number;
  status: string;
  sport: string;
  season_type: string;
}

export interface User {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
}

export interface Roster {
  roster_id: number;
  owner_id: string;
  players: string[];
  taxi: string[];
  starters: string[];
  reserve: string[];
  metadata: RosterMetadata;
  starters_points: number[];
  players_points: Record<string, number>;
}

export interface RosterMetadata {
  team_name?: string;
  division?: number;
  rank?: number;
}

export interface Matchup {
  matchup_id: number;
  roster_id: number;
  starters: string[];
  starters_points: number[];
  players: string[];
  players_points: Record<string, number>;
  points: number;
}

export interface Player {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  search_rank: number;
  fantasy_positions: string[];
  injury_status?: string;
  injury_notes?: string;
}

export interface AIAnalysis {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  confidence: number;
}
