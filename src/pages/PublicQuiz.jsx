import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Clock, CheckCircle2, Award, Sparkles, Send, ArrowRight, RotateCcw, Medal } from 'lucide-react';

const DEFAULT_SAMPLE_QUESTIONS = [
  {
    question_text: "Trường THPT Cao Bá Quát được chính thức thành lập vào năm nào?",
    question_type: "multiple_choice",
    options: ["Năm 1994", "Năm 1996", "Năm 1998", "Năm 2000"],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Danh nhân văn hóa Cao Bá Quát nổi tiếng trong lịch sử Việt Nam với biệt danh/tài năng gì?",
    question_type: "multiple_choice",
    options: ["Thần Siêu Mẫu Hạ", "Thánh Thơ - Văn như Siêu Quát", "Thi Sĩ Đất Thần Kinh", "Bình Ngô Đại Cáo"],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Địa chỉ hiện tại của trường THPT Cao Bá Quát thuộc phường nào tại tỉnh Đắk Lắk?",
    question_type: "multiple_choice",
    options: ["Phường Tân Hòa", "Phường Tân An", "Phường Tự An", "Phường Thành Công"],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Khóa học sinh đầu tiên của nhà trường tốt nghiệp vào khoảng năm nào?",
    question_type: "multiple_choice",
    options: ["Năm 1997", "Năm 1999", "Năm 2001", "Năm 2003"],
    correct_option_index: 1,
    points: 10
  },
  {
    question_text: "Năm 2026 ghi dấu mốc kỷ niệm bao nhiêu năm thành lập Trường THPT Cao Bá Quát?",
    question_type: "multiple_choice",
    options: ["20 Năm", "25 Năm", "30 Năm", "35 Năm"],
    correct_option_index: 2,
    points: 10
  },
  {
    question_text: "[Cảm Xúc Tự Luận] Hãy chia sẻ ngắn gọn một kỷ niệm sâu sắc nhất hoặc lời chúc ý nghĩa của bạn gửi tới Trường THPT Cao Bá Quát nhân dịp Kỷ niệm 30 năm thành lập?",
    question_type: "essay",
    options: [],
    correct_option_index: 0,
    points: 50
  }
];

export default function PublicQuiz() {
  const [step, setStep] = useState('welcome'); // 'welcome' | 'quiz' | 'result'
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student Info
  const [studentName, setStudentName] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
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

  const timerRef = useRef(null);

  useEffect(() => {
    fetchQuestions();
    fetchLeaderboard();
  }, []);

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

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_quiz_questions')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        setQuestions(data);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Lỗi tải câu hỏi thi:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
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

  const handleStartQuiz = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert("Vui lòng nhập Họ và Tên của bạn.");
      return;
    }
    if (questions.length === 0) {
      alert("Hiện chưa có câu hỏi thi nào. Vui lòng liên hệ Ban Tổ Chức.");
      return;
    }
    setStep('quiz');
    setStartTime(Date.now());
    setTimeLeft(900); // 15 mins
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

  return (
    <div style={styles.container}>
      {/* WELCOME / ENTRY SCREEN */}
      {step === 'welcome' && (
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={styles.badge}>
              🏆 THI TRỰC TUYẾN 30 NĂM CAO BÁ QUÁT
            </div>
            <h1 style={styles.title}>Cuộc Thi Tìm Hiểu Lịch Sử & Kỷ Niệm Trường</h1>
            <p style={styles.subtitle}>
              Chào mừng bạn tham gia cuộc thi trắc nghiệm & chia sẻ cảm xúc hướng tới Lễ Kỷ Niệm 30 Năm Thành Lập Trường THPT Cao Bá Quát (1996 - 2026).
            </p>
          </div>

          <form onSubmit={handleStartQuiz} style={{ maxWidth: '440px', margin: '0 auto' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Họ và Tên Thí Sinh *</label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn An"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Lớp / Niên Khóa / Đơn Vị *</label>
              <input
                type="text"
                required
                placeholder="VD: Lớp 12A1 (Niên khóa 2002 - 2005)"
                value={studentGroup}
                onChange={e => setStudentGroup(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Số Điện Thoại Liên Hệ (Tùy chọn nhận giải)</label>
              <input
                type="tel"
                placeholder="VD: 0987 654 321"
                value={studentPhone}
                onChange={e => setStudentPhone(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.startBtn}>
              🚀 BẮT ĐẦU LÀM BÀI THI <ArrowRight size={20} />
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
      {step === 'quiz' && (
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
          {questions[currentQuestionIndex] && (
            <div style={{ margin: '20px 0' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #be123c', marginBottom: '20px' }}>
                <span style={{ background: '#be123c', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', marginRight: '8px' }}>
                  {questions[currentQuestionIndex].question_type === 'essay' ? 'Cảm Xúc Tự Luận' : `Trắc Nghiệm (${questions[currentQuestionIndex].points || 10} điểm)`}
                </span>
                <h3 style={{ fontSize: '17px', color: '#0f172a', margin: '8px 0 0 0', lineHeight: '1.5' }}>
                  {questions[currentQuestionIndex].question_text}
                </h3>
              </div>

              {/* OPTIONS FOR MULTIPLE CHOICE */}
              {questions[currentQuestionIndex].question_type === 'multiple_choice' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {questions[currentQuestionIndex].options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === oIdx;
                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(questions[currentQuestionIndex].id, oIdx)}
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
                /* ESSAY TEXTAREA */
                <div>
                  <textarea
                    rows={6}
                    value={essayAnswer}
                    onChange={e => setEssayAnswer(e.target.value)}
                    placeholder="Viết cảm nghĩ, kỷ niệm sâu sắc nhất của bạn về mái trường THPT Cao Bá Quát tại đây..."
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '14.5px', lineHeight: '1.6', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>
          )}

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
    paddingBottom: '15px',
    borderBottom: '1px solid #e2e8f0'
  }
};
