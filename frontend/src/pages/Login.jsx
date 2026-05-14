import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchProfile, login } from '../services/auth';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ username: form.username, password: form.password });
      const profile = await fetchProfile();
      setUser(profile);

      const from = location.state?.from;
      const destination = from
        ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`
        : '/';
      navigate(destination, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError(`Cannot reach the backend at ${API_BASE_URL}. Start the Django server and try again.`);
      } else if (err.response.status === 401) {
        setError('Unable to sign in. Please check your username and password.');
      } else {
        setError('Unable to sign in right now. Please try again in a moment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#0e7490_0,#020617_42%,#050505_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-cyan-300/15 bg-slate-950/85 p-10 shadow-[0_30px_100px_rgba(0,0,0,.44)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Automotive AI cockpit</p>
        <h1 className="mt-3 text-3xl font-black text-white">Sign in</h1>
        <p className="mt-2 text-slate-400">Access automatic term sheet validation, cockpit telemetry, and AI supplier intelligence.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-300">Username</label>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border border-cyan-300/15 bg-white/10 px-4 py-3 text-white focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border border-cyan-300/15 bg-white/10 px-4 py-3 text-white focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15"
            />
          </div>
          {error && <p className="text-sm font-medium text-red-300" role="alert">{error}</p>}
          <button
            className="w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-400">
          New to the platform? <Link to="/register" className="text-cyan-200">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
