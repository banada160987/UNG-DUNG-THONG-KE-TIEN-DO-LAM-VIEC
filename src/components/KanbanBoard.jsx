import { useState } from 'react';
import TaskCard from './TaskCard';
import { supabase } from '../lib/supabase';

export default function KanbanBoard({ tasks, onUpdate, onEdit, onDelete, isAdmin }) {
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  const columns = [
    { id: 'pending', title: 'Chưa bắt đầu', color: '#94a3b8' },
    { id: 'in_progress', title: 'Đang thực hiện', color: '#f59e0b' },
    { id: 'in_review', title: 'Chờ duyệt', color: '#8b5cf6' },
    { id: 'completed', title: 'Hoàn thành', color: '#10b981' }
  ];

  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Bắt buộc để cho phép Drop
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDraggingTaskId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // Yêu cầu nộp minh chứng nếu chuyển sang "Chờ duyệt"
    if (targetStatus === 'in_review') {
       const proof = window.prompt('Vui lòng nhập link minh chứng (Google Drive, hình ảnh, tài liệu...) để duyệt:');
       if (proof) {
           await addProofComment(taskId, proof);
       } else {
           if(!window.confirm('Bạn chưa cung cấp minh chứng. Bạn có chắc chắn muốn chuyển sang trạng thái chờ duyệt không?')) return;
       }
    }

    try {
      let progress = task.progress;
      if (targetStatus === 'completed') progress = 100;
      else if (targetStatus === 'pending') progress = 0;
      else if (targetStatus === 'in_review' && progress === 0) progress = 99;

      const { error } = await supabase.from('cbq_tasks').update({ status: targetStatus, progress }).eq('id', taskId);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      alert("Lỗi khi kéo thả: " + err.message);
    }
  };

  const addProofComment = async (taskId, proofUrl) => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('cbq_task_comments').insert([{
              task_id: taskId,
              user_email: user?.email || 'Thành viên',
              content: 'Đã nộp minh chứng: ' + proofUrl,
              attachment_url: proofUrl
          }]);
      } catch (e) { console.log(e); }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))', gap: '1rem', alignItems: 'start', overflowX: 'auto', paddingBottom: '1rem' }}>
      {columns.map(col => (
        <div 
          key={col.id} 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '400px', display: 'flex', flexDirection: 'column' }}
        >
          <h3 style={{ margin: '0 0 15px 0', borderBottom: `3px solid ${col.color}`, paddingBottom: '10px', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b' }}>
            {col.title}
            <span style={{ backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: '#475569' }}>
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
            {tasks.filter(t => t.status === col.id).map(task => (
              <div 
                key={task.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                style={{ cursor: 'grab', opacity: draggingTaskId === task.id ? 0.4 : 1, transition: 'opacity 0.2s' }}
              >
                 <TaskCard 
                  task={task} 
                  onUpdate={onUpdate} 
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isAdmin={isAdmin} 
                  isKanban={true}
                />
              </div>
            ))}
            
            {tasks.filter(t => t.status === col.id).length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '2px dashed #cbd5e1', padding: '2rem 1rem', borderRadius: '0.5rem', width: '100%', margin: 0 }}>
                  Kéo thả thẻ vào đây
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
