// CEDARS_CHUNK_9R32E_ECOLABEL_PATHS_PRACTICE_CONTEXT
// CEDARS_CHUNK_9R32I_CONTEXT_ORDER_REFERENCE_COPY
// CEDARS_CHUNK_9R32D_SERVICE_CONTEXT_RESPONSIVE_HARDENING
// CEDARS_CHUNK_9R32C_REFERENCE_ADJUSTED_ECOLABEL
// CEDARS_CHUNK_9Q5_TRANSACTION_SAFE_THEME_WALKTHROUGH
// CEDARS_CHUNK_9R16_SEMANTIC_COLOR_WALKTHROUGH_AI_ENTRY
// CEDARS_CHUNK_9H1_RESULT_IMPROVE_SIMPLIFICATION
// CEDARS_CHUNK_9R31A_FINAL_WALKTHROUGH_REPORT_COPY
// CEDARS_CHUNK_9R32_WALKTHROUGH_ECOLABEL_METHOD
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Activity, Brain, RotateCcw, X} from 'lucide-react';

const SAVE_SHARE_STEP = {
  target: '[data-demo-target="report-save-share-panel"]',
  scrollBlock: 'start',
  kicker: 'SAVE & SHARE',
  title: 'Choose how you want to keep the assessment',
  bullets: [
    'No login required: save in this browser or download a portable CEDARS file.',
    'Google sign-in is optional and only adds a private cross-device working copy.',
    'Research contribution is separate and requires an explicit review-and-consent step.',
  ],
  nextHint: 'Nothing is saved, shared, downloaded, or submitted automatically during the demo.',
};

export const GUIDED_DEMOS = {
  leader: {
    title: 'Radiology Department and Clinical AI', shortTitle: 'Department walkthrough', icon: Activity,
    description: 'Build the current Department Profile, see the EcoLabel, test prospective changes, and prepare a reproducible report.',
    steps: [
      {target:'[data-demo-target="home-department"]', kicker:'PROFILE', title:'Start with the radiology department', bullets:['Use this path to assess a radiology service as a whole.','CEDARS connects equipment, imaging volume, workflow, infrastructure, and local Clinical AI.'], nextHint:'Next opens an illustrative Department Profile with demo data.'},
      {target:'#department-context-input', scrollBlock:'start', kicker:'PROFILE - CONTEXT', title:'Set the local context and service reference', bullets:['Start with the country/grid, reporting period, and electricity price used for the local carbon and cost context.','Quick-start templates can prefill an illustrative practice, workload, equipment, and current workflow; every field remains editable.','Review Practice & service context so the EcoLabel records what kind of service is being compared, including practice size, sites, setting, and teleradiology status.']},
      {target:'#department-workflow-profile', kicker:'PROFILE - WORKFLOW', title:'Describe how care is delivered today', bullets:['Walk through Order / need → Schedule / prepare → Acquire → Process / interpret → Store / follow-up.','Infrastructure & lifecycle captures cross-cutting operational practices.','Record a practice here only when it is already implemented.'], nextHint:'The same stages reappear later in Decision Workspace for prospective changes.'},
      {target:'.departmentWorkflowCurrentTally', kicker:'PROFILE - CURRENT STATE', title:'See the current Profile tally', bullets:['Review current practices and local workflow measures.','See workload, operational energy, estimated electricity cost, and carbon intensity.','This current-state tally becomes the baseline for later scenarios.']},
      {target:'[data-demo-target="leader-clinical-ai-example"]', kicker:'PROFILE - CLINICAL AI · OPTIONAL', title:'Add Clinical AI only when it is used locally', bullets:['Optional: skip this stage if the department does not use Clinical AI.','If AI is used, record how it is deployed in this department.','Detailed model lifecycle data remain in AI Model & Informatics.']},
      {target:'#department-score-panel', kicker:'PROFILE - RESULT (ECOLABEL)', title:'Review the current assessed result', bullets:['The Department rating compares modeled operating energy with the CEDARS reference for the same service mix.','Absolute kWh, kgCO₂e/study, and annual carbon remain visible separately.','A Score of 50 marks the matched reference; it is not the 50th percentile of peer departments.']},
      {target:'.scoreEverydayPanel', scrollBlock:'start', kicker:'PROFILE - INTERPRET THE RESULT', title:'Put the result in everyday terms', bullets:['Translate the footprint into familiar scale comparisons.','Choose whether examples explain the scored footprint or broader assessed carbon.','These comparisons explain scale; they are not carbon offsets.']},
      {target:'[data-demo-target="department-decision-compare"]', scrollBlock:'start', kicker:'DECISION WORKSPACE · OPTIONAL', title:'Test a possible change', bullets:['Keep the current Profile fixed while testing a prospective scenario.','Compare energy, operational carbon, EcoLabel Score, and estimated electricity cost.','When two changes affect the same underlying energy use, CEDARS counts the shared savings only once.']},
      {target:'[data-demo-target="department-report-materials"]', scrollBlock:'start', kicker:'REPORT & SHARE - ECOLABEL', title:'Carry the same EcoLabel into reporting', bullets:['Report & Share starts with the same current-state EcoLabel.','It is the same assessment summary, not a second calculation.']},
      {target:'[data-demo-target="department-report-reproducibility"]', scrollBlock:'start', kicker:'REPORT & SHARE - METHODS', title:'Keep the reference with the result', bullets:['Preserve modality volumes, fleet/service context, reference energy, observed-to-reference ratio, grid assumptions, and provenance.','Practice-size and facility context are retained for future peer validation but do not directly award points in the current score.']},
      {...SAVE_SHARE_STEP},
    ],
  },

  procure: {
    title: 'Evaluate or use Clinical AI', shortTitle: 'Clinical AI walkthrough', icon: Activity,
    description: 'Compare or assess a Clinical AI system, document its lifecycle, interpret the EcoLabel, test deployment choices, and report the result.',
    steps: [
      {target:'[data-demo-target="home-ai"]', kicker:'PROFILE', title:'Start with AI Model & Informatics', bullets:['Use this path when the question is about an AI system itself.','Assess one selected model or compare candidates for the same clinical need.']},
      {target:'[data-demo-target="ai-compare-lane"]', kicker:'PROFILE - CONTEXT', title:'Choose the decision you are making', bullets:['Compare candidates when two or more systems address the same intended use.','Assess one model directly when it is already selected or deployed.']},
      {target:'.aiComparisonModalSection', kicker:'PROFILE - CONTEXT · COMPARISON', title:'Make the clinical comparison fair first', bullets:['Hold intended use, endpoint, cohort, and workload context constant.','Clinical suitability is the gate; a lower footprint cannot rescue an unsuitable model.']},
      {target:'.aiComparisonModalResults', kicker:'PROFILE - CONTEXT · CANDIDATE COMPARISON', title:'Keep clinical and environmental results separate', bullets:['Review clinical evidence and environmental intensity as separate dimensions.','A Pareto-efficient candidate is not automatically clinically recommended.'], nextHint:'Next carries one illustrative candidate into the standard AI Profile.'},
      {target:'#ai-training-section', scrollBlock:'start', kicker:'PROFILE - TRAINING', title:'Record what is known about training', bullets:['Training is a one-time lifecycle phase.','Use disclosed or measured data when available.','Unknown vendor training remains unknown; CEDARS does not turn it into zero.']},
      {target:'#ai-inference-section', scrollBlock:'start', kicker:'PROFILE - DEPLOYMENT', title:'Describe recurring deployment', bullets:['Record energy per use, expected workload, compute context, and local workflow effects.','Deployment is separate because inference repeats and may use different infrastructure from training.']},
      {target:'#ai-score-panel', kicker:'PROFILE - RESULT (ECOLABEL)', title:'See what the available lifecycle data support', bullets:['The AI Research EcoLabel uses the same reporting grammar as the Department EcoLabel.','The AI Footprint Score is assigned only when the required lifecycle basis is available.']},
      {target:'.aiEverydayPanel', scrollBlock:'start', kicker:'PROFILE - INTERPRET THE RESULT', title:'Interpret per-use and deployment impact', bullets:['Compare the footprint per study/use with the expected deployment-period footprint.','If training is unavailable, deployment results remain explicitly partial.']},
      {target:'[data-demo-target="ai-improve-workspace"]', scrollBlock:'start', kicker:'DECISION WORKSPACE', title:'Test a deployment choice', bullets:['Explore prospective hosting, serving, workload, compute-location, or monitoring changes.','The current AI Profile remains fixed until a real-world change is implemented.']},
      {target:'[data-demo-target="ai-report-materials"]', scrollBlock:'start', kicker:'REPORT & SHARE - ECOLABEL', title:'Carry the AI Research EcoLabel into reporting', bullets:['Use the same current lifecycle assessment as the visual reporting summary.','Missing lifecycle phases remain visible.']},
      {target:'[data-demo-target="ai-report-reproducibility"]', scrollBlock:'start', kicker:'REPORT & SHARE - METHODS', title:'Preserve provenance and lifecycle gaps', bullets:['Keep assumptions, measurement/estimation method, compute context, and workload with the result.','Partial disclosure is reportable when the missing phase is explicit.']},
      {...SAVE_SHARE_STEP},
    ],
  },

  developer: {
    title: 'Develop or retrain AI', shortTitle: 'AI development walkthrough', icon: Brain,
    description: 'Measure or estimate training and deployment, interpret lifecycle impact, test prospective changes, and preserve a reproducible AI environmental record.',
    steps: [
      {target:'[data-demo-target="home-ai"]', kicker:'PROFILE', title:'Start with AI Model & Informatics', bullets:['Use this path when your team is building, adapting, fine-tuning, or materially retraining AI.']},
      {target:'[data-demo-target="ai-develop-lane"]', kicker:'PROFILE - CONTEXT', title:'Choose Develop / train / fine-tune', bullets:['Define the clinical purpose and AI family first.','CEDARS then separates one-time Training from recurring Deployment.']},
      {target:'[data-demo-target="measure-chooser"]', kicker:'PROFILE - MEASUREMENT', title:'Measure energy when you can', bullets:['Match the compute setup to practical energy-measurement approaches.','Direct measurements take precedence over workload/specification estimates when feasible.']},
      {target:'#ai-training-section', scrollBlock:'start', kicker:'PROFILE - TRAINING', title:'Describe the training work', bullets:['Record materially relevant experiments, fine-tuning, repeats, or retraining.','Use measured energy when available; otherwise document the estimation basis.']},
      {target:'#ai-inference-section', scrollBlock:'start', kicker:'PROFILE - DEPLOYMENT', title:'Then describe recurring use', bullets:['Record per-use energy, expected workload, and deployment compute context.','A small per-use footprint can still become important at large deployment scale.']},
      {target:'#ai-score-panel', kicker:'PROFILE - RESULT (ECOLABEL)', title:'Review the result supported by the record', bullets:['The EcoLabel Score uses only lifecycle information supported by the entered record.','Missing phases stay visible; water and other separate resources are not forced into the carbon-and-energy Score.']},
      {target:'.aiEverydayPanel', scrollBlock:'start', kicker:'PROFILE - INTERPRET THE RESULT', title:'Distinguish intensity from total impact', bullets:['Per-study intensity and deployment-period total footprint answer different questions.','Amortizing training can lower per-study intensity while total deployment emissions still rise with use.']},
      {target:'[data-demo-target="ai-improve-workspace"]', scrollBlock:'start', kicker:'DECISION WORKSPACE', title:'Test a possible lifecycle change', bullets:['Explore prospective experimentation, model, serving, location, workload, or monitoring changes.','Prospective assumptions do not rewrite the current Profile.']},
      {target:'[data-demo-target="ai-report-materials"]', scrollBlock:'start', kicker:'REPORT & SHARE - ECOLABEL', title:'Carry the AI Research EcoLabel into reporting', bullets:['Use the same current result in a manuscript, poster, model card, presentation, or technical report.']},
      {target:'[data-demo-target="ai-report-reproducibility"]', scrollBlock:'start', kicker:'REPORT & SHARE - METHODS', title:'Keep the measurement details with the result', bullets:['Preserve the measurement/estimation source, assumptions, workload, compute context, and provenance.']},
      {...SAVE_SHARE_STEP},
    ],
  },
};

function clampRect(rect, pad = 7) {
  const left = Math.max(6, rect.left - pad);
  const top = Math.max(6, rect.top - pad);
  const right = Math.min(window.innerWidth - 6, rect.right + pad);
  const bottom = Math.min(window.innerHeight - 6, rect.bottom + pad);
  return {left, top, right, bottom, width: Math.max(0, right-left), height: Math.max(0, bottom-top)};
}

function walkthroughSafeTop() {
  if (typeof window === 'undefined') return 112;
  let safeTop = 12;
  ['.siteHeader','.workflowRailWrap'].forEach(selector => {
    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) safeTop = Math.max(safeTop, rect.bottom + 12);
  });
  return Math.min(Math.max(88, safeTop), Math.max(88, window.innerHeight - 240));
}

function rectsOverlap(a, b, pad = 12) {
  if (!a || !b) return false;
  return !(a.right + pad < b.left || a.left - pad > b.right || a.bottom + pad < b.top || a.top - pad > b.bottom);
}

function walkthroughPopoverStyle(targetRect, size, safeTop) {
  const margin = 16;
  const vw = typeof window === 'undefined' ? 1200 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  const width = Math.min(Math.max(300, size?.width || 360), Math.max(300, vw - margin * 2));
  const height = Math.min(Math.max(220, size?.height || 300), Math.max(220, vh - safeTop - margin));
  const bottomTop = Math.max(safeTop, vh - height - margin);
  const candidates = [
    {left:vw-width-margin, top:safeTop},
    {left:margin, top:safeTop},
    {left:vw-width-margin, top:bottomTop},
    {left:margin, top:bottomTop},
  ].map(pos=>({...pos,right:pos.left+width,bottom:pos.top+height}));
  const chosen = candidates.find(box=>!rectsOverlap(box,targetRect,14)) || candidates[0];
  return {left:chosen.left,right:'auto',top:chosen.top,bottom:'auto',transform:'none','--cedars-walkthrough-safe-top':`${safeTop}px`};
}

export function GuidedDemoLauncher({onStart}) {
  const journeys = [
    {key:'leader', icon:Activity, eyebrow:'DEPARTMENT', title:'Radiology department', audience:'Understand a radiology service as a whole, including equipment, workflow, resources, and local Clinical AI.', detail:'Current Profile → EcoLabel → prospective changes → report.'},
    {key:'procure', icon:Brain, eyebrow:'CLINICAL AI', title:'Clinical AI evaluation', audience:'Compare candidates or assess one selected/deployed AI system using clinical and environmental context.', detail:'Clinical context → lifecycle → EcoLabel → deployment choices → report.'},
    {key:'developer', icon:Brain, eyebrow:'AI DEVELOPMENT', title:'AI development', audience:'Measure or estimate training and deployment for a model you build, fine-tune, or retrain.', detail:'Measure → lifecycle → EcoLabel → prospective changes → report.'},
  ];
  return (
    <details className="guidedDemoLauncher" aria-labelledby="guided-demo-title">
      <summary>
        <span className="guidedDemoLauncherSummaryCopy"><span>GUIDED WALKTHROUGHS</span><strong id="guided-demo-title">See CEDARS with illustrative data</strong><small>Each example shows the current Profile, how to interpret its EcoLabel, how to test prospective changes, and how to report or save the result—without changing your assessment.</small></span>
        <span className="guidedDemoLauncherSummaryAction">Explore walkthroughs →</span>
      </summary>
      <div className="guidedDemoLauncherBody">
        <div className="guidedDemoLauncherGrid">
          {journeys.map(journey => {
            const Icon = journey.icon;
            return <article key={journey.key} className="guidedDemoChoice">
              <div className="guidedDemoChoiceIcon"><Icon size={20}/></div>
              <div className="guidedDemoChoiceCopy">
                <span className="guidedDemoChoiceEyebrow">{journey.eyebrow}</span>
                <strong>{journey.title}</strong>
                <p>{journey.audience}</p>
                <small>{journey.detail}</small>
                <button type="button" onClick={()=>onStart(journey.key)}>Start →</button>
              </div>
            </article>;
          })}
        </div>
        <p className="guidedDemoExampleNote"><strong>Specific AI examples</strong> remain available inside <em>AI Model &amp; Informatics</em>; they are starting points, not separate workflows.</p>
      </div>
    </details>
  );
}

export function GuidedDemo({kind, stepIndex, onStepChange, onRestart, onExit, onKeepExample, onBackToChooser}) {
  const demo = GUIDED_DEMOS[kind];
  const step = demo?.steps?.[stepIndex];
  const [rect, setRect] = useState(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const [dialogSize, setDialogSize] = useState({width:360,height:300});
  const dialogRef = useRef(null);
  const selector = step?.target;
  const scrollSelector = step?.scrollTarget || selector;

  const updateRect = () => {
    if (!selector) return;
    const selectors = [selector, ...(step?.extraTargets || [])];
    const elements = selectors.map(s => document.querySelector(s));
    if (elements.some(el => !el)) { setRect(null); setTargetMissing(true); return; }
    const bounds = elements.map(el => el.getBoundingClientRect()).filter(r=>r.width>1 && r.height>1);
    if (bounds.length !== elements.length) { setRect(null); setTargetMissing(true); return; }
    setTargetMissing(false);
    setRect(clampRect({left:Math.min(...bounds.map(r=>r.left)),top:Math.min(...bounds.map(r=>r.top)),right:Math.max(...bounds.map(r=>r.right)),bottom:Math.max(...bounds.map(r=>r.bottom))}));
  };

  useLayoutEffect(() => {
    if (!selector) return undefined;
    let cancelled = false, locateTimer, measureTimer, tries = 0;
    const measureRepeatedly = (remaining=8) => {
      if (cancelled) return;
      updateRect();
      if (remaining>1) measureTimer=window.setTimeout(()=>measureRepeatedly(remaining-1),80);
    };
    const locate = () => {
      if (cancelled) return;
      const el=document.querySelector(selector);
      const scrollEl=document.querySelector(scrollSelector);
      const extrasReady=(step?.extraTargets||[]).every(extra=>{const x=document.querySelector(extra);if(!x)return false;const r=x.getBoundingClientRect();return r.width>1&&r.height>1;});
      const mainRect=el?.getBoundingClientRect();
      if(el&&scrollEl&&mainRect?.width>1&&mainRect?.height>1&&extrasReady){
        setTargetMissing(false);
        if(!step?.skipScroll){
          const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
          const behavior=reducedMotion?'auto':'smooth';
          const r=scrollEl.getBoundingClientRect();
          const safeTop=walkthroughSafeTop();
          const available=Math.max(180,window.innerHeight-safeTop-28);
          const alreadyVisible=r.top>=safeTop+8&&r.bottom<=window.innerHeight-18;
          if(!alreadyVisible){
            if(step?.scrollBlock==='start'||r.height>available*.70){
              const top=Math.max(0,window.scrollY+r.top-safeTop-12);
              window.scrollTo({top,behavior});
            }else scrollEl.scrollIntoView({behavior,block:'center',inline:'nearest'});
          }
        }
        measureTimer=window.setTimeout(()=>measureRepeatedly(8),90);
        return;
      }
      tries+=1;
      if(tries<60) locateTimer=window.setTimeout(locate,80);
      else {setTargetMissing(true);setRect(null);}
    };
    locate();
    return ()=>{cancelled=true;window.clearTimeout(locateTimer);window.clearTimeout(measureTimer);};
  },[selector,scrollSelector,step?.scrollBlock,step?.skipScroll,stepIndex]);

  useEffect(()=>{
    const onMove=()=>updateRect();
    window.addEventListener('resize',onMove);window.addEventListener('scroll',onMove,true);
    return ()=>{window.removeEventListener('resize',onMove);window.removeEventListener('scroll',onMove,true);};
  },[selector,stepIndex]);

  useLayoutEffect(()=>{
    const raf=window.requestAnimationFrame(()=>{const r=dialogRef.current?.getBoundingClientRect();if(r?.width&&r?.height)setDialogSize({width:r.width,height:r.height});});
    return ()=>window.cancelAnimationFrame(raf);
  },[stepIndex,targetMissing]);

  useEffect(()=>{
    const focusDialog=window.setTimeout(()=>dialogRef.current?.focus(),0);
    const onKeyDown=e=>{
      if(e.key==='Escape'){e.preventDefault();onExit();return;}
      if(e.key!=='Tab')return;
      const root=dialogRef.current?.closest('.guidedDemoRoot');
      const focusables=root?[...root.querySelectorAll('button:not([disabled])')]:[];
      if(!focusables.length)return;
      const active=document.activeElement,index=focusables.indexOf(active);
      if(index===-1){e.preventDefault();focusables[0].focus();}
      else if(e.shiftKey&&index===0){e.preventDefault();focusables[focusables.length-1].focus();}
      else if(!e.shiftKey&&index===focusables.length-1){e.preventDefault();focusables[0].focus();}
    };
    document.addEventListener('keydown',onKeyDown);
    return ()=>{window.clearTimeout(focusDialog);document.removeEventListener('keydown',onKeyDown);};
  },[stepIndex,onExit]);

  const blockers=useMemo(()=>!rect?[]:[
    {key:'top',style:{left:0,top:0,right:0,height:rect.top}},
    {key:'left',style:{left:0,top:rect.top,width:rect.left,height:rect.height}},
    {key:'right',style:{left:rect.right,top:rect.top,right:0,height:rect.height}},
    {key:'bottom',style:{left:0,top:rect.bottom,right:0,bottom:0}},
  ],[rect]);

  if(!demo||!step)return null;
  const last=stepIndex===demo.steps.length-1;
  const kickerLabel=step.kicker?.includes('·')?step.kicker.split('·').slice(1).join('·').trim():step.kicker;
  const safeTop=walkthroughSafeTop();
  const popoverStyle=walkthroughPopoverStyle(rect,dialogSize,safeTop);

  return <div className="guidedDemoRoot" aria-live="polite">
    <div className="guidedDemoBanner"><strong>DEMO MODE · {demo.shortTitle}</strong><span>Read-only walkthrough · illustrative data</span><button type="button" onClick={onRestart}><RotateCcw size={13}/> Restart</button><button type="button" onClick={onExit}><X size={13}/> Exit demo</button></div>
    {rect&&blockers.map(b=><div key={b.key} className="guidedDemoBlocker" style={b.style}/>)}
    {rect&&<div className="guidedDemoSpotlight" aria-hidden="true" style={{left:rect.left,top:rect.top,width:rect.width,height:rect.height}}/>}
    <section ref={dialogRef} tabIndex={-1} className="guidedDemoPopover" role="dialog" aria-modal="true" aria-label={`${demo.title} guided walkthrough`} style={popoverStyle}>
      <div className="guidedDemoPopoverTop"><div className="guidedDemoProgress"><span>{stepIndex+1} of {demo.steps.length}{kickerLabel?` · ${kickerLabel}`:''}</span><span>{stepIndex+1}/{demo.steps.length}</span></div><button type="button" className="guidedDemoCloseStep" onClick={onExit} aria-label="Exit guided walkthrough"><X size={13}/> Exit demo</button></div>
      <div role="tablist" aria-label="Walkthrough steps" style={{display:'flex',gap:4,flexWrap:'wrap',margin:'6px 0 10px'}}>
        {demo.steps.map((s,i)=>
          <button type="button" key={i} role="tab" aria-selected={i===stepIndex} aria-label={`Go to step ${i+1}: ${s.kicker||s.title}`}
            onClick={()=>onStepChange(i)}
            style={{width:i===stepIndex?18:8,height:8,borderRadius:4,padding:0,border:'none',background:i===stepIndex?'#2E7D32':i<stepIndex?'#A5D6A7':'#E0E0E0',cursor:'pointer',transition:'width .15s,background .15s'}}/>
        )}
      </div>
      <h3>{step.title}</h3>
      {step.bullets?.length?<ul className="guidedDemoBullets">{step.bullets.map((item,i)=><li key={i}>{item}</li>)}</ul>:step.body?<p>{step.body}</p>:null}
      {(step.nextHint||step.actionHint)&&<div className="guidedDemoActionHint">{step.nextHint||step.actionHint}</div>}
      {targetMissing&&<div className="guidedDemoTargetWarning">CEDARS is still preparing this demo view. You can continue or go back.</div>}
      <div className="guidedDemoActions"><button type="button" className="guidedDemoSecondary" onClick={()=>{if(stepIndex===0)onBackToChooser?.();else onStepChange(stepIndex-1);}}>Back</button>{!last?<button type="button" onClick={()=>onStepChange(stepIndex+1)}>Next step →</button>:<><button type="button" className="guidedDemoSecondary" onClick={onExit}>Return to my assessment</button><button type="button" onClick={onKeepExample}>Explore this example</button></>}</div>
    </section>
  </div>;
}
