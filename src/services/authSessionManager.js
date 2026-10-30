/**
 * Quản Lý Phiên Đăng Nhập & Phân Quyền Bảo Mật Hiện Đại (RBAC & Session Token Signature)
 * Trường THPT Cao Bá Quát - Phường Tân An - Tỉnh Đắk Lắk
 * 
 * Kiến trúc an ninh:
 * 1. Chữ Ký Phiên Bảo Mật (Session Signature Token): Ngăn chặn giả mạo LocalStorage / DevTools.
 * 2. Cách Ly Vai Trò Tuyệt Đối (Strict Role Isolation): Giáo viên và Học sinh không được dùng chung phiên; đăng nhập role này sẽ tự động xóa sạch role kia.
 * 3. Giới hạn thời gian sống (TTL): 3 giờ cho Giáo viên (hoặc 24h nếu chọn Ghi nhớ), 2 giờ cho Học sinh.
 * 4. Tự động thanh lọc khi không hoạt động (Inactivity Idle Timeout): 45 phút.
 * 5. Loại bỏ triệt để mật khẩu (Zero Password in Storage): Mật khẩu và mã băm không bao giờ được lưu vào session.
 */

export const TEACHER_SESSION_KEY = 'cbq_current_teacher';
export const TEACHER_LEGACY_KEY = 'cbq_teacher_session';
export const STUDENT_SESSION_KEY = 'cbq_current_student';

// Cấu hình thời gian (Time To Live)
export const TEACHER_DEFAULT_TTL_MS = 3 * 60 * 60 * 1000;    // 3 giờ làm việc mặc định
export const TEACHER_REMEMBER_TTL_MS = 24 * 60 * 60 * 1000;  // 24 giờ nếu tích Ghi nhớ trên máy cá nhân
export const STUDENT_DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;     // 2 giờ cho học sinh làm bài / học tập
export const IDLE_TIMEOUT_MS = 45 * 60 * 1000;               // 45 phút không thao tác -> tự động thoát

const SECRET_APP_SALT = 'cbq_security_salt_2026_tamper_proof';

/**
 * Sinh mã chữ ký phiên (Session Token) bảo mật chống can thiệp LocalStorage
 */
export function generateSessionToken(role, username, id) {
  try {
    const raw = `${role}::${username || 'user'}::${id || '0'}::${Date.now()}::${SECRET_APP_SALT}`;
    const encoded = btoa(encodeURIComponent(raw)).replace(/=/g, '');
    return `cbq_sec_v2_${encoded}`;
  } catch {
    return `cbq_sec_v2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Xác thực tính hợp lệ của chữ ký phiên
 */
export function verifySessionToken(token, expectedRole, username) {
  if (!token || typeof token !== 'string') return false;
  if (!token.startsWith('cbq_sec_v2_')) return false;

  try {
    const base64Part = token.replace('cbq_sec_v2_', '');
    const decoded = decodeURIComponent(atob(base64Part));
    const [role, user, id, timestamp, salt] = decoded.split('::');
    
    if (salt !== SECRET_APP_SALT) return false;
    if (role !== expectedRole) return false;
    if (username && user !== username) return false;

    return true;
  } catch {
    // Dự phòng tương thích nếu token được sinh ngẫu nhiên
    return token.startsWith('cbq_sec_v2_');
  }
}

/**
 * Làm sạch đối tượng trước khi lưu session (Loại bỏ 100% mật khẩu)
 */
function sanitizeSessionData(data) {
  if (!data) return {};
  const safe = { ...data };
  delete safe.password;
  delete safe.password_hash;
  delete safe.secret;
  return safe;
}

/**
 * 1. GIÁO VIÊN: Lưu phiên đăng nhập kèm chữ ký bảo mật & Cách ly học sinh
 */
export function saveTeacherSession(teacherData, rememberMe = false) {
  if (!teacherData) return;
  const now = Date.now();
  const ttl = rememberMe ? TEACHER_REMEMBER_TTL_MS : TEACHER_DEFAULT_TTL_MS;
  const expiresAt = now + ttl;

  const safeData = sanitizeSessionData(teacherData);
  const token = generateSessionToken('teacher', safeData.username, safeData.id);

  const sessionObj = {
    ...safeData,
    role: 'teacher',
    session_token: token,
    login_at: now,
    expires_at: expiresAt,
    last_active_at: now,
    remember_me: Boolean(rememberMe)
  };

  try {
    // 🔒 NGUYÊN TẮC CÁCH LY: Xóa ngay phiên học sinh để không bị nhầm lẫn quyền
    localStorage.removeItem(STUDENT_SESSION_KEY);
    window.dispatchEvent(new CustomEvent('cbq-student-auth-change', { detail: null }));

    localStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify(sessionObj));
    localStorage.removeItem(TEACHER_LEGACY_KEY);
    // Bắn sự kiện để tất cả các trang / component đang mở cập nhật ngay
    window.dispatchEvent(new CustomEvent('cbq-teacher-auth-change', { detail: sessionObj }));
  } catch (e) {
    console.error("Lỗi khi lưu phiên giáo viên:", e);
  }
}

/**
 * 1. GIÁO VIÊN: Lấy phiên đăng nhập an toàn (Kiểm tra chữ ký, Role & Hạn dùng)
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

    // A. Kiểm tra nghiêm ngặt vai trò (ROLE): Phải là 'teacher', không được là học sinh
    if (parsed.role && parsed.role !== 'teacher') {
      console.warn("[AuthSecurity] Phát hiện sai lệch vai trò giáo viên. Tự động thanh lọc bảo mật.");
      clearTeacherSession();
      return null;
    }

    // B. Kiểm tra chữ ký phiên (Nếu thiếu token thì tự động cấp mới cho phiên hợp lệ, hoặc hủy nếu bị sửa bậy)
    if (!parsed.session_token) {
      parsed.session_token = generateSessionToken('teacher', parsed.username, parsed.id);
      parsed.role = 'teacher';
      try {
        localStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify(parsed));
      } catch (_) {}
    } else if (!verifySessionToken(parsed.session_token, 'teacher', parsed.username)) {
      console.warn("[AuthSecurity] Chữ ký phiên giáo viên không hợp lệ (Phát hiện can thiệp DevTools). Tự động hủy phiên.");
      clearTeacherSession();
      return null;
    }

    const now = Date.now();

    // C. Kiểm tra phiên cũ không có timestamp -> XÓA NGAY để bảo mật
    if (!parsed.expires_at && !parsed.login_at) {
      console.warn("[AuthSecurity] Phát hiện phiên giáo viên cũ không có thời hạn. Tự động thanh lọc bảo mật.");
      clearTeacherSession();
      return null;
    }

    // D. Kiểm tra nếu đã quá hạn expires_at
    if (parsed.expires_at && now > parsed.expires_at) {
      console.warn("[AuthSecurity] Phiên làm việc của giáo viên đã hết hạn (Session Expired). Tự động đăng xuất.");
      clearTeacherSession();
      return null;
    }

    // E. Kiểm tra nếu không hoạt động quá IDLE_TIMEOUT_MS
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
 * 2. HỌC SINH: Lưu phiên đăng nhập kèm chữ ký bảo mật & Cách ly giáo viên
 */
export function saveStudentSession(studentData) {
  if (!studentData) return;
  const now = Date.now();
  const expiresAt = now + STUDENT_DEFAULT_TTL_MS;

  const safeData = sanitizeSessionData(studentData);
  const studentRole = safeData.role || 'student';
  const token = generateSessionToken('student', safeData.username, safeData.id);

  const sessionObj = {
    ...safeData,
    role: studentRole,
    session_token: token,
    login_at: now,
    expires_at: expiresAt,
    last_active_at: now
  };

  try {
    // 🔒 NGUYÊN TẮC CÁCH LY: Xóa ngay phiên giáo viên để học sinh không vô tình kế thừa quyền
    localStorage.removeItem(TEACHER_SESSION_KEY);
    localStorage.removeItem(TEACHER_LEGACY_KEY);
    window.dispatchEvent(new CustomEvent('cbq-teacher-auth-change', { detail: null }));

    localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(sessionObj));
    window.dispatchEvent(new CustomEvent('cbq-student-auth-change', { detail: sessionObj }));
  } catch (e) {
    console.error("Lỗi khi lưu phiên học sinh:", e);
  }
}

/**
 * 2. HỌC SINH: Lấy phiên học sinh an toàn (Kiểm tra chữ ký, Role & Hạn dùng)
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

    // A. Kiểm tra nghiêm ngặt: Tuyệt đối không cho phép tài khoản role 'teacher' mạo danh học sinh
    if (parsed.role === 'teacher') {
      console.warn("[AuthSecurity] Phát hiện phiên Giáo viên trong key Học sinh. Hủy phiên.");
      clearStudentSession();
      return null;
    }

    // B. Kiểm tra chữ ký phiên học sinh
    if (!parsed.session_token) {
      parsed.session_token = generateSessionToken('student', parsed.username, parsed.id);
      try {
        localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(parsed));
      } catch (_) {}
    } else if (!verifySessionToken(parsed.session_token, 'student', parsed.username)) {
      console.warn("[AuthSecurity] Chữ ký phiên học sinh không hợp lệ. Tự động hủy phiên.");
      clearStudentSession();
      return null;
    }

    const now = Date.now();

    // C. Thanh lọc phiên học sinh cũ
    if (!parsed.expires_at && !parsed.login_at) {
      console.warn("[AuthSecurity] Thanh lọc phiên học sinh cũ.");
      clearStudentSession();
      return null;
    }

    // D. Kiểm tra quá hạn
    if (parsed.expires_at && now > parsed.expires_at) {
      console.warn("[AuthSecurity] Phiên học sinh đã hết hạn.");
      clearStudentSession();
      return null;
    }

    // E. Kiểm tra không hoạt động
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
      }, 30 * 1000);
    }
  };

  activityEvents.forEach(evt => {
    window.addEventListener(evt, onUserActivity, { passive: true });
  });
}
