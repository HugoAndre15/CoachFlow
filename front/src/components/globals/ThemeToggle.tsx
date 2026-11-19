"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(notify: () => void) {
  window.addEventListener("coachflow:theme", notify);
  return () => window.removeEventListener("coachflow:theme", notify);
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "dark", () => false);
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Mode sombre"
      title={dark ? "Passer au mode clair" : "Passer au mode sombre"} className="theme-toggle" data-theme-toggle>
      <Sun size={15} aria-hidden="true" />
      <Moon size={15} aria-hidden="true" />
    </button>
  );
}
