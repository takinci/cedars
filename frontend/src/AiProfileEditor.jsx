import React from 'react';
import {ExternalLink, Ref} from './Refs.jsx';

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
  refsOrder, onContribute, section, onSection, localRegion, onMeasureEnergy,
}) {
  const tokenWorkload=ecoLabel.architecture==='LLM / Agent (transformer)' || ['Report generation','Agentic workflow'].includes(ecoLabel.taskType);
  const metricExamples=METRIC_EXAMPLES[ecoLabel.taskType] || METRIC_EXAMPLES.Other;
  const provider=ecoLabel.cloudProvider || scen.cloudProvider || '';
  const region=ecoLabel.cloudRegion || scen.cloudRegion || '';
  const pue=cloudRegions[provider]?.pue ?? cloud[provider]?.pue ?? 1.5;
  const providers=meta.cloudProviders || [];
  const regions=p=>Object.entries(cloudRegions[p]?.regions ?? {});
  const trainingCompute=[scen.trainingProvider||provider,scen.trainingRegion||region].filter(Boolean).join(' · ') || 'not specified';
  const inferenceCompute=[scen.inferenceProvider||provider,scen.inferenceRegion||region].filter(Boolean).join(' · ') || 'not specified';
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
  ],'Not specified');
  const performanceStatus=summaryValue([
    scen.accuracyMetric,
    scen.accuracyPct!==''&&scen.accuracyPct!=null?scen.accuracyPct:'',
    scen.performanceSource
  ],'Not documented');

  return <>
    <section id="ai-model-record" className="inputSummary aiProfileIdentity" data-demo-target="ai-model-record">
      <div>
        <h2>Model &amp; clinical purpose</h2>
        <p className="note">Define what this AI is for before describing its environmental lifecycle. Technical presets can help with setup, but they do not supply clinical evidence.</p>
      </div>

      <label className="aiIdentityName">
        <span className="aiFieldLabelLine"><span>Model / project name</span><span className="aiOptionalTag">optional</span></span>
        <input type="text" value={ecoLabel.projectName} onChange={e=>setEco('projectName',e.target.value)} placeholder="e.g. CXR-Net lung nodule detector"/>
      </label>

      <div className="aiProfilePrimaryGrid">
        <label>Clinical task
          <select value={ecoLabel.taskType||''} onChange={e=>setEco('taskType',e.target.value)}>
            <option value="">— Choose clinical task —</option>
            {meta.taskTypes.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label>Intended clinical use
          <input type="text" value={scen.modelIntendedUse||''} onChange={e=>setS('modelIntendedUse',e.target.value)} placeholder="e.g. triage suspected PE on CTPA"/>
        </label>
        <label>
          <span className="aiFieldLabelLine"><span>Reference preset</span><span className="aiOptionalTag">optional helper</span></span>
          <select value={scen.modelKey||'custom'} onChange={e=>setModel(e.target.value)}>
            <option value="custom">No preset / enter my own details</option>
            {modelLibrary.filter(m=>m.key!=='custom').map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <span className="aiFieldHelp">Prefills editable technical assumptions only.</span>
        </label>
      </div>

      <details id="ai-performance-section" className="aiProfileDisclosure aiPerformanceDisclosure">
        <summary>
          <span><strong>Clinical performance context</strong><small>Important for clinically informed comparison; it does not make the environmental footprint smaller.</small></span>
          <b>{performanceStatus}</b>
        </summary>
        <div className="aiProfileDisclosureBody">
          <div className="aiMetricBestPractice">
            <strong>Use problem-aware validation, not a task-name shortcut.</strong>
            <p>CEDARS stores one primary comparison metric plus supporting context. Complete validation often needs complementary metrics, uncertainty, and task-specific interpretation.</p>
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

      <details id="ai-effects-section" className="aiProfileDisclosure aiEffectsDisclosure">
        <summary>
          <span><strong>Clinical &amp; workflow sustainability effects</strong><small>Verified downstream changes in care or workflow that can alter resource use.</small></span>
          <b>{clinicalEffectStatus}</b>
        </summary>
        <div className="aiProfileDisclosureBody">
          <p className="note">This is the bridge between clinical use and downstream sustainability effects. “No effect credited” is a valid result. Only locally observed or locally validated effects change the current modeled footprint; published evidence and scenarios remain visible without being credited.</p>
          <div className="grid grid3">
            <label>Evidence basis<select value={scen.clinicalEffectBasis} onChange={e=>setS('clinicalEffectBasis',e.target.value)}><option value="none">No downstream effect credited</option><option value="observed-local">Observed locally</option><option value="validated-local">Locally validated estimate</option><option value="published">Published external evidence (report only)</option><option value="scenario">Scenario assumption (Improve only)</option></select></label>
            <label>Scan-time reduction (%)<input type="number" min="0" max="100" value={scen.scanTimeReductPct} onChange={e=>setS('scanTimeReductPct',e.target.value)}/></label>
            <label>Low-value imaging avoided (%)<input type="number" min="0" max="100" value={scen.lowValueReductPct} onChange={e=>setS('lowValueReductPct',e.target.value)}/></label>
          </div>
          <p className="note">Additional local effects such as contrast reduction are recorded when the model is attached to a specific Department use, where the affected imaging workflow is known.</p>
        </div>
      </details>

      <details id="ai-technical-section" className="aiProfileDisclosure aiTechnicalDisclosure">
        <summary>
          <span><strong>Technical model profile</strong><small>Architecture, model scale and input configuration.</small></span>
          <b>{technicalStatus}</b>
        </summary>
        <div className="aiProfileDisclosureBody grid grid3">
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
    </section>

    <section className="aiContextBand" aria-label="Clinical and AI compute context">
      <div><span>CLINICAL CONTEXT</span><strong>{localRegion||'Not set'}</strong><small>Where care is being assessed.</small></div>
      <div><span>AI COMPUTE SETTINGS</span><strong>{provider||'Not set'}{region?` · ${region}`:''}</strong><small>Shared default shown here; Training and Inference may use different compute locations.</small></div>
      <button type="button" className="download" onClick={()=>onSection('compute')}>Review compute settings →</button>
    </section>

    {section==='compute'&&<section id="ai-compute-section" className="aiLifecycleEditor aiContextEditor">
      <h2>AI compute settings</h2><p className="note">Use a shared default when both phases run in the same environment. If Training and Inference differ, record their phase-specific provider, region, PUE, or renewable-share overrides below.</p>
      <div className="grid grid3">
        <label>Compute provider<select value={provider} onChange={e=>setCloudProvider(e.target.value)}>{providers.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label>Region <span className="aiOptionalTag">sets grid carbon intensity</span><select value={region} onChange={e=>setEco('cloudRegion',e.target.value)}>{regions(provider).map(([name,rci])=><option key={name} value={name}>{name} — {rci} kgCO₂e/kWh</option>)}</select></label>
        <label>Custom PUE <span className="aiOptionalTag">optional</span><input type="number" min="1" step="0.05" value={ecoLabel.customPue} onChange={e=>setEco('customPue',e.target.value)} placeholder={`${pue} default`}/></label>
        <label>Reported renewable electricity share (%)<input type="number" min="0" max="100" value={ecoLabel.renewablePct} onChange={e=>setEco('renewablePct',e.target.value)} placeholder="0–100"/></label>
      </div>
      <p className="note">Reported renewable share is disclosure-only in the location-based result; it does not automatically reduce the grid factor.</p>
      <details className="aiTechnicalDetails"><summary>Training used a different compute context <span>(optional override)</span></summary><div className="grid grid3"><label>Provider<select value={scen.trainingProvider} onChange={e=>setS('trainingProvider',e.target.value)}><option value="">Use default {provider}</option>{providers.map(v=><option key={v} value={v}>{v}</option>)}</select></label><label>Region<select value={scen.trainingRegion} onChange={e=>setS('trainingRegion',e.target.value)}><option value="">Use default {region||'provider average'}</option>{regions(scen.trainingProvider||provider).map(([name])=><option key={name} value={name}>{name}</option>)}</select></label><label>Custom PUE<input type="number" min="1" step="0.05" value={scen.trainingPue} onChange={e=>setS('trainingPue',e.target.value)} placeholder="use default"/></label><label>Reported renewable share (%)<input type="number" min="0" max="100" value={scen.trainingRenewablePct} onChange={e=>setS('trainingRenewablePct',e.target.value)} placeholder="use default"/></label></div></details>
      <details className="aiTechnicalDetails"><summary>Inference used a different compute context <span>(optional override)</span></summary><div className="grid grid3"><label>Provider<select value={scen.inferenceProvider} onChange={e=>setS('inferenceProvider',e.target.value)}><option value="">Use default {provider}</option>{providers.map(v=><option key={v} value={v}>{v}</option>)}</select></label><label>Region<select value={scen.inferenceRegion} onChange={e=>setS('inferenceRegion',e.target.value)}><option value="">Use default {region||'provider average'}</option>{regions(scen.inferenceProvider||provider).map(([name])=><option key={name} value={name}>{name}</option>)}</select></label><label>Custom PUE<input type="number" min="1" step="0.05" value={scen.inferencePue} onChange={e=>setS('inferencePue',e.target.value)} placeholder="use default"/></label><label>Reported renewable share (%)<input type="number" min="0" max="100" value={scen.inferenceRenewablePct} onChange={e=>setS('inferenceRenewablePct',e.target.value)} placeholder="use default"/></label></div></details>
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
      {ecoLabel.trainDisclosed==='no'?<label className="aiNarrowField">Why is training unavailable?<select value={scen.trainMissingReason||'vendor'} onChange={e=>setS('trainMissingReason',e.target.value)}><option value="vendor">Not disclosed by developer / vendor</option><option value="notassessed">Not assessed in this study / evaluation</option></select></label>:<div className="grid grid3">
        <label>{tokenWorkload?'Training / fine-tuning examples':'Training dataset (studies / images)'}<input type="number" min="0" value={ecoLabel.datasetSize} onChange={e=>setEco('datasetSize',e.target.value)} placeholder={tokenWorkload?'optional':'e.g. 45000'}/></label>
        <label>{tokenWorkload?'Fine-tuning epochs':'Epochs'} <span className="aiOptionalTag">optional</span><input type="number" min="0" value={scen.epochs} onChange={e=>setS('epochs',e.target.value)} placeholder={tokenWorkload?'if fine-tuned locally':'e.g. 30'}/></label>
        {!tokenWorkload&&<label>Slices / passes per study<input type="number" min="1" value={scen.slices} onChange={e=>setS('slices',e.target.value)} placeholder="1"/></label>}
        <label>Precision<select value={scen.precision} onChange={e=>setS('precision',e.target.value)}>{meta.precisions.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label>GPU model<select value={ecoLabel.gpuModel} onChange={e=>setEco('gpuModel',e.target.value)}>{meta.gpuModels.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        {ecoLabel.gpuModel==='Custom (enter TDP below)'&&<label>GPU TDP (Watts)<input type="number" min="1" value={ecoLabel.customTdpW} onChange={e=>setEco('customTdpW',e.target.value)} placeholder="e.g. 350"/></label>}
        <label>Number of GPUs<input type="number" min="1" value={ecoLabel.gpuCount} onChange={e=>setEco('gpuCount',e.target.value)} placeholder="e.g. 4"/></label>
        <label>Training hours / run<input type="number" min="0" step="0.1" value={ecoLabel.trainingHoursPerRun} onChange={e=>setEco('trainingHoursPerRun',e.target.value)} placeholder="e.g. 18"/></label>
        <label>Training runs / experiments<input type="number" min="1" value={ecoLabel.numRuns} onChange={e=>setEco('numRuns',e.target.value)} placeholder="e.g. 12"/></label>
        <label>Measured energy / run (kWh) <span className="aiOptionalTag">overrides estimate</span><input type="number" min="0" step="0.01" value={ecoLabel.energyKwhPerRun} onChange={e=>setEco('energyKwhPerRun',e.target.value)} placeholder="e.g. 24.0"/></label>
        <label>Measured with<select value={ecoLabel.trainTool} onChange={e=>setEco('trainTool',e.target.value)}><option value="">—</option>{['CodeCarbon','Zeus','Carbontracker','EcoLogits','Green Algorithms','nvidia-smi','Power meter','Cloud provider dashboard','Other'].map(t=><option key={t} value={t}>{t}</option>)}</select></label>
      </div>}
    </section>}

    {section==='inference'&&<section id="ai-inference-section" className="aiLifecycleEditor" data-demo-target="ai-inference-section">
      <h2>Inference &amp; deployment</h2><p className="note">Inference recurs with each use. Enter the per-use energy and expected workload for the deployment you are assessing.</p>
      <div className="aiAvailabilityRow"><span>Inference energy</span><button type="button" onClick={()=>setEco('inferMode','kwh')} className={ecoLabel.inferMode!=='tokens'?'on':''}>Vision · kWh / study</button><button type="button" onClick={()=>setEco('inferMode','tokens')} className={ecoLabel.inferMode==='tokens'?'on':''}>LLM / agentic · token-based</button></div>
      <div className="grid grid3">
        <label>Monthly study volume<input type="number" min="0" value={ecoLabel.inferStudiesMonth} onChange={e=>setEco('inferStudiesMonth',e.target.value)} placeholder={`e.g. ${volumeEstimates[0]?.studiesPerMonth||5100}`}/></label>
        {ecoLabel.inferMode==='tokens'?<><label>Energy (Wh / 1k tokens)<input type="number" min="0" step="0.05" value={ecoLabel.whPer1kTokens} onChange={e=>setEco('whPer1kTokens',e.target.value)} placeholder="0.4"/></label><label>Model calls / study<input type="number" min="1" value={ecoLabel.callsPerTask} onChange={e=>setEco('callsPerTask',e.target.value)} placeholder="1"/></label><label>Tokens / call<input type="number" min="0" step="100" value={ecoLabel.tokensPerCall} onChange={e=>setEco('tokensPerCall',e.target.value)} placeholder="e.g. 2500"/></label></>:<label>Inference energy / study (kWh)<input type="number" min="0" step="0.0001" value={ecoLabel.inferKwhPerStudy} onChange={e=>setEco('inferKwhPerStudy',e.target.value)} placeholder="e.g. 0.004"/></label>}
        <label>Deployment lifetime (months)<input type="number" min="1" value={ecoLabel.deployMonths} onChange={e=>setEco('deployMonths',e.target.value)} placeholder="e.g. 36"/></label>
      </div>
      {ecoLabel.inferMode==='tokens'&&<p className="note">{ecoLabelData.tokensPerStudy>0?<>{ecoLabelData.tokensPerStudy.toLocaleString()} tokens/study → <strong>{ecoLabelData.inferKwhPerStudy} kWh/study</strong> ({ecoLabelData.perInferCo2g} gCO₂e).</>:<>Enter tokens/call to derive kWh/study.</>}</p>}
    </section>}

    <section className="aiBoundarySummary">
      <div><span>ENVIRONMENTAL BOUNDARY</span><strong>Water: {ecoLabelData.waterProv==='not-assessed'?'not assessed':ecoLabelData.waterProv==='screening'?'screening estimate':'inputs entered'}</strong><small>Water is reported separately from the carbon-and-energy Score. Unknown does not mean zero.</small></div>
      <button type="button" className="download" onClick={()=>onSection('water')}>Review boundary →</button>
    </section>

    {section==='water'&&<section id="ai-water-section" className="aiLifecycleEditor" data-demo-target="ai-water-section">
      <h2>Water &amp; environmental boundary</h2><p className="note">Enter site/grid water values when known, use the screening estimate, or explicitly report water as not assessed.</p>
      <div className="grid grid3"><label>Cooling water at compute site (L/kWh)<input type="number" min="0" step="0.01" value={ecoLabel.wueOnsite} onChange={e=>setEco('wueOnsite',e.target.value)} placeholder="e.g. 0.45"/></label><label>Water from electricity generation (L/kWh)<input type="number" min="0" step="0.01" value={ecoLabel.wueOffsite} onChange={e=>setEco('wueOffsite',e.target.value)} placeholder="by grid"/></label><label>If unknown<select value={ecoLabel.waterMode} onChange={e=>setEco('waterMode',e.target.value)}><option value="screening">Use the {waterPerKwh} L/kWh screening factor (Estimated)</option><option value="notassessed">Report water as not assessed</option></select></label></div>
      <p className="note">Water is reported separately and does not currently affect the carbon-and-energy CEDARS Score.<Ref id="li-thirsty-2023" order={refsOrder}/></p>
      <button type="button" className="download" onClick={onContribute}>Contribute water data or methodology →</button>
    </section>}
  </>;
}
