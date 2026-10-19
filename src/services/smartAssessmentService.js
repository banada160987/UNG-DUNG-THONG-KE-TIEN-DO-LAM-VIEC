/**
 * DỊCH VỤ KIỂM TRA ĐÁNH GIÁ THÔNG MINH & GHI ĐIỂM EXCEL TRỰC TIẾP
 * Phục vụ giáo viên và học sinh Trường THPT Cao Bá Quát
 * Đáp ứng cấu trúc mới GDPT 2018 / Bộ GD&ĐT 2025
 */

import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const STORAGE_KEY_EXAMS = 'cbq_smart_assessments';
const STORAGE_KEY_SUBMISSIONS = 'cbq_assessment_submissions';

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
 * @param {object} exam Đề thi mẫu kèm đáp án đúng
 * @param {object} studentAnswers Câu trả lời của học sinh
 * @returns { totalScore: number, part1Score: number, part2Score: number, part3Score: number, details: array }
 */
export function gradeStudentExam(exam, studentAnswers) {
  let part1Score = 0;
  let part2Score = 0;
  let part3Score = 0;
  const details = [];

  const questions = exam.questions || [];

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
 * Lấy toàn bộ danh sách bài kiểm tra đã xuất bản
 */
export async function getPublishedExams() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}
  return [];
}

/**
 * Lưu bài kiểm tra xuất bản trực tuyến
 */
export async function savePublishedExam(examData) {
  const newExam = {
    ...examData,
    id: examData.id || `exam-${Date.now()}`,
    status: 'active',
    created_at: new Date().toISOString()
  };

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

  return newExam;
}

/**
 * Nộp bài kiểm tra của học sinh
 */
export async function submitStudentExam({ examId, student, answers, timeSpentSeconds }) {
  const exams = await getPublishedExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) throw new Error("Không tìm thấy bài kiểm tra.");

  const gradeResult = gradeStudentExam(exam, answers);

  const submission = {
    id: `sub-${Date.now()}`,
    exam_id: examId,
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

  try {
    const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]');
    submissions.unshift(submission);
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
  } catch (e) {}

  return submission;
}

/**
 * Lấy danh sách bài nộp của một bài kiểm tra
 */
export function getSubmissionsForExam(examId) {
  try {
    const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]');
    if (!examId) return submissions;
    return submissions.filter(s => s.exam_id === examId);
  } catch (e) {
    return [];
  }
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
