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
  DEFAULT_EQUIPMENT, INTERVENTIONS, OVERRIDABLE_FIELDS,
  STORAGE_AXIAL_LEVER, STORAGE_CLOUD_LEVER, STORAGE_RETENTION_LEVER,
} from './model.js';

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
  storageIntensityCustom: '',
};
export const SCEN_DEFAULTS = {
  intervention: "Turn MRI/CT scanners off overnight", cloudProvider: "Local compute",
  cloudRegion: "On-premise (Switzerland)", scannerState: "Standby", modelKey: 'cad',
  architecture: "CNN / ResNet", precision: "float32 (standard)", paramsM: '8', dim: '2D',
  resolution: '224', slices: '1', inferSec: '', inferKwh: '', whPer1kTokens: '', callsPerTask: '1',
  tokensPerCall: '', accuracyPct: '84', accuracyMetric: 'AUC', scanTimeReductPct: '0',
  lowValueReductPct: '12', trainGpu: '', trainNumGpus: '1', trainHours: '', testStudies: '500',
  deployMonths: '36', datasetSize: '', epochs: '', customPue: '', trainCustomTdpW: '',
};

// short key ↔ field name. Keys must stay unique across BOTH maps (they share one query string).
const SETTINGS_KEYS = {
  u: 'intendedUse', r: 'region', m: 'metricType', t: 'timePeriod', c: 'customCi',
  a: 'actualStudiesYear', km: 'staffCommuteKm', ep: 'electricityPrice',
  sy: 'storageRetentionYears', sf: 'storageReformats', sti: 'storageIntensityCustom',
}; // storageCloud (boolean) + equipment + equipmentOverrides handled specially below.
const SCEN_KEYS = {
  si: 'intervention', cp: 'cloudProvider', cr: 'cloudRegion', ss: 'scannerState', mk: 'modelKey',
  ar: 'architecture', pr: 'precision', pm: 'paramsM', dm: 'dim', rs: 'resolution', sl: 'slices',
  is: 'inferSec', ik: 'inferKwh', wt: 'whPer1kTokens', ct: 'callsPerTask', tc: 'tokensPerCall', ap: 'accuracyPct',
  am: 'accuracyMetric', st: 'scanTimeReductPct', lv: 'lowValueReductPct', tg: 'trainGpu',
  tn: 'trainNumGpus', th: 'trainHours', ts: 'testStudies', dp: 'deployMonths',
  ds: 'datasetSize', ne: 'epochs', pu: 'customPue', tw: 'trainCustomTdpW',
};

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
      if (v > 0) out[k] = v;
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
      if (f && OVERRIDABLE_FIELDS.includes(f) && v !== undefined && v !== '' && !isNaN(parseFloat(v))) {
        fields[f] = parseFloat(v);
      }
    }
    if (Object.keys(fields).length) out[key] = fields;
  }
  return out;
};

const encodeInterv = names => (names || [])
  .map(n => ALL_INTERVENTIONS.indexOf(n)).filter(i => i >= 0).join('-');
const decodeInterv = str => !str ? []
  : str.split('-').map(x => ALL_INTERVENTIONS[parseInt(x, 10)]).filter(Boolean);

// Serialise {settings, scen, activeInterventions} → query string (no leading '#'), omitting any
// field still at its default.
export function encodeConfig({ settings = {}, scen = {}, activeInterventions = [] } = {}) {
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
  return q.toString();
}

// Parse a hash/query string → {settings?, scen?, activeInterventions?} containing ONLY the fields
// present in the URL (caller merges these over its defaults). `settings.equipment`, when present,
// is a partial map of non-zero devices.
export function decodeConfig(hashOrStr) {
  const q = new URLSearchParams(String(hashOrStr || '').replace(/^#/, ''));
  const settings = {}, scen = {};
  for (const [k, f] of Object.entries(SETTINGS_KEYS)) if (q.has(k)) settings[f] = q.get(k);
  if (q.has('sc')) settings.storageCloud = q.get('sc') === '1';
  if (q.has('eq')) settings.equipment = decodeEquip(q.get('eq'));
  if (q.has('eo')) settings.equipmentOverrides = decodeEquipOverrides(q.get('eo'));
  for (const [k, f] of Object.entries(SCEN_KEYS)) if (q.has(k)) scen[f] = q.get(k);
  const out = {};
  if (Object.keys(settings).length) out.settings = settings;
  if (Object.keys(scen).length) out.scen = scen;
  if (q.has('in')) out.activeInterventions = decodeInterv(q.get('in'));
  return out;
}
