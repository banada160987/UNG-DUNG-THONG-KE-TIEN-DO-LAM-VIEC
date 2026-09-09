import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Calendar, Plus, Save, Trash2, Edit3, Eye, Clock, MapPin, CheckCircle2, 
  RefreshCw, Upload, Download, FileSpreadsheet, Users, BookOpen, Search, ShieldCheck,
  Share2, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import masterTimetableData from '../data/master_timetable.json';
import { 
  getSchoolWeeks2026, 
  getDefaultScheduleDays, 
  exportScheduleToWordDecree30, 
  exportMultipleSchedulesToWordDecree30, 
  getScheduleDataForWeek, 
  ROMAN_NUMERALS 
} from '../utils/decree30ScheduleWord';

export default function AdminSchedule() {
  const [activeTab, setActiveTab] = useState('bgh_schedule'); // 'bgh_schedule' | 'timetable_excel'
  const [schedules, setSchedules] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Multi-Week / 35-Week Flexible Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState('single'); // 'single' | 'all35' | 'term1' | 'term2' | 'custom'
  const [fromWeek, setFromWeek] = useState(1);
  const [toWeek, setToWeek] = useState(35);

  // Admin Link Generator State
  const [shareType, setShareType] = useState('class'); // 'class' | 'teacher'
  const [shareClass, setShareClass] = useState('10A1');
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
      teacher_name: TEACHER_FULL_MAP[String(item.teacher_name).trim()] || String(item.teacher_name).trim()
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

  // --- 35 WEEKS BGH SCHEDULE ACTIONS ---
  const handleSelectWeek = (wNo) => {
    const wNum = Number(wNo) || 1;
    setSelectedWeekNo(wNum);
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
      { "Lớp": "10A1", "Thứ": "Thứ 2", "Tiết": 1, "Môn Học": "Chào cờ", "Giáo Viên": "BGH & GVCN", "Phòng Học": "Sân trường" },
      { "Lớp": "10A1", "Thứ": "Thứ 2", "Tiết": 2, "Môn Học": "Toán", "Giáo Viên": "Thầy Nguyễn Văn A", "Phòng Học": "P.101" },
      { "Lớp": "10A1", "Thứ": "Thứ 2", "Tiết": 3, "Môn Học": "Toán", "Giáo Viên": "Thầy Nguyễn Văn A", "Phòng Học": "P.101" },
      { "Lớp": "10A1", "Thứ": "Thứ 2", "Tiết": 4, "Môn Học": "Ngữ văn", "Giáo Viên": "Cô Trần Thị B", "Phòng Học": "P.101" },
      { "Lớp": "10A1", "Thứ": "Thứ 2", "Tiết": 5, "Môn Học": "Tiếng Anh", "Giáo Viên": "Cô Lê Thị D", "Phòng Học": "P.101" },
      { "Lớp": "11A1", "Thứ": "Thứ 3", "Tiết": 1, "Môn Học": "Vật lý", "Giáo Viên": "Thầy Phạm Văn C", "Phòng Học": "P.201" },
      { "Lớp": "11A1", "Thứ": "Thứ 3", "Tiết": 2, "Môn Học": "Vật lý", "Giáo Viên": "Thầy Phạm Văn C", "Phòng Học": "P.201" },
      { "Lớp": "12A1", "Thứ": "Thứ 4", "Tiết": 1, "Môn Học": "Hóa học", "Giáo Viên": "Cô Hoàng Thị E", "Phòng Học": "P.301" }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_TKB_Truong");
    XLSX.writeFile(wb, "Mau_ThoiKhoaBieu_THPT_CaoBaQuat.xlsx");
  };

  const normalizeClassName = (cls) => {
    if (!cls) return '';
    return String(cls).trim().toUpperCase();
  };

  const SUBJECT_MAP = {
    'TOAN': 'Toán', 'VAN': 'Ngữ văn', 'NN': 'Tiếng Anh', 'LY': 'Vật lý', 'HOA': 'Hóa học',
    'SINH': 'Sinh học', 'SU': 'Lịch sử', 'DIA': 'Địa lý', 'TIN': 'Tin học', 'CN': 'Công nghệ',
    'GDTC': 'Thể dục', 'QPAN': 'GDQP-AN', 'GD': 'GDCD/KTLP', 'TrNg': 'HĐ Trải nghiệm',
    'GDĐP': 'GD Địa phương', 'CC': 'Chào cờ', 'SH': 'Sinh hoạt lớp'
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
    "Hoa (AV)": "Trần Thị Quỳnh Hoa", "Hà (AV)": "Nguyễn Thị Hà", "Hậu": "Nguyễn Thị Hậu",
    "Hồng (AV)": "Nguyễn Thị Hồng", "Ngọc": "Bùi Hoài Thanh Ngọc", "Quy": "Võ Thị Kim Quy",
    "Thơm": "Đặng Thị Thơm", "Hà (Văn)": "Nguyễn Thị Hà", "Lan": "Phạm Thị Ngọc Lan",
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

                const normalizedClass = normalizeClassName(rawClassName);
                const cellVal = String(row[c] || '').trim();
                if (!cellVal) continue;

                let subject = cellVal;
                let teacher = 'BGH & GVCN';

                if (cellVal.includes('-')) {
                  const parts = cellVal.split('-').map(p => p.trim());
                  const subCode = parts[0];
                  subject = SUBJECT_MAP[subCode] || subCode;
                  const rawTeacherCode = parts.slice(1).join(' - ');
                  teacher = TEACHER_FULL_MAP[rawTeacherCode] || rawTeacherCode;
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

              const studentClass = normalizeClassName(rawClass);
              const day = row['Thứ'] || row['Thu'] || row['Day'] || row['day_of_week'] || 'Thứ 2';
              let period = Number(row['Tiết'] || row['Tiet'] || row['Period'] || row['period']) || 1;
              const session = String(row['Buổi'] || row['Buoi'] || row['Session'] || '').toLowerCase();
              
              if ((session.includes('chiều') || session.includes('chieu') || isAfternoonSheet) && period <= 5) {
                period = period + 5;
              }

              const subject = row['Môn Học'] || row['Môn'] || row['Mon'] || row['Subject'] || row['subject'] || 'Chưa rõ';
              const rawTeacher = row['Giáo Viên'] || row['Giao Vien'] || row['GV'] || row['Teacher'] || row['teacher_name'] || 'Chưa phân công';
              const teacher = TEACHER_FULL_MAP[String(rawTeacher).trim()] || String(rawTeacher).trim();
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
                    Tuần {w.roman} ({w.week_number}) - {w.date_range_str}
                  </option>
                ))}
              </select>

              <div style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold', marginLeft: 'auto' }}>
                📌 Ngày ban hành: <span style={{ color: '#0284c7' }}>{releaseDateStr}</span>
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
                <span>📌 <strong>Chỉ xuất Tuần đang chọn</strong> (Tuần {selectedWeekNo} - {ROMAN_NUMERALS[selectedWeekNo - 1]})</span>
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

              {/* OPTION 5: CUSTOM RANGE */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: exportMode === 'custom' ? '2px solid #0284c7' : '1px solid #cbd5e1', backgroundColor: exportMode === 'custom' ? '#f0f9ff' : '#ffffff', cursor: 'pointer' }}>
                <input type="radio" name="exportMode" value="custom" checked={exportMode === 'custom'} onChange={() => setExportMode('custom')} />
                <span>⚙️ <strong>Tùy chọn khoảng số tuần:</strong></span>
              </label>

              {exportMode === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '32px', marginTop: '-4px' }}>
                  <span style={{ fontSize: '13.5px', color: '#475569' }}>Từ:</span>
                  <select value={fromWeek} onChange={e => setFromWeek(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                    {schoolWeeks.map(w => (
                      <option key={w.week_number} value={w.week_number}>Tuần {w.week_number} ({w.roman})</option>
                    ))}
                  </select>

                  <span style={{ fontSize: '13.5px', color: '#475569' }}>Đến:</span>
                  <select value={toWeek} onChange={e => setToWeek(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                    {schoolWeeks.map(w => (
                      <option key={w.week_number} value={w.week_number}>Tuần {w.week_number} ({w.roman})</option>
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

