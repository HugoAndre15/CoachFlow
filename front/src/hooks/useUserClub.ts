import { useState, useEffect, useCallback } from 'react';
import { clubService, Club } from '@/services/clubService';
import { useAuth } from '@/contexts/AuthContext';

export function useUserClub() {
    const { user } = useAuth();
    const [club, setClub] = useState<Club | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClub = useCallback(async () => {
        // Ne pas faire de requête si l'utilisateur n'est pas connecté
        if (!user) {
            setClub(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        try {
            setIsLoading(true);
            const clubs = await clubService.getMyClubs();
            // Prendre le premier club pour l'instant (V1)
            setClub(clubs.length > 0 ? clubs[0] : null);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching club:', err);
            setError(err.message || 'Failed to fetch club');
            setClub(null);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchClub();
    }, [fetchClub]);

    return { club, isLoading, error, refetch: fetchClub };
}
