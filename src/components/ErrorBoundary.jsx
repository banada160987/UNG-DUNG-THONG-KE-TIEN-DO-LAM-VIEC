import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    
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

  handleClearCacheAndReload = () => {
    try {
      // Clear relevant local storage items that might be corrupted
      const keysToClear = [
        'cbq_master_timetable',
        'cbq_draft_timetable',
        'cbq_rotation_group_a',
        'cbq_rotation_group_b',
        'cbq_school_locks',
        'cbq_teacher_locks',
        'cbq_active_rotation_cycle',
        'cbq_cycle_1_timetable',
        'cbq_cycle_2_timetable'
      ];
      keysToClear.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {
      console.warn("Lỗi xóa cache:", e);
    }
    this.handleReload();
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
            maxWidth: '560px',
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
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
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
                <RefreshCw size={17} /> Tải lại trang
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  background: '#f1f5f9',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} /> Xóa Cache & Tải Lại
              </button>
            </div>

            {/* ERROR STACK DETAILS TOGGLE */}
            {this.state.error && (
              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {this.state.showDetails ? 'Ẩn chi tiết kỹ thuật' : 'Xem chi tiết kỹ thuật'}
                </button>
                {this.state.showDetails && (
                  <pre style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    fontSize: '11px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
