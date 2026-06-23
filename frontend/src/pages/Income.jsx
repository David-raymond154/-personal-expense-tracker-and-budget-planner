import { useEffect, useState } from 'react';
import { incomeApi } from '../api';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { formatCurrency, todayISO } from '../utils/format';

const emptyForm = { amount: '', source: '', description: '', date: todayISO() };

export default function Income() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setRecords(await incomeApi.list());
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(record) {
    setEditing(record);
    setForm({
      amount: record.amount,
      source: record.source,
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
    if (!form.source.trim()) return 'Source is required.';
    if (!form.amount || Number(form.amount) <= 0) return 'Amount must be a positive number.';
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
        source: form.source.trim(),
        description: form.description.trim(),
        date: form.date,
      };
      if (editing) {
        await incomeApi.update(editing.id, payload);
      } else {
        await incomeApi.create(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(record) {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await incomeApi.remove(record.id);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const total = records.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income</h1>
          <p className="text-sm text-gray-500">Total recorded: ${formatCurrency(total)}</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Income
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading income..." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No income records yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">{r.source}</td>
                    <td className="px-4 py-3 text-gray-500">{r.description || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
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
        title={editing ? 'Edit Income' : 'Add Income'}
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
            <label className="mb-1 block text-sm font-medium">Source</label>
            <input
              name="source"
              value={form.source}
              onChange={update}
              placeholder="e.g. Part-time job, Scholarship"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
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
