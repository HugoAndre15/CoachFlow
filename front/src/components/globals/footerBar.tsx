export default function FooterBar() {
  return (
    <footer className="w-full bg-neutral-lightest dark:bg-dark border-t border-neutral dark:border-dark-light">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo/Nom */}
          <div className="text-lg font-semibold text-dark dark:text-neutral-lightest">
            MatchFlow
          </div>

          {/* Liens */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-dark-lighter dark:text-neutral">
            <a href="/about" className="hover:text-accent-green transition-colors">
              À propos
            </a>
            <a href="/terms" className="hover:text-accent-green transition-colors">
              Conditions d&apos;utilisation
            </a>
            <a href="/privacy" className="hover:text-accent-green transition-colors">
              Confidentialité
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-dark-lighter dark:text-neutral">
            © 2026 MatchFlow
          </div>
        </div>
      </div>
    </footer>
  );
}
