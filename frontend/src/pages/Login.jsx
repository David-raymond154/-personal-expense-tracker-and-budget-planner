import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { apiErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  async function onReset() {
    setError('');
    setInfo('');
    if (!form.email) {
      setError('Enter your email above, then click reset.');
      return;
    }
    try {
      const res = await authApi.resetPassword(form.email);
      setInfo(res.message);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-bold text-brand-600">Welcome back</h1>
        <p className="mb-6 text-sm text-gray-500">Sign in to your expense tracker</p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {info}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder="you@university.edu"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={onReset}
          className="mt-3 text-sm text-brand-600 hover:underline"
          type="button"
        >
          Forgot password?
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          No account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
