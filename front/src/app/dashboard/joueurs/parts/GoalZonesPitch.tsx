'use client';

// ─── Zone grid definition ────────────────────────────────────────────────────
// Matches exactly the field_zone enum + ZonePickerOverlay used in the live match

const COL_W = 250 / 3;   // ≈ 83.3
const ROW_H = 350 / 3;   // ≈ 116.7

// Pitch origin: x=10, y=10
const GRID: {
  key: string;
  label: string;
  shortLabel: string;
  col: number; // 0=left 1=center 2=right
  row: number; // 0=ATT(top), 1=MID, 2=DEF(bottom)
  baseColor: string;
}[] = [
  { key: 'ATT_LEFT',   label: 'Att. Gauche',  shortLabel: 'Att.\nG', col: 0, row: 0, baseColor: '#22c55e' },
  { key: 'ATT_CENTER', label: 'Att. Centre',  shortLabel: 'Att.\nC', col: 1, row: 0, baseColor: '#22c55e' },
  { key: 'ATT_RIGHT',  label: 'Att. Droite',  shortLabel: 'Att.\nD', col: 2, row: 0, baseColor: '#22c55e' },
  { key: 'MID_LEFT',   label: 'Mil. Gauche',  shortLabel: 'Mil.\nG', col: 0, row: 1, baseColor: '#3b82f6' },
  { key: 'MID_CENTER', label: 'Mil. Centre',  shortLabel: 'Mil.\nC', col: 1, row: 1, baseColor: '#3b82f6' },
  { key: 'MID_RIGHT',  label: 'Mil. Droite',  shortLabel: 'Mil.\nD', col: 2, row: 1, baseColor: '#3b82f6' },
  { key: 'DEF_LEFT',   label: 'Déf. Gauche',  shortLabel: 'Déf.\nG', col: 0, row: 2, baseColor: '#f97316' },
  { key: 'DEF_CENTER', label: 'Déf. Centre',  shortLabel: 'Déf.\nC', col: 1, row: 2, baseColor: '#f97316' },
  { key: 'DEF_RIGHT',  label: 'Déf. Droite',  shortLabel: 'Déf.\nD', col: 2, row: 2, baseColor: '#f97316' },
];

const SPECIAL: { key: string; label: string; color: string }[] = [
  { key: 'BOX',     label: 'Surface de réparation', color: '#f59e0b' },
  { key: 'OUTSIDE', label: 'Hors surface',           color: '#a78bfa' },
];

// Legacy zones (no longer used in UI but kept for old data)
const LEGACY: { key: string; label: string }[] = [
  { key: 'LEFT',  label: 'Côté gauche (legacy)' },
  { key: 'RIGHT', label: 'Côté droit (legacy)' },
  { key: 'AXIS',  label: 'Axe (legacy)' },
];

function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getHeat(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  // min 0.22 so even 1 goal is clearly visible, max 0.78
  return 0.22 + (count / max) * 0.56;
}

interface GoalZonesPitchProps {
  goalsByZone: Record<string, number>;
}

export default function GoalZonesPitch({ goalsByZone }: GoalZonesPitchProps) {
  const gridCounts = GRID.map(z => ({ ...z, count: goalsByZone[z.key] ?? 0 }));
  const specialCounts = SPECIAL.map(z => ({ ...z, count: goalsByZone[z.key] ?? 0 }));
  const legacyCounts = LEGACY.map(z => ({ ...z, count: goalsByZone[z.key] ?? 0 })).filter(z => z.count > 0);

  const gridMax = Math.max(...gridCounts.map(z => z.count), 1);
  const total = [...gridCounts, ...specialCounts].reduce((s, z) => s + z.count, 0);

  // pre-compute cell rects (x, y, w, h relative to pitch origin x=10, y=10)
  const cells = gridCounts.map(z => {
    const x = 10 + z.col * COL_W;
    const y = 10 + z.row * ROW_H;
    const w = COL_W;
    const h = ROW_H;
    const heat = getHeat(z.count, gridMax);
    return { ...z, x, y, w, h, heat };
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-dark-light/10 dark:border-dark-light/20">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark/15 dark:bg-dark/40 border-b border-dark-light/10 dark:border-dark-light/20">
        <span className="text-xs font-semibold text-neutral uppercase tracking-wider">Buts par zone</span>
        <span className="text-xs font-bold text-dark dark:text-white">
          {total} but{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Pitch SVG */}
      <div className="p-3 bg-emerald-950/20 dark:bg-emerald-950/50">
        <svg
          viewBox="0 0 270 370"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full max-w-xs mx-auto select-none"
          aria-label="Terrain de football — buts par zone"
        >
          <defs>
            <linearGradient id="pitchBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#064e3b" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
            <clipPath id="pitchClip">
              <rect x="10" y="10" width="250" height="350" rx="4" />
            </clipPath>
            <filter id="zoneglow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Pitch base ─────────────────────────────────────────── */}
          <rect x="10" y="10" width="250" height="350" rx="4" fill="url(#pitchBg)" />

          {/* Pitch stripes */}
          {[0,1,2,3,4].map(i => (
            <rect key={i} x="10" y={10 + i * 70} width="250" height="35"
              fill="rgba(255,255,255,0.025)" clipPath="url(#pitchClip)" />
          ))}

          {/* ── Zone heat overlays (drawn before pitch lines) ────── */}
          {cells.map(cell => (
            <g key={cell.key}>
              {cell.count > 0 && (
                <rect
                  x={cell.x}
                  y={cell.y}
                  width={cell.w}
                  height={cell.h}
                  fill={hexWithAlpha(cell.baseColor, cell.heat)}
                  clipPath="url(#pitchClip)"
                  filter={cell.heat > 0.5 ? 'url(#zoneglow)' : undefined}
                />
              )}
            </g>
          ))}

          {/* ── Pitch lines (drawn ON TOP of heat zones) ────────── */}
          {/* Outer pitch border */}
          <rect x="10" y="10" width="250" height="350" rx="4"
            fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />

          {/* ── Opponent's end (top) ─────────────────────────────── */}
          {/* Opponent goal */}
          <rect x="95" y="3" width="80" height="10" rx="2"
            fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" />

          {/* Opponent 6-yard box */}
          <rect x="100" y="10" width="70" height="28" rx="1"
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

          {/* Opponent penalty area */}
          <rect x="60" y="10" width="150" height="85" rx="1"
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" />

          {/* Opponent penalty spot */}
          <circle cx="135" cy="72" r="2" fill="rgba(255,255,255,0.55)" />

          {/* Opponent penalty arc */}
          <path d="M 85 95 A 52 52 0 0 1 185 95"
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

          {/* ── Center ───────────────────────────────────────────── */}
          {/* Center line */}
          <line x1="10" y1="185" x2="260" y2="185"
            stroke="rgba(255,255,255,0.35)" strokeWidth="1.3" />

          {/* Center circle */}
          <circle cx="135" cy="185" r="42"
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

          {/* Center spot */}
          <circle cx="135" cy="185" r="2.5" fill="rgba(255,255,255,0.5)" />

          {/* ── Our end (bottom) ─────────────────────────────────── */}
          {/* Our 6-yard box */}
          <rect x="100" y="322" width="70" height="28" rx="1"
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

          {/* Our penalty area */}
          <rect x="60" y="275" width="150" height="85" rx="1"
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" />

          {/* Our penalty spot */}
          <circle cx="135" cy="298" r="2" fill="rgba(255,255,255,0.55)" />

          {/* Our penalty arc */}
          <path d="M 85 275 A 52 52 0 0 0 185 275"
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

          {/* Our goal */}
          <rect x="95" y="357" width="80" height="10" rx="2"
            fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" />

          {/* ── Grid separators (dashed) ─────────────────────────── */}
          {/* Vertical col lines */}
          <line x1={10 + COL_W} y1="10" x2={10 + COL_W} y2="360"
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3" />
          <line x1={10 + COL_W * 2} y1="10" x2={10 + COL_W * 2} y2="360"
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3" />

          {/* Horizontal row lines (only within pitch) */}
          <line x1="10" y1={10 + ROW_H} x2="260" y2={10 + ROW_H}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3" />
          <line x1="10" y1={10 + ROW_H * 2} x2="260" y2={10 + ROW_H * 2}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3" />

          {/* Corner arcs */}
          <path d="M 10 30 A 14 14 0 0 1 24 10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <path d="M 246 10 A 14 14 0 0 1 260 30" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <path d="M 10 340 A 14 14 0 0 0 24 360" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <path d="M 246 360 A 14 14 0 0 0 260 340" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

          {/* ── Zone labels + counts ─────────────────────────────── */}
          {cells.map(cell => {
            const cx = cell.x + cell.w / 2;
            const cy = cell.y + cell.h / 2;
            const hasGoals = cell.count > 0;

            return (
              <g key={`lbl-${cell.key}`}>
                {/* Label (always shown, subtle) */}
                {cell.shortLabel.split('\n').map((line, i) => (
                  <text
                    key={i}
                    x={cx}
                    y={cy - 8 + i * 11}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fontFamily="system-ui, sans-serif"
                    fontWeight="600"
                    fill={hasGoals ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)'}
                  >
                    {line}
                  </text>
                ))}
                {/* Count badge */}
                {hasGoals && (
                  <>
                    <circle
                      cx={cx}
                      cy={cy + 12}
                      r="10"
                      fill="rgba(0,0,0,0.35)"
                      stroke={hexWithAlpha(cell.baseColor, 0.8)}
                      strokeWidth="1.2"
                    />
                    <text
                      x={cx}
                      y={cy + 13}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={cell.count >= 10 ? '9' : '11'}
                      fontWeight="800"
                      fontFamily="system-ui, sans-serif"
                      fill="white"
                    >
                      {cell.count}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* ── "Goal" label at top ─────────────────────────────── */}
          <text x="135" y="7" textAnchor="middle" dominantBaseline="middle"
            fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="system-ui" letterSpacing="1">
            BUT
          </text>
        </svg>
      </div>

      {/* ── Special zones (BOX / OUTSIDE) ───────────────────────────── */}
      {specialCounts.some(z => z.count > 0) && (
        <div className="px-3 pb-2 grid grid-cols-2 gap-2">
          {specialCounts.map(z => (
            <div
              key={z.key}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl border"
              style={{
                borderColor: z.count > 0 ? hexWithAlpha(z.color, 0.4) : 'rgba(255,255,255,0.06)',
                backgroundColor: z.count > 0 ? hexWithAlpha(z.color, 0.08) : 'transparent',
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: z.count > 0 ? z.color : 'rgba(255,255,255,0.15)' }} />
              <span className="text-[10px] text-neutral flex-1 min-w-0 truncate">{z.label}</span>
              <span className="text-xs font-bold flex-shrink-0"
                style={{ color: z.count > 0 ? z.color : 'rgba(255,255,255,0.2)' }}>
                {z.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Répartition bar ─────────────────────────────────────────── */}
      {total > 0 && (
        <div className="px-3 pb-3 space-y-1">
          <div className="flex gap-[2px] h-1.5 rounded-full overflow-hidden">
            {[...gridCounts, ...specialCounts]
              .filter(z => z.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(z => {
                const color = 'baseColor' in z ? (z as typeof gridCounts[0]).baseColor
                  : SPECIAL.find(s => s.key === z.key)?.color ?? '#888';
                return (
                  <div
                    key={z.key}
                    style={{ width: `${(z.count / total) * 100}%`, backgroundColor: color, opacity: 0.7 }}
                    title={`${z.label}: ${z.count} but${z.count > 1 ? 's' : ''}`}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* ── Legacy data notice ──────────────────────────────────────── */}
      {legacyCounts.length > 0 && (
        <div className="px-3 pb-2 text-[9px] text-neutral/40 text-center">
          + {legacyCounts.reduce((s, z) => s + z.count, 0)} but{legacyCounts.reduce((s, z) => s + z.count, 0) > 1 ? 's' : ''} sans zone détaillée
        </div>
      )}
    </div>
  );
}
