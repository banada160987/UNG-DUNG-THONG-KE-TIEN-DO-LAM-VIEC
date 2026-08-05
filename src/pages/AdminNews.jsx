import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';

export default function AdminNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: ''
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cbq_news').select('*').order('published_at', { ascending: false });
    if (!error) setNews(data || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('cbq_news').insert([formData]);
    if (!error) {
      setShowForm(false);
      setFormData({ title: '', content: '', image_url: '' });
      fetchNews();
    } else {
      alert("Lỗi khi lưu tin tức!");
    }
  };

  return (
    <Layout title="Quản lý Tin tức Sự kiện">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Plus size={20} /> Đăng Tin mới
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem' }}>
          <h3>Đăng tải Tin tức / Thông báo</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Tiêu đề bài viết (*)</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required style={styles.input} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Link Ảnh bìa (URL)</label>
              <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="Ví dụ: https://link-anh.com/anh1.jpg" style={styles.input} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Nội dung bài viết (*)</label>
              <textarea name="content" value={formData.content} onChange={handleChange} required style={{...styles.input, minHeight: '150px'}} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Đăng bài</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 2rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {loading ? <p>Đang tải...</p> : (
          news.length === 0 ? <p className="glass" style={{padding: '2rem', textAlign: 'center'}}>Chưa có bài viết nào.</p> :
          news.map(n => (
            <div key={n.id} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', gap: '1.5rem' }}>
              <div style={{ width: '150px', height: '100px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                {n.image_url ? <img src={n.image_url} alt="Cover" style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : null}
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{n.title}</h3>
                <small style={{ color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                  Đăng lúc: {new Date(n.published_at).toLocaleString('vi-VN')}
                </small>
                <p style={{ margin: 0, color: '#334155' }}>{n.content.substring(0, 150)}...</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}

const styles = {
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
  }
};
