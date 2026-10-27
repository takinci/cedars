import {describe, expect, it} from 'vitest';
import {
  applyClinicalEffectEvidence,
  clinicalEffectBasisLabel,
  isCreditableClinicalEffectBasis,
  normalizeClinicalEffectBasis,
  systemEffectsStatus,
} from './clinicalEffects.js';

describe('clinical-effect evidence policy', () => {
  it('credits only observed-local and validated-local effects to the current footprint', () => {
    expect(isCreditableClinicalEffectBasis('observed-local')).toBe(true);
    expect(isCreditableClinicalEffectBasis('validated-local')).toBe(true);
    expect(isCreditableClinicalEffectBasis('published')).toBe(false);
    expect(isCreditableClinicalEffectBasis('scenario')).toBe(false);
    expect(isCreditableClinicalEffectBasis('none')).toBe(false);
  });

  it('keeps published/scenario savings visible but gives them zero current-footprint credit', () => {
    const published = applyClinicalEffectEvidence({basis:'published', savedKwh:100, carbonIntensity:0.4});
    expect(published).toMatchObject({scenarioKwh:100, credited:false, creditedKwh:0, creditedCo2Kg:0});
    const scenario = applyClinicalEffectEvidence({basis:'scenario', savedKwh:100, carbonIntensity:0.4});
    expect(scenario).toMatchObject({scenarioKwh:100, credited:false, creditedKwh:0, creditedCo2Kg:0});
  });

  it('credits eligible local evidence and sanitizes invalid inputs', () => {
    const local = applyClinicalEffectEvidence({basis:'validated-local', savedKwh:100, carbonIntensity:0.4});
    expect(local).toMatchObject({credited:true, creditedKwh:100, creditedCo2Kg:40});
    const invalid = applyClinicalEffectEvidence({basis:'bogus', savedKwh:-5, carbonIntensity:Infinity});
    expect(invalid).toMatchObject({basis:'none', credited:false, scenarioKwh:0, creditedKwh:0, creditedCo2Kg:0});
    expect(normalizeClinicalEffectBasis('bogus')).toBe('none');
    expect(clinicalEffectBasisLabel('published')).toBe('Published external evidence');
  });

  it('does not manufacture a categorical rebound-risk score', () => {
    expect(systemEffectsStatus({scanTimeReductionPct:50})).toBe('Not quantified');
    expect(systemEffectsStatus({lowValueReductionPct:5})).toBe('Not quantified');
    expect(systemEffectsStatus({})).toBe('Not assessed');
  });
});
