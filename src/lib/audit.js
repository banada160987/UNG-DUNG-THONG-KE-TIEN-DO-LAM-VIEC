import { supabase } from './supabase';

export const logAuditAction = async (action, description, performedBy = 'Hệ thống') => {
  try {
    await supabase.from('cbq_audit_log').insert([{
      action,
      description,
      performed_by: performedBy
    }]);
  } catch (error) {
    console.error('Lỗi ghi log:', error);
  }
};
