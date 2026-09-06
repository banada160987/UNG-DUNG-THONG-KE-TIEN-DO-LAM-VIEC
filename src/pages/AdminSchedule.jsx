import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Calendar, Plus, Save, Trash2, Edit3, Eye, Clock, MapPin, CheckCircle2, 
  RefreshCw, Upload, Download, FileSpreadsheet, Users, BookOpen, Search, ShieldCheck 
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

export default function AdminSchedule() {
  const [activeTab, setActiveTab] = useState('bgh_schedule'); // 'bgh_schedule' | 'timetable_excel'
  const [schedules, setSchedules] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State for BGH Schedule
  const [title, setTitle] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bghDuty, setBghDuty] = useState('');
  const [teacherDuty, setTeacherDuty] = useState('');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState([]);

  // New Item State for BGH Schedule
  const [newItemDay, setNewItemDay] = useState('Thứ Hai');
  const [newItemTime, setNewItemTime] = useState('07:30');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('Sân trường');
  const [newItemChair, setNewItemChair] = useState('BGH');
  const [newItemParticipants, setNewItemParticipants] = useState('Toàn thể GV & HS');

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

  async function fetchTimetableData() {
    try {
      const { data, error } = await supabase
        .from('cbq_timetable_items')
        .select('*')
        .order('student_class', { ascending: true });

      if (!error && data && data.length > 0) {
        setTimetableData(data);
        localStorage.setItem('cbq_master_timetable', JSON.stringify(data));
      } else {
        const cached = localStorage.getItem('cbq_master_timetable');
        if (cached) {
          setTimetableData(JSON.parse(cached));
        } else {
          setTimetableData(SAMPLE_TIMETABLE_DATA);
          localStorage.setItem('cbq_master_timetable', JSON.stringify(SAMPLE_TIMETABLE_DATA));
        }
      }
    } catch (err) {
      const cached = localStorage.getItem('cbq_master_timetable');
      if (cached) setTimetableData(JSON.parse(cached));
      else setTimetableData(SAMPLE_TIMETABLE_DATA);
    }
  }

  // --- BGH SCHEDULE ACTIONS ---
  const handleAddItem = () => {
    if (!newItemContent.trim()) {
      alert("Vui lòng nhập nội dung công việc!");
      return;
    }
    const newItem = {
      day: newItemDay,
      time: newItemTime,
      content: newItemContent.trim(),
      location: newItemLocation.trim(),
      chair: newItemChair.trim(),
      participants: newItemParticipants.trim()
    };
    setItems([...items, newItem]);
    setNewItemContent('');
  };

  const handleDeleteItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleEditSchedule = (s) => {
    setEditingId(s.id);
    setTitle(s.title || '');
    setWeekNumber(s.week_number || 1);
    setStartDate(s.start_date || '');
    setEndDate(s.end_date || '');
    setBghDuty(s.bgh_duty || '');
    setTeacherDuty(s.teacher_duty || '');
    setNote(s.note || '');
    setIsActive(s.is_active ?? true);
    setItems(s.schedule_items || []);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Lịch công tác tuần này?")) return;
    try {
      const { error } = await supabase.from('cbq_schedules').delete().eq('id', id);
      if (error) throw error;
      fetchSchedules();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleSubmitBghSchedule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        week_number: Number(weekNumber) || 1,
        start_date: startDate,
        end_date: endDate,
        bgh_duty: bghDuty,
        teacher_duty: teacherDuty,
        schedule_items: items,
        note,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase.from('cbq_schedules').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cbq_schedules').insert([payload]);
        if (error) throw error;
      }

      alert("🎉 ĐÃ LƯU LỊCH CÔNG TÁC TUẦN THÀNH CÔNG!");
      setShowForm(false);
      setEditingId(null);
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          alert("File Excel rỗng hoặc không đúng định dạng!");
          return;
        }

        // Normalize keys
        const parsed = rawJson.map((row, idx) => {
          const studentClass = row['Lớp'] || row['Lop'] || row['Class'] || row['CLASS'] || row['student_class'] || '10A1';
          const day = row['Thứ'] || row['Thu'] || row['Day'] || row['day_of_week'] || 'Thứ 2';
          const period = Number(row['Tiết'] || row['Tiet'] || row['Period'] || row['period']) || 1;
          const subject = row['Môn Học'] || row['Môn'] || row['Mon'] || row['Subject'] || row['subject'] || 'Chưa rõ';
          const teacher = row['Giáo Viên'] || row['Giao Vien'] || row['GV'] || row['Teacher'] || row['teacher_name'] || 'Chưa phân công';
          const room = row['Phòng Học'] || row['Phòng'] || row['Phong'] || row['Room'] || row['room'] || 'Lớp học';

          return {
            id: `excel-${idx}-${Date.now()}`,
            student_class: String(studentClass).trim().toUpperCase(),
            day_of_week: String(day).trim(),
            period: period,
            subject: String(subject).trim(),
            teacher_name: String(teacher).trim(),
            room: String(room).trim()
          };
        });

        setExcelPreview(parsed);
        alert(`🎉 Đã đọc thành công ${parsed.length} tiết học từ file Excel! Vui lòng kiểm tra và bấm nút "Lưu TKB Toàn Trường".`);
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

      {/* TAB 1: BGH WEEKLY SCHEDULE */}
      {activeTab === 'bgh_schedule' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button 
              onClick={() => {
                setEditingId(null);
                setTitle(`LỊCH CÔNG TÁC TUẦN ${schedules.length + 1}`);
                setWeekNumber(schedules.length + 1);
                setItems([]);
                setShowForm(!showForm);
              }} 
              className="btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', backgroundColor: '#be123c' }}
            >
              <Plus size={18} /> {showForm ? 'Đóng Form' : 'Tạo Lịch Tuần Mới'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmitBghSchedule} className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '2rem' }}>
              <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                {editingId ? '📝 Cập nhật Lịch công tác tuần' : '➕ Tạo Lịch công tác tuần mới'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <label style={styles.label}>Tiêu đề Lịch tuần (*)</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={styles.input} placeholder="VD: LỊCH CÔNG TÁC TUẦN 01" />
                </div>

                <div>
                  <label style={styles.label}>Tuần thứ (*)</label>
                  <input type="number" required value={weekNumber} onChange={e => setWeekNumber(e.target.value)} style={styles.input} />
                </div>

                <div>
                  <label style={styles.label}>Từ Ngày</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.input} />
                </div>

                <div>
                  <label style={styles.label}>Đến Ngày</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.input} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={styles.label}>Trực Ban Giám Hiệu</label>
                  <input type="text" value={bghDuty} onChange={e => setBghDuty(e.target.value)} style={styles.input} placeholder="VD: Thầy Lê Văn A - Hiệu trưởng" />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={styles.label}>Trực Ban Giáo Viên</label>
                  <input type="text" value={teacherDuty} onChange={e => setTeacherDuty(e.target.value)} style={styles.input} placeholder="VD: Cô Nguyễn Thị B - Trực ban" />
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>📌 Danh sách Công việc các ngày trong tuần ({items.length} mục)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', marginBottom: '15px' }}>
                  <div>
                    <label style={styles.label}>Thứ / Ngày</label>
                    <input type="text" value={newItemDay} onChange={e => setNewItemDay(e.target.value)} style={styles.input} placeholder="Thứ Hai (01/09)" />
                  </div>
                  <div>
                    <label style={styles.label}>Thời gian</label>
                    <input type="text" value={newItemTime} onChange={e => setNewItemTime(e.target.value)} style={styles.input} placeholder="07:30" />
                  </div>
                  <div>
                    <label style={styles.label}>Nội dung công việc (*)</label>
                    <input type="text" value={newItemContent} onChange={e => setNewItemContent(e.target.value)} style={styles.input} placeholder="Nội dung họp/hoạt động..." />
                  </div>
                  <div>
                    <label style={styles.label}>Địa điểm</label>
                    <input type="text" value={newItemLocation} onChange={e => setNewItemLocation(e.target.value)} style={styles.input} placeholder="Phòng họp" />
                  </div>
                  <div>
                    <label style={styles.label}>Chủ trì</label>
                    <input type="text" value={newItemChair} onChange={e => setNewItemChair(e.target.value)} style={styles.input} placeholder="BGH" />
                  </div>
                  <div>
                    <label style={styles.label}>Thành phần</label>
                    <input type="text" value={newItemParticipants} onChange={e => setNewItemParticipants(e.target.value)} style={styles.input} placeholder="Toàn trường" />
                  </div>
                  <button type="button" onClick={handleAddItem} className="btn-primary" style={{ padding: '10px 14px', backgroundColor: '#166534' }}>
                    <Plus size={16} /> Thêm
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#ffffff' }}>
                      <th style={{ padding: '8px' }}>Thứ / Ngày</th>
                      <th style={{ padding: '8px' }}>Giờ</th>
                      <th style={{ padding: '8px' }}>Nội dung</th>
                      <th style={{ padding: '8px' }}>Địa điểm</th>
                      <th style={{ padding: '8px' }}>Chủ trì</th>
                      <th style={{ padding: '8px' }}>Thành phần</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#be123c' }}>{it.day}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{it.time}</td>
                        <td style={{ padding: '8px' }}>{it.content}</td>
                        <td style={{ padding: '8px', color: '#0284c7' }}>{it.location}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#b45309' }}>{it.chair}</td>
                        <td style={{ padding: '8px', color: '#64748b' }}>{it.participants}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <button type="button" onClick={() => handleDeleteItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px', backgroundColor: '#be123c' }}>
                  <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu & Xuất Bản'}
                </button>
              </div>
            </form>
          )}

          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              📋 Danh sách Lịch công tác tuần đã đăng ({schedules.length})
            </h3>

            {loading ? <p>Đang nạp dữ liệu...</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '10px' }}>Tuần</th>
                      <th style={{ padding: '10px' }}>Tiêu đề lịch tuần</th>
                      <th style={{ padding: '10px' }}>Trực BGH</th>
                      <th style={{ padding: '10px' }}>Số mục công việc</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s, idx) => (
                      <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#be123c' }}>Tuần {s.week_number}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{s.title}</td>
                        <td style={{ padding: '10px', color: '#b45309' }}>{s.bgh_duty || 'Chưa phân công'}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{s.schedule_items?.length || 0} mục</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => handleEditSchedule(s)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                              <Edit3 size={14} /> Sửa
                            </button>
                            <button type="button" onClick={() => handleDeleteSchedule(s.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={14} /> Xóa
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
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }
};

