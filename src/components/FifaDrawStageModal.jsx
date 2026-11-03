import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Trophy, Play, Pause, FastForward, RotateCcw, Volume2, VolumeX, 
  Maximize2, Minimize2, X, Download, CheckCircle, Sparkles, 
  Layers, Users, ShieldAlert, Award, FileSpreadsheet, Eye
} from 'lucide-react';
import Confetti from 'react-confetti';
import { 
  prepare34Teams, 
  prepareRegisteredTeams, 
  shuffleArray, 
  createSignmar34Draw,
  exportFifaDrawResultsExcel 
} from '../services/signmarTournamentService';

// ==================== WEB AUDIO SYNTHESIZER ====================
// Không phụ thuộc file âm thanh bên ngoài - chạy mượt 100% trên mọi trình duyệt
class DrawAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Tiếng bóng lăn xào xạc trong lồng cầu
  playBowlSpin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.7);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {}
  }

  // Tiếng hồi hộp tăng tiến khi bóng bay lên
  playTensionBuild() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.6);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  // Tiếng bóng vàng nổ mở lá thăm
  playBallPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High ping
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // Tiếng Fanfare hợp âm hoàng gia khi cặp đấu đối đầu được chốt
  playClashFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Hợp âm Đô trưởng C-E-G-C5
      const freqs = [261.63, 329.63, 392.00, 523.25];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.15, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + idx * 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + 0.9 + idx * 0.05);
      });
    } catch (e) {}
  }

  // Hồi chuông chiến thắng hoàn thành toàn bộ bốc thăm
  playGrandTriumph() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2 + idx * 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + 1.3 + idx * 0.08);
      });
    } catch (e) {}
  }
}

const audio = new DrawAudioEngine();

export default function FifaDrawStageModal({
  isOpen,
  onClose,
  tournament,
  sportName = 'Bóng Chuyền',
  inputTeams = [],
  drawMode = 'signmar_34',
  drawDataSource = 'all_34_classes',
  onApplyBracket = null
}) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Danh sách các đội chuẩn bị cho lễ bốc thăm
  const [teamsPool, setTeamsPool] = useState([]);
  const [drawnList, setDrawnList] = useState([]); // Danh sách các đội đã bốc (theo thứ tự)
  const [matchups, setMatchups] = useState([]);   // Danh sách các cặp đấu đã hình thành

  // Trạng thái hoạt cảnh
  const [drawState, setDrawState] = useState('IDLE'); // 'IDLE', 'SPINNING', 'REVEAL_BALL', 'REVEAL_TEAM', 'CLASH', 'COMPLETED'
  const [activeBall, setActiveBall] = useState(null); // Đội vừa được bốc ra
  const [currentSlot, setCurrentSlot] = useState(1);  // Số thăm hiện tại (1 -> N)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimerRef = useRef(null);

  // Cặp đấu đang diễn ra bốc thăm
  const [currentPairTeamA, setCurrentPairTeamA] = useState(null);
  const [currentPairTeamB, setCurrentPairTeamB] = useState(null);
  const [currentMatchNumber, setCurrentMatchNumber] = useState(1);

  // Kích thước màn hình cho Confetti
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Khởi tạo danh sách đội
  useEffect(() => {
    if (isOpen) {
      audio.enabled = soundOn;
      initDrawPool();
    } else {
      stopAutoPlay();
    }
  }, [isOpen, drawDataSource, inputTeams]);

  const initDrawPool = () => {
    let pool = [];
    if (drawDataSource === 'registered_only') {
      pool = prepareRegisteredTeams(inputTeams);
      if (pool.length === 0) {
        pool = prepare34Teams(inputTeams);
      }
    } else {
      pool = prepare34Teams(inputTeams);
    }

    // Shuffle sẵn thứ tự ngẫu nhiên công tâm 100%
    const shuffled = shuffleArray(pool);
    setTeamsPool(shuffled);
    setDrawnList([]);
    setMatchups([]);
    setDrawState('IDLE');
    setActiveBall(null);
    setCurrentSlot(1);
    setCurrentPairTeamA(null);
    setCurrentPairTeamB(null);
    setCurrentMatchNumber(1);
    stopAutoPlay();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audio.enabled = next;
    if (next) audio.init();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // ==================== BỐC THĂM 1 BÓNG TIẾP THEO ====================
  const drawNextBall = () => {
    if (drawnList.length >= teamsPool.length) {
      setDrawState('COMPLETED');
      stopAutoPlay();
      audio.playGrandTriumph();
      return;
    }

    const nextTeam = teamsPool[drawnList.length];
    const drawNo = drawnList.length + 1;
    const teamWithDraw = { ...nextTeam, drawNo };

    // BẮT ĐẦU HOẠT CẢNH
    setDrawState('SPINNING');
    audio.playBowlSpin();

    setTimeout(() => {
      // BÓNG BAY LÊN TÂM MÀN HÌNH
      setDrawState('REVEAL_BALL');
      setActiveBall(teamWithDraw);
      audio.playTensionBuild();

      setTimeout(() => {
        // MỞ NẮP BÓNG & CÔNG BỐ CHI ĐOÀN
        setDrawState('REVEAL_TEAM');
        audio.playBallPop();

        // Xử lý ghép cặp đấu
        if (!currentPairTeamA) {
          // Đây là Đội A của cặp đấu
          setCurrentPairTeamA(teamWithDraw);
          setDrawnList(prev => [...prev, teamWithDraw]);
        } else {
          // Đây là Đội B -> Chốt cặp đấu!
          setCurrentPairTeamB(teamWithDraw);
          setDrawnList(prev => [...prev, teamWithDraw]);

          setTimeout(() => {
            setDrawState('CLASH');
            audio.playClashFanfare();

            // Thêm cặp đấu vào danh sách
            const newMatch = {
              matchNumber: currentMatchNumber,
              roundName: getRoundNameForMatch(currentMatchNumber, teamsPool.length),
              teamA: currentPairTeamA,
              teamB: teamWithDraw,
              branchName: (currentPairTeamA.drawNo <= teamsPool.length / 2) ? 'Nhánh Trên (A)' : 'Nhánh Dưới (B)'
            };
            setMatchups(prev => [...prev, newMatch]);

            setTimeout(() => {
              // Hoàn tất 1 cặp đấu, chuẩn bị cho cặp tiếp theo
              setCurrentPairTeamA(null);
              setCurrentPairTeamB(null);
              setCurrentMatchNumber(prev => prev + 1);

              if (drawnList.length + 1 >= teamsPool.length) {
                setDrawState('COMPLETED');
                stopAutoPlay();
                audio.playGrandTriumph();
              } else {
                setDrawState('IDLE');
              }
            }, isAutoPlaying ? 1600 : 1200);

          }, 1000);
        }

      }, 1100);

    }, 800);
  };

  const getRoundNameForMatch = (matchIdx, totalTeams) => {
    if (totalTeams === 34) {
      if (matchIdx === 1) return 'Vòng Sơ Loại 1 (Nhánh Trên)';
      if (matchIdx === 2) return 'Vòng Sơ Loại 2 (Nhánh Dưới)';
      return `Trận ${matchIdx - 2} - Vòng 1/16`;
    }
    return `Trận ${matchIdx} - Vòng 1/16`;
  };

  // ==================== CHẾ ĐỘ AUTO-PLAY ====================
  const startAutoPlay = () => {
    setIsAutoPlaying(true);
    audio.init();
    if (drawState === 'IDLE' || drawState === 'COMPLETED') {
      if (drawState === 'COMPLETED') {
        initDrawPool();
      }
    }
  };

  const stopAutoPlay = () => {
    setIsAutoPlaying(false);
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isAutoPlaying) {
      if (drawState === 'IDLE') {
        autoPlayTimerRef.current = setTimeout(() => {
          drawNextBall();
        }, 1200);
      }
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, drawState, drawnList.length]);

  // Tua nhanh bốc toàn bộ tức thì
  const handleFastDrawAll = () => {
    stopAutoPlay();
    audio.init();
    audio.playGrandTriumph();

    const allDrawn = teamsPool.map((team, idx) => ({ ...team, drawNo: idx + 1 }));
    const allMatches = [];
    for (let i = 0; i < allDrawn.length; i += 2) {
      if (i + 1 < allDrawn.length) {
        allMatches.push({
          matchNumber: Math.floor(i / 2) + 1,
          roundName: getRoundNameForMatch(Math.floor(i / 2) + 1, teamsPool.length),
          teamA: allDrawn[i],
          teamB: allDrawn[i + 1],
          branchName: allDrawn[i].drawNo <= allDrawn.length / 2 ? 'Nhánh Trên (A)' : 'Nhánh Dưới (B)'
        });
      }
    }
    setDrawnList(allDrawn);
    setMatchups(allMatches);
    setDrawState('COMPLETED');
    setCurrentPairTeamA(null);
    setCurrentPairTeamB(null);
  };

  // Xuất Excel Biên Bản
  const handleExportExcel = () => {
    exportFifaDrawResultsExcel(tournament, sportName, matchups);
  };

  // Áp dụng lưu vào hệ thống Sơ đồ thi đấu
  const handleApplyDraw = () => {
    if (onApplyBracket) {
      if (drawMode === 'signmar_34') {
        const fullSignmar = createSignmar34Draw(teamsPool, {
          sportName,
          tournamentName: tournament?.name,
          shuffledTeams: drawnList.length === 34 ? drawnList : teamsPool
        });
        onApplyBracket(fullSignmar);
      } else {
        onApplyBracket({ type: 'knockout', matchups });
      }
      alert('✅ Đã lưu kết quả bốc thăm thành công vào Sơ Đồ Thi Đấu của Ban Tổ Chức!');
      onClose();
    }
  };

  if (!isOpen) return null;

  const remainingCount = teamsPool.length - drawnList.length;
  const progressPercent = Math.round((drawnList.length / (teamsPool.length || 1)) * 100);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse at center, #0e172a 0%, #060b18 60%, #020409 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* HIỆU ỨNG PHÁO HOA KHI HOÀN THÀNH */}
      {drawState === 'COMPLETED' && (
        <Confetti 
          width={windowSize.width} 
          height={windowSize.height} 
          numberOfPieces={400} 
          recycle={false}
          colors={['#f59e0b', '#fbbf24', '#fcd34d', '#3b82f6', '#10b981', '#ec4899', '#ffffff']}
        />
      )}

      {/* TOP BAR / HEADER */}
      <header style={{
        padding: '12px 24px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* LOGO & TITLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)'
          }}>
            <Trophy size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '10.5px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '999px',
                letterSpacing: '0.5px',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}>
                🔴 LIVE CEREMONY
              </span>
              <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                FIFA DRAW STAGE • {sportName.toUpperCase()}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.3px' }}>
              LỄ BỐC THĂM CHIA CẶP ĐẤU HỘI THAO CHÍNH THỨC (2026 - 2027)
            </h1>
          </div>
        </div>

        {/* PROGRESS INFO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', display: 'none', mdDisplay: 'block' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Tiến độ bốc thăm</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>
              {drawnList.length} / {teamsPool.length} Đội ({progressPercent}%)
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleSound}
              style={{
                background: soundOn ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                border: '1px solid ' + (soundOn ? '#3b82f6' : '#64748b'),
                color: soundOn ? '#60a5fa' : '#94a3b8',
                borderRadius: '8px',
                padding: '7px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '600'
              }}
              title={soundOn ? 'Đang bật âm thanh' : 'Đang tắt âm thanh'}
            >
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundOn ? 'Âm thanh' : 'Tắt tiếng'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                borderRadius: '8px',
                padding: '7px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '600'
              }}
              title="Toàn màn hình để quay video sắc nét nhất"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                borderRadius: '8px',
                padding: '7px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              <X size={16} /> Đóng
            </button>
          </div>
        </div>
      </header>

      {/* MAIN STAGE ARENA */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: windowSize.width > 980 ? '1fr 390px' : '1fr',
        gap: '20px',
        padding: '20px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* LEFT COLUMN: THE CENTRAL FIFA DRAW PODIUM & BALLS */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'radial-gradient(circle at 50% 40%, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.6) 70%)',
          borderRadius: '24px',
          border: '1.5px solid rgba(245, 158, 11, 0.2)',
          boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.8), 0 20px 50px rgba(0, 0, 0, 0.5)',
          padding: '25px',
          overflow: 'hidden'
        }}>
          {/* SPOTLIGHT GLOW BACKGROUND */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }} />

          {/* CURRENT PAIR BATTLE BANNER */}
          <div style={{
            width: '100%',
            maxWidth: '680px',
            marginBottom: '24px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '16px',
            padding: '14px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#fbbf24', letterSpacing: '1px', marginBottom: '10px' }}>
              ⚔️ {getRoundNameForMatch(currentMatchNumber, teamsPool.length).toUpperCase()}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px' }}>
              {/* ĐỘI A */}
              <div style={{
                background: currentPairTeamA ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(15, 23, 42, 0.9))' : 'rgba(255,255,255,0.03)',
                border: '1.5px solid ' + (currentPairTeamA ? '#38bdf8' : 'rgba(255,255,255,0.1)'),
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'center',
                boxShadow: currentPairTeamA ? '0 0 18px rgba(56, 189, 248, 0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                  {currentPairTeamA ? `MÃ THĂM #${currentPairTeamA.drawNo}` : 'ĐỘI A (Chờ bốc thăm)'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: currentPairTeamA ? '#38bdf8' : '#64748b' }}>
                  {currentPairTeamA ? currentPairTeamA.name : '???'}
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentPairTeamA?.captain || (currentPairTeamA ? 'Chưa có ĐT' : 'Đang quay lồng...')}
                </div>
              </div>

              {/* VS ICON */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
                border: '2px solid #ffffff'
              }}>
                VS
              </div>

              {/* ĐỘI B */}
              <div style={{
                background: currentPairTeamB ? 'linear-gradient(135deg, rgba(180, 83, 9, 0.6), rgba(15, 23, 42, 0.9))' : 'rgba(255,255,255,0.03)',
                border: '1.5px solid ' + (currentPairTeamB ? '#fbbf24' : 'rgba(255,255,255,0.1)'),
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'center',
                boxShadow: currentPairTeamB ? '0 0 18px rgba(251, 191, 36, 0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                  {currentPairTeamB ? `MÃ THĂM #${currentPairTeamB.drawNo}` : 'ĐỘI B (Chờ bốc thăm)'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: currentPairTeamB ? '#fbbf24' : '#64748b' }}>
                  {currentPairTeamB ? currentPairTeamB.name : '???'}
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentPairTeamB?.captain || (currentPairTeamB ? 'Chưa có ĐT' : 'Đang quay lồng...')}
                </div>
              </div>
            </div>
          </div>

          {/* THE 3D GOLDEN BOWL & BALL ARENA */}
          <div style={{
            position: 'relative',
            width: '320px',
            height: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            {/* GLASS BOWL CONTAINER */}
            <div style={{
              width: '260px',
              height: '190px',
              borderRadius: '0 0 130px 130px',
              background: 'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.18) 0%, rgba(30,58,138,0.2) 60%, rgba(15,23,42,0.7) 100%)',
              border: '3px solid rgba(245, 158, 11, 0.5)',
              borderTop: '5px solid #fbbf24',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7), inset 0 0 35px rgba(245, 158, 11, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* GLASS REFLECTION CURVE */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '20px',
                width: '60px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                filter: 'blur(6px)',
                transform: 'rotate(-25deg)',
                pointerEvents: 'none'
              }} />

              {/* REMAINING GOLDEN BALLS JIGGLING INSIDE */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '8px',
                padding: '20px',
                alignItems: 'flex-end',
                height: '100%',
                opacity: drawState === 'COMPLETED' ? 0.2 : 1
              }}>
                {Array.from({ length: Math.min(18, remainingCount) }).map((_, i) => (
                  <div 
                    key={i}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 30%, #fef08a 0%, #f59e0b 50%, #92400e 100%)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.5)',
                      border: '1px solid #fde047',
                      animation: (drawState === 'SPINNING') ? `bounce ${0.2 + (i % 5) * 0.05}s infinite alternate ease-in-out` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#78350f'
                    }}
                  >
                    ⚽
                  </div>
                ))}
              </div>
            </div>

            {/* BOWL METALLIC STAND */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              width: '160px',
              height: '16px',
              background: 'linear-gradient(90deg, #92400e 0%, #f59e0b 50%, #92400e 100%)',
              borderRadius: '6px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.6)',
              border: '1px solid #fde047'
            }} />

            {/* BALL ELEVATING / REVEALING IN CENTER STAGE */}
            {(drawState === 'REVEAL_BALL' || drawState === 'REVEAL_TEAM') && activeBall && (
              <div style={{
                position: 'absolute',
                top: '-40px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: 'scaleUpBall 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
              }}>
                {/* 3D GOLDEN BALL SPLIT */}
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, #fef9c3 0%, #f59e0b 45%, #78350f 100%)',
                  boxShadow: '0 0 50px rgba(245, 158, 11, 0.8), 0 15px 30px rgba(0,0,0,0.6)',
                  border: '2px solid #fde047',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '32px' }}>🏆</span>
                </div>

                {/* THE UNVEILED CLASS BANNER */}
                {drawState === 'REVEAL_TEAM' && (
                  <div style={{
                    marginTop: '16px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                    border: '2px solid #fbbf24',
                    borderRadius: '16px',
                    padding: '16px 28px',
                    textAlign: 'center',
                    boxShadow: '0 20px 45px rgba(0,0,0,0.7), 0 0 30px rgba(251, 191, 36, 0.4)',
                    animation: 'slideUpBanner 0.4s ease-out forwards',
                    minWidth: '280px'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      background: activeBall.grade === 'Khối 10' ? '#059669' : (activeBall.grade === 'Khối 11' ? '#7c3aed' : '#dc2626'),
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 12px',
                      borderRadius: '999px',
                      marginBottom: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      {activeBall.grade} • MÃ THĂM #{activeBall.drawNo}
                    </div>

                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24', letterSpacing: '0.5px' }}>
                      CHI ĐOÀN {activeBall.name}
                    </div>

                    <div style={{ fontSize: '13px', color: '#f1f5f9', marginTop: '4px', fontWeight: '600' }}>
                      {activeBall.captain ? `Đội trưởng: ${activeBall.captain}` : (activeBall.isRegistered ? 'Đã hoàn tất đăng ký' : '⚠️ Lớp chưa nộp (Chờ bổ sung)')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* REMAINING BALLS COUNTER */}
          <div style={{
            fontSize: '12.5px',
            color: '#94a3b8',
            marginBottom: '18px',
            background: 'rgba(255,255,255,0.05)',
            padding: '4px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            Số bóng trong lồng: <strong style={{ color: '#fbbf24' }}>{remainingCount}</strong> quả còn lại
          </div>

          {/* CONTROLLER DECK */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            {/* NÚT BỐC THĂM 1 QUẢ THỦ CÔNG */}
            <button
              onClick={drawNextBall}
              disabled={drawState !== 'IDLE' || remainingCount === 0}
              style={{
                padding: '12px 24px',
                background: remainingCount === 0 
                  ? '#475569' 
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14.5px',
                cursor: (drawState === 'IDLE' && remainingCount > 0) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: (drawState === 'IDLE' && remainingCount > 0) ? '0 0 25px rgba(245, 158, 11, 0.5)' : 'none',
                opacity: (drawState === 'IDLE' && remainingCount > 0) ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={18} /> Bốc Quả Tiếp Theo
            </button>

            {/* NÚT TỰ ĐỘNG BỐC THĂM (AUTO-PLAY CHO QUAY VIDEO) */}
            <button
              onClick={isAutoPlaying ? stopAutoPlay : startAutoPlay}
              disabled={remainingCount === 0 && !isAutoPlaying}
              style={{
                padding: '12px 24px',
                background: isAutoPlaying 
                  ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
                  : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isAutoPlaying ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 0 25px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              {isAutoPlaying ? (
                <>
                  <Pause size={18} /> Tạm Dừng Tự Động
                </>
              ) : (
                <>
                  <Play size={18} /> 🎬 Bắt Đầu Tự Động (Quay Video)
                </>
              )}
            </button>

            {/* NÚT TUA NHANH TOÀN BỘ */}
            <button
              onClick={handleFastDrawAll}
              disabled={remainingCount === 0}
              style={{
                padding: '12px 18px',
                background: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: remainingCount > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Bốc toàn bộ các cặp đấu ngay tức thì"
            >
              <FastForward size={16} /> Bốc Hết Ngay
            </button>

            {/* NÚT BỐC LẠI TỪ ĐẦU */}
            <button
              onClick={initDrawPool}
              style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Thiết lập lại từ đầu"
            >
              <RotateCcw size={16} /> Bốc Lại
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE MATCH BOARD & ACTIONS */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: '24px',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          padding: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* BOARD TITLE */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 'bold', fontSize: '15px' }}>
              <Layers size={18} color="#38bdf8" /> BẢNG KẾT QUẢ BỐC THĂM ({matchups.length} Cặp)
            </div>
            <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold' }}>
              {drawnList.length} / {teamsPool.length} Đội
            </div>
          </div>

          {/* SCROLLABLE MATCH LIST */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {matchups.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 15px',
                color: '#64748b',
                fontSize: '13px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚽</div>
                Chưa có cặp đấu nào được chốt.<br />
                Hãy bấm <strong>"Bốc Quả Tiếp Theo"</strong> hoặc <strong>"Bắt Đầu Tự Động"</strong> để bắt đầu lễ bốc thăm!
              </div>
            ) : (
              matchups.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: idx === matchups.length - 1 ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.9))' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid ' + (idx === matchups.length - 1 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.08)'),
                    borderRadius: '12px',
                    padding: '10px 14px',
                    boxShadow: idx === matchups.length - 1 ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none',
                    animation: idx === matchups.length - 1 ? 'pulseGlow 2s infinite' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24' }}>
                      {m.roundName}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {m.branchName}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px' }}>
                    {/* TEAM A */}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#38bdf8' }}>
                        {m.teamA.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.teamA.captain || m.teamA.grade}
                      </div>
                    </div>

                    {/* VS */}
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#f87171', padding: '0 4px' }}>
                      ⚔️
                    </div>

                    {/* TEAM B */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#fbbf24' }}>
                        {m.teamB.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.teamB.captain || m.teamB.grade}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div style={{
            marginTop: '14px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={handleExportExcel}
              disabled={matchups.length === 0}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: matchups.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: matchups.length > 0 ? 1 : 0.5
              }}
            >
              <FileSpreadsheet size={16} /> 📥 Xuất Biên Bản Bốc Thăm (Excel)
            </button>

            {onApplyBracket && (
              <button
                onClick={handleApplyDraw}
                disabled={matchups.length === 0}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: matchups.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: matchups.length > 0 ? 1 : 0.5
                }}
              >
                <CheckCircle size={16} /> 💾 Áp Dụng & Lưu Vào Sơ Đồ Thi Đấu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KEYFRAME ANIMATIONS INLINE STYLE */}
      <style>{`
        @keyframes scaleUpBall {
          0% { transform: scale(0.2) translateY(80px); opacity: 0; }
          60% { transform: scale(1.25) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes slideUpBanner {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.2); }
          50% { box-shadow: 0 0 24px rgba(245, 158, 11, 0.6); }
        }
      `}</style>
    </div>
  );
}
