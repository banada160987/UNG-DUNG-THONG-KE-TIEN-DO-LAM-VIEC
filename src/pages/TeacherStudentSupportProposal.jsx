// =========================================================================
// CỔNG DÀNH CHO GIÁO VIÊN CHỦ NHIỆM & ĐOÀN THANH NIÊN
// Lựa chọn học sinh có hoàn cảnh khó khăn từ CSDL có sẵn, cập nhật hoàn cảnh
// gửi Ban Giám Hiệu phê duyệt và định kỳ cập nhật sự tiến bộ gửi Mạnh Thường Quân
// =========================================================================

import { useState, useEffect } from 'react';
import { 
  Users, Heart, Plus, Search, FileText, CheckCircle2, Clock, 
  Upload, Trash2, Edit3, ArrowRight, ShieldCheck, Award, 
  Send, Sparkles, BookOpen, MessageSquare, AlertCircle, RefreshCw,
  Home, ChevronRight, Lock, ShieldAlert, LogIn
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTeacherSession } from '../services/authSessionManager';
import { 
  fetchStudentsByClassForProposal, 
  proposeStudentDifficulty, 
  fetchScholarshipApplications, 
  addStudentProgressReport,
  addGrowthTimelineMilestone
} from '../services/scholarshipFundService';

const ALL_CLASSES = [];
['10', '11', '12'].forEach(grade => {
  for (let i = 1; i <= 15; i++) {
    const num = String(i).padStart(2, '0');
    ALL_CLASSES.push(`${grade}A${num}`);
  }
});

const DIFFICULT_CATEGORIES = [
  'Học sinh thuộc diện Hộ nghèo',
  'Học sinh thuộc diện Hộ cận nghèo',
  'Học sinh mồ côi cha/mẹ hoặc mồ côi cả cha lẫn mẹ',
  'Học sinh khuyết tật / mắc bệnh hiểm nghèo',
  'Học sinh có hoàn cảnh gia đình đặc biệt khó khăn đột xuất',
  'Thiếu phương tiện đi học (khoảng cách xa, không có xe)',
  'Gia đình khó khăn, cha mẹ mất sức lao động / bệnh tật',
  'Học sinh nghèo vượt khó học giỏi, có ý chí vươn lên đặc biệt'
];

export default function TeacherStudentSupportProposal() {
  const teacher = getTeacherSession();
  const { user, role } = useAuth();
  const location = useLocation();

  // Kiểm tra xác thực & thẩm quyền
  const isAdmin = role === 'admin' || role === 'secretary' || Boolean(user?.email?.includes('admin'));
  const isTeacher = Boolean(teacher && (teacher.role === 'teacher' || teacher.name || teacher.username));
  const isAuthenticated = Boolean(isTeacher || isAdmin);

  const teacherHomeroom = (teacher?.homeroomClass || teacher?.homeroom_class || '').trim();
  // Giáo viên chủ nhiệm: có lớp chủ nhiệm cụ thể và không phải admin
  const isGVCN = Boolean(teacherHomeroom && !isAdmin);
  // Đoàn thanh niên / BGH: quản lý toàn trường
  const isUnionOrAdmin = Boolean(isAdmin || !teacherHomeroom || teacher?.role === 'union' || teacher?.is_union);

  // Khóa cứng lớp nếu là GVCN, nếu là Đoàn/BGH thì mặc định 10A01 hoặc lớp đầu tiên
  const [selectedClass, setSelectedClass] = useState(() => isGVCN ? teacherHomeroom : (teacherHomeroom || '10A01'));
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Danh sách các hồ sơ đã đề xuất
  const [proposedList, setProposedList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form Đề xuất mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentFromRoster, setSelectedStudentFromRoster] = useState('');
  const [formData, setFormData] = useState({
    student_name: '',
    student_class: isGVCN ? teacherHomeroom : (teacherHomeroom || '10A01'),
    student_code: '',
    gender: 'Nam',
    birthday: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    home_address: '',
    category: DIFFICULT_CATEGORIES[0],
    academic_grade: 'Tốt',
    conduct_grade: 'Tốt',
    circumstance_story: '',
    dream_aspiration: '',
    target_support_amount: 2000000,
    granted_item: '',
    proposer_name: teacher?.name || teacher?.full_name || (isAdmin ? 'Ban Giám Hiệu' : ''),
    proposer_phone: teacher?.phone || '',
    proposed_by_role: isGVCN ? 'homeroom_teacher' : 'youth_union', // 'homeroom_teacher' | 'youth_union'
    evidence_urls: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Modal cập nhật tiến bộ học sinh
  const [progressModalStudent, setProgressModalStudent] = useState(null);
  const [progressData, setProgressData] = useState({
    term: 'Học kỳ I Năm học 2026-2027',
    growth_title: 'Báo cáo tiến bộ học kỳ I',
    academic_score: '8.5 (Học lực Tốt)',
    conduct: 'Tốt',
    teacher_notes: '',
    student_letter: '',
    letter_image_url: '',
    badge_awarded: ''
  });
  const [savingProgress, setSavingProgress] = useState(false);

  // NẠP DỮ LIỆU: BẢO MẬT TUYỆT ĐỐI - CHỈ GỌI KHI ĐÃ ĐĂNG NHẬP
  useEffect(() => {
    if (!isAuthenticated) return;

    const currentTargetClass = isGVCN ? teacherHomeroom : selectedClass;
    loadClassRoster(currentTargetClass);
    loadProposedList();
  }, [selectedClass, isAuthenticated, isGVCN, teacherHomeroom]);

  // Nạp danh sách học sinh của lớp từ CSDL (Chỉ chạy khi đã xác thực GV/Đoàn/Admin)
  async function loadClassRoster(cls) {
    if (!cls || !isAuthenticated) return;
    setLoadingStudents(true);
    try {
      const list = await fetchStudentsByClassForProposal(cls);
      setClassStudents(list || []);
    } catch (e) {
      console.warn("Lỗi nạp danh sách học sinh:", e);
    } finally {
      setLoadingStudents(false);
    }
  }

  // Nạp các hồ sơ đã đề xuất
  async function loadProposedList() {
    if (!isAuthenticated) return;
    setLoadingList(true);
    try {
      const allApps = await fetchScholarshipApplications();
      // Nếu là GVCN: Lọc đúng các hồ sơ của lớp mình chủ nhiệm hoặc do mình đề xuất
      if (isGVCN && teacherHomeroom) {
        const filtered = (allApps || []).filter(item => 
          (item.student_class || '').toUpperCase() === teacherHomeroom.toUpperCase() ||
          (item.proposer_phone && item.proposer_phone === teacher?.phone)
        );
        setProposedList(filtered);
      } else {
        // Cán bộ Đoàn trường & BGH: Xem danh sách toàn trường
        setProposedList(allApps || []);
      }
    } catch (e) {
      console.warn("Lỗi nạp hồ sơ:", e);
    } finally {
      setLoadingList(false);
    }
  }

  // NẾU CHƯA ĐĂNG NHẬP: CHẶN TRUY XUẤT CSDL VÀ HIỂN THỊ MÀN HÌNH BẢO VỆ DỮ LIỆU
  if (!isAuthenticated) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          {/* BREADCRUMB */}
          <div style={styles.breadcrumb}>
            <Link to="/" style={styles.breadcrumbLink}><Home size={14} /> Trang chủ</Link>
            <ChevronRight size={14} color="#94a3b8" />
            <Link to="/chap-canh-uoc-mo" style={styles.breadcrumbLink}>🕊️ Quỹ "Chắp Cánh Ước Mơ"</Link>
            <ChevronRight size={14} color="#94a3b8" />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Cổng GVCN & Đoàn Thanh Niên</span>
          </div>

          {/* SECURITY LOCKED CARD */}
          <div style={{
            maxWidth: '740px',
            margin: '40px auto',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #fecaca',
            boxShadow: '0 20px 40px -15px rgba(239, 68, 68, 0.15)',
            overflow: 'hidden',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ea580c 100%)',
              padding: '36px 24px',
              color: '#ffffff'
            }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                border: '2px solid rgba(255, 255, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                backdropFilter: 'blur(8px)'
              }}>
                <ShieldAlert size={42} color="#ffffff" />
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '900', letterSpacing: '0.5px' }}>
                TRUY XUẤT CƠ SỞ DỮ LIỆU HỌC SINH ĐƯỢC BẢO VỆ
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#fecaca', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                Tuân thủ Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân & Quy chế Quản lý thông tin học sinh Trường THPT Cao Bá Quát
              </p>
            </div>

            <div style={{ padding: '32px 28px' }}>
              <div style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: '26px',
                fontSize: '13.5px',
                color: '#9a3412',
                lineHeight: 1.6
              }}>
                <div style={{ fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️</span> QUY ĐỊNH PHÂN QUYỀN TRUY CẬP CSDL HỌC SINH:
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>Giáo viên Chủ nhiệm (GVCN):</strong> Đăng nhập để truy xuất danh sách học sinh của đúng lớp mình chủ nhiệm, rà soát gia cảnh và lập phiếu đề xuất hỗ trợ. GVCN không được phép xem CSDL của lớp khác.
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>Cán bộ Đoàn Trường & Ban Giám Hiệu:</strong> Đăng nhập với quyền thẩm định, rà soát học sinh khó khăn toàn trường và điều phối học bổng.
                  </li>
                  <li>
                    <strong>Học sinh & Khách vãng lai:</strong> Không được phép truy xuất thông tin cá nhân và dữ liệu CSDL của học sinh để phòng tránh rò rỉ thông tin riêng tư.
                  </li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '440px', margin: '0 auto' }}>
                <Link 
                  to={`/dang-nhap-giao-vien?redirect=${encodeURIComponent(location.pathname)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '13px 24px',
                    background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '800',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  <LogIn size={18} /> Đăng Nhập Cổng Giáo Viên & Đoàn Trường
                </Link>

                <Link 
                  to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    backgroundColor: '#ffffff',
                    color: '#1e3a8a',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  <ShieldCheck size={18} color="#2563eb" /> Đăng Nhập Cổng Ban Giám Hiệu / Quản Trị
                </Link>

                <Link 
                  to="/chap-canh-uoc-mo"
                  style={{
                    color: '#64748b',
                    fontSize: '13px',
                    textDecoration: 'underline',
                    marginTop: '6px'
                  }}
                >
                  ← Trở về Trang Thông Tin Quỹ "Chắp Cánh Ước Mơ"
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Khi chọn một học sinh trong danh sách CSDL của lớp
  const handleSelectStudent = (stId) => {
    setSelectedStudentFromRoster(stId);
    const found = classStudents.find(s => s.id === stId || s.student_code === stId);
    if (found) {
      const activeClass = isGVCN ? teacherHomeroom : (found.student_class || selectedClass);
      setFormData(prev => ({
        ...prev,
        student_name: found.student_name || '',
        student_code: found.student_code || '',
        student_class: activeClass,
        gender: found.gender || 'Nam',
        birthday: found.birthday || '',
        phone: found.phone || found.parent_phone || '',
        parent_name: found.parent_name || '',
        parent_phone: found.parent_phone || '',
        home_address: found.address || found.home_address || 'Gia Lâm, Hà Nội'
      }));
    }
  };

  // Upload ảnh minh chứng hoàn cảnh
  const handleEvidenceUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploadingEvidence(true);
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      setFormData(prev => ({
        ...prev,
        evidence_urls: [...(prev.evidence_urls || []), ...results]
      }));
      setUploadingEvidence(false);
    }).catch(() => {
      setUploadingEvidence(false);
    });
  };

  const removeEvidence = (idx) => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: (prev.evidence_urls || []).filter((_, i) => i !== idx)
    }));
  };

  // Submit Đề xuất học sinh khó khăn
  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_name.trim() || !formData.student_class.trim()) {
      alert("Vui lòng chọn học sinh từ danh sách hoặc nhập đầy đủ Họ tên và Lớp.");
      return;
    }
    if (!formData.circumstance_story.trim()) {
      alert("Vui lòng nhập tóm tắt hoàn cảnh gia đình của học sinh để Lãnh đạo thẩm định.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await proposeStudentDifficulty(formData);
      if (res.success) {
        alert(`Đã gửi đề xuất học sinh ${formData.student_name} (${formData.student_class}) tới Ban Giám Hiệu phê duyệt!`);
        setShowAddModal(false);
        // Reset form
        setFormData({
          student_name: '',
          student_class: selectedClass,
          student_code: '',
          gender: 'Nam',
          birthday: '',
          phone: '',
          parent_name: '',
          parent_phone: '',
          home_address: '',
          category: DIFFICULT_CATEGORIES[0],
          academic_grade: 'Tốt',
          conduct_grade: 'Tốt',
          circumstance_story: '',
          dream_aspiration: '',
          target_support_amount: 2000000,
          granted_item: '',
          proposer_name: '',
          proposer_phone: '',
          proposed_by_role: 'homeroom_teacher',
          evidence_urls: []
        });
        setSelectedStudentFromRoster('');
        loadProposedList();
      }
    } catch (err) {
      alert("Lỗi khi gửi đề xuất: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Cập nhật tiến bộ học sinh
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressModalStudent) return;

    setSavingProgress(true);
    try {
      // 1. Cập nhật báo cáo tiến bộ truyền thống
      await addStudentProgressReport(progressModalStudent.id, progressData);
      
      // 2. Ghi cột mốc vào Hành trình trưởng thành số (Growth Timeline)
      await addGrowthTimelineMilestone(progressModalStudent.id, {
        title: progressData.growth_title || `Cập nhật tiến bộ: ${progressData.term}`,
        category: progressData.badge_awarded ? 'badge' : (progressData.student_letter ? 'letter' : 'academic'),
        description: progressData.teacher_notes + (progressData.student_letter ? `\n\nThư học trò: "${progressData.student_letter}"` : ''),
        badge_awarded: progressData.badge_awarded || null,
        academic_score: progressData.academic_score,
        conduct_grade: progressData.conduct,
        image_urls: progressData.letter_image_url ? [progressData.letter_image_url] : [],
        author_role: 'homeroom_teacher',
        author_name: progressModalStudent.proposer_name || 'GVCN'
      });

      alert(`Đã cập nhật báo cáo tiến bộ và ghi cột mốc trưởng thành của em ${progressModalStudent.student_name} tới Mạnh Thường Quân!`);
      setProgressModalStudent(null);
      setProgressData({
        term: 'Học kỳ I Năm học 2026-2027',
        growth_title: 'Báo cáo tiến bộ học kỳ I',
        academic_score: '8.5 (Học lực Tốt)',
        conduct: 'Tốt',
        teacher_notes: '',
        student_letter: '',
        letter_image_url: '',
        badge_awarded: ''
      });
      loadProposedList();
    } catch (err) {
      alert("Lỗi cập nhật tiến bộ: " + err.message);
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* BREADCRUMB */}
        <div style={styles.breadcrumb}>
          <Link to="/" style={styles.breadcrumbLink}><Home size={14} /> Trang chủ</Link>
          <ChevronRight size={14} color="#94a3b8" />
          <Link to="/chap-canh-uoc-mo" style={styles.breadcrumbLink}>🕊️ Quỹ "Chắp Cánh Ước Mơ"</Link>
          <ChevronRight size={14} color="#94a3b8" />
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Cổng GVCN & Đoàn Thanh Niên</span>
        </div>

        {/* ROLE IDENTIFICATION BANNER */}
        <div style={{
          backgroundColor: isAdmin ? '#eff6ff' : '#f0fdf4',
          border: `1.5px solid ${isAdmin ? '#bfdbfe' : '#bbf7d0'}`,
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>{isAdmin ? '🛡️' : '👨‍🏫'}</span>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: isAdmin ? '#1e40af' : '#166534' }}>
                {isAdmin ? 'PHIÊN LÀM VIỆC BAN GIÁM HIỆU / QUẢN TRỊ VIÊN' : `CÁN BỘ GIÁO VIÊN: ${teacher?.name || teacher?.full_name || 'Thầy/Cô'}`}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {isAdmin 
                  ? 'Thầy/Cô có toàn quyền rà soát, đề xuất học sinh cho tất cả các lớp và quản trị phê duyệt hồ sơ.'
                  : (teacherHomeroom ? `Phụ trách chủ nhiệm lớp: ${teacherHomeroom}. Thầy/Cô chỉ cần rà soát học sinh lớp mình để gửi BGH phê duyệt.` : 'Cán bộ Đoàn trường / Giáo viên bộ môn (Được quyền đề xuất học sinh có hoàn cảnh khó khăn toàn trường).')}
              </div>
            </div>
          </div>

          <div>
            {isAdmin ? (
              <Link 
                to="/admin/chap-canh-uoc-mo" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#1e40af',
                  textDecoration: 'none'
                }}
              >
                <span>⚙️ Bảng Quản Trị Quỹ BGH →</span>
              </Link>
            ) : (
              <Link 
                to="/teacher-dashboard" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#166534',
                  textDecoration: 'none'
                }}
              >
                <span>← Trở về Cổng Giáo Viên</span>
              </Link>
            )}
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerBadge}>
              <Heart size={16} color="#e11d48" />
              <span>DÀNH CHO GIÁO VIÊN CHỦ NHIỆM & ĐOÀN THANH NIÊN</span>
            </div>
            <h1 style={styles.headerTitle}>ĐỀ XUẤT HỌC SINH KHÓ KHĂN & THEO DÕI TIẾN BỘ</h1>
            <p style={styles.headerDesc}>
              Dựa vào CSDL học sinh có sẵn, thầy cô chọn học sinh cần giúp đỡ, cập nhật hoàn cảnh gia đình gửi BGH phê duyệt để kết nối Mạnh Thường Quân bảo trợ.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={loadProposedList} style={styles.refreshBtn}>
              <RefreshCw size={16} /> Làm mới
            </button>
            <button 
              onClick={() => {
                const targetCls = isGVCN ? teacherHomeroom : selectedClass;
                setFormData(prev => ({
                  ...prev,
                  student_class: targetCls,
                  proposed_by_role: isGVCN ? 'homeroom_teacher' : 'youth_union',
                  proposer_name: teacher?.name || teacher?.full_name || (isAdmin ? 'Ban Giám Hiệu' : 'Cán bộ Đoàn trường'),
                  proposer_phone: teacher?.phone || ''
                }));
                setShowAddModal(true);
              }} 
              style={styles.addBtn}
            >
              <Plus size={18} /> Đề Xuất Học Sinh Khó Khăn
            </button>
          </div>
        </div>

        {/* BỘ LỌC KHỐI LỚP & THỐNG KÊ NHANH (PHÂN QUYỀN GVCN VS ĐOÀN TRƯỜNG/BGH) */}
        <div style={styles.filterCard}>
          {isGVCN ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏫</span> Lớp Chủ Nhiệm Phụ Trách:
              </label>
              <div style={{
                padding: '6px 14px',
                backgroundColor: '#dcfce7',
                border: '1.5px solid #86efac',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '900',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>Lớp {teacherHomeroom}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🔒 Cố định theo GVCN
                </span>
              </div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                (Sĩ số: {classStudents.length} học sinh trong CSDL - Khóa bảo mật theo đúng lớp phụ trách)
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏛️</span> Chọn Lớp Rà Soát (Toàn Trường):
              </label>
              <select 
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setFormData(prev => ({ ...prev, student_class: e.target.value }));
                }}
                style={styles.selectClass}
              >
                {ALL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>Lớp {cls}</option>
                ))}
              </select>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #c7d2fe'
              }}>
                🛡️ Thẩm quyền Đoàn Thanh Niên / BGH
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                (Sĩ số: {classStudents.length} học sinh trong CSDL)
              </span>
            </div>
          )}

          <div style={styles.statSummary}>
            <div style={styles.statBadge}>
              <span>Tổng đề xuất: <strong>{proposedList.length}</strong></span>
            </div>
            <div style={{ ...styles.statBadge, background: '#fef3c7', color: '#92400e' }}>
              <span>Chờ BGH duyệt: <strong>{proposedList.filter(p => p.sponsorship_status === 'pending_approval').length}</strong></span>
            </div>
            <div style={{ ...styles.statBadge, background: '#ecfdf5', color: '#065f46' }}>
              <span>Đã duyệt (Chờ MTQ): <strong>{proposedList.filter(p => p.sponsorship_status === 'ready_for_sponsor').length}</strong></span>
            </div>
            <div style={{ ...styles.statBadge, background: '#eff6ff', color: '#1e40af' }}>
              <span>Đã có MTQ Bảo Trợ: <strong>{proposedList.filter(p => p.sponsorship_status === 'sponsored').length}</strong></span>
            </div>
          </div>
        </div>

        {/* DANH SÁCH CÁC HỌC SINH ĐÃ ĐƯỢC ĐỀ XUẤT */}
        <div style={styles.panel}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>
            Danh Sách Học Sinh Hoàn Cảnh Khó Khăn Đã Đề Xuất
          </h3>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>STT</th>
                  <th style={styles.th}>Mã Hồ Sơ</th>
                  <th style={styles.th}>Họ và Tên Học Sinh</th>
                  <th style={styles.th}>Lớp</th>
                  <th style={styles.th}>Diện Khó Khăn</th>
                  <th style={styles.th}>Mức Đề Xuất</th>
                  <th style={styles.th}>Trạng Thái BGH & MTQ</th>
                  <th style={styles.th}>Mạnh Thường Quân Bảo Trợ</th>
                  <th style={styles.thCenter}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {proposedList.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Chưa có học sinh nào được đề xuất hỗ trợ. Thầy cô bấm nút "Đề Xuất Học Sinh Khó Khăn" để tạo mới!
                    </td>
                  </tr>
                ) : (
                  proposedList.map((item, idx) => (
                    <tr key={item.id || idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td style={styles.tdCenter}>{idx + 1}</td>
                      <td style={styles.tdCode}>{item.application_code}</td>
                      <td style={styles.tdBold}>{item.student_name}</td>
                      <td style={styles.tdCenter}>
                        <span style={styles.classBadge}>{item.student_class}</span>
                      </td>
                      <td style={styles.td}>{item.category}</td>
                      <td style={styles.tdAmount}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>
                          {Number(item.target_support_amount || 2000000).toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td style={styles.tdCenter}>
                        {item.sponsorship_status === 'pending_approval' && (
                          <span style={styles.badgePending}>⏳ Chờ BGH duyệt</span>
                        )}
                        {item.sponsorship_status === 'ready_for_sponsor' && (
                          <span style={styles.badgeReady}>🌟 BGH đã duyệt (Sẵn sàng nhận MTQ)</span>
                        )}
                        {item.sponsorship_status === 'sponsored' && (
                          <span style={styles.badgeSponsored}>🤝 ĐÃ CÓ MTQ BẢO TRỢ</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {item.sponsor_name ? (
                          <div>
                            <strong style={{ color: '#1e3a8a' }}>{item.sponsor_name}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Đã giải ngân: {(Number(item.delivered_amount) || 0).toLocaleString('vi-VN')} đ
                            </div>
                            {item.mentor_name && (
                              <div style={{ marginTop: '4px', fontSize: '11px', color: '#047857', fontWeight: 600 }}>
                                🧭 Cố vấn: {item.mentor_name}
                              </div>
                            )}
                            {Array.isArray(item.student_badges) && item.student_badges.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                {item.student_badges.map((b, bi) => (
                                  <span key={bi} style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                                    🏅 {b}
                                  </span>
                                ))}
                              </div>
                            )}
                            {Array.isArray(item.messages_from_sponsor) && item.messages_from_sponsor.length > 0 && (
                              <div style={{ marginTop: '4px', fontSize: '11px', color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <MessageSquare size={12} /> Có {item.messages_from_sponsor.length} lời nhắn từ MTQ
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Đang chờ kết nối...</span>
                        )}
                      </td>
                      <td style={styles.tdCenter}>
                        <button 
                          onClick={() => {
                            setProgressModalStudent(item);
                            setProgressData({
                              term: 'Học kỳ I Năm học 2026-2027',
                              growth_title: 'Báo cáo tiến bộ học kỳ I',
                              academic_score: `${item.academic_grade || 'Tốt'} (Học lực)`,
                              conduct: item.conduct_grade || 'Tốt',
                              teacher_notes: '',
                              student_letter: '',
                              letter_image_url: '',
                              badge_awarded: ''
                            });
                          }}
                          style={styles.progressBtn}
                          title="Cập nhật kết quả rèn luyện & thư cảm ơn gửi MTQ"
                        >
                          <BookOpen size={14} /> Báo cáo tiến bộ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== MODAL ĐỀ XUẤT HỌC SINH MỚI ===================== */}
        {showAddModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                    Phiếu Đề Xuất Học Sinh Hoàn Cảnh Khó Khăn (Lớp {isGVCN ? teacherHomeroom : selectedClass})
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    Chọn học sinh từ CSDL có sẵn và cập nhật thông tin gia cảnh để trình Lãnh đạo thẩm định.
                  </p>
                </div>
                <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>×</button>
              </div>

              <form onSubmit={handleProposalSubmit} style={{ padding: '24px' }}>
                {/* 1. CHỌN HỌC SINH TỪ CSDL */}
                <div style={styles.formSection}>
                  <h4 style={styles.sectionHeading}>1. Chọn học sinh từ CSDL lớp {isGVCN ? teacherHomeroom : selectedClass}</h4>
                  <div>
                    <label style={styles.label}>Chọn học sinh trong danh sách lớp (*)</label>
                    <select 
                      value={selectedStudentFromRoster}
                      onChange={(e) => handleSelectStudent(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">-- Bấm vào đây để chọn học sinh từ CSDL --</option>
                      {classStudents.map(st => (
                        <option key={st.id || st.student_code} value={st.id || st.student_code}>
                          {st.student_name} (Mã HS: {st.student_code || 'Chưa có'} - {st.gender || 'Nam'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.row2}>
                    <div>
                      <label style={styles.label}>Họ và tên học sinh (*)</label>
                      <input 
                        required
                        type="text" 
                        value={formData.student_name}
                        onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Mã học sinh</label>
                      <input 
                        type="text" 
                        value={formData.student_code}
                        onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.row3}>
                    <div>
                      <label style={styles.label}>Giới tính</label>
                      <select 
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        style={styles.select}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Họ tên Phụ huynh</label>
                      <input 
                        type="text" 
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>SĐT Liên hệ (*)</label>
                      <input 
                        required
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. HOÀN CẢNH GIA ĐÌNH & NHU CẦU */}
                <div style={styles.formSection}>
                  <h4 style={styles.sectionHeading}>2. Thông tin điều kiện hoàn cảnh & Nhu cầu bảo trợ</h4>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={styles.label}>Diện khó khăn / Ưu tiên (*)</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={styles.select}
                    >
                      {DIFFICULT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={styles.label}>Tóm tắt hoàn cảnh gia đình cụ thể (GVCN khảo sát thực tế) (*)</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Mô tả hoàn cảnh gia đình (thu nhập, nhà ở, bố mẹ làm gì, có ai ốm đau, anh chị em đi học...)"
                      value={formData.circumstance_story}
                      onChange={(e) => setFormData({ ...formData, circumstance_story: e.target.value })}
                      style={styles.textarea}
                    />
                  </div>

                  <div style={styles.row2}>
                    <div>
                      <label style={styles.label}>Mức kinh phí đề xuất bảo trợ (VNĐ/đợt)</label>
                      <input 
                        type="number" 
                        value={formData.target_support_amount}
                        onChange={(e) => setFormData({ ...formData, target_support_amount: Number(e.target.value) })}
                        style={styles.input}
                        placeholder="VD: 2000000 hoặc 4500000"
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Hiện vật cần hỗ trợ thêm (nếu có)</label>
                      <input 
                        type="text" 
                        value={formData.granted_item}
                        onChange={(e) => setFormData({ ...formData, granted_item: e.target.value })}
                        style={styles.input}
                        placeholder="VD: 1 xe đạp, góc học tập, thẻ BHYT..."
                      />
                    </div>
                  </div>

                  <div style={styles.row2}>
                    <div>
                      <label style={styles.label}>Họ tên GVCN / Người đề xuất (*)</label>
                      <input 
                        required
                        type="text" 
                        placeholder="VD: Thầy Nguyễn Văn Nam (GVCN)"
                        value={formData.proposer_name}
                        onChange={(e) => setFormData({ ...formData, proposer_name: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Số điện thoại GVCN (*)</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="VD: 0912345678"
                        value={formData.proposer_phone}
                        onChange={(e) => setFormData({ ...formData, proposer_phone: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. TẢI ẢNH MINH CHỨNG */}
                <div style={styles.formSection}>
                  <h4 style={styles.sectionHeading}>3. Ảnh chụp minh chứng hoàn cảnh (Nếu có)</h4>
                  <input 
                    type="file" 
                    id="teacher-evidence-upload"
                    multiple
                    accept="image/*"
                    onChange={handleEvidenceUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="teacher-evidence-upload" style={styles.uploadBtn}>
                    <Upload size={16} />
                    <span>{uploadingEvidence ? 'Đang nạp ảnh...' : 'Chọn ảnh chụp minh chứng / hoàn cảnh gia đình'}</span>
                  </label>

                  {formData.evidence_urls && formData.evidence_urls.length > 0 && (
                    <div style={styles.evidenceGrid}>
                      {formData.evidence_urls.map((img, idx) => (
                        <div key={idx} style={styles.evidenceItem}>
                          <img src={img} alt="Minh chứng" style={styles.evidenceImg} />
                          <button type="button" onClick={() => removeEvidence(idx)} style={styles.removeImgBtn}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting} style={styles.submitBtn}>
                    <Send size={16} />
                    <span>{submitting ? 'Đang gửi đề xuất...' : 'GỬI BAN GIÁM HIỆU PHÊ DUYỆT'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== MODAL CẬP NHẬT TIẾN BỘ HỌC SINH GỬI MTQ ===================== */}
        {progressModalStudent && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '640px' }}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                    Cập Nhật Tiến Bộ Học Tập: {progressModalStudent.student_name} ({progressModalStudent.student_class})
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    Mạnh Thường Quân bảo trợ: <strong>{progressModalStudent.sponsor_name || 'Quỹ Chắp Cánh Ước Mơ'}</strong>
                  </p>
                </div>
                <button onClick={() => setProgressModalStudent(null)} style={styles.closeBtn}>×</button>
              </div>

              <form onSubmit={handleProgressSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Array.isArray(progressModalStudent.messages_from_sponsor) && progressModalStudent.messages_from_sponsor.length > 0 && (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#92400e' }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <MessageSquare size={15} /> Lời nhắn gửi từ Mạnh Thường Quân:
                    </div>
                    {progressModalStudent.messages_from_sponsor.slice(0, 2).map((m, mi) => (
                      <div key={mi} style={{ fontStyle: 'italic', marginTop: '2px' }}>
                        "{m.message || m}" <span style={{ fontSize: '11px', color: '#b45309' }}>({m.date || 'Gần đây'})</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label style={styles.label}>Tiêu đề Cột Mốc Trưởng Thành (*)</label>
                  <input 
                    required
                    type="text" 
                    value={progressData.growth_title}
                    onChange={(e) => setProgressData({ ...progressData, growth_title: e.target.value })}
                    style={styles.input}
                    placeholder="VD: Báo cáo kết quả giữa kỳ I / Em nhận bàn học mới"
                  />
                </div>

                <div>
                  <label style={styles.label}>Kỳ báo cáo tiến độ (*)</label>
                  <input 
                    required
                    type="text" 
                    value={progressData.term}
                    onChange={(e) => setProgressData({ ...progressData, term: e.target.value })}
                    style={styles.input}
                    placeholder="VD: Giữa Học kỳ I Năm học 2026-2027"
                  />
                </div>

                <div style={styles.row2}>
                  <div>
                    <label style={styles.label}>Điểm số / Xếp loại học tập</label>
                    <input 
                      type="text" 
                      value={progressData.academic_score}
                      onChange={(e) => setProgressData({ ...progressData, academic_score: e.target.value })}
                      style={styles.input}
                      placeholder="VD: 8.5 (Học lực Tốt)"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Xếp loại Hạnh kiểm / Nề nếp</label>
                    <input 
                      type="text" 
                      value={progressData.conduct}
                      onChange={(e) => setProgressData({ ...progressData, conduct: e.target.value })}
                      style={styles.input}
                      placeholder="VD: Tốt"
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Trao Huy Hiệu Vươn Lên (Xuất hiện trên Hồ sơ số học trò)</label>
                  <select
                    value={progressData.badge_awarded}
                    onChange={(e) => setProgressData({ ...progressData, badge_awarded: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">(Không trao huy hiệu đợt này)</option>
                    <option value="Vượt khó học tốt">🏅 Vượt khó học tốt</option>
                    <option value="Bứt phá điểm số">🚀 Bứt phá điểm số</option>
                    <option value="Đoàn viên gương mẫu">⭐ Đoàn viên gương mẫu</option>
                    <option value="Đôi bạn cùng tiến">🤝 Đôi bạn cùng tiến</option>
                    <option value="Ý chí kiên cường">💡 Ý chí kiên cường</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Nhận xét của GVCN về sự tiến bộ của học sinh (*)</label>
                  <textarea 
                    required
                    rows={3}
                    value={progressData.teacher_notes}
                    onChange={(e) => setProgressData({ ...progressData, teacher_notes: e.target.value })}
                    style={styles.textarea}
                    placeholder="VD: Em An đã có xe đạp đi học đúng giờ, điểm thi giữa kỳ môn Toán đạt 8.5, chăm ngoan và tự tin hơn rất nhiều..."
                  />
                </div>

                <div>
                  <label style={styles.label}>Thư cảm ơn / Lời nhắn của học sinh gửi Mạnh Thường Quân</label>
                  <textarea 
                    rows={3}
                    value={progressData.student_letter}
                    onChange={(e) => setProgressData({ ...progressData, student_letter: e.target.value })}
                    style={styles.textarea}
                    placeholder="Lời cảm ơn chân thành từ học sinh gửi tới bác/cô chú nhà tài trợ..."
                  />
                </div>

                <div>
                  <label style={styles.label}>Link Ảnh Thư Tay Học Sinh / Ảnh Trao Quà Thực Tế (Không bắt buộc)</label>
                  <input 
                    type="url" 
                    value={progressData.letter_image_url}
                    onChange={(e) => setProgressData({ ...progressData, letter_image_url: e.target.value })}
                    style={styles.input}
                    placeholder="https://... ảnh nét chữ thư tay hoặc ảnh em nhận góc học tập mới"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setProgressModalStudent(null)} style={styles.cancelBtn}>
                    Hủy
                  </button>
                  <button type="submit" disabled={savingProgress} style={styles.submitBtn}>
                    <CheckCircle2 size={16} />
                    <span>{savingProgress ? 'Đang lưu...' : 'Gửi Báo Cáo Tiến Bộ Cho MTQ'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '85vh',
    backgroundColor: '#f8fafc',
    padding: '20px 16px 60px 16px'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  breadcrumbLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500
  },
  container: {
    maxWidth: '1350px',
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#ffe4e6',
    color: '#be123c',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '8px'
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px'
  },
  headerDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 14px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer'
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer'
  },
  filterCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '16px 20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  selectClass: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none'
  },
  statSummary: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  statBadge: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    background: '#f1f5f9',
    color: '#334155'
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
  },
  tableWrap: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    background: '#f8fafc',
    padding: '12px 14px',
    textAlign: 'left',
    color: '#475569',
    fontWeight: 700,
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap'
  },
  thCenter: {
    background: '#f8fafc',
    padding: '12px 14px',
    textAlign: 'center',
    color: '#475569',
    fontWeight: 700,
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155'
  },
  tdBold: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    fontWeight: 700,
    color: '#0f172a'
  },
  tdCenter: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'center',
    color: '#64748b'
  },
  tdCode: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#2563eb'
  },
  tdAmount: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'right'
  },
  trEven: {
    background: '#ffffff'
  },
  trOdd: {
    background: '#fafafa'
  },
  classBadge: {
    background: '#f1f5f9',
    color: '#334155',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600
  },
  badgePending: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '12px',
    display: 'inline-block'
  },
  badgeReady: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '12px',
    display: 'inline-block'
  },
  badgeSponsored: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '12px',
    display: 'inline-block'
  },
  progressBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563eb',
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px'
  },
  modalContent: {
    background: '#ffffff',
    borderRadius: '16px',
    maxWidth: '780px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    color: '#64748b',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1
  },
  formSection: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '18px',
    marginBottom: '16px',
    border: '1px solid #f1f5f9'
  },
  sectionHeading: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 14px 0',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '6px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '12px'
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '12px'
  },
  uploadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#ffffff',
    border: '1px dashed #2563eb',
    color: '#2563eb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  evidenceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: '10px',
    marginTop: '12px'
  },
  evidenceItem: {
    position: 'relative',
    height: '80px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #cbd5e1'
  },
  evidenceImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removeImgBtn: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px'
  },
  cancelBtn: {
    padding: '9px 18px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 22px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
