import api from './api';

export type PlayerPosition = 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';
export type PlayerStrongFoot = 'LEFT' | 'RIGHT' | 'BOTH';
export type PlayerStatus = 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'RETIRED';

export interface Player {
    id: string;
    first_name: string;
    last_name: string;
    position?: PlayerPosition;
    strong_foot?: PlayerStrongFoot;
    jersey_number?: number;
    status: PlayerStatus;
    team_id: string;
    user_id?: string;
    created_at: string;
    team?: {
        id: string;
        name: string;
        category: string;
    };
}

export interface PlayerStats {
    player_id: string;
    player_name: string;
    total_matches: number;
    matches_as_starter: number;
    matches_as_substitute: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    recoveries: number;
    ball_losses: number;
    goals_by_zone: Record<string, number>;
    goals_by_body_part: Record<string, number>;
}

export type PlayerStatsPeriod = 'ALL' | 'SEASON' | 'LAST_30_DAYS';
export interface PlayerOverviewStats extends PlayerStats {
    unused_substitute: number;
    attendance: { present: number; absent: number; uncertain: number; unknown: number; recorded: number; rate: number | null };
}
export interface PlayerOverview extends Player { stats: PlayerOverviewStats }
export interface TeamPlayerOverview {
    players: PlayerOverview[];
    meta: { team_id: string; period: PlayerStatsPeriod; from: string | null; to: string; completed_matches: number };
}
export type UpdatePlayerPayload = Omit<Partial<CreatePlayerPayload>, 'position' | 'strong_foot' | 'jersey_number'> & {
    position?: PlayerPosition | null;
    strong_foot?: PlayerStrongFoot | null;
    jersey_number?: number | null;
};

export interface CreatePlayerPayload {
    first_name: string;
    last_name: string;
    team_id: string;
    position?: PlayerPosition;
    strong_foot?: PlayerStrongFoot;
    jersey_number?: number;
    status?: PlayerStatus;
}

export interface PlayersResponse {
    data: Player[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const playerService = {
    getTeamOverview: async (teamId: string, period: PlayerStatsPeriod): Promise<TeamPlayerOverview> => {
        const response = await api.get<TeamPlayerOverview>('/players/overview', { params: { teamId, period } });
        return response.data;
    },
    getPlayersByTeam: async (teamId: string): Promise<Player[]> => {
        const response = await api.get<PlayersResponse>(`/players?teamId=${teamId}&limit=100`);
        return response.data.data;
    },

    getPlayer: async (playerId: string): Promise<Player> => {
        const response = await api.get<Player>(`/players/${playerId}`);
        return response.data;
    },

    getPlayerStats: async (playerId: string): Promise<PlayerStats> => {
        const response = await api.get<PlayerStats>(`/players/${playerId}/stats`);
        return response.data;
    },

    createPlayer: async (payload: CreatePlayerPayload): Promise<Player> => {
        const response = await api.post<Player>('/players', payload);
        return response.data;
    },

    updatePlayer: async (playerId: string, payload: UpdatePlayerPayload): Promise<Player> => {
        const response = await api.patch<Player>(`/players/${playerId}`, payload);
        return response.data;
    },

    archivePlayer: async (playerId: string): Promise<void> => {
        await api.delete(`/players/${playerId}`);
    },
};
