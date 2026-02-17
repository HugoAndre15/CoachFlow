export default function LoadingState() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-green"></div>
        <p className="text-gray-600 dark:text-neutral text-sm">Chargement...</p>
      </div>
    </div>
  );
}
