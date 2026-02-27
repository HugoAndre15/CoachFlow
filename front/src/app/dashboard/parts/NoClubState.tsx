'use client';

import { useState } from 'react';
import CreateClubModal from '../clubs/parts/CreateClubModal';
import JoinClubModal from '../clubs/parts/JoinClubModal';

interface NoClubStateProps {
  onClubCreated: () => void;
}

export default function NoClubState({ onClubCreated }: NoClubStateProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleClubCreated = () => {
    onClubCreated();
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        {/* Formes décoratives avec effet blur */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-20 w-96 h-96 bg-accent-green rounded-full blur-3xl opacity-20"></div>
          <div className="absolute -bottom-40 -right-20 w-110 h-110 bg-accent-blue rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 -right-40 w-120 h-120 bg-accent-red rounded-full blur-3xl opacity-15"></div>
        </div>

        <div className="max-w-lg w-full text-center relative z-10">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-accent-green rounded-2xl flex items-center justify-center shadow-lg shadow-accent-green/20">
              <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Bienvenue sur CoachFlow
          </h1>

          {/* Description */}
          <p className="text-grey-medium mb-10 max-w-md mx-auto">
            Créez votre premier club pour commencer à gérer vos équipes, suivre les statistiques et organiser vos matchs.
          </p>

          {/* Checklist Card */}
          <div className="mb-10 bg-dark-lighter/60 border border-dark-light/30 rounded-2xl p-6 backdrop-blur-sm max-w-sm mx-auto">
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-accent-green/15 border border-accent-green/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-lightest">Gérer plusieurs équipes et catégories</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-accent-green/15 border border-accent-green/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-lightest">Suivre les performances en temps réel</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-accent-green/15 border border-accent-green/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-lightest">Analyser et planifier vos matchs</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            {/* Créer mon club — green solid */}
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 px-6 py-3.5 bg-accent-green text-white rounded-xl font-medium hover:bg-accent-green/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-accent-green/20 hover:shadow-accent-green/30 hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer mon club
            </button>

            {/* Rejoindre un club — liquid glass effect */}
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="relative flex-1 px-6 py-3.5 rounded-xl font-medium transition-all duration-300
                text-white bg-white/5 border border-white/20 backdrop-blur-sm
                shadow-[inset_0_1px_0px_rgba(255,255,255,0.15),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.25)]
                hover:bg-white/10 hover:scale-[1.02]
                hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.2),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_6px_16px_rgba(0,0,0,0.3)]
                before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent before:pointer-events-none
                after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-tl after:from-white/5 after:via-transparent after:to-transparent after:pointer-events-none
                flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Rejoindre un club
              </span>
            </button>
          </div>
        </div>
      </div>

      <CreateClubModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleClubCreated}
      />

      <JoinClubModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleClubCreated}
      />
    </>
  );
}
