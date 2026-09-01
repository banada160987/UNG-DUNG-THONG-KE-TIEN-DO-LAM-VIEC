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
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
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
              Đã xảy ra sự cố khi tải trang
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
              {this.state.error?.message || 'Trình duyệt gặp lỗi khi xử lý dữ liệu.'}
            </p>
            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
