import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GraduationCap, Briefcase, ShieldCheck, Activity, Clock, Sparkles, Cpu, Layers, Radio, Globe, Wifi, CheckCircle2, User, ExternalLink, Link2 } from 'lucide-react';
import ChatbotWidget from './ChatbotWidget';
import MobileBottomNav from './MobileBottomNav';
import ErrorBoundary from './ErrorBoundary';
import { getTeacherSession, clearTeacherSession, getStudentSession, clearStudentSession } from '../services/authSessionManager';

const DEFAULT_FULL_MENUS = [
  // Nhóm 1: Vận hành nhà trường (school)
  { id: 'm_sc_1', target_type: 'public', parent_group: 'school', label: '👨‍🏫 Đội ngũ & Tổ chuyên môn', path: '/to-chuyen-mon', sort_order: 1, is_active: true },
  { id: 'm_sc_canteen', target_type: 'public', parent_group: 'school', label: '🍳 Điểm Tâm Sáng CBQ (Tiếp Sức Học Đường)', path: '/bep-sang', sort_order: 2, is_active: true },
  { id: 'm_sc_2', target_type: 'public', parent_group: 'school', label: '🛵 Đăng ký Xe máy Học sinh', path: '/dang-ky-xe-may', sort_order: 3, is_active: false },
  { id: 'm_sc_3', target_type: 'public', parent_group: 'school', label: '📝 Đăng ký Hoạt động / Sự kiện', path: '/dang-ky-hoat-dong', sort_order: 3, is_active: false },
  { id: 'm_sc_4', target_type: 'public', parent_group: 'school', label: '📋 Sổ Chấm điểm Thi đua Trực tuần', path: '/cham-diem-thi-dua', sort_order: 4, is_active: true },
  { id: 'm_sc_5', target_type: 'public', parent_group: 'school', label: '📜 Văn bản - Thông báo', path: '/van-ban', sort_order: 5, is_active: true },
  { id: 'm_sc_6', target_type: 'public', parent_group: 'school', label: '✍️ Góp ý Công việc & Đề án', path: '/gop-y', sort_order: 6, is_active: true },
  { id: 'm_sc_7', target_type: 'public', parent_group: 'school', label: '💌 Hòm Thư Học Sinh & Tâm Tư', path: '/hom-thu-hoc-sinh', sort_order: 7, is_active: true },
  { id: 'm_sc_8', target_type: 'public', parent_group: 'school', label: '💻 Điểm Danh Họp Trực Tuyến', path: '/hop-online', sort_order: 8, is_active: false },
  { id: 'm_sc_9', target_type: 'public', parent_group: 'school', label: '📜 Tra Cứu Văn Bằng Số Học Sinh', path: '/tra-cuu-van-bang', sort_order: 9, is_active: true },

  // Nhóm 2: Tin tức & Hoạt động (media)
  { id: 'm_md_1', target_type: 'public', parent_group: 'media', label: '📰 Tin tức - Sự kiện', path: '/tin-tuc', sort_order: 1, is_active: true },
  { id: 'm_md_2', target_type: 'public', parent_group: 'media', label: '📸 Thư viện ảnh nhà trường', path: '/thu-vien-anh', sort_order: 2, is_active: true },
  { id: 'm_md_3_sports', target_type: 'public', parent_group: 'media', label: '⚽ Đăng ký thi đấu thể thao', path: '/dang-ky-the-thao', sort_order: 3, is_active: true },
  { id: 'm_md_3', target_type: 'public', parent_group: 'media', label: '🎖️ Bảng vàng tài trợ & vinh danh', path: '/bang-vang', sort_order: 4, is_active: false },
  { id: 'm_md_4', target_type: 'public', parent_group: 'media', label: '📺 Trạm Video & Học Liệu Số 4.0', path: '/hoc-lieu-so', sort_order: 5, is_active: true },
  { id: 'm_md_5', target_type: 'public', parent_group: 'media', label: '💖 Sổ lưu bút kỷ niệm', path: '/luu-but', sort_order: 6, is_active: false },

  // Nhóm 3: Tư liệu 30 năm (anniversary)
  { id: 'm_an_1', target_type: 'public', parent_group: 'anniversary', label: 'ℹ️ Giới thiệu lịch sử 30 năm', path: '/gioi-thieu', sort_order: 1, is_active: true },
  { id: 'm_an_2', target_type: 'public', parent_group: 'anniversary', label: '📖 Tập san 30 năm 3D', path: '/tap-san', sort_order: 2, is_active: true },
  { id: 'm_an_3', target_type: 'public', parent_group: 'anniversary', label: '📘 Cẩm nang hướng dẫn', path: '/huong-dan', sort_order: 3, is_active: true },
  { id: 'm_an_4', target_type: 'public', parent_group: 'anniversary', label: '🏆 Cuộc thi tìm hiểu 30 năm', path: '/cuoc-thi', sort_order: 4, is_active: true },
  { id: 'm_an_6', target_type: 'public', parent_group: 'anniversary', label: '🗳️ Bình chọn tác phẩm', path: '/binh-chon', sort_order: 5, is_active: true },
  { id: 'm_an_7', target_type: 'public', parent_group: 'anniversary', label: '📤 Nộp bài thi sáng tạo', path: '/nop-bai-thi', sort_order: 6, is_active: true }
];

export default function PublicLayout() {
  const location = useLocation();
  const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString('vi-VN'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [publicMenus, setPublicMenus] = useState(DEFAULT_FULL_MENUS);
  const [loggedTeacher, setLoggedTeacher] = useState(() => getTeacherSession());
  const [loggedStudent, setLoggedStudent] = useState(() => getStudentSession());
  const [externalLinks, setExternalLinks] = useState([]);

  useEffect(() => {
    async function fetchExternalLinks() {
      try {
        const { data, error } = await supabase
          .from('cbq_external_links')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });
        if (!error && Array.isArray(data)) {
          setExternalLinks(data.filter(l => l && (!l.type || l.type === 'public')));
        }
      } catch (e) {
        console.warn("Lỗi tải liên kết ngoài:", e);
      }
    }
    fetchExternalLinks();
  }, []);

  useEffect(() => {
    const handleTeacherChange = (e) => setLoggedTeacher(e.detail);
    const handleStudentChange = (e) => setLoggedStudent(e.detail);
    window.addEventListener('cbq-teacher-auth-change', handleTeacherChange);
    window.addEventListener('cbq-student-auth-change', handleStudentChange);
    return () => {
      window.removeEventListener('cbq-teacher-auth-change', handleTeacherChange);
      window.removeEventListener('cbq-student-auth-change', handleStudentChange);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  // Close dropdown and mobile drawer when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      try {
        if (!e?.target) return;
        const targetEl = e.target instanceof Element ? e.target : e.target.parentElement;
        if (!targetEl || typeof targetEl.closest !== 'function') return;

        if (!targetEl.closest('.cbq-navbar')) {
          setActiveDropdown(null);
          setMobileMenuOpen(false);
        } else if (!targetEl.closest('.nav-dropdown')) {
          setActiveDropdown(null);
        }
      } catch (_) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    fetchPublicMenus();
  }, [location.pathname]);

  async function fetchPublicMenus(force = false) {
    try {
      if (!force) {
        const cached = localStorage.getItem('cbq_menus_public_v2') || localStorage.getItem('cbq_menus_public');
        if (cached) {
          let parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Tự động bổ sung Điểm Tâm Sáng CBQ nếu cache cũ chưa có
            if (!parsed.some(m => (m?.path || '').includes('bep-sang') || (m?.path || '').includes('cantin'))) {
              parsed.splice(1, 0, { id: 'm_sc_canteen', target_type: 'public', parent_group: 'school', label: '🍳 Điểm Tâm Sáng CBQ (Tiếp Sức Học Đường)', path: '/bep-sang', sort_order: 2, is_active: true });
              try {
                localStorage.setItem('cbq_menus_public_v2', JSON.stringify(parsed));
                localStorage.setItem('cbq_menus_public', JSON.stringify(parsed));
              } catch (_) {}
            }
            setPublicMenus(parsed);
          }
        }
      }

      const { data, error } = await supabase
        .from('cbq_navigation_menus')
        .select('*')
        .eq('target_type', 'public')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        let menuData = [...data];
        if (!menuData.some(m => (m?.path || '').includes('bep-sang') || (m?.path || '').includes('cantin'))) {
          menuData.splice(1, 0, { id: 'm_sc_canteen', target_type: 'public', parent_group: 'school', label: '🍳 Điểm Tâm Sáng CBQ (Tiếp Sức Học Đường)', path: '/bep-sang', sort_order: 2, is_active: true });
        }
        setPublicMenus(menuData);
        localStorage.setItem('cbq_menus_public_v2', JSON.stringify(menuData));
        localStorage.setItem('cbq_menus_public', JSON.stringify(menuData));
      }
    } catch (err) {
      console.warn("Dùng menu công khai mặc định:", err);
    }
  }

  // Lắng nghe sự kiện đồng bộ menu từ tab Admin hoặc cửa sổ khác
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cbq_menus_public_v2' || e.key === 'cbq_menus_public') {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPublicMenus(parsed);
            }
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Menu đã được tự động đồng bộ khi chuyển trang (location.pathname) và qua storage event
  // Không cần mở 1.500 kết nối WebSocket thường trực vào Supabase Realtime để tiết kiệm tài nguyên kết nối

  const safeMenus = Array.isArray(publicMenus) && publicMenus.length > 0 ? publicMenus : DEFAULT_FULL_MENUS;

  const isGroupActive = (groupName) => {
    return safeMenus
      .filter(m => (m?.parent_group === groupName || (!m?.parent_group && groupName === 'school')) && m?.is_active === true)
      .some(m => isActive(m?.path));
  };

  return (
    <div style={styles.portalContainer}>
      {/* 0. NATIVE MOBILE COMPACT APP TOPBAR (<= 960px ONLY) */}
      <header className="cbq-mobile-topbar show-on-mobile" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: '56px',
        backgroundColor: '#064e3b',
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
        borderBottom: '1.5px solid #10b981',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}>
        {/* Left: School Identity */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img 
            src="/logo.jpg" 
            alt="THPT Cao Bá Quát" 
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              objectFit: 'contain', 
              backgroundColor: '#ffffff',
              padding: '2px',
              border: '1px solid #34d399',
              flexShrink: 0
            }} 
          />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.3px', lineHeight: 1.15 }}>
              THPT CAO BÁ QUÁT
            </div>
            <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: '700', letterSpacing: '0.2px' }}>
              Cổng Thông Tin Số 4.0
            </div>
          </div>
        </Link>

        {/* Right: Active Role Portal Button */}
        <div>
          {loggedStudent ? (
            <Link 
              to="/student-dashboard" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '6px 12px', 
                backgroundColor: '#0284c7', 
                color: '#ffffff', 
                borderRadius: '16px', 
                fontSize: '11.5px', 
                fontWeight: 'bold', 
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)'
              }}
            >
              <GraduationCap size={13} /> {loggedStudent.full_name?.split(' ').slice(-1)[0] || 'HS'} ({loggedStudent.student_class || 'Lớp'})
            </Link>
          ) : loggedTeacher ? (
            <Link 
              to="/teacher-dashboard" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '6px 12px', 
                backgroundColor: '#15803d', 
                color: '#ffffff', 
                borderRadius: '16px', 
                fontSize: '11.5px', 
                fontWeight: 'bold', 
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.35)'
              }}
            >
              <Briefcase size={13} /> {loggedTeacher.full_name?.split(' ').slice(-1)[0] || loggedTeacher.name?.split(' ').slice(-1)[0] || 'Thầy/Cô'}
            </Link>
          ) : (
            <button 
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('cbq-open-auth-choice'))}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '6px 12px', 
                background: 'linear-gradient(135deg, #0284c7, #0369a1)', 
                color: '#ffffff', 
                border: '1px solid rgba(255, 255, 255, 0.3)', 
                borderRadius: '18px', 
                fontSize: '11.5px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              <User size={13} /> Đăng Nhập
            </button>
          )}
        </div>
      </header>

      {/* 1. Desktop School Header Banner */}
      <header style={styles.banner} className="hide-on-mobile">
        <div style={styles.bannerOverlay}>
          <div className="portal-banner-content" style={styles.bannerInner}>
            
            {/* Left: School Identity & Logo */}
            <div style={styles.bannerLeft} className="cbq-banner-left">
              <div className="cyber-logo-frame">
                <img src="/logo.jpg" alt="THPT Cao Bá Quát Logo" style={styles.mainLogo} className="cbq-logo-img" />
              </div>

              <div style={styles.bannerTextCol} className="cbq-banner-text">
                <div style={styles.superBadgeRow} className="cbq-badge-row">
                  <span style={styles.superBadge}>
                    <Cpu size={12} color="#38bdf8" /> SỞ GD&ĐT ĐẮK LẮK
                  </span>
                  <span style={styles.superBadgeGold}>
                    ✦ 30 NĂM PHÁT TRIỂN (1996 - 2026) ✦
                  </span>
                </div>

                <h1 style={styles.bannerTitle} className="cbq-banner-title">
                  TRƯỜNG THPT CAO BÁ QUÁT
                </h1>

                <h2 style={styles.bannerSubtitle} className="cbq-banner-sub">
                  CỔNG THÔNG TIN ĐIỆN TỬ & TRANG CHỦ NHÀ TRƯỜNG
                </h2>

                <div style={styles.taglinePill} className="cbq-tagline">
                  <Sparkles size={13} color="#fde047" />
                  <span>Kỷ Nguyên Chuyển Đổi Số Giáo Dục Toàn Diện • Thông Tin Chính Thức 24/7</span>
                </div>
              </div>
            </div>

            {/* Right: Telemetry & Live Status Box */}
            <div style={styles.bannerRight} className="cbq-banner-right">
              <div className="cyber-clock-box">
                <Clock size={16} color="#67e8f9" />
                <span className="cyber-clock-digits">{liveTime}</span>
              </div>

              <div style={styles.hudBadgeGroup} className="cbq-hud-group">
                <div className="cyber-badge-live">
                  <span className="cyber-beacon-dot"></span>
                  <span>TRỰC TUYẾN 24/7</span>
                </div>
                
                <div style={styles.hudMiniStats} className="cbq-hud-stats">
                  <div style={styles.hudStatItem}>
                    <span style={styles.hudStatNum}>34</span>
                    <span style={styles.hudStatLabel}>Lớp Số Hóa</span>
                  </div>
                  <div style={styles.hudStatDivider} />
                  <div style={styles.hudStatItem}>
                    <span style={styles.hudStatNum}>982</span>
                    <span style={styles.hudStatLabel}>Tiết TKB/Tuần</span>
                  </div>
                  <div style={styles.hudStatDivider} />
                  <div style={styles.hudStatItem}>
                    <span style={styles.hudStatNum}>100%</span>
                    <span style={styles.hudStatLabel}>Đồng Bộ Cloud</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Navigation Bar (Desktop) */}
      <nav style={styles.navbar} className="cbq-navbar hide-on-mobile">
        <div style={styles.navContainer} className="cbq-nav-container">
          {/* Mobile Top Bar inside Nav: Hamburger Button + Quick Portals */}
          <div className="mobile-nav-header">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <span style={{ fontSize: '16px' }}>{mobileMenuOpen ? '✖' : '☰'}</span>
              <span>{mobileMenuOpen ? 'Đóng' : 'Menu'}</span>
            </button>

            {/* Mobile Compact Portals */}
            <div className="mobile-portal-quick-btns">
              <Link to="/dang-nhap-hoc-sinh" className="premium-nav-btn student compact-btn" title="Cổng Học Sinh">
                <GraduationCap size={13} /> HS
              </Link>
              <Link to="/dang-nhap-giao-vien" className="premium-nav-btn teacher compact-btn" title="Cổng Giáo Viên">
                <Briefcase size={13} /> GV
              </Link>
              <Link to="/admin" className="premium-nav-btn admin compact-btn" title="Trang Quản Lý (Admin)">
                <ShieldCheck size={13} /> Quản Trị
              </Link>
            </div>
          </div>

          {/* Desktop & Mobile Menu Links */}
          <div className={`portal-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link to="/" style={isActive('/') ? styles.navItemActive : styles.navItem} onClick={() => setMobileMenuOpen(false)}>
              🏠 Trang Chủ
            </Link>
            
            {/* MENU ĐỘC LẬP: THỜI KHÓA BIỂU & LỊCH TUẦN */}
            <Link 
              to="/lich-cong-tac" 
              style={{
                ...(isActive('/lich-cong-tac') ? styles.navItemHighlightActive : styles.navItemHighlight),
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              📅 Lịch & TKB
            </Link>

            {/* MENU ĐỘC LẬP: ĐIỂM TÂM SÁNG CBQ - TIẾP SỨC HỌC ĐƯỜNG */}
            <Link 
              to="/bep-sang" 
              style={{
                ...(isActive('/bep-sang') || isActive('/cantin') ? styles.navItemHighlightActive : {
                  ...styles.navItem,
                  color: '#fef08a',
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(249, 115, 22, 0.25))',
                  border: '1px solid rgba(253, 224, 71, 0.4)',
                  borderRadius: '6px',
                  margin: '2px 3px',
                  padding: '6px 9px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }),
              }}
              onClick={() => setMobileMenuOpen(false)}
              title="Điểm Tâm Sáng CBQ - Tiếp sức học đường (Đăng ký trước 06h30)"
            >
              <span>🍳 Điểm Tâm Sáng</span>
              <span style={{
                fontSize: '9px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '1px 5px',
                borderRadius: '6px',
                fontWeight: '900',
                letterSpacing: '0.3px',
                lineHeight: 1.1
              }}>MỚI</span>
            </Link>

            {/* MENU ĐỘC LẬP: TRẠM HỌC LIỆU SỐ & VIDEO (Ưu tiên hiển thị màn hình rộng) */}
            {safeMenus.some(m => (m?.path === '/hoc-lieu-so' || m?.path === '/video-hoc-tap') && m?.is_active === true) && (
              <Link 
                to="/hoc-lieu-so" 
                className="nav-wide-only"
                style={{
                  ...(isActive('/hoc-lieu-so') || isActive('/video-hoc-tap') ? styles.navItemActive : styles.navItem),
                  fontWeight: '700'
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                📺 Học Liệu Số
              </Link>
            )}
            
            {/* DROPDOWN 1: QUẢN LÝ VẬN HÀNH NHÀ TRƯỜNG */}
            {safeMenus.some(m => (m?.parent_group === 'school' || !m?.parent_group) && m?.is_active === true) && (
              <div className={`nav-dropdown ${activeDropdown === 'school' ? 'active-touch' : ''}`}>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('school');
                  }}
                  style={isGroupActive('school') ? styles.navItemActive : styles.navItem}
                >
                  🏫 Vận Hành {activeDropdown === 'school' ? '▴' : '▾'}
                </span>
                <div className="nav-dropdown-content" style={styles.dropdownContent}>
                  {safeMenus
                    .filter(m => (m?.parent_group === 'school' || !m?.parent_group) && m?.is_active === true && !m?.path?.includes('bep-sang') && !m?.path?.includes('cantin'))
                    .sort((a, b) => (Number(a?.sort_order) || 0) - (Number(b?.sort_order) || 0))
                    .map(m => (
                      <Link 
                        key={m.id || m.path} 
                        to={m.path} 
                        className="nav-dropdown-item" 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setActiveDropdown(null);
                        }}
                      >
                        {m.label}
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* DROPDOWN 2: TIN TỨC & HOẠT ĐỘNG MEDIA */}
            {safeMenus.some(m => m?.parent_group === 'media' && m?.is_active === true) && (
              <div className={`nav-dropdown ${activeDropdown === 'media' ? 'active-touch' : ''}`}>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('media');
                  }}
                  style={isGroupActive('media') ? styles.navItemActive : styles.navItem}
                >
                  📰 Hoạt Động {activeDropdown === 'media' ? '▴' : '▾'}
                </span>
                <div className="nav-dropdown-content" style={styles.dropdownContent}>
                  {safeMenus
                    .filter(m => m?.parent_group === 'media' && m?.is_active === true)
                    .sort((a, b) => (Number(a?.sort_order) || 0) - (Number(b?.sort_order) || 0))
                    .map(m => (
                      <Link 
                        key={m.id || m.path} 
                        to={m.path} 
                        className="nav-dropdown-item" 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setActiveDropdown(null);
                        }}
                      >
                        {m.label}
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* DROPDOWN 3: ĐẠI LỄ KỶ NIỆM 30 NĂM (TƯ LIỆU) - CĂN PHẢI TRÁNH TRÀN */}
            {safeMenus.some(m => m?.parent_group === 'anniversary' && m?.is_active === true) && (
              <div className={`nav-dropdown align-right ${activeDropdown === 'anniversary' ? 'active-touch' : ''}`}>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('anniversary');
                  }}
                  style={isGroupActive('anniversary') ? styles.navItemActive : styles.navItem}
                >
                  🎉 Kỷ Niệm 30 Năm {activeDropdown === 'anniversary' ? '▴' : '▾'}
                </span>
                <div className="nav-dropdown-content" style={styles.dropdownContent}>
                  {safeMenus
                    .filter(m => m?.parent_group === 'anniversary' && m?.is_active === true)
                    .sort((a, b) => (Number(a?.sort_order) || 0) - (Number(b?.sort_order) || 0))
                    .map(m => (
                      <Link 
                        key={m.id || m.path} 
                        to={m.path} 
                        className="nav-dropdown-item" 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setActiveDropdown(null);
                        }}
                      >
                        {m.label}
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* DROPDOWN 4: CÁC TRANG LIÊN KẾT NGOÀI - CĂN PHẢI TRÁNH TRÀN */}
            {externalLinks && externalLinks.length > 0 && (
              <div className={`nav-dropdown align-right ${activeDropdown === 'links' ? 'active-touch' : ''}`}>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('links');
                  }}
                  style={activeDropdown === 'links' ? styles.navItemActive : styles.navItem}
                  title="Các cổng thông tin và trang web liên kết"
                >
                  🔗 Liên Kết {activeDropdown === 'links' ? '▴' : '▾'}
                </span>
                <div className="nav-dropdown-content" style={styles.dropdownContent}>
                  {externalLinks.filter(l => l && l.url).map((link, idx) => (
                    <a 
                      key={link.id || link.url || idx} 
                      href={link.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="nav-dropdown-item" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setActiveDropdown(null);
                      }}
                    >
                      <span>{link.title || link.url}</span>
                      <ExternalLink size={12} style={{ opacity: 0.6 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* In mobile drawer: show large login cards */}
            <div className="mobile-drawer-portals">
              <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Cổng Không Gian Số Chuyên Biệt (Yêu Cầu Đăng Nhập)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <Link to="/dang-nhap-hoc-sinh" className="premium-nav-btn student" style={{ justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                  <GraduationCap size={15} /> Học Sinh
                </Link>
                <Link to="/dang-nhap-giao-vien" className="premium-nav-btn teacher" style={{ justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                  <Briefcase size={15} /> Giáo Viên
                </Link>
                <Link to="/admin" className="premium-nav-btn admin" style={{ justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                  <ShieldCheck size={15} /> Quản Trị
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop Quick Access Portals with Auto Session Detection */}
          <div className="desktop-portal-btns" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {loggedStudent ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderRadius: '10px', padding: '3px 8px', gap: '5px', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)' }}>
                <Link to="/student-dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '11.5px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <GraduationCap size={13} />
                  <span style={{ maxWidth: '95px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {loggedStudent.full_name || 'Học Sinh'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Em có muốn đăng xuất khỏi Cổng Học Sinh?")) {
                      clearStudentSession();
                    }
                  }}
                  title="Đăng xuất tài khoản học sinh khỏi máy này"
                  style={{ background: 'rgba(0,0,0,0.25)', border: 'none', color: '#f0f9ff', borderRadius: '6px', cursor: 'pointer', padding: '1px 5px', fontSize: '11px', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <Link to="/dang-nhap-hoc-sinh" className="premium-nav-btn student" title="Cổng Không Gian Số Học Sinh">
                <GraduationCap size={13} /> Học Sinh
              </Link>
            )}

            {loggedTeacher ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: '10px', padding: '3px 8px', gap: '5px', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)' }}>
                <Link to="/teacher-dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '11.5px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={13} />
                  <span style={{ maxWidth: '95px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {loggedTeacher.full_name || loggedTeacher.name || 'Giáo Viên'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Thầy/Cô ${loggedTeacher.full_name || loggedTeacher.name || ''} có muốn đăng xuất khỏi Cổng Giáo Viên?`)) {
                      clearTeacherSession();
                    }
                  }}
                  title="Đăng xuất tài khoản giáo viên khỏi máy này"
                  style={{ background: 'rgba(0,0,0,0.25)', border: 'none', color: '#f0fdf4', borderRadius: '6px', cursor: 'pointer', padding: '1px 5px', fontSize: '11px', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <Link to="/dang-nhap-giao-vien" className="premium-nav-btn teacher" title="Cổng Không Gian Số Giáo Viên">
                <Briefcase size={13} /> Giáo Viên
              </Link>
            )}

            <Link to="/admin" className="premium-nav-btn admin" title="Trang Quản Lý & Bảng Điều Khiển Nhà Trường">
              <ShieldCheck size={13} /> Quản Trị
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Bright High-Contrast Ticker & Status Bar (Desktop) */}
      <div style={styles.topBar} className="cbq-topbar hide-on-mobile">
        <div style={styles.dateInfo} className="cbq-date-info">
          <Radio size={14} color="#15803d" style={{ animation: 'beacon-pulse 2s infinite' }} />
          <span>{currentDate}</span>
        </div>
        <div style={styles.marqueeWrapper}>
          <marquee style={styles.marqueeText} scrollamount="5">
            🚀 CHÀO MỪNG ĐẾN VỚI TRUNG TÂM KHÔNG GIAN SỐ & ĐIỀU HÀNH THÔNG MINH TRƯỜNG THPT CAO BÁ QUÁT • KÊNH THÔNG TIN VẬN HÀNH CHUYÊN MÔN, THỜI KHÓA BIỂU, THI ĐUA NỀ NẾP VÀ DỊCH VỤ GIÁO DỤC SỐ DÀNH CHO GIÁO VIÊN, HỌC SINH VÀ PHỤ HUYNH • HOẠT ĐỘNG 24/7 ✦
          </marquee>
        </div>
      </div>

      {/* Main Content Rendered Here */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 12px 60px 12px' }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      
      {/* 5. Chân trang Cổng Thông Tin Toàn Trường (School Portal Footer) */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        marginTop: '40px',
        borderTop: '4px solid #16a34a',
        padding: '40px 16px 30px 16px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Cột 1: Thông tin trường */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <img src="/logo.jpg" alt="Logo THPT Cao Bá Quát" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #22c55e', objectFit: 'cover' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.3px' }}>TRƯỜNG THPT CAO BÁ QUÁT</h3>
                <small style={{ color: '#86efac', fontSize: '11px', fontWeight: '600' }}>HỆ THỐNG ĐIỀU HÀNH & KHÔNG GIAN SỐ 4.0</small>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 12px 0' }}>
              Kênh thông tin chính thức phục vụ cán bộ giáo viên, nhân viên, phụ huynh và học sinh toàn trường. Hoạt động 24/7 trên mọi nền tảng.
            </p>
            <div style={{ fontSize: '12.5px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>📍 <strong>Địa chỉ:</strong> Trường THPT Cao Bá Quát</div>
              <div>📞 <strong>Điện thoại:</strong> 0123.456.789</div>
              <div>✉️ <strong>Email:</strong> c3caobaquat@daklak.edu.vn</div>
            </div>
          </div>

          {/* Cột 2: Lối tắt tiện ích */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚡ Lối Tắt Tiện Ích
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li><Link to="/bep-sang" style={{ color: '#fef08a', fontWeight: 'bold', textDecoration: 'none' }}>🍳 Điểm Tâm Sáng CBQ (Tiếp Sức Học Đường)</Link></li>
              <li><Link to="/lich-cong-tac" style={{ color: '#cbd5e1', textDecoration: 'none' }}>📅 Lịch Công Tác & Thời Khóa Biểu</Link></li>
              <li><Link to="/hoc-lieu-so" style={{ color: '#cbd5e1', textDecoration: 'none' }}>📺 Kho Học Liệu Số & Video Bài Giảng</Link></li>
              <li><Link to="/dang-ky-the-thao" style={{ color: '#cbd5e1', textDecoration: 'none' }}>⚽ Đăng Ký Thi Đấu Thể Thao</Link></li>
              <li><Link to="/hom-thu-hoc-sinh" style={{ color: '#cbd5e1', textDecoration: 'none' }}>💌 Hòm Thư Tâm Tư & Nguyện Vọng HS</Link></li>
              <li><Link to="/hop-online" style={{ color: '#cbd5e1', textDecoration: 'none' }}>💻 Điểm Danh Họp Trực Tuyến & Sĩ Số</Link></li>
              <li><Link to="/can-chinh-nghi-dinh-30" style={{ color: '#cbd5e1', textDecoration: 'none' }}>📄 Căn Chỉnh Văn Bản Chuẩn NĐ 30</Link></li>
            </ul>
          </div>

          {/* Cột 3: Các trang liên kết ngoài */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#4ade80', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔗 Các Trang Liên Kết</span>
              <span style={{ fontSize: '10px', backgroundColor: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '1px 6px', borderRadius: '10px' }}>
                {externalLinks.length}
              </span>
            </h4>
            {externalLinks && externalLinks.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                {externalLinks.filter(l => l && l.url).map((link, idx) => (
                  <li key={link.id || link.url || idx}>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        color: '#cbd5e1', 
                        textDecoration: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#4ade80'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                      <ExternalLink size={13} style={{ color: '#4ade80', flexShrink: 0 }} />
                      <span>{link.title || link.url}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                Chưa có liên kết nào được cấu hình.
              </p>
            )}
          </div>
        </div>

        {/* Bản quyền */}
        <div style={{ maxWidth: '1280px', margin: '18px auto 0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#64748b' }}>
          <div>© 2025 - 2026 TRƯỜNG THPT CAO BÁ QUÁT. All rights reserved.</div>
          <div>Hệ Thống Tiện Ích & Điều Hành Thông Minh</div>
        </div>
      </footer>
      
      {/* Smart School AI Chatbot */}
      <ChatbotWidget />

      {/* Native Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}

const styles = {
  portalContainer: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#f8fafc',
    minHeight: '100vh',
    paddingBottom: '40px',
    color: '#0f172a',
    overflowX: 'hidden',
    width: '100%'
  },
  banner: {
    position: 'relative',
    background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%)',
    borderBottom: '2px solid #34d399',
    boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25)',
    overflow: 'hidden'
  },
  bannerOverlay: {
    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    padding: '18px 0'
  },
  bannerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flex: '1 1 auto'
  },
  bannerTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  mainLogo: {
    height: '76px',
    width: 'auto',
    objectFit: 'contain',
    borderRadius: '10px',
    display: 'block'
  },
  superBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
    flexWrap: 'wrap'
  },
  superBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#38bdf8',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    letterSpacing: '0.5px'
  },
  superBadgeGold: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#fef08a',
    backgroundColor: 'rgba(180, 83, 9, 0.45)',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(250, 204, 21, 0.5)',
    letterSpacing: '0.5px'
  },
  bannerTitle: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fef9c3 60%, #fde047 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 2px 0',
    fontSize: '24px',
    fontWeight: '900',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
  },
  bannerSubtitle: {
    color: '#a7f3d0',
    margin: '0 0 6px 0',
    fontSize: '13.5px',
    fontWeight: '800',
    letterSpacing: '0.4px',
    textTransform: 'uppercase'
  },
  taglinePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    color: '#f1f5f9',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: '3px 10px',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  bannerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
  },
  hudBadgeGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px'
  },
  hudMiniStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(6, 78, 59, 0.65)',
    border: '1px solid rgba(52, 211, 153, 0.35)',
    padding: '5px 12px',
    borderRadius: '10px',
    backdropFilter: 'blur(8px)'
  },
  hudStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  hudStatNum: {
    fontSize: '13.5px',
    fontWeight: '900',
    color: '#67e8f9',
    lineHeight: 1.1
  },
  hudStatLabel: {
    fontSize: '9.5px',
    color: '#d1fae5',
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  hudStatDivider: {
    width: '1px',
    height: '18px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  navbar: {
    background: 'linear-gradient(90deg, #14532d 0%, #166534 50%, #15803d 100%)',
    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
    borderBottom: '2px solid #22c55e',
    boxShadow: '0 4px 15px rgba(20, 83, 45, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 900,
    overflow: 'visible'
  },
  navContainer: {
    maxWidth: '1360px',
    margin: '0 auto',
    padding: '0 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    boxSizing: 'border-box'
  },
  navItem: {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '9px 10px',
    fontSize: '12.8px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  navItemActive: {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '9px 10px',
    fontSize: '12.8px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: '#047857',
    boxShadow: 'inset 0 -3px 0 #fde047',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  navItemHighlight: {
    color: '#fef08a',
    textDecoration: 'none',
    padding: '9px 10px',
    fontSize: '12.8px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  navItemHighlightActive: {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '9px 10px',
    fontSize: '12.8px',
    fontWeight: '900',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'linear-gradient(135deg, #b45309, #d97706)',
    boxShadow: '0 0 12px rgba(217, 119, 6, 0.4), inset 0 -3px 0 #fde047',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  dropdownContent: {
    backgroundColor: '#064e3b',
    border: '1.5px solid #34d399',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25)',
    borderRadius: '0 0 10px 10px'
  },
  topBar: {
    maxWidth: '1280px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #bbf7d0',
    borderTop: 'none',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden'
  },
  dateInfo: {
    padding: '7px 14px',
    color: '#166534',
    borderRight: '1px solid #bbf7d0',
    backgroundColor: '#f0fdf4',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    fontWeight: '700'
  },
  marqueeWrapper: {
    flex: 1,
    padding: '0 12px',
    overflow: 'hidden'
  },
  marqueeText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: '12.5px',
    letterSpacing: '0.3px'
  }
};


