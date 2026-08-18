import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Clock, ChevronRight, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

export default function PublicHome() {
  const [sponsors, setSponsors] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpCode, setRsvpCode] = useState('');
  const [rsvpResult, setRsvpResult] = useState(null);
  const [inviteConfig, setInviteConfig] = useState(null);
  const inviteRef = useRef(null);
  
  // LIVE SEARCH SUGGESTIONS
  const [allGuests, setAllGuests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
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

  async function fetchPublicData() {
    setLoading(true);
    try {
      const [sponsorsRes, newsRes, guestsRes, linksRes, configRes] = await Promise.all([
        supabase.from('cbq_sponsors').select('*').eq('is_public', true).order('date_received', { ascending: false }),
        supabase.from('cbq_news').select('*').order('published_at', { ascending: false }),
        supabase.from('cbq_guests').select('*'),
        supabase.from('cbq_external_links').select('*').eq('is_active', true).order('order_index', { ascending: true }),
        supabase.from('cbq_pages').select('*').eq('slug', 'invite-config').single()
      ]);
      
      if (configRes.data && configRes.data.content) {
        try {
          const parsed = typeof configRes.data.content === 'string' ? JSON.parse(configRes.data.content) : configRes.data.content;
          setInviteConfig(parsed);
        } catch (e) {
          console.error("Lỗi parse cấu hình thiệp", e);
        }
      }

      if (!sponsorsRes.error) {
        setSponsors(sponsorsRes.data || []);
        const total = (sponsorsRes.data || []).reduce((sum, s) => sum + (Number(s.donation_amount) || 0), 0);
        setTotalDonation(total);
      }
      if (!newsRes.error) setNews(newsRes.data || []);
      if (!guestsRes.error) {
        const guestData = guestsRes.data || [];
        setAllGuests(guestData);
        const attendingCount = guestData.filter(g => g.rsvp_status === 'attending').length;
        setAttendingGuests(attendingCount);
      }
      if (!linksRes.error) setExternalLinks(linksRes.data || []);
    } catch (error) {
      console.log('Chưa có dữ liệu mới.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (value) => {
    setRsvpCode(value);
    const q = value.trim();
    if (!q || q.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const qNorm = removeAccents(q);
    const matches = allGuests.filter(g => {
      const nameNorm = removeAccents(g.name);
      const codeNorm = removeAccents(g.invitation_code);
      const groupNorm = removeAccents(g.group_name || g.note || '');
      return nameNorm.includes(qNorm) || codeNorm.includes(qNorm) || groupNorm.includes(qNorm);
    }).slice(0, 10);

    setSearchResults(matches);
    setShowDropdown(true);
  };

  const handleSelectGuest = (guestItem) => {
    setRsvpCode(guestItem.invitation_code);
    setRsvpResult({ success: true, guest: guestItem });
    setShowDropdown(false);
  };

  const handleRsvpSearch = (e) => {
    if (e) e.preventDefault();
    const q = rsvpCode.trim();
    if (!q) return;

    const qNorm = removeAccents(q);
    const match = allGuests.find(g => 
      removeAccents(g.invitation_code) === qNorm || 
      removeAccents(g.name).includes(qNorm)
    );

    if (match) {
      setRsvpResult({ success: true, guest: match });
      setShowDropdown(false);
    } else {
      setRsvpResult({ error: `Không tìm thấy thông tin khách mời phù hợp từ khóa "${rsvpCode}". Vui lòng kiểm tra lại.` });
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

  const handleDownloadInvite = async () => {
    if (!inviteRef.current) return;
    try {
      const canvas = await html2canvas(inviteRef.current, { scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `ThiepMoi_${rsvpResult.guest.name}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error);
      alert("Không thể tải ảnh. Vui lòng thử lại!");
    }
  };

  const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="portal-main-grid">
      <style>{`
        .search-dropdown-menu {
          position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
          background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin-top: 6px; max-height: 280px; overflow-y: auto;
        }
        .search-dropdown-item {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 10px 14px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s;
        }
        .search-dropdown-item:last-child { border-bottom: none; }
        .search-dropdown-item:hover { background: #fff1f2; }
      `}</style>

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
              <p style={{ marginBottom: '12px', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                Nhập <strong>Họ và Tên</strong> hoặc <strong>Mã số thiệp mời</strong> để tra cứu phiên bản điện tử và gửi phản hồi xác nhận tham dự.
              </p>

              <div style={{ position: 'relative', width: '100%' }}>
                <form onSubmit={handleRsvpSearch} style={styles.searchForm}>
                  <input
                    type="text"
                    placeholder="Nhập Họ Tên hoặc Mã thiệp (VD: Nguyễn Văn A, 12A1 hoặc CBQ-12345)..."
                    value={rsvpCode}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
                    style={styles.searchInput}
                  />
                  <button type="submit" style={styles.searchBtn}>Tra Cứu</button>
                </form>

                {/* LIVE SEARCH DROPDOWN SUGGESTIONS LIST */}
                {showDropdown && (
                  <div className="search-dropdown-menu">
                    {isSearching ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        ⏳ Đang tìm kiếm khách mời...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((g) => (
                        <div
                          key={g.id}
                          className="search-dropdown-item"
                          onClick={() => handleSelectGuest(g)}
                        >
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                              👤 {g.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              {g.group_name || g.note || 'Cựu học sinh'} • Mã: <span style={{ color: '#b45309', fontWeight: 'bold' }}>{g.invitation_code}</span>
                            </div>
                          </div>
                          <a 
                            href={`/invite/${g.invitation_code}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{
                              fontSize: '11.5px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', padding: '6px 14px',
                              borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(190,18,60,0.25)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Mở Thiệp 5D ➔
                          </a>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        Không tìm thấy khách mời phù hợp với từ khóa "{rsvpCode}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kết quả Thiệp Mời */}
              {rsvpResult?.error && <div style={styles.errorMsg}>{rsvpResult.error}</div>}
              {rsvpResult?.success && (
                <div style={styles.inviteCardWrapper} className="invite-card-animated">
                  {/* Mặt thiệp (Bi-fold layout) */}
                  <div className="bifold-invite-container" ref={inviteRef}>
                    
                    {/* TRANG TRÁI - Lời mời & Thông tin khách */}
                    <div className="bifold-page bifold-page-left">
                      <div className="invite-dept">
                        <strong>{inviteConfig?.school_name || 'TRƯỜNG THPT CAO BÁ QUÁT'}</strong>
                        <div className="invite-dept-line"></div>
                      </div>
                      
                      <div className="invite-greeting">{inviteConfig?.invite_title1 || 'Trân trọng kính mời'}</div>
                      <div className="invite-greeting-sub" style={{ textAlign: 'center', marginTop: '5px' }}>
                        <span style={{ borderBottom: '1px solid #d4af37', paddingBottom: '2px', fontWeight: 'bold' }}>
                           {inviteConfig?.invite_title2 || 'ĐẠI BIỂU THAM DỰ'}
                        </span>
                      </div>
                      
                      <div className="event-title-box" style={{ marginTop: '30px' }}>
                        <div className="event-title-line1" style={{ fontSize: '24px', color: '#b71c1c' }}>{inviteConfig?.event_name_main || 'LỄ KỶ NIỆM'}</div>
                        <div className="event-title-line2" style={{ whiteSpace: 'pre-line', color: '#b71c1c', marginTop: '10px' }}>{inviteConfig?.event_name_sub || '30 NĂM THÀNH LẬP\nTRƯỜNG THPT CAO BÁ QUÁT\n(1996 - 2026)'}</div>
                      </div>
                      
                      <div className="time-loc-table">
                        <div className="tl-row" style={{ alignItems: 'flex-start' }}>
                          <div className="tl-icon">🕒</div>
                          <div className="tl-label">THỜI GIAN:</div>
                        </div>
                        <div className="tl-row">
                          <div className="tl-value" style={{ marginLeft: '25px', fontWeight: 'bold' }}>{inviteConfig?.time || '07 giờ 30, ngày 03 tháng 9 năm 2026'}</div>
                        </div>
                        <div className="tl-row" style={{ alignItems: 'flex-start', marginTop: '10px' }}>
                          <div className="tl-icon">📍</div>
                          <div className="tl-label">ĐỊA ĐIỂM:</div>
                        </div>
                        <div className="tl-row">
                          <div className="tl-value" style={{ marginLeft: '25px', whiteSpace: 'pre-line', fontWeight: 'bold' }}>{inviteConfig?.location || 'Trường THPT Cao Bá Quát\nTDP 9, phường Tân An, tỉnh Đắk Lắk'}</div>
                        </div>
                      </div>
                      
                      <div className="honor-text" style={{ whiteSpace: 'pre-line', fontStyle: 'italic', marginTop: '20px' }}>
                        {inviteConfig?.footer_message || 'Sự hiện diện của Quý vị là niềm vinh dự,\ngóp phần làm nên thành công của buổi lễ.'}
                      </div>
                      
                      <div className="signature-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '20px' }}>
                        <div style={{ fontStyle: 'italic' }}>{inviteConfig?.sign_date || 'Tân An, ngày 10 tháng 8 năm 2026'}</div>
                        <div style={{ fontWeight: 'bold', whiteSpace: 'pre-line', textAlign: 'center', marginTop: '5px' }}>{inviteConfig?.sign_title || 'TM. BAN TỔ CHỨC\nHIỆU TRƯỞNG'}</div>
                        <div className="signature-stamp-placeholder" style={{ height: '50px' }}></div>
                        <div className="signature-handwriting" style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '20px', color: '#b71c1c', fontWeight: 'bold' }}>{inviteConfig?.sign_name || 'Lê Thị Thảo'}</div>
                      </div>
                    </div>

                    {/* TRANG PHẢI - Lịch trình & Mã QR */}
                    <div className="bifold-page bifold-page-right">
                      <div className="agenda-title-box">
                        <div className="agenda-title" style={{ fontSize: '18px', color: '#b71c1c' }}>{inviteConfig?.program_title || 'CHƯƠNG TRÌNH LỄ KỶ NIỆM'}</div>
                      </div>
                      
                      <div className="agenda-table-wrapper" style={{ margin: '15px 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th style={{ color: '#b71c1c', borderBottom: '1px solid #94a3b8', padding: '8px', textAlign: 'left', width: '100px' }}>Thời gian</th>
                              <th style={{ color: '#b71c1c', borderBottom: '1px solid #94a3b8', padding: '8px', textAlign: 'left' }}>Nội dung chương trình</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inviteConfig?.agenda && inviteConfig.agenda.length > 0 ? inviteConfig.agenda.map((item, idx) => {
                              // Nếu agenda là kiểu cũ (chuỗi)
                              if (typeof item === 'string') {
                                const parts = item.split(': ');
                                return (
                                  <tr key={idx}>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#b71c1c', fontWeight: 'bold' }}>{parts[0]}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', whiteSpace: 'pre-line' }}>{parts.slice(1).join(': ')}</td>
                                  </tr>
                                );
                              }
                              // Kiểu mới (object)
                              return (
                                <tr key={idx}>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#b71c1c', fontWeight: 'bold' }}>{item.time}</td>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', whiteSpace: 'pre-line' }}>{item.content}</td>
                                </tr>
                              );
                            }) : (
                               <tr><td colSpan="2" style={{ padding: '8px' }}>Chưa cập nhật</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="qr-box-wrapper" style={{ border: '1px solid #fde68a', backgroundColor: '#fffbeb', borderRadius: '8px', padding: '15px', marginTop: 'auto' }}>
                        <div style={{ whiteSpace: 'pre-line', fontSize: '12px', textAlign: 'center', fontStyle: 'italic', color: '#d32f2f', marginBottom: '10px' }}>
                          {inviteConfig?.qr_message || 'Để khâu tiếp đón được chu đáo,\nQuý đại biểu vui lòng quét mã QR xác nhận thông tin\ntham dự Chương trình Lễ Kỷ niệm'}
                        </div>
                        <div className="qr-box" style={{ marginTop: '0', display: 'flex', justifyContent: 'center' }}>
                          <QRCodeSVG value={rsvpResult.guest.invitation_code} size={80} level="H" fgColor="#000" />
                        </div>
                      </div>
                      
                      <div className="closing-text" style={{ fontStyle: 'italic', color: '#b71c1c', fontSize: '15px', fontWeight: 'bold' }}>
                        {inviteConfig?.ending_message || 'Rất hân hạnh được đón tiếp!'}
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
                    
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <a 
                        href={`/thiep/${rsvpResult.guest.invitation_code}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, padding: '12px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(190,18,60,0.25)', minWidth: '200px' }}
                      >
                        ✨ Trải Nghiệm Thiệp Mời 5D Tương Tác ➔
                      </a>
                      <button onClick={handleDownloadInvite} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <Download size={18} /> Tải Về
                      </button>
                    </div>
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

