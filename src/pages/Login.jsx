import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft, 
  GraduationCap, Briefcase, Sparkles, AlertCircle, CheckCircle2 
} from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signIn(email.trim(), password);
      // Navigation is handled automatically by App.jsx based on auth state changes
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại Email và Mật khẩu quản trị.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Decorative ambient background lights */}
      <div style={styles.glowTopLeft} />
      <div style={styles.glowBottomRight} />

      {/* Main Login Card */}
      <div style={styles.card}>
        
        {/* Top Back Link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Link to="/" style={styles.backLink}>
            <ArrowLeft size={16} /> Trang chủ
          </Link>
          <span style={styles.versionBadge}>
            Phiên bản 4.0
          </span>
        </div>

        {/* Header & Logo */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <img 
              src="/logo.jpg" 
              alt="Logo THPT Cao Bá Quát 30 năm" 
              style={styles.logoImage} 
            />
          </div>

          <div style={styles.anniversaryTag}>
            <Sparkles size={13} color="#d97706" />
            <span>30 NĂM THÀNH LẬP (1996 - 2026)</span>
          </div>

          <h1 style={styles.title}>HỆ THỐNG ĐIỀU HÀNH & TIỆN ÍCH</h1>
          <div style={styles.schoolName}>TRƯỜNG THPT CAO BÁ QUÁT</div>
          <div style={styles.schoolAddress}>Phường Tân An - Tỉnh Đắk Lắk</div>

          {/* Role badge */}
          <div style={styles.roleNotice}>
            <ShieldCheck size={16} color="#059669" />
            <span>CỔNG ĐĂNG NHẬP BAN GIÁM HIỆU & QUẢN TRỊ VIÊN</span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Mail size={15} color="#047857" />
              <span>Email quản trị / Tài khoản</span>
            </label>
            <div style={styles.inputWrapper}>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="admin@caobaquat.edu.vn"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password input */}
          <div style={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>
                <Lock size={15} color="#047857" />
                <span>Mật khẩu bảo mật</span>
              </label>
            </div>
            <div style={styles.inputWrapper}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingRight: '42px' }}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Đang xác thực hệ thống...
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} /> Đăng Nhập Quản Trị
              </span>
            )}
          </button>
        </form>

        {/* Portal Switcher for Teachers & Students */}
        <div style={styles.portalDivider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>BẠN LÀ GIÁO VIÊN HOẶC HỌC SINH?</span>
          <div style={styles.dividerLine} />
        </div>

        <div style={styles.otherPortalsGrid}>
          <Link to="/dang-nhap-giao-vien" style={styles.portalCardTeacher}>
            <Briefcase size={16} color="#15803d" />
            <div>
              <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#15803d' }}>Cổng Giáo Viên</div>
              <div style={{ fontSize: '11px', color: '#166534' }}>Báo giảng, sổ sách & đề thi</div>
            </div>
          </Link>

          <Link to="/dang-nhap-hoc-sinh" style={styles.portalCardStudent}>
            <GraduationCap size={16} color="#0369a1" />
            <div>
              <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0369a1' }}>Cổng Học Sinh</div>
              <div style={{ fontSize: '11px', color: '#075985' }}>TKB, điểm danh & bài thi</div>
            </div>
          </Link>
        </div>

        {/* Security badge & Footer */}
        <div style={styles.footerNote}>
          <CheckCircle2 size={13} color="#10b981" />
          <span>Hệ thống bảo mật điện toán đám mây • Dữ liệu mã hóa SSL 256-bit</span>
        </div>
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
    background: 'radial-gradient(ellipse at 50% 20%, #064e3b 0%, #065f46 35%, #0f172a 100%)',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  glowTopLeft: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '450px',
    height: '450px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
    pointerEvents: 'none'
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(234, 179, 8, 0.2) 0%, transparent 70%)',
    pointerEvents: 'none'
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '28px 32px',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    position: 'relative',
    zIndex: 10,
    boxSizing: 'border-box'
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#047857',
    textDecoration: 'none',
    transition: 'color 0.15s ease'
  },
  versionBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  logoWrapper: {
    display: 'inline-block',
    padding: '6px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4) 0%, rgba(52, 211, 153, 0.3) 100%)',
    boxShadow: '0 8px 20px rgba(6, 78, 59, 0.12)',
    marginBottom: '10px'
  },
  logoImage: {
    width: '100px',
    height: 'auto',
    maxHeight: '100px',
    objectFit: 'contain',
    display: 'block'
  },
  anniversaryTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 12px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fef08a',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: '0.4px',
    marginBottom: '8px'
  },
  title: {
    fontSize: '17px',
    fontWeight: '900',
    color: '#064e3b',
    margin: '0 0 2px 0',
    letterSpacing: '0.3px',
    textTransform: 'uppercase'
  },
  schoolName: {
    fontSize: '14.5px',
    fontWeight: '900',
    color: '#dc2626',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: '2px'
  },
  schoolAddress: {
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: '500',
    marginBottom: '10px'
  },
  roleNotice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '7px 12px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: '0.2px'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#b91c1c',
    fontSize: '12.5px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#1e293b'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    fontSize: '13.5px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtn: {
    width: '100%',
    padding: '12px 18px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '14.5px',
    border: 'none',
    marginTop: '6px',
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: '0.3px',
    transition: 'all 0.2s ease'
  },
  portalDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '20px 0 14px 0'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e2e8f0'
  },
  dividerText: {
    fontSize: '10.5px',
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap'
  },
  otherPortalsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '16px'
  },
  portalCardTeacher: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    textDecoration: 'none',
    transition: 'transform 0.15s ease'
  },
  portalCardStudent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    textDecoration: 'none',
    transition: 'transform 0.15s ease'
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center'
  }
};
