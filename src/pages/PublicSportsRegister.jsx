import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Award, CheckCircle2, Search, Filter, Sparkles, UserCheck, ShieldCheck, AlertCircle, Phone, Calendar, HeartHandshake } from 'lucide-react';

const DIVISION_A_SPORTS = [
  'Bóng đá Futsal Nam (2 hiệp x 20 phút)',
  'Kéo co Nam Nữ phối hợp (5 Nam, 5 Nữ)',
  'Bóng chuyền hơi Nữ (dự kiến 6 đội)',
  'Pickleball (đôi Nam)',
  'Pickleball (đôi Nữ)',
  'Pickleball (đôi Nam - Nữ)'
];

const DIVISION_B_SPORTS = [
  'Bóng chuyền Nam - Nữ phối hợp (3 Nam, 3 Nữ - Thi đấu theo lớp)'
];

const USER_CATEGORIES = [
  { label: 'Cựu học sinh các niên khóa (Bảng A - 300.000đ)', division: 'A', fee: 300000 },
  { label: 'Giáo viên / Cựu giáo viên (Bảng A - 300.000đ)', division: 'A', fee: 300000 },
  { label: 'Học sinh đang học tại trường (Bảng B - Miễn phí)', division: 'B', fee: 0 },
  { label: 'Khách mời Đại biểu / Đội khách (300.000đ)', division: 'A', fee: 300000 }
];

export default function PublicSportsRegister() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(USER_CATEGORIES[0]);
  const [fullName, setFullName] = useState('');
  const [sportName, setSportName] = useState(DIVISION_A_SPORTS[0]);
  const [phone, setPhone] = useState('');
  const [cohortYear, setCohortYear] = useState('');
  const [unitName, setUnitName] = useState('');
  const [notes, setNotes] = useState('');
  const [healthAgreed, setHealthAgreed] = useState(true);

  // Filter & Search State
  const [selectedSportFilter, setSelectedSportFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Update default sport when category changes
  const handleCategoryChange = (e) => {
    const found = USER_CATEGORIES.find(c => c.label === e.target.value) || USER_CATEGORIES[0];
    setSelectedCategoryObj(found);
    if (found.division === 'B') {
      setSportName(DIVISION_B_SPORTS[0]);
    } else {
      setSportName(DIVISION_A_SPORTS[0]);
    }
  };

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
      console.warn("Dùng LocalStorage fallback:", err);
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

    if (!healthAgreed) {
      alert("Vui lòng tích chọn cam kết tự chịu trách nhiệm sức khỏe khi thi đấu.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const isStudent = selectedCategoryObj.fee === 0;

    const newReg = {
      full_name: fullName.trim(),
      sport_name: sportName,
      phone: phone.trim(),
      cohort_year: cohortYear.trim() || 'Không có',
      unit_name: unitName.trim(),
      notes: notes.trim() || '',
      user_category: selectedCategoryObj.label,
      fee_amount: selectedCategoryObj.fee,
      payment_status: isStudent ? 'Miễn phí (Học sinh)' : 'Chờ nộp kinh phí (300.000đ)',
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

      const msg = isStudent 
        ? `🎉 ĐĂNG KÝ THÀNH CÔNG (BẢNG B - MIỄN PHÍ)!\nVĐV ${fullName} (${unitName}) đã hoàn tất đăng ký môn "${sportName}". Ban Tổ Chức sẽ liên hệ Zalo/SĐT ${phone} để xếp lịch thi đấu.`
        : `🎉 ĐĂNG KÝ THÀNH CÔNG (BẢNG A)!\nVĐV ${fullName} (${unitName}) đã hoàn tất đăng ký môn "${sportName}".\n\n📌 LƯU Ý KINH PHÍ TỔ CHỨC: 300.000đ/VĐV.\nVui lòng liên hệ / chuyển khoản cho Thầy Nguyễn Công Sự (SĐT/Zalo: 0366190199) để BTC xác nhận vị trí thi đấu chính thức.`;

      setSuccessMsg(msg);
      
      // Reset input fields
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

  const allAvailableSports = [...DIVISION_A_SPORTS, ...DIVISION_B_SPORTS];

  const filteredRegistrations = registrations.filter(item => {
    const matchSport = selectedSportFilter === 'Tất cả' || item.sport_name === selectedSportFilter;
    const matchSearch = (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.unit_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone || '').includes(searchQuery);
    return matchSport && matchSearch;
  });

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '20px 15px' }}>
      
      {/* HEADER BANNER CHÍNH THỨC BAN TỔ CHỨC */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e3a8a 100%)',
        borderRadius: '20px',
        padding: '30px 22px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(2, 132, 199, 0.25)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={16} color="#fde047" /> LỄ KỶ NIỆM 30 NĂM THÀNH LẬP THPT CAO BÁ QUÁT (1996 - 2026)
        </div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          ⚽ CỔNG ĐĂNG KÝ THI ĐẤU GIẢI THỂ THAO GIAO LƯU 2026
        </h1>
        <p style={{ margin: '0 auto 15px auto', maxWidth: '800px', fontSize: '14.5px', color: '#e0f2fe', lineHeight: '1.6' }}>
          Hội thao truyền thống thắt chặt tình thân giữa Thầy Cô Giáo, Cựu Học Sinh các niên khóa (Bảng A) và Học Sinh đang học (Bảng B).
        </p>

        {/* THÔNG TIN THỜI GIAN & TỔ TRƯỞNG PHỤ TRÁCH */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(6px)', padding: '14px 18px', borderRadius: '14px', textAlign: 'left', border: '1px solid rgba(253,224,71,0.4)', fontSize: '13.5px' }}>
          <div><Calendar size={16} color="#fde047" style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Thời gian đăng ký:</strong> Từ 15/8/2026 đến 26/8/2026</div>
          <div><Phone size={16} color="#fde047" style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Thầy Nguyễn Công Sự (Tổ GDTC):</strong> SĐT/Zalo: <strong>0366190199</strong></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '25px', alignItems: 'start' }}>
        
        {/* FORM ĐĂNG KÝ VẬN ĐỘNG VIÊN */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0369a1', fontWeight: 'bold', fontSize: '17px', marginBottom: '16px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '10px' }}>
            <UserCheck size={22} color="#0369a1" /> FORM ĐĂNG KÝ THI ĐẤU CHÍNH THỨC (*)
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
                value={selectedCategoryObj.label}
                onChange={handleCategoryChange}
                style={styles.select}
              >
                {USER_CATEGORIES.map(cat => (
                  <option key={cat.label} value={cat.label}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Thông báo kinh phí tổ chức */}
            <div style={{ background: selectedCategoryObj.fee === 0 ? '#f0fdf4' : '#fffbebe6', border: `1px solid ${selectedCategoryObj.fee === 0 ? '#bbf7d0' : '#fde047'}`, padding: '12px 14px', borderRadius: '10px', fontSize: '13px', color: selectedCategoryObj.fee === 0 ? '#166534' : '#854d0e', marginBottom: '14px' }}>
              {selectedCategoryObj.fee === 0 ? (
                <span>🎉 <strong>HỌC SINH ĐANG HỌC:</strong> Đăng ký Bảng B <strong>MIỄN PHÍ 100%</strong> (Nhà trường vận động tài trợ cúp cờ).</span>
              ) : (
                <span>💰 <strong>ĐỐI TƯỢNG BẢNG A (GV & CHS):</strong> Đóng góp <strong>300.000 VNĐ / 1 VĐV</strong> (Kinh phí xã hội hóa tổ chức giải & cúp huy chương). Quý VĐV vui lòng chuyển khoản theo hình ảnh tài khoản bên dưới hoặc gửi thầy Nguyễn Công Sự (SĐT/Zalo: <strong>0366190199</strong>).</span>
              )}
            </div>

            {/* HÌNH ẢNH THÔNG TIN TÀI KHOẢN KINH PHÍ THỂ THAO */}
            {selectedCategoryObj.fee > 0 && (
              <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '12px', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#0369a1', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  💳 THÔNG TIN TÀI KHOẢN NỘP KINH PHÍ (300.000đ/VĐV)
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <img
                    src="/tkthethao.png"
                    alt="Thông tin tài khoản kinh phí giải thể thao"
                    style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '10px', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#0369a1', background: '#ffffff', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', border: '1px solid #bae6fd', fontWeight: '500' }}>
                  📌 Cú pháp chuyển khoản gợi ý: <strong>[Họ tên VĐV] - [SĐT] - [Môn thi đấu]</strong>
                </div>
              </div>
            )}

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
                {selectedCategoryObj.division === 'B' ? (
                  DIVISION_B_SPORTS.map(sp => <option key={sp} value={sp}>🏅 {sp}</option>)
                ) : (
                  DIVISION_A_SPORTS.map(sp => <option key={sp} value={sp}>🏅 {sp}</option>)
                )}
              </select>
            </div>

            {/* Số Điện Thoại */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Số Điện Thoại / Zalo Liên Hệ *</label>
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
                placeholder="VD: 2005 - 2008 / Lớp 12A1 / Tổ Giáo Viên"
                value={cohortYear}
                onChange={e => setCohortYear(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Đơn Vị */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Đơn Vị Đăng Ký / Khóa / Chi Đoàn *</label>
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
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Ghi Chú Thêm (Tên đồng đội / Vị trí)</label>
              <textarea
                rows={2}
                placeholder="VD: Đánh đôi Pickleball cùng VĐV Trần Văn Bình / Đội hình kéo co 5 Nam 5 Nữ..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            {/* CAM KẾT TỰ CHỊU TRÁCH NHIỆM SỨC KHỎE */}
            <div style={{ marginBottom: '18px', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={healthAgreed}
                  onChange={e => setHealthAgreed(e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                <span><strong>Cam kết sức khỏe (*):</strong> Tôi cam kết tự chịu trách nhiệm về sức khỏe của bản thân trong quá trình tham gia thi đấu giải theo đúng kế hoạch của Ban Tổ Chức.</span>
              </label>
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
              <Trophy size={20} color="#166534" /> DANH SÁCH VĐV ĐÃ ĐĂNG KÝ ({filteredRegistrations.length})
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
                {allAvailableSports.map(sp => (
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
                    <th style={{ padding: '10px 8px' }}>TRẠNG THÁI</th>
                    <th style={{ padding: '10px 8px' }}>GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#1e293b' }}>
                        {item.full_name}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '11.5px' }}>
                          {item.sport_name}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#475569', fontFamily: 'monospace' }}>{item.phone ? item.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '***'}</td>
                      <td style={{ padding: '10px 8px', color: '#64748b' }}>{item.cohort_year || '-'}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#334155' }}>{item.unit_name}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '10px', background: item.fee_amount === 0 ? '#dcfce7' : '#fef9c3', color: item.fee_amount === 0 ? '#166534' : '#854d0e' }}>
                          {item.payment_status || (item.fee_amount === 0 ? 'Miễn phí' : '300.000đ')}
                        </span>
                      </td>
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
