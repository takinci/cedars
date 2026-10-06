import React, {useState} from 'react';
import {TrendingUp, Cpu, AlertTriangle} from 'lucide-react';
import {Ref} from './Refs.jsx';
import {VOLUME_ESTIMATES, VOLUME_ESTIMATE_REF} from './aiExamples.js';

// The first thing on the AI Model & Informatics page: which route the visitor is on.
//   compare → choose/deploy clinically: candidate benchmark under one deployment context
//   own + spec → choose/deploy clinically: one already-selected model
//   own + measured/measure → development: characterize a model being trained or developed
// Both routes grade the same record shape; the choice only decides what the page shows first.
export const AI_ENTRY_REFS = ['doo-jacr-2024', 'tzanis-maistro-2025', 'chambon-roentgen-2022', 'doo-jacr-cloud-2024', 'jia-eurradiol-2026', 'jegham-llm-2025', 'fernandez-llm-energy-2025', 'oviedo-inference-2025', 'kpodzro-haip-2026'];

const seg = (on) => ({
  display:'inline-flex', alignItems:'center', gap:6, minHeight:36, padding:'0 12px', borderRadius:999,
  border:`1px solid ${on?'#2E7D32':'#c8e6c9'}`, background:on?'#2E7D32':'#fff', color:on?'#fff':'#1b3a22',
  fontSize:12, cursor:'pointer', fontWeight:on?700:500, boxShadow:'none',
});
const q = {fontSize:12, fontWeight:700, color:'#2E7D32', margin:'0 0 6px'};
const inset = {background:'#f7fbf8', border:'1px solid #e0efe2', borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10};
const card = {background:'#fff', border:'1px solid #c8e6c9', borderRadius:16, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12};
const kicker = {display:'inline-block', fontSize:11, fontWeight:700, letterSpacing:'.04em', padding:'3px 10px', borderRadius:999, background:'#fff', border:'1px solid #c8e6c9', color:'#1b5e20', marginBottom:4};

export function AiDeploymentContext({ctxSource, dept, volume, onCtxSource, onVolume}) {
  const hasDeptVolume = dept.studiesPerMonth > 0;
  const custom = ctxSource === 'custom';
  return (
    <div style={{...inset, gap:8}}>
      <div>
        <p style={q}>Expected deployment workload</p>
        <p className="note" style={{margin:0}}>
          Every candidate is compared at the same monthly study volume. Start with a published small/large-practice estimate, use the Radiology Department volume already in CEDARS, or enter your own.<Ref id={VOLUME_ESTIMATE_REF} order={AI_ENTRY_REFS}/>
        </p>
      </div>
      <div style={{display:'flex', flexWrap:'wrap', gap:6, alignItems:'center'}}>
        {VOLUME_ESTIMATES.map(v => (
          <button key={v.key} type="button" style={seg(ctxSource===v.key)} onClick={()=>onCtxSource(v.key)}>
            {v.label} · {v.studiesPerMonth.toLocaleString()}/mo{v.key==='small' ? ' · default' : ''}
          </button>
        ))}
        {hasDeptVolume && (
          <button type="button" style={seg(ctxSource==='department')} onClick={()=>onCtxSource('department')}>
            My Radiology Department · {dept.studiesPerMonth.toLocaleString()}/mo
          </button>
        )}
        <button type="button" style={seg(custom)} onClick={()=>onCtxSource('custom')}>Enter my own</button>
      </div>
      {custom && (
        <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:700, color:'#1b3a22', maxWidth:300}}>
          Studies / month
          <input type="number" min="0" value={volume} placeholder="e.g. 8,000" onChange={e=>onVolume(e.target.value)} style={{width:120, minHeight:34, padding:'0 8px', border:'1px solid #c8e6c9', borderRadius:8, fontSize:12}}/>
        </label>
      )}
      {!hasDeptVolume && (
        <p className="note" style={{margin:0}}>No Radiology Department volume is available yet, so that option is hidden rather than silently substituting a practice estimate.</p>
      )}
      <p className="note" style={{margin:0}}>
        These are workload assumptions, not compute-location assumptions. Provider and compute region are set separately and applied consistently to every candidate.
      </p>
    </div>
  );
}

export function AiEntryStep({route, ownMode, basis, ctxSource, dept, volume, onRoute, onOwnMode, onBasis, onCtxSource, onVolume, examples, onExample, onReset}) {
  const [systemType, setSystemType] = useState('');
  const [deployMode, setDeployMode] = useState('');
  const systemCard = key => ({
    ...inset, cursor:'pointer', textAlign:'left', width:'100%', boxShadow:'none',
    border:`1.5px solid ${systemType===key?'#2E7D32':'#e0efe2'}`,
    background:systemType===key?'#f1f8f2':'#f7fbf8', color:'#1b3a22',
  });
  return (
    <div style={{border:'2px solid #2E7D32', borderRadius:16, padding:'20px 22px', background:'#fff', display:'flex', flexDirection:'column', gap:14}}>
      <div id="ai-examples" className="quickStartNotice" style={{marginBottom:2}}>
        <AlertTriangle size={17}/><div>
          <strong>Quick start or begin with an empty model</strong>
          <p>{examples.length} completed examples show the model record, footprint calculation, EcoLabel, and reporting workflow. Published values are used where available; assumptions are marked as estimates.</p>
          <div className="quickStartChoices"><button type="button" onClick={onReset}>Start empty</button>{examples.map(ex => <button key={ex.key} type="button" onClick={()=>onExample(ex.key)}>{ex.title}</button>)}</div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'baseline',gap:12,flexWrap:'wrap'}}><span style={{...kicker,background:'#e8f5e9',border:'none',marginBottom:0}}>START HERE</span><h2 style={{margin:0,fontSize:19}}>What do you want to do?</h2></div>
      <p className="note" style={{margin:0}}>Use <strong>Development</strong> for a model you are training or developing. Use <strong>Choose / deploy clinically</strong> for a model you are receiving, evaluating, purchasing, or preparing for clinical use. Candidate comparison is optional.<Ref id="doo-jacr-2024" order={AI_ENTRY_REFS}/><Ref id="kpodzro-haip-2026" order={AI_ENTRY_REFS}/></p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.25fr',gap:16}} className="aiEntryGrid">
        <div style={{...card,order:2,borderColor:(route==='compare'||(route==='own'&&ownMode==='spec'))?'#2E7D32':'#c8e6c9'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}><TrendingUp size={20} style={{color:'#2E7D32',flexShrink:0}}/><div><span style={kicker}>CHOOSE · DEPLOY</span><br/><strong style={{fontSize:16}}>Choose or deploy a model clinically</strong></div></div>
          <p className="note" style={{margin:0}}>For AI you are receiving, evaluating, purchasing, or preparing for clinical use. First identify the system type; then continue with one selected model or open a like-for-like candidate comparison.<Ref id="kpodzro-haip-2026" order={AI_ENTRY_REFS}/></p>
          <div><p style={q}>1 · What kind of AI system are you evaluating?</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8}}>
            <button type="button" style={systemCard('imaging')} onClick={()=>setSystemType('imaging')}><strong style={{fontSize:12,color:'#1b5e20'}}>Single-task imaging AI</strong><span className="note" style={{fontSize:11,marginTop:4}}>Classification, detection, segmentation, reconstruction, or another relatively constrained imaging task. Compare the same clinical task, endpoint, metric, validation cohort, and workload.</span></button>
            <button type="button" style={systemCard('foundation')} onClick={()=>setSystemType('foundation')}><strong style={{fontSize:12,color:'#1b5e20'}}>LLM / foundation / agentic systems</strong><span className="note" style={{fontSize:11,marginTop:4}}>Language, vision-language, multimodal foundation, or multi-call agentic systems. Keep the clinical task and endpoint comparable, and also align token volume, calls, reasoning, batching, caching, and serving assumptions.<Ref id="jegham-llm-2025" order={AI_ENTRY_REFS}/><Ref id="fernandez-llm-energy-2025" order={AI_ENTRY_REFS}/><Ref id="oviedo-inference-2025" order={AI_ENTRY_REFS}/></span></button>
          </div></div>
          <div style={{...inset,opacity:systemType?1:0.65}}><p style={q}>2 · What are you doing?</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button type="button" disabled={!systemType} style={seg(deployMode==='one')} onClick={()=>setDeployMode('one')}>Use one selected model</button>
            <button type="button" disabled={!systemType} style={seg(deployMode==='compare')} onClick={()=>setDeployMode('compare')}>Compare candidates</button>
          </div>{!systemType&&<p className="note" style={{margin:0,fontSize:11}}>Choose the system type above first so CEDARS can show the relevant assumptions.</p>}</div>
          {systemType&&deployMode==='one'&&<div style={{...inset,borderColor:'#c8e6c9'}}><p style={q}>One model already selected</p><p className="note" style={{margin:0}}>Go directly to the shared model record. Deployment workload and local use are entered where they are actually used, rather than as comparison assumptions.</p><div><button type="button" onClick={()=>{onOwnMode('spec');onRoute('own');}}>Continue to model details →</button></div></div>}
          {systemType&&deployMode==='compare'&&<div style={{...inset,borderColor:'#c8e6c9'}}><p style={{...q,fontSize:13}}>Comparison settings</p><div><p style={q}>Carbon basis</p><div style={{display:'flex',flexWrap:'wrap',gap:6}}><button type="button" style={seg(basis!=='inference')} onClick={()=>onBasis('amortised')}>Include an amortized share of training</button><button type="button" style={seg(basis==='inference')} onClick={()=>onBasis('inference')}>Inference only — training unavailable</button></div></div><AiDeploymentContext ctxSource={ctxSource} dept={dept} volume={volume} onCtxSource={onCtxSource} onVolume={onVolume}/><div><button type="button" onClick={()=>onRoute('compare')}>Start candidate comparison →</button></div></div>}
        </div>
        <div style={{...card,order:1,borderColor:(route==='own'&&ownMode!=='spec')?'#2E7D32':'#c8e6c9'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}><Cpu size={20} style={{color:'#2E7D32',flexShrink:0}}/><div><span style={kicker}>DEVELOPMENT</span><br/><strong style={{fontSize:16}}>Characterize a model you are developing</strong></div></div>
          <p className="note" style={{margin:0}}>For a model your team is training or developing. Record its measured or estimated training and inference footprint as the model evolves, with provenance for the values you report.</p>
          <div style={inset}><p style={q}>How do you want to characterize it?</p>{[['measured','I have measured energy numbers','Enter kWh per training run and Wh (or tokens) per study. These fields carry a Measured badge on your label.'],['measure','Help me measure','Three questions about your setup lead to the right open-source tool, with what each one fills in.']].map(([key,title,desc])=><label key={key} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 12px',border:`1px solid ${ownMode===key?'#2E7D32':'#c8e6c9'}`,borderRadius:12,background:ownMode===key?'#f1f8f2':'#fff',cursor:'pointer',boxShadow:ownMode===key?'inset 0 0 0 1px #2E7D32':'none',flexDirection:'row',fontWeight:400}}><input type="radio" name="ai-own-mode" checked={ownMode===key} onChange={()=>onOwnMode(key)} style={{marginTop:3,accentColor:'#2E7D32'}}/><span><strong style={{display:'block',fontSize:14,color:'#1b3a22'}}>{title}</strong><span className="note" style={{display:'block',fontSize:12,marginTop:2}}>{desc}</span></span></label>)}</div>
          <div><button type="button" className={(route==='own'&&ownMode!=='spec')?'':'download'} onClick={()=>{if(ownMode==='spec')onOwnMode('measured');onRoute('own');}}>Characterize this model →</button></div>
        </div>
      </div>
    </div>
  );
}

// Compact strip shown once a route is chosen.
export function AiRouteStrip({route, ownMode, onComparison, onChange}) {
  const label = route === 'compare' ? 'Choose · deploy — Compare candidates'
    : ownMode === 'spec' ? 'Choose · deploy — One selected model'
      : `Development — ${ownMode === 'measured' ? 'measured numbers' : 'help me measure'}`;
  return (
    <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', border:'1px solid #c8e6c9', borderRadius:12, padding:'8px 14px', background:'#fff'}}>
      <span style={{...kicker, background:'#e8f5e9', border:'none', marginBottom:0}}>AI PATHWAY</span>
      <strong style={{fontSize:13}}>{label}</strong>
      <span style={{marginLeft:'auto', display:'flex', gap:14, alignItems:'center'}}>
        {route === 'compare' && <button type="button" className="inlineTextButton" onClick={onComparison}>View candidate comparison ↓</button>}
        <button type="button" className="inlineTextButton" onClick={onChange}>Change pathway</button>
      </span>
    </div>
  );
}
