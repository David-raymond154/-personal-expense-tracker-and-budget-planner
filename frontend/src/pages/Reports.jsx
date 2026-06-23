import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { reportApi } from '../api';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import { formatCurrency, MONTHS, currentMonthYear } from '../utils/format';

const COLORS = [
  '#4f46e5',
  '#16a34a',
  '#f59e0b',
  '#ef4444',
  '#0ea5e9',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#64748b',
];

function StatCard({ title, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function Reports() {
  const now = currentMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);

  const [monthly, setMonthly] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [m, cat, save] = await Promise.all([
          reportApi.monthly({ month, year }),
          reportApi.byCategory({ month, year }),
          reportApi.savingsProgress(),
        ]);
        if (!active) return;
        setMonthly(m);
        setByCategory(cat);
        setSavings(save);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [month, year]);

  const years = [];
  for (let y = now.year; y >= now.year - 5; y -= 1) years.push(y);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {MONTHS.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading report..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total income"
              value={`$${formatCurrency(monthly?.total_income)}`}
              accent="text-green-600"
            />
            <StatCard
              title="Total expenses"
              value={`$${formatCurrency(monthly?.total_expenses)}`}
              accent="text-red-600"
            />
            <StatCard
              title="Net savings"
              value={`$${formatCurrency(monthly?.net_savings)}`}
              accent={(monthly?.net_savings ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">Expenses by category</h2>
              {byCategory.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  No expenses for this month.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.category}
                    >
                      {byCategory.map((entry, index) => (
                        <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `$${formatCurrency(v)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">Savings trend (last 6 months)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={savings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `$${formatCurrency(v)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_income"
                    name="Income"
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_expenses"
                    name="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    name="Savings"
                    stroke="#4f46e5"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
