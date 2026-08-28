import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, Save, Users, QrCode } from 'lucide-react';

export default function EventAttendance() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: new Date().toISOString().split('T')[0],
    attended_students: '',
    total_attended: 0
  });

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    
    if (currentStudent.role !== 'youth_union_secretary') {
      alert("Bạn không có quyền truy cập trang này. Chức năng chỉ dành cho Bí thư.");
      navigate('/student-dashboard');
      return;
    }
    
    setStudent(currentStudent);
    fetchEvents(currentStudent.student_class);
  }, [navigate]);

  const fetchEvents = async (className) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_event_attendance')
        .select('*')
        .eq('class_name', className)
        .order('event_date', { ascending: false });
        
      if (!error && data) {
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.event_name || !formData.attended_students) {
      alert("Vui lòng điền đủ Tên sự kiện và Danh sách người đi.");
      return;
    }

    const newRecord = {
      class_name: student.student_class,
      event_name: formData.event_name,
      event_date: formData.event_date,
      attended_students: formData.attended_students,
      total_attended: Number(formData.total_attended),
      logged_by: student.username
    };

    try {
      const { error } = await supabase
        .from('cbq_event_attendance')
        .insert([newRecord]);
        
      if (error) throw error;
      
      alert("Đã ghi nhận điểm danh thành công!");
      setShowForm(false);
      setFormData({ event_name: '', event_date: new Date().toISOString().split('T')[0], attended_students: '', total_attended: 0 });
      fetchEvents(student.student_class);
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
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
            <Users color="#9333ea" size={32} /> Điểm danh Sự kiện
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý bởi Bí thư <strong>{student.full_name}</strong> - Lớp <strong>{student.student_class}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#f3e8ff', color: '#9333ea', border: '1px solid #d8b4fe', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <QrCode size={18} /> Quét QR
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={18} /> Điểm danh tay
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #c084fc', marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(147, 51, 234, 0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#6b21a8', fontSize: '18px' }}>Ghi nhận tham gia sự kiện</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Ngày diễn ra (*)</label>
              <input type="date" required value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Tên sự kiện / Hoạt động (*)</label>
              <input type="text" required placeholder="VD: Mít tinh 20/11, Dọn vệ sinh trường..." value={formData.event_name} onChange={e => setFormData({...formData, event_name: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Tổng số lượng tham gia (*)</label>
              <input type="number" required placeholder="VD: 15" min="1" value={formData.total_attended} onChange={e => setFormData({...formData, total_attended: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Danh sách học sinh (Ghi chú tên)</label>
              <textarea required placeholder="VD: Nam, Hoa, Bình, Cường..." value={formData.attended_students} onChange={e => setFormData({...formData, attended_students: e.target.value})} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><Save size={18} /> Lưu điểm danh</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>Lịch sử hoạt động</h3>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>Chưa có ghi chép điểm danh sự kiện nào cho lớp {student.student_class}.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={thStyle}>Ngày</th>
                  <th style={thStyle}>Sự kiện</th>
                  <th style={thStyle}>Số lượng</th>
                  <th style={thStyle}>Danh sách tham gia</th>
                </tr>
              </thead>
              <tbody>
                {events.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>{new Date(r.event_date).toLocaleDateString('vi-VN')}</td>
                    <td style={tdStyle}><strong>{r.event_name}</strong></td>
                    <td style={tdStyle}><span style={{ padding: '4px 8px', background: '#f3e8ff', color: '#7e22ce', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>{r.total_attended} HS</span></td>
                    <td style={tdStyle}>{r.attended_students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' };
const thStyle = { padding: '12px 16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 16px', fontSize: '14px', color: '#334155' };
