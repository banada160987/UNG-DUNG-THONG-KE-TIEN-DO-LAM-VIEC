import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Bot, User, Minimize2, Maximize2, 
  Settings, Sparkles, Brain, BookOpen, Compass, Trash2, 
  Key, Check, ShieldCheck, HelpCircle, RefreshCw, ExternalLink
} from 'lucide-react';
import { 
  PSYCHOLOGY_TOPICS, 
  QUICK_PROMPTS, 
  callGeminiChat, 
  getStoredAiKey, 
  saveStoredAiKey,
  getOfflinePsychologyAnswer 
} from '../utils/aiPsychologyAdvisor';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('psychology');
  
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('cbq_chatbot_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 1,
        sender: 'bot',
        text: 'Chào bạn! Mình là **Trợ lý AI & Cố vấn Tâm lý Học đường** của Trường THPT Cao Bá Quát.\n\nMình có thể đồng hành cùng bạn để giải tỏa áp lực học tập, lo âu thi cử, chia sẻ phương pháp học khoa học (Feynman, Active Recall, Pomodoro) hay định hướng nghề nghiệp. Bạn đang có điều gì băn khoăn cứ chia sẻ với mình nhé! 🌿'
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredAiKey());
  const [saveKeySuccess, setSaveKeySuccess] = useState(false);
  const messagesEndRef = useRef(null);

  // Lưu lịch sử chat vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cbq_chatbot_history', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (textToSend = null) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isTyping) return;

    const userMessage = { id: Date.now(), sender: 'user', text: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Gọi Gemini API hoặc bộ não tâm lý offline
      const result = await callGeminiChat(updatedMessages);

      if (result.success && result.text) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: result.text,
            isAi: true,
            model: result.model
          }
        ]);
      } else {
        // Fallback từ tri thức tâm lý học đường
        const fallback = result.fallbackText || getOfflinePsychologyAnswer(messageText);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: fallback,
            isAi: false
          }
        ]);
      }
    } catch (err) {
      const fallback = getOfflinePsychologyAnswer(messageText);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: fallback,
          isAi: false
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn làm mới cuộc trò chuyện này không?')) {
      const initial = [
        {
          id: Date.now(),
          sender: 'bot',
          text: 'Chào bạn! Cuộc trò chuyện đã được làm mới. Hãy chia sẻ với mình bất kỳ câu hỏi nào về tâm lý, bài học hoặc định hướng tương lai nhé! 🌸'
        }
      ];
      setMessages(initial);
      localStorage.removeItem('cbq_chatbot_history');
    }
  };

  const handleSaveApiKey = () => {
    saveStoredAiKey(apiKeyInput);
    setSaveKeySuccess(true);
    setTimeout(() => {
      setSaveKeySuccess(false);
      setShowSettingsModal(false);
    }, 1200);
  };

  // Helper định dạng văn bản Markdown cơ bản
  const formatMessageText = (rawText) => {
    if (!rawText) return '';
    return rawText.split('\n').map((line, idx) => {
      // Heading level 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ margin: '8px 0 4px 0', fontSize: '14.5px', fontWeight: '800', color: '#1e3a8a' }}>
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Heading level 4
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} style={{ margin: '6px 0 3px 0', fontSize: '13.5px', fontWeight: '800', color: '#0369a1' }}>
            {line.replace('#### ', '')}
          </h5>
        );
      }
      // Bullet point
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '6px', margin: '3px 0', paddingLeft: '4px' }}>
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>•</span>
            <span>{renderInlineStyles(line.substring(2))}</span>
          </div>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} style={{ margin: '3px 0', paddingLeft: '4px' }}>
            {renderInlineStyles(line)}
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      // Regular line
      return (
        <p key={idx} style={{ margin: '3px 0', lineHeight: '1.5' }}>
          {renderInlineStyles(line)}
        </p>
      );
    });
  };

  const renderInlineStyles = (str) => {
    // Tách bold **text** và code `code`
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', color: '#dc2626', fontFamily: 'monospace' }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Nút tròn nổi khi đóng widget
  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
        <button 
          onClick={() => setIsOpen(true)}
          title="Mở Trợ lý AI & Cố vấn Tâm lý Học đường CBQ"
          style={{
            position: 'relative',
            width: '62px',
            height: '62px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #8b5cf6 100%)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5), 0 0 15px rgba(139, 92, 246, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
          }}
        >
          <Brain size={28} style={{ color: '#ffffff' }} />
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: '#10b981',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
          }} />
        </button>
      </div>
    );
  }

  // Cửa sổ Chatbot chính
  const currentKey = getStoredAiKey();
  const currentPrompts = QUICK_PROMPTS.filter(p => p.topic === selectedTopic);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: isExpanded ? 'calc(100vw - 48px)' : '420px',
      maxWidth: isExpanded ? '920px' : '440px',
      height: isMinimized ? 'auto' : (isExpanded ? 'calc(90vh - 48px)' : '620px'),
      maxHeight: isExpanded ? '88vh' : '82vh',
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 99999,
      overflow: 'hidden',
      transition: 'all 0.25s ease-in-out'
    }}>
      
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #7c3aed 100%)',
        padding: '14px 18px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <Brain size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Trợ Lý AI & Tâm Lý CBQ
              {currentKey ? (
                <span title="Đã kết nối Gemini AI trực tiếp" style={{ fontSize: '10px', backgroundColor: '#10b981', padding: '1px 6px', borderRadius: '8px', fontWeight: '800' }}>
                  AI LIVE
                </span>
              ) : (
                <span title="Đang chạy chế độ Tri thức Chuyên gia Tâm lý CBQ" style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.25)', padding: '1px 6px', borderRadius: '8px', fontWeight: '700' }}>
                  EXPERT
                </span>
              )}
            </div>
            <div style={{ fontSize: '11.5px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} />
              <span>Phòng Tư Vấn & Cố Vấn Học Đường</span>
            </div>
          </div>
        </div>

        {/* Action icons on header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            type="button"
            onClick={handleClearHistory}
            title="Làm mới cuộc trò chuyện"
            style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            <Trash2 size={15} />
          </button>
          
          <button 
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title="Cài đặt API Key (Google Gemini AI)"
            style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            <Settings size={15} />
          </button>

          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button 
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>—</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            title="Đóng widget"
            style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* BODY CONTENT (when not minimized) */}
      {!isMinimized && (
        <>
          {/* TOP TOPIC PILLS (CHỦ ĐỀ TƯ VẤN) */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '8px 12px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {PSYCHOLOGY_TOPICS.map(topic => {
              const isActive = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopic(topic.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '20px',
                    border: isActive ? `1.5px solid ${topic.color}` : '1px solid #cbd5e1',
                    backgroundColor: isActive ? '#ffffff' : '#f1f5f9',
                    color: isActive ? topic.color : '#475569',
                    fontSize: '11.5px',
                    fontWeight: isActive ? '800' : '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <span>{topic.icon}</span>
                  <span>{topic.name}</span>
                </button>
              );
            })}
          </div>

          {/* QUICK PROMPT SUGGESTIONS */}
          <div style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            padding: '8px 12px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Sparkles size={12} color="#f59e0b" /> Gợi ý:
            </span>
            {currentPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isTyping}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: '1px solid #e0e7ff',
                  backgroundColor: '#eef2ff',
                  color: '#4338ca',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* MESSAGES SCROLL AREA */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.map((msg, i) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id || i} style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  maxWidth: isExpanded ? '75%' : '88%'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    flexShrink: 0,
                    background: isUser ? '#3b82f6' : 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    marginTop: '2px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}>
                    {isUser ? <User size={16} /> : <Brain size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    padding: '11px 15px',
                    borderRadius: '16px',
                    background: isUser ? '#2563eb' : '#ffffff',
                    color: isUser ? '#ffffff' : '#1e293b',
                    boxShadow: isUser ? '0 2px 8px rgba(37, 99, 235, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    fontSize: '13.5px',
                    lineHeight: '1.5',
                    borderBottomRightRadius: isUser ? '4px' : '16px',
                    borderBottomLeftRadius: isUser ? '16px' : '4px',
                    border: isUser ? 'none' : '1px solid #e2e8f0',
                    wordBreak: 'break-word'
                  }}>
                    {!isUser && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1' }}>
                          Trợ lý Tâm lý & Học đường CBQ
                        </span>
                        {msg.model && (
                          <span style={{ fontSize: '9.5px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                            {msg.model}
                          </span>
                        )}
                      </div>
                    )}
                    {formatMessageText(msg.text)}
                  </div>
                </div>
              );
            })}

            {/* TYPING INDICATOR */}
            {isTyping && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Brain size={16} />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', borderBottomLeftRadius: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    Trợ lý AI đang suy nghĩ lời khuyên...
                  </span>
                  <div className="cbq-typing-dot" style={{ animationDelay: '0s' }} />
                  <div className="cbq-typing-dot" style={{ animationDelay: '0.2s' }} />
                  <div className="cbq-typing-dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* PRIVACY & SECURITY BANNER */}
          <div style={{
            padding: '4px 14px',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #e2e8f0',
            fontSize: '11px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#10b981" /> Ẩn danh & Bảo mật dữ liệu học sinh
            </span>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              THPT Cao Bá Quát
            </span>
          </div>

          {/* FOOTER INPUT */}
          <div style={{ padding: '10px 14px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
              placeholder="Chia sẻ lo lắng, hỏi bài tập, hỏi TKB..."
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '24px',
                border: '1.5px solid #cbd5e1',
                outline: 'none',
                fontSize: '13.5px',
                transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
            <button 
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: input.trim() && !isTyping ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : '#e2e8f0',
                color: 'white',
                border: 'none',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: input.trim() && !isTyping ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Send size={18} style={{ marginLeft: '2px' }} />
            </button>
          </div>
        </>
      )}

      {/* MODAL CÀI ĐẶT API KEY (GOOGLE GEMINI) */}
      {showSettingsModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '380px',
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#2563eb" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e3a8a' }}>
                  CÀI ĐẶT GOOGLE GEMINI AI
                </h4>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSettingsModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.5', margin: '0 0 12px 0' }}>
              Nhập <strong>Google Gemini API Key</strong> để kích hoạt mô hình AI thế hệ mới (Gemini 1.5 Flash / Pro). Nếu để trống, hệ thống sẽ tự động dùng <strong>Bộ Tri Thức Tâm Lý Học Đường Offline</strong> có sẵn.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                Gemini API Key:
              </label>
              <input 
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ backgroundColor: '#eff6ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '11.5px', color: '#1e40af', marginBottom: '16px', lineHeight: '1.4' }}>
              💡 Bạn có thể lấy API Key hoàn toàn miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>Google AI Studio <ExternalLink size={11} /></a> bằng tài khoản Gmail của mình.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}
              >
                Đóng
              </button>
              <button 
                type="button"
                onClick={handleSaveApiKey}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}
              >
                {saveKeySuccess ? <Check size={14} /> : null}
                {saveKeySuccess ? 'Đã Lưu!' : 'Lưu API Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES FOR TYPING ANIMATION */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes cbqTyping {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .cbq-typing-dot {
          width: 5px;
          height: 5px;
          background-color: #6366f1;
          border-radius: 50%;
          animation: cbqTyping 1s infinite ease-in-out;
        }
      `}} />
    </div>
  );
}
