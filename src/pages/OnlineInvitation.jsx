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

  const addToCalendar = () => {
    const title = encodeURIComponent(config?.event_name_main ? `Lễ Kỷ Niệm - ${config.school_name || 'THPT Cao Bá Quát'}` : 'Lễ Kỷ Niệm 30 Năm THPT Cao Bá Quát');
    const details = encodeURIComponent(`Trân trọng kính mời ${guest?.name || 'Quý khách'} tham dự ${config?.event_name_main || 'Lễ Kỷ Niệm 30 Năm'}.`);
    const location = encodeURIComponent((config?.location || 'Trường THPT Cao Bá Quát').replace(/\n/g, ' '));
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=20251118T073000Z/20251118T113000Z`;
    window.open(url, '_blank');
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(config?.location || 'Trường THPT Cao Bá Quát');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
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
        body { margin: 0; padding: 0; overflow: hidden; background-color: #000; font-family: 'Montserrat', sans-serif; }
        
        .modern-invitation {
          position: relative; width: 100vw; height: 100vh; overflow: hidden;
          background-color: #1a1a1a; display: flex; justify-content: center; align-items: center;
          font-family: 'Montserrat', sans-serif;
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
        .entrance-content { animation: fadeInUp 1s ease-out; display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; }
        .entrance-logo { width: 130px; height: 130px; object-fit: contain; margin-bottom: 20px; mix-blend-mode: multiply; }
        .entrance-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; color: #be123c; }
        .entrance-subtitle { font-family: 'Montserrat', sans-serif; font-size: 15px; margin-bottom: 12px; font-style: italic; color: #64748b; }
        .entrance-guest { font-family: 'Great Vibes', cursive; font-size: 44px; color: #b45309; margin-bottom: 35px; font-weight: 400; line-height: 1.2; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
        .entrance-btn {
          background: linear-gradient(135deg, #e11d48, #be123c); color: white; padding: 15px 50px;
          border: none; border-radius: 30px; font-size: 18px; font-weight: bold; cursor: pointer;
          box-shadow: 0 5px 20px rgba(225, 29, 72, 0.4); animation: pulseBtn 2s infinite; letter-spacing: 1px;
        }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        /* GOLD SPARKLES PARTICLES */
        .sparkles-container { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 1; }
        .sparkle-dot { position: absolute; background: radial-gradient(circle, #fde047 0%, #ca8a4b 100%); border-radius: 50%; animation: sparkleFloat 4s infinite ease-in-out; opacity: 0.7; }
        @keyframes sparkleFloat { 0%, 100% { transform: translateY(0) scale(0.8); opacity: 0.3; } 50% { transform: translateY(-20px) scale(1.2); opacity: 0.9; } }

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
          background-image: linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 241, 242, 0.92)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80');
          background-size: cover; background-position: center; color: #333; text-align: center; padding: 20px; box-sizing: border-box;
        }
        .cover-title { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 800; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px; color: #be123c; line-height: 1.2; }
        .cover-subtitle { font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 35px; color: #64748b; letter-spacing: 1px; }
        .cover-guest { font-family: 'Montserrat', sans-serif; font-size: 15px; margin-bottom: 8px; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
        .cover-name { font-family: 'Great Vibes', cursive; font-size: 46px; color: #b45309; font-weight: 400; margin-bottom: 45px; line-height: 1.2; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
        .swipe-hint { position: absolute; bottom: 85px; font-size: 13px; color: #be123c; font-weight: 700; animation: bounceRight 2s infinite; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.9); padding: 8px 18px; border-radius: 20px; border: 1px solid #fecdd3; box-shadow: 0 4px 12px rgba(225,29,72,0.15); }
        @keyframes bounceRight { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(8px); } }

        /* PAGE 2: DETAILS */
        .page-details {
          background: linear-gradient(to bottom, #fdfbfb, #f3e6c9); color: #333; padding: 20px; box-sizing: border-box; text-align: center;
        }
        .details-card {
          width: 90%; height: 86%; border: 1.5px solid #ca8a4b; padding: 25px 20px; box-sizing: border-box;
          position: relative; display: flex; flex-direction: column; align-items: center; overflow-y: auto;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .details-card::-webkit-scrollbar { display: none; }
        .details-card::before, .details-card::after {
          content: ''; position: absolute; width: 35px; height: 35px; border: 2px solid #ca8a4b; pointer-events: none;
        }
        .details-card::before { top: 8px; left: 8px; border-right: none; border-bottom: none; }
        .details-card::after { bottom: 8px; right: 8px; border-left: none; border-top: none; }
        .title-box { font-family: 'Playfair Display', serif; background: #7e1717; color: #f3e6c9; padding: 8px 22px; font-size: 15px; font-weight: 700; border: 1px solid #ca8a4b; margin-bottom: 15px; margin-top: 5px; letter-spacing: 1px; }
        .event-time { font-family: 'Playfair Display', serif; font-size: 22px; color: #d32f2f; font-weight: bold; margin: 15px 0; }
        .event-location { font-family: 'Montserrat', sans-serif; font-size: 15px; color: #7e1717; font-weight: bold; margin-bottom: 5px; }

        /* LOGISTICS BUTTONS */
        .logistics-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; margin-top: 18px; }
        .logistics-btn {
          width: 100%; padding: 11px 16px; border-radius: 25px; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700;
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .maps-btn { background: #15803d; color: white; }
        .calendar-btn { background: #b45309; color: white; }
        .logistics-btn:active { transform: scale(0.97); }

        /* PAGE 3: AGENDA (Timeline) */
        .page-agenda {
          background: #fdfbfb; color: #333; padding: 20px; box-sizing: border-box;
          display: flex; flex-direction: column;
        }
        .timeline-container {
          width: 90%; margin: 0 auto; overflow-y: auto; flex: 1; padding: 15px 0;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .timeline-container::-webkit-scrollbar { display: none; }
        .timeline-item { display: flex; gap: 15px; margin-bottom: 18px; }
        .timeline-time { min-width: 80px; font-weight: 700; color: #d32f2f; text-align: right; font-size: 13px; font-family: 'Montserrat', sans-serif; }
        .timeline-divider { width: 2px; background: #fca5a5; position: relative; margin-top: 4px; }
        .timeline-divider::before { content: ''; position: absolute; top: -4px; left: -4px; width: 10px; height: 10px; border-radius: 50%; background: #d32f2f; }
        .timeline-content-text { flex: 1; font-size: 13.5px; white-space: pre-line; color: #334155; padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0; font-family: 'Montserrat', sans-serif; }
        .timeline-item:last-child .timeline-content-text { border-bottom: none; }

        /* PAGE 4: GALLERY */
        .page-gallery {
          background: #fff5f5; color: #be123c; padding: 20px; box-sizing: border-box;
        }
        .gallery-grid {
          width: 100%; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
          height: 70%; overflow-y: auto; margin-top: 15px;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .gallery-grid::-webkit-scrollbar { display: none; }
        .gallery-item { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; border: 2px solid #f43f5e; box-shadow: 0 4px 8px rgba(0,0,0,0.12); }

        /* PAGE 5: INTERACTIVE (Wishes & RSVP) */
        .page-interactive {
          background: linear-gradient(to bottom, #be123c, #881337); color: white;
          position: relative;
        }
        .interactive-content {
          position: absolute; top: 12%; width: 90%; text-align: center; z-index: 10;
        }
        .rsvp-open-btn {
          background: linear-gradient(135deg, #fde047, #eab308); color: #881337; padding: 14px 38px;
          border: none; border-radius: 30px; font-size: 16px; font-weight: 800; cursor: pointer;
          box-shadow: 0 5px 20px rgba(0,0,0,0.3); animation: pulseBtn 2s infinite; margin-top: 20px; font-family: 'Montserrat', sans-serif;
        }
        .vip-pass-btn {
          background: linear-gradient(135deg, #ffffff, #fef08a); color: #881337; padding: 12px 28px;
          border: none; border-radius: 30px; font-size: 14px; font-weight: bold; cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3); margin-top: 15px; display: inline-flex; align-items: center; gap: 8px;
        }

        /* SIDE NAVIGATION CHEVRON ARROWS FOR ELDERLY GUESTS */
        .nav-side-btn {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 120;
          width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.85);
          color: #be123c; border: 1px solid #fecdd3; display: flex; justify-content: center; align-items: center;
          font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        }
        .nav-side-btn.left { left: 8px; }
        .nav-side-btn.right { right: 8px; }
        .nav-side-btn:hover { background: #be123c; color: white; transform: translateY(-50%) scale(1.1); }

        /* PAGINATION DOTS */
        .pagination {
          position: absolute; bottom: 75px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; z-index: 100;
        }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.5); transition: all 0.3s; cursor: pointer; }
        .dot.active { background: white; transform: scale(1.3); box-shadow: 0 0 5px rgba(0,0,0,0.3); }

        /* ACTION BAR & OTHERS */
        .music-btn { position: absolute; top: 18px; right: 18px; z-index: 100; width: 38px; height: 38px; background: rgba(0,0,0,0.5); border-radius: 50%; border: 2px solid #ca8a4b; display: flex; justify-content: center; align-items: center; color: white; cursor: pointer; animation: ${isPlaying ? 'spin 4s linear infinite' : 'none'}; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .action-bar { position: absolute; bottom: 15px; left: 10px; right: 10px; display: flex; align-items: center; gap: 6px; z-index: 100; }
        .wish-input-wrapper { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.65); border-radius: 30px; padding: 4px 8px; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(5px); }
        .wish-input { flex: 1; height: 32px; background: transparent; border: none; color: white; padding: 0 8px; outline: none; font-size: 13px; }
        .wish-input::placeholder { color: rgba(255,255,255,0.7); }
        .send-btn { background: transparent; color: white; border: none; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
        .pill-btn { background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(5px); color: white; border-radius: 30px; padding: 7px 11px; display: flex; align-items: center; gap: 4px; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; }
        
        /* ELEGANT TOP WISH TICKER (NON-OBSTRUCTIVE) */
        .danmaku-container {
          position: absolute; top: 14px; left: 15px; right: 65px; height: 38px;
          pointer-events: none; z-index: 95; overflow: hidden;
        }
        .danmaku-item {
          position: absolute; top: 2px; left: 100%;
          background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(10px);
          color: #881337; padding: 5px 13px; border-radius: 20px;
          font-family: 'Montserrat', sans-serif; font-size: 11.5px; font-weight: 600;
          white-space: nowrap; display: flex; align-items: center; gap: 7px;
          box-shadow: 0 4px 14px rgba(190, 18, 60, 0.15);
          border: 1px solid rgba(254, 205, 211, 0.9);
          animation: slideTicker linear infinite;
        }
        .danmaku-avatar {
          width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
        }
        .danmaku-name { color: #b45309; font-weight: 700; }
        @keyframes slideTicker {
          0% { transform: translateX(0); opacity: 0; }
          4% { opacity: 1; }
          94% { opacity: 1; }
          100% { transform: translateX(-150vw); opacity: 0; }
        }

        .hearts-container { position: absolute; top: 0; left: 0; right: 0; bottom: 75px; pointer-events: none; z-index: 60; overflow: hidden; }
        .floating-heart { position: absolute; bottom: -20px; font-size: 24px; color: #ff3366; animation: flyHeart 4s ease-out forwards; }
        @keyframes flyHeart { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-200px) scale(1.5) rotate(15deg); opacity: 0.8; } 100% { transform: translateY(-400px) scale(1) rotate(-15deg); opacity: 0; } }

        /* MODALS */
        .rsvp-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.65); z-index: 200; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        .rsvp-overlay.open { opacity: 1; pointer-events: auto; }
        .rsvp-modal { background: white; width: 92%; max-width: 420px; border-radius: 16px; padding: 22px; transform: scale(0.9); transition: transform 0.3s; position: relative; max-height: 90vh; overflow-y: auto; }
        .rsvp-overlay.open .rsvp-modal { transform: scale(1); }
        .close-rsvp { position: absolute; top: 12px; right: 15px; background: none; border: none; font-size: 24px; color: #999; cursor: pointer; }
        .submit-rsvp-btn { width: 100%; padding: 13px; background: #be123c; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 10px; font-family: 'Montserrat', sans-serif; }
        
        /* QR CHECK-IN PASS CARD */
        .qr-card-box {
          background: linear-gradient(135deg, #fffcf6 0%, #fff1f2 100%); border: 2px solid #ca8a4b; border-radius: 12px; padding: 18px; text-align: center; margin-top: 10px; position: relative; box-shadow: 0 6px 16px rgba(0,0,0,0.1);
        }
        .qr-card-title { font-family: 'Playfair Display', serif; color: #be123c; font-size: 18px; font-weight: 800; letter-spacing: 1px; }
        .qr-card-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
        .qr-image-wrapper { width: 160px; height: 160px; margin: 12px auto; background: white; padding: 8px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .qr-code-img { width: 100%; height: 100%; object-fit: contain; }
        .qr-status-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px; margin-top: 8px; border: 1px solid #bbf7d0; }

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
        @keyframes pulseBtn { 0% { transform: scale(1); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
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
        {/* ENTRANCE OVERLAY WITH GOLD SPARKLES */}
        <div className={`entrance-overlay ${hasOpened ? 'opened' : ''}`}>
          <div className="sparkles-container">
            {Array.from({length: 15}).map((_, i) => (
              <div 
                key={i} 
                className="sparkle-dot" 
                style={{
                  top: `${random(5, 90)}%`, 
                  left: `${random(5, 90)}%`, 
                  width: `${random(4, 8)}px`, 
                  height: `${random(4, 8)}px`,
                  animationDelay: `${random(0, 3)}s`
                }} 
              />
            ))}
          </div>
          <div className="entrance-content">
             <img src={config?.logo_url || '/logo.jpg'} alt="Logo" className="entrance-logo" onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg'; }} />
             <h2 className="entrance-title">{config?.school_name}</h2>
             <p className="entrance-subtitle">Trân trọng kính mời</p>
             <h1 className="entrance-guest">{guest?.name}</h1>
             <button className="entrance-btn" onClick={handleOpenInvitation}>✨ MỞ THIỆP</button>
          </div>
        </div>

        <div className="music-btn" onClick={toggleAudio}>🎵</div>

        {/* SIDE CHEVRON ARROWS FOR ELDERLY / DESKTOP USERS */}
        {activePage > 0 && (
          <button className="nav-side-btn left" onClick={() => scrollToPage(activePage - 1)}>‹</button>
        )}
        {activePage < 4 && (
          <button className="nav-side-btn right" onClick={() => scrollToPage(activePage + 1)}>›</button>
        )}

        {/* FLIPBOOK PAGES */}
        <div className="pages-wrapper" ref={scrollRef} onScroll={handleScroll}>
          
          {/* PAGE 1: COVER */}
          <div className="page page-cover">
            <div className="sparkles-container">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="sparkle-dot" style={{top: `${random(10, 85)}%`, left: `${random(10, 85)}%`, width: `${random(4, 7)}px`, height: `${random(4, 7)}px`, animationDelay: `${random(0, 3)}s` }} />
              ))}
            </div>
            <h1 className="cover-title">Lễ Kỷ Niệm<br/>30 Năm</h1>
            <div className="cover-subtitle">{config?.school_name || "THPT CAO BÁ QUÁT"}</div>
            
            <div className="cover-guest">Trân trọng kính mời</div>
            <div className="cover-name">{guest.name}</div>
            
            <div className="swipe-hint" onClick={() => scrollToPage(1)} style={{cursor: 'pointer'}}>
              <span>Vuốt sang trái để mở thiệp</span> <span style={{fontSize: '18px'}}>👉</span>
            </div>
          </div>

          {/* PAGE 2: DETAILS */}
          <div className="page page-details">
            <div className="details-card">
              <div className="title-box">THÔNG TIN SỰ KIỆN</div>
              
              {(config?.logo_url || '/logo.jpg') && (
                <img src={config?.logo_url || '/logo.jpg'} alt="Logo" style={{ maxWidth: '130px', maxHeight: '130px', objectFit: 'contain', marginTop: '10px', mixBlendMode: 'multiply' }} onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg'; }} />
              )}
              
              <div style={{fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 'bold', marginTop: '12px', textTransform: 'uppercase', color: '#be123c'}}>{config?.event_name_main}</div>
              <div style={{fontSize: '13px', color: '#64748b', marginTop: '4px', whiteSpace: 'pre-line'}}>{config?.event_name_sub}</div>
              
              <div className="event-time">{config?.time}</div>
              
              <div style={{marginTop: '10px', width: '100%'}}>
                <div className="event-location">📍 TẠI ĐỊA ĐIỂM:</div>
                <div style={{fontSize: '14px', whiteSpace: 'pre-line', color: '#334155', lineHeight: '1.4'}}>{config?.location}</div>
              </div>

              {/* LOGISTICS ACTIONS (MAPS & CALENDAR) */}
              <div className="logistics-actions">
                <button className="logistics-btn maps-btn" onClick={openGoogleMaps}>
                  📍 Chỉ đường Google Maps
                </button>
                <button className="logistics-btn calendar-btn" onClick={addToCalendar}>
                  📅 Thêm vào Lịch của tôi
                </button>
              </div>
            </div>
          </div>

          {/* PAGE 3: AGENDA (TIMELINE) */}
          <div className="page page-agenda">
             <div className="title-box" style={{margin: '0 auto 8px'}}>CHƯƠNG TRÌNH</div>
             <div style={{textAlign: 'center', fontSize: '12px', color: '#64748b', marginBottom: '15px'}}>Các hoạt động chính trong buổi lễ</div>
             
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
            <h2 style={{fontFamily: 'Playfair Display, serif', margin: '0', textAlign: 'center', fontSize: '24px'}}>THƯ VIỆN ẢNH</h2>
            <div style={{textAlign: 'center', fontSize: '12px', marginBottom: '8px', color: '#e11d48'}}>Những khoảnh khắc đáng nhớ</div>
            <div className="gallery-grid">
              {(config?.gallery_images && config.gallery_images.length > 0 ? config.gallery_images : DEFAULT_GALLERY).map((src, i) => (
                <img key={i} src={getDirectImageUrl(src)} alt="Gallery" className="gallery-item" />
              ))}
            </div>
          </div>

          {/* PAGE 5: RSVP & WISHES */}
          <div className="page page-interactive">
            <div className="interactive-content">
              <h2 style={{fontFamily: 'Playfair Display, serif', color: '#fde047', marginBottom: '8px', fontSize: '24px'}}>CHUNG VUI CÙNG CHÚNG TÔI</h2>
              <p style={{fontSize: '13.5px', margin: '0 20px', color: '#fecdd3', lineHeight: '1.4'}}>Sự hiện diện của bạn là niềm vinh hạnh lớn nhất của nhà trường.</p>
              
              {guest?.rsvp_status === 'attending' ? (
                <div style={{marginTop: '15px'}}>
                  <div style={{background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '14px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.3)'}}>
                    <div style={{fontSize: '13px', fontWeight: 'bold', color: '#fde047'}}>✅ BẠN ĐÃ XÁC NHẬN THAM DỰ</div>
                    <div style={{fontSize: '11px', color: '#fff', marginTop: '3px'}}>Rất hân hạnh được đón tiếp bạn tại buổi lễ!</div>
                  </div>
                  <button className="vip-pass-btn" onClick={() => setIsRsvpModalOpen(true)}>
                    🎫 Xem Thẻ Check-in VIP & QR
                  </button>
                </div>
              ) : (
                <button className="rsvp-open-btn" onClick={() => setIsRsvpModalOpen(true)}>Xác nhận tham dự</button>
              )}

              {/* WISHES FEED DISPLAY ON PAGE 5 */}
              <div style={{marginTop: '18px', width: '100%', maxHeight: '130px', overflowY: 'auto', background: 'rgba(0,0,0,0.35)', padding: '10px 14px', borderRadius: '12px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'left', boxSizing: 'border-box'}}>
                <div style={{fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fde047', fontWeight: 'bold', marginBottom: '6px'}}>💌 Sổ Lời Chúc ({wishes.length})</div>
                {wishes.length > 0 ? (
                  wishes.map((w, idx) => (
                    <div key={idx} style={{fontSize: '12px', color: '#fff', marginBottom: '5px', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '3px'}}>
                      <strong style={{color: '#fef08a'}}>{w.guest_name}:</strong> {w.message}
                    </div>
                  ))
                ) : (
                  <div style={{fontSize: '12px', color: '#fca5a5', fontStyle: 'italic'}}>Hãy là người đầu tiên gửi lời chúc tới nhà trường!</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PAGINATION DOTS */}
        <div className="pagination">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`dot ${activePage === i ? 'active' : ''}`} onClick={() => scrollToPage(i)} />
          ))}
        </div>

        {/* ELEGANT TOP WISH TICKER */}
        <div className="danmaku-container">
          {floatingWishes.map((w, i) => (
            <div 
              key={`${w.id}-${i}`} 
              className="danmaku-item" 
              style={{ 
                animationDelay: `${i * 3.8}s`, 
                animationDuration: `${random(14, 20)}s` 
              }}
            >
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(w.guest_name || 'K')}&background=be123c&color=fff&rounded=true&size=24`} 
                alt="avatar" 
                className="danmaku-avatar" 
              />
              <span>💌 <strong className="danmaku-name">{w.guest_name}:</strong> {w.message}</span>
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

      {/* RSVP MODAL & VIP QR BADGE */}
      <div className={`rsvp-overlay ${isRsvpModalOpen ? 'open' : ''}`}>
        <div className="rsvp-modal">
          <button className="close-rsvp" onClick={() => setIsRsvpModalOpen(false)}>×</button>
          
          {guest?.rsvp_status === 'attending' ? (
            <div>
              <h3 style={{fontFamily: 'Playfair Display, serif', textAlign: 'center', color: '#be123c', margin: '0 0 5px 0', fontSize: '20px'}}>
                THẺ CHECK-IN VIP
              </h3>
              <p style={{textAlign: 'center', fontSize: '13px', color: '#64748b', margin: '0 0 15px 0'}}>
                Lễ Kỷ Niệm 30 Năm THPT Cao Bá Quát
              </p>

              <div className="qr-card-box">
                <div className="qr-card-title">{guest.name}</div>
                <div className="qr-card-subtitle">Khách Mời Danh Dự</div>

                <div className="qr-image-wrapper">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(guest.invitation_code || guest.id)}&color=881337`} 
                    alt="Mã QR Check-in" 
                    className="qr-code-img"
                  />
                </div>

                <div style={{fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', color: '#334155'}}>
                  MÃ VÀO CỔNG: {guest.invitation_code || guest.id.substring(0, 8).toUpperCase()}
                </div>

                <div className="qr-status-badge">
                  ✅ ĐÃ XÁC NHẬN THAM DỰ
                </div>
              </div>

              <p style={{textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '15px'}}>
                💡 Vui lòng chụp ảnh màn hình hoặc xuất trình mã QR này khi tới cổng sự kiện để check-in nhanh.
              </p>

              <button 
                style={{width: '100%', padding: '12px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'}}
                onClick={() => setIsRsvpModalOpen(false)}
              >
                Đóng thẻ
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{fontFamily: 'Playfair Display, serif', textAlign: 'center', color: '#be123c', margin: '0 0 15px 0'}}>
                Xác nhận tham dự
              </h3>
              
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px', fontWeight: '600'}}>Họ và tên khách mời</label>
                <input type="text" style={{width: '100%', padding: '11px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9', boxSizing: 'border-box', fontWeight: 'bold', color: '#333'}} value={guest.name} disabled />
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', fontSize: '13px', color: '#555', marginBottom: '10px', fontWeight: '600'}}>Bạn sẽ tham dự cùng chúng tôi chứ?</label>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', background: rsvpFormStatus === 'attending' ? '#fff1f2' : '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: rsvpFormStatus === 'attending' ? '1.5px solid #be123c' : '1px solid #e2e8f0'}}>
                    <input type="radio" name="rsvpStatus" value="attending" checked={rsvpFormStatus === 'attending'} onChange={() => setRsvpFormStatus('attending')} style={{accentColor: '#be123c', width: '18px', height: '18px'}} />
                    <span style={{fontWeight: rsvpFormStatus === 'attending' ? 'bold' : 'normal', color: rsvpFormStatus === 'attending' ? '#be123c' : '#334155'}}>🎉 Có, tôi sẽ tham dự</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', background: rsvpFormStatus === 'declined' ? '#f1f5f9' : '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: rsvpFormStatus === 'declined' ? '1.5px solid #64748b' : '1px solid #e2e8f0'}}>
                    <input type="radio" name="rsvpStatus" value="declined" checked={rsvpFormStatus === 'declined'} onChange={() => setRsvpFormStatus('declined')} style={{accentColor: '#64748b', width: '18px', height: '18px'}} />
                    <span style={{color: '#64748b'}}>Tôi bận, rất tiếc không thể tới</span>
                  </label>
                </div>
              </div>
              
              <button className="submit-rsvp-btn" onClick={submitRSVP} disabled={isSubmittingRsvp}>
                {isSubmittingRsvp ? '⏳ Đang lưu...' : 'Gửi xác nhận'}
              </button>
            </div>
          )}
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
