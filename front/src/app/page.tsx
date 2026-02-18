'use client';

import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-neutral-lightest">Bienvenue sur CoachFlow 👋</h2>
        <p className="text-gray-600 dark:text-neutral mt-2">{user ? `Connecté en tant que ${user.first_name} ${user.last_name}` : "Veuillez vous connecter pour accéder à votre tableau de bord."}</p>
      </div>
    </div>
  );
}
