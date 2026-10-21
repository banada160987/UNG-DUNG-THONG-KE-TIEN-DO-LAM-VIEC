import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Sparkles, User, Lock, GraduationCap, Briefcase, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getTeacherSession, clearTeacherSession, saveStudentSession } from '../services/authSessionManager';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState(null);

  // Kiểm tra nếu trên máy đang có tài khoản Giáo viên hợp lệ để nhắc nhở tránh nhầm lẫn
  useEffect(() => {
    try {
      const activeTeacher = getTeacherSession();
      if (activeTeacher) {
        setCurrentTeacher(activeTeacher);
      } else {
        setCurrentTeacher(null);
      }
    } catch (_) {}
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.username.trim() || !formData.password) {
      setErrorMsg("Vui lòng nhập Tên đăng nhập (hoặc Mã học sinh) và Mật khẩu.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanUsername = formData.username.trim().toLowerCase();

      // Cảnh báo nếu nhập nhầm tài khoản giáo viên 'gv.'
      if (cleanUsername.startsWith('gv.')) {
        setErrorMsg("⚠️ Tài khoản có tiền tố 'gv.' là của Giáo viên. Vui lòng bấm vào Cổng Giáo Viên bên dưới để đăng nhập.");
        setSubmitting(false);
        return;
      }

      // 1. Try secure RPC first
      let foundUser = null;
      try {
        const { data: rpcUser, error: rpcErr } = await supabase.rpc('login_student', {
          p_username: cleanUsername,
          p_password: formData.password
        });
        if (!rpcErr && rpcUser && rpcUser.length > 0) {
          foundUser = rpcUser[0];
        }
      } catch (e) {
        // Fallback to table query if RPC not yet deployed
      }

      // 2. Direct table check
      if (!foundUser) {
        const { data: dbUsers } = await supabase
          .from('cbq_student_users')
          .select('id, username, full_name, student_class, role, student_code, password')
          .eq('username', cleanUsername)
          .eq('password', formData.password)
          .limit(1);

        if (dbUsers && dbUsers.length > 0) {
          foundUser = dbUsers[0];
        }
      }

      // 3. Fallback check local storage
      if (!foundUser) {
        const localAccounts = JSON.parse(localStorage.getItem('cbq_student_accounts') || '[]');
        foundUser = localAccounts.find(u => u.username === cleanUsername && u.password === formData.password);
      }

      if (!foundUser) {
        setErrorMsg("Tên đăng nhập hoặc mật khẩu học sinh không chính xác!");
        setSubmitting(false);
        return;
      }

      // Sanitize user object: remove password before saving to session
      const safeStudent = { ...foundUser };
      delete safeStudent.password;

      // Save sanitized session with smart expiration
      saveStudentSession(safeStudent);
      alert(`👋 ĐĂNG NHẬP THÀNH CÔNG!\n\nChào mừng em ${safeStudent.full_name} (${safeStudent.student_class}) đến với Cổng Học Sinh.`);
      navigate('/student-dashboard');

    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi khi đăng nhập: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 16px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Cảnh báo thân thiện nếu máy đang lưu phiên Giáo viên */}
      {currentTeacher && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Briefcase size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
              <strong>Phát hiện phiên Giáo viên:</strong> Thầy/Cô <strong>{currentTeacher.full_name || currentTeacher.username}</strong> đang đăng nhập trên trình duyệt này.
              <div style={{ marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#16a34a', color: 'white', padding: '5px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none' }}>
                  Vào Cổng Giáo Viên <ArrowRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearTeacherSession();
                    setCurrentTeacher(null);
                  }}
                  style={{ background: 'transparent', border: '1px solid #bbf7d0', color: '#15803d', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Đăng xuất Giáo viên
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Form */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #0284c7 100%)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(30, 27, 75, 0.2)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={14} color="#fde047" /> THPT CAO BÁ QUÁT - TỈNH ĐẮK LẮK
        </div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', color: '#fde047', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <GraduationCap size={28} /> CỔNG ĐĂNG NHẬP HỌC SINH
        </h2>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#e0f2fe', fontWeight: '500' }}>
          Không Gian Số Dành Cho Học Sinh & Cán Bộ Lớp
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '0 0 20px 20px', border: '1px solid #e2e8f0', borderTop: 'none', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {/* Banner phân định rõ đối tượng đăng nhập */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '20px',
          fontSize: '12.5px',
          color: '#1e40af',
          lineHeight: 1.5
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Lưu ý quan trọng:</strong> Đây là cổng dành riêng cho <strong>Học sinh / Ban cán sự lớp</strong>.
              <span style={{ display: 'block', color: '#475569', marginTop: '2px' }}>
                Học sinh dùng <strong>Mã học sinh</strong> hoặc <strong>Tên đăng nhập cá nhân</strong>. Hệ thống <u>không sử dụng tài khoản Giáo viên</u> tại đây.
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '16px', fontWeight: '500' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Mã Học Sinh / Tên Đăng Nhập / Số Điện Thoại
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                name="cbq_student_account_input"
                id="cbq_student_account_input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                required 
                placeholder="VD: hs12a101 hoặc an12a1"
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>
            <span style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              💡 Nhập mã học sinh hoặc tên do Lớp trưởng / Quản trị viên cấp
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Mật Khẩu Học Sinh
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                name="cbq_student_secret_input"
                id="cbq_student_secret_input"
                autoComplete="new-password"
                required 
                placeholder="Nhập mật khẩu học sinh"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #0284c7, #1e3a8a)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)' }}
          >
            <LogIn size={18} /> {submitting ? 'Đang xác minh...' : 'ĐĂNG NHẬP CỔNG HỌC SINH'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '20px', paddingTop: '16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Chưa có tài khoản học sinh?{' '}
          <Link to="/dang-ky" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'none' }}>
            Đăng ký tài khoản học sinh 👤
          </Link>
        </div>

        {/* Cổng đăng nhập khác dành cho Giáo viên & Quản trị */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
            Chuyển Đến Cổng Chuyên Môn Khác
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Link 
              to="/dang-nhap-giao-vien" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', textDecoration: 'none' }}
            >
              <Briefcase size={14} /> Cổng Giáo Viên
            </Link>
            <Link 
              to="/admin" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', textDecoration: 'none' }}
            >
              <ShieldCheck size={14} /> Quản Trị Viên
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
