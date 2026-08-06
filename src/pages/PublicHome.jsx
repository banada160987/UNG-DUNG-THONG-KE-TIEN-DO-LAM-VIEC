import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Clock, ChevronRight } from 'lucide-react';

export default function PublicHome() {
  const [sponsors, setSponsors] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpCode, setRsvpCode] = useState('');
  const [rsvpResult, setRsvpResult] = useState(null);
  
  const [totalDonation, setTotalDonation] = useState(0);
  const [attendingGuests, setAttendingGuests] = useState(0);
  const [externalLinks, setExternalLinks] = useState([]);
  const [searchParams] = useSearchParams();
  
  const calculateTimeLeft = () => {
    const difference = +new Date("2026-09-03T08:00:00") - +new Date();
    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  useEffect(() => {
    fetchPublicData();
    const rsvpParam = searchParams.get('rsvp');
    if (rsvpParam) {
      setRsvpCode(rsvpParam);
      // Let it render first then fetch
      setTimeout(() => autoFetchRsvp(rsvpParam), 500);
    }
  }, [searchParams]);

  const autoFetchRsvp = async (code) => {
    try {
      const { data, error } = await supabase.from('cbq_guests').select('*').eq('invitation_code', code.trim()).single();
      if (error || !data) setRsvpResult({ error: 'Không tìm thấy mã khách mời. Vui lòng kiểm tra lại mã số.' });
      else setRsvpResult({ success: true, guest: data });
    } catch (err) {
      setRsvpResult({ error: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
    }
  };

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const [sponsorsRes, newsRes, guestsRes, linksRes] = await Promise.all([
        supabase.from('cbq_sponsors').select('*').eq('is_public', true).order('date_received', { ascending: false }),
        supabase.from('cbq_news').select('*').order('published_at', { ascending: false }),
        supabase.from('cbq_guests').select('rsvp_status'),
        supabase.from('cbq_external_links').select('*').eq('is_active', true).order('order_index', { ascending: true })
      ]);
      if (!sponsorsRes.error) {
        setSponsors(sponsorsRes.data || []);
        const total = (sponsorsRes.data || []).reduce((sum, s) => sum + (Number(s.donation_amount) || 0), 0);
        setTotalDonation(total);
      }
      if (!newsRes.error) setNews(newsRes.data || []);
      if (!guestsRes.error) {
        const attendingCount = (guestsRes.data || []).filter(g => g.rsvp_status === 'attending').length;
        setAttendingGuests(attendingCount);
      }
      if (!linksRes.error) setExternalLinks(linksRes.data || []);
    } catch (error) {
      console.log('Chưa có dữ liệu mới.');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvpSearch = async (e) => {
    e.preventDefault();
    if (!rsvpCode) return;
    try {
      const { data, error } = await supabase.from('cbq_guests').select('*').eq('invitation_code', rsvpCode.trim()).single();
      if (error || !data) setRsvpResult({ error: 'Không tìm thấy mã khách mời. Vui lòng kiểm tra lại mã số.' });
      else setRsvpResult({ success: true, guest: data });
    } catch (err) {
      setRsvpResult({ error: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
    }
  };

  const handleConfirm = async (status) => {
    try {
      const { error } = await supabase
        .from('cbq_guests')
        .update({ rsvp_status: status })
        .eq('id', rsvpResult.guest.id);

      if (!error) {
        setRsvpResult(prev => ({
          ...prev,
          guest: { ...prev.guest, rsvp_status: status }
        }));
        alert(status === 'attending' ? 'Cảm ơn Quý vị đã xác nhận tham dự!' : 'Cảm ơn Quý vị đã phản hồi!');
      } else {
        alert('Có lỗi xảy ra khi xác nhận, vui lòng thử lại.');
      }
    } catch (err) {
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="portal-main-grid">

        {/* LEFT COLUMN */}
        <div style={styles.leftCol}>
          {/* COUNTDOWN & STATS */}
          <PortalBlock title="HƯỚNG VỀ LỄ KỶ NIỆM" color="#d32f2f">
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '5px' }}>ĐẾM NGƯỢC THỜI GIAN</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {Object.keys(timeLeft).length > 0 ? (
                  <>
                    <div style={styles.timeBox}><span>{timeLeft.days}</span><small>Ngày</small></div>
                    <div style={styles.timeBox}><span>{timeLeft.hours}</span><small>Giờ</small></div>
                    <div style={styles.timeBox}><span>{timeLeft.minutes}</span><small>Phút</small></div>
                    <div style={styles.timeBox}><span>{timeLeft.seconds}</span><small>Giây</small></div>
                  </>
                ) : (
                  <div style={{ fontWeight: 'bold', color: '#d32f2f', padding: '10px' }}>SỰ KIỆN ĐANG DIỄN RA</div>
                )}
              </div>
            </div>
            
            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={styles.statIcon}>👥</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Đại biểu xác nhận tham dự</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>{attendingGuests} người</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.statIcon}>💝</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng tài trợ (Công khai)</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d32f2f' }}>{totalDonation.toLocaleString()} VNĐ</div>
                </div>
              </div>
            </div>
          </PortalBlock>

          <PortalBlock title="HÌNH ẢNH TIÊU BIỂU" color="#166534">
            <div style={styles.mockSlider}>
              <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" alt="School" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            </div>
          </PortalBlock>

          <PortalBlock title="THÔNG TIN LIÊN HỆ" color="#166534">
            <ul style={styles.listStyle}>
              <li>📍 Địa chỉ trường THPT Cao Bá Quát</li>
              <li>📞 Hotline: 0123.456.789</li>
              <li>✉️ Email: lk@caobaquat.edu.vn</li>
            </ul>
          </PortalBlock>

          <PortalBlock title="LIÊN KẾT TRANG" color="#166534">
            <ul style={styles.linkList}>
              {externalLinks.length > 0 ? (
                externalLinks.map(link => (
                  <li key={link.id}>
                    <ChevronRight size={14} color="#166534" /> 
                    <a href={link.url} target="_blank" rel="noreferrer" style={{color: '#334155', textDecoration: 'none'}}>{link.title}</a>
                  </li>
                ))
              ) : (
                <li><span style={{color: '#94a3b8', fontStyle: 'italic', fontSize: '13px'}}>Đang cập nhật...</span></li>
              )}
            </ul>
          </PortalBlock>
        </div>

        {/* CENTER COLUMN */}
        <div style={styles.centerCol}>

          {/* NỔI BẬT: Tra cứu thiệp mời đặt ở giữa để khách dễ thấy nhất */}
          <div style={styles.rsvpHighlightBlock}>
            <div style={styles.rsvpHighlightHeader}>TRA CỨU THIỆP MỜI ĐIỆN TỬ</div>
            <div style={styles.rsvpHighlightBody}>
              <p style={{ marginBottom: '10px', fontSize: '14px', color: '#475569' }}>Nhập mã số khách mời (được in trên thư mời bản cứng hoặc gửi qua tin nhắn) để xem phiên bản điện tử và gửi phản hồi xác nhận tham dự.</p>

              <form onSubmit={handleRsvpSearch} style={styles.searchForm}>
                <input
                  type="text"
                  placeholder="Nhập mã khách mời (VD: CBQ-12345)"
                  value={rsvpCode}
                  onChange={(e) => setRsvpCode(e.target.value)}
                  style={styles.searchInput}
                />
                <button type="submit" style={styles.searchBtn}>Tra Cứu</button>
              </form>

              {/* Kết quả Thiệp Mời */}
              {rsvpResult?.error && <div style={styles.errorMsg}>{rsvpResult.error}</div>}
              {rsvpResult?.success && (
                <div style={styles.inviteCardWrapper} className="invite-card-animated">
                  {/* Mặt thiệp */}
                  <div style={styles.inviteCard}>
                    <div style={styles.inviteCardInner}>
                      <div style={styles.inviteHeader}>
                        <div style={styles.inviteLogoSmall} className="invite-logo-animated">30</div>
                        <h4 style={styles.inviteSchool}>THPT CAO BÁ QUÁT</h4>
                      </div>

                      <div style={styles.inviteBody}>
                        <p style={styles.inviteIntro}>Trân trọng kính mời</p>
                        <h2 style={styles.inviteName} className="gold-text-shimmer">{rsvpResult.guest.name}</h2>
                        <p style={styles.inviteRole}>{rsvpResult.guest.category}</p>

                        <div style={styles.inviteDivider}></div>
                        <p style={styles.inviteEvent}>Tới dự Lễ Kỷ Niệm 30 Năm Thành Lập Trường</p>

                        <div style={styles.inviteDetails}>
                          <div style={styles.inviteDetailRow}>
                            <Clock size={16} color="#b71c1c" /> <strong>Thời gian:</strong> 08:00, Chủ nhật, 15/11/2026
                          </div>
                          <div style={styles.inviteDetailRow}>
                            <MapPin size={16} color="#b71c1c" /> <strong>Địa điểm:</strong> Sân trường THPT Cao Bá Quát
                          </div>
                        </div>

                        <div style={styles.inviteAgenda}>
                          <p style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#78350f' }}>Chương trình dự kiến:</p>
                          <ul style={{ textAlign: 'left', fontSize: '13px', color: '#475569', paddingLeft: '20px', margin: 0 }}>
                            <li>08:00 - 08:30: Đón tiếp đại biểu</li>
                            <li>08:30 - 10:30: Lễ mít tinh kỷ niệm</li>
                            <li>10:30 - 11:30: Giao lưu các thế hệ</li>
                            <li>11:30: Tiệc thân mật</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Khu vực Xác nhận */}
                  <div style={styles.rsvpActionBox}>
                    {rsvpResult.guest.rsvp_status === 'pending' ? (
                      <>
                        <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Quý vị vui lòng xác nhận tham dự:</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button style={styles.btnConfirm} onClick={() => handleConfirm('attending')}>Tham dự</button>
                          <button style={styles.btnDecline} onClick={() => handleConfirm('not_attending')}>Không thể đến</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '10px', backgroundColor: rsvpResult.guest.rsvp_status === 'attending' ? '#f0fdf4' : '#fef2f2', color: rsvpResult.guest.rsvp_status === 'attending' ? '#166534' : '#991b1b', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', border: '1px solid #ccc' }}>
                        {rsvpResult.guest.rsvp_status === 'attending'
                          ? '✅ Quý vị đã xác nhận tham dự sự kiện.'
                          : '❌ Quý vị đã xác nhận không thể tham dự.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tin Tức - Sự Kiện */}
          <div style={styles.newsBlock}>
            <div style={styles.newsMainHeader}>TIN TỨC - SỰ KIỆN</div>
            <div style={styles.newsMainContent}>
              {news.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Đang cập nhật tin tức...</div>
              ) : (
                <>
                  {/* Tin nổi bật (tin đầu tiên) */}
                  <div style={styles.featuredNews}>
                    <img src={news[0].image_url || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop'} alt="featured" style={styles.featuredNewsImg} />
                    <h3 style={styles.featuredNewsTitle}>{news[0].title}</h3>
                    <div style={styles.newsMeta}>📅 {new Date(news[0].published_at).toLocaleDateString('vi-VN')} | 👁️ Lượt xem: {Math.floor(Math.random() * 500) + 100}</div>
                    <p style={styles.featuredNewsDesc}>{news[0].content.substring(0, 150)}...</p>
                  </div>

                  {/* Danh sách tin cũ hơn */}
                  {news.length > 1 && (
                    <ul style={styles.olderNewsList}>
                      {news.slice(1, 5).map(item => (
                        <li key={item.id} style={styles.olderNewsItem}>
                          <ChevronRight size={14} color="#0284c7" style={{ minWidth: '14px' }} />
                          <a href="#" style={styles.olderNewsLink}>{item.title}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={styles.rightCol}>
          <PortalBlock title="THÔNG BÁO MỚI" color="#d32f2f">
            <div style={styles.marqueeVertical}>
              <ul style={styles.linkList}>
                {news.slice(0, 4).map((n, i) => (
                  <li key={i} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                    <a href="#" style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none' }}>✔ {n.title}</a>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>({new Date(n.published_at).toLocaleDateString('vi-VN')})</div>
                  </li>
                ))}
              </ul>
            </div>
          </PortalBlock>

          <PortalBlock title="BẢNG VÀNG TRI ÂN" color="#d32f2f">
            {sponsors.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#666', padding: '10px' }}>Chưa có dữ liệu.</div>
            ) : (
              <ul style={styles.sponsorList}>
                {sponsors.slice(0, 10).map((s, i) => (
                  <li key={i} style={styles.sponsorItem}>
                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{s.name}</span>
                    {s.donation_amount > 0 && <span style={{ color: '#d32f2f', fontWeight: 'bold', display: 'block' }}>{Number(s.donation_amount).toLocaleString()} VNĐ</span>}
                    {s.donation_item && <span style={{ color: '#059669', display: 'block', fontSize: '12px' }}>{s.donation_item}</span>}
                  </li>
                ))}
              </ul>
            )}
          </PortalBlock>
        </div>

      </div>
  );
}

// Reusable Portal Block Component
function PortalBlock({ title, color, children }) {
  return (
    <div style={styles.portalBlock}>
      <div style={{ ...styles.portalBlockHeader, backgroundColor: color }}>
        {title}
      </div>
      <div style={styles.portalBlockContent}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  // Columns
  leftCol: { display: 'flex', flexDirection: 'column', gap: '15px' },
  centerCol: { display: 'flex', flexDirection: 'column', gap: '15px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '15px' },

  // Blocks
  portalBlock: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
  },
  timeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    color: '#d32f2f',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    width: '50px',
    height: '50px',
  },
  'timeBox span': { // Just inline it, this is React so I should put inline styles carefully
  },
  statIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#f1f5f9',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  portalBlockHeader: {
    color: 'white',
    padding: '8px 12px',
    fontWeight: 'bold',
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  portalBlockContent: {
    padding: '10px',
  },
  listStyle: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.8',
    color: '#334155'
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  linkListLi: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 0',
    borderBottom: '1px dashed #e2e8f0',
    fontSize: '13px',
  },
  sponsorList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  sponsorItem: {
    padding: '8px 0',
    borderBottom: '1px dashed #e2e8f0',
    fontSize: '13px',
  },

  // RSVP Highlight in Center
  rsvpHighlightBlock: {
    backgroundColor: '#fff',
    border: '2px solid #fbbf24',
  },
  rsvpHighlightHeader: {
    backgroundColor: '#fbbf24',
    color: '#78350f',
    padding: '10px 15px',
    fontWeight: 'bold',
    fontSize: '15px',
    textAlign: 'center',
  },
  rsvpHighlightBody: {
    padding: '20px',
    backgroundColor: '#fffbeb',
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
  },
  searchInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
  },
  searchBtn: {
    padding: '10px 20px',
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  errorMsg: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    fontSize: '13px',
    border: '1px solid #fca5a5',
    borderRadius: '4px',
  },

  // Invite Card Styling (Adapted for Portal)
  inviteCardWrapper: { marginTop: '15px' },
  inviteCard: {
    background: 'linear-gradient(135deg, #b71c1c 0%, #7f1d1d 100%)', // Deep red
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  },
  inviteCardInner: {
    backgroundColor: '#fffcf2', // Cream color
    padding: '30px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px dashed #d4af37', // Gold dashed border
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
  },
  inviteHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px' },
  inviteLogoSmall: { width: '45px', height: '45px', background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  inviteSchool: { color: '#b71c1c', margin: 0, fontSize: '15px', fontWeight: 'bold', letterSpacing: '1px' },
  inviteIntro: { fontStyle: 'italic', color: '#666', fontSize: '14px', margin: '10px 0 5px' },
  inviteName: { fontFamily: '"Times New Roman", Georgia, serif', fontSize: '28px', margin: '5px 0', color: '#d4af37', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' },
  inviteRole: { color: '#7f1d1d', fontSize: '14px', fontWeight: 'normal', margin: '5px 0 15px' },
  inviteDivider: { width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, #d4af37, transparent)', margin: '0 auto 15px' },
  inviteEvent: { fontWeight: 'bold', fontSize: '15px', marginBottom: '15px', color: '#1e293b', textTransform: 'uppercase' },
  inviteDetails: { backgroundColor: '#fff', padding: '15px', fontSize: '14px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #fde68a', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
  inviteDetailRow: { marginBottom: '8px', color: '#334155' },
  inviteAgenda: { backgroundColor: '#fffcf2', padding: '15px', border: '1px solid #d4af37', borderRadius: '8px' },

  rsvpActionBox: { marginTop: '15px', textAlign: 'center' },
  btnConfirm: { background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)', color: 'white', padding: '10px 25px', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(22,101,52,0.3)' },
  btnDecline: { backgroundColor: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer' },

  // News Block
  newsBlock: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
  },
  newsMainHeader: {
    backgroundColor: '#166534',
    color: 'white',
    padding: '8px 15px',
    fontWeight: 'bold',
    fontSize: '15px',
  },
  newsMainContent: {
    padding: '15px',
  },
  featuredNewsImg: {
    width: '100%',
    height: '250px',
    objectFit: 'cover',
    marginBottom: '10px',
  },
  featuredNewsTitle: {
    color: '#166534',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
  },
  newsMeta: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '10px',
  },
  featuredNewsDesc: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#334155',
  },
  olderNewsList: {
    listStyle: 'none',
    padding: 0,
    margin: '15px 0 0 0',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '10px',
  },
  olderNewsItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '5px',
    padding: '6px 0',
  },
  olderNewsLink: {
    color: '#0284c7',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
};
