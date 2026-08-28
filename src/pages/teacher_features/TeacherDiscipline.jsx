import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function TeacherDiscipline() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    const currentTeacher = JSON.parse(currentTeacherStr);
    
    if (!currentTeacher.homeroom_class) {
      alert("Chức năng này chỉ dành cho Giáo viên chủ nhiệm.");
      navigate('/teacher-dashboard');
      return;
    }
    
    setTeacher(currentTeacher);
    fetchRecords(currentTeacher.homeroom_class);
  }, [navigate]);

  const fetchRecords = async (className) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_discipline_records')
        .select('*')
        .eq('inspected_class', className)
        .order('inspection_date', { ascending: false });
        
      if (!error && data) {
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!teacher) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '24px', fontWeight: 'bold' }}>
        <ArrowLeft size={20} /> Bảng điều khiển GVCN
      </Link>
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert color="#dc2626" size={32} /> Báo cáo Vi phạm Nề nếp
        </h1>
        <p style={{ margin: 0, color: '#64748b' }}>Cập nhật theo thời gian thực từ Đội Cờ đỏ. Lớp: <strong>{teacher.homeroom_class}</strong></p>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#16a34a', padding: '32px 0', fontWeight: 'bold' }}>Tuyệt vời! Lớp {teacher.homeroom_class} không có vi phạm nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {records.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#7f1d1d', fontWeight: 'bold' }}>
                    {r.violation_type}
                  </div>
                  <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '4px' }}>
                    {new Date(r.inspection_date).toLocaleDateString('vi-VN')} {r.notes && `- Ghi chú: ${r.notes}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Người ghi nhận: {r.logged_by}
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                  -{r.point_deduction}đ
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
