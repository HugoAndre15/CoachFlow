export default function TopCard({
  icon, title, name, value, accentText,
}: {
  icon: React.ReactNode;
  title: string;
  name: string;
  value: string;
  accentText: string;
}) {
  return (
    <div className="bg-white/60 dark:bg-dark-lighter/60 backdrop-blur-sm border border-neutral/10 dark:border-dark-light/60 rounded-2xl p-5 hover:border-dark-light/80 transition-all duration-300">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-dark-secondary/50 dark:bg-dark/50 border border-neutral/10 dark:border-dark-light flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-base font-bold text-dark dark:text-white">{name}</p>
      <p className={`text-sm font-semibold mt-0.5 ${accentText}`}>{value}</p>
    </div>
  );
}
