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
      {/* 1. Cyber Space Header Banner */}
      <header style={styles.banner}>
        <div style={styles.bannerOverlay}>
          <div className="portal-banner-content" style={styles.bannerInner}>
            
            {/* Left: Holographic Logo & School Identity */}
            <div style={styles.bannerLeft}>
              <div className="cyber-logo-frame">
                <img src="/logo.jpg" alt="THPT Cao Bá Quát Logo" style={styles.mainLogo} />
              </div>

              <div>
                <div style={styles.superBadgeRow}>
                  <span style={styles.superBadge}>
                    <Cpu size={12} color="#38bdf8" /> SỞ GD&ĐT ĐẮK LẮK
                  </span>
                  <span style={styles.superBadgeGold}>
                    ✦ 30 NĂM PHÁT TRIỂN (1996 - 2026) ✦
                  </span>
                </div>

                <h1 style={styles.bannerTitle}>
                  TRƯỜNG THPT CAO BÁ QUÁT
                </h1>

                <h2 style={styles.bannerSubtitle}>
                  TRUNG TÂM ĐIỀU HÀNH KHÔNG GIAN SỐ & CỔNG THÔNG TIN TOÀN TRƯỜNG
                </h2>

                <div style={styles.taglinePill}>
                  <Sparkles size={13} color="#fde047" />
                  <span>Kỷ Nguyên Chuyển Đổi Số Giáo Dục Toàn Diện • Thời Gian Thực 24/7</span>
                </div>
              </div>
            </div>

            {/* Right: Cyber HUD Telemetry Box */}
            <div style={styles.bannerRight}>
              <div className="cyber-clock-box">
                <Clock size={16} color="#38bdf8" />
                <span className="cyber-clock-digits">{liveTime}</span>
              </div>

              <div style={styles.hudBadgeGroup}>
                <div className="cyber-badge-live">
                  <span className="cyber-beacon-dot"></span>
                  <span>TRỰC TUYẾN 24/7</span>
                </div>
                
                <div style={styles.hudMiniStats}>
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

      {/* 2. Cyber Glass Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          {/* Mobile Hamburger Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✖ Đóng Menu' : '☰ Menu Danh Mục Số'}
          </button>

          <div className={`portal-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link to="/" style={isActive('/') ? styles.navItemActive : styles.navItem}>
              🏠 Trang chủ
            </Link>
            
            {/* MENU ĐỘC LẬP: THỜI KHÓA BIỂU & LỊCH TUẦN */}
            <Link 
              to="/lich-cong-tac" 
              style={{
                ...(isActive('/lich-cong-tac') ? styles.navItemHighlightActive : styles.navItemHighlight),
              }}
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
                    <Link key={m.id || m.path} to={m.path} className="nav-dropdown-item">
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
                    <Link key={m.id || m.path} to={m.path} className="nav-dropdown-item">
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
                    <Link key={m.id || m.path} to={m.path} className="nav-dropdown-item">
                      {m.label}
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick Access Portals */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'nowrap' }}>
            <Link to="/dang-nhap-hoc-sinh" className="premium-nav-btn student" title="Cổng Không Gian Số Học Sinh">
              <GraduationCap size={15} /> Học Sinh
            </Link>
            <Link to="/dang-nhap-giao-vien" className="premium-nav-btn teacher" title="Cổng Không Gian Số Giáo Viên">
              <Briefcase size={15} /> Giáo Viên
            </Link>
            <Link to="/admin" className="premium-nav-btn admin" title="Trung Tâm Điều Hành & Ban Tổ Chức">
              <ShieldCheck size={15} /> BTC
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. High-Tech Cyber Ticker & Status Bar */}
      <div style={styles.topBar}>
        <div style={styles.dateInfo}>
          <Radio size={14} color="#10b981" style={{ animation: 'beacon-pulse 2s infinite' }} />
          <span>{currentDate}</span>
        </div>
        <div style={styles.marqueeWrapper}>
          <marquee style={styles.marqueeText} scrollamount="5">
            🚀 CHÀO MỪNG ĐẾN VỚI TRUNG TÂM KHÔNG GIAN SỐ & ĐIỀU HÀNH THÔNG MINH TRƯỜNG THPT CAO BÁ QUÁT • KÊNH THÔNG TIN VẬN HÀNH CHUYÊN MÔN, THỜI KHÓA BIỂU, THI ĐUA NỀ NẾP VÀ DỊCH VỤ GIÁO DỤC SỐ DÀNH CHO GIÁO VIÊN, HỌC SINH VÀ PHỤ HUYNH • HOẠT ĐỘNG 24/7 ✦
          </marquee>
        </div>
      </div>

      {/* Main Content Rendered Here */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 12px 60px 12px' }}>
        <Outlet />
      </div>
      
      {/* Smart School AI Chatbot */}
      <ChatbotWidget />
    </div>
  );
}

const styles = {
  portalContainer: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: 'radial-gradient(ellipse at 50% 0%, #0d172a 0%, #080d1a 50%, #030712 100%)',
    minHeight: '100vh',
    paddingBottom: '40px',
    color: '#0f172a'
  },
  banner: {
    position: 'relative',
    background: 'radial-gradient(ellipse at 80% 0%, rgba(14, 165, 233, 0.22) 0%, transparent 60%), radial-gradient(ellipse at 20% 100%, rgba(16, 185, 129, 0.2) 0%, transparent 50%), linear-gradient(135deg, #030712 0%, #0f172a 50%, #064e3b 100%)',
    borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden'
  },
  bannerOverlay: {
    backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    padding: '20px 0'
  },
  bannerInner: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flex: '1 1 500px'
  },
  mainLogo: {
    height: '84px',
    width: 'auto',
    objectFit: 'contain',
    borderRadius: '10px',
    display: 'block'
  },
  superBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    flexWrap: 'wrap'
  },
  superBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#38bdf8',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    letterSpacing: '0.5px'
  },
  superBadgeGold: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#fde047',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(250, 204, 21, 0.3)',
    letterSpacing: '0.5px'
  },
  bannerTitle: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 60%, #facc15 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 4px 0',
    fontSize: '25px',
    fontWeight: '900',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    textShadow: '0 0 30px rgba(250, 204, 21, 0.25)'
  },
  bannerSubtitle: {
    background: 'linear-gradient(90deg, #38bdf8 0%, #34d399 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
    fontSize: '14.5px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  taglinePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#e2e8f0',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.12)'
  },
  bannerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px'
  },
  hudBadgeGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
  },
  hudMiniStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    padding: '6px 14px',
    borderRadius: '10px',
    backdropFilter: 'blur(8px)'
  },
  hudStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  hudStatNum: {
    fontSize: '14px',
    fontWeight: '900',
    color: '#38bdf8',
    lineHeight: 1.1
  },
  hudStatLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  hudStatDivider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  navbar: {
    background: 'linear-gradient(90deg, #022c22 0%, #064e3b 40%, #0f172a 100%)',
    borderTop: '1px solid rgba(56, 189, 248, 0.2)',
    borderBottom: '2px solid rgba(56, 189, 248, 0.35)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(16px)',
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
    color: '#f8fafc',
    textDecoration: 'none',
    padding: '13px 14px',
    fontSize: '13.5px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  navItemActive: {
    color: '#34d399',
    textDecoration: 'none',
    padding: '13px 14px',
    fontSize: '13.5px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(6, 78, 59, 0.75)',
    boxShadow: 'inset 0 -2px 0 #34d399',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  navItemHighlight: {
    color: '#fef08a',
    textDecoration: 'none',
    padding: '13px 14px',
    fontSize: '13.5px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  navItemHighlightActive: {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '13px 14px',
    fontSize: '13.5px',
    fontWeight: '900',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'linear-gradient(135deg, #b45309, #d97706)',
    boxShadow: '0 0 15px rgba(217, 119, 6, 0.5), inset 0 -2px 0 #fde047',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  dropdownContent: {
    backgroundColor: '#091e17',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
    borderRadius: '0 0 10px 10px'
  },
  topBar: {
    maxWidth: '1240px',
    margin: '0 auto',
    backgroundColor: '#050a14',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderTop: 'none',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  },
  dateInfo: {
    padding: '8px 16px',
    color: '#94a3b8',
    borderRight: '1px solid rgba(56, 189, 248, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    fontWeight: '700'
  },
  marqueeWrapper: {
    flex: 1,
    padding: '0 15px',
    overflow: 'hidden'
  },
  marqueeText: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: '12.5px',
    letterSpacing: '0.4px'
  }
};

