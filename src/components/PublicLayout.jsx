import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function PublicLayout() {
  const location = useLocation();
  const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const isActive = (path) => location.pathname === path;

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  return (
    <div style={styles.portalContainer}>
      {/* 1. Header Banner */}
      <header style={styles.banner}>
        <div className="portal-banner-content">
          <div style={styles.bannerLeft}>
            <img src="/logo.jpg" alt="Logo" style={styles.mainLogo} />
            <div>
              <h1 style={styles.bannerTitle}>TRƯỜNG THPT CAO BÁ QUÁT</h1>
              <h2 style={styles.bannerSubtitle}>LỄ KỶ NIỆM 30 NĂM THÀNH LẬP (1996 - 2026)</h2>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Horizontal Navigation */}
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          {/* Mobile Hamburger Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✖ Đóng Menu' : '☰ Menu Danh Mục'}
          </button>

          <div className={`portal-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link to="/" style={isActive('/') ? styles.navItemActive : styles.navItem}>🏠 Trang chủ</Link>
            
            {/* DROPDOWN 1: KỶ NIỆM 30 NĂM */}
            <div className={`nav-dropdown ${activeDropdown === 'anniversary' ? 'active-touch' : ''}`}>
              <span 
                onClick={() => toggleDropdown('anniversary')}
                style={(isActive('/gioi-thieu') || isActive('/tap-san') || isActive('/huong-dan') || isActive('/luu-but') || isActive('/cuoc-thi') || isActive('/dang-ky-the-thao') || isActive('/binh-chon') || isActive('/nop-bai-thi')) ? styles.navItemActive : styles.navItem}
              >
                🎉 Đại Lễ Kỷ Niệm 30 Năm ▾
              </span>
              <div className="nav-dropdown-content">
                <Link to="/gioi-thieu" className="nav-dropdown-item">ℹ️ Giới thiệu 30 năm</Link>
                <Link to="/tap-san" className="nav-dropdown-item">📖 Tập san 30 năm 3D</Link>
                <Link to="/huong-dan" className="nav-dropdown-item">📘 Cẩm nang hướng dẫn</Link>
                <Link to="/cuoc-thi" className="nav-dropdown-item">🏆 Cuộc thi tìm hiểu 30 năm</Link>
                <Link to="/dang-ky-the-thao" className="nav-dropdown-item">⚽ Đăng ký thi đấu thể thao</Link>
                <Link to="/binh-chon" className="nav-dropdown-item">🗳️ Bình chọn tác phẩm</Link>
                <Link to="/nop-bai-thi" className="nav-dropdown-item">📤 Nộp bài thi sáng tạo</Link>
                <Link to="/luu-but" className="nav-dropdown-item">💖 Sổ lưu bút kỷ niệm</Link>
              </div>
            </div>

            {/* DROPDOWN 2: VẬN HÀNH NHÀ TRƯỜNG */}
            <div className={`nav-dropdown ${activeDropdown === 'school' ? 'active-touch' : ''}`}>
              <span 
                onClick={() => toggleDropdown('school')}
                style={(isActive('/lich-cong-tac') || isActive('/to-chuyen-mon') || isActive('/dang-ky-xe-may') || isActive('/van-ban') || isActive('/gop-y')) ? styles.navItemActive : styles.navItem}
              >
                🏫 Vận hành Nhà trường ▾
              </span>
              <div className="nav-dropdown-content">
                <Link to="/lich-cong-tac" className="nav-dropdown-item">📅 Lịch công tác tuần & Trực BGH</Link>
                <Link to="/to-chuyen-mon" className="nav-dropdown-item">👨‍🏫 Đội ngũ & Tổ chuyên môn</Link>
                <Link to="/dang-ky-xe-may" className="nav-dropdown-item">🛵 Đăng ký Xe máy Học sinh</Link>
                <Link to="/van-ban" className="nav-dropdown-item">📜 Văn bản - Thông báo</Link>
                <Link to="/gop-y" className="nav-dropdown-item">✍️ Góp ý Công việc & Đề án</Link>
              </div>
            </div>

            {/* DROPDOWN 3: TIN TỨC & THƯ VIỆN */}
            <div className={`nav-dropdown ${activeDropdown === 'media' ? 'active-touch' : ''}`}>
              <span 
                onClick={() => toggleDropdown('media')}
                style={(isActive('/tin-tuc') || isActive('/thu-vien-anh') || isActive('/bang-vang')) ? styles.navItemActive : styles.navItem}
              >
                📰 Tin tức & Thư viện ▾
              </span>
              <div className="nav-dropdown-content">
                <Link to="/tin-tuc" className="nav-dropdown-item">📰 Tin tức - Sự kiện</Link>
                <Link to="/thu-vien-anh" className="nav-dropdown-item">📸 Thư viện ảnh 30 năm</Link>
                <Link to="/bang-vang" className="nav-dropdown-item">🎖️ Bảng vàng kỷ niệm</Link>
              </div>
            </div>
          </div>

          <Link to="/admin" style={styles.adminLoginBtn}>🔑 Đăng nhập BTC</Link>
        </div>
      </nav>

      {/* 3. Marquee & Date Bar */}
      <div style={styles.topBar}>
        <div style={styles.dateInfo}>{currentDate}</div>
        <div style={styles.marqueeWrapper}>
          <marquee style={styles.marqueeText} scrollamount="5">
            CHÀO MỪNG QUÝ VỊ ĐẠI BIỂU, QUÝ THẦY CÔ VÀ CÁC THẾ HỆ HỌC SINH VỀ DỰ LỄ KỶ NIỆM 30 NĂM THÀNH LẬP TRƯỜNG THPT CAO BÁ QUÁT! CHƯƠNG TRÌNH SẼ ĐƯỢC TỔ CHỨC VÀO NGÀY 03/9/2026.
          </marquee>
        </div>
      </div>

      {/* Main Content Rendered Here */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px' }}>
        <Outlet />
      </div>
    </div>
  );
}

const styles = {
  portalContainer: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    backgroundColor: '#e5e5e5', // Light gray background typical of portals
    minHeight: '100vh',
    paddingBottom: '40px',
  },
  banner: {
    backgroundColor: '#fff',
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  mainLogo: {
    height: '80px',
    width: 'auto',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  bannerTitle: {
    color: '#d32f2f',
    margin: '0 0 5px 0',
    fontSize: '22px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bannerSubtitle: {
    color: '#166534',
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  navbar: {
    backgroundColor: '#166534',
    borderTop: '2px solid #14532d',
    borderBottom: '2px solid #14532d',
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  navItem: {
    color: 'white',
    textDecoration: 'none',
    padding: '13px 14px',
    fontSize: '13.5px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.12)',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  navItemActive: {
    color: '#fde047',
    textDecoration: 'none',
    padding: '13px 14px',
    fontSize: '13.5px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: '#14532d',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  adminLoginBtn: {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    backgroundColor: '#be123c',
  },
  topBar: {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
  },
  dateInfo: {
    padding: '8px 15px',
    color: '#475569',
    borderRight: '1px solid #e2e8f0',
    backgroundColor: '#f1f5f9',
    whiteSpace: 'nowrap',
  },
  marqueeWrapper: {
    flex: 1,
    padding: '0 15px',
    overflow: 'hidden',
  },
  marqueeText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  searchMini: {
    display: 'flex',
    borderLeft: '1px solid #e2e8f0',
  },
  searchMiniInput: {
    border: 'none',
    padding: '8px',
    outline: 'none',
    width: '150px',
  },
  searchMiniBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0 15px',
    cursor: 'pointer',
  }
};
