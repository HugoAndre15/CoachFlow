import api from './api';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MatchLocation = 'HOME' | 'AWAY';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';
export type MatchPlayerStatus = 'STARTER' | 'SUBSTITUTE';

export interface Match {
  id: string;
  team_id: string;
  opponent: string;
  location: MatchLocation;
  match_date: string;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  score?: { home: number; away: number };
  _count?: {
    matchEvents: number;
    matchPlayers: number;
  };
}

export interface MatchDetail extends Match {
  team: {
    id: string;
    name: string;
    category: string;
    club: { id: string; name: string };
  };
  matchPlayers: MatchPlayerEntry[];
  matchEvents: MatchEventEntry[];
  opponentEvents: OpponentEventEntry[];
  score: { home: number; away: number };
}

export interface MatchPlayerEntry {
  id: string;
  match_id: string;
  player_id: string;
  status: MatchPlayerStatus;
  player: {
    id: string;
    first_name: string;
    last_name: string;
    jersey_number?: number;
    position?: string;
  };
}

export interface MatchEventEntry {
  id: string;
  match_id: string;
  player_id: string;
  event_type: string;
  minute: number;
  zone?: string;
  body_part?: string;
  related_player_id?: string;
  created_at?: string;
  player: {
    id: string;
    first_name: string;
    last_name: string;
    jersey_number?: number;
    position?: string;
  };
}

export type MatchEventType = 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'RECOVERY' | 'BALL_LOSS' | 'SUBSTITUTION';
export type FieldZone = 'LEFT' | 'RIGHT' | 'AXIS' | 'DEF_LEFT' | 'DEF_CENTER' | 'DEF_RIGHT' | 'MID_LEFT' | 'MID_CENTER' | 'MID_RIGHT' | 'ATT_LEFT' | 'ATT_CENTER' | 'ATT_RIGHT' | 'BOX' | 'OUTSIDE';
export type BodyPart = 'LEFT_FOOT' | 'RIGHT_FOOT' | 'HEAD';

export type OpponentEventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';

export interface OpponentEventEntry {
  id: string;
  match_id: string;
  event_type: OpponentEventType;
  minute: number;
  jersey_number?: string;
  created_at?: string;
}

export interface CreateOpponentEventPayload {
  event_type: OpponentEventType;
  minute: number;
  jersey_number?: string;
}

export interface CreateMatchPayload {
  team_id: string;
  opponent: string;
  location: MatchLocation;
  match_date: string; // ISO 8601
}

export interface CreateMatchEventPayload {
  player_id: string;
  event_type: MatchEventType;
  minute: number;
  zone?: FieldZone;
  body_part?: BodyPart;
  related_event_id?: string;
  related_player_id?: string;
}

export interface PlayerToAdd {
  player_id: string;
  status: MatchPlayerStatus;
}

export interface MatchesResponse {
  data: Match[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Service ────────────────────────────────────────────────────────────────

export const matchService = {
  /** List matches for a team (paginated, sorted by date desc by default) */
  async getMatchesByTeam(
    teamId: string,
    opts?: { status?: MatchStatus; page?: number; limit?: number }
  ): Promise<Match[]> {
    const params: Record<string, string | number> = { teamId, limit: opts?.limit ?? 100 };
    if (opts?.status) params.status = opts.status;
    if (opts?.page) params.page = opts.page;
    const response = await api.get<MatchesResponse>('/matches', { params });
    return response.data.data;
  },

  /** Get match detail (includes players, events, score) */
  async getMatch(matchId: string): Promise<MatchDetail> {
    const response = await api.get<MatchDetail>(`/matches/${matchId}`);
    return response.data;
  },

  /** Create a match */
  async createMatch(payload: CreateMatchPayload): Promise<Match> {
    const response = await api.post<Match>('/matches', payload);
    return response.data;
  },

  /** Update match info (opponent, location, date) */
  async updateMatch(matchId: string, payload: Partial<CreateMatchPayload>): Promise<Match> {
    const response = await api.patch<Match>(`/matches/${matchId}`, payload);
    return response.data;
  },

  /** Delete a match */
  async deleteMatch(matchId: string): Promise<void> {
    await api.delete(`/matches/${matchId}`);
  },

  /** Change match status: UPCOMING → LIVE → FINISHED */
  async updateStatus(matchId: string, status: MatchStatus): Promise<Match> {
    const response = await api.patch<Match>(`/matches/${matchId}/status`, { status });
    return response.data;
  },

  /** Add players to a match (convocation) */
  async addPlayersToMatch(matchId: string, players: PlayerToAdd[]): Promise<void> {
    await api.post(`/matches/${matchId}/players`, { players });
  },

  /** Get convoked players for a match */
  async getMatchPlayers(matchId: string): Promise<MatchPlayerEntry[]> {
    const response = await api.get<MatchPlayerEntry[]>(`/matches/${matchId}/players`);
    return response.data;
  },

  /** Remove a player from match convocation */
  async removePlayerFromMatch(matchId: string, playerId: string): Promise<void> {
    await api.delete(`/matches/${matchId}/players/${playerId}`);
  },

  /** Get match stats */
  async getMatchStats(matchId: string) {
    const response = await api.get(`/matches/${matchId}/stats`);
    return response.data;
  },

  // ─── Match Events ────────────────────────────────────────────────────

  /** Add an event to a match */
  async addEventToMatch(matchId: string, payload: CreateMatchEventPayload) {
    const response = await api.post(`/matches/${matchId}/events`, payload);
    return response.data;
  },

  /** Get all events of a match (sorted by minute asc) */
  async getMatchEvents(matchId: string): Promise<MatchEventEntry[]> {
    const response = await api.get<MatchEventEntry[]>(`/matches/${matchId}/events`);
    return response.data;
  },

  /** Delete an event (if GOAL, linked ASSISTs are also deleted) */
  async removeMatchEvent(matchId: string, eventId: string): Promise<void> {
    await api.delete(`/matches/${matchId}/events/${eventId}`);
  },

  // ─── Opponent Events ──────────────────────────────────────────────

  /** Add an opponent event */
  async addOpponentEvent(matchId: string, payload: CreateOpponentEventPayload): Promise<OpponentEventEntry> {
    const response = await api.post<OpponentEventEntry>(`/matches/${matchId}/opponent-events`, payload);
    return response.data;
  },

  /** Get all opponent events */
  async getOpponentEvents(matchId: string): Promise<OpponentEventEntry[]> {
    const response = await api.get<OpponentEventEntry[]>(`/matches/${matchId}/opponent-events`);
    return response.data;
  },

  /** Delete an opponent event */
  async removeOpponentEvent(matchId: string, eventId: string): Promise<void> {
    await api.delete(`/matches/${matchId}/opponent-events/${eventId}`);
  },
};
