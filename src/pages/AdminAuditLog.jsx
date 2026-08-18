import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data } = await supabase.from('cbq_audit_log').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setLogs(data);
    setLoading(false);
  };

  return (
    <Layout title="Nhật ký Hoạt động">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
      ) : (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Activity color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Hoạt động gần đây (100 log mới nhất)</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px', whiteSpace: 'nowrap' }}>Thời gian</th>
                  <th style={{ padding: '10px' }}>Hành động</th>
                  <th style={{ padding: '10px' }}>Mô tả chi tiết</th>
                  <th style={{ padding: '10px' }}>Thực hiện bởi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.action}</td>
                    <td style={{ padding: '10px' }}>{log.description}</td>
                    <td style={{ padding: '10px' }}>{log.performed_by}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Chưa có hoạt động nào được ghi nhận.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

