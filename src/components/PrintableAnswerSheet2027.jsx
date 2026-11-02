import React, { useState } from 'react';
import { Printer, ArrowLeft, CheckCircle2, Sliders, Layers } from 'lucide-react';
import { SHEET_TEMPLATES } from '../services/mobileOmrScannerService';

export default function PrintableAnswerSheet2027({ batch, onBack }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(batch?.sheetTemplate || 'BOGD_2025_A4');

  const currentTemplate = SHEET_TEMPLATES.find(t => t.id === selectedTemplateId) || SHEET_TEMPLATES[0];

  const codeDigits = batch?.codeDigits || 3;
  const p1Count = batch?.parts?.part1?.count || currentTemplate?.defaults?.p1Count || 18;
  const p2Count = batch?.parts?.part2?.count || currentTemplate?.defaults?.p2Count || 4;
  const p3Count = batch?.parts?.part3?.count || currentTemplate?.defaults?.p3Count || 6;

  const isTraditionalOnly = currentTemplate.format === 'p1_only' || (p2Count === 0 && p3Count === 0);
  const isA5 = selectedTemplateId.includes('A5');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif' }}>
      
      {/* THANH CÔNG CỤ ĐIỀU KHIỂN & CHỌN MẪU PHIẾU (ẨN KHI IN) */}
      <div className="no-print" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        marginBottom: '20px',
        fontFamily: '"Inter", sans-serif'
      }}>
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

        {/* Bộ chọn mẫu phiếu nhanh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="#7c3aed" />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Chọn mẫu phiếu in:</span>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1.5px solid #c4b5fd',
              backgroundColor: '#f5f3ff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#5b21b6',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {SHEET_TEMPLATES.map(tpl => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '9px 20px',
            borderRadius: '9px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)'
          }}
        >
          <Printer size={17} /> In Phiếu Ngay
        </button>
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
            padding: 6mm;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
        }

        .omr-bubble {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 1.2px solid #000000;
          font-size: 9.5px;
          font-weight: bold;
          color: #000000;
          line-height: 1;
        }

        .corner-anchor {
          width: 18px;
          height: 18px;
          background-color: #000000;
        }
      `}</style>

      {/* TỜ PHIẾU IN TRẮC NGHIỆM CHUẨN (A4 / A5) */}
      <div id="cbq-printable-sheet" style={{
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        padding: isA5 ? '10px' : '16px',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        color: '#000000'
      }}>

        {/* 4 MỐC ĐỊNH VỊ 4 GÓC (ArUco / OMR Targets) */}
        <div className="corner-anchor" style={{ position: 'absolute', top: '10px', left: '10px' }}></div>
        <div className="corner-anchor" style={{ position: 'absolute', top: '10px', right: '10px' }}></div>
        <div className="corner-anchor" style={{ position: 'absolute', bottom: '10px', left: '10px' }}></div>
        <div className="corner-anchor" style={{ position: 'absolute', bottom: '10px', right: '10px' }}></div>

        {/* Header Quốc Huy & Tên trường */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK • TRƯỜNG THPT CAO BÁ QUÁT
          </div>
          <div style={{ fontSize: '17px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000', marginTop: '2px', letterSpacing: '0.5px' }}>
            PHIẾU TRẢ LỜI TRẮC NGHIỆM
          </div>
          <div style={{ fontSize: '12px', fontStyle: 'italic', fontWeight: 'bold' }}>
            Mẫu: {currentTemplate.name} • Năm học 2026 - 2027
          </div>
          <div style={{ fontSize: '11px', marginTop: '2px' }}>
            Bài thi: <strong>{batch?.title || 'Kiểm tra trắc nghiệm'}</strong> • Môn: <strong>{batch?.subject || 'Chung'}</strong> • Lớp: <strong>{batch?.className || '............'}</strong>
          </div>
        </div>

        {/* Bảng thông tin thí sinh & Mã đề, SBD */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.9fr', gap: '8px', border: '1.5px solid #000000', padding: '6px', marginBottom: '8px', fontSize: '11.5px' }}>
          
          {/* Thông tin thí sinh */}
          <div style={{ borderRight: '1px solid #000000', paddingRight: '6px' }}>
            <div style={{ marginBottom: '5px' }}>1. Họ và tên: ....................................................</div>
            <div style={{ marginBottom: '5px' }}>2. Ngày sinh: ...... / ...... / ............ Giới tính: ........</div>
            <div style={{ marginBottom: '5px' }}>3. Lớp: ........................ Phòng thi số: ..............</div>
            <div style={{ marginTop: '6px', borderTop: '1px dashed #666', paddingTop: '3px', fontSize: '10px' }}>
              <strong>HƯỚNG DẪN TÔ ĐÁP ÁN:</strong><br/>
              • Dùng bút chì 2B tô kín và đậm các ô tròn: <span className="omr-bubble" style={{ background: '#000', color: '#fff', width: '12px', height: '12px', fontSize: '8px' }}>✓</span><br/>
              • Giữ phẳng phiếu, không gấp mép, tẩy sạch khi đổi đáp án.
            </div>
          </div>

          {/* SỐ BÁO DANH (6 số) */}
          <div style={{ borderRight: '1px solid #000000', paddingRight: '6px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '3px' }}>
              4. SỐ BÁO DANH
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '3px' }}>
              {[0, 1, 2, 3, 4, 5].map(col => (
                <div key={col} style={{ width: '16px', height: '16px', border: '1.2px solid #000', fontSize: '10px', fontWeight: 'bold' }}></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
              {[0, 1, 2, 3, 4, 5].map(col => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <span key={num} className="omr-bubble" style={{ width: '14px', height: '14px', fontSize: '8.5px' }}>{num}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* MÃ ĐỀ THI (3 hoặc 4 số) */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '3px' }}>
              5. MÃ ĐỀ THI
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '3px' }}>
              {Array.from({ length: codeDigits }).map((_, col) => (
                <div key={col} style={{ width: '16px', height: '16px', border: '1.2px solid #000', fontSize: '10px', fontWeight: 'bold' }}></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
              {Array.from({ length: codeDigits }).map((_, col) => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <span key={num} className="omr-bubble" style={{ width: '14px', height: '14px', fontSize: '8.5px' }}>{num}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
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
            padding: '5px' 
          }}>
            {(() => {
              const numCols = p1Count <= 20 ? 2 : (p1Count <= 50 ? 4 : 5);
              const perCol = Math.ceil(p1Count / numCols);
              return Array.from({ length: numCols }).map((_, colIdx) => {
                const startQ = colIdx * perCol + 1;
                const endQ = Math.min((colIdx + 1) * perCol, p1Count);
                if (startQ > p1Count) return null;
                return (
                  <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {Array.from({ length: endQ - startQ + 1 }).map((__, rowIdx) => {
                      const qNum = startQ + rowIdx;
                      return (
                        <div key={qNum} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px' }}>
                          <span style={{ width: '22px', fontWeight: 'bold', textAlign: 'right' }}>{qNum}.</span>
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
                <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                  PHẦN II: Thí sinh trả lời từ câu 1 đến câu {p2Count}. Trong mỗi ý a), b), c), d) chọn Đúng (Đ) hoặc Sai (S).
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p2Count}, 1fr)`, gap: '4px', border: '1px solid #000000', borderTop: 'none', padding: '5px' }}>
                  {Array.from({ length: p2Count }).map((_, qIdx) => (
                    <div key={qIdx} style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10.5px', marginBottom: '3px', background: '#f5f5f5' }}>Câu {qIdx + 1}</div>
                      {['a', 'b', 'c', 'd'].map(sub => (
                        <div key={sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                          <span style={{ width: '14px', fontWeight: 'bold', fontSize: '10px' }}>{sub})</span>
                          <span className="omr-bubble" style={{ width: '14px', height: '14px', fontSize: '8.5px' }}>Đ</span>
                          <span className="omr-bubble" style={{ width: '14px', height: '14px', fontSize: '8.5px' }}>S</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (ĐIỀN SỐ) */}
            {p3Count > 0 && (
              <div>
                <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                  PHẦN III: Thí sinh trả lời từ câu 1 đến câu {p3Count}. Mỗi câu tô các ký tự và chữ số từ trên xuống dưới.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p3Count}, 1fr)`, gap: '4px', border: '1px solid #000000', borderTop: 'none', padding: '5px' }}>
                  {Array.from({ length: p3Count }).map((_, qIdx) => (
                    <div key={qIdx} style={{ border: '1px solid #ccc', padding: '3px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>Câu {qIdx + 1}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                        {/* Cột Dấu âm */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
                          <div style={{ width: '12px', height: '12px', border: '1px solid #000', fontSize: '8px' }}></div>
                          <span className="omr-bubble" style={{ width: '12px', height: '12px', fontSize: '8px' }}>-</span>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <span key={n} className="omr-bubble" style={{ width: '12px', height: '12px', fontSize: '7.5px' }}>{n}</span>
                          ))}
                        </div>
                        {/* 3 Cột số thập phân */}
                        {[1, 2, 3].map(col => (
                          <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
                            <div style={{ width: '12px', height: '12px', border: '1px solid #000', fontSize: '8px' }}></div>
                            <span className="omr-bubble" style={{ width: '12px', height: '12px', fontSize: '8px' }}>,</span>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                              <span key={n} className="omr-bubble" style={{ width: '12px', height: '12px', fontSize: '7.5px' }}>{n}</span>
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

      </div>

    </div>
  );
}
