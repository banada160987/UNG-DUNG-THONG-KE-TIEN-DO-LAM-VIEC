import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';

export default function AdminSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    donation_amount: 0,
    donation_item: '',
    is_public: true
  });

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cbq_sponsors').select('*').order('date_received', { ascending: false });
    if (!error) setSponsors(data || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('cbq_sponsors').insert([formData]);
    if (!error) {
      setShowForm(false);
      setFormData({ name: '', donation_amount: 0, donation_item: '', is_public: true });
      fetchSponsors();
    } else {
      alert("Lỗi khi lưu!");
    }
  };

  return (
    <Layout title="Quản lý Tài trợ & Bảng Vàng">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Plus size={20} /> Thêm Nhà tài trợ
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem' }}>
          <h3>Ghi nhận Tài trợ mới</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Tên Mạnh thường quân / Đơn vị (*)</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required style={styles.input} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Số tiền tài trợ (VNĐ)</label>
              <input type="number" name="donation_amount" value={formData.donation_amount} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Tài trợ Hiện vật (nếu có)</label>
              <input type="text" name="donation_item" value={formData.donation_item} onChange={handleChange} placeholder="Ví dụ: 10 bộ áo dài, 1000 quyển vở..." style={styles.input} />
            </div>
            <div>
              <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <input type="checkbox" name="is_public" checked={formData.is_public} onChange={handleChange} />
                Công khai trên Bảng Vàng trang chủ
              </label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Lưu thông tin</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 2rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
        <h3>Danh sách Tài trợ</h3>
        {loading ? <p>Đang tải...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={styles.th}>Nhà tài trợ</th>
                <th style={styles.th}>Tiền mặt (VNĐ)</th>
                <th style={styles.th}>Hiện vật</th>
                <th style={styles.th}>Ngày nhận</th>
                <th style={styles.th}>Công khai</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={styles.td}><strong>{s.name}</strong></td>
                  <td style={styles.td}>{Number(s.donation_amount).toLocaleString()}</td>
                  <td style={styles.td}>{s.donation_item || '-'}</td>
                  <td style={styles.td}>{new Date(s.date_received).toLocaleDateString('vi-VN')}</td>
                  <td style={styles.td}>{s.is_public ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
  },
  th: { padding: '1rem 0.5rem', color: '#64748b' },
  td: { padding: '1rem 0.5rem' }
};
