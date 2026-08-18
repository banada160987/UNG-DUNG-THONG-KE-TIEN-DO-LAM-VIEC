import { useEffect, useState } from 'react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import { Play, Pause, ZoomIn, ZoomOut, RotateCw, Download, X, ChevronLeft, ChevronRight, Upload } from 'lucide-react';

export default function PublicGallery() {
  const [images, setImages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploaderName, setUploaderName] = useState('');

  // LIGHTBOX VIEWER STATE
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  useAutoRefresh(fetchImages, 60000);

  // AUTO PLAY SLIDESHOW
  useEffect(() => {
    let interval = null;
    if (isAutoPlay && lightboxIndex !== null && images.length > 0) {
      interval = setInterval(() => {
        setLightboxIndex(prev => (prev + 1) % images.length);
        setLightboxRotation(0);
        setLightboxScale(1);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlay, lightboxIndex, images]);

  // KEYBOARD NAV
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null || images.length === 0) return;
      if (e.key === 'ArrowRight') {
        setLightboxIndex((lightboxIndex + 1) % images.length);
        setLightboxRotation(0);
        setLightboxScale(1);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
        setLightboxRotation(0);
        setLightboxScale(1);
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
        setIsAutoPlay(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, images]);

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
        <div>
          <h1 style={styles.title}>Thư Viện Ảnh Kỷ Niệm 30 Năm</h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Dấu ấn 30 năm chắp cánh ước mơ THPT Cao Bá Quát (1996 - 2026)</div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {images.length > 0 && (
            <button 
              onClick={() => { setLightboxIndex(0); setIsAutoPlay(true); }} 
              style={{ ...styles.uploadBtn, backgroundColor: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={16} /> Xem Trình Chiếu (Auto-Play)
            </button>
          )}
          <button onClick={() => setShowForm(true)} style={{ ...styles.uploadBtn, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={16} /> Đóng góp ảnh
          </button>
        </div>
      </div>

      {/* SUBMIT PHOTO MODAL */}
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

      {/* GALLERY GRID WITH LIGHTBOX CLICK */}
      <div style={styles.grid}>
        {images.map((img, idx) => (
          <div 
            key={img.id} 
            style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            onClick={() => { setLightboxIndex(idx); setLightboxRotation(0); setLightboxScale(1); }}
            className="gallery-card-item"
          >
            <img src={img.image_url} alt="gallery" style={styles.img} />
            <div style={styles.imgCredit}>Ảnh từ: {img.uploaded_by || 'Ban Quản Trị / Ban Tổ Chức'}</div>
          </div>
        ))}
        {images.length === 0 && <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666'}}>Đang cập nhật hình ảnh...</div>}
      </div>

      {/* DIVERSE LIGHTBOX VIEWER MODAL */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.94)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          padding: '15px', backdropFilter: 'blur(10px)'
        }}>
          {/* LIGHTBOX TOOLBAR */}
          <div style={{
            width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fde047' }}>
                📸 Kỷ Niệm 30 Năm ({lightboxIndex + 1} / {images.length})
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Ảnh từ: {images[lightboxIndex].uploaded_by || 'Ban Quản Trị'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setIsAutoPlay(prev => !prev)} 
                style={{ background: isAutoPlay ? '#be123c' : 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {isAutoPlay ? <Pause size={14} /> : <Play size={14} />} {isAutoPlay ? 'Tạm Dừng' : 'Tự Động Chiếu (3s)'}
              </button>
              <button 
                onClick={() => setLightboxScale(prev => Math.min(prev + 0.3, 2.5))} 
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                title="Phóng to"
              >
                <ZoomIn size={16} />
              </button>
              <button 
                onClick={() => setLightboxScale(prev => Math.max(prev - 0.3, 0.7))} 
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                title="Thu nhỏ"
              >
                <ZoomOut size={16} />
              </button>
              <button 
                onClick={() => setLightboxRotation(prev => (prev + 90) % 360)} 
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                title="Xoay ảnh 90 độ"
              >
                <RotateCw size={16} />
              </button>
              <a 
                href={images[lightboxIndex].image_url} 
                target="_blank" 
                download 
                rel="noreferrer" 
                style={{ background: '#166534', color: 'white', textDecoration: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Download size={14} /> Tải Ảnh HD
              </a>
              <button 
                onClick={() => { setLightboxIndex(null); setIsAutoPlay(false); }} 
                style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={16} /> Đóng
              </button>
            </div>
          </div>

          {/* MAIN IMAGE AREA */}
          <div style={{
            flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', margin: '15px 0'
          }}>
            <button 
              onClick={() => { setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); setLightboxRotation(0); setLightboxScale(1); }}
              style={{
                position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '50%', width: '48px', height: '48px', fontSize: '20px', cursor: 'pointer', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <ChevronLeft size={24} />
            </button>

            <img 
              src={images[lightboxIndex].image_url} 
              alt="Enlarged Memory" 
              style={{
                maxWidth: '85vw', maxHeight: '70vh', objectFit: 'contain',
                borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                transform: `scale(${lightboxScale}) rotate(${lightboxRotation}deg)`,
                transition: 'transform 0.3s ease'
              }}
            />

            <button 
              onClick={() => { setLightboxIndex((lightboxIndex + 1) % images.length); setLightboxRotation(0); setLightboxScale(1); }}
              style={{
                position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '50%', width: '48px', height: '48px', fontSize: '20px', cursor: 'pointer', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div style={{ color: '#cbd5e1', fontSize: '12.5px', textAlign: 'center', fontStyle: 'italic' }}>
            💡 Dùng phím mũi tên ⬅️ ➡️ trên bàn phím để chuyển ảnh • Phím ESC để đóng
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1100px', margin: '30px auto', padding: '30px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '14px', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' },
  title: { color: '#166534', margin: 0, fontSize: '24px' },
  uploadBtn: { backgroundColor: '#166534', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' },
  img: { width: '100%', height: '210px', objectFit: 'cover', borderRadius: '8px', transition: 'transform 0.3s ease' },
  imgCredit: { position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '11.5px', padding: '4px 8px', borderRadius: '6px', backdropFilter: 'blur(4px)' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#333' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' },
  cancelBtn: { padding: '8px 15px', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer' },
  submitBtn: { padding: '8px 15px', border: 'none', backgroundColor: '#166534', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};
