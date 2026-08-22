import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin, User, Users, Printer, ChevronLeft, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';

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

export default function PublicSchedule() {
  const [schedules, setSchedules] = useState([DEFAULT_SCHEDULE]);
  const [selectedSchedule, setSelectedSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media print {
          header, nav, footer, .no-print { display: none !important; }
          .print-full { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* BANNER HEADER */}
      <div style={styles.headerCard} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={32} color="#be123c" />
          <div>
            <h2 style={styles.pageTitle}>LỊCH CÔNG TÁC TUẦN & TRỰC BGH</h2>
            <p style={styles.pageSubtitle}>Trường THPT Cao Bá Quát • Hệ thống điều hành & quản lý nhà trường</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={selectedSchedule?.id || ''} 
            onChange={e => {
              const found = schedules.find(s => s.id === e.target.value);
              if (found) setSelectedSchedule(found);
            }}
            style={styles.selectWeek}
          >
            {schedules.map((s, idx) => (
              <option key={s.id || idx} value={s.id}>
                Tuần {s.week_number}: {s.title}
              </option>
            ))}
          </select>

          <button onClick={handlePrint} style={styles.printBtn}>
            <Printer size={18} /> In Lịch Tuần
          </button>
        </div>
      </div>

      {/* SCHEDULE SHEET FOR DISPLAY & PRINT */}
      <div style={styles.sheetCard} className="print-full">
        {/* Header Title */}
        <div style={styles.sheetHeader}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#be123c', textTransform: 'uppercase' }}>
            {selectedSchedule?.title || 'LỊCH CÔNG TÁC TUẦN NHÀ TRƯỜNG'}
          </h3>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Thời gian áp dụng: Từ {selectedSchedule?.start_date || '01/09/2026'} đến {selectedSchedule?.end_date || '07/09/2026'}
          </div>
        </div>

        {/* DUTY ROSTER BOX */}
        <div style={styles.dutyBox} className="no-print">
          <div style={styles.dutyItem}>
            <span style={styles.dutyLabel}>👑 TRỰC BAN GIÁM HIỆU:</span>
            <span style={styles.dutyValue}>{selectedSchedule?.bgh_duty || 'Thầy Lê Văn A - Hiệu trưởng'}</span>
          </div>
          <div style={styles.dutyItem}>
            <span style={styles.dutyLabel}>📋 TRỰC BAN GIÁO VIÊN:</span>
            <span style={styles.dutyValue}>{selectedSchedule?.teacher_duty || 'Cô Nguyễn Thị B - Trực ban'}</span>
          </div>
        </div>

        {/* TABLE OF SCHEDULE ITEMS */}
        <div style={{ overflowX: 'auto', marginTop: '15px' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={{ ...styles.th, width: '15%' }}>Thứ / Ngày</th>
                <th style={{ ...styles.th, width: '10%' }}>Thời gian</th>
                <th style={{ ...styles.th, width: '35%' }}>Nội dung công việc</th>
                <th style={{ ...styles.th, width: '15%' }}>Địa điểm</th>
                <th style={{ ...styles.th, width: '10%' }}>Chủ trì</th>
                <th style={{ ...styles.th, width: '15%' }}>Thành phần tham dự</th>
              </tr>
            </thead>
            <tbody>
              {selectedSchedule?.schedule_items && selectedSchedule.schedule_items.length > 0 ? (
                selectedSchedule.schedule_items.map((item, idx) => (
                  <tr key={idx} style={{ ...styles.tableRow, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ ...styles.td, fontWeight: 'bold', color: '#be123c' }}>{item.day}</td>
                    <td style={{ ...styles.td, fontWeight: 'bold', color: '#0f172a' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} color="#64748b" /> {item.time}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: '#1e293b', fontWeight: '500' }}>{item.content}</td>
                    <td style={{ ...styles.td, color: '#0284c7' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {item.location}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: 'bold', color: '#b45309' }}>{item.chair}</td>
                    <td style={{ ...styles.td, color: '#475569', fontSize: '13px' }}>{item.participants}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có nội dung lịch tuần.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER NOTE */}
        {selectedSchedule?.note && (
          <div style={styles.noteBox}>
            <strong>📌 Ghi chú thêm từ BGH:</strong> {selectedSchedule.note}
          </div>
        )}
      </div>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
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
  selectWeek: {
    padding: '9px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    fontWeight: 'bold',
    color: '#1e293b',
    backgroundColor: '#f8fafc'
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 18px',
    backgroundColor: '#be123c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '13.5px',
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(190, 18, 60, 0.25)'
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
    backgroundColor: '#fff1f2',
    border: '1.5px solid #fecdd3',
    borderRadius: '12px',
    padding: '14px 18px'
  },
  dutyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13.5px'
  },
  dutyLabel: {
    fontWeight: 'bold',
    color: '#be123c'
  },
  dutyValue: {
    color: '#1e293b',
    fontWeight: '600'
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
    fontWeight: 'bold',
    letterSpacing: '0.5px'
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
