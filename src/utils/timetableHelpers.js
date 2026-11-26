/**
 * CÁC HẰNG SỐ VÀ TIỆN ÍCH THỜI KHÓA BIỂU TRƯỜNG THPT CAO BÁ QUÁT
 * Thiết kế tinh gọn, siêu nhẹ, phục vụ nhập xuất và hiển thị TKB
 */

export const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
export const PERIODS_MORNING = [1, 2, 3, 4, 5];
export const PERIODS_AFTERNOON = [6, 7, 8, 9, 10];
export const PERIODS_ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const TEACHER_FULL_MAP = {
  "Thảo": "Lê Thị Thảo", "Thơ": "Phạm Thị Nguyệt Thơ", "Lam (T)": "Nguyễn Hữu Lam",
  "Chuyên": "Nguyễn Thị Chuyên", "Hoa (T)": "Nguyễn Thị Ngọc Hoa", "Hà (T)": "Nguyễn Thị Thanh Hà",
  "Khoa": "Vương Quốc Khoa", "Khuyến": "Nguyễn Thị Khuyến", "Khánh": "Nguyễn Ngọc Khánh",
  "Thu": "Lương Thị Kim Thu", "Thùy": "Đặng Thị Thanh Thùy", "Xe": "Võ Xe", "Bão": "Bùi Phong Bão",
  "Huyền": "Nguyễn Thị Thanh Huyền", "Hà (CN)": "Nguyễn Thị Thu Hà", "Thắng (L)": "Nguyễn Hàm Thắng",
  "Hảo": "Nguyễn Đại Vĩnh Hảo", "Yến": "Phạm Thị Hải Yến", "Định": "Nguyễn Thanh Định",
  "Lam (H)": "Trương Thị Hoàng Lam", "Thương": "Văn Thị Thương", "Hồng (H)": "Nguyễn Thị Thúy Hồng",
  "Minh": "Dương Văn Minh", "Phượng": "Nguyễn Thị Kim Phượng", "Thắm": "Phạm Thị Thắm",
  "Tuyết (H)": "Nguyễn Thị Ánh Tuyết", "Tuấn (H)": "Cao Thanh Tuấn", "Êban": "Y Duy Êban",
  "Giang": "Phạm Thị Hương Giang", "Hiền (S)": "Vũ Thị Thu Hiền", "Oanh (S)": "Phạm Thị Ngọc Oanh",
  "Thủy": "Trần Thị Thanh Thủy", "Vinh": "Lương Chấn Vinh", "Hiền (AV)": "Phạm Thị Thu Hiền",
  "Hoa (AV)": "Trần Thị Quỳnh Hoa", "Hà (AV)": "Nguyễn Thị Hà (AV)", "Hậu": "Nguyễn Thị Hậu",
  "Hồng (AV)": "Nguyễn Thị Hồng", "Ngọc": "Bùi Hoài Thanh Ngọc", "Quy": "Võ Thị Kim Quy",
  "Thơm": "Đặng Thị Thơm", "Hà (Văn)": "Nguyễn Thị Hà (V)", "Lan": "Phạm Thị Ngọc Lan",
  "Lài": "Vũ Thị Lài", "Lý": "Võ Thị Minh Lý", "Mùi": "Nguyễn Thị Mùi", "Quyên": "Trần Thị Quế Quyên",
  "Thi": "Phạm Thị Ngọc Thi", "Thúy": "Nguyễn Thị Huỳnh Thúy", "Huệ": "Huỳnh Thị Kim Huệ",
  "Hương": "Lê Thị Mai Hương", "Tâm": "Hoàng Thi Minh Tâm", "Vy": "Lê Đặng Hạnh Vy",
  "Xuân": "Huỳnh Thị Lệ Xuân", "H' Phương": "H' Phương Byă", "Quỳnh": "Nguyễn Thị Hoàng Quỳnh",
  "Thắng (Đ)": "Nguyễn Viết Thắng", "Tú": "Nguyễn Thị Ngọc Tú", "Dũng": "Lê Công Dũng",
  "Oanh": "Lê Ngọc Oanh", "Sự": "Nguyễn Công Sự", "Triều": "Phạm Ngọc Triều",
  "Tuấn (TD)": "Hồ Anh Tuấn", "Tú (TD)": "Huỳnh Thanh Tú", "Đại": "Nguyễn Văn Đại",
  "Tam": "Tam Bou Branh", "Dung": "Phạm Thị Dung", "Hải": "Nguyễn Thị Minh Hải",
  "Nhung": "Lê Thị Hồng Nhung", "Phương": "Lê Thị Phương", "Sáng": "Phạm Quang Sáng",
  "Thuận": "Trần Thị Thuận", "Bảo (CD)": "Khương Văn Bảo", "Tuyết (CD)": "Vương Thị Tuyết",
  "Đại (CD)": "Võ Ngọc Đại", "Hòa": "Phan Thị Hòa", "Đạt": "Ngô Văn Tiến Đạt"
};

export const getFullTeacherName = (name, subject = '') => {
  if (!name) return '';
  const trimmed = String(name).trim();
  let full = TEACHER_FULL_MAP[trimmed] || trimmed;
  if (full === 'Nguyễn Thị Hà' && subject) {
    const s = String(subject).toLowerCase();
    if (s.includes('anh') || s.includes('nn') || s.includes('tiếng anh')) {
      return 'Nguyễn Thị Hà (AV)';
    }
    if (s.includes('văn') || s.includes('ngữ văn') || s.includes('địa phương') || s.includes('gdđp')) {
      return 'Nguyễn Thị Hà (V)';
    }
  }
  return full;
};

export const normalizeClassCode = (cls) => {
  if (!cls) return '';
  const clean = String(cls).trim().toUpperCase();
  const match = clean.match(/^(\d{2}[A-Z]+)(\d{1,2})$/);
  if (match) {
    const prefix = match[1];
    const num = match[2].padStart(2, '0');
    return `${prefix}${num}`;
  }
  return clean;
};

export const isValidStudentClass = (cls) => {
  if (!cls) return false;
  const clean = String(cls).trim().toUpperCase();
  if (clean === 'HOP' || clean === 'BGH' || clean === 'TO' || clean === 'CHUNG') return false;
  return /^(10|11|12)[A-Z0-9]+$/.test(clean);
};
