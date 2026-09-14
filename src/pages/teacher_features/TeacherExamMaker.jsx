import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, Download, Plus, Trash2, Edit3, Shuffle, FileText, CheckCircle2, HelpCircle, Layers, Printer, RefreshCw, Eye, CheckSquare } from 'lucide-react';

// Pre-built Exam Database for GDPT 2018 (Toán 11 / 12 - Cấu trúc Mới 2025 theo Bộ GD&ĐT)
const INITIAL_QUESTIONS = [
  // PHẦN I: Trắc nghiệm 4 lựa chọn (12 câu chuẩn)
  {
    id: 'q1',
    part: 'part1',
    title: 'Câu 1 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Nhận biết',
    content: 'Cho cấp số cộng (u_n) có số hạng đầu u_1 = 3 và công sai d = 2. Giá trị của u_2 bằng:',
    options: ['5', '6', '1', '-1'],
    correctAnswerIndex: 0, // Option A: 5
    explanation: 'Ta có u_2 = u_1 + d = 3 + 2 = 5.'
  },
  {
    id: 'q2',
    part: 'part1',
    title: 'Câu 2 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Thông hiểu',
    content: 'Cho cấp số nhân (v_n) có v_1 = 2 và công bội q = 3. Số hạng thứ 4 của cấp số nhân là:',
    options: ['54', '162', '18', '24'],
    correctAnswerIndex: 0, // Option A: 54
    explanation: 'Ta có v_4 = v_1 · q^3 = 2 · 3^3 = 2 · 27 = 54.'
  },
  {
    id: 'q3',
    part: 'part1',
    title: 'Câu 3 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Nhận biết',
    content: 'Tập xác định D của hàm số y = log_2(x - 1) là:',
    options: ['D = (1; +∞)', 'D = [1; +∞)', 'D = R \\ {1}', 'D = (0; +∞)'],
    correctAnswerIndex: 0,
    explanation: 'Điều kiện xác định x - 1 > 0 ⇔ x > 1. Vậy D = (1; +∞).'
  },
  {
    id: 'q4',
    part: 'part1',
    title: 'Câu 4 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Nhận biết',
    content: 'Trong không gian Oxyz, tọa độ vectơ u = 2i - 3j + k là:',
    options: ['(2; -3; 1)', '(2; 3; 1)', '(-2; 3; -1)', '(2; -3; 0)'],
    correctAnswerIndex: 0,
    explanation: 'Vectơ u = 2i - 3j + 1k có tọa độ là (2; -3; 1).'
  },

  // PHẦN II: Trắc nghiệm Đúng / Sai (4 ý a, b, c, d)
  {
    id: 'q5',
    part: 'part2',
    title: 'Câu 1 (Phần II - Trắc nghiệm Đúng/Sai)',
    level: 'Thông hiểu',
    content: 'Cho hàm số y = f(x) = x^3 - 3x + 2. Xét tính Đúng/Sai của các mệnh đề sau:',
    subItems: [
      { key: 'a', text: 'Hàm số đã cho đồng biến trên khoảng (1; +∞).', isTrue: true },
      { key: 'b', text: 'Hàm số đã cho có 2 điểm cực trị.', isTrue: true },
      { key: 'c', text: 'Giá trị cực đại của hàm số bằng 0.', isTrue: false },
      { key: 'd', text: 'Đồ thị hàm số cắt trục tung tại điểm có tung độ bằng 2.', isTrue: true }
    ],
    explanation: 'f\'(x) = 3x^2 - 3 = 0 ⇔ x = ±1. f(-1) = 4 (Cực đại), f(1) = 0 (Cực tiểu).'
  },
  {
    id: 'q6',
    part: 'part2',
    title: 'Câu 2 (Phần II - Trắc nghiệm Đúng/Sai)',
    level: 'Vận dụng',
    content: 'Một hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA ⊥ (ABCD) và SA = a√2.',
    subItems: [
      { key: 'a', text: 'Thể tích khối chóp S.ABCD bằng (a^3 √2) / 3.', isTrue: true },
      { key: 'b', text: 'Góc giữa đường thẳng SB và mặt phẳng (ABCD) bằng 45°.', isTrue: false }, // tan = SA/AB = √2 -> arctan(√2)
      { key: 'c', text: 'BD ⊥ SC.', isTrue: true },
      { key: 'd', text: 'Khoảng cách từ A đến mặt phẳng (SBD) bằng (a√2) / 2.', isTrue: false }
    ],
    explanation: 'V = (1/3) S_ABCD · SA = (1/3) a^2 · a√2 = (a^3 √2)/3.'
  },

  // PHẦN III: Trả lời ngắn (Short answer)
  {
    id: 'q7',
    part: 'part3',
    title: 'Câu 1 (Phần III - Trắc nghiệm Trả lời ngắn)',
    level: 'Vận dụng',
    content: 'Một doanh nghiệp sản xuất sản phẩm có hàm chi phí C(x) = 2x^2 + 500x + 5000 (ngàn đồng). Tìm số sản phẩm x để chi phí trung bình C̄(x) đạt giá trị nhỏ nhất.',
    shortAnswer: '50',
    explanation: 'C̄(x) = 2x + 500 + 5000/x ≥ 500 + 2√(2x · 5000/x) = 700. Dấu = xảy ra khi 2x = 5000/x ⇔ x^2 = 2500 ⇔ x = 50.'
  },
  {
    id: 'q8',
    part: 'part3',
    title: 'Câu 2 (Phần III - Trắc nghiệm Trả lời ngắn)',
    level: 'Vận dụng cao',
    content: 'Cho phương trình 4^x - m · 2^(x+1) + 2m = 0. Tìm số các giá trị nguyên của tham số m ∈ [-10; 10] để phương trình có 2 nghiệm phân biệt.',
    shortAnswer: '8',
    explanation: 'Đặt t = 2^x (t > 0). Phương trình trở thành t^2 - 2mt + 2m = 0 có 2 nghiệm t_1 > t_2 > 0. Điều kiện Δ\' > 0, S > 0, P > 0 ⇔ m > 2.'
  }
];

export default function TeacherExamMaker() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);

  // Meta info
  const [examTitle, setExamTitle] = useState('ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 11');
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('Khối 11');
  const [duration, setDuration] = useState('90 phút');
  const [schoolYear, setSchoolYear] = useState('2026 - 2027');

  // Questions & Mixed Exams
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [numberOfCodes, setNumberOfCodes] = useState(4);
  const [mixedExamCodes, setMixedExamCodes] = useState([]);
  const [selectedCodeView, setSelectedCodeView] = useState('101');
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'matrix' | 'preview' | 'keys'

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
  const [newExplanation, setNewExplanation] = useState('');

  // Smart Word / PDF / Text Import States
  const [showImportModal, setShowImportModal] = useState(false);
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

      const questionMatch = line.match(/^(câu|cau|question)\s*(\d+)[\:\.]?\s*(.*)/i);
      if (questionMatch) {
        if (currentQ) parsedQuestions.push(currentQ);
        const qContent = questionMatch[3] || line;
        currentQ = {
          id: `imported-q-${Date.now()}-${parsedQuestions.length}`,
          part: currentPart,
          title: `Câu ${parsedQuestions.length + 1} (${currentPart === 'part1' ? 'Phần I' : currentPart === 'part2' ? 'Phần II' : 'Phần III'})`,
          level: 'Thông hiểu',
          content: qContent,
          options: [],
          correctAnswerIndex: 0,
          subItems: [],
          shortAnswer: '',
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

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    setTeacher(JSON.parse(currentTeacherStr));
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

  // Generator: Đảo Đề Thi theo Chuẩn BGDĐT 2025
  const handleGenerateMixedExams = () => {
    const codes = [];
    const baseCodeNum = 101;

    for (let i = 0; i < numberOfCodes; i++) {
      const codeStr = String(baseCodeNum + i);
      
      const part1Questions = questions.filter(q => q.part === 'part1');
      const part2Questions = questions.filter(q => q.part === 'part2');
      const part3Questions = questions.filter(q => q.part === 'part3');

      // 1. Shuffle Part 1: Questions & Options (with clean A, B, C, D re-indexing)
      const shuffledPart1 = shuffleArray(part1Questions).map(q => {
        const originalOptionsObj = q.options.map((optText, idx) => ({
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
        const shuffledSubs = shuffleArray(q.subItems).map((sub, idx) => ({
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

      codes.push({
        code: codeStr,
        part1: shuffledPart1,
        part2: shuffledPart2,
        part3: shuffledPart3
      });
    }

    setMixedExamCodes(codes);
    setSelectedCodeView(codes[0]?.code || '101');
    setActiveTab('preview');
    alert(`🎉 Đã tráo thành công ${numberOfCodes} mã đề thi chuẩn BGDĐT (${codes.map(c => c.code).join(', ')})!`);
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
      title: newPart === 'part1' ? `Câu ${questions.length + 1} (Phần I - Trắc nghiệm)` : newPart === 'part2' ? `Câu ${questions.length + 1} (Phần II - Đúng/Sai)` : `Câu ${questions.length + 1} (Phần III - Trả lời ngắn)`,
      level: newLevel,
      content: newContent,
      options: newPart === 'part1' ? newOptions : [],
      correctAnswerIndex: newPart === 'part1' ? newCorrectIdx : 0,
      subItems: newPart === 'part2' ? newSubItems : [],
      shortAnswer: newPart === 'part3' ? newShortAnswer : '',
      explanation: newExplanation
    };

    setQuestions([...questions, newQ]);
    setShowAddModal(false);
    setNewContent('');
    setNewExplanation('');
    alert("✅ Đã thêm câu hỏi thành công vào ngân hàng đề!");
  };

  // Delete Question
  const handleDeleteQuestion = (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa câu hỏi này khỏi đề thi?")) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Export File Word (.doc) with Exam Paper & Key Matrix
  const handleExportWordExam = () => {
    const activeCodeObj = mixedExamCodes.find(c => c.code === selectedCodeView) || {
      code: '101',
      part1: questions.filter(q => q.part === 'part1').map(q => ({ ...q, shuffledOptions: q.options, shuffledCorrectIndex: q.correctAnswerIndex })),
      part2: questions.filter(q => q.part === 'part2').map(q => ({ ...q, shuffledSubItems: q.subItems.map((s, i) => ({ ...s, newKey: ['a','b','c','d'][i] })) })),
      part3: questions.filter(q => q.part === 'part3')
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
    a.download = `De_Thi_${subject}_MaDe_${selectedCodeView}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!teacher) return null;

  const activeCodeObj = mixedExamCodes.find(c => c.code === selectedCodeView) || {
    code: '101',
    part1: questions.filter(q => q.part === 'part1').map(q => ({ ...q, shuffledOptions: q.options, shuffledCorrectIndex: q.correctAnswerIndex })),
    part2: questions.filter(q => q.part === 'part2').map(q => ({ ...q, shuffledSubItems: q.subItems.map((s, i) => ({ ...s, newKey: ['a','b','c','d'][i] })) })),
    part3: questions.filter(q => q.part === 'part3')
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1240px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={20} /> Bảng điều khiển Giáo viên
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleGenerateMixedExams} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(217,119,6,0.3)' }}>
            <Shuffle size={18} /> Đảo Mã Đề Thi ({numberOfCodes} Mã)
          </button>

          <button onClick={handleExportWordExam} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(2,132,199,0.3)' }}>
            <Download size={18} /> Xuất Đề File Word (.doc)
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.3)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award color="#f59e0b" size={28} /> Hệ Thống Ra Đề Thi & Tráo Đề GDPT 2018 (Cấu Trúc Mới 2025 BGDĐT)
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Hỗ trợ chuẩn 3 Phần theo Công văn BGDĐT: Trắc nghiệm 4 phương án (Phần I), Đúng/Sai 4 ý (Phần II) & Trả lời ngắn (Phần III) - Tự động tính thang điểm 10.0.
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
          <CheckSquare size={18} /> Bảng Đáp Án Ma Trận Tất Cả Mã Đề
        </button>
      </div>

      {/* TAB 1: QUESTIONS BANK */}
      {activeTab === 'questions' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          
          {/* Exam Header Setting Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <div>
              <label style={styles.label}>Tên Kỳ Thi / Tiêu Đề Đề Thi (*)</label>
              <input type="text" value={examTitle} onChange={e => setExamTitle(e.target.value)} style={{ ...styles.input, fontWeight: 'bold' }} />
            </div>
            <div>
              <label style={styles.label}>Môn Học</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Khối Lớp</label>
              <input type="text" value={grade} onChange={e => setGrade(e.target.value)} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Thời Gian Làm Bài</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 Danh Sách Câu Hỏi Trong Đề ({questions.length} câu)
            </h3>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowImportModal(true)} style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={18} /> Nạp Đề Từ Word / PDF / Copy-Paste
              </button>

              <button onClick={() => setShowAddModal(true)} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={18} /> Thêm Câu Hỏi Mới
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Số lượng mã đề:</span>
                <select value={numberOfCodes} onChange={e => setNumberOfCodes(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                  <option value={2}>2 Mã đề (101, 102)</option>
                  <option value={4}>4 Mã đề (101, 102, 103, 104)</option>
                  <option value={8}>8 Mã đề (101 - 108)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, idx) => (
              <div key={q.id} style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '14.5px' }}>
                    {q.title} <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', marginLeft: '8px' }}>{q.level}</span>
                  </span>
                  
                  <button onClick={() => handleDeleteQuestion(q.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }} title="Xóa câu hỏi">
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Content with clean Math format */}
                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', marginBottom: '10px' }}>
                  {renderCleanMathText(q.content)}
                </div>

                {/* Part 1 options */}
                {q.part === 'part1' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    {q.options.map((opt, i) => (
                      <div key={i} style={{ fontSize: '13.5px', color: i === q.correctAnswerIndex ? '#16a34a' : '#334155', fontWeight: i === q.correctAnswerIndex ? 'bold' : 'normal', background: i === q.correctAnswerIndex ? '#f0fdf4' : '#fff', padding: '6px 12px', borderRadius: '6px', border: i === q.correctAnswerIndex ? '1px solid #86efac' : '1px solid #e2e8f0' }}>
                        {['A.', 'B.', 'C.', 'D.'][i]} {renderCleanMathText(opt)} {i === q.correctAnswerIndex && ' ✅ (Đáp án đúng)'}
                      </div>
                    ))}
                  </div>
                )}

                {/* Part 2 True/False */}
                {q.part === 'part2' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {q.subItems.map(sub => (
                      <div key={sub.key} style={{ fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>{sub.key})</strong> {renderCleanMathText(sub.text)}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: sub.isTrue ? '#dcfce7' : '#fee2e2', color: sub.isTrue ? '#15803d' : '#b91c1c' }}>
                          [{sub.isTrue ? 'ĐÚNG' : 'SAI'}]
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Part 3 Short answer */}
                {q.part === 'part3' && (
                  <div style={{ fontSize: '13.5px', color: '#0284c7', fontWeight: 'bold', marginBottom: '10px', background: '#e0f2fe', padding: '8px 12px', borderRadius: '6px', display: 'inline-block' }}>
                    👉 Đáp số ghi phiếu: <span style={{ color: '#16a34a', fontSize: '15px' }}>{q.shortAnswer}</span>
                  </div>
                )}

                {q.explanation && (
                  <div style={{ fontSize: '12.5px', color: '#475569', fontStyle: 'italic', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', marginTop: '6px' }}>
                    💡 <strong>Lời giải chi tiết:</strong> {renderCleanMathText(q.explanation)}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: EXAM MATRIX (CV 3175) */}
      {activeTab === 'matrix' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Ma Trận Đề Thi Môn {subject} Theo Chuẩn Công Văn 3175/BGDĐT & GDPT 2018 (Thang Điểm 10.0)
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Mức Độ Tư Duy</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Phần I (Trắc nghiệm 4 op)</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Phần II (Đúng/Sai 4 ý)</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Phần III (Trả lời ngắn)</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Tổng Điểm Chuẩn</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>1. Nhận biết (40%)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>4 câu (1.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>1 câu (1.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>2 câu (1.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>4.0 điểm (40%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>2. Thông hiểu (30%)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>4 câu (1.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>1 câu (1.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>2 câu (1.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>3.0 điểm (30%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>3. Vận dụng (20%)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>2 câu (0.5đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>1 câu (1.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>1 câu (0.5đ)</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>2.0 điểm (20%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>4. Vận dụng cao (10%)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>2 câu (0.5đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>1 câu (1.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>1 câu (0.5đ)</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>1.0 điểm (10%)</td>
              </tr>
              <tr style={{ background: '#f0fdf4', fontWeight: 'bold' }}>
                <td style={{ padding: '12px' }}>TỔNG CỘNG (100%)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>12 câu (3.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>4 câu (4.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>6 câu (3.0đ)</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '15px', color: '#15803d' }}>10.0 ĐIỂM (100%)</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.6' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>📌 Quy tắc tính điểm Phần II (Trắc nghiệm Đúng/Sai) theo Công văn BGDĐT:</h4>
            <ul>
              <li>Thí sinh chọn <strong>đúng 1 ý</strong> trong 1 câu được <strong>0,10 điểm</strong>.</li>
              <li>Thí sinh chọn <strong>đúng 2 ý</strong> trong 1 câu được <strong>0,25 điểm</strong>.</li>
              <li>Thí sinh chọn <strong>đúng 3 ý</strong> trong 1 câu được <strong>0,50 điểm</strong>.</li>
              <li>Thí sinh chọn <strong>đúng 4 ý</strong> trong 1 câu được <strong>1,00 điểm</strong>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: PREVIEW EXAM PAPER */}
      {activeTab === 'preview' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Chọn Mã Đề Thi Để Xem Bản In:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(mixedExamCodes.length > 0 ? mixedExamCodes : [{ code: '101' }]).map(c => (
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

            <button onClick={handleExportWordExam} style={{ padding: '8px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={16} /> Tải File Word Mã Đề {selectedCodeView} (.doc)
            </button>
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
                  <div key={q.id || idx} style={{ marginBottom: '12px' }}>
                    <div><strong>Câu {idx + 1}:</strong> {renderCleanMathText(q.content)}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: '4px', marginLeft: '15px' }}>
                      {opts.map((opt, i) => (
                        <span key={i}><strong>{['A.', 'B.', 'C.', 'D.'][i]}</strong> {renderCleanMathText(opt)}</span>
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
                  <div key={q.id || idx} style={{ marginBottom: '12px' }}>
                    <div><strong>Câu {idx + 1}:</strong> {renderCleanMathText(q.content)}</div>
                    <div style={{ marginLeft: '15px', marginTop: '4px' }}>
                      {subs.map((sub, i) => (
                        <div key={i}><strong>{['a)', 'b)', 'c)', 'd)'][i]}</strong> {renderCleanMathText(sub.text)}</div>
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
                <div key={q.id || idx} style={{ marginBottom: '12px' }}>
                  <div><strong>Câu {idx + 1}:</strong> {renderCleanMathText(q.content)}</div>
                </div>
              ))}

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
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 Bảng Đáp Án Ma Trận Tất Cả Mã Đề Thi ({mixedExamCodes.length || 1} Mã Đề)
          </h3>

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

              <div>
                <strong style={{ fontSize: '13px', color: '#334155' }}>PHẦN III. TRẢ LỜI NGẮN:</strong>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {codeObj.part3.map((q, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                      C{i + 1}: <strong style={{ color: '#0284c7' }}>{q.shortAnswer}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                <label style={styles.label}>Nội dung câu hỏi (*)</label>
                <textarea rows={3} value={newContent} onChange={e => setNewContent(e.target.value)} style={{ ...styles.input, resize: 'vertical' }} placeholder="Nhập nội dung câu hỏi (hỗ trợ nhập công thức u_1 = 3, d = 2)..." required />
              </div>

              {/* Part 1 input */}
              {newPart === 'part1' && (
                <div>
                  <label style={styles.label}>Các phương án lựa chọn & Chọn đáp án đúng:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="radio" name="correctOpt" checked={newCorrectIdx === idx} onChange={() => setNewCorrectIdx(idx)} />
                        <span style={{ fontWeight: 'bold', width: '20px' }}>{label}.</span>
                        <input type="text" value={newOptions[idx]} onChange={e => {
                          const opts = [...newOptions];
                          opts[idx] = e.target.value;
                          setNewOptions(opts);
                        }} style={styles.input} placeholder={`Phương án ${label}`} required />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 2 input */}
              {newPart === 'part2' && (
                <div>
                  <label style={styles.label}>Các mệnh đề Đúng / Sai:</label>
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

              <div>
                <label style={styles.label}>Lời giải chi tiết (Hướng dẫn chấm)</label>
                <textarea rows={2} value={newExplanation} onChange={e => setNewExplanation(e.target.value)} style={{ ...styles.input, resize: 'vertical' }} placeholder="Nhập hướng dẫn giải chi tiết cho câu hỏi..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Thêm Vào Đề Thi</button>
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
              <label style={styles.label}>Cách 2: Hoặc Dán (Paste) Trực Tiếp Nội Dung Đề Thi Từ Word / PDF Vào Đây:</label>
              <textarea 
                rows={10} 
                value={importRawText} 
                onChange={e => {
                  setImportRawText(e.target.value);
                  setParsedPreviewQuestions(parseRawExamText(e.target.value));
                }} 
                style={{ ...styles.input, fontFamily: 'monospace', fontSize: '12.5px', resize: 'vertical' }} 
                placeholder="Dán nội dung đề thi từ Word/PDF tại đây... System sẽ tự động bóc tách thành các câu hỏi!"
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

    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  tabBtn: { padding: '12px 18px', background: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};

