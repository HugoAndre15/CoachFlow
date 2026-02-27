'use client';

import { usePathname } from "next/navigation";
import HeaderBar from "./headerBar";
import FooterBar from "./footerBar";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useClubTeam } from "@/contexts/ClubTeamContext";
import { useState } from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, mounted } = useAuth();
  const { activeClub, isLoadingClubs } = useClubTeam();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Pages without any header/footer (authentication)
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(pathname);
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Before mounted, render a neutral dark shell to avoid hydration mismatch
  if (!mounted && isDashboard) {
    return <div className="min-h-screen bg-dark" />;
  }

  // Dashboard: user logged in AND has a club → full layout with sidebar + header selectors
  if (isDashboard && user && activeClub && !isLoadingClubs) {
    return (
      <div className="h-screen flex flex-col bg-dark overflow-hidden">
        <DashboardHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto bg-dark p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Dashboard: user without club — header visible (no selectors), no sidebar
  if (isDashboard && user) {
    return (
      <div className="h-screen flex flex-col bg-dark overflow-hidden">
        <DashboardHeader onToggleSidebar={() => {}} hideSelectors />
        <main className="flex-1 overflow-y-auto bg-dark">
          {children}
        </main>
      </div>
    );
  }

  // Dashboard: not logged in — minimal shell (redirect will happen via AuthContext)
  if (isDashboard) {
    return (
      <div className="min-h-screen bg-dark">
        <main className="w-full">
          {children}
        </main>
      </div>
    );
  }

  const isHomePage = pathname === '/';

  // Public layout: Header + Content + Footer
  return (
    <div className={`min-h-screen flex flex-col ${isHomePage ? 'bg-dark' : 'bg-gray-50 dark:bg-dark'}`}>
      <HeaderBar />
      {isHomePage ? (
        <main className="flex-1 w-full">
          {children}
        </main>
      ) : (
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 md:py-8">
          <div className="max-w-screen-xl mx-auto">
            {children}
          </div>
        </main>
      )}
      <FooterBar />
    </div>
  );
}
