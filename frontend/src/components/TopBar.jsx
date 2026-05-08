export default function TopBar({ user, onLogout }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Enterprise Dashboard</p>
        <h2 className="text-3xl font-semibold text-slate-900">Validation overview</h2>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div>
          <p className="text-xs text-slate-500">Current user</p>
          <p className="text-sm font-medium text-slate-900">{user?.email || user?.username || 'Guest'}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
