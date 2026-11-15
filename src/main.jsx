import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initSessionWatchdog } from './services/authSessionManager.js'
import { cleanStorageQuota, getStorageUsage } from './utils/safeStorage.js'

// Tự động giải phóng dung lượng bộ nhớ đệm nếu trình duyệt người dùng bị quá tải (> 3MB)
try {
  const usage = getStorageUsage();
  if (usage && usage.bytes > 3000000) {
    console.warn(`[SafeStorage] Phát hiện localStorage chiếm ${usage.mb}MB (${usage.percent}%). Đang tự động giải phóng...`);
    cleanStorageQuota(true);
  }
} catch (_) {}

// Khởi chạy bộ giám sát phiên làm việc tự động (Session Timeout & Auto Cleanup)
initSessionWatchdog();

// Đăng ký Service Worker cho ứng dụng PWA (Cài đặt trên điện thoại Android/iOS)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('✅ PWA ServiceWorker đã kích hoạt thành công:', reg.scope);
        // Tự động kiểm tra bản cập nhật mới nhất từ Vercel
        try { reg.update(); } catch (_) {}
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
