import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function PublicAbout() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('cbq_pages').select('content').eq('slug', 'gioi-thieu').single().then(({data}) => {
      if(data) setContent(data.content);
      setLoading(false);
    });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Giới thiệu trường THPT Cao Bá Quát</h1>
      </div>
      <div style={styles.content}>
        {loading ? <p>Đang tải...</p> : (
          <div dangerouslySetInnerHTML={{ __html: content || '<p>Nội dung đang được cập nhật...</p>' }} />
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0, fontSize: '24px' },
  content: { lineHeight: '1.8', fontSize: '16px', color: '#334155' }
};
