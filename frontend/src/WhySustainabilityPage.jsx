import React from 'react';
import {Leaf, Heart, Activity, Scan, Brain, Cpu, ArrowRight, TrendingDown, Gauge, FileText, Globe, Target, BarChart3} from 'lucide-react';
import './styles/why-sustainability.css';

const EvidenceLink = ({href, children}) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);

export function ResultsNextActions({kind='department', onImprove, onReport}) {
  const ai = kind === 'ai';
  return (
    <section className="resultsDecision" aria-labelledby={`${kind}-results-next-title`}>
      <div className="resultsDecisionHeading">
        <span>WHAT WOULD YOU LIKE TO DO NEXT?</span>
        <h2 id={`${kind}-results-next-title`}>Keep the current result, or test a change first</h2>
        <p>Exploring Improve does not change this result. Only implemented values written back to the profile create a new current result.</p>
      </div>

      <div className="resultsDecisionPath" aria-label="Improve, return to Results, then Report">
        <span>IMPROVE</span><i aria-hidden="true"/><b>RESULTS</b><i aria-hidden="true"/><span>REPORT</span>
      </div>

      <div className="resultsDecisionCards">
        <button type="button" className="resultsDecisionCard improve" onClick={onImprove}>
          <span className="resultsDecisionIcon"><TrendingDown size={22}/></span>
          <span className="resultsDecisionCardCopy">
            <small>OPTIONAL SCENARIO</small>
            <strong>Improve this assessment</strong>
            <p>Test prospective changes while keeping the current result as the baseline. Return to Results after implemented values are entered.</p>
            <b>Open Improve <ArrowRight size={16}/></b>
          </span>
        </button>
        <button type="button" className="resultsDecisionCard report" onClick={onReport}>
          <span className="resultsDecisionIcon"><FileText size={22}/></span>
          <span className="resultsDecisionCardCopy">
            <small>CURRENT STATE</small>
            <strong>Report current result</strong>
            <p>{ai ? 'Prepare the AI research report, methods, provenance, and optional Research Label without changing the current result.' : 'Prepare the Department EcoLabel, methods, provenance, and portable record without changing the current result.'}</p>
            <b>Open Report &amp; Share <ArrowRight size={16}/></b>
          </span>
        </button>
      </div>
      <p className="resultsDecisionNote">Improve is optional. If you test a scenario, the intended path is <strong>Improve &rarr; Results &rarr; Report</strong> so prospective and current states remain distinct.</p>
    </section>
  );
}

function FlowNode({icon, label, title, children, tone=''}) {
  return (
    <div className={`whyFlowNode ${tone}`}>
      <span className="whyFlowIcon">{icon}</span>
      <small>{label}</small>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export default function WhySustainabilityPage() {
  return (
    <main className="whyPage">
      <section className="whyHero">
        <div className="whyHeroCopy">
          <span className="whyEyebrow">WHY SUSTAINABILITY?</span>
          <h1>Environmental impact is part of how healthcare systems affect health.</h1>
          <p>Radiology is energy- and technology-intensive. Medical AI adds new compute and data demands, but can also change how care is delivered. The useful question is not whether a technology is simply "green" or "not green"; it is which effects occur, where they occur, and whether they change the total system footprint.</p>
        </div>
        <aside className="whyClinicalGate">
          <span><Heart size={18}/> CLINICAL GATE</span>
          <strong>Clinical quality and safety come first.</strong>
          <p>Sustainability should help distinguish clinically suitable options and improve how care is delivered. It should not compensate for inferior clinical performance.</p>
        </aside>
      </section>

      <section className="whySection" aria-labelledby="why-health-title">
        <div className="whySectionHeading">
          <span>01 / PLANETARY HEALTH</span>
          <h2 id="why-health-title">Why environmental performance belongs in a health conversation</h2>
          <p>Healthcare both responds to environmental threats and has an environmental footprint of its own. CEDARS focuses on the part a department or AI program can measure, interpret, and change.</p>
        </div>
        <div className="whyFlow four">
          <FlowNode icon={<Globe size={22}/>} label="ENVIRONMENT" title="Energy, materials, water, emissions" tone="environment">Care delivery depends on physical and digital infrastructure.</FlowNode>
          <ArrowRight className="whyFlowArrow" aria-hidden="true"/>
          <FlowNode icon={<Heart size={22}/>} label="HEALTH" title="Environmental conditions affect health" tone="health">Environmental burdens ultimately matter because they can affect people and communities.</FlowNode>
          <ArrowRight className="whyFlowArrow" aria-hidden="true"/>
          <FlowNode icon={<Activity size={22}/>} label="HEALTHCARE" title="Care has a measurable footprint" tone="care">Imaging, travel, supplies, data, and computing all contribute in different ways.</FlowNode>
          <ArrowRight className="whyFlowArrow" aria-hidden="true"/>
          <FlowNode icon={<Target size={22}/>} label="ACTION" title="Measure, interpret, improve" tone="action">Make the boundary explicit, then act where evidence and local data support it.</FlowNode>
        </div>
        <p className="whyFigureNote">Original CEDARS conceptual graphic. It summarizes the cited evidence base; it is not a reproduced publisher figure or a quantitative causal model.</p>
      </section>

      <section className="whySection" aria-labelledby="why-radiology-title">
        <div className="whySectionHeading">
          <span>02 / RADIOLOGY</span>
          <h2 id="why-radiology-title">The radiology footprint is distributed across the care pathway</h2>
          <p>Scanner electricity matters, but it is not the whole story. Hardware, data, supplies, travel, and workflow can sit outside the most obvious energy meter.</p>
        </div>
        <div className="whyScopeMap">
          <div className="whyScopeBand upstream">
            <span>UPSTREAM</span>
            <strong>Before care is delivered</strong>
            <ul><li>Equipment and hardware manufacturing</li><li>Contrast, supplies, and materials</li><li>Cloud and data-centre infrastructure</li></ul>
          </div>
          <div className="whyScopeCore">
            <span className="whyScopeCoreIcon"><Scan size={28}/></span>
            <small>IN PRACTICE</small>
            <strong>Imaging + interpretation</strong>
            <ul><li>Scanner and workstation energy</li><li>PACS / RIS and local compute</li><li>AI training, inference, and cooling</li></ul>
          </div>
          <div className="whyScopeBand downstream">
            <span>DOWNSTREAM / SYSTEM</span>
            <strong>After or around the exam</strong>
            <ul><li>Storage and data transfer</li><li>Patient and staff travel</li><li>Repeats, utilization, and wider system effects</li></ul>
          </div>
        </div>
        <div className="whyBoundaryRule"><Gauge size={20}/><div><strong>Not everything belongs in one total.</strong><p>CEDARS separates core quantified results, extended or screening estimates, and categories that were not assessed. Unknown is not treated as zero.</p></div></div>
        <div className="whyEvidenceInline">Radiology context: <EvidenceLink href="https://doi.org/10.1016/j.jacr.2025.02.009">Rockall et al., 2025 multi-society position paper</EvidenceLink> · <EvidenceLink href="https://doi.org/10.1148/radiol.2020192084">Heye et al., 2020</EvidenceLink> · <EvidenceLink href="https://doi.org/10.1007/s00330-025-12023-z">Jia et al., 2026</EvidenceLink>.</div>
      </section>

      <section className="whySection" aria-labelledby="why-ai-title">
        <div className="whySectionHeading">
          <span>03 / MEDICAL AI</span>
          <h2 id="why-ai-title">AI has an environmental cost and can also be a sustainability lever</h2>
          <p>Those two sides should be evaluated together without assuming that one cancels the other.</p>
        </div>
        <div className="whyAiBalance">
          <div className="whyAiSide cost">
            <span><Cpu size={22}/> ENVIRONMENTAL COST</span>
            <strong>Resources used by the AI lifecycle</strong>
            <ul><li>Training or pretraining compute</li><li>Recurring inference at deployment scale</li><li>Data storage and transfer</li><li>Hardware, cooling, and water where relevant</li></ul>
          </div>
          <div className="whyAiNet">
            <Brain size={30}/>
            <small>NET SYSTEM EFFECT</small>
            <strong>Must be evaluated in context</strong>
            <p>Lower compute per use does not by itself prove a lower total footprint.</p>
          </div>
          <div className="whyAiSide lever">
            <span><TrendingDown size={22}/> SUSTAINABILITY LEVER</span>
            <strong>Potential ways AI can reduce resource use</strong>
            <ul><li>Right-size models and serving hardware</li><li>Use lower-carbon compute when appropriate</li><li>Reduce unnecessary processing or storage</li><li>Support workflow changes that are locally demonstrated</li></ul>
          </div>
        </div>
        <div className="whyEvidenceInline">AI context: <EvidenceLink href="https://doi.org/10.1148/radiol.240320">Doo et al., Radiology 2024</EvidenceLink> · <EvidenceLink href="https://doi.org/10.1016/j.jacr.2023.11.011">Doo et al., JACR 2024</EvidenceLink> · <EvidenceLink href="https://doi.org/10.48550/arXiv.2304.03271">Li et al., 2023</EvidenceLink>.</div>
      </section>

      <section className="whySection" aria-labelledby="why-rebound-title">
        <div className="whySectionHeading">
          <span>04 / EFFICIENCY + SYSTEM EFFECTS</span>
          <h2 id="why-rebound-title">Efficiency per use and total impact are different questions</h2>
          <p>A more efficient scan, model, or workflow can lower impact per unit. Total impact then depends on what happens to volume, behavior, and downstream care.</p>
        </div>
        <div className="whyReboundFlow">
          <div className="whyReboundStart"><TrendingDown size={24}/><strong>Lower impact per use</strong><small>Less energy, carbon, storage, or material per unit</small></div>
          <ArrowRight aria-hidden="true"/>
          <div className="whyReboundMiddle"><BarChart3 size={24}/><strong>Utilization + behavior</strong><small>How often it is used and what else changes</small></div>
          <ArrowRight aria-hidden="true"/>
          <div className="whyReboundOutcomes">
            <div><b>FALL</b><span>Efficiency improves and total use is stable or lower.</span></div>
            <div><b>STAY SIMILAR</b><span>Efficiency gains are offset by greater use.</span></div>
            <div><b>RISE</b><span>Use grows faster than per-use impact falls.</span></div>
          </div>
        </div>
        <p className="whyFigureNote">This is why CEDARS keeps intensity metrics, total footprint, workload, and system effects distinct rather than treating one efficiency metric as the entire sustainability result.</p>
      </section>

      <section className="whySection whyCedarsBridge" aria-labelledby="why-cedars-title">
        <div className="whySectionHeading">
          <span>05 / FROM EVIDENCE TO DECISIONS</span>
          <h2 id="why-cedars-title">CEDARS keeps the current state, prospective changes, and reporting record separate</h2>
          <p>The workflow is designed so a scenario cannot silently rewrite the baseline that produced the result.</p>
        </div>
        <div className="whyCedarsFlow">
          <div><span>1</span><strong>Profile</strong><small>Define the current department or AI system and its evidence.</small></div>
          <ArrowRight aria-hidden="true"/>
          <div><span>2</span><strong>Results</strong><small>Interpret footprint, intensity, boundary, and what was not assessed.</small></div>
          <ArrowRight aria-hidden="true"/>
          <div><span>3</span><strong>Improve</strong><small>Test prospective changes without overwriting the current result.</small></div>
          <ArrowRight aria-hidden="true"/>
          <div><span>4</span><strong>Report</strong><small>Preserve assumptions, methods, provenance, and disclosure gaps.</small></div>
        </div>
        <div className="whyBridgePrinciple"><Leaf size={22}/><div><strong>Evidence &rarr; measurement &rarr; interpretation &rarr; action</strong><p>The aim is an auditable decision chain, not a single number detached from its boundary or clinical context.</p></div></div>
      </section>

      <section className="whySources" aria-labelledby="why-sources-title">
        <div className="whySectionHeading compact">
          <span>SOURCES</span>
          <h2 id="why-sources-title">Selected evidence behind this framing</h2>
          <p>Selected references are shown here for orientation; the full CEDARS assumptions and citation registry remains in <a href="https://github.com/takinci/cedars/blob/main/sources.md" target="_blank" rel="noreferrer">sources.md</a>.</p>
        </div>
        <div className="whySourceGrid">
          <EvidenceLink href="https://doi.org/10.1016/S2542-5196(20)30271-0">Tennison et al. Health care's response to climate change. Lancet Planet Health. 2021.</EvidenceLink>
          <EvidenceLink href="https://doi.org/10.1016/j.jacr.2025.02.009">Rockall et al. Sustainability in Radiology: multi-society position paper. 2025.</EvidenceLink>
          <EvidenceLink href="https://doi.org/10.1148/radiol.2020192084">Heye et al. Energy consumption of radiology: CT and MRI opportunities. Radiology. 2020.</EvidenceLink>
          <EvidenceLink href="https://doi.org/10.1016/j.jacr.2023.11.019">Doo et al. Climate-aware metrics tools and a potential radiology ecolabel. JACR. 2024.</EvidenceLink>
          <EvidenceLink href="https://doi.org/10.1148/radiol.240320">Doo et al. Balancing LLM accuracy and energy use. Radiology. 2024.</EvidenceLink>
          <EvidenceLink href="https://doi.org/10.1007/s00330-025-12023-z">Jia et al. Long-term CT data storage emissions and mitigation. Eur Radiol. 2026.</EvidenceLink>
        </div>
        <p className="whyFigureNote">All diagrams on this page are original CEDARS explanatory graphics synthesized from the cited literature; no publisher figure is reproduced.</p>
      </section>
    </main>
  );
}
