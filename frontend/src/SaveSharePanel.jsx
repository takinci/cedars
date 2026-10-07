import React, {useRef, useState} from 'react';
import {Save, Download, Upload, Share2, Database, Trash2} from 'lucide-react';

const buttonStyle = {justifyContent:'center',minHeight:44};

export default function SaveSharePanel({
  localSavedAt, status, onSaveLocal, onRestoreLocal, onClearLocal, onDownload,
  onOpenFile, onCopyLink, linkCopied, onContribute, contributionConfigured,
}) {
  const inputRef = useRef(null);
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);
  const copyShareableAssessmentLink = () => { setShareConfirmOpen(false); onCopyLink(); };

  return (
    <section id="save-share" className="reportShareSection">
      <p className="eyebrow" style={{marginTop:0}}>3 · Preserve or share</p>
      <h2>Preserve or share your assessment</h2>
      <p className="note reportShareIntro">Saving, transferring, and sharing are separate choices. Normal CEDARS use stays browser-local; research participation is optional and separated below.</p>

      {status && <div style={{background:status.type==='error'?'#ffebee':'#e8f5e9',color:status.type==='error'?'#b71c1c':'#1b5e20',borderRadius:12,padding:'9px 12px',fontSize:12,marginBottom:14}}>{status.text}</div>}

      <div className="reportShareGroup">
        <div className="reportShareGroupHeading"><span>PRESERVE YOUR ASSESSMENT</span><h3>Keep a working or portable copy</h3></div>
        <div className="reportShareGrid two">
          <div className="reportShareCard">
            <div className="reportShareCardTitle"><Save size={18}/> Save on this device</div>
            <p>Stores a working copy in this browser only. It may disappear if browser data is cleared, private/incognito mode is used, or you switch device/browser.</p>
            <button onClick={onSaveLocal} style={buttonStyle}><Save size={15}/> Save on this device</button>
            {localSavedAt && <div className="reportShareSaved">Saved copy: {new Date(localSavedAt).toLocaleString()}<div><button className="download" onClick={onRestoreLocal}>Restore saved copy</button><button className="download" onClick={onClearLocal}><Trash2 size={12}/> Delete</button></div></div>}
          </div>
          <div className="reportShareCard">
            <div className="reportShareCardTitle"><Download size={18}/> Complete CEDARS file</div>
            <p>Downloads the complete portable assessment, including the AI model inventory, Department local-use configurations, accounting choices, provenance, and reporting state. It is processed locally and is the preferred way to archive or transfer a full assessment.</p>
            <div className="reportShareActions"><button onClick={onDownload} style={buttonStyle}><Download size={15}/> Download CEDARS file</button><button className="download" onClick={()=>inputRef.current?.click()} style={buttonStyle}><Upload size={15}/> Open CEDARS file</button></div>
            <input ref={inputRef} type="file" accept=".json,.cedars.json,application/json" onChange={e=>{const f=e.target.files?.[0]; if(f) onOpenFile(f); e.target.value='';}} style={{display:'none'}}/>
          </div>
        </div>
      </div>

      <div className="reportShareGroup">
        <div className="reportShareGroupHeading"><span>SHARE WITH OTHERS</span><h3>Copy a shareable CEDARS assessment link</h3></div>
        <div className="reportShareCard reportShareLinkCard">
          <div className="reportShareCardTitle"><Share2 size={18}/> Shareable CEDARS assessment link</div>
          <p>Reopens the core calculator/current AI-model configuration and supported CEDARS reference candidates. Custom candidate edits, free-text comparison notes, and the complete multi-model Department assessment require a downloaded CEDARS file. Nothing is published or sent automatically.</p>
          <button onClick={()=>setShareConfirmOpen(true)} style={buttonStyle}><Share2 size={15}/>{linkCopied?'Link copied':'Copy shareable CEDARS assessment link'}</button>
        </div>
      </div>

      <div className="reportResearchParticipation">
        <div className="reportResearchIcon"><Database size={20}/></div>
        <div><span>OPTIONAL RESEARCH PARTICIPATION</span><h3>Contribute a copy to CEDARS research</h3><p>Separate from saving or sharing. CEDARS normally keeps assessment data in your browser; this action sends a copy only after you review the submission and consent choices.</p></div>
        <div><button onClick={onContribute} disabled={!contributionConfigured} style={!contributionConfigured?{...buttonStyle,opacity:.55,cursor:'not-allowed'}:buttonStyle}><Database size={15}/> Contribute this assessment</button>{!contributionConfigured && <small>Research contribution will activate after the project team configures the submission service.</small>}</div>
      </div>

      {shareConfirmOpen && (
        <div role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget) setShareConfirmOpen(false);}} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(20,35,25,.42)',display:'grid',placeItems:'center',padding:18}}>
          <div role="dialog" aria-modal="true" aria-labelledby="share-link-title" style={{width:'min(560px,100%)',background:'white',borderRadius:20,padding:22,boxShadow:'0 24px 80px rgba(0,0,0,.22)',border:'1px solid #dce9dc'}}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:10}}><Share2 size={20} style={{color:'#2E7D32'}}/><h3 id="share-link-title" style={{margin:0,color:'#1b5e20'}}>Copy a shareable CEDARS assessment link?</h3></div>
            <p style={{margin:'0 0 10px',fontSize:13,lineHeight:1.6,color:'#455a64'}}>This URL carries the core calculator/current AI-model configuration and supported CEDARS reference candidates. Custom candidate edits, free-text comparison notes, the complete Clinical AI inventory, and other full-assessment fields remain in the complete CEDARS file. CEDARS does not publish or send the link automatically.</p>
            <p style={{margin:'0 0 18px',fontSize:12,lineHeight:1.55,color:'#607d66'}}>Personal details, email addresses, and contribution-consent information are not included.</p>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}><button className="download" onClick={()=>setShareConfirmOpen(false)} style={{minHeight:40}}>Cancel</button><button onClick={copyShareableAssessmentLink} style={{minHeight:40}}><Share2 size={15}/> Copy assessment link</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
