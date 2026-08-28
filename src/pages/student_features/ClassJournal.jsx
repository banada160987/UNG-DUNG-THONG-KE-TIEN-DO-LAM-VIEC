import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Save, BookOpen, Clock, User } from 'lucide-react';

export default function ClassJournal() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    period_number: 1,
    subject: '',
    teacher_name: '',
    absent_students: '',
    notes: ''
  });

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    
    // Only allow Class President
    if (currentStudent.role !== 'class_president') {
      alert("Bạn không có quyền truy cập trang này. Chức năng chỉ dành cho Lớp trưởng.");
      navigate('/student-dashboard');
      return;
    }
    
    setStudent(currentStudent);
    fetchRecords(currentStudent.student_class);
  }, [navigate]);

  const fetchRecords = async (className) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_class_journals')
        .select('*')
        .eq('class_name', className)
        .order('study_date', { ascending: false })
        .order('period_number', { ascending: true });
        
      if (!error && data) {
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.teacher_name) {
      alert("Vui lòng điền đủ Môn học và Tên Giáo viên.");
      return;
    }

    const newRecord = {
      class_name: student.student_class,
      study_date: new Date().toISOString().split('T')[0],
      period_number: formData.period_number,
      subject: formData.subject,
      teacher_name: formData.teacher_name,
      absent_students: formData.absent_students,
      notes: formData.notes,
      logged_by: student.username
    };

    try {
      const { error } = await supabase
        .from('cbq_class_journals')
        .insert([newRecord]);
        
      if (error) throw error;
      
      alert("Đã lưu sổ đầu bài điện tử thành công!");
      setShowForm(false);
      setFormData({ period_number: 1, subject: '', teacher_name: '', absent_students: '', notes: '' });
      fetchRecords(student.student_class);
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
            <BookOpen color="#ca8a04" size={32} /> Sổ Đầu Bài Điện Tử
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý bởi Lớp trưởng <strong>{student.full_name}</strong> - Lớp <strong>{student.student_class}</strong></p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#ca8a04', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Ghi sổ tiết mới
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #facc15', marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(202, 138, 4, 0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#854d0e', fontSize: '18px' }}>Ghi nhận tiết học hôm nay</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Tiết học số (*)</label>
              <select value={formData.period_number} onChange={e => setFormData({...formData, period_number: e.target.value})} style={inputStyle}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Tiết {n}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Môn học (*)</label>
              <input type="text" required placeholder="VD: Toán học" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Tên Giáo viên (*)</label>
              <input type="text" required placeholder="VD: Thầy Nguyễn Văn A" value={formData.teacher_name} onChange={e => setFormData({...formData, teacher_name: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Danh sách vắng (nếu có)</label>
              <input type="text" placeholder="VD: Nam (P), Hoa (KP)" value={formData.absent_students} onChange={e => setFormData({...formData, absent_students: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Nhận xét của Giáo viên (hoặc lớp trưởng)</label>
              <textarea placeholder="Nhập nhận xét..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#ca8a04', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><Save size={18} /> Lưu vào sổ</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>Lịch sử tiết học</h3>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>Chưa có ghi chép sổ đầu bài nào cho lớp {student.student_class}.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={thStyle}>Ngày</th>
                  <th style={thStyle}>Tiết</th>
                  <th style={thStyle}>Môn học</th>
                  <th style={thStyle}>Giáo viên</th>
                  <th style={thStyle}>HS Vắng</th>
                  <th style={thStyle}>Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>{new Date(r.study_date).toLocaleDateString('vi-VN')}</td>
                    <td style={tdStyle}>Tiết {r.period_number}</td>
                    <td style={tdStyle}><strong>{r.subject}</strong></td>
                    <td style={tdStyle}>{r.teacher_name}</td>
                    <td style={tdStyle}><span style={{ color: r.absent_students ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>{r.absent_students || 'Không'}</span></td>
                    <td style={tdStyle}>{r.notes || '-'}</td>
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
