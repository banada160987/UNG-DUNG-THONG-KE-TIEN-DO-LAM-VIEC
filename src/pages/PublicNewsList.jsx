import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function PublicNewsList() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    supabase.from('cbq_news').select('*').order('published_at', { ascending: false }).then(({data}) => {
      if(data) setNews(data);
    });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tin tức - Sự kiện</h1>
        <Link to="/" style={styles.backBtn}>← Về trang chủ</Link>
      </div>
      <div style={styles.grid}>
        {news.map(n => (
          <div key={n.id} style={styles.card}>
            <img src={n.image_url || 'https://via.placeholder.com/300x200?text=News'} alt="news" style={styles.img} />
            <h3 style={styles.cardTitle}>{n.title}</h3>
            <p style={styles.date}>{new Date(n.published_at).toLocaleDateString('vi-VN')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0 },
  backBtn: { textDecoration: 'none', color: '#d32f2f', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  card: { border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' },
  img: { width: '100%', height: '150px', objectFit: 'cover' },
  cardTitle: { padding: '10px', margin: 0, fontSize: '15px', color: '#1e293b' },
  date: { padding: '0 10px 10px', margin: 0, fontSize: '12px', color: '#64748b' }
};
