import React, { useState } from 'react';
import { Printer, ArrowLeft, CheckCircle2, Sliders, Layers, Sparkles, Award, ShieldCheck } from 'lucide-react';
import { SHEET_TEMPLATES } from '../services/mobileOmrScannerService';

export default function PrintableAnswerSheet2027({ batch, onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'gdpt2018' | 'traditional' | 'azota' | 'cbq'
  const [selectedTemplateId, setSelectedTemplateId] = useState(batch?.sheetTemplate || 'CBQ_2027_A4');

  const filteredTemplates = SHEET_TEMPLATES.filter(tpl => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'cbq') return tpl.id.startsWith('CBQ_');
    if (selectedCategory === 'gdpt2018') return tpl.category === 'gdpt2018' && !tpl.id.startsWith('CBQ_');
    return tpl.category === selectedCategory;
  });

  const currentTemplate = SHEET_TEMPLATES.find(t => t.id === selectedTemplateId) || SHEET_TEMPLATES[0];

  const codeDigits = batch?.codeDigits || 3;
  const p1Count = batch?.parts?.part1?.count || currentTemplate?.defaults?.p1Count || 18;
  const p2Count = batch?.parts?.part2?.count || currentTemplate?.defaults?.p2Count || 4;
  const p3Count = batch?.parts?.part3?.count || currentTemplate?.defaults?.p3Count || 6;

  const isTraditionalOnly = currentTemplate.format === 'p1_only' || (p2Count === 0 && p3Count === 0);
  const isA5 = selectedTemplateId.includes('A5');
  const isHybrid = currentTemplate.format === 'hybrid' || selectedTemplateId.includes('TULUAN');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '16px', maxWidth: '940px', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif' }}>
      
      {/* THANH CÔNG CỤ ĐIỀU KHIỂN & CHỌN MẪU PHIẾU (ẨN KHI IN) */}
      <div className="no-print" style={{
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '20px',
        border: '1.5px solid #e2e8f0',
        fontFamily: '"Inter", sans-serif'
      }}>
        {/* Hàng 1: Nút back & nút In */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <ArrowLeft size={16} /> Quay lại
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '11.5px',
              fontWeight: 'bold'
            }}>
              <ShieldCheck size={14} color="#059669" /> Phiên Bản Đặc Biệt CBQ Pro 2027
            </span>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
            }}
          >
            <Printer size={18} /> In Phiếu Chuẩn A4/A5
          </button>
        </div>

        {/* Hàng 2: Bộ lọc nhóm mẫu phiếu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Nhóm mẫu:</span>
          {[
            { id: 'all', label: '🏛️ Tất cả (15)' },
            { id: 'cbq', label: '⭐ CBQ Đặc Biệt (3)' },
            { id: 'gdpt2018', label: '📘 Bộ GD&ĐT 2025 (5)' },
            { id: 'traditional', label: '⚡ TNMaker (4)' },
            { id: 'azota', label: '🟣 Azota (3)' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedCategory(tab.id);
                const firstMatch = SHEET_TEMPLATES.find(t => {
                  if (tab.id === 'all') return true;
                  if (tab.id === 'cbq') return t.id.startsWith('CBQ_');
                  if (tab.id === 'gdpt2018') return t.category === 'gdpt2018' && !t.id.startsWith('CBQ_');
                  return t.category === tab.id;
                });
                if (firstMatch) setSelectedTemplateId(firstMatch.id);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: selectedCategory === tab.id ? '1.5px solid #059669' : '1px solid #cbd5e1',
                backgroundColor: selectedCategory === tab.id ? '#ecfdf5' : '#ffffff',
                color: selectedCategory === tab.id ? '#065f46' : '#64748b',
                fontWeight: selectedCategory === tab.id ? 'bold' : 'normal',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}

          {/* Select chi tiết */}
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1.5px solid #10b981',
              backgroundColor: '#f0fdf4',
              fontSize: '12.5px',
              fontWeight: 'bold',
              color: '#065f46',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {filteredTemplates.map(tpl => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mô tả mẫu đang chọn */}
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
          📌 <strong>{currentTemplate.name}:</strong> {currentTemplate.description}
        </div>
      </div>

      {/* Style chuyên biệt cho máy in */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cbq-printable-sheet, #cbq-printable-sheet * {
            visibility: visible;
          }
          #cbq-printable-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 5mm;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
        }

        .omr-bubble {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14.5px;
          height: 14.5px;
          border-radius: 50%;
          border: 1.2px solid #000000;
          font-size: 9px;
          font-weight: bold;
          color: #000000;
          line-height: 1;
        }

        /* 4 MỐC ARUCO TARGET ĐỊNH VỊ CHUYÊN NGHIỆP */
        .corner-anchor {
          width: 22px;
          height: 22px;
          background-color: #000000;
          position: absolute;
          box-sizing: border-box;
        }
        .corner-anchor::after {
          content: '';
          position: absolute;
          inset: 4px;
          background-color: #ffffff;
        }
        .corner-anchor::before {
          content: '';
          position: absolute;
          inset: 7px;
          background-color: #000000;
          z-index: 1;
        }
        @media (max-width: 768px) {
          .mobile-preview-hint {
            display: flex !important;
          }
        }
      `}</style>

      {/* THÔNG BÁO HƯỚNG DẪN VUỐT XEM TRÊN ĐIỆN THOẠI */}
      <div className="no-print mobile-preview-hint" style={{
        fontSize: '12px',
        color: '#0369a1',
        backgroundColor: '#f0f9ff',
        padding: '8px 12px',
        borderRadius: '8px',
        marginBottom: '12px',
        border: '1px solid #bae6fd',
        display: 'none',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>📱 <em>Mẹo: Khổ giấy A4/A5 rộng hơn màn hình điện thoại. Bạn có thể vuốt ngang để xem toàn bộ phiếu trước khi in.</em></span>
      </div>

      {/* CONTAINER CUỘN NGANG GIỮ NGUYÊN TỈ LỆ IN ẤN CHUẨN XÁC */}
      <div className="cbq-sheet-scroll-wrap" style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '16px'
      }}>
        {/* TỜ PHIẾU IN TRẮC NGHIỆM CHUẨN (A4 / A5) */}
        <div id="cbq-printable-sheet" style={{
          minWidth: isA5 ? '560px' : '700px',
          backgroundColor: '#ffffff',
          border: '2px solid #000000',
          padding: isA5 ? '10px' : '16px',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          color: '#000000',
          minHeight: isA5 ? '135mm' : '260mm'
        }}>

        {/* 4 MỐC ARUCO ĐỊNH VỊ 4 GÓC CHUYÊN DỤNG (BẮT GÓC CAMERA CHÍNH XÁC 100%) */}
        <div className="corner-anchor" style={{ top: '8px', left: '8px' }}></div>
        <div className="corner-anchor" style={{ top: '8px', right: '8px' }}></div>
        <div className="corner-anchor" style={{ bottom: '8px', left: '8px' }}></div>
        <div className="corner-anchor" style={{ bottom: '8px', right: '8px' }}></div>

        {/* Header Hành Chính & Logo Trường THPT Cao Bá Quát */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #000000', paddingBottom: '8px', marginBottom: '8px' }}>
          
          {/* Cột trái: Logo & Đơn vị chủ quản */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <img 
              src="/logo.jpg" 
              alt="Logo THPT Cao Bá Quát" 
              style={{ width: '42px', height: '42px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                SỞ GD&ĐT ĐẮK LẮK
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: '900', textTransform: 'uppercase', color: '#000000' }}>
                TRƯỜNG THPT CAO BÁ QUÁT
              </div>
              <div style={{ fontSize: '10px', fontStyle: 'italic' }}>
                Khảo thí số OMR Pro 2027
              </div>
            </div>
          </div>

          {/* Cột giữa: Tiêu đề phiếu */}
          <div style={{ textAlign: 'center', flex: 1.6 }}>
            <div style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PHIẾU TRẢ LỜI TRẮC NGHIỆM
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 'bold', fontStyle: 'italic', marginTop: '1px' }}>
              Mẫu: {currentTemplate.name}
            </div>
            <div style={{ fontSize: '10.5px', marginTop: '2px' }}>
              Môn: <strong>{batch?.subject || '...............'}</strong> • Lớp: <strong>{batch?.className || '............'}</strong>
            </div>
          </div>

          {/* Cột phải: Mã định danh & Giám thị */}
          <div style={{ textAlign: 'right', flex: 1, fontSize: '10px' }}>
            <div style={{ border: '1px solid #000', padding: '3px 6px', display: 'inline-block', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>MÃ PHIẾU CBQ</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>
                {batch?.id ? String(batch.id).slice(-8).toUpperCase() : 'CBQ-2027'}
              </div>
            </div>
            <div style={{ marginTop: '3px', fontStyle: 'italic' }}>
              Cán bộ coi thi: ....................
            </div>
          </div>

        </div>

        {/* Bảng thông tin thí sinh & Khung tô Số báo danh, Mã đề */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.9fr', gap: '8px', border: '1.5px solid #000000', padding: '6px', marginBottom: '8px', fontSize: '11px' }}>
          
          {/* Thông tin cá nhân thí sinh */}
          <div style={{ borderRight: '1px solid #000000', paddingRight: '6px' }}>
            <div style={{ marginBottom: '4px' }}>1. Họ và tên: .............................................................</div>
            <div style={{ marginBottom: '4px' }}>2. Ngày sinh: ...... / ...... / ............ Giới tính: ...............</div>
            <div style={{ marginBottom: '4px' }}>3. Lớp: ........................ Phòng thi số: ......................</div>
            <div style={{ marginTop: '5px', borderTop: '1px dashed #666', paddingTop: '3px', fontSize: '9.5px', lineHeight: 1.3 }}>
              <strong>HƯỚNG DẪN TÔ ĐÁP ÁN:</strong><br/>
              • Dùng bút chì 2B tô kín và đậm ô tròn: <span className="omr-bubble" style={{ background: '#000', color: '#fff', width: '11px', height: '11px', fontSize: '7.5px' }}>✓</span><br/>
              • Giữ phẳng phiếu, không gấp mép, tẩy sạch khi đổi ý.
            </div>
          </div>

          {/* SỐ BÁO DANH (6 CỘT TÔ TỪ 0 ĐẾN 9) */}
          <div style={{ borderRight: '1px solid #000000', paddingRight: '6px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
              4. SỐ BÁO DANH
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '3px' }}>
              {[0, 1, 2, 3, 4, 5].map(col => (
                <div key={col} style={{ width: '15px', height: '15px', border: '1.2px solid #000', fontSize: '9.5px', fontWeight: 'bold' }}></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
              {[0, 1, 2, 3, 4, 5].map(col => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '1.2px' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <span key={num} className="omr-bubble" style={{ width: '13.5px', height: '13.5px', fontSize: '8px' }}>{num}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* MÃ ĐỀ THI (3 hoặc 4 CỘT TÔ TỪ 0 ĐẾN 9) */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
              5. MÃ ĐỀ THI
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '3px' }}>
              {Array.from({ length: codeDigits }).map((_, col) => (
                <div key={col} style={{ width: '15px', height: '15px', border: '1.2px solid #000', fontSize: '9.5px', fontWeight: 'bold' }}></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
              {Array.from({ length: codeDigits }).map((_, col) => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '1.2px' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <span key={num} className="omr-bubble" style={{ width: '13.5px', height: '13.5px', fontSize: '8px' }}>{num}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '10.5px', textTransform: 'uppercase' }}>
            {isTraditionalOnly 
              ? `PHẦN TRẮC NGHIỆM: Trả lời từ câu 1 đến câu ${p1Count}. Mỗi câu chỉ chọn một phương án.` 
              : `PHẦN I: Trả lời từ câu 1 đến câu ${p1Count}. Mỗi câu chỉ chọn một phương án.`}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: p1Count <= 20 ? 'repeat(2, 1fr)' : (p1Count <= 50 ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)'), 
            gap: '4px', 
            border: '1px solid #000000', 
            borderTop: 'none', 
            padding: '4px' 
          }}>
            {(() => {
              const numCols = p1Count <= 20 ? 2 : (p1Count <= 50 ? 4 : 5);
              const perCol = Math.ceil(p1Count / numCols);
              return Array.from({ length: numCols }).map((_, colIdx) => {
                const startQ = colIdx * perCol + 1;
                const endQ = Math.min((colIdx + 1) * perCol, p1Count);
                if (startQ > p1Count) return null;
                return (
                  <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
                    {Array.from({ length: endQ - startQ + 1 }).map((__, rowIdx) => {
                      const qNum = startQ + rowIdx;
                      return (
                        <div key={qNum} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                          <span style={{ width: '20px', fontWeight: 'bold', textAlign: 'right' }}>{qNum}.</span>
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <span key={opt} className="omr-bubble">{opt}</span>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* NẾU LÀ MẪU GDPT 2018 (CÓ PHẦN II VÀ PHẦN III) */}
        {!isTraditionalOnly && (
          <>
            {/* PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI */}
            {p2Count > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  PHẦN II: Thí sinh trả lời từ câu 1 đến câu {p2Count}. Trong mỗi ý a), b), c), d) chọn Đúng (Đ) hoặc Sai (S).
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p2Count}, 1fr)`, gap: '4px', border: '1px solid #000000', borderTop: 'none', padding: '4px' }}>
                  {Array.from({ length: p2Count }).map((_, qIdx) => (
                    <div key={qIdx} style={{ border: '1px solid #ddd', padding: '3px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px', background: '#f5f5f5' }}>Câu {qIdx + 1}</div>
                      {['a', 'b', 'c', 'd'].map(sub => (
                        <div key={sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '1.5px' }}>
                          <span style={{ width: '13px', fontWeight: 'bold', fontSize: '9.5px' }}>{sub})</span>
                          <span className="omr-bubble" style={{ width: '13.5px', height: '13.5px', fontSize: '8px' }}>Đ</span>
                          <span className="omr-bubble" style={{ width: '13.5px', height: '13.5px', fontSize: '8px' }}>S</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (ĐIỀN SỐ) */}
            {p3Count > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  PHẦN III: Thí sinh trả lời từ câu 1 đến câu {p3Count}. Mỗi câu tô các ký tự và chữ số từ trên xuống dưới.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p3Count}, 1fr)`, gap: '4px', border: '1px solid #000000', borderTop: 'none', padding: '4px' }}>
                  {Array.from({ length: p3Count }).map((_, qIdx) => (
                    <div key={qIdx} style={{ border: '1px solid #ccc', padding: '2px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '9.5px', marginBottom: '1.5px' }}>Câu {qIdx + 1}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                        {/* Cột Dấu âm */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2px' }}>
                          <div style={{ width: '11px', height: '11px', border: '1px solid #000', fontSize: '7.5px' }}></div>
                          <span className="omr-bubble" style={{ width: '11.5px', height: '11.5px', fontSize: '7.5px' }}>-</span>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <span key={n} className="omr-bubble" style={{ width: '11.5px', height: '11.5px', fontSize: '7px' }}>{n}</span>
                          ))}
                        </div>
                        {/* 3 Cột số */}
                        {[1, 2, 3].map(col => (
                          <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '1.2px' }}>
                            <div style={{ width: '11px', height: '11px', border: '1px solid #000', fontSize: '7.5px' }}></div>
                            <span className="omr-bubble" style={{ width: '11.5px', height: '11.5px', fontSize: '7.5px' }}>,</span>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                              <span key={n} className="omr-bubble" style={{ width: '11.5px', height: '11.5px', fontSize: '7px' }}>{n}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* NẾU LÀ MẪU AZOTA HYBRID (KẾT HỢP TỰ LUẬN) */}
        {isHybrid && (
          <div style={{ marginTop: '10px', border: '1.5px solid #000', padding: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
              PHẦN BÀI LÀM TỰ LUẬN (DÀNH CHO HỌC SINH VIẾT TỰ LUẬN HOẶC TRÌNH BÀY)
            </div>
            <div style={{ height: '80mm', border: '1px dashed #666', borderRadius: '4px', padding: '8px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
              Thí sinh làm bài tự luận vào khung này.........................................................................................................
            </div>
          </div>
        )}

      </div>
      </div>

    </div>
  );
}
