/**
 * HỆ SINH THÁI ĐIỀU HÀNH & TIỆN ÍCH SỐ THPT CAO BÁ QUÁT
 * Bộ Dịch Vụ Văn Phòng Điện Tử e-Office Desk (Văn Bản Đi - Đến, Bút Phê & Giám Sát Tiến Độ AI)
 * Tuân thủ quy chuẩn Nghị định 30/2020/NĐ-CP & Quyết định 28/2018/QĐ-TTg
 */

import { supabase } from '../lib/supabase';
import { getStoredAiKey, getStoredAiModel } from './aiAssistantService';
import * as XLSX from 'xlsx';

const STORAGE_KEY_DOCS_IN = 'cbq_eoffice_docs_in_v1';
const STORAGE_KEY_DOCS_OUT = 'cbq_eoffice_docs_out_v1';
const STORAGE_KEY_TASKS = 'cbq_eoffice_tasks_v1';

// MẪU DỮ LIỆU KHỞI TẠO CHUẨN CÔNG VĂN SỞ & NỘI BỘ TRƯỜNG THPT CAO BÁ QUÁT
export const INITIAL_DOCS_IN = [
  {
    id: 'doc-in-001',
    in_number: 1,
    doc_code: '412/SGDĐT-GDTrH-GDTX',
    issued_date: '2026-11-05',
    received_date: '2026-11-06T08:30:00Z',
    sender_org: 'Sở Giáo dục và Đào tạo Đắk Lắk',
    summary: 'V/v Hướng dẫn tổ chức kỳ thi thử tốt nghiệp THPT năm 2027 và tập huấn ma trận đề thi trắc nghiệm định dạng mới Bộ GD&ĐT',
    doc_type: 'Công văn',
    urgency: 'urgent', // urgent, super_urgent, express, normal
    security_level: 'normal',
    deadline: '2026-11-20T17:00:00Z',
    signer_name: 'Phạm Đăng Khoa - Giám đốc',
    main_file_url: 'https://thptcaobaquat.edu.vn/docs/412_SGDDT_HuongDanThiTotNghiep2027.pdf',
    main_file_name: '412_SGDDT_HuongDanThiTotNghiep2027.pdf',
    attachments: [
      { name: 'Phu_luc_1_Ma_tran_dac_ta_de_thi.docx', size: '145 KB', type: 'word' },
      { name: 'Phu_luc_2_Lich_thi_va_nop_so_lieu.xlsx', size: '82 KB', type: 'excel' }
    ],
    status: 'endorsed', // new, endorsed, in_progress, completed
    endorsement: {
      leader_name: 'Thầy Hiệu Trưởng',
      leader_role: 'principal',
      directive: 'Giao Thầy PHT Chuyên môn chỉ đạo các Tổ trưởng Toán, Văn, Anh nghiên cứu ma trận, triển khai ứng dụng Chấm thi 2027 của trường và hoàn thành kế hoạch báo cáo Sở trước 18/11.',
      main_department: 'Tổ Toán - Tin',
      main_assignee_name: 'Lê Văn Hoàng (Tổ trưởng Toán)',
      co_assignees: ['Nguyễn Thị Mai (Tổ Văn)', 'Trần Quốc Tuấn (Tổ Anh)'],
      deadline: '2026-11-18T17:00:00Z',
      endorsed_at: '2026-11-06T14:15:00Z'
    },
    digital_signature_info: {
      is_signed: true,
      signer: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐẮK LẮK',
      signed_date: '05/11/2026 16:42:10',
      certificate_authority: 'Ban Cơ yếu Chính phủ (VGCA)',
      is_valid: true
    },
    created_by: 'Nguyễn Thị Hoa (Văn thư)',
    school_year: '2026-2027'
  },
  {
    id: 'doc-in-002',
    in_number: 2,
    doc_code: '158/KH-UBND',
    issued_date: '2026-11-02',
    received_date: '2026-11-03T09:10:00Z',
    sender_org: 'UBND Huyện Cư M\'gar',
    summary: 'Kế hoạch kiểm tra liên ngành về công tác phòng cháy chữa cháy, an toàn vệ sinh thực phẩm bếp sáng và phương tiện xe máy học sinh tại các trường THPT',
    doc_type: 'Kế hoạch',
    urgency: 'express', // Hỏa tốc
    security_level: 'normal',
    deadline: '2026-11-15T11:30:00Z',
    signer_name: 'Vũ Hồng Nhân - Chủ tịch',
    main_file_url: 'https://thptcaobaquat.edu.vn/docs/158_KH_UBND_KiemTraPCCC_Cantin.pdf',
    main_file_name: '158_KH_UBND_KiemTraPCCC_Cantin.pdf',
    attachments: [
      { name: 'Bang_kiem_tra_danh_muc_tieu_chuan.pdf', size: '210 KB', type: 'pdf' }
    ],
    status: 'in_progress',
    endorsement: {
      leader_name: 'Thầy Hiệu Trưởng',
      leader_role: 'principal',
      directive: 'HỎA TỐC: Giao Đoàn trường phối hợp BQL Bếp sáng và bảo vệ rà soát vé xe máy, kiểm tra bình PCCC trước ngày 12/11.',
      main_department: 'Đoàn Trường',
      main_assignee_name: 'Bí thư Đoàn Trường',
      co_assignees: ['Bộ phận Canteen & Bếp sáng', 'Tổ Bảo vệ'],
      deadline: '2026-11-12T17:00:00Z',
      endorsed_at: '2026-11-03T10:00:00Z'
    },
    digital_signature_info: {
      is_signed: true,
      signer: 'ỦY BAN NHÂN DÂN HUYỆN CƯ M\'GAR',
      signed_date: '02/11/2026 15:20:05',
      certificate_authority: 'Ban Cơ yếu Chính phủ (VGCA)',
      is_valid: true
    },
    created_by: 'Nguyễn Thị Hoa (Văn thư)',
    school_year: '2026-2027'
  },
  {
    id: 'doc-in-003',
    in_number: 3,
    doc_code: '890/TB-SGDĐT',
    issued_date: '2026-11-07',
    received_date: '2026-11-08T07:45:00Z',
    sender_org: 'Sở Giáo dục và Đào tạo Đắk Lắk',
    summary: 'Thông báo về việc triệu tập cán bộ quản lý tham dự Hội nghị chuyển đổi số và ứng dụng Trí tuệ Nhân tạo (AI) trong quản trị trường học năm học 2026 - 2027',
    doc_type: 'Thông báo',
    urgency: 'normal',
    security_level: 'normal',
    deadline: '2026-11-25T08:00:00Z',
    signer_name: 'Lê Thị Kim Oanh - Phó Giám đốc',
    main_file_url: 'https://thptcaobaquat.edu.vn/docs/890_TB_SGDDT_HoiNghiChuyenDoiSo.pdf',
    main_file_name: '890_TB_SGDDT_HoiNghiChuyenDoiSo.pdf',
    attachments: [],
    status: 'new', // Chờ BGH bút phê
    endorsement: null,
    digital_signature_info: {
      is_signed: true,
      signer: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐẮK LẮK',
      signed_date: '07/11/2026 17:10:00',
      certificate_authority: 'Ban Cơ yếu Chính phủ (VGCA)',
      is_valid: true
    },
    created_by: 'Nguyễn Thị Hoa (Văn thư)',
    school_year: '2026-2027'
  }
];

export const INITIAL_DOCS_OUT = [
  {
    id: 'doc-out-001',
    out_number: 85,
    doc_code: '85/BC-THPTCBQ',
    doc_type: 'Báo cáo',
    summary: 'Báo cáo kết quả triển khai chuyển đổi số, chữ ký số và ứng dụng phần mềm chấm trắc nghiệm di động học kỳ I năm học 2026 - 2027',
    drafted_by: 'Thầy Phó Hiệu Trưởng',
    department_name: 'Ban Giám Hiệu',
    recipient_org: 'Sở Giáo dục và Đào tạo Đắk Lắk',
    issued_date: '2026-11-04',
    signer_name: 'Lê Văn Kiệt',
    signer_title: 'Hiệu trưởng',
    signed_file_url: 'https://thptcaobaquat.edu.vn/docs/85_BC_THPTCBQ_ChuyenDoiSo.pdf',
    draft_file_url: '',
    status: 'dispatched', // drafting, dept_review, leader_review, signed_ready, dispatched
    digital_signature_info: {
      is_signed: true,
      signer: 'TRƯỜNG THPT CAO BÁ QUÁT - TỈNH ĐẮK LẮK',
      signed_date: '04/11/2026 15:30:12',
      certificate_authority: 'VNPT SmartCA / Ban Cơ yếu',
      is_valid: true
    },
    school_year: '2026-2027'
  },
  {
    id: 'doc-out-002',
    out_number: 86,
    doc_code: '86/KH-THPTCBQ',
    doc_type: 'Kế hoạch',
    summary: 'Kế hoạch tổ chức Lễ mít tinh kỷ niệm Ngày Nhà giáo Việt Nam 20/11 và Vinh danh 30 năm phát triển trường THPT Cao Bá Quát',
    drafted_by: 'Bí thư Đoàn Trường',
    department_name: 'Đoàn Thanh Niên & Công Đoàn',
    recipient_org: 'Toàn thể Cán bộ, Giáo viên, Nhân viên và Học sinh',
    issued_date: '2026-11-06',
    signer_name: 'Lê Văn Kiệt',
    signer_title: 'Hiệu trưởng',
    signed_file_url: 'https://thptcaobaquat.edu.vn/docs/86_KH_THPTCBQ_KyNiem20_11.pdf',
    draft_file_url: '',
    status: 'signed_ready',
    digital_signature_info: {
      is_signed: true,
      signer: 'TRƯỜNG THPT CAO BÁ QUÁT - TỈNH ĐẮK LẮK',
      signed_date: '06/11/2026 10:15:40',
      certificate_authority: 'VNPT SmartCA / Ban Cơ yếu',
      is_valid: true
    },
    school_year: '2026-2027'
  }
];

export const INITIAL_TASKS = [
  {
    id: 'task-001',
    document_id: 'doc-in-001',
    doc_code: '412/SGDĐT-GDTrH-GDTX',
    doc_summary: 'V/v Hướng dẫn tổ chức kỳ thi thử tốt nghiệp THPT năm 2027 và tập huấn ma trận đề thi trắc nghiệm',
    assignee_name: 'Lê Văn Hoàng (Tổ trưởng Toán)',
    department_name: 'Tổ Toán - Tin',
    is_main_assignee: true,
    progress_percent: 75,
    status: 'in_progress', // assigned, in_progress, reported, approved
    deadline: '2026-11-18T17:00:00Z',
    report_notes: 'Đã hoàn thành phân công 4 giáo viên ra đề thi thử theo đúng ma trận cấu trúc 3 phần mới của Bộ GD&ĐT.',
    report_file_url: '',
    reported_at: '2026-11-07T16:00:00Z'
  },
  {
    id: 'task-002',
    document_id: 'doc-in-002',
    doc_code: '158/KH-UBND',
    doc_summary: 'Kế hoạch kiểm tra liên ngành PCCC, an toàn thực phẩm bếp sáng và xe máy học sinh',
    assignee_name: 'Bí thư Đoàn Trường',
    department_name: 'Đoàn Trường',
    is_main_assignee: true,
    progress_percent: 50,
    status: 'in_progress',
    deadline: '2026-11-12T17:00:00Z',
    report_notes: 'Đã kiểm tra 100% bình bọt PCCC dãy A và B; đã rà soát vé xe máy 3 khối.',
    report_file_url: '',
    reported_at: '2026-11-06T11:00:00Z'
  }
];

// =========================================================================
// 1. CÁC HÀM XỬ LÝ LƯU TRỮ VÀ ĐỌC DỮ LIỆU (LOCAL STORAGE + SUPABASE FALLBACK)
// =========================================================================

export async function getDocumentsIn() {
  try {
    const { data, error } = await supabase
      .from('cbq_official_documents_in')
      .select('*')
      .order('in_number', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Lỗi kết nối Supabase cbq_official_documents_in, chuyển sang bộ nhớ cục bộ:', err);
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_DOCS_IN);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  localStorage.setItem(STORAGE_KEY_DOCS_IN, JSON.stringify(INITIAL_DOCS_IN));
  return INITIAL_DOCS_IN;
}

export async function saveDocumentIn(docData) {
  const currentDocs = await getDocumentsIn();
  let updatedDocs;

  if (docData.id) {
    updatedDocs = currentDocs.map(d => d.id === docData.id ? { ...d, ...docData, updated_at: new Date().toISOString() } : d);
  } else {
    // Tự động tính số đến tiếp theo
    const maxNum = currentDocs.reduce((max, d) => Math.max(max, Number(d.in_number) || 0), 0);
    const newDoc = {
      ...docData,
      id: 'doc-in-' + Date.now(),
      in_number: maxNum + 1,
      received_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: docData.status || 'new',
      school_year: docData.school_year || '2026-2027'
    };
    updatedDocs = [newDoc, ...currentDocs];
  }

  localStorage.setItem(STORAGE_KEY_DOCS_IN, JSON.stringify(updatedDocs));

  // Đồng bộ ngầm lên Supabase nếu có bảng
  try {
    const toSync = docData.id ? docData : updatedDocs[0];
    await supabase.from('cbq_official_documents_in').upsert([toSync]);
  } catch (e) {}

  return updatedDocs;
}

export async function deleteDocumentIn(docId) {
  const currentDocs = await getDocumentsIn();
  const updated = currentDocs.filter(d => d.id !== docId);
  localStorage.setItem(STORAGE_KEY_DOCS_IN, JSON.stringify(updated));
  try {
    await supabase.from('cbq_official_documents_in').delete().eq('id', docId);
  } catch (e) {}
  return updated;
}

// Bút phê của BGH cho công văn đến
export async function endorseDocumentIn(docId, endorsementData) {
  const currentDocs = await getDocumentsIn();
  const doc = currentDocs.find(d => d.id === docId);
  if (!doc) throw new Error('Không tìm thấy công văn cần bút phê');

  const updatedDoc = {
    ...doc,
    status: 'endorsed',
    endorsement: {
      ...endorsementData,
      endorsed_at: new Date().toISOString()
    }
  };

  const updatedDocs = currentDocs.map(d => d.id === docId ? updatedDoc : d);
  localStorage.setItem(STORAGE_KEY_DOCS_IN, JSON.stringify(updatedDocs));

  // Tự động tạo Task nhiệm vụ cho người chủ trì và người phối hợp
  const currentTasks = await getDocumentTasks();
  const newTasks = [];

  if (endorsementData.main_assignee_name) {
    newTasks.push({
      id: 'task-' + Date.now() + '-main',
      document_id: docId,
      doc_code: doc.doc_code,
      doc_summary: doc.summary,
      assignee_name: endorsementData.main_assignee_name,
      department_name: endorsementData.main_department || 'Tổ Chuyên Môn',
      is_main_assignee: true,
      progress_percent: 0,
      status: 'assigned',
      deadline: endorsementData.deadline,
      report_notes: '',
      report_file_url: '',
      created_at: new Date().toISOString()
    });
  }

  if (Array.isArray(endorsementData.co_assignees)) {
    endorsementData.co_assignees.forEach((coName, idx) => {
      if (coName && coName.trim()) {
        newTasks.push({
          id: 'task-' + Date.now() + '-co-' + idx,
          document_id: docId,
          doc_code: doc.doc_code,
          doc_summary: doc.summary,
          assignee_name: coName.trim(),
          department_name: endorsementData.main_department || 'Tổ Chuyên Môn',
          is_main_assignee: false,
          progress_percent: 0,
          status: 'assigned',
          deadline: endorsementData.deadline,
          report_notes: '',
          report_file_url: '',
          created_at: new Date().toISOString()
        });
      }
    });
  }

  const updatedTasks = [...newTasks, ...currentTasks];
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updatedTasks));

  try {
    await supabase.from('cbq_official_documents_in').update({
      status: 'endorsed',
      endorsement: updatedDoc.endorsement
    }).eq('id', docId);
  } catch (e) {}

  return { updatedDocs, updatedTasks };
}

// Lấy danh sách nhiệm vụ của giáo viên / toàn trường
export async function getDocumentTasks() {
  try {
    const { data, error } = await supabase
      .from('cbq_document_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}

  try {
    const local = localStorage.getItem(STORAGE_KEY_TASKS);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
  return INITIAL_TASKS;
}

export async function updateDocumentTask(taskId, updateData) {
  const currentTasks = await getDocumentTasks();
  const updatedTasks = currentTasks.map(t => {
    if (t.id === taskId) {
      const progress = Number(updateData.progress_percent) || t.progress_percent;
      let newStatus = t.status;
      if (progress >= 100) newStatus = 'reported';
      else if (progress > 0) newStatus = 'in_progress';

      return {
        ...t,
        ...updateData,
        status: updateData.status || newStatus,
        reported_at: new Date().toISOString()
      };
    }
    return t;
  });

  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updatedTasks));
  return updatedTasks;
}

// Sổ văn bản đi
export async function getDocumentsOut() {
  try {
    const { data, error } = await supabase
      .from('cbq_official_documents_out')
      .select('*')
      .order('out_number', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}

  try {
    const local = localStorage.getItem(STORAGE_KEY_DOCS_OUT);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  localStorage.setItem(STORAGE_KEY_DOCS_OUT, JSON.stringify(INITIAL_DOCS_OUT));
  return INITIAL_DOCS_OUT;
}

export async function saveDocumentOut(docData) {
  const currentDocs = await getDocumentsOut();
  let updatedDocs;

  if (docData.id) {
    updatedDocs = currentDocs.map(d => d.id === docData.id ? { ...d, ...docData, updated_at: new Date().toISOString() } : d);
  } else {
    const maxNum = currentDocs.reduce((max, d) => Math.max(max, Number(d.out_number) || 0), 0);
    const nextNum = maxNum + 1;
    
    // Tự sinh số ký hiệu chuẩn theo Nghị định 30 (VD: 87/KH-THPTCBQ, 87/BC-THPTCBQ)
    const typeAbbr = getDocTypeAbbreviation(docData.doc_type || 'Công văn');
    const autoCode = `${nextNum}/${typeAbbr}-THPTCBQ`;

    const newDoc = {
      ...docData,
      id: 'doc-out-' + Date.now(),
      out_number: nextNum,
      doc_code: docData.doc_code || autoCode,
      issued_date: docData.issued_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      status: docData.status || 'signed_ready',
      school_year: docData.school_year || '2026-2027'
    };
    updatedDocs = [newDoc, ...currentDocs];
  }

  localStorage.setItem(STORAGE_KEY_DOCS_OUT, JSON.stringify(updatedDocs));
  return updatedDocs;
}

export async function deleteDocumentOut(docId) {
  const currentDocs = await getDocumentsOut();
  const updated = currentDocs.filter(d => d.id !== docId);
  localStorage.setItem(STORAGE_KEY_DOCS_OUT, JSON.stringify(updated));
  return updated;
}

function getDocTypeAbbreviation(docType) {
  const map = {
    'Công văn': 'CV',
    'Kế hoạch': 'KH',
    'Quyết định': 'QĐ',
    'Báo cáo': 'BC',
    'Thông báo': 'TB',
    'Tờ trình': 'TTr',
    'Hướng dẫn': 'HD',
    'Giấy mời': 'GM',
    'Quy chế': 'QC'
  };
  return map[docType] || 'CV';
}

// =========================================================================
// 2. TRỢ LÝ AI GEMINI BÓC TÁCH CÔNG VĂN SIÊU TỐC TỪ FILE PDF / ẢNH SCAN
// =========================================================================

/**
 * Phân tích tệp công văn bằng AI Gemini để trích xuất tự động:
 * - Số ký hiệu
 * - Ngày ban hành
 * - Cơ quan gửi
 * - Trích yếu
 * - Độ khẩn, Hạn xử lý
 * - Người ký & Gợi ý bộ phận xử lý
 */
export async function extractDocumentWithAI(base64Data, mimeType, fileName = '') {
  const apiKey = getStoredAiKey();
  if (!apiKey) {
    throw new Error('Chưa cài đặt API Key Gemini. Vui lòng cài đặt API Key trong Cài đặt hệ thống để kích hoạt Trợ lý bóc tách công văn AI.');
  }

  const model = getStoredAiModel() || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `Bạn là Chuyên gia Văn thư Lưu trữ & Quản lý Hành chính Công vụ giỏi nhất Việt Nam, chuyên sâu theo Nghị định 30/2020/NĐ-CP.
Hãy đọc tài liệu công văn/văn bản đính kèm này (tên file: "${fileName}") và bóc tách các trường thông tin chuẩn xác 100% để vào Sổ Công Văn Đến.

Yêu cầu trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json hay giải thích nào khác), với cấu trúc sau:
{
  "doc_code": "Số và ký hiệu văn bản chính xác (VD: 1425/SGDĐT-GDTrH-GDTX hoặc 89/KH-UBND)",
  "issued_date": "Ngày tháng năm ban hành định dạng YYYY-MM-DD (VD: 2026-11-05)",
  "sender_org": "Tên cơ quan ban hành đầy đủ viết hoa (VD: SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK, UBND HUYỆN CƯ M'GAR...)",
  "summary": "Trích yếu nội dung ngắn gọn, súc tích, phản ánh đúng mục đích văn bản (bắt đầu bằng V/v... nếu là công văn)",
  "doc_type": "Một trong các loại: Công văn | Kế hoạch | Quyết định | Thông báo | Hướng dẫn | Giấy mời | Tờ trình | Báo cáo",
  "urgency": "normal (Thường) | urgent (Khẩn) | super_urgent (Thượng khẩn) | express (Hỏa tốc)",
  "deadline": "Hạn xử lý hoặc hạn nộp báo cáo nếu văn bản có yêu cầu, định dạng YYYY-MM-DD, nếu không có để null",
  "signer_name": "Họ tên và chức vụ người ký (VD: Phạm Đăng Khoa - Giám đốc)",
  "suggested_department": "Gợi ý tổ chuyên môn hoặc bộ phận phụ trách phù hợp nhất trong trường THPT (VD: Tổ Toán - Tin, Tổ Ngữ Văn, Tổ Ngoại Ngữ, Đoàn Trường, Công Đoàn, Bộ Phận Bếp Sáng, Văn Phòng)",
  "suggested_directive": "Gợi ý nội dung bút phê chỉ đạo ngắn gọn, sắc bén dành cho Hiệu trưởng"
}`;

  let contentsPayload;

  // Nếu là file đính kèm dạng Base64
  if (base64Data) {
    const cleanBase64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
    contentsPayload = [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType || 'application/pdf',
              data: cleanBase64
            }
          }
        ]
      }
    ];
  } else {
    // Nếu chỉ có text mô tả hoặc tên file
    contentsPayload = [
      {
        parts: [{ text: `${prompt}\nTên văn bản: ${fileName}` }]
      }
    ];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: contentsPayload,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google AI API Error (${response.status}): ${errText}`);
  }

  const resData = await response.json();
  const textOutput = resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
  
  try {
    const cleanedJson = textOutput.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleanedJson);
  } catch (e) {
    console.error('Lỗi parse JSON bóc tách AI:', textOutput);
    throw new Error('AI không thể bóc tách cấu trúc văn bản. Vui lòng kiểm tra lại file đính kèm.');
  }
}

// =========================================================================
// 3. XUẤT SỔ CÔNG VĂN ĐI / ĐẾN RA EXCEL CHUẨN NGHỊ ĐỊNH 30
// Tuân thủ quy tắc số thứ tự file tải về: 1-Tên_file...
// =========================================================================

export function exportDocumentsRegistryToExcel(docs, type = 'in') {
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new Error('Không có dữ liệu văn bản để xuất file.');
  }

  const isDocIn = type === 'in';
  const rows = docs.map((d, idx) => {
    if (isDocIn) {
      return {
        'STT': idx + 1,
        'Số Đến': d.in_number || (idx + 1),
        'Ngày Đến': d.received_date ? new Date(d.received_date).toLocaleDateString('vi-VN') : '',
        'Tác Giả / Cơ Quan Ban Hành': d.sender_org || '',
        'Số / Ký Hiệu Gốc': d.doc_code || '',
        'Ngày Ban Hành': d.issued_date ? new Date(d.issued_date).toLocaleDateString('vi-VN') : '',
        'Tên Loại & Trích Yếu Nội Dung': d.summary || '',
        'Mức Độ Khẩn': getUrgencyLabel(d.urgency),
        'Hạn Xử Lý': d.deadline ? new Date(d.deadline).toLocaleDateString('vi-VN') : 'Không',
        'Ý Kiến Bút Phê Của BGH': d.endorsement?.directive || 'Chưa bút phê',
        'Đơn Vị / Người Nhận Việc': d.endorsement?.main_assignee_name ? `${d.endorsement.main_assignee_name} (${d.endorsement.main_department})` : 'Chưa phân công',
        'Trạng Thái Thực Hiện': getStatusLabel(d.status),
        'Ghi Chú': d.digital_signature_info?.is_signed ? 'Đã ký số' : ''
      };
    } else {
      return {
        'STT': idx + 1,
        'Số Văn Bản Đi': d.out_number || (idx + 1),
        'Số / Ký Hiệu': d.doc_code || '',
        'Ngày Ban Hành': d.issued_date ? new Date(d.issued_date).toLocaleDateString('vi-VN') : '',
        'Tên Loại & Trích Yếu Nội Dung': d.summary || '',
        'Đơn Vị Soạn Thảo': d.department_name || '',
        'Người Soạn': d.drafted_by || '',
        'Người Ký': d.signer_name ? `${d.signer_name} (${d.signer_title || 'Hiệu trưởng'})` : '',
        'Nơi Nhận Văn Bản': d.recipient_org || '',
        'Trạng Thái Phát Hành': d.status === 'dispatched' ? 'Đã phát hành gửi Sở' : 'Đã ký số chờ phát hành',
        'Chữ Ký Số': d.digital_signature_info?.is_signed ? 'Hợp lệ (VNPT SmartCA)' : 'Bản thường'
      };
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  
  const sheetName = isDocIn ? 'So_Van_Ban_Den' : 'So_Van_Ban_Di';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Định dạng độ rộng cột tối ưu
  const colWidths = isDocIn ? [
    { wch: 6 },  // STT
    { wch: 10 }, // Số Đến
    { wch: 12 }, // Ngày Đến
    { wch: 28 }, // Cơ Quan
    { wch: 22 }, // Số Ký Hiệu
    { wch: 14 }, // Ngày Ban Hành
    { wch: 45 }, // Trích Yếu
    { wch: 14 }, // Độ Khẩn
    { wch: 14 }, // Hạn Xử Lý
    { wch: 35 }, // Bút Phê
    { wch: 28 }, // Người Nhận
    { wch: 18 }, // Trạng Thái
    { wch: 12 }  // Ghi Chú
  ] : [
    { wch: 6 },  // STT
    { wch: 12 }, // Số Đi
    { wch: 22 }, // Số Ký Hiệu
    { wch: 14 }, // Ngày Ban Hành
    { wch: 45 }, // Trích Yếu
    { wch: 22 }, // Đơn Vị Soạn
    { wch: 20 }, // Người Soạn
    { wch: 24 }, // Người Ký
    { wch: 30 }, // Nơi Nhận
    { wch: 22 }, // Trạng Thái
    { wch: 24 }  // Ký Số
  ];
  worksheet['!cols'] = colWidths;

  // TUÂN THỦ QUY TẮC ĐẶT TÊN TỆP THEO GEMINI.MD: 1-Tên_file...
  const fileName = isDocIn 
    ? '1-So_dang_ky_van_ban_den_THPT_Cao_Ba_Quat.xlsx' 
    : '1-So_dang_ky_van_ban_di_THPT_Cao_Ba_Quat.xlsx';

  XLSX.writeFile(workbook, fileName);
  return fileName;
}

export function getUrgencyLabel(urgency) {
  switch (urgency) {
    case 'express': return '⚡ HỎA TỐC';
    case 'super_urgent': return '🔥 Thượng Khẩn';
    case 'urgent': return '⚠️ Khẩn';
    default: return 'Bình thường';
  }
}

export function getUrgencyColor(urgency) {
  switch (urgency) {
    case 'express': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
    case 'super_urgent': return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
    case 'urgent': return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
    default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'new': return 'Chờ BGH bút phê';
    case 'endorsed': return 'Đã bút phê - Chờ xử lý';
    case 'in_progress': return 'Đang thực hiện';
    case 'completed': return 'Đã hoàn thành';
    case 'archived': return 'Đã lưu trữ';
    default: return status;
  }
}

export function getStatusColor(status) {
  switch (status) {
    case 'new': return { bg: '#dbeafe', text: '#1d4ed8' };
    case 'endorsed': return { bg: '#fef9c3', text: '#854d0e' };
    case 'in_progress': return { bg: '#ffedd5', text: '#c2410c' };
    case 'completed': return { bg: '#dcfce7', text: '#15803d' };
    default: return { bg: '#f1f5f9', text: '#475569' };
  }
}
