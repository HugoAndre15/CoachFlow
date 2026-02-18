'use client';

import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchExact?: boolean;
}

const dashboardNavItems: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    matchExact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Joueurs",
    href: "/dashboard/joueurs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
      </svg>
    ),
  },
  {
    label: "Matchs",
    href: "/dashboard/matchs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Direct",
    href: "/dashboard/direct",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.515a1.75 1.75 0 0 1-1.75 1.75h-1.5a.25.25 0 0 0-.177.073l-1.896 1.897A.25.25 0 0 1 13.5 18.927V17.25a.25.25 0 0 0-.25-.25H2.75A1.75 1.75 0 0 1 1 15.25V4.75Z" />
      </svg>
    ),
  },
];

const publicNavItems: NavItem[] = [
  { label: "Accueil", href: "/", matchExact: true, icon: null },
  { label: "Fonctionnalités", href: "#", icon: null },
  { label: "Tarifs", href: "#", icon: null },
  { label: "Abonnements", href: "#", icon: null },
  { label: "Contact", href: "#", icon: null },
];

interface NavTabsProps {
  isDashboard: boolean;
  hasClub: boolean;
}

export default function NavTabs({ isDashboard, hasClub }: NavTabsProps) {
  const pathname = usePathname();

  if (isDashboard && !hasClub) return null;

  const items = isDashboard ? dashboardNavItems : publicNavItems;

  return (
    <nav className="hidden md:flex items-center space-x-1 bg-neutral-lighter dark:bg-dark-secondary rounded-lg px-1 py-1">
      {items.map((item) => {
        const isActive = item.matchExact
          ? pathname === item.href
          : pathname?.startsWith(item.href);

        return (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-neutral-lightest border border-grey-medium dark:bg-dark-lighter text-dark dark:text-white'
                : 'text-dark-light dark:text-grey-light hover:bg-neutral-lightest dark:hover:bg-dark-light hover:text-dark dark:hover:text-white transition-all duration-300'
            }`}
          >
            {item.icon}
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export { dashboardNavItems, publicNavItems };
export type { NavItem };
