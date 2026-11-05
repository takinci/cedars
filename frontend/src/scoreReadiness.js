// CEDARS_CHUNK_9R32D_SERVICE_CONTEXT_RESPONSIVE_HARDENING
// CEDARS_CHUNK_9R32C_REFERENCE_ADJUSTED_ECOLABEL
// CEDARS_CHUNK_9R17_REQUIRED_CONTEXT_STEPPER_COLOR_AUDIT
const positive = value => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};

export function getDepartmentScoreReadiness({
  annualKwh = 0,
  annualStudies = 0,
  gridReady = true,
  clinicalAiCount = 0,
  interpretationOnly = false,
  volumeMismatch = 0,
  volumeWithoutEquipment = [],
} = {}) {
  const hasEnergy = positive(annualKwh);
  const hasVolume = positive(annualStudies);
  const issues = [];

  if (interpretationOnly) {
    if (!hasEnergy) issues.push({
      key:'equipment',
      title:'Add the informatics / workstation energy baseline',
      detail:'Interpretation-only services do not receive a scanner-operations rating, but CEDARS still needs an energy baseline to report the informatics footprint.',
    });
  } else if (!hasEnergy && !hasVolume) {
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
      detail: 'Enter annual imaging volume so CEDARS can build the matched service reference. A configured fleet can also provide the initial workload estimate.',
    });
  }

  if (!interpretationOnly && Number(volumeMismatch)>0) issues.push({
    key:'volume',
    title:'Reconcile the Department workload totals',
    detail:'The modality-specific studies exceed the entered total annual physical imaging volume. Correct one of those inputs before CEDARS assigns the scanner-operations rating.',
  });
  if (!interpretationOnly && Array.isArray(volumeWithoutEquipment) && volumeWithoutEquipment.length>0) issues.push({
    key:'volume',
    title:'Match modality workload to the represented acquisition fleet',
    detail:'One or more modality study volumes were entered without corresponding acquisition equipment in this assessment. Add the equipment or remove those externally interpreted studies from the physical-service workload.',
  });

  if (!gridReady) issues.push({
    key: 'context',
    title: 'Complete the Department grid context',
    detail: 'Choose a country / grid region. If you select “Editable custom,” also enter its kgCO₂e/kWh value before CEDARS reports carbon.',
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
