/**
 * timetableConfigSync.js
 * Đồng bộ cấu hình Thời khóa biểu (Metadata & Khung giờ 10 tiết) lên Cloud Supabase.
 * Đảm bảo dữ liệu không vượt quá giới hạn VARCHAR(255) của bảng cbq_timetable_items.
 */

import { supabase, supabase2 } from '../lib/supabase';


export const parseTimingsCompactString = (timingsStr) => {
  if (!timingsStr || typeof timingsStr !== 'string') return null;
  try {
    const parts = timingsStr.split(';').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    const result = parts.map(part => {
      const [pStr, range] = part.split(':');
      const period = parseInt(pStr, 10);
      const [start, end] = (range || '').split('-');
      const session = period <= 5 ? 'Sáng' : 'Chiều';
      return {
        period,
        session,
        start: start || '07:00',
        end: end || '07:45',
        label: `Tiết ${period} (${start} - ${end})`
      };
    });
    return result.sort((a, b) => a.period - b.period);
  } catch (err) {
    console.warn('Lỗi phân giải chuỗi khung giờ rút gọn:', err);
    return null;
  }
};

export const serializeTimingsCompact = (timings) => {
  if (!Array.isArray(timings)) return '';
  return timings
    .map(t => `${t.period}:${t.start}-${t.end}`)
    .join(';');
};

/**
 * Lưu Metadata & Khung giờ 10 tiết học lên Supabase
 * Tách biệt thành các bản ghi có kích thước <= 255 ký tự để tương thích tuyệt đối với VARCHAR(255).
 */
export async function saveTimetableConfigToCloud(meta = {}, timings = []) {
  const client = supabase2 || supabase;
  if (!client) {
    throw new Error('Không thể kết nối đến cơ sở dữ liệu Supabase');
  }

  const cleanMeta = {
    version: meta.version || 'TKB Mới',
    applyDate: meta.applyDate || '',
    schoolYear: meta.schoolYear || '2025 - 2026',
    semester: meta.semester || 'Học kỳ II',
    note: (meta.note || '').slice(0, 100)
  };

  const compactTimingsStr = serializeTimingsCompact(timings);

  const rowsToInsert = [
    {
      student_class: 'CONFIG_META',
      day_of_week: 'ALL',
      period: 0,
      subject: JSON.stringify(cleanMeta),
      teacher_name: 'BAN_GIAM_HIEU',
      room: cleanMeta.applyDate || 'CONFIG'
    },
    {
      student_class: 'CONFIG_TIMINGS',
      day_of_week: 'ALL',
      period: 0,
      subject: compactTimingsStr,
      teacher_name: 'BAN_GIAM_HIEU',
      room: 'PERIOD_TIMINGS'
    }
  ];

  // Lưu thêm 10 bản ghi chi tiết cho từng tiết học (CONFIG_PERIOD)
  (timings || []).forEach(pt => {
    rowsToInsert.push({
      student_class: 'CONFIG_PERIOD',
      day_of_week: 'ALL',
      period: pt.period,
      subject: `${pt.start} - ${pt.end}`,
      teacher_name: pt.session || (pt.period <= 5 ? 'Sáng' : 'Chiều'),
      room: pt.label || `Tiết ${pt.period} (${pt.start} - ${pt.end})`
    });
  });

  // 1. Xóa các bản ghi cấu hình cũ
  const { error: delErr } = await client
    .from('cbq_timetable_items')
    .delete()
    .in('student_class', ['CONFIG_META', 'CONFIG_TIMINGS', 'CONFIG_PERIOD']);

  if (delErr) {
    console.warn('Lỗi khi dọn dẹp cấu hình cũ trên Supabase:', delErr);
  }

  // 2. Chèn các bản ghi cấu hình mới
  const { data, error: insErr } = await client
    .from('cbq_timetable_items')
    .insert(rowsToInsert)
    .select();

  if (insErr) {
    console.error('Lỗi khi lưu cấu hình lên Supabase:', insErr);
    throw insErr;
  }

  return { success: true, count: data?.length || 0 };
}

/**
 * Tải Metadata & Khung giờ 10 tiết học từ Supabase
 */
export async function fetchTimetableConfigFromCloud() {
  const client = supabase2 || supabase;
  if (!client) return { metadata: null, periodTimings: null };

  try {
    const { data, error } = await client
      .from('cbq_timetable_items')
      .select('*')
      .in('student_class', ['CONFIG_META', 'CONFIG_TIMINGS', 'CONFIG_PERIOD']);

    if (error || !data || data.length === 0) {
      return { metadata: null, periodTimings: null };
    }

    let metadata = null;
    let periodTimings = null;

    // A. Parse Metadata
    const metaRow = data.find(r => r.student_class === 'CONFIG_META');
    if (metaRow && metaRow.subject) {
      try {
        metadata = JSON.parse(metaRow.subject);
      } catch (e) {
        console.warn('Lỗi parse CONFIG_META:', e);
      }
    }

    // B. Parse Khung giờ (ưu tiên chuỗi rút gọn CONFIG_TIMINGS)
    const timingsRow = data.find(r => r.student_class === 'CONFIG_TIMINGS');
    if (timingsRow && timingsRow.subject) {
      periodTimings = parseTimingsCompactString(timingsRow.subject);
    }

    // C. Nếu chưa có, phân giải từ danh sách các tiết CONFIG_PERIOD
    if (!periodTimings || periodTimings.length === 0) {
      const periodRows = data.filter(r => r.student_class === 'CONFIG_PERIOD');
      if (periodRows.length > 0) {
        periodTimings = periodRows
          .map(r => {
            const [start, end] = (r.subject || '').split(' - ');
            const period = r.period;
            const session = r.teacher_name || (period <= 5 ? 'Sáng' : 'Chiều');
            return {
              period,
              session,
              start: start || '07:00',
              end: end || '07:45',
              label: r.room || `Tiết ${period} (${start} - ${end})`
            };
          })
          .sort((a, b) => a.period - b.period);
      }
    }

    return { metadata, periodTimings };
  } catch (err) {
    console.warn('Lỗi khi fetch cấu hình từ Supabase:', err);
    return { metadata: null, periodTimings: null };
  }
}
