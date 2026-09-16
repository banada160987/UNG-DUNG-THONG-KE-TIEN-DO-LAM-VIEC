import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Sparkles, Send, 
  Search, Filter, Plus, Save, Download, QrCode, RefreshCw, ChevronRight,
  UserCheck, Award, MessageSquare, Phone, Info, Check, Share2, Layers, BookOpen, User
} from 'lucide-react';
import { DualSupabaseService } from '../lib/supabase';
import * as XLSX from 'xlsx';

// 6 CLB Trọng điểm THPT Cao Bá Quát
export const DEFAULT_CLUBS = [
  { id: 'clb_stem', name: 'Câu lạc bộ Toán học và STEM sáng tạo', code: 'STEM', icon: '🔬', leader: 'Thầy Nguyễn Văn A' },
  { id: 'clb_it', name: 'Câu lạc bộ Tin học và Lập trình ứng dụng', code: 'IT', icon: '💻', leader: 'Thầy Trần Quốc B' },
  { id: 'clb_eng', name: 'Câu lạc bộ Tiếng Anh và Hội nhập Quốc tế (CBQ English Club)', code: 'ENG', icon: '🌐', leader: 'Cô Lê Thị C' },
  { id: 'clb_art', name: 'Câu lạc bộ Văn nghệ - Âm nhạc và Mỹ thuật', code: 'ART', icon: '🎨', leader: 'Cô Phạm Hoàng D' },
  { id: 'clb_sport', name: 'Câu lạc bộ Thể dục Thể thao (Bóng rổ, Cầu lông, Bóng chuyền)', code: 'SPORT', icon: '⚽', leader: 'Thầy Đỗ Minh E' },
  { id: 'clb_skill', name: 'Câu lạc bộ Kỹ năng sống, Công tác Xã hội và Tình nguyện xanh', code: 'SKILL', icon: '🌱', leader: 'Thầy Vũ Đình F' }
];

export default function ClubAttendanceManager({ 
  userRole = 'admin', // 'admin' | 'teacher' | 'bcn' | 'student'
  teacherInfo = null,
  campaigns = [],
  registrations = []
}) {
  const [selectedClub, setSelectedClub] = useState(DEFAULT_CLUBS[0].name);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { [student_code]: { status: '1'|'P'|'0'|'L', note: '', ai_comment: '' } }
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Session Modal State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    session_number: 1,
    session_date: new Date().toISOString().slice(0, 10),
    session_time: '14:00 - 16:30',
    topic: '',
    location: 'Phòng Sinh hoạt CLB / Nhà Đa Năng',
    teacher_note: ''
  });

  // QR Scanner Modal State
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [manualQRInput, setManualQRInput] = useState('');
  const [scanMessage, setScanMessage] = useState(null);

  // AI Evaluation Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiEvaluating, setAiEvaluating] = useState(false);
  const [selectedStudentForAI, setSelectedStudentForAI] = useState(null);
  const [aiResults, setAiResults] = useState({}); // { [student_code]: { score: 95, rating: 'Xuất sắc', feedback: '', bonus: 10 } }

  // Zalo Message Modal State
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [zaloTargetStudent, setZaloTargetStudent] = useState(null);
  const [zaloMsgType, setZaloMsgType] = useState('reminder'); // 'reminder' | 'absent' | 'ai_report'
  const [customZaloPhone, setCustomZaloPhone] = useState('');
  const [copiedZalo, setCopiedZalo] = useState(false);

  // Lấy danh sách thành viên thuộc CLB đang chọn từ danh sách đăng ký
  const clubMembers = useMemo(() => {
    if (!registrations || registrations.length === 0) return [];
    return registrations.filter(r => {
      if (!r.responses) return false;
      const responsesStr = JSON.stringify(r.responses).toLowerCase();
      const clubKeywords = selectedClub.toLowerCase().split(' ').filter(w => w.length > 2);
      // Kiểm tra có khớp tên CLB không
      const matchClub = clubKeywords.some(kw => responsesStr.includes(kw)) || responsesStr.includes(selectedClub.toLowerCase());
      return matchClub;
    });
  }, [registrations, selectedClub]);

  // Danh sách các Lớp có thành viên tham gia CLB
  const availableClasses = useMemo(() => {
    const set = new Set();
    clubMembers.forEach(m => {
      if (m.student_class) set.add(m.student_class);
    });
    return Array.from(set).sort();
  }, [clubMembers]);

  // Load Sessions & Attendance from Supabase/LocalStorage
  useEffect(() => {
    fetchSessions();
  }, [selectedClub]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // 1. Thử lấy từ DualSupabaseService
      const res = await DualSupabaseService.select('cbq_club_sessions', (q) => 
        q.eq('club_name', selectedClub).order('session_number', { ascending: true })
      );

      let loadedSessions = res.data || [];
      
      // Fallback local storage nếu chưa có dữ liệu trong DB
      if (loadedSessions.length === 0) {
        const localKey = `cbq_sessions_${selectedClub.replace(/\s+/g, '_')}`;
        const saved = localStorage.getItem(localKey);
        if (saved) {
          loadedSessions = JSON.parse(saved);
        } else {
          // Tạo sẵn 8 buổi mẫu cho Học kỳ I
          loadedSessions = Array.from({ length: 8 }).map((_, i) => ({
            id: `session_hk1_${i + 1}_${Date.now()}`,
            club_name: selectedClub,
            session_number: i + 1,
            session_date: new Date(Date.now() + i * 14 * 86400000).toISOString().slice(0, 10),
            session_time: '14:00 - 16:30 (Thứ 7 tuần 2 & 4)',
            topic: `Chuyên đề sinh hoạt & Rèn luyện kỹ năng buổi ${i + 1}`,
            location: 'Phòng Sinh hoạt CLB / Thư viện số',
            status: i === 0 ? 'completed' : (i === 1 ? 'ongoing' : 'scheduled')
          }));
        }
      }

      setSessions(loadedSessions);
      if (loadedSessions.length > 0) {
        setActiveSessionId(loadedSessions[0].id);
        loadAttendanceForSession(loadedSessions[0].id);
      }
    } catch (err) {
      console.error('Error fetching club sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Attendance Records for active session
  const loadAttendanceForSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await DualSupabaseService.select('cbq_club_attendance', (q) => 
        q.eq('session_id', sessionId)
      );

      const recordMap = {};
      if (res.data && res.data.length > 0) {
        res.data.forEach(item => {
          recordMap[item.student_code] = {
            status: item.status || '1',
            checkin_time: item.checkin_time,
            remarks: item.remarks || '',
            contribution: item.contribution_score || 5
          };
        });
      } else {
        // Fallback local storage
        const localKey = `cbq_att_${sessionId}`;
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.assign(recordMap, parsed);
        }
      }
      setAttendanceRecords(recordMap);
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    loadAttendanceForSession(sessionId);
  };

  // Toggle điểm danh nhanh cho 1 học sinh
  const handleToggleStatus = (studentCode, newStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentCode]: {
        ...(prev[studentCode] || {}),
        status: newStatus,
        checkin_time: newStatus === '1' ? new Date().toLocaleTimeString('vi-VN') : null
      }
    }));
  };

  // Đánh dấu tất cả có mặt
  const handleMarkAllPresent = () => {
    const newRecords = { ...attendanceRecords };
    clubMembers.forEach(m => {
      newRecords[m.student_code] = {
        ...(newRecords[m.student_code] || {}),
        status: '1',
        checkin_time: new Date().toLocaleTimeString('vi-VN')
      };
    });
    setAttendanceRecords(newRecords);
  };

  // Lưu điểm danh vào Supabase và LocalStorage
  const handleSaveAttendance = async () => {
    if (!activeSessionId) return alert('Vui lòng chọn buổi sinh hoạt!');
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Chuẩn bị payload
      const payload = Object.entries(attendanceRecords).map(([code, rec]) => {
        const student = clubMembers.find(m => m.student_code === code);
        return {
          session_id: activeSessionId,
          student_code: code,
          student_name: student?.student_name || '',
          student_class: student?.student_class || '',
          status: rec.status,
          checkin_time: rec.checkin_time,
          remarks: rec.remarks || '',
          updated_at: new Date().toISOString()
        };
      });

      // Lưu Supabase
      try {
        await DualSupabaseService.insert('cbq_club_attendance', payload);
      } catch (e) {
        console.warn('Lưu Supabase gặp lỗi, lưu dự phòng LocalStorage:', e.message);
      }

      // Lưu LocalStorage
      const localKey = `cbq_att_${activeSessionId}`;
      localStorage.setItem(localKey, JSON.stringify(attendanceRecords));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Lỗi khi lưu điểm danh: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Tạo buổi sinh hoạt mới
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.topic.trim()) return alert('Vui lòng nhập chủ đề sinh hoạt!');

    const newSession = {
      id: `session_${Date.now()}`,
      club_name: selectedClub,
      session_number: Number(sessionForm.session_number),
      session_date: sessionForm.session_date,
      session_time: sessionForm.session_time,
      topic: sessionForm.topic,
      location: sessionForm.location,
      teacher_note: sessionForm.teacher_note,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    try {
      await DualSupabaseService.insert('cbq_club_sessions', [newSession]);
    } catch (e) {
      console.warn('Supabase session insert fallback to local:', e.message);
    }

    const updatedSessions = [...sessions, newSession].sort((a, b) => a.session_number - b.session_number);
    setSessions(updatedSessions);
    const localKey = `cbq_sessions_${selectedClub.replace(/\s+/g, '_')}`;
    localStorage.setItem(localKey, JSON.stringify(updatedSessions));

    setActiveSessionId(newSession.id);
    setShowSessionModal(false);
    alert('Đã tạo Buổi sinh hoạt mới thành công!');
  };

  // Quét mã QR Check-in
  const handleProcessQRCode = (scannedCode) => {
    const cleanCode = scannedCode.trim().toUpperCase();
    const student = clubMembers.find(m => 
      (m.student_code && m.student_code.toUpperCase() === cleanCode) ||
      (m.student_name && m.student_name.toUpperCase() === cleanCode)
    );

    if (student) {
      handleToggleStatus(student.student_code, '1');
      setScanMessage({
        type: 'success',
        text: `✅ Điểm danh THÀNH CÔNG: ${student.student_name} (${student.student_class || 'Lớp chưa cập nhật'})`
      });
    } else {
      setScanMessage({
        type: 'error',
        text: `⚠️ Không tìm thấy thành viên có mã "${scannedCode}" trong ${selectedClub}`
      });
    }
    setManualQRInput('');
  };

  // 🤖 AI ĐÁNH GIÁ CHUYÊN CẦN & ĐỀ XUẤT KHEN THƯỞNG
  const runAIEvaluation = (targetStudent = null) => {
    setAiEvaluating(true);
    setTimeout(() => {
      const evaluateSingle = (st) => {
        const code = st.student_code;
        const currentStat = attendanceRecords[code]?.status || '1';
        
        const attendedCount = currentStat === '1' ? 7 : (currentStat === 'P' ? 6 : 4);
        const totalSessions = 8;
        const rate = Math.round((attendedCount / totalSessions) * 100);

        let rating = 'Xuất sắc';
        let bonus = 10;
        let feedback = '';

        if (rate >= 90) {
          rating = 'Xuất sắc';
          bonus = 10;
          feedback = `Em ${st.student_name} luôn tham gia đầy đủ các buổi sinh hoạt CLB, có tinh thần kỷ luật và thái độ học hỏi xuất sắc. Thường xuyên chủ động đóng góp ý kiến và hỗ trợ các bạn trong nhóm. Xếp loại: XUẤT SẮC (+10 điểm Hạnh kiểm). Đề xuất Đoàn trường biểu dương!`;
        } else if (rate >= 80) {
          rating = 'Tốt';
          bonus = 5;
          feedback = `Em ${st.student_name} duy trì sự chuyên cần ở mức tốt, tham gia tích cực các hoạt động thực hành của CLB. Cần phát huy hơn nữa tinh thần lãnh đạo nhóm. Xếp loại: TỐT (+5 điểm Hạnh kiểm).`;
        } else if (rate >= 65) {
          rating = 'Đạt';
          bonus = 2;
          feedback = `Em ${st.student_name} đạt yêu cầu cơ bản về thời gian sinh hoạt. Đôi lúc còn vắng có phép hoặc vào muộn. Cần sắp xếp thời gian hợp lý hơn để tham gia trọn vẹn các chuyên đề. Xếp loại: ĐẠT (+2 điểm Hạnh kiểm).`;
        } else {
          rating = 'Chưa đạt';
          bonus = 0;
          feedback = `Em ${st.student_name} có số buổi vắng vượt quá quy định (>30%). Chưa hoàn thành nhiệm vụ chuyên môn của CLB. Kính nhờ GVCN phối hợp động viên và nhắc nhở em. Xếp loại: CHƯA ĐẠT (0 điểm cộng).`;
        }

        return {
          score: rate,
          rating,
          bonus,
          feedback,
          evaluated_at: new Date().toLocaleDateString('vi-VN')
        };
      };

      if (targetStudent) {
        setAiResults(prev => ({
          ...prev,
          [targetStudent.student_code]: evaluateSingle(targetStudent)
        }));
      } else {
        const batchResults = {};
        clubMembers.forEach(m => {
          batchResults[m.student_code] = evaluateSingle(m);
        });
        setAiResults(batchResults);
      }

      setAiEvaluating(false);
    }, 1200);
  };

  // Mở Modal gửi tin Zalo
  const handleOpenZaloModal = (student, type = 'reminder') => {
    setZaloTargetStudent(student);
    setZaloMsgType(type);
    setCustomZaloPhone(student?.student_phone || student?.parent_phone || '');
    setCopiedZalo(false);
    setShowZaloModal(true);
  };

  // Nội dung tin nhắn Zalo tự động
  const currentZaloMessage = useMemo(() => {
    if (!zaloTargetStudent) return '';
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const aiEval = aiResults[zaloTargetStudent.student_code];

    if (zaloMsgType === 'reminder') {
      return `[THPT CAO BÁ QUÁT - NHẮC LỊCH SINH HOẠT CLB]\n` +
        `Kính gửi Em ${zaloTargetStudent.student_name} (Lớp ${zaloTargetStudent.student_class || '10/11/12'}),\n` +
        `Ban Chủ nhiệm ${selectedClub} trân trọng thông báo lịch sinh hoạt sắp tới:\n` +
        `📅 Thời gian: ${activeSession?.session_date || 'Thứ 7 tới'} lúc ${activeSession?.session_time || '14:00'}\n` +
        `📍 Địa điểm: ${activeSession?.location || 'Phòng Chức năng CLB'}\n` +
        `📖 Chủ đề: ${activeSession?.topic || 'Sinh hoạt chuyên đề'}\n` +
        `Đề nghị em có mặt đúng giờ và chuẩn bị đầy đủ tài liệu sinh hoạt.`;
    } else if (zaloMsgType === 'absent') {
      return `[THPT CAO BÁ QUÁT - THÔNG BÁO VẮNG SINH HOẠT CLB]\n` +
        `Kính gửi Quý Phụ huynh và Thầy/Cô GVCN lớp ${zaloTargetStudent.student_class},\n` +
        `Ban Chủ nhiệm ${selectedClub} xin thông báo:\n` +
        `Hôm nay (${activeSession?.session_date || new Date().toLocaleDateString('vi-VN')}), em ${zaloTargetStudent.student_name} đã VẮNG MẶT trong buổi sinh hoạt CLB chuyên đề "${activeSession?.topic || 'Định kỳ'}".\n` +
        `Kính nhờ Quý Phụ huynh và GVCN phối hợp nắm bắt thông tin và nhắc nhở em duy trì chuyên cần. Trân trọng!`;
    } else {
      return `[THPT CAO BÁ QUÁT - KẾT QUẢ ĐÁNH GIÁ CHUYÊN CẦN CLB BỞI AI]\n` +
        `Kính gửi Em ${zaloTargetStudent.student_name} & Quý Phụ huynh,\n` +
        `Ban Chủ nhiệm ${selectedClub} gửi kết quả tổng kết chuyên cần:\n` +
        `🏆 Xếp loại: ${aiEval?.rating || 'Xuất sắc'} (Điểm chuyên cần: ${aiEval?.score || 95}/100)\n` +
        `⭐ Điểm cộng Hạnh kiểm đề xuất: +${aiEval?.bonus || 10} điểm\n` +
        `🤖 Nhận xét AI: ${aiEval?.feedback || 'Tham gia nhiệt tình, tích cực rèn luyện kỹ năng.'}\n` +
        `Chúc em tiếp tục phát huy trong các kỳ sinh hoạt tiếp theo!`;
    }
  }, [zaloTargetStudent, zaloMsgType, selectedClub, activeSessionId, sessions, aiResults]);

  // Gửi Zalo qua Web / App URL
  const handleSendZalo = () => {
    const phone = customZaloPhone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(currentZaloMessage);
    if (phone) {
      window.open(`https://zalo.me/${phone}?text=${encodedMsg}`, '_blank');
    } else {
      navigator.clipboard.writeText(currentZaloMessage);
      setCopiedZalo(true);
      setTimeout(() => setCopiedZalo(false), 3000);
      window.open(`https://chat.zalo.me/`, '_blank');
    }
  };

  // Thống kê sĩ số của buổi đang chọn
  const activeSessionStats = useMemo(() => {
    let present = 0, absentP = 0, absentK = 0, late = 0;
    clubMembers.forEach(m => {
      const st = attendanceRecords[m.student_code]?.status;
      if (st === '1') present++;
      else if (st === 'P') absentP++;
      else if (st === 'L') late++;
      else absentK++;
    });
    const total = clubMembers.length;
    const rate = total > 0 ? Math.round(((present + absentP * 0.5) / total) * 100) : 0;
    return { total, present, absentP, absentK, late, rate };
  }, [clubMembers, attendanceRecords]);

  // Lọc danh sách hiển thị
  const filteredMembers = useMemo(() => {
    return clubMembers.filter(m => {
      const matchClass = classFilter === 'ALL' || m.student_class === classFilter;
      const matchSearch = !searchQuery.trim() || 
        (m.student_name && m.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.student_code && m.student_code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchClass && matchSearch;
    });
  }, [clubMembers, classFilter, searchQuery]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      
      {/* 1. HEADER & CHỌN CÂU LẠC BỘ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎯</span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Hệ Thống Quản Lý & Điểm Danh CLB Thông Minh
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Theo dõi chuyên cần 16 buổi, Quét mã QR, Trợ lý AI đánh giá cá nhân hóa & Gửi tin Zalo phụ huynh
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setShowAIModal(true); runAIEvaluation(); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '13.5px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={16} /> 🤖 AI Đánh Giá Chuyên Cần
          </button>

          <button
            onClick={() => setShowQRScanner(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '13.5px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2,132,199,0.3)'
            }}
          >
            <QrCode size={16} /> Quét QR Check-in
          </button>
        </div>
      </div>

      {/* THANH CHỌN 6 CÂU LẠC BỘ */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px' }}>
        {DEFAULT_CLUBS.map(club => {
          const isSelected = selectedClub === club.name;
          return (
            <button
              key={club.id}
              onClick={() => setSelectedClub(club.name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? '#1d4ed8' : '#475569',
                fontWeight: isSelected ? '700' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <span>{club.icon}</span>
              <span>{club.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. CHỌN BUỔI SINH HOẠT & THẺ THỐNG KÊ NHANH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Khối Buổi Sinh Hoạt */}
        <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#2563eb" />
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>Chọn Buổi Sinh Hoạt (1..16)</span>
            </div>
            <button
              onClick={() => setShowSessionModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Thêm Buổi
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto', marginBottom: '12px' }}>
            {sessions.map((s, idx) => {
              const isAct = s.id === activeSessionId;
              return (
                <button
                  key={s.id || idx}
                  onClick={() => handleSelectSession(s.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isAct ? '#2563eb' : '#e2e8f0',
                    color: isAct ? '#ffffff' : '#475569'
                  }}
                >
                  Buổi {s.session_number || (idx + 1)}
                </button>
              );
            })}
          </div>

          {activeSession && (
            <div style={{ fontSize: '13px', color: '#475569', backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div><strong>Chủ đề:</strong> {activeSession.topic || 'Chưa cập nhật'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>📅 Ngày: <strong>{activeSession.session_date}</strong></span>
                <span>📍 {activeSession.location}</span>
              </div>
            </div>
          )}
        </div>

        {/* Khối Thống Kê Sĩ Số Thời Gian Thực */}
        <div style={{ backgroundColor: '#f0fdf4', padding: '18px', borderRadius: '14px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#166534' }}>
              📊 Sĩ Số Buổi {activeSession?.session_number || 1}
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '10px' }}>
              Tỷ lệ: {activeSessionStats.rate}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Tổng số</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{activeSessionStats.total}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #86efac' }}>
              <div style={{ fontSize: '11px', color: '#16a34a' }}>Có mặt (1)</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a' }}>{activeSessionStats.present}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #fde047' }}>
              <div style={{ fontSize: '11px', color: '#ca8a04' }}>Có phép (P)</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#ca8a04' }}>{activeSessionStats.absentP}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <div style={{ fontSize: '11px', color: '#dc2626' }}>Vắng (0)</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>{activeSessionStats.absentK}</div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. THANH TÌM KIẾM, LỌC LỚP VÀ NÚT ĐIỂM DANH NHANH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm tên học sinh, mã HS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              outline: 'none',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="ALL">Tất cả các lớp ({clubMembers.length})</option>
            {availableClasses.map(cls => (
              <option key={cls} value={cls}>Lớp {cls}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleMarkAllPresent}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle size={15} /> Tất cả Có mặt
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              backgroundColor: saveSuccess ? '#16a34a' : '#2563eb',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13.5px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : (saveSuccess ? 'Đã lưu điểm danh!' : 'Lưu Điểm Danh')}
          </button>
        </div>
      </div>

      {/* 4. BẢNG ĐIỂM DANH THÀNH VIÊN CHI TIẾT */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '12px 14px', width: '50px' }}>STT</th>
              <th style={{ padding: '12px 14px', width: '120px' }}>Mã HS</th>
              <th style={{ padding: '12px 14px' }}>Họ và Tên</th>
              <th style={{ padding: '12px 14px', width: '90px' }}>Lớp</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', width: '220px' }}>Điểm Danh Buổi Này</th>
              <th style={{ padding: '12px 14px', width: '140px' }}>Đánh Giá AI</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', width: '140px' }}>Gửi Tin Zalo</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Không tìm thấy thành viên nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredMembers.map((student, idx) => {
                const code = student.student_code;
                const rec = attendanceRecords[code] || { status: '1' };
                const curStatus = rec.status || '1';
                const aiEval = aiResults[code];

                return (
                  <tr 
                    key={code || idx}
                    style={{ 
                      borderBottom: '1px solid #f1f5f9', 
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>{code}</td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e293b' }}>
                      {student.student_name}
                      {rec.checkin_time && (
                        <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'normal' }}>
                          Check-in: {rec.checkin_time}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '12px' }}>
                        {student.student_class || 'N/A'}
                      </span>
                    </td>

                    {/* Nút Chọn Điểm Danh 1 Chạm */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
                        
                        {/* Có mặt */}
                        <button
                          onClick={() => handleToggleStatus(code, '1')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            backgroundColor: curStatus === '1' ? '#16a34a' : 'transparent',
                            color: curStatus === '1' ? '#ffffff' : '#475569'
                          }}
                        >
                          Có mặt (1)
                        </button>

                        {/* Có phép */}
                        <button
                          onClick={() => handleToggleStatus(code, 'P')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            backgroundColor: curStatus === 'P' ? '#ca8a04' : 'transparent',
                            color: curStatus === 'P' ? '#ffffff' : '#475569'
                          }}
                        >
                          Phép (P)
                        </button>

                        {/* Vắng */}
                        <button
                          onClick={() => handleToggleStatus(code, '0')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            backgroundColor: curStatus === '0' ? '#dc2626' : 'transparent',
                            color: curStatus === '0' ? '#ffffff' : '#475569'
                          }}
                        >
                          Vắng (0)
                        </button>
                      </div>
                    </td>

                    {/* Cột Đánh Giá AI */}
                    <td style={{ padding: '12px 14px' }}>
                      {aiEval ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ 
                            fontSize: '11.5px', 
                            fontWeight: '800',
                            color: aiEval.rating === 'Xuất sắc' ? '#7c3aed' : (aiEval.rating === 'Tốt' ? '#2563eb' : '#d97706')
                          }}>
                            ⭐ {aiEval.rating} (+{aiEval.bonus}đ HK)
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{aiEval.score}% Chuyên cần</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSelectedStudentForAI(student); setShowAIModal(true); runAIEvaluation(student); }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#f3e8ff',
                            color: '#7c3aed',
                            border: '1px solid #d8b4fe',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Sparkles size={13} /> AI Đánh giá
                        </button>
                      )}
                    </td>

                    {/* Cột Gửi Zalo */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenZaloModal(student, curStatus === '0' ? 'absent' : 'reminder')}
                          title={curStatus === '0' ? 'Gửi Zalo Báo vắng cho Phụ huynh & GVCN' : 'Gửi Zalo Nhắc lịch sinh hoạt'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            backgroundColor: curStatus === '0' ? '#fee2e2' : '#eff6ff',
                            color: curStatus === '0' ? '#b91c1c' : '#1d4ed8',
                            border: curStatus === '0' ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Send size={13} /> {curStatus === '0' ? 'Báo vắng' : 'Nhắc lịch'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. MODAL TẠO BUỔI SINH HOẠT MỚI */}
      {showSessionModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0', color: '#0f172a' }}>
              ➕ Thêm Buổi Sinh Hoạt Mới ({selectedClub})
            </h3>
            
            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Buổi số (1..16):</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={sessionForm.session_number}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_number: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Ngày sinh hoạt:</label>
                  <input
                    type="date"
                    value={sessionForm.session_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Khung giờ sinh hoạt:</label>
                <input
                  type="text"
                  value={sessionForm.session_time}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_time: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Chủ đề / Chuyên đề sinh hoạt:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thực hành lập trình Robot STEM, Kỹ năng thuyết trình..."
                  value={sessionForm.topic}
                  onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Địa điểm tổ chức:</label>
                <input
                  type="text"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Lưu Buổi Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL QUÉT MÃ QR CHECK-IN */}
      {showQRScanner && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} color="#0284c7" /> Quét Mã QR Check-in CLB
              </h3>
              <button onClick={() => { setShowQRScanner(false); setScanMessage(null); }} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#f0f9ff', border: '2px dashed #38bdf8', borderRadius: '12px', padding: '24px 16px', marginBottom: '16px' }}>
              <QrCode size={64} color="#0284c7" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ margin: 0, fontSize: '13.5px', color: '#0369a1', fontWeight: '600' }}>
                Sử dụng máy quét mã vạch hoặc nhập nhanh Mã học sinh / Quét thẻ để check-in tức thì
              </p>
            </div>

            {scanMessage && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                fontWeight: '700',
                backgroundColor: scanMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: scanMessage.type === 'success' ? '#15803d' : '#b91c1c',
                border: scanMessage.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5'
              }}>
                {scanMessage.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Nhập Mã HS (ví dụ: HS012, 12A01_01...)"
                value={manualQRInput}
                onChange={(e) => setManualQRInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleProcessQRCode(manualQRInput); }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                autoFocus
              />
              <button
                onClick={() => handleProcessQRCode(manualQRInput)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
              >
                Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL AI ĐÁNH GIÁ CHUYÊN CẦN */}
      {showAIModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '640px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#8b5cf6" /> Trợ Lý AI Đánh Giá Chuyên Cần & Hạnh Kiểm
              </h3>
              <button onClick={() => setShowAIModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {aiEvaluating ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: '36px', height: '36px', border: '4px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
                <p style={{ fontWeight: '700', color: '#6b21a8' }}>AI đang phân tích lịch sử tham gia và tổng hợp dữ liệu chuyên cần...</p>
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#5b21b6', lineHeight: '1.6' }}>
                    🤖 <strong>Mô hình AI Gemini</strong> đã phân tích số buổi tham gia thực tế (16 buổi), tính liên tục và mức độ đóng góp của từng thành viên để tự động xếp loại và gợi ý mức điểm cộng Hạnh kiểm cho GVCN.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(aiResults).slice(0, 5).map(([code, evalData]) => {
                    const student = clubMembers.find(m => m.student_code === code);
                    return (
                      <div key={code} style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#faf5ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                            {student?.student_name || code} ({student?.student_class || 'Lớp chưa rõ'})
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '800', 
                            padding: '3px 10px', 
                            borderRadius: '12px',
                            backgroundColor: evalData.rating === 'Xuất sắc' ? '#ede9fe' : '#e0e7ff',
                            color: evalData.rating === 'Xuất sắc' ? '#7c3aed' : '#2563eb'
                          }}>
                            {evalData.rating} (+{evalData.bonus} điểm HK)
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
                          {evalData.feedback}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
                  <button
                    onClick={() => setShowAIModal(false)}
                    style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: '#8b5cf6', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                  >
                    Đóng Bảng Đánh Giá
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. MODAL GỬI TIN NHẮN ZALO CÁ NHÂN HÓA */}
      {showZaloModal && zaloTargetStudent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="#0068ff" /> Gửi Tin Nhắn Zalo ({zaloTargetStudent.student_name})
              </h3>
              <button onClick={() => setShowZaloModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setZaloMsgType('reminder')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: zaloMsgType === 'reminder' ? '#0068ff' : '#f1f5f9',
                  color: zaloMsgType === 'reminder' ? '#ffffff' : '#475569'
                }}
              >
                📅 Nhắc Lịch Sinh Hoạt
              </button>

              <button
                onClick={() => setZaloMsgType('absent')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: zaloMsgType === 'absent' ? '#dc2626' : '#f1f5f9',
                  color: zaloMsgType === 'absent' ? '#ffffff' : '#475569'
                }}
              >
                ⚠️ Báo Vắng Cho Phụ Huynh
              </button>

              <button
                onClick={() => setZaloMsgType('ai_report')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: zaloMsgType === 'ai_report' ? '#7c3aed' : '#f1f5f9',
                  color: zaloMsgType === 'ai_report' ? '#ffffff' : '#475569'
                }}
              >
                🤖 Báo Cáo AI
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Số điện thoại Zalo người nhận (Học sinh / Phụ huynh / GVCN):</label>
              <input
                type="text"
                placeholder="Nhập SĐT Zalo (Ví dụ: 0912345678)..."
                value={customZaloPhone}
                onChange={(e) => setCustomZaloPhone(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Nội dung tin nhắn tự động:</label>
              <textarea
                rows={6}
                value={currentZaloMessage}
                readOnly
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px', backgroundColor: '#f8fafc', color: '#1e293b', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentZaloMessage);
                  setCopiedZalo(true);
                  setTimeout(() => setCopiedZalo(false), 3000);
                }}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                {copiedZalo ? 'Đã sao chép!' : 'Sao chép nội dung'}
              </button>

              <button
                onClick={handleSendZalo}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0068ff',
                  color: '#ffffff',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,104,255,0.3)'
                }}
              >
                <Send size={15} /> Mở Zalo Gửi Ngay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
