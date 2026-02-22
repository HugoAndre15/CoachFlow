export default function JoueursLoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/40 dark:bg-dark-lighter/40 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white/40 dark:bg-dark-lighter/40 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-2 mt-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-white/40 dark:bg-dark-lighter/40 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
