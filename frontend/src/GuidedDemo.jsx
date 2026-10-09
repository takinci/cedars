import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Activity, Brain, RotateCcw, X} from 'lucide-react';
import './guided-demo.css';

export const GUIDED_DEMOS = {
  leader: {
    title: 'AI already in clinical use',
    shortTitle: 'Department AI demo',
    icon: Activity,
    description: 'See how department operations and clinical AI flow into a CEDARS score, improvement scenarios, and reporting.',
    steps: [
      {
        target: '[data-demo-target="home-department"]',
        kicker: '1 of 8 · INPUT',
        title: 'Start with the care setting',
        body: 'CEDARS can assess a radiology department or an individual AI model. Here, we will start with the department and see how clinical AI fits into the larger footprint.',
        actionHint: 'No typing is required. Next opens the Department pathway with illustrative values.',
      },
      {
        target: '[data-demo-target="assessment-context"]',
        kicker: '2 of 8 · CONTEXT',
        title: 'Set the assumptions shared across the assessment',
        body: 'Your local grid, reporting period, and electricity cost affect department results. AI compute location is tracked separately so a cloud model is not automatically assigned the hospital grid.',
      },
      {
        target: '[data-demo-target="leader-regional-preset"]',
        kicker: '3 of 8 · DEPARTMENT',
        title: 'Build the operational baseline',
        body: 'Equipment and imaging workload determine the energy used to deliver care. This demo uses the illustrative Regional hospital quick start; a real assessment should verify or replace every value.',
        actionHint: 'The Regional hospital values load automatically when you continue.',
      },
      {
        target: '#department-overview',
        kicker: '4 of 8 · FOOTPRINT',
        title: 'See what drives the footprint',
        body: 'CEDARS translates the operational inputs into energy and carbon results while keeping the underlying assumptions editable. Supporting sections add efficiency, infrastructure, resources, cost, and other context.',
      },
      {
        target: '[data-demo-target="leader-clinical-ai-example"]',
        kicker: '5 of 8 · CLINICAL AI',
        title: 'Add AI to the care system',
        body: 'Clinical AI is represented as part of the department rather than as a sustainability silo. The local use record can include inference, allocated lifecycle boundaries, study share, and supported workflow effects.',
        actionHint: 'The two illustrative Clinical AI uses load automatically when you continue.',
      },
      {
        target: '#department-score-panel',
        kicker: '6 of 8 · SCORE & ECOLABEL',
        title: 'Summarize the current state',
        body: 'The CEDARS Score and EcoLabel summarize the assessment you entered. They are not permanent ratings: workload, equipment, energy source, clinical AI use, and other assumptions can change the result.',
      },
      {
        target: '[data-demo-target="department-improve-workspace"]',
        kicker: '7 of 8 · IMPROVE',
        title: 'Move from measurement to decisions',
        body: 'CEDARS ranks modeled opportunities from the current inputs and separates quantified changes from planning guidance. You can build a scenario before implementation rather than treating every idea as a realized saving.',
      },
      {
        target: '[data-demo-target="department-report-materials"]',
        kicker: '8 of 8 · REPORT',
        title: 'Turn the assessment into something usable',
        body: 'Review the disclosure, generate the Department EcoLabel and reporting text, and preserve or share the reproducible assessment. The label is a research reporting output, not external certification.',
      },
    ],
  },
  procure: {
    title: 'Compare AI before purchase',
    shortTitle: 'Procurement demo',
    icon: Activity,
    description: 'Compare two illustrative imaging-AI candidates, select one, and continue through the standard CEDARS assessment and reporting pathway.',
    steps: [
      {
        target: '[data-demo-target="home-ai"]',
        kicker: '1 of 9 · INPUT',
        title: 'Start with a purchasing decision',
        body: 'When you are evaluating AI for clinical use, CEDARS can compare candidates without requiring you to build a model first.',
        actionHint: 'Next opens AI Model & Informatics with an illustrative procurement pathway prepared.',
      },
      {
        target: '[data-demo-target="ai-procure-card"]',
        kicker: '2 of 9 · PROCURE / DEPLOY',
        title: 'Choose a like-for-like comparison',
        body: 'Use Procure / deploy for AI you are evaluating, purchasing, receiving, or preparing for clinical use. Candidate comparison is optional, but useful when more than one model could meet the same clinical need.',
        actionHint: 'Next loads two illustrative candidates under one shared clinical definition.',
      },
      {
        target: '#ai-shared-comparison-definition',
        kicker: '3 of 9 · CLINICAL FIT',
        title: 'Hold the clinical question constant',
        body: 'CEDARS keeps the intended use, endpoint, validation context, workload, and compute assumptions aligned so differences between candidates are easier to interpret.',
      },
      {
        target: '[data-demo-target="ai-candidate-details"]',
        kicker: '4 of 9 · CANDIDATE DETAILS',
        title: 'Review the candidate inputs',
        body: 'These cards contain the information available for each candidate. They are inputs to the comparison, not a second results display. Once reviewed, they can stay collapsed while you focus on the decision.',
      },
      {
        target: '[data-demo-target="ai-candidate-results"]',
        kicker: '5 of 9 · COMPARE',
        title: 'Compare candidates on the same basis',
        body: 'Review reported performance and estimated environmental results side by side. The values in this walkthrough are illustrative rather than vendor claims.',
      },
      {
        target: '[data-demo-target="ai-select-candidate"]',
        kicker: '6 of 9 · SELECT',
        title: 'Carry one candidate forward',
        body: 'Use this candidate moves the selected model into the standard CEDARS AI assessment. Comparison helps you choose; it is not the end of the lifecycle assessment.',
        actionHint: 'Next carries illustrative candidate A into the model assessment automatically.',
      },
      {
        target: '[data-demo-target="ai-selected-candidate"]',
        kicker: '7 of 9 · ASSESS',
        title: 'Continue with the selected model',
        body: 'The selected candidate now uses the canonical AI model record. Review its clinical context and lifecycle information, fill any missing disclosures, and continue through the same assessment pathway as any other model.',
      },
      {
        target: '#ai-score-panel',
        kicker: '8 of 9 · SCORE & ECOLABEL',
        title: 'Review assessment coverage and the result',
        body: 'CEDARS shows the environmental result supported by the available lifecycle data. An overall Score and leaf Rating are assigned only when the required lifecycle inputs are available.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-report-materials"]',
        kicker: '9 of 9 · REPORT',
        title: 'Prepare the environmental disclosure',
        body: 'Finish by reviewing the selected model record, generating the EcoLabel and reporting text, and preserving or sharing the reproducible assessment.',
      },
    ],
  },
  developer: {
    title: 'Locally developed imaging model',
    shortTitle: 'Imaging model demo',
    icon: Brain,
    description: 'Follow a complete illustrative imaging-model record from measured training and inference through reporting.',
    steps: [
      {
        target: '[data-demo-target="home-ai"]',
        kicker: '1 of 12 · INPUT',
        title: 'Start with the model',
        body: 'CEDARS supports both clinical deployment decisions and models being developed or materially retrained. This walkthrough follows an imaging research model from development through reporting.',
        actionHint: 'No typing is required. Next opens AI Model & Informatics with the demo pathway prepared.',
      },
      {
        target: '[data-demo-target="ai-develop-card"]',
        kicker: '2 of 12 · DEVELOP / TRAIN',
        title: 'Choose the lifecycle stage that matches your work',
        body: 'Use Develop / train when your team is building or materially retraining a model. CEDARS can start from measured energy values or help you choose a way to measure them. This walkthrough starts with Help me measure.',
        actionHint: 'Next opens the measurement pathway automatically; you do not need to change any fields.',
      },
      {
        target: '[data-demo-target="measure-chooser"]',
        kicker: '3 of 12 · MEASURE',
        title: 'Measure rather than guess when you can',
        body: 'Tell CEDARS where the model runs, whether you need training or inference numbers, and whether you can instrument the code. The recommendations narrow to tools that fit the setup.',
        actionHint: 'The demo is already set to a local GPU, training + inference, with Python available.',
      },
      {
        target: '[data-demo-target="measure-primary-action"]',
        kicker: '4 of 12 · MEASUREMENT',
        title: 'Show how each energy number was obtained',
        body: 'Energy measured directly from the computer or monitoring software is labeled Measured. Energy calculated from hardware specifications, usage, or published assumptions is labeled Estimated. CEDARS keeps that distinction with the result so readers can see which values were measured and which were calculated.',
        actionHint: 'Next loads a completed illustrative example measured with CodeCarbon.',
      },
      {
        target: '[data-demo-target="ai-model-record"]',
        kicker: '5 of 12 · MODEL & CLINICAL CONTEXT',
        title: 'Describe what the model does and how well it performs',
        body: 'CEDARS interprets environmental impact alongside the model’s clinical purpose and reported performance. This walkthrough uses an illustrative chest-radiograph classifier; its task, architecture, performance measure, validation context, and intended clinical benefit are kept with the environmental record.',
        actionHint: 'The example values are already loaded; no input is required.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-training-section"]',
        kicker: '6 of 12 · TRAINING',
        title: 'Record what training actually required',
        body: 'For this imaging model, CEDARS records dataset size, epochs, input size, precision, hardware, runtime, experiments, measured energy, and compute context together. When measured energy is available, it takes precedence over training workload-based estimates.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-inference-section"]',
        kicker: '7 of 12 · INFERENCE & DEPLOYMENT',
        title: 'Describe how the model will actually be used',
        body: 'Training is generally a one-time development footprint; inference recurs with each use. CEDARS records deployment volume, energy per study or token-based workload, expected lifetime, and the compute context where inference runs.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-water-section"]',
        kicker: '8 of 12 · WATER',
        title: 'Keep water visible even when it is not assessed',
        body: 'Water use is reported separately from the current carbon-and-energy score. If site or grid water data are unavailable, CEDARS says Not assessed rather than treating water use as zero. The methodology is still evolving as provider and location-specific data improve.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-disclosure"]',
        scrollTarget: '[data-demo-target="ai-record-row"]',
        scrollBlock: 'start',
        kicker: '9 of 12 · ASSESSMENT COVERAGE',
        title: 'Check what the assessment actually covers',
        body: 'CEDARS distinguishes measured, estimated, published, not-disclosed, and not-assessed information. A record can be transparently reported while still having an incomplete lifecycle boundary; unknown values are never treated as zero.',
      },
      {
        target: '#ai-score-panel',
        kicker: '10 of 12 · SCORE & ECOLABEL',
        title: 'See when CEDARS can assign an overall score',
        body: 'An overall CEDARS Score requires both a training footprint and an inference workload so the phases can be combined consistently. If one lifecycle phase is unavailable, CEDARS reports the known result separately without awarding a better score for missing information.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-improve-workspace"]',
        kicker: '11 of 12 · IMPROVE',
        title: 'Explore ways to improve efficiency',
        body: 'CEDARS uses the current assessment to show practical opportunities across model development, validation, deployment, and monitoring. These are options to explore rather than assumed savings. After making a change, update the affected inputs to see how the result changes.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-report-reproducibility"]',
        kicker: '12 of 12 · REPORT & SHARE',
        title: 'Turn the assessment into reusable reporting',
        body: 'CEDARS provides the Research EcoLabel, a structured assumptions and provenance table, and copy-ready environmental-impact text. The table can also be copied as Markdown for a manuscript, model card, repository, or technical appendix.',
        actionHint: 'The assumptions table and Methods-ready text are opened automatically in this walkthrough.',
        scrollBlock: 'start',
      },
    ],
  },
  publishedLlm: {
    title: 'Published open-source LLM benchmark',
    shortTitle: 'Published LLM demo',
    icon: Brain,
    description: 'Follow a published, locally run open-source LLM inference benchmark through assessment, improvement options, and reporting while keeping pretraining outside the measured boundary.',
    steps: [
      {
        target: '[data-demo-target="home-ai"]',
        kicker: '1 of 8 · INPUT',
        title: 'Start with a published LLM benchmark',
        body: 'This walkthrough uses a published open-source LLM evaluated locally on chest-radiograph report labeling. Inference energy was measured; model pretraining was not assessed in that study.',
        actionHint: 'No typing is required. Next loads the published benchmark example.',
      },
      {
        target: '[data-demo-target="ai-model-record"]',
        kicker: '2 of 8 · MODEL & CLINICAL CONTEXT',
        title: 'Keep task and performance with the energy result',
        body: 'The example uses Vicuna 1.5 7B for chest-radiograph report labeling. CEDARS keeps the model size, clinical task, reported accuracy, and validation context alongside the measured inference energy.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-inference-section"]',
        kicker: '3 of 8 · MEASURED INFERENCE',
        title: 'Use the measured inference result',
        body: 'The published experiment measured GPU energy with CodeCarbon across the evaluation dataset. CEDARS records the derived per-study inference energy as Measured while keeping the illustrative deployment workload separate.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-water-section"]',
        kicker: '4 of 8 · WATER',
        title: 'Show what was not assessed',
        body: 'Water was not assessed in this example. CEDARS reports that gap explicitly and does not treat it as zero or fold it silently into the carbon-and-energy score.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-disclosure"]',
        scrollTarget: '[data-demo-target="ai-record-row"]',
        scrollBlock: 'start',
        kicker: '5 of 8 · ASSESSMENT COVERAGE',
        title: 'Separate a measured experiment from a complete lifecycle assessment',
        body: 'Measured inference does not imply that pretraining was measured. CEDARS labels pretraining as Not assessed and keeps the record transparent without inventing an upstream footprint.',
      },
      {
        target: '#ai-score-panel',
        kicker: '6 of 8 · RESULT',
        title: 'Report inference without inventing an overall score',
        body: 'CEDARS reports the measured inference footprint, but an overall CEDARS Score is not assigned because the training or pretraining footprint is outside the assessed boundary. Missing information cannot improve the rating.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-improve-workspace"]',
        kicker: '7 of 8 · IMPROVE',
        title: 'Explore lower-compute deployment options',
        body: 'Because this is an externally developed model, CEDARS uses the Procure / deploy improvement pathway. Review efficient serving and hosting options, deployment assumptions, and right-sizing opportunities, then update only the inputs that actually change.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-report-reproducibility"]',
        kicker: '8 of 8 · REPORT & SHARE',
        title: 'Export the measured result and its boundary',
        body: 'The reporting outputs preserve the measured inference result, reported performance, and the fact that pretraining and water were not assessed.',
        actionHint: 'The reporting sections are opened automatically in this walkthrough.',
        scrollBlock: 'start',
      },
    ],
  },
  llm: {
    title: 'Vendor-hosted AI / LLM',
    shortTitle: 'Vendor LLM demo',
    icon: Brain,
    description: 'See how CEDARS handles estimated inference, improvement options, and reporting when training is not disclosed by a vendor.',
    steps: [
      {
        target: '[data-demo-target="home-ai"]',
        kicker: '1 of 9 · INPUT',
        title: 'Start with a hosted AI service',
        body: 'This walkthrough uses an illustrative hosted report-generation LLM. The same framework can also represent other vendor-hosted or multi-step agentic systems.',
        actionHint: 'No typing is required. Next opens the Procure / deploy pathway.',
      },
      {
        target: '[data-demo-target="ai-procure-card"]',
        kicker: '2 of 9 · PROCURE / DEPLOY',
        title: 'Assess a model you did not train locally',
        body: 'For a hosted or vendor model, training information may be unavailable. CEDARS can still document what is known while keeping missing vendor disclosures visible.',
        actionHint: 'Next loads an illustrative report-generation LLM via vendor API.',
      },
      {
        target: '[data-demo-target="ai-model-record"]',
        kicker: '3 of 9 · MODEL & CLINICAL CONTEXT',
        title: 'Describe what the vendor system does',
        body: 'The example is a report-generation LLM accessed through a vendor API. Its task and reported performance stay with the environmental record; training is explicitly marked Not disclosed.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-inference-section"]',
        kicker: '4 of 9 · INFERENCE & DEPLOYMENT',
        title: 'Describe token-based use',
        body: 'For LLM and agentic systems, CEDARS can use energy per 1,000 tokens together with calls per task and tokens per call. Multi-step agents can be represented by increasing the number of calls rather than treating every workflow as a single prompt.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-water-section"]',
        kicker: '5 of 9 · WATER',
        title: 'Keep another unknown visible',
        body: 'Water is also marked Not assessed in this example. CEDARS reports that status separately rather than allowing missing water information to imply a zero footprint.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-disclosure"]',
        scrollTarget: '[data-demo-target="ai-record-row"]',
        scrollBlock: 'start',
        kicker: '6 of 9 · ASSESSMENT COVERAGE',
        title: 'Make the disclosure gap explicit',
        body: 'Inference can be estimated even when upstream training is unavailable. The record can be transparent about that limitation without pretending the lifecycle assessment is complete.',
      },
      {
        target: '#ai-score-panel',
        kicker: '7 of 9 · RESULT',
        title: 'Show only what the available data support',
        body: 'CEDARS reports the inference footprint separately. An overall CEDARS Score and leaf Rating require the lifecycle inputs needed for that calculation; undisclosed training remains unavailable rather than being assumed.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-improve-workspace"]',
        kicker: '8 of 9 · IMPROVE',
        title: 'Improve what you can control',
        body: 'For a hosted LLM, CEDARS focuses on deployment choices you can influence: model tier, calls and tokens, batching or caching, hosting and compute region, and demand growth. These are options to evaluate rather than automatic savings.',
        scrollBlock: 'start',
      },
      {
        target: '[data-demo-target="ai-report-reproducibility"]',
        kicker: '9 of 9 · REPORT & SHARE',
        title: 'Export the assumptions behind the result',
        body: 'CEDARS provides a readable assumptions and provenance table, a Markdown export, and copy-ready environmental-impact text so the inference assumptions and disclosure limits travel with the result.',
        actionHint: 'The reporting sections are opened automatically in this walkthrough.',
        scrollBlock: 'start',
      },
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
  const groups = [
    {
      icon: Activity,
      question: 'How does clinical AI fit into a radiology department?',
      audience: 'For radiology leaders, clinical AI teams, and sustainability / operations teams.',
      options: [
        ['leader', 'AI already in clinical use', 'See AI as one part of the department footprint.'],
        ['procure', 'Compare AI before purchase', 'Compare candidates under the same clinical and deployment assumptions.'],
      ],
    },
    {
      icon: Brain,
      question: 'How do I measure and report an AI model?',
      audience: 'For AI developers, researchers, and imaging informatics teams.',
      options: [
        ['developer', 'Locally developed imaging model', 'Complete illustrative training + inference record.'],
        ['publishedLlm', 'Published open-source LLM benchmark', 'Measured inference; pretraining not assessed.'],
        ['llm', 'Vendor-hosted AI / LLM', 'See how CEDARS handles missing vendor disclosures.'],
      ],
    },
  ];
  return (
    <section className="guidedDemoLauncher" aria-labelledby="guided-demo-title">
      <div className="guidedDemoLauncherHead"><div>
        <span>GUIDED WALKTHROUGHS · ILLUSTRATIVE EXAMPLES</span>
        <h2 id="guided-demo-title">Which example would you like to explore?</h2>
        <p>Choose the question closest to what you are trying to do. Values load automatically, no typing is required, and your current assessment is restored when you exit.</p>
      </div></div>
      <div className="guidedDemoLauncherGrid">
        {groups.map(group => {
          const Icon = group.icon;
          return <article key={group.question} className="guidedDemoChoice" style={{gridTemplateColumns:'auto minmax(0,1fr)',border:'1.5px dashed #a8c8aa',background:'#f6faf3'}}>
            <div className="guidedDemoChoiceIcon"><Icon size={22}/></div>
            <div className="guidedDemoChoiceCopy">
              <strong style={{display:'block',fontSize:15}}>{group.question}</strong>
              <p style={{marginBottom:9}}>{group.audience}</p>
              <div style={{display:'grid',gap:7}}>
                {group.options.map(([key,label,detail]) => <button key={key} type="button" onClick={()=>onStart(key)} style={{gridColumn:'auto',justifySelf:'stretch',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:2,padding:'9px 11px',background:'#fff',color:'#1b5e20',border:'1px solid #a5d6a7',borderRadius:11,boxShadow:'none',textAlign:'left'}}><strong style={{fontSize:11}}>{label} →</strong><span style={{fontSize:9.5,color:'#607d66',fontWeight:600}}>{detail}</span></button>)}
              </div>
            </div>
          </article>;
        })}
      </div>
    </section>
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
    const el = document.querySelector(selector);
    if (!el) { setRect(null); setTargetMissing(true); return; }
    setTargetMissing(false);
    const next = clampRect(el.getBoundingClientRect());
    setRect(next);
  };

  useLayoutEffect(() => {
    if (!selector) return undefined;
    let tries = 0;
    let timer;
    const locate = () => {
      const el = document.querySelector(selector);
      const scrollEl = document.querySelector(scrollSelector);
      if (el && scrollEl) {
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        const behavior = reducedMotion ? 'auto' : 'smooth';
        if (step?.scrollBlock === 'start') {
          const top = Math.max(0, window.scrollY + scrollEl.getBoundingClientRect().top - 92);
          window.scrollTo({top, behavior});
        } else {
          scrollEl.scrollIntoView({behavior, block:'center', inline:'nearest'});
        }
        window.setTimeout(updateRect, reducedMotion ? 40 : 360);
        return;
      }
      tries += 1;
      if (tries < 30) timer = window.setTimeout(locate, 80);
      else setTargetMissing(true);
    };
    locate();
    return () => window.clearTimeout(timer);
  }, [selector, scrollSelector, step?.scrollBlock, stepIndex]);

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
  const popoverStyle = rect
    ? {left:'auto',right:16,bottom:16,top:'auto',transform:'none'}
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
        <div className="guidedDemoProgress"><span>{step.kicker}</span><span>{stepIndex+1}/{demo.steps.length}</span></div>
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
