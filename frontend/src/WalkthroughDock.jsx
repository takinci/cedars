// CEDARS_CHUNK_9Q5_TRANSACTION_SAFE_THEME_WALKTHROUGH
// CEDARS_CHUNK_9R16_SEMANTIC_COLOR_WALKTHROUGH_AI_ENTRY
import React, {useEffect, useState} from 'react';
import {Activity, Brain, X} from 'lucide-react';

const JOURNEYS = [
  {key:'leader',icon:Activity,label:'Radiology Department',detail:'Profile current operations and Digital + AI, interpret Result, test scenarios, then report.'},
  {key:'procure',icon:Brain,label:'Clinical AI evaluation',detail:'Compare or assess AI, carry the selected system into Profile, then test deployment choices.'},
  {key:'developer',icon:Brain,label:'AI development',detail:'Measure Training and Deployment, interpret Result, test prospective changes, then report.'},
];

function JourneyButtons({onStart, compact=false}) {
  return <div className={compact?'walkthroughJourneyList compact':'walkthroughJourneyList'}>
    {JOURNEYS.map(journey=>{
      const Icon=journey.icon;
      return <button type="button" key={journey.key} onClick={()=>onStart(journey.key)}>
        <Icon size={17}/><span><strong>{journey.label}</strong>{!compact&&<small>{journey.detail}</small>}</span><b aria-hidden="true">→</b>
      </button>;
    })}
  </div>;
}

export function FirstVisitWalkthroughPrompt({onStart,onSkip}) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    try {
      if (!window.localStorage.getItem('cedars_walkthrough_prompt_seen_v1')) {
        const t=window.setTimeout(()=>setOpen(true),350);
        return ()=>window.clearTimeout(t);
      }
    } catch (_) {
      const t=window.setTimeout(()=>setOpen(true),350);
      return ()=>window.clearTimeout(t);
    }
    return undefined;
  },[]);
  const markSeen=()=>{try{window.localStorage.setItem('cedars_walkthrough_prompt_seen_v1','1');}catch(_){} setOpen(false);};
  const skip=()=>{markSeen();onSkip?.();};
  const start=kind=>{markSeen();onStart?.(kind);};
  if(!open) return null;
  return <div className="firstVisitWalkthroughBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)skip();}}>
    <section className="firstVisitWalkthrough" role="dialog" aria-modal="true" aria-labelledby="first-visit-walkthrough-title">
      <button type="button" className="firstVisitWalkthroughClose" onClick={skip} aria-label="Skip walkthrough"><X size={18}/></button>
      <span className="firstVisitWalkthroughKicker">FIRST VISIT · GUIDED WALKTHROUGH</span>
      <h2 id="first-visit-walkthrough-title">See how CEDARS works before you start</h2>
      <p>Follow an illustrative assessment step by step. The walkthrough is read-only until you choose to keep an example.</p>
      <JourneyButtons onStart={start}/>
      <button type="button" className="firstVisitWalkthroughSkip" onClick={skip}>Skip for now</button>
    </section>
  </div>;
}

export default function WalkthroughDock({onStart,showHint=false,onDismissHint}) {
  const [open,setOpen]=useState(false);
  return <aside className={`walkthroughDock ${open?'open':''} ${showHint?'showHint':''}`} aria-label="Guided walkthroughs">
    {showHint&&<div className="walkthroughDockCoach" role="status">
      <strong>Need the tour again?</strong>
      <span>Use Explore CEDARS anytime. Next, we will show you where to switch between light and dark mode.</span>
      <i aria-hidden="true">↓</i>
      <button type="button" onClick={onDismissHint}>Next</button>
    </div>}
    <button type="button" className="walkthroughDockToggle" onClick={()=>{setOpen(v=>!v);if(showHint)onDismissHint?.();}} aria-expanded={open}>
      <span>GUIDED WALKTHROUGH</span><strong>Explore CEDARS</strong><b aria-hidden="true">{open?'×':'→'}</b>
    </button>
    {open&&<div className="walkthroughDockPanel"><p>Read-only examples that show where to click and what each step means.</p><JourneyButtons onStart={kind=>{setOpen(false);onStart?.(kind);}} compact/></div>}
  </aside>;
}
