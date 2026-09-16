import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, Check, X, RotateCcw, Upload } from 'lucide-react';

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSaveSignature,
  initialSignature = null,
  signerName = '',
  signerTitle = 'Giáo viên'
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#002277'); // Xanh mực bút ký hành chính
  const [penWidth, setPenWidth] = useState(2.5);
  const [history, setHistory] = useState([]);

  // Initialize Canvas with High-DPI Retina Support
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const ratio = Math.max(window.devicePixelRatio || 1, 2);

      // Get display size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;

      // Load initial signature if exists
      if (initialSignature) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasDrawn(true);
        };
        img.src = initialSignature;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, initialSignature]);

  // Update stroke styles when pen settings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
    }
  }, [penColor, penWidth]);

  // Save state to undo history
  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory(prev => [...prev.slice(-10), canvas.toDataURL()]);
  };

  // Coordinates helper
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    pushHistory();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e?.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    setHasDrawn(false);
    setHistory([]);
  };

  const undoLast = () => {
    if (history.length === 0) return;
    const prevDataUrl = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 2);

    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    if (prevDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = prevDataUrl;
    } else {
      setHasDrawn(false);
    }
  };

  const handleUploadImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.max(window.devicePixelRatio || 1, 2);
        ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
        pushHistory();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert("Vui lòng ký tên trên khung ký trước khi xác nhận!");
      return;
    }
    const signatureDataUrl = canvas.toDataURL('image/png');
    onSaveSignature(signatureDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #cbd5e1',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
              <PenTool size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                Ký Tên Điện Tử Trực Tiếp Trên Màn Hình
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', opacity: 0.9 }}>
                {signerTitle}: <strong>{signerName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar & Customization */}
        <div style={{
          padding: '12px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Colors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Màu mực:</span>
            {[
              { color: '#002277', label: 'Xanh bút ký' },
              { color: '#111827', label: 'Đen truyền thống' },
              { color: '#b91c1c', label: 'Đỏ phê duyệt' }
            ].map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => setPenColor(c.color)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: c.color,
                  border: penColor === c.color ? '3px solid #38bdf8' : '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  cursor: 'pointer'
                }}
                title={c.label}
              />
            ))}
          </div>

          {/* Pen Width */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Nét bút:</span>
            {[
              { width: 2, label: 'Thanh' },
              { width: 3, label: 'Chuẩn' },
              { width: 4.5, label: 'Đậm' }
            ].map(w => (
              <button
                key={w.width}
                type="button"
                onClick={() => setPenWidth(w.width)}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: penWidth === w.width ? '#0284c7' : 'white',
                  color: penWidth === w.width ? 'white' : '#475569',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Upload fallback */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11.5px',
            color: '#0284c7',
            cursor: 'pointer',
            fontWeight: 'bold',
            padding: '3px 8px',
            borderRadius: '6px',
            background: '#e0f2fe'
          }}>
            <Upload size={13} /> Tải ảnh chữ ký
            <input type="file" accept="image/*" onChange={handleUploadImage} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Canvas Signature Area */}
        <div style={{ padding: '20px', background: '#f1f5f9' }}>
          <div style={{
            position: 'relative',
            background: '#ffffff',
            borderRadius: '12px',
            border: '2px dashed #94a3b8',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{
                display: 'block',
                width: '100%',
                height: '200px',
                cursor: 'crosshair',
                touchAction: 'none'
              }}
            />

            {/* Baseline Guideline */}
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '20px',
              right: '20px',
              borderBottom: '1px dotted #cbd5e1',
              pointerEvents: 'none'
            }}>
              <span style={{ position: 'absolute', right: 0, bottom: '2px', fontSize: '10px', color: '#94a3b8' }}>
                Đường gióng ký tên
              </span>
            </div>

            {!hasDrawn && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
                pointerEvents: 'none',
                color: '#94a3b8'
              }}>
                <PenTool size={32} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '13px', fontStyle: 'italic' }}>
                  Dùng ngón tay, bút cảm ứng hoặc chuột để ký tên tại đây
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 20px',
          background: 'white',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={clearCanvas}
              disabled={!hasDrawn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 14px',
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: hasDrawn ? 'pointer' : 'not-allowed',
                opacity: hasDrawn ? 1 : 0.5
              }}
            >
              <Trash2 size={14} /> Xóa ký lại
            </button>
            <button
              type="button"
              onClick={undoLast}
              disabled={history.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12.5px',
                cursor: history.length > 0 ? 'pointer' : 'not-allowed',
                opacity: history.length > 0 ? 1 : 0.5
              }}
            >
              <RotateCcw size={14} /> Hoàn tác
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Check size={16} /> Chèn Chữ Ký
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
