export default function FooterBar() {
  return (
    <footer className="w-full bg-neutral-lightest dark:bg-dark border-t border-neutral dark:border-dark-light">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo/Nom */}
          <div className="text-lg font-semibold text-dark dark:text-neutral-lightest">
            CoachFlow
          </div>

          {/* Copyright */}
          <div className="text-sm text-dark-lighter dark:text-neutral">
            © 2026 CoachFlow
          </div>
        </div>
      </div>
    </footer>
  );
}
