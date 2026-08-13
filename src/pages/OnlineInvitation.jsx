import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, ChevronLeft } from 'lucide-react';

export default function OnlineInvitation() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [config, setConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(null);

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
    } catch (error) {
      console.error("Lỗi tải thiệp:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status) => {
    if (!guest) return;
    setRsvpStatus(status);
    await supabase.from('cbq_guests').update({ rsvp_status: status }).eq('id', guest.id);
    alert(status === 'attending' ? "Cảm ơn bạn đã xác nhận tham dự!" : "Rất tiếc vì bạn không thể tham dự.");
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
    <div className="invitation-container">
      <style>{`
        .invitation-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          font-family: 'Times New Roman', Times, serif;
          position: relative;
          overflow: hidden;
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

        .envelope-wrapper {
          position: relative;
          width: 100%;
          max-width: 500px;
          height: 350px;
          transition: all 0.8s ease;
          cursor: pointer;
        }

        .envelope-wrapper.open {
          transform: translateY(200px);
          cursor: default;
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
        }

        .envelope-wrapper.open .envelope-seal {
          opacity: 0;
        }

        .card-inner {
          position: absolute;
          bottom: 10px;
          left: 5%;
          width: 90%;
          height: 500px;
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
          transform: translateY(-250px);
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

        @media (max-width: 600px) {
          .envelope::before {
            border-left-width: 45vw;
            border-right-width: 45vw;
            border-top-width: 35vw;
          }
          .envelope::after {
            border-left-width: 45vw;
            border-right-width: 45vw;
            border-bottom-width: 35vw;
          }
          .envelope-seal {
            top: 25vw;
          }
          .envelope-wrapper.open {
            transform: translateY(100px);
          }
          .envelope-wrapper.open .card-inner {
            transform: translateY(-200px);
          }
          .card-inner {
            height: 450px;
            padding: 20px;
          }
        }
      `}</style>

      <Link to="/" className="back-btn"><ChevronLeft size={20} /> Về Trang chủ</Link>

      <div className={`envelope-wrapper ${isOpen ? 'open' : ''}`} onClick={() => !isOpen && setIsOpen(true)}>
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
                <p style={{margin: '0 0 10px 0', color: '#64748b', fontStyle: 'italic'}}>Vui lòng xác nhận sự hiện diện của bạn để chúng tôi chuẩn bị đón tiếp chu đáo nhất.</p>
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
    </div>
  );
}
