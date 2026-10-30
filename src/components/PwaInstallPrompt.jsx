import { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share2, Sparkles, MoreVertical, ExternalLink, HelpCircle } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem ứng dụng đã chạy ở chế độ Standalone (đã cài đặt) chưa
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Nhận diện loại thiết bị
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobileDevice = isIosDevice || isAndroidDevice || window.innerWidth <= 840;
    
    // Nhận diện trình duyệt trong app (Zalo, Facebook, Messenger...)
    const inApp = userAgent.includes('zalo') || userAgent.includes('fbav') || userAgent.includes('fban') || userAgent.includes('messenger');
    setIsInAppBrowser(inApp);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 3. Kiểm tra xem người dùng có vừa bấm tắt thông báo trong 12h qua không
    const dismissedAt = localStorage.getItem('cbq_pwa_dismissed_at');
    let isDismissedRecently = false;
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 12) {
        isDismissedRecently = true;
      }
    }

    // 4. Lắng nghe sự kiện trước khi cài đặt của trình duyệt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissedRecently) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Nếu là thiết bị di động và chưa cài đặt, tự động hiển thị sau 1.5 giây
    // (Đảm bảo ngay cả khi Chrome chưa kịp phát beforeinstallprompt thì người dùng vẫn nhìn thấy nút cài đặt)
    let timer;
    if (isMobileDevice && !isDismissedRecently) {
      timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
    }

    // 6. Lắng nghe sự kiện mở thủ công từ các nút bấm trên trang (Menu, Footer, Bottom Nav...)
    const handleManualOpen = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        setShowGuideModal(true);
      }
    };
    window.addEventListener('cbq-open-pwa-install', handleManualOpen);

    // 7. Lắng nghe khi cài đặt thành công
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setShowGuideModal(false);
      setDeferredPrompt(null);
      console.log('🎉 Ứng dụng THPT Cao Bá Quát đã được cài đặt thành công!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('cbq-open-pwa-install', handleManualOpen);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    // Nếu có sự kiện cài đặt tự động từ trình duyệt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
      return;
    }

    // Nếu không có sự kiện tự động (hoặc trên iOS / Zalo), hiển thị hướng dẫn chi tiết
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowGuideModal(false);
    localStorage.setItem('cbq_pwa_dismissed_at', Date.now().toString());
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* 1. THANH THÔNG BÁO NỔI DƯỚI ĐÁY MÀN HÌNH */}
      {showPrompt && !showGuideModal && (
        <div style={styles.floatingContainer} className="animate-fade-in">
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={styles.appInfo}>
                <img 
                  src="/pwa-192x192.png" 
                  alt="Logo THPT Cao Bá Quát" 
                  style={styles.appIcon} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.titleRow}>
                    <span style={styles.appName}>THPT Cao Bá Quát</span>
                    <span style={styles.badge}><Sparkles size={10} /> Ứng Dụng</span>
                  </div>
                  <div style={styles.appDesc}>
                    Cài đặt ứng dụng vào điện thoại để truy cập toàn màn hình 1 chạm!
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
                <Download size={14} /> Cài Đặt Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. POPUP HƯỚNG DẪN CÀI ĐẶT CHI TIẾT (CHO CẢ ANDROID, IPHONE & ZALO) */}
      {showGuideModal && (
        <div style={styles.modalOverlay} onClick={() => setShowGuideModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 'bold', fontSize: '15px' }}>
                <Smartphone size={20} /> Cài Đặt Ứng Dụng THPT Cao Bá Quát
              </div>
              <button type="button" onClick={() => setShowGuideModal(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Cảnh báo nếu mở trong Zalo / Messenger */}
            {isInAppBrowser && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px', fontSize: '12.5px', color: '#92400e' }}>
                <strong>⚠️ Bạn đang mở link trong Zalo / Facebook:</strong>
                <div style={{ marginTop: '4px', lineHeight: 1.4 }}>
                  Hãy bấm vào biểu tượng <strong>(...)</strong> ở góc trên bên phải màn hình $\rightarrow$ Chọn <strong>"Mở bằng trình duyệt" (Chrome / Safari)</strong> để cài đặt app nhé!
                </div>
              </div>
            )}

            {/* Hướng dẫn Android */}
            {(!isIOS || isAndroid) && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🤖 Dành cho điện thoại Android (Chrome / Cốc Cốc):</span>
                </div>

                <div style={styles.stepBox}>
                  <div style={styles.stepNum}>1</div>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                    Nhấn vào biểu tượng <strong>3 dấu chấm ( <MoreVertical size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> )</strong> ở góc trên bên phải màn hình trình duyệt.
                  </div>
                </div>

                <div style={styles.stepBox}>
                  <div style={styles.stepNum}>2</div>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                    Cuộn xuống và nhấn chọn dòng <strong>"Cài đặt ứng dụng"</strong> (hoặc <strong>"Thêm vào Màn hình chính"</strong>).
                  </div>
                </div>

                <div style={styles.stepBox}>
                  <div style={styles.stepNum}>3</div>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                    Xác nhận <strong>"Cài đặt"</strong>. Biểu tượng ứng dụng trường sẽ xuất hiện ngay trên màn hình điện thoại!
                  </div>
                </div>
              </div>
            )}

            {/* Hướng dẫn iOS */}
            {isIOS && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🍎 Dành cho iPhone / iPad (Safari):</span>
                </div>

                <div style={styles.stepBox}>
                  <div style={styles.stepNum}>1</div>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                    Nhấn vào biểu tượng <strong>Chia sẻ ( <Share2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> )</strong> ở thanh công cụ dưới đáy màn hình Safari.
                  </div>
                </div>

                <div style={styles.stepBox}>
                  <div style={styles.stepNum}>2</div>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                    Cuộn xuống chọn dòng <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> $\rightarrow$ Nhấn <strong>"Thêm"</strong>.
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowGuideModal(false)} 
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
    bottom: '76px', // Nằm phía trên mobile bottom nav một chút để không che menu
    left: '12px',
    right: '12px',
    maxWidth: '420px',
    margin: '0 auto',
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '12px 14px',
    boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(190, 18, 60, 0.15)',
    border: '1.5px solid #fecdd3',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  appInfo: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  appIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  appName: {
    fontWeight: '800',
    fontSize: '13.5px',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: '#ffe4e6',
    color: '#be123c',
    padding: '1px 5px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  appDesc: {
    fontSize: '11.5px',
    color: '#64748b',
    marginTop: '2px',
    lineHeight: '1.3',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '3px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #f1f5f9',
  },
  btnLater: {
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnInstall: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#be123c',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(190, 18, 60, 0.3)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    padding: '16px',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '18px 20px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
  },
  stepBox: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: '9px 12px',
    borderRadius: '10px',
    marginBottom: '8px',
    border: '1px solid #e2e8f0',
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
    marginTop: '1px',
  }
};
