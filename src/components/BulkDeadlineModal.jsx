import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar } from 'lucide-react';

export default function BulkDeadlineModal({ isOpen, onClose, onUpdated, committees }) {
  const [loading, setLoading] = useState(false);
  const [targetCommittee, setTargetCommittee] = useState('all');
  const [newDeadline, setNewDeadline] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDeadline) {
      alert("Vui lòng chọn Hạn chót mới.");
      return;
    }

    if (!window.confirm("Cảnh báo: Hành động này sẽ GHI ĐÈ hạn chót của TẤT CẢ công việc được chọn. Bạn có chắc chắn không?")) {
      return;
    }

    setLoading(true);
    
    try {
      const isoDeadline = new Date(newDeadline).toISOString();
      let query = supabase.from('cbq_tasks').update({ deadline: isoDeadline });
      
      // If not 'all', filter by committee_id
      if (targetCommittee !== 'all') {
        query = query.eq('committee_id', targetCommittee);
      } else {
        // Just a dummy eq to make sure we don't accidentally update things we shouldn't?
        // Actually, without .eq(), Supabase will update ALL rows in the table.
        // Wait, to update all rows safely in Supabase, we need at least one filter or we have to use .neq('id', '00000000-0000-0000-0000-000000000000')
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error } = await query;

      if (error) throw error;
      
      alert('Cập nhật Hạn chót hàng loạt thành công!');
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Lỗi cập nhật hàng loạt:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}><Calendar size={24} style={{marginRight: '8px'}}/> Cập nhật Hạn chót hàng loạt</h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Phạm vi áp dụng</label>
            <select 
              value={targetCommittee} 
              onChange={(e) => setTargetCommittee(e.target.value)} 
              style={styles.input}
            >
              <option value="all">Tất cả công việc toàn trường</option>
              {committees.map(c => (
                <option key={c.id} value={c.id}>Chỉ công việc của: {c.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Hạn chót mới</label>
            <input 
              type="datetime-local" 
              value={newDeadline} 
              onChange={(e) => setNewDeadline(e.target.value)} 
              required 
              style={styles.input} 
            />
            <small style={{color: '#ef4444', marginTop: '0.5rem'}}>
              * Toàn bộ công việc thuộc phạm vi trên sẽ bị đổi hạn chót thành ngày này.
            </small>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Hủy</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
  },
  modal: {
    width: '100%', maxWidth: '500px', background: 'var(--surface)',
    borderRadius: '1rem', padding: '2rem',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem'
  },
  title: { fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', color: '#0f172a' },
  closeBtn: { background: 'transparent', color: 'var(--text-muted)', padding: '0.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' },
  input: { padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.95rem', width: '100%' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '500' },
  submitBtn: { padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: '#ef4444', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer' }
};
