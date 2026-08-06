import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PublicSponsorsList() {
  const [sponsors, setSponsors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', donation_amount: '', donation_item: '', is_public: false
  });

  useEffect(() => {
    supabase.from('cbq_sponsors').select('*').eq('is_public', true).order('date_received', { ascending: false }).then(({data}) => {
      if(data) setSponsors(data);
    });
  }, []);

  const filteredSponsors = sponsors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      donation_amount: formData.donation_amount ? Number(formData.donation_amount) : 0,
      is_public: false // Chờ Admin duyệt
    };
    const { error } = await supabase.from('cbq_sponsors').insert([dataToSubmit]);
    if (!error) {
      alert('Cảm ơn Quý vị đã đăng ký tài trợ! Ban tổ chức sẽ liên hệ và xác nhận trước khi hiển thị công khai.');
      setShowForm(false);
      setFormData({ name: '', donation_amount: '', donation_item: '', is_public: false });
    } else {
      alert('Có lỗi xảy ra, vui lòng thử lại sau.');
    }
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Bảng vàng tri ân</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => setShowForm(true)} style={styles.donateBtn}>Đăng ký đóng góp</button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 Tìm kiếm nhà tài trợ, tập thể lớp..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={{marginTop: 0, color: '#d32f2f'}}>Đăng ký Tài trợ / Đóng góp</h2>
            <p style={{fontSize: '14px', color: '#666', marginBottom: '20px'}}>Thông tin của quý vị sẽ được Ban Tổ Chức liên hệ xác nhận trước khi đưa lên Bảng Vàng công khai.</p>
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <div>
                <label style={styles.label}>Tên Cá nhân / Tập thể lớp *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} placeholder="VD: Tập thể lớp 12A1 khóa 1996-1999" />
              </div>
              <div>
                <label style={styles.label}>Số tiền đóng góp (VNĐ)</label>
                <input type="number" name="donation_amount" value={formData.donation_amount} onChange={handleChange} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Đóng góp Hiện vật (Nếu có)</label>
                <input type="text" name="donation_item" value={formData.donation_item} onChange={handleChange} style={styles.input} placeholder="VD: 10 ghế đá, 5 tivi..." />
              </div>
              <div style={{display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Hủy</button>
                <button type="submit" style={styles.submitBtn}>Gửi đăng ký</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nhà tài trợ</th>
            <th style={styles.th}>Hình thức / Hiện vật</th>
            <th style={styles.th}>Số tiền (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          {filteredSponsors.map(s => (
            <tr key={s.id}>
              <td style={styles.td}><strong>{s.name}</strong></td>
              <td style={styles.td}>{s.donation_item || '-'}</td>
              <td style={{...styles.td, color: '#d32f2f', fontWeight: 'bold'}}>{s.donation_amount ? Number(s.donation_amount).toLocaleString() : '-'}</td>
            </tr>
          ))}
          {filteredSponsors.length === 0 && (
            <tr><td colSpan="3" style={{padding: '20px', textAlign: 'center'}}>Không tìm thấy dữ liệu.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #d32f2f', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#d32f2f', margin: 0, fontSize: '24px' },
  donateBtn: { backgroundColor: '#166534', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  searchInput: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#d32f2f', color: 'white', padding: '10px', textAlign: 'left', border: '1px solid #b71c1c' },
  td: { padding: '10px', border: '1px solid #e2e8f0' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#333' },
  input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  cancelBtn: { padding: '8px 15px', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' },
  submitBtn: { padding: '8px 15px', border: 'none', backgroundColor: '#d32f2f', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};
