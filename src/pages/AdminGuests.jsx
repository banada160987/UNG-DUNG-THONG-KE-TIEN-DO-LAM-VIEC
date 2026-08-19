import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase } from '../lib/supabase';
import { Plus, Download, FileSpreadsheet, ScanLine, Link as LinkIcon, CheckCircle2, Mail, DownloadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import QRScannerModal from '../components/QRScannerModal';
import emailjs from '@emailjs/browser';
import html2canvas from 'html2canvas';

export default function AdminGuests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [inviteConfig, setInviteConfig] = useState(null);
  const [downloadingGuest, setDownloadingGuest] = useState(null);
  const [showPrintBadges, setShowPrintBadges] = useState(false);
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuests = guests.filter(g => {
    if (filterStatus !== 'All' && g.rsvp_status !== filterStatus) return false;
    if (filterCategory !== 'All' && g.category !== filterCategory) return false;
    if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase()) && !g.invitation_code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  // EDIT & DELETE GUEST STATE
  const [editingGuest, setEditingGuest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'Cựu giáo viên',
    phone: '',
    email: '',
    invitation_code: '',
    rsvp_status: 'pending'
  });
  
  const hiddenInviteRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cựu giáo viên',
    phone: '',
    email: '',
    invitation_code: ''
  });

  useEffect(() => {
    fetchGuests();
    fetchInviteConfig();
  }, []);

  useAutoRefresh(fetchGuests, 60000);

  async function fetchInviteConfig() {
    const { data } = await supabase.from('cbq_pages').select('content').eq('slug', 'invite-config').single();
    if (data) {
      try {
        setInviteConfig(JSON.parse(data.content));
      } catch (e) { }
    }
  };

  async function fetchGuests() {
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
      setFormData({ name: '', category: 'Cựu giáo viên', phone: '', email: '', invitation_code: '' });
      fetchGuests();
    } else {
      alert("Lỗi khi lưu! Có thể mã khách mời đã tồn tại.");
    }
  };

  const handleOpenEdit = (guest) => {
    setEditingGuest(guest);
    setEditFormData({
      name: guest.name || '',
      category: guest.category || 'Cựu giáo viên',
      phone: guest.phone || '',
      email: guest.email || '',
      invitation_code: guest.invitation_code || '',
      rsvp_status: guest.rsvp_status || 'pending'
    });
    setShowEditModal(true);
  };

  const handleUpdateGuest = async (e) => {
    e.preventDefault();
    if (!editingGuest) return;

    const { error } = await supabase
      .from('cbq_guests')
      .update(editFormData)
      .eq('id', editingGuest.id);

    if (!error) {
      // ĐỒNG BỘ TÊN MỚI SANG LỜI CHÚC (WISHES) VÀ QUÀ TẶNG (GIFTS) NẾU TÊN THAY ĐỔI HOẶC CHỨA TÊN MẪU
      if (editFormData.name) {
        const newName = editFormData.name.trim();
        const oldName = editingGuest.name;

        await Promise.all([
          // 1. Cập nhật lời chúc theo ID khách
          supabase.from('cbq_wishes').update({ guest_name: newName }).eq('guest_id', editingGuest.id),
          // 2. Cập nhật lời chúc theo tên cũ
          supabase.from('cbq_wishes').update({ guest_name: newName }).eq('guest_name', oldName),
          // 3. Thay thế tên mẫu 'Nguyễn Văn B' trong bảng lời chúc
          supabase.from('cbq_wishes').update({ guest_name: newName }).eq('guest_name', 'Nguyễn Văn B'),
          // 4. Cập nhật quà tặng theo ID khách
          supabase.from('cbq_gifts').update({ guest_name: newName }).eq('guest_id', editingGuest.id),
          // 5. Cập nhật quà tặng theo tên cũ
          supabase.from('cbq_gifts').update({ guest_name: newName }).eq('guest_name', oldName),
          // 6. Thay thế tên mẫu 'Nguyễn Văn B' trong quà tặng
          supabase.from('cbq_gifts').update({ guest_name: newName }).eq('guest_name', 'Nguyễn Văn B')
        ]);
      }

      alert("🎉 ĐÃ CẬP NHẬT THÔNG TIN KHÁCH MỜI THÀNH CÔNG!\n\n(Tên mới đã được đồng bộ tự động 100% sang danh sách Lời chúc và Quà tặng).");
      setShowEditModal(false);
      setEditingGuest(null);
      fetchGuests();
    } else {
      alert("Lỗi khi cập nhật thông tin: " + error.message);
    }
  };

  const handleDeleteGuest = async (guest) => {
    const confirmDelete = window.confirm(`🗑️ XÁC NHẬN XÓA KHÁCH MỜI:\n\nBạn có chắc chắn muốn xóa khách mời "${guest.name}" (${guest.invitation_code}) khỏi hệ thống không?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from('cbq_guests').delete().eq('id', guest.id);
    if (!error) {
      alert("Đã xóa khách mời thành công!");
      fetchGuests();
    } else {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  const insertBulkGuests = async (newGuests) => {
    if (newGuests.length === 0) return;
    const { error } = await supabase.from('cbq_guests').insert(newGuests);
    if (!error) {
      setShowBulk(false);
      alert(`🎉 Đã NHẬP THÊM thành công ${newGuests.length} khách mời từ file Excel vào hệ thống!\n\n(Lưu ý: Dữ liệu cũ được giữ nguyên 100%, không bị ghi đè).`);
      fetchGuests();
    } else {
      console.error("Lỗi khi nhập hàng loạt:", error);
      alert("Lỗi khi nhập hàng loạt: " + error.message);
    }
  };

  const generateUniqueCode = (existingCodes) => {
    let code = '';
    do {
      code = 'CBQ-' + Math.floor(1000 + Math.random() * 9000);
    } while (existingCodes.has(code));
    existingCodes.add(code);
    return code;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (!data || data.length === 0) {
          alert("File Excel trống hoặc không đúng định dạng!");
          return;
        }

        // Tap hop cac ma da ton tai trong he thong
        const existingCodes = new Set(guests.map(g => g.invitation_code).filter(Boolean));

        const newGuests = [];
        for (const row of data) {
          const name = (row['Họ Tên'] || row['Họ và Tên'] || row['Tên'] || '').toString().trim();
          if (!name) continue;

          const category = (row['Phân loại'] || 'Khách mời khác').toString().trim();
          const phone = (row['Số điện thoại'] || row['SĐT'] || '').toString().trim();
          const email = (row['Email'] || '').toString().trim();
          let code = (row['Mã Thư Mời'] || row['Mã Khách Mời'] || row['Mã'] || '').toString().trim();

          if (!code || existingCodes.has(code)) {
            code = generateUniqueCode(existingCodes);
          } else {
            existingCodes.add(code);
          }

          newGuests.push({
            name,
            category,
            phone,
            email,
            invitation_code: code,
            rsvp_status: 'pending'
          });
        }

        if (newGuests.length === 0) {
          alert("Không tìm thấy dữ liệu khách mời hợp lệ trong file Excel!");
          return;
        }

        insertBulkGuests(newGuests);
      } catch (err) {
        console.error("Lỗi đọc file Excel:", err);
        alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file!");
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const baseUrl = 'https://lekyniem30nam.vercel.app';
    if (filteredGuests.length === 0) {
      alert("Không có dữ liệu phù hợp với bộ lọc hiện tại để xuất file Excel!");
      return;
    }
    const exportData = filteredGuests.map(g => ({
      'Họ Tên': g.name,
      'Phân loại': g.category,
      'Số điện thoại': g.phone,
      'Email': g.email || '',
      'Mã Thư Mời': g.invitation_code,
      'Link thiệp mời': `${baseUrl}/thiep/${g.invitation_code}`,
      'Trạng thái': g.rsvp_status === 'pending' ? 'Chờ phản hồi' : (g.rsvp_status === 'attending' ? 'Tham dự' : 'Không tham dự')
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Khách mời");

    const categoryName = filterCategory !== 'All' ? `_${filterCategory.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    XLSX.writeFile(wb, `DanhSachKhachMoi${categoryName}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Họ Tên': 'Nguyễn Văn A',
      'Phân loại': 'Cựu giáo viên',
      'Số điện thoại': '0901234567',
      'Email': 'nguyenvana@gmail.com',
      'Mã Thư Mời': 'CBQ-1001 (Bỏ trống để tự tạo)'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_NhapKhachMoi.xlsx");
  };

  const handleSendEmail = async (guest) => {
    if (!guest.email) {
      alert("Khách mời này chưa có địa chỉ Email.");
      return;
    }
    
    // YÊU CẦU: Phải điền các KEY của EmailJS vào đây mới gửi được!
    const SERVICE_ID = "YOUR_SERVICE_ID"; 
    const TEMPLATE_ID = "YOUR_TEMPLATE_ID";
    const PUBLIC_KEY = "YOUR_PUBLIC_KEY";
    
    if (SERVICE_ID === "YOUR_SERVICE_ID") {
      alert("Tính năng Gửi Email đã sẵn sàng, nhưng bạn cần điền SERVICE_ID, TEMPLATE_ID và PUBLIC_KEY của EmailJS vào file AdminGuests.jsx để hoạt động.");
      return;
    }

    const templateParams = {
      to_email: guest.email,
      guest_name: guest.name,
      invitation_link: `${window.location.origin}/thiep/${guest.invitation_code}`,
      invitation_code: guest.invitation_code
    };

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      alert(`Đã gửi email thành công tới ${guest.email}`);
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      alert("Gửi email thất bại. Hãy kiểm tra Console để biết chi tiết.");
    }
  };

  const handleSendZalo = (guest) => {
    if (!guest.phone) {
      alert("Khách mời này chưa có số điện thoại.");
      return;
    }
    
    const inviteLink = `${window.location.origin}/thiep/${guest.invitation_code}`;
    const message = `Trân trọng kính mời ${guest.name} tới dự Lễ Kỷ niệm 30 năm thành lập trường THPT Cao Bá Quát.\n\nVui lòng xem Thiệp Mời và Xác nhận tham dự tại link sau:\n${inviteLink}`;
    
    navigator.clipboard.writeText(message);
    
    const phone = guest.phone.replace(/[^0-9]/g, '');
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
      formattedPhone = '84' + phone.substring(1); // Standardize for Zalo (84...)
    }
    
    const zaloUrl = `https://zalo.me/${formattedPhone}`;
    
    alert("Đã COPY nội dung lời mời vào bộ nhớ tạm!\n\nHệ thống sẽ tự động chuyển sang trang Zalo của số điện thoại này. Bạn chỉ cần dán (Ctrl + V hoặc Nhấn giữ -> Dán) vào ô chat và ấn Gửi.");
    window.open(zaloUrl, '_blank');
  };

  const handleDownloadInvite = async (guest) => {
    if (!guest) return;
    setDownloadingGuest(guest);
    
    // Đợi DOM render card ẩn
    setTimeout(async () => {
      if (!hiddenInviteRef.current) {
        setDownloadingGuest(null);
        alert("Không tìm thấy khung thiệp. Vui lòng thử lại!");
        return;
      }
      try {
        const canvas = await html2canvas(hiddenInviteRef.current, { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true, 
          logging: false,
          backgroundColor: '#ffffff'
        });
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        const safeName = (guest.name || 'KhachMoi').replace(/[^a-zA-Z0-9À-ỹ\s]/g, '_').trim();
        link.download = `ThiepMoi_${safeName}.png`;
        link.href = image;
        link.click();
      } catch (error) {
        console.error("Lỗi khi tải ảnh:", error);
        alert("Không thể tải ảnh. Vui lòng thử lại!");
      } finally {
        setDownloadingGuest(null);
      }
    }, 400);
  };

  return (
    <Layout title="Quản lý Khách Mời & Lễ tân">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <p style={{color: '#64748b'}}>Quản lý danh sách đại biểu, xuất thư mời và theo dõi xác nhận tham dự.</p>
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          <button onClick={() => setShowPrintBadges(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#be123c' }}>
            <DownloadCloud size={20} /> In Thẻ Đại Biểu Hàng Loạt
          </button>
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
          <h3 style={{color: '#047857'}}>📥 Nhập danh sách từ Excel (Tự động Nhập thêm)</h3>
          <p style={{marginBottom: '1rem', color: '#065f46', fontSize: '14px', lineHeight: '1.6'}}>
            📌 <strong>Lưu ý:</strong> Chức năng này sẽ <strong>NHẬP THÊM (Append)</strong> các khách mời từ file Excel vào danh sách hiện tại mà <strong>KHÔNG GHI ĐÈ hay làm mất</strong> dữ liệu có sẵn.<br/>
            1. Tải file mẫu về máy và điền thông tin.<br/>
            2. Bấm "Chọn file" để tải dữ liệu lên hệ thống.
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
                <option value="Đại diện Lãnh đạo trường THPT">Đại diện Lãnh đạo trường THPT</option>
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
              <label style={styles.label}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h3>Danh sách Đại biểu ({filteredGuests.length} người)</h3>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Tìm tên hoặc mã thư mời..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '250px' }}
            />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="All">Tất cả phân loại</option>
              <option value="Đại biểu Sở/Ban/Ngành">Đại biểu Sở/Ban/Ngành</option>
              <option value="Đại diện Lãnh đạo trường THPT">Đại diện Lãnh đạo trường THPT</option>
              <option value="Cựu giáo viên">Cựu giáo viên</option>
              <option value="Cựu học sinh (Đại diện khóa)">Cựu học sinh (Đại diện khóa)</option>
              <option value="Khách mời khác">Khách mời khác</option>
            </select>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="pending">Chờ phản hồi</option>
              <option value="attending">Tham dự</option>
              <option value="declined">Không tham dự</option>
            </select>
          </div>
        </div>

        {loading ? <p>Đang tải...</p> : (
          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={styles.th}>Họ Tên</th>
                  <th style={styles.th}>Phân loại</th>
                  <th style={styles.th}>Mã Thư Mời</th>
                  <th style={styles.th}>Trạng thái RSVP</th>
                  <th style={{ ...styles.th, textAlign: 'center', width: '130px' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={styles.td}>
                      <strong>{g.name}</strong><br/>
                      <small style={{color: '#64748b'}}>{g.phone}</small>
                      {g.email && <><br/><small style={{color: '#3b82f6'}}>{g.email}</small></>}
                    </td>
                    <td style={styles.td}>{g.category}</td>
                    <td style={styles.td}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <QRCodeSVG value={g.invitation_code} size={48} />
                        <div>
                          <code style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'block', marginBottom: '4px'}}>{g.invitation_code}</code>
                          <button 
                            onClick={(e) => {
                              const link = `${window.location.origin}/thiep/${g.invitation_code}`;
                              navigator.clipboard.writeText(link);
                              e.currentTarget.innerHTML = '<span style="color:#10b981">Đã copy!</span>';
                              setTimeout(() => {
                                if(e.target) e.target.innerHTML = 'Copy Link';
                              }, 2000);
                            }}
                            style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', background: 'white' }}
                          >
                            Copy Link
                          </button>
                          
                          <button 
                            onClick={() => handleSendEmail(g)}
                            style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', background: 'white', marginLeft: '5px', color: '#0284c7' }}
                            title="Gửi Email Thiệp Mời"
                          >
                            Gửi Email
                          </button>
                          
                          <button 
                            onClick={() => handleSendZalo(g)}
                            style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', background: 'white', marginLeft: '5px', color: '#2563eb' }}
                            title="Gửi qua Zalo"
                          >
                            Gửi Zalo
                          </button>
                          
                          <button 
                            onClick={() => handleDownloadInvite(g)}
                            style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', background: 'white', marginLeft: '5px', color: '#16a34a' }}
                            title="Tải Thiệp Về Máy"
                          >
                            {downloadingGuest?.id === g.id ? 'Đang tải...' : 'Tải Thiệp'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {g.rsvp_status === 'pending' && <span style={{color: '#f59e0b', fontWeight: 'bold'}}>Chờ phản hồi</span>}
                      {g.rsvp_status === 'attending' && <span style={{color: '#10b981', fontWeight: 'bold'}}>Sẽ tham dự ✅</span>}
                      {g.rsvp_status === 'not_attending' && <span style={{color: '#ef4444', fontWeight: 'bold'}}>Không tham dự ❌</span>}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleOpenEdit(g)}
                          style={{ padding: '5px 10px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                          title="Sửa thông tin khách mời"
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteGuest(g)}
                          style={{ padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                          title="Xóa khách mời"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {guests.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Chưa có khách mời nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}

      {/* EDIT GUEST MODAL */}
      {showEditModal && editingGuest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#be123c', fontFamily: 'Playfair Display, serif' }}>
              ✏️ CHỈNH SỬA THÔNG TIN KHÁCH MỜI
            </h3>

            <form onSubmit={handleUpdateGuest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={styles.label}>Họ và Tên Khách Mời (*)</label>
                <input 
                  type="text" 
                  required 
                  value={editFormData.name} 
                  onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={styles.input} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Phân loại (*)</label>
                  <select 
                    value={editFormData.category} 
                    onChange={e => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                    style={styles.input}
                  >
                    <option value="Đại biểu Sở/Ban/Ngành">Đại biểu Sở/Ban/Ngành</option>
                    <option value="Đại diện Lãnh đạo trường THPT">Đại diện Lãnh đạo trường THPT</option>
                    <option value="Cựu giáo viên">Cựu giáo viên</option>
                    <option value="Cựu học sinh (Đại diện khóa)">Cựu học sinh (Đại diện khóa)</option>
                    <option value="Khách mời khác">Khách mời khác</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Số điện thoại</label>
                  <input 
                    type="text" 
                    value={editFormData.phone} 
                    onChange={e => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={styles.input} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Email</label>
                  <input 
                    type="email" 
                    value={editFormData.email} 
                    onChange={e => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={styles.input} 
                  />
                </div>

                <div>
                  <label style={styles.label}>Trạng thái RSVP</label>
                  <select 
                    value={editFormData.rsvp_status} 
                    onChange={e => setEditFormData(prev => ({ ...prev, rsvp_status: e.target.value }))}
                    style={styles.input}
                  >
                    <option value="pending">Chờ phản hồi ⏳</option>
                    <option value="attending">Sẽ tham dự ✅</option>
                    <option value="not_attending">Không tham dự ❌</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.label}>Mã Thư Mời (QR Code)</label>
                <input 
                  type="text" 
                  value={editFormData.invitation_code} 
                  onChange={e => setEditFormData(prev => ({ ...prev, invitation_code: e.target.value }))}
                  style={styles.input} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setEditingGuest(null); }}
                  style={{ padding: '9px 18px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '9px 24px', background: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 3px 10px rgba(190, 18, 60, 0.3)' }}
                >
                  💾 Lưu Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Div cho Tải Thiệp */}
      {downloadingGuest && (
        <div style={{ position: 'fixed', left: 0, top: 0, zIndex: -9999, opacity: 1, pointerEvents: 'none', background: '#ffffff' }}>
          <div className="bifold-invite-container" ref={hiddenInviteRef} style={{ width: '800px', flexDirection: 'row', display: 'flex' }}>
            
            {/* TRANG TRÁI - Lời mời & Thông tin khách */}
            <div className="bifold-page bifold-page-left">
              <div className="invite-dept">
                SỞ GIÁO DỤC VÀ ĐÀO TẠO
                <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong>
                <div className="invite-dept-line"></div>
              </div>
              
              <div className="invite-greeting">Trân trọng kính mời:</div>
              
              <div className="guest-name-box">
                {downloadingGuest.category && downloadingGuest.category !== 'Khách mời khác' && (
                  <div className="guest-category-text">{downloadingGuest.category}</div>
                )}
                {downloadingGuest.name && (downloadingGuest.name.includes(' - ') || downloadingGuest.name.includes(' – ')) ? (
                  <div style={{ padding: '4px 0' }}>
                    <div className="guest-name-text" style={{ fontSize: '20px', color: '#be123c', fontFamily: 'Playfair Display, serif' }}>
                      {downloadingGuest.name.split(/\s*[-–]\s*/)[0]}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold', marginTop: '2px' }}>
                      {downloadingGuest.name.split(/\s*[-–]\s*/).slice(1).join(' - ')}
                    </div>
                  </div>
                ) : (
                  <div className="guest-name-text" style={(downloadingGuest?.name?.length || 0) > 28 ? { fontSize: '20px' } : {}}>
                    {downloadingGuest?.name || 'Khách mời'}
                  </div>
                )}
                <div className="dotted-line"></div>
              </div>
              
              <div className="invite-action-text">Đến tham dự</div>
              
              <div className="event-title-box">
                <div className="event-title-line1">LỄ KỶ NIỆM 30 NĂM THÀNH LẬP</div>
                <div className="event-title-line2">TRƯỜNG THPT CAO BÁ QUÁT</div>
              </div>
              
              <div className="time-loc-table">
                <div className="tl-row">
                  <div className="tl-label">Thời gian:</div>
                  <div className="tl-value">Vào lúc {inviteConfig?.time || '08:00, Chủ nhật, 15/11/2026'}</div>
                </div>
                <div className="tl-row">
                  <div className="tl-label">Địa điểm:</div>
                  <div className="tl-value">{inviteConfig?.location || 'Sân trường THPT Cao Bá Quát'}</div>
                </div>
              </div>
              
              <div className="honor-text">
                Sự có mặt của quý vị là niềm vinh hạnh cho trường chúng tôi.
              </div>
              
              <div className="signature-box">
                <div>Hà Nội, ngày 09 tháng 11 năm 2026</div>
                <div style={{fontWeight: 'bold'}}>HIỆU TRƯỞNG</div>
                <div className="signature-stamp-placeholder">
                  <div className="signature-handwriting">Lê Thị Thảo</div>
                </div>
              </div>
            </div>

            {/* TRANG PHẢI - Lịch trình & QR */}
            <div className="bifold-page bifold-page-right">
              <div className="agenda-title-box">
                <div className="agenda-title">NỘI DUNG CHƯƠNG TRÌNH</div>
                <div className="agenda-date">NGÀY 15/11/2026</div>
              </div>
              
              <div className="logo-container">
                <img src="/logo.jpg" alt="Logo 30 năm" style={{ maxWidth: '120px', height: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              
              <div className="agenda-list">
                <ul>
                  {inviteConfig?.agenda ? inviteConfig.agenda.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  )) : (
                    <>
                      <li>08:00 - 08:30: Đón tiếp đại biểu</li>
                      <li>08:30 - 10:30: Lễ mít tinh kỷ niệm</li>
                      <li>10:30 - 11:30: Giao lưu các thế hệ</li>
                      <li>11:30: Tiệc thân mật</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div className="qr-box">
                <QRCodeSVG value={downloadingGuest.invitation_code || downloadingGuest.id || 'CBQ-0000'} size={80} />
                <div style={{ fontSize: '10px', marginTop: '5px', color: '#64748b' }}>Mã Check-in: {downloadingGuest.invitation_code || downloadingGuest.id}</div>
              </div>
              
              <div className="closing-text">Rất vinh dự được đón tiếp!</div>
            </div>

          </div>
        </div>
      )}
      {/* BATCH PRINT BADGES MODAL */}
      {showPrintBadges && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 400, overflowY: 'auto', padding: '20px' }}>
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #badge-printable-area, #badge-printable-area * { visibility: visible !important; }
              #badge-printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; }
              .badge-print-controls { display: none !important; }
              .badge-card-item { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
          `}</style>

          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
            <div className="badge-print-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', color: '#be123c' }}>🏷️ In Thẻ Đại Biểu Đeo Ngực Hàng Loạt</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Bấm nút [Bấm In Thẻ] để máy in in chuẩn 8 thẻ / trang A4 có kèm mã QR Check-in.</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={badgeCategoryFilter} 
                  onChange={e => setBadgeCategoryFilter(e.target.value)} 
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                >
                  <option value="All">Tất cả phân loại ({guests.length})</option>
                  <option value="Đại biểu Sở/Ban/Ngành">Đại biểu Sở/Ban/Ngành</option>
                  <option value="Đại diện Lãnh đạo trường THPT">Đại diện Lãnh đạo trường THPT</option>
                  <option value="Cựu giáo viên">Cựu giáo viên</option>
                  <option value="Cựu học sinh">Cựu học sinh</option>
                  <option value="Khách mời khác">Khách mời khác</option>
                </select>

                <button 
                  onClick={() => window.print()} 
                  style={{ padding: '10px 20px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  🖨️ BẤM IN HÀNG LOẠT (CTRL + P)
                </button>

                <button 
                  onClick={() => setShowPrintBadges(false)} 
                  style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* PRINTABLE BADGES GRID */}
            <div id="badge-printable-area" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
              {guests
                .filter(g => badgeCategoryFilter === 'All' || g.category === badgeCategoryFilter)
                .map((g) => (
                  <div 
                    key={g.id} 
                    className="badge-card-item"
                    style={{
                      border: '2px solid #b71c1c',
                      borderRadius: '12px',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #fffdfa 0%, #fff7ed 100%)',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      position: 'relative',
                      pageBreakInside: 'avoid'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b71c1c', letterSpacing: '0.5px' }}>
                      TRƯỜNG THPT CAO BÁ QUÁT
                    </div>
                    <div style={{ fontSize: '10px', color: '#881337', fontWeight: '600', marginBottom: '8px' }}>
                      LỄ KỶ NIỆM 30 NĂM THÀNH LẬP (1996 - 2026)
                    </div>

                    <div style={{ borderTop: '1px solid #fde047', borderBottom: '1px solid #fde047', padding: '8px 0', margin: '6px 0' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                        {g.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#be123c', fontWeight: 'bold', marginTop: '2px' }}>
                        {g.category || 'THẺ THAM DỰ'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
                      <QRCodeSVG value={g.invitation_code} size={55} level="M" />
                      <div style={{ textAlign: 'left', fontSize: '11px', color: '#475569' }}>
                        <div>Mã: <strong style={{ color: '#b45309' }}>{g.invitation_code}</strong></div>
                        <div>SĐT: {g.phone || 'N/A'}</div>
                        <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#166534', marginTop: '2px' }}>✓ Quét mã tại cổng đón tiếp</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
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

