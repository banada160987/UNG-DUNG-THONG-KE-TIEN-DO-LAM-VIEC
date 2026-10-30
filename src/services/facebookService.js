/**
 * Dịch Vụ Kết Nối & Tương Tác Mạng Xã Hội Facebook / Zalo OA
 * Trường THPT Cao Bá Quát - Quốc Oai, Hà Nội
 */

const STORAGE_KEY_SOCIAL_CONFIG = 'cbq_social_integration_config_v1';

// Cấu hình mạng xã hội mặc định của trường
const DEFAULT_SOCIAL_CONFIG = {
  schoolName: 'Trường THPT Cao Bá Quát - Quốc Oai',
  facebookFanpageUrl: 'https://www.facebook.com/thptcaobaquatquocoi',
  facebookMessengerUrl: 'https://m.me/thptcaobaquatquocoi',
  facebookPageId: '100063712891234',
  zaloOaUrl: 'https://zalo.me/thptcaobaquat',
  zaloOaId: 'cbq_official_oa_2026',
  hotline: '024.3384.xxxx',
  email: 'c3caobaquat@hanoiedu.vn',
  showFloatingMessenger: true,
  showFloatingZalo: true
};

export function getSocialConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOCIAL_CONFIG);
    if (raw) {
      return { ...DEFAULT_SOCIAL_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_SOCIAL_CONFIG;
}

export function saveSocialConfig(newConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_SOCIAL_CONFIG, JSON.stringify(newConfig));
  } catch (e) {}
}

/**
 * Sinh đường link chia sẻ bài viết lên Facebook
 */
export function generateFacebookShareUrl(url, title) {
  const targetUrl = encodeURIComponent(url || window.location.href);
  return `https://www.facebook.com/sharer/sharer.php?u=${targetUrl}&quote=${encodeURIComponent(title || '')}`;
}

/**
 * Mở cửa sổ chat Messenger trực tiếp với Fanpage Trường
 */
export function openFacebookMessenger() {
  const config = getSocialConfig();
  window.open(config.facebookMessengerUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Mở trang Zalo OA của trường
 */
export function openZaloOa() {
  const config = getSocialConfig();
  window.open(config.zaloOaUrl, '_blank', 'noopener,noreferrer');
}
