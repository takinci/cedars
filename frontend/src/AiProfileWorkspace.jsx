import React from 'react';
import './chunk7n.css';

function statusClass(done, attention=true) {
  return done ? 'complete' : attention ? 'attention' : 'neutral';
}

export default function AiProfileWorkspace({scen, ecoLabel, ecoLabelData, section, onSection, checklistDone=0, checklistTotal=0, children}) {
  const compareMode=scen.aiRoute==='compare';
  const developMode=scen.aiRoute!=='compare' && scen.ownMode!=='spec';
  const purposeDone=Boolean(String(ecoLabel.taskType||'').trim() && String(scen.modelIntendedUse||'').trim());
  const performanceStarted=Boolean(String(scen.performanceSource||'').trim() || String(scen.performanceValidationContext||'').trim() || String(scen.performanceSupporting||'').trim() || String(scen.performanceUncertainty||'').trim());
  const performanceDone=Boolean(String(scen.accuracyMetric||'').trim() && scen.accuracyPct!=='' && scen.accuracyPct!=null && String(scen.performanceSource||'').trim());
  const performanceAttention=compareMode || performanceStarted;
  const effectsBasis=scen.clinicalEffectBasis||'none';
  const effectsDone=effectsBasis!=='none';
  const trainingDone=Boolean(ecoLabelData.trainingAvailable || ecoLabel.trainDisclosed==='no');
  const inferenceDone=Boolean(Number(ecoLabelData.inferKwhPerStudy)>0 && ecoLabelData.hasInference);
  const boundaryDone=ecoLabelData.waterProv==='not-assessed' || (ecoLabelData.waterProv && ecoLabelData.waterProv!=='screening');
  const reviewDone=checklistTotal>0 && checklistDone===checklistTotal;
  const contextGroupLabel=developMode?'PURPOSE & EVALUATION':compareMode?'CLINICAL COMPARISON':'CLINICAL USE CONTEXT';
  const contextFlow=developMode?'Purpose/evaluation → training → inference/deployment → boundary.':'Clinical context → training → deployment → boundary.';

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

  return <div className="aiProfileWorkspace">
    <aside className="aiProfileSidebar" aria-label="AI Sustainability Profile sections">
      <div className="aiProfileSidebarIntro"><span>PROFILE</span><strong>AI Sustainability Profile</strong><small>{contextFlow}</small></div>
      <nav className="aiProfileNav">
        <div className="aiProfileNavGroup">
          <span>{contextGroupLabel}</span>
          <NavButton label={developMode?'1 · Purpose':'1 · Clinical purpose'} meta={purposeDone?null:developMode?'Define task and objective':'Define task and intended use'} done={purposeDone} onClick={()=>openAndScroll('ai-model-record')} tone="clinical"/>
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
    <div className="aiProfileWorkspaceMain">{children}</div>
  </div>;
}
