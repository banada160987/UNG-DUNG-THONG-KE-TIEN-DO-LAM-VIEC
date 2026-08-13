import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Send } from 'lucide-react';
import Confetti from 'react-confetti';

const random = (min, max) => Math.random() * (max - min) + min;

// Helper to convert Google Drive share links to direct image links
const getDirectImageUrl = (url) => {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
};

const GIFTS = [
  { id: 'tim', name: 'Bắn tim', icon: '💖' },
  { id: 'bo_hoa', name: 'Bó hoa', icon: '💐' },
  { id: 'phao', name: 'Pháo mừng', icon: '🎉' },
  { id: 'phao_hoa', name: 'Pháo hoa', icon: '🎆' },
  { id: 'cup', name: 'Cúp vàng', icon: '🏆' },
  { id: 'diem10', name: 'Điểm 10', icon: '💯' },
  { id: 'mu', name: 'Mũ cử nhân', icon: '🎓' },
  { id: 'sach', name: 'Sách vở', icon: '📚' }
];

// Optional: Keep for fallback if config is empty
const DEFAULT_GALLERY = [
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&q=80",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&q=80"
];

export default function OnlineInvitation() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [config, setConfig] = useState(null);
  
  const [showConfetti, setShowConfetti] = useState(true);

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

  // Audio & Pages
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);
  const audioRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchData();
    setTimeout(() => setShowConfetti(false), 5000);
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
        setConfig(parsed);
      }
      
      await fetchWishes();
      // Wait for user interaction to play audio.

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
      const floating = data.map((wish) => ({
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

  const handleScroll = (e) => {
    if (!scrollRef.current) return;
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const pageIndex = Math.round(scrollLeft / width);
    setActivePage(pageIndex);
  };

  const scrollToPage = (index) => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
      setActivePage(index);
    }
  };

  const handleOpenInvitation = () => {
    setHasOpened(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#7e1717', color: '#f3e6c9'}}>Đang tải thiệp mời...</div>;
  if (!guest) return (
    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#7e1717', color: '#f3e6c9'}}>
      <h2>Không tìm thấy thiệp mời!</h2>
      <Link to="/" style={{marginTop: '20px', padding: '10px 20px', backgroundColor: '#ca8a4b', color: 'white', textDecoration: 'none', borderRadius: '5px'}}>Về Trang Chủ</Link>
    </div>
  );

  return (
    <div className="modern-invitation">
      <style>{`
        body { margin: 0; padding: 0; overflow: hidden; background-color: #000; font-family: 'Times New Roman', Times, serif; }
        
        .modern-invitation {
          position: relative; width: 100vw; height: 100vh; overflow: hidden;
          background-color: #1a1a1a; display: flex; justify-content: center; align-items: center;
        }

        .mobile-container {
          position: relative; width: 100%; max-width: 500px; height: 100%; max-height: 900px;
          background-color: #7e1717; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }

        /* ENTRANCE OVERLAY */
        .entrance-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: #ffffff;
          background-image: radial-gradient(circle at center, #ffffff 0%, #fff1f2 100%);
          z-index: 9999; display: flex; justify-content: center; align-items: center; text-align: center; color: #333;
          transition: opacity 1s ease-out, transform 1s ease-out;
        }
        .entrance-overlay.opened { opacity: 0; pointer-events: none; transform: scale(1.1); }
        .entrance-content { animation: fadeInUp 1s ease-out; display: flex; flex-direction: column; align-items: center; }
        .entrance-logo { width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; mix-blend-mode: multiply; }
        .entrance-title { font-size: 22px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; color: #be123c; }
        .entrance-subtitle { font-size: 16px; margin-bottom: 15px; font-style: italic; color: #64748b; }
        .entrance-guest { font-size: 38px; color: #b45309; margin-bottom: 40px; font-weight: bold; }
        .entrance-btn {
          background: linear-gradient(135deg, #e11d48, #be123c); color: white; padding: 15px 50px;
          border: none; border-radius: 30px; font-size: 18px; font-weight: bold; cursor: pointer;
          box-shadow: 0 5px 15px rgba(225, 29, 72, 0.4); animation: pulseBtn 2s infinite;
        }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        /* HORIZONTAL SCROLL SNAP */
        .pages-wrapper {
          display: flex; width: 100%; height: 100%; overflow-x: auto; overflow-y: hidden;
          scroll-snap-type: x mandatory; scroll-behavior: smooth;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .pages-wrapper::-webkit-scrollbar { display: none; }
        
        .page {
          flex: 0 0 100%; width: 100%; height: 100%; scroll-snap-align: start;
          position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
        }

        /* PAGE 1: COVER */
        .page-cover {
          background-image: linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 241, 242, 0.9)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80');
          background-size: cover; background-position: center; color: #333; text-align: center;
        }
        .cover-title { font-size: 32px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; color: #be123c; }
        .cover-subtitle { font-size: 18px; font-style: italic; margin-bottom: 50px; color: #64748b; }
        .cover-guest { font-size: 20px; margin-bottom: 10px; }
        .cover-name { font-size: 38px; color: #b45309; font-weight: bold; margin-bottom: 50px; }
        .swipe-hint { position: absolute; bottom: 90px; font-size: 14px; color: #e11d48; font-weight: bold; animation: bounceRight 2s infinite; display: flex; align-items: center; gap: 5px; }
        @keyframes bounceRight { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }

        /* PAGE 2: DETAILS */
        .page-details {
          background: linear-gradient(to bottom, #fdfbfb, #f3e6c9); color: #333; padding: 20px; box-sizing: border-box; text-align: center;
        }
        .details-card {
          width: 90%; height: 85%; border: 1px solid #ca8a4b; padding: 30px 20px; box-sizing: border-box;
          position: relative; display: flex; flex-direction: column; align-items: center;
        }
        .details-card::before, .details-card::after {
          content: ''; position: absolute; width: 40px; height: 40px; border: 2px solid #ca8a4b; pointer-events: none;
        }
        .details-card::before { top: 10px; left: 10px; border-right: none; border-bottom: none; }
        .details-card::after { bottom: 10px; right: 10px; border-left: none; border-top: none; }
        .title-box { background: #7e1717; color: white; padding: 8px 20px; font-size: 16px; font-weight: bold; border: 1px solid #ca8a4b; margin-bottom: 20px; margin-top: 10px; }
        .event-time { font-size: 24px; color: #d32f2f; font-weight: bold; margin: 20px 0; }
        .event-location { font-size: 16px; color: #7e1717; font-weight: bold; margin-bottom: 5px; }

        /* PAGE 3: AGENDA (Timeline) */
        .page-agenda {
          background: #fdfbfb; color: #333; padding: 20px; box-sizing: border-box;
          display: flex; flex-direction: column;
        }
        .timeline-container {
          width: 90%; margin: 0 auto; overflow-y: auto; flex: 1; padding: 20px 0;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .timeline-container::-webkit-scrollbar { display: none; }
        .timeline-item { display: flex; gap: 15px; margin-bottom: 20px; }
        .timeline-time { min-width: 85px; font-weight: bold; color: #d32f2f; text-align: right; font-size: 14px; }
        .timeline-divider { width: 2px; background: #fca5a5; position: relative; margin-top: 5px; }
        .timeline-divider::before { content: ''; position: absolute; top: -5px; left: -4px; width: 10px; height: 10px; border-radius: 50%; background: #d32f2f; }
        .timeline-content-text { flex: 1; font-size: 14px; white-space: pre-line; color: #475569; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0; }
        .timeline-item:last-child .timeline-content-text { border-bottom: none; }

        /* PAGE 4: GALLERY */
        .page-gallery {
          background: #fff5f5; color: #e11d48; padding: 20px; box-sizing: border-box;
        }
        .gallery-grid {
          width: 100%; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
          height: 70%; overflow-y: auto; margin-top: 20px;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .gallery-grid::-webkit-scrollbar { display: none; }
        .gallery-item { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; border: 2px solid #f43f5e; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }

        /* PAGE 5: INTERACTIVE (Wishes & RSVP) */
        .page-interactive {
          background: linear-gradient(to bottom, #ef4444, #b91c1c); color: white;
          position: relative;
        }
        .interactive-content {
          position: absolute; top: 15%; width: 90%; text-align: center; z-index: 10;
        }
        .rsvp-open-btn {
          background: #fde047; color: #b45309; padding: 15px 40px;
          border: none; border-radius: 30px; font-size: 18px; font-weight: bold; cursor: pointer;
          box-shadow: 0 5px 20px rgba(0,0,0,0.3); animation: pulseBtn 2s infinite; margin-top: 30px;
        }

        /* PAGINATION DOTS */
        .pagination {
          position: absolute; bottom: 80px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; z-index: 100;
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); transition: all 0.3s; cursor: pointer; }
        .dot.active { background: white; transform: scale(1.3); box-shadow: 0 0 5px rgba(0,0,0,0.3); }

        /* ACTION BAR & OTHERS (Kept from previous) */
        .music-btn { position: absolute; top: 20px; right: 20px; z-index: 100; width: 40px; height: 40px; background: rgba(0,0,0,0.5); border-radius: 50%; border: 2px solid #ca8a4b; display: flex; justify-content: center; align-items: center; color: white; cursor: pointer; animation: ${isPlaying ? 'spin 4s linear infinite' : 'none'}; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .action-bar { position: absolute; bottom: 20px; left: 10px; right: 10px; display: flex; align-items: center; gap: 8px; z-index: 100; }
        .wish-input-wrapper { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.5); border-radius: 30px; padding: 5px; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(5px); }
        .wish-input { flex: 1; height: 32px; background: transparent; border: none; color: white; padding: 0 10px; outline: none; }
        .wish-input::placeholder { color: rgba(255,255,255,0.7); }
        .send-btn { background: transparent; color: white; border: none; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
        .pill-btn { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(5px); color: white; border-radius: 30px; padding: 8px 12px; display: flex; align-items: center; gap: 5px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; cursor: pointer; }
        
        .danmaku-container { position: absolute; top: 0; left: 0; right: 0; bottom: 80px; pointer-events: none; z-index: 40; overflow: hidden; }
        .danmaku-item { position: absolute; bottom: -50px; background: rgba(255, 255, 255, 0.9); color: #5a0000; padding: 8px 15px; border-radius: 20px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; white-space: nowrap; display: flex; align-items: center; gap: 5px; animation: floatUp linear infinite; border: 1px solid rgba(202,138,75,0.5); }
        @keyframes floatUp { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(-80vh); opacity: 0; } }

        .hearts-container { position: absolute; top: 0; left: 0; right: 0; bottom: 80px; pointer-events: none; z-index: 60; overflow: hidden; }
        .floating-heart { position: absolute; bottom: -20px; font-size: 24px; color: #ff3366; animation: flyHeart 4s ease-out forwards; }
        @keyframes flyHeart { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-200px) scale(1.5) rotate(15deg); opacity: 0.8; } 100% { transform: translateY(-400px) scale(1) rotate(-15deg); opacity: 0; } }

        /* MODALS (Kept from previous) */
        .rsvp-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        .rsvp-overlay.open { opacity: 1; pointer-events: auto; }
        .rsvp-modal { background: white; width: 90%; max-width: 400px; border-radius: 12px; padding: 25px; transform: scale(0.9); transition: transform 0.3s; position: relative; }
        .rsvp-overlay.open .rsvp-modal { transform: scale(1); }
        .close-rsvp { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 20px; color: #999; cursor: pointer; }
        .submit-rsvp-btn { width: 100%; padding: 14px; background: #ca8a4b; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        
        .gift-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        .gift-overlay.open { opacity: 1; pointer-events: auto; }
        .gift-modal { background: white; border-radius: 20px 20px 0 0; padding: 20px; width: 100%; max-width: 500px; transform: translateY(100%); transition: transform 0.3s ease-out; }
        .gift-overlay.open .gift-modal { transform: translateY(0); }
        .gift-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; text-align: center; }
        .gift-item { padding: 10px 5px; border-radius: 12px; cursor: pointer; border: 2px solid transparent; }
        .gift-item.selected { background: #fff1f2; border-color: #d32f2f; }
        .gift-send-btn { padding: 10px 30px; background: #d32f2f; color: white; border: none; border-radius: 20px; font-weight: bold; cursor: pointer; }

        .banner-container { position: absolute; top: 15vh; left: 0; width: 100%; display: flex; flex-direction: column; gap: 10px; align-items: center; z-index: 150; pointer-events: none; }
        .gift-banner { background: linear-gradient(90deg, rgba(211,47,47,0.9), rgba(244,63,94,0.9)); color: white; padding: 8px 20px; border-radius: 30px; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 10px; animation: slideInBanner 0.5s ease-out, fadeOutBanner 0.5s ease-in 3.5s forwards; }
        @keyframes slideInBanner { 0% { transform: translateX(-100vw); } 100% { transform: translateX(0); } }
        @keyframes fadeOutBanner { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-20px); } }
        
        .effect-layer { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index: 120; overflow: hidden; }
        .falling-item { position: absolute; font-size: 24px; top: -50px; animation: fallDown linear forwards; }
        .firework-item { position: absolute; font-size: 40px; animation: explode 1s ease-out forwards; opacity: 0; transform: scale(0); }
        @keyframes fallDown { to { transform: translateY(110vh) rotate(360deg); } }
        @keyframes explode { 0% { opacity: 1; transform: scale(0.5); } 50% { opacity: 1; transform: scale(2); } 100% { opacity: 0; transform: scale(3); } }
        @keyframes pulseBtn { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      `}</style>
      
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} colors={['#ffd700', '#ff0000', '#ffffff', '#daa520']} />}
      
      {/* EFFECT LAYER (Gifts) */}
      {activeGiftEffect === 'sach' && (
        <div className="effect-layer">
          {Array.from({length: 20}).map((_, i) => (
            <div key={i} className="falling-item" style={{left: `${random(0,100)}vw`, animationDuration: `${random(3,7)}s`, animationDelay: `${random(0,2)}s`}}>📚</div>
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
      {activeGiftEffect === 'diem10' && (
        <div className="effect-layer">
          <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '120px', animation: 'explode 3s ease-out forwards'}}>💯</div>
        </div>
      )}
      {activeGiftEffect === 'cup' && (
        <div className="effect-layer">
          <div style={{position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '100px', animation: 'explode 3s ease-out forwards'}}>🏆</div>
        </div>
      )}
      {activeGiftEffect === 'mu' && (
        <div className="effect-layer">
          <div style={{position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '100px', animation: 'explode 3s ease-out forwards'}}>🎓</div>
        </div>
      )}
      {activeGiftEffect === 'phao_hoa' && (
        <div className="effect-layer">
          {Array.from({length: 10}).map((_, i) => (
            <div key={i} className="firework-item" style={{left: `${random(10,90)}vw`, top: `${random(10,50)}vh`, animationDelay: `${random(0,1.5)}s`}}>🎆</div>
          ))}
        </div>
      )}

      {/* BANNERS */}
      <div className="banner-container">
        {giftBanners.map(b => (
          <div key={b.id} className="gift-banner">
            <div style={{fontSize: '20px', background: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{b.gift.icon}</div>
            <span>{b.guestName} vừa tặng {b.gift.name}!</span>
          </div>
        ))}
      </div>

      <audio ref={audioRef} loop src={config?.bg_music || "/nhacnen.mp3"} preload="auto" />

      <div className="mobile-container">
        {/* ENTRANCE OVERLAY */}
        <div className={`entrance-overlay ${hasOpened ? 'opened' : ''}`}>
          <div className="entrance-content">
             <img src={config?.logo_url || '/logo.jpg'} alt="Logo" className="entrance-logo" onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg'; }} />
             <h2 className="entrance-title">{config?.school_name}</h2>
             <p className="entrance-subtitle">Trân trọng kính mời</p>
             <h1 className="entrance-guest">{guest?.name}</h1>
             <button className="entrance-btn" onClick={handleOpenInvitation}>MỞ THIỆP</button>
          </div>
        </div>

        <div className="music-btn" onClick={toggleAudio}>🎵</div>

        {/* FLIPBOOK PAGES */}
        <div className="pages-wrapper" ref={scrollRef} onScroll={handleScroll}>
          
          {/* PAGE 1: COVER */}
          <div className="page page-cover">
            <h1 className="cover-title">Lễ Kỷ Niệm<br/>30 Năm</h1>
            <div className="cover-subtitle">{config?.school_name || "THPT CAO BÁ QUÁT"}</div>
            
            <div className="cover-guest">Trân trọng kính mời</div>
            <div className="cover-name">{guest.name}</div>
            
            <div className="swipe-hint">
              Vuốt sang trái để mở thiệp <span style={{fontSize: '20px'}}>👉</span>
            </div>
          </div>

          {/* PAGE 2: DETAILS */}
          <div className="page page-details">
            <div className="details-card">
              <div className="title-box">THÔNG TIN SỰ KIỆN</div>
              
              {(config?.logo_url || '/logo.jpg') && (
                <img src={config?.logo_url || '/logo.jpg'} alt="Logo" style={{ maxWidth: '140px', maxHeight: '140px', objectFit: 'contain', marginTop: '15px', mixBlendMode: 'multiply' }} onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg'; }} />
              )}
              
              <div style={{fontSize: '18px', fontWeight: 'bold', marginTop: '15px', textTransform: 'uppercase'}}>{config?.event_name_main}</div>
              <div style={{fontSize: '14px', color: '#555', marginTop: '5px', whiteSpace: 'pre-line'}}>{config?.event_name_sub}</div>
              
              <div className="event-time">{config?.time}</div>
              
              <div style={{marginTop: '20px', width: '100%'}}>
                <div className="event-location">📍 TẠI ĐỊA ĐIỂM:</div>
                <div style={{fontSize: '15px', whiteSpace: 'pre-line', color: '#333'}}>{config?.location}</div>
              </div>
            </div>
          </div>

          {/* PAGE 3: AGENDA (TIMELINE) */}
          <div className="page page-agenda">
             <div className="title-box" style={{margin: '0 auto 10px'}}>CHƯƠNG TRÌNH</div>
             <div style={{textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '20px'}}>Các hoạt động chính trong buổi lễ</div>
             
             <div className="timeline-container">
                 {config?.agenda && config.agenda.length > 0 ? (
                   config.agenda.map((item, i) => (
                      <div key={i} className="timeline-item">
                          <div className="timeline-time">{item.time}</div>
                          <div className="timeline-divider"></div>
                          <div className="timeline-content-text">{item.content}</div>
                      </div>
                   ))
                 ) : (
                   <p style={{textAlign: 'center', color: '#999'}}>Đang cập nhật chương trình...</p>
                 )}
             </div>
          </div>

          {/* PAGE 4: GALLERY */}
          <div className="page page-gallery">
            <h2 style={{margin: '0', textAlign: 'center'}}>THƯ VIỆN ẢNH</h2>
            <div style={{textAlign: 'center', fontSize: '13px', marginBottom: '10px'}}>Những khoảnh khắc đáng nhớ</div>
            <div className="gallery-grid">
              {(config?.gallery_images && config.gallery_images.length > 0 ? config.gallery_images : DEFAULT_GALLERY).map((src, i) => (
                <img key={i} src={getDirectImageUrl(src)} alt="Gallery" className="gallery-item" />
              ))}
            </div>
          </div>

          {/* PAGE 5: RSVP & WISHES */}
          <div className="page page-interactive">
            <div className="interactive-content">
              <h2 style={{color: '#f3e6c9', marginBottom: '10px'}}>CHUNG VUI CÙNG CHÚNG TÔI</h2>
              <p style={{fontSize: '14px', margin: '0 20px', color: '#ddd'}}>Sự hiện diện của bạn là niềm vinh hạnh lớn nhất của nhà trường.</p>
              
              <button className="rsvp-open-btn" onClick={() => setIsRsvpModalOpen(true)}>Xác nhận tham dự</button>
            </div>
          </div>
        </div>

        {/* PAGINATION DOTS */}
        <div className="pagination">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`dot ${activePage === i ? 'active' : ''}`} onClick={() => scrollToPage(i)} />
          ))}
        </div>

        {/* GLOBAL DANMAKU & HEARTS */}
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

        {/* FIXED ACTION BAR */}
        <form onSubmit={submitWish} className="action-bar">
          <div className="wish-input-wrapper">
            <input type="text" className="wish-input" placeholder="Gửi lời chúc..." value={newWish} onChange={(e) => setNewWish(e.target.value)} required />
            <button type="submit" className="send-btn" disabled={isSubmittingWish}><Send size={16} /></button>
          </div>
          <button type="button" className="pill-btn" onClick={shootHeart}>
            <span style={{color: '#ff3366'}}>❤️</span> Bắn tim
          </button>
          <button type="button" className="pill-btn" onClick={() => setIsGiftModalOpen(true)}>
            <span>🎁</span> Tặng quà
          </button>
        </form>
      </div>

      {/* RSVP MODAL */}
      <div className={`rsvp-overlay ${isRsvpModalOpen ? 'open' : ''}`}>
        <div className="rsvp-modal">
          <button className="close-rsvp" onClick={() => setIsRsvpModalOpen(false)}>×</button>
          <h3 style={{textAlign: 'center', color: '#333'}}>Xác nhận tham dự</h3>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', fontSize: '13px', color: '#555', marginBottom: '8px'}}>Họ và tên</label>
            <input type="text" style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9', boxSizing: 'border-box'}} value={guest.name} disabled />
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', fontSize: '13px', color: '#555', marginBottom: '8px'}}>Bạn sẽ tham dự chứ?</label>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer'}}>
                <input type="radio" name="rsvpStatus" value="attending" checked={rsvpFormStatus === 'attending'} onChange={() => setRsvpFormStatus('attending')} style={{accentColor: '#ca8a4b', width: '18px', height: '18px'}} />
                Có, tôi sẽ tham dự
              </label>
              <label style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer'}}>
                <input type="radio" name="rsvpStatus" value="declined" checked={rsvpFormStatus === 'declined'} onChange={() => setRsvpFormStatus('declined')} style={{accentColor: '#ca8a4b', width: '18px', height: '18px'}} />
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
          <h3 style={{textAlign: 'center', color: '#d32f2f', margin: '0 0 15px 0'}}>Tặng Quà</h3>
          <div className="gift-grid">
            {GIFTS.map(gift => (
              <div key={gift.id} className={`gift-item ${selectedGift.id === gift.id ? 'selected' : ''}`} onClick={() => setSelectedGift(gift)}>
                <div style={{fontSize: '32px', marginBottom: '5px'}}>{gift.icon}</div>
                <div style={{fontSize: '11px', color: '#475569'}}>{gift.name}</div>
              </div>
            ))}
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <div style={{flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '14px'}}>👤 {guest?.name}</div>
            <button className="gift-send-btn" onClick={handleSendGift}>Gửi</button>
          </div>
        </div>
      </div>

    </div>
  );
}
