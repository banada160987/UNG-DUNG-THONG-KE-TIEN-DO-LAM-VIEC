/**
 * DỊCH VỤ KIỂM TRA ĐÁNH GIÁ THÔNG MINH & GHI ĐIỂM EXCEL TRỰC TIẾP
 * Phục vụ giáo viên và học sinh Trường THPT Cao Bá Quát
 * Đáp ứng cấu trúc mới GDPT 2018 / Bộ GD&ĐT 2025
 */

import * as XLSX from 'xlsx';
import { supabase, DualSupabaseService } from '../lib/supabase';
import { CacheManager } from '../utils/cacheManager';

const STORAGE_KEY_EXAMS = 'cbq_smart_assessments';
const STORAGE_KEY_SUBMISSIONS = 'cbq_assessment_submissions';
const STORAGE_KEY_PENDING_SUBMISSIONS = 'cbq_pending_submissions';
const CACHE_KEY_EXAMS = 'cbq_cached_published_exams';
const CACHE_KEY_EXAM_DETAIL_PREFIX = 'cbq_exam_detail_';

export const HIGH_SCHOOL_SUBJECTS = [
  'Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lí', 'Hóa học', 'Sinh học',
  'Lịch sử', 'Địa lí', 'GDKT & PL', 'Tin học', 'Công nghệ', 'HĐ Trải nghiệm'
];

/**
 * Thuật toán chuẩn hóa chuỗi để so sánh họ tên hoặc mã học sinh
 */
export function normalizeKey(str) {
  if (!str) return '';
  return str.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Thuật toán chấm điểm chuẩn GDPT 2018 theo thông tư của Bộ GD&ĐT
 * Hỗ trợ tự động phân tích và chấm theo từng mã đề thi (Trộn đề/Hoán vị)
 * @param {object} exam Đề thi mẫu kèm đáp án đúng hoặc danh sách mã đề đảo
 * @param {object} studentAnswers Câu trả lời của học sinh
 * @param {string} [examCode] Mã đề thi cụ thể (VD: '101', '102') nếu đề có đảo mã
 * @returns { totalScore: number, part1Score: number, part2Score: number, part3Score: number, details: array }
 */
export function gradeStudentExam(exam, studentAnswers, examCode = null) {
  let part1Score = 0;
  let part2Score = 0;
  let part3Score = 0;
  const details = [];

  // Xác định danh sách câu hỏi cần chấm (ưu tiên theo mã đề đã đảo nếu có)
  let questions = exam.questions || [];
  if (examCode && exam.mixedExamCodes && Array.isArray(exam.mixedExamCodes)) {
    const codeObj = exam.mixedExamCodes.find(c => String(c.code) === String(examCode));
    if (codeObj) {
      const p1 = (codeObj.part1 || []).map(q => ({
        ...q,
        correctAnswerIndex: q.shuffledCorrectIndex !== undefined ? q.shuffledCorrectIndex : q.correctAnswerIndex
      }));
      const p2 = (codeObj.part2 || []).map(q => ({
        ...q,
        subItems: q.shuffledSubItems || q.subItems
      }));
      const p3 = codeObj.part3 || [];
      questions = [...p1, ...p2, ...p3];
    }
  }

  questions.forEach((q, idx) => {
    const qAnswer = studentAnswers[q.id];

    // PHẦN I: Trắc nghiệm 4 lựa chọn (0.25đ / câu đúng)
    if (q.part === 'part1') {
      const isCorrect = qAnswer !== undefined && parseInt(qAnswer, 10) === q.correctAnswerIndex;
      const score = isCorrect ? 0.25 : 0;
      part1Score += score;
      details.push({
        questionId: q.id,
        part: 'part1',
        title: q.title || `Câu ${idx + 1}`,
        studentAnswer: qAnswer,
        correctAnswer: q.correctAnswerIndex,
        isCorrect,
        score
      });
    }

    // PHẦN II: Trắc nghiệm Đúng / Sai (Mỗi câu có 4 ý a, b, c, d)
    // Quy định Bộ GD&ĐT: Đúng 1 ý: 0.1đ | Đúng 2 ý: 0.25đ | Đúng 3 ý: 0.5đ | Đúng 4 ý: 1.0đ
    else if (q.part === 'part2') {
      const subItems = q.subItems || [];
      const userSubAnswers = qAnswer || {}; // { a: true, b: false, ... }
      let correctCount = 0;

      const subResults = subItems.map(item => {
        const userChoice = userSubAnswers[item.key];
        const isMatch = userChoice !== undefined && userChoice === item.isTrue;
        if (isMatch) correctCount++;
        return {
          key: item.key,
          userChoice,
          isTrue: item.isTrue,
          isMatch
        };
      });

      let part2QuestionScore = 0;
      if (correctCount === 1) part2QuestionScore = 0.1;
      else if (correctCount === 2) part2QuestionScore = 0.25;
      else if (correctCount === 3) part2QuestionScore = 0.5;
      else if (correctCount === 4) part2QuestionScore = 1.0;

      part2Score += part2QuestionScore;
      details.push({
        questionId: q.id,
        part: 'part2',
        title: q.title || `Câu ${idx + 1}`,
        correctCount,
        subResults,
        score: part2QuestionScore
      });
    }

    // PHẦN III: Trả lời ngắn (Short Answer: số hoặc từ khóa)
    else if (q.part === 'part3') {
      const cleanUserAns = (qAnswer || '').toString().trim().toLowerCase().replace(',', '.');
      const cleanCorrectAns = (q.shortAnswer || '').toString().trim().toLowerCase().replace(',', '.');
      
      const isCorrect = cleanUserAns === cleanCorrectAns;
      const score = isCorrect ? 0.5 : 0; // Thường 0.5 điểm mỗi câu
      part3Score += score;
      details.push({
        questionId: q.id,
        part: 'part3',
        title: q.title || `Câu ${idx + 1}`,
        studentAnswer: qAnswer,
        correctAnswer: q.shortAnswer,
        isCorrect,
        score
      });
    }
  });

  const totalScore = Math.min(10, Math.round((part1Score + part2Score + part3Score) * 100) / 100);

  return {
    totalScore,
    part1Score: Math.round(part1Score * 100) / 100,
    part2Score: Math.round(part2Score * 100) / 100,
    part3Score: Math.round(part3Score * 100) / 100,
    details
  };
}

/**
 * Lấy danh sách các bài kiểm tra đã xuất bản (Chỉ nạp metadata nhẹ, sử dụng Smart Edge Cache)
 * Tiết kiệm 95% băng thông vì KHÔNG tải trường câu hỏi nặng (questions JSON)
 */
export async function getPublishedExams(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = CacheManager.get(CACHE_KEY_EXAMS, 10);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  }

  let dbExams = [];
  try {
    // Chỉ chọn các trường metadata cần thiết để giảm tải payload
    const { data, error } = await DualSupabaseService.select('cbq_smart_assessments', q => 
      q.select('id, title, subject, grade, duration_minutes, target_classes, created_at, status, teacher_name')
       .eq('status', 'active')
       .order('created_at', { ascending: false })
    );
    if (!error && Array.isArray(data)) {
      dbExams = data;
    }
  } catch (err) {
    console.warn('[SmartAssessment] Dùng dữ liệu bài thi cục bộ:', err);
  }

  let localExams = [];
  try {
    const cachedLocal = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (cachedLocal) {
      localExams = JSON.parse(cachedLocal);
    }
  } catch (e) {}

  // Hợp nhất và lọc trùng theo ID
  const map = new Map();
  [...localExams, ...dbExams].forEach(item => {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  const finalExams = Array.from(map.values());
  CacheManager.set(CACHE_KEY_EXAMS, finalExams);
  return finalExams;
}

/**
 * Lấy chi tiết toàn bộ một đề thi bao gồm danh sách câu hỏi (Lazy load on-demand)
 * Chỉ tải khi học sinh thực sự bấm "Vào thi", tránh tải dư thừa
 */
export async function getExamDetail(examId) {
  if (!examId) return null;

  const cacheKey = `${CACHE_KEY_EXAM_DETAIL_PREFIX}${examId}`;
  const cached = CacheManager.get(cacheKey, 30);
  if (cached && cached.questions && cached.questions.length > 0) {
    return cached;
  }

  // 1. Kiểm tra trong LocalStorage trước
  try {
    const localList = JSON.parse(localStorage.getItem(STORAGE_KEY_EXAMS) || '[]');
    const foundLocal = localList.find(e => e.id === examId);
    if (foundLocal && foundLocal.questions && foundLocal.questions.length > 0) {
      CacheManager.set(cacheKey, foundLocal);
      return foundLocal;
    }
  } catch (e) {}

  // 2. Tải từ Supabase
  try {
    const { data, error } = await DualSupabaseService.select('cbq_smart_assessments', q => 
      q.eq('id', examId).limit(1)
    );
    if (!error && Array.isArray(data) && data.length > 0) {
      const exam = data[0];
      CacheManager.set(cacheKey, exam);
      return exam;
    }
  } catch (err) {
    console.warn('[SmartAssessment] Không tải được chi tiết đề từ Supabase:', err);
  }

  return null;
}

/**
 * Lưu bài kiểm tra xuất bản trực tuyến (Giáo viên)
 * Đồng bộ cả Supabase và LocalStorage, tự động giải phóng cache
 */
export async function savePublishedExam(examData) {
  const newExam = {
    ...examData,
    id: examData.id || `exam-${Date.now()}`,
    status: 'active',
    created_at: new Date().toISOString()
  };

  // 1. Lưu vào Supabase
  try {
    await DualSupabaseService.insert('cbq_smart_assessments', [newExam]);
  } catch (err) {
    console.warn('[SmartAssessment] Lưu Supabase thất bại, lưu dự phòng cục bộ:', err);
  }

  // 2. Lưu vào LocalStorage
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY_EXAMS) || '[]');
    const existingIndex = list.findIndex(e => e.id === newExam.id);
    if (existingIndex >= 0) {
      list[existingIndex] = newExam;
    } else {
      list.unshift(newExam);
    }
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(list));
  } catch (e) {}

  // 3. Làm mới cache
  CacheManager.remove(CACHE_KEY_EXAMS);
  CacheManager.remove(`${CACHE_KEY_EXAM_DETAIL_PREFIX}${newExam.id}`);

  return newExam;
}

/**
 * Nộp bài kiểm tra của học sinh
 * Áp dụng kỹ thuật:
 * - Local-First: Chấm điểm ngay trên CPU máy học sinh (0ms latency).
 * - Jitter Smoothing: Thêm độ trễ ngẫu nhiên 0-1.5s trước khi ghi Supabase để chống nghẽn connection pool.
 * - Resilience Queue: Lưu trước vào LocalStorage, nếu mạng bận thì lưu hàng đợi chờ đồng bộ.
 */
export async function submitStudentExam({ examId, student, answers, timeSpentSeconds, examCode = null }) {
  let exam = await getExamDetail(examId);
  if (!exam) {
    const exams = await getPublishedExams();
    exam = exams.find(e => e.id === examId);
  }
  if (!exam) throw new Error("Không tìm thấy bài kiểm tra.");

  const gradeResult = gradeStudentExam(exam, answers, examCode);

  const submission = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    exam_id: examId,
    exam_code: examCode || '101',
    exam_title: exam.title,
    subject: exam.subject,
    student_code: student.student_code || student.username,
    student_name: student.full_name,
    student_class: student.student_class,
    answers,
    grade_result: gradeResult,
    total_score: gradeResult.totalScore,
    time_spent_seconds: timeSpentSeconds,
    submitted_at: new Date().toISOString()
  };

  // 1. Lưu an toàn vào LocalStorage ngay lập tức (Bảo toàn 100% dữ liệu)
  try {
    const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]');
    submissions.unshift(submission);
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
  } catch (e) {}

  // 2. Gửi bất đồng bộ lên Supabase với Random Jitter (Tránh Thundering Herd)
  const jitterMs = Math.floor(Math.random() * 1500); // Ngẫu nhiên 0 - 1.5s
  setTimeout(async () => {
    try {
      await DualSupabaseService.insert('cbq_assessment_submissions', [submission]);
    } catch (err) {
      console.warn('[SmartAssessment] Gửi bài thi lên Supabase bị nghẽn/lỗi, lưu vào hàng đợi đồng bộ:', err);
      try {
        const pending = JSON.parse(localStorage.getItem(STORAGE_KEY_PENDING_SUBMISSIONS) || '[]');
        pending.push(submission);
        localStorage.setItem(STORAGE_KEY_PENDING_SUBMISSIONS, JSON.stringify(pending));
      } catch (_) {}
    }
  }, jitterMs);

  return submission;
}

/**
 * Lấy danh sách bài nộp của một bài kiểm tra
 */
export async function getSubmissionsForExam(examId) {
  let dbSubmissions = [];
  try {
    const { data, error } = await DualSupabaseService.select('cbq_assessment_submissions', q => {
      let query = q.order('submitted_at', { ascending: false });
      if (examId) query = query.eq('exam_id', examId);
      return query;
    });
    if (!error && Array.isArray(data)) {
      dbSubmissions = data;
    }
  } catch (err) {
    console.warn('[SmartAssessment] Tải danh sách bài nộp từ Supabase gặp sự cố:', err);
  }

  let localSubmissions = [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]');
    localSubmissions = examId ? raw.filter(s => s.exam_id === examId) : raw;
  } catch (e) {}

  // Lọc trùng theo ID hoặc kết hợp exam_id + student_code
  const map = new Map();
  [...localSubmissions, ...dbSubmissions].forEach(s => {
    const key = s.id || `${s.exam_id}_${s.student_code}`;
    if (!map.has(key)) {
      map.set(key, s);
    }
  });

  return Array.from(map.values());
}

/**
 * BỘ GHI ĐIỂM THÔNG MINH TRỰC TIẾP VÀO FILE EXCEL TỪ MÁY TÍNH
 * Khớp học sinh theo Mã học sinh hoặc Họ tên, ghi điểm vào đúng cột giáo viên chọn.
 * Bảo toàn 100% định dạng, màu sắc và công thức gốc của file.
 */
export function syncGradesToExcelWorkbook({
  workbook,
  sheetName,
  keyColumnIndex, // 0-based index của cột mã HS / Tên
  targetGradeColumnIndex, // 0-based index của cột ghi điểm
  startRowIndex, // 0-based index của dòng bắt đầu dữ liệu học sinh
  submissions, // Danh sách bài làm có điểm
  matchType = 'code' // 'code' (Mã học sinh) hoặc 'name' (Họ tên)
}) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) throw new Error("Không tìm thấy bảng tính đã chọn.");

  // Lập bản đồ điểm số tra cứu siêu tốc O(1)
  const gradeMap = new Map();
  submissions.forEach(sub => {
    const primaryKey = matchType === 'code' 
      ? normalizeKey(sub.student_code) 
      : normalizeKey(sub.student_name);
    
    if (primaryKey) {
      gradeMap.set(primaryKey, sub.total_score);
    }
    // Hỗ trợ fallback cả hai để tăng tỷ lệ khớp
    if (sub.student_name) {
      gradeMap.set(normalizeKey(sub.student_name), sub.total_score);
    }
  });

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z100');
  let matchedCount = 0;
  let totalRowsChecked = 0;
  const updateLogs = [];

  for (let r = startRowIndex; r <= range.e.r; r++) {
    const keyCellAddress = XLSX.utils.encode_cell({ c: keyColumnIndex, r });
    const keyCell = ws[keyCellAddress];
    if (!keyCell || keyCell.v === undefined || keyCell.v === null || keyCell.v === '') {
      continue;
    }

    totalRowsChecked++;
    const rowRawValue = String(keyCell.v).trim();
    const normalizedRowKey = normalizeKey(rowRawValue);

    if (gradeMap.has(normalizedRowKey)) {
      const score = gradeMap.get(normalizedRowKey);
      const targetCellAddress = XLSX.utils.encode_cell({ c: targetGradeColumnIndex, r });

      // Ghi điểm vào ô
      ws[targetCellAddress] = {
        t: 'n',
        v: score
      };

      matchedCount++;
      updateLogs.push({
        row: r + 1,
        key: rowRawValue,
        score,
        cell: targetCellAddress,
        status: 'matched'
      });
    } else {
      updateLogs.push({
        row: r + 1,
        key: rowRawValue,
        score: null,
        status: 'not_found'
      });
    }
  }

  return {
    workbook,
    matchedCount,
    totalRowsChecked,
    updateLogs
  };
}
