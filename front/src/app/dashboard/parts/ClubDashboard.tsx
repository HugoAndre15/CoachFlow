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
        <p className="text-accent-green font-medium text-sm mt-1">
          {club.name}
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Matchs joués"
          value={24}
          subtitle="+3 ce mois"
          iconBgColor="bg-accent-green/10"
          iconColor="text-accent-green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />

        <StatsCard
          title="Victoires"
          value={16}
          subtitle="66.7% de réussite"
          iconBgColor="bg-green-100 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <StatsCard
          title="Joueurs actifs"
          value={28}
          subtitle="3 équipes"
          iconBgColor="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Buts marqués"
          value={52}
          subtitle="2.2 par match"
          iconBgColor="bg-purple-100 dark:bg-purple-900/20"
          iconColor="text-purple-600 dark:text-purple-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-lightest mb-4">Prochains matchs</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-neutral-lightest">FC Bordeaux</p>
                <p className="text-sm text-gray-500 dark:text-neutral">Samedi 18 fév • 15h00</p>
              </div>
              <span className="px-3 py-1 bg-accent-green/10 text-accent-green text-xs font-medium rounded-full">Domicile</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-neutral-lightest">AS Lyon</p>
                <p className="text-sm text-gray-500 dark:text-neutral">Mercredi 22 fév • 18h30</p>
              </div>
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full">Extérieur</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-lightest mb-4">Meilleurs buteurs</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-green/20 rounded-full flex items-center justify-center font-bold text-accent-green">1</div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-neutral-lightest">Thomas Martin</p>
                  <p className="text-sm text-gray-500 dark:text-neutral">Attaquant</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-neutral-lightest">12</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-light rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-neutral">2</div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-neutral-lightest">Lucas Dubois</p>
                  <p className="text-sm text-gray-500 dark:text-neutral">Milieu</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-neutral-lightest">8</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-200 dark:bg-orange-900/20 rounded-full flex items-center justify-center font-bold text-orange-600 dark:text-orange-400">3</div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-neutral-lightest">Antoine Leroy</p>
                  <p className="text-sm text-gray-500 dark:text-neutral">Attaquant</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-neutral-lightest">7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
