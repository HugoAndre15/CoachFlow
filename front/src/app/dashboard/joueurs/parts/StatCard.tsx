export default function StatCard({
  icon, label, value, sub, barColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  barColor: string;
}) {
  return (
    <div className="relative bg-white/60 dark:bg-dark-lighter/60 backdrop-blur-sm border border-neutral/10 dark:border-dark-light/60 rounded-2xl overflow-hidden group hover:border-dark-light/80 transition-all duration-300">
      <div className={`h-1 w-full ${barColor}`} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-dark-secondary/60 dark:bg-dark/50 border border-neutral/10 dark:border-dark-light flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <p className="text-xs font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide">{label}</p>
        </div>
        <p className="text-2xl font-bold text-dark dark:text-white">{value}</p>
        {sub && <p className="text-xs text-dark-light/50 dark:text-neutral/50 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
