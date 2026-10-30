/**
 * Hệ Thống Nhắn Tin Nội Bộ Realtime (CBQ Chat - Kênh Trao Đổi Giáo Dục)
 * Trường THPT Cao Bá Quát - Quốc Oai, Hà Nội
 * 
 * Phục vụ: Ban Giám Hiệu, Thầy Cô Giáo Viên, Quý Phụ Huynh & Các Em Học Sinh
 * 
 * Cập nhật:
 * - ĐÃ XÓA TOÀN BỘ DỮ LIỆU MẪU (0 tin nhắn mẫu, kênh trắng tinh sạch sẽ).
 * - Tự động xóa sạch bộ nhớ đệm tin nhắn mẫu cũ (v1, v2) trên mọi trình duyệt.
 * - Hỗ trợ phát sóng Supabase WebSocket Broadcast tức thời đa thiết bị.
 * - Lưu trữ Supabase DB vĩnh viễn khi có bảng cbq_chat_messages.
 */

import { supabase } from '../lib/supabase';

// Key phiên bản mới (v3) để tự động xóa sạch dữ liệu mẫu cũ trong LocalStorage của người dùng
const STORAGE_KEY_CHAT_MESSAGES = 'cbq_chat_messages_records_v3';
const STORAGE_KEY_CHAT_IDENTITY = 'cbq_chat_saved_identity_v1';

// Danh sách các kênh hội thoại chính thức
export const DEFAULT_CHANNELS = [
  {
    id: 'general-announcements',
    name: '📢 Bảng Tin Thông Báo Nhà Trường',
    category: 'school',
    description: 'Kênh phát ngôn và thông báo chính thức từ Ban Giám Hiệu gửi toàn thể Phụ huynh & Học sinh.',
    isReadOnlyForStudents: true,
    unreadCount: 0
  },
  {
    id: 'parent-support',
    name: '🤝 Hỗ Trợ Dịch Vụ Công & Phụ Huynh',
    category: 'support',
    description: 'Nơi phụ huynh trao đổi với Ban Giám Thị & Văn thư về hồ sơ DVC, thủ tục, bảo hiểm, xe đưa đón.',
    isReadOnlyForStudents: false,
    unreadCount: 0
  },
  {
    id: 'class-12a1',
    name: '🏫 Lớp 12A1 (GVCN: Thầy Hoàng Nam)',
    category: 'classes',
    description: 'Kênh trao đổi nề nếp, lịch học, ôn thi tốt nghiệp THPT của tập thể lớp 12A1.',
    isReadOnlyForStudents: false,
    unreadCount: 0
  },
  {
    id: 'class-11a3',
    name: '🏫 Lớp 11A3 (GVCN: Cô Thanh Vân)',
    category: 'classes',
    description: 'Kênh trao đổi học tập và nề nếp thi đua tập thể lớp 11A3.',
    isReadOnlyForStudents: false,
    unreadCount: 0
  },
  {
    id: 'dept-toan',
    name: '📐 Tổ Chuyên Môn Toán - Tin Học',
    category: 'teachers',
    description: 'Kênh thảo luận chuyên môn, duyệt đề thi, kế hoạch bài dạy 5512 nội bộ tổ Toán - Tin.',
    isReadOnlyForStudents: true,
    unreadCount: 0
  },
  {
    id: 'dept-van',
    name: '📖 Tổ Chuyên Môn Ngữ Văn',
    category: 'teachers',
    description: 'Kênh sinh hoạt chuyên môn, chia sẻ chuyên đề bồi dưỡng HSG môn Ngữ Văn.',
    isReadOnlyForStudents: true,
    unreadCount: 0
  }
];

// 0 tin nhắn mẫu theo yêu cầu người dùng
const INITIAL_MOCK_MESSAGES = [];

// Khởi tạo Supabase Realtime Broadcast Channel (Hoạt động đa thiết bị không cần bảng DB)
let realtimeBroadcastChannel = null;

function getRealtimeChannel() {
  if (!realtimeBroadcastChannel && supabase) {
    try {
      realtimeBroadcastChannel = supabase.channel('cbq_chat_realtime_v3', {
        config: {
          broadcast: { self: false } // Không lặp lại tin nhắn về chính thiết bị gửi
        }
      });
      realtimeBroadcastChannel.subscribe();
    } catch (e) {
      console.warn('Không thể khởi tạo Supabase Realtime Channel:', e);
    }
  }
  return realtimeBroadcastChannel;
}

// Lấy danh sách tin nhắn từ LocalStorage (Tự động quét dọn dữ liệu mẫu cũ)
function getLocalMessages() {
  try {
    // 1. Tự động xóa sạch các bản ghi dữ liệu mẫu phiên bản cũ
    localStorage.removeItem('cbq_chat_messages_records_v1');
    localStorage.removeItem('cbq_chat_messages_records_v2');

    const raw = localStorage.getItem(STORAGE_KEY_CHAT_MESSAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Lọc bỏ bất kỳ tin nhắn mẫu cũ nào còn sót
        const cleaned = parsed.filter(m => m && !m.id?.startsWith('msg-seed-') && !m.id?.startsWith('msg-00'));
        return cleaned;
      }
    }
  } catch (e) {
    console.error('Lỗi đọc local chat:', e);
  }
  return [];
}

// Lưu danh sách tin nhắn vào LocalStorage và dispatch event nội bộ
function saveLocalMessages(messages, skipEvent = false) {
  try {
    localStorage.setItem(STORAGE_KEY_CHAT_MESSAGES, JSON.stringify(messages));
    if (!skipEvent) {
      window.dispatchEvent(new CustomEvent('cbq-chat-local-update', { detail: messages }));
    }
  } catch (e) {
    console.error('Lỗi lưu local chat:', e);
  }
}

// Lấy danh sách kênh
export function getChatChannels() {
  return DEFAULT_CHANNELS;
}

// Kiểm tra tình trạng kết nối CSDL Supabase
export async function checkChatDatabaseHealth() {
  try {
    if (!supabase) return { isDbReady: false, message: 'Chưa khởi tạo Supabase Client' };
    const { error } = await supabase.from('cbq_chat_messages').select('id').limit(1);
    if (!error) {
      return { isDbReady: true, message: 'Bảng cbq_chat_messages đang hoạt động tốt trên Supabase' };
    }
    return { isDbReady: false, message: error.message };
  } catch (err) {
    return { isDbReady: false, message: err.message };
  }
}

// Lấy danh sách tin nhắn của 1 kênh
export async function getMessagesByChannel(channelId) {
  // 1. Thử lấy từ Supabase DB
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('cbq_chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mapped = data
          .filter(item => item && !item.id?.startsWith('msg-seed-'))
          .map(item => ({
            id: item.id,
            channelId: item.channel_id,
            channelName: item.channel_name,
            senderId: item.sender_id,
            senderName: item.sender_name,
            senderRole: item.sender_role,
            senderAvatar: item.sender_avatar,
            content: item.content,
            attachments: item.attachments || [],
            likesCount: item.likes_count || 0,
            isPinned: item.is_pinned || false,
            isAnnouncement: item.is_announcement || false,
            createdAt: item.created_at
          }));
        return mapped;
      }
    }
  } catch {
    // Supabase table chưa có hoặc offline
  }

  // 2. Fallback sang LocalStorage (Đã sạch dữ liệu mẫu)
  const all = getLocalMessages();
  return all.filter(m => m.channelId === channelId);
}

// Gửi tin nhắn mới
export async function sendChatMessage(msgData) {
  const newMsg = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    channelId: msgData.channelId,
    channelName: msgData.channelName || 'Kênh Trao Đổi',
    senderId: msgData.senderId || 'user@caobaquat.edu.vn',
    senderName: msgData.senderName || 'Người dùng CBQ',
    senderRole: msgData.senderRole || 'parent', // admin, teacher, parent, student
    senderAvatar: msgData.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    content: (msgData.content || '').trim(),
    attachments: msgData.attachments || [],
    likesCount: 0,
    isPinned: Boolean(msgData.isPinned),
    isAnnouncement: Boolean(msgData.isAnnouncement),
    createdAt: new Date().toISOString()
  };

  // 1. Phát sóng Realtime Broadcast cho tất cả thiết bị khác đang mở ứng dụng
  try {
    const ch = getRealtimeChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'new_message',
        payload: newMsg
      });
    }
  } catch (broadcastErr) {
    console.warn('Lỗi broadcast tin nhắn:', broadcastErr);
  }

  // 2. Cố gắng ghi lưu trữ lâu dài vào Supabase Database
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('cbq_chat_messages')
        .insert([{
          channel_id: newMsg.channelId,
          channel_name: newMsg.channelName,
          sender_id: newMsg.senderId,
          sender_name: newMsg.senderName,
          sender_role: newMsg.senderRole,
          sender_avatar: newMsg.senderAvatar,
          content: newMsg.content,
          attachments: newMsg.attachments,
          likes_count: newMsg.likesCount,
          is_pinned: newMsg.isPinned,
          is_announcement: newMsg.isAnnouncement
        }])
        .select()
        .single();

      if (!error && data?.id) {
        newMsg.id = data.id;
      }
    }
  } catch {
    // Không sao, đã lưu local và broadcast
  }

  // 3. Cập nhật LocalStorage
  const localList = getLocalMessages();
  if (!localList.some(m => m.id === newMsg.id)) {
    const updatedList = [...localList, newMsg];
    saveLocalMessages(updatedList, true);
  }

  return newMsg;
}

// Thả tim tin nhắn
export async function toggleLikeChatMessage(msgId) {
  // 1. Broadcast sự kiện like cho các máy khác
  try {
    const ch = getRealtimeChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'like_message',
        payload: { msgId }
      });
    }
  } catch {
    // ignore
  }

  // 2. Thử cập nhật Supabase DB
  try {
    if (supabase) {
      await supabase.rpc('increment_chat_like', { message_id: msgId }).catch(() => null);
    }
  } catch {
    // ignore
  }

  // 3. Cập nhật LocalStorage
  const localList = getLocalMessages();
  const updatedList = localList.map(m => {
    if (m.id === msgId) {
      return { ...m, likesCount: (m.likesCount || 0) + 1 };
    }
    return m;
  });
  saveLocalMessages(updatedList, true);
  return true;
}

// Ghim / Bỏ ghim tin nhắn
export async function togglePinChatMessage(msgId) {
  let targetPinnedState = false;
  const localList = getLocalMessages();
  const updatedList = localList.map(m => {
    if (m.id === msgId) {
      targetPinnedState = !m.isPinned;
      return { ...m, isPinned: targetPinnedState };
    }
    return m;
  });
  saveLocalMessages(updatedList, true);

  // Broadcast
  try {
    const ch = getRealtimeChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'pin_message',
        payload: { msgId, isPinned: targetPinnedState }
      });
    }
  } catch {
    // ignore
  }

  // DB update
  try {
    if (supabase) {
      await supabase
        .from('cbq_chat_messages')
        .update({ is_pinned: targetPinnedState })
        .eq('id', msgId);
    }
  } catch {
    // ignore
  }

  return targetPinnedState;
}

// Đăng ký nhận tin nhắn Realtime (Đa thiết bị + Đa tab)
export function subscribeToChatMessages(onNewMessage, onLikeUpdate, onPinUpdate) {
  const channel = getRealtimeChannel();

  if (channel) {
    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (payload && onNewMessage) {
          const localList = getLocalMessages();
          if (!localList.some(m => m.id === payload.id)) {
            saveLocalMessages([...localList, payload], true);
          }
          onNewMessage(payload);
        }
      })
      .on('broadcast', { event: 'like_message' }, ({ payload }) => {
        if (payload?.msgId && onLikeUpdate) {
          onLikeUpdate(payload.msgId);
        }
      })
      .on('broadcast', { event: 'pin_message' }, ({ payload }) => {
        if (payload?.msgId && onPinUpdate) {
          onPinUpdate(payload.msgId, payload.isPinned);
        }
      });
  }

  // Lắng nghe qua Storage event giữa các tab trên cùng trình duyệt
  const handleStorageChange = (e) => {
    if (e.key === STORAGE_KEY_CHAT_MESSAGES && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const latest = parsed[parsed.length - 1];
          if (latest && onNewMessage) {
            onNewMessage(latest);
          }
        }
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

// Quản lý thông tin định danh lưu cục bộ của người dùng
export function getSavedChatIdentity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHAT_IDENTITY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function saveChatIdentity(identity) {
  try {
    localStorage.setItem(STORAGE_KEY_CHAT_IDENTITY, JSON.stringify(identity));
  } catch {
    // ignore
  }
}
