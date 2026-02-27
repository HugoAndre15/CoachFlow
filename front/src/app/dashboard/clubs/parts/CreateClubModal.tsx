'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { clubService } from '@/services/clubService';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CityResult {
  nom: string;
  code: string;
  codesPostaux: string[];
  departement: { code: string; nom: string };
}

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB

export default function CreateClubModal({ isOpen, onClose, onSuccess }: CreateClubModalProps) {
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CityResult[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isCitySelected, setIsCitySelected] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Recherche de villes via l'API geo.api.gouv.fr
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,departement&boost=population&limit=7`
      );
      if (res.ok) {
        const data: CityResult[] = await res.json();
        setCitySuggestions(data);
        setShowCitySuggestions(data.length > 0);
      }
    } catch {
      setCitySuggestions([]);
    }
  }, []);

  const handleCityChange = (value: string) => {
    setCity(value);
    setIsCitySelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCities(value), 250);
  };

  const selectCity = (c: CityResult) => {
    const cp = c.codesPostaux?.[0] || '';
    setCity(`${c.nom}${cp ? ` (${cp})` : ''}`);
    setIsCitySelected(true);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image (PNG, JPG, SVG...)');
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError('L\'image ne doit pas dépasser 2 Mo');
      return;
    }

    setError(null);
    setLogoFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setLogoBase64(reader.result as string); // data:image/...;base64,...
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoBase64(null);
    setLogoFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (clubName.trim().length < 3) {
      setError('Le nom du club doit contenir au moins 3 caractères');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await clubService.createClub({
        name: clubName.trim(),
        city: city.trim() || undefined,
        logo: logoBase64 || undefined,
      });
      setClubName('');
      setCity('');
      removeLogo();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error creating club:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du club');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setClubName('');
      setCity('');
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setIsCitySelected(false);
      removeLogo();
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-lightest transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-accent-green/10 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-lightest">
            Créer un nouveau club
          </h2>
          <p className="text-gray-600 dark:text-neutral mt-2">
            Vous serez automatiquement désigné comme président du club
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {/* Club name */}
            <div>
              <label htmlFor="clubName" className="block text-sm font-medium text-gray-700 dark:text-neutral mb-2">
                Nom du club *
              </label>
              <input
                id="clubName"
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Ex: FC Paris, AS Lyon..."
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-light bg-white dark:bg-dark text-gray-900 dark:text-neutral-lightest placeholder-gray-400 dark:placeholder-neutral focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-neutral mt-1">
                Minimum 3 caractères
              </p>
            </div>

            {/* City — autocomplete via geo.api.gouv.fr */}
            <div ref={cityRef} className="relative">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-neutral mb-2">
                Ville
              </label>
              <div className="relative">
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  onFocus={() => { if (citySuggestions.length > 0 && !isCitySelected) setShowCitySuggestions(true); }}
                  placeholder="Rechercher une ville..."
                  disabled={isLoading}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-light bg-white dark:bg-dark text-gray-900 dark:text-neutral-lightest placeholder-gray-400 dark:placeholder-neutral focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {city && !isCitySelected && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400 dark:text-neutral animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}
                {isCitySelected && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Dropdown suggestions */}
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-dark border border-gray-200 dark:border-dark-light rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {citySuggestions.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => selectCity(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-lighter transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-gray-900 dark:text-neutral-lightest">{c.nom}</span>
                      <span className="text-xs text-gray-400 dark:text-neutral flex-shrink-0">
                        {c.departement?.nom} ({c.departement?.code})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral mb-2">
                Logo du club
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
              {logoBase64 ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-neutral-light bg-white dark:bg-dark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoBase64} alt="Aperçu logo" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-neutral-lightest truncate">{logoFileName}</p>
                    <p className="text-xs text-gray-500 dark:text-neutral">Cliquez pour changer</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-accent-red transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-dark-lighter"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full px-4 py-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-light bg-white dark:bg-dark hover:border-accent-green/50 dark:hover:border-accent-green/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8 text-gray-400 dark:text-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-neutral">Cliquez pour choisir une image</span>
                  <span className="text-xs text-gray-400 dark:text-neutral-light">PNG, JPG, SVG — max 2 Mo</span>
                </button>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark hover:bg-gray-200 dark:hover:bg-dark-light text-gray-700 dark:text-neutral rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || clubName.trim().length < 3}
              className="flex-1 px-4 py-3 bg-accent-green hover:bg-accent-green/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer le club
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
