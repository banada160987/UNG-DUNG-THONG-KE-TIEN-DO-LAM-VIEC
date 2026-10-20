import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function StudentRoute({ children }) {
  const location = useLocation();
  const studentStr = localStorage.getItem('cbq_current_student');

  if (!studentStr) {
    return <Navigate to="/dang-nhap-hoc-sinh" state={{ from: location }} replace />;
  }

  try {
    const student = JSON.parse(studentStr);
    if (!student || (!student.username && !student.student_code && !student.full_name)) {
      return <Navigate to="/dang-nhap-hoc-sinh" state={{ from: location }} replace />;
    }
  } catch (_) {
    return <Navigate to="/dang-nhap-hoc-sinh" state={{ from: location }} replace />;
  }

  return children;
}
