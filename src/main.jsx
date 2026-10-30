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

// Đăng ký Service Worker cho ứng dụng PWA (Cài đặt trên điện thoại Android/iOS)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('✅ PWA ServiceWorker đã kích hoạt thành công:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA ServiceWorker đăng ký chưa hoàn tất:', err);
      });
  });
}

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
