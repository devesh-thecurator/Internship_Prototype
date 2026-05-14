import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import {
  AlertTriangle,
  BatteryCharging,
  Bot,
  Car,
  Cpu,
  Factory,
  Network,
  RadarIcon,
  Route,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import {
  assemblyStages,
  automotiveCompliance,
  automotiveKpis,
  automotiveRecommendations,
  batteryHealth,
  documentProfiles,
  manufacturingHeatmap,
  procurementUploads,
  productionFlow,
  supplierAlerts,
  supplierNetwork,
} from '../data/automotive';
import BrandCarShowcase from '../components/BrandCarShowcase';
import { createDefaultTelemetry, getStoredValidationTelemetry, VALIDATION_EVENT } from '../lib/validationTelemetry';
import api from '../services/api';

const icons = [Car, AlertTriangle, Factory, BatteryCharging, ScanLine, Truck];
const toneMap = {
  cyan: 'from-cyan-400 to-blue-500 text-cyan-200',
  red: 'from-red-500 to-orange-500 text-red-200',
  green: 'from-emerald-400 to-lime-400 text-emerald-200',
  blue: 'from-blue-500 to-indigo-500 text-blue-200',
  violet: 'from-violet-500 to-fuchsia-500 text-violet-200',
  amber: 'from-amber-400 to-red-500 text-amber-200',
};

function AnimatedNumber({ value, suffix = '' }) {
  const spring = useSpring(0, { stiffness: 70, damping: 18 });
  const [displayValue, setDisplayValue] = useState(value % 1 !== 0 ? '0.0' : '0');

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(value % 1 !== 0 ? latest.toFixed(1) : Math.round(latest).toLocaleString());
    });
    spring.set(value);
    return unsubscribe;
  }, [spring, value]);

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}

function KpiCard({ item, index }) {
  const Icon = icons[index];
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-90, 90], [6, -6]);
  const rotateY = useTransform(mouseX, [-120, 120], [-6, 6]);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl"
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        mouseX.set(event.clientX - rect.left - rect.width / 2);
        mouseY.set(event.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
          <p className="mt-3 text-3xl font-black text-white">
            <AnimatedNumber value={item.value} suffix={item.suffix} />
          </p>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-[0_0_30px_rgba(56,189,248,0.3)] ${toneMap[item.tone].split(' ').slice(0, 2).join(' ')}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <span className={`text-xs font-black ${toneMap[item.tone].split(' ').slice(2).join(' ')}`}>{item.delta}</span>
        <div className="flex h-10 items-end gap-1">
          {item.spark.map((point, sparkIndex) => (
            <motion.span
              key={sparkIndex}
              className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-white"
              initial={{ height: 4 }}
              animate={{ height: Math.max(8, point / 2.4) }}
              transition={{ delay: 0.25 + sparkIndex * 0.04 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function CockpitPanel({ title, icon: Icon, children, className = '' }) {
  return (
    <motion.section
      className={`rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-2 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-200">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function ManufacturingHeatmap() {
  return (
    <div className="grid grid-cols-[70px_repeat(6,minmax(0,1fr))] gap-2 text-xs">
      <div />
      {['Line 1', 'Line 2', 'Line 3', 'Paint', 'Battery', 'EOL'].map((label) => (
        <div key={label} className="text-center font-bold text-slate-400">{label}</div>
      ))}
      {manufacturingHeatmap.map((row, rowIndex) => (
        <div className="contents" key={rowIndex}>
          <div className="flex items-center font-bold text-slate-400">Shift {rowIndex + 1}</div>
          {row.map((value, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className="flex aspect-square items-center justify-center rounded-xl font-black text-white"
              style={{ background: `rgba(${value > 76 ? '239,68,68' : value > 52 ? '249,115,22' : '14,165,233'}, ${0.22 + value / 125})`, boxShadow: `0 0 ${value / 2}px rgba(56,189,248,.18)` }}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (rowIndex + colIndex) * 0.025 }}
            >
              {value}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AssemblyFlow() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-300/10 bg-black/25 p-5">
      <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-700" />
      <motion.div className="absolute left-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-red-500" initial={{ width: 0 }} animate={{ width: 'calc(100% - 3rem)' }} transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }} />
      <div className="relative grid gap-3 md:grid-cols-6">
        {assemblyStages.map((stage, index) => (
          <div key={stage} className="flex flex-col items-center gap-3 text-center">
            <motion.div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-slate-950 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,.18)]" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.12 }}>
              {index + 1}
            </motion.div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-300">{stage}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [liveTelemetry, setLiveTelemetry] = useState(() => getStoredValidationTelemetry() || createDefaultTelemetry());
  const [profileKey, setProfileKey] = useState(() => (documentProfiles[liveTelemetry?.profileKey] ? liveTelemetry.profileKey : 'ev'));
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const profile = documentProfiles[profileKey];
  const complianceData = useMemo(() => automotiveCompliance.map((item) => ({ ...item, gap: item.current - item.required })), []);
  const liveKpis = useMemo(
    () => [
      { label: 'Compliance Score', value: liveTelemetry.complianceScore || 0, suffix: '%', delta: liveTelemetry.status === 'success' ? 'approved' : liveTelemetry.status === 'failed' ? 'blocked' : 'reviewing', tone: liveTelemetry.status === 'failed' ? 'red' : liveTelemetry.status === 'success' ? 'green' : 'cyan', spark: [42, 55, 67, 73, 81, 88, liveTelemetry.complianceScore || 0] },
      { label: 'Supplier Risk Score', value: liveTelemetry.supplierRisk || 0, suffix: '%', delta: liveTelemetry.supplierRisk > 55 ? 'critical' : liveTelemetry.supplierRisk > 25 ? 'watch' : 'stable', tone: liveTelemetry.supplierRisk > 55 ? 'red' : liveTelemetry.supplierRisk > 25 ? 'amber' : 'green', spark: [71, 62, 54, 48, 36, 28, liveTelemetry.supplierRisk || 0] },
      { label: 'Semantic Match', value: liveTelemetry.semanticMatch || 0, suffix: '%', delta: '+live OCR', tone: 'blue', spark: [36, 49, 58, 66, 74, 83, liveTelemetry.semanticMatch || 0] },
      { label: 'AI Confidence', value: liveTelemetry.aiConfidence || 0, suffix: '%', delta: 'validation core', tone: 'violet', spark: [41, 52, 61, 73, 82, 89, liveTelemetry.aiConfidence || 0] },
      { label: 'Logistics Performance', value: liveTelemetry.logisticsPerformance || 0, suffix: '%', delta: liveTelemetry.profileKey === 'logistics' ? 'document-aware' : '+3.8%', tone: 'amber', spark: [73, 76, 81, 80, 84, 87, liveTelemetry.logisticsPerformance || 0] },
      { label: 'EV Component Validation', value: liveTelemetry.batteryHealth || 0, suffix: '%', delta: liveTelemetry.profileKey === 'ev' ? 'EV profile active' : 'baseline', tone: 'cyan', spark: [68, 72, 79, 82, 87, 90, liveTelemetry.batteryHealth || 0] },
    ],
    [liveTelemetry]
  );
  const recentUploads = useMemo(() => {
    if (!dashboardSummary?.recent_reports?.length) return procurementUploads;

    const fields = liveTelemetry.automotiveFields || {};
    return dashboardSummary.recent_reports.map((report) => {
      const riskValue = liveTelemetry.supplierRisk || Math.max(0, 100 - report.score);
      return {
        name: report.document_name,
        type: liveTelemetry.profileLabel || 'Automotive Validation',
        oem: fields.oem_manufacturer || fields.manufacturer || 'Detected OEM',
        value: fields.contract_value || 'Validated',
        score: Math.round(report.score),
        risk: riskValue > 62 ? 'High' : riskValue > 32 ? 'Medium' : 'Low',
      };
    });
  }, [dashboardSummary, liveTelemetry]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await api.get('/dashboard/summary/');
        setDashboardSummary(response.data);
      } catch (error) {
        setDashboardSummary(null);
      }
    };

    const syncTelemetry = (event) => {
      const nextTelemetry = event.detail || getStoredValidationTelemetry();
      if (!nextTelemetry) return;
      setLiveTelemetry(nextTelemetry);
      if (documentProfiles[nextTelemetry.profileKey]) {
        setProfileKey(nextTelemetry.profileKey);
      }
      loadSummary();
    };

    loadSummary();
    window.addEventListener(VALIDATION_EVENT, syncTelemetry);
    window.addEventListener('storage', syncTelemetry);
    return () => {
      window.removeEventListener(VALIDATION_EVENT, syncTelemetry);
      window.removeEventListener('storage', syncTelemetry);
    };
  }, []);

  return (
    <motion.div className="min-h-screen space-y-6 rounded-3xl bg-[radial-gradient(circle_at_top,#1e3a8a_0,#020617_38%,#050505_100%)] p-1 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 62% 30%, ${profile.glow}, transparent 34%)` }} />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
                <Car className="h-4 w-4" />
                Automobile Term Sheet Validation Using AI
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Automotive procurement cockpit for OEM, EV, supplier, logistics, and manufacturing validation.
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-300">{profile.focus}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries(profile.fields).slice(0, 8).map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="mt-2 text-sm font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/20 bg-black/30 p-4 shadow-[0_0_80px_rgba(34,211,238,0.16)]">
            <BrandCarShowcase />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/75 p-2 backdrop-blur-xl">
        {Object.entries(documentProfiles).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setProfileKey(key)}
            className={`min-w-max rounded-xl px-4 py-2 text-sm font-black transition ${profileKey === key ? 'bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.32)]' : 'text-slate-300 hover:bg-white/10'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {liveKpis.map((item, index) => (
          <KpiCard key={item.label} item={item} index={index} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <CockpitPanel title="EV Battery Health" icon={BatteryCharging}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={batteryHealth}>
              <defs>
                <linearGradient id="batteryGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.36} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="module" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(34,211,238,.25)', borderRadius: 14, color: '#fff' }} />
              <Legend />
              <Area dataKey="soc" stroke="#22d3ee" fill="url(#batteryGlow)" strokeWidth={3} />
              <Area dataKey="validation" stroke="#22c55e" fill="#22c55e" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CockpitPanel>

        <CockpitPanel title="Production Flow Analytics" icon={Factory}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productionFlow}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="station" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(249,115,22,.25)', borderRadius: 14, color: '#fff' }} />
              <Bar dataKey="capacity" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="takt" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CockpitPanel>

        <CockpitPanel title="Supplier Network Map" icon={Network}>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="x" stroke="#94a3b8" name="lane stability" />
              <YAxis dataKey="y" stroke="#94a3b8" name="quality" />
              <ZAxis dataKey="z" range={[120, 520]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#020617', border: '1px solid rgba(34,211,238,.25)', borderRadius: 14, color: '#fff' }} />
              <Scatter data={supplierNetwork}>
                {supplierNetwork.map((entry) => (
                  <Cell key={entry.supplier} fill={entry.risk === 'high' ? '#ef4444' : entry.risk === 'medium' ? '#f97316' : '#22c55e'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CockpitPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <CockpitPanel title="Automotive Compliance Radar" icon={RadarIcon} className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={complianceData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Current" dataKey="current" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Required" dataKey="required" stroke="#f97316" fill="#f97316" fillOpacity={0.12} strokeWidth={2} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CockpitPanel>

        <CockpitPanel title="Manufacturing Risk Heatmap" icon={AlertTriangle} className="xl:col-span-2">
          <ManufacturingHeatmap />
        </CockpitPanel>
      </div>

      <CockpitPanel title="Automotive Assembly Flow" icon={Route}>
        <AssemblyFlow />
      </CockpitPanel>

      <div className="grid gap-6 xl:grid-cols-3">
        <CockpitPanel title="Recent Procurement Sheets" icon={Cpu} className="xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">OEM</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentUploads.map((upload) => (
                  <tr key={upload.name} className="transition hover:bg-cyan-300/5">
                    <td className="px-4 py-4 font-black text-white">{upload.name}</td>
                    <td className="px-4 py-4 text-slate-300">{upload.type}</td>
                    <td className="px-4 py-4 text-slate-300">{upload.oem}</td>
                    <td className="px-4 py-4 font-black text-cyan-200">{upload.value}</td>
                    <td className="px-4 py-4 font-black text-white">{upload.score}%</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${upload.risk === 'High' ? 'bg-red-500/15 text-red-200' : upload.risk === 'Medium' ? 'bg-orange-500/15 text-orange-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{upload.risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CockpitPanel>

        <CockpitPanel title="AI Recommendations" icon={Bot}>
          <div className="space-y-3">
            {automotiveRecommendations.map((item, index) => (
              <motion.div key={item.title} className="rounded-2xl border border-cyan-300/10 bg-white/[0.06] p-4" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-black text-white">{item.title}</h4>
                  <Sparkles className="h-4 w-4 text-cyan-200" />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
                <span className="mt-3 inline-flex rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-200">{item.impact}</span>
              </motion.div>
            ))}
          </div>
        </CockpitPanel>
      </div>

      <div className="grid gap-6">
        <CockpitPanel title="Supplier Alerts" icon={AlertTriangle}>
          <div className="space-y-4">
            {supplierAlerts.map((event, index) => (
              <motion.div key={event.title} className="flex gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                <div className="flex flex-col items-center">
                  <span className={`h-3 w-3 rounded-full ${event.type === 'critical' ? 'bg-red-500' : event.type === 'warning' ? 'bg-orange-500' : 'bg-emerald-400'}`} />
                  {index !== supplierAlerts.length - 1 && <span className="mt-2 h-10 w-px bg-white/10" />}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-500">{event.time}</p>
                  <p className="font-black text-white">{event.title}</p>
                  <p className="text-sm text-slate-300">{event.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CockpitPanel>
      </div>
    </motion.div>
  );
}
