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

export interface ClubMember {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
}

export interface ClubDetail {
    id: string;
    name: string;
    city?: string;
    logo?: string;
    invite_code?: string;
    created_at: string;
    updated_at: string;
    myRole: string;
    clubUsers: { role: string; user: { id: string; email: string; first_name: string; last_name: string } }[];
    teams: { id: string; name: string; category: string }[];
    _count?: { teams: number; clubUsers: number };
}

export const clubService = {
    getMyClubs: async (): Promise<Club[]> => {
        const response = await api.get('/users/me/clubs');
        return response.data;
    },

    getClubDetail: async (id: string): Promise<ClubDetail> => {
        const response = await api.get<ClubDetail>(`/clubs/${id}`);
        return response.data;
    },

    getClubMembers: async (id: string): Promise<ClubMember[]> => {
        const response = await api.get(`/clubs/${id}/members`);
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

    updateClub: async (id: string, data: Partial<CreateClubDto>): Promise<Club> => {
        const response = await api.patch(`/clubs/${id}`, data);
        return response.data;
    },

    deleteClub: async (id: string): Promise<void> => {
        await api.delete(`/clubs/${id}`);
    },
};
