/**
 * DỊCH VỤ CHẤM THI TRẮC NGHIỆM DI ĐỘNG CHUẨN 2027 (GDPT 2018)
 * Trường THPT Cao Bá Quát - Phường Tân An - Tỉnh Đắk Lắk
 * 
 * Tính năng chính:
 * 1. Quản lý Đợt thi & Cấu trúc 3 Phần chuẩn Bộ GD&ĐT 2027:
 *    - Phần 1: Trắc nghiệm 4 lựa chọn (A, B, C, D)
 *    - Phần 2: Trắc nghiệm Đúng / Sai (4 ý a, b, c, d với thang điểm lũy tiến 0.1 - 0.25 - 0.5 - 1.0)
 *    - Phần 3: Trắc nghiệm trả lời ngắn (Điền số, dấu âm, dấu phẩy thập phân)
 * 2. Bộ xử lý ảnh OMR (Optical Mark Recognition) bằng Canvas:
 *    - Phân tích độ tương phản (Thresholding) & tỷ lệ mật độ điểm đen (Pixel Black Ratio)
 *    - Căn chỉnh tọa độ lưới (Grid Mapping)
 * 3. Bộ tổng hợp âm thanh Web Audio API phát tiếng "Beep!" tức thì khi chấm thành công
 * 4. Xuất file Excel tuân thủ quy tắc tiền tố: 1-Bang_diem_cham_trac_nghiem_2027_[TenBai]_[Lop].xlsx
 */

import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export const OMR_STORAGE_KEY_BATCHES = 'cbq_omr_batches_2027';
export const OMR_STORAGE_KEY_RESULTS = 'cbq_omr_results_2027';
export const OMR_STORAGE_KEY_SETTINGS = 'cbq_omr_settings_2027';

// Cài đặt mặc định
export const DEFAULT_OMR_SETTINGS = {
  scanSpeedSeconds: 1, // Tốc độ quét 1s
  showResultImmediate: true, // Vừa chấm vừa xem kết quả
  soundEnabled: true, // Tiếng bíp khi chấm xong
  vibrateEnabled: true, // Rung nhẹ khi chấm xong
  sensitivity: 'normal', // 'light' (nhẹ), 'normal' (chuẩn 2B), 'dark' (đậm)
  autoSaveToCloud: true // Tự động lưu lên Supabase Cloud
};

// Cấu trúc mẫu chuẩn GDPT 2018 Bộ GD&ĐT (Năm học 2026 - 2027)
export const DEFAULT_EXAM_STRUCTURE = {
  part1: {
    title: 'Phần 1 (Nhiều lựa chọn)',
    totalQuestions: 18, // 18 câu thông dụng (hoặc 12, 40 câu)
    pointPerQuestion: 0.25
  },
  part2: {
    title: 'Phần 2 (Đúng / Sai)',
    totalQuestions: 4, // 4 câu (16 ý)
    points: {
      1: 0.1,  // Đúng 1 ý: 0.1 điểm
      2: 0.25, // Đúng 2 ý: 0.25 điểm
      3: 0.5,  // Đúng 3 ý: 0.5 điểm
      4: 1.0   // Đúng 4 ý: 1.0 điểm
    }
  },
  part3: {
    title: 'Phần 3 (Trả lời ngắn / Điền số)',
    totalQuestions: 6, // 6 câu điền số
    pointPerQuestion: 0.5
  }
};

// Danh sách các mẫu phiếu hỗ trợ (Chuẩn QM 2025/2027 & Bộ GD)
export const SHEET_TEMPLATES = [
  { id: 'QM_2025_A4', name: 'QM 2025 - A4', description: 'Phiếu A4 chuẩn GDPT 2018 (Phần 1, 2, 3)' },
  { id: 'QM_2025_TOAN', name: 'QM 2025 - Toán', description: 'Chuyên biệt môn Toán THPT (12 câu P1, 4 câu P2, 6 câu P3)' },
  { id: 'QM_2025_KHTN', name: 'QM 2025 - Lý, Hóa, Sinh, Địa', description: 'Môn KHTN & Địa lý (18 câu P1, 4 câu P2, 6 câu P3)' },
  { id: 'QM_2025_KHXH', name: 'QM 2025 - Sử, Tin, Công Nghệ, GDPL', description: 'Môn KHXH & Tin học (24 câu P1, 4 câu P2)' },
  { id: 'QM_2025_NGOAINGU', name: 'QM 2025 - Ngoại ngữ', description: 'Trắc nghiệm 4 lựa chọn (40 hoặc 50 câu)' },
  { id: 'QM_2025_ONTAP', name: 'QM 2025 - Ôn tập - TL ngắn', description: 'Chuyên biệt ôn tập câu hỏi trả lời ngắn' },
  { id: 'BOGD_2025_A4', name: 'Bộ GD 2025 - A4', description: 'Mẫu chuẩn của Cục Quản lý Chất lượng - Bộ GD&ĐT' },
  { id: 'TNMAKER_2025_A4', name: 'TNmaker 2025 - A4', description: 'Tương thích máy quét TNmaker A4' },
  { id: 'AZOTA_2025_A4', name: 'Azota 2025 - A4', description: 'Phiếu trả lời trắc nghiệm chuẩn Azota A4' },
  { id: 'AZOTA_2025_A5', name: 'Azota 2025 - A5', description: 'Phiếu trắc nghiệm tiết kiệm khổ A5 (2 phiếu / tờ A4)' },
  { id: 'AZOTA_2025_A4_TULUA', name: 'Azota 2025 - A4 TN và Tự luận', description: 'Kết hợp chấm trắc nghiệm OMR và phần viết tự luận' },
  { id: 'QM_2025_KHTN_10', name: 'QM 2025 - KH Tự Nhiên - 10', description: 'Dành cho môn KHTN Lớp 10 chương trình mới' },
  { id: 'CBQ_2027_A4', name: 'CBQ 2027 - Chuẩn Bộ GD (A4)', description: 'Mẫu phiếu độc quyền Trường THPT Cao Bá Quát A4' },
  { id: 'CBQ_2027_A5', name: 'CBQ 2027 - Tiết Kiệm Giấy (A5)', description: 'Mẫu phiếu in 2 mặt / 2 trang A5 trường THPT Cao Bá Quát' }
];

/**
 * Phát âm thanh tiếng "Beep!" báo chấm thành công (Web Audio API)
 */
export function playSuccessBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Nốt La (A5)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // Vuốt lên A6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);

    // Kích hoạt rung điện thoại (Haptic feedback)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }
  } catch (err) {
    console.warn("Không thể phát âm thanh beep:", err);
  }
}

/**
 * Phát âm thanh cảnh báo lỗi (Lệch khung hình hoặc mã đề không khớp)
 */
export function playErrorBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200]);
    }
  } catch (err) {
    console.warn("Lỗi phát âm thanh cảnh báo:", err);
  }
}

/**
 * Lấy danh sách đợt thi đã lưu
 */
export function getSavedExamBatches() {
  try {
    const raw = localStorage.getItem(OMR_STORAGE_KEY_BATCHES);
    if (!raw) return getInitialDemoBatches();
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : getInitialDemoBatches();
  } catch {
    return getInitialDemoBatches();
  }
}

/**
 * Lưu danh sách đợt thi
 */
export function saveExamBatches(batches) {
  try {
    localStorage.setItem(OMR_STORAGE_KEY_BATCHES, JSON.stringify(batches));
  } catch (err) {
    console.error("Lỗi lưu đợt thi OMR:", err);
  }
}

/**
 * Lấy kết quả chấm của một đợt thi
 */
export function getBatchResults(batchId) {
  try {
    const raw = localStorage.getItem(OMR_STORAGE_KEY_RESULTS);
    if (!raw) return [];
    const all = JSON.parse(raw);
    return (all || []).filter(r => r.batchId === batchId);
  } catch {
    return [];
  }
}

/**
 * Lưu kết quả bài chấm mới
 */
export function saveScannedResult(result) {
  try {
    const raw = localStorage.getItem(OMR_STORAGE_KEY_RESULTS);
    let all = raw ? JSON.parse(raw) : [];

    // Nếu đã có kết quả của cùng SBD trong đợt thi này, cập nhật đè (hoặc thêm mới)
    const existingIdx = all.findIndex(r => r.batchId === result.batchId && r.sbd === result.sbd);
    if (existingIdx >= 0) {
      all[existingIdx] = result;
    } else {
      all.unshift(result);
    }

    localStorage.setItem(OMR_STORAGE_KEY_RESULTS, JSON.stringify(all));
    return all.filter(r => r.batchId === result.batchId);
  } catch (err) {
    console.error("Lỗi lưu kết quả chấm OMR:", err);
    return [];
  }
}

/**
 * Xóa một bài chấm
 */
export function deleteScannedResult(resultId) {
  try {
    const raw = localStorage.getItem(OMR_STORAGE_KEY_RESULTS);
    if (!raw) return [];
    let all = JSON.parse(raw);
    all = all.filter(r => r.id !== resultId);
    localStorage.setItem(OMR_STORAGE_KEY_RESULTS, JSON.stringify(all));
    return all;
  } catch {
    return [];
  }
}

/**
 * Lấy cài đặt chấm
 */
export function getOmrSettings() {
  try {
    const raw = localStorage.getItem(OMR_STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_OMR_SETTINGS;
    return { ...DEFAULT_OMR_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_OMR_SETTINGS;
  }
}

/**
 * Lưu cài đặt chấm
 */
export function saveOmrSettings(settings) {
  try {
    localStorage.setItem(OMR_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Tính điểm chi tiết theo chuẩn GDPT 2018 (3 Phần)
 */
export function gradeStudentSubmission(studentAnswers, answerKey, examStructure) {
  let p1CorrectCount = 0;
  let p1Score = 0;
  const p1Details = [];

  // 1. Chấm Phần 1 (Nhiều lựa chọn)
  const p1Config = examStructure.part1 || { totalQuestions: 18, pointPerQuestion: 0.25 };
  const p1Key = answerKey.part1 || [];
  const p1Student = studentAnswers.part1 || [];

  for (let i = 0; i < p1Config.totalQuestions; i++) {
    const correctOpt = p1Key[i] || '';
    const studentOpt = p1Student[i] || '';
    const isCorrect = correctOpt && studentOpt && correctOpt.toUpperCase() === studentOpt.toUpperCase();

    if (isCorrect) {
      p1CorrectCount++;
    }

    p1Details.push({
      questionNum: i + 1,
      correctAnswer: correctOpt,
      studentAnswer: studentOpt,
      isCorrect
    });
  }
  p1Score = Number((p1CorrectCount * (p1Config.pointPerQuestion || 0.25)).toFixed(2));

  // 2. Chấm Phần 2 (Đúng / Sai 4 ý lũy tiến: 0.1 - 0.25 - 0.5 - 1.0)
  const p2Config = examStructure.part2 || { totalQuestions: 4, points: { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 } };
  const p2Key = answerKey.part2 || [];
  const p2Student = studentAnswers.part2 || [];
  let p2Score = 0;
  const p2Details = [];

  for (let q = 0; q < p2Config.totalQuestions; q++) {
    const qKey = p2Key[q] || { a: '', b: '', c: '', d: '' };
    const qStudent = p2Student[q] || { a: '', b: '', c: '', d: '' };

    let correctSubCount = 0;
    const subDetails = {};

    ['a', 'b', 'c', 'd'].forEach(sub => {
      const cAns = (qKey[sub] || '').toUpperCase();
      const sAns = (qStudent[sub] || '').toUpperCase();
      const isSubCorrect = cAns && sAns && cAns === sAns;
      if (isSubCorrect) correctSubCount++;
      subDetails[sub] = {
        correct: cAns,
        student: sAns,
        isCorrect: isSubCorrect
      };
    });

    let qEarned = 0;
    if (correctSubCount === 1) qEarned = p2Config.points[1] || 0.1;
    else if (correctSubCount === 2) qEarned = p2Config.points[2] || 0.25;
    else if (correctSubCount === 3) qEarned = p2Config.points[3] || 0.5;
    else if (correctSubCount === 4) qEarned = p2Config.points[4] || 1.0;

    p2Score += qEarned;

    p2Details.push({
      questionNum: q + 1,
      subDetails,
      correctSubCount,
      earnedPoint: qEarned
    });
  }
  p2Score = Number(p2Score.toFixed(2));

  // 3. Chấm Phần 3 (Trả lời ngắn / Điền số)
  const p3Config = examStructure.part3 || { totalQuestions: 6, pointPerQuestion: 0.5 };
  const p3Key = answerKey.part3 || [];
  const p3Student = studentAnswers.part3 || [];
  let p3CorrectCount = 0;
  let p3Score = 0;
  const p3Details = [];

  for (let i = 0; i < p3Config.totalQuestions; i++) {
    const correctVal = String(p3Key[i] || '').trim().replace(',', '.');
    const studentVal = String(p3Student[i] || '').trim().replace(',', '.');

    // So sánh số học hoặc chuỗi tương đương (VD 4 và 4.0)
    let isCorrect = false;
    if (correctVal && studentVal) {
      if (correctVal === studentVal) {
        isCorrect = true;
      } else {
        const numC = parseFloat(correctVal);
        const numS = parseFloat(studentVal);
        if (!isNaN(numC) && !isNaN(numS) && Math.abs(numC - numS) < 0.0001) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) {
      p3CorrectCount++;
    }

    p3Details.push({
      questionNum: i + 1,
      correctAnswer: correctVal,
      studentAnswer: studentVal,
      isCorrect
    });
  }
  p3Score = Number((p3CorrectCount * (p3Config.pointPerQuestion || 0.5)).toFixed(2));

  const totalScore = Number((p1Score + p2Score + p3Score).toFixed(2));

  return {
    part1: { score: p1Score, correctCount: p1CorrectCount, totalQuestions: p1Config.totalQuestions, details: p1Details },
    part2: { score: p2Score, details: p2Details, totalQuestions: p2Config.totalQuestions },
    part3: { score: p3Score, correctCount: p3CorrectCount, totalQuestions: p3Config.totalQuestions, details: p3Details },
    totalScore
  };
}

/**
 * Xuất file Excel Bảng điểm thi trắc nghiệm theo quy tắc tiền tố của trường
 */
export function exportExamResultsToExcel(batch, results) {
  if (!batch || !results || results.length === 0) {
    alert("Không có kết quả chấm để xuất Excel.");
    return;
  }

  const rows = results.map((r, idx) => ({
    'STT': idx + 1,
    'Số Báo Danh': r.sbd || '',
    'Họ và Tên Học Sinh': r.studentName || 'Chưa định danh',
    'Lớp': r.studentClass || batch.className || '',
    'Mã Đề': r.examCode || '',
    'Điểm Phần 1 (4 Lựa chọn)': r.part1Score ?? 0,
    'Điểm Phần 2 (Đúng / Sai)': r.part2Score ?? 0,
    'Điểm Phần 3 (Điền số)': r.part3Score ?? 0,
    'TỔNG ĐIỂM (Thang 10)': r.totalScore ?? 0,
    'Xếp Loại': getGradeClassification(r.totalScore),
    'Thời Gian Chấm': new Date(r.scannedAt || Date.now()).toLocaleString('vi-VN')
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Căn chỉnh độ rộng cột
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 26 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 22 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang_Diem_Trac_Nghiem_2027');

  // Đặt tên file theo đúng quy tắc tiền tố của trường THPT Cao Bá Quát: 1-Tên_file...
  const safeTitle = (batch.title || 'Kiem_tra_trac_nghiem')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeClass = (batch.className || 'Toan_truong')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const fileName = `1-Bang_diem_cham_trac_nghiem_2027_${safeTitle}_${safeClass}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

function getGradeClassification(score) {
  if (score >= 8.5) return 'Giỏi / Xuất sắc';
  if (score >= 7.0) return 'Khá';
  if (score >= 5.0) return 'Đạt / Trung bình';
  return 'Chưa đạt';
}

/**
 * Dữ liệu đợt thi mẫu khởi tạo
 */
function getInitialDemoBatches() {
  const initial = [
    {
      id: 'batch-town-2025',
      title: 'town',
      subject: 'Tiếng Anh',
      grade: 'Khối 12',
      className: '12A01',
      codeDigits: 3,
      scanSbd: true,
      sheetTemplate: 'QM_2025_A4',
      parts: {
        part1: { count: 12, pointPerQ: 0.25 },
        part2: { count: 4, points: { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 } },
        part3: { count: 3, pointPerQ: 0.5 }
      },
      answerKeys: {
        '101': {
          part1: ['A', 'B', 'C', 'D', 'A', 'C', 'B', 'D', 'A', 'B', 'C', 'D'],
          part2: [
            { a: 'D', b: 'S', c: 'D', d: 'S' },
            { a: 'S', b: 'D', c: 'D', d: 'S' },
            { a: 'D', b: 'D', c: 'S', d: 'D' },
            { a: 'S', b: 'S', c: 'D', d: 'D' }
          ],
          part3: ['4', '-2.5', '12']
        }
      },
      createdAt: '2026-10-30 14:56:44'
    },
    {
      id: 'batch-2027-demo-01',
      title: 'Kiểm Tra Giữa Kỳ 1 - Môn Toán 12 (GDPT 2018)',
      subject: 'Toán',
      grade: 'Khối 12',
      className: '12A01',
      codeDigits: 3,
      scanSbd: true,
      sheetTemplate: 'QM_2025_TOAN',
      parts: {
        part1: { count: 12, pointPerQ: 0.25 },
        part2: { count: 4, points: { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 } },
        part3: { count: 6, pointPerQ: 0.5 }
      },
      answerKeys: {
        '101': {
          part1: ['A', 'B', 'C', 'D', 'A', 'C', 'B', 'D', 'A', 'B', 'C', 'D'],
          part2: [
            { a: 'D', b: 'S', c: 'D', d: 'S' },
            { a: 'S', b: 'D', c: 'D', d: 'S' },
            { a: 'D', b: 'D', c: 'S', d: 'D' },
            { a: 'S', b: 'S', c: 'D', d: 'D' }
          ],
          part3: ['4', '-2.5', '12', '0.75', '15', '3.14']
        },
        '102': {
          part1: ['B', 'C', 'D', 'A', 'B', 'D', 'C', 'A', 'B', 'C', 'D', 'A'],
          part2: [
            { a: 'S', b: 'D', c: 'S', d: 'D' },
            { a: 'D', b: 'S', c: 'D', d: 'S' },
            { a: 'S', b: 'D', c: 'D', d: 'D' },
            { a: 'D', b: 'D', c: 'S', d: 'S' }
          ],
          part3: ['8', '1.5', '-4', '10', '25', '2.71']
        }
      },
      createdAt: '2026-10-30 08:00:00'
    }
  ];
  return initial;
}
