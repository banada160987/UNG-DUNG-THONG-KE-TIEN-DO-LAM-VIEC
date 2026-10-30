import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import PublicLayout from './components/PublicLayout';
import ErrorBoundary from './components/ErrorBoundary';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import StudentRoute from './components/StudentRoute';
import TeacherRoute from './components/TeacherRoute';
import { lazyWithRetry as lazy } from './utils/lazyWithRetry';

// Lazy loaded pages with auto-retry on Vercel build chunk updates
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
const StudentAspirationsPortal = lazy(() => import('./pages/StudentAspirationsPortal'));
const AdminStudentAspirations = lazy(() => import('./pages/AdminStudentAspirations'));
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
const StageLedTorch = lazy(() => import('./pages/StageLedTorch'));
const AdminTorchControl = lazy(() => import('./pages/AdminTorchControl'));
const AdminStudents = lazy(() => import('./pages/AdminStudents'));
const AdminQRScanner = lazy(() => import('./pages/AdminQRScanner'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const PublicEmulationScoring = lazy(() => import('./pages/PublicEmulationScoring'));
const AdminEmulation = lazy(() => import('./pages/AdminEmulation'));
const AdminMenuConfig = lazy(() => import('./pages/AdminMenuConfig'));
const AdminDigitalVault = lazy(() => import('./pages/AdminDigitalVault'));
const AppHub = lazy(() => import('./pages/AppHub'));
const DepartmentDrive = lazy(() => import('./pages/DepartmentDrive'));
const PublicRegistrations = lazy(() => import('./pages/PublicRegistrations'));
const AdminRegistrations = lazy(() => import('./pages/AdminRegistrations'));
const PublicMeetingAttendance = lazy(() => import('./pages/PublicMeetingAttendance'));
const AdminMeetingAttendance = lazy(() => import('./pages/AdminMeetingAttendance'));

// Student Features
const ClassJournal = lazy(() => import('./pages/student_features/ClassJournal'));
const DutyRoster = lazy(() => import('./pages/student_features/DutyRoster'));
const AcademicReport = lazy(() => import('./pages/student_features/AcademicReport'));
const DisciplineInspection = lazy(() => import('./pages/student_features/DisciplineInspection'));
const UnionFunds = lazy(() => import('./pages/student_features/UnionFunds'));
const EventAttendance = lazy(() => import('./pages/student_features/EventAttendance'));
const StudentDigitalVault = lazy(() => import('./pages/student_features/StudentDigitalVault'));
const StudentCareerAdvisor = lazy(() => import('./pages/student_features/StudentCareerAdvisor'));
const StudentMaterialsHub = lazy(() => import('./pages/student_features/StudentMaterialsHub'));
const StudentExamPortal = lazy(() => import('./pages/student_features/StudentExamPortal'));
const EduVideoHub = lazy(() => import('./pages/EduVideoHub'));
const AdminEduVideos = lazy(() => import('./pages/AdminEduVideos'));

// Teacher Features
const TeacherLogin = lazy(() => import('./pages/TeacherLogin'));
const TeacherRegister = lazy(() => import('./pages/TeacherRegister'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const TeacherEduMaterials = lazy(() => import('./pages/teacher_features/TeacherEduMaterials'));
const TeacherFundsManager = lazy(() => import('./pages/teacher_features/TeacherFundsManager'));
const TeacherDiscipline = lazy(() => import('./pages/teacher_features/TeacherDiscipline'));
const TeacherAcademics = lazy(() => import('./pages/teacher_features/TeacherAcademics'));
const TeacherLessonPlanBuilder = lazy(() => import('./pages/teacher_features/TeacherLessonPlanBuilder'));
const TeacherExamMaker = lazy(() => import('./pages/teacher_features/TeacherExamMaker'));
const TeacherQuestionBank = lazy(() => import('./pages/teacher_features/TeacherQuestionBank'));
const TeacherAssessmentTT22 = lazy(() => import('./pages/teacher_features/TeacherAssessmentTT22'));
const TeacherDepartmentManagement = lazy(() => import('./pages/teacher_features/TeacherDepartmentManagement'));
const TeacherKPIEvaluation = lazy(() => import('./pages/teacher_features/TeacherKPIEvaluation'));
const TeacherHomeroomStudents = lazy(() => import('./pages/teacher_features/TeacherHomeroomStudents'));
const ExamDossierChecker = lazy(() => import('./pages/ExamDossierChecker'));
const Decree30DocFormatter = lazy(() => import('./pages/teacher_features/Decree30DocFormatter'));
const ClassroomInteractiveGames = lazy(() => import('./pages/teacher_features/ClassroomInteractiveGames'));
const CanteenOrderPage = lazy(() => import('./pages/public/CanteenOrderPage'));
const AdminCanteenManager = lazy(() => import('./pages/admin/AdminCanteenManager'));
const PublicServicesPortal = lazy(() => import('./pages/public/PublicServicesPortal'));
const AdminPublicServices = lazy(() => import('./pages/admin/AdminPublicServices'));
const InternalChatPage = lazy(() => import('./pages/InternalChatPage'));
import FacebookMessengerWidget from './components/FacebookMessengerWidget';

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

          {/* Standalone Full-Screen Workstations */}
          <Route path="/kiem-tra-ho-so-tn" element={<ExamDossierChecker />} />
          <Route path="/giao-vien/kiem-tra-ho-so-tn" element={<ExamDossierChecker />} />
          <Route path="/admin/kiem-tra-ho-so-tn" element={<ExamDossierChecker />} />
          <Route path="/teacher/exam-dossier" element={<ExamDossierChecker />} />
          <Route path="/can-chinh-nghi-dinh-30" element={<Decree30DocFormatter />} />
          <Route path="/dinh-dang-van-ban-nd30" element={<Decree30DocFormatter />} />
          <Route path="/giao-vien/dinh-dang-van-ban-nd30" element={<Decree30DocFormatter />} />
          <Route path="/teacher/decree30-formatter" element={<Decree30DocFormatter />} />
          <Route path="/admin/decree30-formatter" element={<Decree30DocFormatter />} />

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
            <Route path="/hom-thu-hoc-sinh" element={<StudentAspirationsPortal />} />
            <Route path="/tam-tu-hoc-sinh" element={<StudentAspirationsPortal />} />
            <Route path="/dang-ky-hoat-dong" element={<PublicRegistrations />} />
            <Route path="/dang-ky" element={<StudentRegister />} />
            <Route path="/dang-nhap-hoc-sinh" element={<StudentLogin />} />
            <Route path="/tra-cuu-van-bang" element={<StudentDigitalVault />} />

            {/* Role-based Student Features (Bảo vệ bởi StudentRoute - Bắt buộc đăng nhập học sinh) */}
            <Route path="/student-dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
            <Route path="/hoc-sinh/so-dau-bai" element={<StudentRoute><ClassJournal /></StudentRoute>} />
            <Route path="/hoc-sinh/truc-nhat" element={<StudentRoute><DutyRoster /></StudentRoute>} />
            <Route path="/hoc-sinh/bao-cao-hoc-tap" element={<StudentRoute><AcademicReport /></StudentRoute>} />
            <Route path="/hoc-sinh/cham-diem-ne-nep" element={<StudentRoute><DisciplineInspection /></StudentRoute>} />
            <Route path="/hoc-sinh/quy-doan" element={<StudentRoute><UnionFunds /></StudentRoute>} />
            <Route path="/hoc-sinh/diem-danh-su-kien" element={<StudentRoute><EventAttendance /></StudentRoute>} />
            <Route path="/hoc-sinh/van-bang-so" element={<StudentRoute><StudentDigitalVault /></StudentRoute>} />
            <Route path="/hoc-sinh/tu-van-to-hop-2-cong-2" element={<StudentRoute><StudentCareerAdvisor /></StudentRoute>} />
            <Route path="/hoc-sinh/huong-nghiep" element={<StudentRoute><StudentCareerAdvisor /></StudentRoute>} />
            <Route path="/hoc-sinh/hoc-lieu-so" element={<StudentRoute><StudentMaterialsHub /></StudentRoute>} />
            <Route path="/hoc-sinh/bai-giang-so" element={<StudentRoute><StudentMaterialsHub /></StudentRoute>} />
            <Route path="/hoc-sinh/lam-bai-thi" element={<StudentRoute><StudentExamPortal /></StudentRoute>} />
            <Route path="/hoc-sinh/lam-bai-thi/:examId" element={<StudentRoute><StudentExamPortal /></StudentRoute>} />
            <Route path="/hoc-sinh/kiem-tra-danh-gia" element={<StudentRoute><StudentExamPortal /></StudentRoute>} />
            <Route path="/dang-ky-xe" element={<PublicParkingRegister />} />
            <Route path="/thi-truc-tuyen" element={<PublicQuiz />} />
            <Route path="/hop-online" element={<PublicMeetingAttendance />} />
            <Route path="/diem-danh-hop" element={<PublicMeetingAttendance />} />
            <Route path="/hop-truc-tuyen" element={<PublicMeetingAttendance />} />
            <Route path="/diem-danh-hop-online" element={<PublicMeetingAttendance />} />
            <Route path="/giao-vien/diem-danh-hop-online" element={<PublicMeetingAttendance />} />
            
            {/* Teacher Portal (Bảo vệ bởi TeacherRoute - Bắt buộc đăng nhập giáo viên) */}
            <Route path="/dang-nhap-giao-vien" element={<TeacherLogin />} />
            <Route path="/dang-ky-giao-vien" element={<TeacherRegister />} />
            <Route path="/teacher-dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
            <Route path="/teacher-dashboard/funds" element={<TeacherRoute><TeacherFundsManager /></TeacherRoute>} />
            <Route path="/teacher-dashboard/discipline" element={<TeacherRoute><TeacherDiscipline /></TeacherRoute>} />
            <Route path="/teacher-dashboard/academics" element={<TeacherRoute><TeacherAcademics /></TeacherRoute>} />
            <Route path="/teacher-dashboard/homeroom" element={<TeacherRoute><TeacherHomeroomStudents /></TeacherRoute>} />
            <Route path="/teacher-dashboard/materials" element={<TeacherRoute><TeacherEduMaterials /></TeacherRoute>} />
            <Route path="/giao-vien/hoc-lieu-so" element={<TeacherRoute><TeacherEduMaterials /></TeacherRoute>} />
            <Route path="/giao-vien/soan-giao-an-5512" element={<TeacherRoute><TeacherLessonPlanBuilder /></TeacherRoute>} />
            <Route path="/giao-vien/ra-de-thi" element={<TeacherRoute><TeacherExamMaker /></TeacherRoute>} />
            <Route path="/giao-vien/ngan-hang-cau-hoi" element={<TeacherRoute><TeacherQuestionBank /></TeacherRoute>} />
            <Route path="/giao-vien/kiem-tra-danh-gia" element={<TeacherRoute><TeacherExamMaker /></TeacherRoute>} />
            <Route path="/giao-vien/tro-choi-lop-hoc" element={<TeacherRoute><ClassroomInteractiveGames /></TeacherRoute>} />
            <Route path="/tro-choi-hoc-tap" element={<ClassroomInteractiveGames />} />
            <Route path="/teacher/games" element={<TeacherRoute><ClassroomInteractiveGames /></TeacherRoute>} />
            <Route path="/giao-vien/danh-gia-tt22" element={<TeacherRoute><TeacherAssessmentTT22 /></TeacherRoute>} />
            <Route path="/giao-vien/quan-ly-to-chuyen-mon" element={<TeacherRoute><TeacherDepartmentManagement /></TeacherRoute>} />
            <Route path="/giao-vien/danh-gia-kpi-to-chuyen-mon" element={<TeacherRoute><TeacherKPIEvaluation /></TeacherRoute>} />
            <Route path="/teacher-dashboard/kpi-evaluation" element={<TeacherRoute><TeacherKPIEvaluation /></TeacherRoute>} />
            <Route path="/teacher-dashboard/app-hub" element={<TeacherRoute><AppHub /></TeacherRoute>} />
            <Route path="/teacher-dashboard/department-drive" element={<TeacherRoute><DepartmentDrive /></TeacherRoute>} />

            {/* Teacher Route Aliases */}
            <Route path="/teacher/lesson-plans" element={<TeacherRoute><TeacherLessonPlanBuilder /></TeacherRoute>} />
            <Route path="/teacher/exam-maker" element={<TeacherRoute><TeacherExamMaker /></TeacherRoute>} />
            <Route path="/teacher/question-bank" element={<TeacherRoute><TeacherQuestionBank /></TeacherRoute>} />
            <Route path="/teacher/assessment-tt22" element={<TeacherRoute><TeacherAssessmentTT22 /></TeacherRoute>} />
            <Route path="/teacher/academics" element={<TeacherRoute><TeacherAcademics /></TeacherRoute>} />
            <Route path="/teacher/homeroom" element={<TeacherRoute><TeacherHomeroomStudents /></TeacherRoute>} />
            <Route path="/teacher/funds" element={<TeacherRoute><TeacherFundsManager /></TeacherRoute>} />
            <Route path="/teacher/discipline" element={<TeacherRoute><TeacherDiscipline /></TeacherRoute>} />
            <Route path="/teacher/department" element={<TeacherRoute><TeacherDepartmentManagement /></TeacherRoute>} />
            <Route path="/teacher/kpi" element={<TeacherRoute><TeacherKPIEvaluation /></TeacherRoute>} />
            <Route path="/teacher-dashboard/class-journal" element={<TeacherRoute><ClassJournal /></TeacherRoute>} />
            <Route path="/teacher/class-journal" element={<TeacherRoute><ClassJournal /></TeacherRoute>} />
            <Route path="/teacher-dashboard/career-advisor" element={<TeacherRoute><StudentCareerAdvisor /></TeacherRoute>} />
            <Route path="/teacher/career-advisor" element={<TeacherRoute><StudentCareerAdvisor /></TeacherRoute>} />
            <Route path="/so-dau-bai-dien-tu" element={<ClassJournal />} />
            <Route path="/tu-van-to-hop-2-cong-2" element={<StudentRoute><StudentCareerAdvisor /></StudentRoute>} />
            <Route path="/tu-van-nghe-nghiep" element={<StudentRoute><StudentCareerAdvisor /></StudentRoute>} />
            
            {/* Public Educational Video & Hub */}
            <Route path="/hoc-lieu-so" element={<EduVideoHub />} />
            <Route path="/video-hoc-tap" element={<EduVideoHub />} />
            <Route path="/eduhub" element={<EduVideoHub />} />
            <Route path="/hoc-sinh/video-hoc-tap" element={<EduVideoHub />} />
            <Route path="/teacher-dashboard/eduhub" element={<EduVideoHub />} />
            <Route path="/teacher/eduhub" element={<EduVideoHub />} />
            <Route path="/hub" element={<AppHub />} />

            {/* Điểm Tâm Sáng CBQ (Tiếp Sức Học Đường) */}
            <Route path="/bep-sang" element={<CanteenOrderPage />} />
            <Route path="/cantin" element={<CanteenOrderPage />} />
            <Route path="/can-tin" element={<CanteenOrderPage />} />
            <Route path="/hoc-sinh/bep-sang" element={<CanteenOrderPage />} />
            <Route path="/quan-ly-bep-sang" element={<AdminCanteenManager />} />

            {/* Cổng Dịch Vụ Công Trực Tuyến & Zalo OA */}
            <Route path="/dich-vu-cong" element={<PublicServicesPortal />} />
            <Route path="/dvc" element={<PublicServicesPortal />} />
            <Route path="/dich-vu-cong-truc-tuyen" element={<PublicServicesPortal />} />

            {/* Hệ Thống Nhắn Tin Nội Bộ (CBQ Chat) */}
            <Route path="/chat" element={<InternalChatPage />} />
            <Route path="/tin-nhan" element={<InternalChatPage />} />
          </Route>
          
          {/* Protected Admin Routes */}
          {user ? (
            <>
              <Route path="/admin" element={(role === 'admin' || role === 'secretary') ? <Dashboard /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/committee" element={<CommitteeView />} />
              <Route path="/admin/dich-vu-cong" element={<AdminPublicServices />} />
              <Route path="/admin/dvc" element={<AdminPublicServices />} />
              <Route path="/admin/chat" element={<InternalChatPage />} />
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
              <Route path="/admin/links" element={(role === 'admin' || permissions.canViewLinks) ? <AdminLinks /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/department-drives" element={(role === 'admin' || role === 'secretary') ? <DepartmentDrive /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/app-hub" element={(role === 'admin' || role === 'secretary') ? <AppHub /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/registrations" element={(role === 'admin' || role === 'secretary') ? <AdminRegistrations /> : <Navigate to="/admin/committee" replace />} />
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
              <Route path="/admin/hom-thu-hoc-sinh" element={(role === 'admin' || role === 'secretary' || permissions.canViewFeedback || permissions.canViewStudents) ? <AdminStudentAspirations /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/diem-danh-hop-online" element={(role === 'admin' || role === 'secretary' || permissions.canViewDocs) ? <AdminMeetingAttendance /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/hop-online" element={<Navigate to="/admin/diem-danh-hop-online" replace />} />
              <Route path="/admin/truyen-lua-control" element={(role === 'admin' || role === 'secretary' || permissions.canViewPages) ? <AdminTorchControl /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/so-dau-bai" element={(role === 'admin' || role === 'secretary' || permissions.canViewStudents) ? <ClassJournal /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/class-journals" element={(role === 'admin' || role === 'secretary' || permissions.canViewStudents) ? <ClassJournal /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/career-advisor" element={(role === 'admin' || role === 'secretary' || permissions.canViewStudents) ? <StudentCareerAdvisor /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/eduhub" element={(role === 'admin' || role === 'secretary' || permissions.canViewDocs) ? <AdminEduVideos /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/video-hoc-lieu" element={(role === 'admin' || role === 'secretary' || permissions.canViewDocs) ? <AdminEduVideos /> : <Navigate to="/admin/committee" replace />} />
              <Route path="/admin/cantin" element={<AdminCanteenManager />} />
              <Route path="/admin/bep-sang" element={<AdminCanteenManager />} />
            </>
          ) : (
            <Route path="/admin/*" element={<Navigate to="/login" replace />} />
          )}

          {/* Fullscreen Stage LED Screen Route (Public Access for Stage Display) */}
          <Route path="/truyen-lua-led" element={<StageLedTorch />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <FacebookMessengerWidget />
      <PwaInstallPrompt />
    </ErrorBoundary>
  );
}

export default App;
