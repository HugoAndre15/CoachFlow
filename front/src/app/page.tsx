'use client';

import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-neutral-lightest">Bienvenue sur CoachFlow 👋</h2>
        <p className="text-gray-600 dark:text-neutral mt-2">Gérez vos matchs, équipes et joueurs depuis votre tableau de bord.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
          <div className="text-3xl mb-3">⚽</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-lightest">Matchs</h3>
          <p className="text-gray-500 dark:text-neutral text-sm mt-1">Planifiez et suivez vos matchs</p>
        </div>
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-lightest">Équipes</h3>
          <p className="text-gray-500 dark:text-neutral text-sm mt-1">Gérez la composition de vos équipes</p>
        </div>
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
          <div className="text-3xl mb-3">🏟️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-lightest">Clubs</h3>
          <p className="text-gray-500 dark:text-neutral text-sm mt-1">Administrez vos clubs</p>
        </div>
      </div>
    </div>
  );
}
