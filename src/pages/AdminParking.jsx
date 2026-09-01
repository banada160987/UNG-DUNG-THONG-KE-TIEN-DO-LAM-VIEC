import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase, logActivity } from '../lib/supabase';
import { Bike, Search, Printer, Download, Plus, CheckCircle2, AlertCircle, Clock, Trash2, Edit3, Eye, QrCode, Settings, ShieldCheck, Lock, Unlock, AlertTriangle, RefreshCw, Save, BarChart, Archive } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateParkingWordReport } from '../lib/wordExportParking';

const DEFAULT_PARKING_LIST = [
  { id: '1', ticket_code: 'PARK-11A1-001', student_name: 'Nguyễn Văn An', student_code: 'HS11A1-01', student_class: '11A1', grade_level: 'Khối 11', license_plate: '29B1-567.89', vehicle_type: 'Xe máy điện', vehicle_color: 'Đen nhám', package_type: 'term', start_date: '2026-09-01', end_date: '2027-01-15', fee_amount: 200000, status: 'active' },
  { id: '2', ticket_code: 'PARK-12A3-002', student_name: 'Trần Thị Bích', student_code: 'HS12A3-05', student_class: '12A3', grade_level: 'Khối 12', license_plate: '29H1-888.66', vehicle_type: 'Xe máy 50cc', vehicle_color: 'Trắng đỏ', package_type: 'year', start_date: '2026-09-01', end_date: '2027-05-31', fee_amount: 450000, status: 'active' },
  { id: '3', ticket_code: 'PARK-10A2-003', student_name: 'Phạm Minh Cường', student_code: 'HS10A2-12', student_class: '10A2', grade_level: 'Khối 10', license_plate: '29K1-345.12', vehicle_type: 'Xe máy điện', vehicle_color: 'Xanh dương', package_type: 'month', start_date: '2026-09-01', end_date: '2026-09-30', fee_amount: 50000, status: 'active' }
];

const DEFAULT_PACKAGES = [
  { id: 'p1', package_key: 'month', title: 'Đăng ký Theo Tháng', months_count: 1, fee_amount: 50000, description: 'Thời hạn 1 tháng (50.000 VNĐ)', sort_order: 1, is_active: true },
  { id: 'p2', package_key: 'quarter', title: 'Đăng ký Theo Quý (3 tháng)', months_count: 3, fee_amount: 130000, description: 'Thời hạn 3 tháng (Tiết kiệm 20.000 VNĐ)', sort_order: 2, is_active: true },
  { id: 'p3', package_key: 'term', title: 'Đăng ký Theo Học Kỳ (5 tháng)', months_count: 5, fee_amount: 200000, description: 'Thời hạn 1 Học kỳ (Tiết kiệm 50.000 VNĐ)', sort_order: 3, is_active: true },
  { id: 'p4', package_key: 'year', title: 'Đăng ký Cả Năm Học (9 tháng)', months_count: 9, fee_amount: 400000, description: 'Thời hạn trọn cả năm học (Tiết kiệm 50.000 VNĐ)', sort_order: 4, is_active: true }
];

export default function AdminParking() {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'config', 'checkin', 'alerts'
  
  const [parkingList, setParkingList] = useState(DEFAULT_PARKING_LIST);
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedPackage, setSelectedPackage] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [selectedVehicleType, setSelectedVehicleType] = useState('ALL');
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
  const [pkgApplicableVehicles, setPkgApplicableVehicles] = useState([]);

  // Security Check-in Terminal Query
  const [checkinQuery, setCheckinQuery] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);

  // Edit Ticket State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
        supabase.from('cbq_parking_registrations').select('*').order('created_at', { ascending: false }),
        supabase.from('cbq_parking_packages').select('*').order('sort_order', { ascending: true })
      ]);

      if (!parkingRes.error && parkingRes.data && parkingRes.data.length > 0) {
        setParkingList(parkingRes.data);
      }

      if (!pkgRes.error && pkgRes.data && pkgRes.data.length > 0) {
        const local = localStorage.getItem('cbq_parking_packages');
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
        const local = localStorage.getItem('cbq_parking_packages');
        if (local) {
          setPackages(JSON.parse(local));
        } else {
          setPackages(DEFAULT_PACKAGES);
          localStorage.setItem('cbq_parking_packages', JSON.stringify(DEFAULT_PACKAGES));
        }
      }

      // Fetch Registration Config
      try {
        const { data: configData, error: configError } = await supabase.from('cbq_parking_settings').select('*').maybeSingle();
        if (!configError && configData) {
          setRegConfig({
            isOpen: configData.is_open,
            startDate: configData.start_time ? new Date(new Date(configData.start_time).getTime() - (new Date(configData.start_time).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
            endDate: configData.end_time ? new Date(new Date(configData.end_time).getTime() - (new Date(configData.end_time).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
            message: configData.notice_message || ''
          });
          localStorage.setItem('cbq_parking_settings', JSON.stringify(configData));
        } else {
          loadLocalConfig();
        }
      } catch (err) {
        loadLocalConfig();
      }

    } catch (err) {
      console.warn("Dùng dữ liệu xe mẫu:", err);
      const local = localStorage.getItem('cbq_parking_packages');
      if (local) setPackages(JSON.parse(local));
      loadLocalConfig();
    } finally {
      setLoading(false);
    }
  }

  function loadLocalConfig() {
    const local = localStorage.getItem('cbq_parking_settings');
    if (local) {
      const parsed = JSON.parse(local);
      setRegConfig({
        isOpen: parsed.is_open !== undefined ? parsed.is_open : true,
        startDate: parsed.start_time ? new Date(new Date(parsed.start_time).getTime() - (new Date(parsed.start_time).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
        endDate: parsed.end_time ? new Date(new Date(parsed.end_time).getTime() - (new Date(parsed.end_time).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
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
      await supabase.from('cbq_parking_settings').upsert([payload]);
    } catch (err) {
      console.warn('Lỗi lưu cấu hình DB:', err);
    }
    localStorage.setItem('cbq_parking_settings', JSON.stringify(payload));
    alert('Đã lưu Cấu hình Thời gian đăng ký!');
  };

  const handleArchiveExpired = async () => {
    const today = new Date();
    const expiredIds = parkingList
      .filter(i => i.status !== 'archived' && i.status !== 'blocked' && new Date(i.end_date) < today)
      .map(i => i.id);

    if (expiredIds.length === 0) {
      alert("Không có vé nào đã hết hạn cần lưu trữ!");
      return;
    }

    if (window.confirm(`Bạn có chắc muốn chuyển ${expiredIds.length} vé đã hết hạn vào Lưu trữ? Các vé này sẽ được cất đi và không hiển thị ở danh sách chính nữa.`)) {
      try {
        const { error } = await supabase
          .from('cbq_parking_registrations')
          .update({ status: 'archived' })
          .in('id', expiredIds);
        
        if (error) throw error;
        alert("Lưu trữ thành công!");
        fetchData();
      } catch (err) {
        alert("Lỗi lưu trữ: " + err.message);
      }
    }
  };

  // Filter Data
  const uniqueClasses = Array.from(new Set(parkingList.map(i => i.student_class).filter(Boolean))).sort();
  const uniqueVehicleTypes = Array.from(new Set(parkingList.map(i => i.vehicle_type).filter(Boolean))).sort();

  const filteredList = parkingList.filter(item => {
    const matchSearch = !searchTerm || 
      item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ticket_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchGrade = selectedGrade === 'ALL' || item.grade_level === selectedGrade;
    const matchPkg = selectedPackage === 'ALL' || item.package_type === selectedPackage;

    const today = new Date();
    let computedStatus = item.status;
    if (computedStatus !== 'archived' && computedStatus !== 'blocked' && new Date(item.end_date) < today) {
      computedStatus = 'expired';
    }
    const matchStatus = selectedStatus === 'ALL' ? item.status !== 'archived' : computedStatus === selectedStatus;

    const matchVehicle = selectedVehicleType === 'ALL' || item.vehicle_type === selectedVehicleType;
    const matchClass = selectedClassFilter === 'ALL' || item.student_class === selectedClassFilter;

    return matchSearch && matchGrade && matchPkg && matchStatus && matchVehicle && matchClass;
  });

  // Calculate Statistics
  const activeList = parkingList.filter(i => i.status !== 'archived');
  const stats = {
    total: activeList.length,
    grade10: activeList.filter(i => i.grade_level === 'Khối 10').length,
    grade11: activeList.filter(i => i.grade_level === 'Khối 11').length,
    grade12: activeList.filter(i => i.grade_level === 'Khối 12').length,
    pkgMonth: activeList.filter(i => i.package_type === 'month').length,
    pkgTerm: activeList.filter(i => i.package_type === 'term').length,
    pkgYear: activeList.filter(i => i.package_type === 'year').length,
    totalFees: activeList.reduce((acc, curr) => acc + (Number(curr.fee_amount) || 0), 0)
  };

  const classStats = uniqueClasses.map(cls => ({
    name: cls,
    count: parkingList.filter(i => i.student_class === cls).length
  })).sort((a, b) => {
    // Sort by count desc, then name asc
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  const vehicleStats = uniqueVehicleTypes.map(v => ({
    name: v,
    count: parkingList.filter(i => i.vehicle_type === v).length
  })).sort((a, b) => b.count - a.count);

  // Check-in terminal search function
  const handleCheckinSearch = (q) => {
    setCheckinQuery(q);
    if (!q.trim()) {
      setCheckinResult(null);
      return;
    }
    const cleanQ = q.trim().toLowerCase();
    const found = parkingList.find(i => 
      i.license_plate?.toLowerCase().includes(cleanQ) ||
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
        is_active: true,
        applicable_vehicles: pkgApplicableVehicles
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

        localStorage.setItem('cbq_parking_packages', JSON.stringify(nextList));
        return nextList;
      });

      // 2. Async Supabase DB Upsert
      try {
        const dbPayload = (targetId && !String(targetId).startsWith('p') && !String(targetId).startsWith('pkg_')) 
          ? { id: targetId, ...payload } 
          : payload;

        await supabase
          .from('cbq_parking_packages')
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
    setPkgApplicableVehicles(pkg.applicable_vehicles || []);
    setShowPkgForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói vé này?")) return;
    const updated = packages.filter(p => String(p.id) !== String(id));
    setPackages(updated);
    localStorage.setItem('cbq_parking_packages', JSON.stringify(updated));

    try {
      await supabase.from('cbq_parking_packages').delete().eq('id', id);
    } catch (err) {
      console.warn("Lỗi khi xóa:", err);
    }
  };

  // Toggle Package Active Status
  const handleTogglePkgActive = async (pkg) => {
    const updated = packages.map(p => String(p.id) === String(pkg.id) ? { ...p, is_active: !p.is_active } : p);
    setPackages(updated);
    localStorage.setItem('cbq_parking_packages', JSON.stringify(updated));

    try {
      await supabase.from('cbq_parking_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
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
      await supabase.from('cbq_parking_registrations').update({ status: newStatus }).eq('id', item.id);
      setParkingList(parkingList.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
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
      "Biển Số Xe": item.license_plate,
      "Loại Xe": item.vehicle_type,
      "Màu Xe": item.vehicle_color || "",
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
        const { data, error } = await supabase.from('cbq_parking_registrations').select('*').range(fromParking, fromParking + 999);
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
      await generateParkingWordReport(allStudents, parkingData, busData);
      alert("Đã xuất báo cáo Word (chuẩn Nghị định 30) thành công!");
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi tạo báo cáo Word: " + err.message);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lượt đăng ký xe này?")) return;
    try {
      await supabase.from('cbq_parking_registrations').delete().eq('id', item.id);
      setParkingList(parkingList.filter(i => i.id !== item.id));
      await logActivity('parking', item.id, item.ticket_code, 'DELETE', 'admin', 'Admin đã xóa vé');
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingTicket({ ...item });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('cbq_parking_registrations')
        .update({
          student_name: editingTicket.student_name,
          student_class: editingTicket.student_class,
          license_plate: editingTicket.license_plate,
          vehicle_type: editingTicket.vehicle_type,
          package_type: editingTicket.package_type
        })
        .eq('id', editingTicket.id)
        .select()
        .single();

      if (error) throw error;

      setParkingList(parkingList.map(i => i.id === data.id ? data : i));
      
      const changes = `Admin sửa vé: Tên(${data.student_name}), Lớp(${data.student_class}), Biển số(${data.license_plate}), Loại xe(${data.vehicle_type}), Gói(${data.package_type})`;
      await logActivity('parking', data.id, data.ticket_code, 'UPDATE', 'admin', changes);

      setShowEditModal(false);
      setEditingTicket(null);
      alert("Đã cập nhật thông tin vé thành công!");
    } catch (err) {
      alert("Lỗi khi cập nhật vé: " + err.message);
    }
  };

  const handleViewHistory = async (item) => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setTicketHistory([]);
    try {
      const { data, error } = await supabase
        .from('cbq_audit_logs')
        .select('*')
        .eq('entity_id', item.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setTicketHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
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
    <Layout title="Quản lý Xe máy Học sinh">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body, #root, div, main, section {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          header, nav, sidebar, footer, .no-print, .glass, .layout-sidebar, .hamburger-btn {
            display: none !important;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-card {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            background: white !important;
            z-index: 999999 !important;
          }
          .print-ticket-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .print-ticket-card-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 8px !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* PRINT MODAL CARD (Hidden during regular display, visible on print) */}
      {selectedTicketsToPrint && selectedTicketsToPrint.length > 0 && (
        <div style={{ display: 'none' }} className="printable-card">
          <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px solid #be123c', paddingBottom: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#be123c', textTransform: 'uppercase' }}>DANH SÁCH THẺ GỬI XE MÁY HỌC SINH IN HÀNG LOẠT</div>
            <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '2px' }}>
              {selectedClassFilter !== 'ALL' && <span style={{ marginRight: '10px' }}>LỚP: <b style={{ color: '#be123c' }}>{selectedClassFilter}</b></span>}
              {selectedVehicleType !== 'ALL' && <span style={{ marginRight: '10px' }}>LOẠI XE: <b style={{ color: '#0284c7' }}>{selectedVehicleType}</b></span>}
              <span>TỔNG SỐ THẺ: <b style={{ color: '#166534' }}>{selectedTicketsToPrint.length} THẺ</b></span>
            </div>
          </div>

          <div className="print-ticket-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', padding: '4px' }}>
            {selectedTicketsToPrint.map((ticket, idx) => (
              <div key={idx} className="print-ticket-card-item" style={{
                width: '100%',
                maxWidth: '345px',
                border: '2px solid #be123c',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                overflow: 'hidden',
                breakInside: 'avoid'
              }}>
                {/* HEADER BANNER */}
                <div style={{
                  background: 'linear-gradient(135deg, #991b1b 0%, #be123c 100%)',
                  color: '#ffffff',
                  padding: '7px 10px',
                  textAlign: 'center',
                  borderBottom: '2px solid #f59e0b'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.95 }}>
                    TRƯỜNG THPT CAO BÁ QUÁT
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: '900', letterSpacing: '0.5px', color: '#fef08a', marginTop: '1px' }}>
                    THẺ GỬI XE MÁY HỌC SINH
                  </div>
                </div>

                {/* CARD BODY */}
                <div style={{ padding: '10px 12px' }}>
                  {/* TICKET CODE BADGE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>MÃ VÉ:</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                      {ticket.ticket_code}
                    </span>
                  </div>

                  {/* STUDENT & VEHICLE DETAILS */}
                  <div style={{ fontSize: '12px', lineHeight: '1.45', color: '#1e293b' }}>
                    <div><strong>Họ tên HS:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{ticket.student_name}</span></div>
                    <div><strong>Lớp:</strong> <span style={{ color: '#be123c', fontWeight: 'bold' }}>{ticket.student_class}</span> ({ticket.grade_level})</div>
                    
                    {/* REALISTIC LICENSE PLATE BOX */}
                    <div style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '12px' }}>Biển số xe:</strong>
                      <div style={{
                        display: 'inline-block',
                        padding: '1px 8px',
                        border: '1.5px solid #1e293b',
                        borderRadius: '5px',
                        backgroundColor: '#ffffff',
                        color: '#be123c',
                        fontWeight: '900',
                        fontSize: '13.5px',
                        letterSpacing: '0.8px'
                      }}>
                        {ticket.license_plate}
                      </div>
                    </div>

                    <div><strong>Loại xe:</strong> {ticket.vehicle_type}</div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}><strong>Thời hạn:</strong> Từ {ticket.start_date} Đến {ticket.end_date}</div>
                  </div>

                  {/* FOOTER QR & SIGNATURE AREA */}
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ textAlign: 'center' }}>
                      <QrCode size={40} color="#1e293b" />
                      <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', marginTop: '1px' }}>CHECK-IN</div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#1e293b' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#991b1b' }}>XÁC NHẬN LÃNH ĐẠO TRƯỜNG</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic', marginTop: '16px' }}>(Ký & đóng dấu)</div>
                    </div>
                  </div>
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
            <Bike size={26} color="#be123c" /> Quản Lý Phương Tiện Xe Máy Học Sinh
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Thống kê số lượng, cấu hình mức phí, kiểm soát an ninh cổng xe và in thẻ gửi xe
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
        <button 
          onClick={() => setActiveTab('list')} 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'list' ? '#be123c' : '#ffffff', color: activeTab === 'list' ? '#ffffff' : '#334155' }}
        >
          <Bike size={16} /> 🛵 Danh Sách & In Vé Xe ({parkingList.length})
        </button>
        <button 
          onClick={() => setActiveTab('config')} 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'config' ? '#be123c' : '#ffffff', color: activeTab === 'config' ? '#ffffff' : '#334155' }}
        >
          <Settings size={16} /> ⚙️ Cấu Hình Gói Vé & Mức Phí ({packages.length})
        </button>
        <button 
          onClick={() => setActiveTab('stats')} 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'stats' ? '#be123c' : '#ffffff', color: activeTab === 'stats' ? '#ffffff' : '#334155' }}
        >
          <BarChart size={16} /> 📊 Báo Cáo Thống Kê
        </button>
        <button 
          onClick={() => setActiveTab('checkin')} 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'checkin' ? '#be123c' : '#ffffff', color: activeTab === 'checkin' ? '#ffffff' : '#334155' }}
        >
          <ShieldCheck size={16} /> 🔍 Trạm Kiểm Soát Check-in Cổng Xe
        </button>
      </div>

      {/* ==================== TAB 1: LIST & PRINT ==================== */}
      {activeTab === 'list' && (
        <>
          {/* STATISTICS CARDS PANEL */}
          <div style={styles.statsGrid} className="no-print">
            <div style={styles.statCard}>
              <div style={styles.statLabel}>TỔNG SỐ XE ĐĂNG KÝ</div>
              <div style={styles.statNumber}>{stats.total} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>xe</span></div>
              <div style={styles.statSub}>Tất cả khối lớp</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>THỐNG KÊ THEO KHỐI LỚP</div>
              <div style={{ fontSize: '13.5px', marginTop: '6px', lineHeight: '1.6' }}>
                <div>Khối 10: <strong>{stats.grade10}</strong> xe</div>
                <div>Khối 11: <strong>{stats.grade11}</strong> xe</div>
                <div>Khối 12: <strong>{stats.grade12}</strong> xe</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>THỐNG KÊ GÓI ĐĂNG KÝ</div>
              <div style={{ fontSize: '13.5px', marginTop: '6px', lineHeight: '1.6' }}>
                <div>Theo Học Kỳ: <strong>{stats.pkgTerm}</strong> xe</div>
                <div>Theo Tháng: <strong>{stats.pkgMonth}</strong> xe</div>
                <div>Cả Năm Học: <strong>{stats.pkgYear}</strong> xe</div>
              </div>
            </div>

            <div style={{ ...styles.statCard, borderLeft: '4px solid #be123c' }}>
              <div style={styles.statLabel}>TỔNG LỆ PHÍ THU GIỮ XE</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#be123c', marginTop: '4px' }}>
                {stats.totalFees.toLocaleString()} <span style={{ fontSize: '13px' }}>VNĐ</span>
              </div>
              <div style={styles.statSub}>Bảo vệ quản lý trực tiếp</div>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="glass no-print" style={{ padding: '1.2rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '240px' }}>
              <Search size={18} color="#64748b" />
              <input 
                type="text" 
                placeholder="Tìm theo Biển số xe (29B1-...), Họ tên học sinh..."
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

            <select value={selectedVehicleType} onChange={e => setSelectedVehicleType(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Loại Xe</option>
              {uniqueVehicleTypes.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="expired">Đã hết hạn</option>
              <option value="blocked">Đã khóa</option>
              <option value="archived">Đã lưu trữ (Ẩn)</option>
            </select>

            <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Gói thời hạn</option>
              <option value="month">Gói Theo Tháng</option>
              <option value="term">Gói Theo Học Kỳ</option>
              <option value="year">Gói Cả Năm</option>
            </select>

            <button onClick={handlePrintBulk} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} /> In {filteredList.length} Vé
            </button>
            <button onClick={handleArchiveExpired} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #eab308', backgroundColor: '#fef08a', color: '#854d0e', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Archive size={16} /> Chốt sổ (Lưu trữ vé cũ)
            </button>
          </div>

          {/* DATA TABLE */}
          <div className="glass no-print" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              🛵 Danh sách Học sinh Đăng ký Xe máy ({filteredList.length} xe)
            </h3>

            {loading ? <p>Đang nạp dữ liệu xe máy...</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '10px' }}>Mã Thẻ</th>
                      <th style={{ padding: '10px' }}>Họ tên học sinh</th>
                      <th style={{ padding: '10px' }}>Lớp</th>
                      <th style={{ padding: '10px' }}>Biển Số Xe</th>
                      <th style={{ padding: '10px' }}>Loại xe</th>
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
                            {item.license_plate}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#475569' }}>{item.vehicle_type}</td>
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
                            <button type="button" onClick={() => handleOpenEdit(item)} title="Sửa thông tin" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #0284c7', background: '#e0f2fe', color: '#0284c7', cursor: 'pointer' }}>
                              <Edit3 size={14} />
                            </button>
                            <button type="button" onClick={() => handleViewHistory(item)} title="Lịch sử chỉnh sửa" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #eab308', background: '#fef9c3', color: '#ca8a04', cursor: 'pointer' }}>
                              <Clock size={14} />
                            </button>
                            <button type="button" onClick={() => handleToggleBlock(item)} title={item.status === 'blocked' ? 'Mở khóa' : 'Khóa thẻ xe'} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: item.status === 'blocked' ? '#fef2f2' : '#ffffff', color: item.status === 'blocked' ? '#ef4444' : '#64748b', cursor: 'pointer' }}>
                              {item.status === 'blocked' ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                            <button type="button" onClick={() => handleDeleteItem(item)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
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

      {/* ==================== TAB: STATISTICS ==================== */}
      {activeTab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <div className="glass no-print" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏫 Thống Kê Số Lượng Xe Theo Lớp
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {classStats.map(c => (
                <div key={c.name} style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>Lớp {c.name}</span>
                  <span style={{ backgroundColor: '#be123c', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{c.count} xe</span>
                </div>
              ))}
              {classStats.length === 0 && <p style={{ color: '#64748b', fontSize: '13.5px' }}>Chưa có dữ liệu</p>}
            </div>
          </div>

          <div className="glass no-print" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛵 Thống Kê Theo Loại Xe
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {vehicleStats.map(v => (
                <div key={v.name} style={{ padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{v.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '120px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${stats.total > 0 ? (v.count / stats.total) * 100 : 0}%`, height: '100%', backgroundColor: '#0284c7' }}></div>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '14px', width: '45px', textAlign: 'right' }}>{v.count} xe</span>
                  </div>
                </div>
              ))}
              {vehicleStats.length === 0 && <p style={{ color: '#64748b', fontSize: '13.5px' }}>Chưa có dữ liệu</p>}
            </div>
          </div>
        </div>
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
                <h3 style={{ margin: 0, color: '#be123c' }}>⚙️ Cấu Hình Gói Vé & Mức Phí Giữ Xe</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>Thiết lập số tiền lệ phí và thời hạn các gói vé cho học sinh đăng ký</p>
              </div>
              <button onClick={() => { setEditingPkgId(null); setPkgKey(''); setPkgTitle(''); setPkgMonths(1); setPkgFee(50000); setPkgDesc(''); setPkgHideFee(false); setPkgApplicableVehicles([]); setShowPkgForm(!showPkgForm); }} className="btn-primary" style={{ padding: '9px 18px', backgroundColor: '#be123c' }}>
                <Plus size={16} /> Thêm Gói Vé Mới
              </button>
            </div>

          {/* PACKAGE EDIT MODAL POPUP */}
          {showPkgForm && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                  <h3 style={{ margin: 0, color: '#be123c' }}>
                    {editingPkgId ? '📝 Chỉnh Sửa Gói Vé Xe Máy' : '➕ Tạo Gói Vé Xe Máy Mới'}
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

                  <div style={{ marginBottom: '14px' }}>
                    <label style={styles.label}>Áp dụng cho các phương tiện (Bỏ trống để áp dụng cho TẤT CẢ)</label>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '5px' }}>
                      {['Xe đạp', 'Xe đạp điện', 'Xe máy điện', 'Xe máy 50cc', 'Xe máy >50cc'].map(v => (
                        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13.5px' }}>
                          <input 
                            type="checkbox" 
                            checked={pkgApplicableVehicles.includes(v)}
                            onChange={(e) => {
                              if (e.target.checked) setPkgApplicableVehicles([...pkgApplicableVehicles, v]);
                              else setPkgApplicableVehicles(pkgApplicableVehicles.filter(item => item !== v));
                            }}
                          /> {v}
                        </label>
                      ))}
                    </div>
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
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>Gõ Biển Số Xe / Mã Vé / Mã Học sinh để kiểm tra thời hạn và thông tin gửi xe</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
            <input 
              type="text" 
              placeholder="Nhập Biển Số Xe (VD: 29B1-567.89), Mã Thẻ Xe (PARK-...), hoặc Mã HS..." 
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
                  <div><strong>Biển số xe:</strong> <span style={{ fontWeight: '900', color: '#be123c' }}>{checkinResult.license_plate}</span></div>
                  <div><strong>Loại xe:</strong> {checkinResult.vehicle_type}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Thời hạn vé:</strong> Từ {checkinResult.start_date} Đến {checkinResult.end_date}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODALS ==================== */}
      
      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#ca8a04', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} /> Lịch Sử Chỉnh Sửa Vé
              </h3>
              <button type="button" onClick={() => setShowHistoryModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              {loadingHistory ? (
                <p>Đang tải lịch sử...</p>
              ) : ticketHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <Clock size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
                  <p>Vé này chưa có lịch sử chỉnh sửa nào.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ticketHistory.map((log, idx) => (
                    <div key={idx} style={{ padding: '12px', borderLeft: '4px solid #ca8a04', backgroundColor: '#fefce8', borderRadius: '0 8px 8px 0', fontSize: '13.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#854d0e', fontSize: '12px', fontWeight: 'bold' }}>
                        <span>{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                        <span>Bởi: {log.performed_by === 'admin' ? 'Admin / BGH' : 'Học sinh (Tự sửa)'}</span>
                      </div>
                      <div style={{ color: '#422006' }}>
                        <strong>Thao tác ({log.action}):</strong> {log.changes}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT TICKET MODAL */}
      {showEditModal && editingTicket && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} /> Chỉnh Sửa Thông Tin Vé ({editingTicket.ticket_code})
              </h3>
              <button type="button" onClick={() => setShowEditModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={styles.label}>Họ và Tên (*)</label>
                  <input type="text" required value={editingTicket.student_name} onChange={e => setEditingTicket({...editingTicket, student_name: e.target.value})} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Lớp (*)</label>
                  <input type="text" required value={editingTicket.student_class} onChange={e => setEditingTicket({...editingTicket, student_class: e.target.value})} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Biển số xe (*)</label>
                  <input type="text" required value={editingTicket.license_plate} onChange={e => setEditingTicket({...editingTicket, license_plate: e.target.value})} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Loại xe (*)</label>
                  <select value={editingTicket.vehicle_type} onChange={e => setEditingTicket({...editingTicket, vehicle_type: e.target.value})} style={styles.input}>
                    <option value="Xe máy điện">Xe máy điện</option>
                    <option value="Xe máy 50cc">Xe máy 50cc</option>
                    <option value="Xe máy >50cc">Xe máy &gt;50cc</option>
                    <option value="Xe đạp">Xe đạp</option>
                    <option value="Xe đạp điện">Xe đạp điện</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Gói đăng ký (*)</label>
                  <select value={editingTicket.package_type} onChange={e => setEditingTicket({...editingTicket, package_type: e.target.value})} style={styles.input}>
                    {packages.map(p => (
                      <option key={p.package_key} value={p.package_key}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '9px 18px', background: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ padding: '9px 24px', backgroundColor: '#0284c7' }}>Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
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
    width: '100%',
    maxWidth: '340px',
    border: '2px dashed #be123c',
    borderRadius: '10px',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box'
  },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '18px', fontWeight: 'bold', padding: '4px' }
};
