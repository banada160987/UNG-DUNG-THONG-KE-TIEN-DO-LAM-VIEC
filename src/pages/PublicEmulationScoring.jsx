import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Award, ShieldAlert, CheckCircle2, AlertTriangle, Calendar, Plus, 
  Clock, Filter, Send, Trash2, Home, Sparkles, User, BookOpen, Layers, Check, Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_CLASSES = [
  '10A01', '10A02', '10A03', '10A04', '10A05', '10A06', '10A07', '10A08', '10A09', '10A10', '10A11', '10A12',
  '11A01', '11A02', '11A03', '11A04', '11A05', '11A06', '11A07', '11A08', '11A09', '11A10', '11A11', '11A12',
  '12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10', '12A11', '12A12'
];

const DEFAULT_CRITERIA = [
  // Nếp sống & Đồng phục
  { id: '1', category: 'Nếp sống & Đồng phục', title: 'Không đeo thẻ học sinh / Không mặc đồng phục', score_change: -5 },
  { id: '2', category: 'Nếp sống & Đồng phục', title: 'Đi học muộn / Nắm tóc, trang phục sai quy định', score_change: -5 },
  { id: '3', category: 'Nếp sống & Đồng phục', title: 'Sử dụng điện thoại trong giờ học không được phép', score_change: -5 },
  
  // Vệ sinh & Cảnh quan
  { id: '4', category: 'Vệ sinh & Cảnh quan', title: 'Vệ sinh lớp / sân trường muộn hoặc bẩn', score_change: -5 },
  { id: '5', category: 'Vệ sinh & Cảnh quan', title: 'Quên tắt điện, quạt, máy chiếu khi ra khỏi lớp', score_change: -5 },
  { id: '6', category: 'Vệ sinh & Cảnh quan', title: 'Làm hư hỏng bàn ghế, cơ sở vật chất phòng học', score_change: -10 },
  
  // Học tập & Truy bài
  { id: '7', category: 'Học tập & Truy bài', title: 'Truy bài đầu giờ mất trật tự', score_change: -5 },
  { id: '8', category: 'Học tập & Truy bài', title: 'Học sinh không chuẩn bị bài / vi phạm giờ học', score_change: -5 },
  
  // Sĩ số & Kỷ luật
  { id: '9', category: 'Sĩ số & Kỷ luật', title: 'Học sinh bỏ tiết / trốn học / ra ngoài không phép', score_change: -10 },
  { id: '10', category: 'Sĩ số & Kỷ luật', title: 'Học sinh vắng học không có đơn xin phép', score_change: -5 },
  
  // Hoạt động Câu Lạc Bộ
  { id: '11', category: 'Hoạt động Câu Lạc Bộ', title: 'Học sinh tham gia sinh hoạt CLB tích cực & xuất sắc', score_change: 2 },
  { id: '12', category: 'Hoạt động Câu Lạc Bộ', title: 'Học sinh vắng sinh hoạt CLB không phép', score_change: -2 },
  
  // Khen thưởng & Xung kích
  { id: '13', category: 'Khen thưởng & Xung kích', title: 'Tuyên dương tập thể Chi đoàn xuất sắc tuần', score_change: 10 },
  { id: '14', category: 'Khen thưởng & Xung kích', title: 'Đạt nhiều hoa điểm tốt (Điểm 9 - 10) trong tuần', score_change: 5 },
  { id: '15', category: 'Khen thưởng & Xung kích', title: 'Tham gia xung kích tình nguyện / Đội Cờ đỏ tốt', score_change: 5 }
];

const CATEGORIES = [
  'Tất Cả',
  'Nếp sống & Đồng phục',
  'Học tập & Truy bài',
  'Vệ sinh & Cảnh quan',
  'Sĩ số & Kỷ luật',
  'Hoạt động Câu Lạc Bộ',
  'Khen thưởng & Xung kích'
];

export default function PublicEmulationScoring() {
  const [classList, setClassList] = useState(DEFAULT_CLASSES);
  const [criteriaList, setCriteriaList] = useState(DEFAULT_CRITERIA);
  const [todayLogs, setTodayLogs] = useState([]);
  
  // Filter category state
  const [selectedCategory, setSelectedCategory] = useState('Tất Cả');
  const [selectedGrade, setSelectedGrade] = useState('ALL');

  // Form State
  const [weekNumber, setWeekNumber] = useState(1);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('10A01');
  const [selectedCriteria, setSelectedCriteria] = useState(DEFAULT_CRITERIA[0]);
  const [scoreChange, setScoreChange] = useState(-5);
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [reporterName, setReporterName] = useState('Đội Cờ Đỏ Trực Tuần');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [logDate]);

  async function fetchInitialData() {
    try {
      // 1. Fetch criteria list from DB
      const criteriaRes = await supabase.from('cbq_emulation_criteria').select('*').eq('is_active', true);
      if (!criteriaRes.error && criteriaRes.data && criteriaRes.data.length > 0) {
        setCriteriaList(criteriaRes.data);
        setSelectedCriteria(criteriaRes.data[0]);
        setScoreChange(criteriaRes.data[0].score_change);
      }

      // 2. Fetch today's logs
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
    const clean = String(clsName).trim().toUpperCase();
    if (/^12|12[A-Z]/i.test(clean)) return 'Khối 12';
    if (/^11|11[A-Z]/i.test(clean)) return 'Khối 11';
    return 'Khối 10';
  };

  const filteredCriteria = useMemo(() => {
    if (selectedCategory === 'Tất Cả') return criteriaList;
    return criteriaList.filter(c => c.category === selectedCategory);
  }, [criteriaList, selectedCategory]);

  const filteredClasses = useMemo(() => {
    if (selectedGrade === 'ALL') return classList;
    return classList.filter(c => getGradeLevel(c) === selectedGrade);
  }, [classList, selectedGrade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    const payload = {
      week_number: Number(weekNumber) || 1,
      log_date: logDate,
      student_class: selectedClass,
      grade_level: getGradeLevel(selectedClass),
      criteria_title: selectedCriteria?.title || 'Ghi nhận nề nếp',
      category: selectedCriteria?.category || 'Chung',
      score_change: Number(scoreChange) || -5,
      student_name: studentName.trim() || null,
      student_code: studentCode.trim() || null,
      reason: reasonNote.trim() || null,
      reason_note: reasonNote.trim() || null,
      reporter_name: reporterName.trim() || 'Đội Cờ Đỏ Trực Tuần',
      status: 'approved'
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
      setStudentName('');
      setStudentCode('');
    } catch (err) {
      alert("Lỗi khi ghi nhận: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi nề nếp này?")) return;
    try {
      await supabase.from('cbq_emulation_logs').delete().eq('id', id);
      setTodayLogs(todayLogs.filter(l => l.id !== id));
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px 16px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* 1. HEADER BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(30,27,75,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: '#4338ca',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(67,56,202,0.4)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              <Award size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                CỔNG CHẤM ĐIỂM THI ĐUA & NỀ NẾP TRỰC TUẦN
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#c7d2fe' }}>
                Trường THPT Cao Bá Quát • Dành cho Đội Cờ Đỏ, Đoàn Trường, Giám Thị & BCN Câu Lạc Bộ
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '13px',
                border: '1px solid rgba(255,255,255,0.25)'
              }}
            >
              <Home size={16} /> Trang Chủ
            </Link>
          </div>
        </div>

        {/* 2. BỐ CỤC CHÍNH (2 CỘT: FORM CHẤM ĐIỂM & NHẬT KÝ HÔM NAY) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* CỘT TRÁI: FORM GHI NHẬN */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <ShieldAlert size={20} color="#e11d48" />
              <h2 style={{ fontSize: '16.5px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                Lập Biên Bản Ghi Nhận Nề Nếp / Tuyên Dương
              </h2>
            </div>

            {successMsg && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '12px 16px', borderRadius: '12px', border: '1px solid #a7f3d0', fontSize: '13.5px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#059669" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* TUẦN & NGÀY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Tuần thi đua:</label>
                  <select
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', marginTop: '4px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}
                  >
                    {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>Tuần {w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Ngày ghi nhận:</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', marginTop: '4px', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* CHỌN LỚP */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Lớp vi phạm / tuyên dương:</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['ALL', 'Khối 10', 'Khối 11', 'Khối 12'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGrade(g)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: selectedGrade === g ? '#0284c7' : '#f1f5f9',
                          color: selectedGrade === g ? '#ffffff' : '#475569'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #0284c7', marginTop: '4px', fontSize: '14px', fontWeight: '800', color: '#0369a1', backgroundColor: '#f0f9ff' }}
                >
                  {filteredClasses.map(cls => (
                    <option key={cls} value={cls}>Lớp {cls} ({getGradeLevel(cls)})</option>
                  ))}
                </select>
              </div>

              {/* DANH MỤC TIÊU CHÍ */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Phân loại lỗi / Tiêu chí:</label>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '6px 0', flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: selectedCategory === cat ? '#0f172a' : '#f1f5f9',
                        color: selectedCategory === cat ? '#ffffff' : '#64748b'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {filteredCriteria.map(c => {
                    const isSelected = selectedCriteria?.id === c.id;
                    const isBonus = Number(c.score_change) > 0;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCriteria(c)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? (isBonus ? '#16a34a' : '#dc2626') : '#f1f5f9'}`,
                          backgroundColor: isSelected ? (isBonus ? '#f0fdf4' : '#fff1f2') : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ fontSize: '12.5px', fontWeight: isSelected ? '700' : '500', color: '#1e293b' }}>
                          {c.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: isBonus ? '#dcfce7' : '#fee2e2',
                          color: isBonus ? '#15803d' : '#b91c1c'
                        }}>
                          {isBonus ? `+${c.score_change}đ` : `${c.score_change}đ`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TÙY CHỈNH ĐIỂM SỐ */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Điểm số áp dụng (+ hoặc -):</label>
                <input
                  type="number"
                  value={scoreChange}
                  onChange={(e) => setScoreChange(Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', marginTop: '4px', fontSize: '14px', fontWeight: '800', color: scoreChange > 0 ? '#16a34a' : '#dc2626', boxSizing: 'border-box' }}
                />
              </div>

              {/* ĐÍCH DANH HỌC SINH (NẾU CÓ) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Họ tên học sinh (nếu có):</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A..."
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Mã học sinh (nếu có):</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: HS1201..."
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* GHI CHÚ CHI TIẾT */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Ghi chú chi tiết vi phạm / khen thưởng:</label>
                <textarea
                  rows={2}
                  placeholder="Ghi rõ tiết mấy, địa điểm, nội dung cụ thể..."
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* NGƯỜI CHẤM */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Người ghi nhận:</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  backgroundColor: scoreChange > 0 ? '#16a34a' : '#e11d48',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 14px ${scoreChange > 0 ? 'rgba(22,163,74,0.3)' : 'rgba(225,29,72,0.3)'}`,
                  marginTop: '4px'
                }}
              >
                <Check size={18} /> {loading ? 'Đang ghi nhận...' : 'Lưu Biên Bản Thi Đua'}
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: NHẬT KÝ HÔM NAY */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#0284c7" />
                <h2 style={{ fontSize: '16.5px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Nhật Ký Đã Chấm Hôm Nay ({todayLogs.length} mục)
                </h2>
              </div>

              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                📅 {logDate}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '600px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <CheckCircle2 size={40} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Hôm nay chưa có biên bản nào được ghi nhận.</p>
                </div>
              ) : (
                todayLogs.map((log) => {
                  const isBonus = Number(log.score_change) > 0;
                  return (
                    <div
                      key={log.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: `1.5px solid ${isBonus ? '#bbf7d0' : '#fecdd3'}`,
                        backgroundColor: isBonus ? '#f0fdf4' : '#fff1f2',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '800',
                            backgroundColor: '#0f172a',
                            color: '#ffffff'
                          }}>
                            {log.student_class}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: isBonus ? '#166534' : '#991b1b' }}>
                            {log.criteria_title}
                          </span>
                        </div>

                        {log.student_name && (
                          <div style={{ fontSize: '12.5px', color: '#334155' }}>
                            👤 HS: <strong>{log.student_name}</strong> {log.student_code ? `(${log.student_code})` : ''}
                          </div>
                        )}

                        {(log.reason_note || log.reason) && (
                          <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                            {log.reason_note || log.reason}
                          </div>
                        )}

                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          Người ghi: {log.reporter_name || 'Đội Cờ Đỏ'} • Tuần {log.week_number}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '900',
                          color: isBonus ? '#16a34a' : '#dc2626'
                        }}>
                          {isBonus ? `+${log.score_change}đ` : `${log.score_change}đ`}
                        </div>

                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px'
                          }}
                          title="Xóa biên bản này"
                        >
                          <Trash2 size={14} color="#dc2626" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
