import { useEffect, useState } from 'react';
import { expenseApi, budgetApi } from '../api';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { formatCurrency, todayISO } from '../utils/format';

const emptyForm = { amount: '', category: 'Food', description: '', date: todayISO() };

export default function Expenses() {
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('');
  const [exceeded, setExceeded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    try {
      setCategories(await expenseApi.categories());
    } catch {
      // non-fatal
    }
  }

  async function loadExceeded() {
    try {
      const status = await budgetApi.status();
      setExceeded(status.filter((s) => s.is_exceeded));
    } catch {
      setExceeded([]);
    }
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = filter ? { category: filter } : {};
      setRecords(await expenseApi.list(params));
      await loadExceeded();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setWarning('');
    setModalOpen(true);
  }

  function openEdit(record) {
    setEditing(record);
    setForm({
      amount: record.amount,
      category: record.category,
      description: record.description || '',
      date: record.date,
    });
    setFormError('');
    setModalOpen(true);
  }

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!form.amount || Number(form.amount) <= 0) return 'Amount must be a positive number.';
    if (!form.category) return 'Category is required.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return 'A valid date is required.';
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        amount: Number(form.amount),
        category: form.category,
        description: form.description.trim(),
        date: form.date,
      };
      const res = editing
        ? await expenseApi.update(editing.id, payload)
        : await expenseApi.create(payload);
      setModalOpen(false);
      if (res.warning) {
        setWarning(res.warning.message);
      } else {
        setWarning('');
      }
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(record) {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseApi.remove(record.id);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const total = records.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-gray-500">Total shown: ${formatCurrency(total)}</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Expense
        </button>
      </div>

      {warning && (
        <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ⚠️ {warning}
        </div>
      )}

      {exceeded.length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          🚨 Over budget this month:{' '}
          {exceeded
            .map((s) => `${s.category} ($${formatCurrency(s.amount_spent)}/$${formatCurrency(s.limit_amount)})`)
            .join(', ')}
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Filter by category:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner label="Loading expenses..." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.description || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">
                      ${formatCurrency(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(r)}
                        className="mr-3 text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => onDelete(r)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Expense' : 'Add Expense'}
        onClose={() => setModalOpen(false)}
      >
        {formError && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="amount"
              value={form.amount}
              onChange={update}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={update}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description (optional)</label>
            <input
              name="description"
              value={form.description}
              onChange={update}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
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
