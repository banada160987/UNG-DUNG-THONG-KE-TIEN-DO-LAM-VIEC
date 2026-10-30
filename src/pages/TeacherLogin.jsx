import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, User, Lock, LogIn, ArrowLeft, Eye, EyeOff, Search, Sparkles, X, Check, HelpCircle } from 'lucide-react';
import { saveTeacherSession } from '../services/authSessionManager';

export default function TeacherLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal tra cứu tài khoản giáo viên cho người dùng điện thoại
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupSearch, setLookupSearch] = useState('');
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const navigate = useNavigate();

  // Tải danh bạ giáo viên để hỗ trợ tra cứu nhanh khi cần
  useEffect(() => {
    async function loadStaffDirectory() {
      setLoadingStaff(true);
      try {
        const { data: users } = await supabase
          .from('cbq_teacher_users')
          .select('id, username, full_name, homeroom_class, phone_number')
          .order('id', { ascending: true });

        if (users && users.length > 0) {
          setStaffDirectory(users);
        } else {
          // Fallback nạp từ cbq_staff
          const { data: staff } = await supabase
            .from('cbq_staff')
            .select('name, department, email, phone')
            .order('sort_order', { ascending: true });

          if (staff && staff.length > 0) {
            const mapped = staff.map(s => {
              const prefix = s.email && s.email.includes('@') ? s.email.split('@')[0] : s.name;
              return {
                username: 'gv.' + prefix,
                full_name: s.name,
                department: s.department
              };
            });
            setStaffDirectory(mapped);
          }
        }
      } catch (err) {
        console.warn("Lỗi tải danh bạ giáo viên:", err);
      } finally {
        setLoadingStaff(false);
      }
    }
    loadStaffDirectory();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const rawInput = username.trim();
      const cleanUsername = rawInput.toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanUsername || !cleanPassword) {
        setError('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');
        setLoading(false);
        return;
      }

      let matchedUser = null;

      // 1. Tìm kiếm thông minh trong bảng cbq_teacher_users trên Supabase
      try {
        // A. Thử tìm chính xác username
        const { data: byUsername } = await supabase
          .from('cbq_teacher_users')
          .select('*')
          .ilike('username', cleanUsername);

        if (byUsername && byUsername.length > 0) {
          matchedUser = byUsername.find(u => 
            u.password_hash === cleanPassword || u.password === cleanPassword
          );
        }

        // B. Nếu chưa tìm thấy và người dùng gõ thiếu tiền tố 'gv.'
        if (!matchedUser && !cleanUsername.startsWith('gv.')) {
          const { data: byGvPrefix } = await supabase
            .from('cbq_teacher_users')
            .select('*')
            .ilike('username', 'gv.' + cleanUsername);

          if (byGvPrefix && byGvPrefix.length > 0) {
            matchedUser = byGvPrefix.find(u => 
              u.password_hash === cleanPassword || u.password === cleanPassword
            );
          }
        }

        // C. Tìm theo số điện thoại
        if (!matchedUser && /^\d+$/.test(rawInput)) {
          const { data: byPhone } = await supabase
            .from('cbq_teacher_users')
            .select('*')
            .eq('phone_number', rawInput);

          if (byPhone && byPhone.length > 0) {
            matchedUser = byPhone.find(u => 
              u.password_hash === cleanPassword || u.password === cleanPassword
            );
          }
        }

        // D. Tìm theo Họ và tên giáo viên
        if (!matchedUser) {
          const { data: byName } = await supabase
            .from('cbq_teacher_users')
            .select('*')
            .ilike('full_name', rawInput);

          if (byName && byName.length > 0) {
            matchedUser = byName.find(u => 
              u.password_hash === cleanPassword || u.password === cleanPassword
            );
          }
        }
      } catch (dbErr) {
        console.warn("Lỗi tra cứu Supabase cbq_teacher_users:", dbErr);
      }

      // 2. Tra cứu đối soát từ bảng danh bạ cbq_staff
      if (!matchedUser) {
        try {
          const { data: staffFound } = await supabase
            .from('cbq_staff')
            .select('*')
            .or(`email.ilike.${cleanUsername},email.ilike.${cleanUsername}@thptcaobaquat.edu.vn,phone.eq.${rawInput},name.ilike.%${rawInput}%`)
            .limit(1);

          if (staffFound && staffFound.length > 0) {
            const st = staffFound[0];
            // Thử tìm tài khoản giáo viên liên kết với tên này
            const { data: linkedUsers } = await supabase
              .from('cbq_teacher_users')
              .select('*')
              .ilike('full_name', st.name);

            if (linkedUsers && linkedUsers.length > 0) {
              matchedUser = linkedUsers.find(u => 
                u.password_hash === cleanPassword || u.password === cleanPassword
              );
            }

            // Nếu mật khẩu nhập là 123456 (mật khẩu mặc định hệ thống)
            if (!matchedUser && cleanPassword === '123456') {
              matchedUser = {
                id: st.id,
                username: 'gv.' + (st.email ? st.email.split('@')[0] : 'giaovien'),
                full_name: st.name,
                department: st.department,
                homeroom_class: st.homeroom_class || null,
                phone_number: st.phone || null
              };
            }
          }
        } catch (staffErr) {
          console.warn("Lỗi đối soát cbq_staff:", staffErr);
        }
      }

      // 3. Fallback sang LocalStorage (Nếu có lưu cục bộ trên máy này)
      if (!matchedUser) {
        try {
          const localAccounts = JSON.parse(localStorage.getItem('cbq_teacher_accounts') || '[]');
          const localMatch = localAccounts.find(u => 
            ((u.username || '').trim().toLowerCase() === cleanUsername || 
             (u.username || '').trim().toLowerCase() === 'gv.' + cleanUsername ||
             (u.full_name || '').trim().toLowerCase() === cleanUsername) &&
            (u.password_hash === cleanPassword || u.password === cleanPassword)
          );
          if (localMatch) {
            matchedUser = localMatch;
          }
        } catch {
          // ignore
        }
      }

      if (!matchedUser) {
        setError('Tài khoản hoặc mật khẩu không đúng! (Mẹo: Thầy/Cô có thể bấm vào "Quên tài khoản?" bên dưới để tra cứu tên tài khoản chính xác)');
        setLoading(false);
        return;
      }

      // 4. Chuẩn hóa đối tượng phiên đăng nhập an toàn
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

      // Lưu phiên làm việc an toàn
      saveTeacherSession(safeTeacher, rememberMe);

      // Chuyển hướng ngay đến Không gian Giáo Viên
      navigate('/teacher-dashboard');

    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau ít giây.');
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh bạ tra cứu
  const filteredStaff = useMemo(() => {
    if (!lookupSearch.trim()) return staffDirectory.slice(0, 15);
    const q = lookupSearch.toLowerCase().trim();
    return staffDirectory.filter(s => 
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.username || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q)
    );
  }, [staffDirectory, lookupSearch]);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '32px 24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
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
            marginBottom: '20px',
            fontSize: '13.5px',
            fontWeight: 'bold',
            padding: '4px 10px',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0'
          }}
        >
          <ArrowLeft size={16} /> Trang chủ
        </Link>
        
        {/* Header Cổng Giáo Viên */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '14px', background: '#dcfce7', borderRadius: '50%', color: '#15803d', marginBottom: '12px' }}>
            <BookOpen size={36} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 6px 0', color: '#166534' }}>
            Cổng Giáo Viên CBQ
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Đăng nhập để vào Báo giảng, Sổ điểm, Ra đề & Quản lý lớp
          </p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div style={{
            padding: '12px 14px',
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid #fecaca',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        {/* Form Đăng Nhập */}
        <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Ô Tên Đăng Nhập */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Tên đăng nhập (Tài khoản GV / SĐT / Email)
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                name="cbq_teacher_account_input"
                id="cbq_teacher_account_input"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                required 
                placeholder="VD: gv.hoangnam hoặc gv.nguyenvana..." 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
          </div>

          {/* Ô Mật Khẩu (Kèm nút xem/ẩn mật khẩu) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type={showPassword ? 'text' : 'password'}
                name="cbq_teacher_secret_input"
                id="cbq_teacher_secret_input"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 38px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Tùy chọn Ghi nhớ phiên 24h trên thiết bị cá nhân */}
          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                id="cbq_remember_teacher"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#16a34a' }}
              />
              <span style={{ fontWeight: '600' }}>Ghi nhớ phiên 24h trên điện thoại này</span>
            </label>
          </div>

          {/* Nút bấm Đăng Nhập */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 16px rgba(22, 163, 74, 0.3)',
              transition: 'transform 0.15s ease'
            }}
          >
            {loading ? (
              'Đang xác thực...'
            ) : (
              <>
                <LogIn size={18} /> ĐĂNG NHẬP GIÁO VIÊN
              </>
            )}
          </button>
        </form>
        
        {/* Nút hỗ trợ tra cứu nhanh tài khoản cho Giáo viên */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowLookupModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <HelpCircle size={15} /> Quên tài khoản? Bấm tra cứu tên Thầy/Cô
          </button>
        </div>

        {/* Đăng ký tài khoản giáo viên mới */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
          Chưa có tài khoản Giáo viên?{' '}
          <Link to="/dang-ky-giao-vien" style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'none' }}>
            Đăng ký ngay 📝
          </Link>
        </div>

        {/* Chuyển sang Cổng Học Sinh */}
        <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '18px', paddingTop: '14px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
          Em là Học sinh?{' '}
          <Link to="/dang-nhap-hoc-sinh" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'none' }}>
            Chuyển sang Cổng Học Sinh 🎓
          </Link>
        </div>

      </div>

      {/* =========================================================================
          MODAL TRA CỨU TÀI KHOẢN GIÁO VIÊN NHANH
          ========================================================================= */}
      {showLookupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '460px',
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
              backgroundColor: '#166534',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#fde047" /> Tra Cứu Tài Khoản Giáo Viên
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
                Thầy/Cô hãy tìm tên của mình bên dưới. Bấm <strong>"Chọn"</strong> để hệ thống tự động điền Tên đăng nhập. Mật khẩu khởi tạo chung là: <strong style={{ color: '#16a34a' }}>123456</strong>.
              </div>

              {/* Ô tìm kiếm */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Nhập tên Thầy/Cô (VD: Chuyên, Hoa, Nam...)"
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

              {/* Danh sách giáo viên */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                {loadingStaff ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                    Đang nạp danh sách Thầy/Cô...
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                    Không tìm thấy Thầy/Cô phù hợp
                  </div>
                ) : (
                  filteredStaff.map((st, idx) => (
                    <div
                      key={st.id || idx}
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
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#0f172a' }}>
                          {st.full_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Tài khoản: <code style={{ color: '#16a34a', fontWeight: 'bold' }}>{st.username}</code>
                          {st.homeroom_class && ` • Lớp ${st.homeroom_class}`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUsername(st.username);
                          setPassword('123456');
                          setShowLookupModal(false);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Chọn
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'right' }}>
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
