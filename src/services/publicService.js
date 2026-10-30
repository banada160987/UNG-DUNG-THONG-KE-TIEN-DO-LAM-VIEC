/**
 * Dịch Vụ Công Trực Tuyến & Tiếp Nhận Hồ Sơ Hành Chính Trường Học
 * Trường THPT Cao Bá Quát - Quốc Oai, Hà Nội
 * 
 * Phục vụ: Phụ huynh học sinh, Học sinh, Cựu học sinh, Văn thư & BGH
 * Tích hợp Zalo OA, Tra cứu mã hồ sơ theo thời gian thực và Cấp giấy mộc số điện tử.
 */

import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

const STORAGE_KEY_PUBLIC_SERVICES = 'cbq_public_services_records_v1';

// Danh mục các thủ tục Dịch vụ công trường học
export const PUBLIC_PROCEDURES = [
  {
    id: 'xac_nhan_hoc_sinh',
    title: 'Cấp Giấy Xác Nhận Học Sinh Đang Học Tại Trường',
    badge: 'Phổ biến nhất',
    badgeColor: '#0284c7',
    icon: 'FileBadge',
    description: 'Dùng để làm thẻ Căn cước công dân (Đề án 06), miễn giảm vé tàu xe/xe buýt, xin học bổng, bổ sung hồ sơ bảo hiểm y tế hoặc hoãn nghĩa vụ quân sự.',
    processingTime: 'Trong 2 - 4 giờ làm việc',
    requiredDocs: 'Thông tin học sinh, số CCCD (nếu có), lý do cấp giấy.',
    allowDigitalPdf: true
  },
  {
    id: 'don_xin_nghi_hoc',
    title: 'Đơn Xin Nghỉ Học Có Phép Điện Tử (Xác Thực Phụ Huynh)',
    badge: 'Xử lý ngay',
    badgeColor: '#16a34a',
    icon: 'Calendar',
    description: 'Phụ huynh gửi đơn xin nghỉ học cho con khi bị ốm hoặc có việc gia đình đột xuất. GVCN và BGH nhận thông báo tức thời, tự động đồng bộ vào Sổ Đầu Bài.',
    processingTime: 'Phê duyệt ngay trong ngày',
    requiredDocs: 'Khoảng thời gian nghỉ, lý do nghỉ, ảnh đơn thuốc/giấy viện (nếu ốm).',
    allowDigitalPdf: true
  },
  {
    id: 'sao_y_hoc_ba',
    title: 'Cấp Bản Sao Học Bạ / Bản Sao Bằng Tốt Nghiệp THPT',
    badge: 'Hồ sơ lưu trữ',
    badgeColor: '#7c3aed',
    icon: 'GraduationCap',
    description: 'Dành cho học sinh cuối cấp làm hồ sơ du học, xét tuyển Đại học hoặc cựu học sinh cần trích lục hồ sơ tốt nghiệp từ Kho Lưu Trữ Số CBQ.',
    processingTime: 'Trong vòng 24 giờ làm việc',
    requiredDocs: 'Số CCCD, niên khóa tốt nghiệp, mục đích sử dụng bản sao.',
    allowDigitalPdf: true
  },
  {
    id: 'chuyen_truong',
    title: 'Đơn Xin Chuyển Trường / Rút Hồ Sơ / Chuyển Lớp',
    badge: 'Thủ tục chuyển đi/đến',
    badgeColor: '#ea580c',
    icon: 'ArrowRightLeft',
    description: 'Tiếp nhận nguyện vọng chuyển trường đi/đến của học sinh theo phân luồng Sở GD&ĐT hoặc xin rút hồ sơ chuyển nơi cư trú của cha mẹ.',
    processingTime: 'Trong vòng 1 - 2 ngày làm việc',
    requiredDocs: 'Đơn xin chuyển trường của cha mẹ, giấy xác nhận nơi cư trú mới.',
    allowDigitalPdf: false
  }
];

// Dữ liệu mẫu ban đầu nếu máy chưa có dữ liệu
const INITIAL_MOCK_SERVICES = [
  {
    id: 'dvc-mock-001',
    code: 'CBQ-DVC-2026-0182',
    procedureType: 'xac_nhan_hoc_sinh',
    procedureTitle: 'Cấp Giấy Xác Nhận Học Sinh Đang Học Tại Trường',
    studentName: 'Nguyễn Minh Quân',
    studentCode: 'HS-12A1-01',
    studentClass: '12A1',
    birthDate: '15/03/2008',
    gender: 'Nam',
    identityCard: '001208012345',
    parentName: 'Nguyễn Văn Hùng',
    parentPhone: '0912.345.678',
    parentEmail: 'hungnguyen@gmail.com',
    reason: 'Làm thủ tục cấp đổi Căn cước công dân gắn chip theo Đề án 06 tại Công an huyện Quốc Oai',
    attachmentUrls: [],
    deliveryMethod: 'digital_pdf',
    status: 'approved',
    digitalCertificateCode: 'CBQ-CERT-9A8B7C6D5E4F',
    processedAt: '2026-10-29T14:30:00Z',
    processedBy: 'Văn thư Nhà trường (Cô Thu Hà)',
    adminNotes: 'Đã ký số điện tử và cấp mã QR xác thực hợp lệ.',
    createdAt: '2026-10-29T09:15:00Z'
  },
  {
    id: 'dvc-mock-002',
    code: 'CBQ-DVC-2026-0183',
    procedureType: 'don_xin_nghi_hoc',
    procedureTitle: 'Đơn Xin Nghỉ Học Có Phép Điện Tử (Xác Thực Phụ Huynh)',
    studentName: 'Trần Thị Mai Anh',
    studentCode: 'HS-11A3-12',
    studentClass: '11A3',
    birthDate: '22/07/2009',
    gender: 'Nữ',
    identityCard: '001209023456',
    parentName: 'Lê Thị Thu Thủy',
    parentPhone: '0983.456.789',
    parentEmail: '',
    reason: 'Cháu bị sốt siêu vi và viêm họng cấp, bác sĩ chỉ định nghỉ ngơi tĩnh dưỡng 02 ngày (Thứ 6 và Thứ 7)',
    attachmentUrls: [],
    deliveryMethod: 'digital_pdf',
    status: 'approved',
    digitalCertificateCode: 'CBQ-PERMIT-11A3-2026',
    processedAt: '2026-10-30T07:10:00Z',
    processedBy: 'GVCN Lớp 11A3 (Thầy Hoàng Nam)',
    adminNotes: 'GVCN đã xác nhận qua điện thoại với phụ huynh, cập nhật phép vào Sổ đầu bài.',
    createdAt: '2026-10-30T06:45:00Z'
  },
  {
    id: 'dvc-mock-003',
    code: 'CBQ-DVC-2026-0184',
    procedureType: 'sao_y_hoc_ba',
    procedureTitle: 'Cấp Bản Sao Học Bạ / Bản Sao Bằng Tốt Nghiệp THPT',
    studentName: 'Hoàng Quốc Bảo',
    studentCode: 'HS-12A4-08',
    studentClass: '12A4',
    birthDate: '05/11/2008',
    gender: 'Nam',
    identityCard: '001208034567',
    parentName: 'Hoàng Văn Cường',
    parentPhone: '0977.889.900',
    parentEmail: 'cuonghoang@gmail.com',
    reason: 'Xin trích sao 03 bản học bạ công chứng để nộp hồ sơ xét tuyển sớm vào Đại học Bách Khoa Hà Nội',
    attachmentUrls: [],
    deliveryMethod: 'hard_copy_at_school',
    status: 'pending',
    digitalCertificateCode: '',
    processedAt: null,
    processedBy: '',
    adminNotes: '',
    createdAt: '2026-10-30T08:30:00Z'
  }
];

// Lấy danh sách hồ sơ từ LocalStorage
function getLocalServices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PUBLIC_SERVICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Lỗi đọc local services:', e);
  }
  localStorage.setItem(STORAGE_KEY_PUBLIC_SERVICES, JSON.stringify(INITIAL_MOCK_SERVICES));
  return INITIAL_MOCK_SERVICES;
}

// Lưu danh sách hồ sơ vào LocalStorage
function saveLocalServices(services) {
  try {
    localStorage.setItem(STORAGE_KEY_PUBLIC_SERVICES, JSON.stringify(services));
  } catch (e) {
    console.error('Lỗi ghi local services:', e);
  }
}

// 1. Lấy toàn bộ danh sách hồ sơ dịch vụ công
export async function getAllPublicServices() {
  try {
    const { data, error } = await supabase
      .from('cbq_public_services')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      // Map từ cột snake_case sang camelCase
      const mapped = data.map(item => ({
        id: item.id,
        code: item.code,
        procedureType: item.procedure_type,
        procedureTitle: item.procedure_title,
        studentName: item.student_name,
        studentCode: item.student_code,
        studentClass: item.student_class,
        birthDate: item.birth_date,
        gender: item.gender || 'Nam',
        identityCard: item.identity_card,
        parentName: item.parent_name,
        parentPhone: item.parent_phone,
        parentEmail: item.parent_email,
        reason: item.reason,
        attachmentUrls: item.attachment_urls || [],
        deliveryMethod: item.delivery_method || 'digital_pdf',
        status: item.status || 'pending',
        rejectionReason: item.rejection_reason || '',
        digitalCertificateCode: item.digital_certificate_code || '',
        processedAt: item.processed_at,
        processedBy: item.processed_by || '',
        adminNotes: item.admin_notes || '',
        createdAt: item.created_at
      }));
      saveLocalServices(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Supabase DVC chưa kết nối hoặc offline, sử dụng bộ nhớ nội bộ:', err.message);
  }

  return getLocalServices();
}

// 2. Tra cứu hồ sơ theo Mã hồ sơ, Số CCCD hoặc Số điện thoại
export async function searchPublicServices(keyword) {
  const all = await getAllPublicServices();
  if (!keyword || !keyword.trim()) return all;

  const q = keyword.toLowerCase().trim();
  return all.filter(s => 
    s.code?.toLowerCase().includes(q) ||
    s.identityCard?.includes(q) ||
    s.studentName?.toLowerCase().includes(q) ||
    s.parentPhone?.includes(q) ||
    s.studentClass?.toLowerCase().includes(q)
  );
}

// 3. Tra cứu đích danh 1 hồ sơ theo Mã hồ sơ chính xác
export async function getPublicServiceByCode(code) {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const all = await getAllPublicServices();
  return all.find(s => s.code?.toUpperCase() === cleanCode) || null;
}

// 4. Nộp hồ sơ Dịch vụ công mới (Phụ huynh / Học sinh)
export async function submitPublicService(formData) {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const generatedCode = `CBQ-DVC-${currentYear}-${randomSuffix}`;

  const procedure = PUBLIC_PROCEDURES.find(p => p.id === formData.procedureType);
  const procedureTitle = procedure ? procedure.title : 'Thủ tục Hành chính Học đường';

  const newService = {
    id: 'dvc-' + Date.now(),
    code: generatedCode,
    procedureType: formData.procedureType || 'xac_nhan_hoc_sinh',
    procedureTitle: procedureTitle,
    studentName: formData.studentName?.trim() || '',
    studentCode: formData.studentCode?.trim() || '',
    studentClass: formData.studentClass?.trim() || '',
    birthDate: formData.birthDate?.trim() || '',
    gender: formData.gender || 'Nam',
    identityCard: formData.identityCard?.trim() || '',
    parentName: formData.parentName?.trim() || '',
    parentPhone: formData.parentPhone?.trim() || '',
    parentEmail: formData.parentEmail?.trim() || '',
    reason: formData.reason?.trim() || '',
    attachmentUrls: formData.attachmentUrls || [],
    deliveryMethod: formData.deliveryMethod || 'digital_pdf',
    status: 'pending',
    rejectionReason: '',
    digitalCertificateCode: '',
    processedAt: null,
    processedBy: '',
    adminNotes: '',
    createdAt: new Date().toISOString()
  };

  // Cố gắng ghi vào Supabase
  try {
    const { data, error } = await supabase
      .from('cbq_public_services')
      .insert([{
        code: newService.code,
        procedure_type: newService.procedureType,
        procedure_title: newService.procedureTitle,
        student_name: newService.studentName,
        student_code: newService.studentCode,
        student_class: newService.studentClass,
        birth_date: newService.birthDate,
        gender: newService.gender,
        identity_card: newService.identityCard,
        parent_name: newService.parentName,
        parent_phone: newService.parentPhone,
        parent_email: newService.parentEmail,
        reason: newService.reason,
        attachment_urls: newService.attachmentUrls,
        delivery_method: newService.deliveryMethod,
        status: newService.status
      }])
      .select()
      .single();

    if (!error && data) {
      newService.id = data.id;
    }
  } catch (err) {
    console.warn('Lỗi ghi Supabase DVC (đang lưu LocalStorage):', err.message);
  }

  // Cập nhật LocalStorage
  const localList = getLocalServices();
  const updatedList = [newService, ...localList];
  saveLocalServices(updatedList);

  return newService;
}

// 5. Cập nhật trạng thái hồ sơ (Duyệt, Từ chối, Đã cấp mộc số)
export async function updatePublicServiceStatus(id, newStatus, details = {}) {
  const now = new Date().toISOString();
  let digitalCode = details.digitalCertificateCode;
  
  if (newStatus === 'approved' && !digitalCode) {
    // Tự sinh mã chứng thực điện tử SHA nếu duyệt
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    digitalCode = `CBQ-CERT-${new Date().getFullYear()}-${hash}`;
  }

  // Cố gắng cập nhật trên Supabase
  try {
    await supabase
      .from('cbq_public_services')
      .update({
        status: newStatus,
        digital_certificate_code: digitalCode || null,
        rejection_reason: details.rejectionReason || null,
        processed_at: now,
        processed_by: details.processedBy || 'Văn thư / BGH Trường THPT Cao Bá Quát',
        admin_notes: details.adminNotes || null,
        updated_at: now
      })
      .eq('id', id);
  } catch (err) {
    console.warn('Lỗi cập nhật Supabase DVC:', err.message);
  }

  // Cập nhật LocalStorage
  const localList = getLocalServices();
  const updatedList = localList.map(s => {
    if (s.id === id) {
      return {
        ...s,
        status: newStatus,
        digitalCertificateCode: digitalCode || s.digitalCertificateCode,
        rejectionReason: details.rejectionReason || '',
        processedAt: now,
        processedBy: details.processedBy || 'Văn thư / BGH Trường THPT Cao Bá Quát',
        adminNotes: details.adminNotes || s.adminNotes
      };
    }
    return s;
  });

  saveLocalServices(updatedList);
  return updatedList.find(s => s.id === id);
}

// 6. Xóa hồ sơ
export async function deletePublicService(id) {
  try {
    await supabase.from('cbq_public_services').delete().eq('id', id);
  } catch (err) {
    console.warn('Lỗi xóa Supabase DVC:', err.message);
  }

  const localList = getLocalServices();
  const updatedList = localList.filter(s => s.id !== id);
  saveLocalServices(updatedList);
  return true;
}

// 7. Xuất file Excel danh sách Dịch Vụ Công theo quy tắc tiền tố 1-... trong GEMINI.md
export function exportPublicServicesExcel(servicesList) {
  if (!servicesList || servicesList.length === 0) {
    alert("Không có hồ sơ dịch vụ công nào để xuất Excel!");
    return;
  }

  const excelRows = servicesList.map((item, idx) => ({
    "STT": idx + 1,
    "Mã hồ sơ": item.code,
    "Thủ tục hành chính": item.procedureTitle,
    "Họ và Tên học sinh": item.studentName,
    "Lớp": item.studentClass,
    "Số CCCD": item.identityCard || '---',
    "Ngày sinh": item.birthDate || '---',
    "Họ tên Phụ huynh": item.parentName,
    "SĐT Phụ huynh / Zalo": item.parentPhone,
    "Mục đích / Lý do": item.reason,
    "Trạng thái xử lý": item.status === 'approved' ? 'Đã phê duyệt / Cấp giấy' : item.status === 'rejected' ? 'Từ chối (Cần bổ sung)' : item.status === 'processing' ? 'Đang thẩm định' : 'Chờ tiếp nhận',
    "Mã chứng thực số": item.digitalCertificateCode || '---',
    "Người xử lý": item.processedBy || '---',
    "Thời gian nộp": new Date(item.createdAt).toLocaleString('vi-VN')
  }));

  const ws = XLSX.utils.json_to_sheet(excelRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dich_Vu_Cong_CBQ");

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const fileName = `1-Danh_sach_ho_so_dich_vu_cong_truong_CBQ_${todayStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
