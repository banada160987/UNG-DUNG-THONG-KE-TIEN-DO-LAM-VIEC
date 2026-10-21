/**
 * Quản Lý Phiên Đăng Nhập Thông Minh (Smart Session Timeout & Auto Logout)
 * Trường THPT Cao Bá Quát - Phường Tân An - Tỉnh Đắk Lắk
 * 
 * Tính năng bảo mật chuyên sâu:
 * 1. Giới hạn thời gian sống của phiên (TTL): Tự động hết hạn và xóa dữ liệu sau 3 giờ (hoặc 24h nếu chọn Ghi nhớ trên máy cá nhân).
 * 2. Tự động thanh lọc phiên cũ (Legacy Session Purge): Phát hiện và xóa ngay các phiên lưu vĩnh viễn trước đây.
 * 3. Hết hạn khi không hoạt động (Inactivity Idle Timeout): Tự động đăng xuất sau 45 phút không thao tác chuột/phím.
 * 4. Phát sự kiện toàn cục (CustomEvent): Đồng bộ trạng thái đăng nhập/đăng xuất tức thì giữa các component (Navbar, EduHub...).
 */

export const TEACHER_SESSION_KEY = 'cbq_current_teacher';
export const TEACHER_LEGACY_KEY = 'cbq_teacher_session';
export const STUDENT_SESSION_KEY = 'cbq_current_student';

// Cấu hình thời gian (Time To Live)
export const TEACHER_DEFAULT_TTL_MS = 3 * 60 * 60 * 1000;    // 3 giờ làm việc mặc định
export const TEACHER_REMEMBER_TTL_MS = 24 * 60 * 60 * 1000;  // 24 giờ nếu tích Ghi nhớ trên máy cá nhân
export const STUDENT_DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;     // 2 giờ cho học sinh làm bài / học tập
export const IDLE_TIMEOUT_MS = 45 * 60 * 1000;               // 45 phút không thao tác -> tự động thoát

/**
 * 1. GIÁO VIÊN: Lưu phiên đăng nhập kèm hạn sử dụng
 */
export function saveTeacherSession(teacherData, rememberMe = false) {
  if (!teacherData) return;
  const now = Date.now();
  const ttl = rememberMe ? TEACHER_REMEMBER_TTL_MS : TEACHER_DEFAULT_TTL_MS;
  const expiresAt = now + ttl;

  const sessionObj = {
    ...teacherData,
    login_at: now,
    expires_at: expiresAt,
    last_active_at: now,
    remember_me: Boolean(rememberMe)
  };

  try {
    localStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify(sessionObj));
    localStorage.removeItem(TEACHER_LEGACY_KEY);
    // Bắn sự kiện để tất cả các trang / component đang mở cập nhật ngay
    window.dispatchEvent(new CustomEvent('cbq-teacher-auth-change', { detail: sessionObj }));
  } catch (e) {
    console.error("Lỗi khi lưu phiên giáo viên:", e);
  }
}

/**
 * 1. GIÁO VIÊN: Lấy phiên đăng nhập an toàn (Tự động xóa nếu hết hạn)
 */
export function getTeacherSession() {
  try {
    const raw = localStorage.getItem(TEACHER_SESSION_KEY) || localStorage.getItem(TEACHER_LEGACY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || (!parsed.username && !parsed.full_name && !parsed.name && !parsed.email)) {
      clearTeacherSession();
      return null;
    }

    const now = Date.now();

    // A. Kiểm tra phiên cũ không có timestamp (như phiên lưu cố định trước đây) -> XÓA NGAY để bảo mật
    if (!parsed.expires_at && !parsed.login_at) {
      console.warn("[AuthSecurity] Phát hiện phiên giáo viên cũ không có thời hạn. Tự động thanh lọc bảo mật.");
      clearTeacherSession();
      return null;
    }

    // B. Kiểm tra nếu đã quá hạn expires_at
    if (parsed.expires_at && now > parsed.expires_at) {
      console.warn("[AuthSecurity] Phiên làm việc của giáo viên đã hết hạn (Session Expired). Tự động đăng xuất.");
      clearTeacherSession();
      return null;
    }

    // C. Kiểm tra nếu không hoạt động quá IDLE_TIMEOUT_MS
    if (parsed.last_active_at && (now - parsed.last_active_at > IDLE_TIMEOUT_MS)) {
      console.warn("[AuthSecurity] Giáo viên không tương tác trong 45 phút. Tự động đăng xuất bảo mật.");
      clearTeacherSession();
      return null;
    }

    // Cập nhật lại thời gian hoạt động gần nhất (Rolling Session)
    parsed.last_active_at = now;
    try {
      localStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify(parsed));
    } catch (_) {}

    return parsed;
  } catch (e) {
    clearTeacherSession();
    return null;
  }
}

/**
 * 1. GIÁO VIÊN: Đăng xuất và xóa phiên làm việc
 */
export function clearTeacherSession() {
  try {
    localStorage.removeItem(TEACHER_SESSION_KEY);
    localStorage.removeItem(TEACHER_LEGACY_KEY);
    window.dispatchEvent(new CustomEvent('cbq-teacher-auth-change', { detail: null }));
  } catch (e) {
    console.error("Lỗi khi xóa phiên giáo viên:", e);
  }
}

/**
 * 2. HỌC SINH: Lưu phiên đăng nhập kèm hạn sử dụng
 */
export function saveStudentSession(studentData) {
  if (!studentData) return;
  const now = Date.now();
  const expiresAt = now + STUDENT_DEFAULT_TTL_MS;

  const sessionObj = {
    ...studentData,
    login_at: now,
    expires_at: expiresAt,
    last_active_at: now
  };

  try {
    localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(sessionObj));
    window.dispatchEvent(new CustomEvent('cbq-student-auth-change', { detail: sessionObj }));
  } catch (e) {
    console.error("Lỗi khi lưu phiên học sinh:", e);
  }
}

/**
 * 2. HỌC SINH: Lấy phiên học sinh an toàn (Tự động xóa nếu hết hạn)
 */
export function getStudentSession() {
  try {
    const raw = localStorage.getItem(STUDENT_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || (!parsed.username && !parsed.student_code && !parsed.full_name)) {
      clearStudentSession();
      return null;
    }

    const now = Date.now();

    // A. Thanh lọc phiên học sinh cũ
    if (!parsed.expires_at && !parsed.login_at) {
      console.warn("[AuthSecurity] Thanh lọc phiên học sinh cũ.");
      clearStudentSession();
      return null;
    }

    // B. Kiểm tra quá hạn
    if (parsed.expires_at && now > parsed.expires_at) {
      console.warn("[AuthSecurity] Phiên học sinh đã hết hạn.");
      clearStudentSession();
      return null;
    }

    // C. Kiểm tra không hoạt động
    if (parsed.last_active_at && (now - parsed.last_active_at > IDLE_TIMEOUT_MS)) {
      clearStudentSession();
      return null;
    }

    parsed.last_active_at = now;
    try {
      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(parsed));
    } catch (_) {}

    return parsed;
  } catch (e) {
    clearStudentSession();
    return null;
  }
}

/**
 * 2. HỌC SINH: Đăng xuất học sinh
 */
export function clearStudentSession() {
  try {
    localStorage.removeItem(STUDENT_SESSION_KEY);
    window.dispatchEvent(new CustomEvent('cbq-student-auth-change', { detail: null }));
  } catch (e) {
    console.error("Lỗi khi xóa phiên học sinh:", e);
  }
}

/**
 * 3. HỆ THỐNG: Khởi tạo bộ lắng nghe tự động kiểm tra định kỳ (Background Heartbeat)
 * Chạy mỗi 1 phút để tự động dọn dẹp các phiên quá hạn ngầm
 */
export function initSessionWatchdog() {
  if (typeof window === 'undefined') return;

  const checkSessions = () => {
    getTeacherSession();
    getStudentSession();
  };

  // Kiểm tra ngay khi khởi động
  checkSessions();

  // Kiểm tra định kỳ mỗi 60 giây
  setInterval(checkSessions, 60 * 1000);

  // Lắng nghe thao tác người dùng để cập nhật rolling session
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  let throttleTimer = null;
  const onUserActivity = () => {
    if (!throttleTimer) {
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        // Chỉ cập nhật nếu đang có phiên đăng nhập
        const rawTeacher = localStorage.getItem(TEACHER_SESSION_KEY);
        if (rawTeacher) {
          try {
            const parsed = JSON.parse(rawTeacher);
            if (parsed && parsed.last_active_at) {
              parsed.last_active_at = Date.now();
              localStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify(parsed));
            }
          } catch (_) {}
        }
      }, 30 * 1000); // Tối đa 30s ghi 1 lần để không tốn I/O
    }
  };

  activityEvents.forEach(evt => {
    window.addEventListener(evt, onUserActivity, { passive: true });
  });
}
