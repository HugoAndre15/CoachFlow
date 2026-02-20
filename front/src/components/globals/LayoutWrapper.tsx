'use client';

import { usePathname } from "next/navigation";
import HeaderBar from "./headerBar";
import FooterBar from "./footerBar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages sans header/footer (authentification)
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark">
      <HeaderBar />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 md:py-8">
        <div className="max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
      <FooterBar />
    </div>
  );
}
