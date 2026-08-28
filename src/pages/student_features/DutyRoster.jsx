import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, Save, ClipboardCheck, Trash2, CheckCircle } from 'lucide-react';

export default function DutyRoster() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [rosters, setRosters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    duty_date: new Date().toISOString().split('T')[0],
    assigned_students: '',
    task_description: ''
  });

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    
    if (currentStudent.role !== 'class_president') {
      alert("Bạn không có quyền truy cập trang này. Chức năng chỉ dành cho Lớp trưởng.");
      navigate('/student-dashboard');
      return;
    }
    
    setStudent(currentStudent);
    fetchRosters(currentStudent.student_class);
  }, [navigate]);

  const fetchRosters = async (className) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_duty_rosters')
        .select('*')
        .eq('class_name', className)
        .order('duty_date', { ascending: false });
        
      if (!error && data) {
        setRosters(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assigned_students) {
      alert("Vui lòng điền người trực nhật.");
      return;
    }

    const newRecord = {
      class_name: student.student_class,
      duty_date: formData.duty_date,
      assigned_students: formData.assigned_students,
      task_description: formData.task_description,
      is_completed: false,
      logged_by: student.username
    };

    try {
      const { error } = await supabase
        .from('cbq_duty_rosters')
        .insert([newRecord]);
        
      if (error) throw error;
      
      alert("Đã phân công trực nhật thành công!");
      setShowForm(false);
      setFormData({ duty_date: new Date().toISOString().split('T')[0], assigned_students: '', task_description: '' });
      fetchRosters(student.student_class);
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('cbq_duty_rosters')
        .update({ is_completed: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      fetchRosters(student.student_class);
    } catch (err) {
      alert("Lỗi khi cập nhật: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Bạn có chắc muốn xóa phân công này?")) return;
    try {
      const { error } = await supabase.from('cbq_duty_rosters').delete().eq('id', id);
      if (error) throw error;
      fetchRosters(student.student_class);
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  if (!student) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <Link to="/student-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '24px', fontWeight: 'bold' }}>
        <ArrowLeft size={20} /> Quay lại Không gian Học sinh
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardCheck color="#ea580c" size={32} /> Phân công trực nhật
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý bởi Lớp trưởng <strong>{student.full_name}</strong> - Lớp <strong>{student.student_class}</strong></p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Phân công mới
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #fb923c', marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#9a3412', fontSize: '18px' }}>Lên lịch trực nhật</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Ngày trực (*)</label>
              <input type="date" required value={formData.duty_date} onChange={e => setFormData({...formData, duty_date: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Người trực (Tên hoặc Tổ) (*)</label>
              <input type="text" required placeholder="VD: Tổ 1 hoặc Nguyễn Văn A, Lê Thị B" value={formData.assigned_students} onChange={e => setFormData({...formData, assigned_students: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Nhiệm vụ cụ thể</label>
              <textarea placeholder="Quét rác, lau bảng, đổ rác..." value={formData.task_description} onChange={e => setFormData({...formData, task_description: e.target.value})} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><Save size={18} /> Lưu phân công</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>Danh sách phân công</h3>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : rosters.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>Chưa có lịch trực nhật nào cho lớp {student.student_class}.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rosters.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: r.is_completed ? '#f0fdf4' : '#f8fafc', borderRadius: '12px', border: `1px solid ${r.is_completed ? '#bbf7d0' : '#e2e8f0'}` }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: r.is_completed ? '#166534' : '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {new Date(r.duty_date).toLocaleDateString('vi-VN')} - {r.assigned_students}
                    {r.is_completed && <CheckCircle size={16} color="#16a34a" />}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                    {r.task_description || 'Trực nhật chung'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => toggleComplete(r.id, r.is_completed)} style={{ padding: '8px 12px', background: r.is_completed ? '#e2e8f0' : '#22c55e', color: r.is_completed ? '#64748b' : 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {r.is_completed ? 'Hoàn tác' : 'Hoàn thành'}
                  </button>
                  <button onClick={() => handleDelete(r.id)} style={{ padding: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' };
