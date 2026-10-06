import {describe, expect, it} from 'vitest';
import {buildAiState, migrateLegacyAiState, performanceMetricFromScen} from './aiRecords.js';

describe('canonical AI records', () => {
  it('wraps the legacy single-model fields without losing them', () => {
    const state = buildAiState({modelId:'model-a', projectName:'Model A', accuracyMetric:'Dice', accuracyPct:'0.91', performanceUnit:'fraction', performanceDirection:'higher'}, []);
    expect(state.activeAiModelId).toBe('model-a');
    expect(state.aiModels['model-a'].performance[0]).toMatchObject({metric:'Dice', value:'0.91', unit:'fraction', direction:'higher'});
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

  it('migrates legacy assessment payloads additively', () => {
    const migrated = migrateLegacyAiState({scen:{modelKey:'cad'}, deptLabel:{aiTools:[]}, other:'kept'});
    expect(migrated.other).toBe('kept');
    expect(migrated.aiModels[migrated.activeAiModelId].specification.modelKey).toBe('cad');
  });

  it('normalizes a typed primary performance metric', () => {
    expect(performanceMetricFromScen({accuracyMetric:'MAE', accuracyPct:'2.4', performanceUnit:'mm', performanceDirection:'lower'})).toMatchObject({metric:'MAE', value:'2.4', unit:'mm', direction:'lower'});
  });
});
