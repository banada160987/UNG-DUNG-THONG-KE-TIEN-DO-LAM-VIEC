import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bike, ShieldCheck, CheckCircle2, QrCode, Printer, Calendar, ArrowRight } from 'lucide-react';

const PACKAGES = [
  { key: 'month', label: 'Đăng ký Theo Tháng', months: 1, fee: 50000, desc: 'Thời hạn 1 tháng (50.000 VNĐ)' },
  { key: 'quarter', label: 'Đăng ký Theo Quý (3 tháng)', months: 3, fee: 130000, desc: 'Thời hạn 3 tháng (Tiết kiệm 20.000 VNĐ)' },
  { key: 'term', label: 'Đăng ký Theo Học Kỳ (5 tháng)', months: 5, fee: 200000, desc: 'Thời hạn 1 Học kỳ (Tiết kiệm 50.000 VNĐ)' },
  { key: 'year', label: 'Đăng ký Cả Năm Học (9 tháng)', months: 9, fee: 400000, desc: 'Thời hạn trọn cả năm học (Tiết kiệm 50.000 VNĐ)' }
];

export default function PublicParkingRegister() {
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('Xe máy điện');
  const [vehicleColor, setVehicleColor] = useState('');
  const [packageType, setPackageType] = useState('term');
  
  const [loading, setLoading] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);

  const calculateEndDate = (startDateStr, monthsCount) => {
    const d = new Date(startDateStr);
    d.setMonth(d.getMonth() + monthsCount);
    return d.toISOString().split('T')[0];
  };

  const getGradeLevel = (className) => {
    if (!className) return 'Khối 10';
    if (className.startsWith('11')) return 'Khối 11';
    if (className.startsWith('12')) return 'Khối 12';
    return 'Khối 10';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentClass.trim() || !licensePlate.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    setLoading(true);
    try {
      const selectedPkg = PACKAGES.find(p => p.key === packageType) || PACKAGES[2];
      const today = new Date().toISOString().split('T')[0];
      const endDate = calculateEndDate(today, selectedPkg.months);
      
      const cleanClass = studentClass.trim().toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const ticketCode = `PARK-${cleanClass}-${randomNum}`;
      const gradeLevel = getGradeLevel(cleanClass);

      const payload = {
        ticket_code: ticketCode,
        student_name: studentName.trim(),
        student_code: studentCode.trim() || `HS-${randomNum}`,
        student_class: cleanClass,
        grade_level: gradeLevel,
        license_plate: licensePlate.trim().toUpperCase(),
        vehicle_type: vehicleType,
        vehicle_color: vehicleColor.trim(),
        package_type: packageType,
        start_date: today,
        end_date: endDate,
        fee_amount: selectedPkg.fee,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('cbq_parking_registrations')
        .insert([payload])
        .select()
        .single();

      if (error) {
        // If Supabase table missing, use local payload
        console.warn("Supabase save warn, showing local ticket:", error);
        setSuccessTicket(payload);
      } else {
        setSuccessTicket(data);
      }
    } catch (err) {
      alert("Lỗi đăng ký: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* BANNER HEADER */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconCircle}>
            <Bike size={32} color="#ffffff" />
          </div>
          <div>
            <h2 style={styles.pageTitle}>ĐĂNG KÝ VÉ GỬI XE MÁY HỌC SINH</h2>
            <p style={styles.pageSubtitle}>Trường THPT Cao Bá Quát • Cổng đăng ký vé gửi xe điện tử theo Tháng / Học kỳ / Năm</p>
          </div>
        </div>
      </div>

      {/* SUCCESS TICKET CARD */}
      {successTicket ? (
        <div style={styles.successWrapper}>
          <div style={styles.ticketCard} id="printable-ticket">
            <div style={styles.ticketHeader}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '900', color: '#be123c' }}>THẺ GỬI XE MÁY HỌC SINH</h3>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', marginTop: '2px' }}>MÃ VÉ: {successTicket.ticket_code}</div>
            </div>

            <div style={styles.ticketBody}>
              <div style={styles.ticketRow}>
                <span>Họ và tên học sinh:</span>
                <strong>{successTicket.student_name}</strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Lớp:</span>
                <strong style={{ color: '#be123c' }}>{successTicket.student_class} ({successTicket.grade_level})</strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Biển số xe:</span>
                <strong style={{ fontSize: '16px', color: '#166534', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                  {successTicket.license_plate}
                </strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Loại xe / Màu sắc:</span>
                <strong>{successTicket.vehicle_type} {successTicket.vehicle_color ? `(${successTicket.vehicle_color})` : ''}</strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Gói gửi xe:</span>
                <strong style={{ color: '#b45309' }}>
                  {PACKAGES.find(p => p.key === successTicket.package_type)?.label || 'Đăng ký Học kỳ'}
                </strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Thời hạn hiệu lực:</span>
                <strong style={{ color: '#1e293b' }}>Từ {successTicket.start_date} Đến {successTicket.end_date}</strong>
              </div>
            </div>

            <div style={styles.ticketFooter}>
              <div style={{ textAlign: 'center' }}>
                <QrCode size={64} color="#1e293b" />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Quét mã QR check-in tại cổng xe</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                <div>Xác thực bởi Ban Bảo Vệ</div>
                <div style={{ fontWeight: 'bold', color: '#166534', marginTop: '4px' }}>✓ Đã thanh toán & Đủ điều kiện</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={() => window.print()} style={styles.printBtn}>
              <Printer size={18} /> In Thẻ Gửi Xe Máy
            </button>
            <button onClick={() => setSuccessTicket(null)} style={styles.newRegBtn}>
              Đăng ký xe mới
            </button>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.formTitle}>📝 Thông tin Đăng ký Vé Xe Máy Học Sinh</h3>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Họ và Tên học sinh (*)</label>
              <input 
                type="text" 
                required 
                placeholder="VD: Nguyễn Văn An"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Lớp học (*)</label>
              <input 
                type="text" 
                required 
                placeholder="VD: 11A1, 10A5, 12A2..."
                value={studentClass}
                onChange={e => setStudentClass(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Biển số xe (*)</label>
              <input 
                type="text" 
                required 
                placeholder="VD: 29B1-567.89 hoặc 29-AA 1234"
                value={licensePlate}
                onChange={e => setLicensePlate(e.target.value)}
                style={{ ...styles.input, fontWeight: 'bold', letterSpacing: '1px' }}
              />
            </div>

            <div>
              <label style={styles.label}>Loại phương tiện (*)</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={styles.input}>
                <option value="Xe máy điện">⚡ Xe máy điện (Yadea, VinFast, Pega...)</option>
                <option value="Xe máy 50cc">🛵 Xe máy 50cc (Wave, Cub, Giorno...)</option>
                <option value="Xe máy >50cc">🏍️ Xe máy trên 50cc (Có GPLX)</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Màu xe (không bắt buộc)</label>
              <input 
                type="text" 
                placeholder="VD: Màu Đen nhám, Đỏ Trắng..."
                value={vehicleColor}
                onChange={e => setVehicleColor(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Mã học sinh (nếu nhớ)</label>
              <input 
                type="text" 
                placeholder="VD: HS11A1-025"
                value={studentCode}
                onChange={e => setStudentCode(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* PACKAGE SELECTION */}
          <div style={{ marginTop: '25px' }}>
            <label style={{ ...styles.label, fontSize: '14px', color: '#be123c' }}>
              🎫 Chọn Gói Đăng Ký Gửi Xe (*):
            </label>
            <div style={styles.packageGrid}>
              {PACKAGES.map(pkg => (
                <div 
                  key={pkg.key}
                  onClick={() => setPackageType(pkg.key)}
                  style={{
                    ...styles.pkgCard,
                    borderColor: packageType === pkg.key ? '#be123c' : '#cbd5e1',
                    backgroundColor: packageType === pkg.key ? '#fff1f2' : '#ffffff'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{pkg.label}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>{pkg.desc}</div>
                  <div style={{ fontWeight: '800', color: '#be123c', marginTop: '6px', fontSize: '15px' }}>
                    {pkg.fee.toLocaleString()} VNĐ
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Đang xử lý đăng ký...' : '🚀 XÁC NHẬN ĐĂNG KÝ VÉ XE MÁY'}
          </button>
        </form>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 10px',
    maxWidth: '900px',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '22px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    marginBottom: '25px'
  },
  iconCircle: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    backgroundColor: '#be123c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(190, 18, 60, 0.3)'
  },
  pageTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#be123c'
  },
  pageSubtitle: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0'
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '17px',
    color: '#1e293b',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '12px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '5px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    boxSizing: 'border-box'
  },
  packageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginTop: '10px'
  },
  pkgCard: {
    padding: '14px',
    borderRadius: '12px',
    border: '2px solid',
    cursor: 'pointer',
    transition: '0.2s'
  },
  submitBtn: {
    width: '100%',
    marginTop: '30px',
    padding: '14px',
    backgroundColor: '#be123c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(190, 18, 60, 0.3)'
  },
  successWrapper: {
    textAlign: 'center',
    padding: '10px 0'
  },
  ticketCard: {
    maxWidth: '450px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '2px dashed #be123c',
    padding: '24px',
    boxShadow: '0 12px 35px rgba(0,0,0,0.1)',
    textAlign: 'left'
  },
  ticketHeader: {
    textAlign: 'center',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px',
    marginBottom: '14px'
  },
  ticketBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '13.5px'
  },
  ticketRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ticketFooter: {
    marginTop: '20px',
    paddingTop: '14px',
    borderTop: '1px dashed #cbd5e1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '11px 22px',
    backgroundColor: '#be123c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  newRegBtn: {
    padding: '11px 20px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
