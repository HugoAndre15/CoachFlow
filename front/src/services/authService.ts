import api from './api';

export interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

interface Session {
    access_token: string;
    user: { id: string; email: string; first_name: string; last_name: string };
}

function saveSession(session: Session) {
    localStorage.setItem('token', session.access_token);
    localStorage.setItem('user', JSON.stringify(session.user));
    return session;
}

export const authService = {
    register: async (data: RegisterData) => {
        const response = await api.post<Session>('/auth/register', {
            email: data.email,
            password: data.password,
            first_name: data.firstName,
            last_name: data.lastName,
        });
        return saveSession(response.data);
    },
    
    login: async (data: LoginData) => {
        const response = await api.post<Session>('/auth/login', data);
        return saveSession(response.data);
    },
    
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
};
