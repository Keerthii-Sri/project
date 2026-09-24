import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const metrics = [
  { title: 'Predictive fuel savings', value: '10-15%', desc: 'Per trip AI forecasts and route balancing' },
  { title: 'CO₂ reduction', value: 'up to 28%', desc: 'Diesel-to-route optimization with clean dispatching' },
  { title: 'Faster planning', value: 'AI + OR-Tools', desc: 'Smart route assignment and time window awareness' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-2xl font-black text-emerald-900">GreenFleet AI</div>
        <div className="flex gap-4">
          <Link to="/login" className="btn-secondary">Login</Link>
          <Link to="/signup" className="btn">Get started</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2 md:items-center">
        <div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            AI + optimization for logistics fleets
          </span>
          <h1 className="mt-6 text-5xl font-black leading-tight text-slate-900">Predict fuel, assign smarter routes, cut CO₂.</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            GreenFleet AI helps Indian logistics SMEs predict trip fuel usage, optimize vehicle assignments, and reduce costs with data-driven routing.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/signup" className="btn">Start free demo</Link>
            <Link to="/login" className="btn-secondary">View dashboard</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Demo route preview</div>
              <div className="text-xl font-bold">Hyderabad East Corridor</div>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">-12.4%</div>
          </div>
          <div className="h-64 rounded-xl bg-gradient-to-br from-emerald-200 via-sky-100 to-slate-100 p-4 text-sm text-slate-700">
            <div className="flex h-full items-end justify-between gap-2">
              {[70, 86, 72, 58, 90, 66, 48].map((height, index) => (
                <div key={index} className="w-full rounded-t-xl bg-emerald-600/85" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.title} className="card">
            <div className="text-sm text-slate-500">{metric.title}</div>
            <div className="mt-4 text-3xl font-black text-slate-900">{metric.value}</div>
            <p className="mt-3 text-sm text-slate-600">{metric.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
