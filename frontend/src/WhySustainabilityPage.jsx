import React from 'react';
import {Leaf, Scan, ArrowRight, FileText, Play, Pause, Zap, Factory, Database, Car} from 'lucide-react';


export function DecisionWorkspaceSwitch({mode='results', kind='department', summary, onResults, onImprove, onReport}) {
  const ai = kind === 'ai';
  return (
    <section id="decision-workspace" className="decisionWorkspace" aria-label="Results and Improve decision workspace">
      <div className="decisionWorkspaceCurrent">
        <span>CURRENT RESULT</span>
        <strong>{summary?.title || (ai ? 'AI Sustainability Profile' : 'Radiology Department')}</strong>
        <small>{summary?.detail || 'Current profile retained as the baseline.'}</small>
      </div>
      <div className="decisionWorkspaceModes" role="tablist" aria-label="Decision workspace view">
        <button type="button" role="tab" aria-selected={mode==='results'} className={mode==='results'?'active':''} onClick={onResults}>
          <span>2</span><div><strong>Results</strong><small>Interpret current state</small></div>
        </button>
        <button type="button" role="tab" aria-selected={mode==='improve'} className={mode==='improve'?'active':''} onClick={onImprove}>
          <span>3</span><div><strong>Improve</strong><small>Test a prospective change</small></div>
        </button>
      </div>
      <button type="button" className="decisionWorkspaceReport" onClick={onReport}>
        <FileText size={17}/><span><strong>Report current result</strong><small>Methods · provenance · outputs</small></span><ArrowRight size={16}/>
      </button>
    </section>
  );
}

export function ReportStudioTabs({active='methods', onChange, kind='department', summary, onResults}) {
  const ai = kind === 'ai';
  const tabs = [
    ['methods','Methods & evidence','Reporting text, assumptions and readiness'],
    ['label',ai?'Research Label':'EcoLabel',ai?'Optional experimental visual summary':'Visual summary and badge'],
    ['share','Save & share','Preserve, transfer or contribute'],
  ];
  return <>
    <section className="reportContextBar" aria-label="Current result being reported">
      <div><span>CURRENT RESULT</span><strong>{summary?.title || (ai?'AI assessment':'Department assessment')}</strong><small>{summary?.detail || 'Current assessment state'}</small></div>
      <button type="button" onClick={onResults}>View Results →</button>
    </section>
    <nav className="reportStudioTabs" aria-label="Report and Share workspace">
      {tabs.map(([key,label,detail])=><button type="button" key={key} className={active===key?'active':''} aria-current={active===key?'page':undefined} onClick={()=>onChange(key)}><span>{label}</span><small>{detail}</small></button>)}
    </nav>
  </>;
}

const STORY_STEPS = [
  {
    key:'system', kicker:'THE WHOLE SYSTEM', title:'Medical imaging has a footprint across its full care pathway.',
    body:'The scanner is only one part of the story. Energy, equipment, data, materials, and travel can all matter.',
    short:'Whole system', icon:Leaf,
  },
  {
    key:'energy', kicker:'ENERGY', title:'Energy is one part of the footprint.',
    body:'Scanners, workstations, storage, and computation use electricity. Carbon impact also depends on where that electricity is generated.',
    short:'Energy', icon:Zap,
  },
  {
    key:'materials', kicker:'EQUIPMENT & MATERIALS', title:'The footprint begins before the scanner turns on.',
    body:'Equipment manufacture, hardware replacement, contrast media, consumables, and waste extend the boundary beyond operational electricity.',
    short:'Materials', icon:Factory,
  },
  {
    key:'imaging', kicker:'IMAGING OPERATION', title:'How imaging is delivered matters.',
    body:'Scanner utilization, active and idle time, protocol length, repeat imaging, and workflow influence environmental intensity per delivered study.',
    short:'Imaging', icon:Scan,
  },
  {
    key:'digital', kicker:'DATA · CLOUD · AI', title:'Data and AI have a footprint too—and can also change care.',
    body:'Clinical quality comes first. Storage, cloud computing, AI training, and repeated inference use resources; AI may also change how care is delivered. Measure the overall effect rather than assuming it.',
    short:'Digital / AI', icon:Database,
  },
  {
    key:'travel', kicker:'PEOPLE & TRAVEL', title:'Care extends beyond the scanner.',
    body:'Patient and workforce travel—and changes in where and how care is delivered—can contribute to the wider system footprint.',
    short:'People', icon:Car,
  },
  {
    key:'resolve', kicker:'THE CEDARS QUESTION', title:'The whole pathway matters.',
    body:'Some impacts are included in the Score, some are shown separately, and some may not yet be assessed. Keep those differences visible, then use the result to make better decisions.',
    short:'Decisions', icon:Leaf,
  },
];

const STORY_TARGETS = {
  system:{cx:842,cy:465,rx:650,ry:350,lineY:465},
  energy:{cx:360,cy:175,rx:205,ry:110,lineY:175},
  materials:{cx:330,cy:460,rx:180,ry:145,lineY:460},
  imaging:{cx:845,cy:475,rx:225,ry:225,lineY:475},
  digital:{cx:1300,cy:430,rx:185,ry:160,lineY:430},
  travel:{cx:1335,cy:755,rx:255,ry:155,lineY:755},
  resolve:{cx:845,cy:475,rx:680,ry:365,lineY:475},
};

function SustainabilityStory() {
  const [active, setActive] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const videoRef = React.useRef(null);
  const activeStep = STORY_STEPS[active] || STORY_STEPS[0];
  const StepIcon = activeStep.icon;
  const target = STORY_TARGETS[activeStep.key];
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const selectStep = React.useCallback((index, pause=true) => {
    setActive(Math.max(0, Math.min(STORY_STEPS.length-1, index)));
    if (pause) setPlaying(false);
  }, []);

  React.useEffect(()=>{
    const video = videoRef.current;
    if (!video) return;
    if (playing && !reducedMotion) {
      video.currentTime = 0;
      const promise = video.play();
      promise?.catch?.(()=>setPlaying(false));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  },[playing,reducedMotion]);

  React.useEffect(()=>{
    if (!playing || reducedMotion) return undefined;
    const timer = window.setInterval(()=>setActive(i=>(i+1)%STORY_STEPS.length), 5400);
    return ()=>window.clearInterval(timer);
  },[playing,reducedMotion]);

  const previous = () => selectStep((active-1+STORY_STEPS.length)%STORY_STEPS.length);
  const next = () => selectStep((active+1)%STORY_STEPS.length);

  return (
    <section className="whyStory contentSurfaceInset" aria-labelledby="why-story-title">
      <div className="whyStoryHeading">
        <span>WHY SUSTAINABILITY?</span>
        <h1 id="why-story-title">Better imaging decisions matter—from the patient to the planet.</h1>
        <p>See where environmental impact enters imaging and medical AI—and where better decisions can reduce it.</p>
      </div>

      <div className="whyStoryLayout">
        <div className="whyStoryStage">
          <div className={`whyStoryMedia target-${activeStep.key} ${playing?'is-playing':''}`}>
            <img src="/why-sustainability-radiology.jpg" alt="Illustration of a medical imaging scanner connected to energy infrastructure, equipment and materials, data and cloud computing, and patient and workforce travel."/>
            <video ref={videoRef} muted loop playsInline preload="metadata" poster="/why-sustainability-radiology.jpg" aria-hidden="true">
              <source src="/radiology_sustainability_hero_loop.mp4" type="video/mp4"/>
            </video>
            <svg className={`whyStoryOverlay target-${activeStep.key}`} viewBox="0 0 1682 934" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <ellipse className="whyStoryTargetHalo" cx={target.cx} cy={target.cy} rx={target.rx} ry={target.ry}/>
              <path className="whyStoryLeader" d={`M ${target.cx+target.rx} ${target.lineY} C ${Math.min(target.cx+target.rx+120,1540)} ${target.lineY}, 1560 ${target.lineY}, 1644 ${target.lineY}`}/>
              <circle className="whyStoryLeaderDot" cx="1644" cy={target.lineY} r="6"/>
            </svg>
          </div>

          <div className="whyStoryTransport">
            <button type="button" className="whyStoryPlay" disabled={reducedMotion} onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Pause sustainability story':'Play sustainability story'} title={reducedMotion?'Auto-play is disabled by your reduced-motion preference':undefined}>
              {playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pause':'Play story'}
            </button>
            <div className="whyStoryProgress" role="group" aria-label="Story chapters">
              {STORY_STEPS.map((step,index)=><button type="button" key={step.key} className={index===active?'active':''} aria-label={`Chapter ${index+1}: ${step.short}`} aria-pressed={index===active} onClick={()=>selectStep(index)}><span>{String(index+1).padStart(2,'0')}</span></button>)}
            </div>
          </div>
        </div>

        <aside className="whyStoryCard" aria-live="polite">
          <div className="whyStoryCardTop">
            <span className="whyStoryCardIcon"><StepIcon size={20}/></span>
            <div><small>{String(active+1).padStart(2,'0')} / {String(STORY_STEPS.length).padStart(2,'0')} · {activeStep.kicker}</small><h2>{activeStep.title}</h2></div>
          </div>
          <p>{activeStep.body}</p>
          {activeStep.key==='resolve' && <div className="whyStoryResolution"><strong>Turn environmental impact into decisions.</strong><span>Profile → Results ↔ Improve → Report</span><div className="whyStoryBoundaryChips"><b>Included in Score</b><b>Shown separately</b><b>Not assessed</b></div></div>}
          <div className="whyStoryCardNav">
            <button type="button" onClick={previous}>← Previous</button>
            <button type="button" className="primary" onClick={next}>{active===STORY_STEPS.length-1?'Restart':'Next'} →</button>
          </div>
        </aside>
      </div>

      <p className="whyFigureNote">Original CEDARS visual story. The illustration is explanatory, not a quantitative allocation of radiology emissions; scientific claims remain defined by the cited evidence and the explicit assessment boundary.</p>
    </section>
  );
}

function EvidenceCta({onEvidence}) {
  return (
    <section className="whyEvidenceCta contentSurfaceInset" aria-label="Evidence behind CEDARS">
      <div><span>EVIDENCE</span><h2>See the research behind CEDARS</h2><p>Browse the studies, standards, and guidance used across the platform.</p></div>
      <button type="button" onClick={onEvidence}>Browse the evidence <ArrowRight size={16}/></button>
    </section>
  );
}

export default function WhySustainabilityPage({onEvidence}) {
  return (
    <main className="whyPage">
      <SustainabilityStory/>
      <EvidenceCta onEvidence={onEvidence}/>
    </main>
  );
}
