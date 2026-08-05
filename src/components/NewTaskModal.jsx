import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

export default function NewTaskModal({ committees, onClose, onTaskAdded }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    assignee: '',
    responsible: '',
    deadline: '',
    location: '',
    expected_result: '',
    committee_id: committees[0]?.id || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('cbq_tasks')
        .insert([{
          ...formData,
          progress: 0,
          status: 'pending'
        }]);

      if (error) throw error;
      
      alert('Thêm công việc thành công!');
      onTaskAdded();
      onClose();
    } catch (error) {
      console.error('Lỗi thêm công việc:', error);
      alert('Có lỗi xảy ra khi thêm công việc.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Giao công việc mới</h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên công việc (Rõ việc)</label>
            <input name="title" value={formData.title} onChange={handleChange} required style={styles.input} />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tiểu ban phụ trách</label>
              <select name="committee_id" value={formData.committee_id} onChange={handleChange} required style={styles.input}>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Hạn chót (Rõ thời gian)</label>
              <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} required style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Người thực hiện (Rõ người)</label>
              <input name="assignee" value={formData.assignee} onChange={handleChange} required style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Người chịu trách nhiệm</label>
              <input name="responsible" value={formData.responsible} onChange={handleChange} required style={styles.input} />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Địa điểm (Rõ địa điểm)</label>
            <input name="location" value={formData.location} onChange={handleChange} required style={styles.input} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Kết quả mong đợi (Rõ kết quả)</label>
            <textarea name="expected_result" value={formData.expected_result} onChange={handleChange} required style={{...styles.input, minHeight: '80px'}} />
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Hủy</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Đang lưu...' : 'Giao việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    width: '100%',
    maxWidth: '600px',
    background: 'var(--surface)',
    borderRadius: '1rem',
    padding: '2rem',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    margin: 0,
  },
  closeBtn: {
    background: 'transparent',
    color: 'var(--text-muted)',
    padding: '0.25rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-main)',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    fontSize: '0.95rem',
    width: '100%',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1rem',
  },
  cancelBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    fontWeight: '500',
  },
  submitBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    background: 'var(--primary)',
    color: 'white',
    fontWeight: '600',
    border: 'none',
  }
};
