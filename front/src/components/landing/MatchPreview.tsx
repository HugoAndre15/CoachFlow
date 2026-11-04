"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  Goal,
  Radio,
  ShieldCheck,
  Users,
  WifiOff,
} from "lucide-react";
import styles from "./landing.module.css";

const steps = [
  { label: "Préparer", caption: "Une feuille claire. Une équipe prête." },
  { label: "Jouer", caption: "Le match avance. Vous gardez le fil." },
  {
    label: "Retrouver le bilan",
    caption: "Les actions deviennent des repères.",
  },
];
const players = [
  { number: 1, name: "Martin L.", position: "Gardien", role: "Titulaire" },
  { number: 4, name: "Alex R.", position: "Défenseur", role: "Titulaire" },
  { number: 8, name: "Sam D.", position: "Milieu", role: "Titulaire" },
  { number: 9, name: "Noa B.", position: "Attaquant", role: "Titulaire" },
  { number: 12, name: "Charlie M.", position: "Milieu", role: "Remplaçant" },
];
const formation = [
  [1, 50, 85],
  [2, 18, 66],
  [12, 40, 69],
  [5, 62, 69],
  [3, 83, 66],
  [6, 29, 45],
  [8, 50, 50],
  [10, 71, 45],
  [7, 21, 23],
  [9, 50, 17],
  [11, 79, 23],
];

export default function MatchPreview() {
  const [active, setActive] = useState(0);
  return (
    <div className={styles.preview}>
      <div className={styles.previewTop}>
        <span>
          <span className={styles.brandMark}>CF</span> CARNET DE MATCH
        </span>
        <span className={styles.demoLabel}>Exemple fictif</span>
      </div>
      <div
        className={styles.previewTabs}
        role="group"
        aria-label="Explorer les étapes du match"
      >
        {steps.map((step, index) => (
          <button
            key={step.label}
            type="button"
            aria-pressed={active === index}
            onClick={() => setActive(index)}
          >
            <span>0{index + 1}</span>
            {step.label}
          </button>
        ))}
      </div>
      <div className={styles.previewBody} aria-live="polite" aria-atomic="true">
        <div className={styles.previewMatch}>
          <div>
            <span className={styles.micro}>SENIORS · MATCH AMICAL</span>
            <h2>
              FC Horizon <span>—</span> AS Rivage
            </h2>
          </div>
          <span className={styles.statusPill}>
            {active === 0
              ? "À préparer"
              : active === 1
                ? "En direct"
                : "Terminé"}
          </span>
        </div>
        {active === 0 && (
          <div className={styles.preparationPreview}>
            <div className={styles.sheetTitle}>
              <Users size={17} aria-hidden="true" />
              <strong>Votre feuille de match</strong>
              <span>Extrait de l’effectif</span>
            </div>
            {players.map((player) => (
              <div className={styles.previewPlayer} key={player.number}>
                <span className={styles.checked}>
                  <Check size={13} aria-hidden="true" />
                </span>
                <span className={styles.jersey}>{player.number}</span>
                <span>
                  <strong>{player.name}</strong>
                  <small>{player.position}</small>
                </span>
                <span className={styles.playerRole}>{player.role}</span>
              </div>
            ))}
            <div className={styles.previewTip}>
              <CheckCheck size={17} aria-hidden="true" />
              <span>
                Un appui pour sélectionner. Les 11 premiers sont titulaires.
              </span>
            </div>
          </div>
        )}
        {active === 1 && (
          <div className={styles.livePreview}>
            <div
              className={styles.pitch}
              role="img"
              aria-label="Exemple de composition à onze joueurs"
            >
              <div className={styles.pitchHalf} />
              <div className={styles.pitchCircle} />
              <div className={styles.pitchBoxTop} />
              <div className={styles.pitchBoxBottom} />
              {formation.map(([number, x, y]) => (
                <span
                  key={number}
                  className={styles.pitchPlayer}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {number}
                </span>
              ))}
            </div>
            <div className={styles.matchLog}>
              <div className={styles.scoreLine}>
                <span>62′</span>
                <strong>
                  2 <span>–</span> 1
                </strong>
                <Radio size={18} aria-hidden="true" />
              </div>
              <div className={styles.logEvent}>
                <span>62′</span>
                <div>
                  <Goal size={16} aria-hidden="true" />
                  <strong>But de Noa B.</strong>
                  <small>Passe de Sam D.</small>
                </div>
              </div>
              <div className={styles.logEvent}>
                <span>48′</span>
                <div>
                  <ArrowRight size={16} aria-hidden="true" />
                  <strong>Charlie M. entre</strong>
                  <small>À la place d’Alex R.</small>
                </div>
              </div>
              <div className={styles.localSave}>
                <WifiOff size={15} aria-hidden="true" />
                <span>
                  Hors ligne
                  <br />
                  <strong>Actions sur cet appareil</strong>
                </span>
              </div>
            </div>
          </div>
        )}
        {active === 2 && (
          <div className={styles.summaryPreview}>
            <div className={styles.result}>
              <span>VICTOIRE</span>
              <strong>
                2 <span>–</span> 1
              </strong>
              <small>FC Horizon · AS Rivage</small>
            </div>
            <div className={styles.summaryNumbers}>
              <div>
                <strong>2</strong>
                <span>Buts marqués</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Passe décisive</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Remplacement</span>
              </div>
            </div>
            <div className={styles.summarySaved}>
              <ShieldCheck size={20} aria-hidden="true" />
              <span>
                Après synchronisation, retrouvez le bilan dans les fiches
                joueurs et le dashboard.
              </span>
            </div>
          </div>
        )}
      </div>
      <div className={styles.previewBottom}>
        <span>
          <Circle size={7} fill="currentColor" aria-hidden="true" />
          {steps[active].caption}
        </span>
        <button
          type="button"
          onClick={() => setActive((active + 1) % steps.length)}
          aria-label={
            active === 2
              ? "Revenir à la préparation"
              : `Voir l’étape suivante : ${steps[active + 1].label}`
          }
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
