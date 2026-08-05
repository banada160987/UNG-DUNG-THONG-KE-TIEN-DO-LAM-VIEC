import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Calendar, Users, Heart, Search } from 'lucide-react';

export default function PublicHome() {
  const [sponsors, setSponsors] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpCode, setRsvpCode] = useState('');
  const [rsvpResult, setRsvpResult] = useState(null);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      // Dùng try-catch ẩn để không lỗi nếu table chưa tồn tại (chờ Admin chạy SQL)
      const [sponsorsRes, newsRes] = await Promise.all([
        supabase.from('cbq_sponsors').select('*').eq('is_public', true).order('date_received', { ascending: false }),
        supabase.from('cbq_news').select('*').order('published_at', { ascending: false })
      ]);
      
      if (!sponsorsRes.error) setSponsors(sponsorsRes.data || []);
      if (!newsRes.error) setNews(newsRes.data || []);
    } catch (error) {
      console.log('Chưa có bảng dữ liệu mới, vui lòng chạy SQL script.');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvpSearch = async (e) => {
    e.preventDefault();
    if (!rsvpCode) return;
    
    try {
      const { data, error } = await supabase
        .from('cbq_guests')
        .select('*')
        .eq('invitation_code', rsvpCode)
        .single();
        
      if (error || !data) {
        setRsvpResult({ error: 'Không tìm thấy mã khách mời. Vui lòng kiểm tra lại.' });
      } else {
        setRsvpResult({ success: true, guest: data });
      }
    } catch (err) {
      setRsvpResult({ error: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
    }
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logoArea}>
          <div style={styles.logoCircle}>CBQ</div>
          <span style={styles.brandName}>THPT Cao Bá Quát</span>
        </div>
        <div style={styles.navLinks}>
          <a href="#tintuc" style={styles.link}>Tin tức</a>
          <a href="#vinhdanh" style={styles.link}>Bảng Vàng</a>
          <a href="#thiepmoi" style={styles.link}>Thiệp Mời</a>
          <Link to="/admin" style={styles.adminBtn}>Ban Tổ Chức</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Kỷ Niệm 30 Năm</h1>
          <h2 style={styles.heroSubtitle}>Trường THPT Cao Bá Quát - Xây dựng & Phát triển</h2>
          <p style={styles.heroText}>Tự hào truyền thống - Vững bước vươn xa (1996 - 2026)</p>
          <a href="#thiepmoi" style={styles.ctaBtn}>Tra cứu Thiệp Mời</a>
        </div>
      </header>

      {/* News Section */}
      <section id="tintuc" style={styles.section}>
        <h2 style={styles.sectionTitle}><Calendar style={{ marginRight: '10px' }}/> Tin Tức Sự Kiện</h2>
        {news.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Đang cập nhật tin tức mới nhất...</p>
        ) : (
          <div style={styles.grid}>
            {news.map(item => (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardImage}>{item.image_url ? <img src={item.image_url} alt="news" style={{width: '100%'}}/> : 'CBQ'}</div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <p style={styles.cardDesc}>{item.content.substring(0, 100)}...</p>
                  <small style={{color: '#888'}}>{new Date(item.published_at).toLocaleDateString('vi-VN')}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sponsors Section */}
      <section id="vinhdanh" style={{...styles.section, backgroundColor: '#fdf2f8'}}>
        <h2 style={styles.sectionTitle}><Heart color="#e11d48" style={{ marginRight: '10px' }}/> Bảng Vàng Tri Ân</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Ban tổ chức xin chân thành cảm ơn các Cơ quan, Doanh nghiệp, Cựu giáo viên, Cựu học sinh và các Mạnh thường quân đã đồng hành cùng nhà trường.
        </p>
        
        <div style={styles.sponsorGrid}>
          {sponsors.length === 0 ? (
            <div style={{gridColumn: '1/-1', textAlign: 'center'}}>Danh sách đang được cập nhật...</div>
          ) : (
            sponsors.map(sponsor => (
              <div key={sponsor.id} style={styles.sponsorCard}>
                <div style={styles.sponsorIcon}>🏆</div>
                <h4 style={styles.sponsorName}>{sponsor.name}</h4>
                {sponsor.donation_amount > 0 && (
                  <div style={styles.sponsorAmount}>{sponsor.donation_amount.toLocaleString()} VNĐ</div>
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
      <section id="thiepmoi" style={styles.section}>
        <h2 style={styles.sectionTitle}><Users style={{ marginRight: '10px' }}/> Tra Cứu Thiệp Mời</h2>
        <div style={styles.rsvpBox}>
          <p>Nhập Mã Khách Mời (in trên thư mời giấy) để xem Thiệp điện tử và xác nhận tham dự.</p>
          <form onSubmit={handleRsvpSearch} style={styles.searchForm}>
            <input 
              type="text" 
              placeholder="Ví dụ: CBQ-12345" 
              value={rsvpCode}
              onChange={(e) => setRsvpCode(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}><Search size={20}/></button>
          </form>
          
          {rsvpResult?.error && <div style={{color: 'red', marginTop: '1rem'}}>{rsvpResult.error}</div>}
          {rsvpResult?.success && (
            <div style={styles.rsvpSuccess}>
              <h3>Kính mời: {rsvpResult.guest.name}</h3>
              <p>Phân loại: {rsvpResult.guest.category}</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button style={{...styles.ctaBtn, backgroundColor: '#10b981'}}>Chắc chắn tham dự</button>
                <button style={{...styles.ctaBtn, backgroundColor: '#ef4444', color: 'white', border: 'none'}}>Không thể tham dự</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer style={styles.footer}>
        <p>© 2026 Trường THPT Cao Bá Quát. All rights reserved.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    color: '#333',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 5%',
    backgroundColor: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e11d48',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
  },
  brandName: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: '#1e293b',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  link: {
    textDecoration: 'none',
    color: '#475569',
    fontWeight: '500',
  },
  adminBtn: {
    textDecoration: 'none',
    backgroundColor: '#1e293b',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontWeight: 'bold',
  },
  hero: {
    height: '60vh',
    background: 'linear-gradient(135deg, #e11d48 0%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    textAlign: 'center',
    padding: '0 20px',
  },
  heroContent: {
    maxWidth: '800px',
  },
  heroTitle: {
    fontSize: '4rem',
    fontWeight: '900',
    marginBottom: '1rem',
    textShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  heroSubtitle: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
  },
  heroText: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    opacity: 0.9,
  },
  ctaBtn: {
    display: 'inline-block',
    backgroundColor: '#fbbf24',
    color: '#0f172a',
    padding: '1rem 2rem',
    borderRadius: '30px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)',
    transition: 'transform 0.2s',
  },
  section: {
    padding: '5rem 5%',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '2rem',
    color: '#1e293b',
    marginBottom: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  },
  cardImage: {
    height: '200px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cbd5e1',
    fontSize: '2rem',
  },
  cardBody: {
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
  },
  cardDesc: {
    color: '#64748b',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  sponsorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
  sponsorCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '15px',
    textAlign: 'center',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
    border: '1px solid #fce7f3',
  },
  sponsorIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  sponsorName: {
    fontSize: '1.1rem',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  sponsorAmount: {
    color: '#e11d48',
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
  sponsorItem: {
    color: '#0ea5e9',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  rsvpBox: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  searchForm: {
    display: 'flex',
    marginTop: '1.5rem',
    gap: '0.5rem',
  },
  searchInput: {
    flex: 1,
    padding: '1rem',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    fontSize: '1.1rem',
    outline: 'none',
  },
  searchBtn: {
    backgroundColor: '#0f172a',
    color: 'white',
    border: 'none',
    padding: '0 1.5rem',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  rsvpSuccess: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '15px',
  },
  footer: {
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    textAlign: 'center',
    padding: '2rem',
    marginTop: '2rem',
  }
};
