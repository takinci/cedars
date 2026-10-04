import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {ExternalLink as ExtIcon} from 'lucide-react';
import {REFS, refUrl} from './refs.js';

// ── External-link notice ────────────────────────────────────────────────────
// Every link that leaves cedarsleaf.com goes through <ExternalLink>. The first click in a visit
// shows a short notice (what will open, that nothing from the assessment is sent); the visitor
// can suppress it for the rest of the visit. Nothing is stored beyond sessionStorage.
const SESSION_KEY = 'cedars.extlink.skipNotice';
const Ctx = createContext({open: () => {}});

function readSkip() {
  try { return typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}
function writeSkip(v) {
  try { if (typeof window !== 'undefined') window.sessionStorage.setItem(SESSION_KEY, v ? '1' : '0'); } catch { /* ignore */ }
}

export function ExternalLinkProvider({children}) {
  const [pending, setPending] = useState(null);   // {href}
  const [skip, setSkip] = useState(readSkip);
  const [dontAsk, setDontAsk] = useState(false);
  const open = useCallback(href => {
    if (readSkip()) { window.open(href, '_blank', 'noopener,noreferrer'); return; }
    setDontAsk(false); setPending({href});
  }, []);
  const proceed = () => {
    if (dontAsk) { writeSkip(true); setSkip(true); }
    window.open(pending.href, '_blank', 'noopener,noreferrer');
    setPending(null);
  };
  const value = useMemo(() => ({open, skip}), [open, skip]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {pending && (
        <div role="dialog" aria-modal="true" aria-labelledby="extlink-title"
          style={{position:'fixed',inset:0,zIndex:30,background:'#102710aa',display:'grid',placeItems:'center',padding:18}}
          onMouseDown={e=>{if(e.target===e.currentTarget) setPending(null);}}>
          <div style={{width:'min(440px, 100%)',background:'#fff',border:'1px solid #c8e6c9',borderRadius:16,padding:'22px 24px',boxSizing:'border-box',display:'flex',flexDirection:'column',gap:12,boxShadow:'0 12px 32px rgba(0,0,0,0.18)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <ExtIcon size={20} style={{color:'#2E7D32'}}/>
              <h2 id="extlink-title" style={{margin:0,fontSize:17}}>You are leaving CEDARS</h2>
            </div>
            <p className="note" style={{margin:0,fontSize:13}}>This link opens an external site in a new tab:</p>
            <div style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',fontSize:12,background:'#f4f7f5',border:'1px solid #e0efe2',borderRadius:8,padding:'10px 12px',wordBreak:'break-all'}}>{pending.href}</div>
            <p className="note" style={{margin:0,fontSize:12}}>CEDARS does not control external content. Nothing from your assessment is sent to the site you are visiting.</p>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#455a64'}}>
              <input type="checkbox" checked={dontAsk} onChange={e=>setDontAsk(e.target.checked)} style={{accentColor:'#2E7D32'}}/>
              Don't show this again during this visit
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
              <button type="button" className="download" onClick={()=>setPending(null)}>Stay here</button>
              <button type="button" onClick={proceed}>Open link</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function ExternalLink({href, children, title, style, className}) {
  const {open} = useContext(Ctx);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={className}
      style={{color:'#2E7D32',...style}}
      onClick={e=>{ e.preventDefault(); open(href); }}>
      {children}<ExtIcon size={10} aria-hidden="true" style={{marginLeft:3,verticalAlign:'-1px'}}/>
    </a>
  );
}

// ── Inline citations ────────────────────────────────────────────────────────
// <Ref id="doo-jacr-2024"/> renders a superscript number; the number is the id's 1-based position
// in the `ids` list given to the nearest <ReferenceList>. Pass the same `ids` to both via the
// `order` prop so the numbering is stable on a page.
export function Ref({id, order}) {
  const n = (order || []).indexOf(id) + 1;
  const r = REFS[id];
  const label = r ? `${r.authors.split(',')[0]} et al., ${r.venue} ${r.year}` : id;
  return <sup title={label} style={{fontSize:10,color:'#2E7D32',fontWeight:700,marginLeft:1}}>{n > 0 ? n : '?'}</sup>;
}

export function ReferenceList({ids, compact = false}) {
  return (
    <div className="note" style={{fontSize:11,lineHeight:1.6,borderTop:'1px solid #c8e6c9',paddingTop:10,marginTop:14}}>
      <strong style={{color:'#1b3a22'}}>References</strong>
      <span> · external links open in a new tab after a short notice</span>
      <ol style={{margin:'6px 0 0',paddingLeft:18}}>
        {ids.map(id => {
          const r = REFS[id]; if (!r) return <li key={id}>{id}</li>;
          const url = refUrl(r);
          const linkText = r.doi ? `doi:${r.doi}` : url.replace(/^https?:\/\//,'').replace(/\/$/,'');
          return (
            <li key={id}>
              {compact ? `${r.authors.split(',')[0]} et al. ` : `${r.authors}. ${r.title}. `}
              <em>{r.venue}</em> {r.cite}. <ExternalLink href={url}>{linkText}</ExternalLink>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
