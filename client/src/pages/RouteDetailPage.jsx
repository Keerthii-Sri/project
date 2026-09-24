export default function RouteDetailPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900">Route detail</h1>
      <p className="mt-1 text-slate-600">Optimized route for vehicle route-12</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card h-[380px] bg-slate-100" />
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900">Stops</h2>
          <table className="mt-4 min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">Stop</th>
                <th className="px-3 py-2">Distance</th>
                <th className="px-3 py-2">Fuel</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200"><td className="px-3 py-2">Madhapur Hub</td><td className="px-3 py-2">12.4 km</td><td className="px-3 py-2">4.2 L</td></tr>
              <tr className="border-t border-slate-200"><td className="px-3 py-2">Gachibowli DC</td><td className="px-3 py-2">18.8 km</td><td className="px-3 py-2">5.1 L</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
