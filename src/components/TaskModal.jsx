import { useState, useEffect } from 'react';
import { X, Save, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function TaskModal({ isOpen, onClose, onSave, task, committees, userRole, userCommitteeId }) {
  const isMember = userRole === 'committee_member';
  const lockCoreFields = isMember && !!task;

  const [formData, setFormData] = useState({
    title: '',
    assignee: '',
    responsible: '',
    deadline: '',
    location: '',
    expected_result: '',
    budget_estimate: 0,
    notes: '',
    committee_id: ''
  });

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = async () => {
    const { data } = await supabase.from('cbq_task_comments').select('*').eq('task_id', task.id).order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase.from('cbq_task_comments').insert([
      { task_id: task.id, user_name: 'Thành viên BTC', content: newComment }
    ]);
    if (!error) {
      setNewComment('');
      fetchComments();
    }
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        assignee: task.assignee || '',
        responsible: task.responsible || '',
        deadline: task.deadline ? new Date(new Date(task.deadline).getTime() - new Date(task.deadline).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        location: task.location || '',
        expected_result: task.expected_result || '',
        budget_estimate: task.budget_estimate || 0,
        notes: task.notes || '',
        committee_id: task.committee_id || ''
      });
      fetchComments();
    } else {
      setFormData({
        title: '',
        assignee: '',
        responsible: '',
        deadline: '',
        location: '',
        expected_result: '',
        budget_estimate: 0,
        notes: '',
        committee_id: isMember ? userCommitteeId : ''
      });
    }
  }, [task, isOpen, isMember, userCommitteeId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      deadline: new Date(formData.deadline).toISOString()
    };
    onSave(dataToSave);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary)' }}>{task ? 'Sửa Công Việc' : 'Giao Việc Mới'}</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Tên công việc *</label>
              <input required name="title" value={formData.title} onChange={handleChange} style={styles.input} disabled={lockCoreFields} />
            </div>
            <div>
              <label style={styles.label}>Giao cho Tiểu ban *</label>
              <select required name="committee_id" value={formData.committee_id} onChange={handleChange} style={styles.input} disabled={isMember}>
                <option value="">-- Chọn tiểu ban --</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>Người làm *</label>
              <input required name="assignee" value={formData.assignee} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Người chịu trách nhiệm *</label>
              <input required name="responsible" value={formData.responsible} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Hạn chót *</label>
              <input required type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} style={styles.input} disabled={lockCoreFields} />
            </div>
            <div>
              <label style={styles.label}>Địa điểm *</label>
              <input required name="location" value={formData.location} onChange={handleChange} style={styles.input} />
            </div>
          </div>
          
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Kết quả yêu cầu *</label>
              <input required name="expected_result" value={formData.expected_result} onChange={handleChange} style={styles.input} disabled={lockCoreFields} />
            </div>
            <div>
              <label style={styles.label}>Dự trù kinh phí (VNĐ)</label>
              <input type="number" name="budget_estimate" value={formData.budget_estimate} onChange={handleChange} style={styles.input} />
            </div>
          </div>
          
          <div>
            <label style={styles.label}>Ghi chú (Tùy chọn)</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} style={{...styles.input, minHeight: '80px', resize: 'vertical'}} placeholder="Các lưu ý bổ sung..." />
          </div>

          {task && (
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <h3 style={{fontSize: '1rem', color: '#334155', marginBottom: '1rem'}}>Thảo luận & Minh chứng</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {comments.map(c => (
                  <div key={c.id} style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{fontSize: '0.85rem', color: '#0f172a'}}>{c.user_name}</strong>
                      <span style={{fontSize: '0.75rem', color: '#64748b'}}>{new Date(c.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{c.content}</p>
                    {c.file_url && <a href={c.file_url} target="_blank" rel="noreferrer" style={{fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.25rem', display: 'inline-block'}}>📎 Xem đính kèm</a>}
                  </div>
                ))}
                {comments.length === 0 && <p style={{color: '#64748b', fontSize: '0.9rem', textAlign: 'center'}}>Chưa có thảo luận nào.</p>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                  placeholder="Nhập nội dung thảo luận..." 
                  style={{...styles.input, flex: 1}} 
                />
                <button type="button" onClick={handleAddComment} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={16} /> Gửi
                </button>
              </div>
            </div>
          )}

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Hủy</button>
            <button type="submit" className="btn-primary" style={styles.submitBtn}>
              <Save size={18} /> {task ? 'Cập nhật' : 'Lưu Công Việc'}
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem'
  },
  modal: {
    backgroundColor: 'white', borderRadius: '1rem',
    width: '100%', maxWidth: '750px', maxHeight: '90vh',
    overflowY: 'auto', boxShadow: 'var(--shadow-lg)'
  },
  header: {
    padding: '1.5rem', borderBottom: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10
  },
  closeBtn: {
    background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#475569',
    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  form: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' },
  label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#334155' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#f8fafc' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' },
  cancelBtn: { padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '500', color: '#475569' },
  submitBtn: { padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }
};
