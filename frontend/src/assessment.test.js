import {describe, expect, it} from 'vitest';
import {
  CEDARS_LOCAL_STORAGE_KEY,
  buildAssessmentSnapshot,
  parseAssessmentText,
  saveAssessmentLocally,
  loadLocalAssessment,
  clearLocalAssessment,
  assessmentFilename,
} from './assessment.js';

function memoryStorage() {
  const data = new Map();
  return {
    setItem: (k,v) => data.set(k, String(v)),
    getItem: k => data.has(k) ? data.get(k) : null,
    removeItem: k => data.delete(k),
  };
}

describe('CEDARS assessment persistence', () => {
  it('builds and parses a versioned assessment snapshot', () => {
    const snapshot = buildAssessmentSnapshot({settings:{region:'Switzerland'}, scen:{modelKey:'cad'}, disclosure:{department:{score:72}}, scenarioInterventions:['Turn MRI/CT scanners off overnight'], savedAt:'2026-09-20T00:00:00.000Z'});
    expect(snapshot.format).toBe('CEDARS');
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.assessment.disclosure.department.score).toBe(72);
    expect(snapshot.assessment.scenarioInterventions).toEqual(['Turn MRI/CT scanners off overnight']);
    expect(parseAssessmentText(JSON.stringify(snapshot))).toEqual({ok:true, value:snapshot});
  });

  it('rejects unrelated JSON', () => {
    expect(parseAssessmentText('{"hello":"world"}').ok).toBe(false);
  });

  it('round-trips through local storage and clears cleanly', () => {
    const storage = memoryStorage();
    const snapshot = buildAssessmentSnapshot({settings:{region:'France'}});
    expect(saveAssessmentLocally(snapshot, storage).ok).toBe(true);
    expect(storage.getItem(CEDARS_LOCAL_STORAGE_KEY)).toContain('France');
    expect(loadLocalAssessment(storage).value.assessment.settings.region).toBe('France');
    clearLocalAssessment(storage);
    expect(loadLocalAssessment(storage).empty).toBe(true);
  });

  it('uses a portable .cedars.json filename', () => {
    expect(assessmentFilename('2026-09-20T14:00:00.000Z')).toBe('cedars-assessment-2026-09-20.cedars.json');
  });
});
