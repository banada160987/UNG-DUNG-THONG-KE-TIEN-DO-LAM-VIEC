import { useEffect, useRef } from 'react';

/**
 * Hook tự động làm mới dữ liệu thông minh với cơ chế BẢO VỆ CHỐNG QUÁ TẢI (Anti-Overload Protection):
 * 1. Tự động TẠM DỪNG khi người dùng chuyển sang tab khác, ẩn trình duyệt hoặc tắt màn hình điện thoại (document.hidden).
 * 2. Tự động TẠM DỪNG khi người dùng không tương tác trong > 10 phút (Idle Protection).
 * 3. Tự động kích hoạt làm mới 01 lần khi người dùng quay lại tab (nếu đã quá thời gian interval).
 * 4. Bỏ qua yêu cầu khi mất kết nối mạng (navigator.onLine = false).
 * 
 * @param {Function} callback - Hàm tải dữ liệu cần gọi định kỳ.
 * @param {number} interval - Chu kỳ làm mới (mili-giây, mặc định 60.000ms).
 */
export function useAutoRefresh(callback, interval = 60000) {
  const savedCallback = useRef(callback);
  const lastRunRef = useRef(Date.now());
  const isIdleRef = useRef(false);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!interval || interval <= 0) return;

    let timerId = null;
    let idleTimerId = null;
    const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 phút không tương tác -> coi là Idle

    const resetIdleTimer = () => {
      isIdleRef.current = false;
      if (idleTimerId) clearTimeout(idleTimerId);
      idleTimerId = setTimeout(() => {
        isIdleRef.current = true;
      }, IDLE_TIMEOUT_MS);
    };

    // Theo dõi tương tác người dùng để phát hiện Idle
    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleUserActivity = () => {
      const wasIdle = isIdleRef.current;
      resetIdleTimer();
      // Nếu vừa từ trạng thái idle quay lại và đã quá hạn, làm mới ngay 1 lần
      if (wasIdle && Date.now() - lastRunRef.current >= interval) {
        triggerRefresh();
      }
    };

    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });
    resetIdleTimer();

    const triggerRefresh = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return; // Mất mạng -> Bỏ qua
      }
      if (typeof document !== 'undefined' && document.hidden) {
        return; // Đang ở tab nền / tắt màn hình -> Bỏ qua
      }
      if (isIdleRef.current) {
        return; // Người dùng không tương tác -> Bỏ qua
      }

      lastRunRef.current = Date.now();
      if (savedCallback.current) {
        try {
          savedCallback.current();
        } catch (err) {
          console.warn('[useAutoRefresh] Lỗi khi thực thi callback:', err);
        }
      }
    };

    // Bắt đầu chu kỳ hẹn giờ
    timerId = setInterval(triggerRefresh, interval);

    // Lắng nghe khi người dùng chuyển tab quay lại (visibilitychange)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab vừa hiện lên: nếu đã quá chu kỳ thì làm mới ngay 1 lần
        if (Date.now() - lastRunRef.current >= interval) {
          triggerRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerId) clearInterval(timerId);
      if (idleTimerId) clearTimeout(idleTimerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [interval]);
}
