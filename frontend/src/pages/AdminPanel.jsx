import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminPanelPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/audit/').then((response) => setLogs(response.data));
  }, []);

  return (
    <div className="space-y-6 rounded-3xl bg-[radial-gradient(circle_at_top,#172554_0,#020617_44%,#050505_100%)] p-1 text-white">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,.36)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Validation operations</p>
        <h3 className="mt-2 text-2xl font-black text-white">Admin panel</h3>
        <p className="mt-2 text-slate-400">Audit logs and system actions for the current user.</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,.36)]">
        <h4 className="text-lg font-black text-white">Audit log</h4>
        <div className="mt-4 space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-cyan-300/15 bg-white/[0.05] p-4">
              <p className="font-black text-white">{log.action}</p>
              <p className="text-sm text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-300">Target: {log.target || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
