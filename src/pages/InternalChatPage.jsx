import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, Send, Heart, Pin, Bell, Shield, Users, Search, 
  ArrowLeft, CheckCircle2, RefreshCw, X, Sparkles, Database, 
  Copy, Smile
} from 'lucide-react';
import { 
  getChatChannels, 
  getMessagesByChannel, 
  sendChatMessage, 
  toggleLikeChatMessage, 
  togglePinChatMessage,
  subscribeToChatMessages,
  checkChatDatabaseHealth,
  getSavedChatIdentity,
  saveChatIdentity
} from '../services/internalChatService';
import { getTeacherSession, getStudentSession } from '../services/authSessionManager';

// Danh sách danh tính mẫu để thử nghiệm nhanh
const QUICK_IDENTITIES = [
  { id: 'admin', name: 'Ban Giám Hiệu THPT Cao Bá Quát', role: 'admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
  { id: 'teacher_nam', name: 'Thầy Hoàng Nam (GVCN 12A1)', role: 'teacher', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  { id: 'teacher_van', name: 'Cô Thanh Vân (GVCN 11A3)', role: 'teacher', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80' },
  { id: 'parent_hung', name: 'Bác Nguyễn Văn Hùng (PH 12A1)', role: 'parent', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'student_quan', name: 'Em Nguyễn Minh Quân (12A1)', role: 'student', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
];

const QUICK_EMOJIS = ['👍', '❤️', '👏', '💐', '📚', '✍️', '⭐', '💯'];

export default function InternalChatPage() {
  const { user } = useAuth();
  const location = useLocation();

  // Xác định xem trang đang mở trong giao diện Admin hay Standalone
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Quản lý responsive mobile
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Kênh chat & tin nhắn
  const channels = useMemo(() => getChatChannels(), []);
  const [activeChannelId, setActiveChannelId] = useState(channels[0].id);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchChannel, setSearchChannel] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Trên Mobile: Chuyển đổi giữa Danh sách kênh (false) và Khung hội thoại (true)
  const [mobileViewChat, setMobileViewChat] = useState(false);

  // Modal đổi thông tin người gửi
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const [customRoleInput, setCustomRoleInput] = useState('parent');

  // Trạng thái CSDL Supabase (Dành cho Admin kiểm tra)
  const [dbHealth, setDbHealth] = useState({ checked: false, isDbReady: false });
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Nhận diện danh tính người dùng thông minh
  const [currentIdentity, setCurrentIdentity] = useState(() => {
    if (user?.email) {
      return {
        id: user.id || user.email,
        name: user.email.includes('admin') ? 'Ban Giám Hiệu THPT Cao Bá Quát' : 'Cán bộ Quản trị CBQ',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
      };
    }
    const teacherSession = getTeacherSession();
    if (teacherSession?.full_name || teacherSession?.name) {
      const name = teacherSession.full_name || teacherSession.name;
      const dept = teacherSession.department_name || teacherSession.subject || 'Giáo Viên';
      return {
        id: teacherSession.id || 'teacher_' + name,
        name: `Thầy/Cô ${name} (${dept})`,
        role: 'teacher',
        avatar: teacherSession.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
      };
    }
    const studentSession = getStudentSession();
    if (studentSession?.full_name || studentSession?.name) {
      const name = studentSession.full_name || studentSession.name;
      const sClass = studentSession.student_class || 'Học Sinh';
      return {
        id: studentSession.id || 'student_' + name,
        name: `Em ${name} (${sClass})`,
        role: 'student',
        avatar: studentSession.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      };
    }
    const saved = getSavedChatIdentity();
    if (saved?.name) return saved;

    return QUICK_IDENTITIES[3];
  });

  const messagesEndRef = useRef(null);

  // Tải tin nhắn khi đổi kênh
  useEffect(() => {
    let isMounted = true;
    async function loadChannelMessages() {
      setLoadingMessages(true);
      try {
        const data = await getMessagesByChannel(activeChannelId);
        if (isMounted) {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Lỗi tải tin nhắn:', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }
    loadChannelMessages();

    return () => {
      isMounted = false;
    };
  }, [activeChannelId]);

  // Đăng ký Supabase Realtime Broadcast & Cross-tab Sync
  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(
      (newMsg) => {
        if (newMsg && newMsg.channelId === activeChannelId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      },
      (likedMsgId) => {
        setMessages(prev => prev.map(m => m.id === likedMsgId ? { ...m, likesCount: (m.likesCount || 0) + 1 } : m));
      },
      (pinnedMsgId, isPinned) => {
        setMessages(prev => prev.map(m => m.id === pinnedMsgId ? { ...m, isPinned } : m));
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeChannelId]);

  // Kiểm tra sức khỏe DB cho Admin
  useEffect(() => {
    if (isAdminRoute || user) {
      checkChatDatabaseHealth().then(res => {
        setDbHealth({ checked: true, isDbReady: res.isDbReady, message: res.message });
      });
    }
  }, [isAdminRoute, user]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMessages]);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  // Gửi tin nhắn mới
  const handleSend = async (e) => {
    e?.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || isSending) return;

    setInputText('');
    setIsSending(true);

    try {
      const sentMsg = await sendChatMessage({
        channelId: activeChannel.id,
        channelName: activeChannel.name,
        senderId: currentIdentity.id,
        senderName: currentIdentity.name,
        senderRole: currentIdentity.role,
        senderAvatar: currentIdentity.avatar,
        content: textToSend,
        isAnnouncement: currentIdentity.role === 'admin' && activeChannel.id === 'general-announcements'
      });

      setMessages(prev => {
        if (prev.some(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Thả tim tin nhắn
  const handleLike = async (msgId) => {
    try {
      await toggleLikeChatMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, likesCount: (m.likesCount || 0) + 1 } : m));
    } catch (err) {
      console.error(err);
    }
  };

  // Ghim tin nhắn (chỉ dành cho BGH hoặc Thầy Cô)
  const handleTogglePin = async (msgId) => {
    try {
      const newState = await togglePinChatMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned: newState } : m));
    } catch (err) {
      console.error(err);
    }
  };

  // Lọc kênh theo danh mục và tìm kiếm
  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchChannel.toLowerCase()) ||
        c.description.toLowerCase().includes(searchChannel.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [channels, searchChannel, categoryFilter]);

  // Tin nhắn ghim của kênh đang xem
  const pinnedMessages = useMemo(() => {
    return messages.filter(m => m.isPinned);
  }, [messages]);

  // Huy hiệu vai trò
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'BGH / Quản Trị', bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'teacher':
        return { label: 'Thầy / Cô', bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' };
      case 'parent':
        return { label: 'Phụ Huynh', bg: '#dcfce7', text: '#15803d', border: '#86efac' };
      case 'student':
        return { label: 'Học Sinh', bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      default:
        return { label: 'Thành viên', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  // Định dạng giờ hiển thị an toàn
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Lưu thông tin đổi người gửi
  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (!customNameInput.trim()) return;

    let defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
    if (customRoleInput === 'admin') defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80';
    if (customRoleInput === 'teacher') defaultAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80';
    if (customRoleInput === 'student') defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

    const newIdObj = {
      id: 'custom_' + Date.now(),
      name: customNameInput.trim(),
      role: customRoleInput,
      avatar: defaultAvatar
    };
    setCurrentIdentity(newIdObj);
    saveChatIdentity(newIdObj);
    setShowIdentityModal(false);
  };

  // Sao chép mã SQL
  const handleCopySql = () => {
    const sqlText = `-- Chạy mã này trong Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.cbq_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id VARCHAR(100) NOT NULL,
    channel_name VARCHAR(150) NOT NULL,
    sender_id VARCHAR(100),
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(50) DEFAULT 'parent',
    sender_avatar VARCHAR(255),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    likes_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cbq_chat_messages DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.cbq_chat_messages TO anon, authenticated, public;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cbq_chat_messages;`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // --------------------------------------------------------------------------
  // KHUNG CHÍNH NỘI DUNG CHAT
  // --------------------------------------------------------------------------
  const chatMainInterface = (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: isAdminRoute ? 'calc(100vh - 140px)' : (isMobile ? 'calc(100dvh - 52px)' : 'calc(100dvh - 56px)'),
      minHeight: isAdminRoute ? '560px' : 'auto',
      backgroundColor: '#ffffff',
      overflow: 'hidden',
      borderRadius: isAdminRoute ? '14px' : '0',
      border: isAdminRoute ? '1px solid #e2e8f0' : 'none',
      boxShadow: isAdminRoute ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
      position: 'relative',
      width: '100%'
    }}>

      {/* CỘT TRÁI: DANH SÁCH KÊNH HỘI THOẠI */}
      <div style={{
        width: isMobile ? '100%' : '320px',
        minWidth: isMobile ? '100%' : '300px',
        maxWidth: isMobile ? '100%' : '340px',
        display: (isMobile && mobileViewChat) ? 'none' : 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
        height: '100%',
        flexShrink: 0
      }}>
        {/* Header danh sách kênh */}
        <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={17} color="#0284c7" /> Kênh Hội Thoại CBQ
            </div>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
              Realtime
            </span>
          </div>

          {/* Ô tìm kiếm kênh */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Tìm kiếm kênh trao đổi..."
              value={searchChannel}
              onChange={e => setSearchChannel(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            {searchChannel && (
              <button 
                type="button" 
                onClick={() => setSearchChannel('')}
                style={{ position: 'absolute', right: '8px', top: '7px', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bộ lọc danh mục kênh */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'school', label: '📢 Nhà trường' },
              { id: 'classes', label: '🏫 Lớp học' },
              { id: 'teachers', label: '📐 Tổ môn' },
              { id: 'support', label: '🤝 DVC' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: categoryFilter === cat.id ? 'bold' : '500',
                  backgroundColor: categoryFilter === cat.id ? '#0284c7' : '#f1f5f9',
                  color: categoryFilter === cat.id ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách các kênh */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredChannels.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Không tìm thấy kênh phù hợp
            </div>
          ) : (
            filteredChannels.map(ch => {
              const isActive = ch.id === activeChannel.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    setActiveChannelId(ch.id);
                    if (isMobile) {
                      setMobileViewChat(true);
                    }
                  }}
                  style={{
                    padding: '11px 13px',
                    borderRadius: '10px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#e0f2fe' : '#ffffff',
                    border: isActive ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: isActive ? '800' : '600', color: isActive ? '#0369a1' : '#0f172a' }}>
                      {ch.name}
                    </span>
                    {ch.unreadCount > 0 && !isActive && (
                      <span style={{ backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                        {ch.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                    {ch.description}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chân danh sách kênh: Thông tin người gửi */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <img
              src={currentIdentity.avatar}
              alt={currentIdentity.name}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #cbd5e1' }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentIdentity.name}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                {getRoleBadge(currentIdentity.role).label}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomNameInput(currentIdentity.name);
              setCustomRoleInput(currentIdentity.role);
              setShowIdentityModal(true);
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#0284c7',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Đổi vai trò
          </button>
        </div>

      </div>

      {/* CỘT PHẢI: KHUNG TRÒ CHUYỆN (ACTIVE CHAT ROOM) */}
      <div style={{
        flex: 1,
        display: (isMobile && !mobileViewChat) ? 'none' : 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        height: '100%',
        minWidth: 0,
        position: 'relative'
      }}>

        {/* Desktop Chat Room Header (CHỈ hiển thị trên Desktop hoặc Admin mode; trên Mobile đã có Unified Header) */}
        {!isMobile && (
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            flexShrink: 0
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeChannel.name}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeChannel.description}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                Trực tuyến
              </span>

              {isAdminRoute && (
                <button
                  type="button"
                  onClick={() => setShowSqlModal(true)}
                  title="Kiểm tra cấu hình CSDL Supabase"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: dbHealth.isDbReady ? '1px solid #86efac' : '1px solid #fde047',
                    backgroundColor: dbHealth.isDbReady ? '#f0fdf4' : '#fefce8',
                    color: dbHealth.isDbReady ? '#166534' : '#854d0e',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Database size={13} />
                  <span>{dbHealth.isDbReady ? 'DB Cloud OK' : 'SQL Setup'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Thanh tin nhắn ghim (Pinned Announcement Bar) */}
        {pinnedMessages.length > 0 && (
          <div style={{
            padding: '8px 14px',
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#92400e',
            flexShrink: 0
          }}>
            <Pin size={14} color="#d97706" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>Tin ghim:</strong> {pinnedMessages[0].content}
            </div>
          </div>
        )}

        {/* Dòng thời gian tin nhắn (Messages Stream) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '12px 10px' : '14px 16px',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {loadingMessages ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '13px' }}>
              <RefreshCw size={18} className="animate-spin" style={{ marginRight: '8px' }} /> Đang tải tin nhắn...
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#94a3b8',
              gap: '10px',
              padding: '24px 16px',
              textAlign: 'center'
            }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={28} color="#94a3b8" />
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#475569' }}>
                Kênh chưa có tin nhắn nào
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '300px', lineHeight: '1.5' }}>
                Hãy gửi lời chào hoặc nhập câu hỏi đầu tiên để bắt đầu cuộc trò chuyện trong {activeChannel.name}!
              </div>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === currentIdentity.id;
              const badge = getRoleBadge(msg.senderRole);

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    gap: '8px',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Avatar */}
                  <img
                    src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={msg.senderName}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1.5px solid #cbd5e1'
                    }}
                  />

                  {/* Message Bubble Container */}
                  <div style={{
                    maxWidth: isMobile ? '82%' : '72%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>

                    {/* Sender Name & Role Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '3px',
                      flexWrap: 'wrap',
                      justifyContent: isMe ? 'flex-end' : 'flex-start'
                    }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1e293b' }}>
                        {msg.senderName}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '1px 5px',
                        borderRadius: '6px',
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>

                    {/* Bubble Content */}
                    <div style={{
                      padding: '9px 13px',
                      borderRadius: isMe ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                      backgroundColor: isMe ? '#0284c7' : msg.isAnnouncement ? '#fef3c7' : '#ffffff',
                      color: isMe ? '#ffffff' : '#0f172a',
                      border: isMe ? 'none' : msg.isAnnouncement ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {msg.content}
                    </div>

                    {/* Actions: Thả tim & Ghim tin */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <button
                        type="button"
                        onClick={() => handleLike(msg.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          fontSize: '11px',
                          color: (msg.likesCount || 0) > 0 ? '#ef4444' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Heart size={12} fill={(msg.likesCount || 0) > 0 ? '#ef4444' : 'none'} />
                        <span>{msg.likesCount || 0}</span>
                      </button>

                      {/* Nút ghim dành cho Thầy Cô / Admin */}
                      {(currentIdentity.role === 'admin' || currentIdentity.role === 'teacher') && (
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            fontSize: '11px',
                            color: msg.isPinned ? '#d97706' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title={msg.isPinned ? 'Bỏ ghim tin' : 'Ghim tin nhắn này'}
                        >
                          <Pin size={11} fill={msg.isPinned ? '#d97706' : 'none'} />
                          <span>{msg.isPinned ? 'Đã ghim' : 'Ghim'}</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Thanh biểu tượng cảm xúc nhanh */}
        <div style={{
          padding: '5px 12px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Smile size={12} /> Nhanh:
          </span>
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => setInputText(prev => prev ? `${prev} ${emoji}` : emoji)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                padding: '2px 4px',
                borderRadius: '4px'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Thanh nhập tin nhắn (Input Bar cố định dưới đáy) */}
        <form
          onSubmit={handleSend}
          style={{
            padding: isMobile ? '8px 10px max(10px, env(safe-area-inset-bottom, 10px)) 10px' : '10px 14px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexShrink: 0,
            position: 'sticky',
            bottom: 0,
            zIndex: 10
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Nhắn tin vào ${activeChannel.name}...`}
              style={{
                width: '100%',
                padding: isMobile ? '9px 12px' : '10px 14px',
                borderRadius: '24px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={e => e.target.style.borderColor = '#0284c7'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            style={{
              padding: isMobile ? '9px 14px' : '10px 18px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: inputText.trim() && !isSending ? '#0284c7' : '#cbd5e1',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: inputText.trim() && !isSending ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s ease'
            }}
          >
            {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Gửi</span>
          </button>
        </form>

      </div>

      {/* MODAL ĐỔI THÔNG TIN VAI TRÒ NGƯỜI GỬI */}
      {showIdentityModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Thiết Lập Danh Tính Trò Chuyện
              </div>
              <button
                type="button"
                onClick={() => setShowIdentityModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIdentity} style={{ padding: '16px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Họ và tên hiển thị trong kênh chat:
                </label>
                <input
                  type="text"
                  value={customNameInput}
                  onChange={e => setCustomNameInput(e.target.value)}
                  placeholder="VD: Bác Nguyễn Văn Hùng (PH em Minh Quân 12A1)..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Vai trò của bạn:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'parent', label: 'Phụ Huynh', desc: 'Trao đổi với BGH & GVCN' },
                    { id: 'student', label: 'Học Sinh', desc: 'Học tập & hoạt động lớp' },
                    { id: 'teacher', label: 'Thầy / Cô', desc: 'Giáo viên bộ môn / GVCN' },
                    { id: 'admin', label: 'BGH / Quản Trị', desc: 'Ban điều hành nhà trường' }
                  ].map(r => (
                    <div
                      key={r.id}
                      onClick={() => setCustomRoleInput(r.id)}
                      style={{
                        padding: '9px 11px',
                        borderRadius: '8px',
                        border: customRoleInput === r.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: customRoleInput === r.id ? '#f0f9ff' : '#f8fafc',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: customRoleInput === r.id ? '#0369a1' : '#0f172a' }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lựa chọn nhanh tài khoản thử nghiệm */}
              <div style={{ marginBottom: '14px', padding: '10px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  Chọn nhanh danh tính:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {QUICK_IDENTITIES.map(qi => (
                    <button
                      key={qi.id}
                      type="button"
                      onClick={() => {
                        setCustomNameInput(qi.name);
                        setCustomRoleInput(qi.role);
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {qi.name.split('(')[0]} ({qi.role})
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowIdentityModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Lưu & Áp Dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HƯỚNG DẪN SQL DATABASE SUPABASE (DÀNH CHO BGH/ADMIN) */}
      {showSqlModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={16} color="#38bdf8" /> Cấu Hình Lưu Trữ Supabase Cloud
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '18px', fontSize: '13px', color: '#334155' }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: dbHealth.isDbReady ? '#f0fdf4' : '#fefce8',
                border: dbHealth.isDbReady ? '1px solid #bbf7d0' : '1px solid #fde047',
                marginBottom: '14px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                {dbHealth.isDbReady ? (
                  <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                ) : (
                  <Database size={20} color="#ca8a04" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 'bold', color: dbHealth.isDbReady ? '#166534' : '#854d0e' }}>
                    {dbHealth.isDbReady ? 'CSDL Supabase đã sẵn sàng 100%' : 'Hệ thống đang chạy qua Realtime Broadcast + Bộ nhớ đệm'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {dbHealth.isDbReady 
                      ? 'Tin nhắn được lưu trữ vĩnh viễn trên Supabase và đồng bộ tức thì đa thiết bị.' 
                      : 'Hội thoại tức thì vẫn hoạt động bình thường giữa các thiết bị. Để lưu trữ vĩnh viễn trên Supabase Cloud, hãy dán lệnh SQL sau vào Supabase SQL Editor.'}
                  </div>
                </div>
              </div>

              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Mã SQL cài đặt bảng cbq_chat_messages:</div>
              <pre style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                overflowX: 'auto',
                maxHeight: '180px',
                margin: '0 0 14px 0',
                lineHeight: '1.4'
              }}>
{`CREATE TABLE IF NOT EXISTS public.cbq_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id VARCHAR(100) NOT NULL,
    channel_name VARCHAR(150) NOT NULL,
    sender_id VARCHAR(100),
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(50) DEFAULT 'parent',
    sender_avatar VARCHAR(255),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    likes_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cbq_chat_messages DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.cbq_chat_messages TO anon, authenticated, public;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cbq_chat_messages;`}
              </pre>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {copiedSql ? '✅ Đã sao chép vào bộ nhớ tạm!' : 'Bấm nút để copy toàn bộ mã SQL.'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Copy size={14} /> Sao chép mã SQL
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSqlModal(false)}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // --------------------------------------------------------------------------
  // RENDER TRONG GIAO DIỆN ADMIN (/admin/chat)
  // --------------------------------------------------------------------------
  if (isAdminRoute && user) {
    return (
      <Layout title="Hệ Thống Nhắn Tin Nội Bộ (CBQ Chat)">
        {chatMainInterface}
      </Layout>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER TRONG GIAO DIỆN ĐỘC LẬP TOÀN MÀN HÌNH (/chat, /tin-nhan)
  // --------------------------------------------------------------------------
  return (
    <div style={{
      height: '100dvh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#f1f5f9',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* =========================================================================
          UNIFIED HEADER DUY NHẤT: THIẾT KẾ CO GIÃN CHUẨN XÁC, KHÔNG TRÀN CHỮ
          ========================================================================= */}
      <header style={{
        height: isMobile ? '52px' : '56px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 20px',
        flexShrink: 0,
        zIndex: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>

        {/* TRÊN MOBILE KHI ĐANG MỞ KÊNH CHAT: Header hiển thị Nút [← Kênh] + Tên Kênh */}
        {isMobile && mobileViewChat ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setMobileViewChat(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} /> Kênh
              </button>

              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeChannel.name}
                </div>
                <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} /> Trực tuyến
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCustomNameInput(currentIdentity.name);
                setCustomRoleInput(currentIdentity.role);
                setShowIdentityModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                background: 'none',
                padding: '2px',
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: '8px'
              }}
              title="Đổi tên và vai trò"
            >
              <img
                src={currentIdentity.avatar}
                alt={currentIdentity.name}
                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #0284c7' }}
              />
            </button>
          </>
        ) : (
          /* TRÊN MÁY TÍNH HOẶC TRÊN MOBILE KHI Ở DANH SÁCH KÊNH */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px', minWidth: 0 }}>
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  textDecoration: 'none',
                  color: '#0f172a',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 'bold',
                  padding: isMobile ? '6px 10px' : '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                title="Quay lại Cổng Thông Tin Toàn Trường"
              >
                <ArrowLeft size={15} />
                <span>Trang Chủ</span>
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                <img
                  src="/logo.jpg"
                  alt="Logo THPT Cao Bá Quát"
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #22c55e', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <span style={{ fontSize: isMobile ? '14.5px' : '15px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    CBQ Chat
                  </span>
                  {!isMobile && (
                    <span style={{ fontSize: '11.5px', color: '#64748b', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                      • THPT Cao Bá Quát
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {!isMobile && (
                <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                  Đồng bộ Realtime 24/7
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setCustomNameInput(currentIdentity.name);
                  setCustomRoleInput(currentIdentity.role);
                  setShowIdentityModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '3px 8px' : '4px 12px',
                  borderRadius: '20px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Bấm để đổi tên hiển thị và vai trò"
              >
                <img
                  src={currentIdentity.avatar}
                  alt={currentIdentity.name}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  maxWidth: isMobile ? '100px' : '180px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {currentIdentity.name}
                </span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 'bold',
                  padding: '1px 5px',
                  borderRadius: '6px',
                  backgroundColor: getRoleBadge(currentIdentity.role).bg,
                  color: getRoleBadge(currentIdentity.role).text
                }}>
                  {getRoleBadge(currentIdentity.role).label}
                </span>
              </button>
            </div>
          </>
        )}

      </header>

      {/* Vùng chat toàn màn hình */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {chatMainInterface}
      </div>
    </div>
  );
}
