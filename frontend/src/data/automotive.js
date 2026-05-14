export const documentProfiles = {
  ev: {
    label: 'EV Battery Supply',
    accent: '#38bdf8',
    glow: 'rgba(56,189,248,0.42)',
    hero: 'MEB-42 Battery Module Agreement',
    focus: 'EV cell validation, BMS clauses, thermal runaway controls, and pack logistics.',
    fields: {
      manufacturer: 'Volkswagen Group',
      supplier: 'VoltEdge Energy Systems',
      vehicleProgram: 'ID.Aero Global EV Platform',
      evPlatform: 'MEB+ 800V',
      plant: 'Chakan EV Battery Assembly',
      procurementType: 'Lithium-ion battery module supply',
      contractValue: '$184M',
      deliveryMode: 'JIT sequenced pack delivery',
    },
  },
  manufacturing: {
    label: 'Manufacturing Compliance',
    accent: '#f97316',
    glow: 'rgba(249,115,22,0.38)',
    hero: 'Body-in-White Production Term Sheet',
    focus: 'Plant output, PPAP readiness, ISO 26262 traceability, quality gates, and defect exposure.',
    fields: {
      manufacturer: 'BMW Manufacturing',
      supplier: 'ForgeLine Components',
      vehicleProgram: 'G60 Performance Platform',
      evPlatform: 'Hybrid CLAR',
      plant: 'Plant Chennai Assembly Line 3',
      procurementType: 'Stamped chassis and BIW assemblies',
      contractValue: '$96M',
      deliveryMode: 'Milkrun with ASN sync',
    },
  },
  logistics: {
    label: 'Automotive Logistics',
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.38)',
    hero: 'Vehicle Program Logistics Agreement',
    focus: 'JIT sequencing, line-side delivery risk, supplier lane congestion, and plant ETA confidence.',
    fields: {
      manufacturer: 'Mercedes-Benz India',
      supplier: 'TransAxle Logistics',
      vehicleProgram: 'Luxury SUV CKD Program',
      evPlatform: 'EVA2',
      plant: 'Pune Final Assembly',
      procurementType: 'Inbound component logistics',
      contractValue: '$42M',
      deliveryMode: 'JIT cross-dock routing',
    },
  },
  supplier: {
    label: 'Supplier Procurement',
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.38)',
    hero: 'Tier-1 ECU Procurement Sheet',
    focus: 'Supplier anomaly detection, ECU specification matching, cybersecurity clauses, and warranty exposure.',
    fields: {
      manufacturer: 'Audi AG',
      supplier: 'CyberDrive Electronics',
      vehicleProgram: 'Premium E-tron Control Platform',
      evPlatform: 'PPE',
      plant: 'Ingolstadt Electronics Bay',
      procurementType: 'Domain controller and ECU sourcing',
      contractValue: '$128M',
      deliveryMode: 'Sequenced ECU bins with VIN lock',
    },
  },
};

export const automotiveKpis = [
  { label: 'Active Vehicle Programs', value: 28, suffix: '', delta: '+4 programs', tone: 'cyan', spark: [14, 18, 21, 22, 25, 27, 28] },
  { label: 'Supplier Risk Score', value: 17, suffix: '%', delta: '-8.3%', tone: 'red', spark: [39, 34, 29, 24, 22, 19, 17] },
  { label: 'Production Compliance', value: 94.6, suffix: '%', delta: '+5.2%', tone: 'green', spark: [78, 81, 85, 88, 91, 93, 95] },
  { label: 'EV Component Validation', value: 91.2, suffix: '%', delta: '+6.7%', tone: 'blue', spark: [68, 72, 79, 82, 87, 90, 91] },
  { label: 'AI Defect Detection', value: 97.4, suffix: '%', delta: '+2.1%', tone: 'violet', spark: [89, 91, 93, 94, 96, 97, 97] },
  { label: 'Logistics Performance', value: 88.9, suffix: '%', delta: '+3.8%', tone: 'amber', spark: [73, 76, 81, 80, 84, 87, 89] },
];

export const batteryHealth = [
  { module: 'M1', soc: 96, thermal: 21, validation: 94 },
  { module: 'M2', soc: 94, thermal: 24, validation: 91 },
  { module: 'M3', soc: 98, thermal: 19, validation: 97 },
  { module: 'M4', soc: 89, thermal: 31, validation: 86 },
  { module: 'M5', soc: 92, thermal: 27, validation: 90 },
  { module: 'M6', soc: 95, thermal: 22, validation: 95 },
];

export const productionFlow = [
  { station: 'Stamping', capacity: 92, defects: 4, takt: 88 },
  { station: 'Welding', capacity: 87, defects: 7, takt: 84 },
  { station: 'Paint', capacity: 81, defects: 9, takt: 78 },
  { station: 'Battery Fit', capacity: 89, defects: 5, takt: 86 },
  { station: 'EOL Test', capacity: 94, defects: 3, takt: 91 },
];

export const supplierNetwork = [
  { x: 18, y: 74, z: 580, supplier: 'VoltEdge', risk: 'low' },
  { x: 33, y: 61, z: 420, supplier: 'ForgeLine', risk: 'medium' },
  { x: 52, y: 82, z: 640, supplier: 'CyberDrive', risk: 'high' },
  { x: 68, y: 46, z: 380, supplier: 'TransAxle', risk: 'medium' },
  { x: 81, y: 69, z: 520, supplier: 'PolyChem', risk: 'low' },
];

export const automotiveCompliance = [
  { subject: 'ISO 26262', current: 94, required: 88 },
  { subject: 'BS VI', current: 91, required: 86 },
  { subject: 'PPAP', current: 86, required: 90 },
  { subject: 'Cybersecurity', current: 79, required: 84 },
  { subject: 'ESG', current: 88, required: 80 },
  { subject: 'Warranty', current: 83, required: 78 },
];

export const manufacturingHeatmap = [
  [14, 21, 28, 32, 41, 47],
  [18, 27, 39, 44, 52, 61],
  [23, 36, 48, 59, 66, 74],
  [31, 42, 57, 63, 78, 86],
  [38, 51, 63, 75, 84, 92],
];

export const procurementUploads = [
  { name: 'MEB Battery Supply Agreement.pdf', type: 'EV Battery', oem: 'Volkswagen', score: 94, risk: 'Low', value: '$184M' },
  { name: 'ECU Domain Controller Procurement.docx', type: 'Supplier Contract', oem: 'Audi', score: 79, risk: 'High', value: '$128M' },
  { name: 'Plant Logistics JIT Term Sheet.pdf', type: 'Logistics', oem: 'Mercedes-Benz', score: 88, risk: 'Medium', value: '$42M' },
  { name: 'BIW Manufacturing Compliance.xlsx', type: 'Manufacturing', oem: 'BMW', score: 91, risk: 'Low', value: '$96M' },
];

export const automotiveRecommendations = [
  { title: 'Request PPAP evidence pack', detail: 'Manufacturing contract references PPAP Level 3 but omits signed dimensional report acceptance.', impact: 'High' },
  { title: 'Validate BMS thermal limits', detail: 'EV battery sheet states 52C derating threshold, above platform policy for MEB+ packs.', impact: 'Critical' },
  { title: 'Escalate cybersecurity clause', detail: 'ECU procurement lacks UNECE R155 incident notification timing and OTA patch obligations.', impact: 'High' },
];

export const supplierAlerts = [
  { time: '09:48', title: 'Supplier mismatch detected', detail: 'CyberDrive DUNS ID differs from approved vendor master', type: 'critical' },
  { time: '09:39', title: 'JIT lane congestion', detail: 'Pune cross-dock ETA confidence fell below 84%', type: 'warning' },
  { time: '09:21', title: 'PPAP gate complete', detail: 'VoltEdge dimensional report accepted by quality team', type: 'success' },
  { time: '09:08', title: 'ESG clause flagged', detail: 'Battery cobalt sourcing audit date is older than 12 months', type: 'warning' },
];

export const validationClauses = [
  { id: 1, title: 'OEM Manufacturer', status: 'match', confidence: 98, x: 12, y: 18, w: 54, value: 'Volkswagen Group' },
  { id: 2, title: 'EV Battery Specs', status: 'warning', confidence: 78, x: 16, y: 34, w: 63, value: '800V, NMC cells, thermal limit variance' },
  { id: 3, title: 'ISO 26262 Safety', status: 'match', confidence: 93, x: 20, y: 52, w: 58, value: 'ASIL-D traceability present' },
  { id: 4, title: 'Cybersecurity Clause', status: 'mismatch', confidence: 59, x: 14, y: 70, w: 66, value: 'Missing R155 incident SLA' },
];

export const extractedFields = [
  { label: 'OEM Manufacturer', value: 'Volkswagen Group', status: 'match' },
  { label: 'Supplier Name', value: 'VoltEdge Energy Systems', status: 'match' },
  { label: 'Vehicle Program', value: 'ID.Aero Global EV Platform', status: 'match' },
  { label: 'EV Platform', value: 'MEB+ 800V', status: 'match' },
  { label: 'Battery Management System', value: 'BMS Gen4 with OTA diagnostics', status: 'warning' },
  { label: 'ECU Specifications', value: 'ASIL-D domain gateway', status: 'match' },
  { label: 'Manufacturing Plant', value: 'Chakan EV Battery Assembly', status: 'match' },
  { label: 'Bharat Stage VI Compliance', value: 'Referenced for hybrid derivatives', status: 'warning' },
  { label: 'Automotive Cybersecurity', value: 'Missing R155 notification SLA', status: 'mismatch' },
];

export const brandThemes = [
  { brand: 'Skoda', color: '#22c55e', model: 'Enyaq supplier cockpit' },
  { brand: 'Volkswagen', color: '#38bdf8', model: 'ID platform validation' },
  { brand: 'Audi', color: '#ef4444', model: 'E-tron ECU intelligence' },
  { brand: 'BMW', color: '#3b82f6', model: 'i platform production' },
  { brand: 'Mercedes-Benz', color: '#e5e7eb', model: 'Hyperscreen logistics' },
  { brand: 'Porsche', color: '#f59e0b', model: 'Taycan performance supply' },
  { brand: 'Tesla', color: '#f43f5e', model: 'Gigafactory procurement' },
  { brand: 'Lamborghini', color: '#fde047', model: 'Revuelto component risk' },
];

export const assemblyStages = ['Stamping', 'Welding', 'Paint', 'Battery Fit', 'ECU Flash', 'EOL Test'];
