'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clubService, ClubDetail, Club } from '@/services/clubService';
import { teamService, Team, TeamStats } from '@/services/teamService';
import { useClubTeam } from '@/contexts/ClubTeamContext';
import ClubLogo from '@/components/ui/ClubLogo';
import EditClubModal from '../parts/EditClubModal';
import DeleteClubModal from '../parts/DeleteClubModal';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Shield,
  Users,
  Crown,
  Copy,
  Check,
  ChevronRight,
  Trophy,
  Target,
  UserCheck,
  Mail,
  Pencil,
  Trash2,
} from 'lucide-react';

const mapClubRole = (role: string): string => {
  switch (role) {
    case 'PRESIDENT': return 'Président';
    case 'RESPONSABLE': return 'Responsable';
    case 'COACH': return 'Coach';
    default: return role;
  }
};

const roleColor = (role: string) => {
  switch (role) {
    case 'PRESIDENT': return 'bg-amber-500/10 text-amber-500';
    case 'RESPONSABLE': return 'bg-purple-500/10 text-purple-400';
    default: return 'bg-neutral/10 text-neutral';
  }
};

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { allTeams } = useClubTeam();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [teamsWithStats, setTeamsWithStats] = useState<(Team & { stats?: TeamStats })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchClub = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await clubService.getClubDetail(id);
      setClub(data);

      // Fetch stats for each team
      if (data.teams?.length) {
        const teamsData: (Team & { stats?: TeamStats })[] = data.teams.map((t) => ({
          ...t,
          club_id: data.id,
        }));

        const statsPromises = teamsData.map(async (team) => {
          try {
            const stats = await teamService.getTeamStats(team.id);
            return { ...team, stats };
          } catch {
            return team;
          }
        });

        const results = await Promise.all(statsPromises);
        setTeamsWithStats(results);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement du club');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchClub();
  }, [id, fetchClub]);

  const copyInviteCode = async () => {
    if (!club?.invite_code) return;
    try {
      await navigator.clipboard.writeText(club.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-neutral/10 dark:bg-dark-light rounded w-48" />
        <div className="h-40 bg-neutral/10 dark:bg-dark-light rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-60 bg-neutral/10 dark:bg-dark-light rounded-2xl" />
          <div className="h-60 bg-neutral/10 dark:bg-dark-light rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-accent-red font-medium">{error || 'Club introuvable'}</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-accent-green hover:underline">
          Retour
        </button>
      </div>
    );
  }

  const members = club.clubUsers || [];
  const president = members.find(m => m.role === 'PRESIDENT');
  const totalPlayers = teamsWithStats.reduce(
    (acc, t) => acc + (t.stats?.totalMatches ? 0 : 0) + (allTeams.find(at => at.id === t.id)?._count?.players || 0),
    0
  );
  const totalMatches = teamsWithStats.reduce((acc, t) => acc + (t.stats?.totalMatches || 0), 0);
  const totalGoals = teamsWithStats.reduce((acc, t) => acc + (t.stats?.totalGoals || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-neutral hover:text-dark dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      {/* Club Header Card */}
      <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <ClubLogo logo={club.logo} name={club.name} size="lg" className="w-20 h-20 text-2xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-dark dark:text-white">{club.name}</h1>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleColor(club.myRole)}`}>
                {mapClubRole(club.myRole)}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2.5 rounded-xl bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/20 dark:hover:bg-accent-blue/30 transition-colors"
                  title="Modifier le club"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2.5 rounded-xl bg-accent-red/10 dark:bg-accent-red/20 text-accent-red hover:bg-accent-red/20 dark:hover:bg-accent-red/30 transition-colors"
                  title="Supprimer le club"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {club.city && (
              <p className="text-sm text-neutral flex items-center gap-1.5 mb-3">
                <MapPin className="w-3.5 h-3.5" /> {club.city}
              </p>
            )}

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-neutral">
                <Calendar className="w-3.5 h-3.5" />
                Créé le {new Date(club.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {president && (
                <div className="flex items-center gap-2 text-neutral">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  {president.user.first_name} {president.user.last_name}
                </div>
              )}
            </div>

            {/* Invite code */}
            {club.invite_code && (
              <div className="mt-4 inline-flex items-center gap-3 bg-neutral/5 dark:bg-dark-light/50 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-[10px] text-neutral uppercase tracking-wider font-medium">Code d&apos;invitation</p>
                  <p className="font-mono text-base font-bold tracking-[0.2em] text-dark dark:text-white">{club.invite_code}</p>
                </div>
                <button
                  onClick={copyInviteCode}
                  className="p-1.5 rounded-lg hover:bg-neutral/10 dark:hover:bg-dark-light transition-colors"
                  title="Copier"
                >
                  {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4 text-neutral" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral/10 dark:border-dark-light">
          <div className="text-center">
            <p className="text-2xl font-bold text-dark dark:text-white">{members.length}</p>
            <p className="text-xs text-neutral mt-0.5">Membres</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-dark dark:text-white">{teamsWithStats.length}</p>
            <p className="text-xs text-neutral mt-0.5">Équipes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent-green">{totalMatches}</p>
            <p className="text-xs text-neutral mt-0.5">Matchs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent-blue">{totalGoals}</p>
            <p className="text-xs text-neutral mt-0.5">Buts</p>
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teams */}
        <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
          <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-purple-400" />
            Équipes ({teamsWithStats.length})
          </h3>

          {teamsWithStats.length === 0 ? (
            <p className="text-sm text-neutral text-center py-8">Aucune équipe</p>
          ) : (
            <div className="space-y-2">
              {teamsWithStats.map((team) => (
                <div
                  key={team.id}
                  onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral/5 dark:hover:bg-dark-light/30 transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark dark:text-white truncate">{team.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-accent-green">{team.category}</span>
                      {team.stats && (
                        <span className="text-[10px] text-neutral">
                          {team.stats.totalMatches} match{team.stats.totalMatches !== 1 ? 's' : ''} · {team.stats.totalGoals} but{team.stats.totalGoals !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral/30 group-hover:text-accent-green transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
          <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-accent-blue" />
            Membres ({members.length})
          </h3>

          {members.length === 0 ? (
            <p className="text-sm text-neutral text-center py-8">Aucun membre</p>
          ) : (
            <div className="space-y-2">
              {/* Sort: president first, then responsable, then coach */}
              {[...members]
                .sort((a, b) => {
                  const order: Record<string, number> = { PRESIDENT: 0, RESPONSABLE: 1, COACH: 2 };
                  return (order[a.role] ?? 3) - (order[b.role] ?? 3);
                })
                .map((member) => (
                  <div
                    key={member.user.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral/5 dark:hover:bg-dark-light/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-green/20 to-accent-blue/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-dark dark:text-white">
                        {member.user.first_name[0]}{member.user.last_name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark dark:text-white truncate">
                        {member.user.first_name} {member.user.last_name}
                      </p>
                      <p className="text-[10px] text-neutral flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" /> {member.user.email}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColor(member.role)}`}>
                      {mapClubRole(member.role)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {club && (
        <>
          <EditClubModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => fetchClub()}
            club={{
              id: club.id,
              name: club.name,
              city: club.city,
              logo: club.logo,
              invite_code: club.invite_code,
              role: club.myRole,
              created_at: club.created_at,
            }}
          />
          <DeleteClubModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={() => router.push('/dashboard/clubs')}
            clubId={club.id}
            clubName={club.name}
          />
        </>
      )}
    </div>
  );
}
