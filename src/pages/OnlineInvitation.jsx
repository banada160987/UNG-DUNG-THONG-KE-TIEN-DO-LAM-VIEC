import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, ChevronLeft, Send, Heart } from 'lucide-react';
import Confetti from 'react-confetti';

// Hàm helper tạo số ngẫu nhiên
const random = (min, max) => Math.random() * (max - min) + min;

export default function OnlineInvitation() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [config, setConfig] = useState(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Guestbook & Hearts
  const [wishes, setWishes] = useState([]);
  const [newWish, setNewWish] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hearts, setHearts] = useState([]);

  // Floating Wishes Display (Danmaku)
  const [floatingWishes, setFloatingWishes] = useState([]);

  useEffect(() => {
    fetchData();
  }, [code]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const guestRes = await supabase.from('cbq_guests').select('*').eq('invitation_code', code).single();
      if (guestRes.data) {
        setGuest(guestRes.data);
        setRsvpStatus(guestRes.data.rsvp_status);
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
      // Initialize floating wishes with random delays and positions
      const floating = data.map((wish, i) => ({
        ...wish,
        left: random(5, 75), // Random left position %
        delay: random(0, 15), // Random start delay
        duration: random(15, 25) // Random floating speed
      }));
      setFloatingWishes(floating);
    }
  };

  const handleOpenEnvelope = () => {
    if (isOpen) return;
    setIsOpen(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };
  
  const handleRSVP = async (status) => {
    if (!guest) return;
    setRsvpStatus(status);
    await supabase.from('cbq_guests').update({ rsvp_status: status }).eq('id', guest.id);
    alert(status === 'attending' ? "Cảm ơn bạn đã xác nhận tham dự!" : "Rất tiếc vì bạn không thể tham dự.");
  };
  
  const submitWish = async (e) => {
    e.preventDefault();
    if (!newWish.trim() || !guest) return;
    
    setIsSubmitting(true);
    const { data, error } = await supabase.from('cbq_wishes').insert([
      { guest_id: guest.id, guest_name: guest.name, message: newWish.trim() }
    ]).select();
    
    setIsSubmitting(false);
    if (!error && data) {
      setNewWish('');
      const newWishData = data[0];
      setWishes([newWishData, ...wishes]);
      
      // Thêm ngay lập tức vào màn hình trôi nổi
      setFloatingWishes(prev => [
        ...prev, 
        { ...newWishData, left: random(10, 70), delay: 0, duration: random(15, 20) }
      ]);
    } else {
      alert("Lỗi khi gửi lời chúc: " + (error?.message || 'Không xác định'));
    }
  };

  const shootHeart = () => {
    const id = Date.now() + Math.random();
    setHearts(prev => [...prev, { id, left: random(75, 95) }]); // Bay ở góc phải
    // Xóa trái tim sau 4 giây (khi hiệu ứng xong)
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 4000);
  };

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#8b0000', color: 'gold'}}>Đang tải thiệp mời...</div>;
  }

  if (!guest) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#8b0000', color: 'gold'}}>
        <h2>Không tìm thấy thiệp mời!</h2>
        <p>Mã thiệp mời không hợp lệ hoặc đã bị xóa.</p>
        <Link to="/" style={{marginTop: '20px', padding: '10px 20px', backgroundColor: '#daa520', color: '#8b0000', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold'}}>Về Trang Chủ</Link>
      </div>
    );
  }

  return (
    <div className="premium-invitation">
      <style>{`
        body { margin: 0; padding: 0; overflow: hidden; background-color: #000; }
        
        .premium-invitation {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, #8b0000 0%, #4a0000 100%);
          font-family: 'Times New Roman', Times, serif;
          color: #333;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* Nền hoa văn mờ */
        .premium-invitation::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url('https://www.transparenttextures.com/patterns/arabesque.png');
          opacity: 0.2;
          z-index: 1;
        }

        .back-btn {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: #ffd700;
          text-decoration: none;
          font-family: Arial, sans-serif;
          z-index: 100;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }

        /* Container khung hiển thị (Mobile First) */
        .mobile-container {
          position: relative;
          width: 100%;
          max-width: 500px;
          height: 100%;
          max-height: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
        }

        /* Thiệp 3D */
        .card-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 85%;
          height: 70%;
          max-height: 700px;
          perspective: 1000px;
          z-index: 20;
          cursor: pointer;
        }

        /* Nắp phong bì túi (Pocket Envelope) */
        .pocket-front {
          position: absolute;
          bottom: 0;
          left: -5%;
          width: 110%;
          height: 50%;
          background: linear-gradient(to bottom, #990000, #550000);
          clip-path: polygon(0 30%, 50% 0, 100% 30%, 100% 100%, 0 100%);
          z-index: 25;
          box-shadow: 0 -10px 20px rgba(0,0,0,0.5);
          transition: transform 1s ease;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-bottom: 20px;
        }
        
        .pocket-front::after {
          content: 'Mở Thiệp';
          color: #ffd700;
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: bold;
          background: rgba(0,0,0,0.2);
          padding: 8px 20px;
          border-radius: 20px;
          border: 1px solid #ffd700;
          animation: pulse 2s infinite;
        }

        .card-wrapper.open .pocket-front {
          transform: translateY(100vh); /* Rớt xuống biến mất */
        }

        /* Tấm thiệp chính */
        .card-main {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #fffcf8;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 22;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 30px 20px;
          box-sizing: border-box;
          text-align: center;
          /* Viền vàng nổi bật */
          border: 6px solid #daa520;
          outline: 2px solid #8b0000;
          outline-offset: -10px;
          background-image: url('https://www.transparenttextures.com/patterns/cream-paper.png');
          transition: all 1s ease;
          transform: translateY(20%); /* Nằm thấp bên trong túi */
        }

        .card-wrapper.open .card-main {
          transform: translateY(0); /* Trồi lên giữa màn hình */
          z-index: 30; /* Nổi lên trên cùng để dễ click RSVP */
          height: 80%; /* Ngắn lại một chút chừa chỗ cho thanh công cụ */
          top: 5%;
        }

        /* Nơ đỏ trang trí */
        .ribbon {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 60px;
          background-image: url('https://img.icons8.com/color/96/000000/ribbon.png');
          background-size: contain;
          background-repeat: no-repeat;
          z-index: 25;
        }

        .school-name {
          font-size: 12px;
          text-transform: uppercase;
          color: #8b0000;
          margin-bottom: 20px;
          letter-spacing: 1px;
          margin-top: 10px;
        }

        .invite-title {
          font-size: 26px;
          font-weight: bold;
          color: #daa520; /* Vàng đồng */
          margin-bottom: 10px;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.1);
        }

        .guest-name {
          font-size: 30px;
          color: #8b0000;
          font-weight: bold;
          font-family: 'Dancing Script', cursive, serif;
          margin: 15px 0;
          padding: 10px;
          border-bottom: 2px solid #daa520;
          display: inline-block;
          min-width: 200px;
        }

        .event-details {
          margin: 20px 0;
          color: #333;
          line-height: 1.6;
          font-size: 15px;
        }
        
        /* RSVP Buttons */
        .rsvp-section {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }

        .rsvp-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 10px;
        }

        .btn-rsvp {
          padding: 8px 15px;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: transform 0.2s;
          font-family: Arial, sans-serif;
          font-size: 13px;
        }
        
        .btn-yes { background: #daa520; color: #8b0000; border: 1px solid #8b0000; }
        .btn-no { background: #e2e8f0; color: #475569; }

        /* FLOATING DANMAKU (Lời chúc bay lơ lửng) */
        .danmaku-container {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 80px;
          pointer-events: none; /* Không che khuất click */
          z-index: 50;
          overflow: hidden;
        }

        .danmaku-item {
          position: absolute;
          bottom: -50px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-family: Arial, sans-serif;
          font-size: 13px;
          white-space: nowrap;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,215,0,0.3);
          display: flex;
          align-items: center;
          gap: 5px;
          animation: floatUp linear infinite;
        }
        
        .danmaku-item strong {
          color: #ffd700;
        }

        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }

        /* HEART ANIMATION */
        .hearts-container {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 80px;
          pointer-events: none;
          z-index: 60;
          overflow: hidden;
        }
        
        .floating-heart {
          position: absolute;
          bottom: -20px;
          font-size: 24px;
          color: #ff3366;
          animation: flyHeart 4s ease-out forwards;
        }
        
        @keyframes flyHeart {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-200px) scale(1.5) rotate(15deg); opacity: 0.8; }
          100% { transform: translateY(-400px) scale(1) rotate(-15deg); opacity: 0; }
        }

        /* BOTTOM ACTION BAR (Thanh công cụ dưới cùng) */
        .action-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 60px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          padding: 0 15px;
          box-sizing: border-box;
          z-index: 100;
          gap: 10px;
          transform: translateY(100%);
          transition: transform 0.5s ease;
        }
        
        .card-wrapper.open ~ .action-bar {
          transform: translateY(0);
        }

        .wish-input {
          flex: 1;
          height: 36px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          color: white;
          padding: 0 15px;
          font-family: Arial, sans-serif;
          outline: none;
        }
        
        .wish-input::placeholder { color: rgba(255,255,255,0.7); }
        
        .send-btn {
          background: #daa520;
          color: #8b0000;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
        }

        .heart-btn {
          background: transparent;
          color: #ff3366;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          font-size: 10px;
          gap: 2px;
          margin-left: 5px;
        }
        
        .heart-btn svg {
          fill: #ff3366;
          animation: pulseHeart 1s infinite;
        }
        
        @keyframes pulseHeart {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

      `}</style>
      
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} colors={['#ffd700', '#ff0000', '#ffffff', '#daa520']} />}

      <Link to="/" className="back-btn"><ChevronLeft size={20} /> Về Trang chủ</Link>

      <div className="mobile-container">
        
        <div className={`card-wrapper ${isOpen ? 'open' : ''}`} onClick={handleOpenEnvelope}>
          {/* Tấm thiệp mạ vàng nằm trong */}
          <div className="card-main">
            <div className="ribbon"></div>
            {config && (
              <>
                <div className="school-name">{config.school_name}</div>
                <div className="invite-title">{config.invite_title1}</div>
                <div className="guest-name">{guest.name}</div>
                
                <div className="event-details">
                  <strong style={{fontSize: '18px', color: '#8b0000'}}>{config.event_name_main}</strong><br/>
                  <span style={{whiteSpace: 'pre-line', fontSize: '13px'}}>{config.event_name_sub}</span>
                  
                  <div style={{marginTop: '15px', fontSize: '13px'}}>
                    <div><strong>🕒 Thời gian:</strong><br/> {config.time}</div>
                    <div style={{marginTop: '10px'}}><strong>📍 Địa điểm:</strong><br/> <span style={{whiteSpace: 'pre-line'}}>{config.location}</span></div>
                  </div>
                </div>

                <div className="rsvp-section">
                  <p style={{margin: '0 0 10px 0', color: '#64748b', fontStyle: 'italic', fontSize: '12px'}}>Vui lòng xác nhận sự hiện diện của bạn để chúng tôi đón tiếp chu đáo nhất.</p>
                  <div className="rsvp-buttons">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRSVP('attending'); }} 
                      className="btn-rsvp btn-yes"
                      style={{opacity: rsvpStatus === 'declined' ? 0.5 : 1}}
                    >
                      <CheckCircle size={16} /> Tham dự
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRSVP('declined'); }} 
                      className="btn-rsvp btn-no"
                      style={{opacity: rsvpStatus === 'attending' ? 0.5 : 1}}
                    >
                      <XCircle size={16} /> Không đến
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Túi đỏ bên ngoài che thiệp */}
          <div className="pocket-front"></div>
        </div>

        {/* Lời chúc lơ lửng (Chỉ hiện khi đã mở thiệp) */}
        {isOpen && (
          <div className="danmaku-container">
            {floatingWishes.map((w, i) => (
              <div 
                key={`${w.id}-${i}`} 
                className="danmaku-item" 
                style={{ 
                  left: `${w.left}%`, 
                  animationDelay: `${w.delay}s`, 
                  animationDuration: `${w.duration}s` 
                }}
              >
                <strong>{w.guest_name}:</strong> {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Hiệu ứng bắn tim */}
        {isOpen && (
          <div className="hearts-container">
            {hearts.map(h => (
              <div key={h.id} className="floating-heart" style={{ left: `${h.left}%` }}>❤️</div>
            ))}
          </div>
        )}

        {/* Thanh công cụ nhập lời chúc */}
        <form onSubmit={submitWish} className="action-bar">
          <input 
            type="text" 
            className="wish-input" 
            placeholder="Gửi lời chúc..." 
            value={newWish}
            onChange={(e) => setNewWish(e.target.value)}
            required
          />
          <button type="submit" className="send-btn" disabled={isSubmitting}>
            <Send size={16} />
          </button>
          
          <button type="button" className="heart-btn" onClick={shootHeart}>
            <Heart size={24} />
            Bắn tim
          </button>
        </form>

      </div>
    </div>
  );
}
