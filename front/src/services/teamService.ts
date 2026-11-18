import api from './api';

export interface Team {
    id: string;
    name: string;
    category: string;
    club_id: string;
    _count?: {
        players: number;
        teamUsers: number;
    };
    myRole?: string;
}

export interface TeamsResponse {
    data: Team[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreateTeamPayload {
    name: string;
    category: string;
    club_id: string;
}

export const teamService = {
    getTeamsByClub: async (clubId: string): Promise<Team[]> => {
        const teams: Team[] = [];
        let page = 1;
        let totalPages: number;
        do {
            const response = await api.get<TeamsResponse>('/teams', { params: { clubId, limit: 50, page } });
            teams.push(...response.data.data);
            totalPages = response.data.meta.totalPages;
            page += 1;
        } while (page <= totalPages);
        return teams;
    },

    getTeam: async (teamId: string): Promise<Team> => {
        const response = await api.get(`/teams/${teamId}`);
        return response.data;
    },

    createTeam: async (payload: CreateTeamPayload): Promise<Team> => {
        const response = await api.post<Team>('/teams', payload);
        return response.data;
    },

    updateTeam: async (teamId: string, payload: Partial<CreateTeamPayload>): Promise<Team> => {
        const response = await api.patch<Team>(`/teams/${teamId}`, payload);
        return response.data;
    },

    deleteTeam: async (teamId: string): Promise<void> => {
        await api.delete(`/teams/${teamId}`);
    },
};
