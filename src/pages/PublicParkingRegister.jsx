import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Bike, ShieldCheck, CheckCircle2, QrCode, Printer, Calendar, ArrowRight, UserCheck, Search } from 'lucide-react';

const DEFAULT_PACKAGES = [
  { key: 'month', label: 'Đăng ký Theo Tháng', months: 1, fee: 50000, desc: 'Thời hạn 1 tháng (50.000 VNĐ)' },
  { key: 'quarter', label: 'Đăng ký Theo Quý (3 tháng)', months: 3, fee: 130000, desc: 'Thời hạn 3 tháng (Tiết kiệm 20.000 VNĐ)' },
  { key: 'term', label: 'Đăng ký Theo Học Kỳ (5 tháng)', months: 5, fee: 200000, desc: 'Thời hạn 1 Học kỳ (Tiết kiệm 50.000 VNĐ)' },
  { key: 'year', label: 'Đăng ký Cả Năm Học (9 tháng)', months: 9, fee: 400000, desc: 'Thời hạn trọn cả năm học (Tiết kiệm 50.000 VNĐ)' }
];

export default function PublicParkingRegister() {
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [studentRoster, setStudentRoster] = useState([]);
  
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('Xe máy điện');
  const [vehicleColor, setVehicleColor] = useState('');
  const [packageType, setPackageType] = useState('term');
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchConfiguredPackages();
    fetchStudentRoster();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setShowClassSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchConfiguredPackages() {
    try {
      const { data, error } = await supabase
        .from('cbq_parking_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted = data.map(p => ({
          key: p.package_key,
          label: p.title,
          months: p.months_count,
          fee: Number(p.fee_amount) || 0,
          hide_fee: !!p.hide_fee,
          desc: p.description || `${p.title}`
        }));
        setPackages(formatted);
      }
    } catch (err) {
      console.warn("Nạp gói vé mặc định:", err);
    }
  }

  async function fetchStudentRoster() {
    try {
      const { data, error } = await supabase
        .from('cbq_students')
        .select('*')
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        setStudentRoster(data);
        localStorage.setItem('cbq_students_data', JSON.stringify(data));
      } else {
        const localData = localStorage.getItem('cbq_students_data');
        if (localData) {
          setStudentRoster(JSON.parse(localData));
        }
      }
    } catch (err) {
      console.warn("Nạp danh sách học sinh từ local:", err);
      const localData = localStorage.getItem('cbq_students_data');
      if (localData) {
        setStudentRoster(JSON.parse(localData));
      }
    }
  }

  const [classSuggestions, setClassSuggestions] = useState([]);
  const [showClassSuggestions, setShowClassSuggestions] = useState(false);
  const classDropdownRef = useRef(null);

  // Handle Autocomplete Search for Name
  const handleNameChange = (val) => {
    setStudentName(val);
    setIsVerifiedStudent(false);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const clean = val.trim().toLowerCase();
    const cleanClass = studentClass.trim().toLowerCase();

    // Prioritize students in current class if class is entered
    let matches = studentRoster.filter(s => {
      const matchNameOrCode = s.student_name.toLowerCase().includes(clean) || s.student_code.toLowerCase().includes(clean);
      return matchNameOrCode;
    });

    if (cleanClass) {
      matches.sort((a, b) => {
        const aInClass = a.student_class.toLowerCase() === cleanClass;
        const bInClass = b.student_class.toLowerCase() === cleanClass;
        if (aInClass && !bInClass) return -1;
        if (!aInClass && bInClass) return 1;
        return 0;
      });
    }

    matches = matches.slice(0, 8);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  // Handle Autocomplete Search for Class
  const handleClassChange = (val) => {
    setStudentClass(val);
    if (!val.trim()) {
      setClassSuggestions([]);
      setShowClassSuggestions(false);
      return;
    }

    const clean = val.trim().toLowerCase();
    // Find all students in matching class or class names
    const matchingStudents = studentRoster.filter(s => 
      s.student_class.toLowerCase().includes(clean) ||
      s.student_class.toLowerCase() === clean
    ).slice(0, 8);

    setClassSuggestions(matchingStudents);
    setShowClassSuggestions(matchingStudents.length > 0);
  };

  const handleSelectSuggestion = (student) => {
    setStudentName(student.student_name);
    setStudentClass(student.student_class);
    setStudentCode(student.student_code);
    setIsVerifiedStudent(true);
    setShowSuggestions(false);
    setShowClassSuggestions(false);
  };

  const calculateEndDate = (startDateStr, monthsCount) => {
    const d = new Date(startDateStr);
    d.setMonth(d.getMonth() + (monthsCount || 1));
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
      const selectedPkg = packages.find(p => p.key === packageType) || packages[0];
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
                  {packages.find(p => p.key === successTicket.package_type)?.label || 'Đăng ký Học kỳ'}
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
            {/* AUTOCOMPLETE STUDENT NAME FIELD */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <label style={styles.label}>
                Họ và Tên học sinh (*)
                {isVerifiedStudent && (
                  <span style={{ fontSize: '11.5px', color: '#166534', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '12px', marginLeft: '6px', border: '1px solid #bbf7d0' }}>
                    ✓ Đã xác thực CSDL
                  </span>
                )}
              </label>
              <input 
                type="text" 
                required 
                placeholder="Gõ tên hoặc Mã HS để tự động gợi ý..."
                value={studentName}
                onChange={e => handleNameChange(e.target.value)}
                style={{
                  ...styles.input,
                  borderColor: isVerifiedStudent ? '#166534' : '#cbd5e1',
                  backgroundColor: isVerifiedStudent ? '#f0fdf4' : '#ffffff'
                }}
              />

              {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    💡 GỢI Ý HỌC SINH TỪ CSDL NHÀ TRƯỜNG (Bấm chọn):
                  </div>
                  {suggestions.map((st, idx) => (
                    <div 
                      key={st.id || idx}
                      onClick={() => handleSelectSuggestion(st)}
                      style={styles.suggestionItem}
                    >
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{st.student_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Lớp: <strong style={{ color: '#be123c' }}>{st.student_class}</strong> • Mã HS: {st.student_code}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AUTOCOMPLETE CLASS FIELD */}
            <div style={{ position: 'relative' }} ref={classDropdownRef}>
              <label style={styles.label}>Lớp học (*)</label>
              <input 
                type="text" 
                required 
                placeholder="Gõ Lớp (VD: 10A5, 11A1) để chọn HS..."
                value={studentClass}
                onChange={e => handleClassChange(e.target.value)}
                style={styles.input}
              />

              {/* CLASS AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
              {showClassSuggestions && classSuggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#be123c', backgroundColor: '#fff1f2', borderBottom: '1px solid #fca5a5' }}>
                    🏫 HỌC SINH THUỘC LỚP {studentClass.toUpperCase()} (Bấm để chọn):
                  </div>
                  {classSuggestions.map((st, idx) => (
                    <div 
                      key={st.id || idx}
                      onClick={() => handleSelectSuggestion(st)}
                      style={styles.suggestionItem}
                    >
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{st.student_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Lớp: <strong style={{ color: '#be123c' }}>{st.student_class}</strong> • Mã HS: {st.student_code}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <label style={styles.label}>Mã học sinh</label>
              <input 
                type="text" 
                placeholder="VD: HS11A1-025"
                value={studentCode}
                onChange={e => setStudentCode(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* DYNAMIC PACKAGE SELECTION */}
          <div style={{ marginTop: '25px' }}>
            <label style={{ ...styles.label, fontSize: '14px', color: '#be123c' }}>
              🎫 Chọn Gói Đăng Ký Gửi Xe (*):
            </label>
            <div style={styles.packageGrid}>
              {packages.map(pkg => (
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
                  <div style={{ fontWeight: '800', color: pkg.hide_fee || pkg.fee === 0 ? '#166534' : '#be123c', marginTop: '6px', fontSize: '15px' }}>
                    {pkg.hide_fee ? '🟢 Miễn phí' : pkg.fee === 0 ? '🟢 Miễn phí (0 VNĐ)' : `${pkg.fee.toLocaleString()} VNĐ`}
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
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
    zIndex: 100,
    marginTop: '4px',
    maxHeight: '220px',
    overflowY: 'auto'
  },
  suggestionItem: {
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background 0.15s',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
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
    justify: 'space-between',
    alignItems: 'center'
  },
  ticketFooter: {
    marginTop: '20px',
    paddingTop: '14px',
    borderTop: '1px dashed #cbd5e1',
    display: 'flex',
    justify: 'space-between',
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
