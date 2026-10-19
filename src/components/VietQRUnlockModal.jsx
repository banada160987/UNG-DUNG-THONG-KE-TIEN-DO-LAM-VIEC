import React, { useState } from 'react';
import { 
  Lock, QrCode, CreditCard, Send, CheckCircle2, AlertCircle, X, 
  Sparkles, ShieldCheck, ArrowRight, BookOpen, User, Building 
} from 'lucide-react';
import { 
  generateVietQRUrl, 
  submitAccessRequest, 
  recordPaidUnlock, 
  POPULAR_VIETNAMESE_BANKS 
} from '../services/eduMaterialService';

export default function VietQRUnlockModal({ 
  isOpen, 
  onClose, 
  material, 
  student, 
  onSuccess 
}) {
  const [activeTab, setActiveTab] = useState('vietqr'); // 'vietqr' | 'request'
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);

  if (!isOpen || !material) return null;

  const bankInfo = material.bank_info || {
    bankCode: 'ICB',
    accountNumber: '108876543210',
    accountName: material.teacher_name || 'GIAO VIEN THPT CAO BA QUAT'
  };

  const amount = material.price || 20000;
  const studentCode = student?.student_code || student?.username || 'HOCSINH';
  const transferMemo = `CBQ ${studentCode} ${material.id.slice(-6)}`.toUpperCase();

  const qrImageUrl = generateVietQRUrl({
    bankCode: bankInfo.bankCode,
    accountNumber: bankInfo.accountNumber,
    accountName: bankInfo.accountName,
    amount,
    description: transferMemo
  });

  const bankMeta = POPULAR_VIETNAMESE_BANKS.find(b => b.code === bankInfo.bankCode) || {
    shortName: bankInfo.bankCode,
    name: 'Ngân hàng'
  };

  const handleSendFreeRequest = async (e) => {
    e.preventDefault();
    if (!student) {
      alert("Vui lòng đăng nhập tài khoản học sinh để gửi yêu cầu!");
      return;
    }

    setSubmittingRequest(true);
    try {
      await submitAccessRequest({
        materialId: material.id,
        materialTitle: material.title,
        teacherName: material.teacher_name,
        student,
        message: requestMessage
      });
      setRequestSent(true);
    } catch (err) {
      alert("Lỗi khi gửi yêu cầu: " + err.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleConfirmPaid = () => {
    if (!student) {
      alert("Vui lòng đăng nhập học sinh để ghi nhận quyền truy cập!");
      return;
    }

    recordPaidUnlock({
      materialId: material.id,
      student,
      amount,
      transactionRef: `VQR-${Date.now()}`
    });

    setPaidConfirmed(true);
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '580px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
              <Lock size={12} color="#fde047" /> HỌC LIỆU SỐ CHUYÊN ĐỀ PHÂN QUYỀN
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
              Mở Khóa Truy Cập Học Liệu
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Material Summary Badge */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
            Môn {material.subject} • Giáo viên: <strong>{material.teacher_name}</strong> • Lớp áp dụng: <strong>{(material.target_classes || []).join(', ')}</strong>
          </div>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', lineHeight: 1.4, fontWeight: '700' }}>
            {material.title}
          </h4>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
          {material.is_monetized && (
            <button
              onClick={() => setActiveTab('vietqr')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'vietqr' ? '#ffffff' : 'transparent',
                fontWeight: 'bold',
                fontSize: '13.5px',
                color: activeTab === 'vietqr' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                borderBottom: activeTab === 'vietqr' ? '2px solid #2563eb' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <QrCode size={16} /> Mở Khóa Nhanh (VietQR)
            </button>
          )}

          <button
            onClick={() => setActiveTab('request')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'request' ? '#ffffff' : 'transparent',
              fontWeight: 'bold',
              fontSize: '13.5px',
              color: activeTab === 'request' ? '#16a34a' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === 'request' ? '2px solid #16a34a' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Send size={15} /> Xin Cấp Quyền Miễn Phí
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* TAB 1: VIETQR PAYMENT */}
          {activeTab === 'vietqr' && material.is_monetized && (
            <div>
              {paidConfirmed ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '20px', fontWeight: 'bold' }}>
                    MỞ KHÓA THÀNH CÔNG!
                  </h3>
                  <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
                    Hệ thống đã kích hoạt quyền truy cập trọn đời tài liệu này cho em.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'inline-block', padding: '8px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                      <img 
                        src={qrImageUrl} 
                        alt="VietQR Chuyển Khoản Mở Khóa" 
                        style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }} 
                      />
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>
                      Quét mã bằng bất kỳ ứng dụng Ngân hàng nào (VietinBank, VCB, MB, MoMo...)
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Ngân hàng thụ hưởng:</span>
                      <strong>{bankMeta.shortName} ({bankInfo.bankCode})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                      <strong style={{ color: '#1e3a8a', fontSize: '14px' }}>{bankInfo.accountNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Chủ tài khoản (Giáo viên):</span>
                      <strong>{bankInfo.accountName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                      <span style={{ color: '#64748b' }}>Mức phí mở khóa:</span>
                      <strong style={{ color: '#dc2626', fontSize: '16px' }}>{amount.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Nội dung chuyển khoản:</span>
                      <code style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{transferMemo}</code>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button
                      onClick={handleConfirmPaid}
                      style={{
                        width: '100%',
                        padding: '13px',
                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={18} /> TÔI ĐÃ CHUYỂN KHOẢN XONG
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUEST ACCESS */}
          {activeTab === 'request' && (
            <div>
              {requestSent ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '19px', fontWeight: 'bold' }}>
                    ĐÃ GỬI YÊU CẦU THÀNH CÔNG!
                  </h3>
                  <p style={{ color: '#475569', fontSize: '13.5px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                    Thầy/Cô <strong>{material.teacher_name}</strong> đã nhận được lời nhắn của em trên Cổng Giáo Viên. Hệ thống sẽ mở khóa tài liệu ngay khi Thầy/Cô bấm duyệt.
                  </p>
                  <button
                    onClick={onClose}
                    style={{ padding: '9px 20px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Đã hiểu & Đóng cửa sổ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendFreeRequest}>
                  <div style={{ marginBottom: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '12px', fontSize: '13px', color: '#1e40af' }}>
                    <strong>Dành cho học sinh:</strong> Nếu em không thuộc các lớp Thầy/Cô đang trực tiếp giảng dạy nhưng muốn học thêm chuyên đề này (học sinh đội tuyển, bồi dưỡng, hoàn cảnh khó khăn...), em hãy gửi tin nhắn cho Thầy/Cô tại đây.
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                      Lời nhắn gửi tới Thầy/Cô ({material.teacher_name})
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={requestMessage}
                      onChange={e => setRequestMessage(e.target.value)}
                      placeholder="Em chào Thầy/Cô, em là học sinh lớp... Em rất mong muốn được Thầy/Cô cấp quyền để tự học thêm tài liệu này ạ..."
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRequest}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '14.5px',
                      cursor: submittingRequest ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <Send size={16} /> {submittingRequest ? 'Đang gửi yêu cầu...' : 'GỬI YÊU CẦU XIN CẤP QUYỀN'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
