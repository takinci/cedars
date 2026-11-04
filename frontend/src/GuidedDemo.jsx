// CEDARS_CHUNK_9Q5_TRANSACTION_SAFE_THEME_WALKTHROUGH
// CEDARS_CHUNK_9R16_SEMANTIC_COLOR_WALKTHROUGH_AI_ENTRY
// CEDARS_CHUNK_9H1_RESULT_IMPROVE_SIMPLIFICATION
// CEDARS_CHUNK_9R31A_FINAL_WALKTHROUGH_REPORT_COPY
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
    title: 'Radiology Department and Clinical AI',
    shortTitle: 'Department walkthrough',
    icon: Activity,
    description: 'Build the current Department Profile, see the EcoLabel, test prospective changes, and prepare a reproducible report.',
    steps: [
      {
        target:'[data-demo-target="home-department"]',
        kicker:'PROFILE',
        title:'Start with the radiology department',
        body:'Choose this path when you want to understand the environmental footprint of a radiology service as a whole—not just one scanner or one AI model. CEDARS connects equipment, imaging volume, workflow, infrastructure, and any Clinical AI used locally.',
        actionHint:'Next opens an illustrative Department Profile. Demo data are prefilled so you can focus on the sequence rather than data entry.',
      },
      {
        target:'[data-demo-target="leader-regional-preset"]',
        kicker:'PROFILE - CONTEXT',
        title:'Establish the current baseline',
        body:'Context answers the basic question: what service exists today? Record the grid/location, equipment or energy baseline, and imaging workload before interpreting later results.',
        actionHint:'In a real assessment, Workflow, optional Clinical AI, and Result (EcoLabel) stay locked until these required Context inputs are complete.',
      },
      {
        target:'#department-workflow-profile',
        kicker:'PROFILE - WORKFLOW',
        title:'Describe how care is delivered today',
        body:'Workflow records current operations across Order / need, Schedule / prepare, Acquire, Process / interpret, Store / follow-up, and Infrastructure & lifecycle. Current practices belong here only when they are already implemented.',
        actionHint:'The same workflow stages appear later in Decision Workspace, so today’s practices and proposed changes stay directly linked.',
      },
      {
        target:'.departmentWorkflowCurrentTally',
        kicker:'PROFILE - CURRENT STATE',
        title:'See the current Profile tally',
        body:'The tally summarizes what is true now: current practices, local workflow measures, workload, operational energy, estimated electricity cost, and carbon intensity. This is the baseline CEDARS carries forward.',
        actionHint:'Profile describes today. Decision Workspace asks what could change without rewriting today’s record.',
      },
      {
        target:'[data-demo-target="leader-clinical-ai-example"]',
        kicker:'PROFILE - CLINICAL AI · OPTIONAL',
        title:'Add Clinical AI only when it is used locally',
        body:'Clinical AI is optional in the Department Profile. If none is deployed locally, continue to Result (EcoLabel). If AI is used, record its local use here so its compute and supported workflow effects can be represented in the Department assessment.',
        actionHint:'The model’s detailed technical record still lives in AI Model & Informatics; the Department stage records how that model is actually used in this service.',
      },
      {
        target:'#department-score-panel',
        kicker:'PROFILE - RESULT (ECOLABEL)',
        title:'Review the current assessed result',
        body:'Result (EcoLabel) summarizes the current Department assessment in the shared CEDARS EcoLabel format: Score and Rating when supported, what the assessment covers, key results, assessment context, and provenance.',
        actionHint:'Categories assessed outside the Score or not assessed remain visible instead of being silently treated as zero.',
      },
      {
        target:'.scoreEverydayPanel',
        kicker:'PROFILE - INTERPRET THE RESULT',
        title:'Put the result in everyday terms',
        body:'CEDARS can translate the footprint into familiar comparisons and lets you choose whether those examples explain the scored operational footprint or a broader set of assessed carbon categories. These comparisons are for scale and interpretation—not carbon offsets.',
        actionHint:'Use the coverage information beside the result to see which categories were included, assessed separately, or not assessed.',
      },
      {
        target:'[data-demo-target="department-improve-state"]',
        extraTargets:['[data-demo-target="department-improve-workspace"]'],
        kicker:'DECISION WORKSPACE · OPTIONAL',
        title:'Test a possible change',
        body:'Decision Workspace keeps the current Profile fixed and asks “what if?” using the same workflow stages. Compare the baseline with a prospective scenario for energy, carbon, and estimated electricity cost without turning a proposed change into current practice.',
        actionHint:'Practices already documented in the Profile are carried forward and are not credited again as new savings.',
      },
      {
        target:'[data-demo-target="department-report-materials"]',
        kicker:'REPORT & SHARE - ECOLABEL',
        title:'Carry the same EcoLabel into reporting',
        body:'Report & Share starts with the Department EcoLabel you already reviewed in Result. It is the same assessment summary—not a new calculation—and can be used as the visual reporting output.',
      },
      {
        target:'[data-demo-target="department-report-reproducibility"]',
        kicker:'REPORT & SHARE - METHODS',
        title:'Keep the methods with the result',
        body:'Methods and reproducibility information explain how the result was produced: denominator, grid context, current practices, assumptions, evidence provenance, and assessment coverage. Keep this context with the EcoLabel when the result is reported or shared.',
      },
      {...SAVE_SHARE_STEP},
    ],
  },

  procure: {
    title: 'Evaluate or use Clinical AI',
    shortTitle: 'Clinical AI walkthrough',
    icon: Activity,
    description: 'Compare or assess a Clinical AI system, document what is known about its lifecycle, interpret the EcoLabel, test deployment choices, and report the result.',
    steps: [
      {
        target:'[data-demo-target="home-ai"]',
        kicker:'PROFILE',
        title:'Start with AI Model & Informatics',
        body:'Choose this path when the question is about an AI system itself—such as selecting, procuring, or evaluating a model—rather than the footprint of the whole radiology department.',
        actionHint:'Next opens the AI start screen.',
      },
      {
        target:'[data-demo-target="ai-compare-lane"]',
        kicker:'PROFILE - CONTEXT',
        title:'Choose the decision you are making',
        body:'Compare candidates when two or more systems address the same clinical need. If one model is already selected or deployed, assess that model directly instead.',
        actionHint:'Next opens an illustrative candidate comparison using the same clinical task and workload context.',
      },
      {
        target:'.aiComparisonModalSection',
        kicker:'PROFILE - CONTEXT · COMPARISON',
        title:'Make the clinical comparison fair first',
        body:'Compare systems only when the intended use, relevant endpoint, and validation context are meaningfully comparable. Clinical suitability is the gate: lower environmental impact cannot make an unsuitable system acceptable.',
      },
      {
        target:'.aiComparisonModalResults',
        kicker:'PROFILE - CONTEXT · CANDIDATE COMPARISON',
        title:'Keep clinical performance and environmental intensity separate',
        body:'CEDARS shows clinical evidence and environmental intensity as separate decision dimensions. A model can be environmentally efficient without being the right clinical choice, and “Pareto-efficient” does not mean clinically recommended.',
        actionHint:'Next carries one illustrative candidate into the standard AI Profile.',
      },
      {
        target:'#ai-training-section',
        kicker:'PROFILE - TRAINING',
        title:'Record what is known about training',
        body:'Training is a one-time lifecycle phase. Vendor training information may be incomplete; when it is unavailable, CEDARS records the gap rather than treating unknown training energy as zero.',
        actionHint:'Transparent partial information is preferable to false completeness.',
      },
      {
        target:'#ai-inference-section',
        kicker:'PROFILE - DEPLOYMENT',
        title:'Describe recurring deployment',
        body:'Deployment records the energy per use, expected workload, compute context, and relevant local workflow effects. It is separate from training because inference repeats over time and may run on different infrastructure.',
      },
      {
        target:'#ai-score-panel',
        kicker:'PROFILE - RESULT (ECOLABEL)',
        title:'See what the available lifecycle data support',
        body:'Result (EcoLabel) uses the same CEDARS EcoLabel family as the Department pathway. It reports only what the available lifecycle record supports; unavailable training is not silently converted to zero.',
      },
      {
        target:'.aiEverydayPanel',
        kicker:'PROFILE - INTERPRET THE RESULT',
        title:'Interpret per-use and deployment impact',
        body:'CEDARS can show the result per study and over the expected deployment period. When training is available it can be combined with recurring inference; when training is unavailable, the known deployment footprint is clearly labeled as partial.',
        actionHint:'Everyday comparisons help explain scale. Clinical performance and patient-care suitability remain separate requirements.',
      },
      {
        target:'[data-demo-target="ai-improve-workspace"]',
        kicker:'DECISION WORKSPACE',
        title:'Test a deployment choice',
        body:'Explore prospective changes such as workload, hosting, serving configuration, compute location, or monitoring while keeping the current AI Profile fixed for comparison.',
      },
      {
        target:'[data-demo-target="ai-report-materials"]',
        kicker:'REPORT & SHARE - ECOLABEL',
        title:'Carry the AI Research EcoLabel into reporting',
        body:'Report & Share starts with the same AI Research EcoLabel you reviewed in Result. It is a compact summary of the current lifecycle assessment, not a separate recalculation.',
      },
      {
        target:'[data-demo-target="ai-report-reproducibility"]',
        kicker:'REPORT & SHARE - METHODS',
        title:'Preserve provenance and lifecycle gaps',
        body:'Keep the assumptions, measurement or estimation method, compute context, workload, and explicit lifecycle coverage with the result. Partial disclosure is reportable when the missing phase is clearly identified.',
      },
      {...SAVE_SHARE_STEP},
    ],
  },

  developer: {
    title: 'Develop or retrain AI',
    shortTitle: 'AI development walkthrough',
    icon: Brain,
    description: 'Measure or estimate training and deployment, interpret lifecycle impact, test prospective changes, and preserve a reproducible AI environmental record.',
    steps: [
      {
        target:'[data-demo-target="home-ai"]',
        kicker:'PROFILE',
        title:'Start with AI Model & Informatics',
        body:'Choose this path when your team is building, adapting, fine-tuning, or materially retraining an AI model.',
      },
      {
        target:'[data-demo-target="ai-develop-lane"]',
        kicker:'PROFILE - CONTEXT',
        title:'Choose Develop / train / fine-tune',
        body:'Start by defining the clinical purpose and model/task context. CEDARS then keeps one-time Training separate from recurring Deployment because the phases may use different hardware, providers, and locations.',
      },
      {
        target:'[data-demo-target="measure-chooser"]',
        kicker:'PROFILE - MEASUREMENT',
        title:'Measure energy when you can',
        body:'CEDARS helps match your compute setup to practical measurement approaches. Directly measured energy should take precedence over workload-based estimates when feasible, and the measurement source stays attached to the result.',
      },
      {
        target:'[data-demo-target="ai-training-section"]',
        kicker:'PROFILE - TRAINING',
        title:'Describe the training work',
        body:'Record one-time development energy, including materially relevant experiments, fine-tuning, repeats, or retraining. Use measured energy when available; otherwise CEDARS can estimate from the workload and hardware information you provide.',
      },
      {
        target:'[data-demo-target="ai-inference-section"]',
        kicker:'PROFILE - DEPLOYMENT',
        title:'Then describe recurring use',
        body:'Record energy per use together with expected workload and deployment compute context. This phase repeats over time, so a small per-use footprint can still become important at large scale.',
      },
      {
        target:'#ai-score-panel',
        kicker:'PROFILE - RESULT (ECOLABEL)',
        title:'Review the result supported by the record',
        body:'Result (EcoLabel) combines only the lifecycle information supported by your inputs. Missing phases stay visible, and water or other separately reported resources are not forced into the carbon-and-energy Score.',
      },
      {
        target:'.aiEverydayPanel',
        kicker:'PROFILE - INTERPRET THE RESULT',
        title:'Distinguish intensity from total impact',
        body:'CEDARS lets you view the footprint per study and over the expected deployment period. Amortizing one-time training across more uses can lower per-study intensity even while total inference emissions rise as use grows.',
        actionHint:'Both views answer useful but different questions; neither is a clinical-quality score.',
      },
      {
        target:'[data-demo-target="ai-improve-workspace"]',
        kicker:'DECISION WORKSPACE',
        title:'Test a possible lifecycle change',
        body:'Explore prospective changes to experimentation, model settings, serving, compute location, workload, or monitoring without changing the current Profile until something is actually implemented.',
      },
      {
        target:'[data-demo-target="ai-report-materials"]',
        kicker:'REPORT & SHARE - ECOLABEL',
        title:'Carry the AI Research EcoLabel into reporting',
        body:'Use the same AI Research EcoLabel from Result as the compact visual summary for a manuscript, poster, model card, presentation, or technical report.',
      },
      {
        target:'[data-demo-target="ai-report-reproducibility"]',
        kicker:'REPORT & SHARE - METHODS',
        title:'Keep the measurement details with the result',
        body:'Preserve assumptions, measurement or estimation source, compute context, workload, and provenance so another reader can understand or reproduce the environmental accounting.',
      },
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
