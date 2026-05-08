import { useEffect, useState } from 'react';
import api from '../services/api';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary/').then((response) => setSummary(response.data));
  }, []);

  const chartData = summary?.recent_reports?.map((report, index) => ({
    name: `Report ${index + 1}`,
    score: report.score,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Documents</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{summary?.total_documents ?? 0}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Validation reports</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{summary?.total_reports ?? 0}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Avg compliance</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{summary?.average_compliance_score ?? 0}%</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="col-span-2 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Recent validation scores</p>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#1d4ed8" fill="url(#scoreGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">High risk signal</p>
          <div className="mt-6 rounded-3xl bg-slate-50 p-5">
            <p className="text-3xl font-semibold text-slate-900">{summary?.highest_risk_score ?? 0}</p>
            <p className="mt-2 text-slate-600">Current highest risk score from recent validated documents.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
