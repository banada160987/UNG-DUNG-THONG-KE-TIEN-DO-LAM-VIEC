import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CommitteeView from './pages/CommitteeView';
import PublicHome from './pages/PublicHome';
import AdminSponsors from './pages/AdminSponsors';
import AdminNews from './pages/AdminNews';
import AdminGuests from './pages/AdminGuests';

function App() {
  const { user, role } = useAuth();

  // Bỏ qua xác thực để test nhanh

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/admin" replace />} />
      
      {/* Public Route */}
      <Route path="/" element={<PublicHome />} />
      
      {/* Admin Route */}
      <Route path="/admin" element={<Dashboard />} />
      
      {/* Committee Route */}
      <Route path="/admin/committee" element={<CommitteeView />} />

      {/* ERP Routes */}
      <Route path="/admin/sponsors" element={<AdminSponsors />} />
      <Route path="/admin/news" element={<AdminNews />} />
      <Route path="/admin/guests" element={<AdminGuests />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
