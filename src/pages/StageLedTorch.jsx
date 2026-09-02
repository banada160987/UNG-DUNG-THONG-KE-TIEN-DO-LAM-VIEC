import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, Sparkles, Maximize, Volume2, VolumeX, Radio, Trophy, Star } from 'lucide-react';

export default function StageLedTorch() {
  // STEP STATES:
  // 0: IDLE
  // 1: LIT_1 (BGH)
  // 2: FLYING_1_TO_2
  // 3: LIT_2 (1996-2000)
  // 4: FLYING_2_TO_3
  // 5: LIT_3 (2001-2010)
  // 6: FLYING_3_TO_4
  // 7: LIT_4 (2011-2020)
  // 8: FLYING_4_TO_5
  // 9: LIT_5 (Học sinh 2023-2026)
  // 10: SOARING_TO_SKY (Fireball rockets up from Person 5 to High Sky Center)
  // 11: GRAND_BURST_30_YEARS (Fireworks Galaxy Burst & Golden 30th Anniversary Welcome Banner!)

  const [activeStep, setActiveStep] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const flyProgressRef = useRef(0);

  // 5 PHYSICAL STAGE NODES (Stage Standing Positions: Left -> Right)
  const stageNodes = [
    { id: 1, label: 'Thầy Cô & BGH', sub: 'Khởi nguồn 1996', color: '#ef4444', xRatio: 0.15, yRatio: 0.62 },
    { id: 2, label: 'Khóa 1 (1996-2000)', sub: 'Tiếp nối Khát Vọng', color: '#f97316', xRatio: 0.32, yRatio: 0.62 },
    { id: 3, label: 'Khóa (2001-2010)', sub: 'Thập kỷ Tri Thức', color: '#f59e0b', xRatio: 0.50, yRatio: 0.62 },
    { id: 4, label: 'Khóa (2011-2020)', sub: 'Vươn Xa & Trưởng Thành', color: '#eab308', xRatio: 0.68, yRatio: 0.62 },
    { id: 5, label: 'Học Sinh Hiện Tại', sub: 'Thắp Sáng Tương Lai', color: '#22c55e', xRatio: 0.85, yRatio: 0.62 }
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

  // 2. CANVAS RENDERING: FLYING FIREBALL ARC & CONTINUOUS SKY FIREWORKS GALAXY
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
    const trailParticles = [];
    const fireworkSparks = [];

    // Ambient background particle
    class AmbientParticle {
      constructor() { this.reset(); }
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

    // Firework Explosion Spark
    class FireworkSpark {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 6 + 2;
        this.life = Math.random() * 70 + 30;
        this.maxLife = this.life;
        const colors = ['rgba(254, 240, 138, ', 'rgba(245, 158, 11, ', 'rgba(239, 68, 68, ', 'rgba(225, 29, 72, ', 'rgba(255, 255, 255, '];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.06; // Gravity
        this.life--;
      }
      draw() {
        if (this.life <= 0) return;
        const opacity = Math.max(0, this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();
      }
    }

    for (let i = 0; i < 90; i++) {
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

      if (activeStep >= 10) {
        bgGrad.addColorStop(0, 'rgba(180, 83, 9, 0.55)');
        bgGrad.addColorStop(0.5, 'rgba(153, 27, 27, 0.45)');
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
      // 1. HORIZONTAL FLYING FIREBALL ARC (Person 1 -> 2 -> 3 -> 4 -> 5)
      // ----------------------------------------------------
      let flyingFromIdx = -1;
      let flyingToIdx = -1;

      if (activeStep === 2) { flyingFromIdx = 0; flyingToIdx = 1; }
      else if (activeStep === 4) { flyingFromIdx = 1; flyingToIdx = 2; }
      else if (activeStep === 6) { flyingFromIdx = 2; flyingToIdx = 3; }
      else if (activeStep === 8) { flyingFromIdx = 3; flyingToIdx = 4; }

      if (flyingFromIdx !== -1 && flyingToIdx !== -1) {
        if (flyProgressRef.current < 1.0) {
          flyProgressRef.current += 0.018; // ~1.8s
          if (flyProgressRef.current >= 1.0) {
            flyProgressRef.current = 1.0;
            const nextLitStep = activeStep + 1;
            setActiveStep(nextLitStep);
            playAudioFx();
          }
        }

        const t = flyProgressRef.current;
        const p0 = { x: stageNodes[flyingFromIdx].xRatio * width, y: stageNodes[flyingFromIdx].yRatio * height - 60 };
        const p1 = { x: stageNodes[flyingToIdx].xRatio * width, y: stageNodes[flyingToIdx].yRatio * height - 60 };
        const pCtrl = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - 140 };

        const currX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * pCtrl.x + t * t * p1.x;
        const currY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * pCtrl.y + t * t * p1.y;

        const vx = 2 * (1 - t) * (pCtrl.x - p0.x) + 2 * t * (p1.x - pCtrl.x);
        const vy = 2 * (1 - t) * (pCtrl.y - p0.y) + 2 * t * (p1.y - pCtrl.y);
        const norm = Math.hypot(vx, vy) || 1;

        for (let i = 0; i < 6; i++) {
          trailParticles.push(new TrailParticle(
            currX + (Math.random() - 0.5) * 12,
            currY + (Math.random() - 0.5) * 12,
            -(vx / norm) * (Math.random() * 3 + 1),
            -(vy / norm) * (Math.random() * 3 + 1),
            Math.random() * 10 + 6
          ));
        }

        ctx.beginPath();
        ctx.arc(currX, currY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();
      }

      // ----------------------------------------------------
      // 2. STEP 10 & STEP 11: SOARING FIREBALL TO HIGH SKY & CONTINUOUS FIREWORKS
      // ----------------------------------------------------
      if (activeStep === 10 || activeStep === 11) {
        if (activeStep === 10) {
          if (flyProgressRef.current < 1.0) {
            flyProgressRef.current += 0.025; // ~1.3s flight
            if (flyProgressRef.current >= 1.0) {
              flyProgressRef.current = 1.0;
              // Transition to Step 11 for fireworks burst & banner
              setActiveStep(11);
              playAudioFx();
            }
          }
        } else {
          flyProgressRef.current = 1.0;
        }

        const t = flyProgressRef.current;
        const pStart = { x: stageNodes[4].xRatio * width, y: stageNodes[4].yRatio * height - 60 };
        const pSky = { x: width / 2, y: height * 0.20 };
        const pSkyCtrl = { x: (pStart.x + pSky.x) / 2 + 60, y: Math.min(pStart.y, pSky.y) - 60 };

        const soarX = (1 - t) * (1 - t) * pStart.x + 2 * (1 - t) * t * pSkyCtrl.x + t * t * pSky.x;
        const soarY = (1 - t) * (1 - t) * pStart.y + 2 * (1 - t) * t * pSkyCtrl.y + t * t * pSky.y;

        // Trail particles during soaring
        if (t < 1.0) {
          for (let i = 0; i < 8; i++) {
            trailParticles.push(new TrailParticle(
              soarX + (Math.random() - 0.5) * 14,
              soarY + (Math.random() - 0.5) * 14,
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.5) * 4 + 2,
              Math.random() * 12 + 6,
              'rgba(254, 240, 138, '
            ));
          }

          ctx.beginPath();
          ctx.arc(soarX, soarY, 24, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 50;
          ctx.shadowColor = '#f59e0b';
          ctx.fill();
        }

        // CONTINUOUS FIREWORKS SPARKS IN STEP 11
        if (activeStep === 11) {
          // Spawn 3-5 sparks per frame around sky center
          for (let i = 0; i < 4; i++) {
            const rx = width / 2 + (Math.random() - 0.5) * (width * 0.4);
            const ry = height * 0.22 + (Math.random() - 0.5) * 100;
            fireworkSparks.push(new FireworkSpark(rx, ry));
          }
        }
      }

      // Update & Draw Trail & Firework Sparks
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const tp = trailParticles[i];
        tp.update();
        tp.draw();
        if (tp.life <= 0) trailParticles.splice(i, 1);
      }

      for (let i = fireworkSparks.length - 1; i >= 0; i--) {
        const fs = fireworkSparks[i];
        fs.update();
        fs.draw();
        if (fs.life <= 0) fireworkSparks.splice(i, 1);
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

  const isNodeLit = (nodeId) => {
    if (activeStep >= 11) return true; // BURST ALL AT GRAND FINALE
    if (nodeId === 1 && (activeStep === 1 || activeStep === 2)) return true;
    if (nodeId === 2 && (activeStep === 3 || activeStep === 4)) return true;
    if (nodeId === 3 && (activeStep === 5 || activeStep === 6)) return true;
    if (nodeId === 4 && (activeStep === 7 || activeStep === 8)) return true;
    if (nodeId === 5 && (activeStep === 9 || activeStep === 10)) return true;
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
        @keyframes bannerScaleUp {
          0% { transform: scale(0.6) translateY(30px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3" preload="auto" />
      <canvas ref={canvasRef} style={styles.canvasBackground} />

      {/* TOP CONTROL BAR */}
      <div style={styles.topControlBar} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
          <Radio size={16} color={isConnected ? '#22c55e' : '#ef4444'} />
          <span>Sân khấu LED Realtime: <strong style={{ color: isConnected ? '#4ade80' : '#f87171' }}>{isConnected ? 'ONLINE' : 'OFFLINE'}</strong></span>
          <span style={{ marginLeft: '15px', color: '#fef08a', fontWeight: 'bold' }}>• STEP: {activeStep} / 11</span>
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
        
        {/* TOP TITLE BANNER (PROMINENT AT ALL STEPS) */}
        <div style={{ textAlign: 'center', marginTop: '10px', zIndex: 30, position: 'relative' }}>
          {activeStep >= 10 ? (
            /* GRAND ANNIVERSARY FINALE BANNER (STEP 10 & 11) */
            <div style={{ animation: 'bannerScaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 24px', borderRadius: '30px', backgroundColor: '#be123c', border: '2px solid #fef08a', boxShadow: '0 0 35px rgba(245, 158, 11, 0.8)', marginBottom: '12px' }}>
                <Trophy size={22} color="#fef08a" />
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  TRƯỜNG THPT CAO BÁ QUÁT • NĂM 1996 ✦ 2026
                </span>
              </div>

              <h1 style={{ margin: '6px 0', fontSize: '46px', fontWeight: '900', color: '#fef08a', textShadow: '0 0 35px rgba(245, 158, 11, 0.9), 0 3px 12px rgba(0,0,0,0.95)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {customTitle || 'CHÀO MỪNG ĐẠI LỄ KỶ NIỆM 30 NĂM THÀNH LẬP'}
              </h1>
              
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '2px', textShadow: '0 4px 18px rgba(0,0,0,0.9)', marginTop: '4px' }}>
                🔥 "THẮP SÁNG TRI THỨC - VỮNG BƯỚC TƯƠNG LAI" 🔥
              </div>
            </div>
          ) : (
            /* STANDARD STAGE HEADER BANNER (STEPS 0 - 9) */
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', color: '#fef08a', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                TRƯỜNG THPT CAO BÁ QUÁT • 30 NĂM PHÁT TRIỂN & CHẮP CÁNH MƠ ƯỚC
              </div>
              <h1 style={styles.mainTitle}>
                {customTitle || (
                  activeStep % 2 === 0 && activeStep > 0 ? '🚀 NGỌN LỬA THIÊNG ĐANG VÚT BAY TRAO NỐI TÍẾP...' :
                  activeStep > 0 ? '🔥 NGHI THỨC TRUYỀN LỬA THẾ HỆ THẦY & TRÒ' :
                  'NGHI THỨC TRUYỀN LỬA THẾ HỆ (1996 - 2026)'
                )}
              </h1>
            </div>
          )}
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
                  backgroundColor: lit ? 'rgba(185, 28, 28, 0.45)' : 'rgba(30, 41, 59, 0.5)',
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
                    {lit ? '🔥 ĐANG GIỮ LỬA' : `VỊ TRÍ 0${node.id}`}
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
            {activeStep >= 10 
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
    color: '#fef08a',
    textShadow: '0 0 25px rgba(245, 158, 11, 0.8), 0 2px 8px rgba(0,0,0,0.9)',
    letterSpacing: '1.2px',
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
