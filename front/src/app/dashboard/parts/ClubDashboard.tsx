'use client';

import { Club } from '@/services/clubService';
import ClubLogo from '@/components/ui/ClubLogo';
import StatsCard from './StatsCard';

interface ClubDashboardProps {
  club: Club;
  userName: string;
}

export default function ClubDashboard({ club, userName }: ClubDashboardProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-lightest">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-neutral mt-2">
          Bienvenue, {userName} !
        </p>
        <div className="flex items-center gap-3 mt-1">
          <ClubLogo logo={club.logo} name={club.name} size="lg" />
          <h2 className="text-accent-green font-bold text-xl uppercase">
            {club.name}
          </h2>
        </div>
      </div>
    </div>
  );
}
