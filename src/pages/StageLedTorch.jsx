import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, Sparkles, Maximize, Volume2, VolumeX, ShieldCheck, Zap, RefreshCw, Trophy, Radio } from 'lucide-react';

export default function StageLedTorch() {
  const [torchState, setTorchState] = useState('idle'); // 'idle' | 'teacher' | 'alumni' | 'burst'
  const [activeCohort, setActiveCohort] = useState('ALL');
  const [customTitle, setCustomTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // COHORTS TIMELINE
  const cohorts = [
    { key: '1996-2000', label: 'Khóa 1 (1996 - 2000)', desc: 'Thắp sáng Khởi nguồn' },
    { key: '2001-2010', label: 'Thập kỷ Đầu (2001 - 2010)', desc: 'Tiếp nối Tri thức & Khát vọng' },
    { key: '2011-2020', label: 'Thập kỷ Thứ hai (2011 - 2020)', desc: 'Vươn xa & Trưởng thành' },
    { key: '2021-2026', label: 'Khóa Hiện tại (2021 - 2026)', desc: 'Thắp sáng Tương lai 30 Năm' }
  ];

  // 1. SUPABASE REALTIME BROADCAST SUBSCRIBER
  useEffect(() => {
    fetchInitialState();

    const channel = supabase.channel('cbq_torch_stage_channel')
      .on('broadcast', { event: 'TORCH_STATE_CHANGE' }, payload => {
        if (payload && payload.payload) {
          const { state, cohort, title } = payload.payload;
          if (state) setTorchState(state);
          if (cohort !== undefined) setActiveCohort(cohort);
          if (title !== undefined) setCustomTitle(title);
          playTriggerSound();
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchInitialState() {
    try {
      const local = localStorage.getItem('cbq_torch_current_state');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.state) setTorchState(parsed.state);
        if (parsed.cohort) setActiveCohort(parsed.cohort);
        if (parsed.title) setCustomTitle(parsed.title);
      }
    } catch (err) {
      console.warn("Lỗi đọc trạng thái ngọn lửa:", err);
    }
  }

  function playTriggerSound() {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }

  // 2. CANVAS HIGH-PERFORMANCE DYNAMIC PARTICLE FIRE EFFECT
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = [];
    const particleCount = torchState === 'burst' ? 250 : torchState === 'alumni' ? 180 : torchState === 'teacher' ? 120 : 60;

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = width / 2 + (Math.random() - 0.5) * (torchState === 'burst' ? width * 0.8 : 300);
        this.y = height + Math.random() * 50;
        this.vx = (Math.random() - 0.5) * (torchState === 'burst' ? 4 : 2);
        this.vy = -(Math.random() * 4 + 2) * (torchState === 'burst' ? 2 : 1.2);
        this.radius = Math.random() * (torchState === 'burst' ? 12 : 8) + 3;
        this.life = Math.random() * 100 + 50;
        this.maxLife = this.life;
        
        const colors = [
          'rgba(239, 68, 68, ',
          'rgba(245, 158, 11, ',
          'rgba(234, 179, 8, ',
          'rgba(225, 29, 72, '
        ];
        this.colorPrefix = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        if (this.life <= 0 || this.y < -50) {
          this.reset();
        }
      }

      draw() {
        const opacity = Math.max(0, this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.colorPrefix}${opacity})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width / 2, height / 2 + 100, 50,
        width / 2, height / 2, width / 1.2
      );

      if (torchState === 'burst') {
        gradient.addColorStop(0, 'rgba(180, 83, 9, 0.45)');
        gradient.addColorStop(0.5, 'rgba(153, 27, 27, 0.35)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      } else if (torchState === 'alumni') {
        gradient.addColorStop(0, 'rgba(217, 119, 6, 0.35)');
        gradient.addColorStop(0.5, 'rgba(127, 29, 29, 0.25)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      } else if (torchState === 'teacher') {
        gradient.addColorStop(0, 'rgba(185, 28, 28, 0.3)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      } else {
        gradient.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.99)');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [torchState]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullScreen(false);
      }
    }
  };

  return (
    <div style={styles.stageContainer}>
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); filter: drop-shadow(0 0 25px rgba(245, 158, 11, 0.8)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 45px rgba(239, 68, 68, 0.95)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 25px rgba(245, 158, 11, 0.8)); }
        }
        @keyframes floatTitle {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3" preload="auto" />
      <canvas ref={canvasRef} style={styles.canvasBackground} />

      {/* TOP BAR */}
      <div style={styles.topControlBar} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
          <Radio size={16} color={isConnected ? '#22c55e' : '#ef4444'} />
          <span>Sân khấu LED: <strong style={{ color: isConnected ? '#4ade80' : '#f87171' }}>{isConnected ? 'CONNECTED REALTIME' : 'OFFLINE'}</strong></span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setSoundEnabled(!soundEnabled)} style={styles.topBtn}>
            {soundEnabled ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} color="#ef4444" />}
          </button>
          <button onClick={toggleFullScreen} style={styles.topBtn}>
            <Maximize size={16} color="#f59e0b" /> {isFullScreen ? 'Thoát Fullscreen' : 'Màn hình LED Fullscreen'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={styles.stageContent}>
        <div style={{ textAlign: 'center', animation: 'floatTitle 4s ease-in-out infinite', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', color: '#fef08a', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            TRƯỜNG THPT CAO BÁ QUÁT • 30 NĂM PHÁT TRIỂN & CHẮP CÁNH MƠ ƯỚC
          </div>
          <h1 style={styles.stageMainHeading}>
            {customTitle || (
              torchState === 'burst' ? '🌟 THẮP SÁNG NGỌN LỬA THIÊNG 30 NĂM' :
              torchState === 'alumni' ? '⚡ TIẾP NỐI TRI THỨC & KHÁT VỌNG' :
              torchState === 'teacher' ? '🔥 KHỞI NGUỒN NGỌN LỬA THIÊNG' :
              'NGHI THỨC TRUYỀN LỬA THẾ HỆ'
            )}
          </h1>
        </div>

        <div style={styles.flameCenterWrapper}>
          <div style={{ animation: 'pulseGlow 2.5s ease-in-out infinite', display: 'inline-block' }}>
            {torchState === 'burst' ? (
              <div style={styles.burstIconBadge}>
                <Trophy size={110} color="#fef08a" />
              </div>
            ) : (
              <div style={styles.torchIconBadge}>
                <Flame size={ torchState === 'idle' ? 80 : torchState === 'teacher' ? 100 : 120 } color={torchState === 'idle' ? '#f59e0b' : '#ef4444'} />
              </div>
            )}
          </div>
        </div>

        {/* COHORTS GRID */}
        <div style={styles.cohortsGrid}>
          {cohorts.map((ch, idx) => {
            const isHighlighted = torchState === 'burst' || 
              (torchState === 'teacher' && idx === 0) || 
              (torchState === 'alumni' && (activeCohort === 'ALL' || activeCohort === ch.key));

            return (
              <div 
                key={ch.key} 
                style={{
                  ...styles.cohortCard,
                  backgroundColor: isHighlighted ? 'rgba(185, 28, 28, 0.45)' : 'rgba(30, 41, 59, 0.65)',
                  borderColor: isHighlighted ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
                  transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isHighlighted ? '0 10px 30px rgba(245, 158, 11, 0.4)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: isHighlighted ? '#fef08a' : '#94a3b8' }}>
                    GIAI ĐOẠN 0{idx + 1}
                  </span>
                  {isHighlighted && <Sparkles size={16} color="#fef08a" />}
                </div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: isHighlighted ? '#ffffff' : '#cbd5e1' }}>
                  {ch.label}
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: isHighlighted ? '#fef3c7' : '#94a3b8' }}>
                  {ch.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* FOOTER BANNER */}
        <div style={styles.stageFooterBanner}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#fef08a', textShadow: '0 2px 12px rgba(0,0,0,0.9)', letterSpacing: '1px' }}>
            {torchState === 'burst' ? '🎉 NĂM 1996 ➔ NĂM 2026: 30 NĂM TỰ HÀO CAO BÁ QUÁT!' : '🔥 KHẮC GHI ƠN THẦY • VƯƠNG TẦM TRI THỨC • VỮNG BƯỚC TƯƠNG LAI'}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  stageContainer: {
    position: 'relative',
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    fontFamily: "'Inter', sans-serif"
  },
  canvasBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1
  },
  topControlBar: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  topBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '12.5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  stageContent: {
    position: 'relative',
    zIndex: 5,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    alignItems: 'center',
    padding: '30px 20px',
    maxWidth: '1300px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  stageMainHeading: {
    margin: '8px 0 0 0',
    fontSize: '36px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 50%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  flameCenterWrapper: {
    margin: '20px 0',
    textAlign: 'center'
  },
  torchIconBadge: {
    padding: '30px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(245,158,11,0.1) 70%, transparent 100%)',
    border: '3px solid rgba(245, 158, 11, 0.5)',
    display: 'inline-flex',
    justify: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(4px)'
  },
  burstIconBadge: {
    padding: '35px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(239,68,68,0.3) 70%, transparent 100%)',
    border: '4px solid #fef08a',
    display: 'inline-flex',
    justify: 'center',
    alignItems: 'center',
    boxShadow: '0 0 60px rgba(254, 240, 138, 0.8)'
  },
  cohortsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    width: '100%',
    marginTop: '10px'
  },
  cohortCard: {
    borderRadius: '16px',
    padding: '18px 20px',
    border: '1.5px solid',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'left'
  },
  stageFooterBanner: {
    marginTop: '30px',
    textAlign: 'center',
    padding: '14px 30px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: '50px',
    border: '1.5px solid rgba(245, 158, 11, 0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)'
  }
};
