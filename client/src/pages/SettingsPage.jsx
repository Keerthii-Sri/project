export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900">Settings</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900">Cost and emissions</h2>
          <div className="mt-4 space-y-4">
            <div><label>Fuel price per litre</label><input className="input" defaultValue="95" /></div>
            <div><label>CO₂ factor (kg/litre)</label><input className="input" defaultValue="2.31" /></div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900">Team access</h2>
          <ul className="mt-4 space-y-3 text-slate-600">
            <li>Admin — full control</li>
            <li>Fleet manager — write access</li>
            <li>Viewer — read-only</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
