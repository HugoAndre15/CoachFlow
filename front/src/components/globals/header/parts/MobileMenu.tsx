'use client';

import { usePathname } from "next/navigation";
import { dashboardNavItems, publicNavItems } from "./NavTabs";

interface MobileMenuProps {
  isOpen: boolean;
  isDashboard: boolean;
  hasClub: boolean;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  onLogout: () => void;
}

export default function MobileMenu({ isOpen, isDashboard, hasClub, user, onLogout }: MobileMenuProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  const navItems = isDashboard && hasClub
    ? dashboardNavItems
    : !isDashboard
      ? publicNavItems
      : [];

  return (
    <div className="md:hidden border-t border-neutral/20 dark:border-dark-light bg-white/95 dark:bg-dark-lighter/95 backdrop-blur-lg animate-in slide-in-from-top-4 duration-300">
      <div className="px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.matchExact
            ? pathname === item.href
            : pathname?.startsWith(item.href);

          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-green/10 text-accent-green'
                  : 'text-dark-light dark:text-neutral hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 hover:text-dark dark:hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          );
        })}

        <div className="pt-3 border-t border-neutral/20 dark:border-dark-light space-y-1">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-neutral-lighter dark:bg-dark-light flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-dark-light dark:text-neutral">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-dark-light/70 dark:text-neutral">{user.email}</p>
                </div>
              </div>
              <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-accent-green font-medium hover:bg-accent-green/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" />
                </svg>
                Dashboard
              </a>
              <a href="/dashboard/clubs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-light dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 hover:text-dark dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-dark-light/70 dark:text-neutral">
                  <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
                </svg>
                Mes Clubs
              </a>
              <a href="/dashboard/mon-compte" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-light dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 hover:text-dark dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-dark-light/70 dark:text-neutral">
                  <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                </svg>
                Mon Compte
              </a>
              <a href="/dashboard/parametres" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-light dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 hover:text-dark dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-dark-light/70 dark:text-neutral">
                  <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
                Paramètres
              </a>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                </svg>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="relative block w-full px-4 py-2.5 text-sm font-medium text-center rounded-lg transition-all duration-300 text-white bg-dark-light border border-dark-light hover:bg-dark dark:bg-white/5 dark:border-white/20 dark:backdrop-blur-sm dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.15),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.25)] dark:hover:bg-white/10 dark:hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.2),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15),0_6px_16px_rgba(0,0,0,0.3)] dark:before:absolute dark:before:inset-0 dark:before:rounded-lg dark:before:bg-gradient-to-br dark:before:from-white/10 dark:before:via-transparent dark:before:to-transparent dark:before:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:rounded-lg dark:after:bg-gradient-to-tl dark:after:from-white/5 dark:after:via-transparent dark:after:to-transparent dark:after:pointer-events-none"
              >
                <span className="relative z-10">Connexion</span>
              </a>
              <a
                href="/register"
                className="block w-full px-4 py-2.5 text-sm font-medium text-center text-white bg-accent-green rounded-lg hover:bg-accent-green/90 transition-colors"
              >
                Créer un compte
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
