import { supabase } from '../lib/supabase';
import { ALL_CBQ_CLASSES_34 } from './signmarTournamentService';
import { exportToExcelWithTitle } from '../utils/excelExport';

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
  tournRegs.forEach(reg => {
    const rawClass = reg.cohort_year || reg.unit_name || '';
    const norm = normalizeClassName(rawClass);
    if (norm) {
      let roster = null;
      try {
        if (reg.notes && reg.notes.startsWith('{')) {
          roster = JSON.parse(reg.notes);
        }
      } catch (e) {}

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
  const completionPercent = totalClasses > 0 ? Math.round((registeredCount / totalClasses) * 100) : 0;

  return {
    totalClasses,
    registeredCount,
    unregisteredCount,
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
