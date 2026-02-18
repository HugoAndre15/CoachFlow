'use client';

import { Club } from '@/services/clubService';
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
        <h2 className="text-accent-green font-bold text-xl uppercase mt-1">
          {club.name}
        </h2>
      </div>
    </div>
  );
}
