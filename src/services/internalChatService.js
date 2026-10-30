/**
 * Hệ Thống Nhắn Tin Nội Bộ Realtime (CBQ Chat - Kênh Trao Đổi Giáo Dục)
 * Trường THPT Cao Bá Quát - Quốc Oai, Hà Nội
 * 
 * Phục vụ: Cán bộ BGH, Giáo viên chủ nhiệm, Giáo viên bộ môn, Phụ huynh & Học sinh
 * Đồng bộ Realtime Supabase Broadcast + LocalStorage fallback đa thiết bị.
 */

import { supabase } from '../lib/supabase';

const STORAGE_KEY_CHAT_MESSAGES = 'cbq_chat_messages_records_v1';

// Danh sách các kênh hội thoại mặc định
export const DEFAULT_CHANNELS = [
  {
    id: 'general-announcements',
    name: '📢 Bảng Tin Thông Báo Nhà Trường',
    category: 'school',
    description: 'Kênh phát ngôn và thông báo chính thức từ Ban Giám Hiệu gửi toàn thể Phụ huynh & Học sinh.',
    isReadOnlyForStudents: true,
    unreadCount: 1
  },
  {
    id: 'parent-support',
    name: '🤝 Hỗ Trợ Dịch Vụ Công & Phụ Huynh',
    category: 'support',
    description: 'Nơi phụ huynh trao đổi với Ban Giám Thị & Văn thư về hồ sơ, thủ tục, bảo hiểm, xe đưa đón.',
    isReadOnlyForStudents: false,
    unreadCount: 2
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

// Tin nhắn mẫu sinh động ban đầu
const INITIAL_MOCK_MESSAGES = [
  {
    id: 'msg-001',
    channelId: 'general-announcements',
    channelName: '📢 Bảng Tin Thông Báo Nhà Trường',
    senderId: 'admin@caobaquat.edu.vn',
    senderName: 'Thầy Hiệu Trưởng (BGH THPT Cao Bá Quát)',
    senderRole: 'admin',
    senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    content: 'Kính gửi Quý Thầy/Cô, Quý Phụ huynh và các em học sinh:\n\nNhà trường chính thức khai trương **Cổng Dịch Vụ Công Trực Tuyến 4.0** kết nối Zalo OA. Giờ đây phụ huynh có thể xin Giấy xác nhận học sinh, xin nghỉ phép điện tử và rút sao y học bạ trực tiếp trên điện thoại mà không cần phải đi lại văn phòng trường. Chúc toàn trường một tuần học tập và làm việc hiệu quả!',
    attachments: [],
    likesCount: 18,
    isPinned: true,
    isAnnouncement: true,
    createdAt: '2026-10-30T07:30:00Z'
  },
  {
    id: 'msg-002',
    channelId: 'parent-support',
    channelName: '🤝 Hỗ Trợ Dịch Vụ Công & Phụ Huynh',
    senderId: 'parent-0912',
    senderName: 'Bác Nguyễn Văn Hùng (PH em Minh Quân - 12A1)',
    senderRole: 'parent',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    content: 'Kính chào Thầy/Cô Văn thư. Tôi vừa nộp hồ sơ xin cấp Giấy xác nhận học sinh cho cháu Quân mã số **CBQ-DVC-2026-0182** để nộp Công an huyện làm CCCD. Nhờ Thầy/Cô kiểm tra giúp tôi ạ!',
    attachments: [],
    likesCount: 1,
    isPinned: false,
    isAnnouncement: false,
    createdAt: '2026-10-30T08:15:00Z'
  },
  {
    id: 'msg-003',
    channelId: 'parent-support',
    channelName: '🤝 Hỗ Trợ Dịch Vụ Công & Phụ Huynh',
    senderId: 'vanthu@caobaquat.edu.vn',
    senderName: 'Cô Thu Hà (Văn Thư Nhà Trường)',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    content: 'Dạ kính chào Bác Hùng! Văn thư trường đã đối soát dữ liệu của em Quân và BGH đã ký số điện tử phê duyệt rồi ạ. Bác có thể bấm vào mục Tra cứu DVC tải file PDF Giấy xác nhận có mộc số và mã QR ngay trên điện thoại, hoặc ghé phòng Văn thư nhận bản in dấu đỏ nếu cần ạ!',
    attachments: [],
    likesCount: 3,
    isPinned: false,
    isAnnouncement: false,
    createdAt: '2026-10-30T08:22:00Z'
  },
  {
    id: 'msg-004',
    channelId: 'class-12a1',
    channelName: '🏫 Lớp 12A1 (GVCN: Thầy Hoàng Nam)',
    senderId: 'namhoang@caobaquat.edu.vn',
    senderName: 'Thầy Hoàng Nam (GVCN Lớp 12A1)',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    content: 'Nhắc nhở các em học sinh lớp 12A1: Tiết 3 sáng nay lớp mình có bài kiểm tra thường xuyên môn Toán (Chuyên đề Tích phân & Hình học Oxyz). Các em chuẩn bị đầy đủ máy tính cầm tay và giấy nháp nhé!',
    attachments: [],
    likesCount: 12,
    isPinned: true,
    isAnnouncement: true,
    createdAt: '2026-10-30T07:45:00Z'
  }
];

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
  localStorage.setItem(STORAGE_KEY_CHAT_MESSAGES, JSON.stringify(INITIAL_MOCK_MESSAGES));
  return INITIAL_MOCK_MESSAGES;
}

// Lưu danh sách tin nhắn vào LocalStorage
function saveLocalMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY_CHAT_MESSAGES, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('cbq-chat-sync', { detail: messages }));
  } catch (e) {
    console.error('Lỗi lưu local chat:', e);
  }
}

// 1. Lấy danh sách kênh
export function getChatChannels() {
  return DEFAULT_CHANNELS;
}

// 2. Lấy danh sách tin nhắn của 1 kênh
export async function getMessagesByChannel(channelId) {
  try {
    const { data, error } = await supabase
      .from('cbq_chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
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
  } catch (err) {
    console.warn('Supabase Chat offline, dùng dữ liệu nội bộ:', err.message);
  }

  const all = getLocalMessages();
  return all.filter(m => m.channelId === channelId);
}

// 3. Gửi tin nhắn mới
export async function sendChatMessage(msgData) {
  const newMsg = {
    id: 'msg-' + Date.now(),
    channelId: msgData.channelId,
    channelName: msgData.channelName || 'Kênh Trao Đổi',
    senderId: msgData.senderId || 'user@caobaquat.edu.vn',
    senderName: msgData.senderName || 'Người dùng CBQ',
    senderRole: msgData.senderRole || 'parent', // admin, teacher, parent, student
    senderAvatar: msgData.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    content: msgData.content.trim(),
    attachments: msgData.attachments || [],
    likesCount: 0,
    isPinned: Boolean(msgData.isPinned),
    isAnnouncement: Boolean(msgData.isAnnouncement),
    createdAt: new Date().toISOString()
  };

  // Cố gắng ghi Supabase
  try {
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

    if (!error && data) {
      newMsg.id = data.id;
    }
  } catch (err) {
    console.warn('Lỗi ghi Supabase Chat:', err.message);
  }

  // Cập nhật LocalStorage
  const localList = getLocalMessages();
  const updatedList = [...localList, newMsg];
  saveLocalMessages(updatedList);

  return newMsg;
}

// 4. Thích tin nhắn
export async function toggleLikeChatMessage(msgId) {
  const localList = getLocalMessages();
  const updatedList = localList.map(m => {
    if (m.id === msgId) {
      return { ...m, likesCount: (m.likesCount || 0) + 1 };
    }
    return m;
  });
  saveLocalMessages(updatedList);
  return true;
}

// 5. Ghim tin nhắn
export async function togglePinChatMessage(msgId) {
  const localList = getLocalMessages();
  const updatedList = localList.map(m => {
    if (m.id === msgId) {
      return { ...m, isPinned: !m.isPinned };
    }
    return m;
  });
  saveLocalMessages(updatedList);
  return true;
}
