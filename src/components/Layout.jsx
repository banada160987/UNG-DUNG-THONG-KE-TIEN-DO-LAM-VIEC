import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Users, CheckSquare, FileText, Globe, Gift, Settings, Image, LayoutDashboard, DollarSign, Menu, X, Bell, Calendar, Link2, Activity, Trophy } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { differenceInDays } from 'date-fns';

export default function Layout({ children, title }) {
  const { user, role, permissions = {}, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const targetDate = new Date('2026-09-03');
  const daysLeft = differenceInDays(targetDate, new Date());

  const handleNotificationClick = (notif) => {
    setShowNotifications(false);
    if (notif.task_id) {
      navigate(`/admin/committee?taskId=${notif.task_id}`);
    }
  };

  useEffect(() => {
    const fetchNotifs = async () => {
      const { data } = await supabase.from('cbq_notifications').select('*').order('created_at', { ascending: false }).limit(5);
      if(data) setNotifications(data);
    }
    fetchNotifs();
    
    const channel = supabase.channel('public:cbq_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cbq_notifications' }, payload => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 5));
      })
      .subscribe();
      
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

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
    { path: '/admin/quizzes', icon: Trophy, label: 'Cuộc thi & Trao giải', group: 'QUẢN LÝ KHÁCH & TÀI TRỢ', show: !!permissions.canViewNews },
    { path: '/admin/voting', icon: Trophy, label: 'Bình chọn tác phẩm', group: 'QUẢN LÝ KHÁCH & TÀI TRỢ', show: !!permissions.canViewNews },
    { path: '/admin/the-thao', icon: Activity, label: '⚽ Thể thao & Bảng đấu', group: 'QUẢN LÝ KHÁCH & TÀI TRỢ', show: !!permissions.canViewSports },
    { path: '/admin/news', icon: Image, label: 'Tin tức - Sự kiện', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewNews },
    { path: '/admin/gallery', icon: Image, label: 'Thư viện ảnh', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewNews },
    { path: '/admin/pages', icon: Globe, label: 'Trang Giới thiệu', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewPages },
    { path: '/admin/invite-config', icon: Settings, label: 'Cấu hình Thiệp Mời', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewPages },
    { path: '/admin/docs', icon: FileText, label: 'Văn bản - Thông báo', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewDocs },
    { path: '/admin/gop-y', icon: FileText, label: '✍️ Quản lý Góp ý Công việc', group: 'NỘI DUNG WEB (PUBLIC)', show: !!permissions.canViewDocs },
    { path: '/admin/links', icon: Link2, label: 'Cấu hình Liên kết trang', group: 'NỘI DUNG WEB (PUBLIC)', show: role === 'admin' },
    { path: '/admin/users', icon: Settings, label: 'Phân quyền Tài khoản', group: 'HỆ THỐNG', show: role === 'admin' },
    { path: '/admin/audit', icon: Activity, label: 'Nhật ký Hoạt động', group: 'HỆ THỐNG', show: role === 'admin' },
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
          <img src="/logo.jpg" alt="Logo 30 năm" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
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
            
            <div className="layout-header-countdown" style={styles.countdown}>
              <Calendar size={18} color="#ef4444" />
              <span>Còn <strong style={{color: '#ef4444'}}>{daysLeft > 0 ? daysLeft : 0} ngày</strong> đến Lễ 30 năm</span>
            </div>

            <div style={{position: 'relative'}} ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                style={styles.notifBtn}
                title="Thông báo"
              >
                <Bell size={20} />
                {notifications.length > 0 && <span style={styles.notifBadge}>{notifications.length}</span>}
              </button>
              
              {showNotifications && (
                <div style={styles.notifDropdown}>
                  <div style={styles.notifHeader}>Thông báo mới nhất</div>
                  <div style={styles.notifList}>
                    {notifications.map(n => (
                      <div key={n.id} style={{...styles.notifItem, cursor: n.task_id ? 'pointer' : 'default'}} onClick={() => handleNotificationClick(n)}>
                        <div style={{fontSize: '0.85rem', fontWeight: 'bold'}}>{n.title}</div>
                        <div style={{fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem'}}>{n.message}</div>
                        <div style={{fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem'}}>{new Date(n.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                    ))}
                    {notifications.length === 0 && <div style={{padding: '1rem', textAlign: 'center', color: '#64748b'}}>Không có thông báo.</div>}
                  </div>
                </div>
              )}
            </div>

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
  },
  countdown: {
    display: 'none',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fef2f2',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    border: '1px solid #fca5a5',
    fontSize: '0.85rem'
  },
  notifBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#475569',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifDropdown: {
    position: 'absolute',
    top: '120%',
    right: '0',
    width: '320px',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    zIndex: 50,
    overflow: 'hidden'
  },
  notifHeader: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 'bold',
    backgroundColor: '#f8fafc'
  },
  notifList: {
    maxHeight: '300px',
    overflowY: 'auto'
  },
  notifItem: {
    padding: '1rem',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background 0.2s'
  }
};

// Add to global CSS or handle inline via JS for media query equivalent
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (min-width: 768px) {
      .layout-header-countdown {
        display: flex !important;
      }
    }
  `;
  document.head.appendChild(style);
}
