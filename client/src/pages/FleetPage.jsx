export default function FleetPage() {
  const vehicles = [
    { name: 'MH-12 AB 1234', type: 'truck', capacity: '4500 kg', fuel: '6.8 km/l' },
    { name: 'KA-01 XY 8890', type: 'mini_truck', capacity: '2200 kg', fuel: '8.2 km/l' },
    { name: 'TS-09 ZQ 4571', type: 'van', capacity: '1100 kg', fuel: '9.1 km/l' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Fleet</h1>
          <p className="mt-1 text-slate-600">Vehicle roster and capacity health</p>
        </div>
        <button className="btn">Add vehicle</button>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Efficiency</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.name} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{vehicle.name}</td>
                <td className="px-4 py-3">{vehicle.type}</td>
                <td className="px-4 py-3">{vehicle.capacity}</td>
                <td className="px-4 py-3">{vehicle.fuel}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
