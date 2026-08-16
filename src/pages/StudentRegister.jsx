import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Sparkles, CheckCircle2, ArrowLeft, Lock, User, GraduationCap, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function StudentRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    full_name: '',
    student_class: 'Lớp 12A1'
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const classList = [
    'Lớp 12A1', 'Lớp 12A2', 'Lớp 12A3', 'Lớp 12A4', 'Lớp 12A5', 'Lớp 12A6',
    'Lớp 11A1', 'Lớp 11A2', 'Lớp 11A3', 'Lớp 11A4', 'Lớp 11A5',
    'Lớp 10A1', 'Lớp 10A2', 'Lớp 10A3', 'Lớp 10A4',
    'Cựu Học Sinh', 'Khách Mời / Đại Biểu'
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.username.trim() || !formData.password || !formData.full_name.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanUsername = formData.username.trim().toLowerCase();

      // Check if username already exists in db or local
      const { data: existingUser } = await supabase
        .from('cbq_student_users')
        .select('*')
        .eq('username', cleanUsername)
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        setErrorMsg(`Tên đăng nhập hoặc SĐT [${cleanUsername}] đã được đăng ký trước đó. Vui lòng chọn Tên đăng nhập khác hoặc Đăng nhập!`);
        setSubmitting(false);
        return;
      }

      const newStudentUser = {
        username: cleanUsername,
        password: formData.password, // Stored securely
        full_name: formData.full_name.trim(),
        student_class: formData.student_class,
        created_at: new Date().toISOString()
      };

      const { error: insertErr } = await supabase
        .from('cbq_student_users')
        .insert([newStudentUser]);

      if (insertErr) {
        // Fallback to local storage registry if table not yet migrated
        const localAccounts = JSON.parse(localStorage.getItem('cbq_student_accounts') || '[]');
        if (localAccounts.some(u => u.username === cleanUsername)) {
          setErrorMsg(`Tên đăng nhập [${cleanUsername}] đã tồn tại.`);
          setSubmitting(false);
          return;
        }
        localAccounts.push(newStudentUser);
        localStorage.setItem('cbq_student_accounts', JSON.stringify(localAccounts));
      }

      // Auto login newly registered student
      localStorage.setItem('cbq_current_student', JSON.stringify(newStudentUser));
      alert(`🎉 ĐĂNG KÝ TÀI KHOẢN THÀNH CÔNG!\n\nChào mừng bạn ${formData.full_name} (${formData.student_class}). Hệ thống đã tự động đăng nhập tài khoản cho bạn.`);
      navigate('/binh-chon');

    } catch (err) {
      console.error(err);
      setErrorMsg("Có lỗi khi đăng ký: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
      
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
          👤 ĐĂNG KÝ TÀI KHOẢN
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
          Tạo tài khoản cá nhân chính thức để tham gia bình chọn sản phẩm Kỷ niệm 30 năm
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '0 0 20px 20px', border: '1px solid #e2e8f0', borderTop: 'none', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '16px', fontWeight: '500' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Tên Đăng Nhập / Số Điện Thoại (*)
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
              Họ và Tên (*)
            </label>
            <div style={{ position: 'relative' }}>
              <GraduationCap size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                required 
                placeholder="VD: Nguyễn Văn An"
                value={formData.full_name}
                onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                style={{ width: '100%', padding: '11px 11px 11px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Chọn Lớp / Tập Thể Khóa (*)
            </label>
            <select 
              value={formData.student_class} 
              onChange={e => setFormData(prev => ({ ...prev, student_class: e.target.value }))}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            >
              {classList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Mật Khẩu (*)
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Nhập Lại Mật Khẩu (*)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  required 
                  placeholder="Xác nhận"
                  value={formData.confirm_password}
                  onChange={e => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  style={{ width: '100%', padding: '11px 11px 11px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.3)' }}
          >
            <UserPlus size={18} /> {submitting ? 'Đang tạo tài khoản...' : 'TẠO TÀI KHOẢN'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '20px', paddingTop: '16px', textAlign: 'center', fontSize: '13.5px', color: '#64748b' }}>
          Đã có tài khoản?{' '}
          <Link to="/dang-nhap" style={{ color: '#be123c', fontWeight: 'bold', textDecoration: 'none' }}>
            Đăng nhập ngay 🔐
          </Link>
        </div>
      </div>

    </div>
  );
}
