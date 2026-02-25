'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check, Shield, Zap, Send, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

export default function FeaturesSection() {
  return (
    <section className="py-16 lg:py-24">
      {/* Section Header */}
      <SectionHeader />

      {/* Feature 1: Dashboard */}
      <FeatureBlock
        badge={{ icon: <Shield className="w-4 h-4" />, text: 'Gestion du club', color: 'amber' }}
        title="Administrez votre club comme jamais auparavant"
        description="Centralisez toutes les informations de votre club : équipes, joueurs, staff, infrastructures. Gérez les licences, les cotisations, et les documents administratifs en quelques clics."
        features={[
          'Gestion multi-équipes',
          'Suivi administratif',
          'Gestion financière',
        ]}
        featureDescriptions={[
          "Organisez toutes vos équipes par catégories d'âge et niveaux de compétition.",
          'Gérez les documents, licences et certificats médicaux. Suivi des échéances.',
          'Suivez les cotisations, les budgets et les finances de votre club.',
        ]}
        ctaText="Découvrir cette fonctionnalité"
        mockup={<DashboardFeatureMockup />}
        reversed={false}
      />

      {/* Feature 2: Match en direct */}
      <FeatureBlock
        badge={{ icon: <Zap className="w-4 h-4" />, text: 'Suivi en direct', color: 'green' }}
        title="Suivez vos matchs en temps réel avec des statistiques détaillées"
        description="Enregistrez les événements du match en direct, consultez les statistiques détaillées et partagez les résultats automatiquement. Toutes les stats du match sous vos yeux."
        features={[
          'Suivi en direct',
          'Statistiques avancées',
          'Rapports automatiques',
        ]}
        featureDescriptions={[
          'Enregistrez buts, passes, cartons et fautes en live depuis votre téléphone.',
          'Analyses détaillées par joueur, par match et par saison complète.',
          'Rapports de match générés automatiquement après chaque rencontre.',
        ]}
        ctaText="Découvrir les statistiques"
        mockup={<MatchLiveMockup />}
        reversed={true}
      />

      {/* Feature 3: Convocations */}
      {/* 
      <FeatureBlock
        badge={{ icon: <Send className="w-4 h-4" />, text: 'Convocations', color: 'blue' }}
        title="Convoquez vos joueurs en un clic par email et SMS"
        description="Envoyez vos convocations professionnelles à votre staff en un clic. Suivez les confirmations en temps réel et gérez les absences facilement."
        features={[
          'Envoi automatique',
          'Statistiques ouvertes',
          'Rappels automatiques',
        ]}
        featureDescriptions={[
          'Envoyez les convocations par email et SMS en un seul clic.',
          'Suivez qui a ouvert la convocation et qui a confirmé sa présence.',
          'Les joueurs reçoivent des rappels automatiques avant chaque match.',
        ]}
        ctaText="Essayer les convocations"
        mockup={<ConvocationMockup />}
        reversed={false}
      /> 
      */}
    </section>
  );
}

/* ─── Section Header ─── */
function SectionHeader() {
  const { ref, isVisible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`text-center mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 mb-6">
        <span className="text-accent-green text-sm font-medium">Nos fonctionnalités</span>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-lightest mb-4">
        Gérez votre club en toute simplicité
      </h2>
      <p className="text-grey-medium text-lg max-w-2xl mx-auto">
        Tous les outils dont vous avez besoin pour administrer votre club de football, centralisés dans une seule plateforme intuitive.
      </p>
    </div>
  );
}

/* ─── Reusable Feature Block ─── */
interface FeatureBlockProps {
  badge: { icon: ReactNode; text: string; color: 'amber' | 'green' | 'blue' };
  title: string;
  description: string;
  features: string[];
  featureDescriptions: string[];
  ctaText: string;
  mockup: ReactNode;
  reversed: boolean;
}

const badgeColors = {
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  green: 'bg-accent-green/10 border-accent-green/20 text-accent-green',
  blue: 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue',
};

const checkColors = {
  amber: 'text-amber-400 bg-amber-500/10',
  green: 'text-accent-green bg-accent-green/10',
  blue: 'text-accent-blue bg-accent-blue/10',
};

function FeatureBlock({
  badge,
  title,
  description,
  features,
  featureDescriptions,
  ctaText,
  mockup,
  reversed,
}: FeatureBlockProps) {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <div ref={ref} className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
            reversed ? 'lg:[direction:rtl]' : ''
          }`}
        >
          {/* Mockup */}
          <div
            className={`lg:[direction:ltr] transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${reversed ? 'translate-x-12' : '-translate-x-12'}`
            }`}
          >
            {mockup}
          </div>

          {/* Text */}
          <div
            className={`lg:[direction:ltr] transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${reversed ? '-translate-x-12' : 'translate-x-12'}`
            }`}
          >
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 ${badgeColors[badge.color]}`}
            >
              {badge.icon}
              <span className="text-sm font-medium">{badge.text}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-lightest mb-4 leading-tight">
              {title}
            </h3>
            <p className="text-grey-medium mb-8 leading-relaxed">{description}</p>

            {/* Feature List */}
            <div className="space-y-5 mb-8">
              {features.map((feat, i) => (
                <div key={feat} className="flex gap-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${checkColors[badge.color]}`}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-neutral-lightest font-semibold">{feat}</p>
                    <p className="text-grey-medium text-sm mt-0.5">{featureDescriptions[i]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="#"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-accent-green text-white font-semibold rounded-xl hover:bg-accent-green/90 transition-all duration-300 hover:shadow-lg hover:shadow-accent-green/25 hover:scale-[1.02]"
            >
              {ctaText}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Feature Mockup ─── */
function DashboardFeatureMockup() {
  const rows = [
    { label: 'Équipes inscrites', value: '18', bar: 72, color: 'bg-accent-green' },
    { label: 'Joueurs inscrits', value: '247', bar: 88, color: 'bg-accent-blue' },
    { label: 'Taux de présence', value: '89%', bar: 89, color: 'bg-amber-400' },
    { label: 'Taux de progression', value: '5%', bar: 45, color: 'bg-purple-400' },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-br from-amber-500/10 via-transparent to-accent-green/10 rounded-3xl blur-2xl" />
      <div className="relative bg-dark-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-accent-green" />
          <h4 className="text-sm font-semibold text-neutral-lightest">Tableau de bord</h4>
        </div>
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-grey-medium truncate">{row.label}</span>
                  <span className="text-sm font-bold text-neutral-lightest">{row.value}</span>
                </div>
                <div className="h-1.5 bg-dark/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${row.bar}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Match Live Mockup ─── */
function MatchLiveMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-br from-accent-green/10 via-transparent to-accent-blue/10 rounded-3xl blur-2xl" />
      <div className="relative bg-dark-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-400">Match en direct</span>
          </div>
          <span className="text-xs text-grey-medium px-2 py-0.5 bg-dark/40 rounded-full">
            45&apos; 2nde mi-temps
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-6 py-6">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-2 mx-auto">
              <span className="text-xs font-bold text-blue-400">FC</span>
            </div>
            <p className="text-xs text-grey-medium">FC Nantes</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-extrabold text-neutral-lightest">3</span>
            <span className="text-xl text-grey-medium">-</span>
            <span className="text-4xl font-extrabold text-neutral-lightest">2</span>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-2 mx-auto">
              <span className="text-xs font-bold text-red-400">AS</span>
            </div>
            <p className="text-xs text-grey-medium">AS Cannes</p>
          </div>
        </div>

        {/* Events */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="w-8 text-right text-xs text-grey-medium">35&apos;</span>
            <span className="text-accent-green">⚽</span>
            <span className="text-neutral-lightest text-xs">But - M. Dupont</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-8 text-right text-xs text-grey-medium">42&apos;</span>
            <span className="text-amber-400">🟨</span>
            <span className="text-neutral-lightest text-xs">Carton jaune - T. Martin</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Convocation Mockup ─── */
function ConvocationMockup() {
  const players = [
    { name: 'N. Figures', status: 'confirmed' },
    { name: 'P.B', status: 'confirmed' },
    { name: 'L. Martin', status: 'pending' },
    { name: 'E. Pierre', status: 'confirmed' },
    { name: 'L. Moreau', status: 'confirmed' },
    { name: 'A. Duval', status: 'pending' },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-green/10 rounded-3xl blur-2xl" />
      <div className="relative bg-dark-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-blue" />
            <h4 className="text-sm font-semibold text-neutral-lightest">Convocation</h4>
          </div>
          <span className="text-xs text-accent-green font-medium px-2 py-0.5 bg-accent-green/10 rounded-full">
            Envoyé
          </span>
        </div>

        {/* Match info */}
        <p className="text-xs text-grey-medium mb-4">
          FC Lions U17 vs AS Dallas · Sam. 15h00
        </p>

        {/* Date/Location */}
        <div className="flex gap-4 mb-4 text-xs text-grey-medium">
          <span>📅 Samedi 14 Mars</span>
          <span>📍 Stade Municipal</span>
        </div>

        {/* Players */}
        <div className="space-y-2.5">
          {players.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between py-1.5 px-3 bg-dark/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-dark-lighter flex items-center justify-center">
                  <span className="text-[10px] font-medium text-grey-medium">
                    {p.name.charAt(0)}
                  </span>
                </div>
                <span className="text-xs text-neutral-lightest">{p.name}</span>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  p.status === 'confirmed'
                    ? 'bg-accent-green/15 text-accent-green'
                    : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                {p.status === 'confirmed' ? 'Confirmé' : 'En attente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
