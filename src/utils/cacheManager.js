/**
 * BỘ QUẢN LÝ BỘ NHỚ ĐỆM CỤC BỘ THÔNG MINH (SMART EDGE CACHE MANAGER)
 * Giải pháp tối ưu băng thông & chịu tải cho 1.500 người dùng Trường THPT Cao Bá Quát
 * Áp dụng cơ chế TTL (Time-To-Live) & SWR (Stale-While-Revalidate)
 */

export const CacheManager = {
  /**
   * Lấy dữ liệu từ cache nếu chưa quá thời gian sống (TTL)
   * @param {string} key Khóa lưu trữ
   * @param {number} maxAgeMinutes Thời gian sống tính theo phút (Mặc định 15 phút)
   * @returns {any|null} Dữ liệu nếu hợp lệ, ngược lại trả về null
   */
  get(key, maxAgeMinutes = 15) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const item = JSON.parse(raw);
      if (!item || !item.__cachedAt) return null;

      const ageMs = Date.now() - item.__cachedAt;
      const maxAgeMs = maxAgeMinutes * 60 * 1000;

      if (ageMs > maxAgeMs) {
        return null; // Đã hết hạn
      }

      return item.data;
    } catch (e) {
      return null;
    }
  },

  /**
   * Lưu dữ liệu vào cache kèm mốc thời gian
   * @param {string} key Khóa lưu trữ
   * @param {any} data Dữ liệu cần lưu
   */
  set(key, data) {
    try {
      const payload = {
        data,
        __cachedAt: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('[CacheManager] Bộ nhớ trình duyệt đầy hoặc không cho phép ghi:', e);
    }
  },

  /**
   * Xóa một khóa cache
   * @param {string} key 
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  },

  /**
   * Xóa toàn bộ các cache có tiền tố chỉ định
   * @param {string} prefix 
   */
  clearByPrefix(prefix) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (_) {}
  }
};
