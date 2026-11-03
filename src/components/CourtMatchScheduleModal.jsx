import React, { useState, useEffect } from 'react';
import { 
  X, Download, Printer, Plus, Trash2, RefreshCw, 
  CheckCircle2, Users, Trophy, Sparkles, Filter, Edit3
} from 'lucide-react';
import { exportCourtMatchScheduleExcel } from '../services/signmarTournamentService';

// Danh sách Giáo viên Giáo dục Thể chất / Trọng tài chính thức của trường
const PE_TEACHERS = [
  'Huỳnh Thanh Tú',
  'Hồ Anh Tuấn',
  'Lê Công Dung',
  'Nguyễn Công Sở',
  'Nguyễn Văn Đại'
];

export default function CourtMatchScheduleModal({
  isOpen,
  onClose,
  tournament,
  sportName = 'Bóng Chuyền',
  signmarBracket = null,
  drawnBrackets = null,
  registrations = []
}) {
  const [courtCount, setCourtCount] = useState(2);
  const [defaultReferee, setDefaultReferee] = useState('Huỳnh Thanh Tú');
  const [matches, setMatches] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  // Tự động khởi tạo danh sách trận đấu khi mở Modal
  useEffect(() => {
    if (isOpen) {
      generateInitialMatches();
    }
  }, [isOpen, signmarBracket, drawnBrackets, registrations, sportName]);

  const generateInitialMatches = () => {
    const list = [];

    // 1. Nếu có Sơ Đồ Signmar 34 đội
    if (signmarBracket && signmarBracket.matches) {
      let mIdx = 1;
      // 2 trận sơ loại
      (signmarBracket.matches.prelim || []).forEach(m => {
        list.push({
          id: m.id || `prelim-${mIdx}`,
          court: ((mIdx - 1) % courtCount) + 1,
          matchNumber: mIdx,
          teamA: m.teamA?.name ? `${m.teamA.name}` : (m.placeholderA || '10A07'),
          score: (m.scoreA && m.scoreB) ? `${m.scoreA} - ${m.scoreB}` : '',
          teamB: m.teamB?.name ? `${m.teamB.name}` : (m.placeholderB || '12A03'),
          referee: defaultReferee,
          note: m.roundName || 'Vòng Sơ Loại (Play-in)'
        });
        mIdx++;
      });

      // 16 trận vòng 32
      (signmarBracket.matches.r32 || []).forEach(m => {
        list.push({
          id: m.id || `r32-${mIdx}`,
          court: ((mIdx - 1) % courtCount) + 1,
          matchNumber: mIdx,
          teamA: m.teamA?.name ? `${m.teamA.name}` : (m.placeholderA || 'TBD'),
          score: (m.scoreA && m.scoreB) ? `${m.scoreA} - ${m.scoreB}` : '',
          teamB: m.teamB?.name ? `${m.teamB.name}` : (m.placeholderB || 'TBD'),
          referee: defaultReferee,
          note: 'Vòng 1/16'
        });
        mIdx++;
      });
    } 
    // 2. Nếu có Bốc thăm Knockout cơ bản
    else if (drawnBrackets && drawnBrackets.type === 'knockout' && drawnBrackets.matchups) {
      drawnBrackets.matchups.forEach((m, idx) => {
        list.push({
          id: `ko-${idx + 1}`,
          court: (idx % courtCount) + 1,
          matchNumber: idx + 1,
          teamA: m.teamA?.name || m.teamA?.cohort_year || '10A07',
          score: '',
          teamB: m.teamB?.name || m.teamB?.cohort_year || '12A03',
          referee: defaultReferee,
          note: m.isBye ? 'Đặc cách vào vòng sau' : 'Vòng loại trực tiếp'
        });
      });
    } 
    // 3. Nếu chưa bốc thăm, sinh mẫu dựa trên danh sách lớp đăng ký (hoặc mẫu 10A07 gặp 12A03)
    else {
      const activeTeams = (registrations || []).filter(r => 
        !sportName || (r.sport_name || '').includes(sportName) || sportName.includes(r.sport_name || '')
      );

      if (activeTeams.length >= 2) {
        for (let i = 0; i < activeTeams.length; i += 2) {
          if (i + 1 < activeTeams.length) {
            const mNum = Math.floor(i / 2) + 1;
            const tA = activeTeams[i].cohort_year || activeTeams[i].unit_name || `Đội ${i + 1}`;
            const tB = activeTeams[i + 1].cohort_year || activeTeams[i + 1].unit_name || `Đội ${i + 2}`;
            list.push({
              id: `demo-${mNum}`,
              court: ((mNum - 1) % courtCount) + 1,
              matchNumber: mNum,
              teamA: tA.replace(/^Lớp\s+/i, ''),
              score: '',
              teamB: tB.replace(/^Lớp\s+/i, ''),
              referee: defaultReferee,
              note: 'Vòng sơ loại'
            });
          }
        }
      } else {
        // Dòng mẫu chính xác như trong ảnh người dùng cung cấp
        list.push({
          id: 'demo-sample-1',
          court: 1,
          matchNumber: 1,
          teamA: '10A07',
          score: '',
          teamB: '12A03',
          referee: 'Huỳnh Thanh Tú',
          note: ''
        });
      }
    }

    setMatches(list);
  };

  // Cập nhật giá trị trực tiếp trên bảng
  const handleUpdateRow = (index, field, value) => {
    const updated = [...matches];
    updated[index] = { ...updated[index], [field]: value };
    setMatches(updated);
  };

  // Thêm một trận đấu mới
  const handleAddRow = () => {
    const nextMatchNum = matches.length + 1;
    const nextCourt = ((nextMatchNum - 1) % courtCount) + 1;
    setMatches(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        court: nextCourt,
        matchNumber: nextMatchNum,
        teamA: '',
        score: '',
        teamB: '',
        referee: defaultReferee,
        note: ''
      }
    ]);
  };

  // Xóa một trận đấu
  const handleDeleteRow = (index) => {
    setMatches(prev => prev.filter((_, i) => i !== index));
  };

  // Tự động phân công luân phiên các trọng tài thể dục
  const handleAutoAssignReferees = () => {
    const updated = matches.map((m, idx) => ({
      ...m,
      referee: PE_TEACHERS[idx % PE_TEACHERS.length]
    }));
    setMatches(updated);
  };

  // Tự động phân bổ lại số sân
  const handleReassignCourts = (newCourtCount) => {
    setCourtCount(newCourtCount);
    const updated = matches.map((m, idx) => ({
      ...m,
      court: (idx % newCourtCount) + 1
    }));
    setMatches(updated);
  };

  // Xuất file Excel chuẩn đẹp 100% khớp ảnh người dùng
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await exportCourtMatchScheduleExcel({
        tournamentTitle: tournament?.name || 'Hội Thao Trường THPT Cao Bá Quát',
        sportName: sportName,
        matches: matches
      });
      if (res && res.success) {
        setExportSuccess(`Đã xuất thành công: ${res.fileName}`);
        setTimeout(() => setExportSuccess(''), 4500);
      }
    } catch (e) {
      alert('Có lỗi xảy ra khi tạo file Excel: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  // In lịch thi đấu khổ A4
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1240px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden'
      }}>
        
        {/* HEADER MODAL */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <Trophy size={22} color="#fbbf24" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '0.3px' }}>
                LỊCH THI ĐẤU THEO SÂN & TRỌNG TÀI
              </h2>
              <div style={{ fontSize: '12.5px', color: '#bfdbfe', marginTop: '2px' }}>
                Môn: <strong>{sportName}</strong> • {tournament?.name || 'Hội Thao Trường THPT Cao Bá Quát'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* SỐ SÂN & TRỌNG TÀI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Số sân:</label>
              <select
                value={courtCount}
                onChange={e => handleReassignCourts(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a' }}
              >
                <option value={1}>1 Sân (Sân 1)</option>
                <option value={2}>2 Sân (Sân 1 & 2)</option>
                <option value={3}>3 Sân (Sân 1, 2, 3)</option>
                <option value={4}>4 Sân (Sân 1, 2, 3, 4)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Trọng tài mặc định:</label>
              <select
                value={defaultReferee}
                onChange={e => {
                  setDefaultReferee(e.target.value);
                  setMatches(prev => prev.map(m => ({ ...m, referee: e.target.value })));
                }}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#047857' }}
              >
                {PE_TEACHERS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAutoAssignReferees}
              style={{
                padding: '6px 12px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Phân công luân phiên đều giữa 5 Thầy Thể dục"
            >
              <Sparkles size={14} /> Gán Luân Phiên Tổ Trọng Tài
            </button>

            <button
              onClick={generateInitialMatches}
              style={{
                padding: '6px 12px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Khôi phục lại lịch từ sơ đồ bốc thăm"
            >
              <RefreshCw size={13} /> Tải Lại Từ Bốc Thăm
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleAddRow}
              style={{
                padding: '8px 14px',
                background: '#f8fafc',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Plus size={15} color="#16a34a" /> Thêm Trận
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting || matches.length === 0}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: (isExporting || matches.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
              }}
            >
              <Download size={16} /> {isExporting ? 'Đang xuất Excel...' : '📥 Xuất File Excel (Chuẩn Đẹp)'}
            </button>

            <button
              onClick={handlePrint}
              style={{
                padding: '8px 14px',
                background: '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="In ra giấy A4 để dán bảng tin hoặc phát cho trọng tài"
            >
              <Printer size={15} /> In A4
            </button>
          </div>
        </div>

        {/* THÔNG BÁO XUẤT THÀNH CÔNG */}
        {exportSuccess && (
          <div style={{
            background: '#ecfdf5',
            color: '#065f46',
            borderBottom: '1px solid #a7f3d0',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>✓ {exportSuccess} (File đã lưu vào thư mục Tải về của máy tính)</span>
          </div>
        )}

        {/* BẢNG DỮ LIỆU ĐÚNG CHUẨN MẪU ẢNH */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px'
        }}>
          <div style={{
            border: '1.5px solid #cbd5e1',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'Times New Roman', Times, serif, system-ui",
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  borderBottom: '2px solid #94a3b8',
                  height: '40px'
                }}>
                  <th style={{ width: '70px', padding: '10px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Sân</th>
                  <th style={{ width: '70px', padding: '10px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Trận</th>
                  <th style={{ width: '130px', padding: '10px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Đội</th>
                  <th style={{ width: '120px', padding: '10px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>gặp (tỷ số)</th>
                  <th style={{ width: '130px', padding: '10px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Đội</th>
                  <th style={{ width: '190px', padding: '10px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Trọng tài</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>Ghi chú</th>
                  <th style={{ width: '50px', padding: '10px', textAlign: 'center' }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {matches.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Chưa có trận đấu nào. Bấm <strong>"Thêm Trận"</strong> hoặc <strong>"Tải Lại Từ Bốc Thăm"</strong>.
                    </td>
                  </tr>
                ) : (
                  matches.map((row, idx) => (
                    <tr 
                      key={row.id || idx}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                        height: '38px'
                      }}
                    >
                      {/* SÂN */}
                      <td style={{ borderRight: '1px solid #cbd5e1', textAlign: 'center', padding: '4px' }}>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={row.court}
                          onChange={e => handleUpdateRow(idx, 'court', Number(e.target.value))}
                          style={{
                            width: '45px',
                            textAlign: 'center',
                            padding: '4px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            color: '#1e3a8a',
                            fontFamily: 'inherit',
                            fontSize: '14px'
                          }}
                        />
                      </td>

                      {/* TRẬN */}
                      <td style={{ borderRight: '1px solid #cbd5e1', textAlign: 'center', padding: '4px' }}>
                        <input
                          type="number"
                          min={1}
                          value={row.matchNumber}
                          onChange={e => handleUpdateRow(idx, 'matchNumber', Number(e.target.value))}
                          style={{
                            width: '45px',
                            textAlign: 'center',
                            padding: '4px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontFamily: 'inherit',
                            fontSize: '14px'
                          }}
                        />
                      </td>

                      {/* ĐỘI (1) */}
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input
                          type="text"
                          value={row.teamA}
                          onChange={e => handleUpdateRow(idx, 'teamA', e.target.value)}
                          placeholder="VD: 10A07"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '4px',
                            border: '1px solid #93c5fd',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            color: '#1d4ed8',
                            fontFamily: 'inherit',
                            fontSize: '14px'
                          }}
                        />
                      </td>

                      {/* GẶP (TỶ SỐ) */}
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input
                          type="text"
                          value={row.score}
                          onChange={e => handleUpdateRow(idx, 'score', e.target.value)}
                          placeholder="Trống / Tỷ số"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '4px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            color: '#b91c1c',
                            fontFamily: 'inherit',
                            fontSize: '14px'
                          }}
                        />
                      </td>

                      {/* ĐỘI (2) */}
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input
                          type="text"
                          value={row.teamB}
                          onChange={e => handleUpdateRow(idx, 'teamB', e.target.value)}
                          placeholder="VD: 12A03"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '4px',
                            border: '1px solid #fde047',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            color: '#b45309',
                            fontFamily: 'inherit',
                            fontSize: '14px'
                          }}
                        />
                      </td>

                      {/* TRỌNG TÀI */}
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={row.referee}
                            onChange={e => handleUpdateRow(idx, 'referee', e.target.value)}
                            placeholder="Tên Trọng tài"
                            style={{
                              flex: 1,
                              padding: '4px 6px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontFamily: 'inherit',
                              fontSize: '14px'
                            }}
                          />
                          <select
                            value=""
                            onChange={e => {
                              if (e.target.value) handleUpdateRow(idx, 'referee', e.target.value);
                            }}
                            style={{
                              padding: '4px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            title="Chọn nhanh trọng tài"
                          >
                            <option value="">Chọn</option>
                            {PE_TEACHERS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* GHI CHÚ */}
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input
                          type="text"
                          value={row.note}
                          onChange={e => handleUpdateRow(idx, 'note', e.target.value)}
                          placeholder="Ghi chú (giờ thi đấu, vòng đấu...)"
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontFamily: 'inherit',
                            fontSize: '13px'
                          }}
                        />
                      </td>

                      {/* XÓA */}
                      <td style={{ textAlign: 'center', padding: '4px' }}>
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '3px'
                          }}
                          title="Xóa trận này"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              💡 <em>Thầy/Cô có thể sửa trực tiếp số sân, tên đội, tỷ số và phân công trọng tài ngay trên bảng trước khi xuất Excel.</em>
            </div>
            <div>
              Tổng số trận đấu: <strong>{matches.length}</strong> trận
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting || matches.length === 0}
            style={{
              padding: '9px 22px',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13.5px',
              cursor: (isExporting || matches.length === 0) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
            }}
          >
            <Download size={16} /> {isExporting ? 'Đang xuất Excel...' : '📥 Xuất File Excel (1-Lich_thi_dau...)'}
          </button>
        </div>

      </div>
    </div>
  );
}
