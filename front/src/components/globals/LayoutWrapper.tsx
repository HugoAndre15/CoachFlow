'use client';

import { usePathname } from "next/navigation";
import HeaderBar from "./headerBar";
import FooterBar from "./footerBar";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, mounted } = useAuth();
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

  // Dashboard layout: DashboardHeader + Sidebar (fixed) + Content
  if (isDashboard && user) {
    return (
      <div className="min-h-screen bg-dark overflow-x-hidden">
        <DashboardHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 min-h-[calc(100vh-3.5rem)] overflow-y-auto bg-dark p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-xl mx-auto">
              {children}
            </div>
          </main>
        </div>
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
