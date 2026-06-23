import { useEffect, useState } from 'react';
import { budgetApi, expenseApi } from '../api';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import { formatCurrency, currentMonthYear, monthName } from '../utils/format';

export default function Budgets() {
  const { month, year } = currentMonthYear();
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: 'Food', limit_amount: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [status, cats] = await Promise.all([
        budgetApi.status({ month, year }),
        expenseApi.categories(),
      ]);
      setStatuses(status);
      setCategories(cats);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ category: 'Food', limit_amount: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(status) {
    setEditing(status);
    setForm({ category: status.category, limit_amount: status.limit_amount });
    setFormError('');
    setModalOpen(true);
  }

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.limit_amount || Number(form.limit_amount) <= 0) {
      setFormError('Limit must be a positive number.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await budgetApi.update(editing.id, { limit_amount: Number(form.limit_amount) });
      } else {
        await budgetApi.create({
          category: form.category,
          month,
          year,
          limit_amount: Number(form.limit_amount),
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(status) {
    if (!window.confirm(`Delete the ${status.category} budget?`)) return;
    try {
      await budgetApi.remove(status.id);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-gray-500">
            {monthName(month)} {year}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Set Budget
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading budgets..." />
      ) : statuses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
          No budgets set for this month yet. Click “Set Budget” to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {statuses.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.category}</h3>
                  <p className="text-sm text-gray-500">
                    ${formatCurrency(s.amount_spent)} of ${formatCurrency(s.limit_amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      s.is_exceeded ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {s.is_exceeded
                      ? `Over by $${formatCurrency(Math.abs(s.amount_remaining))}`
                      : `$${formatCurrency(s.amount_remaining)} left`}
                  </p>
                </div>
              </div>
              <ProgressBar spent={s.amount_spent} limit={s.limit_amount} />
              <div className="mt-3 flex justify-end gap-3 text-sm">
                <button onClick={() => openEdit(s)} className="text-brand-600 hover:underline">
                  Edit
                </button>
                <button onClick={() => onDelete(s)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Edit ${editing.category} Budget` : 'Set Budget'}
        onClose={() => setModalOpen(false)}
      >
        {formError && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={update}
              disabled={Boolean(editing)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none disabled:bg-gray-100"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Monthly limit</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="limit_amount"
              value={form.limit_amount}
              onChange={update}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
