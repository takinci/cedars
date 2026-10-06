import {describe, expect, it} from 'vitest';
import {buildAiState, migrateLegacyAiState, performanceMetricFromScen, modelScenFromRecord, deploymentFromTool, toolFromDeployment} from './aiRecords.js';

describe('canonical AI records', () => {
  it('wraps the legacy single-model fields without losing them', () => {
    const state = buildAiState({modelId:'model-a', projectName:'Model A', accuracyMetric:'Dice', accuracyPct:'0.91', performanceUnit:'fraction', performanceDirection:'higher'}, []);
    expect(state.activeAiModelId).toBe('model-a');
    expect(state.aiModels['model-a'].performance[0]).toMatchObject({metric:'Dice', value:'0.91', unit:'fraction', direction:'higher'});
    expect(state.aiModels['model-a'].config.modelId).toBe('model-a');
  });

  it('keeps training and inference contexts separate while inheriting legacy context by default', () => {
    const state = buildAiState({cloudProvider:'AWS', cloudRegion:'eu-west-1', trainingProvider:'Local compute', trainingRegion:'On-premise (Switzerland)'}, []);
    const m = state.aiModels[state.activeAiModelId];
    expect(m.contexts.training.provider).toBe('Local compute');
    expect(m.contexts.inference.provider).toBe('AWS');
    expect(m.contexts.inference.region).toBe('eu-west-1');
  });

  it('turns department AI tools into deployment adapters referencing model IDs', () => {
    const state = buildAiState({modelId:'model-a'}, [{id:'dep-1', modelId:'model-a', studiesShare:'50', trainingBoundary:'upstream'}]);
    expect(state.aiDeployments[0]).toMatchObject({id:'dep-1', modelId:'model-a', useSharePct:'50', trainingBoundary:'upstream'});
    expect(state.aiModels[state.aiDeployments[0].modelId]).toBeTruthy();
  });

  it('rehydrates a model calculator record and deployment without copying canonical energy fields', () => {
    const state = buildAiState({modelId:'model-a', projectName:'Model A', inferKwh:'0.0042', trainKwhMeasured:'42'}, [{id:'dep-1',modelId:'model-a',studiesShare:'25',deployMonths:'24',lowValueReductPct:'5'}]);
    const scen = modelScenFromRecord(state.aiModels['model-a'], {precision:'float32 (standard)'});
    const tool = toolFromDeployment(state.aiDeployments[0]);
    expect(scen).toMatchObject({modelId:'model-a', projectName:'Model A', inferKwh:'0.0042', trainKwhMeasured:'42'});
    expect(tool).toMatchObject({modelId:'model-a', studiesShare:'25', deployMonths:'24', lowValueReductPct:'5'});
  });

  it('migrates legacy assessment payloads additively', () => {
    const migrated = migrateLegacyAiState({scen:{modelKey:'cad'}, deptLabel:{aiTools:[]}, other:'kept'});
    expect(migrated.other).toBe('kept');
    expect(migrated.aiModels[migrated.activeAiModelId].specification.modelKey).toBe('cad');
  });

  it('normalizes a typed primary performance metric', () => {
    expect(performanceMetricFromScen({accuracyMetric:'MAE', accuracyPct:'2.4', performanceUnit:'mm', performanceDirection:'lower'})).toMatchObject({metric:'MAE', value:'2.4', unit:'mm', direction:'lower'});
  });
});


it('round-trips a department training allocation percentage',()=>{const state=buildAiState({modelId:'model-a'},[{id:'dep-a',modelId:'model-a',studiesShare:'50',trainingBoundary:'allocated-local',trainingAllocationPct:'40'}]);expect(state.aiDeployments[0].trainingAllocationPct).toBe('40');expect(toolFromDeployment(state.aiDeployments[0]).trainingAllocationPct).toBe('40');});

describe('deployment accounting/provenance fields',()=>{
  it('round-trips effect provenance and embodied allocation',()=>{const tool={id:'x',modelId:'m',studiesShare:'50',deployMonths:'24',trainingBoundary:'upstream',embodiedBoundary:'allocated-local',embodiedAllocationPct:'25',effectBasis:'validated-local',lowValueReductPct:'5',scanTimeReductPct:'3',contrastReductPct:'0'};const dep=deploymentFromTool(tool);const back=toolFromDeployment(dep);expect(back.effectBasis).toBe('validated-local');expect(back.embodiedBoundary).toBe('allocated-local');expect(back.embodiedAllocationPct).toBe('25');});
});
