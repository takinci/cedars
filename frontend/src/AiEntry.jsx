import React from 'react';
import {TrendingUp, Cpu} from 'lucide-react';
import {Ref} from './Refs.jsx';
import {VOLUME_ESTIMATES, VOLUME_ESTIMATE_REF} from './aiExamples.js';

// The first thing on the AI Model & Informatics page: which route the visitor is on.
//   compare → procure/deploy clinically: compare candidates under one deployment context
//   own + spec → procure/deploy clinically: assess one model (comparison is optional)
//   own + measured/measure → development: characterize a model being trained or developed
// Development stays separate from the clinical procure/deploy choice.
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

export function AiEntryStep({route, ownMode, onRoute, onOwnMode, examples, onExample, onReset}) {
  const chooseSingle = () => { onOwnMode('spec'); onRoute('own'); };
  const chooseCompare = () => onRoute('compare');
  const chooseDevelop = () => { if (ownMode === 'spec') onOwnMode('measured'); onRoute('own'); };
  return (
    <section className="aiIntentStart" aria-labelledby="ai-intent-title">
      <div className="aiIntentHeader">
        <span className="aiIntentKicker">START HERE</span>
        <div>
          <h2 id="ai-intent-title">What are you trying to do?</h2>
          <p>Choose the decision you need to make. You can change pathways later without losing the model record.</p>
        </div>
      </div>
      <div className="aiIntentGrid">
        <article className="aiIntentCard">
          <div className="aiIntentIcon"><TrendingUp size={21}/></div>
          <span className="aiIntentEyebrow">ALREADY SELECTED / IN USE</span>
          <h3>Assess one AI system</h3>
          <p>Use this when you already have a product or model in mind, including vendor-hosted AI. No comparison is required.</p>
          <button type="button" onClick={chooseSingle}>Assess this AI system →</button>
        </article>
        <article className="aiIntentCard" data-demo-target="ai-procure-card">
          <div className="aiIntentIcon"><TrendingUp size={21}/></div>
          <span className="aiIntentEyebrow">CHOOSING BETWEEN OPTIONS</span>
          <h3>Compare AI systems</h3>
          <p>Hold the clinical question, workload and compute context constant, then compare performance and environmental intensity side by side.</p>
          <button type="button" onClick={chooseCompare}>Compare candidates →</button>
        </article>
        <article className="aiIntentCard" data-demo-target="ai-develop-card">
          <div className="aiIntentIcon"><Cpu size={21}/></div>
          <span className="aiIntentEyebrow">DEVELOP / EVALUATE</span>
          <h3>Assess a model I am developing</h3>
          <p>Characterize training, validation and inference as the model evolves. Prefer measured energy where available.</p>
          <div className="aiIntentMode">
            <button type="button" className={ownMode==='measure'?'active':''} onClick={()=>onOwnMode('measure')}>Help me measure</button>
            <button type="button" className={ownMode==='measured'?'active':''} onClick={()=>onOwnMode('measured')}>I have energy numbers</button>
          </div>
          <button type="button" data-demo-target="ai-develop-action" onClick={chooseDevelop}>Assess this model →</button>
        </article>
      </div>
      <details id="ai-examples" className="aiExamplesDetails">
        <summary>Examples &amp; quick start <small>optional</small></summary>
        <div>
          <p>Load a completed example to explore CEDARS, or start with a blank AI record. Example values are illustrative or literature-derived, not local measurements.</p>
          <div className="quickStartChoices"><button type="button" onClick={onReset}>Start empty</button>{examples.map(ex => <button key={ex.key} type="button" onClick={()=>onExample(ex.key)}>{ex.title}</button>)}</div>
        </div>
      </details>
    </section>
  );
}

export function AiRouteStrip({route, ownMode, onComparison, onBackToComparison, onStartComparison}) {
  const label = route === 'compare' ? 'Comparing AI systems'
    : ownMode === 'spec' ? 'AI already selected / in use'
      : 'Developing / evaluating a model';
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
