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

export function deploymentFromTool(tool = {}, index = 0) {
  const id = text(tool.id || `deployment-${index + 1}`);
  return {
    id,
    modelId: text(tool.modelId || `legacy-model-${id}`),
    label: text(tool.label),
    useSharePct: text(tool.studiesShare == null ? '100' : tool.studiesShare),
    deploymentMonths: text(tool.deployMonths || '36'),
    trainingBoundary: tool.trainingBoundary === 'allocated-local' ? 'allocated-local' : 'upstream',
    inference: {kwhPerStudy: text(tool.inferKwhPerStudy)},
    clinicalEffects: {
      lowValueReductionPct: text(tool.lowValueReductPct || '0'),
      scanTimeReductionPct: text(tool.scanTimeReductPct || '0'),
      contrastReductionPct: text(tool.contrastReductPct || '0'),
    },
    legacy: {trainingKwh: text(tool.trainKwhTotal), embodiedKgCo2e: text(tool.embCo2Kg)},
  };
}

export function buildAiState(scen = {}, aiTools = []) {
  const model = modelRecordFromScen(scen);
  const aiModels = {[model.id]: model};
  const aiDeployments = (aiTools || []).map(deploymentFromTool);
  aiDeployments.forEach((deployment, index) => {
    if (aiModels[deployment.modelId]) return;
    const source = (aiTools || [])[index] || {};
    aiModels[deployment.modelId] = {
      id: deployment.modelId, name: text(source.label || 'Deployed AI model'), taskType: '',
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
