/**
 * Hệ Thống Nhắn Tin Nội Bộ Realtime (CBQ Chat - Kênh Trao Đổi Giáo Dục)
 * Trường THPT Cao Bá Quát - Quốc Oai, Hà Nội
 * 
 * Phục vụ: Ban Giám Hiệu, Thầy Cô Giáo Viên, Quý Phụ Huynh & Các Em Học Sinh
 * Cơ chế hoạt động:
 * 1. Supabase WebSocket Broadcast: Gửi nhận tin nhắn tức thì đa thiết bị (Điện thoại <-> Máy tính)
 * 2. Supabase Postgres Replication: Tự động lưu trữ vĩnh viễn khi có bảng cbq_chat_messages
 * 3. LocalStorage Cache & Cross-Tab Sync: Đảm bảo 100% hoạt động mượt mà kể cả khi offline hoặc chưa chạy SQL.
 */

import { supabase } from '../lib/supabase';

const STORAGE_KEY_CHAT_MESSAGES = 'cbq_chat_messages_records_v1';
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

// Tin nhắn mẫu ban đầu
const INITIAL_MOCK_MESSAGES = [
  {
    id: 'msg-seed-001',
    channelId: 'general-announcements',
    channelName: '📢 Bảng Tin Thông Báo Nhà Trường',
    senderId: 'admin@caobaquat.edu.vn',
    senderName: 'Thầy Hiệu Trưởng (BGH THPT Cao Bá Quát)',
    senderRole: 'admin',
    senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    content: 'Kính gửi Quý Thầy/Cô, Quý Phụ huynh và các em học sinh:\n\nNhà trường chính thức khai trương Cổng Dịch Vụ Công Trực Tuyến 4.0 kết nối Zalo OA và Kênh Chat Nội Bộ CBQ. Giờ đây phụ huynh có thể xin Giấy xác nhận học sinh, xin nghỉ phép điện tử và rút sao y học bạ trực tiếp trên điện thoại mà không cần phải đi lại văn phòng trường. Chúc toàn trường một tuần học tập và làm việc hiệu quả!',
    attachments: [],
    likesCount: 24,
    isPinned: true,
    isAnnouncement: true,
    createdAt: '2026-10-30T07:30:00Z'
  },
  {
    id: 'msg-seed-002',
    channelId: 'parent-support',
    channelName: '🤝 Hỗ Trợ Dịch Vụ Công & Phụ Huynh',
    senderId: 'parent-0912',
    senderName: 'Bác Nguyễn Văn Hùng (PH em Minh Quân - 12A1)',
    senderRole: 'parent',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    content: 'Kính chào Thầy/Cô Văn thư. Tôi vừa nộp hồ sơ xin cấp Giấy xác nhận học sinh cho cháu Quân mã số CBQ-DVC-2026-0182 để nộp Công an huyện làm CCCD. Nhờ Thầy/Cô kiểm tra giúp tôi ạ!',
    attachments: [],
    likesCount: 2,
    isPinned: false,
    isAnnouncement: false,
    createdAt: '2026-10-30T08:15:00Z'
  },
  {
    id: 'msg-seed-003',
    channelId: 'parent-support',
    channelName: '🤝 Hỗ Trợ Dịch Vụ Công & Phụ Huynh',
    senderId: 'vanthu@caobaquat.edu.vn',
    senderName: 'Cô Thu Hà (Văn Thư Nhà Trường)',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    content: 'Dạ kính chào Bác Hùng! Văn thư trường đã đối soát dữ liệu của em Quân và BGH đã ký số điện tử phê duyệt rồi ạ. Bác có thể bấm vào mục Tra cứu DVC tải file PDF Giấy xác nhận có mộc số và mã QR ngay trên điện thoại, hoặc ghé phòng Văn thư nhận bản in dấu đỏ nếu cần ạ!',
    attachments: [],
    likesCount: 5,
    isPinned: false,
    isAnnouncement: false,
    createdAt: '2026-10-30T08:22:00Z'
  },
  {
    id: 'msg-seed-004',
    channelId: 'class-12a1',
    channelName: '🏫 Lớp 12A1 (GVCN: Thầy Hoàng Nam)',
    senderId: 'namhoang@caobaquat.edu.vn',
    senderName: 'Thầy Hoàng Nam (GVCN Lớp 12A1)',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    content: 'Nhắc nhở các em học sinh lớp 12A1: Tiết 3 sáng nay lớp mình có bài kiểm tra thường xuyên môn Toán (Chuyên đề Tích phân & Oxyz). Các em chuẩn bị đầy đủ máy tính cầm tay và giấy nháp nhé!',
    attachments: [],
    likesCount: 15,
    isPinned: true,
    isAnnouncement: true,
    createdAt: '2026-10-30T07:45:00Z'
  }
];

// Khởi tạo Supabase Realtime Broadcast Channel (Hoạt động đa thiết bị không cần bảng DB)
let realtimeBroadcastChannel = null;

function getRealtimeChannel() {
  if (!realtimeBroadcastChannel && supabase) {
    try {
      realtimeBroadcastChannel = supabase.channel('cbq_chat_realtime_v1', {
        config: {
          broadcast: { self: false } // Không lặp lại tin nhắn về chính thiết bị gửi
        }
      });
      realtimeBroadcastChannel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          // Channel connected
        }
      });
    } catch (e) {
      console.warn('Không thể khởi tạo Supabase Realtime Channel:', e);
    }
  }
  return realtimeBroadcastChannel;
}

// Lấy danh sách tin nhắn từ LocalStorage
function getLocalMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHAT_MESSAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Lỗi đọc local chat:', e);
  }
  // Mặc định nạp tin nhắn mẫu
  try {
    localStorage.setItem(STORAGE_KEY_CHAT_MESSAGES, JSON.stringify(INITIAL_MOCK_MESSAGES));
  } catch {
    // Ignore storage quota
  }
  return INITIAL_MOCK_MESSAGES;
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

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(item => ({
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
  } catch (err) {
    // Supabase table chưa có hoặc offline
  }

  // 2. Fallback sang LocalStorage
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
  } catch (dbErr) {
    // Không sao, đã lưu local và broadcast
  }

  // 3. Cập nhật LocalStorage (skipEvent = true để tránh tự kích hoạt sync đè trên cùng tab)
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
  // 1. Lắng nghe qua Supabase WebSocket Broadcast (Giữa các thiết bị khác nhau)
  const channel = getRealtimeChannel();
  let subRef = null;

  if (channel) {
    subRef = channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (payload && onNewMessage) {
          // Lưu vào local
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

  // 2. Lắng nghe qua Storage event giữa các tab trên cùng trình duyệt
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

  // Trả về hàm hủy đăng ký
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    // Lưu ý: không unmount channel chung để giữ kết nối liên tục
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
