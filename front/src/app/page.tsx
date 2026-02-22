'use client';

import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PricingSection from '@/components/landing/PricingSection';
import ContactSection from '@/components/landing/ContactSection';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* ── Background Orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Hero area */}
        <div className="absolute -top-20 -left-40 w-[500px] h-[500px] rounded-full bg-accent-green/20 blur-[140px] animate-pulse-glow" />
        <div className="absolute top-40 -right-32 w-[400px] h-[400px] rounded-full bg-accent-blue/15 blur-[120px] animate-float" />

        {/* Stats / Features area */}
        <div className="absolute top-[800px] left-1/4 w-[350px] h-[350px] rounded-full bg-accent-green/10 blur-[100px] animate-float-delayed" />
        <div className="absolute top-[1400px] -right-20 w-[450px] h-[450px] rounded-full bg-accent-blue/10 blur-[120px] animate-pulse-glow" />

        {/* Middle features */}
        <div className="absolute top-[2200px] -left-32 w-[400px] h-[400px] rounded-full bg-accent-green/15 blur-[120px] animate-float" />
        <div className="absolute top-[2800px] right-1/4 w-[300px] h-[300px] rounded-full bg-accent-blue/10 blur-[100px] animate-float-delayed" />

        {/* Pricing / Contact area */}
        <div className="absolute top-[3400px] left-0 w-[400px] h-[400px] rounded-full bg-accent-green/10 blur-[100px] animate-pulse-glow" />
        <div className="absolute top-[4000px] -right-20 w-[350px] h-[350px] rounded-full bg-accent-blue/15 blur-[120px] animate-float" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10">
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <PricingSection />
        <ContactSection />
      </div>
    </div>
  );
}
