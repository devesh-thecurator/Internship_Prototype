import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BatteryCharging,
  Bot,
  Car,
  CheckCircle2,
  Clock,
  Cpu,
  Factory,
  MessageSquare,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../services/api';
import { createDefaultTelemetry, getStoredValidationTelemetry, VALIDATION_EVENT } from '../lib/validationTelemetry';

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    text: 'I scanned the active EV battery supply agreement. The OEM, supplier, vehicle program, MEB+ platform, and contract value are aligned, but BMS thermal limits and cybersecurity notification clauses need review.',
    cards: ['MEB+ 800V', '91% EV spec match', 'R155 clause missing'],
  },
  {
    id: 2,
    role: 'user',
    text: 'Explain the highest supplier risk.',
  },
  {
    id: 3,
    role: 'assistant',
    text: 'The highest supplier risk is cybersecurity coverage for the ECU/BMS interface. The term sheet references OTA diagnostics, but it does not define incident notification timing, patch ownership, or UNECE R155 escalation duties.',
    cards: ['CyberDrive pattern match', 'High legal impact', 'Add incident SLA'],
  },
];

const prompts = [
  'Explain Bharat Stage VI impact',
  'Validate ISO 26262 clauses',
  'Find missing PPAP evidence',
  'Analyze EV battery manufacturing risk',
  'Summarize JIT logistics exposure',
  'Draft supplier cybersecurity language',
];

const trace = [
  { step: 'Extract', score: 84 },
  { step: 'Classify', score: 92 },
  { step: 'Compare', score: 88 },
  { step: 'Predict', score: 81 },
  { step: 'Recommend', score: 94 },
];

const confidence = [{ name: 'Automotive AI Confidence', value: 93, fill: '#22d3ee' }];

function Typing() {
  return (
    <motion.div className="flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <span className="relative rounded-xl bg-cyan-300 p-2 text-slate-950">
        <Bot className="h-5 w-5" />
        <motion.span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" animate={{ scale: [1, 1.35, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
      </span>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <motion.span key={dot} className="h-2 w-2 rounded-full bg-cyan-300" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.75, delay: dot * 0.12 }} />
        ))}
      </div>
      <span className="text-sm font-bold text-cyan-100">Automotive AI is scanning clauses and supplier evidence</span>
    </motion.div>
  );
}

function Message({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      {!isUser && (
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 p-2 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,.28)]">
          <Bot className="h-6 w-6" />
        </div>
      )}
      <div className={`max-w-3xl rounded-2xl p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] ${isUser ? 'bg-cyan-300 text-slate-950' : 'border border-white/10 bg-white/[0.07] text-slate-100 backdrop-blur-xl'}`}>
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] opacity-70">
          {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isUser ? 'Engineer' : 'Automotive AI Assistant'}
        </div>
        <p className="text-sm leading-6">{message.text}</p>
        {message.cards && (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {message.cards.map((card) => (
              <span key={card} className="rounded-xl bg-slate-950/60 px-3 py-2 text-xs font-black text-cyan-100">
                {card}
              </span>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-slate-900 p-2 text-cyan-200">
          <User className="h-6 w-6" />
        </div>
      )}
    </motion.div>
  );
}

function Insight({ icon: Icon, label, value, tone = 'cyan' }) {
  const toneClass = tone === 'red' ? 'text-red-200 bg-red-500/10 border-red-400/20' : tone === 'green' ? 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20' : 'text-cyan-200 bg-cyan-300/10 border-cyan-300/20';
  return (
    <motion.div className={`rounded-2xl border p-4 ${toneClass}`} whileHover={{ y: -4 }}>
      <Icon className="mb-4 h-5 w-5" />
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </motion.div>
  );
}

export default function ChatbotPage() {
  const [telemetry, setTelemetry] = useState(() => getStoredValidationTelemetry() || createDefaultTelemetry());
  const [messages, setMessages] = useState(initialMessages);
  const [query, setQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const [promptSearch, setPromptSearch] = useState('');
  const endRef = useRef(null);
  const streamTimerRef = useRef(null);
  const confidenceData = [{ name: 'Automotive AI Confidence', value: telemetry.aiConfidence || 0, fill: '#22d3ee' }];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

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

  useEffect(() => () => window.clearInterval(streamTimerRef.current), []);

  const revealAssistantMessage = (messageId, fullText, cards) => {
    window.clearInterval(streamTimerRef.current);
    let cursor = 0;
    streamTimerRef.current = window.setInterval(() => {
      cursor += 18;
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                text: fullText.slice(0, cursor),
                cards: cursor >= fullText.length ? cards : undefined,
              }
            : message
        )
      );
      if (cursor >= fullText.length) {
        window.clearInterval(streamTimerRef.current);
      }
    }, 24);
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: trimmed }]);
    setQuery('');
    setTyping(true);

    const assistantId = Date.now() + 1;
    setMessages((current) => [...current, { id: assistantId, role: 'assistant', text: '' }]);

    try {
      const response = await api.post('/chatbot/query/', { query: trimmed });
      const answer =
        response.data.answer ||
        `For "${trimmed}", I checked ${telemetry.documentName}. Current compliance is ${telemetry.complianceScore}%, semantic match is ${telemetry.semanticMatch}%, and supplier risk is ${telemetry.supplierRisk}%.`;
      setTyping(false);
      revealAssistantMessage(assistantId, answer, [`${telemetry.profileLabel}`, `${telemetry.aiConfidence}% AI confidence`, `${telemetry.status} state`]);
    } catch (error) {
      const fallbackAnswer = `I could not reach the document retrieval service, so I used the live cockpit telemetry. ${telemetry.documentName} is at ${telemetry.complianceScore}% compliance, ${telemetry.semanticMatch}% semantic match, and ${telemetry.supplierRisk}% supplier risk. ${telemetry.recommendations?.[0] || 'Upload or validate a document to refresh the AI context.'}`;
      setTyping(false);
      revealAssistantMessage(assistantId, fallbackAnswer, ['Telemetry fallback', `${telemetry.status} state`, 'Retry backend query']);
    }
  };

  const visiblePrompts = prompts.filter((prompt) => prompt.toLowerCase().includes(promptSearch.toLowerCase()));

  return (
    <motion.div className="grid min-h-[calc(100vh-8rem)] gap-6 rounded-3xl bg-[radial-gradient(circle_at_top,#172554_0,#020617_45%,#050505_100%)] p-1 text-white xl:grid-cols-[310px_minmax(0,1fr)_340px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <aside className="rounded-2xl border border-white/10 bg-slate-950/75 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-2xl bg-cyan-300 p-3 text-slate-950">
            <Car className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-black text-white">Auto AI</h1>
            <p className="text-xs font-semibold text-slate-400">Procurement copilot</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={promptSearch}
            onChange={(event) => setPromptSearch(event.target.value)}
            placeholder="Search automotive prompts"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pl-10 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
          />
        </div>

        <div className="space-y-2">
          {visiblePrompts.map((prompt) => (
            <button key={prompt} onClick={() => sendMessage(prompt)} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left text-sm font-bold text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100">
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {['MEB battery review', 'ECU supplier risk', 'JIT logistics lane'].map((item, index) => (
            <div key={item} className="rounded-2xl bg-white/[0.05] p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-black text-slate-200">{item}</p>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">{index + 1} hour{index === 0 ? '' : 's'} ago</p>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex min-h-[720px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Automotive AI Assistant</p>
              <h2 className="mt-2 text-2xl font-black text-white">Ask about OEM procurement, EV compliance, ISO 26262, BS VI, PPAP, ESG, and supplier risk</h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {telemetry.documentName} synced
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <AnimatePresence>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </AnimatePresence>
          {typing && <Typing />}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/10 bg-slate-950/90 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {prompts.slice(0, 3).map((prompt) => (
              <button key={prompt} onClick={() => sendMessage(prompt)} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/20">
                {prompt}
              </button>
            ))}
          </div>
          <form
            className="flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(query);
            }}
          >
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask the automotive AI to explain, validate, compare, or draft..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-4 pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </div>
            <motion.button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,.25)] transition hover:bg-white disabled:opacity-50" whileTap={{ scale: 0.96 }} disabled={!query.trim() || typing}>
              <Send className="h-4 w-4" />
              Send
            </motion.button>
          </form>
        </div>
      </main>

      <aside className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Insight icon={ShieldCheck} label="Safety" value={`${telemetry.complianceScore || 0}%`} />
          <Insight icon={AlertTriangle} label="Risk" value={`${telemetry.supplierRisk || 0}%`} tone="red" />
          <Insight icon={BatteryCharging} label="EV Spec" value={`${telemetry.batteryHealth || 0}%`} />
          <Insight icon={Factory} label="Match" value={`${telemetry.semanticMatch || 0}%`} tone="green" />
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-cyan-300 p-2 text-slate-950">
              <Bot className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-200">Automotive AI Confidence</h3>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={confidenceData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={14} background={{ fill: '#1e293b' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="-mt-28 mb-16 text-center text-4xl font-black text-white">{telemetry.aiConfidence || 0}%</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-950/75 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-2 text-cyan-200">
              <Route className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-200">Document-Aware AI Trace</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trace}>
              <defs>
                <linearGradient id="autoTrace" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="step" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(34,211,238,.25)', borderRadius: 14, color: '#fff' }} />
              <Area dataKey="score" stroke="#22d3ee" strokeWidth={3} fill="url(#autoTrace)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-200" />
            <h3 className="font-black text-white">Next Best Action</h3>
          </div>
          <p className="text-sm leading-6 text-slate-300">{telemetry.recommendations?.[0] || 'Add R155 cybersecurity timing, attach PPAP evidence, and re-run EV battery thermal validation before supplier release.'}</p>
          <button className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-cyan-300 hover:text-slate-950">
            <CheckCircle2 className="h-4 w-4" />
            Create supplier task
          </button>
        </section>
      </aside>
    </motion.div>
  );
}
