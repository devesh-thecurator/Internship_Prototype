import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await login({ username: form.username, password: form.password });
      localStorage.setItem('auth_token', data.access);
      localStorage.setItem('auth_refresh', data.refresh);
      window.location.assign('/');
    } catch (err) {
      setError('Unable to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-3xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-slate-500">Access term sheet validation, upload documents, and AI insights.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-primary focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-primary focus:ring-2 focus:ring-blue-200"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
            Sign in
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          New to the platform? <Link to="/register" className="text-blue-700">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
