// =========================================================================
// TRANG CÔNG KHAI: TRA CỨU & XÁC THỰC MINH BẠCH KINH PHÍ "CHẮP CÁNH ƯỚC MƠ"
// BẢO VỆ DANH DỰ HỌC SINH & CHỐNG GIẢ MẠO HỒ SƠ TỪ THIỆN
// Người tài trợ hoặc cộng đồng quét mã QR trên biên bản NĐ30 sẽ dẫn trực tiếp tới đây
// =========================================================================

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, Search, CheckCircle2, AlertCircle, FileText, 
  Home, ChevronRight, Award, Calendar, DollarSign, UserCheck, 
  ExternalLink, QrCode, Lock, Heart, Check, Building
} from 'lucide-react';
import { verifyDisbursementCode } from '../services/scholarshipFundService';

export default function PublicScholarshipVerification() {
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get('code') || '';
  
  const [inputCode, setInputCode] = useState(urlCode);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    if (urlCode) {
      handleSearch(urlCode);
    }
  }, [urlCode]);

  const handleSearch = async (codeToVerify) => {
    const code = (codeToVerify || inputCode).trim().toUpperCase();
    if (!code) return;
    
    setLoading(true);
    setVerificationResult(null);
    try {
      const res = await verifyDisbursementCode(code);
      setVerificationResult(res);
    } catch {
      setVerificationResult({
        valid: false,
        message: 'Lỗi kết nối tới máy chủ lưu trữ sổ cái xác thực.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(inputCode);
  };

  return (
    <div style={styles.pageWrap}>
      {/* BREADCRUMB */}
      <div style={styles.breadcrumbBar}>
        <div style={styles.container}>
          <div style={styles.breadcrumb}>
            <Link to="/" style={styles.breadLink}><Home size={14} /> Trang chủ</Link>
            <ChevronRight size={14} color="#94a3b8" />
            <Link to="/chap-canh-uoc-mo" style={styles.breadLink}>🕊️ Quỹ "Chắp Cánh Ước Mơ"</Link>
            <ChevronRight size={14} color="#94a3b8" />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Tra Cứu & Xác Thực Minh Bạch Số</span>
          </div>
        </div>
      </div>

      {/* HEADER HERO BANNER */}
      <div style={styles.heroBanner}>
        <div style={styles.container}>
          <div style={styles.badgeTop}>
            <ShieldCheck size={16} color="#34d399" />
            <span>SỔ CÁI MINH BẠCH & CHỐNG GIẢ MẠO TỪ THIỆN</span>
          </div>
          <h1 style={styles.heroTitle}>CỔNG XÁC THỰC KINH PHÍ TÀI TRỢ HỌC BỔNG</h1>
          <p style={styles.heroSubtitle}>
            Hệ thống xác thực số hóa do Trường THPT Cao Bá Quát vận hành, bảo đảm 100% dòng tiền tài trợ của Mạnh Thường Quân được trao tận tay học sinh theo đúng quy định Nghị định 30/2020/NĐ-CP.
          </p>

          {/* THANH TÌM KIẾM MÃ XÁC THỰC */}
          <form onSubmit={handleSubmit} style={styles.searchBox}>
            <div style={styles.searchInputWrap}>
              <Search size={20} color="#64748b" />
              <input 
                type="text"
                placeholder="Nhập Mã xác thực (Ví dụ: CBQ-UOCMO-2026-X8F9A)..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button type="submit" disabled={loading} style={styles.searchBtn}>
              {loading ? 'Đang xác thực...' : 'Kiểm Tra Ngay'}
            </button>
          </form>
        </div>
      </div>

      {/* NỘI DUNG KẾT QUẢ XÁC THỰC */}
      <div style={styles.container}>
        <div style={styles.contentWrap}>
          {/* NẾU CÓ KẾT QUẢ HỢP LỆ */}
          {verificationResult && verificationResult.valid && verificationResult.data && (
            <div style={styles.certificateCard}>
              <div style={styles.certHeader}>
                <div style={styles.sealBadge}>
                  <CheckCircle2 size={24} color="#ffffff" />
                  <span>XÁC THỰC MỘC ĐỎ NHÀ TRƯỜNG</span>
                </div>
                <div style={styles.certDate}>
                  Ngày tra cứu: {new Date().toLocaleDateString('vi-VN')}
                </div>
              </div>

              <div style={styles.certBody}>
                <div style={styles.schoolTitle}>
                  TRƯỜNG THPT CAO BÁ QUÁT - GIA LÂM
                </div>
                <div style={styles.certHeading}>
                  CHỨNG THƯ XÁC THỰC KINH PHÍ BẢO TRỢ HỌC SINH
                </div>
                <div style={styles.certCode}>
                  MÃ BĂM SỐ HÓA: <code>{verificationResult.data.verification_code}</code>
                </div>

                <p style={styles.certDesc}>
                  Ban Giám Hiệu Trường THPT Cao Bá Quát xác nhận: Khoản kinh phí bảo trợ dưới đây đã được 
                  tiếp nhận và bàn giao tận tay học sinh có hoàn cảnh khó khăn, lưu trữ đầy đủ hồ sơ, biên bản 
                  bàn giao và ảnh thực tế theo quy định:
                </p>

                {/* THÔNG TIN CHI TIẾT */}
                <div style={styles.gridDetails}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Học sinh thụ hưởng (Bảo mật tên):</div>
                    <div style={styles.detailValHighlight}>
                      {verificationResult.data.student_masked_name} (Lớp {verificationResult.data.student_class})
                    </div>
                  </div>

                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Số kinh phí trao tận tay:</div>
                    <div style={styles.detailValMoney}>
                      {Number(verificationResult.data.disbursed_amount).toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>

                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Thời gian trao học bổng:</div>
                    <div style={styles.detailVal}>
                      {verificationResult.data.disbursed_date}
                    </div>
                  </div>

                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Đợt học bổng:</div>
                    <div style={styles.detailVal}>
                      {verificationResult.data.term_name}
                    </div>
                  </div>

                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Nhà tài trợ / Mạnh Thường Quân:</div>
                    <div style={styles.detailVal}>
                      {verificationResult.data.sponsor_masked_name}
                    </div>
                  </div>

                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Đại diện nhà trường bàn giao:</div>
                    <div style={styles.detailVal}>
                      {verificationResult.data.handover_officer}
                    </div>
                  </div>

                  <div style={{ ...styles.detailItem, gridColumn: '1 / -1' }}>
                    <div style={styles.detailLabel}>Mục đích & Nội dung hỗ trợ:</div>
                    <div style={styles.detailVal}>
                      {verificationResult.data.purpose}
                    </div>
                  </div>
                </div>

                {/* DẤU MỘC & CAM KẾT */}
                <div style={styles.certFooter}>
                  <div style={styles.noticePrivacy}>
                    <Lock size={15} color="#059669" />
                    <span>Họ tên học sinh được viết tắt theo đúng quy tắc sư phạm nhằm bảo vệ sự tự tôn của học sinh nghèo.</span>
                  </div>

                  <div style={styles.sealStamp}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                      BAN GIÁM HIỆU THPT CAO BÁ QUÁT
                    </div>
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                      ✓ ĐÃ XÁC THỰC MÃ BĂM SỐ HÓA
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NẾU MÃ KHÔNG HỢP LỆ */}
          {verificationResult && !verificationResult.valid && (
            <div style={styles.errorCard}>
              <AlertCircle size={40} color="#dc2626" />
              <h3 style={{ margin: '12px 0 6px 0', color: '#991b1b', fontSize: '18px' }}>
                Không Tìm Thấy Thông Tin Xác Thực
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6, maxWidth: '560px' }}>
                {verificationResult.message}
              </p>
              <div style={{ marginTop: '16px', fontSize: '13px', color: '#94a3b8' }}>
                Quý vị vui lòng đối chiếu lại mã trên Biên bản bàn giao hoặc liên hệ Hotline: <strong>024.3827.1856</strong>.
              </div>
            </div>
          )}

          {/* KHUNG GIẢI THÍCH NGUYÊN TẮC MINH BẠCH */}
          <div style={styles.policyGrid}>
            <div style={styles.policyCard}>
              <div style={styles.policyIconCircle}><ShieldCheck size={22} color="#059669" /></div>
              <h4 style={styles.policyTitle}>Biên Bản Chuẩn Nghị Định 30</h4>
              <p style={styles.policyDesc}>
                Tất cả các đợt giải ngân đều có biên bản giao nhận có chữ ký học sinh, phụ huynh và đại diện Ban Giám Hiệu.
              </p>
            </div>

            <div style={styles.policyCard}>
              <div style={styles.policyIconCircle}><Lock size={22} color="#2563eb" /></div>
              <h4 style={styles.policyTitle}>Bảo Vệ Danh Dự Học Sinh</h4>
              <p style={styles.policyDesc}>
                Thông tin học sinh chỉ công khai dạng viết tắt để tránh sự tò mò ngoài xã hội, nhưng mạnh thường quân có tài khoản bảo trợ xem đầy đủ tiến bộ.
              </p>
            </div>

            <div style={styles.policyCard}>
              <div style={styles.policyIconCircle}><Award size={22} color="#f59e0b" /></div>
              <h4 style={styles.policyTitle}>Chống Giả Mạo Tuyệt Đối</h4>
              <p style={styles.policyDesc}>
                Mỗi biên bản có mã băm duy nhất gắn với cơ sở dữ liệu nội bộ nhà trường, loại bỏ hoàn toàn nguy cơ lập khống hồ sơ từ thiện.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  breadcrumbBar: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '12px 0'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748b'
  },
  breadLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #091e3a 0%, #1e3a8a 60%, #065f46 100%)',
    color: '#ffffff',
    padding: '48px 0 54px 0',
    textAlign: 'center'
  },
  badgeTop: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    marginBottom: '16px'
  },
  heroTitle: {
    margin: '0 0 12px 0',
    fontSize: '30px',
    fontWeight: 900,
    letterSpacing: '-0.5px'
  },
  heroSubtitle: {
    margin: '0 auto 30px auto',
    maxWidth: '750px',
    fontSize: '15px',
    color: '#e2e8f0',
    lineHeight: 1.6
  },
  searchBox: {
    maxWidth: '680px',
    margin: '0 auto',
    display: 'flex',
    gap: '10px',
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '8px',
    borderRadius: '14px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
  },
  searchInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    paddingLeft: '12px'
  },
  searchInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: '#0f172a',
    background: 'transparent',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  searchBtn: {
    padding: '12px 24px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  contentWrap: {
    margin: '36px 0 60px 0'
  },
  certificateCard: {
    background: '#ffffff',
    border: '2px solid #059669',
    borderRadius: '16px',
    boxShadow: '0 12px 30px -5px rgba(5, 150, 105, 0.12)',
    overflow: 'hidden',
    marginBottom: '40px'
  },
  certHeader: {
    background: '#065f46',
    color: '#ffffff',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px'
  },
  sealBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 800,
    letterSpacing: '0.5px'
  },
  certDate: {
    fontSize: '12px',
    color: '#a7f3d0'
  },
  certBody: {
    padding: '36px 32px'
  },
  schoolTitle: {
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '1px'
  },
  certHeading: {
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: 900,
    color: '#0f172a',
    margin: '6px 0 10px 0'
  },
  certCode: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#2563eb',
    fontWeight: 700,
    marginBottom: '20px'
  },
  certDesc: {
    fontSize: '14.5px',
    color: '#334155',
    lineHeight: 1.7,
    textAlign: 'center',
    maxWidth: '750px',
    margin: '0 auto 28px auto'
  },
  gridDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '28px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b'
  },
  detailVal: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e293b'
  },
  detailValHighlight: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1e40af'
  },
  detailValMoney: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#059669'
  },
  certFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px dashed #cbd5e1',
    paddingTop: '20px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  noticePrivacy: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: '#047857',
    background: '#ecfdf5',
    padding: '8px 12px',
    borderRadius: '8px',
    maxWidth: '480px'
  },
  sealStamp: {
    border: '2px solid #dc2626',
    borderRadius: '8px',
    padding: '8px 16px',
    textAlign: 'center',
    background: '#fff1f2'
  },
  errorCard: {
    background: '#ffffff',
    border: '1px solid #fecaca',
    borderRadius: '16px',
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '40px'
  },
  policyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  policyCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '24px'
  },
  policyIconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px'
  },
  policyTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a'
  },
  policyDesc: {
    margin: 0,
    fontSize: '13.5px',
    color: '#64748b',
    lineHeight: 1.6
  }
};
