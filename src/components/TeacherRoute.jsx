import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getTeacherSession } from '../services/authSessionManager';
import { useAuth } from '../contexts/AuthContext';

export default function TeacherRoute({ children }) {
  const location = useLocation();
  const teacher = getTeacherSession();
  const { user, role } = useAuth();

  if (teacher) {
    return children;
  }

  // Quản trị viên (Admin) hoặc Thư ký được toàn quyền truy cập các tính năng chuyên môn giáo viên
  if (user && (role === 'admin' || role === 'secretary')) {
    return children;
  }

  // Hỗ trợ phiên quản trị viên đặc biệt nếu có
  const adminStr = localStorage.getItem('cbq_user');
  if (adminStr) {
    try {
      const admin = JSON.parse(adminStr);
      if (admin && (admin.username || admin.email || admin.role === 'admin')) {
        return children;
      }
    } catch (_) {}
  }

  return <Navigate to="/dang-nhap-giao-vien" state={{ from: location }} replace />;
}
