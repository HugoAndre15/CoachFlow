'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Users, Trophy, ShieldCheck, Headphones } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '15,000+',
    label: 'Joueurs gérés',
    color: 'bg-accent-green/15 text-accent-green',
  },
  {
    icon: Trophy,
    value: '50K+',
    label: 'Matchs suivis',
    color: 'bg-amber-500/15 text-amber-400',
  },
  {
    icon: ShieldCheck,
    value: '99.9%',
    label: 'Disponibilité',
    color: 'bg-red-500/15 text-red-400',
  },
  {
    icon: Headphones,
    value: '24/7',
    label: 'Support client',
    color: 'bg-accent-blue/15 text-accent-blue',
  },
];

export default function StatsBar() {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section ref={ref} className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`group bg-dark-secondary/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6 text-center
                hover:border-white/10 hover:bg-dark-secondary/80 transition-all duration-700
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div
                className={`w-12 h-12 mx-auto rounded-xl ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-neutral-lightest mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-grey-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
