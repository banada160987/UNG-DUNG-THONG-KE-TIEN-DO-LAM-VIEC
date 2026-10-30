import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, Send, Paperclip, Image, Smile, ThumbsUp, Heart,
  Pin, Bell, Shield, Users, Search, ArrowLeft, MoreVertical,
  CheckCircle2, Clock, Check, RefreshCw, X, Sparkles
} from 'lucide-react';
import { 
  getChatChannels, 
  getMessagesByChannel, 
  sendChatMessage, 
  toggleLikeChatMessage, 
  togglePinChatMessage 
} from '../services/internalChatService';

// Các vai trò thử nghiệm nhanh (Hỗ trợ người dùng trải nghiệm tức thì các góc nhìn)
const DEMO_IDENTITIES = [
  { id: 'admin', name: 'Thầy Hiệu Trưởng (BGH THPT Cao Bá Quát)', role: 'admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
  { id: 'teacher_nam', name: 'Thầy Hoàng Nam (GVCN Lớp 12A1)', role: 'teacher', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  { id: 'parent_hung', name: 'Bác Nguyễn Văn Hùng (Phụ huynh 12A1)', role: 'parent', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'student_quan', name: 'Em Nguyễn Minh Quân (Học sinh 12A1)', role: 'student', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
];

export default function InternalChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const channels = getChatChannels();
  const [activeChannelId, setActiveChannelId] = useState(channels[0].id);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchChannel, setSearchChannel] = useState('');
  
  // Mobile responsive: ở chế độ xem tin nhắn hay danh sách kênh
  const [mobileViewChat, setMobileViewChat] = useState(false);

  // Người gửi hiện tại (Mặc định lấy từ tài khoản đăng nhập hoặc chọn trong danh sách demo)
  const [currentIdentity, setCurrentIdentity] = useState(() => {
    if (user?.email) {
      return {
        id: user.id || user.email,
        name: user.email.includes('admin') ? 'Ban Giám Hiệu THPT Cao Bá Quát' : user.email,
        role: user.email.includes('admin') ? 'admin' : 'teacher',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
      };
    }
    return DEMO_IDENTITIES[0];
  });

  const messagesEndRef = useRef(null);

  // Tải tin nhắn khi đổi kênh
  useEffect(() => {
    async function loadChannelMessages() {
      const data = await getMessagesByChannel(activeChannelId);
      setMessages(data);
    }
    loadChannelMessages();

    // Lắng nghe tin nhắn mới từ tab khác
    const handleSync = () => {
      loadChannelMessages();
    };
    window.addEventListener('cbq-chat-sync', handleSync);
    return () => window.removeEventListener('cbq-chat-sync', handleSync);
  }, [activeChannelId]);

  // Tự cuộn xuống đáy
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  // Gửi tin nhắn
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
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

      setMessages(prev => [...prev, sentMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Thả tim
  const handleLike = async (msgId) => {
    await toggleLikeChatMessage(msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, likesCount: (m.likesCount || 0) + 1 } : m));
  };

  // Lọc kênh
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchChannel.toLowerCase()) ||
    c.description.toLowerCase().includes(searchChannel.toLowerCase())
  );

  // Tin nhắn ghim
  const pinnedMessages = messages.filter(m => m.isPinned);

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

  // Chat window content
  const chatContent = (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 120px)',
      minHeight: '580px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
    }}>
      
      {/* CỘT TRÁI: DANH SÁCH KÊNH (CHANNELS) */}
      <div style={{
        width: mobileViewChat ? '0' : '320px',
        minWidth: mobileViewChat ? '0' : '280px',
        display: mobileViewChat ? 'none' : 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        borderRight: '1px solid #e2e8f0'
      }}>
        {/* Header danh sách kênh */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={18} color="#0284c7" /> Kênh Hội Thoại CBQ
            </div>
          </div>

          {/* Ô tìm kiếm kênh */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm kiếm kênh trao đổi..."
              value={searchChannel}
              onChange={e => setSearchChannel(e.target.value)}
              style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
            />
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          </div>
        </div>

        {/* Bộ chuyển đổi góc nhìn người gửi (Testing Identity Switcher) */}
        <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> ĐANG GỬI TIN DƯỚI TÊN:
          </div>
          <select
            value={currentIdentity.id}
            onChange={e => {
              const found = DEMO_IDENTITIES.find(d => d.id === e.target.value);
              if (found) setCurrentIdentity(found);
            }}
            style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', background: '#ffffff' }}
          >
            {DEMO_IDENTITIES.map(idItem => (
              <option key={idItem.id} value={idItem.id}>
                {idItem.name} ({idItem.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Danh sách các kênh */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredChannels.map(ch => {
            const isActive = ch.id === activeChannel.id;
            return (
              <div
                key={ch.id}
                onClick={() => {
                  setActiveChannelId(ch.id);
                  setMobileViewChat(true);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#e0f2fe' : 'transparent',
                  border: isActive ? '1px solid #7dd3fc' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: isActive ? '800' : '600', color: isActive ? '#0369a1' : '#0f172a' }}>
                    {ch.name}
                  </span>
                  {ch.unreadCount > 0 && !isActive && (
                    <span style={{ backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '10px', padding: '1px 6px', fontSize: '10.5px', fontWeight: 'bold' }}>
                      {ch.unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ch.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
          CBQ Realtime Chat • Bảo mật nội bộ
        </div>
      </div>

      {/* CỘT PHẢI: KHUNG TRÒ CHUYỆN (ACTIVE CHAT ROOM) */}
      <div style={{
        flex: 1,
        display: (!mobileViewChat && window.innerWidth < 768) ? 'none' : 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff'
      }}>
        
        {/* Chat Room Header */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Nút quay lại danh sách kênh trên mobile */}
            <button
              type="button"
              onClick={() => setMobileViewChat(false)}
              style={{
                display: mobileViewChat ? 'flex' : 'none',
                alignItems: 'center',
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
                {activeChannel.name}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                {activeChannel.description}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
              Trực tuyến
            </span>
          </div>
        </div>

        {/* Pinned Announcement Bar */}
        {pinnedMessages.length > 0 && (
          <div style={{ padding: '8px 16px', backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#92400e' }}>
            <Pin size={14} color="#d97706" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>Tin ghim:</strong> {pinnedMessages[0].content}
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map(msg => {
            const isMe = msg.senderId === currentIdentity.id;
            const badge = getRoleBadge(msg.senderRole);

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                {/* Avatar */}
                <img
                  src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={msg.senderName}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #cbd5e1' }}
                />

                {/* Message Bubble Container */}
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  
                  {/* Sender Name & Role Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                      {msg.senderName}
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 'bold',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      backgroundColor: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Bubble Content */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isMe ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                    backgroundColor: isMe ? '#0284c7' : msg.isAnnouncement ? '#fef3c7' : '#ffffff',
                    color: isMe ? '#ffffff' : '#0f172a',
                    border: isMe ? 'none' : msg.isAnnouncement ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                    fontSize: '13.5px',
                    lineHeight: '1.5',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {msg.content}
                  </div>

                  {/* Actions / Likes */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <button
                      type="button"
                      onClick={() => handleLike(msg.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '11px',
                        color: msg.likesCount > 0 ? '#ef4444' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Heart size={12} fill={msg.likesCount > 0 ? '#ef4444' : 'none'} />
                      <span>{msg.likesCount || 0}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Nhập tin nhắn gửi tới ${activeChannel.name}...`}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '24px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            style={{
              padding: '10px 18px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: inputText.trim() ? '#0284c7' : '#e2e8f0',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 'bold',
              cursor: inputText.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={15} /> Gửi
          </button>
        </form>

      </div>

    </div>
  );

  // Nếu người dùng đang trong phiên đăng nhập Admin
  if (user) {
    return (
      <Layout title="Hệ Thống Nhắn Tin Nội Bộ (CBQ Chat)">
        {chatContent}
      </Layout>
    );
  }

  // Nếu truy cập công khai
  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '16px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto 12px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 'bold', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Quay lại Trang Chủ Trường THPT Cao Bá Quát
        </Link>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Phiên bản thử nghiệm tương tác Đa vai trò (BGH - Thầy Cô - Phụ Huynh - Học Sinh)
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {chatContent}
      </div>
    </div>
  );
}
