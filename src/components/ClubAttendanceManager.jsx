import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Sparkles, Send, 
  Search, Filter, Plus, Save, Download, QrCode, RefreshCw, ChevronRight,
  UserCheck, Award, MessageSquare, Phone, Info, Check, Share2, Layers, BookOpen, User, X, ShieldCheck
} from 'lucide-react';
import { DualSupabaseService, supabase, supabase2Admin, supabase2 } from '../lib/supabase';
const adminClient = supabase2Admin || supabase2;
import * as XLSX from 'xlsx';
import { CLUB_SUB_DISCIPLINES, getSubDisciplinesForClub } from '../data/clubSubDisciplines';

// Helper so khớp tên CLB hoặc môn phụ (Hỗ trợ cả tên ngắn gọn như "Cầu lông" và tên đầy đủ kèm HLV như "6. Cầu lông (Thầy...)")
export const isOptionMatch = (optName, studentAns) => {
  if (!optName || !studentAns) return false;
  const s1 = String(optName).trim().toLowerCase();
  const s2 = String(studentAns).trim().toLowerCase();
  
  if (s1 === s2) return true;
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  const clean = str => str
    .replace(/^[0-9]+[.)\s-]+/, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[-–—/\\].*$/, '')
    .replace(/[^a-z0-9à-ỹ]/gi, '')
    .toLowerCase();

  const c1 = clean(s1);
  const c2 = clean(s2);
  
  if (c1 && c2 && (c1.includes(c2) || c2.includes(c1))) {
    return true;
  }
  return false;
};

export default function ClubAttendanceManager({ 
  userRole = 'admin', // 'admin' | 'teacher' | 'bcn' | 'student'
  teacherInfo = null,
  campaigns = [],
  registrations: initialRegistrations = []
}) {
  // 1. Quản lý Đợt Đăng Ký (Campaign) - Chỉ nhận đợt Câu lạc bộ
  const [allCampaigns, setAllCampaigns] = useState(campaigns);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [campaignRegistrations, setCampaignRegistrations] = useState(initialRegistrations);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Lọc chỉ giữ các đợt đăng ký liên quan đến Câu lạc bộ (CLB)
  const clubCampaigns = useMemo(() => {
    const list = allCampaigns.filter(c => {
      const title = (c.title || '').toLowerCase();
      return title.includes('câu lạc bộ') || title.includes('clb') || title.includes('môn phụ') || title.includes('phân môn');
    });
    return list.length > 0 ? list : allCampaigns;
  }, [allCampaigns]);

  // 2. Quản lý Câu Lạc Bộ được chọn (Đọc động từ Form Schema)
  const [selectedClub, setSelectedClub] = useState('ALL');
  const [subDisciplineFilter, setSubDisciplineFilter] = useState('ALL'); // Lọc theo môn phụ
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modals State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    session_number: 1,
    session_date: new Date().toISOString().slice(0, 10),
    session_time: '14:00 - 16:30',
    topic: '',
    location: 'Phòng Sinh hoạt CLB / Nhà Đa Năng',
    teacher_note: ''
  });

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [manualQRInput, setManualQRInput] = useState('');
  const [scanMessage, setScanMessage] = useState(null);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiEvaluating, setAiEvaluating] = useState(false);
  const [selectedStudentForAI, setSelectedStudentForAI] = useState(null);
  const [aiResults, setAiResults] = useState({});

  const [showZaloModal, setShowZaloModal] = useState(false);
  const [zaloTargetStudent, setZaloTargetStudent] = useState(null);
  const [zaloMsgType, setZaloMsgType] = useState('reminder');
  const [customZaloPhone, setCustomZaloPhone] = useState('');
  const [copiedZalo, setCopiedZalo] = useState(false);

  // Emulation Sync State (Đồng bộ Thi đua & Nề nếp Lớp)
  const [showEmulationSyncModal, setShowEmulationSyncModal] = useState(false);
  const [syncWeekNumber, setSyncWeekNumber] = useState(1);
  const [syncBonusPerPresent, setSyncBonusPerPresent] = useState(2);
  const [syncPenaltyPerAbsent, setSyncPenaltyPerAbsent] = useState(2);
  const [syncingEmulation, setSyncingEmulation] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const [previewClassZalo, setPreviewClassZalo] = useState(null);
  const [copiedClassZalo, setCopiedClassZalo] = useState(false);

  // Khởi tạo và nạp đợt đăng ký CLB
  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      setAllCampaigns(campaigns);
      // Tự động tìm đợt có chứa từ khóa 'câu lạc bộ' hoặc 'clb'
      const clubCam = campaigns.find(c => (c.title || '').toLowerCase().includes('câu lạc bộ') || (c.title || '').toLowerCase().includes('clb')) || campaigns[0];
      if (clubCam && !selectedCampaignId) {
        setSelectedCampaignId(clubCam.id);
      }
    } else {
      fetchCampaigns();
    }
  }, [campaigns]);

  const fetchCampaigns = async () => {
    try {
      const res = await DualSupabaseService.selectSmart('cbq_registration_campaigns', q => q.order('created_at', { ascending: false }));
      if (res.data && res.data.length > 0) {
        setAllCampaigns(res.data);
        const clubCam = res.data.find(c => (c.title || '').toLowerCase().includes('câu lạc bộ') || (c.title || '').toLowerCase().includes('clb')) || res.data[0];
        setSelectedCampaignId(clubCam.id);
      }
    } catch (e) {
      console.error('Error fetching campaigns:', e);
    }
  };

  // Nạp toàn bộ dữ liệu học sinh đăng ký của đợt đang chọn
  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignRegistrations(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const fetchCampaignRegistrations = async (camId) => {
    setLoadingRegs(true);
    try {
      const campaign = allCampaigns.find(c => c.id === camId);
      const client = campaign?._source === 'sb1' ? supabase : adminClient;

      let allRegs = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await client
          .from('cbq_student_registrations')
          .select('*')
          .eq('campaign_id', camId)
          .order('created_at', { ascending: false })
          .range(from, from + step - 1);

        if (!error && data && data.length > 0) {
          allRegs = [...allRegs, ...data];
          from += step;
          if (data.length < step) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }

      setCampaignRegistrations(allRegs);
    } catch (err) {
      console.error('Error loading registrations for campaign:', err);
    } finally {
      setLoadingRegs(false);
    }
  };

  // Trích xuất đợt hiện tại & các lựa chọn CLB từ Form Schema
  const activeCampaign = useMemo(() => {
    return allCampaigns.find(c => c.id === selectedCampaignId) || null;
  }, [allCampaigns, selectedCampaignId]);

  // Trích xuất danh sách CLB thật từ form_schema (các field select, radio, checkbox)
  const availableClubOptions = useMemo(() => {
    if (!activeCampaign || !activeCampaign.form_schema) return [];
    const fields = Array.isArray(activeCampaign.form_schema) ? activeCampaign.form_schema : (activeCampaign.form_schema?.fields || []);
    
    // Tìm các trường có options (VD: "Đăng ký câu lạc bộ", "Môn phụ / Bộ môn")
    const clubField = fields.find(f => ['checkbox', 'select', 'radio'].includes(f.type) && f.options && f.options.length > 0) || fields[0];
    
    if (!clubField || !clubField.options) return [];

    // Tính số lượng thành viên thực tế của từng CLB bằng so khớp thông minh
    return clubField.options.map(opt => {
      const count = campaignRegistrations.filter(r => {
        if (!r.responses) return false;
        const ans = r.responses[clubField.id];
        if (Array.isArray(ans)) {
          return ans.some(item => isOptionMatch(opt, item));
        }
        return isOptionMatch(opt, ans);
      }).length;

      return {
        name: opt,
        fieldId: clubField.id,
        count
      };
    });
  }, [activeCampaign, campaignRegistrations]);

  // Tự động chọn CLB đầu tiên có thành viên khi nạp xong
  useEffect(() => {
    if (availableClubOptions.length > 0 && selectedClub === 'ALL') {
      setSelectedClub(availableClubOptions[0].name);
    }
  }, [availableClubOptions]);

  // LỌC THÀNH VIÊN THỰC TẾ THEO CÂU LẠC BỘ ĐƯỢC CHỌN
  const clubMembers = useMemo(() => {
    if (!campaignRegistrations || campaignRegistrations.length === 0) return [];
    if (selectedClub === 'ALL') return campaignRegistrations;

    return campaignRegistrations.filter(r => {
      if (!r.responses) return false;
      // Tìm xem có bất kỳ câu trả lời nào khớp với selectedClub không
      return Object.values(r.responses).some(val => {
        if (Array.isArray(val)) {
          return val.some(item => isOptionMatch(selectedClub, item));
        }
        return isOptionMatch(selectedClub, val);
      });
    });
  }, [campaignRegistrations, selectedClub]);

  // Danh sách các Lớp có thành viên trong CLB
  const availableClasses = useMemo(() => {
    const set = new Set();
    clubMembers.forEach(m => {
      if (m.student_class) set.add(m.student_class);
    });
    return Array.from(set).sort();
  }, [clubMembers]);

  // Nạp danh sách buổi sinh hoạt (Sessions) của CLB được chọn
  useEffect(() => {
    if (selectedClub && selectedClub !== 'ALL') {
      fetchSessions(selectedClub);
    }
  }, [selectedClub]);

  const fetchSessions = async (clubName) => {
    try {
      const res = await DualSupabaseService.select('cbq_club_sessions', (q) => 
        q.eq('club_name', clubName).order('session_number', { ascending: true })
      );

      let loadedSessions = res.data || [];
      if (loadedSessions.length === 0) {
        const localKey = `cbq_sessions_${clubName.replace(/[/\\?%*:|"<>]/g, '_')}`;
        const saved = localStorage.getItem(localKey);
        if (saved) {
          loadedSessions = JSON.parse(saved);
        } else {
          // Tạo sẵn 8 buổi mẫu cho Học kỳ I
          loadedSessions = Array.from({ length: 8 }).map((_, i) => ({
            id: `session_hk1_${i + 1}_${Date.now()}`,
            club_name: clubName,
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
    }
  };

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

  const handleSaveAttendance = async () => {
    if (!activeSessionId) return alert('Vui lòng chọn buổi sinh hoạt!');
    setSaving(true);
    setSaveSuccess(false);

    try {
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

      try {
        await DualSupabaseService.insert('cbq_club_attendance', payload);
      } catch (e) {
        console.warn('Lưu Supabase gặp lỗi, lưu dự phòng LocalStorage:', e.message);
      }

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
    const localKey = `cbq_sessions_${selectedClub.replace(/[/\\?%*:|"<>]/g, '_')}`;
    localStorage.setItem(localKey, JSON.stringify(updatedSessions));

    setActiveSessionId(newSession.id);
    setShowSessionModal(false);
    alert('Đã tạo Buổi sinh hoạt mới thành công!');
  };

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

  // AI Gemini Đánh giá chuyên cần
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

  const handleOpenZaloModal = (student, type = 'reminder') => {
    setZaloTargetStudent(student);
    setZaloMsgType(type);
    setCustomZaloPhone(student?.student_phone || student?.parent_phone || '');
    setCopiedZalo(false);
    setShowZaloModal(true);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const currentZaloMessage = useMemo(() => {
    if (!zaloTargetStudent) return '';
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
  }, [zaloTargetStudent, zaloMsgType, selectedClub, activeSession, aiResults]);

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

  const currentClubSubDisciplines = useMemo(() => {
    return getSubDisciplinesForClub(selectedClub);
  }, [selectedClub]);

  const filteredMembers = useMemo(() => {
    return clubMembers.filter(m => {
      const matchClass = classFilter === 'ALL' || m.student_class === classFilter;
      const matchSearch = !searchQuery.trim() || 
        (m.student_name && m.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.student_code && m.student_code.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchSubDiscipline = true;
      if (subDisciplineFilter !== 'ALL') {
        const responses = m.responses || {};
        matchSubDiscipline = Object.values(responses).some(val => {
          if (Array.isArray(val)) {
            return val.some(v => isOptionMatch(subDisciplineFilter, v));
          }
          return isOptionMatch(subDisciplineFilter, val);
        });
      }

      return matchClass && matchSearch && matchSubDiscipline;
    });
  }, [clubMembers, classFilter, searchQuery, subDisciplineFilter]);

  // 3. Tính toán tổng hợp Thi đua & Nề nếp theo từng Lớp cho buổi sinh hoạt hiện tại
  const getGradeLevel = (clsName) => {
    if (!clsName) return 'Khối 10';
    const clean = String(clsName).trim().toUpperCase();
    if (/^12|12[A-Z]/i.test(clean)) return 'Khối 12';
    if (/^11|11[A-Z]/i.test(clean)) return 'Khối 11';
    return 'Khối 10';
  };

  const classEmulationSummary = useMemo(() => {
    const map = {};
    clubMembers.forEach(m => {
      const cls = m.student_class || 'Khác';
      if (!map[cls]) {
        map[cls] = {
          className: cls,
          gradeLevel: getGradeLevel(cls),
          totalMembers: 0,
          presentStudents: [],
          absentKStudents: [],
          absentPStudents: [],
          lateStudents: []
        };
      }
      map[cls].totalMembers++;
      const st = attendanceRecords[m.student_code]?.status || 'K';
      if (st === '1') {
        map[cls].presentStudents.push(m);
      } else if (st === 'P') {
        map[cls].absentPStudents.push(m);
      } else if (st === 'L') {
        map[cls].lateStudents.push(m);
      } else {
        map[cls].absentKStudents.push(m);
      }
    });

    return Object.values(map).map(c => {
      const bonusScore = c.presentStudents.length * Number(syncBonusPerPresent || 0);
      const penaltyScore = c.absentKStudents.length * (-Math.abs(Number(syncPenaltyPerAbsent || 0)));
      const netScore = bonusScore + penaltyScore;
      return {
        ...c,
        bonusScore,
        penaltyScore,
        netScore
      };
    }).sort((a, b) => a.className.localeCompare(b.className));
  }, [clubMembers, attendanceRecords, syncBonusPerPresent, syncPenaltyPerAbsent]);

  const handleSyncEmulationToDatabase = async () => {
    if (!activeSession) {
      alert("Vui lòng chọn hoặc tạo một buổi sinh hoạt trước khi đồng bộ!");
      return;
    }
    setSyncingEmulation(true);
    setSyncSuccessMsg('');
    try {
      const logsToInsert = [];
      const sessionDate = activeSession.session_date || new Date().toISOString().slice(0, 10);
      const clubTitle = selectedClub === 'ALL' ? 'Các Câu Lạc Bộ' : selectedClub;

      classEmulationSummary.forEach(c => {
        // Ghi điểm cộng tham gia tích cực (nếu có học sinh tham gia)
        if (c.bonusScore > 0) {
          logsToInsert.push({
            week_number: Number(syncWeekNumber),
            log_date: sessionDate,
            student_class: c.className,
            grade_level: c.gradeLevel,
            criteria_title: `[CLB] Tham gia sinh hoạt CLB tích cực (+${c.bonusScore}đ)`,
            category: 'Hoạt động Câu Lạc Bộ',
            score_change: c.bonusScore,
            reason: `${c.presentStudents.length} học sinh tham gia sinh hoạt ${clubTitle} (Buổi ${activeSession.session_number})`,
            reason_note: `${c.presentStudents.length} học sinh tham gia sinh hoạt ${clubTitle} (Buổi ${activeSession.session_number})`,
            reporter_name: `BCN CLB - Buổi ${activeSession.session_number}`,
            status: 'approved'
          });
        }

        // Ghi điểm trừ vắng không phép (nếu có học sinh vắng K)
        if (c.penaltyScore < 0) {
          const absentNames = c.absentKStudents.map(s => `${s.student_name} (${s.student_code})`).join(', ');
          logsToInsert.push({
            week_number: Number(syncWeekNumber),
            log_date: sessionDate,
            student_class: c.className,
            grade_level: c.gradeLevel,
            criteria_title: `[CLB] Vắng sinh hoạt CLB không phép (${c.penaltyScore}đ)`,
            category: 'Hoạt động Câu Lạc Bộ',
            score_change: c.penaltyScore,
            reason: `Vắng không phép ${c.absentKStudents.length} em: ${absentNames}`,
            reason_note: `Vắng không phép ${c.absentKStudents.length} em: ${absentNames}`,
            reporter_name: `BCN CLB - Buổi ${activeSession.session_number}`,
            status: 'approved'
          });
        }
      });

      if (logsToInsert.length === 0) {
        alert("Không có dữ liệu điểm thưởng hoặc trừ để ghi nhận.");
        setSyncingEmulation(false);
        return;
      }

      // Xóa các log cũ của buổi này cùng tuần & category CLB nếu có để tránh trùng lặp
      const client = adminClient || supabase;
      await client.from('cbq_emulation_logs')
        .delete()
        .eq('week_number', Number(syncWeekNumber))
        .eq('category', 'Hoạt động Câu Lạc Bộ')
        .eq('log_date', sessionDate);

      const { error } = await client.from('cbq_emulation_logs').insert(logsToInsert);
      if (error) throw error;

      setSyncSuccessMsg(`🎉 Đồng bộ thành công ${logsToInsert.length} bản ghi thi đua cho ${classEmulationSummary.length} lớp học (Tuần ${syncWeekNumber})!`);
    } catch (err) {
      console.error('Error syncing emulation logs:', err);
      alert("Lỗi khi đồng bộ thi đua: " + err.message);
    } finally {
      setSyncingEmulation(false);
    }
  };

  const generateClassZaloMessage = (classData) => {
    const clubTitle = selectedClub === 'ALL' ? 'Câu Lạc Bộ' : selectedClub;
    const sessionNum = activeSession?.session_number || 1;
    const sessionDate = activeSession?.session_date || new Date().toISOString().slice(0, 10);
    const absentList = classData.absentKStudents.map((s, i) => `${i + 1}. ${s.student_name} (Mã HS: ${s.student_code})`).join('\n');

    return `📢 [TRƯỜNG THPT CAO BÁ QUÁT - BÁO CÁO ĐIỂM DANH CLB]\n` +
      `Kính gửi Thầy/Cô GVCN Lớp ${classData.className},\n` +
      `Ban Chủ nhiệm ${clubTitle} trân trọng gửi kết quả sinh hoạt Buổi ${sessionNum} (${sessionDate}):\n\n` +
      `📊 TỔNG KẾT NỀ NẾP & THI ĐUA:\n` +
      `- Tổng thành viên đăng ký: ${classData.totalMembers} học sinh\n` +
      `- Có mặt tham gia tích cực: ${classData.presentStudents.length} học sinh (Cộng +${classData.bonusScore}đ thi đua)\n` +
      `- Vắng không phép: ${classData.absentKStudents.length} học sinh (Trừ ${classData.penaltyScore}đ thi đua)\n` +
      `- Điểm thi đua CLB đóng góp: ${classData.netScore >= 0 ? `+${classData.netScore}đ` : `${classData.netScore}đ`}\n\n` +
      (classData.absentKStudents.length > 0 
        ? `⚠️ DANH SÁCH HỌC SINH VẮNG KHÔNG PHÉP:\n${absentList}\n\nKính đề nghị Thầy/Cô phối hợp cùng gia đình nhắc nhở các em đảm bảo chuyên cần rèn luyện theo quy chế trường.`
        : `🎉 TUYỆT VỜI: 100% học sinh lớp ${classData.className} tham gia sinh hoạt đầy đủ và tích cực!`
      ) +
      `\n\nTrân trọng cảm ơn Thầy/Cô!`;
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      
      {/* 1. HEADER & CHỌN ĐỢT ĐĂNG KÝ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎯</span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Hệ Thống Quản Lý & Điểm Danh CLB Thông Minh
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Dữ liệu đồng bộ trực tiếp từ form đăng ký học sinh • Theo dõi 16 buổi sinh hoạt • AI Đánh giá chuyên cần
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Chọn Đợt Đăng Ký CLB (Chỉ hiện khi có từ 2 đợt CLB trở lên) */}
          {clubCampaigns.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' }}>Đợt CLB:</label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #0284c7', fontSize: '13px', fontWeight: '700', color: '#0369a1', outline: 'none', backgroundColor: '#f0f9ff' }}
              >
                {clubCampaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', backgroundColor: '#f0f9ff', border: '1.5px solid #bae6fd', color: '#0369a1', fontSize: '13px', fontWeight: '700' }}>
              <span>🏷️</span>
              <span>{activeCampaign?.title || 'Đăng ký tham gia câu lạc bộ'}</span>
            </div>
          )}

          <button
            onClick={() => { setShowAIModal(true); runAIEvaluation(); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
            }}
          >
            <Sparkles size={16} /> 🤖 AI Đánh Giá
          </button>

          <button
            onClick={() => setShowEmulationSyncModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              backgroundColor: '#059669',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
            }}
          >
            <Award size={16} /> ⚡ Đồng Bộ Thi Đua Lớp
          </button>

          <button
            onClick={() => setShowQRScanner(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2,132,199,0.3)'
            }}
          >
            <QrCode size={16} /> Quét QR Check-in
          </button>
        </div>
      </div>

      {/* 2. THANH CHỌN CÂU LẠC BỘ (ĐỌC ĐỘNG TỪ DỮ LIỆU ĐĂNG KÝ THẬT KÈM SỐ LƯỢNG) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
            🏷️ Chọn Câu lạc bộ để theo dõi điểm danh (Số lượng thành viên thực tế):
          </span>
          {loadingRegs && <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold' }}>Đang nạp dữ liệu đăng ký...</span>}
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', flexWrap: 'wrap' }}>
          {availableClubOptions.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '8px' }}>
              Đợt đăng ký này chưa có câu hỏi lựa chọn câu lạc bộ nào.
            </div>
          ) : (
            availableClubOptions.map(club => {
              const isSelected = selectedClub === club.name;
              return (
                <button
                  key={club.name}
                  onClick={() => setSelectedClub(club.name)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#1d4ed8' : '#334155',
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{club.name}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    backgroundColor: isSelected ? '#2563eb' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : '#475569'
                  }}>
                    {club.count} HS
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 3. CHỌN BUỔI SINH HOẠT & THẺ THỐNG KÊ SĨ SỐ */}
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

      {/* 4. THANH TÌM KIẾM, LỌC LỚP VÀ NÚT ĐIỂM DANH NHANH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={`Tìm trong ${clubMembers.length} thành viên (Tên, Mã HS)...`}
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

          {/* LỌC THEO MÔN PHỤ (NẾU CLB CÓ DANH SÁCH MÔN PHỤ) */}
          {currentClubSubDisciplines.length > 0 && (
            <select
              value={subDisciplineFilter}
              onChange={(e) => setSubDisciplineFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1.5px solid #0284c7',
                backgroundColor: '#f0f9ff',
                color: '#0369a1',
                fontSize: '13px',
                fontWeight: '700',
                outline: 'none'
              }}
            >
              <option value="ALL">🎯 Tất cả môn phụ ({currentClubSubDisciplines.length} môn)</option>
              {currentClubSubDisciplines.map(sub => (
                <option key={sub.id} value={sub.name}>
                  {sub.icon} {sub.name} ({sub.coaches[0]})
                </option>
              ))}
            </select>
          )}
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
            onClick={() => setShowEmulationSyncModal(true)}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1.5px solid #059669',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={15} /> ⚡ Đồng Bộ Thi Đua
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

      {/* 5. BẢNG ĐIỂM DANH THÀNH VIÊN CHI TIẾT */}
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
                  Không tìm thấy thành viên nào phù hợp với bộ lọc ({selectedClub}).
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

      {/* 6. MODAL TẠO BUỔI SINH HOẠT MỚI */}
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

      {/* 7. MODAL QUÉT MÃ QR CHECK-IN */}
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
                placeholder="Nhập Mã HS (ví dụ: 54047046...)"
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

      {/* 8. MODAL AI ĐÁNH GIÁ CHUYÊN CẦN */}
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
                <p style={{ fontWeight: '700', color: '#6b21a8' }}>AI đang phân tích lịch sử tham gia của thành viên {selectedClub}...</p>
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#5b21b6', lineHeight: '1.6' }}>
                    🤖 <strong>Mô hình AI Gemini</strong> đã phân tích số buổi tham gia thực tế của <strong>{clubMembers.length} thành viên</strong> thuộc <strong>{selectedClub}</strong> để tự động xếp loại và gợi ý mức điểm cộng Hạnh kiểm cho GVCN.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(aiResults).slice(0, 8).map(([code, evalData]) => {
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

      {/* 9. MODAL GỬI TIN NHẮN ZALO */}
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

      {/* 10. MODAL ĐỒNG BỘ ĐIỂM THI ĐUA & NỀ NẾP LỚP CHỦ NHIỆM */}
      {showEmulationSyncModal && (
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
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                    Đồng Bộ Điểm Thi Đua & Nề Nếp Về Lớp Chủ Nhiệm
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Ghi nhận điểm cộng chuyên cần & trừ điểm vắng không phép từ buổi sinh hoạt {selectedClub === 'ALL' ? 'CLB' : selectedClub} (Buổi {activeSession?.session_number || 1})
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowEmulationSyncModal(false); setSyncSuccessMsg(''); }}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Cấu hình Tham số Đồng bộ */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Tuần Thi Đua:</label>
                <select
                  value={syncWeekNumber}
                  onChange={(e) => setSyncWeekNumber(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Tuần {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>Điểm cộng / 1 HS có mặt:</label>
                <input
                  type="number"
                  value={syncBonusPerPresent}
                  onChange={(e) => setSyncBonusPerPresent(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #86efac', marginTop: '4px', fontSize: '13px', fontWeight: '700', color: '#16a34a', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>Điểm trừ / 1 HS vắng không phép:</label>
                <input
                  type="number"
                  value={syncPenaltyPerAbsent}
                  onChange={(e) => setSyncPenaltyPerAbsent(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #fca5a5', marginTop: '4px', fontSize: '13px', fontWeight: '700', color: '#dc2626', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Thông báo thành công */}
            {syncSuccessMsg && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '12px 16px', borderRadius: '10px', border: '1px solid #a7f3d0', fontSize: '13.5px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#059669" /> {syncSuccessMsg}
              </div>
            )}

            {/* Bảng Xem Trước Phân Bổ Điểm Theo Từng Lớp */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#334155' }}>
                  📊 Bảng Phân Bổ Điểm Thi Đua & Nề Nếp Theo Từng Lớp ({classEmulationSummary.length} Lớp):
                </h4>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                      <th style={{ padding: '10px 12px' }}>Tên Lớp</th>
                      <th style={{ padding: '10px 12px' }}>Sĩ số CLB</th>
                      <th style={{ padding: '10px 12px', color: '#16a34a' }}>Có mặt (+)</th>
                      <th style={{ padding: '10px 12px', color: '#dc2626' }}>Vắng KP (-)</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800' }}>Điểm Thi Đua CLB</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Báo Cáo GVCN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classEmulationSummary.map(c => (
                      <tr key={c.className} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>{c.className}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{c.totalMembers} HS</td>
                        <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '700' }}>
                          {c.presentStudents.length} (+{c.bonusScore}đ)
                        </td>
                        <td style={{ padding: '10px 12px', color: c.absentKStudents.length > 0 ? '#dc2626' : '#94a3b8', fontWeight: '700' }}>
                          {c.absentKStudents.length} ({c.penaltyScore}đ)
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '800',
                            backgroundColor: c.netScore > 0 ? '#dcfce7' : (c.netScore < 0 ? '#fee2e2' : '#f1f5f9'),
                            color: c.netScore > 0 ? '#15803d' : (c.netScore < 0 ? '#b91c1c' : '#64748b')
                          }}>
                            {c.netScore > 0 ? `+${c.netScore}đ` : `${c.netScore}đ`}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => setPreviewClassZalo(c)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#f0f9ff',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Send size={12} /> Zalo GVCN
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nút hành động chính */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                onClick={() => { setShowEmulationSyncModal(false); setSyncSuccessMsg(''); }}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Đóng
              </button>

              <button
                onClick={handleSyncEmulationToDatabase}
                disabled={syncingEmulation}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
                }}
              >
                <Award size={16} /> {syncingEmulation ? 'Đang ghi nhận...' : '⚡ Xác Nhận Ghi Vào Sổ Thi Đua Toàn Trường'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL XEM TRƯỚC TIN NHẮN ZALO BÁO CÁO GVCN LỚP */}
      {previewClassZalo && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '540px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} color="#0068ff" /> Báo Cáo Chuyên Cần CLB Tới GVCN Lớp {previewClassZalo.className}
              </h3>
              <button onClick={() => setPreviewClassZalo(null)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Nội dung tin nhắn tự động:</label>
              <textarea
                rows={9}
                value={generateClassZaloMessage(previewClassZalo)}
                readOnly
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '12.5px', backgroundColor: '#f8fafc', color: '#1e293b', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateClassZaloMessage(previewClassZalo));
                  setCopiedClassZalo(true);
                  setTimeout(() => setCopiedClassZalo(false), 3000);
                }}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                {copiedClassZalo ? 'Đã sao chép!' : 'Sao chép nội dung'}
              </button>

              <button
                onClick={() => {
                  const msg = encodeURIComponent(generateClassZaloMessage(previewClassZalo));
                  navigator.clipboard.writeText(generateClassZaloMessage(previewClassZalo));
                  window.open(`https://chat.zalo.me/`, '_blank');
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0068ff',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={14} /> Mở Zalo Web Gửi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
