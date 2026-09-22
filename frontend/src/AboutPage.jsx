import React from 'react';
import {TriangleAlert, Users} from 'lucide-react';

import tugbaPhoto from './assets/team/tugba-akinci-dantonoli.webp';
import janPhoto from './assets/team/jan-vosshenrich.webp';
import ghadaPhoto from './assets/team/ghada-zamzmi.webp';
import michailPhoto from './assets/team/michail-klontzas.webp';
import wenJengPhoto from './assets/team/wen-jeng-lee.webp';
import hamedPhoto from './assets/team/hamed-asadi.webp';
import rachelPhoto from './assets/team/rachel-gerson.webp';
import juliaPhoto from './assets/team/julia-schoen.webp';
import martinPhoto from './assets/team/martin-segeroth.webp';
import elmarPhoto from './assets/team/elmar-merkle.webp';
import florencePhoto from './assets/team/florence-doo.webp';

const PEOPLE = [
  {name:"Tugba Akinci D’Antonoli", affiliations:['EuSoMII'], orcid:'0000-0002-7237-711X', image:tugbaPhoto, position:'center', lead:true},
  {name:'Florence X. Doo', affiliations:['ACR','RSNA'], orcid:'0000-0001-6519-5222', image:florencePhoto, position:'center 24%', lead:true},
  {name:'Jan Vosshenrich', affiliations:['ESR'], orcid:'0000-0003-3323-8472', image:janPhoto},
  {name:'Ghada Zamzmi', affiliations:['MICCAI'], orcid:'0000-0003-4723-5539', image:ghadaPhoto},
  {name:'Michail Ε. Klontzas', affiliations:['EuSoMII'], orcid:'0000-0003-2731-933X', image:michailPhoto, position:'center 18%'},
  {name:'Wen-Jeng Lee', affiliations:['AOSR'], orcid:'0000-0003-3267-4811', image:wenJengPhoto, position:'center 15%'},
  {name:'Hamed Asadi', affiliations:['RANZCR'], orcid:'0000-0003-2475-9727', image:hamedPhoto, position:'center 22%'},
  {name:'Rachel Gerson', affiliations:['ACR'], orcid:'0009-0007-0986-5536', image:rachelPhoto, position:'center 18%'},
  {name:'Julia Schoen', affiliations:['ACR','RSNA'], orcid:'0000-0003-0679-3446', image:juliaPhoto},
  {name:'Martin Segeroth', affiliations:['Independent Researcher'], orcid:'0000-0001-7820-2778', image:martinPhoto, position:'center 18%'},
  {name:'Elmar Merkle', affiliations:['RSNA'], orcid:'0000-0001-6894-0507', image:elmarPhoto, position:'center 18%'},
];

function OrcidLink({orcid, name}) {
  if (!orcid) return null;
  return (
    <a
      className="orcidBadge"
      href={`https://orcid.org/${orcid}`}
      target="_blank"
      rel="noreferrer"
      aria-label={`${name} ORCID ${orcid}`}
      title={`ORCID ${orcid}`}
    >
      <span aria-hidden="true">iD</span>
    </a>
  );
}

function AffiliationBadges({affiliations}) {
  return (
    <div className="personAffiliations">
      {affiliations.map(a => <span key={a}>{a}</span>)}
    </div>
  );
}

function PersonCard({person}) {
  if (person.lead) {
    return (
      <article className="collaboratorCard lead">
        <img src={person.image} alt={`${person.name} portrait`} style={{objectPosition:person.position || 'center 20%'}}/>
        <div>
          <div className="collaboratorNameRow"><div className="collaboratorName">{person.name}</div><OrcidLink orcid={person.orcid} name={person.name}/></div>
          <div className="collaboratorRole">CEDARS Lead</div>
          <AffiliationBadges affiliations={person.affiliations}/>
        </div>
      </article>
    );
  }
  return (
    <article className="collaboratorCard">
      <img src={person.image} alt={`${person.name} portrait`} style={{objectPosition:person.position || 'center 20%'}}/>
      <div className="collaboratorNameRow"><div className="collaboratorName">{person.name}</div><OrcidLink orcid={person.orcid} name={person.name}/></div>
      <AffiliationBadges affiliations={person.affiliations}/>
    </article>
  );
}

export default function AboutPage() {
  const leads = PEOPLE.filter(p => p.lead);
  const collaborators = PEOPLE.filter(p => !p.lead);
  return (
    <main>
      <h1 style={{fontSize:42,lineHeight:1.08,margin:'0 0 12px'}}>About CEDARS</h1>
      <p className="note" style={{fontSize:16,maxWidth:880,lineHeight:1.65,marginBottom:18}}>
        CEDARS is an international collaborative effort advancing transparent, reproducible assessment of environmental sustainability in radiology, clinical AI, and medical imaging informatics.
      </p>
      <div className="affiliationNotice">
        <TriangleAlert size={22} aria-hidden="true" />
        <div><strong>Affiliation note.</strong> Affiliations are provided for identification only and do not imply organizational review, endorsement, sponsorship, or official participation by the organizations listed.</div>
      </div>

      <section className="collaborativeSection">
        <div className="collaborativeHeading">
          <Users size={22}/>
          <div>
            <h2>CEDARS Collaborative</h2>
          </div>
        </div>
        <div className="leadGrid">
          {leads.map(person => <PersonCard key={person.name} person={person}/>) }
        </div>
        <div className="leadDivider" aria-hidden="true" />
        <div className="collaboratorGrid">
          {collaborators.map(person => <PersonCard key={person.name} person={person}/>) }
        </div>
      </section>
    </main>
  );
}
