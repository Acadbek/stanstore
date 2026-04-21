export function StoreUnavailable({
  title = 'Store temporarily unavailable',
  description = 'Database connection is timing out. Check the DB connection and try again.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Temporary issue
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        <p className="mt-6 text-xs text-slate-400">
          If this is local development, verify the configured database host is
          reachable.
        </p>
      </div>
    </div>
  );
}
