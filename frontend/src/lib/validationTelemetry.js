export const VALIDATION_STORAGE_KEY = 'automotive_validation_telemetry';
export const VALIDATION_EVENT = 'automotive-validation-updated';

export const validationPipeline = [
  { key: 'upload', label: 'Secure upload', detail: 'Term sheet encrypted and indexed', progress: 12 },
  { key: 'ocr', label: 'OCR extraction', detail: 'Pages scanned for OEM, supplier, clauses', progress: 28 },
  { key: 'fields', label: 'Automotive field detection', detail: 'Program, EV platform, ECU, plant, logistics', progress: 45 },
  { key: 'semantic', label: 'Semantic clause comparison', detail: 'BMS, PPAP, ISO 26262, BS VI, ESG', progress: 64 },
  { key: 'chroma', label: 'ChromaDB retrieval index', detail: 'Validation context embedded for document-aware AI', progress: 74 },
  { key: 'risk', label: 'Supplier risk intelligence', detail: 'Anomalies, logistics exposure, counterfeit flags', progress: 82 },
  { key: 'complete', label: 'Live cockpit update', detail: 'Compliance score and recommendations published', progress: 100 },
];

export const cockpitThemes = [
  {
    key: 'tesla',
    label: 'Tesla EV Mode',
    shortLabel: 'Tesla',
    accent: '#22d3ee',
    secondary: '#f43f5e',
    surface: 'rgba(2, 6, 23, 0.86)',
    description: 'Minimal EV autonomy telemetry with high-contrast AI validation signals.',
  },
  {
    key: 'bmw',
    label: 'BMW M Performance',
    shortLabel: 'BMW M',
    accent: '#3b82f6',
    secondary: '#ef4444',
    surface: 'rgba(3, 7, 18, 0.9)',
    description: 'Sport telemetry, RPM validation sweeps, and aggressive supplier risk arcs.',
  },
  {
    key: 'mercedes',
    label: 'Mercedes Hyperscreen',
    shortLabel: 'Mercedes',
    accent: '#e5e7eb',
    secondary: '#38bdf8',
    surface: 'rgba(8, 13, 24, 0.88)',
    description: 'Luxury glass cockpit panels with calm compliance intelligence.',
  },
  {
    key: 'audi',
    label: 'Audi Digital Cockpit',
    shortLabel: 'Audi',
    accent: '#ef4444',
    secondary: '#f8fafc',
    surface: 'rgba(10, 10, 12, 0.88)',
    description: 'Precision ECU and cybersecurity validation focused on supplier exceptions.',
  },
  {
    key: 'porsche',
    label: 'Porsche Sport Telemetry',
    shortLabel: 'Porsche',
    accent: '#f59e0b',
    secondary: '#22d3ee',
    surface: 'rgba(12, 10, 8, 0.9)',
    description: 'Performance-centered procurement telemetry and manufacturing diagnostics.',
  },
];

export const themeByKey = cockpitThemes.reduce((acc, theme) => {
  acc[theme.key] = theme;
  return acc;
}, {});

const profileKeywords = [
  { key: 'ev', terms: ['battery', 'bms', 'ev', '800v', 'cell', 'thermal', 'charging', 'module'] },
  { key: 'manufacturing', terms: ['manufacturing', 'plant', 'ppap', 'line', 'assembly', 'biw', 'welding', 'paint'] },
  { key: 'logistics', terms: ['logistics', 'jit', 'delivery', 'lane', 'cross-dock', 'asn', 'shipment', 'transport'] },
  { key: 'supplier', terms: ['supplier', 'ecu', 'cybersecurity', 'r155', 'counterfeit', 'domain controller', 'ota'] },
];

export const profileThemeMap = {
  ev: 'tesla',
  manufacturing: 'bmw',
  logistics: 'mercedes',
  supplier: 'audi',
  generic: 'porsche',
};

const profileLabels = {
  ev: 'EV Battery Procurement',
  manufacturing: 'Manufacturing Contract',
  logistics: 'Logistics Agreement',
  supplier: 'Supplier Agreement',
  generic: 'Automotive Term Sheet',
};

export function detectProfileKey(text = '') {
  const lowered = String(text).toLowerCase();
  const scored = profileKeywords.map((profile) => ({
    key: profile.key,
    score: profile.terms.reduce((count, term) => count + (lowered.includes(term) ? 1 : 0), 0),
  }));
  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best?.score > 0 ? best.key : 'generic';
}

export function getStatusFromScores({ complianceScore = 0, supplierRisk = 100, anomalies = [], mismatches = [] }) {
  if (complianceScore >= 90 && supplierRisk <= 24 && anomalies.length === 0 && mismatches.length <= 1) {
    return 'success';
  }
  if (complianceScore >= 70 && supplierRisk <= 58) {
    return 'warning';
  }
  return 'failed';
}

export function getStatusTone(status) {
  const tones = {
    idle: { label: 'Standby', color: '#38bdf8', className: 'text-cyan-100 bg-cyan-300/10 border-cyan-300/30' },
    analysis: { label: 'AI Analysis Mode', color: '#22d3ee', className: 'text-cyan-100 bg-cyan-300/10 border-cyan-300/30' },
    success: { label: 'Validation Success', color: '#22c55e', className: 'text-emerald-100 bg-emerald-400/10 border-emerald-300/30' },
    warning: { label: 'Validation Warning', color: '#f59e0b', className: 'text-amber-100 bg-amber-400/10 border-amber-300/30' },
    failed: { label: 'Validation Failed', color: '#ef4444', className: 'text-red-100 bg-red-500/10 border-red-400/30' },
  };
  return tones[status] || tones.idle;
}

export function createPreviewTelemetry(file, stageIndex = 0) {
  const name = typeof file === 'string' ? file : file?.name || 'Automotive term sheet';
  const profileKey = detectProfileKey(name);
  const stage = validationPipeline[Math.min(stageIndex, validationPipeline.length - 1)];

  return {
    id: `preview-${Date.now()}`,
    documentName: name,
    profileKey,
    profileLabel: profileLabels[profileKey],
    themeKey: profileThemeMap[profileKey],
    status: 'analysis',
    phase: 'analysis',
    progress: stage.progress,
    activeStage: stage.key,
    complianceScore: Math.min(96, 42 + stageIndex * 9),
    aiConfidence: Math.min(95, 38 + stageIndex * 10),
    semanticMatch: Math.min(94, 34 + stageIndex * 11),
    supplierRisk: Math.max(16, 74 - stageIndex * 8),
    manufacturingRisk: Math.max(12, 58 - stageIndex * 6),
    logisticsPerformance: Math.min(96, 52 + stageIndex * 7),
    batteryHealth: profileKey === 'ev' ? Math.min(96, 50 + stageIndex * 8) : 82,
    recommendations: ['OCR is extracting automotive clauses in real time.'],
    anomalies: [],
    mismatches: [],
    automotiveFields: {},
    pipeline: validationPipeline,
  };
}

export function buildTelemetryFromReport(report, fallback = {}) {
  const document = report?.document || fallback.document || {};
  const metadata = document.metadata || report?.metadata || {};
  const compliance = report?.compliance_result || metadata.compliance_result || {};
  const latestRisk = report?.risk_assessments?.[0] || metadata.risk_assessment || {};
  const clauseText = JSON.stringify(report?.clause_matches || metadata.automotive_fields || {});
  const profileKey = metadata.document_profile || detectProfileKey(`${document.name || fallback.documentName || ''} ${clauseText}`);
  const complianceScore = Math.round(compliance.compliance_score ?? metadata.compliance_score ?? report?.score ?? fallback.complianceScore ?? 0);
  const semanticMatch = Math.round(compliance.match_percentage ?? metadata.semantic_match ?? fallback.semanticMatch ?? complianceScore);
  const supplierRisk = Math.round(latestRisk.risk_score ?? metadata.risk_score ?? fallback.supplierRisk ?? Math.max(0, 100 - complianceScore));
  const anomalies = latestRisk.anomalies || metadata.anomalies || [];
  const mismatches = compliance.mismatches || metadata.mismatches || [];
  const status = getStatusFromScores({ complianceScore, supplierRisk, anomalies, mismatches });
  const documentName = document.name || fallback.documentName || 'Automotive term sheet';

  return {
    id: report?.id || fallback.id || `validation-${Date.now()}`,
    documentName,
    profileKey,
    profileLabel: profileLabels[profileKey] || profileLabels.generic,
    themeKey: profileThemeMap[profileKey] || 'porsche',
    status,
    phase: 'complete',
    progress: 100,
    activeStage: 'complete',
    complianceScore,
    aiConfidence: Math.round(report?.score ?? metadata.ai_confidence ?? fallback.aiConfidence ?? complianceScore),
    semanticMatch,
    supplierRisk,
    manufacturingRisk: Math.round(metadata.manufacturing_risk ?? Math.min(100, supplierRisk + (profileKey === 'manufacturing' ? 8 : -6))),
    logisticsPerformance: Math.round(metadata.logistics_performance ?? Math.max(0, 100 - (metadata.logistics_risk ?? supplierRisk * 0.72))),
    batteryHealth: Math.round(metadata.battery_health ?? (profileKey === 'ev' ? Math.max(50, complianceScore - 2) : 84)),
    recommendations: compliance.recommendations || metadata.recommendations || [],
    anomalies,
    mismatches,
    automotiveFields: metadata.automotive_fields || {},
    clauseMatches: report?.clause_matches || [],
    summary: report?.summary || fallback.summary || '',
    pipeline: validationPipeline,
  };
}

export function buildTelemetryFromStreamEvent(event, file, fallback = {}) {
  const stageIndex = Math.max(
    0,
    validationPipeline.findIndex((step) => step.key === event?.stage)
  );
  const preview = createPreviewTelemetry(file, stageIndex);
  const document = event?.document || fallback.document || {};
  const profileKey = event?.profile || fallback.profileKey || preview.profileKey;
  const complianceScore = Math.round(event?.compliance_score ?? fallback.complianceScore ?? preview.complianceScore);
  const supplierRisk = Math.round(event?.risk_score ?? fallback.supplierRisk ?? preview.supplierRisk);
  const anomalies = event?.anomalies || fallback.anomalies || preview.anomalies;
  const mismatches = event?.mismatches || fallback.mismatches || preview.mismatches;
  const isComplete = event?.type === 'complete';
  const status = isComplete
    ? getStatusFromScores({ complianceScore, supplierRisk, anomalies, mismatches })
    : 'analysis';

  return {
    ...preview,
    ...fallback,
    id: document.id || event?.document_id || fallback.id || preview.id,
    documentName: document.name || event?.document_name || preview.documentName,
    profileKey,
    profileLabel: profileLabels[profileKey] || profileLabels.generic,
    themeKey: profileThemeMap[profileKey] || preview.themeKey,
    status,
    phase: isComplete ? 'complete' : 'analysis',
    progress: Math.round(event?.progress ?? preview.progress),
    activeStage: event?.stage || preview.activeStage,
    complianceScore,
    aiConfidence: Math.round(event?.ai_confidence ?? fallback.aiConfidence ?? preview.aiConfidence),
    semanticMatch: Math.round(event?.semantic_match ?? fallback.semanticMatch ?? preview.semanticMatch),
    supplierRisk,
    manufacturingRisk: Math.round(event?.manufacturing_risk ?? fallback.manufacturingRisk ?? preview.manufacturingRisk),
    logisticsPerformance: Math.round(event?.logistics_performance ?? fallback.logisticsPerformance ?? preview.logisticsPerformance),
    batteryHealth: Math.round(event?.battery_health ?? fallback.batteryHealth ?? preview.batteryHealth),
    recommendations: event?.recommendations || fallback.recommendations || preview.recommendations,
    anomalies,
    mismatches,
    automotiveFields: event?.automotive_fields || fallback.automotiveFields || preview.automotiveFields,
    streamMessage: event?.message || fallback.streamMessage || '',
  };
}

export function saveValidationTelemetry(telemetry) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VALIDATION_STORAGE_KEY, JSON.stringify(telemetry));
  window.dispatchEvent(new CustomEvent(VALIDATION_EVENT, { detail: telemetry }));
}

export function getStoredValidationTelemetry() {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(VALIDATION_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    window.localStorage.removeItem(VALIDATION_STORAGE_KEY);
    return null;
  }
}

export function createDefaultTelemetry() {
  return {
    id: 'demo-validation-core',
    documentName: 'MEB Battery Supply Agreement.pdf',
    profileKey: 'ev',
    profileLabel: profileLabels.ev,
    themeKey: 'tesla',
    status: 'analysis',
    phase: 'analysis',
    progress: 78,
    activeStage: 'semantic',
    complianceScore: 88,
    aiConfidence: 92,
    semanticMatch: 91,
    supplierRisk: 24,
    manufacturingRisk: 19,
    logisticsPerformance: 89,
    batteryHealth: 94,
    recommendations: [
      'Add UNECE R155 incident notification timing for ECU and BMS events.',
      'Attach signed PPAP Level 3 evidence before supplier release.',
    ],
    anomalies: ['BMS thermal derating limit is above platform policy.'],
    mismatches: ['Cybersecurity incident SLA'],
    automotiveFields: {
      oem_manufacturer: 'Volkswagen Group',
      supplier_name: 'VoltEdge Energy Systems',
      vehicle_program: 'ID.Aero Global EV Platform',
      ev_platform: 'MEB+ 800V',
      manufacturing_plant: 'Chakan EV Battery Assembly',
      delivery_mode: 'JIT sequenced pack delivery',
    },
    pipeline: validationPipeline,
  };
}
