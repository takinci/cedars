// Clinical-effect accounting policy for AI assessments.
//
// CEDARS may record workflow effects from several evidence sources, but only local observed or
// locally validated effects are allowed to reduce the CURRENT modeled footprint. Published
// external effects and scenario assumptions remain visible for planning without being silently
// credited to today's net result.

const BASIS_LABELS = Object.freeze({
  'none': 'No current clinical-effect credit',
  'observed-local': 'Observed locally',
  'validated-local': 'Locally validated estimate',
  'published': 'Published external evidence',
  'scenario': 'Scenario assumption',
});

export function normalizeClinicalEffectBasis(value) {
  const key = value == null ? 'none' : String(value);
  return Object.prototype.hasOwnProperty.call(BASIS_LABELS, key) ? key : 'none';
}

export function clinicalEffectBasisLabel(value) {
  return BASIS_LABELS[normalizeClinicalEffectBasis(value)];
}

export function isCreditableClinicalEffectBasis(value) {
  const basis = normalizeClinicalEffectBasis(value);
  return basis === 'observed-local' || basis === 'validated-local';
}

export function applyClinicalEffectEvidence({basis = 'none', savedKwh = 0, carbonIntensity = 0} = {}) {
  const normalizedBasis = normalizeClinicalEffectBasis(basis);
  const scenarioKwhRaw = Number(savedKwh);
  const ciRaw = Number(carbonIntensity);
  const scenarioKwh = Number.isFinite(scenarioKwhRaw) && scenarioKwhRaw > 0 ? scenarioKwhRaw : 0;
  const ci = Number.isFinite(ciRaw) && ciRaw >= 0 ? ciRaw : 0;
  const credited = isCreditableClinicalEffectBasis(normalizedBasis);
  const creditedKwh = credited ? scenarioKwh : 0;
  return {basis: normalizedBasis, credited, scenarioKwh, creditedKwh, creditedCo2Kg: creditedKwh * ci};
}

export function systemEffectsStatus({scanTimeReductionPct = 0, lowValueReductionPct = 0} = {}) {
  const scan = Number(scanTimeReductionPct);
  const avoided = Number(lowValueReductionPct);
  const hasEnteredEffect = (Number.isFinite(scan) && scan > 0) || (Number.isFinite(avoided) && avoided > 0);
  return hasEnteredEffect ? 'Not quantified' : 'Not assessed';
}
