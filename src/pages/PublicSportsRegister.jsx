import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Award, CheckCircle2, Search, Filter, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

const OFFICIAL_SPORTS = [
  'Kéo co (nam - phối hợp)',
  'Pickleball (đôi nam)',
  'Pickleball (đôi nữ)',
  'Pickleball (đôi nam - nữ)',
  'Bóng đá Futsal Nam',
  'Bóng chuyền hơi Nữ'
];

const USER_CATEGORIES = [
  'Cựu học sinh',
  'Khách mời đại biểu',
  'Học sinh đang học',
  'Cán bộ / Giáo viên / Nhân viên'
];

export default function PublicSportsRegister() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [userCategory, setUserCategory] = useState('Cựu học sinh');
  const [fullName, setFullName] = useState('');
  const [sportName, setSportName] = useState('Kéo co (nam - phối hợp)');
  const [phone, setPhone] = useState('');
  const [cohortYear, setCohortYear] = useState('');
  const [unitName, setUnitName] = useState('');
  const [notes, setNotes] = useState('');

  // Filter & Search State
  const [selectedSportFilter, setSelectedSportFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_sports_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err) {
      console.warn("Chưa có bảng Supabase cbq_sports_registrations hoặc dùng LocalStorage fallback:", err);
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      setRegistrations(local);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !unitName.trim()) {
      alert("Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const newReg = {
      full_name: fullName.trim(),
      sport_name: sportName,
      phone: phone.trim(),
      cohort_year: cohortYear.trim() || 'Không có',
      unit_name: unitName.trim(),
      notes: notes.trim() || '',
      user_category: userCategory,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('cbq_sports_registrations')
        .insert([newReg])
        .select();

      if (error) {
        console.warn("Supabase insert fallback sang localStorage:", error);
        const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
        const updatedLocal = [newReg, ...local];
        localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
        setRegistrations(updatedLocal);
      } else if (data) {
        setRegistrations(prev => [data[0], ...prev]);
      }

      setSuccessMsg(`🎉 ĐĂNG KÝ THÀNH CÔNG!\nXin chúc mừng VĐV ${fullName} (${unitName}) đã đăng ký môn "${sportName}". Ban Tổ Chức sẽ liên hệ qua SĐT ${phone} để xác nhận lịch thi đấu.`);
      
      // Reset form fields
      setFullName('');
      setPhone('');
      setCohortYear('');
      setNotes('');

    } catch (err) {
      console.error("Lỗi đăng ký thể thao:", err);
      alert("Không thể gửi đăng ký. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRegistrations = registrations.filter(item => {
    const matchSport = selectedSportFilter === 'Tất cả' || item.sport_name === selectedSportFilter;
    const matchSearch = (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.unit_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone || '').includes(searchQuery);
    return matchSport && matchSearch;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 15px' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e3a8a 100%)',
        borderRadius: '20px',
        padding: '30px 20px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(2, 132, 199, 0.25)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={16} color="#fde047" /> HOẠT ĐỘNG THỂ THAO KỶ NIỆM 30 NĂM THÀNH LẬP THPT CAO BÁ QUÁT
        </div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          ⚽ DANG KÝ THI ĐẤU GIẢI THỂ THAO GIAO LƯU 2026
        </h1>
        <p style={{ margin: '0 auto', maxWidth: '750px', fontSize: '14.5px', color: '#e0f2fe', lineHeight: '1.6' }}>
          Trân trọng kính mời Cựu Học Sinh, Khách Mời Đại Biểu, Thầy Cô Giáo và Học Sinh Đang Theo Học đăng ký tham gia thi đấu giao lưu 06 bộ môn thể thao chính thức!
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', alignItems: 'start' }}>
        
        {/* FORM ĐĂNG KÝ VẬN ĐỘNG VIÊN */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0369a1', fontWeight: 'bold', fontSize: '17px', marginBottom: '18px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '10px' }}>
            <UserCheck size={22} color="#0369a1" /> FORM ĐĂNG KÝ VẬN ĐỘNG VIÊN (*)
          </div>

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '14px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '18px', whiteSpace: 'pre-line' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Phân loại đối tượng */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Đối Tượng Dự Thi *</label>
              <select
                value={userCategory}
                onChange={e => setUserCategory(e.target.value)}
                style={styles.select}
              >
                {USER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Họ và Tên */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Họ và Tên Vận Động Viên *</label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn An"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Môn Đăng Ký */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Môn Thi Đấu Đăng Ký *</label>
              <select
                value={sportName}
                onChange={e => setSportName(e.target.value)}
                style={{ ...styles.select, fontWeight: 'bold', color: '#0369a1', background: '#f0f9ff' }}
              >
                {OFFICIAL_SPORTS.map(sp => (
                  <option key={sp} value={sp}>🏅 {sp}</option>
                ))}
              </select>
            </div>

            {/* Số Điện Thoại */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Số Điện Thoại Liên Hệ *</label>
              <input
                type="tel"
                required
                placeholder="VD: 0987 654 321"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Niên Khóa */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Niên Khóa / Lớp</label>
              <input
                type="text"
                placeholder="VD: 2005 - 2008 / Lớp 12A1"
                value={cohortYear}
                onChange={e => setCohortYear(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Đơn Vị */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Đơn Vị Đăng Ký / Chi Đoàn *</label>
              <input
                type="text"
                required
                placeholder="VD: Hội CHS Niên Khóa 2002 / Chi Đoàn Lớp 12A1 / Tổ Toán"
                value={unitName}
                onChange={e => setUnitName(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Ghi Chú */}
            <div style={{ marginBottom: '18px' }}>
              <label style={styles.label}>Ghi Chú Thêm (Đồng đội / Vị trí thi đấu)</label>
              <textarea
                rows={2}
                placeholder="VD: Đánh đôi Pickleball cùng VĐV Trần Văn Bình / Đội hình kéo co 8 người..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={styles.submitBtn}
            >
              {submitting ? 'Đang gửi đăng ký...' : '🚀 XÁC NHẬN ĐĂNG KÝ VĐV'}
            </button>
          </form>
        </div>

        {/* BẢNG DANH SÁCH VĐV ĐÃ ĐĂNG KÝ CÔNG KHAI */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '16.5px' }}>
              <Trophy size={20} color="#166534" /> DANH SÁCH VĐV ĐĂNG KÝ ({filteredRegistrations.length})
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
              <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Tìm VĐV / Đơn vị..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>

              <select
                value={selectedSportFilter}
                onChange={e => setSelectedSportFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
              >
                <option value="Tất cả">Tất cả môn ({registrations.length})</option>
                {OFFICIAL_SPORTS.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải danh sách vận động viên...</div>
          ) : filteredRegistrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 15px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
              Chưa có vận động viên nào đăng ký môn này. Hãy là người đầu tiên ghi tên vào Bảng Vàng Hội Thao!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>STT</th>
                    <th style={{ padding: '10px 8px' }}>HỌ VÀ TÊN</th>
                    <th style={{ padding: '10px 8px' }}>MÔN</th>
                    <th style={{ padding: '10px 8px' }}>SỐ ĐIỆN THOẠI</th>
                    <th style={{ padding: '10px 8px' }}>NIÊN KHÓA</th>
                    <th style={{ padding: '10px 8px' }}>ĐƠN VỊ</th>
                    <th style={{ padding: '10px 8px' }}>GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#1e293b' }}>{item.full_name}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '11.5px' }}>
                          {item.sport_name}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#475569', fontFamily: 'monospace' }}>{item.phone ? item.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '***'}</td>
                      <td style={{ padding: '10px 8px', color: '#64748b' }}>{item.cohort_year || '-'}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#334155' }}>{item.unit_name}</td>
                      <td style={{ padding: '10px 8px', color: '#64748b', fontSize: '12px' }}>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '5px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '14px',
    background: '#ffffff',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '15.5px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
    transition: 'all 0.2s ease'
  }
};
