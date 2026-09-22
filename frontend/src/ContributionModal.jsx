import React, {useEffect, useRef, useState} from 'react';
import {X, Database, CheckCircle2, AlertTriangle} from 'lucide-react';

const blank = {name:'', institution:'', country:'', role:'', email:'', interests:'', acknowledge:false, contact:false, consent:false};
const TURNSTILE_SCRIPT_ID = 'cedars-turnstile-script';

export default function ContributionModal({open, onClose, endpoint, turnstileSiteKey, buildSnapshot}) {
  const [form, setForm] = useState(blank);
  const [state, setState] = useState({status:'idle', message:''});
  const [turnstileToken, setTurnstileToken] = useState('');
  const [widgetError, setWidgetError] = useState('');
  const turnstileEl = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!open || !turnstileSiteKey || typeof window === 'undefined') return undefined;
    let cancelled = false;
    setWidgetError('');
    const renderWidget = () => {
      if (cancelled || !window.turnstile || !turnstileEl.current || widgetId.current != null) return;
      try {
        const id = window.turnstile.render(turnstileEl.current, {
          sitekey: turnstileSiteKey,
          action: 'cedars-contribution',
          theme: 'light',
          callback: token => { setTurnstileToken(token); setWidgetError(''); },
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': code => {
            setTurnstileToken('');
            const turnstileMessages = {
              '400020':'Turnstile rejected the site key. Confirm VITE_CEDARS_TURNSTILE_SITEKEY exactly matches the public site key for this widget, then redeploy the site.',
              '110200':'This hostname is not allowed for the Turnstile widget. Add cedarsleaf.com (and takinci.github.io if used) to the widget hostnames.',
              '110110':'This Turnstile widget is disabled. Re-enable it in Cloudflare or replace the site key.',
            };
            setWidgetError(turnstileMessages[String(code)] || `Turnstile reported error ${code || 'unknown'}. Check the widget configuration and browser console for details.`);
          },
        });
        if (id == null) setWidgetError('Turnstile could not start. The site key may be invalid.');
        else widgetId.current = id;
      } catch {
        setWidgetError('Turnstile could not start. The site key may be invalid.');
      }
    };

    if (window.turnstile) renderWidget();
    else {
      let script = document.getElementById(TURNSTILE_SCRIPT_ID);
      if (!script) {
        script = document.createElement('script');
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderWidget, {once:true});
      script.addEventListener('error', () => { if (!cancelled) setWidgetError('The Cloudflare Turnstile script could not be loaded. A browser extension, ad blocker, VPN or network filter may be blocking challenges.cloudflare.com.'); }, {once:true});
    }

    return () => {
      cancelled = true;
      setTurnstileToken('');
      if (window.turnstile && widgetId.current != null) {
        try { window.turnstile.remove(widgetId.current); } catch { /* best effort */ }
      }
      widgetId.current = null;
    };
  }, [open, turnstileSiteKey]);

  if (!open) return null;
  const set = (key,val) => setForm(f=>({...f,[key]:val}));

  const submit = async e => {
    e.preventDefault();
    if (!form.consent) return setState({status:'error',message:'Please confirm assessment-sharing consent before submitting.'});
    if (form.contact && !form.email.trim()) return setState({status:'error',message:'Please enter an email address if you would like CEDARS to contact you.'});
    if (!endpoint || !turnstileSiteKey) return setState({status:'error',message:'The research submission service is not configured in this deployment yet. Your assessment has not been transmitted.'});
    if (!turnstileToken) return setState({status:'error',message:'Please complete the anti-spam verification before submitting.'});
    setState({status:'submitting',message:''});
    try {
      const response = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          assessment: buildSnapshot(),
          contributor:{
            name:form.name.trim(), institution:form.institution.trim(), country:form.country.trim(), role:form.role.trim(),
            email:form.email.trim(), interests:form.interests.trim(),
          },
          permissions:{assessmentSharing:true, acknowledgment:!!form.acknowledge, futureContact:!!form.contact},
          consentVersion:'2026-09-20',
          turnstileToken,
        }),
      });
      const body = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(body.error || `Submission failed (${response.status}).`);
      setState({status:'success',message:`Thank you. Your CEDARS contribution was received${body.submissionId ? ` (ID ${body.submissionId})` : ''}.`});
      setForm(blank);
      setTurnstileToken('');
    } catch (err) {
      setState({status:'error',message:err?.message || 'Submission failed. Your assessment was not transmitted.'});
      setTurnstileToken('');
      if (window.turnstile && widgetId.current != null) {
        try { window.turnstile.reset(widgetId.current); } catch { /* best effort */ }
      }
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="contribute-title" style={{position:'fixed',inset:0,zIndex:20,background:'#102710aa',display:'grid',placeItems:'center',padding:18}} onMouseDown={e=>{if(e.target===e.currentTarget) onClose();}}>
      <div style={{width:'min(720px,100%)',maxHeight:'90vh',overflowY:'auto',background:'white',borderRadius:24,padding:24,boxShadow:'0 30px 90px #0005'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
          <Database style={{color:'#2E7D32',flexShrink:0}}/>
          <div style={{flex:1}}>
            <h2 id="contribute-title" style={{margin:'0 0 6px',color:'#1b5e20'}}>Contribute this assessment</h2>
            <p className="note" style={{margin:'0 0 12px',lineHeight:1.55}}>Your CEDARS data normally remains in your browser. Submitting this form is an optional action that sends a copy of the current assessment to the CEDARS research team.</p>
          </div>
          <button aria-label="Close" onClick={onClose} style={{background:'#eef4ee',color:'#455a64',padding:8,borderRadius:12}}><X size={18}/></button>
        </div>

        <div style={{display:'flex',gap:8,background:'#fff8e1',border:'1px solid #ffe082',padding:'10px 12px',borderRadius:12,fontSize:12,color:'#6d4c41',lineHeight:1.45,marginBottom:16}}>
          <AlertTriangle size={16} style={{flexShrink:0,marginTop:1}}/> Do not submit patient names, medical record numbers, dates of birth, clinical records, or other patient-identifiable information.
        </div>

        {state.message && <div style={{display:'flex',gap:8,alignItems:'center',background:state.status==='success'?'#e8f5e9':'#ffebee',color:state.status==='success'?'#1b5e20':'#b71c1c',padding:'10px 12px',borderRadius:12,fontSize:12,marginBottom:14}}>{state.status==='success'?<CheckCircle2 size={16}/>:<AlertTriangle size={16}/>} {state.message}</div>}

        {state.status!=='success' && <form onSubmit={submit}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
            <label>Name <span style={{fontSize:10,color:'#90a4ae'}}>optional</span><input value={form.name} onChange={e=>set('name',e.target.value)} /></label>
            <label>Institution / organization <span style={{fontSize:10,color:'#90a4ae'}}>optional</span><input value={form.institution} onChange={e=>set('institution',e.target.value)} /></label>
            <label>Country <span style={{fontSize:10,color:'#90a4ae'}}>optional</span><input value={form.country} onChange={e=>set('country',e.target.value)} /></label>
            <label>Professional role / title <span style={{fontSize:10,color:'#90a4ae'}}>optional</span><input value={form.role} onChange={e=>set('role',e.target.value)} /></label>
            <label>Email <span style={{fontSize:10,color:'#90a4ae'}}>optional</span><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></label>
          </div>
          <label style={{marginTop:12}}>How would you like to contribute, or what interests you about CEDARS? <span style={{fontSize:10,color:'#90a4ae'}}>optional</span>
            <textarea value={form.interests} onChange={e=>set('interests',e.target.value)} rows="3" style={{padding:12,border:'1px solid #c8e6c9',borderRadius:14,fontFamily:'inherit',resize:'vertical'}} />
          </label>

          <div style={{marginTop:16,display:'grid',gap:10,fontSize:13,color:'#455a64'}}>
            <label style={{display:'flex',flexDirection:'row',alignItems:'flex-start',gap:9,color:'#263238',fontWeight:600}}><input type="checkbox" checked={form.consent} onChange={e=>set('consent',e.target.checked)} style={{marginTop:2}}/> I agree to share a copy of this CEDARS assessment with the CEDARS research team for research, evaluation, and potential future publication. <strong style={{color:'#b71c1c'}}>Required</strong></label>
            <label style={{display:'flex',flexDirection:'row',alignItems:'flex-start',gap:9,color:'#263238',fontWeight:600}}><input type="checkbox" checked={form.acknowledge} onChange={e=>set('acknowledge',e.target.checked)} style={{marginTop:2}}/> I give permission for my name and affiliation to be included in acknowledgments or contributor listings where appropriate.</label>
            <label style={{display:'flex',flexDirection:'row',alignItems:'flex-start',gap:9,color:'#263238',fontWeight:600}}><input type="checkbox" checked={form.contact} onChange={e=>set('contact',e.target.checked)} style={{marginTop:2}}/> CEDARS may contact me about future research, validation, publication, or collaborative activities.</label>
          </div>

          <div style={{marginTop:16,padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:12,background:'#fafafa'}}>
            <div ref={turnstileEl}/>
            {widgetError && <div role="alert" style={{fontSize:12,color:'#b71c1c',marginTop:6,lineHeight:1.45}}>{widgetError}</div>}
            <div style={{fontSize:10,color:'#78909c',marginTop:5}}>Anti-spam verification is provided by Cloudflare Turnstile.</div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18,flexWrap:'wrap'}}>
            <button type="button" className="download" onClick={onClose} style={{background:'#607d66'}}>Cancel</button>
            <button type="submit" disabled={state.status==='submitting'} style={state.status==='submitting'?{opacity:.65,cursor:'wait'}:undefined}>{state.status==='submitting'?'Submitting…':'Contribute assessment'}</button>
          </div>
        </form>}
      </div>
    </div>
  );
}
