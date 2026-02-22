'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight, Play, Star } from 'lucide-react';

export default function HeroSection() {
  const { ref, isVisible } = useScrollReveal(0.05);

  return (
    <section ref={ref} className="relative pt-16 pb-20 lg:pt-28 lg:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div
            className={`transition-all duration-1000 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-accent-green text-sm font-medium">
                Plateforme de gestion de club
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-lightest leading-[1.1] mb-6">
              Gérez votre club
              <br />
              comme un
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">
                professionnel
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base lg:text-lg text-grey-medium max-w-lg mb-8 leading-relaxed">
              Simplifiez la gestion de votre club avec notre plateforme tout-en-un
              pour gérer vos équipes, suivre les performances de vos joueurs et
              organiser vos matchs. Transformez votre club avec des outils
              professionnels accessibles à tous.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <a
                href="/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-accent-green text-white font-semibold rounded-xl hover:bg-accent-green/90 transition-all duration-300 hover:shadow-lg hover:shadow-accent-green/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 border border-white/10 text-neutral-lightest font-semibold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                <Play className="w-4 h-4" />
                Voir la démo
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-10 sm:gap-14">
              {[
                { value: '500+', label: 'Clubs actifs' },
                { value: '15K+', label: 'Joueurs gérés' },
                { value: '98%', label: 'Satisfaction' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl sm:text-3xl font-bold text-neutral-lightest">
                    {stat.value}
                  </p>
                  <p className="text-sm text-grey-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Dashboard Mockup */}
          <div
            className={`relative hidden lg:block transition-all duration-1000 delay-300 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
            }`}
          >
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-8 bg-gradient-to-br from-accent-green/20 via-transparent to-accent-blue/15 rounded-3xl blur-3xl" />

      {/* Card */}
      <div className="relative bg-dark-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-neutral-lightest">
            Vue d&apos;ensemble
          </h3>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5 fill-accent-green text-accent-green"
              />
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-dark/60 rounded-xl p-4 mb-4">
          <div className="flex items-end justify-between h-28 gap-1.5">
            {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-accent-green/50 to-accent-green/90 rounded-t transition-all duration-500"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark/40 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-grey-medium">Matchs ce mois</p>
            <p className="text-xl font-bold text-neutral-lightest mt-1">24</p>
          </div>
          <div className="bg-dark/40 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-grey-medium">Victoires</p>
            <p className="text-xl font-bold text-accent-green mt-1">18</p>
          </div>
        </div>
      </div>
    </div>
  );
}
