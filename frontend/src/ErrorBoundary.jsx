import React from 'react';
import {AlertTriangle} from 'lucide-react';

// Generic, reusable error boundary. Wraps a section of the app so a render-time exception in
// that section shows a visible, bounded error instead of silently vanishing while the rest of
// the page keeps working. Styled to match the existing inline warning-box pattern used elsewhere
// (e.g. the shared-link warning banner) rather than introducing new CSS classes.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {error: null};
  }
  static getDerivedStateFromError(error) {
    return {error};
  }
  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary:${this.props.label || 'section'}]`, error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{display:'flex',gap:8,background:'#fff3e0',border:'1px solid #ffcc80',padding:'10px 12px',borderRadius:10,color:'#8d4b00',fontSize:12,margin:'8px 0'}}>
        <AlertTriangle size={16} style={{flexShrink:0,marginTop:1}}/>
        <div style={{flex:1}}>
          <strong>Something went wrong displaying {this.props.label || 'this section'}.</strong>
          <div style={{marginTop:6}}>
            <button type="button" onClick={()=>window.location.reload()} style={{padding:'4px 10px',fontSize:11}}>Reload page</button>
          </div>
          <details style={{marginTop:6}}>
            <summary style={{cursor:'pointer',fontSize:10,color:'#78909c'}}>Error details</summary>
            <pre style={{whiteSpace:'pre-wrap',fontSize:10,marginTop:4}}>{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}
