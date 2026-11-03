import { useState, useEffect, useMemo } from 'react';
import { 
  Award, Calendar, Users, Layers, Download, Printer, Plus, Trash2, 
  Edit, Save, RefreshCw, CheckCircle, AlertTriangle, Search, Filter, 
  MapPin, ShieldCheck, FileSpreadsheet, Eye, ChevronRight, X, Sparkles, ExternalLink
} from 'lucide-react';
import { 
  fetchExamSessions, 
  saveExamSessions,
  fetchExamRoomsData, 
  saveExamRoomsData,
  fetchStudentsFromDb, 
  generateExamRoomsAlgorithm,
  exportExamRoomsExcel,
  CBQ_PHYSICAL_ROOMS,
  DEFAULT_EXAM_SESSIONS
} from '../services/examRoomService';

export default function AdminExamRooms() {
  const [sessions, setSessions] = useState(DEFAULT_EXAM_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState(DEFAULT_EXAM_SESSIONS[0].id);
  const [selectedGrade, setSelectedGrade] = useState('Khối 12'); // 'Khối 12' | 'Khối 10' | 'Khối 11'
  const [roomsData, setRoomsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'schedule' | 'generate' | 'print'
  
  // Trạng thái sinh phòng thi
  const [isGenerating, setIsGenerating] = useState(false);
  const [capacitySetting, setCapacitySetting] = useState(24);
  const [modeSetting, setModeSetting] = useState('national_12');
  
  // Xem chi tiết 1 phòng
  const [inspectRoom, setInspectRoom] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Modal in ấn
  const [printModalRoom, setPrintModalRoom] = useState(null);
  const [printMode, setPrintMode] = useState('door_list'); // 'door_list' (dán cửa) | 'sign_sheet' (ký nộp bài)

  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    loadData();
  }, [selectedSessionId, selectedGrade]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allSessions = await fetchExamSessions();
      setSessions(allSessions);

      const sessionGradeKey = `${selectedSessionId}-${selectedGrade}`;
      let data = await fetchExamRoomsData(sessionGradeKey);

      // Nếu chưa có, tự động tạo mẫu ban đầu từ cbq_students
      if (!data || !data.rooms || data.rooms.length === 0) {
        const students = await fetchStudentsFromDb(selectedGrade);
        if (students.length > 0) {
          const isG12 = selectedGrade === 'Khối 12';
          data = generateExamRoomsAlgorithm(students, {
            examId: selectedSessionId,
            gradeLevel: selectedGrade,
            mode: isG12 ? 'national_12' : 'regular',
            capacity: 24
          });
          await saveExamRoomsData(sessionGradeKey, data);
        }
      }
      setRoomsData(data);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu quản trị phòng thi:', err);
    } finally {
      setLoading(false);
    }
  };

  // ================= THUẬT TOÁN TỰ ĐỘNG XẾP PHÒNG THI & ĐÁNH SBD =================
  const handleRunAlgorithm = async () => {
    const isG12 = selectedGrade === 'Khối 12';
    const confirmMsg = `Bạn có chắc chắn muốn chạy thuật toán xếp phòng thi tự động cho ${selectedGrade}?\n` +
      `- Tiêu chuẩn: ${isG12 ? 'Quy chế Tốt nghiệp THPT Quốc Gia (Tối đa 24 thí sinh/phòng, vần A-B-C)' : 'Quy chế Kiểm tra Phổ thông'}\n` +
      `- Sĩ số tối đa: ${capacitySetting} thí sinh/phòng\n` +
      `- Hệ thống sẽ lấy học sinh từ CSDL cbq_students, sắp xếp vần A-B-C tiếng Việt và đánh lại toàn bộ SBD.`;

    if (!window.confirm(confirmMsg)) return;

    setIsGenerating(true);
    try {
      const students = await fetchStudentsFromDb(selectedGrade);
      if (students.length === 0) {
        alert(`Không tìm thấy học sinh nào thuộc ${selectedGrade} trong cơ sở dữ liệu!`);
        return;
      }

      const generated = generateExamRoomsAlgorithm(students, {
        examId: selectedSessionId,
        gradeLevel: selectedGrade,
        mode: isG12 ? 'national_12' : 'regular',
        capacity: Number(capacitySetting) || 24
      });

      const sessionGradeKey = `${selectedSessionId}-${selectedGrade}`;
      await saveExamRoomsData(sessionGradeKey, generated);
      setRoomsData(generated);

      alert(`✅ Đã xếp phòng thi thành công cho ${selectedGrade}!\n- Tổng số thí sinh: ${generated.totalStudents}\n- Tổng số phòng thi: ${generated.totalRooms} phòng\n- Đã đánh SBD từ ${generated.rooms[0]?.startSbd} đến ${generated.rooms[generated.rooms.length - 1]?.endSbd}.`);
      setActiveTab('rooms');
    } catch (err) {
      console.error('Lỗi chạy thuật toán xếp phòng:', err);
      alert('Đã xảy ra lỗi khi xếp phòng thi: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ================= XUẤT EXCEL CHUẨN TIỀN TỐ 1-... =================
  const handleExportExcel = async () => {
    if (!roomsData || !roomsData.rooms || roomsData.rooms.length === 0) {
      alert('Chưa có dữ liệu phòng thi để xuất file Excel!');
      return;
    }
    try {
      setIsExportingExcel(true);
      const res = await exportExamRoomsExcel(currentSession, roomsData);
      if (res?.success) {
        alert(`✅ Đã xuất thành công file Excel "${res.fileName}"!\n- Gồm ${res.totalRooms} Phòng thi\n- ${res.totalStudents} Thí sinh (${selectedGrade}).`);
      }
    } catch (err) {
      console.error('Lỗi xuất Excel phòng thi:', err);
      alert('Lỗi xuất file Excel: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // In danh sách dán cửa hoặc bảng ký nộp bài
  const triggerPrint = (room, mode) => {
    setPrintModalRoom(room);
    setPrintMode(mode);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: '24px' }}>
      
      {/* ================= HEADER TRANG QUẢN TRỊ ================= */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#ffffff', padding: '20px 24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1e40af', padding: '3px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', marginBottom: '6px' }}>
              <Award size={14} /> HỘI ĐỒNG KHẢO THÍ & KIỂM TRA ĐỊNH KỲ
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '2px 0 0' }}>
              Quản Lý Phòng Kiểm Tra Tập Trung (KTTT)
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Xếp phòng thi chuẩn Quốc Gia (Khối 12) & Chuẩn Phổ thông (Khối 10, 11) • Đánh SBD vần A-B-C • In hồ sơ thi
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href="/kiem-tra-tap-trung"
              target="_blank"
              rel="noreferrer"
              style={{ padding: '9px 15px', background: '#eff6ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={15} /> Xem Cổng Học Sinh
            </a>

            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel || !roomsData?.rooms?.length}
              style={{
                padding: '9px 16px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: (isExportingExcel || !roomsData?.rooms?.length) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                opacity: (isExportingExcel || !roomsData?.rooms?.length) ? 0.7 : 1
              }}
              title="Xuất file Excel gồm Lịch thi, Bảng tổng hợp phòng thi và Danh sách chi tiết thí sinh theo quy tắc tiền tố 1-..."
            >
              <FileSpreadsheet size={16} />
              {isExportingExcel ? 'Đang xuất...' : '📥 Xuất Excel Phòng Thi (1-...)'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* ================= THANH ĐIỀU HƯỚNG VÀ CHỌN KHỐI ================= */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* CHỌN KHỐI LỚP QUẢN TRỊ */}
          <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '12px' }}>
            {['Khối 12', 'Khối 10', 'Khối 11'].map(gr => {
              const isSelected = selectedGrade === gr;
              const isG12 = gr === 'Khối 12';
              return (
                <button
                  key={gr}
                  onClick={() => setSelectedGrade(gr)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '9px',
                    fontWeight: 'bold',
                    fontSize: '13.5px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? (isG12 ? '#b45309' : '#0369a1') : '#64748b',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {gr}
                  {isG12 && (
                    <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px' }}>
                      Chuẩn Quốc Gia
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TABS TÍNH NĂNG */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('rooms')}
              style={{
                padding: '8px 16px',
                borderRadius: '9px',
                fontWeight: 'bold',
                fontSize: '13px',
                border: '1px solid ' + (activeTab === 'rooms' ? '#0284c7' : '#cbd5e1'),
                background: activeTab === 'rooms' ? '#0284c7' : '#ffffff',
                color: activeTab === 'rooms' ? '#ffffff' : '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layers size={15} /> Danh Sách Phòng Thi ({roomsData?.totalRooms || 0})
            </button>

            <button
              onClick={() => setActiveTab('generate')}
              style={{
                padding: '8px 16px',
                borderRadius: '9px',
                fontWeight: 'bold',
                fontSize: '13px',
                border: '1px solid ' + (activeTab === 'generate' ? '#7c3aed' : '#cbd5e1'),
                background: activeTab === 'generate' ? '#7c3aed' : '#ffffff',
                color: activeTab === 'generate' ? '#ffffff' : '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={15} /> Xếp Phòng Tự Động
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              style={{
                padding: '8px 16px',
                borderRadius: '9px',
                fontWeight: 'bold',
                fontSize: '13px',
                border: '1px solid ' + (activeTab === 'schedule' ? '#059669' : '#cbd5e1'),
                background: activeTab === 'schedule' ? '#059669' : '#ffffff',
                color: activeTab === 'schedule' ? '#ffffff' : '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Calendar size={15} /> Lịch Thi KTTT
            </button>
          </div>
        </div>

        {/* ================= TAB 1: DANH SÁCH CÁC PHÒNG THI ================= */}
        {activeTab === 'rooms' && (
          <div>
            {/* THÔNG BÁO TỔNG QUAN TIÊU CHUẨN */}
            <div style={{ background: selectedGrade === 'Khối 12' ? '#fffbeb' : '#eff6ff', border: '1px solid ' + (selectedGrade === 'Khối 12' ? '#fde68a' : '#bfdbfe'), borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color={selectedGrade === 'Khối 12' ? '#d97706' : '#0284c7'} />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: selectedGrade === 'Khối 12' ? '#92400e' : '#1e40af' }}>
                    {selectedGrade === 'Khối 12' 
                      ? '⭐ Tiêu chuẩn Kỳ Thi Tốt Nghiệp THPT Quốc Gia (Khối 12 - GDPT 2018)' 
                      : `📌 Tiêu chuẩn Kiểm Tra Tập Trung Phổ Thông (${selectedGrade})`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Quy cách: Tối đa 24 thí sinh/phòng • Sơ đồ 24 bàn zic-zac (khoảng cách 1.2m) • SBD vần A-B-C toàn khối
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                <div>Tổng thí sinh: <strong style={{ color: '#0369a1' }}>{roomsData?.totalStudents || 0}</strong></div>
                <div>Số phòng thi: <strong style={{ color: '#059669' }}>{roomsData?.totalRooms || 0} phòng</strong></div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Đang nạp dữ liệu phòng thi...</div>
            ) : !roomsData?.rooms || roomsData.rooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <Layers size={40} color="#94a3b8" style={{ marginBottom: '10px' }} />
                <h3 style={{ margin: '0 0 6px', color: '#334155' }}>Chưa có dữ liệu phòng thi cho {selectedGrade}</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                  Bạn có thể bấm vào nút dưới đây để hệ thống tự động lấy học sinh và xếp phòng thi ngay lập tức.
                </p>
                <button
                  onClick={() => setActiveTab('generate')}
                  style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🚀 Chuyển Đến Công Cụ Xếp Phòng Tự Động
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '18px' }}>
                {roomsData.rooms.map(rm => (
                  <div
                    key={rm.roomNumber}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '18px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '19px', fontWeight: '900', color: '#0284c7' }}>
                          {rm.roomName}
                        </span>
                        <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                          {rm.totalCandidates} Thí sinh
                        </span>
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#64748b" /> {rm.roomLocation}
                      </div>

                      <div style={{ fontSize: '12px', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', color: '#334155' }}>
                        SBD: <strong style={{ color: '#0369a1' }}>{rm.startSbd}</strong> ➔ <strong style={{ color: '#0369a1' }}>{rm.endSbd}</strong>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                        <div>👨‍🏫 Giám thị 1: <strong>{rm.invigilator1}</strong></div>
                        <div>👩‍🏫 Giám thị 2: <strong>{rm.invigilator2}</strong></div>
                      </div>
                    </div>

                    {/* NÚT THAO TÁC IN ẤN & XEM SƠ ĐỒ */}
                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setInspectRoom(rm)}
                        style={{ flex: 1, padding: '7px 10px', background: '#eff6ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '7px', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <Eye size={13} /> Sơ Đồ Bàn Thi
                      </button>

                      <button
                        onClick={() => triggerPrint(rm, 'door_list')}
                        style={{ padding: '7px 10px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '7px', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="In danh sách niêm yết trước cửa phòng thi"
                      >
                        <Printer size={13} /> Dán Cửa
                      </button>

                      <button
                        onClick={() => triggerPrint(rm, 'sign_sheet')}
                        style={{ padding: '7px 10px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '7px', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="In bảng ký nộp bài thi cho Giám thị"
                      >
                        <FileSpreadsheet size={13} /> Ký Nộp Bài
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: THUẬT TOÁN XẾP PHÒNG THI TỰ ĐỘNG ================= */}
        {activeTab === 'generate' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#7c3aed', fontWeight: '900', fontSize: '18px', marginBottom: '8px' }}>
              <Sparkles size={22} />
              CÔNG CỤ XẾP PHÒNG THI & ĐÁNH SỐ BÁO DANH THÔNG MINH
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
              Hệ thống sẽ tự động quét danh sách học sinh từ CSDL <code>cbq_students</code>, tiến hành phân tách họ tên, sắp xếp theo vần chữ cái Tiếng Việt A - B - C chuẩn quy chế thi và phân bổ vào các phòng thi.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Khối Lớp Cần Xếp:
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
                >
                  <option value="Khối 12">Khối 12 (Chuẩn Kỳ Thi Tốt Nghiệp THPT Quốc Gia)</option>
                  <option value="Khối 10">Khối 10 (Chuẩn Kiểm Tra Phổ Thông Định Kỳ)</option>
                  <option value="Khối 11">Khối 11 (Chuẩn Kiểm Tra Phổ Thông Định Kỳ)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Sĩ Số Tối Đa Mỗi Phòng Thi:
                </label>
                <select
                  value={capacitySetting}
                  onChange={(e) => setCapacitySetting(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}
                >
                  <option value={24}>24 Thí sinh / Phòng (Chuẩn Quy Chế Quốc Gia)</option>
                  <option value={28}>28 Thí sinh / Phòng (Chuẩn Phòng Học Phổ Thông)</option>
                  <option value={30}>30 Thí sinh / Phòng</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', fontSize: '13px', color: '#475569' }}>
              <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>⚡ Quy tắc triển khai tự động:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                <li>Tự động nhận diện Tên, Họ, Tên đệm và Ngày sinh để sắp xếp vần A-B-C chuẩn tiếng Việt.</li>
                <li>Đánh SBD 6 chữ số: <code>{selectedGrade === 'Khối 12' ? '120001' : (selectedGrade === 'Khối 11' ? '110001' : '100001')}</code> trở đi.</li>
                <li>Tự động bố trí 24 bàn thi zic-zac (Bàn #1 ➔ Bàn #24) bảo đảm khoảng cách 1.2m chống nhìn bài.</li>
                <li>Gán địa điểm phòng học thực tế tại Dãy Nhà A, B, C của trường THPT Cao Bá Quát.</li>
              </ul>
            </div>

            <button
              onClick={handleRunAlgorithm}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '14px',
                background: isGenerating ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '15px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
              }}
            >
              <Sparkles size={18} />
              {isGenerating ? 'Đang Xếp Phòng Thi & Đánh SBD...' : `🚀 BẮT ĐẦU XẾP PHÒNG THI TỰ ĐỘNG (${selectedGrade.toUpperCase()})`}
            </button>
          </div>
        )}

        {/* ================= TAB 3: QUẢN LÝ LỊCH THI TẬP TRUNG ================= */}
        {activeTab === 'schedule' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                Lịch Kiểm Tra Tập Trung (KTTT) Toàn Trường
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Form mẫu chuẩn theo Sở GD&ĐT Đắk Lắk & Trường THPT Cao Bá Quát
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Ngày</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Buổi</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Bài thi/Môn thi</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Khối</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Thời gian</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Giờ phát đề</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Giờ bắt đầu</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Hình thức</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentSession?.schedule || []).map((sch, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold' }}>{sch.date}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: sch.session === 'Sáng' ? '#b45309' : '#0369a1', fontWeight: 'bold' }}>{sch.session}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{sch.subject}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11.5px' }}>{sch.grade}</span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{sch.duration}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{sch.dispatchTime}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#15803d', fontWeight: 'bold' }}>{sch.startTime}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{sch.format}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL XEM CHI TIẾT SƠ ĐỒ BÀN THI 24 BÀN ZIC-ZAC ================= */}
      {inspectRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '860px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', background: '#eff6ff', color: '#0284c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  SƠ ĐỒ CHỖ NGỒI PHÒNG THI CHUẨN QUỐC GIA (GDPT 2018)
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>
                  {inspectRoom.roomName} • {inspectRoom.roomLocation}
                </h2>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  SBD: <strong>{inspectRoom.startSbd}</strong> ➔ <strong>{inspectRoom.endSbd}</strong> ({inspectRoom.totalCandidates} Thí sinh)
                </div>
              </div>
              <button onClick={() => setInspectRoom(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            {/* BẢNG GIÁO VIÊN COI THI (ĐẦU PHÒNG THI) */}
            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '10px', textAlign: 'center', marginBottom: '20px', fontSize: '12.5px', fontWeight: 'bold', color: '#64748b' }}>
              🚪 CỬA VÀO PHÒNG THI ➔ [ BÀN GIÁM THỊ COI THI 1 & 2 ]
            </div>

            {/* SƠ ĐỒ 24 BÀN THI ZIC-ZAC (4 CỘT X 6 HÀNG HOẶC 3 CỘT X 8 HÀNG) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {Array.from({ length: 24 }).map((_, seatIdx) => {
                const seatNumber = seatIdx + 1;
                const candidate = inspectRoom.candidates.find(c => c.seatNumber === seatNumber);

                return (
                  <div
                    key={seatNumber}
                    style={{
                      background: candidate ? '#f0f9ff' : '#f8fafc',
                      border: '1.5px solid ' + (candidate ? '#bae6fd' : '#e2e8f0'),
                      borderRadius: '10px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      position: 'relative'
                    }}
                  >
                    <div style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '10px', fontWeight: '900', color: candidate ? '#0284c7' : '#94a3b8' }}>
                      BÀN #{seatNumber}
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      {candidate ? (
                        <>
                          <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {candidate.student_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {candidate.sbd}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                            Lớp: {candidate.student_class}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#cbd5e1', padding: '8px 0' }}>Trống</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => triggerPrint(inspectRoom, 'door_list')}
                style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={15} /> In Danh Sách Dán Cửa
              </button>
              <button
                onClick={() => setInspectRoom(null)}
                style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL IN ẤN BẢN ĐẸP A4 (DÁN CỬA HOẶC KÝ NỘP BÀI) ================= */}
      {printModalRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', maxWidth: '820px', width: '100%', maxHeight: '95vh', overflowY: 'auto' }}>
            
            {/* Header hành chính chuẩn Nghị định 30 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #cbd5e1', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#334155' }}>SỞ GD&ĐT ĐẮK LẮK</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af' }}>HỘI ĐỒNG KHẢO THÍ</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: '11.5px', fontStyle: 'italic', fontWeight: 'bold' }}>Độc lập - Tự do - Hạnh phúc</div>
              </div>
            </div>

            {/* Tiêu đề in */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#1e3a8a' }}>
                {printMode === 'door_list' 
                  ? 'DANH SÁCH THÍ SINH PHÒNG THI (NIÊM YẾT DÁN CỬA PHÒNG)' 
                  : 'BẢNG GHI TÊN - ĐIỂM DANH - THU BÀI THI'}
              </h2>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#b91c1c', marginTop: '3px' }}>
                {currentSession?.title?.toUpperCase()} • {inspectRoom?.roomName || printModalRoom?.roomName}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Địa điểm: {printModalRoom.roomLocation} • Tổng số: {printModalRoom.totalCandidates} Thí sinh
              </div>
            </div>

            {/* Bảng danh sách in ấn */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #334155', padding: '6px 4px', textAlign: 'center', width: '35px' }}>STT</th>
                  <th style={{ border: '1px solid #334155', padding: '6px 6px', textAlign: 'center', width: '70px' }}>SBD</th>
                  <th style={{ border: '1px solid #334155', padding: '6px 8px', textAlign: 'left' }}>Họ Và Tên Thí Sinh</th>
                  <th style={{ border: '1px solid #334155', padding: '6px 6px', textAlign: 'center', width: '55px' }}>Lớp</th>
                  <th style={{ border: '1px solid #334155', padding: '6px 6px', textAlign: 'center', width: '45px' }}>Bàn</th>
                  <th style={{ border: '1px solid #334155', padding: '6px 6px', textAlign: 'center', width: '75px' }}>Ngày Sinh</th>
                  <th style={{ border: '1px solid #334155', padding: '6px 6px', textAlign: 'center', width: '45px' }}>Phái</th>
                  {printMode === 'sign_sheet' && (
                    <>
                      <th style={{ border: '1px solid #334155', padding: '6px 6px', textAlign: 'center', width: '60px' }}>Số tờ</th>
                      <th style={{ border: '1px solid #334155', padding: '6px 6px', textAlign: 'center', width: '90px' }}>Ký nộp bài</th>
                      <th style={{ border: '1px solid #334155', padding: '6px 6px', textAlign: 'center', width: '70px' }}>Điểm bài thi</th>
                    </>
                  )}
                  {printMode === 'door_list' && (
                    <th style={{ border: '1px solid #334155', padding: '6px 8px', textAlign: 'center', width: '100px' }}>Ghi chú</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {printModalRoom.candidates.map((c, i) => (
                  <tr key={c.sbd}>
                    <td style={{ border: '1px solid #64748b', padding: '5px 4px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #64748b', padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>{c.sbd}</td>
                    <td style={{ border: '1px solid #64748b', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold' }}>{c.student_name}</td>
                    <td style={{ border: '1px solid #64748b', padding: '5px 6px', textAlign: 'center' }}>{c.student_class}</td>
                    <td style={{ border: '1px solid #64748b', padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>{c.seatNumber}</td>
                    <td style={{ border: '1px solid #64748b', padding: '5px 6px', textAlign: 'center' }}>{c.birth_date ? new Date(c.birth_date).toLocaleDateString('vi-VN') : ''}</td>
                    <td style={{ border: '1px solid #64748b', padding: '5px 6px', textAlign: 'center' }}>{c.gender}</td>
                    {printMode === 'sign_sheet' && (
                      <>
                        <td style={{ border: '1px solid #64748b', padding: '5px 6px', textAlign: 'center' }}></td>
                        <td style={{ border: '1px solid #64748b', padding: '5px 6px', textAlign: 'center' }}></td>
                        <td style={{ border: '1px solid #64748b', padding: '5px 6px', textAlign: 'center' }}></td>
                      </>
                    )}
                    {printMode === 'door_list' && (
                      <td style={{ border: '1px solid #64748b', padding: '5px 8px', textAlign: 'center' }}></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Chân trang chữ ký giám thị */}
            {printMode === 'sign_sheet' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>CÁN BỘ COI THI THỨ NHẤT</div>
                  <div style={{ fontStyle: 'italic', fontSize: '10.5px' }}>(Ký và ghi rõ họ tên)</div>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>CÁN BỘ COI THI THỨ HAI</div>
                  <div style={{ fontStyle: 'italic', fontSize: '10.5px' }}>(Ký và ghi rõ họ tên)</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={15} /> In Ngay (Ctrl + P)
              </button>
              <button
                onClick={() => setPrintModalRoom(null)}
                style={{ padding: '8px 18px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
