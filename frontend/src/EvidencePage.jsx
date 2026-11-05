// CEDARS_CHUNK_9R32_WALKTHROUGH_ECOLABEL_METHOD
// CEDARS_CHUNK_9R26_WORKFLOW_ECOLABEL_UNIFICATION
// CEDARS_CHUNK_9R27_VISUAL_LANGUAGE_PARITY
import React from 'react';
// CEDARS_CHUNK_9R14B_UNIVERSAL_DARK_EVIDENCE
// CEDARS_CHUNK_9R15_EVIDENCE_LAYERING
import {ArrowRight, ExternalLink, BookOpen, Scan, Brain, Database, Droplets, Ruler, Pause, Play} from 'lucide-react';

const GROUPS = [
  {
    key:'foundations', eyebrow:'FOUNDATIONS', title:'Why sustainability belongs in healthcare', icon:BookOpen,
    blurb:'Start with the health-system case, then narrow to imaging.',
    cards:[
      {type:'REVIEW / ACTION FRAMEWORK',year:'2024',authors:['McKee H','Brown MJ','Kim HHR','Doo FX','Panet H','Rockall AG','Omary RA','Hanneman K'],venue:'Radiology',title:'Planetary Health and Radiology: Why We Should Care and What We Can Do',href:'https://doi.org/10.1148/radiol.240219',why:'Connects planetary health to radiology and organizes practical mitigation and adaptation strategies.',used:'Intervention framing and operational sustainability categories.'},
      {type:'MULTI-SOCIETY POSITION PAPER',year:'2025',authors:['Rockall AG','Allen B','Brown MJ','El-Diasty T','Fletcher J','Gerson RF','Goergen S','Marrero González AP','Grist TM','Hanneman K','Hess CP','Ho ELM','Salama DH','Schoen J','Sheard S'],venue:'J Am Coll Radiol',title:'Sustainability in Radiology: Position Paper and Call to Action',href:'https://doi.org/10.1016/j.jacr.2025.02.009',why:'Eleven radiology societies call for measurable action across energy, travel, equipment, supply chains, waste, and access.',used:'System framing, travel, equipment lifetime, and mitigation context.'},
      {type:'HEALTH-SYSTEM FOOTPRINT',year:'2021',authors:['Tennison I','Roschnik S','Ashby B','Boyd R','Hamilton I','Oreszczyn T','Owen A','Romanello M','Ruyssevelt P','Sherman JD','Smith AZP','Steele K','Watts N','Eckelman MJ'],venue:'Lancet Planet Health',title:"Health care's response to climate change: a carbon footprint assessment of the NHS in England",href:'https://doi.org/10.1016/S2542-5196(20)30271-0',why:'Shows that healthcare emissions extend well beyond electricity, including supply chains and travel.',used:'Scope 3 context, including staff and patient travel.'},
      {type:'PERSPECTIVE',year:'2026',authors:['Doo FX'],venue:'J Am Coll Radiol',title:"Sustainability as Radiology's Triple Helix: Value, Patient Care, and the Planet",href:'https://doi.org/10.1016/j.jacr.2026.02.021',why:'Frames value, patient care, and planetary health as linked dimensions of modern radiology rather than separate goals.',used:'Public-facing rationale for integrating sustainability into imaging decisions.'},
    ],
  },
  {
    key:'radiology', eyebrow:'RADIOLOGY', title:'Imaging energy, operations, and life cycle', icon:Scan,
    blurb:'Measured scanner behavior and life-cycle studies anchor the department side of CEDARS.',
    cards:[
      {type:'MEASURED ENERGY STUDY',year:'2020',authors:['Heye T','Knoerl R','Wehrle T','Mangold D','Cerminara A','Loser M','Plumeyer M','Degen M','Lüthy R','Brodbeck D','Merkle EM'],venue:'Radiology',title:'The energy consumption of radiology: energy- and cost-saving opportunities for CT and MRI operation',href:'https://doi.org/10.1148/radiol.2020192084',why:'Measured CT and MRI operating states show how much energy is used outside active scanning.',used:'Scanner energy states, idle-energy context, and power-management opportunities.'},
      {type:'LIFE-CYCLE ASSESSMENT',year:'2024',authors:['Thiel CL','Vigil-Garcia M','Nande S','Meijer C','Gehrels J','Struk O','Thornander S','Pullella D','Omary RA','Carver DE','Scheel JR'],venue:'Radiology',title:'Environmental Life Cycle Assessment of a U.S. Hospital-based Radiology Practice',href:'https://doi.org/10.1148/radiol.240398',why:'Quantifies department- and modality-level greenhouse-gas emissions across a hospital radiology practice.',used:'External benchmark and validation context; not Score calibration.'},
      {type:'LIFE-CYCLE ASSESSMENT',year:'2022',authors:['McAlister S','McGain F','Petersen M','Story D','Charlesworth K','Ison G','Barratt A'],venue:'Lancet Reg Health West Pac',title:'The carbon footprint of hospital diagnostic imaging in Australia',href:'https://doi.org/10.1016/j.lanwpc.2022.100459',why:'Provides prospective per-scan life-cycle estimates across MRI, CT, radiography, and ultrasound.',used:'Contextual benchmark evidence across modalities.'},
      {type:'DATA STORAGE STUDY',year:'2026',authors:['Jia Y','Deng M','Burger R','Sheard S','Hanneman K','Drucker Iarovich M','Sala E','Avesani G','Illing RO','Rockall AG'],venue:'European Radiology',title:'Greenhouse gas emissions due to long-term data storage of CT with reformats and strategies for mitigation',href:'https://doi.org/10.1007/s00330-025-12023-z',why:'Shows that long-term imaging storage and retained reformats can create a measurable digital footprint.',used:'Storage assumptions and data-retention mitigation context.'},
    ],
  },
  {
    key:'ai', eyebrow:'MEDICAL AI', title:'Training, inference, and clinical deployment', icon:Brain,
    blurb:'The AI evidence separates compute used by a model from changes the model may make to care.',
    cards:[
      {type:'CLINICAL AI FRAMEWORK',year:'2024',authors:['Doo FX','Vosshenrich J','Cook TS','Moy L','Almeida EPRP','Woolen SA','Gichoya JW','Heye T','Hanneman K'],venue:'Radiology',title:'Environmental Sustainability and AI in Radiology: A Double-Edged Sword',href:'https://doi.org/10.1148/radiol.232030',why:'Frames AI as both a source of computational impact and a potential lever that can alter clinical workflows.',used:'AI lifecycle framing, cloud context, and the footprint-versus-benefit distinction.'},
      {type:'EXPERIMENTAL STUDY',year:'2024',authors:['Doo FX','Savani D','Kanhere A','Carlos RC','Joshi A','Yi PH','Parekh VS'],venue:'Radiology',title:'Optimal Large Language Model Characteristics to Balance Accuracy and Energy Use for Sustainable Medical Applications',href:'https://doi.org/10.1148/radiol.240320',why:'Shows why a larger language model is not automatically the best choice when performance and energy are considered together.',used:'Model right-sizing and inference-efficiency guidance.'},
      {type:'TRAINING POLICY STUDY',year:'2026',authors:['Dietrich N','McShannon D','Huisman M','Doo FX','Hanneman K'],venue:'Can Assoc Radiol J',title:'Effect of Deep Learning Training Policy on Greenhouse Gas Emissions and Carbon Efficiency for Chest Radiograph Classification',href:'https://doi.org/10.1177/08465371261475319',why:'Examines how training choices change greenhouse-gas emissions and carbon efficiency for a radiology task.',used:'Training-policy and experimentation guidance.'},
      {type:'MEDICAL IMAGING AI STUDY',year:'2022',authors:['Selvan R','Bhagwat N','Wolff Anthony LF','Kanding B','Dam EB'],venue:'MICCAI',title:'Carbon Footprint of Selecting and Training Deep Learning Models for Medical Image Analysis',href:'https://doi.org/10.1007/978-3-031-16443-9_49',why:'Provides empirical energy and carbon evidence for selecting and training medical-imaging deep-learning models.',used:'Input-size and volumetric-compute scaling context.'},
      {type:'TEXTBOOK CHAPTER',year:'2026',authors:['Nghiem D','Dogra S','Doo FX'],venue:'Digital Healthcare and Artificial Intelligence',title:'Sustainability in Clinical AI',href:'https://doi.org/10.1201/9781032709956-14',why:'A practical clinical overview of AI energy use, infrastructure, rebound effects, and sustainability strategies.',used:'Educational context for AI lifecycle and system-effects guidance; not a Score input.'},
    ],
  },
  {
    key:'digital', eyebrow:'DIGITAL INFRASTRUCTURE', title:'Cloud, storage, and data movement', icon:Database,
    blurb:'Digital imaging has infrastructure behind it: servers, networks, data centres, and regional electricity.',
    cards:[
      {type:'RADIOLOGY CLOUD ANALYSIS',year:'2024',authors:['Doo FX','Kulkarni P','Siegel EL','Toland M','Yi PH','Carlos RC','Parekh VS'],venue:'J Am Coll Radiol',title:'Economic and environmental costs of cloud technologies for medical imaging and radiology artificial intelligence',href:'https://doi.org/10.1016/j.jacr.2023.11.011',why:'Connects cloud architecture, geography, cost, and environmental impact for imaging and radiology AI.',used:'Cloud-provider, PUE, regional carbon-intensity, and hosting context.'},
      {type:'NETWORK ENERGY STUDY',year:'2018',authors:['Aslan J','Mayers K','Koomey JG','France C'],venue:'Journal of Industrial Ecology',title:'Electricity Intensity of Internet Data Transmission: Untangling the Estimates',href:'https://doi.org/10.1111/jiec.12630',why:'Provides an evidence base for estimating the electricity associated with data transmission.',used:'DICOM/network-transfer screening assumptions.'},
      {type:'SOFTWARE STANDARD',year:'2024',authors:['Green Software Foundation'],venue:'ISO/IEC 21031:2024',title:'Software Carbon Intensity (SCI) Specification',href:'https://doi.org/10.5281/zenodo.8369519',why:'Defines a functional-unit approach to reporting software carbon intensity.',used:'Per-study carbon reporting and software-intensity framing.'},
    ],
  },
  {
    key:'resources', eyebrow:'RESOURCES & LIFECYCLE', title:'Water, contrast, and material waste', icon:Droplets,
    blurb:'Energy is only part of the picture. These studies cover water use, contrast media, and material waste that should be counted separately.',
    cards:[
      {type:'WATER / AI METHODS',year:'2023',authors:['Li P','Yang J','Islam MA','Ren S'],venue:'arXiv',title:'Making AI less “thirsty”: uncovering and addressing the secret water footprint of AI models',href:'https://doi.org/10.48550/arXiv.2304.03271',why:'Separates on-site cooling water from water used in electricity generation and highlights location dependence.',used:'AI water disclosure and screening-boundary design.'},
      {type:'NATIONAL UTILIZATION STUDY',year:'2025',authors:['Doo FX','Lee R','Rockall A','Rula EY','Moy L'],venue:'JAMA Network Open',title:'Medical Imaging Contrast Media Use',href:'https://doi.org/10.1001/jamanetworkopen.2025.47304',why:'Quantifies national contrast-media use patterns and shows how a relatively small set of examinations accounts for most use.',used:'Contrast stewardship and utilization context; not a direct numerical Score default.'},
      {type:'SUPPLY-CHAIN ANALYSIS',year:'2026',authors:['Nghiem DX','Yahyavi-Firouz-Abadi N','Hwang GL','Zafari Z','Moy L','Carlos RC','Doo FX'],venue:'J Am Coll Radiol',title:"The Iodine Opportunity for Sustainable Radiology: Quantifying Supply-Chain Strategies to Cut Contrast's Carbon and Costs",href:'https://doi.org/10.1016/j.jacr.2025.09.027',why:'Traces iodinated contrast from raw material extraction through administration and compares practical reduction strategies.',used:'ICM supply-chain carbon and contrast-reduction intervention assumptions.'},
    ],
  },
  {
    key:'methods', eyebrow:'MEASUREMENT & REPORTING', title:'Interpreting environmental metrics', icon:Ruler,
    blurb:'These sources show how to report environmental results clearly, including what was measured, estimated, and assumed.',
    cards:[
      {type:'RADIOLOGY METHODS',year:'2024',authors:['Doo FX','Parekh VS','Kanhere A','Savani D','Tejani AS','Sapkota A','Yi PH'],venue:'J Am Coll Radiol',title:'Evaluation of Climate-Aware Metrics Tools for Radiology Informatics and Artificial Intelligence: Toward a Potential Radiology Ecolabel',href:'https://doi.org/10.1016/j.jacr.2023.11.019',why:'Brings climate-aware measurement tools and reporting concepts into radiology and medical AI.',used:'Core CEDARS framework, lifecycle metrics, Scope structure, and reporting design.'},
      {type:'ML REPORTING FRAMEWORK',year:'2020',authors:['Henderson P','Hu J','Romoff J','Brunskill E','Jurafsky D','Pineau J'],venue:'J Mach Learn Res',title:'Towards the Systematic Reporting of the Energy and Carbon Footprints of Machine Learning',href:'https://jmlr.org/papers/v21/20-312.html',why:'Argues for transparent reporting of energy, carbon, infrastructure, and location rather than isolated performance alone.',used:'AI reporting completeness and provenance principles.'},
      {type:'COMPUTE EFFICIENCY FRAMEWORK',year:'2020',authors:['Schwartz R','Dodge J','Smith NA','Etzioni O'],venue:'Commun ACM',title:'Green AI',href:'https://doi.org/10.1145/3381831',why:'Makes computational efficiency an explicit evaluation dimension alongside model quality.',used:'Compute-efficiency framing and input-size scaling context.'},
      {type:'EVALUATION METHODOLOGY',year:'2024',authors:['Maier-Hein L','Reinke A','Godau P','Tizabi MD','Buettner F','Christodoulou E','Glocker B','Isensee F','Kleesiek J','Kozubek M','Reyes M','Riegler MA','Wiesenfarth M','Kavur AE','Sudre CH','Baumgartner M','Eisenmann M','Heckmann-Nötzel D','Rädsch T','Acion L','Antonelli M','Arbel T','Bakas S','Benis A','Blaschko MB','Cardoso MJ','Cheplygina V','Cimini BA','Collins GS','Farahani K','Ferrer L','Galdran A','van Ginneken B','Haase R','Hashimoto DA','Hoffman MM','Huisman M','Jannin P','Kahn CE','Kainmueller D','Kainz B','Karargyris A','Karthikesalingam A','Kofler F','Kopp-Schneider A','Kreshuk A','Kurc T','Landman BA','Litjens G','Madani A','Maier-Hein K','Martel AL','Mattson P','Meijering E','Menze B','Moons KGM','Müller H','Nichyporuk B','Nickel F','Petersen J','Rajpoot N','Rieke N','Saez-Rodriguez J','Sánchez CI','Shetty S','van Smeden M','Summers RM','Taha AA','Tiulpin A','Tsaftaris SA','Van Calster B','Varoquaux G','Jäger PF'],venue:'Nature Methods',title:'Metrics reloaded: recommendations for image analysis validation',href:'https://doi.org/10.1038/s41592-023-02151-z',why:'Shows how metric choice should follow the actual scientific question rather than convenience.',used:'Conceptual precedent for transparent, task-aligned metric selection.'},
      {type:'PRACTICE RECOMMENDATIONS',year:'2026',authors:['Klontzas ME','Groot Lipman KBW','Akinci D’Antonoli T','Andreychenko A','Cuocolo R','Dietzel M','Gitto S','Huisman H','Santinha J','Vernuccio F','Visser JJ','Huisman M'],venue:'European Radiology',title:'ESR Essentials: common performance metrics in AI—practice recommendations by the European Society of Medical Imaging Informatics',href:'https://doi.org/10.1007/s00330-025-11890-w',why:'Practical guidance for selecting and interpreting radiology AI performance metrics, including task fit and local validation.',used:'Clinical-quality gate and task-aligned metric selection; not an environmental Score input.'},
    ],
  },
];

const JOURNAL_MARKS = {
  'Radiology': {src:'/journal-radiology.png', alt:'Radiology'},
  'J Am Coll Radiol': {src:'/journal-jacr.png', alt:'Journal of the American College of Radiology'},
  'European Radiology': {src:'/journal-european-radiology.png', alt:'European Radiology'},
  'Lancet Planet Health': {src:'/journal-lancet-planetary-health.png', alt:'The Lancet Planetary Health'},
  'Lancet Reg Health West Pac': {src:'/journal-lancet-regional-western-pacific.png', alt:'The Lancet Regional Health – Western Pacific'},
  'Can Assoc Radiol J': {src:'/journal-car.png', alt:'Canadian Association of Radiologists Journal'},
  'MICCAI': {src:'/journal-miccai.png', alt:'MICCAI'},
  'Journal of Industrial Ecology': {src:'/journal-jie.png', alt:'Journal of Industrial Ecology'},
  'arXiv': {src:'/journal-arxiv.png', alt:'arXiv'},
  'Digital Healthcare and Artificial Intelligence': {src:'/source-digital-healthcare-ai-book.png', alt:'Digital Healthcare and Artificial Intelligence'},
  'JAMA Network Open': {src:'/journal-jama-network-open.png', alt:'JAMA Network Open'},
  'Nature Methods': {src:'/journal-nature-methods-cedars-v2.png?v=8x', alt:'Nature Methods'},
  'Commun ACM': {src:'/journal-communications-acm-cedars-v2.png?v=8x', alt:'Communications of the ACM'},
  'J Mach Learn Res': {src:'/journal-jmlr-cedars-v2.png?v=8x', alt:'Journal of Machine Learning Research'},
};

function AuthorList({authors=[]}) {
  const shown = authors.length > 8
    ? [...authors.slice(0,5), '…', authors[authors.length-1]]
    : authors;
  return <div className="evidenceAuthorsFull" title={authors.length>12?authors.join(', '):undefined}>{shown.join(', ')}</div>;
}

function EvidenceCard({card, index, duplicate=false}) {
  const mark=JOURNAL_MARKS[card.venue];
  return (
    <article className="evidenceCard" data-card-index={index}>
      <div className="evidenceCardTopline">
        <div className="evidenceCardMeta"><span>{card.type}</span><div className="evidenceCardVenueLine"><b>{card.year}</b><a className="evidenceVenueSource" href={card.href} target="_blank" rel="noreferrer" tabIndex={duplicate?-1:undefined}>{card.venue} <ExternalLink size={9}/></a></div></div>
        {mark&&<div className="evidenceJournalMark has-logo" aria-label={`${card.venue} journal or venue mark`}><img src={mark.src} alt={mark.alt}/></div>}
      </div>
      <div className="evidenceCardCitation"><AuthorList authors={card.authors} duplicate={duplicate}/></div>
      <h3>{card.title}</h3>
      <div className="evidenceCardWhy"><span>WHY IT MATTERS</span><p>{card.why}</p></div>
      <div className="evidenceCardUse"><span>USED IN CEDARS</span><p>{card.used}</p></div>
      <a className="evidenceReadSource" href={card.href} target="_blank" rel="noreferrer" tabIndex={duplicate?-1:undefined}>Read at source <ExternalLink size={12}/></a>
    </article>
  );
}

function EvidenceCategory({group, pausedAll=false, order=0}) {
  const [active, setActive] = React.useState(0);
  const [pausedLocal, setPausedLocal] = React.useState(false);
  const autoStartedRef = React.useRef(false);
  const Icon = group.icon;
  const card = group.cards[active] || group.cards[0];
  const autoPaused = pausedAll || pausedLocal;

  React.useEffect(()=>{
    if (autoPaused || group.cards.length < 2) return undefined;
    const delay = 9000 + (autoStartedRef.current ? 0 : order * 250);
    const timer = window.setTimeout(()=>{
      autoStartedRef.current = true;
      setActive(current=>(current+1)%group.cards.length);
    }, delay);
    return ()=>window.clearTimeout(timer);
  }, [active, autoPaused, group.cards.length, order]);

  return (
    <section className="evidenceCategoryCard contentSurfaceInset" id={`evidence-${group.key}`} aria-labelledby={`evidence-${group.key}-title`}>
      <header className="evidenceCategoryHeader">
        <div><span><Icon size={15}/>{group.eyebrow}</span><h2 id={`evidence-${group.key}-title`}>{group.title}</h2><p>{group.blurb}</p></div>
        <small aria-live="polite">{String(active+1).padStart(2,'0')} / {String(group.cards.length).padStart(2,'0')}</small>
      </header>
      <div className="evidenceCategoryViewport" aria-live="polite">
        <div className="evidenceCategorySlide" key={`${group.key}-${active}`}>
          <EvidenceCard card={card} index={active}/>
        </div>
      </div>
      <footer className="evidenceCategoryFooter">
        <div className="evidenceNumberNav" role="group" aria-label={`${group.title} sources`}>
          {group.cards.map((source,index)=><button type="button" key={`${source.title}-nav`} className={active===index?'active':''} aria-label={`Show source ${index+1}: ${source.title}`} aria-pressed={active===index} onClick={()=>setActive(index)}>{index+1}</button>)}
        </div>
        <div className="evidenceAutoControls">
          <button type="button" className="evidenceAutoToggle" disabled={pausedAll} aria-pressed={pausedLocal} aria-label={pausedAll?`Auto-advance is paused for all evidence sections`:(pausedLocal?`Resume auto-advance for ${group.title}`:`Pause auto-advance for ${group.title}`)} onClick={()=>setPausedLocal(value=>!value)}>{pausedLocal?<Play size={11}/>:<Pause size={11}/>}<span>{pausedAll?'All paused':pausedLocal?'Resume':'Pause'}</span></button>
          <span className="evidenceSourceCount" aria-hidden="true">{active+1}/{group.cards.length}</span>
        </div>
      </footer>
    </section>
  );
}

export default function EvidencePage({onStart,onMethod}) {
  const [pausedAll, setPausedAll] = React.useState(()=>typeof window!=='undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  return (
    <main className="evidencePage evidenceGalleryPage">
      <section className="evidenceHero contentSurfaceInset">
        <span>EVIDENCE BEHIND CEDARS</span>
        <h1>A reading library for sustainable radiology and medical AI.</h1>
        <p>Curated research and insights on sustainable radiology and medical AI. We welcome suggestions! {onMethod&&<button type="button" className="evidenceInlineMethod" onClick={onMethod}>EcoLabel Method →</button>}</p>

        <div className="evidenceHeroActionRow" aria-label="Evidence page actions">
          <a className="evidenceMethodsTop evidenceHeroAction" href="https://github.com/takinci/cedars/blob/main/sources.md" target="_blank" rel="noreferrer">
            <ExternalLink size={14}/><span>METHODS &amp; SOURCES</span><strong>Open full Methods &amp; Sources</strong>
          </a>
          <button type="button" className="evidencePauseAll evidenceHeroAction evidencePauseAllTop" aria-pressed={pausedAll} onClick={()=>setPausedAll(value=>!value)}>
            {pausedAll?<Play size={14}/>:<Pause size={14}/>}<span>{pausedAll?'Resume auto-advance':'Pause auto-advance'}</span>
          </button>
          <button type="button" className="evidencePrimaryCta evidenceHeroStart" onClick={onStart}>
            <span>READY?</span><strong>Start a CEDARS assessment</strong><ArrowRight size={16}/>
          </button>
        </div>
      </section>

      <div className="evidenceLibraryGrid">
        {GROUPS.map((group,index)=><EvidenceCategory key={group.key} group={group} pausedAll={pausedAll} order={index}/>) }
      </div>
    </main>
  );
}
