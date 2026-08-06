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
import AdminPages from './pages/AdminPages';
import AdminDocs from './pages/AdminDocs';
import AdminUsers from './pages/AdminUsers';

function App() {
  const { user, role, permissions = {}, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Đang tải hệ thống...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <Login />} />
      
      {/* Public Portal Routes */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/gioi-thieu" element={<PublicAbout />} />
      <Route path="/tin-tuc" element={<PublicNewsList />} />
      <Route path="/van-ban" element={<PublicDocs />} />
      <Route path="/bang-vang" element={<PublicSponsorsList />} />
      <Route path="/thu-vien-anh" element={<PublicGallery />} />
      
      {/* Protected Admin Routes */}
      {user ? (
        <>
          <Route path="/admin" element={(role === 'admin' || role === 'secretary') ? <Dashboard /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/committee" element={<CommitteeView />} />
          <Route path="/admin/sponsors" element={permissions.canViewSponsors ? <AdminSponsors /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/news" element={permissions.canViewNews ? <AdminNews /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/guests" element={permissions.canViewGuests ? <AdminGuests /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/pages" element={permissions.canViewPages ? <AdminPages /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/docs" element={permissions.canViewDocs ? <AdminDocs /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/users" element={role === 'admin' ? <AdminUsers /> : <Navigate to="/admin/committee" replace />} />
        </>
      ) : (
        <Route path="/admin/*" element={<Navigate to="/login" replace />} />
      )}
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
