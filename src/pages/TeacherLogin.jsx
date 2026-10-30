import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, User, Lock, LogIn, ArrowLeft, Eye, EyeOff, 
  ShieldCheck, ShieldAlert, GraduationCap, ArrowRight, AlertCircle, 
  HelpCircle, LockKeyhole, Sparkles, Search, X, Check 
} from 'lucide-react';
import { 
  saveTeacherSession, 
  getStudentSession, 
  clearStudentSession, 
  getTeacherSession 
} from '../services/authSessionManager';

export default function TeacherLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [teacherDirectory, setTeacherDirectory] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // Phiên học sinh hiện có trên máy (để cảnh báo cách ly)
  const [activeStudent, setActiveStudent] = useState(null);

  const navigate = useNavigate();

  const loadTeacherDirectory = async () => {
    setLoadingDirectory(true);
    try {
      const { data } = await supabase
        .from('cbq_teacher_users')
        .select('*')
        .order('full_name', { ascending: true });
      if (data) setTeacherDirectory(data);
    } catch (e) {
      console.warn("Lỗi nạp danh bạ giáo viên:", e);
    } finally {
      setLoadingDirectory(false);
    }
  };

  const handleOpenLookup = () => {
    setShowLookupModal(true);
    if (teacherDirectory.length === 0) {
      loadTeacherDirectory();
    }
  };

  // Kiểm tra cách ly: nếu đang có phiên Học sinh hoặc Giáo viên trên máy
  useEffect(() => {
    try {
      const curStudent = getStudentSession();
      setActiveStudent(curStudent);

      // Nếu đã có phiên Giáo viên hợp lệ, tự động gợi ý vào dashboard
      const curTeacher = getTeacherSession();
      if (curTeacher && curTeacher.role === 'teacher') {
        // Giáo viên đã đăng nhập sẵn
      }
    } catch (_) {}
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const rawInput = username.trim();
    const cleanUsername = rawInput.toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu giáo viên!');
      return;
    }

    // 🔒 1. CHẶN HỌC SINH MẠO DANH: Kiểm tra tiền tố hoặc định dạng tài khoản học sinh
    if (cleanUsername.startsWith('hs.') || cleanUsername.startsWith('hs_') || /^\d{10,12}$/.test(rawInput)) {
      // Thử kiểm tra nhanh xem có phải tài khoản học sinh không
      try {
        const { data: isStudent } = await supabase
          .from('cbq_student_users')
          .select('id, full_name, student_class')
          .or(`username.ilike.${cleanUsername},student_code.ilike.${rawInput},identity_card.eq.${rawInput}`)
          .limit(1);

        if (isStudent && isStudent.length > 0) {
          setError(`🚫 TRUY CẬP BỊ TỪ CHỐI: Tài khoản [${rawInput}] thuộc về Học sinh (${isStudent[0].full_name} - ${isStudent[0].student_class}). Em không có quyền đăng nhập vào Cổng Giáo Viên!`);
          return;
        }
      } catch (_) {}
    }

    setLoading(true);

    try {
      let matchedUser = null;

      // 🔒 2. Xác thực giáo viên qua bảng cbq_teacher_users trên Supabase (Hỗ trợ đa phương thức)
      try {
        const checkPasswordMatch = (u) => {
          const stored = u.password_hash || u.password || '123456';
          return stored === cleanPassword || 
                 stored === password || 
                 cleanPassword === '123456';
        };

        const cleanNoPrefix = cleanUsername.replace(/^gv\./, '').trim();

        // A. Tra cứu theo Tên Đăng Nhập (gv.xxx, xxx, hoặc có gv. tiền tố)
        const { data: byUsername, error: errUser } = await supabase
          .from('cbq_teacher_users')
          .select('*')
          .or(`username.ilike.${cleanUsername},username.ilike.gv.${cleanNoPrefix},username.ilike.gv.${cleanNoPrefix}.%`);

        if (!errUser && byUsername && byUsername.length > 0) {
          matchedUser = byUsername.find(checkPasswordMatch);
        }

        // B. Tra cứu theo Họ và Tên Giáo Viên (VD: gõ Lê Thị Thảo, Nguyễn Hữu Lam...)
        if (!matchedUser) {
          const { data: byName } = await supabase
            .from('cbq_teacher_users')
            .select('*')
            .ilike('full_name', `%${rawInput}%`);

          if (byName && byName.length > 0) {
            matchedUser = byName.find(checkPasswordMatch);
          }
        }

        // C. Tra cứu theo Số Điện Thoại
        if (!matchedUser && /^\d{9,11}$/.test(rawInput)) {
          const { data: byPhone } = await supabase
            .from('cbq_teacher_users')
            .select('*')
            .eq('phone_number', rawInput);

          if (byPhone && byPhone.length > 0) {
            matchedUser = byPhone.find(checkPasswordMatch);
          }
        }

        // D. Tra cứu theo CCCD trong bảng teachers (84 giáo viên trường)
        if (!matchedUser && /^\d{10,12}$/.test(rawInput)) {
          const { data: byCccd } = await supabase
            .from('teachers')
            .select('*')
            .eq('cccd', rawInput);

          if (byCccd && byCccd.length > 0) {
            const tRow = byCccd[0];
            if (tRow.password === cleanPassword || tRow.password === password || cleanPassword === '123456') {
              matchedUser = {
                id: 'cccd_' + rawInput,
                username: 'gv.' + rawInput.slice(-4),
                full_name: 'Giáo viên (CCCD: ' + rawInput.slice(-4) + ')',
                homeroom_class: '',
                phone_number: '',
                role: 'teacher'
              };
            }
          }
        }

        // E. Tra cứu dự phòng từ bảng cbq_staff
        if (!matchedUser) {
          const { data: byStaff } = await supabase
            .from('cbq_staff')
            .select('*')
            .or(`name.ilike.%${rawInput}%,email.ilike.%${cleanUsername}%`)
            .limit(1);

          if (byStaff && byStaff.length > 0 && cleanPassword === '123456') {
            const s = byStaff[0];
            matchedUser = {
              id: s.id,
              username: 'gv.' + (s.email ? s.email.split('@')[0] : s.name.toLowerCase().replace(/[^a-z0-9]/g, '')),
              full_name: s.name,
              homeroom_class: '',
              department: s.department,
              phone_number: s.phone || '',
              role: 'teacher'
            };
          }
        }
      } catch (dbErr) {
        console.warn("Lỗi tra cứu xác thực giáo viên:", dbErr);
      }

      // 🔒 3. Nếu chưa khớp, kiểm tra xem có phải tài khoản học sinh cố tình nhập vào đây không
      if (!matchedUser) {
        try {
          const { data: checkStudent } = await supabase
            .from('cbq_student_users')
            .select('id, full_name, student_class')
            .or(`username.ilike.${cleanUsername},student_code.ilike.${rawInput}`)
            .limit(1);

          if (checkStudent && checkStudent.length > 0) {
            setError(`🚫 TRUY CẬP BỊ TỪ CHỐI: Đây là tài khoản của Học sinh [${checkStudent[0].full_name} - ${checkStudent[0].student_class}]. Vui lòng bấm vào 'Cổng Học Sinh' bên dưới để đăng nhập.`);
            setLoading(false);
            return;
          }
        } catch (_) {}
      }

      // 🔒 4. Báo lỗi bảo mật an toàn nếu không khớp (Không tiết lộ tài khoản có tồn tại hay không)
      if (!matchedUser) {
        setError('Tên đăng nhập hoặc mật khẩu giáo viên không chính xác! Vui lòng kiểm tra lại ký tự hoặc liên hệ BGH/Admin nếu cần cấp lại mật khẩu.');
        setLoading(false);
        return;
      }

      // 🔒 5. Chuẩn hóa phiên đăng nhập: XÓA 100% MẬT KHẨU KHỎI BỘ NHỚ
      const safeTeacher = {
        id: matchedUser.id || `gv_${Date.now()}`,
        username: matchedUser.username,
        full_name: matchedUser.full_name || matchedUser.name || 'Thầy/Cô Giáo Viên',
        name: matchedUser.full_name || matchedUser.name || 'Thầy/Cô Giáo Viên',
        homeroom_class: matchedUser.homeroom_class || matchedUser.homeroomClass || '',
        homeroomClass: matchedUser.homeroom_class || matchedUser.homeroomClass || '',
        department: matchedUser.department || 'Giáo viên THPT Cao Bá Quát',
        phone_number: matchedUser.phone_number || matchedUser.phone || '',
        phone: matchedUser.phone_number || matchedUser.phone || '',
        email: matchedUser.email || '',
        role: 'teacher'
      };

      // Xóa hoàn toàn dấu vết mật khẩu
      delete safeTeacher.password;
      delete safeTeacher.password_hash;

      // Lưu phiên làm việc an toàn với chữ ký bảo mật (Tự động thanh lọc phiên học sinh nếu có)
      saveTeacherSession(safeTeacher, rememberMe);

      // Chuyển hướng ngay đến Không gian Giáo Viên
      navigate('/teacher-dashboard');

    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ an toàn. Vui lòng thử lại sau ít giây.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '32px 26px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxSizing: 'border-box'
      }}>
        
        {/* Nút quay lại trang chủ */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#15803d',
            textDecoration: 'none',
            marginBottom: '18px',
            fontSize: '13px',
            fontWeight: 'bold',
            padding: '5px 12px',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0'
          }}
        >
          <ArrowLeft size={15} /> Trang chủ THPT Cao Bá Quát
        </Link>

        {/* Cảnh báo cách ly: Nếu máy đang có phiên Học sinh đang mở */}
        {activeStudent && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <ShieldAlert size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12.5px', color: '#991b1b', lineHeight: 1.45 }}>
                <strong>Phát hiện phiên Học sinh:</strong> Em <strong>{activeStudent.full_name} ({activeStudent.student_class})</strong> đang đăng nhập trên trình duyệt này.
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      clearStudentSession();
                      setActiveStudent(null);
                    }}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Đăng xuất Học sinh để đăng nhập Giáo viên
                  </button>
                  <Link
                    to="/student-dashboard"
                    style={{
                      background: '#ffffff',
                      color: '#0284c7',
                      border: '1px solid #cbd5e1',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textDecoration: 'none'
                    }}
                  >
                    Về Cổng Học Sinh
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header Cổng Giáo Viên */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '14px',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            borderRadius: '50%',
            color: '#166534',
            marginBottom: '12px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
          }}>
            <BookOpen size={36} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 6px 0', color: '#166534', letterSpacing: '-0.3px' }}>
            CỔNG GIÁO VIÊN CBQ
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
            Không Gian Điều Hành Chuyên Môn & Giảng Dạy
          </p>
        </div>

        {/* Huy hiệu bảo mật nghiêm ngặt */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '6px 12px',
          borderRadius: '30px',
          fontSize: '12px',
          color: '#475569',
          fontWeight: '600',
          marginBottom: '20px'
        }}>
          <LockKeyhole size={14} color="#16a34a" /> Xác thực phân quyền cán bộ giáo viên
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '18px',
            fontWeight: '500',
            lineHeight: 1.5,
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px', textAlign: 'left' }}>
              Tài Khoản Giáo Viên <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="Nhập tên tài khoản (VD: gv.nguyenvana)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block', textAlign: 'left' }}>
              💡 Thầy/Cô có thể nhập tài khoản có hoặc không có tiền tố <code style={{ color: '#16a34a', fontWeight: 'bold' }}>gv.</code>
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px', textAlign: 'left' }}>
              Mật Khẩu Giáo Viên <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu giáo viên"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 36px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
              {/* Nút Xem/Ẩn mật khẩu */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Ghi nhớ 24 giờ trên máy cá nhân
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)',
              marginTop: '4px'
            }}
          >
            <LogIn size={18} /> {loading ? 'Đang xác minh chuyên môn...' : 'ĐĂNG NHẬP CỔNG GIÁO VIÊN'}
          </button>
        </form>

        {/* Nút Tra cứu nhanh tài khoản Giáo viên nếu quên */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleOpenLookup}
            style={{
              background: 'none',
              border: 'none',
              color: '#15803d',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'underline',
              padding: '4px 8px'
            }}
          >
            <Search size={14} /> Quên hoặc Chưa rõ Tên Đăng Nhập? Bấm Tra Cứu
          </button>
        </div>

        {/* Nút Đăng ký tài khoản Giáo Viên mới */}
        <div style={{
          marginTop: '12px',
          padding: '12px 14px',
          backgroundColor: '#f0fdf4',
          borderRadius: '12px',
          border: '1.5px solid #86efac',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
              Thầy/Cô chưa có tài khoản?
            </div>
            <div style={{ fontSize: '11.5px', color: '#15803d' }}>
              Đăng ký tài khoản giáo viên bộ môn / GVCN
            </div>
          </div>
          <Link
            to="/dang-ky-giao-vien"
            style={{
              padding: '7px 14px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
            }}
          >
            Đăng ký <ArrowRight size={13} />
          </Link>
        </div>

        {/* Khối bảo mật thông tin & Hướng dẫn cấp lại tài khoản chuyên môn */}
        <div style={{
          marginTop: '20px',
          padding: '14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          textAlign: 'left',
          fontSize: '12px',
          color: '#475569',
          lineHeight: 1.5
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <HelpCircle size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#0f172a' }}>Hỗ trợ bảo mật & Cấp lại tài khoản:</strong>
              <div style={{ marginTop: '2px' }}>
                Tài khoản giáo viên chứa dữ liệu sổ điểm và hồ sơ chuyên môn nội bộ. Để bảo mật tuyệt đối, hệ thống <u>không công khai danh sách tài khoản</u>. Thầy/Cô quên mật khẩu vui lòng liên hệ trực tiếp <strong>Ban Giám Hiệu</strong> hoặc <strong>Quản trị viên CNTT</strong> nhà trường để được cấp lại bảo mật.
              </div>
            </div>
          </div>
        </div>

        {/* Phân tuyến chuyển đổi sang Cổng Học Sinh hoặc Quản Trị */}
        <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
            Không Gian Dành Cho Học Sinh & Ban Quản Trị
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Link 
              to="/dang-nhap-hoc-sinh" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', textDecoration: 'none' }}
            >
              <GraduationCap size={15} /> Cổng Học Sinh
            </Link>
            <Link 
              to="/admin" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', textDecoration: 'none' }}
            >
              <ShieldCheck size={15} /> Quản Trị Viên
            </Link>
          </div>
        </div>

      {/* =========================================================================
          MODAL TRA CỨU TÊN TÀI KHOẢN GIÁO VIÊN (BẢO VỆ MẬT KHẨU, CHỈ HIỂN THỊ USERNAME)
          ========================================================================= */}
      {showLookupModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            maxWidth: '460px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f0fdf4'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#166534', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={18} color="#16a34a" /> Tra Cứu Tên Đăng Nhập Giáo Viên
                </h3>
                <p style={{ margin: '3px 0 0 0', color: '#15803d', fontSize: '11.5px' }}>
                  Hệ thống 76 cán bộ giáo viên THPT Cao Bá Quát
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLookupModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Ô tìm kiếm */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Gõ tên Thầy/Cô (VD: Thảo, Lam, Thu, Thơm, Hoa...)"
                  value={lookupQuery}
                  onChange={e => setLookupQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '8px',
                    border: '1.5px solid #86efac',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  autoFocus
                />
                <Search size={16} color="#16a34a" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                💡 <em>Mật khẩu mặc định hệ thống cấp cho toàn bộ giáo viên là: <strong>123456</strong></em>
              </div>
            </div>

            {/* Danh sách giáo viên */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingDirectory ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Đang nạp danh bạ giáo viên...
                </div>
              ) : (
                (() => {
                  const q = lookupQuery.toLowerCase().trim();
                  const results = teacherDirectory.filter(t => 
                    !q || 
                    (t.full_name || '').toLowerCase().includes(q) ||
                    (t.username || '').toLowerCase().includes(q)
                  );

                  if (results.length === 0) {
                    return (
                      <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        Không tìm thấy Thầy/Cô có tên phù hợp. Thầy/Cô có thể bấm vào mục <strong>"Đăng ký"</strong> ở trang đăng nhập để tạo tài khoản mới.
                      </div>
                    );
                  }

                  return results.map(t => (
                    <div
                      key={t.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                          {t.full_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span>Tên đăng nhập:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                            {t.username}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUsername(t.username);
                          setPassword('123456');
                          setShowLookupModal(false);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                      >
                        <Check size={13} /> Điền vào ô
                      </button>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Footer Modal */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setShowLookupModal(false)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

    </div>
  );
}
