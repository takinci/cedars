import React from 'react';

function statusClass(done, attention=true) {
  return done ? 'complete' : attention ? 'attention' : 'neutral';
}

export default function AiProfileWorkspace({scen, ecoLabel, ecoLabelData, section, onSection, checklistDone=0, checklistTotal=0, children}) {
  const purposeDone=Boolean(String(ecoLabel.taskType||'').trim() && String(scen.modelIntendedUse||'').trim());
  const performanceDone=Boolean(String(scen.accuracyMetric||'').trim() && scen.accuracyPct!=='' && scen.accuracyPct!=null);
  const effectsDone=Boolean(scen.clinicalEffectBasis);
  const technicalDone=Boolean(String(ecoLabel.architecture||'').trim());
  const trainingDone=Boolean(ecoLabelData.trainingAvailable || ecoLabel.trainDisclosed==='no');
  const inferenceDone=Boolean(Number(ecoLabelData.inferKwhPerStudy)>0 && ecoLabelData.hasInference);
  const boundaryDone=ecoLabelData.waterProv==='not-assessed' || (ecoLabelData.waterProv && ecoLabelData.waterProv!=='screening');
  const reviewDone=checklistTotal>0 && checklistDone===checklistTotal;

  const openAndScroll=id=>{
    const node=document.getElementById(id);
    if (!node) return;
    if (node.tagName==='DETAILS') node.open=true;
    node.scrollIntoView({behavior:'smooth',block:'start'});
  };
  const reviewReporting=()=>document.querySelector('[data-demo-target="ai-disclosure"]')?.scrollIntoView({behavior:'smooth',block:'center'});
  const lifecycle=(key,id)=>{onSection(key);window.setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),50);};

  const NavButton=({label,meta,done,attention=true,active=false,onClick,tone=''})=><button type="button" className={`aiProfileNavItem ${active?'active':''} ${tone}`} onClick={onClick}>
    <span className={`aiProfileNavStatus ${statusClass(done,attention)}`} aria-hidden="true">{done?'✓':'•'}</span>
    <span className="aiProfileNavCopy"><strong>{label}</strong>{meta&&<small>{meta}</small>}</span>
  </button>;

  return <div className="aiProfileWorkspace">
    <aside className="aiProfileSidebar" aria-label="AI Sustainability Profile sections">
      <div className="aiProfileSidebarIntro"><span>PROFILE</span><strong>AI Sustainability Profile</strong><small>Clinical context → lifecycle → boundary.</small></div>
      <nav className="aiProfileNav">
        <div className="aiProfileNavGroup">
          <span>MODEL &amp; CLINICAL CONTEXT</span>
          <NavButton label="Model & clinical purpose" meta={purposeDone?null:'Define intended use'} done={purposeDone} onClick={()=>openAndScroll('ai-model-record')} tone="clinical"/>
          <NavButton label="Performance & validation" meta={performanceDone?null:'Clinical evidence needed'} done={performanceDone} onClick={()=>openAndScroll('ai-performance-section')} tone="evidence"/>
          <NavButton label="Clinical & workflow effects" meta={scen.clinicalEffectBasis==='none'?'No effect credited':null} done={effectsDone} onClick={()=>openAndScroll('ai-effects-section')} tone="clinical"/>
          <NavButton label="Technical model profile" meta={technicalDone?null:'Architecture not specified'} done={technicalDone} onClick={()=>openAndScroll('ai-technical-section')} tone="technical"/>
        </div>
        <div className="aiProfileNavGroup">
          <span>LIFECYCLE</span>
          <NavButton label="1 · Training / development" meta={trainingDone?null:'Needs training status'} done={trainingDone} active={section==='training'} onClick={()=>lifecycle('training','ai-training-section')} tone="lifecycle"/>
          <NavButton label="2 · Inference & deployment" meta={inferenceDone?null:'Needs deployment inputs'} done={inferenceDone} active={section==='inference'} onClick={()=>lifecycle('inference','ai-inference-section')} tone="lifecycle"/>
        </div>
        <div className="aiProfileNavGroup">
          <span>BOUNDARY &amp; REVIEW</span>
          <NavButton label="Environmental boundary" meta={boundaryDone?null:'Review water boundary'} done={boundaryDone} active={section==='water'} onClick={()=>lifecycle('water','ai-water-section')} tone="boundary"/>
          <NavButton label="Review & completeness" meta={reviewDone?null:`${checklistDone} of ${checklistTotal} complete`} done={reviewDone} onClick={reviewReporting} tone="review"/>
        </div>
      </nav>
      <div className="aiProfileSidebarLegend"><span><i className="complete"/> documented</span><span><i className="attention"/> needs review</span></div>
    </aside>
    <div className="aiProfileWorkspaceMain">{children}</div>
  </div>;
}
