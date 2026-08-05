import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CommitteeView from './pages/CommitteeView';
import PublicHome from './pages/PublicHome';
import PublicAbout from './pages/PublicAbout';
import PublicNewsList from './pages/PublicNewsList';
import PublicDocs from './pages/PublicDocs';
import PublicSponsorsList from './pages/PublicSponsorsList';
import PublicGallery from './pages/PublicGallery';
import AdminSponsors from './pages/AdminSponsors';
import AdminNews from './pages/AdminNews';
import AdminGuests from './pages/AdminGuests';

function App() {
  const { user, role } = useAuth();

  // Bỏ qua xác thực để test nhanh

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/admin" replace />} />
      
      {/* Public Portal Routes */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/gioi-thieu" element={<PublicAbout />} />
      <Route path="/tin-tuc" element={<PublicNewsList />} />
      <Route path="/van-ban" element={<PublicDocs />} />
      <Route path="/bang-vang" element={<PublicSponsorsList />} />
      <Route path="/thu-vien-anh" element={<PublicGallery />} />
      
      {/* Protected Admin Routes */}
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
