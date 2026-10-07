const positive = value => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};

export function getDepartmentScoreReadiness({
  annualKwh = 0,
  annualStudies = 0,
  gridReady = true,
  clinicalAiCount = 0,
} = {}) {
  const hasEnergy = positive(annualKwh);
  const hasVolume = positive(annualStudies);
  const issues = [];

  if (!hasEnergy && !hasVolume) {
    issues.push({
      key: 'equipment',
      title: 'Add a Department equipment / energy baseline',
      detail: clinicalAiCount > 0
        ? 'Clinical AI is configured, but it is added to a Department baseline; add imaging equipment or equivalent annual energy before scoring the Department.'
        : 'Choose a quick-start fleet or enter your own device counts. Either approach creates the Department energy and workload baseline used by the score.',
    });
  } else {
    if (!hasEnergy) issues.push({
      key: 'equipment',
      title: 'Add Department equipment or annual electricity',
      detail: 'CEDARS cannot calculate a Department footprint from imaging volume alone. Add the equipment/energy baseline used to deliver that care.',
    });
    if (!hasVolume) issues.push({
      key: 'volume',
      title: 'Add imaging workload',
      detail: 'Enter annual imaging volume so CEDARS can express the Department footprint per study. A configured fleet can also provide the default workload estimate.',
    });
  }

  if (!gridReady) issues.push({
    key: 'context',
    title: 'Enter the custom grid carbon intensity',
    detail: '“Editable custom” was selected for the grid region, so enter its kgCO₂e/kWh value before CEDARS calculates a carbon score.',
  });

  return {ready: issues.length === 0, issues};
}

export function getAiScoreReadiness({hasData = false, hasPathway = false} = {}) {
  if (hasData) return {ready:true, issues:[]};
  if (!hasPathway) return {
    ready:false,
    issues:[{
      key:'pathway',
      title:'Choose what you are doing with this AI model',
      detail:'Choose Develop / train or Procure / deploy first, then add the model information used for its environmental estimate.',
    }],
  };
  return {
    ready:false,
    issues:[{
      key:'energy',
      title:'Add training or inference energy information',
      detail:'A model name or template alone does not create an environmental score. Enter measured or estimated training energy and/or inference energy.',
    }],
  };
}
