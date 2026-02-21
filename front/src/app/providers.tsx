'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ClubTeamProvider } from '@/contexts/ClubTeamContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ClubTeamProvider>
        {children}
      </ClubTeamProvider>
    </AuthProvider>
  );
}
