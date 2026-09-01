import { useEffect, useState } from 'react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase } from '../lib/supabase';

export default function PublicNewsList() {
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);

  async function fetchNews() {
    const { data } = await supabase.from('cbq_news').select('*').order('published_at', { ascending: false });
    if (data) setNews(data);
  }

  useEffect(() => {
    fetchNews();
  }, []);

  useAutoRefresh(fetchNews, 60000);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tin tức - Sự kiện</h1>
      </div>

      <div style={styles.grid}>
        {news.map(n => (
          <div 
            key={n.id} 
            style={{ ...styles.card, cursor: 'pointer' }}
            onClick={() => setSelectedNews(n)}
          >
            <img src={n.image_url || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&auto=format&fit=crop'} alt="news" style={styles.img} />
            <h3 style={styles.cardTitle}>{n.title}</h3>
            <p style={styles.snippet}>
              {(n.content || '').replace(/<[^>]+>/g, '').substring(0, 100)}...
            </p>
            <p style={styles.date}>📅 {new Date(n.published_at).toLocaleDateString('vi-VN')}</p>
          </div>
        ))}
      </div>

      {/* NEWS DETAIL READER MODAL */}
      {selectedNews && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }} 
          onClick={() => setSelectedNews(null)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              position: 'relative',
              padding: '28px'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedNews(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>

            {selectedNews.image_url && (
              <img 
                src={selectedNews.image_url} 
                alt={selectedNews.title} 
                style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} 
              />
            )}

            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#166534', marginTop: 0, marginBottom: '12px', lineHeight: '1.4' }}>
              {selectedNews.title}
            </h2>

            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '20px' }}>
              <span>📅 Đăng lúc: {new Date(selectedNews.published_at || Date.now()).toLocaleDateString('vi-VN')}</span>
              <span>👁️ Lượt xem: 488</span>
            </div>

            <div 
              dangerouslySetInnerHTML={{ __html: selectedNews.content || '' }} 
              style={{ fontSize: '15px', lineHeight: '1.7', color: '#334155' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '30px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0, fontSize: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', transition: 'all 0.2s ease', background: 'white' },
  img: { width: '100%', height: '160px', objectFit: 'cover' },
  cardTitle: { padding: '12px 12px 6px', margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: 'bold', lineHeight: '1.4' },
  snippet: { padding: '0 12px 8px', margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' },
  date: { padding: '0 12px 12px', margin: 0, fontSize: '12px', color: '#64748b' }
};
