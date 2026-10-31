import React from 'react';
import StageCarousel from './StageCarousel.jsx';

function statusClass(done, attention=true) {
  return done ? 'complete' : attention ? 'attention' : 'neutral';
}

export default function AiProfileWorkspace({scen, ecoLabel, ecoLabelData, section, onSection, checklistDone=0, checklistTotal=0, children}) {
  const compareMode=scen.aiRoute==='compare';
  const developMode=scen.aiRoute!=='compare' && scen.ownMode!=='spec';
  const purposeDone=developMode ? Boolean(String(ecoLabel.taskType||'').trim()) : Boolean(String(ecoLabel.taskType||'').trim() && String(scen.modelIntendedUse||'').trim());
  const performanceStarted=Boolean(String(scen.performanceSource||'').trim() || String(scen.performanceValidationContext||'').trim() || String(scen.performanceSupporting||'').trim() || String(scen.performanceUncertainty||'').trim());
  const performanceDone=Boolean(String(scen.accuracyMetric||'').trim() && scen.accuracyPct!=='' && scen.accuracyPct!=null && String(scen.performanceSource||'').trim());
  const performanceAttention=compareMode || performanceStarted;
  const effectsBasis=scen.clinicalEffectBasis||'none';
  const effectsDone=effectsBasis!=='none';
  const trainingDone=Boolean(ecoLabelData.trainingAvailable || ecoLabel.trainDisclosed==='no');
  const inferenceDone=Boolean(Number(ecoLabelData.inferKwhPerStudy)>0 && ecoLabelData.hasInference);
  const boundaryDone=ecoLabelData.waterProv==='not-assessed' || (ecoLabelData.waterProv && ecoLabelData.waterProv!=='screening');
  const reviewDone=checklistTotal>0 && checklistDone===checklistTotal;
  const [profileStage,setProfileStage]=React.useState('context');

  React.useEffect(()=>{
    if(section==='training') setProfileStage('training');
    else if(section==='inference') setProfileStage('inference');
    else if(section==='water') setProfileStage('boundary');
  },[section]);

  const changeStage=key=>{
    setProfileStage(key);
    if(key==='training') onSection('training');
    else if(key==='inference') onSection('inference');
    else if(key==='boundary') onSection('water');
  };
  const contextGroupLabel=developMode?'MODEL & WORKLOAD CONTEXT':compareMode?'CLINICAL COMPARISON':'CLINICAL USE CONTEXT';
  const contextFlow=developMode?'Task/workload → training → inference/deployment → boundary.':'Clinical context → training → deployment → boundary.';

  const openAndScroll=id=>{
    const node=document.getElementById(id);
    if (!node) return;
    if (node.tagName==='DETAILS') node.open=true;
    node.scrollIntoView({behavior:'smooth',block:'start'});
  };
  const reviewReporting=()=>document.querySelector('[data-demo-target="ai-disclosure"]')?.scrollIntoView({behavior:'smooth',block:'center'});
  const lifecycle=(key,id)=>{onSection(key);window.setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),50);};

  const NavButton=({label,meta,done,attention=true,active=false,onClick,tone=''})=><button type="button" className={`aiProfileNavItem ${active?'active':''} ${tone}`} onClick={onClick}>
    <span className={`aiProfileNavStatus ${statusClass(done,attention)}`} aria-hidden="true">{done?'✓':attention?'!':'○'}</span>
    <span className="aiProfileNavCopy"><strong>{label}</strong>{meta&&<small>{meta}</small>}</span>
  </button>;

  const stageSteps=[
    {key:'context',title:developMode?'Task / context':'Clinical context',detail:developMode?'Workload, evaluation, optional metadata':'Purpose, evidence and workflow context'},
    {key:'training',title:'Training',detail:trainingDone?'Documented':'Add status or measurement'},
    {key:'inference',title:'Inference & deployment',detail:inferenceDone?'Documented':'Add energy and expected use'},
    {key:'boundary',title:'Boundary',detail:boundaryDone?'Reviewed':'Review water and boundary'},
    {key:'review',title:'Review',detail:reviewDone?`${checklistDone}/${checklistTotal} complete`:`${checklistDone}/${checklistTotal} documented`},
  ];


  return <div className="aiProfileWorkspace aiProfileWorkspaceCarousel" data-ai-stage={profileStage}>
    <StageCarousel label="AI PROFILE" steps={stageSteps} activeKey={profileStage} onChange={changeStage}/>
    <aside className="aiProfileSidebar" aria-label="AI Sustainability Profile sections">
      <div className="aiProfileSidebarIntro"><span>PROFILE</span><strong>AI Sustainability Profile</strong><small>{contextFlow}</small></div>
      <nav className="aiProfileNav">
        <div className="aiProfileNavGroup">
          <span>{contextGroupLabel}</span>
          <NavButton label={developMode?'1 · Task / workload':'1 · Clinical purpose'} meta={purposeDone?null:developMode?'Choose workload type':'Define task and intended use'} done={purposeDone} onClick={()=>openAndScroll('ai-model-record')} tone="clinical"/>
          <NavButton label={developMode?'2 · Evaluation & validation':'2 · Performance & validation'} meta={performanceDone?null:compareMode?'Needed before candidate ranking':performanceStarted?'Finish evidence context':developMode?'Optional for development accounting':'Optional unless needed clinically'} done={performanceDone} attention={performanceAttention} onClick={()=>openAndScroll('ai-performance-section')} tone="evidence"/>
          {!developMode&&<NavButton label="3 · Workflow effects" meta={effectsBasis==='none'?'Optional · no current effect credit':effectsBasis==='published'?'External evidence · report only':effectsBasis==='scenario'?'Scenario · Improve only':null} done={effectsDone} attention={false} onClick={()=>openAndScroll('ai-effects-section')} tone="clinical"/>}
        </div>
        <div className="aiProfileNavGroup">
          <span>LIFECYCLE</span>
          <NavButton label="1 · Training / development" meta={trainingDone?null:'Needs training status'} done={trainingDone} active={section==='training'} onClick={()=>lifecycle('training','ai-training-section')} tone="lifecycle"/>
          <NavButton label="2 · Inference & deployment" meta={inferenceDone?null:'Needs deployment inputs'} done={inferenceDone} active={section==='inference'} onClick={()=>lifecycle('inference','ai-inference-section')} tone="lifecycle"/>
        </div>
        <div className="aiProfileNavGroup">
          <span>BOUNDARY</span>
          <NavButton label="Environmental boundary" meta={boundaryDone?null:'Review water boundary'} done={boundaryDone} active={section==='water'} onClick={()=>lifecycle('water','ai-water-section')} tone="boundary"/>
        </div>
      </nav>
      <button type="button" className={`aiProfileReviewAction ${reviewDone?'complete':''}`} onClick={reviewReporting}>
        <span>REPORTING CHECK</span><strong>{reviewDone?'Reporting inputs documented':'Review completeness'}</strong><small>{reviewDone?`${checklistDone} of ${checklistTotal} complete`:`${checklistDone} of ${checklistTotal} complete · review before export`}</small>
      </button>
      <div className="aiProfileSidebarLegend"><span><i className="complete"/> documented</span><span><i className="neutral"/> optional / not assessed</span><span><i className="attention"/> needs review</span></div>
    </aside>
    <div className={`aiProfileWorkspaceMain aiStageSurface aiStage-${profileStage}`} key={profileStage}>
      {profileStage==='review'
        ? <section className="aiProfileReviewPanel">
            <span>PROFILE REVIEW</span>
            <h2>{reviewDone?'Profile ready for Results':'Review reporting completeness'}</h2>
            <p>{checklistDone} of {checklistTotal} reporting inputs are documented. Missing phases remain explicit rather than being treated as zero.</p>
            <div className="aiProfileReviewProgress" role="progressbar" aria-valuemin="0" aria-valuemax={checklistTotal||1} aria-valuenow={checklistDone}><span style={{width:`${checklistTotal?Math.round(checklistDone/checklistTotal*100):0}%`}}/></div>
          </section>
        : children}
    </div>
  </div>;
}
