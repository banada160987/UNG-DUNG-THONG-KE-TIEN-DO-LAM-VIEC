import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Bike, Search, Printer, Download, Plus, CheckCircle2, AlertCircle, Clock, Trash2, Edit3, Eye, QrCode, Settings, ShieldCheck, Lock, Unlock, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTicketToPrint, setSelectedTicketToPrint] = useState(null);

  // Package Form State
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState(null);
  const [pkgKey, setPkgKey] = useState('');
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgMonths, setPkgMonths] = useState(1);
  const [pkgFee, setPkgFee] = useState(50000);
  const [pkgDesc, setPkgDesc] = useState('');

  // Security Check-in Terminal Query
  const [checkinQuery, setCheckinQuery] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);

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
        setPackages(pkgRes.data);
        localStorage.setItem('cbq_parking_packages', JSON.stringify(pkgRes.data));
      } else {
        const local = localStorage.getItem('cbq_parking_packages');
        if (local) {
          setPackages(JSON.parse(local));
        } else {
          setPackages(DEFAULT_PACKAGES);
          localStorage.setItem('cbq_parking_packages', JSON.stringify(DEFAULT_PACKAGES));
        }
      }
    } catch (err) {
      console.warn("Dùng dữ liệu xe mẫu:", err);
      const local = localStorage.getItem('cbq_parking_packages');
      if (local) setPackages(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  }

  // Filter Data
  const filteredList = parkingList.filter(item => {
    const matchSearch = !searchTerm || 
      item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ticket_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchGrade = selectedGrade === 'ALL' || item.grade_level === selectedGrade;
    const matchPkg = selectedPackage === 'ALL' || item.package_type === selectedPackage;
    const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;

    return matchSearch && matchGrade && matchPkg && matchStatus;
  });

  // Calculate Statistics
  const stats = {
    total: parkingList.length,
    grade10: parkingList.filter(i => i.grade_level === 'Khối 10').length,
    grade11: parkingList.filter(i => i.grade_level === 'Khối 11').length,
    grade12: parkingList.filter(i => i.grade_level === 'Khối 12').length,
    pkgMonth: parkingList.filter(i => i.package_type === 'month').length,
    pkgTerm: parkingList.filter(i => i.package_type === 'term').length,
    pkgYear: parkingList.filter(i => i.package_type === 'year').length,
    totalFees: parkingList.reduce((acc, curr) => acc + (Number(curr.fee_amount) || 0), 0)
  };

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
    if (!pkgTitle.trim()) {
      alert("Vui lòng điền Tên Gói Vé!");
      return;
    }

    try {
      const payload = {
        package_key: pkgKey || `pkg_${Date.now()}`,
        title: pkgTitle.trim(),
        months_count: Number(pkgMonths) || 1,
        fee_amount: Number(pkgFee) || 0,
        description: pkgDesc.trim(),
        hide_fee: pkgHideFee,
        is_active: true
      };

      let updated;
      if (editingPkgId) {
        updated = packages.map(p => p.id === editingPkgId ? { ...p, ...payload } : p);
      } else {
        updated = [...packages, { ...payload, id: `pkg_${Date.now()}` }];
      }

      setPackages(updated);
      localStorage.setItem('cbq_parking_packages', JSON.stringify(updated));

      try {
        const { data: updateData, error: updateError } = await supabase
          .from('cbq_parking_packages')
          .update(payload)
          .eq('id', editingPkgId)
          .select();

        if (updateError || !updateData || updateData.length === 0) {
          await supabase.from('cbq_parking_packages').upsert([{
            ...payload
          }], { onConflict: 'package_key' });
        }
      } catch (dbErr) {
        console.warn("DB Upsert Fallback:", dbErr);
      }

      alert("🎉 ĐÃ LƯU CẤU HÌNH GÓI VÉ THÀNH CÔNG!");
      setShowPkgForm(false);
      setEditingPkgId(null);
    } catch (err) {
      console.warn("Lưu CSDL gói vé:", err);
    }
  };

  const handleEditPackage = (pkg) => {
    setEditingPkgId(pkg.id);
    setPkgKey(pkg.package_key || '');
    setPkgTitle(pkg.title || '');
    setPkgMonths(pkg.months_count || 1);
    setPkgFee(pkg.fee_amount || 0);
    setPkgDesc(pkg.description || '');
    setPkgHideFee(!!pkg.hide_fee);
    setShowPkgForm(true);
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói vé này?")) return;
    try {
      await supabase.from('cbq_parking_packages').delete().eq('id', id);
      setPackages(packages.filter(p => p.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  // Toggle Package Active Status
  const handleTogglePkgActive = async (pkg) => {
    try {
      await supabase.from('cbq_parking_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
      fetchData();
    } catch (err) {
      alert("Lỗi: " + err.message);
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

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lượt đăng ký xe này?")) return;
    try {
      await supabase.from('cbq_parking_registrations').delete().eq('id', id);
      setParkingList(parkingList.filter(i => i.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handlePrintCard = (item) => {
    setSelectedTicketToPrint(item);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <Layout title="Quản lý Xe máy Học sinh">
      <style>{`
        @media print {
          header, nav, sidebar, .no-print, .glass { display: none !important; }
          .printable-card { display: block !important; width: 100% !important; margin: 0 auto !important; }
        }
      `}</style>

      {/* PRINT MODAL CARD (Hidden during regular display, visible on print) */}
      {selectedTicketToPrint && (
        <div style={{ display: 'none' }} className="printable-card">
          <div style={styles.printTicketCard}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', color: '#be123c' }}>THẺ GỬI XE MÁY HỌC SINH</h3>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7' }}>MÃ: {selectedTicketToPrint.ticket_code}</div>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div><strong>Họ tên HS:</strong> {selectedTicketToPrint.student_name}</div>
              <div><strong>Lớp:</strong> {selectedTicketToPrint.student_class} ({selectedTicketToPrint.grade_level})</div>
              <div><strong>Biển số xe:</strong> <span style={{ fontSize: '15px', color: '#be123c', fontWeight: 'bold' }}>{selectedTicketToPrint.license_plate}</span></div>
              <div><strong>Loại xe:</strong> {selectedTicketToPrint.vehicle_type}</div>
              <div><strong>Thời hạn:</strong> Từ {selectedTicketToPrint.start_date} Đến {selectedTicketToPrint.end_date}</div>
            </div>
            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <QrCode size={48} color="#1e293b" />
              <div style={{ fontSize: '10px', textAlign: 'right', color: '#64748b' }}>Xác nhận Ban Bảo Vệ<br /><b>✓ Đã duyệt vé</b></div>
            </div>
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
                placeholder="Tìm theo Biển số xe (29B1-...), Họ tên học sinh, Lớp..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13.5px' }}
              />
            </div>

            <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Khối lớp</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>

            <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} style={styles.filterSelect}>
              <option value="ALL">Tất cả Gói thời hạn</option>
              <option value="month">Gói Theo Tháng</option>
              <option value="term">Gói Theo Học Kỳ</option>
              <option value="year">Gói Cả Năm</option>
            </select>
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
        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#be123c' }}>⚙️ Cấu Hình Gói Vé & Mức Phí Giữ Xe</h3>
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
                    {pkg.hide_fee ? '🟢 Miễn phí (Ẩn tiền)' : Number(pkg.fee_amount) === 0 ? '🟢 0 VNĐ (Miễn phí)' : `${(Number(pkg.fee_amount) || 0).toLocaleString()} VNĐ`}
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
