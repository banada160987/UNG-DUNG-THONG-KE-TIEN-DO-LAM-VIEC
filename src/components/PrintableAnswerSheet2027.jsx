import React from 'react';
import { Printer, Download, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PrintableAnswerSheet2027({ batch, onBack }) {
  const codeDigits = batch?.codeDigits || 3;
  const p1Count = batch?.parts?.part1?.count || 18;
  const p2Count = batch?.parts?.part2?.count || 4;
  const p3Count = batch?.parts?.part3?.count || 6;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '16px', maxWidth: '850px', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif' }}>
      
      {/* Thanh công cụ (Ẩn khi in ấn) */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '12px 18px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
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
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>
            MẪU PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN BỘ GD&ĐT 2027
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Khổ A4 tiêu chuẩn • Có 4 mốc định vị OMR tốc độ cao
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#6d28d9',
            color: '#ffffff',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)'
          }}
        >
          <Printer size={16} /> In Phiếu Ngay
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
            padding: 8mm 6mm;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
        }

        .omr-bubble {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.2px solid #000000;
          font-size: 10px;
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

      {/* TỜ PHIẾU IN TRẮC NGHIỆM A4 CHUẨN */}
      <div id="cbq-printable-sheet" style={{
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        padding: '16px',
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
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK • TRƯỜNG THPT CAO BÁ QUÁT
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000', marginTop: '2px', letterSpacing: '0.5px' }}>
            PHIẾU TRẢ LỜI TRẮC NGHIỆM
          </div>
          <div style={{ fontSize: '12.5px', fontStyle: 'italic', fontWeight: 'bold' }}>
            (Kỳ thi Đánh giá năng lực & Kiểm tra định kỳ GDPT 2018 - Năm học 2026 - 2027)
          </div>
          <div style={{ fontSize: '11px', marginTop: '3px' }}>
            Bài thi: <strong>{batch?.title || 'Kiểm tra trắc nghiệm'}</strong> • Môn: <strong>{batch?.subject || 'Chung'}</strong> • Lớp: <strong>{batch?.className || '............'}</strong>
          </div>
        </div>

        {/* Bảng thông tin thí sinh & Mã đề, SBD */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.9fr', gap: '8px', border: '1.5px solid #000000', padding: '8px', marginBottom: '10px', fontSize: '12px' }}>
          
          {/* Thông tin thí sinh */}
          <div style={{ borderRight: '1px solid #000000', paddingRight: '8px' }}>
            <div style={{ marginBottom: '6px' }}>1. Họ và tên: ....................................................</div>
            <div style={{ marginBottom: '6px' }}>2. Ngày sinh: ...... / ...... / ............ Giới tính: ........</div>
            <div style={{ marginBottom: '6px' }}>3. Lớp: ........................ Phòng thi số: ..............</div>
            <div style={{ marginTop: '8px', borderTop: '1px dashed #666', paddingTop: '4px', fontSize: '10.5px' }}>
              <strong>LƯU Ý THÍ SINH:</strong><br/>
              • Giữ phiếu phẳng, không làm rách, gập mép.<br/>
              • Dùng bút chì 2B tô kín và đậm các ô tròn: <span className="omr-bubble" style={{ background: '#000', color: '#fff', width: '13px', height: '13px', fontSize: '9px' }}>✓</span><br/>
              • Không tô gạch chéo ✗ hoặc đánh dấu ✓.
            </div>
          </div>

          {/* SỐ BÁO DANH (6 số) */}
          <div style={{ borderRight: '1px solid #000000', paddingRight: '8px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
              4. SỐ BÁO DANH
            </div>
            {/* Hàng ô ghi số */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
              {[0, 1, 2, 3, 4, 5].map(col => (
                <div key={col} style={{ width: '18px', height: '18px', border: '1.2px solid #000', fontSize: '11px', fontWeight: 'bold' }}></div>
              ))}
            </div>
            {/* Lưới tô 0 - 9 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
              {[0, 1, 2, 3, 4, 5].map(col => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <span key={num} className="omr-bubble" style={{ width: '15px', height: '15px', fontSize: '9px' }}>{num}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* MÃ ĐỀ THI (3 hoặc 4 số) */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
              5. MÃ ĐỀ THI
            </div>
            {/* Hàng ô ghi số */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
              {Array.from({ length: codeDigits }).map((_, col) => (
                <div key={col} style={{ width: '18px', height: '18px', border: '1.2px solid #000', fontSize: '11px', fontWeight: 'bold' }}></div>
              ))}
            </div>
            {/* Lưới tô 0 - 9 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
              {Array.from({ length: codeDigits }).map((_, col) => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <span key={num} className="omr-bubble" style={{ width: '15px', height: '15px', fontSize: '9px' }}>{num}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11.5px', textTransform: 'uppercase' }}>
            PHẦN I: Thí sinh trả lời từ câu 1 đến câu {p1Count}. Mỗi câu hỏi chỉ chọn một phương án.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', border: '1px solid #000000', borderTop: 'none', padding: '6px' }}>
            {Array.from({ length: 4 }).map((_, colIdx) => {
              const startQ = colIdx * Math.ceil(p1Count / 4) + 1;
              const endQ = Math.min((colIdx + 1) * Math.ceil(p1Count / 4), p1Count);
              return (
                <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {Array.from({ length: endQ - startQ + 1 }).map((__, rowIdx) => {
                    const qNum = startQ + rowIdx;
                    return (
                      <div key={qNum} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                        <span style={{ width: '20px', fontWeight: 'bold', textAlign: 'right' }}>{qNum}.</span>
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <span key={opt} className="omr-bubble">{opt}</span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG SAI (a, b, c, d) */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11.5px', textTransform: 'uppercase' }}>
            PHẦN II: Thí sinh trả lời từ câu 1 đến câu {p2Count}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng (Đ) hoặc Sai (S).
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', border: '1px solid #000000', borderTop: 'none', padding: '6px' }}>
            {Array.from({ length: p2Count }).map((_, idx) => {
              const qNum = idx + 1;
              return (
                <div key={qNum} style={{ border: '1px solid #999', padding: '4px', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', textAlign: 'center', marginBottom: '2px' }}>
                    Câu {qNum}
                  </div>
                  {['a', 'b', 'c', 'd'].map(sub => (
                    <div key={sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', padding: '1px 4px' }}>
                      <span style={{ fontWeight: 'bold' }}>{sub})</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="omr-bubble" style={{ width: '15px', height: '15px', fontSize: '9px' }}>Đ</span>
                        <span className="omr-bubble" style={{ width: '15px', height: '15px', fontSize: '9px' }}>S</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* PHẦN III: TRẢ LỜI NGẮN / ĐIỀN SỐ */}
        <div>
          <div style={{ background: '#000000', color: '#ffffff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11.5px', textTransform: 'uppercase' }}>
            PHẦN III: Thí sinh trả lời từ câu 1 đến câu {p3Count}. Mỗi câu điền kết quả vào các ô tương ứng (hỗ trợ dấu âm '-' và dấu phẩy ',').
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', border: '1px solid #000000', borderTop: 'none', padding: '6px' }}>
            {Array.from({ length: p3Count }).map((_, idx) => {
              const qNum = idx + 1;
              return (
                <div key={qNum} style={{ border: '1px solid #999', padding: '4px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                    Câu {qNum}
                  </div>
                  {/* Ô ghi giá trị */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '3px' }}>
                    {[0, 1, 2, 3].map(col => (
                      <div key={col} style={{ width: '14px', height: '14px', border: '1px solid #000' }}></div>
                    ))}
                  </div>
                  {/* Cột tô */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                    {/* Cột 1 có dấu âm */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span className="omr-bubble" style={{ width: '13px', height: '13px', fontSize: '9px' }}>-</span>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <span key={n} className="omr-bubble" style={{ width: '13px', height: '13px', fontSize: '8px' }}>{n}</span>
                      ))}
                    </div>
                    {/* 3 Cột sau có dấu phẩy */}
                    {[1, 2, 3].map(c => (
                      <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span className="omr-bubble" style={{ width: '13px', height: '13px', fontSize: '9px' }}>,</span>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                          <span key={n} className="omr-bubble" style={{ width: '13px', height: '13px', fontSize: '8px' }}>{n}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Phiếu */}
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontStyle: 'italic' }}>
          <div>Hệ thống Chấm thi Trắc nghiệm Thông minh CBQ 2027 • GDPT 2018</div>
          <div>Bản quyền phần mềm trường THPT Cao Bá Quát</div>
        </div>

      </div>

    </div>
  );
}
