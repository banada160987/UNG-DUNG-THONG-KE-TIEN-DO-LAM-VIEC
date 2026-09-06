import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Calendar, Clock, MapPin, Printer, FileSpreadsheet 
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

const SAMPLE_TIMETABLE_DATA = [
  { id: '1', student_class: '10A1', day_of_week: 'Thứ 2', period: 1, subject: 'Chào cờ', teacher_name: 'BGH & GVCN', room: 'Sân trường' },
  { id: '2', student_class: '10A1', day_of_week: 'Thứ 2', period: 2, subject: 'Toán', teacher_name: 'Thầy Nguyễn Văn A', room: 'P.101' },
  { id: '3', student_class: '10A1', day_of_week: 'Thứ 2', period: 3, subject: 'Toán', teacher_name: 'Thầy Nguyễn Văn A', room: 'P.101' },
  { id: '4', student_class: '10A1', day_of_week: 'Thứ 2', period: 4, subject: 'Ngữ văn', teacher_name: 'Cô Trần Thị B', room: 'P.101' },
  { id: '5', student_class: '10A1', day_of_week: 'Thứ 2', period: 5, subject: 'Tiếng Anh', teacher_name: 'Cô Lê Thị D', room: 'P.101' },
  { id: '6', student_class: '10A1', day_of_week: 'Thứ 3', period: 1, subject: 'Vật lý', teacher_name: 'Thầy Phạm Văn C', room: 'P.101' },
  { id: '7', student_class: '10A1', day_of_week: 'Thứ 3', period: 2, subject: 'Vật lý', teacher_name: 'Thầy Phạm Văn C', room: 'P.101' },
  { id: '8', student_class: '10A1', day_of_week: 'Thứ 3', period: 3, subject: 'Hóa học', teacher_name: 'Cô Hoàng Thị E', room: 'P.Lab1' },
  { id: '9', student_class: '10A1', day_of_week: 'Thứ 3', period: 4, subject: 'Lịch sử', teacher_name: 'Thầy Đỗ Văn F', room: 'P.101' },
  { id: '10', student_class: '10A1', day_of_week: 'Thứ 3', period: 5, subject: 'Địa lý', teacher_name: 'Cô Bùi Thị G', room: 'P.101' },
  { id: '11', student_class: '11A1', day_of_week: 'Thứ 2', period: 1, subject: 'Chào cờ', teacher_name: 'BGH & GVCN', room: 'Sân trường' },
  { id: '12', student_class: '11A1', day_of_week: 'Thứ 2', period: 2, subject: 'Ngữ văn', teacher_name: 'Cô Trần Thị B', room: 'P.201' },
  { id: '13', student_class: '11A1', day_of_week: 'Thứ 2', period: 3, subject: 'Ngữ văn', teacher_name: 'Cô Trần Thị B', room: 'P.201' },
  { id: '14', student_class: '11A1', day_of_week: 'Thứ 2', period: 4, subject: 'Toán', teacher_name: 'Thầy Nguyễn Văn A', room: 'P.201' },
  { id: '15', student_class: '11A1', day_of_week: 'Thứ 2', period: 5, subject: 'Vật lý', teacher_name: 'Thầy Phạm Văn C', room: 'P.201' },
  { id: '16', student_class: '12A1', day_of_week: 'Thứ 4', period: 1, subject: 'Toán', teacher_name: 'Thầy Nguyễn Văn A', room: 'P.301' },
  { id: '17', student_class: '12A1', day_of_week: 'Thứ 4', period: 2, subject: 'Toán', teacher_name: 'Thầy Nguyễn Văn A', room: 'P.301' },
  { id: '18', student_class: '12A1', day_of_week: 'Thứ 4', period: 3, subject: 'Tiếng Anh', teacher_name: 'Cô Lê Thị D', room: 'P.301' },
  { id: '19', student_class: '12A1', day_of_week: 'Thứ 4', period: 4, subject: 'Hóa học', teacher_name: 'Cô Hoàng Thị E', room: 'P.301' },
  { id: '20', student_class: '12A1', day_of_week: 'Thứ 4', period: 5, subject: 'Sinh học', teacher_name: 'Thầy Vũ Văn H', room: 'P.301' }
];

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function PublicSchedule() {
  const [activeMainTab, setActiveMainTab] = useState('bgh_schedule');
  const [schedules, setSchedules] = useState([DEFAULT_SCHEDULE]);
  const [selectedSchedule, setSelectedSchedule] = useState(DEFAULT_SCHEDULE);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('10A1');
  const [selectedTeacher, setSelectedTeacher] = useState('');

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
        .order('week_number', { ascending: false });

      if (!error && data && data.length > 0) {
        setSchedules(data);
        setSelectedSchedule(data[0]);
      }
    } catch (err) {
      console.warn("Dùng lịch công tác mặc định:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimetableData() {
    try {
      const { data, error } = await supabase.from('cbq_timetable_items').select('*');
      if (!error && data && data.length > 0) {
        setTimetableData(data);
        localStorage.setItem('cbq_master_timetable', JSON.stringify(data));
      } else {
        const cached = localStorage.getItem('cbq_master_timetable');
        if (cached) setTimetableData(JSON.parse(cached));
        else setTimetableData(SAMPLE_TIMETABLE_DATA);
      }
    } catch (err) {
      const cached = localStorage.getItem('cbq_master_timetable');
      if (cached) setTimetableData(JSON.parse(cached));
      else setTimetableData(SAMPLE_TIMETABLE_DATA);
    }
  }

  const availableClasses = Array.from(new Set(timetableData.map(t => t.student_class))).filter(Boolean).sort();
  const availableTeachers = Array.from(new Set(timetableData.map(t => t.teacher_name))).filter(Boolean).sort();

  useEffect(() => {
    if (availableTeachers.length > 0 && !selectedTeacher) {
      setSelectedTeacher(availableTeachers[0]);
    }
  }, [availableTeachers, selectedTeacher]);

  const handlePrint = () => window.print();

  const getLessonForClass = (day, period) => timetableData.find(t => t.student_class === selectedClass && t.day_of_week === day && Number(t.period) === period);
  const getLessonForTeacher = (day, period) => timetableData.find(t => t.teacher_name === selectedTeacher && t.day_of_week === day && Number(t.period) === period);

  const handleExportClassTkbExcel = () => {
    const classLessons = timetableData.filter(t => t.student_class === selectedClass);
    const dataToExport = classLessons.map(t => ({ "Lớp": t.student_class, "Thứ": t.day_of_week, "Tiết": t.period, "Môn Học": t.subject, "Giáo Viên": t.teacher_name, "Phòng": t.room || 'Lớp học' }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `TKB_Lop_${selectedClass}`);
    XLSX.writeFile(wb, `ThoiKhoaBieu_Lop_${selectedClass}.xlsx`);
  };

  const handleExportTeacherTkbExcel = () => {
    const teacherLessons = timetableData.filter(t => t.teacher_name === selectedTeacher);
    const dataToExport = teacherLessons.map(t => ({ "Giáo Viên": t.teacher_name, "Thứ": t.day_of_week, "Tiết": t.period, "Lớp": t.student_class, "Môn Học": t.subject, "Phòng": t.room || 'Lớp học' }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `TKB_${selectedTeacher}`);
    XLSX.writeFile(wb, `ThoiKhoaBieu_GiaoVien_${selectedTeacher.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div style={styles.container}>
      <style>{`@media print { header, nav, footer, .no-print { display: none !important; } .print-full { width: 100% !important; margin: 0 !important; } }`}</style>
      
      <div style={styles.headerCard} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={32} color="#be123c" />
          <div>
            <h2 style={styles.pageTitle}>TRA CỨU LỊCH CÔNG TÁC & THỜI KHÓA BIỂU</h2>
            <p style={styles.pageSubtitle}>Trường THPT Cao Bá Quát • Hệ thống quản lý điều hành</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '15px' }}>
          {['bgh_schedule', 'class_tkb', 'teacher_tkb'].map(tab => (
            <button key={tab} onClick={() => setActiveMainTab(tab)} style={{ ...styles.tabBtn, backgroundColor: activeMainTab === tab ? '#be123c' : '#f1f5f9', color: activeMainTab === tab ? '#fff' : '#334' }}>
              {tab === 'bgh_schedule' ? '📅 Lịch BGH' : tab === 'class_tkb' ? '🎓 TKB Lớp' : '👨‍🏫 TKB Giáo viên'}
            </button>
          ))}
        </div>
      </div>

      {activeMainTab === 'bgh_schedule' && (
        <div style={styles.sheetCard} className="print-full">
          <div style={styles.sheetHeader}>
            <h3 style={{ margin: 0, color: '#be123c' }}>{selectedSchedule.title}</h3>
            <p>Từ {selectedSchedule.start_date} đến {selectedSchedule.end_date}</p>
          </div>
          <div style={styles.dutyBox} className="no-print">
            <div style={styles.dutyItem}><span style={styles.dutyLabel}>👑 TRỰC BGH:</span> {selectedSchedule.bgh_duty}</div>
            <div style={styles.dutyItem}><span style={styles.dutyLabel}>📋 TRỰC GV:</span> {selectedSchedule.teacher_duty}</div>
          </div>
          <table style={styles.table}>
            <thead><tr style={styles.tableHeadRow}><th style={styles.th}>Thứ</th><th style={styles.th}>Giờ</th><th style={styles.th}>Nội dung</th><th style={styles.th}>Chủ trì</th></tr></thead>
            <tbody>
              {selectedSchedule.schedule_items.map((item, i) => (
                <tr key={i} style={styles.tableRow}><td style={styles.td}>{item.day}</td><td style={styles.td}>{item.time}</td><td style={styles.td}>{item.content}</td><td style={styles.td}>{item.chair}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(activeMainTab === 'class_tkb' || activeMainTab === 'teacher_tkb') && (
        <div style={styles.sheetCard} className="print-full">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }} className="no-print">
            {activeMainTab === 'class_tkb' ? (
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={styles.select}>{availableClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            ) : (
              <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={styles.select}>{availableTeachers.map(t => <option key={t} value={t}>{t}</option>)}</select>
            )}
            <button onClick={handlePrint} style={styles.printBtn}><Printer size={16} /> In</button>
          </div>
          <table style={styles.table}>
            <thead><tr style={styles.tableHeadRow}>{['Tiết', ...DAYS].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                <tr key={p} style={styles.tableRow}><td style={styles.td}>{p}</td>{DAYS.map(d => <td key={d} style={styles.td}>{activeMainTab === 'class_tkb' ? (getLessonForClass(d, p)?.subject || '-') : (getLessonForTeacher(d, p)?.subject || '-')}</td>)}</tr>
              ))}
            </tbody>
          </table>
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
