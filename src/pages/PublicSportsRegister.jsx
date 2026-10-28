import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Trophy, Award, CheckCircle2, Search, Filter, Sparkles, 
  UserCheck, ShieldCheck, AlertCircle, Phone, Calendar, 
  HeartHandshake, Users, Eye, X, ChevronRight, User, Check, MessageCircle,
  Clock, Lock, ShieldAlert, AlertTriangle, ArrowRight
} from 'lucide-react';
import { 
  fetchTournaments, 
  checkTournamentStatus, 
  DEFAULT_TOURNAMENTS 
} from '../services/sportsTournamentService';

export const OFFICIAL_ZALO_GROUP = 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa';

export const ALL_CBQ_CLASSES = [
  '12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10',
  '11A01', '11A02', '11A03', '11A04', '11A05', '11A06', '11A07', '11A08', '11A09',
  '10A01', '10A02', '10A03', '10A04', '10A05', '10A06', '10A07', '10A08', '10A09', '10A10', '10A11', '10A12', '10A13', '10A14', '10A15'
];

export const USER_CATEGORIES = [
  { label: 'Học sinh đang học tại trường (Miễn phí)', fee: 0 },
  { label: 'Cựu học sinh các niên khóa (Bảng A - 300.000đ)', fee: 300000 },
  { label: 'Giáo viên / Cán bộ nhân viên (Bảng A - 300.000đ)', fee: 300000 },
  { label: 'Khách mời Đại biểu / Đội khách (300.000đ)', fee: 300000 }
];

export default function PublicSportsRegister() {
  const [tournaments, setTournaments] = useState(DEFAULT_TOURNAMENTS);
  const [selectedTournId, setSelectedTournId] = useState(DEFAULT_TOURNAMENTS[0].id);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 🏐 STATE FORM ĐĂNG KÝ THEO ĐỘI LỚP (CLASS TEAM)
  const [selectedClass, setSelectedClass] = useState(ALL_CBQ_CLASSES[0]);
  const [selectedSportTeam, setSelectedSportTeam] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [gvcnName, setGvcnName] = useState('');
  const [maleAthletes, setMaleAthletes] = useState(['', '', '']);
  const [femaleAthletes, setFemaleAthletes] = useState(['', '', '']);
  const [reserves, setReserves] = useState('');
  const [volleyballNotes, setVolleyballNotes] = useState('');
  const [healthAgreedTeam, setHealthAgreedTeam] = useState(true);

  // 🏃 STATE FORM ĐĂNG KÝ CÁ NHÂN / TỰ DO (INDIVIDUAL)
  const [fullNameInd, setFullNameInd] = useState('');
  const [phoneInd, setPhoneInd] = useState('');
  const [unitNameInd, setUnitNameInd] = useState('');
  const [selectedSportInd, setSelectedSportInd] = useState('');
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(USER_CATEGORIES[0]);
  const [notesInd, setNotesInd] = useState('');
  const [healthAgreedInd, setHealthAgreedInd] = useState(true);

  // MODAL CHI TIẾT ĐỘI HÌNH
  const [viewTeamModal, setViewTeamModal] = useState(null);

  // FILTER & SEARCH
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const tourns = await fetchTournaments();
      setTournaments(tourns);
      if (tourns.length > 0 && !tourns.some(t => t.id === selectedTournId)) {
        setSelectedTournId(tourns[0].id);
      }
      await fetchRegistrations();
    } catch (err) {
      console.warn("Lỗi nạp dữ liệu thể thao:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRegistrations() {
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
    }
  }

  // Giải đấu đang chọn
  const activeTourn = useMemo(() => {
    return tournaments.find(t => t.id === selectedTournId) || tournaments[0] || null;
  }, [tournaments, selectedTournId]);

  // Trạng thái mở / đóng của giải đấu đang chọn
  const registrationStatus = useMemo(() => {
    return checkTournamentStatus(activeTourn);
  }, [activeTourn]);

  // Cập nhật môn mặc định khi chuyển giải
  useEffect(() => {
    if (activeTourn && activeTourn.sports && activeTourn.sports.length > 0) {
      setSelectedSportTeam(activeTourn.sports[0]);
      setSelectedSportInd(activeTourn.sports[0]);
    }
  }, [activeTourn]);

  // Khởi tạo số ô VĐV Nam/Nữ tương ứng với cấu hình giải
  useEffect(() => {
    if (activeTourn?.team_config) {
      const maleCount = activeTourn.team_config.male_count || 3;
      const femaleCount = activeTourn.team_config.female_count || 3;
      setMaleAthletes(Array(maleCount).fill(''));
      setFemaleAthletes(Array(femaleCount).fill(''));
    }
  }, [activeTourn]);

  // Danh sách các đăng ký thuộc giải đấu đang chọn
  const activeTournRegistrations = useMemo(() => {
    if (!activeTourn) return registrations;
    return registrations.filter(r => {
      if (r.table_group === activeTourn.id) return true;
      if (!r.table_group) {
        const isVb = (r.sport_name || '').includes('Bóng chuyền') || (r.sport_name || '').includes('20/11');
        if (activeTourn.id === 'tourn-2026-volleyball-20-11' && isVb) return true;
        if (activeTourn.id === 'tourn-2026-hoi-thao-30-nam' && !isVb) return true;
      }
      return false;
    });
  }, [registrations, activeTourn]);

  // Danh sách các lớp đã đăng ký trong giải này
  const registeredClasses = useMemo(() => {
    return new Set(activeTournRegistrations.map(r => r.cohort_year || r.unit_name).filter(Boolean));
  }, [activeTournRegistrations]);

  // Kiểm tra đội đã đăng ký của lớp đang chọn
  const existingTeamOfSelectedClass = useMemo(() => {
    if (activeTourn?.format !== 'class_team') return null;
    return activeTournRegistrations.find(r => 
      (r.cohort_year === selectedClass || (r.unit_name || '').includes(selectedClass))
    ) || null;
  }, [activeTournRegistrations, selectedClass, activeTourn]);

  // Cập nhật mảng VĐV Nam
  const handleMaleAthleteChange = (index, value) => {
    setMaleAthletes(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Cập nhật mảng VĐV Nữ
  const handleFemaleAthleteChange = (index, value) => {
    setFemaleAthletes(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // ================= XỬ LÝ NỘP FORM ĐỘI LỚP =================
  const handleSubmitClassTeam = async (e) => {
    e.preventDefault();

    if (!registrationStatus.allowed) {
      alert(`❌ CỔNG TIẾP NHẬN ĐANG KHÓA:\n${registrationStatus.message}`);
      return;
    }

    if (activeTourn?.prevent_duplicate && existingTeamOfSelectedClass) {
      alert(
        `❌ KHÔNG THỂ NỘP:\n` +
        `Chi đoàn Lớp ${selectedClass} đã có một bản đăng ký trong giải "${activeTourn.name}"!\n` +
        `Theo Điều lệ, mỗi lớp chỉ đăng ký 01 đội. Nếu cần sửa VĐV, vui lòng liên hệ Ban Tổ Chức.`
      );
      return;
    }

    if (!selectedClass || !captainName.trim() || !captainPhone.trim()) {
      alert("Vui lòng điền đầy đủ Lớp, Họ tên Đội trưởng và Số điện thoại liên hệ (*)");
      return;
    }

    if (activeTourn?.team_config?.require_gvcn && !gvcnName.trim()) {
      alert("Vui lòng nhập Họ tên Giáo viên Chủ nhiệm (GVCN) xác nhận (*)");
      return;
    }

    const maleValid = maleAthletes.filter(m => m.trim());
    const femaleValid = femaleAthletes.filter(f => f.trim());
    const reqMale = activeTourn?.team_config?.male_count || 0;
    const reqFemale = activeTourn?.team_config?.female_count || 0;

    if (reqMale > 0 && maleValid.length < reqMale) {
      alert(`Vui lòng điền đủ họ tên của ${reqMale} Vận động viên Nam chính thức (*)`);
      return;
    }
    if (reqFemale > 0 && femaleValid.length < reqFemale) {
      alert(`Vui lòng điền đủ họ tên của ${reqFemale} Vận động viên Nữ chính thức (*)`);
      return;
    }

    if (!healthAgreedTeam) {
      alert("Vui lòng tích chọn cam kết đảm bảo sức khỏe và xác nhận.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const rosterData = {
      tournament_id: activeTourn.id,
      tournament_name: activeTourn.name,
      academic_year: activeTourn.academic_year || '2026-2027',
      class: selectedClass,
      captain: captainName.trim(),
      captain_phone: captainPhone.trim(),
      gvcn: gvcnName.trim(),
      male_athletes: maleValid,
      female_athletes: femaleValid,
      reserves: reserves.trim() || 'Không có',
      extra_notes: volleyballNotes.trim() || ''
    };

    const newReg = {
      full_name: `Đội Lớp ${selectedClass} (Đội trưởng: ${captainName.trim()})`,
      sport_name: selectedSportTeam || activeTourn.sports[0] || 'Thể thao học sinh',
      phone: captainPhone.trim(),
      cohort_year: selectedClass,
      unit_name: `Chi đoàn ${selectedClass}`,
      table_group: activeTourn.id, // 🎯 Lưu trực tiếp vào Database!
      notes: JSON.stringify(rosterData),
      user_category: 'Học sinh đang học tại trường (Miễn phí)',
      fee_amount: activeTourn.fee_amount || 0,
      payment_status: activeTourn.fee_amount === 0 ? 'Miễn phí (Học sinh)' : 'Chờ nộp',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('cbq_sports_registrations')
        .insert([newReg])
        .select();

      if (error) {
        console.warn("Supabase fallback:", error);
        const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
        const updatedLocal = [newReg, ...local];
        localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
        setRegistrations(updatedLocal);
      } else if (data) {
        setRegistrations(prev => [data[0], ...prev]);
      }

      setSuccessMsg(
        `🎉 ĐĂNG KÝ THÀNH CÔNG ĐỘI THI ĐẤU LỚP ${selectedClass}!\n` +
        `• Giải đấu: ${activeTourn.name}\n` +
        `• Môn thi: ${newReg.sport_name}\n` +
        `• Đội trưởng: ${captainName.trim()} (${captainPhone.trim()})\n` +
        `• GVCN xác nhận: ${gvcnName.trim() || 'Đã xác nhận'}\n\n` +
        `👉 Kính mời Đội trưởng và Đại diện lớp tham gia nhóm Zalo giải đấu để nhận thông báo bốc thăm và lịch thi đấu:\n` +
        `🔗 ${activeTourn.zalo_link || OFFICIAL_ZALO_GROUP}`
      );

      // Reset
      setCaptainName('');
      setCaptainPhone('');
      setGvcnName('');
      setMaleAthletes(Array(reqMale).fill(''));
      setFemaleAthletes(Array(reqFemale).fill(''));
      setReserves('');
      setVolleyballNotes('');

    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      alert("Không thể gửi hồ sơ. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // ================= XỬ LÝ NỘP FORM CÁ NHÂN / TỰ DO =================
  const handleSubmitIndividual = async (e) => {
    e.preventDefault();

    if (!registrationStatus.allowed) {
      alert(`❌ CỔNG TIẾP NHẬN ĐANG KHÓA:\n${registrationStatus.message}`);
      return;
    }

    if (!fullNameInd.trim() || !phoneInd.trim() || !unitNameInd.trim()) {
      alert("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Lớp / Đơn vị (*)");
      return;
    }

    if (!healthAgreedInd) {
      alert("Vui lòng tích chọn cam kết đảm bảo sức khỏe khi thi đấu.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const newReg = {
      full_name: fullNameInd.trim(),
      sport_name: selectedSportInd || activeTourn.sports[0] || 'Cá nhân',
      phone: phoneInd.trim(),
      cohort_year: unitNameInd.trim(),
      unit_name: unitNameInd.trim(),
      table_group: activeTourn.id, // 🎯 Lưu trực tiếp vào Database!
      notes: JSON.stringify({
        tournament_id: activeTourn.id,
        tournament_name: activeTourn.name,
        extra_notes: notesInd.trim()
      }),
      user_category: selectedCategoryObj.label,
      fee_amount: activeTourn.fee_amount || selectedCategoryObj.fee,
      payment_status: (activeTourn.fee_amount || selectedCategoryObj.fee) === 0 ? 'Miễn phí' : 'Chờ nộp kinh phí',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('cbq_sports_registrations')
        .insert([newReg])
        .select();

      if (error) {
        console.warn("Supabase fallback:", error);
        const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
        const updatedLocal = [newReg, ...local];
        localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
        setRegistrations(updatedLocal);
      } else if (data) {
        setRegistrations(prev => [data[0], ...prev]);
      }

      setSuccessMsg(
        `🎉 ĐĂNG KÝ THÀNH CÔNG VẬN ĐỘNG VIÊN: ${fullNameInd.trim()}!\n` +
        `• Giải đấu: ${activeTourn.name}\n` +
        `• Môn thi đấu: ${newReg.sport_name}\n` +
        `• Đơn vị / Lớp: ${unitNameInd.trim()}\n\n` +
        `👉 Kính mời VĐV tham gia nhóm Zalo giải đấu để nhận thông báo bốc thăm và lịch thi đấu:\n` +
        `🔗 ${activeTourn.zalo_link || OFFICIAL_ZALO_GROUP}`
      );

      setFullNameInd('');
      setPhoneInd('');
      setUnitNameInd('');
      setNotesInd('');

    } catch (err) {
      console.error("Lỗi đăng ký cá nhân:", err);
      alert("Không thể gửi đăng ký. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter bảng hiển thị
  const filteredRegistrations = useMemo(() => {
    return activeTournRegistrations.filter(item => {
      const matchClass = filterClass === 'ALL' || (item.cohort_year || '').includes(filterClass) || (item.unit_name || '').includes(filterClass);
      const matchSearch = (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.unit_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.cohort_year || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sport_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.phone || '').includes(searchQuery) ||
        (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [activeTournRegistrations, filterClass, searchQuery]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px 60px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* BANNER CHÍNH */}
      <div style={{
        background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)',
        borderRadius: '20px',
        padding: '28px 24px',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: '22px',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.35)',
        position: 'relative'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.2)', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>
          <Trophy size={16} /> CỔNG ĐĂNG KÝ THỂ THAO TRỰC TUYẾN - THPT CAO BÁ QUÁT
        </div>

        <h1 style={{ fontSize: '27px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
          {activeTourn?.name || 'GIẢI THỂ THAO TRƯỜNG HỌC'}
        </h1>

        <p style={{ fontSize: '14.5px', maxWidth: '800px', margin: '0 auto 18px auto', opacity: 0.95, lineHeight: '1.5' }}>
          {activeTourn?.short_desc || activeTourn?.announcement || 'Tổ chức thi đấu thể dục thể thao rèn luyện sức khỏe, chào mừng các ngày lễ lớn.'}
        </p>

        {/* THÔNG TIN NHANH VỀ GIẢI ĐẤU */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(6px)', padding: '12px 16px', borderRadius: '14px', textAlign: 'left', border: '1px solid rgba(253,224,71,0.4)', fontSize: '13px', maxWidth: '960px', margin: '0 auto 14px auto' }}>
          <div>
            <Calendar size={15} color="#fde047" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            <strong>Thời hạn nhận hồ sơ:</strong> <span style={{ color: '#fde047', fontWeight: 'bold' }}>
              {activeTourn?.start_date ? new Date(activeTourn.start_date).toLocaleDateString('vi-VN') : 'Đang mở'} đến hết {activeTourn?.end_date ? new Date(activeTourn.end_date).toLocaleDateString('vi-VN') : 'Khi có thông báo'}
            </span>
          </div>
          <div>
            <Trophy size={15} color="#fde047" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            <strong>Hình thức thi đấu:</strong> {activeTourn?.format === 'class_team' ? 'Theo Chi đoàn Lớp' : 'Cá nhân / Đơn vị'}
          </div>
          <div>
            <CheckCircle2 size={15} color="#4ade80" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            <strong>Lệ phí tham gia:</strong> <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
              {activeTourn?.fee_amount === 0 ? 'MIỄN PHÍ 100%' : `${Number(activeTourn?.fee_amount).toLocaleString()}đ`}
            </span>
          </div>
        </div>

        {/* NÚT THAM GIA ZALO */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <a
            href={activeTourn?.zalo_link || OFFICIAL_ZALO_GROUP}
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
            <MessageCircle size={17} /> 💬 Tham Gia Nhóm Zalo Giải Đấu (Nhận Lịch & Kết Quả Bốc Thăm)
          </a>
        </div>
      </div>

      {/* THANH CHỌN GIẢI ĐẤU (TỰ ĐỘNG HIỂN THỊ NẾU CÓ NHIỀU GIẢI) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', overflowX: 'auto' }}>
        {tournaments.map(t => {
          const isSelected = t.id === selectedTournId;
          const status = checkTournamentStatus(t);

          return (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTournId(t.id);
                setSuccessMsg('');
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: isSelected ? '#0284c7' : '#ffffff',
                color: isSelected ? '#ffffff' : '#334155',
                fontWeight: 'bold',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 4px 14px rgba(2,132,199,0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Trophy size={16} />
              <span>{t.name}</span>
              <span style={{ 
                fontSize: '11px', 
                padding: '2px 7px', 
                borderRadius: '10px', 
                background: isSelected ? '#ffffff' : status.bg, 
                color: isSelected ? '#0284c7' : status.color, 
                fontWeight: 'bold' 
              }}>
                {status.allowed ? 'Đang mở' : 'Đã đóng'}
              </span>
            </button>
          );
        })}
      </div>

      {/* THÔNG BÁO THÀNH CÔNG */}
      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#166534', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', marginBottom: '22px', whiteSpace: 'pre-line', boxShadow: '0 4px 12px rgba(22,101,52,0.08)' }}>
          {successMsg}
        </div>
      )}

      {/* KHUNG NỘI DUNG CHÍNH: FORM ĐĂNG KÝ + DANH SÁCH ĐÃ ĐĂNG KÝ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* ========================================================================= */}
        {/* CỘT TRÁI: FORM ĐĂNG KÝ (TỰ ĐỘNG THÍCH ỨNG THEO HÌNH THỨC CỦA GIẢI ĐẤU) */}
        {/* ========================================================================= */}
        <div style={{ flex: '1 1 500px', background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: 'bold', fontSize: '16px' }}>
              <UserCheck size={20} color="#0369a1" /> 
              {activeTourn?.format === 'class_team' ? 'HỒ SƠ ĐĂNG KÝ ĐỘI THI ĐẤU THEO LỚP' : 'HỒ SƠ ĐĂNG KÝ VẬN ĐỘNG VIÊN'}
            </div>
            
            <span style={{ 
              fontSize: '11.5px', 
              padding: '3px 9px', 
              borderRadius: '12px', 
              background: registrationStatus.bg, 
              color: registrationStatus.color, 
              border: `1px solid ${registrationStatus.border}`,
              fontWeight: 'bold' 
            }}>
              {registrationStatus.badge}
            </span>
          </div>

          {/* CẢNH BÁO NẾU CỔNG ĐÃ ĐÓNG HOẶC CHƯA MỞ */}
          {!registrationStatus.allowed && (
            <div style={{ background: registrationStatus.bg, border: `1.5px solid ${registrationStatus.border}`, color: registrationStatus.color, padding: '12px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} />
              <div><strong>Thông báo:</strong> {registrationStatus.message}</div>
            </div>
          )}

          {/* ================= TH1: FORM ĐĂNG KÝ THEO ĐỘI LỚP ================= */}
          {activeTourn?.format === 'class_team' ? (
            <form onSubmit={handleSubmitClassTeam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* CHỌN LỚP */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>
                  1. Chi đoàn Lớp Đăng Ký *
                </label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  disabled={!registrationStatus.allowed}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #0284c7', fontSize: '14px', fontWeight: 'bold', color: '#0369a1', background: '#f0f9ff' }}
                >
                  {ALL_CBQ_CLASSES.map(cls => {
                    const isRegistered = registeredClasses.has(cls);
                    return (
                      <option key={cls} value={cls}>
                        Lớp {cls} {isRegistered ? '🔒 (ĐÃ ĐĂNG KÝ)' : '🟢 (Chưa đăng ký)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* CẢNH BÁO NẾU LỚP NÀY ĐÃ ĐĂNG KÝ RỒI */}
              {activeTourn?.prevent_duplicate && existingTeamOfSelectedClass && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '12px 14px', color: '#991b1b', fontSize: '12.5px', lineHeight: '1.5' }}>
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <ShieldAlert size={16} color="#dc2626" />
                    LỚP {selectedClass} ĐÃ CÓ BẢN ĐĂNG KÝ TRONG HỆ THỐNG:
                  </div>
                  <div>• Đội trưởng: <strong>{existingTeamOfSelectedClass.full_name}</strong></div>
                  <div>• SĐT liên hệ: <strong>{existingTeamOfSelectedClass.phone}</strong></div>
                  <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#b91c1c' }}>
                    ⚠️ Mỗi lớp chỉ được gửi 01 đội thi đấu. Nếu cần sửa danh sách VĐV, vui lòng liên hệ Ban Tổ Chức.
                  </div>
                </div>
              )}

              {/* CHỌN MÔN THI ĐẤU (NẾU GIẢI CÓ NHIỀU MÔN) */}
              {(activeTourn?.sports || []).length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>
                    Môn Thi Đấu *
                  </label>
                  <select
                    value={selectedSportTeam}
                    onChange={e => setSelectedSportTeam(e.target.value)}
                    disabled={!registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '600' }}
                  >
                    {activeTourn.sports.map(sp => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ĐỘI TRƯỞNG & SĐT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Họ Tên Đội Trưởng / Đại Diện *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={captainName}
                    onChange={e => setCaptainName(e.target.value)}
                    disabled={!registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Số Điện Thoại Zalo Liên Hệ *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={captainPhone}
                    onChange={e => setCaptainPhone(e.target.value)}
                    disabled={!registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* GVCN XÁC NHẬN */}
              {activeTourn?.team_config?.require_gvcn && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Họ Tên Giáo Viên Chủ Nhiệm (GVCN) Xác Nhận *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Thầy / Cô Chủ Nhiệm"
                    value={gvcnName}
                    onChange={e => setGvcnName(e.target.value)}
                    disabled={!registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* DANH SÁCH VĐV NAM */}
              {maleAthletes.length > 0 && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
                    👦 {maleAthletes.length} VẬN ĐỘNG VIÊN NAM CHÍNH THỨC (*)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(maleAthletes.length, 3)}, 1fr)`, gap: '8px' }}>
                    {maleAthletes.map((m, idx) => (
                      <input
                        key={idx}
                        type="text"
                        required
                        placeholder={`Nam ${idx + 1} *`}
                        value={m}
                        onChange={e => handleMaleAthleteChange(idx, e.target.value)}
                        disabled={!registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)}
                        style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '12.5px', boxSizing: 'border-box' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* DANH SÁCH VĐV NỮ */}
              {femaleAthletes.length > 0 && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#be123c', marginBottom: '8px' }}>
                    👧 {femaleAthletes.length} VẬN ĐỘNG VIÊN NỮ CHÍNH THỨC (*)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(femaleAthletes.length, 3)}, 1fr)`, gap: '8px' }}>
                    {femaleAthletes.map((f, idx) => (
                      <input
                        key={idx}
                        type="text"
                        required
                        placeholder={`Nữ ${idx + 1} *`}
                        value={f}
                        onChange={e => handleFemaleAthleteChange(idx, e.target.value)}
                        disabled={!registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)}
                        style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid #fda4af', fontSize: '12.5px', boxSizing: 'border-box' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* DỰ BỊ */}
              {activeTourn?.team_config?.allow_reserves && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Vận Động Viên Dự Bị (Nếu có):
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn D, Trần Thị E..."
                    value={reserves}
                    onChange={e => setReserves(e.target.value)}
                    disabled={!registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* CAM KẾT SỨC KHỎE */}
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={healthAgreedTeam}
                    onChange={e => setHealthAgreedTeam(e.target.checked)}
                    disabled={!registrationStatus.allowed}
                    style={{ marginTop: '2px', accentColor: '#0284c7' }}
                  />
                  <span>
                    Chi đoàn cam kết toàn bộ VĐV có đủ sức khỏe thi đấu và đã được sự đồng ý của GVCN lớp.
                  </span>
                </label>
              </div>

              {/* NÚT GỬI ĐĂNG KÝ */}
              <button
                type="submit"
                disabled={submitting || !registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: !registrationStatus.allowed 
                    ? '#cbd5e1' 
                    : (activeTourn?.prevent_duplicate && existingTeamOfSelectedClass)
                      ? '#fee2e2'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: (activeTourn?.prevent_duplicate && existingTeamOfSelectedClass) ? '#dc2626' : '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '14.5px',
                  cursor: (!registrationStatus.allowed || (activeTourn?.prevent_duplicate && !!existingTeamOfSelectedClass)) ? 'not-allowed' : 'pointer',
                  boxShadow: registrationStatus.allowed ? '0 4px 14px rgba(2,132,199,0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? (
                  'Đang gửi hồ sơ lên hệ thống...'
                ) : !registrationStatus.allowed ? (
                  '🔒 Cổng đăng ký hiện đang đóng'
                ) : (activeTourn?.prevent_duplicate && existingTeamOfSelectedClass) ? (
                  '⛔ Lớp đã có đội đăng ký (Không gửi trùng)'
                ) : (
                  <>🚀 Gửi Đăng Ký Đội Lớp {selectedClass}</>
                )}
              </button>

            </form>
          ) : (
            /* ================= TH2: FORM ĐĂNG KÝ CÁ NHÂN / TỰ DO ================= */
            <form onSubmit={handleSubmitIndividual} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                  Họ và Tên Vận Động Viên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Nam"
                  value={fullNameInd}
                  onChange={e => setFullNameInd(e.target.value)}
                  disabled={!registrationStatus.allowed}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Số Điện Thoại Zalo *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={phoneInd}
                    onChange={e => setPhoneInd(e.target.value)}
                    disabled={!registrationStatus.allowed}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Lớp / Chi đoàn / Đơn vị *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 12A1 hoặc Niên khóa 2015"
                    value={unitNameInd}
                    onChange={e => setUnitNameInd(e.target.value)}
                    disabled={!registrationStatus.allowed}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                  Chọn Môn Thi Đấu *
                </label>
                <select
                  value={selectedSportInd}
                  onChange={e => setSelectedSportInd(e.target.value)}
                  disabled={!registrationStatus.allowed}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: '6px', border: '1.5px solid #0284c7', fontSize: '13.5px', fontWeight: 'bold', color: '#0369a1' }}
                >
                  {(activeTourn?.sports || []).map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Đối Tượng Tham Gia:
                </label>
                <select
                  value={selectedCategoryObj.label}
                  onChange={e => {
                    const found = USER_CATEGORIES.find(c => c.label === e.target.value) || USER_CATEGORIES[0];
                    setSelectedCategoryObj(found);
                  }}
                  disabled={!registrationStatus.allowed}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '12.5px' }}
                >
                  {USER_CATEGORIES.map(c => (
                    <option key={c.label} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Ghi chú thêm:
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm cho Ban Tổ Chức..."
                  value={notesInd}
                  onChange={e => setNotesInd(e.target.value)}
                  disabled={!registrationStatus.allowed}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={healthAgreedInd}
                    onChange={e => setHealthAgreedInd(e.target.checked)}
                    disabled={!registrationStatus.allowed}
                    style={{ accentColor: '#0284c7' }}
                  />
                  <span>Tôi cam kết có đủ sức khỏe và tự chịu trách nhiệm khi tham gia thi đấu.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !registrationStatus.allowed}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: !registrationStatus.allowed ? '#cbd5e1' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '14.5px',
                  cursor: !registrationStatus.allowed ? 'not-allowed' : 'pointer',
                  boxShadow: registrationStatus.allowed ? '0 4px 14px rgba(2,132,199,0.3)' : 'none'
                }}
              >
                {submitting ? 'Đang gửi đăng ký...' : !registrationStatus.allowed ? '🔒 Cổng đăng ký hiện đang đóng' : '🚀 Gửi Đăng Ký Tham Gia'}
              </button>

            </form>
          )}

        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI: BẢNG DANH SÁCH ĐÃ ĐĂNG KÝ TRONG GIẢI NÀY */}
        {/* ========================================================================= */}
        <div style={{ flex: '1 1 540px', background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0369a1', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={18} /> Danh Sách Đã Đăng Ký ({filteredRegistrations.length})
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>{activeTourn?.name}</div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Tìm Lớp, Tên..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', width: '130px' }}
              />
              <button
                onClick={fetchRegistrations}
                style={{ padding: '6px 9px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                title="Tải lại danh sách"
              >
                🔄
              </button>
            </div>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 15px', color: '#94a3b8', fontSize: '13.5px' }}>
              Chưa có đơn vị hoặc VĐV nào đăng ký trong giải này.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '560px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f0f9ff', color: '#0369a1', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '35px' }}>STT</th>
                    <th style={{ padding: '8px 8px' }}>LỚP / ĐƠN VỊ</th>
                    <th style={{ padding: '8px 8px' }}>ĐẠI DIỆN / VĐV</th>
                    <th style={{ padding: '8px 8px' }}>MÔN THI</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>CHI TIẾT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((item, idx) => {
                    let roster = null;
                    try {
                      roster = JSON.parse(item.notes);
                    } catch (e) {}

                    return (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '9px 8px', fontWeight: 'bold', color: '#0369a1' }}>
                          {item.cohort_year || item.unit_name || 'Chi đoàn'}
                        </td>
                        <td style={{ padding: '9px 8px', fontWeight: '600', color: '#1e293b' }}>
                          {roster?.captain || item.full_name}
                        </td>
                        <td style={{ padding: '9px 8px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', fontWeight: 'bold' }}>
                            {item.sport_name}
                          </span>
                        </td>
                        <td style={{ padding: '9px 6px', textAlign: 'center' }}>
                          {roster ? (
                            <button
                              onClick={() => setViewTeamModal({ item, roster })}
                              style={{ padding: '3px 7px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '10.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Eye size={11} /> Đội hình
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>-</span>
                          )}
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

      {/* ================= MODAL XEM CHI TIẾT ĐỘI HÌNH ================= */}
      {viewTeamModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '22px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0369a1', fontWeight: 'bold' }}>
                🏐 Đội Hình Lớp {viewTeamModal.item.cohort_year || viewTeamModal.item.unit_name}
              </h3>
              <button onClick={() => setViewTeamModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ background: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '12px' }}>
              <div><strong>Đội trưởng:</strong> {viewTeamModal.roster?.captain}</div>
              <div><strong>GVCN / Phụ trách:</strong> {viewTeamModal.roster?.gvcn || 'Đã xác nhận'}</div>
              <div><strong>Môn thi đấu:</strong> {viewTeamModal.item.sport_name}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>👦 VĐV NAM CHÍNH THỨC:</div>
                {(viewTeamModal.roster?.male_athletes || []).map((m, i) => (
                  <div key={i} style={{ fontSize: '12px', padding: '2px 0' }}>{i + 1}. {m}</div>
                ))}
              </div>

              <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#be123c', marginBottom: '6px' }}>👧 VĐV NỮ CHÍNH THỨC:</div>
                {(viewTeamModal.roster?.female_athletes || []).map((f, i) => (
                  <div key={i} style={{ fontSize: '12px', padding: '2px 0' }}>{i + 1}. {f}</div>
                ))}
              </div>
            </div>

            {viewTeamModal.roster?.reserves && (
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                <strong>VĐV Dự bị:</strong> {viewTeamModal.roster.reserves}
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '14px' }}>
              <button
                onClick={() => setViewTeamModal(null)}
                style={{ padding: '7px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
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
