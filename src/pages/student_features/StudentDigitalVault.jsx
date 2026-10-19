import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, FileBadge, QrCode, Download, ShieldCheck, AlertTriangle, 
  HardDrive, ExternalLink, Search, CheckCircle2, Award, Printer, 
  Calendar, User, Lock, Sparkles, LogOut, Info, BookOpen
} from 'lucide-react';
import { parseDocContent } from '../../services/googleDriveService';

export default function StudentDigitalVault() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lookup'); // 'lookup' | 'vault'
  const [student, setStudent] = useState(null);
  
  // State for Personal Vault
  const [vaultDocuments, setVaultDocuments] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);

  // State for Public Lookup
  const [lookupCode, setLookupCode] = useState('');
  const [lookupName, setLookupName] = useState('');
  const [lookupClass, setLookupClass] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    try {
      const currentStudentStr = localStorage.getItem('cbq_current_student');
      if (currentStudentStr) {
        const parsed = JSON.parse(currentStudentStr);
        setStudent(parsed);
        fetchVaultDocuments(parsed.full_name, parsed.student_class);
      }
    } catch (_) {}
  }, []);

  const fetchVaultDocuments = async (name, className) => {
    setVaultLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_digital_documents')
        .select('*')
        .eq('student_name', name)
        .eq('student_class', className)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setVaultDocuments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVaultLoading(false);
    }
  };

  const handlePublicSearch = async (e) => {
    e.preventDefault();
    if (!lookupCode.trim() && !lookupName.trim()) {
      alert("Vui lòng nhập Mã văn bằng (VD: CBQ-XXXXX) HOẶC Họ tên học sinh để tra cứu!");
      return;
    }

    setSearchLoading(true);
    setSearched(true);
    try {
      let query = supabase.from('cbq_digital_documents').select('*');

      if (lookupCode.trim()) {
        query = query.ilike('document_code', `%${lookupCode.trim()}%`);
      } else {
        if (lookupName.trim()) {
          query = query.ilike('student_name', `%${lookupName.trim()}%`);
        }
        if (lookupClass.trim()) {
          query = query.ilike('student_class', `%${lookupClass.trim()}%`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
      if (!error && data) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePrintVerification = (doc) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Vui lòng cho phép mở cửa sổ mới trên trình duyệt để in bản xác nhận.");
      return;
    }

    const { text: docText } = parseDocContent(doc.content);
    const issueDateStr = doc.issue_date 
      ? new Date(doc.issue_date).toLocaleDateString('vi-VN') 
      : new Date(doc.created_at).toLocaleDateString('vi-VN');

    // Filename follows GEMINI.md rule: prefix with order number
    const documentTitle = `1-Xac_nhan_van_bang_CBQ_${doc.document_code || 'Chung_chi'}`;
    printWindow.document.title = documentTitle;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${documentTitle}</title>
        <style>
          body { font-family: "Times New Roman", Times, serif; padding: 40px; color: #111; line-height: 1.6; }
          .header-tbl { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .header-tbl td { vertical-align: top; text-align: center; font-size: 14px; }
          .title { font-size: 20px; font-weight: bold; text-align: center; margin: 25px 0 10px 0; text-transform: uppercase; }
          .subtitle { font-size: 14px; font-style: italic; text-align: center; margin-bottom: 25px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 8px 12px; font-size: 15px; border-bottom: 1px solid #e2e8f0; }
          .info-label { font-weight: bold; width: 35%; color: #334155; }
          .info-value { color: #0f172a; }
          .stamp-box { border: 2px solid #16a34a; border-radius: 8px; padding: 12px; display: inline-block; color: #166534; font-weight: bold; margin-top: 15px; background: #f0fdf4; }
          .signature-box { margin-top: 40px; float: right; text-align: center; width: 280px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <table class="header-tbl">
          <tr>
            <td style="width: 45%;">
              SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK<br>
              <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br>
              <span style="font-size: 12px;">Phường Tân An - Tỉnh Đắk Lắk</span>
            </td>
            <td style="width: 55%;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
              <strong>Độc lập - Tự do - Hạnh phúc</strong><br>
              -------------------
            </td>
          </tr>
        </table>

        <div class="title">GIẤY XÁC NHẬN VĂN BẰNG / GIẤY CHỨNG NHẬN SỐ HÓA</div>
        <div class="subtitle">(Trích lục từ Hệ thống Cơ sở dữ liệu số Trường THPT Cao Bá Quát)</div>

        <table class="info-table">
          <tr>
            <td class="info-label">Mã số định danh văn bằng:</td>
            <td class="info-value"><strong>${doc.document_code}</strong></td>
          </tr>
          <tr>
            <td class="info-label">Loại văn bằng / Hồ sơ:</td>
            <td class="info-value"><strong>${doc.document_type}</strong></td>
          </tr>
          <tr>
            <td class="info-label">Họ và tên học sinh:</td>
            <td class="info-value"><strong style="font-size: 17px; text-transform: uppercase;">${doc.student_name}</strong></td>
          </tr>
          <tr>
            <td class="info-label">Lớp học:</td>
            <td class="info-value">${doc.student_class}</td>
          </tr>
          <tr>
            <td class="info-label">Nội dung xác nhận:</td>
            <td class="info-value"><strong>${doc.title}</strong><br>${docText || ''}</td>
          </tr>
          <tr>
            <td class="info-label">Người cấp / Thẩm quyền:</td>
            <td class="info-value">${doc.issued_by || 'Hiệu trưởng'}</td>
          </tr>
          <tr>
            <td class="info-label">Ngày cấp chính thức:</td>
            <td class="info-value">${issueDateStr}</td>
          </tr>
          <tr>
            <td class="info-label">Trạng thái xác thực:</td>
            <td class="info-value">
              <span class="stamp-box">
                ${doc.status === 'Active' ? '✓ ĐÃ XÁC THỰC HỢP LỆ TRÊN CƠ SỞ DỮ LIỆU' : '⚠ ĐÃ THU HỒI / VÔ HIỆU'}
              </span>
            </td>
          </tr>
        </table>

        <div class="signature-box">
          <em>Đắk Lắk, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em><br>
          <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br>
          <span style="font-size: 13px;">(Đã ký số xác thực điện tử)</span>
        </div>

        <div class="no-print" style="margin-top: 80px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px;">
            🖨️ IN GIẤY XÁC NHẬN (HOẶC LƯU PDF)
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleStudentLogout = () => {
    localStorage.removeItem('cbq_current_student');
    setStudent(null);
    setVaultDocuments([]);
    setActiveTab('lookup');
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1080px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Navigation Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          <ArrowLeft size={18} /> Quay lại Trang chủ Nhà trường
        </Link>

        {student ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#1e3a8a', background: '#dbeafe', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
              👤 {student.full_name} ({student.student_class})
            </span>
            <button
              onClick={handleStudentLogout}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <LogOut size={13} /> Đăng xuất
            </button>
          </div>
        ) : (
          <Link
            to="/dang-nhap-hoc-sinh"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}
          >
            <Lock size={14} /> Đăng nhập Cổng Học Sinh
          </Link>
        )}
      </div>
      
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)',
        borderRadius: '24px',
        padding: '32px 28px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px' }}>
          <Sparkles size={14} color="#fde047" /> HỆ THỐNG XÁC THỰC VĂN BẰNG SỐ CHÍNH THỨC
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#f8fafc' }}>
          <FileBadge color="#38bdf8" size={36} /> CỔNG TRA CỨU VĂN BẰNG & HỒ SƠ SỐ HỌC SINH
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14.5px', maxWidth: '750px', lineHeight: 1.5, color: '#e2e8f0' }}>
          Tra cứu, xác thực tính pháp lý và tra cứu hồ sơ khen thưởng, chứng nhận, bằng cấp số hóa của học sinh Trường THPT Cao Bá Quát (Sở GD&ĐT Đắk Lắk).
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '6px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('lookup')}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            background: activeTab === 'lookup' ? '#ffffff' : 'transparent',
            color: activeTab === 'lookup' ? '#0284c7' : '#64748b',
            boxShadow: activeTab === 'lookup' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          <Search size={18} /> 🔍 Tra Cứu Nhanh Công Khai (Không Cần Đăng Nhập)
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            background: activeTab === 'vault' ? '#ffffff' : 'transparent',
            color: activeTab === 'vault' ? '#1e3a8a' : '#64748b',
            boxShadow: activeTab === 'vault' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          <FileBadge size={18} /> 📁 Tủ Hồ Sơ Số Cá Nhân {student ? `(${student.full_name})` : '(Yêu Cầu Đăng Nhập)'}
        </button>
      </div>

      {/* TAB 1: TRA CỨU CÔNG KHAI */}
      {activeTab === 'lookup' && (
        <div>
          {/* Search Box Card */}
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', color: '#0f172a', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} color="#0284c7" /> Nhập Thông Tin Tra Cứu Văn Bằng
            </h2>

            <form onSubmit={handlePublicSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Mã Số Văn Bằng (Khuyên dùng)
                </label>
                <input
                  type="text"
                  placeholder="VD: CBQ-2024-001 hoặc mã QR"
                  value={lookupCode}
                  onChange={e => setLookupCode(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Họ và Tên Học Sinh
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn An"
                  value={lookupName}
                  onChange={e => setLookupName(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Lớp (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: 12A01"
                  value={lookupClass}
                  onChange={e => setLookupClass(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={searchLoading}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '14.5px',
                    cursor: searchLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <Search size={18} /> {searchLoading ? 'Đang xác thực...' : 'TRA CỨU VĂN BẰNG'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#64748b' }}>
              <Info size={14} color="#0284c7" />
              <span>Hệ thống cho phép tra cứu công khai: Giấy khen, Chứng nhận tốt nghiệp tạm thời, Bảng điểm số hóa, và Chứng chỉ ngoại khóa.</span>
            </div>
          </div>

          {/* Search Results */}
          {searched && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', color: '#1e293b', fontWeight: '800', margin: 0 }}>
                  Kết Quả Tra Cứu Xác Thực ({searchResults.length} hồ sơ)
                </h3>
              </div>

              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', background: 'white', borderRadius: '16px', padding: '40px 20px', border: '1px dashed #cbd5e1' }}>
                  <AlertTriangle size={44} color="#f59e0b" style={{ marginBottom: '12px' }} />
                  <h4 style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '16px' }}>Không tìm thấy văn bằng phù hợp</h4>
                  <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0, maxWidth: '500px', margin: '0 auto' }}>
                    Vui lòng kiểm tra lại chính xác Mã văn bằng (CBQ-...) hoặc Họ và tên học sinh kèm Lớp học.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {searchResults.map(doc => {
                    const { text: docText, driveUrl } = parseDocContent(doc.content);
                    const isRevoked = doc.status !== 'Active';

                    return (
                      <div key={doc.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        
                        {/* Header card */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: isRevoked ? '#fef2f2' : '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '16px', fontSize: '12.5px', fontWeight: 'bold' }}>
                              {doc.document_type || 'Văn bằng / Chứng chỉ'}
                            </span>
                            
                            {isRevoked ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '12.5px', fontWeight: 'bold', background: '#fee2e2', padding: '4px 10px', borderRadius: '16px' }}>
                                <AlertTriangle size={14} /> ĐÃ THU HỒI
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12.5px', fontWeight: 'bold', background: '#dcfce7', padding: '4px 10px', borderRadius: '16px' }}>
                                <ShieldCheck size={14} /> ĐÃ XÁC THỰC HỢP LỆ
                              </span>
                            )}
                          </div>

                          <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#0f172a', lineHeight: 1.4, fontWeight: '800' }}>
                            {doc.title}
                          </h4>
                          <div style={{ fontSize: '14px', color: '#334155' }}>
                            Học sinh: <strong style={{ color: '#0284c7' }}>{doc.student_name}</strong> - Lớp: <strong>{doc.student_class}</strong>
                          </div>
                        </div>

                        {/* Body card */}
                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            {docText && (
                              <p style={{ margin: '0 0 14px 0', color: '#475569', fontSize: '13.5px', lineHeight: 1.5 }}>
                                {docText}
                              </p>
                            )}

                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1', fontSize: '12.5px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div><strong>Mã số xác thực:</strong> <code style={{ color: '#0f172a', fontWeight: 'bold', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{doc.document_code}</code></div>
                              <div><strong>Cơ quan cấp:</strong> Trường THPT Cao Bá Quát ({doc.issued_by || 'Hiệu trưởng'})</div>
                              <div><strong>Ngày cấp:</strong> {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString('vi-VN') : new Date(doc.created_at).toLocaleDateString('vi-VN')}</div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handlePrintVerification(doc)}
                              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              <Printer size={15} /> In / Xuất Xác Nhận
                            </button>

                            {driveUrl && (
                              <a
                                href={driveUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#eff6ff', color: '#0284c7', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}
                              >
                                <HardDrive size={15} /> Bản Scan Gốc <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TỦ HỒ SƠ SỐ CÁ NHÂN */}
      {activeTab === 'vault' && (
        <div>
          {student ? (
            <div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
                    📁 Tủ Hồ Sơ Cá Nhân Của: <strong>{student.full_name}</strong>
                  </h3>
                  <div style={{ fontSize: '13.5px', color: '#64748b' }}>
                    Lớp: <strong>{student.student_class}</strong> • Vai trò: <strong>{student.role === 'class_president' ? 'Lớp trưởng' : student.role === 'secretary' ? 'Bí thư chi đoàn' : 'Học sinh'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => fetchVaultDocuments(student.full_name, student.student_class)}
                    disabled={vaultLoading}
                    style={{ padding: '8px 14px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', color: '#334155' }}
                  >
                    {vaultLoading ? 'Đang đồng bộ...' : '🔄 Làm mới dữ liệu'}
                  </button>
                  <Link
                    to="/student-dashboard"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#1e3a8a', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}
                  >
                    Vào Không Gian Học Sinh
                  </Link>
                </div>
              </div>

              {vaultLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải văn bằng từ máy chủ...</div>
              ) : vaultDocuments.length === 0 ? (
                <div style={{ textAlign: 'center', background: 'white', borderRadius: '16px', padding: '40px', border: '1px dashed #cbd5e1' }}>
                  <FileBadge size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#475569' }}>Tủ hồ sơ của em hiện đang trống</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Nhà trường chưa cấp phát văn bằng hoặc giấy tờ số hóa nào vào tài khoản của em.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {vaultDocuments.map(doc => {
                    const { text: docText, driveUrl } = parseDocContent(doc.content);
                    return (
                      <div key={doc.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                              {doc.document_type}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12px', fontWeight: 'bold' }}>
                              <ShieldCheck size={15} /> Đã xác thực
                            </span>
                          </div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', color: '#0f172a' }}>{doc.title}</h4>
                          {docText && <p style={{ margin: 0, color: '#475569', fontSize: '13.5px' }}>{docText}</p>}
                        </div>

                        <div style={{ padding: '16px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Mã: <strong style={{ color: '#0f172a' }}>{doc.document_code}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handlePrintVerification(doc)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#0f172a' }}
                            >
                              <Printer size={13} /> In bản số
                            </button>
                            {driveUrl && (
                              <a
                                href={driveUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}
                              >
                                Bản gốc <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '20px', padding: '40px 24px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'inline-flex', padding: '20px', background: '#eff6ff', borderRadius: '50%', color: '#2563eb', marginBottom: '16px' }}>
                <Lock size={44} />
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>
                Yêu Cầu Đăng Nhập Cổng Học Sinh
              </h3>
              <p style={{ color: '#64748b', fontSize: '14.5px', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                Để xem và quản lý tủ hồ sơ cá nhân (chứng nhận khen thưởng, học bạ số, văn bằng lưu trữ trong suốt các năm học), em vui lòng đăng nhập bằng <strong>Mã học sinh</strong> hoặc <strong>Tài khoản học sinh</strong>.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  to="/dang-nhap-hoc-sinh"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, #0284c7, #1e3a8a)', color: 'white', borderRadius: '10px', fontWeight: 'bold', fontSize: '14.5px', textDecoration: 'none', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)' }}
                >
                  <Lock size={16} /> ĐĂNG NHẬP CỔNG HỌC SINH
                </Link>
                <Link
                  to="/dang-ky"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 'bold', fontSize: '14.5px', textDecoration: 'none' }}
                >
                  Đăng ký tài khoản mới 👤
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
