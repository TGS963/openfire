export function BackgroundBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-500/[0.04] dark:bg-amber-500/[0.04] blur-3xl animate-blob"
      />
      <div
        className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-orange-500/[0.03] dark:bg-orange-500/[0.03] blur-3xl animate-blob"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-yellow-500/[0.03] dark:bg-yellow-500/[0.03] blur-3xl animate-blob"
        style={{ animationDelay: '4s' }}
      />
    </div>
  );
}
