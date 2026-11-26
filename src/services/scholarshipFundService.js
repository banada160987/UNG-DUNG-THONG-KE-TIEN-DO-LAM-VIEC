// =========================================================================
// SERVICE: QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ" - THPT CAO BÁ QUÁT
// Quản lý hồ sơ học sinh, xét duyệt, sổ quỹ thu chi và xuất file chuẩn NĐ30
// =========================================================================

import { supabase } from '../lib/supabase';
import { safeStorage } from '../utils/safeStorage';
import * as XLSX from 'xlsx';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  Packer
} from 'docx';

const STORAGE_KEY_APPS = 'cbq_fund_applications_cache';
const STORAGE_KEY_TRANS = 'cbq_fund_transactions_cache';
const STORAGE_KEY_SETTINGS = 'cbq_fund_settings_cache';

const DEFAULT_SETTINGS = {
  id: 'default',
  is_open_application: true,
  application_deadline: '2026-12-31',
  current_term_name: 'Đợt 1 - Năm học 2026-2027',
  bank_name: 'Vietcombank',
  bank_account_number: '1028688888',
  bank_account_name: 'QUY HOC BONG CHAP CANH UOC MO THPT CAO BA QUAT',
  bank_branch: 'Chi nhánh Gia Lâm - Hà Nội',
  qr_template: 'compact2',
  hotline: '024.3827.1856',
  default_scholarship_amount: 2000000
};

// ======================= 1. HỒ SƠ HỌC SINH =======================

export async function fetchScholarshipApplications() {
  try {
    const { data, error } = await supabase
      .from('cbq_scholarship_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      safeStorage.setItem(STORAGE_KEY_APPS, data);
      return data;
    }
  } catch (err) {
    console.warn('[FundService] Fallback cache hồ sơ học sinh:', err);
  }

  const cached = safeStorage.getItem(STORAGE_KEY_APPS);
  return Array.isArray(cached) ? cached : [];
}

export async function submitScholarshipApplication(formData) {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const timeCode = Date.now().toString(36).toUpperCase().slice(-3);
  const cleanClass = (formData.student_class || '10A01').trim().toUpperCase();
  const application_code = `HS-CCUM-${currentYear}-${cleanClass}-${timeCode}${randomSuffix}`;

  const payload = {
    ...formData,
    application_code,
    status: 'pending',
    granted_amount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('cbq_scholarship_applications')
      .insert([payload])
      .select()
      .maybeSingle();

    if (!error && data) {
      // Cập nhật cache
      const cached = safeStorage.getItem(STORAGE_KEY_APPS) || [];
      safeStorage.setItem(STORAGE_KEY_APPS, [data, ...cached]);
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[FundService] Lưu local hồ sơ học sinh:', err);
  }

  // Fallback lưu local nếu bảng Supabase chưa có
  payload.id = 'local_' + Date.now();
  const cached = safeStorage.getItem(STORAGE_KEY_APPS) || [];
  const updatedList = [payload, ...cached];
  safeStorage.setItem(STORAGE_KEY_APPS, updatedList);
  return { success: true, data: payload, isOffline: true };
}

export async function reviewScholarshipApplication(id, reviewData) {
  const payload = {
    status: reviewData.status, // 'approved' | 'rejected' | 'pending'
    granted_amount: Number(reviewData.granted_amount) || 0,
    granted_item: reviewData.granted_item || '',
    scholarship_term: reviewData.scholarship_term || 'Đợt 1 - Năm học 2026-2027',
    review_note: reviewData.review_note || '',
    approved_by: reviewData.approved_by || 'Ban Giám Hiệu & Hội Đồng Quỹ',
    approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('cbq_scholarship_applications')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (!error && data) {
      const cached = safeStorage.getItem(STORAGE_KEY_APPS) || [];
      const updated = cached.map(item => item.id === id ? { ...item, ...data } : item);
      safeStorage.setItem(STORAGE_KEY_APPS, updated);

      // Nếu duyệt trao học bổng, tự động ghi một khoản Chi vào Sổ Quỹ
      if (payload.status === 'approved' && payload.granted_amount > 0) {
        await recordFundTransaction({
          trans_type: 'expense',
          amount: payload.granted_amount,
          donor_or_recipient: `${data.student_name} (${data.student_class})`,
          category: 'Chi trao học bổng Chắp cánh ước mơ',
          receipt_code: `PC-HB-${data.application_code || id.slice(0, 8)}`,
          trans_date: new Date().toISOString().split('T')[0],
          note: `Trao học bổng ${payload.scholarship_term} cho học sinh ${data.student_name}. Hoàn cảnh: ${data.category}`,
          recorded_by: payload.approved_by
        });
      }

      return { success: true, data };
    }
  } catch (err) {
    console.warn('[FundService] Lỗi duyệt Supabase, fallback local:', err);
  }

  // Fallback local
  const cached = safeStorage.getItem(STORAGE_KEY_APPS) || [];
  let foundStudent = null;
  const updated = cached.map(item => {
    if (item.id === id) {
      foundStudent = { ...item, ...payload };
      return foundStudent;
    }
    return item;
  });
  safeStorage.setItem(STORAGE_KEY_APPS, updated);

  if (payload.status === 'approved' && payload.granted_amount > 0 && foundStudent) {
    await recordFundTransaction({
      trans_type: 'expense',
      amount: payload.granted_amount,
      donor_or_recipient: `${foundStudent.student_name} (${foundStudent.student_class})`,
      category: 'Chi trao học bổng Chắp cánh ước mơ',
      receipt_code: `PC-HB-${foundStudent.application_code || id.slice(0, 8)}`,
      trans_date: new Date().toISOString().split('T')[0],
      note: `Trao học bổng cho học sinh ${foundStudent.student_name}`,
      recorded_by: payload.approved_by
    });
  }

  return { success: true, data: foundStudent };
}

export async function deleteScholarshipApplication(id) {
  try {
    await supabase.from('cbq_scholarship_applications').delete().eq('id', id);
  } catch (err) {
    console.warn('[FundService] Xoá trên Supabase:', err);
  }
  const cached = safeStorage.getItem(STORAGE_KEY_APPS) || [];
  const updated = cached.filter(item => item.id !== id);
  safeStorage.setItem(STORAGE_KEY_APPS, updated);
  return { success: true };
}

// ======================= 2. SỔ QUỸ THU - CHI =======================

export async function fetchFundTransactions() {
  try {
    const { data, error } = await supabase
      .from('cbq_scholarship_fund_transactions')
      .select('*')
      .order('trans_date', { ascending: false });

    if (!error && data) {
      safeStorage.setItem(STORAGE_KEY_TRANS, data);
      return data;
    }
  } catch (err) {
    console.warn('[FundService] Fallback cache sổ quỹ:', err);
  }

  const cached = safeStorage.getItem(STORAGE_KEY_TRANS);
  return Array.isArray(cached) ? cached : [];
}

export async function recordFundTransaction(txData) {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const defaultCode = txData.trans_type === 'income' 
    ? `PT-CCUM-${currentYear}-${randomSuffix}`
    : `PC-CCUM-${currentYear}-${randomSuffix}`;

  const payload = {
    trans_type: txData.trans_type || 'income',
    amount: Number(txData.amount) || 0,
    donor_or_recipient: txData.donor_or_recipient || 'Nhà hảo tâm',
    category: txData.category || (txData.trans_type === 'income' ? 'Ủng hộ Quỹ' : 'Chi trao học bổng'),
    receipt_code: txData.receipt_code || defaultCode,
    trans_date: txData.trans_date || new Date().toISOString().split('T')[0],
    note: txData.note || '',
    recorded_by: txData.recorded_by || 'Ban Quản Lý Quỹ',
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('cbq_scholarship_fund_transactions')
      .insert([payload])
      .select()
      .maybeSingle();

    if (!error && data) {
      const cached = safeStorage.getItem(STORAGE_KEY_TRANS) || [];
      safeStorage.setItem(STORAGE_KEY_TRANS, [data, ...cached]);
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[FundService] Ghi sổ quỹ local:', err);
  }

  payload.id = 'tx_' + Date.now();
  const cached = safeStorage.getItem(STORAGE_KEY_TRANS) || [];
  safeStorage.setItem(STORAGE_KEY_TRANS, [payload, ...cached]);
  return { success: true, data: payload };
}

export async function deleteFundTransaction(id) {
  try {
    await supabase.from('cbq_scholarship_fund_transactions').delete().eq('id', id);
  } catch (err) {
    console.warn('[FundService] Xoá phiếu giao dịch:', err);
  }
  const cached = safeStorage.getItem(STORAGE_KEY_TRANS) || [];
  const updated = cached.filter(item => item.id !== id);
  safeStorage.setItem(STORAGE_KEY_TRANS, updated);
  return { success: true };
}

// ======================= 3. CÀI ĐẶT QUỸ =======================

export async function fetchFundSettings() {
  try {
    const { data, error } = await supabase
      .from('cbq_scholarship_fund_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data) {
      safeStorage.setItem(STORAGE_KEY_SETTINGS, data);
      return data;
    }
  } catch (err) {
    console.warn('[FundService] Lấy cài đặt local:', err);
  }

  const cached = safeStorage.getItem(STORAGE_KEY_SETTINGS);
  return cached || DEFAULT_SETTINGS;
}

export async function saveFundSettings(newSettings) {
  const payload = {
    ...newSettings,
    id: 'default',
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('cbq_scholarship_fund_settings')
      .upsert([payload])
      .select()
      .maybeSingle();

    if (!error && data) {
      safeStorage.setItem(STORAGE_KEY_SETTINGS, data);
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[FundService] Lưu cài đặt local:', err);
  }

  safeStorage.setItem(STORAGE_KEY_SETTINGS, payload);
  return { success: true, data: payload };
}

// ======================= 4. THỐNG KÊ QUỸ TỔNG THỂ =======================

export async function getFundStatistics() {
  const [apps, trans, sponsorsRes] = await Promise.all([
    fetchScholarshipApplications(),
    fetchFundTransactions(),
    supabase.from('cbq_sponsors').select('*')
  ]);

  const sponsors = sponsorsRes.data || [];
  
  // Tính tổng thu từ Sổ quỹ transactions + Bảng cbq_sponsors
  const txIncome = trans.filter(t => t.trans_type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const sponsorsCash = sponsors.reduce((sum, s) => sum + (Number(s.donation_amount) || 0), 0);
  const totalIncome = Math.max(txIncome, sponsorsCash) || (txIncome + sponsorsCash);

  // Tính tổng chi từ Sổ quỹ transactions
  const totalExpense = trans.filter(t => t.trans_type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Số dư quỹ
  const fundBalance = Math.max(0, totalIncome - totalExpense);

  // Thống kê hồ sơ học sinh
  const totalApplications = apps.length;
  const approvedApplications = apps.filter(a => a.status === 'approved');
  const pendingApplications = apps.filter(a => a.status === 'pending');
  const rejectedApplications = apps.filter(a => a.status === 'rejected');
  const totalScholarshipGranted = approvedApplications.reduce((sum, a) => sum + (Number(a.granted_amount) || 0), 0);

  return {
    totalIncome,
    totalExpense,
    fundBalance,
    totalApplications,
    approvedCount: approvedApplications.length,
    pendingCount: pendingApplications.length,
    rejectedCount: rejectedApplications.length,
    totalScholarshipGranted,
    sponsorsCount: sponsors.length
  };
}

// ======================= 5. XUẤT FILE CHUẨN QUY TẮC =======================
// QUY TẮC GEMINI.md: Tên file bắt buộc có tiền tố số thứ tự (ví dụ: 1-...)

/**
 * Xuất danh sách học sinh nhận học bổng ra file Excel
 * Tên file: 1-Danh_sach_hoc_sinh_nhan_hoc_bong_Chap_canh_uoc_mo.xlsx
 */
export function exportScholarshipExcel(approvedList, termName = 'Học kỳ I') {
  if (!approvedList || approvedList.length === 0) {
    alert('Không có học sinh nào trong danh sách được phê duyệt!');
    return;
  }

  const rows = approvedList.map((item, index) => ({
    'STT': index + 1,
    'Mã hồ sơ': item.application_code || `HS-${index + 1}`,
    'Họ và tên học sinh': item.student_name,
    'Lớp': item.student_class,
    'Giới tính': item.gender || 'Nam',
    'Hoàn cảnh / Diện đối tượng': item.category,
    'Học lực': item.academic_grade || 'Tốt',
    'Rèn luyện': item.conduct_grade || 'Tốt',
    'Mức học bổng (VNĐ)': Number(item.granted_amount) || 0,
    'Hiện vật kèm theo': item.granted_item || 'Không',
    'Người giám hộ': item.parent_name || '',
    'SĐT liên hệ': item.phone || item.parent_phone || '',
    'Địa chỉ': item.home_address || '',
    'Đợt trao': item.scholarship_term || termName,
    'Ghi chú': item.review_note || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Căn chỉnh độ rộng cột
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 20 }, // Mã hồ sơ
    { wch: 25 }, // Họ và tên
    { wch: 10 }, // Lớp
    { wch: 10 }, // Giới tính
    { wch: 25 }, // Hoàn cảnh
    { wch: 10 }, // Học lực
    { wch: 12 }, // Rèn luyện
    { wch: 18 }, // Mức học bổng
    { wch: 20 }, // Hiện vật
    { wch: 22 }, // Giám hộ
    { wch: 15 }, // SĐT
    { wch: 30 }, // Địa chỉ
    { wch: 25 }, // Đợt trao
    { wch: 25 }  // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DS_Nhan_Hoc_Bong');

  // ĐẶT TÊN THEO QUY TẮC BẮT BUỘC CÓ TIỀN TỐ 1-
  const fileName = '1-Danh_sach_hoc_sinh_nhan_hoc_bong_Chap_canh_uoc_mo.xlsx';
  XLSX.writeFile(workbook, fileName);
}

/**
 * Xuất Quyết định trao học bổng chuẩn thể thức văn bản hành chính Nghị định 30/2020/NĐ-CP
 * Tên file: 1-Quyet_dinh_trao_hoc_bong_Chap_canh_uoc_mo.docx
 */
export async function exportScholarshipDecisionWord(approvedList, fundSettings = DEFAULT_SETTINGS) {
  if (!approvedList || approvedList.length === 0) {
    alert('Không có học sinh nào trong danh sách được phê duyệt để xuất Quyết định!');
    return;
  }

  const totalAmount = approvedList.reduce((sum, item) => sum + (Number(item.granted_amount) || 0), 0);
  const termName = fundSettings.current_term_name || 'Đợt 1 - Năm học 2026-2027';
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  // Bảng phụ lục danh sách học sinh trong docx
  const tableHeaderRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ text: 'STT', alignment: AlignmentType.CENTER, style: 'bold' })], width: { size: 6, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ text: 'Họ và tên học sinh', alignment: AlignmentType.CENTER, style: 'bold' })], width: { size: 28, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ text: 'Lớp', alignment: AlignmentType.CENTER, style: 'bold' })], width: { size: 10, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ text: 'Hoàn cảnh / Diện đối tượng', alignment: AlignmentType.CENTER, style: 'bold' })], width: { size: 26, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ text: 'Mức học bổng (VNĐ)', alignment: AlignmentType.CENTER, style: 'bold' })], width: { size: 18, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ text: 'Ký nhận', alignment: AlignmentType.CENTER, style: 'bold' })], width: { size: 12, type: WidthType.PERCENTAGE } }),
    ]
  });

  const tableDataRows = approvedList.map((item, idx) => {
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: String(idx + 1), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: item.student_name, alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ text: item.student_class, alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: item.category || 'Vượt khó vươn lên', alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ text: (Number(item.granted_amount) || 0).toLocaleString('vi-VN') + ' đ', alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ text: '', alignment: AlignmentType.CENTER })] }),
      ]
    });
  });

  // Hàng tổng cộng
  const tableTotalRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ text: 'Tổng cộng', alignment: AlignmentType.CENTER })], columnSpan: 4 }),
      new TableCell({ children: [new Paragraph({ text: totalAmount.toLocaleString('vi-VN') + ' đ', alignment: AlignmentType.RIGHT })] }),
      new TableCell({ children: [new Paragraph({ text: '', alignment: AlignmentType.CENTER })] }),
    ]
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1701 } // Chuẩn NĐ 30: Trái 30mm, trên/dưới/phải 20mm
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              text: 'TRƯỜNG THPT CAO BÁ QUÁT - HỘI ĐỒNG QUẢN LÝ QUỸ "CHẮP CÁNH ƯỚC MƠ"',
              alignment: AlignmentType.RIGHT,
              size: 18
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Trang ' }),
                new TextRun({ children: [PageNumber.CURRENT] }),
                new TextRun({ text: ' / ' }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES] })
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },
      children: [
        // Quốc hiệu & Tiêu ngữ chuẩn Nghị định 30
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ text: 'SỞ GD&ĐT THÀNH PHỐ HÀ NỘI', alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
                    new Paragraph({ text: 'TRƯỜNG THPT CAO BÁ QUÁT', alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: 'Số:       /QĐ-CBQ-CCUM', alignment: AlignmentType.CENTER, spacing: { before: 80 } })
                  ]
                }),
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: 'Độc lập - Tự do - Hạnh phúc', alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
                    new Paragraph({ text: `Hà Nội, ngày ${day} tháng ${month} năm ${year}`, alignment: AlignmentType.CENTER })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ text: '', spacing: { after: 200 } }),

        // Tên quyết định
        new Paragraph({
          text: 'QUYẾT ĐỊNH',
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 }
        }),
        new Paragraph({
          text: `Về việc trao học bổng Quỹ "Chắp cánh ước mơ" cho học sinh vượt khó học giỏi`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 }
        }),
        new Paragraph({
          text: `(${termName})`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        // Căn cứ
        new Paragraph({ text: 'HIỆU TRƯỞNG TRƯỜNG THPT CAO BÁ QUÁT', alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
        new Paragraph({ text: 'Căn cứ Điều lệ trường trung học cơ sở, trường trung học phổ thông và trường phổ thông có nhiều cấp học ban hành kèm theo Thông tư số 32/2020/TT-BGDĐT ngày 15/9/2020 của Bộ trưởng Bộ Giáo dục và Đào tạo;', spacing: { after: 80 } }),
        new Paragraph({ text: 'Căn cứ Quy chế tổ chức và hoạt động của Quỹ học bổng "Chắp cánh ước mơ" trường THPT Cao Bá Quát;', spacing: { after: 80 } }),
        new Paragraph({ text: `Căn cứ Biên bản họp xét duyệt hồ sơ cấp học bổng ngày ${day} tháng ${month} năm ${year} của Hội đồng Quản lý Quỹ "Chắp cánh ước mơ";`, spacing: { after: 80 } }),
        new Paragraph({ text: 'Xét đề nghị của Ban Quản lý Quỹ học bổng và Giáo viên chủ nhiệm các lớp,', spacing: { after: 160 } }),

        // Quyết định
        new Paragraph({ text: 'QUYẾT ĐỊNH:', alignment: AlignmentType.CENTER, spacing: { after: 120 } }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Điều 1. ' }),
            new TextRun({ text: `Trao tặng học bổng Quỹ "Chắp cánh ước mơ" (${termName}) cho ` }),
            new TextRun({ text: `${approvedList.length} học sinh ` }),
            new TextRun({ text: 'có hoàn cảnh khó khăn, nỗ lực vươn lên đạt thành tích tốt trong học tập và rèn luyện (có danh sách chi tiết kèm theo).' })
          ],
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Điều 2. ' }),
            new TextRun({ text: `Tổng kinh phí trao học bổng đợt này là: ` }),
            new TextRun({ text: `${totalAmount.toLocaleString('vi-VN')} đồng ` }),
            new TextRun({ text: `(Trích từ nguồn vận động Quỹ học bổng "Chắp cánh ước mơ" do các thế hệ cựu học sinh, quý phụ huynh và các nhà hảo tâm tài trợ).` })
          ],
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Điều 3. ' }),
            new TextRun({ text: 'Các Ông (Bà) Phó Hiệu trưởng, Kế toán, Thủ quỹ nhà trường, Ban Chấp hành Đoàn trường, Giáo viên chủ nhiệm các lớp và các học sinh có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này./.' })
          ],
          spacing: { after: 240 }
        }),

        // Nơi nhận & Ký tên
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ text: 'Nơi nhận:', spacing: { after: 40 } }),
                    new Paragraph({ text: '- Ban Giám hiệu (để chỉ đạo);', spacing: { after: 20 } }),
                    new Paragraph({ text: '- Hội đồng Quỹ "Chắp cánh ước mơ";', spacing: { after: 20 } }),
                    new Paragraph({ text: '- GVCN các lớp liên quan (để thực hiện);', spacing: { after: 20 } }),
                    new Paragraph({ text: '- Lưu: VT, BQL Quỹ.' })
                  ]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ text: 'HIỆU TRƯỞNG', alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
                    new Paragraph({ text: 'CHỦ TỊCH HỘI ĐỒNG QUỸ', alignment: AlignmentType.CENTER, spacing: { after: 500 } }),
                    new Paragraph({ text: '(Ký tên, đóng dấu)', alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
                    new Paragraph({ text: 'TRƯỜNG THPT CAO BÁ QUÁT', alignment: AlignmentType.CENTER })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ text: '', spacing: { after: 300 } }),

        // BẢNG DANH SÁCH HỌC SINH ĐÍNH KÈM QUYẾT ĐỊNH
        new Paragraph({
          text: 'DANH SÁCH HỌC SINH ĐƯỢC NHẬN HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ"',
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 60 }
        }),
        new Paragraph({
          text: `(Kèm theo Quyết định số:       /QĐ-CBQ-CCUM ngày ${day} tháng ${month} năm ${year})`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 }
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableHeaderRow,
            ...tableDataRows,
            tableTotalRow
          ]
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // ĐẶT TÊN THEO QUY TẮC BẮT BUỘC CÓ TIỀN TỐ 1-
  a.download = '1-Quyet_dinh_trao_hoc_bong_Chap_canh_uoc_mo.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Xuất báo cáo thu chi quỹ ra file Excel
 * Tên file: 1-Bao_cao_thu_chi_quy_Chap_canh_uoc_mo.xlsx
 */
export function exportFundReportExcel(transactions, stats) {
  if (!transactions || transactions.length === 0) {
    alert('Chưa có phát sinh giao dịch thu chi nào trong sổ quỹ!');
    return;
  }

  const rows = transactions.map((t, idx) => ({
    'STT': idx + 1,
    'Ngày phát sinh': t.trans_date,
    'Mã chứng từ': t.receipt_code || '',
    'Loại giao dịch': t.trans_type === 'income' ? 'THU ĐÓNG GÓP' : 'CHI HỌC BỔNG / HỖ TRỢ',
    'Số tiền (VNĐ)': Number(t.amount) || 0,
    'Người đóng góp / Thụ hưởng': t.donor_or_recipient,
    'Nội dung / Danh mục': t.category,
    'Diễn giải': t.note || '',
    'Người lập phiếu': t.recorded_by || 'Ban Quản Lý Quỹ'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 15 }, // Ngày
    { wch: 18 }, // Mã chứng từ
    { wch: 22 }, // Loại
    { wch: 18 }, // Số tiền
    { wch: 30 }, // Người nộp/nhận
    { wch: 28 }, // Danh mục
    { wch: 35 }, // Diễn giải
    { wch: 20 }  // Người lập
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'So_Quy_Thu_Chi');

  // ĐẶT TÊN THEO QUY TẮC BẮT BUỘC CÓ TIỀN TỐ 1-
  const fileName = '1-Bao_cao_thu_chi_quy_Chap_canh_uoc_mo.xlsx';
  XLSX.writeFile(workbook, fileName);
}
