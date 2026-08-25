import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Bus, Search, Printer, Download, Plus, CheckCircle2, AlertCircle, Clock, Trash2, Edit3, Eye, QrCode, Settings, ShieldCheck, Lock, Unlock, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateBusWordReport } from '../lib/wordExportBus';

const DEFAULT_BUS_LIST = [
  { id: '1', ticket_code: 'BUS-11A1-001', student_name: 'Nguyễn Văn An', student_code: 'HS11A1-01', student_class: '11A1', grade_level: 'Khối 11', pickup_point: 'Ngã tư Trần Phú', route_type: '2-way', distance_km: 15, package_type: 'term_2way', start_date: '2026-09-01', end_date: '2027-01-15', fee_amount: 1400000, status: 'active' },
  { id: '2', ticket_code: 'BUS-12A3-002', student_name: 'Trần Thị Bích', student_code: 'HS12A3-05', student_class: '12A3', grade_level: 'Khối 12', pickup_point: 'Cổng làng B', route_type: '1-way', distance_km: 10, package_type: 'year_1way', start_date: '2026-09-01', end_date: '2027-05-31', fee_amount: 1500000, status: 'active' },
  { id: '3', ticket_code: 'BUS-10A2-003', student_name: 'Phạm Minh Cường', student_code: 'HS10A2-12', student_class: '10A2', grade_level: 'Khối 10', pickup_point: 'UBND Phường Y', route_type: '2-way', distance_km: 5, package_type: 'month_2way', start_date: '2026-09-01', end_date: '2026-09-30', fee_amount: 300000, status: 'active' }
];

const DEFAULT_PACKAGES = [
  { id: 'p1', package_key: 'month_2way', title: '2 Chiều - Đăng ký Theo Tháng', months_count: 1, fee_amount: 300000, description: 'Đưa đón 2 chiều (300.000 VNĐ)', sort_order: 1, is_active: true },
  { id: 'p2', package_key: 'month_1way', title: '1 Chiều - Đăng ký Theo Tháng', months_count: 1, fee_amount: 180000, description: 'Đưa đón 1 chiều (180.000 VNĐ)', sort_order: 2, is_active: true },
  { id: 'p3', package_key: 'term_2way', title: '2 Chiều - Theo Học Kỳ (5 tháng)', months_count: 5, fee_amount: 1400000, description: 'Đưa đón 2 chiều (Tiết kiệm 100k)', sort_order: 3, is_active: true },
  { id: 'p4', package_key: 'year_2way', title: '2 Chiều - Cả Năm Học (9 tháng)', months_count: 9, fee_amount: 2500000, description: 'Đưa đón 2 chiều (Tiết kiệm 200k)', sort_order: 4, is_active: true }
];

export default function AdminBus() {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'config', 'checkin', 'alerts'
  
  const [busList, setBusList] = useState(DEFAULT_BUS_LIST);
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedPackage, setSelectedPackage] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRouteType, setSelectedRouteType] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedTicketsToPrint, setSelectedTicketsToPrint] = useState([]);

  // Package Form State
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState(null);
  const [pkgKey, setPkgKey] = useState('');
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgMonths, setPkgMonths] = useState(1);
  const [pkgFee, setPkgFee] = useState(50000);
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgHideFee, setPkgHideFee] = useState(false);

  // Security Check-in Terminal Query
  const [checkinQuery, setCheckinQuery] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);

  // Registration Time Config
  const [regConfig, setRegConfig] = useState({
    isOpen: true,
    startDate: '',
    endDate: '',
    message: 'Hệ thống đăng ký hiện đang mở.'
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [parkingRes, pkgRes] = await Promise.all([
        supabase.from('cbq_bus_registrations').select('*').order('created_at', { ascending: false }),
        supabase.from('cbq_bus_packages').select('*').order('sort_order', { ascending: true })
      ]);

      if (!parkingRes.error && parkingRes.data && parkingRes.data.length > 0) {
        setBusList(parkingRes.data);
      }

      if (!pkgRes.error && pkgRes.data && pkgRes.data.length > 0) {
        const local = localStorage.getItem('cbq_bus_packages');
        if (local) {
          try {
            const parsedLocal = JSON.parse(local);
            const mergedMap = new Map();
            pkgRes.data.forEach(p => mergedMap.set(p.package_key || String(p.id), p));
            parsedLocal.forEach(p => mergedMap.set(p.package_key || String(p.id), { ...mergedMap.get(p.package_key || String(p.id)), ...p }));
            const mergedList = Array.from(mergedMap.values());
            setPackages(mergedList);
          } catch {
            setPackages(pkgRes.data);
          }
        } else {
          setPackages(pkgRes.data);
        }
      } else {
        const local = localStorage.getItem('cbq_bus_packages');
        if (local) {
          setPackages(JSON.parse(local));
        } else {
          setPackages(DEFAULT_PACKAGES);
          localStorage.setItem('cbq_bus_packages', JSON.stringify(DEFAULT_PACKAGES));
        }
      }

      // Fetch Registration Config
      try {
        const { data: configData, error: configError } = await supabase.from('cbq_bus_settings').select('*').maybeSingle();
        if (!configError && configData) {
          setRegConfig({
            isOpen: configData.is_open,
            startDate: configData.start_time ? new Date(configData.start_time).toISOString().slice(0, 16) : '',
            endDate: configData.end_time ? new Date(configData.end_time).toISOString().slice(0, 16) : '',
            message: configData.notice_message || ''
          });
          localStorage.setItem('cbq_bus_settings', JSON.stringify(configData));
        } else {
          loadLocalConfig();
        }
      } catch (err) {
        loadLocalConfig();
      }

    } catch (err) {
      console.warn("Dùng dữ liệu xe mẫu:", err);
      const local = localStorage.getItem('cbq_bus_packages');
      if (local) setPackages(JSON.parse(local));
      loadLocalConfig();
    } finally {
      setLoading(false);
    }
  }

  function loadLocalConfig() {
    const local = localStorage.getItem('cbq_bus_settings');
    if (local) {
      const parsed = JSON.parse(local);
      setRegConfig({
        isOpen: parsed.is_open !== undefined ? parsed.is_open : true,
        startDate: parsed.start_time ? new Date(parsed.start_time).toISOString().slice(0, 16) : '',
        endDate: parsed.end_time ? new Date(parsed.end_time).toISOString().slice(0, 16) : '',
        message: parsed.notice_message || ''
      });
    }
  }

  const handleSaveRegConfig = async () => {
    const payload = {
      id: 1,
      is_open: regConfig.isOpen,
      start_time: regConfig.startDate ? new Date(regConfig.startDate).toISOString() : null,
      end_time: regConfig.endDate ? new Date(regConfig.endDate).toISOString() : null,
      notice_message: regConfig.message
    };
    try {
      await supabase.from('cbq_bus_settings').upsert([payload]);
    } catch (err) {
      console.warn('Lỗi lưu cấu hình DB:', err);
    }
    localStorage.setItem('cbq_bus_settings', JSON.stringify(payload));
    alert('Đã lưu Cấu hình Thời gian đăng ký!');
  };

  // Filter Data
  const uniqueClasses = Array.from(new Set(busList.map(i => i.student_class).filter(Boolean))).sort();
  const uniqueVehicleTypes = Array.from(new Set(busList.map(i => i.route_type).filter(Boolean))).sort();

  const filteredList = busList.filter(item => {
    const matchSearch = !searchTerm || 
      item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pickup_point?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ticket_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchGrade = selectedGrade === 'ALL' || item.grade_level === selectedGrade;
    const matchPkg = selectedPackage === 'ALL' || item.package_type === selectedPackage;
    const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const matchVehicle = selectedRouteType === 'ALL' || item.route_type === selectedRouteType;
    const matchClass = selectedClassFilter === 'ALL' || item.student_class === selectedClassFilter;

    return matchSearch && matchGrade && matchPkg && matchStatus && matchVehicle && matchClass;
  });

  // Calculate Statistics
  const stats = {
    total: busList.length,
    grade10: busList.filter(i => i.grade_level === 'Khối 10').length,
    grade11: busList.filter(i => i.grade_level === 'Khối 11').length,
    grade12: busList.filter(i => i.grade_level === 'Khối 12').length,
    pkgMonth: busList.filter(i => String(i.package_type || '').includes('month')).length,
    pkgTerm: busList.filter(i => String(i.package_type || '').includes('term')).length,
    pkgYear: busList.filter(i => String(i.package_type || '').includes('year')).length,
    totalFees: busList.reduce((acc, curr) => acc + (Number(curr.fee_amount) || 0), 0)
  };

  // Check-in terminal search function
  const handleCheckinSearch = (q) => {
    setCheckinQuery(q);
    if (!q.trim()) {
      setCheckinResult(null);
      return;
    }
    const cleanQ = q.trim().toLowerCase();
    const found = busList.find(i => 
      i.pickup_point?.toLowerCase().includes(cleanQ) ||
      i.ticket_code?.toLowerCase().includes(cleanQ) ||
      i.student_code?.toLowerCase().includes(cleanQ)
    );

    if (found) {
      const today = new Date();
      const endDate = new Date(found.end_date);
      const isExpired = endDate < today;
      const isBlocked = found.status === 'blocked';

      setCheckinResult({
        ...found,
        checkinStatus: isBlocked ? 'BLOCKED' : isExpired ? 'EXPIRED' : 'VALID'
      });
    } else {
      setCheckinResult({ checkinStatus: 'UNREGISTERED', searchKey: q });
    }
  };

  // Save Configured Package
  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!pkgTitle || !pkgTitle.trim()) {
      alert("Vui lòng điền Tên Gói Vé!");
      return;
    }

    try {
      const targetId = editingPkgId;
      const payload = {
        package_key: pkgKey.trim() || `pkg_${Date.now()}`,
        title: pkgTitle.trim(),
        months_count: Number(pkgMonths) || 1,
        fee_amount: Number(pkgFee) || 0,
        description: pkgDesc.trim(),
        hide_fee: pkgHideFee,
        is_active: true
      };

      // 1. Guaranteed Functional State & LocalStorage Update
      setPackages(prev => {
        let matched = false;
        const nextList = prev.map(p => {
          if ((targetId && String(p.id) === String(targetId)) || (p.package_key && p.package_key === payload.package_key)) {
            matched = true;
            return { ...p, ...payload, id: p.id || targetId };
          }
          return p;
        });

        if (!matched) {
          nextList.push({ ...payload, id: targetId || `pkg_${Date.now()}` });
        }

        localStorage.setItem('cbq_bus_packages', JSON.stringify(nextList));
        return nextList;
      });

      // 2. Async Supabase DB Upsert
      try {
        const dbPayload = (targetId && !String(targetId).startsWith('p') && !String(targetId).startsWith('pkg_')) 
          ? { id: targetId, ...payload } 
          : payload;

        await supabase
          .from('cbq_bus_packages')
          .upsert([dbPayload], { onConflict: 'package_key' });
      } catch (dbErr) {
        console.error("Lỗi lưu DB gói vé:", dbErr);
        alert("CẢNH BÁO: Không thể lưu vào CSDL Supabase. Gói vé chỉ được lưu tạm trên trình duyệt.\nVui lòng kiểm tra lại cấu hình DB hoặc chạy file SQL để tạo bảng.\nChi tiết lỗi: " + dbErr.message);
      }

      alert(`🎉 ĐÃ LƯU THÀNH CÔNG GÓI VÉ: "${pkgTitle.trim()}"!`);
      setShowPkgForm(false);
      setEditingPkgId(null);
    } catch (err) {
      alert("Lỗi khi lưu gói vé: " + err.message);
    }
  };

  const handleEditPackage = (pkg) => {
    if (!pkg) return;
    setActiveTab('config');
    setEditingPkgId(pkg.id || pkg.package_key || `pkg_${Date.now()}`);
    setPkgKey(pkg.package_key || pkg.key || '');
    setPkgTitle(pkg.title || pkg.label || '');
    setPkgMonths(Number(pkg.months_count || pkg.months) || 1);
    setPkgFee(Number(pkg.fee_amount || pkg.fee) || 0);
    setPkgDesc(pkg.description || pkg.desc || '');
    setPkgHideFee(!!pkg.hide_fee);
    setShowPkgForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói vé này?")) return;
    const updated = packages.filter(p => String(p.id) !== String(id));
    setPackages(updated);
    localStorage.setItem('cbq_bus_packages', JSON.stringify(updated));

    try {
      await supabase.from('cbq_bus_packages').delete().eq('id', id);
    } catch (err) {
      console.warn("Lỗi khi xóa:", err);
    }
  };

  // Toggle Package Active Status
  const handleTogglePkgActive = async (pkg) => {
    const updated = packages.map(p => String(p.id) === String(pkg.id) ? { ...p, is_active: !p.is_active } : p);
    setPackages(updated);
    localStorage.setItem('cbq_bus_packages', JSON.stringify(updated));

    try {
      await supabase.from('cbq_bus_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
    } catch (err) {
      console.warn("Lỗi:", err);
    }
  };

  // Toggle Suspend / Block Ticket Status
  const handleToggleBlock = async (item) => {
    const newStatus = item.status === 'blocked' ? 'active' : 'blocked';
    const msg = newStatus === 'blocked' ? `Bạn có chắc muốn KHÓA vé xe của học sinh ${item.student_name}?` : `Kích hoạt lại vé xe cho ${item.student_name}?`;
    if (!window.confirm(msg)) return;

    try {
      await supabase.from('cbq_bus_registrations').update({ status: newStatus }).eq('id', item.id);
      setBusList(busList.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredList.map(item => ({
      "Mã Thẻ Xe": item.ticket_code,
      "Họ và Tên": item.student_name,
      "Lớp": item.student_class,
      "Khối": item.grade_level,
      "Điểm đón": item.pickup_point,
      "Loại Xe": item.route_type,
      "Khoảng cách (km)": item.distance_km || "",
      "Gói Đăng Ký": item.package_type === 'month' ? 'Tháng' : item.package_type === 'term' ? 'Học kỳ' : 'Cả năm',
      "Ngày Bắt Đầu": item.start_date,
      "Ngày Kết Thúc": item.end_date,
      "Lệ Phí (VNĐ)": item.fee_amount,
      "Trạng Thái": item.status === 'blocked' ? 'Bị khóa' : item.status === 'active' ? 'Đang hoạt động' : 'Hết hạn'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachXeMáy");
    XLSX.writeFile(workbook, `Danh_Sach_Xe_May_Hoc_Sinh_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportWord = async () => {
    try {
      // 1. Fetch all students (Paginated)
      let allStudents = [];
      let fromStudents = 0;
      let hasMoreStudents = true;
      while (hasMoreStudents) {
        const { data, error } = await supabase.from('cbq_students').select('student_class, student_code, student_name').range(fromStudents, fromStudents + 999);
        if (error) throw error;
        if (data && data.length > 0) {
          allStudents = allStudents.concat(data);
          fromStudents += 1000;
        } else {
          hasMoreStudents = false;
        }
      }

      // 2. Fetch all parking registrations (Paginated)
      let parkingData = [];
      let fromParking = 0;
      let hasMoreParking = true;
      while (hasMoreParking) {
        const { data, error } = await supabase.from('cbq_bus_registrations').select('*').range(fromParking, fromParking + 999);
        if (error) throw error;
        if (data && data.length > 0) {
          parkingData = parkingData.concat(data);
          fromParking += 1000;
        } else {
          hasMoreParking = false;
        }
      }

      // 3. Fetch all bus registrations (Paginated)
      let busData = [];
      let fromBus = 0;
      let hasMoreBus = true;
      while (hasMoreBus) {
        const { data, error } = await supabase.from('cbq_bus_registrations').select('*').range(fromBus, fromBus + 999);
        if (error) throw error;
        if (data && data.length > 0) {
          busData = busData.concat(data);
          fromBus += 1000;
        } else {
          hasMoreBus = false;
        }
      }

      // Tạo báo cáo Word
      const buffer = await generateBusWordReport(allStudents, [], busList);
      alert("Đã xuất báo cáo Word (chuẩn Nghị định 30) thành công!");
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi tạo báo cáo Word: " + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lượt đăng ký xe này?")) return;
    try {
      await supabase.from('cbq_bus_registrations').delete().eq('id', id);
      setBusList(busList.filter(i => i.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handlePrintCard = (item) => {
    setSelectedTicketsToPrint([item]);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handlePrintBulk = () => {
    if (filteredList.length === 0) {
      alert("Không có vé nào trong danh sách hiện tại để in.");
      return;
    }
    setSelectedTicketsToPrint(filteredList);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <Layout title="Quản lý Xe đưa đón Học sinh">
      <style>{`
        @media print {
          header, nav, sidebar, .no-print, .glass { display: none !important; }
          .printable-card { display: block !important; width: 100% !important; margin: 0 auto !important; }
        }
      `}</style>

      {/* PRINT MODAL CARD (Hidden during regular display, visible on print) */}
      {selectedTicketsToPrint && selectedTicketsToPrint.length > 0 && (
        <div style={{ display: 'none' }} className="printable-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '10px' }}>
            {selectedTicketsToPrint.map((ticket, idx) => (
              <div key={idx} style={{ ...styles.printTicketCard, breakInside: 'avoid', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', color: '#be123c' }}>THẺ XE ĐƯA ĐÓN HỌC SINH</h3>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7' }}>MÃ: {ticket.ticket_code}</div>
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <div><strong>Họ tên HS:</strong> {ticket.student_name}</div>
                  <div><strong>Lớp:</strong> {ticket.student_class} ({ticket.grade_level})</div>
                  <div><strong>Điểm đón:</strong> <span style={{ fontSize: '15px', color: '#be123c', fontWeight: 'bold' }}>{ticket.pickup_point}</span></div>
                  <div><strong>Tuyến đường:</strong> {ticket.route_type}</div>
                  <div><strong>Thời hạn:</strong> Từ {ticket.start_date} Đến {ticket.end_date}</div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <QrCode size={48} color="#1e293b" />
                  <div style={{ fontSize: '10px', textAlign: 'right', color: '#64748b' }}>Xác nhận Ban Bảo Vệ<br /><b>✓ Đã duyệt vé</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER & TOP ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bus size={26} color="#be123c" /> Quản Lý Phương Tiện Xe Đưa Đón Học Sinh
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Thống kê số lượng, cấu hình mức phí và quản lý vé xe đưa đón
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/dang-ky-xe-may" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', textDecoration: 'none', padding: '10px 16px' }}
          >
            <Eye size={18} /> Cổng Đăng Ký Học Sinh
          </a>
          <button 
            onClick={handleExportWord}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#2563eb' }}
          >
            <Download size={18} /> Xuất Báo cáo Word
          </button>
          <button 
            onClick={handleExportExcel}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#166534' }}
          >
            <Download size={18} /> Xuất File Excel
          </button>
        </div>
      </div>

      {/* 4 FEATURE NAVIGATION TABS */}
      <div style={styles.tabContainer} className="no-print">
        <button onClick={() => setActiveTab('list')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'list' ? '3px solid #be123c' : 'none', color: activeTab === 'list' ? '#be123c' : '#64748b', fontWeight: activeTab === 'list' ? 'bold' : 'normal' }}>
            <Bus size={16} /> 🚌 Danh Sách & In Vé Xe ({busList.length})
          </button>
        <button 
          onClick={() => setActiveTab('config')} 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'config' ? '#be123c' : '#ffffff', color: activeTab === 'config' ? '#ffffff' : '#334155' }}
        >
          <Settings size={16} /> ⚙️ Cấu Hình Gói Vé & Mức Phí ({packages.length})
        </button>
        <button 
          onClick={() => setActiveTab('checkin')} 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'checkin' ? '#be123c' : '#ffffff', color: activeTab === 'checkin' ? '#ffffff' : '#334155' }}
        >
          <ShieldCheck size={16} /> 🔍 Kiểm tra Mã Vé Xe đưa đón
        </button>
      </div>

      {/* ==================== TAB 1: LIST & PRINT ==================== */}
      {activeTab === 'list' && (
        <>
          {/* STATISTICS CARDS PANEL */}
          <div style={styles.statsGrid} className="no-print">
            <div style={styles.statCard}>
              <div style={styles.statLabel}>TỔNG SỐ HỌC SINH ĐĂNG KÝ</div>
              <div style={styles.statNumber}>{stats.total} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>học sinh</span></div>
              <div style={styles.statSub}>Tất cả khối lớp</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>THỐNG KÊ THEO KHỐI LỚP</div>
              <div style={{ fontSize: '13.5px', marginTop: '6px', lineHeight: '1.6' }}>
                <div>Khối 10: <strong>{stats.grade10}</strong> học sinh</div>
                <div>Khối 11: <strong>{stats.grade11}</strong> học sinh</div>
                <div>Khối 12: <strong>{stats.grade12}</strong> học sinh</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>THỐNG KÊ GÓI ĐĂNG KÝ</div>
              <div style={{ fontSize: '13.5px', marginTop: '6px', lineHeight: '1.6' }}>
                <div>Theo Học Kỳ: <strong>{stats.pkgTerm}</strong> học sinh</div>
                <div>Theo Tháng: <strong>{stats.pkgMonth}</strong> học sinh</div>
                <div>Cả Năm Học: <strong>{stats.pkgYear}</strong> học sinh</div>
              </div>
            </div>

            <div style={{ ...styles.statCard, borderLeft: '4px solid #be123c' }}>
              <div style={styles.statLabel}>TỔNG LỆ PHÍ XE ĐƯA ĐÓN</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#be123c', marginTop: '4px' }}>
                {stats.totalFees.toLocaleString()} <span style={{ fontSize: '13px' }}>VNĐ</span>
              </div>
              <div style={styles.statSub}>Nhà xe trực tiếp quản lý</div>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="glass no-print" style={{ padding: '1.2rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '240px' }}>
              <Search size={18} color="#64748b" />
              <input 
                type="text" 
                placeholder="Tìm theo Điểm đón (29B1-...), Họ tên học sinh..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13.5px' }}
              />
            </div>

            <select value={selectedClassFilter} onChange={e => setSelectedClassFilter(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Lớp</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>Lớp {c}</option>
              ))}
            </select>

            <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Khối lớp</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>

            <select value={selectedRouteType} onChange={e => setSelectedRouteType(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Tuyến Đường</option>
              {uniqueVehicleTypes.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Gói thời hạn</option>
              <option value="month">Gói Theo Tháng</option>
              <option value="term">Gói Theo Học Kỳ</option>
              <option value="year">Gói Cả Năm</option>
            </select>

            <button onClick={handlePrintBulk} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} /> In {filteredList.length} Vé Xe
            </button>
          </div>

          {/* DATA TABLE */}
          <div className="glass no-print" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              🚌 Danh sách Học sinh Đăng ký Xe đưa đón ({filteredList.length} xe)
            </h3>

            {loading ? <p>Đang nạp dữ liệu xe đưa đón...</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '10px' }}>Mã Thẻ</th>
                      <th style={{ padding: '10px' }}>Họ tên học sinh</th>
                      <th style={{ padding: '10px' }}>Lớp</th>
                      <th style={{ padding: '10px' }}>Điểm đón</th>
                      <th style={{ padding: '10px' }}>Tuyến đường</th>
                      <th style={{ padding: '10px' }}>Gói thời hạn</th>
                      <th style={{ padding: '10px' }}>Thời hạn áp dụng</th>
                      <th style={{ padding: '10px' }}>Lệ phí</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#0284c7' }}>{item.ticket_code}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{item.student_name}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#be123c' }}>{item.student_class}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', backgroundColor: '#f0fdf4', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                            {item.pickup_point}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#475569' }}>{item.route_type}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#b45309' }}>
                          {item.package_type === 'month' ? 'Tháng' : item.package_type === 'term' ? 'Học kỳ' : 'Cả năm'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '12.5px', color: '#64748b' }}>
                          Từ {item.start_date} <br />Đến {item.end_date}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#be123c' }}>
                          {(Number(item.fee_amount) || 0).toLocaleString()} VNĐ
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => handlePrintCard(item)} title="In Thẻ Gửi Xe" style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>
                              <Printer size={14} color="#be123c" /> In Vé Xe
                            </button>
                            <button type="button" onClick={() => handleToggleBlock(item)} title={item.status === 'blocked' ? 'Mở khóa' : 'Khóa thẻ xe'} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: item.status === 'blocked' ? '#fef2f2' : '#ffffff', color: item.status === 'blocked' ? '#ef4444' : '#64748b', cursor: 'pointer' }}>
                              {item.status === 'blocked' ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                            <button type="button" onClick={() => handleDeleteItem(item.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== TAB 2: FEE & PACKAGE CONFIGURATION ==================== */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* REGISTRATION TIME CONFIGURATION */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ margin: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
              ⏱️ Cấu Hình Thời Gian Đăng Ký
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={styles.label}>Trạng thái Mở/Đóng Cổng Đăng Ký (*)</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', border: regConfig.isOpen ? '1px solid #16a34a' : '1px solid #cbd5e1', backgroundColor: regConfig.isOpen ? '#f0fdf4' : '#f8fafc', color: regConfig.isOpen ? '#16a34a' : '#64748b', fontWeight: 'bold' }}>
                    <input type="radio" name="isOpen" checked={regConfig.isOpen === true} onChange={() => setRegConfig({ ...regConfig, isOpen: true })} /> 🟢 Đang Mở Cửa
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', border: !regConfig.isOpen ? '1px solid #dc2626' : '1px solid #cbd5e1', backgroundColor: !regConfig.isOpen ? '#fef2f2' : '#f8fafc', color: !regConfig.isOpen ? '#dc2626' : '#64748b', fontWeight: 'bold' }}>
                    <input type="radio" name="isOpen" checked={regConfig.isOpen === false} onChange={() => setRegConfig({ ...regConfig, isOpen: false })} /> 🔴 Đóng Cửa (Bảo trì/Hết hạn)
                  </label>
                </div>
              </div>
              <div>
                <label style={styles.label}>Thông báo khi Đóng cửa hoặc Hướng dẫn (Hiển thị cho HS)</label>
                <input 
                  type="text" 
                  value={regConfig.message} 
                  onChange={e => setRegConfig({ ...regConfig, message: e.target.value })} 
                  style={styles.input} 
                  placeholder="VD: Hệ thống đang đóng để duyệt hồ sơ..." 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={styles.label}>Thời gian Bắt đầu Mở đăng ký (Không bắt buộc)</label>
                <input 
                  type="datetime-local" 
                  value={regConfig.startDate} 
                  onChange={e => setRegConfig({ ...regConfig, startDate: e.target.value })} 
                  style={styles.input} 
                />
              </div>
              <div>
                <label style={styles.label}>Thời gian Kết thúc / Hạn chót (Không bắt buộc)</label>
                <input 
                  type="datetime-local" 
                  value={regConfig.endDate} 
                  onChange={e => setRegConfig({ ...regConfig, endDate: e.target.value })} 
                  style={styles.input} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleSaveRegConfig} className="btn-primary" style={{ padding: '9px 24px', backgroundColor: '#0284c7' }}>
                <Save size={16} /> Lưu Cấu Hình Thời Gian
              </button>
            </div>
          </div>

          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#be123c' }}>⚙️ Cấu Hình Gói Vé & Mức Phí Xe Đưa Đón</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>Thiết lập số tiền lệ phí và thời hạn các gói vé cho học sinh đăng ký</p>
              </div>
              <button onClick={() => { setEditingPkgId(null); setPkgKey(''); setPkgTitle(''); setPkgMonths(1); setPkgFee(50000); setPkgDesc(''); setShowPkgForm(!showPkgForm); }} className="btn-primary" style={{ padding: '9px 18px', backgroundColor: '#be123c' }}>
                <Plus size={16} /> Thêm Gói Vé Mới
              </button>
            </div>

          {/* PACKAGE EDIT MODAL POPUP */}
          {showPkgForm && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                  <h3 style={{ margin: 0, color: '#be123c' }}>
                    {editingPkgId ? '📝 Chỉnh Sửa Gói Xe Đưa Đón' : '➕ Tạo Gói Xe Đưa Đón Mới'}
                  </h3>
                  <button type="button" onClick={() => setShowPkgForm(false)} style={styles.closeBtn}>
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSavePackage} style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={styles.label}>Tên Gói Vé (*)</label>
                      <input type="text" required value={pkgTitle} onChange={e => setPkgTitle(e.target.value)} style={styles.input} placeholder="VD: Đăng ký Theo Quý" />
                    </div>
                    <div>
                      <label style={styles.label}>Mã Gói (Key)</label>
                      <input type="text" value={pkgKey} onChange={e => setPkgKey(e.target.value)} style={styles.input} placeholder="VD: quarter, month..." />
                    </div>
                    <div>
                      <label style={styles.label}>Số Tháng Hiệu Lực (*)</label>
                      <input type="number" required value={pkgMonths} onChange={e => setPkgMonths(e.target.value)} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.label}>Mức Phí Lệ Phí (VNĐ) (*)</label>
                      <input type="number" required value={pkgFee} onChange={e => setPkgFee(e.target.value)} style={{ ...styles.input, fontWeight: 'bold', color: '#be123c' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={styles.label}>Mô Tả Gói Vé</label>
                    <input type="text" value={pkgDesc} onChange={e => setPkgDesc(e.target.value)} style={styles.input} placeholder="VD: Thời hạn 3 tháng (Tiết kiệm 20.000 VNĐ)..." />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#be123c', backgroundColor: '#fff1f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                      <input type="checkbox" checked={pkgHideFee} onChange={e => setPkgHideFee(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                      <span>🙈 Ẩn số tiền lệ phí trên giao diện công khai (Hiển thị "🟢 Miễn phí")</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowPkgForm(false)} style={{ padding: '9px 18px', background: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Hủy</button>
                    <button type="submit" className="btn-primary" style={{ padding: '9px 24px', backgroundColor: '#be123c' }}>
                      <Save size={16} /> Lưu Cấu Hình Gói Vé
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PACKAGES LIST TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f1f5f9' }}>
                <th style={{ padding: '10px' }}>Thứ tự</th>
                <th style={{ padding: '10px' }}>Tên Gói Vé</th>
                <th style={{ padding: '10px' }}>Số tháng</th>
                <th style={{ padding: '10px' }}>Mức phí lệ phí (VNĐ)</th>
                <th style={{ padding: '10px' }}>Mô tả</th>
                <th style={{ padding: '10px' }}>Trạng thái</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg, idx) => (
                <tr key={pkg.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>#{idx + 1}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{pkg.title}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#0284c7' }}>{pkg.months_count} tháng</td>
                  <td style={{ padding: '10px', fontWeight: '900', color: pkg.hide_fee || Number(pkg.fee_amount) === 0 ? '#166534' : '#be123c', fontSize: '15px' }}>
                    {pkg.hide_fee ? '🙈 Ẩn lệ phí' : Number(pkg.fee_amount) === 0 ? '🟢 0 VNĐ (Miễn phí)' : `${(Number(pkg.fee_amount) || 0).toLocaleString()} VNĐ`}
                  </td>
                  <td style={{ padding: '10px', color: '#64748b' }}>{pkg.description || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: pkg.is_active ? '#f0fdf4' : '#fef2f2', color: pkg.is_active ? '#166534' : '#ef4444' }}>
                      {pkg.is_active ? 'Đang áp dụng' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => handleEditPackage(pkg)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #0284c7', background: '#e0f2fe', color: '#0284c7', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} title="Sửa gói vé">
                        <Edit3 size={14} /> Sửa Gói
                      </button>
                      <button type="button" onClick={() => handleTogglePkgActive(pkg)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {pkg.is_active ? 'Ẩn gói' : 'Mở lại'}
                      </button>
                      <button type="button" onClick={() => handleDeletePackage(pkg.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} title="Xóa gói vé">
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ==================== TAB 3: SECURITY CHECK-IN TERMINAL ==================== */}
      {activeTab === 'checkin' && (
        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <ShieldCheck size={48} color="#be123c" />
            <h3 style={{ margin: '10px 0 4px 0', color: '#1e293b' }}>TRẠM KIỂM SOÁT BẢO VỆ CỔNG XE</h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>Gõ Điểm đón / Mã Vé / Mã Học sinh để kiểm tra thời hạn và thông tin gửi xe</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
            <input 
              type="text" 
              placeholder="Nhập Điểm đón (VD: 29B1-567.89), Mã Thẻ Xe (PARK-...), hoặc Mã HS..." 
              value={checkinQuery}
              onChange={e => handleCheckinSearch(e.target.value)}
              style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '2px solid #be123c', fontSize: '16px', fontWeight: 'bold', outline: 'none' }}
              autoFocus
            />
          </div>

          {/* CHECK-IN STATUS ALERT RESULT CARD */}
          {checkinResult && (
            <div style={{ padding: '25px', borderRadius: '16px', border: '2px solid', ...getCheckinCardStyle(checkinResult.checkinStatus) }}>
              {checkinResult.checkinStatus === 'VALID' && (
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle2 size={56} color="#166534" />
                  <h2 style={{ margin: '8px 0 0 0', color: '#166534', fontSize: '22px' }}>🟢 XE HỢP LỆ & ĐỦ ĐIỀU KIỆN GỬI</h2>
                  <div style={{ fontSize: '14px', color: '#15803d', marginTop: '4px' }}>Vé đang trong thời hạn hiệu lực</div>
                </div>
              )}

              {checkinResult.checkinStatus === 'EXPIRED' && (
                <div style={{ textAlign: 'center' }}>
                  <AlertTriangle size={56} color="#dc2626" />
                  <h2 style={{ margin: '8px 0 0 0', color: '#dc2626', fontSize: '22px' }}>🔴 XE ĐÃ HẾT HẠN GỬI XE!</h2>
                  <div style={{ fontSize: '14px', color: '#b91c1c', marginTop: '4px' }}>Cần yêu cầu học sinh nộp lệ phí gia hạn vé mới</div>
                </div>
              )}

              {checkinResult.checkinStatus === 'BLOCKED' && (
                <div style={{ textAlign: 'center' }}>
                  <Lock size={56} color="#7c2d12" />
                  <h2 style={{ margin: '8px 0 0 0', color: '#7c2d12', fontSize: '22px' }}>🚫 THẺ XE ĐANG BỊ KHÓA / ĐÌNH CHỈ!</h2>
                  <div style={{ fontSize: '14px', color: '#9a3412', marginTop: '4px' }}>Học sinh vi phạm quy định gửi xe trường</div>
                </div>
              )}

              {checkinResult.checkinStatus === 'UNREGISTERED' && (
                <div style={{ textAlign: 'center' }}>
                  <AlertCircle size={56} color="#b45309" />
                  <h2 style={{ margin: '8px 0 0 0', color: '#b45309', fontSize: '22px' }}>⚠️ CHƯA ĐĂNG KÝ / XE LẠ!</h2>
                  <div style={{ fontSize: '14px', color: '#d97706', marginTop: '4px' }}>Không tìm thấy thông tin biển số "{checkinResult.searchKey}" trong CSDL</div>
                </div>
              )}

              {checkinResult.student_name && (
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1', fontSize: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><strong>Họ và tên:</strong> {checkinResult.student_name}</div>
                  <div><strong>Lớp:</strong> {checkinResult.student_class} ({checkinResult.grade_level})</div>
                  <div><strong>Điểm đón:</strong> <span style={{ fontWeight: '900', color: '#be123c' }}>{checkinResult.pickup_point}</span></div>
                  <div><strong>Tuyến đường:</strong> {checkinResult.route_type}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Thời hạn vé:</strong> Từ {checkinResult.start_date} Đến {checkinResult.end_date}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

const getCheckinCardStyle = (status) => {
  switch (status) {
    case 'VALID': return { backgroundColor: '#f0fdf4', borderColor: '#86efac' };
    case 'EXPIRED': return { backgroundColor: '#fef2f2', borderColor: '#fca5a5' };
    case 'BLOCKED': return { backgroundColor: '#fff7ed', borderColor: '#fdba74' };
    default: return { backgroundColor: '#fefce8', borderColor: '#fde047' };
  }
};

const styles = {
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    overflowX: 'auto',
    paddingBottom: '4px'
  },
  tabBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '1.5rem'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  statLabel: {
    fontSize: '11.5px',
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: '0.5px'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#1e293b',
    marginTop: '4px'
  },
  statSub: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px'
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: 'bold',
    backgroundColor: '#ffffff',
    color: '#334155'
  },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  printTicketCard: {
    maxWidth: '350px',
    border: '2px dashed #be123c',
    borderRadius: '12px',
    padding: '16px',
    backgroundColor: '#ffffff'
  },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '18px', fontWeight: 'bold', padding: '4px' }
};
