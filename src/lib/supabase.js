import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Thiếu cấu hình Supabase URL hoặc Anon Key trong file .env');
}

// Client thông thường (Cho tất cả user)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Client đặc quyền Admin Service Role (Bắt buộc persistSession: false để ép luôn dùng Service Key chứ không bị dính JWT Anon ở LocalStorage)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }) 
  : null;

/**
 * Ghi lại lịch sử hoạt động vào bảng cbq_audit_logs
 * @param {string} entityType - 'parking' hoặc 'bus'
 * @param {string} entityId - UUID của bản ghi bị thay đổi
 * @param {string} ticketCode - Mã vé (vd: PARK-10A1-123)
 * @param {string} action - 'UPDATE', 'DELETE', etc.
 * @param {string} performedBy - 'admin' hoặc 'student'
 * @param {string} changes - Mô tả thay đổi
 */
export const logActivity = async (entityType, entityId, ticketCode, action, performedBy, changes) => {
  try {
    await supabase.from('cbq_audit_logs').insert([{
      entity_type: entityType,
      entity_id: entityId,
      ticket_code: ticketCode,
      action: action,
      performed_by: performedBy,
      changes: changes
    }]);
  } catch (error) {
    console.error('Lỗi khi ghi log activity:', error);
  }
};
