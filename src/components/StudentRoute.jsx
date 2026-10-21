import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStudentSession } from '../services/authSessionManager';

export default function StudentRoute({ children }) {
  const location = useLocation();
  const student = getStudentSession();

  if (!student) {
    return <Navigate to="/dang-nhap-hoc-sinh" state={{ from: location }} replace />;
  }

  return children;
}
