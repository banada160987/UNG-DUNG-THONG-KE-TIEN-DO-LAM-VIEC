import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import PublicLayout from './components/PublicLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loaded pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CommitteeView = lazy(() => import('./pages/CommitteeView'));
const PublicHome = lazy(() => import('./pages/PublicHome'));
const PublicAbout = lazy(() => import('./pages/PublicAbout'));
const PublicNewsList = lazy(() => import('./pages/PublicNewsList'));
const PublicDocs = lazy(() => import('./pages/PublicDocs'));
const PublicSponsorsList = lazy(() => import('./pages/PublicSponsorsList'));
const PublicGallery = lazy(() => import('./pages/PublicGallery'));
const PublicGuestbook = lazy(() => import('./pages/PublicGuestbook'));
const AdminSponsors = lazy(() => import('./pages/AdminSponsors'));
const AdminNews = lazy(() => import('./pages/AdminNews'));
const AdminGuests = lazy(() => import('./pages/AdminGuests'));
const AdminGuestbook = lazy(() => import('./pages/AdminGuestbook'));
const AdminPages = lazy(() => import('./pages/AdminPages'));
const AdminDocs = lazy(() => import('./pages/AdminDocs'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminLinks = lazy(() => import('./pages/AdminLinks'));
const AdminGallery = lazy(() => import('./pages/AdminGallery'));
const AdminAuditLog = lazy(() => import('./pages/AdminAuditLog'));
const AdminInviteConfig = lazy(() => import('./pages/AdminInviteConfig'));
const OnlineInvitation = lazy(() => import('./pages/OnlineInvitation'));
const PublicQuiz = lazy(() => import('./pages/PublicQuiz'));
const AdminQuiz = lazy(() => import('./pages/AdminQuiz'));
const PublicVoting = lazy(() => import('./pages/PublicVoting'));
const AdminVoting = lazy(() => import('./pages/AdminVoting'));
const PublicSubmission = lazy(() => import('./pages/PublicSubmission'));
const StudentRegister = lazy(() => import('./pages/StudentRegister'));
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const PublicSportsRegister = lazy(() => import('./pages/PublicSportsRegister'));
const AdminSports = lazy(() => import('./pages/AdminSports'));
const PublicFeedbackSystem = lazy(() => import('./pages/PublicFeedbackSystem'));
const AdminFeedbackSystem = lazy(() => import('./pages/AdminFeedbackSystem'));
const PublicGuide = lazy(() => import('./pages/PublicGuide'));
const PublicMagazine = lazy(() => import('./pages/PublicMagazine'));
const AdminMagazine = lazy(() => import('./pages/AdminMagazine'));
const PublicSchedule = lazy(() => import('./pages/PublicSchedule'));
const AdminSchedule = lazy(() => import('./pages/AdminSchedule'));
const PublicStaff = lazy(() => import('./pages/PublicStaff'));
const AdminStaff = lazy(() => import('./pages/AdminStaff'));
const PublicParkingRegister = lazy(() => import('./pages/PublicParkingRegister'));
const AdminParking = lazy(() => import('./pages/AdminParking'));
const AdminBus = lazy(() => import('./pages/AdminBus'));
const AdminStudents = lazy(() => import('./pages/AdminStudents'));
const AdminQRScanner = lazy(() => import('./pages/AdminQRScanner'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const PublicEmulationScoring = lazy(() => import('./pages/PublicEmulationScoring'));
const AdminEmulation = lazy(() => import('./pages/AdminEmulation'));
const AdminMenuConfig = lazy(() => import('./pages/AdminMenuConfig'));
const AdminDigitalVault = lazy(() => import('./pages/AdminDigitalVault'));
const AppHub = lazy(() => import('./pages/AppHub'));
const DepartmentDrive = lazy(() => import('./pages/DepartmentDrive'));

// Student Features
const ClassJournal = lazy(() => import('./pages/student_features/ClassJournal'));
const DutyRoster = lazy(() => import('./pages/student_features/DutyRoster'));
const AcademicReport = lazy(() => import('./pages/student_features/AcademicReport'));
const DisciplineInspection = lazy(() => import('./pages/student_features/DisciplineInspection'));
const UnionFunds = lazy(() => import('./pages/student_features/UnionFunds'));
const EventAttendance = lazy(() => import('./pages/student_features/EventAttendance'));
const StudentDigitalVault = lazy(() => import('./pages/student_features/StudentDigitalVault'));

// Teacher Features
const TeacherLogin = lazy(() => import('./pages/TeacherLogin'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const TeacherFundsManager = lazy(() => import('./pages/teacher_features/TeacherFundsManager'));
const TeacherDiscipline = lazy(() => import('./pages/teacher_features/TeacherDiscipline'));
const TeacherAcademics = lazy(() => import('./pages/teacher_features/TeacherAcademics'));

function App() {
  const { user, role, permissions = {}, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Đang tải hệ thống...</div>;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600 font-medium">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Đang tải trang...</span>
          </div>
        </div>
      }>
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
            <Route path="/teacher-dashboard/department-drive" element={<DepartmentDrive />} />
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
              <Route path="/admin/links" element={permissions.canViewLinks ? <AdminLinks /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/department-drives" element={(role === 'admin' || role === 'secretary') ? <DepartmentDrive /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/app-hub" element={(role === 'admin' || role === 'secretary') ? <AppHub /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/users" element={role === 'admin' ? <AdminUsers /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/menu-config" element={role === 'admin' ? <AdminMenuConfig /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/audit" element={role === 'admin' ? <AdminAuditLog /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/digital-vault" element={role === 'admin' ? <AdminDigitalVault /> : <Navigate to="/admin/committee" replace />} />
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
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
