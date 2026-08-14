import React from 'react';
import { X, Printer, Download, Award, ShieldCheck, Sparkles } from 'lucide-react';

export default function CertificateModal({ entry, awardRank = 'GIẢI NHẤT', onClose }) {
  if (!entry) return null;

  const handlePrint = () => {
    window.print();
  };

  const getAwardColor = () => {
    if (awardRank.includes('NHẤT')) return '#b45309';
    if (awardRank.includes('NHÌ')) return '#334155';
    if (awardRank.includes('BA')) return '#c2410c';
    return '#881337';
  };

  return (
    <div className="certificate-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '900px', width: '100%', padding: '20px', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
        
        {/* MODAL TOOLBAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 'bold', fontSize: '17px' }}>
            <Award size={22} /> GIẤY KHEN VÀ CHỨNG NHẬN ĐIỆN TỬ 5D
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#b45309', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} /> In Giấy Khen (A4 Ngang)
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE TEMPLATE */}
        <div id="printable-certificate" style={{
          width: '100%',
          aspectRatio: '1.414 / 1', // A4 Landscape ratio
          background: '#fffdfa',
          border: '12px double #ca8a4b',
          borderRadius: '8px',
          padding: '30px 40px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#1e293b',
          fontFamily: 'Playfair Display, Times New Roman, serif',
          boxShadow: 'inset 0 0 40px rgba(202, 138, 75, 0.15)'
        }}>
          {/* CORNER ORNAMENTS */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', width: '30px', height: '30px', borderTop: '3px solid #ca8a4b', borderLeft: '3px solid #ca8a4b' }}></div>
          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderTop: '3px solid #ca8a4b', borderRight: '3px solid #ca8a4b' }}></div>
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '30px', height: '30px', borderBottom: '3px solid #ca8a4b', borderLeft: '3px solid #ca8a4b' }}></div>
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '30px', height: '30px', borderBottom: '3px solid #ca8a4b', borderRight: '3px solid #ca8a4b' }}></div>

          {/* HEADER */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
              <img src="/logo.jpg" alt="Logo 30 năm" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#be123c', letterSpacing: '1px', textTransform: 'uppercase' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>BAN TỔ CHỨC LỄ KỶ NIỆM 30 NĂM THÀNH LẬP (1996 - 2026)</div>
              </div>
            </div>

            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#b45309', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '10px', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
              GIẤY KHEN & CHỨNG NHẬN
            </div>
            <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>
              Hội Thi Sáng Tạo & Tri Ân Chào Mừng 30 Năm Thành Lập Trường
            </div>
          </div>

          {/* BODY */}
          <div style={{ textAlign: 'center', margin: '15px 0' }}>
            <div style={{ fontSize: '14px', color: '#475569', fontStyle: 'italic' }}>Trao tặng cho Thí sinh / Tập thể:</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#be123c', margin: '6px 0 2px 0', borderBottom: '1px dashed #fca5a5', display: 'inline-block', paddingBottom: '4px', minWidth: '300px' }}>
              {entry.author_name}
            </div>
            
            <div style={{ fontSize: '14px', color: '#334155', marginTop: '8px' }}>
              Đã xuất sắc đoạt danh hiệu:
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: getAwardColor(), textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0' }}>
              🏆 {awardRank}
            </div>

            <div style={{ fontSize: '13.5px', color: '#475569', maxWidth: '650px', margin: '6px auto 0 auto', lineHeight: '1.4' }}>
              Với Tác phẩm dự thi: <strong>"{entry.title}"</strong> ({entry.category || 'Nghệ thuật'})
              <br/>
              <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b' }}>
                Đã đóng góp tích cực cho thành công rực rỡ của Lễ Kỷ Niệm 30 Năm Thành Lập Trường THPT Cao Bá Quát.
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
            {/* QR SEAL */}
            <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=CERT-CBQ30Y-${entry.id}`} alt="QR Code" style={{ width: '65px', height: '65px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>
                <strong style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '3px' }}><ShieldCheck size={12} /> BẢO MẬT CHÍNH HÃNG</strong>
                Mã xác thực: CBQ-30Y-{entry.id?.substring(0, 8)}<br/>
                Ngày cấp: {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>

            {/* SIGNATURE */}
            <div style={{ textAlign: 'center', minWidth: '220px' }}>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>Tân An, Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '2px' }}>HIỆU TRƯỞNG - TRƯỞNG BAN TỔ CHỨC</div>
              <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Dancing Script, cursive, serif', fontSize: '20px', color: '#be123c', fontWeight: 'bold', transform: 'rotate(-5deg)' }}>Ban BGH Cao Bá Quát</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
            </div>
          </div>

        </div>

        {/* PRINT CSS STYLES */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .certificate-modal-overlay { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; background: white !important; padding: 0 !important; }
            #printable-certificate, #printable-certificate * { visibility: visible; }
            #printable-certificate { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; border: 10px double #ca8a4b !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
