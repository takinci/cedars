import React from 'react';
import {ExternalLink, Ref} from './Refs.jsx';
import { BarChart3, Zap, Repeat2, MessageSquare, CalendarRange, Activity, Box, Clock, Cpu, Database, Gauge, Layers, Repeat } from 'lucide-react';

const METRIC_EXAMPLES = {
  Classification:['AUROC','Sensitivity / specificity','PPV / F1 / MCC','Calibration'],
  Triage:['Sensitivity / specificity','PPV / NPV','AUROC','Calibration'],
  Segmentation:['Dice','NSD / boundary metric','Volume metric'],
  Detection:['Sensitivity / recall','FROC','Average precision'],
  Reconstruction:['Reader-assessed diagnostic quality','SSIM','PSNR'],
  'Image synthesis':['Reader-assessed diagnostic quality','Task-based performance','SSIM / PSNR'],
  'Report generation':['Task / error metric','Clinical reader assessment'],
  'Agentic workflow':['Task success','Error / failure rate','Clinical review'],
  Other:['Task-appropriate metric'],
};
const ALL_METRICS=['','AUROC','AUC','Accuracy','Balanced accuracy','Sensitivity','Specificity','PPV / precision','NPV','F1','MCC','Dice','NSD','IoU','FROC','Average precision','Calibration','SSIM','PSNR','RadGraph F1','MAE','Other'];
const METRICS_RELOADED_TASKS=new Set(['Classification','Segmentation','Detection']);

function summaryValue(parts, fallback='Not documented') {
  const kept=parts.filter(v=>v!==''&&v!=null&&v!==false);
  return kept.length?kept.join(' · '):fallback;
}

export default function AiProfileEditor({
  scen, ecoLabel, ecoLabelData, setS, setEco, setModel, setCloudProvider,
  meta, modelLibrary, cloudRegions, cloud, waterPerKwh, volumeEstimates, provenance,
  refsOrder, onContribute, section, onSection, onChangeTask, localRegion, onMeasureEnergy,
}) {
  const tokenWorkload=ecoLabel.architecture==='LLM / Agent (transformer)' || ['Report generation','Agentic workflow'].includes(ecoLabel.taskType);
  const metricExamples=METRIC_EXAMPLES[ecoLabel.taskType] || METRIC_EXAMPLES.Other;
  const provider=ecoLabel.cloudProvider || scen.cloudProvider || '';
  const region=ecoLabel.cloudRegion || scen.cloudRegion || '';
  const pue=cloudRegions[provider]?.pue ?? cloud[provider]?.pue ?? 1.5;
  const providers=meta.cloudProviders || [];
  const regions=p=>Object.entries(cloudRegions[p]?.regions ?? {});
  const trainingProvider=scen.trainingProvider||provider;
  const trainingRegion=scen.trainingRegion || (scen.trainingProvider ? '' : region);
  const inferenceProvider=scen.inferenceProvider||provider;
  const inferenceRegion=scen.inferenceRegion || (scen.inferenceProvider ? '' : region);
  const trainingPueDefault=cloudRegions[trainingProvider]?.pue ?? cloud[trainingProvider]?.pue ?? pue;
  const inferencePueDefault=cloudRegions[inferenceProvider]?.pue ?? cloud[inferenceProvider]?.pue ?? pue;
  const trainingCompute=[trainingProvider,trainingRegion||'provider average'].filter(Boolean).join(' · ') || 'not specified';
  const inferenceCompute=[inferenceProvider,inferenceRegion||'provider average'].filter(Boolean).join(' · ') || 'not specified';
  const [computeDialogOpen,setComputeDialogOpen]=React.useState(false);
  const [computeFocus,setComputeFocus]=React.useState('inference');
  const openComputeDialog=focus=>{setComputeFocus(focus);setComputeDialogOpen(true);};
  const clinicalEffectStatus=scen.clinicalEffectBasis==='none'
    ? 'No downstream effect credited'
    : summaryValue([
        scen.clinicalEffectBasis==='observed-local'?'Observed locally':scen.clinicalEffectBasis==='validated-local'?'Locally validated':scen.clinicalEffectBasis==='published'?'Published evidence':scen.clinicalEffectBasis==='scenario'?'Scenario only':'',
        Number(scen.scanTimeReductPct)>0?`${scen.scanTimeReductPct}% scan-time reduction`:'',
        Number(scen.lowValueReductPct)>0?`${scen.lowValueReductPct}% low-value imaging avoided`:''
      ]);
  const technicalStatus=summaryValue([
    ecoLabel.architecture,
    Number(ecoLabel.paramsMillion)>0?`${ecoLabel.paramsMillion}M parameters`:'',
    !tokenWorkload&&scen.dim?scen.dim:'',
    !tokenWorkload&&scen.resolution?`${scen.resolution}px input`:''
  ],'Not specified (optional)');
  const performanceStatus=summaryValue([
    scen.accuracyMetric,
    scen.accuracyPct!==''&&scen.accuracyPct!=null?scen.accuracyPct:'',
    scen.performanceSource
  ],'Not assessed (optional)');
  const profilePath=scen.aiRoute==='compare'?'compare':scen.ownMode==='spec'?'assess':'develop';
  const developing=profilePath==='develop';
  const comparing=profilePath==='compare';
  const contextTitle=developing?'Development context':comparing?'Comparison context':'Clinical use context';
  const contextNote=developing
    ? 'Start with the workload CEDARS needs to characterize the model lifecycle. Project naming, research-objective prose, and technical presets are optional metadata or helpers; they are not required to estimate the footprint.'
    : comparing
      ? 'Define the shared clinical need and a comparable validation basis before environmental ranking. Clinical suitability is a gate, not a weighted offset against environmental performance.'
      : 'Document the clinical purpose and available validation for the selected or deployed model. Workflow effects are recorded separately below.';

  const openContext=id=>{
    const node=document.getElementById(id);
    if (node?.tagName==='DETAILS') node.open=true;
    node?.scrollIntoView({behavior:'smooth',block:'start'});
  };

  return <>
    <section id="ai-model-record" className="inputSummary aiProfileIdentity" data-demo-target="ai-model-record">
      <div>
        <h2>{contextTitle}</h2>
        <p className="note">{contextNote}</p>
      </div>

      <div className="aiContextStepHeader"><span>{developing?'1 · TASK / WORKLOAD':comparing?'1 · SHARED CLINICAL PURPOSE':'1 · CLINICAL PURPOSE'}</span><strong>{developing?'What kind of workload are you assessing?':comparing?'What clinical need must every candidate address?':'What is this AI intended to do?'}</strong></div>

      {!developing&&<label className="aiIdentityName">
        <span className="aiFieldLabelLine"><span>Label / model name</span><span className="aiOptionalTag">editable</span></span>
        <input type="text" value={ecoLabel.projectName} onChange={e=>setEco('projectName',e.target.value)} placeholder="e.g. PE triage model"/>
        <span className="aiFieldHelp">This is the name shown on the CEDARS AI result and report. You can edit it later.</span>
      </label>}

      <div className="aiProfilePrimaryGrid aiClinicalPurposeGrid aiClinicalPurposeGridSingle">
        <label className="aiPrimaryTaskField">{developing?'Task / workload type':comparing?'Shared clinical task':'Clinical task'}
          <select value={ecoLabel.taskType||''} onChange={e=>setEco('taskType',e.target.value)}>
            <option value="">{developing?'— Choose workload type —':'— Choose clinical task —'}</option>
            {meta.taskTypes.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
          {developing&&<span className="aiFieldHelp">Sets the workload-specific fields and metric guidance CEDARS shows; it does not determine the footprint by itself.</span>}
        </label>
      </div>

      {developing&&<details className="aiProfileDisclosure aiReportingMetadataDisclosure">
        <summary><span><strong>Reporting metadata</strong><small>Optional identifiers for manuscripts, model cards, or internal records; not required for lifecycle accounting.</small></span><b>{ecoLabel.projectName||scen.modelIntendedUse?'Added':'Optional'}</b></summary>
        <div className="aiProfileDisclosureBody grid grid2">
          <label>Model / project name<input type="text" value={ecoLabel.projectName} onChange={e=>setEco('projectName',e.target.value)} placeholder="optional"/></label>
          <label>Research objective / intended future use<input type="text" value={scen.modelIntendedUse||''} onChange={e=>setS('modelIntendedUse',e.target.value)} placeholder="optional reporting context"/></label>
        </div>
      </details>}

      <details id="ai-performance-section" className="aiProfileDisclosure aiPerformanceDisclosure">
        <summary>
          <span><strong>2 · {developing?'Evaluation & validation':'Performance & validation'}</strong><small>{developing?'Optional for development-footprint accounting; document planned or available evaluation when useful.':comparing?'Required context before candidate ranking; compare like-for-like evidence.':'Optional for environmental accounting; useful for clinical interpretation and governance.'}</small></span>
          <b>{performanceStatus}</b>
        </summary>
        <div className="aiProfileDisclosureBody">
          <div className="aiMetricBestPractice">
            <strong>{developing?'Plan problem-aware evaluation, not a task-name shortcut.':'Use problem-aware validation, not a task-name shortcut.'}</strong>
            <p>{developing?'CEDARS stores one primary evaluation metric plus supporting context. This evidence context does not change the lifecycle footprint. Clinical validation can remain incomplete during development, but should be documented before clinical use.':'CEDARS stores one primary comparison metric plus supporting context. This is clinical evidence context, not an environmental lifecycle input. Complete validation often needs complementary metrics, uncertainty, and task-specific interpretation.'}</p>
            {ecoLabel.taskType&&<div className="aiMetricExamples"><span>Examples to consider, not automatic recommendations:</span>{metricExamples.map(m=><em key={m}>{m}</em>)}</div>}
            {ecoLabel.taskType&&<div className="aiMetricGuideLinks">{METRICS_RELOADED_TASKS.has(ecoLabel.taskType)&&<><ExternalLink href="https://www.nature.com/articles/s41592-023-02151-z">Metrics Reloaded problem-aware guidance</ExternalLink><ExternalLink href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10990563/">MIDRC MetricTree</ExternalLink></>}<ExternalLink href="https://doi.org/10.1007/s00330-025-11890-w">ESR / EuSoMII radiology metric guidance</ExternalLink></div>}
          </div>
          <div className="grid grid3">
            <label>Primary performance value<input type="number" step="0.001" value={scen.accuracyPct} onChange={e=>setS('accuracyPct',e.target.value)} placeholder="optional for environmental-only accounting"/></label>
            <label>Primary metric<select value={scen.accuracyMetric||''} onChange={e=>setS('accuracyMetric',e.target.value)}>{ALL_METRICS.map(m=><option key={m||'blank'} value={m}>{m||'— Select metric —'}</option>)}</select></label>
            <label>Unit<select value={scen.performanceUnit} onChange={e=>setS('performanceUnit',e.target.value)}>{['percent','fraction','mm','seconds','ordinal','custom'].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
            <label>Better direction<select value={scen.performanceDirection} onChange={e=>setS('performanceDirection',e.target.value)}><option value="higher">Higher is better</option><option value="lower">Lower is better</option></select></label>
            <label>Validation setting<input value={scen.performanceValidationContext} onChange={e=>setS('performanceValidationContext',e.target.value)} placeholder="e.g. external multi-center validation"/></label>
            <label>Source / provenance<input value={scen.performanceSource} onChange={e=>setS('performanceSource',e.target.value)} placeholder="publication, local study, vendor"/></label>
            <label>Supporting metrics<input value={scen.performanceSupporting||''} onChange={e=>setS('performanceSupporting',e.target.value)} placeholder="e.g. sensitivity 0.92; specificity 0.88"/></label>
            <label>Uncertainty<input value={scen.performanceUncertainty||''} onChange={e=>setS('performanceUncertainty',e.target.value)} placeholder="e.g. 95% CI 0.89–0.94"/></label>
          </div>
        </div>
      </details>

      {!developing ? <details id="ai-effects-section" className="aiProfileDisclosure aiEffectsDisclosure">
        <summary>
          <span><strong>3 · Workflow effects</strong><small>Optional deployment context for downstream changes in care or workflow that may alter resource use.</small></span>
          <b>{clinicalEffectStatus}</b>
        </summary>
        <div className="aiProfileDisclosureBody">
          <div className="aiWorkflowEffectsIntro"><strong>What changes after the AI is introduced?</strong>{scen.clinicalWorkflowStage&&<span className="aiWorkflowStageChip">Primary stage: {{order:'Order / triage',schedule:'Schedule / prepare',acquire:'Acquire / scan',process:'Process / interpret',store:'Follow-up / store',cross:'Cross-cutting'}[scen.clinicalWorkflowStage]}</span>}<p>Consider effects across the clinical pathway, including detection or triage time, scheduling, scan duration or repeats, radiologist reading time, downstream imaging or follow-up, and patient-facing outcomes. Faster or cheaper workflows can also increase total use, so demand and rebound matter.</p></div>
          <div className="aiWorkflowEffectPath" aria-label="Workflow effects to consider">
            {[['1','Order / triage','appropriateness · detection'],['2','Schedule','priority · turnaround'],['3','Acquire','scan time · repeats · contrast'],['4','Process / interpret','reading time · compute'],['5','Follow-up','downstream imaging · demand / rebound']].map(([n,label,meta])=><div key={label}><b>{n}</b><span><strong>{label}</strong><small>{meta}</small></span></div>)}
          </div>
          <p className="note">Use local observations or a locally validated estimate when you have one. Published evidence can document a plausible effect without automatically crediting it to the current footprint; hypothetical changes belong in Decision Workspace.</p>
          <div className="grid grid3 aiWorkflowEffectsGrid">
            <label>Primary workflow stage<select value={scen.clinicalWorkflowStage||''} onChange={e=>setS('clinicalWorkflowStage',e.target.value)}><option value="">— Not specified —</option><option value="order">Order / need</option><option value="schedule">Schedule / prepare</option><option value="acquire">Acquire</option><option value="process">Process / interpret</option><option value="store">Store / follow-up</option><option value="cross">Cross-cutting / multiple stages</option></select></label>
            <label>Evidence basis<select value={scen.clinicalEffectBasis} onChange={e=>setS('clinicalEffectBasis',e.target.value)}><option value="none">No downstream effect credited</option><option value="observed-local">Observed locally</option><option value="validated-local">Locally validated estimate</option><option value="published">Published external evidence (report only)</option><option value="scenario">Scenario assumption (Improve only)</option></select></label>
            <label>Scan-time reduction (%)<input type="number" min="0" max="100" value={scen.scanTimeReductPct} onChange={e=>setS('scanTimeReductPct',e.target.value)}/></label>
            <label>Low-value imaging avoided (%)<input type="number" min="0" max="100" value={scen.lowValueReductPct} onChange={e=>setS('lowValueReductPct',e.target.value)}/></label>
          </div>
          <label className="aiWorkflowEffectsNote">Other workflow or patient-pathway effects <span className="aiOptionalTag">optional</span><textarea rows="3" value={scen.workflowEffectsNote||''} onChange={e=>setS('workflowEffectsNote',e.target.value)} placeholder="e.g. median triage-to-notification time, radiologist reading time, downstream imaging, follow-up, patient outcome, or observed change in demand"/></label>
          <p className="note">When an AI model is attached to a specific Radiology Department use, review the affected Department workflow as well so local operational effects are not treated as model properties.</p>
        </div>
      </details> : <div className="aiDevelopWorkflowNote">
        <span>DEPLOYMENT-STAGE CONTEXT</span>
        <strong>Workflow effects come later</strong>
        <p>Do not assume scan-time, utilization, or downstream-care effects while the model is still being developed. Add locally observed or validated workflow effects after a deployment context is defined; prospective assumptions belong in Improve.</p>
      </div>}

      <details id="ai-technical-section" className="aiProfileDisclosure aiTechnicalDisclosure">
        <summary>
          <span><strong>Advanced technical assumptions</strong><small>Optional unless these details are needed to estimate energy or characterize the workload.</small></span>
          <b>{technicalStatus}</b>
        </summary>
        <div className="aiProfileDisclosureBody grid grid3">
          <label>Technical preset <span className="aiOptionalTag">optional starting values</span>
            <select value={scen.modelKey||'custom'} onChange={e=>setModel(e.target.value)}>
              <option value="custom">No preset / enter my own details</option>
              {modelLibrary.filter(m=>m.key!=='custom').map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <span className="aiFieldHelp">Prefills editable technical assumptions only; it is not evidence and is never required.</span>
          </label>
          <label>Architecture / model family
            <select value={ecoLabel.architecture||''} onChange={e=>setEco('architecture',e.target.value)}>
              <option value="">— Not specified —</option>
              {meta.architectures.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Parameters (millions)<input type="number" min="0" value={ecoLabel.paramsMillion} onChange={e=>setEco('paramsMillion',e.target.value)} placeholder="optional"/></label>
          {!tokenWorkload&&<label>Dimensionality<select value={scen.dim} onChange={e=>setS('dim',e.target.value)}><option value="2D">2D</option><option value="3D">3D</option></select></label>}
          {!tokenWorkload&&<label>Input size (pixels per side)<input type="number" min="1" value={scen.resolution} onChange={e=>setS('resolution',e.target.value)} placeholder="e.g. 512"/></label>}
        </div>
      </details>
      <div className="aiProfileStepNav aiContextStepNav"><button type="button" onClick={onChangeTask}>← Change AI task</button><span>Context describes the use or development task. Compute geography was set at the AI start and can be overridden by lifecycle phase later.</span><button type="button" onClick={()=>onSection('training')}>Next: Training →</button></div>
    </section>

    {section!=='context'&&<section className="aiContextBand aiPhaseContextBand" aria-label="Clinical and AI compute context">
      <div className="aiClinicalContext"><span>CLINICAL CONTEXT</span><strong>{localRegion||'Not set'}</strong><small>Where care is being assessed; this does not define where AI compute runs.</small></div>
      <div className="aiPhaseComputeSummary">
        <div><span>TRAINING COMPUTE</span><strong>{trainingCompute}</strong><small>{scen.trainingProvider||scen.trainingRegion?'Phase-specific context':'Using shared fallback settings'}</small></div>
        <div><span>INFERENCE / DEPLOYMENT COMPUTE</span><strong>{inferenceCompute}</strong><small>{scen.inferenceProvider||scen.inferenceRegion?'Phase-specific context':'Using shared fallback settings'}</small></div>
      </div>
      <button type="button" className="download" onClick={()=>openComputeDialog(section==='training'?'training':'inference')}>Edit AI compute location →</button>
    </section>}

    {section==='compute'&&<section id="ai-compute-section" className="aiLifecycleEditor aiContextEditor">
      <h2>Phase-specific compute context</h2><p className="note">This is an advanced cross-phase editor. Compute location belongs to the lifecycle phase where the work occurs: training and inference may use the same infrastructure, but CEDARS does not assume they share a provider or region.</p>
      <div className="aiComputePhaseGrid">
        <div className="aiComputePhaseCard">
          <div className="aiComputePhaseHeading"><span>1 · TRAINING COMPUTE</span><button type="button" className="inlineTextButton" onClick={()=>{setS('trainingProvider','');setS('trainingRegion','');setS('trainingPue','');setS('trainingRenewablePct','');}}>Use shared fallback</button></div>
          <div className="grid grid3">
            <label>Provider<select value={trainingProvider} onChange={e=>{setS('trainingProvider',e.target.value);setS('trainingRegion','');}}>{providers.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
            <label>Region <span className="aiOptionalTag">sets grid carbon intensity</span><select value={trainingRegion} onChange={e=>setS('trainingRegion',e.target.value)}><option value="">Provider average</option>{regions(trainingProvider).map(([name,rci])=><option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>)}</select></label>
            <label>Custom PUE <span className="aiOptionalTag">optional</span><input type="number" min="1" step="0.05" value={scen.trainingPue} onChange={e=>setS('trainingPue',e.target.value)} placeholder={`${trainingPueDefault} provider default`}/></label>
            <label>Reported renewable share (%)<input type="number" min="0" max="100" value={scen.trainingRenewablePct} onChange={e=>setS('trainingRenewablePct',e.target.value)} placeholder={`${ecoLabel.renewablePct||0}% fallback`}/></label>
          </div>
          <small>Used for training energy-to-carbon conversion and training disclosures.</small>
        </div>
        <div className="aiComputePhaseCard">
          <div className="aiComputePhaseHeading"><span>2 · INFERENCE / DEPLOYMENT COMPUTE</span><button type="button" className="inlineTextButton" onClick={()=>{setS('inferenceProvider','');setS('inferenceRegion','');setS('inferencePue','');setS('inferenceRenewablePct','');}}>Use shared fallback</button></div>
          <div className="grid grid3">
            <label>Provider<select value={inferenceProvider} onChange={e=>{setS('inferenceProvider',e.target.value);setS('inferenceRegion','');}}>{providers.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
            <label>Region <span className="aiOptionalTag">sets grid carbon intensity</span><select value={inferenceRegion} onChange={e=>setS('inferenceRegion',e.target.value)}><option value="">Provider average</option>{regions(inferenceProvider).map(([name,rci])=><option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>)}</select></label>
            <label>Custom PUE <span className="aiOptionalTag">optional</span><input type="number" min="1" step="0.05" value={scen.inferencePue} onChange={e=>setS('inferencePue',e.target.value)} placeholder={`${inferencePueDefault} provider default`}/></label>
            <label>Reported renewable share (%)<input type="number" min="0" max="100" value={scen.inferenceRenewablePct} onChange={e=>setS('inferenceRenewablePct',e.target.value)} placeholder={`${ecoLabel.renewablePct||0}% fallback`}/></label>
          </div>
          <small>Used for recurring deployment energy, carbon intensity, workload, and lifecycle reporting.</small>
        </div>
      </div>
      <details className="aiTechnicalDetails aiComputeFallback"><summary>Shared fallback settings <span>(compatibility / convenience)</span></summary><div className="aiProfileDisclosureBody"><p className="note">These values are used only when a phase-specific field is blank. Existing saved assessments therefore retain their prior shared compute context without implying that Training and Inference occur in the same place.</p><div className="grid grid3"><label>Fallback provider<select value={provider} onChange={e=>setCloudProvider(e.target.value)}>{providers.map(v=><option key={v} value={v}>{v}</option>)}</select></label><label>Fallback region<select value={region} onChange={e=>setEco('cloudRegion',e.target.value)}>{regions(provider).map(([name,rci])=><option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>)}</select></label><label>Fallback custom PUE<input type="number" min="1" step="0.05" value={ecoLabel.customPue} onChange={e=>setEco('customPue',e.target.value)} placeholder={`${pue} provider default`}/></label><label>Fallback reported renewable share (%)<input type="number" min="0" max="100" value={ecoLabel.renewablePct} onChange={e=>setEco('renewablePct',e.target.value)} placeholder="0–100"/></label></div></div></details>
      <p className="note">Reported renewable share is disclosure-only in the location-based result; it does not automatically reduce the grid factor.</p>
    </section>}

    <div className="aiLifecycleIntro"><h3>Lifecycle</h3><p>Training precedes recurring inference and deployment. A phase may be unavailable, but the lifecycle order does not change.</p></div>
    <div className="aiLifecycleSequence" role="group" aria-label="AI lifecycle profile sections">
      <button type="button" className={`aiLifecycleSummaryCard ${section==='training'?'active':''}`} aria-pressed={section==='training'} onClick={()=>onSection('training')}><span>1 · TRAINING</span><strong>{ecoLabelData.trainingAvailable?`${ecoLabelData.energyPerRunKwh} kWh / run`:(ecoLabelData.trainingStatusLabel||'Not quantified')}</strong><small>Compute: {trainingCompute}</small><b>{section==='training'?'Editing':'Edit →'}</b></button>
      <span className="aiLifecycleArrow" aria-hidden="true">→</span>
      <button type="button" className={`aiLifecycleSummaryCard ${section==='inference'?'active':''}`} aria-pressed={section==='inference'} onClick={()=>onSection('inference')}><span>2 · INFERENCE &amp; DEPLOYMENT</span><strong>{ecoLabelData.inferKwhPerStudy>0?`${ecoLabelData.inferKwhPerStudy} kWh / study`:'Add inference energy'}</strong><small>{ecoLabelData.hasInference?`${ecoLabelData.inferStudies.toLocaleString()} studies / month`:'Deployment workload not entered'} · compute: {inferenceCompute}</small><b>{section==='inference'?'Editing':'Edit →'}</b></button>
    </div>

    {section==='training'&&<section id="ai-training-section" className="aiLifecycleEditor" data-demo-target="ai-training-section">
      <h2>Training</h2>
      <p className="note">Use measured energy when available. Otherwise CEDARS estimates training from the workload and hardware information entered here.</p>
      {onMeasureEnergy&&<button type="button" className="download aiMeasureMethodButton" onClick={onMeasureEnergy}>Need to measure energy? Choose a measurement method →</button>}
      <div className="aiAvailabilityRow"><span>Training footprint</span><button type="button" onClick={()=>{setEco('trainDisclosed','yes');setS('trainMissingReason','');}} className={ecoLabel.trainDisclosed!=='no'?'on':''}>Available</button><button type="button" onClick={()=>{setEco('trainDisclosed','no');if(!scen.trainMissingReason)setS('trainMissingReason','vendor');}} className={ecoLabel.trainDisclosed==='no'?'on':''}>Unavailable</button></div>
      {ecoLabel.trainDisclosed==='no'?<label className="aiNarrowField">Why is training unavailable?<select value={scen.trainMissingReason||'vendor'} onChange={e=>setS('trainMissingReason',e.target.value)}><option value="vendor">Not disclosed by developer / vendor</option><option value="notassessed">Not assessed in this study / evaluation</option></select></label>:<div className="grid grid3 aiTrainingInputGrid">
        <label><span className="aiInputTileLabel"><Database size={15}/><span>{tokenWorkload?'Training / fine-tuning examples':'Training dataset (studies / images)'}</span></span><input type="number" min="0" value={ecoLabel.datasetSize} onChange={e=>setEco('datasetSize',e.target.value)} placeholder={tokenWorkload?'optional':'e.g. 45000'}/></label>
        <label><span className="aiInputTileLabel"><Repeat size={15}/><span>{tokenWorkload?'Fine-tuning epochs':'Epochs'} <em>optional</em></span></span><input type="number" min="0" value={scen.epochs} onChange={e=>setS('epochs',e.target.value)} placeholder={tokenWorkload?'if fine-tuned locally':'e.g. 30'}/></label>
        {!tokenWorkload&&<label><span className="aiInputTileLabel"><Layers size={15}/><span>Slices / passes per study</span></span><input type="number" min="1" value={scen.slices} onChange={e=>setS('slices',e.target.value)} placeholder="1"/></label>}
        <label><span className="aiInputTileLabel"><Gauge size={15}/><span>Precision</span></span><select value={scen.precision} onChange={e=>setS('precision',e.target.value)}>{meta.precisions.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label><span className="aiInputTileLabel"><Cpu size={15}/><span>GPU model</span></span><select value={ecoLabel.gpuModel} onChange={e=>setEco('gpuModel',e.target.value)}>{meta.gpuModels.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        {ecoLabel.gpuModel==='Custom (enter TDP below)'&&<label><span className="aiInputTileLabel"><Zap size={15}/><span>GPU TDP (Watts)</span></span><input type="number" min="1" value={ecoLabel.customTdpW} onChange={e=>setEco('customTdpW',e.target.value)} placeholder="e.g. 350"/></label>}
        <label><span className="aiInputTileLabel"><Box size={15}/><span>Number of GPUs</span></span><input type="number" min="1" value={ecoLabel.gpuCount} onChange={e=>setEco('gpuCount',e.target.value)} placeholder="e.g. 4"/></label>
        <label><span className="aiInputTileLabel"><Clock size={15}/><span>Training hours / run</span></span><input type="number" min="0" step="0.1" value={ecoLabel.trainingHoursPerRun} onChange={e=>setEco('trainingHoursPerRun',e.target.value)} placeholder="e.g. 18"/></label>
        <label><span className="aiInputTileLabel"><Repeat size={15}/><span>Training runs / experiments</span></span><input type="number" min="1" value={ecoLabel.numRuns} onChange={e=>setEco('numRuns',e.target.value)} placeholder="e.g. 12"/></label>
        <label><span className="aiInputTileLabel"><Zap size={15}/><span>Measured energy / run (kWh) <em>overrides estimate</em></span></span><input type="number" min="0" step="0.01" value={ecoLabel.energyKwhPerRun} onChange={e=>setEco('energyKwhPerRun',e.target.value)} placeholder="e.g. 24.0"/></label>
        <label><span className="aiInputTileLabel"><Activity size={15}/><span>Measured with</span></span><select value={ecoLabel.trainTool} onChange={e=>setEco('trainTool',e.target.value)}><option value="">—</option>{['CodeCarbon','Zeus','Carbontracker','EcoLogits','Green Algorithms','nvidia-smi','Power meter','Cloud provider dashboard','Other'].map(t=><option key={t} value={t}>{t}</option>)}</select></label>
      </div>}
      <div className="aiPhaseSubcontext">
        <div><span>TRAINING COMPUTE CONTEXT</span><strong>{trainingCompute}</strong><small>Where training runs belongs to this phase and may differ from deployment.</small></div>
        <button type="button" className="download" onClick={()=>openComputeDialog('training')}>Edit training compute →</button>
      </div>
      <div className="aiProfileStepNav"><button type="button" onClick={()=>{onSection('context');openContext('ai-model-record');}}>← Clinical context</button><button type="button" onClick={()=>onSection('inference')}>Next: inference &amp; deployment →</button></div>
    </section>}

    {section==='inference'&&<section id="ai-inference-section" className="aiLifecycleEditor" data-demo-target="ai-inference-section">
      <h2>Inference &amp; deployment</h2><p className="note">Inference recurs with each use. Enter the per-use energy and expected workload for the deployment you are assessing.</p>
      <div className="aiAvailabilityRow"><span>Inference energy</span><button type="button" onClick={()=>setEco('inferMode','kwh')} className={ecoLabel.inferMode!=='tokens'?'on':''}>Vision · kWh / study</button><button type="button" onClick={()=>setEco('inferMode','tokens')} className={ecoLabel.inferMode==='tokens'?'on':''}>LLM / agentic · token-based</button></div>
      <div className="aiDeploymentMetricGrid">
        <label><span className="aiMetricTileIcon"><BarChart3 size={18}/></span><span className="aiMetricTileLabel">Monthly study volume</span><input type="number" min="0" value={ecoLabel.inferStudiesMonth} onChange={e=>setEco('inferStudiesMonth',e.target.value)} placeholder={`e.g. ${volumeEstimates[0]?.studiesPerMonth||5100}`}/></label>
        {ecoLabel.inferMode==='tokens'?<><label><span className="aiMetricTileIcon"><Zap size={18}/></span><span className="aiMetricTileLabel">Energy (Wh / 1k tokens)</span><input type="number" min="0" step="0.05" value={ecoLabel.whPer1kTokens} onChange={e=>setEco('whPer1kTokens',e.target.value)} placeholder="0.4"/></label><label><span className="aiMetricTileIcon"><Repeat2 size={18}/></span><span className="aiMetricTileLabel">Model calls / study</span><input type="number" min="1" value={ecoLabel.callsPerTask} onChange={e=>setEco('callsPerTask',e.target.value)} placeholder="1"/></label><label><span className="aiMetricTileIcon"><MessageSquare size={18}/></span><span className="aiMetricTileLabel">Tokens / call</span><input type="number" min="0" step="100" value={ecoLabel.tokensPerCall} onChange={e=>setEco('tokensPerCall',e.target.value)} placeholder="e.g. 2500"/></label></>:<label><span className="aiMetricTileIcon"><Zap size={18}/></span><span className="aiMetricTileLabel">Inference energy / study (kWh)</span><input type="number" min="0" step="0.0001" value={ecoLabel.inferKwhPerStudy} onChange={e=>setEco('inferKwhPerStudy',e.target.value)} placeholder="e.g. 0.004"/></label>}
        <label><span className="aiMetricTileIcon"><CalendarRange size={18}/></span><span className="aiMetricTileLabel">Deployment lifetime (months)</span><input type="number" min="1" value={ecoLabel.deployMonths} onChange={e=>setEco('deployMonths',e.target.value)} placeholder="e.g. 36"/></label>
      </div>
      <div className="aiDeploymentDerived"><span>MODELED INFERENCE</span><strong>{ecoLabelData.hasInference?`${ecoLabelData.inferMonthlyKwh} kWh/month · ${ecoLabelData.inferCo2Month} kgCO₂e/month`:'Add workload + per-use energy'}</strong><small>{ecoLabelData.inferKwhPerStudy>0?`${ecoLabelData.inferKwhPerStudy} kWh/study · ${ecoLabelData.perInferCo2g} gCO₂e/study`:'CEDARS will show the recurring deployment footprint here.'}</small></div>
      {ecoLabel.inferMode==='tokens'&&<p className="note">{ecoLabelData.tokensPerStudy>0?<>{ecoLabelData.tokensPerStudy.toLocaleString()} tokens/study → <strong>{ecoLabelData.inferKwhPerStudy} kWh/study</strong> ({ecoLabelData.perInferCo2g} gCO₂e).</>:<>Enter tokens/call to derive kWh/study.</>}</p>}
      <div className="aiPhaseSubcontext">
        <div><span>INFERENCE / DEPLOYMENT COMPUTE</span><strong>{inferenceCompute}</strong><small>Recurring deployment compute belongs to this phase and can differ from training.</small></div>
        <button type="button" className="download" onClick={()=>openComputeDialog('inference')}>Edit inference compute →</button>
      </div>
      <div className="aiDeploymentEffectsLink">
        <div><span>WORKFLOW &amp; DOWNSTREAM EFFECTS</span><strong>{clinicalEffectStatus==='No downstream effect credited'?'Review what this AI changes in care':clinicalEffectStatus}</strong><small>Scan time, detection and triage, reading time, downstream imaging, follow-up, patient outcomes, and demand may all matter even when they are not yet quantified.</small></div>
        <button type="button" className="download" onClick={()=>openContext('ai-effects-section')}>Review workflow effects →</button>
      </div>
      <div className="aiProfileStepNav"><button type="button" onClick={()=>onSection('training')}>← Training</button><button type="button" className="download" onClick={()=>onSection('water')}>Water disclosure (optional)</button><button type="button" onClick={()=>onSection('review')}>Next: Result →</button></div>
    </section>}

    <section className="aiBoundarySummary">
      <div><span>ENVIRONMENTAL BOUNDARY · OPTIONAL DISCLOSURE</span><strong>Water: {ecoLabelData.waterProv==='not-assessed'?'not assessed':ecoLabelData.waterProv==='screening'?'screening estimate':'inputs entered'}</strong><small>Water is reported separately from the carbon-and-energy Score. Review it when relevant; unknown is never treated as zero.</small></div>
      <button type="button" className="download" onClick={()=>onSection('water')}>Review water disclosure →</button>
    </section>

    {section==='water'&&<section id="ai-water-section" className="aiLifecycleEditor" data-demo-target="ai-water-section">
      <h2>Environmental boundary</h2><p className="note">Water is a separate optional disclosure. Enter site/grid values when known; otherwise use the screening estimate or mark water as not assessed.</p>
      <div className="grid grid3"><label>On-site cooling water (L/kWh)<input type="number" min="0" step="0.01" value={ecoLabel.wueOnsite} onChange={e=>setEco('wueOnsite',e.target.value)} placeholder="e.g. 0.45"/></label><label>Electricity-generation water (L/kWh)<input type="number" min="0" step="0.01" value={ecoLabel.wueOffsite} onChange={e=>setEco('wueOffsite',e.target.value)} placeholder="by grid"/></label><label>Water reporting<select value={ecoLabel.waterMode} onChange={e=>setEco('waterMode',e.target.value)}><option value="screening">Use screening estimate ({waterPerKwh} L/kWh)</option><option value="notassessed">Mark water as not assessed</option></select></label></div>
      <p className="note">Water is reported separately and does not currently affect the carbon-and-energy CEDARS Score.<Ref id="li-thirsty-2023" order={refsOrder}/></p>
      <button type="button" className="download" onClick={onContribute}>Contribute water evidence →</button>
      <div className="aiProfileStepNav"><button type="button" onClick={()=>onSection('inference')}>← Deployment</button><button type="button" onClick={()=>onSection('review')}>Done — view Result →</button></div>
    </section>}

    {computeDialogOpen&&<div className="aiComputeDialogBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setComputeDialogOpen(false);}}>
      <section className="aiComputeDialog" role="dialog" aria-modal="true" aria-labelledby="ai-compute-dialog-title">
        <div className="aiComputeDialogHead"><div><span>AI MODEL &amp; INFORMATICS</span><h2 id="ai-compute-dialog-title">{computeFocus==='training'?'Training':'Deployment'} compute location</h2><p>Set AI compute here. This does not move you to the Radiology Department profile, and the AI compute location may differ from the clinical context ({localRegion||'not set'}).</p></div><button type="button" className="download" onClick={()=>setComputeDialogOpen(false)}>Close</button></div>
        <div className="aiComputeDialogGrid">
          <label>Provider<select value={computeFocus==='training'?trainingProvider:inferenceProvider} onChange={e=>{const key=computeFocus==='training'?'trainingProvider':'inferenceProvider';const regionKey=computeFocus==='training'?'trainingRegion':'inferenceRegion';setS(key,e.target.value);setS(regionKey,'');}}>{providers.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
          <label>Region <span className="aiOptionalTag">sets grid carbon intensity</span><select value={computeFocus==='training'?trainingRegion:inferenceRegion} onChange={e=>setS(computeFocus==='training'?'trainingRegion':'inferenceRegion',e.target.value)}><option value="">Provider average</option>{regions(computeFocus==='training'?trainingProvider:inferenceProvider).map(([name,rci])=><option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>)}</select></label>
          <label>Custom PUE <span className="aiOptionalTag">optional</span><input type="number" min="1" step="0.05" value={computeFocus==='training'?scen.trainingPue:scen.inferencePue} onChange={e=>setS(computeFocus==='training'?'trainingPue':'inferencePue',e.target.value)} placeholder={`${computeFocus==='training'?trainingPueDefault:inferencePueDefault} provider default`}/></label>
          <label>Reported renewable share (%)<input type="number" min="0" max="100" value={computeFocus==='training'?scen.trainingRenewablePct:scen.inferenceRenewablePct} onChange={e=>setS(computeFocus==='training'?'trainingRenewablePct':'inferenceRenewablePct',e.target.value)} placeholder={`${ecoLabel.renewablePct||0}% fallback`}/></label>
        </div>
        <div className="aiComputeDialogSummary"><span>CURRENT SELECTION</span><strong>{computeFocus==='training'?trainingCompute:inferenceCompute}</strong><small>Reported renewable share remains disclosure-only in the location-based result; it does not automatically reduce the grid factor.</small></div>
        <div className="aiComputeDialogActions"><button type="button" className="download" onClick={()=>{setS(computeFocus==='training'?'trainingProvider':'inferenceProvider','');setS(computeFocus==='training'?'trainingRegion':'inferenceRegion','');setS(computeFocus==='training'?'trainingPue':'inferencePue','');setS(computeFocus==='training'?'trainingRenewablePct':'inferenceRenewablePct','');}}>Use shared fallback</button><button type="button" onClick={()=>setComputeDialogOpen(false)}>Done — return to {computeFocus==='training'?'Training':'Deployment'} →</button></div>
      </section>
    </div>}

  </>;
}
