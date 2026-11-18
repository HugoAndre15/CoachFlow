"use client";

import { useState } from "react";
import { ArrowRight, Shield } from "lucide-react";
import CreateClubModal from "../clubs/parts/CreateClubModal";
import { primaryClass } from "../joueurs/parts/roster";

export default function NoClubState({ onClubCreated }: { onClubCreated: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mx-auto my-8 max-w-md rounded-2xl border border-line bg-surface p-6 sm:my-14 sm:p-8">
      <Shield className="mb-5 text-accent-green" size={32} aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-tight">Bienvenue sur CoachFlow</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Créez votre club pour y rattacher votre première équipe. Vous pourrez ensuite ajouter vos joueurs et préparer votre feuille de match.
      </p>
      <button type="button" onClick={() => setOpen(true)} className={`${primaryClass} mt-6`}>
        Créer un club <ArrowRight size={16} aria-hidden="true" />
      </button>
      {open && <CreateClubModal isOpen onClose={() => setOpen(false)} onSuccess={onClubCreated} />}
    </section>
  );
}
