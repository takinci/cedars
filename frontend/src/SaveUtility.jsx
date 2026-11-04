import React, {useRef, useState} from 'react';
import {Save, Download, Upload, Share2, CheckCircle2, Database, LogIn, LogOut, CloudUpload, CloudDownload} from 'lucide-react';

export default function SaveUtility({
  localSavedAt,
  onSaveLocal,
  onDownload,
  onOpenFile,
  onCopyLink,
  linkCopied,
  onContribute,
  contributionConfigured,
  cloudConfigured,
  cloudUser,
  cloudSavedAt,
  onCloudSignIn,
  onCloudSignOut,
  onCloudSave,
  onCloudLoad,
  demoOpen = false,
  reportMode = null,
}) {
  const isReportMode = reportMode ?? (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page') === 'report');
  const [open, setOpen] = useState(false);
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);
  const inputRef = useRef(null);
  const menuOpen = demoOpen || open;

  const handleCopyLink = async () => {
    await onCopyLink?.();
    setShareConfirmOpen(false);
    setOpen(false);
  };

  return (
    <div className="saveUtility">
      <button
        type="button"
        className={`saveUtilityButton ${isReportMode?'reportMode':''}`}
        data-demo-target="global-save-button"
        onClick={()=>setOpen(v=>!v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        title={isReportMode ? 'Preserve or share this CEDARS assessment' : 'Save, reopen, or share your CEDARS assessment'}
      >
        {isReportMode ? <Share2 size={16}/> : localSavedAt ? <CheckCircle2 size={16}/> : <Save size={16}/>}
        <span>{isReportMode ? 'Save / Share' : localSavedAt ? 'Saved / Open' : 'Save / Open'}</span>
        <span className="saveUtilityCaret">▾</span>
      </button>

      {menuOpen && (
        <div className="saveUtilityMenu" role="menu" data-demo-target="global-save-menu">
          <div className="saveUtilityMenuTitle">{isReportMode ? 'Preserve or share' : 'Save / open assessment'}</div>
          {isReportMode && <button type="button" onClick={()=>{setShareConfirmOpen(true); setOpen(false);}} role="menuitem">
            <Share2 size={15}/><span><strong>{linkCopied ? 'Link copied' : 'Copy shareable CEDARS assessment link'}</strong><small>Reopens the supported assessment configuration. Complete multi-model details still require a downloaded CEDARS file.</small></span>
          </button>}
          <button type="button" onClick={()=>{onSaveLocal?.(); setOpen(false);}} role="menuitem">
            <Save size={15}/><span><strong>Save on this device only</strong><small>Browser-local; may be lost if browser data are cleared.</small></span>
          </button>
          <button type="button" onClick={()=>{onDownload?.(); setOpen(false);}} role="menuitem">
            <Download size={15}/><span><strong>Download CEDARS file</strong><small>Portable backup for this or another device.</small></span>
          </button>
          <button type="button" onClick={()=>inputRef.current?.click()} role="menuitem">
            <Upload size={15}/><span><strong>Open CEDARS file</strong><small>Read locally; the file is not uploaded.</small></span>
          </button>
          {cloudConfigured && (cloudUser ? (
            <>
              <button type="button" onClick={()=>{onCloudSave?.(); setOpen(false);}} role="menuitem">
                <CloudUpload size={15}/><span><strong>Save to my Google account</strong><small>Private to your account; not reviewed or collected by CEDARS.</small></span>
              </button>
              <button type="button" onClick={()=>{onCloudLoad?.(); setOpen(false);}} role="menuitem" disabled={!cloudSavedAt}>
                <CloudDownload size={15}/><span><strong>Restore my saved copy</strong><small>{cloudSavedAt ? `Saved ${new Date(cloudSavedAt).toLocaleString()}` : 'Nothing saved to this account yet.'}</small></span>
              </button>
              <button type="button" onClick={()=>{onCloudSignOut?.(); setOpen(false);}} role="menuitem">
                <LogOut size={15}/><span><strong>Sign out</strong><small>Signed in as {cloudUser.displayName || cloudUser.email}</small></span>
              </button>
            </>
          ) : (
            <button type="button" onClick={()=>{onCloudSignIn?.(); setOpen(false);}} role="menuitem">
              <LogIn size={15}/><span><strong>Sign in with Google</strong><small>Optional — save a private copy to continue on another device.</small></span>
            </button>
          ))}
          <div className="saveUtilityMenuTitle separated">Share / contribute</div>
          {!isReportMode && <button type="button" onClick={()=>{setShareConfirmOpen(true); setOpen(false);}} role="menuitem">
            <Share2 size={15}/><span><strong>{linkCopied ? 'Link copied' : 'Copy shareable CEDARS assessment link'}</strong><small>Reopens core calculator settings and supported CEDARS reference candidates. Custom candidate details and free-text comparison notes require a downloaded CEDARS file.</small></span>
          </button>}
          <button type="button" onClick={()=>{onContribute?.(); setOpen(false);}} role="menuitem" disabled={!contributionConfigured}>
            <Database size={15}/><span><strong>Contribute this assessment</strong><small>{contributionConfigured ? 'Optional research contribution after explicit consent.' : 'Research submission is not configured on this deployment.'}</small></span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.cedars.json,application/json"
            onChange={e=>{const f=e.target.files?.[0]; if(f) onOpenFile?.(f); e.target.value=''; setOpen(false);}}
            style={{display:'none'}}
          />
        </div>
      )}

      {shareConfirmOpen && (
        <div className="shareConfirmBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget) setShareConfirmOpen(false);}}>
          <div className="shareConfirmDialog" role="dialog" aria-modal="true" aria-labelledby="global-share-link-title">
            <div className="shareConfirmTitle">
              <Share2 size={20}/>
              <h3 id="global-share-link-title">Copy a shareable CEDARS assessment link?</h3>
            </div>
            <p>This creates a URL for the current calculator configuration and supported CEDARS reference candidates. Custom candidate edits, free-text comparison notes, and the complete multi-model assessment are preserved in a downloaded CEDARS file instead. CEDARS does not publish or send the link automatically.</p>
            <p className="shareConfirmFine">Personal details, email addresses, and contribution-consent information are not included.</p>
            <div className="shareConfirmActions">
              <button className="download" onClick={()=>setShareConfirmOpen(false)}>Cancel</button>
              <button onClick={handleCopyLink}><Share2 size={15}/> Copy assessment link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
