import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Calendar, Clock, MapPin, Printer, FileSpreadsheet, Share2, Check, Download, Link as LinkIcon, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import masterTimetableData from '../data/master_timetable.json';
import { 
  getSchoolWeeks2026, 
  getSchoolMonths2026,
  getDefaultScheduleDays, 
  exportScheduleToWordDecree30, 
  exportMultipleSchedulesToWordDecree30, 
  getScheduleDataForWeek, 
  aggregateMonthlyPlanFromWeeks,
  aggregateYearlyPlanFromMonths,
  exportMonthlyPlanToWordDecree30,
  exportYearlyPlanToWordDecree30,
  formatWeekTitle
} from '../utils/decree30ScheduleWord';

const DEFAULT_SCHEDULE = {
  title: 'LỊCH CÔNG TÁC TUẦN 01 - NĂM HỌC 2026-2027',
  week_number: 1,
  start_date: '2026-09-01',
  end_date: '2026-09-07',
  bgh_duty: 'Thầy Lê Văn A - Hiệu trưởng (Trực chính)',
  teacher_duty: 'Cô Nguyễn Thị B - Tổ trưởng Tổ Ngữ văn (Trực ban)',
  day_items: [
    { day_name: "Thứ 2", date_str: "01/09", session: "Sáng", content: "Chào cờ toàn trường & Quán triệt công tác chuẩn bị năm học mới", location: "Sân trường", participants: "Toàn thể GV & HS" },
    { day_name: "Thứ 2", date_str: "01/09", session: "Chiều", content: "Họp Hội đồng Sư phạm mở rộng triển khai kế hoạch năm học", location: "Phòng Hội đồng", participants: "Toàn thể Cán bộ Giáo viên" },
    { day_name: "Thứ Ba", date_str: "02/09", session: "Sáng", content: "Nghỉ lễ Quốc Khánh 2/9", location: "-", participants: "Toàn trường" },
    { day_name: "Thứ Sáu", date_str: "05/09", session: "Sáng", content: "LỄ KHAI GIẢNG NĂM HỌC MỚI 2026 - 2027", location: "Sân trường", participants: "Toàn thể GV & Học sinh" }
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
  
  // 35-Week & Month/Year Plan Generators for 2026-2027
  const schoolWeeks = getSchoolWeeks2026();
  const schoolMonths = getSchoolMonths2026();
  const [scheduleViewMode, setScheduleViewMode] = useState('week'); // 'week' | 'month' | 'year'
  const [selectedWeekNo, setSelectedWeekNo] = useState(1);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState('single');
  const [fromWeek, setFromWeek] = useState(1);
  const [toWeek, setToWeek] = useState(35);

  const [schedules, setSchedules] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('10A01');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  // Initialize state from URL params
  useEffect(() => {
    document.title = "Lịch Công Tác & Thời Khóa Biểu | THPT Cao Bá Quát - Phường Tân An - Tỉnh Đắc Lắc";
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

  const handleCopyAdminLink = () => {
    const editUrl = `${window.location.origin}/nhap-lich-bgh?week=${selectedWeekNo}`;
    navigator.clipboard.writeText(editUrl).then(() => {
      setCopiedAdminLink(true);
      setTimeout(() => setCopiedAdminLink(false), 2500);
    });
  };

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/lich-cong-tac?week=${selectedWeekNo}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 2500);
    });
  };

  // Get current active schedule object for selected week
  const getCurrentScheduleObj = () => {
    const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
    const foundInDb = schedules.find(s => Number(s.week_number) === selectedWeekNo);

    if (foundInDb) {
      return {
        ...targetWeek,
        ...foundInDb,
        title: formatWeekTitle(foundInDb.title || targetWeek.title, selectedWeekNo),
        day_items: foundInDb.day_items || foundInDb.schedule_items || getDefaultScheduleDays(targetWeek)
      };
    }

    return {
      ...targetWeek,
      title: formatWeekTitle(targetWeek.title, selectedWeekNo),
      note: '*Lưu ý: - Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, các bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo lãnh đạo trường để thực hiện./.',
      recipients: 'Nơi nhận:\n- GV, NV (để t/h);\n- Các Tổ chuyên môn thuộc trường;\n- HT, các PHT;\n- Đăng Web, Zalo;\n- Lưu: VT, TK.',
      signer_name: 'Lê Thị Thảo',
      signer_title: 'HIỆU TRƯỜNG',
      day_items: getDefaultScheduleDays(targetWeek)
    };
  };

  const handleExportPublicWordDecree30 = () => {
    const sched = getCurrentScheduleObj();
    exportScheduleToWordDecree30(sched);
  };

  const handleExecutePublicExport = () => {
    if (exportMode === 'single') {
      handleExportPublicWordDecree30();
      setShowExportModal(false);
      return;
    }

    if (exportMode === 'month') {
      handleExportMonthlyPlan();
      setShowExportModal(false);
      return;
    }

    if (exportMode === 'year') {
      handleExportYearlyPlan();
      setShowExportModal(false);
      return;
    }

    let targetRange = [];
    let customName = '';

    if (exportMode === 'all35') {
      for (let w = 1; w <= 35; w++) targetRange.push(w);
      customName = `Lich_Cong_Tac_Full_35_Tuan_THPT_CaoBaQuat.doc`;
    } else if (exportMode === 'term1') {
      for (let w = 1; w <= 18; w++) targetRange.push(w);
      customName = `Lich_Cong_Tac_Hoc_Ky_I_Tu_Tuan_1_den_18_THPT_CaoBaQuat.doc`;
    } else if (exportMode === 'term2') {
      for (let w = 19; w <= 35; w++) targetRange.push(w);
      customName = `Lich_Cong_Tac_Hoc_Ky_II_Tu_Tuan_19_den_35_THPT_CaoBaQuat.doc`;
    } else if (exportMode === 'custom') {
      const start = Math.min(Number(fromWeek), Number(toWeek));
      const end = Math.max(Number(fromWeek), Number(toWeek));
      for (let w = start; w <= end; w++) targetRange.push(w);
      customName = `Lich_Cong_Tac_Tu_Tuan_${start}_den_Tuan_${end}_THPT_CaoBaQuat.doc`;
    }

    const list = targetRange.map(wNo => getScheduleDataForWeek(wNo, schedules));
    exportMultipleSchedulesToWordDecree30(list, customName);
    setShowExportModal(false);
  };

  const handleExportMonthlyPlan = () => {
    const mData = aggregateMonthlyPlanFromWeeks(selectedMonthIdx + 1, schoolWeeks, schedules);
    exportMonthlyPlanToWordDecree30(mData);
  };

  const handleExportYearlyPlan = () => {
    const yData = aggregateYearlyPlanFromMonths(schoolWeeks, schedules);
    exportYearlyPlanToWordDecree30(yData);
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
        if (parsed && !Array.isArray(parsed) && parsed.data) {
          cachedData = parsed.data;
        }
        if (Array.isArray(cachedData) && cachedData.length > 0) {
          setTimetableData(processRawTimetableItems(cachedData));
          return;
        }
      } catch(e) {
        console.error("Lỗi parse cache", e);
      }
    }
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
    updateUrlParams(tab, selectedClass, selectedTeacher, selectedWeekNo);
  };

  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    updateUrlParams(activeMainTab, newClass, selectedTeacher, selectedWeekNo);
  };

  const handleTeacherChange = (newTeacher) => {
    setSelectedTeacher(newTeacher);
    updateUrlParams(activeMainTab, selectedClass, newTeacher, selectedWeekNo);
  };

  const currentSched = getCurrentScheduleObj();
  const currentMonthData = aggregateMonthlyPlanFromWeeks(selectedMonthIdx + 1, schoolWeeks, schedules);
  const currentYearData = aggregateYearlyPlanFromMonths(schoolWeeks, schedules);

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

      {/* HEADER TOP CARD */}
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
              {tab === 'bgh_schedule' ? '📅 Lịch Công Tác BGH' : tab === 'class_tkb' ? '🎓 TKB Lớp' : '👨‍🏫 TKB Giáo viên'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: BGH SCHEDULE (WEEK / MONTH / YEAR VIEWS) */}
      {activeMainTab === 'bgh_schedule' && (
        <div style={styles.sheetCard} className="print-full">
          
          {/* VIEW MODE SWITCHER BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f1f5f9' }} className="no-print">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setScheduleViewMode('week')} 
                style={{ ...styles.tabBtn, backgroundColor: scheduleViewMode === 'week' ? '#0284c7' : '#e0f2fe', color: scheduleViewMode === 'week' ? '#ffffff' : '#0369a1' }}
              >
                📅 Lịch Tuần (35 Tuần)
              </button>
              <button 
                onClick={() => setScheduleViewMode('month')} 
                style={{ ...styles.tabBtn, backgroundColor: scheduleViewMode === 'month' ? '#0284c7' : '#e0f2fe', color: scheduleViewMode === 'month' ? '#ffffff' : '#0369a1' }}
              >
                🗓️ Kế Hoạch Tháng (Từ Tuần Suy Ra)
              </button>
              <button 
                onClick={() => setScheduleViewMode('year')} 
                style={{ ...styles.tabBtn, backgroundColor: scheduleViewMode === 'year' ? '#0284c7' : '#e0f2fe', color: scheduleViewMode === 'year' ? '#ffffff' : '#0369a1' }}
              >
                🏛️ Kế Hoạch Năm Học 2026 - 2027
              </button>
            </div>

            {/* ACTION BUTTONS ACCORDING TO VIEW MODE */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {scheduleViewMode === 'week' && (
                <>
                  <button onClick={() => setShowExportModal(true)} style={{ ...styles.printBtn, backgroundColor: '#0284c7' }}>
                    <Download size={16} /> 📄 Xuất File Word (NĐ 30)
                  </button>
                  <button onClick={handleCopyPublicLink} style={{ ...styles.printBtn, backgroundColor: '#059669' }}>
                    {copiedPublicLink ? <Check size={16} /> : <Share2 size={16} />}
                    {copiedPublicLink ? 'Đã sao chép link!' : `🔗 Chia Sẻ Link Tuần ${selectedWeekNo}`}
                  </button>
                </>
              )}

              {scheduleViewMode === 'month' && (
                <button onClick={handleExportMonthlyPlan} style={{ ...styles.printBtn, backgroundColor: '#0284c7' }}>
                  <Download size={16} /> 📄 Xuất Kế Hoạch Tháng Word (NĐ 30)
                </button>
              )}

              {scheduleViewMode === 'year' && (
                <button onClick={handleExportYearlyPlan} style={{ ...styles.printBtn, backgroundColor: '#0284c7' }}>
                  <Download size={16} /> 📄 Xuất Kế Hoạch Năm Word (NĐ 30)
                </button>
              )}

              <button onClick={handlePrint} style={styles.printBtn}>
                <Printer size={16} /> In Văn Bản
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: WEEK VIEW */}
          {scheduleViewMode === 'week' && (
            <div>
              {/* WEEK SELECTOR DROPDOWN */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }} className="no-print">
                <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>Chọn Tuần Học (Năm học 2026 - 2027):</span>
                <select 
                  value={selectedWeekNo} 
                  onChange={e => handleSelectWeekNo(e.target.value)}
                  style={{ ...styles.select, padding: '9px 16px', fontSize: '14px', border: '1.5px solid #0284c7', color: '#0369a1' }}
                >
                  {schoolWeeks.map(w => (
                    <option key={w.week_number} value={w.week_number}>
                      Tuần {String(w.week_number).padStart(2, '0')} ({w.date_range_str})
                    </option>
                  ))}
                </select>
              </div>

              {/* OFFICIAL DECREE 30 HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <div style={{ textAlign: 'center', minWidth: '220px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                  <div style={{ width: '80px', height: '1px', backgroundColor: '#0f172a', margin: '4px auto 0 auto' }}></div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '260px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', fontStyle: 'italic', color: '#334155' }}>Độc lập - Tự do - Hạnh phúc</div>
                  <div style={{ width: '110px', height: '1px', backgroundColor: '#0f172a', margin: '4px auto 0 auto' }}></div>
                  <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b', marginTop: '6px' }}>{currentSched.release_date_str}</div>
                </div>
              </div>

              {/* TITLE & SUBTITLE */}
              <div style={{ textAlign: 'center', margin: '15px 0 20px 0' }}>
                <h2 style={{ margin: '4px 0', fontSize: '20px', fontWeight: '900', color: '#be123c', textTransform: 'uppercase' }}>
                  {formatWeekTitle(currentSched.title, selectedWeekNo)}
                </h2>
                <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#475569', fontWeight: '600' }}>
                  {currentSched.subtitle || currentSched.date_range_str}
                </div>
              </div>

              {/* DUTY OFFICERS BOX */}
              {(currentSched.bgh_duty || currentSched.teacher_duty) && (
                <div style={styles.dutyBox}>
                  {currentSched.bgh_duty && <div style={styles.dutyItem}><span style={styles.dutyLabel}>BGH Trực:</span> {currentSched.bgh_duty}</div>}
                  {currentSched.teacher_duty && <div style={styles.dutyItem}><span style={styles.dutyLabel}>GV Trực ban:</span> {currentSched.teacher_duty}</div>}
                </div>
              )}

              {/* SCHEDULE TABLE */}
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={{ ...styles.th, width: '12%', textAlign: 'center' }}>Thứ / Ngày</th>
                    <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>Buổi</th>
                    <th style={{ ...styles.th, width: '45%' }}>Nội dung công việc</th>
                    <th style={{ ...styles.th, width: '17.5%' }}>Địa điểm</th>
                    <th style={{ ...styles.th, width: '17.5%' }}>Thành phần / Trực</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentSched.day_items || []).length > 0 ? (
                    currentSched.day_items.map((item, idx) => {
                      const isFirstSession = idx % 2 === 0;
                      return (
                        <tr key={idx} style={styles.tableRow}>
                          {isFirstSession && (
                            <td 
                              rowSpan={2} 
                              style={{ ...styles.td, fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#f8fafc', color: '#be123c', width: '12%' }}
                            >
                              <div>{item.day_name}</div>
                              <div style={{ fontSize: '12.5px', color: '#0f172a', marginTop: '2px' }}>{item.date_str}</div>
                            </td>
                          )}

                          <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: item.session === 'Sáng' ? '#0369a1' : '#b45309' }}>
                            {item.session}
                          </td>

                          <td style={{ ...styles.td, whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                            {item.content || '-'}
                          </td>

                          <td style={{ ...styles.td, whiteSpace: 'pre-line', color: '#334155' }}>
                            {item.location || '-'}
                          </td>

                          <td style={{ ...styles.td, whiteSpace: 'pre-line', color: '#334155' }}>
                            {item.participants || '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                        Chưa có dữ liệu chi tiết cho tuần này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* NOTE & FOOTER */}
              <div style={styles.noteBox}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>*Lưu ý:</div>
                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{currentSched.note ? currentSched.note.replace(/^\*Lưu ý:\s*/i, '') : 'Văn phòng chuẩn bị phòng họp, thiết bị âm thanh.'}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '0 20px', fontSize: '13px' }}>
                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.4', color: '#475569' }}>
                  {currentSched.recipients || "Nơi nhận:\n- GV, NV (để t/h);\n- Đăng Web, Zalo;\n- Lưu: VT."}
                </div>
                <div style={{ textAlign: 'center', minWidth: '200px' }}>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a' }}>{currentSched.signer_title || 'HIỆU TRƯỜNG'}</div>
                  <div style={{ height: '60px' }}></div>
                  <div style={{ fontWeight: 'bold', color: '#be123c', fontSize: '14px' }}>{currentSched.signer_name || 'Lê Thị Thảo'}</div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: MONTH VIEW */}
          {scheduleViewMode === 'month' && (
            <div>
              {/* MONTH SELECTOR DROPDOWN */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }} className="no-print">
                <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>Chọn Tháng Kế Hoạch (Năm học 2026 - 2027):</span>
                <select 
                  value={selectedMonthIdx} 
                  onChange={e => setSelectedMonthIdx(Number(e.target.value))}
                  style={{ ...styles.select, padding: '9px 16px', fontSize: '14px', border: '1.5px solid #0284c7', color: '#0369a1' }}
                >
                  {schoolMonths.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m.label} ({m.term})
                    </option>
                  ))}
                </select>
              </div>

              {/* MONTH TITLE */}
              <div style={{ textAlign: 'center', margin: '15px 0 20px 0' }}>
                <h2 style={{ margin: '4px 0', fontSize: '20px', fontWeight: '900', color: '#be123c', textTransform: 'uppercase' }}>
                  {currentMonthData.title}
                </h2>
                <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#475569', fontWeight: '600' }}>
                  {currentMonthData.subtitle}
                </div>
              </div>

              {/* MONTH TABLE */}
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Tuần Học</th>
                    <th style={{ ...styles.th, width: '45%' }}>Nhiệm Vụ & Trọng Tâm Công Tác</th>
                    <th style={{ ...styles.th, width: '17.5%' }}>Địa Điểm</th>
                    <th style={{ ...styles.th, width: '17.5%' }}>Thành Phần / Đơn Vị</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMonthData.weeks.map((w) => {
                    const activeItems = (w.day_items || []).filter(item => item.content && !item.content.includes('Nghỉ'));
                    const contentSummary = activeItems.map(i => `• ${i.day_name} (${i.session}): ${i.content}`).join('\n') || 'Thực hiện nhiệm vụ chuyên môn theo thời khóa biểu.';
                    const locationSummary = Array.from(new Set(activeItems.map(i => i.location).filter(Boolean))).join('\n') || 'Các lớp học & Phòng họp';
                    const participantSummary = Array.from(new Set(activeItems.map(i => i.participants).filter(Boolean))).join('\n') || 'GV & Học sinh toàn trường';

                    return (
                      <tr key={w.week_number} style={styles.tableRow}>
                        <td style={{ ...styles.td, fontWeight: 'bold', textAlign: 'center', verticalAlign: 'top', backgroundColor: '#f8fafc', color: '#be123c' }}>
                          <div>Tuần {String(w.week_number).padStart(2, '0')}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'normal', marginTop: '4px' }}>
                            {w.date_range_str}
                          </div>
                        </td>
                        <td style={{ ...styles.td, whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                          {contentSummary}
                        </td>
                        <td style={{ ...styles.td, whiteSpace: 'pre-line', color: '#334155' }}>
                          {locationSummary}
                        </td>
                        <td style={{ ...styles.td, whiteSpace: 'pre-line', color: '#334155' }}>
                          {participantSummary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW MODE 3: YEAR VIEW */}
          {scheduleViewMode === 'year' && (
            <div>
              {/* YEAR TITLE */}
              <div style={{ textAlign: 'center', margin: '15px 0 20px 0' }}>
                <h2 style={{ margin: '4px 0', fontSize: '20px', fontWeight: '900', color: '#be123c', textTransform: 'uppercase' }}>
                  {currentYearData.title}
                </h2>
                <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#475569', fontWeight: '600' }}>
                  {currentYearData.subtitle}
                </div>
              </div>

              {/* YEAR TABLE */}
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={{ ...styles.th, width: '18%', textAlign: 'center' }}>Tháng</th>
                    <th style={{ ...styles.th, width: '22%', textAlign: 'center' }}>Khung Tuần Học</th>
                    <th style={{ ...styles.th, width: '40%' }}>Tóm Tắt Trọng Tâm Công Tác</th>
                    <th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Chỉ Đạo & Thực Hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {currentYearData.allMonths.map((m, idx) => {
                    const weekCount = m.weeks.length;
                    const weekRangeStr = weekCount > 0 ? `Tuần ${m.weeks[0].week_number} đến Tuần ${m.weeks[weekCount - 1].week_number}` : '';

                    const monthSummary = m.weeks.map(w => {
                      const activeCount = (w.day_items || []).filter(i => i.content && !i.content.includes('Nghỉ')).length;
                      return `• Tuần ${String(w.week_number).padStart(2, '0')}: ${activeCount} mục công việc chính`;
                    }).join('\n');

                    return (
                      <tr key={idx} style={styles.tableRow}>
                        <td style={{ ...styles.td, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc', color: '#be123c' }}>
                          {m.monthLabel}
                        </td>
                        <td style={{ ...styles.td, fontWeight: 'bold', textAlign: 'center', color: '#0369a1' }}>
                          {weekRangeStr}
                        </td>
                        <td style={{ ...styles.td, whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                          {monthSummary}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#334155' }}>
                          BGH & Các Tổ Chuyên Môn
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* TAB 2 & 3: CLASS & TEACHER TIMETABLE */}
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

      {/* MULTI-WEEK / 35-WEEK FLEXIBLE EXPORT MODAL */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '560px', width: '100%', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 TUỲ CHỌN XUẤT FILE WORD (NGHỊ ĐỊNH 30)
              </h3>
              <button type="button" onClick={() => setShowExportModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Chọn phạm vi tuần bạn muốn xuất ra file Word (.doc) theo chuẩn văn bản hành chính Nghị định 30/2020/NĐ-CP:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              
              {/* OPTION 1: SINGLE WEEK */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: exportMode === 'single' ? '2px solid #0284c7' : '1px solid #cbd5e1', backgroundColor: exportMode === 'single' ? '#f0f9ff' : '#ffffff', cursor: 'pointer' }}>
                <input type="radio" name="exportMode" value="single" checked={exportMode === 'single'} onChange={() => setExportMode('single')} />
                <span>📌 <strong>Chỉ xuất Tuần đang chọn</strong> (Tuần {selectedWeekNo})</span>
              </label>

              {/* OPTION 2: ALL 35 WEEKS */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: exportMode === 'all35' ? '2px solid #0284c7' : '1px solid #cbd5e1', backgroundColor: exportMode === 'all35' ? '#f0f9ff' : '#ffffff', cursor: 'pointer' }}>
                <input type="radio" name="exportMode" value="all35" checked={exportMode === 'all35'} onChange={() => setExportMode('all35')} />
                <span>🏆 <strong>Xuất toàn bộ 35 tuần năm học 2026 - 2027</strong> (1 File Word duy nhất)</span>
              </label>

              {/* OPTION 3: TERM I */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: exportMode === 'term1' ? '2px solid #0284c7' : '1px solid #cbd5e1', backgroundColor: exportMode === 'term1' ? '#f0f9ff' : '#ffffff', cursor: 'pointer' }}>
                <input type="radio" name="exportMode" value="term1" checked={exportMode === 'term1'} onChange={() => setExportMode('term1')} />
                <span>📚 <strong>Xuất Học kỳ I</strong> (18 tuần: Tuần 1 đến Tuần 18)</span>
              </label>

              {/* OPTION 4: TERM II */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: exportMode === 'term2' ? '2px solid #0284c7' : '1px solid #cbd5e1', backgroundColor: exportMode === 'term2' ? '#f0f9ff' : '#ffffff', cursor: 'pointer' }}>
                <input type="radio" name="exportMode" value="term2" checked={exportMode === 'term2'} onChange={() => setExportMode('term2')} />
                <span>📚 <strong>Xuất Học kỳ II</strong> (17 tuần: Tuần 19 đến Tuần 35)</span>
              </label>

              {/* OPTION 5: MONTHLY PLAN */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: exportMode === 'month' ? '2px solid #0284c7' : '1px solid #cbd5e1', backgroundColor: exportMode === 'month' ? '#f0f9ff' : '#ffffff', cursor: 'pointer' }}>
                <input type="radio" name="exportMode" value="month" checked={exportMode === 'month'} onChange={() => setExportMode('month')} />
                <span>🗓️ <strong>Xuất Kế Hoạch Tháng</strong> (Tổng hợp các tuần trong tháng của Tuần {selectedWeekNo})</span>
              </label>

              {/* OPTION 6: YEARLY PLAN */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: exportMode === 'year' ? '2px solid #0284c7' : '1px solid #cbd5e1', backgroundColor: exportMode === 'year' ? '#f0f9ff' : '#ffffff', cursor: 'pointer' }}>
                <input type="radio" name="exportMode" value="year" checked={exportMode === 'year'} onChange={() => setExportMode('year')} />
                <span>🏛️ <strong>Xuất Kế Hoạch Năm Học 2026 - 2027</strong> (Tổng hợp 9 tháng học tập)</span>
              </label>

              {/* OPTION 7: CUSTOM RANGE */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: exportMode === 'custom' ? '2px solid #0284c7' : '1px solid #cbd5e1', backgroundColor: exportMode === 'custom' ? '#f0f9ff' : '#ffffff', cursor: 'pointer' }}>
                <input type="radio" name="exportMode" value="custom" checked={exportMode === 'custom'} onChange={() => setExportMode('custom')} />
                <span>⚙️ <strong>Tùy chọn khoảng số tuần:</strong></span>
              </label>

              {exportMode === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '32px', marginTop: '-4px' }}>
                  <span style={{ fontSize: '13.5px', color: '#475569' }}>Từ:</span>
                  <select value={fromWeek} onChange={e => setFromWeek(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                    {schoolWeeks.map(w => (
                      <option key={w.week_number} value={w.week_number}>Tuần {w.week_number}</option>
                    ))}
                  </select>

                  <span style={{ fontSize: '13.5px', color: '#475569' }}>Đến:</span>
                  <select value={toWeek} onChange={e => setToWeek(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                    {schoolWeeks.map(w => (
                      <option key={w.week_number} value={w.week_number}>Tuần {w.week_number}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowExportModal(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>
                Hủy bỏ
              </button>
              <button type="button" onClick={handleExecutePublicExport} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
                📥 Tải File Word (.doc)
              </button>
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
