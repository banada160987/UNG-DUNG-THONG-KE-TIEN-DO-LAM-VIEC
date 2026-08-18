import { useEffect, useState } from 'react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Plus, DollarSign, PieChart as PieChartIcon, BarChart as BarChartIcon, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import TaskModal from '../components/TaskModal';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useAutoRefresh(fetchData, 60000);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, committeesRes, sponsorsRes] = await Promise.all([
        supabase.from('cbq_tasks').select('*'),
        supabase.from('cbq_committees').select('*'),
        supabase.from('cbq_sponsors').select('donation_amount').eq('is_public', true)
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (committeesRes.error) throw committeesRes.error;

      setTasks(tasksRes.data || []);
      setCommittees(committeesRes.data || []);
      setSponsors(sponsorsRes.data || []);
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
  const totalIncome = sponsors.reduce((acc, s) => acc + (Number(s.donation_amount) || 0), 0);
  const balance = totalIncome - totalBudget;

  const statusData = [
    { name: 'Chưa làm', value: tasks.filter(t => t.status === 'pending').length, color: 'var(--status-pending)' },
    { name: 'Đang làm', value: tasks.filter(t => t.status === 'in_progress').length, color: 'var(--status-progress)' },
    { name: 'Hoàn thành', value: tasks.filter(t => t.status === 'completed').length, color: 'var(--status-completed)' },
    { name: 'Quá hạn', value: tasks.filter(t => t.status === 'overdue').length, color: 'var(--status-overdue)' },
  ].filter(d => d.value > 0);

  const committeeChartData = committees.map(c => ({
    name: c.name.replace('Tiểu ban ', ''),
    'Tiến độ (%)': getCommitteeProgress(c.id)
  }));

  const handleExportBudget = () => {
    const budgetTasks = tasks.filter(t => Number(t.budget_estimate) > 0);
    const exportData = budgetTasks.map(t => {
      const comm = committees.find(c => c.id === t.committee_id);
      return {
        'Tên công việc': t.title,
        'Tiểu ban': comm ? comm.name : '',
        'Người phụ trách': t.assignee,
        'Người giám sát': t.reviewer_name || '',
        'Dự toán kinh phí (VNĐ)': Number(t.budget_estimate),
        'Trạng thái': t.status === 'completed' ? 'Hoàn thành' : (t.status === 'in_progress' ? 'Đang thực hiện' : 'Chưa xong'),
        'Hạn chót': new Date(t.deadline).toLocaleDateString('vi-VN')
      };
    });
    
    // Add total row
    exportData.push({
      'Tên công việc': 'TỔNG CỘNG',
      'Dự toán kinh phí (VNĐ)': totalBudget
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dự toán kinh phí");
    XLSX.writeFile(wb, "BaoCao_DuToanKinhPhi.xlsx");
  };

  const handleExportPerformance = () => {
    // Group tasks by assignee
    const assignees = {};
    tasks.forEach(t => {
      const name = t.assignee || 'Chưa phân công';
      if (!assignees[name]) {
        assignees[name] = { total: 0, completed: 0, overdue: 0, pending: 0, in_review: 0 };
      }
      assignees[name].total += 1;
      if (t.status === 'completed') assignees[name].completed += 1;
      else if (t.status === 'in_review') assignees[name].in_review += 1;
      else if (new Date(t.deadline) < new Date()) assignees[name].overdue += 1;
      else assignees[name].pending += 1;
    });

    const exportData = Object.keys(assignees).map(name => {
      const stats = assignees[name];
      const rate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
      return {
        'Họ và Tên': name,
        'Tổng số việc được giao': stats.total,
        'Đã hoàn thành': stats.completed,
        'Chờ duyệt': stats.in_review,
        'Đang làm / Chưa đến hạn': stats.pending,
        'Trễ hạn': stats.overdue,
        'Tỷ lệ hoàn thành (%)': Number(rate)
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hiệu suất cá nhân");
    XLSX.writeFile(wb, "BaoCao_HieuSuatCaNhan.xlsx");
  };

  return (
    <Layout title="Tổng quan Ban Tổ chức">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handleExportBudget}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#10b981', color: 'white', padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)', border: 'none', cursor: 'pointer'
              }}
            >
              <Download size={20} />
              Dự toán (Excel)
            </button>
            <button 
              onClick={handleExportPerformance}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)', border: 'none', cursor: 'pointer'
              }}
            >
              <Download size={20} />
              Hiệu suất (Excel)
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)', border: 'none', cursor: 'pointer'
              }}
            >
              <Plus size={20} />
              Giao việc mới
            </button>
          </div>
          <div style={styles.grid}>
          {/* Sports Management Quick Access Card */}
          <Link to="/admin/the-thao" className="glass" style={{ ...styles.card, gridColumn: '1 / -1', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', textDecoration: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '18px 22px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#fde047', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚽ QUẢN LÝ THỂ THAO & BỐC THĂM BẢNG ĐẤU 30 NĂM
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#e0f2fe' }}>
                Xem danh sách VĐV đăng ký, quản lý kinh phí 300k, xuất file Excel & bốc thăm chia bảng đấu tự động cho BTC.
              </p>
            </div>
            <span style={{ padding: '8px 18px', background: '#ffffff', color: '#0369a1', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px' }}>
              Truy Cập Ngay ➔
            </span>
          </Link>

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
            <DollarSign color="#166534" size={32} />
            <div>
              <div style={{...styles.statValue, color: '#166534'}}>{totalIncome.toLocaleString()} đ</div>
              <div style={styles.statLabel}>Tổng thu (Tài trợ)</div>
            </div>
          </div>
          <div className="glass" style={styles.statCard}>
            <DollarSign color="#eab308" size={32} />
            <div>
              <div style={{...styles.statValue, color: '#eab308'}}>{totalBudget.toLocaleString()} đ</div>
              <div style={styles.statLabel}>Tổng chi (Dự kiến)</div>
            </div>
          </div>
          <div className="glass" style={{...styles.statCard, gridColumn: '1 / -1', justifyContent: 'center', backgroundColor: balance >= 0 ? '#f0fdf4' : '#fef2f2'}}>
            <DollarSign color={balance >= 0 ? '#166534' : '#d32f2f'} size={40} />
            <div>
              <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: balance >= 0 ? '#166534' : '#d32f2f'}}>{balance.toLocaleString()} đ</div>
              <div style={{...styles.statLabel, textAlign: 'center'}}>Cân đối Ngân sách</div>
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

          {/* Biểu đồ phân tích (Analytics) */}
          <div className="glass" style={{...styles.card, gridColumn: '1 / -1'}}>
            <h2 style={styles.cardTitle}>
              <PieChartIcon style={{ marginRight: '0.5rem' }} /> Phân tích Tổng thể
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', height: '300px' }}>
              
              <div style={{ height: '100%' }}>
                <h3 style={{textAlign: 'center', fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)'}}>Trạng thái Công việc</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ height: '100%' }}>
                <h3 style={{textAlign: 'center', fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)'}}>Tiến độ các Tiểu ban</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={committeeChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={120} style={{fontSize: '12px'}} />
                    <Tooltip />
                    <Bar dataKey="Tiến độ (%)" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

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
