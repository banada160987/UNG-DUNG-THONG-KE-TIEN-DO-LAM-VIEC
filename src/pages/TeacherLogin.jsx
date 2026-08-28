import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, User, Lock, LogIn, ArrowLeft } from 'lucide-react';

export default function TeacherLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: dbError } = await supabase
        .from('cbq_teacher_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

      if (dbError || !data) {
        setError('Tài khoản hoặc mật khẩu không đúng!');
        setLoading(false);
        return;
      }

      // Lưu thông tin giáo viên vào localStorage
      localStorage.setItem('cbq_current_teacher', JSON.stringify(data));
      navigate('/teacher-dashboard');
      
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Inter", sans-serif' }}>
      
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.5)' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#16a34a', textDecoration: 'none', marginBottom: '24px', fontWeight: 'bold' }}>
          <ArrowLeft size={20} /> Trang chủ
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: '#dcfce7', borderRadius: '50%', color: '#15803d', marginBottom: '16px' }}>
            <BookOpen size={40} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0', color: '#166534' }}>Cổng Giáo Viên</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Đăng nhập để quản lý lớp chủ nhiệm</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Tên đăng nhập</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                required 
                placeholder="VD: gv.nguyenvana" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.3)' }}
          >
            {loading ? 'Đang xác thực...' : <><LogIn size={20} /> ĐĂNG NHẬP</>}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          * Tài khoản do Ban Giám Hiệu cấp.
        </div>
      </div>
    </div>
  );
}
