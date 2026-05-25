import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function AnalyticsPanel({ analytics }) {
  if (!analytics) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Loading analytics</h2>
        <p className="mt-3 text-sm text-slate-500">Gathering category totals and monthly trends.</p>
      </div>
    );
  }

  const categoryData = {
    labels: Object.keys(analytics.categoryTotals),
    datasets: [
      {
        label: 'Spending by category',
        data: Object.values(analytics.categoryTotals),
        backgroundColor: ['#4f46e5', '#22c55e', '#ec4899', '#f59e0b', '#14b8a6', '#0ea5e9'],
        borderRadius: 12,
        maxBarThickness: 32
      }
    ]
  };

  const monthlyData = {
    labels: analytics.monthlyTotals.map((item) => item.label),
    datasets: [
      {
        label: 'Monthly spend',
        data: analytics.monthlyTotals.map((item) => item.total),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.24)',
        tension: 0.35,
        fill: true,
        pointRadius: 4
      }
    ]
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Analytics</p>
          <h2 className="text-2xl font-semibold">Spend insights</h2>
        </div>
        <div className="rounded-3xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-100">
          Total spent ${analytics.overallTotal.toFixed(2)}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
          <Bar options={{ responsive: true, plugins: { legend: { display: false } } }} data={categoryData} />
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
          <Line options={{ responsive: true, plugins: { legend: { display: false } } }} data={monthlyData} />
        </div>
      </div>
    </div>
  );
}
