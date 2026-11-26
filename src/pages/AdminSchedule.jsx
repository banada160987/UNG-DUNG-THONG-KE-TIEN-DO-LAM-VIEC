import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase, supabase2, supabase2Admin, supabaseAdmin } from '../lib/supabase';
import { 
  Calendar, Plus, Save, Trash2, Edit3, Eye, Clock, MapPin, CheckCircle2, 
  RefreshCw, Upload, Download, FileSpreadsheet, Users, BookOpen, Search, ShieldCheck,
  Share2, Check, Link as LinkIcon, Zap, Sparkles, Lock, Unlock, Play, Sliders, Layers, 
  Grid, AlertTriangle, CheckCircle, Info, FileText, CheckCheck, Undo2, ChevronRight, Filter, Settings, Sun, Moon, Pin
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  ROMAN_NUMERALS,
  DEFAULT_WEEK5_APPENDIX
} from '../utils/decree30ScheduleWord';
import { parseWeeklyScheduleText, SAMPLE_WEEK_5_TEXT } from '../utils/scheduleParser';
import {
  DAYS,
  PERIODS_MORNING,
  PERIODS_AFTERNOON,
  PERIODS_ALL,
  TEACHER_FULL_MAP,
  getFullTeacherName,
  normalizeClassCode,
  isValidStudentClass
} from '../utils/timetableHelpers';
import { DEFAULT_PERIOD_TIMINGS, getStoredPeriodTimings } from './PublicSchedule';
import { saveTimetableConfigToCloud, fetchTimetableConfigFromCloud } from '../utils/timetableConfigSync';
import { safeSetItem, safeGetItem, cleanStorageQuota, getStorageUsage } from '../utils/safeStorage';

export const PRESET_TIMINGS_STANDARD = [
  { period: 1, session: 'Sáng', start: '07:00', end: '07:45', label: 'Tiết 1 (07:00 - 07:45)' },
  { period: 2, session: 'Sáng', start: '07:45', end: '08:30', label: 'Tiết 2 (07:45 - 08:30)' },
  { period: 3, session: 'Sáng', start: '08:45', end: '09:30', label: 'Tiết 3 (08:45 - 09:30)' },
  { period: 4, session: 'Sáng', start: '09:30', end: '10:15', label: 'Tiết 4 (09:30 - 10:15)' },
  { period: 5, session: 'Sáng', start: '10:20', end: '11:05', label: 'Tiết 5 (10:20 - 11:05)' },
  { period: 6, session: 'Chiều', start: '13:00', end: '13:45', label: 'Tiết 6 (13:00 - 13:45)' },
  { period: 7, session: 'Chiều', start: '13:45', end: '14:30', label: 'Tiết 7 (13:45 - 14:30)' },
  { period: 8, session: 'Chiều', start: '14:30', end: '15:15', label: 'Tiết 8 (14:30 - 15:15)' },
  { period: 9, session: 'Chiều', start: '15:30', end: '16:15', label: 'Tiết 9 (15:30 - 16:15)' },
  { period: 10, session: 'Chiều', start: '16:20', end: '17:05', label: 'Tiết 10 (16:20 - 17:05)' }
];

export const PRESET_TIMINGS_WINTER = [
  { period: 1, session: 'Sáng', start: '07:15', end: '08:00', label: 'Tiết 1 (07:15 - 08:00)' },
  { period: 2, session: 'Sáng', start: '08:05', end: '08:50', label: 'Tiết 2 (08:05 - 08:50)' },
  { period: 3, session: 'Sáng', start: '09:05', end: '09:50', label: 'Tiết 3 (09:05 - 09:50)' },
  { period: 4, session: 'Sáng', start: '09:55', end: '10:40', label: 'Tiết 4 (09:55 - 10:40)' },
  { period: 5, session: 'Sáng', start: '10:45', end: '11:30', label: 'Tiết 5 (10:45 - 11:30)' },
  { period: 6, session: 'Chiều', start: '13:30', end: '14:15', label: 'Tiết 6 (13:30 - 14:15)' },
  { period: 7, session: 'Chiều', start: '14:20', end: '15:05', label: 'Tiết 7 (14:20 - 15:05)' },
  { period: 8, session: 'Chiều', start: '15:20', end: '16:05', label: 'Tiết 8 (15:20 - 16:05)' },
  { period: 9, session: 'Chiều', start: '16:10', end: '16:55', label: 'Tiết 9 (16:10 - 16:55)' },
  { period: 10, session: 'Chiều', start: '17:00', end: '17:45', label: 'Tiết 10 (17:00 - 17:45)' }
];

export const PRESET_TIMINGS_SHORT = [
  { period: 1, session: 'Sáng', start: '07:30', end: '08:05', label: 'Tiết 1 (07:30 - 08:05)' },
  { period: 2, session: 'Sáng', start: '08:10', end: '08:45', label: 'Tiết 2 (08:10 - 08:45)' },
  { period: 3, session: 'Sáng', start: '09:00', end: '09:35', label: 'Tiết 3 (09:00 - 09:35)' },
  { period: 4, session: 'Sáng', start: '09:40', end: '10:15', label: 'Tiết 4 (09:40 - 10:15)' },
  { period: 5, session: 'Sáng', start: '10:20', end: '10:55', label: 'Tiết 5 (10:20 - 10:55)' },
  { period: 6, session: 'Chiều', start: '13:45', end: '14:20', label: 'Tiết 6 (13:45 - 14:20)' },
  { period: 7, session: 'Chiều', start: '14:25', end: '15:00', label: 'Tiết 7 (14:25 - 15:00)' },
  { period: 8, session: 'Chiều', start: '15:15', end: '15:50', label: 'Tiết 8 (15:15 - 15:50)' },
  { period: 9, session: 'Chiều', start: '15:55', end: '16:30', label: 'Tiết 9 (15:55 - 16:30)' },
  { period: 10, session: 'Chiều', start: '16:35', end: '17:10', label: 'Tiết 10 (16:35 - 17:10)' }
];


export default function AdminSchedule() {
  const [searchParams] = useSearchParams();

const [activeTab, setActiveTab] = useState('bgh_schedule'); // 'bgh_schedule' | 'timetable_excel'
  const [schedules, setSchedules] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Copy BGH & Public Link State
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  // Multi-Week / 35-Week Flexible Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState('single'); // 'single' | 'all35' | 'term1' | 'term2' | 'custom'
  const [fromWeek, setFromWeek] = useState(1);
  const [toWeek, setToWeek] = useState(35);

  // Admin Link Generator State
  const [shareType, setShareType] = useState('class'); // 'class' | 'teacher'
  const [shareClass, setShareClass] = useState('10A01');
  const [shareTeacher, setShareTeacher] = useState('');
  const [adminCopied, setAdminCopied] = useState(false);

  // 35 Weeks Generator (Năm học 2026 - 2027)
  const schoolWeeks = getSchoolWeeks2026();
  const [selectedWeekNo, setSelectedWeekNo] = useState(1);

  // Form State for BGH Schedule & Decree 30 Export
  const [title, setTitle] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRangeStr, setDateRangeStr] = useState('');
  const [releaseDateStr, setReleaseDateStr] = useState('');
  const [bghDuty, setBghDuty] = useState('');
  const [teacherDuty, setTeacherDuty] = useState('');
  const [note, setNote] = useState('*Lưu ý: - Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, các bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo lãnh đạo trường để thực hiện./.');
  const [recipients, setRecipients] = useState('Nơi nhận:\n- GV, NV (để t/h);\n- Các Tổ chuyên môn thuộc trường;\n- HT, các PHT;\n- Đăng Web, Zalo;\n- Lưu: VT, TK.');
  const [signerName, setSignerName] = useState('Lê Thị Thảo');
  const [signerTitle, setSignerTitle] = useState('HIỆU TRƯỜNG');
  const [isActive, setIsActive] = useState(true);
  const [dayItems, setDayItems] = useState([]);
  const [attachedPdfUrl, setAttachedPdfUrl] = useState('');
  const [attachedPdfName, setAttachedPdfName] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showSmartImportModal, setShowSmartImportModal] = useState(false);
  const [smartImportText, setSmartImportText] = useState('');
  
  // Phụ lục & Lịch bổ sung phát sinh trong tuần
  const [appendixItems, setAppendixItems] = useState([]);
  const [editingAppendixIndex, setEditingAppendixIndex] = useState(null);
  const [showAddAppendixModal, setShowAddAppendixModal] = useState(false);
  const [newAppendixItem, setNewAppendixItem] = useState({
    time: '',
    content: '',
    location: '',
    chair: '',
    participants: '',
    tag: 'Bổ sung khẩn',
    type: 'urgent',
    note: ''
  });

  // Excel TKB State
  const [excelPreview, setExcelPreview] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // --- PRO SCHEDULER (AI) STATE ---
  
const [showTkbMetaModal, setShowTkbMetaModal] = useState(false);
  const [tkbMetadata, setTkbMetadata] = useState(() => {
    try {
      const saved = localStorage.getItem('cbq_timetable_metadata');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      version: 'Số 01',
      applyDate: '01/09/2026',
      semester: 'Học kỳ I',
      schoolYear: '2026 - 2027',
      decisionNo: '15/QĐ-THPTCBQ',
      note: 'Áp dụng chính thức cho toàn trường'
    };
  });
  const [editingTkbMeta, setEditingTkbMeta] = useState(() => {
    try {
      const saved = localStorage.getItem('cbq_timetable_metadata');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      version: 'Số 01',
      applyDate: '01/09/2026',
      semester: 'Học kỳ I',
      schoolYear: '2026 - 2027',
      decisionNo: '15/QĐ-THPTCBQ',
      note: 'Áp dụng chính thức cho toàn trường'
    };
  });

  // Khung Giờ Tiết Học (Period Timings) State
  const [periodTimings, setPeriodTimings] = useState(() => getStoredPeriodTimings());
  const [showPeriodTimingsModal, setShowPeriodTimingsModal] = useState(false);
  const [editingPeriodTimings, setEditingPeriodTimings] = useState(() => getStoredPeriodTimings());
  const [autoMorningStart, setAutoMorningStart] = useState('07:00');
  const [autoAfternoonStart, setAutoAfternoonStart] = useState('13:30');
  const [autoDuration, setAutoDuration] = useState(45);
  const [autoBreak, setAutoBreak] = useState(15);

  useEffect(() => {
    const handleTimingsSync = () => {
      const latest = getStoredPeriodTimings();
      setPeriodTimings(latest);
    };
    window.addEventListener('storage', handleTimingsSync);
    window.addEventListener('cbq_period_timings_updated', handleTimingsSync);
    return () => {
      window.removeEventListener('storage', handleTimingsSync);
      window.removeEventListener('cbq_period_timings_updated', handleTimingsSync);
    };
  }, []);

  
useEffect(() => {
    fetchSchedules();
    fetchTimetableData();
    fetchStudentRegistrations();
  }, []);

  const fetchStudentRegistrations = async () => {
    try {
      const client = supabase2Admin || supabaseAdmin || supabase2 || supabase;
      const [clubRes, tuitionRes] = await Promise.all([
        client.from('cbq_student_registrations').select('*').eq('campaign_id', 'f49de727-f109-4b95-88e8-a68c21741ebd'),
        client.from('cbq_student_registrations').select('*').eq('campaign_id', 'dd06f624-3aed-4eea-bec5-401e43979aa0')
      ]);

      if (!clubRes.error && clubRes.data && clubRes.data.length > 0) {
        setStudentRegistrations(clubRes.data);
        localStorage.setItem('cbq_student_registrations', JSON.stringify(clubRes.data));
      }
      if (!tuitionRes.error && tuitionRes.data && tuitionRes.data.length > 0) {
        setStudentTuitionRegistrations(tuitionRes.data);
        localStorage.setItem('cbq_student_tuition_registrations', JSON.stringify(tuitionRes.data));
      }
    } catch (err) {
      console.warn("Lỗi nạp đăng ký học sinh:", err);
    }
  };

  const handleSyncClubsFromDatabase = async () => {
    try {
      const client = supabase2Admin || supabaseAdmin || supabase2 || supabase;
      const [clubRes, tuitionRes] = await Promise.all([
        client.from('cbq_student_registrations').select('*').eq('campaign_id', 'f49de727-f109-4b95-88e8-a68c21741ebd'),
        client.from('cbq_student_registrations').select('*').eq('campaign_id', 'dd06f624-3aed-4eea-bec5-401e43979aa0')
      ]);

      const targetClubRegs = (clubRes.data && clubRes.data.length > 0) ? clubRes.data : studentRegistrations;
      const targetTuitionRegs = (tuitionRes.data && tuitionRes.data.length > 0) ? tuitionRes.data : studentTuitionRegistrations;

      if (targetClubRegs && targetClubRegs.length > 0) {
        setStudentRegistrations(targetClubRegs);
        localStorage.setItem('cbq_student_registrations', JSON.stringify(targetClubRegs));
      }
      if (targetTuitionRegs && targetTuitionRegs.length > 0) {
        setStudentTuitionRegistrations(targetTuitionRegs);
        localStorage.setItem('cbq_student_tuition_registrations', JSON.stringify(targetTuitionRegs));
      }

      // 1. Đồng bộ 7 Câu Lạc Bộ Thực Tế
      const clubMap = {
        '1) Câu lạc bộ Tiếng Anh': {
          id: 'act_clb_1_tieng_anh',
          name: '1) Câu lạc bộ Tiếng Anh',
          type: 'club',
          category: 'Câu lạc bộ Học thuật',
          teacher_name: 'Phạm Thị Thu Hiền (AV)',
          room: 'Phòng Lab Ngoại ngữ',
          periods_per_week: 2,
          color: '#6366f1',
          badge: '🗣️ CLB Tiếng Anh',
          classes: new Set()
        },
        '2) Câu lạc bộ Thể duc - Thể thao': {
          id: 'act_clb_2_the_thao',
          name: '2) Câu lạc bộ Thể dục - Thể thao',
          type: 'club',
          category: 'Câu lạc bộ Thể thao',
          teacher_name: 'Hồ Anh Tuấn',
          room: 'Nhà thi đấu Đa năng & Sân bóng',
          periods_per_week: 2,
          color: '#16a34a',
          badge: '⚽ CLB Thể thao',
          classes: new Set()
        },
        '3) Câu lạc bộ Văn nghệ - Mĩ thuật': {
          id: 'act_clb_3_van_nghe',
          name: '3) Câu lạc bộ Văn nghệ - Mĩ thuật',
          type: 'club',
          category: 'Câu lạc bộ Nghệ thuật',
          teacher_name: 'Phan Thị Hòa',
          room: 'Hội trường & Phòng Mỹ thuật',
          periods_per_week: 2,
          color: '#ec4899',
          badge: '🎨 CLB Văn nghệ - MT',
          classes: new Set()
        },
        '4) Câu lạc bộ STEM - STEAM - Khoa học kĩ thuật - Khởi nghiệp ': {
          id: 'act_clb_4_stem',
          name: '4) Câu lạc bộ STEM - STEAM - Khoa học kĩ thuật - Khởi nghiệp',
          type: 'club',
          category: 'Câu lạc bộ Kỹ năng',
          teacher_name: 'Lương Thị Kim Thu',
          room: 'Phòng Máy tính 1 (STEM)',
          periods_per_week: 2,
          color: '#0284c7',
          badge: '🚀 CLB STEM',
          classes: new Set()
        },
        '5) Câu lạc bộ Truyền thông và Cộng đồng': {
          id: 'act_clb_5_truyen_thong',
          name: '5) Câu lạc bộ Truyền thông và Cộng đồng',
          type: 'club',
          category: 'Câu lạc bộ Kỹ năng',
          teacher_name: 'Lê Thị Hồng Nhung',
          room: 'Phòng Studio Truyền thông',
          periods_per_week: 2,
          color: '#059669',
          badge: '📢 CLB Truyền thông',
          classes: new Set()
        },
        '6) Câu lạc bộ Ứng dụng AI': {
          id: 'act_clb_6_ai',
          name: '6) Câu lạc bộ Ứng dụng AI',
          type: 'club',
          category: 'Câu lạc bộ Kỹ năng',
          teacher_name: 'Võ Xe',
          room: 'Phòng Máy tính 2',
          periods_per_week: 2,
          color: '#7c3aed',
          badge: '🤖 CLB Ứng dụng AI',
          classes: new Set()
        },
        '7) Câu lạc bộ Phát triển kĩ năng - Khai phá tư duy': {
          id: 'act_clb_7_tu_duy',
          name: '7) Câu lạc bộ Phát triển kĩ năng - Khai phá tư duy',
          type: 'club',
          category: 'Câu lạc bộ Kỹ năng',
          teacher_name: 'Trương Thị Hoàng Lam',
          room: 'Phòng Chuyên đề 1',
          periods_per_week: 2,
          color: '#d97706',
          badge: '💡 CLB Khai phá tư duy',
          classes: new Set()
        }
      };

      (targetClubRegs || []).forEach(r => {
        const resp = r.responses || {};
        const cName = r.student_class;
        if (!cName) return;
        Object.values(resp).forEach(val => {
          const arr = Array.isArray(val) ? val : [val];
          arr.forEach(clubStr => {
            if (!clubStr) return;
            Object.keys(clubMap).forEach(k => {
              if (clubStr.includes(k) || k.includes(clubStr)) {
                clubMap[k].classes.add(cName);
              }
            });
          });
        });
      });

      const syncedClubs = Object.values(clubMap).map(c => ({
        ...c,
        target_classes: Array.from(c.classes).sort()
      }));

      // 2. Lấy 10 Lớp Học Thêm Khối 12 chuẩn
      const defaultTuition = (DEFAULT_EXTRACURRICULAR_ACTIVITIES || []).filter(a => a.type === 'tuition');
      // Bổ sung lớp mục tiêu thực tế từ 119 học sinh
      (targetTuitionRegs || []).forEach(r => {
        const resp = r.responses || {};
        const cName = r.student_class;
        if (!cName) return;
        const subjects = resp.field_tuition_subjects || [];
        subjects.forEach(subj => {
          defaultTuition.forEach(tc => {
            if (tc.subject && subj.includes(tc.subject)) {
              if (!tc.target_classes.includes(cName)) {
                tc.target_classes.push(cName);
              }
            }
          });
        });
      });

      // 3. Đội tuyển HSG
      const hsgTeams = (DEFAULT_EXTRACURRICULAR_ACTIVITIES || []).filter(a => a.type === 'hsg');

      const finalActivities = [...defaultTuition, ...syncedClubs, ...hsgTeams];

      setExtracurricularActivities(finalActivities);
      localStorage.setItem('cbq_extracurricular_activities', JSON.stringify(finalActivities));

      alert(`🎉 ĐÃ ĐỒNG BỘ TOÀN DIỆN THÀNH CÔNG TỪ SUPABASE:\n- ${syncedClubs.length} Câu Lạc Bộ (${targetClubRegs.length} lượt học sinh đăng ký)\n- ${defaultTuition.length} Lớp Học Thêm Khối 12 GDPT 2018 (${targetTuitionRegs.length} học sinh)\n- ${hsgTeams.length} Đội Tuyển Bồi Dưỡng HSG\n- Tự động kích hoạt cơ chế cách ly chống trùng giờ cho 113 học sinh (95%) học cả 2 hoạt động!`);
    } catch (err) {
      alert("Lỗi đồng bộ: " + err.message);
    }
  };

  async function fetchSchedules() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_schedules')
        .select('*')
        .order('week_number', { ascending: false });

      if (!error && data) {
        setSchedules(data);
      }
    } catch (err) {
      console.error("Lỗi nạp lịch công tác:", err);
    } finally {
      setLoading(false);
    }
  }

  const processRawTimetableItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items
      .filter(item => isValidStudentClass(item.student_class))
      .map(item => ({
        ...item,
        student_class: normalizeClassCode(item.student_class),
        teacher_name: getFullTeacherName(item.teacher_name, item.subject)
      }));
  };

  async function fetchTimetableData() {
    try {
      const client = supabase2 || supabase;

      // 1. Tải cấu hình thời khóa biểu & khung giờ 10 tiết độc lập từ Supabase
      try {
        const cloudConfig = await fetchTimetableConfigFromCloud();
        if (cloudConfig.metadata && cloudConfig.metadata.applyDate) {
          setTkbMetadata(cloudConfig.metadata);
          setEditingTkbMeta(cloudConfig.metadata);
          localStorage.setItem('cbq_timetable_metadata', JSON.stringify(cloudConfig.metadata));
        }
        if (cloudConfig.periodTimings && Array.isArray(cloudConfig.periodTimings) && cloudConfig.periodTimings.length > 0) {
          setPeriodTimings(cloudConfig.periodTimings);
          setEditingPeriodTimings(cloudConfig.periodTimings);
          localStorage.setItem('cbq_period_timings', JSON.stringify(cloudConfig.periodTimings));
        }
      } catch (cfgErr) {
        console.warn("Lỗi đọc cấu hình TKB từ DB:", cfgErr);
      }

      // 2. Tải thời khóa biểu các lớp (loại trừ các bản ghi cấu hình)
      const { data, error } = await client
        .from('cbq_timetable_items')
        .select('*')
        .not('student_class', 'in', '("CONFIG_META","CONFIG_TIMINGS","CONFIG_PERIOD")')
        .range(0, 1999)
        .order('student_class', { ascending: true });

      let finalTimetable = [];
      if (!error && data && data.length > 0) {
        finalTimetable = processRawTimetableItems(data);
        setTimetableData(finalTimetable);
        safeSetItem('cbq_master_timetable', finalTimetable);
      } else {
        const cached = safeGetItem('cbq_master_timetable');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : parsed?.data?.length > 0)) {
              finalTimetable = processRawTimetableItems(Array.isArray(parsed) ? parsed : parsed.data);
            } else {
              finalTimetable = processRawTimetableItems(masterTimetableData);
            }
          } catch (_) {
            finalTimetable = processRawTimetableItems(masterTimetableData);
          }
        } else {
          finalTimetable = processRawTimetableItems(masterTimetableData);
        }
        setTimetableData(finalTimetable);
        safeSetItem('cbq_master_timetable', finalTimetable);
      }

      // Tự động trích xuất và đồng bộ phân công chuyên môn cho toàn bộ 34 lớp
      if (finalTimetable && finalTimetable.length > 0) {
        const cachedAsgs = safeGetItem('cbq_teaching_assignments');
        if (!cachedAsgs || JSON.parse(cachedAsgs).length === 0) {
          const extracted = extractAssignmentsFromTimetable(finalTimetable);
          setTeachingAssignments(extracted);
          safeSetItem('cbq_teaching_assignments', extracted);
        } else {
          try {
            setTeachingAssignments(JSON.parse(cachedAsgs));
          } catch(e) {
            const extracted = extractAssignmentsFromTimetable(finalTimetable);
            setTeachingAssignments(extracted);
            safeSetItem('cbq_teaching_assignments', extracted);
          }
        }
      }
    } catch (err) {
      console.warn("Lỗi tải TKB từ Cloud, chuyển sang bộ nhớ đệm cục bộ:", err);
      const cached = safeGetItem('cbq_master_timetable');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const rawItems = Array.isArray(parsed) ? parsed : parsed?.data || [];
          const processed = processRawTimetableItems(rawItems);
          setTimetableData(processed);
          const extracted = extractAssignmentsFromTimetable(processed);
          setTeachingAssignments(extracted);
          return;
        } catch (_) {}
      }
      const fallback = processRawTimetableItems(masterTimetableData);
      setTimetableData(fallback);
      const extracted = extractAssignmentsFromTimetable(fallback);
      setTeachingAssignments(extracted);
    }
  }

  useEffect(() => {
    const weekParam = searchParams.get('week');
    if (weekParam && Number(weekParam) >= 1 && Number(weekParam) <= 35) {
      const wNum = Number(weekParam);
      if (wNum !== selectedWeekNo) {
        handleSelectWeek(wNum);
      }
    }
  }, [searchParams, schedules]);

  
const handleCopyAdminEditLink = () => {
    const editUrl = `${window.location.origin}/nhap-lich-bgh?week=${selectedWeekNo}`;
    navigator.clipboard.writeText(editUrl).then(() => {
      setCopiedAdminLink(true);
      setTimeout(() => setCopiedAdminLink(false), 2500);
    });
  };

  const handleCopyPublicViewLink = () => {
    const publicUrl = `${window.location.origin}/lich-cong-tac?week=${selectedWeekNo}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 2500);
    });
  };

  // --- 35 WEEKS BGH SCHEDULE ACTIONS ---
  const handleSelectWeek = (wNo) => {
    const wNum = Number(wNo) || 1;
    setSelectedWeekNo(wNum);
    setSearchParams({ week: wNum }, { replace: true });
    const targetWeek = schoolWeeks[wNum - 1] || schoolWeeks[0];

    // Check if this week is already saved in DB or local
    const existing = schedules.find(s => Number(s.week_number) === wNum);

    if (existing) {
      setEditingId(existing.id);
      const rawItems = existing.day_items || existing.schedule_items || [];
      const metaObj = Array.isArray(rawItems) ? (rawItems.find(i => i && i._is_meta) || {}) : (rawItems?.meta || {});
      const cleanDayItems = Array.isArray(rawItems)
        ? rawItems.filter(i => i && !i._is_meta && i.day_name)
        : (rawItems?.items || getDefaultScheduleDays(targetWeek));

      setTitle(existing.title || targetWeek.title);
      setWeekNumber(wNum);
      setStartDate(existing.start_date || targetWeek.start_date);
      setEndDate(existing.end_date || targetWeek.end_date);
      setDateRangeStr(existing.date_range_str || metaObj.date_range_str || targetWeek.date_range_str);
      setReleaseDateStr(existing.release_date_str || metaObj.release_date_str || (wNum === 5 ? 'Cư Kuin, ngày 04 tháng 10 năm 2026' : targetWeek.release_date_str));
      setBghDuty(existing.bgh_duty || (wNum === 5 ? 'Thầy Lam & Cô Thảo (Trực chỉ đạo)' : ''));
      setTeacherDuty(existing.teacher_duty || (wNum === 5 ? 'Đoàn Thanh niên & Tổ Văn phòng (Trực ban)' : ''));
      setNote(existing.note || (wNum === 5 ? '*Lưu ý:\n- Đoàn trường phối hợp với Thư viện tổ chức hoạt động tuyên truyền Tuần lễ hưởng ứng học tập suốt đời năm 2026 trong giờ Chào cờ;\n- Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo Lãnh đạo trường để thực hiện./.' : '*Lưu ý: - Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, các bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo lãnh đạo trường để thực hiện./.'));
      setRecipients(existing.recipients || metaObj.recipients || 'Nơi nhận:\n- GV, NV (để t/h);\n- Các Tổ chuyên môn thuộc trường;\n- HT, các PHT;\n- Đăng Web, Zalo;\n- Lưu: VT, TK.');
      setSignerName(existing.signer_name || metaObj.signer_name || 'Lê Thị Thảo');
      setSignerTitle(existing.signer_title || metaObj.signer_title || 'HIỆU TRƯỜNG');
      setAttachedPdfUrl(existing.attached_pdf_url || metaObj.attached_pdf_url || (wNum === 5 ? '/schedules/Lich_Cong_Tac_Tuan_05_THPT_Cao_Ba_Quat.pdf' : ''));
      setAttachedPdfName(existing.attached_pdf_name || metaObj.attached_pdf_name || (wNum === 5 ? 'Lich_Cong_Tac_Tuan_05_THPT_Cao_Ba_Quat.pdf' : ''));
      const rawAppendix = existing.appendix_items !== undefined ? existing.appendix_items : metaObj.appendix_items;
      setAppendixItems(Array.isArray(rawAppendix) ? rawAppendix : (wNum === 5 && !metaObj.appendix_configured ? DEFAULT_WEEK5_APPENDIX : []));
      setEditingAppendixIndex(null);
      setIsActive(existing.is_active ?? true);
      setDayItems(cleanDayItems.length > 0 ? cleanDayItems : getDefaultScheduleDays(targetWeek));
    } else {
      setEditingId(null);
      setTitle(targetWeek.title);
      setWeekNumber(wNum);
      setStartDate(targetWeek.start_date);
      setEndDate(targetWeek.end_date);
      setDateRangeStr(targetWeek.date_range_str);
      setReleaseDateStr(wNum === 5 ? 'Cư Kuin, ngày 04 tháng 10 năm 2026' : targetWeek.release_date_str);
      setBghDuty(wNum === 5 ? 'Thầy Lam & Cô Thảo (Trực chỉ đạo)' : '');
      setTeacherDuty(wNum === 5 ? 'Đoàn Thanh niên & Tổ Văn phòng (Trực ban)' : '');
      setNote(wNum === 5 ? '*Lưu ý:\n- Đoàn trường phối hợp với Thư viện tổ chức hoạt động tuyên truyền Tuần lễ hưởng ứng học tập suốt đời năm 2026 trong giờ Chào cờ;\n- Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo Lãnh đạo trường để thực hiện./.' : '*Lưu ý: - Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, các bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo lãnh đạo trường để thực hiện./.');
      setRecipients('Nơi nhận:\n- GV, NV (để t/h);\n- Các Tổ chuyên môn thuộc trường;\n- HT, các PHT;\n- Đăng Web, Zalo;\n- Lưu: VT, TK.');
      setSignerName('Lê Thị Thảo');
      setSignerTitle('HIỆU TRƯỜNG');
      setAttachedPdfUrl(wNum === 5 ? '/schedules/Lich_Cong_Tac_Tuan_05_THPT_Cao_Ba_Quat.pdf' : '');
      setAttachedPdfName(wNum === 5 ? 'Lich_Cong_Tac_Tuan_05_THPT_Cao_Ba_Quat.pdf' : '');
      setAppendixItems(wNum === 5 ? DEFAULT_WEEK5_APPENDIX : []);
      setEditingAppendixIndex(null);
      setIsActive(true);
      setDayItems(getDefaultScheduleDays(targetWeek));
    }
  };

  useEffect(() => {
    handleSelectWeek(1);
  }, [schedules]);

  const handleUpdateDayItem = (index, field, value) => {
    const updated = [...dayItems];
    updated[index] = { ...updated[index], [field]: value };
    setDayItems(updated);
  };

  const handleResetDefaultTemplate = () => {
    const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
    setDayItems(getDefaultScheduleDays(targetWeek));
  };

  const handleExportWordDecree30 = () => {
    const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
    const payload = {
      week_number: selectedWeekNo,
      title: title || targetWeek.title,
      subtitle: dateRangeStr || targetWeek.date_range_str,
      release_date_str: releaseDateStr || targetWeek.release_date_str,
      note,
      recipients,
      signer_name: signerName,
      signer_title: signerTitle,
      day_items: dayItems
    };
    exportScheduleToWordDecree30(payload);
  };

  const handleExecuteExport = () => {
    if (exportMode === 'single') {
      handleExportWordDecree30();
      setShowExportModal(false);
      return;
    }

    if (exportMode === 'month') {
      const schoolMonths = getSchoolMonths2026();
      const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
      const mon = new Date(targetWeek.monday).getMonth() + 1;
      const mIdx = Math.max(0, schoolMonths.findIndex(m => m.month === mon));
      const mData = aggregateMonthlyPlanFromWeeks(mIdx + 1, schoolWeeks, schedules);
      exportMonthlyPlanToWordDecree30(mData);
      setShowExportModal(false);
      return;
    }

    if (exportMode === 'year') {
      const yData = aggregateYearlyPlanFromMonths(schoolWeeks, schedules);
      exportYearlyPlanToWordDecree30(yData);
      setShowExportModal(false);
      return;
    }

    let targetRange = [];
    let customName = '';

    if (exportMode === 'all35') {
      for (let w = 1; w <= 35; w++) targetRange.push(w);
      customName = `1-Lich_Cong_Tac_Full_35_Tuan_THPT_CaoBaQuat.doc`;
    } else if (exportMode === 'term1') {
      for (let w = 1; w <= 18; w++) targetRange.push(w);
      customName = `1-Lich_Cong_Tac_Hoc_Ky_I_Tu_Tuan_1_den_18_THPT_CaoBaQuat.doc`;
    } else if (exportMode === 'term2') {
      for (let w = 19; w <= 35; w++) targetRange.push(w);
      customName = `1-Lich_Cong_Tac_Hoc_Ky_II_Tu_Tuan_19_den_35_THPT_CaoBaQuat.doc`;
    } else if (exportMode === 'custom') {
      const start = Math.min(Number(fromWeek), Number(toWeek));
      const end = Math.max(Number(fromWeek), Number(toWeek));
      for (let w = start; w <= end; w++) targetRange.push(w);
      customName = `1-Lich_Cong_Tac_Tu_Tuan_${start}_den_Tuan_${end}_THPT_CaoBaQuat.doc`;
    }

    const list = targetRange.map(wNo => {
      if (wNo === Number(selectedWeekNo)) {
        const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
        return {
          week_number: selectedWeekNo,
          title: title || targetWeek.title,
          subtitle: dateRangeStr || targetWeek.date_range_str,
          release_date_str: releaseDateStr || targetWeek.release_date_str,
          note,
          recipients,
          signer_name: signerName,
          signer_title: signerTitle,
          day_items: dayItems
        };
      }
      return getScheduleDataForWeek(wNo, schedules);
    });

    exportMultipleSchedulesToWordDecree30(list, customName);
    setShowExportModal(false);
  };

  const handleUploadPdfFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert("⚠️ Vui lòng chọn tệp có định dạng .PDF!");
      return;
    }

    setUploadingPdf(true);
    try {
      const client = supabaseAdmin || supabase2Admin || supabase;
      const fileExt = 'pdf';
      const fileName = `week_${selectedWeekNo}_lich_tuan_${Date.now()}.${fileExt}`;
      const filePath = `schedules/${fileName}`;

      const { data, error } = await client.storage
        .from('documents')
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.warn("Storage upload error, using local/base64 fallback:", error);
        const reader = new FileReader();
        reader.onload = (uploadEvt) => {
          setAttachedPdfUrl(uploadEvt.target.result);
          setAttachedPdfName(file.name);
          alert(`✅ Đã đính kèm tệp PDF: "${file.name}"!\nVui lòng bấm nút 'Lưu Lịch Tuần Này' để hoàn tất.`);
        };
        reader.readAsDataURL(file);
      } else {
        const { data: pubData } = client.storage.from('documents').getPublicUrl(filePath);
        const publicUrl = pubData?.publicUrl || '';
        setAttachedPdfUrl(publicUrl);
        setAttachedPdfName(file.name);
        alert(`🎉 Đã tải lên và đính kèm bản PDF scan gốc: "${file.name}" thành công!\nĐường dẫn công khai đã sẵn sàng. Vui lòng bấm 'Lưu Lịch Tuần Này' để hoàn tất.`);
      }
    } catch (err) {
      alert("Lỗi khi tải file PDF: " + err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleApplySmartImport = () => {
    if (!smartImportText || !smartImportText.trim()) {
      alert("Vui lòng dán văn bản trích xuất từ file PDF lịch tuần!");
      return;
    }
    const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
    const parsed = parseWeeklyScheduleText(smartImportText, targetWeek);
    if (!parsed || !parsed.day_items || parsed.day_items.length === 0) {
      alert("⚠️ Không thể trích xuất các ngày. Vui lòng kiểm tra lại văn bản hoặc bấm 'Dán Mẫu Tuần 5' để xem cú pháp chuẩn!");
      return;
    }

    setDayItems(parsed.day_items);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.date_range_str) setDateRangeStr(parsed.date_range_str);
    if (parsed.release_date_str) setReleaseDateStr(parsed.release_date_str);
    if (parsed.note) setNote(parsed.note);
    if (parsed.recipients) setRecipients(parsed.recipients);
    if (parsed.signer_name) setSignerName(parsed.signer_name);

    setShowSmartImportModal(false);
    alert(`🎉 ĐÃ BÓC TÁCH THÀNH CÔNG ${parsed.day_items.length} BUỔI LỊCH CHO TUẦN ${selectedWeekNo}!\nToàn bộ dữ liệu từ Thứ 2 đến Chủ Nhật đã được tự động điền vào bảng.`);
  };

  const handleSubmitBghSchedule = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
      const metaObj = {
        _is_meta: true,
        date_range_str: dateRangeStr || targetWeek.date_range_str,
        release_date_str: releaseDateStr || targetWeek.release_date_str,
        recipients,
        signer_name: signerName,
        signer_title: signerTitle,
        attached_pdf_url: attachedPdfUrl || '',
        attached_pdf_name: attachedPdfName || '',
        appendix_items: appendixItems || [],
        appendix_configured: true
      };

      const payload = {
        title: title || targetWeek.title,
        week_number: Number(selectedWeekNo) || 1,
        start_date: startDate || targetWeek.start_date,
        end_date: endDate || targetWeek.end_date,
        bgh_duty: bghDuty,
        teacher_duty: teacherDuty,
        note,
        schedule_items: [...dayItems, metaObj],
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      // Check if row exists by editingId or by week_number
      let targetId = editingId;
      if (!targetId) {
        const existingRow = schedules.find(s => Number(s.week_number) === Number(selectedWeekNo));
        if (existingRow) targetId = existingRow.id;
      }

      const supaClient = supabase2Admin || supabaseAdmin || supabase;
      if (targetId) {
        const { error } = await supaClient.from('cbq_schedules').update(payload).eq('id', targetId);
        if (error) throw error;
        setEditingId(targetId);
      } else {
        const { error, data } = await supaClient.from('cbq_schedules').insert([payload]).select();
        if (error) throw error;
        if (data && data[0]) setEditingId(data[0].id);
      }

      try {
        localStorage.setItem(`cbq_schedule_appendix_w${selectedWeekNo}`, JSON.stringify(appendixItems || []));
        sessionStorage.removeItem('cbq_cached_schedules');
      } catch (e) {}

      alert(`🎉 ĐÃ LƯU THÀNH CÔNG LỊCH CÔNG TÁC TUẦN ${selectedWeekNo} (NĂM HỌC 2026 - 2027)!`);
      fetchSchedules();
    } catch (err) {
      alert("Lỗi khi lưu lịch: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Lưu nhanh riêng phụ lục bổ sung trực tiếp lên Supabase
  const handleQuickSaveAppendix = async () => {
    try {
      setSaving(true);
      const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
      let targetId = editingId;
      if (!targetId) {
        const existingRow = schedules.find(s => Number(s.week_number) === Number(selectedWeekNo));
        if (existingRow) targetId = existingRow.id;
      }

      const cleanDays = dayItems.filter(d => d && !d._is_meta);
      const metaObj = {
        _is_meta: true,
        date_range_str: dateRangeStr || targetWeek.date_range_str,
        release_date_str: releaseDateStr || targetWeek.release_date_str,
        recipients,
        signer_name: signerName,
        signer_title: signerTitle,
        attached_pdf_url: attachedPdfUrl || '',
        attached_pdf_name: attachedPdfName || '',
        appendix_items: appendixItems || [],
        appendix_configured: true
      };

      const payload = {
        title: title || targetWeek.title,
        week_number: Number(selectedWeekNo) || 1,
        start_date: startDate || targetWeek.start_date,
        end_date: endDate || targetWeek.end_date,
        bgh_duty: bghDuty,
        teacher_duty: teacherDuty,
        note,
        schedule_items: [...cleanDays, metaObj],
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      const supaClient = supabase2Admin || supabaseAdmin || supabase;
      if (targetId) {
        const { error } = await supaClient.from('cbq_schedules').update(payload).eq('id', targetId);
        if (error) throw error;
      } else {
        const { error, data } = await supaClient.from('cbq_schedules').insert([payload]).select();
        if (error) throw error;
        if (data && data[0]) setEditingId(data[0].id);
      }

      try {
        localStorage.setItem(`cbq_schedule_appendix_w${selectedWeekNo}`, JSON.stringify(appendixItems || []));
        sessionStorage.removeItem('cbq_cached_schedules');
      } catch (e) {}

      await fetchSchedules();
      alert(`🎉 ĐÃ LƯU THÀNH CÔNG ${appendixItems.length} MỤC PHỤ LỤC TUẦN ${selectedWeekNo} VÀO CƠ SỞ DỮ LIỆU!`);
    } catch (err) {
      alert(`Lỗi khi lưu phụ lục: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // --- EXCEL TIMETABLE IMPORT & HANDLING ---
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      { "Lớp": "10A01", "Thứ": "Thứ 2", "Tiết": 1, "Môn Học": "Chào cờ", "Giáo Viên": "BGH & GVCN", "Phòng Học": "Sân trường" },
      { "Lớp": "10A01", "Thứ": "Thứ 2", "Tiết": 2, "Môn Học": "Toán", "Giáo Viên": "Thầy Nguyễn Văn A", "Phòng Học": "P.101" },
      { "Lớp": "10A01", "Thứ": "Thứ 2", "Tiết": 3, "Môn Học": "Toán", "Giáo Viên": "Thầy Nguyễn Văn A", "Phòng Học": "P.101" },
      { "Lớp": "10A01", "Thứ": "Thứ 2", "Tiết": 4, "Môn Học": "Ngữ văn", "Giáo Viên": "Cô Trần Thị B", "Phòng Học": "P.101" },
      { "Lớp": "10A01", "Thứ": "Thứ 2", "Tiết": 5, "Môn Học": "Tiếng Anh", "Giáo Viên": "Cô Lê Thị D", "Phòng Học": "P.101" },
      { "Lớp": "11A01", "Thứ": "Thứ 3", "Tiết": 1, "Môn Học": "Vật lý", "Giáo Viên": "Thầy Phạm Văn C", "Phòng Học": "P.201" },
      { "Lớp": "11A01", "Thứ": "Thứ 3", "Tiết": 2, "Môn Học": "Vật lý", "Giáo Viên": "Thầy Phạm Văn C", "Phòng Học": "P.201" },
      { "Lớp": "12A01", "Thứ": "Thứ 4", "Tiết": 1, "Môn Học": "Hóa học", "Giáo Viên": "Cô Hoàng Thị E", "Phòng Học": "P.301" }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_TKB_Truong");
    XLSX.writeFile(wb, "1-Mau_ThoiKhoaBieu_THPT_CaoBaQuat.xlsx");
  };

  const SUBJECT_MAP = {
    'TOAN': 'Toán', 'VAN': 'Ngữ văn', 'NN': 'Tiếng Anh', 'LY': 'Vật lý', 'HOA': 'Hóa học',
    'SINH': 'Sinh học', 'SU': 'Lịch sử', 'DIA': 'Địa lý', 'TIN': 'Tin học', 'CN': 'Công nghệ',
    'GDTC': 'Thể dục', 'QPAN': 'GDQP-AN', 'GD': 'GDCD/KTLP', 'TrNg': 'HĐ Trải nghiệm',
    'GDĐP': 'GD Địa phương', 'CC': 'Chào cờ', 'SH': 'Sinh hoạt lớp'
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        let allParsedItems = [];

        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const isAfternoonSheet = sheetName.toLowerCase().includes('chieu') || sheetName.toLowerCase().includes('chiều');
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (!rows || rows.length === 0) return;

          // Check if this is a matrix sheet with class names in header row (e.g. 10A01, 10A1, 10A02...)
          let headerRowIndex = -1;
          let classHeaderRow = [];

          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (r && r.some(cell => String(cell).includes('10A01') || String(cell).includes('10A1') || String(cell).includes('10A02'))) {
              headerRowIndex = i;
              classHeaderRow = r;
              break;
            }
          }

          if (headerRowIndex !== -1 && classHeaderRow.length > 2) {
            // Parse Matrix Format
            let currentDay = 'Thứ 2';
            for (let i = headerRowIndex + 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;

              if (row[0] && String(row[0]).trim().startsWith('Thứ')) {
                currentDay = String(row[0]).trim();
              }

              const rawPeriod = Number(row[1]);
              if (isNaN(rawPeriod) || rawPeriod <= 0) continue;

              let period = rawPeriod;
              if (isAfternoonSheet && period <= 5) period = period + 5;

              for (let c = 2; c < classHeaderRow.length; c++) {
                let rawClassName = String(classHeaderRow[c] || '').trim();
                if (!rawClassName) continue;

                const normalizedClass = normalizeClassCode(rawClassName);
                const cellVal = String(row[c] || '').trim();
                if (!cellVal) continue;

                let subject = cellVal;
                let teacher = 'BGH & GVCN';

                if (cellVal.includes('-')) {
                  const parts = cellVal.split('-').map(p => p.trim());
                  const subCode = parts[0];
                  subject = SUBJECT_MAP[subCode] || subCode;
                  const rawTeacherCode = parts.slice(1).join(' - ');
                  teacher = getFullTeacherName(rawTeacherCode);
                } else if (SUBJECT_MAP[cellVal]) {
                  subject = SUBJECT_MAP[cellVal];
                }

                allParsedItems.push({
                  id: `excel-matrix-${sheetName}-${i}-${c}-${Date.now()}`,
                  student_class: normalizedClass,
                  day_of_week: currentDay,
                  period: period,
                  subject: subject,
                  teacher_name: teacher,
                  room: `Phòng ${normalizedClass}`
                });
              }
            }
          } else {
            // Parse List Format
            const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });
            rawJson.forEach((row, idx) => {
              const rawClass = row['Lớp'] || row['Lop'] || row['Class'] || row['CLASS'] || row['student_class'];
              if (!rawClass) return;

              const studentClass = normalizeClassCode(rawClass);
              const day = row['Thứ'] || row['Thu'] || row['Day'] || row['day_of_week'] || 'Thứ 2';
              let period = Number(row['Tiết'] || row['Tiet'] || row['Period'] || row['period']) || 1;
              const session = String(row['Buổi'] || row['Buoi'] || row['Session'] || '').toLowerCase();
              
              if ((session.includes('chiều') || session.includes('chieu') || isAfternoonSheet) && period <= 5) {
                period = period + 5;
              }

              const subject = row['Môn Học'] || row['Môn'] || row['Mon'] || row['Subject'] || row['subject'] || 'Chưa rõ';
              const rawTeacher = row['Giáo Viên'] || row['Giao Vien'] || row['GV'] || row['Teacher'] || row['teacher_name'] || 'Chưa phân công';
              const teacher = getFullTeacherName(rawTeacher);
              const room = row['Phòng Học'] || row['Phòng'] || row['Phong'] || row['Room'] || row['room'] || `Phòng ${studentClass}`;

              if (studentClass || teacher) {
                allParsedItems.push({
                  id: `excel-${sheetName}-${idx}-${Date.now()}`,
                  student_class: studentClass,
                  day_of_week: String(day).trim(),
                  period: period,
                  subject: String(subject).trim(),
                  teacher_name: teacher,
                  room: String(room).trim()
                });
              }
            });
          }
        });

        if (allParsedItems.length === 0) {
          alert("Không tìm thấy dữ liệu hợp lệ trong file Excel!");
          return;
        }

        setExcelPreview(allParsedItems);
        alert(`🎉 Đã đọc thành công ${allParsedItems.length} tiết học từ ${wb.SheetNames.length} sheet Excel! Vui lòng kiểm tra và bấm nút "Lưu TKB Toàn Trường".`);
      } catch (err) {
        alert("Lỗi đọc file Excel: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveExcelTimetable = async () => {
    if (excelPreview.length === 0) {
      alert("Vui lòng tải lên file Excel trước khi lưu!");
      return;
    }

    setSaving(true);
    try {
      // 1. Save to Supabase cbq_timetable_items if available
      try {
        const client = supabase2 || supabase;
        await client.from('cbq_timetable_items')
          .delete()
          .not('student_class', 'in', '("CONFIG_META","CONFIG_TIMINGS","CONFIG_PERIOD")');
        const cleanPayload = excelPreview.map(item => ({
          student_class: item.student_class,
          day_of_week: item.day_of_week,
          period: item.period,
          subject: item.subject,
          teacher_name: item.teacher_name,
          room: item.room
        }));
        await client.from('cbq_timetable_items').insert(cleanPayload);
        // Đồng bộ cấu hình metadata và khung giờ đi kèm an toàn lên Cloud
        await saveTimetableConfigToCloud(tkbMetadata, periodTimings);
      } catch (dbErr) {
        console.warn("Lưu Supabase TKB thất bại, sử dụng lưu Cache:", dbErr);
      }

      // 2. Lưu bộ nhớ đệm an toàn (Chống tràn Quota localStorage, tự động compact & dọn dẹp)
      try {
        safeSetItem('cbq_master_timetable', excelPreview);
        safeSetItem('cbq_timetable_metadata', tkbMetadata);
      } catch (cacheErr) {
        console.warn("Lưu bộ nhớ đệm TKB cục bộ cảnh báo:", cacheErr);
      }

      window.dispatchEvent(new Event('cbq_tkb_metadata_updated'));
      setTimetableData(excelPreview);
      setExcelPreview([]);
      alert(`✅ ĐÃ XUẤT BẢN THÀNH CÔNG THỜI KHÓA BIỂU TOÀN TRƯỜNG (${excelPreview.length} TIẾT HỌC)!\n\n• Số TKB: ${tkbMetadata.version}\n• Áp dụng từ ngày: ${tkbMetadata.applyDate}\n• Học kỳ: ${tkbMetadata.semester} (${tkbMetadata.schoolYear})`);
    } catch (err) {
      alert("Có lỗi xảy ra: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSampleTimetable = async () => {
    setTimetableData(SAMPLE_TIMETABLE_DATA);
    safeSetItem('cbq_master_timetable', SAMPLE_TIMETABLE_DATA);
    alert("🎉 Đã khôi phục Thời Khóa Biểu Mẫu Chuẩn cho THPT Cao Bá Quát!");
  };

  const handleCleanBrowserStorage = () => {
    const freed = cleanStorageQuota(true);
    const usage = getStorageUsage();
    alert(`🧹 ĐÃ DỌN DẸP BỘ NHỚ ĐỆM TRÌNH DUYỆT THÀNH CÔNG!\n\n• Đã giải phóng: ${freed} mục cache rác/tạm thời.\n• Dung lượng hiện tại: ${usage.mb} MB (${usage.percent}% hạn mức).\n• Dữ liệu Thời khóa biểu và Hệ thống trên Cloud vẫn an toàn 100%.`);
  };

  // Filter Timetable List
  const filteredTimetable = timetableData.filter(item => {
    const matchesSearch = !searchFilter.trim() || 
      item.student_class.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.teacher_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesGrade = gradeFilter === 'ALL' || item.student_class.startsWith(gradeFilter);

    return matchesSearch && matchesGrade;
  });

  const availableClasses = Array.from(new Set(timetableData.map(t => t.student_class))).filter(Boolean).sort();
  const availableTeachers = Array.from(new Set(timetableData.map(t => t.teacher_name))).filter(Boolean).sort();

  useEffect(() => {
    if (availableTeachers.length > 0 && !shareTeacher) {
      setShareTeacher(availableTeachers[0]);
    }
  }, [availableTeachers, shareTeacher]);

  const handleAdminCopyShareLink = () => {
    const targetVal = shareType === 'class' ? shareClass : shareTeacher;
    if (!targetVal) {
      alert("Vui lòng chọn đối tượng cần tạo link!");
      return;
    }
    const params = new URLSearchParams();
    params.set('tab', shareType === 'class' ? 'class_tkb' : 'teacher_tkb');
    if (shareType === 'class') params.set('class', targetVal);
    else params.set('teacher', targetVal);

    const shareableUrl = `${window.location.origin}/lich-cong-tac?${params.toString()}`;
    navigator.clipboard.writeText(shareableUrl).then(() => {
      setAdminCopied(true);
      setTimeout(() => setAdminCopied(false), 2500);
    });
  };

  // --- PRO SCHEDULER INITIALIZATION & EFFECTS ---
  useEffect(() => {
    try {
      const savedAssignments = localStorage.getItem('cbq_teaching_assignments');
      if (savedAssignments) {
        const parsed = JSON.parse(savedAssignments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validOnly = parsed.filter(a => isValidStudentClass(a.student_class));
          setTeachingAssignments(validOnly);
          return;
        }
      }
    } catch (e) {
      console.warn("Lỗi load cached assignments:", e);
    }

    if (timetableData && timetableData.length > 0) {
      const extracted = extractAssignmentsFromTimetable(timetableData);
      if (Array.isArray(extracted) && extracted.length > 0) {
        setTeachingAssignments(extracted);
        safeSetItem('cbq_teaching_assignments', extracted);
        return;
      }
    }

    // Default fallback: 442 chuẩn phân công THPT Cao Bá Quát
    const defaults = getDefaultTeachingAssignments();
    if (defaults && defaults.length > 0) {
      setTeachingAssignments(defaults);
      safeSetItem('cbq_teaching_assignments', defaults);
    }
  }, [timetableData]);

  useEffect(() => {
    try {
      const savedSchoolLocks = localStorage.getItem('cbq_school_locks');
      if (savedSchoolLocks) {
        const parsed = JSON.parse(savedSchoolLocks);
        if (Array.isArray(parsed)) setSchoolLocks(parsed);
      }
      
      const savedTeacherLocks = localStorage.getItem('cbq_teacher_locks');
      if (savedTeacherLocks) {
        const parsed = JSON.parse(savedTeacherLocks);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) setTeacherLocks(parsed);
      }

      const savedPins = localStorage.getItem('cbq_pinned_slots');
      if (savedPins) {
        const parsedPins = JSON.parse(savedPins);
        if (Array.isArray(parsedPins)) setPinnedSlots(parsedPins);
      }

      const savedScenarios = localStorage.getItem('cbq_timetable_scenarios');
      if (savedScenarios) {
        const parsedSc = JSON.parse(savedScenarios);
        if (Array.isArray(parsedSc)) {
          setScenarios(parsedSc);
          if (parsedSc.length >= 2) {
            setCompareScenarioA(parsedSc[0].id);
            setCompareScenarioB(parsedSc[1].id);
          } else if (parsedSc.length === 1) {
            setCompareScenarioA(parsedSc[0].id);
          }
        }
      }

      const savedDraft = localStorage.getItem('cbq_draft_timetable');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanedDraft = parsed.map(item => ({
            ...item,
            teacher_name: getFullTeacherName(item.teacher_name, item.subject)
          }));
          setDraftSchedule(cleanedDraft);

          // Đồng bộ các tiết có cờ isPinned
          const draftPins = cleanedDraft.filter(item => item.isPinned);
          if (draftPins.length > 0) {
            setPinnedSlots(prev => {
              const combined = [...prev];
              draftPins.forEach(dp => {
                if (!combined.some(cp => cp.student_class === dp.student_class && cp.day_of_week === dp.day_of_week && Number(cp.period) === Number(dp.period))) {
                  combined.push(dp);
                }
              });
              return combined;
            });
          }

          const diag = generateAiDiagnostics(cleanedDraft, teachingAssignments || [], teacherLocks || {});
          setSolverResult({
            success: true,
            qualityScore: diag?.qualityScore ?? 100,
            clashCount: diag?.clashCount ?? 0,
            totalGaps: diag?.totalGaps ?? 0,
            stats: { totalPlaced: cleanedDraft.length, totalRequired: cleanedDraft.length, durationMs: 0 },
            unplacedCount: 0,
            unplacedList: [],
            teacherClashList: diag?.teacherClashList || [],
            teachersWithGaps: diag?.teachersWithGaps || []
          });
        }
      }
    } catch (e) {
      console.warn("Lỗi load cached scheduler data:", e);
    }
  }, []);

  useEffect(() => {
    if (availableClasses.length > 0 && !studioSelectedClass) {
      setStudioSelectedClass(availableClasses[0]);
    }
    if (availableTeachers.length > 0 && !studioSelectedTeacher) {
      setStudioSelectedTeacher(availableTeachers[0]);
    }
    if (availableTeachers.length > 0 && !selectedLockTeacher) {
      setSelectedLockTeacher(availableTeachers[0]);
    }
  }, [availableClasses, availableTeachers]);

  useEffect(() => {
    try {
      const savedGroupA = localStorage.getItem('cbq_rotation_group_a');
      if (savedGroupA) {
        const parsedA = JSON.parse(savedGroupA);
        if (Array.isArray(parsedA)) setRotationGroupA(parsedA);
      }
      const savedGroupB = localStorage.getItem('cbq_rotation_group_b');
      if (savedGroupB) {
        const parsedB = JSON.parse(savedGroupB);
        if (Array.isArray(parsedB)) setRotationGroupB(parsedB);
      }
      const savedCycle = localStorage.getItem('cbq_active_rotation_cycle');
      if (savedCycle) setActiveRotationCycle(savedCycle);
      const savedC1 = localStorage.getItem('cbq_cycle_1_timetable');
      if (savedC1) {
        const parsedC1 = JSON.parse(savedC1);
        if (Array.isArray(parsedC1)) setCycle1Draft(parsedC1);
      }
      const savedC2 = localStorage.getItem('cbq_cycle_2_timetable');
      if (savedC2) {
        const parsedC2 = JSON.parse(savedC2);
        if (Array.isArray(parsedC2)) setCycle2Draft(parsedC2);
      }
    } catch (e) {
      console.warn("Lỗi load rotation data:", e);
    }
  }, []);

  // --- PRO SCHEDULER ACTIONS ---
  
const handleSaveTkbMetadata = async (customMeta) => {
    const metaToSave = {
      ...(customMeta || editingTkbMeta)
    };
    const currentTimings = periodTimings || getStoredPeriodTimings();
    setSaving(true);
    try {
      setTkbMetadata(metaToSave);
      localStorage.setItem('cbq_timetable_metadata', JSON.stringify(metaToSave));
      window.dispatchEvent(new Event('cbq_tkb_metadata_updated'));

      // Lưu lên Cloud Supabase an toàn (tách thành bản ghi nhỏ <= 255 chars)
      await saveTimetableConfigToCloud(metaToSave, currentTimings);

      setShowTkbMetaModal(false);
      alert(`✅ ĐÃ LƯU THÀNH CÔNG THÔNG TIN ÁP DỤNG THỜI KHÓA BIỂU!\n\n• Số TKB: ${metaToSave.version}\n• Ngày áp dụng: ${metaToSave.applyDate}\n• Học kỳ: ${metaToSave.semester} (${metaToSave.schoolYear})\n• Ghi chú: ${metaToSave.note || 'Không có'}\n\nCổng tra cứu công khai và mọi thiết bị (điện thoại/máy tính) đã cập nhật thông tin này ngay lập tức!`);
    } catch (err) {
      alert("Lỗi lưu thông tin: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePeriodTimings = async (customTimings) => {
    const timingsToSave = (customTimings || editingPeriodTimings).map(pt => ({
      ...pt,
      label: `Tiết ${pt.period} (${pt.start} - ${pt.end})`
    }));
    setSaving(true);
    try {
      setPeriodTimings(timingsToSave);
      setEditingPeriodTimings(timingsToSave);
      localStorage.setItem('cbq_period_timings', JSON.stringify(timingsToSave));

      const updatedMeta = { ...tkbMetadata };
      setTkbMetadata(updatedMeta);
      localStorage.setItem('cbq_timetable_metadata', JSON.stringify(updatedMeta));

      window.dispatchEvent(new Event('cbq_period_timings_updated'));
      window.dispatchEvent(new Event('cbq_tkb_metadata_updated'));

      // Lưu lên Cloud Supabase an toàn (tách thành bản ghi nhỏ <= 255 chars)
      await saveTimetableConfigToCloud(updatedMeta, timingsToSave);

      setShowPeriodTimingsModal(false);
      alert(`⏰ ĐÃ LƯU THÀNH CÔNG KHUNG GIỜ TIẾT HỌC TOÀN TRƯỜNG!\n\n• Cấu hình 10 tiết học (Ca sáng & Ca chiều) đã được đồng bộ lên Cloud.\n• Cổng tra cứu của Giáo viên, Học sinh trên mọi thiết bị & điện thoại đã nhận khung giờ mới ngay lập tức!`);
    } catch (err) {
      alert("Lỗi lưu khung giờ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePeriodTimeChange = (periodNum, field, val) => {
    setEditingPeriodTimings(prev => prev.map(p => {
      if (p.period === periodNum) {
        const updated = { ...p, [field]: val };
        return {
          ...updated,
          label: `Tiết ${updated.period} (${updated.start} - ${updated.end})`
        };
      }
      return p;
    }));
  };

  const handleAutoCalculateTimings = (morningStart = '07:00', afternoonStart = '13:30', durationMinutes = 45, breakMinutes = 15) => {
    const addMinutes = (timeStr, mins) => {
      const [h, m] = timeStr.split(':').map(Number);
      const totalMins = h * 60 + m + mins;
      const newH = Math.floor(totalMins / 60) % 24;
      const newM = totalMins % 60;
      return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    const calculated = [];
    // Ca Sáng: Tiết 1..5
    let curM = morningStart;
    for (let p = 1; p <= 5; p++) {
      const start = curM;
      const end = addMinutes(start, durationMinutes);
      calculated.push({
        period: p,
        session: 'Sáng',
        start,
        end,
        label: `Tiết ${p} (${start} - ${end})`
      });
      const gap = (p === 2) ? breakMinutes : 5;
      curM = addMinutes(end, gap);
    }

    // Ca Chiều: Tiết 6..10
    let curA = afternoonStart;
    for (let p = 6; p <= 10; p++) {
      const start = curA;
      const end = addMinutes(start, durationMinutes);
      calculated.push({
        period: p,
        session: 'Chiều',
        start,
        end,
        label: `Tiết ${p} (${start} - ${end})`
      });
      const gap = (p === 7) ? breakMinutes : 5;
      curA = addMinutes(end, gap);
    }

    setEditingPeriodTimings(calculated);
  };

  const calcDurationMinutes = (start, end) => {
    if (!start || !end) return '';
    try {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff > 0) return `${diff} phút`;
    } catch (e) {}
    return '';
  };

  const uniqueClassesCount = new Set((timetableData || []).map(t => t?.student_class)).size;
  const uniqueTeachersCount = new Set((timetableData || []).map(t => t?.teacher_name)).size;

  
return (
    <Layout title="Quản lý Lịch công tác & Thời Khóa Biểu Điện Tử">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={26} color="#be123c" /> QUẢN LÝ LỊCH CÔNG TÁC & THỜI KHÓA BIỂU TRƯỜNG
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Điều hành Lịch công tác BGH & Nhập file Excel Thời khóa biểu cho Giáo viên & Học sinh
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/lich-cong-tac" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', textDecoration: 'none', padding: '10px 18px', fontWeight: 'bold' }}
          >
            <Eye size={18} /> Cổng Tra Cứu TKB & Lịch Công Tác
          </a>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('bgh_schedule')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'bgh_schedule' ? '#be123c' : '#f1f5f9',
            color: activeTab === 'bgh_schedule' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'bgh_schedule' ? '0 4px 12px rgba(190, 18, 60, 0.25)' : 'none'
          }}
        >
          <Calendar size={18} /> 📅 LỊCH CÔNG TÁC TUẦN BAN GIÁM HIỆU
        </button>

        <button
          onClick={() => setActiveTab('timetable_excel')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'timetable_excel' ? '#166534' : '#f1f5f9',
            color: activeTab === 'timetable_excel' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'timetable_excel' ? '0 4px 12px rgba(22, 101, 52, 0.25)' : 'none'
          }}
        >
          <FileSpreadsheet size={18} /> 📊 QUẢN LÝ & UPLOAD FILE EXCEL TKB TRƯỜNG
        </button>

              </div>

{activeTab === 'bgh_schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 35 WEEKS SELECTOR BAR */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#be123c', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📅 KHUNG LỊCH CÔNG TÁC 35 TUẦN (NĂM HỌC 2026 - 2027)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
                  Khung thời gian năm học của Bộ Giáo dục & Đào tạo (Từ 07/09/2026 đến tháng 05/2027)
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowSmartImportModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)' }}
                  title="Mở công cụ tự động bóc tách từ file PDF hoặc văn bản copy dán vào bảng trong 1 click"
                >
                  <Sparkles size={18} /> ✨ Nhập Nhanh Từ PDF / Copy Chữ
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)' }}
                >
                  <Download size={18} /> 📄 Xuất File Word (35 Tuần / Linh Hoạt)
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaultTemplate}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  <RefreshCw size={16} /> 📋 Nạp Mẫu Chuẩn Tuần Này
                </button>

                <button
                  type="button"
                  onClick={handleSubmitBghSchedule}
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22, 101, 52, 0.3)' }}
                >
                  <Save size={18} /> {saving ? 'Đang lưu...' : '💾 Lưu Lịch Tuần Này'}
                </button>
              </div>
            </div>

            {/* WEEK SELECTOR DROPDOWN & GRID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap' }}>
                Chọn Tuần Học (1 - 35):
              </label>
              
              <select
                value={selectedWeekNo}
                onChange={e => handleSelectWeek(Number(e.target.value))}
                style={{ padding: '9px 14px', borderRadius: '8px', border: '2px solid #be123c', fontWeight: 'bold', fontSize: '14.5px', color: '#be123c', background: '#ffffff', minWidth: '320px', cursor: 'pointer' }}
              >
                {schoolWeeks.map(w => (
                  <option key={w.week_number} value={w.week_number}>
                    Tuần {String(w.week_number).padStart(2, '0')} - {w.date_range_str}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleCopyAdminEditLink}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: copiedAdminLink ? '#166534' : '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                  title="Sao chép đường dẫn trực tiếp mở trang Admin chọn sẵn Tuần này cho BGH / Người nhập lịch"
                >
                  {copiedAdminLink ? <Check size={16} /> : <Share2 size={16} />}
                  {copiedAdminLink ? 'Đã chép Link BGH!' : `🔗 Link BGH Nhập Tuần ${selectedWeekNo}`}
                </button>

                <button
                  type="button"
                  onClick={handleCopyPublicViewLink}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: copiedPublicLink ? '#166534' : '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                  title="Sao chép đường dẫn xem Lịch công tác công khai cho Giáo viên, Học sinh, Phụ huynh"
                >
                  {copiedPublicLink ? <Check size={16} /> : <Eye size={16} />}
                  {copiedPublicLink ? 'Đã chép Link Tra cứu!' : `👁️ Link Tra Cứu Tuần ${selectedWeekNo}`}
                </button>
              </div>
            </div>
          </div>

          {/* DECREE 30 EDITOR FORM */}
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #cbd5e1', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            
            {/* HEADER CONFIGURATION */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '15px', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={styles.label}>Tiêu đề Lịch công tác (*)</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Khoảng thời gian tuần (*)</label>
                <input type="text" value={dateRangeStr} onChange={e => setDateRangeStr(e.target.value)} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Ngày ban hành văn bản (*)</label>
                <input type="text" value={releaseDateStr} onChange={e => setReleaseDateStr(e.target.value)} style={styles.input} />
              </div>
            </div>

            {/* ATTACHED PDF SECTION */}
            <div style={{ marginBottom: '20px', padding: '16px', background: '#fff1f2', borderRadius: '12px', border: '1.5px solid #fecdd3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#be123c" />
                  <span style={{ fontWeight: 'bold', color: '#9f1239', fontSize: '14.5px' }}>
                    📎 Tệp PDF Scan Gốc Có Dấu Đỏ & Chữ Ký (Hiển Thị Trực Tiếp Trên Web):
                  </span>
                </div>
                {attachedPdfUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={attachedPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '5px 12px', backgroundColor: '#ffffff', color: '#be123c', border: '1px solid #fda4af', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={13} /> Xem thử PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => { setAttachedPdfUrl(''); setAttachedPdfName(''); }}
                      style={{ padding: '5px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Gỡ tệp
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '15px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                    1. Tải lên file PDF từ máy tính:
                  </label>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#ffffff',
                    color: '#be123c',
                    border: '1.5px dashed #fda4af',
                    borderRadius: '8px',
                    cursor: uploadingPdf ? 'wait' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <Upload size={16} />
                    {uploadingPdf ? 'Đang tải lên Supabase Storage...' : 'Chọn Tệp PDF Cần Đính Kèm (.pdf)'}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleUploadPdfFile}
                      style={{ display: 'none' }}
                      disabled={uploadingPdf}
                    />
                  </label>
                  {attachedPdfName && (
                    <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px', fontWeight: '600' }}>
                      ✅ Đã chọn: {attachedPdfName}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                    2. Hoặc dán trực tiếp đường dẫn URL file PDF (Google Drive / OneDrive / Storage):
                  </label>
                  <input
                    type="text"
                    value={attachedPdfUrl}
                    onChange={e => setAttachedPdfUrl(e.target.value)}
                    placeholder="https://.../lich_cong_tac_tuan_05.pdf"
                    style={{ ...styles.input, backgroundColor: '#ffffff', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* MAIN 7-DAY SCHEDULE TABLE EDITOR */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#166534', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📝 Bảng Chi Tiết Lịch Công Tác Từ Thứ 2 Đến Chủ Nhật (Mẫu Chuẩn Nghị Định 30)
              </h4>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#0f172a', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '10px', width: '12%', border: '1px solid #cbd5e1', textAlign: 'center' }}>Thứ / Ngày</th>
                      <th style={{ padding: '10px', width: '8%', border: '1px solid #cbd5e1', textAlign: 'center' }}>Buổi</th>
                      <th style={{ padding: '10px', width: '45%', border: '1px solid #cbd5e1', textAlign: 'center' }}>Nội dung công việc (*)</th>
                      <th style={{ padding: '10px', width: '17.5%', border: '1px solid #cbd5e1', textAlign: 'center' }}>Địa điểm</th>
                      <th style={{ padding: '10px', width: '17.5%', border: '1px solid #cbd5e1', textAlign: 'center' }}>Thành phần tham dự</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayItems.map((item, idx) => {
                      const isFirstSession = idx % 2 === 0;
                      return (
                        <tr key={idx} style={{ background: idx % 4 < 2 ? '#ffffff' : '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                          {isFirstSession && (
                            <td 
                              rowSpan={2} 
                              style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#be123c' }}
                            >
                              <div>{item.day_name}</div>
                              <div style={{ fontSize: '13.5px', color: '#0f172a', marginTop: '2px' }}>{item.date_str}</div>
                            </td>
                          )}

                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: item.session === 'Sáng' ? '#0369a1' : '#b45309' }}>
                            {item.session}
                          </td>

                          <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>
                            <textarea
                              rows={3}
                              value={item.content}
                              onChange={e => handleUpdateDayItem(idx, 'content', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                              placeholder="Nhập nội dung công việc..."
                            ></textarea>
                          </td>

                          <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>
                            <textarea
                              rows={3}
                              value={item.location}
                              onChange={e => handleUpdateDayItem(idx, 'location', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                              placeholder="Nhập địa điểm..."
                            ></textarea>
                          </td>

                          <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>
                            <textarea
                              rows={3}
                              value={item.participants}
                              onChange={e => handleUpdateDayItem(idx, 'participants', e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                              placeholder="Nhập thành phần tham dự..."
                            ></textarea>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* APPENDIX / PHỤ LỤC & LỊCH BỔ SUNG PHÁT SINH TRONG TUẦN */}
            <div style={{
              marginBottom: '24px',
              padding: '18px',
              background: '#fffdf0',
              borderRadius: '14px',
              border: '1.5px solid #fde047',
              boxShadow: '0 2px 10px rgba(202, 138, 4, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pin size={18} color="#b45309" />
                  <div>
                    <span style={{ fontWeight: '800', color: '#854d0e', fontSize: '15px' }}>
                      📌 QUẢN LÝ PHỤ LỤC & THÔNG TIN BỔ SUNG (PHÁT SINH TRONG TUẦN)
                    </span>
                    <div style={{ fontSize: '12px', color: '#a16207', marginTop: '2px' }}>
                      Thêm các lịch họp, công việc, hoạt động phát sinh ngoài văn bản PDF gốc đã ký ban hành. Tự động hiển thị trên web và đính kèm vào cuối bản Word.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAppendixIndex(null);
                      setNewAppendixItem({
                        time: '',
                        content: '',
                        location: '',
                        chair: '',
                        participants: '',
                        tag: 'Bổ sung khẩn',
                        type: 'urgent',
                        note: ''
                      });
                      setShowAddAppendixModal(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: '#eab308',
                      color: '#713f12',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(234, 179, 8, 0.3)'
                    }}
                  >
                    <Plus size={16} /> ➕ Thêm Mục Bổ Sung Mới
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickSaveAppendix}
                    disabled={saving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: '#166534',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(22, 101, 52, 0.3)'
                    }}
                    title="Lưu ngay toàn bộ danh sách phụ lục tuần này vào Supabase Database"
                  >
                    <Save size={16} /> 💾 Lưu Nhanh Phụ Lục ({appendixItems.length} mục)
                  </button>
                </div>
              </div>

              {/* BẢNG DANH SÁCH MỤC PHỤ LỤC */}
              {appendixItems.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #fef08a' }}>
                    <thead>
                      <tr style={{ background: '#fef9c3', color: '#854d0e', borderBottom: '2px solid #fde047' }}>
                        <th style={{ padding: '8px', width: '5%', textAlign: 'center', border: '1px solid #fef08a' }}>TT</th>
                        <th style={{ padding: '8px', width: '22%', textAlign: 'left', border: '1px solid #fef08a' }}>Thời gian & Phân loại</th>
                        <th style={{ padding: '8px', width: '38%', textAlign: 'left', border: '1px solid #fef08a' }}>Nội dung công việc bổ sung</th>
                        <th style={{ padding: '8px', width: '15%', textAlign: 'left', border: '1px solid #fef08a' }}>Địa điểm</th>
                        <th style={{ padding: '8px', width: '12%', textAlign: 'left', border: '1px solid #fef08a' }}>Chủ trì / Thành phần</th>
                        <th style={{ padding: '8px', width: '8%', textAlign: 'center', border: '1px solid #fef08a' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appendixItems.map((app, aIdx) => {
                        const isUrgent = app.type === 'urgent' || (app.tag || '').includes('khẩn') || (app.tag || '').includes('Khẩn');
                        const isWarning = app.type === 'warning' || (app.tag || '').includes('chỉnh') || (app.tag || '').includes('Chỉnh');
                        return (
                          <tr key={app.id || aIdx} style={{ backgroundColor: aIdx % 2 === 0 ? '#ffffff' : '#fffdf5', borderBottom: '1px solid #fef08a' }}>
                            <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 'bold', color: '#854d0e', border: '1px solid #fef08a', verticalAlign: 'top' }}>
                              {aIdx + 1}
                            </td>

                            <td style={{ padding: '10px 8px', border: '1px solid #fef08a', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{app.time}</div>
                              <div style={{ marginTop: '4px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: isUrgent ? '#fee2e2' : isWarning ? '#fef3c7' : '#dcfce7',
                                  color: isUrgent ? '#991b1b' : isWarning ? '#92400e' : '#166534',
                                  border: isUrgent ? '1px solid #fca5a5' : isWarning ? '1px solid #fde047' : '1px solid #86efac'
                                }}>
                                  {isUrgent ? '🔴 ' : isWarning ? '🟡 ' : '🟢 '}
                                  {app.tag || 'Bổ sung'}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '10px 8px', border: '1px solid #fef08a', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{app.content}</div>
                              {app.note && (
                                <div style={{ marginTop: '4px', fontSize: '12px', fontStyle: 'italic', color: '#78350f' }}>
                                  💡 Ghi chú: {app.note}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '10px 8px', border: '1px solid #fef08a', verticalAlign: 'top', color: '#334155' }}>
                              {app.location || '-'}
                            </td>

                            <td style={{ padding: '10px 8px', border: '1px solid #fef08a', verticalAlign: 'top', color: '#334155' }}>
                              <div style={{ fontWeight: 'bold' }}>{app.chair || '-'}</div>
                              {app.participants && <div style={{ fontSize: '11.5px', color: '#64748b' }}>{app.participants}</div>}
                            </td>

                            <td style={{ padding: '10px 6px', textAlign: 'center', border: '1px solid #fef08a', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAppendixIndex(aIdx);
                                    setNewAppendixItem({
                                      id: app.id || 'app-' + aIdx,
                                      time: app.time || '',
                                      content: app.content || '',
                                      location: app.location || '',
                                      chair: app.chair || '',
                                      participants: app.participants || '',
                                      tag: app.tag || 'Bổ sung khẩn',
                                      type: app.type || 'urgent',
                                      note: app.note || ''
                                    });
                                    setShowAddAppendixModal(true);
                                  }}
                                  style={{ padding: '5px 8px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Chỉnh sửa mục này"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Bạn có chắc muốn xóa mục phụ lục này?`)) {
                                      setAppendixItems(prev => prev.filter((_, idx) => idx !== aIdx));
                                    }
                                  }}
                                  style={{ padding: '5px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Xóa mục này"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#854d0e', backgroundColor: '#fefce8', borderRadius: '8px', fontSize: '13px' }}>
                  Chưa có mục phụ lục bổ sung nào cho tuần này. Bấm nút <strong>"➕ Thêm Mục Bổ Sung Mới"</strong> nếu có công việc mới phát sinh ngoài văn bản gốc.
                </div>
              )}

              {/* MODAL / FORM THÊM & SỬA MỤC PHỤ LỤC */}
              {showAddAppendixModal && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1.5px dashed #eab308'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#854d0e', marginBottom: '12px', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {editingAppendixIndex !== null ? `✏️ Chỉnh Sửa Mục Phụ Lục #${editingAppendixIndex + 1}:` : '📝 Thêm Mục Phụ Lục / Nhiệm Vụ Bổ Sung Mới:'}
                    </span>
                    {editingAppendixIndex !== null && (
                      <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'normal' }}>
                        (Đang ở chế độ chỉnh sửa)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                        Thời gian / Buổi (*):
                      </label>
                      <input
                        type="text"
                        value={newAppendixItem.time}
                        onChange={e => setNewAppendixItem(prev => ({ ...prev, time: e.target.value }))}
                        placeholder="Ví dụ: Chiều Thứ Tư (07/10) - 15h00"
                        style={{ ...styles.input, fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                        Phân loại:
                      </label>
                      <select
                        value={newAppendixItem.tag}
                        onChange={e => {
                          const tag = e.target.value;
                          const type = tag.includes('khẩn') ? 'urgent' : tag.includes('chỉnh') ? 'warning' : 'info';
                          setNewAppendixItem(prev => ({ ...prev, tag, type }));
                        }}
                        style={{ ...styles.select, fontSize: '13px' }}
                      >
                        <option value="Bổ sung khẩn">🔴 Bổ sung khẩn</option>
                        <option value="Điều chỉnh lịch">🟡 Điều chỉnh lịch</option>
                        <option value="Bổ sung công tác">🟢 Bổ sung công tác</option>
                        <option value="Thông báo">🔵 Thông báo chung</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                        Địa điểm:
                      </label>
                      <input
                        type="text"
                        value={newAppendixItem.location}
                        onChange={e => setNewAppendixItem(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Ví dụ: Phòng Hội đồng / Trực tuyến"
                        style={{ ...styles.input, fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                      Nội dung công việc bổ sung (*):
                    </label>
                    <textarea
                      rows={2}
                      value={newAppendixItem.content}
                      onChange={e => setNewAppendixItem(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Nhập nội dung công việc bổ sung..."
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    ></textarea>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                        Người chủ trì / Thành phần:
                      </label>
                      <input
                        type="text"
                        value={newAppendixItem.chair}
                        onChange={e => setNewAppendixItem(prev => ({ ...prev, chair: e.target.value }))}
                        placeholder="Ví dụ: Cô Lê Thị Thảo - Hiệu trưởng chủ trì, BGH, TTCM..."
                        style={{ ...styles.input, fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                        Ghi chú / Chỉ đạo của BGH:
                      </label>
                      <input
                        type="text"
                        value={newAppendixItem.note}
                        onChange={e => setNewAppendixItem(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="Ví dụ: Các bộ phận chuẩn bị báo cáo..."
                        style={{ ...styles.input, fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAppendixModal(false);
                        setEditingAppendixIndex(null);
                      }}
                      style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newAppendixItem.content.trim()) {
                          alert('Vui lòng nhập nội dung công việc bổ sung!');
                          return;
                        }
                        const itemToSave = {
                          ...newAppendixItem,
                          id: newAppendixItem.id || 'app-' + Date.now(),
                          time: newAppendixItem.time.trim() || 'Trong tuần'
                        };

                        if (editingAppendixIndex !== null) {
                          setAppendixItems(prev => prev.map((item, idx) => idx === editingAppendixIndex ? itemToSave : item));
                        } else {
                          setAppendixItems(prev => [...prev, itemToSave]);
                        }

                        setNewAppendixItem({
                          time: '',
                          content: '',
                          location: '',
                          chair: '',
                          participants: '',
                          tag: 'Bổ sung khẩn',
                          type: 'urgent',
                          note: ''
                        });
                        setEditingAppendixIndex(null);
                        setShowAddAppendixModal(false);
                      }}
                      style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#166534', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                    >
                      {editingAppendixIndex !== null ? '💾 Cập nhật mục này' : '➕ Thêm vào phụ lục'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* NOTES, RECIPIENTS & SIGNATURE FOOTER CONFIGURATION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={styles.label}>Ghi chú (*Lưu ý cuối bảng)</label>
                <textarea
                  rows={4}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                ></textarea>
              </div>

              <div>
                <label style={styles.label}>Nơi nhận (Góc dưới bên trái)</label>
                <textarea
                  rows={4}
                  value={recipients}
                  onChange={e => setRecipients(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                ></textarea>
              </div>

              <div>
                <label style={styles.label}>Thẩm quyền ký & Họ tên Hiệu trưởng</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={e => setSignerTitle(e.target.value)}
                    placeholder="HIỆU TRƯỜNG"
                    style={{ ...styles.input, fontWeight: 'bold' }}
                  />
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    placeholder="Lê Thị Thảo"
                    style={{ ...styles.input, fontWeight: 'bold', color: '#be123c' }}
                  />
                </div>
              </div>
            </div>

            {/* BOTTOM SAVE & EXPORT WORD BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 22px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)' }}
              >
                <Download size={18} /> 📄 Tải File Word (35 Tuần / Linh Hoạt)
              </button>

              <button
                type="button"
                onClick={handleSubmitBghSchedule}
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 26px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22, 101, 52, 0.3)' }}
              >
                <Save size={18} /> {saving ? 'Đang lưu...' : '💾 Lưu & Xuất Bản Lịch Tuần'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: EXCEL TIMETABLE MANAGEMENT */}
      {activeTab === 'timetable_excel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TOP IMPORT CONTROL PANEL */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #bbf7d0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#166534', fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={20} color="#166534" /> ĐĂNG TẢI THỜI KHÓA BIỂU TOÀN TRƯỜNG TỪ FILE EXCEL
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Hỗ trợ định dạng file Excel (.xlsx, .xls) bao gồm các cột: <strong>Lớp, Thứ, Tiết, Môn Học, Giáo Viên, Phòng Học</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTkbMeta({ ...tkbMetadata });
                    setShowTkbMetaModal(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#fef3c7', color: '#92400e', border: '1.5px solid #fde68a', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)' }}
                >
                  <Calendar size={16} color="#d97706" /> ⚙️ Cài Đặt Ngày Áp Dụng TKB
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPeriodTimings(periodTimings || getStoredPeriodTimings());
                    setShowPeriodTimingsModal(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#f0f9ff', color: '#0369a1', border: '1.5px solid #bae6fd', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)' }}
                >
                  <Clock size={16} color="#0284c7" /> ⏰ Cài Đặt Khung Giờ Tiết Học
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  <Download size={16} /> Tải File Excel Mẫu TKB (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={handleLoadSampleTimetable}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  <RefreshCw size={16} /> Nạp TKB Thử Nghệ Mẫu
                </button>

                <button
                  type="button"
                  onClick={handleCleanBrowserStorage}
                  title="Dọn dẹp các cache rác/tạm thời của trình duyệt để giải phóng dung lượng lưu trữ TKB"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} /> Dọn Cache Trình Duyệt
                </button>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#166534', color: '#ffffff', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)' }}>
                  <Upload size={16} /> Chọn File Excel TKB
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* PREVIEW CONTAINER IF UPLOADED */}
            {excelPreview.length > 0 && (
              <div style={{ marginTop: '15px', backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1.5px solid #86efac' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: '800', color: '#14532d', fontSize: '14px' }}>
                    🔍 Xem trước dữ liệu vừa nạp từ Excel: <span style={{ color: '#166534' }}>{excelPreview.length} tiết học</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setExcelPreview([])}
                      style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleSaveExcelTimetable}
                      disabled={saving}
                      style={{ padding: '6px 18px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.4)' }}
                    >
                      {saving ? 'Đang xuất bản...' : '✅ Lưu & Xuất Bản TKB Toàn Trường'}
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: '#dcfce7', textAlign: 'left', color: '#14532d' }}>
                        <th style={{ padding: '6px 10px' }}>Lớp</th>
                        <th style={{ padding: '6px 10px' }}>Thứ</th>
                        <th style={{ padding: '6px 10px' }}>Tiết</th>
                        <th style={{ padding: '6px 10px' }}>Môn Học</th>
                        <th style={{ padding: '6px 10px' }}>Giáo Viên</th>
                        <th style={{ padding: '6px 10px' }}>Phòng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelPreview.slice(0, 15).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f0fdf4' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#166534' }}>{row.student_class}</td>
                          <td style={{ padding: '6px 10px' }}>{row.day_of_week}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Tiết {row.period}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#0369a1' }}>{row.subject}</td>
                          <td style={{ padding: '6px 10px', color: '#b45309' }}>{row.teacher_name}</td>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{row.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* TIMETABLE KPI SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>Tổng Số Tiết Học TKB</span>
                <BookOpen size={22} color="#166534" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#14532d', marginTop: '4px' }}>
                {(timetableData || []).length} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#16a34a' }}>tiết/tuần</small>
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af' }}>Tổng Số Lớp Đang Học</span>
                <Users size={22} color="#1d4ed8" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#1e3a8a', marginTop: '4px' }}>
                {uniqueClassesCount} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#3b82f6' }}>lớp</small>
              </div>
            </div>

            <div style={{ backgroundColor: '#fffbebfb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#a16207' }}>Đội Ngũ Giáo Viên Dạy</span>
                <Users size={22} color="#b45309" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#78350f', marginTop: '4px' }}>
                {uniqueTeachersCount} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#ca8a04' }}>giáo viên</small>
              </div>
            </div>

            <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1.5px solid #fde68a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#92400e' }}>Ngày Áp Dụng TKB</span>
                  <Calendar size={22} color="#d97706" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#78350f', marginTop: '4px' }}>
                  TKB {tkbMetadata.version || 'Số 01'}
                </div>
                <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', marginTop: '2px' }}>
                  Áp dụng: {tkbMetadata.applyDate || '01/09/2026'} ({tkbMetadata.semester || 'Học kỳ I'})
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTkbMeta({ ...tkbMetadata });
                  setShowTkbMetaModal(true);
                }}
                style={{ marginTop: '10px', padding: '6px 12px', backgroundColor: '#fde68a', color: '#92400e', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Edit3 size={13} /> Sửa ngày áp dụng
              </button>
            </div>

            <div style={{ backgroundColor: '#f0fdfa', padding: '16px', borderRadius: '12px', border: '1.5px solid #99f6e4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f766e' }}>Khung Giờ Tiết Học</span>
                  <Clock size={22} color="#0d9488" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#134e4a', marginTop: '4px' }}>
                  10 Tiết Chuẩn
                </div>
                <div style={{ fontSize: '12px', color: '#0f766e', fontWeight: '600', marginTop: '2px' }}>
                  Sáng: {(periodTimings?.[0]?.start || '07:00')} • Chiều: {(periodTimings?.[5]?.start || '13:30')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPeriodTimings(periodTimings || getStoredPeriodTimings());
                  setShowPeriodTimingsModal(true);
                }}
                style={{ marginTop: '10px', padding: '6px 12px', backgroundColor: '#ccfbf1', color: '#0f766e', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Clock size={13} /> Cài đặt khung giờ
              </button>
            </div>
          </div>

          {/* MASTER TIMETABLE TABLE WITH FILTERS */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>
                📋 Danh Sách Thời Khóa Biểu Toàn Trường ({(filteredTimetable || []).length} tiết)
              </h3>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={gradeFilter}
                  onChange={e => setGradeFilter(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', outline: 'none' }}
                >
                  <option value="ALL">Tất cả các khối</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Tìm theo Lớp, Giáo viên, Môn học..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '240px', outline: 'none' }}
                  />
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>STT</th>
                    <th style={{ padding: '10px' }}>Lớp</th>
                    <th style={{ padding: '10px' }}>Thứ</th>
                    <th style={{ padding: '10px' }}>Tiết</th>
                    <th style={{ padding: '10px' }}>Môn Học</th>
                    <th style={{ padding: '10px' }}>Giáo Viên Giảng Dạy</th>
                    <th style={{ padding: '10px' }}>Phòng Học</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimetable.map((row, idx) => (
                    <tr key={row.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#166534' }}>{row.student_class}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e40af' }}>{row.day_of_week}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                          Tiết {row.period}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#0369a1' }}>{row.subject}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#b45309' }}>{row.teacher_name}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{row.room || 'Lớp học'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      
{/* MODAL CÀI ĐẶT THỜI GIAN ÁP DỤNG TKB */}
      {showTkbMetaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', maxWidth: '480px', width: '100%', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', border: '1px solid #cbd5e1' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={22} color="#d97706" /> CÀI ĐẶT NGÀY ÁP DỤNG THỜI KHÓA BIỂU
              </h3>
              <button type="button" onClick={() => setShowTkbMetaModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Số hiệu Thời khóa biểu:
                </label>
                <input
                  type="text"
                  value={editingTkbMeta.version}
                  onChange={e => setEditingTkbMeta({ ...editingTkbMeta, version: e.target.value })}
                  placeholder="Ví dụ: Số 01, Số 02..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Ngày bắt đầu áp dụng:
                </label>
                <input
                  type="text"
                  value={editingTkbMeta.applyDate}
                  onChange={e => setEditingTkbMeta({ ...editingTkbMeta, applyDate: e.target.value })}
                  placeholder="Ví dụ: 01/09/2026 hoặc Thứ Hai, 01/09/2026"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: 'bold', color: '#0369a1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    Học kỳ:
                  </label>
                  <select
                    value={editingTkbMeta.semester}
                    onChange={e => setEditingTkbMeta({ ...editingTkbMeta, semester: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', outline: 'none' }}
                  >
                    <option value="Học kỳ I">Học kỳ I</option>
                    <option value="Học kỳ II">Học kỳ II</option>
                    <option value="Ôn tập Hè">Ôn tập Hè</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    Năm học:
                  </label>
                  <input
                    type="text"
                    value={editingTkbMeta.schoolYear}
                    onChange={e => setEditingTkbMeta({ ...editingTkbMeta, schoolYear: e.target.value })}
                    placeholder="2026 - 2027"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Ghi chú / Căn cứ áp dụng:
                </label>
                <input
                  type="text"
                  value={editingTkbMeta.note}
                  onChange={e => setEditingTkbMeta({ ...editingTkbMeta, note: e.target.value })}
                  placeholder="Ví dụ: Áp dụng chính thức toàn trường theo QĐ số 15/QĐ-CBQ"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ backgroundColor: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '12.5px', color: '#92400e', lineHeight: '1.5' }}>
                💡 <em>Thông tin ngày áp dụng này sẽ hiển thị trang trọng trên Cổng tra cứu của Giáo viên & Học sinh, trên bản in A4 và trong toàn bộ các file Excel xuất ra.</em>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowTkbMetaModal(false)}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSaveTkbMetadata(editingTkbMeta)}
                disabled={saving}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#d97706', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)' }}
              >
                {saving ? 'Đang lưu...' : '💾 Lưu Ngày Áp Dụng'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT KHUNG GIỜ TIẾT HỌC (PERIOD TIMINGS) */}
      {showPeriodTimingsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1.5px solid #cbd5e1' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={24} color="#0d9488" /> CÀI ĐẶT KHUNG GIỜ TIẾT HỌC TOÀN TRƯỜNG
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Tùy chỉnh giờ bắt đầu & kết thúc cho từng tiết học (10 tiết). Cổng tra cứu của GV & HS sẽ đồng bộ tức thì.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPeriodTimingsModal(false)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* PRESETS BAR */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} color="#f59e0b" /> ÁP DỤNG MẪU KHUNG GIỜ NHANH (1-CLICK):
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setEditingPeriodTimings(PRESET_TIMINGS_STANDARD)}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #0284c7', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  ⚡ Chuẩn THPT (07:00 / 13:00 - 45p)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPeriodTimings(PRESET_TIMINGS_WINTER)}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #6366f1', backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  ❄️ Mùa Đông (+15p: 07:15 / 13:30)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPeriodTimings(PRESET_TIMINGS_SHORT)}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #d97706', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  🎪 Tiết 35 phút (Lễ hội / Chuyên đề)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPeriodTimings(DEFAULT_PERIOD_TIMINGS)}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ↺ Khôi Phục Mặc Định
                </button>
              </div>
            </div>

            {/* AUTO CALCULATOR PANEL */}
            <div style={{ backgroundColor: '#f0fdf4', padding: '14px 16px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#166534', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} color="#16a34a" /> BỘ TÍNH TOÁN KHUNG GIỜ TỰ ĐỘNG:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                    Vào lớp sáng:
                  </label>
                  <input
                    type="time"
                    value={autoMorningStart}
                    onChange={e => setAutoMorningStart(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                    Vào lớp chiều:
                  </label>
                  <input
                    type="time"
                    value={autoAfternoonStart}
                    onChange={e => setAutoAfternoonStart(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                    Số phút/tiết:
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="90"
                    value={autoDuration}
                    onChange={e => setAutoDuration(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                    Ra chơi (phút):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={autoBreak}
                    onChange={e => setAutoBreak(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleAutoCalculateTimings(autoMorningStart, autoAfternoonStart, autoDuration, autoBreak)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)' }}
                  >
                    🚀 Tự Động Tính
                  </button>
                </div>
              </div>
            </div>

            {/* TWO COLUMNS PERIOD EDITING GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px', marginBottom: '20px' }}>
              
              {/* MORNING SESSION: PERIOD 1 TO 5 */}
              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '14px', border: '1.5px solid #bae6fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #bae6fd' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sun size={17} color="#0284c7" /> CA SÁNG (Tiết 1 – Tiết 5)
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '10px' }}>
                    5 Tiết
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(editingPeriodTimings || DEFAULT_PERIOD_TIMINGS).filter(p => p.period <= 5).map(pt => {
                    const dur = calcDurationMinutes(pt.start, pt.end);
                    return (
                      <div
                        key={pt.period}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          border: '1px solid #e0f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ width: '56px', fontWeight: '900', color: '#0369a1', fontSize: '13px' }}>
                          Tiết {pt.period}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="time"
                            value={pt.start}
                            onChange={e => handlePeriodTimeChange(pt.period, 'start', e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', outline: 'none' }}
                          />
                          <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>–</span>
                          <input
                            type="time"
                            value={pt.end}
                            onChange={e => handlePeriodTimeChange(pt.period, 'end', e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', outline: 'none' }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#166534', minWidth: '55px', textAlign: 'center' }}>
                          {dur || '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AFTERNOON SESSION: PERIOD 6 TO 10 */}
              <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '14px', border: '1.5px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #fde68a' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Moon size={17} color="#d97706" /> CA CHIỀU (Tiết 6 – Tiết 10)
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '10px' }}>
                    5 Tiết
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(editingPeriodTimings || DEFAULT_PERIOD_TIMINGS).filter(p => p.period >= 6).map(pt => {
                    const dur = calcDurationMinutes(pt.start, pt.end);
                    return (
                      <div
                        key={pt.period}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          border: '1px solid #fef3c7',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ width: '56px', fontWeight: '900', color: '#b45309', fontSize: '13px' }}>
                          Tiết {pt.period}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="time"
                            value={pt.start}
                            onChange={e => handlePeriodTimeChange(pt.period, 'start', e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', outline: 'none' }}
                          />
                          <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>–</span>
                          <input
                            type="time"
                            value={pt.end}
                            onChange={e => handlePeriodTimeChange(pt.period, 'end', e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', outline: 'none' }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#166534', minWidth: '55px', textAlign: 'center' }}>
                          {dur || '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* NOTICE BOX */}
            <div style={{ backgroundColor: '#f0fdfa', padding: '12px 16px', borderRadius: '10px', border: '1px solid #99f6e4', fontSize: '12.5px', color: '#134e4a', lineHeight: '1.5', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="#0d9488" style={{ flexShrink: 0 }} />
              <div>
                Khung giờ mới sau khi lưu sẽ đồng bộ thời gian thực sang Cổng tra cứu công khai của <strong>Giáo viên, Học sinh và Phụ huynh</strong>, cập nhật tính năng xác định tiết học đang diễn ra (LIVE) và các bản in TKB.
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowPeriodTimingsModal(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSavePeriodTimings(editingPeriodTimings)}
                disabled={saving}
                style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#0d9488', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} />
                {saving ? 'Đang lưu...' : '💾 Lưu & Áp Dụng Toàn Trường'}
              </button>
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
                <Download size={22} color="#0284c7" /> 📄 TUỲ CHỌN XUẤT FILE WORD (NGHỊ ĐỊNH 30)
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
              <button type="button" onClick={handleExecuteExport} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
                📥 Tải File Word (.doc)
              </button>
            </div>

          </div>
        </div>
      )}

    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }
};

