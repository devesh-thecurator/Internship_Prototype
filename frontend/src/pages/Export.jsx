import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ExportPage() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api.get('/reports/activity/').then((response) => setActivities(response.data));
  }, []);

  const exportReports = async () => {
    const response = await api.get('/reports/export/?type=json');
    const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'validation_reports.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 rounded-3xl bg-[radial-gradient(circle_at_top,#172554_0,#020617_44%,#050505_100%)] p-1 text-white">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,.36)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Audit telemetry export</p>
            <h3 className="mt-2 text-2xl font-black text-white">Export validation reports</h3>
            <p className="mt-2 text-slate-400">Download validation data and audit export history.</p>
          </div>
          <button
            onClick={exportReports}
            className="rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-white"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,.36)]">
        <h4 className="text-lg font-black text-white">Export activity</h4>
        <div className="mt-4 space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="rounded-2xl border border-cyan-300/15 bg-white/[0.05] p-4">
              <p className="font-black text-white">{activity.export_type.toUpperCase()} export</p>
              <p className="text-sm text-slate-500">{new Date(activity.created_at).toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-300">Records exported: {activity.metadata.record_count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
