import React, {useState, useEffect} from 'react';
/* CEDARS_CHUNK_9L_AI_WORKFLOW_UNIFICATION */
/* CEDARS_CHUNK_9K_NAV_AI_DARKMODE_CLEANUP */
/* CEDARS_CHUNK_9J_AI_RESULT_CONSOLIDATION */
/* CEDARS_CHUNK_9I4_REPAIR */
/* CEDARS_CHUNK_9I3_REPORT_DEPT_AI_CLEANUP */
import {Search, Columns3, Cpu, Scan, Brain, Bot} from 'lucide-react';
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
  {key:'assess', eyebrow:'USE / DEPLOYMENT', title:'Assess one model', desc:'Review one selected, purchased, or deployed model.', icon:Search, tone:'clinical'},
  {key:'compare', eyebrow:'PROCUREMENT / SELECTION', title:'Compare candidates', desc:'Choose among models for the same clinical need.', icon:Columns3, tone:'evidence'},
  {key:'develop', eyebrow:'DEVELOPMENT / RESEARCH', title:'Develop / train / fine-tune', desc:'Build, adapt, fine-tune, or materially retrain a model.', icon:Cpu, tone:'technical'},
];

function exampleKind(ex) {
  if (ex.key.includes('cxr')) return [Scan,'cxr','Imaging AI'];
  if (ex.key.includes('maistro')) return [Bot,'agent','Agentic'];
  if (ex.key.includes('roentgen')) return [Scan,'image','Generative imaging'];
  return [Brain,'llm','LLM'];
}

function exampleLane(ex) {
  const key=String(ex.key||'').toLowerCase();
  const title=String(ex.title||'').toLowerCase();
  if (key.includes('maistro')) return 'compare';
  if (key.includes('roentgen') || key.includes('cxr')) return 'develop';
  if (title.includes('vendor') || title.includes('published') || title.includes('open-source') || title.includes('open source') || key.includes('vendor') || key.includes('open')) return 'assess';
  if (ex.scen?.aiRoute === 'compare') return 'compare';
  if (ex.scen?.ownMode === 'spec') return 'assess';
  return 'develop';
}

function exampleUse(ex) {
  const lane=exampleLane(ex);
  if (lane==='compare') return 'Compare candidates';
  if (lane==='assess') return 'Assess one model';
  return 'Develop / train / fine-tune';
}


export function AiExamplesUtility({examples, onExample, activePathway=''}) {
  const [open, setOpen] = useState(true);
  const lanes = [
    {key:'develop', eyebrow:'DEVELOP / TRAIN', title:'Build or adapt a model', note:'Training, fine-tuning, or generative-model development.'},
    {key:'assess', eyebrow:'ASSESS / DEPLOY', title:'Review an externally developed model', note:'Same task, two common delivery variants: inspectable/open vs vendor-hosted.'},
    {key:'compare', eyebrow:'COMPARE CANDIDATES', title:'Choose among systems', note:'Use only when multiple candidates address the same clinical need.'},
  ];
  const variant = ex => {
    const key=String(ex.key||'').toLowerCase(), title=String(ex.title||'').toLowerCase();
    if(key.includes('roentgen')) return 'GENERATIVE IMAGING';
    if(key.includes('maistro')) return 'MULTI-MODEL / AGENTIC';
    if(key.includes('cxr')) return 'MEASURED DEVELOPMENT';
    if(title.includes('vendor') || key.includes('vendor')) return 'VENDOR-HOSTED';
    if(title.includes('published') || title.includes('open') || key.includes('open')) return 'OPEN / SELF-HOSTED';
    return 'WORKED EXAMPLE';
  };
  return <details className={`aiExamplesUtility aiExamplesGrouped ${activePathway?'pathwayActive':''}`} open={open} onToggle={e=>setOpen(e.currentTarget.open)}>
    <summary title="Load illustrative or literature-derived sample data">
      <span className="aiExamplesUtilitySignal">ILLUSTRATIVE QUICK STARTS</span>
      <span className="aiExamplesUtilityCopy"><strong>{activePathway?'Worked examples':'Start from an AI example'}</strong><small>{activePathway?'Illustrative examples open by default; collapse them whenever you want more working space.':'Choose an example by task. Loading it selects the matching pathway and fills an editable record.'}</small></span>
      <b>{open?'Hide examples ↑':'Browse examples ↓'}</b>
    </summary>
    <div className="aiExamplesGroupedPanel">
      {lanes.map(lane=>{
        const laneExamples=examples.filter(ex=>exampleLane(ex)===lane.key);
        if(!laneExamples.length) return null;
        return <section key={lane.key} className={`aiExampleLane aiExampleLane-${lane.key}`}>
          <div className="aiExampleLaneHead"><span>{lane.eyebrow}</span><strong>{lane.title}</strong><small>{lane.note}</small></div>
          <div className="aiExampleLaneCards">
            {laneExamples.map(ex=>{
              const [Icon,kind]=exampleKind(ex);
              return <button key={ex.key} type="button" className="aiExampleCard" onClick={()=>onExample(ex.key)}>
                <span className={`aiExampleThumb ${kind}`} aria-hidden="true"><Icon size={18}/></span>
                <span className="aiExampleCardCopy"><em>{variant(ex)}</em><strong>{ex.title}</strong><small>{exampleUse(ex)} · {ex.scen?.aiSystemType==='foundation'?'LLM / multimodal / agentic':'Imaging AI'}</small></span>
                <b>Load →</b>
              </button>;
            })}
          </div>
        </section>;
      })}
    </div>
  </details>;
}

export function AiEntryStep({route, ownMode, systemType, onSystemType, onRoute, onOwnMode}) {
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
  const laneTitle=ENTRY_CHOICES.find(choice=>choice.key===lane)?.title || 'selected pathway';
  const renderChoice=choice=>{
    const Icon=choice.icon;
    const active=lane===choice.key;
    return <button key={choice.key} type="button" data-demo-target={`ai-${choice.key}-lane`} className={`aiIntentCard aiTaskLane ${choice.tone} ${active?'active':''}`} aria-pressed={active} onClick={()=>setLane(choice.key)}>
      <span className="aiIntentIcon"><Icon size={21}/></span>
      <span className="aiIntentEyebrow">{choice.eyebrow}</span>
      <strong>{choice.title}</strong>
      <small>{choice.desc}</small>
      <b>{active?'Selected':'Select →'}</b>
    </button>;
  };
  return (
    <section className="aiIntentStart aiEntryRedesign" aria-labelledby="ai-intent-title">
      <div className="aiIntentHeader aiEntryHero">
        <span className="aiIntentKicker">STEP 1 · PATHWAY</span>
        <div>
          <h2 id="ai-intent-title">What would you like to do?</h2>
          <p>Choose the task first. CEDARS will then ask only for the model and lifecycle information needed for that workflow.</p>
        </div>
      </div>

      <div className="aiRoleTaskGrid" aria-label="AI role and task">
        <section className="aiRoleGroup aiClinicalRoleGroup">
          <div className="aiRoleGroupHeader"><span>CLINICAL USE &amp; SELECTION</span><small>For teams using, deploying, or choosing AI for care.</small></div>
          <div className="aiIntentGrid aiTaskLaneGrid aiClinicalTaskGrid" role="group" aria-label="Clinical use and selection">
            {ENTRY_CHOICES.filter(choice=>choice.key!=='develop').map(renderChoice)}
          </div>
        </section>
        <section className="aiRoleGroup aiTechnicalRoleGroup">
          <div className="aiRoleGroupHeader"><span>TECHNICAL DEVELOPMENT</span><small>For research and engineering teams building AI.</small></div>
          <div className="aiIntentGrid aiTaskLaneGrid aiTechnicalTaskGrid" role="group" aria-label="Technical development">
            {ENTRY_CHOICES.filter(choice=>choice.key==='develop').map(renderChoice)}
          </div>
        </section>
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
          <span><strong>STEP 3 · CONTINUE</strong>{!systemType?'Choose an AI type above.':`Continue into ${laneTitle}.`}</span>
          <button type="button" disabled={!systemType} onClick={continueWithSelection}>Continue to {laneTitle} →</button>
        </div>
      </div>}


    </section>
  );
}

export function AiRouteStrip({route, ownMode, systemType, onComparison, onBackToComparison, onStartComparison}) {
  const family = systemType === 'imaging' ? 'Imaging AI'
    : systemType === 'foundation' ? 'LLM / multimodal / agentic AI'
      : 'AI system';
  const label = route === 'compare' ? `Compare candidates · ${family}`
    : ownMode === 'spec' ? `Assess one model · ${family}`
      : `Develop / train / fine-tune · ${family}`;
  return (
    <div className="aiRouteStrip">
      <span className="aiIntentKicker">AI TASK</span>
      <strong>{label}</strong>
      <span className="aiRouteActions">
        {route === 'compare' && <button type="button" className="inlineTextButton" onClick={onComparison}>Choose a candidate ↓</button>}
        {route === 'own' && ownMode === 'spec' && onBackToComparison && <button type="button" className="inlineTextButton" onClick={onBackToComparison}>← Back to candidate comparison</button>}
        {route === 'own' && ownMode === 'spec' && !onBackToComparison && onStartComparison && <button type="button" className="inlineTextButton" onClick={onStartComparison}>Compare this model with candidates →</button>}
      </span>
    </div>
  );
}
