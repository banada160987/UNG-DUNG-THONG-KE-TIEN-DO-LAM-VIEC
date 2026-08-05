import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CommitteeView() {
  const { committeeId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [committee, setCommittee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (committeeId) {
      fetchData();
    }
  }, [committeeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, commRes] = await Promise.all([
        supabase.from('cbq_tasks').select('*').eq('committee_id', committeeId).order('deadline', { ascending: true }),
        supabase.from('cbq_committees').select('*').eq('id', committeeId).single()
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (commRes.error) throw commRes.error;

      setTasks(tasksRes.data || []);
      setCommittee(commRes.data);
    } catch (error) {
      console.error('Error fetching committee data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={committee?.name || "Quản lý công việc"}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
      ) : (
        <div>
          <div style={styles.stats}>
            <div className="glass" style={styles.statBox}>
              <h3>Tổng số</h3>
              <p>{tasks.length}</p>
            </div>
            <div className="glass" style={styles.statBox}>
              <h3>Đã hoàn thành</h3>
              <p>{tasks.filter(t => t.status === 'completed').length}</p>
            </div>
            <div className="glass" style={styles.statBox}>
              <h3>Đang xử lý</h3>
              <p>{tasks.filter(t => t.status === 'in_progress').length}</p>
            </div>
          </div>

          <h2 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Danh sách công việc</h2>
          <div style={styles.taskList}>
            {tasks.length === 0 ? (
              <p className="glass" style={{ padding: '1rem', textAlign: 'center' }}>Chưa có công việc nào được giao.</p>
            ) : (
              tasks.map(task => (
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
