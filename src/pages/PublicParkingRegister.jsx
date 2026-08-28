import { useState, useEffect, useRef } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { Bike, ShieldCheck, CheckCircle2, QrCode, Printer, Calendar, ArrowRight, UserCheck, Search, Bus, MapPin, Navigation } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const DEFAULT_PACKAGES = [
  { key: 'month', label: 'Đăng ký Theo Tháng', months: 1, fee: 50000, desc: 'Thời hạn 1 tháng (50.000 VNĐ)' },
  { key: 'quarter', label: 'Đăng ký Theo Quý (3 tháng)', months: 3, fee: 130000, desc: 'Thời hạn 3 tháng (Tiết kiệm 20.000 VNĐ)' },
  { key: 'term', label: 'Đăng ký Theo Học Kỳ (5 tháng)', months: 5, fee: 200000, desc: 'Thời hạn 1 Học kỳ (Tiết kiệm 50.000 VNĐ)' },
  { key: 'year', label: 'Đăng ký Cả Năm Học (9 tháng)', months: 9, fee: 400000, desc: 'Thời hạn trọn cả năm học (Tiết kiệm 50.000 VNĐ)' }
];

const DEFAULT_BUS_PACKAGES = [
  { key: 'month_2way', label: '2 Chiều - Đăng ký Theo Tháng', months: 1, fee: 300000, desc: 'Thời hạn 1 tháng, đưa đón 2 chiều (300.000 VNĐ)' },
  { key: 'term_2way', label: '2 Chiều - Đăng ký Theo Học Kỳ', months: 5, fee: 1400000, desc: 'Đưa đón 2 chiều, thời hạn 5 tháng' },
  { key: 'month_1way', label: '1 Chiều - Đăng ký Theo Tháng', months: 1, fee: 180000, desc: 'Thời hạn 1 tháng, đưa đón 1 chiều (180.000 VNĐ)' },
];

export default function PublicParkingRegister() {
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [busPackages, setBusPackages] = useState(DEFAULT_BUS_PACKAGES);
  const [studentRoster, setStudentRoster] = useState([]);
  
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [noLicensePlate, setNoLicensePlate] = useState(false);
  const [vehicleType, setVehicleType] = useState('Xe máy điện');
  const [vehicleColor, setVehicleColor] = useState('');
  const [packageType, setPackageType] = useState('term');
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);

  // System Configuration State
  const [parkingConfig, setParkingConfig] = useState({
    isOpen: true,
    startDate: '',
    endDate: '',
    message: ''
  });
  const [busConfig, setBusConfig] = useState({
    isOpen: true,
    startDate: '',
    endDate: '',
    message: ''
  });

  // Bus Registration State
  const [activeTab, setActiveTab] = useState('parking'); // 'parking' | 'bus'
  const [busDistance, setBusDistance] = useState('');
  const [busAddress, setBusAddress] = useState('');
  const [busPickupPoint, setBusPickupPoint] = useState('');
  const [busRouteType, setBusRouteType] = useState('2-way'); // '1-way' or '2-way'
  const [busPackageType, setBusPackageType] = useState('month_2way');
  const [successBusTicket, setSuccessBusTicket] = useState(null);

  const [loading, setLoading] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);
  
  // Lookup & Edit State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null); // { type: 'parking'|'bus', id: string, ... }

  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchConfiguredPackages();
    fetchStudentRoster();
    fetchRegConfig();

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

  async function fetchRegConfig() {
    try {
      // Parking Config
      const { data: parkingData, error: parkingError } = await supabase.from('cbq_parking_settings').select('*').maybeSingle();
      if (!parkingError && parkingData) {
        setParkingConfig({
          isOpen: parkingData.is_open,
          startDate: parkingData.start_time,
          endDate: parkingData.end_time,
          message: parkingData.notice_message
        });
      } else {
        const local = localStorage.getItem('cbq_parking_settings');
        if (local) {
          const parsed = JSON.parse(local);
          setParkingConfig({
            isOpen: parsed.is_open !== undefined ? parsed.is_open : true,
            startDate: parsed.start_time,
            endDate: parsed.end_time,
            message: parsed.notice_message
          });
        }
      }

      // Bus Config
      const { data: busData, error: busError } = await supabase.from('cbq_bus_settings').select('*').maybeSingle();
      if (!busError && busData) {
        setBusConfig({
          isOpen: busData.is_open,
          startDate: busData.start_time,
          endDate: busData.end_time,
          message: busData.notice_message
        });
      } else {
        const local = localStorage.getItem('cbq_bus_settings');
        if (local) {
          const parsed = JSON.parse(local);
          setBusConfig({
            isOpen: parsed.is_open !== undefined ? parsed.is_open : true,
            startDate: parsed.start_time,
            endDate: parsed.end_time,
            message: parsed.notice_message
          });
        }
      }
    } catch (err) {
      console.warn("Lỗi nạp cấu hình thời gian:", err);
    }
  }

  async function fetchConfiguredPackages() {
    try {
      const [parkingRes, busRes] = await Promise.all([
        supabase.from('cbq_parking_packages').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('cbq_bus_packages').select('*').eq('is_active', true).order('sort_order', { ascending: true })
      ]);

      if (!parkingRes.error && parkingRes.data && parkingRes.data.length > 0) {
        const formatted = parkingRes.data.map(p => ({
          key: p.package_key, 
          label: p.title, 
          months: p.months_count, 
          fee: Number(p.fee_amount) || 0, 
          hide_fee: !!p.hide_fee, 
          desc: p.description || `${p.title}`,
          applicable_vehicles: p.applicable_vehicles || []
        }));
        setPackages(formatted);
      }
      
      if (!busRes.error && busRes.data && busRes.data.length > 0) {
        const formattedBus = busRes.data.map(p => ({
          key: p.package_key, label: p.title, months: p.months_count, fee: Number(p.fee_amount) || 0, hide_fee: !!p.hide_fee, desc: p.description || `${p.title}`
        }));
        setBusPackages(formattedBus);
        if (formattedBus.length > 0) setBusPackageType(formattedBus[0].key);
      }
    } catch (err) {
      console.warn("Nạp gói vé mặc định:", err);
    }
  }

  async function fetchStudentRoster() {
    try {
      const localData = localStorage.getItem('cbq_students_data');
      if (localData) {
        try {
          setStudentRoster(JSON.parse(localData));
          // Đã loại bỏ 'return' ở đây để dữ liệu luôn được fetch mới ngầm và cập nhật
        } catch (e) {}
      }

      let allStudents = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('cbq_students')
          .select('*')
          .eq('is_active', true)
          .range(from, from + step - 1);

        if (error) {
          console.warn("Lỗi phân trang tải danh sách học sinh:", error);
          break;
        }

        if (data && data.length > 0) {
          allStudents = [...allStudents, ...data];
          from += step;
          if (data.length < step) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      if (allStudents.length > 0) {
        setStudentRoster(allStudents);
        localStorage.setItem('cbq_students_data', JSON.stringify(allStudents));
      }
    } catch (err) {
      console.warn("Lỗi tải danh sách học sinh:", err);
    }
  }

  const [classSuggestions, setClassSuggestions] = useState([]);
  const [showClassSuggestions, setShowClassSuggestions] = useState(false);
  const classDropdownRef = useRef(null);

  const isRegistrationOpen = (type = activeTab) => {
    const config = type === 'bus' ? busConfig : parkingConfig;
    if (config.isOpen === false) return false;
    const now = new Date();
    if (config.startDate && now < new Date(config.startDate)) return false;
    if (config.endDate && now > new Date(config.endDate)) return false;
    return true;
  };

  // ----- LOGIC TRA CỨU (LOOKUP) -----
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setIsSearching(true);
    setLookupResults([]);
    try {
      const q = lookupQuery.trim().toUpperCase();
      
      // Tìm trong bảng Gửi Xe
      const { data: parkData } = await supabase
        .from('cbq_parking_registrations')
        .select('*')
        .or(`student_code.eq.${q},ticket_code.eq.${q}`);

      // Tìm trong bảng Xe Đưa Đón
      const { data: busData } = await supabase
        .from('cbq_bus_registrations')
        .select('*')
        .or(`student_code.eq.${q},ticket_code.eq.${q}`);

      const results = [];
      if (parkData) {
        parkData.forEach(p => results.push({ ...p, recordType: 'parking' }));
      }
      if (busData) {
        busData.forEach(b => results.push({ ...b, recordType: 'bus' }));
      }

      setLookupResults(results);
      if (results.length === 0) {
        alert("Không tìm thấy dữ liệu đăng ký nào với Mã Học Sinh hoặc Mã Vé này.");
      }
    } catch (err) {
      alert("Lỗi tìm kiếm: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const startEdit = (record) => {
    setEditingTicket(record);
    // Điền dữ liệu chung
    setStudentName(record.student_name || '');
    setStudentClass(record.student_class || '');
    setStudentCode(record.student_code || '');
    setIsVerifiedStudent(true); // Đánh dấu đã xác thực khi sửa vé

    if (record.recordType === 'parking') {
      setActiveTab('parking');
      setLicensePlate(record.license_plate || '');
      setVehicleType(record.vehicle_type || 'Xe máy điện');
      setVehicleColor(record.vehicle_color || '');
      setPackageType(record.package_type || 'term');
    } else {
      setActiveTab('bus');
      setBusDistance(record.distance_km || '');
      setBusAddress(record.address || record.home_address || '');
      setBusPickupPoint(record.pickup_point || '');
      setBusRouteType(record.route_type || '2-way');
      setBusPackageType(record.package_type || 'month_2way');
    }
  };

  const cancelEdit = () => {
    setEditingTicket(null);
    setStudentName('');
    setStudentClass('');
    setStudentCode('');
    setLicensePlate('');
    setVehicleColor('');
    setBusDistance('');
    setBusAddress('');
    setBusPickupPoint('');
    setIsVerifiedStudent(false);
    setActiveTab('lookup');
  };
  // ----------------------------------

  // Compute Unique Classes across Khối 10, Khối 11, Khối 12
  const getUniqueClassesList = () => {
    const defaults = [];
    ['10', '11', '12'].forEach(g => {
      for (let i = 1; i <= 15; i++) defaults.push(`${g}A${i}`);
    });

    const fromRoster = studentRoster.map(s => s.student_class?.trim().toUpperCase()).filter(Boolean);
    const combined = Array.from(new Set([...fromRoster, ...defaults]));

    return combined.sort((a, b) => {
      const gradeA = parseInt(a.slice(0, 2)) || 10;
      const gradeB = parseInt(b.slice(0, 2)) || 10;
      if (gradeA !== gradeB) return gradeA - gradeB;
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  };

  // Autocomplete Search for Student Name
  const filterNameSuggestions = (nameVal, classVal = studentClass) => {
    const cleanName = (nameVal || '').trim().toLowerCase();
    const cleanClass = (classVal || '').trim().toLowerCase();

    const normalize = (str) => {
      return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
    };
    const cleanNameNormalized = normalize(cleanName);

    let matches = studentRoster;
    if (cleanClass) {
      matches = matches.filter(s => s.student_class?.toLowerCase() === cleanClass);
    }
    if (cleanName) {
      matches = matches.filter(s => {
        const studentName = s.student_name?.toLowerCase() || '';
        const studentCode = s.student_code?.toLowerCase() || '';
        return studentName.includes(cleanName) || 
               normalize(studentName).includes(cleanNameNormalized) ||
               studentCode.includes(cleanName);
      });
    }

    const sliced = matches.slice(0, 12);
    setSuggestions(sliced);
    setShowSuggestions(sliced.length > 0);
  };

  const handleNameChange = (val) => {
    setStudentName(val);
    setIsVerifiedStudent(false);
    filterNameSuggestions(val);
  };

  const handleNameFocus = () => {
    filterNameSuggestions(studentName);
  };

  // Autocomplete Search for Class
  const filterClassSuggestions = (val) => {
    const allUnique = getUniqueClassesList();
    const clean = (val || '').trim().toUpperCase();
    if (!clean) {
      setClassSuggestions(allUnique.slice(0, 15));
      setShowClassSuggestions(true);
      return;
    }

    const filtered = allUnique.filter(c => {
      const upper = c.toUpperCase();
      // Prefix match for grade numbers 10, 11, 12 so 10A12 does not trigger when typing 12
      if (clean === '10' || clean === '11' || clean === '12') {
        return upper.startsWith(clean);
      }
      return upper.startsWith(clean) || upper.includes(clean);
    }).slice(0, 15);

    setClassSuggestions(filtered);
    setShowClassSuggestions(filtered.length > 0);
  };

  const handleClassChange = (val) => {
    setStudentClass(val);
    filterClassSuggestions(val);
  };

  const handleClassFocus = () => {
    filterClassSuggestions(studentClass);
  };

  const handleSelectClassSuggestion = (clsName) => {
    setStudentClass(clsName);
    setShowClassSuggestions(false);
    // Automatically trigger student suggestions for this class
    filterNameSuggestions(studentName, clsName);
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

  const getGradeLevel = (clsName) => {
    if (!clsName) return 'Khối 10';
    const clean = String(clsName).trim().toUpperCase();

    const matchPrefix = clean.match(/^(10|11|12)/);
    if (matchPrefix) {
      return `Khối ${matchPrefix[1]}`;
    }

    if (/\b12\b|12[A-Z]/i.test(clean)) return 'Khối 12';
    if (/\b11\b|11[A-Z]/i.test(clean)) return 'Khối 11';
    if (/\b10\b|10[A-Z]/i.test(clean)) return 'Khối 10';

    return 'Khối 10';
  };

  const isBicycle = vehicleType === 'Xe đạp' || vehicleType === 'Xe đạp điện';

  const filteredPackages = packages.filter(p => !p.applicable_vehicles || p.applicable_vehicles.length === 0 || p.applicable_vehicles.includes(vehicleType));

  useEffect(() => {
    const valid = packages.filter(p => !p.applicable_vehicles || p.applicable_vehicles.length === 0 || p.applicable_vehicles.includes(vehicleType));
    setPackageType(prev => {
      if (valid.length > 0 && !valid.find(p => p.key === prev)) {
        return valid[0].key;
      }
      return prev;
    });
  }, [vehicleType, packages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentClass.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }
    if (!isBicycle && !noLicensePlate && !licensePlate.trim()) {
      alert("Vui lòng nhập Biển số xe.");
      return;
    }
    if (isBicycle && !vehicleColor.trim()) {
      alert("Vui lòng nhập Màu xe / Đặc điểm nhận dạng cho xe đạp.");
      return;
    }

    if (!isVerifiedStudent && !editingTicket) {
      alert("Bạn phải chọn đúng họ tên và mã học sinh từ danh sách gợi ý của hệ thống để đăng ký.");
      return;
    }

    if (!studentCode || !studentCode.trim()) {
      alert("LỖI: Tài khoản của bạn chưa được nhà trường cấp Mã Học Sinh (Mã HS). Vui lòng liên hệ nhà trường để bổ sung mã trước khi đăng ký!");
      return;
    }

    setLoading(true);
    try {
      if (!editingTicket) {
        // Kiểm tra xem học sinh đã đăng ký vé gửi xe chưa
        const { data: existing, error: checkErr } = await supabase
          .from('cbq_parking_registrations')
          .select('ticket_code')
          .eq('student_code', studentCode.trim());
        
        if (!checkErr && existing && existing.length > 0) {
          alert(`LỖI: Học sinh này đã đăng ký vé gửi xe (Mã vé: ${existing[0].ticket_code}).\nMỗi học sinh chỉ được đăng ký 1 vé. Nếu muốn thay đổi thông tin, vui lòng qua tab "Tra cứu / Sửa".`);
          setLoading(false);
          return;
        }
      }

      const selectedPkg = packages.find(p => p.key === packageType) || packages[0];
      const today = new Date().toISOString().split('T')[0];
      const endDate = calculateEndDate(today, selectedPkg.months);
      
      const cleanClass = studentClass.trim().toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const ticketCode = `PARK-${cleanClass}-${randomNum}`;
      const gradeLevel = getGradeLevel(cleanClass);

      const finalTicketCode = editingTicket ? editingTicket.ticket_code : ticketCode;
      let finalLicensePlate = licensePlate.trim().toUpperCase();
      if (isBicycle || noLicensePlate) {
        finalLicensePlate = `TEM-${finalTicketCode}`;
      }

      const payload = {
        ticket_code: finalTicketCode,
        student_name: studentName.trim(),
        student_code: studentCode.trim(),
        student_class: cleanClass,
        grade_level: gradeLevel,
        license_plate: finalLicensePlate,
        vehicle_type: vehicleType,
        vehicle_color: vehicleColor.trim(),
        package_type: packageType,
        start_date: editingTicket ? editingTicket.start_date : today,
        end_date: editingTicket ? editingTicket.end_date : endDate,
        fee_amount: selectedPkg.fee,
        status: 'active'
      };

      let dbQuery;
      if (editingTicket && editingTicket.id) {
        dbQuery = supabase.from('cbq_parking_registrations').update(payload).eq('id', editingTicket.id);
      } else {
        dbQuery = supabase.from('cbq_parking_registrations').insert([payload]);
      }

      const { data, error } = await dbQuery.select().single();

      if (error) {
        setSuccessTicket(payload);
      } else {
        setSuccessTicket(data);
        if (editingTicket) {
          const changes = `Học sinh tự cập nhật: Tên(${data.student_name}), Lớp(${data.student_class}), Biển số(${data.license_plate}), Loại(${data.vehicle_type}), Gói(${data.package_type})`;
          await logActivity('parking', data.id, data.ticket_code, 'UPDATE', 'student', changes);
        }
      }
      setEditingTicket(null);
    } catch (err) {
      alert("Lỗi đăng ký/cập nhật: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBus = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentClass.trim() || !busDistance || !busAddress.trim() || !busPickupPoint.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    if (!isVerifiedStudent && !editingTicket) {
      alert("Bạn phải chọn đúng họ tên và mã học sinh từ danh sách gợi ý của hệ thống để đăng ký.");
      return;
    }

    if (!studentCode || !studentCode.trim()) {
      alert("LỖI: Tài khoản của bạn chưa được nhà trường cấp Mã Học Sinh (Mã HS). Vui lòng liên hệ nhà trường để bổ sung mã trước khi đăng ký!");
      return;
    }

    setLoading(true);
    try {
      if (!editingTicket) {
        // Kiểm tra xem học sinh đã đăng ký xe đưa đón chưa
        const { data: existing, error: checkErr } = await supabase
          .from('cbq_bus_registrations')
          .select('ticket_code')
          .eq('student_code', studentCode.trim());
        
        if (!checkErr && existing && existing.length > 0) {
          alert(`LỖI: Học sinh này đã đăng ký xe đưa đón (Mã vé: ${existing[0].ticket_code}).\nMỗi học sinh chỉ được đăng ký 1 tuyến. Nếu muốn thay đổi, vui lòng qua tab "Tra cứu / Sửa".`);
          setLoading(false);
          return;
        }
      }

      const cleanClass = studentClass.trim().toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const ticketCode = `BUS-${cleanClass}-${randomNum}`;
      
      const selectedPkg = busPackages.find(p => p.key === busPackageType) || busPackages[0];
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (selectedPkg?.months || 1));

      const payload = {
        student_name: studentName.trim(),
        student_code: studentCode.trim(),
        student_class: cleanClass,
        distance_km: Number(busDistance),
        address: busAddress.trim(),
        pickup_point: busPickupPoint.trim(),
        route_type: busRouteType,
        ticket_code: editingTicket ? editingTicket.ticket_code : ticketCode,
        package_type: busPackageType,
        start_date: editingTicket && editingTicket.start_date ? editingTicket.start_date : today.toISOString().split('T')[0],
        end_date: editingTicket && editingTicket.end_date ? editingTicket.end_date : endDate.toISOString().split('T')[0],
        fee_amount: selectedPkg ? selectedPkg.fee : 0,
        status: 'active'
      };

      let dbQuery;
      if (editingTicket && editingTicket.id) {
        dbQuery = supabase.from('cbq_bus_registrations').update(payload).eq('id', editingTicket.id);
      } else {
        dbQuery = supabase.from('cbq_bus_registrations').insert([payload]);
      }

      const { data, error } = await dbQuery.select().single();

      if (error) {
        setSuccessBusTicket(payload);
      } else {
        setSuccessBusTicket(data);
        if (editingTicket) {
          const changes = `Học sinh tự cập nhật: Tên(${data.student_name}), Lớp(${data.student_class}), Điểm đón(${data.pickup_point}), Tuyến(${data.route_type}), Gói(${data.package_type})`;
          await logActivity('bus', data.id, data.ticket_code, 'UPDATE', 'student', changes);
        }
      }
      setEditingTicket(null);
    } catch (err) {
      alert("Lỗi đăng ký/cập nhật: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* BANNER HEADER */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ ...styles.iconCircle, background: activeTab === 'bus' ? '#f59e0b' : '#be123c' }}>
            {activeTab === 'bus' ? <Bus size={32} color="#ffffff" /> : <Bike size={32} color="#ffffff" />}
          </div>
          <div>
            <h2 style={styles.pageTitle}>CỔNG ĐĂNG KÝ DỊCH VỤ DI CHUYỂN</h2>
            <p style={styles.pageSubtitle}>Trường THPT Cao Bá Quát • Đăng ký vé gửi xe hoặc xe đưa đón học sinh</p>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      {(!successTicket && !successBusTicket) && (
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '25px' }}>
          <button
            onClick={() => { setActiveTab('parking'); setEditingTicket(null); }}
            style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', fontSize: '15px', color: activeTab === 'parking' ? '#be123c' : '#64748b', borderBottom: activeTab === 'parking' ? '3px solid #be123c' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Bike size={18} /> GỬI XE MÁY / ĐẠP
          </button>
          <button
            onClick={() => { setActiveTab('bus'); setEditingTicket(null); }}
            style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', fontSize: '15px', color: activeTab === 'bus' ? '#f59e0b' : '#64748b', borderBottom: activeTab === 'bus' ? '3px solid #f59e0b' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Bus size={18} /> XE ĐƯA ĐÓN
          </button>
          <button
            onClick={() => { setActiveTab('lookup'); setEditingTicket(null); }}
            style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', fontSize: '15px', color: activeTab === 'lookup' ? '#16a34a' : '#64748b', borderBottom: activeTab === 'lookup' ? '3px solid #16a34a' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Search size={18} /> TRA CỨU / SỬA
          </button>
        </div>
      )}

      {/* SUCCESS BUS TICKET CARD */}
      {successBusTicket && (
        <div style={styles.successWrapper}>
          <div style={styles.ticketCard} id="printable-bus-ticket">
            <div style={styles.ticketHeader}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '900', color: '#be123c' }}>PHIẾU ĐĂNG KÝ XE ĐƯA ĐÓN</h3>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', marginTop: '2px' }}>MÃ VÉ: {successBusTicket.ticket_code}</div>
            </div>

            <div style={styles.ticketBody}>
              <div style={styles.ticketRow}>
                <span>Họ và tên học sinh:</span>
                <strong>{successBusTicket.student_name}</strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Lớp:</span>
                <strong style={{ color: '#be123c' }}>{successBusTicket.student_class}</strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Địa chỉ nhà:</span>
                <strong>{successBusTicket.address}</strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Khoảng cách:</span>
                <strong>{successBusTicket.distance_km} km</strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Điểm đón mong muốn:</span>
                <strong style={{ color: '#166534' }}>{successBusTicket.pickup_point}</strong>
              </div>
              <div style={styles.ticketRow}>
                <span>Loại tuyến:</span>
                <strong style={{ color: '#b45309' }}>
                  {successBusTicket.route_type === '2-way' ? '2 chiều (Đi & Về)' : '1 chiều'}
                </strong>
              </div>
            </div>

            <div style={styles.ticketFooter}>
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG value={successBusTicket.ticket_code} size={64} level="M" />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Quét mã QR Check-in xe tuyến</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                <div>Trạng thái đăng ký</div>
                <div style={{ fontWeight: 'bold', color: '#166534', marginTop: '4px' }}>✓ Chờ nhà trường xếp xe</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={() => setSuccessBusTicket(null)} style={styles.newRegBtn}>
              Đăng ký xe mới
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS PARKING TICKET CARD */}
      {successTicket && !successBusTicket && (
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
                <QRCodeSVG value={successTicket.ticket_code} size={64} level="M" />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Quét mã QR check-in tại cổng xe</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                <div>Xác thực bởi Ban Bảo Vệ</div>
                <div style={{ fontWeight: 'bold', color: '#166534', marginTop: '4px' }}>✓ Đã thanh toán & Đủ điều kiện</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={() => setSuccessTicket(null)} style={styles.newRegBtn}>
              Đăng ký xe mới
            </button>
          </div>
        </div>
      )}

      {/* REGISTRATION FORMS */}
      {(!successTicket && !successBusTicket) && (
        <>
          {/* LOOKUP FORM */}
          {activeTab === 'lookup' && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>🔍 Tra Cứu & Điều Chỉnh Đăng Ký</h3>
              <form onSubmit={handleLookup} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  required 
                  placeholder="Nhập Mã Học Sinh hoặc Mã Vé..."
                  value={lookupQuery}
                  onChange={e => setLookupQuery(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                />
                <button type="submit" disabled={isSearching} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isSearching ? 'ĐANG TÌM...' : 'TÌM KIẾM'}
                </button>
              </form>

              {lookupResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {lookupResults.map((res, idx) => (
                    <div key={idx} style={{ padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                          {res.recordType === 'parking' ? '🏍️ Vé Gửi Xe Máy' : '🚌 Vé Xe Đưa Đón'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Họ tên: <strong style={{ color: '#0f172a' }}>{res.student_name}</strong> • Lớp: {res.student_class}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Mã vé: {res.ticket_code} • Mã HS: {res.student_code}</div>
                      </div>
                      <button 
                        onClick={() => startEdit(res)}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✏️ CHỈNH SỬA
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REGISTRATION CLOSED MESSAGE */}
          {(activeTab === 'parking' || activeTab === 'bus') && !isRegistrationOpen() && !editingTicket && (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', marginTop: '20px' }}>
              <h3 style={{ color: '#dc2626', marginBottom: '15px', fontSize: '20px' }}>⚠️ Cổng Đăng Ký Đã Đóng</h3>
              <p style={{ color: '#991b1b', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                {(activeTab === 'bus' ? busConfig.message : parkingConfig.message) || 'Hiện tại hệ thống đăng ký đã đóng hoặc đã hết hạn. Vui lòng quay lại sau!'}
              </p>
              <button 
                onClick={() => setActiveTab('lookup')}
                style={{ marginTop: '25px', padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Tra Cứu Vé Đã Đăng Ký
              </button>
            </div>
          )}

          {/* PARKING FORM */}
          {activeTab === 'parking' && (isRegistrationOpen() || !!editingTicket) && (
            <form onSubmit={handleSubmit} style={styles.formCard}>
              <h3 style={styles.formTitle}>
                {editingTicket ? '✏️ ĐIỀU CHỈNH THÔNG TIN VÉ GỬI XE' : '📝 Thông tin Đăng ký Vé Gửi Xe Học Sinh'}
              </h3>

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
                    readOnly={!!editingTicket}
                    placeholder="Gõ tên hoặc Mã HS để tự động gợi ý..."
                    value={studentName}
                    onChange={e => handleNameChange(e.target.value)}
                    onFocus={handleNameFocus}
                    style={{
                      ...styles.input,
                      borderColor: (isVerifiedStudent || !!editingTicket) ? '#166534' : '#cbd5e1',
                      backgroundColor: (isVerifiedStudent || !!editingTicket) ? '#f0fdf4' : '#ffffff'
                    }}
                  />

              {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    💡 GỢI Ý HỌC SINH TỪ CSDL NHÀ TRƯỜNG ({suggestions.length} học sinh):
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
                readOnly={isVerifiedStudent || !!editingTicket}
                placeholder="Bấm hoặc gõ Lớp (VD: 10A1, 11A2, 12A3)..."
                value={studentClass}
                onChange={e => handleClassChange(e.target.value)}
                onFocus={handleClassFocus}
                style={{ 
                  ...styles.input, 
                  backgroundColor: (isVerifiedStudent || !!editingTicket) ? '#f1f5f9' : '#ffffff',
                  color: (isVerifiedStudent || !!editingTicket) ? '#64748b' : '#0f172a'
                }}
              />

              {/* CLASS AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
              {showClassSuggestions && classSuggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#be123c', backgroundColor: '#fff1f2', borderBottom: '1px solid #fca5a5' }}>
                    🏫 DANH SÁCH LỚP HỌC (3 KHỐI 10, 11, 12):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '6px' }}>
                    {classSuggestions.map((clsItem, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectClassSuggestion(clsItem)}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: studentClass.toUpperCase() === clsItem.toUpperCase() ? '#be123c' : '#f8fafc',
                          color: studentClass.toUpperCase() === clsItem.toUpperCase() ? '#ffffff' : '#1e293b',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Lớp {clsItem}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!isBicycle && (
              <div>
                <label style={styles.label}>Biển số xe (*)</label>
                <input 
                  type="text" 
                  required={!noLicensePlate}
                  disabled={noLicensePlate}
                  placeholder="VD: 29B1-567.89 hoặc 29-AA 1234"
                  value={licensePlate}
                  onChange={e => setLicensePlate(e.target.value)}
                  style={{ ...styles.input, fontWeight: 'bold', letterSpacing: '1px', backgroundColor: noLicensePlate ? '#f1f5f9' : '#ffffff' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}>
                  <input type="checkbox" checked={noLicensePlate} onChange={e => { setNoLicensePlate(e.target.checked); if(e.target.checked) setLicensePlate(''); }} style={{ width: '16px', height: '16px', accentColor: '#be123c' }} />
                  Xe chưa có biển số (Hệ thống sẽ cấp tem dán)
                </label>
              </div>
            )}

            <div>
              <label style={styles.label}>Loại phương tiện (*)</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={styles.input}>
                <option value="Xe máy điện">⚡ Xe máy điện (Yadea, VinFast, Pega...)</option>
                <option value="Xe máy 50cc">🛵 Xe máy 50cc (Wave, Cub, Giorno...)</option>
                <option value="Xe máy >50cc">🏍️ Xe máy trên 50cc (Có GPLX)</option>
                <option value="Xe đạp">🚲 Xe đạp</option>
                <option value="Xe đạp điện">🚲 Xe đạp điện</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Màu xe {isBicycle ? '(*)' : '(không bắt buộc)'}</label>
              <input 
                type="text" 
                required={isBicycle}
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
                readOnly={isVerifiedStudent || !!editingTicket}
                placeholder="VD: HS11A1-025"
                value={studentCode}
                onChange={e => setStudentCode(e.target.value)}
                style={{ 
                  ...styles.input, 
                  backgroundColor: (isVerifiedStudent || !!editingTicket) ? '#f1f5f9' : '#ffffff',
                  color: (isVerifiedStudent || !!editingTicket) ? '#64748b' : '#0f172a'
                }}
              />
            </div>
          </div>

          {/* DYNAMIC PACKAGE SELECTION */}
          <div style={{ marginTop: '25px' }}>
            <label style={{ ...styles.label, fontSize: '14px', color: '#be123c' }}>
              👉 Chọn Gói Đăng Ký Gửi Xe (*):
            </label>
            <div style={styles.packageGrid}>
              {filteredPackages.map(pkg => (
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
                    {pkg.hide_fee ? '' : pkg.fee === 0 ? '🟢 Miễn phí (0 VNĐ)' : `${pkg.fee.toLocaleString()} VNĐ`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isBicycle && (
            <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '13.5px' }}>
              <strong>💡 Lưu ý:</strong> Vì xe đạp không có biển số, sau khi đăng ký thành công, học sinh vui lòng chụp màn hình vé và báo lại với phòng bảo vệ để được cấp tem dán số xe nhé.
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} style={{ ...styles.submitBtn, flex: 1 }}>
              {loading ? 'Đang xử lý...' : editingTicket ? '💾 LƯU ĐIỀU CHỈNH VÉ GỬI XE' : '🚀 XÁC NHẬN ĐĂNG KÝ VÉ GỬI XE'}
            </button>
            {editingTicket && (
              <button type="button" onClick={cancelEdit} disabled={loading} style={{ ...styles.submitBtn, flex: 0.4, backgroundColor: '#64748b' }}>
                ✖ HỦY
              </button>
            )}
          </div>
        </form>
      )}

      {/* BUS FORM */}
      {activeTab === 'bus' && (isRegistrationOpen() || !!editingTicket) && (
        <form onSubmit={handleSubmitBus} style={styles.formCard}>
          <h3 style={{ ...styles.formTitle, color: '#b45309' }}>
            {editingTicket ? '✏️ ĐIỀU CHỈNH THÔNG TIN XE ĐƯA ĐÓN' : '🚌 Thông tin Đăng ký Xe Đưa Đón Học Sinh'}
          </h3>

          <div style={styles.formGrid}>
            {/* AUTOCOMPLETE STUDENT NAME FIELD */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <label style={styles.label}>
                Họ và Tên học sinh (*)
                {isVerifiedStudent && (
                  <span style={{ fontSize: '11.5px', color: '#166534', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '12px', marginLeft: '6px', border: '1px solid #bbf7d0' }}>
                    ✓ Đã xác thực
                  </span>
                )}
              </label>
              <input 
                type="text" 
                required 
                readOnly={!!editingTicket}
                placeholder="Gõ tên hoặc Mã HS..."
                value={studentName}
                onChange={e => handleNameChange(e.target.value)}
                onFocus={handleNameFocus}
                style={{
                  ...styles.input,
                  borderColor: (isVerifiedStudent || !!editingTicket) ? '#166534' : '#cbd5e1',
                  borderWidth: (isVerifiedStudent || !!editingTicket) ? '2px' : '1px',
                  backgroundColor: (isVerifiedStudent || !!editingTicket) ? '#f0fdf4' : '#ffffff'
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  {suggestions.map(s => (
                    <div 
                      key={s.id} 
                      style={styles.suggestionItem}
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{s.student_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Lớp: {s.student_class} | Mã HS: {s.student_code}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} ref={classDropdownRef}>
              <label style={styles.label}>Lớp học (*)</label>
              <input 
                type="text" 
                required 
                readOnly={isVerifiedStudent || !!editingTicket}
                placeholder="VD: 10A1, 11A2..."
                value={studentClass}
                onChange={e => handleClassChange(e.target.value)}
                onFocus={handleClassFocus}
                style={{ 
                  ...styles.input, 
                  backgroundColor: (isVerifiedStudent || !!editingTicket) ? '#f1f5f9' : '#ffffff',
                  color: (isVerifiedStudent || !!editingTicket) ? '#64748b' : '#0f172a'
                }}
              />
              {showClassSuggestions && classSuggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#be123c', backgroundColor: '#fff1f2', borderBottom: '1px solid #fca5a5' }}>
                    🏫 DANH SÁCH LỚP HỌC:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '6px' }}>
                    {classSuggestions.map((clsItem, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectClassSuggestion(clsItem)}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: studentClass.toUpperCase() === clsItem.toUpperCase() ? '#be123c' : '#f8fafc',
                          color: studentClass.toUpperCase() === clsItem.toUpperCase() ? '#ffffff' : '#1e293b',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Lớp {clsItem}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={styles.label}>Khoảng cách ước tính từ nhà đến trường (km) (*)</label>
              <input 
                type="number" 
                required 
                min="1"
                placeholder="VD: 5"
                value={busDistance}
                onChange={e => setBusDistance(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Địa chỉ nhà (*)</label>
              <input 
                type="text" 
                required 
                placeholder="VD: Số 123, đường X, phường Y"
                value={busAddress}
                onChange={e => setBusAddress(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Điểm đón mong muốn (*)</label>
              <input 
                type="text" 
                required 
                placeholder="VD: Cổng làng Z / Ngã tư W"
                value={busPickupPoint}
                onChange={e => setBusPickupPoint(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Loại tuyến đưa đón (*)</label>
              <select value={busRouteType} onChange={e => setBusRouteType(e.target.value)} style={styles.input}>
                <option value="2-way">🔄 Đưa đón 2 chiều (Đi & Về)</option>
                <option value="1-way">➡️ Đưa đón 1 chiều</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Gói Thời Hạn & Lệ Phí (*)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '6px' }}>
                {busPackages.map(pkg => (
                  <label key={pkg.key} style={{
                    display: 'flex', flexDirection: 'column', padding: '12px', borderRadius: '10px', border: busPackageType === pkg.key ? '2px solid #be123c' : '1px solid #cbd5e1', backgroundColor: busPackageType === pkg.key ? '#fff1f2' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <input 
                        type="radio" 
                        name="busPackageType" 
                        value={pkg.key} 
                        checked={busPackageType === pkg.key}
                        onChange={() => setBusPackageType(pkg.key)}
                        style={{ accentColor: '#be123c', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: busPackageType === pkg.key ? '#be123c' : '#1e293b' }}>{pkg.label}</span>
                    </div>
                    <div style={{ paddingLeft: '24px', fontSize: '12px', color: '#64748b' }}>
                      {pkg.desc}
                    </div>
                    {!pkg.hide_fee && (
                      <div style={{ paddingLeft: '24px', fontSize: '14px', fontWeight: '900', color: '#be123c', marginTop: '6px' }}>
                        {pkg.fee === 0 ? '🟢 Miễn phí' : `${pkg.fee.toLocaleString()} VNĐ`}
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} style={{ ...styles.submitBtn, backgroundColor: '#f59e0b', flex: 1 }}>
              {loading ? 'Đang xử lý...' : editingTicket ? '💾 LƯU ĐIỀU CHỈNH XE ĐƯA ĐÓN' : '🚀 XÁC NHẬN ĐĂNG KÝ XE ĐƯA ĐÓN'}
            </button>
            {editingTicket && (
              <button type="button" onClick={cancelEdit} disabled={loading} style={{ ...styles.submitBtn, flex: 0.4, backgroundColor: '#64748b' }}>
                ✖ HỦY
              </button>
            )}
          </div>
        </form>
      )}
      </>
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
