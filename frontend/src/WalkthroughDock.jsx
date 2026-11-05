// CEDARS_CHUNK_9Q5_TRANSACTION_SAFE_THEME_WALKTHROUGH
// CEDARS_CHUNK_9R16_SEMANTIC_COLOR_WALKTHROUGH_AI_ENTRY
// CEDARS_CHUNK_9R31A_FINAL_WALKTHROUGH_REPORT_COPY
import React, {useEffect, useState} from 'react';
import {Activity, Brain, Compass, X} from 'lucide-react';

// Two primary choices, matching Home's two entry buttons exactly. The AI choice expands to its
// two sub-journeys in place rather than offering 3 flat choices — avoids the mismatch where Home
// shows 2 entry points but the walkthrough prompt/dock used to offer a 3rd.
const JOURNEYS = [
  {key:'leader',icon:Activity,label:'Radiology Department',detail:'Build the current Department Profile, interpret its EcoLabel, test prospective changes, then report.'},
  {key:'ai-chooser',icon:Brain,label:'AI Model & Informatics',detail:'Evaluate, compare, or develop a clinical AI system, interpret its lifecycle EcoLabel, then report.'},
];
const AI_SUB_JOURNEYS = [
  {key:'procure',label:'Evaluate or use a model',detail:'Compare candidates or assess one AI system, document its lifecycle, interpret the EcoLabel, then test deployment choices.'},
  {key:'developer',label:'Develop or retrain',detail:'Measure or estimate Training and Deployment, interpret lifecycle impact, test changes, then report.'},
];

function JourneyButtons({onStart, compact=false}) {
  const [aiOpen,setAiOpen]=useState(false);
  return <div className={compact?'walkthroughJourneyList compact':'walkthroughJourneyList'}>
    {JOURNEYS.map(journey=>{
      const Icon=journey.icon;
      if (journey.key==='ai-chooser') {
        return <React.Fragment key={journey.key}>
          <button type="button" onClick={()=>setAiOpen(v=>!v)} aria-expanded={aiOpen}>
            <Icon size={17}/><span><strong>{journey.label}</strong>{!compact&&<small>{journey.detail}</small>}</span><b aria-hidden="true">{aiOpen?'×':'→'}</b>
          </button>
          {aiOpen&&AI_SUB_JOURNEYS.map(sub=>
            <button type="button" key={sub.key} style={{marginLeft:16}} onClick={()=>onStart(sub.key)}>
              <span><strong>{sub.label}</strong>{!compact&&<small>{sub.detail}</small>}</span><b aria-hidden="true">→</b>
            </button>
          )}
        </React.Fragment>;
      }
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
      <p>Follow an illustrative assessment step by step: build the current Profile, interpret the EcoLabel, test a prospective change, and see how the result is reported. The walkthrough is read-only until you choose to keep the example.</p>
      <JourneyButtons onStart={start}/>
      <button type="button" className="firstVisitWalkthroughSkip" onClick={skip}>Skip for now</button>
    </section>
  </div>;
}

export default function WalkthroughDock({onStart,showHint=false,onDismissHint,openSignal=0}) {
  const [open,setOpen]=useState(false);
  const [coachStep,setCoachStep]=useState('dock');

  useEffect(()=>{
    if (showHint) setCoachStep('dock');
  },[showHint]);

  // Fires when the walkthrough's own "Back" exits step 0 — reopens the journey chooser so
  // backing out of the first step isn't a dead end (mounts fresh each time, since the dock only
  // renders while no demo is active).
  useEffect(()=>{
    if (openSignal) setOpen(true);
  },[openSignal]);

  useEffect(()=>{
    if (typeof document === 'undefined') return undefined;
    const target=document.querySelector('[data-demo-target="theme-toggle"]');
    if (!target) return undefined;
    const active=showHint && coachStep==='theme';
    target.classList.toggle('walkthroughThemeTarget',active);
    if (active) {
      const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      window.setTimeout(()=>target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'nearest',inline:'nearest'}),0);
    }
    return ()=>target.classList.remove('walkthroughThemeTarget');
  },[showHint,coachStep]);

  const dismissCoach=()=>{
    setCoachStep('dock');
    onDismissHint?.();
  };

  return <aside className={`walkthroughDock ${open?'open':''} ${showHint?'showHint':''}`} aria-label="Guided walkthroughs">
    {showHint&&<div className={`walkthroughDockCoach ${coachStep==='theme'?'themeCoach':''}`} role="status" aria-live="polite">
      {coachStep==='dock'?<>
        <strong>Walkthroughs stay available here</strong>
        <span>Explore CEDARS opens the three read-only example journeys whenever you want them.</span>
        <i aria-hidden="true">↓</i>
        <button type="button" onClick={()=>setCoachStep('theme')}>Show display control →</button>
      </>:<>
        <strong>Light / Dark is in the top bar</strong>
        <span>The highlighted control changes only how CEDARS is displayed; it does not change assessment inputs or calculations. Its help text also explains the display-energy note.</span>
        <i aria-hidden="true">↑</i>
        <button type="button" onClick={dismissCoach}>Got it</button>
      </>}
    </div>}
    <button type="button" className="walkthroughDockToggle" onClick={()=>{setOpen(v=>!v);if(showHint)dismissCoach();}} aria-expanded={open} aria-label="Guided walkthrough">
      <Compass size={18} className="walkthroughDockIcon"/>
      <span>GUIDED WALKTHROUGH</span><strong>Explore CEDARS</strong><b aria-hidden="true">{open?'×':'→'}</b>
    </button>
    {open&&<div className="walkthroughDockPanel"><p>Read-only examples that show what CEDARS can do, where to click, how to interpret the result, and how current state stays separate from prospective changes.</p><JourneyButtons onStart={kind=>{setOpen(false);onStart?.(kind);}} compact/></div>}
  </aside>;
}
