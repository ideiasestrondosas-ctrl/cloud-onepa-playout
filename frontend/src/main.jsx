import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'
import './i18n'

// React Query Client Configuration - OPTIMIZED for production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds - reduces unnecessary refetches
      cacheTime: 300000, // 5 minutes - longer cache for better UX
      refetchOnWindowFocus: false,
      retry: 1,
      // Add deduplication for simultaneous requests
      structuralSharing: true,
    },
    mutations: {
      // Mutations should retry less frequently
      retry: 0,
    },
  },
})

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

console.log('🚀 Cloud Onepa Playout — v2.6.0-ALPHA.50-PRO booting...')
const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)
if (!rootElement) {
  console.error('❌ Root element not found!')
  throw new Error('Root element #root not found in DOM')
}
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>,
)
