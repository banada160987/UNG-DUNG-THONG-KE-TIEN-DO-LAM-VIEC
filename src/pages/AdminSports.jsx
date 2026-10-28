import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Trophy, Download, Trash2, Search, Filter, RefreshCw, 
  Dices, Printer, Users, DollarSign, CheckCircle2, AlertCircle, 
  X, ShieldAlert, Eye, Copy, Check, FileText, MessageCircle,
  Settings, Edit, Clock, Lock, CheckSquare, Save, AlertTriangle,
  PlusCircle, Calendar, Tag, ChevronDown, Award
} from 'lucide-react';
import { 
  fetchTournaments, 
  saveTournaments, 
  checkTournamentStatus, 
  COMMON_SPORTS_PRESETS,
  DEFAULT_TOURNAMENTS 
} from '../services/sportsTournamentService';

export default function AdminSports() {
  const [tournaments, setTournaments] = useState(DEFAULT_TOURNAMENTS);
  const [selectedTournId, setSelectedTournId] = useState(DEFAULT_TOURNAMENTS[0].id);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // ➕ MODAL TẠO GIẢI ĐẤU MỚI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSportInput, setNewSportInput] = useState('');
  const [createFormData, setCreateFormData] = useState({
    name: '',
    academic_year: '2026-2027',
    short_desc: '',
    format: 'class_team', // 'class_team' | 'individual'
    team_config: {
      require_class: true,
      require_gvcn: true,
      male_count: 3,
      female_count: 3,
      allow_reserves: true
    },
    sports: ['Bóng chuyền Nam - Nữ phối hợp (3 Nam, 3 Nữ)'],
    start_date: '2026-10-20T00:00',
    end_date: '2026-10-30T23:59',
    is_open: true,
    prevent_duplicate: true,
    zalo_link: 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa',
    fee_amount: 0,
    announcement: 'Thời hạn đăng ký: Mỗi lớp đăng ký 01 đội thi đấu.'
  });

  // ⚙️ MODAL CẤU HÌNH / SỬA GIẢI ĐẤU HIỆN TẠI
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editTournData, setEditTournData] = useState(null);
  const [editSportInput, setEditSportInput] = useState('');
  const [savingTourn, setSavingTourn] = useState(false);

  // ✏️ MODAL SỬA ĐỘI HÌNH VẬN ĐỘNG VIÊN
  const [editingTeam, setEditingTeam] = useState(null);
  const [savingEditTeam, setSavingEditTeam] = useState(false);

  // 🎲 MODAL BỐC THĂM BẢNG ĐẤU & PHÂN CẶP
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [drawSport, setDrawSport] = useState('');
  const [drawMode, setDrawMode] = useState('knockout'); // 'knockout' | 'groups'
  const [numGroups, setNumGroups] = useState(2);
  const [drawnBrackets, setDrawnBrackets] = useState(null);
  const [copiedSchedule, setCopiedSchedule] = useState(false);

  // 👁️ MODAL XEM CHI TIẾT ĐỘI HÌNH
  const [selectedTeamView, setSelectedTeamView] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const tourns = await fetchTournaments();
      setTournaments(tourns);
      if (tourns.length > 0 && !tourns.some(t => t.id === selectedTournId)) {
        setSelectedTournId(tourns[0].id);
      }
      await fetchRegistrations();
    } catch (err) {
      console.error("Lỗi nạp dữ liệu ban đầu:", err);
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
      console.warn("Dùng fallback LocalStorage:", err);
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      setRegistrations(local);
    }
  }

  // Giải đấu đang được chọn để quản lý
  const activeTourn = useMemo(() => {
    return tournaments.find(t => t.id === selectedTournId) || tournaments[0] || null;
  }, [tournaments, selectedTournId]);

  // Trạng thái mở/đóng của giải đang chọn
  const activeTournStatus = useMemo(() => {
    return checkTournamentStatus(activeTourn);
  }, [activeTourn]);

  // Danh sách đăng ký thuộc giải đấu đang chọn
  const activeTournRegistrations = useMemo(() => {
    if (!activeTourn) return registrations;
    return registrations.filter(r => {
      if (r.table_group === activeTourn.id) return true;
      // Khớp dữ liệu cũ chưa có table_group
      if (!r.table_group) {
        const isVolleyball = (r.sport_name || '').includes('Bóng chuyền') || (r.sport_name || '').includes('20/11');
        if (activeTourn.id === 'tourn-2026-volleyball-20-11' && isVolleyball) return true;
        if (activeTourn.id === 'tourn-2026-hoi-thao-30-nam' && !isVolleyball) return true;
      }
      return false;
    });
  }, [registrations, activeTourn]);

  // Lọc theo tìm kiếm và môn
  const filteredRegistrations = useMemo(() => {
    return activeTournRegistrations.filter(item => {
      const matchSport = selectedSport === 'Tất cả' || 
        (item.sport_name || '').includes(selectedSport) || 
        selectedSport.includes(item.sport_name || '');
      const matchSearch = 
        (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.unit_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.cohort_year || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.phone || '').includes(searchQuery) ||
        (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSport && matchSearch;
    });
  }, [activeTournRegistrations, selectedSport, searchQuery]);

  // Cập nhật môn bốc thăm mặc định khi giải đổi
  useEffect(() => {
    if (activeTourn && activeTourn.sports && activeTourn.sports.length > 0) {
      setDrawSport(activeTourn.sports[0]);
    }
  }, [activeTourn]);

  // ================= XỬ LÝ TẠO GIẢI ĐẤU MỚI =================
  const handleOpenCreateModal = () => {
    setCreateFormData({
      name: '',
      academic_year: '2026-2027',
      short_desc: '',
      format: 'class_team',
      team_config: {
        require_class: true,
        require_gvcn: true,
        male_count: 3,
        female_count: 3,
        allow_reserves: true
      },
      sports: ['Bóng chuyền Nam - Nữ phối hợp (3 Nam, 3 Nữ)'],
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      is_open: true,
      prevent_duplicate: true,
      zalo_link: 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa',
      fee_amount: 0,
      announcement: 'Thời hạn đăng ký: Mỗi lớp đăng ký 01 đội thi đấu.'
    });
    setNewSportInput('');
    setShowCreateModal(true);
  };

  const handleAddSportToCreate = (sport) => {
    if (!sport || !sport.trim()) return;
    const trimmed = sport.trim();
    if (!createFormData.sports.includes(trimmed)) {
      setCreateFormData(prev => ({ ...prev, sports: [...prev.sports, trimmed] }));
    }
    setNewSportInput('');
  };

  const handleRemoveSportFromCreate = (sport) => {
    setCreateFormData(prev => ({
      ...prev,
      sports: prev.sports.filter(s => s !== sport)
    }));
  };

  const handleSaveNewTournament = async (e) => {
    e.preventDefault();
    if (!createFormData.name.trim()) {
      alert("Vui lòng nhập tên cuộc đăng ký / giải đấu!");
      return;
    }
    if (createFormData.sports.length === 0) {
      alert("Vui lòng thêm ít nhất 01 môn thi đấu cho giải!");
      return;
    }

    setSavingTourn(true);
    const newId = `tourn-${Date.now()}`;
    const newTournament = {
      id: newId,
      name: createFormData.name.trim(),
      academic_year: createFormData.academic_year.trim(),
      short_desc: createFormData.short_desc.trim(),
      format: createFormData.format,
      team_config: createFormData.team_config,
      sports: createFormData.sports,
      start_date: createFormData.start_date,
      end_date: createFormData.end_date,
      is_open: createFormData.is_open,
      prevent_duplicate: createFormData.prevent_duplicate,
      zalo_link: createFormData.zalo_link.trim() || 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa',
      fee_amount: Number(createFormData.fee_amount) || 0,
      announcement: createFormData.announcement.trim(),
      status: 'active',
      created_at: new Date().toISOString()
    };

    const updatedTournaments = [newTournament, ...tournaments];
    await saveTournaments(updatedTournaments);
    setTournaments(updatedTournaments);
    setSelectedTournId(newId);
    setSavingTourn(false);
    setShowCreateModal(false);
    alert(`🎉 Đã tạo thành công giải đấu: "${newTournament.name}"!`);
  };

  // ================= XỬ LÝ SỬA / CẤU HÌNH GIẢI ĐẤU HIỆN TẠI =================
  const handleOpenConfigModal = () => {
    if (!activeTourn) return;
    setEditTournData(JSON.parse(JSON.stringify(activeTourn)));
    setEditSportInput('');
    setShowConfigModal(true);
  };

  const handleAddSportToEdit = (sport) => {
    if (!sport || !sport.trim()) return;
    const trimmed = sport.trim();
    if (!editTournData.sports.includes(trimmed)) {
      setEditTournData(prev => ({ ...prev, sports: [...prev.sports, trimmed] }));
    }
    setEditSportInput('');
  };

  const handleRemoveSportFromEdit = (sport) => {
    setEditTournData(prev => ({
      ...prev,
      sports: prev.sports.filter(s => s !== sport)
    }));
  };

  const handleSaveEditTournament = async (e) => {
    e.preventDefault();
    if (!editTournData) return;
    setSavingTourn(true);

    const updatedTournaments = tournaments.map(t => 
      t.id === editTournData.id ? editTournData : t
    );

    await saveTournaments(updatedTournaments);
    setTournaments(updatedTournaments);
    setSavingTourn(false);
    setShowConfigModal(false);
    alert("✅ Đã cập nhật cấu hình giải đấu thành công!");
  };

  // ================= XÓA GIẢI ĐẤU =================
  const handleDeleteTournament = async (tournId) => {
    if (tournaments.length <= 1) {
      alert("Hệ thống cần duy trì ít nhất 01 giải đấu!");
      return;
    }
    const target = tournaments.find(t => t.id === tournId);
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cuộc thi đấu: "${target?.name}" không?\n(Lưu ý: Các đơn đăng ký cũ vẫn được giữ an toàn trong cơ sở dữ liệu).`)) {
      return;
    }

    const updated = tournaments.filter(t => t.id !== tournId);
    await saveTournaments(updated);
    setTournaments(updated);
    setSelectedTournId(updated[0].id);
    alert("Đã xóa giải đấu thành công!");
  };

  // ================= XÓA 1 ĐƠN ĐĂNG KÝ =================
  const handleDeleteRegistration = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lượt đăng ký này không?")) return;

    try {
      await supabase.from('cbq_sports_registrations').delete().eq('id', id);
      setRegistrations(prev => prev.filter(item => item.id !== id));
      
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      const updatedLocal = local.filter(item => item.id !== id);
      localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
      alert("Đã xóa lượt đăng ký!");
    } catch (err) {
      console.error("Lỗi xóa VĐV:", err);
      alert("Không thể xóa. Vui lòng thử lại!");
    }
  };

  // ================= XỬ LÝ SỬA ĐỘI HÌNH (ADMIN) =================
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
      ...(editingTeam.roster || {}),
      tournament_id: activeTourn?.id || item.table_group,
      tournament_name: activeTourn?.name || 'Giải Thể Thao',
      class: formState.className,
      captain: formState.captain.trim(),
      captain_phone: formState.phone.trim(),
      gvcn: formState.gvcn.trim(),
      male_athletes: [formState.male1.trim(), formState.male2.trim(), formState.male3.trim()].filter(Boolean),
      female_athletes: [formState.female1.trim(), formState.female2.trim(), formState.female3.trim()].filter(Boolean),
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
      alert("✅ Đã lưu vào bộ nhớ quản trị!");
      setEditingTeam(null);
    } finally {
      setSavingEditTeam(false);
    }
  };

  // ================= XUẤT CSV TIỀN TỐ 1-... THEO GEMINI.MD =================
  const exportCSV = () => {
    if (filteredRegistrations.length === 0) {
      alert("Không có dữ liệu trong giải đấu này để xuất file!");
      return;
    }

    let csvContent = "\uFEFFSTT,GIẢI ĐẤU,CHI ĐOÀN LỚP / ĐƠN VỊ,ĐỘI TRƯỞNG / HỌ TÊN,SỐ ĐIỆN THOẠI,MÔN THI ĐẤU,GVCN XÁC NHẬN,VĐV NAM CHÍNH THỨC,VĐV NỮ CHÍNH THỨC,VĐV DỰ BỊ,ĐỐI TƯỢNG,KINH PHÍ,GHI CHÚ,NGÀY ĐĂNG KÝ\n";
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
        `"${activeTourn?.name || ''}"`,
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

    const safeName = (activeTourn?.name || 'Giai_the_thao')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `1-Danh_sach_dang_ky_${safeName}_CBQ_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ================= BỐC THĂM BẢNG ĐẤU & PHÂN CẶP =================
  const handleRandomDraw = () => {
    const athletesInSport = activeTournRegistrations.filter(r => 
      (r.sport_name || '').includes(drawSport) || drawSport.includes(r.sport_name || '')
    );
    if (athletesInSport.length === 0) {
      alert(`Hiện tại chưa có VĐV hoặc Đội nào đăng ký môn "${drawSport}" trong giải đấu này.`);
      return;
    }

    const shuffled = [...athletesInSport].sort(() => Math.random() - 0.5);

    if (drawMode === 'knockout') {
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
      const groups = Array.from({ length: numGroups }, () => []);
      shuffled.forEach((item, idx) => {
        groups[idx % numGroups].push(item);
      });
      setDrawnBrackets({ type: 'groups', groups });
    }
  };

  const copyDrawSchedule = () => {
    if (!drawnBrackets || !activeTourn) return;
    let text = `🏛️ TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK\n📢 KẾT QUẢ BỐC THĂM: ${activeTourn.name.toUpperCase()}\n🏸 MÔN THI ĐẤU: ${drawSport.toUpperCase()}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (drawnBrackets.type === 'knockout') {
      text += `🎯 THỂ THỨC: THI ĐẤU LOẠI TRỰC TIẾP\n\n`;
      drawnBrackets.matchups.forEach(m => {
        if (m.isBye) {
          text += `🔹 Trận ${m.matchNumber}: Đội ${m.teamA.cohort_year || m.teamA.unit_name || m.teamA.full_name} (ĐẶC CÁCH VÀO VÒNG SAU)\n`;
        } else {
          text += `🔹 Trận ${m.matchNumber}: ${m.teamA.cohort_year || m.teamA.unit_name || m.teamA.full_name} ⚔️ ${m.teamB.cohort_year || m.teamB.unit_name || m.teamB.full_name}\n`;
        }
      });
    } else {
      text += `🎯 THỂ THỨC: CHIA BẢNG ĐẤU VÒNG TRÒN\n\n`;
      drawnBrackets.groups.forEach((grp, idx) => {
        text += `📌 BẢNG ${String.fromCharCode(65 + idx)}:\n`;
        grp.forEach((t, i) => {
          text += `  ${i + 1}. ${t.cohort_year || t.unit_name || t.full_name}\n`;
        });
        text += `\n`;
      });
    }

    text += `\n📲 Link nhóm Zalo giải đấu: ${activeTourn.zalo_link || 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa'}\n⏰ Kính đề nghị các Đội trưởng & VĐV theo dõi thời gian và địa điểm thi đấu!`;
    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 3000);
  };

  // Thống kê nhanh của giải đang chọn
  const totalTeams = activeTournRegistrations.length;
  const isVolleyballActive = (activeTourn?.name || '').includes('Bóng chuyền');

  return (
    <div style={{ padding: '20px', maxWidth: '1320px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER & TOURNAMENT SELECTOR */}
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Trophy size={18} /> HỆ THỐNG QUẢN LÝ GIẢI ĐẤU THỂ THAO CAO BÁ QUÁT
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>
              {activeTourn?.name || 'Quản Lý Giải Đấu'}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {activeTourn?.short_desc || 'Tổ chức, tiếp nhận hồ sơ đăng ký và bốc thăm lịch thi đấu thể thao trường học.'}
            </p>
          </div>

          {/* CÁC NÚT TÁC VỤ CHÍNH */}
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            
            <button
              onClick={handleOpenCreateModal}
              style={{
                padding: '9px 16px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                fontSize: '13.5px'
              }}
              title="Tạo cuộc đăng ký / giải đấu thể thao mới"
            >
              <PlusCircle size={17} /> ➕ Tạo Cuộc Đăng Ký Mới
            </button>

            <button
              onClick={handleOpenConfigModal}
              style={{
                padding: '9px 14px',
                background: '#f8fafc',
                color: '#0369a1',
                border: '1.5px solid #bae6fd',
                borderRadius: '9px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
              title="Sửa cấu hình thời hạn, môn thi, chống trùng của giải đang chọn"
            >
              <Settings size={15} /> ⚙️ Sửa Cấu Hình Giải
            </button>

            <a
              href={activeTourn?.zalo_link || 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa'}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '9px 13px',
                background: '#0068ff',
                color: '#ffffff',
                borderRadius: '9px',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,104,255,0.2)'
              }}
            >
              <MessageCircle size={15} /> Zalo Giải
            </a>

            <button
              onClick={() => setShowBracketModal(true)}
              style={{ padding: '9px 14px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '9px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}
            >
              <Dices size={16} /> 🎲 Bốc Thăm
            </button>

            <button
              onClick={exportCSV}
              style={{ padding: '9px 14px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '9px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', boxShadow: '0 4px 12px rgba(22,101,52,0.2)' }}
              title="Xuất file Excel/CSV theo quy tắc tiền tố 1-..."
            >
              <Download size={15} /> Xuất File (1-...)
            </button>

            <button
              onClick={fetchRegistrations}
              style={{ padding: '9px 12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '9px', cursor: 'pointer' }}
              title="Tải lại dữ liệu"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* THANH CHỌN GIẢI ĐẤU (TOURNAMENT SWITCHER BAR) */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#64748b' }}>
            🏆 Chọn Giải Đấu Quản Lý:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            {tournaments.map(t => {
              const isSelected = t.id === selectedTournId;
              const status = checkTournamentStatus(t);
              const count = registrations.filter(r => r.table_group === t.id || (!r.table_group && t.id === 'tourn-2026-volleyball-20-11' && (r.sport_name || '').includes('Bóng chuyền'))).length;

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTournId(t.id);
                    setSelectedSport('Tất cả');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: isSelected ? '#e0f2fe' : '#ffffff',
                    color: isSelected ? '#0369a1' : '#334155',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{t.name}</span>
                  <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: isSelected ? '#0284c7' : '#e2e8f0', color: isSelected ? '#ffffff' : '#475569', fontWeight: 'bold' }}>
                    {count}
                  </span>
                  <span style={{ fontSize: '11px', color: status.color, fontWeight: 'bold' }}>
                    • {status.allowed ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </button>
              );
            })}
          </div>

          {tournaments.length > 1 && (
            <button
              onClick={() => handleDeleteTournament(selectedTournId)}
              style={{ padding: '6px 10px', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Xóa giải đấu đang chọn"
            >
              <Trash2 size={13} /> Xóa Giải Này
            </button>
          )}
        </div>

      </div>

      {/* STATISTIC DASHBOARD CARDS DÀNH CHO GIẢI ĐANG CHỌN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 14px rgba(2,132,199,0.2)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9 }}>TỔNG ĐƠN ĐĂNG KÝ (GIẢI NÀY)</div>
          <div style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0' }}>{totalTeams} <span style={{ fontSize: '14px' }}>Đội / VĐV</span></div>
          <div style={{ fontSize: '11.5px', opacity: 0.85 }}>Học sinh & đơn vị tham gia</div>
        </div>

        <div style={{ background: '#ffffff', border: `1.5px solid ${activeTournStatus.border}`, borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: activeTournStatus.color }}>TRẠNG THÁI TIẾP NHẬN HỒ SƠ</div>
          <div style={{ fontSize: '17px', fontWeight: '800', color: activeTournStatus.color, margin: '6px 0 4px 0' }}>
            {activeTournStatus.badge}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            Hạn chót: {activeTourn?.end_date ? new Date(activeTourn.end_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>HÌNH THỨC & THỂ THỨC</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '6px 0 4px 0' }}>
            {activeTourn?.format === 'class_team' ? 'Đội Chi đoàn Lớp' : 'Cá nhân / Đôi'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            {activeTourn?.format === 'class_team' 
              ? `${activeTourn.team_config?.male_count || 3} Nam + ${activeTourn.team_config?.female_count || 3} Nữ` 
              : `${(activeTourn?.sports || []).length} Môn thi đấu`}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>CHỐNG TRÙNG & KINH PHÍ</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: activeTourn?.prevent_duplicate ? '#166534' : '#64748b', margin: '6px 0 4px 0' }}>
            {activeTourn?.prevent_duplicate ? '🛡️ Chống trùng bật' : 'Tự do đăng ký'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            Lệ phí: {activeTourn?.fee_amount === 0 ? 'Miễn phí 100%' : `${Number(activeTourn?.fee_amount).toLocaleString()}đ`}
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo Tên Lớp, VĐV, Đội trưởng, GVCN hoặc SĐT..."
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
            <option value="Tất cả">Tất Cả Môn Thi ({activeTournRegistrations.length})</option>
            {(activeTourn?.sports || []).map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang nạp danh sách đăng ký...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '45px 20px', color: '#94a3b8' }}>
            <Trophy size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <div>Chưa có lượt đăng ký nào trong giải đấu <strong>"{activeTourn?.name}"</strong> thỏa mãn điều kiện lọc.</div>
          </div>
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
                        {item.cohort_year || item.unit_name || 'Chi đoàn'}
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
                          {item.payment_status || (item.fee_amount === 0 ? 'Miễn phí' : `${Number(item.fee_amount).toLocaleString()}đ`)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                          {roster ? (
                            <>
                              <button
                                onClick={() => setSelectedTeamView({ item, roster })}
                                style={{ padding: '4px 7px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                title="Xem danh sách VĐV"
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
                            onClick={() => handleDeleteRegistration(item.id)}
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

      {/* ================= MODAL TẠO CUỘC ĐĂNG KÝ / GIẢI ĐẤU MỚI ================= */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 'bold', fontSize: '18px' }}>
                <PlusCircle size={22} color="#059669" /> TẠO CUỘC ĐĂNG KÝ / GIẢI ĐẤU THỂ THAO MỚI
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTournament} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Tên Cuộc Đăng Ký / Giải Đấu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hội khỏe Phù Đổng cấp trường năm học 2026-2027..."
                    value={createFormData.name}
                    onChange={e => setCreateFormData({ ...createFormData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontWeight: 'bold' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Năm học / Đợt *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.academic_year}
                    onChange={e => setCreateFormData({ ...createFormData, academic_year: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Mô Tả Ngắn / Điều Lệ Tóm Tắt:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giải thể thao truyền thống chào mừng ngày thành lập Đoàn 26/3..."
                  value={createFormData.short_desc}
                  onChange={e => setCreateFormData({ ...createFormData, short_desc: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              {/* HÌNH THỨC THI ĐẤU */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
                  Hình Thức Đăng Ký Thi Đấu *
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    <input
                      type="radio"
                      name="create_format"
                      checked={createFormData.format === 'class_team'}
                      onChange={() => setCreateFormData({ ...createFormData, format: 'class_team' })}
                    />
                    <span>🏐 Theo Đội Chi Đoàn Lớp (có số lượng Nam, Nữ)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    <input
                      type="radio"
                      name="create_format"
                      checked={createFormData.format === 'individual'}
                      onChange={() => setCreateFormData({ ...createFormData, format: 'individual' })}
                    />
                    <span>🏃 Theo Cá Nhân / Tự Do / Giao Lưu</span>
                  </label>
                </div>

                {createFormData.format === 'class_team' && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', color: '#475569', display: 'block' }}>Số VĐV Nam chính:</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={createFormData.team_config.male_count}
                        onChange={e => setCreateFormData({ ...createFormData, team_config: { ...createFormData.team_config, male_count: Number(e.target.value) } })}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11.5px', color: '#475569', display: 'block' }}>Số VĐV Nữ chính:</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={createFormData.team_config.female_count}
                        onChange={e => setCreateFormData({ ...createFormData, team_config: { ...createFormData.team_config, female_count: Number(e.target.value) } })}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '14px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={createFormData.team_config.require_gvcn}
                          onChange={e => setCreateFormData({ ...createFormData, team_config: { ...createFormData.team_config, require_gvcn: e.target.checked } })}
                        />
                        <span>Cần GVCN xác nhận</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* MÔN THI ĐẤU */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Danh Sách Môn Thi Đấu Trong Giải *
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Gõ tên môn thi mới rồi bấm Thêm (ví dụ: Kéo co, Cầu lông, Futsal...)"
                    value={newSportInput}
                    onChange={e => setNewSportInput(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSportToCreate(newSportInput)}
                    style={{ padding: '7px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    + Thêm Môn
                  </button>
                </div>

                {/* Các môn thi nhanh có sẵn */}
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Gợi ý nhanh (Bấm để thêm):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                  {COMMON_SPORTS_PRESETS.map(sp => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => handleAddSportToCreate(sp)}
                      style={{ padding: '3px 8px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '11px', color: '#334155', cursor: 'pointer' }}
                    >
                      + {sp}
                    </button>
                  ))}
                </div>

                {/* Danh sách các môn đã chọn */}
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {createFormData.sports.map(s => (
                    <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSportFromCreate(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold', padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* THỜI GIAN VÀ CÔNG TẮC */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Ngày giờ Bắt đầu mở cổng:</label>
                  <input
                    type="datetime-local"
                    value={createFormData.start_date}
                    onChange={e => setCreateFormData({ ...createFormData, start_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#dc2626', marginBottom: '4px' }}>Hạn chót Đóng cổng:</label>
                  <input
                    type="datetime-local"
                    value={createFormData.end_date}
                    onChange={e => setCreateFormData({ ...createFormData, end_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', fontWeight: 'bold', color: '#b91c1c' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 'bold', color: '#166534' }}>
                    <input
                      type="checkbox"
                      checked={createFormData.is_open}
                      onChange={e => setCreateFormData({ ...createFormData, is_open: e.target.checked })}
                    />
                    <span>🟢 Mở cổng nhận hồ sơ ngay</span>
                  </label>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={createFormData.prevent_duplicate}
                      onChange={e => setCreateFormData({ ...createFormData, prevent_duplicate: e.target.checked })}
                    />
                    <span>🛡️ Chống nộp trùng (Mỗi lớp 1 đội)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Link Nhóm Zalo Giải Đấu:</label>
                  <input
                    type="url"
                    value={createFormData.zalo_link}
                    onChange={e => setCreateFormData({ ...createFormData, zalo_link: e.target.value })}
                    placeholder="https://zalo.me/g/..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Kinh phí (0 = Miễn phí):</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={createFormData.fee_amount}
                    onChange={e => setCreateFormData({ ...createFormData, fee_amount: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Thông Báo Hiển Thị Ngoài Cổng Cho Học Sinh & GVCN:</label>
                <textarea
                  rows={2}
                  value={createFormData.announcement}
                  onChange={e => setCreateFormData({ ...createFormData, announcement: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingTourn}
                  style={{ padding: '8px 20px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
                >
                  <Save size={15} /> {savingTourn ? 'Đang lưu...' : 'Lưu & Khởi Tạo Giải'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL SỬA CẤU HÌNH GIẢI ĐẤU HIỆN TẠI ================= */}
      {showConfigModal && editTournData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: 'bold', fontSize: '18px' }}>
                <Settings size={22} color="#0369a1" /> SỬA CẤU HÌNH: {editTournData.name}
              </div>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTournament} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Tên Giải Đấu *</label>
                  <input
                    type="text"
                    required
                    value={editTournData.name}
                    onChange={e => setEditTournData({ ...editTournData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontWeight: 'bold' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Năm học *</label>
                  <input
                    type="text"
                    required
                    value={editTournData.academic_year || ''}
                    onChange={e => setEditTournData({ ...editTournData, academic_year: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Mô Tả Ngắn:</label>
                <input
                  type="text"
                  value={editTournData.short_desc || ''}
                  onChange={e => setEditTournData({ ...editTournData, short_desc: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              {/* MÔN THI ĐẤU */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Môn Thi Đấu Trong Giải:</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Thêm môn thi..."
                    value={editSportInput}
                    onChange={e => setEditSportInput(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSportToEdit(editSportInput)}
                    style={{ padding: '7px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    + Thêm
                  </button>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(editTournData.sports || []).map(s => (
                    <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSportFromEdit(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold', padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* THỜI GIAN */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Ngày giờ Bắt đầu:</label>
                  <input
                    type="datetime-local"
                    value={editTournData.start_date || ''}
                    onChange={e => setEditTournData({ ...editTournData, start_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#dc2626', marginBottom: '4px' }}>Hạn chót Đóng cổng:</label>
                  <input
                    type="datetime-local"
                    value={editTournData.end_date || ''}
                    onChange={e => setEditTournData({ ...editTournData, end_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', fontWeight: 'bold', color: '#b91c1c' }}
                  />
                </div>
              </div>

              {/* CÔNG TẮC TRẠNG THÁI */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: editTournData.is_open ? '#f0fdf4' : '#fef2f2', border: `1px solid ${editTournData.is_open ? '#bbf7d0' : '#fecaca'}`, padding: '10px', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 'bold', color: editTournData.is_open ? '#166534' : '#991b1b' }}>
                    <input
                      type="checkbox"
                      checked={editTournData.is_open}
                      onChange={e => setEditTournData({ ...editTournData, is_open: e.target.checked })}
                    />
                    <span>🟢 Mở cổng nhận hồ sơ</span>
                  </label>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={editTournData.prevent_duplicate}
                      onChange={e => setEditTournData({ ...editTournData, prevent_duplicate: e.target.checked })}
                    />
                    <span>🛡️ Chống nhập trùng (Mỗi lớp 1 đội)</span>
                  </label>
                </div>
              </div>

              {/* ZALO & KINH PHÍ */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Link Nhóm Zalo:</label>
                  <input
                    type="url"
                    value={editTournData.zalo_link || ''}
                    onChange={e => setEditTournData({ ...editTournData, zalo_link: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Kinh phí (0 = Miễn phí):</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={editTournData.fee_amount || 0}
                    onChange={e => setEditTournData({ ...editTournData, fee_amount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Thông Báo Hiển Thị Ngoài Cổng:</label>
                <textarea
                  rows={2}
                  value={editTournData.announcement || ''}
                  onChange={e => setEditTournData({ ...editTournData, announcement: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingTourn}
                  style={{ padding: '8px 20px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}
                >
                  <Save size={15} /> {savingTourn ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL SỬA ĐỘI HÌNH VẬN ĐỘNG VIÊN ================= */}
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

      {/* ================= MODAL XEM CHI TIẾT ĐỘI HÌNH ================= */}
      {selectedTeamView && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '22px', maxWidth: '540px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0369a1', fontWeight: 'bold' }}>
                🏐 Đội Hình Lớp {selectedTeamView.item.cohort_year || selectedTeamView.item.unit_name}
              </h3>
              <button onClick={() => setSelectedTeamView(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ background: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '12px' }}>
              <div><strong>Đội trưởng:</strong> {selectedTeamView.roster?.captain} (SĐT: {selectedTeamView.item.phone})</div>
              <div><strong>GVCN / Phụ trách:</strong> {selectedTeamView.roster?.gvcn}</div>
              <div><strong>Môn thi đấu:</strong> {selectedTeamView.item.sport_name}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>👦 VĐV NAM CHÍNH THỨC:</div>
                {(selectedTeamView.roster?.male_athletes || []).map((m, i) => (
                  <div key={i} style={{ fontSize: '12px', padding: '2px 0' }}>{i + 1}. {m}</div>
                ))}
              </div>

              <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#be123c', marginBottom: '6px' }}>👧 VĐV NỮ CHÍNH THỨC:</div>
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

      {/* ================= MODAL BỐC THĂM CHIA BẢNG ĐẤU & PHÂN CẶP ================= */}
      {showBracketModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 'bold', fontSize: '18px' }}>
                <Dices size={24} color="#7c3aed" /> BỐC THĂM THI ĐẤU: {activeTourn?.name}
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
                  {(activeTourn?.sports || []).map(sp => (
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
                            🎉 <strong>{m.teamA.cohort_year || m.teamA.unit_name || m.teamA.full_name}</strong>: <em>Đặc cách vào vòng sau</em>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                            <span style={{ fontWeight: 'bold', color: '#0369a1' }}>{m.teamA.cohort_year || m.teamA.unit_name || m.teamA.full_name}</span>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>VS</span>
                            <span style={{ fontWeight: 'bold', color: '#be123c' }}>{m.teamB.cohort_year || m.teamB.unit_name || m.teamB.full_name}</span>
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
                              <strong>{v.cohort_year || v.unit_name || v.full_name}</strong>
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
                Vui lòng chọn môn và bấm <strong>"🎲 Tiến Hành Bốc Thăm"</strong> để tạo lịch thi đấu.
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
