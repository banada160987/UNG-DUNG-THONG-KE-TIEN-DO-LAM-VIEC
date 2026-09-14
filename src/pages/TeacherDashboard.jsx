import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, BookOpen, Wallet, Activity, ShieldAlert, GraduationCap, LayoutDashboard, FolderOpen, Calendar, Users, Key, RefreshCw, Copy, Check, Search, Download, X, AlertCircle, ShieldCheck, Award, FileCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState(null);
  const navigate = useNavigate();

  // Homeroom Student Management Modal State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('12A01');
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('ALL'); // 'ALL' | 'REGISTERED' | 'NOT_REGISTERED'

  // Reset Password Dialog State
  const [resetTargetStudent, setResetTargetStudent] = useState(null);
  const [customPassword, setCustomPassword] = useState('123456');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetErrorMessage, setResetErrorMessage] = useState('');
  const [copiedResetToast, setCopiedResetToast] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    const tData = JSON.parse(currentTeacherStr);
    setTeacher(tData);
    if (tData.homeroom_class) {
      setSelectedClass(tData.homeroom_class);
    }
  }, [navigate]);

  useEffect(() => {
    if (showStudentModal && selectedClass) {
      fetchStudentsByClass(selectedClass);
    }
  }, [showStudentModal, selectedClass]);

  const fetchStudentsByClass = async (cls) => {
    setLoadingStudents(true);
    try {
      const cleanClass = cls.trim();
      const altClass = cleanClass.includes('A0') ? cleanClass.replace('A0', 'A') : cleanClass.replace(/A(\d)$/, 'A0$1');

      // 1. Fetch roster from cbq_students
      const { data: rosterData } = await supabase
        .from('cbq_students')
        .select('*')
        .or(`student_class.eq.${cleanClass},student_class.eq.${altClass}`)
        .order('student_name', { ascending: true });

      let list = rosterData || [];

      if (list.length === 0) {
        const localStudents = JSON.parse(localStorage.getItem('cbq_students_data') || '[]');
        list = localStudents.filter(s => s.student_class === cleanClass || s.student_class === altClass);
      }

      // 2. Cross reference with cbq_student_users
      const { data: userData } = await supabase
        .from('cbq_student_users')
        .select('*')
        .or(`student_class.eq.${cleanClass},student_class.eq.${altClass}`);

      const userMap = new Map();
      (userData || []).forEach(u => {
        if (u.student_code) userMap.set(u.student_code, u);
        if (u.full_name) userMap.set(`${u.full_name.trim().toLowerCase()}_${u.student_class}`, u);
      });

      const mergedList = list.map(s => {
        const sName = s.student_name || s.full_name || '';
        const userObj = userMap.get(s.student_code) || userMap.get(`${sName.trim().toLowerCase()}_${s.student_class}`);
        return {
          ...s,
          user_account: userObj || null,
          has_account: Boolean(s.has_account || s.account_username || userObj)
        };
      });

      setClassStudents(mergedList);
    } catch (err) {
      console.warn("Error loading class students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenResetDialog = (student) => {
    setResetTargetStudent(student);
    setCustomPassword('123456');
    setResetSuccessMessage('');
    setResetErrorMessage('');
    setCopiedResetToast(false);
  };

  const handleExecutePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetTargetStudent) return;
    if (!customPassword || customPassword.length < 6) {
      setResetErrorMessage('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      return;
    }

    setSubmittingReset(true);
    setResetErrorMessage('');
    setResetSuccessMessage('');

    try {
      const studentCode = resetTargetStudent.student_code || '';
      const studentName = resetTargetStudent.student_name || resetTargetStudent.full_name || '';
      const targetUsername = resetTargetStudent.user_account?.username || resetTargetStudent.account_username || studentCode.toLowerCase();

      // Update password in cbq_student_users
      const { error: updateErr } = await supabase
        .from('cbq_student_users')
        .update({ password: customPassword, updated_at: new Date().toISOString() })
        .or(`student_code.eq.${studentCode},username.eq.${targetUsername}`);

      // Fallback local accounts update
      const localAccounts = JSON.parse(localStorage.getItem('cbq_student_accounts') || '[]');
      const updatedLocal = localAccounts.map(u => {
        if (u.student_code === studentCode || u.username === targetUsername) {
          return { ...u, password: customPassword };
        }
        return u;
      });
      localStorage.setItem('cbq_student_accounts', JSON.stringify(updatedLocal));

      // Refresh list
      await fetchStudentsByClass(selectedClass);

      setResetSuccessMessage(`🎉 Đã Reset Mật Khẩu Thành Công Cho Học Sinh ${studentName}!\nMật khẩu mới là: [${customPassword}]`);
    } catch (err) {
      setResetErrorMessage('Lỗi khi reset mật khẩu: ' + err.message);
    } finally {
      setSubmittingReset(false);
    }
  };

  const generateZaloResetMsg = () => {
    if (!resetTargetStudent) return '';
    const studentName = resetTargetStudent.student_name || resetTargetStudent.full_name || '';
    const studentCode = resetTargetStudent.student_code || '';
    const username = resetTargetStudent.user_account?.username || resetTargetStudent.account_username || studentCode.toLowerCase();
    const currentDomain = window.location.origin;

    let msg = `📩 [THÔNG BÁO CẤP LẠI MẬT KHẨU TÀI KHOẢN HỌC SINH]\n`;
    msg += `Kính gửi Phụ huynh và em học sinh ${studentName} (Lớp ${selectedClass}),\n`;
    msg += `Giáo viên chủ nhiệm xin gửi thông tin đăng nhập tài khoản hệ thống đã được cấp lại:\n\n`;
    msg += `• Họ và tên: ${studentName}\n`;
    msg += `• Mã học sinh: ${studentCode}\n`;
    msg += `• Tên đăng nhập: ${username}\n`;
    msg += `🔑 MẬT KHẨU MỚI: ${customPassword}\n\n`;
    msg += `👉 Đường link đăng nhập: ${currentDomain}/dang-nhap\n`;
    msg += `(Em lưu ý đổi lại mật khẩu cá nhân sau khi đăng nhập thành công).\n\n`;
    msg += `Trân trọng!`;
    return msg;
  };

  const handleCopyResetZaloMsg = () => {
    const msg = generateZaloResetMsg();
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedResetToast(true);
      setTimeout(() => setCopiedResetToast(false), 3000);
    });
  };

  // Export Class CSDL Official Excel Report
  const handleExportClassCsdlReport = () => {
    if (classStudents.length === 0) {
      alert("Không có dữ liệu học sinh trong lớp để xuất!");
      return;
    }

    const regCount = classStudents.filter(s => s.has_account).length;
    const cccdCount = classStudents.filter(s => s.identity_card && /^\d{12}$/.test(s.identity_card.trim())).length;
    const unregCount = classStudents.length - regCount;
    const percentCccd = Math.round((cccdCount / classStudents.length) * 100);

    const summarySheet = [
      [`BÁO CÁO CSDL NGÀNH & ĐỀ ÁN 06 - LỚP ${selectedClass}`],
      [`Giáo viên chủ nhiệm: ${teacher.full_name} | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [""],
      ["TỔNG QUAN LỚP HỌC:"],
      ["1. Sĩ số học sinh lớp", classStudents.length],
      ["2. Đã đăng ký tài khoản hệ thống", regCount, `${Math.round((regCount/classStudents.length)*100)}%`],
      ["3. Đã chuẩn hóa CCCD 12 số", cccdCount, `${percentCccd}%`],
      ["4. CHƯA đăng ký tài khoản", unregCount],
      [""]
    ];

    const detailSheet = classStudents.map((s, idx) => ({
      "STT": idx + 1,
      "Mã Học Sinh": s.student_code || '',
      "Họ và Tên": s.student_name || s.full_name || '',
      "Lớp": s.student_class || selectedClass,
      "Số CCCD (12 số)": s.identity_card || 'Chưa cập nhật',
      "Trạng Thái CCCD": (s.identity_card && /^\d{12}$/.test(s.identity_card.trim())) ? "🟢 Đạt chuẩn CSDL Dân cư" : "🔴 Chưa đủ 12 số",
      "SĐT Phụ Huynh": s.parent_phone || s.father_phone || '',
      "Trạng Thái TK": s.has_account ? "🟢 Đã Đăng Ký" : "⚪ Chưa Đăng Ký"
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(summarySheet);
    const ws2 = XLSX.utils.json_to_sheet(detailSheet);

    XLSX.utils.book_append_sheet(wb, ws1, "Tong_Hop_Lop");
    XLSX.utils.book_append_sheet(wb, ws2, "Chi_Tiet_Hoc_Sinh");

    XLSX.writeFile(wb, `BaoCao_CSDL_Lop_${selectedClass}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleLogout = () => {
    localStorage.removeItem('cbq_current_teacher');
    navigate('/');
  };

  if (!teacher) return null;

  const filteredClassList = classStudents.filter(s => {
    const sName = s.student_name || s.full_name || '';
    const sCode = s.student_code || '';
    const matchSearch = !searchTerm || sName.toLowerCase().includes(searchTerm.toLowerCase()) || sCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAcc = filterAccount === 'ALL' || (filterAccount === 'REGISTERED' && s.has_account) || (filterAccount === 'NOT_REGISTERED' && !s.has_account);
    return matchSearch && matchAcc;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: 'white', padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', fontWeight: 'bold', fontSize: '24px' }}>
              {teacher.full_name.charAt(0)}
            </div>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a' }}>Giáo viên: {teacher.full_name}</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                {teacher.homeroom_class ? `GVCN Lớp ${teacher.homeroom_class}` : 'Giáo viên bộ môn'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>

        {/* Dashboard Grid */}
        <h2 style={{ fontSize: '18px', color: '#334155', marginBottom: '16px' }}>Công cụ Quản lý Chủ nhiệm & Chuyên môn</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* QUẢN LÝ LỚP CHỦ NHIỆM & RESET MẬT KHẨU (OPTION A + B) */}
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)', borderRadius: '20px', padding: '24px', border: '2px solid #fecdd3', boxShadow: '0 10px 25px rgba(225, 29, 72, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#ffe4e6', color: '#e11d48', borderRadius: '16px' }}>
                <Users size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#881337', fontWeight: 'bold' }}>
                  Quản Lý HS Lớp Chủ Nhiệm
                </h3>
                <span style={{ fontSize: '12px', color: '#e11d48', fontWeight: 'bold' }}>
                  🔑 Reset Mật Khẩu Nhanh & Báo Cáo CSDL
                </span>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Xem danh sách lớp <strong>{teacher.homeroom_class || 'chủ nhiệm'}</strong>, theo dõi trạng thái tạo tài khoản, reset mật khẩu nhanh cho học sinh quên MK và xuất file báo cáo CSDL Ngành.
            </p>
            <button 
              onClick={() => setShowStudentModal(true)} 
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #e11d48, #be123c)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)' }}
            >
              <Key size={18} /> Quản Lý Lớp & Reset MK ({teacher.homeroom_class || 'Lớp 12A01'})
            </button>
          </div>

          {/* Thời Khóa Biểu & Lịch Tuần */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#ffe4e6', color: '#be123c', borderRadius: '16px' }}><Calendar size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>TKB & Lịch Tuần BGH</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Tra cứu Thời khóa biểu cá nhân, lịch dạy theo lớp, lịch công tác BGH và lịch trực ban toàn trường.
            </p>
            <Link to="/lich-cong-tac" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#be123c', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Tra cứu TKB Toàn Trường</Link>
          </div>

          {/* Quản lý Thu Chi */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#dcfce7', color: '#16a34a', borderRadius: '16px' }}><Wallet size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Quản lý Thu / Chi</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Tạo đợt thu BHYT, BHTT, Quỹ lớp. Tích chọn học sinh đã đóng tiền, tự động thống kê số dư.
            </p>
            <Link to="/teacher-dashboard/funds" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#16a34a', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Mở Sổ Quỹ</Link>
          </div>

          {/* Theo dõi Nề nếp */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '16px' }}><ShieldAlert size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Báo cáo Nề nếp</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Xem danh sách vi phạm của lớp hôm nay do Đội Cờ đỏ chấm (Kèm hình ảnh minh chứng).
            </p>
            <Link to="/teacher-dashboard/discipline" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#dc2626', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Xem vi phạm</Link>
          </div>

          {/* Sổ Đầu Bài & Học Tập */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#fef3c7', color: '#d97706', borderRadius: '16px' }}><GraduationCap size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Tình hình Học tập</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Kiểm tra Sổ đầu bài điện tử do Lớp trưởng ghi và Báo cáo thiếu BTVN từ Lớp phó Học tập.
            </p>
            <Link to="/teacher-dashboard/academics" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#d97706', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Xem tình hình học tập</Link>
          </div>

          {/* Cổng Tiện Ích */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '16px' }}><LayoutDashboard size={28} /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Cổng Tiện Ích</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Truy cập nhanh vào các phần mềm trường học: SMAS, Azota, K12Online, Email... 
            </p>
            <Link to="/teacher-dashboard/app-hub" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#4f46e5', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Mở Kho Ứng Dụng</Link>
          </div>

          {/* Soạn Giáo Án Chuẩn CV 5512 */}
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)', borderRadius: '20px', padding: '24px', border: '2px solid #bae6fd', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#e0f2fe', color: '#0284c7', borderRadius: '16px' }}>
                <BookOpen size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0369a1', fontWeight: 'bold' }}>
                  Soạn Giáo Án (CV 5512)
                </h3>
                <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold' }}>
                  ✨ Kế hoạch bài dạy GDPT 2018
                </span>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Tự động tạo bài soạn 4 bước & 3 nhóm mục tiêu (Kiến thức, Năng lực, Phẩm chất). Xuất file Word (.doc) chuẩn 5512.
            </p>
            <Link to="/giao-vien/soan-giao-an-5512" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}>
              📝 Soạn Giáo Án 5512
            </Link>
          </div>

          {/* Ra Đề Thi & Đảo Mã Đề (THPT 2025) */}
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)', borderRadius: '20px', padding: '24px', border: '2px solid #fde68a', boxShadow: '0 10px 25px rgba(217, 119, 6, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#fef3c7', color: '#d97706', borderRadius: '16px' }}>
                <Activity size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#78350f', fontWeight: 'bold' }}>
                  Ra Đề Thi & Đảo Đề 2025
                </h3>
                <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 'bold' }}>
                  🎲 Trắc nghiệm 4 dạng & Ma trận 3175
                </span>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Hỗ trợ 4 dạng câu hỏi chuẩn đề thi THPT 2025 (Đúng/Sai, trả lời ngắn). Tự động đảo mã đề (101, 102...) & xuất Word.
            </p>
            <Link to="/giao-vien/ra-de-thi" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(217,119,6,0.3)' }}>
              🎲 Ra Đề Thi & Đảo Đề
            </Link>
          </div>

          {/* Đánh Giá Học Sinh TT 22 & AI Nhận Xét */}
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', borderRadius: '20px', padding: '24px', border: '2px solid #bbf7d0', boxShadow: '0 10px 25px rgba(22, 163, 74, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#dcfce7', color: '#16a34a', borderRadius: '16px' }}>
                <Award size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#14532d', fontWeight: 'bold' }}>
                  Đánh Giá Học Sinh (TT 22)
                </h3>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>
                  🤖 Trợ lý AI gợi ý 5 phẩm chất & 3 năng lực
                </span>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Sổ đánh giá học sinh chuẩn Thông tư 22/2021/TT-BGDĐT. AI nhận xét tự động theo phẩm chất, năng lực GDPT 2018 & Xuất CSDL.
            </p>
            <Link to="/giao-vien/danh-gia-tt22" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
              🏆 Đánh Giá TT 22 & Nhận Xét AI
            </Link>
          </div>

          {/* Quản Lý Tổ Chuyên Môn & Ký Duyệt Giáo Án */}
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)', borderRadius: '20px', padding: '24px', border: '2px solid #e9d5ff', boxShadow: '0 10px 25px rgba(147, 51, 234, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#f3e8ff', color: '#9333ea', borderRadius: '16px' }}>
                <FileCheck size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#581c87', fontWeight: 'bold' }}>
                  Quản Lý Tổ Chuyên Môn
                </h3>
                <span style={{ fontSize: '12px', color: '#9333ea', fontWeight: 'bold' }}>
                  ✍️ Ký duyệt Giáo án điện tử & SHCM
                </span>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Dành cho TTCM/TPCM ký duyệt giáo án 5512 trực tuyến, quản lý khung Phân phối chương trình (PPCT) & Biên bản NCBH.
            </p>
            <Link to="/giao-vien/quan-ly-to-chuyen-mon" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #9333ea, #7e22ce)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(147,51,234,0.3)' }}>
              📑 Quản Lý Tổ & Ký Duyệt Giáo Án
            </Link>
          </div>

          {/* Đánh Giá KPI & Xếp Loại Viên Chức (NĐ 48/2023 & Luật TĐKT 2022) */}
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)', borderRadius: '20px', padding: '24px', border: '2px solid #99f6e4', boxShadow: '0 10px 25px rgba(13, 148, 136, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#ccfbf1', color: '#0d9488', borderRadius: '16px' }}>
                <Award size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#115e59', fontWeight: 'bold' }}>
                  Đánh Giá KPI Viên Chức
                </h3>
                <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: 'bold' }}>
                  🎯 Chuẩn NĐ 48/2023 & Luật TĐKT 2022
                </span>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Đánh giá KPI hàng tháng của Tổ chuyên môn với 4 nhóm tiêu chí chuẩn, tự động khống chế trần 20% xuất sắc & xuất Excel/In biên bản.
            </p>
            <Link to="/giao-vien/danh-gia-kpi-to-chuyen-mon" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}>
              🏆 Đánh Giá KPI Tổ Chuyên Môn
            </Link>
          </div>

        </div>

      </div>

      {/* HOMEROOM STUDENT MANAGER MODAL */}
      {showStudentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1' }}>
            
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #be123c 0%, #881337 100%)', color: 'white', padding: '20px 24px', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={26} color="#fde047" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 'bold' }}>
                    👨‍🎓 QUẢN LÝ HỌC SINH LỚP {selectedClass} & RESET MẬT KHẨU
                  </h3>
                  <span style={{ fontSize: '13px', color: '#fecdd3' }}>
                    GVCN: {teacher.full_name} | Chuẩn CSDL Ngành SMAS
                  </span>
                </div>
              </div>
              <button onClick={() => setShowStudentModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px' }}>
              
              {/* Filter Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                  <Search size={18} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Tìm theo Mã HS, Họ tên..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#ffffff' }}>
                    <option value="ALL">Tất cả Trạng thái TK</option>
                    <option value="REGISTERED">🟢 Đã Tạo Tài Khoản</option>
                    <option value="NOT_REGISTERED">⚪ Chưa Tạo Tài Khoản</option>
                  </select>

                  <button
                    onClick={handleExportClassCsdlReport}
                    style={{ padding: '8px 16px', background: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={15} /> Xuất Báo Cáo CSDL Lớp (Excel)
                  </button>
                </div>
              </div>

              {/* Student Table */}
              {loadingStudents ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Đang tải danh sách học sinh lớp {selectedClass}...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '10px' }}>STT</th>
                        <th style={{ padding: '10px' }}>Mã HS</th>
                        <th style={{ padding: '10px' }}>Họ và Tên</th>
                        <th style={{ padding: '10px' }}>Trạng Thái TK</th>
                        <th style={{ padding: '10px' }}>Số CCCD (12 số)</th>
                        <th style={{ padding: '10px' }}>SĐT Phụ Huynh</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClassList.map((s, idx) => (
                        <tr key={s.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e1b4b' }}>{s.student_code || '---'}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>{s.student_name || s.full_name}</td>
                          <td style={{ padding: '10px' }}>
                            {s.has_account ? (
                              <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🟢 Đã đăng ký</span>
                            ) : (
                              <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>⚪ Chưa tạo TK</span>
                            )}
                          </td>
                          <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                            {s.identity_card && /^\d{12}$/.test(s.identity_card.trim()) ? (
                              <span style={{ color: '#15803d', fontWeight: 'bold' }}>{s.identity_card}</span>
                            ) : (
                              <span style={{ color: '#dc2626', fontStyle: 'italic', fontSize: '12px' }}>Chưa có 12 số</span>
                            )}
                          </td>
                          <td style={{ padding: '10px' }}>{s.parent_phone || s.father_phone || '---'}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenResetDialog(s)}
                              style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #e11d48, #be123c)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Key size={14} /> Reset Mật Khẩu
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* QUICK RESET PASSWORD DIALOG */}
      {resetTargetStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#be123c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} /> Reset Mật Khẩu Cho Học Sinh
              </h3>
              <button onClick={() => setResetTargetStudent(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#fff1f2', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #fecdd3' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#9f1239' }}>
                🧑‍🎓 {resetTargetStudent.student_name || resetTargetStudent.full_name} (Lớp {selectedClass})
              </div>
              <div style={{ fontSize: '12.5px', color: '#881337', marginTop: '2px' }}>
                Mã học sinh: <code>{resetTargetStudent.student_code}</code>
              </div>
            </div>

            {resetSuccessMessage && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', whiteSpace: 'pre-line', fontWeight: 'bold' }}>
                {resetSuccessMessage}
              </div>
            )}

            {resetErrorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {resetErrorMessage}
              </div>
            )}

            <form onSubmit={handleExecutePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Nhập Mật Khẩu Mới (Mặc định: 123456) (*)
                </label>
                <input
                  type="text"
                  required
                  value={customPassword}
                  onChange={e => setCustomPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #be123c', fontSize: '14px', fontWeight: 'bold', boxSizing: 'border-box', color: '#be123c' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setResetTargetStudent(null)}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingReset}
                  style={{ flex: 1.5, padding: '10px', background: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {submittingReset ? 'Đang cập nhật...' : '🔑 XÁC NHẬN RESET MK'}
                </button>
              </div>
            </form>

            {/* Quick Zalo Copy Notice */}
            {resetSuccessMessage && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                <button
                  onClick={handleCopyResetZaloMsg}
                  style={{
                    width: '100%', padding: '11px',
                    background: copiedResetToast ? '#16a34a' : '#059669',
                    color: 'white', border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {copiedResetToast ? <Check size={18} /> : <Copy size={18} />}
                  {copiedResetToast ? 'ĐÃ SAO CHÉP THÔNG TIN DÁN ZALO!' : '📋 SAO CHÉP THÔNG TIN RESET DÁN ZALO'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

