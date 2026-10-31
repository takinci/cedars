import React, {useEffect, useRef} from 'react';

export default function StageCarousel({label='STAGES', steps=[], activeKey, onChange, compact=false}) {
  const trackRef=useRef(null);
  const cardRefs=useRef({});
  const activeIndex=Math.max(0,steps.findIndex(step=>step.key===activeKey));
  const active=steps[activeIndex] || steps[0];
  const previous=activeIndex>0 ? steps[activeIndex-1] : null;
  const next=activeIndex<steps.length-1 ? steps[activeIndex+1] : null;

  useEffect(()=>{
    const track=trackRef.current;
    const card=cardRefs.current[activeKey];
    if(!track||!card) return;
    const target=Math.max(0,card.offsetLeft-(track.clientWidth-card.offsetWidth)/2);
    track.scrollTo({left:target,behavior:'smooth'});
  },[activeKey]);

  if(!steps.length) return null;
  return <nav className={`stageCarousel ${compact?'compact':''}`} aria-label={`${label} navigation`}>
    <div className="stageCarouselHeading"><span>{label}</span><small>{activeIndex+1} of {steps.length}</small></div>
    <div className="stageCarouselTrack" ref={trackRef} role="tablist">
      {steps.map((step,index)=><button
        key={step.key}
        ref={node=>{cardRefs.current[step.key]=node;}}
        type="button"
        role="tab"
        aria-selected={step.key===activeKey}
        className={`stageCarouselCard ${step.key===activeKey?'active':''} ${step.optional?'optional':''}`}
        onClick={()=>onChange?.(step.key)}
      >
        <span className="stageCarouselNumber">{String(index+1).padStart(2,'0')}</span>
        <span className="stageCarouselCopy"><strong>{step.title}</strong>{step.detail&&<small>{step.detail}</small>}</span>
        {step.optional&&<span className="stageCarouselOptional">OPTIONAL</span>}
      </button>)}
    </div>
    <div className="stageCarouselControls">
      <button type="button" className="stageCarouselPrevious" disabled={!previous} onClick={()=>previous&&onChange?.(previous.key)}>{previous?`← ${previous.title}`:'← Previous'}</button>
      <div className="stageCarouselCurrent"><span>{active?.title}</span>{active?.detail&&<small>{active.detail}</small>}</div>
      <button type="button" className="stageCarouselNext" disabled={!next} onClick={()=>next&&onChange?.(next.key)}>{next?`Next: ${next.title} →`:'Complete'}</button>
    </div>
  </nav>;
}
