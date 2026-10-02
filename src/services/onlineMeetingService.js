import { supabase, supabaseAdmin, supabase2, supabase2Admin } from '../lib/supabase';

// Ưu tiên Client Supabase 2 (Đặc quyền Admin nếu có, fallback Client Anon)
const dbClient = supabase2Admin || supabaseAdmin || supabase2 || supabase;

export const STORAGE_KEYS = {
  MEETINGS: 'cbq_online_meetings_store',
  ATTENDANCES: 'cbq_meeting_attendances_store',
  DEPT_REPORTS: 'cbq_meeting_dept_reports_store',
  OFFLINE_STAFF: 'cbq_meeting_staff_cache'
};

// Kiểm tra chuỗi có phải UUID hợp lệ hay không
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

// Sinh mã UUID v4 an toàn tương thích mọi trình duyệt và Node.js
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Danh mục các Tổ chuyên môn chuẩn của Trường THPT Cao Bá Quát
export const DEFAULT_DEPARTMENTS = [
  'Ban Giám Hiệu',
  'Tổ Toán',
  'Tổ Ngữ Văn',
  'Tổ Tiếng Anh',
  'Tổ Vật Lý - Hóa học',
  'Tổ Sinh học',
  'Tổ Sử - Địa - GDKT&PL',
  'Tổ Tin học - Ngoại Ngữ',
  'Tổ GDTC - QPAN',
  'Tổ Văn Phòng'
];

// Dữ liệu cuộc họp mẫu mặc định (Dùng UUID chuẩn)
const SEED_MEETINGS = [
  {
    id: '00000000-0000-4000-a000-000000000001',
    title: 'Hội nghị Sư phạm & Triển khai Nhiệm vụ Năm học 2026 - 2027',
    meeting_type: 'Hội đồng sư phạm',
    meeting_format: 'OFFLINE', // 'OFFLINE' (Trực tiếp), 'ONLINE' (Trực tuyến), 'HYBRID' (Hỗn hợp)
    location: 'Hội trường lớn - Trường THPT Cao Bá Quát',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_link: 'https://meet.google.com/cbq-supham-online',
    checkin_code: '839201',
    checkin_opened_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    checkin_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    is_checkin_open: true,
    ttcm_reporting_open: true,
    poll_question: 'Thầy/Cô có nhất trí với Phương hướng & Chỉ tiêu thi đua năm học 2026 - 2027 không?',
    poll_options: ['Nhất trí 100%', 'Có ý kiến đề xuất điều chỉnh'],
    created_at: new Date().toISOString(),
    created_by: 'Ban Thư Ký Hội Đồng'
  }
];

// Danh sách các cột thực tế trên bảng cbq_online_meetings của Supabase
const DB_MEETING_COLUMNS = [
  'id', 'title', 'meeting_type', 'meeting_date', 'meeting_link',
  'checkin_code', 'checkin_opened_at', 'checkin_expires_at',
  'is_checkin_open', 'ttcm_reporting_open', 'poll_question',
  'poll_options', 'created_at', 'created_by'
];

function sanitizeMeetingPayload(data) {
  if (!data) return data;
  const clean = {};
  DB_MEETING_COLUMNS.forEach(col => {
    if (data[col] !== undefined) clean[col] = data[col];
  });
  return clean;
}

// Helper đọc LocalStorage an toàn
const getLocalData = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// Helper lưu LocalStorage an toàn
const setLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Lỗi lưu LocalStorage [${key}]:`, e);
  }
};

/**
 * Tự động chuyển đổi các ID cũ dạng chuỗi (meet_..., att_...) trong localStorage sang UUID chuẩn
 */
function migrateOldStorageData() {
  try {
    const localMeetings = getLocalData(STORAGE_KEYS.MEETINGS, []);
    let changed = false;
    const idMap = {};

    localMeetings.forEach(m => {
      if (!isValidUUID(m.id)) {
        const newId = generateUUID();
        idMap[m.id] = newId;
        m.id = newId;
        changed = true;
      }
    });

    if (changed) {
      setLocalData(STORAGE_KEYS.MEETINGS, localMeetings);

      // Cập nhật mapping ID trong danh sách điểm danh cá nhân
      const localAtts = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
      let attChanged = false;
      localAtts.forEach(a => {
        if (idMap[a.meeting_id]) {
          a.meeting_id = idMap[a.meeting_id];
          attChanged = true;
        }
        if (!isValidUUID(a.id)) {
          a.id = generateUUID();
          attChanged = true;
        }
      });
      if (attChanged) setLocalData(STORAGE_KEYS.ATTENDANCES, localAtts);

      // Cập nhật mapping ID trong danh sách báo cáo tổ trưởng
      const localReps = getLocalData(STORAGE_KEYS.DEPT_REPORTS, []);
      let repChanged = false;
      localReps.forEach(r => {
        if (idMap[r.meeting_id]) {
          r.meeting_id = idMap[r.meeting_id];
          repChanged = true;
        }
        if (!isValidUUID(r.id)) {
          r.id = generateUUID();
          repChanged = true;
        }
      });
      if (repChanged) setLocalData(STORAGE_KEYS.DEPT_REPORTS, localReps);
    }
  } catch (e) {
    console.warn('[OnlineMeetingService] Lỗi migrate storage:', e);
  }
}

export const OnlineMeetingService = {
  /**
   * 1. LẤY DANH SÁCH CUỘC HỌP (ĐỒNG BỘ 2 CHIỀU GIỮA SUPABASE VÀ LOCALSTORAGE)
   */
  async getMeetings() {
    // Luôn migrate ID cũ nếu có trong LocalStorage
    migrateOldStorageData();

    let cloudMeetings = [];
    try {
      const { data, error } = await dbClient
        .from('cbq_online_meetings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && Array.isArray(data)) {
        cloudMeetings = data;
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Đọc Supabase không thành công, dùng LocalStorage:', err.message);
    }

    const local = getLocalData(STORAGE_KEYS.MEETINGS, []);
    const localMap = new Map(local.map(m => [m.id, m]));

    // Nếu Cloud đã có dữ liệu
    if (cloudMeetings.length > 0) {
      // Gộp thông tin hiển thị (location, meeting_format) từ LocalStorage nếu có
      cloudMeetings = cloudMeetings.map(m => {
        const loc = localMap.get(m.id);
        return {
          location: loc?.location || (m.meeting_link ? 'Trực tuyến (Meet/Zoom)' : 'Hội trường lớn - Trường THPT Cao Bá Quát'),
          meeting_format: loc?.meeting_format || (m.meeting_link ? 'ONLINE' : 'OFFLINE'),
          ...m
        };
      });

      // Kiểm tra xem LocalStorage có cuộc họp nào chưa kịp đẩy lên Cloud không
      const cloudIdSet = new Set(cloudMeetings.map(m => m.id));
      for (const locMeeting of local) {
        if (isValidUUID(locMeeting.id) && !cloudIdSet.has(locMeeting.id)) {
          try {
            await dbClient.from('cbq_online_meetings').upsert(sanitizeMeetingPayload(locMeeting));
            cloudMeetings.unshift(locMeeting);
            cloudIdSet.add(locMeeting.id);
          } catch (e) {
            console.warn('[OnlineMeetingService] Đồng bộ local sang cloud:', e);
          }
        }
      }

      setLocalData(STORAGE_KEYS.MEETINGS, cloudMeetings);
      return cloudMeetings;
    }

    // Nếu Cloud chưa có dữ liệu nhưng LocalStorage có: Đẩy toàn bộ lên Cloud!
    if (local.length > 0) {
      for (const locMeeting of local) {
        if (isValidUUID(locMeeting.id)) {
          try {
            await dbClient.from('cbq_online_meetings').upsert(sanitizeMeetingPayload(locMeeting));
            cloudMeetings.push(locMeeting);
          } catch (e) {
            console.warn('[OnlineMeetingService] Lưu local lên cloud trống:', e);
          }
        }
      }
      if (cloudMeetings.length > 0) {
        setLocalData(STORAGE_KEYS.MEETINGS, cloudMeetings);
        return cloudMeetings;
      }
      return local;
    }

    // Nếu hoàn toàn chưa có cuộc họp nào cả ở Cloud và LocalStorage: Khởi tạo SEED_MEETING
    const seeds = SEED_MEETINGS.map(m => ({
      ...m,
      id: isValidUUID(m.id) ? m.id : generateUUID()
    }));
    try {
      await dbClient.from('cbq_online_meetings').upsert(seeds.map(sanitizeMeetingPayload));
    } catch (e) {}

    setLocalData(STORAGE_KEYS.MEETINGS, seeds);
    return seeds;
  },

  /**
   * 2. LẤY CHI TIẾT 1 CUỘC HỌP THEO ID
   */
  async getMeetingById(meetingId) {
    if (!meetingId) return null;

    if (isValidUUID(meetingId)) {
      try {
        const { data, error } = await dbClient
          .from('cbq_online_meetings')
          .select('*')
          .eq('id', meetingId)
          .maybeSingle();
        if (!error && data) {
          return {
            location: data.meeting_link ? 'Trực tuyến (Meet/Zoom)' : 'Hội trường lớn - Trường THPT Cao Bá Quát',
            meeting_format: data.meeting_link ? 'ONLINE' : 'OFFLINE',
            ...data
          };
        }
      } catch (e) {
        console.warn('[OnlineMeetingService] Lỗi getMeetingById:', e);
      }
    }

    const local = getLocalData(STORAGE_KEYS.MEETINGS, []);
    return local.find(m => m.id === meetingId) || null;
  },

  /**
   * 3. LƯU HOẶC CẬP NHẬT CUỘC HỌP
   */
  async saveMeeting(meeting) {
    let meetingId = meeting.id;
    if (!meetingId || !isValidUUID(meetingId)) {
      meetingId = generateUUID();
    }

    const payload = {
      ...meeting,
      id: meetingId,
      created_at: meeting.created_at || new Date().toISOString()
    };

    // Lưu vào LocalStorage
    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS);
    const existingIdx = local.findIndex(m => m.id === payload.id);
    if (existingIdx >= 0) {
      local[existingIdx] = payload;
    } else {
      local.unshift(payload);
    }
    setLocalData(STORAGE_KEYS.MEETINGS, local);

    // Đồng bộ tức thời lên Supabase Cloud (lọc đúng các cột có trong database)
    try {
      const sanitized = sanitizeMeetingPayload(payload);
      const { data, error } = await dbClient
        .from('cbq_online_meetings')
        .upsert(sanitized)
        .select();

      if (error) {
        console.error('[OnlineMeetingService] Lỗi upsert cuộc họp lên Supabase:', error);
      } else if (data && data.length > 0) {
        return { ...payload, ...data[0] };
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Không thể ghi lên Supabase, dữ liệu lưu cục bộ:', err.message);
    }

    return payload;
  },

  /**
   * 4. XÓA CUỘC HỌP
   */
  async deleteMeeting(meetingId) {
    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS).filter(m => m.id !== meetingId);
    setLocalData(STORAGE_KEYS.MEETINGS, local);

    try {
      if (isValidUUID(meetingId)) {
        await dbClient.from('cbq_meeting_attendances').delete().eq('meeting_id', meetingId);
        await dbClient.from('cbq_meeting_department_reports').delete().eq('meeting_id', meetingId);
        await dbClient.from('cbq_online_meetings').delete().eq('id', meetingId);
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Lỗi xóa trên Supabase:', err.message);
    }
    return true;
  },

  /**
   * 5. BẮT ĐẦU ĐIỂM DANH - SINH MÃ OTP & ĐẾM NGƯỢC
   */
  async startCheckin(meetingId, minutes = 5) {
    // Sinh mã ngẫu nhiên 6 chữ số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);

    const updateFields = {
      checkin_code: otpCode,
      checkin_opened_at: now.toISOString(),
      checkin_expires_at: expiresAt.toISOString(),
      is_checkin_open: true
    };

    // Cập nhật LocalStorage
    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS);
    const m = local.find(x => x.id === meetingId);
    if (m) {
      Object.assign(m, updateFields);
      setLocalData(STORAGE_KEYS.MEETINGS, local);
    }

    // Cập nhật Supabase Cloud
    try {
      if (isValidUUID(meetingId)) {
        const { error } = await dbClient
          .from('cbq_online_meetings')
          .update(updateFields)
          .eq('id', meetingId);
        if (error) console.error('[OnlineMeetingService] Lỗi cập nhật OTP Supabase:', error);
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Không thể cập nhật OTP lên Supabase:', err.message);
    }

    return { otpCode, expiresAt };
  },

  /**
   * 6. ĐÓNG / MỞ CỔNG ĐIỂM DANH THỦ CÔNG
   */
  async toggleCheckin(meetingId, isOpen) {
    const updateFields = { is_checkin_open: isOpen };

    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS);
    const m = local.find(x => x.id === meetingId);
    if (m) {
      m.is_checkin_open = isOpen;
      setLocalData(STORAGE_KEYS.MEETINGS, local);
    }

    try {
      if (isValidUUID(meetingId)) {
        await dbClient.from('cbq_online_meetings').update(updateFields).eq('id', meetingId);
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Lỗi toggleCheckin:', err.message);
    }
    return isOpen;
  },

  /**
   * 7. BẬT / TẮT LỆNH YÊU CẦU TTCM BÁO CÁO SĨ SỐ TỔ
   */
  async toggleTtcmReporting(meetingId, isOpen) {
    const updateFields = { ttcm_reporting_open: isOpen };

    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS);
    const m = local.find(x => x.id === meetingId);
    if (m) {
      m.ttcm_reporting_open = isOpen;
      setLocalData(STORAGE_KEYS.MEETINGS, local);
    }

    try {
      if (isValidUUID(meetingId)) {
        await dbClient.from('cbq_online_meetings').update(updateFields).eq('id', meetingId);
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Lỗi toggleTtcmReporting:', err.message);
    }
    return isOpen;
  },

  /**
   * 8. LẤY DANH SÁCH ĐIỂM DANH CỦA CUỘC HỌP
   */
  async getAttendances(meetingId) {
    if (!meetingId) return [];

    try {
      if (isValidUUID(meetingId)) {
        const { data, error } = await dbClient
          .from('cbq_meeting_attendances')
          .select('*')
          .eq('meeting_id', meetingId)
          .order('checkin_time', { ascending: false });

        if (!error && data) {
          const allLocal = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
          const filtered = allLocal.filter(a => a.meeting_id !== meetingId);
          setLocalData(STORAGE_KEYS.ATTENDANCES, [...data, ...filtered]);
          return data;
        }
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Đọc attendances từ Supabase lỗi:', err.message);
    }

    const allLocal = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
    return allLocal.filter(a => a.meeting_id === meetingId);
  },

  /**
   * 9. GIÁO VIÊN GỬI ĐIỂM DANH BẰNG MÃ OTP (HỖ TRỢ TỰ ĐỘNG TÌM PHIÊN HỌP)
   */
  async submitTeacherCheckin({ meetingId, staffId, staffName, department, title, checkinCode, pollAnswer, deviceInfo }) {
    if (!staffName || !department) {
      return { success: false, message: 'Thiếu thông tin người điểm danh hoặc Tổ chuyên môn!' };
    }

    // Nạp danh sách cuộc họp mới nhất
    const meetings = await this.getMeetings();

    // 1. Tìm cuộc họp theo meetingId
    let meeting = meetings.find(m => m.id === meetingId);

    // 2. Nếu không tìm thấy, thử tìm theo checkinCode nhập vào
    if (!meeting && checkinCode) {
      meeting = meetings.find(m => String(m.checkin_code).trim() === String(checkinCode).trim());
    }

    // 3. Nếu vẫn không thấy, thử tìm cuộc họp đang mở điểm danh
    if (!meeting) {
      meeting = meetings.find(m => m.is_checkin_open);
    }

    if (!meeting) {
      return { success: false, message: 'Cuộc họp không tồn tại hoặc đã kết thúc!' };
    }

    const activeMeetingId = meeting.id;

    if (!meeting.is_checkin_open) {
      return { success: false, message: 'Cổng điểm danh đã được Ban Giám Hiệu đóng lại!' };
    }

    if (meeting.checkin_expires_at) {
      const exp = new Date(meeting.checkin_expires_at).getTime();
      if (Date.now() > exp) {
        return { success: false, message: 'Mã số điểm danh đã hết hạn! Vui lòng liên hệ Thư ký hoặc TTCM.' };
      }
    }

    // Kiểm tra mã OTP
    const cleanInputCode = String(checkinCode || '').trim();
    const cleanRealCode = String(meeting.checkin_code || '').trim();
    if (cleanInputCode !== cleanRealCode) {
      return { success: false, message: 'Mã số phiên họp không chính xác! Vui lòng xem màn hình cuộc họp.' };
    }

    const newAttendance = {
      id: generateUUID(),
      meeting_id: activeMeetingId,
      staff_id: staffId || null,
      staff_name: staffName.trim(),
      department: department.trim(),
      title: title || 'Giáo viên',
      checkin_time: new Date().toISOString(),
      status: 'PRESENT',
      poll_answer: pollAnswer || null,
      verified_by_ttcm: false,
      note: 'Tự điểm danh qua mã OTP',
      device_info: deviceInfo || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Thiết bị di động cá nhân')
    };

    // Lưu vào LocalStorage
    const allAttendances = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
    const existingIdx = allAttendances.findIndex(
      a => a.meeting_id === activeMeetingId && a.staff_name.toLowerCase() === staffName.trim().toLowerCase()
    );

    if (existingIdx >= 0) {
      allAttendances[existingIdx] = { ...allAttendances[existingIdx], ...newAttendance };
    } else {
      allAttendances.unshift(newAttendance);
    }
    setLocalData(STORAGE_KEYS.ATTENDANCES, allAttendances);

    // Ghi lên Supabase Cloud
    try {
      if (isValidUUID(activeMeetingId)) {
        const dbPayload = {
          meeting_id: activeMeetingId,
          staff_id: staffId || null,
          staff_name: staffName.trim(),
          department: department.trim(),
          title: title || 'Giáo viên',
          checkin_time: newAttendance.checkin_time,
          status: 'PRESENT',
          poll_answer: pollAnswer || null,
          verified_by_ttcm: false,
          note: 'Tự điểm danh qua mã OTP',
          device_info: newAttendance.device_info
        };

        const { data, error } = await dbClient
          .from('cbq_meeting_attendances')
          .upsert(dbPayload, { onConflict: 'meeting_id,staff_name,department' })
          .select();

        if (!error && data && data.length > 0) {
          newAttendance.id = data[0].id;
        } else if (error) {
          console.warn('[OnlineMeetingService] Lỗi upsert attendance Supabase:', error);
        }
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Lưu attendance lên Supabase lỗi:', err.message);
    }

    return { success: true, attendance: newAttendance, meeting };
  },

  /**
   * 10. LẤY BÁO CÁO CỦA CÁC TỔ TRƯỞNG CHUYÊN MÔN (TTCM)
   */
  async getDepartmentReports(meetingId) {
    if (!meetingId) return [];

    try {
      if (isValidUUID(meetingId)) {
        const { data, error } = await dbClient
          .from('cbq_meeting_department_reports')
          .select('*')
          .eq('meeting_id', meetingId);

        if (!error && data) {
          const allReports = getLocalData(STORAGE_KEYS.DEPT_REPORTS, []);
          const filtered = allReports.filter(r => r.meeting_id !== meetingId);
          setLocalData(STORAGE_KEYS.DEPT_REPORTS, [...data, ...filtered]);
          return data;
        }
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Đọc TTCM reports lỗi:', err.message);
    }

    const allReports = getLocalData(STORAGE_KEYS.DEPT_REPORTS, []);
    return allReports.filter(r => r.meeting_id === meetingId);
  },

  /**
   * 11. TỔ TRƯỞNG CHUYÊN MÔN (TTCM) GỬI BÁO CÁO SĨ SỐ & ĐIỂM DANH HỘ
   */
  async submitDepartmentReport({
    meetingId,
    department,
    reporterName,
    reporterRole = 'Tổ trưởng chuyên môn',
    totalMembers,
    presentCount,
    excusedCount,
    unexcusedCount,
    absentDetails = [],
    note = '',
    verifiedAttendances = []
  }) {
    if (!meetingId || !department || !reporterName) {
      return { success: false, message: 'Thiếu thông tin cuộc họp, tổ hoặc người báo cáo!' };
    }

    const reportData = {
      id: generateUUID(),
      meeting_id: meetingId,
      department: department.trim(),
      reporter_name: reporterName.trim(),
      reporter_role: reporterRole,
      total_members: totalMembers,
      present_count: presentCount,
      excused_count: excusedCount,
      unexcused_count: unexcusedCount,
      absent_details: absentDetails,
      reported_at: new Date().toISOString(),
      note: note.trim()
    };

    // 1. Lưu report vào LocalStorage
    const allReports = getLocalData(STORAGE_KEYS.DEPT_REPORTS, []);
    const repIdx = allReports.findIndex(r => r.meeting_id === meetingId && r.department === department.trim());
    if (repIdx >= 0) {
      allReports[repIdx] = reportData;
    } else {
      allReports.unshift(reportData);
    }
    setLocalData(STORAGE_KEYS.DEPT_REPORTS, allReports);

    // 2. Cập nhật danh sách điểm danh cá nhân (verifiedAttendances)
    if (verifiedAttendances && verifiedAttendances.length > 0) {
      const allAttendances = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
      
      verifiedAttendances.forEach(item => {
        const idx = allAttendances.findIndex(
          a => a.meeting_id === meetingId && a.staff_name.toLowerCase() === item.staff_name.toLowerCase()
        );
        const record = {
          id: (idx >= 0 && isValidUUID(allAttendances[idx].id)) ? allAttendances[idx].id : generateUUID(),
          meeting_id: meetingId,
          staff_id: item.staff_id || null,
          staff_name: item.staff_name.trim(),
          department: department.trim(),
          title: item.title || 'Giáo viên',
          checkin_time: new Date().toISOString(),
          status: item.status || 'PRESENT',
          verified_by_ttcm: true,
          verified_by_name: reporterName.trim(),
          note: item.note || (item.status === 'PRESENT' ? 'TTCM xác nhận có mặt' : 'TTCM báo vắng'),
          device_info: 'TTCM xác nhận qua cổng Tổ trưởng'
        };

        if (idx >= 0) {
          allAttendances[idx] = { ...allAttendances[idx], ...record };
        } else {
          allAttendances.push(record);
        }
      });

      setLocalData(STORAGE_KEYS.ATTENDANCES, allAttendances);
    }

    // 3. Đồng bộ lên Supabase Cloud
    try {
      if (isValidUUID(meetingId)) {
        const dbReportPayload = {
          meeting_id: meetingId,
          department: department.trim(),
          reporter_name: reporterName.trim(),
          reporter_role: reporterRole,
          total_members: totalMembers,
          present_count: presentCount,
          excused_count: excusedCount,
          unexcused_count: unexcusedCount,
          absent_details: absentDetails,
          reported_at: reportData.reported_at,
          note: note.trim()
        };

        await dbClient.from('cbq_meeting_department_reports').upsert(dbReportPayload, {
          onConflict: 'meeting_id,department'
        });

        if (verifiedAttendances && verifiedAttendances.length > 0) {
          for (const item of verifiedAttendances) {
            await dbClient.from('cbq_meeting_attendances').upsert({
              meeting_id: meetingId,
              staff_name: item.staff_name.trim(),
              department: department.trim(),
              status: item.status || 'PRESENT',
              verified_by_ttcm: true,
              verified_by_name: reporterName.trim(),
              note: item.note || ''
            }, { onConflict: 'meeting_id,staff_name,department' });
          }
        }
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Lưu TTCM report lên Supabase lỗi:', err.message);
    }

    return { success: true, report: reportData };
  },

  /**
   * 12. CẬP NHẬT TRỰC TIẾP ĐIỂM DANH CHO MỘT GIÁO VIÊN (DÀNH CHO ADMIN / THƯ KÝ)
   */
  async updateSingleAttendance({ meetingId, staffName, department, status, note, verifiedByName }) {
    if (!meetingId || !staffName) return { success: false, message: 'Thiếu dữ liệu cuộc họp hoặc tên giáo viên' };

    const allAttendances = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
    const idx = allAttendances.findIndex(
      a => a.meeting_id === meetingId && a.staff_name.toLowerCase().trim() === staffName.toLowerCase().trim()
    );

    const record = {
      id: (idx >= 0 && isValidUUID(allAttendances[idx].id)) ? allAttendances[idx].id : generateUUID(),
      meeting_id: meetingId,
      staff_name: staffName.trim(),
      department: department?.trim() || 'Chưa phân tổ',
      checkin_time: idx >= 0 ? allAttendances[idx].checkin_time : new Date().toISOString(),
      status: status || 'PRESENT',
      verified_by_ttcm: true,
      verified_by_name: verifiedByName || 'Thư ký cuộc họp',
      note: note || (status === 'PRESENT' ? 'Thư ký xác nhận có mặt' : 'Thư ký cập nhật'),
      device_info: 'Cập nhật trực tiếp từ Cổng Thư ký'
    };

    if (idx >= 0) {
      allAttendances[idx] = { ...allAttendances[idx], ...record };
    } else {
      allAttendances.push(record);
    }
    setLocalData(STORAGE_KEYS.ATTENDANCES, allAttendances);

    // Đồng bộ lên Supabase nếu là UUID hợp lệ
    try {
      if (isValidUUID(meetingId)) {
        await dbClient.from('cbq_meeting_attendances').upsert({
          meeting_id: meetingId,
          staff_name: staffName.trim(),
          department: department?.trim() || 'Chưa phân tổ',
          checkin_time: record.checkin_time,
          status: status || 'PRESENT',
          verified_by_ttcm: true,
          verified_by_name: verifiedByName || 'Thư ký cuộc họp',
          note: record.note,
          device_info: 'Cập nhật trực tiếp từ Cổng Thư ký'
        }, {
          onConflict: 'meeting_id,staff_name,department'
        });
      }
    } catch (e) {
      console.warn('[OnlineMeetingService] Cập nhật attendance lên Supabase lỗi:', e.message);
    }

    return { success: true, attendance: record };
  },

  /**
   * 13. LẤY DANH SÁCH GIÁO VIÊN & TỔ CHUYÊN MÔN TỪ CSDL
   */
  async getStaffAndDepartments() {
    let departments = [];
    let staff = [];

    // 1. Lấy danh sách Tổ
    try {
      const { data: depData } = await dbClient
        .from('cbq_departments')
        .select('*')
        .or('is_active.eq.true,is_active.is.null')
        .order('sort_order', { ascending: true });
      
      if (depData && depData.length > 0) {
        departments = depData.map(d => d.name.trim()).filter(Boolean);
      }
    } catch (e) {
      console.warn('Lỗi đọc cbq_departments:', e);
    }

    if (departments.length === 0) {
      departments = DEFAULT_DEPARTMENTS;
    }

    // 2. Lấy danh sách Giáo viên
    try {
      const { data: staffData } = await dbClient
        .from('cbq_staff')
        .select('*')
        .or('is_active.eq.true,is_active.is.null')
        .order('sort_order', { ascending: true });

      if (staffData && staffData.length > 0) {
        staff = staffData;
        setLocalData(STORAGE_KEYS.OFFLINE_STAFF, staffData);
      }
    } catch (e) {
      console.warn('Lỗi đọc cbq_staff:', e);
    }

    if (staff.length === 0) {
      staff = getLocalData(STORAGE_KEYS.OFFLINE_STAFF, []);
    }

    return { departments, staff };
  },

  /**
   * 14. CÂU LỆNH SQL DỰ PHÒNG CHO SUPABASE
   */
  getSupabaseSqlSchema() {
    return `-- =========================================================================
-- HỆ THỐNG ĐIỂM DANH HỌP TRỰC TUYẾN & BÁO CÁO SĨ SỐ TỔ CHUYÊN MÔN
-- TRƯỜNG THPT CAO BÁ QUÁT - TỈNH ĐẮK LẮK
-- =========================================================================

-- 1. Bảng Cuộc họp trực tuyến
CREATE TABLE IF NOT EXISTS public.cbq_online_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    meeting_type TEXT DEFAULT 'Hội đồng sư phạm',
    meeting_format VARCHAR(20) DEFAULT 'OFFLINE',
    location TEXT DEFAULT 'Hội trường lớn THPT Cao Bá Quát',
    meeting_date DATE DEFAULT CURRENT_DATE,
    meeting_link TEXT,
    checkin_code VARCHAR(10),
    checkin_opened_at TIMESTAMPTZ,
    checkin_expires_at TIMESTAMPTZ,
    is_checkin_open BOOLEAN DEFAULT false,
    ttcm_reporting_open BOOLEAN DEFAULT false,
    poll_question TEXT,
    poll_options JSONB DEFAULT '["Nhất trí 100%", "Có ý kiến khác"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- 2. Bảng Điểm danh từng Giáo viên
CREATE TABLE IF NOT EXISTS public.cbq_meeting_attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.cbq_online_meetings(id) ON DELETE CASCADE,
    staff_id TEXT,
    staff_name TEXT NOT NULL,
    department TEXT NOT NULL,
    title TEXT,
    checkin_time TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'PRESENT',
    poll_answer TEXT,
    verified_by_ttcm BOOLEAN DEFAULT false,
    verified_by_name TEXT,
    note TEXT,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_meeting_staff UNIQUE (meeting_id, staff_name, department)
);

-- 3. Bảng Báo cáo sĩ số của Tổ trưởng chuyên môn (TTCM)
CREATE TABLE IF NOT EXISTS public.cbq_meeting_department_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.cbq_online_meetings(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    reporter_role TEXT DEFAULT 'Tổ trưởng chuyên môn',
    total_members INT DEFAULT 0,
    present_count INT DEFAULT 0,
    excused_count INT DEFAULT 0,
    unexcused_count INT DEFAULT 0,
    absent_details JSONB DEFAULT '[]'::jsonb,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    note TEXT,
    CONSTRAINT unique_meeting_department UNIQUE (meeting_id, department)
);

-- Bật Row Level Security và cấp quyền mở cho ứng dụng nhà trường
ALTER TABLE public.cbq_online_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_meeting_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_meeting_department_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all cbq_online_meetings" ON public.cbq_online_meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all cbq_meeting_attendances" ON public.cbq_meeting_attendances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all cbq_meeting_department_reports" ON public.cbq_meeting_department_reports FOR ALL USING (true) WITH CHECK (true);
`;
  }
};
