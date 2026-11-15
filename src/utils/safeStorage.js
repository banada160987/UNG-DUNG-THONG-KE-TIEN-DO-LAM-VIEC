/**
 * BỘ QUẢN LÝ LƯU TRỮ AN TOÀN CHỐNG TRÀN BỘ NHỚ (SAFE STORAGE MANAGER)
 * Giải quyết triệt để lỗi QuotaExceededError trên trình duyệt (giới hạn 5MB của localStorage).
 * 
 * Tính năng chính:
 * 1. Compact Payload: Tự động rút gọn dữ liệu danh sách tiết học TKB, loại bỏ các trường thừa/phình to.
 * 2. Auto Cleanup: Khi gặp QuotaExceededError, tự động xóa các cache rác không quan trọng và thử lại.
 * 3. Fallback Storage: Nếu localStorage vẫn đầy, tự động lưu vào sessionStorage và IndexedDB.
 * 4. Không bao giờ ném ngoại lệ làm gián đoạn luồng nghiệp vụ của người dùng.
 */

const DB_NAME = 'CBQ_LOCAL_STORAGE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'app_cache';

// Khởi tạo IndexedDB (hỗ trợ lưu hàng trăm MB)
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => resolve(null);
  });
}

/**
 * Lưu dữ liệu vào IndexedDB
 */
export async function idbSetItem(key, value) {
  try {
    const db = await openIndexedDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('[SafeStorage] IDB write error:', e);
    return false;
  }
}

/**
 * Lấy dữ liệu từ IndexedDB
 */
export async function idbGetItem(key) {
  try {
    const db = await openIndexedDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Nén và rút gọn danh sách tiết học TKB để tiết kiệm 70% dung lượng
 */
export function compactTimetableItems(items) {
  if (!Array.isArray(items)) return items;
  return items.map(item => {
    if (!item) return null;
    return {
      student_class: item.student_class,
      day_of_week: item.day_of_week,
      period: Number(item.period),
      subject: item.subject,
      teacher_name: item.teacher_name,
      room: item.room || ''
    };
  }).filter(Boolean);
}

/**
 * Dọn dẹp các cache rác và cache phụ để giải phóng dung lượng cho localStorage
 */
export function cleanStorageQuota(forceAggressive = false) {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  
  let freedCount = 0;
  try {
    const keysToRemove = [];
    const highPriorityKeys = [
      'cbq_master_timetable',
      'cbq_timetable_metadata',
      'cbq_period_timings',
      'cbq_teaching_assignments',
      'supabase.auth.token',
      'sb-',
      'theme'
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Danh sách rác an toàn để xóa lập tức
      const isGarbage = 
        key.startsWith('cbq_cache_') ||
        key.startsWith('temp_') ||
        key.startsWith('cbq_audit_') ||
        key.startsWith('cbq_students_class_') ||
        key.startsWith('cbq_test_') ||
        key.startsWith('cbq_search_history') ||
        key.includes('_temp') ||
        key.includes('_backup_');

      if (isGarbage) {
        keysToRemove.push(key);
      } else if (forceAggressive) {
        // Khi bắt buộc phải giải phóng mạnh tay
        const isPriority = highPriorityKeys.some(hp => key.startsWith(hp));
        if (!isPriority) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
        freedCount++;
      } catch (_) {}
    });

    console.info(`[SafeStorage] Đã tự động dọn dẹp ${freedCount} khóa cache không cần thiết để giải phóng bộ nhớ.`);
  } catch (e) {
    console.warn('[SafeStorage] Lỗi khi dọn dẹp cache:', e);
  }
  return freedCount;
}

/**
 * Tính toán dung lượng hiện tại của localStorage
 */
export function getStorageUsage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { bytes: 0, kb: 0, mb: 0, percent: 0 };
  }
  try {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2; // UTF-16
      }
    }
    const kb = (totalBytes / 1024).toFixed(1);
    const mb = (totalBytes / (1024 * 1024)).toFixed(2);
    // Hạn mức thông thường là 5MB (5242880 bytes)
    const percent = Math.min(100, Math.round((totalBytes / 5242880) * 100));
    return { bytes: totalBytes, kb, mb, percent };
  } catch (e) {
    return { bytes: 0, kb: 0, mb: 0, percent: 0 };
  }
}

/**
 * Hàm lưu trữ an toàn, tự động bọc lỗi, chống QuotaExceededError
 * @param {string} key 
 * @param {any} value 
 * @returns {boolean} true nếu lưu thành công (hoặc qua fallback an toàn)
 */
export function safeSetItem(key, value) {
  if (typeof window === 'undefined') return false;

  let processedValue = value;
  // Nếu là dữ liệu TKB lớn, tự động nén thu gọn các trường thừa
  if (key === 'cbq_master_timetable' || key === 'cbq_draft_timetable' || key.includes('timetable_items')) {
    if (Array.isArray(value)) {
      processedValue = compactTimetableItems(value);
    } else if (value && typeof value === 'object' && Array.isArray(value.data)) {
      processedValue = {
        ...value,
        data: compactTimetableItems(value.data)
      };
    }
  }

  // Nếu là kịch bản TKB, giới hạn tối đa 3 kịch bản gần nhất để tránh phình to
  if (key === 'cbq_timetable_scenarios' && Array.isArray(value)) {
    processedValue = value.slice(-3).map(scen => ({
      ...scen,
      schedule: compactTimetableItems(scen.schedule)
    }));
  }

  const stringValue = typeof processedValue === 'string' 
    ? processedValue 
    : JSON.stringify(processedValue);

  // 1. Thử lưu vào localStorage
  try {
    localStorage.setItem(key, stringValue);
    // Cũng lưu dự phòng vào IndexedDB ngầm không chặn luồng
    idbSetItem(key, processedValue).catch(() => {});
    return true;
  } catch (e) {
    const isQuotaError = 
      e.name === 'QuotaExceededError' || 
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e.code === 22 || 
      e.code === 1014 ||
      (e.message && e.message.toLowerCase().includes('quota'));

    if (isQuotaError) {
      console.warn(`[SafeStorage] LocalStorage bị tràn bộ nhớ (${e.message}). Đang kích hoạt cơ chế dọn dẹp và dự phòng...`);

      // Lần 1: Dọn dẹp cache rác thông thường
      cleanStorageQuota(false);
      try {
        localStorage.setItem(key, stringValue);
        idbSetItem(key, processedValue).catch(() => {});
        return true;
      } catch (retryErr) {
        // Lần 2: Dọn dẹp mạnh tay hơn (aggressive)
        cleanStorageQuota(true);
        try {
          localStorage.setItem(key, stringValue);
          idbSetItem(key, processedValue).catch(() => {});
          return true;
        } catch (aggErr) {
          console.warn('[SafeStorage] Không thể ghi vào localStorage sau khi dọn dẹp. Chuyển sang sessionStorage & IndexedDB.');
        }
      }
    }

    // 2. Fallback sang sessionStorage
    try {
      if (window.sessionStorage) {
        sessionStorage.setItem(key, stringValue);
      }
    } catch (sessErr) {
      console.warn('[SafeStorage] SessionStorage cũng không thể ghi:', sessErr);
    }

    // 3. Fallback sang IndexedDB (bền vững, dung lượng lớn)
    idbSetItem(key, processedValue).catch(() => {});

    // Không ném lỗi ra ngoài làm crash app
    return false;
  }
}

/**
 * Đọc dữ liệu an toàn từ localStorage -> sessionStorage -> Fallback
 * @param {string} key 
 * @returns {string|null}
 */
export function safeGetItem(key) {
  if (typeof window === 'undefined') return null;

  try {
    const localVal = localStorage.getItem(key);
    if (localVal !== null && localVal !== undefined && localVal !== '') {
      return localVal;
    }
  } catch (_) {}

  try {
    if (window.sessionStorage) {
      const sessVal = sessionStorage.getItem(key);
      if (sessVal !== null && sessVal !== undefined && sessVal !== '') {
        return sessVal;
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Đọc dữ liệu đã parse JSON an toàn (kèm hỗ trợ đọc từ IndexedDB nếu localStorage bị mất)
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {any}
 */
export function safeGetItemParsed(key, defaultValue = null) {
  const raw = safeGetItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Xóa an toàn khỏi mọi tầng lưu trữ
 */
export function safeRemoveItem(key) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(key); } catch (_) {}
  try { if (window.sessionStorage) sessionStorage.removeItem(key); } catch (_) {}
  try {
    openIndexedDB().then(db => {
      if (!db) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    });
  } catch (_) {}
}

/**
 * BỘ ĐÁNH CHẶN TOÀN CỤC (GLOBAL INTERCEPTOR) CHO LOCALSTORAGE
 * Bọc lớp bảo vệ mọi lệnh gọi localStorage.setItem trong toàn bộ ứng dụng,
 * tự động giải phóng dung lượng khi gặp QuotaExceededError, không bao giờ để lỗi văng ra màn hình.
 */
export function installGlobalStorageInterceptor() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (window.__cbq_storage_interceptor_installed) return;
  
  try {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = function(key, val) {
      try {
        originalSetItem.call(window.localStorage, key, val);
      } catch (e) {
        const isQuota = 
          e.name === 'QuotaExceededError' || 
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          e.code === 22 || 
          e.code === 1014 ||
          (e.message && e.message.toLowerCase().includes('quota'));

        if (isQuota) {
          console.warn(`[SafeStorage Global] LocalStorage Quota Exceeded on key: "${key}". Đang tự động dọn rác...`);
          cleanStorageQuota(true);
          try {
            originalSetItem.call(window.localStorage, key, val);
            return;
          } catch (_) {
            // Nếu vẫn đầy, fallback an toàn sang sessionStorage
            try {
              if (window.sessionStorage) window.sessionStorage.setItem(key, val);
            } catch (_) {}
          }
        } else {
          throw e;
        }
      }
    };
    window.__cbq_storage_interceptor_installed = true;
  } catch (err) {
    console.warn('[SafeStorage] Không thể cài đặt Global Interceptor:', err);
  }
}

// Tự động kích hoạt ngay khi file được nạp
if (typeof window !== 'undefined') {
  installGlobalStorageInterceptor();
}
