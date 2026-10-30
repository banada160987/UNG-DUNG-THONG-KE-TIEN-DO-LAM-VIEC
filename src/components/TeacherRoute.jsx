import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getTeacherSession, getStudentSession } from '../services/authSessionManager';
import { useAuth } from '../contexts/AuthContext';
import AccessDeniedScreen from './AccessDeniedScreen';

export default function TeacherRoute({ children }) {
  const location = useLocation();
  const teacher = getTeacherSession();
  const student = getStudentSession();
  const { user, role } = useAuth();

  // 1. CHẶN ĐỨNG HỌC SINH: Nếu phát hiện đang đăng nhập bằng tài khoản Học sinh
  if (student && !teacher) {
    return (
      <AccessDeniedScreen 
        requiredRole="teacher"
        currentRole="student"
        currentUser={student}
        targetPath={location.pathname}
      />
    );
  }

  // 2. Giáo viên có phiên làm việc hợp lệ (role 'teacher' & chữ ký xác thực)
  if (teacher && teacher.role === 'teacher') {
    return children;
  }

  // 3. Quản trị viên (Admin) hoặc Thư ký có quyền truy cập
  if (user && (role === 'admin' || role === 'secretary')) {
    return children;
  }

  // Hỗ trợ phiên quản trị viên đặc biệt nếu có trong hệ thống
  const adminStr = localStorage.getItem('cbq_user');
  if (adminStr) {
    try {
      const admin = JSON.parse(adminStr);
      if (admin && (admin.username || admin.email || admin.role === 'admin')) {
        return children;
      }
    } catch (_) {}
  }

  // 4. Chưa đăng nhập -> Chuyển đến trang Đăng nhập Giáo Viên
  return <Navigate to="/dang-nhap-giao-vien" state={{ from: location }} replace />;
}
