import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, 
  Volume2, VolumeX, List, ZoomIn, Share2, Sparkles, FileText, CheckCircle2, RotateCw
} from 'lucide-react';

const DEFAULT_PAGES = [
  { page_number: 1, title: "Trang Bìa Tập San 30 Năm", image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80" },
  { page_number: 2, title: "Lời Tựa & Thư Chúc Mừng", image_url: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&q=80" },
  { page_number: 3, title: "Lịch Sử 30 Năm Hình Thành", image_url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&q=80" },
  { page_number: 4, title: "Ban Giám Hiệu Qua Các Thời Kỳ", image_url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80" },
  { page_number: 5, title: "Các Tổ Chuyên Môn & Đoàn Đội", image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80" },
  { page_number: 6, title: "Thơ Ca Tri Ân Thầy Cô", image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80" },
  { page_number: 7, title: "Ký Ức Mái Trường (Văn Xuôi)", image_url: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=1200&q=80" },
  { page_number: 8, title: "Thư Viện Ảnh Kỷ Niệm 30 Năm", image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80" },
  { page_number: 9, title: "Cựu Học Sinh Tiêu Biểu", image_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80" },
  { page_number: 10, title: "Lời Cảm Ơn & Bìa Sau", image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80" }
];

const DEFAULT_TOC = [
  { title: "1. Trang Bìa Tập San 30 Năm", page: 1 },
  { title: "2. Lời Tựa & Thư Chúc Mừng Lãnh Đạo", page: 2 },
  { title: "3. Lịch Sử 30 Năm Hình Thành & Phát Triển", page: 3 },
  { title: "4. Ban Giám Hiệu Qua Các Thời Kỳ", page: 4 },
  { title: "5. Các Tổ Chuyên Môn & Đoàn Đội", page: 5 },
  { title: "6. Tuyển Tập Thơ Ca Tri Ân Thầy Cô", page: 6 },
  { title: "7. Ký Ức Mái Trường (Văn Xuôi Sáng Tác)", page: 7 },
  { title: "8. Thư Viện Ảnh Kỷ Niệm 30 Năm", page: 8 },
  { title: "9. Gương Mặt Cựu Học Sinh Tiêu Biểu", page: 9 },
  { title: "10. Lời Cảm Ơn & Bìa Sau", page: 10 }
];

export default function PublicMagazine() {
  const [magazine, setMagazine] = useState(null);
  const [pages, setPages] = useState(DEFAULT_PAGES);
  const [toc, setToc] = useState(DEFAULT_TOC);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [showTocModal, setShowTocModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flipDirection, setFlipDirection] = useState(''); // 'next' | 'prev'
  const [isFlipping, setIsFlipping] = useState(false);

  const containerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchMagazine();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length]);

  async function fetchMagazine() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_magazines')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setMagazine(data);
        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
          setPages(data.pages);
        }
        if (data.toc && Array.isArray(data.toc) && data.toc.length > 0) {
          setToc(data.toc);
        }
      }
    } catch (err) {
      console.warn("Dùng dữ liệu tập san mẫu:", err);
    } finally {
      setLoading(false);
    }
  }

  const playFlipSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2402/2402-preview.mp3');
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const nextPage = () => {
    if (currentPage < pages.length && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection('next');
      playFlipSound();
      setTimeout(() => {
        setCurrentPage(prev => Math.min(prev + 1, pages.length));
        setIsFlipping(false);
      }, 250);
    }
  };

  const prevPage = () => {
    if (currentPage > 1 && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection('prev');
      playFlipSound();
      setTimeout(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
        setIsFlipping(false);
      }, 250);
    }
  };

  const jumpToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= pages.length) {
      setIsFlipping(true);
      playFlipSound();
      setTimeout(() => {
        setCurrentPage(pageNum);
        setIsFlipping(false);
        setShowTocModal(false);
      }, 200);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Đã sao chép liên kết Tập san Kỷ niệm 30 năm vào bộ nhớ tạm!");
  };

  const openZoom = (page) => {
    setZoomImage(page);
    setZoomScale(1);
    setShowZoomModal(true);
  };

  const currentPageData = pages.find(p => p.page_number === currentPage) || pages[0];

  return (
    <div ref={containerRef} style={styles.pageWrapper}>
      <style>{`
        .flip-card-perspective {
          perspective: 1500px;
        }
        .flip-page-inner {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
          transform-style: preserve-3d;
        }
        .flip-next {
          transform: rotateY(-15deg) scale(0.98);
        }
        .flip-prev {
          transform: rotateY(15deg) scale(0.98);
        }
        .toc-item-hover:hover {
          background-color: #fff1f2 !important;
          color: #be123c !important;
          transform: translateX(4px);
        }
      `}</style>

      {/* HEADER CONTROL BAR */}
      <div style={styles.headerBar}>
        <div style={styles.headerLeft}>
          <BookOpen size={24} color="#fde047" />
          <div>
            <h2 style={styles.headerTitle}>
              {magazine?.title || "TẬP SAN KỶ NIỆM 30 NĂM THÀNH LẬP TRƯỜNG THPT CAO BÁ QUÁT"}
            </h2>
            <div style={styles.headerSub}>
              Ấn phẩm đặc biệt (1996 - 2026) • Trang {currentPage} / {pages.length}
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button 
            onClick={() => setShowTocModal(true)} 
            style={styles.controlBtn}
            title="Xem Mục Lục Tập San"
          >
            <List size={18} /> Mục lục
          </button>

          <button 
            onClick={() => openZoom(currentPageData)} 
            style={styles.controlBtn}
            title="Kính lúp phóng to HD"
          >
            <ZoomIn size={18} /> Kính lúp HD
          </button>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            style={styles.iconBtn}
            title={soundEnabled ? "Tắt âm thanh lật trang" : "Bật âm thanh lật trang"}
          >
            {soundEnabled ? <Volume2 size={18} color="#10b981" /> : <VolumeX size={18} color="#94a3b8" />}
          </button>

          <button 
            onClick={handleShare} 
            style={styles.iconBtn}
            title="Chia sẻ liên kết"
          >
            <Share2 size={18} color="#3b82f6" />
          </button>

          {magazine?.pdf_url && (
            <a 
              href={magazine.pdf_url} 
              download 
              target="_blank" 
              rel="noreferrer"
              style={{ ...styles.controlBtn, backgroundColor: '#be123c', color: 'white', border: 'none', textDecoration: 'none' }}
              title="Tải File PDF HD về máy"
            >
              <Download size={18} /> Tải PDF HD
            </a>
          )}

          <button 
            onClick={toggleFullscreen} 
            style={styles.iconBtn}
            title="Mở toàn màn hình"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* MAIN 3D FLIPBOOK CONTAINER */}
      <div style={styles.viewerContainer}>
        {/* PREVIOUS BUTTON */}
        <button 
          onClick={prevPage} 
          disabled={currentPage === 1}
          style={{
            ...styles.navBtn,
            left: '15px',
            opacity: currentPage === 1 ? 0.3 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft size={36} />
        </button>

        {/* FLIPBOOK DISPLAY PAGE CARD */}
        {loading ? (
          <div style={styles.loadingBox}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#be123c' }}>Đang nạp Tập san 3D...</div>
          </div>
        ) : (
          <div className="flip-card-perspective" style={styles.bookFrame}>
            <div 
              className={`flip-page-inner ${isFlipping ? (flipDirection === 'next' ? 'flip-next' : 'flip-prev') : ''}`}
              style={styles.bookPageCard}
            >
              {/* Top Page Bar */}
              <div style={styles.pageCardHeader}>
                <span style={styles.pageCardBadge}>Trang {currentPageData?.page_number || currentPage}</span>
                <span style={styles.pageCardTitle}>{currentPageData?.title || 'Tập san Kỷ niệm'}</span>
                <button 
                  onClick={() => openZoom(currentPageData)} 
                  style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ZoomIn size={14} /> Phóng to HD
                </button>
              </div>

              {/* Page Image */}
              <div style={styles.imageBox} onClick={() => openZoom(currentPageData)}>
                <img 
                  src={currentPageData?.image_url} 
                  alt={currentPageData?.title} 
                  style={styles.pageImg}
                  title="Nhấn để phóng to trang HD"
                />
              </div>

              {/* Page Bottom Bar */}
              <div style={styles.pageCardFooter}>
                <span>THPT CAO BÁ QUÁT • 30 NĂM THÀNH LẬP</span>
                <span>{currentPage} / {pages.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* NEXT BUTTON */}
        <button 
          onClick={nextPage} 
          disabled={currentPage === pages.length}
          style={{
            ...styles.navBtn,
            right: '15px',
            opacity: currentPage === pages.length ? 0.3 : 1,
            cursor: currentPage === pages.length ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronRight size={36} />
        </button>
      </div>

      {/* BOTTOM SLIDER & QUICK JUMP THUMBNAILS */}
      <div style={styles.bottomBar}>
        <div style={styles.sliderWrapper}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Trang 1</span>
          <input 
            type="range" 
            min="1" 
            max={pages.length} 
            value={currentPage} 
            onChange={(e) => jumpToPage(Number(e.target.value))}
            style={styles.rangeInput}
          />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Trang {pages.length}</span>
        </div>

        {/* Quick Page Jump Chips */}
        <div style={styles.chipsRow}>
          {pages.map(p => (
            <button
              key={p.page_number}
              onClick={() => jumpToPage(p.page_number)}
              style={{
                ...styles.chipBtn,
                backgroundColor: currentPage === p.page_number ? '#be123c' : '#ffffff',
                color: currentPage === p.page_number ? '#ffffff' : '#334155',
                borderColor: currentPage === p.page_number ? '#be123c' : '#cbd5e1'
              }}
            >
              {p.page_number}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE OF CONTENTS MODAL */}
      {showTocModal && (
        <div style={styles.modalOverlay} onClick={() => setShowTocModal(false)}>
          <div style={styles.tocModalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#be123c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <List size={20} /> MỤC LỤC TẬP SAN KỶ NIỆM 30 NĂM
              </h3>
              <button onClick={() => setShowTocModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.tocList}>
              {toc.map((item, index) => (
                <div 
                  key={index} 
                  className="toc-item-hover"
                  onClick={() => jumpToPage(item.page)}
                  style={{
                    ...styles.tocItem,
                    backgroundColor: currentPage === item.page ? '#fff1f2' : '#f8fafc',
                    borderColor: currentPage === item.page ? '#fca5a5' : '#e2e8f0'
                  }}
                >
                  <span style={{ fontWeight: 'bold', flex: 1, color: '#1e293b' }}>{item.title}</span>
                  <span style={styles.pageBadge}>Trang {item.page}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <button onClick={() => setShowTocModal(false)} style={styles.secondaryBtn}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ZOOM LIGHTBOX MODAL */}
      {showZoomModal && zoomImage && (
        <div style={styles.modalOverlay} onClick={() => setShowZoomModal(false)}>
          <div style={styles.zoomModalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.zoomHeader}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>🔍 PHÓNG TO HD - TRANG {zoomImage.page_number}: {zoomImage.title}</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 2.5))} style={styles.zoomControlBtn}>+</button>
                <button onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.75))} style={styles.zoomControlBtn}>-</button>
                <button onClick={() => setZoomScale(1)} style={styles.zoomControlBtn}>100%</button>
                <button onClick={() => setShowZoomModal(false)} style={{ ...styles.zoomControlBtn, backgroundColor: '#ef4444' }}>✕</button>
              </div>
            </div>

            <div style={styles.zoomBody}>
              <img 
                src={zoomImage.image_url} 
                alt={zoomImage.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  transform: `scale(${zoomScale})`,
                  transition: 'transform 0.2s ease',
                  cursor: 'grab'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 100px)',
    minHeight: '600px',
    backgroundColor: '#0f172a',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    color: '#f8fafc',
    position: 'relative'
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    flexWrap: 'wrap',
    gap: '10px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: '0.5px'
  },
  headerSub: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  controlBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #475569',
    backgroundColor: '#334155',
    color: '#f1f5f9',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: '0.2s'
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    border: '1px solid #475569',
    backgroundColor: '#334155',
    color: '#cbd5e1',
    cursor: 'pointer'
  },
  viewerContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '20px',
    overflow: 'hidden'
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    color: '#fde047',
    border: '1px solid #475569',
    borderRadius: '50%',
    width: '54px',
    height: '54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
    transition: '0.2s'
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%'
  },
  bookFrame: {
    maxWidth: '750px',
    width: '100%',
    height: '100%',
    maxHeight: '650px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookPageCard: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderRadius: '12px',
    padding: '16px',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
    boxSizing: 'border-box'
  },
  pageCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '10px'
  },
  pageCardBadge: {
    backgroundColor: '#fee2e2',
    color: '#be123c',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  pageCardTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#334155',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '60%'
  },
  imageBox: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    cursor: 'zoom-in',
    borderRadius: '8px',
    backgroundColor: '#f8fafc'
  },
  pageImg: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: '6px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  pageCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #e2e8f0',
    marginTop: '10px',
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 'bold'
  },
  bottomBar: {
    padding: '12px 20px',
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sliderWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center'
  },
  rangeInput: {
    width: '60%',
    accentColor: '#be123c',
    cursor: 'pointer'
  },
  chipsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '4px'
  },
  chipBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '28px',
    textAlign: 'center'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)'
  },
  tocModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '550px',
    width: '100%',
    padding: '20px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    color: '#0f172a'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '2px solid #f1f5f9'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#64748b',
    cursor: 'pointer'
  },
  tocList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '15px',
    maxHeight: '380px',
    overflowY: 'auto'
  },
  tocItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  pageBadge: {
    backgroundColor: '#be123c',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '3px 8px',
    borderRadius: '12px'
  },
  secondaryBtn: {
    padding: '8px 20px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  zoomModalContent: {
    backgroundColor: '#0f172a',
    borderRadius: '16px',
    maxWidth: '900px',
    width: '100%',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  zoomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
    paddingBottom: '10px'
  },
  zoomControlBtn: {
    backgroundColor: '#334155',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  zoomBody: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'auto',
    maxHeight: '80vh',
    padding: '10px'
  }
};
