import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import BulkDeadlineModal from '../components/BulkDeadlineModal';
import KanbanBoard from '../components/KanbanBoard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Printer, Calendar } from 'lucide-react';

export default function CommitteeView() {
  const { role, committeeId } = useAuth();
  const isAdminOrSecretary = role === 'admin' || role === 'secretary';
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [allCommittees, setAllCommittees] = useState([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(isAdminOrSecretary ? 'all' : (committeeId || ''));
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (!isAdminOrSecretary && committeeId) {
      setSelectedCommitteeId(committeeId);
    }
    fetchData();
  }, [isAdminOrSecretary, committeeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, commRes] = await Promise.all([
        supabase.from('cbq_tasks').select('*').order('deadline', { ascending: true }),
        supabase.from('cbq_committees').select('*')
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (commRes.error) throw commRes.error;

      const fetchedTasks = tasksRes.data || [];
      setTasks(fetchedTasks);
      setAllCommittees(commRes.data || []);

      const taskIdFromUrl = searchParams.get('taskId');
      if (taskIdFromUrl) {
        const taskToOpen = fetchedTasks.find(t => t.id === taskIdFromUrl);
        if (taskToOpen) {
          setEditingTask(taskToOpen);
          setIsModalOpen(true);
          searchParams.delete('taskId');
          setSearchParams(searchParams, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error fetching committee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này không?")) return;
    try {
      const { error } = await supabase.from('cbq_tasks').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Lỗi khi xóa công việc: " + err.message);
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        // Update
        const { error } = await supabase.from('cbq_tasks').update(taskData).eq('id', editingTask.id);
        if (error) throw error;
        alert("Cập nhật thành công!");
      } else {
        // Create
        const { error } = await supabase.from('cbq_tasks').insert([taskData]);
        if (error) throw error;
        alert("Giao việc thành công!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Lỗi lưu công việc: " + err.message);
    }
  };

  const displayedTasks = selectedCommitteeId === 'all' 
    ? tasks 
    : tasks.filter(t => t.committee_id === selectedCommitteeId);

  const selectedCommitteeName = selectedCommitteeId === 'all' 
    ? 'Tất cả công việc' 
    : allCommittees.find(c => c.id === selectedCommitteeId)?.name;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Báo Cáo Tiến Độ Tiểu Ban</title>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 30px; }
            h1 { font-size: 24px; text-transform: uppercase; margin-bottom: 5px; }
            h3 { font-size: 18px; font-weight: normal; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #000; padding: 8px 10px; text-align: left; }
            th { font-weight: bold; background-color: #f8f9fa; }
            .text-center { text-align: center; }
            .footer { margin-top: 40px; text-align: right; padding-right: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BÁO CÁO TIẾN ĐỘ CÔNG VIỆC</h1>
            <h3>Tiểu ban: ${selectedCommitteeName}</h3>
            <p>Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="text-center" width="5%">STT</th>
                <th width="25%">Tên công việc</th>
                <th width="15%">Người làm</th>
                <th width="15%">Người chịu trách nhiệm</th>
                <th width="10%">Hạn chót</th>
                <th class="text-center" width="10%">Tiến độ</th>
                <th width="20%">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${displayedTasks.map((t, index) => {
                const isTaskOverdue = t.status !== 'completed' && new Date(t.deadline) < new Date();
                let statusText = '';
                if (isTaskOverdue) statusText = 'Quá hạn';
                else if (t.status === 'completed') statusText = 'Hoàn thành';
                else if (t.status === 'in_progress') statusText = 'Đang thực hiện';
                else statusText = 'Chưa bắt đầu';

                return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td><strong>${t.title}</strong><br/><em>${t.expected_result}</em></td>
                  <td>${t.assignee}</td>
                  <td>${t.responsible}</td>
                  <td>${new Date(t.deadline).toLocaleDateString('vi-VN')}</td>
                  <td class="text-center">${t.progress}%</td>
                  <td>${statusText}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p><strong>Người lập biểu</strong></p>
            <br/><br/><br/>
            <p>.......................................</p>
          </div>

          <script>
            window.onload = function() { 
              window.print(); 
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Layout title={selectedCommitteeName || "Quản lý công việc"}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            {isAdminOrSecretary ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <label style={{ fontWeight: 'bold' }}>Chọn Tiểu ban:</label>
                <select 
                  value={selectedCommitteeId} 
                  onChange={(e) => setSelectedCommitteeId(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', maxWidth: '400px' }}
                >
                  <option value="all">-- Tất cả công việc --</option>
                  {allCommittees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <h2 style={{ color: 'var(--primary)', margin: 0 }}>{selectedCommitteeName}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Chỉ hiển thị công việc thuộc tiểu ban của bạn</p>
              </div>
            )}

            {/* Action Buttons for ALL (Admin/Secretary/Member) */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setViewMode(v => v === 'list' ? 'kanban' : 'list')} style={{ ...styles.actionBtn, backgroundColor: '#e2e8f0', color: '#1e293b', border: '1px solid #cbd5e1' }}>
                {viewMode === 'list' ? 'Chế độ: Kanban' : 'Chế độ: Danh sách'}
              </button>
              {isAdminOrSecretary && (
                <button onClick={() => setIsBulkModalOpen(true)} style={{ ...styles.actionBtn, backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                  <Calendar size={18} /> Đổi Hạn chót loạt
                </button>
              )}
              <button onClick={handlePrint} style={{ ...styles.actionBtn, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                <Printer size={18} /> In Báo Cáo
              </button>
              <button onClick={handleOpenNewTask} style={{ ...styles.actionBtn, backgroundColor: 'var(--primary)', color: 'white', border: 'none' }}>
                <Plus size={18} /> Giao việc mới
              </button>
            </div>
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
          {viewMode === 'list' ? (
            <div style={styles.taskList}>
              {displayedTasks.length === 0 ? (
                <p className="glass" style={{ padding: '1rem', textAlign: 'center' }}>Chưa có công việc nào được giao.</p>
              ) : (
                displayedTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onUpdate={fetchData} 
                    onEdit={handleOpenEditTask}
                    onDelete={handleDeleteTask}
                    isAdmin={true} 
                  />
                ))
              )}
            </div>
          ) : (
            <KanbanBoard 
              tasks={displayedTasks} 
              onUpdate={fetchData} 
              onEdit={handleOpenEditTask}
              onDelete={handleDeleteTask}
              isAdmin={isAdminOrSecretary}
            />
          )}
        </div>
      )}

      {/* Reusable Task Modal */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        committees={allCommittees}
        userRole={role}
        userCommitteeId={committeeId}
      />

      {/* Bulk Update Modal */}
      {isAdminOrSecretary && (
        <BulkDeadlineModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onUpdated={fetchData}
          committees={allCommittees}
        />
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
  },
  actionBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)'
  }
};
