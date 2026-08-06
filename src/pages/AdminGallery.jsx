import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cbq_gallery').select('*').order('created_at', { ascending: false });
    if (!error && data) setImages(data);
    setLoading(false);
  };

  const handleApprove = async (id, isApproved) => {
    try {
      const { error } = await supabase.from('cbq_gallery').update({ is_approved: isApproved }).eq('id', id);
      if (error) throw error;
      fetchImages();
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;
    try {
      const { error } = await supabase.from('cbq_gallery').delete().eq('id', id);
      if (error) throw error;
      fetchImages();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  return (
    <Layout title="Quản lý Thư viện ảnh">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
      ) : (
        <div style={styles.grid}>
          {images.map(img => (
            <div key={img.id} className="glass" style={styles.card}>
              <img src={img.image_url} alt="Gallery" style={styles.img} />
              <div style={styles.cardBody}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                  <strong>Người tải lên:</strong> {img.uploaded_by || 'Khuyết danh'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {img.is_approved ? (
                    <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={16} /> Đã duyệt
                    </span>
                  ) : (
                    <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={16} /> Chờ duyệt
                    </span>
                  )}
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleApprove(img.id, !img.is_approved)} 
                      style={styles.approveBtn(img.is_approved)}
                    >
                      {img.is_approved ? 'Ẩn' : 'Duyệt'}
                    </button>
                    <button onClick={() => handleDelete(img.id)} style={styles.deleteBtn}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Chưa có hình ảnh nào.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  img: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  cardBody: {
    padding: '1rem',
  },
  approveBtn: (isApproved) => ({
    padding: '6px 12px',
    backgroundColor: isApproved ? '#fef3c7' : '#d1fae5',
    color: isApproved ? '#d97706' : '#059669',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  }),
  deleteBtn: {
    padding: '6px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
