/**
 * DỊCH VỤ QUẢN LÝ HỌC LIỆU SỐ PHÂN QUYỀN & CƠ CHẾ CẤP QUYỀN / VIETQR
 * Trường THPT Cao Bá Quát - Phường Tân An - Tỉnh Đắk Lắk
 */

import { supabase } from '../lib/supabase';
import masterTimetable from '../data/master_timetable.json';

const STORAGE_KEY_MATERIALS = 'cbq_custom_edu_materials';
const STORAGE_KEY_GRANTS = 'cbq_material_access_grants';
const STORAGE_KEY_REQUESTS = 'cbq_material_access_requests';

// Danh sách ngân hàng phổ biến tại Việt Nam hỗ trợ VietQR
export const POPULAR_VIETNAMESE_BANKS = [
  { code: 'ICB', name: 'VietinBank (Ngân hàng Công Thương Việt Nam)', shortName: 'VietinBank' },
  { code: 'VCB', name: 'Vietcombank (Ngân hàng Ngoại Thương Việt Nam)', shortName: 'Vietcombank' },
  { code: 'MB', name: 'MB Bank (Ngân hàng Quân Đội)', shortName: 'MB Bank' },
  { code: 'BIDV', name: 'BIDV (Ngân hàng Đầu tư & Phát triển)', shortName: 'BIDV' },
  { code: 'VBA', name: 'Agribank (Ngân hàng Nông nghiệp & PTNT)', shortName: 'Agribank' },
  { code: 'TCB', name: 'Techcombank (Ngân hàng Kỹ Thương)', shortName: 'Techcombank' },
  { code: 'VPB', name: 'VPBank (Ngân hàng Việt Nam Thịnh Vượng)', shortName: 'VPBank' },
  { code: 'ACB', name: 'ACB (Ngân hàng Á Châu)', shortName: 'ACB' },
  { code: 'TPB', name: 'TPBank (Ngân hàng Tiên Phong)', shortName: 'TPBank' },
  { code: 'STB', name: 'Sacombank (Ngân hàng Sài Gòn Thương Tín)', shortName: 'Sacombank' },
  { code: 'MOMO', name: 'Ví Điện Tử MoMo', shortName: 'MoMo' }
];

// Dữ liệu học liệu số mẫu chất lượng cao ban đầu
const INITIAL_MATERIALS = [
  {
    id: 'mat-toan-10a01-ch1',
    teacher_name: 'Nguyễn Hữu Lam',
    teacher_id: 'gv-lam-toan',
    subject: 'Toán',
    grade: 'Khối 10',
    target_classes: ['10A01', '10A07'],
    title: 'Chuyên Đề Mệnh Đề & Tập Hợp - Phương Pháp Giải Nhanh Trắc Nghiệm Đúng/Sai',
    description: 'Tài liệu độc quyền kèm 30 ví dụ phân loại học sinh giỏi chuẩn cấu trúc GDPT 2018.',
    material_type: 'document',
    content_url: 'https://drive.google.com',
    file_size: '4.2 MB',
    is_free_for_target_classes: true,
    is_monetized: true,
    price: 25000,
    bank_info: {
      bankCode: 'ICB',
      accountNumber: '108876543210',
      accountName: 'NGUYEN HUU LAM'
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'mat-van-11a04-ch2',
    teacher_name: 'Lê Thị Thảo',
    teacher_id: 'gv-thao-van',
    subject: 'Ngữ văn',
    grade: 'Khối 11',
    target_classes: ['11A04', '11A05'],
    title: 'Học Liệu Số: Sơ Đồ Tư Duy & Cẩm Nang Đọc Hiểu Văn Bản Nghị Luận Hiện Đại',
    description: 'Hệ thống hóa luận điểm, dẫn chứng nghị luận xã hội đạt điểm 8+ kỳ thi học sinh giỏi.',
    material_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    file_size: 'Video 24 phút',
    is_free_for_target_classes: true,
    is_monetized: false,
    price: 0,
    bank_info: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'mat-anh-12a01-ch3',
    teacher_name: 'Phạm Thị Nguyệt Thơ',
    teacher_id: 'gv-tho-anh',
    subject: 'Tiếng Anh',
    grade: 'Khối 12',
    target_classes: ['12A01', '12A02'],
    title: 'Bí Kíp 100 Câu Collocation & Idioms Thường Gặp Trong Đề Tốt Nghiệp THPT 2026',
    description: 'Tài liệu luyện thi cấp tốc môn Tiếng Anh chuẩn format mới của Bộ Giáo dục.',
    material_type: 'package',
    content_url: 'https://drive.google.com',
    file_size: 'Trọn bộ PDF + Audio',
    is_free_for_target_classes: true,
    is_monetized: true,
    price: 30000,
    bank_info: {
      bankCode: 'VCB',
      accountNumber: '0231000654321',
      accountName: 'PHAM THI NGUYET THO'
    },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

/**
 * Lấy danh sách các lớp giáo viên đang dạy từ master_timetable.json
 */
export function getClassesTaughtByTeacher(teacherName) {
  if (!teacherName) return [];
  const cleanName = teacherName.trim().toLowerCase();
  const matched = masterTimetable.filter(item => 
    (item.teacher_name && item.teacher_name.toLowerCase().includes(cleanName)) ||
    (item.teacher_short && item.teacher_short.toLowerCase().includes(cleanName))
  );

  const classes = [...new Set(matched.map(item => item.student_class).filter(Boolean))];
  return classes.sort();
}

import { CacheManager } from '../utils/cacheManager';

const CACHE_KEY_MATERIALS = 'cbq_cached_edu_materials';

/**
 * Lấy danh sách toàn bộ học liệu số (kết hợp Smart Edge Cache + Cloud Supabase + Local Storage)
 * @param {boolean} forceRefresh Cưỡng bức tải mới bỏ qua cache
 */
export async function getAllEduMaterials(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = CacheManager.get(CACHE_KEY_MATERIALS, 15);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  }

  let materials = [];

  try {
    const { data, error } = await supabase
      .from('cbq_edu_materials')
      .select('id, teacher_name, teacher_id, subject, grade, target_classes, title, description, material_type, content_url, file_size, is_free_for_target_classes, is_monetized, price, bank_info, created_at')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      materials = data;
    }
  } catch (err) {
    console.warn('[EduMaterials] Dùng bộ nhớ cục bộ:', err);
  }

  // Kết hợp với dữ liệu LocalStorage
  let localCustom = [];
  try {
    const cached = localStorage.getItem(STORAGE_KEY_MATERIALS);
    if (cached) {
      localCustom = JSON.parse(cached);
    }
  } catch (e) {}

  const merged = [...localCustom, ...materials];
  let finalResult = merged;
  if (merged.length === 0) {
    finalResult = INITIAL_MATERIALS;
  } else {
    // Lọc trùng theo id
    const map = new Map();
    merged.forEach(item => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    finalResult = Array.from(map.values());
  }

  // Lưu vào Smart Edge Cache 15 phút
  CacheManager.set(CACHE_KEY_MATERIALS, finalResult);

  return finalResult;
}

/**
 * Thêm một học liệu số mới (dành cho Giáo viên)
 */
export async function createEduMaterial(materialData) {
  const newMaterial = {
    ...materialData,
    id: materialData.id || `mat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString()
  };

  // 1. Thử lưu vào Supabase
  try {
    await supabase.from('cbq_edu_materials').insert([newMaterial]);
  } catch (err) {
    console.warn('[EduMaterials] Chưa đồng bộ được Supabase, lưu cục bộ:', err);
  }

  // 2. Lưu vào LocalStorage
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY_MATERIALS) || '[]');
    cached.unshift(newMaterial);
    localStorage.setItem(STORAGE_KEY_MATERIALS, JSON.stringify(cached));
  } catch (e) {
    console.error('Lỗi ghi local storage:', e);
  }

  // 3. Làm mới cache
  CacheManager.remove(CACHE_KEY_MATERIALS);

  return newMaterial;
}

/**
 * Kiểm tra xem một học sinh có quyền truy cập học liệu số hay không
 * @returns { hasAccess: boolean, reason: 'enrolled_class' | 'teacher_approved' | 'paid' | 'locked', grantInfo: object }
 */
export function checkStudentMaterialAccess(material, student) {
  if (!material) return { hasAccess: false, reason: 'locked' };
  
  // Nếu học liệu không giới hạn lớp (target_classes rỗng hoặc chứa 'ALL')
  if (!material.target_classes || material.target_classes.length === 0 || material.target_classes.includes('ALL')) {
    return { hasAccess: true, reason: 'public' };
  }

  // Nếu chưa đăng nhập học sinh
  if (!student) {
    return { hasAccess: false, reason: 'locked' };
  }

  // 1. Kiểm tra nếu học sinh thuộc lớp mục tiêu do giáo viên chỉ định
  const targetClasses = Array.isArray(material.target_classes) ? material.target_classes : [];
  if (targetClasses.includes(student.student_class)) {
    return { hasAccess: true, reason: 'enrolled_class' };
  }

  // 2. Kiểm tra nếu học sinh đã được cấp quyền riêng hoặc đã thanh toán
  try {
    const grants = JSON.parse(localStorage.getItem(STORAGE_KEY_GRANTS) || '[]');
    const studentCode = (student.student_code || student.username || '').toLowerCase();
    
    const matchedGrant = grants.find(g => 
      g.material_id === material.id && 
      (g.student_code.toLowerCase() === studentCode || g.student_name === student.full_name)
    );

    if (matchedGrant) {
      return { 
        hasAccess: true, 
        reason: matchedGrant.grant_type === 'paid_purchase' ? 'paid' : 'teacher_approved',
        grantInfo: matchedGrant 
      };
    }
  } catch (e) {}

  return { hasAccess: false, reason: 'locked' };
}

/**
 * Gửi yêu cầu xin cấp quyền học liệu (dành cho Học sinh xin miễn phí)
 */
export async function submitAccessRequest({ materialId, materialTitle, teacherName, student, message }) {
  const newRequest = {
    id: `req-${Date.now()}`,
    material_id: materialId,
    material_title: materialTitle,
    teacher_name: teacherName,
    student_code: student.student_code || student.username,
    student_name: student.full_name,
    student_class: student.student_class,
    request_type: 'free_request',
    student_message: message || 'Em xin phép Thầy/Cô cấp quyền cho em vào học thêm chuyên đề này ạ.',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  try {
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEY_REQUESTS) || '[]');
    requests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  } catch (e) {}

  return newRequest;
}

/**
 * Lấy danh sách yêu cầu xin cấp quyền của giáo viên
 */
export function getAccessRequestsForTeacher(teacherName) {
  try {
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEY_REQUESTS) || '[]');
    if (!teacherName) return requests;
    const clean = teacherName.trim().toLowerCase();
    return requests.filter(r => (r.teacher_name || '').toLowerCase().includes(clean));
  } catch (e) {
    return [];
  }
}

/**
 * Giáo viên phê duyệt hoặc từ chối yêu cầu xin cấp quyền
 */
export function resolveAccessRequest(requestId, approved = true, teacherName = '') {
  try {
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEY_REQUESTS) || '[]');
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return false;

    const req = requests[reqIndex];
    req.status = approved ? 'approved' : 'rejected';
    req.resolved_at = new Date().toISOString();
    req.resolved_by = teacherName;
    requests[reqIndex] = req;
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));

    // Nếu duyệt, tự động thêm vào grants
    if (approved) {
      const grants = JSON.parse(localStorage.getItem(STORAGE_KEY_GRANTS) || '[]');
      grants.push({
        id: `grant-${Date.now()}`,
        material_id: req.material_id,
        student_code: req.student_code,
        student_name: req.student_name,
        student_class: req.student_class,
        grant_type: 'teacher_approved',
        approved_by: teacherName,
        granted_at: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEY_GRANTS, JSON.stringify(grants));
    }

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/**
 * Tạo URL mã QR thanh toán chuẩn VietQR
 */
export function generateVietQRUrl({ bankCode, accountNumber, accountName, amount, description }) {
  if (!bankCode || !accountNumber) return '';

  const cleanBank = bankCode.trim().toUpperCase();
  const cleanAccount = accountNumber.trim().replace(/\s+/g, '');
  const cleanAmount = Math.max(0, parseInt(amount, 10) || 0);
  const cleanDesc = encodeURIComponent((description || 'CBQ HOC LIEU').substring(0, 50));
  const cleanName = encodeURIComponent((accountName || '').trim().toUpperCase());

  // Chuẩn API hình ảnh VietQR Quick Pay
  return `https://img.vietqr.io/image/${cleanBank}-${cleanAccount}-compact2.png?amount=${cleanAmount}&addInfo=${cleanDesc}&accountName=${cleanName}`;
}

/**
 * Ghi nhận thanh toán mở khóa học liệu thành công
 */
export function recordPaidUnlock({ materialId, student, amount, transactionRef }) {
  try {
    const grants = JSON.parse(localStorage.getItem(STORAGE_KEY_GRANTS) || '[]');
    const studentCode = student.student_code || student.username;

    // Tránh trùng lặp
    const existingIndex = grants.findIndex(g => g.material_id === materialId && g.student_code === studentCode);
    const newGrant = {
      id: `grant-${Date.now()}`,
      material_id: materialId,
      student_code: studentCode,
      student_name: student.full_name,
      student_class: student.student_class,
      grant_type: 'paid_purchase',
      amount_paid: amount,
      transaction_ref: transactionRef || `VQR-${Date.now()}`,
      granted_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      grants[existingIndex] = newGrant;
    } else {
      grants.push(newGrant);
    }

    localStorage.setItem(STORAGE_KEY_GRANTS, JSON.stringify(grants));
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
