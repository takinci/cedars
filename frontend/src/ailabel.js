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
  'not-assessed':  {label: 'Not assessed',  short: 'N/A',       desc: 'this part of the footprint was outside the assessment boundary'},
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
  if (scen.trainDisclosed === 'no') return scen.trainMissingReason === 'notassessed' ? 'not-assessed' : 'not-disclosed';
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
  const trainRenewablePct = scen.trainingRenewablePct === '' || scen.trainingRenewablePct == null ? renewablePct : Math.min(100, Math.max(0, num(scen.trainingRenewablePct)));
  const inferRenewablePct = scen.inferenceRenewablePct === '' || scen.inferenceRenewablePct == null ? renewablePct : Math.min(100, Math.max(0, num(scen.inferenceRenewablePct)));
  const trainProv = trainingProvenance(scen);
  const inferProv = inferenceProvenance(scen, ai);

  // aiResultFor supplies context-specific effective intensities. Synthetic/legacy callers that do
  // not have those fields retain the historical shared-CI + renewable calculation.
  const ci = ai.inferenceRawCi ?? ai.cloudCi;
  const trainingEffectiveCi = ai.trainingCi ?? rnd(ai.cloudCi * (1 - trainRenewablePct / 100), 4);
  const inferenceEffectiveCi = ai.inferenceCi ?? rnd(ai.cloudCi * (1 - inferRenewablePct / 100), 4);
  const effectiveCi = inferenceEffectiveCi;
  const pue = ai.inferPue ?? ai.pue;

  // Unknown training is never treated as zero for grading. A zero-valued literature/default
  // training estimate is also not enough to claim lifecycle coverage.
  const missingTraining = trainProv === 'not-disclosed' || trainProv === 'not-assessed';
  const trainingAvailable = !missingTraining && num(ai.training?.kwhTotal) > 0;
  const energyPerRunKwh = trainingAvailable ? rnd(ai.training.kwhTotal, 2) : 0;
  const totalEnergyKwh = rnd(energyPerRunKwh * numRuns, 2);
  const totalGpuHours = trainingAvailable ? rnd(gpuCount * hoursPerRun * numRuns, 1) : 0;
  const trainCo2 = rnd(totalEnergyKwh * trainingEffectiveCi, 2);

  // Inference: the SAME figure the AI tab's hero uses.
  const tokenMode = ai.unit === 'tokens';
  const tokensPerStudy = tokenMode ? Math.round(ai.tokensPerStudy || 0) : 0;
  const inferKwhPerStudy = num(ai.inference?.kwhPerStudy);
  const inferStudies = num(scen.inferStudiesMonth);
  const inferMonthlyKwh = rnd(inferStudies * inferKwhPerStudy, 4);
  const inferCo2Month = rnd(inferMonthlyKwh * inferenceEffectiveCi, 4);

  // Water: explicit site WUE + grid water intensity when given; otherwise the screening factor,
  // or nothing if the user chose to report water as not assessed.
  const waterMode = scen.waterMode || 'screening';
  const wueOn = num(scen.wueOnsite), wueOff = num(scen.wueOffsite);
  const waterPerKwh = (wueOn > 0 || wueOff > 0) ? wueOn + wueOff : (waterMode === 'notassessed' ? 0 : waterPerKwhDefault);
  const waterProv = (wueOn > 0 || wueOff > 0) ? 'estimated' : (waterMode === 'notassessed' ? 'not-assessed' : 'screening');
  const waterLitres = Math.round(totalEnergyKwh * waterPerKwh);
  const waterPerStudyMl = rnd(inferKwhPerStudy * waterPerKwh * 1000, 2);

  // An overall CEDARS Score requires both a training footprint and an inference workload.
  // Partial assessments still report their measured/estimated components, but unknown ≠ zero.
  const deployMonths = Math.max(1, parseInt(scen.deployMonths) || 36);
  const lifetimeInferences = Math.round(inferStudies * deployMonths);
  const perInferCo2Kg = inferKwhPerStudy * inferenceEffectiveCi;
  const perInferCo2g = rnd(perInferCo2Kg * 1000, 3);
  const hasInferenceData = inferStudies > 0 && inferKwhPerStudy > 0;
  const trainPerStudyG = trainingAvailable && lifetimeInferences > 0 ? rnd(trainCo2 * 1000 / lifetimeInferences, 3) : null;
  const effectivePerStudyG = hasInferenceData && trainingAvailable ? rnd((trainPerStudyG ?? 0) + perInferCo2g, 3) : null;
  const breakEvenStudies = perInferCo2Kg > 0 && trainCo2 > 0 ? Math.round(trainCo2 / perInferCo2Kg) : null;
  const trainFlights = rnd(trainCo2 / 255, 2);
  const hasData = trainingAvailable || inferKwhPerStudy > 0;
  const gradeBasis = hasInferenceData && trainingAvailable ? 'amortised' : 'none';
  const scoreStatus = gradeBasis === 'amortised' ? 'complete'
    : (!trainingAvailable && inferKwhPerStudy > 0 ? 'training-unavailable'
      : (trainingAvailable && inferKwhPerStudy > 0 && !hasInferenceData ? 'deployment-workload-missing'
        : (inferKwhPerStudy <= 0 ? 'inference-missing' : 'not-ready')));
  const gradeValueG = gradeBasis === 'none' ? null : effectivePerStudyG;
  const graded = gradeValueG != null;
  const {score = null, rating = null} = graded ? scoreFn(gradeValueG) : {};
  const trainingStatusLabel = trainProv === 'not-assessed' ? 'Not assessed'
    : trainProv === 'not-disclosed' ? 'Not disclosed'
      : trainingAvailable ? 'Available' : 'Not available';
  const lifecycleCoverage = graded ? 'Training + inference'
    : scoreStatus === 'training-unavailable' ? `Inference assessed · training ${trainingStatusLabel.toLowerCase()}`
      : scoreStatus === 'deployment-workload-missing' ? 'Training + inference quantified · deployment workload missing'
        : 'Assessment incomplete';
  const tokenWorkload = scen.architecture === 'LLM / Agent (transformer)' || ['Report generation','Agentic workflow'].includes(scen.taskType);

  return {
    projectName: scen.projectName || 'New AI model',
    taskType: scen.taskType || opts.libTaskType || '—',
    architecture: scen.architecture || '—',
    paramsMillion: scen.paramsM ? `${num(scen.paramsM).toLocaleString()}M params` : '—',
    datasetSize: scen.datasetSize ? `${num(scen.datasetSize).toLocaleString()} ${tokenWorkload ? 'examples' : 'studies'}` : '—',
    epochs: scen.epochs ? num(scen.epochs) : null,
    precision: scen.precision || '—',
    inputResolution: !tokenWorkload && scen.resolution ? num(scen.resolution) : null,
    dim: !tokenWorkload ? (scen.dim || '—') : null,
    slices: !tokenWorkload && scen.slices ? num(scen.slices) : null,
    tokenWorkload,
    gpuHardware: trainingAvailable ? (gpuCount > 1 ? `${gpuCount}× ${gpuLabel}` : gpuLabel) : '—',
    totalGpuHours, numRuns, energyPerRunKwh, totalEnergyKwh, trainCo2,
    trainProv, trainTool: scen.trainTool || '', trainDisclosed: scen.trainDisclosed !== 'no',
    trainingAvailable, trainingStatusLabel,
    inferProv, waterProv, waterPerKwh,
    renewablePct: inferRenewablePct, cloudProvider: scen.inferenceProvider || scen.cloudProvider, ciSource,
    ci, effectiveCi, trainingEffectiveCi, inferenceEffectiveCi,
    trainingProvider: trainingAvailable ? (scen.trainingProvider || scen.cloudProvider) : '', inferenceProvider: scen.inferenceProvider || scen.cloudProvider,
    trainingRegion: trainingAvailable ? (scen.trainingRegion || scen.cloudRegion) : '', inferenceRegion: scen.inferenceRegion || scen.cloudRegion,
    waterLitres, waterPerStudyMl, pue,
    hasInference: hasInferenceData,
    inferMonthlyKwh, inferCo2Month, inferStudies: Math.round(inferStudies),
    energyMeasured: trainProv === 'measured',
    energyLive: true,
    vsReferenceRatio: trainingAvailable && ai.trainMeasured ? ai.training.vsReferenceRatio : null,
    kwhReference: trainingAvailable && ai.trainMeasured ? ai.training.kwhReference : null,
    deployMonths, lifetimeInferences, perInferCo2g, trainPerStudyG, effectivePerStudyG, breakEvenStudies, trainFlights,
    tokenMode, tokensPerStudy, inferKwhPerStudy: rnd(inferKwhPerStudy, 6),
    hasData, graded, gradeBasis, score, scoreStatus, lifecycleCoverage,
    leaves: rating?.leaves ?? 0,
    ratingLabel: rating?.label ?? (scoreStatus === 'training-unavailable' ? 'Overall score not assigned' : scoreStatus === 'deployment-workload-missing' ? 'Add deployment workload to grade' : hasData ? 'Complete the assessment to grade' : 'Select or describe a model to grade'),
    ratingColor: rating?.color ?? '#90a4ae', ratingBg: rating?.bg ?? '#f5f5f5', ratingDesc: rating?.desc ?? '',
    date: new Date().toISOString().slice(0, 7),
  };
}
