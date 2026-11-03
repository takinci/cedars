// CEDARS_CHUNK_9Q5_TRANSACTION_SAFE_THEME_WALKTHROUGH
// CEDARS_CHUNK_9R16_SEMANTIC_COLOR_WALKTHROUGH_AI_ENTRY
// CEDARS_CHUNK_9H1_RESULT_IMPROVE_SIMPLIFICATION
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Activity, Brain, RotateCcw, X} from 'lucide-react';

const SAVE_SHARE_STEP = {
  target: '[data-demo-target="global-save-button"]',
  extraTargets: ['[data-demo-target="global-save-menu"]'],
  kicker: 'SAVE & SHARE',
  title: 'Save, reopen, or share your work',
  body: 'Use the top-right menu to keep a browser-local copy, download a portable CEDARS file, reopen a file later, or copy a supported assessment link. Sharing and research contribution are separate choices.',
  actionHint: 'The menu opens automatically for this step. Demo mode never saves, downloads, imports, shares, or submits anything.',
  openSaveMenu: true,
  skipScroll: true,
};

export const GUIDED_DEMOS = {
  leader: {
    title: 'Department operations and Digital + AI',
    shortTitle: 'Department walkthrough',
    icon: Activity,
    description: 'See how to describe a radiology department, review its current result, try a change, and prepare something you can keep or share.',
    steps: [
      {target:'[data-demo-target="home-department"]', kicker:'PROFILE', title:'Start with the radiology department', body:'Choose this path when you want to understand a radiology service: its equipment, imaging activity, storage, resources, workflow, and any AI used locally.', actionHint:'Next opens a read-only example Department Profile; you do not need to type anything.'},
      {target:'[data-demo-target="leader-regional-preset"]', kicker:'PROFILE - CONTEXT', title:'Build the current Department baseline', body:'Context establishes the required local grid, equipment, and imaging-workload baseline. Later Profile stages stay locked until CEDARS has enough current-state information to interpret them.', actionHint:'The illustrative Regional hospital baseline loads automatically when you continue.'},
      {target:'#department-workflow-profile', kicker:'PROFILE - WORKFLOW', title:'Describe how care is delivered today', body:'Workflow records current practices and optional local metrics. The Current Profile Tally summarizes this assessed state; it is not a prospective scenario and does not create savings by itself.'},
      {target:'[data-demo-target="leader-clinical-ai-example"]', kicker:'PROFILE - DIGITAL + AI · OPTIONAL', title:'Add Digital + AI only when it is part of current care', body:'Digital + AI is optional. If the Department uses no local Clinical AI, continue directly to Result. If it does, document those uses here; the shared technical model record remains in AI Model & Informatics.', actionHint:'Illustrative Clinical AI examples load automatically when you continue.'},
      {target:'#department-score-panel', kicker:'PROFILE - RESULT', title:'Review the current assessed result', body:'Result summarizes the current footprint supported by the information entered and shows a Score when enough information is available. Missing or unassessed information remains explicit rather than being treated as zero.'},
      {target:'[data-demo-target="department-improve-state"]', extraTargets:['[data-demo-target="department-improve-workspace"]'], kicker:'DECISION WORKSPACE · OPTIONAL', title:'Test a prospective change without rewriting the Profile', body:'Decision Workspace is optional. It keeps the current Profile fixed while you explore modeled changes, so proposed savings do not silently become part of today’s assessed state.'},
      {target:'[data-demo-target="department-report-materials"]', kicker:'REPORT & SHARE', title:'Prepare a reproducible output', body:'Review methods and reproducibility details, create the Department EcoLabel, and preserve the assessment. The EcoLabel is a CEDARS research reporting output, not external certification.'},
      {...SAVE_SHARE_STEP},
    ],
  },
  procure: {
    title: 'Evaluate or use clinical AI',
    shortTitle: 'Clinical AI walkthrough',
    icon: Activity,
    description: 'See how to compare or assess clinical AI, review the selected model, try deployment choices, and report what is known.',
    steps: [
      {target:'[data-demo-target="home-ai"]', kicker:'PROFILE', title:'Start with AI Model & Informatics', body:'Choose this path when the question is about an AI system itself rather than the whole radiology department.', actionHint:'Next opens the AI start screen.'},
      {target:'[data-demo-target="ai-compare-lane"]', kicker:'PROFILE - CONTEXT', title:'Choose the path that matches your decision', body:'Use Compare candidates when two or more systems address the same clinical need. If one model is already selected, Assess one model is the more direct path.', actionHint:'Next opens an illustrative comparison.'},
      {target:'.aiComparisonModalSection', kicker:'PROFILE - COMPARISON', title:'Make the comparison fair', body:'Compare systems that address the same clinical question and use comparable evidence. First screen out options that are not clinically acceptable; environmental impact does not make an unsuitable model acceptable.'},
      {target:'.aiComparisonModalResults', kicker:'PROFILE - CONTEXT · CANDIDATE COMPARISON', title:'Compare acceptable options on the same basis', body:'Candidate comparison is a temporary Context sub-workspace, not a second Profile. CEDARS keeps reported clinical performance and environmental intensity as separate decision dimensions; Pareto-efficient does not mean clinically recommended.', actionHint:'Next carries illustrative candidate A into the standard Context → Training → Deployment → Result AI Profile.'},
      {target:'#ai-score-panel', kicker:'PROFILE - RESULT', title:'See what is known about the selected model', body:'The Result shows the lifecycle information supported by the data entered. Missing training or deployment information stays visible instead of being treated as zero.'},
      {target:'[data-demo-target="ai-improve-workspace"]', kicker:'DECISION WORKSPACE', title:'Try a deployment change without rewriting the Profile', body:'Explore choices such as hosting, workload, serving configuration, or monitoring while keeping the current AI Profile fixed for comparison.'},
      {target:'[data-demo-target="ai-report-materials"]', kicker:'REPORT & SHARE', title:'Keep the assumptions and data gaps with the result', body:'Review the methods and provenance, prepare the optional Research Label, and save or share the assessment with its important limitations still visible.'},
      {...SAVE_SHARE_STEP},
    ],
  },
  developer: {
    title: 'Develop or retrain AI',
    shortTitle: 'AI development walkthrough',
    icon: Brain,
    description: 'See how to document training and deployment energy, interpret the current result, test changes, and preserve the measurement details.',
    steps: [
      {target:'[data-demo-target="home-ai"]', kicker:'PROFILE', title:'Start with AI Model & Informatics', body:'Choose this path when your team is building, adapting, fine-tuning, or materially retraining an AI model.'},
      {target:'[data-demo-target="ai-develop-lane"]', kicker:'PROFILE - CONTEXT', title:'Choose Develop / train / fine-tune', body:'This tells CEDARS that you need to describe both one-time training and recurring deployment. Those two phases can use different hardware and locations.', actionHint:'Next opens the measurement helper for an illustrative imaging model.'},
      {target:'[data-demo-target="measure-chooser"]', kicker:'PROFILE - MEASUREMENT', title:'Measure energy when you can', body:'Answer a few setup questions and CEDARS will suggest practical measurement options. Keep the tool and measurement source with the result so someone else can understand where the number came from.'},
      {target:'[data-demo-target="ai-training-section"]', kicker:'PROFILE - TRAINING', title:'Describe the training work', body:'Enter measured training energy when available. If it was not measured, CEDARS can estimate it from the workload and hardware information you provide. Unavailable information stays marked unavailable.'},
      {target:'[data-demo-target="ai-inference-section"]', kicker:'PROFILE - DEPLOYMENT', title:'Then describe how the model is used', body:'Add the energy for one use and the expected workload. Deployment is recorded separately because it repeats over time and may run in a different location from training.'},
      {target:'#ai-score-panel', kicker:'PROFILE - RESULT', title:'Review the result supported by your data', body:'CEDARS shows the result that the available training and deployment information can support. Partial measurement can still be reported, with missing pieces clearly identified.'},
      {target:'[data-demo-target="ai-improve-workspace"]', kicker:'DECISION WORKSPACE', title:'Test a possible lifecycle change', body:'Explore changes to experimentation, model settings, serving, compute location, or monitoring without changing the current Profile until something is actually implemented.'},
      {target:'[data-demo-target="ai-report-reproducibility"]', kicker:'REPORT & SHARE', title:'Keep the measurement details with the result', body:'Export the assumptions, measurement source, and provenance so the result can be understood later in a model card, repository, manuscript, or internal report.', actionHint:'The reproducibility sections open automatically in this walkthrough.'},
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
            const top = Math.max(0, window.scrollY + scrollEl.getBoundingClientRect().top - walkthroughSafeTop() - 12);
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
  const safeTop = walkthroughSafeTop();
  const popoverStyle = {
    '--cedars-walkthrough-safe-top': `${safeTop}px`,
    right:16,
    left:'auto',
    top:safeTop,
    bottom:'auto',
    transform:'none',
  };

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
          {!last ? <button type="button" onClick={()=>onStepChange(stepIndex+1)}>Next step →</button> : <>
            <button type="button" className="guidedDemoSecondary" onClick={onExit}>Return to my assessment</button>
            <button type="button" onClick={onKeepExample}>Explore this example</button>
          </>}
        </div>
      </section>
    </div>
  );
}
