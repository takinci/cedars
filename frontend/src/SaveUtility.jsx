import React, {useRef, useState} from 'react';
import {Save, Download, Upload, Share2, CheckCircle2, Database} from 'lucide-react';

export default function SaveUtility({
  localSavedAt,
  onSaveLocal,
  onDownload,
  onOpenFile,
  onCopyLink,
  linkCopied,
  onContribute,
  contributionConfigured,
}) {
  const [open, setOpen] = useState(false);
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);
  const inputRef = useRef(null);

  const handleCopyLink = async () => {
    await onCopyLink?.();
    setShareConfirmOpen(false);
    setOpen(false);
  };

  return (
    <div className="saveUtility">
      <button
        type="button"
        className="saveUtilityButton"
        onClick={()=>setOpen(v=>!v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Save, reopen, or share your CEDARS assessment"
      >
        {localSavedAt ? <CheckCircle2 size={16}/> : <Save size={16}/>}
        <span>{localSavedAt ? 'Saved' : 'Save'}</span>
        <span className="saveUtilityCaret">▾</span>
      </button>

      {open && (
        <div className="saveUtilityMenu" role="menu">
          <div className="saveUtilityMenuTitle">Save your work</div>
          <button type="button" onClick={()=>{onSaveLocal?.(); setOpen(false);}} role="menuitem">
            <Save size={15}/><span><strong>Save on this device only</strong><small>Browser-local; may be lost if browser data are cleared.</small></span>
          </button>
          <button type="button" onClick={()=>{onDownload?.(); setOpen(false);}} role="menuitem">
            <Download size={15}/><span><strong>Download CEDARS file</strong><small>Portable backup for this or another device.</small></span>
          </button>
          <button type="button" onClick={()=>inputRef.current?.click()} role="menuitem">
            <Upload size={15}/><span><strong>Open CEDARS file</strong><small>Read locally; the file is not uploaded.</small></span>
          </button>
          <div className="saveUtilityMenuTitle separated">Share / contribute</div>
          <button type="button" onClick={()=>{setShareConfirmOpen(true); setOpen(false);}} role="menuitem">
            <Share2 size={15}/><span><strong>{linkCopied ? 'Link copied' : 'Create reproducible assessment link'}</strong><small>Nothing is published until you choose to share it.</small></span>
          </button>
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
              <h3 id="global-share-link-title">Create a shareable link?</h3>
            </div>
            <p>This will create a URL containing your current calculator configuration. CEDARS does not publish or send the link automatically. Anyone you choose to send the full link to can reopen the same configuration.</p>
            <p className="shareConfirmFine">Personal details, email addresses, and contribution-consent information are not included.</p>
            <div className="shareConfirmActions">
              <button className="download" onClick={()=>setShareConfirmOpen(false)}>Cancel</button>
              <button onClick={handleCopyLink}><Share2 size={15}/> Create link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
