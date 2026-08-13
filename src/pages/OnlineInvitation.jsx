import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, ChevronLeft, Send, Volume2, VolumeX } from 'lucide-react';
import Confetti from 'react-confetti';

export default function OnlineInvitation() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [config, setConfig] = useState(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  
  // Audio & Effects
  const [isMuted, setIsMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const audioRef = useRef(null);

  // Guestbook
  const [wishes, setWishes] = useState([]);
  const [newWish, setNewWish] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      fetchWishes();
    } catch (error) {
      console.error("Lỗi tải thiệp:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchWishes = async () => {
    const { data } = await supabase.from('cbq_wishes').select('*').order('created_at', { ascending: false });
    if (data) setWishes(data);
  };

  const handleOpenEnvelope = () => {
    if (isOpen) return;
    setIsOpen(true);
    setShowConfetti(true);
    
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(e => console.log("Trình duyệt chặn autoplay audio", e));
    }
    
    setTimeout(() => {
      setShowConfetti(false);
    }, 8000);
  };
  
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
    setIsMuted(!isMuted);
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
      setWishes([data[0], ...wishes]);
    } else {
      alert("Lỗi khi gửi lời chúc: " + (error?.message || 'Không xác định'));
    }
  };

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9'}}>Đang tải thiệp mời...</div>;
  }

  if (!guest) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9'}}>
        <h2>Không tìm thấy thiệp mời!</h2>
        <p>Mã thiệp mời không hợp lệ hoặc đã bị xóa.</p>
        <Link to="/" style={{marginTop: '20px', padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', textDecoration: 'none', borderRadius: '5px'}}>Về Trang Chủ</Link>
      </div>
    );
  }

  return (
    <div className="invitation-container" style={{ overflowY: isOpen ? 'auto' : 'hidden' }}>
      <style>{`
        .invitation-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          font-family: 'Times New Roman', Times, serif;
          position: relative;
        }

        .back-btn {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: #64748b;
          text-decoration: none;
          font-family: Arial, sans-serif;
          z-index: 100;
        }
        
        .audio-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          z-index: 100;
          color: #64748b;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .main-content {
          margin-top: 10vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 600px;
        }

        .envelope-wrapper {
          position: relative;
          width: 100%;
          max-width: 500px;
          height: 350px;
          transition: transform 0.8s ease;
          cursor: pointer;
          margin: 0 auto;
        }

        .envelope-wrapper.open {
          transform: translateY(150px);
          cursor: default;
          margin-bottom: 300px;
        }

        .envelope {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #b91c1c;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
        }

        .envelope::before {
          content: '';
          position: absolute;
          top: 0;
          border-left: 250px solid transparent;
          border-right: 250px solid transparent;
          border-top: 175px solid #dc2626;
          transform-origin: top;
          transition: transform 0.6s ease 0.2s, z-index 0.2s;
          z-index: 12;
        }

        .envelope-wrapper.open .envelope::before {
          transform: rotateX(180deg);
          z-index: 5;
        }

        .envelope::after {
          content: '';
          position: absolute;
          bottom: 0;
          border-left: 250px solid transparent;
          border-right: 250px solid transparent;
          border-bottom: 175px solid #991b1b;
          z-index: 11;
        }

        .envelope-seal {
          position: absolute;
          top: 155px;
          width: 60px;
          height: 60px;
          background: #fef08a;
          border-radius: 50%;
          z-index: 13;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          color: #991b1b;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          transition: opacity 0.3s;
          font-family: Arial, sans-serif;
          font-size: 14px;
          text-align: center;
          line-height: 1.2;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); box-shadow: 0 0 15px #fef08a; }
          100% { transform: scale(1); }
        }

        .envelope-wrapper.open .envelope-seal {
          opacity: 0;
        }

        .card-inner {
          position: absolute;
          bottom: 10px;
          left: 5%;
          width: 90%;
          height: 520px;
          background: #fffcf8;
          border-radius: 8px;
          box-shadow: 0 -5px 15px rgba(0,0,0,0.1);
          z-index: 8;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
          padding: 30px;
          box-sizing: border-box;
          overflow-y: auto;
          text-align: center;
          border: 2px solid #fef08a;
          background-image: url('https://www.transparenttextures.com/patterns/cream-paper.png');
        }

        .envelope-wrapper.open .card-inner {
          transform: translateY(-280px);
          z-index: 15;
          box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }

        .school-name {
          font-size: 14px;
          text-transform: uppercase;
          color: #991b1b;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }

        .invite-title {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 5px;
        }

        .guest-name {
          font-size: 28px;
          color: #b91c1c;
          font-weight: bold;
          font-family: 'Dancing Script', cursive, serif;
          margin: 15px 0;
          padding: 10px;
          border-bottom: 1px dashed #cbd5e1;
          display: inline-block;
          min-width: 200px;
        }

        .event-details {
          margin: 20px 0;
          color: #334155;
          line-height: 1.6;
          font-size: 16px;
        }
        
        .rsvp-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .rsvp-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }

        .btn-rsvp {
          padding: 10px 20px;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s;
          font-family: Arial, sans-serif;
        }
        
        .btn-rsvp:hover {
          transform: scale(1.05);
        }

        .btn-yes {
          background: #10b981;
          color: white;
        }
        
        .btn-no {
          background: #ef4444;
          color: white;
        }
        
        .guestbook-section {
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          margin-top: 40px;
          margin-bottom: 40px;
          font-family: Arial, sans-serif;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 1s ease 1.5s, transform 1s ease 1.5s;
        }
        
        .envelope-wrapper.open ~ .guestbook-section {
          opacity: 1;
          transform: translateY(0);
        }

        .wish-list {
          margin-top: 20px;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 10px;
        }
        
        .wish-item {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 10px;
          border-left: 4px solid #fef08a;
          text-align: left;
        }
        
        .wish-author {
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 5px;
        }
        
        .wish-content {
          color: #475569;
          font-size: 14px;
          line-height: 1.5;
        }

        @media (max-width: 600px) {
          .envelope::before { border-left-width: 45vw; border-right-width: 45vw; border-top-width: 35vw; }
          .envelope::after { border-left-width: 45vw; border-right-width: 45vw; border-bottom-width: 35vw; }
          .envelope-seal { top: 25vw; }
          .envelope-wrapper.open { transform: translateY(100px); margin-bottom: 250px; }
          .envelope-wrapper.open .card-inner { transform: translateY(-200px); }
          .card-inner { height: 480px; padding: 20px; }
        }
      `}</style>
      
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
      
      <audio ref={audioRef} loop src="https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3" preload="auto" />

      <Link to="/" className="back-btn"><ChevronLeft size={20} /> Về Trang chủ</Link>
      
      {isOpen && (
        <button onClick={toggleAudio} className="audio-btn">
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}

      <div className="main-content">
        <div className={`envelope-wrapper ${isOpen ? 'open' : ''}`} onClick={handleOpenEnvelope}>
          <div className="envelope">
            <div className="envelope-seal">Mở<br/>Thiệp</div>
          </div>
          
          <div className="card-inner">
            {config && (
              <>
                <div className="school-name">{config.school_name}</div>
                <div className="invite-title">{config.invite_title1}</div>
                <div className="guest-name">{guest.name}</div>
                
                <div className="event-details">
                  <strong style={{fontSize: '20px', color: '#1e293b'}}>{config.event_name_main}</strong><br/>
                  <span style={{whiteSpace: 'pre-line'}}>{config.event_name_sub}</span>
                  
                  <div style={{marginTop: '20px'}}>
                    <div><strong>Thời gian:</strong> {config.time}</div>
                    <div style={{marginTop: '5px'}}><strong>Địa điểm:</strong><br/> <span style={{whiteSpace: 'pre-line'}}>{config.location}</span></div>
                  </div>
                </div>

                <div className="rsvp-section">
                  <p style={{margin: '0 0 10px 0', color: '#64748b', fontStyle: 'italic', fontSize: '14px'}}>Vui lòng xác nhận sự hiện diện của bạn để chúng tôi chuẩn bị đón tiếp chu đáo nhất.</p>
                  <div className="rsvp-buttons">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRSVP('attending'); }} 
                      className="btn-rsvp btn-yes"
                      style={{opacity: rsvpStatus === 'declined' ? 0.5 : 1, border: rsvpStatus === 'attending' ? '2px solid #047857' : 'none'}}
                    >
                      <CheckCircle size={18} /> Tham dự
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRSVP('declined'); }} 
                      className="btn-rsvp btn-no"
                      style={{opacity: rsvpStatus === 'attending' ? 0.5 : 1, border: rsvpStatus === 'declined' ? '2px solid #b91c1c' : 'none'}}
                    >
                      <XCircle size={18} /> Không thể đến
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Guestbook Section */}
        <div className="guestbook-section">
          <h3 style={{marginTop: 0, color: '#0f172a', textAlign: 'center'}}>Sổ Lưu Bút Kỷ Niệm 30 Năm</h3>
          <p style={{color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '20px'}}>Hãy để lại những lời chúc tốt đẹp nhất dành cho nhà trường nhé!</p>
          
          <form onSubmit={submitWish} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <textarea 
              value={newWish}
              onChange={(e) => setNewWish(e.target.value)}
              placeholder={`Viết lời chúc của bạn, ${guest.name}...`}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                minHeight: '80px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
              }}
              required
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                alignSelf: 'flex-end', padding: '10px 20px', background: '#3b82f6', color: 'white', 
                border: 'none', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'
              }}
            >
              <Send size={16} /> {isSubmitting ? 'Đang gửi...' : 'Gửi lời chúc'}
            </button>
          </form>
          
          <div className="wish-list">
            {wishes.map(wish => (
              <div key={wish.id} className="wish-item">
                <div className="wish-author">{wish.guest_name}</div>
                <div className="wish-content">{wish.message}</div>
                <div style={{fontSize: '11px', color: '#94a3b8', marginTop: '5px'}}>
                  {new Date(wish.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
            {wishes.length === 0 && (
              <p style={{textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px'}}>
                Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc nhé!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
