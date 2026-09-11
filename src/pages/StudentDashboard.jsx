import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, LogOut, FileText, CheckSquare, Bus, Bike, MessageSquare, Award, Clock, BookOpen, ClipboardList, ShieldAlert, Wallet, Shield, AlertTriangle, Users, ClipboardCheck, FileBadge, Edit3, Save, X, IdCard, Home, Phone, Heart, Users2, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const openProfileModal = () => {
    if (student) initProfileForm(student);
    setProfileErrorMsg('');
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileErrorMsg('');

    if (!profileForm.full_name.trim()) {
      setProfileErrorMsg("Vui lòng nhập Họ và Tên học sinh.");
      return;
    }

    // MANDATORY CCCD VALIDATION
    const cleanCCCD = profileForm.identity_card.trim();
    if (!cleanCCCD) {
      setProfileErrorMsg("Số CCCD / Mã định danh cá nhân là BẮT BUỘC theo quy định CSDL Dân cư & SMAS.");
      return;
    }
    if (!/^\d{12}$/.test(cleanCCCD)) {
      setProfileErrorMsg("Số CCCD / Mã định danh cá nhân phải chứa đúng 12 chữ số.");
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
      setStudent(updatedStudent);

      alert("🎉 CẬP NHẬT HỒ SƠ THÀNH CÔNG!\n\nThông tin cá nhân & nhân thân đã được lưu đồng bộ chuẩn CSDL Dân cư, SMAS & CSDL Ngành.");
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

    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box', backgroundColor: 'white' }
};
