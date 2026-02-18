interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export default function StatsCard({ title, value, subtitle, icon, iconBgColor, iconColor }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-light">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-neutral text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-neutral-lightest mt-2">{value}</p>
          <p className={`text-xs mt-1 ${subtitle.includes('%') ? 'text-accent-green' : ''}`}>{subtitle}</p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
