import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ email: 'demo@greenfleet.ai', password: 'demo1234' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please provide both email and password.');
      return;
    }

    const session = { access_token: 'demo-token', user: { email: form.email } };
    localStorage.setItem('greenfleet-demo-session', JSON.stringify(session));
    setSession(session);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="text-3xl font-black text-emerald-900">GreenFleet AI</div>
          <p className="mt-2 text-sm text-slate-600">Sign in to your fleet workspace</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label>Password</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}
          <button type="submit" className="btn w-full">Log in</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-600">
          Need an account? <Link to="/signup" className="font-semibold text-emerald-700">Create one</Link>
        </div>
      </div>
    </div>
  );
}
