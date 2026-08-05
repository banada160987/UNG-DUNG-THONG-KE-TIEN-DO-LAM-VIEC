import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Layout({ children, title }) {
  const { signOut, user } = useAuth();

  return (
    <div style={styles.container}>
      {/* Topbar */}
      <header className="glass" style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoPlaceholder}>CBQ</div>
          <div>
            <h1 style={styles.title}>{title}</h1>
            <p style={styles.subtitle}>Kỷ niệm 30 năm THPT Cao Bá Quát</p>
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <div style={styles.navLinks}>
            <Link to="/" style={{...styles.navLink, color: 'var(--primary)'}}>Trang Công Khai</Link>
            <span style={{color: '#ccc'}}>|</span>
            <Link to="/admin" style={styles.navLink}>Lãnh đạo</Link>
            <Link to="/admin/committee" style={styles.navLink}>Tiểu ban</Link>
            <Link to="/admin/guests" style={styles.navLink}>Khách Mời</Link>
            <Link to="/admin/sponsors" style={styles.navLink}>Tài Trợ</Link>
            <Link to="/admin/news" style={styles.navLink}>Tin Tức</Link>
          </div>
          <span style={styles.userInfo}>{user?.email}</span>
          <button onClick={signOut} style={styles.logoutBtn} title="Đăng xuất">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid var(--border)',
    borderRadius: '0 0 1rem 1rem',
    margin: '0 1rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoPlaceholder: {
    width: '40px',
    height: '40px',
    background: 'var(--primary)',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '1.25rem',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
    marginRight: '1rem',
  },
  navLink: {
    textDecoration: 'none',
    color: 'var(--text-main)',
    fontWeight: '500',
    padding: '0.5rem',
  },
  userInfo: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    display: 'none', // Hide on small screens if needed, wait no CSS media query here. Let's keep it visible for now.
  },
  logoutBtn: {
    background: 'transparent',
    color: 'var(--text-muted)',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  }
};
