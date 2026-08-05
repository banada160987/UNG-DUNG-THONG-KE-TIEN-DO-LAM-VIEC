import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Upload } from 'lucide-react';

export default function AdminGuests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cựu giáo viên',
    phone: '',
    invitation_code: ''
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cbq_guests').select('*').order('name', { ascending: true });
    if (!error) setGuests(data || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateCode = () => {
    return 'CBQ-' + Math.floor(1000 + Math.random() * 9000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let code = formData.invitation_code || generateCode();
    
    const { error } = await supabase.from('cbq_guests').insert([{ ...formData, invitation_code: code }]);
    if (!error) {
      setShowForm(false);
      setFormData({ name: '', category: 'Cựu giáo viên', phone: '', invitation_code: '' });
      fetchGuests();
    } else {
      alert("Lỗi khi lưu! Có thể mã khách mời đã tồn tại.");
    }
  };

  const handleBulkSubmit = async () => {
    // Phân tích dữ liệu từ Excel paste vào (Mỗi dòng 1 người, cách nhau bằng Tab)
    const lines = bulkText.trim().split('\n');
    const newGuests = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split('\t'); // Tab delimiter from Excel
      // Cấu trúc mong muốn: Tên | Phân loại | SĐT
      const name = parts[0] ? parts[0].trim() : 'Khách ẩn danh';
      const category = parts[1] ? parts[1].trim() : 'Khách mời';
      const phone = parts[2] ? parts[2].trim() : '';
      
      newGuests.push({
        name,
        category,
        phone,
        invitation_code: generateCode(),
        rsvp_status: 'pending'
      });
    }

    if (newGuests.length === 0) return;

    const { error } = await supabase.from('cbq_guests').insert(newGuests);
    if (!error) {
      setShowBulk(false);
      setBulkText('');
      alert(`Đã thêm thành công ${newGuests.length} khách mời!`);
      fetchGuests();
    } else {
      alert("Lỗi khi nhập hàng loạt.");
    }
  };

  return (
    <Layout title="Quản lý Khách Mời & Lễ tân">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <p style={{color: '#64748b'}}>Quản lý danh sách đại biểu, xuất thư mời và theo dõi xác nhận tham dự.</p>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button onClick={() => { setShowBulk(!showBulk); setShowForm(false); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#10b981' }}>
            <Upload size={20} /> Nhập từ Excel
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowBulk(false); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
            <Plus size={20} /> Thêm Thủ công
          </button>
        </div>
      </div>

      {showBulk && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem' }}>
          <h3>Nhập danh sách từ Excel</h3>
          <p style={{marginBottom: '1rem', color: '#64748b'}}>Copy dữ liệu từ Excel (3 cột: Tên - Phân loại - SĐT) và Paste (Dán) vào ô dưới đây:</p>
          <textarea 
            value={bulkText} 
            onChange={e => setBulkText(e.target.value)} 
            style={{...styles.input, minHeight: '150px', fontFamily: 'monospace'}} 
            placeholder="Ví dụ:&#10;Nguyễn Văn A&#09;Cựu giáo viên&#09;0901234567&#10;Trần Thị B&#09;Đại biểu Sở&#09;0912345678"
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={handleBulkSubmit} className="btn-primary" style={{ padding: '0.75rem 2rem', backgroundColor: '#10b981' }}>Tiến hành Nhập</button>
            <button type="button" onClick={() => setShowBulk(false)} style={{ padding: '0.75rem 2rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem' }}>
          <h3>Thêm Khách mời mới</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={styles.label}>Họ và Tên (*)</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Phân loại</label>
              <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
                <option value="Đại biểu Sở/Ban/Ngành">Đại biểu Sở/Ban/Ngành</option>
                <option value="Cựu giáo viên">Cựu giáo viên</option>
                <option value="Cựu học sinh (Đại diện khóa)">Cựu học sinh (Đại diện khóa)</option>
                <option value="Khách mời khác">Khách mời khác</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Số điện thoại</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Mã Khách Mời (Bỏ trống để tự tạo)</label>
              <input type="text" name="invitation_code" value={formData.invitation_code} onChange={handleChange} placeholder="VD: CBQ-9999" style={styles.input} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Lưu thông tin</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 2rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
        <h3>Danh sách Đại biểu ({guests.length} người)</h3>
        {loading ? <p>Đang tải...</p> : (
          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={styles.th}>Họ Tên</th>
                  <th style={styles.th}>Phân loại</th>
                  <th style={styles.th}>Mã Thư Mời</th>
                  <th style={styles.th}>Trạng thái RSVP</th>
                </tr>
              </thead>
              <tbody>
                {guests.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={styles.td}><strong>{g.name}</strong><br/><small style={{color: '#64748b'}}>{g.phone}</small></td>
                    <td style={styles.td}>{g.category}</td>
                    <td style={styles.td}><code style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px'}}>{g.invitation_code}</code></td>
                    <td style={styles.td}>
                      {g.rsvp_status === 'pending' && <span style={{color: '#f59e0b', fontWeight: 'bold'}}>Chờ phản hồi</span>}
                      {g.rsvp_status === 'attending' && <span style={{color: '#10b981', fontWeight: 'bold'}}>Sẽ tham dự ✅</span>}
                      {g.rsvp_status === 'not_attending' && <span style={{color: '#ef4444', fontWeight: 'bold'}}>Không tham dự ❌</span>}
                    </td>
                  </tr>
                ))}
                {guests.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Chưa có khách mời nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500'
  },
  th: { padding: '1rem 0.5rem', color: '#64748b' },
  td: { padding: '1rem 0.5rem' }
};
