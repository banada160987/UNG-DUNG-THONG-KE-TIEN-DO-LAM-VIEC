import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, Download, Plus, Trash2, Edit3, Shuffle, FileText, CheckCircle2, HelpCircle, Layers, Printer, RefreshCw } from 'lucide-react';

// Sample pre-built Exam Database for GDPT 2018 (Toán 11 / 12 - 2025 Structure)
const SAMPLE_QUESTIONS = [
  // Phần I: Trắc nghiệm 4 lựa chọn
  {
    id: 'q1',
    part: 'part1', // Part I: 4 options
    title: 'Câu 1 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Nhận biết',
    content: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 3$ và công sai $d = 2$. Giá trị của $u_2$ bằng:',
    options: ['A. 5', 'B. 6', 'C. 1', 'D. -1'],
    correctAnswer: 'A. 5',
    explanation: 'Ta có $u_2 = u_1 + d = 3 + 2 = 5$.'
  },
  {
    id: 'q2',
    part: 'part1',
    title: 'Câu 2 (Phần I - Trắc nghiệm 4 phương án)',
    level: 'Thông hiểu',
    content: 'Cho cấp số nhân $(v_n)$ có $v_1 = 2$ và công bội $q = 3$. Số hạng thứ 4 của cấp số nhân là:',
    options: ['A. 54', 'B. 162', 'C. 18', 'D. 24'],
    correctAnswer: 'A. 54',
    explanation: 'Ta có $v_4 = v_1 \\cdot q^3 = 2 \\cdot 3^3 = 2 \\cdot 27 = 54$.'
  },
  // Phần II: Đúng / Sai
  {
    id: 'q3',
    part: 'part2', // Part II: True/False (4 sub-items)
    title: 'Câu 3 (Phần II - Trắc nghiệm Đúng/Sai 4 ý)',
    level: 'Thông hiểu',
    content: 'Cho hàm số $y = f(x) = x^3 - 3x + 2$. Xét tính Đúng/Sai của các mệnh đề sau:',
    subItems: [
      { key: 'a', text: 'Hàm số đã cho đồng biến trên khoảng $(1; +\\infty)$.', isTrue: true },
      { key: 'b', text: 'Hàm số đã cho có 2 điểm cực trị.', isTrue: true },
      { key: 'c', text: 'Giá trị cực đại của hàm số bằng 0.', isTrue: false }, // f(1)=0 (cực tiểu), f(-1)=4 (cực đại)
      { key: 'd', text: 'Đồ thị hàm số cắt trục tung tại điểm có tung độ bằng 2.', isTrue: true }
    ],
    explanation: '$f\'(x) = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. $f(-1) = 4$ (Cực đại), $f(1) = 0$ (Cực tiểu).'
  },
  // Phần III: Trả lời ngắn
  {
    id: 'q4',
    part: 'part3', // Part III: Short answer
    title: 'Câu 4 (Phần III - Trắc nghiệm Trả lời ngắn)',
    level: 'Vận dụng',
    content: 'Một doanh nghiệp sản xuất sản phẩm có hàm chi phí $C(x) = 2x^2 + 500x + 5000$ (ngàn đồng). Tìm số sản phẩm $x$ để chi phí trung bình $\\bar{C}(x)$ đạt giá trị nhỏ nhất.',
    shortAnswer: '50',
    explanation: '$\\bar{C}(x) = 2x + 500 + \\frac{5000}{x} \\ge 500 + 2\\sqrt{2x \\cdot \\frac{5000}{x}} = 500 + 200 = 700$. Dấu = khi $2x = 5000/x \\Rightarrow x^2 = 2500 \\Rightarrow x = 50$.'
  }
];

export default function TeacherExamMaker() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);

  // Exam Meta Info
  const [examTitle, setExamTitle] = useState('ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 11');
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('Khối 11');
  const [duration, setDuration] = useState('90 phút');
  const [schoolYear, setSchoolYear] = useState('2026 - 2027');

  // Question List & Mix States
  const [questions, setQuestions] = useState(SAMPLE_QUESTIONS);
  const [numberOfCodes, setNumberOfCodes] = useState(4); // 4 test codes (101, 102, 103, 104)
  const [mixedExamCodes, setMixedExamCodes] = useState([]);
  const [selectedCodeView, setSelectedCodeView] = useState('101');
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'matrix' | 'mixer' | 'preview'

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    setTeacher(JSON.parse(currentTeacherStr));
  }, [navigate]);

  // Mix Exam Algorithm (Đáo đề chuẩn Bộ GD&ĐT)
  const handleGenerateMixedExams = () => {
    const codes = [];
    const baseCodeNum = 101;

    for (let i = 0; i < numberOfCodes; i++) {
      const codeStr = String(baseCodeNum + i);
      
      // Separate questions by part
      const part1 = questions.filter(q => q.part === 'part1');
      const part2 = questions.filter(q => q.part === 'part2');
      const part3 = questions.filter(q => q.part === 'part3');
      const part4 = questions.filter(q => q.part === 'part4');

      // Shuffle Part 1 questions and options
      const shuffledPart1 = shuffleArray([...part1]).map(q => {
        const shuffledOptions = shuffleArray([...(q.options || [])]);
        return { ...q, options: shuffledOptions };
      });

      // Shuffle Part 2 questions and sub-items
      const shuffledPart2 = shuffleArray([...part2]).map(q => {
        const shuffledSubItems = shuffleArray([...(q.subItems || [])]);
        return { ...q, subItems: shuffledSubItems };
      });

      // Shuffle Part 3 questions
      const shuffledPart3 = shuffleArray([...part3]);

      codes.push({
        code: codeStr,
        part1: shuffledPart1,
        part2: shuffledPart2,
        part3: shuffledPart3,
        part4: part4
      });
    }

    setMixedExamCodes(codes);
    setSelectedCodeView(codes[0]?.code || '101');
    setActiveTab('preview');
    alert(`🎉 Đã tạo thành công ${numberOfCodes} mã đề thi khác nhau (${codes.map(c => c.code).join(', ')})!`);
  };

  // Helper shuffle function (Fisher-Yates)
  const shuffleArray = (arr) => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleExportWordExam = () => {
    const examElement = document.getElementById('exam-paper-preview-content');
    if (!examElement) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${examTitle} - Mã đề ${selectedCodeView}</title>
        <style>
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 2.0cm 2.0cm 2.0cm; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; mso-paper-source: 0; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.3; color: #000000; }
          h1, h2, h3 { font-family: 'Times New Roman', serif; text-align: center; }
          h1 { font-size: 14pt; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
          h2 { font-size: 13pt; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          th, td { border: 1pt solid black; padding: 5px; font-size: 11pt; }
          .header-table { width: 100%; border: none !important; margin-bottom: 15px; }
          .header-table td { border: none !important; padding: 0; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${examElement.innerHTML}
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

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
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
          <Award color="#f59e0b" size={28} /> Hệ Thống Ra Đề Thi & Tráo Đề GDPT 2018 (Cấu Trúc Mới 2025)
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Hỗ trợ chuẩn 4 dạng câu hỏi (Trắc nghiệm 4 option, Đúng/Sai 4 ý, Trả lời ngắn, Tự luận) & Xuất ma trận Công văn 3175/BGDĐT.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        <button onClick={() => setActiveTab('questions')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'questions' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'questions' ? '#0284c7' : '#64748b' }}>
          <FileText size={18} /> Ngân Hàng Câu Hỏi ({questions.length})
        </button>
        <button onClick={() => setActiveTab('matrix')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'matrix' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'matrix' ? '#0284c7' : '#64748b' }}>
          <Layers size={18} /> Ma Trận & Bảng Đặc Tả (CV 3175)
        </button>
        <button onClick={() => setActiveTab('preview')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'preview' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'preview' ? '#0284c7' : '#64748b' }}>
          <Printer size={18} /> Xem Trước Đề Thi Đã Đảo (Mã đề: {selectedCodeView})
        </button>
      </div>

      {/* TAB 1: QUESTIONS BANK */}
      {activeTab === 'questions' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          
          {/* Exam Header Setting Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={styles.label}>Tên Kỳ Thi / Tiêu Đề Đề Thi (*)</label>
              <input type="text" value={examTitle} onChange={e => setExamTitle(e.target.value)} style={{ ...styles.input, fontWeight: 'bold' }} />
            </div>
            <div>
              <label style={styles.label}>Môn Học</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Thời Gian Làm Bài</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>📋 Danh Sách Câu Hỏi Trong Đề</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Số lượng mã đề muốn sinh:</span>
              <select value={numberOfCodes} onChange={e => setNumberOfCodes(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                <option value={2}>2 Mã đề (101, 102)</option>
                <option value={4}>4 Mã đề (101, 102, 103, 104)</option>
                <option value={8}>8 Mã đề (101 - 108)</option>
              </select>
            </div>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, idx) => (
              <div key={q.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '14px' }}>
                    {q.title} <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', marginLeft: '8px' }}>{q.level}</span>
                  </span>
                </div>

                <div style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}>{q.content}</div>

                {/* Part 1 options */}
                {q.part === 'part1' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    {q.options.map(opt => (
                      <div key={opt} style={{ fontSize: '13px', color: opt === q.correctAnswer ? '#16a34a' : '#334155', fontWeight: opt === q.correctAnswer ? 'bold' : 'normal' }}>
                        {opt} {opt === q.correctAnswer && '✅ (Đáp án đúng)'}
                      </div>
                    ))}
                  </div>
                )}

                {/* Part 2 True/False */}
                {q.part === 'part2' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {q.subItems.map(sub => (
                      <div key={sub.key} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>a) {sub.text}</span>
                        <span style={{ fontWeight: 'bold', color: sub.isTrue ? '#16a34a' : '#ef4444' }}>
                          [{sub.isTrue ? 'ĐÚNG' : 'SAI'}]
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Part 3 Short answer */}
                {q.part === 'part3' && (
                  <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 'bold', marginBottom: '8px' }}>
                    👉 Đáp số trả lời ngắn: {q.shortAnswer}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>💡 Lời giải chi tiết: {q.explanation}</div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: EXAM MATRIX (CV 3175) */}
      {activeTab === 'matrix' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>📊 Ma Trận Đề Thi Theo Chuẩn Công Văn 3175/BGDĐT</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Mức Độ Tư Duy</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Phần I (Trắc nghiệm)</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Phần II (Đúng/Sai)</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Phần III (Trả lời ngắn)</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Tổng Điểm Dự Kiến</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>1. Nhận biết (40%)</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>1 câu (0.25đ)</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>0 câu</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>0 câu</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>4.0 điểm</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>2. Thông hiểu (30%)</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>1 câu (0.25đ)</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>1 câu (1.0đ)</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>0 câu</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>3.0 điểm</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>3. Vận dụng (20%)</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>0 câu</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>0 câu</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>1 câu (0.5đ)</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>2.0 điểm</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>4. Vận dụng cao (10%)</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>0 câu</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>0 câu</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>0 câu</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>1.0 điểm</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PREVIEW & PRINT READY EXAM PAPER */}
      {activeTab === 'preview' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Chọn Mã Đề Để Xem:</span>
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
              <Download size={16} /> Tải Mã Đề {selectedCodeView} (.doc)
            </button>
          </div>

          {/* Printable Exam Paper Document */}
          <div style={{ border: '1px solid #cbd5e1', padding: '24px', background: '#f8fafc', borderRadius: '8px', maxHeight: '600px', overflowY: 'auto' }}>
            <div id="exam-paper-preview-content" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.4', color: '#000000', backgroundColor: '#ffffff', padding: '30px' }}>
              
              {/* Header Box */}
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

              <div style={{ border: '1px solid #000', padding: '6px 12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                <div>Họ và tên học sinh: ............................................................................</div>
                <div style={{ fontWeight: 'bold' }}>MÃ ĐỀ THI: {selectedCodeView}</div>
              </div>

              {/* PHẦN I */}
              <div style={{ fontWeight: 'bold', fontSize: '12pt', marginTop: '15px', marginBottom: '6px' }}>
                PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (Thí sinh trả lời từ câu 1 đến câu 12. Mỗi câu chọn 1 phương án).
              </div>
              {questions.filter(q => q.part === 'part1').map((q, idx) => (
                <div key={q.id} style={{ marginBottom: '10px' }}>
                  <div><strong>Câu {idx + 1}:</strong> {q.content}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: '4px', marginLeft: '15px' }}>
                    {q.options.map(opt => <span key={opt}>{opt}</span>)}
                  </div>
                </div>
              ))}

              {/* PHẦN II */}
              <div style={{ fontWeight: 'bold', fontSize: '12pt', marginTop: '20px', marginBottom: '6px' }}>
                PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG / SAI (Thí sinh trả lời từ câu 1 đến câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai).
              </div>
              {questions.filter(q => q.part === 'part2').map((q, idx) => (
                <div key={q.id} style={{ marginBottom: '10px' }}>
                  <div><strong>Câu {idx + 1}:</strong> {q.content}</div>
                  <div style={{ marginLeft: '15px', marginTop: '4px' }}>
                    {q.subItems.map(sub => (
                      <div key={sub.key}>a) {sub.text}</div>
                    ))}
                  </div>
                </div>
              ))}

              {/* PHẦN III */}
              <div style={{ fontWeight: 'bold', fontSize: '12pt', marginTop: '20px', marginBottom: '6px' }}>
                PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (Thí sinh trả lời từ câu 1 đến câu 6. Điền kết quả vào phiếu trả lời).
              </div>
              {questions.filter(q => q.part === 'part3').map((q, idx) => (
                <div key={q.id} style={{ marginBottom: '10px' }}>
                  <div><strong>Câu {idx + 1}:</strong> {q.content}</div>
                </div>
              ))}

              <div style={{ textAlign: 'center', marginTop: '30px', fontWeight: 'bold' }}>
                ------------------ HẾT ------------------
              </div>

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
