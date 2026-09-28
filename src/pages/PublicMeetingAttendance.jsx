import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Video, CheckCircle2, Clock, Users, AlertCircle, ArrowLeft, 
  Send, ExternalLink, ShieldCheck, Check, MessageSquare, AlertTriangle 
} from 'lucide-react';
import { OnlineMeetingService, DEFAULT_DEPARTMENTS } from '../services/onlineMeetingService';

const ABSENT_REASONS = [
  'Nghỉ ốm',
  'Đi công tác theo phân công của Sở / Trường',
  'Bận dạy bồi dưỡng HSG / Coi thi',
  'Việc riêng gia đình có đơn xin phép BGH',
  'Lý do khác'
];

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

      if (meetingIdParam && allMeetings.some(m => m.id === meetingIdParam)) {
        setSelectedMeetingId(meetingIdParam);
      } else if (allMeetings.length > 0) {
        setSelectedMeetingId(allMeetings[0].id);
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

  // Khởi tạo trạng thái thành viên cho TTCM
  useEffect(() => {
    if (ttcmDeptStaffMembers.length > 0) {
      const initial = {};
      ttcmDeptStaffMembers.forEach(s => {
        const existingAtt = attendances.find(a => a.staff_name.toLowerCase().trim() === s.name.toLowerCase().trim());
        initial[s.name] = {
          status: existingAtt ? existingAtt.status : 'PRESENT',
          reason: existingAtt?.note || ''
        };
      });
      setTtcmMemberStatuses(initial);
    }
  }, [ttcmDeptStaffMembers, attendances]);

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
        setCheckinSuccessData(res.attendance);
        await loadMeetingData(selectedMeetingId);
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
        verifiedAttendances
      });

      if (res.success) {
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '20px 16px 60px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* NÚT QUAY LẠI */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0369a1', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Trang chủ Cổng tiện ích
          </Link>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Trường THPT Cao Bá Quát</span>
        </div>

        {/* HEADER CHÍNH */}
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
          marginBottom: '20px', textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#e0f2fe',
            color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px'
          }}>
            <Video size={15} /> ĐIỂM DANH TRỰC TUYẾN • THPT CAO BÁ QUÁT
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 10px' }}>
            Cổng Điểm Danh Cuộc Họp & Báo Cáo Sĩ Số
          </h1>

          {/* CHỌN PHIÊN HỌP */}
          <div style={{ display: 'inline-block', maxWidth: '100%', marginTop: '6px' }}>
            <select
              value={selectedMeetingId}
              onChange={e => {
                setSelectedMeetingId(e.target.value);
                setCheckinSuccessData(null);
                setCheckinError('');
              }}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: '2px solid #0284c7',
                fontSize: '14px', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#f0f9ff',
                cursor: 'pointer', maxWidth: '100%'
              }}
            >
              {meetings.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} ({new Date(m.meeting_date).toLocaleDateString('vi-VN')})
                </option>
              ))}
            </select>
          </div>

          {currentMeeting && (
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                backgroundColor: currentMeeting.is_checkin_open ? '#dcfce7' : '#fee2e2',
                color: currentMeeting.is_checkin_open ? '#166534' : '#991b1b',
                padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
              }}>
                {currentMeeting.is_checkin_open ? '🔴 Đang Mở Điểm Danh' : '⚪ Đã Đóng Điểm Danh'}
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
                    fontSize: '12px', color: '#0284c7', fontWeight: 'bold', textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={14} /> Link Meet / Zoom
                </a>
              )}
            </div>
          )}
        </div>

        {/* THÔNG BÁO LÃNH ĐẠO YÊU CẦU TTCM BÁO CÁO (NỔI BẬT) */}
        {currentMeeting?.ttcm_reporting_open && (
          <div style={{
            backgroundColor: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '14px',
            padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center',
            gap: '14px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
          }}>
            <AlertTriangle size={28} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#92400e', textTransform: 'uppercase' }}>
                📢 LÃNH ĐẠO NHÀ TRƯỜNG ĐANG YÊU CẦU BÁO CÁO SĨ SỐ TỔ
              </div>
              <div style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
                Kính đề nghị các Thầy/Cô Tổ trưởng (TTCM) bấm vào Tab <strong>"Tổ Trưởng Báo Cáo Sĩ Số"</strong> bên dưới để điểm danh và gửi báo cáo sĩ số tổ gấp cho BGH!
              </div>
            </div>
          </div>
        )}

        {/* CHUYỂN ĐỔI TAB: GIÁO VIÊN vs TTCM */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
          backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '20px'
        }}>
          <button
            onClick={() => setActiveTab('teacher')}
            style={{
              padding: '12px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
              backgroundColor: activeTab === 'teacher' ? '#fff' : 'transparent',
              color: activeTab === 'teacher' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'teacher' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
            }}
          >
            <CheckCircle2 size={18} /> 1. Giáo Viên Tự Điểm Danh (OTP)
          </button>

          <button
            onClick={() => setActiveTab('ttcm')}
            style={{
              padding: '12px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
              backgroundColor: activeTab === 'ttcm' ? '#fff' : 'transparent',
              color: activeTab === 'ttcm' ? '#d97706' : '#64748b',
              boxShadow: activeTab === 'ttcm' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
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
            backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
          }}>
            {checkinSuccessData ? (
              <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{
                  width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#16a34a'
                }}>
                  <CheckCircle2 size={40} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#15803d', margin: '0 0 8px' }}>
                  BẠN ĐÃ ĐIỂM DANH THÀNH CÔNG!
                </h3>
                <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 20px' }}>
                  Hệ thống đã ghi nhận sự hiện diện của Thầy/Cô tại cuộc họp:
                </p>

                <div style={{
                  backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px',
                  border: '1px solid #e2e8f0', maxWidth: '400px', margin: '0 auto 24px', textAlign: 'left'
                }}>
                  <div style={{ marginBottom: '6px' }}><strong>Họ và Tên:</strong> {checkinSuccessData.staff_name}</div>
                  <div style={{ marginBottom: '6px' }}><strong>Tổ chuyên môn:</strong> {checkinSuccessData.department}</div>
                  <div style={{ marginBottom: '6px' }}><strong>Thời gian ghi nhận:</strong> {new Date(checkinSuccessData.checkin_time).toLocaleString('vi-VN')}</div>
                  {checkinSuccessData.poll_answer && (
                    <div style={{ color: '#0369a1' }}><strong>Ý kiến biểu quyết:</strong> {checkinSuccessData.poll_answer}</div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setCheckinSuccessData(null);
                    setCheckinOtp('');
                  }}
                  style={{
                    padding: '10px 20px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1',
                    borderRadius: '8px', color: '#475569', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  Điểm danh cho giáo viên khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleTeacherSubmit}>
                {checkinError && (
                  <div style={{
                    backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px',
                    borderRadius: '8px', fontSize: '13.5px', marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <AlertCircle size={18} /> {checkinError}
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
                      placeholder="Nhập 6 số (Ví dụ: 839201)"
                      value={checkinOtp}
                      onChange={e => setCheckinOtp(e.target.value)}
                      style={{
                        width: '100%', padding: '14px', borderRadius: '10px',
                        border: '2px solid #0284c7', fontSize: '22px', fontWeight: '900',
                        color: '#0284c7', letterSpacing: '4px', textAlign: 'center', backgroundColor: '#f0f9ff'
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
                    disabled={submittingCheckin}
                    style={{
                      padding: '14px 20px', backgroundColor: '#0284c7', color: '#fff',
                      border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900',
                      cursor: submittingCheckin ? 'not-allowed' : 'pointer', marginTop: '10px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)', display: 'flex',
                      justifyContent: 'center', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <Send size={18} /> {submittingCheckin ? 'Đang xác nhận...' : 'XÁC NHẬN CÓ MẶT NGAY'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DÀNH CHO TỔ TRƯỞNG CHUYÊN MÔN (TTCM BÁO CÁO SĨ SỐ)                  */}
        {/* ========================================================================= */}
        {activeTab === 'ttcm' && (
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
          }}>
            {ttcmSuccessMessage && (
              <div style={{
                backgroundColor: '#dcfce7', color: '#166534', padding: '16px',
                borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <CheckCircle2 size={24} /> {ttcmSuccessMessage}
              </div>
            )}

            <div style={{ marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#d97706" />
                <h3 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                  Tổ Trưởng Chuyên Môn (TTCM) Báo Cáo & Xác Nhận Sĩ Số Tổ
                </h3>
              </div>
              
              <div style={{
                marginTop: '10px', backgroundColor: '#fef3c7', padding: '12px 16px',
                borderRadius: '10px', border: '1px solid #fde68a', fontSize: '13px', color: '#92400e', lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📌 Hướng dẫn dành cho Quý Thầy/Cô Tổ trưởng (TTCM):</div>
                <div>• <strong>Họp trực tiếp tại Hội trường:</strong> Thầy/Cô chỉ cần nhìn nhanh hàng ghế tổ mình, kiểm tra ai có mặt / vắng phép / vắng k.phép, nhập lý do (nếu có) và nhấn nút <strong>"GỬI BÁO CÁO SĨ SỐ TỔ CHO BGH"</strong> bên dưới.</div>
                <div>• <strong>Họp trực tuyến qua Meet/Zoom:</strong> Thầy/Cô kiểm diện danh sách thành viên đang tham gia trong phòng họp và gửi báo cáo cho BGH.</div>
              </div>
            </div>

            <form onSubmit={handleTtcmSubmit}>
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
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                    Họ tên Tổ trưởng (TTCM) / Người báo cáo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thầy Phan Văn A"
                    value={ttcmReporterName}
                    onChange={e => setTtcmReporterName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* BẢNG KIỂM DIỆN TỪNG THÀNH VIÊN TRONG TỔ */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
                    Danh sách thành viên Tổ {ttcmDept} ({ttcmDeptStaffMembers.length} giáo viên):
                  </label>
                  <span style={{ fontSize: '12px', color: '#0369a1', fontStyle: 'italic' }}>
                    (Tích chọn trạng thái cho từng thầy cô)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ttcmDeptStaffMembers.map(staff => {
                    const selfAtt = attendances.find(a => a.staff_name.toLowerCase().trim() === staff.name.toLowerCase().trim());
                    const currentStatus = ttcmMemberStatuses[staff.name]?.status || 'PRESENT';
                    const currentReason = ttcmMemberStatuses[staff.name]?.reason || '';

                    return (
                      <div key={staff.id || staff.name} style={{
                        padding: '12px 14px', borderRadius: '10px',
                        border: currentStatus === 'PRESENT' ? '1px solid #bbf7d0' : (currentStatus === 'EXCUSED' ? '1px solid #fef08a' : '1px solid #fecdd3'),
                        backgroundColor: currentStatus === 'PRESENT' ? '#f0fdf4' : (currentStatus === 'EXCUSED' ? '#fefce8' : '#fff1f2'),
                        display: 'flex', flexDirection: 'column', gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{staff.name}</span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>({staff.title || 'Giáo viên'})</span>
                            {selfAtt ? (
                              <span style={{ marginLeft: '10px', fontSize: '11px', color: '#15803d', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                                ✅ Đã tự điểm danh ({new Date(selfAtt.checkin_time).toLocaleTimeString('vi-VN')})
                              </span>
                            ) : (
                              <span style={{ marginLeft: '10px', fontSize: '11px', color: '#b91c1c', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                                ⏳ Chưa tự check-in
                              </span>
                            )}
                          </div>

                          {/* 3 NÚT CHỌN TRẠNG THÁI */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleTtcmStatusChange(staff.name, 'status', 'PRESENT')}
                              style={{
                                padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                fontSize: '12px', fontWeight: 'bold',
                                backgroundColor: currentStatus === 'PRESENT' ? '#15803d' : '#e2e8f0',
                                color: currentStatus === 'PRESENT' ? '#fff' : '#475569'
                              }}
                            >
                              Có mặt
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTtcmStatusChange(staff.name, 'status', 'EXCUSED')}
                              style={{
                                padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                fontSize: '12px', fontWeight: 'bold',
                                backgroundColor: currentStatus === 'EXCUSED' ? '#a16207' : '#e2e8f0',
                                color: currentStatus === 'EXCUSED' ? '#fff' : '#475569'
                              }}
                            >
                              Vắng có phép
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTtcmStatusChange(staff.name, 'status', 'UNEXCUSED')}
                              style={{
                                padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                fontSize: '12px', fontWeight: 'bold',
                                backgroundColor: currentStatus === 'UNEXCUSED' ? '#dc2626' : '#e2e8f0',
                                color: currentStatus === 'UNEXCUSED' ? '#fff' : '#475569'
                              }}
                            >
                              Vắng K.phép
                            </button>
                          </div>
                        </div>

                        {/* NHẬP LÝ DO NẾU VẮNG */}
                        {currentStatus !== 'PRESENT' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b91c1c' }}>Lý do vắng:</span>
                            <select
                              value={currentReason}
                              onChange={e => handleTtcmStatusChange(staff.name, 'reason', e.target.value)}
                              style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                            >
                              <option value="">-- Chọn lý do vắng --</option>
                              {ABSENT_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Hoặc ghi rõ lý do..."
                              value={currentReason}
                              onChange={e => handleTtcmStatusChange(staff.name, 'reason', e.target.value)}
                              style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GHI CHÚ / KIẾN NGHỊ CỦA TỔ */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Ý kiến / Kiến nghị / Báo cáo nhanh của Tổ gửi Lãnh đạo (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú thêm về sĩ số, phản ánh của tổ hoặc kiến nghị trong cuộc họp..."
                  value={ttcmNote}
                  onChange={e => setTtcmNote(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              {/* NÚT GỬI BÁO CÁO CỦA TTCM */}
              <button
                type="submit"
                disabled={submittingTtcm}
                style={{
                  width: '100%', padding: '14px', backgroundColor: '#d97706', color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900',
                  cursor: submittingTtcm ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)', display: 'flex',
                  justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}
              >
                <Send size={18} /> {submittingTtcm ? 'Đang gửi dữ liệu...' : `GỬI BÁO CÁO SĨ SỐ TỔ ${ttcmDept} LÊN LÃNH ĐẠO`}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
