// CEDARS_CHUNK_9Q5_TRANSACTION_SAFE_THEME_WALKTHROUGH
// CEDARS_CHUNK_9H1_RESULT_IMPROVE_SIMPLIFICATION
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Activity, Brain, RotateCcw, X} from 'lucide-react';

const SAVE_SHARE_STEP = {
  target: '[data-demo-target="global-save-button"]',
  extraTargets: ['[data-demo-target="global-save-menu"]'],
  kicker: 'SAVE & SHARE',
  title: 'Choose how this assessment should travel',
  body: 'Use Save on this device for a browser-local working copy, Download CEDARS file for a portable full assessment, Open CEDARS file to resume one, or Copy shareable CEDARS assessment link for supported calculator settings. Research contribution is separate and may be disabled when the submission service is not configured.',
  actionHint: 'The top-right Save menu is opened automatically for this final step. Demo mode does not save, download, import, share, or submit anything.',
  openSaveMenu: true,
  skipScroll: true,
};

export const GUIDED_DEMOS = {
  leader: {
    title: 'Department operations and Digital + AI',
    shortTitle: 'Department walkthrough',
    icon: Activity,
    description: 'Build a Department Profile, interpret its current Result, test prospective changes in Decision Workspace, and prepare reproducible reporting.',
    steps: [
      {target:'[data-demo-target="home-department"]', kicker:'PROFILE', title:'Start with the radiology department', body:'Use the Department Profile when the question is about the care environment: equipment, imaging workload, storage, resources, and AI as it is deployed locally.', actionHint:'Next opens the Department Profile with illustrative values; no typing is required.'},
      {target:'[data-demo-target="leader-regional-preset"]', kicker:'PROFILE - EQUIPMENT + OPERATIONS', title:'Build the operational baseline', body:'Equipment and imaging workload establish the current department baseline. This walkthrough uses the illustrative Regional hospital preset; a real assessment should verify or replace every value.', actionHint:'The preset loads automatically when you continue.'},
      {target:'[data-demo-target="leader-clinical-ai-example"]', kicker:'PROFILE - DIGITAL + AI', title:'Add AI where it is actually used', body:'Digital + AI keeps local informatics and deployed Clinical AI inside the care environment. The technical model record can be shared, while local workload and supported workflow effects remain specific to the Department.', actionHint:'Illustrative Clinical AI uses load automatically when you continue.'},
      {target:'#department-score-panel', kicker:'PROFILE - RESULT', title:'Interpret the current department result', body:'The Profile ends with the current operational footprint, CEDARS Score, assessment boundary, and interpretation. Extended estimates and categories not assessed remain explicit rather than being folded into the Score.'},
      {target:'[data-demo-target="department-improve-state"]', extraTargets:['[data-demo-target="department-improve-workspace"]'], kicker:'DECISION WORKSPACE', title:'Test prospective changes without rewriting the baseline', body:'Decision Workspace keeps the assessed Profile fixed while you build a scenario. Clinical appropriateness and operational safety come first; modeled environmental opportunities are decision support, not automatic recommendations.'},
      {target:'[data-demo-target="department-report-materials"]', kicker:'REPORT & SHARE', title:'Preserve the methods, evidence, and outputs', body:'Prepare the Department EcoLabel and reporting text, review assumptions and provenance, and preserve or share the assessment. The EcoLabel is a research reporting output, not external certification.'},
      {...SAVE_SHARE_STEP},
    ],
  },
  procure: {
    title: 'Evaluate or use clinical AI',
    shortTitle: 'Clinical AI walkthrough',
    icon: Activity,
    description: 'Compare clinically appropriate candidates on one basis, carry one into the AI Profile, then test deployment choices and report the result.',
    steps: [
      {target:'[data-demo-target="home-ai"]', kicker:'PROFILE', title:'Start with AI Model & Informatics', body:'Use the AI Profile when the question is about an AI system itself rather than the whole radiology department.', actionHint:'Next opens the AI task selector.'},
      {target:'[data-demo-target="ai-compare-lane"]', kicker:'PROFILE - TASK', title:'Choose candidate comparison only when it fits the decision', body:'Use Compare candidates when two or more systems address the same clinical need. If one model is already selected, Assess one model is the more direct path.', actionHint:'Next opens an illustrative candidate-selection workspace.'},
      {target:'.aiComparisonModalSection', kicker:'PROFILE - CANDIDATE COMPARISON', title:'Define one like-for-like clinical question', body:'Hold intended use, endpoint, validation context, workload, and compute assumptions constant. Clinical suitability is a prerequisite; environmental intensity does not compensate for an unacceptable clinical option.'},
      {target:'.aiComparisonModalResults', kicker:'PROFILE - CANDIDATE COMPARISON', title:'Compare acceptable candidates on the same basis', body:'Reported performance and environmental intensity stay as separate decision dimensions. Pareto-efficient means not dominated on the displayed dimensions; it is not an automatic clinical recommendation.', actionHint:'Next carries illustrative candidate A into the standard AI Profile.'},
      {target:'#ai-score-panel', kicker:'PROFILE - RESULT', title:'Interpret the selected model in one AI Profile', body:'After selection, the same Profile shows lifecycle coverage, recurring inference, available training information, the current Score when supported, and explicit disclosure gaps. Missing upstream information remains missing rather than becoming zero.'},
      {target:'[data-demo-target="ai-improve-workspace"]', kicker:'DECISION WORKSPACE', title:'Focus on deployment choices the organization can influence', body:'For externally developed AI, prospective options center on serving and hosting, workload, efficient validated configurations, vendor disclosure, and monitoring. The current Profile stays fixed until implemented values are updated.'},
      {target:'[data-demo-target="ai-report-materials"]', kicker:'REPORT & SHARE', title:'Preserve the model context and disclosure limits', body:'Methods, provenance, reporting text, and the optional Research Label travel with the clinical context, environmental assumptions, and explicit data gaps.'},
      {...SAVE_SHARE_STEP},
    ],
  },
  developer: {
    title: 'Develop or retrain AI',
    shortTitle: 'AI development walkthrough',
    icon: Brain,
    description: 'Follow measurement through Training, Deployment, Result, prospective improvement, and reproducible reporting.',
    steps: [
      {target:'[data-demo-target="home-ai"]', kicker:'PROFILE', title:'Start with AI Model & Informatics', body:'Development uses the same AI Profile as clinical evaluation, but the record emphasizes measured lifecycle energy, compute context, and transparent provenance.'},
      {target:'[data-demo-target="ai-develop-lane"]', kicker:'PROFILE - TASK', title:'Choose the development pathway', body:'Use Develop / train / fine-tune when your team is building, adapting, or materially retraining the model. Training comes before recurring inference in the lifecycle.', actionHint:'Next opens the measurement helper for an illustrative imaging model.'},
      {target:'[data-demo-target="measure-chooser"]', kicker:'PROFILE - MEASUREMENT', title:'Measure rather than guess when you can', body:'CEDARS narrows measurement options based on where the model runs, which lifecycle phase you need, and whether you can instrument the code. Measurement provenance stays attached to the result.'},
      {target:'[data-demo-target="ai-training-section"]', kicker:'PROFILE - TRAINING', title:'Record the development footprint first', body:'Training is a one-time lifecycle phase. Record the measured or estimated energy, experiments, hardware, and compute context without treating unavailable upstream information as zero.'},
      {target:'[data-demo-target="ai-inference-section"]', kicker:'PROFILE - DEPLOYMENT', title:'Then describe recurring inference and workload', body:'Inference recurs with use. Deployment records energy per study or workload, expected volume, lifetime, serving hardware, and compute location separately from training.'},
      {target:'#ai-score-panel', kicker:'PROFILE - RESULT', title:'Interpret only what the lifecycle evidence supports', body:'The Result combines available lifecycle information consistently. An overall Score requires the inputs needed for that calculation; partial measurement remains reportable with explicit coverage limits.'},
      {target:'[data-demo-target="ai-improve-workspace"]', kicker:'DECISION WORKSPACE', title:'Test changes across the AI lifecycle', body:'Prospective options can address experimentation, model design, precision, serving, compute location, and monitoring. They remain scenarios until the implemented Profile inputs are updated.'},
      {target:'[data-demo-target="ai-report-reproducibility"]', kicker:'REPORT & SHARE', title:'Export assumptions and provenance with the result', body:'Use the structured record, Markdown table, Methods-ready text, and optional visual summary for model cards, repositories, manuscripts, or technical reporting.', actionHint:'The reproducibility sections are opened automatically in this walkthrough.'},
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

export function GuidedDemoLauncher({onStart}) {
  const journeys = [
    {key:'leader', icon:Activity, eyebrow:'DEPARTMENT', title:'Radiology department', audience:'Operations, equipment, resources, and locally deployed clinical AI.', detail:'Profile → Decision Workspace → Report & Share.'},
    {key:'procure', icon:Brain, eyebrow:'CLINICAL AI', title:'Clinical AI evaluation', audience:'Candidate comparison, procurement, deployment, and use of externally developed AI.', detail:'AI profile → Decision Workspace → Report & Share.'},
    {key:'developer', icon:Brain, eyebrow:'AI DEVELOPMENT', title:'AI development', audience:'Training, fine-tuning, measurement, validation, and lifecycle reporting.', detail:'AI profile → Decision Workspace → Report & Share.'},
  ];
  return (
    <details className="guidedDemoLauncher" aria-labelledby="guided-demo-title">
      <summary>
        <span className="guidedDemoLauncherSummaryCopy"><span>GUIDED WALKTHROUGHS</span><strong id="guided-demo-title">See CEDARS with illustrative data</strong><small>Follow a Department, clinical-AI, or AI-development example without changing your current assessment.</small></span>
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

export function GuidedDemo({kind, stepIndex, onStepChange, onRestart, onExit, onKeepExample}) {
  const demo = GUIDED_DEMOS[kind];
  const step = demo?.steps?.[stepIndex];
  const [rect, setRect] = useState(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const dialogRef = useRef(null);
  const selector = step?.target;
  const scrollSelector = step?.scrollTarget || selector;

  const updateRect = () => {
    if (!selector) return;
    const selectors = [selector, ...(step?.extraTargets || [])];
    const elements = selectors.map(s => document.querySelector(s));
    if (elements.some(el => !el)) { setRect(null); setTargetMissing(true); return; }
    setTargetMissing(false);
    const bounds = elements.map(el => el.getBoundingClientRect());
    const next = clampRect({
      left: Math.min(...bounds.map(r => r.left)),
      top: Math.min(...bounds.map(r => r.top)),
      right: Math.max(...bounds.map(r => r.right)),
      bottom: Math.max(...bounds.map(r => r.bottom)),
    });
    setRect(next);
  };

  useLayoutEffect(() => {
    if (!selector) return undefined;
    let tries = 0;
    let timer;
    const locate = () => {
      const el = document.querySelector(selector);
      const scrollEl = document.querySelector(scrollSelector);
      const extrasReady = (step?.extraTargets || []).every(extra => document.querySelector(extra));
      if (el && scrollEl && extrasReady) {
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        if (!step?.skipScroll) {
          const behavior = reducedMotion ? 'auto' : 'smooth';
          if (step?.scrollBlock === 'start') {
            const top = Math.max(0, window.scrollY + scrollEl.getBoundingClientRect().top - 92);
            window.scrollTo({top, behavior});
          } else {
            scrollEl.scrollIntoView({behavior, block:'center', inline:'nearest'});
          }
        }
        window.setTimeout(updateRect, step?.skipScroll || reducedMotion ? 40 : 360);
        return;
      }
      tries += 1;
      if (tries < 30) timer = window.setTimeout(locate, 80);
      else setTargetMissing(true);
    };
    locate();
    return () => window.clearTimeout(timer);
  }, [selector, scrollSelector, step?.scrollBlock, step?.skipScroll, stepIndex]);

  useEffect(() => {
    const onMove = () => updateRect();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [selector]);

  useEffect(() => {
    const focusDialog = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const onKeyDown = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current?.closest('.guidedDemoRoot');
      const focusables = root ? [...root.querySelectorAll('button:not([disabled])')] : [];
      if (!focusables.length) return;
      const active = document.activeElement;
      const index = focusables.indexOf(active);
      if (index === -1) {
        e.preventDefault();
        focusables[0].focus();
      } else if (e.shiftKey && index === 0) {
        e.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!e.shiftKey && index === focusables.length - 1) {
        e.preventDefault();
        focusables[0].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusDialog);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [stepIndex, onExit]);

  const blockers = useMemo(() => {
    if (!rect) return [];
    return [
      {key:'top', style:{left:0,top:0,right:0,height:rect.top}},
      {key:'left', style:{left:0,top:rect.top,width:rect.left,height:rect.height}},
      {key:'right', style:{left:rect.right,top:rect.top,right:0,height:rect.height}},
      {key:'bottom', style:{left:0,top:rect.bottom,right:0,bottom:0}},
    ];
  }, [rect]);

  if (!demo || !step) return null;
  const last = stepIndex === demo.steps.length - 1;
  const kickerLabel = step.kicker?.includes('·')
    ? step.kicker.split('·').slice(1).join('·').trim()
    : step.kicker;
  const targetOnRight = rect && rect.left + rect.width / 2 > window.innerWidth / 2;
  const targetOnBottom = rect && rect.top + rect.height / 2 > window.innerHeight / 2;
  const popoverStyle = rect
    ? {left:targetOnRight?16:'auto', right:targetOnRight?'auto':16, top:targetOnBottom?72:'auto', bottom:targetOnBottom?'auto':16, transform:'none'}
    : {left:'50%', top:'50%', transform:'translate(-50%,-50%)'};

  return (
    <div className="guidedDemoRoot" aria-live="polite">
      <div className="guidedDemoBanner">
        <strong>DEMO MODE · {demo.shortTitle}</strong><span>Read-only walkthrough · illustrative data</span>
        <button type="button" onClick={onRestart}><RotateCcw size={13}/> Restart</button>
        <button type="button" onClick={onExit}><X size={13}/> Exit demo</button>
      </div>
      {rect ? blockers.map(b=><div key={b.key} className="guidedDemoBlocker" style={b.style}/>) : <div className="guidedDemoBlocker guidedDemoFullBlocker"/>}
      {rect && <div className="guidedDemoSpotlight" aria-hidden="true" style={{left:rect.left,top:rect.top,width:rect.width,height:rect.height}}/>}
      <section ref={dialogRef} tabIndex={-1} className="guidedDemoPopover" role="dialog" aria-modal="true" aria-label={`${demo.title} guided walkthrough`} style={popoverStyle}>
        <div className="guidedDemoProgress"><span>{stepIndex+1} of {demo.steps.length}{kickerLabel ? ` · ${kickerLabel}` : ''}</span><span>{stepIndex+1}/{demo.steps.length}</span></div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        {step.actionHint && <div className="guidedDemoActionHint">{step.actionHint}</div>}
        {targetMissing && <div className="guidedDemoTargetWarning">This step's target is not visible yet. Use Next to continue.</div>}
        <div className="guidedDemoActions">
          <button type="button" className="guidedDemoSecondary" disabled={stepIndex===0} onClick={()=>onStepChange(stepIndex-1)}>Back</button>
          {!last ? <button type="button" onClick={()=>onStepChange(stepIndex+1)} style={{background:'#0f6175',color:'#fff',border:'1px solid #0a5264',fontWeight:850,boxShadow:'0 5px 16px rgba(15,97,117,.28)'}}>Next step →</button> : <>
            <button type="button" className="guidedDemoSecondary" onClick={onExit}>Return to my assessment</button>
            <button type="button" onClick={onKeepExample}>Explore this example</button>
          </>}
        </div>
      </section>
    </div>
  );
}
