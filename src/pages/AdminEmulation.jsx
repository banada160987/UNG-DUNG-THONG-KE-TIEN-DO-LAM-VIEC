import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Award, Trophy, Printer, Search, Plus, Trash2, Edit3, Settings, 
  ShieldAlert, CheckCircle2, FileText, Download, Save, RefreshCw, 
  Layers, Star, Sparkles, Filter, Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

const DEFAULT_CLASSES = [
  '10A01', '10A02', '10A03', '10A04', '10A05', '10A06', '10A07', '10A08', '10A09', '10A10', '10A11', '10A12',
  '11A01', '11A02', '11A03', '11A04', '11A05', '11A06', '11A07', '11A08', '11A09', '11A10', '11A11', '11A12',
  '12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10', '12A11', '12A12'
];

const DEFAULT_CRITERIA = [
  { id: '1', category: 'Hoạt động Câu Lạc Bộ', title: 'Học sinh tham gia sinh hoạt CLB tích cực & đúng giờ', score_change: 2, is_active: true },
  { id: '2', category: 'Hoạt động Câu Lạc Bộ', title: 'Học sinh vắng sinh hoạt CLB không phép', score_change: -2, is_active: true },
  { id: '3', category: 'Nếp sống & Đồng phục', title: 'Không đeo thẻ / Không mặc đồng phục quy định', score_change: -5, is_active: true },
  { id: '4', category: 'Nếp sống & Đồng phục', title: 'Đi học muộn / Nắm tóc, trang phục sai quy định', score_change: -5, is_active: true },
  { id: '5', category: 'Vệ sinh & Cảnh quan', title: 'Vệ sinh lớp / sân trường muộn hoặc bẩn', score_change: -5, is_active: true },
  { id: '6', category: 'Vệ sinh & Cảnh quan', title: 'Quên tắt điện, quạt, máy chiếu khi ra khỏi lớp', score_change: -5, is_active: true },
  { id: '7', category: 'Học tập & Truy bài', title: 'Truy bài đầu giờ mất trật tự', score_change: -5, is_active: true },
  { id: '8', category: 'Sĩ số & Kỷ luật', title: 'Học sinh bỏ tiết / trốn học / ra ngoài không phép', score_change: -10, is_active: true },
  { id: '9', category: 'Sĩ số & Kỷ luật', title: 'Học sinh vắng không lý do', score_change: -5, is_active: true },
  { id: '10', category: 'Khen thưởng & Xung kích', title: 'Tuyên dương tập thể / Chi đoàn xuất sắc', score_change: 10, is_active: true },
  { id: '11', category: 'Khen thưởng & Xung kích', title: 'Đạt nhiều hoa điểm tốt (Điểm 9 - 10) trong tuần', score_change: 5, is_active: true }
];

export default function AdminEmulation() {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard', 'logs', 'clubs', 'config'
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState('ALL');

  const [classList, setClassList] = useState(DEFAULT_CLASSES);
  const [allLogs, setAllLogs] = useState([]);
  const [criteriaList, setCriteriaList] = useState(DEFAULT_CRITERIA);
  const [loading, setLoading] = useState(true);
  
  // Criteria Form State
  const [showCritForm, setShowCritForm] = useState(false);
  const [editingCritId, setEditingCritId] = useState(null);
  const [critTitle, setCritTitle] = useState('');
  const [critCategory, setCritCategory] = useState('Hoạt động Câu Lạc Bộ');
  const [critScore, setCritScore] = useState(2);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [logsRes, critRes, studentRes] = await Promise.all([
        supabase.from('cbq_emulation_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('cbq_emulation_criteria').select('*').order('created_at', { ascending: true }),
        supabase.from('cbq_students').select('student_class')
      ]);

      if (!logsRes.error && logsRes.data) setAllLogs(logsRes.data);
      if (!critRes.error && critRes.data && critRes.data.length > 0) setCriteriaList(critRes.data);

      let uniqueClasses = [];
      if (!studentRes.error && studentRes.data && studentRes.data.length > 0) {
        uniqueClasses = Array.from(new Set(studentRes.data.map(s => s.student_class))).filter(Boolean).sort();
      } else {
        const cached = localStorage.getItem('cbq_students_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          uniqueClasses = Array.from(new Set(parsed.map(s => s.student_class))).filter(Boolean).sort();
        }
      }
      if (uniqueClasses.length > 0) setClassList(uniqueClasses);
    } catch (err) {
      console.warn("Dùng dữ liệu thi đua mẫu:", err);
    } finally {
      setLoading(false);
    }
  }

  const getGradeLevel = (clsName) => {
    if (!clsName) return 'Khối 10';
    const clean = String(clsName).trim().toUpperCase();
    if (/^12|12[A-Z]/i.test(clean)) return 'Khối 12';
    if (/^11|11[A-Z]/i.test(clean)) return 'Khối 11';
    return 'Khối 10';
  };

  // Compute Weekly Leaderboard with Club Points Breakdown
  const weekLogs = useMemo(() => {
    return allLogs.filter(l => Number(l.week_number) === Number(selectedWeek));
  }, [allLogs, selectedWeek]);
  
  const leaderboardData = useMemo(() => {
    return classList.map(cls => {
      const logsForClass = weekLogs.filter(l => l.student_class === cls);
      let totalDeduction = 0;
      let totalBonus = 0;
      let clubNetScore = 0;
      let regularViolation = 0;

      logsForClass.forEach(l => {
        const s = Number(l.score_change) || 0;
        const isClub = (l.category || '').toLowerCase().includes('câu lạc bộ') || (l.criteria_title || '').includes('[CLB]');

        if (isClub) {
          clubNetScore += s;
        }

        if (s < 0) {
          totalDeduction += Math.abs(s);
          if (!isClub) regularViolation += Math.abs(s);
        } else {
          totalBonus += s;
        }
      });

      const baseScore = 100;
      const finalScore = Math.max(0, baseScore - totalDeduction + totalBonus);
      const gradeLevel = getGradeLevel(cls);

      let classification = 'Xuất sắc';
      if (finalScore >= 95) classification = 'Xuất sắc';
      else if (finalScore >= 85) classification = 'Tốt';
      else if (finalScore >= 70) classification = 'Khá';
      else classification = 'Trung bình';

      return {
        student_class: cls,
        grade_level: gradeLevel,
        base_score: baseScore,
        total_deduction: totalDeduction,
        total_bonus: totalBonus,
        club_net_score: clubNetScore,
        regular_violation: regularViolation,
        final_score: finalScore,
        classification,
        violation_count: logsForClass.filter(l => Number(l.score_change) < 0).length,
        logs: logsForClass
      };
    }).sort((a, b) => b.final_score - a.final_score);
  }, [classList, weekLogs]);

  // Assign overall & grade ranks
  const rankedLeaderboard = useMemo(() => {
    const gradeRankCounter = { 'Khối 10': 1, 'Khối 11': 1, 'Khối 12': 1 };
    return leaderboardData.map((item, idx) => {
      const gradeRank = gradeRankCounter[item.grade_level]++;
      return {
        ...item,
        overall_rank: idx + 1,
        grade_rank: gradeRank
      };
    });
  }, [leaderboardData]);

  const filteredLeaderboard = useMemo(() => {
    return rankedLeaderboard.filter(item => 
      selectedGrade === 'ALL' || item.grade_level === selectedGrade
    );
  }, [rankedLeaderboard, selectedGrade]);

  const handleDeleteLog = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa ghi nhận vi phạm này?")) return;
    try {
      await supabase.from('cbq_emulation_logs').delete().eq('id', id);
      setAllLogs(allLogs.filter(l => l.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleEditCriteria = (c) => {
    setEditingCritId(c.id);
    setCritTitle(c.title);
    setCritCategory(c.category || 'Hoạt động Câu Lạc Bộ');
    setCritScore(c.score_change);
    setShowCritForm(true);
  };

  const handleDeleteCriteria = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tiêu chí thi đua này?")) return;
    try {
      await supabase.from('cbq_emulation_criteria').delete().eq('id', id);
      setCriteriaList(criteriaList.filter(c => c.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleSaveCriteria = async (e) => {
    e.preventDefault();
    if (!critTitle.trim()) return;
    try {
      const payload = {
        title: critTitle.trim(),
        category: critCategory,
        score_change: Number(critScore) || 2,
        is_active: true
      };

      if (editingCritId) {
        await supabase.from('cbq_emulation_criteria').update(payload).eq('id', editingCritId);
      } else {
        await supabase.from('cbq_emulation_criteria').insert([payload]);
      }
      alert("🎉 Đã lưu cấu hình tiêu chí thi đua!");
      setShowCritForm(false);
      setEditingCritId(null);
      fetchData();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleExportExcel = () => {
    const titleHeader = [
      ['SỞ GD&ĐT TỈNH ĐẮK LẮK', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
      ['TRƯỜNG THPT CAO BÁ QUÁT', '', '', 'Độc lập - Tự do - Hạnh phúc'],
      ['', '', '', ''],
      [`BẢNG TỔNG HỢP XẾP HẠNG THI ĐUA CÁC LỚP TOÀN TRƯỜNG`],
      [`(Tuần thi đua thứ: ${selectedWeek} - Năm học 2025 - 2026)`],
      ['', '', '', '']
    ];

    const tableHeaders = [
      ['Hạng Trường', 'Hạng Khối', 'Lớp', 'Khối', 'Điểm Gốc', 'Điểm Trừ Cờ Đỏ', 'Đóng Góp CLB', 'Điểm Thưởng', 'Tổng Điểm', 'Xếp Loại', 'Số Lần Vi Phạm']
    ];

    const dataRows = filteredLeaderboard.map(item => [
      `#${item.overall_rank}`,
      `#${item.grade_rank}`,
      item.student_class,
      item.grade_level,
      item.base_score,
      item.total_deduction > 0 ? `-${item.total_deduction}` : '0',
      item.club_net_score >= 0 ? `+${item.club_net_score}` : `${item.club_net_score}`,
      `+${item.total_bonus}`,
      item.final_score,
      item.classification,
      item.violation_count
    ]);

    const signRows = [
      ['', '', '', '', ''],
      ['', '', '', '', `Đắk Lắk, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`],
      ['', 'BÍ THƯ ĐOÀN TRƯỜNG', '', '', 'HIỆU TRƯỞNG DUYỆT'],
      ['', '(Ký và ghi rõ họ tên)', '', '', '(Ký và đóng dấu)'],
      ['', '', '', '', '']
    ];

    const wsData = [...titleHeader, ...tableHeaders, ...dataRows, ...signRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 14 }, { wch: 16 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `ThiDua_Tuan_${selectedWeek}`);
    XLSX.writeFile(wb, `Bang_Xep_Hang_Thi_Dua_Toan_Truong_Tuan_${selectedWeek}.xlsx`);
  };

  const getClassificationBadgeStyle = (cls) => {
    switch (cls) {
      case 'Xuất sắc': return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
      case 'Tốt': return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' };
      case 'Khá': return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
      default: return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
    }
  };

  return (
    <Layout title="Bảng xếp hạng Thi đua Lớp">
      <style>{`
        @media print {
          header, nav, sidebar, .no-print, .glass { display: none !important; }
          .printable-report { display: block !important; width: 100% !important; margin: 0 auto !important; }
        }
      `}</style>

      {/* PRINTABLE REPORT FOR ASSEMBLY FLAGGING CEREMONY */}
      <div style={{ display: 'none' }} className="printable-report">
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #be123c', paddingBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
          <h2 style={{ margin: '6px 0 2px 0', color: '#be123c', fontSize: '20px', fontWeight: '900' }}>BÁO CÁO TỔNG HỢP THI ĐUA TUẦN {selectedWeek}</h2>
          <div style={{ fontSize: '12px', color: '#475569' }}>Phục vụ BGH nhận xét Giờ Chào cờ Thứ Hai</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000', background: '#f1f5f9' }}>
              <th style={{ padding: '6px', textAlign: 'center' }}>Hạng Trường</th>
              <th style={{ padding: '6px', textAlign: 'center' }}>Hạng Khối</th>
              <th style={{ padding: '6px' }}>Tên Lớp</th>
              <th style={{ padding: '6px' }}>Khối</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>Điểm Gốc</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>Điểm Trừ</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>Điểm Thưởng</th>
              <th style={{ padding: '6px', textAlign: 'right' }}>Tổng Điểm</th>
              <th style={{ padding: '6px', textAlign: 'center' }}>Xếp Loại</th>
            </tr>
          </thead>
          <tbody>
            {rankedLeaderboard.map((item) => (
              <tr key={item.student_class} style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>#{item.overall_rank}</td>
                <td style={{ padding: '6px', textAlign: 'center' }}>#{item.grade_rank}</td>
                <td style={{ padding: '6px', fontWeight: 'bold' }}>Lớp {item.student_class}</td>
                <td style={{ padding: '6px' }}>{item.grade_level}</td>
                <td style={{ padding: '6px', textAlign: 'right' }}>{item.base_score}</td>
                <td style={{ padding: '6px', textAlign: 'right', color: '#dc2626' }}>{item.total_deduction > 0 ? `-${item.total_deduction}` : 0}</td>
                <td style={{ padding: '6px', textAlign: 'right', color: '#166534' }}>+{item.total_bonus}</td>
                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{item.final_score}</td>
                <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{item.classification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HEADER & ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '800' }}>
            <Award size={26} color="#be123c" /> Quản Lý Thi Đua & Bảng Xếp Hạng Toàn Trường
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>
            Tích hợp dữ liệu Đội Cờ Đỏ & Điểm danh 7 Câu Lạc Bộ • Tự động xếp thứ bậc và xuất báo cáo chào cờ BGH
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/cham-diem-thi-dua" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', color: '#ffffff', textDecoration: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}>
            <Plus size={16} /> Cổng Chấm Điểm Cờ Đỏ
          </a>
          <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#be123c', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(190,18,60,0.3)' }}>
            <Printer size={16} /> In Báo Cáo Chào Cờ
          </button>
          <button onClick={handleExportExcel} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
            <Download size={16} /> Xuất Excel NĐ 30
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={styles.tabContainer} className="no-print">
        <button onClick={() => setActiveTab('leaderboard')} style={{ ...styles.tabBtn, backgroundColor: activeTab === 'leaderboard' ? '#be123c' : '#ffffff', color: activeTab === 'leaderboard' ? '#ffffff' : '#334155' }}>
          <Trophy size={16} /> 📊 Bảng Xếp Hạng Tuần ({filteredLeaderboard.length} Lớp)
        </button>
        <button onClick={() => setActiveTab('clubs')} style={{ ...styles.tabBtn, backgroundColor: activeTab === 'clubs' ? '#059669' : '#ffffff', color: activeTab === 'clubs' ? '#ffffff' : '#334155' }}>
          <Sparkles size={16} /> 🎯 Điểm Từ 7 Câu Lạc Bộ
        </button>
        <button onClick={() => setActiveTab('logs')} style={{ ...styles.tabBtn, backgroundColor: activeTab === 'logs' ? '#be123c' : '#ffffff', color: activeTab === 'logs' ? '#ffffff' : '#334155' }}>
          <FileText size={16} /> 📝 Sổ Nhật Ký Vi Phạm Chi Tiết ({weekLogs.length})
        </button>
        <button onClick={() => setActiveTab('config')} style={{ ...styles.tabBtn, backgroundColor: activeTab === 'config' ? '#be123c' : '#ffffff', color: activeTab === 'config' ? '#ffffff' : '#334155' }}>
          <Settings size={16} /> ⚙️ Cấu Hình Tiêu Chí Thi Đua ({criteriaList.length})
        </button>
      </div>

      {/* ==================== TAB 1: LEADERBOARD ==================== */}
      {activeTab === 'leaderboard' && (
        <>
          {/* WEEK & GRADE SELECTOR BAR */}
          <div style={{ padding: '16px 20px', borderRadius: '16px', backgroundColor: '#ffffff', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }} className="no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#be123c' }}>📅 Chọn Tuần Thi Đua:</label>
              <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} style={styles.filterSelect}>
                {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Lọc Khối Lớp:</label>
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={styles.filterSelect}>
                <option value="ALL">Tất cả Khối lớp (36 Lớp)</option>
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
              </select>
            </div>
          </div>

          {/* LEADERBOARD TABLE */}
          <div style={{ padding: '24px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }} className="no-print">
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', fontSize: '16.5px', fontWeight: '800' }}>
              🏆 Bảng Xếp Hạng Thi Đua Lớp - Tuần {selectedWeek} ({filteredLeaderboard.length} lớp)
            </h3>

            {loading ? <p>Đang tính toán bảng xếp hạng...</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Hạng Trường</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Hạng Khối</th>
                      <th style={{ padding: '12px 10px' }}>Lớp</th>
                      <th style={{ padding: '12px 10px' }}>Khối</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Điểm gốc</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Điểm trừ Cờ đỏ</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right', color: '#059669' }}>Đóng góp CLB</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Điểm thưởng khác</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '900' }}>Tổng điểm</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderboard.map((item) => (
                      <tr key={item.student_class} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '30px',
                            height: '30px',
                            lineHeight: '30px',
                            borderRadius: '50%',
                            backgroundColor: item.overall_rank === 1 ? '#fef08a' : item.overall_rank === 2 ? '#e2e8f0' : item.overall_rank === 3 ? '#fed7aa' : '#f1f5f9',
                            color: '#1e293b',
                            fontWeight: '900',
                            fontSize: '13px'
                          }}>
                            {item.overall_rank}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>#{item.grade_rank}</td>
                        <td style={{ padding: '12px 10px', fontWeight: '900', color: '#be123c', fontSize: '15px' }}>Lớp {item.student_class}</td>
                        <td style={{ padding: '12px 10px', color: '#475569' }}>{item.grade_level}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{item.base_score}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: item.regular_violation > 0 ? '#dc2626' : '#64748b' }}>
                          {item.regular_violation > 0 ? `-${item.regular_violation}` : '0'}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: item.club_net_score > 0 ? '#16a34a' : (item.club_net_score < 0 ? '#dc2626' : '#64748b') }}>
                          {item.club_net_score > 0 ? `+${item.club_net_score}` : `${item.club_net_score}`}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: item.total_bonus > 0 ? '#16a34a' : '#64748b' }}>
                          +{item.total_bonus}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '900', fontSize: '16px', color: '#1e293b' }}>
                          {item.final_score}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            ...getClassificationBadgeStyle(item.classification)
                          }}>
                            {item.classification}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== TAB 2: CLUB EMULATION MATRIX ==================== */}
      {activeTab === 'clubs' && (
        <div style={{ padding: '24px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#059669', fontSize: '17px', fontWeight: '800' }}>
                🎯 Điểm Đóng Góp Thi Đua Từ 7 Câu Lạc Bộ — Tuần {selectedWeek}
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Thống kê điểm chuyên cần tham gia sinh hoạt CLB và trừ điểm vắng không phép theo từng lớp
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 10px' }}>Lớp</th>
                  <th style={{ padding: '12px 10px' }}>Khối</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', color: '#16a34a' }}>Điểm Thưởng CLB (+)</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', color: '#dc2626' }}>Điểm Phạt Vắng CLB (-)</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800' }}>Tổng Đóng Góp CLB</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((item) => {
                  const clubLogs = weekLogs.filter(l => l.student_class === item.student_class && ((l.category || '').includes('Câu Lạc Bộ') || (l.criteria_title || '').includes('[CLB]')));
                  let cBonus = 0;
                  let cPenalty = 0;
                  clubLogs.forEach(l => {
                    const sc = Number(l.score_change) || 0;
                    if (sc > 0) cBonus += sc;
                    else cPenalty += Math.abs(sc);
                  });
                  const cNet = cBonus - cPenalty;

                  return (
                    <tr key={item.student_class} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '800', color: '#0f172a' }}>Lớp {item.student_class}</td>
                      <td style={{ padding: '12px 10px', color: '#64748b' }}>{item.grade_level}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: '#16a34a', fontWeight: '700' }}>+{cBonus}đ</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: cPenalty > 0 ? '#dc2626' : '#94a3b8', fontWeight: '700' }}>
                        {cPenalty > 0 ? `-${cPenalty}đ` : '0đ'}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '900', fontSize: '15px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: cNet > 0 ? '#dcfce7' : (cNet < 0 ? '#fee2e2' : '#f1f5f9'),
                          color: cNet > 0 ? '#15803d' : (cNet < 0 ? '#b91c1c' : '#64748b')
                        }}>
                          {cNet > 0 ? `+${cNet}đ` : `${cNet}đ`}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        {cNet > 0 ? '🌟 Rất tích cực' : (cNet < 0 ? '⚠️ Cần đôn đốc' : 'Bình thường')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: DETAILED LOGS ==================== */}
      {activeTab === 'logs' && (
        <div style={{ padding: '24px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', fontSize: '16.5px', fontWeight: '800' }}>
            📝 Sổ Nhật Ký Vi Phạm & Khen Thưởng Chi Tiết - Tuần {selectedWeek} ({weekLogs.length} bản ghi)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 10px' }}>Ngày</th>
                  <th style={{ padding: '12px 10px' }}>Lớp</th>
                  <th style={{ padding: '12px 10px' }}>Phân loại</th>
                  <th style={{ padding: '12px 10px' }}>Tiêu chí vi phạm / Khen thưởng</th>
                  <th style={{ padding: '12px 10px' }}>Học sinh</th>
                  <th style={{ padding: '12px 10px' }}>Số điểm</th>
                  <th style={{ padding: '12px 10px' }}>Ghi chú</th>
                  <th style={{ padding: '12px 10px' }}>Người chấm</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {weekLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontSize: '12.5px', color: '#64748b' }}>{log.log_date}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#be123c' }}>Lớp {log.student_class}</td>
                    <td style={{ padding: '12px 10px', fontSize: '12px', color: '#475569' }}>{log.category || 'Nếp sống'}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1e293b' }}>{log.criteria_title}</td>
                    <td style={{ padding: '12px 10px', fontSize: '12.5px', color: '#334155' }}>
                      {log.student_name ? <strong>{log.student_name}</strong> : '-'}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: '900', color: log.score_change < 0 ? '#dc2626' : '#166534' }}>
                      {log.score_change > 0 ? '+' : ''}{log.score_change}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#475569', fontSize: '12.5px' }}>{log.reason_note || log.reason || '-'}</td>
                    <td style={{ padding: '12px 10px', fontSize: '12px', color: '#64748b' }}>{log.reporter_name || 'Đội Cờ đỏ'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button type="button" onClick={() => handleDeleteLog(log.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: CRITERIA CONFIGURATION ==================== */}
      {activeTab === 'config' && (
        <div style={{ padding: '24px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#be123c', fontSize: '16.5px', fontWeight: '800' }}>⚙️ Cấu Hình Tiêu Chí Thi Đua</h3>
            <button
              onClick={() => { setShowCritForm(true); setEditingCritId(null); setCritTitle(''); setCritScore(2); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#be123c',
                color: '#ffffff',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Thêm Tiêu Chí
            </button>
          </div>

          {showCritForm && (
            <form onSubmit={handleSaveCriteria} style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Tên Tiêu Chí:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tham gia CLB tích cực..."
                  value={critTitle}
                  onChange={(e) => setCritTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Danh Mục:</label>
                <select
                  value={critCategory}
                  onChange={(e) => setCritCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px' }}
                >
                  <option value="Hoạt động Câu Lạc Bộ">Hoạt động Câu Lạc Bộ</option>
                  <option value="Nếp sống & Đồng phục">Nếp sống & Đồng phục</option>
                  <option value="Học tập & Truy bài">Học tập & Truy bài</option>
                  <option value="Vệ sinh & Cảnh quan">Vệ sinh & Cảnh quan</option>
                  <option value="Sĩ số & Kỷ luật">Sĩ số & Kỷ luật</option>
                  <option value="Khen thưởng & Xung kích">Khen thưởng & Xung kích</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Điểm số (+ hoặc -):</label>
                <input
                  type="number"
                  value={critScore}
                  onChange={(e) => setCritScore(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', backgroundColor: '#16a34a', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setShowCritForm(false)}
                  style={{ padding: '8px 14px', backgroundColor: '#ffffff', color: '#475569', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 10px' }}>Danh Mục</th>
                  <th style={{ padding: '12px 10px' }}>Tiêu Chí</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Điểm Áp Dụng</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {criteriaList.map((c) => {
                  const isBonus = Number(c.score_change) > 0;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: '#475569' }}>{c.category}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1e293b' }}>{c.title}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '900', color: isBonus ? '#16a34a' : '#dc2626' }}>
                        {isBonus ? `+${c.score_change}đ` : `${c.score_change}đ`}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button onClick={() => handleEditCriteria(c)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0284c7', marginRight: '6px', cursor: 'pointer' }}>
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDeleteCriteria(c.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
    paddingBottom: '4px',
    flexWrap: 'wrap'
  },
  tabBtn: {
    padding: '10px 18px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    transition: 'all 0.2s'
  },
  filterSelect: {
    padding: '7px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
    outline: 'none',
    backgroundColor: '#ffffff'
  }
};
