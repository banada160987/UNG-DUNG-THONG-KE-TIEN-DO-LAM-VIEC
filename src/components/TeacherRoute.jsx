import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function TeacherRoute({ children }) {
  const location = useLocation();
  const teacherStr = localStorage.getItem('cbq_current_teacher') || 
                     localStorage.getItem('cbq_teacher_session') || 
                     localStorage.getItem('cbq_user');

  if (!teacherStr) {
    return <Navigate to="/dang-nhap-giao-vien" state={{ from: location }} replace />;
  }

  try {
    const teacher = JSON.parse(teacherStr);
    if (!teacher || (!teacher.username && !teacher.full_name && !teacher.name && !teacher.email)) {
      return <Navigate to="/dang-nhap-giao-vien" state={{ from: location }} replace />;
    }
  } catch (_) {
    return <Navigate to="/dang-nhap-giao-vien" state={{ from: location }} replace />;
  }

  return children;
}
