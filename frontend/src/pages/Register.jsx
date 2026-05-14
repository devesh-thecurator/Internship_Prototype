import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: '',
        last_name: '',
        role: 'reviewer',
      });
      navigate('/login');
    } catch (err) {
      setError('Unable to register. Please verify your information.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#0e7490_0,#020617_42%,#050505_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-cyan-300/15 bg-slate-950/85 p-10 shadow-[0_30px_100px_rgba(0,0,0,.44)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Automotive AI cockpit</p>
        <h1 className="mt-3 text-3xl font-black text-white">Create account</h1>
        <p className="mt-2 text-slate-400">Get started with automatic automobile term sheet validation in minutes.</p>
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
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-white">
            Register
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-cyan-200">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
