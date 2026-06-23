import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { reportApi, budgetApi } from '../api';
import { apiErrorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import { formatCurrency, currentMonthYear, monthName } from '../utils/format';

function Card({ title, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { month, year } = currentMonthYear();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthly, setMonthly] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [savings, setSavings] = useState([]);
  const [budgetCount, setBudgetCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [m, cat, save, budgets] = await Promise.all([
          reportApi.monthly({ month, year }),
          reportApi.byCategory({ month, year }),
          reportApi.savingsProgress(),
          budgetApi.list({ month, year }),
        ]);
        if (!active) return;
        setMonthly(m);
        setByCategory(cat);
        setSavings(save);
        setBudgetCount(budgets.length);
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

  if (loading) return <Spinner label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Overview for {monthName(month)} {year}
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Income this month" value={`$${formatCurrency(monthly?.total_income)}`} accent="text-green-600" />
        <Card title="Expenses this month" value={`$${formatCurrency(monthly?.total_expenses)}`} accent="text-red-600" />
        <Card
          title="Net savings"
          value={`$${formatCurrency(monthly?.net_savings)}`}
          accent={(monthly?.net_savings ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <Card title="Active budgets" value={budgetCount} accent="text-brand-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Expenses by category</h2>
          {byCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No expenses recorded this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${formatCurrency(v)}`} />
                <Bar dataKey="total" name="Spent" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Savings trend (last 6 months)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={savings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${formatCurrency(v)}`} />
              <Line type="monotone" dataKey="savings" name="Savings" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
