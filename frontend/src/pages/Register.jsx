import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!form.name.trim()) return 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-bold text-brand-600">Create your account</h1>
        <p className="mb-6 text-sm text-gray-500">Start tracking your expenses today</p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={update}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder="Jane Student"
            />
          </div>
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
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm password</label>
            <input
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={update}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder="Re-enter password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
