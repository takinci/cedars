// Reference tests for the AI model record → AI Research Label (ailabel.js).
// Fixed inputs → known outputs. If a change here is intentional, update the pinned numbers in
// the same commit and say why in CHANGELOG.md.
import { describe, it, expect } from 'vitest';
import {
  labelFromScen, computeAiLabel, trainingProvenance, inferenceProvenance, migrateLegacyLabel, LABEL_TO_SCEN,
} from './ailabel.js';
import { cedarsScore, cedarsRating, CEDARS_AIUSE_LO, CEDARS_AIUSE_HI } from './calc.js';
import { SCEN_DEFAULTS, encodeConfig, decodeConfig } from './urlstate.js';

const score = g => { const s = cedarsScore(g, CEDARS_AIUSE_LO, CEDARS_AIUSE_HI); return {score: s, rating: cedarsRating(s)}; };
const opts = {gpuLabel: 'NVIDIA A100 (80GB SXM4)', ciSource: 'On-premise (Switzerland)', waterPerKwhDefault: 1.8, score};

// A synthetic engine result shaped like aiResultFor()'s output for a small vision model.
const aiVision = {
  unit: 'gpu', cloudCi: 0.10, pue: 1.5, trainMeasured: false,
  training: {kwhTotal: 41.6, vsReferenceRatio: 1, kwhReference: 41.6},
  inference: {kwhPerStudy: 0.00042},
};
// …and for a token-driven agentic model.
const aiAgent = {
  unit: 'tokens', cloudCi: 0.379, pue: 1.15, trainMeasured: false, tokensPerStudy: 40000,
  training: {kwhTotal: 0, vsReferenceRatio: null, kwhReference: null},
  inference: {kwhPerStudy: 0.0184},
};

describe('provenance', () => {
  it('training: literature by default, estimated with GPU×hours, measured with kWh, not-disclosed when flagged', () => {
    expect(trainingProvenance(SCEN_DEFAULTS)).toBe('literature');
    expect(trainingProvenance({...SCEN_DEFAULTS, trainGpu: 'NVIDIA A100 (80GB SXM4)', trainHours: '18'})).toBe('estimated');
    expect(trainingProvenance({...SCEN_DEFAULTS, trainGpu: 'NVIDIA A100 (80GB SXM4)', trainHours: '18', trainKwhMeasured: '41.6'})).toBe('measured');
    expect(trainingProvenance({...SCEN_DEFAULTS, trainKwhMeasured: '41.6', trainDisclosed: 'no'})).toBe('not-disclosed');
  });
  it('inference: measured kWh wins; token models are estimated once tokens are typed', () => {
    expect(inferenceProvenance(SCEN_DEFAULTS, aiVision)).toBe('literature');
    expect(inferenceProvenance({...SCEN_DEFAULTS, inferKwh: '0.0004'}, aiVision)).toBe('measured');
    expect(inferenceProvenance(SCEN_DEFAULTS, aiAgent)).toBe('literature');
    expect(inferenceProvenance({...SCEN_DEFAULTS, tokensPerCall: '4000'}, aiAgent)).toBe('estimated');
  });
});

describe('labelFromScen — the label is a view of the record', () => {
  it('exposes every record field under the label name and round-trips through LABEL_TO_SCEN', () => {
    const scen = {...SCEN_DEFAULTS, paramsM: '25', trainGpu: 'NVIDIA H100', trainHours: '18', numRuns: '4', inferStudiesMonth: '2500'};
    const label = labelFromScen(scen, aiVision, 'Classification');
    expect(label.paramsMillion).toBe('25');
    expect(label.gpuModel).toBe('NVIDIA H100');
    expect(label.trainingHoursPerRun).toBe('18');
    expect(label.numRuns).toBe('4');
    expect(label.inferStudiesMonth).toBe('2500');
    expect(label.inferMode).toBe('kwh');
    expect(labelFromScen(scen, aiAgent).inferMode).toBe('tokens');
    for (const [lkey, skey] of Object.entries(LABEL_TO_SCEN)) {
      expect(skey in SCEN_DEFAULTS, `${lkey} → ${skey} must exist on the record`).toBe(true);
    }
  });
  it('task type falls back to the library family', () => {
    expect(labelFromScen(SCEN_DEFAULTS, aiVision, 'Classification').taskType).toBe('Classification');
    expect(labelFromScen({...SCEN_DEFAULTS, taskType: 'Triage'}, aiVision, 'Classification').taskType).toBe('Triage');
  });
});

describe('computeAiLabel — pinned grades', () => {
  it('inference-only basis when no deployment volume: grade = per-study inference carbon (same as the AI tab hero)', () => {
    const d = computeAiLabel(SCEN_DEFAULTS, aiVision, opts);
    expect(d.gradeBasis).toBe('inference');
    expect(d.perInferCo2g).toBe(0.042);                 // 0.00042 kWh × 0.10 kg/kWh × 1000
    expect(d.score).toBe(score(0.042).score);
    expect(d.totalEnergyKwh).toBe(41.6);
    expect(d.trainCo2).toBe(4.16);
    expect(d.trainProv).toBe('literature');
    expect(d.waterProv).toBe('screening');
    expect(d.waterLitres).toBe(75);                      // 41.6 kWh × 1.8 L/kWh, rounded
  });
  it('amortised basis once studies/month is set; runs multiply training', () => {
    const d = computeAiLabel({...SCEN_DEFAULTS, inferStudiesMonth: '2500', numRuns: '4', deployMonths: '36'}, aiVision, opts);
    expect(d.gradeBasis).toBe('amortised');
    expect(d.totalEnergyKwh).toBe(166.4);
    expect(d.trainCo2).toBe(16.64);
    expect(d.lifetimeInferences).toBe(90000);
    expect(d.trainPerStudyG).toBe(0.185);               // 16.64 kg → 16,640 g / 90,000
    expect(d.effectivePerStudyG).toBe(0.227);           // 0.185 + 0.042
    expect(d.score).toBe(score(0.227).score);
    expect(d.breakEvenStudies).toBe(Math.round(16.64 / (0.00042 * 0.10)));
  });
  it('renewable % lowers the effective carbon intensity', () => {
    const d = computeAiLabel({...SCEN_DEFAULTS, renewablePct: '50'}, aiVision, opts);
    expect(d.effectiveCi).toBe(0.05);
    expect(d.perInferCo2g).toBe(0.021);
  });
  it('uses separate training and inference carbon intensities when supplied by the engine', () => {
    const split = {...aiVision, trainingCi:0.02, inferenceCi:0.30, inferenceRawCi:0.30, trainPue:1.0, inferPue:1.2};
    const d = computeAiLabel({...SCEN_DEFAULTS, inferStudiesMonth:'1000'}, split, opts);
    expect(d.trainCo2).toBe(0.83);
    expect(d.perInferCo2g).toBe(0.126);
    expect(d.trainingEffectiveCi).toBe(0.02);
    expect(d.inferenceEffectiveCi).toBe(0.30);
  });
  it('training not disclosed by vendor: no training line, inference-only grade, stated as such', () => {
    const d = computeAiLabel({...SCEN_DEFAULTS, trainDisclosed: 'no', inferStudiesMonth: '2500'}, aiVision, opts);
    expect(d.trainDisclosed).toBe(false);
    expect(d.trainProv).toBe('not-disclosed');
    expect(d.totalEnergyKwh).toBe(0);
    expect(d.gradeBasis).toBe('inference');
    expect(d.breakEvenStudies).toBeNull();
  });
  it('token-driven model: tokens/study and per-study carbon come from the engine', () => {
    const d = computeAiLabel({...SCEN_DEFAULTS, inferStudiesMonth: '1000'}, aiAgent, opts);
    expect(d.tokenMode).toBe(true);
    expect(d.tokensPerStudy).toBe(40000);
    expect(d.perInferCo2g).toBe(6.974);                 // 0.0184 × 0.379 × 1000
    expect(d.inferMonthlyKwh).toBe(18.4);
    expect(d.gradeBasis).toBe('amortised');             // volume given; training kWh is 0 so it adds nothing
    expect(d.trainPerStudyG).toBe(0);
    expect(d.effectivePerStudyG).toBe(6.974);
  });
  it('water: explicit site + grid intensity replaces the screening factor; "not assessed" reports nothing', () => {
    const d1 = computeAiLabel({...SCEN_DEFAULTS, wueOnsite: '0.45', wueOffsite: '1.2'}, aiVision, opts);
    expect(d1.waterProv).toBe('estimated');
    expect(d1.waterPerKwh).toBe(1.65);
    expect(d1.waterLitres).toBe(69);                     // 41.6 × 1.65 = 68.64
    const d2 = computeAiLabel({...SCEN_DEFAULTS, waterMode: 'notassessed'}, aiVision, opts);
    expect(d2.waterProv).toBe('not-disclosed');
    expect(d2.waterLitres).toBe(0);
  });
});

describe('legacy save files', () => {
  it('folds a separately-edited label back into the record only when it had been touched', () => {
    const legacy = {paramsMillion: '19', gpuModel: 'NVIDIA H100', gpuCount: '4', trainingHoursPerRun: '12',
      numRuns: '3', energyMeasured: true, energyKwhPerRun: '24', inferStudiesMonth: '1200', deployMonths: '24'};
    const untouched = migrateLegacyLabel({...SCEN_DEFAULTS}, legacy, false);
    expect(untouched).toEqual({...SCEN_DEFAULTS});
    const merged = migrateLegacyLabel({...SCEN_DEFAULTS}, legacy, true);
    expect(merged.paramsM).toBe('19');
    expect(merged.trainGpu).toBe('NVIDIA H100');
    expect(merged.trainNumGpus).toBe('4');
    expect(merged.trainHours).toBe('12');
    expect(merged.numRuns).toBe('3');
    expect(merged.trainKwhMeasured).toBe('24');
    expect(merged.inferStudiesMonth).toBe('1200');
  });
  it('a measured kWh in a legacy label is ignored unless the measured box was ticked', () => {
    const merged = migrateLegacyLabel({...SCEN_DEFAULTS}, {energyMeasured: false, energyKwhPerRun: '24'}, true);
    expect(merged.trainKwhMeasured).toBe('');
  });
});

describe('URL round-trip of the merged record fields', () => {
  it('encodes only non-default record fields and restores them exactly', () => {
    const scen = {...SCEN_DEFAULTS, numRuns: '4', inferStudiesMonth: '2500', trainKwhMeasured: '41.6', trainDisclosed: 'no',
      trainTool: 'CodeCarbon', taskType: 'Triage', wueOnsite: '0.45', wueOffsite: '1.2', waterMode: 'notassessed',
      aiRoute: 'own', ownMode: 'measure'};
    const q = encodeConfig({scen});
    expect(q).not.toContain('projectName');
    const back = {...SCEN_DEFAULTS, ...decodeConfig(q).scen};
    expect(back).toEqual(scen);
  });
  it('projectName never enters the shareable link', () => {
    expect(encodeConfig({scen: {...SCEN_DEFAULTS, projectName: 'Secret Hospital Model'}})).toBe('');
  });
});
