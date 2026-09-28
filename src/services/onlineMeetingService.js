import { supabase, supabaseAdmin, DualSupabaseService } from '../lib/supabase';

const dbClient = supabaseAdmin || supabase;

const STORAGE_KEYS = {
  MEETINGS: 'cbq_online_meetings_store',
  ATTENDANCES: 'cbq_meeting_attendances_store',
  DEPT_REPORTS: 'cbq_meeting_dept_reports_store',
  OFFLINE_STAFF: 'cbq_meeting_staff_cache'
};

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

// Dữ liệu cuộc họp mẫu mặc định
const SEED_MEETINGS = [
  {
    id: 'meet_seed_001',
    title: 'Hội nghị Sư phạm & Triển khai Nhiệm vụ Năm học 2026 - 2027',
    meeting_type: 'Hội đồng sư phạm',
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

export const OnlineMeetingService = {
  /**
   * 1. LẤY DANH SÁCH CUỘC HỌP
   */
  async getMeetings() {
    let cloudMeetings = [];
    try {
      const { data, error } = await dbClient
        .from('cbq_online_meetings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        cloudMeetings = data;
        setLocalData(STORAGE_KEYS.MEETINGS, data);
        return data;
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Đọc Supabase không thành công, dùng LocalStorage:', err.message);
    }

    // Fallback LocalStorage
    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS);
    return local.length > 0 ? local : SEED_MEETINGS;
  },

  /**
   * 2. LƯU HOẶC CẬP NHẬT CUỘC HỌP
   */
  async saveMeeting(meeting) {
    const payload = {
      ...meeting,
      id: meeting.id || `meet_${Date.now()}`,
      created_at: meeting.created_at || new Date().toISOString()
    };

    // Lưu vào LocalStorage trước để phản hồi tức thì
    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS);
    const existingIdx = local.findIndex(m => m.id === payload.id);
    if (existingIdx >= 0) {
      local[existingIdx] = payload;
    } else {
      local.unshift(payload);
    }
    setLocalData(STORAGE_KEYS.MEETINGS, local);

    // Thử đồng bộ lên Supabase nếu bảng tồn tại
    try {
      await dbClient.from('cbq_online_meetings').upsert(payload);
    } catch (err) {
      console.warn('[OnlineMeetingService] Không thể ghi lên Supabase, dữ liệu lưu cục bộ:', err.message);
    }

    return payload;
  },

  /**
   * 3. XÓA CUỘC HỌP
   */
  async deleteMeeting(meetingId) {
    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS).filter(m => m.id !== meetingId);
    setLocalData(STORAGE_KEYS.MEETINGS, local);

    try {
      await dbClient.from('cbq_online_meetings').delete().eq('id', meetingId);
      await dbClient.from('cbq_meeting_attendances').delete().eq('meeting_id', meetingId);
      await dbClient.from('cbq_meeting_department_reports').delete().eq('meeting_id', meetingId);
    } catch (err) {
      console.warn('[OnlineMeetingService] Lỗi xóa trên Supabase:', err.message);
    }
    return true;
  },

  /**
   * 4. BẮT ĐẦU ĐIỂM DANH - SINH MÃ OTP & ĐẾM NGƯỢC
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

    // Update local
    const local = getLocalData(STORAGE_KEYS.MEETINGS, SEED_MEETINGS);
    const m = local.find(x => x.id === meetingId);
    if (m) {
      Object.assign(m, updateFields);
      setLocalData(STORAGE_KEYS.MEETINGS, local);
    }

    try {
      await dbClient.from('cbq_online_meetings').update(updateFields).eq('id', meetingId);
    } catch (err) {
      console.warn('[OnlineMeetingService] Không thể cập nhật OTP lên Supabase:', err.message);
    }

    return { otpCode, expiresAt };
  },

  /**
   * 5. ĐÓNG / MỞ CỔNG ĐIỂM DANH THỦ CÔNG
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
      await dbClient.from('cbq_online_meetings').update(updateFields).eq('id', meetingId);
    } catch (err) {
      console.warn('[OnlineMeetingService] Lỗi toggleCheckin:', err.message);
    }
    return isOpen;
  },

  /**
   * 6. BẬT / TẮT LỆNH YÊU CẦU TTCM BÁO CÁO SĨ SỐ TỔ
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
      await dbClient.from('cbq_online_meetings').update(updateFields).eq('id', meetingId);
    } catch (err) {
      console.warn('[OnlineMeetingService] Lỗi toggleTtcmReporting:', err.message);
    }
    return isOpen;
  },

  /**
   * 7. LẤY DANH SÁCH ĐIỂM DANH CỦA CUỘC HỌP
   */
  async getAttendances(meetingId) {
    try {
      const { data, error } = await dbClient
        .from('cbq_meeting_attendances')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('checkin_time', { ascending: false });

      if (!error && data) {
        // Cập nhật local
        const allLocal = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
        const filtered = allLocal.filter(a => a.meeting_id !== meetingId);
        setLocalData(STORAGE_KEYS.ATTENDANCES, [...data, ...filtered]);
        return data;
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Đọc attendances từ Supabase lỗi:', err.message);
    }

    const allLocal = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
    return allLocal.filter(a => a.meeting_id === meetingId);
  },

  /**
   * 8. GIÁO VIÊN GỬI ĐIỂM DANH BẰNG MÃ OTP
   */
  async submitTeacherCheckin({ meetingId, staffId, staffName, department, title, checkinCode, pollAnswer, deviceInfo }) {
    if (!meetingId || !staffName || !department) {
      return { success: false, message: 'Thiếu thông tin người điểm danh hoặc cuộc họp!' };
    }

    // Kiểm tra trạng thái cuộc họp & mã OTP
    const meetings = await this.getMeetings();
    const meeting = meetings.find(m => m.id === meetingId);

    if (!meeting) {
      return { success: false, message: 'Cuộc họp không tồn tại hoặc đã bị xóa!' };
    }

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
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      meeting_id: meetingId,
      staff_id: staffId || null,
      staff_name: staffName.trim(),
      department: department.trim(),
      title: title || 'Giáo viên',
      checkin_time: new Date().toISOString(),
      status: 'PRESENT',
      poll_answer: pollAnswer || null,
      verified_by_ttcm: false,
      note: 'Tự điểm danh qua mã OTP',
      device_info: deviceInfo || navigator.userAgent || 'Thiết bị cá nhân'
    };

    // Lưu vào LocalStorage
    const allAttendances = getLocalData(STORAGE_KEYS.ATTENDANCES, []);
    const existingIdx = allAttendances.findIndex(
      a => a.meeting_id === meetingId && a.staff_name.toLowerCase() === staffName.trim().toLowerCase()
    );

    if (existingIdx >= 0) {
      allAttendances[existingIdx] = { ...allAttendances[existingIdx], ...newAttendance };
    } else {
      allAttendances.unshift(newAttendance);
    }
    setLocalData(STORAGE_KEYS.ATTENDANCES, allAttendances);

    // Ghi lên Supabase
    try {
      await dbClient.from('cbq_meeting_attendances').upsert(newAttendance, {
        onConflict: 'meeting_id,staff_name,department'
      });
    } catch (err) {
      console.warn('[OnlineMeetingService] Lưu attendance lên Supabase lỗi:', err.message);
    }

    return { success: true, attendance: newAttendance };
  },

  /**
   * 9. LẤY BÁO CÁO CỦA CÁC TỔ TRƯỞNG CHUYÊN MÔN (TTCM)
   */
  async getDepartmentReports(meetingId) {
    try {
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
    } catch (err) {
      console.warn('[OnlineMeetingService] Đọc TTCM reports lỗi:', err.message);
    }

    const allReports = getLocalData(STORAGE_KEYS.DEPT_REPORTS, []);
    return allReports.filter(r => r.meeting_id === meetingId);
  },

  /**
   * 10. TỔ TRƯỞNG CHUYÊN MÔN (TTCM) GỬI BÁO CÁO SĨ SỐ & ĐIỂM DANH HỘ
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
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
          id: item.id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          meeting_id: meetingId,
          staff_id: item.staff_id || null,
          staff_name: item.staff_name,
          department: department.trim(),
          title: item.title || 'Giáo viên',
          checkin_time: item.checkin_time || new Date().toISOString(),
          status: item.status || 'PRESENT', // 'PRESENT' | 'EXCUSED' | 'UNEXCUSED'
          poll_answer: item.poll_answer || null,
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

    // 3. Thử đồng bộ lên Supabase
    try {
      await dbClient.from('cbq_meeting_department_reports').upsert(reportData, {
        onConflict: 'meeting_id,department'
      });

      if (verifiedAttendances && verifiedAttendances.length > 0) {
        for (const item of verifiedAttendances) {
          await dbClient.from('cbq_meeting_attendances').upsert({
            meeting_id: meetingId,
            staff_name: item.staff_name,
            department: department.trim(),
            status: item.status || 'PRESENT',
            verified_by_ttcm: true,
            verified_by_name: reporterName.trim(),
            note: item.note || ''
          }, { onConflict: 'meeting_id,staff_name,department' });
        }
      }
    } catch (err) {
      console.warn('[OnlineMeetingService] Lưu TTCM report lên Supabase lỗi:', err.message);
    }

    return { success: true, report: reportData };
  },

  /**
   * 11. LẤY DANH SÁCH GIÁO VIÊN & TỔ CHUYÊN MÔN TỪ CSDL
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
   * 12. CÂU LỆNH SQL DỰ PHÒNG CHO SUPABASE
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
    status VARCHAR(20) DEFAULT 'PRESENT', -- 'PRESENT', 'EXCUSED', 'UNEXCUSED'
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
