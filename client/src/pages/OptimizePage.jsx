import { useState } from 'react';

export default function OptimizePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDemoRun = () => {
    setLoading(true);
    setTimeout(() => {
      setResult({
        total_fuel_before_litres: 284.4,
        total_fuel_after_litres: 232.3,
        fuel_saved_litres: 52.1,
        fuel_saved_percentage: 18.3,
        co2_saved_kg: 120.3,
        cost_saved_inr: 4940,
        insights: {
          summary: 'This optimization balanced routes by vehicle capacity and route distance to reduce overall trip fuel and emissions.',
          insights: ['Capacity-based assignment prevents overload.', 'Shorter route grouping improves efficiency.', 'High-priority deliveries remained on schedule.'],
          recommendations: ['Add live traffic feeds for stronger route timing.', 'Revisit the longest route cluster next week.'],
        },
      });
      setLoading(false);
    }, 1400);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900">Optimization</h1>
        <p className="mt-1 text-slate-600">Quantum-inspired fleet planning with fuel and emissions optimization</p>
      </div>

      <div className="card mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label>Fuel price</label>
            <input className="input" defaultValue="95" />
          </div>
          <div>
            <label>CO₂ factor</label>
            <input className="input" defaultValue="2.31" />
          </div>
          <div>
            <label>Objective</label>
            <select className="input" defaultValue="fuel">
              <option value="fuel">Minimize fuel</option>
              <option value="cost">Minimize cost</option>
              <option value="co2">Minimize CO₂</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button className="btn" onClick={handleDemoRun} disabled={loading}>{loading ? 'Running optimization...' : 'Load demo data & run optimization'}</button>
          <button className="btn-secondary">Export CSV</button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="card"><div className="text-sm text-slate-500">Fuel before</div><div className="mt-2 text-2xl font-black">{result.total_fuel_before_litres} L</div></div>
            <div className="card"><div className="text-sm text-slate-500">Fuel after</div><div className="mt-2 text-2xl font-black">{result.total_fuel_after_litres} L</div></div>
            <div className="card"><div className="text-sm text-slate-500">Fuel saved</div><div className="mt-2 text-2xl font-black">{result.fuel_saved_litres} L</div></div>
            <div className="card"><div className="text-sm text-slate-500">Cost saved</div><div className="mt-2 text-2xl font-black">₹{result.cost_saved_inr}</div></div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-slate-900">Optimization summary</h2>
            <p className="mt-3 text-slate-600">{result.insights.summary}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-slate-800">Key insights</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-600">
                  {result.insights.insights.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Recommendations</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-600">
                  {result.insights.recommendations.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
