import { supabase } from '../lib/supabase';

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
