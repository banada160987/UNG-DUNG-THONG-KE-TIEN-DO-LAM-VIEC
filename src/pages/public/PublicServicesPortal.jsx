import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  FileBadge, Search, CheckCircle2, Clock, AlertCircle, ArrowRight,
  Printer, Download, ShieldCheck, Phone, User, Calendar, MessageSquare,
  QrCode, ExternalLink, RefreshCw, Send, Check, ArrowLeft, HeartHandshake,
  FileText, GraduationCap, ArrowRightLeft, Sparkles, Building2
} from 'lucide-react';
import { 
  PUBLIC_PROCEDURES, 
  getAllPublicServices, 
  searchPublicServices, 
  submitPublicService 
} from '../../services/publicService';
import { openZaloOa } from '../../services/facebookService';
import PublicServicesPrintModal from '../../components/PublicServicesPrintModal';

export default function PublicServicesPortal() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [activeTab, setActiveTab] = useState(initialCode ? 'track' : 'apply'); // 'apply' | 'track' | 'zalo'
  const [selectedProcedure, setSelectedProcedure] = useState('xac_nhan_hoc_sinh');

  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [studentClass, setStudentClass] = useState('12A1');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Nam');
  const [identityCard, setIdentityCard] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [reason, setReason] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('digital_pdf');
  const [submitting, setSubmitting] = useState(false);
  const [submittedService, setSubmittedService] = useState(null);

  // Tracking states
  const [trackQuery, setTrackQuery] = useState(initialCode);
  const [trackingResults, setTrackingResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal print
  const [printingService, setPrintingService] = useState(null);

  const availableClasses = [
    '10A1', '10A2', '10A3', '10A4', '10A5', '10A6', '10A7', '10A8', '10A9', '10A10', '10A11',
    '11A1', '11A2', '11A3', '11A4', '11A5', '11A6', '11A7', '11A8', '11A9', '11A10', '11A11',
    '12A1', '12A2', '12A3', '12A4', '12A5', '12A6', '12A7', '12A8', '12A9', '12A10', '12A11', '12A12'
  ];

  // Tự động tìm kiếm nếu có mã code trên URL
  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  // Xử lý nộp hồ sơ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert("Vui lòng nhập Họ và Tên học sinh!");
      return;
    }
    if (!parentName.trim()) {
      alert("Vui lòng nhập Họ và Tên phụ huynh/người nộp!");
      return;
    }
    if (!parentPhone.trim()) {
      alert("Vui lòng nhập Số điện thoại liên hệ/Zalo của phụ huynh!");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitPublicService({
        procedureType: selectedProcedure,
        studentName,
        studentCode,
        studentClass,
        birthDate,
        gender,
        identityCard,
        parentName,
        parentPhone,
        parentEmail,
        reason: reason || 'Bổ sung thủ tục hành chính phục vụ học sinh.',
        deliveryMethod
      });

      setSubmittedService(result);
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại!");
      setSubmitting(false);
    }
  };

  // Xử lý tra cứu
  const handleSearch = async (queryToSearch) => {
    const q = queryToSearch !== undefined ? queryToSearch : trackQuery;
    if (!q || !q.trim()) {
      alert("Vui lòng nhập Mã hồ sơ (VD: CBQ-DVC-...), Số CCCD hoặc Số điện thoại để tra cứu!");
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const res = await searchPublicServices(q);
      setTrackingResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const getProcedureMeta = (id) => {
    return PUBLIC_PROCEDURES.find(p => p.id === id) || PUBLIC_PROCEDURES[0];
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: '"Inter", sans-serif', color: '#0f172a' }}>
      
      {/* 1. TOP NAV BAR */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpg" alt="Logo CBQ" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                TRƯỜNG THPT CAO BÁ QUÁT
              </div>
              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700' }}>
                CỔNG DỊCH VỤ CÔNG TRỰC TUYẾN 4.0
              </div>
            </div>
          </Link>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link 
              to="/" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#64748b', textDecoration: 'none', fontWeight: '600' }}
            >
              <ArrowLeft size={15} /> Trang chủ
            </Link>

            <button
              onClick={openZaloOa}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#0068ff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <MessageSquare size={14} /> Zalo OA Trường
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0c4a6e 100%)',
        color: '#ffffff',
        padding: '36px 16px 48px 16px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#bae6fd', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px' }}>
            <ShieldCheck size={14} color="#38bdf8" /> CHUYỂN ĐỔI SỐ NGÀNH GIÁO DỤC • CHUẨN ĐỀ ÁN 06
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '0.2px' }}>
            CỔNG DỊCH VỤ CÔNG TRỰC TUYẾN DÀNH CHO PHỤ HUYNH & HỌC SINH
          </h1>
          <p style={{ fontSize: '14px', color: '#e0f2fe', margin: '0 0 24px 0', lineHeight: '1.6' }}>
            Nộp hồ sơ xin giấy xác nhận học sinh, sao y học bạ, đơn nghỉ phép điện tử 24/7. Trả kết quả file điện tử có ký số xác thực hoặc bản in trực tiếp tại trường.
          </p>

          {/* Quick Nav Tabs */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '4px',
            backdropFilter: 'blur(8px)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              style={{
                padding: '10px 22px',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === 'apply' ? '#ffffff' : 'transparent',
                color: activeTab === 'apply' ? '#0369a1' : '#ffffff',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'apply' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              <Send size={15} /> 1. Nộp Hồ Sơ Trực Tuyến
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('track')}
              style={{
                padding: '10px 22px',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === 'track' ? '#ffffff' : 'transparent',
                color: activeTab === 'track' ? '#0369a1' : '#ffffff',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'track' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              <Search size={15} /> 2. Tra Cứu Tiến Độ Hồ Sơ
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('zalo')}
              style={{
                padding: '10px 22px',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === 'zalo' ? '#ffffff' : 'transparent',
                color: activeTab === 'zalo' ? '#0369a1' : '#ffffff',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'zalo' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              <QrCode size={15} /> 3. Kết Nối Zalo OA
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main style={{ maxWidth: '1000px', margin: '-24px auto 60px auto', padding: '0 16px' }}>

        {/* ==================== TAB 1: NỘP HỒ SƠ ==================== */}
        {activeTab === 'apply' && (
          <div>
            {submittedService ? (
              /* Success Screen */
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #bbf7d0', padding: '32px 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <CheckCircle2 size={36} />
                </div>
                
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#166534', margin: '0 0 8px 0' }}>
                  NỘP HỒ SƠ DỊCH VỤ CÔNG THÀNH CÔNG!
                </h2>
                
                <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 20px 0' }}>
                  Hệ thống Nhà trường đã tiếp nhận yêu cầu <strong>{submittedService.procedureTitle}</strong> của học sinh <strong>{submittedService.studentName}</strong> (Lớp {submittedService.studentClass}).
                </p>

                <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', border: '2px dashed #86efac', borderRadius: '12px', padding: '16px 28px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>MÃ TRA CỨU HỒ SƠ CỦA BẠN:</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d', letterSpacing: '1px', marginTop: '4px' }}>
                    {submittedService.code}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                    (Hãy lưu lại mã này hoặc số điện thoại để tra cứu tiến độ xử lý)
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackQuery(submittedService.code);
                      setActiveTab('track');
                      handleSearch(submittedService.code);
                    }}
                    style={{
                      padding: '10px 22px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Search size={16} /> Tra Cứu Tiến Độ Ngay
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedService(null);
                      setStudentName('');
                      setReason('');
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Nộp Hồ Sơ Khác
                  </button>
                </div>
              </div>
            ) : (
              /* Submission Form */
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                
                {/* 1. Chọn thủ tục */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                    BƯỚC 1: CHỌN THỦ TỤC HÀNH CHÍNH CẦN GIẢI QUYẾT:
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
                    {PUBLIC_PROCEDURES.map(proc => {
                      const isSelected = selectedProcedure === proc.id;
                      return (
                        <div
                          key={proc.id}
                          onClick={() => setSelectedProcedure(proc.id)}
                          style={{
                            border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                            borderRadius: '12px',
                            padding: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '10.5px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', backgroundColor: proc.badgeColor, color: '#ffffff' }}>
                                {proc.badge}
                              </span>
                              {isSelected && <CheckCircle2 size={18} color="#0284c7" />}
                            </div>
                            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                              {proc.title}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                              {proc.description}
                            </div>
                          </div>

                          <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Thời gian xử lý: {proc.processingTime}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Biểu mẫu điền thông tin */}
                <form onSubmit={handleSubmit}>
                  <label style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', display: 'block', marginBottom: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
                    BƯỚC 2: ĐIỀN THÔNG TIN HỌC SINH & PHỤ HUYNH LIÊN HỆ:
                  </label>

                  {/* Thông tin học sinh */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#0369a1', marginBottom: '10px' }}>
                      👨‍🎓 THÔNG TIN HỌC SINH
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Họ và Tên Học Sinh (*):
                        </label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={e => setStudentName(e.target.value)}
                          placeholder="VD: Nguyễn Văn An"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Lớp Học Hiện Tại (*):
                        </label>
                        <select
                          value={studentClass}
                          onChange={e => setStudentClass(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          {availableClasses.map(cls => (
                            <option key={cls} value={cls}>Lớp {cls}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Giới Tính:
                        </label>
                        <select
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Ngày Sinh:
                        </label>
                        <input
                          type="text"
                          value={birthDate}
                          onChange={e => setBirthDate(e.target.value)}
                          placeholder="DD/MM/YYYY (VD: 15/03/2008)"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Số Căn Cước Công Dân (12 số):
                        </label>
                        <input
                          type="text"
                          maxLength={12}
                          value={identityCard}
                          onChange={e => setIdentityCard(e.target.value)}
                          placeholder="001208xxxxxx"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Mã Học Sinh (nếu nhớ):
                        </label>
                        <input
                          type="text"
                          value={studentCode}
                          onChange={e => setStudentCode(e.target.value)}
                          placeholder="HS-12A1-xx"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Thông tin phụ huynh */}
                  <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '18px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#166534', marginBottom: '10px' }}>
                      👨‍👩‍👧 THÔNG TIN PHỤ HUYNH / NGƯỜI ĐẠI DIỆN NỘP HỒ SƠ
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#14532d', display: 'block', marginBottom: '4px' }}>
                          Họ và Tên Phụ Huynh (*):
                        </label>
                        <input
                          type="text"
                          required
                          value={parentName}
                          onChange={e => setParentName(e.target.value)}
                          placeholder="VD: Nguyễn Văn Bình"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#14532d', display: 'block', marginBottom: '4px' }}>
                          Số Điện Thoại / Zalo (*):
                        </label>
                        <input
                          type="tel"
                          required
                          value={parentPhone}
                          onChange={e => setParentPhone(e.target.value)}
                          placeholder="0912.xxx.xxx"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#14532d', display: 'block', marginBottom: '4px' }}>
                          Email (để nhận kết quả file điện tử):
                        </label>
                        <input
                          type="email"
                          value={parentEmail}
                          onChange={e => setParentEmail(e.target.value)}
                          placeholder="phuhuynh@gmail.com"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mục đích & Hình thức nhận */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Mục đích / Lý do xin giấy tờ (*):
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="VD: Làm thủ tục cấp đổi Căn cước công dân gắn chip tại Công an huyện Quốc Oai / Xin nghỉ ốm 02 ngày điều trị sốt xuất huyết..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Hình thức nhận kết quả:
                    </label>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="digital_pdf"
                          checked={deliveryMethod === 'digital_pdf'}
                          onChange={e => setDeliveryMethod(e.target.value)}
                        />
                        📄 Nhận File PDF có chữ ký số & mộc đỏ (Tải ngay trên điện thoại)
                      </label>

                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="hard_copy_at_school"
                          checked={deliveryMethod === 'hard_copy_at_school'}
                          onChange={e => setDeliveryMethod(e.target.value)}
                        />
                        🏫 Nhận bản in dấu đỏ trực tiếp tại Phòng Văn thư Nhà trường
                      </label>
                    </div>
                  </div>

                  {/* Nút Submit */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '12px 36px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                      {submitting ? 'Đang gửi hồ sơ...' : 'NỘP HỒ SƠ DỊCH VỤ CÔNG NGAY'}
                    </button>
                  </div>
                </form>

              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: TRA CỨU TIẾN ĐỘ ==================== */}
        {activeTab === 'track' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>
              TRA CỨU TIẾN ĐỘ XỬ LÝ HỒ SƠ DỊCH VỤ CÔNG
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
              Nhập Mã hồ sơ (ví dụ: <code style={{ color: '#0284c7' }}>CBQ-DVC-2026-0182</code>), Số Căn cước công dân hoặc Số điện thoại để kiểm tra trạng thái xử lý:
            </p>

            {/* Search Input Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  value={trackQuery}
                  onChange={e => setTrackQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Nhập mã hồ sơ, số CCCD, họ tên hoặc SĐT..."
                  style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: '8px', border: '1.5px solid #0284c7', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <Search size={18} color="#0284c7" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              </div>

              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={searching}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                Tra Cứu
              </button>
            </div>

            {/* Results Display */}
            {hasSearched && (
              <div>
                {trackingResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                    <AlertCircle size={36} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#475569' }}>
                      Không tìm thấy hồ sơ nào khớp với từ khóa &quot;{trackQuery}&quot;
                    </div>
                    <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Vui lòng kiểm tra lại mã hồ sơ hoặc liên hệ Văn thư nhà trường: <strong>024.3384.xxxx</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {trackingResults.map(item => {
                      const isApproved = item.status === 'approved';
                      const isRejected = item.status === 'rejected';

                      return (
                        <div
                          key={item.id}
                          style={{
                            border: isApproved ? '1.5px solid #86efac' : isRejected ? '1.5px solid #fca5a5' : '1px solid #cbd5e1',
                            borderRadius: '12px',
                            padding: '18px',
                            backgroundColor: isApproved ? '#f0fdf4' : isRejected ? '#fef2f2' : '#ffffff'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>MÃ HỒ SƠ:</span>
                              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0369a1' }}>
                                #{item.code}
                              </div>
                            </div>

                            <div>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#eab308',
                                color: '#ffffff'
                              }}>
                                {isApproved ? '✅ ĐÃ PHÊ DUYỆT & CẤP MỘC SỐ' : isRejected ? '❌ TỪ CHỐI / CẦN BỔ SUNG' : '⏳ ĐANG THẨM ĐỊNH HỒ SƠ'}
                              </span>
                            </div>
                          </div>

                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                            {item.procedureTitle}
                          </div>

                          <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '12px', lineHeight: '1.6' }}>
                            Học sinh: <strong>{item.studentName}</strong> (Lớp {item.studentClass}) • CCCD: <strong>{item.identityCard || '---'}</strong><br />
                            Phụ huynh: <strong>{item.parentName}</strong> ({item.parentPhone})<br />
                            Lý do: <em>{item.reason}</em>
                          </div>

                          {/* Stepper tiến độ */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: '#15803d' }}>
                              <CheckCircle2 size={14} color="#16a34a" /> 1. Tiếp nhận
                            </div>
                            <span style={{ color: '#94a3b8' }}>→</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: isApproved ? '#15803d' : '#0284c7' }}>
                              <CheckCircle2 size={14} color={isApproved ? '#16a34a' : '#0284c7'} /> 2. Thẩm định
                            </div>
                            <span style={{ color: '#94a3b8' }}>→</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: isApproved ? '#15803d' : '#64748b' }}>
                              <CheckCircle2 size={14} color={isApproved ? '#16a34a' : '#94a3b8'} /> 3. Ký số & Đóng dấu
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {isApproved && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setPrintingService(item)}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12.5px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <Printer size={15} /> Xem & In Giấy Xác Nhận Điện Tử (A4)
                              </button>

                              <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>
                                Mã mộc số: <code>{item.digitalCertificateCode}</code>
                              </span>
                            </div>
                          )}

                          {isRejected && (
                            <div style={{ fontSize: '12.5px', color: '#b91c1c', marginTop: '6px' }}>
                              <strong>Lý do từ chối:</strong> {item.rejectionReason || 'Vui lòng liên hệ Văn thư để bổ sung giấy tờ cần thiết.'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: KẾT NỐI ZALO OA ==================== */}
        {activeTab === 'zalo' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <img src="/logo.jpg" alt="Logo CBQ" style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 12px auto', border: '2px solid #0068ff' }} />
            
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
              ZALO OFFICIAL ACCOUNT (OA) • TRƯỜNG THPT CAO BÁ QUÁT
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '600px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
              Kênh tương tác và dịch vụ công chính thức của trường. Nhận thông báo an toàn học sinh, kết quả học tập và nộp hồ sơ trực tuyến không cần cài đặt thêm ứng dụng nào khác!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px', maxWidth: '750px', margin: '0 auto 28px auto', textAlign: 'left' }}>
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1d4ed8', marginBottom: '6px' }}>
                  1. QUÉT MÃ QR HOẶC BẤM QUAN TÂM
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.5' }}>
                  Mở ứng dụng Zalo trên điện thoại, quét mã QR chính thức của trường THPT Cao Bá Quát và nhấn <strong>&quot;Quan tâm&quot;</strong>.
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#15803d', marginBottom: '6px' }}>
                  2. NHẬN KẾT QUẢ DVC TỰ ĐỘNG
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.5' }}>
                  Mọi thông báo duyệt hồ sơ, mã xác nhận điện tử và giấy phép nghỉ học sẽ tự động được gửi thẳng vào Zalo của phụ huynh.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={openZaloOa}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#0068ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 104, 255, 0.3)'
                }}
              >
                <MessageSquare size={18} /> Mở Zalo OA THPT Cao Bá Quát Ngay ↗
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 4. MODAL IN GIẤY XÁC NHẬN */}
      {printingService && (
        <PublicServicesPrintModal
          service={printingService}
          onClose={() => setPrintingService(null)}
        />
      )}

    </div>
  );
}
