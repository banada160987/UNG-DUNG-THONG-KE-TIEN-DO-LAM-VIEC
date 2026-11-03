import React, { useState } from 'react';
import { 
  Trophy, Download, Copy, Printer, Check, Shuffle, Save, 
  Search, Eye, Shield, Award, ChevronRight, HelpCircle, RefreshCw
} from 'lucide-react';
import { 
  exportSignmarToExcel, 
  formatSignmarForZalo, 
  updateSignmarMatch, 
  saveSignmarBracket,
  exportCourtMatchScheduleExcel
} from '../services/signmarTournamentService';

export default function SignmarBracketViewer({ 
  bracket, 
  tournament, 
  sportName, 
  onReshuffle, 
  onBracketChange 
}) {
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'teams' | 'matches'
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [searchTeam, setSearchTeam] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);

  if (!bracket || !bracket.drawnTeams) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        Chưa có dữ liệu sơ đồ Signmar. Vui lòng nhấn <strong>"🎲 Bốc Thăm Ngẫu Nhiên"</strong> để tạo sơ đồ.
      </div>
    );
  }

  // Xử lý chọn đội thắng trực tiếp bằng 1 click
  const handlePickWinner = (match, winningTeam) => {
    if (!winningTeam) return;
    const currentScoreA = match.scoreA || (winningTeam.id === match.teamA?.id ? '2' : '0');
    const currentScoreB = match.scoreB || (winningTeam.id === match.teamB?.id ? '2' : '0');

    const updated = updateSignmarMatch(bracket, match.id, {
      winner: winningTeam,
      scoreA: currentScoreA,
      scoreB: currentScoreB,
      status: 'completed'
    });

    if (onBracketChange) {
      onBracketChange(updated);
    }
  };

  // Cập nhật tỷ số trận đấu
  const handleScoreChange = (match, scoreA, scoreB) => {
    let winner = match.winner;
    const numA = parseInt(scoreA, 10);
    const numB = parseInt(scoreB, 10);

    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA > numB && match.teamA) winner = match.teamA;
      else if (numB > numA && match.teamB) winner = match.teamB;
    }

    const updated = updateSignmarMatch(bracket, match.id, {
      scoreA,
      scoreB,
      winner: winner || null,
      status: winner ? 'completed' : 'in_progress'
    });

    if (onBracketChange) {
      onBracketChange(updated);
    }
  };

  // Xuất file Excel chuẩn Signmar (Quy tắc 1-...)
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportSignmarToExcel(
        bracket, 
        tournament?.name || 'Giải Thể Thao Trường THPT Cao Bá Quát', 
        sportName || bracket.sportName
      );
    } catch (err) {
      alert('Lỗi xuất file Excel: ' + (err.message || err));
    } finally {
      setExportingExcel(false);
    }
  };

  // Xuất Bảng Lịch Đấu Theo Sân & Trọng Tài (khớp mẫu ảnh)
  const handleExportCourtSchedule = () => {
    const list = [];
    let idx = 1;

    // Vòng sơ loại
    (bracket.matches.prelim || []).forEach(m => {
      list.push({
        court: ((idx - 1) % 2) + 1,
        matchNumber: idx,
        teamA: m.teamA?.name || '10A07',
        score: (m.scoreA && m.scoreB) ? `${m.scoreA} - ${m.scoreB}` : '',
        teamB: m.teamB?.name || '12A03',
        referee: 'Huỳnh Thanh Tú',
        note: m.roundName || 'Vòng sơ loại'
      });
      idx++;
    });

    // Vòng 32
    (bracket.matches.round32 || []).forEach(m => {
      list.push({
        court: ((idx - 1) % 2) + 1,
        matchNumber: idx,
        teamA: m.teamA?.name || m.placeholderA || 'TBD',
        score: (m.scoreA && m.scoreB) ? `${m.scoreA} - ${m.scoreB}` : '',
        teamB: m.teamB?.name || m.placeholderB || 'TBD',
        referee: 'Huỳnh Thanh Tú',
        note: 'Vòng 1/16'
      });
      idx++;
    });

    exportCourtMatchScheduleExcel({
      tournamentTitle: tournament?.name,
      sportName,
      matches: list
    });
  };

  // Copy Zalo
  const handleCopyZalo = () => {
    const text = formatSignmarForZalo(
      bracket, 
      tournament?.name || 'Giải Thể Thao THPT Cao Bá Quát', 
      sportName || bracket.sportName,
      tournament?.zalo_link || 'https://zalo.me/g/lz7b83lfqx1r4tcpw9pa'
    );
    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  // Lưu tiến độ giải đấu
  const handleSaveProgress = async () => {
    try {
      setSavingProgress(true);
      await saveSignmarBracket(tournament?.id || 'default', sportName || bracket.sportName, bracket);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      alert('Không thể lưu tiến độ: ' + e.message);
    } finally {
      setSavingProgress(false);
    }
  };

  // Lọc 34 đội theo từ khóa
  const filteredTeams = bracket.drawnTeams.filter(t => 
    t.name.toLowerCase().includes(searchTeam.toLowerCase()) ||
    t.grade.toLowerCase().includes(searchTeam.toLowerCase())
  );

  // Thống kê tiến độ
  const allMatchesList = [
    ...(bracket.matches.prelim || []),
    ...(bracket.matches.round32 || []),
    ...(bracket.matches.round16 || []),
    ...(bracket.matches.quarter || []),
    ...(bracket.matches.semi || []),
    ...(bracket.matches.final || [])
  ];
  const completedCount = allMatchesList.filter(m => m.status === 'completed' && m.winner).length;

  return (
    <div style={{ marginTop: '14px' }}>
      
      {/* HEADER BANNER & THỐNG KÊ */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', 
        borderRadius: '16px', 
        padding: '18px 22px', 
        color: '#ffffff', 
        boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)', 
        marginBottom: '16px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Trophy size={14} color="#fde047" /> SƠ ĐỒ NHÁNH SIGNMAR CHUẨN 34 ĐỘI
            </div>
            <h2 style={{ margin: '6px 0 2px 0', fontSize: '20px', fontWeight: '800' }}>
              {sportName?.toUpperCase()}
            </h2>
            <div style={{ fontSize: '13px', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span>👥 <strong>34 Đội / Chi đoàn</strong></span>
              <span>⚔️ <strong>33 Trận đấu loại trực tiếp</strong></span>
              <span>⏳ Đã hoàn thành: <strong>{completedCount}/33 trận</strong></span>
            </div>
          </div>

          {/* QUÁN QUÂN VINH DANH */}
          {bracket.champion && (
            <div style={{ background: 'rgba(250, 204, 21, 0.2)', border: '2px solid #facc15', borderRadius: '12px', padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#fef08a', fontWeight: 'bold', textTransform: 'uppercase' }}>👑 ĐỘI VÔ ĐỊCH TOÀN GIẢI</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>🏆 {bracket.champion.name}</div>
            </div>
          )}
        </div>

        {/* NÚT THAO TÁC NHANH */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            style={{ padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            title="Xuất sơ đồ cây xương cá ra Excel chuẩn A4 Landscape (1-So_do_signmar_34_doi...)"
          >
            <Download size={15} /> {exportingExcel ? 'Đang xuất...' : '📥 Xuất Excel Sơ Đồ Signmar (1-...)'}
          </button>

          <button
            onClick={handleExportCourtSchedule}
            style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            title="Xuất bảng Excel Lịch thi đấu theo Sân & Trọng tài đúng theo mẫu yêu cầu (Sân | Trận | Đội | gặp (tỷ số) | Đội | Trọng tài | Ghi chú)"
          >
            <Download size={15} /> 🏟️ Xuất Lịch Sân & Trọng Tài (1-...)
          </button>

          <button
            onClick={handleCopyZalo}
            style={{ padding: '8px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {copiedZalo ? <Check size={15} /> : <Copy size={15} />} {copiedZalo ? 'Đã sao chép!' : '📋 Copy Kết Quả Gửi Zalo'}
          </button>

          <button
            onClick={handleSaveProgress}
            disabled={savingProgress}
            style={{ padding: '8px 14px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} /> {savedSuccess ? '✅ Đã lưu CSDL!' : (savingProgress ? 'Đang lưu...' : '💾 Lưu Tiến Độ Giải')}
          </button>

          {onReshuffle && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn BỐC THĂM LẠI TOÀN BỘ từ đầu? Các kết quả trận đấu đã nhập sẽ bị đặt lại.')) {
                  onReshuffle();
                }
              }}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={14} /> 🎲 Bốc Thăm Lại
            </button>
          )}

          <button
            onClick={() => window.print()}
            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}
          >
            <Printer size={14} /> In Sơ Đồ
          </button>
        </div>
      </div>

      {/* TABS CHUYỂN CHẾ ĐỘ XEM */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('tree')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            fontSize: '13.5px', 
            cursor: 'pointer', 
            border: 'none', 
            background: activeTab === 'tree' ? '#4338ca' : '#f1f5f9', 
            color: activeTab === 'tree' ? '#ffffff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🌳 Sơ Đồ Cây Phân Nhánh (Signmar Bracket)
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            fontSize: '13.5px', 
            cursor: 'pointer', 
            border: 'none', 
            background: activeTab === 'teams' ? '#4338ca' : '#f1f5f9', 
            color: activeTab === 'teams' ? '#ffffff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📋 Bảng Thứ Tự Bốc Thăm (34 Đội)
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            fontSize: '13.5px', 
            cursor: 'pointer', 
            border: 'none', 
            background: activeTab === 'matches' ? '#4338ca' : '#f1f5f9', 
            color: activeTab === 'matches' ? '#ffffff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ⚔️ Danh Sách 33 Trận Đấu
        </button>
      </div>

      {/* TAB 1: SƠ ĐỒ CÂY PHÂN NHÁNH TRỰC QUAN (SIGNMAR BRACKET TREE) */}
      {activeTab === 'tree' && (
        <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px', overflowX: 'auto' }}>
          
          <div style={{ minWidth: '1200px', display: 'flex', gap: '24px', alignItems: 'stretch' }}>
            
            {/* CỘT 0: VÒNG SƠ LOẠI (PLAY-IN) */}
            <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#ede9fe', border: '1.5px solid #c4b5fd', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: '800', color: '#5b21b6', fontSize: '13px' }}>VÒNG SƠ LOẠI</div>
                <div style={{ fontSize: '11px', color: '#6d28d9' }}>2 trận (4 đội bốc thăm)</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%', gap: '180px' }}>
                {bracket.matches.prelim.map((m, idx) => (
                  <BracketMatchCard 
                    key={m.id} 
                    match={m} 
                    onPickWinner={handlePickWinner} 
                    onScoreChange={handleScoreChange}
                    badgeColor="#7c3aed"
                  />
                ))}
              </div>
            </div>

            {/* CỘT 1: VÒNG 32 ĐỘI (1/16) */}
            <div style={{ width: '230px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#e0f2fe', border: '1.5px solid #7dd3fc', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: '800', color: '#0369a1', fontSize: '13px' }}>VÒNG 32 ĐỘI (1/16)</div>
                <div style={{ fontSize: '11px', color: '#0284c7' }}>16 trận đấu loại</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bracket.matches.round32.map((m) => (
                  <BracketMatchCard 
                    key={m.id} 
                    match={m} 
                    onPickWinner={handlePickWinner} 
                    onScoreChange={handleScoreChange}
                    badgeColor="#0284c7"
                  />
                ))}
              </div>
            </div>

            {/* CỘT 2: VÒNG 16 ĐỘI (1/8) */}
            <div style={{ width: '230px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: '800', color: '#047857', fontSize: '13px' }}>VÒNG 16 ĐỘI (1/8)</div>
                <div style={{ fontSize: '11px', color: '#059669' }}>8 trận đấu loại</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%', gap: '26px' }}>
                {bracket.matches.round16.map((m) => (
                  <BracketMatchCard 
                    key={m.id} 
                    match={m} 
                    onPickWinner={handlePickWinner} 
                    onScoreChange={handleScoreChange}
                    badgeColor="#059669"
                  />
                ))}
              </div>
            </div>

            {/* CỘT 3: VÒNG TỨ KẾT (1/4) */}
            <div style={{ width: '230px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: '800', color: '#b45309', fontSize: '13px' }}>VÒNG TỨ KẾT (1/4)</div>
                <div style={{ fontSize: '11px', color: '#d97706' }}>4 trận đỉnh cao</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%', gap: '80px' }}>
                {bracket.matches.quarter.map((m) => (
                  <BracketMatchCard 
                    key={m.id} 
                    match={m} 
                    onPickWinner={handlePickWinner} 
                    onScoreChange={handleScoreChange}
                    badgeColor="#d97706"
                  />
                ))}
              </div>
            </div>

            {/* CỘT 4: VÒNG BÁN KẾT */}
            <div style={{ width: '230px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: '800', color: '#be185d', fontSize: '13px' }}>VÒNG BÁN KẾT</div>
                <div style={{ fontSize: '11px', color: '#db2777' }}>2 trận tranh vé Chung kết</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%', gap: '200px' }}>
                {bracket.matches.semi.map((m) => (
                  <BracketMatchCard 
                    key={m.id} 
                    match={m} 
                    onPickWinner={handlePickWinner} 
                    onScoreChange={handleScoreChange}
                    badgeColor="#db2777"
                  />
                ))}
              </div>
            </div>

            {/* CỘT 5: TRẬN CHUNG KẾT & CÚP VÔ ĐỊCH */}
            <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: '900', color: '#92400e', fontSize: '13px' }}>🏆 TRẬN CHUNG KẾT</div>
                <div style={{ fontSize: '11px', color: '#b45309' }}>Tranh Cúp Vô Địch 2026</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '24px' }}>
                {bracket.matches.final.map((m) => (
                  <BracketMatchCard 
                    key={m.id} 
                    match={m} 
                    onPickWinner={handlePickWinner} 
                    onScoreChange={handleScoreChange}
                    badgeColor="#b45309"
                    isFinal={true}
                  />
                ))}

                {/* PODIUM VÔ ĐỊCH */}
                <div style={{ 
                  background: bracket.champion ? 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)' : '#f1f5f9', 
                  border: '2px dashed ' + (bracket.champion ? '#ca8a04' : '#cbd5e1'), 
                  borderRadius: '14px', 
                  padding: '16px', 
                  textAlign: 'center',
                  boxShadow: bracket.champion ? '0 8px 20px rgba(202, 138, 4, 0.25)' : 'none'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>🏆</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#854d0e', textTransform: 'uppercase' }}>CÚP VÔ ĐỊCH TOÀN TRƯỜNG</div>
                  <div style={{ fontSize: '19px', fontWeight: '900', color: '#713f12', margin: '4px 0' }}>
                    {bracket.champion ? `Lớp ${bracket.champion.name}` : '(Đang thi đấu)'}
                  </div>
                  {bracket.champion && (
                    <div style={{ fontSize: '12px', color: '#854d0e' }}>{bracket.champion.grade}</div>
                  )}
                </div>

                {/* TRẬN TRANH HẠNG BA */}
                {bracket.matches.thirdPlace && bracket.matches.thirdPlace.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textAlign: 'center', marginBottom: '6px' }}>
                      🥉 TRANH HẠNG BA:
                    </div>
                    {bracket.matches.thirdPlace.map((m) => (
                      <BracketMatchCard 
                        key={m.id} 
                        match={m} 
                        onPickWinner={handlePickWinner} 
                        onScoreChange={handleScoreChange}
                        badgeColor="#64748b"
                      />
                    ))}
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: BẢNG DANH SÁCH 34 ĐỘI BỐC THĂM (TT 1-34) */}
      {activeTab === 'teams' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
              Danh Sách Kết Quả Bốc Thăm (34 Chi Đoàn Lớp THPT Cao Bá Quát)
            </h3>
            <div style={{ position: 'relative', width: '240px' }}>
              <input
                type="text"
                placeholder="Tìm lớp (VD: 10A04, 11A01)..."
                value={searchTeam}
                onChange={e => setSearchTeam(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '9px', top: '9px', color: '#94a3b8' }} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px' }}>Số Thăm</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tên Chi Đoàn / Đội</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>Khối Lớp</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '170px' }}>Phân Bổ Nhánh</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '180px' }}>Vòng Ra Quân</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '140px' }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((t, idx) => {
                  const isPrelim = (t.drawNo === 11 || t.drawNo === 12 || t.drawNo === 27 || t.drawNo === 28);
                  return (
                    <tr key={t.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 'bold', color: '#4338ca' }}>
                        #{t.drawNo < 10 ? `0${t.drawNo}` : t.drawNo}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 'bold', color: '#0f172a' }}>
                        Lớp {t.name}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11.5px', 
                          fontWeight: 'bold',
                          background: t.grade === 'Khối 12' ? '#fef2f2' : (t.grade === 'Khối 11' ? '#f0fdf4' : '#eff6ff'),
                          color: t.grade === 'Khối 12' ? '#b91c1c' : (t.grade === 'Khối 11' ? '#15803d' : '#1d4ed8')
                        }}>
                          {t.grade}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: '#475569' }}>
                        {t.branch}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        {isPrelim ? (
                          <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11.5px' }}>
                            ⚔️ Đấu Sơ Loại (Play-in)
                          </span>
                        ) : (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11.5px' }}>
                            ✅ Vào Thẳng Vòng 32 (Bye)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{ color: '#059669', fontSize: '12px', fontWeight: 'bold' }}>
                          Sẵn Sàng
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DANH SÁCH 33 TRẬN ĐẤU (DANH SÁCH PHẲNG ĐỂ NHẬP NHANH) */}
      {activeTab === 'matches' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
            Toàn Bộ 33 Trận Đấu Sơ Đồ Signmar (Cập nhật tỷ số nhanh)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {allMatchesList.map(m => (
              <div 
                key={m.id} 
                style={{ 
                  background: m.status === 'completed' ? '#f0fdf4' : '#f8fafc', 
                  border: '1.5px solid ' + (m.status === 'completed' ? '#86efac' : '#cbd5e1'), 
                  borderRadius: '12px', 
                  padding: '12px 14px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#4338ca', fontSize: '13px' }}>
                    TRẬN {m.matchNumber}: {m.roundName}
                  </span>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    fontWeight: 'bold',
                    background: m.status === 'completed' ? '#dcfce7' : '#f1f5f9',
                    color: m.status === 'completed' ? '#166534' : '#64748b'
                  }}>
                    {m.status === 'completed' ? 'Đã Xong' : 'Chờ Đấu'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  {/* Team A */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: m.winner?.id === m.teamA?.id ? '#16a34a' : '#0f172a' }}>
                      {m.teamA?.name ? `Lớp ${m.teamA.name}` : (m.placeholderA || 'TBD')}
                      {m.winner?.id === m.teamA?.id && ' 🏆'}
                    </div>
                    {m.teamA && (
                      <button
                        onClick={() => handlePickWinner(m, m.teamA)}
                        style={{ marginTop: '4px', padding: '2px 8px', fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Chọn Thắng
                      </button>
                    )}
                  </div>

                  {/* Tỷ số */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="text"
                      placeholder="0"
                      value={m.scoreA}
                      onChange={e => handleScoreChange(m, e.target.value, m.scoreB)}
                      style={{ width: '32px', textAlign: 'center', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                    />
                    <span>-</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={m.scoreB}
                      onChange={e => handleScoreChange(m, m.scoreA, e.target.value)}
                      style={{ width: '32px', textAlign: 'center', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                    />
                  </div>

                  {/* Team B */}
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: m.winner?.id === m.teamB?.id ? '#16a34a' : '#0f172a' }}>
                      {m.teamB?.name ? `Lớp ${m.teamB.name}` : (m.placeholderB || 'TBD')}
                      {m.winner?.id === m.teamB?.id && ' 🏆'}
                    </div>
                    {m.teamB && (
                      <button
                        onClick={() => handlePickWinner(m, m.teamB)}
                        style={{ marginTop: '4px', padding: '2px 8px', fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Chọn Thắng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Thẻ hiển thị Trận Đấu trong Sơ đồ Cây Signmar
 */
function BracketMatchCard({ match, onPickWinner, onScoreChange, badgeColor = '#0284c7', isFinal = false }) {
  const isA_Winner = match.winner && match.teamA && match.winner.id === match.teamA.id;
  const isB_Winner = match.winner && match.teamB && match.winner.id === match.teamB.id;

  return (
    <div style={{ 
      background: '#ffffff', 
      border: '1.5px solid ' + (match.status === 'completed' ? '#16a34a' : (isFinal ? '#f59e0b' : '#cbd5e1')), 
      borderRadius: '10px', 
      padding: '8px 10px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative'
    }}>
      
      {/* HEADER TRẬN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px' }}>
        <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: badgeColor, textTransform: 'uppercase' }}>
          Trận {match.matchNumber} {isFinal && '🏆'}
        </span>
        {match.status === 'completed' && (
          <span style={{ fontSize: '9.5px', background: '#dcfce7', color: '#166534', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px' }}>
            Xong
          </span>
        )}
      </div>

      {/* ĐỘI A */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: isA_Winner ? '#f0fdf4' : '#ffffff',
        padding: '4px 6px', 
        borderRadius: '6px',
        border: isA_Winner ? '1px solid #86efac' : '1px solid #f1f5f9',
        marginBottom: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          {match.teamA ? (
            <button
              onClick={() => onPickWinner(match, match.teamA)}
              title="Nhấn để chọn đội này thắng trận"
              style={{ 
                background: isA_Winner ? '#16a34a' : '#e2e8f0', 
                color: isA_Winner ? '#fff' : '#475569', 
                border: 'none', 
                borderRadius: '4px', 
                padding: '2px 5px', 
                fontSize: '10px', 
                fontWeight: 'bold', 
                cursor: 'pointer' 
              }}
            >
              {isA_Winner ? '🏆' : 'Chọn'}
            </button>
          ) : null}
          <span style={{ 
            fontSize: '12px', 
            fontWeight: isA_Winner ? 'bold' : 'normal', 
            color: isA_Winner ? '#166534' : (match.teamA ? '#0f172a' : '#94a3b8'),
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}>
            {match.teamA?.name ? `Lớp ${match.teamA.name}` : (match.placeholderA || 'TBD')}
          </span>
        </div>

        <input
          type="text"
          value={match.scoreA}
          placeholder="-"
          onChange={e => onScoreChange(match, e.target.value, match.scoreB)}
          style={{ width: '24px', textAlign: 'center', fontSize: '11.5px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold' }}
        />
      </div>

      {/* ĐỘI B */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: isB_Winner ? '#f0fdf4' : '#ffffff',
        padding: '4px 6px', 
        borderRadius: '6px',
        border: isB_Winner ? '1px solid #86efac' : '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          {match.teamB ? (
            <button
              onClick={() => onPickWinner(match, match.teamB)}
              title="Nhấn để chọn đội này thắng trận"
              style={{ 
                background: isB_Winner ? '#16a34a' : '#e2e8f0', 
                color: isB_Winner ? '#fff' : '#475569', 
                border: 'none', 
                borderRadius: '4px', 
                padding: '2px 5px', 
                fontSize: '10px', 
                fontWeight: 'bold', 
                cursor: 'pointer' 
              }}
            >
              {isB_Winner ? '🏆' : 'Chọn'}
            </button>
          ) : null}
          <span style={{ 
            fontSize: '12px', 
            fontWeight: isB_Winner ? 'bold' : 'normal', 
            color: isB_Winner ? '#166534' : (match.teamB ? '#0f172a' : '#94a3b8'),
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}>
            {match.teamB?.name ? `Lớp ${match.teamB.name}` : (match.placeholderB || 'TBD')}
          </span>
        </div>

        <input
          type="text"
          value={match.scoreB}
          placeholder="-"
          onChange={e => onScoreChange(match, match.scoreA, e.target.value)}
          style={{ width: '24px', textAlign: 'center', fontSize: '11.5px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold' }}
        />
      </div>

    </div>
  );
}
