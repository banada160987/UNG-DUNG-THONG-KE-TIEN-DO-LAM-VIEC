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
import AdminLinks from './pages/AdminLinks';
import AdminGallery from './pages/AdminGallery';
import AdminAuditLog from './pages/AdminAuditLog';
import AdminInviteConfig from './pages/AdminInviteConfig';
import OnlineInvitation from './pages/OnlineInvitation';
import PublicQuiz from './pages/PublicQuiz';
import AdminQuiz from './pages/AdminQuiz';
import PublicLayout from './components/PublicLayout';

function App() {
  const { user, role, permissions = {}, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Đang tải hệ thống...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <Login />} />
      <Route path="/thiep/:code" element={<OnlineInvitation />} />
      <Route path="/invite/:code" element={<OnlineInvitation />} />
      
      {/* Public Portal Routes with Nested Routing */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicHome />} />
        <Route path="/gioi-thieu" element={<PublicAbout />} />
        <Route path="/tin-tuc" element={<PublicNewsList />} />
        <Route path="/van-ban" element={<PublicDocs />} />
        <Route path="/bang-vang" element={<PublicSponsorsList />} />
        <Route path="/thu-vien-anh" element={<PublicGallery />} />
        <Route path="/cuoc-thi" element={<PublicQuiz />} />
      </Route>
      
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
          <Route path="/admin/gallery" element={permissions.canViewNews ? <AdminGallery /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/links" element={role === 'admin' ? <AdminLinks /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/users" element={role === 'admin' ? <AdminUsers /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/audit" element={role === 'admin' ? <AdminAuditLog /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/invite-config" element={permissions.canViewPages ? <AdminInviteConfig /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/quizzes" element={permissions.canViewNews ? <AdminQuiz /> : <Navigate to="/admin/committee" replace />} />
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
