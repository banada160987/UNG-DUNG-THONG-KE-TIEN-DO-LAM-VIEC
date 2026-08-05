import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CommitteeView from './pages/CommitteeView';

function App() {
  const { user, role } = useAuth();

  // Bỏ qua xác thực để test nhanh

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      
      {/* Admin Route */}
      <Route path="/" element={<Dashboard />} />
      
      {/* Committee Route */}
      <Route path="/committee" element={<CommitteeView />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
