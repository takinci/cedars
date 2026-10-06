const cloneJson = value => JSON.parse(JSON.stringify(value));

const text = value => value == null ? '' : String(value);

export function performanceMetricFromScen(scen = {}) {
  return {
    id: 'primary',
    metric: text(scen.accuracyMetric || 'Performance'),
    value: text(scen.accuracyPct),
    unit: text(scen.performanceUnit || 'percent'),
    direction: scen.performanceDirection === 'lower' ? 'lower' : 'higher',
    validationContext: text(scen.performanceValidationContext),
    provenance: text(scen.performanceSource),
    primary: true,
  };
}

export function modelRecordFromScen(scen = {}) {
  const provider = scen.cloudProvider || 'Local compute';
  const region = scen.cloudRegion || '';
  const pue = text(scen.customPue);
  const renewablePct = text(scen.renewablePct || '0');
  return {
    id: text(scen.modelId || 'model-primary'),
    name: text(scen.projectName || 'Untitled model'),
    taskType: text(scen.taskType),
    // Keep the complete calculator configuration with the canonical record. Department deployments
    // reference this record by id; they no longer copy model energy/hardware fields into each use.
    config: cloneJson(scen),
    specification: {
      modelKey: text(scen.modelKey), architecture: text(scen.architecture), precision: text(scen.precision),
      parametersMillions: text(scen.paramsM), dimensionality: text(scen.dim), resolution: text(scen.resolution), slices: text(scen.slices),
    },
    training: {
      gpu: text(scen.trainGpu), gpuCount: text(scen.trainNumGpus), hours: text(scen.trainHours),
      measuredKwh: text(scen.trainKwhMeasured), disclosed: scen.trainDisclosed !== 'no', tool: text(scen.trainTool),
    },
    inference: {
      measuredKwhPerStudy: text(scen.inferKwh), whPer1kTokens: text(scen.whPer1kTokens),
      callsPerTask: text(scen.callsPerTask), tokensPerCall: text(scen.tokensPerCall),
    },
    performance: [performanceMetricFromScen(scen)],
    contexts: {
      training: {
        provider: scen.trainingProvider || provider, region: scen.trainingRegion || region,
        pue: text(scen.trainingPue || pue), renewablePct: text(scen.trainingRenewablePct || renewablePct),
        provenance: scen.trainingProvider || scen.trainingRegion || scen.trainingPue ? 'explicit' : 'legacy-shared',
      },
      inference: {
        provider: scen.inferenceProvider || provider, region: scen.inferenceRegion || region,
        pue: text(scen.inferencePue || pue), renewablePct: text(scen.inferenceRenewablePct || renewablePct),
        provenance: scen.inferenceProvider || scen.inferenceRegion || scen.inferencePue ? 'explicit' : 'legacy-shared',
      },
    },
  };
}

// Rehydrate an editable calculator record from a canonical saved model. Schema-v2 files created
// before canonical configs were stored still reconstruct cleanly from their normalized fields.
export function modelScenFromRecord(record = {}, defaults = {}) {
  if (record.config && typeof record.config === 'object') return {...defaults, ...cloneJson(record.config), modelId:record.id || record.config.modelId};
  const perf = Array.isArray(record.performance) ? (record.performance.find(p=>p.primary) || record.performance[0] || {}) : {};
  const spec = record.specification || {}, train = record.training || {}, infer = record.inference || {};
  const tc = record.contexts?.training || {}, ic = record.contexts?.inference || {};
  return {
    ...defaults,
    modelId: text(record.id || defaults.modelId), projectName: text(record.name || defaults.projectName), taskType: text(record.taskType || defaults.taskType),
    modelKey: text(spec.modelKey || defaults.modelKey), architecture: text(spec.architecture || defaults.architecture), precision: text(spec.precision || defaults.precision),
    paramsM: text(spec.parametersMillions || defaults.paramsM), dim: text(spec.dimensionality || defaults.dim), resolution: text(spec.resolution || defaults.resolution), slices: text(spec.slices || defaults.slices),
    trainGpu: text(train.gpu || defaults.trainGpu), trainNumGpus: text(train.gpuCount || defaults.trainNumGpus), trainHours: text(train.hours || defaults.trainHours),
    trainKwhMeasured: text(train.measuredKwh || defaults.trainKwhMeasured), trainDisclosed: train.disclosed === false ? 'no' : (defaults.trainDisclosed || 'yes'), trainTool: text(train.tool || defaults.trainTool),
    inferKwh: text(infer.measuredKwhPerStudy || defaults.inferKwh), whPer1kTokens: text(infer.whPer1kTokens || defaults.whPer1kTokens), callsPerTask: text(infer.callsPerTask || defaults.callsPerTask), tokensPerCall: text(infer.tokensPerCall || defaults.tokensPerCall),
    accuracyMetric: text(perf.metric || defaults.accuracyMetric), accuracyPct: text(perf.value || defaults.accuracyPct), performanceUnit: text(perf.unit || defaults.performanceUnit),
    performanceDirection: perf.direction === 'lower' ? 'lower' : (defaults.performanceDirection || 'higher'), performanceValidationContext: text(perf.validationContext || defaults.performanceValidationContext), performanceSource: text(perf.provenance || defaults.performanceSource),
    cloudProvider: text(ic.provider || tc.provider || defaults.cloudProvider), cloudRegion: text(ic.region || tc.region || defaults.cloudRegion), customPue: text(ic.pue || tc.pue || defaults.customPue), renewablePct: text(ic.renewablePct || defaults.renewablePct),
    trainingProvider: text(tc.provider || defaults.trainingProvider), trainingRegion: text(tc.region || defaults.trainingRegion), trainingPue: text(tc.pue || defaults.trainingPue), trainingRenewablePct: text(tc.renewablePct || defaults.trainingRenewablePct),
    inferenceProvider: text(ic.provider || defaults.inferenceProvider), inferenceRegion: text(ic.region || defaults.inferenceRegion), inferencePue: text(ic.pue || defaults.inferencePue), inferenceRenewablePct: text(ic.renewablePct || defaults.inferenceRenewablePct),
  };
}

export function deploymentFromTool(tool = {}, index = 0) {
  const id = text(tool.id || `deployment-${index + 1}`);
  return {
    id,
    modelId: text(tool.modelId || `legacy-model-${id}`),
    label: text(tool.label),
    useSharePct: text(tool.studiesShare == null ? '100' : tool.studiesShare),
    deploymentMonths: text(tool.deployMonths || '36'),
    trainingBoundary: tool.trainingBoundary === 'allocated-local' ? 'allocated-local' : 'upstream',
    trainingAllocationPct: text(tool.trainingAllocationPct == null ? '100' : tool.trainingAllocationPct),
    embodiedBoundary: tool.embodiedBoundary === 'allocated-local' ? 'allocated-local' : 'upstream',
    embodiedAllocationPct: text(tool.embodiedAllocationPct == null ? '100' : tool.embodiedAllocationPct),
    inference: {kwhPerStudy: text(tool.inferKwhPerStudy)},
    clinicalEffects: {
      basis: text(tool.effectBasis || 'none'),
      lowValueReductionPct: text(tool.lowValueReductPct || '0'),
      scanTimeReductionPct: text(tool.scanTimeReductPct || '0'),
      contrastReductionPct: text(tool.contrastReductPct || '0'),
    },
    // Retained only for migration of older saves; new deployments inherit these from aiModels.
    legacy: {trainingKwh: text(tool.trainKwhTotal), embodiedKgCo2e: text(tool.embCo2Kg)},
  };
}

export function toolFromDeployment(deployment = {}, index = 0) {
  return {
    id: deployment.id || `deployment-${index + 1}`,
    modelId: text(deployment.modelId), label: text(deployment.label),
    studiesShare: text(deployment.useSharePct == null ? '100' : deployment.useSharePct),
    deployMonths: text(deployment.deploymentMonths || '36'),
    trainingBoundary: deployment.trainingBoundary === 'allocated-local' ? 'allocated-local' : 'upstream',
    trainingAllocationPct: text(deployment.trainingAllocationPct == null ? '100' : deployment.trainingAllocationPct),
    embodiedBoundary: deployment.embodiedBoundary === 'allocated-local' ? 'allocated-local' : 'upstream',
    embodiedAllocationPct: text(deployment.embodiedAllocationPct == null ? '100' : deployment.embodiedAllocationPct),
    effectBasis: text(deployment.clinicalEffects?.basis || 'none'),
    lowValueReductPct: text(deployment.clinicalEffects?.lowValueReductionPct || '0'),
    scanTimeReductPct: text(deployment.clinicalEffects?.scanTimeReductionPct || '0'),
    contrastReductPct: text(deployment.clinicalEffects?.contrastReductionPct || '0'),
    // Preserve legacy fallbacks so old files remain computable when their model record is incomplete.
    inferKwhPerStudy: text(deployment.inference?.kwhPerStudy), trainKwhTotal: text(deployment.legacy?.trainingKwh), embCo2Kg: text(deployment.legacy?.embodiedKgCo2e),
  };
}

export function buildAiState(scen = {}, aiTools = [], suppliedModels = null, suppliedDeployments = null) {
  const model = modelRecordFromScen(scen);
  const aiModels = suppliedModels && typeof suppliedModels === 'object' ? cloneJson(suppliedModels) : {};
  aiModels[model.id] = model;
  const aiDeployments = Array.isArray(suppliedDeployments)
    ? suppliedDeployments.map((d,i) => d?.useSharePct != null ? cloneJson(d) : deploymentFromTool(d,i))
    : (aiTools || []).map(deploymentFromTool);
  aiDeployments.forEach((deployment, index) => {
    if (aiModels[deployment.modelId]) return;
    const source = (aiTools || [])[index] || {};
    aiModels[deployment.modelId] = {
      id: deployment.modelId, name: text(source.label || 'Deployed AI model'), taskType: '', config:null,
      specification: {}, training: {measuredKwh:text(source.trainKwhTotal)},
      inference: {measuredKwhPerStudy:text(source.inferKwhPerStudy)}, performance: [], contexts: {},
      legacyDeploymentOnly: true,
    };
  });
  return {activeAiModelId: model.id, aiModels, aiDeployments};
}

export function migrateLegacyAiState(assessment = {}) {
  const out = cloneJson(assessment || {});
  if (out.aiModels && out.activeAiModelId && Array.isArray(out.aiDeployments)) return out;
  return {...out, ...buildAiState(out.scen || {}, out.deptLabel?.aiTools || [])};
}
