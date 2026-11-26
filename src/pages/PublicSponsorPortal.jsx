// =========================================================================
// TRANG DÀNH RIÊNG CHO MẠNH THƯỜNG QUÂN (CÓ PHÂN QUYỀN TRUY CẬP)
// Đăng ký bảo trợ học sinh khó khăn (đã duyệt), Giám sát nguồn tiền & minh chứng trao tiền tận tay,
// Theo dõi quá trình tiến bộ của học sinh và xuất báo cáo chuẩn NĐ30
// =========================================================================

import { useState, useEffect } from 'react';
import { 
  Heart, ShieldCheck, Award, FileText, CheckCircle2, Clock, 
  Search, ArrowRight, DollarSign, ExternalLink, QrCode, 
  MessageSquare, User, Calendar, Download, Sparkles, AlertCircle, 
  Image, Check, Copy, ChevronRight, Lock, Key, LogIn, LogOut
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  fetchApprovedStudentsForSponsors, 
  registerSponsorForStudent, 
  fetchSponsorPortfolio, 
  sendSponsorEncouragementMessage,
  fetchFundSettings,
  exportHandoverDocx,
  exportSponsorReportExcel
} from '../services/scholarshipFundService';

export default function PublicSponsorPortal() {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'my_students' | 'audit_flow' | 'login'
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [mySponsoredStudents, setMySponsoredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundSettings, setFundSettings] = useState(null);

  // Trạng thái đăng nhập phân quyền Mạnh Thường Quân
  const [sponsorSession, setSponsorSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cbq_sponsor_session')) || null;
    } catch (_) {
      return null;
    }
  });
  const [loginCodeInput, setLoginCodeInput] = useState('');
  const [loginPhoneInput, setLoginPhoneInput] = useState('');

  // Modal Đăng ký bảo trợ học sinh
  const [adoptingStudent, setAdoptingStudent] = useState(null);
  const [adoptFormData, setAdoptFormData] = useState({
    sponsor_name: '',
    sponsor_phone: '',
    package_type: 'term', // 'month' (500k) | 'term' (2tr) | 'year' (4.5tr) | 'custom'
    custom_amount: 2000000,
    note: ''
  });
  const [adoptingSubmitting, setAdoptingSubmitting] = useState(false);
  const [adoptSuccessInfo, setAdoptSuccessInfo] = useState(null);

  // Modal gửi lời nhắn động viên
  const [messageStudent, setMessageStudent] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Bộ lọc danh mục học sinh
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchStudent, setSearchStudent] = useState('');

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

      // Nếu MTQ đã đăng nhập, nạp danh sách học sinh mà MTQ này đang bảo trợ
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

  // Đăng nhập Cổng Mạnh Thường Quân bằng Mã MTQ hoặc SĐT
  const handleSponsorLogin = async (e) => {
    e.preventDefault();
    const q = (loginCodeInput || loginPhoneInput).trim();
    if (!q) {
      alert("Vui lòng nhập Mã Mạnh Thường Quân (hoặc Số điện thoại đã đăng ký)");
      return;
    }

    setLoading(true);
    try {
      const portfolio = await fetchSponsorPortfolio(q);
      if (portfolio.length > 0) {
        const first = portfolio[0];
        const newSession = {
          sponsor_code: first.sponsor_code || q,
          sponsor_name: first.sponsor_name || 'Mạnh Thường Quân',
          phone: first.sponsor_phone || loginPhoneInput || q
        };
        localStorage.setItem('cbq_sponsor_session', JSON.stringify(newSession));
        setSponsorSession(newSession);
        setMySponsoredStudents(portfolio);
        setActiveTab('my_students');
      } else {
        // Tạo phiên làm việc mới nếu chưa có học sinh nào
        const newSession = {
          sponsor_code: q.startsWith('MTQ') ? q : `MTQ-${q.slice(-4)}`,
          sponsor_name: loginCodeInput || 'Mạnh Thường Quân Hảo Tâm',
          phone: loginPhoneInput || q
        };
        localStorage.setItem('cbq_sponsor_session', JSON.stringify(newSession));
        setSponsorSession(newSession);
        setActiveTab('marketplace');
      }
    } catch (err) {
      alert("Lỗi xác thực: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cbq_sponsor_session');
    setSponsorSession(null);
    setMySponsoredStudents([]);
    setActiveTab('marketplace');
  };

  // Mạnh thường quân nộp đăng ký nhận bảo trợ
  const handleAdoptSubmit = async (e) => {
    e.preventDefault();
    if (!adoptingStudent) return;
    if (!adoptFormData.sponsor_name.trim() || !adoptFormData.sponsor_phone.trim()) {
      alert("Vui lòng nhập Họ tên và Số điện thoại liên hệ của Quý vị");
      return;
    }

    setAdoptingSubmitting(true);
    try {
      const finalAmount = Number(adoptFormData.custom_amount) || 2000000;
      const res = await registerSponsorForStudent(adoptingStudent.id, {
        sponsor_name: adoptFormData.sponsor_name.trim(),
        sponsor_phone: adoptFormData.sponsor_phone.trim(),
        sponsor_code: sponsorSession?.sponsor_code,
        amount: finalAmount
      });

      if (res.success) {
        // Cập nhật phiên đăng nhập tự động
        const updatedSession = {
          sponsor_code: res.sponsorCode,
          sponsor_name: adoptFormData.sponsor_name.trim(),
          phone: adoptFormData.sponsor_phone.trim()
        };
        localStorage.setItem('cbq_sponsor_session', JSON.stringify(updatedSession));
        setSponsorSession(updatedSession);

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

  // Gửi lời nhắn động viên tới học sinh
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageStudent || !messageContent.trim()) return;

    setSendingMsg(true);
    try {
      await sendSponsorEncouragementMessage(messageStudent.id, {
        sender_name: sponsorSession?.sponsor_name || 'Mạnh Thường Quân',
        content: messageContent.trim()
      });
      alert(`Đã gửi lời nhắn động viên tới em ${messageStudent.student_name}! Lời nhắn sẽ được nhà trường và GVCN chuyển tới em.`);
      setMessageStudent(null);
      setMessageContent('');
      loadPortalData();
    } catch (err) {
      alert("Lỗi gửi lời nhắn: " + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  // Lọc danh sách học sinh
  const filteredStudents = approvedStudents.filter(st => {
    if (filterCategory !== 'all' && st.category !== filterCategory) return false;
    if (searchStudent) {
      const q = searchStudent.toLowerCase();
      const name = (st.student_name || '').toLowerCase();
      const cls = (st.student_class || '').toLowerCase();
      const code = (st.application_code || '').toLowerCase();
      return name.includes(q) || cls.includes(q) || code.includes(q);
    }
    return true;
  });

  // Tạo URL VietQR khi chuyển khoản tài trợ
  const currentBank = fundSettings?.bank_name || 'Vietcombank';
  const currentAcc = fundSettings?.bank_account_number || '1028688888';
  const currentAccName = fundSettings?.bank_account_name || 'QUY HOC BONG CHAP CANH UOC MO THPT CAO BA QUAT';

  return (
    <div style={styles.pageWrap}>
      {/* HERO BANNER CHO MẠNH THƯỜNG QUÂN */}
      <div style={styles.heroBanner}>
        <div style={styles.heroContainer}>
          <div style={styles.badgeTop}>
            <Sparkles size={16} color="#fbbf24" />
            <span>MINH BẠCH 100% • GIÁM SÁT NGUỒN TIỀN & ĐỒNG HÀNH CÙNG HỌC SINH</span>
          </div>
          <h1 style={styles.heroTitle}>CỔNG ĐỒNG HÀNH & BẢO TRỢ HỌC SINH NGHÈO</h1>
          <p style={styles.heroSubtitle}>
            Nơi Quý Mạnh Thường Quân trực tiếp lựa chọn những học sinh có hoàn cảnh éo le đã được Lãnh đạo nhà trường thẩm định phê duyệt, 
            kiểm soát chính xác dòng tiền tài trợ của mình đã đến tận tay học sinh hay chưa và đồng hành theo dõi sự tiến bộ của các em.
          </p>

          {sponsorSession ? (
            <div style={styles.sessionBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.userAvatar}><User size={20} color="#ffffff" /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', color: '#93c5fd' }}>Xin kính chào Mạnh Thường Quân:</div>
                  <strong style={{ fontSize: '16px', color: '#ffffff' }}>{sponsorSession.sponsor_name}</strong>
                  <span style={styles.codePill}>Mã MTQ: {sponsorSession.sponsor_code}</span>
                </div>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          ) : (
            <div style={styles.loginCtaBox}>
              <span style={{ fontSize: '14px', color: '#e2e8f0' }}>Quý vị đã có Mã bảo mật Mạnh Thường Quân hoặc đã từng tài trợ?</span>
              <button onClick={() => setActiveTab('login')} style={styles.loginModalBtn}>
                <LogIn size={16} /> Đăng Nhập Cổng MTQ Để Xem Dòng Tiền & Báo Cáo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div style={styles.navBar}>
        <div style={styles.navContainer}>
          <button 
            onClick={() => setActiveTab('marketplace')}
            style={activeTab === 'marketplace' ? styles.tabActive : styles.tab}
          >
            <Heart size={18} color="#e11d48" /> 1. Danh Mục Học Sinh Cần Bảo Trợ ({approvedStudents.length})
          </button>

          <button 
            onClick={() => {
              if (!sponsorSession) {
                setActiveTab('login');
              } else {
                setActiveTab('my_students');
              }
            }}
            style={activeTab === 'my_students' ? styles.tabActive : styles.tab}
          >
            <ShieldCheck size={18} color="#2563eb" /> 2. Học Sinh Tôi Đang Bảo Trợ ({mySponsoredStudents.length})
          </button>

          <button 
            onClick={() => {
              if (!sponsorSession) {
                setActiveTab('login');
              } else {
                setActiveTab('audit_flow');
              }
            }}
            style={activeTab === 'audit_flow' ? styles.tabActive : styles.tab}
          >
            <DollarSign size={18} color="#059669" /> 3. Giám Sát Nguồn Tiền & Minh Chứng Trao Tiền
          </button>

          {!sponsorSession && (
            <button 
              onClick={() => setActiveTab('login')}
              style={activeTab === 'login' ? styles.tabActive : styles.tab}
            >
              <Key size={18} /> Đăng Nhập Mã MTQ
            </button>
          )}
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div style={styles.mainContainer}>

        {/* ===================== TAB 1: DANH MỤC HỌC SINH CẦN BẢO TRỢ ===================== */}
        {activeTab === 'marketplace' && (
          <div>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionTitle}>Danh Sách Học Sinh Có Hoàn Cảnh Khó Khăn Đã Phê Duyệt</h2>
                <p style={styles.sectionDesc}>
                  Tất cả các em học sinh dưới đây đã được Giáo viên chủ nhiệm khảo sát gia cảnh thực tế và Ban Giám Hiệu nhà trường ký duyệt.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="🔍 Tìm theo tên, lớp học, mã hồ sơ..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {/* GRID DANH THIẾP HỌC SINH */}
            {filteredStudents.length === 0 ? (
              <div style={styles.emptyCard}>
                <AlertCircle size={40} color="#94a3b8" />
                <h4 style={{ margin: '12px 0 6px 0', color: '#1e293b' }}>Hiện chưa có học sinh nào trong danh mục chờ bảo trợ</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  Ban Giám hiệu và các thầy cô GVCN đang tiếp tục rà soát các hoàn cảnh khó khăn để cập nhật lên hệ thống.
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
                          setAdoptFormData(prev => ({
                            ...prev,
                            custom_amount: student.target_support_amount || 2000000,
                            sponsor_name: sponsorSession?.sponsor_name || '',
                            sponsor_phone: sponsorSession?.phone || ''
                          }));
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

        {/* ===================== TAB 2: HỌC SINH TÔI ĐANG BẢO TRỢ ===================== */}
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
                onClick={() => exportSponsorReportExcel(mySponsoredStudents, sponsorSession?.sponsor_name)}
                style={styles.exportExcelBtn}
                title="Tải báo cáo Excel theo quy tắc 1-Bao_cao_tien_do_tai_tro_va_tien_bo_hoc_sinh_MTQ.xlsx"
              >
                <Download size={16} /> Xuất Báo Cáo Tiến Độ Excel
              </button>
            </div>

            {mySponsoredStudents.length === 0 ? (
              <div style={styles.emptyCard}>
                <Heart size={40} color="#e11d48" />
                <h4 style={{ margin: '12px 0 6px 0', color: '#1e293b' }}>Quý vị chưa đăng ký nhận bảo trợ em học sinh nào</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  Vui lòng chuyển qua tab "1. Danh Mục Học Sinh Cần Bảo Trợ" để chọn em học sinh cần giúp đỡ!
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

                      {/* QUY TRÌNH MINH BẠCH 4 BƯỚC */}
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
                        <div style={student.delivered_amount > 0 ? styles.stepLineActive : styles.stepLinePending}></div>
                        <div style={proofs.length > 0 ? styles.stepItemActive : styles.stepItemPending}>
                          <div style={styles.stepIconWrap}>{proofs.length > 0 ? <Check size={14} /> : '4'}</div>
                          <div style={styles.stepText}>4. Biên Bản & Ảnh Trao</div>
                        </div>
                      </div>

                      {/* BÁO CÁO TIẾN BỘ HỌC TẬP TỪ GVCN */}
                      <div style={styles.progressSection}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={18} color="#2563eb" /> Nhật Ký Tiến Bộ Của Học Sinh ({reports.length} đợt cập nhật)
                          </h4>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => exportHandoverDocx(student, sponsorSession)}
                              style={styles.downloadDocBtn}
                              title="Tải biên bản bàn giao kinh phí chuẩn Nghị định 30"
                            >
                              <FileText size={14} /> Tải Biên Bản Trao Tiền (Word NĐ30)
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
                            Thầy cô GVCN đang trong quá trình theo dõi học kỳ và sẽ sớm cập nhật điểm số, thành tích mới của em lên hệ thống.
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

        {/* ===================== TAB 3: GIÁM SÁT NGUỒN TIỀN & MINH CHỨNG ===================== */}
        {activeTab === 'audit_flow' && (
          <div style={styles.panel}>
            <div style={styles.auditHeader}>
              <h2 style={styles.sectionTitle}>Bảng Kê Giám Sát Giải Ngân & Minh Chứng Bàn Giao</h2>
              <p style={styles.sectionDesc}>
                Nhà trường cam kết 100% kinh phí từ Quý Mạnh Thường Quân được chuyển trực tiếp tới học sinh và gia đình 
                dưới sự giám sát của Ban Giám Hiệu, Công đoàn và Giáo viên chủ nhiệm.
              </p>
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
                    <th style={styles.thCenter}>Minh Chứng & Biên Bản</th>
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

        {/* ===================== TAB 4: ĐĂNG NHẬP MÃ MẠNH THƯỜNG QUÂN ===================== */}
        {activeTab === 'login' && (
          <div style={styles.loginCard}>
            <div style={styles.loginIconWrap}><Key size={30} color="#2563eb" /></div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a' }}>
              Đăng Nhập Cổng Mạnh Thường Quân
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
              Nhập Mã bảo mật Mạnh Thường Quân (hoặc Số điện thoại Quý vị đã đăng ký) để tra cứu học sinh được bảo trợ, 
              xem ảnh trao tiền và các báo cáo học tập.
            </p>

            <form onSubmit={handleSponsorLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={styles.label}>Mã Mạnh Thường Quân (hoặc SĐT đã tài trợ) (*)</label>
                <input 
                  required
                  type="text" 
                  placeholder="VD: MTQ-CBQ-7788 hoặc 0988888888"
                  value={loginCodeInput}
                  onChange={(e) => setLoginCodeInput(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Tên Quý vị / Doanh nghiệp (Nếu là lần đầu đăng nhập)</label>
                <input 
                  type="text" 
                  placeholder="VD: Gia đình Bác Nguyễn Văn Tuấn hoặc Cựu HS Khóa 1998"
                  value={loginPhoneInput}
                  onChange={(e) => setLoginPhoneInput(e.target.value)}
                  style={styles.input}
                />
              </div>

              <button type="submit" disabled={loading} style={styles.loginSubmitBtn}>
                <LogIn size={18} />
                <span>{loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP CỔNG MẠNH THƯỜNG QUÂN'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ===================== MODAL ĐĂNG KÝ BẢO TRỢ ===================== */}
        {adoptingStudent && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                    Đăng Ký Bảo Trợ Học Sinh: {adoptingStudent.student_name} ({adoptingStudent.student_class})
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    Hoàn cảnh: {adoptingStudent.category}
                  </p>
                </div>
                <button onClick={() => setAdoptingStudent(null)} style={styles.closeBtn}>×</button>
              </div>

              <form onSubmit={handleAdoptSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Họ tên Mạnh Thường Quân / Doanh nghiệp tài trợ (*)</label>
                  <input 
                    required
                    type="text" 
                    placeholder="VD: Bác Lê Văn Hùng hoặc Hội Cựu Học Sinh Khóa 2002-2005"
                    value={adoptFormData.sponsor_name}
                    onChange={(e) => setAdoptFormData({ ...adoptFormData, sponsor_name: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Số điện thoại liên hệ (để nhận báo cáo và ảnh trao tiền) (*)</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="VD: 0988888888"
                    value={adoptFormData.sponsor_phone}
                    onChange={(e) => setAdoptFormData({ ...adoptFormData, sponsor_phone: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Chọn gói kinh phí bảo trợ em học sinh</label>
                  <div style={styles.packageGrid}>
                    {[
                      { key: 'month', label: 'Hỗ trợ 500k/tháng', amount: 500000, desc: 'Giúp chi phí ăn sáng, sinh hoạt hàng tháng' },
                      { key: 'term', label: 'Học bổng 1 Học kỳ (2.000.000đ)', amount: 2000000, desc: 'Hỗ trợ học phí, sách vở cả học kỳ' },
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
                    <span>{adoptingSubmitting ? 'Đang xử lý...' : 'Xác Nhận Bảo Trợ Học Sinh'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== MODAL THÔNG BÁO BẢO TRỢ THÀNH CÔNG & VIETQR ===================== */}
        {adoptSuccessInfo && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '580px' }}>
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={24} color="#059669" />
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#065f46' }}>
                    Đăng Ký Bảo Trợ Thành Công!
                  </h3>
                </div>
                <button onClick={() => setAdoptSuccessInfo(null)} style={styles.closeBtn}>×</button>
              </div>

              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#334155', lineHeight: 1.6 }}>
                  Trân trọng cảm ơn Quý vị đã nhận bảo trợ cho em <strong>{adoptSuccessInfo.student.student_name}</strong> (Lớp {adoptSuccessInfo.student.student_class}).
                  <br />Mã Mạnh Thường Quân của Quý vị là: <strong style={{ color: '#2563eb', fontSize: '17px' }}>{adoptSuccessInfo.sponsorCode}</strong>.
                </p>

                {/* MÃ VIETQR TIẾP SỨC */}
                <div style={styles.qrCard}>
                  <img 
                    src={`https://img.vietqr.io/image/vietcombank-${currentAcc}-compact2.png?amount=${adoptSuccessInfo.amount}&addInfo=${encodeURIComponent(`CBQ CCUM ${adoptSuccessInfo.student.student_class} ${adoptSuccessInfo.student.student_name}`)}&accountName=${encodeURIComponent(currentAccName)}`}
                    alt="VietQR Chuyển khoản"
                    style={{ maxWidth: '280px', width: '100%', borderRadius: '8px' }}
                  />
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '10px' }}>
                    Quét mã QR bằng ứng dụng ngân hàng bất kỳ để chuyển số tiền <strong>{(adoptSuccessInfo.amount).toLocaleString('vi-VN')} đ</strong> vào Quỹ nhà trường.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                  <button onClick={() => { setAdoptSuccessInfo(null); setActiveTab('my_students'); }} style={styles.submitBtn}>
                    Xem Danh Sách Bảo Trợ & Giám Sát Tiến Độ
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
                  Gửi Lời Nhắn Động Viên Tới Em: {messageStudent.student_name}
                </h3>
                <button onClick={() => setMessageStudent(null)} style={styles.closeBtn}>×</button>
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Lời nhắn của Quý vị sẽ được nhà trường và GVCN chuyển trực tiếp tới học sinh, là nguồn động viên tinh thần to lớn cho em.
                </p>

                <textarea 
                  required
                  rows={4}
                  placeholder="VD: Chúc cháu luôn cố gắng vượt qua khó khăn, chăm ngoan và học giỏi nhé! Mọi người luôn tin tưởng ở cháu..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  style={styles.textarea}
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setMessageStudent(null)} style={styles.cancelBtn}>
                    Hủy
                  </button>
                  <button type="submit" disabled={sendingMsg} style={styles.submitBtn}>
                    <Send size={16} />
                    <span>{sendingMsg ? 'Đang gửi...' : 'Gửi Lời Nhắn'}</span>
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
  pageWrap: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b'
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #091e3a 0%, #1e3a8a 50%, #047857 100%)',
    color: '#ffffff',
    padding: '50px 20px 36px 20px'
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
    fontSize: 'clamp(24px, 4vw, 38px)',
    fontWeight: 800,
    margin: '0 0 14px 0',
    letterSpacing: '-0.5px'
  },
  heroSubtitle: {
    fontSize: 'clamp(14px, 2vw, 16px)',
    color: '#e2e8f0',
    maxWidth: '840px',
    margin: '0 auto 26px auto',
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
    marginTop: '10px'
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
    padding: '6px 12px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '12px',
    cursor: 'pointer'
  },
  loginCtaBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    marginTop: '10px'
  },
  loginModalBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: '#ffffff',
    color: '#1e3a8a',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer'
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
  mainContainer: {
    maxWidth: '1200px',
    margin: '30px auto 60px auto',
    padding: '0 20px'
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
  stepLinePending: {
    flex: 1,
    height: '3px',
    background: '#cbd5e1',
    margin: '0 10px',
    minWidth: '20px'
  },
  stepText: {
    fontSize: '12.5px'
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
  loginCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '480px',
    margin: '20px auto',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
    textAlign: 'center'
  },
  loginIconWrap: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    background: '#eff6ff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px',
    textAlign: 'left'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
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
  loginSubmitBtn: {
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
    marginTop: '8px'
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
