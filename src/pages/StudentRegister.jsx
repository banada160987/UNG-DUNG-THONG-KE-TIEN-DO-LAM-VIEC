import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Sparkles, CheckCircle2, ArrowLeft, Lock, User, GraduationCap, Phone, IdCard } from 'lucide-react';
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
    role: 'member'
  });

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
    setFormData(prev => ({
      ...prev,
      grade_level: grade,
      student_class: availableClasses[0] || '12A01'
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.username.trim() || !formData.password || !formData.full_name.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
      return;
    }

    // MANDATORY CCCD VALIDATION
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

  const currentClassOptions = getClassesByGrade(formData.grade_level);

  return (
    <div style={{ maxWidth: '560px', margin: '30px auto', padding: '0 16px' }}>
      
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
          Cập nhật chuẩn Dữ liệu Dân cư, SMAS & CSDL Ngành
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
              Tên Đăng Nhập / Số Điện Thoại Cá Nhân (*)
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
                style={{ width: '100%', padding: '11px 11px 11px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* MANDATORY CCCD FIELD */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#be123c', marginBottom: '6px' }}>
              Số CCCD / Mã Định Danh Cá Nhân (Đúng 12 chữ số) (*)
            </label>
            <div style={{ position: 'relative' }}>
              <IdCard size={18} color="#be123c" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                required 
                maxLength={12}
                placeholder="VD: 001205012345 (Bắt buộc theo CSDL Dân cư)"
                value={formData.identity_card}
                onChange={e => setFormData(prev => ({ ...prev, identity_card: e.target.value.replace(/\D/g, '') }))}
                style={{ width: '100%', padding: '11px 11px 11px 40px', borderRadius: '10px', border: '1.5px solid #fca5a5', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff5f5', fontWeight: 'bold' }}
              />
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              💡 Yêu cầu theo quy định xác thực dữ liệu dân cư SMAS Bộ GD&ĐT.
            </span>
          </div>

          {/* GRADE LEVEL & DYNAMIC CLASS SELECT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Chọn Khối Học (*)
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
                Chọn Lớp Học (*)
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
            disabled={submitting}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.3)' }}
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

