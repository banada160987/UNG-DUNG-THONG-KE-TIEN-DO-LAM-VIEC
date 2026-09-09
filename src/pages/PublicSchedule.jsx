import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Calendar, Clock, MapPin, Printer, FileSpreadsheet, Share2, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import masterTimetableData from '../data/master_timetable.json';
import { getSchoolWeeks2026, exportScheduleToWordDecree30, ROMAN_NUMERALS } from '../utils/decree30ScheduleWord';

const DEFAULT_SCHEDULE = {
  title: 'LỊCH CÔNG TÁC TUẦN 01 (Từ 01/09/2026 đến 07/09/2026)',
  week_number: 1,
  start_date: '2026-09-01',
  end_date: '2026-09-07',
  bgh_duty: 'Thầy Lê Văn A - Hiệu trưởng (Trực chính)',
  teacher_duty: 'Cô Nguyễn Thị B - Tổ trưởng Tổ Ngữ văn (Trực ban)',
  schedule_items: [
    { day: "Thứ Hai (01/09)", time: "07:30", content: "Chào cờ toàn trường & Quán triệt công tác chuẩn bị Lễ Kỷ Niệm 30 Năm", location: "Sân trường", chair: "BGH", participants: "Toàn thể GV & HS" },
    { day: "Thứ Hai (01/09)", time: "14:00", content: "Họp Hội đồng Sư phạm mở rộng duyệt kịch bản sự kiện", location: "Phòng Hội đồng", chair: "Hiệu trưởng", participants: "Toàn thể Cán bộ Giáo viên" },
    { day: "Thứ Ba (02/09)", time: "08:00", content: "Tổng duyệt chương trình Lễ Kỷ Niệm 30 Năm Thành Lập Trường", location: "Sân khấu chính", chair: "Ban Tổ Chức", participants: "CÁC Tiểu ban & Đội văn nghệ" },
    { day: "Thứ Tư (03/09)", time: "07:30", content: "CHÍNH THỨC TỔ CHỨC LỄ KỶ NIỆM 30 NĂM THÀNH LẬP TRƯỜNG THPT CAO BÁ QUÁT", location: "Khuôn viên nhà trường", chair: "BGH & Lãnh đạo Sở", participants: "Đại biểu, Cựu GV, Cựu HS & Toàn trường" },
    { day: "Thứ Sáu (05/09)", time: "07:30", content: "LỄ KHAI GIẢNG NĂM HỌC MỚI 2026 - 2027", location: "Sân trường", chair: "Hiệu trưởng", participants: "Toàn thể GV & Học sinh" }
  ]
};

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const TEACHER_FULL_MAP = {
  "Thảo": "Lê Thị Thảo", "Thơ": "Phạm Thị Nguyệt Thơ", "Lam (T)": "Nguyễn Hữu Lam",
  "Chuyên": "Nguyễn Thị Chuyên", "Hoa (T)": "Nguyễn Thị Ngọc Hoa", "Hà (T)": "Nguyễn Thị Thanh Hà",
  "Khoa": "Vương Quốc Khoa", "Khuyến": "Nguyễn Thị Khuyến", "Khánh": "Nguyễn Ngọc Khánh",
  "Thu": "Lương Thị Kim Thu", "Thùy": "Đặng Thị Thanh Thùy", "Xe": "Võ Xe", "Bão": "Bùi Phong Bão",
  "Huyền": "Nguyễn Thị Thanh Huyền", "Hà (CN)": "Nguyễn Thị Thu Hà", "Thắng (L)": "Nguyễn Hàm Thắng",
  "Hảo": "Nguyễn Đại Vĩnh Hảo", "Yến": "Phạm Thị Hải Yến", "Định": "Nguyễn Thanh Định",
  "Lam (H)": "Trương Thị Hoàng Lam", "Thương": "Văn Thị Thương", "Hồng (H)": "Nguyễn Thị Thúy Hồng",
  "Minh": "Dương Văn Minh", "Phượng": "Nguyễn Thị Kim Phượng", "Thắm": "Phạm Thị Thắm",
  "Tuyết (H)": "Nguyễn Thị Ánh Tuyết", "Tuấn (H)": "Cao Thanh Tuấn", "Êban": "Y Duy Êban",
  "Giang": "Phạm Thị Hương Giang", "Hiền (S)": "Vũ Thị Thu Hiền", "Oanh (S)": "Phạm Thị Ngọc Oanh",
  "Thủy": "Trần Thị Thanh Thủy", "Vinh": "Lương Chấn Vinh", "Hiền (AV)": "Phạm Thị Thu Hiền",
  "Hoa (AV)": "Trần Thị Quỳnh Hoa", "Hà (AV)": "Nguyễn Thị Hà (AV)", "Hậu": "Nguyễn Thị Hậu",
  "Hồng (AV)": "Nguyễn Thị Hồng", "Ngọc": "Bùi Hoài Thanh Ngọc", "Quy": "Võ Thị Kim Quy",
  "Thơm": "Đặng Thị Thơm", "Hà (Văn)": "Nguyễn Thị Hà (V)", "Lan": "Phạm Thị Ngọc Lan",
  "Lài": "Vũ Thị Lài", "Lý": "Võ Thị Minh Lý", "Mùi": "Nguyễn Thị Mùi", "Quyên": "Trần Thị Quế Quyên",
  "Thi": "Phạm Thị Ngọc Thi", "Thúy": "Nguyễn Thị Huỳnh Thúy", "Huệ": "Huỳnh Thị Kim Huệ",
  "Hương": "Lê Thị Mai Hương", "Tâm": "Hoàng Thi Minh Tâm", "Vy": "Lê Đặng Hạnh Vy",
  "Xuân": "Huỳnh Thị Lệ Xuân", "H' Phương": "H' Phương Byă", "Quỳnh": "Nguyễn Thị Hoàng Quỳnh",
  "Thắng (Đ)": "Nguyễn Viết Thắng", "Tú": "Nguyễn Thị Ngọc Tú", "Dũng": "Lê Công Dũng",
  "Oanh": "Lê Ngọc Oanh", "Sự": "Nguyễn Công Sự", "Triều": "Phạm Ngọc Triều",
  "Tuấn (TD)": "Hồ Anh Tuấn", "Tú (TD)": "Huỳnh Thanh Tú", "Đại": "Nguyễn Văn Đại",
  "Tam": "Tam Bou Branh", "Dung": "Phạm Thị Dung", "Hải": "Nguyễn Thị Minh Hải",
  "Nhung": "Lê Thị Hồng Nhung", "Phương": "Lê Thị Phương", "Sáng": "Phạm Quang Sáng",
  "Thuận": "Trần Thị Thuận", "Bảo (CD)": "Khương Văn Bảo", "Tuyết (CD)": "Vương Thị Tuyết",
  "Đại (CD)": "Võ Ngọc Đại", "Hòa": "Phan Thị Hòa", "Đạt": "Ngô Văn Tiến Đạt"
};

const getFullTeacherName = (name) => {
  if (!name) return '';
  const trimmed = String(name).trim();
  return TEACHER_FULL_MAP[trimmed] || trimmed;
};

const normalizeClassCode = (cls) => {
  if (!cls) return '';
  const clean = String(cls).trim().toUpperCase();
  const match = clean.match(/^(\d{2}A)(\d{1,2})$/);
  if (match) {
    const prefix = match[1];
    const num = match[2].padStart(2, '0');
    return `${prefix}${num}`;
  }
  return clean;
};

const processRawTimetableItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    ...item,
    student_class: normalizeClassCode(item.student_class),
    teacher_name: getFullTeacherName(item.teacher_name)
  }));
};

export default function PublicSchedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeMainTab, setActiveMainTab] = useState('bgh_schedule');
  
  // 35-Week Generator for 2026-2027
  const schoolWeeks = getSchoolWeeks2026();
  const [selectedWeekNo, setSelectedWeekNo] = useState(1);

  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('10A01');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize state from URL params
  useEffect(() => {
    document.title = "Lịch Công Tác & Thời Khóa Biểu | THPT Cao Bá Quát - Phường Tân An - Tỉnh Đắk Lắk";
    const tabParam = searchParams.get('tab');
    const classParam = searchParams.get('class');
    const teacherParam = searchParams.get('teacher');
    const weekParam = searchParams.get('week');

    if (tabParam && ['bgh_schedule', 'class_tkb', 'teacher_tkb'].includes(tabParam)) {
      setActiveMainTab(tabParam);
    }
    if (classParam) {
      setSelectedClass(normalizeClassCode(classParam));
    }
    if (teacherParam) {
      setSelectedTeacher(getFullTeacherName(teacherParam));
    }
    if (weekParam && Number(weekParam) >= 1 && Number(weekParam) <= 35) {
      setSelectedWeekNo(Number(weekParam));
    }
  }, [searchParams]);

  // Sync state to URL search params
  const updateUrlParams = (tab, cls, teacher, week) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (tab === 'class_tkb' && cls) params.set('class', cls);
    if (tab === 'teacher_tkb' && teacher) params.set('teacher', teacher);
    if (week) params.set('week', week);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    fetchSchedules();
    fetchTimetableData();
  }, []);

  async function fetchSchedules() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_schedules')
        .select('*')
        .eq('is_active', true)
        .order('week_number', { ascending: true });

      if (!error && data && data.length > 0) {
        setSchedules(data);
      }
    } catch (err) {
      console.warn("Dùng lịch công tác mặc định:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectWeekNo = (wNo) => {
    const wNum = Number(wNo) || 1;
    setSelectedWeekNo(wNum);
    updateUrlParams(activeMainTab, selectedClass, selectedTeacher, wNum);
  };

  // Get current active schedule object for selected week
  const getCurrentScheduleObj = () => {
    const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
    const foundInDb = schedules.find(s => Number(s.week_number) === selectedWeekNo);

    if (foundInDb) {
      return {
        ...targetWeek,
        ...foundInDb,
        day_items: foundInDb.day_items || foundInDb.schedule_items || []
      };
    }

    return {
      ...targetWeek,
      note: '*Lưu ý: - Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, các bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo lãnh đạo trường để thực hiện./.',
      recipients: 'Nơi nhận:\n- GV, NV (để t/h);\n- Các Tổ chuyên môn thuộc trường;\n- HT, các PHT;\n- Đăng Web, Zalo;\n- Lưu: VT, TK.',
      signer_name: 'Lê Thị Thảo',
      signer_title: 'HIỆU TRƯỜNG',
      day_items: []
    };
  };

  const handleExportPublicWordDecree30 = () => {
    const sched = getCurrentScheduleObj();
    exportScheduleToWordDecree30(sched);
  };

  async function fetchTimetableData() {
    try {
      const { data, error } = await supabase.from('cbq_timetable_items').select('*');
      if (!error && data && data.length > 0) {
        const cleaned = processRawTimetableItems(data);
        setTimetableData(cleaned);
        localStorage.setItem('cbq_master_timetable', JSON.stringify({
          data: cleaned,
          timestamp: Date.now()
        }));
      } else {
        loadTimetableFromCacheOrMaster();
      }
    } catch (err) {
      loadTimetableFromCacheOrMaster();
    }
  }

  function loadTimetableFromCacheOrMaster() {
    const cached = localStorage.getItem('cbq_master_timetable');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        let cachedData = parsed;
        
        // Format mới có timestamp
        if (parsed && !Array.isArray(parsed) && parsed.data) {
          cachedData = parsed.data;
          const isOld = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
          if (isOld) {
            console.warn("Dữ liệu TKB trong máy đã cũ hơn 24 giờ. Đang dùng tạm.");
          }
        }

        if (Array.isArray(cachedData) && cachedData.length > 0) {
          setTimetableData(processRawTimetableItems(cachedData));
          return;
        }
      } catch(e) {
        console.error("Lỗi parse cache", e);
      }
    }
    
    // Fallback JSON cuối cùng
    const masterCleaned = processRawTimetableItems(masterTimetableData);
    setTimetableData(masterCleaned);
    localStorage.setItem('cbq_master_timetable', JSON.stringify({
      data: masterCleaned,
      timestamp: Date.now()
    }));
  }

  const availableClasses = Array.from(new Set(timetableData.map(t => t.student_class))).filter(Boolean).sort();
  const availableTeachers = Array.from(new Set(timetableData.map(t => getFullTeacherName(t.teacher_name)))).filter(Boolean).sort();

  useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.includes(selectedClass)) {
      setSelectedClass(availableClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  useEffect(() => {
    if (availableTeachers.length > 0 && (!selectedTeacher || !availableTeachers.includes(selectedTeacher))) {
      // Try to find if selectedTeacher is a short code mapped to full name
      const full = getFullTeacherName(selectedTeacher);
      if (availableTeachers.includes(full)) {
        setSelectedTeacher(full);
      } else if (!availableTeachers.includes(selectedTeacher)) {
        setSelectedTeacher(availableTeachers[0]);
      }
    }
  }, [availableTeachers, selectedTeacher]);

  const handlePrint = () => window.print();

  const getLessonForClass = (day, period) => timetableData.find(t => t.student_class === selectedClass && t.day_of_week === day && Number(t.period) === period);
  const getLessonForTeacher = (day, period) => timetableData.find(t => getFullTeacherName(t.teacher_name) === selectedTeacher && t.day_of_week === day && Number(t.period) === period);

  const handleExportClassTkbExcel = () => {
    const matrixData = [
      { "Tiết / Ngày": "TRƯỜNG THPT CAO BÁ QUÁT", "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" },
      { "Tiết / Ngày": `THỜI KHÓA BIỂU LỚP ${selectedClass}`, "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" },
      { "Tiết / Ngày": "Năm học: 2026 - 2027 • Áp dụng từ ngày 01/09/2026", "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" },
      { "Tiết / Ngày": "", "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" }
    ];

    const periods = [
      { label: '=== CA SÁNG ===', isHeader: true },
      1, 2, 3, 4, 5,
      { label: '=== CA CHIỀU ===', isHeader: true },
      6, 7, 8, 9, 10
    ];

    periods.forEach(p => {
      if (p.isHeader) {
        matrixData.push({ "Tiết / Ngày": p.label, "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" });
      } else {
        const row = { "Tiết / Ngày": `Tiết ${p}` };
        DAYS.forEach(d => {
          const item = getLessonForClass(d, p);
          row[d] = item ? `${item.subject} (${item.teacher_name})` : '-';
        });
        matrixData.push(row);
      }
    });

    const ws = XLSX.utils.json_to_sheet(matrixData);
    ws['!cols'] = [
      { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `TKB_Lop_${selectedClass}`);
    XLSX.writeFile(wb, `ThoiKhoaBieu_Lop_${selectedClass}_2026_2027.xlsx`);
  };

  const handleExportTeacherTkbExcel = () => {
    const matrixData = [
      { "Tiết / Ngày": "TRƯỜNG THPT CAO BÁ QUÁT", "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" },
      { "Tiết / Ngày": `THỜI KHÓA BIỂU CÁ NHÂN GIÁO VIÊN: ${selectedTeacher.toUpperCase()}`, "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" },
      { "Tiết / Ngày": "Năm học: 2026 - 2027 • Áp dụng từ ngày 01/09/2026", "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" },
      { "Tiết / Ngày": "", "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" }
    ];

    const periods = [
      { label: '=== CA SÁNG ===', isHeader: true },
      1, 2, 3, 4, 5,
      { label: '=== CA CHIỀU ===', isHeader: true },
      6, 7, 8, 9, 10
    ];

    periods.forEach(p => {
      if (p.isHeader) {
        matrixData.push({ "Tiết / Ngày": p.label, "Thứ 2": "", "Thứ 3": "", "Thứ 4": "", "Thứ 5": "", "Thứ 6": "", "Thứ 7": "" });
      } else {
        const row = { "Tiết / Ngày": `Tiết ${p}` };
        DAYS.forEach(d => {
          const item = getLessonForTeacher(d, p);
          row[d] = item ? `${item.subject} (${item.student_class})` : '-';
        });
        matrixData.push(row);
      }
    });

    const ws = XLSX.utils.json_to_sheet(matrixData);
    ws['!cols'] = [
      { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `TKB_${selectedTeacher}`);
    XLSX.writeFile(wb, `ThoiKhoaBieu_GV_${selectedTeacher.replace(/\s+/g, '_')}_2026_2027.xlsx`);
  };

  const handleTabChange = (tab) => {
    setActiveMainTab(tab);
    updateUrlParams(tab, selectedClass, selectedTeacher);
  };

  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    updateUrlParams(activeMainTab, newClass, selectedTeacher);
  };

  const handleTeacherChange = (newTeacher) => {
    setSelectedTeacher(newTeacher);
    updateUrlParams(activeMainTab, selectedClass, newTeacher);
  };

  return (
    <div style={styles.container}>
      <style>{`
        .print-only { display: none !important; }
        @media print { 
          header, nav, footer, .no-print { display: none !important; } 
          .print-only { display: block !important; }
          .print-full { width: 100% !important; margin: 0 !important; border: none !important; box-shadow: none !important; padding: 0 !important; } 
          table { width: 100% !important; border-collapse: collapse !important; margin-top: 10px !important; }
          th, td { border: 1px solid #1e293b !important; padding: 6px 8px !important; font-size: 12px !important; }
          th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div style={styles.headerCard} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={32} color="#be123c" />
          <div>
            <h2 style={styles.pageTitle}>TRA CỨU LỊCH CÔNG TÁC & THỜI KHÓA BIỂU</h2>
            <p style={styles.pageSubtitle}>Trường THPT Cao Bá Quát • Hệ thống quản lý điều hành ({timetableData.length} tiết đã nạp)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '15px' }}>
          {['bgh_schedule', 'class_tkb', 'teacher_tkb'].map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)} style={{ ...styles.tabBtn, backgroundColor: activeMainTab === tab ? '#be123c' : '#f1f5f9', color: activeMainTab === tab ? '#fff' : '#334' }}>
              {tab === 'bgh_schedule' ? '📅 Lịch BGH' : tab === 'class_tkb' ? '🎓 TKB Lớp' : '👨‍🏫 TKB Giáo viên'}
            </button>
          ))}
        </div>
      </div>

      {activeMainTab === 'bgh_schedule' && (
        <div style={styles.sheetCard} className="print-full">
          
          {/* WEEK SELECTOR & ACTIONS BAR */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>Chọn Tuần Học (1 - 35):</span>
              <select
                value={selectedWeekNo}
                onChange={e => handleSelectWeekNo(Number(e.target.value))}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '2px solid #be123c', fontWeight: 'bold', fontSize: '14px', color: '#be123c', background: '#ffffff', cursor: 'pointer' }}
              >
                {schoolWeeks.map(w => (
                  <option key={w.week_number} value={w.week_number}>
                    Tuần {w.roman} ({w.week_number}) - {w.date_range_str}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportPublicWordDecree30}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                📄 Tải File Word (Nghị định 30)
              </button>
              
              <button
                type="button"
                onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                <Printer size={16} /> In Lịch / PDF (A4)
              </button>
            </div>
          </div>

          {/* OFFICIAL DECREE 30 SCHEDULE VIEW (MATCHING EXPLICIT TEMPLATE) */}
          {(() => {
            const currentSched = getCurrentScheduleObj();
            const dayRows = currentSched.day_items && currentSched.day_items.length > 0
              ? currentSched.day_items
              : getDefaultScheduleDays(schoolWeeks[selectedWeekNo - 1]);

            // Group items by day
            const groupedDays = [];
            const map = new Map();

            dayRows.forEach(item => {
              const key = `${item.day_name}_${item.date_str}`;
              if (!map.has(key)) {
                const dayObj = { day_name: item.day_name, date_str: item.date_str, sessions: [] };
                map.set(key, dayObj);
                groupedDays.push(dayObj);
              }
              map.get(key).sessions.push(item);
            });

            return (
              <div style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000000', padding: '20px 10px' }}>
                
                {/* DECREE 30 HEADER */}
                <table style={{ width: '100%', border: 'none', borderCollapse: 'collapse', marginBottom: '15px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
                        <div style={{ fontSize: '12pt' }}>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</div>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                        <div style={{ borderBottom: '1px solid #000', width: '130px', margin: '3px auto 0 auto' }}></div>
                      </td>
                      <td style={{ width: '55%', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div style={{ fontSize: '12.5pt', fontWeight: 'bold' }}>Độc lập - Tự do - Hạnh phúc</div>
                        <div style={{ borderBottom: '1px solid #000', width: '160px', margin: '3px auto 0 auto' }}></div>
                        <div style={{ fontSize: '12pt', fontStyle: 'italic', marginTop: '8px' }}>
                          {currentSched.release_date_str || 'Tân An ngày 06 tháng 9 năm 2026'}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* DOCUMENT TITLE */}
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {currentSched.title || `LỊCH CÔNG TÁC TUẦN ${ROMAN_NUMERALS[selectedWeekNo - 1]} - NĂM HỌC 2026-2027`}
                  </div>
                  <div style={{ fontSize: '13pt', fontStyle: 'italic', fontWeight: 'bold', marginTop: '4px' }}>
                    {currentSched.subtitle || `(${currentSched.date_range_str})`}
                  </div>
                </div>

                {/* MAIN TABLE */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11.5pt' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #000' }}>
                      <th style={{ border: '1px solid #000', padding: '8px', width: '22%' }} colSpan={2}>Thời gian</th>
                      <th style={{ border: '1px solid #000', padding: '8px', width: '44%', textAlign: 'center' }}>Nội dung</th>
                      <th style={{ border: '1px solid #000', padding: '8px', width: '17%', textAlign: 'center' }}>Địa điểm</th>
                      <th style={{ border: '1px solid #000', padding: '8px', width: '17%', textAlign: 'center' }}>Thành phần</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedDays.map((day, dIdx) => {
                      const rowSpan = day.sessions.length || 1;
                      return day.sessions.map((s, sIdx) => (
                        <tr key={`${dIdx}-${sIdx}`}>
                          {sIdx === 0 && (
                            <td 
                              rowSpan={rowSpan} 
                              style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', width: '14%' }}
                            >
                              <div>{day.day_name}</div>
                              <div>{day.date_str}</div>
                            </td>
                          )}

                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', verticalAlign: 'top', width: '8%' }}>
                            {s.session}
                          </td>

                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'pre-line', width: '44%' }}>
                            {s.content}
                          </td>

                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'pre-line', width: '17%' }}>
                            {s.location}
                          </td>

                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'pre-line', width: '17%' }}>
                            {s.participants}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>

                {/* NOTES BLOCK */}
                <div style={{ fontSize: '12pt', marginTop: '12px', marginBottom: '20px', lineHeight: '1.4' }}>
                  <strong>*<u>Lưu ý</u>:</strong> {(currentSched.note || '*Lưu ý: - Văn phòng chuẩn bị phòng họp...').replace(/^\*Lưu ý:\s*/i, '')}
                </div>

                {/* SIGNATURE FOOTER */}
                <table style={{ width: '100%', border: 'none', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%', textAlign: 'left', verticalAlign: 'top', border: 'none', padding: 0 }}>
                        <div style={{ fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic' }}>Nơi nhận:</div>
                        <div style={{ fontSize: '11pt', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                          {(currentSched.recipients || 'Nơi nhận:\n- GV, NV (để t/h);...').replace(/^Nơi nhận:\s*/i, '')}
                        </div>
                      </td>
                      <td style={{ width: '55%', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {currentSched.signer_title || 'HIỆU TRƯỜNG'}
                        </div>
                        <div style={{ fontSize: '11pt', fontStyle: 'italic' }}>(Ký, đóng dấu và ghi rõ họ tên)</div>
                        <div style={{ height: '65px' }}></div>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>
                          {currentSched.signer_name || 'Lê Thị Thảo'}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            );
          })()}

        </div>
      )}

      {(activeMainTab === 'class_tkb' || activeMainTab === 'teacher_tkb') && (
        <div style={styles.sheetCard} className="print-full">
          {/* Official Print Header */}
          <div className="print-only" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>--------------------</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', fontStyle: 'italic', color: '#334155' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>--------------------</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <h2 style={{ margin: '4px 0', fontSize: '18px', fontWeight: '900', color: '#be123c', textTransform: 'uppercase' }}>
                {activeMainTab === 'class_tkb' ? `THỜI KHÓA BIỂU LỚP ${selectedClass}` : `THỜI KHÓA BIỂU CÁ NHÂN GIÁO VIÊN`}
              </h2>
              {activeMainTab === 'teacher_tkb' && (
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                  Giáo viên: {selectedTeacher}
                </div>
              )}
              <div style={{ fontSize: '11.5px', fontStyle: 'italic', color: '#475569' }}>
                Áp dụng Học kỳ I • Năm học 2026 - 2027
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }} className="no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#1e293b' }}>
                {activeMainTab === 'class_tkb' ? 'Chọn Lớp:' : 'Chọn Giáo Viên:'}
              </span>
              {activeMainTab === 'class_tkb' ? (
                <select value={selectedClass} onChange={e => handleClassChange(e.target.value)} style={styles.select}>
                  {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <select value={selectedTeacher} onChange={e => handleTeacherChange(e.target.value)} style={styles.select}>
                  {availableTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={activeMainTab === 'class_tkb' ? handleExportClassTkbExcel : handleExportTeacherTkbExcel}
                style={{ ...styles.printBtn, backgroundColor: '#15803d' }}
              >
                <FileSpreadsheet size={16} /> Xuất Excel
              </button>
              <button onClick={handlePrint} style={styles.printBtn}><Printer size={16} /> In TKB</button>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={{ ...styles.th, width: '70px', textAlign: 'center' }}>Tiết</th>
                {DAYS.map(h => <th key={h} style={styles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: '--- SÁNG ---', isHeader: true },
                1, 2, 3, 4, 5,
                { label: '--- CHIỀU ---', isHeader: true },
                6, 7, 8, 9, 10
              ].map((p, idx) => {
                if (p.isHeader) {
                  return (
                    <tr key={`h-${idx}`} style={{ backgroundColor: '#f8fafc' }}>
                      <td colSpan={7} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textAlign: 'center', letterSpacing: '1px' }}>
                        {p.label}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={p} style={styles.tableRow}>
                    <td style={{ ...styles.td, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fdf2f8' }}>
                      Tiết {p}
                    </td>
                    {DAYS.map(d => {
                      const item = activeMainTab === 'class_tkb'
                        ? getLessonForClass(d, p)
                        : getLessonForTeacher(d, p);

                      if (!item) return <td key={d} style={{ ...styles.td, color: '#94a3b8', textAlign: 'center' }}>-</td>;

                      return (
                        <td key={d} style={styles.td}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>
                            {item.subject}
                          </div>
                          <div style={{ fontSize: '11px', color: activeMainTab === 'class_tkb' ? '#2563eb' : '#059669', marginTop: '2px', fontWeight: '600' }}>
                            {activeMainTab === 'class_tkb' ? item.teacher_name : `Lớp ${item.student_class}`}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Official Print Signatures */}
          <div className="print-only" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '0 40px', fontSize: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>BAN GIÁM HIỆU DUYỆT</div>
              <div style={{ height: '50px' }}></div>
              <div style={{ fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>NGƯỜI LẬP BẢNG / GIÁO VIÊN</div>
              <div style={{ height: '50px' }}></div>
              <div style={{ fontStyle: 'italic' }}>{selectedTeacher || 'Giáo viên'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 10px',
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#be123c',
    letterSpacing: '0.5px'
  },
  pageSubtitle: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  tabBtn: {
    padding: '9px 16px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer'
  },
  select: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontWeight: 'bold',
    fontSize: '13.5px',
    outline: 'none'
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#be123c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer'
  },
  sheetCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0'
  },
  sheetHeader: {
    textAlign: 'center',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '15px',
    marginBottom: '15px'
  },
  dutyBox: {
    display: 'flex',
    justify: 'space-around',
    backgroundColor: '#fff1f2',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #fecdd3',
    marginBottom: '15px'
  },
  dutyItem: {
    fontSize: '13px'
  },
  dutyLabel: {
    fontWeight: 'bold',
    color: '#be123c',
    marginRight: '6px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13.5px'
  },
  tableHeadRow: {
    backgroundColor: '#1e293b',
    color: '#ffffff'
  },
  th: {
    padding: '12px 10px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0'
  },
  td: {
    padding: '12px 10px',
    verticalAlign: 'top'
  },
  noteBox: {
    marginTop: '20px',
    padding: '12px 16px',
    backgroundColor: '#fefce8',
    border: '1px solid #fef08a',
    borderRadius: '10px',
    color: '#854d0e',
    fontSize: '13.5px'
  }
};
