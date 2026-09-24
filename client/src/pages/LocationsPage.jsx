export default function LocationsPage() {
  const locations = [
    { name: 'Warehouse A', address: 'Banjara Hills', demand: '2400 kg', lat: 17.414, lng: 78.449 },
    { name: 'Retail Hub', address: 'Madhapur', demand: '1800 kg', lat: 17.440, lng: 78.390 },
    { name: 'Gachibowli DC', address: 'Gachibowli', demand: '3200 kg', lat: 17.440, lng: 78.346 },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Locations</h1>
          <p className="mt-1 text-slate-600">Delivery points, depots, and service windows</p>
        </div>
        <button className="btn">Add location</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900">Location list</h2>
          <div className="mt-4 space-y-3">
            {locations.map((loc) => (
              <div key={loc.name} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{loc.name}</div>
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">Priority</span>
                </div>
                <div className="mt-2 text-sm text-slate-600">{loc.address}</div>
                <div className="mt-2 text-sm text-slate-500">Demand: {loc.demand}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900">Map view</h2>
          <div className="mt-4 h-[320px] rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
