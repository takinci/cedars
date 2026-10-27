import React, {useState} from 'react';
import {TrendingUp, Cpu} from 'lucide-react';
import {Ref} from './Refs.jsx';
import {VOLUME_ESTIMATES, VOLUME_ESTIMATE_REF} from './aiExamples.js';

// The first thing on the AI Model & Informatics page is the work context, not a technical taxonomy.
// Clinical / operational evaluation includes one-system assessment and candidate comparison.
// Development includes models being built or materially retrained by the user's team.
// aiSystemType then keeps imaging AI separate from LLM / multimodal / agentic workloads.
export const AI_ENTRY_REFS = ['doo-jacr-2024', 'tzanis-maistro-2025', 'chambon-roentgen-2022', 'doo-jacr-cloud-2024', 'jia-eurradiol-2026', 'jegham-llm-2025', 'fernandez-llm-energy-2025', 'oviedo-inference-2025', 'kpodzro-haip-2026'];

const q = {fontSize:12, fontWeight:700, color:'#2E7D32', margin:'0 0 6px'};
const inset = {background:'#f7fbf8', border:'1px solid #e0efe2', borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10};

export function AiDeploymentContext({ctxSource, dept, volume, onCtxSource, onVolume}) {
  const hasDeptVolume = dept.studiesPerMonth > 0;
  const custom = ctxSource === 'custom';
  return (
    <div style={{...inset, gap:10}}>
      <div>
        <p style={q}>Expected deployment workload</p>
        <p className="note" style={{margin:0}}>
          Every candidate is compared at the same monthly study volume. Choose a published practice estimate, use the Radiology Department volume already in this assessment, or enter a custom workload.<Ref id={VOLUME_ESTIMATE_REF} order={AI_ENTRY_REFS}/>
        </p>
      </div>
      <div className="deploymentWorkloadGrid" role="group" aria-label="Expected deployment workload">
        {VOLUME_ESTIMATES.map(v => (
          <button key={v.key} type="button" className={`deploymentWorkloadCard ${ctxSource===v.key?'active':''}`} onClick={()=>onCtxSource(v.key)}>
            <strong>{v.label}</strong>
            <small>{v.studiesPerMonth.toLocaleString()} studies/month{v.key==='small' ? ' · default' : ''}</small>
          </button>
        ))}
        {hasDeptVolume ? (
          <button type="button" className={`deploymentWorkloadCard ${ctxSource==='department'?'active':''}`} onClick={()=>onCtxSource('department')}>
            <strong>My Radiology Department</strong>
            <small>{dept.studiesPerMonth.toLocaleString()} studies/month · from Department assessment</small>
          </button>
        ) : (
          <div className="deploymentWorkloadCard disabled" aria-disabled="true">
            <strong>My Radiology Department</strong>
            <small>Department workload not available yet</small>
          </div>
        )}
        <div className={`deploymentWorkloadCard custom ${custom?'active':''}`}>
          <button type="button" onClick={()=>onCtxSource('custom')}>
            <strong>Custom workload</strong>
            <small>{custom && Number(volume)>0 ? `${Number(volume).toLocaleString()} studies/month` : 'Enter studies/month'}</small>
          </button>
          {custom && (
            <label>
              <span>Studies / month</span>
              <input type="number" min="0" value={volume} placeholder="e.g. 8,000" onChange={e=>onVolume(e.target.value)}/>
            </label>
          )}
        </div>
      </div>
      <p className="note" style={{margin:0}}>
        These are workload assumptions, not compute-location assumptions. Provider and compute region are set separately and applied consistently to every candidate.
      </p>
    </div>
  );
}

const SYSTEM_CHOICES = [
  ['imaging', 'Imaging AI', 'Detection, classification, segmentation, reconstruction, image generation, or another imaging task.'],
  ['foundation', 'LLM / multimodal / agentic AI', 'Report generation, NLP, vision-language models, copilots, or multi-call agentic workflows.'],
];

export function AiEntryStep({route, ownMode, systemType, onSystemType, onRoute, onOwnMode, examples, onExample, onReset}) {
  const [lane, setLane] = useState('');
  const chooseClinical = action => {
    if (!systemType) return;
    onOwnMode('spec');
    onRoute(action === 'compare' ? 'compare' : 'own');
  };
  const chooseDevelopment = mode => {
    if (!systemType) return;
    onOwnMode(mode);
    onRoute('own');
  };
  return (
    <section className="aiIntentStart" aria-labelledby="ai-intent-title">
      <div className="aiIntentHeader">
        <span className="aiIntentKicker">START HERE</span>
        <div>
          <h2 id="ai-intent-title">What best describes the work you’re doing today?</h2>
          <p>Start with the work context. CEDARS will then ask only the AI details needed for that pathway.</p>
        </div>
      </div>

      <div className="aiIntentGrid aiRoleGrid" role="group" aria-label="AI work context">
        <button type="button" data-demo-target="ai-clinical-lane" className={`aiIntentCard aiIntentLane ${lane==='clinical'?'active':''}`} aria-pressed={lane==='clinical'} onClick={()=>setLane('clinical')}>
          <span className="aiIntentIcon"><TrendingUp size={21}/></span>
          <span className="aiIntentEyebrow">EVALUATE · SELECT · USE</span>
          <strong>Evaluating or using AI in clinical care</strong>
          <small>For radiology leaders, clinicians, procurement, informatics/IT, AI governance, operations, administrators, and sustainability teams.</small>
          <b>{lane==='clinical'?'Selected':'Choose this pathway →'}</b>
        </button>
        <button type="button" data-demo-target="ai-developer-lane" className={`aiIntentCard aiIntentLane ${lane==='develop'?'active':''}`} aria-pressed={lane==='develop'} onClick={()=>setLane('develop')}>
          <span className="aiIntentIcon"><Cpu size={21}/></span>
          <span className="aiIntentEyebrow">DEVELOP · RETRAIN</span>
          <strong>Developing or materially retraining AI</strong>
          <small>For researchers, ML engineers, technical imaging-informatics teams, and others building or materially retraining a model.</small>
          <b>{lane==='develop'?'Selected':'Choose this pathway →'}</b>
        </button>
      </div>

      {lane && (
        <div className="aiLaneDetail" data-demo-target="ai-lane-detail">
          <div className="aiLaneDetailHeader">
            <span>{lane==='clinical'?'CLINICAL / OPERATIONAL PATHWAY':'DEVELOPMENT PATHWAY'}</span>
            <strong>{lane==='clinical'?'What kind of AI are you evaluating or using?':'What kind of AI are you developing or retraining?'}</strong>
            <small>{lane==='clinical'?'You do not need to be an AI developer to use this pathway.':'Use this pathway when your team owns the model-development or material-retraining work.'}</small>
          </div>
          <div className="aiSystemChoiceGrid" role="group" aria-label="AI system family">
            {SYSTEM_CHOICES.map(([key,title,desc]) => (
              <button key={key} type="button" className={`aiSystemChoice ${systemType===key?'active':''}`} aria-pressed={systemType===key} onClick={()=>onSystemType(key)}>
                <strong>{title}</strong><small>{desc}</small>
              </button>
            ))}
          </div>

          <div className={`aiTaskChoiceBlock ${systemType?'ready':''}`}>
            <span>{lane==='clinical'?'WHAT ARE YOU DOING?':'HOW DO YOU WANT TO START?'}</span>
            {lane==='clinical' ? (
              <div className="aiTaskChoiceGrid">
                <button type="button" className="aiTaskChoice" disabled={!systemType} onClick={()=>chooseClinical('single')}>
                  <strong>Assess one system</strong>
                  <small>Use this when a system is already selected, already deployed, or is the only system you need to evaluate. No comparison is required.</small>
                  <b>Assess one system →</b>
                </button>
                <button type="button" className="aiTaskChoice" disabled={!systemType} onClick={()=>chooseClinical('compare')}>
                  <strong>Compare candidates</strong>
                  <small>Use this when two or more systems could address the same clinical need and should be compared on a like-for-like basis.</small>
                  <b>Compare candidates →</b>
                </button>
              </div>
            ) : (
              <div className="aiTaskChoiceGrid">
                <button type="button" className="aiTaskChoice" disabled={!systemType} onClick={()=>chooseDevelopment('measure')}>
                  <strong>Help me measure</strong>
                  <small>Choose a measurement approach for training and/or inference based on where and how your model runs.</small>
                  <b>Choose a measurement path →</b>
                </button>
                <button type="button" className="aiTaskChoice" disabled={!systemType} onClick={()=>chooseDevelopment('measured')}>
                  <strong>I have energy numbers</strong>
                  <small>Enter measured training or inference energy and keep its provenance attached to the model record.</small>
                  <b>Enter model data →</b>
                </button>
              </div>
            )}
            {!systemType && <small className="aiTaskChoiceHint">Choose the AI type above to continue.</small>}
          </div>
        </div>
      )}

      <details id="ai-examples" className="aiExamplesDetails">
        <summary>Examples &amp; quick start <small>optional</small></summary>
        <div>
          <p>Examples are shortcuts, not separate pathways. Load one to explore CEDARS, or start with a blank AI record. Example values are illustrative or literature-derived, not local measurements.</p>
          <div className="quickStartChoices"><button type="button" onClick={onReset}>Start empty</button>{examples.map(ex => <button key={ex.key} type="button" onClick={()=>onExample(ex.key)}>{ex.title}</button>)}</div>
        </div>
      </details>
    </section>
  );
}

export function AiRouteStrip({route, ownMode, systemType, onComparison, onBackToComparison, onStartComparison}) {
  const family = systemType === 'imaging' ? 'Imaging AI'
    : systemType === 'foundation' ? 'LLM / multimodal / agentic AI'
      : 'AI system';
  const label = route === 'compare' ? `Clinical evaluation · ${family} · comparing candidates`
    : ownMode === 'spec' ? `Clinical evaluation · ${family} · one system`
      : `Development · ${family}`;
  return (
    <div className="aiRouteStrip">
      <span className="aiIntentKicker">AI PATHWAY</span>
      <strong>{label}</strong>
      <span className="aiRouteActions">
        {route === 'compare' && <button type="button" className="inlineTextButton" onClick={onComparison}>View comparison results ↓</button>}
        {route === 'own' && ownMode === 'spec' && onBackToComparison && <button type="button" className="inlineTextButton" onClick={onBackToComparison}>← Back to candidate comparison</button>}
        {route === 'own' && ownMode === 'spec' && !onBackToComparison && onStartComparison && <button type="button" className="inlineTextButton" onClick={onStartComparison}>Compare this model with candidates →</button>}
      </span>
    </div>
  );
}
