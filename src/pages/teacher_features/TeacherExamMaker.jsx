import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, Award, BookOpen, Download, Plus, Trash2, Edit3, Shuffle, 
  FileText, CheckCircle2, HelpCircle, Layers, Printer, RefreshCw, Eye, 
  CheckSquare, Send, FileSpreadsheet, Sparkles, QrCode, Upload, Image,
  Copy, Search, Filter, Database, FolderTree, Camera
} from 'lucide-react';
import MathView, { MathToolbar } from '../../components/MathView';
import BankExamPickerModal from '../../components/BankExamPickerModal';
import { 
  savePublishedExam, 
  getSubmissionsForExam, 
  HIGH_SCHOOL_SUBJECTS 
} from '../../services/smartAssessmentService';
import {
  SUBJECT_OPTIONS,
  GRADE_OPTIONS,
  EXAM_TYPE_OPTIONS,
  SUBJECT_TOPICS_MAP,
  getMatrixConfigForSubject,
  getSampleQuestionsForSubject
} from '../../services/examPresetsService';
import ExcelGradeSyncModal from '../../components/ExcelGradeSyncModal';
import { getTeacherSession } from '../../services/authSessionManager';
import AiStatusBadge from '../../components/AiStatusBadge';
import AiSettingsModal from '../../components/AiSettingsModal';
import { 
  generate2025ExamQuestionsAi, 
  parseRawExamQuestionsAi, 
  getStoredAiKey 
} from '../../services/aiAssistantService';

// Đồ thị hàm số bậc 3 y = x^3 - 3x + 2 minh họa chuẩn giáo khoa GDPT 2018
export const CUBIC_GRAPH_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220" style="background:%23ffffff;border-radius:8px;"><defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="%23334155"/></marker></defs><line x1="20" y1="120" x2="300" y2="120" stroke="%23334155" stroke-width="1.5" marker-end="url(%23arrow)"/><text x="302" y="125" font-family="Times New Roman, serif" font-size="14" font-style="italic" fill="%23334155">x</text><line x1="160" y1="200" x2="160" y2="20" stroke="%23334155" stroke-width="1.5" marker-end="url(%23arrow)"/><text x="165" y="22" font-family="Times New Roman, serif" font-size="14" font-style="italic" fill="%23334155">y</text><text x="145" y="135" font-family="Times New Roman, serif" font-size="13" font-style="italic" fill="%2364748b">O</text><line x1="110" y1="117" x2="110" y2="123" stroke="%23334155" stroke-width="1.5"/><text x="102" y="136" font-family="Times New Roman, serif" font-size="12" fill="%23334155">-1</text><line x1="210" y1="117" x2="210" y2="123" stroke="%23334155" stroke-width="1.5"/><text x="207" y="136" font-family="Times New Roman, serif" font-size="12" fill="%23334155">1</text><line x1="157" y1="60" x2="163" y2="60" stroke="%23334155" stroke-width="1.5"/><text x="145" y="64" font-family="Times New Roman, serif" font-size="12" fill="%23334155">4</text><line x1="110" y1="120" x2="110" y2="60" stroke="%2394a3b8" stroke-dasharray="3,3"/><line x1="110" y1="60" x2="160" y2="60" stroke="%2394a3b8" stroke-dasharray="3,3"/><path d="M 70 200 C 95 120, 95 60, 110 60 C 130 60, 140 100, 160 100 C 180 100, 195 120, 210 120 C 230 120, 245 40, 260 20" fill="none" stroke="%23dc2626" stroke-width="2.5"/><circle cx="110" cy="60" r="3.5" fill="%23dc2626"/><circle cx="210" cy="120" r="3.5" fill="%23dc2626"/><circle cx="160" cy="100" r="3" fill="%23334155"/><text x="165" y="98" font-family="Times New Roman, serif" font-size="12" fill="%23334155">2</text></svg>`;

// Hình học không gian: Hình chóp S.ABCD SA vuông góc đáy chuẩn SGK
export const PYRAMID_GEOMETRY_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 220" width="280" height="220" style="background:%23ffffff;border-radius:8px;"><line x1="100" y1="30" x2="50" y2="180" stroke="%230f172a" stroke-width="1.8"/><line x1="100" y1="30" x2="200" y2="180" stroke="%230f172a" stroke-width="1.8"/><line x1="100" y1="30" x2="230" y2="140" stroke="%230f172a" stroke-width="1.8"/><line x1="50" y1="180" x2="200" y2="180" stroke="%230f172a" stroke-width="1.8"/><line x1="200" y1="180" x2="230" y2="140" stroke="%230f172a" stroke-width="1.8"/><line x1="100" y1="30" x2="100" y2="140" stroke="%230284c7" stroke-width="1.8" stroke-dasharray="4,4"/><line x1="100" y1="140" x2="50" y2="180" stroke="%230f172a" stroke-width="1.5" stroke-dasharray="4,4"/><line x1="100" y1="140" x2="230" y2="140" stroke="%230f172a" stroke-width="1.5" stroke-dasharray="4,4"/><line x1="50" y1="180" x2="230" y2="140" stroke="%2394a3b8" stroke-width="1.2" stroke-dasharray="3,3"/><polyline points="100,128 112,128 112,140" fill="none" stroke="%230284c7" stroke-width="1.2"/><text x="95" y="22" font-family="Times New Roman, serif" font-size="15" font-weight="bold" fill="%230f172a">S</text><text x="82" y="142" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="%230f172a">A</text><text x="35" y="190" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="%230f172a">B</text><text x="205" y="195" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="%230f172a">C</text><text x="238" y="145" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="%230f172a">D</text></svg>`;

// Pre-built Exam Database for GDPT 2018 (Toán 11 / 12 - Cấu trúc Mới 2025 theo Bộ GD&ĐT với chuẩn LaTeX KaTeX)
const INITIAL_QUESTIONS = [
  // PHẦN I: Trắc nghiệm 4 lựa chọn (12 câu chuẩn)
  {
    id: 'q1',
    part: 'part1',
    title: 'Câu 1 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Nhận biết',
    content: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 3$ và công sai $d = 2$. Giá trị của $u_2$ bằng:',
    options: ['$5$', '$6$', '$1$', '$-1$'],
    correctAnswerIndex: 0, // Option A: 5
    explanation: 'Ta có $u_2 = u_1 + d = 3 + 2 = 5$.'
  },
  {
    id: 'q2',
    part: 'part1',
    title: 'Câu 2 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Thông hiểu',
    content: 'Cho cấp số nhân $(v_n)$ có $v_1 = 2$ và công bội $q = 3$. Số hạng thứ 4 của cấp số nhân là:',
    options: ['$54$', '$162$', '$18$', '$24$'],
    correctAnswerIndex: 0, // Option A: 54
    explanation: 'Ta có $v_4 = v_1 \\cdot q^3 = 2 \\cdot 3^3 = 2 \\cdot 27 = 54$.'
  },
  {
    id: 'q3',
    part: 'part1',
    title: 'Câu 3 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Nhận biết',
    content: 'Tập xác định $D$ của hàm số $y = \\log_2(x - 1)$ là:',
    options: ['$D = (1; +\\infty)$', '$D = [1; +\\infty)$', '$D = \\mathbb{R} \\setminus \\{1\\}$', '$D = (0; +\\infty)$'],
    correctAnswerIndex: 0,
    explanation: 'Điều kiện xác định $x - 1 > 0 \\Leftrightarrow x > 1$. Vậy $D = (1; +\\infty)$.'
  },
  {
    id: 'q4',
    part: 'part1',
    title: 'Câu 4 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Nhận biết',
    content: 'Trong không gian $Oxyz$, tọa độ vectơ $\\vec{u} = 2\\vec{i} - 3\\vec{j} + \\vec{k}$ là:',
    options: ['$(2; -3; 1)$', '$(2; 3; 1)$', '$(-2; 3; -1)$', '$(2; -3; 0)$'],
    correctAnswerIndex: 0,
    explanation: 'Vectơ $\\vec{u} = 2\\vec{i} - 3\\vec{j} + 1\\vec{k}$ có tọa độ là $(2; -3; 1)$.'
  },

  // PHẦN II: Trắc nghiệm Đúng / Sai (4 ý a, b, c, d)
  {
    id: 'q5',
    part: 'part2',
    title: 'Câu 1 (Phần II - Trắc nghiệm Đúng/Sai)',
    level: 'Thông hiểu',
    content: 'Cho hàm số $y = f(x) = x^3 - 3x + 2$ có đồ thị $(C)$ như hình vẽ bên dưới. Xét tính Đúng/Sai của các mệnh đề sau:',
    image_url: CUBIC_GRAPH_SVG,
    subItems: [
      { key: 'a', text: 'Hàm số đã cho đồng biến trên khoảng $(1; +\\infty)$.', isTrue: true },
      { key: 'b', text: 'Hàm số đã cho có $2$ điểm cực trị.', isTrue: true },
      { key: 'c', text: 'Giá trị cực đại của hàm số bằng $0$.', isTrue: false },
      { key: 'd', text: 'Đồ thị hàm số cắt trục tung tại điểm có tung độ bằng $2$.', isTrue: true }
    ],
    explanation: '$f\'(x) = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Ta có $f(-1) = 4$ (Cực đại), $f(1) = 0$ (Cực tiểu).'
  },
  {
    id: 'q6',
    part: 'part2',
    title: 'Câu 2 (Phần II - Trắc nghiệm Đúng/Sai)',
    level: 'Vận dụng',
    content: 'Một hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = a\\sqrt{2}$ (tham khảo hình vẽ bên dưới).',
    image_url: PYRAMID_GEOMETRY_SVG,
    subItems: [
      { key: 'a', text: 'Thể tích khối chóp $S.ABCD$ bằng $\\frac{a^3 \\sqrt{2}}{3}$.', isTrue: true },
      { key: 'b', text: 'Góc giữa đường thẳng $SB$ và mặt phẳng $(ABCD)$ bằng $45^\\circ$.', isTrue: false },
      { key: 'c', text: '$BD \\perp SC$.', isTrue: true },
      { key: 'd', text: 'Khoảng cách từ điểm $A$ đến mặt phẳng $(SBD)$ bằng $\\frac{a\\sqrt{2}}{2}$.', isTrue: false }
    ],
    explanation: '$V = \\frac{1}{3} S_{ABCD} \\cdot SA = \\frac{1}{3} a^2 \\cdot a\\sqrt{2} = \\frac{a^3 \\sqrt{2}}{3}$.'
  },

  // PHẦN III: Trả lời ngắn (Short answer)
  {
    id: 'q7',
    part: 'part3',
    title: 'Câu 1 (Phần III - Trắc nghiệm Trả lời ngắn)',
    level: 'Vận dụng',
    content: 'Một doanh nghiệp sản xuất sản phẩm có hàm chi phí $C(x) = 2x^2 + 500x + 5000$ (ngàn đồng). Tìm số sản phẩm $x$ để chi phí trung bình $\\bar{C}(x)$ đạt giá trị nhỏ nhất.',
    shortAnswer: '50',
    explanation: '$\\bar{C}(x) = 2x + 500 + \\frac{5000}{x} \\ge 500 + 2\\sqrt{2x \\cdot \\frac{5000}{x}} = 700$. Dấu bằng xảy ra khi $2x = \\frac{5000}{x} \\Leftrightarrow x^2 = 2500 \\Leftrightarrow x = 50$.'
  },
  {
    id: 'q8',
    part: 'part3',
    title: 'Câu 2 (Phần III - Trắc nghiệm Trả lời ngắn)',
    level: 'Vận dụng cao',
    content: 'Cho phương trình $4^x - m \\cdot 2^{x+1} + 2m = 0$. Tìm số các giá trị nguyên của tham số $m \\in [-10; 10]$ để phương trình có $2$ nghiệm phân biệt.',
    shortAnswer: '8',
    explanation: 'Đặt $t = 2^x$ ($t > 0$). Phương trình trở thành $t^2 - 2mt + 2m = 0$ có 2 nghiệm $t_1 > t_2 > 0$. Điều kiện $\\Delta\' > 0, S > 0, P > 0 \\Leftrightarrow m > 2$. Vì $m \\in [-10; 10], m \\in \\mathbb{Z} \\Rightarrow m \\in \\{3, 4, 5, 6, 7, 8, 9, 10\\}$ (có 8 giá trị).'
  },

  // PHẦN IV: Tự luận (Essay)
  {
    id: 'q9',
    part: 'essay',
    title: 'Câu 1 (Phần IV - Tự luận)',
    level: 'Vận dụng',
    content: 'Một hộ kinh doanh nông sản dự định xây một hầm chứa thóc dạng hình hộp chữ nhật không nắp có thể tích $V = 32\\text{ m}^3$, đáy là hình chữ nhật có chiều dài gấp đôi chiều rộng. Chi phí xây dựng đáy là $300.000\\text{ đ/m}^2$, chi phí xây dựng bốn bức tường xung quanh là $200.000\\text{ đ/m}^2$. Xác định kích thước của hầm chứa (chiều dài, chiều rộng, chiều cao) để tổng chi phí xây dựng là nhỏ nhất.',
    maxScore: 2.0,
    rubric: [
      { criteria: 'Thiết lập biểu thức diện tích và hàm chi phí $C(x)$ theo chiều rộng đáy $x$', score: 0.75 },
      { criteria: 'Khảo sát hàm số tìm giá trị nhỏ nhất hoặc áp dụng bất đẳng thức AM-GM', score: 0.75 },
      { criteria: 'Kết luận kích thước tối ưu: chiều rộng $2\\text{ m}$, chiều dài $4\\text{ m}$, chiều cao $4\\text{ m}$', score: 0.5 }
    ],
    explanation: 'Gọi chiều rộng đáy là $x$ ($x > 0$), chiều dài đáy là $2x$. Thể tích $V = 2x^2 \\cdot h = 32 \\Rightarrow h = \\frac{16}{x^2}$. Tổng chi phí $C(x) = 300 \\cdot 2x^2 + 200 \\cdot (2 \\cdot 2xh + 2 \\cdot xh) = 600x^2 + \\frac{19200}{x}$. Khảo sát $C\'(x) = 1200x - \\frac{19200}{x^2} = 0 \\Leftrightarrow x^3 = 16 \\Rightarrow x = 2$. Vậy rộng $2\\text{ m}$, dài $4\\text{ m}$, cao $4\\text{ m}$.'
  }
];

export default function TeacherExamMaker() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(() => {
    return getTeacherSession() || { full_name: 'Giáo viên THPT Cao Bá Quát', username: 'giaovien' };
  });

  // Meta info
  const [examType, setExamType] = useState('midterm');
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('Khối 11');
  const [duration, setDuration] = useState('90 phút');
  const [schoolYear, setSchoolYear] = useState('2026 - 2027');
  const [examTitle, setExamTitle] = useState('ĐỀ KIỂM TRA GIỮA HỌC KỲ MÔN TOÁN - KHỐI 11 NĂM HỌC 2026 - 2027');

  // Đổi môn học thông minh: Tự động cập nhật thời gian, tiêu đề, chủ đề AI và ma trận
  const handleSubjectChange = (newSubId) => {
    setSubject(newSubId);
    const subConfig = SUBJECT_OPTIONS.find(s => s.id === newSubId);
    if (subConfig) {
      setDuration(subConfig.defaultDuration);
    }
    const typeObj = EXAM_TYPE_OPTIONS.find(t => t.id === examType) || EXAM_TYPE_OPTIONS[1];
    setExamTitle(`${typeObj.defaultPrefix} MÔN ${newSubId.toUpperCase()} - ${grade.toUpperCase()} NĂM HỌC 2026 - 2027`);
    const topics = SUBJECT_TOPICS_MAP[newSubId] || [];
    if (topics.length > 0) {
      setAiTopic(topics[0]);
    }
  };

  // Đổi khối lớp
  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    const typeObj = EXAM_TYPE_OPTIONS.find(t => t.id === examType) || EXAM_TYPE_OPTIONS[1];
    setExamTitle(`${typeObj.defaultPrefix} MÔN ${subject.toUpperCase()} - ${newGrade.toUpperCase()} NĂM HỌC 2026 - 2027`);
  };

  // Đổi loại bài kiểm tra
  const handleExamTypeChange = (newType) => {
    setExamType(newType);
    const typeObj = EXAM_TYPE_OPTIONS.find(t => t.id === newType);
    if (typeObj) {
      setExamTitle(`${typeObj.defaultPrefix} MÔN ${subject.toUpperCase()} - ${grade.toUpperCase()} NĂM HỌC 2026 - 2027`);
    }
  };

  // Nạp bộ câu hỏi mẫu chuẩn Bộ GD&ĐT cho môn học được chọn
  const handleLoadSampleForSubject = (targetSubject = subject) => {
    const samples = getSampleQuestionsForSubject(targetSubject);
    if (samples && samples.length > 0) {
      setQuestions(samples);
      setMixedExamCodes([]);
      alert(`✅ Đã nạp thành công bộ câu hỏi mẫu chuẩn GDPT 2018 môn ${targetSubject} (${samples.length} câu)! Bạn có thể chỉnh sửa, thêm câu hỏi hoặc xáo trộn mã đề ngay.`);
    } else {
      alert(`Chưa có câu hỏi mẫu cho môn ${targetSubject}.`);
    }
  };

  // Questions & Mixed Exams
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [numberOfCodes, setNumberOfCodes] = useState(4);
  const [baseCodeNum, setBaseCodeNum] = useState(101);
  const [mixedExamCodes, setMixedExamCodes] = useState([]);
  const [selectedCodeView, setSelectedCodeView] = useState('101');
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'matrix' | 'preview' | 'keys'

  // Question Bank Search & Filter states
  const [filterPart, setFilterPart] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state to add new question
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPart, setNewPart] = useState('part1');
  const [newLevel, setNewLevel] = useState('Nhận biết');
  const [newContent, setNewContent] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectIdx, setNewCorrectIdx] = useState(0);
  const [newSubItems, setNewSubItems] = useState([
    { key: 'a', text: '', isTrue: true },
    { key: 'b', text: '', isTrue: true },
    { key: 'c', text: '', isTrue: false },
    { key: 'd', text: '', isTrue: false }
  ]);
  const [newShortAnswer, setNewShortAnswer] = useState('');
  const [newMaxScore, setNewMaxScore] = useState(2.0);
  const [newRubric, setNewRubric] = useState([
    { criteria: 'Nêu đúng bản chất / hiện tượng / định lý / dẫn chứng', score: 1.0 },
    { criteria: 'Lập luận logic, giải bài toán / bình luận và rút ra kết luận chuẩn xác', score: 1.0 }
  ]);
  const [newExplanation, setNewExplanation] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Edit Question Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Smart Word / PDF / Text Import States
  const [showImportModal, setShowImportModal] = useState(false);

  // AI Assistant States (BYOK & Soạn đề chuẩn 2025)
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiParsingLoading, setAiParsingLoading] = useState(false);
  const [aiPart, setAiPart] = useState('mixed'); // 'part1', 'part2', 'part3', 'mixed'
  const [aiTopic, setAiTopic] = useState('Chuyên đề ôn tập kiến thức trọng tâm');
  const [aiLevel, setAiLevel] = useState('Thông hiểu');
  const [aiCount, setAiCount] = useState(4);
  const [aiRawContext, setAiRawContext] = useState('');
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState([]);
  const [aiError, setAiError] = useState('');

  // Question Bank Picker Modal (Matrix or Manual Selection)
  const [showBankPickerModal, setShowBankPickerModal] = useState(false);

  const handleInsertFromBank = (bankQuestions) => {
    if (!bankQuestions || bankQuestions.length === 0) return;
    const formatted = bankQuestions.map((q, idx) => ({
      ...q,
      id: q.id || `bank_imp_${Date.now()}_${idx}`
    }));
    setQuestions(prev => [...prev, ...formatted]);
    setMixedExamCodes([]);
  };

  // Smart Assessment Publishing & Excel Grade Sync States
  const [showExcelSyncModal, setShowExcelSyncModal] = useState(false);
  const [showOmrModal, setShowOmrModal] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [examPublished, setExamPublished] = useState(false);
  const [targetExamClasses, setTargetExamClasses] = useState(['10A01', '10A07']);

  const loadSubmissions = () => {
    const list = getSubmissionsForExam('exam-toan-gdpt2018');
    if (list && list.length > 0) {
      setSubmissions(list);
    } else {
      // Dữ liệu học sinh làm bài thi mẫu để giáo viên có thể thử nghiệm ngay tính năng Excel
      const sampleSubmissions = [
        { id: 'sub-1', student_code: '10A0101', student_name: 'Nguyễn Văn An', student_class: '10A01', total_score: 9.25, submitted_at: new Date().toISOString() },
        { id: 'sub-2', student_code: '10A0102', student_name: 'Trần Thị Bình', student_class: '10A01', total_score: 8.5, submitted_at: new Date().toISOString() },
        { id: 'sub-3', student_code: '10A0103', student_name: 'Lê Hoàng Cường', student_class: '10A01', total_score: 7.75, submitted_at: new Date().toISOString() },
        { id: 'sub-4', student_code: '10A0104', student_name: 'Phạm Thu Dung', student_class: '10A01', total_score: 10.0, submitted_at: new Date().toISOString() },
        { id: 'sub-5', student_code: '10A0105', student_name: 'Đặng Tuấn Hải', student_class: '10A01', total_score: 8.0, submitted_at: new Date().toISOString() },
        { id: 'sub-6', student_code: '10A0106', student_name: 'Vũ Ngọc Mai', student_class: '10A01', total_score: 9.0, submitted_at: new Date().toISOString() },
        { id: 'sub-7', student_code: '10A0107', student_name: 'Bùi Gia Phúc', student_class: '10A01', total_score: 6.5, submitted_at: new Date().toISOString() },
        { id: 'sub-8', student_code: '10A0108', student_name: 'Hoàng Minh Tâm', student_class: '10A01', total_score: 8.75, submitted_at: new Date().toISOString() }
      ];
      setSubmissions(sampleSubmissions);
    }
  };

  const handlePublishOnline = async () => {
    try {
      const examData = {
        id: 'exam-toan-gdpt2018',
        title: examTitle,
        subject: subject,
        grade: grade,
        duration_minutes: parseInt(duration, 10) || 45,
        target_classes: targetExamClasses,
        questions: questions,
        mixedExamCodes: mixedExamCodes.length > 0 ? mixedExamCodes : null
      };
      await savePublishedExam(examData);
      setExamPublished(true);
      alert(`🎉 ĐÃ XUẤT BẢN THI TRỰC TUYẾN THÀNH CÔNG!\n\nHọc sinh các lớp ${targetExamClasses.join(', ')} có thể vào Cổng Học Sinh để làm bài thi trực tuyến ngay.`);
    } catch (e) {
      alert("Lỗi khi xuất bản đề thi: " + e.message);
    }
  };
  const [importRawText, setImportRawText] = useState('');
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState([]);

  // Smart Regex Exam Text Parser (Chuẩn GDPT 2018 BGDĐT)
  const parseRawExamText = (rawText) => {
    if (!rawText || !rawText.trim()) return [];

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsedQuestions = [];
    let currentPart = 'part1';
    let currentQ = null;

    lines.forEach((line) => {
      const lower = line.toLowerCase();

      if (lower.includes('phần i') || lower.includes('phan i')) {
        currentPart = 'part1';
        return;
      }
      if (lower.includes('phần ii') || lower.includes('phan ii')) {
        currentPart = 'part2';
        return;
      }
      if (lower.includes('phần iii') || lower.includes('phan iii')) {
        currentPart = 'part3';
        return;
      }
      if (lower.includes('tự luận') || lower.includes('tu luan') || lower.includes('phần iv') || lower.includes('phan iv')) {
        currentPart = 'essay';
        return;
      }

      const questionMatch = line.match(/^(câu|cau|question)\s*(\d+)[\:\.]?\s*(.*)/i);
      if (questionMatch) {
        if (currentQ) parsedQuestions.push(currentQ);
        const qContent = questionMatch[3] || line;
        currentQ = {
          id: `imported-q-${Date.now()}-${parsedQuestions.length}`,
          part: currentPart,
          title: `Câu ${parsedQuestions.length + 1} (${currentPart === 'part1' ? 'Phần I' : currentPart === 'part2' ? 'Phần II' : currentPart === 'part3' ? 'Phần III' : 'Phần Tự Luận'})`,
          level: 'Thông hiểu',
          content: qContent,
          options: [],
          correctAnswerIndex: 0,
          subItems: [],
          shortAnswer: '',
          maxScore: currentPart === 'essay' ? 2.0 : undefined,
          rubric: currentPart === 'essay' ? [{ criteria: 'Nội dung và lập luận', score: 2.0 }] : undefined,
          explanation: ''
        };
        return;
      }

      if (!currentQ) return;

      if (currentPart === 'part1') {
        const optionMatch = line.match(/^([A-D])[\.\:\)]\s*(.*)/i);
        if (optionMatch) {
          const optText = optionMatch[2];
          const isCorrect = line.includes('*') || line.includes('✅') || line.toLowerCase().includes('đáp án đúng');
          const cleanText = optText.replace(/\*|✅|\(đáp án đúng\)/gi, '').trim();

          currentQ.options.push(cleanText);
          if (isCorrect) {
            currentQ.correctAnswerIndex = currentQ.options.length - 1;
          }
          return;
        }

        const keyMatch = line.match(/^(đáp án|dap an)\s*[\:\=]\s*([A-D])/i);
        if (keyMatch) {
          const letter = keyMatch[2].toUpperCase();
          currentQ.correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
          return;
        }
      }

      if (currentPart === 'part2') {
        const subMatch = line.match(/^([a-d])[\.\:\)]\s*(.*)/i);
        if (subMatch) {
          const subKey = subMatch[1].toLowerCase();
          let subText = subMatch[2];
          let isTrue = true;

          if (subText.toLowerCase().includes('[sai]') || subText.toLowerCase().includes('(sai)') || subText.toLowerCase().includes('sai')) {
            isTrue = false;
          }

          subText = subText.replace(/\[đúng\]|\[sai\]|\(đúng\)|\(sai\)|đúng|sai/gi, '').trim();
          currentQ.subItems.push({ key: subKey, text: subText, isTrue });
          return;
        }
      }

      if (currentPart === 'part3') {
        const shortMatch = line.match(/^(đáp số|dap so|đáp án|dap an)\s*[\:\=]\s*(.*)/i);
        if (shortMatch) {
          currentQ.shortAnswer = shortMatch[2].trim();
          return;
        }
      }

      if (line.toLowerCase().startsWith('lời giải:') || line.toLowerCase().startsWith('hướng dẫn giải:')) {
        currentQ.explanation = line.replace(/^(lời giải|hướng dẫn giải)[\:\.]\s*/i, '').trim();
        return;
      }

      if (currentQ.options.length === 0 && currentQ.subItems.length === 0 && !currentQ.shortAnswer) {
        currentQ.content += ' ' + line;
      } else if (currentQ.explanation) {
        currentQ.explanation += ' ' + line;
      }
    });

    if (currentQ) {
      parsedQuestions.push(currentQ);
    }

    return parsedQuestions;
  };

  const handleFileUploadDocxOrPdf = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setImportRawText(text);
      const parsed = parseRawExamText(text);
      setParsedPreviewQuestions(parsed);
    };
    reader.readAsText(file);
  };

  const handleConfirmImportQuestions = () => {
    if (parsedPreviewQuestions.length === 0) {
      alert("Chưa bóc tách được câu hỏi nào. Vui lòng dán văn bản hoặc chọn file đề thi đúng định dạng!");
      return;
    }
    setQuestions([...questions, ...parsedPreviewQuestions]);
    setShowImportModal(false);
    setImportRawText('');
    setParsedPreviewQuestions([]);
    alert(`🎉 Đã nạp thành công ${parsedPreviewQuestions.length} câu hỏi mới vào ngân hàng đề thi!`);
  };

  // AI Question Generation Handler
  const handleGenerateAiExamQuestions = async () => {
    setAiGenerating(true);
    setAiError('');
    try {
      const generated = await generate2025ExamQuestionsAi({
        subject: subject || 'Toán',
        grade: grade || '12',
        topic: aiTopic || 'Khảo sát và ứng dụng',
        part: aiPart,
        count: Number(aiCount) || 4,
        level: aiLevel,
        rawContext: aiRawContext
      });
      setAiGeneratedPreview(generated);
    } catch (err) {
      setAiError(err.message || 'Lỗi khi gọi Trợ lý AI tạo câu hỏi.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleConfirmInsertAiQuestions = () => {
    if (!aiGeneratedPreview || aiGeneratedPreview.length === 0) return;
    setQuestions(prev => [...prev, ...aiGeneratedPreview]);
    setShowAiGenModal(false);
    setAiGeneratedPreview([]);
    alert(`🎉 Đã thêm thành công ${aiGeneratedPreview.length} câu hỏi AI vào ngân hàng đề thi!`);
  };

  // AI Parse Import Text
  const handleAiParseImportText = async () => {
    if (!importRawText || importRawText.trim().length < 10) {
      alert('Vui lòng dán nội dung văn bản đề thi để AI nhận diện.');
      return;
    }
    setAiParsingLoading(true);
    try {
      const parsed = await parseRawExamQuestionsAi(importRawText, subject, grade);
      if (parsed && parsed.length > 0) {
        setParsedPreviewQuestions(parsed);
      } else {
        const fallback = parseRawExamText(importRawText);
        setParsedPreviewQuestions(fallback);
      }
    } catch (e) {
      console.warn('AI parse fallback:', e);
      const fallback = parseRawExamText(importRawText);
      setParsedPreviewQuestions(fallback);
    } finally {
      setAiParsingLoading(false);
    }
  };

  useEffect(() => {
    const active = getTeacherSession();
    if (active) {
      setTeacher(active);
    }
  }, [navigate]);

  // Helper format clean Math content without raw dollar signs
  const renderCleanMathText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/\$(.*?)\$/g, '$1')
      .replace(/\\cdot/g, '·')
      .replace(/\\Leftrightarrow/g, '⇔')
      .replace(/\\Rightarrow/g, '⇒')
      .replace(/\\ge/g, '≥')
      .replace(/\\le/g, '≤')
      .replace(/\\pm/g, '±')
      .replace(/\\infty/g, '∞')
      .replace(/\\sqrt\{(.*?)\}/g, '√($1)')
      .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1)/($2)');
  };

  // Fisher-Yates Shuffle Algorithm
  const shuffleArray = (arr) => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Generator: Đảo Đề Thi theo Chuẩn BGDĐT 2025 (Hỗ trợ tùy chọn mã gốc 101, 201, 301...)
  const handleGenerateMixedExams = () => {
    const codes = [];
    const startNum = parseInt(baseCodeNum, 10) || 101;

    for (let i = 0; i < numberOfCodes; i++) {
      const codeStr = String(startNum + i);
      
      const part1Questions = questions.filter(q => q.part === 'part1');
      const part2Questions = questions.filter(q => q.part === 'part2');
      const part3Questions = questions.filter(q => q.part === 'part3');
      const essayQuestions = questions.filter(q => q.part === 'essay');

      // 1. Shuffle Part 1: Questions & Options (with clean A, B, C, D re-indexing)
      const shuffledPart1 = shuffleArray(part1Questions).map(q => {
        const originalOptionsObj = (q.options || []).map((optText, idx) => ({
          text: optText,
          isCorrect: idx === q.correctAnswerIndex
        }));
        const shuffledOpts = shuffleArray(originalOptionsObj);
        const correctIdx = shuffledOpts.findIndex(o => o.isCorrect);
        return {
          ...q,
          shuffledOptions: shuffledOpts.map(o => o.text),
          shuffledCorrectIndex: correctIdx
        };
      });

      // 2. Shuffle Part 2: Questions & Sub-items (re-indexing a, b, c, d)
      const shuffledPart2 = shuffleArray(part2Questions).map(q => {
        const shuffledSubs = shuffleArray(q.subItems || []).map((sub, idx) => ({
          ...sub,
          newKey: ['a', 'b', 'c', 'd'][idx]
        }));
        return {
          ...q,
          shuffledSubItems: shuffledSubs
        };
      });

      // 3. Shuffle Part 3: Questions
      const shuffledPart3 = shuffleArray(part3Questions);

      // 4. Part Essay: Tự luận
      const essayList = essayQuestions.map((q, idx) => ({
        ...q,
        essayIndex: idx + 1
      }));

      codes.push({
        code: codeStr,
        part1: shuffledPart1,
        part2: shuffledPart2,
        part3: shuffledPart3,
        essay: essayList
      });
    }

    setMixedExamCodes(codes);
    setSelectedCodeView(codes[0]?.code || String(startNum));
    setActiveTab('preview');
    alert(`🎉 ĐÃ TRÁO THÀNH CÔNG ${numberOfCodes} MÃ ĐỀ THI CHUẨN BGDĐT (${codes.map(c => c.code).join(', ')})!\n\nHệ thống đã tự động tính toán lại đáp án chuẩn xác 100% cho từng mã đề.`);
  };

  // Duplicate Question
  const handleDuplicateQuestion = (q) => {
    const duplicated = {
      ...q,
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${q.title} (Bản sao)`
    };
    setQuestions([...questions, duplicated]);
    alert("✓ Đã nhân bản câu hỏi thành công!");
  };

  // Start Edit Question
  const handleStartEdit = (q) => {
    setEditingQuestion({
      ...q,
      maxScore: q.maxScore || 2.0,
      rubric: q.rubric ? q.rubric.map(r => ({ ...r })) : [
        { criteria: 'Ý 1: Nêu đúng định lý / hiện tượng / dẫn chứng', score: 1.0 },
        { criteria: 'Ý 2: Lập luận logic và kết luận chính xác', score: 1.0 }
      ],
      options: q.options ? [...q.options] : ['', '', '', ''],
      subItems: q.subItems ? q.subItems.map(s => ({ ...s })) : [
        { key: 'a', text: '', isTrue: true },
        { key: 'b', text: '', isTrue: true },
        { key: 'c', text: '', isTrue: false },
        { key: 'd', text: '', isTrue: false }
      ]
    });
    setShowEditModal(true);
  };

  // Save Edit Question
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.content.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi!");
      return;
    }
    setQuestions(questions.map(q => q.id === editingQuestion.id ? editingQuestion : q));
    setShowEditModal(false);
    setEditingQuestion(null);
    alert("✓ Đã cập nhật câu hỏi thành công!");
  };

  // Export Master Key Matrix to Excel (.xlsx) complying with GEMINI.md naming rule
  const handleExportMasterKeysExcel = () => {
    const activeCodes = mixedExamCodes.length > 0 ? mixedExamCodes : [activeCodeObj];
    if (activeCodes.length === 0) {
      alert("Chưa có mã đề thi nào để xuất bảng đáp án!");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // 1. Sheet Part 1: Trắc nghiệm 4 lựa chọn
      const part1Rows = [];
      const maxPart1 = Math.max(...activeCodes.map(c => (c.part1 || []).length), 1);
      for (let i = 0; i < maxPart1; i++) {
        const row = { "Câu hỏi": `Câu ${i + 1}` };
        activeCodes.forEach(codeObj => {
          const q = (codeObj.part1 || [])[i];
          if (q) {
            const correctIndex = q.shuffledCorrectIndex !== undefined ? q.shuffledCorrectIndex : q.correctAnswerIndex;
            row[`Mã ${codeObj.code}`] = ['A', 'B', 'C', 'D'][correctIndex] || '-';
          } else {
            row[`Mã ${codeObj.code}`] = '-';
          }
        });
        part1Rows.push(row);
      }
      const wsPart1 = XLSX.utils.json_to_sheet(part1Rows);
      XLSX.utils.book_append_sheet(wb, wsPart1, "Phần I - 4 Lựa chọn");

      // 2. Sheet Part 2: Đúng / Sai
      const part2Rows = [];
      const maxPart2 = Math.max(...activeCodes.map(c => (c.part2 || []).length), 1);
      for (let i = 0; i < maxPart2; i++) {
        ['a', 'b', 'c', 'd'].forEach((subKey, subIdx) => {
          const row = { "Câu & Lệnh ý": `Câu ${i + 1} - Ý ${subKey})` };
          activeCodes.forEach(codeObj => {
            const q = (codeObj.part2 || [])[i];
            if (q) {
              const subs = q.shuffledSubItems || q.subItems || [];
              const subItem = subs[subIdx];
              row[`Mã ${codeObj.code}`] = subItem ? (subItem.isTrue ? 'Đ' : 'S') : '-';
            } else {
              row[`Mã ${codeObj.code}`] = '-';
            }
          });
          part2Rows.push(row);
        });
      }
      const wsPart2 = XLSX.utils.json_to_sheet(part2Rows);
      XLSX.utils.book_append_sheet(wb, wsPart2, "Phần II - Đúng Sai");

      // 3. Sheet Part 3: Trả lời ngắn
      const part3Rows = [];
      const maxPart3 = Math.max(...activeCodes.map(c => (c.part3 || []).length), 1);
      for (let i = 0; i < maxPart3; i++) {
        const row = { "Câu hỏi": `Câu ${i + 1}` };
        activeCodes.forEach(codeObj => {
          const q = (codeObj.part3 || [])[i];
          row[`Mã ${codeObj.code}`] = q ? (q.shortAnswer || '') : '-';
        });
        part3Rows.push(row);
      }
      const wsPart3 = XLSX.utils.json_to_sheet(part3Rows);
      XLSX.utils.book_append_sheet(wb, wsPart3, "Phần III - Trả lời ngắn");

      // 4. Sheet Part 4: Tự luận (nếu có)
      const firstCodeObj = activeCodes[0] || {};
      const essayList = firstCodeObj.essay || questions.filter(q => q.part === 'essay') || [];
      if (essayList.length > 0) {
        const essayRows = essayList.map((q, i) => ({
          "Câu hỏi": `Câu ${i + 1}`,
          "Nội dung": renderCleanMathText(q.content),
          "Thang điểm tối đa": `${q.maxScore || 2.0} điểm`,
          "Hướng dẫn chấm / Bareme": (q.rubric || []).map(r => `[${r.score}đ] ${r.criteria}`).join('; ') || (q.explanation || '')
        }));
        const wsEssay = XLSX.utils.json_to_sheet(essayRows);
        XLSX.utils.book_append_sheet(wb, wsEssay, "Phần IV - Tự Luận");
      }

      // GEMINI.md naming rule: Prefix sequence number 1-...
      const fileName = `1-Bang_dap_an_tong_hop_tron_de_CBQ_${subject || 'Mon'}_${grade || 'Khoi'}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      alert("Lỗi khi xuất bảng đáp án Excel: " + err.message);
    }
  };

  // Add new question handler
  const handleAddQuestionSubmit = (e) => {
    e.preventDefault();
    if (!newContent.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi!");
      return;
    }

    const newQ = {
      id: `q-${Date.now()}`,
      part: newPart,
      title: newPart === 'part1' ? `Câu ${questions.length + 1} (Phần I - Trắc nghiệm)` : newPart === 'part2' ? `Câu ${questions.length + 1} (Phần II - Đúng/Sai)` : newPart === 'part3' ? `Câu ${questions.length + 1} (Phần III - Trả lời ngắn)` : `Câu ${questions.length + 1} (Phần Tự Luận - ${newMaxScore || 2.0}đ)`,
      level: newLevel,
      content: newContent,
      image_url: newImageUrl || '',
      options: newPart === 'part1' ? newOptions : [],
      correctAnswerIndex: newPart === 'part1' ? newCorrectIdx : 0,
      subItems: newPart === 'part2' ? newSubItems : [],
      shortAnswer: newPart === 'part3' ? newShortAnswer : '',
      maxScore: newPart === 'essay' ? (parseFloat(newMaxScore) || 2.0) : undefined,
      rubric: newPart === 'essay' ? newRubric.filter(r => r.criteria && r.criteria.trim()) : undefined,
      explanation: newExplanation
    };

    setQuestions([...questions, newQ]);
    setShowAddModal(false);
    setNewContent('');
    setNewExplanation('');
    setNewImageUrl('');
    alert("✅ Đã thêm câu hỏi thành công vào ngân hàng đề!");
  };

  // Delete Question
  const handleDeleteQuestion = (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa câu hỏi này khỏi đề thi?")) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Xuất Khung Ma Trận & Bản Đặc Tả Đề Thi ra file Word (.doc) theo chuẩn Công văn 3175/BGDĐT & Nghị định 30
  const handleExportWordMatrix = () => {
    const dateObj = new Date();
    const dayStr = String(dateObj.getDate()).padStart(2, '0');
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yearStr = dateObj.getFullYear();

    const matrixCfg = getMatrixConfigForSubject(subject);
    const p1Point = matrixCfg?.part1?.pointPerQ || 0.25;
    const p2Point = matrixCfg?.part2?.pointPerQ || 1.0;
    const p3Point = matrixCfg?.part3?.pointPerQ || 0.5;

    const part1List = questions.filter(q => q.part === 'part1');
    const part2List = questions.filter(q => q.part === 'part2');
    const part3List = questions.filter(q => q.part === 'part3');
    const essayList = questions.filter(q => q.part === 'essay');

    const nbList = questions.filter(q => q.level === 'Nhận biết');
    const thList = questions.filter(q => q.level === 'Thông hiểu');
    const vdList = questions.filter(q => q.level === 'Vận dụng');
    const vdcList = questions.filter(q => q.level === 'Vận dụng cao');

    const calcPoints = (list) => {
      const p1 = list.filter(q => q.part === 'part1').length * p1Point;
      const p2 = list.filter(q => q.part === 'part2').length * p2Point;
      const p3 = list.filter(q => q.part === 'part3').length * p3Point;
      const pe = list.filter(q => q.part === 'essay').reduce((sum, q) => sum + (parseFloat(q.maxScore) || 2.0), 0);
      return (p1 + p2 + p3 + pe).toFixed(2);
    };

    const totalCalculatedPoints = (
      part1List.length * p1Point +
      part2List.length * p2Point +
      part3List.length * p3Point +
      essayList.reduce((sum, q) => sum + (parseFloat(q.maxScore) || 2.0), 0)
    ).toFixed(2);

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Khung Ma trận & Bản đặc tả - ${examTitle}</title>
        <style>
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 1.5cm 2.0cm 2.5cm; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.3; color: #000; }
          .header-table { width: 100%; border: none; margin-bottom: 15px; }
          .header-table td { border: none; text-align: center; vertical-align: top; }
          .title { font-size: 13pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 15px 0 5px 0; }
          .subtitle { font-size: 12pt; font-weight: bold; text-align: center; margin-bottom: 15px; }
          table.data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          table.data-table th, table.data-table td { border: 1pt solid #000; padding: 5pt; font-size: 11pt; }
          table.data-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
          .signature-table { width: 100%; border: none; margin-top: 30px; }
          .signature-table td { border: none; text-align: center; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table class="header-table">
            <tr>
              <td style="width: 45%;">
                <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</strong><br/>
                <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
                TỔ CHUYÊN MÔN: ${(teacher?.department || subject).toUpperCase()}
              </td>
              <td style="width: 55%;">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
                <em>Đắk Lắk, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</em>
              </td>
            </tr>
          </table>

          <div class="title">KHUNG MA TRẬN & BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ</div>
          <div class="subtitle">MÔN: ${subject.toUpperCase()} - KHỐI ${grade.toUpperCase()} • NĂM HỌC ${schoolYear}</div>

          <p><strong>I. KHUNG MA TRẬN ĐỀ KIỂM TRA THEO CÔNG VĂN 3175/BGDĐT (GDPT 2018)</strong></p>
          <table class="data-table">
            <thead>
              <tr>
                <th rowspan="2">Mức độ nhận thức</th>
                <th colspan="${essayList.length > 0 ? 4 : 3}">Hình thức câu hỏi</th>
                <th rowspan="2">Tổng số câu</th>
                <th rowspan="2">Tổng điểm</th>
                <th rowspan="2">Tỷ lệ %</th>
              </tr>
              <tr>
                <th>${matrixCfg?.part1?.name || 'Phần I (4 lựa chọn)'}</th>
                <th>${matrixCfg?.part2?.name || 'Phần II (Đúng/Sai)'}</th>
                <th>${matrixCfg?.part3?.name || 'Phần III (Trả lời ngắn)'}</th>
                ${essayList.length > 0 ? `<th>Phần Tự Luận</th>` : ''}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Nhận biết</strong></td>
                <td style="text-align: center;">${nbList.filter(q => q.part === 'part1').length} câu</td>
                <td style="text-align: center;">${nbList.filter(q => q.part === 'part2').length} câu</td>
                <td style="text-align: center;">${nbList.filter(q => q.part === 'part3').length} câu</td>
                ${essayList.length > 0 ? `<td style="text-align: center;">${nbList.filter(q => q.part === 'essay').length} câu</td>` : ''}
                <td style="text-align: center; font-weight: bold;">${nbList.length} câu</td>
                <td style="text-align: center; font-weight: bold;">${calcPoints(nbList)} đ</td>
                <td style="text-align: center; font-weight: bold;">${Math.round((nbList.length / (questions.length || 1)) * 100)}%</td>
              </tr>
              <tr>
                <td><strong>2. Thông hiểu</strong></td>
                <td style="text-align: center;">${thList.filter(q => q.part === 'part1').length} câu</td>
                <td style="text-align: center;">${thList.filter(q => q.part === 'part2').length} câu</td>
                <td style="text-align: center;">${thList.filter(q => q.part === 'part3').length} câu</td>
                ${essayList.length > 0 ? `<td style="text-align: center;">${thList.filter(q => q.part === 'essay').length} câu</td>` : ''}
                <td style="text-align: center; font-weight: bold;">${thList.length} câu</td>
                <td style="text-align: center; font-weight: bold;">${calcPoints(thList)} đ</td>
                <td style="text-align: center; font-weight: bold;">${Math.round((thList.length / (questions.length || 1)) * 100)}%</td>
              </tr>
              <tr>
                <td><strong>3. Vận dụng</strong></td>
                <td style="text-align: center;">${vdList.filter(q => q.part === 'part1').length} câu</td>
                <td style="text-align: center;">${vdList.filter(q => q.part === 'part2').length} câu</td>
                <td style="text-align: center;">${vdList.filter(q => q.part === 'part3').length} câu</td>
                ${essayList.length > 0 ? `<td style="text-align: center;">${vdList.filter(q => q.part === 'essay').length} câu</td>` : ''}
                <td style="text-align: center; font-weight: bold;">${vdList.length} câu</td>
                <td style="text-align: center; font-weight: bold;">${calcPoints(vdList)} đ</td>
                <td style="text-align: center; font-weight: bold;">${Math.round((vdList.length / (questions.length || 1)) * 100)}%</td>
              </tr>
              <tr>
                <td><strong>4. Vận dụng cao</strong></td>
                <td style="text-align: center;">${vdcList.filter(q => q.part === 'part1').length} câu</td>
                <td style="text-align: center;">${vdcList.filter(q => q.part === 'part2').length} câu</td>
                <td style="text-align: center;">${vdcList.filter(q => q.part === 'part3').length} câu</td>
                ${essayList.length > 0 ? `<td style="text-align: center;">${vdcList.filter(q => q.part === 'essay').length} câu</td>` : ''}
                <td style="text-align: center; font-weight: bold;">${vdcList.length} câu</td>
                <td style="text-align: center; font-weight: bold;">${calcPoints(vdcList)} đ</td>
                <td style="text-align: center; font-weight: bold;">${Math.round((vdcList.length / (questions.length || 1)) * 100)}%</td>
              </tr>
              <tr style="background-color: #f2f2f2; font-weight: bold;">
                <td style="text-align: center;">TỔNG CỘNG</td>
                <td style="text-align: center;">${part1List.length} câu (${(part1List.length * p1Point).toFixed(2)}đ)</td>
                <td style="text-align: center;">${part2List.length} câu (${(part2List.length * p2Point).toFixed(2)}đ)</td>
                <td style="text-align: center;">${part3List.length} câu (${(part3List.length * p3Point).toFixed(2)}đ)</td>
                ${essayList.length > 0 ? `<td style="text-align: center;">${essayList.length} câu (${essayList.reduce((sum, q) => sum + (parseFloat(q.maxScore) || 2.0), 0).toFixed(1)}đ)</td>` : ''}
                <td style="text-align: center;">${questions.length} câu</td>
                <td style="text-align: center; color: red;">${totalCalculatedPoints} điểm</td>
                <td style="text-align: center;">100%</td>
              </tr>
            </tbody>
          </table>

          <p style="margin-top: 20px;"><strong>II. BẢN ĐẶC TẢ CHI TIẾT ĐỀ KIỂM TRA ĐỊNH KỲ</strong></p>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 8%;">TT</th>
                <th style="width: 18%;">Hình thức</th>
                <th style="width: 15%;">Mức độ</th>
                <th style="width: 44%;">Yêu cầu cần đạt / Nội dung kiến thức đánh giá</th>
                <th style="width: 15%;">Điểm số</th>
              </tr>
            </thead>
            <tbody>
              ${questions.map((q, idx) => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">Câu ${idx + 1}</td>
                  <td style="text-align: center;">${q.part === 'part1' ? (matrixCfg?.part1?.name || 'Phần I') : q.part === 'part2' ? (matrixCfg?.part2?.name || 'Phần II') : q.part === 'part3' ? (matrixCfg?.part3?.name || 'Phần III') : 'Phần Tự Luận'}</td>
                  <td style="text-align: center; font-weight: bold;">${q.level}</td>
                  <td>${renderCleanMathText(q.content).slice(0, 140)}...</td>
                  <td style="text-align: center; font-weight: bold;">${q.part === 'part1' ? `${p1Point}đ` : q.part === 'part2' ? `${p2Point}đ` : q.part === 'part3' ? `${p3Point}đ` : `${q.maxScore || 2.0}đ`}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <table class="signature-table">
            <tr>
              <td style="width: 33%;">
                <strong>NGƯỜI RA ĐỀ</strong><br/>
                <em>(Ký, ghi rõ họ tên)</em><br/><br/><br/><br/>
                <strong>${teacher?.full_name || teacher?.name || 'Giáo viên bộ môn'}</strong>
              </td>
              <td style="width: 33%;">
                <strong>TỔ TRƯỞNG CHUYÊN MÔN</strong><br/>
                <em>(Ký, ghi rõ họ tên)</em><br/><br/><br/><br/>
              </td>
              <td style="width: 34%;">
                <strong>HIỆU TRƯỞNG DUYỆT</strong><br/>
                <em>(Ký, ghi rõ họ tên và đóng dấu)</em><br/><br/><br/><br/>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1-Ma_tran_dac_ta_de_thi_${subject.replace(/[^a-zA-Z0-9]/g, '_')}_Khoi_${grade}_${yearStr}${monthStr}${dayStr}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export File Word (.doc) with Exam Paper & Key Matrix
  const handleExportWordExam = () => {
    const activeCodeObj = mixedExamCodes.find(c => c.code === selectedCodeView) || {
      code: '101',
      part1: questions.filter(q => q.part === 'part1').map(q => ({ ...q, shuffledOptions: q.options, shuffledCorrectIndex: q.correctAnswerIndex })),
      part2: questions.filter(q => q.part === 'part2').map(q => ({ ...q, shuffledSubItems: q.subItems.map((s, i) => ({ ...s, newKey: ['a','b','c','d'][i] })) })),
      part3: questions.filter(q => q.part === 'part3'),
      essay: questions.filter(q => q.part === 'essay')
    };

    const examElement = document.getElementById('exam-paper-preview-content');
    if (!examElement) return;

    // Generate Key Table HTML for Teacher
    let keyMatrixHTML = `
      <h2 style="text-align: center; text-transform: uppercase; margin-top: 30px;">BẢNG ĐÁP ÁN & ĐÁP SỐ MÃ ĐỀ ${activeCodeObj.code}</h2>
      <h3>PHẦN I. TRẮC NGHIỆM 4 LỰA CHỌN (0.25đ / câu)</h3>
      <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 15px;">
        <tr style="background-color: #f1f5f9;">
          ${activeCodeObj.part1.map((_, i) => `<th style="border: 1pt solid black; padding: 4pt;">Câu ${i + 1}</th>`).join('')}
        </tr>
        <tr>
          ${activeCodeObj.part1.map(q => `<td style="border: 1pt solid black; padding: 4pt; font-weight: bold;">${['A', 'B', 'C', 'D'][q.shuffledCorrectIndex ?? q.correctAnswerIndex]}</td>`).join('')}
        </tr>
      </table>

      <h3>PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr style="background-color: #f1f5f9;">
          <th style="border: 1pt solid black; padding: 4pt;">Câu</th>
          <th style="border: 1pt solid black; padding: 4pt;">Ý a)</th>
          <th style="border: 1pt solid black; padding: 4pt;">Ý b)</th>
          <th style="border: 1pt solid black; padding: 4pt;">Ý c)</th>
          <th style="border: 1pt solid black; padding: 4pt;">Ý d)</th>
        </tr>
        ${activeCodeObj.part2.map((q, i) => `
          <tr>
            <td style="border: 1pt solid black; padding: 4pt; text-align: center; font-weight: bold;">Câu ${i + 1}</td>
            ${(q.shuffledSubItems || q.subItems).map(sub => `
              <td style="border: 1pt solid black; padding: 4pt; text-align: center; color: ${sub.isTrue ? 'green' : 'red'}; font-weight: bold;">
                ${sub.isTrue ? 'ĐÚNG' : 'SAI'}
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </table>

      <h3>PHẦN III. TRẢ LỜI NGẮN</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f1f5f9;">
          ${activeCodeObj.part3.map((_, i) => `<th style="border: 1pt solid black; padding: 4pt;">Câu ${i + 1}</th>`).join('')}
        </tr>
        <tr>
          ${activeCodeObj.part3.map(q => `<td style="border: 1pt solid black; padding: 4pt; text-align: center; font-weight: bold; color: blue;">${q.shortAnswer}</td>`).join('')}
        </tr>
      </table>

      ${activeCodeObj.essay && activeCodeObj.essay.length > 0 ? `
        <h3>PHẦN IV. HƯỚNG DẪN CHẤM & BIỂU ĐIỂM TỰ LUẬN</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1pt solid black; padding: 5pt; width: 12%;">Câu</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 68%;">Nội dung yêu cầu / Tiêu chí bareme</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 20%; text-align: center;">Điểm tối đa</th>
          </tr>
          ${activeCodeObj.essay.map((q, i) => `
            <tr>
              <td style="border: 1pt solid black; padding: 5pt; font-weight: bold; text-align: center; vertical-align: top;">Câu ${i + 1}</td>
              <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;">
                <div><strong>Nội dung:</strong> ${renderCleanMathText(q.content)}</div>
                ${q.rubric && q.rubric.length > 0 ? `
                  <div style="margin-top: 6pt;"><strong>Biểu điểm chi tiết:</strong></div>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 4pt;">
                    ${q.rubric.map(r => `
                      <tr>
                        <td style="border: 0.5pt solid #999; padding: 3pt;">${renderCleanMathText(r.criteria)}</td>
                        <td style="border: 0.5pt solid #999; padding: 3pt; text-align: center; width: 50pt; font-weight: bold;">${r.score}đ</td>
                      </tr>
                    `).join('')}
                  </table>
                ` : ''}
                ${q.explanation ? `<div style="margin-top: 6pt; font-style: italic;"><strong>Lời giải gợi ý:</strong> ${renderCleanMathText(q.explanation)}</div>` : ''}
              </td>
              <td style="border: 1pt solid black; padding: 5pt; text-align: center; font-weight: bold; vertical-align: top; color: #7c3aed;">
                ${q.maxScore || 2.0} điểm
              </td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
    `;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${examTitle} - Mã đề ${selectedCodeView}</title>
        <style>
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 2.0cm 2.0cm 2.0cm; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; mso-paper-source: 0; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; color: #000000; }
          h1, h2, h3 { font-family: 'Times New Roman', serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 10px; }
          th, td { border: 1pt solid black; padding: 4pt; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${examElement.innerHTML}
          <br style="page-break-before:always" />
          ${keyMatrixHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1-De_Thi_${subject}_MaDe_${selectedCodeView}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeCodeObj = mixedExamCodes.find(c => c.code === selectedCodeView) || {
    code: '101',
    part1: questions.filter(q => q.part === 'part1').map(q => ({ ...q, shuffledOptions: q.options, shuffledCorrectIndex: q.correctAnswerIndex })),
    part2: questions.filter(q => q.part === 'part2').map(q => ({ ...q, shuffledSubItems: q.subItems.map((s, i) => ({ ...s, newKey: ['a','b','c','d'][i] })) })),
    part3: questions.filter(q => q.part === 'part3'),
    essay: questions.filter(q => q.part === 'essay')
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1240px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={20} /> Bảng điều khiển Giáo viên
        </Link>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <AiStatusBadge onOpenSettings={() => setShowAiSettings(true)} />

          <button onClick={() => navigate('/giao-vien/cham-thi-2027')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(124,58,237,0.35)' }} title="Chấm bài thi trắc nghiệm bằng Camera điện thoại chuẩn 2027 (GDPT 2018)">
            <Camera size={17} /> Chấm Thi 2027 (Camera)
          </button>

          <button onClick={() => setShowOmrModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(124,58,237,0.3)' }} title="Xem và in Phiếu trả lời trắc nghiệm chuẩn Bộ GD&ĐT khổ A4">
            <Printer size={17} /> Phiếu Tô OMR (A4)
          </button>

          <button onClick={handleExportWordMatrix} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(8,145,178,0.3)' }} title="Xuất Khung Ma trận và Bản đặc tả đề thi theo Công văn 3175/BGDĐT">
            <Layers size={17} /> Ma Trận Word
          </button>

          <button onClick={handleGenerateMixedExams} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(217,119,6,0.3)' }}>
            <Shuffle size={17} /> Đảo Mã Đề ({numberOfCodes} Mã)
          </button>

          <button onClick={handlePublishOnline} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(22,163,74,0.3)' }}>
            <Send size={18} /> {examPublished ? '✓ Đã Xuất Bản Online' : '🚀 Xuất Bản Thi Trực Tuyến'}
          </button>

          <button onClick={handleExportWordExam} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(2,132,199,0.3)' }}>
            <Download size={18} /> Xuất Đề File Word (.doc)
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.3)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award color="#f59e0b" size={28} /> Hệ Thống Ra Đề Thi, Kiểm Tra Thông Minh & Ghi Điểm Excel GDPT 2018
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Hỗ trợ chuẩn 3 Phần BGDĐT: Trắc nghiệm 4 phương án, Đúng/Sai 4 ý lũy tiến & Trả lời ngắn. Chấm tự động 100% và ghi điểm trực tiếp vào file Excel sổ điểm cá nhân.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('questions')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'questions' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'questions' ? '#0284c7' : '#64748b' }}>
          <FileText size={18} /> Ngân Hàng Câu Hỏi ({questions.length})
        </button>
        <button onClick={() => setActiveTab('matrix')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'matrix' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'matrix' ? '#0284c7' : '#64748b' }}>
          <Layers size={18} /> Ma Trận & Bảng Đặc Tả (CV 3175)
        </button>
        <button onClick={() => setActiveTab('preview')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'preview' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'preview' ? '#0284c7' : '#64748b' }}>
          <Printer size={18} /> Xem Trước Đề Thi Đã Đảo (Mã đề: {selectedCodeView})
        </button>
        <button onClick={() => setActiveTab('keys')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'keys' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'keys' ? '#0284c7' : '#64748b' }}>
          <CheckSquare size={18} /> Bảng Đáp Án Ma Trận
        </button>
        <button onClick={() => { setActiveTab('submissions'); loadSubmissions(); }} style={{ ...styles.tabBtn, borderBottom: activeTab === 'submissions' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'submissions' ? '#10b981' : '#64748b' }}>
          <FileSpreadsheet size={18} /> 📊 Kết Quả Thi & Ghi Điểm Excel ({submissions.length})
        </button>
      </div>

      {/* TAB 1: QUESTIONS BANK */}
      {activeTab === 'questions' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          
          {/* Exam Header Setting Form */}
          {(() => {
            const matrixCfg = getMatrixConfigForSubject(subject);
            return (
              <div style={{ marginBottom: '22px', background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Dòng 1: Tiêu đề đề thi */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ ...styles.label, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tên Kỳ Thi / Tiêu Đề Đề Thi In Ra (*)</span>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'normal' }}>Năm học: {schoolYear}</span>
                  </label>
                  <input 
                    type="text" 
                    value={examTitle} 
                    onChange={e => setExamTitle(e.target.value)} 
                    style={{ ...styles.input, fontWeight: '700', fontSize: '14.5px', color: '#0f172a' }} 
                  />
                </div>

                {/* Dòng 2: Cài đặt thông số đề thi */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={styles.label}>Môn Học (*):</label>
                    <select
                      value={subject}
                      onChange={e => handleSubjectChange(e.target.value)}
                      style={{ ...styles.input, fontWeight: '700', color: '#0284c7', backgroundColor: '#ffffff', cursor: 'pointer' }}
                    >
                      {SUBJECT_OPTIONS.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.icon} {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Khối Lớp:</label>
                    <select
                      value={grade}
                      onChange={e => handleGradeChange(e.target.value)}
                      style={{ ...styles.input, fontWeight: '600', backgroundColor: '#ffffff', cursor: 'pointer' }}
                    >
                      {GRADE_OPTIONS.map(g => (
                        <option key={g} value={g}>{g} (GDPT 2018)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Loại Bài Kiểm Tra:</label>
                    <select
                      value={examType}
                      onChange={e => handleExamTypeChange(e.target.value)}
                      style={{ ...styles.input, fontWeight: '600', backgroundColor: '#ffffff', cursor: 'pointer' }}
                    >
                      {EXAM_TYPE_OPTIONS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Thời Gian Làm Bài:</label>
                    <input 
                      type="text" 
                      value={duration} 
                      onChange={e => setDuration(e.target.value)} 
                      style={{ ...styles.input, fontWeight: '600', backgroundColor: '#ffffff' }} 
                      placeholder="VD: 50 phút, 90 phút..."
                    />
                  </div>
                </div>

                {/* Dòng 3: Thông tin chuẩn định dạng môn & Nút nạp đề mẫu 1-Click */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                      Định dạng chuẩn GDPT 2018:
                    </span>
                    <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontWeight: '700' }}>
                      {matrixCfg?.part1?.name || 'Phần I'}
                    </span>
                    {matrixCfg?.part2?.count > 0 && (
                      <span style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '12px', fontWeight: '700' }}>
                        {matrixCfg.part2.name}
                      </span>
                    )}
                    {matrixCfg?.part3?.count > 0 && (
                      <span style={{ fontSize: '12px', background: '#f3e8ff', color: '#6b21a8', padding: '3px 10px', borderRadius: '12px', fontWeight: '700' }}>
                        {matrixCfg.part3.name}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowBankPickerModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                      }}
                      title="Mở phân hệ Ngân hàng câu hỏi cây thư mục của tổ: Bốc đề theo ma trận hoặc chọn từng câu"
                    >
                      <FolderTree size={14} /> 🌳 Ra Đề Từ Ngân Hàng Tổ (Ma Trận / Chọn Câu)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadSampleForSubject(subject)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)'
                      }}
                      title="Nạp bộ câu hỏi mẫu chuẩn GDPT 2018 của Bộ GD&ĐT cho môn học này"
                    >
                      <Sparkles size={14} /> Nạp Đề Mẫu Chuẩn Bộ GD&ĐT (Môn {subject})
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Question Bank Controls & Shuffler Config */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="#0284c7" /> Ngân Hàng Câu Hỏi ({questions.length} câu)
              </h3>
              <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                ✓ Đã kích hoạt KaTeX LaTeX Pro
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/giao-vien/ngan-hang-cau-hoi"
                style={{
                  padding: '8px 14px',
                  background: '#f8fafc',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}
                title="Mở không gian quản lý Ngân hàng câu hỏi theo cây thư mục Chương - Bài của Tổ Chuyên Môn"
              >
                <FolderTree size={15} color="#0284c7" /> Quản Lý Cây Ngân Hàng Tổ
              </Link>

              <button
                type="button"
                onClick={() => setShowBankPickerModal(true)}
                style={{
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  boxShadow: '0 2px 6px rgba(2,132,199,0.25)'
                }}
              >
                <FolderTree size={16} /> Bốc Đề Từ Ma Trận / Chọn Câu
              </button>

              <button
                type="button"
                onClick={() => setShowAiGenModal(true)}
                style={{
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
                }}
              >
                <Sparkles size={16} /> ✨ Soạn Đề Bằng AI
              </button>

              <button onClick={() => setShowImportModal(true)} style={{ padding: '8px 14px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Download size={16} /> Nạp Đề Word / Text
              </button>

              <button onClick={() => setShowAddModal(true)} style={{ padding: '8px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Plus size={16} /> Thêm Câu Hỏi Mới
              </button>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Số mã đề:</span>
                <select value={numberOfCodes} onChange={e => setNumberOfCodes(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '12.5px' }}>
                  <option value={2}>2 Mã (101, 102)</option>
                  <option value={4}>4 Mã (101 - 104)</option>
                  <option value={8}>8 Mã (101 - 108)</option>
                  <option value={12}>12 Mã (101 - 112)</option>
                  <option value={24}>24 Mã (101 - 124)</option>
                </select>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', marginLeft: '4px' }}>Mã gốc:</span>
                <input 
                  type="number" 
                  value={baseCodeNum} 
                  onChange={e => setBaseCodeNum(parseInt(e.target.value, 10) || 101)} 
                  style={{ width: '60px', padding: '3px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }} 
                  title="Số bắt đầu của mã đề (VD: 101, 201, 301...)"
                />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Tìm kiếm nội dung câu hỏi, công thức hoặc từ khóa..." 
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Phần:</span>
              <select value={filterPart} onChange={e => setFilterPart(e.target.value)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}>
                <option value="all">Tất cả phần</option>
                <option value="part1">Phần I: 4 Lựa chọn</option>
                <option value="part2">Phần II: Đúng / Sai</option>
                <option value="part3">Phần III: Trả lời ngắn</option>
                <option value="essay">Phần Tự Luận</option>
              </select>

              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Mức độ:</span>
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}>
                <option value="all">Tất cả mức độ</option>
                <option value="Nhận biết">Nhận biết</option>
                <option value="Thông hiểu">Thông hiểu</option>
                <option value="Vận dụng">Vận dụng</option>
                <option value="Vận dụng cao">Vận dụng cao</option>
              </select>
            </div>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions
              .filter(q => {
                if (filterPart !== 'all' && q.part !== filterPart) return false;
                if (filterLevel !== 'all' && q.level !== filterLevel) return false;
                if (searchQuery.trim()) {
                  const query = searchQuery.toLowerCase();
                  const matchContent = (q.content || '').toLowerCase().includes(query);
                  const matchTitle = (q.title || '').toLowerCase().includes(query);
                  const matchOpt = (q.options || []).some(o => (o || '').toLowerCase().includes(query));
                  if (!matchContent && !matchTitle && !matchOpt) return false;
                }
                return true;
              })
              .map((q, idx) => (
              <div key={q.id} style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '14.5px' }}>
                    {q.title} 
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', marginLeft: '8px' }}>
                      {q.level}
                    </span>
                    {q.part === 'essay' && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', marginLeft: '6px', fontWeight: 'bold' }}>
                        Tự Luận ({q.maxScore || 2.0}đ)
                      </span>
                    )}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleStartEdit(q)} 
                      style={{ color: '#0284c7', border: '1px solid #bae6fd', background: '#f0f9ff', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }} 
                      title="Chỉnh sửa câu hỏi & công thức LaTeX"
                    >
                      <Edit3 size={14} /> Sửa
                    </button>
                    <button 
                      onClick={() => handleDuplicateQuestion(q)} 
                      style={{ color: '#059669', border: '1px solid #a7f3d0', background: '#ecfdf5', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }} 
                      title="Nhân bản câu hỏi này"
                    >
                      <Copy size={14} /> Nhân bản
                    </button>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)} 
                      style={{ color: '#ef4444', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }} 
                      title="Xóa câu hỏi khỏi đề thi"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </div>

                {/* Content rendered with crisp KaTeX LaTeX */}
                <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: '600', marginBottom: '10px', lineHeight: 1.6 }}>
                  <MathView text={q.content} />
                </div>

                {/* Question Image / Diagram for Math, Physics, Chemistry, Biology */}
                {q.image_url ? (
                  <div style={{ margin: '10px 0 14px 0', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', position: 'relative', background: '#fff', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                      <img src={q.image_url} alt="Hình vẽ / Đồ thị câu hỏi" style={{ maxWidth: '340px', maxHeight: '200px', objectFit: 'contain', display: 'block', borderRadius: '6px' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                        <span>🖼️ Hình vẽ / Đồ thị minh họa</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (window.confirm("Gỡ hình vẽ này khỏi câu hỏi?")) {
                              setQuestions(questions.map(item => item.id === q.id ? { ...item, image_url: '' } : item));
                            }
                          }}
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ✕ Gỡ ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Nhập đường dẫn URL ảnh hoặc dán Data URI ảnh đồ thị / hình vẽ:", "");
                        if (url && url.trim()) {
                          setQuestions(questions.map(item => item.id === q.id ? { ...item, image_url: url.trim() } : item));
                        }
                      }}
                      style={{ fontSize: '12px', color: '#0284c7', background: '#f0f9ff', border: '1px dashed #7dd3fc', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Image size={13} /> + Đính kèm ảnh đồ thị / hình học cho câu này
                    </button>
                  </div>
                )}

                {/* Part 1 options with KaTeX */}
                {q.part === 'part1' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                    {(q.options || []).map((opt, i) => (
                      <div key={i} style={{ fontSize: '13.5px', color: i === q.correctAnswerIndex ? '#16a34a' : '#334155', fontWeight: i === q.correctAnswerIndex ? 'bold' : 'normal', background: i === q.correctAnswerIndex ? '#f0fdf4' : '#fff', padding: '6px 12px', borderRadius: '6px', border: i === q.correctAnswerIndex ? '1px solid #86efac' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 'bold' }}>{['A.', 'B.', 'C.', 'D.'][i]}</span>
                        <MathView inline text={opt} />
                        {i === q.correctAnswerIndex && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>✅ Đáp án đúng</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Part 2 True/False with KaTeX */}
                {q.part === 'part2' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {(q.subItems || []).map(sub => (
                      <div key={sub.key} style={{ fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                          <strong>{sub.key})</strong> 
                          <MathView inline text={sub.text} />
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: sub.isTrue ? '#dcfce7' : '#fee2e2', color: sub.isTrue ? '#15803d' : '#b91c1c' }}>
                          [{sub.isTrue ? 'ĐÚNG' : 'SAI'}]
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Part 3 Short answer with KaTeX */}
                {q.part === 'part3' && (
                  <div style={{ fontSize: '13.5px', color: '#0284c7', fontWeight: 'bold', marginBottom: '10px', background: '#e0f2fe', padding: '8px 12px', borderRadius: '6px', display: 'inline-block' }}>
                    👉 Đáp số ghi phiếu: <span style={{ color: '#16a34a', fontSize: '15px' }}><MathView inline text={q.shortAnswer} /></span>
                  </div>
                )}

                {/* Part Essay with Rubric */}
                {q.part === 'essay' && (
                  <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: '8px', padding: '12px 14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: '#86198f', fontSize: '13.5px' }}>📋 Hướng dẫn chấm & Thang điểm (Tối đa: {q.maxScore || 2.0} điểm):</strong>
                    </div>
                    {q.rubric && q.rubric.length > 0 ? (
                      <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', marginTop: '6px', background: '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ background: '#fae8ff', color: '#701a75' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #f0abfc' }}>Tiêu chí đánh giá / Nội dung yêu cầu</th>
                            <th style={{ padding: '6px 10px', width: '90px', textAlign: 'center', border: '1px solid #f0abfc' }}>Điểm số</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.rubric.map((r, rIdx) => (
                            <tr key={rIdx}>
                              <td style={{ padding: '6px 10px', border: '1px solid #f0abfc', color: '#334155' }}><MathView inline text={r.criteria} /></td>
                              <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', color: '#86198f', border: '1px solid #f0abfc' }}>{r.score}đ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#701a75', fontStyle: 'italic' }}>Chưa thiết lập bareme chi tiết. Điểm tối đa: {q.maxScore || 2.0}đ</div>
                    )}
                  </div>
                )}

                {q.explanation && (
                  <div style={{ fontSize: '12.5px', color: '#475569', fontStyle: 'italic', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', marginTop: '6px' }}>
                    💡 <strong>Lời giải chi tiết:</strong> <MathView text={q.explanation} />
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: EXAM MATRIX (CV 3175) */}
      {activeTab === 'matrix' && (() => {
        const matrixCfg = getMatrixConfigForSubject(subject);
        const p1Count = questions.filter(q => q.part === 'part1').length;
        const p2Count = questions.filter(q => q.part === 'part2').length;
        const p3Count = questions.filter(q => q.part === 'part3').length;
        const essayCount = questions.filter(q => q.part === 'essay').length;
        const essayPoints = questions.filter(q => q.part === 'essay').reduce((sum, q) => sum + (parseFloat(q.maxScore) || 2.0), 0);

        const currentPoints = (
          p1Count * matrixCfg.part1.pointPerQ +
          p2Count * matrixCfg.part2.pointPerQ +
          p3Count * matrixCfg.part3.pointPerQ +
          essayPoints
        ).toFixed(1);

        const subInfo = SUBJECT_OPTIONS.find(s => s.id === subject);

        return (
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                  📊 Khung Ma Trận & Bản Đặc Tả Đề Thi GDPT 2018 (Công Văn 3175/BGDĐT)
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Môn: <strong>{subInfo?.icon} {subject}</strong> • Khối: <strong>{grade}</strong> • Thời gian: <strong>{duration}</strong> • Cấu trúc chuẩn Bộ GD&ĐT
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setShowOmrModal(true)}
                  style={{
                    padding: '9px 16px',
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    boxShadow: '0 2px 4px rgba(124,58,237,0.3)'
                  }}
                >
                  <Printer size={16} /> In Phiếu Tô OMR A4
                </button>

                <button
                  onClick={handleExportWordMatrix}
                  style={{
                    padding: '9px 18px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <Download size={16} /> Xuất File Word Ma Trận & Bản Đặc Tả (.doc)
                </button>
              </div>
            </div>

            {/* REAL-TIME MATRIX PROGRESS TRACKER THÍCH ỨNG THEO TỪNG MÔN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold' }}>
                  {subject === 'Ngữ văn' ? 'PHẦN I: ĐỌC HIỂU VĂN BẢN' : 'PHẦN I: 4 LỰA CHỌN'}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>
                  {p1Count} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>/ {matrixCfg.part1.count} câu chuẩn ({matrixCfg.part1.total.toFixed(1)}đ)</span>
                </div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (p1Count / (matrixCfg.part1.count || 1)) * 100)}%`, height: '100%', background: '#0284c7' }} />
                </div>
              </div>

              {matrixCfg.part2.count > 0 && (
                <div style={{ padding: '14px', borderRadius: '12px', background: '#fef3c7', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 'bold' }}>PHẦN II: ĐÚNG / SAI (4 Ý)</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#d97706', marginTop: '4px' }}>
                    {p2Count} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>/ {matrixCfg.part2.count} câu chuẩn ({matrixCfg.part2.total.toFixed(1)}đ)</span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (p2Count / (matrixCfg.part2.count || 1)) * 100)}%`, height: '100%', background: '#d97706' }} />
                  </div>
                </div>
              )}

              {matrixCfg.part3.count > 0 && (
                <div style={{ padding: '14px', borderRadius: '12px', background: '#f3e8ff', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '12px', color: '#6b21a8', fontWeight: 'bold' }}>
                    {subject === 'Ngữ văn' ? 'PHẦN II: VIẾT NGHỊ LUẬN' : 'PHẦN III: TRẢ LỜI NGẮN'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#9333ea', marginTop: '4px' }}>
                    {p3Count} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>/ {matrixCfg.part3.count} câu chuẩn ({matrixCfg.part3.total.toFixed(1)}đ)</span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (p3Count / (matrixCfg.part3.count || 1)) * 100)}%`, height: '100%', background: '#9333ea' }} />
                  </div>
                </div>
              )}

              {essayCount > 0 && (
                <div style={{ padding: '14px', borderRadius: '12px', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 'bold' }}>PHẦN TỰ LUẬN</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#6d28d9', marginTop: '4px' }}>
                    {essayCount} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>câu ({essayPoints.toFixed(1)}đ)</span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#7c3aed' }} />
                  </div>
                </div>
              )}

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>TỔNG ĐIỂM CHUẨN ĐỀ THI</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>
                  {currentPoints} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>/ 10.0 điểm</span>
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '8px', fontWeight: 'bold' }}>
                  ✓ Chuẩn Ma trận GDPT 2018 ({subject})
                </div>
              </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Mức Độ Tư Duy</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>
                    {subject === 'Ngữ văn' ? 'Phần I: Đọc hiểu' : `Phần I (${matrixCfg.part1.pointPerQ}đ/câu)`}
                  </th>
                  {matrixCfg.part2.count > 0 && (
                    <th style={{ padding: '12px', textAlign: 'center' }}>
                      Phần II ({matrixCfg.part2.pointPerQ}đ/câu)
                    </th>
                  )}
                  {matrixCfg.part3.count > 0 && (
                    <th style={{ padding: '12px', textAlign: 'center' }}>
                      {subject === 'Ngữ văn' ? 'Phần II: Viết nghị luận' : `Phần III (${matrixCfg.part3.pointPerQ}đ/câu)`}
                    </th>
                  )}
                  <th style={{ padding: '12px', textAlign: 'center' }}>Tổng Điểm Chuẩn</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>
                    1. Nhận biết ({matrixCfg.cognitiveRatios?.nb || 40}%)
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {Math.round(matrixCfg.part1.count * 0.35)} câu ({((Math.round(matrixCfg.part1.count * 0.35)) * matrixCfg.part1.pointPerQ).toFixed(2)}đ)
                  </td>
                  {matrixCfg.part2.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      1 câu (1.00đ)
                    </td>
                  )}
                  {matrixCfg.part3.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {Math.max(1, Math.round(matrixCfg.part3.count * 0.33))} câu ({((Math.max(1, Math.round(matrixCfg.part3.count * 0.33))) * matrixCfg.part3.pointPerQ).toFixed(2)}đ)
                    </td>
                  )}
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>
                    {((matrixCfg.cognitiveRatios?.nb || 40) / 10).toFixed(1)} điểm ({matrixCfg.cognitiveRatios?.nb || 40}%)
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>
                    2. Thông hiểu ({matrixCfg.cognitiveRatios?.th || 30}%)
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {Math.round(matrixCfg.part1.count * 0.35)} câu ({((Math.round(matrixCfg.part1.count * 0.35)) * matrixCfg.part1.pointPerQ).toFixed(2)}đ)
                  </td>
                  {matrixCfg.part2.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      1 câu (1.00đ)
                    </td>
                  )}
                  {matrixCfg.part3.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {Math.max(1, Math.round(matrixCfg.part3.count * 0.33))} câu ({((Math.max(1, Math.round(matrixCfg.part3.count * 0.33))) * matrixCfg.part3.pointPerQ).toFixed(2)}đ)
                    </td>
                  )}
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>
                    {((matrixCfg.cognitiveRatios?.th || 30) / 10).toFixed(1)} điểm ({matrixCfg.cognitiveRatios?.th || 30}%)
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>
                    3. Vận dụng ({matrixCfg.cognitiveRatios?.vd || 20}%)
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {Math.round(matrixCfg.part1.count * 0.18)} câu ({((Math.round(matrixCfg.part1.count * 0.18)) * matrixCfg.part1.pointPerQ).toFixed(2)}đ)
                  </td>
                  {matrixCfg.part2.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      1 câu (1.00đ)
                    </td>
                  )}
                  {matrixCfg.part3.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {Math.max(1, Math.round(matrixCfg.part3.count * 0.17))} câu ({((Math.max(1, Math.round(matrixCfg.part3.count * 0.17))) * matrixCfg.part3.pointPerQ).toFixed(2)}đ)
                    </td>
                  )}
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>
                    {((matrixCfg.cognitiveRatios?.vd || 20) / 10).toFixed(1)} điểm ({matrixCfg.cognitiveRatios?.vd || 20}%)
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>
                    4. Vận dụng cao ({matrixCfg.cognitiveRatios?.vdc || 10}%)
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {Math.max(1, matrixCfg.part1.count - (Math.round(matrixCfg.part1.count * 0.35) * 2 + Math.round(matrixCfg.part1.count * 0.18)))} câu
                  </td>
                  {matrixCfg.part2.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      1 câu (1.00đ)
                    </td>
                  )}
                  {matrixCfg.part3.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      1 câu ({matrixCfg.part3.pointPerQ.toFixed(2)}đ)
                    </td>
                  )}
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>
                    {((matrixCfg.cognitiveRatios?.vdc || 10) / 10).toFixed(1)} điểm ({matrixCfg.cognitiveRatios?.vdc || 10}%)
                  </td>
                </tr>
                <tr style={{ background: '#f0fdf4', fontWeight: 'bold' }}>
                  <td style={{ padding: '12px' }}>TỔNG CỘNG (100%)</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {matrixCfg.part1.count} câu ({matrixCfg.part1.total.toFixed(1)}đ)
                  </td>
                  {matrixCfg.part2.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {matrixCfg.part2.count} câu ({matrixCfg.part2.total.toFixed(1)}đ)
                    </td>
                  )}
                  {matrixCfg.part3.count > 0 && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {matrixCfg.part3.count} câu ({matrixCfg.part3.total.toFixed(1)}đ)
                    </td>
                  )}
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '15px', color: '#15803d' }}>
                    10.0 ĐIỂM (100%)
                  </td>
                </tr>
              </tbody>
            </table>

            {/* QUY TẮC TÍNH ĐIỂM CỦA BỘ GD&ĐT */}
            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.6' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>
                📌 Hướng Dẫn Chấm Điểm Chuẩn Theo Quyết Định 764/QĐ-BGDĐT Môn {subject}:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {matrixCfg.part1.count > 0 && (
                  <li><strong>{subject === 'Ngữ văn' ? 'Phần Đọc hiểu' : 'Phần I (Trắc nghiệm 4 lựa chọn)'}:</strong> Mỗi câu trả lời đúng được <strong>{matrixCfg.part1.pointPerQ} điểm</strong>.</li>
                )}
                {matrixCfg.part2.count > 0 && (
                  <li>
                    <strong>Phần II (Trắc nghiệm Đúng/Sai lũy tiến):</strong> Mỗi câu hỏi gồm 4 ý a, b, c, d độc lập:
                    <div style={{ margin: '4px 0 4px 12px', color: '#475569' }}>
                      • Đúng 1 ý: <strong>0,10 điểm</strong> | Đúng 2 ý: <strong>0,25 điểm</strong> | Đúng 3 ý: <strong>0,50 điểm</strong> | Đúng 4 ý: <strong>1,00 điểm</strong>.
                    </div>
                  </li>
                )}
                {matrixCfg.part3.count > 0 && (
                  <li>
                    <strong>{subject === 'Ngữ văn' ? 'Phần II (Viết nghị luận)' : 'Phần III (Trắc nghiệm Trả lời ngắn)'}:</strong> 
                    {subject === 'Ngữ văn' ? ' Đoạn văn nghị luận xã hội (2.0đ) + Bài văn nghị luận văn học (4.0đ).' : ` Mỗi câu trả lời đúng kết quả số được ${matrixCfg.part3.pointPerQ} điểm.`}
                  </li>
                )}
              </ul>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: PREVIEW EXAM PAPER */}
      {activeTab === 'preview' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Chọn Mã Đề Thi Để Xem Bản In:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(mixedExamCodes.length > 0 ? mixedExamCodes : [{ code: String(baseCodeNum) }]).map(c => (
                  <button 
                    key={c.code} 
                    onClick={() => setSelectedCodeView(c.code)}
                    style={{ padding: '6px 14px', borderRadius: '6px', background: selectedCodeView === c.code ? '#0284c7' : '#f1f5f9', color: selectedCodeView === c.code ? '#fff' : '#334155', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Mã {c.code}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setShowOmrModal(true)} 
                style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="In Phiếu trả lời trắc nghiệm chuẩn Bộ GD&ĐT khổ A4"
              >
                <Printer size={16} /> Phiếu Tô OMR A4
              </button>

              <button 
                onClick={() => window.print()} 
                style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="In đề thi ra máy in hoặc lưu PDF chuẩn A4"
              >
                <Printer size={16} /> 🖨️ In Đề Thi Này
              </button>

              <button onClick={handleExportWordExam} style={{ padding: '8px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={16} /> Tải File Word Mã Đề {selectedCodeView} (.doc)
              </button>
            </div>
          </div>

          {/* Printable Exam Paper Document Container */}
          <div style={{ border: '1px solid #cbd5e1', padding: '24px', background: '#f8fafc', borderRadius: '8px', maxHeight: '650px', overflowY: 'auto' }}>
            <div id="exam-paper-preview-content" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.4', color: '#000000', backgroundColor: '#ffffff', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              
              {/* Official BGDĐT Header Box */}
              <table style={{ width: '100%', border: 'none', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '45%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                      <div style={{ fontSize: '11pt', textTransform: 'uppercase' }}>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</div>
                      <div style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                      <div style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '4px' }}>(Đề thi gồm 02 trang)</div>
                    </td>
                    <td style={{ width: '55%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                      <div style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase' }}>{examTitle}</div>
                      <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>MÔN: {subject.toUpperCase()} - {grade.toUpperCase()}</div>
                      <div style={{ fontSize: '10pt', fontStyle: 'italic' }}>Thời gian làm bài: {duration} (Không kể thời gian phát đề)</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ border: '1px solid #000', padding: '8px 14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>Họ và tên học sinh: .................................................................................... Lớp: .............</div>
                <div style={{ fontWeight: 'bold', fontSize: '13pt', borderLeft: '1px solid #000', paddingLeft: '12px' }}>MÃ ĐỀ THI: {selectedCodeView}</div>
              </div>

              {/* PHẦN I */}
              <div style={{ fontWeight: 'bold', fontSize: '12pt', marginTop: '15px', marginBottom: '8px' }}>
                PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (Thí sinh trả lời từ câu 1 đến câu {activeCodeObj.part1.length}. Mỗi câu chọn 1 phương án).
              </div>
              {activeCodeObj.part1.map((q, idx) => {
                const opts = q.shuffledOptions || q.options;
                return (
                  <div key={q.id || idx} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                      <strong>Câu {idx + 1}:</strong> 
                      <MathView inline text={q.content} />
                    </div>
                    {q.image_url && (
                      <div style={{ textAlign: 'center', margin: '8px 0' }}>
                        <img src={q.image_url} alt="Hình vẽ minh họa" style={{ maxWidth: '300px', maxHeight: '180px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: '6px', marginLeft: '15px', gap: '6px' }}>
                      {opts.map((opt, i) => (
                        <span key={i} style={{ display: 'inline-flex', gap: '4px', alignItems: 'baseline' }}>
                          <strong>{['A.', 'B.', 'C.', 'D.'][i]}</strong> 
                          <MathView inline text={opt} />
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* PHẦN II */}
              <div style={{ fontWeight: 'bold', fontSize: '12pt', marginTop: '20px', marginBottom: '8px' }}>
                PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG / SAI (Thí sinh trả lời từ câu 1 đến câu {activeCodeObj.part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai).
              </div>
              {activeCodeObj.part2.map((q, idx) => {
                const subs = q.shuffledSubItems || q.subItems;
                return (
                  <div key={q.id || idx} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                      <strong>Câu {idx + 1}:</strong> 
                      <MathView inline text={q.content} />
                    </div>
                    {q.image_url && (
                      <div style={{ textAlign: 'center', margin: '8px 0' }}>
                        <img src={q.image_url} alt="Hình vẽ minh họa" style={{ maxWidth: '300px', maxHeight: '180px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                      </div>
                    )}
                    <div style={{ marginLeft: '15px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {subs.map((sub, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                          <strong>{['a)', 'b)', 'c)', 'd)'][i]}</strong> 
                          <MathView inline text={sub.text} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* PHẦN III */}
              <div style={{ fontWeight: 'bold', fontSize: '12pt', marginTop: '20px', marginBottom: '8px' }}>
                PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (Thí sinh trả lời từ câu 1 đến câu {activeCodeObj.part3.length}. Điền kết quả vào phiếu trả lời).
              </div>
              {activeCodeObj.part3.map((q, idx) => (
                <div key={q.id || idx} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                    <strong>Câu {idx + 1}:</strong> 
                    <MathView inline text={q.content} />
                  </div>
                  {q.image_url && (
                    <div style={{ textAlign: 'center', margin: '8px 0' }}>
                      <img src={q.image_url} alt="Hình vẽ minh họa" style={{ maxWidth: '300px', maxHeight: '180px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                    </div>
                  )}
                </div>
              ))}

              {/* PHẦN TỰ LUẬN (nếu có) */}
              {activeCodeObj.essay && activeCodeObj.essay.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '8px' }}>
                    PHẦN IV. CÂU HỎI TỰ LUẬN (Thí sinh làm bài trực tiếp vào giấy làm bài thi. Tổng điểm: {(activeCodeObj.essay.reduce((sum, q) => sum + (parseFloat(q.maxScore) || 2.0), 0)).toFixed(1)} điểm).
                  </div>
                  {activeCodeObj.essay.map((q, idx) => (
                    <div key={q.id || idx} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                        <strong>Câu {idx + 1} ({q.maxScore || 2.0} điểm):</strong>
                        <MathView inline text={q.content} />
                      </div>
                      {q.image_url && (
                        <div style={{ textAlign: 'center', margin: '8px 0' }}>
                          <img src={q.image_url} alt="Hình vẽ minh họa" style={{ maxWidth: '300px', maxHeight: '180px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        </div>
                      )}
                      {/* Dòng kẻ chấm chừa chỗ cho học sinh làm bài */}
                      <div style={{ marginTop: '10px', color: '#64748b', fontSize: '11pt', letterSpacing: '2px', lineHeight: '2' }}>
                        <div>....................................................................................................................................................................................................</div>
                        <div>....................................................................................................................................................................................................</div>
                        <div>....................................................................................................................................................................................................</div>
                        <div>....................................................................................................................................................................................................</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '35px', fontWeight: 'bold' }}>
                ------------------ HẾT ------------------
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 4: TEACHER ANSWER KEYS & MATRIX */}
      {activeTab === 'keys' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎯 Bảng Đáp Án Ma Trận Tất Cả Mã Đề Thi ({mixedExamCodes.length || 1} Mã Đề)
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Đáp án chuẩn xác 100% tự động cập nhật theo thuật toán hoán vị câu hỏi và phương án A, B, C, D
              </p>
            </div>

            <button
              onClick={handleExportMasterKeysExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                fontSize: '13.5px'
              }}
            >
              <FileSpreadsheet size={18} /> 📊 Xuất Bảng Đáp Án Sang Excel (.xlsx)
            </button>
          </div>

          {(mixedExamCodes.length > 0 ? mixedExamCodes : [activeCodeObj]).map(codeObj => (
            <div key={codeObj.code} style={{ marginBottom: '24px', background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0284c7', fontSize: '15px' }}>📌 MÃ ĐỀ THI: {codeObj.code}</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '13px', color: '#334155' }}>PHẦN I. TRẮC NGHIỆM 4 LỰA CHỌN:</strong>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {codeObj.part1.map((q, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                      C{i + 1}: <strong style={{ color: '#16a34a' }}>{['A', 'B', 'C', 'D'][q.shuffledCorrectIndex ?? q.correctAnswerIndex]}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '13px', color: '#334155' }}>PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI:</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                  {codeObj.part2.map((q, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
                      <strong>Câu {i + 1}:</strong>
                      <span style={{ marginLeft: '8px' }}>
                        {(q.shuffledSubItems || q.subItems).map((sub, sIdx) => (
                          <span key={sIdx} style={{ marginRight: '8px' }}>
                            {['a', 'b', 'c', 'd'][sIdx]}: <strong style={{ color: sub.isTrue ? '#16a34a' : '#ef4444' }}>{sub.isTrue ? 'Đ' : 'S'}</strong>
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '13px', color: '#334155' }}>PHẦN III. TRẢ LỜI NGẮN:</strong>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {codeObj.part3.map((q, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                      C{i + 1}: <strong style={{ color: '#0284c7' }}>{q.shortAnswer}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {codeObj.essay && codeObj.essay.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ fontSize: '13px', color: '#334155' }}>PHẦN IV. TỰ LUẬN & HƯỚNG DẪN CHẤM:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    {codeObj.essay.map((q, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>Câu {i + 1}:</strong>
                          <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>Thang điểm: {q.maxScore || 2.0}đ</span>
                        </div>
                        <div style={{ color: '#334155', marginBottom: '6px' }}><MathView inline text={q.content} /></div>
                        {q.rubric && q.rubric.length > 0 && (
                          <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', padding: '6px 10px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#86198f', marginBottom: '2px' }}>Bareme chi tiết:</div>
                            {q.rubric.map((r, rIdx) => (
                              <div key={rIdx} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                <span>- {r.criteria}</span>
                                <strong style={{ color: '#86198f' }}>{r.score}đ</strong>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.explanation && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                            💡 Hướng dẫn giải: {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: STUDENT SUBMISSIONS & DIRECT EXCEL GRADE SYNC */}
      {activeTab === 'submissions' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '20px', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                <Sparkles size={13} color="#16a34a" /> CHẤM ĐIỂM TỰ ĐỘNG & ĐỒNG BỘ SỔ ĐIỂM
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#166534', fontWeight: '900' }}>
                Bảng Điểm Học Sinh & Công Cụ Ghi Điểm Excel Cá Nhân
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4b5563' }}>
                Học sinh làm bài thi trực tuyến được chấm tự động 100% theo chuẩn Bộ GD&ĐT. Bấm nút dưới đây để ghi thẳng điểm vào file Excel sổ điểm của Thầy/Cô.
              </p>
            </div>

            <button
              onClick={() => setShowExcelSyncModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
              }}
            >
              <FileSpreadsheet size={20} /> 📊 GHI ĐIỂM VÀO FILE EXCEL TỪ MÁY TÍNH
            </button>
          </div>

          {/* ITEM ANALYSIS & SCORE DISTRIBUTION CARDS */}
          {submissions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>ĐIỂM TRUNG BÌNH (MEAN)</span>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>
                  {(submissions.reduce((acc, s) => acc + (s.total_score || 0), 0) / submissions.length).toFixed(2)}
                </div>
                <span style={{ fontSize: '11px', color: '#0369a1' }}>Chuẩn phân hóa GDPT</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>ĐIỂM CAO NHẤT / THẤP NHẤT</span>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>
                  {Math.max(...submissions.map(s => s.total_score || 0))} <span style={{ fontSize: '14px', color: '#dc2626' }}>/ {Math.min(...submissions.map(s => s.total_score || 0))}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#15803d' }}>Khoảng biến thiên</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>TỶ LỆ ĐẠT (≥ 5.0 ĐIỂM)</span>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>
                  {Math.round((submissions.filter(s => (s.total_score || 0) >= 5.0).length / submissions.length) * 100)}%
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{submissions.filter(s => (s.total_score || 0) >= 5.0).length}/{submissions.length} học sinh</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>TỶ LỆ KHÁ - GIỎI (≥ 6.5 ĐIỂM)</span>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#d97706', marginTop: '4px' }}>
                  {Math.round((submissions.filter(s => (s.total_score || 0) >= 6.5).length / submissions.length) * 100)}%
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{submissions.filter(s => (s.total_score || 0) >= 6.5).length}/{submissions.length} học sinh</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>
              Danh Sách Học Sinh Đã Nộp Bài ({submissions.length} học sinh)
            </h4>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={loadSubmissions}
                style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> Tải lại danh sách
              </button>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              Chưa có học sinh nào nộp bài thi.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '10px 14px' }}>STT</th>
                    <th style={{ padding: '10px 14px' }}>Mã Học Sinh</th>
                    <th style={{ padding: '10px 14px' }}>Họ Và Tên</th>
                    <th style={{ padding: '10px 14px' }}>Lớp</th>
                    <th style={{ padding: '10px 14px' }}>Điểm Kiểm Tra</th>
                    <th style={{ padding: '10px 14px' }}>Thời Gian Nộp</th>
                    <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, idx) => (
                    <tr key={sub.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 'bold', color: '#0284c7' }}>
                        <code>{sub.student_code}</code>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 'bold', color: '#0f172a' }}>{sub.student_name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                          {sub.student_class}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: '900', fontSize: '15px', color: sub.total_score >= 8 ? '#16a34a' : sub.total_score >= 5 ? '#0284c7' : '#dc2626' }}>
                        {sub.total_score} điểm
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12.5px' }}>
                        {new Date(sub.submitted_at).toLocaleTimeString('vi-VN')} {new Date(sub.submitted_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px' }}>
                          ✓ Đã chấm tự động
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* EXCEL GRADE SYNC MODAL */}
      <ExcelGradeSyncModal
        isOpen={showExcelSyncModal}
        onClose={() => setShowExcelSyncModal(false)}
        submissions={submissions}
        examTitle={examTitle}
        subject={subject}
        targetClass={grade}
      />

      {/* MODAL: ADD NEW QUESTION */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '650px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>➕ Thêm Câu Hỏi Mới Vào Đề Thi</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Loại Câu Hỏi / Phần</label>
                  <select value={newPart} onChange={e => setNewPart(e.target.value)} style={styles.input}>
                    <option value="part1">Phần I: Trắc nghiệm 4 lựa chọn</option>
                    <option value="part2">Phần II: Trắc nghiệm Đúng / Sai</option>
                    <option value="part3">Phần III: Trắc nghiệm Trả lời ngắn</option>
                    <option value="essay">Phần Tự Luận: Câu hỏi / Bài tập tự luận</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Mức Độ Tư Duy</label>
                  <select value={newLevel} onChange={e => setNewLevel(e.target.value)} style={styles.input}>
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.label}>Nội dung câu hỏi (*):</label>
                {/* Quick Math & LaTeX Palette */}
                <MathToolbar onInsert={(latex) => setNewContent(prev => prev ? prev + ' ' + latex : latex)} />
                <textarea 
                  rows={3} 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)} 
                  style={{ ...styles.input, resize: 'vertical', fontFamily: 'monospace' }} 
                  placeholder="Nhập nội dung câu hỏi (gõ công thức giữa 2 dấu $...$ ví dụ: $u_1 = 3, d = 2$)..." 
                  required 
                />
                {newContent.trim() && (
                  <div style={{ marginTop: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', marginBottom: '4px' }}>
                      👁️ Xem trước công thức hiển thị thực tế (Live KaTeX Preview):
                    </div>
                    <MathView text={newContent} />
                  </div>
                )}
              </div>

              {/* Đính kèm hình ảnh / Đồ thị cho các môn Tự nhiên */}
              <div 
                style={{ border: '1px dashed #0284c7', padding: '14px', borderRadius: '12px', background: '#f0f9ff' }}
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                      const file = items[i].getAsFile();
                      const reader = new FileReader();
                      reader.onload = (evt) => setNewImageUrl(evt.target.result);
                      reader.readAsDataURL(file);
                      break;
                    }
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ ...styles.label, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1' }}>
                    <Image size={16} color="#0284c7" /> 🖼️ Đính Kèm Hình Ảnh / Đồ Thị (Môn Tự Nhiên: Toán, Lý, Hóa, Sinh)
                  </label>
                  <span style={{ fontSize: '11px', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                    💡 Hỗ trợ dán ảnh trực tiếp (Ctrl + V)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ padding: '6px 14px', background: '#0284c7', color: 'white', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> Tải ảnh từ máy tính
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => setNewImageUrl(evt.target.result);
                        reader.readAsDataURL(file);
                      }} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  <input 
                    type="text" 
                    value={newImageUrl} 
                    onChange={e => setNewImageUrl(e.target.value)} 
                    placeholder="Hoặc dán URL ảnh / Click vào đây rồi nhấn Ctrl+V để dán ảnh chụp màn hình" 
                    style={{ ...styles.input, flex: 1, minWidth: '220px', fontSize: '12.5px' }} 
                  />
                  {newImageUrl && (
                    <button type="button" onClick={() => setNewImageUrl('')} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 'bold' }}>
                      ✕ Xóa ảnh
                    </button>
                  )}
                </div>

                {newImageUrl && (
                  <div style={{ marginTop: '10px', textAlign: 'center', background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <img src={newImageUrl} alt="Xem trước hình vẽ" style={{ maxWidth: '300px', maxHeight: '180px', objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: '4px' }} />
                    <span style={{ fontSize: '11px', color: '#16a34a', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>✓ Đã đính kèm ảnh thành công (hiển thị tốt trên đề thi & phiếu làm bài)</span>
                  </div>
                )}
              </div>

              {/* Part 1 input */}
              {newPart === 'part1' && (
                <div>
                  <label style={styles.label}>Các phương án lựa chọn & Chọn đáp án đúng (hỗ trợ gõ $công_thức$):</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="radio" name="correctOpt" checked={newCorrectIdx === idx} onChange={() => setNewCorrectIdx(idx)} />
                        <span style={{ fontWeight: 'bold', width: '20px' }}>{label}.</span>
                        <input type="text" value={newOptions[idx]} onChange={e => {
                          const opts = [...newOptions];
                          opts[idx] = e.target.value;
                          setNewOptions(opts);
                        }} style={styles.input} placeholder={`Phương án ${label} (VD: $x = 5$)`} required />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 2 input */}
              {newPart === 'part2' && (
                <div>
                  <label style={styles.label}>Các mệnh đề Đúng / Sai (hỗ trợ gõ $công_thức$):</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {newSubItems.map((sub, idx) => (
                      <div key={sub.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', width: '20px' }}>{sub.key})</span>
                        <input type="text" value={sub.text} onChange={e => {
                          const subs = [...newSubItems];
                          subs[idx].text = e.target.value;
                          setNewSubItems(subs);
                        }} style={{ ...styles.input, flex: 1 }} placeholder={`Mệnh đề ${sub.key}`} required />
                        
                        <select value={sub.isTrue ? 'true' : 'false'} onChange={e => {
                          const subs = [...newSubItems];
                          subs[idx].isTrue = e.target.value === 'true';
                          setNewSubItems(subs);
                        }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: sub.isTrue ? '#16a34a' : '#ef4444' }}>
                          <option value="true">ĐÚNG</option>
                          <option value="false">SAI</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 3 input */}
              {newPart === 'part3' && (
                <div>
                  <label style={styles.label}>Đáp số trả lời ngắn (Ví dụ: 50 hoặc -2.5)</label>
                  <input type="text" value={newShortAnswer} onChange={e => setNewShortAnswer(e.target.value)} style={{ ...styles.input, fontWeight: 'bold', color: '#0284c7' }} placeholder="VD: 50" required />
                </div>
              )}

              {/* Part Essay Inputs */}
              {newPart === 'essay' && (
                <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ ...styles.label, color: '#86198f' }}>Thang điểm tối đa cho câu tự luận (*):</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="10.0"
                      value={newMaxScore}
                      onChange={e => setNewMaxScore(parseFloat(e.target.value) || 2.0)}
                      style={{ ...styles.input, width: '120px', fontWeight: 'bold', color: '#86198f' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ ...styles.label, margin: 0, color: '#86198f' }}>Tiêu chí bareme / Hướng dẫn chấm chi tiết:</label>
                      <button
                        type="button"
                        onClick={() => setNewRubric([...newRubric, { criteria: '', score: 0.5 }])}
                        style={{ fontSize: '11.5px', background: '#fae8ff', border: '1px solid #f0abfc', color: '#86198f', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        + Thêm ý tiêu chí
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newRubric.map((r, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#86198f', width: '35px' }}>Ý {idx + 1}:</span>
                          <input
                            type="text"
                            value={r.criteria}
                            onChange={e => {
                              const updated = [...newRubric];
                              updated[idx].criteria = e.target.value;
                              setNewRubric(updated);
                            }}
                            placeholder="Mô tả tiêu chí cần đạt..."
                            style={{ ...styles.input, flex: 1, fontSize: '12.5px' }}
                          />
                          <input
                            type="number"
                            step="0.25"
                            value={r.score}
                            onChange={e => {
                              const updated = [...newRubric];
                              updated[idx].score = parseFloat(e.target.value) || 0.5;
                              setNewRubric(updated);
                            }}
                            style={{ ...styles.input, width: '65px', textAlign: 'center', fontWeight: 'bold', color: '#86198f' }}
                          />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>đ</span>
                          {newRubric.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setNewRubric(newRubric.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={styles.label}>Lời giải chi tiết (Hướng dẫn chấm & công thức giải):</label>
                <textarea rows={2} value={newExplanation} onChange={e => setNewExplanation(e.target.value)} style={{ ...styles.input, resize: 'vertical' }} placeholder="Nhập hướng dẫn giải chi tiết cho câu hỏi (hỗ trợ $...$)..." />
                {newExplanation.trim() && (
                  <div style={{ marginTop: '6px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>👁️ Xem trước lời giải:</div>
                    <MathView text={newExplanation} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Thêm Vào Đề Thi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT QUESTION WITH LATEX TOOLBAR & LIVE PREVIEW */}
      {showEditModal && editingQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '700px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} /> Chỉnh Sửa Câu Hỏi & Công Thức LaTeX
              </h3>
              <button onClick={() => { setShowEditModal(false); setEditingQuestion(null); }} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Loại Câu Hỏi / Phần</label>
                  <select 
                    value={editingQuestion.part} 
                    onChange={e => setEditingQuestion({ ...editingQuestion, part: e.target.value })} 
                    style={styles.input}
                  >
                    <option value="part1">Phần I: Trắc nghiệm 4 lựa chọn</option>
                    <option value="part2">Phần II: Trắc nghiệm Đúng / Sai</option>
                    <option value="part3">Phần III: Trắc nghiệm Trả lời ngắn</option>
                    <option value="essay">Phần Tự Luận: Câu hỏi / Bài tập tự luận</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Mức Độ Tư Duy</label>
                  <select 
                    value={editingQuestion.level || 'Thông hiểu'} 
                    onChange={e => setEditingQuestion({ ...editingQuestion, level: e.target.value })} 
                    style={styles.input}
                  >
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.label}>Nội dung câu hỏi (*):</label>
                <MathToolbar onInsert={(latex) => setEditingQuestion({ ...editingQuestion, content: (editingQuestion.content ? editingQuestion.content + ' ' : '') + latex })} />
                <textarea 
                  rows={3} 
                  value={editingQuestion.content || ''} 
                  onChange={e => setEditingQuestion({ ...editingQuestion, content: e.target.value })} 
                  style={{ ...styles.input, resize: 'vertical', fontFamily: 'monospace' }} 
                  required 
                />
                {editingQuestion.content && (
                  <div style={{ marginTop: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', marginBottom: '4px' }}>
                      👁️ Xem trước công thức hiển thị thực tế:
                    </div>
                    <MathView text={editingQuestion.content} />
                  </div>
                )}
              </div>

              {/* Edit Image Attachment */}
              <div style={{ border: '1px dashed #0284c7', padding: '12px', borderRadius: '10px', background: '#f0f9ff' }}>
                <label style={{ ...styles.label, color: '#0369a1' }}>🖼️ Ảnh Đồ Thị / Hình Vẽ Minh Họa:</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={editingQuestion.image_url || ''} 
                    onChange={e => setEditingQuestion({ ...editingQuestion, image_url: e.target.value })} 
                    placeholder="URL ảnh hoặc data URI" 
                    style={{ ...styles.input, flex: 1, fontSize: '12.5px' }} 
                  />
                  {editingQuestion.image_url && (
                    <button type="button" onClick={() => setEditingQuestion({ ...editingQuestion, image_url: '' })} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                      ✕ Gỡ ảnh
                    </button>
                  )}
                </div>
              </div>

              {/* Part 1 Options */}
              {editingQuestion.part === 'part1' && (
                <div>
                  <label style={styles.label}>Các phương án và đáp án đúng:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="radio" 
                          name="editCorrectOpt" 
                          checked={editingQuestion.correctAnswerIndex === idx} 
                          onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswerIndex: idx })} 
                        />
                        <span style={{ fontWeight: 'bold', width: '20px' }}>{label}.</span>
                        <input 
                          type="text" 
                          value={(editingQuestion.options || [])[idx] || ''} 
                          onChange={e => {
                            const opts = [...(editingQuestion.options || ['', '', '', ''])];
                            opts[idx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: opts });
                          }} 
                          style={styles.input} 
                          placeholder={`Phương án ${label}`} 
                          required 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 2 Sub-items */}
              {editingQuestion.part === 'part2' && (
                <div>
                  <label style={styles.label}>Các mệnh đề Đúng / Sai:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(editingQuestion.subItems || []).map((sub, idx) => (
                      <div key={sub.key || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', width: '20px' }}>{sub.key})</span>
                        <input 
                          type="text" 
                          value={sub.text || ''} 
                          onChange={e => {
                            const subs = [...(editingQuestion.subItems || [])];
                            subs[idx].text = e.target.value;
                            setEditingQuestion({ ...editingQuestion, subItems: subs });
                          }} 
                          style={{ ...styles.input, flex: 1 }} 
                          required 
                        />
                        <select 
                          value={sub.isTrue ? 'true' : 'false'} 
                          onChange={e => {
                            const subs = [...(editingQuestion.subItems || [])];
                            subs[idx].isTrue = e.target.value === 'true';
                            setEditingQuestion({ ...editingQuestion, subItems: subs });
                          }} 
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: sub.isTrue ? '#16a34a' : '#ef4444' }}
                        >
                          <option value="true">ĐÚNG</option>
                          <option value="false">SAI</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 3 Short Answer */}
              {editingQuestion.part === 'part3' && (
                <div>
                  <label style={styles.label}>Đáp số câu trả lời ngắn:</label>
                  <input 
                    type="text" 
                    value={editingQuestion.shortAnswer || ''} 
                    onChange={e => setEditingQuestion({ ...editingQuestion, shortAnswer: e.target.value })} 
                    style={{ ...styles.input, fontWeight: 'bold', color: '#0284c7' }} 
                    required 
                  />
                </div>
              )}

              {/* Part Essay Edit Inputs */}
              {editingQuestion.part === 'essay' && (
                <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ ...styles.label, color: '#86198f' }}>Thang điểm tối đa cho câu tự luận (*):</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="10.0"
                      value={editingQuestion.maxScore || 2.0}
                      onChange={e => setEditingQuestion({ ...editingQuestion, maxScore: parseFloat(e.target.value) || 2.0 })}
                      style={{ ...styles.input, width: '120px', fontWeight: 'bold', color: '#86198f' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ ...styles.label, margin: 0, color: '#86198f' }}>Tiêu chí bareme / Hướng dẫn chấm chi tiết:</label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentRubric = editingQuestion.rubric || [];
                          setEditingQuestion({
                            ...editingQuestion,
                            rubric: [...currentRubric, { criteria: '', score: 0.5 }]
                          });
                        }}
                        style={{ fontSize: '11.5px', background: '#fae8ff', border: '1px solid #f0abfc', color: '#86198f', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        + Thêm ý tiêu chí
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(editingQuestion.rubric || [
                        { criteria: 'Ý 1: Nêu đúng định lý / hiện tượng / dẫn chứng', score: 1.0 },
                        { criteria: 'Ý 2: Lập luận logic và kết luận chính xác', score: 1.0 }
                      ]).map((r, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#86198f', width: '35px' }}>Ý {idx + 1}:</span>
                          <input
                            type="text"
                            value={r.criteria}
                            onChange={e => {
                              const updated = [...(editingQuestion.rubric || [])];
                              if (!updated[idx]) updated[idx] = { criteria: '', score: 0.5 };
                              updated[idx].criteria = e.target.value;
                              setEditingQuestion({ ...editingQuestion, rubric: updated });
                            }}
                            placeholder="Mô tả tiêu chí cần đạt..."
                            style={{ ...styles.input, flex: 1, fontSize: '12.5px' }}
                          />
                          <input
                            type="number"
                            step="0.25"
                            value={r.score}
                            onChange={e => {
                              const updated = [...(editingQuestion.rubric || [])];
                              if (!updated[idx]) updated[idx] = { criteria: '', score: 0.5 };
                              updated[idx].score = parseFloat(e.target.value) || 0.5;
                              setEditingQuestion({ ...editingQuestion, rubric: updated });
                            }}
                            style={{ ...styles.input, width: '65px', textAlign: 'center', fontWeight: 'bold', color: '#86198f' }}
                          />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>đ</span>
                          {(editingQuestion.rubric || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (editingQuestion.rubric || []).filter((_, i) => i !== idx);
                                setEditingQuestion({ ...editingQuestion, rubric: updated });
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={styles.label}>Lời giải chi tiết (Hướng dẫn chấm):</label>
                <textarea 
                  rows={2} 
                  value={editingQuestion.explanation || ''} 
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })} 
                  style={{ ...styles.input, resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingQuestion(null); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Lưu Thay Đổi</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: SMART IMPORT EXAM FROM WORD / PDF / TEXT */}
      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📥 Nạp Đề Thi Thông Minh Từ File Word (.docx/.doc), PDF hoặc Sao Chép Văn Bản
              </h3>
              <button onClick={() => setShowImportModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', fontSize: '12.5px', color: '#334155', lineHeight: '1.5' }}>
              <strong>💡 Hướng Dẫn Định Dạng Nhập Nhanh:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li>Phần I (Trắc nghiệm 4 op): Các đáp án dạng <code>A. Nội dung</code>, <code>B. Nội dung</code>. Đánh dấu <code>*</code> hoặc <code>✅</code> ở đáp án đúng.</li>
                <li>Phần II (Đúng / Sai): Các mệnh đề dạng <code>a) Mệnh đề... [ĐÚNG]</code> hoặc <code>b) Mệnh đề... [SAI]</code>.</li>
                <li>Phần III (Trả lời ngắn): Ghi dòng <code>Đáp số: 50</code> hoặc <code>Đáp án: 50</code> bên dưới câu hỏi.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Cách 1: Chọn File Đề Thi (.txt / .doc / .docx / .pdf text):</label>
              <input type="file" accept=".txt,.docx,.doc,.pdf" onChange={handleFileUploadDocxOrPdf} style={{ fontSize: '13px', marginTop: '4px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ ...styles.label, margin: 0 }}>Cách 2: Hoặc Dán (Paste) Trực Tiếp Nội Dung Đề Thi Từ Word / PDF Vào Đây:</label>
                <button
                  type="button"
                  onClick={handleAiParseImportText}
                  disabled={aiParsingLoading || !importRawText.trim()}
                  style={{
                    padding: '5px 14px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: aiParsingLoading || !importRawText.trim() ? 'not-allowed' : 'pointer',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 6px rgba(79,70,229,0.25)'
                  }}
                  title="Sử dụng trí tuệ nhân tạo Gemini để tự động chuẩn hóa đáp án và công thức"
                >
                  <Sparkles size={13} /> {aiParsingLoading ? 'Đang trích xuất AI...' : '✨ Dùng AI Tự Động Bóc Tách'}
                </button>
              </div>
              <textarea 
                rows={10} 
                value={importRawText} 
                onChange={e => {
                  setImportRawText(e.target.value);
                  setParsedPreviewQuestions(parseRawExamText(e.target.value));
                }} 
                style={{ ...styles.input, fontFamily: 'monospace', fontSize: '12.5px', resize: 'vertical' }} 
                placeholder="Dán nội dung đề thi từ Word/PDF tại đây... Thầy/Cô có thể bấm 'Dùng AI Tự Động Bóc Tách' để trợ lý tự phân loại Phần I, II, III và công thức LaTeX!"
              />
            </div>

            {parsedPreviewQuestions.length > 0 && (
              <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#16a34a', fontSize: '14px' }}>
                  🎉 Đã nhận diện bóc tách được {parsedPreviewQuestions.length} câu hỏi:
                </h4>
                <div style={{ display: 'flex', gap: '15px', fontSize: '13px', fontWeight: 'bold', color: '#15803d' }}>
                  <span>Phần I (Trắc nghiệm): {parsedPreviewQuestions.filter(q => q.part === 'part1').length} câu</span>
                  <span>Phần II (Đúng/Sai): {parsedPreviewQuestions.filter(q => q.part === 'part2').length} câu</span>
                  <span>Phần III (Trả lời ngắn): {parsedPreviewQuestions.filter(q => q.part === 'part3').length} câu</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowImportModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>Hủy</button>
              <button type="button" onClick={handleConfirmImportQuestions} disabled={parsedPreviewQuestions.length === 0} style={{ padding: '8px 20px', background: parsedPreviewQuestions.length > 0 ? '#16a34a' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: parsedPreviewQuestions.length > 0 ? 'pointer' : 'not-allowed' }}>
                Nạp {parsedPreviewQuestions.length} Câu Hỏi Vào Đề Thi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ✨ TRỢ LÝ AI SOẠN CÂU HỎI THI CHUẨN 2025 */}
      {showAiGenModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '920px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={22} color="#a855f7" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                    Trợ Lý AI: Soạn Câu Hỏi Chuẩn Đề Thi Mới 2025
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#cbd5e1' }}>
                  Tự động sinh câu hỏi theo 3 định dạng Bộ GD&ĐT: Trắc nghiệm 4 lựa chọn, Đúng/Sai & Trả lời ngắn kèm công thức LaTeX.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AiStatusBadge onOpenSettings={() => setShowAiSettings(true)} />
                <button
                  type="button"
                  onClick={() => setShowAiGenModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Form Config */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginBottom: '18px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <label style={styles.label}>Môn Học:</label>
                  <select
                    value={subject}
                    onChange={e => {
                      const newSub = e.target.value;
                      handleSubjectChange(newSub);
                      const topics = SUBJECT_TOPICS_MAP[newSub] || [];
                      if (topics.length > 0) setAiTopic(topics[0]);
                    }}
                    style={{ ...styles.input, fontWeight: 'bold', color: '#0284c7' }}
                  >
                    {SUBJECT_OPTIONS.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.icon} {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Khối Lớp:</label>
                  <select
                    value={grade}
                    onChange={e => handleGradeChange(e.target.value)}
                    style={{ ...styles.input, fontWeight: 'bold' }}
                  >
                    {GRADE_OPTIONS.map(g => (
                      <option key={g} value={g}>{g} (GDPT 2018)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Định Dạng Phần Thi:</label>
                  <select
                    value={aiPart}
                    onChange={e => setAiPart(e.target.value)}
                    style={{ ...styles.input, fontWeight: 'bold', color: '#4338ca' }}
                  >
                    <option value="mixed">Hỗn hợp cả 3 Phần (Chuẩn 2025)</option>
                    <option value="part1">Phần I: Trắc nghiệm 4 lựa chọn (A, B, C, D)</option>
                    <option value="part2">Phần II: Đúng / Sai (4 ý lũy tiến a, b, c, d)</option>
                    <option value="part3">Phần III: Trả lời ngắn (Short answer / Tự luận)</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Mức Độ Nhận Thức:</label>
                  <select
                    value={aiLevel}
                    onChange={e => setAiLevel(e.target.value)}
                    style={{ ...styles.input, fontWeight: 'bold' }}
                  >
                    <option value="Nhận biết">1. Nhận biết (Cơ bản - 40%)</option>
                    <option value="Thông hiểu">2. Thông hiểu (Chuẩn kiến thức - 30%)</option>
                    <option value="Vận dụng">3. Vận dụng (Tình huống thực tế - 20%)</option>
                    <option value="Vận dụng cao">4. Vận dụng cao (Phân hóa sâu - 10%)</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Số Lượng Câu Hỏi:</label>
                  <select
                    value={aiCount}
                    onChange={e => setAiCount(Number(e.target.value))}
                    style={{ ...styles.input, fontWeight: 'bold' }}
                  >
                    <option value={2}>2 Câu</option>
                    <option value={4}>4 Câu (Khuyên dùng)</option>
                    <option value={6}>6 Câu</option>
                    <option value={8}>8 Câu</option>
                    <option value={12}>12 Câu (Trọn vẹn Phần I)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ ...styles.label, margin: 0 }}>Chủ Đề / Bài Học Cần Soạn Đề (*):</label>
                  {SUBJECT_TOPICS_MAP[subject]?.length > 0 && (
                    <span style={{ fontSize: '11.5px', color: '#6366f1' }}>
                      💡 Gợi ý chương trình GDPT 2018 môn {subject}
                    </span>
                  )}
                </div>
                {SUBJECT_TOPICS_MAP[subject]?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {SUBJECT_TOPICS_MAP[subject].map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAiTopic(t)}
                        style={{
                          fontSize: '11.5px',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          border: aiTopic === t ? '1px solid #6366f1' : '1px solid #e2e8f0',
                          background: aiTopic === t ? '#eef2ff' : '#f8fafc',
                          color: aiTopic === t ? '#4338ca' : '#475569',
                          cursor: 'pointer',
                          fontWeight: aiTopic === t ? 'bold' : 'normal'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  style={{ ...styles.input, fontWeight: 'bold', fontSize: '13.5px' }}
                  placeholder="VD: Cực trị của hàm số bậc ba, Khối lăng trụ đứng, Dao động điều hòa con lắc đơn..."
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={styles.label}>Tài Liệu / Đề Cương / Ghi Chú Riêng Của Giáo Viên (Không bắt buộc):</label>
                <textarea
                  rows={3}
                  value={aiRawContext}
                  onChange={e => setAiRawContext(e.target.value)}
                  style={{ ...styles.input, fontSize: '12.5px', resize: 'vertical' }}
                  placeholder="Dán đoạn văn bản hoặc đề cương ôn tập nếu Thầy/Cô muốn AI bám sát dữ liệu này..."
                />
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleGenerateAiExamQuestions}
                  disabled={aiGenerating || !aiTopic.trim()}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: aiGenerating || !aiTopic.trim() ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: aiGenerating || !aiTopic.trim() ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
                  }}
                >
                  <Sparkles size={18} />
                  {aiGenerating ? 'AI Đang Biên Soạn Câu Hỏi & Giải Thích...' : '✨ Bắt Đầu Soạn Câu Hỏi Bằng AI'}
                </button>

                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  💡 Công thức toán tự động chuyển đổi sang mã LaTeX KaTeX ($...$).
                </span>
              </div>

              {/* Error Message */}
              {aiError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#b91c1c',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ {aiError}
                </div>
              )}

              {/* Preview Generated Questions */}
              {aiGeneratedPreview.length > 0 && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #c7d2fe',
                  borderRadius: '14px',
                  padding: '18px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ margin: 0, color: '#312e81', fontSize: '15px', fontWeight: '800' }}>
                      🎉 Đã Tạo Xong {aiGeneratedPreview.length} Câu Hỏi Chuẩn:
                    </h4>
                    <button
                      type="button"
                      onClick={handleConfirmInsertAiQuestions}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      ✓ Nạp {aiGeneratedPreview.length} Câu Hỏi Này Vào Đề Thi
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {aiGeneratedPreview.map((q, idx) => (
                      <div key={q.id || idx} style={{
                        backgroundColor: '#ffffff',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '13.5px' }}>
                            {q.title || `Câu ${idx + 1}`}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: q.part === 'part2' ? '#fef3c7' : (q.part === 'part3' ? '#f3e8ff' : '#e0e7ff'),
                            color: q.part === 'part2' ? '#92400e' : (q.part === 'part3' ? '#6b21a8' : '#3730a3')
                          }}>
                            {q.part === 'part2' ? 'Phần II (Đúng/Sai)' : (q.part === 'part3' ? 'Phần III (Trả lời ngắn)' : 'Phần I (Trắc nghiệm)')} • {q.level || 'Thông hiểu'}
                          </span>
                        </div>

                        {/* Content */}
                        <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.6', marginBottom: '10px' }}>
                          <MathView text={q.content} />
                        </div>

                        {/* Options / SubItems / ShortAnswer */}
                        {q.part === 'part1' && Array.isArray(q.options) && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: oIdx === q.correctAnswerIndex ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                                backgroundColor: oIdx === q.correctAnswerIndex ? '#f0fdf4' : '#ffffff',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <strong>{['A', 'B', 'C', 'D'][oIdx]}.</strong>
                                <MathView text={opt} />
                                {oIdx === q.correctAnswerIndex && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        {q.part === 'part2' && Array.isArray(q.subItems) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                            {q.subItems.map(sub => (
                              <div key={sub.key} style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: sub.isTrue ? '#f0fdf4' : '#fff1f2',
                                fontSize: '13px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <strong>{sub.key})</strong> <MathView text={sub.text} />
                                </div>
                                <span style={{
                                  fontWeight: '800',
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: sub.isTrue ? '#dcfce7' : '#fee2e2',
                                  color: sub.isTrue ? '#166534' : '#991b1b'
                                }}>
                                  {sub.isTrue ? 'ĐÚNG' : 'SAI'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.part === 'part3' && (
                          <div style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#faf5ff',
                            border: '1px solid #e9d5ff',
                            fontSize: '13px',
                            marginBottom: '10px'
                          }}>
                            <strong>Đáp số:</strong> <span style={{ color: '#7e22ce', fontWeight: 'bold' }}>{q.shortAnswer}</span>
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div style={{ fontSize: '12.5px', color: '#64748b', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #6366f1' }}>
                            <strong>Lời giải:</strong> <MathView text={q.explanation} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => setShowAiGenModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>

              {aiGeneratedPreview.length > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmInsertAiQuestions}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
                  }}
                >
                  ✓ Nạp Tất Cả Vào Đề Thi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN BỘ GIÁO DỤC VÀ ĐÀO TẠO (KHỔ A4 OMR) */}
      {showOmrModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden'
          }}>
            {/* Modal Top Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={20} color="#7c3aed" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  Phiếu Trả Lời Trắc Nghiệm Chuẩn Bộ GD&ĐT (Khổ A4 OMR)
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={15} /> 🖨️ In Phiếu Ngay (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setShowOmrModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Modal Content - Printable A4 Sheet */}
            <div style={{ padding: '24px', overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
              <div id="omr-printable-sheet" style={{
                backgroundColor: '#ffffff',
                padding: '30px',
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '11.5pt',
                color: '#000000',
                border: '1.5px solid #000000',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
                {/* Header Title */}
                <table style={{ width: '100%', border: 'none', marginBottom: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '10.5pt', textTransform: 'uppercase' }}>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</div>
                        <div style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                        <div style={{ fontSize: '9.5pt', fontStyle: 'italic', marginTop: '2px' }}>HỘI ĐỒNG THI / KIỂM TRA ĐỊNH KỲ</div>
                      </td>
                      <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>PHIẾU TRẢ LỜI TRẮC NGHIỆM</div>
                        <div style={{ fontSize: '10.5pt', fontWeight: 'bold' }}>MÔN: {subject.toUpperCase()} - KHỐI {grade.toUpperCase()}</div>
                        <div style={{ fontSize: '9pt', fontStyle: 'italic' }}>Chương trình GDPT 2018 (Chuẩn 2025 - 2028)</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Candidate Info Box */}
                <div style={{ border: '1pt solid #000', padding: '8px 12px', marginBottom: '12px', fontSize: '10.5pt', lineHeight: '1.5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Họ và tên thí sinh: ............................................................................</span>
                    <span>Lớp: ....................</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>Ngày sinh: ...... / ...... / ............</span>
                    <span>Phòng thi số: ....................</span>
                    <span>Chữ ký Giám thị 1: ...................................</span>
                  </div>
                </div>

                {/* Grid SBD & Mã Đề */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  {/* Khung Số Báo Danh (6 Cột) */}
                  <div style={{ border: '1pt solid #000', padding: '6px 8px' }}>
                    <div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '10pt', marginBottom: '4px' }}>
                      SỐ BÁO DANH (6 chữ số)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', textAlign: 'center' }}>
                      {[...Array(6)].map((_, col) => (
                        <div key={col} style={{ border: '1pt dashed #cbd5e1', padding: '3px 0' }}>
                          <div style={{ borderBottom: '1pt solid #000', height: '18px', marginBottom: '4px', fontWeight: 'bold' }}></div>
                          {[...Array(10)].map((_, num) => (
                            <div key={num} style={{ fontSize: '9pt', margin: '2px 0' }}>
                              <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', border: '1pt solid #000', lineHeight: '15px' }}>
                                {num}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Khung Mã Đề Thi (3 Cột) */}
                  <div style={{ border: '1pt solid #000', padding: '6px 8px' }}>
                    <div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '10pt', marginBottom: '4px' }}>
                      MÃ ĐỀ THI (3 chữ số)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
                      {[...Array(3)].map((_, col) => (
                        <div key={col} style={{ border: '1pt dashed #cbd5e1', padding: '3px 0' }}>
                          <div style={{ borderBottom: '1pt solid #000', height: '18px', marginBottom: '4px', fontWeight: 'bold' }}>
                            {selectedCodeView?.[col] || ''}
                          </div>
                          {[...Array(10)].map((_, num) => (
                            <div key={num} style={{ fontSize: '9pt', margin: '2px 0' }}>
                              <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', border: '1pt solid #000', lineHeight: '15px' }}>
                                {num}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3 PHẦN TRẢ LỜI CHUẨN GDPT 2018 BGDĐT */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1.1fr', gap: '10px' }}>
                  {/* PHẦN I: 4 LỰA CHỌN (12 CÂU) */}
                  <div style={{ border: '1pt solid #000', padding: '6px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', textAlign: 'center', borderBottom: '1pt solid #000', paddingBottom: '3px', marginBottom: '4px' }}>
                      PHẦN I (12 câu 4 lựa chọn)
                    </div>
                    {[...Array(12)].map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px', fontSize: '9.5pt' }}>
                        <span style={{ fontWeight: 'bold', width: '22px' }}>{i + 1}</span>
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <span key={opt} style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', border: '1pt solid #000', textAlign: 'center', lineHeight: '15px', fontSize: '8.5pt' }}>
                            {opt}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* PHẦN II: ĐÚNG / SAI (4 CÂU x 4 Ý) */}
                  <div style={{ border: '1pt solid #000', padding: '6px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', textAlign: 'center', borderBottom: '1pt solid #000', paddingBottom: '3px', marginBottom: '4px' }}>
                      PHẦN II (Đúng / Sai)
                    </div>
                    {[1, 2, 3, 4].map(qNum => (
                      <div key={qNum} style={{ marginBottom: '4px', borderBottom: qNum < 4 ? '1pt dashed #cbd5e1' : 'none', paddingBottom: '3px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '9pt', color: '#0369a1' }}>Câu {qNum}:</div>
                        {['a', 'b', 'c', 'd'].map(sub => (
                          <div key={sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1px 6px', fontSize: '9pt' }}>
                            <span>{sub})</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', border: '1pt solid #000', textAlign: 'center', lineHeight: '15px', fontSize: '8pt', fontWeight: 'bold' }}>Đ</span>
                              <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', border: '1pt solid #000', textAlign: 'center', lineHeight: '15px', fontSize: '8pt', fontWeight: 'bold' }}>S</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* PHẦN III: TRẢ LỜI NGẮN (6 CÂU) */}
                  <div style={{ border: '1pt solid #000', padding: '6px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', textAlign: 'center', borderBottom: '1pt solid #000', paddingBottom: '3px', marginBottom: '4px' }}>
                      PHẦN III (Trả lời ngắn)
                    </div>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px', borderBottom: i < 5 ? '1pt dashed #cbd5e1' : 'none', fontSize: '9pt' }}>
                        <span style={{ fontWeight: 'bold', width: '22px' }}>{i + 1}</span>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          <span style={{ display: 'inline-block', width: '14px', height: '15px', border: '1pt solid #94a3b8', borderRadius: '2px', textAlign: 'center', fontSize: '8pt' }}>-</span>
                          <span style={{ display: 'inline-block', width: '14px', height: '15px', border: '1pt solid #94a3b8', borderRadius: '2px', textAlign: 'center', fontSize: '8pt' }}>,</span>
                          {[...Array(4)].map((_, box) => (
                            <span key={box} style={{ display: 'inline-block', width: '14px', height: '15px', border: '1pt solid #000', borderRadius: '2px', textAlign: 'center', fontSize: '8pt' }}></span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Guide */}
                <div style={{ marginTop: '12px', borderTop: '1pt solid #000', paddingTop: '6px', fontSize: '8.5pt', fontStyle: 'italic', textAlign: 'center' }}>
                  * Hướng dẫn: Dùng bút chì 2B để tô đen kín các ô tròn tương ứng. Không gạch chéo hoặc đánh dấu V. Giữ phiếu phẳng, không làm rách hoặc gấp mép.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CẤU HÌNH KHÓA GEMINI AI CÁ NHÂN (BYOK) */}
      <AiSettingsModal isOpen={showAiSettings} onClose={() => setShowAiSettings(false)} />

      {/* MODAL: BỐC ĐỀ & CHỌN CÂU HỎI TỪ NGÂN HÀNG CÂY THƯ MỤC CỦA TỔ */}
      <BankExamPickerModal
        isOpen={showBankPickerModal}
        onClose={() => setShowBankPickerModal(false)}
        subject={subject}
        grade={grade}
        onInsertQuestions={handleInsertFromBank}
      />

    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  tabBtn: { padding: '12px 18px', background: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};

