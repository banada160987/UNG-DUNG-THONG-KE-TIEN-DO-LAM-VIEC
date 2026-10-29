import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Utensils, ShoppingBag, Clock, Phone, MapPin, CheckCircle2, 
  AlertCircle, ChevronRight, Search, Plus, Trash2, Edit3, X, 
  ArrowLeft, CreditCard, Banknote, QrCode, FileText, Check, 
  Coffee, Heart, Sparkles, ShieldCheck, RefreshCw, Eye, Download,
  Layers, Settings, ToggleLeft, ToggleRight, DollarSign, Filter,
  Users, CheckSquare, Printer
} from 'lucide-react';
import { 
  getCanteenConfig, 
  saveCanteenConfig, 
  getMenuItems, 
  saveMenuItems, 
  upsertMenuItem, 
  deleteMenuItem, 
  toggleItemActiveToday,
  getAllCanteenOrders, 
  saveAllCanteenOrders, 
  updateOrderStatus, 
  updatePaymentStatus, 
  cancelCanteenOrder,
  getKitchenSummaryToday,
  POPULAR_BANKS,
  generateVietQrUrl 
} from '../../services/canteenService';

export default function AdminCanteenManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'kitchen' | 'menu' | 'settings'

  // Service States
  const [config, setConfig] = useState(() => getCanteenConfig());
  const [menuItems, setMenuItems] = useState(() => getMenuItems());
  const [orders, setOrders] = useState(() => getAllCanteenOrders());
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters for orders
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterOrderStatus, setFilterOrderStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Sửa/Thêm Món Ăn
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Bánh mì');
  const [itemPrice, setItemPrice] = useState(15000);
  const [itemUnit, setItemUnit] = useState('ổ');
  const [itemImage, setItemImage] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemDailyQuota, setItemDailyQuota] = useState(50);
  const [itemIsActive, setItemIsActive] = useState(true);

  // Modal Xem ảnh bill chuyển khoản
  const [viewProofImage, setViewProofImage] = useState(null);

  // Lắng nghe cập nhật
  useEffect(() => {
    setConfig(getCanteenConfig());
    setMenuItems(getMenuItems());
    setOrders(getAllCanteenOrders());
  }, [refreshKey]);

  // Thống kê bếp và tài chính hôm nay
  const kitchenSummary = useMemo(() => {
    return getKitchenSummaryToday();
  }, [orders, refreshKey]);

  // Danh sách các lớp học có đơn
  const availableClasses = useMemo(() => {
    const set = new Set(orders.map(o => o.customerClass).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [orders]);

  // Lọc danh sách đơn hàng
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      // Lọc ngày
      if (filterDate && ord.createdAt && !ord.createdAt.startsWith(filterDate)) {
        return false;
      }
      // Lọc trạng thái chế biến
      if (filterOrderStatus !== 'all' && ord.orderStatus !== filterOrderStatus) {
        return false;
      }
      // Lọc trạng thái thanh toán
      if (filterPaymentStatus !== 'all' && ord.paymentStatus !== filterPaymentStatus) {
        return false;
      }
      // Lọc phương thức thanh toán
      if (filterPaymentMethod !== 'all' && ord.paymentMethod !== filterPaymentMethod) {
        return false;
      }
      // Lọc lớp
      if (filterClass !== 'all' && ord.customerClass !== filterClass) {
        return false;
      }
      // Tìm kiếm text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inCode = ord.code?.toLowerCase().includes(q);
        const inName = ord.customerName?.toLowerCase().includes(q);
        const inPhone = ord.customerPhone?.toLowerCase().includes(q);
        const inClass = ord.customerClass?.toLowerCase().includes(q);
        if (!inCode && !inName && !inPhone && !inClass) return false;
      }
      return true;
    });
  }, [orders, filterDate, filterOrderStatus, filterPaymentStatus, filterPaymentMethod, filterClass, searchQuery]);

  // Hành động xác nhận chuyển khoản
  const handleConfirmTransfer = (orderId) => {
    updatePaymentStatus(orderId, 'paid', 'Cô Vân đã xác nhận nhận đủ tiền chuyển khoản');
    setRefreshKey(k => k + 1);
  };

  // Hành động xác nhận thu tiền mặt
  const handleConfirmCash = (orderId) => {
    updatePaymentStatus(orderId, 'paid', 'Đã thu tiền mặt trực tiếp khi giao đồ ăn');
    setRefreshKey(k => k + 1);
  };

  // Hành động chuyển trạng thái đơn (Chờ làm -> Đang nấu -> Sẵn sàng lấy -> Đã giao)
  const handleChangeOrderStatus = (orderId, nextStatus) => {
    updateOrderStatus(orderId, nextStatus);
    setRefreshKey(k => k + 1);
  };

  // Mở modal thêm món mới
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('Bánh mì');
    setItemPrice(15000);
    setItemUnit('ổ');
    setItemImage('https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80');
    setItemDescription('');
    setItemDailyQuota(50);
    setItemIsActive(true);
    setShowItemModal(true);
  };

  // Mở modal sửa món
  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemName(item.name || '');
    setItemCategory(item.category || 'Bánh mì');
    setItemPrice(item.price || 15000);
    setItemUnit(item.unit || 'ổ');
    setItemImage(item.image || '');
    setItemDescription(item.description || '');
    setItemDailyQuota(item.dailyQuota || 50);
    setItemIsActive(item.isActiveToday ?? true);
    setShowItemModal(true);
  };

  // Lưu món ăn
  const handleSaveItem = () => {
    if (!itemName.trim()) {
      alert("Vui lòng nhập tên món ăn!");
      return;
    }
    upsertMenuItem({
      id: editingItem?.id,
      name: itemName.trim(),
      category: itemCategory,
      price: Number(itemPrice) || 0,
      unit: itemUnit.trim() || 'phần',
      image: itemImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: itemDescription.trim(),
      dailyQuota: Number(itemDailyQuota) || 50,
      isActiveToday: Boolean(itemIsActive)
    });
    setShowItemModal(false);
    setRefreshKey(k => k + 1);
  };

  // Bật/tắt bán món hôm nay
  const handleToggleItemActive = (id) => {
    toggleItemActiveToday(id);
    setRefreshKey(k => k + 1);
  };

  // Xóa món
  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn xóa món "${name}" khỏi thực đơn?`)) {
      deleteMenuItem(id);
      setRefreshKey(k => k + 1);
    }
  };

  // Lưu cài đặt cửa hàng & tài khoản ngân hàng
  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveCanteenConfig(config);
    alert("🎉 Đã lưu thành công cấu hình Bếp Sáng & Thông tin ngân hàng của Cô Vân!");
    setRefreshKey(k => k + 1);
  };

  // Xuất file Excel danh sách đơn hàng tuân thủ quy tắc tiền tố 1-... trong GEMINI.md
  const handleExportOrdersExcel = () => {
    if (filteredOrders.length === 0) {
      alert("Không có đơn hàng nào trong bộ lọc để xuất Excel!");
      return;
    }

    const excelRows = filteredOrders.map((ord, idx) => ({
      "STT": idx + 1,
      "Mã đơn": ord.code,
      "Thời gian đặt": new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      "Họ và Tên": ord.customerName,
      "Lớp / Phòng ban": ord.customerClass,
      "Số điện thoại": ord.customerPhone,
      "Món đã đặt": ord.items?.map(it => `${it.name} (x${it.quantity})`).join('; '),
      "Tổng tiền (VNĐ)": ord.totalAmount,
      "Hình thức thanh toán": ord.paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Tiền mặt',
      "Trạng thái thanh toán": ord.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán (Chờ thu)',
      "Trạng thái giao hàng": ord.orderStatus === 'completed' ? 'Đã giao xong' : ord.orderStatus === 'ready' ? 'Đã xong chờ lấy' : ord.orderStatus === 'preparing' ? 'Đang chuẩn bị' : 'Đã nhận đơn',
      "Ghi chú khách hàng": ord.orderNote || ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách đơn ăn sáng");

    const cleanDate = filterDate.replace(/-/g, '_');
    const fileName = `1-Danh_sach_don_an_sang_ngay_${cleanDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
      {/* 1. TOP HEADER NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <ArrowLeft size={16} /> Trang Quản Trị Trường
          </button>
          
          <h1 style={{ fontSize: '21px', fontWeight: '900', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils color="#ea580c" size={24} /> Bảng Điều Phối Bếp Sáng CBQ (Cô Lương Thị Hải Vân)
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/bep-sang"
            target="_blank"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #ea580c',
              background: '#fff7ed',
              color: '#ea580c',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🍽️ Xem Cổng Đặt Món Học Sinh ↗
          </Link>
          
          <button
            type="button"
            onClick={handleExportOrdersExcel}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(22,163,74,0.3)'
            }}
            title="Xuất danh sách đơn đặt món sang file Excel tuân thủ quy tắc 1-..."
          >
            <Download size={15} /> Xuất Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS (Thống Kê Tài Chính & Bếp Hôm Nay) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #fed7aa', boxShadow: '0 2px 6px rgba(234,88,12,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9a3412' }}>DOANH THU SÁNG NAY</span>
            <DollarSign size={18} color="#ea580c" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ea580c' }}>
            {kitchenSummary.finances.totalRevenue.toLocaleString('vi-VN')}đ
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
            Tổng số: <strong>{kitchenSummary.activeOrdersCount} đơn hàng</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #bbf7d0', boxShadow: '0 2px 6px rgba(22,163,74,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>ĐÃ THU CHUYỂN KHOẢN</span>
            <CreditCard size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#16a34a' }}>
            {kitchenSummary.finances.transferPaidAmount.toLocaleString('vi-VN')}đ
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
            VietQR về thẳng tài khoản cô Vân
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #bae6fd', boxShadow: '0 2px 6px rgba(2,132,199,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1' }}>ĐÃ THU TIỀN MẶT</span>
            <Banknote size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7' }}>
            {kitchenSummary.finances.cashPaidAmount.toLocaleString('vi-VN')}đ
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
            Tiền mặt đã nhận trực tiếp
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #fecaca', boxShadow: '0 2px 6px rgba(220,38,38,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#991b1b' }}>CHỜ THU / CẦN THU</span>
            <AlertCircle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#dc2626' }}>
            {kitchenSummary.finances.totalPending.toLocaleString('vi-VN')}đ
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
            Cần thu khi học sinh đến nhận món
          </div>
        </div>

      </div>

      {/* 3. TABS CHỨC NĂNG */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '3px solid #ea580c' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'orders' ? '#ea580c' : '#64748b',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShoppingBag size={17} /> 📋 Đơn Hàng & Thu Tiền ({orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kitchen')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'kitchen' ? '3px solid #ea580c' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'kitchen' ? '#ea580c' : '#64748b',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Utensils size={17} /> 🍳 Bảng Chuẩn Bị Bếp ({kitchenSummary.itemsSummary.length} món)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'menu' ? '3px solid #ea580c' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'menu' ? '#ea580c' : '#64748b',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Layers size={17} /> 🍱 Quản Lý Thực Đơn & Giá ({menuItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '3px solid #ea580c' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'settings' ? '#ea580c' : '#64748b',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Settings size={17} /> ⚙️ Cài Đặt Ngân Hàng & Giờ Chốt
        </button>
      </div>

      {/* ==================== TAB 1: ĐƠN HÀNG & THU TIỀN ==================== */}
      {activeTab === 'orders' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <input
                type="text"
                placeholder="Tìm mã đơn, tên, SĐT, lớp..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
              />
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>Ngày:</span>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
              />
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>Lớp:</span>
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
              >
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls === 'all' ? 'Tất cả lớp' : cls}</option>
                ))}
              </select>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>Tiến độ:</span>
              <select
                value={filterOrderStatus}
                onChange={e => setFilterOrderStatus(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
              >
                <option value="all">Mọi tiến độ</option>
                <option value="confirmed">Đã nhận đơn</option>
                <option value="preparing">Đang nấu / đóng gói</option>
                <option value="ready">Đã xong - Chờ lấy</option>
                <option value="completed">Đã giao hoàn tất</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>Thanh toán:</span>
              <select
                value={filterPaymentStatus}
                onChange={e => setFilterPaymentStatus(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
              >
                <option value="all">Mọi trạng thái thanh toán</option>
                <option value="paid">✅ Đã thanh toán</option>
                <option value="pending">⏳ Chưa thanh toán (Chờ thu)</option>
              </select>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>Hình thức:</span>
              <select
                value={filterPaymentMethod}
                onChange={e => setFilterPaymentMethod(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
              >
                <option value="all">Mọi hình thức</option>
                <option value="vietqr">Chuyển khoản VietQR</option>
                <option value="cash">Tiền mặt</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px', width: '70px' }}>Mã Đơn</th>
                  <th style={{ padding: '10px' }}>Người Nhận & Lớp</th>
                  <th style={{ padding: '10px' }}>Món Đặt</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Tổng Tiền</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Thanh Toán</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Tiến Độ Làm</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Thao Tác Nhanh</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(ord => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      
                      {/* Mã đơn */}
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#ea580c' }}>
                          #{ord.code}
                        </span>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Người nhận */}
                      <td style={{ padding: '10px' }}>
                        <strong style={{ color: '#0f172a' }}>{ord.customerName}</strong>
                        <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold' }}>
                          Lớp: {ord.customerClass}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          📞 {ord.customerPhone}
                        </div>
                      </td>

                      {/* Món đặt & ghi chú */}
                      <td style={{ padding: '10px' }}>
                        {ord.items?.map(it => (
                          <div key={it.id} style={{ fontSize: '12.5px', marginBottom: '2px' }}>
                            • <strong>{it.name}</strong> <span style={{ color: '#ea580c', fontWeight: 'bold' }}>x{it.quantity}</span>
                            {it.note && <span style={{ color: '#9333ea', fontStyle: 'italic', fontSize: '11.5px' }}> ({it.note})</span>}
                          </div>
                        ))}
                        {ord.orderNote && (
                          <div style={{ fontSize: '11.5px', color: '#d97706', fontStyle: 'italic', marginTop: '3px' }}>
                            💬 Ghi chú: {ord.orderNote}
                          </div>
                        )}
                      </td>

                      {/* Tổng tiền */}
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                          {ord.totalAmount?.toLocaleString('vi-VN')}đ
                        </strong>
                      </td>

                      {/* Trạng thái thanh toán & Xác nhận chuyển khoản */}
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          background: ord.paymentStatus === 'paid' ? '#dcfce7' : '#fee2e2',
                          color: ord.paymentStatus === 'paid' ? '#166534' : '#dc2626',
                          marginBottom: '4px'
                        }}>
                          {ord.paymentStatus === 'paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {ord.paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Tiền mặt'}
                        </div>

                        {/* Nút xem ảnh bill nếu có */}
                        {ord.paymentProofImage && (
                          <button
                            type="button"
                            onClick={() => setViewProofImage(ord.paymentProofImage)}
                            style={{ border: 'none', background: 'none', color: '#0284c7', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', display: 'block', margin: '2px auto 0 auto' }}
                          >
                            👁️ Xem ảnh bill CK
                          </button>
                        )}

                        {/* Nút xác nhận thanh toán nếu chưa thanh toán */}
                        {ord.paymentStatus !== 'paid' && (
                          <div style={{ marginTop: '4px' }}>
                            {ord.paymentMethod === 'vietqr' ? (
                              <button
                                type="button"
                                onClick={() => handleConfirmTransfer(ord.id)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                                title="Bấm để xác nhận cô Vân đã nhận được tiền chuyển khoản"
                              >
                                ✓ Nhận Tiền CK
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleConfirmCash(ord.id)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                                title="Bấm khi học sinh đã đưa tiền mặt"
                              >
                                💵 Thu Tiền Mặt
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Tiến độ chế biến */}
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <select
                          value={ord.orderStatus}
                          onChange={e => handleChangeOrderStatus(ord.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: ord.orderStatus === 'ready' ? '#166534' : ord.orderStatus === 'completed' ? '#3730a3' : '#b45309',
                            background: ord.orderStatus === 'ready' ? '#f0fdf4' : ord.orderStatus === 'completed' ? '#eef2ff' : '#ffffff'
                          }}
                        >
                          <option value="confirmed">Đã nhận đơn</option>
                          <option value="preparing">Đang chuẩn bị</option>
                          <option value="ready">Đã xong - Chờ lấy</option>
                          <option value="completed">Đã giao xong</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>

                      {/* Nút hành động nhanh 1-chạm */}
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {ord.orderStatus !== 'ready' && ord.orderStatus !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleChangeOrderStatus(ord.id, 'ready')}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                              title="Báo món đã nấu xong, sẵn sàng để học sinh lấy"
                            >
                              Xong món
                            </button>
                          )}

                          {ord.orderStatus === 'ready' && (
                            <button
                              type="button"
                              onClick={() => handleChangeOrderStatus(ord.id, 'completed')}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                              title="Báo đã giao cho học sinh"
                            >
                              Đã giao
                            </button>
                          )}

                          {ord.orderStatus !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hủy đơn #${ord.code} của ${ord.customerName}?`)) {
                                  cancelCanteenOrder(ord.id, 'Cô Vân hủy');
                                  setRefreshKey(k => k + 1);
                                }
                              }}
                              style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}
                              title="Hủy đơn"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ==================== TAB 2: BẢNG CHUẨN BỊ BẾP (KITCHEN SUMMARY) ==================== */}
      {activeTab === 'kitchen' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Cột Trái: Tổng số lượng từng món cần làm */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Utensils color="#ea580c" size={20} /> Tổng Số Lượng Suất Cần Nấu Sáng Nay
            </h3>

            {kitchenSummary.itemsSummary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Chưa có đơn hàng nào sáng nay.
              </div>
            ) : (
              <div>
                {kitchenSummary.itemsSummary.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                      {item.name}
                    </span>
                    <div>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#ea580c' }}>
                        {item.quantity}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                        {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cột Phải: Gom đơn theo từng Lớp Học */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users color="#0284c7" size={20} /> Gom Đơn Theo Từng Lớp Học (Tiện Đóng Gói)
            </h3>

            {kitchenSummary.classSummary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Chưa có đơn hàng nào sáng nay.
              </div>
            ) : (
              <div>
                {kitchenSummary.classSummary.map((grp, idx) => (
                  <div key={idx} style={{ padding: '12px 14px', borderRadius: '10px', background: '#f0f9ff', marginBottom: '10px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '15px', color: '#0369a1' }}>
                        🏫 Lớp {grp.className} ({grp.orders.length} đơn • {grp.totalItems} phần)
                      </strong>
                      <strong style={{ fontSize: '14px', color: '#ea580c' }}>
                        {grp.totalAmount.toLocaleString('vi-VN')}đ
                      </strong>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      Học sinh: {grp.orders.map(o => `${o.customerName} (#${o.code})`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================== TAB 3: QUẢN LÝ THỰC ĐƠN & GIÁ CẢ ==================== */}
      {activeTab === 'menu' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: '#0f172a' }}>
                Danh Sách Món Ăn Bếp Sáng
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Cô Vân có thể bật/tắt bán từng món theo ngày, thay đổi giá tiền và giới hạn số suất.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddItem}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#ea580c',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} /> Thêm Món Mới
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {menuItems.map(item => (
              <div
                key={item.id}
                style={{
                  borderRadius: '12px',
                  border: item.isActiveToday ? '1.5px solid #fed7aa' : '1px solid #e2e8f0',
                  background: item.isActiveToday ? '#ffffff' : '#f8fafc',
                  padding: '14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  opacity: item.isActiveToday ? 1 : 0.65
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </h4>
                  </div>
                  
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#ea580c' }}>
                    {item.price.toLocaleString('vi-VN')}đ <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>/ {item.unit}</span>
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Hôm nay giới hạn: <strong>{item.dailyQuota || 50} suất</strong>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleItemActive(item.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: item.isActiveToday ? '#dcfce7' : '#fee2e2',
                        color: item.isActiveToday ? '#166534' : '#dc2626',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {item.isActiveToday ? '🟢 Đang bán' : '⚪ Đã tắt'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditItem(item)}
                      style={{ border: 'none', background: 'none', color: '#0284c7', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      style={{ border: 'none', background: 'none', color: '#dc2626', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: CÀI ĐẶT NGÂN HÀNG & GIỜ CHỐT ==================== */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '650px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings color="#ea580c" size={20} /> Cài Đặt Thông Tin Bếp Sáng & Tài Khoản Ngân Hàng
          </h3>

          <form onSubmit={handleSaveConfig}>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Tên Điểm Bán / Tiêu Đề:
              </label>
              <input
                type="text"
                value={config.storeName}
                onChange={e => setConfig({ ...config, storeName: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Người Phụ Trách:
                </label>
                <input
                  type="text"
                  value={config.sellerName}
                  onChange={e => setConfig({ ...config, sellerName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Số Điện Thoại / Zalo:
                </label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={e => setConfig({ ...config, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Giờ Chốt Đơn Buổi Sáng:
                </label>
                <input
                  type="time"
                  value={config.cutoffTime}
                  onChange={e => setConfig({ ...config, cutoffTime: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Khung Giờ Nhận Món:
                </label>
                <input
                  type="text"
                  value={config.pickupTimeWindow}
                  onChange={e => setConfig({ ...config, pickupTimeWindow: e.target.value })}
                  placeholder="06:35 - 06:55..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Địa Điểm Nhận Đồ Ăn:
              </label>
              <input
                type="text"
                value={config.pickupLocation}
                onChange={e => setConfig({ ...config, pickupLocation: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Cài đặt tài khoản ngân hàng VietQR */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>
                💳 Tài Khoản Ngân Hàng Nhận Tiền Chuyển Khoản (VietQR):
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '3px' }}>Ngân Hàng:</label>
                <select
                  value={config.bankAccount?.bankCode}
                  onChange={e => {
                    const found = POPULAR_BANKS.find(b => b.code === e.target.value);
                    setConfig({
                      ...config,
                      bankAccount: {
                        ...config.bankAccount,
                        bankCode: e.target.value,
                        bankName: found?.name || e.target.value
                      }
                    });
                  }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {POPULAR_BANKS.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '3px' }}>Số Tài Khoản (*):</label>
                  <input
                    type="text"
                    value={config.bankAccount?.accountNumber}
                    onChange={e => setConfig({
                      ...config,
                      bankAccount: { ...config.bankAccount, accountNumber: e.target.value }
                    })}
                    placeholder="VD: 0984123456..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '3px' }}>Tên Chủ Tài Khoản (*):</label>
                  <input
                    type="text"
                    value={config.bankAccount?.accountName}
                    onChange={e => setConfig({
                      ...config,
                      bankAccount: { ...config.bankAccount, accountName: e.target.value.toUpperCase() }
                    })}
                    placeholder="LUONG THI HAI VAN"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Thông Báo / Lời Chúc Gửi Học Sinh:
              </label>
              <textarea
                rows={3}
                value={config.announcement}
                onChange={e => setConfig({ ...config, announcement: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ea580c',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Lưu Thay Đổi
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL: THÊM / SỬA MÓN ĂN */}
      {showItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                {editingItem ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
              </h3>
              <button type="button" onClick={() => setShowItemModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Tên Món Ăn (*):</label>
              <input
                type="text"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="VD: Bánh mì pate chả lụa..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Danh Mục:</label>
                <select
                  value={itemCategory}
                  onChange={e => setItemCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="Bánh mì">Bánh mì</option>
                  <option value="Xôi sáng">Xôi sáng</option>
                  <option value="Bánh bao">Bánh bao</option>
                  <option value="Bún & Phở">Bún & Phở</option>
                  <option value="Đồ uống & Tráng miệng">Đồ uống & Tráng miệng</option>
                  <option value="Món khác">Món khác</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Đơn Vị Tính:</label>
                <input
                  type="text"
                  value={itemUnit}
                  onChange={e => setItemUnit(e.target.value)}
                  placeholder="ổ, hộp, ly, tô..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Đơn Giá (VNĐ) (*):</label>
                <input
                  type="number"
                  step="1000"
                  value={itemPrice}
                  onChange={e => setItemPrice(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontWeight: 'bold', color: '#ea580c' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Giới Hạn Suất Hôm Nay:</label>
                <input
                  type="number"
                  value={itemDailyQuota}
                  onChange={e => setItemDailyQuota(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Link Ảnh Món Ăn:</label>
              <input
                type="text"
                value={itemImage}
                onChange={e => setItemImage(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Mô Tả Nguyên Liệu / Hương Vị:</label>
              <textarea
                rows={2}
                value={itemDescription}
                onChange={e => setItemDescription(e.target.value)}
                placeholder="Thành phần hấp dẫn..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
                <input
                  type="checkbox"
                  checked={itemIsActive}
                  onChange={e => setItemIsActive(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                Bật bán món này hôm nay
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowItemModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
              <button type="button" onClick={handleSaveItem} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#ea580c', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>Lưu Món</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: XEM ẢNH BIÊN LAI CHUYỂN KHOẢN */}
      {viewProofImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '20px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Biên Lai / Ảnh Chuyển Khoản Của Học Sinh</h4>
            <img src={viewProofImage} alt="Biên lai" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '10px', display: 'block', margin: '0 auto' }} />
            <button
              type="button"
              onClick={() => setViewProofImage(null)}
              style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
