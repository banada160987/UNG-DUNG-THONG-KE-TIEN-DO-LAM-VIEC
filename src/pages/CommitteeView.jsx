import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CommitteeView() {
  const { committeeId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [allCommittees, setAllCommittees] = useState([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, commRes] = await Promise.all([
        supabase.from('cbq_tasks').select('*').order('deadline', { ascending: true }),
        supabase.from('cbq_committees').select('*')
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (commRes.error) throw commRes.error;

      setTasks(tasksRes.data || []);
      setAllCommittees(commRes.data || []);
    } catch (error) {
      console.error('Error fetching committee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedTasks = selectedCommitteeId === 'all' 
    ? tasks 
    : tasks.filter(t => t.committee_id === selectedCommitteeId);

  const selectedCommitteeName = selectedCommitteeId === 'all' 
    ? 'Tất cả công việc' 
    : allCommittees.find(c => c.id === selectedCommitteeId)?.name;

  return (
    <Layout title={selectedCommitteeName || "Quản lý công việc"}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
      ) : (
        <div>
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontWeight: 'bold' }}>Chọn Tiểu ban:</label>
            <select 
              value={selectedCommitteeId} 
              onChange={(e) => setSelectedCommitteeId(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', flex: 1, maxWidth: '400px' }}
            >
              <option value="all">-- Tất cả công việc --</option>
              {allCommittees.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.stats}>
            <div className="glass" style={styles.statBox}>
              <h3>Tổng số</h3>
              <p>{displayedTasks.length}</p>
            </div>
            <div className="glass" style={styles.statBox}>
              <h3>Đã hoàn thành</h3>
              <p>{displayedTasks.filter(t => t.status === 'completed').length}</p>
            </div>
            <div className="glass" style={styles.statBox}>
              <h3>Đang xử lý</h3>
              <p>{displayedTasks.filter(t => t.status === 'in_progress').length}</p>
            </div>
          </div>

          <h2 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Danh sách công việc</h2>
          <div style={styles.taskList}>
            {displayedTasks.length === 0 ? (
              <p className="glass" style={{ padding: '1rem', textAlign: 'center' }}>Chưa có công việc nào được giao.</p>
            ) : (
              displayedTasks.map(task => (
                <TaskCard key={task.id} task={task} onUpdate={fetchData} />
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  statBox: {
    padding: '1.5rem',
    borderRadius: '1rem',
    textAlign: 'center',
  },
  taskList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  }
};
