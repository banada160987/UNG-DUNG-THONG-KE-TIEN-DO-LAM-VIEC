import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Trophy, Award, CheckCircle2, Search, Filter, Sparkles, 
  UserCheck, ShieldCheck, AlertCircle, Phone, Calendar, 
  HeartHandshake, Users, Eye, X, ChevronRight, User, Check, MessageCircle
} from 'lucide-react';

export const OFFICIAL_ZALO_GROUP = 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa';

export const ALL_CBQ_CLASSES = [
  '12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10',
  '11A01', '11A02', '11A03', '11A04', '11A05', '11A06', '11A07', '11A08', '11A09',
  '10A01', '10A02', '10A03', '10A04', '10A05', '10A06', '10A07', '10A08', '10A09', '10A10', '10A11', '10A12', '10A13', '10A14', '10A15'
];

const DIVISION_A_SPORTS = [
  'Bóng đá Futsal Nam (2 hiệp x 20 phút)',
  'Kéo co Nam Nữ phối hợp (5 Nam, 5 Nữ)',
  'Bóng chuyền hơi Nữ (dự kiến 6 đội)',
  'Pickleball (đôi Nam)',
  'Pickleball (đôi Nữ)',
  'Pickleball (đôi Nam - Nữ)'
];

const USER_CATEGORIES = [
  { label: 'Cựu học sinh các niên khóa (Bảng A - 300.000đ)', division: 'A', fee: 300000 },
  { label: 'Giáo viên / Cựu giáo viên (Bảng A - 300.000đ)', division: 'A', fee: 300000 },
  { label: 'Khách mời Đại biểu / Đội khách (300.000đ)', division: 'A', fee: 300000 }
];

export default function PublicSportsRegister() {
  const [activeTab, setActiveTab] = useState('volleyball_20_11'); // 'volleyball_20_11' | 'anniversary_30'
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 🏐 STATE FORM ĐĂNG KÝ BÓNG CHUYỀN 20/11 (THEO LỚP)
  const [selectedClass, setSelectedClass] = useState(ALL_CBQ_CLASSES[0]);
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [gvcnName, setGvcnName] = useState('');
  const [male1, setMale1] = useState('');
  const [male2, setMale2] = useState('');
  const [male3, setMale3] = useState('');
  const [female1, setFemale1] = useState('');
  const [female2, setFemale2] = useState('');
  const [female3, setFemale3] = useState('');
  const [reserves, setReserves] = useState('');
  const [volleyballNotes, setVolleyballNotes] = useState('');
  const [healthAgreedVb, setHealthAgreedVb] = useState(true);

  // ⚽ STATE FORM HỘI THAO 30 NĂM (BẢNG A GIAO LƯU)
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(USER_CATEGORIES[0]);
  const [fullName30, setFullName30] = useState('');
  const [sportName30, setSportName30] = useState(DIVISION_A_SPORTS[0]);
  const [phone30, setPhone30] = useState('');
  const [cohortYear30, setCohortYear30] = useState('');
  const [unitName30, setUnitName30] = useState('');
  const [notes30, setNotes30] = useState('');
  const [healthAgreed30, setHealthAgreed30] = useState(true);

  // MODAL CHI TIẾT ĐỘI HÌNH
  const [viewTeamModal, setViewTeamModal] = useState(null);

  // FILTER & SEARCH
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  async function fetchRegistrations() {
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
  }

  // Danh sách các đội bóng chuyền 20/11
  const volleyballTeams = useMemo(() => {
    return registrations.filter(r => 
      (r.sport_name || '').includes('20/11') || 
      (r.sport_name || '').includes('Bóng chuyền Nam - Nữ phối hợp') ||
      (r.user_category || '').includes('Học sinh')
    );
  }, [registrations]);

  // Danh sách các lớp đã đăng ký bóng chuyền
  const registeredClasses = useMemo(() => {
    return new Set(volleyballTeams.map(r => r.cohort_year || r.unit_name).filter(Boolean));
  }, [volleyballTeams]);

  // Kiểm tra xem lớp đang chọn đã đăng ký chưa
  const isSelectedClassRegistered = registeredClasses.has(selectedClass);

  // XỬ LÝ NỘP ĐĂNG KÝ BÓNG CHUYỀN 20/11
  const handleSubmitVolleyball = async (e) => {
    e.preventDefault();
    if (!selectedClass || !captainName.trim() || !captainPhone.trim() || !gvcnName.trim()) {
      alert("Vui lòng điền đầy đủ Lớp, Đội trưởng, Số điện thoại và GVCN xác nhận (*)");
      return;
    }
    if (!male1.trim() || !male2.trim() || !male3.trim()) {
      alert("Vui lòng điền đủ họ tên của 03 Vận động viên Nam chính thức (*)");
      return;
    }
    if (!female1.trim() || !female2.trim() || !female3.trim()) {
      alert("Vui lòng điền đủ họ tên của 03 Vận động viên Nữ chính thức (*)");
      return;
    }
    if (!healthAgreedVb) {
      alert("Vui lòng tích chọn cam kết đảm bảo sức khỏe và xác nhận của GVCN.");
      return;
    }

    if (isSelectedClassRegistered) {
      const conf = window.confirm(`Lớp ${selectedClass} đã có một bản đăng ký trong hệ thống. Bạn có muốn gửi thêm hoặc cập nhật lại danh sách đội hình không?`);
      if (!conf) return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const rosterData = {
      tournament: 'Giải Bóng chuyền Nam Nữ phối hợp chào mừng 20/11',
      academic_year: '2026-2027',
      class: selectedClass,
      captain: captainName.trim(),
      captain_phone: captainPhone.trim(),
      gvcn: gvcnName.trim(),
      male_athletes: [male1.trim(), male2.trim(), male3.trim()],
      female_athletes: [female1.trim(), female2.trim(), female3.trim()],
      reserves: reserves.trim() || 'Không có',
      extra_notes: volleyballNotes.trim() || ''
    };

    const newReg = {
      full_name: `Đội Lớp ${selectedClass} (Đội trưởng: ${captainName.trim()})`,
      sport_name: 'Bóng chuyền Nam - Nữ phối hợp (20/11)',
      phone: captainPhone.trim(),
      cohort_year: selectedClass,
      unit_name: `Chi đoàn ${selectedClass}`,
      notes: JSON.stringify(rosterData),
      user_category: 'Học sinh đang học tại trường (Bảng B - Miễn phí)',
      fee_amount: 0,
      payment_status: 'Miễn phí (Học sinh)',
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

      setSuccessMsg(
        `🎉 ĐĂNG KÝ THÀNH CÔNG ĐỘI BÓNG CHUYỀN LỚP ${selectedClass}!\n` +
        `• Đội trưởng: ${captainName.trim()} (${captainPhone.trim()})\n` +
        `• GVCN xác nhận: ${gvcnName.trim()}\n` +
        `• Đội hình chính thức: 3 Nam (${male1}, ${male2}, ${male3}) + 3 Nữ (${female1}, ${female2}, ${female3})\n\n` +
        `👉 QUAN TRỌNG: Kính mời Đội trưởng và Đại diện lớp tham gia ngay nhóm Zalo Giải đấu để nhận thông báo bốc thăm và lịch thi đấu từ Ban Tổ Chức:\n` +
        `🔗 ${OFFICIAL_ZALO_GROUP}`
      );

      // Reset fields
      setCaptainName('');
      setCaptainPhone('');
      setGvcnName('');
      setMale1('');
      setMale2('');
      setMale3('');
      setFemale1('');
      setFemale2('');
      setFemale3('');
      setReserves('');
      setVolleyballNotes('');

    } catch (err) {
      console.error("Lỗi đăng ký bóng chuyền:", err);
      alert("Không thể gửi đăng ký. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // XỬ LÝ NỘP HỘI THAO 30 NĂM (BẢNG A)
  const handleSubmit30 = async (e) => {
    e.preventDefault();
    if (!fullName30.trim() || !phone30.trim() || !unitName30.trim()) {
      alert("Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)");
      return;
    }
    if (!healthAgreed30) {
      alert("Vui lòng tích chọn cam kết tự chịu trách nhiệm sức khỏe khi thi đấu.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const newReg = {
      full_name: fullName30.trim(),
      sport_name: sportName30,
      phone: phone30.trim(),
      cohort_year: cohortYear30.trim() || 'Không có',
      unit_name: unitName30.trim(),
      notes: notes30.trim() || '',
      user_category: selectedCategoryObj.label,
      fee_amount: selectedCategoryObj.fee,
      payment_status: 'Chờ nộp kinh phí (300.000đ)',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('cbq_sports_registrations')
        .insert([newReg])
        .select();

      if (error) {
        const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
        const updatedLocal = [newReg, ...local];
        localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
        setRegistrations(updatedLocal);
      } else if (data) {
        setRegistrations(prev => [data[0], ...prev]);
      }

      setSuccessMsg(
        `🎉 ĐĂNG KÝ THÀNH CÔNG (BẢNG A)!\nVĐV ${fullName30} (${unitName30}) đã hoàn tất đăng ký môn "${sportName30}".\n` +
        `📌 LƯU Ý KINH PHÍ TỔ CHỨC: 300.000đ/VĐV.\nVui lòng liên hệ / chuyển khoản cho Thầy Nguyễn Công Sự (SĐT/Zalo: 0366190199) để xác nhận vị trí thi đấu.`
      );

      setFullName30('');
      setPhone30('');
      setCohortYear30('');
      setNotes30('');
    } catch (err) {
      console.error(err);
      alert("Không thể gửi đăng ký. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc danh sách bóng chuyền hiển thị
  const filteredVolleyballTeams = volleyballTeams.filter(item => {
    const matchClass = filterClass === 'ALL' || (item.cohort_year || '').includes(filterClass);
    const matchSearch = (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.unit_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone || '').includes(searchQuery) ||
      (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '20px 15px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BANNER CHÍNH THỨC */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0369a1 50%, #0284c7 100%)',
        borderRadius: '20px',
        padding: '28px 22px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 12px 28px rgba(2, 132, 199, 0.25)',
        marginBottom: '22px'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', padding: '5px 16px', borderRadius: '30px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '12px' }}>
          <Sparkles size={15} color="#fde047" /> ĐOÀN TRƯỜNG THPT CAO BÁ QUÁT • TỔ GIÁO DỤC THỂ CHẤT • NĂM HỌC 2026 - 2027
        </div>
        
        <h1 style={{ margin: '0 0 10px 0', fontSize: '26px', color: '#fde047', textShadow: '0 2px 8px rgba(0,0,0,0.4)', lineHeight: 1.3 }}>
          🏐 CỔNG ĐĂNG KÝ THI ĐẤU GIẢI BÓNG CHUYỀN CHÀO MỪNG 20/11
        </h1>

        <p style={{ margin: '0 auto 16px auto', maxWidth: '820px', fontSize: '14.5px', color: '#e0f2fe', lineHeight: '1.6' }}>
          Thi đấu Bóng chuyền Nam Nữ phối hợp giữa các Chi đoàn Lớp chào mừng Ngày Nhà Giáo Việt Nam 20/11.
          Mỗi lớp thành lập 01 đội thi đấu gồm <strong>06 VĐV chính thức (3 Nam + 3 Nữ)</strong> trên sân.
        </p>

        {/* THÔNG TIN THỜI HẠN & LIÊN HỆ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(6px)', padding: '14px 18px', borderRadius: '14px', textAlign: 'left', border: '1px solid rgba(253,224,71,0.4)', fontSize: '13.5px' }}>
          <div>
            <Calendar size={16} color="#fde047" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            <strong>Thời hạn đăng ký:</strong> <span style={{ color: '#fde047', fontWeight: 'bold' }}>Từ 20/10/2026 đến hết 30/10/2026</span>
          </div>
          <div>
            <Trophy size={16} color="#fde047" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            <strong>Thể thức thi đấu:</strong> Bốc thăm thi đấu loại trực tiếp
          </div>
          <div>
            <CheckCircle2 size={16} color="#4ade80" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            <strong>Kinh phí tham gia:</strong> <span style={{ color: '#4ade80', fontWeight: 'bold' }}>MIỄN PHÍ 100% CHO HỌC SINH</span>
          </div>
        </div>

        {/* NÚT THAM GIA NHÓM ZALO CHÍNH THỨC */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <a
            href={OFFICIAL_ZALO_GROUP}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0068ff',
              color: '#ffffff',
              padding: '9px 20px',
              borderRadius: '24px',
              fontWeight: 'bold',
              fontSize: '13.5px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0, 104, 255, 0.45)'
            }}
          >
            <MessageCircle size={17} /> 💬 Tham Gia Nhóm Zalo Đội Trưởng & GVCN (Nhận Lịch Bốc Thăm)
          </a>
        </div>
      </div>

      {/* CHUYỂN ĐỔI TAB GIẢI ĐẤU */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('volleyball_20_11')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'volleyball_20_11' ? '#0284c7' : '#f1f5f9',
            color: activeTab === 'volleyball_20_11' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'volleyball_20_11' ? '0 4px 12px rgba(2,132,199,0.25)' : 'none'
          }}
        >
          <Trophy size={16} /> 🏐 Giải Bóng Chuyền 20/11 (Theo Lớp - Học Sinh)
        </button>

        <button
          onClick={() => setActiveTab('anniversary_30')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'anniversary_30' ? '#7c3aed' : '#f1f5f9',
            color: activeTab === 'anniversary_30' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Award size={16} /> 🏃 Hội Thao Kỷ Niệm 30 Năm (Bảng A - CHS & GV)
        </button>
      </div>

      {/* THÔNG BÁO THÀNH CÔNG */}
      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#166534', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', marginBottom: '22px', whiteSpace: 'pre-line', boxShadow: '0 4px 12px rgba(22,101,52,0.08)' }}>
          {successMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: GIẢI BÓNG CHUYỀN 20/11 (HỌC SINH THEO LỚP) */}
      {/* ========================================================================= */}
      {activeTab === 'volleyball_20_11' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* CỘT TRÁI: FORM ĐĂNG KÝ THEO LỚP */}
          <div style={{ flex: '1 1 480px', background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: 'bold', fontSize: '16px' }}>
                <UserCheck size={20} color="#0369a1" /> HỒ SƠ ĐĂNG KÝ ĐỘI BÓNG CHUYỀN (*)
              </div>
              <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontWeight: 'bold' }}>
                Miễn phí 100%
              </span>
            </div>

            <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: '#0369a1', lineHeight: '1.4' }}>
                <span style={{ fontWeight: 'bold' }}>📢 Nhóm Zalo Đội Trưởng & GVCN:</span> Tham gia ngay để BTC thông báo giờ bốc thăm & lịch đấu.
              </div>
              <a
                href={OFFICIAL_ZALO_GROUP}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '6px 14px',
                  background: '#0068ff',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <MessageCircle size={14} /> Vào Zalo Ngay
              </a>
            </div>

            <form onSubmit={handleSubmitVolleyball}>
              
              {/* 1. CHỌN LỚP */}
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Chi Đoàn Lớp Tham Gia *</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  style={{ ...styles.select, fontWeight: 'bold', color: '#0369a1', fontSize: '15px' }}
                >
                  {ALL_CBQ_CLASSES.map(cls => {
                    const isReg = registeredClasses.has(cls);
                    return (
                      <option key={cls} value={cls}>
                        Lớp {cls} {isReg ? '✅ (Đã gửi danh sách)' : ''}
                      </option>
                    );
                  })}
                </select>
                {isSelectedClassRegistered && (
                  <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={13} /> Lớp <strong>{selectedClass}</strong> đã có đội đăng ký. Gửi lại sẽ cập nhật/bổ sung hồ sơ.
                  </div>
                )}
              </div>

              {/* 2. ĐỘI TRƯỞNG & SĐT & GVCN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={styles.label}>Họ và Tên Đội Trưởng *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn Nam"
                    value={captainName}
                    onChange={e => setCaptainName(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>SĐT / Zalo Đội Trưởng *</label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0912 345 678"
                    value={captainPhone}
                    onChange={e => setCaptainPhone(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Giáo Viên Chủ Nhiệm / Phụ Trách Xác Nhận *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thầy/Cô Trần Thị Lan (GVCN 12A01)"
                  value={gvcnName}
                  onChange={e => setGvcnName(e.target.value)}
                  style={styles.input}
                />
              </div>

              {/* 3. DANH SÁCH 06 VẬN ĐỘNG VIÊN CHÍNH THỨC (3 NAM + 3 NỮ) */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="#0284c7" /> DANH SÁCH 06 VĐV THI ĐẤU CHÍNH THỨC (3 NAM + 3 NỮ) (*)
                </div>

                {/* 3 VĐV NAM */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1', marginBottom: '6px' }}>
                    👦 03 Vận Động Viên Nam Chính Thức:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      placeholder="VĐV Nam 1 *"
                      value={male1}
                      onChange={e => setMale1(e.target.value)}
                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                    />
                    <input
                      type="text"
                      required
                      placeholder="VĐV Nam 2 *"
                      value={male2}
                      onChange={e => setMale2(e.target.value)}
                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                    />
                    <input
                      type="text"
                      required
                      placeholder="VĐV Nam 3 *"
                      value={male3}
                      onChange={e => setMale3(e.target.value)}
                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                    />
                  </div>
                </div>

                {/* 3 VĐV NỮ */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e11d48', marginBottom: '6px' }}>
                    👧 03 Vận Động Viên Nữ Chính Thức:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      placeholder="VĐV Nữ 1 *"
                      value={female1}
                      onChange={e => setFemale1(e.target.value)}
                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                    />
                    <input
                      type="text"
                      required
                      placeholder="VĐV Nữ 2 *"
                      value={female2}
                      onChange={e => setFemale2(e.target.value)}
                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                    />
                    <input
                      type="text"
                      required
                      placeholder="VĐV Nữ 3 *"
                      value={female3}
                      onChange={e => setFemale3(e.target.value)}
                      style={{ ...styles.input, fontSize: '13px', padding: '8px 10px' }}
                    />
                  </div>
                </div>
              </div>

              {/* 4. VẬN ĐỘNG VIÊN DỰ BỊ */}
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Vận Động Viên Dự Bị (Nếu có)</label>
                <input
                  type="text"
                  placeholder="VD: Nam: Trần Văn D, Lê Văn E; Nữ: Phạm Thị B..."
                  value={reserves}
                  onChange={e => setReserves(e.target.value)}
                  style={styles.input}
                />
              </div>

              {/* 5. GHI CHÚ */}
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Ghi Chú Thêm (Màu áo thi đấu / Lưu ý)</label>
                <textarea
                  rows={2}
                  placeholder="VD: Màu áo thi đấu của lớp: Xanh dương..."
                  value={volleyballNotes}
                  onChange={e => setVolleyballNotes(e.target.value)}
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              {/* 6. CAM KẾT SỨC KHỎE */}
              <div style={{ marginBottom: '18px', background: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: '#166534', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={healthAgreedVb}
                    onChange={e => setHealthAgreedVb(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span><strong>Cam kết & Xác nhận (*):</strong> Tất cả VĐV có tên trong danh sách đủ điều kiện sức khỏe thi đấu thể thao và đã được Giáo viên chủ nhiệm phê duyệt tham gia giải.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.submitBtn,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                }}
              >
                {submitting ? 'Đang gửi hồ sơ...' : '🏐 XÁC NHẬN ĐĂNG KÝ ĐỘI BÓNG CHUYỀN LỚP'}
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: DANH SÁCH CÁC ĐỘI LỚP ĐÃ ĐĂNG KÝ */}
          <div style={{ flex: '2 1 520px', minWidth: 0, background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '16px' }}>
                <Trophy size={20} color="#166534" /> DANH SÁCH ĐỘI BÓNG CHUYỀN CÁC LỚP ({filteredVolleyballTeams.length} Đội)
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Tiến độ: <strong>{registeredClasses.size} / {ALL_CBQ_CLASSES.length}</strong> lớp
              </span>
            </div>

            {/* THANH TÌM KIẾM & LỌC */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Tìm Lớp, Đội trưởng hoặc SĐT..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>

              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
              >
                <option value="ALL">Tất cả các khối</option>
                <option value="12A">Khối 12</option>
                <option value="11A">Khối 11</option>
                <option value="10A">Khối 10</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang nạp danh sách đội bóng...</div>
            ) : filteredVolleyballTeams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 15px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
                Chưa có lớp nào gửi hồ sơ. Hãy là Chi đoàn đầu tiên ghi danh thi đấu!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', width: '40px' }}>STT</th>
                      <th style={{ padding: '10px 8px' }}>CHI ĐOÀN LỚP</th>
                      <th style={{ padding: '10px 8px' }}>ĐỘI TRƯỞNG</th>
                      <th style={{ padding: '10px 8px' }}>SĐT LIÊN HỆ</th>
                      <th style={{ padding: '10px 8px' }}>GVCN XÁC NHẬN</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }}>ĐỘI HÌNH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVolleyballTeams.map((item, idx) => {
                      let roster = null;
                      try {
                        roster = JSON.parse(item.notes);
                      } catch (e) {}

                      return (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#0369a1' }}>
                            <span style={{ display: 'inline-block', padding: '3px 8px', background: '#e0f2fe', borderRadius: '6px' }}>
                              Lớp {item.cohort_year || item.unit_name}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: '600', color: '#1e293b' }}>
                            {roster?.captain || item.full_name.replace(/Đội Lớp .*\(Đội trưởng: (.*)\)/, '$1')}
                          </td>
                          <td style={{ padding: '10px 8px', color: '#475569', fontFamily: 'monospace' }}>
                            {item.phone ? item.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '***'}
                          </td>
                          <td style={{ padding: '10px 8px', color: '#64748b' }}>
                            {roster?.gvcn || 'Đã xác nhận'}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => setViewTeamModal({ item, roster })}
                              style={{
                                padding: '5px 10px',
                                background: '#7c3aed',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Xem chi tiết danh sách 3 Nam + 3 Nữ"
                            >
                              <Eye size={13} /> Đội Hình
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HỘI THAO KỶ NIỆM 30 NĂM (BẢNG A GIAO LƯU CHS & GV) */}
      {/* ========================================================================= */}
      {activeTab === 'anniversary_30' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
          
          <div style={{ flex: '1 1 380px', background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 'bold', fontSize: '16px', marginBottom: '14px', borderBottom: '1.5px solid #ede9fe', paddingBottom: '10px' }}>
              <Award size={20} color="#7c3aed" /> ĐĂNG KÝ HỘI THAO GIAO LƯU 30 NĂM (BẢNG A)
            </div>

            <form onSubmit={handleSubmit30}>
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Đối Tượng Dự Thi *</label>
                <select
                  value={selectedCategoryObj.label}
                  onChange={e => setSelectedCategoryObj(USER_CATEGORIES.find(c => c.label === e.target.value) || USER_CATEGORIES[0])}
                  style={styles.select}
                >
                  {USER_CATEGORIES.map(cat => (
                    <option key={cat.label} value={cat.label}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Thông tin nộp kinh phí */}
              <div style={{ background: '#fffbebe6', border: '1px solid #fde047', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', color: '#854d0e', marginBottom: '14px' }}>
                💰 <strong>ĐỐI TƯỢNG BẢNG A (GV & CHS):</strong> Đóng góp <strong>300.000 VNĐ / 1 VĐV</strong> (Kinh phí xã hội hóa tổ chức giải & cúp huy chương).
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Họ và Tên Vận Động Viên *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={fullName30}
                  onChange={e => setFullName30(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Môn Thi Đấu Đăng Ký *</label>
                <select
                  value={sportName30}
                  onChange={e => setSportName30(e.target.value)}
                  style={{ ...styles.select, fontWeight: 'bold', color: '#7c3aed' }}
                >
                  {DIVISION_A_SPORTS.map(sp => <option key={sp} value={sp}>🏅 {sp}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Số Điện Thoại / Zalo *</label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0987 654 321"
                  value={phone30}
                  onChange={e => setPhone30(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Niên Khóa / Đơn Vị *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hội CHS Khóa 2005 / Tổ Giáo Viên"
                  value={unitName30}
                  onChange={e => setUnitName30(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Ghi Chú (Đồng đội / Vị trí)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm..."
                  value={notes30}
                  onChange={e => setNotes30(e.target.value)}
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={healthAgreed30}
                    onChange={e => setHealthAgreed30(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>Tôi cam kết tự chịu trách nhiệm về sức khỏe trong quá trình thi đấu.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ ...styles.submitBtn, background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
              >
                {submitting ? 'Đang gửi...' : '🚀 XÁC NHẬN ĐĂNG KÝ BẢNG A'}
              </button>
            </form>
          </div>

          <div style={{ flex: '2 1 500px', background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>
              Danh Sách VĐV Giao Lưu Đã Đăng Ký
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              VĐV Bảng A nộp kinh phí 300.000đ trực tiếp cho BTC hoặc chuyển khoản theo hướng dẫn để được phê duyệt số đeo thi đấu.
            </p>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XEM CHI TIẾT ĐỘI HÌNH BÓNG CHUYỀN (3 NAM + 3 NỮ) */}
      {/* ========================================================================= */}
      {viewTeamModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '560px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0369a1' }}>
                  🏐 Đội Bóng Chuyền Lớp {viewTeamModal.item.cohort_year || viewTeamModal.item.unit_name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Giải Bóng chuyền Nam Nữ phối hợp chào mừng 20/11
                </span>
              </div>
              <button
                onClick={() => setViewTeamModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={22} color="#64748b" />
              </button>
            </div>

            {/* THÔNG TIN CHUNG */}
            <div style={{ background: '#f0f9ff', padding: '12px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', border: '1px solid #bae6fd' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Đội trưởng:</strong> {viewTeamModal.roster?.captain || viewTeamModal.item.full_name} • <strong>SĐT:</strong> {viewTeamModal.item.phone}
              </div>
              <div>
                <strong>GVCN / Phụ trách:</strong> {viewTeamModal.roster?.gvcn || 'Đã xác nhận'}
              </div>
            </div>

            {/* DANH SÁCH 6 VĐV TRÊN SÂN */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                Thành phần thi đấu chính thức (3 Nam + 3 Nữ):
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* CỘT NAM */}
                <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>
                    👦 03 VĐV NAM CHÍNH THỨC:
                  </div>
                  {(viewTeamModal.roster?.male_athletes || ['VĐV Nam 1', 'VĐV Nam 2', 'VĐV Nam 3']).map((m, i) => (
                    <div key={i} style={{ fontSize: '12.5px', color: '#1e293b', padding: '3px 0' }}>
                      {i + 1}. <strong>{m}</strong>
                    </div>
                  ))}
                </div>

                {/* CỘT NỮ */}
                <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#be123c', marginBottom: '6px' }}>
                    👧 03 VĐV NỮ CHÍNH THỨC:
                  </div>
                  {(viewTeamModal.roster?.female_athletes || ['VĐV Nữ 1', 'VĐV Nữ 2', 'VĐV Nữ 3']).map((f, i) => (
                    <div key={i} style={{ fontSize: '12.5px', color: '#1e293b', padding: '3px 0' }}>
                      {i + 1}. <strong>{f}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DỰ BỊ & GHI CHÚ */}
            {viewTeamModal.roster?.reserves && viewTeamModal.roster?.reserves !== 'Không có' && (
              <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>
                <strong>VĐV Dự bị:</strong> {viewTeamModal.roster.reserves}
              </div>
            )}

            {viewTeamModal.roster?.extra_notes && (
              <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '14px' }}>
                <strong>Ghi chú:</strong> {viewTeamModal.roster.extra_notes}
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setViewTeamModal(null)}
                style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  label: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '5px'
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '13.5px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '13.5px',
    background: '#ffffff',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
    transition: 'all 0.2s ease'
  }
};
