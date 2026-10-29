/**
 * Chương Trình Điểm Tâm Sáng CBQ - Tiếp Sức Học Đường
 * Trường THPT Cao Bá Quát - Cư M'gar, Đắk Lắk
 * 
 * Phụ trách chuẩn bị suất ăn: Cô Lương Thị Hải Vân (Tổ hỗ trợ đời sống CBQ)
 * Hỗ trợ học sinh ở xa và cán bộ giáo viên đăng ký suất ăn dinh dưỡng, an toàn trước giờ vào lớp.
 * 
 * Tích hợp Cơ Sở Dữ Liệu Supabase (cbq_canteen_config, cbq_canteen_menu, cbq_canteen_orders)
 * kèm cơ chế Fallback LocalStorage & Realtime đồng bộ đa thiết bị!
 */

import { supabase } from '../lib/supabase';

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

// Cấu hình mặc định của chương trình Điểm tâm sáng học đường
const DEFAULT_CONFIG = {
  storeName: 'Điểm Tâm Sáng CBQ - Tiếp Sức Học Đường',
  sellerName: 'Cô Lương Thị Hải Vân',
  sellerRole: 'Phụ trách chuẩn bị suất ăn • Tổ hỗ trợ đời sống CBQ',
  phone: '0984.xxx.xxx',
  pickupLocation: 'Bàn tiếp nhận điểm tâm (Sảnh Tầng 1 - Khu Hiệu Bộ)',
  isOpen: true,
  cutoffTime: '06:30', // Giờ chốt đăng ký trước giờ làm việc
  pickupTimeWindow: '06:35 - 06:55 (Trước giờ truy bài và giờ học chính khóa)',
  bankAccount: {
    bankCode: 'TPB',
    bankName: 'TPBank (Ngân Hàng Tiên Phong)',
    accountNumber: '17753888888',
    accountName: 'LUONG THI HAI VAN',
    qrImage: '/qr_bep_sang_co_van.png'
  },
  announcement: '🌟 Chương trình Điểm Tâm Sáng CBQ hỗ trợ học sinh ở xa và quý Thầy/Cô kịp thời có bữa sáng nóng hổi, bảo đảm dinh dưỡng và an toàn thực phẩm trước giờ học chính khóa. Vui lòng đăng ký trước 06h30 để cô chuẩn bị chu đáo!'
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
  }
];

/**
 * 1. Lấy cấu hình Điểm Tâm Sáng (Hỗ trợ Supabase + Fallback Cache)
 */
export function getCanteenConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Nâng cấp tự động tài khoản thật của Cô Vân (TPBank: 1775 3888 888)
      if (parsed?.bankAccount?.accountNumber === '0984123456' || parsed?.bankAccount?.bankCode === 'MB' || !parsed?.bankAccount?.accountNumber) {
        parsed.bankAccount = { ...DEFAULT_CONFIG.bankAccount };
      }
      // Chuẩn hóa câu chữ hành chính bảo vệ nhà trường & cô Vân
      if (parsed?.pickupLocation?.includes('Phòng Văn thư') || parsed?.storeName?.includes('Bếp Sáng CBQ - Điểm Tâm')) {
        parsed.storeName = DEFAULT_CONFIG.storeName;
        parsed.sellerRole = DEFAULT_CONFIG.sellerRole;
        parsed.pickupLocation = DEFAULT_CONFIG.pickupLocation;
        parsed.announcement = DEFAULT_CONFIG.announcement;
      }
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.error("Lỗi đọc cấu hình căn tin:", e);
  }
  saveCanteenConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

export async function fetchCanteenConfigAsync() {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('cbq_canteen_config').select('*').eq('id', 'primary_config').single();
      if (!error && data) {
        const mapped = {
          storeName: data.store_name,
          sellerName: data.seller_name,
          sellerRole: data.seller_role,
          phone: data.phone,
          pickupLocation: data.pickup_location,
          isOpen: data.is_open,
          cutoffTime: data.cutoff_time,
          pickupTimeWindow: data.pickup_time_window,
          bankAccount: {
            bankCode: data.bank_code,
            bankName: data.bank_name,
            accountNumber: data.account_number,
            accountName: data.account_name
          },
          announcement: data.announcement
        };
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (e) {
    console.warn("Lỗi fetch cấu hình căn tin từ Supabase, sử dụng cache:", e);
  }
  return getCanteenConfig();
}

/**
 * Lưu cấu hình Điểm Tâm Sáng
 */
export async function saveCanteenConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('cbq-canteen-config-changed', { detail: config }));

    if (supabase) {
      await supabase.from('cbq_canteen_config').upsert({
        id: 'primary_config',
        store_name: config.storeName,
        seller_name: config.sellerName,
        seller_role: config.sellerRole,
        phone: config.phone,
        pickup_location: config.pickupLocation,
        is_open: config.isOpen,
        cutoff_time: config.cutoffTime,
        pickup_time_window: config.pickupTimeWindow,
        bank_code: config.bankAccount?.bankCode || 'MB',
        bank_name: config.bankAccount?.bankName || 'MBBank',
        account_number: config.bankAccount?.accountNumber || '',
        account_name: config.bankAccount?.accountName || 'LUONG THI HAI VAN',
        announcement: config.announcement,
        updated_at: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error("Lỗi lưu cấu hình căn tin:", e);
  }
}

/**
 * 2. Lấy toàn bộ thực đơn món ăn
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

export async function fetchMenuItemsAsync() {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('cbq_canteen_menu').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: Number(item.price) || 0,
          unit: item.unit || 'phần',
          image: item.image,
          description: item.description,
          isActiveToday: item.is_active_today,
          dailyQuota: item.daily_quota,
          soldCount: item.sold_count || 0
        }));
        localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (e) {
    console.warn("Lỗi fetch thực đơn từ Supabase, dùng cache:", e);
  }
  return getMenuItems();
}

/**
 * Lưu toàn bộ thực đơn món ăn
 */
export async function saveMenuItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cbq-canteen-menu-changed', { detail: items }));

    if (supabase) {
      const payload = items.map(it => ({
        id: it.id,
        name: it.name,
        category: it.category,
        price: it.price,
        unit: it.unit,
        image: it.image,
        description: it.description,
        is_active_today: it.isActiveToday,
        daily_quota: it.dailyQuota,
        sold_count: it.soldCount || 0,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('cbq_canteen_menu').upsert(payload);
    }
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
export async function deleteMenuItem(id) {
  const items = getMenuItems();
  const filtered = items.filter(i => i.id !== id);
  saveMenuItems(filtered);
  if (supabase) {
    try {
      await supabase.from('cbq_canteen_menu').delete().eq('id', id);
    } catch (e) {
      console.warn("Lỗi xóa món ăn Supabase:", e);
    }
  }
  return filtered;
}

/**
 * Bật / Tắt trạng thái bán hôm nay của một món ăn
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
 * 3. Lấy toàn bộ danh sách đơn đặt món
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

export async function fetchCanteenOrdersAsync() {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('cbq_canteen_orders').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const mapped = data.map(o => ({
          id: o.id,
          code: o.code,
          customerName: o.customer_name,
          customerClass: o.customer_class,
          customerPhone: o.customer_phone,
          customerRole: o.customer_role,
          items: o.items || [],
          totalAmount: Number(o.total_amount) || 0,
          paymentMethod: o.payment_method,
          paymentStatus: o.payment_status,
          paidAt: o.paid_at,
          paymentNote: o.payment_note,
          paymentProofImage: o.payment_proof_image,
          orderStatus: o.order_status,
          orderNote: o.order_note,
          createdAt: o.created_at
        }));
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (e) {
    console.warn("Lỗi fetch đơn hàng từ Supabase, dùng cache:", e);
  }
  return getAllCanteenOrders();
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
export async function createCanteenOrder(orderData) {
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
    paymentMethod: orderData.paymentMethod || 'cash',
    paymentStatus: orderData.paymentStatus || 'pending',
    paidAt: orderData.paymentStatus === 'paid' ? new Date().toISOString() : null,
    paymentNote: orderData.paymentNote || '',
    paymentProofImage: orderData.paymentProofImage || '',
    orderStatus: 'confirmed',
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

  // Lưu local
  orders.unshift(newOrder);
  saveAllCanteenOrders(orders);

  // Đồng bộ lên Supabase nếu có
  if (supabase) {
    try {
      await supabase.from('cbq_canteen_orders').insert({
        id: newOrder.id,
        code: newOrder.code,
        customer_name: newOrder.customerName,
        customer_class: newOrder.customerClass,
        customer_phone: newOrder.customerPhone,
        customer_role: newOrder.customerRole,
        items: newOrder.items,
        total_amount: newOrder.totalAmount,
        payment_method: newOrder.paymentMethod,
        payment_status: newOrder.paymentStatus,
        paid_at: newOrder.paidAt,
        payment_note: newOrder.paymentNote,
        payment_proof_image: newOrder.paymentProofImage,
        order_status: newOrder.orderStatus,
        order_note: newOrder.orderNote,
        created_at: newOrder.createdAt
      });
    } catch (e) {
      console.warn("Lỗi đồng bộ đơn hàng lên Supabase:", e);
    }
  }

  return newOrder;
}

/**
 * Cập nhật trạng thái chế biến / giao hàng của đơn
 */
export async function updateOrderStatus(orderId, orderStatus) {
  const orders = getAllCanteenOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].orderStatus = orderStatus;
    if (orderStatus === 'completed' && orders[idx].paymentMethod === 'cash') {
      orders[idx].paymentStatus = 'paid';
      orders[idx].paidAt = new Date().toISOString();
    }
    saveAllCanteenOrders(orders);

    if (supabase) {
      try {
        await supabase.from('cbq_canteen_orders').update({
          order_status: orderStatus,
          payment_status: orders[idx].paymentStatus,
          paid_at: orders[idx].paidAt,
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
      } catch (e) {
        console.warn("Lỗi update status đơn Supabase:", e);
      }
    }

    return orders[idx];
  }
  return null;
}

/**
 * Cập nhật trạng thái thanh toán (Xác nhận chuyển khoản hoặc Thu tiền mặt)
 */
export async function updatePaymentStatus(orderId, paymentStatus, paymentNote = '') {
  const orders = getAllCanteenOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].paymentStatus = paymentStatus;
    orders[idx].paidAt = paymentStatus === 'paid' ? new Date().toISOString() : null;
    if (paymentNote) {
      orders[idx].paymentNote = paymentNote;
    }
    saveAllCanteenOrders(orders);

    if (supabase) {
      try {
        await supabase.from('cbq_canteen_orders').update({
          payment_status: paymentStatus,
          paid_at: orders[idx].paidAt,
          payment_note: paymentNote || orders[idx].paymentNote,
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
      } catch (e) {
        console.warn("Lỗi update payment Supabase:", e);
      }
    }

    return orders[idx];
  }
  return null;
}

/**
 * Xóa một đơn hàng (hủy đơn)
 */
export async function cancelCanteenOrder(orderId, reason = '') {
  const orders = getAllCanteenOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].orderStatus = 'cancelled';
    orders[idx].cancelReason = reason;
    saveAllCanteenOrders(orders);

    if (supabase) {
      try {
        await supabase.from('cbq_canteen_orders').update({
          order_status: 'cancelled',
          order_note: reason ? `[HỦY]: ${reason}` : '[ĐÃ HỦY]',
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
      } catch (e) {
        console.warn("Lỗi hủy đơn Supabase:", e);
      }
    }

    return orders[idx];
  }
  return null;
}

/**
 * Đăng ký lắng nghe Realtime khi có đơn hàng mới
 */
export function subscribeToCanteenOrders(onOrderChanged) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('canteen_orders_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_canteen_orders' }, payload => {
      if (onOrderChanged) {
        onOrderChanged(payload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Tạo URL mã QR VietQR chuẩn ngân hàng để chuyển khoản trực tiếp cho Cô Vân
 */
export function generateVietQrUrl({ bankCode = 'TPB', accountNumber = '17753888888', accountName = 'LUONG THI HAI VAN', amount, memo }) {
  const cleanBank = bankCode || 'TPB';
  const cleanAcc = encodeURIComponent((accountNumber || '17753888888').replace(/\s+/g, ''));
  const cleanAmount = parseInt(amount, 10) || 0;
  const cleanMemo = encodeURIComponent((memo || 'CBQ DIEM TAM SANG').trim());
  const cleanName = encodeURIComponent((accountName || 'LUONG THI HAI VAN').trim());

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${cleanAmount}&addInfo=${cleanMemo}&accountName=${cleanName}`;
}

/**
 * Thống kê tổng hợp số suất điểm tâm cần chuẩn bị cho Cô Vân
 */
export function getKitchenSummaryToday() {
  const orders = getAllCanteenOrders();
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const activeOrders = orders.filter(o => 
    o.createdAt && o.createdAt.startsWith(todayStr) && o.orderStatus !== 'cancelled'
  );

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
