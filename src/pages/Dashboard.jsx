import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Plus, DollarSign } from 'lucide-react';
import TaskModal from '../components/TaskModal';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, committeesRes] = await Promise.all([
        supabase.from('cbq_tasks').select('*'),
        supabase.from('cbq_committees').select('*')
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (committeesRes.error) throw committeesRes.error;

      setTasks(tasksRes.data || []);
      setCommittees(committeesRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRedAlertTasks = () => {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    return tasks.filter(t => {
      if (t.status === 'completed') return false;
      const deadline = new Date(t.deadline);
      return deadline <= threeDaysFromNow;
    });
  };

  const getCommitteeProgress = (committeeId) => {
    const committeeTasks = tasks.filter(t => t.committee_id === committeeId);
    if (committeeTasks.length === 0) return 0;
    const totalProgress = committeeTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
    return Math.round(totalProgress / committeeTasks.length);
  };

  const redAlertTasks = getRedAlertTasks();
  const totalBudget = tasks.reduce((acc, t) => acc + (Number(t.budget_estimate) || 0), 0);

  return (
    <Layout title="Tổng quan Ban Tổ chức">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Plus size={20} />
              Giao việc mới
            </button>
          </div>
          <div style={styles.grid}>
          {/* Red Alert Section */}
          <div className="glass" style={{...styles.card, gridColumn: '1 / -1'}}>
            <h2 style={styles.cardTitle}>
              <AlertTriangle color="var(--status-overdue)" style={{ marginRight: '0.5rem' }} />
              Báo động đỏ ({redAlertTasks.length})
            </h2>
            {redAlertTasks.length === 0 ? (
              <p style={{ color: 'var(--status-completed)' }}>Không có công việc nào đang chậm trễ.</p>
            ) : (
              <div style={styles.alertList}>
                {redAlertTasks.map(task => (
                  <div key={task.id} className="alert-red glass" style={styles.alertItem}>
                    <div>
                      <strong>{task.title}</strong>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Người phụ trách: {task.assignee} | Hạn: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div style={styles.progressBadge}>{task.progress}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="glass" style={styles.statCard}>
            <Clock color="var(--status-progress)" size={32} />
            <div>
              <div style={styles.statValue}>{tasks.filter(t => t.status !== 'completed').length}</div>
              <div style={styles.statLabel}>Đang thực hiện</div>
            </div>
          </div>
          <div className="glass" style={styles.statCard}>
            <CheckCircle color="var(--status-completed)" size={32} />
            <div>
              <div style={styles.statValue}>{tasks.filter(t => t.status === 'completed').length}</div>
              <div style={styles.statLabel}>Đã hoàn thành</div>
            </div>
          </div>
          <div className="glass" style={styles.statCard}>
            <DollarSign color="#eab308" size={32} />
            <div>
              <div style={{...styles.statValue, color: '#eab308'}}>{totalBudget.toLocaleString()} đ</div>
              <div style={styles.statLabel}>Tổng dự trù kinh phí</div>
            </div>
          </div>

          {/* Committees Progress */}
          <div className="glass" style={{...styles.card, gridColumn: '1 / -1'}}>
            <h2 style={styles.cardTitle}>Tiến độ các Tiểu ban</h2>
            <div style={styles.committeeList}>
              {committees.map(committee => {
                const progress = getCommitteeProgress(committee.id);
                return (
                  <div key={committee.id} style={styles.committeeItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{committee.name}</strong>
                      <span>{progress}%</span>
                    </div>
                    <div style={styles.progressBarBg}>
                      <div 
                        style={{
                          ...styles.progressBarFill, 
                          width: `${progress}%`,
                          backgroundColor: progress === 100 ? 'var(--status-completed)' : 'var(--primary)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={async (taskData) => {
            try {
              const { error } = await supabase.from('cbq_tasks').insert([{
                ...taskData,
                progress: 0,
                status: 'pending'
              }]);
              if (error) throw error;
              alert('Giao việc thành công!');
              setIsModalOpen(false);
              fetchData();
            } catch (err) {
              alert('Lỗi thêm công việc: ' + err.message);
            }
          }}
          committees={committees}
          task={null}
        />
        </>
      )}
    </Layout>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    padding: '1.5rem',
    borderRadius: '1rem',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
    fontSize: '1.25rem',
  },
  statCard: {
    padding: '1.5rem',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'var(--text-main)',
  },
  statLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  alertItem: {
    padding: '1rem',
    borderRadius: '0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBadge: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '0.25rem 0.5rem',
    borderRadius: '1rem',
    fontWeight: 'bold',
  },
  committeeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  committeeItem: {
    
  },
  progressBarBg: {
    height: '0.75rem',
    backgroundColor: 'var(--border)',
    borderRadius: '1rem',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.5s ease-out',
  }
};
