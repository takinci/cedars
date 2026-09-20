import React, {useRef, useState} from 'react';
import {Save, Download, Upload, Share2, Database, Trash2} from 'lucide-react';

const buttonStyle = {justifyContent:'center',minHeight:44};

export default function SaveSharePanel({
  localSavedAt,
  status,
  onSaveLocal,
  onRestoreLocal,
  onClearLocal,
  onDownload,
  onOpenFile,
  onCopyLink,
  linkCopied,
  onContribute,
  contributionConfigured,
}) {
  const inputRef = useRef(null);
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);

  const createReproducibleLink = () => {
    setShareConfirmOpen(false);
    onCopyLink();
  };

  return (
    <section id="save-share" style={{scrollMarginTop:100,marginTop:26}}>
      <p className="eyebrow" style={{marginTop:0}}>Save &amp; Share</p>
      <h2 style={{margin:'0 0 8px',color:'#1b5e20'}}>Preserve your assessment without an account</h2>
      <p className="note" style={{marginTop:0,maxWidth:900,lineHeight:1.55}}>
        Local saving and CEDARS files stay on your device. Research contribution is a separate, explicit action.
      </p>

      {status && <div style={{background:status.type==='error'?'#ffebee':'#e8f5e9',color:status.type==='error'?'#b71c1c':'#1b5e20',borderRadius:12,padding:'9px 12px',fontSize:12,marginBottom:14}}>{status.text}</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:14}}>
        <div style={{border:'1px solid #e0e0e0',borderRadius:18,padding:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,color:'#263238',marginBottom:8}}><Save size={18} style={{color:'#2E7D32'}}/> Save on this device only</div>
          <p className="note" style={{fontSize:12,lineHeight:1.5,minHeight:54}}>Stores this assessment in this browser only. It may disappear if browser data is cleared, you use private/incognito mode, or you switch browser/device.</p>
          <button onClick={onSaveLocal} style={buttonStyle}><Save size={15}/> Save on this device only</button>
          {localSavedAt && (
            <div style={{marginTop:10,fontSize:11,color:'#607d66'}}>
              Saved copy: {new Date(localSavedAt).toLocaleString()}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:7}}>
                <button className="download" onClick={onRestoreLocal} style={{padding:'6px 9px',fontSize:11}}>Restore saved copy</button>
                <button className="download" onClick={onClearLocal} style={{padding:'6px 9px',fontSize:11,background:'#607d66'}}><Trash2 size={12}/> Delete</button>
              </div>
            </div>
          )}
        </div>

        <div style={{border:'1px solid #e0e0e0',borderRadius:18,padding:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,color:'#263238',marginBottom:8}}><Download size={18} style={{color:'#2E7D32'}}/> Portable CEDARS file</div>
          <p className="note" style={{fontSize:12,lineHeight:1.5,minHeight:54}}>Download a durable <code>.cedars.json</code> backup, then open it later on this or another device. Opening the file is processed locally; it is not uploaded.</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={onDownload} style={buttonStyle}><Download size={15}/> Download CEDARS file</button>
            <button className="download" onClick={()=>inputRef.current?.click()} style={buttonStyle}><Upload size={15}/> Open CEDARS file</button>
          </div>
          <input ref={inputRef} type="file" accept=".json,.cedars.json,application/json" onChange={e=>{const f=e.target.files?.[0]; if(f) onOpenFile(f); e.target.value='';}} style={{display:'none'}}/>
        </div>

        <div style={{border:'1px solid #e0e0e0',borderRadius:18,padding:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,color:'#263238',marginBottom:8}}><Share2 size={18} style={{color:'#2E7D32'}}/> Create a reproducible link</div>
          <p className="note" style={{fontSize:12,lineHeight:1.5,minHeight:54}}>Generate a link that reopens this CEDARS configuration. Nothing is published or sent anywhere until you choose to copy and share the link.</p>
          <button onClick={()=>setShareConfirmOpen(true)} style={buttonStyle}><Share2 size={15}/>{linkCopied?'Link copied':'Create reproducible assessment link'}</button>
        </div>

        <div style={{border:'1px solid #c8e6c9',borderRadius:18,padding:16,background:'#f8fcf8'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,color:'#263238',marginBottom:8}}><Database size={18} style={{color:'#2E7D32'}}/> Contribute to CEDARS research</div>
          <p className="note" style={{fontSize:12,lineHeight:1.5,minHeight:54}}>Optional. CEDARS normally keeps assessment data in your browser; this action sends a copy only after you review and consent to the submission.</p>
          <button onClick={onContribute} disabled={!contributionConfigured} style={!contributionConfigured?{...buttonStyle,opacity:.55,cursor:'not-allowed'}:buttonStyle}><Database size={15}/> Contribute this assessment</button>
          {!contributionConfigured && <div style={{fontSize:10,color:'#8d6e63',marginTop:7}}>Research contribution will activate after the project team configures the submission service.</div>}
        </div>
      </div>

      {shareConfirmOpen && (
        <div role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget) setShareConfirmOpen(false);}}
          style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(20,35,25,.42)',display:'grid',placeItems:'center',padding:18}}>
          <div role="dialog" aria-modal="true" aria-labelledby="share-link-title"
            style={{width:'min(560px,100%)',background:'white',borderRadius:20,padding:22,boxShadow:'0 24px 80px rgba(0,0,0,.22)',border:'1px solid #dce9dc'}}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:10}}>
              <Share2 size={20} style={{color:'#2E7D32'}}/>
              <h3 id="share-link-title" style={{margin:0,color:'#1b5e20'}}>Create a shareable link?</h3>
            </div>
            <p style={{margin:'0 0 10px',fontSize:13,lineHeight:1.6,color:'#455a64'}}>
              This will create a URL containing your current calculator configuration. CEDARS does not publish or send the link automatically. Anyone you choose to send the full link to can reopen the same configuration.
            </p>
            <p style={{margin:'0 0 18px',fontSize:12,lineHeight:1.55,color:'#607d66'}}>
              Personal details, email addresses, and contribution-consent information are not included.
            </p>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}>
              <button className="download" onClick={()=>setShareConfirmOpen(false)} style={{minHeight:40}}>Cancel</button>
              <button onClick={createReproducibleLink} style={{minHeight:40}}><Share2 size={15}/> Create link</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
