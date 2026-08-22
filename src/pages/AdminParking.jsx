import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Bike, Search, Printer, Download, Plus, CheckCircle2, AlertCircle, Clock, Trash2, Edit3, Eye, QrCode } from 'lucide-react';
import * as XLSX from 'xlsx';

const DEFAULT_PARKING_LIST = [
  { id: '1', ticket_code: 'PARK-11A1-001', student_name: 'Nguyễn Văn An', student_code: 'HS11A1-01', student_class: '11A1', grade_level: 'Khối 11', license_plate: '29B1-567.89', vehicle_type: 'Xe máy điện', vehicle_color: 'Đen nhám', package_type: 'term', start_date: '2026-09-01', end_date: '2027-01-15', fee_amount: 200000, status: 'active' },
  { id: '2', ticket_code: 'PARK-12A3-002', student_name: 'Trần Thị Bích', student_code: 'HS12A3-05', student_class: '12A3', grade_level: 'Khối 12', license_plate: '29H1-888.66', vehicle_type: 'Xe máy 50cc', vehicle_color: 'Trắng đỏ', package_type: 'year', start_date: '2026-09-01', end_date: '2027-05-31', fee_amount: 450000, status: 'active' },
  { id: '3', ticket_code: 'PARK-10A2-003', student_name: 'Phạm Minh Cường', student_code: 'HS10A2-12', student_class: '10A2', grade_level: 'Khối 10', license_plate: '29K1-345.12', vehicle_type: 'Xe máy điện', vehicle_color: 'Xanh dương', package_type: 'month', start_date: '2026-09-01', end_date: '2026-09-30', fee_amount: 50000, status: 'active' }
];

export default function AdminParking() {
  const [parkingList, setParkingList] = useState(DEFAULT_PARKING_LIST);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedPackage, setSelectedPackage] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTicketToPrint, setSelectedTicketToPrint] = useState(null);

  useEffect(() => {
    fetchParkingData();
  }, []);

  async function fetchParkingData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_parking_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setParkingList(data);
      }
    } catch (err) {
      console.warn("Dùng dữ liệu danh sách xe mẫu:", err);
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
      "Trạng Thái": item.status === 'active' ? 'Đang hoạt động' : 'Hết hạn'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachXeMáy");
    XLSX.writeFile(workbook, `Danh_Sach_Xe_May_Hoc_Sinh_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lượt đăng ký xe này?")) return;
    try {
      const { error } = await supabase.from('cbq_parking_registrations').delete().eq('id', id);
      if (error) throw error;
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
            Thống kê số lượng, theo dõi đăng ký biển số xe, in thẻ gửi xe và quản lý thời hạn
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

      {/* STATISTICS CARDS (PANEL) */}
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
          <div style={styles.statLabel}>TỔNG LỆ PHÍ THU DỰ KIẾN</div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#be123c', marginTop: '4px' }}>
            {stats.totalFees.toLocaleString()} <span style={{ fontSize: '13px' }}>VNĐ</span>
          </div>
          <div style={styles.statSub}>Đã nộp cho Ban Bảo vệ</div>
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
                        <button type="button" onClick={() => handleDeleteItem(item.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      Chưa có dữ liệu xe máy học sinh phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
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
  printTicketCard: {
    maxWidth: '350px',
    border: '2px dashed #be123c',
    borderRadius: '12px',
    padding: '16px',
    backgroundColor: '#ffffff'
  }
};
