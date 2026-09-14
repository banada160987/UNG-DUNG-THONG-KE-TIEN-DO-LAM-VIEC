import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Sparkles, Lock, User, GraduationCap, Phone, IdCard, AlertCircle, ShieldAlert, CheckCircle2, Mail, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function TeacherRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    full_name: '',
    teacher_code: '',
    department: 'Tổ Toán',
    homeroom_class: '',
    phone: '',
    email: ''
  });

  const [departmentList, setDepartmentList] = useState([
    'Tổ Toán',
    'Tổ Ngữ Văn',
    'Tổ Tiếng Anh',
    'Tổ Vật Lý - Công Nghệ',
    'Tổ Hóa Học',
    'Tổ Sinh Học - Thể Dục',
    'Tổ Lịch Sử - Địa Lý - GDKTPL',
    'Tổ Tin Học',
    'BGH / Cán Bộ / Nhân Viên'
  ]);

  const [staffRoster, setStaffRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [alreadyRegisteredTeacher, setAlreadyRegisteredTeacher] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch teacher list when department changes
  useEffect(() => {
    fetchStaffByDepartment(formData.department);
  }, [formData.department]);

  const fetchStaffByDepartment = async (dept) => {
    setLoadingRoster(true);
    setSelectedStaffId('');
    setAlreadyRegisteredTeacher(null);
    setErrorMsg('');
    setFormData(prev => ({ ...prev, full_name: '', teacher_code: '', phone: '', email: '' }));

    try {
      const cleanDept = (dept || '').trim();
      const { data, error } = await supabase
        .from('cbq_staff')
        .select('*')
        .or(`department.ilike.%${cleanDept}%,department.eq.${cleanDept}`)
        .order('name', { ascending: true });

      let list = data || [];

      // If empty in DB or fallback local storage
      if (list.length === 0) {
        const localStaff = JSON.parse(localStorage.getItem('cbq_staff_data') || '[]');
        list = localStaff.filter(s => (s.department || '').includes(cleanDept));
      }

      setStaffRoster(list);
    } catch (err) {
      console.warn("Lỗi nạp danh sách giáo viên:", err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleStaffSelect = async (staffId) => {
    setSelectedStaffId(staffId);
    setAlreadyRegisteredTeacher(null);
    setErrorMsg('');

    if (!staffId) {
      setFormData(prev => ({
        ...prev,
        full_name: '',
        teacher_code: '',
        phone: '',
        email: ''
      }));
      return;
    }

    const selected = staffRoster.find(s => String(s.id) === String(staffId));
    if (selected) {
      const tName = selected.name || selected.full_name || '';
      const tCode = selected.staff_code || selected.teacher_code || `GV-${selected.id}`;
      const tPhone = selected.phone || '';
      const tEmail = selected.email || '';
      const tClass = selected.homeroom_class || selected.title?.match(/GVCN\s+Lớp\s+(\w+)/i)?.[1] || '';

      setFormData(prev => ({
        ...prev,
        full_name: tName,
        teacher_code: tCode,
        phone: tPhone || prev.phone,
        email: tEmail || prev.email,
        homeroom_class: tClass || prev.homeroom_class,
        username: prev.username || `gv.${tName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')}`
      }));

      // Check if teacher already has account
      if (selected.has_account) {
        setAlreadyRegisteredTeacher(selected);
        return;
      }

      // Check in cbq_teacher_users table
      try {
        const { data: users } = await supabase
          .from('cbq_teacher_users')
          .select('*')
          .or(`teacher_code.eq.${tCode},full_name.ilike.${tName}`)
          .limit(1);

        if (users && users.length > 0) {
          setAlreadyRegisteredTeacher(users[0]);
        }
      } catch (e) {
        console.warn("Check teacher user error:", e);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (alreadyRegisteredTeacher) {
      setErrorMsg(`Thầy/Cô [${formData.full_name}] đã tạo tài khoản trước đó. Vui lòng bấm Đăng Nhập hoặc liên hệ Admin để được hỗ trợ reset mật khẩu.`);
      return;
    }

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

      // 1. Check existing username
      const { data: existingUser } = await supabase
        .from('cbq_teacher_users')
        .select('*')
        .eq('username', cleanUsername)
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        setErrorMsg(`Tên đăng nhập [${cleanUsername}] đã được đăng ký trước đó. Vui lòng chọn Tên đăng nhập khác!`);
        setSubmitting(false);
        return;
      }

      // 2. Link with cbq_staff
      const finalTeacherCode = formData.teacher_code || `GV-${Date.now().toString().slice(-4)}`;

      if (selectedStaffId) {
        await supabase
          .from('cbq_staff')
          .update({
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            has_account: true,
            account_username: cleanUsername
          })
          .eq('id', selectedStaffId);
      }

      // 3. Create teacher account in cbq_teacher_users
      const newTeacherUser = {
        username: cleanUsername,
        password: formData.password,
        password_hash: formData.password,
        full_name: formData.full_name.trim(),
        teacher_code: finalTeacherCode,
        department: formData.department,
        homeroom_class: formData.homeroom_class.trim().toUpperCase(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        role: 'teacher',
        created_at: new Date().toISOString()
      };

      const { error: insertErr } = await supabase
        .from('cbq_teacher_users')
        .insert([newTeacherUser]);

      // Always save a local copy as backup so login works even if DB/network is unreachable
      const localTeacherAccounts = JSON.parse(localStorage.getItem('cbq_teacher_accounts') || '[]');
      if (!localTeacherAccounts.some(u => u.username === cleanUsername)) {
        localTeacherAccounts.push(newTeacherUser);
        localStorage.setItem('cbq_teacher_accounts', JSON.stringify(localTeacherAccounts));
      }

      // Auto login newly registered teacher
      localStorage.setItem('cbq_current_teacher', JSON.stringify(newTeacherUser));
      setSuccessMsg('🎉 Đăng ký tài khoản Giáo viên thành công! Đang chuyển hướng đến Cổng Giáo Viên...');

      setTimeout(() => {
        navigate('/teacher-dashboard');
      }, 1800);

    } catch (err) {
      console.error(err);
      setErrorMsg("Có lỗi khi đăng ký: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '30px auto', padding: '0 16px', fontFamily: '"Inter", sans-serif' }}>
      
      <div style={{
        background: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #047857 100%)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(22, 101, 52, 0.25)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={14} color="#fde047" /> THPT CAO BÁ QUÁT - CỔNG CÁN BỘ GIÁO VIÊN
        </div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', color: '#ffffff', fontWeight: '800' }}>
          📚 ĐĂNG KÝ TÀI KHOẢN GIÁO VIÊN
        </h2>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#dcfce7', fontWeight: '500' }}>
          Tự động ghép nối Danh sách Cán bộ Giáo viên Nhà trường
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '0 0 20px 20px', border: '1px solid #e2e8f0', borderTop: 'none', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '16px', fontWeight: '500', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <div>{successMsg}</div>
          </div>
        )}

        {alreadyRegisteredTeacher && (
          <div style={{ background: '#fff1f2', border: '1.5px solid #f43f5e', color: '#881337', padding: '14px 16px', borderRadius: '12px', fontSize: '13.5px', marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <ShieldAlert size={22} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e11d48', marginBottom: '2px' }}>
                🛑 THẦY/CÔ ĐÃ CÓ TÀI KHOẢN TRÊN HỆ THỐNG!
              </div>
              Thầy/Cô <strong>{formData.full_name}</strong> ({formData.department}) đã được tạo tài khoản thành công.
              <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#475569' }}>
                💡 Nếu Thầy/Cô quên mật khẩu, vui lòng liên hệ <strong>Admin Quản trị nhà trường</strong> để được hỗ trợ cấp lại mật khẩu.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* DEPARTMENT SELECT */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              1. Chọn Tổ Chuyên Môn / Bộ Môn (*)
            </label>
            <select 
              value={formData.department} 
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontWeight: 'bold', color: '#166534' }}
            >
              {departmentList.map(dept => (
                <option key={dept} value={dept}>🏫 {dept}</option>
              ))}
            </select>
          </div>

          {/* DYNAMIC TEACHER ROSTER DROPDOWN */}
          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1.5px solid #bbf7d0' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>
              2. Chọn Tên Giáo Viên từ Danh Sách {formData.department} ({staffRoster.length} cán bộ) (*)
            </label>
            
            {loadingRoster ? (
              <div style={{ fontSize: '13px', color: '#166534', fontStyle: 'italic', padding: '8px 0' }}>
                ⏳ Đang tải danh sách giáo viên {formData.department}...
              </div>
            ) : staffRoster.length > 0 ? (
              <select 
                value={selectedStaffId}
                onChange={e => handleStaffSelect(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: selectedStaffId ? '2px solid #16a34a' : '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ffffff' }}
              >
                <option value="">-- Click để chọn đúng Họ và Tên của Thầy/Cô --</option>
                {staffRoster.map((s, index) => {
                  const sName = s.name || s.full_name || '';
                  const sCode = s.staff_code || s.teacher_code || '';
                  const sTitle = s.title ? ` (${s.title})` : '';
                  const isRegistered = s.has_account;
                  return (
                    <option key={s.id || index} value={s.id} style={{ color: isRegistered ? '#94a3b8' : '#0f172a' }}>
                      {index + 1}. {sName} {sCode ? `(Mã GV: ${sCode})` : ''}{sTitle} {isRegistered ? '--- 🛑 [ĐÃ CÓ TK]' : ''}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div style={{ fontSize: '12.5px', color: '#475569', padding: '4px 0' }}>
                ℹ️ Chưa thấy danh sách giáo viên mẫu từ Admin. Thầy/Cô có thể tự nhập Họ tên bên dưới:
              </div>
            )}
          </div>

          {/* FULL NAME & TEACHER CODE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Họ và Tên Giáo Viên (*)
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  required 
                  placeholder="VD: Nguyễn Văn An"
                  value={formData.full_name}
                  onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  style={{ width: '100%', padding: '11px 11px 11px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Lớp Chủ Nhiệm (Nếu có)
              </label>
              <input 
                type="text" 
                placeholder="VD: 12A01 (Để trống nếu không CN)"
                value={formData.homeroom_class}
                onChange={e => setFormData(prev => ({ ...prev, homeroom_class: e.target.value.toUpperCase() }))}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontWeight: 'bold', color: '#166534' }}
              />
            </div>
          </div>

          {/* USERNAME & PHONE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Tên Đăng Nhập (*)'
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  required 
                  placeholder="VD: gv.nguyenvana"
                  value={formData.username}
                  onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  style={{ width: '100%', padding: '11px 11px 11px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Số Điện Thoại Cá Nhân (*)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="tel" 
                  required
                  placeholder="VD: 0912345678"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ width: '100%', padding: '11px 11px 11px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* PASSWORD FIELDS */}
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
            disabled={submitting || !!alreadyRegisteredTeacher}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: alreadyRegisteredTeacher ? '#94a3b8' : 'linear-gradient(135deg, #16a34a, #15803d)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 'bold', 
              fontSize: '15px', 
              cursor: alreadyRegisteredTeacher ? 'not-allowed' : 'pointer', 
              marginTop: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              boxShadow: alreadyRegisteredTeacher ? 'none' : '0 4px 15px rgba(22, 163, 74, 0.3)' 
            }}
          >
            <BookOpen size={18} /> {submitting ? 'Đang tạo tài khoản...' : alreadyRegisteredTeacher ? 'THẦY/CÔ ĐÃ CÓ TÀI KHOẢN' : 'TẠO TÀI KHOẢN GIÁO VIÊN'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '20px', paddingTop: '16px', textAlign: 'center', fontSize: '13.5px', color: '#64748b' }}>
          Đã có tài khoản Giáo viên?{' '}
          <Link to="/dang-nhap-giao-vien" style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'none' }}>
            Đăng nhập Cổng GV 🔐
          </Link>
        </div>
      </div>

    </div>
  );
}
