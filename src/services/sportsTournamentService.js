import { supabase } from '../lib/supabase';
import { ALL_CBQ_CLASSES_34 } from './signmarTournamentService';
import { exportToExcelWithTitle } from '../utils/excelExport';
import ExcelJS from 'exceljs';

export const TOURNAMENTS_SLUG = 'sports-tournaments-list';
export const LOCAL_STORAGE_KEY = 'cbq_sports_tournaments_list';

export const COMMON_SPORTS_PRESETS = [
  'Bóng chuyền Nam - Nữ phối hợp (3 Nam, 3 Nữ)',
  'Bóng chuyền hơi Nữ',
  'Bóng đá Futsal Nam (5 người)',
  'Bóng đá mini Nữ',
  'Kéo co Nam Nữ phối hợp (5 Nam, 5 Nữ)',
  'Cầu lông đơn Nam',
  'Cầu lông đơn Nữ',
  'Cầu lông đôi Nam - Nữ',
  'Pickleball (đôi Nam)',
  'Pickleball (đôi Nữ)',
  'Pickleball (đôi Nam - Nữ)',
  'Cờ vua (Nam / Nữ)',
  'Điền kinh chạy 100m',
  'Bơi lội tự do',
  'Bóng bàn (đơn / đôi)'
];

export const DEFAULT_TOURNAMENTS = [
  {
    id: 'tourn-2026-volleyball-20-11',
    name: 'Giải Bóng chuyền Nam - Nữ phối hợp chào mừng 20/11 (2026)',
    academic_year: '2026-2027',
    short_desc: 'Giải bóng chuyền phối hợp 3 Nam + 3 Nữ thi đấu giữa các Chi đoàn Lớp chào mừng Ngày Nhà giáo Việt Nam 20/11.',
    sports: [
      'Bóng chuyền Nam - Nữ phối hợp (3 Nam, 3 Nữ - Thi đấu theo lớp)'
    ],
    format: 'class_team', // 'class_team' (đội theo lớp) | 'individual' (cá nhân/đôi)
    team_config: {
      require_class: true,
      require_gvcn: true,
      male_count: 3,
      female_count: 3,
      allow_reserves: true
    },
    start_date: '2026-10-20T00:00',
    end_date: '2026-10-30T23:59',
    is_open: true,
    prevent_duplicate: true,
    zalo_link: 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa',
    fee_amount: 0,
    announcement: 'Thời hạn đăng ký: Từ ngày 20/10/2026 đến hết ngày 30/10/2026. Mỗi lớp chỉ đăng ký 01 đội bóng chuyền duy nhất (3 Nam + 3 Nữ).',
    status: 'active',
    created_at: '2026-10-20T00:00:00.000Z'
  },
  {
    id: 'tourn-2026-hoi-thao-30-nam',
    name: 'Hội Thao Giao Lưu Chào Mừng Kỷ Niệm 30 Năm Thành Lập Trường',
    academic_year: '2026-2027',
    short_desc: 'Các môn thi đấu giao lưu giữa Cựu học sinh các khóa, Cán bộ Giáo viên và Đại biểu khách mời.',
    sports: [
      'Bóng đá Futsal Nam (2 hiệp x 20 phút)',
      'Kéo co Nam Nữ phối hợp (5 Nam, 5 Nữ)',
      'Bóng chuyền hơi Nữ (dự kiến 6 đội)',
      'Pickleball (đôi Nam)',
      'Pickleball (đôi Nữ)',
      'Pickleball (đôi Nam - Nữ)'
    ],
    format: 'individual',
    team_config: {
      require_class: false,
      require_gvcn: false,
      male_count: 0,
      female_count: 0,
      allow_reserves: false
    },
    start_date: '2026-10-15T00:00',
    end_date: '2026-11-10T23:59',
    is_open: false,
    is_hidden: true,
    prevent_duplicate: false,
    zalo_link: 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa',
    fee_amount: 300000,
    announcement: 'Hội thao giao lưu Kỷ niệm 30 năm thành lập trường THPT Cao Bá Quát dành cho Cựu học sinh và Thầy cô.',
    status: 'hidden',
    created_at: '2026-10-15T00:00:00.000Z'
  }
];

/**
 * Tải danh sách tất cả các giải đấu từ Database Supabase (với fallback LocalStorage)
 */
export async function fetchTournaments() {
  try {
    const { data, error } = await supabase
      .from('cbq_pages')
      .select('*')
      .eq('slug', TOURNAMENTS_SLUG)
      .maybeSingle();

    if (!error && data && data.content) {
      const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn("fetchTournaments database fallback:", err);
  }

  // Fallback LocalStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_TOURNAMENTS;
}

/**
 * Lưu danh sách giải đấu lên Database Supabase và LocalStorage
 */
export async function saveTournaments(tournamentsList) {
  // 1. Lưu LocalStorage trước để bảo vệ dữ liệu tức thì
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tournamentsList));

  // 2. Lưu vào Supabase Database
  try {
    await supabase.from('cbq_pages').delete().eq('slug', TOURNAMENTS_SLUG);
    const { error } = await supabase.from('cbq_pages').insert([{
      slug: TOURNAMENTS_SLUG,
      title: 'Danh sách Giải đấu Thể thao CBQ',
      content: JSON.stringify(tournamentsList),
      updated_at: new Date().toISOString()
    }]);

    if (error) {
      console.warn("Lỗi lưu Supabase:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn("Lỗi kết nối Supabase:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Kiểm tra trạng thái thời hạn của một giải đấu
 */
export function checkTournamentStatus(tourn) {
  if (!tourn) {
    return {
      allowed: false,
      badge: '🔒 KHÔNG TỒN TẠI',
      color: '#dc2626',
      bg: '#fee2e2',
      border: '#fecaca',
      message: 'Giải đấu không tồn tại hoặc đã bị xóa.'
    };
  }

  if (!tourn.is_open) {
    return {
      allowed: false,
      badge: '🔒 CỔNG ĐĂNG KÝ ĐANG TẠM KHÓA',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      message: 'Ban Tổ Chức đang tạm dừng tiếp nhận hồ sơ đăng ký cho giải đấu này.'
    };
  }

  const now = new Date();
  const start = tourn.start_date ? new Date(tourn.start_date) : null;
  const end = tourn.end_date ? new Date(tourn.end_date) : null;

  if (start && now < start) {
    return {
      allowed: false,
      badge: `⏳ CỔNG CHƯA MỞ (Mở lúc ${start.toLocaleDateString('vi-VN')} ${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`,
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      message: `Cổng tiếp nhận sẽ chính thức mở vào lúc ${start.toLocaleDateString('vi-VN')} ${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.`
    };
  }

  if (end && now > end) {
    return {
      allowed: false,
      badge: '🔒 ĐÃ HẾT HẠN TIẾP NHẬN HỒ SƠ',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      message: `Đã hết thời hạn tiếp nhận hồ sơ (Hạn chót: ${end.toLocaleDateString('vi-VN')} ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}).`
    };
  }

  let remainingDays = '';
  if (end) {
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    remainingDays = diffDays > 0 ? ` (Còn ${diffDays} ngày)` : ' (Hôm nay là hạn chót)';
  }

  return {
    allowed: true,
    badge: `🟢 CỔNG ĐANG MỞ NHẬN HỒ SƠ${remainingDays}`,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    message: 'Cổng đăng ký đang mở nhận hồ sơ.'
  };
}

/**
 * Chuẩn hóa tên lớp học sinh THPT Cao Bá Quát
 * Ví dụ: 'Lớp 10A1' -> '10A01', '10a01' -> '10A01', 'Chi đoàn 11A9' -> '11A09', '12A10' -> '12A10'
 */
export function normalizeClassName(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  const match = str.match(/(10|11|12)\s*[-_./\s]?\s*([a-zA-Z])\s*[-_./\s]?\s*(\d{1,2})/i);
  if (match) {
    const grade = match[1];
    const letter = match[2].toUpperCase();
    const num = parseInt(match[3], 10);
    const padded = num < 10 ? `0${num}` : `${num}`;
    return `${grade}${letter}${padded}`;
  }
  return str.replace(/^(Lớp|Chi\s*đoàn|CĐ)\s+/i, '').trim();
}

/**
 * Lấy danh sách các lớp đã đăng ký và chưa đăng ký giải thể thao
 * Đối chiếu với toàn bộ 34 lớp trường THPT Cao Bá Quát
 */
export function getUnregisteredClasses(tournament, registrations = [], targetSport = 'Tất cả') {
  const tournRegs = (registrations || []).filter(r => {
    if (!tournament) return true;
    if (r.table_group === tournament.id) return true;
    if (!r.table_group) {
      const isVolleyball = (r.sport_name || '').includes('Bóng chuyền') || (r.sport_name || '').includes('20/11');
      if (tournament.id === 'tourn-2026-volleyball-20-11' && isVolleyball) return true;
    }
    return false;
  }).filter(r => {
    if (targetSport === 'Tất cả') return true;
    return (r.sport_name || '').includes(targetSport) || targetSport.includes(r.sport_name || '');
  });

  const registeredMap = new Map();
  const classOccurrences = new Map();

  tournRegs.forEach(reg => {
    const rawClass = reg.cohort_year || reg.unit_name || '';
    const norm = normalizeClassName(rawClass);
    if (norm) {
      if (!classOccurrences.has(norm)) {
        classOccurrences.set(norm, []);
      }
      classOccurrences.get(norm).push(reg);

      let roster = null;
      try {
        if (reg.notes && reg.notes.startsWith('{')) {
          roster = JSON.parse(reg.notes);
        }
      } catch (e) {}

      // Lấy bản ghi mới nhất nếu có nhiều lần nộp
      if (!registeredMap.has(norm)) {
        registeredMap.set(norm, {
          className: norm,
          originalName: rawClass,
          grade: norm.startsWith('10') ? 'Khối 10' : norm.startsWith('11') ? 'Khối 11' : 'Khối 12',
          captain: roster?.captain || reg.full_name || 'Chưa cập nhật',
          phone: reg.phone || roster?.phone || 'Chưa có',
          gvcn: roster?.gvcn || 'Chưa có',
          registeredAt: reg.created_at,
          sportName: reg.sport_name || '',
          registrationId: reg.id
        });
      }
    }
  });

  // Tìm các lớp bị nộp trùng (như 11A06 nộp 2 lần)
  const duplicateClasses = [];
  classOccurrences.forEach((regs, cls) => {
    if (regs.length > 1) {
      duplicateClasses.push({
        className: cls,
        count: regs.length,
        regs
      });
    }
  });

  const registeredList = [];
  const unregisteredList = [];

  const byGrade = {
    'Khối 10': { total: 15, registered: [], unregistered: [] },
    'Khối 11': { total: 9, registered: [], unregistered: [] },
    'Khối 12': { total: 10, registered: [], unregistered: [] }
  };

  ALL_CBQ_CLASSES_34.forEach(cls => {
    const gradeName = cls.grade || (cls.name.startsWith('10') ? 'Khối 10' : cls.name.startsWith('11') ? 'Khối 11' : 'Khối 12');
    if (registeredMap.has(cls.name)) {
      const regInfo = registeredMap.get(cls.name);
      registeredList.push(regInfo);
      if (byGrade[gradeName]) byGrade[gradeName].registered.push(regInfo);
    } else {
      const unregInfo = {
        className: cls.name,
        grade: gradeName,
        id: cls.id
      };
      unregisteredList.push(unregInfo);
      if (byGrade[gradeName]) byGrade[gradeName].unregistered.push(unregInfo);
    }
  });

  const totalClasses = ALL_CBQ_CLASSES_34.length;
  const registeredCount = registeredList.length;
  const unregisteredCount = unregisteredList.length;
  const totalSubmissions = tournRegs.length;
  const completionPercent = totalClasses > 0 ? Math.round((registeredCount / totalClasses) * 100) : 0;

  return {
    totalClasses,
    registeredCount,
    unregisteredCount,
    totalSubmissions,
    duplicateClasses,
    completionPercent,
    byGrade,
    registeredList,
    unregisteredList,
    unregisteredClassNames: unregisteredList.map(u => u.className)
  };
}

/**
 * Tạo văn bản thông báo Zalo chuẩn mực sư phạm Đoàn Trường
 */
export function generateZaloReminderMessage(tournament, unregisteredData, options = {}) {
  const {
    customDeadline = '',
    customNote = '',
    targetSport = 'Tất cả'
  } = options;

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}, ngày ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  const tournName = tournament?.name || 'Giải Thể Thao Học Đường THPT Cao Bá Quát';
  const sportLabel = targetSport && targetSport !== 'Tất cả' ? ` (${targetSport})` : '';
  
  let deadlineStr = customDeadline;
  if (!deadlineStr && tournament?.end_date) {
    const end = new Date(tournament.end_date);
    deadlineStr = `${end.toLocaleDateString('vi-VN')} lúc ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (!deadlineStr) {
    deadlineStr = 'Trước 17h00 ngày 30/10/2026';
  }

  const { totalClasses, registeredCount, unregisteredCount, completionPercent, byGrade } = unregisteredData;

  const k10Unreg = byGrade['Khối 10'].unregistered.map(u => u.className).join(', ') || 'Đã nộp đủ 15/15 lớp (100% 🎉)';
  const k11Unreg = byGrade['Khối 11'].unregistered.map(u => u.className).join(', ') || 'Đã nộp đủ 9/9 lớp (100% 🎉)';
  const k12Unreg = byGrade['Khối 12'].unregistered.map(u => u.className).join(', ') || 'Đã nộp đủ 10/10 lớp (100% 🎉)';

  let msg = `📢 [ĐOÀN TRƯỜNG THPT CAO BÁ QUÁT]\n`;
  msg += `THÔNG BÁO TIẾN ĐỘ NỘP HỒ SƠ ĐĂNG KÝ THI ĐẤU THỂ THAO\n`;
  msg += `------------------------------------\n`;
  msg += `🏆 Giải đấu: ${tournName}${sportLabel}\n`;
  msg += `⏱ Cập nhật lúc: ${timeStr}\n`;
  msg += `📊 Tiến độ toàn trường: ${registeredCount}/${totalClasses} Chi đoàn (${completionPercent}%)\n\n`;

  if (unregisteredCount === 0) {
    msg += `🎉 XIN CHÚC MỪNG TOÀN THỂ 34 CHI ĐOÀN LỚP ĐÃ HOÀN TẤT NỘP DANH SÁCH 100%!\n`;
    msg += `Ban Tổ Chức đang tiến hành niêm yết danh sách và chuẩn bị công tác bốc thăm sơ đồ Signmar.\n`;
  } else {
    msg += `⚠️ DANH SÁCH ${unregisteredCount} CHI ĐOÀN LỚP CHƯA NỘP HỒ SƠ:\n\n`;
    msg += `🔴 Khối 10 (Chưa nộp: ${byGrade['Khối 10'].unregistered.length}/15 lớp):\n👉 ${k10Unreg}\n\n`;
    msg += `🔴 Khối 11 (Chưa nộp: ${byGrade['Khối 11'].unregistered.length}/9 lớp):\n👉 ${k11Unreg}\n\n`;
    msg += `🔴 Khối 12 (Chưa nộp: ${byGrade['Khối 12'].unregistered.length}/10 lớp):\n👉 ${k12Unreg}\n\n`;
    msg += `------------------------------------\n`;
    msg += `⏰ HẠN CHÓT TIẾP NHẬN HỒ SƠ: ${deadlineStr}\n`;
  }

  msg += `🌐 CỔNG ĐĂNG KÝ TRỰC TUYẾN: https://thptcaobaquat.vercel.app/dang-ky-the-thao\n`;
  if (tournament?.zalo_link) {
    msg += `📲 LINK NHÓM ZALO GIẢI ĐẤU: ${tournament.zalo_link}\n`;
  }

  if (customNote && customNote.trim()) {
    msg += `\n💬 LƯU Ý TỪ BAN TỔ CHỨC:\n${customNote.trim()}\n`;
  }

  msg += `\nTrân trọng đề nghị Quý Thầy/Cô GVCN và Ban Cán sự các Chi đoàn lớp khẩn trương hoàn tất đăng ký để Ban Tổ Chức tiến hành bốc thăm Signmar xếp lịch thi đấu!`;

  return msg;
}

/**
 * Xuất file Excel danh sách các lớp chưa đăng ký thể thao
 * Tuân thủ quy tắc GEMINI.md: Tiền tố số thứ tự 1-Danh_sach_cac_lop_chua_dang_ky_the_thao_[TenGiai].xlsx
 */
export function exportUnregisteredClassesExcel(tournament, unregisteredData) {
  const { unregisteredList, registeredCount, totalClasses } = unregisteredData;
  const tournName = tournament?.name || 'Giai_The_Thao';
  const safeTournName = tournName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 40);

  const reportData = [
    ["STT", "Khối Lớp", "Tên Chi Đoàn Lớp", "Tình Trạng Hồ Sơ", "Thời Gian Kiểm Tra", "Ghi Chú Ban Tổ Chức"],
    ...unregisteredList.map((item, index) => [
      index + 1,
      item.grade,
      item.className,
      "CHƯA ĐĂNG KÝ",
      new Date().toLocaleString('vi-VN'),
      "Chưa nộp danh sách VĐV lên hệ thống"
    ])
  ];

  const cols = [
    { wch: 8 },  // STT
    { wch: 15 }, // Khối Lớp
    { wch: 20 }, // Tên Chi Đoàn
    { wch: 22 }, // Tình Trạng
    { wch: 25 }, // Thời Gian
    { wch: 35 }  // Ghi Chú
  ];

  exportToExcelWithTitle({
    reportName: `DANH SÁCH CHI ĐOÀN LỚP CHƯA ĐĂNG KÝ THI ĐẤU - ${tournName.toUpperCase()} (ĐÃ NỘP: ${registeredCount}/${totalClasses})`,
    data: reportData,
    cols,
    sheetName: "Lop_Chua_Dang_Ky",
    fileName: `1-Danh_sach_cac_lop_chua_dang_ky_the_thao_${safeTournName}.xlsx`
  });
}

// ==================== CÔNG CỤ CHUẨN HÓA DỮ LIỆU ĐỘI HÌNH & CẦU THỦ ====================
export function parseTeamRoster(registrationItem) {
  let roster = null;
  try {
    roster = typeof registrationItem.notes === 'string' 
      ? JSON.parse(registrationItem.notes) 
      : (registrationItem.notes || {});
  } catch (e) {
    roster = {};
  }

  const className = registrationItem.cohort_year || registrationItem.unit_name || roster?.class || '';
  const grade = className.startsWith('10') ? 'Khối 10' : (className.startsWith('11') ? 'Khối 11' : (className.startsWith('12') ? 'Khối 12' : 'Toàn trường'));
  const captain = (roster?.captain || registrationItem.full_name || '').trim();
  const captainPhone = (roster?.captain_phone || registrationItem.phone || '').trim();
  const gvcn = (roster?.gvcn || '').trim();
  const extraNotes = (roster?.extra_notes || (!roster?.captain ? registrationItem.notes : '') || '').trim();

  const males = Array.isArray(roster?.male_athletes) 
    ? roster.male_athletes.map(s => String(s).trim()).filter(Boolean)
    : (typeof roster?.male_athletes === 'string' ? roster.male_athletes.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : []);

  const females = Array.isArray(roster?.female_athletes) 
    ? roster.female_athletes.map(s => String(s).trim()).filter(Boolean)
    : (typeof roster?.female_athletes === 'string' ? roster.female_athletes.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : []);

  const reservesRaw = roster?.reserves || '';
  const reserves = Array.isArray(reservesRaw) 
    ? reservesRaw.map(s => String(s).trim()).filter(Boolean)
    : (typeof reservesRaw === 'string' ? reservesRaw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : []);

  return {
    id: registrationItem.id,
    className,
    grade,
    captain,
    captainPhone,
    gvcn,
    males,
    females,
    reserves,
    extraNotes,
    totalAthletes: males.length + females.length + reserves.length,
    sportName: registrationItem.sport_name || '',
    registeredAt: registrationItem.created_at,
    raw: registrationItem
  };
}

/**
 * Hàm sắp xếp danh sách các lớp theo thứ tự chuẩn: 10A01 -> 10A15, 11A01 -> 11A09, 12A01 -> 12A10
 */
export function sortClassesStandard(classList = []) {
  const parseClass = (name = '') => {
    const match = String(name).match(/(\d+)\s*([a-zA-Z]+)\s*(\d+)/);
    if (match) {
      return {
        grade: parseInt(match[1], 10),
        letter: match[2].toUpperCase(),
        num: parseInt(match[3], 10)
      };
    }
    return { grade: 99, letter: name, num: 99 };
  };

  return [...classList].sort((a, b) => {
    const nameA = a.className || a.cohort_year || a.unit_name || '';
    const nameB = b.className || b.cohort_year || b.unit_name || '';
    const pA = parseClass(nameA);
    const pB = parseClass(nameB);
    if (pA.grade !== pB.grade) return pA.grade - pB.grade;
    if (pA.letter !== pB.letter) return pA.letter.localeCompare(pB.letter);
    return pA.num - pB.num;
  });
}

/**
 * XUẤT FILE EXCEL DANH SÁCH CẦU THỦ / VẬN ĐỘNG VIÊN THI ĐẤU (CHUẨN ĐỊNH DẠNG EXCELJS)
 * - Tuân thủ quy tắc GEMINI.md: Tiền tố số thứ tự 1-Danh_sach_cau_thu_thi_dau_...
 * - Sheet 1: Bảng tổng hợp theo từng Chi đoàn lớp (Đội trưởng, GVCN, 3 Nam, 3 Nữ, Dự bị, Tổng VĐV, Trạng thái hồ sơ, Ký duyệt 3 bên)
 * - Sheet 2: Danh sách chi tiết bóc tách từng VĐV/cầu thủ (kèm cột ký tên điểm danh vào sân, kiểm tra thẻ HS cho Tổ Trọng Tài)
 * - Sheet 3: Thống kê số lượng VĐV theo từng khối (Khối 10, Khối 11, Khối 12)
 */
export async function exportAthletesListExcel(tournament, registrations = [], options = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Trường THPT Cao Bá Quát - Ban Tổ Chức Hội Thao';
  wb.created = new Date();

  const tournTitle = tournament?.name || 'Hội Thao Thể Dục Thể Thao';
  const academicYear = tournament?.academic_year || '2026 - 2027';
  const sportName = options.sportFilter && options.sportFilter !== 'Tất cả' ? options.sportFilter : (tournament?.sports?.[0] || 'Bóng Chuyền');

  // Lọc theo môn nếu có
  let filtered = [...registrations];
  if (options.sportFilter && options.sportFilter !== 'Tất cả') {
    filtered = filtered.filter(r => 
      (r.sport_name || '').includes(options.sportFilter) || options.sportFilter.includes(r.sport_name || '')
    );
  }

  // Khử trùng lớp (chỉ giữ bản ghi mới nhất của mỗi lớp)
  const classMap = new Map();
  // Sắp xếp theo created_at giảm dần để lấy bản ghi mới nhất trước
  const sortedByDate = [...filtered].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  sortedByDate.forEach(r => {
    const cls = r.cohort_year || r.unit_name;
    if (cls && !classMap.has(cls)) {
      classMap.set(cls, r);
    }
  });

  // Chuyển sang dạng object đã parse
  const parsedTeams = Array.from(classMap.values()).map(r => parseTeamRoster(r));

  // Sắp xếp thứ tự lớp chuẩn: 10A01 -> 10A15, 11A01 -> 11A09, 12A01 -> 12A10
  const sortedTeams = sortClassesStandard(parsedTeams);

  // Thống kê tổng số VĐV
  let totalMaleAthletes = 0;
  let totalFemaleAthletes = 0;
  let totalReserves = 0;
  sortedTeams.forEach(t => {
    totalMaleAthletes += t.males.length;
    totalFemaleAthletes += t.females.length;
    totalReserves += t.reserves.length;
  });
  const totalAllAthletes = totalMaleAthletes + totalFemaleAthletes + totalReserves;

  // ==================== SHEET 1: TỔNG HỢP THEO ĐỘI LỚP ====================
  const wsSummary = wb.addWorksheet('Tổng Hợp Theo Đội Lớp', {
    pageSetup: { 
      paperSize: 9, // A4
      orientation: 'landscape', 
      fitToPage: true, 
      fitToWidth: 1, 
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
    }
  });

  wsSummary.columns = [
    { width: 6 },  // A: STT
    { width: 14 }, // B: Chi Đoàn / Lớp
    { width: 10 }, // C: Khối
    { width: 22 }, // D: Đội Trưởng
    { width: 14 }, // E: Số Điện Thoại
    { width: 22 }, // F: GVCN Phụ Trách
    { width: 30 }, // G: 03 VĐV Nam Chính Thức
    { width: 30 }, // H: 03 VĐV Nữ Chính Thức
    { width: 30 }, // I: VĐV Dự Bị
    { width: 12 }, // J: Tổng VĐV
    { width: 18 }, // K: Tình Trạng Hồ Sơ
    { width: 22 }  // L: Ghi Chú
  ];

  // Header hành chính Quốc hiệu - Tiêu ngữ
  wsSummary.mergeCells('A1:E1');
  wsSummary.getCell('A1').value = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK';
  wsSummary.getCell('A1').font = { name: 'Times New Roman', size: 10, bold: false };
  wsSummary.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  wsSummary.mergeCells('A2:E2');
  wsSummary.getCell('A2').value = 'TRƯỜNG THPT CAO BÁ QUÁT';
  wsSummary.getCell('A2').font = { name: 'Times New Roman', size: 10.5, bold: true };
  wsSummary.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

  wsSummary.mergeCells('A3:E3');
  wsSummary.getCell('A3').value = 'BAN TỔ CHỨC HỘI THAO HỌC ĐƯỜNG';
  wsSummary.getCell('A3').font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FF1E3A8A' } };
  wsSummary.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  wsSummary.mergeCells('H1:L1');
  wsSummary.getCell('H1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  wsSummary.getCell('H1').font = { name: 'Times New Roman', size: 10.5, bold: true };
  wsSummary.getCell('H1').alignment = { horizontal: 'center', vertical: 'middle' };

  wsSummary.mergeCells('H2:L2');
  wsSummary.getCell('H2').value = 'Độc lập - Tự do - Hạnh phúc';
  wsSummary.getCell('H2').font = { name: 'Times New Roman', size: 10.5, bold: true, italic: true };
  wsSummary.getCell('H2').alignment = { horizontal: 'center', vertical: 'middle' };

  wsSummary.mergeCells('H3:L3');
  wsSummary.getCell('H3').value = '---------------***---------------';
  wsSummary.getCell('H3').font = { name: 'Times New Roman', size: 9, color: { argb: 'FF64748B' } };
  wsSummary.getCell('H3').alignment = { horizontal: 'center', vertical: 'middle' };

  // Tiêu đề biểu mẫu
  wsSummary.mergeCells('A5:L5');
  wsSummary.getCell('A5').value = 'BẢNG TỔNG HỢP DANH SÁCH CẦU THỦ / VẬN ĐỘNG VIÊN THI ĐẤU';
  wsSummary.getCell('A5').font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF1E3A8A' } };
  wsSummary.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

  wsSummary.mergeCells('A6:L6');
  wsSummary.getCell('A6').value = `${tournTitle.toUpperCase()} - NĂM HỌC ${academicYear}`;
  wsSummary.getCell('A6').font = { name: 'Times New Roman', size: 11.5, bold: true, italic: true, color: { argb: 'FFB91C1C' } };
  wsSummary.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };

  wsSummary.mergeCells('A7:L7');
  wsSummary.getCell('A7').value = `Môn thi đấu: ${sportName} | Tổng số: ${sortedTeams.length} Đội (${totalAllAthletes} Cầu thủ / VĐV) | Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}`;
  wsSummary.getCell('A7').font = { name: 'Times New Roman', size: 10, italic: true, color: { argb: 'FF475569' } };
  wsSummary.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };

  // Dòng Header bảng (Dòng 9)
  const headerRow1 = wsSummary.getRow(9);
  headerRow1.height = 32;
  headerRow1.values = [
    'STT', 'Chi Đoàn Lớp', 'Khối', 'Đội Trưởng', 'SĐT Liên Hệ', 'GVCN Phụ Trách',
    '03 VĐV Nam Chính Thức', '03 VĐV Nữ Chính Thức', 'VĐV Dự Bị', 'Số VĐV', 'Tình Trạng', 'Ghi Chú'
  ];
  headerRow1.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let c = 1; c <= 12; c++) {
    const cell = headerRow1.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' } // Xanh Navy trang trọng
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  }

  // Dữ liệu từng đội
  sortedTeams.forEach((team, idx) => {
    const row = wsSummary.getRow(10 + idx);
    
    const maleText = team.males.map((m, i) => `${i + 1}. ${m}`).join('\n') || '(Chưa có danh sách)';
    const femaleText = team.females.map((f, i) => `${i + 1}. ${f}`).join('\n') || '(Chưa có danh sách)';
    const reserveText = team.reserves.length > 0 
      ? team.reserves.map((r, i) => `${i + 1}. ${r}`).join('\n') 
      : '-';

    const isComplete = team.males.length >= 3 && team.females.length >= 3;
    const statusText = isComplete ? 'Hợp lệ (Đủ 6 CT)' : '⚠️ Cần kiểm tra lại';

    row.values = [
      idx + 1,
      team.className,
      team.grade,
      team.captain,
      team.captainPhone,
      team.gvcn || '-',
      maleText,
      femaleText,
      reserveText,
      team.totalAthletes,
      statusText,
      team.extraNotes || ''
    ];

    // Chiều cao tự động dựa theo số VĐV (mỗi dòng cách nhau khoảng 16pt)
    const maxLines = Math.max(team.males.length, team.females.length, team.reserves.length, 3);
    row.height = Math.max(38, maxLines * 16 + 8);

    row.font = { name: 'Times New Roman', size: 10.5 };
    row.alignment = { vertical: 'middle', wrapText: true };

    // Căn lề riêng từng cột
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // STT
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }; // Lớp
    row.getCell(2).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }; // Khối
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };   // Đội trưởng
    row.getCell(4).font = { name: 'Times New Roman', size: 10.5, bold: true };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }; // SĐT
    row.getCell(6).alignment = { horizontal: 'left', vertical: 'middle' };   // GVCN
    row.getCell(7).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // Nam
    row.getCell(8).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // Nữ
    row.getCell(9).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // Dự bị
    row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' }; // Tổng
    row.getCell(10).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF047857' } };
    row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' }; // Tình trạng
    row.getCell(11).font = { name: 'Times New Roman', size: 10, bold: isComplete, color: { argb: isComplete ? 'FF166534' : 'FFB45309' } };
    row.getCell(12).alignment = { horizontal: 'left', vertical: 'middle' }; // Ghi chú

    // Zebra background
    const bgArgb = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
    for (let c = 1; c <= 12; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }
  });

  // Hàng Tổng Cộng
  const totalRowIdx = 10 + sortedTeams.length;
  const totalRow = wsSummary.getRow(totalRowIdx);
  totalRow.height = 30;
  wsSummary.mergeCells(`A${totalRowIdx}:I${totalRowIdx}`);
  totalRow.getCell(1).value = `TỔNG CỘNG TOÀN TRƯỜNG: ${sortedTeams.length} CHI ĐOÀN LỚP ĐĂNG KÝ THI ĐẤU`;
  totalRow.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
  totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell(10).value = totalAllAthletes;
  totalRow.getCell(10).font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFB91C1C' } };
  totalRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell(11).value = '100% Sẵn sàng';
  totalRow.getCell(11).font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FF047857' } };
  totalRow.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell(12).value = '';

  for (let c = 1; c <= 12; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' } // Màu vàng kem tổng kết nổi bật
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFD97706' } },
      left: { style: 'thin', color: { argb: 'FFD97706' } },
      bottom: { style: 'medium', color: { argb: 'FFD97706' } },
      right: { style: 'thin', color: { argb: 'FFD97706' } }
    };
  }

  // Khối ký duyệt 3 bên (dưới bảng)
  const signRowIdx = totalRowIdx + 2;
  wsSummary.mergeCells(`B${signRowIdx}:D${signRowIdx}`);
  wsSummary.getCell(`B${signRowIdx}`).value = 'NGƯỜI LẬP BIỂU';
  wsSummary.getCell(`B${signRowIdx}`).font = { name: 'Times New Roman', size: 11, bold: true };
  wsSummary.getCell(`B${signRowIdx}`).alignment = { horizontal: 'center' };

  wsSummary.mergeCells(`F${signRowIdx}:H${signRowIdx}`);
  wsSummary.getCell(`F${signRowIdx}`).value = 'BÍ THƯ ĐOÀN TRƯỜNG';
  wsSummary.getCell(`F${signRowIdx}`).font = { name: 'Times New Roman', size: 11, bold: true };
  wsSummary.getCell(`F${signRowIdx}`).alignment = { horizontal: 'center' };

  wsSummary.mergeCells(`J${signRowIdx}:L${signRowIdx}`);
  wsSummary.getCell(`J${signRowIdx}`).value = 'TRƯỞNG BAN TỔ CHỨC / BGH';
  wsSummary.getCell(`J${signRowIdx}`).font = { name: 'Times New Roman', size: 11, bold: true };
  wsSummary.getCell(`J${signRowIdx}`).alignment = { horizontal: 'center' };

  const signNoteRowIdx = signRowIdx + 1;
  wsSummary.mergeCells(`B${signNoteRowIdx}:D${signNoteRowIdx}`);
  wsSummary.getCell(`B${signNoteRowIdx}`).value = '(Ký, ghi rõ họ tên)';
  wsSummary.getCell(`B${signNoteRowIdx}`).font = { name: 'Times New Roman', size: 9.5, italic: true };
  wsSummary.getCell(`B${signNoteRowIdx}`).alignment = { horizontal: 'center' };

  wsSummary.mergeCells(`F${signNoteRowIdx}:H${signNoteRowIdx}`);
  wsSummary.getCell(`F${signNoteRowIdx}`).value = '(Ký, ghi rõ họ tên)';
  wsSummary.getCell(`F${signNoteRowIdx}`).font = { name: 'Times New Roman', size: 9.5, italic: true };
  wsSummary.getCell(`F${signNoteRowIdx}`).alignment = { horizontal: 'center' };

  wsSummary.mergeCells(`J${signNoteRowIdx}:L${signNoteRowIdx}`);
  wsSummary.getCell(`J${signNoteRowIdx}`).value = '(Ký tên, đóng dấu)';
  wsSummary.getCell(`J${signNoteRowIdx}`).font = { name: 'Times New Roman', size: 9.5, italic: true };
  wsSummary.getCell(`J${signNoteRowIdx}`).alignment = { horizontal: 'center' };


  // ==================== SHEET 2: CHI TIẾT TỪNG CẦU THỦ (TỔ TRỌNG TÀI) ====================
  const wsDetail = wb.addWorksheet('Chi Tiết Từng Cầu Thủ', {
    pageSetup: { 
      paperSize: 9, // A4
      orientation: 'portrait', 
      fitToPage: true, 
      fitToWidth: 1, 
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5 }
    }
  });

  wsDetail.columns = [
    { width: 6 },  // A: STT
    { width: 12 }, // B: Lớp
    { width: 10 }, // C: Khối
    { width: 24 }, // D: Họ và Tên Cầu Thủ / VĐV
    { width: 10 }, // E: Giới Tính
    { width: 24 }, // F: Vai Trò Trong Đội
    { width: 12 }, // G: Số Áo / Vị Trí
    { width: 20 }, // H: GVCN Phụ Trách
    { width: 14 }, // I: SĐT Đội Trưởng
    { width: 18 }, // J: Ký Nhận Vào Sân
    { width: 18 }  // K: Kiểm Tra Thẻ HS
  ];

  // Header hành chính Sheet 2
  wsDetail.mergeCells('A1:E1');
  wsDetail.getCell('A1').value = 'TRƯỜNG THPT CAO BÁ QUÁT - TỔ TRỌNG TÀI & THƯ KÝ';
  wsDetail.getCell('A1').font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };

  wsDetail.mergeCells('G1:K1');
  wsDetail.getCell('G1').value = `HỘI THAO NĂM HỌC ${academicYear}`;
  wsDetail.getCell('G1').font = { name: 'Times New Roman', size: 10, italic: true };
  wsDetail.getCell('G1').alignment = { horizontal: 'right' };

  wsDetail.mergeCells('A3:K3');
  wsDetail.getCell('A3').value = 'DANH SÁCH CHI TIẾT TỪNG CẦU THỦ / VẬN ĐỘNG VIÊN THI ĐẤU';
  wsDetail.getCell('A3').font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FF047857' } };
  wsDetail.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  wsDetail.mergeCells('A4:K4');
  wsDetail.getCell('A4').value = '(Phục vụ Tổ Trọng tài, Giám thị & Y tế đối chiếu thẻ học sinh và điểm danh trước khi vào sân)';
  wsDetail.getCell('A4').font = { name: 'Times New Roman', size: 10, italic: true, color: { argb: 'FF64748B' } };
  wsDetail.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

  const headerRow2 = wsDetail.getRow(6);
  headerRow2.height = 28;
  headerRow2.values = [
    'STT', 'Lớp', 'Khối', 'Họ Và Tên Cầu Thủ / VĐV', 'Giới Tính',
    'Vai Trò Thi Đấu', 'Số Áo', 'GVCN Phụ Trách', 'SĐT ĐT', 'Ký Nhận Vào Sân', 'Kiểm Tra Thẻ HS'
  ];
  headerRow2.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let c = 1; c <= 11; c++) {
    const cell = headerRow2.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' } // Xanh lá cây thể thao
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  }

  // Bóc tách từng cầu thủ thành từng dòng độc lập
  let athleteCounter = 1;
  let detailRowIdx = 7;

  sortedTeams.forEach((team) => {
    const normCaptain = (team.captain || '').toLowerCase().trim();
    const classPlayers = [];

    // 1. Kiểm tra các bạn nam
    team.males.forEach((mName, mIdx) => {
      const isCap = normCaptain && mName.toLowerCase().trim() === normCaptain;
      classPlayers.push({
        name: mName,
        gender: 'Nam',
        role: isCap ? 'Đội Trưởng (Nam CT)' : `Nam Chính Thức #${mIdx + 1}`
      });
    });

    // 2. Kiểm tra các bạn nữ
    team.females.forEach((fName, fIdx) => {
      const isCap = normCaptain && fName.toLowerCase().trim() === normCaptain;
      classPlayers.push({
        name: fName,
        gender: 'Nữ',
        role: isCap ? 'Đội Trưởng (Nữ CT)' : `Nữ Chính Thức #${fIdx + 1}`
      });
    });

    // 3. Nếu Đội trưởng không nằm trong danh sách nam/nữ chính thức (ví dụ lớp ghi khác)
    const capAlreadyIn = classPlayers.some(p => normCaptain && p.name.toLowerCase().trim() === normCaptain);
    if (team.captain && !capAlreadyIn) {
      classPlayers.unshift({
        name: team.captain,
        gender: 'Nam/Nữ',
        role: 'Đội Trưởng / Trưởng Đoàn'
      });
    }

    // 4. Các bạn dự bị
    team.reserves.forEach((rName) => {
      classPlayers.push({
        name: rName,
        gender: 'Dự bị',
        role: 'VĐV Dự Bị'
      });
    });

    // Điền vào sheet
    classPlayers.forEach((player) => {
      const pRow = wsDetail.getRow(detailRowIdx);
      pRow.height = 22;
      pRow.values = [
        athleteCounter,
        team.className,
        team.grade,
        player.name,
        player.gender,
        player.role,
        '', // Để trống cho trọng tài ghi số áo
        team.gvcn || '-',
        team.captainPhone || '',
        '', // Ô ký nhận vào sân
        ''  // Ô kiểm tra thẻ HS
      ];

      pRow.font = { name: 'Times New Roman', size: 10 };
      pRow.alignment = { vertical: 'middle' };

      pRow.getCell(1).alignment = { horizontal: 'center' };
      pRow.getCell(2).alignment = { horizontal: 'center', bold: true };
      pRow.getCell(3).alignment = { horizontal: 'center' };
      pRow.getCell(4).alignment = { horizontal: 'left', bold: true };
      pRow.getCell(5).alignment = { horizontal: 'center' };
      pRow.getCell(6).alignment = { horizontal: 'left' };
      pRow.getCell(7).alignment = { horizontal: 'center' };
      pRow.getCell(8).alignment = { horizontal: 'left' };
      pRow.getCell(9).alignment = { horizontal: 'center' };
      pRow.getCell(10).alignment = { horizontal: 'center' };
      pRow.getCell(11).alignment = { horizontal: 'center' };

      // Màu sắc theo vai trò
      if (player.role.includes('Đội Trưởng')) {
        pRow.getCell(4).font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FF1E40AF' } };
        pRow.getCell(6).font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
      }

      // Kẻ viền ô
      for (let c = 1; c <= 11; c++) {
        pRow.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }

      detailRowIdx++;
      athleteCounter++;
    });
  });

  // Hàng tổng kết Sheet 2
  const endRow = wsDetail.getRow(detailRowIdx);
  endRow.height = 26;
  wsDetail.mergeCells(`A${detailRowIdx}:C${detailRowIdx}`);
  endRow.getCell(1).value = 'TỔNG CỘNG:';
  endRow.getCell(1).font = { name: 'Times New Roman', size: 10.5, bold: true };
  endRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  endRow.getCell(4).value = `${athleteCounter - 1} Vận Động Viên`;
  endRow.getCell(4).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFB91C1C' } };

  for (let c = 1; c <= 11; c++) {
    const cell = endRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  }


  // ==================== SHEET 3: THỐNG KÊ THEO KHỐI ====================
  const wsStats = wb.addWorksheet('Thống Kê Khối & Giới Tính');
  wsStats.columns = [
    { width: 8 },  // STT
    { width: 16 }, // Khối
    { width: 14 }, // Số Lớp Tham Gia
    { width: 18 }, // VĐV Nam Chính Thức
    { width: 18 }, // VĐV Nữ Chính Thức
    { width: 16 }, // VĐV Dự Bị
    { width: 16 }  // Tổng Số VĐV
  ];

  wsStats.mergeCells('A1:G1');
  wsStats.getCell('A1').value = 'BẢNG THỐNG KÊ SỐ LƯỢNG VẬN ĐỘNG VIÊN THEO TỪNG KHỐI LỚP';
  wsStats.getCell('A1').font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
  wsStats.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  const statHeader = wsStats.getRow(3);
  statHeader.height = 26;
  statHeader.values = ['STT', 'Khối Lớp', 'Số Lớp Đăng Ký', 'VĐV Nam CT', 'VĐV Nữ CT', 'VĐV Dự Bị', 'Tổng Số VĐV'];
  statHeader.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  statHeader.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let c = 1; c <= 7; c++) {
    const cell = statHeader.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }

  const grades = ['Khối 10', 'Khối 11', 'Khối 12'];
  grades.forEach((gr, idx) => {
    const grTeams = sortedTeams.filter(t => t.grade === gr);
    let mCount = 0;
    let fCount = 0;
    let rCount = 0;
    grTeams.forEach(t => {
      mCount += t.males.length;
      fCount += t.females.length;
      rCount += t.reserves.length;
    });

    const sRow = wsStats.getRow(4 + idx);
    sRow.height = 24;
    sRow.values = [idx + 1, gr, grTeams.length, mCount, fCount, rCount, mCount + fCount + rCount];
    sRow.font = { name: 'Times New Roman', size: 11 };
    sRow.alignment = { horizontal: 'center', vertical: 'middle' };

    for (let c = 1; c <= 7; c++) {
      sRow.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    }
  });

  // Dòng Tổng Cộng Thống Kê
  const statSumRow = wsStats.getRow(7);
  statSumRow.height = 26;
  statSumRow.values = ['-', 'TOÀN TRƯỜNG', sortedTeams.length, totalMaleAthletes, totalFemaleAthletes, totalReserves, totalAllAthletes];
  statSumRow.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
  statSumRow.alignment = { horizontal: 'center', vertical: 'middle' };
  for (let c = 1; c <= 7; c++) {
    statSumRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    statSumRow.getCell(c).border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }


  // ==================== TẢI FILE TUÂN THỦ QUY TẮC GEMINI.MD ====================
  const safeTournName = tournTitle
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 35);

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `1-Danh_sach_cau_thu_thi_dau_${safeTournName}_CBQ_${dateStr}.xlsx`;

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

  return { success: true, fileName, count: sortedTeams.length, totalAthletes: totalAllAthletes };
}

/**
 * XUẤT PHIẾU ĐĂNG KÝ THI ĐẤU CỦA RIÊNG 1 CHI ĐOÀN LỚP (KHỔ A4 CHUẨN)
 * Tuân thủ quy tắc GEMINI.md: Tiền tố số thứ tự 1-Phieu_dang_ky_cau_thu_Lop_...
 */
export async function exportSingleTeamRosterExcel(tournament, registrationItem) {
  const team = parseTeamRoster(registrationItem);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Trường THPT Cao Bá Quát - Ban Tổ Chức Hội Thao';
  wb.created = new Date();

  const ws = wb.addWorksheet(`Lớp ${team.className}`, {
    pageSetup: { 
      paperSize: 9, // A4
      orientation: 'portrait', 
      fitToPage: true, 
      fitToWidth: 1, 
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6 }
    }
  });

  ws.columns = [
    { width: 6 },  // STT
    { width: 26 }, // Họ và tên
    { width: 12 }, // Giới tính
    { width: 22 }, // Vai trò
    { width: 12 }, // Số áo
    { width: 20 }  // Ghi chú
  ];

  // Header hành chính
  ws.mergeCells('A1:C1');
  ws.getCell('A1').value = 'TRƯỜNG THPT CAO BÁ QUÁT';
  ws.getCell('A1').font = { name: 'Times New Roman', size: 10, bold: true };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:C2');
  ws.getCell('A2').value = `CHI ĐOÀN LỚP ${team.className.toUpperCase()}`;
  ws.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.mergeCells('D1:F1');
  ws.getCell('D1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  ws.getCell('D1').font = { name: 'Times New Roman', size: 10, bold: true };
  ws.getCell('D1').alignment = { horizontal: 'center' };

  ws.mergeCells('D2:F2');
  ws.getCell('D2').value = 'Độc lập - Tự do - Hạnh phúc';
  ws.getCell('D2').font = { name: 'Times New Roman', size: 10, italic: true };
  ws.getCell('D2').alignment = { horizontal: 'center' };

  // Tiêu đề phiếu
  ws.mergeCells('A4:F4');
  ws.getCell('A4').value = 'PHIẾU ĐĂNG KÝ DANH SÁCH THI ĐẤU HỘI THAO';
  ws.getCell('A4').font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('A5:F5');
  ws.getCell('A5').value = `GIẢI: ${(tournament?.name || 'HỘI THAO THỂ THAO').toUpperCase()}`;
  ws.getCell('A5').font = { name: 'Times New Roman', size: 11, bold: true, italic: true, color: { argb: 'FFB91C1C' } };
  ws.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

  // Thông tin đội
  ws.mergeCells('A7:F7');
  ws.getCell('A7').value = `Chi đoàn: Lớp ${team.className} (${team.grade}) | GVCN: ${team.gvcn || '................................'}`;
  ws.getCell('A7').font = { name: 'Times New Roman', size: 11, bold: true };

  ws.mergeCells('A8:F8');
  ws.getCell('A8').value = `Đội trưởng: ${team.captain || '................................'} | Số điện thoại: ${team.captainPhone || '................................'}`;
  ws.getCell('A8').font = { name: 'Times New Roman', size: 11 };

  ws.mergeCells('A9:F9');
  ws.getCell('A9').value = `Môn thi đấu: ${team.sportName || tournament?.sports?.[0] || 'Bóng Chuyền'}`;
  ws.getCell('A9').font = { name: 'Times New Roman', size: 11, italic: true, color: { argb: 'FF0369A1' } };

  // Header bảng danh sách
  const hRow = ws.getRow(11);
  hRow.height = 26;
  hRow.values = ['STT', 'Họ Và Tên Cầu Thủ / VĐV', 'Giới Tính', 'Vai Trò Thi Đấu', 'Số Áo', 'Ghi Chú'];
  hRow.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  hRow.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let c = 1; c <= 6; c++) {
    const cell = hRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }

  // Danh sách VĐV của lớp
  let pIdx = 1;
  let curRowIdx = 12;

  const normCaptain = (team.captain || '').toLowerCase().trim();

  // Nam chính thức
  team.males.forEach((m) => {
    const isCap = normCaptain && m.toLowerCase().trim() === normCaptain;
    const r = ws.getRow(curRowIdx++);
    r.height = 22;
    r.values = [pIdx++, m, 'Nam', isCap ? 'Đội Trưởng (Nam CT)' : 'VĐV Nam Chính Thức', '', ''];
    r.font = { name: 'Times New Roman', size: 10.5 };
    r.alignment = { vertical: 'middle' };
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).alignment = { horizontal: 'left', bold: true };
    r.getCell(3).alignment = { horizontal: 'center' };
    r.getCell(4).alignment = { horizontal: 'left' };
    r.getCell(5).alignment = { horizontal: 'center' };
    for (let c = 1; c <= 6; c++) r.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Nữ chính thức
  team.females.forEach((f) => {
    const isCap = normCaptain && f.toLowerCase().trim() === normCaptain;
    const r = ws.getRow(curRowIdx++);
    r.height = 22;
    r.values = [pIdx++, f, 'Nữ', isCap ? 'Đội Trưởng (Nữ CT)' : 'VĐV Nữ Chính Thức', '', ''];
    r.font = { name: 'Times New Roman', size: 10.5 };
    r.alignment = { vertical: 'middle' };
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).alignment = { horizontal: 'left', bold: true };
    r.getCell(3).alignment = { horizontal: 'center' };
    r.getCell(4).alignment = { horizontal: 'left' };
    r.getCell(5).alignment = { horizontal: 'center' };
    for (let c = 1; c <= 6; c++) r.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Dự bị
  team.reserves.forEach((res) => {
    const r = ws.getRow(curRowIdx++);
    r.height = 22;
    r.values = [pIdx++, res, 'Dự bị', 'VĐV Dự Bị', '', ''];
    r.font = { name: 'Times New Roman', size: 10.5 };
    r.alignment = { vertical: 'middle' };
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).alignment = { horizontal: 'left' };
    r.getCell(3).alignment = { horizontal: 'center' };
    r.getCell(4).alignment = { horizontal: 'left' };
    r.getCell(5).alignment = { horizontal: 'center' };
    for (let c = 1; c <= 6; c++) r.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Cam kết
  curRowIdx++;
  ws.mergeCells(`A${curRowIdx}:F${curRowIdx}`);
  ws.getCell(`A${curRowIdx}`).value = 'Lời cam kết: Chi đoàn cam kết toàn bộ học sinh có tên trong danh sách là thành viên chính thức của lớp, đảm bảo đầy đủ sức khỏe và chấp hành nghiêm chỉnh Điều lệ thi đấu do Ban Tổ Chức ban hành.';
  ws.getCell(`A${curRowIdx}`).font = { name: 'Times New Roman', size: 10, italic: true };
  ws.getCell(`A${curRowIdx}`).alignment = { wrapText: true };

  // Ký tên
  curRowIdx += 2;
  ws.mergeCells(`A${curRowIdx}:C${curRowIdx}`);
  ws.getCell(`A${curRowIdx}`).value = 'ĐỘI TRƯỞNG';
  ws.getCell(`A${curRowIdx}`).font = { name: 'Times New Roman', size: 11, bold: true };
  ws.getCell(`A${curRowIdx}`).alignment = { horizontal: 'center' };

  ws.mergeCells(`D${curRowIdx}:F${curRowIdx}`);
  ws.getCell(`D${curRowIdx}`).value = 'GIÁO VIÊN CHỦ NHIỆM XÁC NHẬN';
  ws.getCell(`D${curRowIdx}`).font = { name: 'Times New Roman', size: 11, bold: true };
  ws.getCell(`D${curRowIdx}`).alignment = { horizontal: 'center' };

  const signNoteIdx = curRowIdx + 1;
  ws.mergeCells(`A${signNoteIdx}:C${signNoteIdx}`);
  ws.getCell(`A${signNoteIdx}`).value = '(Ký và ghi rõ họ tên)';
  ws.getCell(`A${signNoteIdx}`).font = { name: 'Times New Roman', size: 9.5, italic: true };
  ws.getCell(`A${signNoteIdx}`).alignment = { horizontal: 'center' };

  ws.mergeCells(`D${signNoteIdx}:F${signNoteIdx}`);
  ws.getCell(`D${signNoteIdx}`).value = '(Ký và ghi rõ họ tên)';
  ws.getCell(`D${signNoteIdx}`).font = { name: 'Times New Roman', size: 9.5, italic: true };
  ws.getCell(`D${signNoteIdx}`).alignment = { horizontal: 'center' };

  // Tên file tuân thủ quy tắc GEMINI.md
  const safeCls = (team.className || 'Lop').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `1-Phieu_dang_ky_cau_thu_Lop_${safeCls}_CBQ.xlsx`;

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

  return { success: true, fileName };
}
