import React from 'react';
import {TrendingUp, Cpu} from 'lucide-react';
import {Ref} from './Refs.jsx';
import {VOLUME_ESTIMATES, VOLUME_ESTIMATE_REF} from './aiExamples.js';

// The first thing on the AI Model & Informatics page: which route the visitor is on.
//   compare → procure/deploy: library templates + benchmark under one deployment context
//   own     → develop: one model record, three ways in (measured · measure · spec)
// Both routes grade the same record shape; the choice only decides what the page shows first.
export const AI_ENTRY_REFS = ['doo-jacr-2024', 'tzanis-maistro-2025', 'chambon-roentgen-2022', 'doo-jacr-cloud-2024', 'jia-eurradiol-2026'];

const seg = (on) => ({
  display:'inline-flex', alignItems:'center', gap:6, minHeight:36, padding:'0 12px', borderRadius:999,
  border:`1px solid ${on?'#2E7D32':'#c8e6c9'}`, background:on?'#2E7D32':'#fff', color:on?'#fff':'#1b3a22',
  fontSize:12, cursor:'pointer', fontWeight:on?700:500, boxShadow:'none',
});
const q = {fontSize:12, fontWeight:700, color:'#2E7D32', margin:'0 0 6px'};
const inset = {background:'#f7fbf8', border:'1px solid #e0efe2', borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10};
const card = {background:'#fff', border:'1px solid #c8e6c9', borderRadius:16, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12};
const kicker = {display:'inline-block', fontSize:11, fontWeight:700, letterSpacing:'.04em', padding:'3px 10px', borderRadius:999, background:'#fff', border:'1px solid #c8e6c9', color:'#1b5e20', marginBottom:4};

export function AiEntryStep({route, ownMode, basis, ctxSource, dept, volume, onRoute, onOwnMode, onBasis, onCtxSource, onVolume, examples, onExample}) {
  const hasVolume = dept.studiesPerMonth > 0;
  return (
    <div style={{border:'2px solid #2E7D32', borderRadius:16, padding:'20px 22px', background:'#fff', display:'flex', flexDirection:'column', gap:14}}>
      <div style={{display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap'}}>
        <span style={{...kicker, background:'#e8f5e9', border:'none', marginBottom:0}}>START HERE</span>
        <h2 style={{margin:0, fontSize:19}}>What do you want to do?</h2>
      </div>
      <p className="note" style={{margin:0}}>
        Either route gives each model its own CEDARS Score, leaf rating and AI Research Label, shown live in the top-right badge and calculated the same way, following the lifecycle framework in Doo et al.<Ref id="doo-jacr-2024" order={AI_ENTRY_REFS}/> Choose the route that matches what you have in hand — or, if you are not sure where to start, <a href="#ai-examples" style={{color:'#2E7D32'}}>see an example ↓</a>
      </p>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1.25fr', gap:16}} className="aiEntryGrid">
        {/* Procure / deploy */}
        <div style={{...card, borderColor: route==='compare' ? '#2E7D32' : '#c8e6c9'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <TrendingUp size={20} style={{color:'#2E7D32', flexShrink:0}}/>
            <div><span style={kicker}>PROCURE · DEPLOY</span><br/><strong style={{fontSize:16}}>Compare candidate models</strong></div>
          </div>
          <p className="note" style={{margin:0}}>For choosing, buying or deploying a model someone else built. Start from literature-anchored task-family templates, set the deployment conditions once, and read the accuracy-versus-carbon trade-off on a benchmark chart.</p>
          <div style={inset}>
            <div>
              <p style={q}>How should the models be ranked?</p>
              <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                <button type="button" style={seg(basis!=='inference')} onClick={()=>onBasis('amortised')}>Carbon per study, including a share of training</button>
                <button type="button" style={seg(basis==='inference')} onClick={()=>onBasis('inference')}>Carbon per study, inference only — training unknown</button>
              </div>
            </div>
            <div>
              <p style={q}>Where would the models run?</p>
              <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                <button type="button" style={seg(ctxSource==='department')} onClick={()=>onCtxSource('department')}>
                  The department in CEDARS — {dept.region} · {dept.ci} kgCO₂e/kWh · {hasVolume ? `${dept.studiesPerMonth.toLocaleString()} studies/mo` : 'no study volume yet'}
                </button>
                <button type="button" style={seg(ctxSource==='manual')} onClick={()=>onCtxSource('manual')}>Another site — I'll set region and study volume</button>
              </div>
              {(ctxSource==='manual' || !hasVolume) && (
                <div style={{marginTop:8}}>
                  <p style={{...q, marginBottom:4}}>Study volume {!hasVolume && ctxSource==='department' ? <span style={{fontWeight:400, color:'#455a64'}}>— none entered under Radiology Department, so a published estimate is used until you add equipment there</span> : null}</p>
                  <div style={{display:'flex', flexWrap:'wrap', gap:6, alignItems:'center'}}>
                    {VOLUME_ESTIMATES.map(v => (
                      <button key={v.key} type="button" style={seg(volume===String(v.studiesPerMonth))} onClick={()=>onVolume(String(v.studiesPerMonth))}>{v.label} · {v.studiesPerMonth.toLocaleString()}/mo</button>
                    ))}
                    <label style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#1b3a22'}}>My own:
                      <input type="number" min="0" value={VOLUME_ESTIMATES.some(v=>String(v.studiesPerMonth)===volume) ? '' : volume} placeholder="studies/mo" onChange={e=>onVolume(e.target.value)} style={{width:110, minHeight:34, padding:'0 8px', border:'1px solid #c8e6c9', borderRadius:8, fontSize:12}}/>
                    </label>
                  </div>
                  <p className="note" style={{margin:'6px 0 0'}}>The two presets are published monthly volumes for a small and a large US practice<Ref id={VOLUME_ESTIMATE_REF} order={AI_ENTRY_REFS}/>; the small practice is the default. Please replace them with your own study counts whenever you can.</p>
                </div>
              )}
            </div>
          </div>
          <div style={{marginTop:'auto'}}><button type="button" className={route==='compare'?'':'download'} onClick={()=>onRoute('compare')}>Compare models →</button></div>
        </div>

        {/* Develop */}
        <div style={{...card, borderColor: route==='own' ? '#2E7D32' : '#c8e6c9'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <Cpu size={20} style={{color:'#2E7D32', flexShrink:0}}/>
            <div><span style={kicker}>DEVELOP</span><br/><strong style={{fontSize:16}}>Assess my own model</strong></div>
          </div>
          <p className="note" style={{margin:0}}>For a model you have trained or built. Create a reproducible disclosure for a manuscript, model card or regulatory submission.</p>
          <div style={inset}>
            <p style={q}>What do you have for it?</p>
            {[
              ['measured', 'I have measured energy numbers', 'Enter kWh per training run and Wh (or tokens) per study. These fields carry a Measured badge on your label.'],
              ['measure',  'Help me measure', 'Three questions about your setup lead to the right open-source tool, with what each one fills in.'],
              ['spec',     'I only have a specification sheet or a vendor tool', 'Parameters, resolution, GPU and hours — or inference only, if the vendor does not disclose training. Badged Estimated; replace with measured values when you have them.'],
            ].map(([key, title, desc]) => (
              <label key={key} style={{display:'flex', alignItems:'flex-start', gap:12, padding:'10px 12px', border:`1px solid ${ownMode===key?'#2E7D32':'#c8e6c9'}`, borderRadius:12, background:ownMode===key?'#f1f8f2':'#fff', cursor:'pointer', boxShadow: ownMode===key ? 'inset 0 0 0 1px #2E7D32' : 'none', flexDirection:'row', fontWeight:400}}>
                <input type="radio" name="ai-own-mode" checked={ownMode===key} onChange={()=>onOwnMode(key)} style={{marginTop:3, accentColor:'#2E7D32'}}/>
                <span><strong style={{display:'block', fontSize:14, color:'#1b3a22'}}>{title}</strong><span className="note" style={{display:'block', fontSize:12, marginTop:2}}>{desc}</span></span>
              </label>
            ))}
          </div>
          <div><button type="button" className={route==='own'?'':'download'} onClick={()=>onRoute('own')}>Continue →</button></div>
        </div>
      </div>

      {/* See an example */}
      <div id="ai-examples" style={{background:'#f3f4ee', border:'1px solid #dfe3d6', borderRadius:16, padding:'16px 20px', display:'flex', flexDirection:'column', gap:10}}>
        <div style={{display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap'}}>
          <h3 style={{margin:0, fontSize:16}}>See an example</h3>
          <span className="note" style={{margin:0}}>{examples.length} finished assessments, each opening in the route it was made with. Published values are used where available; everything else is marked as an estimate.</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10}}>
          {examples.map(ex => (
            <button key={ex.key} type="button" onClick={()=>onExample(ex.key)}
              style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4, padding:'12px 14px', background:'#fff', border:'1px solid #dfe3d6', borderRadius:12, color:'#1b3a22', minHeight:44, textAlign:'left', boxShadow:'none', fontWeight:400}}>
              <strong style={{fontSize:13}}>{ex.title}{ex.ref && <Ref id={ex.ref} order={AI_ENTRY_REFS}/>}</strong>
              <span className="note" style={{fontSize:12, margin:0}}>{ex.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact strip shown once a route is chosen.
export function AiRouteStrip({route, ownMode, onChange, onLabel}) {
  const label = route === 'compare' ? 'Procure · deploy — Compare candidate models'
    : `Develop — Assess my own model · ${ownMode === 'measured' ? 'measured numbers' : ownMode === 'measure' ? 'help me measure' : 'from specification'}`;
  return (
    <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', border:'1px solid #c8e6c9', borderRadius:12, padding:'8px 14px', background:'#fff'}}>
      <span style={{...kicker, background:'#e8f5e9', border:'none', marginBottom:0}}>ROUTE</span>
      <strong style={{fontSize:13}}>{label}</strong>
      <span style={{marginLeft:'auto', display:'flex', gap:14, alignItems:'center'}}>
        <button type="button" className="inlineTextButton" onClick={onChange}>Change route</button>
        {onLabel && <button type="button" onClick={onLabel} style={{minHeight:36, padding:'0 14px', fontSize:13}}>Full AI Research Label →</button>}
      </span>
    </div>
  );
}
