export const POSITION_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  GOALKEEPER: { label: 'GA',  bg: 'bg-orange-500/15', text: 'text-orange-400' },
  DEFENDER:   { label: 'DÉF', bg: 'bg-accent-blue/15', text: 'text-accent-blue' },
  MIDFIELDER: { label: 'MIL', bg: 'bg-accent-green/15', text: 'text-accent-green' },
  FORWARD:    { label: 'ATT', bg: 'bg-red-500/15', text: 'text-red-400' },
};

export const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    'bg-accent-green/10 text-accent-green border border-accent-green/20',
  INJURED:   'bg-red-500/10 text-red-400 border border-red-500/20',
  SUSPENDED: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  RETIRED:   'bg-neutral/10 text-dark-light dark:text-neutral border border-neutral/20',
};

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  INJURED: 'Blessé',
  SUSPENDED: 'Suspendu',
  RETIRED: 'Retraité',
};

export const FOOT_LABEL: Record<string, string> = {
  RIGHT: 'Droit',
  LEFT: 'Gauche',
  BOTH: 'D/G',
};

export const POSITION_TABS = [
  { key: '', label: 'Tous' },
  { key: 'GOALKEEPER', label: 'Gardien' },
  { key: 'DEFENDER', label: 'Défenseur' },
  { key: 'MIDFIELDER', label: 'Milieu' },
  { key: 'FORWARD', label: 'Attaquant' },
];
