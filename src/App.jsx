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
import PublicGuestbook from './pages/PublicGuestbook';
import AdminSponsors from './pages/AdminSponsors';
import AdminNews from './pages/AdminNews';
import AdminGuests from './pages/AdminGuests';
import AdminGuestbook from './pages/AdminGuestbook';
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
import PublicVoting from './pages/PublicVoting';
import AdminVoting from './pages/AdminVoting';
import PublicSubmission from './pages/PublicSubmission';
import StudentRegister from './pages/StudentRegister';
import StudentLogin from './pages/StudentLogin';
import PublicSportsRegister from './pages/PublicSportsRegister';
import AdminSports from './pages/AdminSports';
import PublicFeedbackSystem from './pages/PublicFeedbackSystem';
import AdminFeedbackSystem from './pages/AdminFeedbackSystem';
import PublicGuide from './pages/PublicGuide';
import PublicMagazine from './pages/PublicMagazine';
import AdminMagazine from './pages/AdminMagazine';
import PublicSchedule from './pages/PublicSchedule';
import AdminSchedule from './pages/AdminSchedule';
import PublicStaff from './pages/PublicStaff';
import AdminStaff from './pages/AdminStaff';
import PublicParkingRegister from './pages/PublicParkingRegister';
import AdminParking from './pages/AdminParking';
import AdminBus from './pages/AdminBus';
import AdminStudents from './pages/AdminStudents';
import AdminQRScanner from './pages/AdminQRScanner';
import StudentDashboard from './pages/StudentDashboard';
import PublicEmulationScoring from './pages/PublicEmulationScoring';
import AdminEmulation from './pages/AdminEmulation';
import AdminMenuConfig from './pages/AdminMenuConfig';
import AdminDigitalVault from './pages/AdminDigitalVault';
import AppHub from './pages/AppHub';
import PublicLayout from './components/PublicLayout';

// Student Features
import ClassJournal from './pages/student_features/ClassJournal';
import DutyRoster from './pages/student_features/DutyRoster';
import AcademicReport from './pages/student_features/AcademicReport';
import DisciplineInspection from './pages/student_features/DisciplineInspection';
import UnionFunds from './pages/student_features/UnionFunds';
import EventAttendance from './pages/student_features/EventAttendance';
import StudentDigitalVault from './pages/student_features/StudentDigitalVault';

// Teacher Features
import TeacherLogin from './pages/TeacherLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherFundsManager from './pages/teacher_features/TeacherFundsManager';
import TeacherDiscipline from './pages/teacher_features/TeacherDiscipline';
import TeacherAcademics from './pages/teacher_features/TeacherAcademics';

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
        <Route path="/huong-dan" element={<PublicGuide />} />
        <Route path="/tap-san" element={<PublicMagazine />} />
        <Route path="/lich-cong-tac" element={<PublicSchedule />} />
        <Route path="/to-chuyen-mon" element={<PublicStaff />} />
        <Route path="/dang-ky-xe-may" element={<PublicParkingRegister />} />
        <Route path="/cham-diem-thi-dua" element={<PublicEmulationScoring />} />
        <Route path="/tin-tuc" element={<PublicNewsList />} />
        <Route path="/van-ban" element={<PublicDocs />} />
        <Route path="/bang-vang" element={<PublicSponsorsList />} />
        <Route path="/thu-vien-anh" element={<PublicGallery />} />
        <Route path="/luu-but" element={<PublicGuestbook />} />
        <Route path="/cuoc-thi" element={<PublicQuiz />} />
        <Route path="/binh-chon" element={<PublicVoting />} />
        <Route path="/nop-bai-thi" element={<PublicSubmission />} />
        <Route path="/dang-ky-the-thao" element={<PublicSportsRegister />} />
        <Route path="/gop-y" element={<PublicFeedbackSystem />} />
        <Route path="/gop-y-quy-hoc-bong" element={<Navigate to="/gop-y" replace />} />
        <Route path="/dang-ky" element={<StudentRegister />} />
        <Route path="/dang-nhap-hoc-sinh" element={<StudentLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        
        {/* Role-based Student Features */}
        <Route path="/hoc-sinh/so-dau-bai" element={<ClassJournal />} />
        <Route path="/hoc-sinh/truc-nhat" element={<DutyRoster />} />
        <Route path="/hoc-sinh/bao-cao-hoc-tap" element={<AcademicReport />} />
        <Route path="/hoc-sinh/cham-diem-ne-nep" element={<DisciplineInspection />} />
        <Route path="/hoc-sinh/quy-doan" element={<UnionFunds />} />
        <Route path="/hoc-sinh/diem-danh-su-kien" element={<EventAttendance />} />
        <Route path="/hoc-sinh/van-bang-so" element={<StudentDigitalVault />} />
        
        {/* Teacher Portal */}
        <Route path="/dang-nhap-giao-vien" element={<TeacherLogin />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher-dashboard/funds" element={<TeacherFundsManager />} />
        <Route path="/teacher-dashboard/discipline" element={<TeacherDiscipline />} />
        <Route path="/teacher-dashboard/academics" element={<TeacherAcademics />} />
        <Route path="/teacher-dashboard/app-hub" element={<AppHub />} />
      </Route>
      
      {/* Protected Admin Routes */}
      {user ? (
        <>
          <Route path="/admin" element={(role === 'admin' || role === 'secretary') ? <Dashboard /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/committee" element={<CommitteeView />} />
          <Route path="/admin/emulation" element={permissions.canViewEmulation ? <AdminEmulation /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/students" element={permissions.canViewStudents ? <AdminStudents /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/bus" element={permissions.canViewStudents ? <AdminBus /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/parking" element={permissions.canViewStudents ? <AdminParking /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/qr-scanner" element={permissions.canViewStudents ? <AdminQRScanner /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/schedule" element={permissions.canViewDocs ? <AdminSchedule /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/staff" element={permissions.canViewDocs ? <AdminStaff /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/sponsors" element={permissions.canViewSponsors ? <AdminSponsors /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/news" element={permissions.canViewNews ? <AdminNews /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/guests" element={permissions.canViewGuests ? <AdminGuests /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/luu-but" element={permissions.canViewGuestbook ? <AdminGuestbook /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/pages" element={permissions.canViewPages ? <AdminPages /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/docs" element={permissions.canViewDocs ? <AdminDocs /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/tap-san" element={permissions.canViewMagazine ? <AdminMagazine /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/gallery" element={permissions.canViewNews ? <AdminGallery /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/links" element={role === 'admin' ? <AdminLinks /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/users" element={role === 'admin' ? <AdminUsers /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/menu-config" element={role === 'admin' ? <AdminMenuConfig /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/audit" element={role === 'admin' ? <AdminAuditLog /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/digital-vault" element={role === 'admin' ? <AdminDigitalVault /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/app-hub" element={<AppHub />} />
          <Route path="/admin/invite-config" element={permissions.canViewPages ? <AdminInviteConfig /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/quizzes" element={permissions.canViewQuizzes ? <AdminQuiz /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/voting" element={permissions.canViewQuizzes ? <AdminVoting /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/the-thao" element={permissions.canViewSports ? <AdminSports /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/gop-y" element={permissions.canViewFeedback ? <AdminFeedbackSystem /> : <Navigate to="/admin/committee" replace />} />
          <Route path="/admin/gop-y-quy-hoc-bong" element={<Navigate to="/admin/gop-y" replace />} />
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
