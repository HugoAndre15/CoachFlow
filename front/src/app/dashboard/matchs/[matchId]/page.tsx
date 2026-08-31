'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  CircleHelp,
  Clock,
  MapPin,
  Play,
  Radio,
  Save,
  Shield,
  Trophy,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react';
import { useClubTeam } from '@/contexts/ClubTeamContext';
import {
  matchService,
  MatchDetail,
  MatchPlayerStatus,
  MatchPresenceStatus,
} from '@/services/matchService';
import { playerService, Player } from '@/services/playerService';

type PreparationStep = 'presence' | 'lineup';

const PRESENCE_OPTIONS: {
  value: MatchPresenceStatus;
  label: string;
  active: string;
}[] = [
  { value: 'PRESENT', label: 'Présent', active: 'border-accent-green bg-accent-green text-white' },
  { value: 'UNCERTAIN', label: 'Incertain', active: 'border-amber-500 bg-amber-500 text-white' },
  { value: 'ABSENT', label: 'Absent', active: 'border-accent-red bg-accent-red text-white' },
];

const EVENT_LABELS: Record<string, string> = {
  GOAL: 'But',
  ASSIST: 'Passe décisive',
  YELLOW_CARD: 'Carton jaune',
  RED_CARD: 'Carton rouge',
  RECOVERY: 'Récupération',
  BALL_LOSS: 'Perte de balle',
  SUBSTITUTION: 'Changement',
};

const ZONE_LABELS: Record<string, string> = {
  DEF_LEFT: 'Défense gauche',
  DEF_CENTER: 'Défense axe',
  DEF_RIGHT: 'Défense droite',
  MID_LEFT: 'Milieu gauche',
  MID_CENTER: 'Milieu axe',
  MID_RIGHT: 'Milieu droite',
  ATT_LEFT: 'Attaque gauche',
  ATT_CENTER: 'Attaque axe',
  ATT_RIGHT: 'Attaque droite',
  BOX: 'Surface',
  OUTSIDE: 'Hors surface',
  LEFT: 'Gauche',
  RIGHT: 'Droite',
  AXIS: 'Axe',
};

const BODY_LABELS: Record<string, string> = {
  LEFT_FOOT: 'Pied gauche',
  RIGHT_FOOT: 'Pied droit',
  HEAD: 'Tête',
};

function formatMatchDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function MatchHeader({ match, teamName }: { match: MatchDetail; teamName: string }) {
  return (
    <div className="rounded-2xl border border-neutral/20 bg-white p-5 dark:border-dark-light dark:bg-dark-lighter">
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <div className="min-w-0 flex-1 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-green/10">
            <Shield className="h-5 w-5 text-accent-green" />
          </div>
          <p className="truncate text-sm font-bold text-dark dark:text-white">{teamName}</p>
        </div>
        <div className="shrink-0 text-center">
          {match.status === 'UPCOMING' ? (
            <span className="text-xl font-black text-dark-light/30 dark:text-neutral/30">VS</span>
          ) : (
            <span className="text-3xl font-black text-dark dark:text-white">
              {match.score.home} – {match.score.away}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-red/10">
            <Shield className="h-5 w-5 text-accent-red" />
          </div>
          <p className="truncate text-sm font-bold text-dark dark:text-white">{match.opponent}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-neutral/10 pt-4 text-xs text-dark-light/60 dark:border-dark-light dark:text-neutral/60">
        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatMatchDate(match.match_date)}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{match.location === 'HOME' ? 'Domicile' : 'Extérieur'}</span>
      </div>
    </div>
  );
}

export default function MatchPreparationPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const { activeTeam } = useClubTeam();
  const matchId = params.matchId;
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [presences, setPresences] = useState<Record<string, MatchPresenceStatus>>({});
  const [roles, setRoles] = useState<Record<string, MatchPlayerStatus>>({});
  const [step, setStep] = useState<PreparationStep>('presence');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const loadRequestId = useRef(0);

  const loadMatch = useCallback(async () => {
    if (!activeTeam?.id || !matchId) return;
    const requestId = ++loadRequestId.current;
    try {
      setIsLoading(true);
      setError(null);
      setMatch(null);
      setPlayers([]);
      setPresences({});
      setRoles({});
      const [matchData, roster] = await Promise.all([
        matchService.getMatch(matchId),
        playerService.getPlayersByTeam(activeTeam.id),
      ]);
      if (requestId !== loadRequestId.current) return;
      if (matchData.team_id !== activeTeam.id) {
        setError('Ce match appartient à une autre équipe.');
        return;
      }

      const nextPresences: Record<string, MatchPresenceStatus> = {};
      const nextRoles: Record<string, MatchPlayerStatus> = {};
      const entriesByPlayer = new Map(matchData.matchPlayers.map(entry => [entry.player_id, entry]));
      roster.forEach(player => {
        const entry = entriesByPlayer.get(player.id);
        nextPresences[player.id] = entry?.presence ?? (entry ? 'PRESENT' : 'UNKNOWN');
        nextRoles[player.id] = entry?.status ?? 'SUBSTITUTE';
      });

      setMatch(matchData);
      setPlayers(roster);
      setPresences(nextPresences);
      setRoles(nextRoles);
    } catch (requestError: any) {
      if (requestId !== loadRequestId.current) return;
      setError(requestError.response?.data?.message || 'Impossible de charger ce match.');
    } finally {
      if (requestId === loadRequestId.current) setIsLoading(false);
    }
  }, [activeTeam?.id, matchId]);

  useEffect(() => {
    void loadMatch();
    return () => {
      loadRequestId.current += 1;
    };
  }, [loadMatch]);

  const counts = useMemo(() => {
    const values = Object.values(presences);
    return {
      present: values.filter(value => value === 'PRESENT').length,
      uncertain: values.filter(value => value === 'UNCERTAIN').length,
      absent: values.filter(value => value === 'ABSENT').length,
      unknown: players.length - values.filter(value => value !== 'UNKNOWN').length,
    };
  }, [players.length, presences]);

  const presentPlayers = useMemo(
    () => players.filter(player => presences[player.id] === 'PRESENT'),
    [players, presences],
  );
  const startersCount = presentPlayers.filter(player => roles[player.id] === 'STARTER').length;

  const changePresence = (playerId: string, presence: MatchPresenceStatus) => {
    setSavedMessage(null);
    setPresences(current => ({ ...current, [playerId]: presence }));
    if (presence !== 'PRESENT') {
      setRoles(current => ({ ...current, [playerId]: 'SUBSTITUTE' }));
    }
  };

  const setEveryonePresent = () => {
    setSavedMessage(null);
    setPresences(Object.fromEntries(players.map(player => [player.id, 'PRESENT'])));
  };

  const changeRole = (playerId: string, role: MatchPlayerStatus) => {
    if (role === 'STARTER' && roles[playerId] !== 'STARTER' && startersCount >= 11) {
      setError('La composition est limitée à 11 titulaires.');
      return;
    }
    setError(null);
    setSavedMessage(null);
    setRoles(current => ({ ...current, [playerId]: role }));
  };

  const persistPreparation = async (showConfirmation = true) => {
    if (players.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      await matchService.addPlayersToMatch(
        matchId,
        players.map(player => ({
          player_id: player.id,
          presence: presences[player.id] ?? 'UNKNOWN',
          status: presences[player.id] === 'PRESENT' ? (roles[player.id] ?? 'SUBSTITUTE') : 'SUBSTITUTE',
        })),
      );
      if (showConfirmation) setSavedMessage('Préparation enregistrée');
    } catch (requestError: any) {
      const message = requestError.response?.data?.message || 'Impossible d’enregistrer la préparation.';
      setError(message);
      throw requestError;
    } finally {
      setIsSaving(false);
    }
  };

  const startMatch = async () => {
    if (counts.unknown > 0) {
      setError(`Il reste ${counts.unknown} présence${counts.unknown > 1 ? 's' : ''} à renseigner.`);
      setStep('presence');
      return;
    }
    if (startersCount < 2) {
      setError(`Choisissez au moins 2 titulaires présents (actuellement ${startersCount}).`);
      setStep('lineup');
      return;
    }
    try {
      setIsStarting(true);
      await persistPreparation(false);
      await matchService.updateStatus(matchId, 'LIVE');
      router.push(`/dashboard/direct?matchId=${matchId}`);
    } catch {
      // The actionable API message is already displayed by persistPreparation.
    } finally {
      setIsStarting(false);
    }
  };

  if (!activeTeam) {
    return <div className="py-20 text-center text-sm text-dark-light dark:text-neutral">Sélectionnez une équipe pour ouvrir ce match.</div>;
  }

  if (isLoading) {
    return <div className="space-y-4"><div className="h-8 w-44 animate-pulse rounded-lg bg-neutral/20" /><div className="h-56 animate-pulse rounded-2xl bg-neutral/20" /><div className="h-80 animate-pulse rounded-2xl bg-neutral/20" /></div>;
  }

  if (!match || error && !Object.keys(presences).length) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="mx-auto mb-3 h-9 w-9 text-accent-red" />
        <p className="text-sm font-medium text-accent-red">{error || 'Match introuvable'}</p>
        <button onClick={() => router.push('/dashboard/matchs')} className="mt-4 text-sm font-semibold text-accent-green">Retour aux matchs</button>
      </div>
    );
  }

  const matchPlayersForStatus = match.matchPlayers;
  const statusPresenceCounts = {
    present: matchPlayersForStatus.filter(player => !player.presence || player.presence === 'PRESENT').length,
    uncertain: matchPlayersForStatus.filter(player => player.presence === 'UNCERTAIN').length,
    absent: matchPlayersForStatus.filter(player => player.presence === 'ABSENT').length,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-28 sm:pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/matchs')} aria-label="Retour aux matchs" className="rounded-xl border border-neutral/20 p-2.5 text-dark-light transition-colors hover:bg-neutral/5 dark:border-dark-light dark:text-neutral">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-dark dark:text-white sm:text-2xl">Feuille de match</h1>
          <p className="text-xs text-dark-light/60 dark:text-neutral/60">Un parcours simple, dans l’ordre</p>
        </div>
      </div>

      <MatchHeader match={match} teamName={activeTeam.name} />

      {match.status === 'LIVE' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-accent-green/30 bg-accent-green/5 p-5 text-center">
            <Radio className="mx-auto mb-3 h-8 w-8 text-accent-green" />
            <h2 className="text-lg font-bold text-dark dark:text-white">Le match est en cours</h2>
            <p className="mt-1 text-sm text-dark-light/60 dark:text-neutral/60">{statusPresenceCounts.present} joueur{statusPresenceCounts.present > 1 ? 's' : ''} présent{statusPresenceCounts.present > 1 ? 's' : ''} sur la feuille</p>
            <button onClick={() => router.push(`/dashboard/direct?matchId=${matchId}`)} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent-green px-6 py-3 text-sm font-bold text-white">
              <Play className="h-4 w-4" /> Reprendre le direct
            </button>
          </div>
        </div>
      )}

      {match.status === 'FINISHED' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-neutral/20 bg-white p-3 text-center dark:border-dark-light dark:bg-dark-lighter"><p className="text-xl font-black text-accent-green">{statusPresenceCounts.present}</p><p className="text-[11px] text-dark-light/60 dark:text-neutral/60">Présents</p></div>
            <div className="rounded-xl border border-neutral/20 bg-white p-3 text-center dark:border-dark-light dark:bg-dark-lighter"><p className="text-xl font-black text-dark dark:text-white">{match.matchEvents.filter(event => event.event_type === 'GOAL').length}</p><p className="text-[11px] text-dark-light/60 dark:text-neutral/60">Buts</p></div>
            <div className="rounded-xl border border-neutral/20 bg-white p-3 text-center dark:border-dark-light dark:bg-dark-lighter"><p className="text-xl font-black text-accent-blue">{match.matchEvents.filter(event => event.event_type === 'ASSIST').length}</p><p className="text-[11px] text-dark-light/60 dark:text-neutral/60">Passes dé.</p></div>
          </div>
          <div className="rounded-2xl border border-neutral/20 bg-white p-5 dark:border-dark-light dark:bg-dark-lighter">
            <div className="mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-accent-green" /><h2 className="font-bold text-dark dark:text-white">Résumé du match</h2></div>
            {match.matchEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-dark-light/50 dark:text-neutral/50">Aucun événement enregistré.</p>
            ) : (
              <div className="space-y-2">
                {match.matchEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 rounded-xl bg-neutral-lighter/40 p-3 dark:bg-dark-secondary/30">
                    <span className="w-10 shrink-0 text-sm font-black text-dark dark:text-white">{event.minute}&apos;</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-dark dark:text-white">{EVENT_LABELS[event.event_type] || event.event_type} · {event.player.first_name} {event.player.last_name}</p>
                      {(event.zone || event.body_part) && <p className="mt-0.5 text-xs text-dark-light/50 dark:text-neutral/50">{[event.zone ? ZONE_LABELS[event.zone] || event.zone : null, event.body_part ? BODY_LABELS[event.body_part] || event.body_part : null].filter(Boolean).join(' · ')}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {match.status === 'UPCOMING' && (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-neutral/20 bg-white p-2 dark:border-dark-light dark:bg-dark-lighter">
            <button onClick={() => setStep('presence')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold ${step === 'presence' ? 'bg-accent-green text-white' : 'text-dark-light dark:text-neutral'}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">1</span> Présences
            </button>
            <button onClick={() => setStep('lineup')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold ${step === 'lineup' ? 'bg-accent-green text-white' : 'text-dark-light dark:text-neutral'}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">2</span> Composition
            </button>
          </div>

          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-accent-red/20 bg-accent-red/5 p-3 text-sm text-accent-red"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          {savedMessage && <div className="flex items-center gap-2 rounded-xl border border-accent-green/20 bg-accent-green/5 p-3 text-sm font-medium text-accent-green"><Check className="h-4 w-4" />{savedMessage}</div>}

          {step === 'presence' && (
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><h2 className="text-lg font-bold text-dark dark:text-white">Qui sera là ?</h2><p className="text-sm text-dark-light/60 dark:text-neutral/60">Une réponse par joueur. Vous pourrez la modifier avant le direct.</p></div>
                {players.length > 0 && <button onClick={setEveryonePresent} className="min-h-11 rounded-xl border border-accent-green/30 px-4 text-sm font-semibold text-accent-green">Tout le monde présent</button>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-xl bg-accent-green/10 p-2 text-center"><p className="font-black text-accent-green">{counts.present}</p><p className="text-[10px] text-accent-green">Présents</p></div>
                <div className="rounded-xl bg-amber-500/10 p-2 text-center"><p className="font-black text-amber-500">{counts.uncertain}</p><p className="text-[10px] text-amber-600">Incertains</p></div>
                <div className="rounded-xl bg-accent-red/10 p-2 text-center"><p className="font-black text-accent-red">{counts.absent}</p><p className="text-[10px] text-accent-red">Absents</p></div>
                <div className="rounded-xl bg-neutral/10 p-2 text-center"><p className="font-black text-dark-light dark:text-neutral">{counts.unknown}</p><p className="text-[10px] text-dark-light/60 dark:text-neutral/60">À faire</p></div>
              </div>
              {players.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral/30 p-10 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-neutral" /><p className="text-sm font-medium text-dark-light dark:text-neutral">Ajoutez d’abord des joueurs à cette équipe.</p></div>
              ) : (
                <div className="space-y-2">
                  {players.map(player => {
                    const presence = presences[player.id] || 'UNKNOWN';
                    return (
                      <div key={player.id} className="rounded-2xl border border-neutral/20 bg-white p-3 dark:border-dark-light dark:bg-dark-lighter sm:flex sm:items-center sm:gap-4">
                        <div className="mb-3 flex min-w-0 items-center gap-3 sm:mb-0 sm:flex-1">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral/10 text-sm font-black text-dark dark:text-white">{player.jersey_number ?? '–'}</div>
                          <div className="min-w-0"><p className="truncate text-sm font-bold text-dark dark:text-white">{player.first_name} {player.last_name}</p><p className="text-xs text-dark-light/50 dark:text-neutral/50">{presence === 'UNKNOWN' ? 'Présence à renseigner' : PRESENCE_OPTIONS.find(option => option.value === presence)?.label}</p></div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 sm:w-[330px]">
                          {PRESENCE_OPTIONS.map(option => (
                            <button key={option.value} onClick={() => changePresence(player.id, option.value)} aria-pressed={presence === option.value} className={`min-h-10 rounded-xl border px-2 text-xs font-bold transition-colors ${presence === option.value ? option.active : 'border-neutral/20 text-dark-light dark:border-dark-light dark:text-neutral'}`}>{option.label}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={() => setStep('lineup')} disabled={counts.present === 0} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-green px-4 text-sm font-bold text-white disabled:opacity-40">Passer à la composition <ChevronRight className="h-4 w-4" /></button>
            </section>
          )}

          {step === 'lineup' && (
            <section className="space-y-4">
              <div><h2 className="text-lg font-bold text-dark dark:text-white">Qui commence ?</h2><p className="text-sm text-dark-light/60 dark:text-neutral/60">Seuls les joueurs présents sont affichés. {startersCount}/11 titulaire{startersCount > 1 ? 's' : ''}.</p></div>
              {presentPlayers.length === 0 ? (
                <button onClick={() => setStep('presence')} className="flex w-full flex-col items-center rounded-2xl border border-dashed border-neutral/30 p-10 text-center"><CircleHelp className="mb-3 h-8 w-8 text-neutral" /><span className="text-sm font-medium text-dark-light dark:text-neutral">Renseignez au moins un joueur présent.</span><span className="mt-2 text-xs font-semibold text-accent-green">Retour aux présences</span></button>
              ) : (
                <div className="space-y-2">
                  {presentPlayers.map(player => {
                    const isStarter = roles[player.id] === 'STARTER';
                    return (
                      <div key={player.id} className="flex items-center gap-3 rounded-2xl border border-neutral/20 bg-white p-3 dark:border-dark-light dark:bg-dark-lighter">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${isStarter ? 'bg-accent-green text-white' : 'bg-neutral/10 text-dark dark:text-white'}`}>{player.jersey_number ?? '–'}</div>
                        <p className="min-w-0 flex-1 truncate text-sm font-bold text-dark dark:text-white">{player.first_name} {player.last_name}</p>
                        <div className="grid w-40 grid-cols-2 gap-1.5 sm:w-52">
                          <button onClick={() => changeRole(player.id, 'STARTER')} aria-pressed={isStarter} className={`min-h-10 rounded-xl border px-2 text-xs font-bold ${isStarter ? 'border-accent-green bg-accent-green text-white' : 'border-neutral/20 text-dark-light dark:border-dark-light dark:text-neutral'}`}>Titulaire</button>
                          <button onClick={() => changeRole(player.id, 'SUBSTITUTE')} aria-pressed={!isStarter} className={`min-h-10 rounded-xl border px-2 text-xs font-bold ${!isStarter ? 'border-accent-blue bg-accent-blue text-white' : 'border-neutral/20 text-dark-light dark:border-dark-light dark:text-neutral'}`}>Remplaçant</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="rounded-xl bg-neutral-lighter/50 p-3 text-xs text-dark-light/60 dark:bg-dark-secondary/30 dark:text-neutral/60"><UserCheck className="mr-1.5 inline h-4 w-4 text-accent-green" />{counts.present} présent{counts.present > 1 ? 's' : ''} · <UserMinus className="mr-1.5 ml-2 inline h-4 w-4 text-accent-red" />{counts.absent} absent{counts.absent > 1 ? 's' : ''}</div>
            </section>
          )}

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral/20 bg-white/95 p-3 backdrop-blur dark:border-dark-light dark:bg-dark/95 sm:static sm:rounded-2xl sm:border">
            <div className="mx-auto flex max-w-4xl gap-2">
              <button onClick={() => void persistPreparation()} disabled={isSaving || isStarting || players.length === 0} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral/20 px-4 text-sm font-bold text-dark-light disabled:opacity-40 dark:border-dark-light dark:text-neutral"><Save className="h-4 w-4" />{isSaving ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button onClick={() => void startMatch()} disabled={isSaving || isStarting || players.length === 0} className="flex min-h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-accent-green px-4 text-sm font-bold text-white disabled:opacity-40"><Play className="h-4 w-4" />{isStarting ? 'Lancement…' : 'Lancer le direct'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
