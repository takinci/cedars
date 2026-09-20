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

const LEADS = [
  {name:"Tugba Akinci D’Antonoli", affiliations:['Independent Researcher'], image:tugbaPhoto, position:'center'},
  {name:'Florence X. Doo', affiliations:['ACR','RSNA'], image:florencePhoto, position:'center 24%'},
];

const COLLABORATORS = [
  {name:'Jan Vosshenrich', affiliations:['ESR'], image:janPhoto},
  {name:'Ghada Zamzmi', affiliations:['MICCAI'], image:ghadaPhoto},
  {name:'Michail Ε. Klontzas', affiliations:['EuSoMII'], image:michailPhoto, position:'center 18%'},
  {name:'Wen-Jeng Lee', affiliations:['AOSR'], image:wenJengPhoto, position:'center 15%'},
  {name:'Hamed Asadi', affiliations:['RANZCR'], image:hamedPhoto, position:'center 22%'},
  {name:'Rachel Gerson', affiliations:['ACR'], image:rachelPhoto, position:'center 18%'},
  {name:'Julia Schoen', affiliations:['ACR','RSNA'], image:juliaPhoto},
  {name:'Martin Segeroth', affiliations:['Independent Researcher'], image:martinPhoto, position:'center 18%'},
  {name:'Elmar Merkle', affiliations:['ESR'], image:elmarPhoto, position:'center 18%'},
];

function AffiliationBadges({affiliations}) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
      {affiliations.map(a => (
        <span key={a} style={{background:'#e8f5e9',color:'#1b5e20',borderRadius:14,padding:'4px 9px',fontSize:11,fontWeight:700}}>{a}</span>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <main>
      <p className="eyebrow">CEDARS Collaborative</p>
      <h1 style={{fontSize:42,lineHeight:1.08,margin:'0 0 12px'}}>About CEDARS</h1>
      <p className="note" style={{fontSize:16,maxWidth:880,lineHeight:1.65,marginBottom:18}}>
        CEDARS is an international collaborative effort advancing transparent, reproducible assessment of environmental sustainability in radiology, clinical AI, and medical imaging informatics.
      </p>
      <div style={{display:'flex',alignItems:'flex-start',gap:12,background:'#fff8e1',border:'1px solid #f2c94c',borderRadius:18,padding:'14px 18px',color:'#455a64',fontSize:13,lineHeight:1.55,marginBottom:30,maxWidth:980}}>
        <TriangleAlert size={22} style={{color:'#b7791f',flex:'0 0 auto',marginTop:1}} aria-hidden="true" />
        <div><strong style={{color:'#7a5a00'}}>Affiliation note.</strong> Affiliations are provided for identification only and do not imply organizational review, endorsement, sponsorship, or official participation by the organizations listed.</div>
      </div>

      <section style={{padding:24,marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
          <Users size={22} style={{color:'#2E7D32'}}/>
          <h2 style={{margin:0,color:'#1b5e20'}}>CEDARS Leads</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:22,maxWidth:920,margin:'0 auto'}}>
          {LEADS.map(person => (
            <article key={person.name} style={{display:'grid',gridTemplateColumns:'172px 1fr',gap:22,alignItems:'center',border:'1px solid #dce9dc',borderTop:'4px solid #2E7D32',borderRadius:18,padding:18,background:'#fff',boxShadow:'0 8px 26px #1b5e200d'}}>
              <img src={person.image} alt={`${person.name} portrait`} style={{width:172,height:172,borderRadius:18,objectFit:'cover',objectPosition:person.position || 'center 20%',background:'#f4f7f4'}}/>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:'#263238',lineHeight:1.25}}>{person.name}</div>
                <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:800,color:'#78909c',marginTop:5}}>CEDARS Lead</div>
                <AffiliationBadges affiliations={person.affiliations}/>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{padding:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
          <Users size={22} style={{color:'#2E7D32'}}/>
          <h2 style={{margin:0,color:'#1b5e20'}}>CEDARS Collaborative</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
          {COLLABORATORS.map(person => (
            <article key={person.name} style={{border:'1px solid #e0ebe0',borderRadius:16,padding:14,background:'#fff',minHeight:250}}>
              <img src={person.image} alt={`${person.name} portrait`} style={{width:'100%',aspectRatio:'1 / 1',borderRadius:12,objectFit:'cover',objectPosition:person.position || 'center 20%',background:'#f4f7f4',display:'block',marginBottom:14}}/>
              <div style={{fontSize:16,fontWeight:800,color:'#263238',lineHeight:1.3}}>{person.name}</div>
              <AffiliationBadges affiliations={person.affiliations}/>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
