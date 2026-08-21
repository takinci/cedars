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
export const getCI = (region, customCi) =>
  region === 'Editable custom' ? (isNaN(parseFloat(customCi)) ? 0.30 : parseFloat(customCi)) : (CARBON_INTENSITY[region] ?? 0.25);

// Effective electricity price (per kWh): a positive override wins, else the region default.
export const getPrice = (region, override) => {
  const o = parseFloat(override);
  return o > 0 ? o : (ELECTRICITY_PRICE[region]?.price ?? 0.20);
};
export const currencySym = region => ELECTRICITY_PRICE[region]?.sym ?? '€';

// Rating bands = equal quintiles of the 0–100 Score (80/60/40/20). The non-linearity lives in
// the (log-scale) Score itself, so the bands stay even. Provisional, open to consensus revision.
export const CEDARS_RATINGS = [
  {leaves:5, min:80, label:'Very low footprint',      color:'#1b5e20', bg:'#e6f4ed', desc:'Carbon-aware design, clean energy, efficient hardware lifecycle.'},
  {leaves:4, min:60, label:'Low footprint',           color:'#2b6e2c', bg:'#eaf3d8', desc:'Low footprint with good mitigation.'},
  {leaves:3, min:40, label:'Moderate footprint',      color:'#7a6a00', bg:'#fbf6d6', desc:'Moderate footprint; clear room to improve.'},
  {leaves:2, min:20, label:'Above-average footprint', color:'#8a4a00', bg:'#fdeccc', desc:'Above-average footprint; mitigation recommended.'},
  {leaves:1, min:0,  label:'High footprint',          color:'#9b1515', bg:'#fbe0e0', desc:'High footprint / limited mitigation.'},
];
export function cedarsRating(score) {
  return CEDARS_RATINGS.find(r => score >= r.min) ?? CEDARS_RATINGS[CEDARS_RATINGS.length - 1];
}

// Footprint intensity → 0–100 Score on a log scale: lo → 100 (greenest), hi → 0 (worst).
export function cedarsScore(value, lo, hi) {
  const x = Math.max(parseFloat(value) || 0, 1e-6);
  if (x <= lo) return 100;
  if (x >= hi) return 0;
  return Math.round(100 * (Math.log10(hi) - Math.log10(x)) / (Math.log10(hi) - Math.log10(lo)));
}

// Score anchors (lo → Score 100, hi → Score 0). See sources.md.
export const CEDARS_DEPT_LO = 0.1, CEDARS_DEPT_HI = 20;   // kgCO₂e per imaging study
export const CEDARS_AIUSE_LO = 0.2, CEDARS_AIUSE_HI = 40; // gCO₂e per study (amortised)
