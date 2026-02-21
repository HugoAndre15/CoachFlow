'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Swords,
  Radio,
  ClipboardList,
  CalendarCheck,
  CreditCard,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchExact?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    matchExact: true,
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Joueurs',
    href: '/dashboard/joueurs',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Matchs',
    href: '/dashboard/matchs',
    icon: <Swords className="w-5 h-5" />,
  },
  {
    label: 'Direct',
    href: '/dashboard/direct',
    icon: <Radio className="w-5 h-5" />,
  },
  {
    label: 'Convocations',
    href: '/dashboard/convocations',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    label: 'Présences',
    href: '/dashboard/presences',
    icon: <CalendarCheck className="w-5 h-5" />,
  },
  {
    label: 'Abonnement',
    href: '/dashboard/abonnement',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    label: 'Paramètres',
    href: '/dashboard/parametres',
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close mobile sidebar on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const filteredItems = searchQuery
    ? sidebarItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sidebarItems;

  const sidebarContent = (
    <>
      {/* Search */}
      <div className={`p-3 ${collapsed ? 'px-2.5' : ''}`}>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-grey-medium hover:text-white hover:bg-dark-light/50 transition-colors"
            title="Rechercher..."
          >
            <Search className="w-5 h-5" />
          </button>
        ) : (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-medium pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm
                bg-dark-lighter border border-dark-light/40
                text-white placeholder-grey-medium
                focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20
                transition-all duration-200"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pb-3 space-y-0.5">
        {filteredItems.map((item) => {
          const isActive = item.matchExact
            ? pathname === item.href
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                group relative flex items-center gap-3 rounded-lg
                transition-all duration-200 cursor-pointer
                ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                ${isActive
                  ? 'bg-accent-green/15 text-accent-green'
                  : 'text-grey-medium hover:bg-dark-light/40 hover:text-white'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-green rounded-r-full" />
              )}

              {/* Icon */}
              <span className={`flex-shrink-0 transition-colors duration-200 ${
                isActive ? 'text-accent-green' : 'text-grey-medium group-hover:text-white'
              }`}>
                {item.icon}
              </span>

              {/* Label */}
              {!collapsed && (
                <span className={`text-sm font-medium truncate transition-colors duration-200 ${
                  isActive ? 'text-accent-green' : ''
                }`}>
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed */}
              {collapsed && (
                <span className="
                  absolute left-full ml-3 px-2.5 py-1 rounded-md
                  bg-dark-lighter border border-dark-light/50 text-white text-xs font-medium
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-150 whitespace-nowrap z-50 pointer-events-none
                  shadow-lg
                ">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:block p-2 border-t border-dark-light/30 mt-auto">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
            text-grey-medium hover:text-white hover:bg-dark-light/40
            transition-all duration-200 cursor-pointer"
          title={collapsed ? 'Agrandir' : 'Réduire'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Réduire</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[260px]
          bg-dark-secondary border-r border-dark-light/30
          flex flex-col transition-transform duration-300 ease-in-out
          lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile close header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-dark-light/30 flex-shrink-0">
          <span className="text-lg font-bold text-white">CoachFlow</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-grey-medium hover:text-white hover:bg-dark-light/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar — fixed, always pinned from header to bottom of viewport */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0
          fixed top-14 bottom-0 left-0 z-30
          bg-dark-secondary border-r border-dark-light/30
          transition-all duration-300 ease-in-out overflow-hidden
          ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Spacer to push main content — matches sidebar width */}
      <div
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
        aria-hidden="true"
      />
    </>
  );
}
