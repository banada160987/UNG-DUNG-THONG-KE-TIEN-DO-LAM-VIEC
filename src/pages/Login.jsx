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
          <div style={styles.logoPlaceholder}>CBQ</div>
          <h2 style={styles.title}>Quản lý Tiến độ</h2>
          <p style={styles.subtitle}>Kỷ niệm 30 năm THPT Cao Bá Quát</p>
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
    maxWidth: '400px',
    padding: '2.5rem',
    borderRadius: '1rem',
    textAlign: 'center'
  },
  header: {
    marginBottom: '2rem'
  },
  logoPlaceholder: {
    width: '64px',
    height: '64px',
    background: 'var(--primary)',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: '0 auto 1rem auto',
    boxShadow: 'var(--shadow-md)'
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '0.25rem'
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem'
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
