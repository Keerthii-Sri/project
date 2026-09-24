import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { name: 'Mon', fuel: 120, co2: 240, cost: 11400 },
  { name: 'Tue', fuel: 100, co2: 210, cost: 9800 },
  { name: 'Wed', fuel: 75, co2: 180, cost: 7200 },
  { name: 'Thu', fuel: 88, co2: 195, cost: 8300 },
  { name: 'Fri', fuel: 63, co2: 150, cost: 6100 },
];

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900">Analytics</h1>
      <p className="mt-1 text-slate-600">Historical trends in fuel, emissions, and savings</p>
      <div className="mt-6 card h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="fuel" stroke="#10b981" strokeWidth={3} />
            <Line type="monotone" dataKey="co2" stroke="#0ea5e9" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
