import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, Sparkles, Maximize, Volume2, VolumeX, Radio, Trophy, ArrowRight } from 'lucide-react';

export default function StageLedTorch() {
  // STAGE MODE: 2-PERSON DUAL SIDE STAGE CHOREOGRAPHY
  // STEP STATES:
  // 0: IDLE (Waiting)
  // 1: LIT_LEFT (Person 1 on Far Left holds the Sacred Flame)
  // 2: FLYING_LEFT_TO_RIGHT (Fireball launches high up into sky & lands on Person 2's hand on Far Right)
  // 3: LIT_RIGHT (Person 2 on Far Right holds the Sacred Flame)
  // 4: SOARING_TO_SKY (Fireball rockets up from Person 2 to High Sky Center)
  // 5: GRAND_BURST_30_YEARS (Fireworks Galaxy Burst & Golden 30th Anniversary Banner!)

  const [activeStep, setActiveStep] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // 2 PERSON CONFIGURATION (LEFT PERSON & RIGHT PERSON)
  const [personsConfig, setPersonsConfig] = useState([
    { id: 1, name: 'Đại diện Thế hệ Đi trước', title: 'Ban Giám Hiệu & Thầy Cô (1996)', sub: 'BÊN TRÁI SÂN SẤU', side: 'LEFT' },
    { id: 2, name: 'Đại diện Thế hệ Tiếp nối', title: 'Học Sinh Hiện Tại (Khóa 2023 - 2026)', sub: 'BÊN PHẢI SÂN SẤU', side: 'RIGHT' }
  ]);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const flyProgressRef = useRef(0);

  // LISTEN TO SUPABASE REALTIME BROADCAST & LOCALSTORAGE
  useEffect(() => {
    fetchInitialState();

    const channel = supabase.channel('cbq_torch_stage_channel')
      .on('broadcast', { event: 'TORCH_STEP_CHANGE' }, payload => {
        if (payload && payload.payload) {
          const { step, title, persons } = payload.payload;
          if (step !== undefined) triggerStepTransition(step);
          if (title !== undefined) setCustomTitle(title);
          if (persons && Array.isArray(persons)) setPersonsConfig(persons);
        }
      })
      .on('broadcast', { event: 'TORCH_PERSONS_CONFIG_CHANGE' }, payload => {
        if (payload && payload.payload && payload.payload.persons) {
          setPersonsConfig(payload.payload.persons);
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
        if (parsed.persons && Array.isArray(parsed.persons)) setPersonsConfig(parsed.persons);
      }

      const localPersons = localStorage.getItem('cbq_torch_persons_config');
      if (localPersons) {
        const parsedPersons = JSON.parse(localPersons);
        if (Array.isArray(parsedPersons) && parsedPersons.length >= 2) {
          setPersonsConfig(parsedPersons);
        }
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

  // Active Person: Step 1 & 2 -> Person Left (index 0); Step 3 & 4 -> Person Right (index 1)
  const activePersonObj = (activeStep === 1 || activeStep === 2) 
    ? personsConfig[0] 
    : (activeStep === 3 || activeStep === 4) 
    ? personsConfig[1] 
    : null;

  // CANVAS RENDERING: HIGH PARABOLIC FIREBALL FLIGHT FROM LEFT TO RIGHT
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
      constructor(x, y, vx, vy, size) {
        this.x = x;
        this.y = y;
        this.vx = vx + (Math.random() - 0.5) * 3;
        this.vy = vy + (Math.random() - 0.5) * 3;
        this.radius = size * (Math.random() * 0.6 + 0.4);
        this.life = Math.random() * 35 + 20;
        this.maxLife = this.life;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.radius *= 0.94;
        this.life--;
      }
      draw() {
        if (this.life <= 0) return;
        const opacity = Math.max(0, this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.radius), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254, 240, 138, ${opacity})`;
        ctx.shadowBlur = 15;
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
        this.vy += 0.06;
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

    for (let i = 0; i < 90; i++) particles.push(new AmbientParticle());

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Radial Stage Background
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 80,
        width / 2, height / 2, width / 1.1
      );

      if (activeStep >= 4) {
        bgGrad.addColorStop(0, 'rgba(180, 83, 9, 0.55)');
        bgGrad.addColorStop(0.5, 'rgba(153, 27, 27, 0.45)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      } else if (activeStep > 0) {
        bgGrad.addColorStop(0, 'rgba(185, 28, 28, 0.3)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      } else {
        bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.3)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.99)');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Ambient Particles
      particles.forEach(p => { p.update(); p.draw(); });

      // ----------------------------------------------------
      // HIGH PARABOLIC FIREBALL FLIGHT FROM FAR LEFT (PERSON 1) TO FAR RIGHT (PERSON 2)
      // ----------------------------------------------------
      if (activeStep === 2) {
        if (flyProgressRef.current < 1.0) {
          flyProgressRef.current += 0.015; // ~2.2 seconds spectacular flight
          if (flyProgressRef.current >= 1.0) {
            flyProgressRef.current = 1.0;
            // Arrive at Right Person!
            setActiveStep(3);
            playAudioFx();
          }
        }

        const t = flyProgressRef.current;
        // Left Person position (15% width, 65% height) -> Right Person position (85% width, 65% height)
        const pLeft = { x: width * 0.15, y: height * 0.65 - 50 };
        const pRight = { x: width * 0.85, y: height * 0.65 - 50 };
        const pControlHigh = { x: width / 2, y: height * 0.12 }; // SOARING HIGH UP IN THE SKY!

        // Quadratic Bezier Arc Formula
        const currX = (1 - t) * (1 - t) * pLeft.x + 2 * (1 - t) * t * pControlHigh.x + t * t * pRight.x;
        const currY = (1 - t) * (1 - t) * pLeft.y + 2 * (1 - t) * t * pControlHigh.y + t * t * pRight.y;

        const vx = 2 * (1 - t) * (pControlHigh.x - pLeft.x) + 2 * t * (pRight.x - pControlHigh.x);
        const vy = 2 * (1 - t) * (pControlHigh.y - pLeft.y) + 2 * t * (pRight.y - pControlHigh.y);
        const norm = Math.hypot(vx, vy) || 1;

        // Trail particles
        for (let i = 0; i < 8; i++) {
          trailParticles.push(new TrailParticle(
            currX + (Math.random() - 0.5) * 16,
            currY + (Math.random() - 0.5) * 16,
            -(vx / norm) * (Math.random() * 4 + 1),
            -(vy / norm) * (Math.random() * 4 + 1),
            Math.random() * 12 + 7
          ));
        }

        // Draw High Arc Guide Curve (Glow Dotted Arc across sky)
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.quadraticCurveTo(pControlHigh.x, pControlHigh.y, pRight.x, pRight.y);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Giant Flying Fireball Head
        ctx.beginPath();
        ctx.arc(currX, currY, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 45;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(currX, currY, 36, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.fill();
      }

      // ----------------------------------------------------
      // STEP 4 & 5: SOARING TO SKY & CONTINUOUS FIREWORKS
      // ----------------------------------------------------
      if (activeStep === 4 || activeStep === 5) {
        if (activeStep === 4) {
          if (flyProgressRef.current < 1.0) {
            flyProgressRef.current += 0.025;
            if (flyProgressRef.current >= 1.0) {
              flyProgressRef.current = 1.0;
              setActiveStep(5);
              playAudioFx();
            }
          }
        } else {
          flyProgressRef.current = 1.0;
        }

        const t = flyProgressRef.current;
        const pStartRight = { x: width * 0.85, y: height * 0.65 - 50 };
        const pSky = { x: width / 2, y: height * 0.20 };
        const pSkyCtrl = { x: (pStartRight.x + pSky.x) / 2 + 50, y: Math.min(pStartRight.y, pSky.y) - 60 };

        const soarX = (1 - t) * (1 - t) * pStartRight.x + 2 * (1 - t) * t * pSkyCtrl.x + t * t * pSky.x;
        const soarY = (1 - t) * (1 - t) * pStartRight.y + 2 * (1 - t) * t * pSkyCtrl.y + t * t * pSky.y;

        if (t < 1.0) {
          for (let i = 0; i < 8; i++) {
            trailParticles.push(new TrailParticle(
              soarX + (Math.random() - 0.5) * 14,
              soarY + (Math.random() - 0.5) * 14,
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.5) * 4 + 2,
              Math.random() * 12 + 6
            ));
          }

          ctx.beginPath();
          ctx.arc(soarX, soarY, 24, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 50;
          ctx.shadowColor = '#f59e0b';
          ctx.fill();
        }

        if (activeStep === 5) {
          for (let i = 0; i < 4; i++) {
            const rx = width / 2 + (Math.random() - 0.5) * (width * 0.4);
            const ry = height * 0.22 + (Math.random() - 0.5) * 100;
            fireworkSparks.push(new FireworkSpark(rx, ry));
          }
        }
      }

      // Update Trail & Firework Sparks
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
    if (!documentfullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullScreen(false);
      }
    }
  };

  const isLeftLit = activeStep === 1 || activeStep === 2 || activeStep >= 5;
  const isRightLit = activeStep === 3 || activeStep === 4 || activeStep >= 5;

  return (
    <div style={styles.stageContainer}>
      <style>{`
        @keyframes flamePulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 25px rgba(245, 158, 11, 0.9)); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 50px rgba(239, 68, 68, 1)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 25px rgba(245, 158, 11, 0.9)); }
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
          <span style={{ marginLeft: '15px', color: '#fef08a', fontWeight: 'bold' }}>• TRẠNG THÁI: STEP {activeStep} / 5</span>
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
        
        {/* TOP TITLE BANNER */}
        <div style={{ textAlign: 'center', marginTop: '10px', zIndex: 30, position: 'relative' }}>
          {activeStep >= 4 ? (
            /* GRAND ANNIVERSARY FINALE BANNER (STEP 4 & 5) */
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
            /* STANDARD STAGE HEADER BANNER */
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', color: '#fef08a', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                TRƯỜNG THPT CAO BÁ QUÁT • 30 NĂM PHÁT TRIỂN & CHẮP CÁNH MƠ ƯỚC
              </div>
              <h1 style={styles.mainTitle}>
                {customTitle || (
                  activeStep === 2 ? '🚀 CẦU LỬA THIÊNG VÚT BAY CAO TỪ BÊN TRÁI SANG BÊN PHẢI...' :
                  activeStep === 1 ? '🔥 NGỌN LỬA KHỜI NGUỒN BÙNG CHÁY BÊN TRÁI SÂN SẤU' :
                  activeStep === 3 ? '🔥 NGUYỄN VĂN B BÊN PHẢI ĐÃ NHẬN NGỌN LỬA THIÊNG!' :
                  'NGHI THỨC TRUYỀN LỬA THẾ HỆ (1996 - 2026)'
                )}
              </h1>
            </div>
          )}
        </div>

        {/* 2 MAIN PERSON CARDS MAPPED TO STAGE LEFT & RIGHT POSITIONS */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 25 }}>
          
          {/* PERSON 1: EXTREME FAR LEFT OF STAGE */}
          <div style={{
            ...styles.personStageCard,
            position: 'absolute',
            left: '40px',
            bottom: '70px',
            pointerEvents: 'auto',
            border: isLeftLit ? '3px solid #f59e0b' : '1.5px solid rgba(255,255,255,0.15)',
            backgroundColor: isLeftLit ? 'rgba(185, 28, 28, 0.85)' : 'rgba(15, 23, 42, 0.75)',
            boxShadow: isLeftLit ? '0 0 50px rgba(245, 158, 11, 0.8)' : 'none',
            transform: isLeftLit ? 'scale(1.05)' : 'scale(0.95)'
          }}>
            <div style={{ animation: isLeftLit ? 'flamePulse 2s ease-in-out infinite' : 'none', marginBottom: '12px' }}>
              <div style={{ padding: '20px', borderRadius: '50%', backgroundColor: isLeftLit ? 'rgba(239,68,68,0.5)' : 'rgba(30,41,59,0.5)', border: '3px solid #fef08a', display: 'inline-flex' }}>
                <Flame size={isLeftLit ? 60 : 36} color={isLeftLit ? '#fef08a' : 'rgba(255,255,255,0.3)'} />
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: '900', color: isLeftLit ? '#fef08a' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              {isLeftLit ? '🔥 BÊN TRÁI SÂN SẤU (ĐANG GIỮ LỬA)' : '📍 NGƯỜI TRAO LỬA (BÊN TRÁI)'}
            </div>
            
            <h2 style={{ margin: '4px 0', fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
              {personsConfig[0]?.name || 'Đại diện Thế hệ Đi trước'}
            </h2>

            <div style={{ fontSize: '13px', color: isLeftLit ? '#fef3c7' : '#cbd5e1', fontWeight: 'bold' }}>
              {personsConfig[0]?.title || 'Ban Giám Hiệu & Thầy Cô (1996)'}
            </div>
          </div>

          {/* FLYING ARROW INDICATOR IN SKY CENTER */}
          {activeStep === 2 && (
            <div style={{ position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', animation: 'bannerScaleUp 0.5s ease' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#fef08a', textShadow: '0 0 20px #f59e0b', marginBottom: '6px' }}>
                🚀 CẦU LỬA ĐANG BAY TRÊN CAO...
              </div>
              <ArrowRight size={50} color="#fef08a" />
            </div>
          )}

          {/* PERSON 2: EXTREME FAR RIGHT OF STAGE */}
          <div style={{
            ...styles.personStageCard,
            position: 'absolute',
            right: '40px',
            bottom: '70px',
            pointerEvents: 'auto',
            border: isRightLit ? '3px solid #22c55e' : '1.5px solid rgba(255,255,255,0.15)',
            backgroundColor: isRightLit ? 'rgba(22, 101, 52, 0.85)' : 'rgba(15, 23, 42, 0.75)',
            boxShadow: isRightLit ? '0 0 50px rgba(34, 197, 94, 0.8)' : 'none',
            transform: isRightLit ? 'scale(1.05)' : 'scale(0.95)'
          }}>
            <div style={{ animation: isRightLit ? 'flamePulse 2s ease-in-out infinite' : 'none', marginBottom: '12px' }}>
              <div style={{ padding: '20px', borderRadius: '50%', backgroundColor: isRightLit ? 'rgba(34,197,94,0.5)' : 'rgba(30,41,59,0.5)', border: '3px solid #fef08a', display: 'inline-flex' }}>
                <Flame size={isRightLit ? 60 : 36} color={isRightLit ? '#fef08a' : 'rgba(255,255,255,0.3)'} />
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: '900', color: isRightLit ? '#fef08a' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              {isRightLit ? '🔥 BÊN PHẢI SÂN SẤU (ĐÃ NHẬN LỬA)' : '📍 NGƯỜI NHẬN LỬA (BÊN PHẢI)'}
            </div>

            <h2 style={{ margin: '4px 0', fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
              {personsConfig[1]?.name || 'Đại diện Thế hệ Tiếp nối'}
            </h2>

            <div style={{ fontSize: '13px', color: isRightLit ? '#fef3c7' : '#cbd5e1', fontWeight: 'bold' }}>
              {personsConfig[1]?.title || 'Học Sinh Hiện Tại (Khóa 2023 - 2026)'}
            </div>
          </div>

        </div>

        {/* FOOTER STAGE MESSAGE */}
        <div style={styles.stageFooter}>
          <div style={{ fontSize: '19px', fontWeight: '900', color: '#fef08a', textShadow: '0 2px 14px rgba(0,0,0,0.9)', letterSpacing: '1px' }}>
            {activeStep >= 4 
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
    fontSize: '32px',
    fontWeight: '900',
    color: '#fef08a',
    textShadow: '0 0 25px rgba(245, 158, 11, 0.8), 0 2px 8px rgba(0,0,0,0.9)',
    letterSpacing: '1.2px',
    textTransform: 'uppercase'
  },
  dualStageContainer: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    width: '100%',
    margin: 'auto 0',
    padding: '0 40px',
    boxSizing: 'border-box'
  },
  personStageCard: {
    width: '380px',
    borderRadius: '20px',
    padding: '26px 22px',
    textAlign: 'center',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  stageFooter: {
    textAlign: 'center',
    padding: '10px 26px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: '50px',
    border: '1.5px solid rgba(245, 158, 11, 0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)',
    marginBottom: '6px'
  }
};
