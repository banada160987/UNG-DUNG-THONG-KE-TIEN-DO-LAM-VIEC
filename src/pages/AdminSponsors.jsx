import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  
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

  const insertBulkSponsors = async (newSponsors) => {
    if (newSponsors.length === 0) return;
    const { error } = await supabase.from('cbq_sponsors').insert(newSponsors);
    if (!error) {
      setShowBulk(false);
      alert(`Đã thêm thành công ${newSponsors.length} nhà tài trợ từ Excel!`);
      fetchSponsors();
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
      
      const newSponsors = data.map(row => ({
        name: row['Tên / Đơn vị'] || 'Ẩn danh',
        donation_amount: Number(row['Tiền mặt (VNĐ)']) || 0,
        donation_item: row['Hiện vật'] || '',
        is_public: true
      }));
      insertBulkSponsors(newSponsors);
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const exportData = sponsors.map(s => ({
      'Tên / Đơn vị': s.name,
      'Tiền mặt (VNĐ)': Number(s.donation_amount),
      'Hiện vật': s.donation_item,
      'Ngày nhận': new Date(s.date_received).toLocaleDateString('vi-VN'),
      'Công khai': s.is_public ? 'Có' : 'Không'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tài trợ");
    XLSX.writeFile(wb, "DanhSachTaiTro.xlsx");
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Tên / Đơn vị': 'Ngân hàng ABC',
      'Tiền mặt (VNĐ)': 10000000,
      'Hiện vật': '10 lẵng hoa'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_NhapTaiTro.xlsx");
  };

  return (
    <Layout title="Quản lý Tài trợ & Bảng Vàng">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <p style={{color: '#64748b'}}>Quản lý danh sách mạnh thường quân và các khoản đóng góp.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleExport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#3b82f6' }}>
            <Download size={20} /> Xuất Excel
          </button>
          <button onClick={() => { setShowBulk(!showBulk); setShowForm(false); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#10b981' }}>
            <FileSpreadsheet size={20} /> Nhập Excel
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowBulk(false); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}>
            <Plus size={20} /> Thêm Nhà tài trợ
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
