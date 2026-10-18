/**
 * DỊCH VỤ QUẢN LÝ & ĐỒNG BỘ VIDEO HỌC LIỆU SỐ (EDUHUB 4.0)
 * Hỗ trợ đồng bộ đa nền tảng giữa Supabase Cloud DB và Local Storage Cache
 * Dành cho Admin, Giáo viên và Học sinh Trường THPT Cao Bá Quát
 */

import { supabase, DualSupabaseService } from '../lib/supabase';
import { EDU_VIDEOS } from '../data/eduVideoHubData';

const LOCAL_STORAGE_KEY = 'cbq_custom_edu_videos';

/**
 * Trích xuất YouTube ID từ mọi định dạng link
 */
export function extractYouTubeId(url) {
  if (!url) return '';
  const trimmed = url.trim();
  // Nếu đã là 11 ký tự thuần ID
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : '';
}

/**
 * Lấy danh sách toàn bộ video (kết hợp mặc định + database cloud + custom local)
 */
export async function getEduVideos() {
  let cloudVideos = [];
  try {
    const { data, error } = await supabase
      .from('cbq_edu_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      cloudVideos = data.map(item => ({
        ...item,
        keyTakeaways: Array.isArray(item.key_takeaways) ? item.key_takeaways : (item.keyTakeaways || []),
        recommendedNotes: Array.isArray(item.recommended_notes) ? item.recommended_notes : (item.recommendedNotes || []),
        youtubeId: item.youtube_id || item.youtubeId,
        embedUrl: item.embed_url || item.embedUrl || `https://www.youtube.com/embed/${item.youtube_id || item.youtubeId}`,
        targetAudience: item.target_audience || item.targetAudience || 'all'
      }));
    }
  } catch (err) {
    console.warn('[EduVideoService] Không thể kết nối Cloud DB, dùng bộ nhớ cục bộ:', err);
  }

  // Lấy video thêm từ localStorage
  let localCustom = [];
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      localCustom = JSON.parse(cached);
    }
  } catch (e) {
    console.error('Lỗi đọc local storage custom videos:', e);
  }

  // Kết hợp và lọc trùng lặp theo ID
  const map = new Map();

  // 1. Thêm video custom cloud trước (ưu tiên cao nhất)
  cloudVideos.forEach(v => map.set(v.id || v.youtubeId, v));

  // 2. Thêm video local custom
  localCustom.forEach(v => {
    if (!map.has(v.id) && !map.has(v.youtubeId)) {
      map.set(v.id, v);
    }
  });

  // 3. Thêm video mặc định của trường
  EDU_VIDEOS.forEach(v => {
    if (!map.has(v.id) && !map.has(v.youtubeId)) {
      map.set(v.id, v);
    }
  });

  return Array.from(map.values());
}

/**
 * Thêm mới một bài giảng / video số
 */
export async function createEduVideo(payload, authorInfo = {}) {
  const youtubeId = extractYouTubeId(payload.url || payload.youtubeId);
  if (!youtubeId) {
    throw new Error('Đường link YouTube không hợp lệ. Vui lòng kiểm tra lại!');
  }

  const newId = 'vid_' + Date.now();
  const videoObj = {
    id: newId,
    youtubeId,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    title: (payload.title || 'Bài giảng học liệu').trim(),
    channel: (payload.channel || authorInfo.name || 'Ban Chuyên Môn THPT Cao Bá Quát').trim(),
    category: payload.category || 'exam_prep',
    targetAudience: payload.targetAudience || 'all',
    grade: payload.grade || 'Toàn trường',
    duration: payload.duration || 'Tự chọn',
    views: '1 lượt xem',
    thumbnail: payload.thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    description: (payload.description || 'Học liệu video số hóa hỗ trợ học tập và bồi dưỡng chuyên môn.').trim(),
    keyTakeaways: Array.isArray(payload.keyTakeaways) && payload.keyTakeaways.length > 0 
      ? payload.keyTakeaways 
      : ['Theo dõi kỹ các ví dụ minh họa và ghi chú các nội dung trọng tâm.'],
    recommendedNotes: Array.isArray(payload.recommendedNotes) ? payload.recommendedNotes : [],
    created_by: authorInfo.name || authorInfo.username || 'Giáo viên',
    created_at: new Date().toISOString()
  };

  // 1. Lưu vào Supabase Cloud (nếu bảng có sẵn)
  try {
    const dbPayload = {
      id: videoObj.id,
      youtube_id: videoObj.youtubeId,
      embed_url: videoObj.embedUrl,
      title: videoObj.title,
      channel: videoObj.channel,
      category: videoObj.category,
      target_audience: videoObj.targetAudience,
      grade: videoObj.grade,
      duration: videoObj.duration,
      views: videoObj.views,
      thumbnail: videoObj.thumbnail,
      description: videoObj.description,
      key_takeaways: videoObj.keyTakeaways,
      recommended_notes: videoObj.recommendedNotes,
      created_by: videoObj.created_by,
      created_at: videoObj.created_at
    };
    const { error } = await supabase.from('cbq_edu_videos').insert([dbPayload]);
    if (error) {
      console.warn('[EduVideoService] Supabase insert warning (fallback local):', error.message);
    }
  } catch (err) {
    console.warn('[EduVideoService] Cloud insert error:', err);
  }

  // 2. Luôn đồng bộ vào LocalStorage để xem được ngay lập tức
  try {
    const localCustom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const updated = [videoObj, ...localCustom];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Lỗi ghi local storage:', err);
  }

  return videoObj;
}

/**
 * Cập nhật thông tin video
 */
export async function updateEduVideo(id, payload) {
  let youtubeId = payload.youtubeId;
  if (payload.url) {
    const extracted = extractYouTubeId(payload.url);
    if (extracted) youtubeId = extracted;
  }

  const updatedObj = {
    ...payload,
    youtubeId,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    thumbnail: payload.thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    updated_at: new Date().toISOString()
  };

  // 1. Update Supabase
  try {
    const dbPayload = {
      youtube_id: updatedObj.youtubeId,
      embed_url: updatedObj.embedUrl,
      title: updatedObj.title,
      channel: updatedObj.channel,
      category: updatedObj.category,
      target_audience: updatedObj.targetAudience,
      grade: updatedObj.grade,
      duration: updatedObj.duration,
      description: updatedObj.description,
      key_takeaways: updatedObj.keyTakeaways
    };
    await supabase.from('cbq_edu_videos').update(dbPayload).eq('id', id);
  } catch (e) {
    console.warn('Supabase update warning:', e);
  }

  // 2. Update LocalStorage
  try {
    const localCustom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const index = localCustom.findIndex(v => v.id === id);
    if (index !== -1) {
      localCustom[index] = { ...localCustom[index], ...updatedObj };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localCustom));
    }
  } catch (e) {
    console.error('Local storage update error:', e);
  }

  return updatedObj;
}

/**
 * Xóa video
 */
export async function deleteEduVideo(id) {
  // 1. Delete from Cloud
  try {
    await supabase.from('cbq_edu_videos').delete().eq('id', id);
  } catch (e) {
    console.warn('Cloud delete warning:', e);
  }

  // 2. Delete from LocalStorage
  try {
    const localCustom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const updated = localCustom.filter(v => v.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Local storage delete error:', e);
  }

  return true;
}
