'use client';

import { useState } from 'react';
import CreateClubModal from './CreateClubModal';

interface NoClubStateProps {
  onClubCreated: () => void;
}

export default function NoClubState({ onClubCreated }: NoClubStateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClubCreated = () => {
    onClubCreated();
  };

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-accent-green rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-lightest mb-3">
            Bienvenue sur CoachFlow
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-neutral mb-8">
            Créez votre premier club pour commencer à gérer vos équipes, suivre les matchs et optimiser vos performances.
          </p>

          {/* Checklist */}
          <div className="mb-8 space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-dark-lighter dark:bg-neutral-light flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700 dark:text-neutral">Gérez plusieurs équipes et catégories</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-dark-lighter dark:bg-neutral-light flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700 dark:text-neutral">Suivez les performances en temps réel</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-dark-lighter dark:bg-neutral-light flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700 dark:text-neutral">Analysez et optimisez vos matchs</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer un club
            </button>
            <button className="px-6 py-3 bg-transparent text-gray-700 dark:text-neutral border border-gray-300 dark:border-neutral-light rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors">
              Explorer le club
            </button>
          </div>
        </div>
      </div>

      <CreateClubModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleClubCreated}
      />
    </>
  );
}
