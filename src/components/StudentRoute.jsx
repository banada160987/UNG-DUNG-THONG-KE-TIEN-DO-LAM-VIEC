import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStudentSession, getTeacherSession } from '../services/authSessionManager';
import AccessDeniedScreen from './AccessDeniedScreen';

export default function StudentRoute({ children }) {
  const location = useLocation();
  const student = getStudentSession();
  const teacher = getTeacherSession();

  // 1. CÁCH LY CHUYÊN MÔN: Nếu Thầy/Cô đang trong phiên Giáo viên, chặn truy cập khu vực học sinh
  if (teacher && !student) {
    return (
      <AccessDeniedScreen 
        requiredRole="student"
        currentRole="teacher"
        currentUser={teacher}
        targetPath={location.pathname}
      />
    );
  }

  // 2. Học sinh có phiên làm việc hợp lệ (role 'student' / 'member' / 'monitor')
  if (student && student.role !== 'teacher') {
    return children;
  }

  // 3. Chưa đăng nhập -> Chuyển đến trang Đăng nhập Học Sinh
  return <Navigate to="/dang-nhap-hoc-sinh" state={{ from: location }} replace />;
}
