import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initSessionWatchdog } from './services/authSessionManager.js'

// Khởi chạy bộ giám sát phiên làm việc tự động (Session Timeout & Auto Cleanup)
initSessionWatchdog();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
