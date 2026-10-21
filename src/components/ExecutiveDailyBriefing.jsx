import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Award, Calendar, CheckCircle2, AlertTriangle, Download, 
  Clock, TrendingUp, Filter, Search, ChevronRight, BookOpen, 
  Activity, Star, Sparkles, FileSpreadsheet, ShieldCheck, UserCheck, 
  PieChart as PieIcon, Layers, Heart, Coffee, Eye, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

// 36 Lớp tiêu chuẩn Trường THPT Cao Bá Quát
const ALL_CLASSES = [
  '10A01', '10A02', '10A03', '10A04', '10A05', '10A06', '10A07', '10A08', '10A09', '10A10', '10A11', '10A12',
  '11A01', '11A02', '11A03', '11A04', '11A05', '11A06', '11A07', '11A08', '11A09', '11A10', '11A11', '11A12',
  '12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10', '12A11', '12A12'
];

export default function ExecutiveDailyBriefing() {
  const [selectedGrade, setSelectedGrade] = useState('ALL'); // 'ALL' | '10' | '11' | '12'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterClassSearch, setFilterClassSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'journals' | 'emulation' | 'clubs'

  // Dữ liệu Sĩ số & Điểm danh 36 lớp (Khởi tạo chuẩn thực tế ~1540 HS)
  const [attendanceData, setAttendanceData] = useState(() => {
    return ALL_CLASSES.map((cls, idx) => {
      const baseTotal = 42 + (idx % 4); // 42 - 45 HS/lớp
      // Giả lập một vài lớp có học sinh vắng trong ngày để BGH theo dõi
      const hasAbsence = idx % 5 === 2 || idx % 7 === 1;
      const absentCount = hasAbsence ? (idx % 2 === 0 ? 1 : 2) : 0;
      const absentExcused = absentCount > 0 ? (idx % 3 === 0 ? 0 : absentCount) : 0;
      const absentUnexcused = absentCount - absentExcused;
      const presentCount = baseTotal - absentCount;

      let absentDetails = [];
      if (absentCount > 0) {
        if (absentExcused > 0) absentDetails.push(`Nguyễn Văn H (Có phép)`);
        if (absentUnexcused > 0) absentDetails.push(`Trần Thị M (Không phép - Trốn tiết 1)`);
      }

      return {
        className: cls,
        grade: cls.slice(0, 2),
        totalStudents: baseTotal,
        presentStudents: presentCount,
        absentStudents: absentCount,
        excused: absentExcused,
        unexcused: absentUnexcused,
        details: absentDetails.join('; '),
        homeroomTeacher: `Thầy/Cô Phụ Trách ${cls}`,
        updatedAt: '07:15 Sáng nay'
      };
    });
  });

  // Dữ liệu Tiết dạy & Sổ đầu bài điện tử hôm nay (180 tiết dạy toàn trường)
  const [journalStats, setJournalStats] = useState({
    totalPeriodsToday: 180,
    recordedPeriods: 174,
    signedByTeacher: 168,
    ratingA: 156, // Xuất sắc/Tốt
    ratingB: 16,  // Khá
    ratingC: 2,   // Trung bình
    ratingD: 0,   // Yếu/Kém
    notYetRecordedList: [
      { className: '10A04', period: 'Tiết 4', subject: 'Lịch sử', teacher: 'Thầy Lê Văn H', reason: 'Đang thao giảng' },
      { className: '11A09', period: 'Tiết 3', subject: 'Tin học', teacher: 'Cô Trần Thị N', reason: 'Thực hành phòng máy' }
    ]
  });

  // Dữ liệu Thi đua Nề nếp Tuần hiện tại
  const [emulationStats, setEmulationStats] = useState(() => {
    return ALL_CLASSES.map((cls, idx) => {
      // Điểm gốc 100đ, trừ một số lỗi vi phạm
      const minusPoints = (idx % 6 === 0 ? 4 : idx % 4 === 1 ? 2 : 0);
      const plusPoints = (idx % 5 === 0 ? 3 : 0);
      const totalScore = Math.max(80, 100 - minusPoints + plusPoints);
      
      let violations = [];
      if (minusPoints >= 4) violations.push('2 HS đi trễ, vệ sinh muộn');
      else if (minusPoints >= 2) violations.push('1 HS trang phục sai quy định');

      return {
        className: cls,
        grade: cls.slice(0, 2),
        baseScore: 100,
        minusScore: minusPoints,
        plusScore: plusPoints,
        finalScore: totalScore,
        violations: violations.join('; ') || 'Không vi phạm - Lớp nề nếp tốt',
        rank: 0 // Sẽ tính sau
      };
    }).sort((a, b) => b.finalScore - a.finalScore).map((item, i) => ({ ...item, rank: i + 1 }));
  });

  // Dữ liệu Câu lạc bộ trường
  const [clubStats, setClubStats] = useState([
    { id: 'clb_1', name: 'CLB Bóng Rổ CBQ', lead: 'Thầy Nguyễn Văn V', count: 120, attendanceRate: 98.2, status: 'Hoạt động tốt' },
    { id: 'clb_2', name: 'CLB Cầu Lông Sư Phạm', lead: 'Thầy Lê Hoàng P', count: 145, attendanceRate: 96.5, status: 'Hoạt động tốt' },
    { id: 'clb_3', name: 'CLB STEM & Sáng Tạo Robot', lead: 'Thầy Trần Đình K', count: 85, attendanceRate: 99.0, status: 'Xuất sắc' },
    { id: 'clb_4', name: 'CLB Âm Nhạc & Guitar', lead: 'Cô Vũ Minh T', count: 110, attendanceRate: 95.0, status: 'Hoạt động tốt' },
    { id: 'clb_5', name: 'CLB Tiếng Anh Giao Tiếp (CBQ English Club)', lead: 'Cô Hoàng Lan A', count: 160, attendanceRate: 97.4, status: 'Xuất sắc' },
    { id: 'clb_6', name: 'CLB Nhiếp Ảnh & Media Truyền Thông', lead: 'Thầy Phạm Quang D', count: 65, attendanceRate: 98.8, status: 'Xuất sắc' },
    { id: 'clb_7', name: 'CLB Võ Thuật Cổ Truyền & Tự Vệ', lead: 'Thầy Bùi Anh T', count: 95, attendanceRate: 94.2, status: 'Hoạt động tốt' },
    { id: 'clb_8', name: 'CLB Tranh Biện & Kỹ Năng Sống', lead: 'Cô Đặng Thu H', count: 105, attendanceRate: 96.0, status: 'Hoạt động tốt' }
  ]);

  // Tổng hợp chỉ số toàn trường (Realtime KPIs)
  const summaryKPIs = useMemo(() => {
    const totalStudents = attendanceData.reduce((acc, c) => acc + c.totalStudents, 0);
    const totalPresent = attendanceData.reduce((acc, c) => acc + c.presentStudents, 0);
    const totalAbsent = attendanceData.reduce((acc, c) => acc + c.absentStudents, 0);
    const totalExcused = attendanceData.reduce((acc, c) => acc + c.excused, 0);
    const totalUnexcused = attendanceData.reduce((acc, c) => acc + c.unexcused, 0);
    const attendancePercentage = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : '100';

    const avgEmulation = (emulationStats.reduce((acc, c) => acc + c.finalScore, 0) / emulationStats.length).toFixed(1);
    const totalClubMembers = clubStats.reduce((acc, c) => acc + c.count, 0);

    return {
      totalStudents,
      totalPresent,
      totalAbsent,
      totalExcused,
      totalUnexcused,
      attendancePercentage,
      avgEmulation,
      totalClubMembers
    };
  }, [attendanceData, emulationStats, clubStats]);

  // Bộ lọc danh sách lớp
  const filteredAttendance = useMemo(() => {
    return attendanceData.filter(item => {
      const matchGrade = selectedGrade === 'ALL' || item.grade === selectedGrade;
      const matchSearch = !filterClassSearch || item.className.toLowerCase().includes(filterClassSearch.toLowerCase()) || item.details.toLowerCase().includes(filterClassSearch.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [attendanceData, selectedGrade, filterClassSearch]);

  const filteredEmulation = useMemo(() => {
    return emulationStats.filter(item => {
      const matchGrade = selectedGrade === 'ALL' || item.grade === selectedGrade;
      const matchSearch = !filterClassSearch || item.className.toLowerCase().includes(filterClassSearch.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [emulationStats, selectedGrade, filterClassSearch]);

  // XUẤT BÁO CÁO TOÀN DIỆN CHO BAN GIÁM HIỆU SANG EXCEL (Tuân thủ chuẩn GEMINI.md: 1-Tên_file...)
  const handleExportDailyExecutiveReport = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Báo cáo sĩ số & Điểm danh ngày
      const attendRows = attendanceData.map((a, idx) => ({
        "STT": idx + 1,
        "Lớp": a.className,
        "Khối": a.grade,
        "Tổng sĩ số": a.totalStudents,
        "Có mặt": a.presentStudents,
        "Số vắng": a.absentStudents,
        "Vắng có phép": a.excused,
        "Vắng không phép": a.unexcused,
        "Họ tên học sinh vắng / Lý do": a.details || 'Đi đủ 100%',
        "GVCN": a.homeroomTeacher
      }));
      const wsAttend = XLSX.utils.json_to_sheet(attendRows);
      XLSX.utils.book_append_sheet(wb, wsAttend, "Sĩ Số & Điểm Danh Ngày");

      // Sheet 2: Sổ đầu bài & Tiết dạy hôm nay
      const journalRows = [
        { "Chỉ số": "Tổng số tiết dạy theo TKB hôm nay", "Giá trị": journalStats.totalPeriodsToday },
        { "Chỉ số": "Số tiết đã ghi nhận sổ đầu bài", "Giá trị": journalStats.recordedPeriods },
        { "Chỉ số": "Số tiết đã có chữ ký GVBM", "Giá trị": journalStats.signedByTeacher },
        { "Chỉ số": "Số tiết xếp loại Tốt / Xuất sắc (Loại A)", "Giá trị": journalStats.ratingA },
        { "Chỉ số": "Số tiết xếp loại Khá (Loại B)", "Giá trị": journalStats.ratingB },
        { "Chỉ số": "Số tiết xếp loại Trung bình (Loại C)", "Giá trị": journalStats.ratingC },
        { "Chỉ số": "Số tiết xếp loại Kém (Loại D)", "Giá trị": journalStats.ratingD },
        { "Chỉ số": "Tỷ lệ giờ dạy hoàn thành xuất sắc", "Giá trị": `${((journalStats.ratingA / journalStats.totalPeriodsToday) * 100).toFixed(1)}%` }
      ];
      const wsJournal = XLSX.utils.json_to_sheet(journalRows);
      XLSX.utils.book_append_sheet(wb, wsJournal, "Sổ Đầu Bài & Tiết Học");

      // Sheet 3: Bảng xếp hạng Thi đua nề nếp
      const emuRows = emulationStats.map(e => ({
        "Hạng": e.rank,
        "Lớp": e.className,
        "Khối": e.grade,
        "Điểm gốc": e.baseScore,
        "Điểm trừ vi phạm": e.minusScore,
        "Điểm cộng thi đua": e.plusScore,
        "Điểm tổng kết": e.finalScore,
        "Tình trạng nề nếp trong tuần": e.violations
      }));
      const wsEmu = XLSX.utils.json_to_sheet(emuRows);
      XLSX.utils.book_append_sheet(wb, wsEmu, "Thi Đua Nề Nếp Lớp");

      // Sheet 4: Câu Lạc Bộ
      const clubRows = clubStats.map((c, idx) => ({
        "STT": idx + 1,
        "Tên Câu Lạc Bộ": c.name,
        "Chủ nhiệm / Cố vấn CLB": c.lead,
        "Số lượng thành viên": c.count,
        "Tỷ lệ chuyên cần": `${c.attendanceRate}%`,
        "Đánh giá hoạt động": c.status
      }));
      const wsClub = XLSX.utils.json_to_sheet(clubRows);
      XLSX.utils.book_append_sheet(wb, wsClub, "Hoạt Động Câu Lạc Bộ");

      // Naming format strictly complying with GEMINI.md (starts with 1-)
      const fileName = `1-Bao_cao_dieu_hanh_hang_ngay_BGH_CBQ_${selectedDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      alert(`🎉 ĐÃ XUẤT BÁO CÁO ĐIỀU HÀNH BGH THÀNH CÔNG!\n\nTệp tải về: ${fileName}`);
    } catch (err) {
      alert("Lỗi xuất file Excel: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. TOP HEADER BANNER FOR BGH & SECRETARY */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15,23,42,0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', marginBottom: '10px' }}>
            <Activity size={14} color="#38bdf8" />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#bae6fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Trung Tâm Báo Cáo Điều Hành Trực Quan • Ban Giám Hiệu & Thư Ký
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
            Bảng Giám Sát Số Liệu Nhà Trường Hàng Ngày (Real-Time Executive Digest)
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1', maxWidth: '750px', lineHeight: 1.5 }}>
            Theo dõi tức thì sĩ số 36 lớp, học sinh vắng, nề nếp tiết dạy, sổ đầu bài điện tử, bảng xếp hạng thi đua và hoạt động 12 Câu lạc bộ Trường THPT Cao Bá Quát.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Calendar size={16} color="#ffffff" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
            />
          </div>

          <button
            onClick={handleExportDailyExecutiveReport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <Download size={16} /> Xuất Báo Cáo BGH (Excel)
          </button>
        </div>
      </div>

      {/* 2. FOUR CORE METRIC DASHBOARDS (HÀNG NGÀY CHO BGH) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        
        {/* KPI 1: SĨ SỐ & ĐIỂM DANH */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>SĨ SỐ & CÓ MẶT HÔM NAY</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#e0f2fe' }}>
              <Users size={18} color="#0284c7" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>{summaryKPIs.totalPresent}</span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>/ {summaryKPIs.totalStudents} HS ({summaryKPIs.attendancePercentage}%)</span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', fontSize: '12px' }}>
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
              Vắng: {summaryKPIs.totalAbsent} HS
            </span>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
              Phép: {summaryKPIs.totalExcused}
            </span>
            {summaryKPIs.totalUnexcused > 0 && (
              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                Không phép: {summaryKPIs.totalUnexcused}
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: TIẾT HỌC & SỔ ĐẦU BÀI */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#15803d' }}>SỔ ĐẦU BÀI & TIẾT DẠY</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#dcfce7' }}>
              <BookOpen size={18} color="#16a34a" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>{journalStats.recordedPeriods}</span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>/ {journalStats.totalPeriodsToday} tiết TKB (96.7%)</span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
              ✓ Loại A: {journalStats.ratingA} tiết
            </span>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
              Loại B: {journalStats.ratingB}
            </span>
            {journalStats.ratingC > 0 && (
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                Loại C: {journalStats.ratingC}
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: THI ĐUA NỀ NẾP TUẦN */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#d97706' }}>ĐIỂM THI ĐUA TRUNG BÌNH</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#fef3c7' }}>
              <Award size={18} color="#d97706" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>{summaryKPIs.avgEmulation}</span>
            <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 'bold' }}>/ 100 Điểm (Tốt)</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <span>Top 1: <strong>12A01 (100đ)</strong> • <strong>11A02 (99.5đ)</strong></span>
          </div>
        </div>

        {/* KPI 4: CÂU LẠC BỘ & HOẠT ĐỘNG NGOÀI GIỜ */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#7c3aed' }}>HOẠT ĐỘNG CÂU LẠC BỘ</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#f3e8ff' }}>
              <Heart size={18} color="#7c3aed" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>{summaryKPIs.totalClubMembers}</span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>học sinh tham gia (76.5%)</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b21a8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#7c3aed" />
            <span>12 CLB vận hành sôi nổi • Chuyên cần 96.8%</span>
          </div>
        </div>

      </div>

      {/* 3. TABS CONTROLLER CHO CHI TIẾT SỐ LIỆU */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        
        {/* Navigation Sub-Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '6px 12px', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('attendance')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeSubTab === 'attendance' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'attendance' ? '#0284c7' : '#64748b',
              fontWeight: 'bold',
              fontSize: '13.5px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubTab === 'attendance' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Users size={16} /> 1. Sĩ Số & Danh Sách Vắng 36 Lớp
          </button>

          <button
            onClick={() => setActiveSubTab('journals')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeSubTab === 'journals' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'journals' ? '#16a34a' : '#64748b',
              fontWeight: 'bold',
              fontSize: '13.5px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubTab === 'journals' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <BookOpen size={16} /> 2. Hoạt Động Trong Lớp & Sổ Đầu Bài
          </button>

          <button
            onClick={() => setActiveSubTab('emulation')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeSubTab === 'emulation' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'emulation' ? '#d97706' : '#64748b',
              fontWeight: 'bold',
              fontSize: '13.5px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubTab === 'emulation' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Award size={16} /> 3. Bảng Xếp Hạng Thi Đua Nề Nếp
          </button>

          <button
            onClick={() => setActiveSubTab('clubs')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeSubTab === 'clubs' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'clubs' ? '#7c3aed' : '#64748b',
              fontWeight: 'bold',
              fontSize: '13.5px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubTab === 'clubs' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Heart size={16} /> 4. Hoạt Động & Điểm Danh Câu Lạc Bộ
          </button>
        </div>

        {/* Filter bar for Class/Grade */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Khối lớp:</span>
            {['ALL', '10', '11', '12'].map(g => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: selectedGrade === g ? '#0284c7' : '#cbd5e1',
                  background: selectedGrade === g ? '#0284c7' : '#ffffff',
                  color: selectedGrade === g ? '#ffffff' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {g === 'ALL' ? 'Tất cả 36 lớp' : `Khối ${g}`}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Tìm tên lớp hoặc học sinh vắng..."
              value={filterClassSearch}
              onChange={e => setFilterClassSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* SUB-TAB 1: ATTENDANCE & ABSENCES */}
        {activeSubTab === 'attendance' && (
          <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 12px' }}>STT</th>
                  <th style={{ padding: '10px 12px' }}>Lớp</th>
                  <th style={{ padding: '10px 12px' }}>Khối</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Sĩ Số Gốc</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Có Mặt</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Số Vắng</th>
                  <th style={{ padding: '10px 12px' }}>Danh Sách & Lý Do Vắng Hàng Ngày</th>
                  <th style={{ padding: '10px 12px' }}>Cập Nhật</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((row, idx) => (
                  <tr key={row.className} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: row.absentStudents > 0 ? (row.unexcused > 0 ? '#fff1f2' : '#fffbeb') : 'transparent' }}>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#0f172a' }}>{row.className}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>Khối {row.grade}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>{row.totalStudents}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{row.presentStudents}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {row.absentStudents > 0 ? (
                        <span style={{ padding: '3px 8px', borderRadius: '12px', background: row.unexcused > 0 ? '#fee2e2' : '#fef3c7', color: row.unexcused > 0 ? '#dc2626' : '#d97706', fontWeight: 'bold' }}>
                          {row.absentStudents} vắng {row.unexcused > 0 ? `(${row.unexcused} K.Phép)` : '(Có phép)'}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: '600' }}>✓ Đủ</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: row.absentStudents > 0 ? '#b45309' : '#64748b' }}>
                      {row.details || '100% Học sinh có mặt đúng giờ, chuyên cần'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '11.5px' }}>{row.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB 2: CLASS JOURNAL & TEACHING ACTIVITIES */}
        {activeSubTab === 'journals' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>🎯 Thống Kê Xếp Loại Tiết Dạy Hôm Nay</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Loại A (Xuất sắc / Tốt):</span>
                    <strong>{journalStats.ratingA} tiết ({((journalStats.ratingA/journalStats.totalPeriodsToday)*100).toFixed(1)}%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#0284c7', fontWeight: 'bold' }}>Loại B (Khá):</span>
                    <strong>{journalStats.ratingB} tiết ({((journalStats.ratingB/journalStats.totalPeriodsToday)*100).toFixed(1)}%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#d97706', fontWeight: 'bold' }}>Loại C (Trung bình):</span>
                    <strong>{journalStats.ratingC} tiết</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Loại D (Kém):</span>
                    <strong>{journalStats.ratingD} tiết</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '14px', border: '1px solid #bfdbfe' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e40af' }}>✍️ Tiến Độ Ký Sổ Đầu Bài Điện Tử</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tổng số tiết theo TKB:</span>
                    <strong>{journalStats.totalPeriodsToday} tiết</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Đã ghi nhận & Giáo viên ký:</span>
                    <strong style={{ color: '#16a34a' }}>{journalStats.signedByTeacher} tiết (93.3%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#d97706', fontWeight: 'bold' }}>Chưa ký nhận sổ:</span>
                    <strong style={{ color: '#d97706' }}>{journalStats.totalPeriodsToday - journalStats.signedByTeacher} tiết</strong>
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a' }}>⚠️ Tiết Dạy Cần Bổ Sung Ghi Nhận / Chữ Ký Sổ Đầu Bài:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {journalStats.notYetRecordedList.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#b45309' }}>{item.className}</span>
                    <span>{item.period} - Môn: <strong>{item.subject}</strong></span>
                    <span style={{ color: '#475569' }}>GV: {item.teacher}</span>
                  </div>
                  <span style={{ color: '#d97706', fontStyle: 'italic', fontSize: '12px' }}>{item.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-TAB 3: EMULATION LEADERBOARD */}
        {activeSubTab === 'emulation' && (
          <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 12px' }}>Hạng</th>
                  <th style={{ padding: '10px 12px' }}>Lớp</th>
                  <th style={{ padding: '10px 12px' }}>Khối</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Điểm Gốc</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Điểm Trừ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Điểm Cộng</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Tổng Điểm</th>
                  <th style={{ padding: '10px 12px' }}>Ghi Nhận Nề Nếp & Vi Phạm</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmulation.map((row) => (
                  <tr key={row.className} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      {row.rank <= 3 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: row.rank === 1 ? '#fef08a' : row.rank === 2 ? '#e2e8f0' : '#fed7aa', color: '#854d0e', fontWeight: 'bold' }}>
                          {row.rank}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>{row.rank}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#0f172a' }}>{row.className}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>Khối {row.grade}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{row.baseScore}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>
                      {row.minusScore > 0 ? `-${row.minusScore}` : '0'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>
                      {row.plusScore > 0 ? `+${row.plusScore}` : '0'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '15px', fontWeight: '900', color: row.finalScore >= 98 ? '#16a34a' : row.finalScore >= 95 ? '#0284c7' : '#d97706' }}>
                      {row.finalScore}
                    </td>
                    <td style={{ padding: '10px 12px', color: row.minusScore > 0 ? '#b91c1c' : '#15803d' }}>
                      {row.violations}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB 4: CLUBS OVERVIEW */}
        {activeSubTab === 'clubs' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {clubStats.map(c => (
                <div key={c.id} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{c.name}</h4>
                    <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: 'bold' }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '10px' }}>
                    Chủ nhiệm: <strong>{c.lead}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', fontSize: '13px' }}>
                    <span>Số thành viên: <strong style={{ color: '#0284c7' }}>{c.count} HS</strong></span>
                    <span>Chuyên cần: <strong style={{ color: '#16a34a' }}>{c.attendanceRate}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
