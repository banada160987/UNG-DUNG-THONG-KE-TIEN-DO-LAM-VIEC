/**
 * DỊCH VỤ QUẢN LÝ NGÂN HÀNG CÂU HỎI THEO CẤU TRÚC CÂY THƯ MỤC CHƯƠNG - BÀI
 * Phục vụ các Tổ Chuyên môn Trường THPT Cao Bá Quát - GDPT 2018 (2025 - 2028)
 * 
 * Cấu trúc phân cấp 4 tầng:
 * 1. Môn học & Khối lớp
 * 2. Chương / Chủ đề lớn
 * 3. Bài học / Đơn vị kiến thức
 * 4. Mức độ nhận thức (NB, TH, VD, VDC) & Hình thức thi (Phần I, II, III)
 */

import { DualSupabaseService } from '../lib/supabase';

const STORAGE_KEY_TREE = 'cbq_question_bank_tree_v1';
const STORAGE_KEY_QUESTIONS = 'cbq_question_bank_items_v1';

// CÂY THƯ MỤC MẪU CHUẨN GDPT 2018 CHO CÁC MÔN HỌC BẬC THPT
export const DEFAULT_TAXONOMY_TREE = [
  // 1. MÔN TOÁN HỌC - KHỐI 12
  {
    id: 'math_12',
    subject: 'Toán',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'math_12_c1',
        title: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        lessons: [
          { id: 'math_12_c1_l1', title: 'Bài 1: Tính đơn điệu và cực trị của hàm số' },
          { id: 'math_12_c1_l2', title: 'Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số' },
          { id: 'math_12_c1_l3', title: 'Bài 3: Đường tiệm cận của đồ thị hàm số' },
          { id: 'math_12_c1_l4', title: 'Bài 4: Khảo sát sự biến thiên và vẽ đồ thị hàm số' }
        ]
      },
      {
        id: 'math_12_c2',
        title: 'Chương II: Tọa độ của vectơ trong không gian',
        lessons: [
          { id: 'math_12_c2_l1', title: 'Bài 1: Vectơ và các phép toán trong không gian' },
          { id: 'math_12_c2_l2', title: 'Bài 2: Tọa độ của vectơ trong không gian Oxyz' },
          { id: 'math_12_c2_l3', title: 'Bài 3: Biểu thức tọa độ của các phép toán vectơ' }
        ]
      },
      {
        id: 'math_12_c3',
        title: 'Chương III: Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm',
        lessons: [
          { id: 'math_12_c3_l1', title: 'Bài 1: Khoảng biến thiên và khoảng tứ phân vị' },
          { id: 'math_12_c3_l2', title: 'Bài 2: Phương sai và độ lệch chuẩn' }
        ]
      },
      {
        id: 'math_12_c4',
        title: 'Chương IV: Nguyên hàm, tích phân và ứng dụng',
        lessons: [
          { id: 'math_12_c4_l1', title: 'Bài 1: Khái niệm nguyên hàm và tính chất' },
          { id: 'math_12_c4_l2', title: 'Bài 2: Tích phân và ứng dụng hình học tính diện tích, thể tích' }
        ]
      },
      {
        id: 'math_12_c5',
        title: 'Chương V: Phương pháp tọa độ trong không gian (Mặt phẳng, Đường thẳng, Mặt cầu)',
        lessons: [
          { id: 'math_12_c5_l1', title: 'Bài 1: Phương trình mặt phẳng' },
          { id: 'math_12_c5_l2', title: 'Bài 2: Phương trình đường thẳng trong không gian' },
          { id: 'math_12_c5_l3', title: 'Bài 3: Phương trình mặt cầu' }
        ]
      },
      {
        id: 'math_12_c6',
        title: 'Chương VI: Xác suất có điều kiện và công thức xác suất toàn phần',
        lessons: [
          { id: 'math_12_c6_l1', title: 'Bài 1: Xác suất có điều kiện' },
          { id: 'math_12_c6_l2', title: 'Bài 2: Công thức xác suất toàn phần và công thức Bayes' }
        ]
      }
    ]
  },

  // 2. MÔN TOÁN HỌC - KHỐI 11
  {
    id: 'math_11',
    subject: 'Toán',
    grade: 'Khối 11',
    chapters: [
      {
        id: 'math_11_c1',
        title: 'Chương I: Hàm số lượng giác và phương trình lượng giác',
        lessons: [
          { id: 'math_11_c1_l1', title: 'Bài 1: Góc lượng giác và giá trị lượng giác của góc lượng giác' },
          { id: 'math_11_c1_l2', title: 'Bài 2: Các công thức lượng giác' },
          { id: 'math_11_c1_l3', title: 'Bài 3: Hàm số lượng giác và đồ thị' },
          { id: 'math_11_c1_l4', title: 'Bài 4: Phương trình lượng giác cơ bản' }
        ]
      },
      {
        id: 'math_11_c2',
        title: 'Chương II: Dãy số, Cấp số cộng và Cấp số nhân',
        lessons: [
          { id: 'math_11_c2_l1', title: 'Bài 1: Dãy số và số hạng tổng quát' },
          { id: 'math_11_c2_l2', title: 'Bài 2: Cấp số cộng và công sai' },
          { id: 'math_11_c2_l3', title: 'Bài 3: Cấp số nhân và công bội' }
        ]
      },
      {
        id: 'math_11_c3',
        title: 'Chương III: Giới hạn và Hàm số liên tục',
        lessons: [
          { id: 'math_11_c3_l1', title: 'Bài 1: Giới hạn của dãy số' },
          { id: 'math_11_c3_l2', title: 'Bài 2: Giới hạn của hàm số' },
          { id: 'math_11_c3_l3', title: 'Bài 3: Hàm số liên tục' }
        ]
      },
      {
        id: 'math_11_c4',
        title: 'Chương IV: Đường thẳng và mặt phẳng trong không gian. Quan hệ song song',
        lessons: [
          { id: 'math_11_c4_l1', title: 'Bài 1: Điểm, đường thẳng và mặt phẳng trong không gian' },
          { id: 'math_11_c4_l2', title: 'Bài 2: Hai đường thẳng song song' },
          { id: 'math_11_c4_l3', title: 'Bài 3: Đường thẳng và mặt phẳng song song' },
          { id: 'math_11_c4_l4', title: 'Bài 4: Hai mặt phẳng song song' }
        ]
      }
    ]
  },

  // 3. MÔN VẬT LÍ - KHỐI 12
  {
    id: 'physics_12',
    subject: 'Vật lí',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'phy_12_c1',
        title: 'Chương I: Vật lí nhiệt',
        lessons: [
          { id: 'phy_12_c1_l1', title: 'Bài 1: Cấu trúc của chất và sự chuyển thể' },
          { id: 'phy_12_c1_l2', title: 'Bài 2: Nội năng và định luật I của nhiệt động lực học' },
          { id: 'phy_12_c1_l3', title: 'Bài 3: Nhiệt dung riêng và nhiệt nóng chảy riêng' },
          { id: 'phy_12_c1_l4', title: 'Bài 4: Nhiệt hóa hơi riêng' }
        ]
      },
      {
        id: 'phy_12_c2',
        title: 'Chương II: Khí lí tưởng',
        lessons: [
          { id: 'phy_12_c2_l1', title: 'Bài 1: Mô hình động học phân tử chất khí' },
          { id: 'phy_12_c2_l2', title: 'Bài 2: Định luật Boyle và định luật Charles' },
          { id: 'phy_12_c2_l3', title: 'Bài 3: Phương trình trạng thái của khí lí tưởng' }
        ]
      },
      {
        id: 'phy_12_c3',
        title: 'Chương III: Từ trường',
        lessons: [
          { id: 'phy_12_c3_l1', title: 'Bài 1: Từ trường và cảm ứng từ' },
          { id: 'phy_12_c3_l2', title: 'Bài 2: Lực từ tác dụng lên đoạn dây dẫn mang dòng điện' },
          { id: 'phy_12_c3_l3', title: 'Bài 3: Hiện tượng cảm ứng điện từ và định luật Faraday' }
        ]
      },
      {
        id: 'phy_12_c4',
        title: 'Chương IV: Vật lí hạt nhân',
        lessons: [
          { id: 'phy_12_c4_l1', title: 'Bài 1: Cấu tạo hạt nhân và năng lượng liên kết' },
          { id: 'phy_12_c4_l2', title: 'Bài 2: Hiện tượng phóng xạ và an toàn phóng xạ' },
          { id: 'phy_12_c4_l3', title: 'Bài 3: Phản ứng phân hạch và phản ứng nhiệt hạch' }
        ]
      }
    ]
  },

  // 4. MÔN HÓA HỌC - KHỐI 12
  {
    id: 'chemistry_12',
    subject: 'Hóa học',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'chem_12_c1',
        title: 'Chương I: Ester - Lipid',
        lessons: [
          { id: 'chem_12_c1_l1', title: 'Bài 1: Ester và phản ứng xà phòng hóa' },
          { id: 'chem_12_c1_l2', title: 'Bài 2: Lipid, chất béo và acid béo Omega' },
          { id: 'chem_12_c1_l3', title: 'Bài 3: Xà phòng và chất giặt rửa tổng hợp' }
        ]
      },
      {
        id: 'chem_12_c2',
        title: 'Chương II: Carbohydrate',
        lessons: [
          { id: 'chem_12_c2_l1', title: 'Bài 1: Glucose và Fructose' },
          { id: 'chem_12_c2_l2', title: 'Bài 2: Saccharose và Maltose' },
          { id: 'chem_12_c2_l3', title: 'Bài 3: Tinh bột và Cellulose' }
        ]
      },
      {
        id: 'chem_12_c3',
        title: 'Chương III: Hợp chất chứa Nitrogen (Amine - Amino acid - Peptide - Protein)',
        lessons: [
          { id: 'chem_12_c3_l1', title: 'Bài 1: Amine và tính base' },
          { id: 'chem_12_c3_l2', title: 'Bài 2: Amino acid và điểm đẳng điện' },
          { id: 'chem_12_c3_l3', title: 'Bài 3: Peptide, protein và enzyme' }
        ]
      },
      {
        id: 'chem_12_c4',
        title: 'Chương IV: Pin điện và điện phân',
        lessons: [
          { id: 'chem_12_c4_l1', title: 'Bài 1: Thế điện cực chuẩn và pin Galvani' },
          { id: 'chem_12_c4_l2', title: 'Bài 2: Điện phân dung dịch và định luật Faraday' }
        ]
      }
    ]
  },

  // 5. MÔN TIẾNG ANH - KHỐI 12
  {
    id: 'english_12',
    subject: 'Tiếng Anh',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'eng_12_c1',
        title: 'Unit 1 - Unit 3: Life Stories & Cultural Diversity',
        lessons: [
          { id: 'eng_12_c1_l1', title: 'Lesson 1: Phonetics (Word stress & Pronunciation)' },
          { id: 'eng_12_c1_l2', title: 'Lesson 2: Vocabulary & Collocations' },
          { id: 'eng_12_c1_l3', title: 'Lesson 3: Grammar (Past Tenses & Articles)' }
        ]
      },
      {
        id: 'eng_12_c2',
        title: 'Unit 4 - Unit 6: Urbanisation & The World of Work',
        lessons: [
          { id: 'eng_12_c2_l1', title: 'Lesson 1: Reading Comprehension (Skimming & Scanning)' },
          { id: 'eng_12_c2_l2', title: 'Lesson 2: Conditional Sentences & Inversion' },
          { id: 'eng_12_c2_l3', title: 'Lesson 3: Sentence Transformation & Error Detection' }
        ]
      }
    ]
  },

  // 6. MÔN NGỮ VĂN - KHỐI 12
  {
    id: 'lit_12',
    subject: 'Ngữ văn',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'lit_12_c1',
        title: 'Chủ đề 1: Đọc hiểu văn bản văn học (Truyện ngắn và Tiểu thuyết hiện đại)',
        lessons: [
          { id: 'lit_12_c1_l1', title: 'Bài 1: Phong cách ngôn ngữ và biện pháp tu từ trong tác phẩm' },
          { id: 'lit_12_c1_l2', title: 'Bài 2: Phân tích tâm lý nhân vật và thông điệp tư tưởng' }
        ]
      },
      {
        id: 'lit_12_c2',
        title: 'Chủ đề 2: Đọc hiểu văn bản thông tin và văn bản nghị luận thời sự',
        lessons: [
          { id: 'lit_12_c2_l1', title: 'Bài 1: Nhận biết luận điểm, luận cứ và cách lập luận' },
          { id: 'lit_12_c2_l2', title: 'Bài 2: Đánh giá quan điểm của tác giả và rút ra bài học' }
        ]
      },
      {
        id: 'lit_12_c3',
        title: 'Chủ đề 3: Kỹ năng viết nghị luận xã hội và nghị luận văn học',
        lessons: [
          { id: 'lit_12_c3_l1', title: 'Bài 1: Viết đoạn văn nghị luận xã hội (khoảng 200 chữ)' },
          { id: 'lit_12_c3_l2', title: 'Bài 2: Viết bài văn nghị luận so sánh, đánh giá tác phẩm' }
        ]
      }
    ]
  }
];

// BỘ CÂU HỎI MẪU ĐƯỢC PHÂN THEO BÀI HỌC VÀ MỨC ĐỘ NHẬN THỨC
export const INITIAL_BANK_QUESTIONS = [
  // --- MÔN TOÁN: Bài math_12_c1_l1 (Tính đơn điệu và cực trị) ---
  {
    id: 'bank_m12_01',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c1',
    lessonId: 'math_12_c1_l1',
    level: 'Nhận biết',
    part: 'part1',
    content: 'Cho hàm số $y = f(x)$ có bảng xét dấu của đạo hàm $f\'(x)$ như sau. Hàm số đã cho đồng biến trên khoảng nào dưới đây?',
    options: ['$(1; 3)$', '$(-\\infty; 1)$', '$(3; +\\infty)$', '$(-\\infty; 3)$'],
    correctAnswerIndex: 0,
    explanation: 'Dựa vào bảng xét dấu, $f\'(x) > 0$ trên khoảng $(1; 3)$, do đó hàm số đồng biến trên $(1; 3)$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bank_m12_02',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c1',
    lessonId: 'math_12_c1_l1',
    level: 'Thông hiểu',
    part: 'part1',
    content: 'Điểm cực đại của đồ thị hàm số $y = x^3 - 3x^2 + 2$ là:',
    options: ['$(0; 2)$', '$(2; -2)$', '$(0; 0)$', '$(2; 2)$'],
    correctAnswerIndex: 0,
    explanation: 'Ta có $y\' = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Với $x = 0 \\Rightarrow y = 2$ (cực đại). Vậy tọa độ điểm cực đại là $(0; 2)$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bank_m12_03',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c1',
    lessonId: 'math_12_c1_l1',
    level: 'Thông hiểu',
    part: 'part2',
    content: 'Cho hàm số $y = f(x) = \\frac{2x - 1}{x + 1}$. Xét tính Đúng / Sai của các mệnh đề sau:',
    subItems: [
      { key: 'a', text: 'Tập xác định của hàm số là $D = \\mathbb{R} \\setminus \\{-1\\}$.', isTrue: true },
      { key: 'b', text: 'Đạo hàm của hàm số là $y\' = \\frac{3}{(x + 1)^2} > 0, \\forall x \\neq -1$.', isTrue: true },
      { key: 'c', text: 'Hàm số đồng biến trên $\\mathbb{R} \\setminus \\{-1\\}$.', isTrue: false },
      { key: 'd', text: 'Đồ thị hàm số có tiệm cận đứng là $x = -1$.', isTrue: true }
    ],
    explanation: 'Mệnh đề c sai vì tính đơn điệu chỉ xét trên từng khoảng xác định $(-\\infty; -1)$ và $(-1; +\\infty)$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'bank_m12_04',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c1',
    lessonId: 'math_12_c1_l1',
    level: 'Vận dụng',
    part: 'part3',
    content: 'Tìm số các giá trị nguyên của tham số $m \\in [-10; 10]$ để hàm số $y = \\frac{1}{3}x^3 - mx^2 + (m + 2)x - 5$ đồng biến trên toàn trục số $\\mathbb{R}$.',
    shortAnswer: '3',
    explanation: 'Ta có $y\' = x^2 - 2mx + (m + 2)$. Để hàm số đồng biến trên $\\mathbb{R}$ thì $\\Delta\' = m^2 - m - 2 \\le 0 \\Leftrightarrow -1 \\le m \\le 2$. Có 4 giá trị nguyên $\\{-1, 0, 1, 2\\}$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-02T11:00:00Z'
  },

  // --- MÔN TOÁN: Bài math_12_c2_l2 (Tọa độ vectơ trong không gian Oxyz) ---
  {
    id: 'bank_m12_05',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c2',
    lessonId: 'math_12_c2_l2',
    level: 'Nhận biết',
    part: 'part1',
    content: 'Trong không gian $Oxyz$, cho điểm $A(1; 2; -3)$. Tọa độ hình chiếu vuông góc của điểm $A$ lên mặt phẳng $(Oxy)$ là:',
    options: ['$(1; 2; 0)$', '$(0; 0; -3)$', '$(1; 0; -3)$', '$(0; 2; -3)$'],
    correctAnswerIndex: 0,
    explanation: 'Hình chiếu của $A(x; y; z)$ lên mặt phẳng $(Oxy)$ có tọa độ là $(x; y; 0) = (1; 2; 0)$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-05T09:00:00Z'
  },
  {
    id: 'bank_m12_06',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c2',
    lessonId: 'math_12_c2_l2',
    level: 'Thông hiểu',
    part: 'part1',
    content: 'Trong không gian $Oxyz$, cho hai vectơ $\\vec{u} = (1; -2; 2)$ và $\\vec{v} = (2; 1; -1)$. Tích vô hướng $\\vec{u} \\cdot \\vec{v}$ bằng:',
    options: ['$-2$', '$2$', '$6$', '$0$'],
    correctAnswerIndex: 0,
    explanation: '$\\vec{u} \\cdot \\vec{v} = 1 \\cdot 2 + (-2) \\cdot 1 + 2 \\cdot (-1) = 2 - 2 - 2 = -2$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-05T09:30:00Z'
  },

  // --- MÔN VẬT LÍ: Bài phy_12_c1_l2 (Nội năng và định luật I) ---
  {
    id: 'bank_p12_01',
    subject: 'Vật lí',
    grade: 'Khối 12',
    chapterId: 'phy_12_c1',
    lessonId: 'phy_12_c1_l2',
    level: 'Nhận biết',
    part: 'part1',
    content: 'Nội năng của một vật phụ thuộc vào những thông số trạng thái nào dưới đây?',
    options: ['Nhiệt độ và thể tích của vật', 'Khối lượng và vận tốc của vật', 'Độ cao của vật so với mặt đất', 'Hình dạng và kích thước của vật'],
    correctAnswerIndex: 0,
    explanation: 'Nội năng là tổng động năng và thế năng của các phân tử cấu tạo nên vật, phụ thuộc vào nhiệt độ $T$ và thể tích $V$.',
    author: 'Tổ Vật Lí - THPT Cao Bá Quát',
    createdAt: '2026-09-03T14:00:00Z'
  },
  {
    id: 'bank_p12_02',
    subject: 'Vật lí',
    grade: 'Khối 12',
    chapterId: 'phy_12_c1',
    lessonId: 'phy_12_c1_l2',
    level: 'Thông hiểu',
    part: 'part2',
    content: 'Một khối khí lí tưởng thực hiện một chu trình biến đổi nhiệt động. Xét tính Đúng / Sai của các khẳng định sau:',
    subItems: [
      { key: 'a', text: 'Theo biểu thức $\\Delta U = A + Q$, khi hệ nhận nhiệt lượng thì $Q > 0$.', isTrue: true },
      { key: 'b', text: 'Khi khối khí giãn nở sinh công thì công $A > 0$.', isTrue: false },
      { key: 'c', text: 'Trong quá trình đẳng nhiệt của khí lí tưởng, độ biến thiên nội năng $\\Delta U = 0$.', isTrue: true },
      { key: 'd', text: 'Trong quá trình đoạn nhiệt, hệ không trao đổi nhiệt với môi trường nên $Q = 0$.', isTrue: true }
    ],
    explanation: 'Ý b sai vì khi hệ sinh công thì theo quy ước dấu $A < 0$ (hoặc nhận công $A > 0$).',
    author: 'Tổ Vật Lí - THPT Cao Bá Quát',
    createdAt: '2026-09-03T15:00:00Z'
  },
  {
    id: 'bank_p12_03',
    subject: 'Vật lí',
    grade: 'Khối 12',
    chapterId: 'phy_12_c1',
    lessonId: 'phy_12_c1_l3',
    level: 'Vận dụng',
    part: 'part3',
    content: 'Một ấm điện có công suất $1000\\text{ W}$ đun sôi $1.5\\text{ kg}$ nước từ nhiệt độ $20^\\circ\\text{C}$. Biết nhiệt dung riêng của nước là $c = 4200\\text{ J/(kg}\\cdot\\text{K)}$ và hiệu suất của ấm là $84\\%$. Thời gian đun sôi nước là bao nhiêu giây?',
    shortAnswer: '600',
    explanation: '$Q = m \\cdot c \\cdot \\Delta T = 1.5 \\cdot 4200 \\cdot 80 = 504000\\text{ J}$. Năng lượng ấm cung cấp $A = \\frac{Q}{H} = \\frac{504000}{0.84} = 600000\\text{ J}$. Thời gian $t = \\frac{A}{P} = \\frac{600000}{1000} = 600\\text{ s}$.',
    author: 'Tổ Vật Lí - THPT Cao Bá Quát',
    createdAt: '2026-09-04T10:00:00Z'
  },

  // --- MÔN HÓA HỌC: Bài chem_12_c1_l1 (Ester và xà phòng hóa) ---
  {
    id: 'bank_c12_01',
    subject: 'Hóa học',
    grade: 'Khối 12',
    chapterId: 'chem_12_c1',
    lessonId: 'chem_12_c1_l1',
    level: 'Nhận biết',
    part: 'part1',
    content: 'Ester có công thức cấu tạo $\\text{CH}_3\\text{COOCH}_3$ có tên gọi quốc tế IUPAC là gì?',
    options: ['Methyl acetate', 'Ethyl formate', 'Methyl propionate', 'Ethyl acetate'],
    correctAnswerIndex: 0,
    explanation: 'Gốc alcohol là methyl ($\\text{-CH}_3$), gốc acid là acetate ($\\text{CH}_3\\text{COO-}$), tên gọi là Methyl acetate.',
    author: 'Tổ Hóa Học - THPT Cao Bá Quát',
    createdAt: '2026-09-04T14:00:00Z'
  },
  {
    id: 'bank_c12_02',
    subject: 'Hóa học',
    grade: 'Khối 12',
    chapterId: 'chem_12_c1',
    lessonId: 'chem_12_c1_l1',
    level: 'Thông hiểu',
    part: 'part2',
    content: 'Tiến hành thí nghiệm xà phòng hóa chất béo trong phòng thí nghiệm. Xét tính Đúng / Sai của các nhận định sau:',
    subItems: [
      { key: 'a', text: 'Chất béo là triester của glycerol với các acid béo mạch dài không phân nhánh.', isTrue: true },
      { key: 'b', text: 'Sau khi đun sôi hỗn hợp dầu ăn với dung dịch NaOH, thêm dung dịch NaCl bão hòa để muối sodium của acid béo kết tinh và nổi lên trên.', isTrue: true },
      { key: 'c', text: 'Glycerol tạo thành trong phản ứng không tan trong nước.', isTrue: false },
      { key: 'd', text: 'Chất béo lỏng chứa chủ yếu các gốc acid béo chưa no.', isTrue: true }
    ],
    explanation: 'Ý c sai vì glycerol tan vô hạn trong nước do có 3 nhóm -OH tạo liên kết hydro bền vững với nước.',
    author: 'Tổ Hóa Học - THPT Cao Bá Quát',
    createdAt: '2026-09-04T15:00:00Z'
  }
];

/**
 * Lấy toàn bộ cây thư mục Chương - Bài
 */
export function getTaxonomyTree() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TREE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Lỗi đọc cây thư mục từ storage:", e);
  }
  // Mặc định nạp dữ liệu ban đầu
  saveTaxonomyTree(DEFAULT_TAXONOMY_TREE);
  return DEFAULT_TAXONOMY_TREE;
}

/**
 * Lưu cây thư mục
 */
export function saveTaxonomyTree(tree) {
  try {
    localStorage.setItem(STORAGE_KEY_TREE, JSON.stringify(tree));
  } catch (e) {
    console.error("Lỗi lưu cây thư mục:", e);
  }
}

/**
 * Lấy cây thư mục của một môn học & khối lớp cụ thể
 */
export function getTaxonomyForSubject(subject, grade) {
  const all = getTaxonomyTree();
  let found = all.find(item => item.subject === subject && item.grade === grade);
  if (!found) {
    // Tìm theo môn học nếu chưa khớp đúng khối
    found = all.find(item => item.subject === subject);
  }
  return found || {
    id: `${subject}_${grade}`,
    subject,
    grade,
    chapters: []
  };
}

/**
 * Thêm hoặc Cập nhật một Chương vào cây thư mục
 */
export function upsertChapter(subject, grade, chapterData) {
  const allTree = getTaxonomyTree();
  let subTree = allTree.find(item => item.subject === subject && item.grade === grade);
  
  if (!subTree) {
    subTree = {
      id: `${subject}_${grade}_${Date.now()}`,
      subject,
      grade,
      chapters: []
    };
    allTree.push(subTree);
  }

  const existingIdx = subTree.chapters.findIndex(c => c.id === chapterData.id);
  if (existingIdx >= 0) {
    subTree.chapters[existingIdx] = { ...subTree.chapters[existingIdx], ...chapterData };
  } else {
    subTree.chapters.push({
      id: chapterData.id || `ch_${Date.now()}`,
      title: chapterData.title || 'Chương mới',
      lessons: chapterData.lessons || []
    });
  }

  saveTaxonomyTree(allTree);
  return subTree;
}

/**
 * Thêm hoặc Cập nhật một Bài học vào một Chương
 */
export function upsertLesson(subject, grade, chapterId, lessonData) {
  const allTree = getTaxonomyTree();
  let subTree = allTree.find(item => item.subject === subject && item.grade === grade);
  if (!subTree) return null;

  const chapter = subTree.chapters.find(c => c.id === chapterId);
  if (!chapter) return null;

  if (!chapter.lessons) chapter.lessons = [];

  const existingIdx = chapter.lessons.findIndex(l => l.id === lessonData.id);
  if (existingIdx >= 0) {
    chapter.lessons[existingIdx] = { ...chapter.lessons[existingIdx], ...lessonData };
  } else {
    chapter.lessons.push({
      id: lessonData.id || `less_${Date.now()}`,
      title: lessonData.title || 'Bài học mới'
    });
  }

  saveTaxonomyTree(allTree);
  return chapter;
}

/**
 * Lấy toàn bộ danh sách câu hỏi trong ngân hàng
 */
export function getAllBankQuestions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Lỗi đọc ngân hàng câu hỏi:", e);
  }
  saveAllBankQuestions(INITIAL_BANK_QUESTIONS);
  return INITIAL_BANK_QUESTIONS;
}

/**
 * Lưu danh sách câu hỏi trong ngân hàng
 */
export function saveAllBankQuestions(questions) {
  try {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
  } catch (e) {
    console.error("Lỗi lưu ngân hàng câu hỏi:", e);
  }
}

/**
 * Thêm hoặc cập nhật một câu hỏi vào ngân hàng
 */
export function upsertBankQuestion(question) {
  const all = getAllBankQuestions();
  const qId = question.id || `bank_q_${Date.now()}`;
  const prepared = {
    ...question,
    id: qId,
    updatedAt: new Date().toISOString()
  };

  const existingIdx = all.findIndex(q => q.id === qId);
  if (existingIdx >= 0) {
    all[existingIdx] = prepared;
  } else {
    all.unshift(prepared);
  }

  saveAllBankQuestions(all);
  return prepared;
}

/**
 * Xóa một câu hỏi khỏi ngân hàng
 */
export function deleteBankQuestion(questionId) {
  const all = getAllBankQuestions();
  const filtered = all.filter(q => q.id !== questionId);
  saveAllBankQuestions(filtered);
  return filtered;
}

/**
 * Lọc câu hỏi theo Chương / Bài / Mức độ / Hình thức
 */
export function queryBankQuestions({ subject, grade, chapterId, lessonId, level, part, search }) {
  const all = getAllBankQuestions();
  return all.filter(q => {
    if (subject && q.subject !== subject) return false;
    if (grade && q.grade !== grade) return false;
    if (chapterId && q.chapterId !== chapterId) return false;
    if (lessonId && q.lessonId !== lessonId) return false;
    if (level && level !== 'all' && q.level !== level) return false;
    if (part && part !== 'all' && q.part !== part) return false;
    if (search && search.trim()) {
      const s = search.toLowerCase();
      const inContent = q.content?.toLowerCase().includes(s);
      const inTitle = q.title?.toLowerCase().includes(s);
      if (!inContent && !inTitle) return false;
    }
    return true;
  });
}

/**
 * Thống kê số lượng câu hỏi trong một bài học hoặc chương theo mức độ
 */
export function getQuestionStatsForNode(lessonOrChapterId) {
  const all = getAllBankQuestions();
  const matched = all.filter(q => q.lessonId === lessonOrChapterId || q.chapterId === lessonOrChapterId);
  return {
    total: matched.length,
    nb: matched.filter(q => q.level === 'Nhận biết').length,
    th: matched.filter(q => q.level === 'Thông hiểu').length,
    vd: matched.filter(q => q.level === 'Vận dụng').length,
    vdc: matched.filter(q => q.level === 'Vận dụng cao').length,
    part1: matched.filter(q => q.part === 'part1').length,
    part2: matched.filter(q => q.part === 'part2').length,
    part3: matched.filter(q => q.part === 'part3').length
  };
}

/**
 * Thuật toán bốc đề ngẫu nhiên từ Khung Ma Trận (Auto Matrix Exam Generator)
 * @param {Array} matrixSpecs Mảng cấu hình ma trận:
 * [
 *   { lessonId: 'math_12_c1_l1', nb: 2, th: 1, vd: 1, vdc: 0 },
 *   { lessonId: 'math_12_c1_l2', nb: 1, th: 1, vd: 0, vdc: 0 }
 * ]
 * @returns { selectedQuestions: Array, missingLogs: Array }
 */
export function generateExamFromMatrix(matrixSpecs, subject, grade) {
  const allQuestions = getAllBankQuestions().filter(q => {
    if (subject && q.subject !== subject) return false;
    if (grade && q.grade !== grade) return false;
    return true;
  });

  const selectedQuestions = [];
  const missingLogs = [];

  const shuffleArray = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const levels = [
    { key: 'nb', label: 'Nhận biết' },
    { key: 'th', label: 'Thông hiểu' },
    { key: 'vd', label: 'Vận dụng' },
    { key: 'vdc', label: 'Vận dụng cao' }
  ];

  matrixSpecs.forEach(spec => {
    const { lessonId, lessonTitle } = spec;
    
    levels.forEach(lvl => {
      const requestedCount = Number(spec[lvl.key]) || 0;
      if (requestedCount <= 0) return;

      const candidates = allQuestions.filter(q => 
        q.lessonId === lessonId && 
        q.level === lvl.label &&
        !selectedQuestions.some(sq => sq.id === q.id)
      );

      const shuffled = shuffleArray(candidates);
      const picked = shuffled.slice(0, requestedCount);
      selectedQuestions.push(...picked);

      if (picked.length < requestedCount) {
        missingLogs.push({
          lessonTitle: lessonTitle || lessonId,
          level: lvl.label,
          requested: requestedCount,
          found: picked.length,
          missing: requestedCount - picked.length
        });
      }
    });
  });

  return {
    selectedQuestions,
    missingLogs
  };
}
