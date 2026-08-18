import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
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

  useAutoRefresh(fetchData, 60000);

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

  const handleExportWord = () => {
    const totalTasks = displayedTasks.length;
    const completedTasks = displayedTasks.filter(t => t.status === 'completed').length;
    const overdueTasks = displayedTasks.filter(t => t.status !== 'completed' && new Date(t.deadline) < new Date()).length;
    const inProgressTasks = totalTasks - completedTasks;

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Báo Cáo Tiến Độ Công Việc - File Word Khổ Ngang</title>
          <!--[if gte mso 9]>
          <xml>
           <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForCustomXSL/>
           </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page Section1 {
              size: 841.9pt 595.3pt;
              mso-page-orientation: landscape;
              margin: 0.8in 0.8in 0.8in 0.8in;
            }
            div.Section1 { page: Section1; }
            body { font-family: 'Times New Roman', serif; line-height: 1.4; color: #000000; }
            .header-table { width: 100%; border: none; margin-bottom: 20px; }
            .header-table td { border: none; padding: 0; }
            .title-doc { font-size: 18pt; font-weight: bold; text-align: center; color: #b71c1c; text-transform: uppercase; margin: 15px 0 5px 0; }
            .subtitle-doc { font-size: 13pt; font-style: italic; text-align: center; margin-bottom: 20px; }
            .stats-box { border: 1px solid #1e3a8a; background-color: #f0f9ff; padding: 10px; margin-bottom: 20px; font-size: 11pt; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #000000; padding: 8px; font-size: 11pt; text-align: left; vertical-align: top; }
            table.data-table th { background-color: #e2e8f0; font-weight: bold; text-align: center; }
            .overdue-tag { color: #dc2626; font-weight: bold; }
            .completed-tag { color: #166534; font-weight: bold; }
            .note-cell { background-color: #fff7ed; color: #9a3412; font-weight: 500; }
            .footer-table { width: 100%; border: none; margin-top: 40px; }
            .footer-table td { border: none; text-align: center; vertical-align: top; font-size: 12pt; }
          </style>
        </head>
        <body>
          <div class="Section1">
            <table class="header-table">
              <tr>
                <td style="width: 40%; text-align: center;">
                  <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
                  <strong>BAN TỔ CHỨC LỄ KỶ NIỆM 30 NĂM</strong>
                </td>
                <td style="width: 60%; text-align: center;">
                  <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                  <u><strong>Độc lập - Tự do - Hạnh phúc</strong></u>
                </td>
              </tr>
            </table>

            <div class="title-doc">BÁO CÁO CHI TIẾT TIẾN ĐỘ & LÝ DO CHƯA HOÀN THÀNH CÔNG VIỆC</div>
            <div class="subtitle-doc">Phân mục: ${selectedCommitteeName} • Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}</div>

            <div class="stats-box">
              <strong>TỔNG QUAN TIẾN ĐỘ:</strong> Tổng số công việc: <strong>${totalTasks}</strong> | Đã hoàn thành: <strong style="color: #166534;">${completedTasks}</strong> (${totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%) | Đang xử lý: <strong>${inProgressTasks}</strong> | Số công việc Bị Quá Hạn: <strong style="color: #dc2626;">${overdueTasks}</strong>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 4%;">STT</th>
                  <th style="width: 22%;">Tên Công Việc & Yêu Cầu</th>
                  <th style="width: 14%;">Người Làm & Trách Nhiệm</th>
                  <th style="width: 12%;">Hạn Chót & Vị Trí</th>
                  <th style="width: 10%;">Tiến Độ & Trạng Thái</th>
                  <th style="width: 38%;">GHI CHÚ / LÝ DO CHƯA HOÀN THÀNH / ĐỀ XUẤT VƯỚNG MẮC</th>
                </tr>
              </thead>
              <tbody>
                ${displayedTasks.map((t, idx) => {
                  const isTaskOverdue = t.status !== 'completed' && new Date(t.deadline) < new Date();
                  let statusHtml = '';
                  if (isTaskOverdue) {
                    statusHtml = `<span class="overdue-tag">⚠️ QUÁ HẠN</span>`;
                  } else if (t.status === 'completed') {
                    statusHtml = `<span class="completed-tag">✅ HOÀN THÀNH</span>`;
                  } else {
                    statusHtml = `<span>⏳ Đang làm (${t.progress}%)</span>`;
                  }

                  const noteContent = t.notes ? t.notes : (isTaskOverdue ? 'Chưa cập nhật lý do quá hạn' : 'Không có ghi chú');
                  const commName = selectedCommitteeId === 'all' ? (allCommittees.find(c => c.id === t.committee_id)?.name || '') : '';

                  return `
                    <tr>
                      <td style="text-align: center;"><strong>${idx + 1}</strong></td>
                      <td>
                        <strong>${t.title}</strong>
                        ${commName ? `<br/><span style="font-size: 9pt; color: #475569;">[${commName}]</span>` : ''}
                        <br/><em style="font-size: 10pt; color: #334155;">Kết quả YC: ${t.expected_result || 'N/A'}</em>
                      </td>
                      <td>
                        <strong>Làm:</strong> ${t.assignee}<br/>
                        <strong>Trách nhiệm:</strong> ${t.responsible}
                      </td>
                      <td>
                        📅 ${new Date(t.deadline).toLocaleDateString('vi-VN')}<br/>
                        📍 ${t.location || 'Tại trường'}
                      </td>
                      <td style="text-align: center;">
                        <strong>${t.progress}%</strong><br/>
                        ${statusHtml}
                      </td>
                      <td class="${isTaskOverdue || t.notes ? 'note-cell' : ''}">
                        ${isTaskOverdue ? `<strong style="color: #b91c1c;">[CẢNH BÁO QUÁ HẠN]</strong><br/>` : ''}
                        ${noteContent}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <table class="footer-table">
              <tr>
                <td style="width: 50%;">
                  <br/>
                  <strong>NGƯỜI LẬP BÁO CÁO</strong><br/>
                  <em>(Ký, ghi rõ họ tên)</em>
                  <br/><br/><br/><br/>
                  ......................................................
                </td>
                <td style="width: 50%;">
                  <em>..., Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em><br/>
                  <strong>TRƯỜNG BAN TỔ CHỨC LỄ KỶ NIỆM</strong><br/>
                  <em>(Ký tên và đóng dấu)</em>
                  <br/><br/><br/><br/>
                  ......................................................
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCao_TienDo_LyDoQuaHan_${selectedCommitteeName.replace(/[^a-zA-Z0-9]/g, '_')}_A4_Ngang.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    handleExportWord();
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
              <button onClick={handleExportWord} style={{ ...styles.actionBtn, backgroundColor: '#166534', color: 'white', border: 'none', fontWeight: 'bold' }}>
                <Printer size={18} /> Xuất Báo Cáo Word (.doc)
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
