// CEDARS_CHUNK_9R32_WALKTHROUGH_ECOLABEL_METHOD
// CEDARS_CHUNK_9R32C_REFERENCE_ADJUSTED_ECOLABEL
// CEDARS_CHUNK_9R32E_ECOLABEL_PATHS_PRACTICE_CONTEXT
// CEDARS_CHUNK_9R32F_ECOLABEL_METHOD_SIMPLIFICATION
// CEDARS_CHUNK_9R32G_ECOLABEL_METHOD_LAYPERSON_POLISH
// CEDARS_CHUNK_9R32H_PRACTICE_CONTEXT_RENDER_REPAIR
// CEDARS_CHUNK_9R32J_AI_PER_USE_CONTEXT_GATE
// CEDARS_CHUNK_9R32I_CONTEXT_ORDER_REFERENCE_COPY
import React from 'react';
import {Activity, ArrowDown, ArrowRight, Brain, Gauge, Leaf, Scale, TrendingDown} from 'lucide-react';

const DEPT_BANDS=[
  ['80–100','5 leaves','Much lower energy than reference'],
  ['60–79','4 leaves','Lower energy than reference'],
  ['40–59','3 leaves','Near reference'],
  ['20–39','2 leaves','Higher energy than reference'],
  ['0–19','1 leaf','Much higher energy than reference'],
];
const AI_BANDS=[
  ['80–100','5 leaves','Very low carbon per use'],
  ['60–79','4 leaves','Low carbon per use'],
  ['40–59','3 leaves','Moderate carbon per use'],
  ['20–39','2 leaves','Higher carbon per use'],
  ['0–19','1 leaf','Much higher carbon per use'],
];

const FlowArrow=()=> <div className="ecoMethodFlowArrow" aria-hidden="true"><ArrowDown size={17}/></div>;

export default function EcoLabelMethodPage({onEvidence,onStart}){
  return <main className="ecoMethodPage ecoMethodInfographicPage">
    <section className="ecoMethodHero">
      <span>ECOLABEL METHOD</span>
      <h1>One EcoLabel family, with two assessment paths.</h1>
      <p>Choose what you are assessing. CEDARS uses a calculation suited to a radiology practice or an AI system, then reports both with the same EcoLabel Score and leaf format while keeping absolute environmental impact visible.</p>
      <div className="ecoMethodHeroActions">
        <button type="button" className="ecoMethodSecondaryAction" onClick={onEvidence}>Evidence library →</button>
        <button type="button" className="evidencePrimaryCta ecoMethodReadyCta" onClick={onStart}><span>READY?</span><strong>Start a CEDARS assessment</strong><ArrowRight size={16}/></button>
      </div>
    </section>

    <section className="ecoMethodFlow" aria-label="CEDARS EcoLabel two-path method">
      <div className="ecoMethodFlowStart"><span>START</span><strong>What are you assessing?</strong></div>
      <FlowArrow/>
      <div className="ecoMethodPathGrid">
        <article className="ecoMethodPath department">
          <div className="ecoMethodPathTitle"><Activity size={22}/><div><span>RADIOLOGY DEPARTMENT</span><strong>Practice + service operation</strong></div></div>
          <div className="ecoMethodPathSteps">
            <div><b>1</b><span><strong>Describe the practice &amp; service</strong><small>Equipment, physical imaging workload, sites, and practice context</small></span></div>
            <div><b>2</b><span><strong>Set a service reference</strong><small>Expected operating energy for a similar represented service mix</small></span></div>
            <div><b>3</b><span><strong>Compare energy use</strong><small>Current modeled energy compared with the CEDARS service reference</small></span></div>
          </div>
          <div className="ecoMethodPathResult"><Gauge size={18}/><span><small>DEPARTMENT ECOLABEL SCORE</small><strong>Energy use compared with a similar service</strong></span></div>
          <div className="ecoMethodPathMini department ecoMethodEquationRow" aria-label="Department EcoLabel Score examples">
            <div className="ecoMethodEquationBox"><span>0.5× reference</span><strong>Score 100</strong></div><ArrowRight className="ecoMethodEquationArrow" size={15}/><div className="ecoMethodEquationBox reference"><span>At reference</span><strong>Score 50</strong></div><ArrowRight className="ecoMethodEquationArrow" size={15}/><div className="ecoMethodEquationBox"><span>2× reference</span><strong>Score 0</strong></div>
          </div>
          <small className="ecoMethodEquationCaption">More energy compared with the service reference → lower Score.</small>
          <p className="ecoMethodPathFootnote"><strong>Score 50 means “at the CEDARS service reference.”</strong> It does not mean the 50th percentile.</p>
        </article>

        <article className="ecoMethodPath ai">
          <div className="ecoMethodPathTitle"><Brain size={22}/><div><span>AI MODEL &amp; INFORMATICS</span><strong>Training + deployment</strong></div></div>
          <div className="ecoMethodPathSteps">
            <div><b>1</b><span><strong>Describe the AI use</strong><small>Training or fine-tuning plus recurring clinical deployment</small></span></div>
            <div><b>2</b><span><strong>Estimate carbon</strong><small>Energy use together with where the computing takes place</small></span></div>
            <div><b>3</b><span><strong>Report carbon per use</strong><small>Training impact spread across expected uses + deployment impact per study/use</small></span></div>
          </div>
          <div className="ecoMethodPathResult"><Scale size={18}/><span><small>AI RESEARCH ECOLABEL SCORE</small><strong>Carbon per study or use</strong></span></div>
          <div className="ecoMethodPathMini ai ecoMethodEquationRow" aria-label="AI EcoLabel carbon per use">
            <div className="ecoMethodEquationBox"><span>Training share / use</span></div><b className="ecoMethodEquationOperator">+</b><div className="ecoMethodEquationBox"><span>Deployment / use</span></div><b className="ecoMethodEquationOperator">=</b><div className="ecoMethodEquationBox result"><strong>Carbon / use</strong></div>
          </div>
          <p className="ecoMethodPathFootnote"><strong>Clinical suitability comes first.</strong> A lower environmental impact does not compensate for an AI system that is not appropriate for the intended clinical use.</p>
        </article>
      </div>
      <FlowArrow/>
      <div className="ecoMethodConverge"><Leaf size={24}/><div><span>SHARED REPORTING FORMAT</span><strong>CEDARS EcoLabel</strong><small>0–100 EcoLabel Score · 1–5 leaves · absolute impact · data basis &amp; assumptions</small></div></div>
    </section>

    <section className="ecoMethodSection ecoMethodRatingCompare">
      <div className="ecoMethodSectionHead"><span>LEAF RATING</span><h2>The same 0–100 visual scale, interpreted for each path</h2></div>
      <div className="ecoMethodRatingGrid">
        <div className="department"><h3>Radiology Department <sup>*</sup></h3>{DEPT_BANDS.map(([score,leaves,label])=><div className="ecoMethodBandRow" key={score}><b>{score}</b><span>{leaves}</span><strong>{label}</strong></div>)}<p className="ecoMethodReferenceFootnote"><strong>*Service reference:</strong> the expected energy use for a similar mix of imaging equipment and workload, using the information entered and CEDARS published defaults.</p></div>
        <div className="ai"><h3>AI Research EcoLabel <sup>*</sup></h3>{AI_BANDS.map(([score,leaves,label])=><div className="ecoMethodBandRow" key={score}><b>{score}</b><span>{leaves}</span><strong>{label}</strong></div>)}<p className="ecoMethodReferenceFootnote ecoMethodAiUseFootnote"><strong>*Per use:</strong> training can require substantial energy up front, so CEDARS spreads that training impact across the expected lifetime number of uses and adds the impact of each deployment (inference). With enough use, repeated inference can become the larger share. The balance is not fixed: newer hardware, software/model design, data-center efficiency, and where computing runs can all change energy use over time. <span className="ecoMethodInlineSources">Sources: <a href="https://doi.org/10.1016/j.joule.2024.07.018" target="_blank" rel="noreferrer">Masanet et al. 2024</a>; <a href="https://doi.org/10.1109/MC.2022.3148714" target="_blank" rel="noreferrer">Patterson et al. 2022</a>.</span></p></div>
      </div>
      <p className="ecoMethodNote">The two paths share the EcoLabel display scale, but the scores represent different quantities. A Department Score and an AI Score should not be read as equivalent physical footprints.</p>
    </section>

    <section className="ecoMethodCompactPrinciples" aria-label="How to interpret the EcoLabel">
      <article><Leaf size={18}/><strong>Absolute impact stays visible</strong><p>Annual energy/carbon and other assessed categories remain separate from the EcoLabel Score.</p></article>
      <article><TrendingDown size={18}/><strong>Possible changes stay separate</strong><p>Decision Workspace tests future scenarios without rewriting the current Profile.</p></article>
      <article><Gauge size={18}/><strong>Context is not a bonus system</strong><p>Practice size, setting, location, and documented practices provide context; they do not automatically add points.</p></article>
    </section>

    <details className="ecoMethodTechnicalDetails ecoMethodTechnicalMaster">
      <summary>Methods: technical details &amp; assumptions</summary>
      <div className="ecoMethodTechnicalBody">
        <p className="ecoMethodTechnicalIntro">These details document how CEDARS calculates and interprets each EcoLabel path. They are kept out of the main visual flow so the public summary stays easy to scan.</p>
        <div className="ecoMethodTechnicalColumns">
          <section><h3>Department calculation</h3><p><code>Score = clamp(round[50 − 50 × log2(observed kWh / reference kWh)], 0, 100)</code></p><p>The service reference is built from the represented fleet, physical workload by modality, PACS/reporting support, and versioned literature assumptions. Grid carbon changes the absolute carbon result, not this energy comparison by itself.</p></section>
          <section><h3>AI calculation</h3><p>The AI Research EcoLabel uses training carbon spread across expected uses plus recurring deployment carbon per study/use on the documented v1 0–100 scale.</p><p>If training or deployment information is unavailable, it remains visibly unavailable rather than being treated as zero.</p></section>
          <section><h3>Practice &amp; service context</h3><p>CEDARS records practice size, sites, setting, location, service hours, and whether the service operates scanners, is mixed, or is interpretation-only/teleradiology alongside the Department service reference.</p><p>The current numerical energy reference is calculated from the represented equipment and physical workload. These context fields help describe a like-for-like comparison; a larger, smaller, academic, community, or teleradiology practice does not automatically receive a better score.</p></section>
          <section><h3>What the score does—and does not—mean</h3><p>The EcoLabel Score is only one part of the result. CEDARS also shows the absolute energy or carbon impact, keeps missing information visible instead of assuming zero, and always treats clinical quality and safety as the priority.</p><p>Department and AI scores use the same 0–100 display, but they measure different things and should not be compared as if they were the same physical quantity.</p></section>
          <section><h3>How the method can improve over time</h3><p>As more real-world assessments are shared, CEDARS can check whether factors such as practice size, service mix, setting, and actual AI use help explain differences between organizations. CEDARS will only use terms such as “peer percentile” after those comparisons have been tested with enough real-world data.</p></section>
        </div>
        <div className="ecoMethodTechnicalActions ecoMethodTechnicalActionsSingle">
          <a className="ecoMethodMethodsLink" href="https://github.com/takinci/cedars/blob/main/sources.md" target="_blank" rel="noreferrer"><span>METHODS &amp; SOURCES</span><strong>Open full Methods &amp; Sources</strong><span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </details>
  </main>;
}
