import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
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
        advanceOnTargetClick: true,
        actionHint: 'Click Radiology Department to continue.',
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
        advanceOnTargetClick: true,
        actionHint: 'Click Regional hospital to load the example fleet.',
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
        advanceOnTargetClick: true,
        actionHint: 'Click Load example Clinical AI to add two illustrative uses.',
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
    description: 'Measure training and inference, track what is measured versus estimated, and generate an AI Research EcoLabel.',
    steps: [
      {
        target: '[data-demo-target="home-ai"]',
        kicker: '1 of 8 · INPUT',
        title: 'Start with the model',
        body: 'CEDARS supports both clinical deployment decisions and models being developed or materially retrained. This walkthrough follows a research model from development through reporting.',
        advanceOnTargetClick: true,
        actionHint: 'Click AI Model & Informatics to continue.',
      },
      {
        target: '[data-demo-target="ai-develop-action"]',
        kicker: '2 of 8 · DEVELOP / TRAIN',
        title: 'Choose the lifecycle stage that matches your work',
        body: 'Use Develop / train when your team is building or materially retraining the model. This example starts with Help me measure so CEDARS can point to an appropriate measurement method before values are reported.',
        advanceOnTargetClick: true,
        actionHint: 'Click Characterize this model to open the measurement pathway.',
      },
      {
        target: '[data-demo-target="measure-chooser"]',
        kicker: '3 of 8 · MEASURE',
        title: 'Measure rather than guess when you can',
        body: 'Tell CEDARS where the model runs, whether you need training or inference numbers, and whether you can instrument the code. The recommendations narrow to tools that fit the setup.',
      },
      {
        target: '[data-demo-target="measure-primary-action"]',
        kicker: '4 of 8 · PROVENANCE',
        title: 'Keep provenance attached to the number',
        body: 'Sensor-based tools can support a Measured provenance badge; usage models and specification-based calculations remain Estimated. CEDARS carries that distinction into the Research EcoLabel instead of presenting every number as equally certain.',
        advanceOnTargetClick: true,
        actionHint: 'Click I ran it — enter results to continue with a completed measured example.',
      },
      {
        target: '[data-demo-target="ai-model-record"]',
        kicker: '5 of 8 · MODEL RECORD',
        title: 'Keep one reproducible model record',
        body: 'The model, task, dataset, hardware, experiments, training energy, inference energy, and compute context live in one shared record. This demo now uses the illustrative measured chest-radiograph classifier already included in CEDARS.',
      },
      {
        target: '[data-demo-target="ai-disclosure"]',
        kicker: '6 of 8 · COMPLETENESS',
        title: 'Know what you actually know',
        body: 'Disclosure completeness shows what is still missing, while measured, estimated, literature-derived, and not-disclosed provenance remain visible. The goal is transparent reporting, not false precision.',
      },
      {
        target: '#ai-score-panel',
        kicker: '7 of 8 · SCORE & ECOLABEL',
        title: 'Separate training from recurring inference',
        body: 'CEDARS reports training and inference separately. When deployment workload is available, the one-time training footprint can be amortized across expected use; without it, an inference-only score is explicitly provisional.',
      },
      {
        target: '[data-demo-target="ai-report-materials"]',
        kicker: '8 of 8 · RESEARCH ECOLABEL',
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
          <p>Choose a role-based walkthrough. Demo data are illustrative and your current assessment is restored when you exit.</p>
        </div>
      </div>
      <div className="guidedDemoLauncherGrid">
        {Object.entries(GUIDED_DEMOS).map(([key, demo]) => {
          const Icon = demo.icon;
          return <article key={key} className="guidedDemoChoice">
            <div className="guidedDemoChoiceIcon"><Icon size={22}/></div>
            <div className="guidedDemoChoiceCopy"><strong>{demo.title}</strong><p>{demo.description}</p></div>
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
    if (!step?.advanceOnTargetClick || !selector) return undefined;
    const el = document.querySelector(selector);
    if (!el) return undefined;
    const advance = () => window.setTimeout(() => onStepChange(Math.min(stepIndex + 1, demo.steps.length - 1)), 40);
    el.addEventListener('click', advance, {once:true});
    return () => el.removeEventListener('click', advance);
  }, [selector, step?.advanceOnTargetClick, stepIndex, demo, onStepChange]);

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
        <strong>DEMO MODE · {demo.shortTitle}</strong><span>Illustrative example data</span>
        <button type="button" onClick={onRestart}><RotateCcw size={13}/> Restart</button>
        <button type="button" onClick={onExit}><X size={13}/> Exit demo</button>
      </div>
      {rect ? blockers.map(b=><div key={b.key} className="guidedDemoBlocker" style={b.style}/>) : <div className="guidedDemoBlocker guidedDemoFullBlocker"/>}
      {rect && <div className="guidedDemoSpotlight" style={{left:rect.left,top:rect.top,width:rect.width,height:rect.height}}/>}
      <section className="guidedDemoPopover" role="dialog" aria-label={`${demo.title} guided walkthrough`} style={popoverStyle}>
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
