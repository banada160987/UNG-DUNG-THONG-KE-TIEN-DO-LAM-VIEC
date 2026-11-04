import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, Clock, MapPin, Award, CheckCircle, 
  FileText, Download, Share2, AlertCircle, Sparkles, User, 
  BookOpen, ChevronRight, Hash, ArrowRight, Eye, ShieldCheck,
  FileCheck, HelpCircle, Info, ExternalLink
} from 'lucide-react';
import { 
  fetchExamSessions, 
  fetchExamRoomsData, 
  DEFAULT_EXAM_SESSIONS,
  DEFAULT_PDF_DOCUMENTS
} from '../services/examRoomService';

export default function PublicExamRooms() {
  const [sessions, setSessions] = useState(DEFAULT_EXAM_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState(DEFAULT_EXAM_SESSIONS[0].id);
  const [roomsData, setRoomsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all'); // 'all' | 'Khối 10' | 'Khối 11' | 'Khối 12'
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [previewPdfModal, setPreviewPdfModal] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Lấy dữ liệu kỳ thi hiện tại
  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    loadExamData();
  }, [selectedSessionId, selectedGradeFilter]);

  const loadExamData = async () => {
    setLoading(true);
    try {
      const allSessions = await fetchExamSessions();
      setSessions(allSessions);

      // CHỈ NẠP DỮ LIỆU ĐÃ LƯU - TUYỆT ĐỐI KHÔNG TỰ ĐỘNG CHẠY THUẬT TOÁN XẾP PHÒNG TẠI TRANG PUBLIC
      const targetGrade = selectedGradeFilter === 'all' ? 'Khối 10' : selectedGradeFilter;
      const data = await fetchExamRoomsData(`${selectedSessionId}-${targetGrade}`);
      setRoomsData(data);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu kỳ thi KTTT:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc lịch thi theo khối được chọn
  const filteredSchedule = useMemo(() => {
    const list = currentSession?.schedule || [];
    if (selectedGradeFilter === 'all') return list;
    return list.filter(item => item.grade === selectedGradeFilter || item.grade.includes(selectedGradeFilter) || item.grade === 'Toàn trường');
  }, [currentSession, selectedGradeFilter]);

  // Lọc danh sách tài liệu PDF theo khối
  const filteredPdfDocs = useMemo(() => {
    if (selectedGradeFilter === 'all') return DEFAULT_PDF_DOCUMENTS;
    return DEFAULT_PDF_DOCUMENTS.filter(doc => doc.grade === selectedGradeFilter);
  }, [selectedGradeFilter]);

  // Danh sách thí sinh khi Ban Khảo Thí đã BẬT CÔNG BỐ (isPublished === true)
  const isOnlinePublished = Boolean(roomsData?.isPublished);

  const allCandidates = useMemo(() => {
    if (!isOnlinePublished || !roomsData?.rooms) return [];
    const list = [];
    roomsData.rooms.forEach(rm => {
      (rm.candidates || []).forEach(cand => {
        list.push({
          ...cand,
          roomName: rm.roomName,
          roomLocation: rm.roomLocation,
          invigilator1: rm.invigilator1,
          invigilator2: rm.invigilator2
        });
      });
    });
    return list;
  }, [isOnlinePublished, roomsData]);

  // Kết quả tìm kiếm thí sinh (nếu đã công bố online)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !isOnlinePublished) return [];
    return allCandidates.filter(c => 
      (c.student_name || '').toLowerCase().includes(q) ||
      (c.sbd || '').toLowerCase().includes(q) ||
      (c.student_class || '').toLowerCase().includes(q) ||
      (c.student_code || '').toLowerCase().includes(q)
    );
  }, [allCandidates, searchQuery, isOnlinePublished]);

  // Xử lý sao chép link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Tải tệp PDF thông báo chính thức (Tuân thủ quy tắc tiền tố 1-... GEMINI.md)
  const handleDownloadPdf = (doc) => {
    const defaultPath = `/schedules/${(doc.title || 'Danh_sach_phong_KTTT_khoi_10.pdf').replace(/\s+/g, '_')}`;
    const fileUrl = doc.downloadUrl || defaultPath;
    const a = document.createElement('a');
    a.href = fileUrl;
    const prefix = /^\d+-/.test(doc.title) ? '' : '1-';
    a.download = `${prefix}${doc.title}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      
      {/* ================= THANH ĐIỀU HƯỚNG NHANH & LIÊN KẾT GOOGLE SITES GỐC ================= */}
      <div style={{
        background: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 16px',
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>SỞ GD&ĐT ĐẮK LẮK</span>
            <span>•</span>
            <span style={{ color: '#f1f5f9', fontWeight: '600' }}>TRƯỜNG THPT CAO BÁ QUÁT</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="https://sites.google.com/view/danhsachphongthigiuahki2627/trang-chủ"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#7dd3fc',
                textDecoration: 'none',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
              title="Mở trang Google Sites gốc của trường"
            >
              <ExternalLink size={12} /> Google Sites gốc của Trường
            </a>
            <button
              onClick={handleShare}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              <Share2 size={12} /> {copiedToast ? 'Đã sao chép link!' : 'Chia sẻ'}
            </button>
          </div>
        </div>
      </div>

      {/* ================= BANNER ĐEN VÂN CHẤM BI CHUẨN GOOGLE SITES CỦA TRƯỜNG ================= */}
      <header style={{
        background: '#121212',
        backgroundImage: 'radial-gradient(#3f3f46 1.4px, transparent 1.4px)',
        backgroundSize: '16px 16px',
        color: '#ffffff',
        padding: '42px 20px 32px',
        textAlign: 'center',
        borderBottom: '1px solid #27272a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(24px, 4.6vw, 42px)',
            fontWeight: '900',
            color: '#ffffff',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontFamily: '"Times New Roman", Times, "Playfair Display", Georgia, serif',
            textShadow: '0 2px 14px rgba(0,0,0,0.8)'
          }}>
            DANH SÁCH PHÒNG KTTT GIỮA HỌC KỲ I
          </h1>
          
          {/* THANH KẺ ĐỎ ĐẶC TRƯNG CHUẨN GOOGLE SITES */}
          <div style={{
            width: '620px',
            maxWidth: '88%',
            height: '5px',
            background: '#dc2626',
            margin: '14px auto 0',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(220, 38, 38, 0.6)'
          }} />

          {/* BỘ LỌC KHỐI NHANH */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '22px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tất cả các khối' },
              { id: 'Khối 10', label: 'Khối 10' },
              { id: 'Khối 11', label: 'Khối 11' },
              { id: 'Khối 12', label: 'Khối 12' }
            ].map(tab => {
              const isSelected = selectedGradeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setSelectedGradeFilter(tab.id); setSelectedCandidate(null); }}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '999px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.25)',
                    background: isSelected ? '#dc2626' : 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    boxShadow: isSelected ? '0 0 16px rgba(220, 38, 38, 0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ================= THÂN TRANG BỐ CỤC 2 CỘT CHUẨN GOOGLE SITES TRƯỜNG ================= */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>

        {/* THÔNG BÁO TỔNG QUAN TỪ BAN GIÁM HIỆU */}
        <div style={{
          background: '#eff6ff',
          borderLeft: '5px solid #2563eb',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: 1.5 }}>
              <strong>Kỳ Kiểm Tra Tập Trung Giữa Học Kỳ I (Năm học {currentSession?.academic_year || '2026 - 2027'}):</strong> Thí sinh theo dõi lịch kiểm tra bên trái và bấm vào tệp PDF bên phải để xem danh sách phòng thi chính thức.
            </div>
          </div>
        </div>

        {/* ================= BỐ CỤC 2 CỘT ================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}>

          {/* ================= CỘT 1 (BÊN TRÁI): BẢNG LỊCH KIỂM TRA TẬP TRUNG ================= */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            {/* TIÊU NGỮ HÀNH CHÍNH QUỐC GIA CHUẨN VĂN BẢN TRƯỜNG */}
            <div style={{
              padding: '18px 20px 14px',
              borderBottom: '1px solid #e2e8f0',
              background: '#ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', textAlign: 'center' }}>
                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#334155', fontWeight: '600' }}>
                    SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐẮK LẮK
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' }}>
                    TRƯỜNG THPT CAO BÁ QUÁT
                  </div>
                  <div style={{ width: '80px', height: '1px', background: '#334155', margin: '2px auto 0' }} />
                </div>

                <div style={{ textAlign: 'center', minWidth: '200px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a' }}>
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div style={{ fontSize: '12px', color: '#0f172a', fontStyle: 'italic', fontWeight: '600' }}>
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div style={{ width: '100px', height: '1px', background: '#334155', margin: '2px auto 0' }} />
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '15.5px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  LỊCH KIỂM TRA TẬP TRUNG GIỮA HỌC KỲ I
                </h2>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #94a3b8', color: '#0f172a' }}>
                    <th style={{ padding: '8px 6px', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '85px' }}>Ngày</th>
                    <th style={{ padding: '8px 6px', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '60px' }}>Buổi</th>
                    <th style={{ padding: '8px 8px', fontWeight: 'bold', border: '1px solid #cbd5e1', textAlign: 'left' }}>Bài thi/Môn thi</th>
                    <th style={{ padding: '8px 6px', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '65px' }}>Khối</th>
                    <th style={{ padding: '8px 6px', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '70px' }}>Thời gian làm bài</th>
                    <th style={{ padding: '8px 6px', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '75px' }}>Giờ phát đề cho thí sinh</th>
                    <th style={{ padding: '8px 6px', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '75px' }}>Giờ bắt đầu làm bài</th>
                    <th style={{ padding: '8px 8px', fontWeight: 'bold', border: '1px solid #cbd5e1', textAlign: 'left' }}>Hình thức</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedule.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '24px', color: '#64748b' }}>
                        Chưa có lịch kiểm tra tập trung cho khối này.
                      </td>
                    </tr>
                  ) : (
                    filteredSchedule.map((s, idx) => (
                      <tr 
                        key={idx} 
                        style={{ 
                          borderBottom: '1px solid #cbd5e1',
                          background: idx % 2 === 0 ? '#ffffff' : '#fcfcfc',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '8px 6px', fontWeight: 'bold', color: '#0f172a', border: '1px solid #cbd5e1' }}>{s.date}</td>
                        <td style={{ padding: '8px 6px', color: '#0f172a', fontWeight: '600', textTransform: 'uppercase', border: '1px solid #cbd5e1' }}>{s.session}</td>
                        <td style={{ padding: '8px 8px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', border: '1px solid #cbd5e1' }}>{s.subject}</td>
                        <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1' }}>
                          <span style={{ color: '#0f172a', fontWeight: 'bold' }}>
                            {s.grade}
                          </span>
                        </td>
                        <td style={{ padding: '8px 6px', color: '#334155', border: '1px solid #cbd5e1' }}>{s.duration}</td>
                        <td style={{ padding: '8px 6px', color: '#334155', border: '1px solid #cbd5e1' }}>{s.dispatchTime}</td>
                        <td style={{ padding: '8px 6px', color: '#0f172a', fontWeight: 'bold', border: '1px solid #cbd5e1' }}>{s.startTime}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'left', color: '#334155', border: '1px solid #cbd5e1', fontSize: '12px' }}>{s.format}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* QUY ĐỊNH PHÒNG THI DÀNH CHO THÍ SINH */}
            <div style={{ background: '#fffbeb', borderTop: '1px solid #fef3c7', padding: '12px 16px', fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
              <strong>⚠️ Chú ý:</strong> {currentSession?.notice}
            </div>
          </div>

          {/* ================= CỘT 2 (BÊN PHẢI): DANH SÁCH PHÒNG THI CHUẨN GOOGLE SITES ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              padding: '20px'
            }}>
              <h2 style={{
                margin: '0 0 10px',
                fontSize: '22px',
                fontWeight: '900',
                color: '#0f172a',
                textAlign: 'center',
                fontFamily: '"Times New Roman", Times, serif',
                letterSpacing: '0.5px'
              }}>
                DANH SÁCH PHÒNG THI
              </h2>
              
              <p style={{
                margin: '0 0 16px',
                fontSize: '13px',
                color: '#1e293b',
                lineHeight: 1.6
              }}>
                Các em <strong>CLICK CHUỘT</strong> vào để xem danh sách các môn thi Giữa HKI dành cho <strong>{selectedGradeFilter === 'all' ? 'Khối 10' : selectedGradeFilter}</strong>:
              </p>

              {/* BẢNG TẬP TIN PDF CHUẨN THEO ĐÚNG GOOGLE SITES CỦA TRƯỜNG */}
              <div style={{
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#ffffff'
              }}>
                {/* TIÊU ĐỀ CỘT CHUẨN GOOGLE SITES: TỰA ĐỀ | SỬA ĐỔI LẦN CUỐI */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px',
                  background: '#f8fafc',
                  padding: '9px 14px',
                  borderBottom: '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#475569',
                  textTransform: 'uppercase'
                }}>
                  <div>TỰA ĐỀ</div>
                  <div style={{ textAlign: 'right' }}>SỬA ĐỔI LẦN CUỐI</div>
                </div>

                {/* DANH SÁCH FILE PDF THEO FORM CỦA THẦY XUÂN BẢO NGHIÊM */}
                <div>
                  {filteredPdfDocs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 180px',
                        padding: '12px 14px',
                        borderBottom: idx < filteredPdfDocs.length - 1 ? '1px solid #f1f5f9' : 'none',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#ffffff',
                        transition: 'background 0.15s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                      onClick={() => setPreviewPdfModal(doc)}
                    >
                      {/* CỘT TỰA ĐỀ CÓ ICON PDF ĐỎ ĐẶC TRƯNG */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: '#dc2626',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '9.5px',
                          letterSpacing: '0.5px',
                          flexShrink: 0
                        }}>
                          PDF
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#1d4ed8',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {doc.size || '1.2 MB'} • Nhấp để xem hoặc tải
                          </div>
                        </div>
                      </div>

                      {/* CỘT SỬA ĐỔI LẦN CUỐI: GIỜ & TÁC GIẢ (VD: 18:24 XUÂN BẢO NGHIÊM) */}
                      <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{doc.lastModified}</span> {doc.author}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NÚT THAO TÁC XEM VÀ TẢI NHANH */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                {filteredPdfDocs.map(doc => (
                  <button
                    key={'dl-' + doc.id}
                    onClick={() => handleDownloadPdf(doc)}
                    style={{
                      padding: '7px 14px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                    title={`Tải file ${doc.title} (tự động có tiền tố 1- theo quy chuẩn)`}
                  >
                    <Download size={13} color="#dc2626" /> Tải {doc.grade} (1-...)
                  </button>
                ))}
              </div>

              {/* CARD GIẢI THÍCH CHUẨN BỊ CHO KỲ THI TIẾP THEO */}
              <div style={{
                marginTop: '16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                color: '#166534',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}>
                <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Hệ thống Khảo thí 4.0:</strong> Kỳ thi hiện tại nhà trường phát hành danh sách phòng qua file PDF. Bắt đầu từ kỳ thi tiếp theo, hệ thống sẽ mở cổng tra cứu trực tuyến Số Báo Danh và Vị trí bàn thi tự động theo chuẩn Quốc Gia.
                </div>
              </div>
            </div>

            {/* TIỆN ÍCH TRA CỨU SỐ BÁO DANH TRỰC TUYẾN DÀNH CHO HỌC SINH */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 8px 25px rgba(15, 23, 42, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={16} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 'bold', color: '#ffffff' }}>
                  TRA CỨU SỐ BÁO DANH TRỰC TUYẾN 4.0
                </h3>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8' }}>
                Nhập họ tên hoặc mã học sinh để xem phòng thi và vị trí bàn thi cá nhân nhanh chóng:
              </p>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Nhập họ tên học sinh hoặc mã học sinh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              {searchQuery.trim().length > 0 && (
                <div style={{ marginTop: '10px', background: '#ffffff', color: '#0f172a', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                      Không tìm thấy thí sinh nào khớp từ khóa "{searchQuery}".
                    </div>
                  ) : (
                    searchResults.map(c => (
                      <div
                        key={c.sbd}
                        onClick={() => { setSelectedCandidate(c); setSearchQuery(''); }}
                        style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}
                      >
                        <div>
                          <strong>{c.student_name}</strong> - Lớp {c.student_class}
                        </div>
                        <div style={{ color: '#0284c7', fontWeight: 'bold' }}>
                          SBD: {c.sbd} • {c.roomName}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ================= MODAL XEM CHI TIẾT THÍ SINH (KHI TÌM KIẾM ONLINE ĐƯỢC CHỌN) ================= */}
        {selectedCandidate && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>
                    THÔNG TIN PHÒNG THI THÍ SINH
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                    {selectedCandidate.student_name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SỐ BÁO DANH</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706' }}>{selectedCandidate.sbd}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>PHÒNG THI</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0284c7' }}>{selectedCandidate.roomName}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>VỊ TRÍ BÀN THI</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>Bàn #{selectedCandidate.seatNumber}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>LỚP HỌC</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#475569' }}>{selectedCandidate.student_class}</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                📍 <strong>Địa điểm:</strong> {selectedCandidate.roomLocation}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL XEM TRƯỚC TÀI LIỆU PDF CHÍNH THỨC ================= */}
        {previewPdfModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={24} color="#dc2626" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                      {previewPdfModal.title}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Ban Khảo Thí THPT Cao Bá Quát • Cập nhật: {previewPdfModal.lastModified} ({previewPdfModal.author})
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleDownloadPdf(previewPdfModal)}
                    style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={13} /> Tải Về (1-...)
                  </button>
                  <button
                    onClick={() => setPreviewPdfModal(null)}
                    style={{ background: '#e2e8f0', border: 'none', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', color: '#334155' }}
                  >
                    ✕ Đóng
                  </button>
                </div>
              </div>

              {/* KHUNG XEM PDF TRỰC TIẾP */}
              <div style={{ flex: 1, minHeight: '480px', background: '#334155', position: 'relative' }}>
                <iframe
                  src={previewPdfModal.downloadUrl || `/schedules/${previewPdfModal.title.replace(/\s+/g, '_')}`}
                  title={previewPdfModal.title}
                  style={{ width: '100%', height: '100%', minHeight: '480px', border: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER BẢN QUYỀN TRANG TRỌNG */}
      <footer style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', background: '#ffffff', padding: '24px 20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        <div>HỆ THỐNG THÔNG BÁO KHẢO THÍ & PHÒNG THI TẬP TRUNG • TRƯỜNG THPT CAO BÁ QUÁT</div>
        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
          Địa chỉ: Xã Cư M'gar, Tỉnh Đắk Lắk • Năm học 2026 - 2027
        </div>
      </footer>

    </div>
  );
}
