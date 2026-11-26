// =========================================================================
// TRANG CÔNG KHAI: QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ" - THPT CAO BÁ QUÁT
// Giới thiệu, Bảng vàng tri ân, Đăng ký ủng hộ (VietQR), Nộp đơn xin học bổng, Tra cứu hồ sơ
// =========================================================================

import { useState, useEffect, useRef } from 'react';
import { 
  Heart, Sparkles, Award, Gift, Search, QrCode, FileText, CheckCircle2, 
  Send, Users, BookOpen, Clock, ChevronRight, Phone, ShieldCheck, 
  Upload, AlertCircle, HelpCircle, Star, ArrowRight, Check, Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Confetti from 'react-confetti';
import { supabase } from '../lib/supabase';
import { 
  fetchScholarshipApplications, 
  submitScholarshipApplication, 
  fetchFundSettings,
  getFundStatistics
} from '../services/scholarshipFundService';

// Danh sách diện đối tượng ưu tiên
const SCHOLARSHIP_CATEGORIES = [
  'Học sinh thuộc diện Hộ nghèo',
  'Học sinh thuộc diện Hộ cận nghèo',
  'Học sinh mồ côi cha/mẹ hoặc mồ côi cả cha lẫn mẹ',
  'Học sinh khuyết tật / mắc bệnh hiểm nghèo',
  'Học sinh có hoàn cảnh gia đình đặc biệt khó khăn đột xuất',
  'Học sinh vượt khó học giỏi, nỗ lực vươn lên trong học tập',
  'Học sinh đạt thành tích đặc biệt trong học tập, nghiên cứu KHKT, TDTT'
];

// Danh sách các khối lớp trường THPT Cao Bá Quát
const ALL_CLASSES = [];
['10', '11', '12'].forEach(grade => {
  for (let i = 1; i <= 15; i++) {
    const num = String(i).padStart(2, '0');
    ALL_CLASSES.push(`${grade}A${num}`);
  }
});

export default function PublicScholarshipFund() {
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'apply' | 'lookup' | 'sponsors' | 'donate'
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    fundBalance: 0,
    totalApplications: 0,
    approvedCount: 0,
    totalScholarshipGranted: 0,
    sponsorsCount: 0
  });
  const [fundSettings, setFundSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Confetti khi nộp đơn thành công
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });

  // 1. State Đơn xin học bổng
  const [applyForm, setApplyForm] = useState({
    student_name: '',
    student_class: '10A01',
    student_code: '',
    gender: 'Nam',
    birthday: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    home_address: '',
    category: SCHOLARSHIP_CATEGORIES[0],
    academic_grade: 'Tốt',
    conduct_grade: 'Tốt',
    circumstance_story: '',
    dream_aspiration: '',
    evidence_urls: []
  });
  const [submittingApply, setSubmittingApply] = useState(false);
  const [submittedCode, setSubmittedCode] = useState(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // 2. State Tra cứu hồ sơ
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // 3. State Bảng Vàng & Đóng góp
  const [sponsorsList, setSponsorsList] = useState([]);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [donateAmount, setDonateAmount] = useState(500000);
  const [customDonateAmount, setCustomDonateAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorNote, setDonorNote] = useState('');
  const [donateSubmitting, setDonateSubmitting] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    loadData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [st, sett, spRes] = await Promise.all([
        getFundStatistics(),
        fetchFundSettings(),
        supabase.from('cbq_sponsors').select('*').order('date_received', { ascending: false })
      ]);
      setStats(st);
      setFundSettings(sett);
      setSponsorsList(spRes.data || []);
    } catch (err) {
      console.warn("Lỗi nạp dữ liệu quỹ:", err);
    } finally {
      setLoading(false);
    }
  }

  // Xử lý nạp ảnh minh chứng (chuyển sang base64 data url để lưu trữ)
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
      setApplyForm(prev => ({
        ...prev,
        evidence_urls: [...(prev.evidence_urls || []), ...results]
      }));
      setUploadingEvidence(false);
    }).catch(() => {
      setUploadingEvidence(false);
    });
  };

  const removeEvidence = (idx) => {
    setApplyForm(prev => ({
      ...prev,
      evidence_urls: (prev.evidence_urls || []).filter((_, i) => i !== idx)
    }));
  };

  // Submit Đơn xin học bổng
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.student_name.trim() || !applyForm.student_class.trim() || !applyForm.phone.trim()) {
      alert("Vui lòng điền đầy đủ Họ tên, Lớp học và Số điện thoại liên hệ (*)");
      return;
    }
    if (!applyForm.circumstance_story.trim()) {
      alert("Vui lòng chia sẻ đôi nét về hoàn cảnh gia đình của em để Hội đồng xét duyệt nắm rõ.");
      return;
    }

    setSubmittingApply(true);
    try {
      const res = await submitScholarshipApplication(applyForm);
      if (res.success) {
        setSubmittedCode(res.data.application_code);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
        // Reset form
        setApplyForm({
          student_name: '',
          student_class: '10A01',
          student_code: '',
          gender: 'Nam',
          birthday: '',
          phone: '',
          parent_name: '',
          parent_phone: '',
          home_address: '',
          category: SCHOLARSHIP_CATEGORIES[0],
          academic_grade: 'Tốt',
          conduct_grade: 'Tốt',
          circumstance_story: '',
          dream_aspiration: '',
          evidence_urls: []
        });
        loadData();
      }
    } catch (err) {
      alert("Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại!");
    } finally {
      setSubmittingApply(false);
    }
  };

  // Tra cứu tiến độ hồ sơ
  const handleLookupSubmit = async (e) => {
    e.preventDefault();
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return;

    setIsSearching(true);
    setLookupResult(null);
    try {
      const allApps = await fetchScholarshipApplications();
      const matched = allApps.filter(item => {
        const code = (item.application_code || '').toLowerCase();
        const sCode = (item.student_code || '').toLowerCase();
        const name = (item.student_name || '').toLowerCase();
        const cls = (item.student_class || '').toLowerCase();
        const phone = (item.phone || '').toLowerCase();

        return code.includes(q) || sCode.includes(q) || (name.includes(q) && cls.includes(q)) || phone.includes(q) || name === q;
      });

      setLookupResult(matched);
      if (matched.length === 0) {
        alert("Không tìm thấy hồ sơ nào khớp với thông tin tra cứu của bạn. Vui lòng kiểm tra lại Mã hồ sơ hoặc Họ tên!");
      }
    } catch (err) {
      alert("Lỗi tra cứu: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Đăng ký đóng góp tài trợ
  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    if (!donorName.trim()) {
      alert("Vui lòng nhập Họ tên hoặc Tên tập thể đơn vị đóng góp.");
      return;
    }

    setDonateSubmitting(true);
    const finalAmount = customDonateAmount ? Number(customDonateAmount) : Number(donateAmount);

    const payload = {
      name: donorName.trim(),
      donation_amount: finalAmount || 0,
      donation_item: donorNote.trim(),
      is_public: false // Cần admin duyệt để lên bảng vàng
    };

    try {
      const { error } = await supabase.from('cbq_sponsors').insert([payload]);
      if (!error) {
        setDonateSuccess(true);
        loadData();
      } else {
        // Fallback lưu local
        const local = JSON.parse(localStorage.getItem('cbq_local_sponsors') || '[]');
        local.push({ ...payload, id: 'sp_' + Date.now(), date_received: new Date().toISOString() });
        localStorage.setItem('cbq_local_sponsors', JSON.stringify(local));
        setDonateSuccess(true);
      }
    } catch (err) {
      alert("Lỗi gửi thông tin tài trợ: " + err.message);
    } finally {
      setDonateSubmitting(false);
    }
  };

  // Tạo URL VietQR chuẩn Napas 24/7
  const currentBank = fundSettings?.bank_name || 'Vietcombank';
  const currentAcc = fundSettings?.bank_account_number || '1028688888';
  const currentName = fundSettings?.bank_account_name || 'QUY HOC BONG CHAP CANH UOC MO THPT CAO BA QUAT';
  const finalTransferAmount = customDonateAmount ? Number(customDonateAmount) : Number(donateAmount);
  const transferContent = `CBQ CCUM ${donorName ? donorName.replace(/[^a-zA-Z0-9 ]/g, '') : 'TIEP SUC'}`;
  
  // Link sinh QR VietQR: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
  // Chuyển tên ngân hàng sang Bank ID phổ biến (VCB cho Vietcombank, v.v.)
  const getBankId = (b) => {
    const s = (b || '').toLowerCase();
    if (s.includes('vietcombank') || s.includes('vcb')) return 'vietcombank';
    if (s.includes('bidv')) return 'bidv';
    if (s.includes('vietinbank') || s.includes('ctg')) return 'vietinbank';
    if (s.includes('agribank')) return 'agribank';
    if (s.includes('mb') || s.includes('mbbank')) return 'mbbank';
    if (s.includes('techcombank') || s.includes('tcb')) return 'techcombank';
    return 'vietcombank';
  };
  const vietQrUrl = `https://img.vietqr.io/image/${getBankId(currentBank)}-${currentAcc}-compact2.png?amount=${finalTransferAmount || ''}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(currentName)}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const filteredSponsors = sponsorsList.filter(s => {
    if (!s.name) return false;
    return s.name.toLowerCase().includes(sponsorSearch.toLowerCase());
  });

  return (
    <div style={styles.pageWrap}>
      {showConfetti && <Confetti width={windowDimension.width} height={windowDimension.height} recycle={false} numberOfPieces={350} />}

      {/* HERO BANNER SANG TRỌNG & Ý NGHĨA */}
      <div style={styles.heroBanner}>
        <div style={styles.heroOverlay}>
          <div style={styles.heroBadge}>
            <Sparkles size={16} color="#fbbf24" />
            <span>LAN TỎA YÊU THƯƠNG • NÂNG BƯỚC TƯƠNG LAI</span>
          </div>
          <h1 style={styles.heroTitle}>QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ"</h1>
          <p style={styles.heroSubtitle}>
            Trường THPT Cao Bá Quát — Nơi hội tụ những tấm lòng nhân ái của quý thầy cô, quý phụ huynh, 
            các thế hệ cựu học sinh và các nhà hảo tâm cùng chung tay tiếp sức cho học sinh vượt khó vươn lên.
          </p>

          {/* CÁC THỐNG KÊ QUỸ TRỰC QUAN */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIconWrap}><Heart size={26} color="#e11d48" /></div>
              <div style={styles.statValue}>{(stats.totalIncome || 0).toLocaleString('vi-VN')} <span style={{fontSize: '14px', fontWeight: 500}}>đ</span></div>
              <div style={styles.statLabel}>Tổng nguồn quỹ vận động</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIconWrap}><Award size={26} color="#2563eb" /></div>
              <div style={styles.statValue}>{stats.approvedCount} <span style={{fontSize: '14px', fontWeight: 500}}>học sinh</span></div>
              <div style={styles.statLabel}>Suất học bổng đã trao</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIconWrap}><Users size={26} color="#059669" /></div>
              <div style={styles.statValue}>{stats.sponsorsCount} <span style={{fontSize: '14px', fontWeight: 500}}>nhà tài trợ</span></div>
              <div style={styles.statLabel}>Tấm lòng vàng đồng hành</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIconWrap}><Gift size={26} color="#d97706" /></div>
              <div style={styles.statValue}>{(stats.fundBalance || 0).toLocaleString('vi-VN')} <span style={{fontSize: '14px', fontWeight: 500}}>đ</span></div>
              <div style={styles.statLabel}>Số dư quỹ sẵn sàng tiếp sức</div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG TAB */}
      <div style={styles.navBar}>
        <div style={styles.navContainer}>
          <button 
            onClick={() => setActiveTab('about')}
            style={activeTab === 'about' ? styles.tabBtnActive : styles.tabBtn}
          >
            <BookOpen size={18} /> Về Quỹ & Tôn Chỉ
          </button>
          <button 
            onClick={() => setActiveTab('apply')}
            style={activeTab === 'apply' ? styles.tabBtnActive : styles.tabBtn}
          >
            <Send size={18} /> Nộp Đơn Xin Học Bổng
          </button>
          <button 
            onClick={() => setActiveTab('lookup')}
            style={activeTab === 'lookup' ? styles.tabBtnActive : styles.tabBtn}
          >
            <Search size={18} /> Tra Cứu Hồ Sơ
          </button>
          <button 
            onClick={() => setActiveTab('sponsors')}
            style={activeTab === 'sponsors' ? styles.tabBtnActive : styles.tabBtn}
          >
            <Award size={18} /> Bảng Vàng Tri Ân
          </button>
          <button 
            onClick={() => setActiveTab('donate')}
            style={activeTab === 'donate' ? { ...styles.tabBtnActive, background: '#059669', borderColor: '#059669', color: '#fff' } : styles.donateNavBtn}
          >
            <Heart size={18} color="#e11d48" fill="#e11d48" /> Đăng Ký Ủng Hộ & Chuyển Khoản
          </button>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div style={styles.mainContent}>

        {/* ===================== TAB 1: VỀ QUỸ & TÔN CHỈ ===================== */}
        {activeTab === 'about' && (
          <div style={styles.sectionCard}>
            <div style={styles.aboutHeader}>
              <h2 style={styles.sectionTitle}>Tôn Chỉ & Mục Đích Quỹ "Chắp Cánh Ước Mơ"</h2>
              <p style={styles.sectionDesc}>
                Quỹ học bổng "Chắp cánh ước mơ" trường THPT Cao Bá Quát được thành lập với sứ mệnh nhân văn cao cả: 
                không để bất kỳ một học sinh nào phải bỏ học vì hoàn cảnh khó khăn, đồng thời khích lệ, biểu dương 
                những tấm gương giàu nghị lực, vượt lên nghịch cảnh để đạt thành tích tốt trong học tập.
              </p>
            </div>

            <div style={styles.pillarsGrid}>
              <div style={styles.pillarItem}>
                <div style={{ ...styles.pillarIcon, background: '#eff6ff', color: '#2563eb' }}>
                  <Heart size={30} />
                </div>
                <h3 style={styles.pillarTitle}>Tiếp Sức Đến Trường</h3>
                <p style={styles.pillarText}>
                  Hỗ trợ tài chính, trao học bổng định kỳ (1.000.000đ - 3.000.000đ/học kỳ) nhằm giúp các em trang trải 
                  chi phí học tập, mua sắm đồ dùng sách vở, bảo hiểm y tế và phương tiện đến trường.
                </p>
              </div>

              <div style={styles.pillarItem}>
                <div style={{ ...styles.pillarIcon, background: '#ecfdf5', color: '#059669' }}>
                  <ShieldCheck size={30} />
                </div>
                <h3 style={styles.pillarTitle}>Cứu Trợ Đột Xuất</h3>
                <p style={styles.pillarText}>
                  Kịp thời thăm hỏi, trợ cấp đặc biệt khi gia đình học sinh gặp biến cố bất khả kháng: tai nạn rủi ro, 
                  thiên tai, người thân qua đời hoặc mắc bệnh hiểm nghèo cần kinh phí phẫu thuật.
                </p>
              </div>

              <div style={styles.pillarItem}>
                <div style={{ ...styles.pillarIcon, background: '#fef3c7', color: '#d97706' }}>
                  <Award size={30} />
                </div>
                <h3 style={styles.pillarTitle}>Khuyến Học & Khuyến Tài</h3>
                <p style={styles.pillarText}>
                  Tôn vinh và tặng thưởng các học sinh nghèo vượt khó đạt giải học sinh giỏi các cấp, đỗ điểm cao trong kỳ thi 
                  tốt nghiệp THPT và xét tuyển Đại học, tạo nguồn cảm hứng cho toàn trường noi theo.
                </p>
              </div>
            </div>

            {/* QUY TRÌNH XÉT DUYỆT 4 BƯỚC */}
            <div style={styles.processBox}>
              <h3 style={styles.processTitle}>Quy Trình Xét Duyệt Học Bổng Minh Bạch 4 Bước</h3>
              <div style={styles.stepsRow}>
                <div style={styles.stepCol}>
                  <div style={styles.stepNum}>1</div>
                  <div style={styles.stepName}>Nộp Hồ Sơ Trực Tuyến</div>
                  <div style={styles.stepDetail}>Học sinh hoặc GVCN điền biểu mẫu nộp đơn và tải ảnh minh chứng hoàn cảnh.</div>
                </div>
                <div style={styles.stepCol}>
                  <div style={styles.stepNum}>2</div>
                  <div style={styles.stepName}>Xác Minh Cơ Sở</div>
                  <div style={styles.stepDetail}>GVCN và Đoàn trường đối chiếu thực tế gia cảnh, rèn luyện của học sinh.</div>
                </div>
                <div style={styles.stepCol}>
                  <div style={styles.stepNum}>3</div>
                  <div style={styles.stepName}>Hội Đồng Xét Duyệt</div>
                  <div style={styles.stepDetail}>Ban Giám hiệu và Hội đồng Quản lý Quỹ họp thông qua mức trao học bổng.</div>
                </div>
                <div style={styles.stepCol}>
                  <div style={styles.stepNum}>4</div>
                  <div style={styles.stepName}>Trao Học Bổng & Vinh Danh</div>
                  <div style={styles.stepDetail}>Trao trực tiếp trong Lễ Khai giảng, Chào cờ hoặc trao tận tay gia đình học sinh.</div>
                </div>
              </div>
            </div>

            {/* CALL TO ACTION */}
            <div style={styles.ctaBox}>
              <div>
                <h4 style={styles.ctaHeading}>Em đang gặp khó khăn hay biết bạn cùng lớp cần giúp đỡ?</h4>
                <p style={styles.ctaText}>Đừng ngần ngại nộp hồ sơ xin học bổng ngay hôm nay. Thầy cô và nhà trường luôn đồng hành cùng các em!</p>
              </div>
              <button onClick={() => setActiveTab('apply')} style={styles.ctaBtn}>
                Nộp Hồ Sơ Ngay <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: NỘP ĐƠN XIN HỌC BỔNG ===================== */}
        {activeTab === 'apply' && (
          <div style={styles.sectionCard}>
            <div style={styles.formHeader}>
              <div style={styles.formIconBadge}><Send size={24} color="#2563eb" /></div>
              <div>
                <h2 style={styles.sectionTitle}>Đơn Xin Cấp Học Bổng "Chắp Cánh Ước Mơ"</h2>
                <p style={styles.sectionDesc}>
                  Học sinh có hoàn cảnh khó khăn hoặc Giáo viên chủ nhiệm có thể điền thông tin vào phiếu đăng ký dưới đây. 
                  Mọi thông tin về hoàn cảnh gia đình của các em được nhà trường cam kết bảo mật tuyệt đối và tôn trọng.
                </p>
              </div>
            </div>

            {submittedCode && (
              <div style={styles.successAlert}>
                <CheckCircle2 size={32} color="#059669" />
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#065f46', fontSize: '18px' }}>
                    Nộp Đơn Xin Học Bổng Thành Công!
                  </h4>
                  <p style={{ margin: 0, color: '#047857', fontSize: '15px' }}>
                    Mã hồ sơ tra cứu của em là: <strong style={{ fontSize: '17px', color: '#065f46' }}>{submittedCode}</strong>.
                    <br />Ban Giám hiệu và Hội đồng Quản lý Quỹ sẽ tiến hành rà soát, xác minh và thông báo kết quả sớm nhất.
                  </p>
                  <button 
                    onClick={() => { setActiveTab('lookup'); setLookupQuery(submittedCode); }}
                    style={styles.trackNowBtn}
                  >
                    Xem Tiến Độ Hồ Sơ Ngay <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleApplySubmit} style={styles.formGrid}>
              <div style={styles.fieldSection}>
                <h3 style={styles.fieldSectionTitle}>1. Thông tin cá nhân học sinh</h3>
                <div style={styles.row2}>
                  <div>
                    <label style={styles.label}>Họ và tên học sinh (*)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="VD: Nguyễn Văn An"
                      value={applyForm.student_name}
                      onChange={(e) => setApplyForm({ ...applyForm, student_name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Lớp học (*)</label>
                    <select 
                      value={applyForm.student_class}
                      onChange={(e) => setApplyForm({ ...applyForm, student_class: e.target.value })}
                      style={styles.select}
                    >
                      {ALL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.row3}>
                  <div>
                    <label style={styles.label}>Giới tính</label>
                    <select 
                      value={applyForm.gender}
                      onChange={(e) => setApplyForm({ ...applyForm, gender: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Ngày sinh</label>
                    <input 
                      type="date" 
                      value={applyForm.birthday}
                      onChange={(e) => setApplyForm({ ...applyForm, birthday: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Số điện thoại liên hệ (*)</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="VD: 0912345678"
                      value={applyForm.phone}
                      onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.row2}>
                  <div>
                    <label style={styles.label}>Họ tên Bố/Mẹ hoặc Người giám hộ</label>
                    <input 
                      type="text" 
                      placeholder="VD: Nguyễn Văn Bình (Bố)"
                      value={applyForm.parent_name}
                      onChange={(e) => setApplyForm({ ...applyForm, parent_name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Địa chỉ gia đình cư trú</label>
                    <input 
                      type="text" 
                      placeholder="VD: Xã Cổ Bi, Huyện Gia Lâm, Hà Nội"
                      value={applyForm.home_address}
                      onChange={(e) => setApplyForm({ ...applyForm, home_address: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.fieldSection}>
                <h3 style={styles.fieldSectionTitle}>2. Hoàn cảnh & Thành tích học tập</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.label}>Diện đối tượng ưu tiên (*)</label>
                  <select 
                    value={applyForm.category}
                    onChange={(e) => setApplyForm({ ...applyForm, category: e.target.value })}
                    style={styles.select}
                  >
                    {SCHOLARSHIP_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.row2}>
                  <div>
                    <label style={styles.label}>Học lực gần nhất</label>
                    <select 
                      value={applyForm.academic_grade}
                      onChange={(e) => setApplyForm({ ...applyForm, academic_grade: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Tốt / Giỏi">Tốt / Giỏi</option>
                      <option value="Khá">Khá</option>
                      <option value="Đạt">Đạt</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Kết quả Rèn luyện / Hạnh kiểm</label>
                    <select 
                      value={applyForm.conduct_grade}
                      onChange={(e) => setApplyForm({ ...applyForm, conduct_grade: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Tốt">Tốt</option>
                      <option value="Khá">Khá</option>
                      <option value="Đạt">Đạt</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.label}>Tự thuật hoàn cảnh gia đình (Chi tiết để nhà trường thấu hiểu) (*)</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Em hãy chia sẻ cụ thể hoàn cảnh khó khăn của gia đình (bố mẹ làm nghề gì, kinh tế gia đình, có người đau ốm, biến cố phát sinh...)"
                    value={applyForm.circumstance_story}
                    onChange={(e) => setApplyForm({ ...applyForm, circumstance_story: e.target.value })}
                    style={styles.textarea}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.label}>Ước mơ tương lai & Kế hoạch phấn đấu của em</label>
                  <textarea 
                    rows={3}
                    placeholder="Ước mơ ngành nghề tương lai của em là gì? Nếu nhận được học bổng này, em sẽ sử dụng vào việc gì và phấn đấu ra sao?"
                    value={applyForm.dream_aspiration}
                    onChange={(e) => setApplyForm({ ...applyForm, dream_aspiration: e.target.value })}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.fieldSection}>
                <h3 style={styles.fieldSectionTitle}>3. Giấy tờ minh chứng đính kèm (Ảnh chụp)</h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: 0 }}>
                  Chụp ảnh hoặc tải lên: Sổ hộ nghèo/cận nghèo, Giấy xác nhận hoàn cảnh của địa phương, Giấy chứng nhận khuyết tật, Bệnh án, hoặc Giấy khen (nếu có).
                </p>

                <div style={styles.uploadArea}>
                  <input 
                    type="file" 
                    id="evidence-file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleEvidenceUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="evidence-file" style={styles.uploadBtnLabel}>
                    <Upload size={18} />
                    <span>{uploadingEvidence ? 'Đang tải ảnh...' : 'Chọn ảnh chụp minh chứng từ điện thoại / máy tính'}</span>
                  </label>
                </div>

                {applyForm.evidence_urls && applyForm.evidence_urls.length > 0 && (
                  <div style={styles.evidenceGrid}>
                    {applyForm.evidence_urls.map((img, idx) => (
                      <div key={idx} style={styles.evidenceItem}>
                        <img src={img} alt={`Minh chứng ${idx + 1}`} style={styles.evidenceImg} />
                        <button type="button" onClick={() => removeEvidence(idx)} style={styles.removeImgBtn}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.formActions}>
                <button type="submit" disabled={submittingApply} style={styles.submitBtn}>
                  <Send size={18} />
                  <span>{submittingApply ? 'Đang gửi hồ sơ...' : 'NỘP ĐƠN XIN HỌC BỔNG'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================== TAB 3: TRA CỨU HỒ SƠ ===================== */}
        {activeTab === 'lookup' && (
          <div style={styles.sectionCard}>
            <div style={styles.lookupHeader}>
              <h2 style={styles.sectionTitle}>Tra Cứu Tình Trạng Hồ Sơ Học Bổng</h2>
              <p style={styles.sectionDesc}>
                Nhập Mã hồ sơ (ví dụ: HS-CCUM-2026-...) hoặc Họ và tên học sinh hoặc Số điện thoại để theo dõi kết quả xét duyệt.
              </p>

              <form onSubmit={handleLookupSubmit} style={styles.lookupForm}>
                <div style={styles.searchBox}>
                  <Search size={20} color="#64748b" />
                  <input 
                    type="text" 
                    placeholder="Nhập Mã hồ sơ, Mã học sinh, Họ tên hoặc Số điện thoại..."
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    style={styles.lookupInput}
                  />
                </div>
                <button type="submit" disabled={isSearching} style={styles.lookupBtn}>
                  {isSearching ? 'Đang tìm...' : 'Tra cứu ngay'}
                </button>
              </form>
            </div>

            {lookupResult && (
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '15px' }}>
                  Kết quả tra cứu ({lookupResult.length} hồ sơ tìm thấy):
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {lookupResult.map(item => (
                    <div key={item.id} style={styles.resultCard}>
                      <div style={styles.resultHeader}>
                        <div>
                          <span style={styles.resultCode}>{item.application_code || 'Chưa có mã'}</span>
                          <h4 style={styles.resultName}>{item.student_name} — Lớp {item.student_class}</h4>
                        </div>
                        <div>
                          {item.status === 'approved' && (
                            <span style={styles.statusApproved}>
                              <CheckCircle2 size={16} /> ĐÃ PHÊ DUYỆT TRAO HỌC BỔNG
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span style={styles.statusPending}>
                              <Clock size={16} /> ĐANG CHỜ XÉT DUYỆT
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span style={styles.statusRejected}>
                              <AlertCircle size={16} /> CHƯA ĐỦ ĐIỀU KIỆN
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={styles.resultDetails}>
                        <div><strong>Hoàn cảnh:</strong> {item.category}</div>
                        <div><strong>Học lực / Rèn luyện:</strong> {item.academic_grade} / {item.conduct_grade}</div>
                        <div><strong>Ngày gửi đơn:</strong> {new Date(item.created_at).toLocaleDateString('vi-VN')}</div>
                        {item.status === 'approved' && (
                          <div style={{ color: '#047857', fontWeight: 600 }}>
                            <strong>Mức học bổng trao tặng:</strong> {(Number(item.granted_amount) || 0).toLocaleString('vi-VN')} VNĐ
                            {item.granted_item && ` (Kèm hiện vật: ${item.granted_item})`}
                          </div>
                        )}
                        {item.review_note && (
                          <div style={styles.reviewNoteBox}>
                            <strong>Nhận xét của Hội đồng:</strong> {item.review_note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: BẢNG VÀNG TRI ÂN ===================== */}
        {activeTab === 'sponsors' && (
          <div style={styles.sectionCard}>
            <div style={styles.sponsorsHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={styles.goldBadge}><Award size={26} color="#d97706" /></div>
                <div>
                  <h2 style={styles.sectionTitle}>Bảng Vàng Tri Ân Tấm Lòng Hảo Tâm</h2>
                  <p style={styles.sectionDesc}>
                    Trường THPT Cao Bá Quát trân trọng ghi nhận và tri ân tấm lòng vàng của các thế hệ cựu học sinh, 
                    quý bậc phụ huynh, các tổ chức, doanh nghiệp và các nhà hảo tâm đã ủng hộ Quỹ "Chắp cánh ước mơ".
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setActiveTab('donate')} style={styles.donateActionBtn}>
                  <Heart size={16} /> Tham Gia Đóng Góp
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm nhà hảo tâm, cựu học sinh, tập thể lớp..."
                value={sponsorSearch}
                onChange={(e) => setSponsorSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>STT</th>
                    <th style={styles.th}>Nhà hảo tâm / Đơn vị</th>
                    <th style={styles.th}>Tiền mặt ủng hộ</th>
                    <th style={styles.th}>Hiện vật tài trợ</th>
                    <th style={styles.th}>Ngày đóng góp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSponsors.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Chưa có dữ liệu nhà tài trợ nào phù hợp với tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredSponsors.map((s, idx) => (
                      <tr key={s.id || idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.tdCenter}>{idx + 1}</td>
                        <td style={styles.tdBold}>{s.name}</td>
                        <td style={styles.tdAmount}>
                          {s.donation_amount > 0 ? (
                            <span style={{ color: '#059669', fontWeight: 600 }}>
                              {Number(s.donation_amount).toLocaleString('vi-VN')} đ
                            </span>
                          ) : '—'}
                        </td>
                        <td style={styles.td}>{s.donation_item || '—'}</td>
                        <td style={styles.tdCenter}>
                          {s.date_received ? new Date(s.date_received).toLocaleDateString('vi-VN') : 'Mới tiếp nhận'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: ĐĂNG KÝ ỦNG HỘ & CHUYỂN KHOẢN (VIETQR) ===================== */}
        {activeTab === 'donate' && (
          <div style={styles.sectionCard}>
            <div style={styles.donateHeader}>
              <h2 style={styles.sectionTitle}>Chung Tay Tiếp Sức — Chắp Cánh Ước Mơ</h2>
              <p style={styles.sectionDesc}>
                Mỗi sự đóng góp dù nhỏ bé của Quý vị đều là nguồn động viên to lớn, thắp sáng niềm tin 
                và giúp các em học sinh có hoàn cảnh éo le vững bước trên con đường học tập.
              </p>
            </div>

            <div style={styles.donateGrid}>
              {/* CỘT TRÁI: FORM ĐĂNG KÝ & CHỌN MỨC TIỀN */}
              <div style={styles.donateFormCol}>
                <h3 style={styles.subHeading}>1. Đăng ký thông tin tài trợ</h3>

                {donateSuccess ? (
                  <div style={styles.successAlert}>
                    <CheckCircle2 size={32} color="#059669" />
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#065f46', fontSize: '18px' }}>
                        Trân trọng cảm ơn Quý vị!
                      </h4>
                      <p style={{ margin: 0, color: '#047857', fontSize: '14px' }}>
                        Thông tin đóng góp của Quý vị đã được ghi nhận. Ban Quản Lý Quỹ sẽ liên hệ xác nhận 
                        và cập nhật vinh danh trên Bảng Vàng Quỹ "Chắp cánh ước mơ".
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleDonateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <label style={styles.label}>Tên Cá nhân / Tập thể cựu học sinh / Doanh nghiệp (*)</label>
                      <input 
                        required
                        type="text" 
                        placeholder="VD: Cựu học sinh Khóa 2010-2013 hoặc Công ty ABC"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.row2}>
                      <div>
                        <label style={styles.label}>Số điện thoại liên hệ (để xác nhận)</label>
                        <input 
                          type="tel" 
                          placeholder="VD: 0988888888"
                          value={donorPhone}
                          onChange={(e) => setDonorPhone(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Hiện vật tài trợ (nếu có)</label>
                        <input 
                          type="text" 
                          placeholder="VD: 5 chiếc xe đạp, 20 bộ SGK..."
                          value={donorNote}
                          onChange={(e) => setDonorNote(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={styles.label}>Chọn mức tiền ủng hộ (VNĐ)</label>
                      <div style={styles.amountOptions}>
                        {[200000, 500000, 1000000, 2000000, 5000000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => { setDonateAmount(amt); setCustomDonateAmount(''); }}
                            style={donateAmount === amt && !customDonateAmount ? styles.amountBtnActive : styles.amountBtn}
                          >
                            {amt.toLocaleString('vi-VN')} đ
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={styles.label}>Hoặc nhập số tiền tùy chọn khác (VNĐ)</label>
                      <input 
                        type="number" 
                        placeholder="Nhập số tiền khác..."
                        value={customDonateAmount}
                        onChange={(e) => setCustomDonateAmount(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <button type="submit" disabled={donateSubmitting} style={styles.submitDonateBtn}>
                      <Heart size={18} />
                      <span>{donateSubmitting ? 'Đang gửi...' : 'GỬI ĐĂNG KÝ ĐÓNG GÓP'}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* CỘT PHẢI: MÃ QR VIETQR CHUYỂN KHOẢN TỰ ĐỘNG */}
              <div style={styles.qrCol}>
                <h3 style={styles.subHeading}>2. Quét mã VietQR chuyển khoản tiếp sức</h3>
                <div style={styles.qrCard}>
                  <div style={styles.qrBox}>
                    <img 
                      src={vietQrUrl} 
                      alt="Mã QR Chuyển khoản Quỹ Chắp cánh ước mơ" 
                      style={styles.qrImg}
                    />
                  </div>

                  <div style={styles.bankInfoBox}>
                    <div style={styles.bankRow}>
                      <span style={styles.bankLabel}>Ngân hàng:</span>
                      <strong style={styles.bankVal}>{currentBank}</strong>
                    </div>
                    <div style={styles.bankRow}>
                      <span style={styles.bankLabel}>Số tài khoản:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ ...styles.bankVal, color: '#059669', fontSize: '17px' }}>{currentAcc}</strong>
                        <button 
                          type="button" 
                          onClick={() => copyToClipboard(currentAcc)}
                          style={styles.copyBtn}
                          title="Sao chép số tài khoản"
                        >
                          {copiedAccount ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div style={styles.bankRow}>
                      <span style={styles.bankLabel}>Chủ tài khoản:</span>
                      <strong style={styles.bankVal}>{currentName}</strong>
                    </div>
                    <div style={styles.bankRow}>
                      <span style={styles.bankLabel}>Nội dung CK:</span>
                      <strong style={{ ...styles.bankVal, color: '#d97706' }}>{transferContent}</strong>
                    </div>
                  </div>

                  <div style={styles.hotlineNote}>
                    <Phone size={16} color="#2563eb" />
                    <span>Hotline hỗ trợ & xác nhận: <strong>{fundSettings?.hotline || '024.3827.1856'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ======================= BỘ STYLE THIẾT KẾ HIỆN ĐẠI =======================
const styles = {
  pageWrap: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b'
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
    color: '#ffffff',
    padding: '60px 20px 40px 20px',
    position: 'relative'
  },
  heroOverlay: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center'
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    marginBottom: '18px'
  },
  heroTitle: {
    fontSize: 'clamp(26px, 4vw, 42px)',
    fontWeight: 800,
    margin: '0 0 16px 0',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
  },
  heroSubtitle: {
    fontSize: 'clamp(15px, 2vw, 17px)',
    color: '#e2e8f0',
    maxWidth: '820px',
    margin: '0 auto 40px auto',
    lineHeight: 1.6
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '22px',
    color: '#0f172a',
    textAlign: 'center',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.4)'
  },
  statIconWrap: {
    display: 'inline-flex',
    padding: '10px',
    borderRadius: '12px',
    background: '#f1f5f9',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.2
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748b',
    marginTop: '6px'
  },
  navBar: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    gap: '8px',
    padding: '10px 20px',
    overflowX: 'auto',
    whiteSpace: 'nowrap'
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  tabBtnActive: {
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
    cursor: 'pointer'
  },
  donateNavBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#dc2626',
    cursor: 'pointer',
    marginLeft: 'auto'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '30px auto 60px auto',
    padding: '0 20px'
  },
  sectionCard: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '36px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 8px 0'
  },
  sectionDesc: {
    fontSize: '15px',
    color: '#64748b',
    lineHeight: 1.6,
    margin: 0
  },
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '30px'
  },
  pillarItem: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #f1f5f9'
  },
  pillarIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  pillarTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 8px 0'
  },
  pillarText: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.6,
    margin: 0
  },
  processBox: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '30px',
    marginTop: '36px',
    border: '1px solid #e2e8f0'
  },
  processTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
    margin: '0 0 24px 0'
  },
  stepsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  stepCol: {
    textAlign: 'center'
  },
  stepNum: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#2563eb',
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '16px',
    marginBottom: '10px'
  },
  stepName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '6px'
  },
  stepDetail: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: 1.5
  },
  ctaBox: {
    marginTop: '36px',
    background: 'linear-gradient(135deg, #1e3a8a, #0369a1)',
    borderRadius: '16px',
    padding: '30px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px'
  },
  ctaHeading: {
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 6px 0'
  },
  ctaText: {
    fontSize: '14px',
    color: '#e2e8f0',
    margin: 0
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    color: '#1e3a8a',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer'
  },
  formHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '26px'
  },
  formIconBadge: {
    padding: '12px',
    background: '#eff6ff',
    borderRadius: '14px'
  },
  fieldSection: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #f1f5f9'
  },
  fieldSectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 18px 0',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px'
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
    marginBottom: '15px'
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '15px'
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
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  uploadArea: {
    marginTop: '10px'
  },
  uploadBtnLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    border: '1px dashed #2563eb',
    color: '#2563eb',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  evidenceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '12px',
    marginTop: '15px'
  },
  evidenceItem: {
    position: 'relative',
    height: '100px',
    borderRadius: '10px',
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
    top: '4px',
    right: '4px',
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px'
  },
  formActions: {
    textAlign: 'center',
    marginTop: '20px'
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    background: '#2563eb',
    color: '#ffffff',
    padding: '14px 36px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
  },
  successAlert: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '26px'
  },
  trackNowBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '12px'
  },
  lookupHeader: {
    textAlign: 'center',
    maxWidth: '680px',
    margin: '0 auto'
  },
  lookupForm: {
    display: 'flex',
    gap: '10px',
    marginTop: '24px',
    flexWrap: 'wrap'
  },
  searchBox: {
    flex: 1,
    minWidth: '280px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '0 14px'
  },
  lookupInput: {
    width: '100%',
    padding: '12px 10px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    outline: 'none'
  },
  lookupBtn: {
    background: '#2563eb',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  resultCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '20px'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  resultCode: {
    fontSize: '12px',
    fontWeight: 700,
    background: '#e0e7ff',
    color: '#3730a3',
    padding: '4px 10px',
    borderRadius: '6px',
    display: 'inline-block',
    marginBottom: '6px'
  },
  resultName: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  statusApproved: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#d1fae5',
    color: '#065f46',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 700
  },
  statusPending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fef3c7',
    color: '#92400e',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 700
  },
  statusRejected: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fee2e2',
    color: '#991b1b',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 700
  },
  resultDetails: {
    fontSize: '14px',
    color: '#475569',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  reviewNoteBox: {
    marginTop: '8px',
    background: '#ffffff',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    color: '#1e293b'
  },
  sponsorsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '26px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  goldBadge: {
    padding: '12px',
    background: '#fef3c7',
    borderRadius: '14px'
  },
  donateActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  tableResponsive: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    background: '#f8fafc',
    padding: '14px 16px',
    textAlign: 'left',
    color: '#475569',
    fontWeight: 700,
    borderBottom: '2px solid #e2e8f0'
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155'
  },
  tdBold: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9',
    fontWeight: 700,
    color: '#0f172a'
  },
  tdCenter: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'center',
    color: '#64748b'
  },
  tdAmount: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9'
  },
  trEven: {
    background: '#ffffff'
  },
  trOdd: {
    background: '#fafafa'
  },
  donateHeader: {
    textAlign: 'center',
    maxWidth: '720px',
    margin: '0 auto 30px auto'
  },
  donateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '30px'
  },
  donateFormCol: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '26px',
    border: '1px solid #e2e8f0'
  },
  subHeading: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 18px 0'
  },
  amountOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  amountBtn: {
    padding: '9px 14px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer'
  },
  amountBtnActive: {
    padding: '9px 14px',
    background: '#ecfdf5',
    border: '1px solid #059669',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#059669',
    cursor: 'pointer'
  },
  submitDonateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#059669',
    color: '#ffffff',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '10px'
  },
  qrCol: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '26px',
    border: '1px solid #e2e8f0',
    textAlign: 'center'
  },
  qrCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0',
    display: 'inline-block',
    maxWidth: '360px',
    width: '100%'
  },
  qrBox: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  qrImg: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px'
  },
  bankInfoBox: {
    textAlign: 'left',
    fontSize: '13px',
    background: '#f8fafc',
    padding: '14px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid #f1f5f9'
  },
  bankRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bankLabel: {
    color: '#64748b'
  },
  bankVal: {
    color: '#0f172a'
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    color: '#64748b'
  },
  hotlineNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#475569',
    marginTop: '16px'
  }
};
