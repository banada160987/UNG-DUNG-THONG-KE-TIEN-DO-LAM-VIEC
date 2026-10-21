import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getTeacherSession } from '../services/authSessionManager';

export default function TeacherRoute({ children }) {
  const location = useLocation();
  const teacher = getTeacherSession();

  if (teacher) {
    return children;
  }

  // Hỗ trợ phiên quản trị viên đặc biệt nếu có
  const adminStr = localStorage.getItem('cbq_user');
  if (adminStr) {
    try {
      const admin = JSON.parse(adminStr);
      if (admin && (admin.username || admin.email)) {
        return children;
      }
    } catch (_) {}
  }

  return <Navigate to="/dang-nhap-giao-vien" state={{ from: location }} replace />;
}
