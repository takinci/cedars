import React, {useEffect, useRef} from 'react';
/* CEDARS_CHUNK_9K_NAV_AI_DARKMODE_CLEANUP */
/* CEDARS_CHUNK_9I4_REPAIR */

export default function StageCarousel({label='STAGES', steps=[], activeKey, onChange, compact=false, showHeading=true}) {
  const trackRef=useRef(null);
  const cardRefs=useRef({});
  const activeIndex=Math.max(0,steps.findIndex(step=>step.key===activeKey));
  useEffect(()=>{
    const track=trackRef.current;
    const card=cardRefs.current[activeKey];
    if(!track||!card) return;
    const target=Math.max(0,card.offsetLeft-(track.clientWidth-card.offsetWidth)/2);
    track.scrollTo({left:target,behavior:'smooth'});
  },[activeKey]);

  if(!steps.length) return null;
  return <nav className={`stageCarousel ${compact?'compact':''}`} aria-label={`${label} navigation`}>
    {showHeading&&<div className="stageCarouselHeading"><span>{label}</span><small>{activeIndex+1} of {steps.length}</small></div>}
    <div className="stageCarouselTrack" ref={trackRef} role="tablist">
      {steps.map((step,index)=><button
        key={step.key}
        ref={node=>{cardRefs.current[step.key]=node;}}
        type="button"
        role="tab"
        aria-selected={step.key===activeKey}
        aria-disabled={step.disabled||undefined}
        disabled={!!step.disabled}
        title={step.disabled ? (step.lockedLabel || 'Complete the previous required step first') : undefined}
        className={`stageCarouselCard ${step.key===activeKey?'active':''} ${step.optional?'optional':''} ${step.supporting?'supporting':''} ${step.disabled?'locked':''}`}
        onClick={()=>{if(!step.disabled) onChange?.(step.key);}}
      >
        <span className="stageCarouselNumber">{String(index+1).padStart(2,'0')}</span>
        <span className="stageCarouselCopy"><strong>{step.title}</strong>{step.detail&&<small>{step.detail}</small>}</span>
        {step.optional&&<span className="stageCarouselOptional">OPTIONAL</span>}
        {step.disabled&&<span className="stageCarouselLock">{step.lockedLabel||'LOCKED'}</span>}
      </button>)}
    </div>
</nav>;
}
