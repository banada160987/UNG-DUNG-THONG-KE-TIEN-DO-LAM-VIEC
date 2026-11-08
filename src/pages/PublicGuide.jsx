import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Trophy, HeartHandshake, Mail, Upload, 
  AlertCircle, HelpCircle, Award, ShieldCheck, Sparkles,
  Lock, Key, Users, GraduationCap, School, CheckCircle2,
  FileText, Cpu, Camera, Clock, Smartphone, Gamepad2,
  QrCode, Compass, FolderLock, FileSpreadsheet, Layers,
  ArrowRight, ShieldAlert, Check, ClipboardCheck
} from 'lucide-react';

export default function PublicGuide() {
  const [activeTab, setActiveTab] = useState('ecosystem');

  return (
    <div className="guide-container" style={styles.container}>
      <style>{`
        /* RESPONSIVE MOBILE-FIRST PUBLIC GUIDE CBQ */
        @media (max-width: 640px) {
          .guide-container {
            padding: 12px 10px 60px 10px !important;
          }
          .guide-header-card {
            padding: 16px 14px !important;
            border-radius: 14px !important;
          }
          .guide-header-title {
            font-size: 16.5px !important;
            line-height: 1.35 !important;
          }
          .guide-header-subtitle {
            font-size: 12px !important;
            line-height: 1.45 !important;
          }
          .guide-security-banner {
            padding: 14px 12px !important;
            border-radius: 14px !important;
          }
          .guide-login-gateways {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .guide-module-section-card {
            padding: 14px 12px !important;
            border-radius: 14px !important;
            margin-bottom: 16px !important;
          }
          .guide-module-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .guide-module-card {
            padding: 14px 12px !important;
            border-radius: 12px !important;
          }
          .guide-step-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>

      {/* BANNER HEADER */}
      <div className="guide-header-card" style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <div style={{ background: '#fef08a', padding: '12px', borderRadius: '12px', color: '#854d0e', flexShrink: 0 }}>
            <BookOpen size={36} />
          </div>
          <div>
            <span style={styles.badge}>CỔNG THÔNG TIN HƯỚNG DẪN CHÍNH THỨC</span>
            <h1 className="guide-header-title" style={styles.title}>GIỚI THIỆU HỆ SINH THÁI ĐIỀU HÀNH & TIỆN ÍCH SỐ</h1>
            <p className="guide-header-subtitle" style={styles.subtitle}>Trường THPT Cao Bá Quát • Nền tảng số thông minh tích hợp AI & Chuẩn hóa Nghị định 30/2020/NĐ-CP</p>
          </div>
        </div>
      </div>

      {/* QUICK CATEGORY FILTER TABS */}
      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('ecosystem')}
          style={activeTab === 'ecosystem' ? styles.tabBtnActiveHighlight : styles.tabBtn}
        >
          <Sparkles size={16} color={activeTab === 'ecosystem' ? '#ffffff' : '#2563eb'} /> 🏛️ Các Phân Hệ Tiện Ích Số (Mới)
        </button>
        <button 
          onClick={() => setActiveTab('sponsorship')}
          style={activeTab === 'sponsorship' ? styles.tabBtnActive : styles.tabBtn}
        >
          <HeartHandshake size={16} /> Đồng Hành & Đóng Góp
        </button>
        <button 
          onClick={() => setActiveTab('quiz')}
          style={activeTab === 'quiz' ? styles.tabBtnActive : styles.tabBtn}
        >
          <Trophy size={16} /> Cuộc Thi Tìm Hiểu
        </button>
        <button 
          onClick={() => setActiveTab('sports')}
          style={activeTab === 'sports' ? styles.tabBtnActive : styles.tabBtn}
        >
          ⚽ Giải Thể Thao
        </button>
        <button 
          onClick={() => setActiveTab('invite')}
          style={activeTab === 'invite' ? styles.tabBtnActive : styles.tabBtn}
        >
          <Mail size={16} /> Thiệp Mời & Lời Chúc
        </button>
        <button 
          onClick={() => setActiveTab('voting')}
          style={activeTab === 'voting' ? styles.tabBtnActive : styles.tabBtn}
        >
          <Upload size={16} /> Nộp Bài & Bình Chọn
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          style={activeTab === 'all' ? styles.tabBtnActive : styles.tabBtn}
        >
          ✨ Xem Tất Cả
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION ĐẶC BIỆT: GIỚI THIỆU CÁC PHÂN HỆ TIỆN ÍCH SỐ (KHÔNG GÁN URL NỘI BỘ) */}
      {/* ========================================================================= */}
      {(activeTab === 'ecosystem' || activeTab === 'all') && (
        <div style={{ marginBottom: '35px' }}>
          
          {/* BANNER THÔNG BÁO NGUYÊN TẮC BẢO MẬT & PHÂN QUYỀN */}
          <div className="guide-security-banner" style={styles.securityBanner}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={styles.securityIconCircle}>
                <ShieldAlert size={26} color="#ffffff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16.5px', color: '#1e3a8a', fontWeight: '800' }}>
                  🛡️ NGUYÊN TẮC BẢO MẬT & PHÂN QUYỀN TRUY CẬP HỆ THỐNG
                </h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.6 }}>
                  Để đảm bảo an toàn thông tin, bảo mật hồ sơ học sinh và tính toàn vẹn dữ liệu sư phạm theo quy định của Nhà nước và Bộ GD&ĐT, 
                  <strong> tất cả các chức năng quản trị, chuyên môn nghiệp vụ dưới đây được phân quyền chặt chẽ theo vai trò</strong> (Ban Giám Hiệu, Giáo Viên, Học Sinh).
                  Hệ thống <strong>không mở đường dẫn công khai trực tiếp</strong>. Quý Thầy/Cô và các em học sinh vui lòng 
                  <strong> đăng nhập đúng Cổng xác thực của mình</strong>, sau khi đăng nhập thành công, hệ thống sẽ tự động kích hoạt và hiển thị đầy đủ Menu chức năng trên thanh điều hướng cá nhân.
                </p>
              </div>
            </div>

            {/* 3 CỔNG ĐĂNG NHẬP CHÍNH THỨC */}
            <div className="guide-login-gateways" style={styles.loginGatewaysGrid}>
              <Link to="/login" style={{ ...styles.loginGateCard, borderColor: '#93c5fd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#dbeafe', padding: '8px', borderRadius: '10px', color: '#1d4ed8' }}>
                    <Key size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af' }}>Cổng Quản Trị & BGH</div>
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>Dành cho Hiệu trưởng, PHT & Văn phòng</div>
                  </div>
                </div>
                <span style={styles.loginGateBtn}>Đăng Nhập ➔</span>
              </Link>

              <Link to="/dang-nhap-giao-vien" style={{ ...styles.loginGateCard, borderColor: '#86efac' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '10px', color: '#15803d' }}>
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>Cổng Dành Cho Giáo Viên</div>
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>Dành cho Thầy/Cô bộ môn & chủ nhiệm</div>
                  </div>
                </div>
                <span style={{ ...styles.loginGateBtn, background: '#16a34a' }}>Đăng Nhập ➔</span>
              </Link>

              <Link to="/dang-nhap-hoc-sinh" style={{ ...styles.loginGateCard, borderColor: '#fde047' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#fef9c3', padding: '8px', borderRadius: '10px', color: '#a16207' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#854d0e' }}>Cổng Dành Cho Học Sinh</div>
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>Dành cho học sinh khối 10, 11, 12</div>
                  </div>
                </div>
                <span style={{ ...styles.loginGateBtn, background: '#ca8a04' }}>Đăng Nhập ➔</span>
              </Link>
            </div>
          </div>

          {/* ================= PHÂN HỆ 1 ================= */}
          <div style={styles.moduleSectionCard}>
            <div style={styles.moduleSectionHeader}>
              <div style={{ background: '#ede9fe', padding: '10px', borderRadius: '12px', color: '#6d28d9' }}>
                <Cpu size={26} />
              </div>
              <div>
                <span style={{ ...styles.roleBadge, background: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe' }}>
                  PHÂN HỆ TRỌNG TÂM 1
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '19px', color: '#581c87', fontWeight: '800' }}>
                  TRÍ TUỆ NHÂN TẠO (AI) & VĂN THƯ SỐ CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP
                </h2>
              </div>
            </div>

            <p style={styles.descText}>
              Ứng dụng các công nghệ AI tiên tiến (Google Gemini Multimodal Audio & NLP) nhằm tự động hóa tối đa các công tác hành chính, 
              soạn thảo văn bản nhà nước và tham vấn tâm lý học đường.
            </p>

            <div style={styles.moduleGrid}>
              
              {/* Module 1.1 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#ede9fe', color: '#7c3aed' }}>
                    <FileText size={22} />
                  </div>
                  <span style={styles.badgeRoleAdmin}>🔒 Yêu cầu: BGH & Thư Ký</span>
                </div>
                <h3 style={styles.moduleTitle}>Trợ Lý Thư Ký AI - Ghi Âm & Biên Bản Họp</h3>
                <p style={styles.moduleDesc}>
                  Tự động hóa 100% công tác thư ký cuộc họp Hội đồng sư phạm, Giao ban BGH và Sinh hoạt chi bộ.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Thu âm thoại trực tiếp hoặc nạp file âm thanh (.mp3, .m4a, .wav).</li>
                  <li>AI bóc băng tiếng Việt, tự động nhận diện ý kiến từng diễn giả.</li>
                  <li>Trích xuất Ma trận phân công nhiệm vụ (Action Items) có thời hạn và kết quả.</li>
                  <li>Xuất file Microsoft Word (.doc) chuẩn 100% Nghị định 30 (quy tắc tiền tố <code>1-...</code>).</li>
                </ul>
              </div>

              {/* Module 1.2 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#e0f2fe', color: '#0284c7' }}>
                    <Layers size={22} />
                  </div>
                  <span style={styles.badgeRoleTeacher}>🔒 Yêu cầu: Cán Bộ & Giáo Viên</span>
                </div>
                <h3 style={styles.moduleTitle}>Studio Căn Chỉnh Thể Thức Văn Bản (Latendoc)</h3>
                <p style={styles.moduleDesc}>
                  Chuẩn hóa thể thức văn bản hành chính sư phạm theo đúng quy chuẩn Nghị định 30/2020/NĐ-CP.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Kho mẫu hành chính phong phú: Giấy mời, Quyết định, Tờ trình, Kế hoạch...</li>
                  <li>Thẩm định thể thức (Audit) & Tự động sửa lỗi 1-chạm (Auto-Fix).</li>
                  <li>Trợ lý AI Deep Polish biên tập văn phong công vụ, phân cấp rõ đề mục.</li>
                  <li>Xuất bản file Word chuẩn trang in A4 sắc nét, đúng phông chữ và dãn dòng.</li>
                </ul>
              </div>

              {/* Module 1.3 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#fef3c7', color: '#d97706' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <span style={styles.badgeRoleAdmin}>🔒 Yêu cầu: BGH & GVCN Khối 12</span>
                </div>
                <h3 style={styles.moduleTitle}>Trợ Lý Thẩm Định Hồ Sơ Tốt Nghiệp THPT</h3>
                <p style={styles.moduleDesc}>
                  Đối soát dữ liệu thí sinh dự thi tốt nghiệp THPT tự động bằng trí tuệ nhân tạo.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>So khớp chéo dữ liệu CCCD, Học bạ số, Giấy khai sinh và Diện ưu tiên.</li>
                  <li>Cảnh báo tức thì các trường hợp lệch dấu tiếng Việt, sai ngày sinh, thiếu minh chứng.</li>
                  <li>Đảm bảo dữ liệu chính xác 100% trước khi nộp lên Cổng quản lý thi của Bộ GD&ĐT.</li>
                </ul>
              </div>

              {/* Module 1.4 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#ffe4e6', color: '#e11d48' }}>
                    <HeartHandshake size={22} />
                  </div>
                  <span style={styles.badgeRolePublic}>🌐 Học Sinh & Ban Giám Hiệu</span>
                </div>
                <h3 style={styles.moduleTitle}>Hòm Thư Tâm Tư & Trợ Lý Tham Vấn AI Advisor</h3>
                <p style={styles.moduleDesc}>
                  Kênh tiếp nhận tâm tư, hỗ trợ tâm lý học đường và phòng ngừa bạo lực học đường bảo mật cao.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Học sinh gửi tâm tư ẩn danh hoặc định danh với mã bảo mật riêng.</li>
                  <li>AI Advisor phân tích cảm xúc, mức độ khẩn cấp và đề xuất giải pháp cho BGH.</li>
                  <li>Xuất báo cáo tổng hợp Excel có tiền tố số thứ tự phục vụ giao ban sư phạm.</li>
                </ul>
              </div>

            </div>
          </div>

          {/* ================= PHÂN HỆ 2 ================= */}
          <div style={styles.moduleSectionCard}>
            <div style={styles.moduleSectionHeader}>
              <div style={{ background: '#dbeafe', padding: '10px', borderRadius: '12px', color: '#1d4ed8' }}>
                <School size={26} />
              </div>
              <div>
                <span style={{ ...styles.roleBadge, background: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}>
                  PHÂN HỆ TRỌNG TÂM 2
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '19px', color: '#1e3a8a', fontWeight: '800' }}>
                  QUẢN TRỊ ĐIỀU HÀNH NHÀ TRƯỜNG & VĂN PHÒNG ĐIỆN TỬ
                </h2>
              </div>
            </div>

            <p style={styles.descText}>
              Số hóa toàn bộ các hoạt động điều hành, giám sát số liệu, khảo thí và dịch vụ công nhà trường trên nền tảng đám mây thời gian thực.
            </p>

            <div style={styles.moduleGrid}>
              
              {/* Module 2.1 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#dbeafe', color: '#1d4ed8' }}>
                    <School size={22} />
                  </div>
                  <span style={styles.badgeRoleAdmin}>🔒 Yêu cầu: Ban Giám Hiệu</span>
                </div>
                <h3 style={styles.moduleTitle}>Bảng Điều Khiển Tổng Thể (Realtime Dashboard)</h3>
                <p style={styles.moduleDesc}>
                  Bức tranh toàn cảnh về tiến độ học tập, sĩ số, các khoản thu và thi đua toàn trường.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Giám sát biểu đồ chuyên môn, nề nếp và công tác đoàn thể theo tuần.</li>
                  <li>Trung tâm điều phối App Hub liên kết mọi tiện ích cho Lãnh đạo nhà trường.</li>
                </ul>
              </div>

              {/* Module 2.2 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#fef3c7', color: '#b45309' }}>
                    <ClipboardCheck size={22} />
                  </div>
                  <span style={styles.badgeRoleAdmin}>🔒 Yêu cầu: Ban Khảo Thí & BGH</span>
                </div>
                <h3 style={styles.moduleTitle}>Tổ Chức Kiểm Tra Tập Trung & Phân Phòng Thi</h3>
                <p style={styles.moduleDesc}>
                  Quy trình tổ chức kỳ thi Giữa kỳ và Cuối kỳ tự động, khoa học và minh bạch.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Đánh số báo danh ngẫu nhiên, tự động chia phòng thi (24 - 30 học sinh/phòng).</li>
                  <li>Xuất danh sách phòng thi, sơ đồ chỗ ngồi và phiếu thu bài chuẩn Bộ GD&ĐT.</li>
                  <li>Học sinh và phụ huynh tra cứu phòng thi trực tuyến bằng mã định danh.</li>
                </ul>
              </div>

              {/* Module 2.3 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#dcfce7', color: '#15803d' }}>
                    <QrCode size={22} />
                  </div>
                  <span style={styles.badgeRoleTeacher}>🔒 Yêu cầu: Hội Đồng Sư Phạm</span>
                </div>
                <h3 style={styles.moduleTitle}>Phòng Họp Trực Tuyến & Điểm Danh QR Code</h3>
                <p style={styles.moduleDesc}>
                  Xóa bỏ việc ký giấy điểm danh thủ công trong các cuộc họp hội đồng và đại hội.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Điểm danh bằng mã QR động theo thời gian thực trên điện thoại thông minh.</li>
                  <li>Kiểm soát sĩ số có mặt/vắng phép; tích hợp biểu quyết số (Online Voting).</li>
                </ul>
              </div>

              {/* Module 2.4 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#fee2e2', color: '#b91c1c' }}>
                    <ShieldCheck size={22} />
                  </div>
                  <span style={styles.badgeRoleAdmin}>🔒 Yêu cầu: Đoàn Trường & Bảo Vệ</span>
                </div>
                <h3 style={styles.moduleTitle}>Quản Lý An Toàn Giao Thông & Xe Máy Học Sinh</h3>
                <p style={styles.moduleDesc}>
                  Đảm bảo trật tự an toàn giao thông học đường và quản lý phương tiện cổng trường.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Đăng ký phương tiện trực tuyến (biển số, dung tích xi lanh, bảo hiểm xe).</li>
                  <li>Cấp mã QR định danh dán trên xe máy; quét kiểm tra xe vi phạm trong 3 giây.</li>
                  <li>Tổng hợp điểm thi đua nề nếp học sinh hàng tuần theo từng chi đoàn.</li>
                </ul>
              </div>

              {/* Module 2.5 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#f0fdf4', color: '#166534' }}>
                    <FolderLock size={22} />
                  </div>
                  <span style={styles.badgeRolePublic}>🌐 Dịch Vụ Công Trực Tuyến</span>
                </div>
                <h3 style={styles.moduleTitle}>Cổng Dịch Vụ Công & Cấp Bản Sao Học Bạ</h3>
                <p style={styles.moduleDesc}>
                  Thực hiện dịch vụ công trực tuyến mức độ 4 phục vụ cựu học sinh và phụ huynh.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Nộp hồ sơ trực tuyến xin cấp bản sao bằng tốt nghiệp, xác nhận thời gian học.</li>
                  <li>Tra cứu tiến độ xử lý hồ sơ hành chính; văn phòng ký số trả kết quả trực tuyến.</li>
                </ul>
              </div>

              {/* Module 2.6 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#e0e7ff', color: '#4338ca' }}>
                    <Lock size={22} />
                  </div>
                  <span style={styles.badgeRolePublic}>🌐 Tra Cứu Toàn Dân</span>
                </div>
                <h3 style={styles.moduleTitle}>Kho Văn Bằng & Chứng Chỉ Số (Digital Vault)</h3>
                <p style={styles.moduleDesc}>
                  Lưu trữ và xác thực văn bằng điện tử chống làm giả cho các thế hệ học sinh.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Mã hóa hồ sơ tốt nghiệp của từng khóa học sinh tại trường.</li>
                  <li>Nhà tuyển dụng và trường Đại học dễ dàng xác thực bằng tốt nghiệp qua mã QR.</li>
                </ul>
              </div>

            </div>
          </div>

          {/* ================= PHÂN HỆ 3 ================= */}
          <div style={styles.moduleSectionCard}>
            <div style={styles.moduleSectionHeader}>
              <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '12px', color: '#15803d' }}>
                <GraduationCap size={26} />
              </div>
              <div>
                <span style={{ ...styles.roleBadge, background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                  PHÂN HỆ TRỌNG TÂM 3
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '19px', color: '#14532d', fontWeight: '800' }}>
                  GIẢNG DẠY & CHUYÊN MÔN SƯ PHẠM (DÀNH CHO GIÁO VIÊN)
                </h2>
              </div>
            </div>

            <p style={styles.descText}>
              Hỗ trợ toàn diện cho Thầy/Cô giáo trong công tác giảng dạy, ra đề kiểm tra cấu trúc mới 2025, chấm thi trên di động và hoàn thành sổ sách điện tử.
            </p>

            <div style={styles.moduleGrid}>
              
              {/* Module 3.1 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#ecfdf5', color: '#059669' }}>
                    <Smartphone size={22} />
                  </div>
                  <span style={styles.badgeRoleTeacher}>🔒 Yêu cầu: Giáo Viên Bộ Môn</span>
                </div>
                <h3 style={styles.moduleTitle}>Chấm Thi Di Động Thông Minh (OMR Scanner 2027)</h3>
                <p style={styles.moduleDesc}>
                  Biến điện thoại di động thành máy quét chấm thi trắc nghiệm siêu tốc ngay tại lớp học.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Sử dụng camera quét phiếu trả lời trắc nghiệm chuẩn cấu trúc Bộ GD&ĐT 2025.</li>
                  <li>Tốc độ 1 giây/bài, tự nhận diện mã đề, phát hiện câu tô mờ hoặc tô trùng.</li>
                  <li>Tự động tổng hợp bảng điểm, biểu đồ phổ điểm và xuất file Excel chuẩn.</li>
                </ul>
              </div>

              {/* Module 3.2 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#fef3c7', color: '#b45309' }}>
                    <BookOpen size={22} />
                  </div>
                  <span style={styles.badgeRoleTeacher}>🔒 Yêu cầu: Giáo Viên Bộ Môn</span>
                </div>
                <h3 style={styles.moduleTitle}>Ngân Hàng Câu Hỏi & Đề Thi Chuẩn Bộ 2025</h3>
                <p style={styles.moduleDesc}>
                  Xây dựng kho câu hỏi và ma trận đặc tả theo định hướng năng lực GDPT 2018.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Hỗ trợ đầy đủ 3 dạng thức mới: Nhiều lựa chọn, Đúng/Sai 4 lệnh hỏi, Trả lời ngắn.</li>
                  <li>Tự động trộn đề hoán vị câu hỏi, xuất đề thi Word và đáp án chuẩn thể thức.</li>
                </ul>
              </div>

              {/* Module 3.3 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#ede9fe', color: '#6d28d9' }}>
                    <Cpu size={22} />
                  </div>
                  <span style={styles.badgeRoleTeacher}>🔒 Yêu cầu: Giáo Viên Bộ Môn</span>
                </div>
                <h3 style={styles.moduleTitle}>Soạn Kế Hoạch Bài Dạy Chuẩn Công Văn 5512 AI</h3>
                <p style={styles.moduleDesc}>
                  Trợ lý AI đồng hành giúp giáo viên thiết kế bài học sư phạm nhanh chóng và chuẩn mực.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>AI gợi ý mục tiêu năng lực chung, năng lực đặc thù và phẩm chất học sinh.</li>
                  <li>Thiết kế chuỗi 4 hoạt động học: Khởi động ➔ Hình thành kiến thức ➔ Luyện tập ➔ Vận dụng.</li>
                </ul>
              </div>

              {/* Module 3.4 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#e0f2fe', color: '#0369a1' }}>
                    <FileSpreadsheet size={22} />
                  </div>
                  <span style={styles.badgeRoleTeacher}>🔒 Yêu cầu: GV & Lớp Trưởng</span>
                </div>
                <h3 style={styles.moduleTitle}>Sổ Đầu Bài Điện Tử (E-Class Journal)</h3>
                <p style={styles.moduleDesc}>
                  Thay thế sổ đầu bài giấy truyền thống, cập nhật tiến độ tiết dạy theo thời gian thực.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Ký số tiết dạy, nhập tên bài học, nhận xét tiết học và xếp loại nề nếp.</li>
                  <li>Ban Giám Hiệu theo dõi lịch báo giảng, phát hiện kịp thời tiết trống, dạy bù.</li>
                </ul>
              </div>

              {/* Module 3.5 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#fdf2f8', color: '#be185d' }}>
                    <Gamepad2 size={22} />
                  </div>
                  <span style={styles.badgeRoleTeacher}>🔒 Yêu cầu: Giáo Viên Đứng Lớp</span>
                </div>
                <h3 style={styles.moduleTitle}>Trò Chơi Tương Tác Lớp Học (Interactive Games)</h3>
                <p style={styles.moduleDesc}>
                  Đổi mới phương pháp dạy học, tạo không khí học tập hào hứng trên màn hình máy chiếu/TV.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Vòng quay may mắn gọi tên học sinh ngẫu nhiên tránh thiên vị.</li>
                  <li>Thi đấu trắc nghiệm bấm chuông trả lời, phân hạng bảng điểm trực tiếp.</li>
                </ul>
              </div>

              {/* Module 3.6 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#f0fdf4', color: '#166534' }}>
                    <Award size={22} />
                  </div>
                  <span style={styles.badgeRoleTeacher}>🔒 Yêu cầu: GV Bộ Môn & GVCN</span>
                </div>
                <h3 style={styles.moduleTitle}>Đánh Giá Xếp Loại Chuẩn Thông Tư 22/TT-BGDĐT</h3>
                <p style={styles.moduleDesc}>
                  Quản lý kết quả học tập và rèn luyện học sinh trung học phổ thông.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Đánh giá xếp loại 4 mức: Chưa đạt, Đạt, Khá, Tốt theo quy định hiện hành.</li>
                  <li>AI hỗ trợ gợi ý lời nhận xét học bạ cá nhân hóa theo từng thế mạnh của học sinh.</li>
                </ul>
              </div>

            </div>
          </div>

          {/* ================= PHÂN HỆ 4 ================= */}
          <div style={styles.moduleSectionCard}>
            <div style={styles.moduleSectionHeader}>
              <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px', color: '#b45309' }}>
                <Users size={26} />
              </div>
              <div>
                <span style={{ ...styles.roleBadge, background: '#fefce8', color: '#854d0e', borderColor: '#fde047' }}>
                  PHÂN HỆ TRỌNG TÂM 4
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '19px', color: '#78350f', fontWeight: '800' }}>
                  TIỆN ÍCH DÀNH CHO HỌC SINH & HỌC TẬP SỐ
                </h2>
              </div>
            </div>

            <p style={styles.descText}>
              Không gian số toàn diện phục vụ việc học tập, hướng nghiệp và phát triển toàn diện của các em học sinh Trường THPT Cao Bá Quát.
            </p>

            <div style={styles.moduleGrid}>
              
              {/* Module 4.1 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#fef9c3', color: '#ca8a04' }}>
                    <Users size={22} />
                  </div>
                  <span style={styles.badgeRoleStudent}>🔒 Yêu cầu: Học Sinh Đang Học</span>
                </div>
                <h3 style={styles.moduleTitle}>Cổng Học Sinh Cá Nhân (Student Portal)</h3>
                <p style={styles.moduleDesc}>
                  Trung tâm học tập và theo dõi rèn luyện nề nếp của từng học sinh.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Xem lịch học, thời khóa biểu, lịch trực nhật và điểm danh sự kiện Đoàn trường.</li>
                  <li>Xem báo cáo học tập tuần và xếp hạng thi đua nề nếp của chi đoàn.</li>
                </ul>
              </div>

              {/* Module 4.2 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#e0f2fe', color: '#0284c7' }}>
                    <Compass size={22} />
                  </div>
                  <span style={styles.badgeRoleStudent}>🔒 Học Sinh Khối 9 & Khối 10</span>
                </div>
                <h3 style={styles.moduleTitle}>Tư Vấn Hướng Nghiệp & Tổ Hợp Môn 2+2</h3>
                <p style={styles.moduleDesc}>
                  Hỗ trợ định hướng nghề nghiệp và lựa chọn 4 môn học lựa chọn theo GDPT 2018.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Làm bài trắc nghiệm tính cách sở thích nghề nghiệp Holland (RIASEC).</li>
                  <li>AI phân tích năng lực để đề xuất tổ hợp môn tối ưu cho kỳ thi Đại học.</li>
                </ul>
              </div>

              {/* Module 4.3 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#ede9fe', color: '#7c3aed' }}>
                    <BookOpen size={22} />
                  </div>
                  <span style={styles.badgeRolePublic}>🌐 Học Sinh & Giáo Viên</span>
                </div>
                <h3 style={styles.moduleTitle}>Trạm Video & Kho Học Liệu Số (EduHub)</h3>
                <p style={styles.moduleDesc}>
                  Kho bài giảng số chất lượng cao giúp học sinh tự học mọi lúc mọi nơi.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Tuyển tập video bài giảng minh họa của các thầy cô giáo trong trường.</li>
                  <li>Phân loại khoa học theo từng khối 10, 11, 12 và từng môn học chuyên sâu.</li>
                </ul>
              </div>

              {/* Module 4.4 */}
              <div style={styles.moduleCard}>
                <div style={styles.moduleCardTop}>
                  <div style={{ ...styles.moduleIconBox, background: '#fef3c7', color: '#d97706' }}>
                    <Trophy size={22} />
                  </div>
                  <span style={styles.badgeRolePublic}>🌐 Học Sinh Toàn Trường</span>
                </div>
                <h3 style={styles.moduleTitle}>Thi Trực Tuyến & Cổng Nộp Bài Dự Thi</h3>
                <p style={styles.moduleDesc}>
                  Tham gia các kỳ thi thử trực tuyến, Olympic và cuộc thi sáng tạo KHKT.
                </p>
                <ul style={styles.moduleBulletList}>
                  <li>Làm bài trắc nghiệm có đồng hồ bấm giờ, tự động chấm điểm và xem đáp án.</li>
                  <li>Nộp sản phẩm dự thi sáng tạo, bài viết tập san tri ân thầy cô.</li>
                </ul>
              </div>

            </div>
          </div>

          {/* QUY TRÌNH 3 BƯỚC ĐĂNG NHẬP SỬ DỤNG */}
          <div style={styles.stepWorkflowCard}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#0f172a', fontWeight: '800', textAlign: 'center' }}>
              🚀 QUY TRÌNH 3 BƯỚC ĐỂ BẮT ĐẦU SỬ DỤNG HỆ THỐNG
            </h3>
            <div style={styles.stepGrid}>
              <div style={styles.stepWorkflowBox}>
                <div style={styles.stepNumBadge}>Bước 1</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14.5px', color: '#0f172a' }}>Nhận Tài Khoản Được Cấp</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  Thầy/Cô và học sinh nhận tên đăng nhập và mật khẩu do Nhà trường hoặc GVCN bàn giao.
                </p>
              </div>

              <div style={styles.stepWorkflowBox}>
                <div style={styles.stepNumBadge}>Bước 2</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14.5px', color: '#0f172a' }}>Đăng Nhập Đúng Cổng</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  Bấm chọn đúng Cổng tương ứng (Quản Trị, Giáo Viên hoặc Học Sinh) ở phần trên để xác thực.
                </p>
              </div>

              <div style={styles.stepWorkflowBox}>
                <div style={styles.stepNumBadge}>Bước 3</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14.5px', color: '#0f172a' }}>Sử Dụng Menu Chức Năng</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  Sau khi đăng nhập thành công, thanh Menu cá nhân sẽ tự động mở khóa các tiện ích được phân quyền.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: ĐỒNG HÀNH VÀ ĐÓNG GÓP CÙNG NHÀ TRƯỜNG */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'sponsorship') && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <HeartHandshake size={24} color="#be123c" />
            <h2>ĐỒNG HÀNH & ĐÓNG GÓP TÀI TRỢ CÙNG NHÀ TRƯỜNG</h2>
          </div>
          <p style={styles.descText}>
            Ban Giám Hiệu và Hội đồng trường trân trọng kính mời quý Cơ quan, Doanh nghiệp, các thế hệ Nhà giáo, quý Cha mẹ học sinh và các thế hệ Cựu học sinh cùng chung tay đồng hành, đóng góp nguồn lực để xây dựng cơ sở vật chất, trao học bổng khuyến học và phát triển nhà trường.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', margin: '20px 0' }}>
            <div style={styles.featureBox}>
              <div style={styles.boxIcon}><Award size={22} color="#ca8a04" /></div>
              <h4>Hạng Mục Ủng Hộ & Tài Trợ</h4>
              <ul style={styles.bulletList}>
                <li>Tài trợ kinh phí các hoạt động giáo dục trọng điểm.</li>
                <li>Tài trợ học bổng cho học sinh vượt khó học giỏi.</li>
                <li>Tài trợ hiện vật, phòng máy vi tính, công trình thanh niên.</li>
                <li>Ủng hộ Quỹ Khuyến học & Phát triển Nhà trường.</li>
              </ul>
            </div>

            <div style={styles.featureBox}>
              <div style={styles.boxIcon}><Sparkles size={22} color="#166534" /></div>
              <h4>Quyền Lợi Nhà Tài Trợ & Vinh Danh</h4>
              <ul style={styles.bulletList}>
                <li>Vinh danh tên cá nhân/tập thể trên <strong>Bảng Vàng Kỷ Niệm</strong> tại Cổng thông tin trường.</li>
                <li>In tên trên Kỷ yếu truyền thống và Bảng Vàng lưu danh tại khuôn viên trường.</li>
                <li>Vinh danh và trao thư cảm ơn trực tiếp tại các dịp đại lễ của nhà trường.</li>
              </ul>
            </div>
          </div>

          {/* BANK ACCOUNT CARD */}
          <div style={styles.bankCard}>
            <div style={{ fontWeight: 'bold', color: '#854d0e', fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BuildingBankIcon /> THÔNG TIN TÀI KHOẢN TIẾP NHẬN ĐÓNG GÓP
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', color: '#713f12', fontSize: '14.5px' }}>
              <div><strong>Tên tài khoản:</strong> Trường THPT Cao Bá Quát</div>
              <div><strong>Số tài khoản:</strong> 1234 5678 9999 (Agribank / Vietcombank)</div>
              <div><strong>Ngân hàng:</strong> Chi nhánh Đắk Lắk / Cư M'gar</div>
              <div><strong>Nội dung chuyển khoản:</strong> <code>[Họ tên / Lớp] Ung ho Quy phat trien truong</code></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: QUY CHẾ VÀ HƯỚNG DẪN 02 CUỘC THI CHÍNH THỨC */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'quiz' || activeTab === 'voting') && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <Trophy size={24} color="#be123c" />
            <h2>THỂ LỆ VÀ HƯỚNG DẪN THAM GIA CÁC CUỘC THI TRỰC TUYẾN</h2>
          </div>

          {/* CUỘC THI 1 */}
          <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 'bold', fontSize: '17px', marginBottom: '8px' }}>
              <Award size={22} color="#be123c" /> CUỘC THI: "TỰ HÀO CAO BÁ QUÁT - CHẮP CÁNH ƯỚC MƠ"
            </div>
            <p style={{ fontSize: '14px', color: '#881337', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              <strong>Đối tượng tham gia:</strong> Hợp lệ cho toàn thể Học sinh đang theo học, Cựu học sinh các niên khóa và Cán bộ, Giáo viên, Nhân viên nhà trường.
            </p>

            <div style={styles.stepGrid}>
              <div style={styles.stepCard}>
                <div style={styles.stepBadge}>Bước 1: Khởi Động</div>
                <h4>Đăng Ký Thông Tin</h4>
                <p>Vào mục <strong>Cuộc thi tìm hiểu</strong>. Điền Họ tên, Lớp/Niên khóa và Số điện thoại liên hệ.</p>
              </div>

              <div style={styles.stepCard}>
                <div style={styles.stepBadge}>Bước 2: Vượt Thách Thức</div>
                <h4>30 Câu Trắc Nghiệm (15 Phút)</h4>
                <p>Trả lời 30 câu hỏi trắc nghiệm ôn lại truyền thống vẻ vang và kiến thức chung.</p>
              </div>

              <div style={styles.stepCard}>
                <div style={styles.stepBadge}>Bước 3: Phân Thứ Hạng</div>
                <h4>Dự Đoán Câu Phụ</h4>
                <p>Nhập số lượng thí sinh dự đoán đạt điểm tuyệt đối để xét giải Nhất, Nhì, Ba khi bằng điểm.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: KẾ HOẠCH TỔ CHỨC GIẢI THỂ THAO GIAO LƯU */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'sports') && (
        <div style={{ ...styles.sectionCard, borderLeft: '4px solid #0284c7' }}>
          <div style={styles.sectionHeader}>
            <span style={{ fontSize: '22px' }}>⚽</span>
            <h2 style={{ color: '#0369a1' }}>GIẢI THỂ THAO GIAO LƯU TRUYỀN THỐNG NHÀ TRƯỜNG</h2>
          </div>
          <p style={styles.descText}>
            Giải thể thao phong trào rèn luyện sức khỏe, gắn kết tinh thần đoàn kết giữa các thế hệ thầy cô, học sinh và cựu học sinh.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', margin: '20px 0' }}>
            <div style={{ ...styles.featureBox, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <h4 style={{ color: '#0369a1' }}>🏆 BẢNG A: Giáo Viên & Cựu Học Sinh</h4>
              <ul style={styles.bulletList}>
                <li><strong>Bóng đá Futsal Nam:</strong> 2 hiệp × 20 phút.</li>
                <li><strong>Kéo co Nam Nữ phối hợp:</strong> 5 Nam, 5 Nữ.</li>
                <li><strong>Bóng chuyền hơi Nữ:</strong> Thi đấu vòng tròn tính điểm.</li>
                <li><strong>Pickleball:</strong> Đôi Nam, đôi Nữ, đôi Nam - Nữ.</li>
              </ul>
            </div>

            <div style={{ ...styles.featureBox, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h4 style={{ color: '#166534' }}>🎓 BẢNG B: Học Sinh Đang Học Tại Trường</h4>
              <ul style={styles.bulletList}>
                <li><strong>Bóng chuyền Nam Nữ:</strong> Thi đấu theo đơn vị chi đoàn.</li>
                <li><strong>Cầu lông & Điền kinh:</strong> Đăng ký theo nội dung thi đấu Hội khỏe Phù Đổng.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: THIỆP MỜI ĐIỆN TỬ & SỔ LƯU BÚT */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'invite') && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <Mail size={24} color="#be123c" />
            <h2>THIỆP MỜI ĐIỆN TỬ & SỔ LƯU BÚT TRI ÂN</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            <div style={styles.featureBox}>
              <h4>💌 Trải Nghiệm Thiệp Mời 3D Cá Nhân Hóa</h4>
              <ul style={styles.bulletList}>
                <li>Mở liên kết thiệp mời có mã định danh đại biểu.</li>
                <li>Chuyển đổi linh hoạt giữa các phong cách trình diễn âm nhạc và hiệu ứng hình ảnh.</li>
                <li>Tích hợp chỉ đường Google Maps và nhắc lịch tự động trên điện thoại.</li>
              </ul>
            </div>

            <div style={styles.featureBox}>
              <h4>✍️ Gửi Lời Chúc Lưu Bút Kỷ Niệm</h4>
              <ul style={styles.bulletList}>
                <li>Nhập Họ tên, niên khóa và lời chúc tri ân gửi đến mái trường và thầy cô.</li>
                <li>Lời chúc xuất hiện trôi bồng bềnh công khai trên Tường lưu bút kỷ niệm của trường.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: NỘP BÀI DỰ THI SÁNG TẠO & BÌNH CHỌN */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'voting') && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <Upload size={24} color="#be123c" />
            <h2>NỘP BÀI DỰ THI SÁNG TẠO & BÌNH CHỌN TÁC PHẨM</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            <div style={styles.featureBox}>
              <h4>📤 Nộp Bài Thi Sáng Tạo</h4>
              <ul style={styles.bulletList}>
                <li>Điền thông tin tác giả, tiêu đề bài thi và nội dung mô tả tác phẩm.</li>
                <li>Đính kèm file ảnh kỷ niệm, video clip hoặc bài viết tập san tri ân.</li>
                <li>Bài dự thi sau khi kiểm duyệt sẽ xuất hiện công khai tại Cổng bình chọn.</li>
              </ul>
            </div>

            <div style={styles.featureBox}>
              <h4>🗳️ Bình Chọn Tác Phẩm Ấn Tượng</h4>
              <ul style={styles.bulletList}>
                <li>Khán giả và học sinh toàn trường tham gia thả tim bình chọn tác phẩm yêu thích.</li>
                <li>Thống kê số lượt bình chọn được cập nhật trực tiếp theo thời gian thực.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER HELP CARD */}
      <div style={styles.footerHelp}>
        <HelpCircle size={28} color="#be123c" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#881337', fontSize: '16px' }}>CẦN HỖ TRỢ KỸ THUẬT VÀ CẤP TÀI KHOẢN?</h4>
          <p style={{ margin: 0, color: '#475569', fontSize: '13.5px', lineHeight: 1.5 }}>
            Quý Thầy/Cô, phụ huynh và các em học sinh có vướng mắc về tài khoản hoặc quy trình đăng nhập, xin vui lòng liên hệ Tổ Quản Trị Hệ Thống Số Trường THPT Cao Bá Quát hoặc liên hệ trực tiếp Văn phòng nhà trường để được hỗ trợ kịp thời.
          </p>
        </div>
      </div>
    </div>
  );
}

function BuildingBankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
    </svg>
  );
}

const styles = {
  container: {
    maxWidth: '1160px',
    margin: '0 auto',
    padding: '20px 15px 50px 15px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    overflowX: 'hidden'
  },
  headerCard: {
    background: 'linear-gradient(135deg, #be123c 0%, #881337 100%)',
    color: '#ffffff',
    padding: '24px 28px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(190,18,60,0.2)',
    marginBottom: '20px'
  },
  badge: {
    background: '#fde047',
    color: '#854d0e',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '3px 10px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: '8px 0 4px 0',
    color: '#fde047',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
  },
  subtitle: {
    fontSize: '13.5px',
    color: '#f8fafc',
    margin: 0,
    opacity: 0.95
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '10px',
    marginBottom: '22px'
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  tabBtnActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '20px',
    border: 'none',
    background: '#be123c',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(190,18,60,0.25)'
  },
  tabBtnActiveHighlight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
  },

  // SECURITY BANNER
  securityBanner: {
    background: '#eff6ff',
    border: '1.5px solid #bfdbfe',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '25px',
    boxShadow: '0 4px 15px rgba(37,99,235,0.06)'
  },
  securityIconCircle: {
    background: '#2563eb',
    padding: '10px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  loginGatewaysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
    gap: '12px',
    marginTop: '18px'
  },
  loginGateCard: {
    background: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
  },
  loginGateBtn: {
    padding: '6px 12px',
    background: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },

  // MODULE SECTIONS
  moduleSectionCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px 26px',
    marginBottom: '25px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
  },
  moduleSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '14px',
    marginBottom: '14px'
  },
  roleBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  moduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    gap: '16px',
    marginTop: '16px'
  },
  moduleCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.2s'
  },
  moduleCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '6px'
  },
  moduleIconBox: {
    padding: '8px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeRoleAdmin: {
    fontSize: '11px',
    fontWeight: 'bold',
    background: '#fee2e2',
    color: '#991b1b',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #fca5a5'
  },
  badgeRoleTeacher: {
    fontSize: '11px',
    fontWeight: 'bold',
    background: '#dbeafe',
    color: '#1e40af',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #93c5fd'
  },
  badgeRoleStudent: {
    fontSize: '11px',
    fontWeight: 'bold',
    background: '#fef9c3',
    color: '#854d0e',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #fde047'
  },
  badgeRolePublic: {
    fontSize: '11px',
    fontWeight: 'bold',
    background: '#dcfce7',
    color: '#166534',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #86efac'
  },
  moduleTitle: {
    margin: '0 0 6px 0',
    fontSize: '15.5px',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 1.35
  },
  moduleDesc: {
    margin: '0 0 10px 0',
    fontSize: '13px',
    color: '#475569',
    lineHeight: 1.5
  },
  moduleBulletList: {
    margin: 'auto 0 0 0',
    paddingLeft: '16px',
    fontSize: '12.5px',
    color: '#334155',
    lineHeight: 1.6
  },

  // WORKFLOW STEPS
  stepWorkflowCard: {
    background: '#ffffff',
    border: '1.5px dashed #94a3b8',
    borderRadius: '16px',
    padding: '22px 24px',
    marginTop: '25px'
  },
  stepWorkflowBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center'
  },
  stepNumBadge: {
    display: 'inline-block',
    background: '#0f172a',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 10px',
    borderRadius: '10px',
    marginBottom: '8px'
  },

  // GENERAL SECTIONS
  sectionCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px 28px',
    marginBottom: '25px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '12px',
    marginBottom: '14px'
  },
  descText: {
    color: '#334155',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 15px 0'
  },
  featureBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px 18px'
  },
  boxIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    marginBottom: '10px'
  },
  bulletList: {
    margin: '8px 0 0 0',
    paddingLeft: '18px',
    fontSize: '13.5px',
    color: '#334155',
    lineHeight: '1.7'
  },
  bankCard: {
    background: '#fefce8',
    border: '2px dashed #ca8a04',
    borderRadius: '14px',
    padding: '18px 22px',
    marginTop: '15px'
  },
  stepGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
    gap: '15px',
    margin: '15px 0'
  },
  stepCard: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: '14px',
    padding: '18px',
    position: 'relative'
  },
  stepBadge: {
    background: '#be123c',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    display: 'inline-block',
    marginBottom: '8px'
  },
  footerHelp: {
    background: '#fff1f2',
    border: '1px solid #ffe4e6',
    borderRadius: '14px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }
};
