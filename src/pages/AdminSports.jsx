import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Trophy, Download, Trash2, Search, Filter, RefreshCw, 
  Dices, Printer, Users, DollarSign, CheckCircle2, AlertCircle, 
  X, ShieldAlert, Eye, Copy, Check, FileText, MessageCircle,
  Settings, Edit, Clock, Lock, CheckSquare, Save, AlertTriangle
} from 'lucide-react';

const OFFICIAL_ZALO_GROUP = 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa';

const DEFAULT_SPORTS_CONFIG = {
  startDate: '2026-10-20T00:00',
  endDate: '2026-10-30T23:59',
  isOpen: true,
  preventDuplicate: true,
  maxTeamsPerClass: 1,
  announcement: 'Thời hạn đăng ký: Từ ngày 20/10/2026 đến hết ngày 30/10/2026. Mỗi lớp chỉ đăng ký 01 đội bóng chuyền duy nhất (3 Nam + 3 Nữ).'
};

const OFFICIAL_SPORTS = [
  'Bóng chuyền Nam - Nữ phối hợp (20/11)',
  'Bóng chuyền Nam - Nữ phối hợp (3 Nam, 3 Nữ - Thi đấu theo lớp)',
  'Bóng đá Futsal Nam (2 hiệp x 20 phút)',
  'Kéo co Nam Nữ phối hợp (5 Nam, 5 Nữ)',
  'Bóng chuyền hơi Nữ (dự kiến 6 đội)',
  'Pickleball (đôi Nam)',
  'Pickleball (đôi Nữ)',
  'Pickleball (đôi Nam - Nữ)'
];

export default function AdminSports() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // ⚙️ CẤU HÌNH THỜI HẠN & CHỐNG TRÙNG (BAN TỔ CHỨC)
  const [sportsConfig, setSportsConfig] = useState(() => {
    try {
      const local = localStorage.getItem('cbq_sports_config');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return DEFAULT_SPORTS_CONFIG;
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editConfigData, setEditConfigData] = useState(DEFAULT_SPORTS_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  // ✏️ MODAL SỬA ĐỘI HÌNH (ADMIN)
  const [editingTeam, setEditingTeam] = useState(null);
  const [savingEditTeam, setSavingEditTeam] = useState(false);

  // Bracket Draw Modal State
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [drawSport, setDrawSport] = useState(OFFICIAL_SPORTS[0]);
  const [drawMode, setDrawMode] = useState('knockout'); // 'knockout' (Loại trực tiếp) | 'groups' (Chia bảng)
  const [numGroups, setNumGroups] = useState(2); // 2 or 4 groups
  const [drawnBrackets, setDrawnBrackets] = useState(null);
  const [copiedSchedule, setCopiedSchedule] = useState(false);

  // View Team Roster Modal
  const [selectedTeamView, setSelectedTeamView] = useState(null);

  useEffect(() => {
    fetchRegistrations();
    fetchSportsConfig();
  }, []);

  async function fetchSportsConfig() {
    try {
      const { data, error } = await supabase
        .from('cbq_pages')
        .select('*')
        .eq('slug', 'sports-config')
        .maybeSingle();

      if (!error && data && data.content) {
        const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        setSportsConfig(parsed);
        localStorage.setItem('cbq_sports_config', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn("Dùng local sports config:", e);
    }
  }

  const openConfigModal = () => {
    setEditConfigData({ ...sportsConfig });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await supabase.from('cbq_pages').delete().eq('slug', 'sports-config');
      const { error } = await supabase.from('cbq_pages').insert([{
        slug: 'sports-config',
        title: 'Cấu hình Giải thể thao 20/11',
        content: JSON.stringify(editConfigData)
      }]);

      if (error) throw error;

      setSportsConfig(editConfigData);
      localStorage.setItem('cbq_sports_config', JSON.stringify(editConfigData));
      alert("✅ Đã cập nhật và lưu cấu hình thời gian & chống trùng thành công!");
      setShowConfigModal(false);
    } catch (err) {
      console.warn("Lỗi lưu Supabase, lưu dự phòng LocalStorage:", err);
      setSportsConfig(editConfigData);
      localStorage.setItem('cbq_sports_config', JSON.stringify(editConfigData));
      alert("⚠️ Đã lưu cấu hình vào bộ nhớ máy quản trị (LocalStorage)!");
      setShowConfigModal(false);
    } finally {
      setSavingConfig(false);
    }
  };

  // Trạng thái cấu hình hiển thị trên badge
  const configStatus = useMemo(() => {
    if (!sportsConfig.isOpen) {
      return { text: 'Đang khóa cổng', color: '#dc2626', bg: '#fee2e2' };
    }
    const now = new Date();
    const start = sportsConfig.startDate ? new Date(sportsConfig.startDate) : null;
    const end = sportsConfig.endDate ? new Date(sportsConfig.endDate) : null;
    if (start && now < start) return { text: 'Chưa tới giờ mở', color: '#d97706', bg: '#fef3c7' };
    if (end && now > end) return { text: 'Đã hết hạn', color: '#dc2626', bg: '#fee2e2' };
    return { text: 'Cổng đang mở', color: '#16a34a', bg: '#dcfce7' };
  }, [sportsConfig]);

  // SỬA ĐỘI HÌNH
  const openEditTeamModal = (item) => {
    let roster = null;
    try {
      roster = JSON.parse(item.notes);
    } catch (e) {}

    setEditingTeam({
      item,
      roster,
      formState: {
        className: item.cohort_year || item.unit_name || '',
        captain: roster?.captain || item.full_name || '',
        phone: item.phone || '',
        gvcn: roster?.gvcn || '',
        male1: roster?.male_athletes?.[0] || '',
        male2: roster?.male_athletes?.[1] || '',
        male3: roster?.male_athletes?.[2] || '',
        female1: roster?.female_athletes?.[0] || '',
        female2: roster?.female_athletes?.[1] || '',
        female3: roster?.female_athletes?.[2] || '',
        reserves: roster?.reserves || '',
        extra_notes: roster?.extra_notes || ''
      }
    });
  };

  const handleSaveEditTeam = async (e) => {
    e.preventDefault();
    if (!editingTeam) return;
    setSavingEditTeam(true);

    const { formState, item } = editingTeam;
    const updatedRoster = {
      tournament: 'Giải Bóng chuyền Nam Nữ phối hợp chào mừng 20/11',
      academic_year: '2026-2027',
      class: formState.className,
      captain: formState.captain.trim(),
      captain_phone: formState.phone.trim(),
      gvcn: formState.gvcn.trim(),
      male_athletes: [formState.male1.trim(), formState.male2.trim(), formState.male3.trim()],
      female_athletes: [formState.female1.trim(), formState.female2.trim(), formState.female3.trim()],
      reserves: formState.reserves.trim(),
      extra_notes: formState.extra_notes.trim()
    };

    const updatedData = {
      full_name: `Đội Lớp ${formState.className} (Đội trưởng: ${formState.captain.trim()})`,
      phone: formState.phone.trim(),
      cohort_year: formState.className,
      unit_name: `Chi đoàn ${formState.className}`,
      notes: JSON.stringify(updatedRoster)
    };

    try {
      const { error } = await supabase
        .from('cbq_sports_registrations')
        .update(updatedData)
        .eq('id', item.id);

      if (error) throw error;

      setRegistrations(prev => prev.map(r => r.id === item.id ? { ...r, ...updatedData } : r));

      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      const updatedLocal = local.map(r => r.id === item.id ? { ...r, ...updatedData } : r);
      localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));

      alert("✅ Đã cập nhật thông tin đội hình thành công!");
      setEditingTeam(null);
    } catch (err) {
      console.warn("Lỗi lưu Supabase:", err);
      setRegistrations(prev => prev.map(r => r.id === item.id ? { ...r, ...updatedData } : r));
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      const updatedLocal = local.map(r => r.id === item.id ? { ...r, ...updatedData } : r);
      localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
      alert("✅ Đã cập nhật vào dữ liệu bộ nhớ trình duyệt!");
      setEditingTeam(null);
    } finally {
      setSavingEditTeam(false);
    }
  };

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
      console.warn("Dùng fallback LocalStorage:", err);
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      setRegistrations(local);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lượt đăng ký này không?")) return;

    try {
      await supabase.from('cbq_sports_registrations').delete().eq('id', id);
      setRegistrations(prev => prev.filter(item => item.id !== id));
      
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      const updatedLocal = local.filter(item => item.id !== id);
      localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
    } catch (err) {
      console.error("Lỗi xóa VĐV:", err);
      alert("Không thể xóa. Vui lòng thử lại!");
    }
  };

  // EXPORT EXCEL / CSV (Tuân thủ quy tắc GEMINI.md có tiền tố số thứ tự '1-...')
  const exportCSV = () => {
    if (registrations.length === 0) {
      alert("Không có dữ liệu để xuất file!");
      return;
    }

    let csvContent = "\uFEFFSTT,CHI ĐOÀN LỚP / ĐƠN VỊ,ĐỘI TRƯỞNG / HỌ TÊN,SỐ ĐIỆN THOẠI,MÔN THI ĐẤU,GVCN XÁC NHẬN,3 VĐV NAM CHÍNH THỨC,3 VĐV NỮ CHÍNH THỨC,VĐV DỰ BỊ,ĐỐI TƯỢNG,KINH PHÍ,GHI CHÚ,NGÀY ĐĂNG KÝ\n";
    filteredRegistrations.forEach((item, idx) => {
      let roster = null;
      try {
        roster = JSON.parse(item.notes);
      } catch (e) {}

      const maleAthletes = roster?.male_athletes ? roster.male_athletes.join("; ") : '';
      const femaleAthletes = roster?.female_athletes ? roster.female_athletes.join("; ") : '';
      const gvcn = roster?.gvcn || '';
      const reserves = roster?.reserves || '';

      const row = [
        idx + 1,
        `"${item.cohort_year || item.unit_name || ''}"`,
        `"${roster?.captain || item.full_name || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.sport_name || ''}"`,
        `"${gvcn}"`,
        `"${maleAthletes}"`,
        `"${femaleAthletes}"`,
        `"${reserves}"`,
        `"${item.user_category || ''}"`,
        `"${item.payment_status || (item.fee_amount === 0 ? 'Miễn phí' : 'Chờ nộp')}"`,
        `"${roster?.extra_notes || item.notes || ''}"`,
        `"${new Date(item.created_at).toLocaleDateString('vi-VN')}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `1-Danh_sach_dang_ky_giai_bong_chuyen_20_11_CBQ_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // RANDOM BRACKET DRAW LOGIC (BỐC THĂM LOẠI TRỰC TIẾP HOẶC CHIA BẢNG)
  const handleRandomDraw = () => {
    const athletesInSport = registrations.filter(r => 
      r.sport_name.includes(drawSport) || drawSport.includes(r.sport_name)
    );
    if (athletesInSport.length === 0) {
      alert(`Hiện tại chưa có VĐV hoặc Đội nào đăng ký môn "${drawSport}" để bốc thăm.`);
      return;
    }

    // Shuffle array ngẫu nhiên
    const shuffled = [...athletesInSport].sort(() => Math.random() - 0.5);

    if (drawMode === 'knockout') {
      // Bốc thăm phân cặp loại trực tiếp
      const matchups = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          matchups.push({
            matchNumber: Math.floor(i / 2) + 1,
            teamA: shuffled[i],
            teamB: shuffled[i + 1],
            isBye: false
          });
        } else {
          // Lẻ đội: đội cuối được vé đặc cách
          matchups.push({
            matchNumber: Math.floor(i / 2) + 1,
            teamA: shuffled[i],
            teamB: null,
            isBye: true
          });
        }
      }
      setDrawnBrackets({ type: 'knockout', matchups });
    } else {
      // Chia 2 hoặc 4 bảng đấu vòng tròn
      const groups = Array.from({ length: numGroups }, () => []);
      shuffled.forEach((item, idx) => {
        groups[idx % numGroups].push(item);
      });
      setDrawnBrackets({ type: 'groups', groups });
    }
  };

  // Sao chép lịch thi đấu Zalo
  const copyDrawSchedule = () => {
    if (!drawnBrackets) return;
    let text = `🏛️ TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK\n📢 KẾT QUẢ BỐC THĂM THI ĐẤU: ${drawSport.toUpperCase()}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (drawnBrackets.type === 'knockout') {
      text += `🎯 THỂ THỨC: THI ĐẤU LOẠI TRỰC TIẾP (VÒNG LOẠI)\n\n`;
      drawnBrackets.matchups.forEach(m => {
        if (m.isBye) {
          text += `🔹 Trận ${m.matchNumber}: Lớp ${m.teamA.cohort_year || m.teamA.unit_name} (ĐẶC CÁCH VÀO VÒNG TRONG)\n`;
        } else {
          text += `🔹 Trận ${m.matchNumber}: Lớp ${m.teamA.cohort_year || m.teamA.unit_name} ⚔️ Lớp ${m.teamB.cohort_year || m.teamB.unit_name}\n`;
        }
      });
    } else {
      text += `🎯 THỂ THỨC: CHIA BẢNG ĐẤU VÒNG TRÒN\n\n`;
      drawnBrackets.groups.forEach((grp, idx) => {
        text += `📌 BẢNG ${String.fromCharCode(65 + idx)}:\n`;
        grp.forEach((t, i) => {
          text += `  ${i + 1}. Lớp ${t.cohort_year || t.unit_name} (Đội trưởng: ${t.full_name})\n`;
        });
        text += `\n`;
      });
    }

    text += `\n📲 Link tham gia nhóm Zalo giải đấu: ${OFFICIAL_ZALO_GROUP}\n⏰ Kính đề nghị các Đội trưởng & GVCN theo dõi thời gian và địa điểm thi đấu theo thông báo của Ban Tổ Chức!`;
    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 3000);
  };

  // STATISTICAL CALCULATIONS
  const totalVdvs = registrations.length;
  const countVolleyball = registrations.filter(r => (r.sport_name || '').includes('Bóng chuyền')).length;
  const countDivisionA = registrations.filter(r => (r.fee_amount || 0) > 0 || (r.user_category || '').includes('Bảng A')).length;
  const countStudents = totalVdvs - countDivisionA;

  const filteredRegistrations = registrations.filter(item => {
    const matchSport = selectedSport === 'Tất cả' || item.sport_name.includes(selectedSport) || selectedSport.includes(item.sport_name);
    const matchSearch = (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.unit_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.cohort_year || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone || '').includes(searchQuery) ||
      (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSport && matchSearch;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* TITLE & TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '23px', fontWeight: 'bold', color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={26} color="#0369a1" /> QUẢN LÝ ĐĂNG KÝ THỂ THAO & BẢNG ĐẤU 20/11
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Giải Bóng chuyền Nam Nữ phối hợp chào mừng 20/11 & Hội thao thể dục thể thao THPT Cao Bá Quát
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={openConfigModal}
            style={{
              padding: '9px 15px',
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 12px rgba(4,120,87,0.25)',
              fontSize: '13px'
            }}
            title="Cấu hình hạn chót đăng ký & bật/tắt chống nhập trùng"
          >
            <Settings size={16} /> ⚙️ Cấu Hình Thời Hạn & Chống Trùng
            <span style={{ 
              fontSize: '11px', 
              padding: '2px 7px', 
              borderRadius: '10px', 
              background: configStatus.bg, 
              color: configStatus.color,
              fontWeight: 'bold',
              marginLeft: '4px'
            }}>
              {configStatus.text}
            </span>
          </button>

          <a
            href={OFFICIAL_ZALO_GROUP}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '9px 14px',
              background: '#0068ff',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,104,255,0.25)',
              fontSize: '13px'
            }}
          >
            <MessageCircle size={16} /> 💬 Nhóm Zalo Giải Đấu
          </a>

          <button
            onClick={() => setShowBracketModal(true)}
            style={{ padding: '9px 15px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}
          >
            <Dices size={16} /> 🎲 Bốc Thăm Bảng Đấu (Loại Trực Tiếp)
          </button>

          <button
            onClick={fetchRegistrations}
            style={{ padding: '9px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} /> Tải Lại
          </button>
          
          <button
            onClick={exportCSV}
            style={{ padding: '9px 16px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22,101,52,0.2)' }}
            title="Xuất file Excel/CSV theo quy tắc đặt tên tiền tố 1-..."
          >
            <Download size={16} /> Xuất File Excel / CSV
          </button>
        </div>
      </div>

      {/* STATISTIC DASHBOARD CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 14px rgba(2,132,199,0.2)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9 }}>TỔNG ĐỘI / VĐV ĐĂNG KÝ</div>
          <div style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0' }}>{totalVdvs} <span style={{ fontSize: '14px' }}>Lượt</span></div>
          <div style={{ fontSize: '11.5px', opacity: 0.85 }}>Bóng chuyền 20/11: {countVolleyball} đội</div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>ĐỘI BÓNG CHUYỀN LỚP (20/11)</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#166534', margin: '4px 0' }}>
            {countVolleyball} <span style={{ fontSize: '14px' }}>Đội</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '600' }}>3 Nam + 3 Nữ trên sân • Miễn phí 100%</div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>HỌC SINH THAM GIA</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0369a1', margin: '4px 0' }}>
            {countStudents} <span style={{ fontSize: '14px' }}>Hồ sơ</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Đăng ký theo Chi đoàn Lớp</div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #fef08a', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#854d0e' }}>BẢNG A (CHS & GV GIAO LƯU)</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#854d0e', margin: '4px 0' }}>
            {countDivisionA} <span style={{ fontSize: '14px' }}>VĐV</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#a16207' }}>Kinh phí đóng góp: 300.000đ/VĐV</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo Lớp, Tên Đội trưởng, GVCN hoặc SĐT..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
          />
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '11px' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748b" />
          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', background: '#ffffff', fontWeight: 'bold', color: '#0369a1' }}
          >
            <option value="Tất cả">Tất Cả Môn Thi Đấu ({registrations.length})</option>
            {OFFICIAL_SPORTS.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang nạp danh sách đăng ký...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có lượt đăng ký nào thỏa mãn điều kiện tìm kiếm.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0369a1', color: '#ffffff' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '45px' }}>STT</th>
                  <th style={{ padding: '12px 10px' }}>LỚP / ĐƠN VỊ</th>
                  <th style={{ padding: '12px 10px' }}>ĐỘI TRƯỞNG / VĐV</th>
                  <th style={{ padding: '12px 10px' }}>MÔN THI ĐẤU</th>
                  <th style={{ padding: '12px 10px' }}>SĐT LIÊN HỆ</th>
                  <th style={{ padding: '12px 10px' }}>GVCN XÁC NHẬN</th>
                  <th style={{ padding: '12px 10px' }}>KINH PHÍ</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((item, idx) => {
                  let roster = null;
                  try {
                    roster = JSON.parse(item.notes);
                  } catch (e) {}

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#0369a1' }}>
                        {item.cohort_year || item.unit_name}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1e293b' }}>
                        {roster?.captain || item.full_name}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '10px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '11.5px' }}>
                          {item.sport_name}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#0369a1', fontFamily: 'monospace' }}>
                        {item.phone}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#64748b' }}>
                        {roster?.gvcn || '-'}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 'bold', background: item.fee_amount === 0 ? '#dcfce7' : '#fef9c3', color: item.fee_amount === 0 ? '#166534' : '#854d0e' }}>
                          {item.payment_status || (item.fee_amount === 0 ? 'Miễn phí' : '300.000đ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                          {roster ? (
                            <>
                              <button
                                onClick={() => setSelectedTeamView({ item, roster })}
                                style={{ padding: '4px 7px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                title="Xem danh sách 3 Nam + 3 Nữ"
                              >
                                <Eye size={12} /> Xem
                              </button>
                              <button
                                onClick={() => openEditTeamModal(item)}
                                style={{ padding: '4px 7px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                title="Sửa tên VĐV hoặc Đội hình"
                              >
                                <Edit size={12} /> Sửa
                              </button>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>Cá nhân</span>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{ padding: '4px 7px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            title="Xóa lượt đăng ký này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT ĐỘI HÌNH (ADMIN) */}
      {selectedTeamView && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '22px', maxWidth: '540px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0369a1', fontWeight: 'bold' }}>
                🏐 Đội Hình Bóng Chuyền Lớp {selectedTeamView.item.cohort_year || selectedTeamView.item.unit_name}
              </h3>
              <button onClick={() => setSelectedTeamView(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ background: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '12px' }}>
              <div><strong>Đội trưởng:</strong> {selectedTeamView.roster?.captain} (SĐT: {selectedTeamView.item.phone})</div>
              <div><strong>GVCN / Phụ trách:</strong> {selectedTeamView.roster?.gvcn}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>👦 3 VĐV NAM CHÍNH THỨC:</div>
                {(selectedTeamView.roster?.male_athletes || []).map((m, i) => (
                  <div key={i} style={{ fontSize: '12px', padding: '2px 0' }}>{i + 1}. {m}</div>
                ))}
              </div>

              <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#be123c', marginBottom: '6px' }}>👧 3 VĐV NỮ CHÍNH THỨC:</div>
                {(selectedTeamView.roster?.female_athletes || []).map((f, i) => (
                  <div key={i} style={{ fontSize: '12px', padding: '2px 0' }}>{i + 1}. {f}</div>
                ))}
              </div>
            </div>

            {selectedTeamView.roster?.reserves && (
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                <strong>VĐV Dự bị:</strong> {selectedTeamView.roster.reserves}
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '14px' }}>
              <button
                onClick={() => setSelectedTeamView(null)}
                style={{ padding: '7px 14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BỐC THĂM CHIA BẢNG ĐẤU & PHÂN CẶP LOẠI TRỰC TIẾP */}
      {showBracketModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 'bold', fontSize: '18px' }}>
                <Dices size={24} color="#7c3aed" /> CÔNG CỤ BỐC THĂM THI ĐẤU LOẠI TRỰC TIẾP & CHIA BẢNG
              </div>
              <button onClick={() => setShowBracketModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748b" />
              </button>
            </div>

            {/* CONTROL TOOLBAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '18px', background: '#f5f3ff', padding: '16px', borderRadius: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#5b21b6', marginBottom: '5px' }}>Chọn Môn Bốc Thăm *</label>
                <select
                  value={drawSport}
                  onChange={e => setDrawSport(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #c4b5fd', fontSize: '13px' }}
                >
                  {OFFICIAL_SPORTS.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#5b21b6', marginBottom: '5px' }}>Thể Thức Bốc Thăm *</label>
                <select
                  value={drawMode}
                  onChange={e => setDrawMode(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #c4b5fd', fontSize: '13px', fontWeight: 'bold', color: '#7c3aed' }}
                >
                  <option value="knockout">⚔️ Phân Cặp Đấu Loại Trực Tiếp (Vòng loại)</option>
                  <option value="groups">📊 Chia Bảng Đấu (Vòng tròn tính điểm)</option>
                </select>
              </div>

              {drawMode === 'groups' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#5b21b6', marginBottom: '5px' }}>Số Lượng Bảng *</label>
                  <select
                    value={numGroups}
                    onChange={e => setNumGroups(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #c4b5fd', fontSize: '13px' }}
                  >
                    <option value={2}>Chia 2 Bảng (Bảng A & Bảng B)</option>
                    <option value={4}>Chia 4 Bảng (Bảng A, B, C, D)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={handleRandomDraw}
                  style={{ width: '100%', padding: '9px 16px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                >
                  🎲 Tiến Hành Bốc Thăm
                </button>
              </div>
            </div>

            {/* KẾT QUẢ BỐC THĂM */}
            {drawnBrackets ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ color: '#15803d', fontWeight: 'bold', fontSize: '15px' }}>
                    🎉 KẾT QUẢ BỐC THĂM: {drawSport.toUpperCase()}
                  </div>
                  <button
                    onClick={copyDrawSchedule}
                    style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedSchedule ? <Check size={14} /> : <Copy size={14} />} {copiedSchedule ? 'Đã sao chép!' : '📋 Copy Kết Quả Gửi Zalo'}
                  </button>
                </div>

                {drawnBrackets.type === 'knockout' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                    {drawnBrackets.matchups.map(m => (
                      <div key={m.matchNumber} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: '13px', marginBottom: '8px' }}>
                          TRẬN {m.matchNumber}:
                        </div>
                        {m.isBye ? (
                          <div style={{ fontSize: '13px', color: '#166534', background: '#dcfce7', padding: '8px 10px', borderRadius: '6px' }}>
                            🎉 Lớp <strong>{m.teamA.cohort_year || m.teamA.unit_name}</strong>: <em>Đặc cách vào vòng sau</em>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                            <span style={{ fontWeight: 'bold', color: '#0369a1' }}>Lớp {m.teamA.cohort_year || m.teamA.unit_name}</span>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>VS</span>
                            <span style={{ fontWeight: 'bold', color: '#be123c' }}>Lớp {m.teamB.cohort_year || m.teamB.unit_name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    {drawnBrackets.groups.map((grp, gIdx) => (
                      <div key={gIdx} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14.5px', marginBottom: '8px', borderBottom: '2px solid #3b82f6', paddingBottom: '4px' }}>
                          BẢNG {String.fromCharCode(65 + gIdx)} ({grp.length} Đội)
                        </div>
                        <ol style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: '#334155' }}>
                          {grp.map((v, vIdx) => (
                            <li key={vIdx} style={{ marginBottom: '4px' }}>
                              Lớp <strong>{v.cohort_year || v.unit_name}</strong> - Đội trưởng: {v.full_name}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '18px', textAlign: 'center' }}>
                  <button
                    onClick={() => window.print()}
                    style={{ padding: '8px 18px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Printer size={15} /> 🖨️ In Lịch Thi Đấu Bốc Thăm
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '35px 15px', color: '#64748b', fontStyle: 'italic' }}>
                Vui lòng chọn môn và bấm <strong>"🎲 Tiến Hành Bốc Thăm"</strong> để tạo lịch thi đấu loại trực tiếp.
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH THỜI HẠN & CHỐNG TRÙNG (BAN TỔ CHỨC) */}
      {showConfigModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 'bold', fontSize: '18px' }}>
                <Settings size={22} color="#047857" /> CẤU HÌNH THỜI HẠN & CHỐNG NHẬP TRÙNG
              </div>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* KHÓA MỞ CỔNG TIẾP NHẬN */}
              <div style={{ background: editConfigData.isOpen ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${editConfigData.isOpen ? '#bbf7d0' : '#fecaca'}`, borderRadius: '12px', padding: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: editConfigData.isOpen ? '#166534' : '#991b1b', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={editConfigData.isOpen}
                    onChange={e => setEditConfigData({ ...editConfigData, isOpen: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                  <span>🟢 MỞ CỔNG TIẾP NHẬN ĐĂNG KÝ (Trạng thái tổng thể)</span>
                </label>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', marginLeft: '28px' }}>
                  Nếu bỏ chọn, cổng đăng ký sẽ lập tức bị khóa khẩn cấp ở ngoài trang công khai, không cho phép gửi bất kỳ đơn mới nào.
                </div>
              </div>

              {/* THỜI GIAN BẮT ĐẦU VÀ KẾT THÚC */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    Ngày giờ Bắt đầu mở cổng:
                  </label>
                  <input
                    type="datetime-local"
                    value={editConfigData.startDate || ''}
                    onChange={e => setEditConfigData({ ...editConfigData, startDate: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#dc2626', marginBottom: '6px' }}>
                    <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    Hạn chót Đóng cổng tiếp nhận:
                  </label>
                  <input
                    type="datetime-local"
                    value={editConfigData.endDate || ''}
                    onChange={e => setEditConfigData({ ...editConfigData, endDate: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontWeight: 'bold', color: '#b91c1c' }}
                  />
                </div>
              </div>

              {/* CÔNG TẮC CHỐNG NHẬP TRÙNG 2 LẦN */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={editConfigData.preventDuplicate}
                    onChange={e => setEditConfigData({ ...editConfigData, preventDuplicate: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                  <span>🛡️ KÍCH HOẠT CHỐNG NHẬP TRÙNG (Mỗi lớp chỉ 01 đội)</span>
                </label>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', marginLeft: '28px', lineHeight: '1.5' }}>
                  Khi bật tính năng này: Nếu một lớp đã có đội đăng ký, hệ thống tự động khóa ô nhập và vô hiệu hóa nút gửi của lớp đó trên Cổng đăng ký. Học sinh không thể nộp trùng lần 2.
                </div>
              </div>

              {/* THÔNG BÁO QUY ĐỊNH CHO HỌC SINH */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Thông báo hiển thị cho Học sinh & GVCN (Trang công khai):
                </label>
                <textarea
                  rows={3}
                  value={editConfigData.announcement || ''}
                  onChange={e => setEditConfigData({ ...editConfigData, announcement: e.target.value })}
                  placeholder="Nhập thông báo về thời hạn, thể thức hoặc quy định giải đấu..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  style={{ padding: '9px 20px', background: '#047857', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(4,120,87,0.3)' }}
                >
                  <Save size={15} /> {savingConfig ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA ĐỘI HÌNH (ADMIN) */}
      {editingTeam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: 'bold', fontSize: '17px' }}>
                <Edit size={20} color="#0369a1" /> CHỈNH SỬA ĐỘI HÌNH: LỚP {editingTeam.formState.className}
              </div>
              <button onClick={() => setEditingTeam(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Lớp / Chi đoàn *</label>
                  <input
                    type="text"
                    required
                    value={editingTeam.formState.className}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, className: e.target.value } })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontWeight: 'bold' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>GVCN Xác Nhận *</label>
                  <input
                    type="text"
                    required
                    value={editingTeam.formState.gvcn}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, gvcn: e.target.value } })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Họ Tên Đội Trưởng *</label>
                  <input
                    type="text"
                    required
                    value={editingTeam.formState.captain}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, captain: e.target.value } })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Số Điện Thoại Liên Hệ *</label>
                  <input
                    type="text"
                    required
                    value={editingTeam.formState.phone}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, phone: e.target.value } })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* 3 VĐV NAM */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
                  👦 03 VẬN ĐỘNG VIÊN NAM CHÍNH THỨC:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Nam 1 *"
                    required
                    value={editingTeam.formState.male1}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, male1: e.target.value } })}
                    style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '12.5px' }}
                  />
                  <input
                    type="text"
                    placeholder="Nam 2 *"
                    required
                    value={editingTeam.formState.male2}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, male2: e.target.value } })}
                    style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '12.5px' }}
                  />
                  <input
                    type="text"
                    placeholder="Nam 3 *"
                    required
                    value={editingTeam.formState.male3}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, male3: e.target.value } })}
                    style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* 3 VĐV NỮ */}
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#be123c', marginBottom: '8px' }}>
                  👧 03 VẬN ĐỘNG VIÊN NỮ CHÍNH THỨC:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Nữ 1 *"
                    required
                    value={editingTeam.formState.female1}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, female1: e.target.value } })}
                    style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid #fda4af', fontSize: '12.5px' }}
                  />
                  <input
                    type="text"
                    placeholder="Nữ 2 *"
                    required
                    value={editingTeam.formState.female2}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, female2: e.target.value } })}
                    style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid #fda4af', fontSize: '12.5px' }}
                  />
                  <input
                    type="text"
                    placeholder="Nữ 3 *"
                    required
                    value={editingTeam.formState.female3}
                    onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, female3: e.target.value } })}
                    style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid #fda4af', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* DỰ BỊ & GHI CHÚ */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>VĐV Dự Bị (nếu có):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn D, Lê Thị E..."
                  value={editingTeam.formState.reserves}
                  onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, reserves: e.target.value } })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Ghi Chú Ban Tổ Chức:</label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm..."
                  value={editingTeam.formState.extra_notes}
                  onChange={e => setEditingTeam({ ...editingTeam, formState: { ...editingTeam.formState, extra_notes: e.target.value } })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingEditTeam}
                  style={{ padding: '8px 18px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}
                >
                  <Save size={14} /> {savingEditTeam ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
