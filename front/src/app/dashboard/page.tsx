'use client';

import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-lightest">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-neutral mt-2">
          Bienvenue, {user?.first_name} {user?.last_name} !
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-lightest">Statistiques</h3>
          <p className="text-gray-500 dark:text-neutral text-sm mt-2">Vue d'ensemble de vos activités</p>
        </div>
        
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-lightest">Matchs récents</h3>
          <p className="text-gray-500 dark:text-neutral text-sm mt-2">Derniers matchs joués</p>
        </div>
        
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-lightest">Équipe</h3>
          <p className="text-gray-500 dark:text-neutral text-sm mt-2">Gestion de votre équipe</p>
        </div>
      </div>
    </div>
  );
}