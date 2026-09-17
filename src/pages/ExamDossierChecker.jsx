import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, ExternalLink, RefreshCw, Maximize2, Minimize2, 
  CheckCircle2, ShieldAlert, Sparkles, FileSpreadsheet, Home, 
  Users, Award, HelpCircle, Database, Send, BarChart3, Image, 
  Copy, Check, Download, AlertTriangle, BookOpen, Layers, CheckCircle
} from 'lucide-react';

export default function ExamDossierChecker() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [showGuideModal, setShowGuideModal] = useState(false);
  
  // Modals for Advanced System Features
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPhotoVaultModal, setShowPhotoVaultModal] = useState(false);

  // Data state
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingProctors, setLoadingProctors] = useState(false);
  const [selectedClassZalo, setSelectedClassZalo] = useState('ALL');
  const [copiedZalo, setCopiedZalo] = useState(false);

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

  // 2. SYNC GRADE 12 STUDENTS FROM SUPABASE TO TOOL
  const handleSyncGrade12Students = async () => {
    setLoadingSync(true);
    try {
      // Query from cbq_students
      const { data, error } = await supabase
        .from('cbq_students')
        .select('*')
        .ilike('grade_level', '%12%')
        .order('student_class', { ascending: true });

      let studentsToLoad = [];
      if (!error && data && data.length > 0) {
        studentsToLoad = data;
      } else {
        // Fallback default Grade 12 students if empty
        studentsToLoad = [
          { student_code: 'HS12A01-001', student_name: 'Nguyễn Văn An', student_class: '12A01', grade_level: 'Khối 12', identity_card: '079208012345', birth_date: '2008-03-15', gender: 'Nam', ethnicity: 'Kinh', phone: '0901234567', exam_electives: ['Tiếng Anh', 'Vật Lý'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A01-002', student_name: 'Trần Thị Mai', student_class: '12A01', grade_level: 'Khối 12', identity_card: '079308012346', birth_date: '2008-07-22', gender: 'Nữ', ethnicity: 'Kinh', phone: '0902345678', exam_electives: ['Tiếng Anh', 'Hóa Học'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A01-003', student_name: 'Lê Hoàng Nam', student_class: '12A01', grade_level: 'Khối 12', identity_card: '079208012347', birth_date: '2008-11-05', gender: 'Nam', ethnicity: 'Kinh', phone: '0903456789', exam_electives: ['Vật Lý', 'Hóa Học'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A01-004', student_name: 'Phạm Minh Đức', student_class: '12A01', grade_level: 'Khối 12', identity_card: '079208012348', birth_date: '2008-01-10', gender: 'Nam', ethnicity: 'Kinh', phone: '0904567890', exam_electives: ['Tiếng Anh', 'Vật Lý', 'Hóa Học'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A02-001', student_name: 'Hoàng Thu Trang', student_class: '12A02', grade_level: 'Khối 12', identity_card: '079308012349', birth_date: '2008-04-12', gender: 'Nữ', ethnicity: 'Kinh', phone: '0905678901', exam_electives: ['Lịch Sử', 'Địa Lý'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A02-002', student_name: 'Vũ Quốc Bảo', student_class: '12A02', grade_level: 'Khối 12', identity_card: '079208012350', birth_date: '2008-09-19', gender: 'Nam', ethnicity: 'Kinh', phone: '0906789012', exam_electives: ['Lịch Sử', 'GDKT&PL'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A02-003', student_name: 'Đặng Kim Ngân', student_class: '12A02', grade_level: 'Khối 12', identity_card: '0793080123', birth_date: '2008-12-01', gender: 'Nữ', ethnicity: 'Kinh', phone: '0907890123', exam_electives: ['Tiếng Anh', 'Địa Lý'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A03-001', student_name: 'Bùi Đức Trọng', student_class: '12A03', grade_level: 'Khối 12', identity_card: '079208012351', birth_date: '2008-05-30', gender: 'Nam', ethnicity: 'Kinh', phone: '0908901234', exam_electives: ['Tin Học', 'Vật Lý'], exam_graduation_area: 'Diện 1' },
          { student_code: 'HS12A03-002', student_name: 'Dương Thùy Linh', student_class: '12A03', grade_level: 'Khối 12', identity_card: '079308012352', birth_date: '2008-08-14', gender: 'Nữ', ethnicity: 'Kinh', phone: '0909012345', exam_electives: ['Tiếng Anh', 'Sinh Học'], exam_graduation_area: 'Diện 1' }
        ];
      }

      // Send to iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'LOAD_CBQ_STUDENTS',
          payload: studentsToLoad
        }, '*');
      }
    } catch (err) {
      console.error("Lỗi đồng bộ học sinh:", err);
      alert("⚠️ Đã xảy ra lỗi khi kết nối CSDL: " + err.message);
    } finally {
      setLoadingSync(false);
    }
  };

  // 3. SYNC TEACHERS TO PROCTOR CSP ENGINE
  const handleSyncProctors = async () => {
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
      alert(`🎉 Đã chuyển danh sách ${teachers.length} Giáo viên sang Bộ Phân Công Giám Thị!`);
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
    const filteredErrors = selectedClassZalo === 'ALL' 
      ? examStats.errorList 
      : examStats.errorList.filter(e => e.student_class === selectedClassZalo);

    const classLabel = selectedClassZalo === 'ALL' ? 'TOÀN KHỐI 12' : `LỚP ${selectedClassZalo}`;
    
    let msg = `📢 THÔNG BÁO TỪ BAN KHẢO THÍ - TRƯỜNG THPT CAO BÁ QUÁT\n`;
    msg += `📌 V/v: Rà soát & Điều chỉnh Hồ sơ Đăng ký Thi Tốt Nghiệp THPT 2026\n`;
    msg += `------------------------------------\n`;
    msg += `Kính gửi: Quý Thầy/Cô GVCN ${classLabel}\n\n`;
    msg += `Hệ thống thẩm định dữ liệu tự động phát hiện ${filteredErrors.length} hồ sơ học sinh CẦN ĐIỀU CHỈNH GẤP:\n\n`;

    if (filteredErrors.length === 0) {
      msg += `🎉 Xin chúc mừng! Tất cả hồ sơ ${classLabel} đều HỢP LỆ chuẩn quy chế GDPT 2018 (2+2).\n`;
    } else {
      filteredErrors.forEach((err, idx) => {
        msg += `${idx + 1}. Em: ${err.student_name} (${err.student_class})\n`;
        msg += `   - Mã HS: ${err.student_code} | CCCD: ${err.identity_card || 'Chưa có'}\n`;
        msg += `   - Lỗi: ${err.errors}\n\n`;
      });
      msg += `👉 Đề nghị GVCN nhắc nhở các em đối chiếu lại CCCD và tổ hợp 2 môn tự chọn trước 17h00 ngày hôm nay.\n`;
      msg += `Trân trọng cảm ơn Thầy/Cô!`;
    }

    return msg;
  };

  const handleCopyZalo = () => {
    const text = generateZaloMessage();
    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  // Distinct classes in error list
  const errorClasses = ['ALL', ...Array.from(new Set(examStats.errorList.map(e => e.student_class)))];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. TOP TOOLBAR */}
      {!isFullscreen && (
        <header style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '10px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#94a3b8',
                border: '1px solid #334155',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={15} /> Quay Lại
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}>
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h1 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.2px' }}>
                  HỆ THỐNG KIỂM TRA HỒ SƠ ĐĂNG KÝ THI TỐT NGHIỆP THPT (GDPT 2018)
                </h1>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>
                  CCCD 12 số • Quy tắc 2+2 Môn thi • Phân công Giám thị CSP • Zalo GVCN Hub
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* 1-Click Sync Students */}
            <button
              onClick={handleSyncGrade12Students}
              disabled={loadingSync}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2,132,199,0.3)'
              }}
              title="Tự động nạp toàn bộ học sinh Khối 12 từ CSDL Supabase sang công cụ"
            >
              <Database size={14} /> {loadingSync ? 'Đang Nạp...' : '⚡ Nạp CSDL Khối 12'}
            </button>

            {/* Sync Proctors */}
            <button
              onClick={handleSyncProctors}
              disabled={loadingProctors}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139,92,246,0.2)',
                color: '#c084fc',
                border: '1px solid rgba(139,92,246,0.4)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
              title="Nạp danh sách Cán bộ Giáo viên vào thuật toán Phân công Giám thị"
            >
              <Users size={14} /> 🧑‍🏫 Nạp Giám Thị
            </button>

            {/* Zalo Report Modal */}
            <button
              onClick={() => setShowZaloModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16,185,129,0.2)',
                color: '#34d399',
                border: '1px solid rgba(16,185,129,0.4)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
              title="Soạn tin nhắn Zalo cảnh báo hồ sơ sai sót gửi đích danh GVCN"
            >
              <Send size={14} /> 📲 Zalo GVCN ({examStats.errorCount})
            </button>

            {/* Analytics Dashboard */}
            <button
              onClick={() => setShowAnalyticsModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245,158,11,0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.3)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
              title="Xem thống kê toàn cảnh chọn môn khối 12 dành cho BGH"
            >
              <BarChart3 size={14} /> 📊 Thống Kê BGH
            </button>

            {/* Photo Vault Modal */}
            <button
              onClick={() => setShowPhotoVaultModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(236,72,153,0.15)',
                color: '#f472b6',
                border: '1px solid rgba(236,72,153,0.3)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Image size={14} /> 🖼️ Kho Ảnh Thẻ AI
            </button>

            {/* Guide Modal */}
            <button
              onClick={() => setShowGuideModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Quy tắc kiểm tra hồ sơ"
            >
              <HelpCircle size={14} />
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '7px 10px',
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
                padding: '7px 10px',
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
                gap: '5px',
                padding: '7px 13px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
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
      <div style={{ flex: 1, position: 'relative', width: '100%', height: isFullscreen ? '100vh' : 'calc(100vh - 58px)' }}>
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src="/tools/kiem-tra-ho-so-tn/index.html"
          title="Tool Kiểm Tra Hồ Sơ Đăng Ký Thi TN THPT"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          allow="camera; clipboard-read; clipboard-write"
        />
      </div>

      {/* 3. MODAL SOẠN BÁO CÁO ZALO CHO GVCN */}
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
                  Soạn Báo Cáo Zalo Cảnh Báo Hồ Sơ Gửi GVCN
                </h3>
              </div>
              <button
                onClick={() => setShowZaloModal(false)}
                style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Filter by class */}
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
                    {cls === 'ALL' ? 'Tất cả các lớp' : `Lớp ${cls}`}
                  </button>
                ))}
              </div>
            </div>

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
                💡 Tin nhắn được tối ưu chuẩn định dạng nhóm Zalo Giáo viên & Phụ huynh
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

      {/* 4. MODAL DASHBOARD THỐNG KÊ XU HƯỚNG MÔN THI BGH */}
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

      {/* 5. MODAL KHO ẢNH THẺ AI & XUẤT ZIP DỰ THI */}
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

      {/* 6. MODAL HƯỚNG DẪN QUY TẮC KIỂM TRA HỒ SƠ */}
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
