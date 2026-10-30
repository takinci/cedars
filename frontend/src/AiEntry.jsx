import React, {useState} from 'react';
import {TrendingUp, Cpu} from 'lucide-react';
import {Ref} from './Refs.jsx';
import {VOLUME_ESTIMATES, VOLUME_ESTIMATE_REF} from './aiExamples.js';

// The first thing on the AI Model & Informatics page is the work context, not a technical taxonomy.
// Clinical / operational evaluation includes one-system assessment and candidate comparison.
// Development includes models being built or materially retrained by the user's team.
// aiSystemType then keeps imaging AI separate from LLM / multimodal / agentic workloads.
export const AI_ENTRY_REFS = ['doo-jacr-2024', 'tzanis-maistro-2025', 'chambon-roentgen-2022', 'doo-jacr-cloud-2024', 'jia-eurradiol-2026', 'jegham-llm-2025', 'fernandez-llm-energy-2025', 'oviedo-inference-2025', 'kpodzro-haip-2026'];

const q = {fontSize:13, fontWeight:700, color:'#2E7D32', margin:'0 0 6px'};
const inset = {background:'#fff', border:'1px solid #dfe6df', borderRadius:10, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10};

export function AiDeploymentContext({ctxSource, dept, volume, onCtxSource, onVolume}) {
  const hasDeptVolume = dept.studiesPerMonth > 0;
  const custom = ctxSource === 'custom';
  return (
    <div style={{...inset, gap:10}}>
      <div>
        <p style={q}>Expected deployment workload</p>
        <p className="note" style={{margin:0}}>
          Compare every candidate at the same monthly workload.<Ref id={VOLUME_ESTIMATE_REF} order={AI_ENTRY_REFS}/>
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
        Compute provider and region are set separately and held constant across candidates.
      </p>
    </div>
  );
}

const SYSTEM_CHOICES = [
  ['imaging', 'Imaging AI', 'Detection, classification, segmentation, reconstruction, or image generation.'],
  ['foundation', 'LLM / multimodal / agentic AI', 'LLMs, multimodal models, copilots, or agentic workflows.'],
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
          <h2 id="ai-intent-title">How are you using AI?</h2>
          <p>Choose the path that fits your work.</p>
        </div>
      </div>

      <div className="aiIntentGrid aiRoleGrid" role="group" aria-label="AI work context">
        <button type="button" data-demo-target="ai-clinical-lane" className={`aiIntentCard aiIntentLane ${lane==='clinical'?'active':''}`} aria-pressed={lane==='clinical'} onClick={()=>setLane('clinical')}>
          <span className="aiIntentIcon"><TrendingUp size={21}/></span>
          <span className="aiIntentEyebrow">CLINICAL USE</span>
          <strong>Clinical use</strong>
          <small>Assess an existing system or compare candidates for clinical deployment.</small>
          <b>{lane==='clinical'?'Selected':'Choose →'}</b>
        </button>
        <button type="button" data-demo-target="ai-developer-lane" className={`aiIntentCard aiIntentLane ${lane==='develop'?'active':''}`} aria-pressed={lane==='develop'} onClick={()=>setLane('develop')}>
          <span className="aiIntentIcon"><Cpu size={21}/></span>
          <span className="aiIntentEyebrow">DEVELOPMENT</span>
          <strong>Development</strong>
          <small>Measure or enter the energy used to develop and run a model.</small>
          <b>{lane==='develop'?'Selected':'Choose →'}</b>
        </button>
      </div>

      {lane && (
        <div className="aiLaneDetail" data-demo-target="ai-lane-detail">
          <div className="aiLaneDetailHeader">
            <span>AI TYPE</span>
            <strong>What type of AI is this?</strong>
          </div>
          <div className="aiSystemChoiceGrid" role="group" aria-label="AI system family">
            {SYSTEM_CHOICES.map(([key,title,desc]) => (
              <button key={key} type="button" className={`aiSystemChoice ${systemType===key?'active':''}`} aria-pressed={systemType===key} onClick={()=>onSystemType(key)}>
                <strong>{title}</strong><small>{desc}</small>
              </button>
            ))}
          </div>

          <div className={`aiTaskChoiceBlock ${systemType?'ready':''}`}>
            <span>NEXT</span>
            {lane==='clinical' ? (
              <div className="aiTaskChoiceGrid">
                <button type="button" className="aiTaskChoice" disabled={!systemType} onClick={()=>chooseClinical('single')}>
                  <strong>Assess one system</strong>
                  <small>Already selected or deployed.</small>
                  <b>Assess one system →</b>
                </button>
                <button type="button" className="aiTaskChoice" disabled={!systemType} onClick={()=>chooseClinical('compare')}>
                  <strong>Compare systems</strong>
                  <small>Two or more candidates for the same clinical need.</small>
                  <b>Compare systems →</b>
                </button>
              </div>
            ) : (
              <div className="aiTaskChoiceGrid">
                <button type="button" className="aiTaskChoice" disabled={!systemType} onClick={()=>chooseDevelopment('measure')}>
                  <strong>Measure energy</strong>
                  <small>Choose a measurement approach for training or inference.</small>
                  <b>Measure energy →</b>
                </button>
                <button type="button" className="aiTaskChoice" disabled={!systemType} onClick={()=>chooseDevelopment('measured')}>
                  <strong>Enter known energy</strong>
                  <small>Enter energy you already measured or obtained.</small>
                  <b>Enter energy →</b>
                </button>
              </div>
            )}
            {!systemType && <small className="aiTaskChoiceHint">Choose an AI type to continue.</small>}
          </div>
        </div>
      )}

      {(()=>{
        const filtered = systemType ? examples.filter(ex => !ex.scen?.aiSystemType || ex.scen.aiSystemType===systemType) : examples;
        const featured = filtered.slice(0,3), more = filtered.slice(3);
        return <section id="ai-examples" className="aiExamplesGuide">
          <div className="aiExamplesGuideHeader"><span>NEW TO CEDARS?</span><div><strong>Start from an example</strong><p>Load a worked example, then replace its values with your own. Examples are illustrative or literature-derived.</p></div></div>
          <div className="aiExampleChoiceGrid">{featured.map(ex=><button key={ex.key} type="button" className="aiExampleChoice" onClick={()=>onExample(ex.key)}><strong>{ex.title}</strong><small>{ex.scen?.ownMode==='spec'?'Clinical evaluation example':'Development / measured example'}</small><b>Load example →</b></button>)}</div>
          {more.length>0&&<details className="aiExamplesMore"><summary>More examples ({more.length})</summary><div className="quickStartChoices">{more.map(ex=><button key={ex.key} type="button" onClick={()=>onExample(ex.key)}>{ex.title}</button>)}</div></details>}
          <div className="aiExamplesStartBlank"><button type="button" className="download" onClick={onReset}>Start with a blank profile →</button></div>
        </section>;
      })()}
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
