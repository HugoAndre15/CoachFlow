'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/authService';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mounted: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = authService.getUser();
    if (token && storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
    setMounted(true);
  }, []);

  // Handle redirects (only after mounted)
  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem('token');
    const storedUser = authService.getUser();

    if (token && storedUser) {
      if (pathname === '/login' || pathname === '/register') {
        router.replace('/dashboard');
      }
    } else {
      if (pathname.startsWith('/dashboard')) {
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      }
    }
  }, [pathname, router, mounted]);

    const login = async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        setUser(response.user);
        
        const searchParams = new URLSearchParams(window.location.search);
        const returnUrl = searchParams.get('returnUrl') || '/dashboard'; // Changez '/' par '/dashboard'
        
        // Validation de sécurité
        if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
            router.push(decodeURIComponent(returnUrl));
        } else {
            router.push('/dashboard'); // Changez '/' par '/dashboard'
        }
    };

  const register = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    await authService.register(data);
    router.push('/login');
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        mounted,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
