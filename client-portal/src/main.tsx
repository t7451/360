import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'sonner';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f0ece4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <span style={{ color: '#d4845a' }}>FORGE</span>3D
          </div>
          <p style={{ color: '#8a8578', marginBottom: '1rem' }}>Something went wrong loading the app.</p>
          <pre style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '1rem', fontSize: '0.75rem', color: '#d45555', maxWidth: '600px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1.5rem', background: '#d4845a', color: '#0a0a0a', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#f4f4f5',
          },
        }}
      />
    </ErrorBoundary>
  </React.StrictMode>
);
