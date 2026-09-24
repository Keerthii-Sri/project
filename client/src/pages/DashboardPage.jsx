import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';

const stats = [
  { label: 'Fuel saved', value: '1,284 L' },
  { label: 'CO₂ reduced', value: '2,966 kg' },
  { label: 'Cost saved', value: '₹1.21L' },
  { label: 'Optimizations run', value: '18' },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState({ fuel_saved_litres: 1284, co2_saved_kg: 2966, cost_saved_inr: 121000, optimizations: 18 });

  useEffect(() => {
    api('/analytics/summary')
      .then((data) => setSummary(data))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900">Fleet dashboard</h1>
        <p className="mt-1 text-slate-600">Turn route intelligence into measurable cost and emission savings.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="card">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-3 text-3xl font-black text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900">Smart route overview</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
              <span>Fuel savings this quarter</span>
              <strong>{summary.fuel_saved_litres || 1284} L</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-sky-50 p-3">
              <span>CO₂ reduction</span>
              <strong>{summary.co2_saved_kg || 2966} kg</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
              <span>Cost saved</span>
              <strong>₹{(summary.cost_saved_inr || 121000).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-slate-900">AI recommendations</h2>
          <ul className="mt-4 space-y-3 text-slate-600">
            <li>• Shift 2 high-priority routes to off-peak windows to reduce idle fuel.</li>
            <li>• Rebalance volume across 3 low-utilization minitrucks.</li>
            <li>• Add live traffic feed for stronger route prediction in the next 48 hours.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
