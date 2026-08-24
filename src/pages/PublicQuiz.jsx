import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Clock, CheckCircle2, Award, Sparkles, Send, ArrowRight, RotateCcw, Medal } from 'lucide-react';

const DEFAULT_SAMPLE_QUESTIONS = [
  {
    question_text: "Câu 1. Trường THPT Cao Bá Quát được thành lập vào năm nào?",
    question_type: "multiple_choice",
    options: ["1994", "1996", "1998", "2000"],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Câu 2. Số điện thoại của trường THPT Cao Bá Quát hiện tại là số nào?",
    question_type: "multiple_choice",
    options: ["02623.863043", "02623.868686", "02623.867899", "02623.456789"],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 3. Trường THPT Cao Bá Quát tọa lạc trên vùng ngoại ô của thành phố nào (theo tên gọi cũ)?",
    question_type: "multiple_choice",
    options: ["Thành phố Buôn Ma Thuột", "Thành phố Pleiku", "Thành phố Đà Lạt", "Thành phố Nha Trang"],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 4. Tên gọi ban đầu của nhà trường là gì?",
    question_type: "multiple_choice",
    options: [
      "Trường THCS Cao Bá Quát",
      "Trường Phổ thông cấp II - III Cao Bá Quát",
      "Trường THPT Cao Bá Quát",
      "Trường Phổ thông Dân tộc nội trú Cao Bá Quát"
    ],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Câu 5. Ai là Hiệu trưởng đầu tiên của Trường THPT Cao Bá Quát?",
    question_type: "multiple_choice",
    options: ["Nguyễn Hoa Nam", "Nguyễn Thành Công", "Lê Văn Kiệt", "Lê Thị Thảo"],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 6. Hiệu trưởng hiện tại của nhà trường là ai?",
    question_type: "multiple_choice",
    options: ["Nguyễn Thành Công", "Lê Văn Kiệt", "Nguyễn Hoa Nam", "Lê Thị Thảo"],
    correct_option_index: 3,
    points: 10
  },
  {
    question_text: "Câu 7. Slogan của Trường THPT Cao Bá Quát là gì?",
    question_type: "multiple_choice",
    options: [
      "Sáng tạo - Kỷ cương - Nhân văn - Vươn xa",
      "Tự hào truyền thống - Vững bước vươn xa",
      "Đoàn kết - Sáng tạo - Hội nhập - Thành công",
      "Dạy tốt - Học tốt - Vươn tới tương lai"
    ],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Câu 8. Tổng số giáo viên hiện tại của nhà trường là bao nhiêu?",
    question_type: "multiple_choice",
    options: ["73", "78", "83", "88"],
    correct_option_index: 2,
    points: 10
  },
  {
    question_text: "Câu 9. Năm học 2026 – 2027, trường THPT Cao Bá Quát có tổng số lớp là bao nhiêu?",
    question_type: "multiple_choice",
    options: ["32", "33", "34", "35"],
    correct_option_index: 2,
    points: 10
  },
  {
    question_text: "Câu 10. Tỷ lệ đậu tốt nghiệp của nhà trường trong năm học 2025–2026 là bao nhiêu?",
    question_type: "multiple_choice",
    options: ["98%", "99%", "99,5%", "100%"],
    correct_option_index: 3,
    points: 10
  },
  {
    question_text: "Câu 11. Số lượng học sinh đạt học sinh giỏi tỉnh trong năm học 2025–2026 là bao nhiêu?",
    question_type: "multiple_choice",
    options: ["24", "25", "27", "30"],
    correct_option_index: 2,
    points: 10
  },
  {
    question_text: "Câu 12. Ai là Hiệu trưởng thứ hai của trường THPT Cao Bá Quát?",
    question_type: "multiple_choice",
    options: ["Nguyễn Hoa Nam", "Nguyễn Thành Công", "Lê Văn Kiệt", "Lê Thị Thảo"],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Câu 13. Tổng số lớp cấp III (THPT) năm 1996 của trường là bao nhiêu?",
    question_type: "multiple_choice",
    options: ["01", "02", "03", "04"],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Câu 14. Khi mới thành lập, quy mô đào tạo của Trường Phổ thông cấp II - III Cao Bá Quát được xác định trong khoảng nào?",
    question_type: "multiple_choice",
    options: ["600 - 800 học sinh", "800 - 1.000 học sinh", "1.000 - 1.200 học sinh", "1.200 - 1.500 học sinh"],
    correct_option_index: 3,
    points: 10
  },
  {
    question_text: "Câu 15. Những ngày đầu hoạt động, nhà trường tận dụng cơ sở vật chất cũ của đơn vị nào?",
    question_type: "multiple_choice",
    options: [
      "Trường Trung học Nông Lâm nghiệp tỉnh",
      "Trường Cao đẳng Sư phạm Đắk Lắk",
      "Trường THPT Buôn Ma Thuột",
      "Trung tâm Giáo dục thường xuyên tỉnh"
    ],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 16. Không gian sư phạm của nhà trường hiện rộng hơn bao nhiêu m²?",
    question_type: "multiple_choice",
    options: ["12.000 m²", "22.000 m²", "32.000 m²", "42.000 m²"],
    correct_option_index: 2,
    points: 10
  },
  {
    question_text: "Câu 17. Nhà trường hiện có bao nhiêu phòng học kiên cố?",
    question_type: "multiple_choice",
    options: ["27 phòng", "32 phòng", "37 phòng", "42 phòng"],
    correct_option_index: 2,
    points: 10
  },
  {
    question_text: "Câu 18. Tỷ lệ giáo viên đạt chuẩn của trường THPT Cao Bá Quát là bao nhiêu?",
    question_type: "multiple_choice",
    options: ["95%", "97%", "98,5%", "100%"],
    correct_option_index: 3,
    points: 10
  },
  {
    question_text: "Câu 19. Tỷ lệ giáo viên đạt trình độ trên chuẩn của nhà trường là mức nào?",
    question_type: "multiple_choice",
    options: ["Hơn 21,7%", "Hơn 26,7%", "Hơn 31,7%", "Hơn 41,7%"],
    correct_option_index: 2,
    points: 10
  },
  {
    question_text: "Câu 20. Phương châm xây dựng môi trường giáo dục của trường THPT Cao Bá Quát là gì?",
    question_type: "multiple_choice",
    options: [
      "Sáng tạo - Kỷ cương - Nhân văn - Vươn xa",
      "Tự hào truyền thống - Vững bước vươn xa",
      "Trách nhiệm - Đoàn kết - Hội nhập - Thành công",
      "Kỷ luật - Tự tin - Hợp tác - Phát triển"
    ],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 21. Phương án nào sắp xếp đúng thứ tự các đời Hiệu trưởng từ đầu tiên đến hiện tại?",
    question_type: "multiple_choice",
    options: [
      "Nguyễn Hoa Nam → Nguyễn Thành Công → Lê Văn Kiệt → Huỳnh Thị Kim Huệ → Lê Thị Thảo",
      "Nguyễn Hoa Nam → Lê Văn Kiệt → Nguyễn Thành Công → Huỳnh Thị Kim Huệ → Lê Thị Thảo",
      "Nguyễn Thành Công → Nguyễn Hoa Nam → Lê Văn Kiệt → Lê Thị Thảo → Huỳnh Thị Kim Huệ",
      "Nguyễn Hoa Nam → Nguyễn Thành Công → Huỳnh Thị Kim Huệ → Lê Văn Kiệt → Lê Thị Thảo"
    ],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 22. Trong những ngày đầu xây dựng trường, hoạt động nào dưới đây phản ánh đúng nỗ lực của thầy và trò trường THPT Cao Bá Quát?",
    question_type: "multiple_choice",
    options: [
      "Chỉ tập trung tuyển sinh, chưa cải tạo cơ sở vật chất",
      "Vừa dạy và học, vừa cải tạo phòng học, mua sắm trang thiết bị, trồng cây xanh",
      "Chuyển toàn bộ hoạt động sang cơ sở thuê bên ngoài",
      "Tạm dừng giảng dạy để xây dựng cơ sở mới hoàn toàn"
    ],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Câu 23. Phương án nào mô tả đúng nhất hệ thống cơ sở vật chất hiện tại của trường THPT Cao Bá Quát?",
    question_type: "multiple_choice",
    options: [
      "37 phòng học kiên cố; phòng thực hành Lý - Hóa - Sinh; phòng tin học; phòng ngoại ngữ; nhà đa năng và khu thể dục thể thao",
      "25 phòng học; chỉ có phòng tin học và thư viện",
      "45 phòng học; không có phòng thực hành chuyên môn",
      "30 phòng học; chỉ có nhà đa năng và sân vận động"
    ],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 24. Phương châm xây dựng môi trường giáo dục của trường THPT Cao Bá Quát là gì?",
    question_type: "multiple_choice",
    options: [
      "“Tự hào truyền thống - Vững bước vươn xa”",
      "“Sáng tạo - Kỷ cương - Nhân văn - Vươn xa”",
      "“Học, học nữa, học mãi”",
      "“Sáng tạo - Kỷ cương – Tình thương – Trách nhiệm”"
    ],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Câu 25. Cao Bá Quát sống trong khoảng thời gian nào và quê ở đâu?",
    question_type: "multiple_choice",
    options: [
      "1809-1855; làng Phú Thị, huyện Gia Lâm, tỉnh Bắc Ninh, nay thuộc Hà Nội",
      "1788-1858; làng Tiên Điền, Hà Tĩnh",
      "1810-1870; làng Vị Xuyên, Nam Định",
      "1802-1862; làng Mộ Trạch, Hải Dương"
    ],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 26. Tự và hiệu của Cao Bá Quát là gì?",
    question_type: "multiple_choice",
    options: [
      "Tự Chu Thần; hiệu Cúc Đường và Mẫn Hiên",
      "Tự Tố Như; hiệu Thanh Hiên",
      "Tự Hy Văn; hiệu Uy Viễn",
      "Tự Mộng Liên; hiệu Bạch Vân"
    ],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 27. Cao Bá Quát được người đời tôn xưng là gì?",
    question_type: "multiple_choice",
    options: ["Thánh Quát", "Trạng Trình", "Thi Thánh", "La Sơn Phu Tử"],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 28. Năm 1832, Cao Bá Quát đạt thành tích nào tại trường thi Hà Nội?",
    question_type: "multiple_choice",
    options: ["Đỗ Tiến sĩ", "Đỗ Á Nguyên", "Đỗ Trạng nguyên", "Đỗ Phó bảng"],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Câu 29. Khi quyết tâm học tập và luyện chữ, Cao Bá Quát đã làm gì để tự rèn ý chí, không bỏ cuộc?",
    question_type: "multiple_choice",
    options: [
      "Buộc tóc lên xà nhà để chống buồn ngủ và buộc chân vào cạnh bàn để tự nhắc mình không bỏ cuộc",
      "Chỉ luyện viết vào ban ngày và dừng học khi cảm thấy mệt",
      "Nhờ người khác viết hộ để dành thời gian học văn thơ",
      "Chỉ đọc sách mà không luyện chữ vì cho rằng chữ viết không quan trọng"
    ],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "Câu 30. Câu nói nào thường được nhắc đến khi nói về khí phách của Cao Bá Quát?",
    question_type: "multiple_choice",
    options: [
      "“Nhất sinh đê thủ bái mai hoa”",
      "“Nhất sinh đê thủ bái liên hoa”",
      "“Nhất sinh ngẩng thủ bái mai hoa”",
      "“Nhất thế đê thủ bái mai hoa”"
    ],
    correct_option_index: 0,
    points: 10
  },
  {
    question_text: "[PHẦN IV: CÂU DỰ ĐOÁN XẾP HẠNG] Theo bạn, có bao nhiêu thí sinh tham gia cuộc thi sẽ trả lời đúng cả 30/30 câu hỏi?",
    question_type: "essay",
    options: [],
    correct_option_index: 0,
    points: 30
  }
];

export default function PublicQuiz() {
  const [step, setStep] = useState('welcome'); // 'welcome' | 'quiz' | 'result'
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student Info
  const [studentName, setStudentName] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [studentPhone, setStudentPhone] = useState('');

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { question_id: option_index }
  const [essayAnswer, setEssayAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes = 900 seconds
  const [startTime, setStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Result State
  const [finalScore, setFinalScore] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('result'); // 'result' | 'leaderboard' | 'review'

  // Contest Config State
  const [quizConfig, setQuizConfig] = useState(null);

  const timerRef = useRef(null);

  // Autocomplete State
  const [allStudents, setAllStudents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchLeaderboard();
    fetchQuizConfig();
    fetchAllStudents();
  }, []);

  async function fetchAllStudents() {
    try {
      let data = [];
      let from = 0;
      let fetchMore = true;
      while (fetchMore) {
        const res = await supabase.from('cbq_students').select('student_name, student_class, student_code').range(from, from + 999);
        if (res.error) break;
        if (res.data && res.data.length > 0) {
          data = [...data, ...res.data];
          from += 1000;
          if (res.data.length < 1000) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }
      setAllStudents(data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleNameChange = (e) => {
    const val = e.target.value;
    setStudentName(val);

    if (val.trim().length > 1) {
      const searchStr = val.toLowerCase();
      const matches = allStudents.filter(s => s.student_name && s.student_name.toLowerCase().includes(searchStr)).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (student) => {
    setStudentName(student.student_name);
    setStudentGroup(student.student_class ? `Lớp ${student.student_class}` : '');
    setStudentCode(student.student_code || '');
    setShowSuggestions(false);
  };

  async function fetchQuizConfig() {
    try {
      const { data } = await supabase.from('cbq_quizzes').select('*').limit(1);
      if (data && data.length > 0) {
        setQuizConfig(data[0]);
      }
    } catch (err) {
      console.error("Lỗi tải cấu hình cuộc thi:", err);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (step === 'quiz' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitQuiz(true); // Auto-submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step, timeLeft]);

  const parseOptions = (opts) => {
    if (Array.isArray(opts)) return opts;
    if (typeof opts === 'string') {
      try {
        const p = JSON.parse(opts);
        if (Array.isArray(p)) return p;
      } catch (e) { }
    }
    return [];
  };

  async function fetchQuestions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_quiz_questions')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        const parsed = data.map(q => ({
          ...q,
          options: parseOptions(q.options)
        }));
        setQuestions(parsed);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Lỗi tải câu hỏi thi:", err);
    } finally {
      setLoading(false);
    }
  };

  async function fetchLeaderboard() {
    try {
      const { data } = await supabase
        .from('cbq_quiz_submissions')
        .select('*')
        .order('total_score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .limit(20);

      if (data) setLeaderboard(data);
    } catch (err) {
      console.error("Lỗi tải bảng xếp hạng:", err);
    }
  };

  const handleSeedDefaultQuestions = async () => {
    try {
      setLoading(true);
      // Create quiz container first if needed
      let quizId = null;
      const quizRes = await supabase.from('cbq_quizzes').select('*').limit(1);
      if (quizRes.data && quizRes.data.length > 0) {
        quizId = quizRes.data[0].id;
      } else {
        const newQuiz = await supabase.from('cbq_quizzes').insert([{
          title: "Cuộc Thi Tìm Hiểu 30 Năm Thành Lập Trường THPT Cao Bá Quát",
          description: "Hành trình 30 năm chắp cánh ước mơ (1996 - 2026)",
          time_limit_minutes: 15
        }]).select().single();
        if (newQuiz.data) quizId = newQuiz.data.id;
      }

      const formatted = DEFAULT_SAMPLE_QUESTIONS.map((q, idx) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_option_index: q.correct_option_index,
        points: q.points,
        order_index: idx
      }));

      await supabase.from('cbq_quiz_questions').insert(formatted);
      fetchQuestions();
      alert("Đã khởi tạo bộ câu hỏi thi kỷ niệm 30 năm thành công!");
    } catch (err) {
      alert("Lỗi tạo câu hỏi mẫu: " + err.message);
      setLoading(false);
    }
  };

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert("Vui lòng nhập Họ và Tên của bạn.");
      return;
    }

    const cleanPhone = studentPhone.trim().replace(/\s+/g, '');

    if (!cleanPhone) {
      alert("Vui lòng nhập Số Điện Thoại liên hệ để Ban Tổ Chức có thể liên hệ trao giải khi bạn đạt giải.");
      return;
    }

    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(cleanPhone)) {
      alert("Số điện thoại không hợp lệ. Vui lòng nhập đúng số điện thoại 10 số của Việt Nam (VD: 0987654321).");
      return;
    }

    if (!studentCode) {
      alert("Vui lòng chọn đúng tên của bạn từ danh sách gợi ý để hệ thống ghi nhận Mã Học Sinh.");
      return;
    }

    // CHECK IF THIS STUDENT CODE HAS ALREADY COMPLETED A SUBMISSION
    try {
      const { data: existingSubmissions, error: checkError } = await supabase
        .from('cbq_quiz_submissions')
        .select('id, student_name, created_at')
        .eq('student_code', studentCode);

      if (!checkError && existingSubmissions && existingSubmissions.length > 0) {
        const prevSub = existingSubmissions[0];
        const dateStr = prevSub.created_at ? new Date(prevSub.created_at).toLocaleString('vi-VN') : '';
        alert(`⚠️ MÃ HỌC SINH ĐÃ THAM GIA THI!\n\nMã học sinh "${studentCode}" (Thí sinh: ${prevSub.student_name}) đã hoàn thành 01 lượt thi vào lúc ${dateStr}.\n\nTheo quy định của Ban Tổ Chức, mỗi mã học sinh chỉ được phép tham gia thi 01 LẦN DUY NHẤT.`);
        return;
      }
    } catch (err) {
      console.error("Lỗi kiểm tra trùng mã học sinh:", err);
    }

    if (quizConfig && quizConfig.is_active === false) {
      alert("Cuộc thi hiện đang tạm dừng nhận bài làm. Vui lòng liên hệ Ban Tổ Chức.");
      return;
    }

    const now = new Date();
    if (quizConfig && quizConfig.start_time && new Date(quizConfig.start_time) > now) {
      const startStr = new Date(quizConfig.start_time).toLocaleString('vi-VN');
      alert(`Cuộc thi chưa mở! Vui lòng quay lại lúc ${startStr}.`);
      return;
    }

    if (quizConfig && quizConfig.end_time && new Date(quizConfig.end_time) < now) {
      const endStr = new Date(quizConfig.end_time).toLocaleString('vi-VN');
      alert(`Cuộc thi đã kết thúc nhận bài vào lúc ${endStr}.`);
      return;
    }

    if (questions.length === 0) {
      alert("Hiện chưa có câu hỏi thi nào. Vui lòng liên hệ Ban Tổ Chức.");
      return;
    }

    const durationMins = Number(quizConfig?.time_limit_minutes) || 15;
    setStep('quiz');
    setStartTime(Date.now());
    setTimeLeft(durationMins * 60);
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async (isAuto = false) => {
    if (submitting) return;
    if (!isAuto && !window.confirm("Bạn có chắc chắn muốn hoàn thành và nộp bài thi?")) return;

    setSubmitting(true);
    clearInterval(timerRef.current);

    const now = Date.now();
    const secondsTaken = Math.max(1, Math.floor((now - (startTime || now)) / 1000));
    setTimeTaken(secondsTaken);

    // Calculate score
    let autoScore = 0;
    questions.forEach(q => {
      if (q.question_type === 'multiple_choice') {
        const userChoice = selectedAnswers[q.id];
        if (userChoice !== undefined && userChoice === q.correct_option_index) {
          autoScore += (q.points || 10);
        }
      }
    });

    setFinalScore(autoScore);

    try {
      await supabase.from('cbq_quiz_submissions').insert([{
        student_name: studentName.trim(),
        student_group: studentGroup.trim() || 'Học sinh / Cựu học sinh',
        student_code: studentCode,
        phone: studentPhone.trim(),
        score: autoScore,
        total_score: autoScore,
        answers: selectedAnswers,
        essay_answer: essayAnswer.trim(),
        time_taken_seconds: secondsTaken,
        is_graded: false
      }]);

      await fetchLeaderboard();
      setStep('result');
    } catch (err) {
      console.error("Lỗi lưu bài nộp:", err);
      setStep('result');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const nowTime = new Date();
  let lockReason = null;
  if (quizConfig) {
    if (quizConfig.is_active === false) lockReason = "Cuộc thi hiện đang tạm dừng.";
    else if (quizConfig.start_time && new Date(quizConfig.start_time) > nowTime) {
      lockReason = `Cuộc thi sẽ mở vào lúc ${new Date(quizConfig.start_time).toLocaleString('vi-VN')}`;
    }
    else if (quizConfig.end_time && new Date(quizConfig.end_time) < nowTime) {
      lockReason = `Cuộc thi đã kết thúc vào lúc ${new Date(quizConfig.end_time).toLocaleString('vi-VN')}`;
    }
  }
  const isLocked = lockReason !== null;

  return (
    <div style={styles.container}>
      {/* WELCOME / ENTRY SCREEN */}
      {step === 'welcome' && (
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={styles.badge}>
              🏆 CUỘC THI TRỰC TUYẾN
            </div>
            <h1 style={styles.title}>{quizConfig?.title || 'CUỘC THI 1: "CAO BÁ QUÁT - 30 NĂM CHẮP CÁNH ƯỚC MƠ"'}</h1>
            <p style={styles.subtitle}>
              {quizConfig?.description || 'Cuộc thi tìm hiểu lịch sử, truyền thống và thành tựu Trường THPT Cao Bá Quát hướng tới Lễ Kỷ Niệm 30 Năm Ngày Thành Lập.'}
            </p>
          </div>

          {/* CHUYÊN GIA TỔ CHỨC: BẢNG THỂ LỆ & QUY CHẾ THI CHUẨN MỰC */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '18px 20px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 'bold', fontSize: '15.5px', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              <Award size={20} color="#be123c" /> THỂ LỆ & QUY CHẾ CHÍNH THỨC TỪ BAN TỔ CHỨC
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13.5px', color: '#334155' }}>
              <div><strong>⏱️ Thời gian làm bài:</strong> {quizConfig?.time_limit_minutes || 15} Phút</div>
              <div><strong>📝 Cấu trúc đề thi:</strong> {questions.length > 0 ? questions.length : '30'} Câu</div>
              <div><strong>🎯 Câu dự đoán xếp hạng:</strong> Dự đoán số người tham gia câu số 31</div>
              <div><strong>🔒 Quy định an toàn:</strong> Mỗi Học Sinh (Mã HS) chỉ thi 01 LẦN DUY NHẤT</div>
            </div>

            {/* Tạm ẩn phần cơ cấu giải thưởng theo yêu cầu
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '13px', color: '#166534', fontWeight: 'bold' }}>
              🎁 Cơ cấu Giải Thưởng: 01 Giải Đặc Biệt • 01 Giải Nhất • 02 Giải Nhì • 03 Giải Ba • 10 Giải Khuyến Khích & 01 Giải Tập Thể Đông Thí Sinh Nhất.
            </div>
            */}
          </div>

          <form onSubmit={handleStartQuiz} style={{ maxWidth: '440px', margin: '0 auto' }}>
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <label style={styles.label}>Họ và Tên Thí Sinh *</label>
              <input
                type="text"
                required
                disabled={isLocked}
                placeholder="VD: Nguyễn Văn An"
                value={studentName}
                onChange={handleNameChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                style={{ ...styles.input, backgroundColor: isLocked ? '#f1f5f9' : 'white', cursor: isLocked ? 'not-allowed' : 'text' }}
              />

              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', zIndex: 10, marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', overflow: 'hidden' }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectSuggestion(s)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{s.student_name}</span>
                      <span style={{ fontSize: '12px', color: '#be123c', background: '#fff1f2', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{s.student_class}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Lớp / Niên Khóa / Đơn Vị *</label>
              <input
                type="text"
                required
                readOnly
                placeholder="VD: Lớp 12A1 (sẽ tự động điền)"
                value={studentGroup}
                onChange={e => setStudentGroup(e.target.value)}
                style={{ ...styles.input, backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
                title="Lớp sẽ tự động điền khi bạn chọn tên từ danh sách gợi ý"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Số Điện Thoại Liên Hệ (*) (Để Ban Tổ Chức liên hệ trao giải)</label>
              <input
                type="tel"
                required
                disabled={isLocked}
                placeholder="VD: 0987 654 321 hoặc 0975609590"
                value={studentPhone}
                onChange={e => setStudentPhone(e.target.value)}
                style={{ ...styles.input, backgroundColor: isLocked ? '#f1f5f9' : 'white', cursor: isLocked ? 'not-allowed' : 'text' }}
              />
            </div>

            {isLocked && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #f87171' }}>
                🔒 {lockReason}
              </div>
            )}

            <button type="submit" disabled={isLocked} style={{ ...styles.startBtn, opacity: isLocked ? 0.6 : 1, cursor: isLocked ? 'not-allowed' : 'pointer', background: isLocked ? '#94a3b8' : (styles.startBtn?.background || '#be123c') }}>
              {isLocked ? '🔒 CHƯA THỂ LÀM BÀI' : '🚀 BẮT ĐẦU LÀM BÀI THI'} {!isLocked && <ArrowRight size={20} />}
            </button>

            {questions.length === 0 && !loading && (
              <button
                type="button"
                onClick={handleSeedDefaultQuestions}
                style={{ ...styles.seedBtn, width: '100%', marginTop: '15px' }}
              >
                <Sparkles size={18} /> Khởi Tạo 6 Câu Hỏi Mẫu Kỷ Niệm 30 Năm
              </button>
            )}
          </form>
        </div>
      )}

      {/* QUIZ TAKING SCREEN */}
      {step === 'quiz' && questions[currentQuestionIndex] && (
        <div style={styles.card}>
          {/* HEADER TIMER & PROGRESS */}
          <div style={styles.quizHeader}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>
                Câu {currentQuestionIndex + 1} / {questions.length}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>
                Thí sinh: {studentName} ({studentGroup})
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: timeLeft < 120 ? '#fee2e2' : '#fff7ed', color: timeLeft < 120 ? '#dc2626' : '#c2410c', padding: '8px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', border: '1px solid #fde047' }}>
              <Clock size={20} /> {formatTime(timeLeft)}
            </div>
          </div>

          {/* QUESTION CONTENT */}
          {(() => {
            const q = questions[currentQuestionIndex];
            const isPrediction = q.question_type === 'essay' ||
              (q.question_text && (
                q.question_text.toLowerCase().includes('dự đoán') ||
                q.question_text.toLowerCase().includes('bao nhiêu')
              ));
            const optionsList = parseOptions(q.options);

            return (
              <div style={{ margin: '20px 0' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #be123c', marginBottom: '20px' }}>
                  <span style={{ background: isPrediction ? '#ca8a04' : '#be123c', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', marginRight: '8px' }}>
                    {isPrediction ? 'Dự Đoán Phụ Xếp Hạng' : `Trắc Nghiệm (${q.points || 10} điểm)`}
                  </span>
                  <h3 style={{ fontSize: '17px', color: '#0f172a', margin: '8px 0 0 0', lineHeight: '1.5' }}>
                    {q.question_text}
                  </h3>
                </div>

                {/* OPTIONS FOR MULTIPLE CHOICE */}
                {q.question_type === 'multiple_choice' && optionsList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {optionsList.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[q.id || currentQuestionIndex] === oIdx;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleSelectOption(q.id || currentQuestionIndex, oIdx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid #be123c' : '1px solid #e2e8f0',
                            background: isSelected ? '#fff1f2' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(190,18,60,0.12)' : 'none'
                          }}
                        >
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: isSelected ? '#be123c' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#475569',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '13px'
                          }}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <div style={{ fontSize: '15px', color: isSelected ? '#881337' : '#334155', fontWeight: isSelected ? 'bold' : 'normal', flex: 1 }}>
                            {opt}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ESSAY / TIE-BREAKER PREDICTION INPUT */
                  <div style={{ background: '#fefce8', border: '2px dashed #eab308', padding: '20px', borderRadius: '16px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#854d0e', fontWeight: 'bold', fontSize: '15px', marginBottom: '10px' }}>
                      <Sparkles size={20} color="#ca8a04" /> CÂU DỰ ĐOÁN PHỤ XẾP HẠNG BAN TỔ CHỨC
                    </div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#713f12', fontWeight: '600', marginBottom: '10px' }}>
                      Vui lòng nhập số lượng thí sinh bạn dự đoán sẽ trả lời đúng cả 30/30 câu hỏi:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="number"
                        min="0"
                        value={essayAnswer}
                        onChange={e => setEssayAnswer(e.target.value)}
                        placeholder="Nhập số người dự đoán (Ví dụ: 125)"
                        style={{ flex: 1, padding: '14px 18px', borderRadius: '10px', border: '2px solid #ca8a04', fontSize: '18px', fontWeight: 'bold', color: '#854d0e', background: '#ffffff', boxSizing: 'border-box' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#854d0e', fontSize: '16px' }}>người</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#a16207', marginTop: '10px', marginBottom: 0, lineHeight: '1.5' }}>
                      💡 <em>Lưu ý: Đáp án dự đoán này là căn cứ xét giải Nhất, Nhì, Ba khi có nhiều thí sinh đạt cùng số điểm và cùng thời gian làm bài!</em>
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* NAVIGATION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              style={{ padding: '10px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentQuestionIndex === 0 ? 0.5 : 1 }}
            >
              ⬅ Câu trước
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                style={{ padding: '10px 22px', background: '#be123c', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Câu tiếp ➔
              </button>
            ) : (
              <button
                onClick={() => handleSubmitQuiz(false)}
                disabled={submitting}
                style={{ padding: '12px 26px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(22,101,52,0.25)' }}
              >
                <Send size={18} /> {submitting ? '⏳ Đang nộp bài...' : '✅ NỘP BÀI THI'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULT & LEADERBOARD SCREEN */}
      {step === 'result' && (
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', color: '#166534', margin: '0 0 6px 0' }}>CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH BÀI THI!</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Cảm ơn bạn đã đồng hành cùng Lễ Kỷ Niệm 30 Năm Trường THPT Cao Bá Quát</p>
          </div>

          {/* STATS HIGHLIGHT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>ĐIỂM TỰ ĐỘNG TRẮC NGHIỆM</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#15803d', margin: '4px 0' }}>{finalScore} điểm</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Thí sinh: {studentName}</div>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: 'bold', textTransform: 'uppercase' }}>THỜI GIAN HOÀN THÀNH</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#c2410c', margin: '4px 0' }}>{formatTime(timeTaken)}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Lớp: {studentGroup}</div>
            </div>
          </div>

          {/* TABS SELECTOR */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('leaderboard')}
              style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: 'bold', fontSize: '15px', color: activeTab === 'leaderboard' ? '#be123c' : '#64748b', borderBottom: activeTab === 'leaderboard' ? '3px solid #be123c' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Trophy size={18} /> BẢNG VÀNG THÀNH TÍCH TOP 20
            </button>
            <button
              onClick={() => setActiveTab('result')}
              style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: 'bold', fontSize: '15px', color: activeTab === 'result' ? '#be123c' : '#64748b', borderBottom: activeTab === 'result' ? '3px solid #be123c' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Award size={18} /> CHỨNG NHẬN ĐIỆN TỬ
            </button>
          </div>

          {/* TAB 1: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: idx === 0 ? '#fefce8' : idx === 1 ? '#f8fafc' : idx === 2 ? '#fff7ed' : '#ffffff',
                      border: idx === 0 ? '1.5px solid #fde047' : '1px solid #e2e8f0',
                      boxShadow: idx < 3 ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#f97316' : '#f1f5f9',
                        color: idx < 3 ? '#ffffff' : '#475569',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '14px'
                      }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14.5px' }}>
                          {item.student_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {item.student_group} • 🕒 {formatTime(item.time_taken_seconds || 0)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>
                        {item.total_score || item.score} điểm
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CERTIFICATE */}
          {activeTab === 'result' && (
            <div style={{ background: 'linear-gradient(135deg, #fffdfa 0%, #fff7ed 100%)', border: '3px double #d4af37', padding: '24px', borderRadius: '16px', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#b45309', letterSpacing: '2px', textTransform: 'uppercase' }}>
                TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK
              </div>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#be123c', margin: '8px 0', fontSize: '22px' }}>
                CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC
              </h2>
              <p style={{ fontStyle: 'italic', color: '#475569', fontSize: '13.5px', margin: '0 0 15px 0' }}>
                Chứng nhận thí sinh đã tích cực tham gia Cuộc Thi Tìm Hiểu Kỷ Niệm 30 Năm Thành Lập Trường (1996 - 2026)
              </p>

              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '15px 0 5px 0' }}>
                {studentName}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                {studentGroup}
              </div>

              <div style={{ display: 'inline-block', margin: '20px 0', padding: '10px 24px', background: '#ffffff', borderRadius: '30px', border: '1px solid #fde047', boxShadow: '0 4px 12px rgba(234,179,8,0.15)' }}>
                <span style={{ fontSize: '14px', color: '#475569' }}>Kết quả: </span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#be123c' }}>{finalScore} Điểm</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px' }}>
                <button onClick={() => { setStep('welcome'); fetchLeaderboard(); }} style={{ padding: '10px 20px', background: '#be123c', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={16} /> Thi Lại Lần Khác
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px 15px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0'
  },
  badge: {
    display: 'inline-block',
    background: '#fef3c7',
    color: '#b45309',
    fontWeight: 'bold',
    fontSize: '12px',
    padding: '6px 14px',
    borderRadius: '20px',
    marginBottom: '10px',
    border: '1px solid #fde047'
  },
  title: {
    fontSize: '24px',
    color: '#be123c',
    margin: '0 0 10px 0',
    fontFamily: 'Playfair Display, Georgia, serif'
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: 0
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    boxSizing: 'border-box',
    fontSize: '14.5px'
  },
  startBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 4px 14px rgba(190,18,60,0.3)'
  },
  seedBtn: {
    padding: '10px 16px',
    background: '#fefce8',
    color: '#b45309',
    border: '1px solid #fde047',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13.5px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  quizHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    paddingBottom: '15px',
    borderBottom: '1px solid #e2e8f0'
  }
};

