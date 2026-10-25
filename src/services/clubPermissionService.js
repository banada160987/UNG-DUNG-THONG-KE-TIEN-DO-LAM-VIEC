/**
 * ỨNG DỤNG ĐIỀU HÀNH & TIỆN ÍCH SỐ THPT CAO BÁ QUÁT
 * Dịch Vụ Quản Lý Phân Quyền Chủ Nhiệm / Phụ Trách Câu Lạc Bộ (CLB)
 * Đảm bảo:
 * 1. Chỉ giáo viên được Admin phân công làm Chủ nhiệm CLB mới nhìn thấy chức năng Điểm danh CLB
 * 2. Giáo viên chỉ được xem & điểm danh ĐÚNG câu lạc bộ mình được gán quyền
 * 3. Admin có toàn quyền xem tất cả CLB và phân bổ / gán quyền chủ nhiệm cho giáo viên
 */

import { CLUB_SUB_DISCIPLINES } from '../data/clubSubDisciplines.js';
import masterTimetableData from '../data/master_timetable.json';
import { supabase, supabase2 } from '../lib/supabase.js';

export const CLUB_ASSIGNMENTS_STORAGE_KEY = 'cbq_club_assignments';

/**
 * Phân công mặc định chuẩn theo cơ cấu nhà trường THPT Cao Bá Quát
 */
export const DEFAULT_CLUB_ASSIGNMENTS = {
  'Cờ vua': ['Thầy Nguyễn Công Sự', 'Nguyễn Công Sự'],
  'Bóng đá': ['Thầy Huỳnh Thanh Tú', 'Huỳnh Thanh Tú', 'Thầy Lê Công Dũng', 'Lê Công Dũng'],
  'Pickleball': ['Thầy Lê Ngọc Oanh', 'Lê Ngọc Oanh'],
  'Bóng chuyền nữ': ['Thầy Nguyễn Văn Đại', 'Nguyễn Văn Đại'],
  'Bóng chuyền nam': ['Thầy Hồ Anh Tuấn', 'Hồ Anh Tuấn'],
  'Cầu lông': ['Thầy Phạm Ngọc Triều', 'Phạm Ngọc Triều']
};

/**
 * Chuẩn hóa tên bỏ dấu tiếng Việt để so khớp mềm dẻo (không phân biệt có dấu, không dấu, chữ hoa, chữ thường)
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  str = String(str).toLowerCase().trim();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/[^a-z0-9\s]/g, "");
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Chuẩn hóa danh xưng giáo viên ("Thầy", "Cô", "GV",...)
 */
export function stripTeacherTitle(name) {
  if (!name) return '';
  return String(name)
    .replace(/^(thầy|cô|gv|thầy giáo|cô giáo|thầy\/cô)\s+/i, '')
    .trim();
}

/**
 * Lấy danh sách toàn bộ giáo viên của trường từ thời khóa biểu & danh bạ
 */
export function getAvailableTeachersList() {
  try {
    if (Array.isArray(masterTimetableData)) {
      const names = [...new Set(masterTimetableData.map(d => d.teacher_name).filter(Boolean))];
      return names.sort((a, b) => a.localeCompare(b, 'vi'));
    }
  } catch (e) {}
  return [
    'Nguyễn Công Sự', 'Huỳnh Thanh Tú', 'Lê Công Dũng', 
    'Lê Ngọc Oanh', 'Nguyễn Văn Đại', 'Hồ Anh Tuấn', 'Phạm Ngọc Triều'
  ];
}

/**
 * Đọc bảng phân quyền phân công Chủ nhiệm CLB (kết hợp LocalStorage & Default)
 */
export function getClubAssignments() {
  try {
    const saved = localStorage.getItem(CLUB_ASSIGNMENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_CLUB_ASSIGNMENTS, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc phân quyền CLB từ localStorage:', e);
  }
  return { ...DEFAULT_CLUB_ASSIGNMENTS };
}

/**
 * Lưu bảng phân quyền phân công Chủ nhiệm CLB vào LocalStorage và đồng bộ Cloud
 */
export async function saveClubAssignments(assignments) {
  if (!assignments || typeof assignments !== 'object') return false;
  try {
    // 1. Lưu LocalStorage ngay lập tức
    localStorage.setItem(CLUB_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
    
    // 2. Bắn custom event để mọi component tự động cập nhật lại quyền ngay lập tức
    window.dispatchEvent(new CustomEvent('cbq_club_assignments_updated', { detail: assignments }));

    // 3. Đồng bộ lên Cloud Supabase (nếu có kết nối)
    const client = supabase2 || supabase;
    if (client) {
      try {
        await client.from('cbq_club_sessions').upsert({
          id: 'CONFIG_CLUB_ASSIGNMENTS_META',
          club_name: 'CONFIG_CLUB_ASSIGNMENTS',
          session_number: 0,
          topic: JSON.stringify(assignments).slice(0, 500),
          location: 'CLOUD_CONFIG'
        }, { onConflict: 'id' });
      } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu phân quyền CLB:', err);
    return false;
  }
}

/**
 * Kiểm tra xem giáo viên có được phân công phụ trách câu lạc bộ cụ thể hay không
 * @param {Object} teacher - Đối tượng giáo viên đăng nhập ({ name, username, role,... })
 * @param {string|Object} clubOption - Tên CLB hoặc Object chứa thuộc tính name
 * @param {Object} assignments - Bảng phân công (nếu không truyền sẽ tự đọc)
 */
export function isTeacherAssignedToClub(teacher, clubOption, assignments = null) {
  if (!teacher) return false;

  // 1. Quản trị viên (Admin) luôn có quyền xem và điểm danh mọi CLB
  if (teacher.role === 'admin' || teacher.username === 'admin' || teacher.role === 'quan_tri') {
    return true;
  }

  const currentAssignments = assignments || getClubAssignments();
  const clubNameRaw = typeof clubOption === 'string' ? clubOption : (clubOption?.name || '');
  if (!clubNameRaw) return false;

  const rawClubLower = clubNameRaw.toLowerCase();
  const rawClubClean = removeVietnameseTones(clubNameRaw);

  // Thu thập danh sách tên định danh của giáo viên hiện tại
  const teacherIdentities = [
    teacher.name,
    teacher.full_name,
    teacher.fullName,
    teacher.username,
    stripTeacherTitle(teacher.name),
    stripTeacherTitle(teacher.full_name)
  ].filter(Boolean);

  const cleanTeacherNames = teacherIdentities.map(n => removeVietnameseTones(n)).filter(Boolean);

  // 2. Kiểm tra trực tiếp trong chuỗi tên của CLB (Ví dụ: "1. Cờ vua (Thầy Nguyễn Công Sự - Nhà đa năng)")
  for (const cName of cleanTeacherNames) {
    if (cName.length >= 3 && rawClubClean.includes(cName)) {
      return true;
    }
  }

  // 3. Kiểm tra trong bảng cấu hình phân quyền (assignments)
  for (const [assignedClubKey, coachesList] of Object.entries(currentAssignments)) {
    const keyClean = removeVietnameseTones(assignedClubKey);
    // So khớp xem assignedClubKey có ứng với clubNameRaw không
    const isClubMatch = rawClubClean.includes(keyClean) || keyClean.includes(rawClubClean);

    if (isClubMatch && Array.isArray(coachesList)) {
      for (const coach of coachesList) {
        const coachClean = removeVietnameseTones(stripTeacherTitle(coach));
        for (const tClean of cleanTeacherNames) {
          if (coachClean === tClean || coachClean.includes(tClean) || tClean.includes(coachClean)) {
            return true;
          }
        }
      }
    }
  }

  // 4. Kiểm tra trong danh mục coaches của CLUB_SUB_DISCIPLINES
  for (const clubGroup of Object.values(CLUB_SUB_DISCIPLINES)) {
    if (Array.isArray(clubGroup)) {
      for (const item of clubGroup) {
        const itemClean = removeVietnameseTones(item.name);
        if (rawClubClean.includes(itemClean) || itemClean.includes(rawClubClean)) {
          if (Array.isArray(item.coaches)) {
            for (const coach of item.coaches) {
              const coachClean = removeVietnameseTones(stripTeacherTitle(coach));
              for (const tClean of cleanTeacherNames) {
                if (coachClean === tClean || coachClean.includes(tClean) || tClean.includes(coachClean)) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Lọc danh sách CLB mà giáo viên được quyền quản lý & điểm danh
 * @param {Object} teacher - Đối tượng giáo viên
 * @param {Array} allClubOptions - Danh sách toàn bộ CLB từ form đăng ký
 * @returns {Array} - Danh sách CLB được gán quyền
 */
export function getAssignedClubsForTeacher(teacher, allClubOptions = []) {
  if (!teacher) return [];

  // Admin thấy toàn bộ tất cả CLB
  if (teacher.role === 'admin' || teacher.username === 'admin' || teacher.role === 'quan_tri') {
    return allClubOptions;
  }

  const assignments = getClubAssignments();
  return allClubOptions.filter(clubOpt => isTeacherAssignedToClub(teacher, clubOpt, assignments));
}

/**
 * Kiểm tra xem giáo viên có phải là Chủ nhiệm / Phụ trách ít nhất 1 CLB hay không
 */
export function isTeacherClubManager(teacher, allClubOptions = []) {
  if (!teacher) return false;
  if (teacher.role === 'admin' || teacher.username === 'admin' || teacher.role === 'quan_tri') {
    return true;
  }

  const assigned = getAssignedClubsForTeacher(teacher, allClubOptions);
  return assigned.length > 0;
}
