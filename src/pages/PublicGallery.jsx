import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';

export default function PublicGallery() {
  const [images, setImages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploaderName, setUploaderName] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data } = await supabase.from('cbq_gallery').select('*').eq('is_approved', true).order('created_at', { ascending: false });
    if (data) setImages(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newImageUrl) {
      alert('Vui lòng tải lên một hình ảnh.');
      return;
    }
    const { error } = await supabase.from('cbq_gallery').insert([{ image_url: newImageUrl, uploaded_by: uploaderName, is_approved: false }]);
    if (!error) {
      alert('Cảm ơn bạn đã đóng góp! Hình ảnh sẽ được hiển thị sau khi Ban quản trị phê duyệt.');
      setShowForm(false);
      setNewImageUrl('');
      setUploaderName('');
    } else {
      alert('Có lỗi xảy ra, vui lòng thử lại. Đảm bảo bảng cbq_gallery đã được tạo trong Supabase.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Thư viện ảnh</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => setShowForm(true)} style={styles.uploadBtn}>Đóng góp ảnh</button>
        </div>
      </div>

      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={{marginTop: 0, color: '#166534'}}>Đóng góp ảnh kỷ niệm</h2>
            <p style={{fontSize: '14px', color: '#666', marginBottom: '20px'}}>Cảm ơn bạn đã lưu giữ những khoảnh khắc đẹp. Ảnh sẽ được Ban quản trị duyệt trước khi hiển thị công khai.</p>
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <div>
                <label style={styles.label}>Tên người/Tập thể đóng góp *</label>
                <input required type="text" value={uploaderName} onChange={e => setUploaderName(e.target.value)} style={styles.input} placeholder="VD: Lớp 12A1 niên khóa 1996-1999" />
              </div>
              <div>
                <label style={styles.label}>Tải ảnh lên *</label>
                <ImageUpload 
                  currentUrl={newImageUrl} 
                  onUploadSuccess={(url) => setNewImageUrl(url)}
                  onRemove={() => setNewImageUrl('')}
                />
              </div>
              <div style={{display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Hủy</button>
                <button type="submit" style={styles.submitBtn}>Gửi ảnh</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {images.map((img) => (
          <div key={img.id} style={{ position: 'relative' }}>
            <img src={img.image_url} alt="gallery" style={styles.img} />
            <div style={styles.imgCredit}>Ảnh từ: {img.uploaded_by || 'Khuyết danh'}</div>
          </div>
        ))}
        {images.length === 0 && <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#666'}}>Đang cập nhật hình ảnh...</div>}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0, fontSize: '24px' },
  uploadBtn: { backgroundColor: '#166534', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
  img: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' },
  imgCredit: { position: 'absolute', bottom: '5px', left: '5px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '11px', padding: '2px 5px', borderRadius: '3px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#333' },
  input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  cancelBtn: { padding: '8px 15px', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' },
  submitBtn: { padding: '8px 15px', border: 'none', backgroundColor: '#166534', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};
