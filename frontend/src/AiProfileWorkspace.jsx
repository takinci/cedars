// CEDARS_CHUNK_9H1_RESULT_IMPROVE_SIMPLIFICATION
// CEDARS_CHUNK_9J_AI_RESULT_CONSOLIDATION
// CEDARS_CHUNK_9G_PROFILE_RESULT_CONSOLIDATION
import React from 'react';
import StageCarousel from './StageCarousel.jsx';

function statusClass(done, attention=true) {
  return done ? 'complete' : attention ? 'attention' : 'neutral';
}

export default function AiProfileWorkspace({scen, ecoLabel, ecoLabelData, section, onSection, checklistDone=0, checklistTotal=0, onResults, onReport, reviewContent=null, children}) {
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
    else if(section==='review') setProfileStage('review');
    else if(section==='context') setProfileStage('context');
  },[section]);

  React.useEffect(()=>{
    if (typeof window !== 'undefined') window.sessionStorage.setItem('cedars.aiProfileStage', profileStage);
  },[profileStage]);

  const changeStage=key=>{
    setProfileStage(key);
    if(key==='training') onSection('training');
    else if(key==='inference') onSection('inference');
    else if(key==='boundary') onSection('water');
    else if(key==='review') onSection('review');
    else if(key==='context') onSection('context');
  };
  const contextGroupLabel=developMode?'MODEL & WORKLOAD CONTEXT':compareMode?'CLINICAL COMPARISON':'CLINICAL USE CONTEXT';
  const contextFlow='Context → training → deployment → review. Validation and environmental-boundary details stay attached to the same profile.';

  const openAndScroll=id=>{
    const node=document.getElementById(id);
    if (!node) return;
    if (node.tagName==='DETAILS') node.open=true;
    node.scrollIntoView({behavior:'smooth',block:'start'});
  };
  const lifecycle=(key,id)=>{onSection(key);window.setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),50);};

  const NavButton=({label,meta,done,attention=true,active=false,onClick,tone=''})=><button type="button" className={`aiProfileNavItem ${active?'active':''} ${tone}`} onClick={onClick}>
    <span className={`aiProfileNavStatus ${statusClass(done,attention)}`} aria-hidden="true">{done?'✓':attention?'!':'○'}</span>
    <span className="aiProfileNavCopy"><strong>{label}</strong>{meta&&<small>{meta}</small>}</span>
  </button>;

  const stageSteps=[
    {key:'context',title:'Context',detail:purposeDone?'Purpose / workload set':'Purpose, task and evaluation'},
    {key:'training',title:'Training',detail:trainingDone?'Documented':'Add status or measurement'},
    {key:'inference',title:'Deployment',detail:inferenceDone?'Inference / use documented':'Inference, hosting and expected use'},
    {key:'review',title:'Result',detail:reviewDone?`${checklistDone}/${checklistTotal} complete`:`${checklistDone}/${checklistTotal} documented`},
  ];

  return <div className="aiProfileWorkspace aiProfileWorkspaceCarousel" data-ai-stage={profileStage}>
    <StageCarousel label="AI PROFILE" steps={stageSteps} activeKey={profileStage} onChange={changeStage}/>
    <aside className="aiProfileSidebar" aria-label="AI Sustainability Profile sections">
      <div className="aiProfileSidebarIntro"><span>PROFILE</span><strong>AI Sustainability Profile</strong><small>{contextFlow}</small></div>
      <nav className="aiProfileNav">
        <div className="aiProfileNavGroup">
          <span>{contextGroupLabel}</span>
          <NavButton label={developMode?'1 · Task / workload':'1 · Clinical purpose'} meta={purposeDone?null:developMode?'Choose workload type':'Define task and intended use'} done={purposeDone} onClick={()=>{setProfileStage('context');openAndScroll('ai-model-record');}} tone="clinical"/>
          <NavButton label={developMode?'2 · Evaluation & validation':'2 · Performance & validation'} meta={performanceDone?null:compareMode?'Needed before candidate ranking':performanceStarted?'Finish evidence context':developMode?'Supporting context':'Optional unless needed clinically'} done={performanceDone} attention={performanceAttention} onClick={()=>{setProfileStage('context');openAndScroll('ai-performance-section');}} tone="evidence"/>
          {!developMode&&<NavButton label="3 · Workflow & downstream effects" meta={effectsBasis==='none'?'Review local effects':effectsBasis==='published'?'External evidence documented':effectsBasis==='scenario'?'Prospective effect · Decision Workspace':null} done={effectsDone} attention={false} onClick={()=>{setProfileStage('context');openAndScroll('ai-effects-section');}} tone="clinical"/>}
        </div>
        <div className="aiProfileNavGroup">
          <span>LIFECYCLE</span>
          <NavButton label="Training / development" meta={trainingDone?null:'Needs training status'} done={trainingDone} active={section==='training'} onClick={()=>lifecycle('training','ai-training-section')} tone="lifecycle"/>
          <NavButton label="Inference & deployment" meta={inferenceDone?null:'Needs deployment inputs'} done={inferenceDone} active={section==='inference'} onClick={()=>lifecycle('inference','ai-inference-section')} tone="lifecycle"/>
        </div>
        <div className="aiProfileNavGroup">
          <span>BOUNDARY</span>
          <NavButton label="Environmental boundary" meta={boundaryDone?null:'Review water boundary'} done={boundaryDone} active={section==='water'} onClick={()=>{setProfileStage('review');lifecycle('water','ai-water-section');}} tone="boundary"/>
        </div>
      </nav>
      <button type="button" className={`aiProfileReviewAction ${reviewDone?'complete':''}`} onClick={()=>setProfileStage('review')}>
        <span>REVIEW & DISCLOSURE</span><strong>{reviewDone?'Profile ready to interpret':'Review completeness'}</strong><small>{checklistDone} of {checklistTotal} reporting inputs documented</small>
      </button>
      <div className="aiProfileSidebarLegend"><span><i className="complete"/> documented</span><span><i className="neutral"/> optional / not assessed</span><span><i className="attention"/> needs review</span></div>
    </aside>
    <div className={`aiProfileWorkspaceMain aiStageSurface aiStage-${profileStage}`} key={profileStage}>
      {profileStage==='review'
        ? <div className="aiProfileReviewStack consolidatedAiResult">            {reviewContent}
          </div>
        : children}
    </div>
  </div>;
}
