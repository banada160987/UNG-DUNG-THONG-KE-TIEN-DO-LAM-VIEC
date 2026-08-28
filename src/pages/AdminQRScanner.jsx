import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { QrCode, CheckCircle, XCircle, User, Calendar, MapPin, Bike } from 'lucide-react';

export default function AdminQRScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanningStatus, setScanningStatus] = useState('Đang chờ quét...');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    }, /* verbose= */ false);

    scanner.render(success, error);

    function success(result) {
      setScanResult(result);
      fetchTicketData(result);
      // Optional: stop scanning after a successful scan
      // scanner.clear(); 
    }

    function error(err) {
      // console.warn(err);
    }

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, []);

  const fetchTicketData = async (ticketCode) => {
    setLoading(true);
    setError('');
    setTicketData(null);
    setScanningStatus(`Đang kiểm tra mã: ${ticketCode}...`);

    try {
      // Đầu tiên kiểm tra trong bảng parking (xe máy/xe đạp)
      const { data: parkingData, error: parkingError } = await supabase
        .from('cbq_parking_registrations')
        .select('*')
        .eq('ticket_code', ticketCode)
        .maybeSingle();

      if (parkingData) {
        setTicketData({ type: 'parking', ...parkingData });
        setScanningStatus('Quét thành công!');
        return;
      }

      // Nếu không thấy, kiểm tra trong bảng bus
      const { data: busData, error: busError } = await supabase
        .from('cbq_bus_registrations')
        .select('*')
        .eq('ticket_code', ticketCode)
        .maybeSingle();
      
      if (busData) {
        setTicketData({ type: 'bus', ...busData });
        setScanningStatus('Quét thành công!');
        return;
      }

      setError('Không tìm thấy vé hợp lệ trong hệ thống.');
      setScanningStatus('Lỗi xác thực');

    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ.');
      setScanningStatus('Lỗi xác thực');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setTicketData(null);
    setError('');
    setScanningStatus('Đang chờ quét...');
  };

  const isValidStatus = (status) => status === 'approved' || status === 'paid';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <QrCode size={32} color="var(--primary)" />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Máy Quét Thẻ (QR Scanner)</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Scanner Section */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: 'white' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
            Camera Quét Mã
          </h2>
          <div id="reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}></div>
          <div style={{ marginTop: '16px', textAlign: 'center', fontWeight: '500', color: '#64748b' }}>
            {scanningStatus}
          </div>
        </div>

        {/* Result Section */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
            Kết Quả Xác Thực
          </h2>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          )}

          {error && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#ef4444', textAlign: 'center' }}>
              <XCircle size={64} style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0' }}>Từ chối truy cập</h3>
              <p style={{ margin: 0 }}>{error}</p>
              <button onClick={handleReset} style={{ marginTop: '24px', padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Quét Lại</button>
            </div>
          )}

          {ticketData && !loading && (
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', borderRadius: '12px',
                background: isValidStatus(ticketData.status) ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${isValidStatus(ticketData.status) ? '#22c55e' : '#ef4444'}`,
                marginBottom: '20px'
              }}>
                {isValidStatus(ticketData.status) ? (
                  <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '12px' }} />
                ) : (
                  <XCircle size={48} color="#ef4444" style={{ marginBottom: '12px' }} />
                )}
                <h3 style={{ margin: '0 0 4px 0', color: isValidStatus(ticketData.status) ? '#15803d' : '#b91c1c', fontSize: '20px' }}>
                  {isValidStatus(ticketData.status) ? 'HỢP LỆ - ĐƯỢC PHÉP VÀO' : 'KHÔNG HỢP LỆ'}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontWeight: '500' }}>
                  Trạng thái thẻ: {ticketData.status === 'approved' ? 'Đã duyệt' : ticketData.status === 'paid' ? 'Đã thanh toán' : ticketData.status === 'pending' ? 'Chờ duyệt/thanh toán' : 'Bị từ chối'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <User size={20} color="#64748b" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Học sinh</div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{ticketData.student_name} - {ticketData.student_class}</div>
                  </div>
                </div>

                {ticketData.type === 'parking' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                      <Bike size={20} color="#64748b" />
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Phương tiện</div>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                          {ticketData.vehicle_type} - Biển số: <span style={{ color: '#0284c7' }}>{ticketData.license_plate || 'Không có'}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                      <Calendar size={20} color="#64748b" />
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Hạn thẻ</div>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{ticketData.start_date} đến {ticketData.end_date}</div>
                      </div>
                    </div>
                  </>
                )}

                {ticketData.type === 'bus' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <MapPin size={20} color="#64748b" />
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Tuyến xe</div>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                        Điểm đón: {ticketData.pickup_point} ({ticketData.route_type === '2-way' ? '2 chiều' : '1 chiều'})
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button onClick={handleReset} style={{ padding: '12px 32px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  Quét Vé Tiếp Theo
                </button>
              </div>
            </div>
          )}

          {!ticketData && !loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8' }}>
              <QrCode size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Đưa mã QR của học sinh vào khung camera để kiểm tra</p>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        #reader__dashboard_section_csr button {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #f1f5f9;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          margin: 4px;
        }
        #reader__dashboard_section_csr button:hover {
          background: #e2e8f0;
        }
        #reader__camera_selection {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-family: inherit;
          margin-bottom: 8px;
          width: 100%;
        }
        #reader a {
          color: var(--primary);
        }
      `}} />
    </div>
  );
}
