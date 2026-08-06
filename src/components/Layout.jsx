import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Users, CheckSquare, FileText, Globe, Gift, Settings, Image, LayoutDashboard, DollarSign, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Layout({ children, title }) {
  const { user, role, permissions = {}, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  const menuItems = [
    { path: '/admin', icon: Home, label: 'Tổng quan Lãnh đạo', group: 'TỔ CHỨC SỰ KIỆN', show: role === 'admin' || role === 'secretary' },
    { path: '/admin/committee', icon: CheckSquare, label: 'Việc của Tiểu ban', group: 'TỔ CHỨC SỰ KIỆN', show: true },
    { path: '/admin/guests', icon: Users, label: 'Quản lý Khách mời', group: 'QUẢN LÝ KHÁCH & TÀI TRỢ', show: !!permissions.canViewGuests },
    { path: '/admin/sponsors', icon: Gift, label: 'Quản lý Tài trợ', group: 'QUẢN LÝ KHÁCH & TÀI TRỢ', show: !!permissions.canViewSponsors },
    { path: '/admin/news', icon: Image, label: 'Tin tức - Sự kiện', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewNews },
    { path: '/admin/pages', icon: Globe, label: 'Trang Giới thiệu', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewPages },
    { path: '/admin/docs', icon: FileText, label: 'Văn bản - Thông báo', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewDocs },
    { path: '/admin/users', icon: Settings, label: 'Phân quyền Tài khoản', group: 'HỆ THỐNG', show: role === 'admin' },
  ];

  const visibleMenuItems = menuItems.filter(item => item.show);

  // Group items
  const groupedItems = visibleMenuItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link 
      to={to} 
      onClick={() => setIsSidebarOpen(false)}
      style={{
        ...styles.navItem, 
        backgroundColor: isActive(to) ? '#334155' : 'transparent',
        borderLeft: isActive(to) ? '4px solid #3b82f6' : '4px solid transparent'
      }}
    >
      <Icon size={18} /> {label}
    </Link>
  );

  return (
    <div style={styles.container}>
      <div className={`layout-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      
      {/* Sidebar */}
      <aside className={`layout-sidebar ${isSidebarOpen ? 'open' : ''}`} style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoCircle}>30</div>
          <div>
            <h2 style={{margin: 0, fontSize: '16px', color: 'white'}}>CBQ Admin</h2>
            <small style={{color: '#94a3b8'}}>Kỷ niệm 30 năm</small>
          </div>
        </div>

        <div style={styles.navContainer}>
          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group}>
              <div style={styles.navGroup}>{group}</div>
              {items.map(item => (
                <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} />
              ))}
            </div>
          ))}
        </div>

        <div style={styles.sidebarBottom}>
          <Link to="/" style={styles.publicLink}>← Trở ra Cổng thông tin</Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={styles.mainWrapper}>
        <header style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 className="header-title" style={styles.headerTitle}>{title}</h1>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.userInfo}>{user?.email || 'Admin User'}</span>
            <button onClick={signOut} style={styles.logoutBtn} title="Đăng xuất">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        
        <main className="main-content-area" style={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
    zIndex: 20
  },
  logoArea: {
    padding: '20px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoCircle: {
    width: '40px',
    height: '40px',
    backgroundColor: '#d32f2f',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  navContainer: {
    flex: 1,
    padding: '20px 0',
    overflowY: 'auto'
  },
  navGroup: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#64748b',
    padding: '10px 20px',
    marginTop: '10px',
    letterSpacing: '1px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: '#cbd5e1',
    textDecoration: 'none',
    transition: 'all 0.2s',
    fontSize: '14px'
  },
  sidebarBottom: {
    padding: '20px',
    borderTop: '1px solid #334155'
  },
  publicLink: {
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: '13px',
    display: 'block',
    textAlign: 'center',
    padding: '8px',
    border: '1px solid #475569',
    borderRadius: '6px'
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#ffffff',
    height: '70px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  userInfo: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500'
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: '0.2s'
  },
  mainContent: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto'
  }
};
