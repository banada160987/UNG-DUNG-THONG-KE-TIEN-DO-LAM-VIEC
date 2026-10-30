import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, MessageCircle, X, ExternalLink, 
  ShieldCheck, FileBadge, ChevronUp, ChevronDown, Sparkles 
} from 'lucide-react';
import { getSocialConfig, openFacebookMessenger, openZaloOa } from '../services/facebookService';

export default function FacebookMessengerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const socialConfig = getSocialConfig();

  // Ẩn nút nổi khi đang ở trong phòng chat nội bộ hoặc màn hình sân khấu để tránh che nội dung
  const isChatOrFullscreen = location.pathname === '/chat' || 
    location.pathname === '/tin-nhan' || 
    location.pathname.startsWith('/admin/chat') || 
    location.pathname === '/truyen-lua-led';

  if (isChatOrFullscreen) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', right: '20px', bottom: '86px', zIndex: 9990, fontFamily: '"Inter", sans-serif' }}>
      
      {/* POPUP MENU TIỆN ÍCH */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '64px',
          right: '0',
          width: '300px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* Header Popup */}
          <div style={{
            background: 'linear-gradient(135deg, #0084ff 0%, #0068ff 100%)',
            color: '#ffffff',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} color="#fed7aa" /> TƯƠNG TÁC HỌC ĐƯỜNG
              </div>
              <div style={{ fontSize: '11px', color: '#e0f2fe' }}>
                THPT Cao Bá Quát • Hỗ trợ 24/7
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Links List */}
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* 1. Chat Messenger Facebook Fanpage */}
            <button
              type="button"
              onClick={() => {
                openFacebookMessenger();
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e0f2fe',
                backgroundColor: '#f0f9ff',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #00B2FE 0%, #006AFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                <MessageCircle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1' }}>
                  Chat Facebook Fanpage
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Nhắn tin với BQT Fanpage Nhà trường
                </div>
              </div>
            </button>

            {/* 2. Chat Zalo OA Trường */}
            <button
              type="button"
              onClick={() => {
                openZaloOa();
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #dbeafe',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0068ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                <MessageSquare size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0068ff' }}>
                  Zalo OA THPT Cao Bá Quát
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Nhận tin nhắn & Dịch vụ công qua Zalo
                </div>
              </div>
            </button>

            {/* 3. Cổng Dịch Vụ Công 1-Chạm */}
            <Link
              to="/dich-vu-cong"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                <FileBadge size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#15803d' }}>
                  Cổng Dịch Vụ Công 4.0
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Xin giấy xác nhận, nghỉ phép, sao y học bạ
                </div>
              </div>
            </Link>

            {/* 4. Nhắn tin nội bộ CBQ Chat */}
            <Link
              to="/chat"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #fed7aa',
                backgroundColor: '#fff7ed',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                <MessageSquare size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#c2410c' }}>
                  Kênh Chat Nội Bộ Trường
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Hội thoại Thầy Cô, Phụ Huynh, Học Sinh
                </div>
              </div>
            </Link>

          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0084ff 0%, #0068ff 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(0, 104, 255, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'rotate(90deg) scale(1.05)' : 'scale(1)'
        }}
        title="Tương tác nhanh: Facebook Messenger, Zalo OA, Dịch vụ công"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

    </div>
  );
}
