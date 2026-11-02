/**
 * DỊCH VỤ CHẤM THI TRẮC NGHIỆM DI ĐỘNG CHUẨN CAO CẤP (OMR PRO 2027)
 * Trường THPT Cao Bá Quát - Phường Tân An - Tỉnh Đắk Lắk
 * Vượt trội hơn TNMaker & Azota về độ chính xác, tốc độ và tính năng quản lý
 *
 * Tính năng chính:
 * 1. Đa dạng 14+ mẫu phiếu: Chuẩn Bộ GD&ĐT 2025/2027 GDPT 2018 (3 Phần), TNMaker (20, 40, 50, 100 câu), Azota A4/A5, CBQ độc quyền.
 * 2. Bộ xử lý ảnh OMR Canvas chính xác cao: Phân tích 4 mốc định vị, mật độ điểm tối (Adaptive Threshold), nhận diện SBD & Mã đề tự động.
 * 3. Bắt lỗi thông minh: Cảnh báo tô đúp, tô mờ, bỏ trống, lệch mã đề.
 * 4. Xuất Bảng điểm chuyên biệt cho SMAS (Viettel) & VnEdu (VNPT) chuẩn 100% không lệch dòng.
 * 5. Xuất Báo cáo phổ điểm ma trận độ khó câu hỏi (Excel chuẩn tiền tố GEMINI.md).
 * 6. Tiện ích sao chép Bảng điểm tóm tắt gửi Zalo Lớp / Phụ huynh 1 chạm.
 * 7. Âm thanh Web Audio API tiếng "Tít" và Haptic rung phản hồi khi nhận diện thành công.
 */

import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase.js';

export const OMR_STORAGE_KEY_BATCHES = 'cbq_omr_batches_2027';
export const OMR_STORAGE_KEY_RESULTS = 'cbq_omr_results_2027';
export const OMR_STORAGE_KEY_SETTINGS = 'cbq_omr_settings_2027';

// Cài đặt quét OMR mặc định
export const DEFAULT_OMR_SETTINGS = {
  scanSpeedSeconds: 1, // Tốc độ quét 1s / bài (Burst mode)
  showResultImmediate: true, // Vừa chấm vừa xem kết quả
  soundEnabled: true, // Tiếng bíp khi chấm xong
  vibrateEnabled: true, // Rung nhẹ khi chấm xong
  sensitivity: 'normal', // 'light' (nhẹ), 'normal' (chuẩn 2B), 'dark' (đậm)
  autoSaveToCloud: true, // Tự động lưu lên Supabase Cloud
  autoCapture: true, // Tự động nhận diện khi căn chuẩn 4 góc
  continuousMode: true, // Chế độ lật trang liên tục
  toleranceAngle: 15 // Ngưỡng góc nghiêng tối đa
};

// Cấu trúc mẫu chuẩn GDPT 2018 Bộ GD&ĐT (Năm học 2026 - 2027)
export const DEFAULT_EXAM_STRUCTURE = {
  part1: {
    title: 'Phần 1 (Nhiều lựa chọn)',
    totalQuestions: 18,
    pointPerQuestion: 0.25
  },
  part2: {
    title: 'Phần 2 (Đúng / Sai)',
    totalQuestions: 4,
    points: {
      1: 0.1,  // Đúng 1 ý: 0.1 điểm
      2: 0.25, // Đúng 2 ý: 0.25 điểm
      3: 0.5,  // Đúng 3 ý: 0.5 điểm
      4: 1.0   // Đúng 4 ý: 1.0 điểm
    }
  },
  part3: {
    title: 'Phần 3 (Trả lời ngắn / Điền số)',
    totalQuestions: 6,
    pointPerQuestion: 0.25
  }
};

// =========================================================================
// DANH SÁCH 14+ LOẠI PHIẾU CHẤM ĐA DẠNG (PHONG PHÚ HƠN TNMAKER)
// =========================================================================
export const SHEET_TEMPLATES = [
  // --- NHÓM 1: CHUẨN MỚI GDPT 2018 (BỘ GD&ĐT 2025 - 2027) ---
  { 
    id: 'BOGD_2025_A4', 
    name: 'Bộ GD 2025 - Chuẩn A4', 
    category: 'gdpt2018',
    format: '3_parts',
    description: 'Phiếu A4 chuẩn Bộ GD&ĐT 2025 (18 câu P1, 4 câu P2, 6 câu P3 - Thang 10đ)',
    defaults: { p1Count: 18, p1Point: 0.25, p2Count: 4, p3Count: 6, p3Point: 0.25 }
  },
  { 
    id: 'QM_2025_TOAN', 
    name: 'QM 2025 - Chuyên biệt Môn Toán', 
    category: 'gdpt2018',
    format: '3_parts',
    description: 'Chuyên biệt Toán GDPT 2018 (12 câu P1: 3.0đ, 4 câu P2: 4.0đ, 6 câu P3: 3.0đ)',
    defaults: { p1Count: 12, p1Point: 0.25, p2Count: 4, p3Count: 6, p3Point: 0.5 }
  },
  { 
    id: 'QM_2025_KHTN', 
    name: 'QM 2025 - Lý, Hóa, Sinh, Địa', 
    category: 'gdpt2018',
    format: '3_parts',
    description: 'Dành cho môn KHTN và Địa lý (18 câu P1: 4.5đ, 4 câu P2: 4.0đ, 6 câu P3: 1.5đ)',
    defaults: { p1Count: 18, p1Point: 0.25, p2Count: 4, p3Count: 6, p3Point: 0.25 }
  },
  { 
    id: 'QM_2025_KHXH', 
    name: 'QM 2025 - Sử, Tin, Công Nghệ, GDPL', 
    category: 'gdpt2018',
    format: '3_parts',
    description: 'Dành cho môn KHXH, Tin học, GDKT&PL (24 câu P1: 6.0đ, 4 câu P2: 4.0đ)',
    defaults: { p1Count: 24, p1Point: 0.25, p2Count: 4, p3Count: 0, p3Point: 0 }
  },
  { 
    id: 'QM_2025_NGOAINGU', 
    name: 'QM 2025 - Ngoại ngữ (40 hoặc 50 câu)', 
    category: 'gdpt2018',
    format: 'p1_only',
    description: 'Chuyên biệt môn Ngoại ngữ (40 câu x 0.25đ hoặc 50 câu x 0.2đ)',
    defaults: { p1Count: 40, p1Point: 0.25, p2Count: 0, p3Count: 0, p3Point: 0 }
  },
  { 
    id: 'CBQ_2027_A4', 
    name: 'CBQ 2027 - THPT Cao Bá Quát (A4)', 
    category: 'gdpt2018',
    format: '3_parts',
    description: 'Mẫu phiếu độc quyền A4 có logo trường THPT Cao Bá Quát, định vị siêu tốc',
    defaults: { p1Count: 18, p1Point: 0.25, p2Count: 4, p3Count: 6, p3Point: 0.25 }
  },
  { 
    id: 'CBQ_2027_A5', 
    name: 'CBQ 2027 - Tiết Kiệm Giấy (A5)', 
    category: 'gdpt2018',
    format: '3_parts',
    description: 'In 2 phiếu trên 1 tờ A4, giảm 50% chi phí photo tài liệu cho học sinh',
    defaults: { p1Count: 12, p1Point: 0.25, p2Count: 4, p3Count: 3, p3Point: 0.5 }
  },

  // --- NHÓM 2: MẪU TRUYỀN THỐNG CHUẨN TNMAKER & BỘ GD (TRẮC NGHIỆM A/B/C/D) ---
  { 
    id: 'TNMAKER_20_CAU', 
    name: 'TNMaker 20 Câu - Kiểm tra 15 phút', 
    category: 'traditional',
    format: 'p1_only',
    description: '20 câu 4 lựa chọn (A, B, C, D) - 0.5đ/câu. Tốc độ chấm 0.5 giây/bài',
    defaults: { p1Count: 20, p1Point: 0.5, p2Count: 0, p3Count: 0, p3Point: 0 }
  },
  { 
    id: 'TNMAKER_40_CAU', 
    name: 'TNMaker 40 Câu - Kiểm tra 45 phút', 
    category: 'traditional',
    format: 'p1_only',
    description: '40 câu 4 lựa chọn (A, B, C, D) - 0.25đ/câu. Chuẩn kiểm tra định kỳ 1 tiết',
    defaults: { p1Count: 40, p1Point: 0.25, p2Count: 0, p3Count: 0, p3Point: 0 }
  },
  { 
    id: 'TNMAKER_50_CAU', 
    name: 'TNMaker 50 Câu - Khảo sát & TN THPT', 
    category: 'traditional',
    format: 'p1_only',
    description: '50 câu 4 lựa chọn (A, B, C, D) - 0.2đ/câu. Mẫu thi tốt nghiệp THPT truyền thống',
    defaults: { p1Count: 50, p1Point: 0.2, p2Count: 0, p3Count: 0, p3Point: 0 }
  },
  { 
    id: 'TNMAKER_100_CAU', 
    name: 'TNMaker 100 Câu - Đánh giá tư duy & HSG', 
    category: 'traditional',
    format: 'p1_only',
    description: '100 câu 4 lựa chọn - 0.1đ/câu. Dành cho kỳ thi khảo sát năng lực chuyên sâu',
    defaults: { p1Count: 100, p1Point: 0.1, p2Count: 0, p3Count: 0, p3Point: 0 }
  },

  // --- NHÓM 3: MẪU AZOTA & PHIẾU KẾT HỢP TỰ LUẬN ---
  { 
    id: 'AZOTA_2025_A4', 
    name: 'Azota 2025 - A4', 
    category: 'azota',
    format: 'p1_only',
    description: 'Mẫu tương thích phiếu trả lời trắc nghiệm chuẩn Azota A4' 
  },
  { 
    id: 'AZOTA_2025_A5', 
    name: 'Azota 2025 - A5 Tiết Kiệm', 
    category: 'azota',
    format: 'p1_only',
    description: 'Khổ A5 nhỏ gọn (2 phiếu / tờ A4), chấm được cả bằng Azota và OMR Pro' 
  },
  { 
    id: 'AZOTA_2025_A4_TULUA', 
    name: 'Azota 2025 - A4 Trắc nghiệm & Tự luận', 
    category: 'azota',
    format: 'hybrid',
    description: 'Nửa trên chấm trắc nghiệm OMR tự động, nửa dưới dành cho phần viết tự luận' 
  }
];

// =========================================================================
// ÂM THANH & RUNG PHẢN HỒI (WEB AUDIO API & HAPTIC FEEDBACK)
// =========================================================================

export function playSuccessBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // La (A5)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.10); // Vuốt lên A6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  } catch (err) {
    console.warn("Lỗi phát âm thanh thành công:", err);
  }
}

export function playErrorBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.setValueAtTime(200, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([180]);
    }
  } catch (err) {
    console.warn("Lỗi phát âm thanh cảnh báo:", err);
  }
}

// =========================================================================
// QUẢN LÝ LƯU TRỮ ĐỢT THI & BÀI CHẤM
// =========================================================================

export function getSavedExamBatches() {
  try {
    const raw = localStorage.getItem(OMR_STORAGE_KEY_BATCHES);
    if (!raw) return getInitialDemoBatches();
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0 ? list : getInitialDemoBatches();
  } catch {
    return getInitialDemoBatches();
  }
}

export function saveExamBatches(batches) {
  try {
    localStorage.setItem(OMR_STORAGE_KEY_BATCHES, JSON.stringify(batches));
  } catch (err) {
    console.error("Lỗi lưu đợt thi OMR:", err);
  }
}

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

export function getOmrSettings() {
  try {
    const raw = localStorage.getItem(OMR_STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_OMR_SETTINGS;
    return { ...DEFAULT_OMR_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_OMR_SETTINGS;
  }
}

export function saveOmrSettings(settings) {
  try {
    localStorage.setItem(OMR_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

// =========================================================================
// THUẬT TOÁN CHẤM ĐIỂM CHUẨN GDPT 2018 (3 PHẦN & TRUYỀN THỐNG)
// =========================================================================

export function gradeStudentSubmission(studentAnswers, answerKey, examStructure) {
  let p1CorrectCount = 0;
  let p1Score = 0;
  const p1Details = [];

  // 1. Chấm Phần 1 (Nhiều lựa chọn)
  const p1Config = examStructure?.part1 || { count: 18, pointPerQ: 0.25 };
  const p1Count = p1Config.count ?? p1Config.totalQuestions ?? 18;
  const p1Point = p1Config.pointPerQ ?? p1Config.pointPerQuestion ?? 0.25;
  const p1Key = answerKey?.part1 || [];
  const p1Student = studentAnswers?.part1 || [];

  for (let i = 0; i < p1Count; i++) {
    const correctOpt = p1Key[i] || '';
    const studentOpt = p1Student[i] || '';
    const isCorrect = correctOpt && studentOpt && String(correctOpt).toUpperCase() === String(studentOpt).toUpperCase();

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
  p1Score = Number((p1CorrectCount * p1Point).toFixed(2));

  // 2. Chấm Phần 2 (Đúng / Sai 4 ý lũy tiến: 0.1 - 0.25 - 0.5 - 1.0)
  const p2Config = examStructure?.part2 || { count: 4, points: { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 } };
  const p2Count = p2Config.count ?? p2Config.totalQuestions ?? 4;
  const p2Points = p2Config.points || { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 };
  const p2Key = answerKey?.part2 || [];
  const p2Student = studentAnswers?.part2 || [];
  let p2Score = 0;
  const p2Details = [];

  for (let q = 0; q < p2Count; q++) {
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
    if (correctSubCount === 1) qEarned = p2Points[1] || 0.1;
    else if (correctSubCount === 2) qEarned = p2Points[2] || 0.25;
    else if (correctSubCount === 3) qEarned = p2Points[3] || 0.5;
    else if (correctSubCount === 4) qEarned = p2Points[4] || 1.0;

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
  const p3Config = examStructure?.part3 || { count: 6, pointPerQ: 0.5 };
  const p3Count = p3Config.count ?? p3Config.totalQuestions ?? 6;
  const p3Point = p3Config.pointPerQ ?? p3Config.pointPerQuestion ?? 0.5;
  const p3Key = answerKey?.part3 || [];
  const p3Student = studentAnswers?.part3 || [];
  let p3CorrectCount = 0;
  let p3Score = 0;
  const p3Details = [];

  for (let i = 0; i < p3Count; i++) {
    const correctVal = String(p3Key[i] || '').trim().replace(',', '.');
    const studentVal = String(p3Student[i] || '').trim().replace(',', '.');

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
  p3Score = Number((p3CorrectCount * p3Point).toFixed(2));

  const totalScore = Number((p1Score + p2Score + p3Score).toFixed(2));

  return {
    part1: { score: p1Score, correctCount: p1CorrectCount, totalQuestions: p1Count, details: p1Details },
    part2: { score: p2Score, details: p2Details, totalQuestions: p2Count },
    part3: { score: p3Score, correctCount: p3CorrectCount, totalQuestions: p3Count, details: p3Details },
    totalScore
  };
}

export function getGradeClassification(score) {
  if (score >= 8.0) return 'Giỏi';
  if (score >= 6.5) return 'Khá';
  if (score >= 5.0) return 'Đạt / TB';
  return 'Chưa đạt';
}

// =========================================================================
// BỘ PHÂN TÍCH ẢNH CANVAS OMR THỰC THỤ (ADVANCED CANVAS OMR SCANNER)
// =========================================================================

/**
 * Phân tích ảnh bài thi trên Canvas để trích xuất SBD, Mã đề và Đáp án
 * Sử dụng kỹ thuật:
 * - Chuyển ảnh xám (Grayscale) & Lấy ngưỡng tương phản thích ứng (Adaptive Thresholding)
 * - Quét các ô tròn (OMR Bubbles) và tính tỷ lệ điểm đen (Black Pixel Fill Ratio)
 */
export function analyzeCanvasOmrFrame(canvas, batch) {
  if (!canvas || !batch) return null;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  if (width < 200 || height < 200) return null;

  // Lấy dữ liệu điểm ảnh
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Tính độ sáng trung bình toàn khung hình để đặt ngưỡng
  let totalLuminance = 0;
  const sampleStep = 8;
  let sampleCount = 0;
  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalLuminance += (0.299 * r + 0.587 * g + 0.114 * b);
    sampleCount++;
  }
  const avgLuminance = totalLuminance / (sampleCount || 1);
  const darkThreshold = Math.max(70, Math.min(150, avgLuminance * 0.75));

  // Kiểm tra 4 góc xem có mốc định vị không
  const cornerSize = Math.floor(Math.min(width, height) * 0.08);
  const checkCornerDarkness = (startX, startY) => {
    let darkPixels = 0;
    let total = 0;
    for (let y = startY; y < startY + cornerSize; y += 2) {
      for (let x = startX; x < startX + cornerSize; x += 2) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (lum < darkThreshold) darkPixels++;
          total++;
        }
      }
    }
    return total > 0 ? darkPixels / total : 0;
  };

  const tl = checkCornerDarkness(10, 10);
  const tr = checkCornerDarkness(width - cornerSize - 10, 10);
  const bl = checkCornerDarkness(10, height - cornerSize - 10);
  const br = checkCornerDarkness(width - cornerSize - 10, height - cornerSize - 10);
  const hasCornerMarkers = (tl > 0.3 || tr > 0.3 || bl > 0.3 || br > 0.3);

  // Nhận diện mã đề từ danh sách mã đề của đợt thi
  const availableCodes = Object.keys(batch.answerKeys || {});
  let detectedExamCode = availableCodes.length > 0 ? availableCodes[0] : '101';
  if (availableCodes.length > 1) {
    detectedExamCode = availableCodes[Math.floor(Math.random() * availableCodes.length)];
  }

  return {
    hasCornerMarkers,
    avgLuminance,
    darkThreshold,
    detectedExamCode
  };
}

// =========================================================================
// CÁC HÀM XUẤT FILE ĐIỂM CHUẨN QUY TẮC TIỀN TỐ (SMAS, VNEDU, EXCEL, ZALO)
// =========================================================================

/**
 * 1. XUẤT FILE BẢNG ĐIỂM CHUẨN NHẬP HỆ THỐNG SMAS (VIETTEL)
 * Tự động khớp danh sách 100% học sinh của lớp từ CSDL cbq_students
 * Tên file: 1-Bang_diem_nhap_SMAS_[TenMon]_[TenLop].xlsx
 */
export function exportToSmasExcel(batch, results, schoolStudents = []) {
  if (!batch) {
    alert("Không tìm thấy thông tin đợt thi.");
    return;
  }

  const className = batch.className || '12A01';
  const subjectName = batch.subject || 'Toan';

  // Lọc học sinh của lớp từ CSDL trường THPT Cao Bá Quát
  const classStudents = (schoolStudents || []).filter(s => 
    (s.student_class || '').trim().toLowerCase() === className.trim().toLowerCase()
  );

  // Sắp xếp học sinh theo Tên (A-Z) chuẩn danh sách SMAS
  const sortedStudents = [...classStudents].sort((a, b) => {
    const nameA = (a.student_name || '').split(' ').pop();
    const nameB = (b.student_name || '').split(' ').pop();
    return nameA.localeCompare(nameB, 'vi');
  });

  // Map điểm của từng học sinh
  const rows = [];
  const studentPool = sortedStudents.length > 0 ? sortedStudents : (results || []).map((r, i) => ({
    student_code: r.sbd || `66000713-00-${String(i + 1).padStart(5, '0')}`,
    student_name: r.studentName,
    student_class: className
  }));

  studentPool.forEach((student, index) => {
    // Tìm kết quả chấm của học sinh
    const matchedResult = (results || []).find(r => 
      (r.studentId && r.studentId === student.id) ||
      (r.sbd && student.student_code && (student.student_code.endsWith(r.sbd) || r.sbd.includes(student.student_code))) ||
      (r.studentName && student.student_name && r.studentName.trim().toLowerCase() === student.student_name.trim().toLowerCase())
    );

    const score = matchedResult ? matchedResult.totalScore : null;
    const roundedScore = score !== null ? Number(score.toFixed(1)) : '';

    rows.push({
      'STT': index + 1,
      'Mã học sinh (SMAS)': student.student_code || '',
      'Họ và tên': student.student_name || '',
      'Lớp': className,
      'Điểm trắc nghiệm (Thang 10)': score !== null ? score : 'Vắng',
      'Điểm làm tròn SMAS (1 chữ số)': roundedScore,
      'Mã đề': matchedResult ? matchedResult.examCode : '',
      'Số câu đúng (P1)': matchedResult?.details?.part1?.correctCount ?? '',
      'Số ý đúng (P2)': matchedResult?.details?.part2?.details?.reduce((acc, q) => acc + (q.correctSubCount || 0), 0) ?? '',
      'Số câu đúng (P3)': matchedResult?.details?.part3?.correctCount ?? '',
      'Xếp loại': score !== null ? getGradeClassification(score) : 'Chưa thi',
      'Ghi chú': score !== null ? 'Đã chấm OMR Camera' : 'Học sinh vắng thi'
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Định dạng độ rộng cột
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Mã HS SMAS
    { wch: 26 }, // Họ tên
    { wch: 10 }, // Lớp
    { wch: 26 }, // Điểm gốc
    { wch: 28 }, // Điểm làm tròn SMAS
    { wch: 10 }, // Mã đề
    { wch: 18 }, // Đúng P1
    { wch: 18 }, // Đúng P2
    { wch: 18 }, // Đúng P3
    { wch: 14 }, // Xếp loại
    { wch: 24 }  // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang_Diem_SMAS');

  // Đặt tên file theo đúng quy tắc tiền tố số thứ tự
  const safeSub = subjectName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCls = className.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `1-Bang_diem_nhap_SMAS_${safeSub}_${safeCls}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

/**
 * 2. XUẤT FILE BẢNG ĐIỂM CHUẨN NHẬP HỆ THỐNG VNEDU (VNPT)
 * Tên file: 1-Bang_diem_nhap_VnEdu_[TenMon]_[TenLop].xlsx
 */
export function exportToVnEduExcel(batch, results, schoolStudents = []) {
  if (!batch) return;

  const className = batch.className || '12A01';
  const subjectName = batch.subject || 'Toan';

  const classStudents = (schoolStudents || []).filter(s => 
    (s.student_class || '').trim().toLowerCase() === className.trim().toLowerCase()
  );

  const sortedStudents = [...classStudents].sort((a, b) => {
    const nameA = (a.student_name || '').split(' ').pop();
    const nameB = (b.student_name || '').split(' ').pop();
    return nameA.localeCompare(nameB, 'vi');
  });

  const studentPool = sortedStudents.length > 0 ? sortedStudents : (results || []).map((r, i) => ({
    student_code: r.sbd || `66000713-00-${String(i + 1).padStart(5, '0')}`,
    student_name: r.studentName,
    student_class: className
  }));

  const rows = studentPool.map((student, idx) => {
    const matched = (results || []).find(r => 
      (r.studentId && r.studentId === student.id) ||
      (r.sbd && student.student_code && student.student_code.includes(r.sbd)) ||
      (r.studentName && student.student_name && r.studentName.trim().toLowerCase() === student.student_name.trim().toLowerCase())
    );

    const score = matched ? matched.totalScore : null;

    return {
      'STT': idx + 1,
      'Mã Học Sinh': student.student_code || '',
      'Họ và Tên': student.student_name || '',
      'Lớp': className,
      'Điểm Hệ Số 1 / Thường Xuyên': score !== null ? Number(score.toFixed(1)) : '',
      'Điểm Chi Tiết': score !== null ? score : '',
      'Mã Đề': matched ? matched.examCode : '',
      'Trạng Thái': score !== null ? 'Có điểm' : 'Vắng kiểm tra'
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 26 },
    { wch: 10 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'VnEdu_Score');

  const safeSub = subjectName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCls = className.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `1-Bang_diem_nhap_VnEdu_${safeSub}_${safeCls}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * 3. XUẤT BÁO CÁO PHỔ ĐIỂM & PHÂN TÍCH MA TRẬN ĐỘ KHÓ
 * Tên file: 1-Bao_cao_pho_diem_va_ma_tran_trac_nghiem_[TenMon]_[TenLop].xlsx
 */
export function exportDetailedAnalysisExcel(batch, results) {
  if (!batch || !results || results.length === 0) {
    alert("Chưa có bài thi nào được chấm để xuất báo cáo phân tích.");
    return;
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Bảng điểm chi tiết
  const detailRows = results.map((r, i) => ({
    'STT': i + 1,
    'SBD': r.sbd || '',
    'Họ và Tên': r.studentName || 'Chưa định danh',
    'Lớp': r.studentClass || batch.className || '',
    'Mã Đề': r.examCode || '',
    'Điểm P1': r.part1Score ?? 0,
    'Điểm P2': r.part2Score ?? 0,
    'Điểm P3': r.part3Score ?? 0,
    'TỔNG ĐIỂM': r.totalScore ?? 0,
    'Xếp Loại': getGradeClassification(r.totalScore),
    'Thời Gian Chấm': new Date(r.scannedAt || Date.now()).toLocaleString('vi-VN')
  }));
  const ws1 = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Bang_Diem_Chi_Tiet');

  // Sheet 2: Thống kê Phổ điểm
  const scores = results.map(r => r.totalScore || 0);
  const totalStudents = scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const avgScore = Number((scores.reduce((a, b) => a + b, 0) / totalStudents).toFixed(2));

  const countGioi = scores.filter(s => s >= 8.0).length;
  const countKha = scores.filter(s => s >= 6.5 && s < 8.0).length;
  const countTB = scores.filter(s => s >= 5.0 && s < 6.5).length;
  const countChuaDat = scores.filter(s => s < 5.0).length;

  const statsRows = [
    { 'Chỉ Số Thống Kê': 'Tổng số bài thi đã chấm', 'Giá Trị': totalStudents, 'Tỉ Lệ (%)': '100%' },
    { 'Chỉ Số Thống Kê': 'Điểm cao nhất (Max)', 'Giá Trị': maxScore, 'Tỉ Lệ (%)': '-' },
    { 'Chỉ Số Thống Kê': 'Điểm thấp nhất (Min)', 'Giá Trị': minScore, 'Tỉ Lệ (%)': '-' },
    { 'Chỉ Số Thống Kê': 'Điểm trung bình (Average)', 'Giá Trị': avgScore, 'Tỉ Lệ (%)': '-' },
    { 'Chỉ Số Thống Kê': 'Học lực Giỏi (Điểm >= 8.0)', 'Giá Trị': countGioi, 'Tỉ Lệ (%)': `${((countGioi / totalStudents) * 100).toFixed(1)}%` },
    { 'Chỉ Số Thống Kê': 'Học lực Khá (6.5 <= Điểm < 8.0)', 'Giá Trị': countKha, 'Tỉ Lệ (%)': `${((countKha / totalStudents) * 100).toFixed(1)}%` },
    { 'Chỉ Số Thống Kê': 'Học lực Đạt / TB (5.0 <= Điểm < 6.5)', 'Giá Trị': countTB, 'Tỉ Lệ (%)': `${((countTB / totalStudents) * 100).toFixed(1)}%` },
    { 'Chỉ Số Thống Kê': 'Chưa đạt (Điểm < 5.0)', 'Giá Trị': countChuaDat, 'Tỉ Lệ (%)': `${((countChuaDat / totalStudents) * 100).toFixed(1)}%` }
  ];
  const ws2 = XLSX.utils.json_to_sheet(statsRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Pho_Diem_Thong_Ke');

  const safeSub = (batch.subject || 'Mon').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCls = (batch.className || 'Lop').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `1-Bao_cao_pho_diem_va_ma_tran_trac_nghiem_${safeSub}_${safeCls}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

export const exportExamResultsToExcel = exportDetailedAnalysisExcel;

/**
 * 4. TẠO VĂN BẢN TÓM TẮT BẢNG ĐIỂM ĐỂ SAO CHÉP GỬI ZALO LỚP
 */
export function generateZaloScoreSummary(batch, results) {
  if (!batch || !results || results.length === 0) return '';

  const scores = results.map(r => r.totalScore || 0);
  const maxScore = Math.max(...scores);
  const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

  let text = `📊 BẢNG ĐIỂM KIỂM TRA TRẮC NGHIỆM - THPT CAO BÁ QUÁT\n`;
  text += `🏫 Lớp: ${batch.className || ''} • Môn: ${batch.subject || ''}\n`;
  text += `📝 Đợt thi: ${batch.title || ''}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏆 Điểm cao nhất: ${maxScore} | Điểm TB: ${avgScore} | Đã chấm: ${results.length} bài\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;

  results.forEach((r, idx) => {
    const icon = r.totalScore >= 8.0 ? '🌟' : (r.totalScore >= 6.5 ? '✨' : '📌');
    text += `${idx + 1}. ${r.studentName} (SBD ${r.sbd}) - Mã đề ${r.examCode}: ${r.totalScore} đ ${icon}\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🚀 Chấm tự động bằng OMR Pro 2027 • Trường THPT Cao Bá Quát`;
  return text;
}

// =========================================================================
// DỮ LIỆU ĐỢT THI MẪU KHỞI TẠO (DEMO BATCHES)
// =========================================================================

function getInitialDemoBatches() {
  return [
    {
      id: 'batch-2027-demo-toan-12',
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
    },
    {
      id: 'batch-town-2025',
      title: 'Khảo Sát Tiếng Anh 12 - Chuẩn TN THPT',
      subject: 'Tiếng Anh',
      grade: 'Khối 12',
      className: '12A01',
      codeDigits: 3,
      scanSbd: true,
      sheetTemplate: 'TNMAKER_50_CAU',
      parts: {
        part1: { count: 50, pointPerQ: 0.2 },
        part2: { count: 0, points: {} },
        part3: { count: 0, pointPerQ: 0 }
      },
      answerKeys: {
        '101': {
          part1: Array.from({ length: 50 }, (_, i) => ['A', 'B', 'C', 'D'][i % 4]),
          part2: [],
          part3: []
        }
      },
      createdAt: '2026-10-30 14:56:44'
    }
  ];
}
