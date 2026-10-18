/**
 * DỮ LIỆU KHO VIDEO BÀI GIẢNG & KỸ NĂNG SỐ TRƯỜNG HỌC (EDUHUB 4.0)
 * Dành cho Học sinh và Giáo viên - Trường THPT Cao Bá Quát
 */

export const VIDEO_CATEGORIES = [
  { id: 'all', label: 'Tất Cả Video', icon: 'Sparkles', color: '#6366f1' },
  { id: 'exam_prep', label: 'Ôn Thi TN THPT 2025/2026', icon: 'GraduationCap', color: '#0284c7' },
  { id: 'study_methods', label: 'Phương Pháp Học Tập Khoa Học', icon: 'Brain', color: '#8b5cf6' },
  { id: 'career_skills', label: 'Kỹ Năng Sống & Hướng Nghiệp', icon: 'Compass', color: '#10b981' },
  { id: 'mental_health', label: 'Tâm Lý & Chữa Lành Học Đường', icon: 'Heart', color: '#f43f5e' },
  { id: 'teacher_pd', label: 'Góc Sư Phạm & Ứng Dụng AI', icon: 'Briefcase', color: '#f59e0b' }
];

export const EDU_VIDEOS = [
  // 1. Ôn Thi Tốt Nghiệp THPT (GDPT 2018 - Cấu trúc đề 2025/2026)
  {
    id: 'vid_exam_01',
    youtubeId: 'kJQP7kiw5Fk', // Luis Fonsi or replace with high quality educational IDs
    embedUrl: 'https://www.youtube.com/embed/S2Y2bX3ZJ7g',
    title: 'Chiến Thuật Làm Bài Thi Tốt Nghiệp THPT 2025: Dạng Câu Đúng/Sai & Trả Lời Ngắn',
    channel: 'Ban Chuyên Môn THPT Cao Bá Quát',
    category: 'exam_prep',
    targetAudience: 'student',
    grade: 'Khối 12',
    duration: '24:15',
    views: '12.4K',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    description: 'Phân tích ma trận đề thi mẫu 2025 theo chuẩn GDPT 2018 của Bộ GD&ĐT. Hướng dẫn cách phân bổ thời gian cho phần trắc nghiệm 4 lựa chọn, phần đúng/sai và phần điền đáp án ngắn.',
    keyTakeaways: [
      'Nắm chắc 4 cấp độ nhận thức: Nhận biết, Thông hiểu, Vận dụng và Vận dụng cao.',
      'Dạng câu Đúng/Sai: Phải tính toán kỹ từng ý vì điểm số tăng lũy tiến (0.1đ -> 0.25đ -> 0.5đ -> 1.0đ).',
      'Phần trả lời ngắn: Tuyệt đối không được làm tròn sai quy ước.'
    ],
    recommendedNotes: [
      { time: '02:30', note: 'Phân tích sự khác biệt giữa cấu trúc cũ và cấu trúc GDPT 2018.' },
      { time: '11:45', note: 'Mẹo tối ưu điểm số phần câu hỏi Đúng/Sai.' },
      { time: '19:20', note: 'Quy tắc bấm máy tính Casio dạng điền kết quả ngắn.' }
    ]
  },
  {
    id: 'vid_exam_02',
    youtubeId: '8jPO3vRhdFI',
    embedUrl: 'https://www.youtube.com/embed/8jPO3vRhdFI',
    title: 'Bí Quyết Viết Đoạn Văn Nghị Luận Xã Hội 200 Chữ Đạt Điểm Tối Đa',
    channel: 'Tổ Ngữ Văn - THPT Cao Bá Quát',
    category: 'exam_prep',
    targetAudience: 'student',
    grade: 'Khối 10, 11, 12',
    duration: '18:50',
    views: '9.8K',
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
    description: 'Cách triển khai cấu trúc đoạn văn 200 chữ: Mở đoạn ấn tượng, Giải thích, Bàn luận & Phân tích dẫn chứng thực tế, Bài học nhận thức và hành động của bản thân.',
    keyTakeaways: [
      'Không viết thành bài văn thu nhỏ, phải giữ nguyên một đoạn văn liền mạch.',
      'Dẫn chứng phải mang tính thời sự, tích cực và có chiều sâu nhân văn.',
      'Rút ra liên hệ bản thân chân thành, tránh sáo rỗng giáo điều.'
    ],
    recommendedNotes: [
      { time: '03:10', note: 'Công thức mở đoạn trực tiếp 1-2 câu.' },
      { time: '08:40', note: 'Cách chọn dẫn chứng người thật việc thật thuyết phục.' },
      { time: '15:10', note: 'Các lỗi trừ điểm ngữ pháp và diễn đạt thường gặp.' }
    ]
  },
  {
    id: 'vid_exam_03',
    youtubeId: 'W6NZfCO5SIk',
    embedUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
    title: 'Giải Mã Cụm Động Từ & Idioms Tiếng Anh Hay Xuất Hiện Trong Đề Thi THPT',
    channel: 'Tổ Tiếng Anh THPT',
    category: 'exam_prep',
    targetAudience: 'student',
    grade: 'Khối 12',
    duration: '22:30',
    views: '15.2K',
    thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
    description: 'Tổng hợp 50 Phrasal Verbs và Idioms phổ biến nhất giúp học sinh chinh phục điểm 9+ môn Tiếng Anh trong kỳ thi Tốt nghiệp THPT.',
    keyTakeaways: [
      'Học cụm từ theo ngữ cảnh câu chuyện, không học thuộc lòng danh sách rời rạc.',
      'Phân biệt Phrasal Verbs có thể tách rời và không thể tách rời.',
      'Luyện kỹ năng đoán nghĩa từ vựng qua tiền tố, hậu tố và văn cảnh.'
    ],
    recommendedNotes: [
      { time: '04:15', note: 'Cụm từ liên quan đến chủ đề Education & Career.' },
      { time: '14:00', note: 'Các bẫy ngữ pháp thường gặp trong phần điền từ.' }
    ]
  },

  // 2. Phương Pháp Học Tập Khoa Học
  {
    id: 'vid_study_01',
    youtubeId: 'tkm0PcU4B1o',
    embedUrl: 'https://www.youtube.com/embed/tkm0PcU4B1o',
    title: 'Kỹ Thuật Feynman: Phương Pháp Học Nhanh & Nhớ Lâu Nhất Thế Giới',
    channel: 'Khoa Học Học Tập & Trí Tuệ Não Bộ',
    category: 'study_methods',
    targetAudience: 'all',
    grade: 'Mọi Khối Lớp',
    duration: '11:20',
    views: '45.1K',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    description: 'Nhà vật lý đoạt giải Nobel Richard Feynman đã chứng minh: Bạn chỉ thực sự hiểu một khái niệm khi có thể giải thích nó cho một đứa trẻ 10 tuổi hiểu.',
    keyTakeaways: [
      'Bước 1: Chọn khái niệm bạn muốn học và viết tên nó lên đầu trang giấy.',
      'Bước 2: Giải thích khái niệm bằng từ ngữ bình dân, đơn giản nhất như đang dạy lại người khác.',
      'Bước 3: Nhận diện lỗ hổng kiến thức khi bị ngập ngừng và mở sách ôn lại.',
      'Bước 4: Đơn giản hóa và sử dụng hình ảnh ẩn dụ (Metaphor).'
    ],
    recommendedNotes: [
      { time: '01:50', note: 'Nguyên lý bẫy hiểu ảo giác (Illusion of Competence).' },
      { time: '05:30', note: 'Thực hành áp dụng Feynman vào môn Toán / Vật Lý.' },
      { time: '09:10', note: 'Cách biến kiến thức thành câu chuyện thú vị.' }
    ]
  },
  {
    id: 'vid_study_02',
    youtubeId: 'Z-zNHHpXoMM',
    embedUrl: 'https://www.youtube.com/embed/Z-zNHHpXoMM',
    title: 'Phương Pháp Lặp Lại Ngắt Quãng (Spaced Repetition) & Active Recall',
    channel: 'Phát Triển Bản Thân Học Đường',
    category: 'study_methods',
    targetAudience: 'student',
    grade: 'Mọi Khối Lớp',
    duration: '14:40',
    views: '32.6K',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    description: 'Cách đường cong quên lãng của Hermann Ebbinghaus hoạt động và bí quyết ôn thi không bao giờ quên kiến thức bằng Flashcard và kiểm tra chủ động.',
    keyTakeaways: [
      'Đọc lại thụ động (Passive Re-reading) là cách học tốn thời gian mà ít hiệu quả nhất.',
      'Chủ động truy xuất (Active Recall): Tự gấp sách lại và viết ra những gì nhớ được.',
      'Lịch ôn tập ngắt quãng tối ưu: Sau 1 ngày -> 3 ngày -> 7 ngày -> 21 ngày.'
    ],
    recommendedNotes: [
      { time: '03:15', note: 'Giải mã đường cong quên lãng não bộ.' },
      { time: '08:45', note: 'Cách ghi chép Cornell để tự kiểm tra kiến thức.' }
    ]
  },
  {
    id: 'vid_study_03',
    youtubeId: 'arj7oStGLkU',
    embedUrl: 'https://www.youtube.com/embed/arj7oStGLkU',
    title: 'Cách Vượt Qua Bệnh Trì Hoãn & Thiết Lập Kỷ Luật Bản Thân (Tim Urban)',
    channel: 'TED-Ed & Kỹ Năng K12',
    category: 'study_methods',
    targetAudience: 'all',
    grade: 'Mọi Khối Lớp',
    duration: '14:03',
    views: '88.3K',
    thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=80',
    description: 'Khám phá cuộc chiến bên trong não bộ giữa Người Lái Thuyền Lý Trí và Chú Khỉ Ham Chơi Tức Thì, cùng phương pháp Quái Vật Hạn Chót (Deadline Monster).',
    keyTakeaways: [
      'Quy tắc 2 phút: Nếu việc gì mất dưới 2 phút, hãy làm nó ngay lập tức.',
      'Chia nhỏ mục tiêu lớn thành các hành động siêu vi mô (Micro-habits).',
      'Tạo môi trường học tập không có điện thoại và thông báo gây xao nhãng.'
    ],
    recommendedNotes: [
      { time: '04:10', note: 'Nguyên nhân vì sao ta trì hoãn những mục tiêu không có hạn chót.' },
      { time: '10:20', note: 'Biểu đồ các tuần trong đời người (Life in Weeks) tạo động lực sâu sắc.' }
    ]
  },

  // 3. Kỹ Năng Sống & Hướng Nghiệp
  {
    id: 'vid_career_01',
    youtubeId: 'qkJ9m7B-4pE',
    embedUrl: 'https://www.youtube.com/embed/qkJ9m7B-4pE',
    title: 'Xu Hướng Nghề Nghiệp 2026 - 2030: Gen Z Nên Chọn Ngành Nào Trong Thời Đại AI?',
    channel: 'Hướng Nghiệp K12 Việt Nam',
    category: 'career_skills',
    targetAudience: 'all',
    grade: 'Khối 11 & 12',
    duration: '21:10',
    views: '28.9K',
    thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
    description: 'Báo cáo việc làm toàn cầu: Những ngành nghề nào sẽ bùng nổ (AI, Năng lượng tái tạo, Y tế số, Bán dẫn) và những công việc lặp lại có nguy cơ bị tự động hóa.',
    keyTakeaways: [
      'AI không thay thế con người, nhưng người biết sử dụng AI sẽ thay thế người không biết.',
      'Kỹ năng tư duy phản biện, sáng tạo và thấu cảm xã hội là thế mạnh bất khả chiến bại.',
      'Mô hình chữ T (T-shaped skills): Giỏi sâu một chuyên ngành và hiểu rộng các lĩnh vực liên đới.'
    ],
    recommendedNotes: [
      { time: '03:40', note: 'Top 5 nhóm ngành tuyển dụng cao nhất 5 năm tới.' },
      { time: '12:20', note: 'Cách chọn trường ĐH: Danh tiếng, học phí, môi trường hay cơ hội thực tập?' }
    ]
  },
  {
    id: 'vid_career_02',
    youtubeId: 'G1j6qP5rB1A',
    embedUrl: 'https://www.youtube.com/embed/G1j6qP5rB1A',
    title: 'Kỹ Năng Thuyết Trình & Tự Tin Nói Trước Đám Đông Cho Học Sinh THPT',
    channel: 'Kỹ Năng Thế Kỷ 21',
    category: 'career_skills',
    targetAudience: 'student',
    grade: 'Khối 10, 11, 12',
    duration: '16:45',
    views: '19.7K',
    thumbnail: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80',
    description: 'Cách làm chủ giọng nói, ánh mắt, ngôn ngữ cơ thể và cấu trúc bài thuyết trình thu hút người nghe trong các buổi thuyết trình dự án học tập trên lớp.',
    keyTakeaways: [
      'Nguyên tắc 10/20/30 khi làm slide PowerPoint / Canva.',
      'Cách hít thở bụng để giữ bình tĩnh trước khi bước lên bục giảng.',
      'Tương tác với khán giả bằng câu hỏi gợi mở thay vì đọc slide một chiều.'
    ],
    recommendedNotes: [
      { time: '02:15', note: 'Xử lý tâm lý hồi hộp khi tim đập nhanh.' },
      { time: '09:30', note: 'Công thức Hook - Story - Call to action.' }
    ]
  },

  // 4. Sức Khỏe Tinh Thần & Chữa Lành
  {
    id: 'vid_mental_01',
    youtubeId: 'inpok4MKVLM',
    embedUrl: 'https://www.youtube.com/embed/inpok4MKVLM',
    title: '5 Phút Thiền Chánh Niệm & Thở Sâu Làm Dịu Cơn Căng Thẳng Học Đường',
    channel: 'Tâm Lý Học Đường & Chữa Lành',
    category: 'mental_health',
    targetAudience: 'all',
    grade: 'Mọi Khối Lớp & GV',
    duration: '05:30',
    views: '54.2K',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    description: 'Bài tập dẫn thiền chánh niệm ngắn 5 phút giúp học sinh và thầy cô giải tỏa áp lực thi cử, thư giãn cơ mắt và ổn định nhịp tim sau giờ học căng thẳng.',
    keyTakeaways: [
      'Chỉ cần 5 phút ngồi thẳng lưng, nhắm mắt và quan sát hơi thở vào ra.',
      'Không cố gắng xua đuổi suy nghĩ, chỉ nhẹ nhàng nhận biết và đưa tâm trí về hiện tại.',
      'Tập luyện đều đặn mỗi sáng hoặc trước khi bắt đầu ca học buổi chiều.'
    ],
    recommendedNotes: [
      { time: '01:00', note: 'Bắt đầu thư giãn từ đỉnh đầu, cơ mặt và vai.' },
      { time: '03:45', note: 'Cảm nhận luồng khí mát lành nuôi dưỡng tế bào não.' }
    ]
  },
  {
    id: 'vid_mental_02',
    youtubeId: '54ryZ38880s',
    embedUrl: 'https://www.youtube.com/embed/54ryZ38880s',
    title: 'Vượt Qua Áp Lực Đồng Trang Lứa (Peer Pressure) & Yêu Thương Bản Thân',
    channel: 'Tổ Tư Vấn Tâm Lý CBQ',
    category: 'mental_health',
    targetAudience: 'student',
    grade: 'Khối 10, 11, 12',
    duration: '15:20',
    views: '18.1K',
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
    description: 'Làm thế nào khi thấy bạn bè xung quanh ai cũng giỏi, đạt học bổng, đoạt giải hoặc có định hướng rõ ràng còn mình vẫn đang loay hoay? Lời khuyên tâm lý hữu ích.',
    keyTakeaways: [
      'Đừng so sánh hậu trường của mình với thước phim lộng lẫy của người khác trên mạng xã hội.',
      'Mỗi bông hoa có một mùa nở rộ riêng biệt; thành công không phải là một đường thẳng cố định.',
      'Học cách trân trọng sự tiến bộ 1% của chính mình so với ngày hôm qua.'
    ],
    recommendedNotes: [
      { time: '03:20', note: 'Nhận diện bẫy so sánh xã hội độc hại (Social Comparison).' },
      { time: '11:15', note: 'Cách xây dựng ranh giới lành mạnh và lòng tự trắc ẩn (Self-Compassion).' }
    ]
  },

  // 5. Góc Sư Phạm & Giáo Viên Đổi Mới
  {
    id: 'vid_teacher_01',
    youtubeId: 'b7A_K9fQ-E0',
    embedUrl: 'https://www.youtube.com/embed/b7A_K9fQ-E0',
    title: 'Ứng Dụng AI (ChatGPT & Canva) Trong Soạn Kế Hoạch Bài Dạy Chuẩn Công Văn 5512',
    channel: 'Cộng Đồng Giáo Viên Sáng Tạo 4.0',
    category: 'teacher_pd',
    targetAudience: 'teacher',
    grade: 'Dành Cho Giáo Viên',
    duration: '26:40',
    views: '35.4K',
    thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    description: 'Cách viết câu lệnh (Prompt) chuẩn để AI hỗ trợ xây dựng mục tiêu 3 phần (Kiến thức, Năng lực, Phẩm chất) và 4 hoạt động dạy học tích cực theo CV 5512 BGDĐT.',
    keyTakeaways: [
      'Công thức Prompt 4 bước: Vai trò - Bối cảnh - Yêu cầu cấu trúc 5512 - Tiêu chí kiểm tra.',
      'Sử dụng Canva Magic Design để tạo phiếu học tập và slide bài giảng sinh động trong 5 phút.',
      'Giáo viên giữ vai trò phản biện, chọn lọc và thẩm định tính sư phạm của nội dung AI tạo ra.'
    ],
    recommendedNotes: [
      { time: '04:30', note: 'Mẫu prompt chuẩn tạo bảng ma trận tiêu chí đánh giá năng lực.' },
      { time: '14:20', note: 'Tự động hóa chuyển đổi nội dung thành trò chơi trắc nghiệm tương tác.' }
    ]
  },
  {
    id: 'vid_teacher_02',
    youtubeId: 'V9P_32oY8uM',
    embedUrl: 'https://www.youtube.com/embed/V9P_32oY8uM',
    title: 'Nghệ Thuật Quản Lý Lớp Học Tích Cực & Xử Lý Tình Huống Sư Phạm Tinh Tế',
    channel: 'Học Viện Quản Lý Giáo Dục',
    category: 'teacher_pd',
    targetAudience: 'teacher',
    grade: 'Dành Cho GVCN & GVBM',
    duration: '23:15',
    views: '22.8K',
    thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
    description: 'Kỷ luật tích cực không nước mắt: Cách tạo dựng quy ước lớp học đồng thuận, lắng nghe chủ động và đồng hành cùng học sinh cá biệt bằng tình yêu thương và sự thấu cảm.',
    keyTakeaways: [
      'Tách rời hành vi sai trái khỏi giá trị nhân cách của học sinh.',
      'Nguyên tắc khen ngợi công khai trước lớp, nhưng nhắc nhở và kỷ luật riêng tư 1-1.',
      'Phối hợp nhịp nhàng giữa Nhà trường - Gia đình - Ban cán sự lớp.'
    ],
    recommendedNotes: [
      { time: '05:10', note: '3 bước xử lý học sinh chống đối trong giờ học mà không làm mất hòa khí.' },
      { time: '17:40', note: 'Cách tổ chức giờ sinh hoạt lớp sáng tạo, không biến thành buổi phê bình.' }
    ]
  }
];

export const AMBIENT_SOUNDS = [
  { id: 'rain', label: 'Tiếng Mưa Rơi', icon: 'CloudRain', color: '#38bdf8', desc: 'Làm dịu tâm trí, chặn tiếng ồn xung quanh' },
  { id: 'waves', label: 'Sóng Biển Êm Đềm', icon: 'Waves', color: '#0284c7', desc: 'Nhịp điệu tự nhiên giúp hơi thở đều đặn' },
  { id: 'campfire', label: 'Lửa Trại Ấm Áp', icon: 'Flame', color: '#f97316', desc: 'Tiếng lách tách thư thái, ấm cúng khi học đêm' },
  { id: 'alpha', label: 'Sóng Não Alpha (10Hz)', icon: 'Activity', color: '#8b5cf6', desc: 'Tần số tối ưu cho sự tập trung sâu và tiếp thu nhanh' }
];
