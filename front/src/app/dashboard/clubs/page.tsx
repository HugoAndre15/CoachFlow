'use client';

import { useState, useEffect } from 'react';
import { Eye, Edit2, Trash2, Plus, Users, Crown, Clipboard, Shield } from 'lucide-react';
import CreateClubModal from '../parts/CreateClubModal';
import EditClubModal from '../parts/EditClubModal';
import DeleteClubModal from '../parts/DeleteClubModal';
import { clubService } from '@/services/clubService';

// Types
interface Club {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

type RoleFilter = 'Tous' | 'Président' | 'Responsable' | 'Entraîneur';

// Mapper les rôles de la BDD vers l'affichage
const mapRole = (role: string): string => {
  switch (role) {
    case 'PRESIDENT':
      return 'Président';
    case 'RESPONSABLE':
      return 'Responsable';
    case 'COACH':
      return 'Entraîneur';
    default:
      return role;
  }
};

export default function ClubsPage() {
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les modales d'édition et suppression
  const [editingClub, setEditingClub] = useState<{ id: string; name: string } | null>(null);
  const [deletingClub, setDeletingClub] = useState<{ id: string; name: string } | null>(null);

  const fetchClubs = async () => {
    try {
      setIsLoading(true);
      const data = await clubService.getMyClubs();
      setClubs(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching clubs:', err);
      setError(err.message || 'Erreur lors du chargement des clubs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const filteredClubs = activeFilter === 'Tous' 
    ? clubs 
    : clubs.filter(club => mapRole(club.role) === activeFilter);

  const getRoleBadgeColor = (role: string) => {
    const mappedRole = mapRole(role);
    switch (mappedRole) {
      case 'Président':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Responsable':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Entraîneur':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-grey-light/20 text-grey-light border-grey-light/30';
    }
  };

  const getRoleIcon = (role: string) => {
    const mappedRole = mapRole(role);
    switch (mappedRole) {
      case 'Président':
        return <Crown className="w-3 h-3" />;
      case 'Responsable':
        return <Shield className="w-3 h-3" />;
      case 'Entraîneur':
        return <Clipboard className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getFilterCount = (filter: RoleFilter) => {
    if (filter === 'Tous') return clubs.length;
    return clubs.filter(club => mapRole(club.role) === filter).length;
  };

  const isPresident = (role: string) => role === 'PRESIDENT';

  const handleEdit = (club: Club) => {
    if (isPresident(club.role)) {
      setEditingClub({ id: club.id, name: club.name });
    }
  };

  const handleDelete = (club: Club) => {
    if (isPresident(club.role)) {
      setDeletingClub({ id: club.id, name: club.name });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-lightest dark:bg-dark p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark dark:text-neutral-lightest mb-1">
              Mes Clubs
            </h1>
            <p className="text-grey-medium dark:text-grey-light text-sm">
              Gérez tous vos clubs sportifs
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-green hover:bg-accent-green/90 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Créer un club</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['Tous', 'Président', 'Responsable', 'Entraîneur'] as RoleFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-colors
                flex items-center gap-2 border
                ${activeFilter === filter 
                  ? 'bg-accent-green text-white border-accent-green' 
                  : 'bg-white dark:bg-dark-secondary text-grey-medium dark:text-grey-light border-grey-light/20 hover:border-accent-green/50 hover:text-accent-green dark:hover:text-accent-green'
                }
              `}
            >
              {filter === 'Président' && <Crown className="w-4 h-4" />}
              {filter === 'Responsable' && <Shield className="w-4 h-4" />}
              {filter === 'Entraîneur' && <Clipboard className="w-4 h-4" />}
              <span>{filter}</span>
              <span className={`
                px-1.5 py-0.5 rounded text-xs font-bold
                ${activeFilter === filter 
                  ? 'bg-white/20' 
                  : 'bg-grey-light/10 dark:bg-dark-lighter'
                }
              `}>
                {getFilterCount(filter)}
              </span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent-red/10 flex items-center justify-center">
              <Users className="w-10 h-10 text-accent-red" />
            </div>
            <h3 className="text-xl font-semibold text-dark dark:text-neutral-lightest mb-2">
              Erreur
            </h3>
            <p className="text-grey-medium dark:text-grey-light mb-6">
              {error}
            </p>
            <button 
              onClick={fetchClubs}
              className="px-5 py-2.5 bg-accent-green hover:bg-accent-green/90 text-white rounded-lg font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Clubs Grid */}
        {!isLoading && !error && filteredClubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClubs.map((club) => (
              <div
                key={club.id}
                className="group bg-white dark:bg-dark-secondary rounded-2xl p-5 border border-grey-light/10 dark:border-dark-light/50 hover:border-accent-green/30 dark:hover:border-accent-green/30 transition-colors"
              >
                {/* Header with role badge and avatar */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-green to-accent-blue flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {club.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark dark:text-neutral-lightest group-hover:text-accent-green transition-colors">
                        {club.name}
                      </h3>
                      <div className="flex items-center gap-1 text-grey-medium dark:text-grey-light text-xs mt-0.5">
                        <span>Créé le {new Date(club.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Role Badge */}
                  <span className={`
                    px-2.5 py-1 rounded-full text-xs font-semibold border
                    flex items-center gap-1.5
                    ${getRoleBadgeColor(club.role)}
                  `}>
                    {getRoleIcon(club.role)}
                    <span>{mapRole(club.role)}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-green hover:bg-accent-green/90 text-white rounded-lg font-medium transition-colors">
                    <Eye className="w-4 h-4" />
                    <span>Voir</span>
                  </button>
                  <button 
                    onClick={() => handleEdit(club)}
                    disabled={!isPresident(club.role)}
                    className="p-2.5 bg-grey-light/10 dark:bg-dark-light hover:bg-accent-blue/10 dark:hover:bg-accent-blue/10 text-grey-medium dark:text-grey-light hover:text-accent-blue dark:hover:text-accent-blue rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-grey-light/10 disabled:hover:text-grey-medium"
                    title={!isPresident(club.role) ? 'Réservé au président' : 'Modifier le club'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(club)}
                    disabled={!isPresident(club.role)}
                    className="p-2.5 bg-grey-light/10 dark:bg-dark-light hover:bg-accent-red/10 dark:hover:bg-accent-red/10 text-grey-medium dark:text-grey-light hover:text-accent-red dark:hover:text-accent-red rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-grey-light/10 disabled:hover:text-grey-medium"
                    title={!isPresident(club.role) ? 'Réservé au président' : 'Supprimer le club'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredClubs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-grey-light/10 dark:bg-dark-light flex items-center justify-center">
              <Users className="w-10 h-10 text-grey-medium dark:text-grey-light" />
            </div>
            <h3 className="text-xl font-semibold text-dark dark:text-neutral-lightest mb-2">
              {activeFilter === 'Tous' ? 'Aucun club' : 'Aucun club trouvé'}
            </h3>
            <p className="text-grey-medium dark:text-grey-light mb-6">
              {activeFilter === 'Tous' 
                ? 'Créez votre premier club pour commencer !' 
                : 'Aucun club ne correspond à vos critères de recherche.'}
            </p>
            {activeFilter === 'Tous' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-accent-green hover:bg-accent-green/90 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Créer un club</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de création de club */}
      <CreateClubModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchClubs(); // Rafraîchir la liste après création
        }}
      />

      {/* Modal d'édition de club */}
      {editingClub && (
        <EditClubModal
          isOpen={!!editingClub}
          onClose={() => setEditingClub(null)}
          onSuccess={() => {
            setEditingClub(null);
            fetchClubs(); // Rafraîchir la liste après modification
          }}
          clubId={editingClub.id}
          currentName={editingClub.name}
        />
      )}

      {/* Modal de suppression de club */}
      {deletingClub && (
        <DeleteClubModal
          isOpen={!!deletingClub}
          onClose={() => setDeletingClub(null)}
          onSuccess={() => {
            setDeletingClub(null);
            fetchClubs(); // Rafraîchir la liste après suppression
          }}
          clubId={deletingClub.id}
          clubName={deletingClub.name}
        />
      )}
    </div>
  );
}