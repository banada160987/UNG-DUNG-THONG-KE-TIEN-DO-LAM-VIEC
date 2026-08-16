import { Link, Outlet, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function PublicLayout() {
  const location = useLocation();
  const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const isActive = (path) => location.pathname === path;

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
          <div className="portal-nav-links" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Link to="/" style={isActive('/') ? styles.navItemActive : styles.navItem}>Trang chủ</Link>
            <Link to="/gioi-thieu" style={isActive('/gioi-thieu') ? styles.navItemActive : styles.navItem}>Giới thiệu</Link>
            <Link to="/tin-tuc" style={isActive('/tin-tuc') ? styles.navItemActive : styles.navItem}>Tin tức - Sự kiện</Link>
            <Link to="/van-ban" style={isActive('/van-ban') ? styles.navItemActive : styles.navItem}>Văn bản - Thông báo</Link>
            <Link to="/bang-vang" style={isActive('/bang-vang') ? styles.navItemActive : styles.navItem}>Bảng vàng</Link>
            <Link to="/thu-vien-anh" style={isActive('/thu-vien-anh') ? styles.navItemActive : styles.navItem}>Thư viện ảnh</Link>
            <Link to="/cuoc-thi" style={isActive('/cuoc-thi') ? styles.navItemActive : styles.navItem}>🏆 Cuộc thi tìm hiểu</Link>
            <Link to="/binh-chon" style={isActive('/binh-chon') ? styles.navItemActive : styles.navItem}>🗳️ Bình chọn tác phẩm</Link>
            <Link to="/nop-bai-thi" style={isActive('/nop-bai-thi') ? styles.navItemActive : styles.navItem}>📤 Nộp bài thi</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {(() => {
              const currentStudent = JSON.parse(localStorage.getItem('cbq_current_student') || 'null');
              if (currentStudent) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', color: 'white' }}>
                    <span style={{ fontWeight: 'bold' }}>🎓 {currentStudent.full_name} ({currentStudent.student_class})</span>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('cbq_current_student');
                        window.location.reload();
                      }}
                      style={{ background: '#be123c', color: 'white', border: 'none', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Link to="/dang-nhap" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }}>🔐 Đăng nhập</Link>
                  <Link to="/dang-ky" style={{ padding: '6px 12px', background: '#be123c', color: 'white', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }}>👤 Đăng ký</Link>
                </div>
              );
            })()}
            <Link to="/admin" style={styles.adminLoginBtn}>BTC</Link>
          </div>
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
    flexWrap: 'wrap',
  },
  navItem: {
    color: 'white',
    textDecoration: 'none',
    padding: '12px 15px',
    fontSize: '14px',
    fontWeight: 'bold',
    borderRight: '1px solid #14532d',
    transition: 'background 0.2s',
  },
  navItemActive: {
    color: 'white',
    textDecoration: 'none',
    padding: '12px 15px',
    fontSize: '14px',
    fontWeight: 'bold',
    borderRight: '1px solid #14532d',
    backgroundColor: '#14532d',
  },
  adminLoginBtn: {
    color: '#fbbf24',
    textDecoration: 'none',
    padding: '12px 15px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#d32f2f',
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
