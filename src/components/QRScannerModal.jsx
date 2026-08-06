import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Clear old state
      setScanResult(null);
      setIsProcessing(false);

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          if (isProcessing) return;
          setIsProcessing(true);
          // Pause scanner while processing
          if (scannerRef.current) {
            try {
              scannerRef.current.pause(true);
            } catch(e){}
          }
          await handleQRCode(decodedText);
        },
        (error) => {
          // parse errors are normal (e.g. no qr code in frame)
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(e => console.error(e));
        } catch(e) {}
      }
    };
  }, [isOpen]);

  const handleQRCode = async (code) => {
    try {
      // Search for guest by invitation_code
      const { data, error } = await supabase
        .from('cbq_guests')
        .select('*')
        .eq('invitation_code', code)
        .single();

      if (error || !data) {
        setScanResult({ type: 'error', message: 'Mã không hợp lệ hoặc khách không có trong hệ thống.' });
      } else {
        // Mark as attending
        const { error: updateError } = await supabase
          .from('cbq_guests')
          .update({ rsvp_status: 'attending', checkin_time: new Date().toISOString() })
          .eq('id', data.id);

        if (updateError) {
          setScanResult({ type: 'error', message: 'Lỗi khi cập nhật trạng thái.' });
        } else {
          setScanResult({ type: 'success', guest: data });
          if (onScanSuccess) onScanSuccess();
        }
      }
    } catch (err) {
      setScanResult({ type: 'error', message: 'Lỗi hệ thống.' });
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsProcessing(false);
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch(e){}
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div className="glass" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{margin: 0}}>Quét mã Check-in</h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        </div>
        
        <div style={styles.content}>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', display: scanResult ? 'none' : 'block' }}></div>
          
          {scanResult && (
            <div style={styles.resultContainer}>
              {scanResult.type === 'success' ? (
                <>
                  <CheckCircle size={64} color="#10b981" />
                  <h3 style={{color: '#10b981', marginTop: '1rem'}}>Check-in Thành công!</h3>
                  <div style={styles.guestCard}>
                    <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{scanResult.guest.name}</div>
                    <div style={{color: '#64748b'}}>{scanResult.guest.category}</div>
                    <div style={{color: '#64748b', fontSize: '0.9rem'}}>{scanResult.guest.phone}</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle size={64} color="#ef4444" />
                  <h3 style={{color: '#ef4444', marginTop: '1rem'}}>Lỗi Check-in</h3>
                  <p>{scanResult.message}</p>
                </>
              )}
              
              <button onClick={resetScanner} className="btn-primary" style={{marginTop: '2rem', padding: '0.75rem 2rem', width: '100%'}}>
                Quét người tiếp theo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b'
  },
  content: {
    padding: '1.5rem',
    textAlign: 'center'
  },
  resultContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 0'
  },
  guestCard: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    width: '100%',
    border: '1px solid #e2e8f0'
  }
};
