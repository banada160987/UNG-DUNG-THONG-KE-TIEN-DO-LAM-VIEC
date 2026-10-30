import { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share2, Sparkles } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem ứng dụng đã đang chạy ở chế độ Standalone (đã cài đặt) chưa
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Nhận diện thiết bị iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = userAgent.includes('safari') && !userAgent.includes('crios') && !userAgent.includes('fxios');
    if (isIosDevice && isSafari) {
      setIsIOS(true);
    }

    // 3. Kiểm tra xem người dùng có vừa bấm tắt thông báo trong 24h qua không
    const dismissedAt = localStorage.getItem('cbq_pwa_dismissed_at');
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return; // Đã tắt trong vòng 24h, không làm phiền
      }
    }

    // 4. Lắng nghe sự kiện trước khi cài đặt của trình duyệt (Android Chrome, Cốc Cốc, Edge...)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Đợi 2.5 giây sau khi vào trang để người dùng không bị ngợp
      setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Lắng nghe khi người dùng đã cài đặt thành công
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('🎉 Ứng dụng THPT Cao Bá Quát đã được cài đặt thành công trên thiết bị!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert("Để cài đặt ứng dụng: Hãy nhấn vào biểu tượng 3 dấu chấm (⋮) ở góc trên bên phải trình duyệt Chrome/Cốc Cốc trên điện thoại, sau đó chọn 'Cài đặt ứng dụng' hoặc 'Thêm vào màn hình chính'.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Người dùng đã đồng ý cài đặt PWA!');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('cbq_pwa_dismissed_at', Date.now().toString());
  };

  if (isInstalled || (!showPrompt && !showIOSGuide)) {
    return null;
  }

  return (
    <>
      {/* 1. HỘP THÔNG BÁO CÀI ĐẶT NỔI Ở ĐÁY MÀN HÌNH */}
      {showPrompt && (
        <div style={styles.floatingContainer} className="animate-fade-in">
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={styles.appInfo}>
                <img 
                  src="/pwa-192x192.png" 
                  alt="Logo THPT Cao Bá Quát" 
                  style={styles.appIcon} 
                />
                <div>
                  <div style={styles.titleRow}>
                    <span style={styles.appName}>THPT Cao Bá Quát</span>
                    <span style={styles.badge}><Sparkles size={11} /> Ứng Dụng</span>
                  </div>
                  <div style={styles.appDesc}>
                    Cài đặt vào điện thoại để mở nhanh, toàn màn hình như ứng dụng tải từ CH Play!
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleDismiss} 
                style={styles.closeBtn}
                title="Bỏ qua"
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.actionRow}>
              <button 
                type="button" 
                onClick={handleDismiss} 
                style={styles.btnLater}
              >
                Để sau
              </button>
              <button 
                type="button" 
                onClick={handleInstallClick} 
                style={styles.btnInstall}
              >
                <Download size={15} /> Cài Đặt Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. HƯỚNG DẪN DÀNH RIÊNG CHO IPHONE / IPAD (SAFARI) */}
      {showIOSGuide && (
        <div style={styles.modalOverlay} onClick={() => setShowIOSGuide(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 'bold', fontSize: '15px' }}>
                <Smartphone size={20} /> Cài Đặt Trên iPhone / iPad
              </div>
              <button type="button" onClick={() => setShowIOSGuide(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', lineHeight: '1.5' }}>
              Trình duyệt Safari trên iOS hỗ trợ cài đặt trực tiếp màn hình chính chỉ với 2 bước đơn giản:
            </p>

            <div style={styles.iosStep}>
              <span style={styles.stepNum}>1</span>
              <div>
                Nhấn vào nút <strong>Chia sẻ (Share <Share2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />)</strong> ở thanh công cụ dưới cùng màn hình Safari.
              </div>
            </div>

            <div style={styles.iosStep}>
              <span style={styles.stepNum}>2</span>
              <div>
                Cuộn xuống và chọn mục <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>, sau đó nhấn <strong>"Thêm" (Add)</strong>.
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => setShowIOSGuide(false)} 
                style={{ ...styles.btnInstall, width: '100%', justifyContent: 'center' }}
              >
                <CheckCircle size={15} /> Tôi Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  floatingContainer: {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    right: '16px',
    maxWidth: '440px',
    margin: '0 auto',
    zIndex: 99999,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '14px 16px',
    boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(190, 18, 60, 0.15)',
    border: '1.5px solid #fecdd3',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  appInfo: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  appName: {
    fontWeight: '800',
    fontSize: '14px',
    color: '#0f172a',
  },
  badge: {
    fontSize: '10.5px',
    fontWeight: '700',
    backgroundColor: '#ffe4e6',
    color: '#be123c',
    padding: '2px 6px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  appDesc: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
    lineHeight: '1.35',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid #f1f5f9',
  },
  btnLater: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnInstall: {
    padding: '7px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#be123c',
    color: '#ffffff',
    fontSize: '12.5px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(190, 18, 60, 0.3)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '380px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
  },
  iosStep: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: '10px 12px',
    borderRadius: '10px',
    marginBottom: '8px',
    fontSize: '12.5px',
    color: '#334155',
    lineHeight: '1.4',
  },
  stepNum: {
    backgroundColor: '#be123c',
    color: '#ffffff',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '11px',
    flexShrink: 0,
  }
};
