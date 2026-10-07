import {describe, expect, it} from 'vitest';
import {getDepartmentScoreReadiness, getAiScoreReadiness} from './scoreReadiness.js';

describe('score readiness', () => {
  it('does not treat Clinical AI alone as a Department baseline', () => {
    const result = getDepartmentScoreReadiness({annualKwh:0, annualStudies:0, gridReady:true, clinicalAiCount:2});
    expect(result.ready).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].key).toBe('equipment');
    expect(result.issues[0].detail).toContain('Clinical AI is configured');
  });

  it('accepts a complete Department energy + volume baseline', () => {
    expect(getDepartmentScoreReadiness({annualKwh:120000, annualStudies:45000, gridReady:true}).ready).toBe(true);
  });

  it('identifies volume separately when energy exists', () => {
    const result = getDepartmentScoreReadiness({annualKwh:120000, annualStudies:0, gridReady:true});
    expect(result.issues.map(x=>x.key)).toEqual(['volume']);
  });

  it('requires a custom-grid factor when custom grid mode is incomplete', () => {
    const result = getDepartmentScoreReadiness({annualKwh:120000, annualStudies:45000, gridReady:false});
    expect(result.ready).toBe(false);
    expect(result.issues.map(x=>x.key)).toEqual(['context']);
  });

  it('distinguishes an unchosen AI pathway from missing AI energy data', () => {
    expect(getAiScoreReadiness({hasData:false, hasPathway:false}).issues[0].key).toBe('pathway');
    expect(getAiScoreReadiness({hasData:false, hasPathway:true}).issues[0].key).toBe('energy');
    expect(getAiScoreReadiness({hasData:true, hasPathway:true}).ready).toBe(true);
  });
});
