import React, {useMemo, useState} from 'react';
import {ExternalLink} from './Refs.jsx';
import {REFS, refUrl} from './refs.js';

const DEVELOPMENT_OPTIONS = [
  {group:'Clinical purpose & evidence', purpose:'Clinical requirement', title:'Document clinically meaningful performance evidence', body:'Record the intended use, validation setting, primary metric, supporting metrics and uncertainty needed to judge whether an environmental comparison is clinically meaningful.', refs:['maierhein-metrics-reloaded-2024','klontzas-esr-metrics-2026','drukker-midrc-metrictree-2024'], action:'profile-performance'},
  {group:'Training & development', purpose:'Strengthen the assessment', title:'Measure the full development footprint', body:'Measure training energy and representative inference energy on the hardware you actually use. Count experiments, tuning runs and repeats rather than only the final successful run.', refs:['doo-jacr-2024','henderson-reporting-2020','codecarbon'], action:'profile-training'},
  {group:'Training & development', purpose:'Reduce environmental impact', title:'Use explicit stopping and checkpoint criteria', body:'Define validation-based stopping criteria and retain the best checkpoint rather than automatically extending training after the clinical objective has been met.', refs:['dietrich-training-policy-2026'], clinical:'Reconfirm that the selected checkpoint preserves the required clinical performance.', action:'scenario-training'},
  {group:'Training & development', purpose:'Reduce environmental impact', title:'Right-size the model and experimentation strategy', body:'Match model size, resolution, dimensionality and experiment count to the clinical requirement rather than assuming more compute is better.', refs:['doo-radiology-llm-2024','patterson-4ms-2022'], clinical:'Revalidate performance after a material model or input change.', action:'scenario-training'},
  {group:'Inference & deployment', purpose:'Strengthen the assessment', title:'Measure representative inference energy', body:'Replace inference estimates with a direct per-use measurement on representative serving hardware when feasible.', refs:['doo-jacr-2024','oviedo-inference-2025','codecarbon'], action:'profile-inference'},
  {group:'Inference & deployment', purpose:'Reduce environmental impact', title:'Review serving efficiency and numerical precision', body:'Test batching, caching, accelerator utilization and compatible lower-precision serving rather than assuming the development configuration is the best deployment configuration.', refs:['fernandez-llm-energy-2025','oviedo-inference-2025'], clinical:'Revalidate the clinically relevant endpoint before implementation.', action:'scenario-inference'},
  {group:'Inference & deployment', purpose:'Reduce environmental impact', title:'Review AI compute location', body:'Distinguish energy efficiency from carbon efficiency. A different compute region can change carbon intensity without changing kWh.', refs:['doo-jacr-cloud-2024','patterson-4ms-2022'], clinical:'Also review latency, data governance, availability and operational constraints.', action:'profile-compute'},
  {group:'Monitoring & lifecycle', purpose:'Strengthen the assessment', title:'Track retraining, demand growth and model updates', body:'Refresh the profile when retraining, model versions, serving patterns, or workload materially change.', refs:['wright-efficiency-not-enough-2023','doo-jacr-2024'], action:'profile-training'},
];

const CLINICAL_OPTIONS = [
  {group:'Clinical purpose & evidence', purpose:'Clinical requirement', title:'Confirm clinical acceptability before environmental ranking', body:'Environmental efficiency should differentiate clinically acceptable options; it should not compensate for inadequate intended-use fit, safety, performance, validation or workflow integration.', refs:['klontzas-esr-metrics-2026','drukker-midrc-metrictree-2024'], action:'profile-performance'},
  {group:'Clinical purpose & evidence', purpose:'Strengthen the assessment', title:'Use like-for-like clinical comparison', body:'Hold intended use, endpoint, validation context, workload and comparison basis constant before interpreting environmental differences between candidates.', refs:['kpodzro-haip-2026','doo-radiology-llm-2024'], action:'comparison'},
  {group:'Training & development', purpose:'Strengthen the assessment', title:'Request lifecycle disclosure from the vendor', body:'Ask for model/version identity, training hardware and energy when available, inference energy or throughput, hosting region/PUE and how updates change those assumptions.', refs:['kpodzro-haip-2026','doo-jacr-2024'], action:'profile-training'},
  {group:'Inference & deployment', purpose:'Strengthen the assessment', title:'Validate deployment assumptions locally', body:'Replace generic workload, serving and compute assumptions with values that reflect the planned clinical deployment.', refs:['doo-jacr-cloud-2024','oviedo-inference-2025'], action:'profile-inference'},
  {group:'Inference & deployment', purpose:'Reduce environmental impact', title:'Ask for efficient serving options', body:'Ask whether the same validated product can use a smaller tier, mixed precision, batching, caching, autoscaling or another supported deployment option.', refs:['fernandez-llm-energy-2025','oviedo-inference-2025'], clinical:'The alternative should preserve the cleared or locally validated clinical behavior.', action:'scenario-inference'},
  {group:'Inference & deployment', purpose:'Reduce environmental impact', title:'Review AI compute location', body:'If hosting is flexible, compare carbon intensity across feasible regions while keeping energy and workload assumptions explicit.', refs:['doo-jacr-cloud-2024'], clinical:'Also review latency, data governance, residency, security and availability requirements.', action:'profile-compute'},
  {group:'Monitoring & lifecycle', purpose:'Strengthen the assessment', title:'Plan for updates and demand growth', body:'Document how model updates, hosting changes, added agent calls or workflow expansion will trigger a refreshed environmental profile.', refs:['kpodzro-haip-2026','wright-efficiency-not-enough-2023'], action:'profile-inference'},
];

const PURPOSE_CLASS = {'Clinical requirement':'clinical','Strengthen the assessment':'evidence','Reduce environmental impact':'impact'};

function FullCitation({id}) {
  const r=REFS[id];
  if(!r) return <li>{id}</li>;
  return <li>{r.authors}. {r.title}. <em>{r.venue}</em> {r.cite}. <ExternalLink href={refUrl(r)}>{r.doi?`doi:${r.doi}`:'Source'}</ExternalLink></li>;
}

function Recommendation({item,index,onAction}) {
  return <article className="aiImproveRec">
    <div className="aiImproveRecNumber">{index+1}</div>
    <div className="aiImproveRecBody">
      <span className={`aiImprovePurpose ${PURPOSE_CLASS[item.purpose]||''}`}>{item.purpose}</span>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
      {item.clinical&&<p className="aiImproveClinicalRequirement"><strong>Clinical requirement:</strong> {item.clinical}</p>}
      <div className="aiImproveRecActions">
        <button type="button" onClick={()=>onAction(item.action)}>{item.action?.startsWith('scenario-')?'Model a scenario →':item.action==='comparison'?'Open comparison →':'Review profile →'}</button>
        <details className="aiImproveEvidenceDetails"><summary>Evidence &amp; rationale · {item.refs.length} source{item.refs.length===1?'':'s'}</summary><ol>{item.refs.map(id=><FullCitation key={id} id={id}/>)}</ol></details>
      </div>
    </div>
  </article>;
}

export default function AiImproveWorkspace({
  mode, scen, ecoLabelData, visibleAiModels, modelDisplayName,
  onSelectModel, onManageModels, onEditProfile, onOpenComparison, onResults,
}) {
  const [trainingReduction,setTrainingReduction]=useState(0);
  const [inferenceReduction,setInferenceReduction]=useState(0);
  const [workloadGrowth,setWorkloadGrowth]=useState(0);
  const [scenarioFocus,setScenarioFocus]=useState('');
  const options=mode==='develop'?DEVELOPMENT_OPTIONS:CLINICAL_OPTIONS;
  const currentModel=visibleAiModels.find(m=>m.id===scen.modelId) || visibleAiModels[0];
  const hasModel=visibleAiModels.length>0;

  const topRecommendations=useMemo(()=>{
    if(!hasModel) return [];
    const ranked=[];
    const push=title=>{const item=options.find(x=>x.title===title);if(item&&!ranked.includes(item))ranked.push(item)};
    if(!scen.accuracyMetric || !scen.performanceSource) push(mode==='develop'?'Document clinically meaningful performance evidence':'Confirm clinical acceptability before environmental ranking');
    if(mode==='develop') {
      if(!ecoLabelData.trainingAvailable || ecoLabelData.trainProv!=='measured') push('Measure the full development footprint');
      if(!(Number(ecoLabelData.inferKwhPerStudy)>0)) push('Measure representative inference energy');
      push('Right-size the model and experimentation strategy');
      push('Review AI compute location');
    } else {
      if(!ecoLabelData.trainingAvailable) push('Request lifecycle disclosure from the vendor');
      push('Validate deployment assumptions locally');
      push('Ask for efficient serving options');
      push('Review AI compute location');
    }
    return ranked.slice(0,4);
  },[hasModel,mode,options,scen.accuracyMetric,scen.performanceSource,ecoLabelData.inferKwhPerStudy,ecoLabelData.trainingAvailable,ecoLabelData.trainProv]);

  const scenario=useMemo(()=>{
    const months=Math.max(1,Number(scen.deployMonths)||36);
    const trainingTotal=ecoLabelData.trainingAvailable?Math.max(0,Number(ecoLabelData.trainCo2)||0):0;
    const trainingMonthly=trainingTotal/months;
    const studies=Math.max(0,Number(ecoLabelData.inferStudies)||Number(scen.inferStudiesMonth)||0);
    const inferencePerStudyG=Math.max(0,Number(ecoLabelData.perInferCo2g)||0);
    const inferenceMonthly=studies*inferencePerStudyG/1000;
    const baseKnown=trainingMonthly+inferenceMonthly;
    const nextTraining=trainingMonthly*(1-trainingReduction/100);
    const nextInference=inferenceMonthly*(1-inferenceReduction/100)*(1+workloadGrowth/100);
    const nextKnown=nextTraining+nextInference;
    const delta=baseKnown>0?(nextKnown/baseKnown-1)*100:null;
    return {months,studies,trainingMonthly,inferenceMonthly,baseKnown,nextKnown,delta,complete:!!ecoLabelData.graded};
  },[scen.deployMonths,scen.inferStudiesMonth,ecoLabelData.trainingAvailable,ecoLabelData.trainCo2,ecoLabelData.inferStudies,ecoLabelData.perInferCo2g,ecoLabelData.graded,trainingReduction,inferenceReduction,workloadGrowth]);

  const act=action=>{
    if(action==='comparison'){onOpenComparison();return;}
    if(action?.startsWith('profile-')){onEditProfile(action.replace('profile-',''));return;}
    if(action?.startsWith('scenario-')){
      setScenarioFocus(action.replace('scenario-',''));
      window.setTimeout(()=>document.getElementById('ai-scenario-sandbox')?.scrollIntoView({behavior:'smooth',block:'start'}),40);
    }
  };

  if(!hasModel) return <section className="aiImproveWorkspace aiImproveEmpty" data-demo-target="ai-improve-workspace">
    <span className="aiImproveKicker">AI MODEL &amp; INFORMATICS</span>
    <h2>Improve this AI</h2>
    <p>Add or select an AI profile to receive recommendations based on its clinical context, lifecycle, deployment and current evidence.</p>
    <button type="button" onClick={onManageModels}>Add an AI profile →</button>
    <details><summary>Browse general sustainable-AI guidance</summary><div className="aiImproveAllList">{options.map((item,i)=><Recommendation key={item.title} item={item} index={i} onAction={act}/>)}</div></details>
  </section>;

  return <section className="aiImproveWorkspace aiImproveRedesign" data-demo-target="ai-improve-workspace">
    <div className="aiImproveTopline">
      <div><span className="aiImproveKicker">AI MODEL &amp; INFORMATICS</span><h2>Improve this AI</h2><p>Recommendations are based on the current Sustainability Profile. Clinical suitability is not traded against environmental performance.</p></div>
      <div className="aiImproveModelPicker"><label>AI profile<select value={currentModel?.id||''} onChange={e=>onSelectModel(e.target.value)}>{visibleAiModels.map(m=><option key={m.id} value={m.id}>{modelDisplayName(m)}</option>)}</select></label><button type="button" className="inlineTextButton" onClick={onManageModels}>Add or manage profiles →</button></div>
    </div>

    <div className="aiImprovePrinciple"><strong>Clinical acceptability comes first.</strong><span>Environmental efficiency helps differentiate options only after intended use, safety, performance, validation and workflow fit are acceptable for patient care.</span></div>

    <section className="aiImproveTopRecommendations">
      <div className="aiImproveSectionHeading"><div><span>TOP RECOMMENDATIONS FOR THIS PROFILE</span><h3>{topRecommendations.length} priorities surfaced from the current record</h3></div><small>Other options remain available below.</small></div>
      <div className="aiImproveRecommendationList">{topRecommendations.map((item,i)=><Recommendation key={item.title} item={item} index={i} onAction={act}/>)}</div>
    </section>

    <section id="ai-scenario-sandbox" className={`aiScenarioSandbox ${scenarioFocus?'focus-'+scenarioFocus:''}`}>
      <div className="aiImproveSectionHeading"><div><span>SCENARIO SANDBOX</span><h3>Test changes without rewriting the baseline</h3></div><button type="button" className="download" onClick={()=>{setTrainingReduction(0);setInferenceReduction(0);setWorkloadGrowth(0);setScenarioFocus('');}}>Reset scenario</button></div>
      <p className="note">Adjust assumptions to explore direction and scale. The baseline Sustainability Profile remains unchanged until you deliberately edit it after implementation.</p>
      <div className="aiScenarioCompare">
        <div><span>CURRENT PROFILE</span><strong>{scenario.baseKnown>0?`${scenario.baseKnown.toFixed(2)} kgCO₂e/month`:'Not enough quantified data'}</strong><small>{scenario.complete?'Training + inference lifecycle represented':'Known lifecycle only; unavailable phases remain excluded'}</small></div>
        <div className="aiScenarioArrow">→</div>
        <div><span>SCENARIO</span><strong>{scenario.nextKnown>0?`${scenario.nextKnown.toFixed(2)} kgCO₂e/month`:'—'}</strong><small>{scenario.delta==null?'Adjust a control below':`${scenario.delta<=0?'':'+'}${scenario.delta.toFixed(0)}% vs current known lifecycle`}</small></div>
      </div>
      <div className="aiScenarioControls">
        <label className={scenarioFocus==='training'?'active':''}><span>Training energy reduction</span><strong>{trainingReduction}%</strong><input type="range" min="0" max="60" step="5" value={trainingReduction} disabled={!ecoLabelData.trainingAvailable} onChange={e=>setTrainingReduction(Number(e.target.value))}/><small>{ecoLabelData.trainingAvailable?'Illustrative sensitivity at the current training compute context.':'Training footprint is unavailable, so CEDARS does not model a training reduction as though it were zero.'}</small></label>
        <label className={scenarioFocus==='inference'?'active':''}><span>Inference energy reduction</span><strong>{inferenceReduction}%</strong><input type="range" min="0" max="60" step="5" value={inferenceReduction} onChange={e=>setInferenceReduction(Number(e.target.value))}/><small>Represents a lower-energy serving configuration; clinical performance must be rechecked when behavior changes.</small></label>
        <label><span>Deployment demand growth</span><strong>+{workloadGrowth}%</strong><input type="range" min="0" max="100" step="10" value={workloadGrowth} onChange={e=>setWorkloadGrowth(Number(e.target.value))}/><small>Shows rebound or scale-up. Clinically indicated care is not a reduction lever; avoided low-value use belongs in the validated workflow-effects section.</small></label>
      </div>
      <div className="aiScenarioActions"><button type="button" className="download" onClick={()=>onEditProfile('compute')}>Review compute location assumptions →</button><button type="button" className="download" onClick={()=>onEditProfile('inference')}>Edit implemented values →</button></div>
    </section>

    <details className="aiImproveAll">
      <summary>View all {options.length} improvement options</summary>
      <div className="aiImproveAllGroups">{['Clinical purpose & evidence','Training & development','Inference & deployment','Monitoring & lifecycle'].map(group=>{const groupItems=options.filter(x=>x.group===group);if(!groupItems.length)return null;return <section key={group}><h3>{group}</h3><div className="aiImproveAllList">{groupItems.map((item,i)=><Recommendation key={item.title} item={item} index={i} onAction={act}/>)}</div></section>})}</div>
    </details>

    <div className="workflowNextStep"><div className="workflowNextCopy"><span>NEXT STEP</span><strong>Review the current AI result</strong><small>Scenario values above are prospective. Results continue to show the baseline until implemented values are entered into the profile.</small></div><div className="workflowNextActions"><button type="button" className="workflowNextPrimary" onClick={onResults}>Continue to Results →</button><button type="button" className="download" onClick={()=>onEditProfile('inference')}>Edit AI profile</button></div></div>
  </section>;
}
