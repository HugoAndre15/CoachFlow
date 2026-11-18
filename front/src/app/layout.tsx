import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";
import LayoutWrapper from "@/components/globals/LayoutWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "CoachFlow",
  description: "Gérez votre équipe de football, préparez vos feuilles de match et suivez le direct au bord du terrain.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Apply the saved palette before paint, including on a direct page visit. */}
        <script src="/terrain/theme.js" />
      </head>
      <body className={`${poppins.variable} antialiased`} style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
