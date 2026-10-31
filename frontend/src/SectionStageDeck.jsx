import React, {useEffect, useMemo, useRef, useState} from 'react';

export default function SectionStageDeck({label='PAGE FLOW', steps=[]}) {
  const normalized = useMemo(() => steps.filter(Boolean), [steps]);
  const [activeKey, setActiveKey] = useState(normalized[0]?.key || '');
  const cardRefs = useRef({});

  useEffect(() => {
    if (!normalized.length || typeof IntersectionObserver==='undefined') return undefined;
    const candidates = normalized.map(step => ({step, node: document.querySelector(step.selector)})).filter(x => x.node);
    if (!candidates.length) return undefined;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const match = candidates.find(x => x.node === visible.target);
      if (match) setActiveKey(match.step.key);
    }, {rootMargin:'-18% 0px -62% 0px', threshold:[0.05,0.2,0.45,0.7]});
    candidates.forEach(x => observer.observe(x.node));
    return () => observer.disconnect();
  }, [normalized]);

  useEffect(() => {
    const node = cardRefs.current[activeKey];
    node?.scrollIntoView?.({behavior:'smooth',block:'nearest',inline:'center'});
  }, [activeKey]);

  const go = step => {
    step.onBefore?.();
    setActiveKey(step.key);
    window.setTimeout(() => {
      const node = document.querySelector(step.selector);
      node?.scrollIntoView({behavior:'smooth',block:'start'});
    }, step.delay ?? 30);
  };

  return (
    <nav className="sectionStageDeck" aria-label={`${label} sections`}>
      <div className="sectionStageDeckLabel">{label}</div>
      <div className="sectionStageDeckScroller">
        {normalized.map((step,index) => (
          <button
            key={step.key}
            ref={node => { cardRefs.current[step.key] = node; }}
            type="button"
            className={`sectionStageCard ${activeKey===step.key?'active':''}`}
            aria-current={activeKey===step.key?'step':undefined}
            onClick={() => go(step)}
          >
            <span className="sectionStageNumber">{String(index+1).padStart(2,'0')}</span>
            <span className="sectionStageCopy"><strong>{step.title}</strong>{step.detail&&<small>{step.detail}</small>}</span>
            <span className="sectionStageArrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
