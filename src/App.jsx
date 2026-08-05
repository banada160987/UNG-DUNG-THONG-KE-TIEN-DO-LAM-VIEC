import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CommitteeView from './pages/CommitteeView';

function App() {
  const { user, role } = useAuth();

  // Protected Route Wrapper
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(role)) {
      // If user has a role but tries to access an unauthorized route
      if (role === 'admin') return <Navigate to="/" replace />;
      if (role === 'committee_member') return <Navigate to="/committee" replace />;
      return <div>Không có quyền truy cập</div>;
    }

    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={role === 'admin' ? '/' : '/committee'} /> : <Login />} />
      
      {/* Admin Route */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Committee Route */}
      <Route 
        path="/committee" 
        element={
          <ProtectedRoute allowedRoles={['committee_member']}>
            <CommitteeView />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
