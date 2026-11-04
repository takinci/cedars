import React, {useRef, useState} from 'react';
// CEDARS_CHUNK_9R14_REPORT_DARKMODE_COMPLETION
import {Save, Download, Upload, Share2, Database, Trash2, LogIn, LogOut, CloudUpload, CloudDownload} from 'lucide-react';

const buttonStyle = {justifyContent:'center',minHeight:44};

export default function SaveSharePanel({
  localSavedAt, status, onSaveLocal, onRestoreLocal, onClearLocal, onDownload,
  onOpenFile, onCopyLink, linkCopied, onContribute, contributionConfigured,
  cloudConfigured, cloudUser, cloudSavedAt, onCloudSignIn, onCloudSignOut, onCloudSave, onCloudLoad,
}) {
  const inputRef = useRef(null);
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);
  const copyShareableAssessmentLink = () => { setShareConfirmOpen(false); onCopyLink(); };

  return (
    <section id="save-share" className="reportShareSection">
      <div className="reportStageHeading compact reportUnifiedHeading reportShareHeading"><div><span>SAVE &amp; SHARE</span><h2>Preserve or share your assessment</h2><p>Saving, transferring, and sharing are separate choices. Normal CEDARS use stays browser-local.</p></div></div>

      {status && <div className={`saveShareStatus ${status.type==='error'?'error':'success'}`}>{status.text}</div>}

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

      {cloudConfigured && (
        <div className="reportShareGroup">
          <div className="reportShareGroupHeading"><span>CONTINUE ON ANOTHER DEVICE</span><h3>Sign in to pick up where you left off</h3></div>
          <div className="reportShareCard">
            <div className="reportShareCardTitle">{cloudUser ? <CloudUpload size={18}/> : <LogIn size={18}/>} {cloudUser ? 'Save to your Google account' : 'Sign in with Google'}</div>
            <p>{cloudUser
              ? <>Signed in as <strong>{cloudUser.displayName || cloudUser.email}</strong>. Saving here writes privately to your own account only — CEDARS does not review or collect this copy, and nobody else can read it. This is separate from <em>Contribute this assessment</em> below, which is a deliberate, consent-based research submission.</>
              : 'Optional. Signing in with Google lets you save a private copy to your own account and reopen it on any other device — no one at CEDARS reviews or collects it. If you would rather keep everything local, use "Save on this device" above instead.'}</p>
            {cloudUser ? (
              <>
                <div className="reportShareActions">
                  <button onClick={onCloudSave} style={buttonStyle}><CloudUpload size={15}/> Save to my account</button>
                  <button className="download" onClick={onCloudLoad} style={buttonStyle} disabled={!cloudSavedAt}><CloudDownload size={15}/> Restore my saved copy</button>
                  <button className="download" onClick={onCloudSignOut} style={buttonStyle}><LogOut size={15}/> Sign out</button>
                </div>
                {cloudSavedAt && <div className="reportShareSaved">Saved copy: {new Date(cloudSavedAt).toLocaleString()}</div>}
              </>
            ) : (
              <button onClick={onCloudSignIn} style={buttonStyle}><LogIn size={15}/> Sign in with Google</button>
            )}
          </div>
        </div>
      )}

      <div className="reportShareGroup">
        <div className="reportShareGroupHeading"><span>SHARE WITH OTHERS</span><h3>Copy a shareable CEDARS assessment link</h3></div>
        <div className="reportShareCard reportShareLinkCard">
          <div className="reportShareCardTitle"><Share2 size={18}/> Shareable CEDARS assessment link</div>
          <p>Reopens the core calculator/current AI-model configuration and supported CEDARS reference candidates. Custom candidate edits, free-text comparison notes, and the complete multi-model Department assessment require a downloaded CEDARS file. Nothing is published or sent automatically.</p>
          <button onClick={()=>setShareConfirmOpen(true)} style={buttonStyle}><Share2 size={15}/>{linkCopied?'Link copied':'Copy shareable CEDARS assessment link'}</button>
        </div>
      </div>

      {contributionConfigured && <details className="reportResearchParticipation reportResearchParticipationCompact">
        <summary><Database size={18}/><span><strong>Optional research contribution</strong><small>Separate from save/share; nothing is sent until you review and consent.</small></span><b>Review →</b></summary>
        <div className="reportResearchParticipationBody"><p>Contributing sends a copy of the current assessment to the CEDARS research team only after you review the submission and consent choices.</p><button onClick={onContribute} style={buttonStyle}><Database size={15}/> Review contribution options</button></div>
      </details>}

      {shareConfirmOpen && (
        <div className="shareConfirmBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget) setShareConfirmOpen(false);}}>
          <div className="shareConfirmDialog" role="dialog" aria-modal="true" aria-labelledby="share-link-title">
            <div className="shareConfirmTitle"><Share2 size={20}/><h3 id="share-link-title">Copy a shareable CEDARS assessment link?</h3></div>
            <p>This URL carries the core calculator/current AI-model configuration and supported CEDARS reference candidates. Custom candidate edits, free-text comparison notes, the complete Clinical AI inventory, and other full-assessment fields remain in the complete CEDARS file. CEDARS does not publish or send the link automatically.</p>
            <p className="shareConfirmFine">Personal details, email addresses, and contribution-consent information are not included.</p>
            <div className="shareConfirmActions"><button className="download" onClick={()=>setShareConfirmOpen(false)} style={{minHeight:40}}>Cancel</button><button onClick={copyShareableAssessmentLink} style={{minHeight:40}}><Share2 size={15}/> Copy assessment link</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
