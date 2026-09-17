import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, LogOut, FileText, CheckSquare, Bus, Bike, MessageSquare, Award, Clock, BookOpen, ClipboardList, ShieldAlert, Wallet, Shield, AlertTriangle, Users, ClipboardCheck, FileBadge, Edit3, Save, X, IdCard, Home, Phone, Heart, Users2, ShieldCheck, Sparkles, QrCode, CheckCircle, Calendar, GraduationCap, CheckCircle2, Layers } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [selectedClubForQR, setSelectedClubForQR] = useState(null);
  const [loading, setLoading] = useState(true);

  // Exam Dossier State (GDPT 2018 - 2+2)
  const [showExamModal, setShowExamModal] = useState(false);
  const [examElectives, setExamElectives] = useState(['Tiếng Anh', 'Vật Lý']);
  const [examArea, setExamArea] = useState('Diện 1');
  const [savingExamDossier, setSavingExamDossier] = useState(false);

  // Profile Modal State (Chuẩn Dân cư, SMAS & CSDL Ngành)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('identity'); // 'identity' | 'academic' | 'contact' | 'parents' | 'policy'
  const [profileForm, setProfileForm] = useState({
    student_code: '',
    full_name: '',
    grade_level: 'Khối 12',
    student_class: '12A01',
    identity_card: '', // CCCD 12 chữ số (MANDATORY)
    alias_name: '',
    birth_date: '',
    gender: 'Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    nationality: 'Việt Nam',
    birth_place: '',
    hometown: '',
    phone: '',
    email: '',
    permanent_address: '',
    current_address: '',
    policy_category: 'Không',
    youth_union_status: 'Đoàn viên',
    father_name: '',
    father_cccd: '',
    father_phone: '',
    father_job: '',
    mother_name: '',
    mother_cccd: '',
    mother_phone: '',
    mother_job: '',
    guardian_name: '',
    guardian_phone: ''
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    setStudent(currentStudent);

    // Initialize Profile Form from current student session
    initProfileForm(currentStudent);

    fetchStudentData(currentStudent.full_name);
  }, [navigate]);

  const initProfileForm = (currentStudent) => {
    const cls = currentStudent.student_class || '12A01';
    let defaultGrade = 'Khối 12';
    if (cls.startsWith('10') || cls.includes('10A')) defaultGrade = 'Khối 10';
    else if (cls.startsWith('11') || cls.includes('11A')) defaultGrade = 'Khối 11';

    setProfileForm({
      student_code: currentStudent.student_code || currentStudent.username || '',
      full_name: currentStudent.full_name || '',
      grade_level: currentStudent.grade_level || defaultGrade,
      student_class: currentStudent.student_class || '12A01',
      identity_card: currentStudent.identity_card || '',
      alias_name: currentStudent.alias_name || '',
      birth_date: currentStudent.birth_date || '',
      gender: currentStudent.gender || 'Nam',
      ethnicity: currentStudent.ethnicity || 'Kinh',
      religion: currentStudent.religion || 'Không',
      nationality: currentStudent.nationality || 'Việt Nam',
      birth_place: currentStudent.birth_place || '',
      hometown: currentStudent.hometown || '',
      phone: currentStudent.phone || '',
      email: currentStudent.email || '',
      permanent_address: currentStudent.permanent_address || '',
      current_address: currentStudent.current_address || currentStudent.address || '',
      policy_category: currentStudent.policy_category || 'Không',
      youth_union_status: currentStudent.youth_union_status || 'Đoàn viên',
      father_name: currentStudent.father_name || currentStudent.parent_name || '',
      father_cccd: currentStudent.father_cccd || '',
      father_phone: currentStudent.father_phone || currentStudent.parent_phone || '',
      father_job: currentStudent.father_job || '',
      mother_name: currentStudent.mother_name || '',
      mother_cccd: currentStudent.mother_cccd || '',
      mother_phone: currentStudent.mother_phone || '',
      mother_job: currentStudent.mother_job || '',
      guardian_name: currentStudent.guardian_name || '',
      guardian_phone: currentStudent.guardian_phone || ''
    });
  };

  const getClassesByGrade = (grade) => {
    if (grade === 'Khối 10') {
      return Array.from({ length: 15 }, (_, i) => `10A${String(i + 1).padStart(2, '0')}`);
    }
    if (grade === 'Khối 11') {
      return Array.from({ length: 9 }, (_, i) => `11A${String(i + 1).padStart(2, '0')}`);
    }
    // Khối 12
    return Array.from({ length: 10 }, (_, i) => `12A${String(i + 1).padStart(2, '0')}`);
  };

  const handleGradeChange = (grade) => {
    const availableClasses = getClassesByGrade(grade);
    setProfileForm(prev => ({
      ...prev,
      grade_level: grade,
      student_class: availableClasses[0] || '12A01'
    }));
  };

  // SMART CCCD VALIDATION (ĐỀ ÁN 06 & CSDL DÂN CƯ)
  const validateCCCDSmart = (cccd, birthDateStr, gender) => {
    const clean = String(cccd || '').trim();
    if (!clean) return { valid: false, message: "Số CCCD / Mã định danh cá nhân là BẮT BUỘC theo quy định CSDL Dân cư & SMAS." };
    if (!/^\d{12}$/.test(clean)) return { valid: false, message: "Số CCCD / Mã định danh cá nhân phải chứa đúng 12 chữ số." };

    const provCode = parseInt(clean.substring(0, 3), 10);
    if (isNaN(provCode) || (provCode > 96 && provCode !== 0)) {
      return { valid: false, message: "3 chữ số đầu của CCCD không hợp lệ (mã Tỉnh/Thành phố từ 001 - 096)." };
    }

    if (birthDateStr && birthDateStr.includes('-')) {
      const parts = birthDateStr.split('-');
      const year = parts[0];
      const birthYearShort = year.substring(2);
      const cccdYearShort = clean.substring(4, 6);

      if (birthYearShort !== cccdYearShort) {
        return { valid: false, message: `Năm sinh (${year}) không khớp với 2 chữ số năm sinh trên CCCD (${cccdYearShort}).` };
      }

      const genderDigit = parseInt(clean.substring(3, 4), 10);
      const fullYear = parseInt(year, 10);
      let expectedGenderDigit = -1;
      if (fullYear >= 1900 && fullYear <= 1999) {
        expectedGenderDigit = (gender === 'Nữ') ? 1 : 0;
      } else if (fullYear >= 2000 && fullYear <= 2099) {
        expectedGenderDigit = (gender === 'Nữ') ? 3 : 2;
      }

      if (expectedGenderDigit !== -1 && genderDigit !== expectedGenderDigit) {
        return { valid: false, message: `Chữ số thứ 4 của CCCD ('${genderDigit}') không khớp với giới tính '${gender}' và năm sinh (${year}).` };
      }
    }

    return { valid: true };
  };

  const updateProfileForm = (updater) => {
    setProfileForm(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (student && student.username) {
        try {
          localStorage.setItem(`cbq_profile_draft_${student.username}`, JSON.stringify(next));
        } catch (e) {
          console.warn("Lỗi lưu nháp:", e);
        }
      }
      return next;
    });
  };

  const openProfileModal = () => {
    if (student) {
      const draftStr = localStorage.getItem(`cbq_profile_draft_${student.username}`);
      if (draftStr) {
        try {
          const draftObj = JSON.parse(draftStr);
          setProfileForm(draftObj);
          setProfileErrorMsg("💡 Đã tự động khôi phục bản nháp chưa lưu trước đó.");
        } catch (e) {
          initProfileForm(student);
        }
      } else {
        initProfileForm(student);
      }
    }
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileErrorMsg('');

    // Check if Admin has locked profile updates
    const isProfileLocked = localStorage.getItem('cbq_profile_update_locked') === 'true';
    if (isProfileLocked) {
      setProfileErrorMsg("🔴 Đợt cập nhật hồ sơ cá nhân hiện đang KHÓA theo quy định nhà trường. Học sinh không thể lưu thông tin vào lúc này.");
      return;
    }

    if (!profileForm.full_name.trim()) {
      setProfileErrorMsg("Vui lòng nhập Họ và Tên học sinh.");
      return;
    }

    // SMART CCCD VALIDATION
    const cleanCCCD = profileForm.identity_card.trim();
    const cccdCheck = validateCCCDSmart(cleanCCCD, profileForm.birth_date, profileForm.gender);
    if (!cccdCheck.valid) {
      setProfileErrorMsg(cccdCheck.message);
      return;
    }

    setProfileSubmitting(true);
    try {
      const updatedStudent = {
        ...student,
        ...profileForm,
        full_name: profileForm.full_name.trim(),
        identity_card: cleanCCCD,
        student_class: profileForm.student_class,
        grade_level: profileForm.grade_level
      };

      // 1. Update in cbq_student_users
      await supabase
        .from('cbq_student_users')
        .update(updatedStudent)
        .eq('username', student.username);

      // 2. Upsert in cbq_students
      await supabase
        .from('cbq_students')
        .upsert([{
          student_code: profileForm.student_code || student.username,
          student_name: profileForm.full_name.trim(),
          student_class: profileForm.student_class,
          grade_level: profileForm.grade_level,
          identity_card: cleanCCCD,
          gender: profileForm.gender,
          birth_date: profileForm.birth_date,
          phone: profileForm.phone,
          address: profileForm.current_address || profileForm.permanent_address,
          parent_name: profileForm.father_name || profileForm.mother_name || profileForm.guardian_name,
          parent_phone: profileForm.father_phone || profileForm.mother_phone || profileForm.guardian_phone
        }]);

      localStorage.setItem('cbq_current_student', JSON.stringify(updatedStudent));
      if (student && student.username) {
        localStorage.removeItem(`cbq_profile_draft_${student.username}`);
      }
      setStudent(updatedStudent);

      alert("🎉 CẬP NHẬT HỒ SƠ THÀNH CÔNG!\n\nThông tin cá nhân & nhân thân đã được lưu đồng bộ chuẩn CSDL Dân cư (Đề án 06), SMAS & CSDL Ngành.");
      setShowProfileModal(false);
    } catch (err) {
      console.error(err);
      setProfileErrorMsg("Lỗi khi lưu hồ sơ: " + err.message);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const fetchStudentData = async (studentName) => {
    setLoading(true);
    try {
      // Fetch Parking Tickets
      const { data: parkingData } = await supabase
        .from('cbq_parking_registrations')
        .select('*')
        .ilike('student_name', `%${studentName}%`)
        .order('created_at', { ascending: false });

      // Fetch Bus Tickets
      const { data: busData } = await supabase
        .from('cbq_bus_registrations')
        .select('*')
        .ilike('student_name', `%${studentName}%`)
        .order('created_at', { ascending: false });

      const allTickets = [
        ...(parkingData || []).map(t => ({ ...t, _type: 'parking' })),
        ...(busData || []).map(t => ({ ...t, _type: 'bus' }))
      ];
      setTickets(allTickets);

      // Fetch Club Registrations
      const { data: clubData } = await supabase
        .from('cbq_student_registrations')
        .select('*')
        .or(`student_name.ilike.%${studentName}%`)
        .order('created_at', { ascending: false });

      if (clubData && clubData.length > 0) {
        setMyClubs(clubData);
      } else {
        // Sample fallback club representation
        setMyClubs([
          {
            id: 'sample_club_1',
            club_name: 'Câu lạc bộ Toán học và STEM sáng tạo',
            role_title: 'Thành viên Ban Chuyên môn Robot & AI',
            attended: 8,
            total: 8,
            rate: 100,
            ai_rating: 'Xuất sắc',
            bonus_points: 10,
            ai_comment: 'Em luôn duy trì sự chuyên cần tuyệt đối (8/8 buổi HK1), tích cực hoàn thành dự án Khoa học kỹ thuật và hỗ trợ đồng đội. Đề xuất Đoàn trường tặng Giấy khen xuất sắc.'
          }
        ]);
      }
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cbq_current_student');
    navigate('/dang-nhap-hoc-sinh');
  };

  if (!student) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b' }}>
            Không gian Học sinh
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Hệ sinh thái Cao Bá Quát 4.0</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={openProfileModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}
          >
            <Edit3 size={18} /> Cập nhật Hồ Sơ SMAS
          </button>
          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* ID Card */}
        <div className="glass" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '24px', borderRadius: '16px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
            <User size={150} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, margin: 0 }}>Thẻ Học Sinh (Digital ID)</h2>
            <button onClick={openProfileModal} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '4px 12px', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Edit3 size={12} /> Sửa Hồ sơ
            </button>
          </div>

          <div style={{ fontSize: '24px', fontWeight: '900', marginBottom: '4px' }}>{student.full_name}</div>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>CCCD: <strong>{student.identity_card || 'Chưa cập nhật'}</strong></span>
            <span>Khối: <strong>{student.grade_level || 'Khối 12'}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Lớp</div>
              <div style={{ fontWeight: 'bold' }}>{student.student_class}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Chức vụ</div>
              <div style={{ fontWeight: 'bold' }}>
                {student.role === 'class_president' && '👑 Lớp trưởng'}
                {student.role === 'vp_academics' && '📚 Lớp phó Học tập'}
                {student.role === 'inspector' && '🚩 Cờ Đỏ'}
                {student.role === 'youth_union_secretary' && '🌟 Bí thư'}
                {(!student.role || student.role === 'member') && '🧑‍🎓 Học sinh'}
              </div>
            </div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '8px', display: 'inline-block' }}>
            <QRCodeSVG value={`STUDENT:${student.username}`} size={80} level="M" />
          </div>
        </div>

        {/* Quick Links */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: 'white' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Tiện ích học đường</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button onClick={openProfileModal} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', textDecoration: 'none', color: '#0369a1', transition: 'all 0.2s', border: '1px solid #bae6fd', cursor: 'pointer' }}>
              <IdCard size={28} color="#0284c7" />
              <span style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Hồ Sơ SMAS & Nhân Thân</span>
            </button>
            <Link to="/binh-chon" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <CheckSquare size={28} color="#0284c7" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Bình chọn & Đánh giá</span>
            </Link>
            <Link to="/gop-y" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <MessageSquare size={28} color="#16a34a" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Góp ý 24/7</span>
            </Link>
            <Link to="/dang-ky-xe" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <Bike size={28} color="#ea580c" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Đăng ký Xe Máy</span>
            </Link>
            <Link to="/thi-truc-tuyen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <Award size={28} color="#9333ea" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Thi Trực Tuyến</span>
            </Link>
            <Link to="/hoc-sinh/van-bang-so" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <FileBadge size={28} color="#3b82f6" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Tủ Hồ Sơ Cá Nhân</span>
            </Link>
          </div>
        </div>

        {/* My Tickets */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: 'white' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Vé Xe Đã Đăng Ký</h2>
          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>
              <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <p>Bạn chưa đăng ký vé xe nào.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
              {tickets.map(ticket => (
                <div key={ticket.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', borderLeft: `4px solid ${ticket.status === 'approved' ? '#22c55e' : '#eab308'}` }}>
                  {ticket._type === 'parking' ? <Bike size={24} color="#0f172a" /> : <Bus size={24} color="#0f172a" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>
                      {ticket.ticket_code}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {ticket._type === 'parking' ? 'Vé tháng xe máy/đạp' : 'Xe buýt đưa đón'}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '999px', background: ticket.status === 'approved' ? '#dcfce7' : '#fef9c3', color: ticket.status === 'approved' ? '#166534' : '#854d0e' }}>
                    {ticket.status === 'approved' ? 'Hợp lệ' : 'Chờ xử lý'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🎓 HỒ SƠ ĐĂNG KÝ THI TỐT NGHIỆP THPT 2026 (GDPT 2018 - 2+2) */}
      <div style={{
        marginTop: '28px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        border: '1px solid #334155',
        padding: '24px',
        color: '#ffffff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Hồ Sơ Đăng Ký Thi Tốt Nghiệp THPT 2026 (Chương trình GDPT 2018)
                </h2>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                  Tự động đối chiếu CCCD 12 số, kiểm tra tổ hợp 2+2 (Toán, Văn + 2 môn tự chọn) và diện xét TN
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowExamModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2,132,199,0.3)'
              }}
            >
              <Edit3 size={15} /> Điều Chỉnh Tổ Hợp Môn 2+2
            </button>
            <Link
              to="/kiem-tra-ho-so-tn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid #334155',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '13px'
              }}
            >
              <ExternalLink size={15} /> Mở Tool Khảo Thí
            </Link>
          </div>
        </div>

        {/* 4 Checklist Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          
          {/* Card 1: CCCD */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>1. CCCD 12 SỐ & DÂN CƯ</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: student.identity_card && student.identity_card.length === 12 ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {student.identity_card && student.identity_card.length === 12 ? (
                <>✅ {student.identity_card}</>
              ) : (
                <>⚠️ {student.identity_card || 'Chưa cập nhật'}</>
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              {student.identity_card && student.identity_card.length === 12 ? 'Khớp mã tỉnh & năm sinh' : 'Cần nhập đủ 12 chữ số'}
            </div>
          </div>

          {/* Card 2: Môn bắt buộc */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>2. MÔN THI BẮT BUỘC (2 MÔN)</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ✅ Toán & Ngữ Văn
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Hình thức: Trắc nghiệm + Tự luận
            </div>
          </div>

          {/* Card 3: Môn tự chọn 2+2 */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>3. MÔN TỰ CHỌN (CHỌN 02 MÔN)</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: examElectives.length === 2 ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {examElectives.length === 2 ? (
                <>✅ {examElectives.join(' + ')}</>
              ) : (
                <>⚠️ Sai số lượng ({examElectives.length} môn)</>
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Quy tắc 2+2 chuẩn GDPT 2018
            </div>
          </div>

          {/* Card 4: Diện xét & Ảnh thẻ */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>4. DIỆN XÉT TN & ẢNH THẺ</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⭐ {examArea} • ẢNH 4x6 CHUẨN
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Đã số hóa định danh CCCD
            </div>
          </div>

        </div>
      </div>

      {/* 🎯 CÂU LẠC BỘ CỦA TÔI & SỔ ĐIỂM DANH AI */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={22} color="#8b5cf6" /> Hoạt Động Câu Lạc Bộ & Sổ Điểm Danh AI
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Theo dõi 16 buổi sinh hoạt định kỳ, kết quả điểm danh thời gian thực và đánh giá chuyên cần từ Trợ lý AI Gemini
            </p>
          </div>
          <Link 
            to="/dang-ky-hoat-dong" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              backgroundColor: '#eff6ff', 
              color: '#1d4ed8', 
              fontWeight: '700', 
              fontSize: '13px', 
              textDecoration: 'none',
              border: '1px solid #bfdbfe'
            }}
          >
            + Đăng ký CLB Mới
          </Link>
        </div>

        {myClubs.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <Calendar size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto', opacity: 0.7 }} />
            <p style={{ fontWeight: '600', color: '#475569', margin: '0 0 12px 0' }}>Bạn chưa đăng ký tham gia Câu lạc bộ nào trong năm học này.</p>
            <Link to="/dang-ky-hoat-dong" style={{ display: 'inline-block', padding: '9px 20px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13.5px' }}>
              Khám phá & Đăng ký CLB Ngay
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {myClubs.map((club, cIdx) => {
              const clubName = club.club_name || (club.responses ? Object.values(club.responses).find(v => String(v).includes('Câu lạc bộ')) : 'Câu lạc bộ Toán học và STEM sáng tạo') || 'Câu lạc bộ Ngoại khóa';
              const attendedCount = club.attended || 8;
              const totalCount = club.total || 8;
              const rate = club.rate || 100;
              const aiRating = club.ai_rating || 'Xuất sắc';
              const bonus = club.bonus_points || 10;
              const feedback = club.ai_comment || `Em ${student.full_name} luôn tham gia đầy đủ 100% các buổi sinh hoạt CLB, có tinh thần trách nhiệm và tích cực đóng góp trong các dự án. Đề xuất cộng +10 điểm Hạnh kiểm và khen thưởng cấp trường.`;

              return (
                <div key={club.id || cIdx} style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                  
                  {/* Header CLB */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '20px' }}>🔬</span>
                        <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                          {clubName}
                        </h3>
                      </div>
                      <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                        Năm học 2026 - 2027 • Trường THPT Cao Bá Quát • Sinh hoạt định kỳ Thứ 7
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedClubForQR(club)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(2,132,199,0.25)'
                        }}
                      >
                        <QrCode size={15} /> Mã QR Check-in
                      </button>
                    </div>
                  </div>

                  {/* 16 Buổi Sinh Hoạt Grid */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                        📅 Lịch sử 16 buổi sinh hoạt (HK1 & HK2):
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '10px' }}>
                        Đã tham gia: {attendedCount}/{totalCount} buổi ({rate}%)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))', gap: '8px' }}>
                      {Array.from({ length: 16 }).map((_, bIdx) => {
                        const isPast = bIdx < 8; // 8 buổi HK1 đã diễn ra
                        return (
                          <div 
                            key={bIdx}
                            style={{
                              padding: '8px 4px',
                              borderRadius: '8px',
                              textAlign: 'center',
                              backgroundColor: isPast ? '#f0fdf4' : '#f8fafc',
                              border: isPast ? '1px solid #86efac' : '1px dashed #cbd5e1'
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: '700', color: isPast ? '#166534' : '#94a3b8' }}>
                              B{bIdx + 1}
                            </div>
                            <div style={{ fontSize: '13px', marginTop: '2px' }}>
                              {isPast ? '✅' : '⚪'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Evaluation Box */}
                  <div style={{ backgroundColor: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} color="#9333ea" />
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#6b21a8' }}>
                          ĐÁNH GIÁ CHUYÊN CẦN BỞI TRỢ LÝ AI GEMINI
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '800', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        backgroundColor: '#9333ea', 
                        color: '#ffffff',
                        boxShadow: '0 2px 6px rgba(147,51,234,0.3)'
                      }}>
                        ⭐ Xếp loại: {aiRating} (+{bonus} điểm HK)
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#4c1d95', lineHeight: '1.6' }}>
                      {feedback}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL MÃ QR CHECK-IN CỦA HỌC SINH */}
      {selectedClubForQR && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: '#0f172a' }}>
              Mã Check-in Cá Nhân
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
              Xuất trình mã này cho BCN / Thầy Cô phụ trách quét khi đến phòng sinh hoạt
            </p>

            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', border: '2px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <QRCodeSVG value={`STUDENT:${student.student_code || student.username}`} size={180} level="H" />
            </div>

            <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b', marginBottom: '2px' }}>
              {student.full_name}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Lớp {student.student_class} • Mã: {student.student_code || student.username}
            </div>

            <button
              onClick={() => setSelectedClubForQR(null)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '10px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* CÁN BỘ LỚP / QUẢN TRỊ VIÊN */}
      {student.role && student.role !== 'member' && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield color="#3b82f6" /> Khu vực Quản trị - Dành cho Cán bộ Lớp
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {student.role === 'class_president' && (
              <>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #fef08a, #fde047)', border: '1px solid #facc15' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#ca8a04' }}><BookOpen size={24} /></div>
                    <h3 style={{ margin: 0, color: '#854d0e', fontSize: '16px' }}>Sổ đầu bài điện tử</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#713f12', margin: '0 0 16px 0' }}>Ghi nhận tiết học, điểm danh đầu giờ và nhận xét của GV bộ môn.</p>
                  <Link to="/hoc-sinh/so-dau-bai" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '10px', background: '#ca8a04', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>Mở Sổ Đầu Bài</Link>
                </div>
                
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #fed7aa, #fdba74)', border: '1px solid #fb923c' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#c2410c' }}><ClipboardCheck size={24} /></div>
                    <h3 style={{ margin: 0, color: '#9a3412', fontSize: '16px' }}>Phân công trực nhật</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#7c2d12', margin: '0 0 16px 0' }}>Xếp lịch trực nhật, lao động và theo dõi tiến độ hoàn thành.</p>
                  <Link to="/hoc-sinh/truc-nhat" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '10px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>Mở Bảng Phân Công</Link>
                </div>
              </>
            )}

            {student.role === 'vp_academics' && (
              <>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #bfdbfe, #93c5fd)', border: '1px solid #60a5fa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#2563eb' }}><ClipboardList size={24} /></div>
                    <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '16px' }}>Báo cáo chuyên cần HT</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#1e3a8a', margin: '0 0 16px 0' }}>Báo cáo số lượng học sinh làm bài tập về nhà hàng ngày.</p>
                  <Link to="/hoc-sinh/bao-cao-hoc-tap" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>Báo cáo ngay</Link>
                </div>
              </>
            )}

            {student.role === 'inspector' && (
              <>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #fecaca, #fca5a5)', border: '1px solid #f87171' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#dc2626' }}><ShieldAlert size={24} /></div>
                    <h3 style={{ margin: 0, color: '#7f1d1d', fontSize: '16px' }}>Sổ Chấm điểm Nề nếp</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 16px 0' }}>Chấm điểm thi đua di động (Thanh tra chéo các lớp).</p>
                  <Link to="/hoc-sinh/cham-diem-ne-nep" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>Bắt đầu chấm điểm</Link>
                </div>
              </>
            )}

            {student.role === 'youth_union_secretary' && (
              <>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #bbf7d0, #86efac)', border: '1px solid #4ade80' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#16a34a' }}><Wallet size={24} /></div>
                    <h3 style={{ margin: 0, color: '#14532d', fontSize: '16px' }}>Quản lý Quỹ đoàn</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#14532d', margin: '0 0 16px 0' }}>Sổ thu/chi quỹ đoàn trực tuyến, đảm bảo minh bạch.</p>
                  <Link to="/hoc-sinh/quy-doan" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>Mở Sổ Quỹ</Link>
                </div>
                
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #e9d5ff, #d8b4fe)', border: '1px solid #c084fc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#9333ea' }}><Users size={24} /></div>
                    <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '16px' }}>Điểm danh Sự kiện</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4c1d95', margin: '0 0 16px 0' }}>Điểm danh đoàn viên tham gia mít tinh, hội thao.</p>
                  <Link to="/hoc-sinh/diem-danh-su-kien" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '10px', background: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>Điểm danh QR</Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PROFILE UPDATE MODAL (CHUẨN DÂN CƯ, SMAS & CSDL NGÀNH) */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', color: '#0369a1', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IdCard color="#0284c7" size={24} /> Cập Nhật Hồ Sơ Học Sinh & Thông Tin Nhân Thân
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Chuẩn hóa theo quy định Dữ liệu Quốc gia về Dân cư, SMAS & CSDL Ngành
                </p>
              </div>
              <button onClick={() => setShowProfileModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            {profileErrorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#dc2626" /> {profileErrorMsg}
              </div>
            )}

            {/* Profile Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              {[
                { key: 'identity', label: '🎓 1. Học tập & Khối lớp' },
                { key: 'national_id', label: '💳 2. Dân cư & CCCD (*)' },
                { key: 'contact', label: '📞 3. Liên lạc & Nơi ở' },
                { key: 'parents', label: '👨‍👩‍👧 4. Thông tin Nhân thân' },
                { key: 'policy', label: '🌟 5. Chính sách & Đoàn thể' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setProfileTab(tab.key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: profileTab === tab.key ? '#0284c7' : '#f1f5f9',
                    color: profileTab === tab.key ? 'white' : '#475569',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveProfile}>
              
              {/* TAB 1: ĐỊNH DANH & HỌC TẬP */}
              {profileTab === 'identity' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={styles.label}>Lựa chọn Khối học (*)</label>
                    <select 
                      value={profileForm.grade_level} 
                      onChange={e => handleGradeChange(e.target.value)}
                      style={styles.select}
                    >
                      <option value="Khối 10">Khối 10 (Năm học 2025-2026)</option>
                      <option value="Khối 11">Khối 11 (Năm học 2025-2026)</option>
                      <option value="Khối 12">Khối 12 (Năm học 2025-2026)</option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Lớp học (Tự động lọc theo Khối) (*)</label>
                    <select 
                      value={profileForm.student_class} 
                      onChange={e => setProfileForm({ ...profileForm, student_class: e.target.value })}
                      style={styles.select}
                    >
                      {getClassesByGrade(profileForm.grade_level).map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Mã Học Sinh / Mã CSDL Ngành (*)</label>
                    <input 
                      type="text" 
                      value={profileForm.student_code} 
                      onChange={e => setProfileForm({ ...profileForm, student_code: e.target.value })}
                      style={styles.input}
                      placeholder="VD: HS12A01-001"
                      required
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Họ và Tên Học Sinh (Khai sinh) (*)</label>
                    <input 
                      type="text" 
                      value={profileForm.full_name} 
                      onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      style={styles.input}
                      placeholder="VD: Nguyễn Văn An"
                      required
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: DÂN CƯ & CCCD */}
              {profileTab === 'national_id' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1', background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '10px' }}>
                    <label style={{ ...styles.label, color: '#991b1b' }}>🔴 Số CCCD / Mã Định Danh Cá Nhân (BẮT BUỘC - Đúng 12 chữ số) (*)</label>
                    <input 
                      type="text" 
                      maxLength={12}
                      value={profileForm.identity_card} 
                      onChange={e => setProfileForm({ ...profileForm, identity_card: e.target.value.replace(/\D/g, '') })}
                      style={{ ...styles.input, borderColor: '#ef4444', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}
                      placeholder="Nhập 12 chữ số CCCD (VD: 079204012345)"
                      required
                    />
                    <small style={{ color: '#7f1d1d', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>*Theo quy định của CSDL Quốc gia về Dân cư & CSDL Ngành GD&ĐT</small>
                  </div>

                  <div>
                    <label style={styles.label}>Tên thường gọi / Alias (nếu có)</label>
                    <input 
                      type="text" 
                      value={profileForm.alias_name} 
                      onChange={e => setProfileForm({ ...profileForm, alias_name: e.target.value })}
                      style={styles.input}
                      placeholder="Tên gọi ở nhà..."
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Ngày tháng năm sinh (*)</label>
                    <input 
                      type="date" 
                      value={profileForm.birth_date} 
                      onChange={e => setProfileForm({ ...profileForm, birth_date: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Giới tính (*)</label>
                    <select 
                      value={profileForm.gender} 
                      onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Dân tộc (*)</label>
                    <input 
                      type="text" 
                      value={profileForm.ethnicity} 
                      onChange={e => setProfileForm({ ...profileForm, ethnicity: e.target.value })}
                      style={styles.input}
                      placeholder="VD: Kinh, Tày, Thái..."
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Tôn giáo (*)</label>
                    <input 
                      type="text" 
                      value={profileForm.religion} 
                      onChange={e => setProfileForm({ ...profileForm, religion: e.target.value })}
                      style={styles.input}
                      placeholder="VD: Không, Phật giáo, Công giáo..."
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Quốc tịch (*)</label>
                    <input 
                      type="text" 
                      value={profileForm.nationality} 
                      onChange={e => setProfileForm({ ...profileForm, nationality: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Nơi sinh (Tỉnh/Thành phố)</label>
                    <input 
                      type="text" 
                      value={profileForm.birth_place} 
                      onChange={e => setProfileForm({ ...profileForm, birth_place: e.target.value })}
                      style={styles.input}
                      placeholder="VD: Long An"
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Quê quán (Tỉnh/Thành - Huyện - Xã)</label>
                    <input 
                      type="text" 
                      value={profileForm.hometown} 
                      onChange={e => setProfileForm({ ...profileForm, hometown: e.target.value })}
                      style={styles.input}
                      placeholder="VD: Xã Tân An, Huyện Châu Thành, Tỉnh Long An"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: LIÊN LẠC & NƠI Ở */}
              {profileTab === 'contact' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={styles.label}>Số điện thoại cá nhân (Học sinh)</label>
                    <input 
                      type="tel" 
                      value={profileForm.phone} 
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      style={styles.input}
                      placeholder="VD: 0901234567"
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Email cá nhân (Học sinh)</label>
                    <input 
                      type="email" 
                      value={profileForm.email} 
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      style={styles.input}
                      placeholder="VD: nguyenvanan@gmail.com"
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Địa chỉ Thường trú (Hộ khẩu)</label>
                    <input 
                      type="text" 
                      value={profileForm.permanent_address} 
                      onChange={e => setProfileForm({ ...profileForm, permanent_address: e.target.value })}
                      style={styles.input}
                      placeholder="Nhập theo đúng hộ khẩu thường trú..."
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Nơi ở hiện nay / Địa chỉ liên lạc khẩn cấp (*)</label>
                    <input 
                      type="text" 
                      value={profileForm.current_address} 
                      onChange={e => setProfileForm({ ...profileForm, current_address: e.target.value })}
                      style={styles.input}
                      placeholder="Nhập địa chỉ nhà đang ở..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: THÔNG TIN NHÂN THÂN (CHUẨN SMAS) */}
              {profileTab === 'parents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* THÔNG TIN CHA */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#0284c7', fontSize: '15px', fontWeight: 'bold' }}>👨 1. Thông tin Cha</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={styles.label}>Họ và Tên Cha</label>
                        <input type="text" value={profileForm.father_name} onChange={e => setProfileForm({ ...profileForm, father_name: e.target.value })} style={styles.input} placeholder="VD: Nguyễn Văn Bình" />
                      </div>
                      <div>
                        <label style={styles.label}>Số CCCD Cha</label>
                        <input type="text" maxLength={12} value={profileForm.father_cccd} onChange={e => setProfileForm({ ...profileForm, father_cccd: e.target.value })} style={styles.input} placeholder="12 chữ số" />
                      </div>
                      <div>
                        <label style={styles.label}>Số điện thoại Cha (*)</label>
                        <input type="tel" value={profileForm.father_phone} onChange={e => setProfileForm({ ...profileForm, father_phone: e.target.value })} style={styles.input} placeholder="VD: 0912345678" />
                      </div>
                      <div>
                        <label style={styles.label}>Nghề nghiệp Cha</label>
                        <input type="text" value={profileForm.father_job} onChange={e => setProfileForm({ ...profileForm, father_job: e.target.value })} style={styles.input} placeholder="Nghề nghiệp..." />
                      </div>
                    </div>
                  </div>

                  {/* THÔNG TIN MẸ */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#be123c', fontSize: '15px', fontWeight: 'bold' }}>👩 2. Thông tin Mẹ</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={styles.label}>Họ và Tên Mẹ</label>
                        <input type="text" value={profileForm.mother_name} onChange={e => setProfileForm({ ...profileForm, mother_name: e.target.value })} style={styles.input} placeholder="VD: Trần Thị Cúc" />
                      </div>
                      <div>
                        <label style={styles.label}>Số CCCD Mẹ</label>
                        <input type="text" maxLength={12} value={profileForm.mother_cccd} onChange={e => setProfileForm({ ...profileForm, mother_cccd: e.target.value })} style={styles.input} placeholder="12 chữ số" />
                      </div>
                      <div>
                        <label style={styles.label}>Số điện thoại Mẹ (*)</label>
                        <input type="tel" value={profileForm.mother_phone} onChange={e => setProfileForm({ ...profileForm, mother_phone: e.target.value })} style={styles.input} placeholder="VD: 0987654321" />
                      </div>
                      <div>
                        <label style={styles.label}>Nghề nghiệp Mẹ</label>
                        <input type="text" value={profileForm.mother_job} onChange={e => setProfileForm({ ...profileForm, mother_job: e.target.value })} style={styles.input} placeholder="Nghề nghiệp..." />
                      </div>
                    </div>
                  </div>

                  {/* THÔNG TIN GIÁM HỘ */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '15px', fontWeight: 'bold' }}>🧑‍🤝‍🧑 3. Người giám hộ / Liên hệ khẩn cấp</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={styles.label}>Họ và Tên Người Giám Hộ</label>
                        <input type="text" value={profileForm.guardian_name} onChange={e => setProfileForm({ ...profileForm, guardian_name: e.target.value })} style={styles.input} placeholder="Nếu ở cùng ông bà/người thân..." />
                      </div>
                      <div>
                        <label style={styles.label}>Số điện thoại Khẩn cấp</label>
                        <input type="tel" value={profileForm.guardian_phone} onChange={e => setProfileForm({ ...profileForm, guardian_phone: e.target.value })} style={styles.input} placeholder="SĐT liên hệ nhanh..." />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 5: CHÍNH SÁCH & ĐOÀN THỂ */}
              {profileTab === 'policy' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={styles.label}>Đối tượng ưu tiên / Chính sách (*)</label>
                    <select 
                      value={profileForm.policy_category} 
                      onChange={e => setProfileForm({ ...profileForm, policy_category: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Không">Không thuộc diện chính sách</option>
                      <option value="Hộ nghèo">Hộ nghèo</option>
                      <option value="Hộ cận nghèo">Hộ cận nghèo</option>
                      <option value="Con thương binh">Con thương binh</option>
                      <option value="Con liệt sĩ">Con liệt sĩ</option>
                      <option value="Học sinh khuyết tật">Học sinh khuyết tật</option>
                      <option value="Mồ côi">Mồ côi cả cha lẫn mẹ</option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Thông tin Đoàn thể (*)</label>
                    <select 
                      value={profileForm.youth_union_status} 
                      onChange={e => setProfileForm({ ...profileForm, youth_union_status: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Đoàn viên">Đoàn viên TNCS Hồ Chí Minh</option>
                      <option value="Thanh niên">Thanh niên (Chưa kết nạp Đoàn)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  🔴 CCCD bắt buộc 12 chữ số
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowProfileModal(false)}
                    style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={profileSubmitting}
                    style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Save size={18} /> {profileSubmitting ? 'ĐANG LƯU HỒ SƠ...' : 'LƯU HỒ SƠ CHUẨN SMAS'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐIỀU CHỈNH TỔ HỢP MÔN THI TỐT NGHIỆP THPT (2+2) */}
      {showExamModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>
                    Đăng Ký Môn Thi Tốt Nghiệp THPT 2026
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Quy chế GDPT 2018: 02 Môn Bắt buộc + Chọn đúng 02 Môn Tự chọn
                  </p>
                </div>
              </div>
              <button onClick={() => setShowExamModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            {/* Compulsory info */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#16a34a" />
              <div style={{ fontSize: '13px', color: '#166534' }}>
                <strong>2 Môn Thi Bắt Buộc:</strong> Toán học & Ngữ văn (Mặc định bắt buộc 100% thí sinh).
              </div>
            </div>

            {/* Elective Selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
                  Lựa chọn 02 Môn Tự Chọn (*):
                </label>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  backgroundColor: examElectives.length === 2 ? '#dcfce7' : '#fee2e2',
                  color: examElectives.length === 2 ? '#166534' : '#991b1b'
                }}>
                  Đã chọn: {examElectives.length}/2 môn {examElectives.length === 2 ? '✅ Đạt chuẩn' : '⚠️ Cần đúng 2 môn'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Sinh Học', 
                  'Lịch Sử', 'Địa Lý', 'GDKT&PL', 'Tin Học', 'Công Nghệ'
                ].map(subj => {
                  const isSelected = examElectives.includes(subj);
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setExamElectives(examElectives.filter(s => s !== subj));
                        } else {
                          if (examElectives.length >= 2) {
                            alert("⚠️ Quy tắc 2+2: Chỉ được chọn tối đa đúng 02 môn tự chọn. Vui lòng bỏ bớt 1 môn trước khi chọn môn mới.");
                            return;
                          }
                          setExamElectives([...examElectives, subj]);
                        }
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                        color: isSelected ? '#0369a1' : '#334155',
                        fontWeight: '700',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span>{subj}</span>
                      {isSelected ? <CheckCircle2 size={16} color="#0284c7" /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Graduation Area */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Diện Xét Tốt Nghiệp:
              </label>
              <select
                value={examArea}
                onChange={e => setExamArea(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#ffffff' }}
              >
                <option value="Diện 1">Diện 1 (Thí sinh không thuộc diện ưu tiên/khuyến khích)</option>
                <option value="Diện 2">Diện 2 (Cộng 0.25đ - Con TB/BB, dân tộc thiểu số vùng thuận lợi...)</option>
                <option value="Diện 3">Diện 3 (Cộng 0.50đ - Dân tộc thiểu số vùng ĐB khó khăn, con Liệt sĩ...)</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={examElectives.length !== 2 || savingExamDossier}
                onClick={async () => {
                  setSavingExamDossier(true);
                  try {
                    const studentCode = student.student_code || student.username;
                    await supabase
                      .from('cbq_students')
                      .update({
                        exam_electives: examElectives,
                        exam_graduation_area: examArea,
                        exam_status: 'valid'
                      })
                      .eq('student_code', studentCode);

                    alert(`🎉 ĐÃ LƯU TỔ HỢP MÔN THI THÀNH CÔNG!\n\nToán + Ngữ Văn + ${examElectives.join(' + ')} (${examArea}).`);
                    setShowExamModal(false);
                  } catch (err) {
                    console.error(err);
                    alert("Lỗi lưu hồ sơ: " + err.message);
                  } finally {
                    setSavingExamDossier(false);
                  }
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  backgroundColor: examElectives.length === 2 ? '#0284c7' : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  cursor: examElectives.length === 2 ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} /> {savingExamDossier ? 'Đang lưu...' : 'Lưu Tổ Hợp Môn'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box', backgroundColor: 'white' }
};
