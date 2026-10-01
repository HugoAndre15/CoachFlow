import type { MatchDetail } from '../services/matchService';

const EVENT_LABELS: Record<string, string> = {
  GOAL: 'But', ASSIST: 'Passe décisive', YELLOW_CARD: 'Carton jaune', RED_CARD: 'Carton rouge',
  RECOVERY: 'Récupération', BALL_LOSS: 'Perte de balle', SUBSTITUTION: 'Changement',
};
const ZONE_LABELS: Record<string, string> = {
  DEF_LEFT: 'Défense gauche', DEF_CENTER: 'Défense axe', DEF_RIGHT: 'Défense droite',
  MID_LEFT: 'Milieu gauche', MID_CENTER: 'Milieu axe', MID_RIGHT: 'Milieu droite',
  ATT_LEFT: 'Attaque gauche', ATT_CENTER: 'Attaque axe', ATT_RIGHT: 'Attaque droite',
  BOX: 'Surface', OUTSIDE: 'Hors surface', LEFT: 'Gauche', RIGHT: 'Droite', AXIS: 'Axe',
};
const BODY_LABELS: Record<string, string> = { LEFT_FOOT: 'Pied gauche', RIGHT_FOOT: 'Pied droit', HEAD: 'Tête' };

export function buildMatchTimeline(match: Pick<MatchDetail, 'matchEvents' | 'opponentEvents' | 'matchPlayers' | 'opponent'>) {
  const players = new Map(match.matchPlayers.map(entry => [entry.player_id, entry.player]));
  const teamEvents = match.matchEvents.map(event => {
    const incoming = event.related_player_id ? players.get(event.related_player_id) : undefined;
    const playerName = `${event.player.first_name} ${event.player.last_name}`;
    return {
      id: `team-${event.id}`, minute: event.minute, created_at: event.created_at, isOpponent: false,
      title: event.event_type === 'SUBSTITUTION'
        ? `Changement · ${playerName} sort → ${incoming ? `${incoming.first_name} ${incoming.last_name}` : 'Joueur'} entre`
        : `${EVENT_LABELS[event.event_type] || event.event_type} · ${playerName}`,
      details: [event.zone ? ZONE_LABELS[event.zone] || event.zone : null,
        event.body_part ? BODY_LABELS[event.body_part] || event.body_part : null].filter(Boolean).join(' · '),
    };
  });
  const opponentEvents = (match.opponentEvents ?? []).map(event => ({
    id: `opponent-${event.id}`, minute: event.minute, created_at: event.created_at, isOpponent: true,
    title: `${EVENT_LABELS[event.event_type] || event.event_type} adverse · ${match.opponent}`,
    details: event.jersey_number ? `Joueur n° ${event.jersey_number}` : '',
  }));
  return [...teamEvents, ...opponentEvents].sort((a, b) => a.minute - b.minute ||
    (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0) ||
    a.id.localeCompare(b.id));
}
