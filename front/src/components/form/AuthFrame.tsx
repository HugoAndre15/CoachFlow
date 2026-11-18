import Link from "next/link";
import { Shield } from "lucide-react";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/globals/ThemeToggle";

export default function AuthFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-xl font-bold tracking-tight">
            <Shield className="text-accent-green" size={28} aria-hidden="true" />CoachFlow
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-6 sm:py-12">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
          <h1 className="mb-6 text-3xl font-semibold tracking-tight">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
