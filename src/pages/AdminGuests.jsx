import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Download, FileSpreadsheet, ScanLine } from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import QRScannerModal from '../components/QRScannerModal';

export default function AdminGuests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
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

  const insertBulkGuests = async (newGuests) => {
    if (newGuests.length === 0) return;
    const { error } = await supabase.from('cbq_guests').insert(newGuests);
    if (!error) {
      setShowBulk(false);
      alert(`Đã thêm thành công ${newGuests.length} khách mời từ Excel!`);
      fetchGuests();
    } else {
      alert("Lỗi khi nhập hàng loạt.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const newGuests = data.map(row => ({
        name: row['Họ Tên'] || 'Khách ẩn danh',
        category: row['Phân loại'] || 'Khách mời khác',
        phone: row['Số điện thoại'] || '',
        invitation_code: generateCode(),
        rsvp_status: 'pending'
      }));
      insertBulkGuests(newGuests);
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const exportData = guests.map(g => ({
      'Họ Tên': g.name,
      'Phân loại': g.category,
      'Số điện thoại': g.phone,
      'Mã Thư Mời': g.invitation_code,
      'Trạng thái': g.rsvp_status === 'pending' ? 'Chờ phản hồi' : (g.rsvp_status === 'attending' ? 'Tham dự' : 'Không tham dự')
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Khách mời");
    XLSX.writeFile(wb, "DanhSachKhachMoi.xlsx");
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Họ Tên': 'Nguyễn Văn A',
      'Phân loại': 'Cựu giáo viên',
      'Số điện thoại': '0901234567'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_NhapKhachMoi.xlsx");
  };

  return (
    <Layout title="Quản lý Khách Mời & Lễ tân">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <p style={{color: '#64748b'}}>Quản lý danh sách đại biểu, xuất thư mời và theo dõi xác nhận tham dự.</p>
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          <button onClick={() => setShowScanner(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#8b5cf6' }}>
            <ScanLine size={20} /> Quét mã Check-in
          </button>
          <button onClick={handleExport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#3b82f6' }}>
            <Download size={20} /> Xuất Excel
          </button>
          <button onClick={() => { setShowBulk(!showBulk); setShowForm(false); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#10b981' }}>
            <FileSpreadsheet size={20} /> Nhập Excel
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowBulk(false); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}>
            <Plus size={20} /> Thêm Thủ công
          </button>
        </div>
      </div>

      {showBulk && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #10b981' }}>
          <h3 style={{color: '#047857'}}>Nhập danh sách từ Excel</h3>
          <p style={{marginBottom: '1rem', color: '#065f46'}}>
            1. Tải file mẫu về máy và điền thông tin.<br/>
            2. Bấm "Chọn file" để tải lên hệ thống.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
            <button onClick={handleDownloadTemplate} className="btn-primary" style={{ padding: '0.5rem 1rem', backgroundColor: '#34d399', color: '#064e3b' }}>
              Tải Template Mẫu
            </button>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </div>
          <button type="button" onClick={() => setShowBulk(false)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Đóng</button>
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
                    <td style={styles.td}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <QRCodeSVG value={g.invitation_code} size={48} />
                        <code style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px'}}>{g.invitation_code}</code>
                      </div>
                    </td>
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

      <QRScannerModal 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScanSuccess={() => fetchGuests()} 
      />
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
