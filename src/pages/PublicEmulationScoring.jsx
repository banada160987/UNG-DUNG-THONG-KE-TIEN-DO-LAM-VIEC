import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Award, ShieldAlert, CheckCircle2, AlertTriangle, Calendar, Plus, Clock, Filter, Send } from 'lucide-react';

const DEFAULT_CLASSES = [
  '10A1', '10A2', '10A3', '10A4', '10A5',
  '11A1', '11A2', '11A3', '11A4', '11A5',
  '12A1', '12A2', '12A3', '12A4', '12A5'
];

const DEFAULT_CRITERIA = [
  { id: '1', category: 'Nếp sống & Đồng phục', title: 'Không đeo thẻ / Không mặc đồng phục', score_change: -5 },
  { id: '2', category: 'Nếp sống & Đồng phục', title: 'Đi học muộn / Nắm tóc, trang phục sai quy định', score_change: -5 },
  { id: '3', category: 'Vệ sinh & Cảnh quan', title: 'Vệ sinh lớp / sân trường muộn hoặc bẩn', score_change: -5 },
  { id: '4', category: 'Vệ sinh & Cảnh quan', title: 'Quên tắt điện, quạt khi ra khỏi lớp', score_change: -5 },
  { id: '5', category: 'Học tập & Truy bài', title: 'Truy bài đầu giờ mất trật tự', score_change: -5 },
  { id: '6', category: 'Sĩ số & Kỷ luật', title: 'Học sinh bỏ tiết / trốn học', score_change: -10 },
  { id: '7', category: 'Sĩ số & Kỷ luật', title: 'Học sinh vắng không lý do', score_change: -5 },
  { id: '8', category: 'Khen thưởng & Xung kích', title: 'Tuyên dương tập thể / Chi đoàn xuất sắc', score_change: 10 },
  { id: '9', category: 'Khen thưởng & Xung kích', title: 'Đạt nhiều điểm 9 - 10 trong tuần', score_change: 5 }
];

export default function PublicEmulationScoring() {
  const [classList, setClassList] = useState(DEFAULT_CLASSES);
  const [criteriaList, setCriteriaList] = useState(DEFAULT_CRITERIA);
  const [todayLogs, setTodayLogs] = useState([]);
  
  // Form State
  const [weekNumber, setWeekNumber] = useState(1);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('10A1');
  const [selectedCriteria, setSelectedCriteria] = useState(DEFAULT_CRITERIA[0]);
  const [scoreChange, setScoreChange] = useState(-5);
  const [reasonNote, setReasonNote] = useState('');
  const [reporterName, setReporterName] = useState('Đội Cờ Đỏ Trực Tuần');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [logDate]);

  async function fetchInitialData() {
    try {
      // 1. Fetch criteria list
      const criteriaRes = await supabase.from('cbq_emulation_criteria').select('*').eq('is_active', true);
      if (!criteriaRes.error && criteriaRes.data && criteriaRes.data.length > 0) {
        setCriteriaList(criteriaRes.data);
        setSelectedCriteria(criteriaRes.data[0]);
        setScoreChange(criteriaRes.data[0].score_change);
      }

      // 2. Fetch distinct student classes
      const studentsRes = await supabase.from('cbq_students').select('student_class');
      if (!studentsRes.error && studentsRes.data && studentsRes.data.length > 0) {
        const unique = Array.from(new Set(studentsRes.data.map(s => s.student_class))).sort();
        if (unique.length > 0) {
          setClassList(unique);
          setSelectedClass(unique[0]);
        }
      }

      // 3. Fetch today's logs
      fetchTodayLogs();
    } catch (err) {
      console.warn("Dùng dữ liệu tiêu chí mặc định:", err);
    }
  }

  async function fetchTodayLogs() {
    try {
      const { data, error } = await supabase
        .from('cbq_emulation_logs')
        .select('*')
        .eq('log_date', logDate)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTodayLogs(data);
      }
    } catch (err) {
      console.warn("Nạp nhật ký hôm nay:", err);
    }
  }

  const handleSelectCriteria = (c) => {
    setSelectedCriteria(c);
    setScoreChange(c.score_change);
  };

  const getGradeLevel = (clsName) => {
    if (!clsName) return 'Khối 10';
    if (clsName.includes('11')) return 'Khối 11';
    if (clsName.includes('12')) return 'Khối 12';
    return 'Khối 10';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    const payload = {
      week_number: Number(weekNumber) || 1,
      log_date: logDate,
      student_class: selectedClass,
      grade_level: getGradeLevel(selectedClass),
      criteria_title: selectedCriteria?.title || 'Vi phạm nếp sống',
      category: selectedCriteria?.category || 'Chung',
      score_change: Number(scoreChange) || -5,
      reason: reasonNote.trim(),
      reporter_name: reporterName.trim() || 'Đội Cờ Đỏ'
    };

    try {
      const { data, error } = await supabase
        .from('cbq_emulation_logs')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        setTodayLogs([data, ...todayLogs]);
      } else {
        setTodayLogs([{ ...payload, id: Date.now().toString() }, ...todayLogs]);
      }

      setSuccessMsg(`🎉 Đã ghi nhận ${scoreChange > 0 ? 'điểm cộng' : 'điểm trừ'} (${scoreChange > 0 ? '+' : ''}${scoreChange}đ) cho lớp ${selectedClass}!`);
      setReasonNote('');
    } catch (err) {
      alert("Lỗi khi ghi nhận: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER BANNER */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconCircle}>
            <Award size={32} color="#ffffff" />
          </div>
          <div>
            <h2 style={styles.pageTitle}>SỔ CHẤM ĐIỂM THI ĐUA TRỰC TUẦN</h2>
            <p style={styles.pageSubtitle}>Trường THPT Cao Bá Quát • Cổng ghi nhận vi phạm & khen thưởng dành cho Đội Cờ đỏ / GV Trực tuần</p>
          </div>
        </div>
      </div>

      <div style={styles.layoutGrid}>
        {/* LEFT COLUMN: SCORING FORM */}
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.formTitle}>📝 Nhập Điểm Trừ / Điểm Thưởng</h3>

          {successMsg && (
            <div style={styles.successBanner}>
              <CheckCircle2 size={18} color="#166534" />
              <span>{successMsg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
            <div>
              <label style={styles.label}>Tuần học thứ (*)</label>
              <select value={weekNumber} onChange={e => setWeekNumber(e.target.value)} style={styles.input}>
                {Array.from({ length: 36 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Ngày chấm (*)</label>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...styles.label, color: '#be123c', fontSize: '14px' }}>Lớp học chấm (*):</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)} 
              style={{ ...styles.input, fontWeight: 'bold', fontSize: '15px', color: '#be123c', backgroundColor: '#fff1f2', borderColor: '#fca5a5' }}
            >
              {classList.map(cls => (
                <option key={cls} value={cls}>Lớp {cls} ({getGradeLevel(cls)})</option>
              ))}
            </select>
          </div>

          {/* QUICK CRITERIA SELECTION BUTTONS */}
          <div style={{ marginBottom: '18px' }}>
            <label style={styles.label}>Chọn Tiêu chí vi phạm / khen thưởng (*):</label>
            <div style={styles.criteriaGrid}>
              {criteriaList.map(c => (
                <div 
                  key={c.id}
                  onClick={() => handleSelectCriteria(c)}
                  style={{
                    ...styles.criteriaItem,
                    borderColor: selectedCriteria?.id === c.id ? '#be123c' : '#e2e8f0',
                    backgroundColor: selectedCriteria?.id === c.id ? '#fff1f2' : '#f8fafc'
                  }}
                >
                  <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: c.score_change < 0 ? '#dc2626' : '#166534' }}>
                    {c.score_change < 0 ? '🔴' : '🟢'} {c.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{c.category}</span>
                    <strong style={{ color: c.score_change < 0 ? '#dc2626' : '#166534' }}>
                      {c.score_change > 0 ? '+' : ''}{c.score_change}đ
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '15px' }}>
            <div>
              <label style={styles.label}>Số điểm (+ / -)</label>
              <input 
                type="number" 
                value={scoreChange} 
                onChange={e => setScoreChange(e.target.value)} 
                style={{ ...styles.input, fontWeight: 'bold', color: scoreChange < 0 ? '#dc2626' : '#166534', fontSize: '15px' }} 
              />
            </div>
            <div>
              <label style={styles.label}>Người chấm / Đội trực</label>
              <input 
                type="text" 
                value={reporterName} 
                onChange={e => setReporterName(e.target.value)} 
                style={styles.input} 
                placeholder="VD: Đội Cờ đỏ Khối 11"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Ghi chú lý do / Tên học sinh (nếu có)</label>
            <input 
              type="text" 
              value={reasonNote} 
              onChange={e => setReasonNote(e.target.value)} 
              style={styles.input} 
              placeholder="VD: Nguyễn Văn A (không đeo thẻ), vệ sinh dãy A muộn..."
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            <Send size={18} /> {loading ? 'Đang lưu...' : `🚀 GHI NHẬN CHO LỚP ${selectedClass}`}
          </button>
        </form>

        {/* RIGHT COLUMN: TODAY'S LOGGED ENTRIES */}
        <div style={styles.logsCard}>
          <h3 style={styles.formTitle}>
            📋 Vi phạm / Khen thưởng Ngày {logDate} ({todayLogs.length})
          </h3>

          {todayLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
              <ShieldAlert size={40} color="#cbd5e1" />
              <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>Chưa có lỗi vi phạm nào ghi nhận trong ngày hôm nay.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
              {todayLogs.map((log, idx) => (
                <div key={log.id || idx} style={styles.logItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#be123c' }}>Lớp {log.student_class}</span>
                    <span style={{
                      fontWeight: '800',
                      fontSize: '14px',
                      color: log.score_change < 0 ? '#dc2626' : '#166534',
                      backgroundColor: log.score_change < 0 ? '#fef2f2' : '#f0fdf4',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {log.score_change > 0 ? '+' : ''}{log.score_change} điểm
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' }}>
                    {log.criteria_title}
                  </div>
                  {log.reason && <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>Ghi chú: {log.reason}</div>}
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Chấm bởi: {log.reporter_name || 'Đội Cờ đỏ'}</span>
                    <span>Tuần {log.week_number}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px 10px', maxWidth: '1050px', margin: '0 auto', boxSizing: 'border-box' },
  headerCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '20px' },
  iconCircle: { width: '54px', height: '54px', borderRadius: '14px', backgroundColor: '#be123c', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(190, 18, 60, 0.3)' },
  pageTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#be123c' },
  pageSubtitle: { margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' },
  layoutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  formCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  logsCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  formTitle: { margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' },
  label: { display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' },
  criteriaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' },
  criteriaItem: { padding: '9px 12px', borderRadius: '8px', border: '1.5px solid', cursor: 'pointer', transition: '0.15s' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#be123c', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.3)' },
  successBanner: { padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
  logItem: { padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }
};
