import React, {useMemo, useState} from 'react';
import {ExternalLink, Ref, ReferenceList} from './Refs.jsx';
import {REFS, refUrl} from './refs.js';

// Tool list verified 2026-10-04. Categories follow Doo et al., JACR 2024, Fig. 3 (energy
// measurement via hardware sensors · usage modelling from logs · power/energy modelling from a
// specification), refreshed for tools that have appeared or stalled since.
export const MEASURE_TOOLS = [
  {
    id: 'codecarbon', name: 'CodeCarbon', ref: 'codecarbon', status: 'v3.2.9 · July 2026 · MIT licence',
    reads: 'Intel RAPL (CPU, DRAM) and NVIDIA NVML (GPU) sensors; falls back to a TDP estimate where sensors are locked',
    output: 'kWh and kgCO₂e per run with grid carbon intensity by location — enter the kWh in CEDARS and keep the CO₂ figure to cross-check',
    effort: 'Three lines of Python, no changes inside the model; a command-line wrapper exists for scripts you cannot edit',
    watch: 'For a per-study inference figure, wrap one study rather than a batch, or divide by the batch size',
    fills: ['Training energy (kWh)', 'Inference energy (Wh/study)'], badge: 'measured',
    snippet: `from codecarbon import EmissionsTracker
tracker = EmissionsTracker(project_name="my-model")
tracker.start();  train()            # or: run_inference(one_study)
emissions_kg = tracker.stop()        # kWh is in emissions.csv`,
    fits: a => ['local', 'cloud', 'hpc'].includes(a.run) && a.python === 'yes',
    rank: a => (a.run === 'local' ? 3 : 2),
  },
  {
    id: 'zeus', name: 'Zeus (ML.ENERGY)', ref: 'zeus', status: 'PyTorch ecosystem project · Apache-2.0',
    reads: 'GPU energy via NVML; since 2025 also CPU, DRAM, AMD GPU, Apple Silicon and NVIDIA Jetson',
    output: 'Joules and seconds per measurement window; CEDARS converts joules to watt-hours',
    effort: 'Wrap any block of code in a measurement window; also finds the energy-optimal GPU power limit',
    watch: 'Windows around one study give the cleanest per-study inference figure',
    fills: ['Inference energy (Wh/study)', 'Training energy (kWh)'], badge: 'measured',
    snippet: `from zeus.monitor import ZeusMonitor
monitor = ZeusMonitor(gpu_indices=[0])
monitor.begin_window("one_study"); run_inference(one_study)
m = monitor.end_window("one_study"); wh = m.total_energy / 3600`,
    fits: a => ['local', 'cloud', 'hpc'].includes(a.run) && a.python === 'yes',
    rank: a => (a.phase.includes('inference') ? 2 : 1),
  },
  {
    id: 'carbontracker', name: 'Carbontracker', ref: 'carbontracker', status: 'PyPI 2.2.0 · alternate to CodeCarbon',
    reads: 'RAPL and NVML sensors during training; predicts the full-run footprint from the first epochs',
    output: 'kWh and gCO₂e for the run, with a prediction after a few epochs',
    effort: 'Two lines around a training loop',
    watch: 'Training-oriented; use Zeus or CodeCarbon for inference',
    fills: ['Training energy (kWh)'], badge: 'measured',
    fits: a => ['local', 'hpc'].includes(a.run) && a.python === 'yes' && a.phase.includes('training'),
    rank: () => 1,
  },
  {
    id: 'ecologits', name: 'EcoLogits', ref: 'ecologits-joss', status: 'GenAI Impact · actively maintained',
    reads: 'Nothing on your hardware: estimates each API call from the model, tokens generated and latency',
    output: 'kWh and kgCO₂e per request, attached to the API response',
    effort: 'One line (EcoLogits.init()) before using the OpenAI, Anthropic, Mistral, Cohere, Google or Hugging Face clients',
    watch: 'Estimates, not measurements — the vendor runs the hardware. Badged Estimated on your label',
    fills: ['Wh per 1,000 tokens', 'Calls per task'], badge: 'estimated',
    snippet: `from ecologits import EcoLogits
EcoLogits.init()
resp = client.chat.completions.create(model="…", messages=[…])
print(resp.impacts.energy.value)   # kWh for this call`,
    fits: a => a.run === 'api',
    rank: () => 3,
  },
  {
    id: 'ga4hpc', name: 'Green Algorithms / GA4HPC', ref: 'green-algorithms', status: 'calculator + Slurm plug-in',
    reads: 'Your cluster\'s job accounting (core-hours, memory, GPU type) — no code changes',
    output: 'kWh and gCO₂e per job or per period',
    effort: 'A module load and one command on the cluster, or the web calculator',
    watch: 'Usage modelling, not a sensor reading; excludes facility cooling unless you set a PUE',
    fills: ['Training energy (kWh)'], badge: 'estimated',
    fits: a => a.run === 'hpc',
    rank: a => (a.python === 'no' ? 3 : 2),
  },
  {
    id: 'ccf', name: 'Cloud Carbon Footprint and provider dashboards', ref: 'cloud-carbon-footprint', status: 'open source; AWS, Azure and Google Cloud also publish their own dashboards',
    reads: 'Billing and usage data from AWS, Azure and Google Cloud',
    output: 'kWh and kgCO₂e by account, service and period, including embodied emissions',
    effort: 'Connect a billing export; no code in the model',
    watch: 'Account-level, so attribute the share that belongs to this model',
    fills: ['Infrastructure totals (cloud)'], badge: 'estimated',
    fits: a => a.run === 'cloud',
    rank: a => (a.python === 'no' ? 3 : 1),
  },
  {
    id: 'scaphandre', name: 'Scaphandre', ref: 'scaphandre', status: 'open source · Prometheus exporter',
    reads: 'RAPL on the host; per-process power; works from a hypervisor for VMs',
    output: 'Watts per host and per process, as metrics you can graph',
    effort: 'Install the agent on the server; no code in the model',
    watch: 'CPU-side; pair with nvidia-smi for the GPU',
    fills: ['Server idle / active power'], badge: 'measured',
    fits: a => a.run === 'local' && a.python === 'no',
    rank: () => 2,
  },
  {
    id: 'nvidia-smi', name: 'nvidia-smi (no-code fallback)', ref: null, status: 'ships with the NVIDIA driver',
    reads: 'NVML power draw, polled by hand',
    output: 'Watts over time; average × hours ÷ 1000 gives kWh',
    effort: 'One command during the run',
    watch: 'Badged Estimated, since you are integrating by hand',
    fills: ['Either energy field (Estimated)'], badge: 'estimated',
    snippet: `nvidia-smi --query-gpu=power.draw --format=csv -l 1 > power.csv`,
    fits: a => a.run !== 'api',
    rank: a => (a.python === 'no' ? 2 : 0),
  },
];

export const MEASURE_REFS = ['doo-jacr-2024', 'codecarbon', 'zeus', 'ecologits-joss', 'green-algorithms', 'cloud-carbon-footprint', 'scaphandre', 'carbontracker', 'ai-energy-score', 'boavizta'];

const chip = (on) => ({
  display:'inline-flex', alignItems:'center', gap:8, minHeight:40, padding:'0 14px', borderRadius:999,
  border:`1px solid ${on?'#2E7D32':'#c8e6c9'}`, background:on?'#2E7D32':'#fff', color:on?'#fff':'#1b3a22',
  fontSize:13, cursor:'pointer', fontWeight: on ? 700 : 500, boxShadow:'none',
});
const tag = (kind) => ({
  display:'inline-block', fontSize:11, fontWeight:700, letterSpacing:'.04em', padding:'3px 10px', borderRadius:999,
  background: kind==='fill' ? '#fff3e0' : kind==='meta' ? '#eceff1' : '#e8f5e9',
  color: kind==='fill' ? '#8a4b00' : kind==='meta' ? '#37474f' : '#1b5e20',
});

export function MeasureChooser({scen, onUse, onDone}) {
  const [a, setA] = useState({run: 'local', phase: ['training', 'inference'], python: 'yes'});
  const togglePhase = p => setA(x => ({...x, phase: x.phase.includes(p) ? x.phase.filter(q => q !== p) : [...x.phase, p]}));
  const fitting = useMemo(() => MEASURE_TOOLS.filter(t => t.fits(a)).sort((x, y) => y.rank(a) - x.rank(a)), [a]);
  const primary = fitting.filter(t => t.rank(a) > 0).slice(0, 2);
  const fallback = fitting.find(t => t.id === 'nvidia-smi' && !primary.includes(t));
  const hidden = MEASURE_TOOLS.filter(t => !fitting.includes(t));
  const runLabel = {local: 'a local GPU', hpc: 'an HPC cluster', cloud: 'a cloud VM', api: 'a vendor API'}[a.run];

  return (
    <div style={{display:'flex', flexDirection:'column', gap:14, marginTop:16}}>
      <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
        <span style={tag()}>1 · WHERE IT RUNS</span><span style={{color:'#90a4ae'}}>→</span>
        <span style={{...tag('meta'), background:'#fff', border:'1px solid #c8e6c9'}}>2 · PICK A TOOL</span><span style={{color:'#90a4ae'}}>→</span>
        <span style={{...tag('meta'), background:'#fff', border:'1px solid #c8e6c9'}}>3 · ENTER RESULTS</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(300px, 420px) 1fr', gap:18, alignItems:'start'}} className="measureGrid">
        <div style={{background:'#fff', border:'1px solid #c8e6c9', borderRadius:16, padding:'18px 20px', display:'flex', flexDirection:'column', gap:18}}>
          <div>
            <h2 style={{margin:'0 0 4px', fontSize:18}}>Three questions about your setup</h2>
            <p className="note" style={{margin:0}}>The recommendations on the right narrow as you answer. Your answers stay in your browser.</p>
          </div>
          <div>
            <h3 style={{margin:'0 0 8px', fontSize:13}}>Where does the model run?</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {[['local','Local workstation or server GPU'],['hpc','HPC cluster (Slurm, PBS)'],['cloud','Cloud VM (AWS · Azure · Google Cloud)'],['api','Vendor API only (hosted LLM)']].map(([k,l]) => (
                <button key={k} type="button" style={chip(a.run===k)} onClick={()=>setA(x=>({...x, run:k, python: k==='api' ? 'yes' : x.python}))}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{margin:'0 0 8px', fontSize:13}}>Which phase do you need numbers for?</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              <button type="button" style={chip(a.phase.includes('training'))} onClick={()=>togglePhase('training')}>Training (one-time)</button>
              <button type="button" style={chip(a.phase.includes('inference'))} onClick={()=>togglePhase('inference')}>Inference (per study)</button>
            </div>
          </div>
          {a.run !== 'api' && (
            <div>
              <h3 style={{margin:'0 0 8px', fontSize:13}}>Can you add a few lines of Python to the code?</h3>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                <button type="button" style={chip(a.python==='yes')} onClick={()=>setA(x=>({...x, python:'yes'}))}>Yes</button>
                <button type="button" style={chip(a.python==='no')} onClick={()=>setA(x=>({...x, python:'no'}))}>No — I only have logs or a dashboard</button>
              </div>
            </div>
          )}
          <div className="note" style={{borderTop:'1px solid #e0efe2', paddingTop:14, margin:0}}>
            <strong>How to read the badges.</strong> A tool either reads hardware sensors (RAPL for CPUs, NVML for NVIDIA GPUs), models usage from job logs, or estimates from a specification. Sensor-read values earn the <span style={{...tag(), fontSize:10}}>MEASURED</span> badge on your label; the other two earn <span style={{...tag('meta'), fontSize:10}}>ESTIMATED</span>.
            <div style={{marginTop:10}}>This chooser follows the tool categories in Doo et al.<Ref id="doo-jacr-2024" order={MEASURE_REFS}/> (Fig. 3), with the tool list re-checked October 2026.</div>
          </div>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
            <h2 style={{margin:0, fontSize:18}}>Recommended for {runLabel}{a.phase.length===2 ? ', training + inference' : a.phase.length===1 ? `, ${a.phase[0]}` : ''}{a.run!=='api' ? (a.python==='yes' ? ', Python OK' : ', no code') : ''}</h2>
            <span className="note" style={{margin:0}}>{fitting.length} of {MEASURE_TOOLS.length} tools fit</span>
          </div>
          {primary.length === 0 && <p className="note">Nothing matches every answer — the no-code fallback below always applies.</p>}
          {primary.map((t, i) => (
            <div key={t.id} style={{border:`1px solid ${i===0?'#2E7D32':'#c8e6c9'}`, boxShadow: i===0 ? 'inset 0 0 0 1px #2E7D32' : 'none', borderRadius:14, padding:'16px 18px', background:'#fff', display:'flex', flexDirection:'column', gap:10}}>
              <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
                <strong style={{fontSize:16}}>{t.name}{t.ref && <Ref id={t.ref} order={MEASURE_REFS}/>}</strong>
                {i===0 && <span style={tag()}>BEST FIT</span>}
                <span style={tag('meta')}>{t.status}</span>
                {t.fills.map(f => <span key={f} style={tag('fill')}>fills → {f}</span>)}
              </div>
              <dl style={{display:'grid', gridTemplateColumns:'130px 1fr', gap:'4px 12px', fontSize:12, color:'#37474f', margin:0}}>
                <dt style={{fontWeight:700, color:'#1b3a22'}}>What it reads</dt><dd style={{margin:0}}>{t.reads}</dd>
                <dt style={{fontWeight:700, color:'#1b3a22'}}>Output</dt><dd style={{margin:0}}>{t.output}</dd>
                <dt style={{fontWeight:700, color:'#1b3a22'}}>Effort</dt><dd style={{margin:0}}>{t.effort}</dd>
                <dt style={{fontWeight:700, color:'#1b3a22'}}>Watch out</dt><dd style={{margin:0}}>{t.watch}</dd>
              </dl>
              {t.snippet && <pre style={{margin:0, background:'#f4f7f5', border:'1px solid #e0efe2', borderRadius:8, padding:'10px 12px', fontSize:12, lineHeight:1.5, overflowX:'auto'}}>{t.snippet}</pre>}
              <div style={{display:'flex', gap:14, alignItems:'center', flexWrap:'wrap'}}>
                <button type="button" onClick={()=>{ onUse({trainTool: t.name.split(' (')[0]}); onDone(); }}>I ran it — enter results →</button>
                {t.ref && REFS[t.ref] && <ExternalLink href={refUrl(REFS[t.ref])}>Documentation and source</ExternalLink>}
              </div>
            </div>
          ))}
          {fallback && (
            <div style={{border:'1px solid #c8e6c9', borderRadius:14, padding:'14px 18px', background:'#fbfdfb', display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}><strong>No-code fallback</strong><span style={tag('meta')}>manual</span><span style={tag('fill')}>fills → either field, as ESTIMATED</span></div>
              <div className="note" style={{margin:0}}>Run <code>{fallback.snippet}</code> during the job, then average the watts and multiply by hours ÷ 1000. Or enter the GPU model and hours and let CEDARS apply TDP × PUE.</div>
            </div>
          )}
          <div className="note" style={{margin:0, padding:'0 4px'}}>
            Not shown for these answers: {hidden.map((t, i) => <span key={t.id}><strong>{t.name.split(' (')[0]}</strong>{i < hidden.length - 1 ? ' · ' : ''}</span>)}{hidden.length ? ' · ' : ''}
            <strong>AI Energy Score</strong><Ref id="ai-energy-score" order={MEASURE_REFS}/> (external 1–5 star benchmark for general-purpose models) · <strong>Boavizta</strong><Ref id="boavizta" order={MEASURE_REFS}/> (embodied hardware carbon). Change the answers to see the rest.
          </div>
          <div className="note" style={{border:'1px solid #dfe3d6', background:'#f3f4ee', borderRadius:12, padding:'12px 16px', margin:0}}>
            <strong style={{color:'#1b3a22'}}>Current as of October 2026.</strong> Tools in this area change quickly. If you know of a newer or better resource, or find an error here, please tell the CEDARS leads — contact details are on the About page.
          </div>
        </div>
      </div>
      <ReferenceList ids={MEASURE_REFS} compact/>
    </div>
  );
}
