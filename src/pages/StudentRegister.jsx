import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Sparkles, Lock, User, GraduationCap, Phone, IdCard, AlertCircle, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function StudentRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    full_name: '',
    identity_card: '', // Mandatory 12 digits
    grade_level: 'Khối 12',
    student_class: '12A01',
    father_phone: '',
    role: 'member',
    student_code: ''
  });

  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [alreadyRegisteredUser, setAlreadyRegisteredUser] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getClassesByGrade = (grade) => {
    if (grade === 'Khối 10') {
      return Array.from({ length: 15 }, (_, i) => `10A${String(i + 1).padStart(2, '0')}`);
    }
    if (grade === 'Khối 11') {
      return Array.from({ length: 9 }, (_, i) => `11A${String(i + 1).padStart(2, '0')}`);
    }
    if (grade === 'Khối 12') {
      return Array.from({ length: 10 }, (_, i) => `12A${String(i + 1).padStart(2, '0')}`);
    }
    return [
      'Cán Bộ / Giáo Viên / Nhân Viên',
      'Cựu Học Sinh',
      'Phụ Huynh Học Sinh',
      'Khách Mời / Đại Biểu'
    ];
  };

  const handleGradeChange = (grade) => {
    const availableClasses = getClassesByGrade(grade);
    const firstClass = availableClasses[0] || '12A01';
    setFormData(prev => ({
      ...prev,
      grade_level: grade,
      student_class: firstClass
    }));
  };

  // Fetch student roster when class or grade level changes
  useEffect(() => {
    fetchRosterByClass(formData.student_class, formData.grade_level);
  }, [formData.student_class, formData.grade_level]);

  const fetchRosterByClass = async (targetClass, targetGrade) => {
    setLoadingRoster(true);
    setSelectedStudentId('');
    setAlreadyRegisteredUser(null);
    setErrorMsg('');
    setFormData(prev => ({ ...prev, full_name: '', student_code: '', identity_card: '' }));

    try {
      const normalizedClass = (targetClass || '').trim();
      const altClass = normalizedClass.includes('A0') ? normalizedClass.replace('A0', 'A') : normalizedClass.replace(/A(\d)$/, 'A0$1');

      // Query cbq_students
      const { data, error } = await supabase
        .from('cbq_students')
        .select('*')
        .or(`student_class.eq.${normalizedClass},student_class.eq.${altClass}`)
        .order('student_name', { ascending: true });

      let list = data || [];

      // Fallback to local storage cache if offline or empty
      if (list.length === 0) {
        const localStudents = JSON.parse(localStorage.getItem('cbq_students_data') || '[]');
        list = localStudents.filter(s => 
          s.student_class === normalizedClass || 
          s.student_class === altClass
        );
      }

      setRoster(list);
    } catch (err) {
      console.warn("Lỗi tải danh sách học sinh:", err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleStudentSelect = async (studentId) => {
    setSelectedStudentId(studentId);
    setAlreadyRegisteredUser(null);
    setErrorMsg('');

    if (!studentId) {
      setFormData(prev => ({
        ...prev,
        full_name: '',
        student_code: '',
        identity_card: '',
        father_phone: ''
      }));
      return;
    }

    const selected = roster.find(s => String(s.id) === String(studentId));
    if (selected) {
      const studentName = selected.student_name || selected.full_name || '';
      const code = selected.student_code || `HS${formData.student_class}-${selected.id}`;
      const cccd = selected.identity_card || selected.cccd || '';
      const phone = selected.parent_phone || selected.father_phone || '';

      setFormData(prev => ({
        ...prev,
        full_name: studentName,
        student_code: code,
        identity_card: cccd || prev.identity_card,
        father_phone: phone || prev.father_phone,
        username: prev.username || code.toLowerCase()
      }));

      // Check if student already has account registered
      if (selected.has_account) {
        setAlreadyRegisteredUser(selected);
        return;
      }

      // Double safety: check in cbq_student_users
      try {
        const { data: users } = await supabase
          .from('cbq_student_users')
          .select('*')
          .or(`student_code.eq.${code},and(full_name.ilike.${studentName},student_class.eq.${formData.student_class})`)
          .limit(1);

        if (users && users.length > 0) {
          setAlreadyRegisteredUser(users[0]);
        }
      } catch (e) {
        console.warn("Lỗi kiểm tra người dùng đã đăng ký:", e);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (alreadyRegisteredUser) {
      setErrorMsg(`Học sinh [${formData.full_name}] đã đăng ký tài khoản trước đó. Vui lòng liên hệ GVCN/Admin để cấp lại mật khẩu.`);
      return;
    }

    if (!formData.username.trim() || !formData.password || !formData.full_name.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
      return;
    }

    // MANDATORY CCCD VALIDATION (12 digits)
    const cleanCCCD = (formData.identity_card || '').trim();
    if (!cleanCCCD) {
      setErrorMsg("Số CCCD / Mã định danh cá nhân là BẮT BUỘC theo quy định CSDL Dân cư & SMAS.");
      return;
    }
    if (!/^\d{12}$/.test(cleanCCCD)) {
      setErrorMsg("Số CCCD / Mã định danh cá nhân phải chứa đúng 12 chữ số.");
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

      // 1. Anti-Duplicate Username Check
      const { data: existingUser } = await supabase
        .from('cbq_student_users')
        .select('*')
        .eq('username', cleanUsername)
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        setErrorMsg(`Tên đăng nhập [${cleanUsername}] đã được đăng ký trước đó. Vui lòng chọn Tên đăng nhập khác!`);
        setSubmitting(false);
        return;
      }

      // 2. Anti-Duplicate CCCD Check
      const { data: existingCccdUser } = await supabase
        .from('cbq_student_users')
        .select('*')
        .eq('identity_card', cleanCCCD)
        .limit(1);

      if (existingCccdUser && existingCccdUser.length > 0) {
        setErrorMsg(`Số CCCD / Mã định danh [${cleanCCCD}] đã được đăng ký tài khoản cho học sinh (${existingCccdUser[0].full_name}). Vui lòng Đăng nhập hoặc liên hệ Admin.`);
        setSubmitting(false);
        return;
      }

      // 3. Smart School Roster Link
      let finalStudentCode = formData.student_code || `HS${formData.student_class}-${Date.now().toString().slice(-4)}`;

      // Update existing roster record in cbq_students
      if (selectedStudentId) {
        await supabase
          .from('cbq_students')
          .update({
            identity_card: cleanCCCD,
            parent_phone: formData.father_phone.trim(),
            father_phone: formData.father_phone.trim(),
            has_account: true,
            account_username: cleanUsername
          })
          .eq('id', selectedStudentId);
      } else {
        // Fallback insert if student was manually typed
        const { data: matchedRoster } = await supabase
          .from('cbq_students')
          .select('*')
          .or(`identity_card.eq.${cleanCCCD},and(student_name.ilike.${formData.full_name.trim()},student_class.eq.${formData.student_class})`)
          .limit(1);

        if (matchedRoster && matchedRoster.length > 0) {
          finalStudentCode = matchedRoster[0].student_code || finalStudentCode;
          await supabase
            .from('cbq_students')
            .update({
              identity_card: cleanCCCD,
              parent_phone: formData.father_phone.trim(),
              father_phone: formData.father_phone.trim(),
              has_account: true,
              account_username: cleanUsername
            })
            .eq('id', matchedRoster[0].id);
        } else {
          await supabase
            .from('cbq_students')
            .insert([{
              student_code: finalStudentCode,
              student_name: formData.full_name.trim(),
              student_class: formData.student_class,
              grade_level: formData.grade_level,
              identity_card: cleanCCCD,
              parent_phone: formData.father_phone.trim(),
              father_phone: formData.father_phone.trim(),
              has_account: true,
              account_username: cleanUsername,
              is_active: true
            }]);
        }
      }

      const newStudentUser = {
        username: cleanUsername,
        password: formData.password,
        full_name: formData.full_name.trim(),
        student_code: finalStudentCode,
        identity_card: cleanCCCD,
        grade_level: formData.grade_level,
        student_class: formData.student_class,
        father_phone: formData.father_phone.trim(),
        parent_phone: formData.father_phone.trim(),
        role: formData.role,
        created_at: new Date().toISOString()
      };

      const { error: insertErr } = await supabase
        .from('cbq_student_users')
        .insert([newStudentUser]);

      if (insertErr) {
        // Fallback to local storage registry
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
      alert(`🎉 ĐĂNG KÝ TÀI KHOẢN THÀNH CÔNG!\n\nMã học sinh: [${finalStudentCode}]\nChào mừng bạn ${formData.full_name} (Lớp ${formData.student_class}). Hệ thống đã tự động ghép nối với danh sách nhà trường và đăng nhập tài khoản cho bạn.`);
      navigate('/binh-chon');

    } catch (err) {
      console.error(err);
      setErrorMsg("Có lỗi khi đăng ký: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentClassOptions = getClassesByGrade(formData.grade_level);

  return (
    <div style={{ maxWidth: '580px', margin: '30px auto', padding: '0 16px' }}>
      
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
        <h2 style={{ margin: '0 0 6px 0', fontSize: '25px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 10px rgba(0,0,0,0.6)', fontWeight: '800' }}>
          👤 ĐĂNG KÝ TÀI KHOẢN HỌC SINH
        </h2>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.4)', fontWeight: '500' }}>
          Tự động ghép nối Danh sách Lớp & Chuẩn CSDL Dân cư, SMAS
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '0 0 20px 20px', border: '1px solid #e2e8f0', borderTop: 'none', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '16px', fontWeight: '500', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {alreadyRegisteredUser && (
          <div style={{ background: '#fff1f2', border: '1.5px solid #f43f5e', color: '#881337', padding: '14px 16px', borderRadius: '12px', fontSize: '13.5px', marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <ShieldAlert size={22} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e11d48', marginBottom: '2px' }}>
                🛑 HỌC SINH NÀY ĐÃ ĐĂNG KÝ TÀI KHOẢN!
              </div>
              Học sinh <strong>{formData.full_name}</strong> (Mã: <code>{formData.student_code}</code>) đã được tạo tài khoản trên hệ thống. 
              <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#475569' }}>
                💡 Nếu bạn quên mật khẩu, vui lòng liên hệ <strong>Giáo viên chủ nhiệm</strong> hoặc <strong>Admin nhà trường</strong> để được cấp lại.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* GRADE LEVEL & DYNAMIC CLASS SELECT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                1. Chọn Khối Học (*)
              </label>
              <select 
                value={formData.grade_level} 
                onChange={e => handleGradeChange(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontWeight: 'bold' }}
              >
                <option value="Khối 10">🏫 Khối 10</option>
                <option value="Khối 11">🏫 Khối 11</option>
                <option value="Khối 12">🎓 Khối 12</option>
                <option value="Khác">👥 Khác / Cán bộ</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                2. Chọn Lớp Học (*)
              </label>
              <select 
                value={formData.student_class} 
                onChange={e => setFormData(prev => ({ ...prev, student_class: e.target.value }))}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontWeight: 'bold', color: '#be123c' }}
              >
                {currentClassOptions.map(c => <option key={c} value={c}>{c.startsWith('10') || c.startsWith('11') || c.startsWith('12') ? `Lớp ${c}` : c}</option>)}
              </select>
            </div>
          </div>

          {/* DYNAMIC CLASS STUDENT ROSTER DROPDOWN */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1e1b4b', marginBottom: '6px' }}>
              3. Chọn Tên Học Sinh từ Danh Sách Lớp {formData.student_class} ({roster.length} học sinh) (*)
            </label>
            
            {loadingRoster ? (
              <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '8px 0' }}>
                ⏳ Đang tải danh sách học sinh lớp {formData.student_class}...
              </div>
            ) : roster.length > 0 ? (
              <select 
                value={selectedStudentId}
                onChange={e => handleStudentSelect(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: selectedStudentId ? '2px solid #3b82f6' : '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ffffff' }}
              >
                <option value="">-- Click để chọn đúng Họ Tên & STT của bạn --</option>
                {roster.map((s, index) => {
                  const sName = s.student_name || s.full_name || '';
                  const sCode = s.student_code || '';
                  const isRegistered = s.has_account;
                  return (
                    <option key={s.id || index} value={s.id} style={{ color: isRegistered ? '#94a3b8' : '#0f172a' }}>
                      {index + 1}. {sName} {sCode ? `(Mã: ${sCode})` : ''} {isRegistered ? '--- 🛑 [ĐÃ ĐĂNG KÝ]' : ''}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div style={{ fontSize: '12.5px', color: '#64748b', padding: '4px 0' }}>
                ℹ️ Chưa tìm thấy danh sách lớp mẫu từ Admin. Bạn có thể tự nhập Họ và Tên bên dưới:
              </div>
            )}
          </div>

          {/* AUTO-FILLED FULL NAME & STUDENT CODE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Họ và Tên Học sinh (*)
              </label>
              <div style={{ position: 'relative' }}>
                <GraduationCap size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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
                Mã Học sinh (Ghép nối SMAS)
              </label>
              <input 
                type="text" 
                readOnly
                placeholder="Tự động ghép nối"
                value={formData.student_code}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f1f5f9', color: '#1e1b4b', fontWeight: 'bold' }}
              />
            </div>
          </div>

          {/* USERNAME & MANDATORY CCCD FIELD */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Tên Đăng Nhập / SĐT Cá Nhân (*)
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#be123c', marginBottom: '6px' }}>
                Số CCCD (12 chữ số) (*)
              </label>
              <div style={{ position: 'relative' }}>
                <IdCard size={18} color="#be123c" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  required 
                  maxLength={12}
                  placeholder="VD: 001205012345"
                  value={formData.identity_card}
                  onChange={e => setFormData(prev => ({ ...prev, identity_card: e.target.value.replace(/\D/g, '') }))}
                  style={{ width: '100%', padding: '11px 11px 11px 40px', borderRadius: '10px', border: '1.5px solid #fca5a5', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff5f5', fontWeight: 'bold' }}
                />
              </div>
            </div>
          </div>

          {/* PARENT PHONE & ROLE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Số Điện Thoại Phụ Huynh
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="tel" 
                  placeholder="VD: 0912345678"
                  value={formData.father_phone}
                  onChange={e => setFormData(prev => ({ ...prev, father_phone: e.target.value }))}
                  style={{ width: '100%', padding: '11px 11px 11px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Chức Vụ Trong Lớp (*)
              </label>
              <select 
                value={formData.role} 
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="member">🧑‍🎓 Học sinh bình thường</option>
                <option value="class_president">👑 Lớp trưởng</option>
                <option value="vp_academics">📚 Lớp phó Học tập</option>
                <option value="inspector">🚩 Đội Cờ đỏ</option>
                <option value="youth_union_secretary">🌟 Bí thư Chi đoàn</option>
              </select>
            </div>
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

          {/* DECREE 13 PERSONAL DATA PROTECTION CONSENT DISCLAIMER */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', marginTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '12.5px', color: '#334155', lineHeight: '1.45' }}>
              <input 
                type="checkbox" 
                required 
                defaultChecked={true}
                style={{ marginTop: '2px', accentColor: '#be123c' }}
              />
              <span>
                🔒 <strong>Cam kết Bảo vệ Dữ liệu Cá nhân:</strong> Tôi và Phụ huynh/Người giám hộ xác nhận đồng ý cung cấp và cho phép nhà trường thu thập, lưu trữ, xử lý thông tin cá nhân (Họ tên, CCCD, SĐT, Ngày sinh, Nhân thân) <strong>duy nhất cho mục đích quản lý giáo dục, tiện ích nhà trường & báo cáo CSDL Ngành</strong> theo đúng quy định tại <strong>Nghị định 13/2023/NĐ-CP</strong> & <strong>Công văn 4567/BGDĐT-CNTT</strong>.
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={submitting || !!alreadyRegisteredUser}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: alreadyRegisteredUser ? '#94a3b8' : 'linear-gradient(135deg, #be123c, #881337)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 'bold', 
              fontSize: '15px', 
              cursor: alreadyRegisteredUser ? 'not-allowed' : 'pointer', 
              marginTop: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              boxShadow: alreadyRegisteredUser ? 'none' : '0 4px 15px rgba(190, 18, 60, 0.3)' 
            }}
          >
            <UserPlus size={18} /> {submitting ? 'Đang tạo tài khoản...' : alreadyRegisteredUser ? 'HỌC SINH ĐÃ CÓ TÀI KHOẢN' : 'TẠO TÀI KHOẢN'}
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


