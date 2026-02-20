import { useState, useEffect, useCallback } from 'react';
import { clubService, Club } from '@/services/clubService';
import { useAuth } from '@/contexts/AuthContext';

export function useUserClub() {
    const { user } = useAuth();
    const [club, setClub] = useState<Club | null>(null);
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const resolveActiveClub = useCallback((clubs: Club[]): Club | null => {
        if (clubs.length === 0) return null;
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('activeClubId') : null;
        if (savedId) {
            const found = clubs.find(c => c.id === savedId);
            if (found) return found;
        }
        return clubs[0];
    }, []);

    const fetchClub = useCallback(async () => {
        if (!user) {
            setClub(null);
            setAllClubs([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        try {
            setIsLoading(true);
            const clubs = await clubService.getMyClubs();
            setAllClubs(clubs);
            const active = resolveActiveClub(clubs);
            setClub(active);
            // Persister si aucun actif en localStorage
            if (active && !localStorage.getItem('activeClubId')) {
                localStorage.setItem('activeClubId', active.id);
            }
            setError(null);
        } catch (err: any) {
            console.error('Error fetching club:', err);
            setError(err.message || 'Failed to fetch club');
            setClub(null);
        } finally {
            setIsLoading(false);
        }
    }, [user, resolveActiveClub]);

    useEffect(() => {
        fetchClub();
    }, [fetchClub]);

    // Écouter les changements de club actif depuis le UserMenu
    useEffect(() => {
        const handleClubChange = (e: CustomEvent) => {
            setClub(e.detail);
        };
        window.addEventListener('activeClubChanged', handleClubChange as EventListener);
        return () => window.removeEventListener('activeClubChanged', handleClubChange as EventListener);
    }, []);

    return { club, allClubs, isLoading, error, refetch: fetchClub };
}
