import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GraduationCap, Briefcase, ShieldCheck, Activity, Clock, Sparkles, Cpu, Layers, Radio, Globe, Wifi, CheckCircle2 } from 'lucide-react';
import ChatbotWidget from './ChatbotWidget';

const DEFAULT_SCHOOL_MENUS = [
  { id: 'm1', target_type: 'public', parent_group: 'school', label: '📅 Lịch công tác & Thời khóa biểu', path: '/lich-cong-tac', sort_order: 1, is_active: true },
  { id: 'm2', target_type: 'public', parent_group: 'school', label: '👨‍🏫 Đội ngũ & Tổ chuyên môn', path: '/to-chuyen-mon', sort_order: 2, is_active: true },
  { id: 'm3', target_type: 'public', parent_group: 'school', label: '🛵 Đăng ký Xe máy Học sinh', path: '/dang-ky-xe-may', sort_order: 3, is_active: true },
  { id: 'm3_1', target_type: 'public', parent_group: 'school', label: '📝 Đăng ký Hoạt động / Sự kiện', path: '/dang-ky-hoat-dong', sort_order: 4, is_active: true },
  { id: 'm4', target_type: 'public', parent_group: 'school', label: '📋 Sổ Chấm điểm Thi đua Trực tuần', path: '/cham-diem-thi-dua', sort_order: 5, is_active: true },
  { id: 'm5', target_type: 'public', parent_group: 'school', label: '📜 Văn bản - Thông báo', path: '/van-ban', sort_order: 6, is_active: true },
  { id: 'm6', target_type: 'public', parent_group: 'school', label: '✍️ Góp ý Công việc & Đề án', path: '/gop-y', sort_order: 7, is_active: true }
];

export default function PublicLayout() {
  const location = useLocation();
  const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString('vi-VN'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [publicMenus, setPublicMenus] = useState(DEFAULT_SCHOOL_MENUS);

  const isActive = (path) => location.pathname === path;

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

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
        const cached = localStorage.getItem('cbq_menus_public');
        if (cached) {
          setPublicMenus(JSON.parse(cached));
        }
      }

      const { data, error } = await supabase
        .from('cbq_navigation_menus')
        .select('*')
        .eq('target_type', 'public')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setPublicMenus(data);
        localStorage.setItem('cbq_menus_public', JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Dùng menu công khai mặc định:", err);
    }
  }

  useEffect(() => {
    const channel = supabase.channel('public:cbq_navigation_menus')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_navigation_menus' }, () => {
        fetchPublicMenus(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isGroupActive = (groupName) => {
    return publicMenus
      .filter(m => (m.parent_group === groupName || (!m.parent_group && groupName === 'school')) && m.is_active !== false)
      .some(m => isActive(m.path));
  };

  return (
    <div style={styles.portalContainer}>
      {/* 1. Bright & Prestigious School Header Banner */}
      <header style={styles.banner}>
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

      {/* 2. Navigation Bar */}
      <nav style={styles.navbar} className="cbq-navbar">
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
              🏠 Trang Chủ Trường
            </Link>
            
            {/* MENU ĐỘC LẬP: THỜI KHÓA BIỂU & LỊCH TUẦN */}
            <Link 
              to="/lich-cong-tac" 
              style={{
                ...(isActive('/lich-cong-tac') ? styles.navItemHighlightActive : styles.navItemHighlight),
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              📅 THỜI KHÓA BIỂU & LỊCH TUẦN
            </Link>
            
            {/* DROPDOWN 1: QUẢN LÝ VẬN HÀNH NHÀ TRƯỜNG */}
            <div className={`nav-dropdown ${activeDropdown === 'school' ? 'active-touch' : ''}`}>
              <span 
                onClick={() => toggleDropdown('school')}
                style={isGroupActive('school') ? styles.navItemActive : styles.navItem}
              >
                🏫 Quản lý Vận hành ▾
              </span>
              <div className="nav-dropdown-content" style={styles.dropdownContent}>
                {publicMenus
                  .filter(m => (m.parent_group === 'school' || !m.parent_group) && m.is_active !== false)
                  .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
                  .map(m => (
                    <Link key={m.id || m.path} to={m.path} className="nav-dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                      {m.label}
                    </Link>
                  ))}
              </div>
            </div>

            {/* DROPDOWN 2: TIN TỨC & HOẠT ĐỘNG */}
            <div className={`nav-dropdown ${activeDropdown === 'media' ? 'active-touch' : ''}`}>
              <span 
                onClick={() => toggleDropdown('media')}
                style={isGroupActive('media') ? styles.navItemActive : styles.navItem}
              >
                📰 Tin tức & Hoạt động ▾
              </span>
              <div className="nav-dropdown-content" style={styles.dropdownContent}>
                {publicMenus
                  .filter(m => m.parent_group === 'media' && m.is_active !== false)
                  .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
                  .map(m => (
                    <Link key={m.id || m.path} to={m.path} className="nav-dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                      {m.label}
                    </Link>
                  ))}
              </div>
            </div>

            {/* DROPDOWN 3: TƯ LIỆU TRUYỀN THỐNG 30 NĂM */}
            <div className={`nav-dropdown ${activeDropdown === 'anniversary' ? 'active-touch' : ''}`}>
              <span 
                onClick={() => toggleDropdown('anniversary')}
                style={isGroupActive('anniversary') ? styles.navItemActive : styles.navItem}
              >
                📁 Tư liệu Truyền thống ▾
              </span>
              <div className="nav-dropdown-content" style={styles.dropdownContent}>
                {publicMenus
                  .filter(m => m.parent_group === 'anniversary' && m.is_active !== false)
                  .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
                  .map(m => (
                    <Link key={m.id || m.path} to={m.path} className="nav-dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                      {m.label}
                    </Link>
                  ))}
              </div>
            </div>

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

          {/* Desktop Quick Access Portals */}
          <div className="desktop-portal-btns" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'nowrap' }}>
            <Link to="/dang-nhap-hoc-sinh" className="premium-nav-btn student" title="Cổng Không Gian Số Học Sinh">
              <GraduationCap size={15} /> Cổng Học Sinh
            </Link>
            <Link to="/dang-nhap-giao-vien" className="premium-nav-btn teacher" title="Cổng Không Gian Số Giáo Viên">
              <Briefcase size={15} /> Cổng Giáo Viên
            </Link>
            <Link to="/admin" className="premium-nav-btn admin" title="Trang Quản Lý & Bảng Điều Khiển Nhà Trường">
              <ShieldCheck size={15} /> Trang Quản Lý
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Bright High-Contrast Ticker & Status Bar */}
      <div style={styles.topBar} className="cbq-topbar">
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
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 12px 60px 12px' }}>
        <Outlet />
      </main>
      
      {/* Smart School AI Chatbot */}
      <ChatbotWidget />
    </div>
  );
}

const styles = {
  portalContainer: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#f8fafc',
    minHeight: '100vh',
    paddingBottom: '40px',
    color: '#0f172a'
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
    maxWidth: '1240px',
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
    zIndex: 900
  },
  navContainer: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '0 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap'
  },
  navItem: {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px 14px',
    fontSize: '13.5px',
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
    padding: '12px 14px',
    fontSize: '13.5px',
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
    padding: '12px 14px',
    fontSize: '13.5px',
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
    padding: '12px 14px',
    fontSize: '13.5px',
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
    maxWidth: '1240px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #bbf7d0',
    borderTop: 'none',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
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


