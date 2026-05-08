import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase text-slate-500">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-2 text-slate-600">The requested workspace view is unavailable.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
