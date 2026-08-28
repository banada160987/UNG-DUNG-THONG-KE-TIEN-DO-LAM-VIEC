import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, Save, ClipboardList, BookOpen } from 'lucide-react';

export default function AcademicReport() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    subject: '',
    missing_homework_students: '',
    not_memorized_students: '',
    notes: ''
  });

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    
    if (currentStudent.role !== 'vp_academics') {
      alert("Bạn không có quyền truy cập trang này. Chức năng chỉ dành cho Lớp phó Học tập.");
      navigate('/student-dashboard');
      return;
    }
    
    setStudent(currentStudent);
    fetchReports(currentStudent.student_class);
  }, [navigate]);

  const fetchReports = async (className) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_academic_reports')
        .select('*')
        .eq('class_name', className)
        .order('report_date', { ascending: false });
        
      if (!error && data) {
        setReports(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject) {
      alert("Vui lòng điền Môn học.");
      return;
    }

    const newRecord = {
      class_name: student.student_class,
      report_date: formData.report_date,
      subject: formData.subject,
      missing_homework_students: formData.missing_homework_students,
      not_memorized_students: formData.not_memorized_students,
      notes: formData.notes,
      logged_by: student.username
    };

    try {
      const { error } = await supabase
        .from('cbq_academic_reports')
        .insert([newRecord]);
        
      if (error) throw error;
      
      alert("Đã lưu báo cáo học tập thành công!");
      setShowForm(false);
      setFormData({ report_date: new Date().toISOString().split('T')[0], subject: '', missing_homework_students: '', not_memorized_students: '', notes: '' });
      fetchReports(student.student_class);
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
            <ClipboardList color="#2563eb" size={32} /> Báo Cáo Chuyên Cần Học Tập
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý bởi Lớp phó HT <strong>{student.full_name}</strong> - Lớp <strong>{student.student_class}</strong></p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Báo cáo môn mới
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #60a5fa', marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1d4ed8', fontSize: '18px' }}>Tạo báo cáo mới</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Ngày học (*)</label>
              <input type="date" required value={formData.report_date} onChange={e => setFormData({...formData, report_date: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Môn học (*)</label>
              <input type="text" required placeholder="VD: Toán học" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>HS Không làm bài tập</label>
              <input type="text" placeholder="VD: Nam, Hoa..." value={formData.missing_homework_students} onChange={e => setFormData({...formData, missing_homework_students: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>HS Không thuộc bài cũ</label>
              <input type="text" placeholder="VD: Bình, Hùng..." value={formData.not_memorized_students} onChange={e => setFormData({...formData, not_memorized_students: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Ghi chú / Xin hỗ trợ phụ đạo</label>
              <textarea placeholder="VD: Xin cô phụ đạo thêm chương này vì lớp chưa hiểu rõ..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><Save size={18} /> Lưu báo cáo</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>Lịch sử báo cáo</h3>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>Chưa có báo cáo học tập nào cho lớp {student.student_class}.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={thStyle}>Ngày</th>
                  <th style={thStyle}>Môn học</th>
                  <th style={thStyle}>Thiếu BTVN</th>
                  <th style={thStyle}>Không thuộc bài</th>
                  <th style={thStyle}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>{new Date(r.report_date).toLocaleDateString('vi-VN')}</td>
                    <td style={tdStyle}><strong>{r.subject}</strong></td>
                    <td style={tdStyle}><span style={{ color: r.missing_homework_students ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{r.missing_homework_students || 'Không'}</span></td>
                    <td style={tdStyle}><span style={{ color: r.not_memorized_students ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{r.not_memorized_students || 'Không'}</span></td>
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
