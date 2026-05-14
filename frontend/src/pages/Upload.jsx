import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Gauge,
  Loader2,
  Route,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import api, { uploadWithValidationStream } from '../services/api';
import {
  buildTelemetryFromReport,
  buildTelemetryFromStreamEvent,
  createDefaultTelemetry,
  createPreviewTelemetry,
  saveValidationTelemetry,
  validationPipeline,
} from '../lib/validationTelemetry';

function MetricTile({ icon: Icon, label, value, tone = 'cyan' }) {
  const toneClass = {
    cyan: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
    green: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
    red: 'border-red-400/20 bg-red-500/10 text-red-100',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <Icon className="mb-3 h-5 w-5" />
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

const idleTelemetry = {
  ...createDefaultTelemetry(),
  id: 'upload-standby',
  documentName: 'Awaiting automobile term sheet',
  status: 'idle',
  phase: 'idle',
  progress: 0,
  activeStage: 'upload',
  complianceScore: 0,
  aiConfidence: 0,
  semanticMatch: 0,
  supplierRisk: 0,
};

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [telemetry, setTelemetry] = useState(idleTelemetry);
  const [stageIndex, setStageIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('Select an automobile term sheet to start automatic AI validation.');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const requestIdRef = useRef(0);

  const activeStage = validationPipeline[Math.min(stageIndex, validationPipeline.length - 1)];
  const resultTone = useMemo(() => {
    if (!result) return 'cyan';
    if (telemetry.status === 'success') return 'green';
    if (telemetry.status === 'failed') return 'red';
    return 'amber';
  }, [result, telemetry.status]);

  const runAutomaticValidation = async (selectedFile) => {
    const requestId = Date.now();
    requestIdRef.current = requestId;
    setIsProcessing(true);
    setStageIndex(0);
    setResult(null);
    setError('');
    setMessage('Cockpit power-on sequence engaged. Uploading and validating automatically...');

    const preview = createPreviewTelemetry(selectedFile, 0);
    setTelemetry(preview);
    saveValidationTelemetry(preview);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      let report = null;
      let document = null;
      let latestTelemetry = preview;

      const finalStreamEvent = await uploadWithValidationStream(selectedFile, (event) => {
        if (requestIdRef.current !== requestId) return;

        if (event.type === 'complete' && event.validation_report) {
          report = event.validation_report;
          document = event.document || event.validation_report.document;
          const completed = buildTelemetryFromReport(report, {
            document,
            documentName: document?.name || selectedFile.name,
            ...latestTelemetry,
          });
          latestTelemetry = completed;
          setStageIndex(validationPipeline.length - 1);
          setTelemetry(completed);
          saveValidationTelemetry(completed);
          setResult(report);
          setMessage(event.message || 'Validation complete. Dashboard telemetry, compliance score, supplier risk, and AI recommendations are live.');
          return;
        }

        const streamTelemetry = buildTelemetryFromStreamEvent(event, selectedFile, latestTelemetry);
        latestTelemetry = streamTelemetry;
        const pipelineIndex = validationPipeline.findIndex((step) => step.key === streamTelemetry.activeStage);
        setStageIndex(pipelineIndex >= 0 ? pipelineIndex : 0);
        setTelemetry(streamTelemetry);
        saveValidationTelemetry(streamTelemetry);
        setMessage(event.message || streamTelemetry.streamMessage || 'Automatic validation stream is updating the cockpit.');
      });

      if (requestIdRef.current !== requestId) return;

      if (!report && finalStreamEvent?.validation_report) {
        report = finalStreamEvent.validation_report;
        document = finalStreamEvent.document || report.document;
      }

      if (!report && document?.id) {
        setStageIndex(3);
        const semanticPreview = createPreviewTelemetry(selectedFile, 3);
        setTelemetry(semanticPreview);
        saveValidationTelemetry(semanticPreview);
        const validationResponse = await api.post('/validation/process/', { document_id: document.id });
        report = validationResponse.data;
      }

      const completedTelemetry = buildTelemetryFromReport(report, {
        document,
        documentName: document?.name || selectedFile.name,
      });

      setTelemetry(completedTelemetry);
      setStageIndex(validationPipeline.length - 1);
      saveValidationTelemetry(completedTelemetry);
      setResult(report);
      setMessage('Validation complete. Dashboard telemetry, compliance score, supplier risk, and AI recommendations are live.');
    } catch (err) {
      try {
        const uploadResponse = await api.post('/uploads/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (requestIdRef.current !== requestId) return;

        const uploadData = uploadResponse.data;
        const document = uploadData.document || uploadData;
        const report = uploadData.validation_report || uploadData.report || null;
        const completedTelemetry = buildTelemetryFromReport(report, {
          document,
          documentName: document?.name || selectedFile.name,
        });

        setTelemetry(completedTelemetry);
        setStageIndex(validationPipeline.length - 1);
        saveValidationTelemetry(completedTelemetry);
        setResult(report);
        setMessage('Validation complete through REST fallback. Dashboard telemetry and AI recommendations are live.');
        return;
      } catch (fallbackErr) {
        err = fallbackErr;
      }

      const failureTelemetry = {
        ...createPreviewTelemetry(selectedFile, Math.max(stageIndex, 2)),
        status: 'failed',
        phase: 'complete',
        progress: 100,
        complianceScore: 0,
        aiConfidence: 0,
        semanticMatch: 0,
        supplierRisk: 100,
        recommendations: ['Check API connectivity and retry the automatic validation upload.'],
        anomalies: ['Upload or validation endpoint did not complete.'],
      };
      setTelemetry(failureTelemetry);
      saveValidationTelemetry(failureTelemetry);
      setError(err.response?.data?.detail || err.message || 'Automatic validation failed. Confirm the backend API is running and try again.');
      setMessage('Validation cockpit entered emergency mode.');
    } finally {
      if (requestIdRef.current === requestId) {
        setIsProcessing(false);
      }
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    runAutomaticValidation(selectedFile);
  };

  return (
    <motion.div className="space-y-6 rounded-3xl bg-[radial-gradient(circle_at_top,#0f172a_0,#020617_48%,#050505_100%)] p-1 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,.72fr)_minmax(0,1.28fr)]">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="absolute inset-0 cockpit-grid opacity-25" />
          <div className="relative">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              <UploadCloud className="h-4 w-4" />
              Automatic validation intake
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">Drop a term sheet. The validation engine starts instantly.</h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              Upload triggers OCR, automotive field extraction, semantic clause comparison, compliance scoring, supplier risk analysis, anomaly detection, and live cockpit updates.
            </p>

            <label
              className="mt-6 flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-300/35 bg-cyan-300/10 p-6 text-center transition hover:border-white/60 hover:bg-cyan-300/15"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.txt,.doc,.docx"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <motion.span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-[0_0_40px_rgba(34,211,238,.35)]" animate={{ y: [0, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                {isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : <FileUp className="h-7 w-7" />}
              </motion.span>
              <p className="text-lg font-black text-white">{file ? file.name : 'Select or drop an automobile term sheet'}</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">No manual validation button. Selection is the ignition switch.</p>
            </label>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-slate-950 p-2 text-cyan-200">
                  {error ? <AlertTriangle className="h-5 w-5 text-red-300" /> : isProcessing ? <ScanLine className="h-5 w-5" /> : result ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Sparkles className="h-5 w-5" />}
                </span>
                <div>
                  <p className="font-black text-white">{error ? 'Validation alert' : activeStage.label}</p>
                  <p className={`mt-1 text-sm leading-6 ${error ? 'text-red-200' : 'text-slate-300'}`}>{error || message}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Live validation result</p>
              <h2 className="mt-2 text-2xl font-black text-white">Document-aware automotive intelligence</h2>
            </div>
            <Link to="/validate" className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,.3)] transition hover:bg-white">
              <ShieldCheck className="h-4 w-4" />
              Open workspace
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile icon={ShieldCheck} label="Compliance" value={`${telemetry.complianceScore || 0}%`} tone={resultTone} />
            <MetricTile icon={Gauge} label="AI confidence" value={`${telemetry.aiConfidence || 0}%`} tone="cyan" />
            <MetricTile icon={AlertTriangle} label="Supplier risk" value={`${telemetry.supplierRisk || 0}%`} tone={telemetry.supplierRisk > 55 ? 'red' : telemetry.supplierRisk > 25 ? 'amber' : 'green'} />
            <MetricTile icon={Route} label="Logistics" value={`${telemetry.logisticsPerformance || 0}%`} tone="green" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Detected automotive fields</p>
              <div className="grid gap-3">
                {Object.entries(telemetry.automotiveFields || {}).slice(0, 8).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/70 px-3 py-2">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label.replaceAll('_', ' ')}</p>
                    <p className="text-right text-sm font-bold text-slate-100">{String(value)}</p>
                  </div>
                ))}
                {Object.keys(telemetry.automotiveFields || {}).length === 0 && (
                  <p className="rounded-xl bg-slate-950/70 p-3 text-sm font-semibold text-slate-400">Fields will appear as soon as OCR and semantic extraction complete.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">AI recommendations and anomalies</p>
              <div className="space-y-3">
                {(telemetry.recommendations?.length ? telemetry.recommendations : ['Upload an automobile document to generate AI corrections.']).slice(0, 4).map((item) => (
                  <div key={item} className="rounded-xl border border-cyan-300/10 bg-cyan-300/10 p-3 text-sm font-semibold leading-6 text-slate-200">{item}</div>
                ))}
                {telemetry.anomalies?.slice(0, 3).map((item) => (
                  <div key={item} className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold leading-6 text-red-100">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
