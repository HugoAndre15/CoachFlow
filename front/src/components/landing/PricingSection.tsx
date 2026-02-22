'use client';

import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check, ArrowRight } from 'lucide-react';

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Coach',
    description: 'Parfait pour les entraîneurs individuels',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '1 équipe',
      "Jusqu'à 25 joueurs",
      'Statistiques de base',
      'Gestion des matchs',
      'Support email',
    ],
  },
  {
    name: 'Team',
    description: 'Idéal pour les petites équipes avec ambition',
    monthlyPrice: 15,
    yearlyPrice: 12,
    features: [
      '3 équipes',
      "Jusqu'à 75 joueurs",
      'Convocations',
      'Statistiques avancées',
      'Rapports de match détaillés',
      'Support prioritaire',
    ],
  },
  {
    name: 'Club',
    description: 'La solution complète pour les clubs exigeants',
    monthlyPrice: 35,
    yearlyPrice: 28,
    highlighted: true,
    features: [
      'Équipes illimitées',
      "Jusqu'à 500 joueurs",
      'Convocations',
      'Facturation',
      'Statistiques complètes',
      'Support dédié 24/7',
    ],
  },
  {
    name: 'Club+',
    description: 'Pour les structures multi-sites et centres de formation',
    monthlyPrice: 59,
    yearlyPrice: 47,
    features: [
      'Illimité',
      'Personnalisation totale',
      'API accessible',
      'Account manager dédié',
      'Tout garanti',
    ],
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.1);
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollReveal(0.05);

  return (
    <section className="py-16 lg:py-24">
      {/* Header */}
      <div
        ref={headerRef}
        className={`text-center mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 mb-6">
          <span className="text-accent-green text-sm font-medium">Tarifs et pricing</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-lightest mb-4">
          Choisissez votre plan
        </h2>
        <p className="text-grey-medium text-lg max-w-2xl mx-auto mb-8">
          Des solutions adaptées à tous les clubs, de l&apos;équipe amateur au club professionnel.
          Commencez gratuitement et évoluez selon vos besoins.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-1 p-1 bg-dark-secondary/80 border border-white/10 rounded-xl">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
              !isYearly
                ? 'bg-accent-green text-white shadow-lg shadow-accent-green/20'
                : 'text-grey-medium hover:text-neutral-lightest'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
              isYearly
                ? 'bg-accent-green text-white shadow-lg shadow-accent-green/20'
                : 'text-grey-medium hover:text-neutral-lightest'
            }`}
          >
            Annuel
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                isYearly ? 'bg-white/20 text-white' : 'bg-accent-green/15 text-accent-green'
              }`}
            >
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div ref={cardsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative group rounded-2xl p-6 transition-all duration-700 border
                ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-accent-green/10 to-dark-secondary/80 border-accent-green/30 shadow-xl shadow-accent-green/5'
                    : 'bg-dark-secondary/60 border-white/5 hover:border-white/10'
                }
                ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Recommended badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent-green text-white text-xs font-semibold rounded-full">
                  Populaire
                </div>
              )}

              {/* Plan Name */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      plan.highlighted
                        ? 'bg-accent-green text-white'
                        : 'bg-dark-lighter text-grey-medium'
                    }`}
                  >
                    {plan.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-lightest">{plan.name}</h3>
                </div>
                <p className="text-xs text-grey-medium">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-neutral-lightest">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}€
                  </span>
                  <span className="text-sm text-grey-medium mb-1">/mois</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? 'text-accent-green' : 'text-grey-medium'
                      }`}
                    />
                    <span className="text-sm text-neutral-lightest/80">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="/register"
                className={`group/btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-accent-green text-white hover:bg-accent-green/90 hover:shadow-lg hover:shadow-accent-green/25'
                    : 'bg-white/5 border border-white/10 text-neutral-lightest hover:bg-white/10'
                }`}
              >
                Commencer
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
