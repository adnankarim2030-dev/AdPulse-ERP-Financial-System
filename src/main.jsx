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

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleResetDataKeepLogin = () => {
    try {
      // Clear data backups but PRESERVE user session if present
      const session = localStorage.getItem("adpulse_user_session");
      localStorage.clear();
      if (session) localStorage.setItem("adpulse_user_session", session);
    } catch (e) {
      console.warn("Storage reset error:", e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif', background: '#0F172A', color: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#F87171', fontSize: 24, marginBottom: 10 }}>AdPulse ERP Notice</h2>
          <p style={{ color: '#94A3B8', maxWidth: 540, marginBottom: 20, fontSize: 14, background: '#1E293B', padding: 16, borderRadius: 10, border: '1px solid #334155', textAlign: 'left', fontFamily: 'monospace' }}>
            {this.state.error?.toString() || "A minor display error occurred."}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{ background: '#059669', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              🔄 Retry &amp; Continue Session
            </button>
            <button
              onClick={this.handleResetDataKeepLogin}
              style={{ background: '#B8860B', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              🧹 Reset Cache (Keep Login)
            </button>
          </div>
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
console.log('CACHE_BUST_1');
