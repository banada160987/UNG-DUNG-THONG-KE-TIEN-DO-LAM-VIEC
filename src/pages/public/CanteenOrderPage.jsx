import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Utensils, ShoppingBag, Clock, Phone, MapPin, CheckCircle2, 
  AlertCircle, ChevronRight, Search, Plus, Minus, X, ArrowLeft, 
  CreditCard, Banknote, QrCode, FileText, Check, Coffee, Heart, 
  Sparkles, ShieldCheck, RefreshCw, Copy, Upload, Info
} from 'lucide-react';
import { 
  getCanteenConfig, 
  getMenuItems, 
  createCanteenOrder, 
  getAllCanteenOrders,
  generateVietQrUrl 
} from '../../services/canteenService';
import { getStudentSession, getTeacherSession } from '../../services/authSessionManager';

export default function CanteenOrderPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(() => getCanteenConfig());
  const [menuItems, setMenuItems] = useState(() => getMenuItems());
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchFood, setSearchFood] = useState('');
  
  // Cart state: { [foodId]: quantity }
  const [cart, setCart] = useState({});
  const [cartNotes, setCartNotes] = useState({});
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form checkout
  const [customerName, setCustomerName] = useState('');
  const [customerClass, setCustomerClass] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vietqr'); // 'vietqr' | 'cash'
  const [hasTransferred, setHasTransferred] = useState(false);
  const [paymentProofImage, setPaymentProofImage] = useState('');

  // Success state
  const [placedOrder, setPlacedOrder] = useState(null);

  // Tra cứu đơn hàng
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'lookup'
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState([]);

  // Tự động nạp thông tin nếu đã đăng nhập Học sinh hoặc Giáo viên
  useEffect(() => {
    const student = getStudentSession();
    if (student) {
      setCustomerName(student.full_name || student.name || '');
      setCustomerClass(student.class_name || student.class || '');
      setCustomerPhone(student.phone || '');
      return;
    }

    const teacher = getTeacherSession();
    if (teacher) {
      setCustomerName(teacher.full_name || teacher.name || '');
      setCustomerClass(teacher.department || 'Giáo viên');
      setCustomerPhone(teacher.phone || '');
    }
  }, []);

  // Lắng nghe cập nhật thực đơn hoặc cấu hình từ admin
  useEffect(() => {
    const handleMenuChange = () => setMenuItems(getMenuItems());
    const handleConfigChange = () => setConfig(getCanteenConfig());
    window.addEventListener('cbq-canteen-menu-changed', handleMenuChange);
    window.addEventListener('cbq-canteen-config-changed', handleConfigChange);
    return () => {
      window.removeEventListener('cbq-canteen-menu-changed', handleMenuChange);
      window.removeEventListener('cbq-canteen-config-changed', handleConfigChange);
    };
  }, []);

  // Danh mục món ăn
  const categories = useMemo(() => {
    const set = new Set(menuItems.map(m => m.category || 'Món khác'));
    return ['all', ...Array.from(set)];
  }, [menuItems]);

  // Lọc món ăn hiển thị
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (searchFood.trim()) {
        const q = searchFood.toLowerCase();
        return item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, activeCategory, searchFood]);

  // Thêm / bớt món trong giỏ hàng
  const handleUpdateQuantity = (foodId, delta) => {
    setCart(prev => {
      const current = prev[foodId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const nextState = { ...prev };
        delete nextState[foodId];
        return nextState;
      }
      return { ...prev, [foodId]: next };
    });
  };

  // Tính tổng số lượng và tổng tiền trong giỏ
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    const itemsList = [];

    Object.entries(cart).forEach(([foodId, qty]) => {
      const food = menuItems.find(m => m.id === foodId);
      if (food && qty > 0) {
        totalItems += qty;
        totalAmount += food.price * qty;
        itemsList.push({
          ...food,
          quantity: qty,
          note: cartNotes[foodId] || ''
        });
      }
    });

    return { totalItems, totalAmount, itemsList };
  }, [cart, cartNotes, menuItems]);

  // Đọc ảnh bill chuyển khoản (nếu học sinh có đính kèm)
  const handleImageProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPaymentProofImage(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Thực hiện đặt hàng
  const handleConfirmOrder = () => {
    if (!customerName.trim()) {
      alert("Vui lòng nhập Họ và Tên của bạn!");
      return;
    }
    if (!customerClass.trim()) {
      alert("Vui lòng nhập Lớp học (VD: 12A1) để cô Vân dễ phân loại!");
      return;
    }
    if (!customerPhone.trim()) {
      alert("Vui lòng nhập Số điện thoại liên hệ!");
      return;
    }
    if (cartSummary.totalItems === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder = createCanteenOrder({
        customerName: customerName.trim(),
        customerClass: customerClass.trim(),
        customerPhone: customerPhone.trim(),
        items: cartSummary.itemsList.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          unit: item.unit,
          quantity: item.quantity,
          note: item.note
        })),
        totalAmount: cartSummary.totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'vietqr' && hasTransferred ? 'paid' : 'pending',
        paymentNote: paymentMethod === 'vietqr' ? (hasTransferred ? 'Học sinh báo đã chuyển khoản' : 'Chờ xác nhận chuyển khoản') : 'Thanh toán tiền mặt khi nhận',
        paymentProofImage: paymentProofImage || '',
        orderNote: orderNote.trim()
      });

      setPlacedOrder(newOrder);
      setCart({});
      setCartNotes({});
      setShowCheckoutModal(false);
    } catch (err) {
      alert("Lỗi khi tạo đơn hàng: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tra cứu đơn hàng theo SĐT hoặc mã đơn
  const handleRunLookup = (e) => {
    e?.preventDefault();
    if (!lookupQuery.trim()) {
      alert("Vui lòng nhập Số điện thoại hoặc Mã đơn hàng để tra cứu!");
      return;
    }
    const all = getAllCanteenOrders();
    const q = lookupQuery.trim().toLowerCase();
    const found = all.filter(o => 
      o.customerPhone?.toLowerCase().includes(q) || 
      o.code?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q)
    );
    setLookupResults(found);
  };

  // Sao chép nội dung vào bộ nhớ tạm
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép ${label}: ${text}`);
  };

  // URL VietQR động theo đơn hàng
  const vietQrUrl = useMemo(() => {
    if (!config.bankAccount?.accountNumber) return '';
    return generateVietQrUrl({
      bankCode: config.bankAccount.bankCode,
      accountNumber: config.bankAccount.accountNumber,
      accountName: config.bankAccount.accountName,
      amount: cartSummary.totalAmount,
      memo: `CBQ FOOD ${customerClass ? customerClass.replace(/\s+/g, '') : ''} ${customerPhone ? customerPhone.slice(-4) : ''}`
    });
  }, [config, cartSummary.totalAmount, customerClass, customerPhone]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '"Inter", sans-serif', color: '#1e293b', paddingBottom: '100px' }}>
      
      {/* 1. TOP HEADER BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', color: '#ffffff', padding: '24px 20px', boxShadow: '0 4px 15px rgba(234, 88, 12, 0.25)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <Link
              to="/hub"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ffedd5',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                background: 'rgba(255,255,255,0.15)',
                padding: '6px 12px',
                borderRadius: '8px'
              }}
            >
              <ArrowLeft size={16} /> Tiện Ích Trường Học CBQ
            </Link>

            <Link
              to="/admin/cantin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                background: 'rgba(0,0,0,0.25)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
              title="Dành riêng cho Cô Lương Thị Hải Vân quản lý thực đơn và chốt đơn buổi sáng"
            >
              👩‍🍳 Quản Lý Bếp (Cô Vân)
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
              <Utensils size={30} color="#ea580c" />
            </div>

            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                {config.storeName}
              </h1>
              <div style={{ fontSize: '13.5px', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span>👩‍🍳 Phụ trách: <strong>{config.sellerName}</strong></span>
                <span>• 📍 {config.pickupLocation}</span>
                <span>• 📞 Zalo/SĐT: <strong>{config.phone}</strong></span>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(5px)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#fef08a" />
            <span>{config.announcement}</span>
          </div>

          {/* Time notice badge */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: '#ffffff', color: '#c2410c', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} /> Chốt đơn sáng: <strong>{config.cutoffTime}</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={14} /> Nhận đồ ăn: <strong>{config.pickupTimeWindow}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* 2. NAVIGATION TABS: Thực Đơn & Tra Cứu Đơn */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '10px', margin: '20px 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'menu' ? '#ea580c' : '#ffffff',
              color: activeTab === 'menu' ? '#ffffff' : '#64748b',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'menu' ? '0 2px 6px rgba(234,88,12,0.3)' : '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <Utensils size={16} /> 🍽️ Thực Đơn Hôm Nay
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'lookup' ? '#ea580c' : '#ffffff',
              color: activeTab === 'lookup' ? '#ffffff' : '#64748b',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'lookup' ? '0 2px 6px rgba(234,88,12,0.3)' : '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <Search size={16} /> 🔍 Tra Cứu Đơn Của Tôi
          </button>
        </div>

        {/* ==================== TAB 1: THỰC ĐƠN MÓN ĂN ==================== */}
        {activeTab === 'menu' && (
          <div>
            
            {/* Search & Categories Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '4px' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '20px',
                      border: activeCategory === cat ? '1px solid #ea580c' : '1px solid #cbd5e1',
                      background: activeCategory === cat ? '#fff7ed' : '#ffffff',
                      color: activeCategory === cat ? '#ea580c' : '#475569',
                      fontWeight: activeCategory === cat ? '800' : '600',
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    {cat === 'all' ? 'Tất cả món' : cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  placeholder="Tìm món ăn..."
                  value={searchFood}
                  onChange={e => setSearchFood(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    boxSizing: 'border-box'
                  }}
                />
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>

            </div>

            {/* Food Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {filteredItems.map(item => {
                const qtyInCart = cart[item.id] || 0;
                const remaining = Math.max(0, (item.dailyQuota || 50) - (item.soldCount || 0));
                const isSoldOut = remaining <= 0;
                const isAvailable = item.isActiveToday && !isSoldOut;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      opacity: isAvailable ? 1 : 0.65,
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Food Image */}
                    <div style={{ position: 'relative', height: '170px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />

                      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15,23,42,0.75)', color: '#ffffff', padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                        {item.category}
                      </div>

                      {!item.isActiveToday ? (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#dc2626', padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                          Tạm ngừng bán hôm nay
                        </div>
                      ) : isSoldOut ? (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#dc2626', padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                          Đã hết suất hôm nay
                        </div>
                      ) : (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#dcfce7', color: '#166534', padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                          Còn {remaining} {item.unit}
                        </div>
                      )}
                    </div>

                    {/* Food Content */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 6px 0', color: '#0f172a' }}>
                          {item.name}
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                          {item.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px dashed #f1f5f9', paddingTop: '10px' }}>
                        <div>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#ea580c' }}>
                            {item.price.toLocaleString('vi-VN')}đ
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>
                            / {item.unit || 'suất'}
                          </span>
                        </div>

                        {/* Add to cart / quantity controls */}
                        {isAvailable ? (
                          qtyInCart === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              style={{
                                padding: '7px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#ea580c',
                                color: '#ffffff',
                                fontWeight: '700',
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(234,88,12,0.25)'
                              }}
                            >
                              <Plus size={15} /> Thêm món
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff7ed', border: '1px solid #ffedd5', padding: '3px 6px', borderRadius: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#ea580c', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Minus size={13} />
                              </button>
                              <span style={{ fontWeight: '800', fontSize: '14px', color: '#ea580c', minWidth: '18px', textAlign: 'center' }}>
                                {qtyInCart}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#ea580c', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          )
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Không phục vụ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ==================== TAB 2: TRA CỨU ĐƠN CỦA TÔI ==================== */}
        {activeTab === 'lookup' && (
          <div style={{ maxWidth: '650px', margin: '0 auto', background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} color="#ea580c" /> Tra Cứu Tình Trạng Đơn Bữa Sáng
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Nhập Số điện thoại hoặc Mã đơn hàng của bạn (ví dụ: <code>BS-01</code>) để xem suất ăn đã chuẩn bị xong chưa nhé.
            </p>

            <form onSubmit={handleRunLookup} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Nhập SĐT hoặc Mã đơn..."
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              />
              <button
                type="submit"
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ea580c', color: '#ffffff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}
              >
                Tra cứu
              </button>
            </form>

            {lookupResults.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>
                  Tìm thấy {lookupResults.length} đơn hàng:
                </div>
                {lookupResults.map(ord => (
                  <div key={ord.id} style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '15px', color: '#ea580c' }}>Đơn #{ord.code}</strong>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: ord.orderStatus === 'ready' ? '#dcfce7' : ord.orderStatus === 'completed' ? '#e0e7ff' : '#fef3c7',
                        color: ord.orderStatus === 'ready' ? '#166534' : ord.orderStatus === 'completed' ? '#3730a3' : '#92400e'
                      }}>
                        {ord.orderStatus === 'ready' ? '🟢 Đã xong - Mời bạn ghé lấy' : 
                         ord.orderStatus === 'preparing' ? '🟡 Đang nấu / Đóng gói' : 
                         ord.orderStatus === 'completed' ? '🔵 Đã giao hoàn tất' : '⚪ Đã nhận đơn'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                      Người nhận: <strong>{ord.customerName}</strong> • Lớp: <strong>{ord.customerClass}</strong>
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '6px' }}>
                      Món: {ord.items?.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', fontSize: '12.5px' }}>
                      <span>Tổng tiền: <strong style={{ color: '#ea580c' }}>{ord.totalAmount?.toLocaleString('vi-VN')}đ</strong></span>
                      <span style={{ color: ord.paymentStatus === 'paid' ? '#166534' : '#c2410c', fontWeight: 'bold' }}>
                        {ord.paymentStatus === 'paid' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán (Thu khi nhận)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. FLOATING CART BAR (Thanh giỏ hàng nổi khi có món) */}
      {cartSummary.totalItems > 0 && !showCheckoutModal && !placedOrder && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          maxWidth: '800px',
          margin: '0 auto',
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                Đã chọn <strong>{cartSummary.totalItems} món</strong> ăn sáng
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#fba053' }}>
                {cartSummary.totalAmount.toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCheckoutModal(true)}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(234,88,12,0.4)'
            }}
          >
            Tiến Hành Đặt Món <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 4. MODAL THANH TOÁN & XÁC NHẬN ĐƠN HÀNG */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '680px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                  Xác Nhận Đặt Bữa Sáng
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  Điểm tâm học đường - Bếp Sáng Cô Lương Thị Hải Vân
                </div>
              </div>
              <button type="button" onClick={() => setShowCheckoutModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {/* Thông tin người đặt */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                1. Thông Tin Người Nhận Món:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Họ và Tên (*):</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Lớp Học / Bộ Phận (*):</label>
                  <input
                    type="text"
                    value={customerClass}
                    onChange={e => setCustomerClass(e.target.value)}
                    placeholder="VD: 12A1 hoặc Tổ Toán..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Số Điện Thoại (*):</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="VD: 0912345678..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Ghi Chú Đơn Hàng:</label>
                  <input
                    type="text"
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                    placeholder="VD: Không ớt, lấy lúc 6h40..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Chi tiết món đã chọn */}
            <div style={{ marginBottom: '18px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                2. Các Món Đã Chọn ({cartSummary.totalItems} món):
              </div>
              {cartSummary.itemsList.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #e2e8f0', fontSize: '13px' }}>
                  <div>
                    <strong>{item.name}</strong> <span style={{ color: '#ea580c', fontWeight: 'bold' }}>x{item.quantity}</span>
                  </div>
                  <strong>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '15px' }}>
                <strong>Tổng thanh toán:</strong>
                <strong style={{ fontSize: '18px', color: '#ea580c' }}>{cartSummary.totalAmount.toLocaleString('vi-VN')}đ</strong>
              </div>
            </div>

            {/* Chọn hình thức thanh toán */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                3. Chọn Hình Thức Thanh Toán:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: paymentMethod === 'vietqr' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                  background: paymentMethod === 'vietqr' ? '#fff7ed' : '#ffffff',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'vietqr'}
                    onChange={() => setPaymentMethod('vietqr')}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Chuyển khoản VietQR</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>Quét mã QR app ngân hàng</div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: paymentMethod === 'cash' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                  background: paymentMethod === 'cash' ? '#fff7ed' : '#ffffff',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Tiền mặt khi nhận</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>Trả trực tiếp cho cô Vân</div>
                  </div>
                </label>
              </div>

              {/* Nếu chọn chuyển khoản VietQR: Hiển thị mã QR tự động */}
              {paymentMethod === 'vietqr' && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                    Quét Mã VietQR Chuyển Khoản Cho Cô Vân:
                  </div>

                  {vietQrUrl && (
                    <img
                      src={vietQrUrl}
                      alt="VietQR Code"
                      style={{ width: '220px', height: '220px', margin: '0 auto', display: 'block', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                  )}

                  <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                    Ngân hàng: <strong>{config.bankAccount?.bankName}</strong><br/>
                    Số tài khoản: <strong style={{ color: '#0284c7' }}>{config.bankAccount?.accountNumber}</strong>{' '}
                    <button type="button" onClick={() => copyToClipboard(config.bankAccount?.accountNumber, 'Số tài khoản')} style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Copy</button><br/>
                    Chủ tài khoản: <strong>{config.bankAccount?.accountName}</strong><br/>
                    Số tiền: <strong style={{ color: '#ea580c', fontSize: '14px' }}>{cartSummary.totalAmount.toLocaleString('vi-VN')}đ</strong>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
                      <input
                        type="checkbox"
                        checked={hasTransferred}
                        onChange={e => setHasTransferred(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      Tôi đã hoàn tất chuyển khoản thành công
                    </label>

                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Upload size={14} /> Tải ảnh biên lai/chụp màn hình CK (tùy chọn):
                        <input type="file" accept="image/*" onChange={handleImageProofChange} style={{ display: 'none' }} />
                      </label>
                      {paymentProofImage && (
                        <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>
                          ✓ Đã đính kèm ảnh biên lai chuyển khoản
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                Quay lại
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(234,88,12,0.4)'
                }}
              >
                {isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Xác Nhận Đặt Bữa Sáng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL ĐẶT HÀNG THÀNH CÔNG (PHIẾU NHẬN ĐỒ ĂN) */}
      {placedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
            
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0', color: '#0f172a' }}>
              Đặt Bữa Sáng Thành Công!
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Đơn hàng của bạn đã được chuyển tới Bếp của Cô Vân.
            </p>

            {/* Ticket Card */}
            <div style={{ background: '#fff7ed', borderRadius: '16px', border: '2px dashed #fdba74', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #fdba74', paddingBottom: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#9a3412', fontWeight: 'bold' }}>MÃ NHẬN MÓN:</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#ea580c' }}>
                  #{placedOrder.code}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                <div>Người nhận: <strong>{placedOrder.customerName}</strong></div>
                <div>Lớp: <strong>{placedOrder.customerClass}</strong> • SĐT: <strong>{placedOrder.customerPhone}</strong></div>
                <div style={{ margin: '6px 0', borderTop: '1px solid #fed7aa', paddingTop: '6px' }}>
                  {placedOrder.items?.map(it => (
                    <div key={it.id}>• {it.name} <strong style={{ color: '#ea580c' }}>x{it.quantity}</strong></div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid #fed7aa', paddingTop: '6px' }}>
                  <span>Tổng tiền:</span>
                  <strong style={{ color: '#ea580c', fontSize: '15px' }}>{placedOrder.totalAmount?.toLocaleString('vi-VN')}đ</strong>
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px' }}>
                  Thanh toán: <strong style={{ color: placedOrder.paymentStatus === 'paid' ? '#166534' : '#c2410c' }}>
                    {placedOrder.paymentStatus === 'paid' ? '✓ Đã thanh toán (Chuyển khoản)' : '⏳ Thu tiền mặt khi nhận'}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', color: '#166534', marginBottom: '20px', textAlign: 'left', lineHeight: 1.5 }}>
              💡 <strong>Cách nhận đồ ăn:</strong><br/>
              Sáng mai từ <strong>06h35 đến 06h55</strong>, bạn đến <strong>{config.pickupLocation}</strong> đọc mã <strong>#{placedOrder.code}</strong> hoặc tên để nhận suất ăn nóng hổi nhé!
            </div>

            <button
              type="button"
              onClick={() => setPlacedOrder(null)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                background: '#ea580c',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Hoàn Tất & Về Thực Đơn
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
