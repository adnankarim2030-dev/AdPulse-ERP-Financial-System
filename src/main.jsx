import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught rendering error in App:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif', background: '#0F172A', color: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#F87171', fontSize: 24, marginBottom: 10 }}>AdPulse ERP System Error</h2>
          <p style={{ color: '#94A3B8', maxWidth: 520, marginBottom: 20, fontSize: 14, background: '#1E293B', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
            {this.state.error?.toString() || "A runtime render error occurred."}
          </p>
          <button
            onClick={this.handleReset}
            style={{ background: '#B8860B', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Clear Browser Cache &amp; Reload System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
