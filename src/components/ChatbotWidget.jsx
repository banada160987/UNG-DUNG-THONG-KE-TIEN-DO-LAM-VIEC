import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Chào bạn! Mình là Trợ lý AI của Trường THPT Cao Bá Quát. Mình có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock API Response
    setTimeout(() => {
      let botResponse = 'Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có thể nói rõ hơn được không?';
      const lowercaseInput = userMessage.text.toLowerCase();

      if (lowercaseInput.includes('lịch học') || lowercaseInput.includes('thời khóa biểu')) {
        botResponse = 'Lịch học tuần này đã được cập nhật trên bảng tin trường. Khối 12 sẽ bắt đầu học chuyên đề buổi chiều từ thứ 3 nhé.';
      } else if (lowercaseInput.includes('vé xe') || lowercaseInput.includes('gửi xe') || lowercaseInput.includes('đăng ký xe')) {
        botResponse = 'Để đăng ký gửi xe, bạn vui lòng truy cập menu "Đăng Ký Xe Máy" trên hệ thống để điền form trực tuyến nhé.';
      } else if (lowercaseInput.includes('hiệu trưởng') || lowercaseInput.includes('liên hệ')) {
        botResponse = 'Bạn có thể gửi ý kiến trực tiếp cho Ban Giám Hiệu thông qua mục "Góp Ý 24/7" trên hệ thống.';
      } else if (lowercaseInput.includes('chào') || lowercaseInput.includes('hello')) {
        botResponse = 'Chào bạn! Chúc bạn một ngày học tập và làm việc hiệu quả.';
      }

      setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageSquare size={30} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: isMinimized ? '24px' : '24px',
      right: '24px',
      width: '350px',
      height: isMinimized ? 'auto' : '500px',
      maxHeight: '80vh',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '16px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Trợ lý AI CBQ</div>
            <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '3px', background: '#4ade80' }}></div>
              Trực tuyến
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <>
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                maxWidth: '85%'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '14px', flexShrink: 0,
                  background: msg.sender === 'user' ? '#e2e8f0' : '#1e40af',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: msg.sender === 'user' ? '#64748b' : 'white'
                }}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '16px',
                  background: msg.sender === 'user' ? '#3b82f6' : 'white',
                  color: msg.sender === 'user' ? 'white' : '#1e293b',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                  border: msg.sender === 'bot' ? '1px solid #e2e8f0' : 'none'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', maxWidth: '85%' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '14px', background: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Bot size={16} />
                </div>
                <div style={{ padding: '12px 14px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', gap: '4px', borderBottomLeftRadius: '4px' }}>
                  <div className="typing-dot"></div>
                  <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div style={{ padding: '12px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi của bạn..."
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                background: input.trim() ? '#3b82f6' : '#e2e8f0',
                color: 'white',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              <Send size={18} style={{ marginLeft: '2px' }} />
            </button>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #94a3b8;
          border-radius: 3px;
          animation: typing 1s infinite;
        }
      `}} />
    </div>
  );
}
