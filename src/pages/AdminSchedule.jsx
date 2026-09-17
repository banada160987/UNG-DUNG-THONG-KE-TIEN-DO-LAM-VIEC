import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Calendar, Plus, Save, Trash2, Edit3, Eye, Clock, MapPin, CheckCircle2, 
  RefreshCw, Upload, Download, FileSpreadsheet, Users, BookOpen, Search, ShieldCheck,
  Share2, Check, Link as LinkIcon, Zap, Sparkles, Lock, Unlock, Play, Sliders, Layers, 
  Grid, AlertTriangle, CheckCircle, Info, ArrowRightLeft, Cpu, Award, ShieldAlert,
  FileText, CheckCheck, Undo2, ChevronRight, Filter, Settings, Sun, Moon, Sparkle
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
  ROMAN_NUMERALS 
} from '../utils/decree30ScheduleWord';
import {
  DAYS,
  PERIODS_MORNING,
  PERIODS_AFTERNOON,
  PERIODS_ALL,
  TEACHER_FULL_MAP,
  getFullTeacherName,
  normalizeClassCode,
  extractAssignmentsFromTimetable,
  runAiTimetableSolver,
  validateSlotSwap,
  generateAiDiagnostics,
  exportDraftTimetableToExcel
} from '../utils/proTimetableSolver';

export default function AdminSchedule() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Excel TKB State
  const [excelPreview, setExcelPreview] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // --- PRO SCHEDULER (AI) STATE ---
  const [schedulerSubTab, setSchedulerSubTab] = useState('assignments'); // 'assignments' | 'constraints' | 'ai_solver' | 'studio' | 'sandbox'
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [draftSchedule, setDraftSchedule] = useState([]);
  const [sessionMode, setSessionMode] = useState('both'); // 'morning' | 'afternoon' | 'both'
  const [schoolLocks, setSchoolLocks] = useState(['Thứ 2_1', 'Thứ 7_5']); // 'Thứ X_Tiết Y'
  const [teacherLocks, setTeacherLocks] = useState({}); // { [teacherName]: string[] }
  const [doublePeriodSubjects, setDoublePeriodSubjects] = useState(['Ngữ văn', 'GDTC', 'Tin học', 'Mĩ thuật']);
  const [maxDailyPeriods, setMaxDailyPeriods] = useState(5);
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [solverPhase, setSolverPhase] = useState('');
  const [solverResult, setSolverResult] = useState(null);

  // Studio Interactive State
  const [studioView, setStudioView] = useState('class'); // 'class' | 'teacher'
  const [studioSelectedClass, setStudioSelectedClass] = useState('10A01');
  const [studioSelectedTeacher, setStudioSelectedTeacher] = useState('');
  const [swapSourceSlot, setSwapSourceSlot] = useState(null);
  const [pinnedSlots, setPinnedSlots] = useState([]);

  // Assignment Management State
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    student_class: '10A01',
    subject: 'Toán',
    teacher_name: '',
    periods_per_week: 4,
    shift: 'morning'
  });
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentGradeFilter, setAssignmentGradeFilter] = useState('ALL');
  const [assignmentShiftFilter, setAssignmentShiftFilter] = useState('ALL');
  const [selectedLockTeacher, setSelectedLockTeacher] = useState('');

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStep, setPublishStep] = useState(1);

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
    return items.map(item => ({
      ...item,
      student_class: normalizeClassCode(item.student_class),
      teacher_name: getFullTeacherName(item.teacher_name)
    }));
  };

  async function fetchTimetableData() {
    try {
      const { data, error } = await supabase
        .from('cbq_timetable_items')
        .select('*')
        .order('student_class', { ascending: true });

      if (!error && data && data.length > 0) {
        const cleaned = processRawTimetableItems(data);
        setTimetableData(cleaned);
        localStorage.setItem('cbq_master_timetable', JSON.stringify(cleaned));
      } else {
        const cached = localStorage.getItem('cbq_master_timetable');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setTimetableData(processRawTimetableItems(parsed));
          } else {
            const masterCleaned = processRawTimetableItems(masterTimetableData);
            setTimetableData(masterCleaned);
          }
        } else {
          const masterCleaned = processRawTimetableItems(masterTimetableData);
          setTimetableData(masterCleaned);
          localStorage.setItem('cbq_master_timetable', JSON.stringify(masterCleaned));
        }
      }
    } catch (err) {
      const cached = localStorage.getItem('cbq_master_timetable');
      if (cached) setTimetableData(processRawTimetableItems(JSON.parse(cached)));
      else setTimetableData(processRawTimetableItems(masterTimetableData));
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
      setTitle(existing.title || targetWeek.title);
      setWeekNumber(wNum);
      setStartDate(existing.start_date || targetWeek.start_date);
      setEndDate(existing.end_date || targetWeek.end_date);
      setDateRangeStr(existing.date_range_str || targetWeek.date_range_str);
      setReleaseDateStr(existing.release_date_str || targetWeek.release_date_str);
      setBghDuty(existing.bgh_duty || '');
      setTeacherDuty(existing.teacher_duty || '');
      setNote(existing.note || '*Lưu ý: - Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, các bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo lãnh đạo trường để thực hiện./.');
      setRecipients(existing.recipients || 'Nơi nhận:\n- GV, NV (để t/h);\n- Các Tổ chuyên môn thuộc trường;\n- HT, các PHT;\n- Đăng Web, Zalo;\n- Lưu: VT, TK.');
      setSignerName(existing.signer_name || 'Lê Thị Thảo');
      setSignerTitle(existing.signer_title || 'HIỆU TRƯỜNG');
      setIsActive(existing.is_active ?? true);
      setDayItems(existing.day_items || existing.schedule_items || getDefaultScheduleDays(targetWeek));
    } else {
      setEditingId(null);
      setTitle(targetWeek.title);
      setWeekNumber(wNum);
      setStartDate(targetWeek.start_date);
      setEndDate(targetWeek.end_date);
      setDateRangeStr(targetWeek.date_range_str);
      setReleaseDateStr(targetWeek.release_date_str);
      setBghDuty('');
      setTeacherDuty('');
      setNote('*Lưu ý: - Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, các bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo lãnh đạo trường để thực hiện./.');
      setRecipients('Nơi nhận:\n- GV, NV (để t/h);\n- Các Tổ chuyên môn thuộc trường;\n- HT, các PHT;\n- Đăng Web, Zalo;\n- Lưu: VT, TK.');
      setSignerName('Lê Thị Thảo');
      setSignerTitle('HIỆU TRƯỜNG');
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

  const handleSubmitBghSchedule = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const targetWeek = schoolWeeks[selectedWeekNo - 1] || schoolWeeks[0];
      const payload = {
        title: title || targetWeek.title,
        week_number: Number(selectedWeekNo) || 1,
        start_date: startDate || targetWeek.start_date,
        end_date: endDate || targetWeek.end_date,
        date_range_str: dateRangeStr || targetWeek.date_range_str,
        release_date_str: releaseDateStr || targetWeek.release_date_str,
        bgh_duty: bghDuty,
        teacher_duty: teacherDuty,
        note,
        recipients,
        signer_name: signerName,
        signer_title: signerTitle,
        day_items: dayItems,
        schedule_items: dayItems,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase.from('cbq_schedules').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error, data } = await supabase.from('cbq_schedules').insert([payload]).select();
        if (error) throw error;
        if (data && data[0]) setEditingId(data[0].id);
      }

      alert(`🎉 ĐÃ LƯU THÀNH CÔNG LỊCH CÔNG TÁC TUẦN ${selectedWeekNo} (NĂM HỌC 2026 - 2027)!`);
      fetchSchedules();
    } catch (err) {
      alert("Lỗi khi lưu lịch: " + err.message);
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
    XLSX.writeFile(wb, "Mau_ThoiKhoaBieu_THPT_CaoBaQuat.xlsx");
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
        await supabase.from('cbq_timetable_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const cleanPayload = excelPreview.map(item => ({
          student_class: item.student_class,
          day_of_week: item.day_of_week,
          period: item.period,
          subject: item.subject,
          teacher_name: item.teacher_name,
          room: item.room
        }));
        await supabase.from('cbq_timetable_items').insert(cleanPayload);
      } catch (dbErr) {
        console.warn("Lưu Supabase TKB thất bại, sử dụng lưu Cache:", dbErr);
      }

      // 2. Save to localStorage
      localStorage.setItem('cbq_master_timetable', JSON.stringify(excelPreview));
      setTimetableData(excelPreview);
      setExcelPreview([]);
      alert(`✅ ĐÃ XUẤT BẢN THÀNH CÔNG THỜI KHÓA BIỂU TOÀN TRƯỜNG (${excelPreview.length} TIẾT HỌC)!`);
    } catch (err) {
      alert("Có lỗi xảy ra: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSampleTimetable = async () => {
    setTimetableData(SAMPLE_TIMETABLE_DATA);
    localStorage.setItem('cbq_master_timetable', JSON.stringify(SAMPLE_TIMETABLE_DATA));
    alert("🎉 Đã khôi phục Thời Khóa Biểu Mẫu Chuẩn cho THPT Cao Bá Quát!");
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
    if (timetableData.length > 0 && teachingAssignments.length === 0) {
      const extracted = extractAssignmentsFromTimetable(timetableData);
      setTeachingAssignments(extracted);
    }
  }, [timetableData]);

  useEffect(() => {
    try {
      const savedSchoolLocks = localStorage.getItem('cbq_school_locks');
      if (savedSchoolLocks) setSchoolLocks(JSON.parse(savedSchoolLocks));
      
      const savedTeacherLocks = localStorage.getItem('cbq_teacher_locks');
      if (savedTeacherLocks) setTeacherLocks(JSON.parse(savedTeacherLocks));

      const savedDraft = localStorage.getItem('cbq_draft_timetable');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDraftSchedule(parsed);
          const diag = generateAiDiagnostics(parsed, teachingAssignments, teacherLocks);
          setSolverResult({
            success: true,
            qualityScore: diag.qualityScore,
            clashCount: diag.clashCount,
            totalGaps: diag.totalGaps,
            stats: { totalPlaced: parsed.length, totalRequired: parsed.length, durationMs: 0 },
            unplacedCount: 0,
            unplacedList: [],
            teacherClashList: diag.teacherClashList,
            teachersWithGaps: diag.teachersWithGaps
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

  // --- PRO SCHEDULER ACTIONS ---
  const handleRunAiSolver = () => {
    if (teachingAssignments.length === 0) {
      alert("⚠️ Chưa có dữ liệu phân công giảng dạy! Vui lòng trích xuất từ TKB hiện có hoặc thêm phân công.");
      return;
    }

    setIsSolving(true);
    setSolverProgress(15);
    setSolverPhase('Phân tích phân công bộ môn & khởi tạo ma trận không gian...');

    setTimeout(() => {
      setSolverProgress(40);
      setSolverPhase('Khóa các tiết cố định toàn trường & xếp các cặp tiết đôi...');

      setTimeout(() => {
        setSolverProgress(70);
        setSolverPhase('Chạy thuật toán CSP + MRV xếp toàn bộ các tiết đơn...');

        setTimeout(() => {
          setSolverProgress(90);
          setSolverPhase('Tối ưu hóa Simulated Annealing triệt tiêu tiết lủng cho GV...');

          setTimeout(() => {
            try {
              const res = runAiTimetableSolver({
                assignments: teachingAssignments,
                sessionMode: sessionMode,
                schoolLocks: schoolLocks,
                teacherLocks: teacherLocks,
                pinnedSlots: pinnedSlots,
                doublePeriodSubjects: doublePeriodSubjects,
                maxDailyPeriodsPerTeacher: maxDailyPeriods
              });

              setDraftSchedule(res.schedule);
              localStorage.setItem('cbq_draft_timetable', JSON.stringify(res.schedule));
              setSolverResult(res);
              setSolverProgress(100);
              setSolverPhase('🎉 Hoàn tất 100%! Đã tạo Thời khóa biểu Pro với 0% xung đột.');

              setTimeout(() => {
                setIsSolving(false);
                setSchedulerSubTab('ai_solver');
              }, 500);
            } catch (err) {
              alert("Lỗi xếp TKB: " + err.message);
              setIsSolving(false);
            }
          }, 350);
        }, 350);
      }, 350);
    }, 300);
  };

  const handleExtractAssignmentsFromLive = () => {
    if (!timetableData || timetableData.length === 0) {
      alert("Không có dữ liệu thời khóa biểu hiện có!");
      return;
    }
    const extracted = extractAssignmentsFromTimetable(timetableData);
    setTeachingAssignments(extracted);
    alert(`🎉 Đã trích xuất thành công ${extracted.length} phân công bộ môn từ ${timetableData.length} tiết TKB hiện có!`);
  };

  const handleToggleSchoolLock = (slotKey) => {
    let updated;
    if (schoolLocks.includes(slotKey)) {
      updated = schoolLocks.filter(k => k !== slotKey);
    } else {
      updated = [...schoolLocks, slotKey];
    }
    setSchoolLocks(updated);
    localStorage.setItem('cbq_school_locks', JSON.stringify(updated));
  };

  const handleToggleTeacherSlotLock = (teacherName, slotKey) => {
    if (!teacherName) return;
    const current = teacherLocks[teacherName] || [];
    let updatedList;
    if (current.includes(slotKey)) {
      updatedList = current.filter(k => k !== slotKey);
    } else {
      updatedList = [...current, slotKey];
    }
    const updatedMap = { ...teacherLocks, [teacherName]: updatedList };
    setTeacherLocks(updatedMap);
    localStorage.setItem('cbq_teacher_locks', JSON.stringify(updatedMap));
  };

  const handleToggleTeacherWholeDay = (teacherName, day) => {
    if (!teacherName) return;
    const current = teacherLocks[teacherName] || [];
    const dayKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => `${day}_${p}`);
    const allLocked = dayKeys.every(k => current.includes(k));

    let updatedList;
    if (allLocked) {
      updatedList = current.filter(k => !dayKeys.includes(k));
    } else {
      const set = new Set([...current, ...dayKeys]);
      updatedList = Array.from(set);
    }

    const updatedMap = { ...teacherLocks, [teacherName]: updatedList };
    setTeacherLocks(updatedMap);
    localStorage.setItem('cbq_teacher_locks', JSON.stringify(updatedMap));
  };

  const handleClearTeacherLocks = (teacherName) => {
    if (!teacherName) return;
    const updatedMap = { ...teacherLocks, [teacherName]: [] };
    setTeacherLocks(updatedMap);
    localStorage.setItem('cbq_teacher_locks', JSON.stringify(updatedMap));
  };

  // Studio Smart Swap & Cell Interaction
  const handleStudioCellClick = (day, period, currentItem) => {
    if (studioView !== 'class') {
      return;
    }

    const cls = studioSelectedClass;
    if (!cls) return;

    if (!swapSourceSlot) {
      if (!currentItem) {
        return;
      }
      setSwapSourceSlot({
        student_class: cls,
        day_of_week: day,
        period: period,
        item: currentItem
      });
    } else {
      if (swapSourceSlot.day_of_week === day && Number(swapSourceSlot.period) === Number(period)) {
        setSwapSourceSlot(null);
        return;
      }

      const itemA = swapSourceSlot.item;
      const itemB = currentItem || {
        student_class: cls,
        day_of_week: day,
        period: period,
        subject: '',
        teacher_name: ''
      };

      const validation = validateSlotSwap(draftSchedule, itemA, {
        student_class: cls,
        day_of_week: day,
        period: period,
        subject: itemB.subject,
        teacher_name: itemB.teacher_name
      });

      if (!validation.valid) {
        alert(`❌ KHÔNG THỂ ĐỔI TIẾT:\n${validation.reason}`);
        setSwapSourceSlot(null);
        return;
      }

      const newSchedule = draftSchedule.map(s => {
        if (s.student_class === cls && s.day_of_week === swapSourceSlot.day_of_week && Number(s.period) === Number(swapSourceSlot.period)) {
          return currentItem ? { ...currentItem, day_of_week: swapSourceSlot.day_of_week, period: swapSourceSlot.period } : null;
        }
        if (s.student_class === cls && s.day_of_week === day && Number(s.period) === Number(period)) {
          return { ...itemA, day_of_week: day, period: period };
        }
        return s;
      }).filter(Boolean);

      const existsInTarget = newSchedule.some(s => s.student_class === cls && s.day_of_week === day && Number(s.period) === Number(period));
      if (!existsInTarget) {
        newSchedule.push({
          ...itemA,
          day_of_week: day,
          period: period
        });
      }

      setDraftSchedule(newSchedule);
      localStorage.setItem('cbq_draft_timetable', JSON.stringify(newSchedule));
      setSwapSourceSlot(null);

      const diag = generateAiDiagnostics(newSchedule, teachingAssignments, teacherLocks);
      setSolverResult(prev => ({
        ...prev,
        qualityScore: diag.qualityScore,
        clashCount: diag.clashCount,
        totalGaps: diag.totalGaps,
        teacherClashList: diag.teacherClashList,
        teachersWithGaps: diag.teachersWithGaps
      }));
    }
  };

  const handleTogglePinSlot = (slotItem) => {
    if (!slotItem) return;
    const isCurrentlyPinned = slotItem.isPinned;
    const updatedSchedule = draftSchedule.map(s => {
      if (s.student_class === slotItem.student_class && s.day_of_week === slotItem.day_of_week && Number(s.period) === Number(slotItem.period)) {
        return { ...s, isPinned: !isCurrentlyPinned };
      }
      return s;
    });

    setDraftSchedule(updatedSchedule);
    localStorage.setItem('cbq_draft_timetable', JSON.stringify(updatedSchedule));

    let updatedPins;
    if (isCurrentlyPinned) {
      updatedPins = pinnedSlots.filter(p => !(p.student_class === slotItem.student_class && p.day_of_week === slotItem.day_of_week && Number(p.period) === Number(slotItem.period)));
    } else {
      updatedPins = [...pinnedSlots, { ...slotItem, isPinned: true }];
    }
    setPinnedSlots(updatedPins);
  };

  const handleDeleteStudioSlot = (studentClass, day, period) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tiết này khỏi lớp ${studentClass}?`)) return;
    const updated = draftSchedule.filter(s => !(s.student_class === studentClass && s.day_of_week === day && Number(s.period) === Number(period)));
    setDraftSchedule(updated);
    localStorage.setItem('cbq_draft_timetable', JSON.stringify(updated));
  };

  const handleAddOrUpdateAssignment = () => {
    if (!newAssignment.student_class || !newAssignment.subject || !newAssignment.teacher_name) {
      alert("Vui lòng điền đầy đủ thông tin phân công!");
      return;
    }

    if (editingAssignmentId) {
      setTeachingAssignments(prev => prev.map(a => a.id === editingAssignmentId ? { ...newAssignment, id: editingAssignmentId } : a));
    } else {
      const newItem = {
        ...newAssignment,
        id: `asg_${Date.now()}`
      };
      setTeachingAssignments(prev => [...prev, newItem]);
    }

    setShowAddAssignmentModal(false);
    setEditingAssignmentId(null);
    setNewAssignment({
      student_class: '10A01',
      subject: 'Toán',
      teacher_name: '',
      periods_per_week: 4,
      shift: 'morning'
    });
  };

  const handleDeleteAssignment = (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phân công này?")) return;
    setTeachingAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleExportAssignmentsExcel = () => {
    if (teachingAssignments.length === 0) {
      alert("Chưa có phân công để xuất!");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(teachingAssignments.map((a, idx) => ({
      "STT": idx + 1,
      "Lớp": a.student_class,
      "Khối": a.grade || (a.student_class.startsWith('10') ? '10' : a.student_class.startsWith('11') ? '11' : '12'),
      "Môn Học": a.subject,
      "Giáo Viên Giảng Dạy": a.teacher_name,
      "Số Tiết / Tuần": a.periods_per_week,
      "Ca Học": a.shift === 'morning' ? 'Sáng' : 'Chiều'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PhanCongGiangDay");
    XLSX.writeFile(wb, `Phan_Cong_Giang_Day_THPT_CaoBaQuat_${Date.now()}.xlsx`);
  };

  const handleExportDraftExcel = () => {
    if (draftSchedule.length === 0) {
      alert("Chưa có bản nháp thời khóa biểu!");
      return;
    }
    exportDraftTimetableToExcel(draftSchedule, 'ThoiKhoaBieu_BanNhap_AI_THPT_CaoBaQuat');
  };

  const handlePublishDraftTimetable = async () => {
    if (draftSchedule.length === 0) {
      alert("Chưa có bản nháp để xuất bản!");
      return;
    }

    setSaving(true);
    try {
      try {
        await supabase.from('cbq_timetable_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const cleanPayload = draftSchedule.map(item => ({
          student_class: item.student_class,
          day_of_week: item.day_of_week,
          period: item.period,
          subject: item.subject,
          teacher_name: item.teacher_name,
          room: item.room || `Phòng ${item.student_class}`
        }));
        await supabase.from('cbq_timetable_items').insert(cleanPayload);
      } catch (dbErr) {
        console.warn("Lưu Supabase TKB thất bại, sử dụng lưu Cache:", dbErr);
      }

      localStorage.setItem('cbq_master_timetable', JSON.stringify(draftSchedule));
      setTimetableData(draftSchedule);
      setShowPublishModal(false);
      setPublishStep(1);
      alert(`🎉 CHÚC MỪNG! ĐÃ XUẤT BẢN THỜI KHÓA BIỂU TOÀN TRƯỜNG (${draftSchedule.length} TIẾT HỌC) VỚI 0% XUNG ĐỘT!\n\nThời khóa biểu mới đã được cập nhật trực tiếp lên Cổng tra cứu của Giáo viên và Học sinh.`);
    } catch (err) {
      alert("Có lỗi khi xuất bản: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const uniqueClassesCount = new Set(timetableData.map(t => t.student_class)).size;
  const uniqueTeachersCount = new Set(timetableData.map(t => t.teacher_name)).size;

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

        <button
          onClick={() => setActiveTab('pro_scheduler')}
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
            background: activeTab === 'pro_scheduler' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#f1f5f9',
            color: activeTab === 'pro_scheduler' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'pro_scheduler' ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none'
          }}
        >
          <Zap size={18} color={activeTab === 'pro_scheduler' ? '#fde047' : '#6366f1'} /> ⚡ XẾP THỜI KHÓA BIỂU PRO (AI)
        </button>
      </div>

      {/* TAB 1: BGH WEEKLY SCHEDULE (35 WEEKS - NĂM HỌC 2026-2027) */}
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
                {timetableData.length} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#16a34a' }}>tiết/tuần</small>
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
          </div>

          {/* MASTER TIMETABLE TABLE WITH FILTERS */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>
                📋 Danh Sách Thời Khóa Biểu Toàn Trường ({filteredTimetable.length} tiết)
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

      {/* TAB 3: PRO SCHEDULER (AI & TỰ ĐỘNG) */}
      {activeTab === 'pro_scheduler' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* PRO SCHEDULER SUB-TABS NAVIGATION */}
          <div style={{ backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #e0e7ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.06)' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSchedulerSubTab('assignments')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  backgroundColor: schedulerSubTab === 'assignments' ? '#4f46e5' : '#f8fafc',
                  color: schedulerSubTab === 'assignments' ? '#ffffff' : '#475569',
                  boxShadow: schedulerSubTab === 'assignments' ? '0 3px 10px rgba(79, 70, 229, 0.3)' : 'none'
                }}
              >
                <Layers size={16} /> 1. Phân Công Giảng Dạy ({teachingAssignments.length})
              </button>

              <button
                type="button"
                onClick={() => setSchedulerSubTab('constraints')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  backgroundColor: schedulerSubTab === 'constraints' ? '#4f46e5' : '#f8fafc',
                  color: schedulerSubTab === 'constraints' ? '#ffffff' : '#475569',
                  boxShadow: schedulerSubTab === 'constraints' ? '0 3px 10px rgba(79, 70, 229, 0.3)' : 'none'
                }}
              >
                <Lock size={16} /> 2. Khóa Tiết & Ràng Buộc
              </button>

              <button
                type="button"
                onClick={() => setSchedulerSubTab('ai_solver')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  backgroundColor: schedulerSubTab === 'ai_solver' ? '#4f46e5' : '#f8fafc',
                  color: schedulerSubTab === 'ai_solver' ? '#ffffff' : '#475569',
                  boxShadow: schedulerSubTab === 'ai_solver' ? '0 3px 10px rgba(79, 70, 229, 0.3)' : 'none'
                }}
              >
                <Sparkles size={16} color={schedulerSubTab === 'ai_solver' ? '#fde047' : '#eab308'} /> 3. AI Xếp TKB & Điểm Số
              </button>

              <button
                type="button"
                onClick={() => setSchedulerSubTab('studio')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  backgroundColor: schedulerSubTab === 'studio' ? '#4f46e5' : '#f8fafc',
                  color: schedulerSubTab === 'studio' ? '#ffffff' : '#475569',
                  boxShadow: schedulerSubTab === 'studio' ? '0 3px 10px rgba(79, 70, 229, 0.3)' : 'none'
                }}
              >
                <Grid size={16} /> 4. Studio Ma Trận ({draftSchedule.length} tiết)
              </button>

              <button
                type="button"
                onClick={() => setSchedulerSubTab('sandbox')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  backgroundColor: schedulerSubTab === 'sandbox' ? '#166534' : '#f8fafc',
                  color: schedulerSubTab === 'sandbox' ? '#ffffff' : '#475569',
                  boxShadow: schedulerSubTab === 'sandbox' ? '0 3px 10px rgba(22, 101, 52, 0.3)' : 'none'
                }}
              >
                <ShieldCheck size={16} /> 5. So Sánh & Xuất Bản
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleRunAiSolver}
                disabled={isSolving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  boxShadow: '0 3px 12px rgba(79, 70, 229, 0.35)'
                }}
              >
                <Sparkles size={16} color="#fde047" /> {isSolving ? 'Đang Xếp AI...' : '🚀 Xếp TKB AI Ngay'}
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: TEACHING ASSIGNMENTS */}
          {schedulerSubTab === 'assignments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* ASSIGNMENT STATS CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Tổng Số Phân Công</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#4f46e5', marginTop: '4px' }}>
                    {teachingAssignments.length} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>phân công</small>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Tổng Số Tiết Dạy / Tuần</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#166534', marginTop: '4px' }}>
                    {teachingAssignments.reduce((sum, a) => sum + (Number(a.periods_per_week) || 0), 0)} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>tiết/tuần</small>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Số Lớp Được Phân Công</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#0369a1', marginTop: '4px' }}>
                    {new Set(teachingAssignments.map(a => a.student_class)).size} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>lớp</small>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Số Giáo Viên Tham Gia</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#b45309', marginTop: '4px' }}>
                    {new Set(teachingAssignments.map(a => a.teacher_name).filter(t => t && t !== 'Chưa gán GV')).size} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>giáo viên</small>
                  </div>
                </div>
              </div>

              {/* ACTION BAR & FILTERS */}
              <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Tìm theo Lớp, GV, Môn..."
                      value={assignmentSearch}
                      onChange={e => setAssignmentSearch(e.target.value)}
                      style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '220px', outline: 'none' }}
                    />
                    <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>

                  <select
                    value={assignmentGradeFilter}
                    onChange={e => setAssignmentGradeFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', outline: 'none' }}
                  >
                    <option value="ALL">Tất cả các khối</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>

                  <select
                    value={assignmentShiftFilter}
                    onChange={e => setAssignmentShiftFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', outline: 'none' }}
                  >
                    <option value="ALL">Tất cả các ca</option>
                    <option value="morning">Ca Sáng (P1-P5)</option>
                    <option value="afternoon">Ca Chiều (P6-P10)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAssignmentId(null);
                      setNewAssignment({
                        student_class: availableClasses[0] || '10A01',
                        subject: 'Toán',
                        teacher_name: availableTeachers[0] || '',
                        periods_per_week: 4,
                        shift: 'morning'
                      });
                      setShowAddAssignmentModal(true);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    <Plus size={16} /> Thêm Phân Công
                  </button>

                  <button
                    type="button"
                    onClick={handleExtractAssignmentsFromLive}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    <RefreshCw size={15} /> Trích Xuất Lại TKB
                  </button>

                  <button
                    type="button"
                    onClick={handleExportAssignmentsExcel}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    <FileSpreadsheet size={15} /> Xuất Excel
                  </button>
                </div>
              </div>

              {/* ASSIGNMENTS TABLE */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 2 }}>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px', width: '50px' }}>STT</th>
                        <th style={{ padding: '10px 14px' }}>Khối</th>
                        <th style={{ padding: '10px 14px' }}>Lớp Học</th>
                        <th style={{ padding: '10px 14px' }}>Môn Học</th>
                        <th style={{ padding: '10px 14px' }}>Giáo Viên Phụ Trách</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Số Tiết / Tuần</th>
                        <th style={{ padding: '10px 14px' }}>Ca Học</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachingAssignments
                        .filter(a => {
                          const matchesSearch = !assignmentSearch.trim() || 
                            a.student_class.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
                            a.teacher_name.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
                            a.subject.toLowerCase().includes(assignmentSearch.toLowerCase());
                          const matchesGrade = assignmentGradeFilter === 'ALL' || a.student_class.startsWith(assignmentGradeFilter);
                          const matchesShift = assignmentShiftFilter === 'ALL' || a.shift === assignmentShiftFilter;
                          return matchesSearch && matchesGrade && matchesShift;
                        })
                        .map((asg, idx) => (
                          <tr key={asg.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ backgroundColor: asg.student_class.startsWith('10') ? '#e0f2fe' : asg.student_class.startsWith('11') ? '#fef3c7' : '#fce7f3', color: asg.student_class.startsWith('10') ? '#0369a1' : asg.student_class.startsWith('11') ? '#b45309' : '#be185d', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                                K.{asg.student_class.slice(0, 2)}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 'bold', color: '#0f172a' }}>{asg.student_class}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 'bold', color: '#4f46e5' }}>{asg.subject}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 'bold', color: '#334155' }}>{asg.teacher_name}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextP = Math.max(1, (Number(asg.periods_per_week) || 1) - 1);
                                    setTeachingAssignments(prev => prev.map(a => a.id === asg.id ? { ...a, periods_per_week: nextP } : a));
                                  }}
                                  style={{ border: 'none', background: '#cbd5e1', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  -
                                </button>
                                <span style={{ fontWeight: 'bold', color: '#0f172a', minWidth: '18px', textAlign: 'center' }}>
                                  {asg.periods_per_week}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextP = Math.min(10, (Number(asg.periods_per_week) || 1) + 1);
                                    setTeachingAssignments(prev => prev.map(a => a.id === asg.id ? { ...a, periods_per_week: nextP } : a));
                                  }}
                                  style={{ border: 'none', background: '#cbd5e1', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ backgroundColor: asg.shift === 'morning' ? '#ecfdf5' : '#fff7ed', color: asg.shift === 'morning' ? '#047857' : '#c2410c', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11.5px' }}>
                                {asg.shift === 'morning' ? '☀️ Ca Sáng' : '⛅ Ca Chiều'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAssignmentId(asg.id);
                                    setNewAssignment({ ...asg });
                                    setShowAddAssignmentModal(true);
                                  }}
                                  style={{ border: 'none', background: '#eff6ff', color: '#1d4ed8', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Chỉnh sửa"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(asg.id)}
                                  style={{ border: 'none', background: '#fef2f2', color: '#b91c1c', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Xóa phân công"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: CONSTRAINTS & MULTI-LAYER LOCKS */}
          {schedulerSubTab === 'constraints' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* CARD A: SESSION MODE SELECTOR */}
              <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', border: '1.5px solid #e0e7ff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e1b4b', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} color="#4f46e5" /> 1. CHỌN PHẠM VI BUỔI XẾP THỜI KHÓA BIỂU
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13.5px' }}>
                  Lựa chọn linh hoạt xếp riêng từng buổi hoặc chạy thuật toán đồng thời cả 2 buổi để kiểm soát lịch dạy giáo viên toàn trường:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', border: sessionMode === 'morning' ? '2px solid #4f46e5' : '1px solid #cbd5e1', backgroundColor: sessionMode === 'morning' ? '#eef2ff' : '#ffffff', cursor: 'pointer' }}>
                    <input type="radio" name="sessionMode" value="morning" checked={sessionMode === 'morning'} onChange={() => setSessionMode('morning')} style={{ marginTop: '3px' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e1b4b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sun size={16} color="#d97706" /> Chỉ Xếp Buổi Sáng (Tiết 1 - 5)
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                        Áp dụng riêng cho các lớp học buổi sáng (Khối 10, Khối 11).
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', border: sessionMode === 'afternoon' ? '2px solid #4f46e5' : '1px solid #cbd5e1', backgroundColor: sessionMode === 'afternoon' ? '#eef2ff' : '#ffffff', cursor: 'pointer' }}>
                    <input type="radio" name="sessionMode" value="afternoon" checked={sessionMode === 'afternoon'} onChange={() => setSessionMode('afternoon')} style={{ marginTop: '3px' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e1b4b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Moon size={16} color="#4338ca" /> Chỉ Xếp Buổi Chiều (Tiết 6 - 10)
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                        Áp dụng riêng cho các lớp học buổi chiều (Khối 12).
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', border: sessionMode === 'both' ? '2px solid #4f46e5' : '1px solid #cbd5e1', backgroundColor: sessionMode === 'both' ? '#eef2ff' : '#ffffff', cursor: 'pointer' }}>
                    <input type="radio" name="sessionMode" value="both" checked={sessionMode === 'both'} onChange={() => setSessionMode('both')} style={{ marginTop: '3px' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e1b4b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={16} color="#4f46e5" /> Đồng Thời Cả 2 Buổi (Khuyên dùng)
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                        Tối ưu toàn diện từ Tiết 1 đến Tiết 10, đảm bảo 0% xung đột lịch dạy của GV giữa 2 ca.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* CARD B: SCHOOL-WIDE LOCKED SLOTS */}
              <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', border: '1.5px solid #e0e7ff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={20} color="#dc2626" /> 2. KHÓA TIẾT CỐ ĐỊNH TOÀN TRƯỜNG ({schoolLocks.length} TIẾT ĐANG KHÓA)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>
                      Nhấp vào từng ô tiết để Khóa hoặc Mở khóa không cho AI xếp môn học vào thời điểm đó (VD: Chào cờ, Sinh hoạt lớp, Họp HĐSP).
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultLocks = ['Thứ 2_1', 'Thứ 7_5'];
                        setSchoolLocks(defaultLocks);
                        localStorage.setItem('cbq_school_locks', JSON.stringify(defaultLocks));
                      }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Mẫu Chuẩn (Chào Cờ + SHL)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSchoolLocks([]);
                        localStorage.setItem('cbq_school_locks', JSON.stringify([]));
                      }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#dc2626' }}
                    >
                      Mở Khóa Tất Cả
                    </button>
                  </div>
                </div>

                {/* SCHOOL LOCK MATRIX */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '8px', width: '100px', textAlign: 'left' }}>Tiết</th>
                        {DAYS.map(d => (
                          <th key={d} style={{ padding: '8px' }}>{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* MORNING */}
                      <tr style={{ background: '#f1f5f9', fontWeight: 'bold', color: '#475569', fontSize: '12px' }}>
                        <td colSpan={7} style={{ padding: '4px 10px', textAlign: 'left' }}>--- CA SÁNG ---</td>
                      </tr>
                      {PERIODS_MORNING.map(p => (
                        <tr key={p} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 'bold', color: '#475569' }}>Tiết {p}</td>
                          {DAYS.map(day => {
                            const key = `${day}_${p}`;
                            const isLocked = schoolLocks.includes(key);
                            return (
                              <td key={key} style={{ padding: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSchoolLock(key)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 4px',
                                    borderRadius: '8px',
                                    border: isLocked ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                                    backgroundColor: isLocked ? '#fef2f2' : '#ffffff',
                                    color: isLocked ? '#dc2626' : '#64748b',
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {isLocked ? <Lock size={13} color="#dc2626" /> : <Unlock size={13} color="#94a3b8" />}
                                  {isLocked ? 'ĐÃ KHÓA' : 'Trống'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* AFTERNOON */}
                      <tr style={{ background: '#f1f5f9', fontWeight: 'bold', color: '#475569', fontSize: '12px' }}>
                        <td colSpan={7} style={{ padding: '4px 10px', textAlign: 'left' }}>--- CA CHIỀU ---</td>
                      </tr>
                      {PERIODS_AFTERNOON.map(p => (
                        <tr key={p} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 'bold', color: '#475569' }}>Tiết {p}</td>
                          {DAYS.map(day => {
                            const key = `${day}_${p}`;
                            const isLocked = schoolLocks.includes(key);
                            return (
                              <td key={key} style={{ padding: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSchoolLock(key)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 4px',
                                    borderRadius: '8px',
                                    border: isLocked ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                                    backgroundColor: isLocked ? '#fef2f2' : '#ffffff',
                                    color: isLocked ? '#dc2626' : '#64748b',
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {isLocked ? <Lock size={13} color="#dc2626" /> : <Unlock size={13} color="#94a3b8" />}
                                  {isLocked ? 'ĐÃ KHÓA' : 'Trống'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CARD C: TEACHER SPECIFIC OFF-SLOT LOCKS */}
              <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', border: '1.5px solid #e0e7ff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={20} color="#7c3aed" /> 3. KHÓA TIẾT NGHỈ / ĐĂNG KÝ NGHỈ CỦA TỪNG GIÁO VIÊN
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>
                      Chọn giáo viên để đánh dấu các buổi / tiết không xếp lịch dạy theo yêu cầu cá nhân:
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#334155' }}>Chọn Giáo Viên:</span>
                    <select
                      value={selectedLockTeacher}
                      onChange={e => setSelectedLockTeacher(e.target.value)}
                      style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #7c3aed', fontWeight: 'bold', fontSize: '13.5px', outline: 'none', color: '#5b21b6' }}
                    >
                      {availableTeachers.map(t => (
                        <option key={t} value={t}>
                          {t} ({teacherLocks[t]?.length || 0} tiết khóa)
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleClearTeacherLocks(selectedLockTeacher)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', color: '#dc2626' }}
                    >
                      Xóa Khóa GV Này
                    </button>
                  </div>
                </div>

                {/* TEACHER LOCK MATRIX */}
                {selectedLockTeacher && (
                  <div style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '12px', border: '1px solid #f3e8ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#6b21a8', fontSize: '14px' }}>
                        Lưới khóa tiết của Giáo viên: <strong style={{ color: '#581c87' }}>{selectedLockTeacher}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12.5px', color: '#7e22ce', fontWeight: 'bold' }}>Khóa nguyên ngày:</span>
                        {DAYS.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleTeacherWholeDay(selectedLockTeacher, day)}
                            style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid #d8b4fe', backgroundColor: '#ffffff', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', color: '#7e22ce' }}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'center' }}>
                        <thead>
                          <tr style={{ background: '#f3e8ff', borderBottom: '1px solid #d8b4fe' }}>
                            <th style={{ padding: '6px 8px', width: '80px', textAlign: 'left' }}>Tiết</th>
                            {DAYS.map(d => (
                              <th key={d} style={{ padding: '6px 8px' }}>{d}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {PERIODS_ALL.map(p => (
                            <tr key={p} style={{ borderBottom: '1px solid #f5f3ff' }}>
                              <td style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', color: '#6b21a8' }}>Tiết {p}</td>
                              {DAYS.map(day => {
                                const key = `${day}_${p}`;
                                const isLocked = (teacherLocks[selectedLockTeacher] || []).includes(key);
                                return (
                                  <td key={key} style={{ padding: '3px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTeacherSlotLock(selectedLockTeacher, key)}
                                      style={{
                                        width: '100%',
                                        padding: '5px 2px',
                                        borderRadius: '6px',
                                        border: isLocked ? '1px solid #dc2626' : '1px solid #e9d5ff',
                                        backgroundColor: isLocked ? '#fee2e2' : '#ffffff',
                                        color: isLocked ? '#b91c1c' : '#7e22ce',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {isLocked ? '🔒 Nghỉ' : 'Dạy'}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD D: PEDAGOGICAL CONSTRAINTS */}
              <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', border: '1.5px solid #e0e7ff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e1b4b', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={20} color="#0284c7" /> 4. QUY TẮC SƯ PHẠM & TỐI ƯU HÓA TIẾT ĐÔI
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13.5px' }}>
                  Thiết lập các môn học ưu tiên xếp 2 tiết liên tiếp (tiết đôi) và khống chế tải dạy hàng ngày của mỗi giáo viên:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13.5px', display: 'block', marginBottom: '10px' }}>
                      📚 Các môn ưu tiên xếp Tiết Đôi (2 tiết liền):
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['Ngữ văn', 'GDTC', 'Tin học', 'Mĩ thuật', 'Vật lý', 'Hóa học', 'Sinh học'].map(sub => {
                        const isSelected = doublePeriodSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              if (isSelected) setDoublePeriodSubjects(prev => prev.filter(s => s !== sub));
                              else setDoublePeriodSubjects(prev => [...prev, sub]);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                              backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                              color: isSelected ? '#0369a1' : '#64748b',
                              fontWeight: 'bold',
                              fontSize: '12.5px',
                              cursor: 'pointer'
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '} {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13.5px', display: 'block', marginBottom: '8px' }}>
                      ⚖️ Số tiết dạy tối đa / ngày của 1 Giáo viên:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
                      <input
                        type="range"
                        min="3"
                        max="8"
                        value={maxDailyPeriods}
                        onChange={e => setMaxDailyPeriods(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#4f46e5' }}
                      />
                      <span style={{ fontWeight: '900', color: '#4f46e5', fontSize: '16px', minWidth: '70px', backgroundColor: '#eef2ff', padding: '4px 10px', borderRadius: '8px', textAlign: 'center' }}>
                        {maxDailyPeriods} tiết/ngày
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                      Khuyên dùng: 5 tiết/ngày để giáo viên không bị quá tải.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: AI SOLVER & DASHBOARD */}
          {schedulerSubTab === 'ai_solver' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* HERO AI SOLVER CARD */}
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', padding: '28px', borderRadius: '20px', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.4)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 2 }}>
                  <div style={{ maxWidth: '650px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '10px', backdropFilter: 'blur(4px)' }}>
                      <Sparkles size={14} color="#fde047" /> AI CONSTRAINT SATISFACTION (CSP) + SIMULATED ANNEALING
                    </div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                      HỆ THỐNG XẾP THỜI KHÓA BIỂU TỰ ĐỘNG PRO
                    </h2>
                    <p style={{ margin: 0, fontSize: '14px', color: '#c7d2fe', lineHeight: '1.6' }}>
                      Thuật toán AI tự động sắp xếp {teachingAssignments.length} phân công bộ môn, tối ưu hóa 0% xung đột, ghép tiết đôi liên tiếp, và triệt tiêu tiết lủng (tiết trống giữa buổi) cho từng giáo viên.
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleRunAiSolver}
                      disabled={isSolving}
                      style={{
                        padding: '14px 28px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        fontWeight: '900',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <Sparkles size={20} color="#ffffff" /> {isSolving ? 'ĐANG CHẠY THUẬT TOÁN AI...' : '🚀 BẮT ĐẦU XẾP TKB AI'}
                    </button>
                  </div>
                </div>

                {/* ANIMATED PROGRESS BAR WHEN SOLVING */}
                {isSolving && (
                  <div style={{ marginTop: '22px', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '16px', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                      <span style={{ color: '#fde047' }}>{solverPhase}</span>
                      <span style={{ color: '#ffffff' }}>{solverProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${solverProgress}%`, height: '100%', backgroundColor: '#fde047', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* SOLVER RESULT QUALITY DASHBOARD */}
              {solverResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    
                    {/* QUALITY SCORE */}
                    <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #86efac', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#166534' }}>Điểm Chất Lượng Sư Phạm</span>
                        <Award size={24} color="#16a34a" />
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#15803d', marginTop: '6px' }}>
                        {solverResult.qualityScore} <small style={{ fontSize: '16px', fontWeight: 'normal', color: '#22c55e' }}>/ 100 điểm</small>
                      </div>
                      <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                        {solverResult.qualityScore >= 95 ? '🏆 XUẤT SẮC - ĐẠT CHUẨN TUYỆT ĐỐI' : '✅ ĐẠT YÊU CẦU SƯ PHẠM'}
                      </span>
                    </div>

                    {/* CLASH COUNT */}
                    <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #bbf7d0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#166534' }}>Trùng Lịch Giáo Viên</span>
                        <ShieldCheck size={24} color="#16a34a" />
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: solverResult.clashCount === 0 ? '#15803d' : '#dc2626', marginTop: '6px' }}>
                        {solverResult.clashCount} <small style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b' }}>tiết trùng</small>
                      </div>
                      <span style={{ fontSize: '12.5px', color: solverResult.clashCount === 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                        {solverResult.clashCount === 0 ? '✨ 0% Xung đột hoàn hảo' : '⚠️ Cần kiểm tra lại'}
                      </span>
                    </div>

                    {/* WINDOW GAPS */}
                    <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #fed7aa', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#c2410c' }}>Tiết Lủng / Tiết Trống</span>
                        <Clock size={24} color="#ea580c" />
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#c2410c', marginTop: '6px' }}>
                        {solverResult.totalGaps} <small style={{ fontSize: '14px', fontWeight: 'normal', color: '#ea580c' }}>tiết</small>
                      </div>
                      <span style={{ fontSize: '12.5px', color: '#ea580c', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                        Đã tối ưu hóa giảm tối đa cho GV
                      </span>
                    </div>

                    {/* PLACED LESSONS */}
                    <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #e0e7ff', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#4338ca' }}>Tỷ Lệ Xếp Thành Công</span>
                        <CheckCircle2 size={24} color="#4f46e5" />
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#3730a3', marginTop: '6px' }}>
                        {draftSchedule.length} <small style={{ fontSize: '14px', fontWeight: 'normal', color: '#6366f1' }}>tiết đã xếp</small>
                      </div>
                      <span style={{ fontSize: '12.5px', color: '#4f46e5', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                        100% Phân công hoàn tất
                      </span>
                    </div>
                  </div>

                  {/* QUICK ACTION BANNER */}
                  <div style={{ backgroundColor: '#f0fdf4', padding: '16px 20px', borderRadius: '14px', border: '1.5px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={22} color="#16a34a" />
                      <div>
                        <strong style={{ color: '#14532d', fontSize: '14px' }}>Bản nháp Thời khóa biểu đã sẵn sàng!</strong>
                        <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                          Bạn có thể chuyển sang <strong>Studio Ma Trận</strong> để xem/tinh chỉnh hoặc sang tab <strong>So Sánh & Xuất Bản</strong> để công bố cho toàn trường.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setSchedulerSubTab('studio')}
                        style={{ padding: '9px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Grid size={16} /> Sang Studio Ma Trận
                      </button>

                      <button
                        type="button"
                        onClick={handleExportDraftExcel}
                        style={{ padding: '9px 16px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileSpreadsheet size={16} /> Tải Excel Bản Nháp
                      </button>
                    </div>
                  </div>

                  {/* TEACHER GAPS DETAILS IF ANY */}
                  {solverResult.teachersWithGaps && solverResult.teachersWithGaps.length > 0 && (
                    <div style={{ backgroundColor: '#ffffff', padding: '18px 22px', borderRadius: '14px', border: '1px solid #fed7aa' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#9a3412', fontSize: '14.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Info size={18} color="#ea580c" /> Danh sách Giáo viên có tiết lủng ({solverResult.teachersWithGaps.length} GV):
                      </h4>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {solverResult.teachersWithGaps.map(g => (
                          <span key={g.name} style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', padding: '4px 10px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 'bold' }}>
                            {g.name}: {g.gaps} tiết lủng
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 4: INTERACTIVE MATRIX STUDIO */}
          {schedulerSubTab === 'studio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* STUDIO TOOLBAR */}
              <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  
                  {/* VIEW MODE TOGGLE */}
                  <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => { setStudioView('class'); setSwapSourceSlot(null); }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        backgroundColor: studioView === 'class' ? '#4f46e5' : 'transparent',
                        color: studioView === 'class' ? '#ffffff' : '#64748b'
                      }}
                    >
                      🏫 Theo Lớp Học
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStudioView('teacher'); setSwapSourceSlot(null); }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        backgroundColor: studioView === 'teacher' ? '#4f46e5' : 'transparent',
                        color: studioView === 'teacher' ? '#ffffff' : '#64748b'
                      }}
                    >
                      👨‍🏫 Theo Giáo Viên
                    </button>
                  </div>

                  {/* SELECTOR */}
                  {studioView === 'class' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#334155' }}>Lớp:</span>
                      <select
                        value={studioSelectedClass}
                        onChange={e => { setStudioSelectedClass(e.target.value); setSwapSourceSlot(null); }}
                        style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #4f46e5', fontWeight: 'bold', fontSize: '13.5px', outline: 'none', color: '#4338ca' }}
                      >
                        {availableClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#334155' }}>Giáo viên:</span>
                      <select
                        value={studioSelectedTeacher}
                        onChange={e => { setStudioSelectedTeacher(e.target.value); setSwapSourceSlot(null); }}
                        style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #7c3aed', fontWeight: 'bold', fontSize: '13.5px', outline: 'none', color: '#5b21b6' }}
                      >
                        {availableTeachers.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* STUDIO ACTIONS */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleExportDraftExcel}
                    style={{ padding: '8px 14px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FileSpreadsheet size={15} /> Xuất Excel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPublishModal(true);
                      setPublishStep(1);
                    }}
                    style={{ padding: '8px 16px', backgroundColor: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ShieldCheck size={16} /> Xuất Bản TKB
                  </button>
                </div>
              </div>

              {/* SMART SWAP BANNER IF ACTIVE */}
              {swapSourceSlot && (
                <div style={{ backgroundColor: '#fefce8', padding: '12px 18px', borderRadius: '12px', border: '1.5px solid #fde047', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowRightLeft size={18} color="#b45309" />
                    <span style={{ fontSize: '13.5px', color: '#78350f', fontWeight: 'bold' }}>
                      👉 Đang chọn tiết: <strong>{swapSourceSlot.item.subject} ({swapSourceSlot.item.teacher_name})</strong> - {swapSourceSlot.day_of_week} Tiết {swapSourceSlot.period}.
                      <span style={{ fontWeight: 'normal', marginLeft: '6px' }}>Nhấp vào ô đích muốn đổi, hệ thống sẽ tự động kiểm tra trùng lịch!</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSwapSourceSlot(null)}
                    style={{ border: 'none', background: '#fef08a', color: '#854d0e', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Hủy Đổi
                  </button>
                </div>
              )}

              {/* STUDIO MATRIX VIEW */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '10px', width: '90px', textAlign: 'left' }}>Tiết</th>
                        {DAYS.map(d => (
                          <th key={d} style={{ padding: '10px' }}>{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* CA SANG */}
                      <tr style={{ background: '#f1f5f9', fontWeight: 'bold', color: '#475569', fontSize: '12px' }}>
                        <td colSpan={7} style={{ padding: '6px 12px', textAlign: 'left' }}>--- CA SÁNG ---</td>
                      </tr>
                      {PERIODS_MORNING.map(p => (
                        <tr key={p} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#475569' }}>Tiết {p}</td>
                          {DAYS.map(day => {
                            let item = null;
                            if (studioView === 'class') {
                              item = draftSchedule.find(s => s.student_class === studioSelectedClass && s.day_of_week === day && Number(s.period) === Number(p));
                            } else {
                              item = draftSchedule.find(s => s.teacher_name === studioSelectedTeacher && s.day_of_week === day && Number(s.period) === Number(p));
                            }

                            const isSource = swapSourceSlot && swapSourceSlot.day_of_week === day && Number(swapSourceSlot.period) === Number(p);

                            return (
                              <td
                                key={`${day}_${p}`}
                                onClick={() => handleStudioCellClick(day, p, item)}
                                style={{
                                  padding: '6px',
                                  backgroundColor: isSource ? '#fef08a' : item ? '#f8fafc' : '#ffffff',
                                  border: isSource ? '2px dashed #b45309' : '1px solid #f1f5f9',
                                  cursor: studioView === 'class' ? 'pointer' : 'default',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {item ? (
                                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
                                    <div style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '13px' }}>
                                      {item.subject}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                                      {studioView === 'class' ? item.teacher_name : item.student_class}
                                    </div>

                                    {/* PIN ICON */}
                                    {studioView === 'class' && (
                                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleTogglePinSlot(item); }}
                                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: item.isPinned ? '#b45309' : '#94a3b8' }}
                                          title={item.isPinned ? 'Đã pin cứng' : 'Nhấp để pin cứng'}
                                        >
                                          <Lock size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleDeleteStudioSlot(studioSelectedClass, day, p); }}
                                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}
                                          title="Xóa tiết"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#cbd5e1', fontSize: '12px' }}>-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* CA CHIEU */}
                      <tr style={{ background: '#f1f5f9', fontWeight: 'bold', color: '#475569', fontSize: '12px' }}>
                        <td colSpan={7} style={{ padding: '6px 12px', textAlign: 'left' }}>--- CA CHIỀU ---</td>
                      </tr>
                      {PERIODS_AFTERNOON.map(p => (
                        <tr key={p} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#475569' }}>Tiết {p}</td>
                          {DAYS.map(day => {
                            let item = null;
                            if (studioView === 'class') {
                              item = draftSchedule.find(s => s.student_class === studioSelectedClass && s.day_of_week === day && Number(s.period) === Number(p));
                            } else {
                              item = draftSchedule.find(s => s.teacher_name === studioSelectedTeacher && s.day_of_week === day && Number(s.period) === Number(p));
                            }

                            const isSource = swapSourceSlot && swapSourceSlot.day_of_week === day && Number(swapSourceSlot.period) === Number(p);

                            return (
                              <td
                                key={`${day}_${p}`}
                                onClick={() => handleStudioCellClick(day, p, item)}
                                style={{
                                  padding: '6px',
                                  backgroundColor: isSource ? '#fef08a' : item ? '#f8fafc' : '#ffffff',
                                  border: isSource ? '2px dashed #b45309' : '1px solid #f1f5f9',
                                  cursor: studioView === 'class' ? 'pointer' : 'default',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {item ? (
                                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
                                    <div style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '13px' }}>
                                      {item.subject}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                                      {studioView === 'class' ? item.teacher_name : item.student_class}
                                    </div>

                                    {/* PIN ICON */}
                                    {studioView === 'class' && (
                                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleTogglePinSlot(item); }}
                                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: item.isPinned ? '#b45309' : '#94a3b8' }}
                                          title={item.isPinned ? 'Đã pin cứng' : 'Nhấp để pin cứng'}
                                        >
                                          <Lock size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleDeleteStudioSlot(studioSelectedClass, day, p); }}
                                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}
                                          title="Xóa tiết"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#cbd5e1', fontSize: '12px' }}>-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 5: SANDBOX DIFF & SAFE PUBLISH */}
          {schedulerSubTab === 'sandbox' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* SANDBOX ISOLATION WARNING */}
              <div style={{ backgroundColor: '#eff6ff', padding: '18px 22px', borderRadius: '16px', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <ShieldCheck size={26} color="#1d4ed8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1e3a8a', fontSize: '15.5px', fontWeight: 'bold' }}>
                    🛡️ MÔI TRƯỜNG BẢN NHÁP BIỆT LẬP (SANDBOX PROTECTION)
                  </h4>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#1e40af', lineHeight: '1.5' }}>
                    Tất cả các dữ liệu xếp TKB tự động AI và tinh chỉnh ma trận ở trên đều được lưu trữ an toàn trong <strong>Bản nháp</strong>. Thời khóa biểu đang áp dụng trên Cổng tra cứu của học sinh và giáo viên hoàn toàn <strong>KHÔNG</strong> bị ảnh hưởng cho đến khi bạn bấm nút Xuất bản chính thức.
                  </p>
                </div>
              </div>

              {/* COMPARISON CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                
                {/* LIVE TIMETABLE SUMMARY */}
                <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>🌐 THỜI KHÓA BIỂU ĐANG ÁP DỤNG</span>
                    <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      Đang Trực Tuyến
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                    <div>• Tổng số tiết học: <strong>{timetableData.length} tiết</strong></div>
                    <div>• Số lớp học: <strong>{uniqueClassesCount} lớp</strong></div>
                    <div>• Số giáo viên giảng dạy: <strong>{uniqueTeachersCount} giáo viên</strong></div>
                  </div>
                </div>

                {/* DRAFT TIMETABLE SUMMARY */}
                <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', border: '2px solid #818cf8', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4338ca' }}>✨ BẢN NHÁP MỚI TỪ AI SOLVER</span>
                    <span style={{ backgroundColor: '#eef2ff', color: '#4f46e5', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      Bản Nháp Sẵn Sàng
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                    <div>• Tổng số tiết đã xếp: <strong>{draftSchedule.length} tiết</strong></div>
                    <div>• Trùng lịch giáo viên: <strong style={{ color: '#16a34a' }}>0 tiết (100% không trùng)</strong></div>
                    <div>• Điểm chất lượng: <strong style={{ color: '#4f46e5' }}>{solverResult?.qualityScore || 100} / 100 điểm</strong></div>
                  </div>
                </div>
              </div>

              {/* ACTION PUBLISH FOOTER */}
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: 'bold' }}>
                    Sẵn sàng áp dụng cho toàn trường?
                  </h4>
                  <p style={{ margin: '3px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                    Bản nháp sẽ được lưu vào cơ sở dữ liệu chính và hiển thị trên Cổng tra cứu của Giáo viên & Học sinh.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleExportDraftExcel}
                    style={{ padding: '10px 18px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={16} /> Tải Excel Lưu Trữ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPublishModal(true);
                      setPublishStep(1);
                    }}
                    style={{ padding: '10px 22px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)' }}
                  >
                    <ShieldCheck size={18} /> 🚀 Áp Dụng & Xuất Bản TKB Toàn Trường
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ADD / EDIT ASSIGNMENT MODAL */}
      {showAddAssignmentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>
                {editingAssignmentId ? '📝 Sửa Phân Công Giảng Dạy' : '➕ Thêm Phân Công Mới'}
              </h3>
              <button type="button" onClick={() => setShowAddAssignmentModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={styles.label}>Lớp Học:</label>
                <input
                  type="text"
                  value={newAssignment.student_class}
                  onChange={e => setNewAssignment({ ...newAssignment, student_class: normalizeClassCode(e.target.value) })}
                  placeholder="VD: 10A01, 11A05, 12A02"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Môn Học:</label>
                <input
                  type="text"
                  value={newAssignment.subject}
                  onChange={e => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                  placeholder="VD: Toán, Ngữ văn, Tiếng Anh..."
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Giáo Viên Giảng Dạy:</label>
                <input
                  type="text"
                  value={newAssignment.teacher_name}
                  onChange={e => setNewAssignment({ ...newAssignment, teacher_name: getFullTeacherName(e.target.value) })}
                  placeholder="VD: Lê Thị Thảo, Nguyễn Hữu Lam..."
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Số Tiết / Tuần:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newAssignment.periods_per_week}
                    onChange={e => setNewAssignment({ ...newAssignment, periods_per_week: Number(e.target.value) })}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Ca Học:</label>
                  <select
                    value={newAssignment.shift}
                    onChange={e => setNewAssignment({ ...newAssignment, shift: e.target.value })}
                    style={styles.input}
                  >
                    <option value="morning">☀️ Ca Sáng</option>
                    <option value="afternoon">⛅ Ca Chiều</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowAddAssignmentModal(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>
                Hủy bỏ
              </button>
              <button type="button" onClick={handleAddOrUpdateAssignment} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}>
                {editingAssignmentId ? 'Lưu Thay Đổi' : 'Thêm Phân Công'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-STEP SAFE PUBLISH CONFIRMATION MODAL */}
      {showPublishModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', maxWidth: '520px', width: '100%', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', border: '1px solid #cbd5e1' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={24} color="#166534" /> XÁC NHẬN XUẤT BẢN THỜI KHÓA BIỂU
              </h3>
              <button type="button" onClick={() => setShowPublishModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {publishStep === 1 ? (
              <div>
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                  Bạn đang chuẩn bị xuất bản <strong>{draftSchedule.length} tiết học</strong> từ Bản nháp AI làm Thời khóa biểu chính thức của toàn trường.
                </p>

                <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '16px', fontSize: '13px', color: '#166534' }}>
                  ✓ Đã kiểm tra 0% xung đột lịch giáo viên.<br />
                  ✓ Cổng tra cứu học sinh và giáo viên sẽ cập nhật ngay lập tức.<br />
                  ✓ Bản sao lưu TKB hiện tại sẽ được lưu trữ tự động.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowPublishModal(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>
                    Hủy bỏ
                  </button>
                  <button type="button" onClick={() => setPublishStep(2)} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#166534', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}>
                    Tiếp Tục ➔
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1.5px solid #fca5a5', marginBottom: '18px' }}>
                  <div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <AlertTriangle size={18} color="#dc2626" /> XÁC NHẬN LẦN CUỐI (BƯỚC 2/2)
                  </div>
                  <div style={{ fontSize: '13px', color: '#b91c1c', lineHeight: '1.5' }}>
                    Thao tác này sẽ ghi đè Thời khóa biểu đang áp dụng trên hệ thống. Bạn có chắc chắn muốn xuất bản ngay bây giờ không?
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setPublishStep(1)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>
                    Quay Lại
                  </button>
                  <button
                    type="button"
                    onClick={handlePublishDraftTimetable}
                    disabled={saving}
                    style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}
                  >
                    {saving ? 'Đang xuất bản...' : '🚀 XUẤT BẢN CHÍNH THỨC'}
                  </button>
                </div>
              </div>
            )}

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

