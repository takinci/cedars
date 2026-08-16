// Reference tests for shareable-URL state (urlstate.js). The core guarantee: a link reproduces the
// exact configuration that was shared — so the round-trip encode → decode must recover every
// non-default field (department settings, equipment inventory, storage, AI scenario, interventions).
// Run: `npm test`.
import { describe, it, expect } from 'vitest';
import {
  encodeConfig, decodeConfig, ALL_INTERVENTIONS, SETTINGS_DEFAULTS, SCEN_DEFAULTS,
} from './urlstate.js';

describe('clean URL at defaults', () => {
  it('an all-default config encodes to an empty string (link stays clean)', () => {
    expect(encodeConfig({ settings: SETTINGS_DEFAULTS, scen: SCEN_DEFAULTS, activeInterventions: [] })).toBe('');
  });
  it('an empty/absent hash decodes to nothing', () => {
    expect(decodeConfig('')).toEqual({});
    expect(decodeConfig('#')).toEqual({});
  });
});

describe('round-trip — a shared link restores exactly what was shared', () => {
  it('full configuration across all four categories survives encode → decode', () => {
    const settings = {
      ...SETTINGS_DEFAULTS,
      region: 'Germany', metricType: 'Carbon', timePeriod: 'Annual', customCi: '0.42',
      staffCommuteKm: '22', electricityPrice: '0.31',
      storageRetentionYears: '7', storageCloud: true, storageReformats: 'axial',
      equipment: { ct: 2, mri_15t: 1, xray: 3 },
    };
    const scen = {
      ...SCEN_DEFAULTS,
      cloudProvider: 'AWS', scannerState: 'Off', modelKey: 'seg3d',
      architecture: 'U-Net / nnU-Net', precision: 'float16 (mixed)', paramsM: '30',
      dim: '3D', resolution: '512', deployMonths: '48',
    };
    const activeInterventions = [
      'Turn MRI/CT scanners off overnight',
      'Reduce low-value imaging',
      'Store only acquired axial series (avoid reformats)',
    ];

    const decoded = decodeConfig('#' + encodeConfig({ settings, scen, activeInterventions }));

    // Only non-default fields are carried; merge over defaults to compare full state.
    expect({ ...SETTINGS_DEFAULTS, ...decoded.settings }).toEqual(settings);
    expect({ ...SCEN_DEFAULTS, ...decoded.scen }).toEqual(scen);
    expect(decoded.activeInterventions).toEqual(activeInterventions);
  });

  it('equipment: only non-zero devices are carried, and counts are preserved', () => {
    const enc = encodeConfig({ settings: { ...SETTINGS_DEFAULTS, equipment: { ct: 2, pacs: 0, mri_3t: 5 } } });
    const eq = decodeConfig('#' + enc).settings.equipment;
    expect(eq).toEqual({ ct: 2, mri_3t: 5 }); // zero-count pacs dropped
  });

  it('storageCloud boolean survives both states', () => {
    expect(decodeConfig('#' + encodeConfig({ settings: { ...SETTINGS_DEFAULTS, storageCloud: true } })).settings.storageCloud).toBe(true);
    // default (false) is omitted entirely
    expect(encodeConfig({ settings: { ...SETTINGS_DEFAULTS, storageCloud: false } })).toBe('');
  });

  it('interventions encode as compact indices, not full strings', () => {
    const names = [ALL_INTERVENTIONS[0], ALL_INTERVENTIONS[2]];
    const enc = encodeConfig({ activeInterventions: names });
    expect(enc).toBe('in=0-2');                       // indices, not the long labels
    expect(decodeConfig('#' + enc).activeInterventions).toEqual(names);
  });

  it('equipmentOverrides and storageIntensityCustom survive encode → decode', () => {
    const settings = {
      ...SETTINGS_DEFAULTS,
      storageIntensityCustom: '1000',
      equipment: { ct: 1, workstations: 5 },
      equipmentOverrides: { ct: { active_kw: 45, scans: 1200 }, workstations: { active_kw: 0.6 } },
    };
    const decoded = decodeConfig('#' + encodeConfig({ settings }));
    expect({ ...SETTINGS_DEFAULTS, ...decoded.settings }).toEqual(settings);
  });

  it('customPue survives encode → decode', () => {
    const scen = { ...SCEN_DEFAULTS, customPue: '1.0' };
    const decoded = decodeConfig('#' + encodeConfig({ scen }));
    expect({ ...SCEN_DEFAULTS, ...decoded.scen }).toEqual(scen);
  });

  it('equipmentOverrides drops unrecognized fields and non-numeric values on decode', () => {
    // 'notafield' isn't in OVERRIDABLE_FIELDS and 'scans=abc' isn't numeric — both dropped;
    // a device left with no valid fields (workstations) is omitted entirely.
    const decoded = decodeConfig('#eo=ct:active_kw=45,notafield=9|workstations:scans=abc');
    expect(decoded.settings.equipmentOverrides).toEqual({ ct: { active_kw: 45 } });
  });
});

describe('backward compatibility', () => {
  it('legacy short keys (u,r,m,t,c,a) from links shared before this change still decode', () => {
    const decoded = decodeConfig('#r=France&m=Carbon&t=Annual');
    expect(decoded.settings).toEqual({ region: 'France', metricType: 'Carbon', timePeriod: 'Annual' });
  });
});
