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
export const supabase2 = supabase2Url && supabase2AnonKey ? createClient(supabase2Url, supabase2AnonKey) : null;
export const supabase2Admin = supabase2Url && supabase2ServiceKey 
  ? createClient(supabase2Url, supabase2ServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }) 
  : null;


/**
 * Bộ dịch vụ DualSupabaseService giúp tự động Failover khi 1 DB gặp sự cố/Paused
 * và hỗ trợ Ghi dữ liệu đồng thời (Dual-Write) trên 02 dự án Supabase.
 */
export const DualSupabaseService = {
  /**
   * Đọc dữ liệu: Ưu tiên đọc ở Supabase Primary, nếu lỗi/paused tự chuyển sang Secondary.
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
    const promises = [supabase.from(table).insert(data)];
    if (supabase2) promises.push(supabase2.from(table).insert(data));

    const results = await Promise.allSettled(promises);
    const res1 = results[0];
    const res2 = results[1];

    if (res1.status === 'fulfilled' && !res1.value.error) return res1.value;
    if (res2 && res2.status === 'fulfilled' && !res2.value.error) {
      console.warn(`[DualSupabase] Primary DB lỗi, dữ liệu được bảo vệ thành công ở Secondary DB!`);
      return res2.value;
    }
    throw new Error('Cả 02 Supabase đều chèn dữ liệu thất bại!');
  },

  /**
   * Cập nhật dữ liệu đồng thời trên CẢ 2 Supabase
   */
  async update(table, data, matchColumn, matchValue) {
    const promises = [supabase.from(table).update(data).eq(matchColumn, matchValue)];
    if (supabase2) promises.push(supabase2.from(table).update(data).eq(matchColumn, matchValue));

    const results = await Promise.allSettled(promises);
    const res1 = results[0];
    const res2 = results[1];

    if (res1.status === 'fulfilled' && !res1.value.error) return res1.value;
    if (res2 && res2.status === 'fulfilled' && !res2.value.error) return res2.value;
    throw new Error('Cả 02 Supabase đều cập nhật thất bại!');
  },

  /**
   * Xóa dữ liệu đồng thời trên CẢ 2 Supabase
   */
  async delete(table, matchColumn, matchValue) {
    const promises = [supabase.from(table).delete().eq(matchColumn, matchValue)];
    if (supabase2) promises.push(supabase2.from(table).delete().eq(matchColumn, matchValue));

    const results = await Promise.allSettled(promises);
    const res1 = results[0];
    const res2 = results[1];

    if (res1.status === 'fulfilled' && !res1.value.error) return res1.value;
    if (res2 && res2.status === 'fulfilled' && !res2.value.error) return res2.value;
    throw new Error('Cả 02 Supabase đều xóa thất bại!');
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

