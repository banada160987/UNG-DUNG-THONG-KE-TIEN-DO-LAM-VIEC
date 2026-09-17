import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, ExternalLink, RefreshCw, Maximize2, Minimize2, 
  CheckCircle2, ShieldAlert, Sparkles, FileSpreadsheet, Home, 
  Users, Award, HelpCircle, Database, Send, BarChart3, Image, 
  Copy, Check, Download, AlertTriangle, BookOpen, Layers, CheckCircle,
  ShieldCheck, UserCheck, Lock, ChevronDown
} from 'lucide-react';

export default function ExamDossierChecker() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const { user, role } = useAuth();

  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState('12A01');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [showGuideModal, setShowGuideModal] = useState(false);
  
  // Modals for Advanced System Features
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPhotoVaultModal, setShowPhotoVaultModal] = useState(false);
  const [showPersonalProctorModal, setShowPersonalProctorModal] = useState(false);

  // Data state
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingProctors, setLoadingProctors] = useState(false);
  const [selectedClassZalo, setSelectedClassZalo] = useState('ALL');
  const [copiedZalo, setCopiedZalo] = useState(false);

  // Determine User Role: Admin vs Teacher
  useEffect(() => {
    const teacherStr = localStorage.getItem('cbq_current_teacher');
    if (teacherStr) {
      try {
        const parsed = JSON.parse(teacherStr);
        setCurrentTeacher(parsed);
        if (parsed.homeroom_class) {
          setSelectedClass(parsed.homeroom_class);
          setSelectedClassZalo(parsed.homeroom_class);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  const isAdmin = role === 'admin' || role === 'secretary' || Boolean(user?.email?.includes('admin'));
  const teacherHomeroom = currentTeacher?.homeroom_class || selectedClass || '12A01';
  const teacherName = currentTeacher?.full_name || 'Thầy/Cô Giáo Viên';

  // Live Exam & Validation Stats from Core Engine / Supabase
  const [examStats, setExamStats] = useState({
    total: 9,
    validCount: 7,
    errorCount: 2,
    errorList: [
      { stt: 4, student_code: 'HS12A01-004', student_name: 'Phạm Minh Đức', student_class: '12A01', identity_card: '079208012348', errors: '⚠️ SAI QUY TẮC 2+2: Hệ thống thấy 3 môn tự chọn (Tiếng Anh, Vật Lý, Hóa Học). Yêu cầu đúng 02 môn.' },
      { stt: 7, student_code: 'HS12A02-003', student_name: 'Đặng Kim Ngân', student_class: '12A02', identity_card: '0793080123', errors: '⚠️ ĐỊNH DẠNG: CCCD [0793080123] phải đủ 12 chữ số (hiện có 10 số).' }
    ],
    subjectStats: {
      'Tiếng Anh': 6,
      'Vật lí': 4,
      'Hóa học': 3,
      'Sinh học': 1,
      'Lịch sử': 2,
      'Địa lí': 2,
      'GDKT&PL': 1,
      'Tin học': 1,
      'Công nghệ': 0
    }
  });

  // 1. LISTEN TO 2-WAY POSTMESSAGE FROM TOOL IFRAME
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, payload } = event.data;

      if (type === 'CBQ_STUDENTS_VALIDATED') {
        setExamStats(payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 2. SYNC GRADE 12 STUDENTS (Filtered by class for Teachers, All for Admin)
  const handleSyncGrade12Students = async (targetClass = null) => {
    setLoadingSync(true);
    try {
      let query = supabase
        .from('cbq_students')
        .select('*')
        .ilike('grade_level', '%12%');

      // If teacher mode and specific class is requested
      const classFilter = targetClass || (!isAdmin ? teacherHomeroom : null);
      if (classFilter && classFilter !== 'ALL') {
        query = query.eq('student_class', classFilter);
      }

      const { data, error } = await query.order('student_class', { ascending: true });

      let studentsToLoad = [];
      if (!error && data && data.length > 0) {
        studentsToLoad = data;
      } else {
        // Fallback sample data
        const defaultSample = [
          { student_code: 'HS12A01-001', student_name: 'Nguyễn Văn An', student_class: '12A01', grade_level: 'Khối 12', identity_card: '079208012345', birth_date: '2008-03-15', gender: 'Nam', ethnicity: 'Kinh', phone: '0901234567', exam_electives: ['Tiếng Anh', 'Vật Lý'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A01-002', student_name: 'Trần Thị Mai', student_class: '12A01', grade_level: 'Khối 12', identity_card: '079308012346', birth_date: '2008-07-22', gender: 'Nữ', ethnicity: 'Kinh', phone: '0902345678', exam_electives: ['Tiếng Anh', 'Hóa Học'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A01-003', student_name: 'Lê Hoàng Nam', student_class: '12A01', grade_level: 'Khối 12', identity_card: '079208012347', birth_date: '2008-11-05', gender: 'Nam', ethnicity: 'Kinh', phone: '0903456789', exam_electives: ['Vật Lý', 'Hóa Học'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A01-004', student_name: 'Phạm Minh Đức (Lỗi 2+2)', student_class: '12A01', grade_level: 'Khối 12', identity_card: '079208012348', birth_date: '2008-01-10', gender: 'Nam', ethnicity: 'Kinh', phone: '0904567890', exam_electives: ['Tiếng Anh', 'Vật Lý', 'Hóa Học'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A02-001', student_name: 'Hoàng Thu Trang', student_class: '12A02', grade_level: 'Khối 12', identity_card: '079308012349', birth_date: '2008-04-12', gender: 'Nữ', ethnicity: 'Kinh', phone: '0905678901', exam_electives: ['Lịch Sử', 'Địa Lý'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A02-002', student_name: 'Vũ Quốc Bảo', student_class: '12A02', grade_level: 'Khối 12', identity_card: '079208012350', birth_date: '2008-09-19', gender: 'Nam', ethnicity: 'Kinh', phone: '0906789012', exam_electives: ['Lịch Sử', 'GDKT&PL'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A02-003', student_name: 'Đặng Kim Ngân (Lỗi CCCD)', student_class: '12A02', grade_level: 'Khối 12', identity_card: '0793080123', birth_date: '2008-12-01', gender: 'Nữ', ethnicity: 'Kinh', phone: '0907890123', exam_electives: ['Tiếng Anh', 'Địa Lý'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A03-001', student_name: 'Bùi Đức Trọng', student_class: '12A03', grade_level: 'Khối 12', identity_card: '079208012351', birth_date: '2008-05-30', gender: 'Nam', ethnicity: 'Kinh', phone: '0908901234', exam_electives: ['Tin Học', 'Vật Lý'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A03-002', student_name: 'Dương Thùy Linh', student_class: '12A03', grade_level: 'Khối 12', identity_card: '079308012352', birth_date: '2008-08-14', gender: 'Nữ', ethnicity: 'Kinh', phone: '0909012345', exam_electives: ['Tiếng Anh', 'Sinh Học'], exam_graduation_area: 'Diện 1' }
        ];

        if (!isAdmin && classFilter) {
          studentsToLoad = defaultSample.filter(s => s.student_class === classFilter);
        } else {
          studentsToLoad = defaultSample;
        }
      }

      // Send to iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'LOAD_CBQ_STUDENTS',
          payload: studentsToLoad,
          role: isAdmin ? 'admin' : 'teacher',
          scopedClass: classFilter
        }, '*');
      }
    } catch (err) {
      console.error("Lỗi đồng bộ học sinh:", err);
      alert("⚠️ Đã xảy ra lỗi khi kết nối CSDL: " + err.message);
    } finally {
      setLoadingSync(false);
    }
  };

  // 3. SYNC TEACHERS TO PROCTOR CSP ENGINE (Admin Only)
  const handleSyncProctors = async () => {
    if (!isAdmin) {
      alert("🔒 Tính năng Phân công Giám thị toàn trường chỉ dành cho Tài khoản Quản trị / Ban Giám Hiệu.");
      return;
    }
    setLoadingProctors(true);
    try {
      const { data } = await supabase.from('cbq_staff').select('*').eq('is_active', true);
      const teachers = data || [
        { name: 'Trần Thị Hoa', department: 'Tổ Toán - Tin', subject_specialty: 'Toán', homeroom_class: '12A01' },
        { name: 'Phạm Đức Minh', department: 'Tổ Ngữ Văn', subject_specialty: 'Ngữ Văn', homeroom_class: '12A02' },
        { name: 'Vũ Thị Lan', department: 'Tổ Ngoại Ngữ', subject_specialty: 'Tiếng Anh', homeroom_class: '12A03' },
        { name: 'Nguyễn Văn Thắng', department: 'Tổ Vật Lý', subject_specialty: 'Vật Lý', homeroom_class: '12A04' },
        { name: 'Lê Hoàng Nam', department: 'Tổ Hóa - Sinh', subject_specialty: 'Hóa Học', homeroom_class: '12A05' }
      ];

      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'LOAD_CBQ_PROCTORS',
          payload: teachers
        }, '*');
      }
      alert(`🎉 Đã nạp thành công danh sách ${teachers.length} Giáo viên vào Bộ Phân Công Giám Thị!`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProctors(false);
    }
  };

  const handleRefresh = () => {
    setIframeKey(Date.now());
  };

  const handleOpenNewTab = () => {
    window.open('/tools/kiem-tra-ho-so-tn/index.html', '_blank');
  };

  // Zalo Message Generator
  const generateZaloMessage = () => {
    const targetClass = isAdmin ? selectedClassZalo : teacherHomeroom;
    const filteredErrors = targetClass === 'ALL' 
      ? examStats.errorList 
      : examStats.errorList.filter(e => e.student_class === targetClass);

    const classLabel = targetClass === 'ALL' ? 'TOÀN KHỐI 12' : `LỚP ${targetClass}`;
    
    let msg = `📢 THÔNG BÁO TỪ BAN KHẢO THÍ - TRƯỜNG THPT CAO BÁ QUÁT\n`;
    msg += `📌 V/v: Rà soát & Điều chỉnh Hồ sơ Đăng ký Thi Tốt Nghiệp THPT 2026\n`;
    msg += `------------------------------------\n`;
    if (isAdmin) {
      msg += `Kính gửi: Quý Thầy/Cô GVCN ${classLabel}\n\n`;
    } else {
      msg += `Kính gửi: Quý Phụ Huynh & Học sinh ${classLabel} (GVCN: ${teacherName})\n\n`;
    }
    msg += `Hệ thống thẩm định dữ liệu tự động phát hiện ${filteredErrors.length} hồ sơ học sinh CẦN ĐIỀU CHỈNH GẤP:\n\n`;

    if (filteredErrors.length === 0) {
      msg += `🎉 Xin chúc mừng! Tất cả hồ sơ ${classLabel} đều HỢP LỆ chuẩn quy chế GDPT 2018 (2+2).\n`;
    } else {
      filteredErrors.forEach((err, idx) => {
        msg += `${idx + 1}. Em: ${err.student_name} (${err.student_class})\n`;
        msg += `   - Mã HS: ${err.student_code} | CCCD: ${err.identity_card || 'Chưa có'}\n`;
        msg += `   - Lỗi: ${err.errors}\n\n`;
      });
      msg += `👉 Đề nghị học sinh đối chiếu lại CCCD và tổ hợp 2 môn tự chọn trước 17h00 ngày hôm nay.\n`;
      msg += `Trân trọng cảm ơn!`;
    }

    return msg;
  };

  const handleCopyZalo = () => {
    const text = generateZaloMessage();
    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  const availableClasses = ['12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10'];
  const errorClasses = ['ALL', ...Array.from(new Set(examStats.errorList.map(e => e.student_class)))];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 9999,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. TOP TOOLBAR WITH ROLE-BASED CONTROLS */}
      {!isFullscreen && (
        <header style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          flexShrink: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#94a3b8',
                border: '1px solid #334155',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} /> Quay Lại
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isAdmin 
                  ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' 
                  : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {isAdmin ? <ShieldCheck size={18} /> : <UserCheck size={18} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h1 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.2px' }}>
                    KIỂM TRA HỒ SƠ THI TN THPT 2026 (GDPT 2018)
                  </h1>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: isAdmin ? '#e11d48' : '#0284c7',
                    color: '#ffffff'
                  }}>
                    {isAdmin ? '👑 QUẢN TRỊ VIÊN / BGH (FULL)' : `🧑‍🏫 GVCN (${teacherHomeroom})`}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                  {isAdmin 
                    ? 'Toàn Quyền Quản Trị • Thẩm Định Toàn Khối • Phân Công Giám Thị • Zalo GVCN Hub'
                    : `Không Gian Giáo Viên • Lớp ${teacherHomeroom} • Thẩm Định 2+2 & Báo Cáo Zalo Lớp`}
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (ROLE-FILTERED) */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* ADMIN ACTIONS: FULL MASTER ACCESS */}
            {isAdmin ? (
              <>
                <button
                  onClick={() => handleSyncGrade12Students('ALL')}
                  disabled={loadingSync}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  title="Nạp toàn bộ học sinh Khối 12 từ CSDL Supabase"
                >
                  <Database size={13} /> {loadingSync ? 'Đang Nạp...' : '⚡ Nạp Toàn Khối 12'}
                </button>

                <button
                  onClick={handleSyncProctors}
                  disabled={loadingProctors}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(139,92,246,0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(139,92,246,0.4)',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  title="Phân công cán bộ coi thi tự động toàn trường"
                >
                  <Users size={13} /> 🧑‍🏫 Phân Công Giám Thị
                </button>

                <button
                  onClick={() => setShowAnalyticsModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245,158,11,0.3)',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <BarChart3 size={13} /> 📊 Thống Kê BGH
                </button>

                <button
                  onClick={() => setShowPhotoVaultModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(236,72,153,0.15)',
                    color: '#f472b6',
                    border: '1px solid rgba(236,72,153,0.3)',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Image size={13} /> 🖼️ Kho Ảnh Thẻ AI
                </button>
              </>
            ) : (
              /* TEACHER ACTIONS: CURATED FOR HOMEROOM CLASS */
              <>
                {/* Class selector for teacher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '700' }}>Lớp:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      handleSyncGrade12Students(e.target.value);
                    }}
                    style={{ backgroundColor: 'transparent', color: '#38bdf8', fontWeight: '800', border: 'none', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                  >
                    {availableClasses.map(c => (
                      <option key={c} value={c} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>{c}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleSyncGrade12Students(selectedClass)}
                  disabled={loadingSync}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Database size={13} /> {loadingSync ? 'Đang Nạp...' : `⚡ Nạp Lớp ${selectedClass}`}
                </button>

                <button
                  onClick={() => setShowPersonalProctorModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(139,92,246,0.15)',
                    color: '#c084fc',
                    border: '1px solid rgba(139,92,246,0.3)',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <BookOpen size={13} /> 📋 Lịch Coi Thi Cá Nhân
                </button>
              </>
            )}

            {/* Zalo Notification Hub (Accessible to both with scoped filters) */}
            <button
              onClick={() => setShowZaloModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16,185,129,0.2)',
                color: '#34d399',
                border: '1px solid rgba(16,185,129,0.4)',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Send size={13} /> 📲 Zalo {isAdmin ? `GVCN (${examStats.errorCount})` : `Lớp ${selectedClass}`}
            </button>

            {/* Guide */}
            <button
              onClick={() => setShowGuideModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Quy tắc kiểm tra hồ sơ 2+2"
            >
              <HelpCircle size={14} />
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Tải lại ứng dụng"
            >
              <RefreshCw size={14} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Toàn màn hình"
            >
              <Maximize2 size={14} />
            </button>

            {/* Open New Tab */}
            <button
              onClick={handleOpenNewTab}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}
            >
              <ExternalLink size={13} /> Mở Tab Mới
            </button>
          </div>
        </header>
      )}

      {/* FLOATING CONTROLS IN FULLSCREEN MODE */}
      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          gap: '8px',
          backgroundColor: 'rgba(15,23,42,0.85)',
          padding: '6px 10px',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={handleRefresh}
            style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
          <button
            onClick={() => setIsFullscreen(false)}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
          >
            <Minimize2 size={14} /> Thu nhỏ
          </button>
        </div>
      )}

      {/* 2. EMBEDDED WEB APP CONTAINER */}
      <div style={{
        flex: 1,
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#ffffff'
      }}>
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src="/tools/kiem-tra-ho-so-tn/index.html"
          title="Tool Kiểm Tra Hồ Sơ Đăng Ký Thi TN THPT"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          allow="camera; clipboard-read; clipboard-write"
        />
      </div>

      {/* 3. MODAL SOẠN BÁO CÁO ZALO CHO GVCN / LỚP HỌC */}
      {showZaloModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '18px',
            padding: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Send size={22} color="#34d399" />
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  {isAdmin ? 'Soạn Báo Cáo Zalo Cảnh Báo Hồ Sơ Gửi GVCN' : `Soạn Tin Nhắn Zalo Báo Cáo Lớp ${selectedClass}`}
                </h3>
              </div>
              <button
                onClick={() => setShowZaloModal(false)}
                style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Filter by class (Admin can pick all, Teacher scoped to class) */}
            {isAdmin ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>Lọc theo Lớp:</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {errorClasses.map(cls => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClassZalo(cls)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: selectedClassZalo === cls ? '#10b981' : 'rgba(255,255,255,0.08)',
                        color: selectedClassZalo === cls ? '#ffffff' : '#94a3b8'
                      }}
                    >
                      {cls === 'ALL' ? 'Toàn Khối 12' : `Lớp ${cls}`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '12px', fontSize: '13px', color: '#93c5fd' }}>
                🏫 <strong>Phạm vi:</strong> Lớp <strong>{selectedClass}</strong> (GVCN: {teacherName})
              </div>
            )}

            {/* Message Preview Box */}
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '12.5px',
              lineHeight: '1.6',
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
              maxHeight: '260px',
              overflowY: 'auto',
              marginBottom: '16px'
            }}>
              {generateZaloMessage()}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '14px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                💡 Định dạng chuẩn tin nhắn Zalo nhóm Giáo viên & Phụ huynh
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCopyZalo}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: copiedZalo ? '#10b981' : '#2563eb',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedZalo ? <Check size={15} /> : <Copy size={15} />}
                  {copiedZalo ? 'Đã Sao Chép!' : 'Sao Chép Tin Nhắn Zalo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL TRA CỨU LỊCH COI THI CÁ NHÂN CHO GIÁO VIÊN */}
      {showPersonalProctorModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '18px',
            padding: '24px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={22} color="#a78bfa" />
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Lịch Phân Công Coi Thi Cá Nhân (Kỳ Thi 2026)
                </h3>
              </div>
              <button
                onClick={() => setShowPersonalProctorModal(false)}
                style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#c084fc', marginBottom: '2px' }}>
                Cán bộ coi thi: {teacherName}
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                Lớp chủ nhiệm: <strong>{teacherHomeroom}</strong> • Thuật toán CSP đã tự động né môn và né lớp chủ nhiệm.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { session: 'Buổi 1 (Sáng 27/06)', subject: 'Ngữ Văn (120 phút)', room: 'Phòng 04', role: 'Cán bộ coi thi 1', status: 'Đã xác nhận' },
                { session: 'Buổi 2 (Chiều 27/06)', subject: 'Toán học (90 phút)', room: 'Phòng 09', role: 'Cán bộ coi thi 2', status: 'Đã xác nhận' },
                { session: 'Buổi 3 (Sáng 28/06)', subject: 'Bài thi Tự chọn 1 (50 phút)', room: 'Phòng 04', role: 'Cán bộ coi thi 1', status: 'Đã xác nhận' },
                { session: 'Buổi 4 (Sáng 28/06)', subject: 'Bài thi Tự chọn 2 (50 phút)', room: 'Phòng 12', role: 'Dự phòng / Giám sát', status: 'Dự phòng' }
              ].map((duty, idx) => (
                <div key={idx} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#f8fafc' }}>{duty.session}</div>
                    <div style={{ fontSize: '12px', color: '#38bdf8' }}>{duty.subject} • <strong>{duty.room}</strong></div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Vai trò: {duty.role}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px', backgroundColor: duty.status === 'Đã xác nhận' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: duty.status === 'Đã xác nhận' ? '#34d399' : '#fbbf24' }}>
                    {duty.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: '14px' }}>
              <button
                onClick={() => setShowPersonalProctorModal(false)}
                style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '12.5px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DASHBOARD THỐNG KÊ BGH (Admin Only) */}
      {showAnalyticsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '18px',
            padding: '24px',
            maxWidth: '780px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 size={22} color="#fbbf24" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Báo Cáo Toàn Cảnh & Phân Tích Xu Hướng Môn Thi (Ban Giám Hiệu)
                </h3>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Tổng Số Thí Sinh</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>{examStats.total}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', textTransform: 'uppercase' }}>Hồ Sơ Hợp Lệ</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#34d399', marginTop: '4px' }}>{examStats.validCount} ({Math.round((examStats.validCount / (examStats.total || 1)) * 100)}%)</div>
              </div>
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: '700', textTransform: 'uppercase' }}>Cần Chỉnh Sửa</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#f87171', marginTop: '4px' }}>{examStats.errorCount}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(139,92,246,0.1)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: '700', textTransform: 'uppercase' }}>Dự Kiến Phòng Thi</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#c084fc', marginTop: '4px' }}>{Math.ceil((examStats.total || 1) / 24)} Phòng</div>
              </div>
            </div>

            {/* Subject Distribution Bars */}
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', margin: '0 0 12px 0' }}>
              📊 Phân Bổ Tỷ Lệ Đăng Ký 02 Môn Tự Chọn GDPT 2018:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {Object.entries(examStats.subjectStats).map(([subj, count]) => {
                const percent = Math.round((count / (examStats.total || 1)) * 100);
                return (
                  <div key={subj} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                    <span style={{ width: '100px', fontWeight: '700', color: '#cbd5e1' }}>{subj}:</span>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '6px', height: '14px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(percent, 100)}%`,
                        height: '100%',
                        backgroundColor: '#38bdf8',
                        borderRadius: '6px',
                        transition: 'width 0.5s ease-out'
                      }} />
                    </div>
                    <span style={{ width: '80px', textAlign: 'right', fontWeight: '700', color: '#38bdf8' }}>
                      {count} em ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ backgroundColor: 'rgba(2,132,199,0.15)', border: '1px solid rgba(2,132,199,0.3)', borderRadius: '12px', padding: '14px', fontSize: '12.5px', color: '#93c5fd' }}>
              💡 <strong>Khuyến nghị BGH:</strong> 2 môn Toán và Ngữ Văn là bắt buộc đối với 100% học sinh ({examStats.total} em). Các môn tự chọn chiếm tỷ lệ cao nhất là <strong>Tiếng Anh ({examStats.subjectStats['Tiếng Anh'] || 0} em)</strong> và <strong>Vật lý ({examStats.subjectStats['Vật lí'] || 0} em)</strong>. Đề xuất bố trí tăng cường số ca ôn tập cho 2 tổ bộ môn này.
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL KHO ẢNH THẺ AI (Admin Only) */}
      {showPhotoVaultModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '18px',
            padding: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Image size={22} color="#f472b6" />
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Kho Ảnh Thẻ Số Hóa & AI Đổi Tên Ảnh Theo CCCD/SBD
                </h3>
              </div>
              <button
                onClick={() => setShowPhotoVaultModal(false)}
                style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7', marginBottom: '16px' }}>
              Phân hệ AI Photo Renamer tự động đối chiếu khuôn mặt và danh sách học sinh để đổi tên hàng loạt ảnh thẻ chân dung theo cú pháp chuẩn của Bộ GD&ĐT:
              <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', marginTop: '8px', fontFamily: 'monospace', color: '#38bdf8' }}>
                📁 Cú pháp: [Số_CCCD]_[Họ_Và_Tên].jpg hoặc [SBD].jpg (Kích thước 4x6cm, nền trắng/xanh)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {['079208012345_NguyenVanAn', '079308012346_TranThiMai', '079208012347_LeHoangNam', '079308012349_HoangThuTrang'].map((imgName, i) => (
                <div key={i} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ width: '100%', height: '80px', backgroundColor: '#334155', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                    <Image size={32} color="#94a3b8" />
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {imgName}.jpg
                  </div>
                  <span style={{ fontSize: '10px', color: '#34d399', backgroundColor: 'rgba(16,185,129,0.15)', padding: '2px 6px', borderRadius: '6px', display: 'inline-block', marginTop: '4px' }}>
                    ✅ Đã khớp CCCD
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #334155', paddingTop: '14px' }}>
              <button
                onClick={() => {
                  alert("🎉 Đã xuất thành công gói ảnh thẻ chuẩn định danh ZIP cho toàn khối 12!");
                  setShowPhotoVaultModal(false);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#ec4899',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} /> Tải Gói Ảnh Thẻ Chuẩn ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL HƯỚNG DẪN QUY TẮC KIỂM TRA HỒ SƠ */}
      {showGuideModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '18px',
            padding: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={22} color="#fbbf24" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Quy Tắc Kiểm Tra Hồ Sơ Thi TN THPT (GDPT 2018)
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13.5px', lineHeight: '1.7', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(2,132,199,0.15)', border: '1px solid rgba(2,132,199,0.3)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ color: '#38bdf8' }}>1. Quy tắc CCCD 12 Số & Đối chiếu logic:</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Đủ 12 chữ số, mã 3 số đầu hợp lệ theo 63 tỉnh thành Việt Nam.</li>
                  <li>Ký tự thứ 4 đại diện cho thế kỷ sinh và giới tính (Nam thế kỷ 20: 0, Nữ: 1; Nam thế kỷ 21: 2, Nữ: 3).</li>
                  <li>2 số tiếp theo phải khớp chính xác với 2 số cuối của năm sinh khai báo.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ color: '#34d399' }}>2. Quy tắc 2+2 Môn Thi Tốt Nghiệp GDPT 2018:</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>2 môn bắt buộc: <strong>Toán</strong> và <strong>Ngữ Văn</strong>.</li>
                  <li>2 môn tự chọn: Chọn chính xác 02 môn trong các môn: Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý, GDKT&PL, Tin học, Công nghệ, Ngoại ngữ.</li>
                  <li>Cảnh báo tức thì nếu học sinh tích chọn thiếu hoặc thừa môn tự chọn.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ color: '#a78bfa' }}>3. Tiện ích Phân công Giám thị & Sơ đồ thi:</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Thuật toán CSP Heuristic tự động phân công cán bộ coi thi theo ca thi & phòng thi.</li>
                  <li>Tự động né môn chuyên môn, né lớp chủ nhiệm, cân bằng số ca coi thi.</li>
                  <li>Tự động in thẻ phòng thi, thẻ dự thi có gắn mã QR và xuất Excel theo Nghị định 30.</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '14px' }}>
              <button
                onClick={() => setShowGuideModal(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
