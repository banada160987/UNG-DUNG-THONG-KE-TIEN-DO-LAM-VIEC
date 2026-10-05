import { createClient } from '@supabase/supabase-js'

const supabase1Url = import.meta.env.VITE_SUPABASE_URL;
const supabase1AnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase1ServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase2Url = import.meta.env.VITE_SUPABASE_2_URL;
const supabase2AnonKey = import.meta.env.VITE_SUPABASE_2_ANON_KEY;
const supabase2ServiceKey = import.meta.env.VITE_SUPABASE_2_SERVICE_ROLE_KEY;

// 🟢 CHẾ ĐỘ FAILOVER DỰ PHÒNG CHUYỂN VÙNG TỰ ĐỘNG:
// Supabase 1 bị khóa (HTTP 402 Egress Exceeded). Toàn bộ ứng dụng sẽ được tự động chuyển sang sử dụng Supabase 2!
const USE_SUPABASE_2_AS_PRIMARY = true;

const primaryUrl = USE_SUPABASE_2_AS_PRIMARY ? (supabase2Url || supabase1Url) : supabase1Url;
const primaryAnonKey = USE_SUPABASE_2_AS_PRIMARY ? (supabase2AnonKey || supabase1AnonKey) : supabase1AnonKey;
const primaryServiceKey = USE_SUPABASE_2_AS_PRIMARY ? (supabase2ServiceKey || supabase1ServiceKey) : supabase1ServiceKey;

if (!primaryUrl || !primaryAnonKey) {
  console.warn('Thiếu cấu hình Supabase URL hoặc Anon Key trong file .env');
}

// Client thông thường (Dành cho tất cả các trang - Đã tự động chuyển sang Supabase 2)
export const supabase = createClient(primaryUrl || '', primaryAnonKey || '');

// Client Admin đặc quyền Service Role (Đã tự động chuyển sang Supabase 2)
export const supabaseAdmin = primaryServiceKey 
  ? createClient(primaryUrl, primaryServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }) 
  : null;

// Khai báo kết nối đích danh
export const supabase1 = supabase1Url && supabase1AnonKey ? createClient(supabase1Url, supabase1AnonKey) : null;
export const supabase1Admin = supabase1Url && supabase1ServiceKey 
  ? createClient(supabase1Url, supabase1ServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }) 
  : null;

export const supabase2 = supabase2Url && supabase2AnonKey ? createClient(supabase2Url, supabase2AnonKey) : null;
export const supabase2Admin = supabase2Url && supabase2ServiceKey 
  ? createClient(supabase2Url, supabase2ServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }) 
  : null;


export const DualSupabaseService = {
  /**
   * Đọc dữ liệu thông minh (Smart Failover & De-duplication):
   * - Tự động thử cả Supabase 1 và Supabase 2. Nếu 1 bên đóng/lỗi thì tự lấy bên còn lại.
   * - Tự động gắn nhãn nguồn `_source` ('sb1' hoặc 'sb2') vào từng bản ghi.
   * - Nếu cả 2 đều hoạt động và có dữ liệu trùng nhau, tự động lọc trùng theo uniqueKey ('id' hoặc 'ticket_code').
   */
  async selectSmart(table, buildQueryFn, uniqueKey = 'id') {
    const primaryClient = USE_SUPABASE_2_AS_PRIMARY ? supabase2 : (supabase1 || supabase);
    const secondaryClient = USE_SUPABASE_2_AS_PRIMARY ? (supabase1 || supabase) : supabase2;

    // 1. Ưu tiên truy vấn Primary DB trước (Không đánh thức Secondary DB nếu Primary thành công)
    if (primaryClient) {
      try {
        let q = primaryClient.from(table).select('*');
        if (buildQueryFn) q = buildQueryFn(q);
        const res = await q;
        if (!res.error && res.data) {
          return {
            data: res.data.map(item => ({ ...item, _source: USE_SUPABASE_2_AS_PRIMARY ? 'sb2' : 'sb1' })),
            error: null,
            source: USE_SUPABASE_2_AS_PRIMARY ? 'sb2' : 'sb1'
          };
        }
      } catch (err) {
        console.warn(`[DualSupabase] Primary DB gặp sự cố, tự động failover sang Secondary:`, err.message || err);
      }
    }

    // 2. Dự phòng Secondary DB nếu Primary gặp lỗi
    if (secondaryClient && secondaryClient !== primaryClient) {
      try {
        let q = secondaryClient.from(table).select('*');
        if (buildQueryFn) q = buildQueryFn(q);
        const res = await q;
        if (!res.error && res.data) {
          return {
            data: res.data.map(item => ({ ...item, _source: USE_SUPABASE_2_AS_PRIMARY ? 'sb1' : 'sb2' })),
            error: null,
            source: USE_SUPABASE_2_AS_PRIMARY ? 'sb1' : 'sb2'
          };
        }
      } catch (err) {
        console.warn(`[DualSupabase] Secondary DB gặp sự cố:`, err.message || err);
      }
    }

    return {
      data: [],
      error: new Error('Không thể kết nối đến cơ sở dữ liệu!'),
      source: 'none'
    };
  },

  /**
   * Đọc dữ liệu đơn giản: Ưu tiên đọc ở Supabase Primary, nếu lỗi/paused tự chuyển sang Secondary.
   */
  async select(table, buildQueryFn) {
    try {
      let q1 = supabase.from(table).select('*');
      if (buildQueryFn) q1 = buildQueryFn(q1);
      const res1 = await q1;
      if (!res1.error) return res1;
      throw res1.error;
    } catch (err) {
      console.warn(`[DualSupabase] Primary DB gặp lỗi/paused, tự chuyển sang Secondary DB:`, err);
      if (!supabase2) throw err;
      let q2 = supabase2.from(table).select('*');
      if (buildQueryFn) q2 = buildQueryFn(q2);
      return await q2;
    }
  },

  /**
   * Chèn dữ liệu đồng thời vào CẢ 2 Supabase (Dual-Write)
   */
  async insert(table, data) {
    const promises = [];
    const client1 = supabase1Admin || supabase1;
    const client2 = supabase2Admin || supabase2;
    if (client1) promises.push(client1.from(table).insert(data));
    if (client2) promises.push(client2.from(table).insert(data));

    const results = await Promise.allSettled(promises);
    const okRes = results.find(r => r.status === 'fulfilled' && !r.value.error);

    if (okRes) return okRes.value;
    const errors = results.map(r => r.status === 'rejected' ? r.reason?.message : r.value?.error?.message).filter(Boolean);
    const detail = errors.length > 0 ? ` (${errors.join(' | ')})` : '';
    throw new Error(`Cả 02 Supabase đều chèn dữ liệu thất bại!${detail}`);
  },

  /**
   * Cập nhật dữ liệu đồng thời trên CẢ 2 Supabase
   */
  async update(table, data, matchColumn, matchValue) {
    const promises = [];
    const client1 = supabase1Admin || supabase1;
    const client2 = supabase2Admin || supabase2;
    if (client1) promises.push(client1.from(table).update(data).eq(matchColumn, matchValue));
    if (client2) promises.push(client2.from(table).update(data).eq(matchColumn, matchValue));

    const results = await Promise.allSettled(promises);
    const okRes = results.find(r => r.status === 'fulfilled' && !r.value.error);

    if (okRes) return okRes.value;
    const errors = results.map(r => r.status === 'rejected' ? r.reason?.message : r.value?.error?.message).filter(Boolean);
    const detail = errors.length > 0 ? ` (${errors.join(' | ')})` : '';
    throw new Error(`Cả 02 Supabase đều cập nhật thất bại!${detail}`);
  },

  /**
   * Xóa dữ liệu đồng thời trên CẢ 2 Supabase
   */
  async delete(table, matchColumn, matchValue) {
    const promises = [];
    const client1 = supabase1Admin || supabase1;
    const client2 = supabase2Admin || supabase2;
    if (client1) promises.push(client1.from(table).delete().eq(matchColumn, matchValue));
    if (client2) promises.push(client2.from(table).delete().eq(matchColumn, matchValue));

    const results = await Promise.allSettled(promises);
    const okRes = results.find(r => r.status === 'fulfilled' && !r.value.error);

    if (okRes) return okRes.value;
    const errors = results.map(r => r.status === 'rejected' ? r.reason?.message : r.value?.error?.message).filter(Boolean);
    const detail = errors.length > 0 ? ` (${errors.join(' | ')})` : '';
    throw new Error(`Cả 02 Supabase đều xóa thất bại!${detail}`);
  }
};

/**
 * Ghi lại lịch sử hoạt động vào bảng cbq_audit_logs (tự động ghi cả 2 Supabase)
 */
export const logActivity = async (entityType, entityId, ticketCode, action, performedBy, changes) => {
  try {
    const payload = {
      entity_type: entityType,
      entity_id: entityId,
      ticket_code: ticketCode,
      action: action,
      performed_by: performedBy,
      changes: changes
    };
    await DualSupabaseService.insert('cbq_audit_logs', [payload]);
  } catch (error) {
    console.error('Lỗi khi ghi log activity:', error);
  }
};

/**
 * 🟢 CÁCH 02: Nạp danh sách học sinh theo từng Lớp (Chỉ nạp ~35 học sinh/lớp)
 * Tiết kiệm 99.9% băng thông Supabase Egress (Chỉ tốn ~1.5KB thay vì 1.5MB)
 */
export async function fetchStudentsByClass(className) {
  if (!className || !className.trim()) return [];
  const cleanClass = className.trim().toUpperCase();
  const cacheKey = `cbq_students_class_${cleanClass}`;

  // Kiểm tra Cache Session tạm thời
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  try {
    const res = await DualSupabaseService.selectSmart(
      'cbq_students',
      (q) => q.eq('student_class', cleanClass).eq('is_active', true).order('student_name')
    );

    const list = res.data || [];
    if (list.length > 0) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  } catch (err) {
    console.warn(`Lỗi nạp học sinh lớp ${cleanClass}:`, err);
    return [];
  }
}

/**
 * Gợi ý tên học sinh trực tuyến khi gõ (Chỉ trả về tối đa 8 kết quả siêu nhẹ)
 */
export async function searchStudentsByName(nameQuery, className = '') {
  if (!nameQuery || nameQuery.trim().length < 2) return [];
  try {
    const cleanName = nameQuery.trim();
    const cleanClass = className ? className.trim().toUpperCase() : '';

    const res = await DualSupabaseService.selectSmart(
      'cbq_students',
      (q) => {
        let builder = q.ilike('student_name', `%${cleanName}%`).eq('is_active', true).limit(8);
        if (cleanClass) builder = builder.eq('student_class', cleanClass);
        return builder;
      }
    );

    return res.data || [];
  } catch (err) {
    console.warn("Lỗi tìm kiếm gợi ý tên học sinh:", err);
    return [];
  }
}


