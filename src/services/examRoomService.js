import { supabase } from '../lib/supabase';
import ExcelJS from 'exceljs';

export const EXAM_SESSIONS_SLUG = 'kttt-exam-sessions-list';
export const EXAM_ROOMS_PREFIX = 'kttt-exam-rooms-';
export const LOCAL_EXAM_SESSIONS_KEY = 'cbq_kttt_exam_sessions';

// ==================== CẤU HÌNH PHÒNG HỌC THỰC TẾ TRƯỜNG THPT CAO BÁ QUÁT ====================
export const CBQ_PHYSICAL_ROOMS = [
  { id: 'R01', name: 'Phòng 01', location: 'Phòng học 10A01 (Tầng 1 - Dãy Nhà A)', capacity: 24 },
  { id: 'R02', name: 'Phòng 02', location: 'Phòng học 10A02 (Tầng 1 - Dãy Nhà A)', capacity: 24 },
  { id: 'R03', name: 'Phòng 03', location: 'Phòng học 10A03 (Tầng 1 - Dãy Nhà A)', capacity: 24 },
  { id: 'R04', name: 'Phòng 04', location: 'Phòng học 10A04 (Tầng 2 - Dãy Nhà A)', capacity: 24 },
  { id: 'R05', name: 'Phòng 05', location: 'Phòng học 10A05 (Tầng 2 - Dãy Nhà A)', capacity: 24 },
  { id: 'R06', name: 'Phòng 06', location: 'Phòng học 10A06 (Tầng 2 - Dãy Nhà A)', capacity: 24 },
  { id: 'R07', name: 'Phòng 07', location: 'Phòng học 10A07 (Tầng 3 - Dãy Nhà A)', capacity: 24 },
  { id: 'R08', name: 'Phòng 08', location: 'Phòng học 10A08 (Tầng 3 - Dãy Nhà A)', capacity: 24 },
  { id: 'R09', name: 'Phòng 09', location: 'Phòng học 10A09 (Tầng 3 - Dãy Nhà A)', capacity: 24 },
  { id: 'R10', name: 'Phòng 10', location: 'Phòng học 11A01 (Tầng 1 - Dãy Nhà B)', capacity: 24 },
  { id: 'R11', name: 'Phòng 11', location: 'Phòng học 11A02 (Tầng 1 - Dãy Nhà B)', capacity: 24 },
  { id: 'R12', name: 'Phòng 12', location: 'Phòng học 11A03 (Tầng 1 - Dãy Nhà B)', capacity: 24 },
  { id: 'R13', name: 'Phòng 13', location: 'Phòng học 11A04 (Tầng 2 - Dãy Nhà B)', capacity: 24 },
  { id: 'R14', name: 'Phòng 14', location: 'Phòng học 11A05 (Tầng 2 - Dãy Nhà B)', capacity: 24 },
  { id: 'R15', name: 'Phòng 15', location: 'Phòng học 11A06 (Tầng 2 - Dãy Nhà B)', capacity: 24 },
  { id: 'R16', name: 'Phòng 16', location: 'Phòng học 12A01 (Tầng 1 - Dãy Nhà C)', capacity: 24 },
  { id: 'R17', name: 'Phòng 17', location: 'Phòng học 12A02 (Tầng 1 - Dãy Nhà C)', capacity: 24 },
  { id: 'R18', name: 'Phòng 18', location: 'Phòng học 12A03 (Tầng 2 - Dãy Nhà C)', capacity: 24 },
  { id: 'R19', name: 'Phòng 19', location: 'Phòng học 12A04 (Tầng 2 - Dãy Nhà C)', capacity: 24 },
  { id: 'R20', name: 'Phòng 20', location: 'Phòng học 12A05 (Tầng 3 - Dãy Nhà C)', capacity: 24 }
];

// ==================== DỮ LIỆU ĐỢT THI MẪU (CHUẨN THEO THỰC TẾ TRƯỜNG) ====================
export const DEFAULT_EXAM_SESSIONS = [
  {
    id: 'kttt-2026-hk1',
    title: 'Kiểm Tra Tập Trung Giữa Học Kỳ I',
    academic_year: '2026 - 2027',
    semester: 'Học kỳ I',
    startDate: '2026-11-04',
    endDate: '2026-11-12',
    status: 'active', // 'active' | 'upcoming' | 'completed'
    notice: 'Thí sinh có mặt tại phòng thi trước giờ phát đề 15 phút. Xuất trình thẻ học sinh hoặc CCCD khi vào phòng thi. Không được mang điện thoại và thiết bị truyền tin vào phòng thi.',
    schedule: [
      {
        id: 'sch-1',
        date: '04/11/2026',
        session: 'Chiều',
        subject: 'Ngữ văn',
        grade: 'Khối 10',
        duration: '90 phút',
        dispatchTime: '14 giờ 20',
        startTime: '14 giờ 30',
        format: 'Tự luận'
      },
      {
        id: 'sch-2',
        date: '05/11/2026',
        session: 'Chiều',
        subject: 'Toán',
        grade: 'Khối 10',
        duration: '90 phút',
        dispatchTime: '14 giờ 20',
        startTime: '14 giờ 30',
        format: 'Trắc nghiệm + Tự luận'
      },
      {
        id: 'sch-3',
        date: '06/11/2026',
        session: 'Chiều',
        subject: 'Tiếng Anh',
        grade: 'Khối 10',
        duration: '60 phút',
        dispatchTime: '14 giờ 20',
        startTime: '14 giờ 30',
        format: 'Trắc nghiệm khách quan'
      },
      {
        id: 'sch-4',
        date: '11/11/2026',
        session: 'Chiều',
        subject: 'Toán',
        grade: 'Khối 11',
        duration: '90 phút',
        dispatchTime: '14 giờ 20',
        startTime: '14 giờ 30',
        format: 'Trắc nghiệm + Tự luận'
      },
      {
        id: 'sch-5',
        date: '11/11/2026',
        session: 'Chiều',
        subject: 'Toán',
        grade: 'Khối 12',
        duration: '90 phút',
        dispatchTime: '14 giờ 20',
        startTime: '14 giờ 30',
        format: 'Trắc nghiệm chuẩn Bộ GD&ĐT (Phần I, II, III)'
      },
      {
        id: 'sch-6',
        date: '12/11/2026',
        session: 'Sáng',
        subject: 'Ngữ văn',
        grade: 'Khối 12',
        duration: '120 phút',
        dispatchTime: '07 giờ 20',
        startTime: '07 giờ 30',
        format: 'Tự luận (Đọc hiểu & Viết)'
      },
      {
        id: 'sch-7',
        date: '12/11/2026',
        session: 'Chiều',
        subject: 'Tiếng Anh',
        grade: 'Khối 11 & Khối 12',
        duration: '60 phút',
        dispatchTime: '14 giờ 20',
        startTime: '14 giờ 30',
        format: 'Trắc nghiệm khách quan'
      }
    ]
  }
];

// ==================== TÀI LIỆU PDF PHÒNG THI CHÍNH THỨC CÔNG BỐ (CHUẨN FORM GOOGLE SITES) ====================
export const DEFAULT_PDF_DOCUMENTS = [
  {
    id: 'pdf-g10',
    title: 'Danh sách phòng KTTT khối 10.pdf',
    grade: 'Khối 10',
    lastModified: '18:24',
    author: 'Xuân Bảo Nghiêm',
    size: '1.2 MB',
    downloadUrl: '/schedules/Danh_sach_phong_KTTT_khoi_10.pdf',
    previewUrl: '#'
  },
  {
    id: 'pdf-g11',
    title: 'Danh sách phòng KTTT khối 11.pdf',
    grade: 'Khối 11',
    lastModified: '17:45',
    author: 'Xuân Bảo Nghiêm',
    size: '1.1 MB',
    downloadUrl: '/schedules/Danh_sach_phong_KTTT_khoi_11.pdf',
    previewUrl: '#'
  },
  {
    id: 'pdf-g12',
    title: 'Danh sách phòng KTTT khối 12.pdf',
    grade: 'Khối 12',
    lastModified: '17:30',
    author: 'Xuân Bảo Nghiêm',
    size: '1.4 MB',
    downloadUrl: '/schedules/Danh_sach_phong_KTTT_khoi_12.pdf',
    previewUrl: '#'
  }
];

// ==================== TÁCH VÀ SO SÁNH HỌ TÊN TIẾNG VIỆT CHUẨN QUY CHẾ THI ====================
export function splitVietnameseName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  const firstName = parts[parts.length - 1];
  const lastName = parts.slice(0, -1).join(' ');
  return { firstName, lastName };
}

export function vietnameseCompare(aName = '', bName = '', aDob = '', bDob = '') {
  const a = splitVietnameseName(aName);
  const b = splitVietnameseName(bName);
  const cmpFirst = a.firstName.localeCompare(b.firstName, 'vi', { sensitivity: 'base' });
  if (cmpFirst !== 0) return cmpFirst;

  const cmpLast = a.lastName.localeCompare(b.lastName, 'vi', { sensitivity: 'base' });
  if (cmpLast !== 0) return cmpLast;

  if (aDob && bDob) {
    return String(aDob).localeCompare(String(bDob));
  }
  return 0;
}

// ==================== LẤY DANH SÁCH CÁC KỲ THI ====================
export async function fetchExamSessions() {
  try {
    const { data, error } = await supabase
      .from('cbq_pages')
      .select('content')
      .eq('slug', EXAM_SESSIONS_SLUG)
      .maybeSingle();

    if (!error && data?.content) {
      const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(LOCAL_EXAM_SESSIONS_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi lấy danh sách kỳ thi từ Supabase, chuyển sang cache:', err);
  }

  // Fallback cache
  const cached = localStorage.getItem(LOCAL_EXAM_SESSIONS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  return DEFAULT_EXAM_SESSIONS;
}

// ==================== LƯU DANH SÁCH CÁC KỲ THI ====================
export async function saveExamSessions(sessions = []) {
  localStorage.setItem(LOCAL_EXAM_SESSIONS_KEY, JSON.stringify(sessions));

  try {
    await supabase.from('cbq_pages').delete().eq('slug', EXAM_SESSIONS_SLUG);
    await supabase.from('cbq_pages').insert([{
      slug: EXAM_SESSIONS_SLUG,
      title: 'Danh sách các kỳ thi kiểm tra tập trung KTTT',
      content: JSON.stringify(sessions),
      updated_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('Lỗi lưu danh sách kỳ thi lên Supabase:', err);
  }
}

// ==================== LẤY DỮ LIỆU PHÒNG THI CỦA 1 KỲ THI ====================
export async function fetchExamRoomsData(sessionId) {
  const slug = `${EXAM_ROOMS_PREFIX}${sessionId}`;
  const localKey = `cbq_kttt_rooms_${sessionId}`;

  try {
    const { data, error } = await supabase
      .from('cbq_pages')
      .select('content')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data?.content) {
      const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      localStorage.setItem(localKey, JSON.stringify(parsed));
      return parsed;
    }
  } catch (err) {
    console.warn('Lỗi lấy phòng thi từ Supabase, chuyển sang cache:', err);
  }

  const cached = localStorage.getItem(localKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  return null;
}

// ==================== LƯU DỮ LIỆU PHÒNG THI ====================
export async function saveExamRoomsData(sessionId, roomsData) {
  const slug = `${EXAM_ROOMS_PREFIX}${sessionId}`;
  const localKey = `cbq_kttt_rooms_${sessionId}`;
  localStorage.setItem(localKey, JSON.stringify(roomsData));

  try {
    await supabase.from('cbq_pages').delete().eq('slug', slug);
    await supabase.from('cbq_pages').insert([{
      slug,
      title: `Dữ liệu phòng thi kỳ thi: ${sessionId}`,
      content: JSON.stringify(roomsData),
      updated_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('Lỗi lưu phòng thi lên Supabase:', err);
  }
}

// ==================== LẤY HỌC SINH TỪ CSDL CBQ_STUDENTS ====================
export async function fetchStudentsFromDb(targetGrade = 'all') {
  try {
    let query = supabase.from('cbq_students').select('*').order('student_class', { ascending: true });
    if (targetGrade && targetGrade !== 'all') {
      query = query.eq('grade_level', targetGrade);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Lỗi lấy danh sách học sinh từ cbq_students:', err);
    return [];
  }
}

/**
 * =========================================================================
 * THUẬT TOÁN XẾP PHÒNG THI & ĐÁNH SỐ BÁO DANH CHUẨN QUY CHẾ BỘ GD&ĐT
 * =========================================================================
 * @param {Array} students - Danh sách học sinh từ cbq_students
 * @param {Object} options
 * @param {string} options.mode - 'national_12' (Chuẩn Tốt nghiệp THPT Quốc Gia Khối 12) | 'regular' (Chuẩn Kiểm tra phổ thông Khối 10, 11)
 * @param {number} options.capacity - Số học sinh mỗi phòng (Mặc định 24 chuẩn quốc gia, hoặc 28-30)
 * @param {string} options.gradeLevel - 'Khối 10' | 'Khối 11' | 'Khối 12' | 'all'
 * @param {string} options.sbdPrefix - Tiền tố SBD (ví dụ '12', '10', '11' hoặc '66')
 * @param {Array} options.physicalRooms - Danh sách phòng học thực tế gán vào
 */
export function generateExamRoomsAlgorithm(students = [], options = {}) {
  const {
    mode = 'national_12',
    capacity = 24,
    gradeLevel = 'Khối 12',
    sbdPrefix = (gradeLevel === 'Khối 12' ? '12' : (gradeLevel === 'Khối 11' ? '11' : '10')),
    physicalRooms = CBQ_PHYSICAL_ROOMS
  } = options;

  // 1. Lọc học sinh theo khối nếu chỉ định
  let targetStudents = [...students];
  if (gradeLevel && gradeLevel !== 'all') {
    targetStudents = targetStudents.filter(s => s.grade_level === gradeLevel);
  }

  if (targetStudents.length === 0) {
    return { rooms: [], totalStudents: 0, totalRooms: 0 };
  }

  // 2. SẮP XẾP VẦN A-B-C TIẾNG VIỆT CHUẨN QUY CHẾ BỘ GD&ĐT (Tên -> Họ và tên đệm -> Ngày sinh)
  targetStudents.sort((a, b) => 
    vietnameseCompare(a.student_name, b.student_name, a.birth_date, b.birth_date)
  );

  // 3. ĐÁNH SỐ BÁO DANH TOÀN CỤC CHUẨN 6 CHỮ SỐ (VD: 120001, 120002... hoặc 100001...)
  const numberedStudents = targetStudents.map((st, idx) => {
    const seqNum = idx + 1;
    const padded = String(seqNum).padStart(4, '0');
    const sbd = `${sbdPrefix}${padded}`; // 6 số: 120001
    return {
      ...st,
      sbd,
      nationalIndex: seqNum
    };
  });

  // 4. PHÂN CHIA VÀO CÁC PHÒNG THI (Mỗi phòng chuẩn 24 thí sinh, phòng chót tối đa 26-28 thí sinh hoặc phòng độc lập)
  const rooms = [];
  const total = numberedStudents.length;
  let cursor = 0;
  let roomIdx = 1;

  while (cursor < total) {
    let currentCapacity = capacity;
    const remaining = total - cursor;

    // Trong kỳ thi chuẩn Quốc gia: nếu phòng cuối cùng còn thừa 1-3 em và không muốn lập phòng riêng thì có thể ghép,
    // hoặc giữ chuẩn 24 em và phòng cuối nhận số em còn lại.
    if (mode === 'national_12') {
      if (remaining <= capacity) {
        currentCapacity = remaining;
      } else if (remaining < capacity + 4) {
        // Nếu còn ít hơn capacity + 4 (ví dụ còn 27 em), có thể chia làm 2 phòng cân đối: 14 và 13 em
        currentCapacity = Math.ceil(remaining / 2);
      }
    } else {
      if (remaining <= capacity) {
        currentCapacity = remaining;
      }
    }

    const roomStudentsSlice = numberedStudents.slice(cursor, cursor + currentCapacity);
    const assignedPhysical = physicalRooms[(roomIdx - 1) % physicalRooms.length] || {
      name: `Phòng ${String(roomIdx).padStart(2, '0')}`,
      location: `Phòng học số ${roomIdx}`
    };

    // Gán vị trí chỗ ngồi / bàn thi zic-zac (01 -> 24)
    const candidatesInRoom = roomStudentsSlice.map((cand, seatIdx) => ({
      ...cand,
      roomNumber: roomIdx,
      roomName: `Phòng ${String(roomIdx).padStart(2, '0')}`,
      roomLocation: assignedPhysical.location,
      seatNumber: seatIdx + 1, // Bàn số 1 -> 24
      seatCode: `B${String(seatIdx + 1).padStart(2, '0')}`
    }));

    rooms.push({
      roomNumber: roomIdx,
      roomName: `Phòng ${String(roomIdx).padStart(2, '0')}`,
      roomLocation: assignedPhysical.location,
      gradeLevel,
      mode,
      capacity: currentCapacity,
      totalCandidates: candidatesInRoom.length,
      startSbd: candidatesInRoom[0]?.sbd,
      endSbd: candidatesInRoom[candidatesInRoom.length - 1]?.sbd,
      invigilator1: 'Phân công sau',
      invigilator2: 'Phân công sau',
      candidates: candidatesInRoom
    });

    cursor += currentCapacity;
    roomIdx++;
  }

  return {
    examId: options.examId || 'kttt-session',
    gradeLevel,
    mode,
    totalStudents: numberedStudents.length,
    totalRooms: rooms.length,
    capacityStandard: capacity,
    isPublished: options.isPublished ?? false,
    createdAt: new Date().toISOString(),
    rooms
  };
}

/**
 * =========================================================================
 * XUẤT FILE EXCEL DANH SÁCH PHÒNG THI CHUẨN NGHỊ ĐỊNH 30 & QUY CHẾ THI
 * Tuân thủ tuyệt đối quy tắc GEMINI.md: Tiền tố số thứ tự 1-Danh_sach_...
 * =========================================================================
 */
export async function exportExamRoomsExcel(examSession, roomsData, options = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Trường THPT Cao Bá Quát - Ban Khảo Thí';
  wb.created = new Date();

  const tournTitle = examSession?.title || 'Kỳ Kiểm Tra Tập Trung';
  const academicYear = examSession?.academic_year || '2026 - 2027';
  const gradeLevel = roomsData?.gradeLevel || 'Toàn Trường';
  const isNational = roomsData?.mode === 'national_12';

  // ==================== SHEET 1: LỊCH KIỂM TRA TẬP TRUNG (CHUẨN FORM TRƯỜNG) ====================
  const wsSchedule = wb.addWorksheet('Lịch Kiểm Tra Tập Trung', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  wsSchedule.columns = [
    { width: 14 }, // A: Ngày
    { width: 10 }, // B: Buổi
    { width: 18 }, // C: Bài thi/Môn thi
    { width: 12 }, // D: Khối
    { width: 16 }, // E: Thời gian làm bài
    { width: 18 }, // F: Giờ phát đề cho TS
    { width: 18 }, // G: Giờ bắt đầu làm bài
    { width: 22 }  // H: Hình thức
  ];

  // Header hành chính
  wsSchedule.mergeCells('A1:C1');
  wsSchedule.getCell('A1').value = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK';
  wsSchedule.getCell('A1').font = { name: 'Times New Roman', size: 10, bold: false };
  wsSchedule.getCell('A1').alignment = { horizontal: 'center' };

  wsSchedule.mergeCells('A2:C2');
  wsSchedule.getCell('A2').value = 'TRƯỜNG THPT CAO BÁ QUÁT';
  wsSchedule.getCell('A2').font = { name: 'Times New Roman', size: 10.5, bold: true };
  wsSchedule.getCell('A2').alignment = { horizontal: 'center' };

  wsSchedule.mergeCells('E1:H1');
  wsSchedule.getCell('E1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  wsSchedule.getCell('E1').font = { name: 'Times New Roman', size: 10.5, bold: true };
  wsSchedule.getCell('E1').alignment = { horizontal: 'center' };

  wsSchedule.mergeCells('E2:H2');
  wsSchedule.getCell('E2').value = 'Độc lập - Tự do - Hạnh phúc';
  wsSchedule.getCell('E2').font = { name: 'Times New Roman', size: 10.5, bold: true, italic: true };
  wsSchedule.getCell('E2').alignment = { horizontal: 'center' };

  // Tiêu đề
  wsSchedule.mergeCells('A4:H4');
  wsSchedule.getCell('A4').value = `LỊCH KIỂM TRA TẬP TRUNG ${tournTitle.toUpperCase()}`;
  wsSchedule.getCell('A4').font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  wsSchedule.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

  wsSchedule.mergeCells('A5:H5');
  wsSchedule.getCell('A5').value = `NĂM HỌC ${academicYear}`;
  wsSchedule.getCell('A5').font = { name: 'Times New Roman', size: 11, bold: true, italic: true, color: { argb: 'FFB91C1C' } };
  wsSchedule.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

  // Header Table
  const hRowSch = wsSchedule.getRow(7);
  hRowSch.height = 28;
  hRowSch.values = ['Ngày', 'Buổi', 'Bài thi/Môn thi', 'Khối', 'Thời gian làm bài', 'Giờ phát đề cho thí sinh', 'Giờ bắt đầu làm bài', 'Hình thức'];
  hRowSch.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  hRowSch.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let c = 1; c <= 8; c++) {
    const cell = hRowSch.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }

  const schList = examSession?.schedule || [];
  schList.forEach((s, sIdx) => {
    const row = wsSchedule.getRow(8 + sIdx);
    row.height = 24;
    row.values = [s.date, s.session, s.subject, s.grade, s.duration, s.dispatchTime, s.startTime, s.format];
    row.font = { name: 'Times New Roman', size: 10.5 };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle', bold: true };
    row.getCell(8).alignment = { horizontal: 'left', vertical: 'middle' };

    for (let c = 1; c <= 8; c++) {
      row.getCell(c).border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    }
  });


  // ==================== SHEET 2: TỔNG HỢP DANH SÁCH PHÒNG THI ====================
  const wsRooms = wb.addWorksheet('Tổng Hợp Các Phòng Thi', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  wsRooms.columns = [
    { width: 6 },  // STT
    { width: 14 }, // Tên phòng
    { width: 12 }, // Khối
    { width: 32 }, // Địa điểm phòng học
    { width: 16 }, // SBD Bắt đầu
    { width: 16 }, // SBD Kết thúc
    { width: 14 }, // Số lượng TS
    { width: 22 }, // Giám thị 1
    { width: 22 }, // Giám thị 2
    { width: 18 }  // Ghi chú quy chế
  ];

  wsRooms.mergeCells('A1:D1');
  wsRooms.getCell('A1').value = 'TRƯỜNG THPT CAO BÁ QUÁT - HỘI ĐỒNG KHẢO THÍ';
  wsRooms.getCell('A1').font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FF1E3A8A' } };

  wsRooms.mergeCells('A3:J3');
  wsRooms.getCell('A3').value = `BẢNG TỔNG HỢP PHÒNG THI ${tournTitle.toUpperCase()} (${gradeLevel.toUpperCase()})`;
  wsRooms.getCell('A3').font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  wsRooms.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  wsRooms.mergeCells('A4:J4');
  wsRooms.getCell('A4').value = `Tiêu chuẩn xếp phòng: ${isNational ? 'Quy chế Thi Tốt Nghiệp THPT Quốc Gia (Tối đa 24 thí sinh/phòng - Vần A-B-C)' : 'Quy chế Kiểm tra Phổ thông định kỳ'} | Tổng số: ${roomsData?.totalRooms || 0} Phòng (${roomsData?.totalStudents || 0} Thí sinh)`;
  wsRooms.getCell('A4').font = { name: 'Times New Roman', size: 10.5, italic: true, color: { argb: 'FF475569' } };
  wsRooms.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

  const hRowRooms = wsRooms.getRow(6);
  hRowRooms.height = 28;
  hRowRooms.values = ['STT', 'Tên Phòng', 'Khối', 'Địa Điểm Phòng Học Thực Tế', 'Từ SBD', 'Đến SBD', 'Số Lượng TS', 'Cán Bộ Coi Thi 1', 'Cán Bộ Coi Thi 2', 'Quy Cách Bàn Thi'];
  hRowRooms.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  hRowRooms.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let c = 1; c <= 10; c++) {
    hRowRooms.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    hRowRooms.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }

  (roomsData?.rooms || []).forEach((rm, rIdx) => {
    const row = wsRooms.getRow(7 + rIdx);
    row.height = 22;
    row.values = [
      rIdx + 1,
      rm.roomName,
      rm.gradeLevel,
      rm.roomLocation,
      rm.startSbd,
      rm.endSbd,
      rm.totalCandidates,
      rm.invigilator1,
      rm.invigilator2,
      isNational ? '24 bàn zic-zac (1.2m)' : 'Chuẩn phòng học'
    ];
    row.font = { name: 'Times New Roman', size: 10.5 };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(5).font = { name: 'Times New Roman', size: 10.5, bold: true };
    row.getCell(6).font = { name: 'Times New Roman', size: 10.5, bold: true };
    row.getCell(7).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFB91C1C' } };

    for (let c = 1; c <= 10; c++) {
      row.getCell(c).border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    }
  });


  // ==================== SHEET 3: CHI TIẾT TỪNG THÍ SINH (ĐIỂM DANH & SBD TOÀN KHỐI) ====================
  const wsDetails = wb.addWorksheet('Danh Sách Chi Tiết Thí Sinh', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  wsDetails.columns = [
    { width: 6 },  // STT
    { width: 14 }, // SBD
    { width: 24 }, // Họ và tên
    { width: 10 }, // Lớp
    { width: 10 }, // Khối
    { width: 12 }, // Phòng thi
    { width: 10 }, // Bàn thi
    { width: 12 }, // Ngày sinh
    { width: 10 }, // Giới tính
    { width: 18 }, // Chữ ký thí sinh
    { width: 16 }  // Điểm số / Ghi chú
  ];

  wsDetails.mergeCells('A1:D1');
  wsDetails.getCell('A1').value = 'TRƯỜNG THPT CAO BÁ QUÁT';
  wsDetails.getCell('A1').font = { name: 'Times New Roman', size: 10, bold: true };

  wsDetails.mergeCells('A3:K3');
  wsDetails.getCell('A3').value = `DANH SÁCH THÍ SINH THAM GIA ${tournTitle.toUpperCase()}`;
  wsDetails.getCell('A3').font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  wsDetails.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  const hRowDet = wsDetails.getRow(5);
  hRowDet.height = 28;
  hRowDet.values = ['STT', 'Số Báo Danh', 'Họ Và Tên Thí Sinh', 'Lớp', 'Khối', 'Phòng Thi', 'Bàn Số', 'Ngày Sinh', 'Giới Tính', 'Ký Nộp Bài', 'Ghi Chú'];
  hRowDet.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
  hRowDet.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let c = 1; c <= 11; c++) {
    hRowDet.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    hRowDet.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }

  let rowCounter = 1;
  let currRow = 6;
  (roomsData?.rooms || []).forEach(rm => {
    (rm.candidates || []).forEach(cand => {
      const row = wsDetails.getRow(currRow);
      row.height = 20;
      row.values = [
        rowCounter,
        cand.sbd,
        cand.student_name,
        cand.student_class,
        cand.grade_level,
        rm.roomName,
        cand.seatNumber,
        cand.birth_date ? new Date(cand.birth_date).toLocaleDateString('vi-VN') : '',
        cand.gender || '',
        '', // Ô ký nộp bài
        ''
      ];
      row.font = { name: 'Times New Roman', size: 10 };
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FF1E3A8A' } };
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle', bold: true };
      row.getCell(7).font = { name: 'Times New Roman', size: 10.5, bold: true };

      for (let c = 1; c <= 11; c++) {
        row.getCell(c).border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      }

      rowCounter++;
      currRow++;
    });
  });


  // ==================== TẢI FILE EXCEL THEO QUY TẮC TIỀN TỐ 1-... ====================
  const safeGrade = String(gradeLevel).replace(/[^a-zA-Z0-9]/g, '_');
  const safeTitle = String(tournTitle).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `1-Danh_sach_phong_thi_${safeTitle}_${safeGrade}_CBQ_${dateStr}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, fileName, totalRooms: roomsData?.totalRooms || 0, totalStudents: roomsData?.totalStudents || 0 };
}
