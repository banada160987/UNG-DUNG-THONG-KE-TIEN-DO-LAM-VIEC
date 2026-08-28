import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, GraduationCap, BookOpen, ClipboardList } from 'lucide-react';

export default function TeacherAcademics() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [journals, setJournals] = useState([]);
  const [reports, setReports] = useState([]);
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
    fetchData(currentTeacher.homeroom_class);
  }, [navigate]);

  const fetchData = async (className) => {
    setLoading(true);
    try {
      const [journalRes, reportRes] = await Promise.all([
        supabase.from('cbq_class_journals').select('*').eq('class_name', className).order('study_date', { ascending: false }),
        supabase.from('cbq_academic_reports').select('*').eq('class_name', className).order('report_date', { ascending: false })
      ]);
        
      if (!journalRes.error) setJournals(journalRes.data);
      if (!reportRes.error) setReports(reportRes.data);
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
          <GraduationCap color="#d97706" size={32} /> Tình hình Học tập
        </h1>
        <p style={{ margin: 0, color: '#64748b' }}>Tổng hợp từ Sổ đầu bài và Báo cáo của Lớp phó HT. Lớp: <strong>{teacher.homeroom_class}</strong></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Sổ Đầu Bài */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#854d0e', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} /> Sổ Đầu Bài (Gần đây)
          </h3>
          {loading ? <p>Đang tải...</p> : journals.length === 0 ? <p>Chưa có dữ liệu.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#fefce8', color: '#854d0e' }}>
                    <th style={thStyle}>Ngày</th>
                    <th style={thStyle}>Tiết</th>
                    <th style={thStyle}>Môn</th>
                    <th style={thStyle}>Nhận xét</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.slice(0, 5).map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={tdStyle}>{new Date(j.study_date).toLocaleDateString('vi-VN')}</td>
                      <td style={tdStyle}>Tiết {j.period_number}</td>
                      <td style={tdStyle}><strong>{j.subject}</strong></td>
                      <td style={tdStyle}>{j.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Báo cáo thiếu BTVN */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1d4ed8', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} /> Cảnh báo Học tập (Từ Lớp phó HT)
          </h3>
          {loading ? <p>Đang tải...</p> : reports.length === 0 ? <p>Không có học sinh nào thiếu bài.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.slice(0, 5).map(r => (
                <div key={r.id} style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>{r.subject} - {new Date(r.report_date).toLocaleDateString('vi-VN')}</div>
                  {r.missing_homework_students && <div style={{ fontSize: '14px', color: '#dc2626' }}><strong>Thiếu BTVN:</strong> {r.missing_homework_students}</div>}
                  {r.not_memorized_students && <div style={{ fontSize: '14px', color: '#dc2626' }}><strong>Không thuộc bài:</strong> {r.not_memorized_students}</div>}
                  {r.notes && <div style={{ fontSize: '14px', color: '#475569', marginTop: '8px' }}><em>Ghi chú: {r.notes}</em></div>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const thStyle = { padding: '12px', fontSize: '13px', textTransform: 'uppercase' };
const tdStyle = { padding: '12px', fontSize: '14px', color: '#334155' };
