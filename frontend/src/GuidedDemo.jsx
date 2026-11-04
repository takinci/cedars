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
    description: 'See how to describe a radiology department, distinguish the current state from prospective changes, interpret the Score boundary, and preserve a reproducible result.',
    steps: [
      {target:'[data-demo-target="home-department"]', kicker:'PROFILE', title:'Start with the radiology department', body:'Choose this path when you want to understand a radiology service: its equipment, imaging activity, storage, resources, workflow, and any AI used locally.', actionHint:'Next opens an illustrative Department Profile with a grid region, Regional hospital fleet, and example current practices already loaded. You do not need to type anything.'},
      {target:'[data-demo-target="leader-regional-preset"]', kicker:'PROFILE - CONTEXT', title:'Review the current Department baseline', body:'Context is the minimum information CEDARS needs before later stages can be interpreted: grid region, equipment/energy, and imaging workload. This walkthrough has already loaded an illustrative United States context and Regional hospital fleet so you can see the complete flow.', actionHint:'In a real assessment, Workflow, Digital + AI, and Result (EcoLabel) stay locked until these required Context inputs are complete. The walkthrough satisfies the same gate rather than bypassing it.'},
      {target:'#department-workflow-profile', kicker:'PROFILE - WORKFLOW', title:'Describe how care is delivered today', body:'Workflow records what is already true today across the imaging pathway. The walkthrough also loads a few illustrative current practices so the current-state record is meaningful.'},
      {target:'.departmentWorkflowCurrentTally', kicker:'PROFILE - CURRENT STATE', title:'Keep today’s state separate from future changes', body:'The Current Profile Tally summarizes what is documented as true now: current practices, local workflow metrics, energy, and carbon intensity. Selecting a prospective intervention later does not silently rewrite this baseline.', actionHint:'Profile describes today; Decision Workspace asks what could change.'},
      {target:'[data-demo-target="leader-clinical-ai-example"]', kicker:'PROFILE - DIGITAL + AI · OPTIONAL', title:'Add Digital + AI only when it is part of current care', body:'Digital + AI is optional. If the Department uses no local Clinical AI, continue directly to Result (EcoLabel). If it does, document those uses here; the shared technical model record remains in AI Model & Informatics.', actionHint:'Illustrative Clinical AI examples load automatically when you continue.'},
      {target:'#department-score-panel', kicker:'PROFILE - RESULT (ECOLABEL)', title:'Review the current assessed result', body:'Result (EcoLabel) summarizes the current footprint supported by the information entered and shows a Score when enough information is available. Missing or unassessed information remains explicit rather than being treated as zero.'},
      {target:'.footprintBoundaryGrid', kicker:'PROFILE - INTERPRETATION', title:'Know what the Score includes—and what it does not', body:'CEDARS separates the scored operational energy/carbon boundary from extended estimates and categories that were not assessed. The Score is therefore not a complete life-cycle assessment, clinical-quality score, or claim that every environmental impact has been measured.', actionHint:'Interpret the boundary before comparing Scores or reporting the result.'},
      {target:'[data-demo-target="department-improve-state"]', extraTargets:['[data-demo-target="department-improve-workspace"]'], kicker:'DECISION WORKSPACE · OPTIONAL', title:'Test a prospective change without rewriting the Profile', body:'Decision Workspace is optional. It keeps the current Profile fixed while you explore modeled changes, so proposed savings do not silently become part of today’s assessed state.'},
      {target:'[data-demo-target="department-report-reproducibility"]', kicker:'REPORT & SHARE - REPRODUCIBILITY', title:'Carry assumptions and coverage with the result', body:'A useful sustainability result needs its denominator, grid context, boundary, current practices, and unassessed categories. CEDARS keeps those fields beside the result so another reader can understand what was—and was not—measured or modeled.'},
      {target:'[data-demo-target="department-report-materials"]', kicker:'REPORT & SHARE - ECOLABEL', title:'Prepare the Department EcoLabel', body:'The Department EcoLabel is the primary visual CEDARS reporting output. It should travel with the underlying methods and reproducibility information; it is not external certification.'},
      {...SAVE_SHARE_STEP},
    ],
  },
  procure: {
    title: 'Evaluate or use clinical AI',
    shortTitle: 'Clinical AI walkthrough',
    icon: Activity,
    description: 'See how to compare clinically acceptable AI systems, document incomplete vendor lifecycle information, interpret coverage, and report the selected system.',
    steps: [
      {target:'[data-demo-target="home-ai"]', kicker:'PROFILE', title:'Start with AI Model & Informatics', body:'Choose this path when the question is about an AI system itself rather than the whole radiology department.', actionHint:'Next opens the AI start screen.'},
      {target:'[data-demo-target="ai-compare-lane"]', kicker:'PROFILE - CONTEXT', title:'Choose the path that matches your decision', body:'Use Compare candidates when two or more systems address the same clinical need. If one model is already selected, Assess one model is the more direct path.', actionHint:'Next opens an illustrative comparison with enough shared clinical and workload context to compare the candidates.'},
      {target:'.aiComparisonModalSection', kicker:'PROFILE - CONTEXT · COMPARISON', title:'Make the comparison clinically fair first', body:'Compare systems that address the same intended use, endpoint, and validation context. Clinical suitability is the gate: lower environmental impact cannot make a clinically unacceptable system acceptable.'},
      {target:'.aiComparisonModalResults', kicker:'PROFILE - CONTEXT · CANDIDATE COMPARISON', title:'Keep clinical performance and environmental intensity separate', body:'Candidate comparison is a temporary Context sub-workspace, not a second Profile. CEDARS shows reported clinical performance and environmental intensity as separate decision dimensions; Pareto-efficient does not mean clinically recommended.', actionHint:'Next carries illustrative candidate A into the standard AI Profile and opens Training.'},
      {target:'#ai-training-section', kicker:'PROFILE - TRAINING', title:'Record what is known about vendor training', body:'Training still comes before Deployment, even when a vendor does not disclose its training energy. In this illustrative example, CEDARS records training as not disclosed rather than treating the missing value as zero.', actionHint:'Unavailable is not zero. Documenting the gap allows transparent partial-lifecycle reporting.'},
      {target:'#ai-inference-section', kicker:'PROFILE - DEPLOYMENT', title:'Describe recurring deployment', body:'The selected illustrative candidate includes per-study inference energy and an expected monthly workload. Deployment is separate from training because it repeats over time and may use different infrastructure.'},
      {target:'#ai-score-panel', kicker:'PROFILE - RESULT (ECOLABEL)', title:'See what the available lifecycle data support', body:'Result (EcoLabel) reports the lifecycle information the data can support. Because vendor training is unavailable in this example, CEDARS can report inference without pretending an unknown training footprint is zero.'},
      {target:'.aiScoreBasisBar', kicker:'PROFILE - INTERPRETATION', title:'Interpret lifecycle coverage before the number', body:'Training is a one-time cost; inference recurs with each use. When both are known, training can be amortized across expected deployment. When a required phase is unavailable, coverage—not false precision—determines what CEDARS can report.', actionHint:'The environmental result is not a clinical-value score. Clinical performance and patient-care suitability remain separate requirements.'},
      {target:'[data-demo-target="ai-improve-workspace"]', kicker:'DECISION WORKSPACE', title:'Try a deployment change without rewriting the Profile', body:'Explore choices such as hosting, workload, serving configuration, or monitoring while keeping the current AI Profile fixed for comparison.'},
      {target:'[data-demo-target="ai-report-reproducibility"]', kicker:'REPORT & SHARE - REPRODUCIBILITY', title:'Preserve provenance and lifecycle gaps', body:'The scientific record is the assumptions, compute context, provenance, workload, and explicit lifecycle coverage. Partial disclosure is reportable when the missing phase is clearly identified; it should not be silently imputed as zero.'},
      {target:'[data-demo-target="ai-report-materials"]', kicker:'REPORT & SHARE - ECOLABEL', title:'Prepare the AI Research Eco-label', body:'The AI Research Eco-label is a compact visual research summary. Methods, provenance, and lifecycle coverage remain the primary scientific record; the Eco-label is not external certification.'},
      {...SAVE_SHARE_STEP},
    ],
  },
  developer: {
    title: 'Develop or retrain AI',
    shortTitle: 'AI development walkthrough',
    icon: Brain,
    description: 'See how to measure Training and Deployment separately, interpret intensity and lifecycle coverage, test changes, and preserve reproducible measurement details.',
    steps: [
      {target:'[data-demo-target="home-ai"]', kicker:'PROFILE', title:'Start with AI Model & Informatics', body:'Choose this path when your team is building, adapting, fine-tuning, or materially retraining an AI model.'},
      {target:'[data-demo-target="ai-develop-lane"]', kicker:'PROFILE - CONTEXT', title:'Choose Develop / train / fine-tune', body:'This tells CEDARS that you need to describe both one-time training and recurring deployment. Those phases can use different hardware, providers, and locations.'},
      {target:'[data-demo-target="measure-chooser"]', kicker:'PROFILE - MEASUREMENT', title:'Measure energy when you can', body:'CEDARS helps match the compute setup to practical measurement approaches. Measured energy should take precedence over workload-based estimates when it is available, and the measurement source should stay attached to the result.'},
      {target:'[data-demo-target="ai-training-section"]', kicker:'PROFILE - TRAINING', title:'Describe the training work', body:'Training is a one-time lifecycle phase. Enter measured energy when available; otherwise CEDARS can estimate from the workload and hardware information provided. Repeated experiments or fine-tuning runs matter and should not disappear from the accounting.'},
      {target:'[data-demo-target="ai-inference-section"]', kicker:'PROFILE - DEPLOYMENT', title:'Then describe recurring use', body:'Record energy per use together with the expected deployment workload and compute context. Deployment is separate because inference repeats over time and can occur in a different location from training.'},
      {target:'#ai-score-panel', kicker:'PROFILE - RESULT (ECOLABEL)', title:'Review the result supported by your data', body:'CEDARS combines only the lifecycle information supported by the record. Missing phases stay visible. Water and other non-scored impacts remain separate disclosures rather than being forced into the carbon-and-energy Score.'},
      {target:'.aiScoreBasisBar', kicker:'PROFILE - INTERPRETATION', title:'Distinguish intensity from total impact', body:'Amortizing one-time training across more uses can lower carbon intensity per study even while total inference emissions rise with scale. Both questions matter. The CEDARS Score reflects modeled operational carbon intensity, not overall clinical quality or total societal value.'},
      {target:'[data-demo-target="ai-improve-workspace"]', kicker:'DECISION WORKSPACE', title:'Test a possible lifecycle change', body:'Explore changes to experimentation, model settings, serving, compute location, or monitoring without changing the current Profile until something is actually implemented.'},
      {target:'[data-demo-target="ai-report-reproducibility"]', kicker:'REPORT & SHARE - REPRODUCIBILITY', title:'Keep the measurement details with the result', body:'Export assumptions, measurement source, compute context, workload, and provenance so another team can understand or reproduce the environmental accounting later.'},
      {target:'[data-demo-target="ai-report-materials"]', kicker:'REPORT & SHARE - ECOLABEL', title:'Prepare the AI Research Eco-label', body:'The AI Research Eco-label can help communicate the result in slides, posters, or model documentation. Reproducibility fields and methods remain the primary scientific record, and the Eco-label is not external certification.'},
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
        <div className="guidedDemoPopoverTop">
          <div className="guidedDemoProgress"><span>{stepIndex+1} of {demo.steps.length}{kickerLabel ? ` · ${kickerLabel}` : ''}</span><span>{stepIndex+1}/{demo.steps.length}</span></div>
          <button type="button" className="guidedDemoCloseStep" onClick={onExit} aria-label="Exit guided walkthrough"><X size={13}/> Exit demo</button>
        </div>
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
