export function LoadingState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
        <p className="mt-3 text-sm text-zinc-500">Loading...</p>
      </div>
    </div>
  );
}