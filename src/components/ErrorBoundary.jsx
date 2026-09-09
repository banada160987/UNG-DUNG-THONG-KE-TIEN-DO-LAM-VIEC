import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Detect Vercel chunk hash update / dynamic import failure
    const isChunkError = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Unexpected token') ||
      error?.message?.includes('importing');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('cbq_last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 8000) {
        sessionStorage.setItem('cbq_last_chunk_reload', String(now));
        console.warn("Hệ thống tự động nạp phiên bản mới nhất từ Vercel...");
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem('cbq_page_refreshed_for_chunk');
    sessionStorage.removeItem('cbq_last_chunk_reload');
    window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Loading chunk');

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '20px',
          fontFamily: '"Inter", sans-serif'
        }}>
          <div style={{
            background: 'white',
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: 'bold' }}>
              {isChunkError ? 'Hệ thống vừa cập nhật phiên bản mới' : 'Đã xảy ra sự cố khi tải trang'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              {isChunkError 
                ? 'Hệ thống vừa được nâng cấp. Vui lòng bấm nút bên dưới để tải dữ liệu phiên bản mới nhất.'
                : (this.state.error?.message || 'Trình duyệt gặp lỗi khi xử lý dữ liệu.')
              }
            </p>
            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <RefreshCw size={18} /> Cập nhật phiên bản mới & Tải lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
