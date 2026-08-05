import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Calendar, Users, Heart, Search, MapPin, Phone, Mail, Award, BookOpen, Clock } from 'lucide-react';

export default function PublicHome() {
  const [sponsors, setSponsors] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpCode, setRsvpCode] = useState('');
  const [rsvpResult, setRsvpResult] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchPublicData();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const [sponsorsRes, newsRes] = await Promise.all([
        supabase.from('cbq_sponsors').select('*').eq('is_public', true).order('date_received', { ascending: false }),
        supabase.from('cbq_news').select('*').order('published_at', { ascending: false })
      ]);
      if (!sponsorsRes.error) setSponsors(sponsorsRes.data || []);
      if (!newsRes.error) setNews(newsRes.data || []);
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
      const { data, error } = await supabase.from('cbq_guests').select('*').eq('invitation_code', rsvpCode).single();
      if (error || !data) setRsvpResult({ error: 'Không tìm thấy mã khách mời. Vui lòng kiểm tra lại.' });
      else setRsvpResult({ success: true, guest: data });
    } catch (err) {
      setRsvpResult({ error: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.container}>
      {/* Modern Navbar */}
      <nav style={{...styles.navbar, ...(scrolled ? styles.navbarScrolled : {})}}>
        <div style={styles.navContainer}>
          <div style={styles.logoArea} onClick={() => window.scrollTo(0, 0)}>
            <div style={styles.logoCircle}>30</div>
            <div style={styles.brandGroup}>
              <span style={styles.brandName}>THPT Cao Bá Quát</span>
              <span style={styles.brandSub}>1996 - 2026</span>
            </div>
          </div>
          <div style={styles.navLinks}>
            <button onClick={() => scrollTo('gioithieu')} style={styles.navLink}>Giới thiệu</button>
            <button onClick={() => scrollTo('tintuc')} style={styles.navLink}>Tin tức</button>
            <button onClick={() => scrollTo('vinhdanh')} style={styles.navLink}>Bảng vàng</button>
            <button onClick={() => scrollTo('thiepmoi')} style={styles.navLink}>Tra cứu</button>
            <Link to="/admin" style={styles.adminBtn}>Ban Tổ Chức</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Red/Gold Theme */}
      <header style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <div style={styles.badge}>Lễ Kỷ Niệm Thành Lập Trường</div>
          <h1 style={styles.heroTitle}>30 Năm<br/><span style={styles.textGold}>Một Hành Trình</span></h1>
          <p style={styles.heroText}>
            Trường THPT Cao Bá Quát tự hào là nơi ươm mầm tài năng, chắp cánh ước mơ cho bao thế hệ học sinh. Kính mời các cựu giáo viên, cựu học sinh về thăm lại mái trường xưa.
          </p>
          <div style={styles.heroActions}>
            <button onClick={() => scrollTo('thiepmoi')} style={styles.btnGold}>Tra cứu Thư mời điện tử</button>
            <button onClick={() => scrollTo('tintuc')} style={styles.btnOutline}>Xem thông báo mới</button>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section id="gioithieu" style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <Clock size={40} color="#d32f2f" style={styles.statIcon} />
            <h3 style={styles.statNum}>30</h3>
            <p style={styles.statLabel}>Năm Xây Dựng & Phát Triển</p>
          </div>
          <div style={styles.statItem}>
            <Users size={40} color="#d32f2f" style={styles.statIcon} />
            <h3 style={styles.statNum}>30+</h3>
            <p style={styles.statLabel}>Thế hệ học sinh</p>
          </div>
          <div style={styles.statItem}>
            <Award size={40} color="#d32f2f" style={styles.statIcon} />
            <h3 style={styles.statNum}>1000+</h3>
            <p style={styles.statLabel}>Bằng khen & Giải thưởng</p>
          </div>
          <div style={styles.statItem}>
            <BookOpen size={40} color="#d32f2f" style={styles.statIcon} />
            <h3 style={styles.statNum}>20K+</h3>
            <p style={styles.statLabel}>Cựu học sinh thành đạt</p>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section id="tintuc" style={styles.sectionLight}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Tin Tức & Thông Báo</h2>
          <div style={styles.titleUnderline}></div>
        </div>
        
        {news.length === 0 ? (
          <div style={styles.emptyState}>Chưa có thông báo nào được đăng tải.</div>
        ) : (
          <div style={styles.newsGrid}>
            {news.map(item => (
              <div key={item.id} className="news-card" style={styles.newsCard}>
                <div style={styles.newsImageWrapper}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="news" style={styles.newsImg} />
                  ) : (
                    <div style={styles.newsPlaceholder}>THPT CAO BÁ QUÁT</div>
                  )}
                  <div style={styles.newsDateBadge}>
                    <span style={styles.dateDay}>{new Date(item.published_at).getDate()}</span>
                    <span style={styles.dateMonth}>Tháng {new Date(item.published_at).getMonth() + 1}</span>
                  </div>
                </div>
                <div style={styles.newsBody}>
                  <h3 style={styles.newsTitle}>{item.title}</h3>
                  <p style={styles.newsDesc}>{item.content.substring(0, 120)}...</p>
                  <button style={styles.readMoreBtn}>Đọc tiếp →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sponsors Section */}
      <section id="vinhdanh" style={styles.sectionDark}>
        <div style={styles.sectionHeader}>
          <h2 style={{...styles.sectionTitle, color: 'white'}}>Bảng Vàng Tri Ân</h2>
          <div style={{...styles.titleUnderline, backgroundColor: '#fbbf24'}}></div>
          <p style={{textAlign: 'center', color: '#cbd5e1', maxWidth: '600px', margin: '1rem auto'}}>
            Ban Tổ chức xin trân trọng cảm ơn những đóng góp quý báu của Quý Cơ quan, Doanh nghiệp, Thầy Cô và các Anh/Chị Cựu học sinh.
          </p>
        </div>
        
        <div style={styles.sponsorGrid}>
          {sponsors.length === 0 ? (
            <div style={{gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8'}}>Danh sách đang được cập nhật...</div>
          ) : (
            sponsors.map((sponsor, index) => (
              <div key={sponsor.id} style={{...styles.sponsorCard, animationDelay: `${index * 0.1}s`}}>
                <div style={styles.sponsorIconBox}>
                  <Heart size={24} color="#d32f2f" fill="#d32f2f" />
                </div>
                <h4 style={styles.sponsorName}>{sponsor.name}</h4>
                {sponsor.donation_amount > 0 && (
                  <div style={styles.sponsorAmount}>{Number(sponsor.donation_amount).toLocaleString()} VNĐ</div>
                )}
                {sponsor.donation_item && (
                  <div style={styles.sponsorItem}>{sponsor.donation_item}</div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* RSVP Section */}
      <section id="thiepmoi" style={styles.sectionLight}>
        <div style={styles.rsvpContainer}>
          <div style={styles.rsvpLeft}>
            <h2 style={styles.rsvpTitle}>Tra Cứu Thiệp Mời Điện Tử</h2>
            <p style={styles.rsvpText}>
              Nhập mã số khách mời (được in trên thư mời bản cứng hoặc gửi qua tin nhắn) để xem phiên bản điện tử và gửi phản hồi xác nhận tham dự.
            </p>
            <div style={styles.rsvpFeatures}>
              <div style={styles.rsvpFeature}><CheckIcon /> Xem chi tiết lịch trình sự kiện</div>
              <div style={styles.rsvpFeature}><CheckIcon /> Sơ đồ vị trí chỗ ngồi</div>
              <div style={styles.rsvpFeature}><CheckIcon /> Xác nhận đi kèm người thân</div>
            </div>
          </div>
          <div style={styles.rsvpRight}>
            <div style={styles.rsvpFormBox}>
              <h3 style={{marginBottom: '1rem', color: '#1e293b'}}>Nhập Mã Khách Mời</h3>
              <form onSubmit={handleRsvpSearch} style={styles.searchForm}>
                <div style={styles.inputWrapper}>
                  <Search color="#94a3b8" size={20} style={styles.inputIcon} />
                  <input 
                    type="text" 
                    placeholder="VD: CBQ-12345" 
                    value={rsvpCode}
                    onChange={(e) => setRsvpCode(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <button type="submit" style={styles.searchBtn}>Tìm kiếm</button>
              </form>
              
              {rsvpResult?.error && <div style={styles.errorMsg}>{rsvpResult.error}</div>}
              {rsvpResult?.success && (
                <div style={styles.successBox}>
                  <div style={styles.successHeader}>Đã tìm thấy thông tin!</div>
                  <h4 style={{fontSize: '1.2rem', margin: '0.5rem 0'}}>{rsvpResult.guest.name}</h4>
                  <p style={{color: '#64748b', marginBottom: '1rem'}}>Phân loại: {rsvpResult.guest.category}</p>
                  
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <button style={styles.btnConfirm}>Chắc chắn tham dự</button>
                    <button style={styles.btnDecline}>Rất tiếc, tôi không thể đến</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerGrid}>
          <div>
            <div style={{...styles.logoArea, marginBottom: '1rem', cursor: 'default'}}>
              <div style={styles.logoCircle}>30</div>
              <span style={{...styles.brandName, color: 'white'}}>THPT Cao Bá Quát</span>
            </div>
            <p style={{color: '#94a3b8', lineHeight: 1.6}}>
              Kỷ niệm 30 năm thành lập trường (1996 - 2026).<br/>
              Tự hào truyền thống, vững bước tương lai.
            </p>
          </div>
          <div>
            <h4 style={styles.footerTitle}>Thông Tin Liên Hệ</h4>
            <div style={styles.footerContact}><MapPin size={18}/> Địa chỉ trường THPT Cao Bá Quát</div>
            <div style={styles.footerContact}><Phone size={18}/> Hotline BTC: 0123 456 789</div>
            <div style={styles.footerContact}><Mail size={18}/> Email: lienhe@caobaquat.edu.vn</div>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>© 2026 Ban Tổ Chức Lễ Kỷ Niệm 30 Năm THPT Cao Bá Quát. Hệ thống quản trị bởi Tiểu ban Nội dung.</p>
        </div>
      </footer>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    overflowX: 'hidden'
  },
  navbar: {
    position: 'fixed',
    top: 0,
    width: '100%',
    padding: '1.25rem 0',
    backgroundColor: 'transparent',
    transition: 'all 0.3s ease',
    zIndex: 1000,
  },
  navbarScrolled: {
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    padding: '0.75rem 0',
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  logoCircle: {
    width: '45px',
    height: '45px',
    borderRadius: '12px',
    backgroundColor: '#d32f2f', /* Red Flag */
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '800',
    fontSize: '1.2rem',
    boxShadow: '0 4px 10px rgba(211, 47, 47, 0.3)',
  },
  brandGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandName: {
    fontWeight: '800',
    fontSize: '1.1rem',
    color: '#d32f2f',
    letterSpacing: '-0.5px'
  },
  brandSub: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '600'
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: '#475569',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  adminBtn: {
    textDecoration: 'none',
    backgroundColor: '#1e293b',
    color: 'white',
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s',
  },
  hero: {
    minHeight: '80vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6rem 2rem 4rem',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    // We would use an image here normally, for now a rich gradient
    background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 40%, #0f172a 100%)', 
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
  },
  heroContent: {
    position: 'relative',
    maxWidth: '800px',
    textAlign: 'center',
    color: 'white',
    zIndex: 10,
  },
  badge: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 'clamp(3rem, 8vw, 5rem)',
    fontWeight: '900',
    lineHeight: 1.1,
    marginBottom: '1.5rem',
    letterSpacing: '-2px',
  },
  textGold: {
    color: '#fbbf24', // Yellow Star
    textShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
  },
  heroText: {
    fontSize: '1.25rem',
    lineHeight: 1.6,
    marginBottom: '2.5rem',
    color: '#e2e8f0',
    fontWeight: '400',
    maxWidth: '700px',
    margin: '0 auto 2.5rem',
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnGold: {
    backgroundColor: '#fbbf24',
    color: '#78350f',
    padding: '1rem 2rem',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '1.1rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 25px -5px rgba(251, 191, 36, 0.4)',
    transition: 'transform 0.2s',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1.1rem',
    border: '2px solid rgba(255,255,255,0.3)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  statsSection: {
    backgroundColor: 'white',
    padding: '4rem 2rem',
    borderBottom: '1px solid #e2e8f0',
    position: 'relative',
    marginTop: '-50px',
    maxWidth: '1000px',
    margin: '-50px auto 0',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
    zIndex: 20,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    textAlign: 'center',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: '1rem',
  },
  statNum: {
    fontSize: '3rem',
    fontWeight: '900',
    color: '#1e293b',
    lineHeight: 1,
    marginBottom: '0.5rem',
  },
  statLabel: {
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '0.85rem',
    letterSpacing: '1px',
  },
  sectionLight: {
    padding: '6rem 2rem',
    backgroundColor: '#f8fafc',
  },
  sectionDark: {
    padding: '6rem 2rem',
    backgroundColor: '#1e293b',
    color: 'white',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '4rem',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-1px',
  },
  titleUnderline: {
    width: '80px',
    height: '4px',
    backgroundColor: '#d32f2f',
    margin: '1rem auto 0',
    borderRadius: '2px',
  },
  newsGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2.5rem',
  },
  newsCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  newsImageWrapper: {
    position: 'relative',
    height: '220px',
    backgroundColor: '#f1f5f9',
  },
  newsImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  newsPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  newsDateBadge: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    backgroundColor: 'white',
    padding: '0.5rem',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  dateDay: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#d32f2f',
    lineHeight: 1,
  },
  dateMonth: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: '2px',
  },
  newsBody: {
    padding: '1.5rem',
  },
  newsTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#1e293b',
    lineHeight: 1.4,
  },
  newsDesc: {
    color: '#64748b',
    marginBottom: '1.5rem',
    lineHeight: 1.6,
  },
  readMoreBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  emptyState: {
    textAlign: 'center',
    color: '#64748b',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    maxWidth: '600px',
    margin: '0 auto',
  },
  sponsorGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  sponsorCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    transition: 'transform 0.3s ease, background-color 0.3s ease',
  },
  sponsorIconBox: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
  },
  sponsorName: {
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: 'white',
  },
  sponsorAmount: {
    color: '#fbbf24',
    fontWeight: '800',
    fontSize: '1.25rem',
  },
  sponsorItem: {
    color: '#94a3b8',
    fontSize: '0.95rem',
    marginTop: '0.5rem',
  },
  rsvpContainer: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'center',
  },
  rsvpLeft: {
    paddingRight: '2rem',
  },
  rsvpTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '1.5rem',
    color: '#0f172a',
    letterSpacing: '-1px',
  },
  rsvpText: {
    fontSize: '1.1rem',
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  rsvpFeatures: {
    display: 'grid',
    gap: '1rem',
  },
  rsvpFeature: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.05rem',
    fontWeight: '500',
    color: '#334155',
  },
  rsvpRight: {
    // Left empty for layout
  },
  rsvpFormBox: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
  },
  searchForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    fontSize: '1.1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  searchBtn: {
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    padding: '1rem',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  errorMsg: {
    color: '#ef4444',
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    fontSize: '0.9rem',
  },
  successBox: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    textAlign: 'center',
  },
  successHeader: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  btnConfirm: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnDecline: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    padding: '0.75rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  footer: {
    backgroundColor: '#0f172a',
    padding: '4rem 2rem 2rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  footerGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '3rem',
    marginBottom: '3rem',
  },
  footerTitle: {
    color: 'white',
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
  },
  footerContact: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    color: '#94a3b8',
    marginBottom: '1rem',
  },
  footerBottom: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.9rem',
  }
};
