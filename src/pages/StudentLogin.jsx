import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Sparkles, User, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.username.trim() || !formData.password) {
      setErrorMsg("Vui lòng nhập Tên đăng nhập và Mật khẩu.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanUsername = formData.username.trim().toLowerCase();

      // Check DB table
      const { data: dbUsers } = await supabase
        .from('cbq_student_users')
        .select('*')
        .eq('username', cleanUsername)
        .eq('password', formData.password)
        .limit(1);

      let foundUser = dbUsers && dbUsers.length > 0 ? dbUsers[0] : null;

      // Fallback check local storage
      if (!foundUser) {
        const localAccounts = JSON.parse(localStorage.getItem('cbq_student_accounts') || '[]');
        foundUser = localAccounts.find(u => u.username === cleanUsername && u.password === formData.password);
      }

      if (!foundUser) {
        setErrorMsg("Tên đăng nhập hoặc mật khẩu không chính xác!");
        setSubmitting(false);
        return;
      }

      // Save session
      localStorage.setItem('cbq_current_student', JSON.stringify(foundUser));
      alert(`👋 ĐĂNG NHẬP THÀNH CÔNG!\n\nChào mừng bạn ${foundUser.full_name} (${foundUser.student_class}).`);
      navigate('/binh-chon');

    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi khi đăng nhập: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '50px auto', padding: '0 16px' }}>
      
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #be123c 100%)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(30, 27, 75, 0.2)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={14} color="#fde047" /> THPT CAO BÁ QUÁT - 30 NĂM
        </div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontFamily: 'Playfair Display, Georgia, serif' }}>
          🔐 ĐĂNG NHẬP TÀI KHOẢN
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
          Đăng nhập tài khoản để thả tim bình chọn cho sản phẩm sáng tạo
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '0 0 20px 20px', border: '1px solid #e2e8f0', borderTop: 'none', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '16px', fontWeight: '500' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Tên Đăng Nhập / Số Điện Thoại
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                required 
                placeholder="VD: 0901234567 hoặc an12a1"
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                style={{ width: '100%', padding: '11px 11px 11px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Mật Khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                required 
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                style={{ width: '100%', padding: '11px 11px 11px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.3)' }}
          >
            <LogIn size={18} /> {submitting ? 'Đang xác minh...' : 'ĐĂNG NHẬP TÀI KHOẢN'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '20px', paddingTop: '16px', textAlign: 'center', fontSize: '13.5px', color: '#64748b' }}>
          Chưa có tài khoản?{' '}
          <Link to="/dang-ky" style={{ color: '#be123c', fontWeight: 'bold', textDecoration: 'none' }}>
            Đăng ký ngay 👤
          </Link>
        </div>
      </div>

    </div>
  );
}
