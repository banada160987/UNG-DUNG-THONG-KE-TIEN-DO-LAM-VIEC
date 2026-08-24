import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Trophy, Download, Trash2, Plus, CheckCircle, Edit3, MessageSquare, Star, Sparkles, Settings, Clock, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import html2canvas from 'html2canvas';

export default function AdminQuiz() {
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' | 'questions'
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination for submissions
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(submissions.length / pageSize);
  const currentSubmissions = pageSize === 'all' 
    ? submissions 
    : submissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Stats Modal
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Question Form Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('multiple_choice');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [points, setPoints] = useState(10);

  // Quiz Config State
  const [quizConfig, setQuizConfig] = useState({
    title: 'Cuộc Thi Tìm Hiểu 30 Năm Thành Lập Trường THPT Cao Bá Quát',
    description: 'Hành trình 30 năm chắp cánh ước mơ tuổi học trò (1996 - 2026)',
    time_limit_minutes: 15,
    start_time: '2026-08-01T08:00',
    end_time: '2026-09-03T23:59',
    is_active: true
  });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchQuestions();
    fetchQuizConfig();
  }, []);

  async function fetchQuizConfig() {
    try {
      const { data } = await supabase.from('cbq_quizzes').select('*').limit(1);
      if (data && data.length > 0) {
        setQuizConfig(data[0]);
      }
    } catch (err) {
      console.error("Lỗi lấy cấu hình cuộc thi:", err);
    }
  };

  const handleSaveQuizConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const payload = {
        title: quizConfig.title,
        description: quizConfig.description,
        time_limit_minutes: Number(quizConfig.time_limit_minutes) || 15,
        start_time: quizConfig.start_time || null,
        end_time: quizConfig.end_time || null,
        is_active: quizConfig.is_active
      };

      if (quizConfig.id) {
        const { error } = await supabase.from('cbq_quizzes').update(payload).eq('id', quizConfig.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('cbq_quizzes').insert([payload]).select().single();
        if (error) throw error;
        if (data) setQuizConfig(data);
      }
      alert("Đã lưu cấu hình thời gian & thông tin cuộc thi thành công!");
    } catch (err) {
      console.error("Save config error:", err);
      alert("Lỗi lưu cấu hình: " + (err.message || "Không rõ nguyên nhân"));
    } finally {
      setSavingConfig(false);
    }
  };

  async function fetchSubmissions() {
    setLoading(true);
    const { data } = await supabase
      .from('cbq_quiz_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const parseOptions = (opts) => {
    if (Array.isArray(opts)) return opts;
    if (typeof opts === 'string') {
      try {
        const p = JSON.parse(opts);
        if (Array.isArray(p)) return p;
      } catch (e) {}
    }
    return [];
  };

  async function fetchQuestions() {
    const { data } = await supabase
      .from('cbq_quiz_questions')
      .select('*')
      .order('order_index', { ascending: true });
    if (data) {
      const parsed = data.map(q => ({
        ...q,
        options: parseOptions(q.options)
      }));
      setQuestions(parsed);
    }
  };

  const OFFICIAL_30_QUESTIONS = [
    { question_text: "Câu 1. Trường THPT Cao Bá Quát được thành lập vào năm nào?", question_type: "multiple_choice", options: ["1994", "1996", "1998", "2000"], correct_option_index: 1, points: 10 },
    { question_text: "Câu 2. Số điện thoại của trường THPT Cao Bá Quát hiện tại là số nào?", question_type: "multiple_choice", options: ["02623.863043", "02623.868686", "02623.867899", "02623.456789"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 3. Trường THPT Cao Bá Quát tọa lạc trên vùng ngoại ô của thành phố nào (theo tên gọi cũ)?", question_type: "multiple_choice", options: ["Thành phố Buôn Ma Thuột", "Thành phố Pleiku", "Thành phố Đà Lạt", "Thành phố Nha Trang"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 4. Tên gọi ban đầu của nhà trường là gì?", question_type: "multiple_choice", options: ["Trường THCS Cao Bá Quát", "Trường Phổ thông cấp II - III Cao Bá Quát", "Trường THPT Cao Bá Quát", "Trường Phổ thông Dân tộc nội trú Cao Bá Quát"], correct_option_index: 1, points: 10 },
    { question_text: "Câu 5. Ai là Hiệu trưởng đầu tiên của Trường THPT Cao Bá Quát?", question_type: "multiple_choice", options: ["Nguyễn Hoa Nam", "Nguyễn Thành Công", "Lê Văn Kiệt", "Lê Thị Thảo"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 6. Hiệu trưởng hiện tại của nhà trường là ai?", question_type: "multiple_choice", options: ["Nguyễn Thành Công", "Lê Văn Kiệt", "Nguyễn Hoa Nam", "Lê Thị Thảo"], correct_option_index: 3, points: 10 },
    { question_text: "Câu 7. Slogan của Trường THPT Cao Bá Quát là gì?", question_type: "multiple_choice", options: ["Sáng tạo - Kỷ cương - Nhân văn - Vươn xa", "Tự hào truyền thống - Vững bước vươn xa", "Đoàn kết - Sáng tạo - Hội nhập - Thành công", "Dạy tốt - Học tốt - Vươn tới tương lai"], correct_option_index: 1, points: 10 },
    { question_text: "Câu 8. Tổng số giáo viên hiện tại của nhà trường là bao nhiêu?", question_type: "multiple_choice", options: ["73", "78", "83", "88"], correct_option_index: 2, points: 10 },
    { question_text: "Câu 9. Năm học 2026 – 2027, trường THPT Cao Bá Quát có tổng số lớp là bao nhiêu?", question_type: "multiple_choice", options: ["32", "33", "34", "35"], correct_option_index: 2, points: 10 },
    { question_text: "Câu 10. Tỷ lệ đậu tốt nghiệp của nhà trường trong năm học 2025–2026 là bao nhiêu?", question_type: "multiple_choice", options: ["98%", "99%", "99,5%", "100%"], correct_option_index: 3, points: 10 },
    { question_text: "Câu 11. Số lượng học sinh đạt học sinh giỏi tỉnh trong năm học 2025–2026 là bao nhiêu?", question_type: "multiple_choice", options: ["24", "25", "27", "30"], correct_option_index: 2, points: 10 },
    { question_text: "Câu 12. Ai là Hiệu trưởng thứ hai của trường THPT Cao Bá Quát?", question_type: "multiple_choice", options: ["Nguyễn Hoa Nam", "Nguyễn Thành Công", "Lê Văn Kiệt", "Lê Thị Thảo"], correct_option_index: 1, points: 10 },
    { question_text: "Câu 13. Tổng số lớp cấp III (THPT) năm 1996 của trường là bao nhiêu?", question_type: "multiple_choice", options: ["01", "02", "03", "04"], correct_option_index: 1, points: 10 },
    { question_text: "Câu 14. Khi mới thành lập, quy mô đào tạo của Trường Phổ thông cấp II - III Cao Bá Quát được xác định trong khoảng nào?", question_type: "multiple_choice", options: ["600 - 800 học sinh", "800 - 1.000 học sinh", "1.000 - 1.200 học sinh", "1.200 - 1.500 học sinh"], correct_option_index: 3, points: 10 },
    { question_text: "Câu 15. Những ngày đầu hoạt động, nhà trường tận dụng cơ sở vật chất cũ của đơn vị nào?", question_type: "multiple_choice", options: ["Trường Trung học Nông Lâm nghiệp tỉnh", "Trường Cao đẳng Sư phạm Đắk Lắk", "Trường THPT Buôn Ma Thuột", "Trung tâm Giáo dục thường xuyên tỉnh"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 16. Không gian sư phạm của nhà trường hiện rộng hơn bao nhiêu m²?", question_type: "multiple_choice", options: ["12.000 m²", "22.000 m²", "32.000 m²", "42.000 m²"], correct_option_index: 2, points: 10 },
    { question_text: "Câu 17. Nhà trường hiện có bao nhiêu phòng học kiên cố?", question_type: "multiple_choice", options: ["27 phòng", "32 phòng", "37 phòng", "42 phòng"], correct_option_index: 2, points: 10 },
    { question_text: "Câu 18. Tỷ lệ giáo viên đạt chuẩn của trường THPT Cao Bá Quát là bao nhiêu?", question_type: "multiple_choice", options: ["95%", "97%", "98,5%", "100%"], correct_option_index: 3, points: 10 },
    { question_text: "Câu 19. Tỷ lệ giáo viên đạt trình độ trên chuẩn của nhà trường là mức nào?", question_type: "multiple_choice", options: ["Hơn 21,7%", "Hơn 26,7%", "Hơn 31,7%", "Hơn 41,7%"], correct_option_index: 2, points: 10 },
    { question_text: "Câu 20. Phương châm xây dựng môi trường giáo dục của trường THPT Cao Bá Quát là gì?", question_type: "multiple_choice", options: ["Sáng tạo - Kỷ cương - Nhân văn - Vươn xa", "Tự hào truyền thống - Vững bước vươn xa", "Trách nhiệm - Đoàn kết - Hội nhập - Thành công", "Kỷ luật - Tự tin - Hợp tác - Phát triển"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 21. Phương án nào sắp xếp đúng thứ tự các đời Hiệu trưởng từ đầu tiên đến hiện tại?", question_type: "multiple_choice", options: ["Nguyễn Hoa Nam → Nguyễn Thành Công → Lê Văn Kiệt → Huỳnh Thị Kim Huệ → Lê Thị Thảo", "Nguyễn Hoa Nam → Lê Văn Kiệt → Nguyễn Thành Công → Huỳnh Thị Kim Huệ → Lê Thị Thảo", "Nguyễn Thành Công → Nguyễn Hoa Nam → Lê Văn Kiệt → Lê Thị Thảo → Huỳnh Thị Kim Huệ", "Nguyễn Hoa Nam → Nguyễn Thành Công → Huỳnh Thị Kim Huệ → Lê Văn Kiệt → Lê Thị Thảo"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 22. Trong những ngày đầu xây dựng trường, hoạt động nào dưới đây phản ánh đúng nỗ lực của thầy và trò trường THPT Cao Bá Quát?", question_type: "multiple_choice", options: ["Chỉ tập trung tuyển sinh, chưa cải tạo cơ sở vật chất", "Vừa dạy và học, vừa cải tạo phòng học, mua sắm trang thiết bị, trồng cây xanh", "Chuyển toàn bộ hoạt động sang cơ sở thuê bên ngoài", "Tạm dừng giảng dạy để xây dựng cơ sở mới hoàn toàn"], correct_option_index: 1, points: 10 },
    { question_text: "Câu 23. Phương án nào mô tả đúng nhất hệ thống cơ sở vật chất hiện tại của trường THPT Cao Bá Quát?", question_type: "multiple_choice", options: ["37 phòng học kiên cố; phòng thực hành Lý - Hóa - Sinh; phòng tin học; phòng ngoại ngữ; nhà đa năng và khu thể dục thể thao", "25 phòng học; chỉ có phòng tin học và thư viện", "45 phòng học; không có phòng thực hành chuyên môn", "30 phòng học; chỉ có nhà đa năng và sân vận động"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 24. Phương châm xây dựng môi trường giáo dục của trường THPT Cao Bá Quát là gì?", question_type: "multiple_choice", options: ["“Tự hào truyền thống - Vững bước vươn xa”", "“Sáng tạo - Kỷ cương - Nhân văn - Vươn xa”", "“Học, học nữa, học mãi”", "“Sáng tạo - Kỷ cương – Tình thương – Trách nhiệm”"], correct_option_index: 1, points: 10 },
    { question_text: "Câu 25. Cao Bá Quát sống trong khoảng thời gian nào và quê ở đâu?", question_type: "multiple_choice", options: ["1809-1855; làng Phú Thị, huyện Gia Lâm, tỉnh Bắc Ninh, nay thuộc Hà Nội", "1788-1858; làng Tiên Điền, Hà Tĩnh", "1810-1870; làng Vị Xuyên, Nam Định", "1802-1862; làng Mộ Trạch, Hải Dương"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 26. Tự và hiệu của Cao Bá Quát là gì?", question_type: "multiple_choice", options: ["Tự Chu Thần; hiệu Cúc Đường và Mẫn Hiên", "Tự Tố Như; hiệu Thanh Hiên", "Tự Hy Văn; hiệu Uy Viễn", "Tự Mộng Liên; hiệu Bạch Vân"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 27. Cao Bá Quát được người đời tôn xưng là gì?", question_type: "multiple_choice", options: ["Thánh Quát", "Trạng Trình", "Thi Thánh", "La Sơn Phu Tử"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 28. Năm 1832, Cao Bá Quát đạt thành tích nào tại trường thi Hà Nội?", question_type: "multiple_choice", options: ["Đỗ Tiến sĩ", "Đỗ Á Nguyên", "Đỗ Trạng nguyên", "Đỗ Phó bảng"], correct_option_index: 1, points: 10 },
    { question_text: "Câu 29. Khi quyết tâm học tập và luyện chữ, Cao Bá Quát đã làm gì để tự rèn ý chí, không bỏ cuộc?", question_type: "multiple_choice", options: ["Buộc tóc lên xà nhà để chống buồn ngủ và buộc chân vào cạnh bàn để tự nhắc mình không bỏ cuộc", "Chỉ luyện viết vào ban ngày và dừng học khi cảm thấy mệt", "Nhờ người khác viết hộ để dành thời gian học văn thơ", "Chỉ đọc sách mà không luyện chữ vì cho rằng chữ viết không quan trọng"], correct_option_index: 0, points: 10 },
    { question_text: "Câu 30. Câu nói nào thường được nhắc đến khi nói về khí phách của Cao Bá Quát?", question_type: "multiple_choice", options: ["“Nhất sinh đê thủ bái mai hoa”", "“Nhất sinh đê thủ bái liên hoa”", "“Nhất sinh ngẩng thủ bái mai hoa”", "“Nhất thế đê thủ bái mai hoa”"], correct_option_index: 0, points: 10 },
    { question_text: "[PHẦN IV: CÂU DỰ ĐOÁN XẾP HẠNG] Theo bạn, có bao nhiêu thí sinh tham gia cuộc thi sẽ trả lời đúng cả 30/30 câu hỏi?", question_type: "essay", options: [], correct_option_index: 0, points: 30 }
  ];

  const handleSeedOfficial30Questions = async () => {
    const confirmSeed = window.confirm("⚡ XÁC NHẬN NẠP BỘ 30 CÂU HỎI CHÍNH THỨC BAN TỔ CHỨC:\n\nHệ thống sẽ nạp trọn bộ 30 câu hỏi trắc nghiệm kèm đáp án chuẩn + 1 câu dự đoán phụ vào cơ sở dữ liệu. Bạn có chắc chắn muốn tiếp tục không?");
    if (!confirmSeed) return;

    try {
      // Clear existing questions
      const { data: existingQ } = await supabase.from('cbq_quiz_questions').select('id');
      if (existingQ && existingQ.length > 0) {
        const ids = existingQ.map(item => item.id);
        await supabase.from('cbq_quiz_questions').delete().in('id', ids);
      }

      const rowsToInsert = OFFICIAL_30_QUESTIONS.map((q, idx) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_option_index: q.correct_option_index,
        points: q.points,
        order_index: idx + 1
      }));

      const { error } = await supabase.from('cbq_quiz_questions').insert(rowsToInsert);
      if (!error) {
        alert("🎉 ĐÃ NẠP THÀNH CÔNG TRỌN BỘ 30 CÂU HỎI CHÍNH THỨC VÀO CSDL!");
        await fetchQuestions();
      } else {
        alert("Lỗi khi nạp bộ câu hỏi: " + error.message);
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài nộp này?")) return;
    await supabase.from('cbq_quiz_submissions').delete().eq('id', id);
    fetchSubmissions();
  };

  const handleUpdateQuestionPoints = async (questionId, newPoints) => {
    const pts = parseFloat(newPoints) || 10;
    await supabase
      .from('cbq_quiz_questions')
      .update({ points: pts })
      .eq('id', questionId);

    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, points: pts } : q));
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    await supabase.from('cbq_quiz_questions').delete().eq('id', id);
    fetchQuestions();
  };

  const handleGradeEssay = async (submissionId, essayPts) => {
    const pts = parseFloat(essayPts) || 0;
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    const newTotal = (Number(sub.score) || 0) + pts;
    await supabase
      .from('cbq_quiz_submissions')
      .update({ essay_score: pts, total_score: newTotal, is_graded: true })
      .eq('id', submissionId);

    fetchSubmissions();
  };

  const [editingQuestion, setEditingQuestion] = useState(null);

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setQText('');
    setQType('multiple_choice');
    setOptA(''); setOptB(''); setOptC(''); setOptD('');
    setCorrectIdx(0);
    setPoints(10);
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setQText(q.question_text || '');
    setQType(q.question_type || 'multiple_choice');
    const opts = parseOptions(q.options);
    setOptA(opts[0] || '');
    setOptB(opts[1] || '');
    setOptC(opts[2] || '');
    setOptD(opts[3] || '');
    setCorrectIdx(q.correct_option_index || 0);
    setPoints(q.points || 10);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const options = qType === 'multiple_choice' ? [optA, optB, optC, optD] : [];

    if (editingQuestion) {
      await supabase.from('cbq_quiz_questions').update({
        question_text: qText.trim(),
        question_type: qType,
        options: options,
        correct_option_index: Number(correctIdx),
        points: Number(points)
      }).eq('id', editingQuestion.id);
    } else {
      await supabase.from('cbq_quiz_questions').insert([{
        question_text: qText.trim(),
        question_type: qType,
        options: options,
        correct_option_index: Number(correctIdx),
        points: Number(points),
        order_index: questions.length + 1
      }]);
    }

    fetchQuestions();
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getStatsData = () => {
    const dateMap = {};
    const classMap = {};

    let totalTime = 0;
    let excellent = 0; // >= 250
    let good = 0;      // 200 - 249
    let average = 0;   // 150 - 199
    let weak = 0;      // < 150

    submissions.forEach(sub => {
      const d = new Date(sub.created_at);
      const dateStr = d.toLocaleDateString('vi-VN'); // DD/MM/YYYY
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { dateStr, timestamp: d.setHours(0,0,0,0), students: 0, classes: new Set() };
      }
      dateMap[dateStr].students += 1;
      
      const group = sub.student_group || 'Chưa rõ';
      if (group && group !== 'Chưa rõ') {
        dateMap[dateStr].classes.add(group);
      }

      if (!classMap[group]) {
        classMap[group] = { count: 0, totalScore: 0 };
      }
      classMap[group].count += 1;
      classMap[group].totalScore += (sub.score || 0);

      const s = sub.score || 0;
      if (s >= 250) excellent++;
      else if (s >= 200) good++;
      else if (s >= 150) average++;
      else weak++;

      totalTime += (sub.time_taken_seconds || 0);
    });

    const timeData = Object.values(dateMap).map(d => ({
      date: d.dateStr,
      timestamp: d.timestamp,
      students: d.students,
      classes: d.classes.size
    })).sort((a, b) => a.timestamp - b.timestamp);

    const classData = Object.entries(classMap)
      .map(([name, data]) => ({ 
        name, 
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count)
      }))
      .sort((a, b) => b.count - a.count);

    const avgTime = submissions.length > 0 ? Math.floor(totalTime / submissions.length) : 0;
    
    const scoreDistribution = [
      { name: 'Giỏi (≥250đ)', value: excellent, color: '#16a34a' },
      { name: 'Khá (200-240đ)', value: good, color: '#3b82f6' },
      { name: 'TB (150-190đ)', value: average, color: '#eab308' },
      { name: 'Yếu (<150đ)', value: weak, color: '#ef4444' }
    ].filter(item => item.value > 0);

    return { 
      timeData, 
      classData, 
      totalStudents: submissions.length, 
      totalClasses: Object.keys(classMap).filter(k => k !== 'Chưa rõ').length,
      avgTime,
      scoreDistribution
    };
  };

  const stats = showStatsModal ? getStatsData() : null;

  const handleExportStatsImage = async () => {
    const el = document.getElementById('stats-report-container');
    if (!el) return;
    try {
      const modalContent = el.parentElement;
      const originalMaxHeight = modalContent.style.maxHeight;
      const originalOverflow = modalContent.style.overflowY;
      
      // Bỏ giới hạn chiều cao để chụp toàn bộ nội dung mà không bị thanh cuộn che
      modalContent.style.maxHeight = 'none';
      modalContent.style.overflowY = 'visible';
      
      const canvas = await html2canvas(el, { 
        scale: 2, 
        backgroundColor: '#ffffff', 
        logging: false,
        useCORS: true 
      });
      
      modalContent.style.maxHeight = originalMaxHeight;
      modalContent.style.overflowY = originalOverflow;
      
      const link = document.createElement('a');
      link.download = `Bao_Cao_Thong_Ke_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi xuất báo cáo hình ảnh!');
    }
  };

  const exportToExcel = () => {
    if (submissions.length === 0) {
      alert("Chưa có dữ liệu bài nộp nào để xuất!");
      return;
    }

    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "STT,Họ và Tên,Lớp / Niên Khóa,Số Điện Thoại,Điểm Trắc Nghiệm,Điểm Tự Luận,Tổng Điểm,Thời Gian (Giây),Bài Làm Tự Luận,Thời Gian Nộp\n";

    submissions.forEach((s, idx) => {
      const cleanName = `"${(s.student_name || '').replace(/"/g, '""')}"`;
      const cleanGroup = `"${(s.student_group || '').replace(/"/g, '""')}"`;
      const cleanPhone = `"${(s.phone || '').replace(/"/g, '""')}"`;
      const cleanEssay = `"${(s.essay_answer || '').replace(/"/g, '""')}"`;
      const dateStr = s.created_at ? new Date(s.created_at).toLocaleString('vi-VN') : '';

      csv += `${idx + 1},${cleanName},${cleanGroup},${cleanPhone},${s.score || 0},${s.essay_score || 0},${s.total_score || s.score},${s.time_taken_seconds || 0},${cleanEssay},${dateStr}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh_Sach_Ket_Qua_Cuoc_Thi_30_Nam_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout title="Quản lý Cuộc Thi Trắc Nghiệm & Tự Luận">
      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('submissions')}
            style={styles.tabBtn(activeTab === 'submissions')}
          >
            <Trophy size={18} /> Danh Sách Bài Thi ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            style={styles.tabBtn(activeTab === 'questions')}
          >
            <Star size={18} /> Ngân Hàng Câu Hỏi ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            style={styles.tabBtn(activeTab === 'config')}
          >
            <Settings size={18} /> ⚙️ Cấu Hình Thời Gian & Cuộc Thi
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'questions' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleSeedOfficial30Questions} 
                style={{ ...styles.addBtn, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                title="Nạp tự động trọn bộ 30 câu hỏi kèm đáp án chuẩn từ Ban Tổ Chức"
              >
                <Sparkles size={18} /> Nạp 30 Câu Hỏi BTC
              </button>
              <button onClick={handleOpenAddModal} style={styles.addBtn}>
                <Plus size={18} /> Thêm Câu Hỏi Mới
              </button>
            </div>
          )}
          <button onClick={() => setShowStatsModal(true)} style={{ ...styles.exportBtn, backgroundColor: '#3b82f6' }}>
            <BarChart2 size={18} /> Thống Kê
          </button>
          <button onClick={exportToExcel} style={styles.exportBtn}>
            <Download size={18} /> Xuất Excel / CSV (Thí Sinh)
          </button>
        </div>
      </div>

      {/* STATS MODAL */}
      {showStatsModal && stats && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={24} /> Báo Cáo Thống Kê
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleExportStatsImage} style={{ ...styles.exportBtn, backgroundColor: '#4f46e5', padding: '8px 16px' }}>
                  📸 Xuất Ảnh Báo Cáo
                </button>
                <button onClick={() => setShowStatsModal(false)} style={styles.cancelBtn}>Đóng</button>
              </div>
            </div>

            <div id="stats-report-container" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#be123c', fontSize: '20px', textTransform: 'uppercase' }}>Báo Cáo Thống Kê Cuộc Thi</h2>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Thời gian trích xuất: {new Date().toLocaleString('vi-VN')}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: 'bold' }}>Tổng Số Thí Sinh</div>
                  <div style={{ fontSize: '28px', color: '#1e3a8a', fontWeight: 'bold' }}>{stats.totalStudents}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#15803d', fontWeight: 'bold' }}>Số Lớp Tham Gia</div>
                  <div style={{ fontSize: '28px', color: '#166534', fontWeight: 'bold' }}>{stats.totalClasses}</div>
                </div>
                <div style={{ background: '#fdf4ff', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#86198f', fontWeight: 'bold' }}>Thời Gian TB</div>
                  <div style={{ fontSize: '28px', color: '#701a75', fontWeight: 'bold' }}>{formatTime(stats.avgTime)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ color: '#334155', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', textAlign: 'center' }}>
                    📈 Phân Bố Phổ Điểm
                  </h4>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.scoreDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                          fontSize={11}
                        >
                          {stats.scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ color: '#334155', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', textAlign: 'center' }}>
                    🏆 Top 5 Lớp Có Điểm Cao Nhất
                  </h4>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[...stats.classData].sort((a,b)=>b.avgScore - a.avgScore).slice(0,5)} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[0, 300]} fontSize={11} stroke="#64748b" />
                        <YAxis dataKey="name" type="category" fontSize={11} stroke="#64748b" width={70} />
                        <RechartsTooltip 
                          cursor={{fill: '#f1f5f9'}} 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [value + ' điểm', 'Điểm trung bình']}
                        />
                        <Bar dataKey="avgScore" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            <h4 style={{ color: '#334155', marginBottom: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              📈 Tiến Độ Tham Gia Theo Thời Gian
            </h4>
            <div style={{ height: '300px', width: '100%', marginBottom: '30px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="students" name="Số học sinh" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="classes" name="Số lớp tham gia" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h4 style={{ color: '#334155', marginBottom: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              📊 Số Lượng Thí Sinh Theo Lớp
            </h4>
            <div style={{ height: `${Math.max(300, stats.classData.length * 40)}px`, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.classData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                  <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" name="Số lượng học sinh" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION MODAL */}
      {showQuestionModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ margin: '0 0 15px 0', color: '#be123c' }}>
              {editingQuestion ? '✏️ Chỉnh Sửa Nội Dung Câu Hỏi' : '➕ Thêm Câu Hỏi Mới'}
            </h3>
            <form onSubmit={handleSaveQuestion}>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Nội dung câu hỏi *</label>
                <textarea
                  required
                  rows={3}
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  style={styles.input}
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={styles.label}>Loại câu hỏi</label>
                  <select value={qType} onChange={e => setQType(e.target.value)} style={styles.input}>
                    <option value="multiple_choice">Trắc nghiệm (4 lựa chọn)</option>
                    <option value="essay">Tự luận (Viết đoạn cảm xúc)</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Điểm số câu hỏi</label>
                  <input type="number" value={points} onChange={e => setPoints(e.target.value)} style={styles.input} />
                </div>
              </div>

              {qType === 'multiple_choice' && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                  <label style={{ ...styles.label, color: '#be123c' }}>4 Phương án lựa chọn:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <input type="text" placeholder="Phương án A" value={optA} onChange={e => setOptA(e.target.value)} style={styles.input} />
                    <input type="text" placeholder="Phương án B" value={optB} onChange={e => setOptB(e.target.value)} style={styles.input} />
                    <input type="text" placeholder="Phương án C" value={optC} onChange={e => setOptC(e.target.value)} style={styles.input} />
                    <input type="text" placeholder="Phương án D" value={optD} onChange={e => setOptD(e.target.value)} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Đáp án đúng:</label>
                    <select value={correctIdx} onChange={e => setCorrectIdx(e.target.value)} style={styles.input}>
                      <option value={0}>Đáp án A</option>
                      <option value={1}>Đáp án B</option>
                      <option value={2}>Đáp án C</option>
                      <option value={3}>Đáp án D</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowQuestionModal(false)} style={styles.cancelBtn}>Hủy</button>
                <button type="submit" style={styles.submitBtn}>
                  {editingQuestion ? '💾 Lưu Cập Nhật Câu Hỏi' : 'Lưu Câu Hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: SUBMISSIONS TABLE */}
      {activeTab === 'submissions' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <div style={{ fontSize: '13.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Hiển thị: 
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">Tất cả</option>
              </select>
              bản ghi / trang
            </div>
            
            {pageSize !== 'all' && totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#ffffff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#334155', fontSize: '13px' }}
                >
                  Trước
                </button>
                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 'bold' }}>
                  Trang {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#ffffff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#94a3b8' : '#334155', fontSize: '13px' }}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', fontSize: '12px', color: '#475569' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Thí sinh / Lớp</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Điểm Trắc Nghiệm (300đ)</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>🎯 Dự Đoán Thí Sinh 30/30</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Chấm Điểm Phụ</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Tổng Điểm</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentSubmissions.map((sub, idx) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{sub.student_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{sub.student_group} • 📞 {sub.phone || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#166534', fontSize: '16px' }}>
                    {sub.score || 0}/300
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                    {sub.essay_answer ? (
                      <div style={{ background: '#fefce8', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fef08a', color: '#854d0e', fontWeight: 'bold', display: 'inline-block' }}>
                        🎯 Dự đoán: <span style={{ color: '#ca8a04', fontSize: '15px' }}>{sub.essay_answer}</span> người
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa nhập</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="number"
                      defaultValue={sub.essay_score || 0}
                      onBlur={(e) => handleGradeEssay(sub.id, e.target.value)}
                      style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#be123c', fontSize: '16px' }}>
                    {sub.total_score || sub.score}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleDeleteSubmission(sub.id)} style={{ padding: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Chưa có thí sinh nào nộp bài thi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: QUESTIONS LIST */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#be123c', fontSize: '14px' }}>Câu {idx + 1}:</span>
                  <span style={{ background: q.question_type === 'essay' ? '#ffedd5' : '#dcfce7', color: q.question_type === 'essay' ? '#c2410c' : '#15803d', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>
                    {q.question_type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>Điểm:</span>
                    <input 
                      type="number" 
                      defaultValue={q.points || 10} 
                      onBlur={(e) => handleUpdateQuestionPoints(q.id, e.target.value)}
                      style={{ width: '45px', padding: '2px 4px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #94a3b8', borderRadius: '4px', color: '#be123c' }}
                      title="Bấm để thay đổi điểm số câu hỏi này"
                    />
                    <span style={{ color: '#475569', fontWeight: 'bold' }}>đ</span>
                  </div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                  {q.question_text}
                </div>
                {q.question_type === 'multiple_choice' && q.options && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px', color: '#475569' }}>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ color: oIdx === q.correct_option_index ? '#15803d' : '#475569', fontWeight: oIdx === q.correct_option_index ? 'bold' : 'normal' }}>
                        {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correct_option_index && '✓ (Đáp án đúng)'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => handleOpenEditQuestion(q)} 
                  style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Chỉnh sửa nội dung & đáp án câu hỏi"
                >
                  ✏️ Sửa
                </button>
                <button 
                  onClick={() => handleDeleteQuestion(q.id)} 
                  style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                  title="Xóa câu hỏi này"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CONTEST CONFIG & TIME SETUP */}
      {activeTab === 'config' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', maxWidth: '680px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#be123c', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} /> Cài Đặt Thời Gian & Thể Lệ Cuộc Thi
          </h3>

          <form onSubmit={handleSaveQuizConfig}>
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Tên Cuộc Thi *</label>
              <input 
                type="text" 
                required 
                value={quizConfig.title || ''} 
                onChange={e => setQuizConfig(prev => ({ ...prev, title: e.target.value }))} 
                style={styles.input} 
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Mô Tả / Hướng Dẫn Thể Lệ Thi *</label>
              <textarea 
                rows={3} 
                value={quizConfig.description || ''} 
                onChange={e => setQuizConfig(prev => ({ ...prev, description: e.target.value }))} 
                style={styles.input} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '14px' }}>
              <div>
                <label style={styles.label}>Thời Gian Làm Bài (Phút) *</label>
                <input 
                  type="number" 
                  required 
                  min={1} 
                  max={180} 
                  value={quizConfig.time_limit_minutes || 15} 
                  onChange={e => setQuizConfig(prev => ({ ...prev, time_limit_minutes: e.target.value }))} 
                  style={styles.input} 
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>VD: 15 phút (Đồng hồ đếm ngược)</span>
              </div>

              <div>
                <label style={styles.label}>Trạng Thái Cuộc Thi</label>
                <select 
                  value={quizConfig.is_active ? 'true' : 'false'} 
                  onChange={e => setQuizConfig(prev => ({ ...prev, is_active: e.target.value === 'true' }))} 
                  style={styles.input}
                >
                  <option value="true">🟢 Đang mở cho thí sinh thi</option>
                  <option value="false">🔴 Tạm đóng / Dừng nhận bài thi</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={styles.label}>Ngày Giờ Bắt Đầu Mở Thi</label>
                <input 
                  type="datetime-local" 
                  value={quizConfig.start_time || ''} 
                  onChange={e => setQuizConfig(prev => ({ ...prev, start_time: e.target.value }))} 
                  style={styles.input} 
                />
              </div>

              <div>
                <label style={styles.label}>Ngày Giờ Kết Thúc / Khóa Đề</label>
                <input 
                  type="datetime-local" 
                  value={quizConfig.end_time || ''} 
                  onChange={e => setQuizConfig(prev => ({ ...prev, end_time: e.target.value }))} 
                  style={styles.input} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={savingConfig} 
              style={{ ...styles.submitBtn, padding: '12px 24px', fontSize: '14.5px', background: '#166534' }}
            >
              {savingConfig ? '⏳ Đang lưu...' : '💾 Lưu Cấu Hình Cuộc Thi'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '15px'
  },
  tabBtn: (isActive) => ({
    padding: '10px 18px',
    backgroundColor: isActive ? '#be123c' : '#ffffff',
    color: isActive ? '#ffffff' : '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13.5px'
  }),
  exportBtn: {
    padding: '10px 18px',
    backgroundColor: '#166534',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13.5px'
  },
  addBtn: {
    padding: '10px 18px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13.5px'
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  modalContent: {
    backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px', width: '90%', maxWidth: '500px'
  },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13.5px' },
  cancelBtn: { padding: '9px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  submitBtn: { padding: '9px 18px', backgroundColor: '#be123c', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

