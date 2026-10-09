// Shareable-URL state — serialises the full calculator configuration into the location hash so a
// copied link reproduces the whole setup: department settings + equipment inventory + storage +
// cost/commute, the AI scenario (model spec, cloud, scanner state), and the selected interventions.
// Pure functions (no window/DOM) so they can be unit-tested; see urlstate.test.js.
//
// Design notes:
//  - Only NON-DEFAULT fields are written, so cedarsleaf.com stays clean and short links stay short.
//  - Legacy short keys (u,r,m,t,c,a) are preserved, so links shared before this change still decode.
//  - Interventions are encoded as indices into ALL_INTERVENTIONS (stable order; append new ones at
//    the end) to keep URLs compact rather than embedding long human-readable strings.
import {
  DEFAULT_EQUIPMENT, INTERVENTIONS, OVERRIDABLE_FIELDS, TIME_MULT, CLOUD,
  STORAGE_AXIAL_LEVER, STORAGE_CLOUD_LEVER, STORAGE_RETENTION_LEVER,
} from './model.js';
import {CARBON_INTENSITY} from './calc.js';

// Canonical intervention order — the array index is the URL code. Department levers first (from
// the INTERVENTIONS table), then the three storage levers. IMPORTANT: only ever append, so codes
// in previously shared links keep pointing at the same intervention.
export const ALL_INTERVENTIONS = [
  ...Object.keys(INTERVENTIONS),
  STORAGE_AXIAL_LEVER, STORAGE_CLOUD_LEVER, STORAGE_RETENTION_LEVER,
].filter((v, i, a) => a.indexOf(v) === i);

// Defaults must mirror the initial `settings` / `scen` state in main.jsx (single source of truth —
// main.jsx imports these for its initial state and reset).
export const SETTINGS_DEFAULTS = {
  intendedUse: "Estimate annual footprint", region: "Switzerland", metricType: "Energy",
  timePeriod: "Monthly", customCi: "0.30", actualStudiesYear: '', staffCommuteKm: '15',
  electricityPrice: '', storageRetentionYears: '10', storageCloud: false, storageReformats: 'all',
  storageIntensityCustom: '', storageProvider: 'AWS', storageRegion: '', storageCloudCi: '',
  scope1AnnualKg: '',
};
export const SCEN_DEFAULTS = {
  intervention: "Turn MRI/CT scanners off overnight", cloudProvider: "Local compute",
  cloudRegion: "On-premise (Switzerland)", scannerState: "Standby", modelKey: 'cad',
  architecture: "CNN / ResNet", precision: "float32 (standard)", paramsM: '8', dim: '2D',
  resolution: '224', slices: '1', inferSec: '', inferKwh: '', whPer1kTokens: '', callsPerTask: '1',
  tokensPerCall: '', accuracyPct: '84', accuracyMetric: 'AUC', scanTimeReductPct: '0',
  lowValueReductPct: '12', trainGpu: '', trainNumGpus: '1', trainHours: '', testStudies: '500',
  deployMonths: '36', datasetSize: '', epochs: '', customPue: '', trainCustomTdpW: '',
  // Record fields that used to live only on the AI Research Label (merged into the one record):
  numRuns: '1', inferStudiesMonth: '', renewablePct: '0', trainKwhMeasured: '', trainDisclosed: 'yes', trainMissingReason: '',
  trainTool: '', taskType: '',
  // Water (optional): site water-use effectiveness and grid water intensity, L/kWh; 'screening' |
  // 'notassessed' when neither is given.
  wueOnsite: '', wueOffsite: '', waterMode: 'screening',
  // Entry route on the AI page: '' (not chosen) | 'compare' | 'own'; comparison is optional.
  aiRoute: '', ownMode: 'measured',
  aiSystemType: '', // '' | imaging | foundation; keeps Procure/Deploy re-entry on the same system family
  compareVolumeSource: 'small', // small | large | department | custom; preserves procurement workload provenance
  compareBasis: 'lifecycle', // lifecycle | inference; comparison method, NOT model training-disclosure provenance
  compareCandidateKeys: '', // versioned URL-safe reference templates; custom candidate edits stay in CEDARS files
  comparePreset: '', // versioned built-in worked comparison, e.g. maistro-agentic-v1
  // Stable record identity + typed performance semantics. accuracyPct/accuracyMetric remain the
  // legacy bridge so old links and calculations continue to load unchanged.
  modelId: 'model-primary', performanceUnit: 'percent', performanceDirection: 'higher',
  performanceValidationContext: '', performanceSource: '',
  // Training and inference may happen in different compute contexts. Blank values inherit the
  // legacy shared cloudProvider/cloudRegion/customPue/renewablePct fields.
  trainingProvider: '', trainingRegion: '', trainingPue: '', trainingRenewablePct: '',
  inferenceProvider: '', inferenceRegion: '', inferencePue: '', inferenceRenewablePct: '',
  trainingBoundary: 'upstream', // upstream | allocated-local when attached to a department
  // Shared comparison definition. Kept in the full assessment rather than the compact URL because
  // these are authoring/free-text fields, like projectName.
  compareClinicalTask: '', compareEndpoint: '', compareCohort: '',
  // Not in the URL by design (free text, authoring detail): projectName.
  projectName: '',
};

// short key ↔ field name. Keys must stay unique across BOTH maps (they share one query string).
const SETTINGS_KEYS = {
  u: 'intendedUse', r: 'region', m: 'metricType', t: 'timePeriod', c: 'customCi',
  a: 'actualStudiesYear', km: 'staffCommuteKm', ep: 'electricityPrice',
  sy: 'storageRetentionYears', sf: 'storageReformats', sti: 'storageIntensityCustom',
  sp: 'storageProvider', sci: 'storageCloudCi', s1: 'scope1AnnualKg',
}; // storageCloud (boolean) + equipment + equipmentOverrides handled specially below. storageRegion stays in the full CEDARS file, not the compact URL.
const SCEN_KEYS = {
  si: 'intervention', cp: 'cloudProvider', cr: 'cloudRegion', ss: 'scannerState', mk: 'modelKey',
  ar: 'architecture', pr: 'precision', pm: 'paramsM', dm: 'dim', rs: 'resolution', sl: 'slices',
  is: 'inferSec', ik: 'inferKwh', wt: 'whPer1kTokens', ct: 'callsPerTask', tc: 'tokensPerCall', ap: 'accuracyPct',
  am: 'accuracyMetric', st: 'scanTimeReductPct', lv: 'lowValueReductPct', tg: 'trainGpu',
  tn: 'trainNumGpus', th: 'trainHours', ts: 'testStudies', dp: 'deployMonths',
  ds: 'datasetSize', ne: 'epochs', pu: 'customPue', tw: 'trainCustomTdpW',
  nr: 'numRuns', im: 'inferStudiesMonth', rp: 'renewablePct', tk: 'trainKwhMeasured', td: 'trainDisclosed', tmr: 'trainMissingReason',
  tt: 'trainTool', ty: 'taskType', wo: 'wueOnsite', wf: 'wueOffsite', wm: 'waterMode', ro: 'aiRoute', om: 'ownMode',
  asys: 'aiSystemType', vs: 'compareVolumeSource', cb: 'compareBasis', cands: 'compareCandidateKeys', cpre: 'comparePreset',
  mid: 'modelId', punit: 'performanceUnit', pd: 'performanceDirection', pv: 'performanceValidationContext', ps: 'performanceSource',
  tp: 'trainingProvider', tr: 'trainingRegion', tpu: 'trainingPue', trp: 'trainingRenewablePct',
  ifp: 'inferenceProvider', ir: 'inferenceRegion', ipu: 'inferencePue', irp: 'inferenceRenewablePct', tb: 'trainingBoundary',
};

const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
const finiteIn = (v,min=-Infinity,max=Infinity,integer=false) => { if(v==null||String(v).trim()==='')return false; const n=Number(v); return Number.isFinite(n)&&n>=min&&n<=max&&(!integer||Number.isInteger(n)); };
const oneOf = values => v => values.includes(v);
const SETTINGS_VALIDATORS={intendedUse:oneOf(['Estimate annual footprint','Compare modalities','Track monthly sustainability KPIs','Evaluate AI tool impact','Estimate savings from an intervention']),region:v=>own(CARBON_INTENSITY,v),metricType:oneOf(['Energy','Carbon','Water','AI net impact']),timePeriod:v=>own(TIME_MULT,v),customCi:v=>finiteIn(v,0),actualStudiesYear:v=>finiteIn(v,0),staffCommuteKm:v=>finiteIn(v,0),electricityPrice:v=>finiteIn(v,0),storageRetentionYears:v=>finiteIn(v,0,100),storageReformats:oneOf(['all','axial']),storageIntensityCustom:v=>finiteIn(v,0.000001),storageProvider:v=>own(CLOUD,v),storageCloudCi:v=>finiteIn(v,0),scope1AnnualKg:v=>finiteIn(v,0)};
const SCEN_VALIDATORS={cloudProvider:v=>own(CLOUD,v),scannerState:oneOf(['Active','Idle','Standby','Off']),paramsM:v=>finiteIn(v,0),resolution:v=>finiteIn(v,1),slices:v=>finiteIn(v,1),inferSec:v=>finiteIn(v,0),inferKwh:v=>finiteIn(v,0),whPer1kTokens:v=>finiteIn(v,0),callsPerTask:v=>finiteIn(v,1,Infinity,true),tokensPerCall:v=>finiteIn(v,0),accuracyPct:v=>finiteIn(v,0),scanTimeReductPct:v=>finiteIn(v,0,100),lowValueReductPct:v=>finiteIn(v,0,100),trainNumGpus:v=>finiteIn(v,1,Infinity,true),trainHours:v=>finiteIn(v,0),testStudies:v=>finiteIn(v,0),deployMonths:v=>finiteIn(v,1),datasetSize:v=>finiteIn(v,0),epochs:v=>finiteIn(v,0),customPue:v=>finiteIn(v,1),trainCustomTdpW:v=>finiteIn(v,0),numRuns:v=>finiteIn(v,1,Infinity,true),inferStudiesMonth:v=>finiteIn(v,0),renewablePct:v=>finiteIn(v,0,100),trainKwhMeasured:v=>finiteIn(v,0),wueOnsite:v=>finiteIn(v,0),wueOffsite:v=>finiteIn(v,0),aiRoute:oneOf(['','compare','own']),ownMode:oneOf(['measured','measure','spec']),aiSystemType:oneOf(['','imaging','foundation']),compareVolumeSource:oneOf(['small','large','department','custom']),compareBasis:oneOf(['lifecycle','inference']),compareCandidateKeys:v=>v===''||/^v1:[a-z0-9_-]+(?:,[a-z0-9_-]+){1,5}$/.test(v),comparePreset:v=>v===''||/^[a-z0-9_-]+-v\d+$/.test(v),performanceDirection:oneOf(['higher','lower']),trainingProvider:v=>v===''||own(CLOUD,v),trainingPue:v=>v===''||finiteIn(v,1),trainingRenewablePct:v=>v===''||finiteIn(v,0,100),inferenceProvider:v=>v===''||own(CLOUD,v),inferencePue:v=>v===''||finiteIn(v,1),inferenceRenewablePct:v=>v===''||finiteIn(v,0,100),trainingBoundary:oneOf(['upstream','allocated-local']),trainDisclosed:oneOf(['yes','no']),waterMode:oneOf(['screening','notassessed'])};
const validScalar=(validators,field,value)=>!validators[field]||validators[field](value);

// equipment: `eq=ct~2-mri_15t~1` (non-zero devices only; `~` = count sep, `-` = item sep — both
// URL-safe and absent from every device key).
const encodeEquip = eq => Object.entries(eq || {})
  .filter(([, n]) => Number(n) > 0)
  .map(([k, n]) => `${k}~${Number(n)}`).join('-');
const decodeEquip = str => {
  const out = {};
  if (!str) return out;
  for (const part of str.split('-')) {
    const [k, n] = part.split('~');
    if (k && Object.prototype.hasOwnProperty.call(DEFAULT_EQUIPMENT, k)) {
      const v = parseInt(n, 10);
      if (v > 0 && v <= 999) out[k] = v;
    }
  }
  return out;
};

// equipmentOverrides: `eo=ct:active_kw=45,scans=1200|workstations:active_kw=0.6` — measured-data
// overrides for a device's power/scan-volume fields (see OVERRIDABLE_FIELDS in model.js). `|`
// separates devices, `:` splits key from its field list, `,` separates fields, `=` splits
// field=value. URLSearchParams escapes these automatically, so no manual encoding needed.
const encodeEquipOverrides = ov => Object.entries(ov || {})
  .map(([key, fields]) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_EQUIPMENT, key)) return null;
    const fieldsStr = OVERRIDABLE_FIELDS
      .filter(f => fields?.[f] != null && fields[f] !== '' && !isNaN(parseFloat(fields[f])))
      .map(f => `${f}=${fields[f]}`).join(',');
    return fieldsStr ? `${key}:${fieldsStr}` : null;
  })
  .filter(Boolean).join('|');
const decodeEquipOverrides = str => {
  const out = {};
  if (!str) return out;
  for (const devicePart of str.split('|')) {
    const [key, fieldsStr] = devicePart.split(':');
    if (!key || !fieldsStr || !Object.prototype.hasOwnProperty.call(DEFAULT_EQUIPMENT, key)) continue;
    const fields = {};
    for (const pair of fieldsStr.split(',')) {
      const [f, v] = pair.split('=');
      const n=Number(v);
      if (f && OVERRIDABLE_FIELDS.includes(f) && v !== undefined && v !== '' && Number.isFinite(n) && n >= 0) { fields[f]=n; }
    }
    if (Object.keys(fields).length) out[key] = fields;
  }
  return out;
};

const encodeInterv = names => (names || [])
  .map(n => ALL_INTERVENTIONS.indexOf(n)).filter(i => i >= 0).join('-');
const decodeInterv = str => !str ? []
  : str.split('-').map(x => ALL_INTERVENTIONS[parseInt(x, 10)]).filter(Boolean);

// Serialise calculator state → query string (no leading '#'), omitting any field still at its default.
// `activeInterventions` are prospective modeled changes; `currentPractices` are actions already in place.
export function encodeConfig({ settings = {}, scen = {}, activeInterventions = [], currentPractices = [] } = {}) {
  const q = new URLSearchParams();
  for (const [k, f] of Object.entries(SETTINGS_KEYS)) {
    const v = settings[f];
    if (v !== undefined && String(v) !== String(SETTINGS_DEFAULTS[f])) q.set(k, v);
  }
  if (settings.storageCloud !== undefined && !!settings.storageCloud !== SETTINGS_DEFAULTS.storageCloud)
    q.set('sc', settings.storageCloud ? '1' : '0');
  const eqStr = encodeEquip(settings.equipment);
  if (eqStr) q.set('eq', eqStr);
  const eoStr = encodeEquipOverrides(settings.equipmentOverrides);
  if (eoStr) q.set('eo', eoStr);
  for (const [k, f] of Object.entries(SCEN_KEYS)) {
    const v = scen[f];
    if (v !== undefined && String(v) !== String(SCEN_DEFAULTS[f])) q.set(k, v);
  }
  const ivStr = encodeInterv(activeInterventions);
  if (ivStr) q.set('in', ivStr);
  const practiceStr = encodeInterv(currentPractices);
  if (practiceStr) q.set('ip', practiceStr);
  return q.toString();
}

// Parse a hash/query string → {settings?, scen?, activeInterventions?, currentPractices?} containing ONLY the fields
// present in the URL (caller merges these over its defaults). `settings.equipment`, when present,
// is a partial map of non-zero devices.
export function decodeConfig(hashOrStr) {
  const q=new URLSearchParams(String(hashOrStr||'').replace(/^#/,'')); const settings={},scen={},rejectedFields=[];
  for(const [k,f] of Object.entries(SETTINGS_KEYS))if(q.has(k)){const v=q.get(k);if(validScalar(SETTINGS_VALIDATORS,f,v))settings[f]=v;else rejectedFields.push(f);}
  if(q.has('sc'))settings.storageCloud=q.get('sc')==='1'; if(q.has('eq'))settings.equipment=decodeEquip(q.get('eq')); if(q.has('eo'))settings.equipmentOverrides=decodeEquipOverrides(q.get('eo'));
  for(const [k,f] of Object.entries(SCEN_KEYS))if(q.has(k)){const v=q.get(k);if(validScalar(SCEN_VALIDATORS,f,v))scen[f]=v;else rejectedFields.push(f);}
  const out={}; if(Object.keys(settings).length)out.settings=settings; if(Object.keys(scen).length)out.scen=scen; if(q.has('in'))out.activeInterventions=decodeInterv(q.get('in')); if(q.has('ip'))out.currentPractices=decodeInterv(q.get('ip')); if(rejectedFields.length)out.rejectedFields=[...new Set(rejectedFields)]; return out;
}
