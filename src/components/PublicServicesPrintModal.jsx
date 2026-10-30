import React, { useRef } from 'react';
import { Printer, Download, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function PublicServicesPrintModal({ service, onClose }) {
  const printRef = useRef(null);

  if (!service) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentYear = new Date().getFullYear();
  const certDate = service.processedAt ? new Date(service.processedAt) : new Date();
  const day = certDate.getDate();
  const month = certDate.getMonth() + 1;
  const year = certDate.getFullYear();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '94vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#38bdf8" />
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              Xác Nhận Điện Tử Chuẩn Nghị Định 30/2020/NĐ-CP • Mã: {service.code}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> In / Xuất PDF (A4)
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (Chuẩn Văn Bản Hành Chính Thể Thức NĐ 30) */}
        <div 
          ref={printRef}
          className="printable-certificate-sheet"
          style={{
            padding: '40px 48px',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: '"Times New Roman", Times, serif',
            lineHeight: '1.5',
            fontSize: '14pt'
          }}
        >
          {/* Header 2 Cột */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <tbody>
              <tr>
                <td style={{ width: '45%', verticalAlign: 'top', textAlign: 'center', padding: 0 }}>
                  <div style={{ fontSize: '12pt', textTransform: 'uppercase' }}>SỞ GD&ĐT HÀ NỘI</div>
                  <div style={{ fontSize: '12.5pt', fontWeight: 'bold', textTransform: 'uppercase' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                  <div style={{ width: '120px', height: '1px', backgroundColor: '#000', margin: '4px auto 8px auto' }}></div>
                  <div style={{ fontSize: '11pt', fontStyle: 'italic' }}>
                    Số: {service.code?.replace('CBQ-DVC-', '') || '01'}/GXN-THPTCBQ
                  </div>
                </td>
                <td style={{ width: '55%', verticalAlign: 'top', textAlign: 'center', padding: 0 }}>
                  <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div style={{ width: '160px', height: '1.5px', backgroundColor: '#000', margin: '4px auto 8px auto' }}></div>
                  <div style={{ fontSize: '12pt', fontStyle: 'italic' }}>
                    Quốc Oai, ngày {day} tháng {month} năm {year}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tiêu Đề Văn Bản */}
          <div style={{ textAlign: 'center', margin: '30px 0 20px 0' }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
              {service.procedureType === 'don_xin_nghi_hoc' ? 'GIẤY XÁC NHẬN NGHỈ HỌC CÓ PHÉP' : 'GIẤY XÁC NHẬN HỌC SINH'}
            </h1>
            <p style={{ fontSize: '12pt', fontStyle: 'italic', margin: 0 }}>
              (Hệ thống Dịch vụ công Trực tuyến - Trường THPT Cao Bá Quát)
            </p>
          </div>

          {/* Nội Dung Xác Nhận */}
          <div style={{ textAlign: 'justify', fontSize: '13.5pt', lineHeight: '1.8' }}>
            <p style={{ textIndent: '1.27cm', margin: '0 0 10px 0' }}>
              <strong>HIỆU TRƯỞNG TRƯỜNG TRUNG HỌC PHỔ THÔNG CAO BÁ QUÁT XÁC NHẬN:</strong>
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '30%', padding: '4px 0' }}>Em: <strong>{service.studentName?.toUpperCase()}</strong></td>
                  <td style={{ width: '35%', padding: '4px 0' }}>Giới tính: <strong>{service.gender || 'Nam'}</strong></td>
                  <td style={{ width: '35%', padding: '4px 0' }}>Mã định danh/CCCD: <strong>{service.identityCard || '---'}</strong></td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Ngày sinh: <strong>{service.birthDate || '---'}</strong></td>
                  <td style={{ padding: '4px 0' }} colSpan={2}>Hiện là học sinh lớp: <strong>{service.studentClass}</strong> (Năm học {currentYear} - {currentYear + 1})</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }} colSpan={3}>Họ tên người giám hộ / Phụ huynh: <strong>{service.parentName}</strong> (SĐT liên hệ: {service.parentPhone})</td>
                </tr>
              </tbody>
            </table>

            <p style={{ textIndent: '1.27cm', margin: '0 0 10px 0' }}>
              Trong quá trình học tập tại Trường THPT Cao Bá Quát, học sinh <strong>{service.studentName}</strong> luôn chấp hành tốt chủ trương của Đảng, pháp luật của Nhà nước, nội quy của Nhà trường và hoàn thành tốt nhiệm vụ học tập, rèn luyện.
            </p>

            <p style={{ textIndent: '1.27cm', margin: '0 0 16px 0' }}>
              <strong>Lý do cấp giấy xác nhận:</strong> {service.reason || 'Bổ sung thủ tục hành chính theo quy định.'}
            </p>

            <p style={{ textIndent: '1.27cm', margin: '0 0 24px 0' }}>
              Giấy xác nhận này có giá trị sử dụng phục vụ mục đích nêu trên trong thời hạn quy định.
            </p>
          </div>

          {/* Footer Ký Tên & Dấu Mộc Số */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <tbody>
              <tr>
                {/* Cột Trái: Mã QR Chứng Thực Số */}
                <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'left', padding: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '8px', maxWidth: '320px' }}>
                    <QRCodeSVG 
                      value={`https://thptcaobaquat.edu.vn/dich-vu-cong?code=${service.code}`} 
                      size={68}
                      level="M"
                    />
                    <div style={{ fontSize: '9pt', fontFamily: 'sans-serif', color: '#334155', lineHeight: '1.3' }}>
                      <strong style={{ color: '#0f172a' }}>MÃ XÁC THỰC SỐ:</strong><br />
                      <span style={{ color: '#0284c7', fontWeight: 'bold' }}>{service.digitalCertificateCode || service.code}</span><br />
                      <span>Quét mã QR để kiểm tra tính hợp lệ của văn bản trên cổng thông tin trường.</span>
                    </div>
                  </div>
                </td>

                {/* Cột Phải: Chữ Ký Hiệu Trưởng & Mộc Đỏ */}
                <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'center', padding: 0 }}>
                  <div style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    HIỆU TRƯỞNG
                  </div>
                  <div style={{ fontSize: '11pt', fontStyle: 'italic', color: '#64748b', marginBottom: '14px' }}>
                    (Ký số điện tử & đóng dấu)
                  </div>

                  {/* Dấu Mộc Đỏ Điện Tử */}
                  <div style={{
                    display: 'inline-block',
                    border: '3px solid #dc2626',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    backgroundColor: 'rgba(254, 242, 242, 0.6)',
                    color: '#dc2626',
                    fontFamily: 'sans-serif',
                    textAlign: 'center',
                    transform: 'rotate(-3deg)',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ★ SỞ GD&ĐT THÀNH PHỐ HÀ NỘI ★
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', margin: '2px 0' }}>
                      TRƯỜNG THPT CAO BÁ QUÁT
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> ĐÃ KÝ SỐ XÁC THỰC HỢP LỆ
                    </div>
                    <div style={{ fontSize: '8.5px', color: '#991b1b', marginTop: '2px' }}>
                      Thời gian: {new Date(service.processedAt || Date.now()).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div style={{ fontSize: '13.5pt', fontWeight: 'bold', marginTop: '16px' }}>
                    Ban Giám Hiệu Trường THPT Cao Bá Quát
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
