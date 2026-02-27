import api from './api';

export interface Club {
    id: string;
    name: string;
    city?: string;
    logo?: string;
    invite_code?: string;
    role: string;
    created_at: string;
}

export interface CreateClubDto {
    name: string;
    city?: string;
    logo?: string;
}

export interface JoinClubResponse {
    message: string;
    club: {
        id: string;
        name: string;
        city?: string;
        logo?: string;
    };
}

export const clubService = {
    getMyClubs: async (): Promise<Club[]> => {
        const response = await api.get('/users/me/clubs');
        return response.data;
    },

    createClub: async (data: CreateClubDto): Promise<Club> => {
        const response = await api.post('/clubs', data);
        return response.data;
    },

    joinByCode: async (invite_code: string): Promise<JoinClubResponse> => {
        const response = await api.post('/clubs/join', { invite_code });
        return response.data;
    },

    updateClub: async (id: string, name: string): Promise<Club> => {
        const response = await api.patch(`/clubs/${id}`, { name });
        return response.data;
    },

    deleteClub: async (id: string): Promise<void> => {
        await api.delete(`/clubs/${id}`);
    },
};
