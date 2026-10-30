import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LogIn, Sparkles, User, Lock, GraduationCap, Briefcase, 
  ShieldCheck, AlertCircle, ArrowRight, Eye, EyeOff, Search, 
  X, Check, HelpCircle, Users, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getTeacherSession, clearTeacherSession, saveStudentSession } from '../services/authSessionManager';

export default function StudentLogin() {
  const navigate = useNavigate();
  const passwordInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState(null);

  // Modal tra cứu tài khoản học sinh nhanh theo Lớp
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupSearch, setLookupSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [studentDirectory, setStudentDirectory] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

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

  // Tải danh bạ học sinh đã đăng ký tài khoản từ Supabase để hỗ trợ tra cứu nhanh
  const loadStudentDirectory = async () => {
    setLoadingDirectory(true);
    try {
      const { data: users, error } = await supabase
        .from('cbq_student_users')
        .select('id, username, full_name, student_class, student_code, created_at')
        .order('student_class', { ascending: true });

      if (!error && users) {
        setStudentDirectory(users);
      }
    } catch (err) {
      console.warn("Lỗi tải danh bạ học sinh:", err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  const handleOpenLookup = () => {
    setShowLookupModal(true);
    if (studentDirectory.length === 0) {
      loadStudentDirectory();
    }
  };

  // Trích xuất danh sách lớp duy nhất từ danh bạ
  const availableClasses = useMemo(() => {
    const set = new Set();
    studentDirectory.forEach(s => {
      if (s.student_class) {
        const clean = s.student_class.trim();
        set.add(clean);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  }, [studentDirectory]);

  // Bộ lọc tìm kiếm học sinh
  const filteredStudents = useMemo(() => {
    let list = studentDirectory;

    if (classFilter !== 'all') {
      const filterNorm = classFilter.toLowerCase().replace('lớp', '').trim();
      list = list.filter(s => {
        const clsNorm = (s.student_class || '').toLowerCase().replace('lớp', '').trim();
        return clsNorm === filterNorm;
      });
    }

    if (lookupSearch.trim()) {
      const q = lookupSearch.toLowerCase().trim();
      list = list.filter(s => 
        (s.full_name || '').toLowerCase().includes(q) ||
        (s.username || '').toLowerCase().includes(q) ||
        (s.student_code || '').toLowerCase().includes(q)
      );
    }

    return list.slice(0, 50); // Giới hạn 50 kết quả mượt mà
  }, [studentDirectory, classFilter, lookupSearch]);

  const handleSelectStudent = (user) => {
    setFormData(prev => ({ ...prev, username: user.username }));
    setShowLookupModal(false);
    setErrorMsg('');
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 150);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const rawInput = formData.username.trim();
    const cleanUsername = rawInput.toLowerCase();
    const rawPassword = formData.password.trim();

    if (!rawInput || !rawPassword) {
      setErrorMsg("Vui lòng nhập Tên đăng nhập (hoặc Mã HS / SĐT) và Mật khẩu.");
      return;
    }

    // Cảnh báo nếu nhập nhầm tài khoản giáo viên 'gv.'
    if (cleanUsername.startsWith('gv.')) {
      setErrorMsg("⚠️ Tài khoản có tiền tố 'gv.' là của Giáo viên. Vui lòng bấm vào 'Cổng Giáo Viên' bên dưới để đăng nhập.");
      return;
    }

    setSubmitting(true);
    try {
      let foundUser = null;
      let candidates = [];

      // 1. Tìm kiếm đa năng trên Supabase (cbq_student_users)
      try {
        // A. Tìm theo username (không phân biệt hoa/thường)
        const { data: byUsername } = await supabase
          .from('cbq_student_users')
          .select('*')
          .ilike('username', cleanUsername);

        if (byUsername && byUsername.length > 0) {
          candidates.push(...byUsername);
        }

        // B. Tìm theo mã học sinh (student_code)
        if (candidates.length === 0) {
          const { data: byCode } = await supabase
            .from('cbq_student_users')
            .select('*')
            .ilike('student_code', rawInput);

          if (byCode && byCode.length > 0) {
            candidates.push(...byCode);
          }
        }

        // C. Tìm theo số CCCD (nếu nhập dãy số 9-12 chữ số)
        if (candidates.length === 0 && /^\d{9,12}$/.test(rawInput)) {
          const { data: byCccd } = await supabase
            .from('cbq_student_users')
            .select('*')
            .eq('identity_card', rawInput);

          if (byCccd && byCccd.length > 0) {
            candidates.push(...byCccd);
          }
        }

        // D. Tìm theo số điện thoại (phone, parent_phone, father_phone)
        if (candidates.length === 0 && /^\d{9,11}$/.test(rawInput)) {
          const { data: byPhone } = await supabase
            .from('cbq_student_users')
            .select('*')
            .or(`phone.eq.${rawInput},parent_phone.eq.${rawInput},father_phone.eq.${rawInput}`);

          if (byPhone && byPhone.length > 0) {
            candidates.push(...byPhone);
          }
        }

        // E. Tìm theo họ và tên học sinh nếu nhập tiếng Việt
        if (candidates.length === 0 && rawInput.length >= 3) {
          const { data: byName } = await supabase
            .from('cbq_student_users')
            .select('*')
            .ilike('full_name', `%${rawInput}%`);

          if (byName && byName.length > 0) {
            candidates.push(...byName);
          }
        }
      } catch (dbErr) {
        console.warn("Lỗi tra cứu bảng cbq_student_users:", dbErr);
      }

      // 2. Đối soát mật khẩu với các tài khoản tìm thấy
      if (candidates.length > 0) {
        foundUser = candidates.find(u => 
          u.password === rawPassword || 
          u.password === formData.password ||
          u.password_hash === rawPassword
        );

        if (!foundUser) {
          setErrorMsg("⚠️ Mật khẩu không chính xác! Hãy bấm vào biểu tượng con mắt 👁️ để xem lại mật khẩu vừa nhập.");
          setSubmitting(false);
          return;
        }
      }

      // 3. Dự phòng tra cứu localStorage nếu ngoại tuyến
      if (!foundUser) {
        const localAccounts = JSON.parse(localStorage.getItem('cbq_student_accounts') || '[]');
        foundUser = localAccounts.find(u => 
          (u.username?.toLowerCase() === cleanUsername || 
           u.student_code?.toLowerCase() === cleanUsername ||
           u.identity_card === rawInput ||
           u.phone === rawInput) && 
          (u.password === rawPassword || u.password === formData.password)
        );
      }

      // 4. Nếu không tìm thấy, kiểm tra xem có phải tài khoản Giáo viên cố nhập nhầm không
      if (!foundUser) {
        try {
          const { data: isTeacher } = await supabase
            .from('cbq_teacher_users')
            .select('id, full_name')
            .or(`username.ilike.${cleanUsername},username.ilike.gv.${cleanUsername}`)
            .limit(1);

          if (isTeacher && isTeacher.length > 0) {
            setErrorMsg(`🚫 ĐÂY LÀ TÀI KHOẢN GIÁO VIÊN: Tài khoản này thuộc về Thầy/Cô [${isTeacher[0].full_name}]. Thầy/Cô vui lòng bấm vào 'Cổng Giáo Viên' bên dưới để thực hiện công tác chuyên môn.`);
            setSubmitting(false);
            return;
          }
        } catch (_) {}
      }

      if (!foundUser) {
        setErrorMsg("⚠️ Không tìm thấy tài khoản học sinh phù hợp. Em có thể bấm 'Tra cứu tài khoản theo Lớp' bên dưới hoặc Đăng ký tài khoản mới.");
        setSubmitting(false);
        return;
      }

      // Chuẩn hóa và làm sạch thông tin (xóa mật khẩu khỏi phiên)
      const safeStudent = { ...foundUser };
      delete safeStudent.password;
      delete safeStudent.password_hash;

      // Lưu phiên học sinh an toàn (TTL 2 giờ, đồng bộ Navbar)
      saveStudentSession(safeStudent);

      navigate('/student-dashboard');

    } catch (err) {
      console.error(err);
      setErrorMsg("Lỗi khi đăng nhập: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '30px auto', padding: '0 16px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Nút quay lại trang chủ */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#0284c7',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            padding: '5px 12px',
            borderRadius: '8px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd'
          }}
        >
          <ArrowLeft size={15} /> Trang chủ THPT Cao Bá Quát
        </Link>
      </div>

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
              <strong>Phát hiện phiên Giáo viên:</strong> Thầy/Cô <strong>{currentTeacher.full_name || currentTeacher.username}</strong> đang đăng nhập trên máy này.
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
        <h2 style={{ margin: '0 0 6px 0', fontSize: '23px', color: '#fde047', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <GraduationCap size={28} /> CỔNG ĐĂNG NHẬP HỌC SINH
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#e0f2fe', fontWeight: '500' }}>
          Không Gian Số Dành Cho Học Sinh & Cán Bộ Lớp
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '0 0 20px 20px', border: '1px solid #e2e8f0', borderTop: 'none', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {/* Banner hướng dẫn linh hoạt */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '18px',
          fontSize: '12.5px',
          color: '#1e40af',
          lineHeight: 1.5
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Đăng nhập đa phương thức:</strong> Em có thể nhập <strong>Tên đăng nhập</strong>, <strong>Mã học sinh</strong>, hoặc <strong>Số điện thoại / CCCD</strong> đã dùng khi đăng ký.
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', fontWeight: '500', lineHeight: 1.5 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                Tài Khoản Học Sinh <span style={{ color: '#ef4444' }}>*</span>
              </label>
              
              {/* Nút bấm mở modal tra cứu tài khoản nhanh */}
              <button
                type="button"
                onClick={handleOpenLookup}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <Search size={13} /> Tra cứu theo Lớp
              </button>
            </div>

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
                placeholder="Nhập Username, Mã HS hoặc SĐT"
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              💡 Ví dụ: <code style={{ color: '#0369a1', fontWeight: 'bold' }}>hs12a101</code>, số điện thoại hoặc mã học sinh.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Mật Khẩu Học Sinh <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"} 
                name="cbq_student_secret_input"
                id="cbq_student_secret_input"
                autoComplete="new-password"
                required 
                placeholder="Nhập mật khẩu học sinh"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                style={{ width: '100%', padding: '12px 42px 12px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
              />
              {/* Nút Xem / Ẩn mật khẩu tối ưu cho màn hình cảm ứng điện thoại */}
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
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

        {/* Nút hỗ trợ quên tên đăng nhập nhanh */}
        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button
            type="button"
            onClick={handleOpenLookup}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0369a1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HelpCircle size={15} /> Quên tên đăng nhập? Tra cứu theo Lớp
          </button>
        </div>

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

      {/* =========================================================================
          MODAL TRA CỨU TÀI KHOẢN HỌC SINH THEO LỚP CHO NGƯỜI DÙNG ĐIỆN THOẠI
          ========================================================================= */}
      {showLookupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '14px 18px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} color="#fde047" /> Tra Cứu Tài Khoản Học Sinh
              </div>
              <button
                type="button"
                onClick={() => setShowLookupModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '12px', lineHeight: '1.4' }}>
                Em hãy chọn Lớp hoặc gõ tên của mình để tìm tài khoản đã đăng ký. Bấm <strong>"Chọn"</strong> để tự động điền Tên đăng nhập.
              </div>

              {/* Bộ lọc Lớp & Ô tìm kiếm tên */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    backgroundColor: '#f8fafc',
                    fontWeight: '600'
                  }}
                >
                  <option value="all">-- Tất cả các Lớp ({studentDirectory.length} tài khoản) --</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Nhập tên em (VD: Vương, Quân, Vy, An...)"
                    value={lookupSearch}
                    onChange={e => setLookupSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                </div>
              </div>

              {/* Danh sách học sinh */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                {loadingDirectory ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <RefreshCw size={16} className="animate-spin" /> Đang tải danh sách học sinh...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px', lineHeight: 1.5 }}>
                    Không tìm thấy học sinh phù hợp.
                    <div style={{ marginTop: '6px' }}>
                      <Link to="/dang-ky" onClick={() => setShowLookupModal(false)} style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'none' }}>
                        👉 Bấm vào đây để Đăng ký tài khoản mới
                      </Link>
                    </div>
                  </div>
                ) : (
                  filteredStudents.map((st) => (
                    <div
                      key={st.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {st.full_name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Lớp: <strong style={{ color: '#0284c7' }}>{st.student_class}</strong> • Tài khoản: <code style={{ color: '#0369a1', fontWeight: 'bold' }}>{st.username}</code>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectStudent(st)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        Chọn
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Tổng cộng: {studentDirectory.length} tài khoản đã đăng ký
              </span>
              <button
                type="button"
                onClick={() => setShowLookupModal(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12px',
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
  );
}
