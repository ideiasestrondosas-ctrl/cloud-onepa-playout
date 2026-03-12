import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'

// Global ErrorBoundary — prevents silent black screen on JS crash
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('💥 GlobalErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0b10 0%, #0d1117 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'monospace',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#ff5252', marginBottom: '8px', fontWeight: 900 }}>
            CLOUD ONEPA — ERRO DE INICIALIZAÇÃO
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px', maxWidth: '600px' }}>
            A aplicação encontrou um erro crítico durante o arranque. Verifique a consola do browser para detalhes.
          </p>
          <div style={{
            background: 'rgba(255,82,82,0.1)',
            border: '1px solid rgba(255,82,82,0.3)',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '700px',
            marginBottom: '24px',
            wordBreak: 'break-all',
            fontSize: '0.8rem',
            color: '#ff5252',
            textAlign: 'left'
          }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#00e5ff',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontWeight: 900,
              fontSize: '0.9rem',
              cursor: 'pointer',
              letterSpacing: '2px'
            }}
          >
            RECARREGAR
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

console.log('🚀 Cloud Onepa Playout — v2.6.0-ALPHA.46-PRO booting...')
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
)
