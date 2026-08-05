import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, User, CheckSquare, Clock } from 'lucide-react';

export default function TaskCard({ task, onUpdate }) {
  const [progress, setProgress] = useState(task.progress);
  const [updating, setUpdating] = useState(false);

  const isOverdue = () => {
    if (task.status === 'completed') return false;
    return new Date(task.deadline) < new Date();
  };

  const isNearDeadline = () => {
    if (task.status === 'completed') return false;
    const today = new Date();
    const threeDays = new Date();
    threeDays.setDate(today.getDate() + 3);
    return new Date(task.deadline) <= threeDays && !isOverdue();
  };

  const handleUpdate = async () => {
    setUpdating(true);
    let newStatus = task.status;
    if (progress === 100) newStatus = 'completed';
    else if (progress > 0 && progress < 100) newStatus = 'in_progress';
    else if (progress === 0) newStatus = 'pending';

    try {
      const { error } = await supabase
        .from('cbq_tasks')
        .update({ progress, status: newStatus })
        .eq('id', task.id);
        
      if (error) throw error;
      onUpdate(); // refresh list
    } catch (err) {
      console.error('Lỗi cập nhật tiến độ:', err);
      alert('Không thể cập nhật tiến độ.');
    } finally {
      setUpdating(false);
    }
  };

  let cardClass = "glass ";
  if (isOverdue() || isNearDeadline()) cardClass += "alert-red";

  return (
    <div className={cardClass} style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{task.title}</h3>
        <span style={styles.statusBadge(task.status)}>
          {task.status === 'completed' ? 'Hoàn thành' : 
           task.status === 'in_progress' ? 'Đang làm' : 
           task.status === 'pending' ? 'Chưa bắt đầu' : 'Quá hạn'}
        </span>
      </div>

      <div style={styles.infoGrid}>
        <div style={styles.infoRow}>
          <User size={16} color="var(--text-muted)" />
          <span><strong>Người làm:</strong> {task.assignee}</span>
        </div>
        <div style={styles.infoRow}>
          <CheckSquare size={16} color="var(--text-muted)" />
          <span><strong>Trách nhiệm:</strong> {task.responsible}</span>
        </div>
        <div style={styles.infoRow}>
          <MapPin size={16} color="var(--text-muted)" />
          <span><strong>Địa điểm:</strong> {task.location}</span>
        </div>
        <div style={styles.infoRow}>
          <Clock size={16} color="var(--text-muted)" />
          <span><strong>Hạn chót:</strong> {new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div style={styles.resultBox}>
        <strong>Kết quả yêu cầu:</strong> {task.expected_result}
      </div>

      {task.status !== 'completed' && (
        <div style={styles.progressSection}>
          <div style={styles.sliderHeader}>
            <label>Cập nhật tiến độ: {progress}%</label>
          </div>
          <div style={styles.updateRow}>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              style={styles.slider}
            />
            <button 
              onClick={handleUpdate} 
              disabled={updating || progress === task.progress}
              style={styles.btn(progress !== task.progress)}
            >
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    padding: '1.25rem',
    borderRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  title: {
    fontSize: '1.125rem',
    color: 'var(--text-main)',
    margin: 0,
  },
  statusBadge: (status) => ({
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    backgroundColor: status === 'completed' ? '#d1fae5' : 
                     status === 'in_progress' ? '#dbeafe' : 
                     status === 'pending' ? '#fef3c7' : '#fee2e2',
    color: status === 'completed' ? '#059669' : 
           status === 'in_progress' ? '#2563eb' : 
           status === 'pending' ? '#d97706' : '#dc2626',
  }),
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    fontSize: '0.875rem',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-main)',
  },
  resultBox: {
    background: 'rgba(255, 255, 255, 0.5)',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    border: '1px solid var(--border)'
  },
  progressSection: {
    marginTop: '0.5rem',
    borderTop: '1px solid var(--border)',
    paddingTop: '1rem',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
  },
  updateRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    accentColor: 'var(--primary)',
  },
  btn: (active) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    background: active ? 'var(--primary)' : 'var(--border)',
    color: active ? 'white' : 'var(--text-muted)',
    fontWeight: 'bold',
    pointerEvents: active ? 'auto' : 'none',
  })
};
