import { useEffect, useState, useRef, useMemo } from 'react';
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

const PLAYLIST = [
  { title: "Tình Thơ", artist: "Ngọc Linh & Diễm Quyên", url: "/nhacnen.mp3", icon: "🎵" },
  { title: "Mong Ước Kỷ Niệm Xưa", artist: "Nón Lá Acoustic", url: "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3", icon: "🌸" },
  { title: "Ký Ức Học Đường", artist: "Melody Band", url: "https://assets.mixkit.co/music/preview/mixkit-nostalgic-warm-feelings-105.mp3", icon: "📚" },
  { title: "Nắng Sân Trường", artist: "Acoustic Guitar", url: "https://assets.mixkit.co/music/preview/mixkit-sweet-and-tender-sweetness-1250.mp3", icon: "☀️" }
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

  // 1. JUKEBOX PLAYLIST
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  // 2. COUNTDOWN TIMER
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 3 & 4. ALUMNI DIRECTORY & LEADERBOARD
  const [isAlumniModalOpen, setIsAlumniModalOpen] = useState(false);
  const [alumniActiveTab, setAlumniActiveTab] = useState('directory');
  const [alumniSearchClass, setAlumniSearchClass] = useState('Tất cả');
  const [allAttendees, setAllAttendees] = useState([]);

  // 5. CROWDSOURCED PHOTO MEMORIES
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isUploadingMemory, setIsUploadingMemory] = useState(false);
  const [memoryCaption, setMemoryCaption] = useState('');
  const [memoryFile, setMemoryFile] = useState(null);

  // 6. SPONSORSHIP & VIETQR
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [sponsorActiveTab, setSponsorActiveTab] = useState('donate');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorGroup, setSponsorGroup] = useState('');
  const [sponsorAmount, setSponsorAmount] = useState('');
  const [sponsorType, setSponsorType] = useState('Quỹ Học Bổng "Chắp Cánh Ước Mơ"');
  const [sponsorItem, setSponsorItem] = useState('');
  const [isSubmittingSponsor, setIsSubmittingSponsor] = useState(false);
  const [sponsorsList, setSponsorsList] = useState([]);

  // 7. DIVERSE LIGHTBOX PHOTO VIEWER
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [isAutoPlaySlideshow, setIsAutoPlaySlideshow] = useState(false);

  // AUTO PLAY SLIDESHOW TIMER
  useEffect(() => {
    let interval = null;
    if (isAutoPlaySlideshow && lightboxIndex !== null) {
      interval = setInterval(() => {
        const galleryArr = config?.gallery_images && config.gallery_images.length > 0 ? config.gallery_images : DEFAULT_GALLERY;
        setLightboxIndex(prev => (prev + 1) % galleryArr.length);
        setLightboxRotation(0);
        setLightboxScale(1);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaySlideshow, lightboxIndex, config]);

  // KEYBOARD NAVIGATION FOR LIGHTBOX
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      const galleryArr = config?.gallery_images && config.gallery_images.length > 0 ? config.gallery_images : DEFAULT_GALLERY;
      if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev + 1) % galleryArr.length);
        setLightboxRotation(0);
        setLightboxScale(1);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev - 1 + galleryArr.length) % galleryArr.length);
        setLightboxRotation(0);
        setLightboxScale(1);
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
        setIsAutoPlaySlideshow(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, config]);

  // MEMOIZED FLOATING WISHES TO PREVENT RE-ANIMATION STUTTER ON TIMER TICKS
  const renderedFloatingWishes = useMemo(() => {
    return floatingWishes.slice(0, 8).map((w, i) => (
      <div 
        key={w.id || i} 
        className="danmaku-item" 
        style={{ 
          left: `${(i * 31) % 50 + 5}%`, 
          animationDelay: `${i * 2.5}s`, 
          animationDuration: `${20 + (i % 4) * 2}s` 
        }}
      >
        <img 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(w.guest_name || 'K')}&background=be123c&color=fff&rounded=true&size=24`} 
          alt="avatar" 
          className="danmaku-avatar" 
        />
        <span>💌 <strong className="danmaku-name">{w.guest_name}:</strong> {w.message}</span>
      </div>
    ));
  }, [floatingWishes]);

  useEffect(() => {
    fetchData();
    setTimeout(() => setShowConfetti(false), 5000);
  }, [code]);

  useEffect(() => {
    const target = new Date(config?.event_target_date || '2026-09-03T07:30').getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config?.event_target_date]);

  const fetchAllAttendees = async () => {
    const { data } = await supabase.from('cbq_guests').select('*').eq('rsvp_status', 'attending');
    if (data) {
      setAllAttendees(data);
    }
  };

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
      await fetchSponsorsList();
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
    setIsJukeboxOpen(!isJukeboxOpen);
  };

  const changeTrack = (index) => {
    setSelectedTrackIndex(index);
    if (audioRef.current) {
      audioRef.current.src = PLAYLIST[index].url;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    setIsJukeboxOpen(false);
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

  const handleUploadMemory = async (e) => {
    e.preventDefault();
    if (!memoryFile || !guest) return;

    setIsUploadingMemory(true);
    const fileExt = memoryFile.name.split('.').pop();
    const fileName = `memory-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('gallery').upload(fileName, memoryFile);
    if (uploadError) {
      alert("Lỗi tải ảnh kỷ niệm: " + uploadError.message);
      setIsUploadingMemory(false);
      return;
    }

    const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
    if (data && data.publicUrl) {
      const newImages = [data.publicUrl, ...(config?.gallery_images || [])];
      setConfig(prev => ({ ...prev, gallery_images: newImages }));
      
      await supabase.from('cbq_pages').update({
        content: JSON.stringify({ ...config, gallery_images: newImages })
      }).eq('slug', 'invite-config');

      alert("Cảm ơn bạn đã đóng góp bức ảnh kỷ niệm vô giá này!");
      setIsMemoryModalOpen(false);
      setMemoryFile(null);
      setMemoryCaption('');
    }
    setIsUploadingMemory(false);
  };

  const getLeaderboardData = () => {
    const counts = {};
    allAttendees.forEach(a => {
      const cls = a.group_name || a.note || 'Cựu học sinh';
      counts[cls] = (counts[cls] || 0) + 1;
    });
    const result = Object.entries(counts)
      .map(([cls, count]) => ({ cls, count }))
      .sort((a, b) => b.count - a.count);
    return result.length > 0 ? result : [
      { cls: 'Khóa 2002 - 2005', count: 42 },
      { cls: 'Khóa 2005 - 2008', count: 38 },
      { cls: 'Khóa 2010 - 2013', count: 29 },
      { cls: 'Khóa 1996 - 1999', count: 18 }
    ];
  };

  const fetchSponsorsList = async () => {
    const { data } = await supabase.from('cbq_sponsors').select('*').order('date_received', { ascending: false });
    if (data) setSponsorsList(data);
  };

  const handleSubmitSponsor = async (e) => {
    e.preventDefault();
    const finalName = sponsorName.trim() || guest?.name || 'Vô danh';
    if (!finalName) return;

    setIsSubmittingSponsor(true);
    const amountNum = parseFloat(sponsorAmount) || 0;
    const itemText = sponsorItem.trim() ? `${sponsorType} (${sponsorItem.trim()})` : sponsorType;

    const { data, error } = await supabase.from('cbq_sponsors').insert([{
      name: `${finalName}${sponsorGroup.trim() ? ' - ' + sponsorGroup.trim() : ''}`,
      donation_amount: amountNum,
      donation_item: itemText,
      is_public: true
    }]).select();

    setIsSubmittingSponsor(false);
    if (!error) {
      alert("Cảm ơn tấm lòng vàng của bạn đã tài trợ ủng hộ nhà trường!");
      if (data && data[0]) {
        setSponsorsList(prev => [data[0], ...prev]);
      }
      setSponsorActiveTab('honor');
    } else {
      alert("Lỗi khi lưu thông tin đóng góp: " + error.message);
    }
  };

  const getVietQrUrl = () => {
    const bank = config?.bank_name || 'MBBank';
    const acc = config?.bank_account_no || '0966888999';
    const holder = encodeURIComponent(config?.bank_account_holder || 'TRUONG THPT CAO BA QUAT');
    const memo = encodeURIComponent(`Ung ho Quy 30 Nam ${sponsorName || guest?.name || ''}`);
    const amount = sponsorAmount ? parseFloat(sponsorAmount) : 0;
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${holder}`;
  };

  const getTotalSponsorAmount = () => {
    return sponsorsList.reduce((sum, item) => sum + (parseFloat(item.donation_amount) || 0), 0);
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
          background-size: cover; background-position: center;
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
        .pill-btn { background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(5px); color: white; border-radius: 30px; padding: 7px 12px; display: flex; align-items: center; gap: 4px; font-family: 'Montserrat', sans-serif; font-size: 11.5px; font-weight: 700; cursor: pointer; }
        
        /* GENTLE WAVING FLOATING WISHES (GPU OPTIMIZED 60FPS) */
        .danmaku-container {
          position: absolute; top: 0; left: 0; right: 0; bottom: 75px;
          pointer-events: none; z-index: 50; overflow: hidden;
        }
        .danmaku-item {
          position: absolute; bottom: -60px;
          background: rgba(255, 255, 255, 0.96);
          color: #881337; padding: 7px 15px; border-radius: 25px;
          font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 600;
          white-space: nowrap; display: flex; align-items: center; gap: 7px;
          box-shadow: 0 4px 12px rgba(190, 18, 60, 0.12);
          border: 1px solid #fecdd3;
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
          animation: floatWavy linear infinite;
        }
        .danmaku-avatar {
          width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
        }
        .danmaku-name { color: #b45309; font-weight: 700; }
        @keyframes floatWavy {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          8% { opacity: 0.95; }
          25% { transform: translate3d(-14px, -25vh, 0); }
          50% { transform: translate3d(14px, -50vh, 0); }
          75% { transform: translate3d(-10px, -75vh, 0); opacity: 0.95; }
          100% { transform: translate3d(0, -102vh, 0); opacity: 0; }
        }

        /* FALLING GOLD GLITTER FOR PAGES 1, 2, 3, 4 */
        .glitter-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 75px;
          pointer-events: none; z-index: 45; overflow: hidden;
        }
        .glitter-dot {
          position: absolute; top: -15px;
          background: radial-gradient(circle, #fff3a0 0%, #ffd700 50%, #b45309 100%);
          border-radius: 50%;
          box-shadow: 0 0 8px #ffd700, 0 0 12px #d97706;
          animation: fallGlitter linear infinite;
          will-change: transform, opacity;
        }
        @keyframes fallGlitter {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          12% { opacity: 0.95; }
          88% { opacity: 0.85; }
          100% { transform: translate3d(25px, 102vh, 0) rotate(360deg); opacity: 0; }
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
        /* JUKEBOX DROPDOWN MENU */
        .jukebox-dropdown {
          position: absolute; top: 62px; right: 18px; z-index: 150;
          background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px);
          border: 1px solid #fca5a5; border-radius: 14px; padding: 10px; width: 220px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25); animation: fadeIn 0.2s ease-out;
        }
        .jukebox-header { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: #be123c; margin-bottom: 8px; text-align: center; border-bottom: 1px dashed #fecdd3; padding-bottom: 6px; }
        .jukebox-item { display: flex; alignItems: center; gap: 8px; padding: 7px 10px; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
        .jukebox-item:hover, .jukebox-item.active { background: #fff1f2; }
        .jukebox-icon { font-size: 16px; }
        .jukebox-info { flex: 1; overflow: hidden; }
        .jukebox-track-title { font-size: 12px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .jukebox-artist { font-size: 10px; color: #64748b; }
        .jukebox-playing-dot { font-size: 10px; color: #be123c; font-weight: bold; }

        /* COUNTDOWN TIMER BOX */
        .countdown-box {
          background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(8px);
          border: 1px solid rgba(202, 138, 75, 0.5); border-radius: 12px;
          padding: 8px 14px; margin: 10px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.06);
        }
        .countdown-title { font-family: 'Montserrat', sans-serif; font-size: 10.5px; font-weight: 700; color: #b45309; letter-spacing: 1px; margin-bottom: 4px; }
        .countdown-grid { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .countdown-unit { display: flex; flex-direction: column; align-items: center; background: #7e1717; color: #f3e6c9; padding: 4px 8px; border-radius: 6px; min-width: 32px; }
        .countdown-num { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 800; line-height: 1; }
        .countdown-label { font-size: 8px; color: #fca5a5; margin-top: 2px; }
        .countdown-colon { font-weight: 800; color: #be123c; font-size: 14px; }

        .upload-memory-btn {
          width: 100%; margin-top: 10px; padding: 10px; background: linear-gradient(135deg, #be123c, #881337);
          color: white; border: none; border-radius: 20px; font-family: 'Montserrat', sans-serif; font-size: 12px;
          font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(190,18,60,0.25); display: flex; align-items: center; justify-content: center; gap: 6px;
        }

        .alumni-directory-btn {
          background: linear-gradient(135deg, #15803d, #166534); color: white; padding: 11px 22px;
          border: none; border-radius: 30px; font-size: 13px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 12px rgba(21,128,61,0.3); margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; font-family: 'Montserrat', sans-serif;
        }

        .sponsor-btn {
          background: linear-gradient(135deg, #b45309, #d97706); color: white; padding: 11px 22px;
          border: none; border-radius: 30px; font-size: 13px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 12px rgba(180,83,9,0.3); margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; font-family: 'Montserrat', sans-serif;
        }

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

      <div 
        className="mobile-container"
        style={config?.bg_image ? { backgroundImage: `url(${getDirectImageUrl(config.bg_image)})` } : {}}
      >
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

        {/* JUKEBOX PLAYLIST DROPDOWN */}
        {isJukeboxOpen && (
          <div className="jukebox-dropdown">
            <div className="jukebox-header">🎵 Giai Điệu Tuổi Học Trò</div>
            {PLAYLIST.map((track, idx) => (
              <div 
                key={idx} 
                className={`jukebox-item ${selectedTrackIndex === idx ? 'active' : ''}`}
                onClick={() => changeTrack(idx)}
              >
                <span className="jukebox-icon">{track.icon}</span>
                <div className="jukebox-info">
                  <div className="jukebox-track-title">{track.title}</div>
                  <div className="jukebox-artist">{track.artist}</div>
                </div>
                {selectedTrackIndex === idx && <span className="jukebox-playing-dot">▶</span>}
              </div>
            ))}
          </div>
        )}

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
            
            <div className="cover-guest">TRÂN TRỌNG KÍNH MỜI</div>
            <div className="cover-name">{guest.name}</div>
            
            {/* COUNTDOWN TIMER ON COVER */}
            <div className="countdown-box" style={{margin: '15px 20px'}}>
              <div className="countdown-title">⏱️ ĐẾM NGƯỢC NGÀY VỀ TRƯỜNG</div>
              <div className="countdown-grid">
                <div className="countdown-unit">
                  <span className="countdown-num">{timeLeft.days}</span>
                  <span className="countdown-label">NGÀY</span>
                </div>
                <div className="countdown-colon">:</div>
                <div className="countdown-unit">
                  <span className="countdown-num">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="countdown-label">GIỜ</span>
                </div>
                <div className="countdown-colon">:</div>
                <div className="countdown-unit">
                  <span className="countdown-num">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="countdown-label">PHÚT</span>
                </div>
                <div className="countdown-colon">:</div>
                <div className="countdown-unit">
                  <span className="countdown-num">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="countdown-label">GIÂY</span>
                </div>
              </div>
            </div>

            <div className="swipe-hint" onClick={() => scrollToPage(1)} style={{cursor: 'pointer'}}>
              <span>Vuốt sang trái để xem thiệp</span> <span style={{fontSize: '18px'}}>👉</span>
            </div>
          </div>

          {/* PAGE 2: DETAILS */}
          <div className="page page-details">
            <div className="details-card">
              <div className="title-box">THÔNG TIN SỰ KIỆN</div>
              
              {(config?.logo_url || '/logo.jpg') && (
                <img src={config?.logo_url || '/logo.jpg'} alt="Logo" style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain', marginTop: '5px', mixBlendMode: 'multiply' }} onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg'; }} />
              )}
              
              <div style={{fontFamily: 'Playfair Display, serif', fontSize: '17px', fontWeight: 'bold', marginTop: '8px', textTransform: 'uppercase', color: '#be123c'}}>{config?.event_name_main}</div>
              <div style={{fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'pre-line'}}>{config?.event_name_sub}</div>
              
              <div className="event-time" style={{margin: '15px 0', fontSize: '20px'}}>{config?.time}</div>
              
              <div style={{marginTop: '10px', width: '100%'}}>
                <div className="event-location">📍 ĐỊA ĐIỂM TỔ CHỨC:</div>
                <div style={{fontSize: '14px', whiteSpace: 'pre-line', color: '#334155', lineHeight: '1.4'}}>{config?.location}</div>
              </div>

              {/* LOGISTICS ACTIONS (MAPS & CALENDAR) */}
              <div className="logistics-actions">
                <button className="logistics-btn maps-btn" onClick={openGoogleMaps}>
                  📍 Xem Vị Trí Trên Bản Đồ
                </button>
                <button className="logistics-btn calendar-btn" onClick={addToCalendar}>
                  📅 Lưu Ngày Vào Lịch Của Tôi
                </button>
              </div>
            </div>
          </div>

          {/* PAGE 3: AGENDA (TIMELINE) */}
          <div className="page page-agenda">
             <div className="title-box" style={{margin: '0 auto 8px'}}>CHƯƠNG TRÌNH LỄ KỶ NIỆM</div>
             <div style={{textAlign: 'center', fontSize: '12px', color: '#64748b', marginBottom: '15px'}}>Tiến trình các hoạt động trọng thể</div>
             
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
            <h2 style={{fontFamily: 'Playfair Display, serif', margin: '0', textAlign: 'center', fontSize: '23px', letterSpacing: '1px'}}>HÀNH TRÌNH 30 NĂM</h2>
            <div style={{textAlign: 'center', fontSize: '12px', marginBottom: '8px', color: '#be123c', fontWeight: '500'}}>Những dấu ấn & ký ức không phai theo thời gian</div>
            
            <div style={{display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '10px', flexWrap: 'wrap'}}>
              <button className="upload-memory-btn" onClick={() => setIsMemoryModalOpen(true)}>
                📸 Đóng Góp Ảnh Kỷ Niệm
              </button>
              <button className="upload-memory-btn" style={{background: 'linear-gradient(135deg, #0284c7, #0369a1)'}} onClick={() => { setLightboxIndex(0); setIsAutoPlaySlideshow(true); }}>
                ⏯️ Xem Trình Chiếu Auto-Play
              </button>
            </div>

            <div className="gallery-grid" style={{height: '62%'}}>
              {(config?.gallery_images && config.gallery_images.length > 0 ? config.gallery_images : DEFAULT_GALLERY).map((src, i) => (
                <img 
                  key={i} 
                  src={getDirectImageUrl(src)} 
                  alt="Gallery" 
                  className="gallery-item" 
                  style={{cursor: 'pointer', transition: 'transform 0.2s ease'}}
                  onClick={() => { setLightboxIndex(i); setLightboxRotation(0); setLightboxScale(1); }} 
                  title="Bấm để xem phóng to HD"
                />
              ))}
            </div>
          </div>

          {/* PAGE 5: RSVP & WISHES */}
          <div className="page page-interactive">
            <div className="interactive-content">
              <h2 style={{fontFamily: 'Playfair Display, serif', color: '#fde047', marginBottom: '8px', fontSize: '23px', letterSpacing: '1px'}}>HỘI NGỘ & TRI ÂN</h2>
              <p style={{fontSize: '13.5px', margin: '0 15px', color: '#fecdd3', lineHeight: '1.4'}}>Sự hiện diện của Quý vị là niềm vinh hạnh to lớn cho Nhà trường.</p>
              
              {guest?.rsvp_status === 'attending' ? (
                <div style={{marginTop: '15px'}}>
                  <div style={{background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '14px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.3)'}}>
                    <div style={{fontSize: '13px', fontWeight: 'bold', color: '#fde047'}}>✅ QUÝ VỊ ĐÃ XÁC NHẬN THAM DỰ</div>
                    <div style={{fontSize: '11px', color: '#fff', marginTop: '3px'}}>Rất hân hạnh được đón tiếp Quý vị tại buổi lễ!</div>
                  </div>
                  <div style={{display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px'}}>
                    <button className="vip-pass-btn" onClick={() => setIsRsvpModalOpen(true)}>
                      🎫 Thẻ VIP & QR
                    </button>
                    <a href={`/binh-chon?code=${guest?.invitation_code || ''}`} className="alumni-directory-btn" style={{background: 'linear-gradient(135deg, #b45309, #d97706)', textDecoration: 'none', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                      🏆 Bình Chọn Tác Phẩm
                    </a>
                    <button className="alumni-directory-btn" onClick={() => { fetchAllAttendees(); setIsAlumniModalOpen(true); }}>
                      🎓 Tìm Bạn & Top Khóa
                    </button>
                    <button className="sponsor-btn" onClick={() => { fetchSponsorsList(); setIsSponsorModalOpen(true); }}>
                      🌱 Đồng Hành Cùng Nhà Trường
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'}}>
                  <button className="rsvp-open-btn" onClick={() => setIsRsvpModalOpen(true)}>Xác Nhận Tham Dự</button>
                  <div style={{display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap'}}>
                    <a href={`/binh-chon?code=${guest?.invitation_code || ''}`} className="alumni-directory-btn" style={{background: 'linear-gradient(135deg, #b45309, #d97706)', textDecoration: 'none', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                      🏆 Bình Chọn Tác Phẩm
                    </a>
                    <button className="alumni-directory-btn" onClick={() => { fetchAllAttendees(); setIsAlumniModalOpen(true); }}>
                      🎓 Tìm Bạn Cũ
                    </button>
                    <button className="sponsor-btn" onClick={() => { fetchSponsorsList(); setIsSponsorModalOpen(true); }}>
                      🌱 Đồng Hành Cùng Nhà Trường
                    </button>
                  </div>
                </div>
              )}

              {/* WISHES FEED DISPLAY ON PAGE 5 */}
              <div style={{marginTop: '18px', width: '100%', maxHeight: '130px', overflowY: 'auto', background: 'rgba(0,0,0,0.35)', padding: '10px 14px', borderRadius: '12px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'left', boxSizing: 'border-box'}}>
                <div style={{fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fde047', fontWeight: 'bold', marginBottom: '6px'}}>💌 Sổ Vàng Lời Chúc ({wishes.length})</div>
                {wishes.length > 0 ? (
                  wishes.map((w, idx) => (
                    <div key={idx} style={{fontSize: '12px', color: '#fff', marginBottom: '5px', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '3px'}}>
                      <strong style={{color: '#fef08a'}}>{w.guest_name}:</strong> {w.message}
                    </div>
                  ))
                ) : (
                  <div style={{fontSize: '12px', color: '#fca5a5', fontStyle: 'italic'}}>Hãy là người đầu tiên gửi lời chúc tới Nhà trường!</div>
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

        {/* GENTLE WAVING FLOATING WISHES (PAGE 0 COVER ONLY) */}
        {activePage === 0 && (
          <div className="danmaku-container">
            {renderedFloatingWishes}
          </div>
        )}

        {/* FALLING GOLD GLITTER PARTICLES (PAGES 1, 2, 3, 4) */}
        {activePage > 0 && (
          <div className="glitter-overlay">
            {Array.from({ length: 22 }).map((_, i) => (
              <div 
                key={i} 
                className="glitter-dot" 
                style={{
                  left: `${(i * 19) % 94 + 3}%`,
                  width: `${(i % 3) * 3 + 4}px`,
                  height: `${(i % 3) * 3 + 4}px`,
                  animationDuration: `${3.5 + (i % 5) * 1.2}s`,
                  animationDelay: `${(i % 8) * 0.6}s`
                }} 
              />
            ))}
          </div>
        )}
        <div className="hearts-container">
          {hearts.map(h => (
            <div key={h.id} className="floating-heart" style={{ left: `${h.left}%` }}>❤️</div>
          ))}
        </div>

        {/* FIXED ACTION BAR */}
        <form onSubmit={submitWish} className="action-bar">
          <div className="wish-input-wrapper">
            <input type="text" className="wish-input" placeholder="Nhập lời chúc tri ân..." value={newWish} onChange={(e) => setNewWish(e.target.value)} required />
            <button type="submit" className="send-btn" disabled={isSubmittingWish}><Send size={15} /></button>
          </div>
          <button type="button" className="pill-btn" onClick={shootHeart}>
            <span style={{color: '#ff3366'}}>💖</span> Gửi yêu thương
          </button>
          <button type="button" className="pill-btn" onClick={() => setIsGiftModalOpen(true)}>
            <span>🎁</span> Gửi tri ân
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

      {/* ALUMNI DIRECTORY & LEADERBOARD MODAL */}
      <div className={`rsvp-overlay ${isAlumniModalOpen ? 'open' : ''}`}>
        <div className="rsvp-modal" style={{maxWidth: '460px'}}>
          <button className="close-rsvp" onClick={() => setIsAlumniModalOpen(false)}>×</button>
          <h3 style={{fontFamily: 'Playfair Display, serif', textAlign: 'center', color: '#be123c', margin: '0 0 10px 0', fontSize: '19px'}}>
            CỰU HỌC SINH THAM DỰ
          </h3>
          
          <div style={{display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '15px'}}>
            <button 
              style={{flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: 'bold', borderBottom: alumniActiveTab === 'directory' ? '3px solid #be123c' : 'none', color: alumniActiveTab === 'directory' ? '#be123c' : '#64748b', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'}}
              onClick={() => setAlumniActiveTab('directory')}
            >
              🔍 Tìm Bạn Cùng Lớp
            </button>
            <button 
              style={{flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: 'bold', borderBottom: alumniActiveTab === 'leaderboard' ? '3px solid #be123c' : 'none', color: alumniActiveTab === 'leaderboard' ? '#be123c' : '#64748b', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'}}
              onClick={() => setAlumniActiveTab('leaderboard')}
            >
              🏆 Top Niên Khóa
            </button>
          </div>

          {alumniActiveTab === 'directory' ? (
            <div>
              <div style={{marginBottom: '12px'}}>
                <label style={{fontSize: '12px', fontWeight: 'bold', color: '#475569'}}>Lọc theo niên khóa:</label>
                <select 
                  value={alumniSearchClass} 
                  onChange={(e) => setAlumniSearchClass(e.target.value)}
                  style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '13px'}}
                >
                  <option value="Tất cả">Tất cả ({allAttendees.length} người)</option>
                  <option value="Khóa 1996 - 1999">Khóa 1996 - 1999</option>
                  <option value="Khóa 2002 - 2005">Khóa 2002 - 2005</option>
                  <option value="Khóa 2005 - 2008">Khóa 2005 - 2008</option>
                  <option value="Khóa 2010 - 2013">Khóa 2010 - 2013</option>
                  <option value="Khóa 2015 - 2018">Khóa 2015 - 2018</option>
                  <option value="Khóa 2020 - 2023">Khóa 2020 - 2023</option>
                </select>
              </div>

              <div style={{maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {allAttendees.length > 0 ? (
                  allAttendees
                    .filter(a => alumniSearchClass === 'Tất cả' || (a.group_name && a.group_name.includes(alumniSearchClass)))
                    .map((attendee, i) => (
                      <div key={i} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.name)}&background=be123c&color=fff&rounded=true&size=32`} alt="avatar" style={{width: '32px', height: '32px', borderRadius: '50%'}} />
                        <div style={{flex: 1}}>
                          <div style={{fontWeight: 'bold', fontSize: '13px', color: '#1e293b'}}>{attendee.name}</div>
                          <div style={{fontSize: '11px', color: '#64748b'}}>{attendee.group_name || attendee.note || 'Cựu học sinh'}</div>
                        </div>
                        <span style={{fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold'}}>Đã đăng ký</span>
                      </div>
                    ))
                ) : (
                  <div style={{textAlign: 'center', color: '#94a3b8', padding: '20px'}}>Đang cập nhật danh sách...</div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div style={{fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '12px'}}>
                Thống kê các khóa đăng ký tham dự đông nhất
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {getLeaderboardData().map((item, i) => (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: i === 0 ? '#fefce8' : i === 1 ? '#f8fafc' : '#fff7ed', borderRadius: '10px', border: i === 0 ? '1.5px solid #eab308' : '1px solid #e2e8f0'}}>
                    <span style={{fontSize: '20px'}}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    <div style={{flex: 1, fontWeight: 'bold', fontSize: '13.5px', color: '#1e293b'}}>{item.cls}</div>
                    <div style={{fontWeight: '800', fontSize: '14px', color: '#be123c'}}>{item.count} người</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PHOTO MEMORY UPLOAD MODAL */}
      <div className={`rsvp-overlay ${isMemoryModalOpen ? 'open' : ''}`}>
        <div className="rsvp-modal">
          <button className="close-rsvp" onClick={() => setIsMemoryModalOpen(false)}>×</button>
          <h3 style={{fontFamily: 'Playfair Display, serif', textAlign: 'center', color: '#be123c', margin: '0 0 5px 0', fontSize: '19px'}}>
            ĐÓNG GÓP ÁNH KỶ NIỆM
          </h3>
          <p style={{textAlign: 'center', fontSize: '12px', color: '#64748b', margin: '0 0 15px 0'}}>
            Chia sẻ bức ảnh kỷ niệm thời đi học của bạn với nhà trường
          </p>

          <form onSubmit={handleUploadMemory}>
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px'}}>Chọn ảnh từ máy</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setMemoryFile(e.target.files[0])} 
                required 
                style={{width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px'}}
              />
            </div>

            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px'}}>Chú thích (Niên khóa / Lớp học)</label>
              <input 
                type="text" 
                value={memoryCaption} 
                onChange={(e) => setMemoryCaption(e.target.value)} 
                placeholder="VD: Lớp 12A1 khóa 2002 - 2005" 
                style={{width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box'}}
              />
            </div>

            <button 
              type="submit" 
              disabled={isUploadingMemory} 
              style={{width: '100%', padding: '12px', background: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'}}
            >
              {isUploadingMemory ? '⏳ Đang tải lên...' : '📸 Tải Ảnh Kỷ Niệm Lên'}
            </button>
          </form>
        </div>
      </div>

      {/* SPONSORSHIP & VIETQR MODAL */}
      <div className={`rsvp-overlay ${isSponsorModalOpen ? 'open' : ''}`}>
        <div className="rsvp-modal" style={{maxWidth: '460px'}}>
          <button className="close-rsvp" onClick={() => setIsSponsorModalOpen(false)}>×</button>
          <h3 style={{fontFamily: 'Playfair Display, serif', textAlign: 'center', color: '#b45309', margin: '0 0 4px 0', fontSize: '19px'}}>
            🌱 ĐỒNG HÀNH CÙNG MÁI TRƯỜNG
          </h3>
          <p style={{textAlign: 'center', fontSize: '11.5px', color: '#64748b', margin: '0 0 10px 0', fontStyle: 'italic', lineHeight: '1.4', background: '#fff7ed', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ffedd5'}}>
            💬 "Sự hiện diện của Quý vị là món quà quý giá nhất đối với Nhà trường. Mọi đóng góp ủng hộ (nếu có) đều hoàn toàn tự nguyện tùy tâm để chắp cánh cho thế hệ học sinh tiếp nối."
          </p>

          <div style={{display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '15px'}}>
            <button 
              style={{flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: 'bold', borderBottom: sponsorActiveTab === 'donate' ? '3px solid #b45309' : 'none', color: sponsorActiveTab === 'donate' ? '#b45309' : '#64748b', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'}}
              onClick={() => setSponsorActiveTab('donate')}
            >
              📲 VietQR & Đăng Ký
            </button>
            <button 
              style={{flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: 'bold', borderBottom: sponsorActiveTab === 'honor' ? '3px solid #b45309' : 'none', color: sponsorActiveTab === 'honor' ? '#b45309' : '#64748b', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'}}
              onClick={() => { fetchSponsorsList(); setSponsorActiveTab('honor'); }}
            >
              🌟 Bảng Vàng Tri Ân ({sponsorsList.length})
            </button>
          </div>

          {sponsorActiveTab === 'donate' ? (
            <div style={{maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px'}}>
              {/* VIETQR CARD DISPLAY */}
              <div style={{background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '15px'}}>
                <div style={{fontSize: '11px', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase'}}>MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG</div>
                <img 
                  src={getVietQrUrl()} 
                  alt="VietQR Bank" 
                  style={{maxWidth: '180px', height: 'auto', margin: '8px auto', display: 'block', borderRadius: '8px', border: '1px solid #fef08a'}} 
                />
                <div style={{fontSize: '12px', fontWeight: 'bold', color: '#1e293b'}}>{config?.bank_name || 'MBBank'} - STK: {config?.bank_account_no || '0966888999'}</div>
                <div style={{fontSize: '11px', color: '#64748b'}}>{config?.bank_account_holder || 'TRƯỜNG THPT CAO BÁ QUÁT'}</div>
              </div>

              <form onSubmit={handleSubmitSponsor}>
                <div style={{marginBottom: '10px'}}>
                  <label style={{fontSize: '12px', fontWeight: 'bold', color: '#475569'}}>Họ & Tên Người / Đơn Vị Ủng Hộ</label>
                  <input 
                    type="text" 
                    value={sponsorName} 
                    onChange={(e) => setSponsorName(e.target.value)} 
                    placeholder="VD: Nguyễn Văn A" 
                    required 
                    style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '3px', boxSizing: 'border-box'}}
                  />
                </div>

                <div style={{marginBottom: '10px'}}>
                  <label style={{fontSize: '12px', fontWeight: 'bold', color: '#475569'}}>Niên khóa / Doanh nghiệp</label>
                  <input 
                    type="text" 
                    value={sponsorGroup} 
                    onChange={(e) => setSponsorGroup(e.target.value)} 
                    placeholder="VD: Cựu học sinh Khóa 2002 - 2005" 
                    style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '3px', boxSizing: 'border-box'}}
                  />
                </div>

                <div style={{marginBottom: '10px'}}>
                  <label style={{fontSize: '12px', fontWeight: 'bold', color: '#475569'}}>Hạng mục đóng góp / tài trợ</label>
                  <select 
                    value={sponsorType} 
                    onChange={(e) => setSponsorType(e.target.value)}
                    style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '3px', fontSize: '13px'}}
                  >
                    <option value='Quỹ Học Bổng "Chắp Cánh Ước Mơ"'>🎓 Quỹ Học Bổng "Chắp Cánh Ước Mơ"</option>
                    <option value='Tài trợ Cây xanh / Công trình trường'>🌳 Tài trợ Cây xanh / Công trình trường</option>
                    <option value='Tài trợ Thiết bị dạy học'>💻 Tài trợ Thiết bị dạy học</option>
                    <option value='Ủng hộ kinh phí tổ chức lễ'>🧧 Ủng hộ kinh phí tổ chức lễ</option>
                  </select>
                </div>

                <div style={{marginBottom: '10px'}}>
                  <label style={{fontSize: '12px', fontWeight: 'bold', color: '#475569'}}>Số tiền ủng hộ (VNĐ) hoặc Vật phẩm</label>
                  <input 
                    type="number" 
                    value={sponsorAmount} 
                    onChange={(e) => setSponsorAmount(e.target.value)} 
                    placeholder="VD: 5000000 (Nhập 0 nếu tài trợ hiện vật)" 
                    style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '3px', boxSizing: 'border-box'}}
                  />
                  <input 
                    type="text" 
                    value={sponsorItem} 
                    onChange={(e) => setSponsorItem(e.target.value)} 
                    placeholder="Ghi chú thêm (VD: 5 cây phượng hoặc 2 tivi)" 
                    style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px', boxSizing: 'border-box', fontSize: '12px'}}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingSponsor}
                  style={{width: '100%', padding: '12px', background: 'linear-gradient(135deg, #b45309, #d97706)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', marginTop: '5px'}}
                >
                  {isSubmittingSponsor ? '⏳ Đang ghi nhận...' : '💝 Gửi Đăng Ký Tài Trợ & Lưu Bảng Vàng'}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '12px'}}>
                <div style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold'}}>TỔNG TÀI TRỢ & ĐÓNG GÓP TỚI NAY</div>
                <div style={{fontSize: '20px', fontWeight: '800', color: '#b45309'}}>{getTotalSponsorAmount().toLocaleString('vi-VN')} VNĐ</div>
              </div>

              <div style={{maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {sponsorsList.length > 0 ? (
                  sponsorsList.map((item, i) => {
                    const amt = parseFloat(item.donation_amount) || 0;
                    const badge = amt >= 50000000 ? '🥇 Kim Cương' : amt >= 10000000 ? '🥈 Vàng' : amt >= 2000000 ? '🥉 Bạc' : '💖 Tấm Lòng Vàng';
                    const badgeBg = amt >= 50000000 ? '#fefce8' : amt >= 10000000 ? '#fef08a' : amt >= 2000000 ? '#f1f5f9' : '#fff1f2';
                    const badgeColor = amt >= 50000000 ? '#854d0e' : amt >= 10000000 ? '#b45309' : amt >= 2000000 ? '#475569' : '#be123c';

                    return (
                      <div key={i} style={{padding: '10px 12px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <div style={{fontWeight: 'bold', fontSize: '13.5px', color: '#1e293b'}}>{item.name}</div>
                          <span style={{fontSize: '10.5px', background: badgeBg, color: badgeColor, padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold'}}>{badge}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px'}}>
                          <span style={{color: '#64748b'}}>{item.donation_item || 'Ủng hộ Quỹ Học Bổng'}</span>
                          <span style={{fontWeight: 'bold', color: '#b45309'}}>{amt > 0 ? `${amt.toLocaleString('vi-VN')} VNĐ` : 'Hiện vật'}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{textAlign: 'center', color: '#94a3b8', padding: '20px'}}>Chưa có danh sách nhà tài trợ...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DIVERSE LIGHTBOX PHOTO VIEWER MODAL */}
      {lightboxIndex !== null && (() => {
        const galleryArr = config?.gallery_images && config.gallery_images.length > 0 ? config.gallery_images : DEFAULT_GALLERY;
        const currentSrc = galleryArr[lightboxIndex];
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
            padding: '15px', backdropFilter: 'blur(10px)'
          }}>
            {/* LIGHTBOX TOOLBAR */}
            <div style={{
              width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fde047' }}>
                📸 Kỷ Niệm 30 Năm ({lightboxIndex + 1} / {galleryArr.length})
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setIsAutoPlaySlideshow(prev => !prev)} 
                  style={{ background: isAutoPlaySlideshow ? '#be123c' : 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isAutoPlaySlideshow ? '⏸️ Tạm Dừng' : '⏯️ Tự Động Chiếu (3s)'}
                </button>
                <button 
                  onClick={() => setLightboxScale(prev => Math.min(prev + 0.3, 2.5))} 
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                  title="Phóng to"
                >
                  🔍+
                </button>
                <button 
                  onClick={() => setLightboxScale(prev => Math.max(prev - 0.3, 0.7))} 
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                  title="Thu nhỏ"
                >
                  🔍-
                </button>
                <button 
                  onClick={() => setLightboxRotation(prev => (prev + 90) % 360)} 
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                  title="Xoay ảnh 90 độ"
                >
                  🔄
                </button>
                <a 
                  href={getDirectImageUrl(currentSrc)} 
                  target="_blank" 
                  download 
                  rel="noreferrer" 
                  style={{ background: '#166534', color: 'white', textDecoration: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}
                >
                  📥 Tải Ảnh
                </a>
                <button 
                  onClick={() => { setLightboxIndex(null); setIsAutoPlaySlideshow(false); }} 
                  style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ✕ Đóng
                </button>
              </div>
            </div>

            {/* MAIN IMAGE DISPLAY AREA */}
            <div style={{
              flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', margin: '15px 0'
            }}>
              {/* PREVIOUS BUTTON */}
              <button 
                onClick={() => { setLightboxIndex((lightboxIndex - 1 + galleryArr.length) % galleryArr.length); setLightboxRotation(0); setLightboxScale(1); }}
                style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%', width: '44px', height: '44px', fontSize: '20px', cursor: 'pointer', zIndex: 10
                }}
              >
                ❮
              </button>

              <img 
                src={getDirectImageUrl(currentSrc)} 
                alt="Enlarged Memory" 
                style={{
                  maxWidth: '85vw', maxHeight: '70vh', objectFit: 'contain',
                  borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                  transform: `scale(${lightboxScale}) rotate(${lightboxRotation}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              />

              {/* NEXT BUTTON */}
              <button 
                onClick={() => { setLightboxIndex((lightboxIndex + 1) % galleryArr.length); setLightboxRotation(0); setLightboxScale(1); }}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%', width: '44px', height: '44px', fontSize: '20px', cursor: 'pointer', zIndex: 10
                }}
              >
                ❯
              </button>
            </div>

            {/* CAPTION FOOTER */}
            <div style={{ color: '#cbd5e1', fontSize: '12.5px', textAlign: 'center', fontStyle: 'italic' }}>
              💡 Dùng phím mũi tên ⬅️ ➡️ trên bàn phím để chuyển ảnh • Phím ESC để đóng
            </div>
          </div>
        );
      })()}
    </div>
  );
}
