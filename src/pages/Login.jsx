import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signIn(email, password);
      // Navigation is handled by App.jsx based on auth state changes
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>
        <div style={styles.header}>
          <img src="/logo.jpg" alt="Logo Kỷ niệm 30 năm" style={styles.logoImage} />
          <h2 style={styles.title}>HỆ THỐNG QUẢN LÝ TIẾN ĐỘ</h2>
          <div style={styles.subtitle}>
            <p style={{margin: '0 0 4px 0', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase'}}>Kỷ niệm 30 năm ngày thành lập</p>
            <p style={{margin: 0, fontWeight: '700'}}>TRƯỜNG THPT CAO BÁ QUÁT</p>
            <p style={{margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b'}}>Phường Tân An - Tỉnh Đắk Lắk</p>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email (Tài khoản)</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="nhap_email@caobaquat.edu.vn"
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--bg-color) 0%, #e2e8f0 100%)',
    padding: '1rem'
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    padding: '3rem 2.5rem',
    borderRadius: '1.5rem',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255,255,255,0.4)',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)'
  },
  header: {
    marginBottom: '2rem'
  },
  logoImage: {
    width: '160px',
    height: 'auto',
    marginBottom: '1.25rem',
    filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04))'
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '0.75rem',
    letterSpacing: '0.5px'
  },
  subtitle: {
    color: '#1e293b',
    fontSize: '0.9rem',
    fontWeight: '600',
    lineHeight: '1.4'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-main)'
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    fontSize: '1rem',
    background: 'rgba(255, 255, 255, 0.9)'
  },
  button: {
    padding: '0.875rem',
    borderRadius: '0.5rem',
    background: 'var(--primary)',
    color: 'white',
    fontWeight: '600',
    fontSize: '1rem',
    marginTop: '0.5rem',
    boxShadow: 'var(--shadow-sm)'
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem'
  }
};
