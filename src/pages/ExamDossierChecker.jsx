import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ExternalLink, RefreshCw, Maximize2, Minimize2, 
  CheckCircle2, ShieldAlert, Sparkles, FileSpreadsheet, Home, 
  Users, Award, HelpCircle
} from 'lucide-react';

export default function ExamDossierChecker() {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleRefresh = () => {
    setIframeKey(Date.now());
  };

  const handleOpenNewTab = () => {
    window.open('/tools/kiem-tra-ho-so-tn/index.html', '_blank');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. TOP TOOLBAR */}
      {!isFullscreen && (
        <header style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#94a3b8',
                border: '1px solid #334155',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <ArrowLeft size={16} /> Quay Lại
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}>
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.2px' }}>
                  HỆ THỐNG KIỂM TRA HỒ SƠ ĐĂNG KÝ THI TỐT NGHIỆP THPT
                </h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  Đối chiếu CCCD, Giới tính, 54 Dân tộc, Quy tắc 2+2 Môn thi GDPT 2018 & Phân công Giám thị
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowGuideModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245,158,11,0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.3)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <HelpCircle size={15} /> Hướng Dẫn Quy Tắc
            </button>

            <button
              onClick={handleRefresh}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Tải lại ứng dụng"
            >
              <RefreshCw size={15} /> Làm Mới
            </button>

            <button
              onClick={() => setIsFullscreen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Toàn màn hình"
            >
              <Maximize2 size={15} /> Toàn Màn Hình
            </button>

            <button
              onClick={handleOpenNewTab}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(37,99,235,0.4)'
              }}
            >
              <ExternalLink size={15} /> Mở Tab Mới
            </button>
          </div>
        </header>
      )}

      {/* FLOATING CONTROLS IN FULLSCREEN MODE */}
      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          gap: '8px',
          backgroundColor: 'rgba(15,23,42,0.85)',
          padding: '6px 10px',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={handleRefresh}
            style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
          <button
            onClick={() => setIsFullscreen(false)}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
          >
            <Minimize2 size={14} /> Thu nhỏ
          </button>
        </div>
      )}

      {/* 2. EMBEDDED WEB APP CONTAINER */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: isFullscreen ? '100vh' : 'calc(100vh - 65px)' }}>
        <iframe
          key={iframeKey}
          src="/tools/kiem-tra-ho-so-tn/index.html"
          title="Tool Kiểm Tra Hồ Sơ Đăng Ký Thi TN THPT"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          allow="camera; clipboard-read; clipboard-write"
        />
      </div>

      {/* 3. MODAL HƯỚNG DẪN QUY TẮC KIỂM TRA HỒ SƠ */}
      {showGuideModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '18px',
            padding: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={22} color="#fbbf24" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Quy Tắc Kiểm Tra Hồ Sơ Thi TN THPT (GDPT 2018)
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13.5px', lineHeight: '1.7', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(2,132,199,0.15)', border: '1px solid rgba(2,132,199,0.3)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ color: '#38bdf8' }}>1. Quy tắc CCCD 12 Số & Đối chiếu logic:</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Đủ 12 chữ số, mã 3 số đầu hợp lệ theo 63 tỉnh thành Việt Nam.</li>
                  <li>Ký tự thứ 4 đại diện cho thế kỷ sinh và giới tính (Nam thế kỷ 20: 0, Nữ: 1; Nam thế kỷ 21: 2, Nữ: 3).</li>
                  <li>2 số tiếp theo phải khớp chính xác với 2 số cuối của năm sinh khai báo.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ color: '#34d399' }}>2. Quy tắc 2+2 Môn Thi Tốt Nghiệp GDPT 2018:</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>2 môn bắt buộc: <strong>Toán</strong> và <strong>Ngữ Văn</strong>.</li>
                  <li>2 môn tự chọn: Chọn chính xác 02 môn trong các môn: Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý, GDKT&PL, Tin học, Công nghệ, Ngoại ngữ.</li>
                  <li>Cảnh báo tức thì nếu học sinh tích chọn thiếu hoặc thừa môn tự chọn.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ color: '#a78bfa' }}>3. Tiện ích Phân công Giám thị & Sơ đồ thi:</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Thuật toán CSP Heuristic tự động phân công cán bộ coi thi theo ca thi & phòng thi.</li>
                  <li>Tự động né môn chuyên môn, né lớp chủ nhiệm, cân bằng số ca coi thi.</li>
                  <li>Tự động in thẻ phòng thi, thẻ dự thi có gắn mã QR và xuất Excel theo Nghị định 30.</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '14px' }}>
              <button
                onClick={() => setShowGuideModal(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
