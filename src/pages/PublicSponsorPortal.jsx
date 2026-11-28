// =========================================================================
// TRANG DÀNH RIÊNG CHO MẠNH THƯỜNG QUÂN (BẢO VỆ QUYỀN RIÊNG TƯ HỌC SINH)
// QUY TẮC BẢO MẬT: THÔNG TIN HỌC SINH CHỈ HIỂN THỊ KHI MTQ ĐÃ ĐĂNG NHẬP / XÁC THỰC
// Tránh lộ lọt thông tin và bảo vệ sự tự tôn, tâm lý học sinh khó khăn
// =========================================================================

import { useState, useEffect } from 'react';
import { 
  Heart, ShieldCheck, Award, FileText, CheckCircle2, Clock, 
  Search, ArrowRight, DollarSign, ExternalLink, QrCode, 
  MessageSquare, User, Calendar, Download, Sparkles, AlertCircle, 
  Image, Check, Copy, ChevronRight, Lock, Key, LogIn, LogOut,
  UserCheck, Shield, HelpCircle, Compass, Star, BookOpen, CheckCircle
} from 'lucide-react';
import { 
  fetchApprovedStudentsForSponsors, 
  registerSponsorForStudent, 
  fetchSponsorPortfolio, 
  sendSponsorEncouragementMessage,
  fetchFundSettings,
  exportHandoverDocx,
  exportSponsorReportExcel,
  exportThankYouLetterDocx,
  verifyDisbursementCode
} from '../services/scholarshipFundService';

export default function PublicSponsorPortal() {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'my_students' | 'audit_flow'
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [mySponsoredStudents, setMySponsoredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundSettings, setFundSettings] = useState(null);

  // Phiên đăng nhập Mạnh Thường Quân
  const [sponsorSession, setSponsorSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cbq_sponsor_session')) || null;
    } catch (_) {
      return null;
    }
  });

  // State Đăng nhập cho MTQ đã có mã
  const [loginCode, setLoginCode] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // State Đăng ký nhanh cho MTQ mới
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    phone: '',
    organization: '',
    intended_package: 'term' // 'month' | 'term' | 'year'
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Modal Nhận Bảo Trợ Học Sinh
  const [adoptingStudent, setAdoptingStudent] = useState(null);
  const [adoptFormData, setAdoptFormData] = useState({
    custom_amount: 2000000,
    package_type: 'term',
    note: ''
  });
  const [adoptingSubmitting, setAdoptingSubmitting] = useState(false);
  const [adoptSuccessInfo, setAdoptSuccessInfo] = useState(null);

  // Modal Gửi Lời Nhắn Động Viên
  const [messageStudent, setMessageStudent] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Tìm kiếm học sinh (khi đã đăng nhập)
  const [searchStudent, setSearchStudent] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Quỹ 2.0: Modal Hành trình trưởng thành số & Tra cứu mã băm xác thực
  const [viewTimelineStudent, setViewTimelineStudent] = useState(null);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerifyCode = async (e) => {
    e?.preventDefault();
    if (!verifyCodeInput.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await verifyDisbursementCode(verifyCodeInput);
      setVerifyResult(res);
    } catch {
      setVerifyResult({ valid: false, message: 'Lỗi tra cứu máy chủ xác thực.' });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [sponsorSession]);

  async function loadPortalData() {
    setLoading(true);
    try {
      const [approvedList, settings] = await Promise.all([
        fetchApprovedStudentsForSponsors(),
        fetchFundSettings()
      ]);
      setApprovedStudents(approvedList || []);
      setFundSettings(settings);

      // Nếu MTQ đã đăng nhập, nạp danh sách các em mà MTQ này đang bảo trợ
      if (sponsorSession?.sponsor_code || sponsorSession?.phone) {
        const myPortfolio = await fetchSponsorPortfolio(sponsorSession.sponsor_code || sponsorSession.phone);
        setMySponsoredStudents(myPortfolio || []);
      }
    } catch (e) {
      console.warn("Lỗi nạp cổng Mạnh Thường Quân:", e);
    } finally {
      setLoading(false);
    }
  }

  // 1. ĐĂNG NHẬP DÀNH CHO MTQ ĐÃ CÓ MÃ / SĐT
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const q = (loginCode || loginPhone).trim();
    if (!q) {
      alert("Vui lòng nhập Mã Mạnh Thường Quân hoặc Số điện thoại đã đăng ký.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const portfolio = await fetchSponsorPortfolio(q);
      const sponsorCode = q.toUpperCase().startsWith('MTQ') ? q.toUpperCase() : `MTQ-${q.slice(-4)}`;
      const sponsorName = portfolio.length > 0 ? portfolio[0].sponsor_name : (loginCode || 'Mạnh Thường Quân');

      const newSession = {
        sponsor_code: sponsorCode,
        sponsor_name: sponsorName,
        phone: portfolio.length > 0 ? portfolio[0].sponsor_phone : q
      };

      localStorage.setItem('cbq_sponsor_session', JSON.stringify(newSession));
      setSponsorSession(newSession);
      setMySponsoredStudents(portfolio);
      setActiveTab(portfolio.length > 0 ? 'my_students' : 'marketplace');
      alert(`Xin kính chào Mạnh Thường Quân: ${newSession.sponsor_name}! Quý vị đã đăng nhập thành công.`);
    } catch (err) {
      alert("Lỗi xác thực: " + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. ĐĂNG KÝ NHANH CHO MTQ MỚI THAM GIA ĐỂ NHẬN QUYỀN XEM HỒ SƠ
  const handleQuickRegisterSubmit = (e) => {
    e.preventDefault();
    if (!registerForm.full_name.trim() || !registerForm.phone.trim()) {
      alert("Vui lòng điền Họ tên và Số điện thoại liên hệ (*)");
      return;
    }

    setIsRegistering(true);
    try {
      const timeSuffix = Date.now().toString(36).toUpperCase().slice(-4);
      const newCode = `MTQ-CBQ-${timeSuffix}`;
      const newSession = {
        sponsor_code: newCode,
        sponsor_name: registerForm.full_name.trim(),
        phone: registerForm.phone.trim(),
        organization: registerForm.organization.trim() || 'Cá nhân hảo tâm'
      };

      localStorage.setItem('cbq_sponsor_session', JSON.stringify(newSession));
      setSponsorSession(newSession);
      setActiveTab('marketplace');
      alert(`Đăng ký thành công! Mã Mạnh Thường Quân của Quý vị là: ${newCode}.\nQuý vị đã được cấp quyền xem danh mục học sinh khó khăn.`);
    } catch (err) {
      alert("Lỗi đăng ký: " + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Đăng xuất an toàn
  const handleLogout = () => {
    localStorage.removeItem('cbq_sponsor_session');
    setSponsorSession(null);
    setMySponsoredStudents([]);
    setActiveTab('marketplace');
  };

  // Nhận bảo trợ học sinh
  const handleAdoptSubmit = async (e) => {
    e.preventDefault();
    if (!adoptingStudent) return;

    setAdoptingSubmitting(true);
    try {
      const finalAmount = Number(adoptFormData.custom_amount) || 2000000;
      const res = await registerSponsorForStudent(adoptingStudent.id, {
        sponsor_name: sponsorSession.sponsor_name,
        sponsor_phone: sponsorSession.phone,
        sponsor_code: sponsorSession.sponsor_code,
        amount: finalAmount
      });

      if (res.success) {
        setAdoptSuccessInfo({
          student: adoptingStudent,
          amount: finalAmount,
          sponsorCode: res.sponsorCode
        });
        setAdoptingStudent(null);
        loadPortalData();
      }
    } catch (err) {
      alert("Lỗi đăng ký bảo trợ: " + err.message);
    } finally {
      setAdoptingSubmitting(false);
    }
  };

  // Gửi lời nhắn động viên
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageStudent || !messageContent.trim()) return;

    setSendingMsg(true);
    try {
      await sendSponsorEncouragementMessage(messageStudent.id, {
        sender_name: sponsorSession?.sponsor_name || 'Mạnh Thường Quân',
        content: messageContent.trim()
      });
      alert(`Đã gửi lời nhắn tới em ${messageStudent.student_name}! Nhà trường sẽ chuyển lời nhắn này tới em.`);
      setMessageStudent(null);
      setMessageContent('');
      loadPortalData();
    } catch (err) {
      alert("Lỗi gửi lời nhắn: " + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  // Lọc học sinh (sau khi đã đăng nhập)
  const filteredStudents = approvedStudents.filter(st => {
    if (filterClass !== 'all' && st.student_class !== filterClass) return false;
    if (searchStudent) {
      const q = searchStudent.toLowerCase();
      const name = (st.student_name || '').toLowerCase();
      const cls = (st.student_class || '').toLowerCase();
      const code = (st.application_code || '').toLowerCase();
      return name.includes(q) || cls.includes(q) || code.includes(q);
    }
    return true;
  });

  // Thống kê ẩn danh khi chưa đăng nhập
  const countGrade10 = approvedStudents.filter(s => (s.student_class || '').startsWith('10')).length;
  const countGrade11 = approvedStudents.filter(s => (s.student_class || '').startsWith('11')).length;
  const countGrade12 = approvedStudents.filter(s => (s.student_class || '').startsWith('12')).length;

  const currentAcc = fundSettings?.bank_account_number || '1028688888';
  const currentAccName = fundSettings?.bank_account_name || 'QUY HOC BONG CHAP CANH UOC MO THPT CAO BA QUAT';

  return (
    <div style={styles.pageWrap}>
      {/* HERO BANNER CHO MẠNH THƯỜNG QUÂN */}
      <div style={styles.heroBanner}>
        <div style={styles.heroContainer}>
          <div style={styles.badgeTop}>
            <Sparkles size={16} color="#fbbf24" />
            <span>ĐỒNG HÀNH TIẾP SỨC • MINH BẠCH NGUỒN TIỀN 100%</span>
          </div>
          <h1 style={styles.heroTitle}>CỔNG MẠNH THƯỜNG QUÂN BẢO TRỢ HỌC SINH</h1>
          <p style={styles.heroSubtitle}>
            Chương trình bảo trợ trực tiếp học sinh có hoàn cảnh éo le trường THPT Cao Bá Quát. 
            Mạnh Thường Quân kiểm soát chính xác nguồn tiền tài trợ tận tay học sinh và theo dõi hành trình tiến bộ của các em.
          </p>

          {/* THANH TRẠNG THÁI ĐĂNG NHẬP */}
          {sponsorSession ? (
            <div style={styles.sessionBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={styles.userAvatar}><User size={20} color="#ffffff" /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', color: '#93c5fd' }}>Xin kính chào Quý Mạnh Thường Quân:</div>
                  <strong style={{ fontSize: '16px', color: '#ffffff' }}>{sponsorSession.sponsor_name}</strong>
                  <span style={styles.codePill}>Mã MTQ: {sponsorSession.sponsor_code}</span>
                </div>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={15} /> Đăng Xuất Bảo Mật
              </button>
            </div>
          ) : (
            <div style={styles.privacyNoticeBanner}>
              <ShieldCheck size={20} color="#10b981" />
              <span>
                <strong>CAM KẾT BẢO MẬT & TÔN TRỌNG TỰ TÔN CỦA HỌC SINH:</strong> Để tránh gây tổn thương tâm lý và bảo vệ quyền riêng tư của các em học sinh có hoàn cảnh khó khăn, 
                danh sách hồ sơ chi tiết các em chỉ được hiển thị khi Quý Mạnh Thường Quân đăng nhập hoặc xác thực thông tin.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRƯỜNG HỢP 1: KHI CHƯA ĐĂNG NHẬP (BẢO VỆ THÔNG TIN HỌC SINH TUYỆT ĐỐI) */}
      {/* ========================================================================= */}
      {!sponsorSession ? (
        <div style={styles.mainContainer}>
          {/* CARDS THỐNG KÊ ẨN DANH */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIconWrap}><Heart size={26} color="#e11d48" /></div>
              <div style={styles.statValue}>{approvedStudents.length} <span style={{ fontSize: '14px', fontWeight: 500 }}>học sinh</span></div>
              <div style={styles.statLabel}>Học sinh khó khăn đã được BGH duyệt</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIconWrap}><Award size={26} color="#2563eb" /></div>
              <div style={styles.statValue}>{countGrade10} <span style={{ fontSize: '13px', color: '#64748b' }}>(Khối 10)</span> • {countGrade11} <span style={{ fontSize: '13px', color: '#64748b' }}>(K11)</span> • {countGrade12} <span style={{ fontSize: '13px', color: '#64748b' }}>(K12)</span></div>
              <div style={styles.statLabel}>Phân bổ các em theo từng khối lớp</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIconWrap}><ShieldCheck size={26} color="#059669" /></div>
              <div style={styles.statValue}>100% <span style={{ fontSize: '14px', fontWeight: 500 }}>Minh bạch</span></div>
              <div style={styles.statLabel}>Có biên bản NĐ30 & ảnh trao tiền tận tay</div>
            </div>
          </div>

          {/* 2 CỘT: ĐĂNG NHẬP & ĐĂNG KÝ MTQ MỚI */}
          <div style={styles.authGrid}>
            {/* CỘT TRÁI: DÀNH CHO MTQ ĐÃ CÓ MÃ HOẶC SĐT */}
            <div style={styles.authCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={styles.authIconCircle}><Key size={20} color="#2563eb" /></div>
                <h3 style={styles.authTitle}>Đã Có Mã Mạnh Thường Quân / Đã Từng Tài Trợ</h3>
              </div>
              <p style={styles.authDesc}>
                Quý vị đã có Mã bảo mật (ví dụ: MTQ-CBQ-...) hoặc từng đăng ký tài trợ trước đây, vui lòng nhập mã hoặc SĐT để vào cổng.
              </p>

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={styles.label}>Mã MTQ hoặc Số điện thoại (*)</label>
                  <input 
                    required
                    type="text" 
                    placeholder="VD: MTQ-CBQ-7788 hoặc 0988888888"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <button type="submit" disabled={isLoggingIn} style={styles.loginBtn}>
                  <LogIn size={16} />
                  <span>{isLoggingIn ? 'Đang xác thực...' : 'ĐĂNG NHẬP CỔNG MTQ'}</span>
                </button>
              </form>
            </div>

            {/* CỘT PHẢI: DÀNH CHO MTQ MỚI THAM GIA */}
            <div style={styles.authCardHighlight}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ ...styles.authIconCircle, background: '#ecfdf5', color: '#059669' }}>
                  <Heart size={20} color="#059669" />
                </div>
                <h3 style={{ ...styles.authTitle, color: '#065f46' }}>Quý Vị Muốn Tham Gia Nhận Bảo Trợ Học Sinh?</h3>
              </div>
              <p style={styles.authDesc}>
                Đăng ký xác thực nhanh 30 giây để được cấp Mã Mạnh Thường Quân và mở quyền xem danh sách các em học sinh có hoàn cảnh khó khăn.
              </p>

              <form onSubmit={handleQuickRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={styles.row2}>
                  <div>
                    <label style={styles.label}>Họ tên MTQ / Tên Doanh nghiệp (*)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="VD: Bác Nguyễn Văn Tuấn hoặc Cựu HS K2005"
                      value={registerForm.full_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Số điện thoại liên hệ (*)</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="VD: 0912345678"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Dự kiến gói bảo trợ quan tâm</label>
                  <select 
                    value={registerForm.intended_package}
                    onChange={(e) => setRegisterForm({ ...registerForm, intended_package: e.target.value })}
                    style={styles.select}
                  >
                    <option value="month">Gói 500.000 đ/tháng (Hỗ trợ ăn sáng, đồ dùng học tập)</option>
                    <option value="term">Gói 2.000.000 đ/học kỳ (Học bổng trang trải chi phí học tập)</option>
                    <option value="year">Gói 4.500.000 đ/năm (Bảo trợ trọn vẹn cả năm học)</option>
                    <option value="custom">Gói tùy chọn / Hiện vật (Xe đạp, máy tính, thẻ BHYT)</option>
                  </select>
                </div>

                <button type="submit" disabled={isRegistering} style={styles.registerBtn}>
                  <UserCheck size={16} />
                  <span>{isRegistering ? 'Đang tạo mã MTQ...' : 'XÁC NHẬN & XEM DANH MỤC HỌC SINH KHÓ KHĂN'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (

      /* ========================================================================= */
      /* TRƯỜNG HỢP 2: KHI MẠNH THƯỜNG QUÂN ĐÃ ĐĂNG NHẬP / XÁC THỰC THÀNH CÔNG */
      /* ========================================================================= */
        <div>
          {/* THANH ĐIỀU HƯỚNG TABS RIÊNG CỦA MTQ */}
          <div style={styles.navBar}>
            <div style={styles.navContainer}>
              <button 
                onClick={() => setActiveTab('marketplace')}
                style={activeTab === 'marketplace' ? styles.tabActive : styles.tab}
              >
                <Heart size={18} color="#e11d48" /> 1. Danh Mục Học Sinh Chờ Bảo Trợ ({approvedStudents.length})
              </button>

              <button 
                onClick={() => setActiveTab('my_students')}
                style={activeTab === 'my_students' ? styles.tabActive : styles.tab}
              >
                <ShieldCheck size={18} color="#2563eb" /> 2. Học Sinh Tôi Đang Bảo Trợ ({mySponsoredStudents.length})
              </button>

              <button 
                onClick={() => setActiveTab('audit_flow')}
                style={activeTab === 'audit_flow' ? styles.tabActive : styles.tab}
              >
                <DollarSign size={18} color="#059669" /> 3. Giám Sát Nguồn Tiền & Biên Bản Trao Tiền
              </button>
            </div>
          </div>

          <div style={styles.mainContainer}>

            {/* TAB 1: DANH MỤC HỌC SINH CẦN BẢO TRỢ (ĐÃ BẢO MẬT THEO QUYỀN MTQ) */}
            {activeTab === 'marketplace' && (
              <div>
                <div style={styles.sectionHeaderRow}>
                  <div>
                    <h2 style={styles.sectionTitle}>Danh Sách Học Sinh Hoàn Cảnh Khó Khăn Đã Phê Duyệt</h2>
                    <p style={styles.sectionDesc}>
                      Dữ liệu nội bộ được thẩm định bởi BGH & GVCN. Kính mong Quý vị bảo mật thông tin để tôn trọng các em.
                    </p>
                  </div>

                  <input 
                    type="text" 
                    placeholder="🔍 Tìm theo tên, lớp học, mã hồ sơ..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                {filteredStudents.length === 0 ? (
                  <div style={styles.emptyCard}>
                    <AlertCircle size={40} color="#94a3b8" />
                    <h4 style={{ margin: '12px 0 6px 0', color: '#1e293b' }}>Hiện chưa có học sinh nào trong danh mục chờ bảo trợ</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                      Toàn bộ các em khó khăn đợt này đã được các Mạnh Thường Quân nhận hỗ trợ. Nhà trường sẽ tiếp tục cập nhật các đợt tiếp theo.
                    </p>
                  </div>
                ) : (
                  <div style={styles.cardsGrid}>
                    {filteredStudents.map(student => (
                      <div key={student.id} style={styles.studentCard}>
                        <div style={styles.cardTop}>
                          <div style={styles.codeTag}>{student.application_code}</div>
                          <span style={styles.statusVerified}>
                            <ShieldCheck size={14} /> BGH ĐÃ DUYỆT
                          </span>
                        </div>

                        <div style={styles.cardBody}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                            <div style={styles.avatarCircle}>{student.gender === 'Nữ' ? '👧' : '👦'}</div>
                            <div>
                              <h3 style={styles.studentName}>{student.student_name}</h3>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Lớp: <strong style={{ color: '#2563eb' }}>{student.student_class}</strong> • {student.gender || 'Nam'}
                              </div>
                            </div>
                          </div>

                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>Diện hoàn cảnh:</span>
                            <strong style={{ color: '#be123c', fontSize: '13px' }}>{student.category}</strong>
                          </div>

                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>Học lực / Hạnh kiểm:</span>
                            <span>{student.academic_grade || 'Tốt'} / {student.conduct_grade || 'Tốt'}</span>
                          </div>

                          <div style={styles.storyBox}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              📖 Hoàn cảnh gia đình tự thuật:
                            </div>
                            <p style={styles.storyText}>
                              {student.circumstance_story ? (
                                student.circumstance_story.length > 150 
                                  ? student.circumstance_story.slice(0, 150) + '...' 
                                  : student.circumstance_story
                              ) : 'Đang cập nhật...'}
                            </p>
                          </div>

                          {student.dream_aspiration && (
                            <div style={styles.dreamBox}>
                              <strong>🌟 Ước mơ:</strong> {student.dream_aspiration}
                            </div>
                          )}

                          <div style={styles.fundTargetRow}>
                            <div>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>Mức hỗ trợ đề xuất:</span>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>
                                {(Number(student.target_support_amount) || 2000000).toLocaleString('vi-VN')} đ
                              </div>
                            </div>
                            {student.granted_item && (
                              <div style={styles.itemTag}>Kèm: {student.granted_item}</div>
                            )}
                          </div>
                        </div>

                        <div style={styles.cardFooter}>
                          <button 
                            onClick={() => {
                              setAdoptingStudent(student);
                              setAdoptFormData({
                                custom_amount: student.target_support_amount || 2000000,
                                package_type: 'term',
                                note: ''
                              });
                            }}
                            style={styles.adoptBtn}
                          >
                            <Heart size={16} fill="#ffffff" /> Nhận Bảo Trợ Em Này
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HỌC SINH TÔI ĐANG BẢO TRỢ */}
            {activeTab === 'my_students' && (
              <div>
                <div style={styles.sectionHeaderRow}>
                  <div>
                    <h2 style={styles.sectionTitle}>Các Em Học Sinh Quý Vị Đang Nhận Bảo Trợ</h2>
                    <p style={styles.sectionDesc}>
                      Theo dõi hành trình trưởng thành, điểm số các kỳ thi, đọc thư cảm ơn và gửi lời nhắn động viên trực tiếp.
                    </p>
                  </div>

                  <button 
                    onClick={() => exportSponsorReportExcel(mySponsoredStudents, sponsorSession.sponsor_name)}
                    style={styles.exportExcelBtn}
                  >
                    <Download size={16} /> Xuất Báo Cáo Tiến Độ Excel
                  </button>
                </div>

                {mySponsoredStudents.length === 0 ? (
                  <div style={styles.emptyCard}>
                    <Heart size={40} color="#e11d48" />
                    <h4 style={{ margin: '12px 0 6px 0', color: '#1e293b' }}>Quý vị chưa nhận bảo trợ em học sinh nào</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                      Vui lòng chuyển qua tab "1. Danh Mục Học Sinh Chờ Bảo Trợ" để lựa chọn em học sinh cần giúp đỡ!
                    </p>
                    <button onClick={() => setActiveTab('marketplace')} style={styles.browseNowBtn}>
                      Xem Danh Mục Học Sinh Ngay <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {mySponsoredStudents.map(student => {
                      const reports = Array.isArray(student.progress_reports) ? student.progress_reports : [];
                      const proofs = Array.isArray(student.delivery_proof_urls) ? student.delivery_proof_urls : [];
                      const isDelivered = Number(student.delivered_amount) >= Number(student.funded_amount || student.target_support_amount);

                      return (
                        <div key={student.id} style={styles.portfolioCard}>
                          <div style={styles.portfolioHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={styles.avatarCircleLg}>{student.gender === 'Nữ' ? '👧' : '👦'}</div>
                              <div>
                                <div style={styles.codeTag}>{student.application_code}</div>
                                <h3 style={{ margin: '4px 0 2px 0', fontSize: '20px', color: '#0f172a' }}>
                                  {student.student_name} — Lớp {student.student_class}
                                </h3>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>
                                  GVCN phụ trách: <strong>{student.proposer_name || 'Giáo viên chủ nhiệm'}</strong> (SĐT: {student.proposer_phone || 'Liên hệ qua trường'})
                                </div>
                                {student.mentor_name && (
                                  <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#047857', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                                    <Compass size={14} color="#059669" />
                                    <span>Cố vấn 1-1: <strong>{student.mentor_name}</strong></span>
                                  </div>
                                )}
                                {Array.isArray(student.student_badges) && student.student_badges.length > 0 && (
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                    {student.student_badges.map((b, bIdx) => (
                                      <span key={bIdx} style={{ fontSize: '11.5px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, border: '1px solid #fde68a' }}>
                                        🏅 {b}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>Tiến độ giải ngân kinh phí:</div>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: isDelivered ? '#059669' : '#d97706' }}>
                                {(Number(student.delivered_amount) || 0).toLocaleString('vi-VN')} / {(Number(student.funded_amount) || Number(student.target_support_amount) || 2000000).toLocaleString('vi-VN')} đ
                              </div>
                              <div style={{ fontSize: '12px', color: isDelivered ? '#059669' : '#d97706', fontWeight: 600 }}>
                                {isDelivered ? '✓ ĐÃ TRAO ĐỦ TẬN TAY HỌC SINH' : '⏳ ĐANG GIẢI NGÂN ĐỊNH KỲ'}
                              </div>
                            </div>
                          </div>

                          {/* DÒNG THỜI GIAN MINH BẠCH 4 BƯỚC */}
                          <div style={styles.auditFlowBox}>
                            <div style={styles.stepItemActive}>
                              <div style={styles.stepIconWrap}><Check size={14} /></div>
                              <div style={styles.stepText}>1. MTQ Cam Kết</div>
                            </div>
                            <div style={styles.stepLineActive}></div>
                            <div style={styles.stepItemActive}>
                              <div style={styles.stepIconWrap}><Check size={14} /></div>
                              <div style={styles.stepText}>2. Quỹ Tiếp Nhận</div>
                            </div>
                            <div style={styles.stepLineActive}></div>
                            <div style={student.delivered_amount > 0 ? styles.stepItemActive : styles.stepItemPending}>
                              <div style={styles.stepIconWrap}>{student.delivered_amount > 0 ? <Check size={14} /> : '3'}</div>
                              <div style={styles.stepText}>3. Đã Trao Tận Tay</div>
                            </div>
                            <div style={styles.stepLineActive}></div>
                            <div style={proofs.length > 0 ? styles.stepItemActive : styles.stepItemPending}>
                              <div style={styles.stepIconWrap}>{proofs.length > 0 ? <Check size={14} /> : '4'}</div>
                              <div style={styles.stepText}>4. Biên Bản & Ảnh Trao</div>
                            </div>
                          </div>

                          {/* BÁO CÁO TIẾN BỘ HỌC TẬP TỪ GVCN */}
                          <div style={styles.progressSection}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Award size={18} color="#2563eb" /> Nhật Ký Tiến Bộ Của Học Sinh ({reports.length} đợt cập nhật)
                              </h4>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button 
                                  onClick={() => setViewTimelineStudent(student)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 12px',
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Xem toàn bộ cột mốc trưởng thành, thư tay cảm ơn và ảnh tiến bộ"
                                >
                                  <Sparkles size={14} /> Hành Trình Trưởng Thành Số
                                </button>
                                <button 
                                  onClick={() => exportThankYouLetterDocx(student, sponsorSession, fundSettings)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 12px',
                                    background: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Tải thư tri ân trang trọng của Ban Giám Hiệu chuẩn Nghị định 30"
                                >
                                  <Award size={14} /> Thư Tri Ân BGH (Word NĐ30)
                                </button>
                                <button 
                                  onClick={() => exportHandoverDocx(student, sponsorSession)}
                                  style={styles.downloadDocBtn}
                                  title="Tải biên bản bàn giao kinh phí chuẩn Nghị định 30"
                                >
                                  <FileText size={14} /> Biên Bản Trao Tiền (Word NĐ30)
                                </button>
                                <button 
                                  onClick={() => setMessageStudent(student)}
                                  style={styles.messageBtn}
                                >
                                  <MessageSquare size={14} /> Gửi Lời Nhắn Động Viên Em
                                </button>
                              </div>
                            </div>

                            {reports.length === 0 ? (
                              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                                Thầy cô GVCN đang theo dõi học kỳ và sẽ sớm cập nhật kết quả thi đua, học lực của em lên hệ thống.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {reports.map((rep, rIdx) => (
                                  <div key={rep.id || rIdx} style={styles.reportItem}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                      <strong style={{ color: '#1e40af', fontSize: '14px' }}>{rep.term}</strong>
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>Ngày cập nhật: {rep.date}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                                      <strong>Kết quả:</strong> Học lực {rep.academic_score} • Hạnh kiểm {rep.conduct}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                      <strong>Nhận xét của GVCN:</strong> {rep.teacher_notes}
                                    </div>
                                    {rep.student_letter && (
                                      <div style={{ marginTop: '8px', background: '#fef3c7', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
                                        💌 <strong>Lời cảm ơn của em {student.student_name}:</strong> "{rep.student_letter}"
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* ẢNH MINH CHỨNG TRAO TIỀN TẬN TAY */}
                          {proofs.length > 0 && (
                            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                                📷 Ảnh chụp thực tế lễ trao học bổng & Biên bản ký nhận có dấu đỏ:
                              </div>
                              <div style={styles.proofGrid}>
                                {proofs.map((img, pIdx) => (
                                  <a key={pIdx} href={img} target="_blank" rel="noreferrer" style={styles.proofLink}>
                                    <img src={img} alt={`Minh chứng ${pIdx + 1}`} style={styles.proofImg} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BẢNG KÊ GIÁM SÁT GIẢI NGÂN & MINH CHỨNG */}
            {activeTab === 'audit_flow' && (
              <div style={styles.panel}>
                <div style={styles.auditHeader}>
                  <h2 style={styles.sectionTitle}>Bảng Kê Giám Sát Giải Ngân & Minh Chứng Bàn Giao</h2>
                  <p style={styles.sectionDesc}>
                    Nhà trường cam kết 100% kinh phí từ Quý Mạnh Thường Quân được chuyển trực tiếp tới học sinh và gia đình 
                    dưới sự giám sát của Ban Giám Hiệu, Công đoàn và Giáo viên chủ nhiệm.
                  </p>
                </div>

                {/* CÔNG CỤ TRA CỨU & XÁC THỰC MÃ BĂM SỐ HÓA */}
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
                  border: '1px solid #bfdbfe',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <ShieldCheck size={22} color="#059669" />
                    <h3 style={{ margin: 0, fontSize: '16.5px', color: '#1e3a8a', fontWeight: 700 }}>
                      Tra Cứu & Xác Thực Tính Hợp Lệ Của Khoản Tài Trợ (Mã Băm Số Hóa)
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#475569' }}>
                    Mỗi biên bản bàn giao kinh phí và đợt trao học bổng được nhà trường cấp một mã định danh duy nhất (Ví dụ: <code>CBQ-UOCMO-2026-X8F9A</code>) để Quý vị kiểm tra đối chiếu trực tiếp với hồ sơ gốc có dấu mộc BGH.
                  </p>
                  
                  <form onSubmit={handleVerifyCode} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input 
                      type="text"
                      placeholder="Nhập Mã xác thực (VD: CBQ-UOCMO-2026-X8F9A)..."
                      value={verifyCodeInput}
                      onChange={(e) => setVerifyCodeInput(e.target.value)}
                      style={{
                        flex: '1',
                        minWidth: '260px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #93c5fd',
                        fontSize: '13.5px',
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                    />
                    <button 
                      type="submit" 
                      disabled={verifying}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 20px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        cursor: 'pointer'
                      }}
                    >
                      <Search size={16} />
                      <span>{verifying ? 'Đang tra cứu...' : 'Xác Thực Ngay'}</span>
                    </button>
                  </form>

                  {verifyResult && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      borderRadius: '10px',
                      background: verifyResult.valid ? '#ecfdf5' : '#fef2f2',
                      border: verifyResult.valid ? '1px solid #a7f3d0' : '1px solid #fecaca'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {verifyResult.valid ? <CheckCircle size={20} color="#059669" /> : <AlertCircle size={20} color="#dc2626" />}
                        <strong style={{ fontSize: '14px', color: verifyResult.valid ? '#065f46' : '#991b1b' }}>
                          {verifyResult.message}
                        </strong>
                      </div>
                      {verifyResult.data && (
                        <div style={{ fontSize: '13px', color: '#334155', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px', background: '#ffffff', padding: '12px', borderRadius: '8px' }}>
                          <div><strong>Mã tra cứu:</strong> <code>{verifyResult.data.verification_code}</code></div>
                          <div><strong>Học sinh:</strong> {verifyResult.data.student_masked_name} ({verifyResult.data.student_class})</div>
                          <div><strong>Số tiền trao:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{Number(verifyResult.data.disbursed_amount).toLocaleString('vi-VN')} đ</span></div>
                          <div><strong>Ngày bàn giao:</strong> {verifyResult.data.disbursed_date}</div>
                          <div><strong>Nhà tài trợ:</strong> {verifyResult.data.sponsor_masked_name}</div>
                          <div><strong>Đại diện trao:</strong> {verifyResult.data.handover_officer}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>STT</th>
                        <th style={styles.th}>Mã Hồ Sơ</th>
                        <th style={styles.th}>Học Sinh Thụ Hưởng</th>
                        <th style={styles.th}>Lớp</th>
                        <th style={styles.th}>Tiền Cam Kết</th>
                        <th style={styles.th}>Tiền Đã Trao</th>
                        <th style={styles.th}>Ngày Trao Gần Nhất</th>
                        <th style={styles.th}>Trạng Thái</th>
                        <th style={styles.thCenter}>Biên Bản Bàn Giao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySponsoredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            Chưa có dữ liệu giải ngân. Quý vị vui lòng nhận bảo trợ học sinh để theo dõi dòng tiền!
                          </td>
                        </tr>
                      ) : (
                        mySponsoredStudents.map((st, idx) => {
                          const isComplete = Number(st.delivered_amount) >= Number(st.funded_amount || st.target_support_amount);
                          return (
                            <tr key={st.id || idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                              <td style={styles.tdCenter}>{idx + 1}</td>
                              <td style={styles.tdCode}>{st.application_code}</td>
                              <td style={styles.tdBold}>{st.student_name}</td>
                              <td style={styles.tdCenter}>{st.student_class}</td>
                              <td style={styles.tdAmount}>
                                {(Number(st.funded_amount) || Number(st.target_support_amount) || 2000000).toLocaleString('vi-VN')} đ
                              </td>
                              <td style={styles.tdAmount}>
                                <strong style={{ color: isComplete ? '#059669' : '#d97706' }}>
                                  {(Number(st.delivered_amount) || 0).toLocaleString('vi-VN')} đ
                                </strong>
                              </td>
                              <td style={styles.tdCenter}>{st.delivery_date || 'Chờ đợt trao'}</td>
                              <td style={styles.tdCenter}>
                                {isComplete ? (
                                  <span style={styles.badgeSuccess}>✓ Đã trao đủ</span>
                                ) : (
                                  <span style={styles.badgeWarning}>⏳ Đang trao định kỳ</span>
                                )}
                              </td>
                              <td style={styles.tdCenter}>
                                <button 
                                  onClick={() => exportHandoverDocx(st, sponsorSession)}
                                  style={styles.downloadDocBtn}
                                  title="Tải biên bản bàn giao Word chuẩn Nghị định 30"
                                >
                                  <Download size={14} /> Tải biên bản NĐ30
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ===================== MODAL ĐĂNG KÝ BẢO TRỢ ===================== */}
      {adoptingStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  Đăng Ký Bảo Trợ: {adoptingStudent.student_name} ({adoptingStudent.student_class})
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Hoàn cảnh: {adoptingStudent.category} • Mạnh Thường Quân: <strong>{sponsorSession?.sponsor_name}</strong>
                </p>
              </div>
              <button onClick={() => setAdoptingStudent(null)} style={styles.closeBtn}>×</button>
            </div>

            <form onSubmit={handleAdoptSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={styles.label}>Chọn gói kinh phí bảo trợ em học sinh</label>
                <div style={styles.packageGrid}>
                  {[
                    { key: 'month', label: 'Hỗ trợ 500k/tháng', amount: 500000, desc: 'Hỗ trợ ăn sáng, đồ dùng hàng tháng' },
                    { key: 'term', label: 'Học bổng 1 Học kỳ (2.000.000đ)', amount: 2000000, desc: 'Trang trải học tập cả học kỳ' },
                    { key: 'year', label: 'Bảo trợ Cả Năm Học (4.500.000đ)', amount: 4500000, desc: 'Đồng hành trọn vẹn cả năm học' }
                  ].map(pkg => (
                    <div 
                      key={pkg.key}
                      onClick={() => setAdoptFormData({ ...adoptFormData, package_type: pkg.key, custom_amount: pkg.amount })}
                      style={adoptFormData.custom_amount === pkg.amount ? styles.pkgItemActive : styles.pkgItem}
                    >
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{pkg.label}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{pkg.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.label}>Hoặc nhập số tiền tùy ý khác (VNĐ)</label>
                <input 
                  type="number" 
                  value={adoptFormData.custom_amount}
                  onChange={(e) => setAdoptFormData({ ...adoptFormData, custom_amount: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setAdoptingStudent(null)} style={styles.cancelBtn}>
                  Hủy
                </button>
                <button type="submit" disabled={adoptingSubmitting} style={styles.submitBtn}>
                  <Heart size={16} fill="#ffffff" />
                  <span>{adoptingSubmitting ? 'Đang xử lý...' : 'Xác Nhận Nhận Bảo Trợ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL HÀNH TRÌNH TRƯỞNG THÀNH SỐ ===================== */}
      {viewTimelineStudent && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={22} color="#f59e0b" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                    Hành Trình Trưởng Thành Số: {viewTimelineStudent.student_name}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Lớp {viewTimelineStudent.student_class} • Mã hồ sơ: <code>{viewTimelineStudent.application_code}</code>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewTimelineStudent(null)} style={styles.closeBtn}>×</button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* HUY HIỆU NỖ LỰC & CỐ VẤN */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Huy hiệu nỗ lực học trò:</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Array.isArray(viewTimelineStudent.student_badges) && viewTimelineStudent.student_badges.length > 0 ? (
                      viewTimelineStudent.student_badges.map((bg, bIdx) => (
                        <span key={bIdx} style={{ fontSize: '12px', background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '14px', fontWeight: 700, border: '1px solid #fde68a' }}>
                          🏅 {bg}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Đang nỗ lực rèn luyện để nhận huy hiệu đợt tới</span>
                    )}
                  </div>
                </div>

                {viewTimelineStudent.mentor_name && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cố vấn 1-1 đồng hành:</div>
                    <div style={{ fontSize: '13.5px', color: '#0f766e', fontWeight: 700 }}>🧭 {viewTimelineStudent.mentor_name}</div>
                  </div>
                )}
              </div>

              {/* DÒNG THỜI GIAN CÁC CỘT MỐC */}
              <div style={{ position: 'relative', paddingLeft: '30px', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Cột mốc 1: Tiếp nhận */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-39px', top: '0', width: '18px', height: '18px', borderRadius: '50%', background: '#2563eb', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #bfdbfe' }}></div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {viewTimelineStudent.created_at ? viewTimelineStudent.created_at.split('T')[0] : '2026-09-05'}
                  </div>
                  <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#0f172a' }}>🕊️ Nhà trường khảo sát hoàn cảnh & Thẩm định hồ sơ</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    Học sinh được GVCN đề xuất diện: <strong>{viewTimelineStudent.category}</strong>. Ban Giám Hiệu đã phê duyệt đưa vào danh mục nhận bảo trợ.
                  </p>
                </div>

                {/* Cột mốc 2: MTQ bảo trợ */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-39px', top: '0', width: '18px', height: '18px', borderRadius: '50%', background: '#059669', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #a7f3d0' }}></div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {viewTimelineStudent.delivery_date || '2026-10-15'}
                  </div>
                  <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#065f46' }}>🤝 Mạnh Thường Quân nhận bảo trợ học tập</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    Quý MTQ <strong>{sponsorSession?.sponsor_name || viewTimelineStudent.sponsor_name}</strong> nhận bảo trợ với mức kinh phí {(Number(viewTimelineStudent.target_support_amount) || 2000000).toLocaleString('vi-VN')} đ.
                  </p>
                </div>

                {/* Các cột mốc từ growth_timeline */}
                {Array.isArray(viewTimelineStudent.growth_timeline) && viewTimelineStudent.growth_timeline.map((ml, mIdx) => (
                  <div key={ml.id || mIdx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-39px', top: '0', width: '18px', height: '18px', borderRadius: '50%', background: ml.category === 'badge' ? '#f59e0b' : ml.category === 'letter' ? '#e11d48' : '#6366f1', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #e2e8f0' }}></div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{ml.date}</div>
                    <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#0f172a' }}>{ml.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{ml.description}</p>
                    {ml.academic_score && (
                      <div style={{ fontSize: '12.5px', color: '#1e40af', marginTop: '4px' }}>
                        Điểm rèn luyện: <strong>{ml.academic_score}</strong> • Hạnh kiểm: <strong>{ml.conduct_grade}</strong>
                      </div>
                    )}
                    {Array.isArray(ml.image_urls) && ml.image_urls.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {ml.image_urls.map((img, iIdx) => (
                          <a key={iIdx} href={img} target="_blank" rel="noreferrer">
                            <img src={img} alt="Ảnh cột mốc" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Cột mốc Thư tay cảm ơn */}
                {Array.isArray(viewTimelineStudent.progress_reports) && viewTimelineStudent.progress_reports.filter(r => r.student_letter).map((r, rIdx) => (
                  <div key={rIdx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-39px', top: '0', width: '18px', height: '18px', borderRadius: '50%', background: '#e11d48', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #fecdd3' }}></div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{r.date}</div>
                    <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#9f1239' }}>💌 Thư cảm ơn viết tay của em {viewTimelineStudent.student_name}</h4>
                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', color: '#881337', fontStyle: 'italic', lineHeight: 1.6, marginTop: '6px' }}>
                      "{r.student_letter}"
                    </div>
                  </div>
                ))}
              </div>

              {/* NÚT TẢI BÁO CÁO & THƯ TRI ÂN NĐ30 */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <button 
                  onClick={() => exportThankYouLetterDocx(viewTimelineStudent, sponsorSession, fundSettings)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Award size={15} /> Tải Thư Tri Ân BGH (Word NĐ30)
                </button>

                <button 
                  onClick={() => setViewTimelineStudent(null)}
                  style={{
                    padding: '9px 18px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Đóng Cửa Sổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL THÀNH CÔNG & VIETQR ===================== */}
      {adoptSuccessInfo && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '580px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '18px', color: '#065f46' }}>
                  Tiếp Nhận Đăng Ký Bảo Trợ Thành Công!
                </h3>
              </div>
              <button onClick={() => setAdoptSuccessInfo(null)} style={styles.closeBtn}>×</button>
            </div>

            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#334155', lineHeight: 1.6 }}>
                Trân trọng cảm ơn Quý Mạnh Thường Quân đã nhận bảo trợ cho em <strong>{adoptSuccessInfo.student.student_name}</strong> (Lớp {adoptSuccessInfo.student.student_class}).
              </p>

              {/* MÃ VIETQR TIẾP SỨC */}
              <div style={styles.qrCard}>
                <img 
                  src={`https://img.vietqr.io/image/vietcombank-${currentAcc}-compact2.png?amount=${adoptSuccessInfo.amount}&addInfo=${encodeURIComponent(`CBQ CCUM ${adoptSuccessInfo.student.student_class} ${adoptSuccessInfo.student.student_name}`)}&accountName=${encodeURIComponent(currentAccName)}`}
                  alt="VietQR Chuyển khoản"
                  style={{ maxWidth: '280px', width: '100%', borderRadius: '8px' }}
                />
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '10px' }}>
                  Quét mã QR bằng ứng dụng ngân hàng bất kỳ để chuyển số tiền <strong>{(adoptSuccessInfo.amount).toLocaleString('vi-VN')} đ</strong> vào Quỹ trường.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                <button onClick={() => { setAdoptSuccessInfo(null); setActiveTab('my_students'); }} style={styles.submitBtn}>
                  Xem Danh Sách Đang Bảo Trợ & Giám Sát Tiến Độ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL GỬI LỜI NHẮN ĐỘNG VIÊN ===================== */}
      {messageStudent && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '520px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>
                Gửi Lời Nhắn Động Viên: {messageStudent.student_name}
              </h3>
              <button onClick={() => setMessageStudent(null)} style={styles.closeBtn}>×</button>
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea 
                required
                rows={4}
                placeholder="VD: Bác/Cô chúc cháu luôn chăm ngoan, giữ vững ý chí vươn lên trong học tập nhé..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                style={styles.textarea}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMessageStudent(null)} style={styles.cancelBtn}>
                  Hủy
                </button>
                <button type="submit" disabled={sendingMsg} style={styles.submitBtn}>
                  <span>{sendingMsg ? 'Đang gửi...' : 'Gửi Lời Nhắn Cho Em'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL HÀNH TRÌNH TRƯỞNG THÀNH SỐ ===================== */}
      {viewTimelineStudent && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={22} color="#f59e0b" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                    Hành Trình Trưởng Thành Số: {viewTimelineStudent.student_name}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Lớp {viewTimelineStudent.student_class} • Mã hồ sơ: <code>{viewTimelineStudent.application_code}</code>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewTimelineStudent(null)} style={styles.closeBtn}>×</button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* HUY HIỆU NỖ LỰC & CỐ VẤN */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Huy hiệu nỗ lực học trò:</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Array.isArray(viewTimelineStudent.student_badges) && viewTimelineStudent.student_badges.length > 0 ? (
                      viewTimelineStudent.student_badges.map((bg, bIdx) => (
                        <span key={bIdx} style={{ fontSize: '12px', background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '14px', fontWeight: 700, border: '1px solid #fde68a' }}>
                          🏅 {bg}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Đang nỗ lực rèn luyện để nhận huy hiệu đợt tới</span>
                    )}
                  </div>
                </div>

                {viewTimelineStudent.mentor_name && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cố vấn 1-1 đồng hành:</div>
                    <div style={{ fontSize: '13.5px', color: '#0f766e', fontWeight: 700 }}>🧭 {viewTimelineStudent.mentor_name}</div>
                  </div>
                )}
              </div>

              {/* DÒNG THỜI GIAN CÁC CỘT MỐC */}
              <div style={{ position: 'relative', paddingLeft: '30px', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Cột mốc 1: Tiếp nhận */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-39px', top: '0', width: '18px', height: '18px', borderRadius: '50%', background: '#2563eb', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #bfdbfe' }}></div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {viewTimelineStudent.created_at ? viewTimelineStudent.created_at.split('T')[0] : '2026-09-05'}
                  </div>
                  <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#0f172a' }}>🕊️ Nhà trường khảo sát hoàn cảnh & Thẩm định hồ sơ</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    Học sinh được GVCN đề xuất diện: <strong>{viewTimelineStudent.category}</strong>. Ban Giám Hiệu đã phê duyệt đưa vào danh mục nhận bảo trợ.
                  </p>
                </div>

                {/* Cột mốc 2: MTQ bảo trợ */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-39px', top: '0', width: '18px', height: '18px', borderRadius: '50%', background: '#059669', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #a7f3d0' }}></div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {viewTimelineStudent.delivery_date || '2026-10-15'}
                  </div>
                  <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#065f46' }}>🤝 Mạnh Thường Quân nhận bảo trợ học tập</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    Quý MTQ <strong>{sponsorSession?.sponsor_name || viewTimelineStudent.sponsor_name}</strong> nhận bảo trợ với mức kinh phí {(Number(viewTimelineStudent.target_support_amount) || 2000000).toLocaleString('vi-VN')} đ.
                  </p>
                </div>

                {/* Các cột mốc từ growth_timeline */}
                {Array.isArray(viewTimelineStudent.growth_timeline) && viewTimelineStudent.growth_timeline.map((ml, mIdx) => (
                  <div key={ml.id || mIdx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-39px', top: '0', width: '18px', height: '18px', borderRadius: '50%', background: ml.category === 'badge' ? '#f59e0b' : ml.category === 'letter' ? '#e11d48' : '#6366f1', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #e2e8f0' }}></div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{ml.date}</div>
                    <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#0f172a' }}>{ml.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{ml.description}</p>
                    {ml.academic_score && (
                      <div style={{ fontSize: '12.5px', color: '#1e40af', marginTop: '4px' }}>
                        Điểm rèn luyện: <strong>{ml.academic_score}</strong> • Hạnh kiểm: <strong>{ml.conduct_grade}</strong>
                      </div>
                    )}
                    {Array.isArray(ml.image_urls) && ml.image_urls.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {ml.image_urls.map((img, iIdx) => (
                          <a key={iIdx} href={img} target="_blank" rel="noreferrer">
                            <img src={img} alt="Ảnh cột mốc" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Cột mốc Thư tay cảm ơn */}
                {Array.isArray(viewTimelineStudent.progress_reports) && viewTimelineStudent.progress_reports.filter(r => r.student_letter).map((r, rIdx) => (
                  <div key={rIdx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-39px', top: '0', width: '18px', height: '18px', borderRadius: '50%', background: '#e11d48', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #fecdd3' }}></div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{r.date}</div>
                    <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#9f1239' }}>💌 Thư cảm ơn viết tay của em {viewTimelineStudent.student_name}</h4>
                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', color: '#881337', fontStyle: 'italic', lineHeight: 1.6, marginTop: '6px' }}>
                      "{r.student_letter}"
                    </div>
                  </div>
                ))}
              </div>

              {/* NÚT TẢI BÁO CÁO & THƯ TRI ÂN NĐ30 */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <button 
                  onClick={() => exportThankYouLetterDocx(viewTimelineStudent, sponsorSession, fundSettings)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Award size={15} /> Tải Thư Tri Ân BGH (Word NĐ30)
                </button>

                <button 
                  onClick={() => setViewTimelineStudent(null)}
                  style={{
                    padding: '9px 18px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Đóng Cửa Sổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b'
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #091e3a 0%, #1e3a8a 50%, #047857 100%)',
    color: '#ffffff',
    padding: '46px 20px 36px 20px'
  },
  heroContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center'
  },
  badgeTop: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.14)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    marginBottom: '16px'
  },
  heroTitle: {
    fontSize: 'clamp(24px, 4vw, 36px)',
    fontWeight: 800,
    margin: '0 0 12px 0',
    letterSpacing: '-0.5px'
  },
  heroSubtitle: {
    fontSize: 'clamp(14px, 2vw, 16px)',
    color: '#e2e8f0',
    maxWidth: '820px',
    margin: '0 auto 20px auto',
    lineHeight: 1.6
  },
  sessionBox: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '16px',
    padding: '12px 20px',
    gap: '30px',
    marginTop: '6px',
    flexWrap: 'wrap'
  },
  userAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  codePill: {
    display: 'inline-block',
    background: '#047857',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    marginLeft: '8px'
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    background: 'rgba(255, 255, 255, 0.18)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  privacyNoticeBanner: {
    maxWidth: '840px',
    margin: '10px auto 0 auto',
    background: 'rgba(6, 78, 59, 0.75)',
    border: '1px solid rgba(52, 211, 153, 0.4)',
    borderRadius: '12px',
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    fontSize: '13px',
    color: '#ecfdf5',
    textAlign: 'left',
    lineHeight: 1.5
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '30px auto 60px auto',
    padding: '0 20px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '18px',
    marginBottom: '30px'
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    textAlign: 'center'
  },
  statIconWrap: {
    display: 'inline-flex',
    padding: '10px',
    borderRadius: '12px',
    background: '#f8fafc',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.2
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px'
  },
  authGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px'
  },
  authCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
  },
  authCardHighlight: {
    background: '#ffffff',
    border: '2px solid #a7f3d0',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.08)'
  },
  authIconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  authTitle: {
    fontSize: '16.5px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  authDesc: {
    fontSize: '13.5px',
    color: '#64748b',
    lineHeight: 1.5,
    margin: '0 0 20px 0'
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
    padding: '11px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '11px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
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
    gap: '12px'
  },
  loginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '6px'
  },
  registerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '6px'
  },
  navBar: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 30
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    gap: '10px',
    padding: '10px 20px',
    overflowX: 'auto'
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#2563eb',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '14px'
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px 0'
  },
  sectionDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  searchInput: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    width: '260px',
    outline: 'none'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px'
  },
  studentCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column'
  },
  cardTop: {
    padding: '12px 18px',
    background: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  codeTag: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#2563eb',
    fontFamily: 'monospace'
  },
  statusVerified: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#059669',
    background: '#ecfdf5',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  cardBody: {
    padding: '18px',
    flex: 1
  },
  avatarCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  studentName: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '6px 0',
    borderBottom: '1px dashed #f1f5f9'
  },
  detailLabel: {
    color: '#64748b'
  },
  storyBox: {
    background: '#f8fafc',
    padding: '10px 12px',
    borderRadius: '8px',
    marginTop: '12px',
    border: '1px solid #f1f5f9'
  },
  storyText: {
    margin: 0,
    fontSize: '13px',
    color: '#475569',
    lineHeight: 1.5,
    fontStyle: 'italic'
  },
  dreamBox: {
    fontSize: '12.5px',
    color: '#047857',
    background: '#ecfdf5',
    padding: '8px 10px',
    borderRadius: '6px',
    marginTop: '10px'
  },
  fundTargetRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0'
  },
  itemTag: {
    fontSize: '11.5px',
    background: '#fef3c7',
    color: '#b45309',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600
  },
  cardFooter: {
    padding: '14px 18px',
    background: '#f8fafc',
    borderTop: '1px solid #e2e8f0'
  },
  adoptBtn: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  emptyCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '50px 20px',
    textAlign: 'center',
    border: '1px solid #e2e8f0'
  },
  browseNowBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '16px',
    padding: '10px 20px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer'
  },
  portfolioCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
  },
  portfolioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '14px'
  },
  avatarCircleLg: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px'
  },
  auditFlowBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    background: '#f8fafc',
    borderRadius: '12px',
    margin: '18px 0',
    border: '1px solid #e2e8f0',
    overflowX: 'auto'
  },
  stepItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#059669',
    fontWeight: 700,
    fontSize: '13px',
    whiteSpace: 'nowrap'
  },
  stepItemPending: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: '13px',
    whiteSpace: 'nowrap'
  },
  stepIconWrap: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#059669',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px'
  },
  stepLineActive: {
    flex: 1,
    height: '3px',
    background: '#059669',
    margin: '0 10px',
    minWidth: '20px'
  },
  progressSection: {
    marginTop: '16px'
  },
  reportItem: {
    background: '#f8fafc',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  downloadDocBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#2563eb',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  messageBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#059669',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  exportExcelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  proofGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '10px'
  },
  proofLink: {
    display: 'block',
    height: '90px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #cbd5e1'
  },
  proofImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px'
  },
  auditHeader: {
    marginBottom: '20px'
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
    borderBottom: '2px solid #e2e8f0'
  },
  thCenter: {
    background: '#f8fafc',
    padding: '12px 14px',
    textAlign: 'center',
    color: '#475569',
    fontWeight: 700,
    borderBottom: '2px solid #e2e8f0'
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
  badgeSuccess: {
    background: '#ecfdf5',
    color: '#059669',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '11.5px'
  },
  badgeWarning: {
    background: '#fffbeb',
    color: '#b45309',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '11.5px'
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
    maxWidth: '640px',
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
  packageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px'
  },
  pkgItem: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    background: '#ffffff'
  },
  pkgItemActive: {
    border: '2px solid #059669',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    background: '#ecfdf5'
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
    padding: '10px 20px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  qrCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    display: 'inline-block',
    margin: '10px 0'
  }
};
