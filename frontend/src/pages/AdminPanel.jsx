import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminPanelPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/audit/').then((response) => setLogs(response.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Admin panel</h3>
        <p className="mt-2 text-slate-500">Audit logs and system actions for the current user.</p>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">Audit log</h4>
        <div className="mt-4 space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="rounded-3xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{log.action}</p>
              <p className="text-sm text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-600">Target: {log.target || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
