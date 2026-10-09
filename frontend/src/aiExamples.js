// Worked examples for the AI Model & Informatics page. Each is a patch applied over SCEN_DEFAULTS.
// Single-model fields are URL-encoded directly. Built-in comparison examples are restored from a
// versioned preset key; custom candidate edits and free-text comparison notes stay in CEDARS files.
//
// Published values are used where a publication reports them; everything else is explicitly
// illustrative. A published inference measurement is kept separate from unmeasured pretraining so
// missing lifecycle information is never treated as zero.
export const AI_EXAMPLES = [
  {
    key: 'cxr-measured',
    title: 'Chest radiograph classifier',
    subtitle: 'Measured with CodeCarbon · Assess my own model',
    ref: null,
    note: 'An in-house classifier with energy measured on a local GPU. Illustrative numbers in the shape of a complete, measured record.',
    scen: {
      aiRoute: 'own', ownMode: 'measured', projectName: 'Chest radiograph nodule classifier (example)',
      modelKey: 'cad', architecture: 'CNN / ResNet', paramsM: '25', resolution: '512', taskType: 'Classification',
      trainGpu: 'NVIDIA A100 (80GB SXM4)', trainNumGpus: '2', trainHours: '18', numRuns: '4',
      trainKwhMeasured: '41.6', trainTool: 'CodeCarbon', datasetSize: '112000', epochs: '30',
      inferKwh: '0.00042', inferStudiesMonth: '2500', deployMonths: '36',
      cloudProvider: 'Local compute', cloudRegion: 'On-premise (US average)', customPue: '1.0',
      waterMode: 'notassessed',
      accuracyPct: '91', accuracyMetric: 'AUC',
    },
  },
  {
    key: 'published-llm-vicuna7b',
    title: 'Published open-source LLM benchmark',
    subtitle: 'Measured inference · pretraining not assessed',
    ref: 'doo-radiology-llm-2024',
    note: 'Published local-compute benchmark of Vicuna 1.5 7B on chest-radiograph report labeling. GPU inference energy was measured with CodeCarbon across 3,665 reports; the per-study value below is derived from that measured total. Model pretraining was not assessed in the study, and the deployment volume shown here is illustrative.',
    scen: {
      aiRoute: 'own', ownMode: 'measured', projectName: 'Vicuna 1.5 7B report-labeling benchmark (published example)',
      modelKey: 'report', architecture: 'LLM / Agent (transformer)', taskType: 'Classification', paramsM: '7000',
      trainDisclosed: 'no', trainMissingReason: 'notassessed',
      inferKwh: '0.00003547', inferStudiesMonth: '2500', deployMonths: '36',
      cloudProvider: 'Local compute', cloudRegion: 'On-premise (US average)', customPue: '1.0', waterMode: 'notassessed',
      accuracyPct: '93.83', accuracyMetric: 'Accuracy', performanceUnit: 'percent', performanceSource: 'Published study',
    },
  },
  {
    key: 'report-llm-api',
    title: 'Vendor-hosted report-generation LLM',
    subtitle: 'Estimated inference · training not disclosed',
    ref: null,
    note: 'A hosted LLM drafting reports. Inference is estimated from token use; training is explicitly marked not disclosed by the vendor. CEDARS reports the inference footprint but does not assign an overall lifecycle score while training is unavailable.',
    scen: {
      aiRoute: 'own', ownMode: 'spec', projectName: 'Report-generation LLM, vendor API (example)',
      modelKey: 'report', architecture: 'LLM / Agent (transformer)', taskType: 'Report generation',
      trainDisclosed: 'no', trainMissingReason: 'vendor', callsPerTask: '1', tokensPerCall: '2500', whPer1kTokens: '0.4',
      inferStudiesMonth: '2500', deployMonths: '36',
      cloudProvider: 'AWS', cloudRegion: 'us-east-1 (N. Virginia, US)', waterMode: 'notassessed',
      accuracyPct: '70', accuracyMetric: 'RadGraph F1',
    },
  },
  {
    key: 'maistro-agentic',
    title: 'mAIstro multi-agent workflow',
    subtitle: 'Three reasoning LLMs compared · Compare candidate models',
    ref: 'tzanis-maistro-2025',
    note: 'mAIstro (Tzanis & Klontzas, 2025) is a master agent coordinating eight task-specific agents; it is LLM-agnostic. The publication reports task success per LLM but no energy, so carbon here is an estimate from token counts and the agent count. The reasoning LLM is the lever.',
    scen: {
      aiRoute: 'compare', compareVolumeSource: 'custom', projectName: 'mAIstro multi-agent workflow (example)',
      modelKey: 'agentic', architecture: 'LLM / Agent (transformer)', taskType: 'Agentic workflow',
      trainDisclosed: 'no', callsPerTask: '9', tokensPerCall: '4000', whPer1kTokens: '0.4',
      inferStudiesMonth: '2500', deployMonths: '36',
      cloudProvider: 'AWS', cloudRegion: 'us-east-1 (N. Virginia, US)',
      accuracyPct: '100', accuracyMetric: 'Task success (%)',
    },
    // Benchmark candidates: same workflow, different reasoning engine. Performance = reported
    // task success in the publication; energy per 1k tokens is an illustrative estimate.
    bench: [
      {label: 'mAIstro · GPT-4o (vendor API)',       modelKey: 'agentic', callsPerTask: '9', tokensPerCall: '4000', whPer1kTokens: '0.5', accuracyPct: '100', accuracyMetric: 'Task success (%)', cloudProvider: 'AWS',           cloudRegion: 'us-east-1 (N. Virginia, US)'},
      {label: 'mAIstro · Llama 3.3 70B (local GPU)', modelKey: 'agentic', callsPerTask: '9', tokensPerCall: '4000', whPer1kTokens: '0.35', accuracyPct: '100', accuracyMetric: 'Task success (%)', cloudProvider: 'Local compute', cloudRegion: 'On-premise (US average)'},
      {label: 'mAIstro · Llama 3.1 8B (local GPU)',  modelKey: 'agentic', callsPerTask: '9', tokensPerCall: '4000', whPer1kTokens: '0.06', accuracyPct: '18',  accuracyMetric: 'Task success (%)', cloudProvider: 'Local compute', cloudRegion: 'On-premise (US average)'},
    ],
  },
  {
    key: 'roentgen-synth',
    title: 'RoentGen synthetic chest radiographs',
    subtitle: 'Diffusion + text conditioning · Assess my own model',
    ref: 'chambon-roentgen-2022',
    note: 'RoentGen (Chambon et al., 2022) adapts a latent diffusion model to chest radiographs conditioned on report text. The publication reports no energy; training and generation energy here are library estimates scaled to the model, badged Estimated.',
    scen: {
      aiRoute: 'own', ownMode: 'spec', projectName: 'RoentGen synthetic chest radiographs (example)',
      modelKey: 'synth', architecture: 'Diffusion / Generative AI', taskType: 'Image synthesis', resolution: '512',
      trainGpu: 'NVIDIA A100 (80GB SXM4)', trainNumGpus: '8', trainHours: '60', numRuns: '1',
      inferStudiesMonth: '1000', deployMonths: '24',
      cloudProvider: 'Google Cloud', cloudRegion: '',
      accuracyPct: '0', accuracyMetric: 'Expert-rated realism',
    },
  },
];

// Published monthly study volumes for a small and a large US radiology practice
// (Doo FX et al., J Am Coll Radiol 2024;21:248–256, Fig. 2). Used as a labelled fallback when no
// department volume has been entered; visitors are asked to replace them with their own counts.
export const VOLUME_ESTIMATES = [
  {key: 'small', label: 'Small US practice', studiesPerMonth: 5100},
  {key: 'large', label: 'Large US practice', studiesPerMonth: 17000},
];
export const VOLUME_ESTIMATE_REF = 'doo-jacr-cloud-2024';
