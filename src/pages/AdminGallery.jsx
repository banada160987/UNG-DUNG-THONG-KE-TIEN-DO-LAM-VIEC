import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Trash2, CheckCircle, XCircle, Upload, Plus, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';

const DEFAULT_SAMPLE_PHOTOS = [
  { image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80", uploaded_by: "Ban Tổ Chức Lễ Kỷ Niệm 30 Năm", is_approved: true },
  { image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80", uploaded_by: "Cựu Học Sinh Khóa 1996 - 1999", is_approved: true },
  { image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80", uploaded_by: "Thầy Cô & Học Sinh Niên Khóa 2002 - 2005", is_approved: true },
  { image_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80", uploaded_by: "Hội Cựu Học Sinh THPT Cao Bá Quát", is_approved: true },
  { image_url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80", uploaded_by: "Lớp 12A1 Khóa 2005 - 2008", is_approved: true },
  { image_url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80", uploaded_by: "Đoàn Trường THPT Cao Bá Quát", is_approved: true }
];

export default function AdminGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Url Modal State
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [inputAuthor, setInputAuthor] = useState('');

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
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi thư viện?")) return;
    try {
      const { error } = await supabase.from('cbq_gallery').delete().eq('id', id);
      if (error) throw error;
      fetchImages();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  // Upload Photo from File
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `admin-gallery-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('gallery').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
      if (data && data.publicUrl) {
        await supabase.from('cbq_gallery').insert([{
          image_url: data.publicUrl,
          uploaded_by: 'Ban Quản Trị / Ban Tổ Chức',
          is_approved: true
        }]);
        fetchImages();
        alert("Đã tải ảnh lên Thư viện thành công!");
      }
    } catch (err) {
      alert("Lỗi tải ảnh lên: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Add Photo via URL
  const handleAddUrlPhoto = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    try {
      const { error } = await supabase.from('cbq_gallery').insert([{
        image_url: inputUrl.trim(),
        uploaded_by: inputAuthor.trim() || 'Ban Quản Trị',
        is_approved: true
      }]);

      if (error) throw error;
      fetchImages();
      setShowUrlModal(false);
      setInputUrl('');
      setInputAuthor('');
      alert("Đã thêm ảnh từ liên kết thành công!");
    } catch (err) {
      alert("Lỗi thêm ảnh: " + err.message);
    }
  };

  // Seed Default Sample Photos
  const handleSeedSamples = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.from('cbq_gallery').insert(DEFAULT_SAMPLE_PHOTOS);
      if (error) throw error;
      fetchImages();
      alert("Đã nạp 6 ảnh kỷ niệm mẫu 30 năm thành công!");
    } catch (err) {
      alert("Lỗi nạp ảnh mẫu: " + err.message);
      setLoading(false);
    }
  };

  // Sync Approved Photos to Invitation Card (Page 4 Gallery)
  const handleSyncToInvite = async () => {
    try {
      const approvedUrls = images.filter(i => i.is_approved).map(i => i.image_url);
      if (approvedUrls.length === 0) {
        alert("Chưa có bức ảnh nào được duyệt để đồng bộ!");
        return;
      }

      // Fetch current invite config
      const configRes = await supabase.from('cbq_pages').select('*').eq('slug', 'invite-config').single();
      if (configRes.data && configRes.data.content) {
        const parsed = typeof configRes.data.content === 'string' ? JSON.parse(configRes.data.content) : configRes.data.content;
        const newConfig = { ...parsed, gallery_images: approvedUrls };

        await supabase.from('cbq_pages').update({
          content: JSON.stringify(newConfig)
        }).eq('slug', 'invite-config');

        alert(`Đã đồng bộ thành công ${approvedUrls.length} ảnh đã duyệt sang Trang 4 Thiệp Mời Online!`);
      }
    } catch (err) {
      alert("Lỗi đồng bộ thiệp mời: " + err.message);
    }
  };

  return (
    <Layout title="Quản lý Thư viện ảnh">
      {/* HEADER TOOLBAR BUTTONS */}
      <div style={styles.toolbar}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label style={styles.uploadBtn}>
            <Upload size={18} /> {uploading ? '⏳ Đang tải lên...' : '📸 Tải ảnh mới từ máy'}
            <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} />
          </label>

          <button onClick={() => setShowUrlModal(true)} style={styles.urlBtn}>
            <Plus size={18} /> Thêm ảnh từ URL/Link
          </button>

          <button onClick={handleSyncToInvite} style={styles.syncBtn}>
            <RefreshCw size={18} /> Đồng bộ sang Thiệp Mời
          </button>
        </div>

        {images.length === 0 && (
          <button onClick={handleSeedSamples} style={styles.seedBtn}>
            <Sparkles size={18} /> ✨ Nạp 6 Ảnh Kỷ Niệm Mẫu 30 Năm
          </button>
        )}
      </div>

      {/* URL MODAL */}
      {showUrlModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ margin: '0 0 15px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} /> Thêm ảnh từ liên kết
            </h3>
            <form onSubmit={handleAddUrlPhoto}>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Đường dẫn ảnh (URL) *</label>
                <input 
                  type="url" 
                  value={inputUrl} 
                  onChange={(e) => setInputUrl(e.target.value)} 
                  placeholder="https://images.unsplash.com/... hoac link anh Imgur, Facebook" 
                  required 
                  style={styles.input} 
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Tên người / Lớp đóng góp</label>
                <input 
                  type="text" 
                  value={inputAuthor} 
                  onChange={(e) => setInputAuthor(e.target.value)} 
                  placeholder="VD: Cựu học sinh Khóa 2002 - 2005" 
                  style={styles.input} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowUrlModal(false)} style={styles.cancelBtn}>Hủy</button>
                <button type="submit" style={styles.submitBtn}>Thêm Vào Thư Viện</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>⏳ Đang tải thư viện ảnh...</div>
      ) : (
        <div style={styles.grid}>
          {images.map(img => (
            <div key={img.id} className="glass" style={styles.card}>
              <div style={{ position: 'relative' }}>
                <img src={img.image_url} alt="Gallery" style={styles.img} onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&q=80"; }} />
                <span style={{ position: 'absolute', top: '10px', right: '10px', background: img.is_approved ? '#166534' : '#b45309', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  {img.is_approved ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                </span>
              </div>
              <div style={styles.cardBody}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#334155', lineHeight: '1.4' }}>
                  <strong>Người gửi:</strong> {img.uploaded_by || 'Khuyết danh'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                  <button 
                    onClick={() => handleApprove(img.id, !img.is_approved)} 
                    style={styles.approveBtn(img.is_approved)}
                  >
                    {img.is_approved ? 'Ẩn khỏi web' : 'Duyệt hiển thị'}
                  </button>
                  <button onClick={() => handleDelete(img.id)} style={styles.deleteBtn} title="Xóa bức ảnh này">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {images.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📸</div>
              <h3 style={{ color: '#475569', margin: '0 0 8px 0' }}>Chưa có hình ảnh nào trong Thư viện</h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 15px 0' }}>Hãy bấm nút bên dưới để nạp nhanh 6 ảnh mẫu hoặc tải ảnh trực tiếp từ máy của bạn!</p>
              <button onClick={handleSeedSamples} style={styles.seedBtn}>
                <Sparkles size={18} /> ✨ Nạp 6 Ảnh Kỷ Niệm Mẫu 30 Năm
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    background: '#ffffff',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
  },
  uploadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#166534',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13.5px',
    position: 'relative'
  },
  urlBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13.5px'
  },
  syncBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    backgroundColor: '#b45309',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13.5px'
  },
  seedBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#be123c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 4px 10px rgba(190,18,60,0.2)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  img: {
    width: '100%',
    height: '190px',
    objectFit: 'cover',
  },
  cardBody: {
    padding: '1rem',
  },
  approveBtn: (isApproved) => ({
    padding: '7px 14px',
    backgroundColor: isApproved ? '#fff7ed' : '#dcfce7',
    color: isApproved ? '#c2410c' : '#15803d',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12.5px'
  }),
  deleteBtn: {
    padding: '7px 10px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '14px',
    width: '90%',
    maxWidth: '440px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box',
    fontSize: '13.5px'
  },
  cancelBtn: {
    padding: '9px 16px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '9px 18px',
    backgroundColor: '#166534',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
