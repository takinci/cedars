// AI model record → AI Research Label.
//
// The AI pathway keeps ONE record (`scen`, see SCEN_DEFAULTS in urlstate.js). The AI tab, the
// benchmark, the Score & EcoLabel page and the Report form all read and write that record. The
// label is a *view* of it: `labelFromScen` exposes the record under the field names the label
// form has always used, and `computeAiLabel` grades it. Nothing here keeps a second copy, so
// the label can never drift from the model it describes.
//
// Every numeric line carries a provenance: 'measured' | 'estimated' | 'literature' | 'not-disclosed'.

const rnd = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const num = (v, fallback = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; };

export const PROVENANCE = {
  measured:        {label: 'Measured',      short: 'MEASURED',  desc: 'read from hardware sensors or a utility meter'},
  estimated:       {label: 'Estimated',     short: 'ESTIMATED', desc: 'derived from hardware specification, hours or token counts'},
  literature:      {label: 'Literature',    short: 'LIT.',      desc: 'library default anchored to a published reference'},
  'not-disclosed': {label: 'Not disclosed', short: 'N/D',       desc: 'the developer or vendor has not disclosed this value'},
};

// Fields of the record that the label form exposes under its historical names.
export const LABEL_TO_SCEN = {
  projectName: 'projectName', taskType: 'taskType', architecture: 'architecture',
  paramsMillion: 'paramsM', datasetSize: 'datasetSize',
  gpuModel: 'trainGpu', customTdpW: 'trainCustomTdpW', gpuCount: 'trainNumGpus',
  trainingHoursPerRun: 'trainHours', numRuns: 'numRuns', energyKwhPerRun: 'trainKwhMeasured',
  trainTool: 'trainTool', trainDisclosed: 'trainDisclosed',
  cloudProvider: 'cloudProvider', cloudRegion: 'cloudRegion', customPue: 'customPue',
  renewablePct: 'renewablePct', inferStudiesMonth: 'inferStudiesMonth',
  inferKwhPerStudy: 'inferKwh', whPer1kTokens: 'whPer1kTokens', callsPerTask: 'callsPerTask',
  tokensPerCall: 'tokensPerCall', deployMonths: 'deployMonths',
  wueOnsite: 'wueOnsite', wueOffsite: 'wueOffsite', waterMode: 'waterMode',
};
export const SCEN_TO_LABEL = Object.fromEntries(Object.entries(LABEL_TO_SCEN).map(([l, s]) => [s, l]));

export function trainingProvenance(scen) {
  if (scen.trainDisclosed === 'no') return 'not-disclosed';
  if (num(scen.trainKwhMeasured) > 0) return 'measured';
  if (scen.trainGpu && num(scen.trainHours) > 0) return 'estimated';
  return 'literature';
}
export function inferenceProvenance(scen, ai) {
  if (num(scen.inferKwh) > 0) return 'measured';
  if (ai?.unit === 'tokens') return num(scen.tokensPerCall) > 0 || num(scen.whPer1kTokens) > 0 ? 'estimated' : 'literature';
  return num(scen.inferSec) > 0 ? 'estimated' : 'literature';
}

// The record under the label form's field names (strings, as the form expects).
export function labelFromScen(scen, ai, libTaskType = '') {
  const tokenMode = ai?.unit === 'tokens';
  return {
    projectName: scen.projectName || '',
    taskType: scen.taskType || libTaskType || 'Classification',
    architecture: scen.architecture || '',
    paramsMillion: scen.paramsM || '',
    datasetSize: scen.datasetSize || '',
    gpuModel: scen.trainGpu || '',
    customTdpW: scen.trainCustomTdpW || '',
    gpuCount: scen.trainNumGpus || '1',
    trainingHoursPerRun: scen.trainHours || '',
    numRuns: scen.numRuns || '1',
    energyMeasured: num(scen.trainKwhMeasured) > 0,
    energyKwhPerRun: scen.trainKwhMeasured || '',
    trainTool: scen.trainTool || '',
    trainDisclosed: scen.trainDisclosed || 'yes',
    cloudProvider: scen.cloudProvider,
    cloudRegion: scen.cloudRegion || '',
    customPue: scen.customPue || '',
    renewablePct: scen.renewablePct || '0',
    inferStudiesMonth: scen.inferStudiesMonth || '',
    inferMode: tokenMode ? 'tokens' : 'kwh',
    inferKwhPerStudy: scen.inferKwh || '',
    whPer1kTokens: scen.whPer1kTokens || '',
    callsPerTask: scen.callsPerTask || '1',
    tokensPerCall: scen.tokensPerCall || '',
    deployMonths: scen.deployMonths || '36',
    wueOnsite: scen.wueOnsite || '',
    wueOffsite: scen.wueOffsite || '',
    waterMode: scen.waterMode || 'screening',
  };
}

// Old save files (schema 1, before the merge) carried a separately-edited `ecoLabel` object.
// Fold its fields back into the record so nothing a user typed is lost on restore.
export function migrateLegacyLabel(scenIn, legacyLabel, touched) {
  if (!touched || !legacyLabel) return scenIn;
  const out = {...scenIn};
  for (const [lkey, skey] of Object.entries(LABEL_TO_SCEN)) {
    if (lkey === 'energyKwhPerRun' && !legacyLabel.energyMeasured) continue;
    const v = legacyLabel[lkey];
    if (v !== undefined && v !== null && v !== '') out[skey] = String(v);
  }
  return out;
}

/**
 * Grade the record.
 * @param scen   the AI model record
 * @param ai     the engine result for it (aiResultFor): training.kwhTotal (per run), inference.kwhPerStudy,
 *               cloudCi, pue, unit, tokensPerStudy, trainMeasured, training.vsReferenceRatio, training.kwhReference
 * @param opts   { gpuLabel, ciSource, waterPerKwhDefault, score(gramsPerStudy) → {score, rating} }
 */
export function computeAiLabel(scen, ai, opts) {
  const {gpuLabel = '—', ciSource = '', waterPerKwhDefault = 1.8, score: scoreFn} = opts;
  const gpuCount = Math.max(1, parseInt(scen.trainNumGpus) || 1);
  const hoursPerRun = num(scen.trainHours);
  const numRuns = Math.max(1, parseInt(scen.numRuns) || 1);
  const renewablePct = Math.min(100, Math.max(0, num(scen.renewablePct)));
  const trainProv = trainingProvenance(scen);
  const inferProv = inferenceProvenance(scen, ai);

  const ci = ai.cloudCi;
  const effectiveCi = rnd(ci * (1 - renewablePct / 100), 4);
  const pue = ai.pue;

  // Training: the engine already applied the measured-kWh / GPU-hours / literature precedence.
  const energyPerRunKwh = trainProv === 'not-disclosed' ? 0 : rnd(ai.training.kwhTotal, 2);
  const totalEnergyKwh = rnd(energyPerRunKwh * numRuns, 2);
  const totalGpuHours = rnd(gpuCount * hoursPerRun * numRuns, 1);
  const trainCo2 = rnd(totalEnergyKwh * effectiveCi, 2);

  // Inference: the SAME figure the AI tab's hero uses.
  const tokenMode = ai.unit === 'tokens';
  const tokensPerStudy = tokenMode ? Math.round(ai.tokensPerStudy || 0) : 0;
  const inferKwhPerStudy = num(ai.inference?.kwhPerStudy);
  const inferStudies = num(scen.inferStudiesMonth);
  const inferMonthlyKwh = rnd(inferStudies * inferKwhPerStudy, 4);
  const inferCo2Month = rnd(inferMonthlyKwh * effectiveCi, 4);

  // Water: explicit site WUE + grid water intensity when given; otherwise the screening factor,
  // or nothing if the user chose to report water as not assessed.
  const waterMode = scen.waterMode || 'screening';
  const wueOn = num(scen.wueOnsite), wueOff = num(scen.wueOffsite);
  const waterPerKwh = (wueOn > 0 || wueOff > 0) ? wueOn + wueOff : (waterMode === 'notassessed' ? 0 : waterPerKwhDefault);
  const waterProv = (wueOn > 0 || wueOff > 0) ? 'estimated' : (waterMode === 'notassessed' ? 'not-disclosed' : 'screening');
  const waterLitres = Math.round(totalEnergyKwh * waterPerKwh);
  const waterPerStudyMl = rnd(inferKwhPerStudy * waterPerKwh * 1000, 2);

  // Two-phase footprint: training is one-time, inference is per study; grade the amortised sum.
  const deployMonths = Math.max(1, parseInt(scen.deployMonths) || 36);
  const lifetimeInferences = Math.round(inferStudies * deployMonths);
  const perInferCo2Kg = inferKwhPerStudy * effectiveCi;
  const perInferCo2g = rnd(perInferCo2Kg * 1000, 3);
  const hasInferenceData = inferStudies > 0 && inferKwhPerStudy > 0;
  const trainPerStudyG = lifetimeInferences > 0 ? rnd(trainCo2 * 1000 / lifetimeInferences, 3) : null;
  const effectivePerStudyG = hasInferenceData ? rnd((trainPerStudyG ?? 0) + perInferCo2g, 3)
    : (inferKwhPerStudy > 0 ? perInferCo2g : null);
  const breakEvenStudies = perInferCo2Kg > 0 && trainCo2 > 0 ? Math.round(trainCo2 / perInferCo2Kg) : null;
  const trainFlights = rnd(trainCo2 / 255, 2);
  const hasData = totalEnergyKwh > 0 || inferKwhPerStudy > 0;
  const gradeBasis = hasInferenceData && trainProv !== 'not-disclosed' ? 'amortised' : (inferKwhPerStudy > 0 ? 'inference' : 'none');
  const gradeValueG = gradeBasis === 'none' ? null : effectivePerStudyG;
  const graded = gradeValueG != null;
  const {score = null, rating = null} = graded ? scoreFn(gradeValueG) : {};

  return {
    projectName: scen.projectName || 'Untitled project',
    taskType: scen.taskType || opts.libTaskType || '—',
    architecture: scen.architecture || '—',
    paramsMillion: scen.paramsM ? `${num(scen.paramsM).toLocaleString()}M params` : '—',
    datasetSize: scen.datasetSize ? `${num(scen.datasetSize).toLocaleString()} studies` : '—',
    gpuHardware: gpuCount > 1 ? `${gpuCount}× ${gpuLabel}` : gpuLabel,
    totalGpuHours, numRuns, energyPerRunKwh, totalEnergyKwh, trainCo2,
    trainProv, trainTool: scen.trainTool || '', trainDisclosed: trainProv !== 'not-disclosed',
    inferProv, waterProv, waterPerKwh,
    renewablePct, cloudProvider: scen.cloudProvider, ciSource,
    ci, effectiveCi, waterLitres, waterPerStudyMl, pue,
    hasInference: hasInferenceData,
    inferMonthlyKwh, inferCo2Month, inferStudies: Math.round(inferStudies),
    energyMeasured: trainProv === 'measured',
    energyLive: true,
    vsReferenceRatio: ai.trainMeasured ? ai.training.vsReferenceRatio : null,
    kwhReference: ai.trainMeasured ? ai.training.kwhReference : null,
    deployMonths, lifetimeInferences, perInferCo2g, trainPerStudyG, effectivePerStudyG, breakEvenStudies, trainFlights,
    tokenMode, tokensPerStudy, inferKwhPerStudy: rnd(inferKwhPerStudy, 6),
    hasData, graded, gradeBasis, score,
    leaves: rating?.leaves ?? 0,
    ratingLabel: rating?.label ?? (hasData ? 'Add inference to grade' : 'Select or describe a model to grade'),
    ratingColor: rating?.color ?? '#90a4ae', ratingBg: rating?.bg ?? '#f5f5f5', ratingDesc: rating?.desc ?? '',
    date: new Date().toISOString().slice(0, 7),
  };
}
