/**
 * Dịch Vụ Căn Tin Học Đường & Bếp Sáng CBQ
 * Trường THPT Cao Bá Quát - Cư M'gar, Đắk Lắk
 * 
 * Phụ trách vận hành: Cô Lương Thị Hải Vân (Bộ phận Văn thư)
 * Hỗ trợ học sinh và cán bộ giáo viên đặt đồ ăn sáng dinh dưỡng, an toàn trước giờ vào lớp.
 */

const STORAGE_KEY_CONFIG = 'cbq_canteen_config';
const STORAGE_KEY_MENU = 'cbq_canteen_menu';
const STORAGE_KEY_ORDERS = 'cbq_canteen_orders';

// Danh sách ngân hàng phổ biến tại Việt Nam hỗ trợ VietQR
export const POPULAR_BANKS = [
  { code: 'MB', name: 'MBBank (Quân Đội)', bin: '970422' },
  { code: 'VCB', name: 'Vietcombank (Ngoại Thương)', bin: '970436' },
  { code: 'VBA', name: 'Agribank (Nông Nghiệp)', bin: '970405' },
  { code: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển)', bin: '970418' },
  { code: 'CTG', name: 'VietinBank (Công Thương)', bin: '970415' },
  { code: 'TCB', name: 'Techcombank (Kỹ Thương)', bin: '970407' },
  { code: 'ACB', name: 'ACB (Á Châu)', bin: '970416' },
  { code: 'VPB', name: 'VPBank (Thịnh Vượng)', bin: '970432' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)', bin: '970423' },
  { code: 'LPB', name: 'LPBank (Lộc Phát)', bin: '970449' }
];

// Cấu hình mặc định của Bếp sáng
const DEFAULT_CONFIG = {
  storeName: 'Bếp Sáng CBQ - Điểm Tâm Học Đường',
  sellerName: 'Cô Lương Thị Hải Vân',
  sellerRole: 'Bộ phận Văn thư - Trường THPT Cao Bá Quát',
  phone: '0984.xxx.xxx',
  pickupLocation: 'Phòng Văn thư (Tầng 1 - Khu Hiệu Bộ)',
  isOpen: true,
  cutoffTime: '06:30', // Giờ chốt đơn sáng hàng ngày
  pickupTimeWindow: '06:35 - 06:55 (Trước giờ truy bài)',
  bankAccount: {
    bankCode: 'MB',
    bankName: 'MBBank (Quân Đội)',
    accountNumber: '0984123456',
    accountName: 'LUONG THI HAI VAN'
  },
  announcement: '🌟 Chào mừng các em học sinh và quý Thầy/Cô đến với Bếp Sáng CBQ! Vui lòng đặt món trước 06h30 để cô chuẩn bị chu đáo và nóng hổi nhất nhé!'
};

// Thực đơn món ăn sáng mẫu phong phú
const INITIAL_MENU_ITEMS = [
  {
    id: 'food_01',
    name: 'Bánh mì xíu mại pate đặc biệt',
    category: 'Bánh mì',
    price: 15000,
    unit: 'ổ',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
    description: 'Bánh mì giòn rụm kẹp xíu mại thịt sốt cà chua, pate gan béo ngậy, dưa leo, ngò rí và đồ chua.',
    isActiveToday: true,
    dailyQuota: 50,
    soldCount: 0
  },
  {
    id: 'food_02',
    name: 'Xôi gà xé nấm hương mỡ hành',
    category: 'Xôi sáng',
    price: 15000,
    unit: 'hộp',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
    description: 'Xôi nếp nương dẻo thơm, thịt gà xé đậm vị, nấm hương, rắc hành phi giòn và mỡ hành béo bùi.',
    isActiveToday: true,
    dailyQuota: 45,
    soldCount: 0
  },
  {
    id: 'food_03',
    name: 'Bánh mì kẹp chả giò dưa leo',
    category: 'Bánh mì',
    price: 12000,
    unit: 'ổ',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    description: 'Bánh mì kẹp chả lụa hảo hạng, rưới sốt bơ trứng gà thơm lừng, thêm rau răm và dưa leo giòn mát.',
    isActiveToday: true,
    dailyQuota: 40,
    soldCount: 0
  },
  {
    id: 'food_04',
    name: 'Bánh bao trứng cút thịt nạc',
    category: 'Bánh bao',
    price: 12000,
    unit: 'cái',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    description: 'Bánh bao nóng hổi, nhân thịt nạc băm, mộc nhĩ, 2 quả trứng cút đậm đà béo ngậy.',
    isActiveToday: true,
    dailyQuota: 35,
    soldCount: 0
  },
  {
    id: 'food_05',
    name: 'Xôi gấc vò chả lụa dừa nạo',
    category: 'Xôi sáng',
    price: 15000,
    unit: 'hộp',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: 'Xôi gấc đỏ tươi may mắn, đậu xanh vò tơi xốp, dừa nạo sợi béo ngậy kèm 2 lát chả lụa.',
    isActiveToday: true,
    dailyQuota: 30,
    soldCount: 0
  },
  {
    id: 'food_06',
    name: 'Bún thịt nướng chả ram',
    category: 'Bún & Phở',
    price: 20000,
    unit: 'tô',
    image: 'https://images.unsplash.com/photo-1503764654157-724e03053a67?auto=format&fit=crop&w=600&q=80',
    description: 'Bún tươi, thịt nướng than hoa thơm lừng, chả ram giòn rụm, đậu phộng rang và nước mắm chua ngọt.',
    isActiveToday: false,
    dailyQuota: 30,
    soldCount: 0
  },
  {
    id: 'drink_01',
    name: 'Sữa chua nếp cẩm nhà làm',
    category: 'Đồ uống & Tráng miệng',
    price: 10000,
    unit: 'ly',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    description: 'Sữa chua dẻo thơm mát kết hợp cùng nếp cẩm Tây Bắc dẻo bùi, ngọt thanh mát lạnh.',
    isActiveToday: true,
    dailyQuota: 40,
    soldCount: 0
  },
  {
    id: 'drink_02',
    name: 'Sữa đậu nành nguyên chất ướp lạnh',
    category: 'Đồ uống & Tráng miệng',
    price: 8000,
    unit: 'chai',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    description: 'Sữa đậu nành hạt tươi cô Vân tự nấu mỗi sáng sớm, lá dứa thơm mát, ít đường tốt cho sức khỏe.',
    isActiveToday: true,
    dailyQuota: 50,
    soldCount: 0
  },
  {
    id: 'drink_03',
    name: 'Sữa tươi tiệt trùng Vinamilk (Có đường)',
    category: 'Đồ uống & Tráng miệng',
    price: 10000,
    unit: 'hộp',
    image: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80',
    description: 'Sữa tươi tiệt trùng 180ml Vinamilk 100% sữa tươi nguyên chất bổ sung năng lượng học tập.',
    isActiveToday: true,
    dailyQuota: 40,
    soldCount: 0
  }
];

// Danh sách đơn hàng mẫu khởi tạo để cô Vân và người dùng xem trước thống kê
const INITIAL_ORDERS = [
  {
    id: 'order_101',
    code: 'BS-01',
    customerName: 'Nguyễn Văn An',
    customerClass: '12A1',
    customerPhone: '0912345678',
    customerRole: 'student',
    items: [
      { id: 'food_01', name: 'Bánh mì xíu mại pate đặc biệt', price: 15000, quantity: 1, note: 'Nhiều tương ớt' },
      { id: 'drink_02', name: 'Sữa đậu nành nguyên chất ướp lạnh', price: 8000, quantity: 1, note: '' }
    ],
    totalAmount: 23000,
    paymentMethod: 'vietqr', // 'vietqr' | 'cash'
    paymentStatus: 'paid',   // 'paid' | 'pending'
    paidAt: new Date().toISOString(),
    paymentNote: 'Đã nhận chuyển khoản VietQR',
    orderStatus: 'ready',    // 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    orderNote: 'Giao trước 6h45',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: 'order_102',
    code: 'BS-02',
    customerName: 'Trần Thị Thu Thảo',
    customerClass: '11B3',
    customerPhone: '0987654321',
    customerRole: 'student',
    items: [
      { id: 'food_02', name: 'Xôi gà xé nấm hương mỡ hành', price: 15000, quantity: 2, note: '1 hộp không hành' },
      { id: 'drink_01', name: 'Sữa chua nếp cẩm nhà làm', price: 10000, quantity: 2, note: '' }
    ],
    totalAmount: 50000,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    paidAt: null,
    paymentNote: 'Thu tiền mặt khi nhận',
    orderStatus: 'preparing',
    orderNote: 'Đặt chung cho 2 bạn',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'order_103',
    code: 'BS-03',
    customerName: 'Thầy Lê Hoàng Nam (GV Tin Học)',
    customerClass: 'Tổ Toán - Tin',
    customerPhone: '0905111222',
    customerRole: 'teacher',
    items: [
      { id: 'food_01', name: 'Bánh mì xíu mại pate đặc biệt', price: 15000, quantity: 1, note: 'Không ớt cay' },
      { id: 'drink_03', name: 'Sữa tươi tiệt trùng Vinamilk (Có đường)', price: 10000, quantity: 1, note: '' }
    ],
    totalAmount: 25000,
    paymentMethod: 'vietqr',
    paymentStatus: 'paid',
    paidAt: new Date().toISOString(),
    paymentNote: 'Đã nhận chuyển khoản VietQR',
    orderStatus: 'completed',
    orderNote: 'Gửi phòng hội đồng',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
];

/**
 * Lấy cấu hình Bếp Sáng
 */
export function getCanteenConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Lỗi đọc cấu hình căn tin:", e);
  }
  saveCanteenConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

/**
 * Lưu cấu hình Bếp Sáng
 */
export function saveCanteenConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('cbq-canteen-config-changed', { detail: config }));
  } catch (e) {
    console.error("Lỗi lưu cấu hình căn tin:", e);
  }
}

/**
 * Lấy toàn bộ thực đơn món ăn
 */
export function getMenuItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MENU);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Lỗi đọc thực đơn căn tin:", e);
  }
  saveMenuItems(INITIAL_MENU_ITEMS);
  return INITIAL_MENU_ITEMS;
}

/**
 * Lưu toàn bộ thực đơn món ăn
 */
export function saveMenuItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cbq-canteen-menu-changed', { detail: items }));
  } catch (e) {
    console.error("Lỗi lưu thực đơn căn tin:", e);
  }
}

/**
 * Thêm hoặc cập nhật một món ăn
 */
export function upsertMenuItem(item) {
  const items = getMenuItems();
  const id = item.id || `food_${Date.now()}`;
  const prepared = {
    ...item,
    id,
    price: Number(item.price) || 0,
    dailyQuota: Number(item.dailyQuota) || 50,
    soldCount: item.soldCount || 0
  };

  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) {
    items[idx] = prepared;
  } else {
    items.push(prepared);
  }

  saveMenuItems(items);
  return prepared;
}

/**
 * Xóa một món ăn
 */
export function deleteMenuItem(id) {
  const items = getMenuItems();
  const filtered = items.filter(i => i.id !== id);
  saveMenuItems(filtered);
  return filtered;
}

/**
 * Bật / Tắt trạng thái bán hôm nay của một món ăn (Cô Vân bấm 1-chạm)
 */
export function toggleItemActiveToday(id) {
  const items = getMenuItems();
  const item = items.find(i => i.id === id);
  if (item) {
    item.isActiveToday = !item.isActiveToday;
    saveMenuItems(items);
    return item;
  }
  return null;
}

/**
 * Lấy toàn bộ danh sách đơn đặt món
 */
export function getAllCanteenOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Lỗi đọc đơn hàng căn tin:", e);
  }
  saveAllCanteenOrders(INITIAL_ORDERS);
  return INITIAL_ORDERS;
}

/**
 * Lưu toàn bộ đơn đặt món
 */
export function saveAllCanteenOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('cbq-canteen-orders-changed', { detail: orders }));
  } catch (e) {
    console.error("Lỗi lưu đơn hàng căn tin:", e);
  }
}

/**
 * Tạo một đơn đặt đồ ăn mới
 */
export function createCanteenOrder(orderData) {
  const orders = getAllCanteenOrders();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
  const nextNumber = todayOrders.length + 1;
  const orderCode = `BS-${nextNumber < 10 ? '0' : ''}${nextNumber}`;

  const newOrder = {
    id: `order_${Date.now()}`,
    code: orderCode,
    customerName: orderData.customerName || 'Học sinh',
    customerClass: orderData.customerClass || 'Tự do',
    customerPhone: orderData.customerPhone || '',
    customerRole: orderData.customerRole || 'student',
    items: orderData.items || [],
    totalAmount: orderData.totalAmount || 0,
    paymentMethod: orderData.paymentMethod || 'cash', // 'vietqr' | 'cash'
    paymentStatus: orderData.paymentStatus || 'pending', // 'paid' | 'pending'
    paidAt: orderData.paymentStatus === 'paid' ? new Date().toISOString() : null,
    paymentNote: orderData.paymentNote || '',
    paymentProofImage: orderData.paymentProofImage || '',
    orderStatus: 'confirmed', // 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    orderNote: orderData.orderNote || '',
    createdAt: new Date().toISOString()
  };

  // Cập nhật số lượng đã bán vào menu
  const menu = getMenuItems();
  newOrder.items.forEach(orderItem => {
    const menuItem = menu.find(m => m.id === orderItem.id);
    if (menuItem) {
      menuItem.soldCount = (menuItem.soldCount || 0) + (orderItem.quantity || 1);
    }
  });
  saveMenuItems(menu);

  orders.unshift(newOrder);
  saveAllCanteenOrders(orders);
  return newOrder;
}

/**
 * Cập nhật trạng thái chế biến / giao hàng của đơn
 */
export function updateOrderStatus(orderId, orderStatus) {
  const orders = getAllCanteenOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].orderStatus = orderStatus;
    if (orderStatus === 'completed' && orders[idx].paymentMethod === 'cash') {
      // Khi giao hàng xong, nếu trả tiền mặt thì tự động đánh dấu đã thu tiền
      orders[idx].paymentStatus = 'paid';
      orders[idx].paidAt = new Date().toISOString();
    }
    saveAllCanteenOrders(orders);
    return orders[idx];
  }
  return null;
}

/**
 * Cập nhật trạng thái thanh toán (Xác nhận chuyển khoản hoặc Thu tiền mặt)
 */
export function updatePaymentStatus(orderId, paymentStatus, paymentNote = '') {
  const orders = getAllCanteenOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].paymentStatus = paymentStatus;
    orders[idx].paidAt = paymentStatus === 'paid' ? new Date().toISOString() : null;
    if (paymentNote) {
      orders[idx].paymentNote = paymentNote;
    }
    saveAllCanteenOrders(orders);
    return orders[idx];
  }
  return null;
}

/**
 * Xóa một đơn hàng (hủy đơn)
 */
export function cancelCanteenOrder(orderId, reason = '') {
  const orders = getAllCanteenOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].orderStatus = 'cancelled';
    orders[idx].cancelReason = reason;
    saveAllCanteenOrders(orders);
    return orders[idx];
  }
  return null;
}

/**
 * Tạo URL mã QR VietQR chuẩn ngân hàng để chuyển khoản trực tiếp cho Cô Vân
 */
export function generateVietQrUrl({ bankCode = 'MB', accountNumber, accountName, amount, memo }) {
  if (!accountNumber) return '';
  const cleanBank = bankCode || 'MB';
  const cleanAcc = encodeURIComponent(accountNumber.trim());
  const cleanAmount = parseInt(amount, 10) || 0;
  const cleanMemo = encodeURIComponent((memo || 'CBQ FOOD').trim());
  const cleanName = encodeURIComponent((accountName || 'LUONG THI HAI VAN').trim());

  // Định dạng chuẩn dịch vụ VietQR API Compact2
  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${cleanAmount}&addInfo=${cleanMemo}&accountName=${cleanName}`;
}

/**
 * Thống kê tổng hợp bếp sáng cho Cô Vân:
 * 1. Tổng số lượng từng món cần chế biến sáng nay
 * 2. Gom nhóm đơn hàng theo từng LỚP HỌC (để đóng theo túi lớp)
 * 3. Chỉ số tài chính: Doanh thu, Đã chuyển khoản, Đã thu tiền mặt, Còn phải thu
 */
export function getKitchenSummaryToday() {
  const orders = getAllCanteenOrders();
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Đơn hôm nay và không bị hủy
  const activeOrders = orders.filter(o => 
    o.createdAt && o.createdAt.startsWith(todayStr) && o.orderStatus !== 'cancelled'
  );

  // 1. Tổng hợp số lượng từng món
  const itemCountsMap = {};
  activeOrders.forEach(ord => {
    (ord.items || []).forEach(it => {
      if (!itemCountsMap[it.name]) {
        itemCountsMap[it.name] = {
          name: it.name,
          quantity: 0,
          unit: it.unit || 'phần',
          price: it.price || 0
        };
      }
      itemCountsMap[it.name].quantity += (it.quantity || 1);
    });
  });
  const itemsSummary = Object.values(itemCountsMap);

  // 2. Gom nhóm đơn theo Lớp học
  const classGroupsMap = {};
  activeOrders.forEach(ord => {
    const cls = ord.customerClass || 'Khác';
    if (!classGroupsMap[cls]) {
      classGroupsMap[cls] = {
        className: cls,
        orders: [],
        totalItems: 0,
        totalAmount: 0
      };
    }
    classGroupsMap[cls].orders.push(ord);
    classGroupsMap[cls].totalItems += (ord.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
    classGroupsMap[cls].totalAmount += (ord.totalAmount || 0);
  });
  const classSummary = Object.values(classGroupsMap).sort((a, b) => a.className.localeCompare(b.className));

  // 3. Thống kê tài chính
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  const transferPaidAmount = activeOrders
    .filter(o => o.paymentMethod === 'vietqr' && o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const transferPendingAmount = activeOrders
    .filter(o => o.paymentMethod === 'vietqr' && o.paymentStatus !== 'paid')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const cashPaidAmount = activeOrders
    .filter(o => o.paymentMethod === 'cash' && o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const cashPendingAmount = activeOrders
    .filter(o => o.paymentMethod === 'cash' && o.paymentStatus !== 'paid')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalPaid = transferPaidAmount + cashPaidAmount;
  const totalPending = transferPendingAmount + cashPendingAmount;

  return {
    activeOrdersCount: activeOrders.length,
    itemsSummary,
    classSummary,
    finances: {
      totalRevenue,
      transferPaidAmount,
      transferPendingAmount,
      cashPaidAmount,
      cashPendingAmount,
      totalPaid,
      totalPending
    }
  };
}
