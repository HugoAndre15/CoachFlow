'use client';

import { useState } from 'react';
import { clubService } from '@/services/clubService';

interface JoinClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function JoinClubModal({ isOpen, onClose, onSuccess }: JoinClubModalProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'request'>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      setError('Veuillez entrer un code de club');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await clubService.joinByCode(inviteCode.trim().toUpperCase());
      setSuccess(result.message);
      setInviteCode('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error joining club:', err);
      setError(err.response?.data?.message || 'Erreur lors de la tentative de rejoindre le club');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setInviteCode('');
      setError(null);
      setSuccess(null);
      setActiveTab('code');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-dark-lighter rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-dark-light/30" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-grey-medium hover:text-white transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">
            Rejoindre un club
          </h2>
          <p className="text-sm text-grey-medium mt-1">
            Choisissez votre méthode pour rejoindre un club existant
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'code'
                ? 'bg-accent-green text-white'
                : 'bg-dark text-grey-medium hover:text-white hover:bg-dark-light/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Code du club
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'request'
                ? 'bg-accent-green text-white'
                : 'bg-dark text-grey-medium hover:text-white hover:bg-dark-light/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Envoyer une demande
          </button>
        </div>

        {/* Tab content: Code */}
        {activeTab === 'code' && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="inviteCode" className="block text-sm font-medium text-grey-medium mb-2">
                Code du club
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123XYZ"
                disabled={isLoading}
                maxLength={9}
                className="w-full px-4 py-3 rounded-lg border border-dark-light/40 bg-dark text-white placeholder-grey-medium
                  focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  tracking-widest text-center text-lg font-mono uppercase"
                autoFocus
              />
            </div>

            {/* Info box */}
            <div className="mb-5 p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-lg flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-accent-blue" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-accent-blue">Information</p>
                <p className="text-xs text-grey-medium mt-0.5">
                  Le code du club vous a été fourni par l&apos;administrateur. Il est composé de 9 caractères alphanumériques.
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <p className="text-sm text-accent-red">{error}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mb-4 p-3 bg-accent-green/10 border border-accent-green/20 rounded-lg">
                <p className="text-sm text-accent-green">{success}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-dark hover:bg-dark-light text-grey-medium rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !inviteCode.trim()}
                className="flex-1 px-4 py-3 bg-accent-green hover:bg-accent-green/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Connexion...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Rejoindre
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab content: Request (placeholder for future) */}
        {activeTab === 'request' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-dark rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-grey-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-grey-medium">
              Cette fonctionnalité sera disponible prochainement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
