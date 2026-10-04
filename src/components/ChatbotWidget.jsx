import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MessageSquare, X, Send, Bot, User, Minimize2, Maximize2, 
  Settings, Sparkles, Brain, BookOpen, Compass, Trash2, 
  Key, Check, ShieldCheck, HelpCircle, RefreshCw, ExternalLink,
  Mail, Heart, Shield, AlertTriangle, CheckCircle2, Wand2,
  Lock, Loader2
} from 'lucide-react';
import { 
  PSYCHOLOGY_TOPICS, 
  QUICK_PROMPTS, 
  ASPIRATION_CATEGORIES,
  callGeminiChat, 
  getStoredAiKey, 
  saveStoredAiKey,
  getOfflinePsychologyAnswer,
  submitStudentAspiration,
  polishAspirationWithAi
} from '../utils/aiPsychologyAdvisor';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('psychology');
  
  // State Hòm Thư Tâm Tư & Nguyện Vọng Gửi BGH
  const [showAspirationModal, setShowAspirationModal] = useState(false);
  const [aspirationContent, setAspirationContent] = useState('');
  const [aspirationCategory, setAspirationCategory] = useState('co_so_vat_chat');
  const [aspirationUrgency, setAspirationUrgency] = useState('Bình thường');
  const [aspirationIsAnonymous, setAspirationIsAnonymous] = useState(true);
  const [aspirationStudentName, setAspirationStudentName] = useState('');
  const [aspirationClassName, setAspirationClassName] = useState('');
  const [aspirationPhone, setAspirationPhone] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSubmittingAspiration, setIsSubmittingAspiration] = useState(false);
  const [aspirationSuccess, setAspirationSuccess] = useState(false);

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

  // Đóng modal khi nhấn ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showAspirationModal && !isSubmittingAspiration) setShowAspirationModal(false);
        if (showSettingsModal) setShowSettingsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAspirationModal, showSettingsModal, isSubmittingAspiration]);

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

  // Xử lý gửi Tâm tư & Nguyện vọng tới BGH
  const handleAspirationSubmit = async (e) => {
    e?.preventDefault();
    if (!aspirationContent.trim()) {
      alert('Vui lòng nhập nội dung tâm tư, ý kiến hoặc nguyện vọng của em!');
      return;
    }

    setIsSubmittingAspiration(true);
    try {
      await submitStudentAspiration({
        content: aspirationContent,
        category: aspirationCategory,
        urgency: aspirationUrgency,
        isAnonymous: aspirationIsAnonymous,
        studentName: aspirationStudentName,
        className: aspirationClassName,
        phone: aspirationPhone
      });

      const catObj = ASPIRATION_CATEGORIES.find(c => c.id === aspirationCategory);
      setAspirationSuccess(true);

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'bot',
            text: `💌 **Tâm tư của bạn đã được chuyển tới Ban Giám Hiệu thành công!**\n\n* **Chủ đề:** ${catObj?.label || 'Tâm tư học sinh'}\n* **Mức độ:** ${aspirationUrgency}\n* **Hình thức:** ${aspirationIsAnonymous ? '🔒 Ẩn danh bảo mật' : `Học sinh: ${aspirationStudentName} (${aspirationClassName})`}\n* **Trạng thái:** ⚡ Đã báo chuông LIVE tới Cổng Quản trị BGH\n\nThầy Cô trong Ban Giám Hiệu và Đoàn trường đã nhận được thông báo chuông và sẽ sớm xem xét, giải quyết. Cảm ơn em rất nhiều vì đã tin tưởng và góp ý xây dựng nhà trường! 🌿`,
            isAi: false
          }
        ]);
        setAspirationSuccess(false);
        setShowAspirationModal(false);
        setAspirationContent('');
        setAspirationStudentName('');
        setAspirationClassName('');
        setAspirationPhone('');
      }, 1400);
    } catch (err) {
      alert('Không thể gửi tâm tư: ' + err.message + '. Vui lòng kiểm tra lại!');
    } finally {
      setIsSubmittingAspiration(false);
    }
  };

  // Nhờ AI trau chuốt văn phong
  const handlePolishAspiration = async () => {
    if (!aspirationContent.trim()) {
      alert('Em hãy viết vài câu nháp ý kiến trước rồi nhờ AI trau chuốt nhé!');
      return;
    }
    setIsPolishing(true);
    try {
      const polished = await polishAspirationWithAi(aspirationContent, aspirationCategory);
      if (polished) {
        setAspirationContent(polished);
      }
    } catch (err) {
      console.warn('Lỗi trau chuốt AI:', err);
    } finally {
      setIsPolishing(false);
    }
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
        const codeText = part.slice(1, -1);
        if (codeText.includes('[💌 Gửi BGH]') || codeText.includes('Gửi BGH')) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => setShowAspirationModal(true)}
              style={{
                backgroundColor: '#e11d48',
                color: '#ffffff',
                border: 'none',
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                margin: '2px 4px',
                boxShadow: '0 2px 6px rgba(225, 29, 72, 0.35)'
              }}
            >
              <Mail size={12} /> {codeText}
            </button>
          );
        }
        return (
          <code key={i} style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', color: '#dc2626', fontFamily: 'monospace' }}>
            {codeText}
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
            onClick={() => setShowAspirationModal(true)}
            title="Gửi tâm tư & nguyện vọng trực tiếp tới Ban Giám Hiệu"
            style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '5px 9px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '800',
              boxShadow: '0 2px 6px rgba(225, 29, 72, 0.35)'
            }}
          >
            <Mail size={13} />
            <span>Gửi BGH</span>
          </button>

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
                onClick={() => {
                  if (qp.action === 'open_aspiration_modal') {
                    setShowAspirationModal(true);
                  } else {
                    handleSendMessage(qp.prompt);
                  }
                }}
                disabled={isTyping}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: qp.action === 'open_aspiration_modal' ? '1px solid #fecdd3' : '1px solid #e0e7ff',
                  backgroundColor: qp.action === 'open_aspiration_modal' ? '#fff1f2' : '#eef2ff',
                  color: qp.action === 'open_aspiration_modal' ? '#e11d48' : '#4338ca',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  boxShadow: qp.action === 'open_aspiration_modal' ? '0 1px 4px rgba(225,29,72,0.15)' : 'none'
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

      {/* MODAL HÒM THƯ TÂM TƯ & NGUYỆN VỌNG HỌC SINH (GỬI BGH) - FULL SCREEN PRO PORTAL */}
      {showAspirationModal && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingAspiration) {
              setShowAspirationModal(false);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999999,
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            overflow: 'hidden',
            animation: 'cbqModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box'
          }}>
            {/* Header Sang Trọng */}
            <div style={{
              background: 'linear-gradient(135deg, #881337 0%, #be123c 45%, #e11d48 100%)',
              padding: '20px 24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(136, 19, 55, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255, 255, 255, 0.35)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  <Mail size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', letterSpacing: '0.3px', color: '#ffffff' }}>
                      HÒM THƯ TÂM TƯ & NGUYỆN VỌNG
                    </h3>
                    <span style={{
                      fontSize: '10.5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      letterSpacing: '0.2px'
                    }}>
                      BGH LẮNG NGHE
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.4' }}>
                    Kênh kết nối trực tiếp & bảo mật với Ban Giám Hiệu & Đoàn Trường THPT Cao Bá Quát
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setShowAspirationModal(false)}
                title="Đóng hộp thư (Esc)"
                style={{
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.18)',
                  cursor: 'pointer',
                  color: '#ffffff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.32)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nội Dung Body */}
            {aspirationSuccess ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px auto',
                  color: '#15803d',
                  boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.3)'
                }}>
                  <CheckCircle2 size={44} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#166534', margin: '0 0 10px 0' }}>
                  Đã Chuyển Tâm Tư Tới Ban Giám Hiệu!
                </h3>
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', maxWidth: '480px', margin: '0 auto 20px auto' }}>
                  Thông báo đã được phát chuông tới Cổng Quản trị BGH theo thời gian thực. Thầy Cô sẽ đọc và lắng nghe tâm tư của em trong thời gian sớm nhất.
                </p>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 20px', fontSize: '13px', color: '#15803d', fontWeight: '600' }}>
                  🌿 Cảm ơn em đã tin tưởng và góp ý xây dựng Trường THPT Cao Bá Quát!
                </div>
              </div>
            ) : (
              <form onSubmit={handleAspirationSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
                <div style={{
                  padding: '22px 24px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}>
                  {/* 1. Chọn chế độ danh tính (2 Radio cards lớn, sang trọng) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                        1. Em muốn gửi ý kiến theo hình thức nào?
                      </label>
                      <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Bảo mật tuyệt đối
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {/* Thẻ Ẩn danh */}
                      <div
                        onClick={() => setAspirationIsAnonymous(true)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '14px',
                          border: aspirationIsAnonymous ? '2px solid #059669' : '1.5px solid #e2e8f0',
                          backgroundColor: aspirationIsAnonymous ? '#ecfdf5' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                          boxShadow: aspirationIsAnonymous ? '0 4px 14px rgba(5, 150, 105, 0.12)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: aspirationIsAnonymous ? '#d1fae5' : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: aspirationIsAnonymous ? '#059669' : '#64748b',
                          flexShrink: 0
                        }}>
                          <Shield size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '800', color: aspirationIsAnonymous ? '#065f46' : '#334155' }}>
                              🔒 Ẩn danh bảo mật 100%
                            </span>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: aspirationIsAnonymous ? '5px solid #059669' : '2px solid #cbd5e1',
                              backgroundColor: '#ffffff'
                            }} />
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: aspirationIsAnonymous ? '#047857' : '#64748b', lineHeight: '1.4' }}>
                            Hệ thống không lưu họ tên em. Thoải mái chia sẻ chân thành mà không e ngại bất cứ điều gì.
                          </p>
                        </div>
                      </div>

                      {/* Thẻ Ghi danh tính */}
                      <div
                        onClick={() => setAspirationIsAnonymous(false)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '14px',
                          border: !aspirationIsAnonymous ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                          backgroundColor: !aspirationIsAnonymous ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                          boxShadow: !aspirationIsAnonymous ? '0 4px 14px rgba(37, 99, 235, 0.12)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: !aspirationIsAnonymous ? '#dbeafe' : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: !aspirationIsAnonymous ? '#2563eb' : '#64748b',
                          flexShrink: 0
                        }}>
                          <User size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '800', color: !aspirationIsAnonymous ? '#1e40af' : '#334155' }}>
                              👤 Ghi rõ họ tên & lớp
                            </span>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: !aspirationIsAnonymous ? '5px solid #2563eb' : '2px solid #cbd5e1',
                              backgroundColor: '#ffffff'
                            }} />
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: !aspirationIsAnonymous ? '#1d4ed8' : '#64748b', lineHeight: '1.4' }}>
                            Để Ban Giám Hiệu & Thầy Cô nắm rõ và tiện liên hệ phản hồi, hỗ trợ riêng cho em khi cần.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trường nhập thông tin */}
                    {!aspirationIsAnonymous ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                            Họ và tên của em: <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input 
                            type="text"
                            required
                            value={aspirationStudentName}
                            onChange={e => setAspirationStudentName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn An"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                            Lớp học: <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input 
                            type="text"
                            required
                            value={aspirationClassName}
                            onChange={e => setAspirationClassName(e.target.value)}
                            placeholder="Ví dụ: 10A1, 11A3, 12A8..."
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                            Số ĐT / Zalo (Tùy chọn):
                          </label>
                          <input 
                            type="text"
                            value={aspirationPhone}
                            onChange={e => setAspirationPhone(e.target.value)}
                            placeholder="Số để Thầy Cô liên hệ riêng..."
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '10px', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>
                          Khối / Lớp (Tùy chọn):
                        </label>
                        <input 
                          type="text"
                          value={aspirationClassName}
                          onChange={e => setAspirationClassName(e.target.value)}
                          placeholder="Ví dụ: Khối 10, Lớp 11A2 (hoặc để trống nếu muốn ẩn hoàn toàn)..."
                          style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Chọn chủ đề tâm tư / nguyện vọng */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                      2. Chủ đề em muốn chia sẻ hoặc phản ánh:
                    </label>
                    <select
                      value={aspirationCategory}
                      onChange={e => setAspirationCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: '#1e293b',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      {ASPIRATION_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const currentCat = ASPIRATION_CATEGORIES.find(c => c.id === aspirationCategory);
                      return currentCat ? (
                        <p style={{ margin: '5px 0 0 2px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                          💡 Gợi ý: {currentCat.desc}
                        </p>
                      ) : null;
                    })()}
                  </div>

                  {/* 3. Mức độ cần Ban Giám Hiệu hỗ trợ (3 nút ngang thoáng đãng) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                      3. Mức độ cần Nhà Trường quan tâm & hỗ trợ:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {[
                        { id: 'Bình thường', label: '🟢 Bình thường', desc: 'Góp ý, chia sẻ ý tưởng', color: '#10b981', bg: '#f0fdf4', border: '#10b981' },
                        { id: 'Cần quan tâm', label: '🟡 Cần quan tâm', desc: 'Thầy Cô lắng nghe & tháo gỡ', color: '#d97706', bg: '#fffbeb', border: '#f59e0b' },
                        { id: 'Khẩn cấp', label: '🚨 Khẩn cấp', desc: 'Cần can thiệp gấp / an toàn', color: '#e11d48', bg: '#fff1f2', border: '#e11d48' }
                      ].map(item => {
                        const isSel = aspirationUrgency === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAspirationUrgency(item.id)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '12px',
                              border: isSel ? `2px solid ${item.border}` : '1.5px solid #e2e8f0',
                              backgroundColor: isSel ? item.bg : '#ffffff',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease',
                              boxShadow: isSel ? `0 4px 12px ${item.bg}` : 'none'
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '800', color: isSel ? item.color : '#334155' }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '11px', color: isSel ? item.color : '#94a3b8', marginTop: '2px', fontWeight: '500' }}>
                              {item.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Khung nội dung tâm tư */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                        4. Nội dung tâm tư, ý kiến hoặc nguyện vọng: <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handlePolishAspiration}
                        disabled={isPolishing || !aspirationContent.trim()}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isPolishing || !aspirationContent.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: isPolishing || !aspirationContent.trim() ? '#94a3b8' : '#ffffff',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: isPolishing || !aspirationContent.trim() ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: isPolishing || !aspirationContent.trim() ? 'none' : '0 3px 10px rgba(99, 102, 241, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                        title="Nhờ AI trau chuốt câu từ lịch sự, khúc chiết, chuẩn mực học trò gửi Thầy Cô"
                      >
                        {isPolishing ? <Loader2 size={13} className="cbq-spin" /> : <Sparkles size={13} />}
                        <span>{isPolishing ? 'AI Đang Trau Chuốt...' : '✨ AI Trau Chuốt Lời Văn'}</span>
                      </button>
                    </div>

                    <textarea 
                      rows={6}
                      required
                      value={aspirationContent}
                      onChange={e => setAspirationContent(e.target.value)}
                      placeholder="Em xin kính gửi tâm tư, trăn trở, phản ánh hoặc đề xuất tới Ban Giám Hiệu..."
                      style={{
                        width: '100%',
                        minHeight: '130px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        lineHeight: '1.6',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.15s ease'
                      }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11.5px', color: '#64748b' }}>
                      <span>💡 Em có thể viết ý nháp tự nhiên, sau đó bấm <strong>AI Trau Chuốt</strong> để hoàn thiện lời văn.</span>
                      <span>{aspirationContent.length} ký tự</span>
                    </div>
                  </div>

                  {/* Cam kết bảo mật & Trách nhiệm */}
                  <div style={{
                    backgroundColor: '#ecfdf5',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #a7f3d0',
                    fontSize: '12px',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    lineHeight: '1.5'
                  }}>
                    <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Bảo đảm từ Nhà trường:</strong> Hòm thư được kết nối trực tiếp vào Cổng Quản trị của Ban Giám Hiệu. Nhà trường cam kết lắng nghe chân thành, thấu cảm và giữ kín danh tính của học sinh.
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  padding: '16px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                    <span>Hệ thống trực tuyến 24/7</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button"
                      onClick={() => setShowAspirationModal(false)}
                      disabled={isSubmittingAspiration}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        color: '#475569',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Hủy Bỏ
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingAspiration || !aspirationContent.trim()}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isSubmittingAspiration || !aspirationContent.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                        color: '#ffffff',
                        fontSize: '13.5px',
                        fontWeight: '800',
                        cursor: isSubmittingAspiration || !aspirationContent.trim() ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: isSubmittingAspiration || !aspirationContent.trim() ? 'none' : '0 4px 15px rgba(225, 29, 72, 0.4)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSubmittingAspiration ? <Loader2 size={16} className="cbq-spin" /> : null}
                      <span>{isSubmittingAspiration ? 'Đang Chuyển Tới BGH...' : '🚀 Gửi Tới Ban Giám Hiệu'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL CÀI ĐẶT GEMINI AI - PRO PORTAL */}
      {showSettingsModal && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsModal(false);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999999,
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            overflow: 'hidden',
            animation: 'cbqModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              padding: '18px 22px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Key size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>
                    CÀI ĐẶT GOOGLE GEMINI AI
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Kết nối AI thế hệ mới cho học sinh CBQ
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSettingsModal(false)}
                style={{
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.18)',
                  cursor: 'pointer',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '22px' }}>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                Nhập <strong>Google Gemini API Key</strong> để kích hoạt AI đàm thoại trực tiếp (Gemini 1.5 Flash / Pro). Nếu để trống, hệ thống sẽ tự động dùng <strong>Bộ Tri Thức Tâm Lý Học Đường Offline</strong> có sẵn.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  Gemini API Key:
                </label>
                <input 
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af', marginBottom: '20px', lineHeight: '1.5' }}>
                💡 Bạn có thể lấy API Key hoàn toàn miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>Google AI Studio <ExternalLink size={12} /></a> bằng tài khoản Gmail của mình.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
                >
                  Đóng
                </button>
                <button 
                  type="button"
                  onClick={handleSaveApiKey}
                  style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(37, 99, 235, 0.35)' }}
                >
                  {saveKeySuccess ? <Check size={16} /> : null}
                  {saveKeySuccess ? 'Đã Lưu Thành Công!' : 'Lưu API Key'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* STYLES FOR ANIMATIONS */}
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
        @keyframes cbqModalPop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cbqSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .cbq-spin {
          animation: cbqSpin 0.85s linear infinite;
        }
      `}} />
    </div>
  );
}
