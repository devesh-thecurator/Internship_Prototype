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
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Export reports</h3>
            <p className="mt-2 text-slate-500">Download validation data and audit export history.</p>
          </div>
          <button
            onClick={exportReports}
            className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">Export activity</h4>
        <div className="mt-4 space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="rounded-3xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{activity.export_type.toUpperCase()} export</p>
              <p className="text-sm text-slate-500">{new Date(activity.created_at).toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-600">Records exported: {activity.metadata.record_count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
