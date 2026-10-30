import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Calendar, BookOpen, User, GraduationCap, Briefcase, 
  ShieldCheck, LayoutDashboard, Sparkles, X, ChevronRight, 
  FileText, Award, Bike, Video, MessageSquare, LogOut, CheckSquare,
  Search, ShieldAlert, HeartHandshake, PhoneCall
} from 'lucide-react';
import { 
  getTeacherSession, 
  getStudentSession, 
  clearTeacherSession, 
  clearStudentSession 
} from '../services/authSessionManager';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(() => getTeacherSession());
  const [student, setStudent] = useState(() => getStudentSession());
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [showAuthChoiceModal, setShowAuthChoiceModal] = useState(false);

  useEffect(() => {
    const handleTeacherChange = (e) => setTeacher(e.detail);
    const handleStudentChange = (e) => setStudent(e.detail);

    window.addEventListener('cbq-teacher-auth-change', handleTeacherChange);
    window.addEventListener('cbq-student-auth-change', handleStudentChange);

    const handleOpenAuth = () => setShowAuthChoiceModal(true);
    window.addEventListener('cbq-open-auth-choice', handleOpenAuth);

    return () => {
      window.removeEventListener('cbq-teacher-auth-change', handleTeacherChange);
      window.removeEventListener('cbq-student-auth-change', handleStudentChange);
      window.removeEventListener('cbq-open-auth-choice', handleOpenAuth);
    };
  }, []);

  // Đóng drawer khi chuyển trang
  useEffect(() => {
    setShowMoreDrawer(false);
    setShowAuthChoiceModal(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Các nút bấm chính theo vai trò (Đúng 5 nút chuẩn Mobile Ergonomics)
  let mainNavItems = [];

  if (student) {
    mainNavItems = [
      { id: 'home', label: 'Trang chủ', path: '/', icon: Home },
      { id: 'schedule', label: 'TKB Lớp', path: '/lich-cong-tac?tab=class_tkb', icon: Calendar },
      { id: 'exam', label: 'Làm bài thi', path: '/hoc-sinh/kiem-tra-danh-gia', icon: CheckSquare },
      { id: 'utilities', label: 'Tiện ích', action: () => setShowMoreDrawer(true), icon: LayoutDashboard },
      { id: 'profile', label: 'Cổng Em', path: '/student-dashboard', icon: GraduationCap, badge: student.student_class || 'HS' }
    ];
  } else if (teacher) {
    mainNavItems = [
      { id: 'home', label: 'Trang chủ', path: '/', icon: Home },
      { id: 'schedule', label: 'Báo giảng', path: '/lich-cong-tac?tab=teacher_tkb', icon: Calendar },
      { id: 'exam_maker', label: 'Ra đề thi', path: '/giao-vien/ra-de-thi', icon: FileText },
      { id: 'utilities', label: 'Tiện ích', action: () => setShowMoreDrawer(true), icon: LayoutDashboard },
      { id: 'profile', label: 'Thầy/Cô', path: '/teacher-dashboard', icon: Briefcase, badge: 'GV' }
    ];
  } else {
    // Khách / Phụ huynh / Chưa đăng nhập
    mainNavItems = [
      { id: 'home', label: 'Trang chủ', path: '/', icon: Home },
      { id: 'schedule', label: 'Lịch & TKB', path: '/lich-cong-tac', icon: Calendar },
      { id: 'eduhub', label: 'Học liệu số', path: '/hoc-lieu-so', icon: Video },
      { id: 'utilities', label: 'Tiện ích', action: () => setShowMoreDrawer(true), icon: LayoutDashboard },
      { id: 'auth', label: 'Đăng nhập', action: () => setShowAuthChoiceModal(true), icon: User }
    ];
  }

  // Danh mục tiện ích nhanh cho Bottom Sheet - Phân quyền chuẩn xác theo vai trò
  const quickActions = student ? [
    { title: 'Điểm Tâm Sáng CBQ', path: '/bep-sang', icon: '🍳', desc: 'Đăng ký suất ăn sáng trước 06h30' },
    { title: 'Sổ Đầu Bài Lớp Em', path: '/hoc-sinh/so-dau-bai', icon: '📖', desc: 'Theo dõi tiến độ học tập và ghi sổ lớp' },
    { title: 'Phòng Thi GDPT 2018', path: '/hoc-sinh/kiem-tra-danh-gia', icon: '📝', desc: 'Làm bài kiểm tra & thi thử chuẩn cấu trúc mới' },
    { title: 'Điểm Danh Câu Lạc Bộ', path: '/admin/registrations', icon: '🎯', desc: 'Kiểm tra lịch sinh hoạt & điểm danh CLB' },
    { title: 'Hòm Thư Tâm Lý & DASS-21', path: '/hom-thu-hoc-sinh', icon: '💌', desc: 'Tư vấn tâm lý, gửi tâm tư bảo mật tới Thầy Cô' },
    { title: 'Đăng Ký & Vé Xe Máy HS', path: '/dang-ky-xe-may', icon: '🛵', desc: 'Quản lý vé xe và phương tiện của em' },
    { title: 'Tra Cứu Bằng Tốt Nghiệp & Học Bạ', path: '/tra-cuu-van-bang', icon: '📜', desc: 'Tra cứu văn bằng số và học bạ điện tử' },
    { title: 'Cố Vấn Tổ Hợp 2+2 & Ngành', path: '/hoc-sinh/tu-van-to-hop-2-cong-2', icon: '🧭', desc: 'Định hướng tổ hợp môn thi & nghề nghiệp' },
    { title: 'Trạm Video Kỹ Năng Số', path: '/hoc-lieu-so', icon: '📺', desc: 'Kho học liệu số, video thí nghiệm & kỹ năng' }
  ] : teacher ? [
    { title: 'Điểm Tâm Sáng CBQ', path: '/bep-sang', icon: '🍳', desc: 'Suất ăn tiếp sức Thầy Cô giáo' },
    { title: 'Ghi Sổ Đầu Bài Hôm Nay', path: '/hoc-sinh/so-dau-bai', icon: '📖', desc: 'Ký số và ghi nhận đánh giá tiết dạy' },
    { title: 'Kế Hoạch Bài Dạy (CV 5512)', path: '/admin/department-drives', icon: '📂', desc: 'Nộp và duyệt giáo án chuẩn chuyên môn' },
    { title: 'Ngân Hàng Đề Thi & Trộn Đề', path: '/giao-vien/ra-de-thi', icon: '✏️', desc: 'Hỗ trợ công thức LaTeX, tạo mã đề đa dạng' },
    { title: 'Ngân Hàng Câu Hỏi Tổ Chuyên Môn', path: '/giao-vien/ngan-hang-cau-hoi', icon: '🌳', desc: 'Quản lý cây thư mục Chương - Bài & bốc đề ma trận' },
    { title: 'Sổ Chấm Điểm Thi Đua Tuần', path: '/cham-diem-thi-dua', icon: '📋', desc: 'Đánh giá nề nếp thi đua 34 lớp học' },
    { title: 'Căn Chỉnh Nghị Định 30', path: '/can-chinh-nghi-dinh-30', icon: '📑', desc: 'Chuẩn hóa thể thức văn bản hành chính' },
    { title: 'Hồ Sơ Tổ Chuyên Môn', path: '/to-chuyen-mon', icon: '🌳', desc: 'Cây phân cấp 4 tầng & hoạt động chuyên môn' },
    { title: 'Quản Lý Điểm Danh CLB', path: '/admin/registrations', icon: '🎯', desc: 'Theo dõi học sinh đăng ký các câu lạc bộ' },
    { title: 'Quản Lý Xe Máy Học Sinh', path: '/admin/parking', icon: '🛵', desc: 'Duyệt vé xe và kiểm tra phương tiện học sinh' }
  ] : [
    { title: 'Điểm Tâm Sáng CBQ', path: '/bep-sang', icon: '🍳', desc: 'Chương trình điểm tâm sáng học đường' },
    { title: 'Tra Cứu Bằng Tốt Nghiệp & Học Bạ', path: '/tra-cuu-van-bang', icon: '📜', desc: 'Bằng tốt nghiệp THPT & học bạ điện tử' },
    { title: 'Lịch Công Tác BGH Nhà Trường', path: '/lich-cong-tac', icon: '📅', desc: 'Lịch tuần, kế hoạch tháng & năm học chính thức' },
    { title: 'Sổ Chấm Điểm Thi Đua 34 Lớp', path: '/cham-diem-thi-dua', icon: '📋', desc: 'Bảng xếp hạng nề nếp thi đua các lớp' },
    { title: 'Hòm Thư Đóng Góp Ý Kiến', path: '/hom-thu-hoc-sinh', icon: '💌', desc: 'Tiếp nhận phản ánh, đóng góp xây dựng trường' },
    { title: 'Đội Ngũ Cán Bộ & 8 Tổ Chuyên Môn', path: '/to-chuyen-mon', icon: '👨‍🏫', desc: 'Danh mục Hội đồng Sư phạm nhà trường' },
    { title: 'Tin Tức & Sự Kiện Nổi Bật', path: '/tin-tuc', icon: '📰', desc: 'Hoạt động giáo dục và phong trào nhà trường' },
    { title: 'Thư Viện Ảnh Nhà Trường', path: '/thu-vien-anh', icon: '📸', desc: 'Hình ảnh hoạt động, kỷ niệm và sự kiện' },
    { title: 'Đăng Ký Xe Máy Học Sinh', path: '/dang-ky-xe-may', icon: '🛵', desc: 'Thủ tục đăng ký gửi xe dành cho phụ huynh' }
  ];

  return (
    <>
      {/* 1. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY MÀN HÌNH (MOBILE NATIVE BOTTOM BAR) */}
      <nav 
        className="cbq-mobile-bottom-nav" 
        aria-label="Mobile Navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxSizing: 'border-box'
        }}
      >
        {mainNavItems.map(item => {
          const Icon = item.icon;
          const active = item.path ? isActive(item.path) : false;

          const buttonContent = (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              gap: '3px',
              position: 'relative'
            }}>
              {/* Active Indicator Bar on top */}
              {active && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  width: '24px',
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: '#047857'
                }} />
              )}

              <div style={{ position: 'relative' }}>
                <Icon 
                  size={21} 
                  color={active ? '#047857' : '#64748b'} 
                  strokeWidth={active ? 2.4 : 1.8} 
                />
                {item.badge && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    backgroundColor: '#e11d48',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: '900',
                    padding: '1px 4px',
                    borderRadius: '8px',
                    lineHeight: 1
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>

              <span style={{
                fontSize: '10.5px',
                fontWeight: active ? '800' : '600',
                color: active ? '#047857' : '#64748b',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px'
              }}>
                {item.label}
              </span>
            </div>
          );

          if (item.action) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                style={{
                  background: 'none',
                  border: 'none',
                  flex: 1,
                  height: '100%',
                  padding: '6px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {buttonContent}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              style={{
                textDecoration: 'none',
                flex: 1,
                height: '100%',
                padding: '6px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {buttonContent}
            </Link>
          );
        })}
      </nav>

      {/* 2. BOTTOM SHEET ACTION DRAWER (KHÁM PHÁ TIỆN ÍCH DÀNH CHO MOBILE) */}
      {showMoreDrawer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* Vùng bấm ra ngoài để đóng */}
          <div style={{ flex: 1 }} onClick={() => setShowMoreDrawer(false)} />

          {/* Hộp Bottom Sheet kéo lên */}
          <div style={{
            backgroundColor: '#ffffff',
            borderTopLeftRadius: '22px',
            borderTopRightRadius: '22px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '16px 20px 32px 20px',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            {/* Thanh gạt vuốt ngang tiêu chuẩn */}
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: '#cbd5e1',
              margin: '0 auto 14px auto'
            }} />

            {/* Header Drawer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
                  TRUNG TÂM TIỆN ÍCH HỌC ĐƯỜNG 4.0
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Trường THPT Cao Bá Quát • Tra cứu & Thao tác 1 chạm
                </p>
              </div>
              <button 
                onClick={() => setShowMoreDrawer(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nút Cài đặt App Điện thoại */}
            <div 
              onClick={() => {
                setShowMoreDrawer(false);
                window.dispatchEvent(new CustomEvent('cbq-open-pwa-install'));
              }}
              style={{
                backgroundColor: '#fff1f2',
                border: '1.5px dashed #f43f5e',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>📲</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#be123c' }}>
                    Cài Đặt App THPT Cao Bá Quát
                  </div>
                  <div style={{ fontSize: '11px', color: '#881337' }}>
                    Thêm vào màn hình chính, mở toàn màn hình
                  </div>
                </div>
              </div>
              <button 
                type="button"
                style={{
                  backgroundColor: '#be123c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cài Đặt
              </button>
            </div>

            {/* Trạng thái đăng nhập nhanh */}
            {(student || teacher) && (
              <div style={{
                backgroundColor: student ? '#f0f9ff' : '#f0fdf4',
                border: `1px solid ${student ? '#bae6fd' : '#bbf7d0'}`,
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: student ? '#0284c7' : '#16a34a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}>
                    {student ? 'HS' : 'GV'}
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: student ? '#0369a1' : '#15803d' }}>
                      {student ? student.full_name : teacher.name || teacher.full_name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {student ? `Lớp ${student.student_class} • Khối ${student.grade_level}` : `${teacher.title || 'Giáo viên'} • ${teacher.department || 'CBQ'}`}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm("Thầy/Cô hoặc Em có muốn đăng xuất tài khoản?")) {
                      if (student) clearStudentSession();
                      if (teacher) clearTeacherSession();
                      setShowMoreDrawer(false);
                    }
                  }}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={13} /> Thoát
                </button>
              </div>
            )}

            {/* Danh sách 8 tiện ích 1 chạm */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {quickActions.map(act => (
                <Link
                  key={act.path}
                  to={act.path}
                  onClick={() => setShowMoreDrawer(false)}
                  style={{
                    textDecoration: 'none',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{act.icon}</span>
                  <strong style={{ fontSize: '12.5px', color: '#0f172a', lineHeight: 1.3 }}>{act.title}</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.3 }}>{act.desc}</span>
                </Link>
              ))}
            </div>

            {/* Các cổng chuyên biệt */}
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                Cổng Không Gian Số Chuyên Biệt
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                <Link 
                  to="/dang-nhap-hoc-sinh" 
                  onClick={() => setShowMoreDrawer(false)}
                  style={{
                    padding: '10px 8px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '10px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: '#0369a1',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <GraduationCap size={18} color="#0284c7" />
                  <span>Cổng Học Sinh</span>
                </Link>

                <Link 
                  to="/dang-nhap-giao-vien" 
                  onClick={() => setShowMoreDrawer(false)}
                  style={{
                    padding: '10px 8px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: '#15803d',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Briefcase size={18} color="#16a34a" />
                  <span>Cổng Giáo Viên</span>
                </Link>

                <Link 
                  to="/admin" 
                  onClick={() => setShowMoreDrawer(false)}
                  style={{
                    padding: '10px 8px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: '#b45309',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={18} color="#d97706" />
                  <span>Ban Giám Hiệu</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL CHỌN ĐĂNG NHẬP NHANH CHO KHÁCH */}
      {showAuthChoiceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '360px',
            padding: '22px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowAuthChoiceModal(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                ĐĂNG NHẬP HỆ THỐNG
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Chọn đúng vai trò của bạn để truy cập không gian số
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to="/dang-nhap-hoc-sinh"
                onClick={() => setShowAuthChoiceModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#0369a1'
                }}
              >
                <div style={{ backgroundColor: '#0284c7', color: '#ffffff', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800' }}>Cổng Học Sinh</div>
                  <div style={{ fontSize: '11.5px', color: '#0284c7' }}>Làm bài thi, tra cứu TKB & học bạ</div>
                </div>
              </Link>

              <Link
                to="/dang-nhap-giao-vien"
                onClick={() => setShowAuthChoiceModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#15803d'
                }}
              >
                <div style={{ backgroundColor: '#16a34a', color: '#ffffff', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800' }}>Cổng Thầy Cô Giáo Viên</div>
                  <div style={{ fontSize: '11.5px', color: '#16a34a' }}>Ra đề thi LaTeX, giáo án 5512, sổ đầu bài</div>
                </div>
              </Link>

              <Link
                to="/admin"
                onClick={() => setShowAuthChoiceModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#b45309'
                }}
              >
                <div style={{ backgroundColor: '#d97706', color: '#ffffff', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800' }}>Ban Giám Hiệu & Quản Trị</div>
                  <div style={{ fontSize: '11.5px', color: '#b45309' }}>Báo cáo điều hành ngày & phân cấp tổ</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
