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
    const result = [];

    for (const part of parts) {
      // 1. Phân giải dạng chuẩn: "1:07:00-07:45"
      const match = part.match(/^(\d{1,2}):(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
      if (match) {
        const period = parseInt(match[1], 10);
        const start = match[2];
        const end = match[3];
        const session = period <= 5 ? 'Sáng' : 'Chiều';
        result.push({
          period,
          session,
          start,
          end,
          label: `Tiết ${period} (${start} - ${end})`
        });
        continue;
      }

      // 2. Dự phòng: tìm dấu ':' đầu tiên ngăn cách số tiết và khung giờ
      const firstColon = part.indexOf(':');
      if (firstColon > 0) {
        const pNum = parseInt(part.slice(0, firstColon), 10);
        const range = part.slice(firstColon + 1);
        const [s, e] = range.split('-');
        const sTrim = (s || '').trim();
        const eTrim = (e || '').trim();
        if (/^\d{1,2}:\d{2}$/.test(sTrim) && /^\d{1,2}:\d{2}$/.test(eTrim)) {
          const session = pNum <= 5 ? 'Sáng' : 'Chiều';
          result.push({
            period: pNum,
            session,
            start: sTrim,
            end: eTrim,
            label: `Tiết ${pNum} (${sTrim} - ${eTrim})`
          });
        }
      }
    }

    if (result.length >= 5) {
      return result.sort((a, b) => a.period - b.period);
    }
    return null;
  } catch (err) {
    console.warn('Lỗi phân giải chuỗi khung giờ rút gọn:', err);
    return null;
  }
};

export const serializeTimingsCompact = (timings) => {
  if (!Array.isArray(timings)) return '';
  return timings
    .map(t => {
      const s = (t.start || '').trim();
      const e = (t.end || '').trim();
      return `${t.period}:${s}-${e}`;
    })
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

  // Chuẩn hóa khung giờ để bảo vệ toàn vẹn định dạng HH:mm
  const cleanTimings = (timings || []).map(pt => {
    let s = (pt.start || '').trim();
    let e = (pt.end || '').trim();
    if (!/^\d{1,2}:\d{2}$/.test(s)) {
      s = pt.period <= 5 ? '07:00' : '13:30';
    }
    if (!/^\d{1,2}:\d{2}$/.test(e)) {
      e = pt.period <= 5 ? '07:45' : '14:15';
    }
    return {
      period: pt.period,
      session: pt.session || (pt.period <= 5 ? 'Sáng' : 'Chiều'),
      start: s,
      end: e,
      label: `Tiết ${pt.period} (${s} - ${e})`
    };
  });

  const compactTimingsStr = serializeTimingsCompact(cleanTimings);

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
  cleanTimings.forEach(pt => {
    rowsToInsert.push({
      student_class: 'CONFIG_PERIOD',
      day_of_week: 'ALL',
      period: pt.period,
      subject: `${pt.start} - ${pt.end}`,
      teacher_name: pt.session,
      room: pt.label
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
        const parsedRows = periodRows
          .map(r => {
            const parts = (r.subject || '').split(' - ');
            const s = (parts[0] || '').trim();
            const e = (parts[1] || '').trim();
            if (!/^\d{1,2}:\d{2}$/.test(s) || !/^\d{1,2}:\d{2}$/.test(e)) {
              return null;
            }
            const period = r.period;
            const session = r.teacher_name || (period <= 5 ? 'Sáng' : 'Chiều');
            return {
              period,
              session,
              start: s,
              end: e,
              label: r.room || `Tiết ${period} (${s} - ${e})`
            };
          })
          .filter(Boolean);

        if (parsedRows.length >= 5) {
          periodTimings = parsedRows.sort((a, b) => a.period - b.period);
        }
      }
    }

    return { metadata, periodTimings };
  } catch (err) {
    console.warn('Lỗi khi fetch cấu hình từ Supabase:', err);
    return { metadata: null, periodTimings: null };
  }
}
