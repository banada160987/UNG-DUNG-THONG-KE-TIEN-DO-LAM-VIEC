import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, Sparkles, Maximize, Volume2, VolumeX, Radio, Trophy, Zap, ArrowRight, UserCheck } from 'lucide-react';

export default function StageLedTorch() {
  // STEP STATES:
  // 0: IDLE (Waiting)
  // 1: LIT_PERSON_1 (BGH / Cựu Giáo Viên)
  // 2: FLYING_1_TO_2 (Fireball flies Person 1 -> Person 2)
  // 3: LIT_PERSON_2 (Khóa 1996 - 2000)
  // 4: FLYING_2_TO_3 (Fireball flies Person 2 -> Person 3)
  // 5: LIT_PERSON_3 (Khóa 2001 - 2010)
  // 6: FLYING_3_TO_4 (Fireball flies Person 3 -> Person 4)
  // 7: LIT_PERSON_4 (Khóa 2011 - 2020)
  // 8: FLYING_4_TO_5 (Fireball flies Person 4 -> Person 5)
  // 9: LIT_PERSON_5 (Học Sinh Hiện Tại 2023 - 2026)
  // 10: BURST_ALL (Grand climax 30th Anniversary Flame Burst)

  const [activeStep, setActiveStep] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const flyProgressRef = useRef(0); // 0.0 to 1.0 for flying animation

  // 5 STAGE PERSON NODES (Physical Stage Position Mapping: Left to Right)
  const stageNodes = [
    { id: 1, label: 'Thầy Cô & BGH', sub: 'Khởi nguồn 1996', color: '#ef4444', xRatio: 0.15, yRatio: 0.58 },
    { id: 2, label: 'Khóa 1 (1996-2000)', sub: 'Tiếp nối Khát Vọng', color: '#f97316', xRatio: 0.32, yRatio: 0.58 },
    { id: 3, label: 'Khóa (2001-2010)', sub: 'Thập kỷ Tri Thức', color: '#f59e0b', xRatio: 0.50, yRatio: 0.58 },
    { id: 4, label: 'Khóa (2011-2020)', sub: 'Vươn Xa & Trưởng Thành', color: '#eab308', xRatio: 0.68, yRatio: 0.58 },
    { id: 5, label: 'Học Sinh Hiện Tại', sub: 'Thắp Sáng Tương Lai', color: '#22c55e', xRatio: 0.85, yRatio: 0.58 }
  ];

  // 1. LISTEN TO SUPABASE REALTIME BROADCAST & LOCALSTORAGE
  useEffect(() => {
    fetchInitialState();

    const channel = supabase.channel('cbq_torch_stage_channel')
      .on('broadcast', { event: 'TORCH_STEP_CHANGE' }, payload => {
        if (payload && payload.payload) {
          const { step, title } = payload.payload;
          if (step !== undefined) {
            triggerStepTransition(step);
          }
          if (title !== undefined) setCustomTitle(title);
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
      const local = localStorage.getItem('cbq_torch_current_step');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.step !== undefined) setActiveStep(parsed.step);
        if (parsed.title) setCustomTitle(parsed.title);
      }
    } catch (err) {
      console.warn("Lỗi đọc trạng thái:", err);
    }
  }

  function triggerStepTransition(targetStep) {
    flyProgressRef.current = 0;
    setActiveStep(targetStep);
    playAudioFx();
  }

  function playAudioFx() {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }

  // 2. CANVAS RENDERING: FLYING FIREBALL ARC & TRAIL PARTICLE ENGINE
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

    // Particles array for trail & ambient fire
    const particles = [];
    const trailParticles = [];

    // Ambient background particle
    class AmbientParticle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 20;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = -(Math.random() * 3 + 1);
        this.radius = Math.random() * 4 + 1.5;
        this.life = Math.random() * 80 + 40;
        this.maxLife = this.life;
        this.color = Math.random() > 0.5 ? 'rgba(245, 158, 11, ' : 'rgba(239, 68, 68, ';
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0 || this.y < -20) this.reset();
      }
      draw() {
        const opacity = Math.max(0, this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${opacity * 0.6})`;
        ctx.fill();
      }
    }

    // Flying Fireball Trail Particle
    class TrailParticle {
      constructor(x, y, vx, vy, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx + (Math.random() - 0.5) * 3;
        this.vy = vy + (Math.random() - 0.5) * 3;
        this.radius = size * (Math.random() * 0.6 + 0.4);
        this.life = Math.random() * 30 + 20;
        this.maxLife = this.life;
        this.color = color || 'rgba(254, 240, 138, ';
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.radius *= 0.95;
        this.life--;
      }
      draw() {
        if (this.life <= 0) return;
        const opacity = Math.max(0, this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.radius), 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${opacity})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();
      }
    }

    // Create 80 ambient background particles
    for (let i = 0; i < 80; i++) {
      particles.push(new AmbientParticle());
    }

    // Main Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Radial Dark Stage Glow Background
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 100,
        width / 2, height / 2, width / 1.1
      );

      if (activeStep === 10) { // BURST
        bgGrad.addColorStop(0, 'rgba(180, 83, 9, 0.45)');
        bgGrad.addColorStop(0.5, 'rgba(153, 27, 27, 0.35)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      } else if (activeStep > 0) {
        bgGrad.addColorStop(0, 'rgba(185, 28, 28, 0.25)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      } else {
        bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.3)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.99)');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Ambient Particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // ----------------------------------------------------
      // FLYING FIREBALL ARC ANIMATION BETWEEN STAGE NODES
      // ----------------------------------------------------
      let flyingFromIdx = -1;
      let flyingToIdx = -1;

      if (activeStep === 2) { flyingFromIdx = 0; flyingToIdx = 1; }
      else if (activeStep === 4) { flyingFromIdx = 1; flyingToIdx = 2; }
      else if (activeStep === 6) { flyingFromIdx = 2; flyingToIdx = 3; }
      else if (activeStep === 8) { flyingFromIdx = 3; flyingToIdx = 4; }

      if (flyingFromIdx !== -1 && flyingToIdx !== -1) {
        // Advance progress
        if (flyProgressRef.current < 1.0) {
          flyProgressRef.current += 0.018; // ~1.8 seconds flight time
          if (flyProgressRef.current >= 1.0) {
            flyProgressRef.current = 1.0;
            // Auto transition to lit state upon arrival!
            const nextLitStep = activeStep + 1;
            setActiveStep(nextLitStep);
            playAudioFx();
          }
        }

        const t = flyProgressRef.current;

        // Start & End Coordinates
        const p0 = { x: stageNodes[flyingFromIdx].xRatio * width, y: stageNodes[flyingFromIdx].yRatio * height - 60 };
        const p1 = { x: stageNodes[flyingToIdx].xRatio * width, y: stageNodes[flyingToIdx].yRatio * height - 60 };
        
        // Arc Control Point (Parabola curving upwards)
        const pCtrl = {
          x: (p0.x + p1.x) / 2,
          y: Math.min(p0.y, p1.y) - 140
        };

        // Quadratic Bezier Formula: B(t) = (1-t)^2 * P0 + 2(1-t)t * Pctrl + t^2 * P1
        const currX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * pCtrl.x + t * t * p1.x;
        const currY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * pCtrl.y + t * t * p1.y;

        // Tangent Velocity Vector
        const vx = 2 * (1 - t) * (pCtrl.x - p0.x) + 2 * t * (p1.x - pCtrl.x);
        const vy = 2 * (1 - t) * (pCtrl.y - p0.y) + 2 * t * (p1.y - pCtrl.y);
        const norm = Math.hypot(vx, vy) || 1;

        // Spawn 6 trailing fire particles at current fireball head
        for (let i = 0; i < 6; i++) {
          trailParticles.push(new TrailParticle(
            currX + (Math.random() - 0.5) * 12,
            currY + (Math.random() - 0.5) * 12,
            -(vx / norm) * (Math.random() * 3 + 1),
            -(vy / norm) * (Math.random() * 3 + 1),
            Math.random() * 10 + 6,
            Math.random() > 0.4 ? 'rgba(245, 158, 11, ' : 'rgba(239, 68, 68, '
          ));
        }

        // Draw Arc Pathway Guide Line (Glow Dotted Arc)
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(pCtrl.x, pCtrl.y, p1.x, p1.y);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Main Flying Fireball Head (Glowing Core)
        ctx.beginPath();
        ctx.arc(currX, currY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(currX, currY, 28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.fill();
      }

      // Update & Draw Trail Particles
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const tp = trailParticles[i];
        tp.update();
        tp.draw();
        if (tp.life <= 0) trailParticles.splice(i, 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeStep]);

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

  // Helper: Is Node Ignited?
  const isNodeLit = (nodeId) => {
    if (activeStep === 10) return true; // BURST ALL
    if (nodeId === 1 && activeStep >= 1) return true;
    if (nodeId === 2 && activeStep >= 3) return true;
    if (nodeId === 3 && activeStep >= 5) return true;
    if (nodeId === 4 && activeStep >= 7) return true;
    if (nodeId === 5 && activeStep >= 9) return true;
    return false;
  };

  return (
    <div style={styles.stageContainer}>
      <style>{`
        @keyframes flamePulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.8)); }
          50% { transform: scale(1.12); filter: drop-shadow(0 0 40px rgba(239, 68, 68, 0.95)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.8)); }
        }
        @keyframes burstGlow {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
      `}</style>

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3" preload="auto" />
      <canvas ref={canvasRef} style={styles.canvasBackground} />

      {/* TOP CONTROL BAR */}
      <div style={styles.topControlBar} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
          <Radio size={16} color={isConnected ? '#22c55e' : '#ef4444'} />
          <span>Sân khấu LED Realtime: <strong style={{ color: isConnected ? '#4ade80' : '#f87171' }}>{isConnected ? 'CONNECTED' : 'OFFLINE'}</strong></span>
          <span style={{ marginLeft: '15px', color: '#fef08a', fontWeight: 'bold' }}>• TRẠNG THÁI: STEP {activeStep}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setSoundEnabled(!soundEnabled)} style={styles.topBtn}>
            {soundEnabled ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} color="#ef4444" />}
          </button>
          <button onClick={toggleFullScreen} style={styles.topBtn}>
            <Maximize size={16} color="#f59e0b" /> {isFullScreen ? 'Thoát Fullscreen' : 'Toàn màn hình LED (Stage)'}
          </button>
        </div>
      </div>

      {/* MAIN STAGE OVERLAY */}
      <div style={styles.stageOverlay}>
        
        {/* HEADER TITLE BANNER */}
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', color: '#fef08a', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
            TRƯỜNG THPT CAO BÁ QUÁT • 30 NĂM PHÁT TRIỂN & CHẮP CÁNH MƠ ƯỚC
          </div>
          <h1 style={styles.mainTitle}>
            {customTitle || (
              activeStep === 10 ? '🌟 THẮP SÁNG NGỌN LỬA THIÊNG 30 NĂM!' :
              activeStep % 2 === 0 && activeStep > 0 ? '🚀 NGỌN LỬA THIÊNG ĐANG VÚT BAY TRAO NỐI TÍẾP...' :
              activeStep > 0 ? '🔥 NGHI THỨC TRUYỀN LỬA THẾ HỆ THẦY & TRÒ' :
              'NGHI THỨC TRUYỀN LỬA THẾ HỆ (1996 - 2026)'
            )}
          </h1>
        </div>

        {/* 5 PHYSICAL STAGE NODES (MAPPED TO STAGE STANDING POSITIONS) */}
        <div style={styles.nodesContainer}>
          {stageNodes.map((node) => {
            const lit = isNodeLit(node.id);
            return (
              <div key={node.id} style={styles.nodeItemWrapper}>
                
                {/* FLAME BADGE ABOVE PERSON */}
                <div style={{
                  ...styles.flameCircle,
                  backgroundColor: lit ? 'rgba(185, 28, 28, 0.4)' : 'rgba(30, 41, 59, 0.5)',
                  borderColor: lit ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                  boxShadow: lit ? `0 0 45px ${node.color}` : 'none',
                  animation: lit ? 'flamePulse 2s ease-in-out infinite' : 'none'
                }}>
                  {lit ? (
                    <Flame size={54} color="#fef08a" />
                  ) : (
                    <Flame size={36} color="rgba(255,255,255,0.25)" />
                  )}
                </div>

                {/* PERSON STAGE POSITION LABEL CARD */}
                <div style={{
                  ...styles.nodeLabelCard,
                  backgroundColor: lit ? 'rgba(185, 28, 28, 0.85)' : 'rgba(15, 23, 42, 0.75)',
                  borderColor: lit ? '#fef08a' : 'rgba(255,255,255,0.15)',
                  transform: lit ? 'scale(1.06)' : 'scale(1)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: lit ? '#fef08a' : '#94a3b8', textTransform: 'uppercase' }}>
                    {lit ? '✓ ĐÃ THẮP LỬA' : `VỊ TRÍ 0${node.id}`}
                  </div>
                  <h4 style={{ margin: '3px 0 2px 0', fontSize: '15px', fontWeight: '900', color: '#ffffff' }}>
                    {node.label}
                  </h4>
                  <div style={{ fontSize: '11.5px', color: lit ? '#fef3c7' : '#cbd5e1' }}>
                    {node.sub}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* FOOTER STAGE MESSAGE */}
        <div style={styles.stageFooter}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#fef08a', textShadow: '0 2px 14px rgba(0,0,0,0.9)', letterSpacing: '1px' }}>
            {activeStep === 10 
              ? '🎉 CHÀO MỪNG ĐẠI LỄ KỶ NIỆM 30 NĂM THÀNH LẬP TRƯỜNG THPT CAO BÁ QUÁT!' 
              : '🔥 THẮP SÁNG TRI THỨC • VƯƠNG TẦM KHÁT VỌNG • VỮNG BƯỚC TƯƠNG LAI'}
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
    zIndex: 20,
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
  stageOverlay: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box'
  },
  mainTitle: {
    margin: '6px 0 0 0',
    fontSize: '34px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 50%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  nodesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    width: '100%',
    maxWidth: '1350px',
    margin: 'auto 0',
    padding: '0 10px'
  },
  nodeItemWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justify: 'center'
  },
  flameCircle: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    marginBottom: '16px',
    backdropFilter: 'blur(6px)',
    transition: 'all 0.5s ease'
  },
  nodeLabelCard: {
    width: '100%',
    borderRadius: '14px',
    padding: '14px 12px',
    border: '1.5px solid',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.5s ease'
  },
  stageFooter: {
    textAlign: 'center',
    padding: '12px 30px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: '50px',
    border: '1.5px solid rgba(245, 158, 11, 0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)',
    marginBottom: '10px'
  }
};
