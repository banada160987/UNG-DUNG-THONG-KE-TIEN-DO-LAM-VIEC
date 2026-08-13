import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Send, Heart, Gift } from 'lucide-react';
import Confetti from 'react-confetti';

const random = (min, max) => Math.random() * (max - min) + min;

const GIFTS = [
  { id: 'tim', name: 'Bắn tim', icon: '💖' },
  { id: 'hoa', name: 'Hoa đào', icon: '🌸' },
  { id: 'khoa', name: 'Khóa tình yêu', icon: '🔒' },
  { id: 'banh', name: 'Bánh ngọt', icon: '🎂' },
  { id: 'phao', name: 'Pháo mừng', icon: '🎉' },
  { id: 'phao_hoa', name: 'Pháo hoa', icon: '🎆' },
  { id: 'bo_hoa', name: 'Bó hoa', icon: '💐' }
];

export default function OnlineInvitation() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [config, setConfig] = useState(null);
  
  const [showConfetti, setShowConfetti] = useState(true); // Show on load

  // Guestbook & Danmaku
  const [wishes, setWishes] = useState([]);
  const [newWish, setNewWish] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [floatingWishes, setFloatingWishes] = useState([]);

  // Hearts & Gifts
  const [hearts, setHearts] = useState([]);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(GIFTS[0]);
  const [giftBanners, setGiftBanners] = useState([]);
  const [activeGiftEffect, setActiveGiftEffect] = useState(null);

  // RSVP Modal
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [rsvpFormStatus, setRsvpFormStatus] = useState('attending');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  // Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchData();
    setTimeout(() => setShowConfetti(false), 5000); // Stop initial confetti
  }, [code]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const guestRes = await supabase.from('cbq_guests').select('*').eq('invitation_code', code).single();
      if (guestRes.data) {
        setGuest(guestRes.data);
        if(guestRes.data.rsvp_status && guestRes.data.rsvp_status !== 'pending') {
          setRsvpFormStatus(guestRes.data.rsvp_status);
        }
      }

      const configRes = await supabase.from('cbq_pages').select('*').eq('slug', 'invite-config').single();
      if (configRes.data && configRes.data.content) {
        const parsed = typeof configRes.data.content === 'string' ? JSON.parse(configRes.data.content) : configRes.data.content;
        
        if (parsed.agenda && parsed.agenda.length > 0 && typeof parsed.agenda[0] === 'string') {
          parsed.agenda = parsed.agenda.map(item => {
            const parts = item.split(': ');
            return { time: parts[0], content: parts.slice(1).join(': ') || item };
          });
        }
        setConfig(parsed);
      }
      
      await fetchWishes();
      
      // Try autoplay audio
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }

    } catch (error) {
      console.error("Lỗi tải thiệp:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchWishes = async () => {
    const { data } = await supabase.from('cbq_wishes').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) {
      setWishes(data);
      const floating = data.map((wish, i) => ({
        ...wish,
        left: random(2, 60),
        delay: random(0, 15),
        duration: random(15, 25)
      }));
      setFloatingWishes(floating);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const submitRSVP = async (e) => {
    e.preventDefault();
    if (!guest) return;
    setIsSubmittingRsvp(true);
    const { error } = await supabase.from('cbq_guests').update({ rsvp_status: rsvpFormStatus }).eq('id', guest.id);
    setIsSubmittingRsvp(false);
    
    if (!error) {
      alert("Cảm ơn bạn đã gửi xác nhận!");
      setGuest({...guest, rsvp_status: rsvpFormStatus});
      setIsRsvpModalOpen(false);
    } else {
      alert("Đã xảy ra lỗi khi gửi xác nhận.");
    }
  };
  
  const submitWish = async (e) => {
    e.preventDefault();
    if (!newWish.trim() || !guest) return;
    
    setIsSubmittingWish(true);
    const { data, error } = await supabase.from('cbq_wishes').insert([
      { guest_id: guest.id, guest_name: guest.name, message: newWish.trim() }
    ]).select();
    
    setIsSubmittingWish(false);
    if (!error && data) {
      setNewWish('');
      const newWishData = data[0];
      setWishes([newWishData, ...wishes]);
      setFloatingWishes(prev => [
        ...prev, 
        { ...newWishData, left: random(5, 50), delay: 0, duration: random(15, 20) }
      ]);
    } else {
      alert("Lỗi khi gửi lời chúc: " + (error?.message || 'Không xác định'));
    }
  };

  const shootHeart = () => {
    const id = Date.now() + Math.random();
    setHearts(prev => [...prev, { id, left: random(75, 95) }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 4000);
  };

  const handleSendGift = async () => {
    if (!selectedGift || !guest) return;
    setIsGiftModalOpen(false);
    
    const bannerId = Date.now();
    setGiftBanners(prev => [...prev, { id: bannerId, guestName: guest.name, gift: selectedGift }]);
    setTimeout(() => setGiftBanners(prev => prev.filter(b => b.id !== bannerId)), 4000);

    setActiveGiftEffect(selectedGift.id);
    if(selectedGift.id === 'phao') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } else if (selectedGift.id === 'tim') {
      for(let i=0; i<15; i++) setTimeout(shootHeart, i * 200);
    }
    setTimeout(() => setActiveGiftEffect(null), 5000);

    await supabase.from('cbq_gifts').insert([{
      guest_id: guest.id, guest_name: guest.name, gift_name: selectedGift.name, gift_icon: selectedGift.icon
    }]);
  };

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#7e1717', color: '#f3e6c9'}}>Đang tải thiệp mời...</div>;
  }

  if (!guest) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#7e1717', color: '#f3e6c9'}}>
        <h2>Không tìm thấy thiệp mời!</h2>
        <Link to="/" style={{marginTop: '20px', padding: '10px 20px', backgroundColor: '#ca8a4b', color: 'white', textDecoration: 'none', borderRadius: '5px'}}>Về Trang Chủ</Link>
      </div>
    );
  }

  return (
    <div className="modern-invitation">
      <style>{`
        body { margin: 0; padding: 0; overflow: hidden; background-color: #000; }
        
        .modern-invitation {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: #7e1717;
          background-image: url('https://www.transparenttextures.com/patterns/black-mamba.png');
          font-family: 'Times New Roman', Times, serif;
          color: #333;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .back-btn {
          position: absolute; top: 20px; left: 20px; display: flex; align-items: center; gap: 5px;
          color: #f3e6c9; text-decoration: none; font-family: Arial, sans-serif; z-index: 100;
        }

        .music-btn {
          position: absolute; top: 20px; right: 20px; z-index: 100; cursor: pointer;
          width: 40px; height: 40px; background: rgba(0,0,0,0.5); border-radius: 50%;
          border: 2px solid #ca8a4b; display: flex; justify-content: center; align-items: center;
          color: white; animation: ${isPlaying ? 'spin 4s linear infinite' : 'none'};
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .mobile-container {
          position: relative; width: 100%; max-width: 500px; height: 100%; max-height: 900px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;
        }

        /* TẤM THIỆP CHÍNH */
        .card-main {
          position: relative;
          width: 90%;
          height: 85%;
          background: linear-gradient(to bottom, #fdfbfb, #f3e6c9);
          border-radius: 4px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          padding: 30px 20px;
          box-sizing: border-box;
          text-align: center;
          border: 1px solid #ca8a4b;
          animation: fadeIn 1.5s ease-out;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
        }
        
        @keyframes fadeIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }

        /* Họa tiết góc (Corner ornaments) */
        .card-main::before, .card-main::after {
          content: ''; position: absolute; width: 60px; height: 60px;
          border: 2px solid #ca8a4b; pointer-events: none;
        }
        .card-main::before { top: 10px; left: 10px; border-right: none; border-bottom: none; }
        .card-main::after { bottom: 10px; right: 10px; border-left: none; border-top: none; }

        .inner-border {
          position: absolute; top: 16px; left: 16px; right: 16px; bottom: 16px;
          border: 1px solid rgba(202, 138, 75, 0.4); pointer-events: none;
        }

        .title-box {
          background: #7e1717; color: white; padding: 10px 30px;
          font-size: 18px; font-weight: bold; border: 1px solid #ca8a4b;
          margin-bottom: 25px; margin-top: 15px; letter-spacing: 1px;
        }

        .invite-text { color: #8b0000; font-size: 15px; margin-bottom: 10px; }
        
        .guest-name {
          font-size: 32px; color: #d32f2f; font-weight: bold;
          margin: 10px 0 25px 0; font-family: 'Times New Roman', serif;
        }

        .event-main { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px; text-transform: uppercase; }
        .event-sub { font-size: 14px; color: #555; white-space: pre-line; margin-bottom: 25px; }
        
        .event-time { font-size: 24px; color: #d32f2f; font-weight: bold; margin-bottom: 10px; }
        .event-location { font-size: 15px; color: #7e1717; font-weight: bold; margin-bottom: 5px; }

        .rsvp-open-btn {
          margin-top: auto; margin-bottom: 20px;
          background: linear-gradient(135deg, #d32f2f, #7e1717);
          color: white; padding: 12px 30px; border: none; border-radius: 30px;
          font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;
          cursor: pointer; box-shadow: 0 4px 15px rgba(126,23,23,0.4);
          animation: pulseBtn 2s infinite; z-index: 50;
        }
        @keyframes pulseBtn { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

        /* DANMAKU */
        .danmaku-container {
          position: absolute; top: 0; left: 0; right: 0; bottom: 80px;
          pointer-events: none; z-index: 40; overflow: hidden;
        }
        .danmaku-item {
          position: absolute; bottom: -50px;
          background: rgba(255, 230, 200, 0.85); color: #5a0000;
          padding: 8px 15px; border-radius: 20px;
          font-family: Arial, sans-serif; font-size: 13px; font-weight: bold;
          white-space: nowrap; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          display: flex; align-items: center; gap: 5px;
          animation: floatUp linear infinite; border: 1px solid rgba(202,138,75,0.3);
        }
        @keyframes floatUp { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(-80vh); opacity: 0; } }

        /* HEARTS */
        .hearts-container { position: absolute; top: 0; left: 0; right: 0; bottom: 80px; pointer-events: none; z-index: 60; overflow: hidden; }
        .floating-heart { position: absolute; bottom: -20px; font-size: 24px; color: #ff3366; animation: flyHeart 4s ease-out forwards; }
        @keyframes flyHeart { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-200px) scale(1.5) rotate(15deg); opacity: 0.8; } 100% { transform: translateY(-400px) scale(1) rotate(-15deg); opacity: 0; } }

        /* BOTTOM ACTION BAR (Floating Pills) */
        .action-bar {
          position: absolute; bottom: 20px; left: 10px; right: 10px;
          display: flex; align-items: center; gap: 8px; z-index: 100;
        }
        
        .wish-input-wrapper {
          flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.4);
          border-radius: 30px; padding: 5px; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(5px);
        }
        .wish-input {
          flex: 1; height: 32px; background: transparent; border: none; color: white; padding: 0 10px; font-family: Arial, sans-serif; outline: none;
        }
        .wish-input::placeholder { color: rgba(255,255,255,0.7); }
        .send-btn { background: transparent; color: white; border: none; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; cursor: pointer; }

        .pill-btn {
          background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(5px);
          color: white; border-radius: 30px; padding: 8px 12px; display: flex; align-items: center; gap: 5px;
          font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; cursor: pointer;
        }
        .pill-btn.heart .icon { color: #ff3366; animation: pulseHeart 1s infinite; }
        .pill-btn.gift .icon { color: #facc15; }
        @keyframes pulseHeart { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }

        /* RSVP MODAL */
        .rsvp-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); z-index: 200; display: flex; justify-content: center; align-items: center;
          opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }
        .rsvp-overlay.open { opacity: 1; pointer-events: auto; }
        .rsvp-modal {
          background: white; width: 90%; max-width: 400px; border-radius: 12px; padding: 25px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3); font-family: Arial, sans-serif; transform: scale(0.9); transition: transform 0.3s;
          position: relative;
        }
        .rsvp-overlay.open .rsvp-modal { transform: scale(1); }
        .rsvp-modal h3 { text-align: center; color: #333; margin: 0 0 20px 0; font-size: 20px; }
        .close-rsvp { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 20px; color: #999; cursor: pointer; }
        
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 13px; color: #555; margin-bottom: 8px; }
        .form-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; color: #333; box-sizing: border-box; font-family: inherit; }
        
        .radio-group { display: flex; flex-direction: column; gap: 10px; }
        .radio-label { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #333; cursor: pointer; }
        .radio-label input { width: 18px; height: 18px; accent-color: #ca8a4b; cursor: pointer; }
        
        .submit-rsvp-btn {
          width: 100%; padding: 14px; background: #ca8a4b; color: white; border: none;
          border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;
        }

        /* GIFT MODAL */
        .gift-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); z-index: 200; display: flex; flex-direction: column; justify-content: flex-end;
          opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }
        .gift-overlay.open { opacity: 1; pointer-events: auto; }
        .gift-modal {
          background: white; border-radius: 20px 20px 0 0; padding: 20px;
          transform: translateY(100%); transition: transform 0.3s ease-out; font-family: Arial, sans-serif;
        }
        .gift-overlay.open .gift-modal { transform: translateY(0); }
        .gift-modal h3 { text-align: center; color: #d32f2f; margin: 0 0 15px 0; font-size: 18px; }
        .gift-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
        .gift-item { display: flex; flex-direction: column; align-items: center; padding: 10px 5px; border-radius: 12px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
        .gift-item.selected { background: #fff1f2; border-color: #d32f2f; }
        .gift-icon { font-size: 32px; margin-bottom: 5px; }
        .gift-name { font-size: 11px; color: #475569; text-align: center; }
        .gift-footer { display: flex; gap: 10px; }
        .gift-user-info { flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; font-size: 14px; display: flex; align-items: center; }
        .gift-send-btn { padding: 10px 30px; background: #d32f2f; color: white; border: none; border-radius: 20px; font-weight: bold; cursor: pointer; }

        /* BANNERS & EFFECTS */
        .banner-container { position: absolute; top: 15vh; left: 0; width: 100%; display: flex; flex-direction: column; gap: 10px; align-items: center; z-index: 150; pointer-events: none; }
        .gift-banner { background: linear-gradient(90deg, rgba(211,47,47,0.9), rgba(244,63,94,0.9)); color: white; padding: 8px 20px; border-radius: 30px; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 15px rgba(211,47,47,0.4); animation: slideInBanner 0.5s ease-out, fadeOutBanner 0.5s ease-in 3.5s forwards; }
        .gift-banner-icon { font-size: 20px; background: white; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; }
        @keyframes slideInBanner { 0% { transform: translateX(-100vw); } 100% { transform: translateX(0); } }
        @keyframes fadeOutBanner { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-20px); } }

        .effect-layer { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index: 120; overflow: hidden; }
        .falling-item { position: absolute; font-size: 24px; top: -50px; animation: fallDown linear forwards; }
        .firework-item { position: absolute; font-size: 40px; animation: explode 1s ease-out forwards; opacity: 0; transform: scale(0); }
        @keyframes fallDown { to { transform: translateY(110vh) rotate(360deg); } }
        @keyframes explode { 0% { opacity: 1; transform: scale(0.5); } 50% { opacity: 1; transform: scale(2); } 100% { opacity: 0; transform: scale(3); } }

      `}</style>
      
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} colors={['#ffd700', '#ff0000', '#ffffff', '#daa520']} />}
      
      {/* EFFECT LAYER */}
      {activeGiftEffect === 'hoa' && (
        <div className="effect-layer">
          {Array.from({length: 30}).map((_, i) => (
            <div key={i} className="falling-item" style={{left: `${random(0,100)}vw`, animationDuration: `${random(3,7)}s`, animationDelay: `${random(0,2)}s`}}>🌸</div>
          ))}
        </div>
      )}
      {activeGiftEffect === 'bo_hoa' && (
        <div className="effect-layer">
          {Array.from({length: 15}).map((_, i) => (
            <div key={i} className="falling-item" style={{left: `${random(0,100)}vw`, fontSize: '40px', animationDuration: `${random(4,6)}s`, animationDelay: `${random(0,1)}s`}}>💐</div>
          ))}
        </div>
      )}
      {activeGiftEffect === 'banh' && (
        <div className="effect-layer">
          <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '120px', animation: 'explode 3s ease-out forwards'}}>🎂</div>
        </div>
      )}
      {activeGiftEffect === 'khoa' && (
        <div className="effect-layer">
          <div style={{position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '100px', animation: 'explode 3s ease-out forwards'}}>🔒</div>
        </div>
      )}
      {activeGiftEffect === 'phao_hoa' && (
        <div className="effect-layer">
          {Array.from({length: 10}).map((_, i) => (
            <div key={i} className="firework-item" style={{left: `${random(10,90)}vw`, top: `${random(10,50)}vh`, animationDelay: `${random(0,1.5)}s`}}>🎆</div>
          ))}
        </div>
      )}

      {/* GIFT BANNERS */}
      <div className="banner-container">
        {giftBanners.map(b => (
          <div key={b.id} className="gift-banner">
            <div className="gift-banner-icon">{b.gift.icon}</div>
            <span>{b.guestName} vừa tặng một {b.gift.name}!</span>
          </div>
        ))}
      </div>

      <audio ref={audioRef} loop src="https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3" preload="auto" />
      <div className="music-btn" onClick={toggleAudio}>🎵</div>

      <div className="mobile-container">
        <div className="card-main">
          <div className="inner-border"></div>
          
          <div className="title-box">THƯ MỜI DỰ TIỆC</div>
          
          {config && (
            <>
              <div className="invite-text">Trân trọng kính mời</div>
              <div className="guest-name">{guest.name}</div>
              
              <div className="event-main">Tham dự buổi tiệc</div>
              <div className="event-sub">{config.event_name_main}<br/>{config.event_name_sub}</div>
              
              <div className="event-time">{config.time}</div>
              
              <div style={{marginTop: '20px'}}>
                <div className="event-location">📍 TẠI ĐỊA ĐIỂM:</div>
                <div style={{fontSize: '14px', whiteSpace: 'pre-line', color: '#555'}}>{config.location}</div>
              </div>
            </>
          )}

          <button className="rsvp-open-btn" onClick={() => setIsRsvpModalOpen(true)}>Xác nhận tham dự</button>
        </div>

        <div className="danmaku-container">
          {floatingWishes.map((w, i) => (
            <div key={`${w.id}-${i}`} className="danmaku-item" style={{ left: `${w.left}%`, animationDelay: `${w.delay}s`, animationDuration: `${w.duration}s` }}>
              <img src="https://ui-avatars.com/api/?name=User&background=fff&color=d32f2f&rounded=true&size=20" alt="avatar" style={{borderRadius: '50%'}} />
              <strong>{w.guest_name}:</strong> {w.message}
            </div>
          ))}
        </div>

        <div className="hearts-container">
          {hearts.map(h => (
            <div key={h.id} className="floating-heart" style={{ left: `${h.left}%` }}>❤️</div>
          ))}
        </div>

        <form onSubmit={submitWish} className="action-bar">
          <div className="wish-input-wrapper">
            <input type="text" className="wish-input" placeholder="Gửi lời chúc..." value={newWish} onChange={(e) => setNewWish(e.target.value)} required />
            <button type="submit" className="send-btn" disabled={isSubmittingWish}><Send size={16} /></button>
          </div>
          
          <button type="button" className="pill-btn heart" onClick={shootHeart}>
            <span className="icon">❤️</span> Bắn tim
          </button>
          <button type="button" className="pill-btn gift" onClick={() => setIsGiftModalOpen(true)}>
            <span className="icon">🎁</span> Tặng quà
          </button>
        </form>
      </div>

      {/* RSVP MODAL */}
      <div className={`rsvp-overlay ${isRsvpModalOpen ? 'open' : ''}`}>
        <div className="rsvp-modal">
          <button className="close-rsvp" onClick={() => setIsRsvpModalOpen(false)}>×</button>
          <h3>Xác nhận tham dự</h3>
          
          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            <input type="text" className="form-input" value={guest.name} disabled />
          </div>
          
          <div className="form-group">
            <label className="form-label">Bạn sẽ tham dự chứ?</label>
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" name="rsvpStatus" value="attending" checked={rsvpFormStatus === 'attending'} onChange={() => setRsvpFormStatus('attending')} />
                Có, tôi sẽ tham dự
              </label>
              <label className="radio-label">
                <input type="radio" name="rsvpStatus" value="declined" checked={rsvpFormStatus === 'declined'} onChange={() => setRsvpFormStatus('declined')} />
                Tôi bận, rất tiếc không thể tham dự
              </label>
            </div>
          </div>
          
          <button className="submit-rsvp-btn" onClick={submitRSVP} disabled={isSubmittingRsvp}>
            {isSubmittingRsvp ? 'Đang gửi...' : 'Gửi xác nhận'}
          </button>
        </div>
      </div>

      {/* GIFT MODAL */}
      <div className={`gift-overlay ${isGiftModalOpen ? 'open' : ''}`} onClick={(e) => { if(e.target === e.currentTarget) setIsGiftModalOpen(false); }}>
        <div className="gift-modal">
          <h3>Tặng Quà</h3>
          <div className="gift-grid">
            {GIFTS.map(gift => (
              <div key={gift.id} className={`gift-item ${selectedGift.id === gift.id ? 'selected' : ''}`} onClick={() => setSelectedGift(gift)}>
                <div className="gift-icon">{gift.icon}</div>
                <div className="gift-name">{gift.name}</div>
              </div>
            ))}
          </div>
          <div className="gift-footer">
            <div className="gift-user-info">👤 {guest?.name}</div>
            <button className="gift-send-btn" onClick={handleSendGift}>Gửi</button>
          </div>
        </div>
      </div>

    </div>
  );
}
