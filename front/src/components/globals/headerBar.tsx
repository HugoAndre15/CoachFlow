'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function HeaderBar() {
    const { user, logout, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (isLoading) return null;

    return (
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark/90 backdrop-blur-lg border-b border-neutral/30 dark:border-dark-light/30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-semibold text-dark dark:text-white hover:scale-105 transition-transform cursor-pointer">
                CoachFlow
              </h1>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              <a href="#" className="px-3 py-2 rounded-lg text-sm font-medium text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter hover:text-dark dark:hover:text-white transition-all duration-200">
                Fonctionnalités
              </a>
              <a href="#" className="px-3 py-2 rounded-lg text-sm font-medium text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter hover:text-dark dark:hover:text-white transition-all duration-200">
                Tarifs
              </a>
              <a href="#" className="px-3 py-2 rounded-lg text-sm font-medium text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter hover:text-dark dark:hover:text-white transition-all duration-200">
                Abonnements
              </a>
              <a href="#" className="px-3 py-2 rounded-lg text-sm font-medium text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter hover:text-dark dark:hover:text-white transition-all duration-200">
                Contact
              </a>
            </nav>

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-lighter/50 dark:bg-dark-lighter">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-green to-accent-blue flex items-center justify-center text-white text-sm font-bold">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <span className="text-sm font-medium text-dark dark:text-neutral-lighter">
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-white bg-accent-red rounded-lg hover:bg-accent-red/90 hover:shadow-lg hover:shadow-accent-red/25 transition-all duration-200 cursor-pointer"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <a 
                    href="/login" 
                    className="relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 
                    bg-neutral-lighter text-dark shadow-md hover:shadow-lg hover:scale-[1.02]
                    dark:text-white dark:bg-white/2.5 dark:border dark:border-white/50 dark:backdrop-blur-sm 
                    dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.25)]
                    dark:hover:bg-white/30 dark:hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_6px_16px_rgba(0,0,0,0.3)]
                    dark:before:absolute dark:before:inset-0 dark:before:rounded-lg dark:before:bg-gradient-to-br dark:before:from-white/60 dark:before:via-transparent dark:before:to-transparent dark:before:opacity-70 dark:before:pointer-events-none
                    dark:after:absolute dark:after:inset-0 dark:after:rounded-lg dark:after:bg-gradient-to-tl dark:after:from-white/30 dark:after:via-transparent dark:after:to-transparent dark:after:opacity-50 dark:after:pointer-events-none"
                  >
                    <span className="relative z-10">Connexion</span>
                  </a>
                  <a 
                    href="/register" 
                    className="px-4 py-2 text-sm font-medium text-white bg-accent-green rounded-lg shadow-md hover:shadow-lg hover:shadow-accent-green/30 hover:scale-105 transition-all duration-200"
                  >
                    Créer un compte
                  </a>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter transition-all duration-200"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral/30 dark:border-dark-light/30 bg-white/95 dark:bg-dark/95 backdrop-blur-lg animate-in slide-in-from-top-4 duration-300">
            <div className="px-4 py-4 space-y-3">
              <a href="#" className="block px-3 py-2 rounded-lg text-sm font-medium text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter transition-all duration-200">
                Fonctionnalités
              </a>
              <a href="#" className="block px-3 py-2 rounded-lg text-sm font-medium text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter transition-all duration-200">
                Tarifs
              </a>
              <a href="#" className="block px-3 py-2 rounded-lg text-sm font-medium text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter transition-all duration-200">
                Abonnements
              </a>
              <a href="#" className="block px-3 py-2 rounded-lg text-sm font-medium text-dark-lighter dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-lighter transition-all duration-200">
                Contact
              </a>
              
              <div className="pt-4 border-t border-neutral/30 dark:border-dark-light/30 space-y-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-lighter/50 dark:bg-dark-lighter">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-green to-accent-blue flex items-center justify-center text-white text-sm font-bold">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <span className="text-sm font-medium text-dark dark:text-neutral-lighter">
                        {user.first_name} {user.last_name}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-accent-red rounded-lg hover:bg-accent-red/90 transition-all duration-200 cursor-pointer"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <a 
                      href="/login" 
                      className="relative block w-full px-4 py-2 text-sm font-medium text-center rounded-lg transition-all duration-300
                      bg-neutral-lighter text-dark shadow-md hover:shadow-lg hover:scale-[1.02]
                      dark:text-white dark:bg-white/2.5 dark:border dark:border-white/50 dark:backdrop-blur-sm 
                      dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.25)]
                      dark:hover:bg-white/30 dark:hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_6px_16px_rgba(0,0,0,0.3)]
                      dark:before:absolute dark:before:inset-0 dark:before:rounded-lg dark:before:bg-gradient-to-br dark:before:from-white/60 dark:before:via-transparent dark:before:to-transparent dark:before:opacity-70 dark:before:pointer-events-none
                      dark:after:absolute dark:after:inset-0 dark:after:rounded-lg dark:after:bg-gradient-to-tl dark:after:from-white/30 dark:after:via-transparent dark:after:to-transparent dark:after:opacity-50 dark:after:pointer-events-none"
                    >
                      <span className="relative z-10">Connexion</span>
                    </a>
                    <a 
                      href="/register" 
                      className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-accent-green rounded-lg shadow-md hover:shadow-lg hover:shadow-accent-green/30 transition-all duration-200"
                    >
                      Créer un compte
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    );
}