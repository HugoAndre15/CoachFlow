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
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = authService.getUser();

    if (token && storedUser) {
      setUser(storedUser);
      // Rediriger depuis login/register vers dashboard uniquement
      if (pathname === '/login' || pathname === '/register') {
        router.replace('/dashboard');
      }
    } else {
      // Rediriger uniquement les routes /dashboard/* vers login si pas connecté
      if (pathname.startsWith('/dashboard')) {
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      }
    }

    setIsLoading(false);
  }, [pathname, router]);

    const login = async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        setUser(response.user);
        
        const searchParams = new URLSearchParams(window.location.search);
        const returnUrl = searchParams.get('returnUrl') || '/';
        
        // Validation de sécurité
        if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
            router.push(decodeURIComponent(returnUrl));
        } else {
            router.push('/');
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

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-lightest dark:bg-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-green"></div>
          <p className="text-dark-lighter dark:text-neutral text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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
