import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Calendar, Clock, MapPin, Printer, FileSpreadsheet, Share2, Check, Download, Link as LinkIcon, FileText,
  Sparkles, BookOpen, User, Users, Search, Filter, Flame, Info, CheckCircle2, X, Star, Bell
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

export const PERIOD_TIMINGS = [
  { period: 1, session: 'Sáng', start: '07:00', end: '07:45', label: 'Tiết 1 (07:00 - 07:45)' },
  { period: 2, session: 'Sáng', start: '07:50', end: '08:35', label: 'Tiết 2 (07:50 - 08:35)' },
  { period: 3, session: 'Sáng', start: '08:50', end: '09:35', label: 'Tiết 3 (08:50 - 09:35)' },
  { period: 4, session: 'Sáng', start: '09:35', end: '10:20', label: 'Tiết 4 (09:35 - 10:20)' },
  { period: 5, session: 'Sáng', start: '10:20', end: '11:05', label: 'Tiết 5 (10:20 - 11:05)' },
  { period: 6, session: 'Chiều', start: '13:30', end: '14:15', label: 'Tiết 6 (13:30 - 14:15)' },
  { period: 7, session: 'Chiều', start: '14:20', end: '15:05', label: 'Tiết 7 (14:20 - 15:05)' },
  { period: 8, session: 'Chiều', start: '15:20', end: '16:05', label: 'Tiết 8 (15:20 - 16:05)' },
  { period: 9, session: 'Chiều', start: '16:10', end: '16:55', label: 'Tiết 9 (16:10 - 16:55)' },
  { period: 10, session: 'Chiều', start: '17:00', end: '17:45', label: 'Tiết 10 (17:00 - 17:45)' }
];

export const getSubjectTheme = (subject) => {
  if (!subject) return { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', icon: '📝', badgeBg: '#f1f5f9', label: 'Khác' };
  const s = String(subject).trim();
  const lower = s.toLowerCase();
  
  if (lower.includes('toán')) {
    return { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', icon: '📐', badgeBg: '#dbeafe', label: 'Toán học' };
  }
  if (lower.includes('văn')) {
    return { bg: '#fdf2f8', border: '#f9a8d4', text: '#be185d', icon: '📖', badgeBg: '#fce7f3', label: 'Ngữ văn' };
  }
  if (lower.includes('anh') || lower.includes('tiếng anh') || lower.includes('av')) {
    return { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: '🇬🇧', badgeBg: '#dcfce7', label: 'Tiếng Anh' };
  }
  if (lower.includes('vật lý') || lower.includes('vật lí') || lower === 'lý') {
    return { bg: '#fefce8', border: '#fde047', text: '#a16207', icon: '⚡', badgeBg: '#fef9c3', label: 'Vật lí' };
  }
  if (lower.includes('hóa') || lower.includes('hoá')) {
    return { bg: '#faf5ff', border: '#d8b4fe', text: '#7e22ce', icon: '🧪', badgeBg: '#f3e8ff', label: 'Hóa học' };
  }
  if (lower.includes('sinh')) {
    return { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857', icon: '🧬', badgeBg: '#d1fae5', label: 'Sinh học' };
  }
  if (lower.includes('sử') || lower.includes('lịch sử')) {
    return { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', icon: '🏛️', badgeBg: '#ffedd5', label: 'Lịch sử' };
  }
  if (lower.includes('địa') || lower.includes('địa lý') || lower.includes('địa lí')) {
    return { bg: '#ecfeff', border: '#67e8f9', text: '#0e7490', icon: '🌍', badgeBg: '#cffafe', label: 'Địa lí' };
  }
  if (lower.includes('tin') || lower.includes('tin học')) {
    return { bg: '#f0fdfa', border: '#5eead4', text: '#0f766e', icon: '💻', badgeBg: '#ccfbf1', label: 'Tin học' };
  }
  if (lower.includes('thể dục') || lower.includes('gdtc') || lower.includes('td')) {
    return { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', icon: '⚽', badgeBg: '#fee2e2', label: 'Thể dục' };
  }
  if (lower.includes('gdqp') || lower.includes('quốc phòng')) {
    return { bg: '#f1f5f9', border: '#94a3b8', text: '#334155', icon: '🛡️', badgeBg: '#e2e8f0', label: 'GDQP-AN' };
  }
  if (lower.includes('công nghệ') || lower.includes('cn')) {
    return { bg: '#e0f2fe', border: '#7dd3fc', text: '#0369a1', icon: '⚙️', badgeBg: '#bae6fd', label: 'Công nghệ' };
  }
  if (lower.includes('gdcd') || lower.includes('ktlp') || lower.includes('gdkt')) {
    return { bg: '#fdf4ff', border: '#f0abfc', text: '#86198f', icon: '⚖️', badgeBg: '#fae8ff', label: 'GDKT&PL' };
  }
  if (lower.includes('địa phương') || lower.includes('gdđp')) {
    return { bg: '#fef3c7', border: '#fcd34d', text: '#b45309', icon: '🌾', badgeBg: '#fef3c7', label: 'GD Địa phương' };
  }
  if (lower.includes('chào cờ') || lower.includes('shdc')) {
    return { bg: '#fff1f2', border: '#fda4af', text: '#be123c', icon: '🚩', badgeBg: '#ffe4e6', label: 'Chào cờ' };
  }
  if (lower.includes('trải nghiệm') || lower.includes('hđtn') || lower.includes('sinh hoạt')) {
    return { bg: '#fffbeb', border: '#fde68a', text: '#b45309', icon: '🌟', badgeBg: '#fef3c7', label: 'HĐTN - SHL' };
  }
  if (lower.includes('mĩ thuật') || lower.includes('mỹ thuật') || lower === 'mt') {
    return { bg: '#fdf4ff', border: '#f5d0fe', text: '#c026d3', icon: '🎨', badgeBg: '#fae8ff', label: 'Mĩ thuật' };
  }
  if (lower.includes('âm nhạc')) {
    return { bg: '#fdf2f8', border: '#f5d0fe', text: '#a21caf', icon: '🎵', badgeBg: '#fae8ff', label: 'Âm nhạc' };
  }

  return { bg: '#f8fafc', border: '#cbd5e1', text: '#334155', icon: '📚', badgeBg: '#e2e8f0', label: s };
};

export const getTodayVN = () => {
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const now = new Date();
  const dayIndex = now.getDay();
  const dayName = dayNames[dayIndex];
  const isSchoolDay = dayIndex >= 1 && dayIndex <= 6;
  const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let currentPeriod = null;
  let statusText = 'Ngoài giờ học';

  for (const pt of PERIOD_TIMINGS) {
    const [sh, sm] = pt.start.split(':').map(Number);
    const [eh, em] = pt.end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (currentMinutes >= startMin && currentMinutes <= endMin) {
      currentPeriod = pt.period;
      statusText = `Đang diễn ra Tiết ${pt.period} (${pt.start} - ${pt.end})`;
      break;
    }
  }

  if (!currentPeriod && isSchoolDay) {
    if (currentMinutes >= 7 * 60 && currentMinutes < 11 * 60 + 5) {
      statusText = 'Giờ giải lao / Chuẩn bị đổi tiết sáng';
    } else if (currentMinutes >= 11 * 60 + 5 && currentMinutes < 13 * 60 + 30) {
      statusText = 'Nghỉ trưa bán trú / Chuyển ca';
    } else if (currentMinutes >= 13 * 60 + 30 && currentMinutes < 17 * 60 + 45) {
      statusText = 'Giờ giải lao / Chuẩn bị đổi tiết chiều';
    }
  }

  return { dayName, isSchoolDay, dateStr, currentPeriod, statusText };
};

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
  const match = clean.match(/^(\d{2}[A-Z]+)(\d{1,2})$/);
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
  
  // State for TKB Toan Truong (Theo Khoi)
  const [selectedGrade, setSelectedGrade] = useState('10'); // '10' | '11' | '12' | 'all'
  const [selectedGradeDay, setSelectedGradeDay] = useState('Thứ 2'); // 'Thứ 2'..'Thứ 7' | 'all'
  const [selectedGradeSession, setSelectedGradeSession] = useState('all'); // 'all' | 'morning' | 'afternoon'
  const [gradeSearchQuery, setGradeSearchQuery] = useState('');

  // Interactive Excitement Features State
  const [selectedHighlightSubject, setSelectedHighlightSubject] = useState(null);
  const [selectedLessonDetail, setSelectedLessonDetail] = useState(null);
  const [classGradeFilterTab, setClassGradeFilterTab] = useState('10'); // '10' | '11' | '12'
  const [teacherSearchInput, setTeacherSearchInput] = useState('');
  const [todayViewFocus, setTodayViewFocus] = useState(false);

  const todayInfo = useMemo(() => getTodayVN(), []);


  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  // Initialize state from URL params
  useEffect(() => {
    document.title = "Lịch Công Tác & Thời Khóa Biểu | THPT Cao Bá Quát - Phường Tân An - Tỉnh Đắk Lắk";
    const tabParam = searchParams.get('tab');
    const classParam = searchParams.get('class');
    const teacherParam = searchParams.get('teacher');
    const weekParam = searchParams.get('week');
    const gradeParam = searchParams.get('grade');

    if (tabParam && ['bgh_schedule', 'class_tkb', 'teacher_tkb', 'grade_tkb'].includes(tabParam)) {
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
    if (gradeParam && ['10', '11', '12', 'all'].includes(gradeParam)) {
      setSelectedGrade(gradeParam);
    }
  }, [searchParams]);

  // Sync state to URL search params
  const updateUrlParams = (tab, cls, teacher, week, grade) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (tab === 'class_tkb' && cls) params.set('class', cls);
    if (tab === 'teacher_tkb' && teacher) params.set('teacher', teacher);
    if (tab === 'grade_tkb' && grade) params.set('grade', grade);
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

  const getClassesForGrade = (grade) => {
    if (grade === '10') return availableClasses.filter(c => c.startsWith('10'));
    if (grade === '11') return availableClasses.filter(c => c.startsWith('11'));
    if (grade === '12') return availableClasses.filter(c => c.startsWith('12'));
    return availableClasses;
  };

  const getLessonForClassAndDay = (cls, day, period) => {
    return timetableData.find(t => t.student_class === cls && t.day_of_week === day && Number(t.period) === period);
  };

  const handleExportGradeTkbExcel = () => {
    const targetClasses = getClassesForGrade(selectedGrade);
    const gradeLabel = selectedGrade === 'all' ? 'Toàn Trường (Khối 10, 11, 12)' : `Khối ${selectedGrade}`;
    
    const matrixData = [
      { "Tiết / Ngày": "SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐẮK LẮK", ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
      { "Tiết / Ngày": "TRƯỜNG THPT CAO BÁ QUÁT - PHƯỜNG TÂN AN - TỈNH ĐẮK LẮK", ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
      { "Tiết / Ngày": `BẢNG THỜI KHÓA BIỂU TỔNG HỢP ${gradeLabel.toUpperCase()} - NĂM HỌC 2026-2027`, ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
      { "Tiết / Ngày": `Áp dụng từ ngày 01/09/2026 • Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
      { "Tiết / Ngày": "", ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) }
    ];

    const daysToExport = selectedGradeDay === 'all' ? DAYS : [selectedGradeDay];

    daysToExport.forEach(day => {
      matrixData.push({
        "Tiết / Ngày": `=== ${day.toUpperCase()} ===`,
        ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {})
      });

      const periods = [
        { label: '--- SÁNG ---', isHeader: true },
        1, 2, 3, 4, 5,
        { label: '--- CHIỀU ---', isHeader: true },
        6, 7, 8, 9, 10
      ];

      periods.forEach(p => {
        if (p.isHeader) {
          matrixData.push({
            "Tiết / Ngày": p.label,
            ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {})
          });
        } else {
          const row = { "Tiết / Ngày": `Tiết ${p}` };
          targetClasses.forEach(cls => {
            const item = timetableData.find(t => t.student_class === cls && t.day_of_week === day && Number(t.period) === p);
            row[cls] = item ? `${item.subject} (${item.teacher_name})` : '-';
          });
          matrixData.push(row);
        }
      });

      matrixData.push({ "Tiết / Ngày": "", ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) });
    });

    const ws = XLSX.utils.json_to_sheet(matrixData);
    const cols = [{ wch: 18 }];
    targetClasses.forEach(() => cols.push({ wch: 22 }));
    ws['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    const sheetName = selectedGrade === 'all' ? 'TKB_ToanTruong' : `TKB_Khoi_${selectedGrade}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `ThoiKhoaBieu_${sheetName}_2026_2027.xlsx`);
  };

  const handleTabChange = (tab) => {
    setActiveMainTab(tab);
    updateUrlParams(tab, selectedClass, selectedTeacher, selectedWeekNo, selectedGrade);
  };

  const handleGradeChange = (newGrade) => {
    setSelectedGrade(newGrade);
    updateUrlParams(activeMainTab, selectedClass, selectedTeacher, selectedWeekNo, newGrade);
  };

  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    updateUrlParams(activeMainTab, newClass, selectedTeacher, selectedWeekNo, selectedGrade);
  };

  const handleTeacherChange = (newTeacher) => {
    setSelectedTeacher(newTeacher);
    updateUrlParams(activeMainTab, selectedClass, newTeacher, selectedWeekNo, selectedGrade);
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
          {[
            { id: 'bgh_schedule', label: '📅 Lịch Công Tác BGH' },
            { id: 'class_tkb', label: '🎓 TKB Lớp' },
            { id: 'teacher_tkb', label: '👨‍🏫 TKB Giáo viên' },
            { id: 'grade_tkb', label: '🏫 TKB Toàn Trường (Theo Khối)' }
          ].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} style={{ ...styles.tabBtn, backgroundColor: activeMainTab === tab.id ? '#be123c' : '#f1f5f9', color: activeMainTab === tab.id ? '#fff' : '#334' }}>
              {tab.label}
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
      {(activeMainTab === 'class_tkb' || activeMainTab === 'teacher_tkb') && (() => {
        // Calculate Subject Breakdown Stats
        const currentTargetLessons = activeMainTab === 'class_tkb'
          ? timetableData.filter(t => t.student_class === selectedClass)
          : timetableData.filter(t => getFullTeacherName(t.teacher_name) === selectedTeacher);

        const subjectCounts = currentTargetLessons.reduce((acc, t) => {
          const s = t.subject || 'Khác';
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {});
        const sortedSubjectBreakdown = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);

        // Today's lessons for selected target
        const todayLessons = currentTargetLessons
          .filter(t => t.day_of_week === todayInfo.dayName)
          .sort((a, b) => Number(a.period) - Number(b.period));

        // Filtered teachers list for teacher tab
        const filteredTeachersList = availableTeachers.filter(t => 
          !teacherSearchInput || t.toLowerCase().includes(teacherSearchInput.toLowerCase())
        );

        // Grade classes for quick switcher
        const grade10Classes = availableClasses.filter(c => c.startsWith('10'));
        const grade11Classes = availableClasses.filter(c => c.startsWith('11'));
        const grade12Classes = availableClasses.filter(c => c.startsWith('12'));
        const currentGradeClasses = classGradeFilterTab === '10' ? grade10Classes : (classGradeFilterTab === '11' ? grade11Classes : grade12Classes);

        return (
          <div style={styles.sheetCard} className="print-full">
            
            {/* OFFICIAL PRINT HEADER (ND 30) */}
            <div className="print-only" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</div>
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
                  Áp dụng Học kỳ I • Năm học 2026 - 2027 • Trường THPT Cao Bá Quát
                </div>
              </div>
            </div>

            {/* CONTROL TOOLBAR (NO-PRINT) */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              
              {/* ROW 1: QUICK TARGET SELECTOR */}
              {activeMainTab === 'class_tkb' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={18} color="#be123c" /> Chọn Khối Lớp:
                      </span>
                      {['10', '11', '12'].map(g => (
                        <button
                          key={g}
                          onClick={() => setClassGradeFilterTab(g)}
                          style={{
                            padding: '5px 14px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            border: classGradeFilterTab === g ? 'none' : '1px solid #cbd5e1',
                            backgroundColor: classGradeFilterTab === g ? '#be123c' : '#ffffff',
                            color: classGradeFilterTab === g ? '#ffffff' : '#475569',
                            boxShadow: classGradeFilterTab === g ? '0 2px 6px rgba(190,18,60,0.3)' : 'none'
                          }}
                        >
                          Khối {g}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleExportClassTkbExcel}
                        style={{ ...styles.printBtn, backgroundColor: '#15803d' }}
                      >
                        <FileSpreadsheet size={16} /> Xuất Excel Lớp {selectedClass}
                      </button>
                      <button onClick={handlePrint} style={styles.printBtn}>
                        <Printer size={16} /> In TKB Lớp
                      </button>
                    </div>
                  </div>

                  {/* QUICK CLASS CHIPS */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginRight: '4px' }}>Lớp nhanh:</span>
                    {currentGradeClasses.map(cls => (
                      <button
                        key={cls}
                        onClick={() => handleClassChange(cls)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          border: selectedClass === cls ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          backgroundColor: selectedClass === cls ? '#e0f2fe' : '#f8fafc',
                          color: selectedClass === cls ? '#0369a1' : '#334155',
                          boxShadow: selectedClass === cls ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
                          transform: selectedClass === cls ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* TEACHER SELECTION CONTROLS */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                      <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={18} color="#be123c" /> Chọn Giáo Viên:
                      </span>
                      
                      {/* TEACHER SEARCH BOX */}
                      <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '320px' }}>
                        <input
                          type="text"
                          placeholder="🔍 Gõ tên giáo viên cần tìm..."
                          value={teacherSearchInput}
                          onChange={e => setTeacherSearchInput(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            outline: 'none',
                            backgroundColor: '#ffffff'
                          }}
                        />
                        {teacherSearchInput && (
                          <button
                            onClick={() => setTeacherSearchInput('')}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* SELECT DROPDOWN */}
                      <select
                        value={selectedTeacher}
                        onChange={e => handleTeacherChange(e.target.value)}
                        style={{ ...styles.select, padding: '7px 12px', fontSize: '13px', maxWidth: '260px' }}
                      >
                        {filteredTeachersList.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleExportTeacherTkbExcel}
                        style={{ ...styles.printBtn, backgroundColor: '#15803d' }}
                      >
                        <FileSpreadsheet size={16} /> Xuất Excel GV {selectedTeacher}
                      </button>
                      <button onClick={handlePrint} style={styles.printBtn}>
                        <Printer size={16} /> In TKB GV
                      </button>
                    </div>
                  </div>

                  {/* QUICK TEACHER MATCH SUGGESTIONS (IF SEARCHING) */}
                  {teacherSearchInput && filteredTeachersList.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#c2410c' }}>Kết quả ({filteredTeachersList.length}):</span>
                      {filteredTeachersList.slice(0, 8).map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            handleTeacherChange(t);
                            setTeacherSearchInput('');
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            border: selectedTeacher === t ? '2px solid #0284c7' : '1px solid #e2e8f0',
                            backgroundColor: selectedTeacher === t ? '#e0f2fe' : '#f8fafc',
                            color: selectedTeacher === t ? '#0369a1' : '#334155'
                          }}
                        >
                          👨‍🏫 {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* TODAY HERO WIDGET (EXCITING FOR STUDENTS & TEACHERS) */}
            <div className="no-print" style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
              borderRadius: '16px',
              padding: '20px 24px',
              color: '#ffffff',
              marginBottom: '24px',
              boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative Orb */}
              <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px'
                  }}>
                    {activeMainTab === 'class_tkb' ? '🎒' : '👨‍🏫'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8' }}>
                        {activeMainTab === 'class_tkb' ? 'TIÊU ĐIỂM HỌC TẬP HÔM NAY' : 'LỊCH GIẢNG DẠY HÔM NAY'}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        backgroundColor: todayInfo.isSchoolDay ? '#10b981' : '#64748b',
                        color: '#ffffff'
                      }}>
                        {todayInfo.isSchoolDay ? '🔥 ĐANG TRONG TUẦN HỌC' : '🏖️ NGÀY NGHỈ'}
                      </span>
                    </div>
                    <h3 style={{ margin: '3px 0 0 0', fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>
                      {todayInfo.dayName} • Ngày {todayInfo.dateStr} — {activeMainTab === 'class_tkb' ? `Lớp ${selectedClass}` : `Thầy/Cô ${selectedTeacher}`}
                    </h3>
                  </div>
                </div>

                {/* Live Status Indicator */}
                <div style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#e2e8f0'
                }}>
                  <Clock size={15} color="#38bdf8" />
                  <span>Trạng thái: <strong style={{ color: '#38bdf8' }}>{todayInfo.statusText}</strong></span>
                </div>
              </div>

              {/* TODAY'S LESSONS ROW */}
              {todayLessons.length > 0 ? (
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px', fontWeight: '600' }}>
                    Lộ trình {todayLessons.length} tiết hôm nay ({todayInfo.dayName}):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    {todayLessons.map((l, idx) => {
                      const lTheme = getSubjectTheme(l.subject);
                      const isCurrent = todayInfo.currentPeriod === Number(l.period);
                      const timing = PERIOD_TIMINGS.find(pt => pt.period === Number(l.period));

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedLessonDetail({ ...l, day: todayInfo.dayName, period: l.period })}
                          style={{
                            backgroundColor: isCurrent ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.12)',
                            border: isCurrent ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            color: isCurrent ? '#0f172a' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backdropFilter: 'blur(8px)',
                            boxShadow: isCurrent ? '0 0 15px rgba(56, 189, 248, 0.5)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: isCurrent ? '#0284c7' : '#38bdf8' }}>
                              Tiết {l.period} • {timing?.start || ''}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: '9px', fontWeight: '900', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff' }}>
                                LIVE
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{lTheme.icon}</span>
                            <span style={{ color: isCurrent ? lTheme.text : '#ffffff' }}>{l.subject}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', marginTop: '4px', opacity: 0.85 }}>
                            {activeMainTab === 'class_tkb' ? `GV: ${l.teacher_name}` : `Lớp: ${l.student_class}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                  {todayInfo.isSchoolDay ? '🎉 Hôm nay không có tiết học / giảng dạy xếp trên hệ thống.' : '🏖️ Hôm nay Chủ Nhật - Nghỉ ngơi nạp năng lượng chuẩn bị cho tuần mới! ✨'}
                </div>
              )}
            </div>

            {/* SUBJECT BREAKDOWN & HIGHLIGHT STRIP (NO-PRINT) */}
            <div className="no-print" style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '14px 18px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#f59e0b" />
                  <span>Phân bổ môn học trong tuần (Tổng: {currentTargetLessons.length} tiết):</span>
                </div>
                {selectedHighlightSubject && (
                  <button
                    onClick={() => setSelectedHighlightSubject(null)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f1f5f9',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Xoá làm nổi bật môn
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {sortedSubjectBreakdown.map(([subName, count]) => {
                  const sTheme = getSubjectTheme(subName);
                  const isSelected = selectedHighlightSubject === subName;

                  return (
                    <button
                      key={subName}
                      onClick={() => setSelectedHighlightSubject(isSelected ? null : subName)}
                      className="tkb-badge-pill"
                      style={{
                        padding: '5px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: isSelected ? `2px solid ${sTheme.text}` : `1px solid ${sTheme.border}`,
                        backgroundColor: isSelected ? sTheme.badgeBg : sTheme.bg,
                        color: sTheme.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: isSelected ? '0 0 0 2px #f59e0b' : 'none'
                      }}
                    >
                      <span>{sTheme.icon}</span>
                      <span>{subName}:</span>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? sTheme.text : 'rgba(0,0,0,0.06)',
                        color: isSelected ? '#ffffff' : sTheme.text,
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VIBRANT TIMETABLE MATRIX */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ ...styles.table, borderCollapse: 'separate', borderSpacing: '6px' }}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={{ ...styles.th, width: '90px', textAlign: 'center', borderRadius: '8px 0 0 8px' }}>Tiết</th>
                    {DAYS.map(h => {
                      const isToday = h === todayInfo.dayName;
                      return (
                        <th
                          key={h}
                          className={isToday ? 'today-column-header' : ''}
                          style={{
                            ...styles.th,
                            textAlign: 'center',
                            borderRadius: isToday ? '8px' : '0',
                            boxShadow: isToday ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
                          }}
                        >
                          <div style={{ fontSize: '13.5px', fontWeight: '800' }}>{h}</div>
                          {isToday && (
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#fef08a', marginTop: '2px', letterSpacing: '0.5px' }}>
                              🌟 HÔM NAY
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {[
                    { label: '🌅 BUỔI SÁNG (07:00 - 11:05)', isHeader: true, session: 'morning' },
                    1, 2, 3, 4, 5,
                    { label: '🌇 BUỔI CHIỀU (13:30 - 17:45)', isHeader: true, session: 'afternoon' },
                    6, 7, 8, 9, 10
                  ].map((p, idx) => {
                    if (p.isHeader) {
                      return (
                        <tr key={`h-${idx}`}>
                          <td
                            colSpan={7}
                            style={{
                              padding: '8px 14px',
                              fontSize: '12px',
                              fontWeight: '800',
                              textAlign: 'center',
                              letterSpacing: '0.8px',
                              borderRadius: '8px',
                              backgroundColor: p.session === 'morning' ? '#e0f2fe' : '#fef3c7',
                              color: p.session === 'morning' ? '#0369a1' : '#b45309'
                            }}
                          >
                            {p.label}
                          </td>
                        </tr>
                      );
                    }

                    const timing = PERIOD_TIMINGS.find(pt => pt.period === p);
                    const isMorning = p <= 5;

                    return (
                      <tr key={p}>
                        {/* PERIOD TITLE CELL */}
                        <td style={{
                          padding: '6px 8px',
                          textAlign: 'center',
                          borderRadius: '8px',
                          backgroundColor: isMorning ? '#f0f9ff' : '#fffbeb',
                          border: `1px solid ${isMorning ? '#bae6fd' : '#fde68a'}`,
                          verticalAlign: 'middle',
                          width: '100px',
                          minWidth: '100px',
                          whiteSpace: 'nowrap'
                        }}>
                          <div style={{ fontWeight: '900', fontSize: '13px', color: isMorning ? '#0284c7' : '#b45309' }}>
                            Tiết {p}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>
                            {timing?.start} - {timing?.end}
                          </div>
                        </td>

                        {/* DAY CELLS */}
                        {DAYS.map(d => {
                          const item = activeMainTab === 'class_tkb'
                            ? getLessonForClass(d, p)
                            : getLessonForTeacher(d, p);

                          const isToday = d === todayInfo.dayName;
                          const isCurrentActive = isToday && todayInfo.currentPeriod === p;

                          if (!item) {
                            return (
                              <td
                                key={d}
                                className={isToday ? 'today-column-cell' : ''}
                                style={{
                                  padding: '6px',
                                  borderRadius: '8px',
                                  backgroundColor: isToday ? 'rgba(239, 246, 255, 0.4)' : '#f8fafc',
                                  border: '1px dashed #e2e8f0',
                                  textAlign: 'center',
                                  color: '#cbd5e1',
                                  fontSize: '12px',
                                  verticalAlign: 'middle'
                                }}
                              >
                                —
                              </td>
                            );
                          }

                          const theme = getSubjectTheme(item.subject);
                          const isHighlighted = selectedHighlightSubject && item.subject.toLowerCase().includes(selectedHighlightSubject.toLowerCase());

                          return (
                            <td
                              key={d}
                              className={isToday ? 'today-column-cell' : ''}
                              style={{
                                padding: '3px',
                                borderRadius: '8px',
                                verticalAlign: 'top',
                                backgroundColor: isToday ? 'rgba(239, 246, 255, 0.5)' : 'transparent'
                              }}
                            >
                              <div
                                className={`tkb-cell-card ${isHighlighted ? 'tkb-highlighted' : ''}`}
                                onClick={() => setSelectedLessonDetail({ ...item, day: d, period: p })}
                                style={{
                                  backgroundColor: isHighlighted ? '#fef08a' : theme.bg,
                                  border: isHighlighted ? '2px solid #ca8a04' : `1.5px solid ${theme.border}`,
                                  borderLeft: `4px solid ${isHighlighted ? '#ca8a04' : theme.text}`,
                                  borderRadius: '8px',
                                  padding: '6px 8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  boxShadow: isCurrentActive ? '0 0 12px rgba(2, 132, 199, 0.4)' : '0 1px 3px rgba(0,0,0,0.03)',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                  <span style={{ fontSize: '12.5px', fontWeight: '800', color: theme.text, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                    <span>{theme.icon}</span>
                                    <span>{item.subject}</span>
                                  </span>
                                  {isCurrentActive && (
                                    <span style={{ fontSize: '9px', fontWeight: '900', padding: '1px 5px', borderRadius: '6px', backgroundColor: '#ef4444', color: '#ffffff' }}>
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: activeMainTab === 'class_tkb' ? '#1d4ed8' : '#047857',
                                    backgroundColor: theme.badgeBg || '#ffffff',
                                    padding: '1px 5px',
                                    borderRadius: '5px',
                                    border: `1px solid ${theme.border}`,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {activeMainTab === 'class_tkb' ? (item.teacher_name || 'GV') : `Lớp ${item.student_class}`}
                                  </span>
                                  <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 'bold' }}>
                                    {timing?.start}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
        );
      })()}

      {/* TAB 4: 🏫 TKB TOÀN TRƯỜNG (THEO KHỐI) - MA TRẬN ĐẦY ĐỦ CHUẨN XÁC 100% */}
      {activeMainTab === 'grade_tkb' && (() => {
        const targetClasses = getClassesForGrade(selectedGrade);
        const gradeLabel = selectedGrade === 'all' ? 'Toàn Trường (Khối 10, 11, 12)' : `Khối ${selectedGrade}`;
        const daysToRender = selectedGradeDay === 'all' ? DAYS : [selectedGradeDay];

        // Stats calculation
        const activeItemsInSelection = timetableData.filter(t => 
          targetClasses.includes(t.student_class) && 
          (selectedGradeDay === 'all' || t.day_of_week === selectedGradeDay)
        );
        const uniqueTeachersInSelection = Array.from(new Set(activeItemsInSelection.map(t => t.teacher_name))).filter(Boolean);

        return (
          <div style={styles.sheetCard} className="print-full">
            
            {/* OFFICIAL PRINT HEADER (ND 30) */}
            <div className="print-only" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</div>
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
                  BẢNG THỜI KHÓA BIỂU TỔNG HỢP {gradeLabel.toUpperCase()}
                </h2>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                  {selectedGradeDay === 'all' ? 'Toàn bộ các ngày trong tuần (Thứ 2 đến Thứ 7)' : `Thời khóa biểu ngày: ${selectedGradeDay}`}
                </div>
                <div style={{ fontSize: '11.5px', fontStyle: 'italic', color: '#475569' }}>
                  Năm học 2026 - 2027 • Áp dụng từ ngày 01/09/2026
                </div>
              </div>
            </div>

            {/* CONTROL TOOLBAR (NO-PRINT) */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              
              {/* ROW 1: GRADE FILTER & DAY SELECTOR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                
                {/* GRADE BUTTONS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '13.5px' }}>Chọn Khối:</span>
                  {[
                    { id: '10', label: 'Khối 10', count: getClassesForGrade('10').length },
                    { id: '11', label: 'Khối 11', count: getClassesForGrade('11').length },
                    { id: '12', label: 'Khối 12', count: getClassesForGrade('12').length },
                    { id: 'all', label: 'Toàn Trường', count: availableClasses.length }
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleGradeChange(g.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: selectedGrade === g.id ? '#be123c' : '#ffffff',
                        color: selectedGrade === g.id ? '#ffffff' : '#334155',
                        boxShadow: selectedGrade === g.id ? '0 4px 10px rgba(190,18,60,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                        border: selectedGrade === g.id ? 'none' : '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{g.label}</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: selectedGrade === g.id ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                        color: selectedGrade === g.id ? '#ffffff' : '#64748b'
                      }}>
                        {g.count} lớp
                      </span>
                    </button>
                  ))}
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleExportGradeTkbExcel}
                    style={{ ...styles.printBtn, backgroundColor: '#15803d' }}
                  >
                    <FileSpreadsheet size={16} /> Xuất Excel Ma Trận {selectedGrade === 'all' ? 'Toàn Trường' : `Khối ${selectedGrade}`}
                  </button>
                  <button onClick={handlePrint} style={styles.printBtn}>
                    <Printer size={16} /> In Bảng TKB
                  </button>
                </div>
              </div>

              {/* ROW 2: DAY FILTER & SESSION & SEARCH */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                
                {/* DAY FILTER BUTTONS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '13.5px' }}>Xem Ngày:</span>
                  {[...DAYS, 'all'].map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedGradeDay(d)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: selectedGradeDay === d ? '#0284c7' : '#ffffff',
                        color: selectedGradeDay === d ? '#ffffff' : '#475569',
                        border: selectedGradeDay === d ? 'none' : '1px solid #cbd5e1'
                      }}
                    >
                      {d === 'all' ? '📋 Xem Toàn Tuần' : d}
                    </button>
                  ))}
                </div>

                {/* SESSION FILTER & SEARCH INPUT */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  
                  {/* SESSION FILTER */}
                  <select
                    value={selectedGradeSession}
                    onChange={e => setSelectedGradeSession(e.target.value)}
                    style={{ ...styles.select, padding: '6px 10px', fontSize: '12.5px' }}
                  >
                    <option value="all">🕒 Cả ngày (Tiết 1 - 10)</option>
                    <option value="morning">🌅 Ca Sáng (Tiết 1 - 5)</option>
                    <option value="afternoon">🌇 Ca Chiều (Tiết 6 - 10)</option>
                  </select>

                  {/* SEARCH KEYWORD INPUT */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="🔍 Tìm GV hoặc Môn học..."
                      value={gradeSearchQuery}
                      onChange={e => setGradeSearchQuery(e.target.value)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        width: '200px',
                        outline: 'none'
                      }}
                    />
                    {gradeSearchQuery && (
                      <button
                        onClick={() => setGradeSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                </div>

              </div>

            </div>

            {/* QUICK STATS STRIP (NO-PRINT) */}
            <div className="no-print" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#1e40af',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <strong>🏫 Danh sách ({targetClasses.length} lớp {gradeLabel}):</strong> {targetClasses.join(', ')}
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <span>📖 Tổng số tiết: <strong>{activeItemsInSelection.length} tiết</strong></span>
                <span>👨‍🏫 Giáo viên đứng lớp: <strong>{uniqueTeachersInSelection.length} thầy/cô</strong></span>
              </div>
            </div>

            {/* MATRIX TABLES RENDERING */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {daysToRender.map(day => {
                const periodsToRender = [
                  ...(selectedGradeSession === 'afternoon' ? [] : [
                    { label: `--- SÁNG (${day}) (07:00 - 11:05) ---`, isHeader: true },
                    1, 2, 3, 4, 5
                  ]),
                  ...(selectedGradeSession === 'morning' ? [] : [
                    { label: `--- CHIỀU (${day}) (13:30 - 17:45) ---`, isHeader: true },
                    6, 7, 8, 9, 10
                  ])
                ];

                return (
                  <div key={day} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    
                    {/* DAY TITLE BANNER */}
                    <div style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      padding: '10px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '14.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📅 THỜI KHÓA BIỂU {day.toUpperCase()}</span>
                        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#94a3b8' }}>({gradeLabel})</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {targetClasses.length} lớp học
                      </span>
                    </div>

                    {/* HORIZONTALLY SCROLLABLE MATRIX TABLE */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ ...styles.table, margin: 0, minWidth: targetClasses.length > 8 ? `${targetClasses.length * 115 + 100}px` : '100%' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                            <th style={{
                              ...styles.th,
                              width: '100px',
                              minWidth: '100px',
                              textAlign: 'center',
                              position: 'sticky',
                              left: 0,
                              backgroundColor: '#0f172a',
                              color: '#ffffff',
                              zIndex: 10,
                              boxShadow: '2px 0 6px rgba(0,0,0,0.15)',
                              whiteSpace: 'nowrap',
                              padding: '8px 6px'
                            }}>
                              Tiết / Lớp
                            </th>
                            {targetClasses.map(cls => (
                              <th key={cls} style={{
                                ...styles.th,
                                textAlign: 'center',
                                backgroundColor: '#1e293b',
                                borderLeft: '1px solid #334155',
                                minWidth: '115px',
                                padding: '8px 6px'
                              }}>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>{cls}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {periodsToRender.map((p, pIdx) => {
                            if (p.isHeader) {
                              return (
                                <tr key={`hdr-${pIdx}`} style={{ backgroundColor: '#f1f5f9' }}>
                                  <td
                                    colSpan={targetClasses.length + 1}
                                    style={{
                                      padding: '6px 14px',
                                      fontSize: '11.5px',
                                      fontWeight: '800',
                                      textAlign: 'center',
                                      letterSpacing: '0.8px',
                                      backgroundColor: p.label.includes('SÁNG') ? '#e0f2fe' : '#fef3c7',
                                      color: p.label.includes('SÁNG') ? '#0369a1' : '#b45309'
                                    }}
                                  >
                                    {p.label}
                                  </td>
                                </tr>
                              );
                            }

                            const isMorning = p <= 5;
                            const timing = PERIOD_TIMINGS.find(pt => pt.period === p);

                            return (
                              <tr key={p} style={{ ...styles.tableRow, backgroundColor: isMorning ? '#ffffff' : '#fafafa' }}>
                                
                                {/* STICKY PERIOD COLUMN */}
                                <td style={{
                                  ...styles.td,
                                  fontWeight: '800',
                                  textAlign: 'center',
                                  backgroundColor: isMorning ? '#f0f9ff' : '#fffbeb',
                                  color: isMorning ? '#0369a1' : '#b45309',
                                  position: 'sticky',
                                  left: 0,
                                  zIndex: 5,
                                  boxShadow: '2px 0 6px rgba(0,0,0,0.06)',
                                  borderRight: '1px solid #cbd5e1',
                                  width: '100px',
                                  minWidth: '100px',
                                  whiteSpace: 'nowrap',
                                  padding: '6px 8px',
                                  verticalAlign: 'middle'
                                }}>
                                  <div style={{ fontSize: '13px', fontWeight: '900', color: isMorning ? '#0284c7' : '#b45309' }}>
                                    Tiết {p}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>
                                    {timing?.start} - {timing?.end}
                                  </div>
                                </td>

                                {/* EACH CLASS CELL */}
                                {targetClasses.map(cls => {
                                  const item = getLessonForClassAndDay(cls, day, p);

                                  if (!item) {
                                    return (
                                      <td key={cls} style={{ ...styles.td, textAlign: 'center', color: '#cbd5e1', borderLeft: '1px solid #f1f5f9', padding: '6px 8px' }}>
                                        -
                                      </td>
                                    );
                                  }

                                  const sTheme = getSubjectTheme(item.subject);
                                  const isMatched = gradeSearchQuery && (
                                    item.subject.toLowerCase().includes(gradeSearchQuery.toLowerCase()) ||
                                    (item.teacher_name && item.teacher_name.toLowerCase().includes(gradeSearchQuery.toLowerCase()))
                                  );

                                  return (
                                    <td
                                      key={cls}
                                      onClick={() => setSelectedLessonDetail({ ...item, day, period: p })}
                                      style={{
                                        ...styles.td,
                                        borderLeft: '1px solid #e2e8f0',
                                        backgroundColor: isMatched ? '#fef08a' : sTheme.bg,
                                        transition: 'background-color 0.2s',
                                        padding: '6px 8px',
                                        cursor: 'pointer',
                                        verticalAlign: 'middle'
                                      }}
                                    >
                                      <div style={{
                                        fontWeight: '800',
                                        color: isMatched ? '#854d0e' : sTheme.text,
                                        fontSize: '12px',
                                        lineHeight: '1.25',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        <span style={{ fontSize: '13px' }}>{sTheme.icon}</span>
                                        <span>{item.subject}</span>
                                      </div>
                                      <div style={{
                                        fontSize: '11px',
                                        color: isMatched ? '#713f12' : '#475569',
                                        marginTop: '2px',
                                        fontWeight: '600',
                                        lineHeight: '1.2',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {item.teacher_name || '-'}
                                      </div>
                                    </td>
                                  );
                                })}

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* OFFICIAL PRINT SIGNATURES (ND 30) */}
            <div className="print-only" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '0 40px', fontSize: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>BAN GIÁM HIỆU DUYỆT</div>
                <div style={{ height: '50px' }}></div>
                <div style={{ fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>NGƯỜI LẬP BẢNG TỔNG HỢP</div>
                <div style={{ height: '50px' }}></div>
                <div style={{ fontStyle: 'italic' }}>Ban Chuyên Môn THPT Cao Bá Quát</div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* INTERACTIVE LESSON DETAIL MODAL */}
      {selectedLessonDetail && (() => {
        const dTheme = getSubjectTheme(selectedLessonDetail.subject);
        const timing = PERIOD_TIMINGS.find(pt => pt.period === Number(selectedLessonDetail.period));

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '460px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: `2px solid ${dTheme.border}` }}>
              
              {/* MODAL HEADER */}
              <div style={{ backgroundColor: dTheme.bg, borderBottom: `1px solid ${dTheme.border}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '32px' }}>{dTheme.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: dTheme.text }}>
                      {selectedLessonDetail.subject}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Thông tin tiết học chi tiết
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLessonDetail(null)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '16px' }}
                >
                  ✕
                </button>
              </div>

              {/* MODAL BODY */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Ngày học</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                      {selectedLessonDetail.day || selectedLessonDetail.day_of_week}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Tiết & Ca học</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                      Tiết {selectedLessonDetail.period} ({timing?.session || (Number(selectedLessonDetail.period) <= 5 ? 'Sáng' : 'Chiều')})
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Thời gian tiết học</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0284c7', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} />
                    <span>{timing?.time || `${timing?.start} - ${timing?.end}`}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase' }}>Lớp học</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#1d4ed8', marginTop: '2px' }}>
                      {selectedLessonDetail.student_class}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 'bold', textTransform: 'uppercase' }}>Giáo viên bộ môn</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#047857', marginTop: '2px' }}>
                      {selectedLessonDetail.teacher_name || 'Đang cập nhật'}
                    </div>
                  </div>
                </div>

                {/* HELPFUL NOTE */}
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', fontSize: '12.5px', color: '#92400e', lineHeight: '1.4' }}>
                  💡 <strong>Gợi ý học sinh:</strong> Chuẩn bị đầy đủ SGK, vở ghi môn <strong>{selectedLessonDetail.subject}</strong> và đồ dùng học tập trước giờ vào lớp!
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedLessonDetail(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Đã hiểu & Đóng
                </button>
              </div>

            </div>
          </div>
        );
      })()}


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
