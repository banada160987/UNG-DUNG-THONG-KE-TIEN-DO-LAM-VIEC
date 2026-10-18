import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, Plus, Save, BookOpen, Clock, User, CheckCircle2, 
  AlertTriangle, Download, Calendar, Filter, Award, CheckSquare, 
  Sparkles, FileSpreadsheet, ShieldCheck, PenTool, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import timetableData from '../../data/master_timetable.json';

const SCHOOL_CLASSES = [
  '10A01', '10A02', '10A03', '10A04', '10A05', '10A06', '10A07', '10A08', '10A09', '10A10', '10A11', '10A12',
  '11A01', '11A02', '11A03', '11A04', '11A05', '11A06', '11A07', '11A08', '11A09', '11A10', '11A11', '11A12',
  '12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10', '12A11', '12A12'
];

const DAYS_OF_WEEK = [
  { id: 'Thứ 2', label: 'Thứ Hai' },
  { id: 'Thứ 3', label: 'Thứ Ba' },
  { id: 'Thứ 4', label: 'Thứ Tư' },
  { id: 'Thứ 5', label: 'Thứ Năm' },
  { id: 'Thứ 6', label: 'Thứ Sáu' },
  { id: 'Thứ 7', label: 'Thứ Bảy' }
];

const RATING_TYPES = [
  { id: 'A', label: 'Loại A (10 điểm - Tốt / Xuất sắc)', score: 10, color: '#16a34a', bg: '#dcfce7' },
  { id: 'B', label: 'Loại B (8 điểm - Khá / Tương đối tốt)', score: 8, color: '#0284c7', bg: '#e0f2fe' },
  { id: 'C', label: 'Loại C (6 điểm - Trung bình / Còn mất trật tự)', score: 6, color: '#d97706', bg: '#fef3c7' },
  { id: 'D', label: 'Loại D (4 điểm - Kém / Mất trật tự nghiêm trọng)', score: 4, color: '#dc2626', bg: '#fee2e2' }
];

export default function ClassJournal() {
  const navigate = useNavigate();
  
  // Auth state
  const [currentStudent, setCurrentStudent] = useState(null);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [userRole, setUserRole] = useState('guest'); // 'student' | 'teacher' | 'admin'
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState('12A01');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL'); // 'ALL' or specific day
  
  // Data state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    day_of_week: 'Thứ 2',
    period_number: 1,
    ppct_number: 1,
    subject: '',
    teacher_name: '',
    lesson_title: '',
    attend_count: 42,
    absent_students: '',
    rating_type: 'A',
    score: 10,
    notes: '',
    is_signed: false
  });

  // 1. Check Authentication (Học sinh cán sự hoặc Giáo viên)
  useEffect(() => {
    const studentStr = localStorage.getItem('cbq_current_student');
    const teacherStr = localStorage.getItem('cbq_current_teacher');
    
    if (teacherStr) {
      try {
        const t = JSON.parse(teacherStr);
        setCurrentTeacher(t);
        setUserRole('teacher');
        if (t.homeroom_class) {
          setSelectedClass(t.homeroom_class);
        }
      } catch (e) {}
    } else if (studentStr) {
      try {
        const s = JSON.parse(studentStr);
        setCurrentStudent(s);
        setUserRole('student');
        if (s.student_class) {
          setSelectedClass(s.student_class);
        }
      } catch (e) {}
    } else {
      // Cho phép giáo viên từ menu quản trị
      setUserRole('guest');
    }
  }, []);

  // 2. Fetch Journals when Class or Week changes
  useEffect(() => {
    if (selectedClass) {
      fetchJournals(selectedClass, selectedWeek);
    }
  }, [selectedClass, selectedWeek]);

  const fetchJournals = async (className, week) => {
    setLoading(true);
    try {
      // 1. Đọc từ CSDL Supabase
      const { data, error } = await supabase
        .from('cbq_class_journals')
        .select('*')
        .eq('class_name', className)
        .eq('week_number', week)
        .order('period_number', { ascending: true });

      if (!error && data && data.length > 0) {
        setRecords(data);
        localStorage.setItem(`cbq_journals_${className}_w${week}`, JSON.stringify(data));
      } else {
        // Fallback LocalStorage cache
        const cached = localStorage.getItem(`cbq_journals_${className}_w${week}`);
        if (cached) {
          setRecords(JSON.parse(cached));
        } else {
          // Tạo bản ghi mẫu từ Thời khóa biểu trường nếu tuần mới chưa có dữ liệu
          const defaultRecords = generateDefaultJournalsFromTimetable(className, week);
          setRecords(defaultRecords);
        }
      }
    } catch (err) {
      console.warn("Lỗi nạp sổ đầu bài:", err);
      const cached = localStorage.getItem(`cbq_journals_${className}_w${week}`);
      if (cached) {
        setRecords(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper: Tạo danh sách tiết học theo thời khóa biểu thực tế của trường
  const generateDefaultJournalsFromTimetable = (className, week) => {
    const classTt = timetableData.filter(item => item.student_class === className);
    if (!classTt || classTt.length === 0) return [];

    const generated = [];
    DAYS_OF_WEEK.forEach(day => {
      // Lấy các tiết của lớp trong ngày
      const dayLessons = classTt.filter(item => item.day_of_week === day.id);
      dayLessons.forEach(lesson => {
        generated.push({
          id: `tt_${className}_w${week}_${day.id}_p${lesson.period}`,
          class_name: className,
          week_number: week,
          study_date: new Date().toISOString().split('T')[0],
          day_of_week: day.id,
          period_number: lesson.period,
          ppct_number: lesson.period * week,
          subject: lesson.subject || 'Học tập',
          teacher_name: lesson.teacher_name || 'Giáo viên bộ môn',
          lesson_title: `Bài học theo PPCT tuần ${week}`,
          attend_count: 42,
          absent_students: '',
          rating_type: 'A',
          score: 10,
          notes: 'Lớp trật tự, chú ý nghe giảng và phát biểu xây dựng bài.',
          is_signed: false,
          signed_by: '',
          signed_at: null
        });
      });
    });

    return generated;
  };

  // Tự động gợi ý môn học & giáo viên từ TKB khi người dùng chọn Thứ và Tiết
  const handleDayOrPeriodChange = (newDay, newPeriod) => {
    const match = timetableData.find(
      item => item.student_class === selectedClass && 
              item.day_of_week === newDay && 
              Number(item.period) === Number(newPeriod)
    );

    setFormData(prev => ({
      ...prev,
      day_of_week: newDay,
      period_number: Number(newPeriod),
      subject: match?.subject || prev.subject,
      teacher_name: match?.teacher_name || prev.teacher_name
    }));
  };

  // Ký duyệt tiết học (Dành cho Giáo viên bộ môn)
  const handleSignPeriod = async (record) => {
    const signerName = currentTeacher?.full_name || currentTeacher?.name || record.teacher_name || 'Giáo viên Bộ môn';
    const nowIso = new Date().toISOString();
    
    const updatedRecord = {
      ...record,
      is_signed: true,
      signed_by: signerName,
      signed_at: nowIso
    };

    const newRecords = records.map(r => r.id === record.id ? updatedRecord : r);
    setRecords(newRecords);
    localStorage.setItem(`cbq_journals_${selectedClass}_w${selectedWeek}`, JSON.stringify(newRecords));

    try {
      await supabase
        .from('cbq_class_journals')
        .upsert([updatedRecord]);
    } catch (e) {}

    alert(`✍️ Đã ký duyệt điện tử tiết ${record.period_number} (${record.subject}) thành công!\nKý bởi: ${signerName}`);
  };

  // Lưu hoặc Cập nhật tiết dạy
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.teacher_name) {
      alert("Vui lòng nhập Môn học và Tên Giáo viên!");
      return;
    }

    const recordToSave = {
      ...formData,
      id: editingRecord?.id || `rec_${Date.now()}`,
      class_name: selectedClass,
      week_number: selectedWeek,
      study_date: editingRecord?.study_date || new Date().toISOString().split('T')[0]
    };

    let updatedList = [...records];
    const existIdx = updatedList.findIndex(r => r.id === recordToSave.id);
    if (existIdx >= 0) {
      updatedList[existIdx] = recordToSave;
    } else {
      updatedList.push(recordToSave);
    }

    // Sắp xếp theo Thứ và Tiết
    updatedList.sort((a, b) => {
      const dayOrder = { 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6 };
      if (dayOrder[a.day_of_week] !== dayOrder[b.day_of_week]) {
        return (dayOrder[a.day_of_week] || 0) - (dayOrder[b.day_of_week] || 0);
      }
      return (Number(a.period_number) || 0) - (Number(b.period_number) || 0);
    });

    setRecords(updatedList);
    localStorage.setItem(`cbq_journals_${selectedClass}_w${selectedWeek}`, JSON.stringify(updatedList));

    try {
      await supabase.from('cbq_class_journals').upsert([recordToSave]);
    } catch (e) {}

    setShowAddModal(false);
    setEditingRecord(null);
    alert("🎉 Đã lưu thông tin tiết học vào Sổ đầu bài điện tử!");
  };

  // Mở modal sửa tiết
  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setFormData({
      day_of_week: record.day_of_week,
      period_number: record.period_number,
      ppct_number: record.ppct_number || 1,
      subject: record.subject,
      teacher_name: record.teacher_name,
      lesson_title: record.lesson_title || '',
      attend_count: record.attend_count || 42,
      absent_students: record.absent_students || '',
      rating_type: record.rating_type || 'A',
      score: record.score || 10,
      notes: record.notes || '',
      is_signed: record.is_signed || false
    });
    setShowAddModal(true);
  };

  // Thống kê Sổ đầu bài tuần
  const weeklyStats = useMemo(() => {
    const totalPeriods = records.length;
    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countD = 0;
    let totalScore = 0;

    records.forEach(r => {
      const score = Number(r.score) || 10;
      totalScore += score;
      if (r.rating_type === 'A') countA++;
      else if (r.rating_type === 'B') countB++;
      else if (r.rating_type === 'C') countC++;
      else if (r.rating_type === 'D') countD++;
    });

    const avgScore = totalPeriods > 0 ? (totalScore / totalPeriods).toFixed(1) : 10;
    const emulationScore = Math.max(0, 100 - (countB * 2) - (countC * 5) - (countD * 10));

    return { totalPeriods, countA, countB, countC, countD, avgScore, emulationScore };
  }, [records]);

  // Xuất Excel chuẩn Nghị định 30 & GEMINI.md
  const handleExportExcel = () => {
    if (records.length === 0) {
      alert("Chưa có dữ liệu tiết học để xuất Excel!");
      return;
    }

    const exportData = records.map((r, idx) => ({
      'STT': idx + 1,
      'Thứ': r.day_of_week,
      'Tiết': r.period_number,
      'Môn Học': r.subject,
      'Tiết PPCT': r.ppct_number || '',
      'Tên Bài Dạy': r.lesson_title || '',
      'Sĩ Số Có Mặt': r.attend_count || '',
      'Học Sinh Vắng': r.absent_students || 'Đủ',
      'Giáo Viên Dạy': r.teacher_name || '',
      'Xếp Loại': `Loại ${r.rating_type} (${r.score}đ)`,
      'Nhận Xét Của Giáo Viên': r.notes || '',
      'Trạng Thái Ký Số': r.is_signed ? `Đã ký bởi ${r.signed_by}` : 'Chưa ký'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `SoDauBai_Tuan_${selectedWeek}`);

    // QUY TẮC GEMINI.md: Tiền tố số thứ tự 1- ở đầu file
    const fileName = `1-So_Dau_Bai_Dien_Tu_Lop_${selectedClass}_Tuan_${selectedWeek}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Lọc theo Thứ
  const filteredRecords = useMemo(() => {
    if (selectedDayFilter === 'ALL') return records;
    return records.filter(r => r.day_of_week === selectedDayFilter);
  }, [records, selectedDayFilter]);

  return (
    <div style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
      {/* HEADER & NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <Link 
          to={userRole === 'teacher' ? "/teacher-dashboard" : "/student-dashboard"} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold' }}
        >
          <ArrowLeft size={18} /> Quay lại Bảng điều khiển
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportExcel}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            <FileSpreadsheet size={16} /> Xuất Excel Sổ Tuần
          </button>
          <button
            onClick={() => {
              setEditingRecord(null);
              setFormData({
                day_of_week: 'Thứ 2',
                period_number: 1,
                ppct_number: 1,
                subject: '',
                teacher_name: '',
                lesson_title: '',
                attend_count: 42,
                absent_students: '',
                rating_type: 'A',
                score: 10,
                notes: '',
                is_signed: false
              });
              setShowAddModal(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', backgroundColor: '#ca8a04', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            <Plus size={16} /> Ghi Sổ Tiết Mới
          </button>
        </div>
      </div>

      {/* HERO TITLE CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #854d0e 0%, #ca8a04 50%, #eab308 100%)',
        color: '#ffffff',
        padding: '24px',
        borderRadius: '20px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px rgba(202, 138, 4, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
              <Sparkles size={14} /> CHUYỂN ĐỔI SỐ GDPT 2018 - THPT CAO BÁ QUÁT
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={28} /> SỔ ĐẦU BÀI ĐIỆN TỬ THÔNG MINH
            </h1>
            <p style={{ margin: 0, opacity: 0.95, fontSize: '14px' }}>
              Ghi chép tiết dạy trực tuyến, ký duyệt điện tử giáo viên bộ môn & tự động tích hợp Thời khóa biểu.
            </p>
          </div>

          {/* Quick Selectors */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>Lớp Học</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}
              >
                {SCHOOL_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>Tuần Học</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(Number(e.target.value))}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* WEEKLY METRICS SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Tổng số tiết trong tuần</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', marginTop: '4px' }}>{weeklyStats.totalPeriods} tiết</div>
        </div>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>Tiết Loại A (Tốt)</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>{weeklyStats.countA} <span style={{ fontSize: '13px', fontWeight: 'normal' }}>({weeklyStats.totalPeriods ? Math.round(weeklyStats.countA / weeklyStats.totalPeriods * 100) : 0}%)</span></div>
        </div>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>Tiết Loại B (Khá)</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>{weeklyStats.countB}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>Tiết C / D (Mất TT)</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#dc2626', marginTop: '4px' }}>{weeklyStats.countC + weeklyStats.countD}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#d97706', fontWeight: '600' }}>Điểm Thi Đua Học Tập</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#d97706', marginTop: '4px' }}>{weeklyStats.emulationScore} <span style={{ fontSize: '13px', fontWeight: 'normal' }}>/100đ</span></div>
        </div>
      </div>

      {/* FILTER TABS BY DAY */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setSelectedDayFilter('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: selectedDayFilter === 'ALL' ? '#854d0e' : '#f1f5f9',
            color: selectedDayFilter === 'ALL' ? '#ffffff' : '#475569'
          }}
        >
          Toàn Bộ Tuần {selectedWeek}
        </button>
        {DAYS_OF_WEEK.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDayFilter(d.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: selectedDayFilter === d.id ? '#854d0e' : '#f1f5f9',
              color: selectedDayFilter === d.id ? '#ffffff' : '#475569'
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* MAIN JOURNAL TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Đang nạp dữ liệu Sổ đầu bài...</div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chưa có tiết dạy nào được ghi nhận cho thời gian này.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fefce8', color: '#854d0e', borderBottom: '2px solid #fde047' }}>
                  <th style={thStyle}>Thứ / Tiết</th>
                  <th style={thStyle}>Môn Học & PPCT</th>
                  <th style={thStyle}>Tên Bài Học (GDPT 2018)</th>
                  <th style={thStyle}>Sĩ Số & Vắng</th>
                  <th style={thStyle}>Giáo Viên</th>
                  <th style={thStyle}>Xếp Loại</th>
                  <th style={thStyle}>Nhận Xét & Chữ Ký</th>
                  <th style={thStyle}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: '800', color: '#854d0e' }}>{r.day_of_week}</span>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Tiết {r.period_number}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{r.subject}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>Tiết PPCT: #{r.ppct_number || r.period_number}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: '#334155' }}>{r.lesson_title || 'Chưa cập nhật tên bài'}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '12.5px' }}>Có mặt: <strong>{r.attend_count || 42}</strong></div>
                      {r.absent_students ? (
                        <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold', marginTop: '2px' }}>
                          Vắng: {r.absent_students}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#16a34a' }}>Đủ 100%</div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{r.teacher_name}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '800',
                        backgroundColor: RATING_TYPES.find(rt => rt.id === r.rating_type)?.bg || '#dcfce7',
                        color: RATING_TYPES.find(rt => rt.id === r.rating_type)?.color || '#16a34a'
                      }}>
                        Loại {r.rating_type} ({r.score}đ)
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>{r.notes || 'Học tập tốt'}</div>
                      {r.is_signed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                          <ShieldCheck size={12} /> Đã ký số ({r.signed_by})
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#d97706', fontStyle: 'italic' }}>Chưa ký số</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!r.is_signed && (
                          <button
                            onClick={() => handleSignPeriod(r)}
                            title="Giáo viên ký duyệt tiết dạy"
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #10b981', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            <PenTool size={13} /> Ký
                          </button>
                        )}
                        <button
                          onClick={() => handleEditRecord(r)}
                          title="Chỉnh sửa nội dung tiết"
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: GHI SỔ / CHỈNH SỬA TIẾT DẠY */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} /> {editingRecord ? 'Chỉnh sửa tiết học' : 'Ghi nhận tiết học mới'} - Lớp {selectedClass}
            </h3>

            <form onSubmit={handleSaveRecord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Thứ trong tuần (*)</label>
                  <select
                    value={formData.day_of_week}
                    onChange={e => handleDayOrPeriodChange(e.target.value, formData.period_number)}
                    style={inputStyle}
                  >
                    {DAYS_OF_WEEK.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tiết học (*)</label>
                  <select
                    value={formData.period_number}
                    onChange={e => handleDayOrPeriodChange(formData.day_of_week, e.target.value)}
                    style={inputStyle}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>Tiết {p} {p <= 5 ? '(Sáng)' : '(Chiều)'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Môn học (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Toán, Ngữ văn..."
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tiết PPCT</label>
                  <input
                    type="number"
                    value={formData.ppct_number}
                    onChange={e => setFormData({ ...formData, ppct_number: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Giáo viên giảng dạy (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Họ tên Thầy/Cô bộ môn"
                  value={formData.teacher_name}
                  onChange={e => setFormData({ ...formData, teacher_name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Tên bài dạy (Theo CV 5512 / GDPT 2018) (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Khái niệm về Khối đa diện (Tiết 1)"
                  value={formData.lesson_title}
                  onChange={e => setFormData({ ...formData, lesson_title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Sĩ số có mặt</label>
                  <input
                    type="number"
                    value={formData.attend_count}
                    onChange={e => setFormData({ ...formData, attend_count: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Học sinh vắng (nếu có)</label>
                  <input
                    type="text"
                    placeholder="VD: Nam (P), Hùng (K)"
                    value={formData.absent_students}
                    onChange={e => setFormData({ ...formData, absent_students: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Xếp loại tiết học (*)</label>
                <select
                  value={formData.rating_type}
                  onChange={e => {
                    const r = RATING_TYPES.find(rt => rt.id === e.target.value);
                    setFormData({
                      ...formData,
                      rating_type: e.target.value,
                      score: r ? r.score : 10
                    });
                  }}
                  style={inputStyle}
                >
                  {RATING_TYPES.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Nhận xét của Giáo viên bộ môn</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận thái độ học tập, bài tập về nhà, trật tự lớp..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#ca8a04', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Lưu Sổ Đầu Bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' };
const thStyle = { padding: '12px 10px', fontSize: '12.5px', fontWeight: 'bold', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 10px', verticalAlign: 'middle' };
