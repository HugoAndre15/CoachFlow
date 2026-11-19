'use client';

import { usePathname } from "next/navigation";
import HeaderBar from "./headerBar";
import FooterBar from "./footerBar";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import "./workspace.css";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, mounted } = useAuth();

  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(pathname);
  const isDashboard = pathname?.startsWith('/dashboard');

  // The landing page owns its public header, main landmark and footer.
  if (isAuthPage || pathname === '/') {
    return <>{children}</>;
  }

  // The auth provider restores the session or redirects to sign-in.
  if (isDashboard && (!mounted || !user)) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (isDashboard) {
    return (
      <div className="workspace">
        <a href="#workspace-content" className="workspace-skip">Aller au contenu</a>
        <Sidebar />
        <div className="workspace-column">
          <DashboardHeader />
          <main id="workspace-content" tabIndex={-1} className="workspace-main">
            <div className="mx-auto w-full max-w-screen-xl">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <HeaderBar />
      <main className="w-full flex-1 px-4 py-6 sm:px-6 md:py-8 lg:px-10">
        <div className="mx-auto max-w-screen-xl">{children}</div>
      </main>
      <FooterBar />
    </div>
  );
}
