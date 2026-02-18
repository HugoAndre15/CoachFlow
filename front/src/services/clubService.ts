import api from './api';

export interface Club {
    id: string;
    name: string;
    role: string;
    created_at: string;
}

export interface CreateClubDto {
    name: string;
}

export const clubService = {
    getMyClubs: async (): Promise<Club[]> => {
        const response = await api.get('/users/me/clubs');
        return response.data;
    },

    createClub: async (name: string): Promise<Club> => {
        const response = await api.post('/clubs', { name });
        return response.data;
    },
};
