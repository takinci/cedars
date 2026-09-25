export const CEDARS_ASSESSMENT_FORMAT = 'CEDARS';
export const CEDARS_SCHEMA_VERSION = 1;
export const CEDARS_LOCAL_STORAGE_KEY = 'cedars.assessment.v1';

const cloneJson = value => JSON.parse(JSON.stringify(value));

export function buildAssessmentSnapshot({
  settings,
  scen,
  deptLabel,
  ecoLabel,
  ecoLabelTouched = false,
  cloudTracker,
  provenance = {},
  disclosure = {},
  scenarioInterventions = [],
  savedAt = new Date().toISOString(),
  appVersion = 'web',
} = {}) {
  return {
    format: CEDARS_ASSESSMENT_FORMAT,
    schemaVersion: CEDARS_SCHEMA_VERSION,
    appVersion,
    savedAt,
    assessment: {
      settings: cloneJson(settings || {}),
      scen: cloneJson(scen || {}),
      deptLabel: cloneJson(deptLabel || {}),
      ecoLabel: cloneJson(ecoLabel || {}),
      ecoLabelTouched: !!ecoLabelTouched,
      cloudTracker: cloneJson(cloudTracker || {}),
      provenance: cloneJson(provenance || {}),
      disclosure: cloneJson(disclosure || {}),
      scenarioInterventions: cloneJson(scenarioInterventions || []),
    },
  };
}

export function validateAssessmentSnapshot(value) {
  if (!value || typeof value !== 'object') return {ok:false, error:'This file does not contain a CEDARS assessment.'};
  if (value.format !== CEDARS_ASSESSMENT_FORMAT) return {ok:false, error:'This is not a recognized CEDARS assessment file.'};
  if (value.schemaVersion !== CEDARS_SCHEMA_VERSION) {
    return {ok:false, error:`This CEDARS file uses schema version ${String(value.schemaVersion ?? 'unknown')}; this version of CEDARS supports schema version ${CEDARS_SCHEMA_VERSION}.`};
  }
  if (!value.assessment || typeof value.assessment !== 'object') return {ok:false, error:'The CEDARS assessment payload is missing.'};
  if (!value.assessment.settings || typeof value.assessment.settings !== 'object') return {ok:false, error:'The CEDARS settings payload is missing.'};
  return {ok:true, value};
}

export function parseAssessmentText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {ok:false, error:'The selected file is not valid JSON.'};
  }
  return validateAssessmentSnapshot(parsed);
}

export function saveAssessmentLocally(snapshot, storage) {
  const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!target) return {ok:false, error:'Browser storage is unavailable.'};
  try {
    target.setItem(CEDARS_LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    return {ok:true};
  } catch {
    return {ok:false, error:'CEDARS could not save this assessment in browser storage.'};
  }
}

export function loadLocalAssessment(storage) {
  const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!target) return {ok:false, error:'Browser storage is unavailable.'};
  try {
    const text = target.getItem(CEDARS_LOCAL_STORAGE_KEY);
    if (!text) return {ok:false, empty:true, error:'No locally saved CEDARS assessment was found.'};
    return parseAssessmentText(text);
  } catch {
    return {ok:false, error:'CEDARS could not read the locally saved assessment.'};
  }
}

export function clearLocalAssessment(storage) {
  const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!target) return;
  try { target.removeItem(CEDARS_LOCAL_STORAGE_KEY); } catch { /* best effort */ }
}

export function assessmentFilename(savedAt = new Date().toISOString()) {
  const day = String(savedAt).slice(0, 10) || 'assessment';
  return `cedars-assessment-${day}.cedars.json`;
}
