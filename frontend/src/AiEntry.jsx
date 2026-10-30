import React, {useState} from 'react';
import {Search, Columns3, Cpu} from 'lucide-react';
import {Ref} from './Refs.jsx';
import {VOLUME_ESTIMATES, VOLUME_ESTIMATE_REF} from './aiExamples.js';

// The first step is the user's task, not a technical taxonomy. Assessment, comparison, and
// development are distinct workflows; measurement is an input method within the lifecycle record.
export const AI_ENTRY_REFS = ['doo-jacr-2024', 'tzanis-maistro-2025', 'chambon-roentgen-2022', 'doo-jacr-cloud-2024', 'jia-eurradiol-2026', 'jegham-llm-2025', 'fernandez-llm-energy-2025', 'oviedo-inference-2025', 'kpodzro-haip-2026'];

const q = {fontSize:13, fontWeight:700, color:'#2F6B57', margin:'0 0 6px'};
const inset = {background:'#fff', border:'1px solid #D8DEDA', borderRadius:10, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10};

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

const ENTRY_CHOICES = [
  {key:'assess', eyebrow:'ASSESS', title:'Assess one model', desc:'A model is already selected, purchased, or deployed.', icon:Search, tone:'clinical'},
  {key:'compare', eyebrow:'COMPARE', title:'Compare candidates', desc:'Evaluate two or more models for the same clinical need.', icon:Columns3, tone:'evidence'},
  {key:'develop', eyebrow:'DEVELOP', title:'Develop / fine-tune', desc:'Build, adapt, fine-tune, or materially retrain a model.', icon:Cpu, tone:'technical'},
];

function exampleKind(ex) {
  if (ex.key.includes('cxr')) return ['cxr','CXR'];
  if (ex.key.includes('maistro')) return ['agent','AGENT'];
  if (ex.key.includes('roentgen')) return ['image','GEN'];
  return ['llm','LLM'];
}

function exampleUse(ex) {
  if (ex.scen?.aiRoute==='compare') return 'Compare candidates';
  if (ex.scen?.ownMode==='spec') return 'Assess one model';
  return 'Develop / measured';
}

export function AiEntryStep({route, ownMode, systemType, onSystemType, onRoute, onOwnMode, examples, onExample, onReset}) {
  const [lane, setLane] = useState('');
  const continueWithSelection = () => {
    if (!lane || !systemType) return;
    if (lane==='compare') {
      onOwnMode('spec');
      onRoute('compare');
      return;
    }
    if (lane==='assess') {
      onOwnMode('spec');
      onRoute('own');
      return;
    }
    onOwnMode('measured');
    onRoute('own');
  };
  const filtered = systemType ? examples.filter(ex => !ex.scen?.aiSystemType || ex.scen.aiSystemType===systemType) : examples;
  return (
    <section className="aiIntentStart aiEntryRedesign" aria-labelledby="ai-intent-title">
      <div className="aiIntentHeader aiEntryHero">
        <span className="aiIntentKicker">START HERE</span>
        <div>
          <h2 id="ai-intent-title">What would you like to do?</h2>
          <p>Choose the task first. CEDARS will then ask only for the model and lifecycle information needed for that workflow.</p>
        </div>
      </div>

      <div className="aiIntentGrid aiTaskLaneGrid" role="group" aria-label="AI task">
        {ENTRY_CHOICES.map(choice=>{
          const Icon=choice.icon;
          const active=lane===choice.key;
          return <button key={choice.key} type="button" data-demo-target={`ai-${choice.key}-lane`} className={`aiIntentCard aiTaskLane ${choice.tone} ${active?'active':''}`} aria-pressed={active} onClick={()=>setLane(choice.key)}>
            <span className="aiIntentIcon"><Icon size={21}/></span>
            <span className="aiIntentEyebrow">{choice.eyebrow}</span>
            <strong>{choice.title}</strong>
            <small>{choice.desc}</small>
            <b>{active?'Selected':'Select →'}</b>
          </button>;
        })}
      </div>

      {lane && <div className="aiLaneDetail aiTypeStep" data-demo-target="ai-lane-detail">
        <div className="aiLaneDetailHeader">
          <span>STEP 2 · AI TYPE</span>
          <strong>What kind of AI is this?</strong>
          <small>This separates image-model workloads from language, multimodal, and agentic workloads.</small>
        </div>
        <div className="aiSystemChoiceGrid" role="group" aria-label="AI system family">
          {SYSTEM_CHOICES.map(([key,title,desc]) => (
            <button key={key} type="button" className={`aiSystemChoice ${systemType===key?'active':''}`} aria-pressed={systemType===key} onClick={()=>onSystemType(key)}>
              <strong>{title}</strong><small>{desc}</small>
            </button>
          ))}
        </div>
        <div className="aiEntryContinueRow">
          <span>{!systemType?'Choose an AI type to continue.':'You can enter a blank profile or load a worked example below.'}</span>
          <button type="button" disabled={!systemType} onClick={continueWithSelection}>Continue with a blank profile →</button>
        </div>
      </div>}

      <section id="ai-examples" className="aiExamplesGuide aiExamplesExpanded">
        <div className="aiExamplesGuideHeader">
          <span>OPTIONAL STARTING POINTS</span>
          <div><strong>Worked examples</strong><p>Load a complete example and replace its values with your own. Examples are illustrative or literature-derived and never become evidence for a different model automatically.</p></div>
        </div>
        <div className="aiExampleChoiceGrid aiExampleChoiceGridExpanded">
          {filtered.map(ex=>{
            const [kind,label]=exampleKind(ex);
            return <button key={ex.key} type="button" className="aiExampleChoice aiExampleChoiceVisual" onClick={()=>onExample(ex.key)}>
              <span className={`aiExampleThumb ${kind}`} aria-hidden="true"><b>{label}</b></span>
              <span className="aiExampleChoiceCopy"><strong>{ex.title}</strong><small>{exampleUse(ex)} · {ex.scen?.aiSystemType==='foundation'?'LLM / multimodal / agentic':'Imaging AI'}</small><em>{ex.subtitle}</em></span>
              <b className="aiExampleLoad">Load example →</b>
            </button>;
          })}
        </div>
      </section>
    </section>
  );
}

export function AiRouteStrip({route, ownMode, systemType, onComparison, onBackToComparison, onStartComparison}) {
  const family = systemType === 'imaging' ? 'Imaging AI'
    : systemType === 'foundation' ? 'LLM / multimodal / agentic AI'
      : 'AI system';
  const label = route === 'compare' ? `Compare candidates · ${family}`
    : ownMode === 'spec' ? `Assess one model · ${family}`
      : `Develop / fine-tune · ${family}`;
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
