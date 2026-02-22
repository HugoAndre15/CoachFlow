'use client';

import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Phone, Mail, Send } from 'lucide-react';

export default function ContactSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.1);
  const { ref: contentRef, isVisible: contentVisible } = useScrollReveal(0.05);
  const [accepted, setAccepted] = useState(false);

  return (
    <section className="py-16 lg:py-24">
      {/* Header */}
      <div
        ref={headerRef}
        className={`text-center mb-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 mb-6">
          <span className="text-accent-green text-sm font-medium">Contactez-nous</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-lightest mb-4">
          Parlons de votre projet
        </h2>
        <p className="text-grey-medium text-lg max-w-2xl mx-auto">
          Notre équipe est là pour répondre à toutes vos questions et vous accompagner dans la mise en place de votre solution.
        </p>
      </div>

      <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid lg:grid-cols-5 gap-10 lg:gap-16 transition-all duration-1000 ${
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Phone Card */}
            <div className="flex items-start gap-4 p-5 bg-dark-secondary/60 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-lightest mb-1">Téléphone</h4>
                <p className="text-sm text-grey-medium">+33 1 23 45 67 89</p>
                <p className="text-xs text-grey-medium mt-0.5">Lun - Ven, 9h - 18h</p>
              </div>
            </div>

            {/* Email Card */}
            <div className="flex items-start gap-4 p-5 bg-dark-secondary/60 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-accent-green/15 text-accent-green flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-lightest mb-1">Email</h4>
                <p className="text-sm text-grey-medium">contact@coachflow.fr</p>
                <p className="text-xs text-grey-medium mt-0.5">Réponse sous 24h</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-dark-secondary/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-neutral-lightest mb-6">
                Envoyez-nous un message
              </h3>
              <p className="text-sm text-grey-medium mb-6">
                Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
              </p>

              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                {/* Row: Nom + Email */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-lightest mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      placeholder="Nom complet"
                      className="w-full px-4 py-3 bg-dark/60 border border-white/10 rounded-xl text-sm text-neutral-lightest placeholder:text-grey-medium/60 focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-lightest mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="your.exemple@mail.fr"
                      className="w-full px-4 py-3 bg-dark/60 border border-white/10 rounded-xl text-sm text-neutral-lightest placeholder:text-grey-medium/60 focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/25 transition-all"
                    />
                  </div>
                </div>

                {/* Club name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-lightest mb-2">
                    Nom du club
                  </label>
                  <input
                    type="text"
                    placeholder="FC Porto"
                    className="w-full px-4 py-3 bg-dark/60 border border-white/10 rounded-xl text-sm text-neutral-lightest placeholder:text-grey-medium/60 focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/25 transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-neutral-lightest mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Décrivez votre projet ou posez vos questions..."
                    className="w-full px-4 py-3 bg-dark/60 border border-white/10 rounded-xl text-sm text-neutral-lightest placeholder:text-grey-medium/60 focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/25 transition-all resize-none"
                  />
                </div>

                {/* Privacy checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-dark/60 border-white/20 text-accent-green focus:ring-accent-green/25 focus:ring-offset-0"
                  />
                  <span className="text-xs text-grey-medium leading-relaxed">
                    J&apos;accepte que mes données soient traitées conformément à la politique de
                    confidentialité et je consens à être contacté(e) pour donner suite à ma demande.
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  className="group w-full flex items-center justify-center gap-2 py-3.5 bg-accent-green text-white font-semibold rounded-xl hover:bg-accent-green/90 transition-all duration-300 hover:shadow-lg hover:shadow-accent-green/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!accepted}
                >
                  <Send className="w-4 h-4" />
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
