import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, Box, Play, ChevronLeft, ChevronRight, Eye, Sparkles } from 'lucide-react';

export default function InteractiveProductViewer({ entry }) {
  const [activeTab, setActiveTab] = useState('multi-angle'); // 'multi-angle' | '3d' | 'video'
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);

  // Generate multi-angle image array
  // If entry has extra images or only 1 image, create sample angle views (Front, Right 45°, Top, Back)
  const mainImage = entry.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c';
  
  // Parse multi-angle photos from entry.extra_images or create simulated angle views
  const angleImages = [
    { title: '🔍 Góc Trước (Chính diện)', url: mainImage },
    { title: '📐 Góc Nghiêng 45° (Bên phải)', url: entry.image_url_angle2 || mainImage },
    { title: '🔍 Góc Cận Cảnh Chi Tiết', url: entry.image_url_angle3 || mainImage },
    { title: '📐 Góc Sau & Toàn Cảnh', url: entry.image_url_angle4 || mainImage }
  ];

  // Auto-rotate 360 effect timer
  useEffect(() => {
    let interval = null;
    if (autoRotate) {
      interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % angleImages.length);
      }, 1500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [autoRotate, angleImages.length]);

  return (
    <div style={{ background: '#0f172a', borderRadius: '16px', overflow: 'hidden', color: 'white', position: 'relative' }}>
      
      {/* TOP NAVIGATION BAR FOR VIEW MODES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '10px 16px', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('multi-angle')}
            style={{ padding: '6px 14px', background: activeTab === 'multi-angle' ? '#be123c' : 'rgba(255,255,255,0.08)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Camera size={14} /> Góc Nhìn 360° ({angleImages.length} Góc)
          </button>

          <button 
            onClick={() => setActiveTab('3d')}
            style={{ padding: '6px 14px', background: activeTab === '3d' ? '#b45309' : 'rgba(255,255,255,0.08)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Box size={14} /> Mô Hình 3D
          </button>

          {entry.video_url && (
            <button 
              onClick={() => setActiveTab('video')}
              style={{ padding: '6px 14px', background: activeTab === 'video' ? '#0284c7' : 'rgba(255,255,255,0.08)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={14} /> Video Thuyết Minh
            </button>
          )}
        </div>

        {activeTab === 'multi-angle' && (
          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            style={{ padding: '5px 12px', background: autoRotate ? '#15803d' : 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RefreshCw size={13} className={autoRotate ? 'animate-spin' : ''} /> {autoRotate ? '⏸️ Tắt Tự Động Xoay 360°' : '▶️ Tự Động Xoay 360°'}
          </button>
        )}
      </div>

      {/* VIEWPORT CANVAS CONTAINER */}
      <div style={{ position: 'relative', width: '100%', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', overflow: 'hidden' }}>
        
        {/* MODE 1: MULTI-ANGLE PHOTO 360 SPINNER */}
        {activeTab === 'multi-angle' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <img 
              src={angleImages[currentImageIndex].url} 
              alt={entry.title}
              style={{ maxHeight: '340px', maxWidth: '100%', objectFit: 'contain', transition: 'all 0.3s ease' }} 
            />

            {/* ANGLE TITLE BADGE */}
            <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #334155', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#fde047" /> {angleImages[currentImageIndex].title}
            </div>

            {/* PREV / NEXT ARROWS */}
            <button 
              onClick={() => setCurrentImageIndex(prev => (prev === 0 ? angleImages.length - 1 : prev - 1))}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={22} />
            </button>
            <button 
              onClick={() => setCurrentImageIndex(prev => (prev + 1) % angleImages.length)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              <ChevronRight size={22} />
            </button>
          </div>
        )}

        {/* MODE 2: INTERACTIVE 3D MODEL VIEWER */}
        {activeTab === '3d' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
            {entry.model_3d_url ? (
              <iframe 
                src={entry.model_3d_url} 
                title="Mô Hình 3D" 
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
                allow="autoplay; fullscreen; vr"
              />
            ) : (
              <div style={{ background: '#1e293b', border: '1px dashed #475569', borderRadius: '16px', padding: '30px 20px', maxWidth: '450px' }}>
                <Box size={48} color="#f59e0b" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#f8fafc' }}>🧊 KHÔNG GIAN TRIỂN LÃM MÔ HÌNH 3D</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                  Bạn đang xem mô hình tác phẩm ở chế độ Đa Góc Độ 360°. Nhấn nút <strong>[Góc Nhìn 360°]</strong> phía trên để xoay chi tiết các góc mặt trước, mặt sau và cận cảnh!
                </p>
              </div>
            )}
          </div>
        )}

        {/* MODE 3: VIDEO SHOWCASE */}
        {activeTab === 'video' && (
          <div style={{ width: '100%', height: '100%' }}>
            {entry.video_url?.includes('youtube') || entry.video_url?.includes('youtu.be') ? (
              <iframe 
                src={entry.video_url.replace('watch?v=', 'embed/')} 
                title="Video Thuyết Minh" 
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            ) : (
              <video controls src={entry.video_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>
        )}

      </div>

      {/* THUMBNAIL STRIP AT BOTTOM */}
      {activeTab === 'multi-angle' && (
        <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: '#0f172a', overflowX: 'auto', borderTop: '1px solid #1e293b' }}>
          {angleImages.map((img, idx) => (
            <div 
              key={idx}
              onClick={() => { setCurrentImageIndex(idx); setAutoRotate(false); }}
              style={{
                cursor: 'pointer',
                border: currentImageIndex === idx ? '2px solid #be123c' : '2px solid transparent',
                borderRadius: '8px',
                overflow: 'hidden',
                opacity: currentImageIndex === idx ? 1 : 0.6,
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <img src={img.url} alt="" style={{ width: '60px', height: '45px', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
