// CEDARS_CHUNK_9R32C_REFERENCE_ADJUSTED_ECOLABEL
// CEDARS numeric core — pure, dependency-free calculation helpers shared by the app (main.jsx)
// and its reference tests (calc.test.js). Kept in one module so there is a single source of
// truth and results cannot diverge by execution path. See sources.md for every factor below.

// Regional grid carbon intensity (kgCO₂e/kWh). OWID 2023 / Eurostat 2022 / Vosshenrich et al.
export const CARBON_INTENSITY = {
  "Switzerland":    0.10,  // hydro + nuclear dominant; OWID 2023
  "France":         0.06,  // ~70 % nuclear; OWID 2023
  "Germany":        0.36,  // coal/gas/renewable mix; OWID 2023
  "United States":  0.38,  // national grid average; OWID 2023
  "US SERC-TVA (Tennessee Valley)": 0.41, // EPA eGRID2023 subregion SRTV — total output ≈903 lbCO₂e/MWh
  "United Kingdom": 0.20,  // gas + offshore wind; OWID 2023
  "EU average":     0.237, // Vosshenrich et al. / Eurostat 2022
  "Global average": 0.473, // Vosshenrich et al. — conservative global estimate
  "Editable custom":0.30,  // placeholder — replace with measured utility factor
};

// Commercial/industrial electricity price per region (local currency per kWh). Editable
// estimates (rough 2024–25 commercial rates); cost is decoupled from carbon. `sym` = currency.
export const ELECTRICITY_PRICE = {
  "Switzerland":    {price:0.27, sym:'CHF '},
  "France":         {price:0.23, sym:'€'},
  "Germany":        {price:0.28, sym:'€'},
  "United States":  {price:0.13, sym:'$'},
  "US SERC-TVA (Tennessee Valley)": {price:0.12, sym:'$'}, // Southeast/TVA commercial estimate (editable)
  "United Kingdom": {price:0.28, sym:'£'},
  "EU average":     {price:0.24, sym:'€'},
  "Global average": {price:0.15, sym:'$'},
  "Editable custom":{price:0.20, sym:'€'},
};

// Resolve effective carbon intensity — uses customCi when region is "Editable custom".
export const getCI = (region, customCi) => {
  if (region === 'Editable custom') { const n=Number(customCi); return Number.isFinite(n)&&n>=0?n:0.30; }
  return Object.prototype.hasOwnProperty.call(CARBON_INTENSITY,region)?CARBON_INTENSITY[region]:0.25;
};

// Effective electricity price (per kWh): a positive override wins, else the region default.// Effective electricity price (per kWh): a positive override wins, else the region default.
export const getPrice = (region, override) => { const o=Number(override); if(Number.isFinite(o)&&o>0)return o; return Object.prototype.hasOwnProperty.call(ELECTRICITY_PRICE,region)?ELECTRICITY_PRICE[region].price:0.20; };
export const currencySym = region => Object.prototype.hasOwnProperty.call(ELECTRICITY_PRICE,region)?ELECTRICITY_PRICE[region].sym:'€';

// CEDARS_CHUNK_9R32_WALKTHROUGH_ECOLABEL_METHOD
// Footprint Rating bands = equal quintiles of the 0–100 Footprint Score (80/60/40/20).
// These are v1 provisional research bands; they are not empirical peer percentiles.
export const CEDARS_RATINGS = [
  {leaves:5, min:80, label:'Very low footprint', color:'#1b5e20', bg:'#e6f4ed', desc:'Very low Footprint Score band on the v1 provisional scale.'},
  {leaves:4, min:60, label:'Low footprint',      color:'#2b6e2c', bg:'#eaf3d8', desc:'Low Footprint Score band on the v1 provisional scale.'},
  {leaves:3, min:40, label:'Moderate footprint', color:'#7a6a00', bg:'#fbf6d6', desc:'Moderate Footprint Score band on the v1 provisional scale.'},
  {leaves:2, min:20, label:'Elevated footprint', color:'#8a4a00', bg:'#fdeccc', desc:'Elevated Footprint Score band on the v1 provisional scale.'},
  {leaves:1, min:0,  label:'High footprint',     color:'#9b1515', bg:'#fbe0e0', desc:'High Footprint Score band on the v1 provisional scale.'},
];
export function cedarsRating(score) {
  return CEDARS_RATINGS.find(r => score >= r.min) ?? CEDARS_RATINGS[CEDARS_RATINGS.length - 1];
}

// Department v1.1 uses a service-reference ratio rather than the absolute-carbon anchor scale.
// Score 50 = the CEDARS reference expectation for the entered service mix; it is NOT a percentile.
// Halving reference-adjusted energy maps to 100 and doubling it maps to 0.
export const CEDARS_REFERENCE_RATINGS = [
  {leaves:5, min:80, label:'Much lower energy than reference', color:'#1b5e20', bg:'#e6f4ed', desc:'Operational energy is substantially below the CEDARS matched-service reference.'},
  {leaves:4, min:60, label:'Lower energy than reference',      color:'#2b6e2c', bg:'#eaf3d8', desc:'Operational energy is below the CEDARS matched-service reference.'},
  {leaves:3, min:40, label:'Near reference',                   color:'#7a6a00', bg:'#fbf6d6', desc:'Operational energy is near the CEDARS matched-service reference.'},
  {leaves:2, min:20, label:'Higher energy than reference',     color:'#8a4a00', bg:'#fdeccc', desc:'Operational energy is above the CEDARS matched-service reference.'},
  {leaves:1, min:0,  label:'Much higher energy than reference',color:'#9b1515', bg:'#fbe0e0', desc:'Operational energy is substantially above the CEDARS matched-service reference.'},
];
export function cedarsReferenceRating(score) {
  return CEDARS_REFERENCE_RATINGS.find(r => score >= r.min) ?? CEDARS_REFERENCE_RATINGS[CEDARS_REFERENCE_RATINGS.length - 1];
}
export function cedarsReferenceAdjustedScore(observedAnnualKwh, referenceAnnualKwh) {
  const observed = Number(observedAnnualKwh), reference = Number(referenceAnnualKwh);
  if (!Number.isFinite(observed) || observed < 0 || !Number.isFinite(reference) || !(reference > 0)) return null;
  if (observed === 0) return 100;
  const raw = Math.round(50 - 50 * Math.log2(observed / reference));
  return Math.max(0, Math.min(100, raw));
}

// Footprint intensity → 0–100 CEDARS Footprint Score on a log scale: lo → 100 (greenest), hi → 0 (worst).
export function cedarsScore(value, lo, hi) {
  const raw=Number(value); if(!Number.isFinite(raw)||raw<0)return 0; const x=Math.max(raw,1e-6); if(x<=lo)return 100; if(x>=hi)return 0; return Math.round(100*(Math.log10(hi)-Math.log10(x))/(Math.log10(hi)-Math.log10(lo)));
}
export const CEDARS_DEPT_LO = 0.1, CEDARS_DEPT_HI = 20;   // legacy Department v1 anchors; retained for backward compatibility, not used by v1.1
export const CEDARS_AIUSE_LO = 0.2, CEDARS_AIUSE_HI = 40; // gCO₂e per study (amortised)
