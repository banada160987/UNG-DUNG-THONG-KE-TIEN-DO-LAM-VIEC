import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  Users, Video, Clock, CheckCircle2, AlertCircle, XCircle, 
  Download, Printer, MessageSquare, Plus, Edit3, Trash2, 
  ExternalLink, Copy, Check, RefreshCw, Eye, ShieldCheck, 
  FileText, QrCode, Play, Square, Award, Filter, Search, ChevronDown, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { OnlineMeetingService, DEFAULT_DEPARTMENTS } from '../services/onlineMeetingService';

export default function AdminMeetingAttendance() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'attendances' | 'meetings'
  
  // Data states
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [attendances, setAttendances] = useState([]);
  const [deptReports, setDeptReports] = useState([]);

  // Filter & Search states
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // OTP Projector Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  // Meeting Form Modal State
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('Hội đồng sư phạm');
  const [formFormat, setFormFormat] = useState('OFFLINE'); // 'OFFLINE' | 'ONLINE' | 'HYBRID'
  const [formLocation, setFormLocation] = useState('Hội trường lớn - Trường THPT Cao Bá Quát');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLink, setFormLink] = useState('');
  const [formPollQuestion, setFormPollQuestion] = useState('');
  const [formPollOptions, setFormPollOptions] = useState('Nhất trí 100%, Có ý kiến đề xuất khác');

  // Toast / Copy state
  const [copiedToast, setCopiedToast] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Modal Thư ký nhập / sửa báo cáo sĩ số cho Tổ (Báo cáo Zalo / Trực tiếp)
  const [showDeptReportModal, setShowDeptReportModal] = useState(false);
  const [modalDept, setModalDept] = useState('');
  const [modalReporterName, setModalReporterName] = useState('Tổ trưởng (Báo qua Zalo)');
  const [modalReportSource, setModalReportSource] = useState('ZALO'); // 'ZALO' | 'DIRECT' | 'SECRETARY'
  const [modalReportMode, setModalReportMode] = useState('MEMBERS'); // 'MEMBERS' | 'COUNTS'
  const [modalMemberStatuses, setModalMemberStatuses] = useState({}); // { [staffName]: { status, reason } }
  const [modalManualPresent, setModalManualPresent] = useState(0);
  const [modalManualExcused, setModalManualExcused] = useState(0);
  const [modalManualUnexcused, setModalManualUnexcused] = useState(0);
  const [modalAbsentNote, setModalAbsentNote] = useState('');
  const [modalDeptNote, setModalDeptNote] = useState('');
  const [submittingDeptReport, setSubmittingDeptReport] = useState(false);

  // Timer ref
  const timerRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedMeetingId) {
      loadMeetingDetails(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  // Đồng hồ đếm ngược OTP
  useEffect(() => {
    const curMeeting = meetings.find(m => m.id === selectedMeetingId);
    if (curMeeting?.is_checkin_open && curMeeting?.checkin_expires_at) {
      const remaining = Math.max(0, Math.floor((new Date(curMeeting.checkin_expires_at).getTime() - Date.now()) / 1000));
      setCountdownSeconds(remaining);

      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdownSeconds(0);
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [selectedMeetingId, meetings]);

  // Polling tự động làm mới dữ liệu mỗi 15 giây
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedMeetingId) {
        loadMeetingDetails(selectedMeetingId, false);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedMeetingId]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [allMeetings, { departments: depts, staff }] = await Promise.all([
        OnlineMeetingService.getMeetings(),
        OnlineMeetingService.getStaffAndDepartments()
      ]);

      setMeetings(allMeetings);
      setDepartments(depts);
      setStaffList(staff);

      if (allMeetings.length > 0) {
        setSelectedMeetingId(prev => (prev && allMeetings.some(m => m.id === prev)) ? prev : allMeetings[0].id);
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMeetingDetails(meetingId, showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const [atts, reps, meetingList] = await Promise.all([
        OnlineMeetingService.getAttendances(meetingId),
        OnlineMeetingService.getDepartmentReports(meetingId),
        OnlineMeetingService.getMeetings()
      ]);
      setAttendances(atts);
      setDeptReports(reps);
      setMeetings(meetingList);
    } catch (e) {
      console.error('Lỗi nạp chi tiết cuộc họp:', e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  const currentMeeting = useMemo(() => {
    return meetings.find(m => m.id === selectedMeetingId) || null;
  }, [meetings, selectedMeetingId]);

  // Tổng hợp thống kê
  const statistics = useMemo(() => {
    const totalStaff = staffList.length || 1;
    const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
    const excusedCount = attendances.filter(a => a.status === 'EXCUSED').length;
    const unexcusedCount = attendances.filter(a => a.status === 'UNEXCUSED').length;
    const unreportedCount = Math.max(0, totalStaff - (presentCount + excusedCount + unexcusedCount));

    // Thống kê TTCM
    const totalDepts = departments.length;
    const reportedDepts = deptReports.length;

    // Thống kê biểu quyết (nếu có)
    const pollResults = {};
    if (currentMeeting?.poll_question) {
      attendances.forEach(a => {
        if (a.poll_answer) {
          pollResults[a.poll_answer] = (pollResults[a.poll_answer] || 0) + 1;
        }
      });
    }

    return {
      totalStaff,
      presentCount,
      presentPct: ((presentCount / totalStaff) * 100).toFixed(1),
      excusedCount,
      unexcusedCount,
      unreportedCount,
      totalDepts,
      reportedDepts,
      pollResults
    };
  }, [staffList, attendances, departments, deptReports, currentMeeting]);

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================

  // Bắt đầu điểm danh (Mở OTP 5 phút)
  const handleStartCheckin = async (minutes = 5) => {
    if (!currentMeeting) return;
    try {
      await OnlineMeetingService.startCheckin(currentMeeting.id, minutes);
      await loadMeetingDetails(currentMeeting.id, false);
      setShowOtpModal(true);
    } catch (e) {
      alert('Lỗi bắt đầu điểm danh: ' + e.message);
    }
  };

  // Khóa / Mở điểm danh
  const handleToggleCheckin = async () => {
    if (!currentMeeting) return;
    const nextState = !currentMeeting.is_checkin_open;
    try {
      await OnlineMeetingService.toggleCheckin(currentMeeting.id, nextState);
      await loadMeetingDetails(currentMeeting.id, false);
    } catch (e) {
      alert('Lỗi chuyển trạng thái: ' + e.message);
    }
  };

  // Yêu cầu TTCM Báo cáo sĩ số
  const handleToggleTtcmReporting = async () => {
    if (!currentMeeting) return;
    const nextState = !currentMeeting.ttcm_reporting_open;
    try {
      await OnlineMeetingService.toggleTtcmReporting(currentMeeting.id, nextState);
      await loadMeetingDetails(currentMeeting.id, false);
      alert(nextState 
        ? 'ĐÃ PHÁT LỆNH: Yêu cầu các Tổ trưởng Chuyên môn (TTCM) báo cáo sĩ số tổ!' 
        : 'Đã đóng cổng tiếp nhận báo cáo sĩ số của TTCM.'
      );
    } catch (e) {
      alert('Lỗi yêu cầu TTCM: ' + e.message);
    }
  };

  // Mở form cuộc họp
  const handleOpenMeetingModal = (meeting = null) => {
    if (meeting) {
      setEditingMeeting(meeting);
      setFormTitle(meeting.title);
      setFormType(meeting.meeting_type || 'Hội đồng sư phạm');
      setFormFormat(meeting.meeting_format || (meeting.meeting_link ? 'ONLINE' : 'OFFLINE'));
      setFormLocation(meeting.location || (meeting.meeting_link ? 'Trực tuyến (Meet/Zoom)' : 'Hội trường lớn - Trường THPT Cao Bá Quát'));
      setFormDate(meeting.meeting_date || new Date().toISOString().split('T')[0]);
      setFormLink(meeting.meeting_link || '');
      setFormPollQuestion(meeting.poll_question || '');
      setFormPollOptions(meeting.poll_options ? meeting.poll_options.join(', ') : '');
    } else {
      setEditingMeeting(null);
      setFormTitle('');
      setFormType('Hội đồng sư phạm');
      setFormFormat('OFFLINE');
      setFormLocation('Hội trường lớn - Trường THPT Cao Bá Quát');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormLink('');
      setFormPollQuestion('');
      setFormPollOptions('Nhất trí 100%, Có ý kiến đề xuất khác');
    }
    setShowMeetingModal(true);
  };

  // Lưu cuộc họp
  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return alert('Vui lòng nhập tên cuộc họp!');

    const pollOpts = formPollOptions
      ? formPollOptions.split(',').map(s => s.trim()).filter(Boolean)
      : ['Nhất trí 100%', 'Có ý kiến khác'];

    const payload = {
      id: editingMeeting?.id,
      title: formTitle.trim(),
      meeting_type: formType,
      meeting_format: formFormat,
      location: formLocation.trim() || (formFormat === 'OFFLINE' ? 'Hội trường lớn - Trường THPT Cao Bá Quát' : 'Trực tuyến'),
      meeting_date: formDate,
      meeting_link: formLink.trim(),
      poll_question: formPollQuestion.trim(),
      poll_options: pollOpts,
      is_checkin_open: editingMeeting?.is_checkin_open || false,
      ttcm_reporting_open: editingMeeting?.ttcm_reporting_open || false,
      checkin_code: editingMeeting?.checkin_code || '839201'
    };

    try {
      const saved = await OnlineMeetingService.saveMeeting(payload);
      setShowMeetingModal(false);
      await loadInitialData();
      setSelectedMeetingId(saved.id);
      alert('Đã lưu thông tin cuộc họp thành công!');
    } catch (err) {
      alert('Lỗi lưu cuộc họp: ' + err.message);
    }
  };

  // Xóa cuộc họp
  const handleDeleteMeeting = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc họp này và toàn bộ dữ liệu điểm danh?')) return;
    try {
      await OnlineMeetingService.deleteMeeting(id);
      await loadInitialData();
      alert('Đã xóa cuộc họp thành công!');
    } catch (err) {
      alert('Lỗi xóa cuộc họp: ' + err.message);
    }
  };

  // Sao chép nội dung
  const copyToClipboard = (text, message = 'Đã sao chép vào bộ nhớ tạm!') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToast(message);
      setTimeout(() => setCopiedToast(''), 3000);
    });
  };

  // =========================================================================
  // XỬ LÝ THƯ KÝ NHẬP / SỬA BÁO CÁO SĨ SỐ CHO TỔ (THEO ZALO HOẶC TRỰC TIẾP)
  // =========================================================================
  const handleOpenDeptReportModal = (deptName) => {
    if (!currentMeeting) {
      alert('Vui lòng chọn hoặc tạo một cuộc họp trước!');
      return;
    }
    const targetDept = deptName || departments[0] || 'Tổ Toán';
    setModalDept(targetDept);
    setModalReportSource('ZALO');

    const existingRep = deptReports.find(r => r.department === targetDept);
    const deptMembers = staffList.filter(s => s.department === targetDept);

    if (existingRep) {
      setModalReporterName(existingRep.reporter_name || 'Tổ trưởng (Báo qua Zalo)');
      setModalDeptNote(existingRep.note || '');
      setModalManualPresent(existingRep.present_count || 0);
      setModalManualExcused(existingRep.excused_count || 0);
      setModalManualUnexcused(existingRep.unexcused_count || 0);
      if (existingRep.absent_details && existingRep.absent_details.length > 0) {
        setModalAbsentNote(existingRep.absent_details.map(a => `${a.name} (${a.reason || 'Có phép'})`).join('; '));
      } else {
        setModalAbsentNote('');
      }
    } else {
      setModalReporterName('Tổ trưởng (Báo qua Zalo)');
      setModalDeptNote('');
      setModalManualPresent(deptMembers.length);
      setModalManualExcused(0);
      setModalManualUnexcused(0);
      setModalAbsentNote('');
    }

    const initialStatuses = {};
    deptMembers.forEach(s => {
      const att = attendances.find(a => a.staff_name.toLowerCase().trim() === s.name.toLowerCase().trim());
      initialStatuses[s.name] = {
        status: att ? att.status : 'PRESENT',
        reason: att?.note || ''
      };
    });
    setModalMemberStatuses(initialStatuses);
    setModalReportMode(deptMembers.length > 0 ? 'MEMBERS' : 'COUNTS');
    setShowDeptReportModal(true);
  };

  const handleModalDeptChange = (newDept) => {
    setModalDept(newDept);
    const existingRep = deptReports.find(r => r.department === newDept);
    const deptMembers = staffList.filter(s => s.department === newDept);

    if (existingRep) {
      setModalReporterName(existingRep.reporter_name || 'Tổ trưởng (Báo qua Zalo)');
      setModalDeptNote(existingRep.note || '');
      setModalManualPresent(existingRep.present_count || 0);
      setModalManualExcused(existingRep.excused_count || 0);
      setModalManualUnexcused(existingRep.unexcused_count || 0);
      if (existingRep.absent_details && existingRep.absent_details.length > 0) {
        setModalAbsentNote(existingRep.absent_details.map(a => `${a.name} (${a.reason || 'Có phép'})`).join('; '));
      } else {
        setModalAbsentNote('');
      }
    } else {
      setModalManualPresent(deptMembers.length);
      setModalManualExcused(0);
      setModalManualUnexcused(0);
      setModalAbsentNote('');
    }

    const initialStatuses = {};
    deptMembers.forEach(s => {
      const att = attendances.find(a => a.staff_name.toLowerCase().trim() === s.name.toLowerCase().trim());
      initialStatuses[s.name] = {
        status: att ? att.status : 'PRESENT',
        reason: att?.note || ''
      };
    });
    setModalMemberStatuses(initialStatuses);
    if (deptMembers.length > 0 && modalReportMode !== 'COUNTS') {
      setModalReportMode('MEMBERS');
    }
  };

  const handleModalMemberStatusChange = (staffName, field, value) => {
    setModalMemberStatuses(prev => ({
      ...prev,
      [staffName]: {
        ...prev[staffName],
        [field]: value
      }
    }));
  };

  const handleSetAllMembersPresent = () => {
    setModalMemberStatuses(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(name => {
        updated[name] = { ...updated[name], status: 'PRESENT', reason: '' };
      });
      return updated;
    });
  };

  const handleSaveDeptReport = async (e) => {
    e.preventDefault();
    if (!currentMeeting) return alert('Vui lòng chọn cuộc họp!');
    if (!modalDept) return alert('Vui lòng chọn Tổ chuyên môn!');

    setSubmittingDeptReport(true);
    try {
      const deptMembers = staffList.filter(s => s.department === modalDept);
      let presentCount = 0;
      let excusedCount = 0;
      let unexcusedCount = 0;
      let absentDetails = [];
      let verifiedAttendances = [];

      if (modalReportMode === 'MEMBERS') {
        deptMembers.forEach(s => {
          const item = modalMemberStatuses[s.name] || { status: 'PRESENT', reason: '' };
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
            note: item.reason || (item.status === 'PRESENT' ? 'Thư ký xác nhận có mặt (Theo Zalo/Hội trường)' : 'Báo vắng')
          });
        });
      } else {
        presentCount = Number(modalManualPresent) || 0;
        excusedCount = Number(modalManualExcused) || 0;
        unexcusedCount = Number(modalManualUnexcused) || 0;
        if (modalAbsentNote.trim()) {
          absentDetails = [{ name: 'Danh sách vắng', reason: modalAbsentNote.trim() }];
        }
      }

      const roleText = modalReportSource === 'ZALO' 
        ? 'Tổ trưởng báo qua Zalo (Thư ký nhập)' 
        : (modalReportSource === 'DIRECT' ? 'Tổ trưởng báo trực tiếp tại hội trường' : 'Thư ký điểm danh thay');

      await OnlineMeetingService.submitDepartmentReport({
        meetingId: currentMeeting.id,
        department: modalDept,
        reporterName: modalReporterName.trim() || 'Tổ trưởng chuyên môn',
        reporterRole: roleText,
        totalMembers: deptMembers.length || (presentCount + excusedCount + unexcusedCount),
        presentCount,
        excusedCount,
        unexcusedCount,
        absentDetails,
        note: modalDeptNote.trim() || roleText,
        verifiedAttendances
      });

      setShowDeptReportModal(false);
      await loadMeetingDetails(currentMeeting.id, false);
      setCopiedToast(`Đã lưu báo cáo sĩ số cho Tổ ${modalDept} thành công!`);
      setTimeout(() => setCopiedToast(''), 3000);
    } catch (err) {
      alert('Lỗi lưu báo cáo tổ: ' + err.message);
    } finally {
      setSubmittingDeptReport(false);
    }
  };

  // Cập nhật nhanh trạng thái cho một giáo viên trực tiếp từ bảng
  const handleQuickUpdateStaffStatus = async (staffName, department, newStatus) => {
    if (!currentMeeting) return;
    try {
      await OnlineMeetingService.updateSingleAttendance({
        meetingId: currentMeeting.id,
        staffName,
        department,
        status: newStatus,
        verifiedByName: 'Thư ký cuộc họp'
      });
      await loadMeetingDetails(currentMeeting.id, false);
      setCopiedToast(`Đã chuyển trạng thái [${staffName}]: ${newStatus === 'PRESENT' ? '✅ Có mặt' : (newStatus === 'EXCUSED' ? '🟡 Vắng có phép' : (newStatus === 'UNEXCUSED' ? '🔴 Vắng không phép' : 'Chưa điểm danh'))}`);
      setTimeout(() => setCopiedToast(''), 2500);
    } catch (e) {
      alert('Lỗi cập nhật: ' + e.message);
    }
  };

  // =========================================================================
  // XUẤT TIN NHẮN ZALO ĐÔN ĐỐC
  // =========================================================================
  const handleCopyZaloReminder = () => {
    if (!currentMeeting) return;
    const meetingUrl = `${window.location.origin}/hop-online?id=${currentMeeting.id}`;

    // Lọc giáo viên chưa check-in
    const checkedInNames = new Set(attendances.map(a => a.staff_name.toLowerCase().trim()));
    const missingStaff = staffList.filter(s => !checkedInNames.has(s.name.toLowerCase().trim()));

    // Lọc tổ chưa báo cáo
    const reportedDeptNames = new Set(deptReports.map(r => r.department));
    const missingDepts = departments.filter(d => !reportedDeptNames.has(d));

    let msg = `📢 [THPT CAO BÁ QUÁT - ĐÔN ĐỐC ĐIỂM DANH HỌP]\n`;
    msg += `📌 Cuộc họp: ${currentMeeting.title.toUpperCase()}\n`;
    msg += `⏰ Thời gian: ${new Date(currentMeeting.meeting_date).toLocaleDateString('vi-VN')}\n`;
    if (currentMeeting.meeting_format === 'OFFLINE') {
      msg += `🏢 Hình thức: Họp TRỰC TIẾP tại ${currentMeeting.location || 'Hội trường lớn'}\n`;
    } else if (currentMeeting.meeting_format === 'ONLINE') {
      msg += `💻 Hình thức: Họp TRỰC TUYẾN\n`;
      if (currentMeeting.meeting_link) msg += `🔗 Link họp Meet/Zoom: ${currentMeeting.meeting_link}\n`;
    } else {
      msg += `🌐 Hình thức: Họp HỖN HỢP tại ${currentMeeting.location || 'Hội trường'} và trực tuyến\n`;
      if (currentMeeting.meeting_link) msg += `🔗 Link họp Meet/Zoom: ${currentMeeting.meeting_link}\n`;
    }
    msg += `\n🔑 MÃ SỐ ĐIỂM DANH (OTP): ${currentMeeting.checkin_code || 'Đang mở'}\n`;
    msg += `👉 Cổng điểm danh giáo viên (hoặc quét mã QR trên màn chiếu): ${meetingUrl}&code=${currentMeeting.checkin_code || ''}\n\n`;

    if (missingDepts.length > 0) {
      msg += `⚠️ CÁC TỔ CHUYÊN MÔN CHƯA BÁO CÁO SĨ SỐ (${missingDepts.length} tổ):\n`;
      missingDepts.forEach((d, i) => {
        msg += `   ${i + 1}. ${d}\n`;
      });
      msg += `➡️ Kính đề nghị Quý Thầy/Cô Tổ trưởng (TTCM) vào link ${meetingUrl} -> Chọn Tab "Tổ Trưởng Báo Cáo Sĩ Số" để gửi báo cáo gấp cho BGH!\n\n`;
    }

    if (missingStaff.length > 0 && missingStaff.length <= 25) {
      msg += `⏳ Danh sách Thầy/Cô chưa hoàn tất điểm danh (${missingStaff.length} người):\n`;
      missingStaff.forEach((s, i) => {
        msg += `   ${i + 1}. ${s.name} (${s.department || 'Giáo viên'})\n`;
      });
      msg += `\nKính đề nghị Thầy/Cô nhanh chóng vào điểm danh để Thư ký tổng hợp báo cáo Hiệu trưởng! Trân trọng.`;
    }

    copyToClipboard(msg, 'Đã sao chép tin nhắn Zalo đôn đốc thành công!');
  };

  // =========================================================================
  // XUẤT BÁO CÁO WORD NGHỊ ĐỊNH 30/2020/NĐ-CP
  // =========================================================================
  const exportDecree30Word = () => {
    if (!currentMeeting) return;
    const today = new Date();
    const dayStr = today.getDate().toString().padStart(2, '0');
    const monthStr = (today.getMonth() + 1).toString().padStart(2, '0');
    const yearStr = today.getFullYear();

    const missingList = staffList.filter(s => {
      const att = attendances.find(a => a.staff_name.toLowerCase().trim() === s.name.toLowerCase().trim());
      return !att || att.status !== 'PRESENT';
    });

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Biên bản điểm danh họp trực tuyến</title>
        <style>
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 2.0cm 2.0cm 3.0cm; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 12px; }
          th, td { border: 1pt solid windowtext; padding: 6px 8px; font-size: 11pt; vertical-align: middle; }
          th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .header-table { width: 100%; border: none !important; margin-bottom: 15px; }
          .header-table td { border: none !important; text-align: center; vertical-align: top; padding: 0; }
          .title { text-align: center; font-weight: bold; font-size: 15pt; text-transform: uppercase; margin-top: 15px; }
          .subtitle { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 20px; }
        </style>
      </head>
      <body>
      <div class="Section1">
        <table class="header-table">
          <tr>
            <td style="width: 45%;">
              <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</strong><br/>
              <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
              -------------------<br/>
              Số: ... /BB-THPTCBQ
            </td>
            <td style="width: 55%;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
              -----------------------------------<br/>
              <em>Đắk Lắk, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</em>
            </td>
          </tr>
        </table>

        <div class="title">BIÊN BẢN TỔNG HỢP ĐIỂM DANH & SĨ SỐ CUỘC HỌP</div>
        <div class="subtitle">Cuộc họp: ${currentMeeting.title.toUpperCase()}</div>

        <p><strong>I. THỜI GIAN, HÌNH THỨC VÀ ĐỊA ĐIỂM</strong></p>
        <p>- <strong>Thời gian:</strong> Ngày ${new Date(currentMeeting.meeting_date).toLocaleDateString('vi-VN')}.</p>
        <p>- <strong>Hình thức:</strong> ${
          currentMeeting.meeting_format === 'OFFLINE' ? 'Họp trực tiếp tại đơn vị' :
          (currentMeeting.meeting_format === 'ONLINE' ? 'Họp trực tuyến' : 'Họp hỗn hợp (trực tiếp kết hợp trực tuyến)')
        }${currentMeeting.meeting_link ? ` (Link: ${currentMeeting.meeting_link})` : ''}.</p>
        <p>- <strong>Địa điểm:</strong> ${currentMeeting.location || 'Hội trường lớn - Trường THPT Cao Bá Quát'}.</p>
        <p>- <strong>Chủ trì:</strong> Ban Giám Hiệu Trường THPT Cao Bá Quát.</p>
        <p>- <strong>Thư ký:</strong> Ban Thư Ký Hội Đồng Sư Phạm.</p>

        <p><strong>II. KẾT QUẢ TỔNG HỢP SĨ SỐ THAM DỰ</strong></p>
        <p>- Tổng số Cán bộ, Giáo viên, Nhân viên triệu tập: <strong>${statistics.totalStaff}</strong> đồng chí.</p>
        <p>- Số lượng có mặt hợp lệ: <strong>${statistics.presentCount} / ${statistics.totalStaff}</strong> đồng chí (Tỷ lệ: <strong>${statistics.presentPct}%</strong>).</p>
        <p>- Số lượng vắng có phép: <strong>${statistics.excusedCount}</strong> đồng chí.</p>
        <p>- Số lượng vắng không phép: <strong>${statistics.unexcusedCount}</strong> đồng chí.</p>
        <p>- Tiến độ báo cáo của Tổ trưởng Chuyên môn: <strong>${statistics.reportedDepts} / ${statistics.totalDepts}</strong> Tổ đã hoàn thành báo cáo sĩ số cho BGH.</p>

        <p><strong>III. BẢNG TỔNG HỢP SĨ SỐ THEO TỪNG TỔ CHUYÊN MÔN</strong></p>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 25%;">Tổ Chuyên Môn</th>
              <th style="width: 12%;">Tổng Sĩ Số</th>
              <th style="width: 12%;">Có Mặt</th>
              <th style="width: 12%;">Vắng Có Phép</th>
              <th style="width: 12%;">Vắng K.Phép</th>
              <th style="width: 22%;">Người Báo Cáo (TTCM)</th>
            </tr>
          </thead>
          <tbody>
            ${departments.map((dept, idx) => {
              const rep = deptReports.find(r => r.department === dept);
              const deptStaff = staffList.filter(s => s.department === dept);
              const presentInDept = attendances.filter(a => a.department === dept && a.status === 'PRESENT').length;
              return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${dept}</strong></td>
                  <td style="text-align: center;">${rep?.total_members || deptStaff.length}</td>
                  <td style="text-align: center; font-weight: bold; color: green;">${rep?.present_count ?? presentInDept}</td>
                  <td style="text-align: center;">${rep?.excused_count ?? 0}</td>
                  <td style="text-align: center; color: red;">${rep?.unexcused_count ?? 0}</td>
                  <td>${rep ? `✅ ${rep.reporter_name} (${rep.reporter_role || 'TTCM'})` : '⏳ Chưa báo cáo'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        ${missingList.length > 0 ? `
        <p><strong>IV. DANH SÁCH CÁN BỘ - GIÁO VIÊN VẮNG MẶT HOẶC CHƯA HOÀN TẤT ĐIỂM DANH</strong></p>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 30%;">Họ và Tên</th>
              <th style="width: 25%;">Tổ Chuyên Môn</th>
              <th style="width: 20%;">Phân Loại</th>
              <th style="width: 20%;">Lý Do / Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            ${missingList.map((m, i) => {
              const att = attendances.find(a => a.staff_name.toLowerCase().trim() === m.name.toLowerCase().trim());
              const statusLabel = att?.status === 'EXCUSED' ? 'Vắng có phép' : (att?.status === 'UNEXCUSED' ? 'Vắng không phép' : 'Chưa điểm danh');
              return `
                <tr>
                  <td style="text-align: center;">${i + 1}</td>
                  <td><strong>${m.name}</strong></td>
                  <td>${m.department || 'Tổ bộ môn'}</td>
                  <td style="text-align: center;">${statusLabel}</td>
                  <td>${att?.note || 'Chưa ghi nhận phản hồi'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ` : '<p><em>Tất cả cán bộ, giáo viên đã có mặt đầy đủ 100%.</em></p>'}

        <table style="border: none !important; margin-top: 30px;">
          <tr>
            <td style="width: 50%; border: none !important; text-align: center;">
              <strong>THƯ KÝ CUỘC HỌP</strong><br/>
              <em>(Ký, ghi rõ họ tên)</em><br/><br/><br/><br/>
            </td>
            <td style="width: 50%; border: none !important; text-align: center;">
              <strong>CHỦ TRÌ / HIỆU TRƯỞNG</strong><br/>
              <em>(Ký, ghi rõ họ tên và đóng dấu)</em><br/><br/><br/><br/>
            </td>
          </tr>
        </table>
      </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bien_ban_diem_danh_${currentMeeting.title.replace(/[^a-zA-Z0-9]/g, '_')}_${yearStr}${monthStr}${dayStr}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // XUẤT EXCEL PRO 3 SHEET (.XLSX)
  // =========================================================================
  const exportExcelPro = () => {
    if (!currentMeeting) return;
    const today = new Date();
    const dayStr = today.getDate().toString().padStart(2, '0');
    const monthStr = (today.getMonth() + 1).toString().padStart(2, '0');
    const yearStr = today.getFullYear();
    const dateStr = `${yearStr}${monthStr}${dayStr}`;

    const workbook = XLSX.utils.book_new();

    // -----------------------------------------------------------------------
    // SHEET 1: TỔNG HỢP SĨ SỐ & BÁO CÁO CỦA CÁC TỔ CHUYÊN MÔN
    // -----------------------------------------------------------------------
    const sheet1Rows = [
      ["SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", "", "", ""],
      ["TRƯỜNG THPT CAO BÁ QUÁT", "", "", "", "Độc lập - Tự do - Hạnh phúc", "", "", ""],
      [`Số: ... /BC-THPTCBQ`, "", "", "", `Đắk Lắk, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`, "", "", ""],
      [],
      ["BẢNG TỔNG HỢP SĨ SỐ & KẾT QUẢ ĐIỂM DANH CUỘC HỌP"],
      [`Cuộc họp: ${currentMeeting.title.toUpperCase()}`],
      [`Hình thức: ${
        currentMeeting.meeting_format === 'OFFLINE' ? 'Trực tiếp tại đơn vị' :
        (currentMeeting.meeting_format === 'ONLINE' ? 'Trực tuyến qua Meet/Zoom' : 'Hỗn hợp Trực tiếp & Trực tuyến')
      } | Địa điểm: ${currentMeeting.location || 'Hội trường lớn - Trường THPT Cao Bá Quát'}`],
      [`Thời gian: ${new Date(currentMeeting.meeting_date).toLocaleDateString('vi-VN')} | Xuất lúc: ${today.toLocaleString('vi-VN')}`],
      [],
      ["I. CHỈ SỐ TOÀN TRƯỜNG"],
      ["STT", "Chỉ Số Đánh Giá", "Số Lượng", "Tỷ Lệ (%)", "Đánh Giá"],
      [1, "Tổng số Cán bộ - Giáo viên triệu tập", statistics.totalStaff, "100%", "Biên chế nhà trường"],
      [2, "Số lượng đã có mặt", statistics.presentCount, `${statistics.presentPct}%`, statistics.presentPct >= 95 ? "Chuyên cần rất cao" : "Cần đôn đốc thêm"],
      [3, "Số lượng vắng có phép", statistics.excusedCount, `${((statistics.excusedCount / statistics.totalStaff) * 100).toFixed(1)}%`, "Có lý do công tác, ốm"],
      [4, "Số lượng vắng không phép", statistics.unexcusedCount, `${((statistics.unexcusedCount / statistics.totalStaff) * 100).toFixed(1)}%`, statistics.unexcusedCount === 0 ? "Không có" : "Xem xét trừ điểm thi đua"],
      [5, "Tiến độ TTCM báo cáo sĩ số", `${statistics.reportedDepts} / ${statistics.totalDepts} Tổ`, `${((statistics.reportedDepts / statistics.totalDepts) * 100).toFixed(1)}%`, statistics.reportedDepts === statistics.totalDepts ? "Đạt 100% các tổ" : "Còn tổ chưa báo cáo"],
      [],
      ["II. CHI TIẾT SĨ SỐ BÁO CÁO THEO TỪNG TỔ CHUYÊN MÔN"],
      [
        "STT", "Tổ Chuyên Môn", "Tổng Sĩ Số", "Có Mặt", "Tỷ Lệ (%)", "Vắng Có Phép", "Vắng K.Phép", "Trạng Thái Báo Cáo", "Tổ Trưởng (TTCM) Báo Cáo", "Thời Gian Nộp", "Ý Kiến / Kiến Nghị Của Tổ"
      ]
    ];

    departments.forEach((dept, idx) => {
      const rep = deptReports.find(r => r.department === dept);
      const deptStaff = staffList.filter(s => s.department === dept);
      const totalInDept = rep?.total_members || deptStaff.length;
      const presentInDept = rep ? rep.present_count : attendances.filter(a => a.department === dept && a.status === 'PRESENT').length;
      const excusedInDept = rep ? rep.excused_count : attendances.filter(a => a.department === dept && a.status === 'EXCUSED').length;
      const unexcusedInDept = rep ? rep.unexcused_count : attendances.filter(a => a.department === dept && a.status === 'UNEXCUSED').length;
      const pct = totalInDept > 0 ? ((presentInDept / totalInDept) * 100).toFixed(1) : '0.0';

      sheet1Rows.push([
        idx + 1,
        dept,
        totalInDept,
        presentInDept,
        `${pct}%`,
        excusedInDept,
        unexcusedInDept,
        rep ? "✅ ĐÃ BÁO CÁO" : "⏳ CHƯA BÁO CÁO",
        rep ? `${rep.reporter_name} (${rep.reporter_role || 'TTCM'})` : "-",
        rep ? new Date(rep.reported_at).toLocaleTimeString('vi-VN') : "-",
        rep?.note || ""
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
    ws1['!cols'] = [
      { wch: 6 },  { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 28 }, { wch: 15 }, { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws1, "TONG_HOP_SI_SO_TO");

    // -----------------------------------------------------------------------
    // SHEET 2: DANH SÁCH ĐIỂM DANH CHI TIẾT
    // -----------------------------------------------------------------------
    const sheet2Rows = [
      ["SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", "", "", ""],
      ["TRƯỜNG THPT CAO BÁ QUÁT", "", "", "", "Độc lập - Tự do - Hạnh phúc", "", "", ""],
      [],
      [`DANH SÁCH CHI TIẾT CÁN BỘ - GIÁO VIÊN ĐIỂM DANH: ${currentMeeting.title.toUpperCase()}`],
      [`Thời gian xuất: ${today.toLocaleString('vi-VN')}`],
      [],
      [
        "STT", "Họ và Tên", "Tổ Chuyên Môn", "Chức Vụ", "Thời Gian Check-in", "Trạng Thái", "Hình Thức Xác Nhận", "Câu Trả Lời Biểu Quyết", "Thiết Bị / Ghi Chú"
      ]
    ];

    staffList.forEach((s, idx) => {
      const att = attendances.find(a => a.staff_name.toLowerCase().trim() === s.name.toLowerCase().trim());
      const statusText = att ? (att.status === 'PRESENT' ? 'Có mặt' : (att.status === 'EXCUSED' ? 'Vắng có phép' : 'Vắng không phép')) : 'Chưa điểm danh';
      const verifyType = att?.verified_by_ttcm ? `TTCM xác nhận (${att.verified_by_name || 'Tổ trưởng'})` : (att ? 'Tự điểm danh (Mã OTP)' : '-');

      sheet2Rows.push([
        idx + 1,
        s.name,
        s.department || "Chưa phân tổ",
        s.title || "Giáo viên",
        att ? new Date(att.checkin_time).toLocaleTimeString('vi-VN') : "-",
        statusText,
        verifyType,
        att?.poll_answer || "-",
        att?.note || (att?.device_info ? 'Web Mobile' : '-')
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
    ws2['!cols'] = [
      { wch: 6 }, { wch: 26 }, { wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 25 }, { wch: 30 }
    ];
    ws2['!autofilter'] = { ref: `A7:I${sheet2Rows.length}` };
    XLSX.utils.book_append_sheet(workbook, ws2, "DANH_SACH_CHI_TIET");

    // Tải file
    const cleanTitle = currentMeeting.title.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `Bao_cao_hop_online_${cleanTitle}_${dateStr}.xlsx`);
  };

  // =========================================================================
  // LỌC DANH SÁCH HIỂN THỊ
  // =========================================================================
  const filteredStaffList = useMemo(() => {
    return staffList.filter(s => {
      const matchDept = deptFilter === 'ALL' || s.department === deptFilter;
      const att = attendances.find(a => a.staff_name.toLowerCase().trim() === s.name.toLowerCase().trim());
      const currentStatus = att ? att.status : 'UNREPORTED';
      const matchStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
      const matchSearch = !searchQuery.trim() || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.department || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchStatus && matchSearch;
    });
  }, [staffList, attendances, deptFilter, statusFilter, searchQuery]);

  return (
    <Layout title="💻 Điểm Danh Họp Trực Tuyến & Báo Cáo Sĩ Số">
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
        
        {/* TOAST THÔNG BÁO */}
        {copiedToast && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
            backgroundColor: '#15803d', color: '#fff', padding: '12px 20px',
            borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
          }}>
            <Check size={18} /> {copiedToast}
          </div>
        )}

        {/* 1. KHỐI TIÊU ĐỀ & CHỌN CUỘC HỌP */}
        <div style={{ 
          backgroundColor: '#fff', padding: '20px 24px', borderRadius: '12px', 
          border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          marginBottom: '20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Trường THPT Cao Bá Quát • Hệ Thống Điều Hành Trực Tuyến
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={24} color="#0284c7" /> Điểm Danh Họp Trực Tuyến & Báo Cáo Sĩ Số
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Phiên họp:</span>
              <select 
                value={selectedMeetingId}
                onChange={e => setSelectedMeetingId(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '14px', fontWeight: 'bold', color: '#0f172a', backgroundColor: '#f8fafc',
                  maxWidth: '320px', cursor: 'pointer'
                }}
              >
                {meetings.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({new Date(m.meeting_date).toLocaleDateString('vi-VN')})
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => handleOpenMeetingModal()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px',
                fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Tạo Phiên Họp
            </button>

            <button 
              onClick={() => setShowSqlModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
                backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
                borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
              }}
              title="Xem câu lệnh SQL cấu hình cơ sở dữ liệu Supabase"
            >
              <ShieldCheck size={15} color="#0284c7" /> SQL CSDL
            </button>
          </div>
        </div>

        {/* 2. BẢNG ĐIỀU HÀNH LIVE (HOST CONTROL PANEL) */}
        {!currentMeeting && (
          <div style={{
            backgroundColor: '#fff', borderRadius: '14px', padding: '36px 20px',
            border: '2px dashed #cbd5e1', textAlign: 'center', marginBottom: '24px'
          }}>
            <Video size={48} color="#0284c7" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
              Chưa có phiên họp nào được chọn hoặc được tạo
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              Thầy/Cô vui lòng nhấn nút bên dưới để tạo phiên họp mới (Trực tiếp tại Hội trường, Trực tuyến Meet/Zoom, hoặc Hỗn hợp) để bắt đầu:
            </p>
            <button
              onClick={() => handleOpenMeetingModal()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px',
                backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px',
                fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Plus size={18} /> + Tạo Phiên Họp Mới Ngay
            </button>
          </div>
        )}

        {currentMeeting && (
          <div style={{
            backgroundColor: '#0f172a', color: '#fff', borderRadius: '14px',
            padding: '24px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
            border: '1px solid #1e293b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    backgroundColor: currentMeeting.is_checkin_open ? '#10b981' : '#64748b', 
                    color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px' 
                  }}>
                    {currentMeeting.is_checkin_open ? '🔴 ĐANG MỞ ĐIỂM DANH' : '⚪ ĐÃ ĐÓNG ĐIỂM DANH'}
                  </span>
                  <span style={{ 
                    backgroundColor: currentMeeting.ttcm_reporting_open ? '#f59e0b' : '#334155', 
                    color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px' 
                  }}>
                    {currentMeeting.ttcm_reporting_open ? '📢 ĐANG YÊU CẦU TTCM BÁO CÁO' : 'TẮT BÁO CÁO TTCM'}
                  </span>
                  <span style={{ 
                    backgroundColor: currentMeeting.meeting_format === 'OFFLINE' ? '#2563eb' : (currentMeeting.meeting_format === 'ONLINE' ? '#7c3aed' : '#0891b2'), 
                    color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px' 
                  }}>
                    {currentMeeting.meeting_format === 'OFFLINE' ? '🏢 TRỰC TIẾP' : (currentMeeting.meeting_format === 'ONLINE' ? '💻 TRỰC TUYẾN' : '🌐 HỖN HỢP')}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                    Loại: {currentMeeting.meeting_type} • Ngày: {new Date(currentMeeting.meeting_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>
                  {currentMeeting.title}
                </h3>
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13px' }}>
                  {currentMeeting.location && (
                    <span style={{ color: '#cbd5e1' }}>
                      📍 <strong>Địa điểm:</strong> {currentMeeting.location}
                    </span>
                  )}
                  {currentMeeting.meeting_link && (
                    <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ExternalLink size={14} /> Link Meet/Zoom: <a href={currentMeeting.meeting_link} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>{currentMeeting.meeting_link}</a>
                    </span>
                  )}
                </div>
              </div>

              {/* KHỐI MÃ OTP & ĐẾM NGƯỢC */}
              <div style={{ 
                backgroundColor: '#1e293b', padding: '12px 20px', borderRadius: '10px', 
                border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '20px' 
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>MÃ PHIÊN HỌP (OTP)</div>
                  <div style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '4px', color: '#38bdf8' }}>
                    {currentMeeting.checkin_code || '------'}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid #334155', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>THỜI GIAN CÒN LẠI</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: countdownSeconds > 0 ? (countdownSeconds < 60 ? '#f43f5e' : '#10b981') : '#64748b' }}>
                    {countdownSeconds > 0 
                      ? `${Math.floor(countdownSeconds / 60)}:${(countdownSeconds % 60).toString().padStart(2, '0')}`
                      : 'Hết giờ'}
                  </div>
                </div>

                <button
                  onClick={() => setShowOtpModal(true)}
                  style={{
                    backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '10px 14px',
                    borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                  title="Chiếu mã QR và mã OTP to lên màn hình Hội trường hoặc Google Meet"
                >
                  <QrCode size={16} /> Chiếu QR & OTP Hội Trường
                </button>
              </div>
            </div>

            {/* THANH CÔNG CỤ ĐIỀU HÀNH */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #334155', paddingTop: '16px' }}>
              <button
                onClick={() => handleStartCheckin(5)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                  backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                <Play size={16} /> Mở Điểm Danh 5 Phút
              </button>

              <button
                onClick={() => handleStartCheckin(10)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                <Play size={16} /> Mở 10 Phút
              </button>

              <button
                onClick={handleToggleCheckin}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                  backgroundColor: currentMeeting.is_checkin_open ? '#e11d48' : '#475569',
                  color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                <Square size={16} /> {currentMeeting.is_checkin_open ? 'Khóa Điểm Danh Ngay' : 'Mở Lại Cổng'}
              </button>

              <button
                onClick={handleToggleTtcmReporting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                  backgroundColor: currentMeeting.ttcm_reporting_open ? '#f59e0b' : '#d97706',
                  color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                <Users size={16} /> {currentMeeting.ttcm_reporting_open ? '🔔 Đang Yêu Cầu TTCM Báo Cáo' : '📢 Yêu Cầu TTCM Báo Cáo Sĩ Số'}
              </button>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopyZaloReminder}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    backgroundColor: '#be123c', color: '#fff', border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                  }}
                  title="Xuất tin nhắn Zalo kèm danh sách đôn đốc giáo viên chưa điểm danh & tổ chưa báo cáo"
                >
                  <MessageSquare size={16} /> 📲 Nhắn Zalo Đôn Đốc
                </button>

                <button
                  onClick={exportDecree30Word}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                  }}
                  title="Xuất biên bản cuộc họp Word (.doc) theo chuẩn Nghị định 30/2020/NĐ-CP"
                >
                  <Printer size={16} /> 📄 Biên Bản (NĐ 30)
                </button>

                <button
                  onClick={exportExcelPro}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                  }}
                  title="Xuất file Excel Pro 3 Sheet đầy đủ tổng hợp và chi tiết"
                >
                  <Download size={16} /> 📥 Xuất Excel Pro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. THỐNG KÊ NHANH (KPI CARDS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>TỔNG SỐ TRIỆU TẬP</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>{statistics.totalStaff}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Cán bộ, GV toàn trường</div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>ĐÃ CÓ MẶT HỢP LỆ</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#15803d', margin: '4px 0' }}>
              {statistics.presentCount} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>({statistics.presentPct}%)</span>
            </div>
            <div style={{ fontSize: '12px', color: '#166534' }}>Xác nhận qua OTP / TTCM</div>
          </div>

          <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '10px', border: '1px solid #fef08a' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#854d0e', textTransform: 'uppercase' }}>VẮNG CÓ PHÉP</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#a16207', margin: '4px 0' }}>{statistics.excusedCount}</div>
            <div style={{ fontSize: '12px', color: '#854d0e' }}>Bận dạy, công tác, ốm</div>
          </div>

          <div style={{ backgroundColor: '#fff1f2', padding: '16px', borderRadius: '10px', border: '1px solid #fecdd3' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9f1239', textTransform: 'uppercase' }}>CHƯA ĐIỂM DANH / VẮNG</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#e11d48', margin: '4px 0' }}>
              {statistics.unreportedCount + statistics.unexcusedCount}
            </div>
            <div style={{ fontSize: '12px', color: '#9f1239' }}>Cần đôn đốc vào họp</div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase' }}>TTCM BÁO CÁO SĨ SỐ</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#2563eb', margin: '4px 0' }}>
              {statistics.reportedDepts} / {statistics.totalDepts}
            </div>
            <div style={{ fontSize: '12px', color: '#1e40af' }}>
              {statistics.reportedDepts === statistics.totalDepts ? '✅ Đã hoàn thành 100%' : '⏳ Đang chờ các tổ nộp'}
            </div>
          </div>
        </div>

        {/* 4. CHUYỂN ĐỔI TAB */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('departments')}
            style={{
              padding: '10px 18px', border: 'none', borderBottom: activeTab === 'departments' ? '3px solid #0284c7' : 'none',
              backgroundColor: 'transparent', fontWeight: 'bold', fontSize: '14px',
              color: activeTab === 'departments' ? '#0284c7' : '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Users size={16} /> 🏢 Báo Cáo Sĩ Số Tổ Chuyên Môn ({statistics.reportedDepts}/{statistics.totalDepts})
          </button>

          <button
            onClick={() => setActiveTab('attendances')}
            style={{
              padding: '10px 18px', border: 'none', borderBottom: activeTab === 'attendances' ? '3px solid #0284c7' : 'none',
              backgroundColor: 'transparent', fontWeight: 'bold', fontSize: '14px',
              color: activeTab === 'attendances' ? '#0284c7' : '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <CheckCircle2 size={16} /> 👥 Danh Sách Điểm Danh Toàn Trường ({attendances.length}/{staffList.length})
          </button>

          <button
            onClick={() => setActiveTab('meetings')}
            style={{
              padding: '10px 18px', border: 'none', borderBottom: activeTab === 'meetings' ? '3px solid #0284c7' : 'none',
              backgroundColor: 'transparent', fontWeight: 'bold', fontSize: '14px',
              color: activeTab === 'meetings' ? '#0284c7' : '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <FileText size={16} /> ⚙️ Quản Lý Cuộc Họp ({meetings.length})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: BÁO CÁO SĨ SỐ THEO TỪNG TỔ CHUYÊN MÔN (TTCM)                       */}
        {/* ========================================================================= */}
        {activeTab === 'departments' && (
          <div>
            {/* THANH ĐIỀU HƯỚNG THƯ KÝ NHẬP BÁO CÁO ZALO */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '12px',
              border: '1px solid #e2e8f0', marginBottom: '18px', flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  Tiến độ tiếp nhận báo cáo của các Tổ Chuyên Môn ({statistics.reportedDepts} / {statistics.totalDepts} Tổ)
                </h4>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                  💡 <strong>Dành cho Thư ký / Quản trị:</strong> Nếu Tổ trưởng đã nhắn báo cáo sĩ số qua Zalo hoặc báo trực tiếp bằng miệng, Thầy/Cô có thể bấm nút bên cạnh hoặc bấm nút trên từng tổ để nhập vào hệ thống ngay.
                </div>
              </div>

              <button
                onClick={() => handleOpenDeptReportModal(departments[0])}
                style={{
                  padding: '9px 16px', backgroundColor: '#15803d', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)'
                }}
              >
                <Plus size={16} /> 📲 Nhập Báo Cáo Sĩ Số Từ Zalo
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {departments.map(dept => {
                const rep = deptReports.find(r => r.department === dept);
                const deptStaff = staffList.filter(s => s.department === dept);
                const totalInDept = rep?.total_members || deptStaff.length;
                const presentInDept = rep ? rep.present_count : attendances.filter(a => a.department === dept && a.status === 'PRESENT').length;
                const excusedInDept = rep ? rep.excused_count : attendances.filter(a => a.department === dept && a.status === 'EXCUSED').length;
                const unexcusedInDept = rep ? rep.unexcused_count : attendances.filter(a => a.department === dept && a.status === 'UNEXCUSED').length;
                const isReported = Boolean(rep);

                return (
                  <div key={dept} style={{
                    backgroundColor: '#fff', borderRadius: '12px', border: isReported ? '1px solid #86efac' : '1px solid #fecdd3',
                    padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                          {dept}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Tổng số giáo viên: <strong>{totalInDept}</strong> người
                        </span>
                      </div>

                      <span style={{
                        backgroundColor: isReported ? '#dcfce7' : '#fee2e2',
                        color: isReported ? '#166534' : '#991b1b',
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
                      }}>
                        {isReported ? '✅ Đã Báo Cáo' : '⏳ Chưa Báo Cáo'}
                      </span>
                    </div>

                    {/* SỐ LIỆU SĨ SỐ */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
                      <div style={{ backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>CÓ MẶT</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#15803d' }}>{presentInDept}</div>
                      </div>
                      <div style={{ backgroundColor: '#fefce8', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: 'bold' }}>VẮNG PHÉP</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#a16207' }}>{excusedInDept}</div>
                      </div>
                      <div style={{ backgroundColor: '#fff1f2', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#9f1239', fontWeight: 'bold' }}>K.PHÉP</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#e11d48' }}>{unexcusedInDept}</div>
                      </div>
                    </div>

                    {/* THÔNG TIN TTCM BÁO CÁO */}
                    {rep ? (
                      <div style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div><strong>Người báo cáo:</strong> {rep.reporter_name} ({rep.reporter_role || 'TTCM'})</div>
                        <div><strong>Thời gian nộp:</strong> {new Date(rep.reported_at).toLocaleTimeString('vi-VN')}</div>
                        {rep.note && (
                          <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#0369a1' }}>
                            <strong>Ý kiến tổ:</strong> "{rep.note}"
                          </div>
                        )}
                        {rep.absent_details && rep.absent_details.length > 0 && (
                          <div style={{ marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '4px', color: '#b91c1c' }}>
                            <strong>Danh sách vắng:</strong>
                            {rep.absent_details.map((ab, i) => (
                              <div key={i} style={{ fontSize: '11.5px' }}>• {ab.name} ({ab.reason || 'Có phép'})</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        Đang chờ Tổ trưởng chuyên môn xác nhận & gửi báo cáo sĩ số.
                      </div>
                    )}

                    {/* NÚT THƯ KÝ NHẬP / SỬA BÁO CÁO CHO TỔ */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => handleOpenDeptReportModal(dept)}
                        style={{
                          width: '100%', padding: '8px 12px',
                          backgroundColor: isReported ? '#f0fdf4' : '#eff6ff',
                          color: isReported ? '#15803d' : '#0284c7',
                          border: isReported ? '1px solid #bbf7d0' : '1px solid #bae6fd',
                          borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: '6px'
                        }}
                        title="Thư ký tự nhập hoặc chỉnh sửa số lượng sĩ số của tổ này theo tin nhắn Zalo"
                      >
                        <Edit3 size={14} /> {isReported ? 'Sửa Sĩ Số Tổ (Thư Ký / Zalo)' : 'Nhập Sĩ Số Tổ (Thư Ký / Zalo)'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DANH SÁCH ĐIỂM DANH TOÀN TRƯỜNG                                   */}
        {/* ========================================================================= */}
        {activeTab === 'attendances' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            
            {/* THANH LỌC & TÌM KIẾM */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Tổ CM:</span>
                <select 
                  value={deptFilter} 
                  onChange={e => setDeptFilter(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="ALL">Tất cả các tổ ({staffList.length})</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Trạng thái:</span>
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PRESENT">✅ Có mặt</option>
                  <option value="EXCUSED">🟡 Vắng có phép</option>
                  <option value="UNEXCUSED">🔴 Vắng không phép</option>
                  <option value="UNREPORTED">⏳ Chưa điểm danh</option>
                </select>
              </div>

              <div style={{ marginLeft: 'auto', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm theo tên giáo viên..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '6px 12px 6px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '240px' }}
                />
              </div>
            </div>

            {/* BẢNG DANH SÁCH GIÁO VIÊN */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '10px', width: '50px', textAlign: 'center' }}>STT</th>
                    <th style={{ padding: '10px' }}>Họ và Tên</th>
                    <th style={{ padding: '10px' }}>Tổ Chuyên Môn</th>
                    <th style={{ padding: '10px' }}>Chức Vụ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Thời Gian</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Trạng Thái</th>
                    <th style={{ padding: '10px' }}>Hình Thức Xác Nhận</th>
                    {currentMeeting?.poll_question && <th style={{ padding: '10px' }}>Ý Kiến Biểu Quyết</th>}
                    <th style={{ padding: '10px' }}>Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaffList.map((staff, idx) => {
                    const att = attendances.find(a => a.staff_name.toLowerCase().trim() === staff.name.toLowerCase().trim());
                    const isPresent = att?.status === 'PRESENT';
                    const isExcused = att?.status === 'EXCUSED';
                    const isUnexcused = att?.status === 'UNEXCUSED';

                    return (
                      <tr key={staff.id || idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>{staff.name}</td>
                        <td style={{ padding: '10px', color: '#334155' }}>{staff.department || 'Chưa phân tổ'}</td>
                        <td style={{ padding: '10px', color: '#64748b' }}>{staff.title || 'Giáo viên'}</td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#0369a1', fontFamily: 'monospace' }}>
                          {att ? new Date(att.checkin_time).toLocaleTimeString('vi-VN') : '-'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <select
                            value={att ? att.status : 'UNREPORTED'}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'UNREPORTED') return;
                              handleQuickUpdateStaffStatus(staff.name, staff.department, val);
                            }}
                            title="Bấm để Thư ký đổi nhanh trạng thái điểm danh cho giáo viên này"
                            style={{
                              padding: '5px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                              border: isPresent ? '1px solid #86efac' : (isExcused ? '1px solid #fde047' : (isUnexcused ? '1px solid #fca5a5' : '1px solid #cbd5e1')),
                              backgroundColor: isPresent ? '#dcfce7' : (isExcused ? '#fef9c3' : (isUnexcused ? '#fee2e2' : '#f8fafc')),
                              color: isPresent ? '#166534' : (isExcused ? '#854d0e' : (isUnexcused ? '#991b1b' : '#64748b')),
                              cursor: 'pointer', outline: 'none'
                            }}
                          >
                            <option value="PRESENT">✅ Có mặt</option>
                            <option value="EXCUSED">🟡 Vắng có phép</option>
                            <option value="UNEXCUSED">🔴 Vắng K.phép</option>
                            {!att && <option value="UNREPORTED">⏳ Chưa điểm danh</option>}
                          </select>
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px', color: '#475569' }}>
                          {att?.verified_by_ttcm ? (
                            <span style={{ color: '#d97706', fontWeight: 'bold' }}>TTCM xác nhận ({att.verified_by_name || 'Tổ trưởng'})</span>
                          ) : (att ? 'Tự điểm danh (OTP)' : '-')}
                        </td>
                        {currentMeeting?.poll_question && (
                          <td style={{ padding: '10px', fontSize: '12px', fontWeight: 'bold', color: '#15803d' }}>
                            {att?.poll_answer || '-'}
                          </td>
                        )}
                        <td style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>
                          {att?.note || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: QUẢN LÝ CUỘC HỌP & TẠO PHIÊN MỚI                                   */}
        {/* ========================================================================= */}
        {activeTab === 'meetings' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                Danh sách các phiên họp trực tuyến đã tạo
              </h3>
              <button
                onClick={() => handleOpenMeetingModal()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Tạo Phiên Họp Mới
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {meetings.map(m => (
                <div key={m.id} style={{
                  padding: '16px', borderRadius: '10px', border: m.id === selectedMeetingId ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: m.id === selectedMeetingId ? '#f0f9ff' : '#fff',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                        {m.meeting_type}
                      </span>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 'bold', 
                        backgroundColor: m.meeting_format === 'OFFLINE' ? '#dbeafe' : (m.meeting_format === 'ONLINE' ? '#f3e8ff' : '#cffafe'),
                        color: m.meeting_format === 'OFFLINE' ? '#1d4ed8' : (m.meeting_format === 'ONLINE' ? '#7e22ce' : '#0e7490'),
                        padding: '2px 6px', borderRadius: '4px' 
                      }}>
                        {m.meeting_format === 'OFFLINE' ? '🏢 Trực tiếp' : (m.meeting_format === 'ONLINE' ? '💻 Trực tuyến' : '🌐 Hỗn hợp')}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(m.meeting_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <h4 style={{ margin: '4px 0', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                      {m.title}
                    </h4>
                    {m.location && (
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        📍 {m.location}
                      </div>
                    )}
                    {m.meeting_link && (
                      <div style={{ fontSize: '12px', color: '#0284c7' }}>
                        Link: <a href={m.meeting_link} target="_blank" rel="noreferrer">{m.meeting_link}</a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSelectedMeetingId(m.id);
                        setActiveTab('departments');
                      }}
                      style={{ padding: '6px 12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Chọn Điều Hành
                    </button>
                    <button
                      onClick={() => handleOpenMeetingModal(m)}
                      style={{ padding: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                      title="Sửa"
                    >
                      <Edit3 size={15} color="#475569" />
                    </button>
                    <button
                      onClick={() => handleDeleteMeeting(m.id)}
                      style={{ padding: '6px', backgroundColor: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      title="Xóa"
                    >
                      <Trash2 size={15} color="#dc2626" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL CHIẾU MÃ QR & OTP TOÀN MÀN HÌNH (DÀNH CHO HỘI TRƯỜNG & GOOGLE MEET)  */}
        {/* ========================================================================= */}
        {showOtpModal && currentMeeting && (() => {
          const checkinUrlWithOtp = `${window.location.origin}/hop-online?id=${currentMeeting.id}&code=${currentMeeting.checkin_code}`;
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkinUrlWithOtp)}&margin=10`;

          return (
            <div style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.96)',
              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{
                backgroundColor: '#1e293b', border: '2px solid #38bdf8', borderRadius: '24px',
                padding: '32px 36px', maxWidth: '1050px', width: '100%', color: '#fff',
                boxShadow: '0 25px 60px -10px rgba(0,0,0,0.7)', position: 'relative'
              }}>
                <button
                  onClick={() => setShowOtpModal(false)}
                  style={{
                    position: 'absolute', top: '18px', right: '18px', background: '#334155',
                    border: 'none', color: '#94a3b8', width: '36px', height: '36px', borderRadius: '50%',
                    fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Đóng màn chiếu"
                >
                  ✕
                </button>

                {/* HEADER TRÊN CÙNG */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    TRƯỜNG THPT CAO BÁ QUÁT • CỔNG ĐIỂM DANH CUỘC HỌP
                  </div>

                  <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '6px 0 10px', color: '#f8fafc' }}>
                    {currentMeeting.title}
                  </h2>

                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '13px' }}>
                    <span style={{
                      backgroundColor: currentMeeting.meeting_format === 'OFFLINE' ? '#2563eb' : (currentMeeting.meeting_format === 'ONLINE' ? '#7c3aed' : '#0891b2'),
                      color: '#fff', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold'
                    }}>
                      {currentMeeting.meeting_format === 'OFFLINE' ? '🏢 HỌP TRỰC TIẾP' : (currentMeeting.meeting_format === 'ONLINE' ? '💻 HỌP TRỰC TUYẾN' : '🌐 HỌP HỖN HỢP')}
                    </span>
                    {currentMeeting.location && (
                      <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                        📍 {currentMeeting.location}
                      </span>
                    )}
                    <span style={{ color: '#94a3b8' }}>
                      📅 {new Date(currentMeeting.meeting_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* KHỐI 2 CỘT: CỘT TRÁI QR CODE - CỘT PHẢI MÃ OTP & TIẾN ĐỘ SĨ SỐ */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr',
                  gap: '28px', alignItems: 'center', backgroundColor: '#0f172a',
                  padding: '24px', borderRadius: '20px', border: '1px solid #334155'
                }}>
                  {/* CỘT TRÁI: MÃ QR CODE */}
                  <div style={{ textAlign: 'center', borderRight: '1px solid #334155', paddingRight: '20px' }}>
                    <div style={{
                      backgroundColor: '#fff', padding: '12px', borderRadius: '16px',
                      display: 'inline-block', boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                      border: '3px solid #38bdf8'
                    }}>
                      <img 
                        src={qrImageUrl} 
                        alt="QR Code Điểm danh"
                        style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
                      />
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>
                      📱 Giơ Camera điện thoại quét mã QR
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.4' }}>
                      Tự động mở trang điểm danh & <strong>điền sẵn mã OTP</strong> trong 3 giây!
                    </div>
                  </div>

                  {/* CỘT PHẢI: MÃ OTP & ĐỒNG HỒ & TIẾN ĐỘ SĨ SỐ */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          MÃ SỐ PHIÊN HỌP (OTP NHẬP TAY)
                        </div>
                        <div style={{ fontSize: '52px', fontWeight: '900', letterSpacing: '6px', color: '#38bdf8', fontFamily: 'monospace', lineHeight: 1.1, margin: '4px 0' }}>
                          {currentMeeting.checkin_code || '------'}
                        </div>
                      </div>

                      {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
                      <div style={{ backgroundColor: '#1e293b', padding: '10px 18px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>THỜI GIAN CÒN LẠI</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: countdownSeconds > 0 ? (countdownSeconds < 60 ? '#f43f5e' : '#34d399') : '#64748b' }}>
                          {countdownSeconds > 0 
                            ? `${Math.floor(countdownSeconds / 60)}:${(countdownSeconds % 60).toString().padStart(2, '0')}`
                            : 'Đã hết giờ'}
                        </div>
                      </div>
                    </div>

                    {/* TIẾN ĐỘ SĨ SỐ LIVE TRỰC TIẾP TRÊN MÀN HÌNH */}
                    <div style={{ marginTop: '20px', backgroundColor: '#1e293b', padding: '16px', borderRadius: '14px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0' }}>
                          📊 Sĩ số đã có mặt: <strong style={{ color: '#34d399', fontSize: '16px' }}>{statistics.presentCount} / {statistics.totalStaff}</strong> đồng chí
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>
                          {statistics.presentPct}%
                        </span>
                      </div>

                      {/* PROGRESS BAR */}
                      <div style={{ width: '100%', height: '12px', backgroundColor: '#0f172a', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(0, Number(statistics.presentPct)))}%`,
                          height: '100%', backgroundColor: '#10b981',
                          borderRadius: '6px', transition: 'width 0.6s ease'
                        }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                        <span>🟡 Vắng có phép: <strong>{statistics.excusedCount}</strong></span>
                        <span>🔴 Chưa điểm danh: <strong>{statistics.unreportedCount + statistics.unexcusedCount}</strong></span>
                        <span>👥 TTCM đã báo cáo: <strong style={{ color: '#38bdf8' }}>{statistics.reportedDepts} / {statistics.totalDepts}</strong> Tổ</span>
                      </div>
                    </div>

                    {/* DÀNH CHO TTCM */}
                    <div style={{ marginTop: '12px', fontSize: '12.5px', color: '#cbd5e1', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px 14px', borderRadius: '10px' }}>
                      💡 <strong>Tổ trưởng Chuyên môn (TTCM):</strong> Có thể mở Tab <em>"Tổ Trưởng Báo Cáo Sĩ Số"</em> để điểm danh nhanh các thành viên trong tổ và nộp báo cáo cho BGH.
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTIONS */}
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    🔗 Link điểm danh: <strong style={{ color: '#38bdf8' }}>{window.location.origin}/hop-online</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleStartCheckin(5)}
                      style={{
                        padding: '8px 16px', backgroundColor: '#059669', color: '#fff', border: 'none',
                        borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      + Thêm 5 phút
                    </button>
                    <button
                      onClick={() => copyToClipboard(checkinUrlWithOtp, 'Đã sao chép link điểm danh kèm mã OTP!')}
                      style={{
                        padding: '8px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none',
                        borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Copy size={14} /> Sao chép link QR
                    </button>
                    <button
                      onClick={() => setShowOtpModal(false)}
                      style={{
                        padding: '8px 18px', backgroundColor: '#475569', color: '#fff', border: 'none',
                        borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* MODAL TẠO / SỬA CUỘC HỌP                                                 */}
        {/* ========================================================================= */}
        {showMeetingModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <form onSubmit={handleSaveMeeting} style={{
              backgroundColor: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '600px',
              width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                  {editingMeeting ? 'Cập Nhật Cuộc Họp' : 'Tạo Cuộc Họp Mới'}
                </h3>
                <button type="button" onClick={() => setShowMeetingModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Tên cuộc họp *</label>
                  <input 
                    type="text" required
                    placeholder="Ví dụ: Họp Hội đồng sư phạm tháng 9/2026..."
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Loại cuộc họp</label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    >
                      <option value="Hội đồng sư phạm">Hội đồng sư phạm</option>
                      <option value="Họp Chi bộ">Họp Chi bộ</option>
                      <option value="Họp Giao ban BGH">Họp Giao ban BGH</option>
                      <option value="Họp Tổ chuyên môn">Họp Tổ chuyên môn</option>
                      <option value="Hội nghị Cán bộ - Viên chức">Hội nghị Cán bộ - Viên chức</option>
                      <option value="Họp đột xuất">Họp đột xuất</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#0369a1' }}>
                      Hình thức tổ chức *
                    </label>
                    <select
                      value={formFormat}
                      onChange={e => setFormFormat(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '2px solid #0284c7', fontSize: '14px', fontWeight: 'bold', color: '#0369a1', backgroundColor: '#f0f9ff' }}
                    >
                      <option value="OFFLINE">🏢 Họp Trực Tiếp (Hội trường/Phòng)</option>
                      <option value="ONLINE">💻 Họp Trực Tuyến (Meet / Zoom)</option>
                      <option value="HYBRID">🌐 Họp Hỗn Hợp (Trực tiếp + Online)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Địa điểm tổ chức / Phòng họp
                    </label>
                    <input 
                      type="text"
                      placeholder="Ví dụ: Hội trường lớn, Phòng họp 1..."
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Ngày họp</label>
                    <input 
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Link Google Meet / Zoom {formFormat === 'OFFLINE' ? '(Tùy chọn)' : '(Dành cho thành viên online)'}
                  </label>
                  <input 
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={formLink}
                    onChange={e => setFormLink(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Câu hỏi biểu quyết / Lấy ý kiến (Tùy chọn)</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: Thầy/Cô có nhất trí với dự thảo Quy chế thi đua không?"
                    value={formPollQuestion}
                    onChange={e => setFormPollQuestion(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Các phương án biểu quyết (ngăn cách bởi dấu phẩy)</label>
                  <input 
                    type="text"
                    placeholder="Nhất trí 100%, Có ý kiến đề xuất khác"
                    value={formPollOptions}
                    onChange={e => setFormPollOptions(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Lưu Cuộc Họp
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL THƯ KÝ NHẬP / SỬA BÁO CÁO SĨ SỐ CHO TỔ (THEO ZALO HOẶC TRỰC TIẾP)   */}
        {/* ========================================================================= */}
        {showDeptReportModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '780px',
              width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
              {/* HEADER MODAL */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      Thư Ký / Quản Trị Nhập Báo Cáo
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {currentMeeting?.title}
                    </span>
                  </div>
                  <h3 style={{ margin: '6px 0 0', fontSize: '19px', fontWeight: '900', color: '#0f172a' }}>
                    📝 Báo Cáo Sĩ Số Tổ: {modalDept}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeptReportModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {/* BODY MODAL SCROLLABLE */}
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '6px' }}>
                <form id="deptReportForm" onSubmit={handleSaveDeptReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* DÒNG 1: CHỌN TỔ & NGUỒN BÁO CÁO */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                        1. Tổ Chuyên Môn *
                      </label>
                      <select
                        value={modalDept}
                        onChange={e => handleModalDeptChange(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '2px solid #0284c7', fontSize: '14px', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#f0f9ff' }}
                      >
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                        2. Nguồn tiếp nhận thông tin *
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                          { id: 'ZALO', label: '📲 Báo qua Zalo' },
                          { id: 'DIRECT', label: '🏢 Báo tại Hội trường' },
                          { id: 'SECRETARY', label: '📋 Thư ký điểm danh' }
                        ].map(src => (
                          <button
                            key={src.id}
                            type="button"
                            onClick={() => setModalReportSource(src.id)}
                            style={{
                              flex: 1, padding: '8px 4px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                              border: modalReportSource === src.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              backgroundColor: modalReportSource === src.id ? '#e0f2fe' : '#fff',
                              color: modalReportSource === src.id ? '#0284c7' : '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            {src.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                        3. Người báo cáo (TTCM) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Thầy Phan Văn A (TTCM)"
                        value={modalReporterName}
                        onChange={e => setModalReporterName(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>
                  </div>

                  {/* DÒNG 2: PHƯƠNG THỨC NHẬP */}
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setModalReportMode('MEMBERS')}
                      style={{
                        padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 'bold',
                        backgroundColor: modalReportMode === 'MEMBERS' ? '#0284c7' : '#f1f5f9',
                        color: modalReportMode === 'MEMBERS' ? '#fff' : '#475569'
                      }}
                    >
                      👥 Danh Sách Từng Giáo Viên Trong Tổ ({staffList.filter(s => s.department === modalDept).length} người)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalReportMode('COUNTS')}
                      style={{
                        padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 'bold',
                        backgroundColor: modalReportMode === 'COUNTS' ? '#0284c7' : '#f1f5f9',
                        color: modalReportMode === 'COUNTS' ? '#fff' : '#475569'
                      }}
                    >
                      🔢 Nhập Số Lượng Gộp Nhanh (Dành cho họp cũ / Zalo chỉ gửi số)
                    </button>
                  </div>

                  {/* CHẾ ĐỘ 1: TÍCH CHỌN DANH SÁCH GIÁO VIÊN */}
                  {modalReportMode === 'MEMBERS' && (() => {
                    const deptMembers = staffList.filter(s => s.department === modalDept);
                    let calcPresent = 0;
                    let calcExcused = 0;
                    let calcUnexcused = 0;
                    deptMembers.forEach(m => {
                      const st = modalMemberStatuses[m.name]?.status || 'PRESENT';
                      if (st === 'PRESENT') calcPresent++;
                      else if (st === 'EXCUSED') calcExcused++;
                      else calcUnexcused++;
                    });

                    return (
                      <div>
                        {/* THANH TỔNG HỢP NHANH */}
                        <div style={{
                          backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px',
                          border: '1px solid #e2e8f0', marginBottom: '12px', display: 'flex',
                          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span>Tổng số: <strong>{deptMembers.length}</strong></span>
                            <span style={{ color: '#16a34a' }}>🟢 Có mặt: <strong>{calcPresent}</strong></span>
                            <span style={{ color: '#ca8a04' }}>🟡 Vắng phép: <strong>{calcExcused}</strong></span>
                            <span style={{ color: '#dc2626' }}>🔴 K.phép: <strong>{calcUnexcused}</strong></span>
                          </div>

                          <button
                            type="button"
                            onClick={handleSetAllMembersPresent}
                            style={{
                              padding: '5px 12px', backgroundColor: '#dcfce7', color: '#166534',
                              border: '1px solid #86efac', borderRadius: '6px', fontSize: '12px',
                              fontWeight: 'bold', cursor: 'pointer'
                            }}
                          >
                            ✅ Đánh dấu tất cả Có Mặt
                          </button>
                        </div>

                        {/* DANH SÁCH THÀNH VIÊN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                          {deptMembers.map(staff => {
                            const cur = modalMemberStatuses[staff.name] || { status: 'PRESENT', reason: '' };

                            return (
                              <div key={staff.id || staff.name} style={{
                                padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                backgroundColor: cur.status === 'PRESENT' ? '#fff' : (cur.status === 'EXCUSED' ? '#fefce8' : '#fef2f2'),
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
                              }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#0f172a' }}>
                                    {staff.name}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                    {staff.title || 'Giáo viên'}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleModalMemberStatusChange(staff.name, 'status', 'PRESENT')}
                                    style={{
                                      padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                      border: cur.status === 'PRESENT' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                                      backgroundColor: cur.status === 'PRESENT' ? '#dcfce7' : '#fff',
                                      color: cur.status === 'PRESENT' ? '#166534' : '#64748b', cursor: 'pointer'
                                    }}
                                  >
                                    🟢 Có mặt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleModalMemberStatusChange(staff.name, 'status', 'EXCUSED')}
                                    style={{
                                      padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                      border: cur.status === 'EXCUSED' ? '2px solid #ca8a04' : '1px solid #cbd5e1',
                                      backgroundColor: cur.status === 'EXCUSED' ? '#fef9c3' : '#fff',
                                      color: cur.status === 'EXCUSED' ? '#854d0e' : '#64748b', cursor: 'pointer'
                                    }}
                                  >
                                    🟡 Vắng phép
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleModalMemberStatusChange(staff.name, 'status', 'UNEXCUSED')}
                                    style={{
                                      padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                      border: cur.status === 'UNEXCUSED' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                                      backgroundColor: cur.status === 'UNEXCUSED' ? '#fee2e2' : '#fff',
                                      color: cur.status === 'UNEXCUSED' ? '#991b1b' : '#64748b', cursor: 'pointer'
                                    }}
                                  >
                                    🔴 K.phép
                                  </button>

                                  {cur.status !== 'PRESENT' && (
                                    <input
                                      type="text"
                                      placeholder="Lý do vắng (ốm, công tác...)"
                                      value={cur.reason || ''}
                                      onChange={e => handleModalMemberStatusChange(staff.name, 'reason', e.target.value)}
                                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', width: '160px' }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {deptMembers.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontStyle: 'italic' }}>
                              Chưa có danh sách giáo viên của tổ này. Thầy/Cô vui lòng chuyển sang tab <strong>"Nhập số lượng gộp"</strong> để điền số liệu.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* CHẾ ĐỘ 2: NHẬP SỐ LƯỢNG GỘP NHANH */}
                  {modalReportMode === 'COUNTS' && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                            Số lượng Có mặt *
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={modalManualPresent}
                            onChange={e => setModalManualPresent(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #86efac', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', color: '#15803d' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#854d0e', marginBottom: '4px' }}>
                            Vắng có phép
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={modalManualExcused}
                            onChange={e => setModalManualExcused(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #fde047', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', color: '#a16207' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#991b1b', marginBottom: '4px' }}>
                            Vắng không phép
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={modalManualUnexcused}
                            onChange={e => setModalManualUnexcused(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #fca5a5', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', color: '#e11d48' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                          Danh sách giáo viên vắng & lý do (nếu có):
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Thầy Trần Văn B (ốm), Cô Nguyễn Thị C (bận việc riêng có phép)..."
                          value={modalAbsentNote}
                          onChange={e => setModalAbsentNote(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* GHI CHÚ CHUNG CỦA TỔ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                      Ý kiến / Ghi chú của Tổ chuyên môn (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tổ thống nhất cao với các nội dung BGH triển khai..."
                      value={modalDeptNote}
                      onChange={e => setModalDeptNote(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </form>
              </div>

              {/* FOOTER MODAL */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowDeptReportModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  form="deptReportForm"
                  disabled={submittingDeptReport}
                  style={{
                    padding: '9px 24px', backgroundColor: '#15803d', color: '#fff', border: 'none',
                    borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: submittingDeptReport ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)'
                  }}
                >
                  <Check size={18} /> {submittingDeptReport ? 'Đang lưu...' : 'LƯU BÁO CÁO SĨ SỐ TỔ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL SQL SCHEMA CHO SUPABASE                                            */}
        {/* ========================================================================= */}
        {showSqlModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '650px',
              width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>
                  📜 Câu Lệnh SQL Tạo Bảng Supabase
                </h3>
                <button onClick={() => setShowSqlModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>
                Hệ thống hiện tại đã tích hợp sẵn cơ chế lưu dữ liệu tự động. Nếu trường muốn lưu vĩnh viễn trên Supabase cho mọi thiết bị, hãy sao chép đoạn mã SQL dưới đây và dán vào <strong>Supabase SQL Editor</strong> rồi nhấn RUN:
              </p>
              <textarea 
                readOnly
                value={OnlineMeetingService.getSupabaseSqlSchema()}
                style={{
                  width: '100%', flex: 1, minHeight: '260px', fontFamily: 'monospace',
                  fontSize: '12px', padding: '12px', backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1', borderRadius: '8px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  onClick={() => copyToClipboard(OnlineMeetingService.getSupabaseSqlSchema(), 'Đã sao chép mã SQL vào bộ nhớ tạm!')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                    backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px',
                    fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  <Copy size={16} /> Sao Chép Mã SQL
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
