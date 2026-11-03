import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, Clock, MapPin, Award, CheckCircle, 
  FileText, Download, Share2, AlertCircle, Sparkles, User, 
  BookOpen, ChevronRight, Hash, ArrowRight, Printer, Layers, HelpCircle
} from 'lucide-react';
import { 
  fetchExamSessions, 
  fetchExamRoomsData, 
  fetchStudentsFromDb, 
  generateExamRoomsAlgorithm,
  exportExamRoomsExcel,
  DEFAULT_EXAM_SESSIONS
} from '../services/examRoomService';

export default function PublicExamRooms() {
  const [sessions, setSessions] = useState(DEFAULT_EXAM_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState(DEFAULT_EXAM_SESSIONS[0].id);
  const [roomsData, setRoomsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeTab, setSelectedGradeTab] = useState('Khối 10'); // 'Khối 10' | 'Khối 11' | 'Khối 12'
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Lấy dữ liệu kỳ thi hiện tại
  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    loadExamData();
  }, [selectedSessionId, selectedGradeTab]);

  const loadExamData = async () => {
    setLoading(true);
    try {
      const allSessions = await fetchExamSessions();
      setSessions(allSessions);

      // Lấy dữ liệu phòng thi đã lưu
      let data = await fetchExamRoomsData(`${selectedSessionId}-${selectedGradeTab}`);
      
      // Nếu chưa có phòng thi được lưu cho khối này, tự động khởi tạo dữ liệu phòng thi từ CSDL cbq_students
      if (!data || !data.rooms || data.rooms.length === 0) {
        const students = await fetchStudentsFromDb(selectedGradeTab);
        if (students.length > 0) {
          const isGrade12 = selectedGradeTab === 'Khối 12';
          data = generateExamRoomsAlgorithm(students, {
            examId: selectedSessionId,
            gradeLevel: selectedGradeTab,
            mode: isGrade12 ? 'national_12' : 'regular',
            capacity: isGrade12 ? 24 : 24
          });
        }
      }
      setRoomsData(data);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu phòng thi KTTT:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toàn bộ thí sinh của khối hiện tại
  const allCandidates = useMemo(() => {
    if (!roomsData?.rooms) return [];
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
  }, [roomsData]);

  // Lọc theo tìm kiếm học sinh
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allCandidates.filter(c => 
      (c.student_name || '').toLowerCase().includes(q) ||
      (c.sbd || '').toLowerCase().includes(q) ||
      (c.student_class || '').toLowerCase().includes(q) ||
      (c.student_code || '').toLowerCase().includes(q)
    );
  }, [allCandidates, searchQuery]);

  // Danh sách phòng thi hiển thị
  const displayRooms = useMemo(() => {
    if (!roomsData?.rooms) return [];
    if (selectedRoomFilter === 'all') return roomsData.rooms;
    return roomsData.rooms.filter(r => r.roomName === selectedRoomFilter);
  }, [roomsData, selectedRoomFilter]);

  // Lọc lịch thi theo khối
  const scheduleForGrade = useMemo(() => {
    const sch = currentSession?.schedule || [];
    return sch.filter(s => s.grade === selectedGradeTab || s.grade === 'Toàn trường');
  }, [currentSession, selectedGradeTab]);

  // Chia sẻ / Copy link tra cứu
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Xuất file Excel danh sách phòng thi
  const handleExportExcel = () => {
    if (!roomsData) return;
    exportExamRoomsExcel(currentSession, roomsData);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #090d16 0%, #0f172a 100%)', color: '#f8fafc', paddingBottom: '80px' }}>
      
      {/* ================= HEADER BANNER TRANG TRỌNG ================= */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 60%, #0f172a 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '36px 20px 30px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '12px' }}>
            <Award size={14} /> HỘI ĐỒNG KHẢO THÍ THPT CAO BÁ QUÁT
          </div>

          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '900', color: '#ffffff', margin: '0 0 8px', letterSpacing: '0.5px' }}>
            DANH SÁCH PHÒNG KIỂM TRA TẬP TRUNG (KTTT)
          </h1>
          <p style={{ margin: 0, fontSize: '14.5px', color: '#94a3b8', maxWidth: '720px', lineHeight: 1.5 }}>
            {currentSession?.title} • Năm học {currentSession?.academic_year} • Tra cứu Số Báo Danh, Phòng thi, Bàn thi & Lịch thi chính thức.
          </p>

          {/* CHỌN KHỐI LỚP (TABS KHỐI 10, 11, 12) */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
            {['Khối 10', 'Khối 11', 'Khối 12'].map(gr => {
              const isSelected = selectedGradeTab === gr;
              const isGrade12 = gr === 'Khối 12';
              return (
                <button
                  key={gr}
                  onClick={() => { setSelectedGradeTab(gr); setSelectedCandidate(null); }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                    background: isSelected 
                      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                      : 'rgba(255,255,255,0.06)',
                    color: '#ffffff',
                    boxShadow: isSelected ? '0 0 20px rgba(2, 132, 199, 0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <BookOpen size={16} />
                  {gr}
                  {isGrade12 && (
                    <span style={{ fontSize: '10px', background: '#f59e0b', color: '#78350f', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>
                      Chuẩn Quốc Gia
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>

        {/* ================= KHUNG TÌM KIẾM 1 CHẠM CỰC NHANH DÀNH CHO HỌC SINH ================= */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '20px',
          padding: '22px',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
          marginBottom: '28px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 'bold', fontSize: '15px' }}>
              <Search size={18} /> TRA CỨU PHÒNG THI & SỐ BÁO DANH ({selectedGradeTab.toUpperCase()})
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Tổng số thí sinh: <strong style={{ color: '#fbbf24' }}>{allCandidates.length}</strong> học sinh
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder={`🔍 Nhập Họ tên học sinh (ví dụ: An, Khánh Thi...), Số báo danh, hoặc Lớp (${selectedGradeTab === 'Khối 10' ? '10A01, 10A02...' : (selectedGradeTab === 'Khối 11' ? '11A01...' : '12A01...')})`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px 14px 44px',
                borderRadius: '12px',
                border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            />
            <Search size={20} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* DANH SÁCH GỢI Ý KHI TÌM KIẾM */}
          {searchQuery.trim().length > 0 && (
            <div style={{
              marginTop: '12px',
              background: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              maxHeight: '280px',
              overflowY: 'auto',
              padding: '6px'
            }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px' }}>
                  Không tìm thấy thí sinh nào khớp với từ khóa "{searchQuery}" trong {selectedGradeTab}.
                </div>
              ) : (
                searchResults.map(c => (
                  <div
                    key={c.id || c.sbd}
                    onClick={() => { setSelectedCandidate(c); setSearchQuery(''); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      marginBottom: '4px',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <div>
                      <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '14px' }}>{c.student_name}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '10px' }}>Lớp: {c.student_class}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 'bold' }}>SBD: {c.sbd}</span>
                      <span style={{ fontSize: '12px', background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {c.roomName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ================= MODAL / CARD THẺ BÁO THI CHI TIẾT (KHI CHỌN HỌC SINH) ================= */}
        {selectedCandidate && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '2px solid #38bdf8',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '30px',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.3)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', background: '#f59e0b', color: '#78350f', padding: '3px 8px', borderRadius: '999px', fontWeight: 'bold' }}>
                  THẺ BÁO THI ĐIỆN TỬ
                </span>
                <h2 style={{ margin: '6px 0 0', fontSize: '22px', color: '#ffffff', fontWeight: '900' }}>
                  {selectedCandidate.student_name}
                </h2>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
                  Lớp: <strong style={{ color: '#38bdf8' }}>{selectedCandidate.student_class}</strong> • {selectedCandidate.grade_level} • Mã HS: {selectedCandidate.student_code || '-'}
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕ Đóng
              </button>
            </div>

            {/* THÔNG TIN PHÒNG THI & SỐ BÁO DANH TO RÕ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>SỐ BÁO DANH (SBD)</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fbbf24', letterSpacing: '1px' }}>
                  {selectedCandidate.sbd}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>PHÒNG THI</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>
                  {selectedCandidate.roomName}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>VỊ TRÍ BÀN THI</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#4ade80' }}>
                  Bàn #{selectedCandidate.seatNumber}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>ĐỊA ĐIỂM PHÒNG THI</div>
                <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#f1f5f9', marginTop: '6px' }}>
                  {selectedCandidate.roomLocation}
                </div>
              </div>
            </div>

            {/* LỊCH THI CÁ NHÂN CỦA HỌC SINH */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> CÁC MÔN THI THÍ SINH CẦN THAM DỰ:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                {scheduleForGrade.map(sch => (
                  <div key={sch.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '13.5px' }}>{sch.subject}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{sch.date} ({sch.session})</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px' }}>
                      ⏰ Phát đề: <strong>{sch.dispatchTime}</strong> | Bắt đầu: <strong>{sch.startTime}</strong> ({sch.duration})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= KHỐI 1: LỊCH KIỂM TRA TẬP TRUNG (CHUẨN FORM TRƯỜNG) ================= */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#38bdf8" />
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#ffffff' }}>
                LỊCH KIỂM TRA TẬP TRUNG ({selectedGradeTab.toUpperCase()})
              </h2>
            </div>
            <button
              onClick={handleExportExcel}
              style={{
                padding: '7px 14px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Tải bảng lịch thi và danh sách phòng thi ra Excel chuẩn 1-..."
            >
              <Download size={14} /> Tải File Excel (1-...)
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 58, 138, 0.5)', borderBottom: '2px solid rgba(56, 189, 248, 0.3)' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold' }}>Ngày</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold' }}>Buổi</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#38bdf8', fontWeight: 'bold' }}>Bài thi/Môn thi</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold' }}>Khối</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold' }}>Thời gian</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold' }}>Giờ phát đề</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold' }}>Giờ làm bài</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#38bdf8', fontWeight: 'bold' }}>Hình thức</th>
                </tr>
              </thead>
              <tbody>
                {scheduleForGrade.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      Chưa có lịch kiểm tra tập trung cho {selectedGradeTab}.
                    </td>
                  </tr>
                ) : (
                  scheduleForGrade.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#ffffff' }}>{s.date}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: s.session === 'Sáng' ? '#fbbf24' : '#38bdf8' }}>{s.session}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#f8fafc' }}>{s.subject}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px' }}>{s.grade}</span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{s.duration}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#cbd5e1' }}>{s.dispatchTime}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#4ade80', fontWeight: 'bold' }}>{s.startTime}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{s.format}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= KHỐI 2: DANH SÁCH CÁC PHÒNG THI & SƠ ĐỒ CHỖ NGỒI ================= */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#38bdf8" />
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#ffffff' }}>
                DANH SÁCH PHÒNG THI ({displayRooms.length} PHÒNG - {selectedGradeTab.toUpperCase()})
              </h2>
            </div>

            {/* BỘ LỌC PHÒNG THI */}
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="all" style={{ background: '#0f172a' }}>Tất cả các phòng thi</option>
              {(roomsData?.rooms || []).map(r => (
                <option key={r.roomNumber} value={r.roomName} style={{ background: '#0f172a' }}>
                  {r.roomName} ({r.totalCandidates} thí sinh - SBD: {r.startSbd} ➔ {r.endSbd})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Đang tải danh sách phòng thi...
            </div>
          ) : displayRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chưa có phòng thi nào cho {selectedGradeTab}. Ban Khảo Thí đang cập nhật danh sách.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {displayRooms.map(rm => (
                <div
                  key={rm.roomNumber}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '16px',
                    transition: 'border-color 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#38bdf8' }}>
                      {rm.roomName}
                    </span>
                    <span style={{ fontSize: '12px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                      {rm.totalCandidates} Thí sinh
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="#94a3b8" /> {rm.roomLocation}
                  </div>

                  <div style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px', marginBottom: '12px' }}>
                    SBD: <strong style={{ color: '#ffffff' }}>{rm.startSbd}</strong> ➔ <strong style={{ color: '#ffffff' }}>{rm.endSbd}</strong>
                  </div>

                  {/* THÍ SINH TIÊU BIỂU TRONG PHÒNG */}
                  <div style={{ maxHeight: '140px', overflowY: 'auto', paddingRight: '4px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                    {(rm.candidates || []).slice(0, 5).map(c => (
                      <div
                        key={c.sbd}
                        onClick={() => setSelectedCandidate(c)}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', cursor: 'pointer', color: '#94a3b8' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                      >
                        <span>{c.seatNumber}. {c.student_name}</span>
                        <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{c.sbd}</span>
                      </div>
                    ))}
                    {(rm.candidates || []).length > 5 && (
                      <div style={{ textAlign: 'center', color: '#38bdf8', fontSize: '11px', marginTop: '4px', cursor: 'pointer' }} onClick={() => setSelectedRoomFilter(rm.roomName)}>
                        Xem tất cả {rm.candidates.length} thí sinh của {rm.roomName} ➔
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
