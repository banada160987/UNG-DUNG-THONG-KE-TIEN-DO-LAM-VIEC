import { useState } from 'react';
import TaskCard from './TaskCard';
import { supabase } from '../lib/supabase';
import { DndContext, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function DraggableTask({ task, onUpdate, onEdit, onDelete, isAdmin }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status, task }
  });

  const style = {
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab'
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard 
        task={task} 
        onUpdate={onUpdate} 
        onEdit={onEdit}
        onDelete={onDelete}
        isAdmin={isAdmin} 
        isKanban={true}
      />
    </div>
  );
}

function DroppableColumn({ col, tasksCount, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  
  return (
    <div 
      ref={setNodeRef}
      style={{ 
        backgroundColor: isOver ? '#e2e8f0' : '#f8fafc', 
        padding: '15px', 
        borderRadius: '8px', 
        border: '1px solid #e2e8f0', 
        minHeight: '400px', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'background-color 0.2s'
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', borderBottom: `3px solid ${col.color}`, paddingBottom: '10px', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b' }}>
        {col.title}
        <span style={{ backgroundColor: '#cbd5e1', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: '#0f172a' }}>
          {tasksCount}
        </span>
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
        {children}
        {tasksCount === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '2px dashed #cbd5e1', padding: '2rem 1rem', borderRadius: '0.5rem', width: '100%', margin: 0 }}>
              Kéo thả thẻ vào đây
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onUpdate, onEdit, onDelete, isAdmin }) {
  const [activeTask, setActiveTask] = useState(null);

  const columns = [
    { id: 'pending', title: 'Chưa bắt đầu', color: '#94a3b8' },
    { id: 'in_progress', title: 'Đang thực hiện', color: '#f59e0b' },
    { id: 'completed', title: 'Hoàn thành', color: '#10b981' }
  ]; // Bỏ "Chờ duyệt" tạm thời để đơn giản hóa cột

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(active.data.current.task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const currentStatus = active.data.current.status;
    const targetStatus = over.id;

    if (currentStatus === targetStatus) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      let progress = task.progress;
      if (targetStatus === 'completed') progress = 100;
      else if (targetStatus === 'pending') progress = 0;
      else if (targetStatus === 'in_progress' && progress === 0) progress = 10;

      const { error } = await supabase.from('cbq_tasks').update({ status: targetStatus, progress }).eq('id', taskId);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      alert("Lỗi khi kéo thả: " + err.message);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(280px, 1fr))', gap: '1rem', alignItems: 'start', overflowX: 'auto', paddingBottom: '1rem' }}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <DroppableColumn key={col.id} col={col} tasksCount={colTasks.length}>
              {colTasks.map(task => (
                <DraggableTask 
                  key={task.id} 
                  task={task} 
                  onUpdate={onUpdate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isAdmin={isAdmin}
                />
              ))}
            </DroppableColumn>
          );
        })}
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <div style={{ opacity: 0.8, transform: 'scale(1.05)', cursor: 'grabbing' }}>
            <TaskCard 
              task={activeTask} 
              onUpdate={() => {}} 
              onEdit={() => {}}
              onDelete={() => {}}
              isAdmin={false} 
              isKanban={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
