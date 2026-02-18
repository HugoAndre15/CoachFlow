'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useUserClub } from "@/hooks/useUserClub";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Logo, NavTabs, TeamSelector, UserMenu, MobileMenu } from "./header/parts";

export default function HeaderBar() {
    const { user, logout, isLoading } = useAuth();
    const { club } = useUserClub();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');
    const hasClub = !!club;

    if (isLoading) return null;

    return (
      <header className="sticky top-0 z-50 bg-white dark:bg-dark border-b border-neutral/20 dark:border-dark-light transition-all duration-300">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Logo />

            {/* Navigation Desktop */}
            <NavTabs isDashboard={!!isDashboard && !!user} hasClub={hasClub} />

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  {/* Sélecteur d'équipe (si club disponible et dans dashboard) */}
                  {isDashboard && hasClub && club && (
                    <>
                      <TeamSelector clubId={club.id} />
                      <div className="h-8 w-px bg-neutral/20 dark:bg-dark-light" />
                    </>
                  )}

                  {/* Menu utilisateur */}
                  <UserMenu user={user} onLogout={logout} />
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href="/login"
                    className="relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 text-white bg-dark-light border border-dark-light hover:bg-dark hover:scale-[1.02] dark:bg-white/5 dark:border-white/20 dark:backdrop-blur-sm dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.15),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.25)] dark:hover:bg-white/10 dark:hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.2),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_6px_16px_rgba(0,0,0,0.3)] dark:before:absolute dark:before:inset-0 dark:before:rounded-lg dark:before:bg-gradient-to-br dark:before:from-white/10 dark:before:via-transparent dark:before:to-transparent dark:before:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:rounded-lg dark:after:bg-gradient-to-tl dark:after:from-white/5 dark:after:via-transparent dark:after:to-transparent dark:after:pointer-events-none"
                  >
                    <span className="relative z-10">Connexion</span>
                  </a>
                  <a
                    href="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-accent-green rounded-lg hover:bg-accent-green/90 transition-colors"
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
                className="p-2 rounded-lg text-dark-light dark:text-neutral hover:bg-neutral-lighter dark:hover:bg-dark-light transition-all duration-200"
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
        <MobileMenu
          isOpen={isMobileMenuOpen}
          isDashboard={!!isDashboard && !!user}
          hasClub={hasClub}
          user={user}
          onLogout={logout}
        />
      </header>
    );
}