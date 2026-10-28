/**
 * HỆ THỐNG RA ĐỀ THI & NGÂN HÀNG CÂU HỎI ĐA MÔN GDPT 2018 (CHUẨN 2025 - 2028)
 * Trường THPT Cao Bá Quát - Tỉnh Đắk Lắk
 * 
 * Cung cấp cấu hình Ma trận, Bản đặc tả và Bộ câu hỏi mẫu chuyên sâu cho TẤT CẢ các môn học:
 * 1. Toán học (90 phút - 12 câu P1, 4 câu P2, 6 câu P3)
 * 2. KHTN: Vật lí, Hóa học, Sinh học (50 phút - 18 câu P1, 4 câu P2, 6 câu P3)
 * 3. KHXH & Ứng dụng: Lịch sử, Địa lí, GDKT&PL, Tin học, Công nghệ (50 phút - 24 câu P1, 4 câu P2)
 * 4. Ngoại ngữ: Tiếng Anh (50 phút - 40 câu trắc nghiệm 4 lựa chọn)
 * 5. Ngữ văn (120 phút - Đọc hiểu văn bản 4.0đ + Viết nghị luận 6.0đ)
 */

export const SUBJECT_OPTIONS = [
  { id: 'Toán', name: 'Toán học', icon: '📐', defaultDuration: '90 phút', formatType: 'math_3parts' },
  { id: 'Ngữ văn', name: 'Ngữ văn', icon: '📚', defaultDuration: '120 phút', formatType: 'literature' },
  { id: 'Tiếng Anh', name: 'Tiếng Anh (Ngoại ngữ)', icon: '🌐', defaultDuration: '50 phút', formatType: 'english_40' },
  { id: 'Vật lí', name: 'Vật lí', icon: '⚡', defaultDuration: '50 phút', formatType: 'science_3parts' },
  { id: 'Hóa học', name: 'Hóa học', icon: '🧪', defaultDuration: '50 phút', formatType: 'science_3parts' },
  { id: 'Sinh học', name: 'Sinh học', icon: '🌱', defaultDuration: '50 phút', formatType: 'science_3parts' },
  { id: 'Lịch sử', name: 'Lịch sử', icon: '🏛️', defaultDuration: '50 phút', formatType: 'social_2parts' },
  { id: 'Địa lí', name: 'Địa lí', icon: '🗺️', defaultDuration: '50 phút', formatType: 'social_2parts' },
  { id: 'GDKT & PL', name: 'Giáo dục Kinh tế & Pháp luật', icon: '⚖️', defaultDuration: '50 phút', formatType: 'social_2parts' },
  { id: 'Tin học', name: 'Tin học', icon: '💻', defaultDuration: '50 phút', formatType: 'social_2parts' },
  { id: 'Công nghệ', name: 'Công nghệ', icon: '⚙️', defaultDuration: '50 phút', formatType: 'social_2parts' },
  { id: 'GDQP-AN', name: 'Giáo dục Quốc phòng - An ninh', icon: '🛡️', defaultDuration: '45 phút', formatType: 'social_2parts' }
];

export const GRADE_OPTIONS = ['Khối 10', 'Khối 11', 'Khối 12'];

export const EXAM_TYPE_OPTIONS = [
  { id: 'regular', name: 'Kiểm tra thường xuyên (15 - 45 phút)', defaultPrefix: 'BÀI KIỂM TRA THƯỜNG XUYÊN' },
  { id: 'midterm', name: 'Kiểm tra Giữa kỳ (45 - 90 phút)', defaultPrefix: 'ĐỀ KIỂM TRA GIỮA HỌC KỲ' },
  { id: 'final', name: 'Kiểm tra Cuối kỳ (45 - 90 phút)', defaultPrefix: 'ĐỀ KIỂM TRA CUỐI HỌC KỲ' },
  { id: 'mock_test', name: 'Khảo sát Năng lực / Thi thử Tốt nghiệp THPT', defaultPrefix: 'ĐỀ THI THỬ TỐT NGHIỆP THPT' }
];

// Cấu trúc Ma trận chuẩn theo từng nhóm môn học theo Công văn của Bộ GD&ĐT
export const MATRIX_STRUCTURES = {
  // 1. Nhóm TOÁN HỌC (90 phút)
  math_3parts: {
    part1: { count: 12, pointPerQ: 0.25, total: 3.0, name: 'Phần I: 12 câu 4 lựa chọn (3.0đ)' },
    part2: { count: 4, pointPerQ: 1.0, total: 4.0, name: 'Phần II: 4 câu Đúng/Sai lũy tiến (4.0đ)' },
    part3: { count: 6, pointPerQ: 0.5, total: 3.0, name: 'Phần III: 6 câu Trả lời ngắn (3.0đ)' },
    totalQuestions: 22,
    totalCommands: 34,
    totalPoints: 10.0,
    cognitiveRatios: { nb: 40, th: 30, vd: 20, vdc: 10 }
  },
  // 2. Nhóm KHOA HỌC TỰ NHIÊN: Vật lí, Hóa học, Sinh học (50 phút)
  science_3parts: {
    part1: { count: 18, pointPerQ: 0.25, total: 4.5, name: 'Phần I: 18 câu 4 lựa chọn (4.5đ)' },
    part2: { count: 4, pointPerQ: 1.0, total: 4.0, name: 'Phần II: 4 câu Đúng/Sai lũy tiến (4.0đ)' },
    part3: { count: 6, pointPerQ: 0.25, total: 1.5, name: 'Phần III: 6 câu Trả lời ngắn (1.5đ)' },
    totalQuestions: 28,
    totalCommands: 40,
    totalPoints: 10.0,
    cognitiveRatios: { nb: 40, th: 30, vd: 20, vdc: 10 }
  },
  // 3. Nhóm KHOA HỌC XÃ HỘI, TIN HỌC, CÔNG NGHỆ, GDKT&PL (50 phút)
  social_2parts: {
    part1: { count: 24, pointPerQ: 0.25, total: 6.0, name: 'Phần I: 24 câu 4 lựa chọn (6.0đ)' },
    part2: { count: 4, pointPerQ: 1.0, total: 4.0, name: 'Phần II: 4 câu Đúng/Sai lũy tiến (4.0đ)' },
    part3: { count: 0, pointPerQ: 0, total: 0, name: 'Không có Phần III' },
    totalQuestions: 28,
    totalCommands: 40,
    totalPoints: 10.0,
    cognitiveRatios: { nb: 40, th: 30, vd: 20, vdc: 10 }
  },
  // 4. Nhóm TIẾNG ANH (50 phút)
  english_40: {
    part1: { count: 40, pointPerQ: 0.25, total: 10.0, name: 'Phần trắc nghiệm 4 lựa chọn: 40 câu (10.0đ)' },
    part2: { count: 0, pointPerQ: 0, total: 0, name: 'Không áp dụng Phần II' },
    part3: { count: 0, pointPerQ: 0, total: 0, name: 'Không áp dụng Phần III' },
    totalQuestions: 40,
    totalCommands: 40,
    totalPoints: 10.0,
    cognitiveRatios: { nb: 40, th: 30, vd: 20, vdc: 10 }
  },
  // 5. Nhóm NGỮ VĂN (120 phút)
  literature: {
    part1: { count: 4, pointPerQ: 1.0, total: 4.0, name: 'Phần I: Đọc hiểu văn bản (4.0đ)' },
    part2: { count: 0, pointPerQ: 0, total: 0, name: 'Không áp dụng' },
    part3: { count: 2, pointPerQ: 3.0, total: 6.0, name: 'Phần II: Viết nghị luận (6.0đ)' },
    totalQuestions: 6,
    totalCommands: 6,
    totalPoints: 10.0,
    cognitiveRatios: { nb: 30, th: 40, vd: 20, vdc: 10 }
  }
};

// Danh mục Chuyên đề / Chủ đề gợi ý cho AI và Soạn đề theo từng Môn
export const SUBJECT_TOPICS_MAP = {
  'Toán': [
    'Hàm số và ứng dụng đạo hàm để khảo sát đồ thị',
    'Vectơ và hệ tọa độ trong không gian Oxyz',
    'Xác suất có điều kiện và công thức Bayes',
    'Cấp số cộng và cấp số nhân',
    'Phương trình lượng giác và dãy số'
  ],
  'Vật lí': [
    'Vật lí nhiệt: Nội năng, nhiệt dung riêng và nhiệt hóa hơi',
    'Khí lí tưởng và phương trình trạng thái Clapeyron - Mendeleev',
    'Từ trường, lực từ và hiện tượng cảm ứng điện từ',
    'Vật lí hạt nhân: Năng lượng liên kết và phản ứng hạt nhân',
    'Dao động điều hòa và sóng cơ học'
  ],
  'Hóa học': [
    'Cân bằng hóa học và hằng số cân bằng Kc',
    'Hợp chất Carbonyl (Aldehyde - Ketone) và Carboxylic acid',
    'Ester, Lipid và xà phòng - chất giặt rửa',
    'Đại cương kim loại và phức chất chuyển tiếp',
    'Pin điện hóa và quá trình điện phân dung dịch'
  ],
  'Sinh học': [
    'Cơ chế di truyền phân tử: Tái bản DNA, phiên mã và dịch mã',
    'Quy luật di truyền Men-đen và di truyền liên kết giới tính',
    'Đột biến gen và công nghệ chỉnh sửa gen CRISPR-Cas9',
    'Quần thể sinh vật và diễn thế sinh thái tự nhiên',
    'Tiến hóa tổng hợp hiện đại và chọn lọc tự nhiên'
  ],
  'Lịch sử': [
    'Cách mạng tháng Tám năm 1945 và sự thành lập nước VNDCCH',
    'Cuộc kháng chiến chống thực dân Pháp (1945 - 1954)',
    'Cuộc kháng chiến chống Mỹ cứu nước (1954 - 1975)',
    'Công cuộc Đổi mới đất nước từ năm 1986 đến nay',
    'Cộng đồng ASEAN: Quá trình thành lập và phát triển'
  ],
  'Địa lí': [
    'Đặc điểm vị trí địa lí và phạm vi lãnh thổ Việt Nam',
    'Thiên nhiên nhiệt đới ẩm gió mùa và tài nguyên thiên nhiên',
    'Địa lí các ngành kinh tế trọng điểm: Nông nghiệp, Công nghiệp',
    'Các vùng kinh tế trọng điểm: Tây Nguyên, Đông Nam Bộ, ĐBSCL',
    'Bảo vệ chủ quyền biển đảo và an ninh biên giới quốc gia'
  ],
  'GDKT & PL': [
    'Cơ chế thị trường: Quy luật cung - cầu, cạnh tranh và giá cả',
    'Quyền và nghĩa vụ của công dân trong kinh doanh và nộp thuế',
    'Hệ thống chính trị và Nhà nước pháp quyền XHCN Việt Nam',
    'Quản lý tài chính cá nhân và sử dụng tín dụng thông minh',
    'Quyền bình đẳng của công dân trước pháp luật'
  ],
  'Tin học': [
    'Tư duy giải thuật và kỹ thuật lập trình Python nâng cao',
    'Cơ sở dữ liệu quan hệ, bảng dữ liệu và truy vấn SQL',
    'Kiến trúc mạng máy tính, giao thức TCP/IP và an toàn thông tin',
    'Ứng dụng trí tuệ nhân tạo (AI) và đạo đức kỹ thuật số',
    'Thiết kế trang web HTML/CSS và quản trị dữ liệu số'
  ],
  'Tiếng Anh': [
    'Phonetics: Pronunciation of vowels, consonants & word stress',
    'Grammar in context: Tenses, Passive voice & Conditional sentences',
    'Reading comprehension: Identifying main ideas and inference',
    'Vocabulary: Collocations, phrasal verbs and idioms',
    'Error identification and sentence transformation'
  ],
  'Ngữ văn': [
    'Đọc hiểu văn bản văn học hiện đại: Thơ, truyện ngắn, ký',
    'Đọc hiểu văn bản nghị luận và văn bản thông tin thời sự',
    'Viết đoạn văn nghị luận xã hội (khoảng 200 chữ) bàn về lối sống',
    'Viết bài văn nghị luận so sánh, đánh giá giá trị tác phẩm',
    'Thực hành Tiếng Việt: Biện pháp tu từ, liên kết câu và đoạn văn'
  ],
  'Công nghệ': [
    'Bản vẽ kỹ thuật và mô hình hóa hình học 3D',
    'Hệ thống cơ khí, truyền và biến đổi chuyển động',
    'Mạch điện điều khiển và linh kiện điện tử cơ bản',
    'Công nghệ vi sinh và trồng trọt công nghệ cao'
  ],
  'GDQP-AN': [
    'Truyền thống đánh giặc giữ nước của dân tộc Việt Nam',
    'Nghệ thuật quân sự Việt Nam trong chiến tranh bảo vệ Tổ quốc',
    'Phòng chống chiến lược "Diễn biến hòa bình" và bạo loạn lật đổ',
    'Kỹ thuật bắn súng tiểu liên AK và tháo lắp súng cơ bản'
  ]
};

// BỘ CÂU HỎI MẪU CHUẨN GDPT 2018 THEO TỪNG MÔN HỌC
export const SAMPLE_QUESTIONS_BY_SUBJECT = {
  'Toán': [
    {
      id: 'math_q1',
      part: 'part1',
      title: 'Câu 1 (Phần I - 4 Lựa chọn)',
      level: 'Nhận biết',
      content: 'Cho cấp số cộng $(u_n)$ có $u_1 = 3$ và công sai $d = 2$. Giá trị của $u_2$ bằng:',
      options: ['$5$', '$6$', '$1$', '$-1$'],
      correctAnswerIndex: 0,
      explanation: 'Ta có $u_2 = u_1 + d = 3 + 2 = 5$.'
    },
    {
      id: 'math_q2',
      part: 'part1',
      title: 'Câu 2 (Phần I - 4 Lựa chọn)',
      level: 'Thông hiểu',
      content: 'Tập nghiệm của bất phương trình $\\log_2(x - 1) < 3$ là:',
      options: ['$(1; 9)$', '$(-\\infty; 9)$', '$(1; 8)$', '$(0; 9)$'],
      correctAnswerIndex: 0,
      explanation: 'Điều kiện $x - 1 > 0 \\Leftrightarrow x > 1$. BPT $\\Leftrightarrow x - 1 < 2^3 = 8 \\Leftrightarrow x < 9$. Kết hợp điều kiện ta được $x \\in (1; 9)$.'
    },
    {
      id: 'math_q3',
      part: 'part2',
      title: 'Câu 1 (Phần II - Đúng / Sai)',
      level: 'Thông hiểu',
      content: 'Cho hàm số $y = f(x) = x^3 - 3x + 2$. Xét tính Đúng/Sai của các mệnh đề sau:',
      subItems: [
        { key: 'a', text: 'Hàm số đồng biến trên khoảng $(1; +\\infty)$.', isTrue: true },
        { key: 'b', text: 'Hàm số đã cho có $2$ điểm cực trị.', isTrue: true },
        { key: 'c', text: 'Giá trị cực đại của hàm số bằng $0$.', isTrue: false },
        { key: 'd', text: 'Đồ thị hàm số cắt trục tung tại điểm có tung độ bằng $2$.', isTrue: true }
      ],
      explanation: '$f\'(x) = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. $f(-1) = 4$ (Cực đại), $f(1) = 0$ (Cực tiểu).'
    },
    {
      id: 'math_q4',
      part: 'part3',
      title: 'Câu 1 (Phần III - Trả lời ngắn)',
      level: 'Vận dụng',
      content: 'Một doanh nghiệp sản xuất sản phẩm có hàm chi phí $C(x) = 2x^2 + 500x + 5000$ (ngàn đồng). Tìm số sản phẩm $x$ để chi phí trung bình $\\bar{C}(x)$ đạt giá trị nhỏ nhất.',
      shortAnswer: '50',
      explanation: '$\\bar{C}(x) = 2x + 500 + \\frac{5000}{x} \\ge 500 + 2\\sqrt{2x \\cdot \\frac{5000}{x}} = 700$. Đạt tại $2x = 5000/x \\Rightarrow x = 50$.'
    }
  ],

  'Vật lí': [
    {
      id: 'phy_q1',
      part: 'part1',
      title: 'Câu 1 (Phần I - 4 Lựa chọn)',
      level: 'Nhận biết',
      content: 'Nhiệt độ sôi của nước tinh khiết ở áp suất chuẩn $1\\text{ atm}$ theo thang nhiệt độ Kelvin là:',
      options: ['$373.15\\text{ K}$', '$273.15\\text{ K}$', '$100\\text{ K}$', '$0\\text{ K}$'],
      correctAnswerIndex: 0,
      explanation: '$T(K) = t(^\\circ C) + 273.15 = 100 + 273.15 = 373.15\\text{ K}$.'
    },
    {
      id: 'phy_q2',
      part: 'part1',
      title: 'Câu 2 (Phần I - 4 Lựa chọn)',
      level: 'Thông hiểu',
      content: 'Một lượng khí lí tưởng chứa trong bình kín thể tích không đổi. Khi nhiệt độ tuyệt đối của khối khí tăng $2$ lần thì áp suất của khối khí:',
      options: ['Tăng $2$ lần', 'Giảm $2$ lần', 'Không đổi', 'Tăng $4$ lần'],
      correctAnswerIndex: 0,
      explanation: 'Theo định luật Charles trong quá trình đẳng tích: $\\frac{p_1}{T_1} = \\frac{p_2}{T_2} \\Rightarrow p_2 = p_1 \\cdot \\frac{T_2}{T_1} = 2p_1$.'
    },
    {
      id: 'phy_q3',
      part: 'part2',
      title: 'Câu 1 (Phần II - Đúng / Sai)',
      level: 'Vận dụng',
      content: 'Một khối khí lí tưởng thực hiện chu trình biến đổi trạng thái khép kín từ $(1) \\to (2) \\to (3) \\to (1)$. Xét tính Đúng/Sai của các mệnh đề sau:',
      subItems: [
        { key: 'a', text: 'Quá trình biến đổi từ $(1) \\to (2)$ là quá trình đẳng áp.', isTrue: true },
        { key: 'b', text: 'Nội năng của khối khí ở trạng thái $(1)$ bằng nội năng ở trạng thái $(3)$.', isTrue: false },
        { key: 'c', text: 'Trong một chu trình khép kín, độ biến thiên nội năng $\\Delta U = 0$.', isTrue: true },
        { key: 'd', text: 'Nhiệt lượng mà khối khí nhận được trong cả chu trình bằng công do khí sinh ra.', isTrue: true }
      ],
      explanation: 'Theo nguyên lí I nhiệt động lực học: $\\Delta U = A + Q = 0 \\Rightarrow Q = -A$ (công khí sinh ra bằng nhiệt lượng nhận vào).'
    },
    {
      id: 'phy_q4',
      part: 'part3',
      title: 'Câu 1 (Phần III - Trả lời ngắn)',
      level: 'Vận dụng',
      content: 'Dùng một bếp điện công suất $1000\\text{ W}$ để đun sôi $2\\text{ kg}$ nước từ $20^\\circ\\text{C}$. Biết nhiệt dung riêng của nước là $c = 4200\\text{ J/(kg}\\cdot\\text{K)}$ và hiệu suất của bếp là $80\\%$. Thời gian đun nước sôi (tính bằng phút, làm tròn đến số nguyên) là:',
      shortAnswer: '14',
      explanation: '$Q_1 = m \\cdot c \\cdot \\Delta t = 2 \\cdot 4200 \\cdot 80 = 672000\\text{ J}$. Điện năng cần cung cấp $A = Q_1 / 0.8 = 840000\\text{ J}$. Thời gian $t = A / P = 840000 / 1000 = 840\\text{ s} = 14\\text{ phút}$.'
    }
  ],

  'Hóa học': [
    {
      id: 'chem_q1',
      part: 'part1',
      title: 'Câu 1 (Phần I - 4 Lựa chọn)',
      level: 'Nhận biết',
      content: 'Hợp chất nào sau đây thuộc loại ester no, đơn chức, mạch hở?',
      options: ['$\\text{CH}_3\\text{COOCH}_3$', '$\\text{CH}_2=\\text{CHCOOCH}_3$', '$\\text{HCOOCH}=\\text{CH}_2$', '$\\text{C}_6\\text{H}_5\\text{COOCH}_3$'],
      correctAnswerIndex: 0,
      explanation: '$\\text{CH}_3\\text{COOCH}_3$ (Methyl acetate) có công thức phân tử $\\text{C}_3\\text{H}_6\\text{O}_2$ (công thức chung $\\text{C}_n\\text{H}_{2n}\\text{O}_2$).'
    },
    {
      id: 'chem_q2',
      part: 'part2',
      title: 'Câu 1 (Phần II - Đúng / Sai)',
      level: 'Thông hiểu',
      content: 'Tiến hành thí nghiệm xà phòng hóa chất béo tristearin bằng dung dịch $\\text{NaOH}$ đun nóng. Xét tính Đúng/Sai của các mệnh đề sau:',
      subItems: [
        { key: 'a', text: 'Sau phản ứng thu được muối sodium stearate và glycerol.', isTrue: true },
        { key: 'b', text: 'Thêm dung dịch $\\text{NaCl}$ bão hòa để làm tăng độ tan của xà phòng trong nước.', isTrue: false },
        { key: 'c', text: 'Khối xà phòng nhẹ hơn dung dịch nên nổi lên trên bề mặt.', isTrue: true },
        { key: 'd', text: 'Phản ứng xà phòng hóa là phản ứng thuận nghịch một chiều không hoàn toàn.', isTrue: false }
      ],
      explanation: 'Phản ứng xà phòng hóa trong môi trường kiềm là phản ứng một chiều hoàn toàn. Thêm NaCl bão hòa để xà phòng tách ra.'
    },
    {
      id: 'chem_q3',
      part: 'part3',
      title: 'Câu 1 (Phần III - Trả lời ngắn)',
      level: 'Vận dụng',
      content: 'Thủy phân hoàn toàn $17.8\\text{ g}$ tristearin trong dung dịch $\\text{NaOH}$ dư, đun nóng. Khối lượng glycerol thu được (tính bằng gam, làm tròn đến một chữ số thập phân) là:',
      shortAnswer: '1.8',
      explanation: '$n_{\\text{tristearin}} = 17.8 / 890 = 0.02\\text{ mol} \\Rightarrow n_{\\text{glycerol}} = 0.02\\text{ mol} \\Rightarrow m = 0.02 \\cdot 92 = 1.84 \\approx 1.8\\text{ g}$.'
    }
  ],

  'Sinh học': [
    {
      id: 'bio_q1',
      part: 'part1',
      title: 'Câu 1 (Phần I - 4 Lựa chọn)',
      level: 'Nhận biết',
      content: 'Đơn vị cấu tạo nên phân tử protein là:',
      options: ['Amino acid', 'Nucleotide', 'Glucose', 'Acid béo'],
      correctAnswerIndex: 0,
      explanation: 'Protein là đại phân tử sinh học được cấu tạo theo nguyên tắc đa phân từ các đơn phân là amino acid.'
    },
    {
      id: 'bio_q2',
      part: 'part2',
      title: 'Câu 1 (Phần II - Đúng / Sai)',
      level: 'Thông hiểu',
      content: 'Khi nói về quá trình phiên mã ở sinh vật nhân thực, xét tính Đúng/Sai của các phát biểu sau:',
      subItems: [
        { key: 'a', text: 'Enzyme tham gia chính xúc tác quá trình phiên mã là RNA polymerase.', isTrue: true },
        { key: 'b', text: 'Mạch khuôn DNA được đọc theo chiều $5\' \\to 3\'$.', isTrue: false },
        { key: 'c', text: 'Chuỗi pre-mRNA sau phiên mã được cắt bỏ các intron và nối các exon lại với nhau.', isTrue: true },
        { key: 'd', text: 'Quá trình phiên mã diễn ra chủ yếu ở tế bào chất của sinh vật nhân thực.', isTrue: false }
      ],
      explanation: 'Mạch khuôn được đọc theo chiều 3\' -> 5\'. Ở sinh vật nhân thực, phiên mã diễn ra trong nhân tế bào.'
    },
    {
      id: 'bio_q3',
      part: 'part3',
      title: 'Câu 1 (Phần III - Trả lời ngắn)',
      level: 'Vận dụng',
      content: 'Một phân tử mRNA trưởng thành có chiều dài $510\\text{ nm}$. Số bộ ba mã hóa (codon) có mặt trên phân tử mRNA này là:',
      shortAnswer: '500',
      explanation: 'Số nucleotide = $5100 / 3.4 = 1500\\text{ nu}$. Số bộ ba = $1500 / 3 = 500\\text{ codon}$.'
    }
  ],

  'Lịch sử': [
    {
      id: 'his_q1',
      part: 'part1',
      title: 'Câu 1 (Phần I - 4 Lựa chọn)',
      level: 'Nhận biết',
      content: 'Tổ chức liên kết khu vực lớn nhất tại Đông Nam Á được thành lập vào ngày 08/08/1967 tại Bangkok (Thái Lan) là:',
      options: ['Hiệp hội các quốc gia Đông Nam Á (ASEAN)', 'Diễn đàn Hợp tác Kinh tế Châu Á - Thái Bình Dương (APEC)', 'Liên minh Châu Âu (EU)', 'Tổ chức Hiệp ước Đông Nam Á (SEATO)'],
      correctAnswerIndex: 0,
      explanation: 'ASEAN được thành lập ngày 08/08/1967 với 5 quốc gia sáng lập ban đầu: Indonesia, Malaysia, Philippines, Singapore và Thái Lan.'
    },
    {
      id: 'his_q2',
      part: 'part1',
      title: 'Câu 2 (Phần I - 4 Lựa chọn)',
      level: 'Thông hiểu',
      content: 'Đại hội đại biểu toàn quốc lần thứ VI của Đảng Cộng sản Việt Nam (tháng 12/1986) đã đề ra đường lối nào mang tính bước ngoặt?',
      options: ['Đường lối đổi mới toàn diện đất nước', 'Đường lối công nghiệp hóa XHCN', 'Chính sách kinh tế mới (NEP)', 'Chiến lược phát triển kinh tế đối ngoại'],
      correctAnswerIndex: 0,
      explanation: 'Đại hội VI (12/1986) mở đầu công cuộc đổi mới toàn diện, trước hết là đổi mới về tư duy kinh tế.'
    },
    {
      id: 'his_q3',
      part: 'part2',
      title: 'Câu 1 (Phần II - Đúng / Sai)',
      level: 'Vận dụng',
      content: 'Đọc đoạn tư liệu sau đây về Cách mạng tháng Tám năm 1945 và xét tính Đúng/Sai của các nhận định:\n"Cách mạng tháng Tám năm 1945 đã đập tan ách thống trị của thực dân Pháp hơn 80 năm và ách thống trị của phát xít Nhật, lật đổ chế độ quân chủ chuyên chế tồn tại hàng nghìn năm."',
      subItems: [
        { key: 'a', text: 'Cách mạng tháng Tám năm 1945 mang tính chất dân tộc giải phóng sâu sắc.', isTrue: true },
        { key: 'b', text: 'Thắng lợi của Cách mạng tháng Tám chỉ mang ý nghĩa đối với phong trào giải phóng dân tộc ở Việt Nam.', isTrue: false },
        { key: 'c', text: 'Cuộc cách mạng đã mở ra kỷ nguyên mới: Kỷ nguyên độc lập, tự do và nhân dân làm chủ vận mệnh.', isTrue: true },
        { key: 'd', text: 'Cách mạng thành công chủ yếu do yếu tố khách quan khi phát xít Nhật đầu hàng quân Đồng minh.', isTrue: false }
      ],
      explanation: 'Yếu tố chủ quan (sự chuẩn bị chu đáo của Đảng và tinh thần quật khởi của nhân dân) là nhân tố quyết định thắng lợi.'
    }
  ],

  'Địa lí': [
    {
      id: 'geo_q1',
      part: 'part1',
      title: 'Câu 1 (Phần I - 4 Lựa chọn)',
      level: 'Nhận biết',
      content: 'Nước ta nằm hoàn toàn trong vùng nội chí tuyến bán cầu Bắc nên có đặc điểm khí hậu nổi bật là:',
      options: ['Nhiệt đới ẩm gió mùa, nền nhiệt độ cao', 'Cận xích đạo gió mùa quanh năm khô hạn', 'Ôn đới lục địa có mùa đông băng giá', 'Cận nhiệt đới gió mùa có tuyết rơi'],
      correctAnswerIndex: 0,
      explanation: 'Vị trí nội chí tuyến quy định tính chất nhiệt đới: lượng bức xạ mặt trời lớn, cán cân bức xạ luôn dương quanh năm.'
    },
    {
      id: 'geo_q2',
      part: 'part2',
      title: 'Câu 1 (Phần II - Đúng / Sai)',
      level: 'Thông hiểu',
      content: 'Về vùng kinh tế Tây Nguyên của nước ta, xét tính Đúng/Sai của các nhận định sau:',
      subItems: [
        { key: 'a', text: 'Tây Nguyên là vùng duy nhất ở nước ta không giáp biển.', isTrue: true },
        { key: 'b', text: 'Thế mạnh hàng đầu của vùng là phát triển cây công nghiệp lâu năm như cà phê, hồ tiêu, cao su.', isTrue: true },
        { key: 'c', text: 'Khó khăn lớn nhất về mặt tự nhiên trong mùa khô ở Tây Nguyên là thiếu nước tưới tiêu.', isTrue: true },
        { key: 'd', text: 'Tây Nguyên có mật độ dân số cao nhất trong các vùng kinh tế của cả nước.', isTrue: false }
      ],
      explanation: 'Tây Nguyên là vùng có mật độ dân số thấp so với bình quân cả nước.'
    }
  ],

  'GDKT & PL': [
    {
      id: 'law_q1',
      part: 'part1',
      title: 'Câu 1 (Phần I - 4 Lựa chọn)',
      level: 'Nhận biết',
      content: 'Quy luật kinh tế nào chi phối quan hệ giữa khối lượng hàng hóa đưa ra bán trên thị trường và khối lượng hàng hóa mà người tiêu dùng cần mua?',
      options: ['Quy luật Cung - Cầu', 'Quy luật Giá trị thặng dư', 'Quy luật Lưu thông tiền tệ', 'Quy luật Cạnh tranh'],
      correctAnswerIndex: 0,
      explanation: 'Quy luật cung - cầu tác động trực tiếp đến sự hình thành giá cả thị trường và điều tiết lưu thông hàng hóa.'
    },
    {
      id: 'law_q2',
      part: 'part2',
      title: 'Câu 1 (Phần II - Đúng / Sai)',
      level: 'Vận dụng',
      content: 'Anh B và chị C cùng góp vốn mở một cửa hàng kinh doanh đồ ăn uống tại thị xã Buôn Hồ. Xét tính Đúng/Sai của các hành vi pháp lý sau:',
      subItems: [
        { key: 'a', text: 'Anh B và chị C bắt buộc phải đăng ký kinh doanh và thực hiện nghĩa vụ nộp thuế theo quy định.', isTrue: true },
        { key: 'b', text: 'Cửa hàng có quyền sử dụng nguyên liệu không rõ nguồn gốc để giảm chi phí đầu vào.', isTrue: false },
        { key: 'c', text: 'Cơ quan chức năng có quyền kiểm tra đột xuất điều kiện vệ sinh an toàn thực phẩm của cửa hàng.', isTrue: true },
        { key: 'd', text: 'Khi phát hiện vi phạm, cơ quan quản lý thị trường có thể phạt tiền và đình chỉ hoạt động.', isTrue: true }
      ],
      explanation: 'Mọi chủ thể kinh doanh phải tuân thủ điều kiện vệ sinh an toàn thực phẩm và pháp luật thuế.'
    }
  ],

  'Tin học': [
    {
      id: 'it_q1',
      part: 'part1',
      title: 'Câu 1 (Phần I - 4 Lựa chọn)',
      level: 'Nhận biết',
      content: 'Trong ngôn ngữ lập trình Python, câu lệnh nào sau đây dùng để in dữ liệu ra màn hình?',
      options: ['print()', 'echo()', 'System.out.println()', 'console.log()'],
      correctAnswerIndex: 0,
      explanation: 'Hàm chuẩn print() trong Python nhận các đối số và xuất giá trị ra luồng xuất chuẩn (màn hình).'
    },
    {
      id: 'it_q2',
      part: 'part2',
      title: 'Câu 1 (Phần II - Đúng / Sai)',
      level: 'Thông hiểu',
      content: 'Cho đoạn mã Python sau:\n`x = [1, 2, 3, 4, 5]`\n`y = [i * 2 for i in x if i % 2 != 0]`\nXét tính Đúng/Sai của các khẳng định sau:',
      subItems: [
        { key: 'a', text: 'Biến y được tạo ra bằng kỹ thuật List Comprehension.', isTrue: true },
        { key: 'b', text: 'Giá trị của danh sách y sau khi chạy mã là [2, 6, 10].', isTrue: true },
        { key: 'c', text: 'Độ dài (len) của danh sách y bằng 5.', isTrue: false },
        { key: 'd', text: 'Phần tử có chỉ số y[0] mang giá trị là 1.', isTrue: false }
      ],
      explanation: 'Các số lẻ trong x là 1, 3, 5. Nhân 2 ta được [2, 6, 10]. Độ dài len(y) = 3 và y[0] = 2.'
    }
  ],

  'Tiếng Anh': [
    {
      id: 'eng_q1',
      part: 'part1',
      title: 'Question 1 (Pronunciation)',
      level: 'Nhận biết',
      content: 'Choose the word whose underlined part differs from the other three in pronunciation:',
      options: ['develops', 'meets', 'cooks', 'cleans'],
      correctAnswerIndex: 3,
      explanation: 'The letter "s" in "cleans" is pronounced as /z/, while in the others it is pronounced as /s/.'
    },
    {
      id: 'eng_q2',
      part: 'part1',
      title: 'Question 2 (Stress)',
      level: 'Nhận biết',
      content: 'Choose the word that differs from the other three in the position of primary stress:',
      options: ['innovate', 'understand', 'recommend', 'volunteer'],
      correctAnswerIndex: 0,
      explanation: '"innovate" has primary stress on the 1st syllable; the others have primary stress on the 3rd syllable.'
    },
    {
      id: 'eng_q3',
      part: 'part1',
      title: 'Question 3 (Grammar in context)',
      level: 'Thông hiểu',
      content: 'If the weather _______ fine tomorrow, we will go on a field trip to Yok Don National Park.',
      options: ['is', 'were', 'will be', 'had been'],
      correctAnswerIndex: 0,
      explanation: 'First conditional sentence: If + S + V(present simple), S + will + V(infinitive).'
    },
    {
      id: 'eng_q4',
      part: 'part1',
      title: 'Question 4 (Vocabulary)',
      level: 'Vận dụng',
      content: 'Renewable energy sources such as solar and wind power are essential for _______ development.',
      options: ['sustainable', 'sustain', 'sustainability', 'sustainably'],
      correctAnswerIndex: 0,
      explanation: 'We need an adjective before the noun "development". "Sustainable development" means phát triển bền vững.'
    }
  ],

  'Ngữ văn': [
    {
      id: 'lit_q1',
      part: 'part1',
      title: 'Câu 1 (Đọc hiểu - Nhận biết)',
      level: 'Nhận biết',
      content: 'Xác định thể thơ hoặc phong cách ngôn ngữ của văn bản đọc hiểu được trích dẫn trong đề thi.',
      options: ['Phong cách ngôn ngữ báo chí / chính luận', 'Phong cách ngôn ngữ nghệ thuật', 'Phong cách ngôn ngữ sinh hoạt', 'Phong cách ngôn ngữ khoa học'],
      correctAnswerIndex: 0,
      explanation: 'Văn bản bàn về một vấn đề thời sự xã hội bằng ngôn ngữ giàu tính lập luận và dẫn chứng xác thực.'
    },
    {
      id: 'lit_q2',
      part: 'part1',
      title: 'Câu 2 (Đọc hiểu - Thông hiểu)',
      level: 'Thông hiểu',
      content: 'Theo tác giả trong đoạn trích, thông điệp tích cực nhất gửi gắm đến thế hệ trẻ là gì?',
      options: ['Dám dấn thân, không ngại thất bại và sống có trách nhiệm với cộng đồng', 'Thụ động chấp nhận số phận và hoàn cảnh', 'Chỉ quan tâm đến lợi ích cá nhân', 'Tránh xa mọi thử thách trong cuộc sống'],
      correctAnswerIndex: 0,
      explanation: 'Đoạn trích khẳng định giá trị của sự dấn thân và tinh thần cống hiến của tuổi trẻ.'
    },
    {
      id: 'lit_q3',
      part: 'part3',
      title: 'Câu 1 (Nghị luận xã hội - 2.0 điểm)',
      level: 'Vận dụng',
      content: 'Viết một đoạn văn (khoảng 200 chữ) trình bày suy nghĩ của anh/chị về ý nghĩa của tinh thần tự học và đổi mới sáng tạo của học sinh trong kỷ nguyên số.',
      shortAnswer: 'Đoạn văn hoàn chỉnh khoảng 200 chữ',
      explanation: 'Yêu cầu: Đảm bảo hình thức đoạn văn, xác định đúng vấn đề nghị luận, dẫn chứng thuyết phục và bài học hành động sâu sắc.'
    }
  ]
};

/**
 * Trả về cấu hình ma trận phù hợp theo Môn học
 */
export function getMatrixConfigForSubject(subject) {
  const found = SUBJECT_OPTIONS.find(s => s.id === subject || s.name === subject);
  const formatType = found?.formatType || 'math_3parts';
  return MATRIX_STRUCTURES[formatType] || MATRIX_STRUCTURES.math_3parts;
}

/**
 * Lấy danh sách câu hỏi mẫu chuẩn GDPT 2018 theo Môn học
 */
export function getSampleQuestionsForSubject(subject) {
  if (SAMPLE_QUESTIONS_BY_SUBJECT[subject]) {
    return SAMPLE_QUESTIONS_BY_SUBJECT[subject];
  }
  return SAMPLE_QUESTIONS_BY_SUBJECT['Toán'] || [];
}
