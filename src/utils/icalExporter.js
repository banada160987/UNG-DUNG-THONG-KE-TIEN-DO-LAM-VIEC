/**
 * ỨNG DỤNG ĐIỀU HÀNH & TIỆN ÍCH THPT CAO BÁ QUÁT
 * Bộ xuất lịch giảng dạy cá nhân sang định dạng iCalendar (.ics)
 * Chuẩn RFC 5545, hỗ trợ chuông báo nhắc giờ 15 phút trước mỗi tiết học
 * Tên tệp tuân thủ quy tắc GEMINI.md: bắt buộc có tiền tố số thứ tự (ví dụ: 1-Lich_giang_day_GV_...)
 */

// Ánh xạ Thứ tiếng Việt sang mã ngày iCalendar và độ lệch ngày so với Thứ Hai
const DAY_MAP = {
  'thứ 2': { byDay: 'MO', dayOffset: 0 },
  'thứ hai': { byDay: 'MO', dayOffset: 0 },
  't2': { byDay: 'MO', dayOffset: 0 },
  'thứ 3': { byDay: 'TU', dayOffset: 1 },
  'thứ ba': { byDay: 'TU', dayOffset: 1 },
  't3': { byDay: 'TU', dayOffset: 1 },
  'thứ 4': { byDay: 'WE', dayOffset: 2 },
  'thứ tư': { byDay: 'WE', dayOffset: 2 },
  't4': { byDay: 'WE', dayOffset: 2 },
  'thứ 5': { byDay: 'TH', dayOffset: 3 },
  'thứ năm': { byDay: 'TH', dayOffset: 3 },
  't5': { byDay: 'TH', dayOffset: 3 },
  'thứ 6': { byDay: 'FR', dayOffset: 4 },
  'thứ sáu': { byDay: 'FR', dayOffset: 4 },
  't6': { byDay: 'FR', dayOffset: 4 },
  'thứ 7': { byDay: 'SA', dayOffset: 5 },
  'thứ bảy': { byDay: 'SA', dayOffset: 5 },
  't7': { byDay: 'SA', dayOffset: 5 },
  'chủ nhật': { byDay: 'SU', dayOffset: 6 },
  'cn': { byDay: 'SU', dayOffset: 6 }
};

/**
 * Lấy ngày Thứ Hai của tuần hiện tại (hoặc tuần kế tiếp nếu hôm nay là Chủ Nhật)
 */
function getTargetMondayDate(baseDate = new Date()) {
  const d = new Date(baseDate);
  const day = d.getDay(); // 0: CN, 1: T2, ..., 6: T7
  const diffToMonday = day === 0 ? 1 : 1 - day; // Nếu là CN thì lấy T2 kế tiếp
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Định dạng Date thành chuỗi iCalendar dạng YYYYMMDDTHHMMSS
 */
function formatIcsDateTime(date, timeString) {
  const [hh, mm] = (timeString || '07:00').split(':').map(Number);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(hh).padStart(2, '0');
  const minutes = String(mm).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

/**
 * Định dạng Date thành chuỗi UTC timestamp YYYYMMDDTHHMMSSZ
 */
function formatUtcStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Làm sạch chuỗi tên tiếng Việt để đặt tên tệp an toàn
 */
function toSafeFilename(str) {
  if (!str) return 'Giao_Vien';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Tạo nội dung tệp .ics cho lịch giảng dạy của giáo viên
 * @param {string} teacherName - Họ tên giáo viên
 * @param {Array} lessons - Mảng các tiết dạy: [{ day, period, subject, class, room }]
 * @param {Array} periodTimings - Mảng cấu hình khung giờ 10 tiết của trường
 * @param {Object} options - Tùy chọn cấu hình (tuần lặp lại, học kỳ...)
 */
export function generateTeacherIcsContent(teacherName, lessons = [], periodTimings = [], options = {}) {
  const nowStamp = formatUtcStamp(new Date());
  const mondayDate = getTargetMondayDate(new Date());
  const repeatWeeks = options.repeatWeeks || 20; // Mặc định 20 tuần cho 1 học kỳ

  // Tiêu đề lịch
  const calendarLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//THPT Cao Ba Quat//TKB Thong Minh//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Lịch Dạy - ${teacherName} (THPT Cao Bá Quát)`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh'
  ];

  lessons.forEach((l, idx) => {
    const rawDay = l.day || l.day_of_week || '';
    const dayKey = String(rawDay).trim().toLowerCase();
    const dayMeta = DAY_MAP[dayKey];
    if (!dayMeta) return;

    const periodNum = Number(l.period);
    const timing = periodTimings.find(pt => pt.period === periodNum);
    const startTime = timing?.start || (periodNum <= 5 ? '07:00' : '13:00');
    const endTime = timing?.end || (periodNum <= 5 ? '07:45' : '13:45');
    const className = l.student_class || l.class || '';

    // Tính ngày cụ thể của tiết đầu tiên trong tuần
    const eventDate = new Date(mondayDate);
    eventDate.setDate(eventDate.getDate() + dayMeta.dayOffset);

    const dtStart = formatIcsDateTime(eventDate, startTime);
    const dtEnd = formatIcsDateTime(eventDate, endTime);
    const uid = `cbq-gv-${toSafeFilename(teacherName)}-p${periodNum}-${dayMeta.byDay}-${idx}@cbq.edu.vn`;

    const summary = `Tiết ${periodNum}: ${className ? `Lớp ${className}` : ''} - Môn ${l.subject || 'Học'}`.trim();
    const description = `Giờ giảng dạy tại Trường THPT Cao Bá Quát\\n- Thầy/Cô: ${teacherName}\\n- Lớp: ${className || 'Chưa rõ'}\\n- Môn học: ${l.subject || 'Chưa xếp'}\\n- Tiết: ${periodNum} (${startTime} - ${endTime})\\n- Điểm danh & Trò chơi lớp học đã sẵn sàng trên hệ thống.`;
    const location = `Phòng học ${className || ''} - Trường THPT Cao Bá Quát`;

    calendarLines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayMeta.byDay};COUNT=${repeatWeeks}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      // Chuông báo nhắc giờ trước 15 phút
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:⏰ Nhắc giờ lên lớp: Tiết ${periodNum} tại Lớp ${l.class || ''} (${startTime} - ${endTime})`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  calendarLines.push('END:VCALENDAR');
  return calendarLines.join('\r\n');
}

/**
 * Tải tệp .ics về máy Thầy/Cô
 * Tuân thủ quy tắc GEMINI.md: Tiền tố số thứ tự ở đầu tên file
 */
export function downloadTeacherScheduleIcs(teacherName, lessons = [], periodTimings = [], options = {}) {
  if (!lessons || lessons.length === 0) {
    throw new Error('Không có tiết dạy nào để xuất lịch.');
  }

  const icsContent = generateTeacherIcsContent(teacherName, lessons, periodTimings, options);
  const safeName = toSafeFilename(teacherName);
  
  // Tuân thủ quy tắc số thứ tự: 1-Lich_giang_day_GV_[TenGiaoVien].ics
  const filename = `1-Lich_giang_day_GV_${safeName}.ics`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
