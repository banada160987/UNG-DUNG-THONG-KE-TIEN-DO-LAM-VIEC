import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Video, CheckCircle2, Clock, Users, AlertCircle, ArrowLeft, 
  Send, ExternalLink, ShieldCheck, Check, MessageSquare, AlertTriangle,
  Lock, Unlock, RefreshCw, UserCheck, ShieldAlert, Zap, Search, 
  Sparkles, Award, Printer, CheckCheck, Filter, FileText, ChevronRight
} from 'lucide-react';
import { OnlineMeetingService, DEFAULT_DEPARTMENTS } from '../services/onlineMeetingService';

const ABSENT_REASONS = [
  'Nghỉ ốm / Khám bệnh',
  'Đi công tác theo phân công của Sở / Trường',
  'Bận dạy bồi dưỡng HSG / Coi thi kỳ thi',
  'Việc riêng gia đình có đơn xin phép BGH',
  'Trực trường / Nhiệm vụ đột xuất',
  'Lý do khác'
];

const QUICK_NOTES = [
  'Tổ dự họp đầy đủ 100%, đúng giờ.',
  'Tổ có Đ/c vắng có phép đã báo cáo trước với BGH.',
  'Tổ nhất trí cao với các nội dung triển khai của nhà trường.'
];

// Hàm lấy màu gradient sang trọng dựa theo tên giáo viên
const getAvatarColor = (name) => {
  const colors = [
    'linear-gradient(135deg, #0284c7, #0369a1)',
    'linear-gradient(135deg, #16a34a, #15803d)',
    'linear-gradient(135deg, #d97706, #b45309)',
    'linear-gradient(135deg, #7c3aed, #6d28d9)',
    'linear-gradient(135deg, #e11d48, #be123c)',
    'linear-gradient(135deg, #0d9488, #0f766e)',
    'linear-gradient(135deg, #4f46e5, #3730a3)'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Hàm lấy 2 chữ cái viết tắt của tên
const getInitials = (name) => {
  if (!name) return 'GV';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function PublicMeetingAttendance() {
  const [searchParams] = useSearchParams();
  const meetingIdParam = searchParams.get('id');
  const codeParam = searchParams.get('code');

  const [activeTab, setActiveTab] = useState('teacher'); // 'teacher' | 'ttcm'
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(meetingIdParam || '');
  const [loading, setLoading] = useState(true);

  // Danh mục dữ liệu
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [staffList, setStaffList] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [deptReports, setDeptReports] = useState([]);

  // Form Giáo viên điểm danh
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [checkinOtp, setCheckinOtp] = useState(codeParam || '');
  const [selectedPollAnswer, setSelectedPollAnswer] = useState('');
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [checkinSuccessData, setCheckinSuccessData] = useState(null);
  const [checkinError, setCheckinError] = useState('');
  const [savedTeacherInfo, setSavedTeacherInfo] = useState(null);

  // Tự động điền mã khi quét QR có param ?code=...
  useEffect(() => {
    if (codeParam) {
      setCheckinOtp(codeParam);
    }
  }, [codeParam]);

  // Form TTCM báo cáo sĩ số
  const [ttcmDept, setTtcmDept] = useState('');
  const [ttcmReporterName, setTtcmReporterName] = useState('');
  const [ttcmMemberStatuses, setTtcmMemberStatuses] = useState({}); // { [staffName]: { status: 'PRESENT'|'EXCUSED'|'UNEXCUSED', reason: '' } }
  const [ttcmNote, setTtcmNote] = useState('');
  const [submittingTtcm, setSubmittingTtcm] = useState(false);
  const [ttcmSuccessMessage, setTtcmSuccessMessage] = useState('');

  // Bộ công cụ Pro cho TTCM: Tìm kiếm, Lọc, Làm mới tức thì
  const [ttcmSearchQuery, setTtcmSearchQuery] = useState('');
  const [ttcmFilterTab, setTtcmFilterTab] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ABSENT'
  const [refreshingManual, setRefreshingManual] = useState(false);
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString('vi-VN'));

  // Quản lý khóa bảo vệ báo cáo tổ và chống Polling ghi đè
  const [isEditingSubmittedDept, setIsEditingSubmittedDept] = useState(false);
  const userModifiedStaffRef = useRef(new Set());

  // Đồng hồ chạy live mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMeetingId) {
      loadMeetingData(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  // Tự động nhận diện nếu giáo viên đã đăng nhập tài khoản trước đó
  useEffect(() => {
    const savedTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (savedTeacherStr) {
      try {
        const t = JSON.parse(savedTeacherStr);
        if (t.department) {
          setSelectedDept(t.department);
          setTtcmDept(t.department);
        }
        if (t.name) {
          setSelectedStaffName(t.name);
          setTtcmReporterName(t.name);
        }
      } catch (e) {}
    }
  }, []);

  // Tự động đồng bộ trạng thái cuộc họp & danh sách điểm danh (chỉ chạy khi tab hiển thị, chống quá tải)
  useEffect(() => {
    const doSync = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const refreshedMeetings = await OnlineMeetingService.getMeetings();
        setMeetings(refreshedMeetings);
        if (selectedMeetingId) {
          loadMeetingData(selectedMeetingId);
        }
      } catch (e) {
        // im lặng nếu mất mạng tạm thời
      }
    };

    const timer = setInterval(doSync, 20000);
    const handleVis = () => {
      if (!document.hidden) doSync();
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [selectedMeetingId]);

  async function loadData() {
    setLoading(true);
    try {
      const [allMeetings, { departments: depts, staff }] = await Promise.all([
        OnlineMeetingService.getMeetings(),
        OnlineMeetingService.getStaffAndDepartments()
      ]);

      setMeetings(allMeetings);
      setDepartments(depts);
      setStaffList(staff);

      if (depts.length > 0 && !selectedDept) {
        setSelectedDept(depts[0]);
        setTtcmDept(depts[0]);
      }

      // XÁC ĐỊNH PHIÊN HỌP PHÙ HỢP NHẤT TỰ ĐỘNG
      let targetId = null;

      // 1. Khớp theo ID truyền trên URL (?id=...)
      if (meetingIdParam) {
        const foundById = allMeetings.find(m => m.id === meetingIdParam);
        if (foundById) {
          targetId = foundById.id;
        } else {
          // Thử tìm nạp trực tiếp cuộc họp từ Cloud Supabase theo ID này
          const directMeeting = await OnlineMeetingService.getMeetingById(meetingIdParam);
          if (directMeeting) {
            allMeetings.unshift(directMeeting);
            setMeetings([...allMeetings]);
            targetId = directMeeting.id;
          }
        }
      }

      // 2. Nếu chưa có targetId, thử tìm theo mã OTP trên URL (?code=...)
      if (!targetId && codeParam) {
        const foundByCode = allMeetings.find(m => String(m.checkin_code || '').trim() === codeParam.trim());
        if (foundByCode) {
          targetId = foundByCode.id;
        }
      }

      // 3. Nếu vẫn chưa có targetId, ưu tiên phiên họp ĐANG MỞ ĐIỂM DANH (Đang điều hành trực tiếp)
      if (!targetId) {
        const activeMeeting = allMeetings.find(m => m.is_checkin_open);
        if (activeMeeting) {
          targetId = activeMeeting.id;
        }
      }

      // 4. Mặc định chọn phiên họp mới nhất
      if (!targetId && allMeetings.length > 0) {
        targetId = allMeetings[0].id;
      }

      if (targetId) {
        setSelectedMeetingId(targetId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMeetingData(meetingId) {
    try {
      const [atts, reps] = await Promise.all([
        OnlineMeetingService.getAttendances(meetingId),
        OnlineMeetingService.getDepartmentReports(meetingId)
      ]);
      setAttendances(atts);
      setDeptReports(reps);
    } catch (e) {
      console.error(e);
    }
  }

  const currentMeeting = useMemo(() => {
    return meetings.find(m => m.id === selectedMeetingId) || null;
  }, [meetings, selectedMeetingId]);

  // Danh sách giáo viên theo tổ được chọn
  const deptStaffMembers = useMemo(() => {
    if (!selectedDept) return [];
    return staffList.filter(s => s.department === selectedDept);
  }, [staffList, selectedDept]);

  // Danh sách giáo viên cho TTCM
  const ttcmDeptStaffMembers = useMemo(() => {
    if (!ttcmDept) return [];
    return staffList.filter(s => s.department === ttcmDept);
  }, [staffList, ttcmDept]);

  // Báo cáo sĩ số hiện có của Tổ đang chọn (nếu đã nộp trước đó)
  const currentDeptReport = useMemo(() => {
    if (!selectedMeetingId || !ttcmDept) return null;
    return deptReports.find(
      r => r.meeting_id === selectedMeetingId && r.department.toLowerCase().trim() === ttcmDept.toLowerCase().trim()
    );
  }, [deptReports, selectedMeetingId, ttcmDept]);

  // Khi đổi Tổ hoặc Phiên họp: reset trạng thái mở khóa và bộ nhớ sửa đổi
  useEffect(() => {
    userModifiedStaffRef.current.clear();
    setIsEditingSubmittedDept(false);
    setTtcmSuccessMessage('');
  }, [ttcmDept, selectedMeetingId]);

  // Tự động điền thông tin người báo cáo và ghi chú nếu tổ đã có báo cáo
  useEffect(() => {
    if (currentDeptReport) {
      if (currentDeptReport.reporter_name) {
        setTtcmReporterName(currentDeptReport.reporter_name);
      }
      if (currentDeptReport.note) {
        setTtcmNote(currentDeptReport.note);
      }
    }
  }, [currentDeptReport]);

  // Khởi tạo trạng thái thành viên cho TTCM (CHỐNG POLLING 8 GIÂY GHI ĐÈ MẤT TRẠNG THÁI)
  useEffect(() => {
    if (ttcmDeptStaffMembers.length > 0) {
      setTtcmMemberStatuses(prev => {
        const next = { ...prev };
        ttcmDeptStaffMembers.forEach(s => {
          // BẢO VỆ: Nếu TTCM đã chủ động bấm sửa giáo viên này trong phiên, Polling ngầm KHÔNG ĐƯỢC PHÉP ghi đè lại!
          if (userModifiedStaffRef.current.has(s.name)) {
            return;
          }

          const existingAtt = attendances.find(a => a.staff_name.toLowerCase().trim() === s.name.toLowerCase().trim());
          if (existingAtt) {
            next[s.name] = {
              status: existingAtt.status || 'PRESENT',
              reason: existingAtt.note || ''
            };
          } else if (!next[s.name]) {
            next[s.name] = {
              status: 'PRESENT',
              reason: ''
            };
          }
        });
        return next;
      });
    }
  }, [ttcmDeptStaffMembers, attendances]);

  // Thông tin điểm danh của giáo viên đang được chọn ở Tab 1
  const selectedStaffAttendance = useMemo(() => {
    if (!selectedStaffName) return null;
    return attendances.find(a => a.staff_name.toLowerCase().trim() === selectedStaffName.toLowerCase().trim());
  }, [attendances, selectedStaffName]);

  // Kiểm tra xem giáo viên có bị TTCM / BGH khóa vì báo vắng thực tế không
  const isBlockedByTtcm = Boolean(
    selectedStaffAttendance?.verified_by_ttcm && selectedStaffAttendance?.status !== 'PRESENT'
  );

  // =========================================================================
  // XỬ LÝ ĐIỂM DANH CÁ NHÂN CỦA GIÁO VIÊN
  // =========================================================================
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setCheckinError('');
    if (!selectedMeetingId) return setCheckinError('Vui lòng chọn phiên họp!');
    if (!selectedDept) return setCheckinError('Vui lòng chọn Tổ chuyên môn!');
    if (!selectedStaffName) return setCheckinError('Vui lòng chọn Họ và Tên của bạn!');
    if (!checkinOtp.trim()) return setCheckinError('Vui lòng nhập Mã số phiên họp (OTP)!');

    if (isBlockedByTtcm) {
      return setCheckinError(
        `Tổ trưởng chuyên môn (${selectedStaffAttendance?.verified_by_name || 'TTCM'}) đã xác nhận bạn VẮNG MẶT tại hội trường! Bạn không thể tự quét mã để chuyển thành Có mặt.`
      );
    }

    setSubmittingCheckin(true);
    try {
      const staffObj = staffList.find(s => s.name === selectedStaffName);
      const res = await OnlineMeetingService.submitTeacherCheckin({
        meetingId: selectedMeetingId,
        staffId: staffObj?.id,
        staffName: selectedStaffName,
        department: selectedDept,
        title: staffObj?.title || 'Giáo viên',
        checkinCode: checkinOtp,
        pollAnswer: selectedPollAnswer,
        deviceInfo: navigator.userAgent
      });

      if (!res.success) {
        setCheckinError(res.message);
      } else {
        if (res.meeting && res.meeting.id !== selectedMeetingId) {
          setSelectedMeetingId(res.meeting.id);
        }
        setCheckinSuccessData(res.attendance);
        try {
          localStorage.setItem('cbq_current_teacher', JSON.stringify({
            name: selectedStaffName,
            department: selectedDept
          }));
          setSavedTeacherInfo({ name: selectedStaffName, department: selectedDept });
        } catch (e) {}
        await loadMeetingData(res.meeting?.id || selectedMeetingId);
      }
    } catch (err) {
      setCheckinError('Có lỗi xảy ra: ' + err.message);
    } finally {
      setSubmittingCheckin(false);
    }
  };

  // =========================================================================
  // XỬ LÝ BÁO CÁO SĨ SỐ CỦA TTCM
  // =========================================================================
  const handleTtcmStatusChange = (staffName, field, value) => {
    // Đánh dấu giáo viên này đã được TTCM chủ động sửa đổi => ngăn Polling ghi đè
    userModifiedStaffRef.current.add(staffName);
    setTtcmMemberStatuses(prev => ({
      ...prev,
      [staffName]: {
        ...prev[staffName],
        [field]: value
      }
    }));
  };

  const handleTtcmSubmit = async (e) => {
    e.preventDefault();
    setTtcmSuccessMessage('');
    if (!selectedMeetingId) return alert('Vui lòng chọn phiên họp!');
    if (!ttcmDept) return alert('Vui lòng chọn Tổ chuyên môn!');
    if (!ttcmReporterName.trim()) return alert('Vui lòng nhập Họ tên Tổ trưởng chuyên môn!');

    setSubmittingTtcm(true);
    try {
      const members = ttcmDeptStaffMembers;
      let presentCount = 0;
      let excusedCount = 0;
      let unexcusedCount = 0;
      const absentDetails = [];
      const verifiedAttendances = [];

      members.forEach(s => {
        const item = ttcmMemberStatuses[s.name] || { status: 'PRESENT', reason: '' };
        if (item.status === 'PRESENT') {
          presentCount++;
        } else if (item.status === 'EXCUSED') {
          excusedCount++;
          absentDetails.push({ name: s.name, reason: item.reason || 'Có phép' });
        } else {
          unexcusedCount++;
          absentDetails.push({ name: s.name, reason: item.reason || 'Không phép' });
        }

        verifiedAttendances.push({
          staff_id: s.id,
          staff_name: s.name,
          title: s.title || 'Giáo viên',
          status: item.status,
          note: item.reason || (item.status === 'PRESENT' ? 'TTCM xác nhận có mặt' : 'TTCM báo vắng')
        });
      });

      const res = await OnlineMeetingService.submitDepartmentReport({
        meetingId: selectedMeetingId,
        department: ttcmDept,
        reporterName: ttcmReporterName,
        reporterRole: 'Tổ trưởng chuyên môn',
        totalMembers: members.length,
        presentCount,
        excusedCount,
        unexcusedCount,
        absentDetails,
        note: ttcmNote,
        verifiedAttendances,
        forceOverride: isEditingSubmittedDept || !!currentDeptReport
      });

      if (res.success) {
        userModifiedStaffRef.current.clear();
        setIsEditingSubmittedDept(false);
        setTtcmSuccessMessage(`Đã gửi Báo cáo sĩ số Tổ ${ttcmDept} thành công! Lãnh đạo nhà trường đã nhận được dữ liệu.`);
        await loadMeetingData(selectedMeetingId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Có lỗi xảy ra: ' + err.message);
    } finally {
      setSubmittingTtcm(false);
    }
  };

  // Làm mới dữ liệu tức thì
  const handleManualRefresh = async () => {
    setRefreshingManual(true);
    try {
      if (selectedMeetingId) {
        await loadMeetingData(selectedMeetingId);
      }
      const refreshedMeetings = await OnlineMeetingService.getMeetings();
      setMeetings(refreshedMeetings);
    } catch (e) {
      console.warn('Lỗi làm mới:', e);
    } finally {
      setTimeout(() => setRefreshingManual(false), 500);
    }
  };

  // Hành động thần tốc cho TTCM: Đánh dấu toàn bộ tổ Có Mặt
  const handleMarkAllPresent = () => {
    if (ttcmDeptStaffMembers.length === 0) return;
    setTtcmMemberStatuses(prev => {
      const next = { ...prev };
      ttcmDeptStaffMembers.forEach(s => {
        userModifiedStaffRef.current.add(s.name);
        next[s.name] = {
          status: 'PRESENT',
          reason: ''
        };
      });
      return next;
    });
  };

  // Thống kê sĩ số động của tổ đang chọn
  const ttcmStats = useMemo(() => {
    const total = ttcmDeptStaffMembers.length;
    let present = 0;
    let excused = 0;
    let unexcused = 0;

    ttcmDeptStaffMembers.forEach(s => {
      const item = ttcmMemberStatuses[s.name] || { status: 'PRESENT' };
      if (item.status === 'PRESENT') {
        present++;
      } else if (item.status === 'EXCUSED') {
        excused++;
      } else {
        unexcused++;
      }
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, excused, unexcused, rate };
  }, [ttcmDeptStaffMembers, ttcmMemberStatuses]);

  // Danh sách thành viên tổ sau khi lọc và tìm kiếm
  const filteredTtcmMembers = useMemo(() => {
    return ttcmDeptStaffMembers.filter(s => {
      if (ttcmSearchQuery.trim()) {
        const query = ttcmSearchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(query);
        const matchTitle = (s.title || '').toLowerCase().includes(query);
        if (!matchName && !matchTitle) return false;
      }

      const item = ttcmMemberStatuses[s.name] || { status: 'PRESENT' };
      if (ttcmFilterTab === 'PRESENT') {
        return item.status === 'PRESENT';
      }
      if (ttcmFilterTab === 'ABSENT') {
        return item.status === 'EXCUSED' || item.status === 'UNEXCUSED';
      }
      return true;
    });
  }, [ttcmDeptStaffMembers, ttcmSearchQuery, ttcmFilterTab, ttcmMemberStatuses]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '16px 12px 60px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG: QUAY LẠI & ĐỒNG HỒ LIVE */}
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0369a1', textDecoration: 'none', fontWeight: 'bold', fontSize: '13.5px' }}>
            <ArrowLeft size={16} /> Trang chủ Cổng tiện ích
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#475569', backgroundColor: '#e2e8f0', padding: '3px 10px', borderRadius: '16px' }}>
              <Clock size={13} color="#0284c7" /> {liveClock}
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshingManual}
              title="Làm mới dữ liệu tức thì"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', backgroundColor: '#fff', border: '1px solid #cbd5e1',
                borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', color: '#0369a1',
                cursor: refreshingManual ? 'wait' : 'pointer'
              }}
            >
              <RefreshCw size={13} className={refreshingManual ? 'animate-spin' : ''} style={{ animation: refreshingManual ? 'spin 1s linear infinite' : 'none' }} />
              {refreshingManual ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {/* HEADER CHÍNH CỦA CỔNG ĐIỂM DANH */}
        <div style={{
          backgroundColor: '#fff', borderRadius: '18px', padding: '22px 20px',
          boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e2e8f0', marginBottom: '18px', textAlign: 'center', position: 'relative'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
            color: '#0369a1', padding: '5px 14px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '8px'
          }}>
            <Video size={15} /> TRƯỜNG THPT CAO BÁ QUÁT - QUỐC OAI
          </div>
          
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 10px', letterSpacing: '-0.3px' }}>
            Cổng Điểm Danh Hội Nghị & Báo Cáo Sĩ Số Điện Tử
          </h1>

          {/* CHỌN PHIÊN HỌP */}
          <div style={{ display: 'inline-block', maxWidth: '100%', marginTop: '4px' }}>
            <select
              value={selectedMeetingId}
              onChange={e => {
                setSelectedMeetingId(e.target.value);
                setCheckinSuccessData(null);
                setCheckinError('');
              }}
              style={{
                padding: '9px 16px', borderRadius: '10px', border: '2px solid #0284c7',
                fontSize: '14.5px', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#f0f9ff',
                cursor: 'pointer', maxWidth: '100%', outline: 'none'
              }}
            >
              {meetings.map(m => (
                <option key={m.id} value={m.id}>
                  {m.is_checkin_open ? '🟢 [ĐANG ĐIỀU HÀNH] ' : ''}{m.title} ({new Date(m.meeting_date).toLocaleDateString('vi-VN')})
                </option>
              ))}
            </select>
          </div>

          {currentMeeting && (
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                backgroundColor: currentMeeting.is_checkin_open ? '#dcfce7' : '#fee2e2',
                color: currentMeeting.is_checkin_open ? '#166534' : '#991b1b',
                padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: currentMeeting.is_checkin_open ? '#22c55e' : '#ef4444' }}></span>
                {currentMeeting.is_checkin_open ? 'Đang Mở Điểm Danh' : 'Đã Đóng Điểm Danh'}
              </span>

              <span style={{
                backgroundColor: currentMeeting.meeting_format === 'OFFLINE' ? '#dbeafe' : (currentMeeting.meeting_format === 'ONLINE' ? '#f3e8ff' : '#cffafe'),
                color: currentMeeting.meeting_format === 'OFFLINE' ? '#1d4ed8' : (currentMeeting.meeting_format === 'ONLINE' ? '#7e22ce' : '#0e7490'),
                padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
              }}>
                {currentMeeting.meeting_format === 'OFFLINE' ? '🏢 Họp Trực Tiếp' : (currentMeeting.meeting_format === 'ONLINE' ? '💻 Họp Trực Tuyến' : '🌐 Họp Hỗn Hợp')}
              </span>

              {currentMeeting.location && (
                <span style={{
                  backgroundColor: '#f1f5f9', color: '#334155',
                  padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600'
                }}>
                  📍 {currentMeeting.location}
                </span>
              )}

              {currentMeeting.meeting_link && (
                <a
                  href={currentMeeting.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '12px', color: '#0284c7', fontWeight: 'bold', textDecoration: 'none',
                    backgroundColor: '#e0f2fe', padding: '4px 10px', borderRadius: '12px'
                  }}
                >
                  <ExternalLink size={13} /> Vào phòng Meet / Zoom
                </a>
              )}
            </div>
          )}

          {/* BANNER CHÀO MỪNG NẾU ĐÃ LƯU TÊN */}
          {savedTeacherInfo && (
            <div style={{
              marginTop: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '10px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center',
              gap: '6px', fontSize: '12.5px', color: '#475569'
            }}>
              <UserCheck size={15} color="#16a34a" />
              <span>Chào mừng Thầy/Cô <strong>{savedTeacherInfo.name}</strong> (Tổ {savedTeacherInfo.department})</span>
            </div>
          )}
        </div>

        {/* THÔNG BÁO LÃNH ĐẠO YÊU CẦU TTCM BÁO CÁO (NỔI BẬT) */}
        {currentMeeting?.ttcm_reporting_open && (
          <div style={{
            backgroundColor: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '16px',
            padding: '16px 20px', marginBottom: '18px', display: 'flex', alignItems: 'center',
            gap: '14px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
          }}>
            <AlertTriangle size={30} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                📢 BAN GIÁM HIỆU ĐANG YÊU CẦU BÁO CÁO SĨ SỐ TỔ
              </div>
              <div style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
                Kính đề nghị các Thầy/Cô Tổ trưởng (TTCM) bấm vào Tab <strong>"2. Tổ Trưởng Báo Cáo Sĩ Số"</strong> bên dưới để kiểm diện và gửi báo cáo sĩ số tổ gấp cho BGH!
              </div>
            </div>
          </div>
        )}

        {/* CHUYỂN ĐỔI TAB: GIÁO VIÊN vs TTCM */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
          backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '14px', marginBottom: '18px'
        }}>
          <button
            onClick={() => setActiveTab('teacher')}
            style={{
              padding: '12px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
              backgroundColor: activeTab === 'teacher' ? '#fff' : 'transparent',
              color: activeTab === 'teacher' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'teacher' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
            }}
          >
            <CheckCircle2 size={18} /> 1. Giáo Viên Tự Điểm Danh (OTP)
          </button>

          <button
            onClick={() => setActiveTab('ttcm')}
            style={{
              padding: '12px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
              backgroundColor: activeTab === 'ttcm' ? '#fff' : 'transparent',
              color: activeTab === 'ttcm' ? '#d97706' : '#64748b',
              boxShadow: activeTab === 'ttcm' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
            }}
          >
            <Users size={18} /> 2. Tổ Trưởng (TTCM) Báo Cáo Sĩ Số
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: FORM DÀNH CHO GIÁO VIÊN TỰ ĐIỂM DANH                              */}
        {/* ========================================================================= */}
        {activeTab === 'teacher' && (
          <div style={{
            backgroundColor: '#fff', borderRadius: '18px', padding: '24px',
            boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0'
          }}>
            {checkinSuccessData ? (
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                {/* THẺ ĐẠI BIỂU DỰ HỌP ĐIỆN TỬ (DIGITAL ATTENDANCE PASS) */}
                <div style={{
                  maxWidth: '460px',
                  margin: '0 auto 20px',
                  background: 'linear-gradient(145deg, #ffffff, #f0fdf4)',
                  borderRadius: '20px',
                  border: '2px solid #86efac',
                  boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {/* DẢI HEADER THẺ */}
                  <div style={{
                    background: 'linear-gradient(135deg, #15803d, #166534)',
                    color: '#fff',
                    padding: '16px 20px',
                    textAlign: 'center',
                    borderBottom: '3px solid #facc15'
                  }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbf7d0', fontWeight: 'bold' }}>
                      TRƯỜNG THPT CAO BÁ QUÁT - QUỐC OAI
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '0.5px', marginTop: '3px' }}>
                      THẺ ĐẠI BIỂU DỰ HỌP ĐIỆN TỬ
                    </div>
                    <div style={{ display: 'inline-block', backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', marginTop: '6px', fontWeight: '600' }}>
                      NĂM HỌC 2025 - 2026 • ĐÃ XÁC THỰC HIỆN DIỆN
                    </div>
                  </div>

                  {/* THÂN THẺ */}
                  <div style={{ padding: '24px 20px 20px' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e, #15803d)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)'
                    }}>
                      <CheckCircle2 size={36} />
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#15803d', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      ĐẠI BIỂU ĐÃ CÓ MẶT TẠI HỘI TRƯỜNG
                    </div>

                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px' }}>
                      {checkinSuccessData.staff_name}
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0369a1', marginBottom: '16px' }}>
                      {checkinSuccessData.title || 'Giáo viên'} • Tổ {checkinSuccessData.department}
                    </div>

                    {/* BẢNG CHI TIẾT */}
                    <div style={{
                      backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                      padding: '12px 14px', textAlign: 'left', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Phiên họp:</span>
                        <span style={{ fontWeight: 'bold', color: '#0f172a', textAlign: 'right', maxWidth: '65%' }}>
                          {currentMeeting?.title || 'Cuộc họp Hội đồng'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Thời gian ghi nhận:</span>
                        <span style={{ fontWeight: 'bold', color: '#15803d' }}>
                          {new Date(checkinSuccessData.checkin_time).toLocaleTimeString('vi-VN')} ({new Date(checkinSuccessData.checkin_time).toLocaleDateString('vi-VN')})
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: checkinSuccessData.poll_answer ? '1px dashed #e2e8f0' : 'none', paddingBottom: checkinSuccessData.poll_answer ? '6px' : '0', marginBottom: checkinSuccessData.poll_answer ? '6px' : '0' }}>
                        <span style={{ color: '#64748b' }}>Hình thức:</span>
                        <span style={{ fontWeight: 'bold', color: '#0284c7' }}>
                          {currentMeeting?.meeting_format === 'OFFLINE' ? '🏢 Trực tiếp tại Hội trường' : (currentMeeting?.meeting_format === 'ONLINE' ? '💻 Trực tuyến' : '🌐 Hỗn hợp')}
                        </span>
                      </div>
                      {checkinSuccessData.poll_answer && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Biểu quyết:</span>
                          <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{checkinSuccessData.poll_answer}</span>
                        </div>
                      )}
                    </div>

                    {/* DẤU MỘC ĐIỆN TỬ */}
                    <div style={{
                      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      border: '2px dashed #16a34a', borderRadius: '10px', padding: '6px 16px', backgroundColor: '#f0fdf4',
                      color: '#15803d', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={15} /> TRƯỜNG THPT CAO BÁ QUÁT
                      </div>
                      <div style={{ color: '#166534', marginTop: '2px', fontSize: '10px' }}>
                        MÃ XÁC THỰC: CBQ-ATT-{(checkinSuccessData.id || '').substring(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HÀNG NÚT BẤM TIỆN ÍCH */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '10px 18px', backgroundColor: '#0284c7', color: '#fff',
                      borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer'
                    }}
                  >
                    <Printer size={16} /> In / Chụp lưu thẻ
                  </button>

                  <button
                    onClick={() => {
                      setCheckinSuccessData(null);
                      setCheckinOtp('');
                    }}
                    style={{
                      padding: '10px 18px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1',
                      borderRadius: '8px', color: '#475569', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer'
                    }}
                  >
                    Điểm danh cho giáo viên khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTeacherSubmit}>
                {checkinError && (
                  <div style={{
                    backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 14px',
                    borderRadius: '10px', fontSize: '13.5px', marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #fecdd3'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} /> {checkinError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* BƯỚC 1: CHỌN TỔ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                      1. Chọn Tổ chuyên môn / Đơn vị của bạn *
                    </label>
                    <select
                      value={selectedDept}
                      onChange={e => {
                        setSelectedDept(e.target.value);
                        setSelectedStaffName('');
                      }}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '10px',
                        border: '1px solid #cbd5e1', fontSize: '14.5px', fontWeight: 'bold',
                        color: '#0f172a', backgroundColor: '#f8fafc'
                      }}
                    >
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* BƯỚC 2: CHỌN TÊN */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                      2. Chọn Họ và Tên của bạn *
                    </label>
                    <select
                      value={selectedStaffName}
                      onChange={e => setSelectedStaffName(e.target.value)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '10px',
                        border: '1px solid #cbd5e1', fontSize: '14.5px', fontWeight: 'bold',
                        color: '#0f172a', backgroundColor: '#f8fafc'
                      }}
                    >
                      <option value="">-- Bấm vào đây để chọn tên bạn trong danh sách --</option>
                      {deptStaffMembers.map(s => (
                        <option key={s.id || s.name} value={s.name}>
                          {s.name} ({s.title || 'Giáo viên'})
                        </option>
                      ))}
                    </select>
                    {deptStaffMembers.length === 0 && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        * Chưa có danh sách cán bộ của tổ này trên hệ thống, thầy cô có thể tự nhập tên bên dưới nếu cần.
                      </div>
                    )}

                    {/* CẢNH BÁO NẾU ĐÃ BỊ TTCM BÁO VẮNG */}
                    {isBlockedByTtcm && (
                      <div style={{
                        backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px',
                        padding: '14px 16px', marginTop: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start'
                      }}>
                        <ShieldAlert size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '13px', color: '#991b1b', lineHeight: '1.5' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                            ⚠️ BẠN ĐÃ ĐƯỢC TỔ TRƯỞNG CHUYÊN MÔN GHI NHẬN VẮNG MẶT
                          </div>
                          <div>
                            Tổ trưởng <strong>{selectedStaffAttendance.verified_by_name || 'TTCM'}</strong> đã kiểm diện thực tế tại hội trường và báo cáo: 
                            <strong style={{ color: '#b91c1c' }}> {selectedStaffAttendance.status === 'EXCUSED' ? 'Vắng có phép' : 'Vắng không phép'}</strong>
                            {selectedStaffAttendance.note && <span> (Lý do: <em>{selectedStaffAttendance.note}</em>)</span>}.
                          </div>
                          <div style={{ marginTop: '6px', fontStyle: 'italic', color: '#7f1d1d' }}>
                            * Hệ thống tạm khóa tính năng tự điểm danh để tránh điểm danh khống từ xa. Nếu Thầy/Cô vừa đến hội trường, vui lòng gặp trực tiếp TTCM hoặc Thư ký để được kiểm diện lại!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BƯỚC 3: NHẬP MÃ OTP */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>
                        3. Mã số phiên họp (Mã OTP 6 chữ số) *
                      </label>
                      {codeParam && (
                        <span style={{
                          fontSize: '11.5px', fontWeight: 'bold', backgroundColor: '#dcfce7',
                          color: '#166534', padding: '2px 8px', borderRadius: '10px',
                          display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          ✨ Đã quét mã QR tự động điền sẵn mã!
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      disabled={isBlockedByTtcm}
                      placeholder="Nhập 6 số (Ví dụ: 839201)"
                      value={checkinOtp}
                      onChange={e => setCheckinOtp(e.target.value)}
                      style={{
                        width: '100%', padding: '14px', borderRadius: '10px',
                        border: '2px solid #0284c7', fontSize: '22px', fontWeight: '900',
                        color: '#0284c7', letterSpacing: '4px', textAlign: 'center', backgroundColor: isBlockedByTtcm ? '#f1f5f9' : '#f0f9ff'
                      }}
                    />
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      * Xem mã số trên màn hình máy chiếu Hội trường, màn hình Meet/Zoom hoặc quét mã QR.
                    </div>
                  </div>

                  {/* BƯỚC 4: CÂU HỎI BIỂU QUYẾT (NẾU CÓ) */}
                  {currentMeeting?.poll_question && (
                    <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '8px' }}>
                        4. Ý kiến biểu quyết nhanh:
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>
                        "{currentMeeting.poll_question}"
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(currentMeeting.poll_options || ['Nhất trí 100%', 'Có ý kiến đề xuất khác']).map(opt => (
                          <label key={opt} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px',
                            borderRadius: '8px', backgroundColor: '#fff', border: selectedPollAnswer === opt ? '2px solid #16a34a' : '1px solid #dcfce7',
                            cursor: 'pointer', fontWeight: selectedPollAnswer === opt ? 'bold' : 'normal'
                          }}>
                            <input
                              type="radio"
                              name="poll"
                              value={opt}
                              checked={selectedPollAnswer === opt}
                              onChange={e => setSelectedPollAnswer(e.target.value)}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NÚT XÁC NHẬN */}
                  <button
                    type="submit"
                    disabled={submittingCheckin || isBlockedByTtcm}
                    style={{
                      padding: '14px 20px',
                      backgroundColor: isBlockedByTtcm ? '#94a3b8' : '#0284c7',
                      color: '#fff',
                      border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900',
                      cursor: (submittingCheckin || isBlockedByTtcm) ? 'not-allowed' : 'pointer',
                      marginTop: '10px',
                      boxShadow: isBlockedByTtcm ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)',
                      display: 'flex',
                      justifyContent: 'center', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <Send size={18} />
                    {submittingCheckin ? 'Đang xác nhận...' : (isBlockedByTtcm ? '🚫 KHÓA: ĐÃ CÓ BÁO CÁO VẮNG TỪ TTCM' : 'XÁC NHẬN CÓ MẶT NGAY')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DÀNH CHO TỔ TRƯỞNG CHUYÊN MÔN (TTCM BÁO CÁO SĨ SỐ PRO)              */}
        {/* ========================================================================= */}
        {activeTab === 'ttcm' && (
          <div style={{
            backgroundColor: '#fff', borderRadius: '18px', padding: '24px',
            boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0'
          }}>
            {ttcmSuccessMessage && (
              <div style={{
                backgroundColor: '#dcfce7', color: '#166534', padding: '16px',
                borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #bbf7d0'
              }}>
                <CheckCircle2 size={24} style={{ flexShrink: 0 }} /> {ttcmSuccessMessage}
              </div>
            )}

            <div style={{ marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} color="#d97706" />
                <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                  Tổ Trưởng Chuyên Môn (TTCM) Báo Cáo Sĩ Số Tổ
                </h3>
              </div>
              
              <div style={{
                marginTop: '10px', backgroundColor: '#fef3c7', padding: '12px 16px',
                borderRadius: '12px', border: '1px solid #fde68a', fontSize: '13px', color: '#92400e', lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📌 Thẩm quyền & Quy chế điểm danh của Tổ trưởng (TTCM):</div>
                <div>• <strong>Kiểm diện thực tế tại chỗ:</strong> Thầy/Cô kiểm diện hàng ghế tổ mình. Nếu giáo viên chưa có mặt nhưng đã nhờ người quét QR hộ từ xa, TTCM có toàn quyền chọn <strong>"Vắng có phép"</strong> hoặc <strong>"Vắng K.phép"</strong> để phủ quyết điểm danh ảo.</div>
                <div>• <strong>Bảo vệ dữ liệu Tổ:</strong> Sau khi nộp báo cáo, dữ liệu của Tổ sẽ được khóa bảo vệ. TTCM tổ khác không thể can thiệp hay ghi đè lên dữ liệu của tổ Thầy/Cô.</div>
              </div>
            </div>

            {/* BANNER KHÓA BẢO VỆ NẾU TỔ ĐÃ NỘP BÁO CÁO */}
            {currentDeptReport && !isEditingSubmittedDept && (
              <div style={{
                backgroundColor: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '14px',
                padding: '16px 20px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: '#dcfce7', padding: '10px', borderRadius: '10px', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={26} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#166534' }}>
                        🛡️ BÁO CÁO TỔ {ttcmDept.toUpperCase()} ĐÃ ĐƯỢC CHỐT & KHÓA BẢO VỆ
                      </div>
                      <div style={{ fontSize: '13px', color: '#15803d', marginTop: '3px' }}>
                        Người báo cáo: <strong>{currentDeptReport.reporter_name}</strong> ({currentDeptReport.reporter_role || 'TTCM'}) • Lúc {new Date(currentDeptReport.reported_at).toLocaleTimeString('vi-VN')} {new Date(currentDeptReport.reported_at).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '13px', color: '#166534', marginTop: '3px' }}>
                        Sĩ số đã chốt: Có mặt <strong>{currentDeptReport.present_count}/{currentDeptReport.total_members}</strong> • Vắng có phép: <strong>{currentDeptReport.excused_count}</strong> • Vắng K.phép: <strong>{currentDeptReport.unexcused_count}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`XÁC NHẬN MỞ KHÓA BÁO CÁO:\n\nBạn có đúng là Tổ trưởng / Thư ký của Tổ ${ttcmDept} và muốn mở khóa để điều chỉnh lại dữ liệu sĩ số không?`)) {
                        setIsEditingSubmittedDept(true);
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '10px 18px', backgroundColor: '#d97706', color: '#fff',
                      border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px',
                      cursor: 'pointer', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    <Unlock size={16} /> 🔓 Mở khóa điều chỉnh báo cáo Tổ
                  </button>
                </div>
              </div>
            )}

            {/* BANNER MỞ KHÓA ĐIỀU CHỈNH */}
            {currentDeptReport && isEditingSubmittedDept && (
              <div style={{
                backgroundColor: '#fffbeb', border: '2px dashed #f59e0b', borderRadius: '12px',
                padding: '14px 18px', marginBottom: '20px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b45309', fontSize: '13.5px', fontWeight: 'bold' }}>
                  <Unlock size={20} />
                  <span>Đang ở chế độ <strong>MỞ KHÓA ĐIỀU CHỈNH</strong> báo cáo Tổ {ttcmDept}. Thầy/Cô có thể đổi trạng thái thành viên bên dưới và bấm nút <em>"CẬP NHẬT LẠI BÁO CÁO SĨ SỐ"</em> ở cuối trang.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingSubmittedDept(false)}
                  style={{
                    padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1',
                    borderRadius: '6px', fontSize: '12.5px', fontWeight: 'bold', color: '#475569', cursor: 'pointer'
                  }}
                >
                  🔒 Hủy & Khóa lại
                </button>
              </div>
            )}

            <form onSubmit={handleTtcmSubmit}>
              {/* CHỌN TỔ VÀ NGƯỜI BÁO CÁO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                    Tổ chuyên môn báo cáo *
                  </label>
                  <select
                    value={ttcmDept}
                    onChange={e => setTtcmDept(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    {departments.map(d => {
                      const isRep = deptReports.some(
                        r => r.meeting_id === selectedMeetingId && r.department.toLowerCase().trim() === d.toLowerCase().trim()
                      );
                      return (
                        <option key={d} value={d}>
                          {d} {isRep ? '✅ [Đã chốt sĩ số]' : '⏳ [Chưa nộp báo cáo]'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                    Họ tên Tổ trưởng (TTCM) / Người báo cáo *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={ttcmDeptStaffMembers.some(s => s.name === ttcmReporterName) ? ttcmReporterName : (ttcmReporterName ? '__OTHER__' : '')}
                      onChange={e => {
                        if (e.target.value === '__OTHER__') {
                          setTtcmReporterName('');
                        } else {
                          setTtcmReporterName(e.target.value);
                        }
                      }}
                      disabled={currentDeptReport && !isEditingSubmittedDept}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                        fontSize: '14px', backgroundColor: (currentDeptReport && !isEditingSubmittedDept) ? '#f1f5f9' : '#fff'
                      }}
                    >
                      <option value="">-- Chọn tên Thầy/Cô trong Tổ {ttcmDept} --</option>
                      {ttcmDeptStaffMembers.map(s => (
                        <option key={s.id || s.name} value={s.name}>
                          {s.name} ({s.title || 'Giáo viên'})
                        </option>
                      ))}
                      <option value="__OTHER__">✍️ Nhập tên khác...</option>
                    </select>
                    {(!ttcmDeptStaffMembers.some(s => s.name === ttcmReporterName) || !ttcmReporterName) && (
                      <input
                        type="text"
                        required
                        placeholder="Nhập họ tên TTCM..."
                        value={ttcmReporterName}
                        onChange={e => setTtcmReporterName(e.target.value)}
                        disabled={currentDeptReport && !isEditingSubmittedDept}
                        style={{
                          flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                          fontSize: '14px', backgroundColor: (currentDeptReport && !isEditingSubmittedDept) ? '#f1f5f9' : '#fff'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* BẢNG THỐNG KÊ SĨ SỐ ĐỘNG REAL-TIME CỦA TỔ (LIVE STATS BAR) */}
              <div style={{
                backgroundColor: '#f8fafc', borderRadius: '14px', padding: '16px',
                border: '1px solid #e2e8f0', marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={18} color="#0284c7" /> Thống kê Sĩ số Tổ {ttcmDept}:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12.5px', fontWeight: 'bold',
                      color: ttcmStats.rate === 100 ? '#15803d' : '#0369a1',
                      backgroundColor: ttcmStats.rate === 100 ? '#dcfce7' : '#e0f2fe',
                      padding: '3px 10px', borderRadius: '12px'
                    }}>
                      Tỷ lệ chuyên cần: {ttcmStats.rate}% {ttcmStats.rate === 100 ? '⭐ (Đủ 100%)' : ''}
                    </span>
                  </div>
                </div>

                {/* 4 CARD SỐ LIỆU */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>TỔNG SỐ</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{ttcmStats.total}</div>
                  </div>
                  <div style={{ backgroundColor: '#f0fdf4', borderRadius: '10px', padding: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: 'bold' }}>CÓ MẶT</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#15803d' }}>{ttcmStats.present}</div>
                  </div>
                  <div style={{ backgroundColor: '#fefce8', borderRadius: '10px', padding: '10px', border: '1px solid #fef08a', textAlign: 'center' }}>
                    <div style={{ fontSize: '11.5px', color: '#854d0e', fontWeight: 'bold' }}>CÓ PHÉP</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#a16207' }}>{ttcmStats.excused}</div>
                  </div>
                  <div style={{ backgroundColor: '#fff1f2', borderRadius: '10px', padding: '10px', border: '1px solid #fecdd3', textAlign: 'center' }}>
                    <div style={{ fontSize: '11.5px', color: '#9f1239', fontWeight: 'bold' }}>K.PHÉP</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#dc2626' }}>{ttcmStats.unexcused}</div>
                  </div>
                </div>

                {/* THANH TIẾN ĐỘ CHUYÊN CẦN */}
                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${ttcmStats.rate}%`,
                    height: '100%',
                    backgroundColor: ttcmStats.rate === 100 ? '#22c55e' : (ttcmStats.rate >= 80 ? '#0284c7' : '#f59e0b'),
                    transition: 'width 0.4s ease'
                  }}></div>
                </div>
              </div>

              {/* THANH CÔNG CỤ THẦN TỐC & BỘ LỌC CHO TTCM */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '10px', marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* PHÍM TẮT ĐÁNH DẤU TẤT CẢ CÓ MẶT */}
                  {(!currentDeptReport || isEditingSubmittedDept) && (
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '7px 14px', backgroundColor: '#16a34a', color: '#fff',
                        border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px',
                        cursor: 'pointer', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                      }}
                    >
                      <Zap size={14} /> ⚡ Đánh dấu tất cả CÓ MẶT
                    </button>
                  )}

                  {/* CÁC TAB LỌC TRẠNG THÁI */}
                  <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <button
                      type="button"
                      onClick={() => setTtcmFilterTab('ALL')}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: ttcmFilterTab === 'ALL' ? '#fff' : 'transparent',
                        color: ttcmFilterTab === 'ALL' ? '#0f172a' : '#64748b'
                      }}
                    >
                      Tất cả ({ttcmStats.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTtcmFilterTab('PRESENT')}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: ttcmFilterTab === 'PRESENT' ? '#fff' : 'transparent',
                        color: ttcmFilterTab === 'PRESENT' ? '#15803d' : '#64748b'
                      }}
                    >
                      Có mặt ({ttcmStats.present})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTtcmFilterTab('ABSENT')}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: ttcmFilterTab === 'ABSENT' ? '#fff' : 'transparent',
                        color: ttcmFilterTab === 'ABSENT' ? '#dc2626' : '#64748b'
                      }}
                    >
                      Vắng ({ttcmStats.excused + ttcmStats.unexcused})
                    </button>
                  </div>
                </div>

                {/* Ô TÌM KIẾM THÀNH VIÊN */}
                <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 auto', maxWidth: '300px' }}>
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Tìm tên giáo viên trong tổ..."
                    value={ttcmSearchQuery}
                    onChange={e => setTtcmSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: '7px 10px 7px 32px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* BẢNG KIỂM DIỆN TỪNG THÀNH VIÊN TRONG TỔ (CARD UI HIỆN ĐẠI) */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredTtcmMembers.map(staff => {
                    const selfAtt = attendances.find(a => a.staff_name.toLowerCase().trim() === staff.name.toLowerCase().trim());
                    const currentStatus = ttcmMemberStatuses[staff.name]?.status || 'PRESENT';
                    const currentReason = ttcmMemberStatuses[staff.name]?.reason || '';
                    const isLocked = Boolean(currentDeptReport && !isEditingSubmittedDept);
                    const isOverridingSelf = Boolean(selfAtt && selfAtt.status === 'PRESENT' && currentStatus !== 'PRESENT');

                    return (
                      <div key={staff.id || staff.name} style={{
                        padding: '12px 14px', borderRadius: '12px',
                        border: currentStatus === 'PRESENT' ? '1px solid #bbf7d0' : (currentStatus === 'EXCUSED' ? '1px solid #fef08a' : '1px solid #fecdd3'),
                        backgroundColor: currentStatus === 'PRESENT' ? '#f0fdf4' : (currentStatus === 'EXCUSED' ? '#fefce8' : '#fff1f2'),
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* AVATAR GRADIENT */}
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: getAvatarColor(staff.name), color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 'bold', fontSize: '13px', flexShrink: 0,
                              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}>
                              {getInitials(staff.name)}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{staff.name}</span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>({staff.title || 'Giáo viên'})</span>
                                
                                {selfAtt ? (
                                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                                    ✅ Tự quét QR ({new Date(selfAtt.checkin_time).toLocaleTimeString('vi-VN')})
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                    ⏳ Chưa quét QR
                                  </span>
                                )}
                              </div>

                              {/* CẢNH BÁO TTCM PHỦ QUYẾT TỰ QUÉT QR */}
                              {isOverridingSelf && (
                                <div style={{ marginTop: '3px' }}>
                                  <span style={{ fontSize: '11px', color: '#b45309', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #fde68a' }}>
                                    ⚠️ TTCM phủ quyết: Cá nhân tự quét nhưng thực tế vắng mặt tại hội trường
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 3 NÚT CHỌN TRẠNG THÁI KIỂU SEGMENTED CONTROL */}
                          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleTtcmStatusChange(staff.name, 'status', 'PRESENT')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px', border: 'none',
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                opacity: isLocked ? 0.75 : 1,
                                fontSize: '12px', fontWeight: 'bold',
                                backgroundColor: currentStatus === 'PRESENT' ? '#15803d' : 'transparent',
                                color: currentStatus === 'PRESENT' ? '#fff' : '#475569',
                                boxShadow: currentStatus === 'PRESENT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              Có mặt
                            </button>

                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleTtcmStatusChange(staff.name, 'status', 'EXCUSED')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px', border: 'none',
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                opacity: isLocked ? 0.75 : 1,
                                fontSize: '12px', fontWeight: 'bold',
                                backgroundColor: currentStatus === 'EXCUSED' ? '#a16207' : 'transparent',
                                color: currentStatus === 'EXCUSED' ? '#fff' : '#475569',
                                boxShadow: currentStatus === 'EXCUSED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              Vắng có phép
                            </button>

                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleTtcmStatusChange(staff.name, 'status', 'UNEXCUSED')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px', border: 'none',
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                opacity: isLocked ? 0.75 : 1,
                                fontSize: '12px', fontWeight: 'bold',
                                backgroundColor: currentStatus === 'UNEXCUSED' ? '#dc2626' : 'transparent',
                                color: currentStatus === 'UNEXCUSED' ? '#fff' : '#475569',
                                boxShadow: currentStatus === 'UNEXCUSED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              Vắng K.phép
                            </button>
                          </div>
                        </div>

                        {/* NHẬP LÝ DO NẾU VẮNG */}
                        {currentStatus !== 'PRESENT' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b91c1c' }}>Lý do vắng:</span>
                            <select
                              disabled={isLocked}
                              value={currentReason}
                              onChange={e => handleTtcmStatusChange(staff.name, 'reason', e.target.value)}
                              style={{
                                flex: '1 1 200px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                fontSize: '12.5px', backgroundColor: isLocked ? '#f8fafc' : '#fff'
                              }}
                            >
                              <option value="">-- Chọn lý do vắng chuẩn ngành --</option>
                              {ABSENT_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              disabled={isLocked}
                              placeholder="Hoặc gõ chi tiết lý do..."
                              value={currentReason}
                              onChange={e => handleTtcmStatusChange(staff.name, 'reason', e.target.value)}
                              style={{
                                flex: '1 1 200px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                fontSize: '12.5px', backgroundColor: isLocked ? '#f8fafc' : '#fff'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredTtcmMembers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                      Không tìm thấy giáo viên nào phù hợp với bộ lọc hiện tại.
                    </div>
                  )}
                </div>
              </div>

              {/* GHI CHÚ / KIẾN NGHỊ CỦA TỔ (KÈM MẪU GỢI Ý NHANH) */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                    Ý kiến / Kiến nghị / Báo cáo nhanh của Tổ gửi Lãnh đạo (Tùy chọn)
                  </label>
                  {/* CÁC NÚT MẪU GHI CHÚ NHANH */}
                  {(!currentDeptReport || isEditingSubmittedDept) && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {QUICK_NOTES.map(q => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setTtcmNote(q)}
                          style={{
                            padding: '2px 8px', borderRadius: '12px', border: '1px solid #cbd5e1',
                            fontSize: '11px', color: '#0369a1', backgroundColor: '#f0f9ff', cursor: 'pointer'
                          }}
                        >
                          💬 "{q.substring(0, 24)}..."
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  rows={3}
                  disabled={currentDeptReport && !isEditingSubmittedDept}
                  placeholder="Ghi chú thêm về sĩ số, phản ánh của tổ hoặc kiến nghị trong cuộc họp..."
                  value={ttcmNote}
                  onChange={e => setTtcmNote(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '13.5px', backgroundColor: (currentDeptReport && !isEditingSubmittedDept) ? '#f8fafc' : '#fff'
                  }}
                />
              </div>

              {/* NÚT GỬI BÁO CÁO CỦA TTCM HOẶC THÔNG BÁO KHÓA */}
              {currentDeptReport && !isEditingSubmittedDept ? (
                <div style={{
                  padding: '16px', backgroundColor: '#f0fdf4', border: '1px dashed #22c55e',
                  borderRadius: '12px', textAlign: 'center', color: '#166534', fontSize: '14px', fontWeight: 'bold'
                }}>
                  🔒 Báo cáo sĩ số Tổ {ttcmDept} đã được chốt và gửi lên BGH. Bấm nút <strong>"Mở khóa điều chỉnh báo cáo Tổ"</strong> ở trên nếu Thầy/Cô là TTCM của tổ cần sửa lại.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submittingTtcm}
                  style={{
                    width: '100%', padding: '15px',
                    background: currentDeptReport ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'linear-gradient(135deg, #d97706, #b45309)',
                    color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '900',
                    cursor: submittingTtcm ? 'not-allowed' : 'pointer',
                    boxShadow: currentDeptReport ? '0 4px 14px rgba(2, 132, 199, 0.35)' : '0 4px 14px rgba(217, 119, 6, 0.35)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <Send size={18} />
                  {submittingTtcm ? 'Đang gửi dữ liệu lên BGH...' : (currentDeptReport ? `CẬP NHẬT LẠI BÁO CÁO SĨ SỐ TỔ ${ttcmDept} LÊN LÃNH ĐẠO` : `GỬI BÁO CÁO SĨ SỐ TỔ ${ttcmDept} LÊN LÃNH ĐẠO`)}
                </button>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
