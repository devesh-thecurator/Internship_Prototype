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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-3xl font-semibold text-slate-900">Create account</h1>
        <p className="mt-2 text-slate-500">Get started with AI term sheet validation in minutes.</p>
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
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
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
            Register
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-blue-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
