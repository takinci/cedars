import React, {useEffect, useState} from 'react';
import {Activity, Brain, X} from 'lucide-react';

const JOURNEYS = [
  {key:'leader',icon:Activity,label:'Radiology Department',detail:'Operations, equipment, Clinical AI, Results, Improve, and reporting.'},
  {key:'procure',icon:Brain,label:'Clinical AI evaluation',detail:'Compare or assess AI for clinical use.'},
  {key:'developer',icon:Brain,label:'AI development',detail:'Training, inference, lifecycle measurement, and research reporting.'},
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

export function FirstVisitWalkthroughPrompt({onStart}) {
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
  const start=kind=>{markSeen();onStart?.(kind);};
  if(!open) return null;
  return <div className="firstVisitWalkthroughBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)markSeen();}}>
    <section className="firstVisitWalkthrough" role="dialog" aria-modal="true" aria-labelledby="first-visit-walkthrough-title">
      <button type="button" className="firstVisitWalkthroughClose" onClick={markSeen} aria-label="Skip walkthrough"><X size={18}/></button>
      <span className="firstVisitWalkthroughKicker">FIRST VISIT · GUIDED WALKTHROUGH</span>
      <h2 id="first-visit-walkthrough-title">See how CEDARS works before you start</h2>
      <p>Follow an illustrative assessment step by step. The walkthrough is read-only until you choose to keep an example.</p>
      <JourneyButtons onStart={start}/>
      <button type="button" className="firstVisitWalkthroughSkip" onClick={markSeen}>Skip for now</button>
    </section>
  </div>;
}

export default function WalkthroughDock({onStart}) {
  const [open,setOpen]=useState(false);
  return <aside className={`walkthroughDock ${open?'open':''}`} aria-label="Guided walkthroughs">
    <button type="button" className="walkthroughDockToggle" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
      <span>GUIDED WALKTHROUGH</span><strong>Explore CEDARS</strong><b aria-hidden="true">{open?'×':'→'}</b>
    </button>
    {open&&<div className="walkthroughDockPanel"><p>Illustrative, read-only walkthroughs.</p><JourneyButtons onStart={kind=>{setOpen(false);onStart?.(kind);}} compact/></div>}
  </aside>;
}
