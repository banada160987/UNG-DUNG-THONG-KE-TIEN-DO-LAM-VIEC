import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, BookOpen, Wallet, Activity, ShieldAlert, GraduationCap, LayoutDashboard } from 'lucide-react';

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    setTeacher(JSON.parse(currentTeacherStr));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('cbq_current_teacher');
    navigate('/');
  };

  if (!teacher) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: 'white', padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', fontWeight: 'bold', fontSize: '24px' }}>
              {teacher.full_name.charAt(0)}
            </div>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a' }}>Giáo viên: {teacher.full_name}</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                {teacher.homeroom_class ? `GVCN Lớp ${teacher.homeroom_class}` : 'Giáo viên bộ môn'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>

        {/* Dashboard Grid */}
        <h2 style={{ fontSize: '18px', color: '#334155', marginBottom: '16px' }}>Công cụ Quản lý Chủ nhiệm</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Quản lý Thu Chi */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#dcfce7', color: '#16a34a', borderRadius: '16px' }}><Wallet size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Quản lý Thu / Chi</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Tạo đợt thu BHYT, BHTT, Quỹ lớp. Tích chọn học sinh đã đóng tiền, tự động thống kê số dư.
            </p>
            <Link to="/teacher-dashboard/funds" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#16a34a', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Mở Sổ Quỹ</Link>
          </div>

          {/* Theo dõi Nề nếp (Cờ đỏ báo về) */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '16px' }}><ShieldAlert size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Báo cáo Nề nếp</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Xem danh sách vi phạm của lớp hôm nay do Đội Cờ đỏ chấm (Kèm hình ảnh minh chứng).
            </p>
            <Link to="/teacher-dashboard/discipline" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#dc2626', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Xem vi phạm</Link>
          </div>

          {/* Sổ Đầu Bài & Học Tập */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#fef3c7', color: '#d97706', borderRadius: '16px' }}><GraduationCap size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Tình hình Học tập</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Kiểm tra Sổ đầu bài điện tử do Lớp trưởng ghi và Báo cáo thiếu BTVN từ Lớp phó Học tập.
            </p>
            <Link to="/teacher-dashboard/academics" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#d97706', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Xem tình hình học tập</Link>
          </div>

          {/* Kho Ứng Dụng (App Hub) */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '16px' }}><LayoutDashboard size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Cổng Tiện Ích</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Truy cập nhanh vào các phần mềm trường học: SMAS, Azota, K12Online, Email... 
            </p>
            <Link to="/teacher-dashboard/app-hub" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#4f46e5', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Mở Kho Ứng Dụng</Link>
          </div>

        </div>

      </div>
    </div>
  );
}
