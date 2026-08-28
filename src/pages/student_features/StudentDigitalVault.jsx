import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, FileBadge, QrCode, Download, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function StudentDigitalVault() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    setStudent(currentStudent);
    fetchDocuments(currentStudent.full_name, currentStudent.student_class);
  }, [navigate]);

  const fetchDocuments = async (name, className) => {
    setLoading(true);
    try {
      // Tìm bằng đúng tên và lớp của học sinh đang đăng nhập
      const { data, error } = await supabase
        .from('cbq_digital_documents')
        .select('*')
        .eq('student_name', name)
        .eq('student_class', className)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <Link to="/student-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '24px', fontWeight: 'bold' }}>
        <ArrowLeft size={20} /> Quay lại Hệ sinh thái
      </Link>
      
      <div style={{ marginBottom: '32px', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '32px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileBadge color="#60a5fa" size={40} /> Tủ Hồ Sơ Cá Nhân
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>Học sinh: <strong>{student.full_name}</strong> - Lớp: <strong>{student.student_class}</strong></p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', color: '#1e293b', margin: '0 0 16px 0' }}>Văn bằng & Giấy tờ Số hóa của bạn</h2>
        
        {loading ? (
          <p>Đang đồng bộ dữ liệu với máy chủ...</p>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', background: 'white', borderRadius: '16px', padding: '40px', border: '1px dashed #cbd5e1' }}>
            <FileBadge size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#475569' }}>Tủ hồ sơ trống</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Nhà trường chưa cấp phát giấy tờ điện tử nào cho bạn.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
                
                {doc.status !== 'Active' && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} /> ĐÃ THU HỒI
                    </div>
                  </div>
                )}

                <div style={{ padding: '24px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                      {doc.document_type}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '13px', fontWeight: 'bold' }}>
                      <ShieldCheck size={16} /> Đã xác thực
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0f172a', lineHeight: '1.4' }}>{doc.title}</h3>
                  {doc.content && (
                    <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>{doc.content}</p>
                  )}
                </div>

                <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Cấp bởi: {doc.issued_by}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Ngày: {new Date(doc.issue_date).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                      <QrCode size={16} color="#334155" />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>Mã: {doc.document_code}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
