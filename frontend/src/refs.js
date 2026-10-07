// References cited inline in the interface. Each entry carries the DOI (preferred) or canonical
// URL and the date it was verified. `sources.md` remains the methods document for the defaults;
// this registry exists so that every citation shown to a visitor links straight to the source.
//
// Keep ids stable — they are referenced from JSX via <Ref id="..."/> and <ReferenceList ids={[...]}/>.
export const REFS = {
  'doo-jacr-2024': {
    authors: 'Doo FX, Parekh VS, Kanhere A, Savani D, Tejani AS, Sapkota A, Yi PH',
    title: 'Evaluation of climate-aware metrics tools for radiology informatics and artificial intelligence: toward a potential radiology ecolabel',
    venue: 'J Am Coll Radiol', year: 2024, cite: '2024;21:239–247',
    doi: '10.1016/j.jacr.2023.11.019', verified: '2026-10-04',
  },
  'doo-jacr-cloud-2024': {
    authors: 'Doo FX, Kulkarni P, Siegel EL, Toland M, Yi PH, Carlos RC, Parekh VS',
    title: 'Economic and environmental costs of cloud technologies for medical imaging and radiology artificial intelligence',
    venue: 'J Am Coll Radiol', year: 2024, cite: '2024;21:248–256',
    doi: '10.1016/j.jacr.2023.11.011', verified: '2026-10-04',
  },
  'doo-radiology-llm-2024': {
    authors: 'Doo FX, Savani D, Kanhere A, Carlos RC, Joshi A, Yi PH, Parekh VS',
    title: 'Optimal Large Language Model Characteristics to Balance Accuracy and Energy Use for Sustainable Medical Applications',
    venue: 'Radiology', year: 2024, cite: '2024;312(2):e240320',
    doi: '10.1148/radiol.240320', verified: '2026-10-06',
  },
  'jia-eurradiol-2026': {
    authors: 'Jia Y, Deng M, Burger R, Sheard S, Hanneman K, Drucker Iarovich M, Sala E, Avesani G, Illing RO, Rockall AG',
    title: 'Greenhouse gas emissions due to long-term data storage of CT with reformats and strategies for mitigation',
    venue: 'Eur Radiol', year: 2026, cite: '2026;36:2186–2197',
    doi: '10.1007/s00330-025-12023-z', verified: '2026-10-04',
  },
  'tzanis-maistro-2025': {
    authors: 'Tzanis E, Klontzas ME',
    title: 'mAIstro: an open-source multi-agent system for automated end-to-end development of radiomics and deep learning models for medical imaging',
    venue: 'Eur J Radiol Artif Intell', year: 2025, cite: '2025;4:100044',
    doi: '10.1016/j.ejrai.2025.100044', verified: '2026-10-04',
  },
  'chambon-roentgen-2022': {
    authors: 'Chambon P, Bluethgen C, Delbrouck J-B, et al.',
    title: 'RoentGen: vision-language foundation model for chest X-ray generation',
    venue: 'arXiv', year: 2022, cite: '2022; arXiv:2211.12737',
    doi: '10.48550/arXiv.2211.12737', verified: '2026-10-04',
  },
  'mongan-claim-2020': {
    authors: 'Mongan J, Moy L, Kahn CE Jr',
    title: 'Checklist for Artificial Intelligence in Medical Imaging (CLAIM): a guide for authors and reviewers',
    venue: 'Radiol Artif Intell', year: 2020, cite: '2020;2:e200029',
    doi: '10.1148/ryai.2020200029', verified: '2026-10-04',
  },
  'li-thirsty-2023': {
    authors: 'Li P, Yang J, Islam MA, Ren S',
    title: 'Making AI less "thirsty": uncovering and addressing the secret water footprint of AI models',
    venue: 'arXiv', year: 2023, cite: '2023; arXiv:2304.03271',
    doi: '10.48550/arXiv.2304.03271', verified: '2026-10-04',
  },
  'heye-radiology-2020': {
    authors: 'Heye T, Knoerl R, Wehrle T, et al.',
    title: 'The energy consumption of radiology: energy- and cost-saving opportunities for CT and MRI operation',
    venue: 'Radiology', year: 2020, cite: '2020;295:593–605',
    doi: '10.1148/radiol.2020192084', verified: '2026-10-04',
  },
  'ecologits-joss': {
    authors: 'Rincé S, et al. (GenAI Impact)',
    title: 'EcoLogits: evaluating the environmental impacts of generative AI',
    venue: 'J Open Source Softw', year: 2025, cite: 'JOSS 10(107):7471',
    doi: '10.21105/joss.07471', verified: '2026-10-04',
  },
  'gsf-sci-iso': {
    authors: 'Green Software Foundation',
    title: 'Software Carbon Intensity (SCI) specification',
    venue: 'ISO/IEC 21031:2024', year: 2024, cite: 'ISO/IEC 21031:2024',
    url: 'https://sci.greensoftware.foundation/', verified: '2026-10-04',
  },
  'codecarbon': {
    authors: 'mlco2/codecarbon contributors',
    title: 'CodeCarbon — track compute emissions',
    venue: 'GitHub', year: 2026, cite: 'v3.2.9, July 2026',
    url: 'https://github.com/mlco2/codecarbon', verified: '2026-10-04',
  },
  'zeus': {
    authors: 'ML.ENERGY Initiative',
    title: 'Zeus — deep learning energy measurement and optimization',
    venue: 'ml.energy', year: 2025, cite: 'PyTorch ecosystem project',
    url: 'https://ml.energy/zeus', verified: '2026-10-04',
  },
  'carbontracker': {
    authors: 'Anthony LFW, Kanding B, Selvan R',
    title: 'Carbontracker: tracking and predicting the carbon footprint of training deep learning models',
    venue: 'arXiv', year: 2020, cite: '2020; arXiv:2007.03051',
    doi: '10.48550/arXiv.2007.03051', verified: '2026-10-04',
  },
  'green-algorithms': {
    authors: 'Lannelongue L, Grealey J, Inouye M',
    title: 'Green Algorithms: quantifying the carbon footprint of computation',
    venue: 'arXiv', year: 2020, cite: '2020; arXiv:2007.07610 (journal version: Adv Sci 2021)',
    doi: '10.48550/arXiv.2007.07610', verified: '2026-10-04',
  },
  'cloud-carbon-footprint': {
    authors: 'Thoughtworks',
    title: 'Cloud Carbon Footprint — open-source cloud emissions measurement',
    venue: 'cloudcarbonfootprint.org', year: 2026, cite: 'open source',
    url: 'https://www.cloudcarbonfootprint.org/', verified: '2026-10-04',
  },
  'scaphandre': {
    authors: 'Hubblo',
    title: 'Scaphandre — energy consumption metrology agent',
    venue: 'GitHub', year: 2026, cite: 'open source',
    url: 'https://github.com/hubblo-org/scaphandre', verified: '2026-10-04',
  },
  'ai-energy-score': {
    authors: 'Salesforce, Hugging Face, Cohere, Carnegie Mellon University',
    title: 'AI Energy Score — benchmark and 1–5 star label for AI model energy efficiency',
    venue: 'Hugging Face', year: 2025, cite: 'launched Feb 2025',
    url: 'https://www.salesforce.com/news/stories/ai-energy-score/', verified: '2026-10-04',
  },
  'boavizta': {
    authors: 'Boavizta',
    title: 'Boavizta API — embodied environmental impacts of hardware',
    venue: 'GitHub', year: 2026, cite: 'open source',
    url: 'https://github.com/Boavizta/boaviztapi', verified: '2026-10-04',
  },
  'electricity-maps': {
    authors: 'Electricity Maps',
    title: 'Carbon intensity of electricity by zone',
    venue: 'electricitymaps.com', year: 2026, cite: 'live and annual averages',
    url: 'https://app.electricitymaps.com/', verified: '2026-10-04',
  },
  'jegham-llm-2025': {
    authors: 'Jegham N, Abdelatti M, Elmoubarki L, Hendawi A',
    title: 'How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference',
    venue: 'arXiv', year: 2025, cite: '2025; arXiv:2505.09598',
    doi: '10.48550/arXiv.2505.09598', verified: '2026-10-04',
  },
  'fernandez-llm-energy-2025': {
    authors: 'Fernandez J, Na C, Tiwari V, Bisk Y, Luccioni S, Strubell E',
    title: 'Energy Considerations of Large Language Model Inference and Efficiency Optimizations',
    venue: 'arXiv', year: 2025, cite: '2025; arXiv:2504.17674',
    doi: '10.48550/arXiv.2504.17674', verified: '2026-10-04',
  },
  'oviedo-inference-2025': {
    authors: 'Oviedo F, Kazhamiaka F, Choukse E, Kim A, Luers A, Nakagawa M, Bianchini R, Lavista Ferres JM',
    title: 'Energy Use of AI Inference: Efficiency Pathways and Test-Time Compute',
    venue: 'arXiv', year: 2025, cite: '2025; arXiv:2509.20241',
    doi: '10.48550/arXiv.2509.20241', verified: '2026-10-04',
  },
  'kpodzro-haip-2026': {
    authors: 'Kpodzro S, Kim JY, Hasan A, Thomas C, et al.',
    title: 'A Collaborative Best Practice Guide for Promoting AI Vendor Transparency in Health Care — The HAIP AI Vendor Disclosure Framework',
    venue: 'NEJM AI', year: 2026, cite: '2026;3(5)',
    doi: '10.1056/AIp2500985', verified: '2026-10-04',
  },
  'strubell-nlp-2019': {
    authors: 'Strubell E, Ganesh A, McCallum A',
    title: 'Energy and Policy Considerations for Deep Learning in NLP',
    venue: 'ACL', year: 2019, cite: '2019:3645–3650',
    doi: '10.18653/v1/P19-1355', verified: '2026-10-07',
  },
  'schwartz-green-ai-2020': {
    authors: 'Schwartz R, Dodge J, Smith NA, Etzioni O',
    title: 'Green AI',
    venue: 'Commun ACM', year: 2020, cite: '2020;63(12):54–63',
    doi: '10.1145/3381831', verified: '2026-10-07',
  },
  'henderson-reporting-2020': {
    authors: 'Henderson P, Hu J, Romoff J, Brunskill E, Jurafsky D, Pineau J',
    title: 'Towards the Systematic Reporting of the Energy and Carbon Footprints of Machine Learning',
    venue: 'J Mach Learn Res', year: 2020, cite: '2020;21(248):1–43',
    url: 'https://www.jmlr.org/papers/v21/20-312.html', verified: '2026-10-07',
  },
  'patterson-4ms-2022': {
    authors: 'Patterson D, Gonzalez J, Hölzle U, et al.',
    title: 'The Carbon Footprint of Machine Learning Training Will Plateau, Then Shrink',
    venue: 'Computer', year: 2022, cite: '2022;55(7):18–28',
    doi: '10.1109/MC.2022.3148714', verified: '2026-10-07',
  },
  'hanafy-war-efficiencies-2023': {
    authors: 'Hanafy WA, Bostandoost R, Bashir N, Irwin D, Hajiesmaili M, Shenoy P',
    title: 'The War of the Efficiencies: Understanding the Tension between Carbon and Energy Optimization',
    venue: 'arXiv', year: 2023, cite: '2023; arXiv:2306.16948',
    doi: '10.48550/arXiv.2306.16948', verified: '2026-10-07',
  },
  'wright-efficiency-not-enough-2023': {
    authors: 'Wright D, Igel C, Samuel G, Selvan R',
    title: 'Efficiency is Not Enough: A Critical Perspective of Environmentally Sustainable AI',
    venue: 'arXiv', year: 2023, cite: '2023; arXiv:2309.02065',
    doi: '10.48550/arXiv.2309.02065', verified: '2026-10-07',
  },
  'dietrich-training-policy-2026': {
    authors: 'Dietrich N, McShannon D, Huisman M, Doo FX, Hanneman K',
    title: 'Effect of Deep Learning Training Policy on Greenhouse Gas Emissions and Carbon Efficiency for Chest Radiograph Classification',
    venue: 'Can Assoc Radiol J', year: 2026, cite: '2026; online ahead of print',
    doi: '10.1177/08465371261475319', verified: '2026-10-07',
  },
  'nghiem-doo-sustainable-ai-2026': {
    authors: 'Nghiem D, Dogra S, Doo FX',
    title: 'Sustainability in Clinical AI',
    venue: 'Digital Healthcare and Artificial Intelligence', year: 2026, cite: 'Chapter 14',
    doi: '10.1201/9781032709956-14', verified: '2026-10-07',
  },
  'doo-policy-trustworthy-ai-2026': {
    authors: 'Doo FX, Davis MA, Poff J, Lui YW, Haines K, Towbin AJ',
    title: 'Alignment of Policy, Practice, and Patient Safety for Trustworthy AI in Radiology',
    venue: 'Radiol Artif Intell', year: 2026, cite: '2026 Jul;8(4):e250982 · PMID 42200797 · PMCID PMC13349408',
    doi: '10.1148/ryai.250982', pmid: '42200797', pmcid: 'PMC13349408', verified: '2026-10-07',
  },
  'owid-ci': {
    authors: 'Our World in Data',
    title: 'Carbon intensity of electricity generation',
    venue: 'ourworldindata.org', year: 2026, cite: 'annual, by country',
    url: 'https://ourworldindata.org/grapher/carbon-intensity-electricity', verified: '2026-10-04',
  },
};

export const refUrl = ref => ref.doi ? `https://doi.org/${ref.doi}` : ref.url;

// Short "Author, Venue Year" form for tooltips and the chooser cards.
export const refShort = id => {
  const r = REFS[id]; if (!r) return id;
  const first = r.authors.split(',')[0].trim();
  return `${first}${r.authors.includes(',') ? ' et al.' : ''}, ${r.venue} ${r.year}`;
};
