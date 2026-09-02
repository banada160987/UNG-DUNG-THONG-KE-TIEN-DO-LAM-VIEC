import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, Sparkles, Maximize, Volume2, VolumeX, Radio, Trophy, ArrowRight } from 'lucide-react';

// HIGH-END CINEMATIC 3D OLYMPIC SACRED TORCH & GOLDEN HAND COMPONENT
function RealisticHandHoldingTorch({ isLit }) {
  return (
    <div style={{ position: 'relative', width: '140px', height: '170px', margin: '0 auto 10px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', willChange: 'transform' }}>
      <style>{`
        @keyframes flameDanceWave1 {
          0% { transform: scale(1) rotate(-2deg); opacity: 0.95; }
          25% { transform: scale(1.06, 1.14) rotate(3deg); opacity: 1; }
          50% { transform: scale(0.96, 0.92) rotate(-3deg); opacity: 0.9; }
          75% { transform: scale(1.10, 1.08) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(-2deg); opacity: 0.95; }
        }
        @keyframes flameDanceWave2 {
          0% { transform: scale(0.94) rotate(3deg); }
          50% { transform: scale(1.14, 1.20) rotate(-4deg); }
          100% { transform: scale(0.94) rotate(3deg); }
        }
        @keyframes emberFlyUp {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-65px) scale(0.2) rotate(180deg); opacity: 0; }
        }
        @keyframes shockwaveExpand {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes armHeroicRaise {
          0% { transform: translateY(4px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(4px); }
        }
      `}</style>

      {/* BURNING FIRE TONGUES & EMBERS (WHEN LIT) */}
      {isLit ? (
        <div style={{ position: 'absolute', bottom: '82px', width: '90px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 5 }}>
          
          {/* LANDING SHOCKWAVE AURA */}
          <div style={{
            position: 'absolute',
            width: '95px',
            height: '95px',
            borderRadius: '50%',
            border: '2.5px solid #fef08a',
            backgroundColor: 'rgba(245, 158, 11, 0.35)',
            animation: 'shockwaveExpand 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite'
          }} />

          {/* OUTER AURA GLOW BLOOM */}
          <div style={{
            position: 'absolute',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            filter: 'blur(35px)',
            animation: 'flameDanceWave1 1.5s ease-in-out infinite alternate'
          }} />

          {/* FLAME TONGUE LAYER 1 (CRIMSON OUTER FLAME SILK) */}
          <svg width="75" height="105" viewBox="0 0 75 105" fill="none" style={{ position: 'absolute', bottom: 0, animation: 'flameDanceWave1 0.75s ease-in-out infinite alternate', transformOrigin: 'bottom center' }}>
            <path d="M37.5 0 C55 25, 75 55, 65 85 C55 105, 20 105, 10 85 C-5 55, 20 25, 37.5 0 Z" fill="url(#flameOuterGrad)" />
            <defs>
              <linearGradient id="flameOuterGrad" x1="37.5" y1="0" x2="37.5" y2="105" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="0.4" stopColor="#ef4444" />
                <stop offset="0.85" stopColor="#be123c" />
                <stop offset="1" stopColor="#881337" />
              </linearGradient>
            </defs>
          </svg>

          {/* FLAME TONGUE LAYER 2 (BRIGHT ORANGE MIDDLE DANCING TONGUE) */}
          <svg width="52" height="80" viewBox="0 0 52 80" fill="none" style={{ position: 'absolute', bottom: 0, animation: 'flameDanceWave2 0.55s ease-in-out infinite alternate', transformOrigin: 'bottom center' }}>
            <path d="M26 0 C38 18, 52 42, 45 65 C38 80, 14 80, 7 65 C-2 42, 14 18, 26 0 Z" fill="url(#flameMidGrad)" />
            <defs>
              <linearGradient id="flameMidGrad" x1="26" y1="0" x2="26" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.5" stopColor="#eab308" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>

          {/* FLAME TONGUE LAYER 3 (WHITE HOT INNER CORE) */}
          <svg width="28" height="52" viewBox="0 0 28 52" fill="none" style={{ position: 'absolute', bottom: 0, animation: 'flameDanceWave1 0.35s ease-in-out infinite alternate', transformOrigin: 'bottom center' }}>
            <path d="M14 0 C22 12, 28 28, 24 42 C20 52, 8 52, 4 42 C0 28, 6 12, 14 0 Z" fill="url(#flameCoreGrad)" />
            <defs>
              <linearGradient id="flameCoreGrad" x1="14" y1="0" x2="14" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" />
                <stop offset="0.7" stopColor="#fef08a" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>

          {/* EMBERS SPARKS RISING UP */}
          <div style={{ position: 'absolute', bottom: '45px', left: '18px', width: '5px', height: '5px', backgroundColor: '#fef08a', borderRadius: '50%', boxShadow: '0 0 8px #f59e0b', animation: 'emberFlyUp 1.2s infinite ease-out' }} />
          <div style={{ position: 'absolute', bottom: '50px', right: '22px', width: '4px', height: '4px', backgroundColor: '#ffffff', borderRadius: '50%', boxShadow: '0 0 8px #ef4444', animation: 'emberFlyUp 0.9s infinite ease-out 0.3s' }} />
          <div style={{ position: 'absolute', bottom: '58px', left: '38px', width: '6px', height: '6px', backgroundColor: '#fef08a', borderRadius: '50%', boxShadow: '0 0 10px #f59e0b', animation: 'emberFlyUp 1.5s infinite ease-out 0.6s' }} />
        </div>
      ) : (
        /* DIM PILOT FLAME (WAITING TO BE IGNITED) */
        <div style={{ position: 'absolute', bottom: '82px', width: '24px', height: '32px', borderRadius: '50% 50% 40% 40%', background: 'linear-gradient(to top, #b45309, #f59e0b)', opacity: 0.6, filter: 'blur(1px)', animation: 'flameDanceWave1 2s ease-in-out infinite', zIndex: 5 }} />
      )}

      {/* LUXURIOUS 3D OLYMPIC TORCH & GOLDEN HAND SVG */}
      <svg width="100" height="115" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 10, filter: isLit ? 'drop-shadow(0 0 16px rgba(245, 158, 11, 0.95))' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))', animation: isLit ? 'armHeroicRaise 3s ease-in-out infinite' : 'none' }}>
        
        {/* TORCH BOWL CROWN (UPPER FLAME CUP) */}
        <path d="M12 14 C25 6, 75 6, 88 14 L72 52 C64 60, 36 60, 28 52 Z" fill="url(#goldBowlGrad)" stroke="#fef08a" strokeWidth="2" />
        <ellipse cx="50" cy="14" rx="38" ry="6" fill="#451a03" stroke="#fef08a" strokeWidth="1.5" />
        
        {/* EMBOSSED 30-YEAR LAUREL EMBLEM ON BOWL */}
        <path d="M30 30 C40 22, 60 22, 70 30 C60 38, 40 38, 30 30 Z" fill="url(#laurelGold)" opacity="0.85" />
        
        {/* METALLIC TORCH HANDLE SHAFT */}
        <path d="M42 52 L42 108 C42 112, 58 112, 58 108 L58 52 Z" fill="url(#goldShaftGrad)" stroke="#fef08a" strokeWidth="1.2" />

        {/* HEROIC 3D GOLDEN HAND & ARM ELEVATING TORCH */}
        {/* WRIST SLEEVE CUFF */}
        <path d="M25 105 C32 90, 68 90, 75 105 L80 115 L20 115 Z" fill="url(#royalSleeveGrad)" stroke="#fef08a" strokeWidth="1.5" />

        {/* THUMB & PALM MUSCLE */}
        <path d="M32 72 C26 66, 28 56, 38 58 C44 60, 46 66, 42 74 Z" fill="url(#goldSkin3D)" stroke="#fef08a" strokeWidth="1.5" />
        
        {/* FINGERS WRAPPING POWERFULLY AROUND TORCH SHAFT */}
        <path d="M36 58 C36 53, 60 50, 63 56 C65 59, 58 64, 46 64 Z" fill="url(#goldSkin3D)" stroke="#fef08a" strokeWidth="1.2" />
        <path d="M37 66 C37 61, 61 58, 64 64 C65 67, 59 72, 47 72 Z" fill="url(#goldSkin3D)" stroke="#fef08a" strokeWidth="1.2" />
        <path d="M38 74 C38 69, 60 66, 63 72 C64 75, 58 80, 47 80 Z" fill="url(#goldSkin3D)" stroke="#fef08a" strokeWidth="1.2" />
        <path d="M39 82 C39 77, 58 75, 60 79 C61 82, 56 87, 47 87 Z" fill="url(#goldSkin3D)" stroke="#fef08a" strokeWidth="1.2" />

        {/* GRADIENTS & SHADERS */}
        <defs>
          <linearGradient id="goldBowlGrad" x1="12" y1="6" x2="88" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffbeb" />
            <stop offset="0.25" stopColor="#fef08a" />
            <stop offset="0.55" stopColor="#d97706" />
            <stop offset="0.85" stopColor="#b45309" />
            <stop offset="1" stopColor="#451a03" />
          </linearGradient>

          <linearGradient id="laurelGold" x1="30" y1="22" x2="70" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#fef08a" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="goldShaftGrad" x1="42" y1="52" x2="58" y2="108" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.3" stopColor="#f59e0b" />
            <stop offset="0.7" stopColor="#b45309" />
            <stop offset="1" stopColor="#451a03" />
          </linearGradient>

          <linearGradient id="goldSkin3D" x1="25" y1="50" x2="70" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffbeb" />
            <stop offset="0.3" stopColor="#fef08a" />
            <stop offset="0.65" stopColor="#f59e0b" />
            <stop offset="0.9" stopColor="#b45309" />
            <stop offset="1" stopColor="#78350f" />
          </linearGradient>

          <linearGradient id="royalSleeveGrad" x1="20" y1="90" x2="80" y2="115" gradientUnits="userSpaceOnUse">
            <stop stopColor="#991b1b" />
            <stop offset="0.5" stopColor="#be123c" />
            <stop offset="0.8" stopColor="#881337" />
            <stop offset="1" stopColor="#4c0519" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function StageLedTorch() {
  const [activeStep, setActiveStep] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // UNLIMITED DYNAMIC MULTI-GENERATION PERSONS LIST
  const [personsList, setPersonsList] = useState([
    { id: 1, name: 'Đại diện Ban Giám Hiệu', title: 'Ban Giám Hiệu & Thầy Cô (1996)', sub: 'THẾ HỆ KHỞI NGUỒN' },
    { id: 2, name: 'Đại diện Cựu HS Khóa 1', title: 'Khóa 1996 - 2000', sub: 'THẮP SÁNG KHÁT VỌNG' },
    { id: 3, name: 'Đại diện Cựu HS Khóa 2', title: 'Khóa 2001 - 2005', sub: 'THẬP KỶ TRI THỨC' },
    { id: 4, name: 'Đại diện Cựu HS Khóa 3', title: 'Khóa 2006 - 2010', sub: 'VƯƠN XA & TRƯỜNG THÀNH' },
    { id: 5, name: 'Đại diện Cựu HS Khóa 4', title: 'Khóa 2011 - 2015', sub: 'KẾ THỪA & PHÁT TRIỂN' },
    { id: 6, name: 'Đại diện Cựu HS Khóa 5', title: 'Khóa 2016 - 2020', sub: 'HỘI NHẬP & TỎA SÁNG' },
    { id: 7, name: 'Đại diện Học Sinh Hiện Tại', title: 'Khóa 2023 - 2026', sub: 'THẮP SÁNG TƯƠNG LAI' }
  ]);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const flyProgressRef = useRef(0);

  // Calculate dynamic steps based on 3-Substep Loop
  const totalTransfers = Math.max(1, personsList.length - 1);
  const soarStep = totalTransfers * 3 + 1;
  const grandFinaleStep = soarStep + 1;

  // 3-SUBSTEP LOGIC FOR EACH TRANSFER PAIR:
  const currentPairIdx = Math.min(totalTransfers - 1, Math.floor(Math.max(0, activeStep - 1) / 3));
  const subStepType = activeStep === 0 ? 0 : activeStep >= soarStep ? 99 : ((activeStep - 1) % 3 + 1);

  const leftPerson = personsList[currentPairIdx] || personsList[0];
  const rightPerson = personsList[currentPairIdx + 1] || personsList[personsList.length - 1];

  const isFlying = subStepType === 2;
  const isCenterHonor = subStepType === 3;
  const isLeftLit = (subStepType === 1 || subStepType === 2) && activeStep < soarStep;
  const isRightLit = isCenterHonor;

  // LISTEN TO SUPABASE REALTIME BROADCAST & LOCALSTORAGE
  useEffect(() => {
    fetchInitialState();

    const channel = supabase.channel('cbq_torch_stage_channel')
      .on('broadcast', { event: 'TORCH_STEP_CHANGE' }, payload => {
        if (payload && payload.payload) {
          const { step, title, persons } = payload.payload;
          if (step !== undefined) triggerStepTransition(step);
          if (title !== undefined) setCustomTitle(title);
          if (persons && Array.isArray(persons)) setPersonsList(persons);
        }
      })
      .on('broadcast', { event: 'TORCH_PERSONS_LIST_CHANGE' }, payload => {
        if (payload && payload.payload && payload.payload.persons) {
          setPersonsList(payload.payload.persons);
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
      const localStep = localStorage.getItem('cbq_torch_current_step');
      if (localStep) {
        const parsed = JSON.parse(localStep);
        if (parsed.step !== undefined) setActiveStep(parsed.step);
        if (parsed.title) setCustomTitle(parsed.title);
        if (parsed.persons && Array.isArray(parsed.persons)) setPersonsList(parsed.persons);
      }

      const localList = localStorage.getItem('cbq_torch_persons_list');
      if (localList) {
        const parsedList = JSON.parse(localList);
        if (Array.isArray(parsedList) && parsedList.length >= 2) {
          setPersonsList(parsedList);
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

  // 60FPS CINEMATIC HIGH PERFORMANCE CANVAS RENDER ENGINE
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
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

    // Ambient warm background smoke particle
    class AmbientParticle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 20;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = -(Math.random() * 2.5 + 0.8);
        this.radius = Math.random() * 5 + 2;
        this.life = Math.random() * 100 + 50;
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
        ctx.fillStyle = `${this.color}${opacity * 0.55})`;
        ctx.fill();
      }
    }

    // Flying Fireball Trail Particle
    class TrailParticle {
      constructor(x, y, vx, vy, size) {
        this.x = x;
        this.y = y;
        this.vx = vx + (Math.random() - 0.5) * 2.5;
        this.vy = vy + (Math.random() - 0.5) * 2.5;
        this.radius = size * (Math.random() * 0.7 + 0.3);
        this.life = Math.random() * 70 + 40;
        this.maxLife = this.life;
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
        ctx.fillStyle = `rgba(254, 240, 138, ${opacity})`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();
      }
    }

    // Firework Spark
    class FireworkSpark {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9.5 + 2.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 6.5 + 2.5;
        this.life = Math.random() * 75 + 35;
        this.maxLife = this.life;
        const colors = ['rgba(254, 240, 138, ', 'rgba(245, 158, 11, ', 'rgba(239, 68, 68, ', 'rgba(225, 29, 72, ', 'rgba(255, 255, 255, '];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.055;
        this.life--;
      }
      draw() {
        if (this.life <= 0) return;
        const opacity = Math.max(0, this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${opacity})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();
      }
    }

    for (let i = 0; i < 95; i++) particles.push(new AmbientParticle());

    const easeInOutCubic = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Stage Background Radial Glow Atmosphere
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 80,
        width / 2, height / 2, width / 1.1
      );

      if (activeStep >= soarStep) {
        bgGrad.addColorStop(0, 'rgba(180, 83, 9, 0.58)');
        bgGrad.addColorStop(0.5, 'rgba(153, 27, 27, 0.48)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.99)');
      } else if (activeStep > 0) {
        bgGrad.addColorStop(0, 'rgba(185, 28, 28, 0.32)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.99)');
      } else {
        bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.35)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.99)');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => { p.update(); p.draw(); });

      // ----------------------------------------------------
      // HIGH PARABOLIC FIREBALL FLIGHT FROM LEFT CARD TO RIGHT CARD
      // ----------------------------------------------------
      if (isFlying) {
        if (flyProgressRef.current < 1.0) {
          flyProgressRef.current += 0.0050; // ~5.0s Slow, nostalgic, emotional flight!
          if (flyProgressRef.current >= 1.0) {
            flyProgressRef.current = 1.0;
            // Arrive on Right Torch -> AUTOMATICALLY ENTER CENTER HONOR SPOTLIGHT!
            setActiveStep(activeStep + 1);
            playAudioFx();
          }
        }

        const rawT = flyProgressRef.current;
        const t = easeInOutCubic(rawT);

        const pLeft = { x: 230, y: height - 210 };
        const pRight = { x: width - 230, y: height - 210 };
        const pControlHigh = { x: width / 2, y: height * 0.10 };

        const currX = (1 - t) * (1 - t) * pLeft.x + 2 * (1 - t) * t * pControlHigh.x + t * t * pRight.x;
        const currY = (1 - t) * (1 - t) * pLeft.y + 2 * (1 - t) * t * pControlHigh.y + t * t * pRight.y;

        const vx = 2 * (1 - t) * (pControlHigh.x - pLeft.x) + 2 * t * (pRight.x - pControlHigh.x);
        const vy = 2 * (1 - t) * (pControlHigh.y - pLeft.y) + 2 * t * (pRight.y - pControlHigh.y);
        const norm = Math.hypot(vx, vy) || 1;

        for (let i = 0; i < 9; i++) {
          trailParticles.push(new TrailParticle(
            currX + (Math.random() - 0.5) * 18,
            currY + (Math.random() - 0.5) * 18,
            -(vx / norm) * (Math.random() * 4 + 1),
            -(vy / norm) * (Math.random() * 4 + 1),
            Math.random() * 13 + 7
          ));
        }

        // Arc Guide Line
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.quadraticCurveTo(pControlHigh.x, pControlHigh.y, pRight.x, pRight.y);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 12]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Flying Fireball Comet Head
        const cometGrad = ctx.createRadialGradient(currX, currY, 4, currX, currY, 45);
        cometGrad.addColorStop(0, '#ffffff');
        cometGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.95)');
        cometGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.7)');
        cometGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

        ctx.beginPath();
        ctx.arc(currX, currY, 45, 0, Math.PI * 2);
        ctx.fillStyle = cometGrad;
        ctx.shadowBlur = 55;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(currX, currY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // ----------------------------------------------------
      // SOARING TO SKY & CONTINUOUS FIREWORKS (FINALE STEPS)
      // ----------------------------------------------------
      if (activeStep >= soarStep) {
        if (activeStep === soarStep) {
          if (flyProgressRef.current < 1.0) {
            flyProgressRef.current += 0.020;
            if (flyProgressRef.current >= 1.0) {
              flyProgressRef.current = 1.0;
              setActiveStep(grandFinaleStep);
              playAudioFx();
            }
          }
        } else {
          flyProgressRef.current = 1.0;
        }

        const rawT = flyProgressRef.current;
        const t = easeInOutCubic(rawT);

        const pStartRight = { x: width - 230, y: height - 210 };
        const pSky = { x: width / 2, y: height * 0.20 };
        const pSkyCtrl = { x: (pStartRight.x + pSky.x) / 2 + 50, y: Math.min(pStartRight.y, pSky.y) - 60 };

        const soarX = (1 - t) * (1 - t) * pStartRight.x + 2 * (1 - t) * t * pSkyCtrl.x + t * t * pSky.x;
        const soarY = (1 - t) * (1 - t) * pStartRight.y + 2 * (1 - t) * t * pSkyCtrl.y + t * t * pSky.y;

        if (t < 1.0) {
          for (let i = 0; i < 9; i++) {
            trailParticles.push(new TrailParticle(
              soarX + (Math.random() - 0.5) * 16,
              soarY + (Math.random() - 0.5) * 16,
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.5) * 4 + 2,
              Math.random() * 13 + 7
            ));
          }

          ctx.beginPath();
          ctx.arc(soarX, soarY, 26, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 55;
          ctx.shadowColor = '#f59e0b';
          ctx.fill();
        }

        if (activeStep === grandFinaleStep) {
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
  }, [activeStep, currentPairIdx]);

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
        @keyframes bannerScaleUp {
          0% { transform: scale(0.6) translateY(30px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes centerHonorZoom {
          0% { transform: translate(-50%, 0) scale(0.7); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1.18); opacity: 1; }
        }
        @keyframes cardFadeIn {
          0% { opacity: 0; transform: scale(0.92) translateY(25px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3" preload="auto" />
      <canvas ref={canvasRef} style={styles.canvasBackground} />

      {/* TOP CONTROL BAR */}
      <div style={styles.topControlBar} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
          <Radio size={16} color={isConnected ? '#22c55e' : '#ef4444'} />
          <span>Sân khấu LED 3D Olympic Render: <strong style={{ color: isConnected ? '#4ade80' : '#f87171' }}>{isConnected ? 'ONLINE 60FPS' : 'OFFLINE'}</strong></span>
          <span style={{ marginLeft: '15px', color: '#fef08a', fontWeight: 'bold' }}>• THẾ HỆ #{currentPairIdx + 1} / {totalTransfers} | STEP: {activeStep}</span>
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
          {activeStep >= soarStep ? (
            /* GRAND ANNIVERSARY FINALE BANNER */
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
              <div style={{ fontSize: '13.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', color: '#fef08a', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                TRƯỜNG THPT CAO BÁ QUÁT • 30 NĂM PHÁT TRIỂN & CHẮP CÁNH MƠ ƯỚC
              </div>
              <h1 style={styles.mainTitle}>
                {customTitle || (
                  isCenterHonor ? `👑 TÔN VINH ${rightPerson.name.toUpperCase()} - ĐÃ CHÍNH THỨC NHẬN NGỌN LỬA THIÊNG!` :
                  isFlying ? `🚀 CẦU LỬA THIÊNG DẪN LỖI: THẾ HỆ #${currentPairIdx + 1} ➔ THẾ HỆ #${currentPairIdx + 2}...` :
                  isLeftLit ? `🔥 NGỌN LỬA THIÊNG BÙNG CHÁY BÊN TRÁI: ${leftPerson.name}` :
                  'NGHI THỨC TRUYỀN LỬA THẾ HỆ (1996 - 2026)'
                )}
              </h1>
            </div>
          )}
        </div>

        {/* CARDS CONTAINER & CENTER SPOTLIGHT STAGE */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 25 }}>
          
          {/* CENTER HONOR SPOTLIGHT CARD WITH REALISTIC 3D OLYMPIC HAND & TORCH */}
          {isCenterHonor ? (
            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: '100px',
              width: '460px',
              pointerEvents: 'auto',
              border: '4px solid #fef08a',
              backgroundColor: 'rgba(185, 28, 28, 0.92)',
              boxShadow: '0 0 70px rgba(245, 158, 11, 0.95), 0 10px 40px rgba(0,0,0,0.9)',
              borderRadius: '24px',
              padding: '30px 24px',
              textAlign: 'center',
              backdropFilter: 'blur(16px)',
              animation: 'centerHonorZoom 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '20px', backgroundColor: '#be123c', border: '1.5px solid #fef08a', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#fef08a', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  👑 THẾ HỆ #{currentPairIdx + 2} • ĐÃ CHÍNH THỨC NHẬN LỬA!
                </span>
              </div>

              {/* REALISTIC 3D OLYMPIC HAND & TORCH AT CENTER */}
              <RealisticHandHoldingTorch isLit={true} />

              <h2 style={{ margin: '8px 0 4px 0', fontSize: '30px', fontWeight: '900', color: '#ffffff', textShadow: '0 0 25px rgba(245, 158, 11, 0.9)' }}>
                {rightPerson.name}
              </h2>

              <div style={{ fontSize: '16px', color: '#fef08a', fontWeight: '800', marginTop: '4px' }}>
                {rightPerson.title} {rightPerson.sub ? `• ${rightPerson.sub}` : ''}
              </div>
            </div>
          ) : (
            /* DUAL SIDE STAGE CARDS (LEFT HOLDER & RIGHT RECEIVER) */
            <>
              {/* PERSON ON EXTREME FAR LEFT (CURRENT TORCH HOLDER) */}
              <div key={`left-${currentPairIdx}`} style={{
                ...styles.personStageCard,
                position: 'absolute',
                left: '40px',
                bottom: '70px',
                pointerEvents: 'auto',
                animation: 'cardFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                border: isLeftLit ? '3px solid #f59e0b' : '1.5px solid rgba(255,255,255,0.15)',
                backgroundColor: isLeftLit ? 'rgba(185, 28, 28, 0.85)' : 'rgba(15, 23, 42, 0.75)',
                boxShadow: isLeftLit ? '0 0 50px rgba(245, 158, 11, 0.8)' : 'none',
                transform: isLeftLit ? 'scale(1.05)' : 'scale(0.95)'
              }}>
                <RealisticHandHoldingTorch isLit={isLeftLit} />

                <div style={{ fontSize: '11.5px', fontWeight: '900', color: isLeftLit ? '#fef08a' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  {isLeftLit ? `🔥 THẾ HỆ #${currentPairIdx + 1} (ĐANG GIỮ LỬA)` : `📍 THẾ HỆ #${currentPairIdx + 1} (BÊN TRÁI)`}
                </div>
                
                <h2 style={{ margin: '4px 0', fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                  {leftPerson.name}
                </h2>

                <div style={{ fontSize: '13px', color: isLeftLit ? '#fef3c7' : '#cbd5e1', fontWeight: 'bold' }}>
                  {leftPerson.title}
                </div>
              </div>

              {/* FLYING ARROW INDICATOR IN SKY CENTER */}
              {isFlying && (
                <div style={{ position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', animation: 'bannerScaleUp 0.5s ease' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#fef08a', textShadow: '0 0 20px #f59e0b', marginBottom: '6px' }}>
                    🚀 CẦU LỬA THIÊNG ĐANG BAY CAO BĂNG QUA BẦU TRỜI...
                  </div>
                  <ArrowRight size={50} color="#fef08a" />
                </div>
              )}

              {/* PERSON ON EXTREME FAR RIGHT (TORCH RECEIVER WAITING) */}
              <div key={`right-${currentPairIdx}`} style={{
                ...styles.personStageCard,
                position: 'absolute',
                right: '40px',
                bottom: '70px',
                pointerEvents: 'auto',
                animation: 'cardFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                border: '1.5px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                boxShadow: 'none',
                transform: 'scale(0.95)'
              }}>
                <RealisticHandHoldingTorch isLit={false} />

                <div style={{ fontSize: '11.5px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  📍 THẾ HỆ #${currentPairIdx + 2} (BÊN PHẢI CHỜ NHẬN)
                </div>

                <h2 style={{ margin: '4px 0', fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                  {rightPerson.name}
                </h2>

                <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 'bold' }}>
                  {rightPerson.title}
                </div>
              </div>
            </>
          )}

        </div>

        {/* FOOTER STAGE MESSAGE */}
        <div style={styles.stageFooter}>
          <div style={{ fontSize: '19px', fontWeight: '900', color: '#fef08a', textShadow: '0 2px 14px rgba(0,0,0,0.9)', letterSpacing: '1px' }}>
            {activeStep >= soarStep 
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
    fontFamily: "'Inter', sans-serif",
    contain: 'strict'
  },
  canvasBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    willChange: 'transform'
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
    padding: '16px 20px',
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
  personStageCard: {
    width: '380px',
    borderRadius: '20px',
    padding: '24px 22px',
    textAlign: 'center',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity, box-shadow'
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
