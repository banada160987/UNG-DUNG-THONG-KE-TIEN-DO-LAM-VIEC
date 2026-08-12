import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AdminNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
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
    if (editingId) {
      const { error } = await supabase.from('cbq_news').update(formData).eq('id', editingId);
      if (!error) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ title: '', content: '', image_url: '' });
        fetchNews();
      } else {
        alert("Lỗi khi cập nhật tin tức!");
      }
    } else {
      const { error } = await supabase.from('cbq_news').insert([formData]);
      if (!error) {
        setShowForm(false);
        setFormData({ title: '', content: '', image_url: '' });
        fetchNews();
      } else {
        alert("Lỗi khi lưu tin tức!");
      }
    }
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      content: item.content,
      image_url: item.image_url || ''
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin tức này không?")) return;
    const { error } = await supabase.from('cbq_news').delete().eq('id', id);
    if (!error) {
      fetchNews();
    } else {
      alert("Lỗi khi xóa tin tức!");
    }
  };

  return (
    <Layout title="Quản lý Tin tức Sự kiện">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => {
          setEditingId(null);
          setFormData({ title: '', content: '', image_url: '' });
          setShowForm(!showForm);
        }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Plus size={20} /> Đăng Tin mới
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem' }}>
          <h3>{editingId ? 'Cập nhật Tin tức' : 'Đăng tải Tin tức / Thông báo'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Tiêu đề bài viết (*)</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required style={styles.input} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Ảnh bìa</label>
              <ImageUpload 
                currentUrl={formData.image_url} 
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Nội dung bài viết (*)</label>
              <ReactQuill theme="snow" value={formData.content} onChange={(val) => setFormData(prev => ({...prev, content: val}))} style={{backgroundColor: 'white', marginBottom: '20px'}} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>{editingId ? 'Cập nhật' : 'Đăng bài'}</button>
              <button type="button" onClick={() => {setShowForm(false); setEditingId(null); setFormData({ title: '', content: '', image_url: '' });}} style={{ padding: '0.75rem 2rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
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
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{n.title}</h3>
                <small style={{ color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                  Đăng lúc: {new Date(n.published_at).toLocaleString('vi-VN')}
                </small>
                <p style={{ margin: 0, color: '#334155', marginBottom: '1rem' }}>{n.content.replace(/<[^>]+>/g, '').substring(0, 150)}...</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(n)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <Pencil size={14} /> Sửa
                  </button>
                  <button onClick={() => handleDelete(n.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
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
