import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const location = useLocation();

  // Theo dõi kích thước màn hình
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tự động cuộn lên đầu trang khi chuyển Route
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Tìm các container nội dung có thanh cuộn riêng (như mainContent trong Layout Admin)
    const scrollContainers = document.querySelectorAll('main, [class*="mainContent"], [class*="main-content"]');
    scrollContainers.forEach(el => {
      if (el) el.scrollTop = 0;
    });
  }, [location.pathname]);

  // Lắng nghe vị trí cuộn trang để hiện nút và tính % tiến độ
  useEffect(() => {
    const handleScroll = () => {
      // 1. Kiểm tra cuộn của window / document
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const scrollHeight = (document.documentElement.scrollHeight || document.body.scrollHeight || 1) - window.innerHeight;
      
      // 2. Kiểm tra thêm các container nội dung phụ (như trong trang Admin)
      let maxScroll = scrollTop;
      let totalHeight = scrollHeight;

      const scrollContainers = document.querySelectorAll('main, [class*="mainContent"], [class*="main-content"]');
      scrollContainers.forEach(el => {
        if (el && el.scrollTop > maxScroll) {
          maxScroll = el.scrollTop;
          totalHeight = el.scrollHeight - el.clientHeight;
        }
      });

      // Hiển thị nút khi cuộn xuống quá 250px
      const shouldShow = maxScroll > 250;
      setIsVisible(shouldShow);

      // Tính % cuộn trang
      if (totalHeight > 0) {
        const percent = Math.min(100, Math.max(0, Math.round((maxScroll / totalHeight) * 100)));
        setScrollProgress(percent);
      }
    };

    // Lắng nghe cả window và các container con (useCapture = true để bắt mọi sự kiện scroll)
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  // Hàm thực hiện cuộn mượt mà lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });

    // Cuộn các container con nếu có
    const scrollContainers = document.querySelectorAll('main, [class*="mainContent"], [class*="main-content"]');
    scrollContainers.forEach(el => {
      if (el && el.scrollTop > 0) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // Ẩn nút trên các trang chuyên biệt toàn màn hình không cần cuộn trang
  const isExcludedPage = 
    location.pathname === '/chat' || 
    location.pathname === '/tin-nhan' || 
    location.pathname.startsWith('/admin/chat') || 
    location.pathname === '/truyen-lua-led';

  if (isExcludedPage) {
    return null;
  }

  // Bán kính & chu vi vòng tiến độ SVG
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      style={{
        position: 'fixed',
        // Trên điện thoại: Đặt ở góc DƯỚI BÊN TRÁI (tránh đè nút Messenger / Chatbot bên phải)
        // Trên máy tính: Đặt ở góc DƯỚI BÊN PHẢI (ngay bên dưới widget tin nhắn)
        left: isMobile ? '16px' : 'auto',
        right: isMobile ? 'auto' : '24px',
        bottom: isMobile ? '74px' : '24px',
        zIndex: 9980,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.7)',
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fontFamily: '"Inter", sans-serif'
      }}
    >
      <button
        type="button"
        onClick={scrollToTop}
        title={`Quay lên đầu trang (${scrollProgress}%)`}
        aria-label="Quay lên đầu trang"
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          backgroundColor: '#16a34a',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 6px 18px rgba(22, 163, 74, 0.45), 0 2px 6px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: 0,
          transition: 'transform 0.15s ease, background-color 0.15s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.backgroundColor = '#15803d';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = '#16a34a';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.92)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {/* Vòng tròn tiến độ cuộn trang SVG */}
        <svg
          width="46"
          height="46"
          viewBox="0 0 46 46"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotate(-90deg)',
            pointerEvents: 'none'
          }}
        >
          {/* Vòng nền mờ */}
          <circle
            cx="23"
            cy="23"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="2.5"
          />
          {/* Vòng tiến độ thực tế */}
          <circle
            cx="23"
            cy="23"
            r={radius}
            fill="transparent"
            stroke="#fef08a" // Màu vàng gold sang trọng nổi bật trên nền xanh
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>

        {/* Mũi tên hướng lên trên */}
        <ChevronUp size={22} strokeWidth={2.5} style={{ position: 'relative', zIndex: 2 }} />
      </button>
    </div>
  );
}
