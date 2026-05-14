import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BatteryCharging,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Factory,
  FileSearch,
  Minus,
  Plus,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { automotiveCompliance, batteryHealth, extractedFields, productionFlow, validationClauses } from '../data/automotive';
import { createDefaultTelemetry, getStoredValidationTelemetry, VALIDATION_EVENT } from '../lib/validationTelemetry';

const statusStyle = {
  match: 'border-emerald-400 bg-emerald-400/15 text-emerald-100',
  warning: 'border-orange-400 bg-orange-400/18 text-orange-100',
  mismatch: 'border-red-400 bg-red-400/18 text-red-100',
};

const events = [
  { time: '00:00', label: 'OEM contract uploaded', status: 'complete' },
  { time: '00:09', label: 'Automotive field extraction', status: 'complete' },
  { time: '00:23', label: 'PPAP and ISO 26262 comparison', status: 'complete' },
  { time: '00:38', label: 'Supplier anomaly escalation', status: 'active' },
  { time: '00:44', label: 'Audit evidence package', status: 'queued' },
];

const corrections = [
  'Add UNECE R155 incident notification SLA for ECU cybersecurity events.',
  'Attach signed PPAP Level 3 dimensional and material report package.',
  'Reduce BMS thermal derating threshold from 52C to approved MEB+ policy threshold.',
  'Clarify JIT logistics penalty carve-outs for plant shutdown and port congestion.',
];

function Panel({ title, icon: Icon, children, className = '' }) {
  return (
    <motion.section className={`rounded-2xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl ${className}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-2 text-cyan-200">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-200">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function Meter({ label, value, tone = 'cyan' }) {
  const gradient = tone === 'red' ? 'from-red-500 to-orange-400' : tone === 'green' ? 'from-emerald-400 to-lime-400' : 'from-cyan-400 to-blue-500';
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className="text-xl font-black text-white">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

export default function ValidatePage() {
  const [selectedClause, setSelectedClause] = useState(validationClauses[1]);
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [telemetry, setTelemetry] = useState(() => getStoredValidationTelemetry() || createDefaultTelemetry());

  useEffect(() => {
    const syncTelemetry = (event) => {
      const nextTelemetry = event.detail || getStoredValidationTelemetry();
      if (nextTelemetry) setTelemetry(nextTelemetry);
    };

    window.addEventListener(VALIDATION_EVENT, syncTelemetry);
    window.addEventListener('storage', syncTelemetry);
    return () => {
      window.removeEventListener(VALIDATION_EVENT, syncTelemetry);
      window.removeEventListener('storage', syncTelemetry);
    };
  }, []);

  const fieldsForDisplay = Object.keys(telemetry.automotiveFields || {}).length
    ? Object.entries(telemetry.automotiveFields).map(([label, value]) => ({
        label: label.replaceAll('_', ' '),
        value,
        status: String(label).includes('cyber') && telemetry.mismatches?.length ? 'warning' : 'match',
      }))
    : extractedFields;

  return (
    <motion.div className="space-y-6 rounded-3xl bg-[radial-gradient(circle_at_top,#172554_0,#020617_44%,#050505_100%)] p-1 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
              <ScanLine className="h-4 w-4" />
              Automotive AI Validation Workspace
            </p>
            <h1 className="mt-3 text-3xl font-black md:text-5xl">{telemetry.documentName || 'Automotive Term Sheet Review'}</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300">
              Auto-started validation workspace for OCR extraction, OEM/supplier validation, EV battery specification review, ISO 26262, PPAP, BS VI, ESG, cybersecurity, supplier risk, and anomaly analysis.
            </p>
          </div>
          <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.16)]">
            <Bot className="h-4 w-4" />
            Auto validation active
          </span>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-cyan-300 p-2 text-slate-950">
                <FileSearch className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-black text-white">Automotive Contract Viewer</h2>
                <p className="text-sm text-slate-400">Dynamic OCR highlights for OEM, EV, logistics, PPAP, and cybersecurity clauses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} className="rounded-xl border border-white/10 p-2 hover:bg-white/10" aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-16 text-center text-sm font-black text-slate-300">Page {page}</span>
              <button onClick={() => setPage(Math.min(12, page + 1))} className="rounded-xl border border-white/10 p-2 hover:bg-white/10" aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => setZoom(Math.max(75, zoom - 10))} className="rounded-xl border border-white/10 p-2 hover:bg-white/10" aria-label="Zoom out">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-14 text-center text-sm font-black text-slate-300">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(145, zoom + 10))} className="rounded-xl border border-white/10 p-2 hover:bg-white/10" aria-label="Zoom in">
                <Plus className="h-4 w-4" />
              </button>
              <button onClick={() => setZoom(100)} className="rounded-xl border border-white/10 p-2 hover:bg-white/10" aria-label="Reset zoom">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-auto bg-black/35 p-6">
            <motion.div className="relative mx-auto min-h-[760px] w-full max-w-[720px] origin-top rounded-2xl border border-cyan-300/20 bg-slate-100 p-10 text-slate-950 shadow-[0_0_70px_rgba(34,211,238,.12)]" style={{ scale: zoom / 100 }}>
              <div className="mb-8 border-b border-slate-300 pb-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Confidential automotive procurement agreement</p>
                <h3 className="mt-3 text-2xl font-black">Volkswagen Group - MEB+ Battery Module Supply</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Supplier obligations for EV battery modules, BMS diagnostics, pack-level PPAP, logistics sequencing, warranty, and cybersecurity incident response.</p>
              </div>

              {Array.from({ length: 13 }).map((_, index) => (
                <div key={index} className="mb-4">
                  <div className="h-3 rounded-full bg-slate-300" style={{ width: `${92 - (index % 5) * 8}%` }} />
                  <div className="mt-2 h-3 rounded-full bg-slate-200" style={{ width: `${76 - (index % 4) * 7}%` }} />
                </div>
              ))}

              {validationClauses.map((clause) => (
                <motion.button
                  key={clause.id}
                  onClick={() => setSelectedClause(clause)}
                  className={`absolute rounded-xl border-2 px-3 py-2 text-left text-xs font-black shadow-lg backdrop-blur-sm ${statusStyle[clause.status]} ${selectedClause.id === clause.id ? 'ring-4 ring-cyan-300/50' : ''}`}
                  style={{ left: `${clause.x}%`, top: `${clause.y}%`, width: `${clause.w}%` }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {clause.title} - {clause.confidence}%
                </motion.button>
              ))}
            </motion.div>
          </div>
        </section>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Meter label="Automotive match" value={telemetry.semanticMatch || 0} tone={(telemetry.semanticMatch || 0) >= 86 ? 'green' : 'cyan'} />
            <Meter label="Safety compliance" value={telemetry.complianceScore || 0} tone={(telemetry.complianceScore || 0) >= 90 ? 'green' : 'cyan'} />
            <Meter label="Supplier anomaly" value={telemetry.supplierRisk || 0} tone="red" />
            <Meter label="EV spec confidence" value={telemetry.batteryHealth || 0} />
          </div>

          <Panel title="Selected Clause Intelligence" icon={Cpu}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-black text-white">{selectedClause.title}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{selectedClause.value}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${selectedClause.status === 'match' ? 'bg-emerald-400/15 text-emerald-200' : selectedClause.status === 'warning' ? 'bg-orange-400/15 text-orange-200' : 'bg-red-400/15 text-red-200'}`}>{selectedClause.status}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-cyan-300/10 p-4">
                <p className="text-xs font-black text-cyan-200">Semantic Match</p>
                <p className="mt-2 text-2xl font-black text-white">{selectedClause.confidence}%</p>
              </div>
              <div className="rounded-2xl bg-orange-400/10 p-4">
                <p className="text-xs font-black text-orange-200">Manual Review</p>
                <p className="mt-2 text-2xl font-black text-white">Med</p>
              </div>
              <div className="rounded-2xl bg-emerald-400/10 p-4">
                <p className="text-xs font-black text-emerald-200">Evidence</p>
                <p className="mt-2 text-2xl font-black text-white">7 docs</p>
              </div>
            </div>
          </Panel>

          <Panel title="Extracted Automobile Fields" icon={ShieldCheck}>
            <div className="grid gap-2 md:grid-cols-2">
              {fieldsForDisplay.map((field) => (
                <div key={field.label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{field.label}</p>
                    {field.status === 'match' ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : field.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-orange-300" /> : <XCircle className="h-4 w-4 text-red-300" />}
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-200">{field.value}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="EV Battery Validation" icon={BatteryCharging}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={batteryHealth}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="module" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(34,211,238,.25)', borderRadius: 14, color: '#fff' }} />
                  <Bar dataKey="validation" radius={[8, 8, 0, 0]}>
                    {batteryHealth.map((entry) => (
                      <Cell key={entry.module} fill={entry.validation > 92 ? '#22c55e' : entry.validation > 88 ? '#38bdf8' : '#f97316'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Automotive Compliance" icon={ShieldCheck}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={automotiveCompliance}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                  <Radar dataKey="current" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.24} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <Panel title="AI Suggested Automotive Corrections" icon={Bot}>
            <div className="space-y-3">
              {corrections.map((item, index) => (
                <motion.div key={item} className="rounded-2xl border border-cyan-300/10 bg-cyan-300/10 p-4 text-sm font-medium leading-6 text-slate-300" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}>
                  {item}
                </motion.div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Production Term Validation" icon={Factory}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={productionFlow}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="station" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(249,115,22,.25)', borderRadius: 14, color: '#fff' }} />
              <Bar dataKey="capacity" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="JIT Logistics Risk" icon={Truck}>
          <div className="space-y-4">
            {['ASN timing', 'Line-side buffer', 'Cross-dock ETA', 'Port congestion'].map((item, index) => (
              <div key={item}>
                <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  <span>{item}</span>
                  <span>{88 - index * 7}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${88 - index * 7}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI Audit Trail" icon={ScanLine}>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className={`h-3 w-3 rounded-full ${event.status === 'complete' ? 'bg-emerald-400' : event.status === 'active' ? 'bg-orange-400' : 'bg-slate-500'}`} />
                  {index !== events.length - 1 && <span className="mt-2 h-9 w-px bg-white/10" />}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-500">{event.time}</p>
                  <p className="text-sm font-black text-white">{event.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </motion.div>
  );
}
