import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, DualSupabaseService } from '../../lib/supabase';
import { 
  ArrowLeft, ShieldAlert, Award, Trophy, CheckCircle2, AlertTriangle, 
  Calendar, Clock, Download, Send, RefreshCw, Sparkles, Filter, 
  UserCheck, UserX, Star, BookOpen, Layers, Check, Copy, Share2
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TeacherDiscipline() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [homeroomClass, setHomeroomClass] = useState('12A01');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeFilterTab, setActiveFilterTab] = useState('ALL'); // 'ALL', 'VIOLATIONS', 'CLUB', 'ACADEMICS'
  
  const [emulationLogs, setEmulationLogs] = useState([]);
  const [allSchoolLogs, setAllSchoolLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Zalo Broadcast Modal State
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [selectedStudentAlert, setSelectedStudentAlert] = useState(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem('cbq_teacher_session') || 
                       localStorage.getItem('cbq_current_teacher') || 
                       localStorage.getItem('cbq_user');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        setTeacher(parsed);
        const cls = parsed.homeroomClass || parsed.homeroom_class || parsed.class_name || '12A01';
        setHomeroomClass(cls);
      } catch (e) {
        console.error('Error parsing teacher session:', e);
      }
    } else {
      setTeacher({ name: 'Tam Bou Branh', homeroomClass: '12A01' });
      setHomeroomClass('12A01');
    }
  }, []);

  useEffect(() => {
    if (homeroomClass) {
      fetchEmulationData();
    }
  }, [homeroomClass, selectedWeek]);

  const fetchEmulationData = async () => {
    setLoading(true);
    try {
      // 1. Nạp nhật ký thi đua toàn trường để tính thứ hạng và điểm lớp
      const [logsRes, discRes] = await Promise.all([
        supabase.from('cbq_emulation_logs').select('*').order('log_date', { ascending: false }),
        supabase.from('cbq_discipline_records').select('*').order('inspection_date', { ascending: false })
      ]);

      let logs = [];
      if (!logsRes.error && logsRes.data) {
        logs = [...logsRes.data];
      }

      // Hợp nhất dữ liệu từ cbq_discipline_records nếu có
      if (!discRes.error && discRes.data) {
        discRes.data.forEach(d => {
          logs.push({
            id: 'disc_' + d.id,
            week_number: d.week_number || selectedWeek,
            log_date: d.inspection_date,
            student_class: d.inspected_class,
            grade_level: getGradeLevel(d.inspected_class),
            criteria_title: d.violation_type,
            category: 'Nếp sống & Đồng phục',
            score_change: -Math.abs(Number(d.point_deduction || 5)),
            reason_note: d.notes,
            student_name: d.student_name,
            student_code: d.student_code,
            reporter_name: d.logged_by || 'Đội Cờ Đỏ'
          });
        });
      }

      setAllSchoolLogs(logs);

      // Lọc các bản ghi của lớp mình
      const classLogs = logs.filter(l => l.student_class === homeroomClass);
      setEmulationLogs(classLogs);
    } catch (err) {
      console.error('Error loading emulation logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLevel = (clsName) => {
    if (!clsName) return 'Khối 10';
    const clean = String(clsName).trim().toUpperCase();
    if (/^12|12[A-Z]/i.test(clean)) return 'Khối 12';
    if (/^11|11[A-Z]/i.test(clean)) return 'Khối 11';
    return 'Khối 10';
  };

  // Tính toán KPI thi đua tuần cho lớp chủ nhiệm
  const currentWeekClassLogs = useMemo(() => {
    return emulationLogs.filter(l => Number(l.week_number) === Number(selectedWeek));
  }, [emulationLogs, selectedWeek]);

  const weekKPI = useMemo(() => {
    const baseScore = 100;
    let totalBonus = 0;
    let totalDeduction = 0;
    let clubBonus = 0;
    let clubPenalty = 0;
    let violationCount = 0;

    currentWeekClassLogs.forEach(l => {
      const score = Number(l.score_change) || 0;
      const isClub = (l.category || '').toLowerCase().includes('câu lạc bộ') || (l.criteria_title || '').includes('[CLB]');

      if (score > 0) {
        totalBonus += score;
        if (isClub) clubBonus += score;
      } else {
        totalDeduction += Math.abs(score);
        violationCount++;
        if (isClub) clubPenalty += Math.abs(score);
      }
    });

    const finalScore = Math.max(0, baseScore + totalBonus - totalDeduction);

    let classification = 'Xuất Sắc';
    let rankColor = '#16a34a';
    if (finalScore >= 95) { classification = 'Xuất Sắc'; rankColor = '#16a34a'; }
    else if (finalScore >= 85) { classification = 'Tốt'; rankColor = '#2563eb'; }
    else if (finalScore >= 70) { classification = 'Khá'; rankColor = '#ca8a04'; }
    else { classification = 'Cần Cố Gắng'; rankColor = '#dc2626'; }

    // Tính thứ hạng so với các lớp khác trong toàn trường & trong khối
    const weekSchoolLogs = allSchoolLogs.filter(l => Number(l.week_number) === Number(selectedWeek));
    const classesMap = {};

    weekSchoolLogs.forEach(l => {
      const c = l.student_class;
      if (!c) return;
      if (!classesMap[c]) {
        classesMap[c] = {
          student_class: c,
          grade_level: getGradeLevel(c),
          score: baseScore
        };
      }
      classesMap[c].score += (Number(l.score_change) || 0);
    });

    if (!classesMap[homeroomClass]) {
      classesMap[homeroomClass] = {
        student_class: homeroomClass,
        grade_level: getGradeLevel(homeroomClass),
        score: finalScore
      };
    }

    const sortedSchool = Object.values(classesMap).sort((a, b) => b.score - a.score);
    const overallRank = sortedSchool.findIndex(c => c.student_class === homeroomClass) + 1 || 1;
    const totalSchoolClasses = sortedSchool.length || 36;

    const myGrade = getGradeLevel(homeroomClass);
    const sortedGrade = sortedSchool.filter(c => c.grade_level === myGrade);
    const gradeRank = sortedGrade.findIndex(c => c.student_class === homeroomClass) + 1 || 1;
    const totalGradeClasses = sortedGrade.length || 12;

    return {
      baseScore,
      totalBonus,
      totalDeduction,
      finalScore,
      violationCount,
      clubBonus,
      clubPenalty,
      classification,
      rankColor,
      overallRank,
      totalSchoolClasses,
      gradeRank,
      totalGradeClasses,
      myGrade
    };
  }, [currentWeekClassLogs, allSchoolLogs, selectedWeek, homeroomClass]);

  // Lọc nhật ký theo tab phân loại
  const filteredLogs = useMemo(() => {
    return currentWeekClassLogs.filter(l => {
      const isClub = (l.category || '').toLowerCase().includes('câu lạc bộ') || (l.criteria_title || '').includes('[CLB]');
      const isViolation = Number(l.score_change) < 0;

      if (activeFilterTab === 'VIOLATIONS') return isViolation && !isClub;
      if (activeFilterTab === 'CLUB') return isClub;
      if (activeFilterTab === 'ACADEMICS') return (l.category || '').includes('Học tập') || (l.category || '').includes('Khen thưởng');
      return true;
    });
  }, [currentWeekClassLogs, activeFilterTab]);

  // Soạn tin nhắn Zalo tổng kết tuần gửi phụ huynh & học sinh
  const generatedParentZaloMessage = useMemo(() => {
    const violations = currentWeekClassLogs.filter(l => Number(l.score_change) < 0);
    const bonuses = currentWeekClassLogs.filter(l => Number(l.score_change) > 0);

    let vText = '';
    if (violations.length > 0) {
      vText = violations.map((v, i) => `  ${i + 1}. ${v.criteria_title} (${v.score_change}đ)${v.student_name ? ` - HS: ${v.student_name}` : ''}${v.reason_note ? ` (${v.reason_note})` : ''}`).join('\n');
    } else {
      vText = '  🎉 Lớp không ghi nhận bất kỳ vi phạm nề nếp nào!';
    }

    let bText = '';
    if (bonuses.length > 0) {
      bText = bonuses.map((b, i) => `  ${i + 1}. ${b.criteria_title} (+${b.score_change}đ)${b.reason_note ? ` - ${b.reason_note}` : ''}`).join('\n');
    } else {
      bText = '  (Chưa có điểm cộng bổ sung)';
    }

    return `📢 [TRƯỜNG THPT CAO BÁ QUÁT - BÁO CÁO THI ĐUA & NỀ NẾP TUẦN ${selectedWeek}]\n` +
      `Kính gửi Quý Phụ huynh & các em Học sinh Lớp ${homeroomClass},\n` +
      `Giáo viên chủ nhiệm xin gửi thông báo kết quả thi đua và rèn luyện nề nếp của lớp trong Tuần ${selectedWeek}:\n\n` +
      `🏆 KẾT QUẢ THI ĐUA ĐOÀN TRƯỜNG:\n` +
      `- Điểm xuất phát: 100 điểm\n` +
      `- Tổng điểm thưởng (+): +${weekKPI.totalBonus} điểm (Đóng góp CLB: +${weekKPI.clubBonus}đ)\n` +
      `- Tổng điểm trừ (-): -${weekKPI.totalDeduction} điểm (Vắng CLB: -${weekKPI.clubPenalty}đ)\n` +
      `- 👉 TỔNG ĐIỂM TUẦN: ${weekKPI.finalScore} / 100 điểm\n` +
      `- Xếp loại Chi đoàn: ${weekKPI.classification.toUpperCase()}\n` +
      `- 🎖️ Thứ hạng: Hạng ${weekKPI.gradeRank}/${weekKPI.totalGradeClasses} (${weekKPI.myGrade}) • Hạng ${weekKPI.overallRank}/${weekKPI.totalSchoolClasses} (Toàn trường)\n\n` +
      `🌟 CÁC ĐIỂM THƯỞNG & PHONG TRÀO NỔI BẬT:\n${bText}\n\n` +
      `⚠️ CÁC LỖI NỀ NẾP CẦN LƯU Ý & CHẤN CHỈNH:\n${vText}\n\n` +
      `Kính mong Quý Phụ huynh tiếp tục phối hợp chặt chẽ cùng GVCN và Nhà trường để động viên, nhắc nhở các em thực hiện nghiêm túc nội quy, đồng phục và tích cực tham gia sinh hoạt Câu Lạc Bộ.\n\n` +
      `Trân trọng,\nGVCN Lớp ${homeroomClass}`;
  }, [currentWeekClassLogs, weekKPI, selectedWeek, homeroomClass]);

  // Xuất Báo Cáo Excel Nề Nếp Tuần Chuẩn Nghị Định 30
  const handleExportExcel = () => {
    const titleHeader = [
      ['SỞ GD&ĐT TỈNH ĐẮK LẮK', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
      ['TRƯỜNG THPT CAO BÁ QUÁT', '', '', 'Độc lập - Tự do - Hạnh phúc'],
      ['', '', '', ''],
      [`BÁO CÁO KẾT QUẢ THI ĐUA & NỀ NẾP LỚP ${homeroomClass}`],
      [`(Tuần thi đua thứ: ${selectedWeek} - Năm học 2025 - 2026)`],
      ['', '', '', ''],
      [`Điểm tổng kết: ${weekKPI.finalScore}đ | Xếp loại: ${weekKPI.classification} | Hạng Khối: ${weekKPI.gradeRank}/${weekKPI.totalGradeClasses} | Hạng Trường: ${weekKPI.overallRank}/${weekKPI.totalSchoolClasses}`],
      ['', '', '', '']
    ];

    const tableHeaders = [
      ['STT', 'Ngày ghi nhận', 'Phân loại', 'Tiêu chí / Nội dung', 'Điểm', 'Học sinh vi phạm / Tuyên dương', 'Ghi chú chi tiết', 'Người ghi nhận']
    ];

    const dataRows = currentWeekClassLogs.map((l, idx) => [
      idx + 1,
      l.log_date,
      l.category || 'Nếp sống',
      l.criteria_title,
      Number(l.score_change) > 0 ? `+${l.score_change}` : `${l.score_change}`,
      l.student_name ? `${l.student_name} (${l.student_code || ''})` : '-',
      l.reason_note || l.reason || '-',
      l.reporter_name || 'Đội Cờ Đỏ'
    ]);

    const signRows = [
      ['', '', '', ''],
      ['', '', '', `Đắk Lắk, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`],
      ['', 'ĐẠI DIỆN ĐỘI CỜ ĐỎ', '', 'GIÁO VIÊN CHỦ NHIỆM'],
      ['', '(Ký và ghi rõ họ tên)', '', '(Ký và ghi rõ họ tên)'],
      ['', '', '', ''],
      ['', '', '', teacher?.name || 'Giáo viên chủ nhiệm']
    ];

    const wsData = [...titleHeader, ...tableHeaders, ...dataRows, ...signRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 22 },
      { wch: 35 },
      { wch: 10 },
      { wch: 26 },
      { wch: 35 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `ThiDua_Tuan${selectedWeek}`);
    XLSX.writeFile(wb, `BaoCao_ThiDua_NeNep_Lop_${homeroomClass}_Tuan_${selectedWeek}.xlsx`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '28px 20px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* 1. TOP BAR NAVIGATION & HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <Link 
              to="/teacher-dashboard" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '8px', fontSize: '13.5px', fontWeight: '700' }}
            >
              <ArrowLeft size={18} /> Quay về Bảng Điều Khiển GVCN
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                backgroundColor: '#ffe4e6',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(225,29,72,0.2)'
              }}>
                <ShieldAlert size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Trung Tâm Nề Nếp & Thi Đua Lớp {homeroomClass}
                </h1>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Đồng bộ trực tiếp từ Đội Cờ Đỏ & Điểm danh 7 Câu Lạc Bộ • Tự động xếp hạng toàn trường
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Chọn Tuần */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff', padding: '4px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
              <Calendar size={16} color="#0284c7" />
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Tuần:</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                style={{ padding: '6px 8px', border: 'none', fontSize: '13.5px', fontWeight: '800', color: '#0369a1', outline: 'none', backgroundColor: 'transparent' }}
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchEmulationData}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#475569',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} /> Làm mới
            </button>

            <button
              onClick={() => setShowZaloModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: '#0068ff',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,104,255,0.3)'
              }}
            >
              <Send size={16} /> 📲 Gửi Zalo Phụ Huynh
            </button>

            <button
              onClick={handleExportExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5,150,105,0.3)'
              }}
            >
              <Download size={16} /> 📥 Xuất Excel NĐ 30
            </button>
          </div>
        </div>

        {/* 2. BẢNG TỔNG KẾT KPI THI ĐUA TUẦN */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={22} color="#f59e0b" />
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                Bảng Tổng Kết Thi Đua Tuần {selectedWeek} — Lớp {homeroomClass}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '800',
                backgroundColor: weekKPI.rankColor + '15',
                color: weekKPI.rankColor,
                border: `1.5px solid ${weekKPI.rankColor}40`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Star size={15} /> Xếp loại: {weekKPI.classification}
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {/* THẺ 1: ĐIỂM TỔNG KẾT */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 6px 16px rgba(15,23,42,0.15)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Điểm Tổng Kết Tuần
              </div>
              <div style={{ fontSize: '36px', fontWeight: '900', margin: '8px 0 4px 0', color: '#38bdf8' }}>
                {weekKPI.finalScore} <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '600' }}>/ 100</span>
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Gốc: 100đ • Thưởng: +{weekKPI.totalBonus} • Trừ: -{weekKPI.totalDeduction}
              </div>
            </div>

            {/* THẺ 2: THỨ HẠNG TRONG KHỐI */}
            <div style={{
              backgroundColor: '#eff6ff',
              borderRadius: '16px',
              padding: '20px',
              border: '1.5px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>
                Hạng Trong {weekKPI.myGrade}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', margin: '8px 0 4px 0', color: '#1d4ed8' }}>
                Hạng {weekKPI.gradeRank} <span style={{ fontSize: '15px', color: '#64748b', fontWeight: '700' }}>/ {weekKPI.totalGradeClasses} lớp</span>
              </div>
              <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
                Toàn trường: Hạng {weekKPI.overallRank}/{weekKPI.totalSchoolClasses} lớp
              </div>
            </div>

            {/* THẺ 3: ĐÓNG GÓP TỪ CÂU LẠC BỘ */}
            <div style={{
              backgroundColor: '#f0fdf4',
              borderRadius: '16px',
              padding: '20px',
              border: '1.5px solid #bbf7d0'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
                Điểm Từ 7 Câu Lạc Bộ
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', margin: '8px 0 4px 0', color: '#16a34a' }}>
                +{weekKPI.clubBonus}đ <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '700' }}>(-{weekKPI.clubPenalty}đ)</span>
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                Cộng chuyên cần CLB & Trừ vắng KP
              </div>
            </div>

            {/* THẺ 4: VI PHẠM CỜ ĐỎ */}
            <div style={{
              backgroundColor: '#fff1f2',
              borderRadius: '16px',
              padding: '20px',
              border: '1.5px solid #fecdd3'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#9f1239', textTransform: 'uppercase' }}>
                Lượt Vi Phạm Nề Nếp
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', margin: '8px 0 4px 0', color: '#e11d48' }}>
                {weekKPI.violationCount} <span style={{ fontSize: '14px', color: '#9f1239', fontWeight: '700' }}>lượt (-{weekKPI.totalDeduction}đ)</span>
              </div>
              <div style={{ fontSize: '12px', color: '#be123c', fontWeight: '600' }}>
                {weekKPI.violationCount === 0 ? '🎉 Nề nếp tuyệt vời!' : 'Cần chấn chỉnh trong tuần tới'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. THANH TAB LỌC CHI TIẾT */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveFilterTab('ALL')}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeFilterTab === 'ALL' ? '#0f172a' : '#ffffff',
              color: activeFilterTab === 'ALL' ? '#ffffff' : '#64748b',
              boxShadow: activeFilterTab === 'ALL' ? '0 4px 12px rgba(15,23,42,0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            📋 Tất cả ghi nhận ({currentWeekClassLogs.length})
          </button>

          <button
            onClick={() => setActiveFilterTab('VIOLATIONS')}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeFilterTab === 'VIOLATIONS' ? '#e11d48' : '#ffffff',
              color: activeFilterTab === 'VIOLATIONS' ? '#ffffff' : '#64748b',
              boxShadow: activeFilterTab === 'VIOLATIONS' ? '0 4px 12px rgba(225,29,72,0.25)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            ⚠️ Vi phạm Cờ đỏ & Giám thị
          </button>

          <button
            onClick={() => setActiveFilterTab('CLUB')}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeFilterTab === 'CLUB' ? '#059669' : '#ffffff',
              color: activeFilterTab === 'CLUB' ? '#ffffff' : '#64748b',
              boxShadow: activeFilterTab === 'CLUB' ? '0 4px 12px rgba(5,150,105,0.25)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            🎯 Hoạt Động Câu Lạc Bộ
          </button>

          <button
            onClick={() => setActiveFilterTab('ACADEMICS')}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeFilterTab === 'ACADEMICS' ? '#4f46e5' : '#ffffff',
              color: activeFilterTab === 'ACADEMICS' ? '#ffffff' : '#64748b',
              boxShadow: activeFilterTab === 'ACADEMICS' ? '0 4px 12px rgba(79,70,229,0.25)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            📚 Học Tập & Tuyên Dương
          </button>
        </div>

        {/* 4. DANH SÁCH CHI TIẾT CÁC BIÊN BẢN GHI NHẬN */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '10px', fontWeight: '600' }}>Đang nạp dữ liệu thi đua nề nếp...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#16a34a' }}>
              <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: '#15803d' }}>
                Không có ghi nhận nào trong danh mục này!
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                Lớp {homeroomClass} đang duy trì nề nếp rất tốt trong Tuần {selectedWeek}.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredLogs.map((item, idx) => {
                const isBonus = Number(item.score_change) > 0;
                const isClub = (item.category || '').toLowerCase().includes('câu lạc bộ') || (item.criteria_title || '').includes('[CLB]');

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      border: `1.5px solid ${isBonus ? '#bbf7d0' : '#fecdd3'}`,
                      backgroundColor: isBonus ? '#f0fdf4' : '#fff1f2',
                      flexWrap: 'wrap',
                      gap: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          backgroundColor: isBonus ? '#dcfce7' : '#fee2e2',
                          color: isBonus ? '#15803d' : '#be123c',
                          border: `1px solid ${isBonus ? '#86efac' : '#fca5a5'}`
                        }}>
                          {item.category || (isClub ? 'Hoạt động Câu Lạc Bộ' : 'Nếp sống')}
                        </span>

                        <span style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} /> {item.log_date || new Date().toISOString().slice(0, 10)}
                        </span>

                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          • Người ghi: <strong>{item.reporter_name || 'Đội Cờ Đỏ'}</strong>
                        </span>
                      </div>

                      <h4 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 6px 0', color: isBonus ? '#166534' : '#9f1239' }}>
                        {item.criteria_title}
                      </h4>

                      {item.student_name && (
                        <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                          👤 Học sinh: <strong>{item.student_name}</strong> {item.student_code ? `(Mã HS: ${item.student_code})` : ''}
                        </div>
                      )}

                      {(item.reason_note || item.reason) && (
                        <div style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
                          📝 Ghi chú: {item.reason_note || item.reason}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{
                        fontSize: '22px',
                        fontWeight: '900',
                        color: isBonus ? '#16a34a' : '#dc2626'
                      }}>
                        {isBonus ? `+${item.score_change}đ` : `${item.score_change}đ`}
                      </div>

                      {item.student_name && (
                        <button
                          onClick={() => {
                            const msg = `Kính gửi Phụ huynh em ${item.student_name} (Lớp ${homeroomClass}), GVCN xin thông báo em có ghi nhận nề nếp ngày ${item.log_date}: ${item.criteria_title} (${item.score_change}đ). Ghi chú: ${item.reason_note || ''}. Kính mong gia đình phối hợp nhắc nhở em!`;
                            navigator.clipboard.writeText(msg);
                            alert(`Đã sao chép tin nhắn nhắc nhở cho phụ huynh em ${item.student_name}!`);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            color: '#0284c7',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Copy size={12} /> Sao chép nhắc nhở
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. MODAL GỬI TIN NHẮN ZALO BÁO CÁO PHỤ HUYNH */}
        {showZaloModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '24px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} color="#0068ff" /> Báo Cáo Thi Đua & Nề Nếp Tuần {selectedWeek} (Gửi Phụ Huynh Lớp {homeroomClass})
                </h3>
                <button onClick={() => setShowZaloModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Nội dung thông báo đã được hệ thống tự động soạn thảo chi tiết:</label>
                <textarea
                  rows={14}
                  value={generatedParentZaloMessage}
                  readOnly
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px', backgroundColor: '#f8fafc', color: '#1e293b', boxSizing: 'border-box', lineHeight: '1.6' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedParentZaloMessage);
                    setCopiedZalo(true);
                    setTimeout(() => setCopiedZalo(false), 3000);
                  }}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedZalo ? <Check size={16} color="#16a34a" /> : <Copy size={16} />} {copiedZalo ? 'Đã sao chép!' : 'Sao chép thông báo'}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedParentZaloMessage);
                    window.open('https://chat.zalo.me/', '_blank');
                  }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#0068ff',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,104,255,0.3)'
                  }}
                >
                  <Send size={16} /> Mở Nhóm Zalo Lớp Gửi Ngay
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
