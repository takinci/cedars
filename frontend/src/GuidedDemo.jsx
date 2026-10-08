import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Activity, Brain, RotateCcw, X} from 'lucide-react';
import './guided-demo.css';

export const GUIDED_DEMOS = {
  leader: {
    title: 'Radiology AI leader',
    shortTitle: 'Leadership demo',
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
  developer: {
    title: 'AI developer / researcher',
    shortTitle: 'Developer demo',
    icon: Brain,
    description: 'Measure training and inference, track what is measured versus estimated, improve the model, and generate an AI Research EcoLabel.',
    steps: [
      {
        target: '[data-demo-target="home-ai"]',
        kicker: '1 of 10 · INPUT',
        title: 'Start with the model',
        body: 'CEDARS supports both clinical deployment decisions and models being developed or materially retrained. This walkthrough follows a research model from development through reporting.',
        actionHint: 'No typing is required. Next opens AI Model & Informatics with the demo pathway prepared.',
      },
      {
        target: '[data-demo-target="ai-develop-card"]',
        kicker: '2 of 10 · DEVELOP / TRAIN',
        title: 'Choose the lifecycle stage that matches your work',
        body: 'Use Develop / train when your team is building or materially retraining a model. CEDARS can start from measured energy values or help you choose a way to measure them. This walkthrough starts with Help me measure.',
        actionHint: 'Next opens the measurement pathway automatically; you do not need to change any fields.',
      },
      {
        target: '[data-demo-target="measure-chooser"]',
        kicker: '3 of 10 · MEASURE',
        title: 'Measure rather than guess when you can',
        body: 'Tell CEDARS where the model runs, whether you need training or inference numbers, and whether you can instrument the code. The recommendations narrow to tools that fit the setup.',
        actionHint: 'The demo is already set to a local GPU, training + inference, with Python available.',
      },
      {
        target: '[data-demo-target="measure-primary-action"]',
        kicker: '4 of 10 · PROVENANCE',
        title: 'Keep provenance attached to the number',
        body: 'Sensor-based tools can support a Measured provenance badge; usage models and specification-based calculations remain Estimated. CEDARS carries that distinction into the Research EcoLabel instead of presenting every number as equally certain.',
        actionHint: 'Next loads a completed illustrative CodeCarbon record automatically; no measurement needs to be entered during the demo.',
      },
      {
        target: '[data-demo-target="ai-training-section"]',
        kicker: '5 of 10 · TRAINING',
        title: 'Record what training actually required',
        body: 'CEDARS keeps model scale and training workload alongside the compute that performed the work. This imaging example records dataset size, epochs, input size, precision, hardware, runtime, experiments, measured energy, and compute context together. When measured energy is available, it takes precedence over training workload-based estimates.',
      },
      {
        target: '[data-demo-target="ai-inference-section"]',
        kicker: '6 of 10 · INFERENCE & DEPLOYMENT',
        title: 'Describe how the model will actually be used',
        body: 'Training is generally a one-time development footprint; inference recurs with each use. CEDARS records deployment volume, energy per study or token-based workload, expected lifetime, and the compute context where inference runs.',
      },
      {
        target: '[data-demo-target="ai-disclosure"]',
        kicker: '7 of 10 · COMPLETENESS',
        title: 'Know what you actually know',
        body: 'A complete disclosure does not mean every quantity was measured. It means each required element is transparently identified as measured, estimated, literature-derived, not disclosed, or not assessed. This example marks water as not assessed rather than inventing a value.',
      },
      {
        target: '#ai-score-panel',
        kicker: '8 of 10 · SCORE & ECOLABEL',
        title: 'Separate training from recurring inference',
        body: 'CEDARS reports training and inference separately. When deployment workload is available, the one-time training footprint can be amortized across expected use; without it, an inference-only score is explicitly provisional.',
      },
      {
        target: '[data-demo-target="ai-improve-workspace"]',
        kicker: '9 of 10 · IMPROVE',
        title: 'Improve without confusing recommendations with results',
        body: 'CEDARS connects the current model record to practical opportunities across development, validation, deployment, and monitoring. A recommendation does not change the score by itself; after implementation, update the values it actually changes, such as training energy, inference energy, hardware, workload, or compute region.',
      },
      {
        target: '[data-demo-target="ai-report-materials"]',
        kicker: '10 of 10 · RESEARCH ECOLABEL',
        title: 'Generate reproducible research outputs',
        body: 'Download the AI Research EcoLabel, copy Methods-ready environmental-impact text, or export structured fields for a manuscript, model card, repository, poster, or technical appendix. This remains a research assessment, not external certification.',
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
  return (
    <section className="guidedDemoLauncher" aria-labelledby="guided-demo-title">
      <div className="guidedDemoLauncherHead">
        <div>
          <span>GUIDED WALKTHROUGH</span>
          <h2 id="guided-demo-title">Try CEDARS with example data</h2>
          <p>Choose an illustrative role-based walkthrough. Values are loaded automatically, no typing is required, and your current assessment is restored when you exit.</p>
        </div>
      </div>
      <div className="guidedDemoLauncherGrid">
        {Object.entries(GUIDED_DEMOS).map(([key, demo]) => {
          const Icon = demo.icon;
          return <article key={key} className="guidedDemoChoice" style={{border:'1.5px dashed #a8c8aa',background:'#f6faf3'}}>
            <div className="guidedDemoChoiceIcon"><Icon size={22}/></div>
            <div className="guidedDemoChoiceCopy"><span style={{display:'inline-flex',marginBottom:5,padding:'2px 6px',border:'1px solid #b7d3b9',borderRadius:999,background:'#fff',color:'#2E7D32',fontSize:7.5,fontWeight:900,letterSpacing:'.08em'}}>ILLUSTRATIVE EXAMPLE</span><strong style={{display:'block'}}>{demo.title}</strong><p>{demo.description}</p></div>
            <button type="button" onClick={()=>onStart(key)}>Start {key==='leader'?'leadership':'developer'} demo →</button>
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
      if (el) {
        el.scrollIntoView({behavior:'smooth', block:'center', inline:'nearest'});
        window.setTimeout(updateRect, 260);
        return;
      }
      tries += 1;
      if (tries < 30) timer = window.setTimeout(locate, 80);
      else setTargetMissing(true);
    };
    locate();
    return () => window.clearTimeout(timer);
  }, [selector, stepIndex]);

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
    ? {left: Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - 376)), top: rect.bottom + 14 < window.innerHeight - 250 ? rect.bottom + 14 : Math.max(16, rect.top - 238)}
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
          {!last ? <button type="button" onClick={()=>onStepChange(stepIndex+1)}>Next →</button> : <>
            <button type="button" className="guidedDemoSecondary" onClick={onExit}>Return to my assessment</button>
            <button type="button" onClick={onKeepExample}>Explore this example</button>
          </>}
        </div>
      </section>
    </div>
  );
}
