import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Award, Trophy, Printer, Search, Plus, Trash2, Edit3, Settings, ShieldAlert, CheckCircle2, FileText, Download, Save, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

const DEFAULT_CLASSES = [
  '10A1', '10A2', '10A3', '10A4', '10A5',
  '11A1', '11A2', '11A3', '11A4', '11A5',
  '12A1', '12A2', '12A3', '12A4', '12A5'
];

const DEFAULT_CRITERIA = [
  { id: '1', category: 'Nếp sống & Đồng phục', title: 'Không đeo thẻ / Không mặc đồng phục', score_change: -5, is_active: true },
  { id: '2', category: 'Nếp sống & Đồng phục', title: 'Đi học muộn / Nắm tóc, trang phục sai quy định', score_change: -5, is_active: true },
  { id: '3', category: 'Vệ sinh & Cảnh quan', title: 'Vệ sinh lớp / sân trường muộn hoặc bẩn', score_change: -5, is_active: true },
  { id: '4', category: 'Vệ sinh & Cảnh quan', title: 'Quên tắt điện, quạt khi ra khỏi lớp', score_change: -5, is_active: true },
  { id: '5', category: 'Học tập & Truy bài', title: 'Truy bài đầu giờ mất trật tự', score_change: -5, is_active: true },
  { id: '6', category: 'Sĩ số & Kỷ luật', title: 'Học sinh bỏ tiết / trốn học', score_change: -10, is_active: true },
  { id: '7', category: 'Sĩ số & Kỷ luật', title: 'Học sinh vắng không lý do', score_change: -5, is_active: true },
  { id: '8', category: 'Khen thưởng & Xung kích', title: 'Tuyên dương tập thể / Chi đoàn xuất sắc', score_change: 10, is_active: true }
];

export default function AdminEmulation() {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard', 'logs', 'config'
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
  const [critCategory, setCritCategory] = useState('Nếp sống & Đồng phục');
  const [critScore, setCritScore] = useState(-5);

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

    const matchPrefix = clean.match(/^(10|11|12)/);
    if (matchPrefix) {
      return `Khối ${matchPrefix[1]}`;
    }

    if (/\b12\b|12[A-Z]/i.test(clean)) return 'Khối 12';
    if (/\b11\b|11[A-Z]/i.test(clean)) return 'Khối 11';
    if (/\b10\b|10[A-Z]/i.test(clean)) return 'Khối 10';

    return 'Khối 10';
  };

  // Compute Weekly Leaderboard
  const weekLogs = allLogs.filter(l => Number(l.week_number) === Number(selectedWeek));
  
  const leaderboardData = classList.map(cls => {
    const logsForClass = weekLogs.filter(l => l.student_class === cls);
    let totalDeduction = 0;
    let totalBonus = 0;

    logsForClass.forEach(l => {
      const s = Number(l.score_change) || 0;
      if (s < 0) totalDeduction += s;
      else totalBonus += s;
    });

    const baseScore = 100;
    const finalScore = Math.max(0, baseScore + totalDeduction + totalBonus);
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
      final_score: finalScore,
      classification,
      violation_count: logsForClass.filter(l => Number(l.score_change) < 0).length,
      logs: logsForClass
    };
  });

  // Sort leaderboard by final_score descending
  leaderboardData.sort((a, b) => b.final_score - a.final_score);

  // Assign overall & grade ranks
  const gradeRankCounter = { 'Khối 10': 1, 'Khối 11': 1, 'Khối 12': 1 };
  const rankedLeaderboard = leaderboardData.map((item, idx) => {
    const gradeRank = gradeRankCounter[item.grade_level]++;
    return {
      ...item,
      overall_rank: idx + 1,
      grade_rank: gradeRank
    };
  });

  const filteredLeaderboard = rankedLeaderboard.filter(item => 
    selectedGrade === 'ALL' || item.grade_level === selectedGrade
  );

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
    setCritCategory(c.category || 'Nếp sống & Đồng phục');
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
        score_change: Number(critScore) || -5,
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
    const dataToExport = filteredLeaderboard.map(item => ({
      "Thứ Hạng Toàn Trường": `#${item.overall_rank}`,
      "Thứ Hạng Trong Khối": `#${item.grade_rank}`,
      "Lớp": item.student_class,
      "Khối": item.grade_level,
      "Điểm Gốc": item.base_score,
      "Điểm Trừ": item.total_deduction,
      "Điểm Thưởng": item.total_bonus,
      "Điểm Tổng Kết": item.final_score,
      "Xếp Loại Thi Đua": item.classification,
      "Số Lần Vi Phạm": item.violation_count
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `ThiDua_Tuan_${selectedWeek}`);
    XLSX.writeFile(workbook, `Bang_Xep_Hang_Thi_Dua_Tuan_${selectedWeek}.xlsx`);
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
          <h2 style={{ margin: '6px 0 2px 0', color: '#be123c', fontSize: '20px', fontWeight: '900' }}>BÁO CÁO TỔNG HỢP THI ĐỦA TUẦN {selectedWeek}</h2>
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
                <td style={{ padding: '6px', textAlign: 'right', color: '#dc2626' }}>{item.total_deduction}</td>
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
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={26} color="#be123c" /> Quản Lý Thi Đua & Bảng Xếp Hạng Tuần
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Tổng hợp điểm thi đua các lớp, xếp hạng tuần và xuất báo cáo chào cờ BGH
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/cham-diem-thi-dua" target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', textDecoration: 'none', padding: '10px 16px' }}>
            <Plus size={18} /> Cổng Chấm Điểm Cờ Đỏ
          </a>
          <button onClick={() => window.print()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#be123c' }}>
            <Printer size={18} /> In Báo Cáo Chào Cờ BGH
          </button>
          <button onClick={handleExportExcel} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#166534' }}>
            <Download size={18} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={styles.tabContainer} className="no-print">
        <button onClick={() => setActiveTab('leaderboard')} style={{ ...styles.tabBtn, backgroundColor: activeTab === 'leaderboard' ? '#be123c' : '#ffffff', color: activeTab === 'leaderboard' ? '#ffffff' : '#334155' }}>
          <Trophy size={16} /> 📊 Bảng Xếp Hạng Thi Đua Tuần
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
          <div className="glass no-print" style={{ padding: '1.2rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#be123c' }}>📅 Chọn Tuần Thi Đua:</label>
              <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} style={styles.filterSelect}>
                {Array.from({ length: 36 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#475569' }}>Lọc Khối Lớp:</label>
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={styles.filterSelect}>
                <option value="ALL">Tất cả Khối lớp</option>
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
              </select>
            </div>
          </div>

          {/* LEADERBOARD TABLE */}
          <div className="glass no-print" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              🏆 Bảng Xếp Hạng Thi Đua Lớp - Tuần {selectedWeek} ({filteredLeaderboard.length} lớp)
            </h3>

            {loading ? <p>Đang tính toán bảng xếp hạng...</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Hạng Trường</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Hạng Khối</th>
                      <th style={{ padding: '10px' }}>Lớp</th>
                      <th style={{ padding: '10px' }}>Khối</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Điểm gốc</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Điểm trừ</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Điểm thưởng</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Tổng điểm</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderboard.map((item) => (
                      <tr key={item.student_class} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '28px',
                            height: '28px',
                            lineHeight: '28px',
                            borderRadius: '50%',
                            backgroundColor: item.overall_rank === 1 ? '#fef08a' : item.overall_rank === 2 ? '#e2e8f0' : item.overall_rank === 3 ? '#fed7aa' : '#f1f5f9',
                            color: '#1e293b',
                            fontWeight: '900',
                            fontSize: '13px'
                          }}>
                            {item.overall_rank}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>#{item.grade_rank}</td>
                        <td style={{ padding: '10px', fontWeight: '900', color: '#be123c', fontSize: '15px' }}>Lớp {item.student_class}</td>
                        <td style={{ padding: '10px', color: '#475569' }}>{item.grade_level}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{item.base_score}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: item.total_deduction < 0 ? '#dc2626' : '#64748b' }}>
                          {item.total_deduction}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: item.total_bonus > 0 ? '#166534' : '#64748b' }}>
                          +{item.total_bonus}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '900', fontSize: '16px', color: '#1e293b' }}>
                          {item.final_score}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
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

      {/* ==================== TAB 2: DETAILED LOGS ==================== */}
      {activeTab === 'logs' && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
          <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            📝 Sổ Nhật Ký Vi Phạm & Khen Thưởng Chi Tiết - Tuần {selectedWeek} ({weekLogs.length})
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '10px' }}>Ngày</th>
                <th style={{ padding: '10px' }}>Lớp</th>
                <th style={{ padding: '10px' }}>Tiêu chí vi phạm / Khen thưởng</th>
                <th style={{ padding: '10px' }}>Số điểm</th>
                <th style={{ padding: '10px' }}>Ghi chú</th>
                <th style={{ padding: '10px' }}>Người chấm</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {weekLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontSize: '12.5px', color: '#64748b' }}>{log.log_date}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#be123c' }}>Lớp {log.student_class}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{log.criteria_title}</td>
                  <td style={{ padding: '10px', fontWeight: '900', color: log.score_change < 0 ? '#dc2626' : '#166534' }}>
                    {log.score_change > 0 ? '+' : ''}{log.score_change}
                  </td>
                  <td style={{ padding: '10px', color: '#475569' }}>{log.reason || '-'}</td>
                  <td style={{ padding: '10px', fontSize: '12.5px', color: '#64748b' }}>{log.reporter_name || 'Đội Cờ đỏ'}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button type="button" onClick={() => handleDeleteLog(log.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== TAB 3: CRITERIA CONFIGURATION ==================== */}
      {activeTab === 'config' && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#be123c' }}>⚙️ Cấu Hình Tiêu Chí Thi Đua</h3>
            <button onClick={() => setShowCritForm(!showCritForm)} className="btn-primary" style={{ padding: '8px 16px', backgroundColor: '#be123c' }}>
              <Plus size={16} /> Thêm Tiêu Chí Mới
            </button>
          </div>

          {showCritForm && (
            <form onSubmit={handleSaveCriteria} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Tên Tiêu chí (*)</label>
                  <input type="text" required value={critTitle} onChange={e => setCritTitle(e.target.value)} style={styles.input} placeholder="VD: Không đeo thẻ học sinh..." />
                </div>
                <div>
                  <label style={styles.label}>Phân loại</label>
                  <select value={critCategory} onChange={e => setCritCategory(e.target.value)} style={styles.input}>
                    <option value="Nếp sống & Đồng phục">Nếp sống & Đồng phục</option>
                    <option value="Vệ sinh & Cảnh quan">Vệ sinh & Cảnh quan</option>
                    <option value="Học tập & Truy bài">Học tập & Truy bài</option>
                    <option value="Sĩ số & Kỷ luật">Sĩ số & Kỷ luật</option>
                    <option value="Khen thưởng & Xung kích">Khen thưởng & Xung kích</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Số điểm cộng / trừ (*)</label>
                  <input type="number" required value={critScore} onChange={e => setCritScore(e.target.value)} style={styles.input} placeholder="VD: -5 hoặc 10" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCritForm(false)} style={{ padding: '6px 14px', background: '#cbd5e1', border: 'none', borderRadius: '6px' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ padding: '6px 18px', backgroundColor: '#be123c' }}>
                  <Save size={16} /> Lưu Tiêu Chí
                </button>
              </div>
            </form>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '10px' }}>STT</th>
                <th style={{ padding: '10px' }}>Tên Tiêu chí</th>
                <th style={{ padding: '10px' }}>Phân loại</th>
                <th style={{ padding: '10px' }}>Số điểm (+ / -)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {criteriaList.map((c, idx) => (
                <tr key={c.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>#{idx + 1}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{c.title}</td>
                  <td style={{ padding: '10px', color: '#475569' }}>{c.category}</td>
                  <td style={{ padding: '10px', fontWeight: '900', color: Number(c.score_change) < 0 ? '#dc2626' : '#166534' }}>
                    {Number(c.score_change) > 0 ? '+' : ''}{c.score_change} điểm
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => handleEditCriteria(c)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                        <Edit3 size={14} />
                      </button>
                      <button type="button" onClick={() => handleDeleteCriteria(c.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

const getClassificationBadgeStyle = (cls) => {
  switch (cls) {
    case 'Xuất sắc': return { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
    case 'Tốt': return { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
    case 'Khá': return { backgroundColor: '#fef9c3', color: '#a16207', border: '1px solid #fef08a' };
    default: return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' };
  }
};

const styles = {
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' },
  tabBtn: { padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  filterSelect: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: 'bold', backgroundColor: '#ffffff' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }
};
