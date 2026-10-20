import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Clock, CheckCircle2, AlertTriangle, ArrowLeft, Send, Sparkles, 
  HelpCircle, CheckSquare, Award, BookOpen, User, Lock, RotateCcw,
  Eye, Check, X, Bookmark
} from 'lucide-react';
import MathView from '../../components/MathView';
import { getPublishedExams, getExamDetail, submitStudentExam } from '../../services/smartAssessmentService';

export default function StudentExamPortal() {
  const navigate = useNavigate();
  const { examId } = useParams();

  const [student, setStudent] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected or Assigned Exam Code (VD: 101, 102, 103, 104)
  const [selectedExamCode, setSelectedExamCode] = useState('101');

  // Exam taking state
  const [answers, setAnswers] = useState({}); // { qId: choiceIndex OR { a: true, b: false } OR text }
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 phút mặc định
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [restoredProgress, setRestoredProgress] = useState(false);
  const [showSolutionDetail, setShowSolutionDetail] = useState(true);

  useEffect(() => {
    let currentStudent = null;
    try {
      const studentStr = localStorage.getItem('cbq_current_student');
      if (studentStr) {
        currentStudent = JSON.parse(studentStr);
        setStudent(currentStudent);
      }
    } catch (_) {}

    loadExam(currentStudent);
  }, [examId]);

  const loadExam = async (currentStudent) => {
    setLoading(true);
    try {
      const allExams = await getPublishedExams();
      let found = allExams.find(e => e.id === examId);
      
      // Nếu chưa có id trên URL, lấy bài kiểm tra active đầu tiên
      if (!found && allExams.length > 0) {
        found = allExams[0];
      }

      if (found) {
        // Tải chi tiết câu hỏi (Lazy load tiết kiệm băng thông)
        const detailedExam = await getExamDetail(found.id);
        const activeExam = detailedExam || found;
        setExam(activeExam);

        if (activeExam.duration_minutes) {
          setTimeLeft(activeExam.duration_minutes * 60);
        }

        // Tự động phân mã đề thông minh cho học sinh (chống quay cóp khi ngồi cạnh nhau)
        let initialCode = '101';
        if (activeExam.mixedExamCodes && activeExam.mixedExamCodes.length > 0) {
          const stuCode = currentStudent?.student_code || currentStudent?.username || '101';
          const hash = stuCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const assignedIdx = hash % activeExam.mixedExamCodes.length;
          initialCode = activeExam.mixedExamCodes[assignedIdx]?.code || activeExam.mixedExamCodes[0]?.code || '101';
        }
        setSelectedExamCode(initialCode);

        // Tự động khôi phục tiến độ làm bài nếu từng bị gián đoạn mạng/F5
        const stuKey = currentStudent?.student_code || currentStudent?.username;
        if (stuKey) {
          const progressKey = `cbq_exam_progress_${activeExam.id}_${stuKey}`;
          const savedProgress = localStorage.getItem(progressKey);
          if (savedProgress) {
            try {
              const parsed = JSON.parse(savedProgress);
              if (parsed.examCode) {
                setSelectedExamCode(parsed.examCode);
              }
              if (parsed.answers && Object.keys(parsed.answers).length > 0) {
                setAnswers(parsed.answers);
                if (parsed.timeLeft && parsed.timeLeft > 0) {
                  setTimeLeft(parsed.timeLeft);
                }
                setExamStarted(true);
                setRestoredProgress(true);
              }
            } catch (_) {}
          }
        }
      } else {
        setExam(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!examStarted || examSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, examSubmitted, timeLeft]);

  // Tự động lưu tiến độ làm bài vào LocalStorage (Client-Side Edge Resilience)
  useEffect(() => {
    if (!examStarted || examSubmitted || !exam || !student) return;
    const stuKey = student.student_code || student.username;
    if (!stuKey) return;

    try {
      const progressKey = `cbq_exam_progress_${exam.id}_${stuKey}`;
      localStorage.setItem(progressKey, JSON.stringify({
        answers,
        timeLeft,
        examCode: selectedExamCode,
        savedAt: Date.now()
      }));
    } catch (_) {}
  }, [answers, timeLeft, examStarted, examSubmitted, exam, student, selectedExamCode]);

  const handleStartExam = () => {
    if (!student) {
      alert("Vui lòng đăng nhập tài khoản học sinh trước khi làm bài!");
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    setExamStarted(true);
  };

  const handleSelectPart1 = (qId, optionIdx) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSelectPart2 = (qId, subKey, boolVal) => {
    setAnswers(prev => {
      const current = prev[qId] || {};
      return {
        ...prev,
        [qId]: {
          ...current,
          [subKey]: boolVal
        }
      };
    });
  };

  const handleInputPart3 = (qId, textVal) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: textVal
    }));
  };

  const handleAutoSubmit = () => {
    alert("⏰ ĐÃ HẾT GIỜ LÀM BÀI! Hệ thống đang tự động thu bài và chấm điểm...");
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    if (examSubmitted) return;
    
    setSubmitting(true);
    try {
      const totalSeconds = (exam?.duration_minutes || 45) * 60 - timeLeft;
      const res = await submitStudentExam({
        examId: exam.id,
        student,
        answers,
        timeSpentSeconds: totalSeconds,
        examCode: selectedExamCode
      });

      setSubmissionResult(res);
      setExamSubmitted(true);

      // Xóa tiến độ nháp sau khi đã nộp bài thành công
      const stuKey = student?.student_code || student?.username;
      if (stuKey && exam?.id) {
        localStorage.removeItem(`cbq_exam_progress_${exam.id}_${stuKey}`);
      }
    } catch (err) {
      alert("Lỗi khi nộp bài: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', fontFamily: '"Inter", sans-serif' }}>Đang nạp đề kiểm tra...</div>;
  }

  if (!exam) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center', background: 'white', padding: '40px', borderRadius: '20px', border: '1px solid #e2e8f0', fontFamily: '"Inter", sans-serif' }}>
        <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#0f172a' }}>Chưa Có Bài Kiểm Tra Nào</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Giáo viên bộ môn chưa xuất bản bài kiểm tra trực tuyến nào cho lớp em.</p>
        <Link to="/student-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0284c7', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={16} /> Quay lại Không Gian Học Sinh
        </Link>
      </div>
    );
  }

  // Danh sách câu hỏi theo đúng mã đề thi đã đảo (hoặc đề gốc)
  const currentCodeObj = (exam?.mixedExamCodes || []).find(c => String(c.code) === String(selectedExamCode));
  const activeQuestions = currentCodeObj ? [
    ...(currentCodeObj.part1 || []),
    ...(currentCodeObj.part2 || []),
    ...(currentCodeObj.part3 || [])
  ] : (exam?.questions || []);

  // Màn hình xem kết quả sau khi nộp bài
  if (examSubmitted && submissionResult) {
    const { grade_result } = submissionResult;
    return (
      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '16px', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Award size={48} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>
              ✓ ĐÃ NỘP BÀI THÀNH CÔNG • MÃ ĐỀ: {submissionResult.exam_code || selectedExamCode}
            </div>

            <h2 style={{ fontSize: '26px', color: '#0f172a', fontWeight: '900', margin: '0 0 8px 0' }}>
              KẾT QUẢ BÀI KIỂM TRA TRỰC TUYẾN
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {exam.title} • Môn {exam.subject} • Học sinh: <strong>{student.full_name} ({student.student_class})</strong>
            </p>
          </div>

          {/* Big Score Box */}
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '2px solid #86efac', borderRadius: '20px', padding: '24px', maxWidth: '380px', margin: '0 auto 28px auto', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
              Điểm Tổng Kết
            </div>
            <div style={{ fontSize: '56px', fontWeight: '900', color: '#15803d', lineHeight: 1 }}>
              {grade_result.totalScore}
              <span style={{ fontSize: '20px', color: '#166534', fontWeight: 'normal' }}> / 10.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '13px', color: '#166534', borderTop: '1px solid #bbf7d0', paddingTop: '12px' }}>
              <div>Phần I: <strong>{grade_result.part1Score}đ</strong></div>
              <div>Phần II: <strong>{grade_result.part2Score}đ</strong></div>
              <div>Phần III: <strong>{grade_result.part3Score}đ</strong></div>
            </div>
          </div>

          {/* Detailed Question Review & KaTeX Solutions */}
          <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#0284c7" /> Lời Giải Chi Tiết Từng Câu (Chuẩn Công Thức KaTeX)
              </h3>
              <button 
                onClick={() => setShowSolutionDetail(!showSolutionDetail)}
                style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {showSolutionDetail ? 'Ẩn lời giải' : 'Xem chi tiết'}
              </button>
            </div>

            {showSolutionDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeQuestions.map((q, idx) => {
                  const detail = (grade_result.details || []).find(d => d.questionId === q.id);
                  const isFull = detail?.isCorrect || (detail?.score > 0);

                  return (
                    <div key={q.id} style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '14px' }}>
                          Câu {idx + 1} ({q.part === 'part1' ? 'Trắc nghiệm 4 op' : q.part === 'part2' ? 'Đúng / Sai' : 'Trả lời ngắn'})
                        </span>
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: isFull ? '#16a34a' : '#dc2626' }}>
                          +{detail?.score || 0} điểm
                        </span>
                      </div>

                      <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: '600', marginBottom: '10px' }}>
                        <MathView text={q.content} />
                      </div>

                      {q.explanation && (
                        <div style={{ fontSize: '13px', color: '#334155', background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', borderLeft: '4px solid #0284c7', marginTop: '8px' }}>
                          <strong style={{ color: '#0284c7' }}>💡 Lời giải chi tiết:</strong>
                          <div style={{ marginTop: '4px' }}>
                            <MathView text={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '30px' }}>
            <Link to="/student-dashboard" style={{ padding: '12px 28px', background: '#0284c7', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
              Quay Về Không Gian Học Sinh
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Màn hình chờ bắt đầu làm bài
  if (!examStarted) {
    const hasMultipleCodes = exam.mixedExamCodes && exam.mixedExamCodes.length > 0;

    return (
      <div style={{ maxWidth: '740px', margin: '40px auto', padding: '16px', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '4px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '14px' }}>
            <Sparkles size={14} color="#0284c7" /> PHÒNG THI TRỰC TUYẾN CHUẨN GDPT 2018 (HỖ TRỢ LATEX KATEX)
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0' }}>
            {exam.title}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '14px', marginBottom: '20px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
            <div>Môn học: <strong style={{ color: '#0284c7' }}>{exam.subject}</strong></div>
            <div>Khối lớp: <strong>{exam.grade || 'Toàn trường'}</strong></div>
            <div>Thời gian: <strong>{exam.duration_minutes || 45} phút</strong></div>
            <div>Số câu hỏi: <strong>{activeQuestions.length} câu</strong></div>
          </div>

          {/* Smart Exam Code Box */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>
                MÃ ĐỀ THI ĐƯỢC PHÂN BỔ (CHỐNG NHÌN BÀI)
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7', marginTop: '2px' }}>
                MÃ ĐỀ: {selectedExamCode}
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Hệ thống tự động hoán vị câu hỏi & đáp án riêng biệt cho từng thí sinh.
              </span>
            </div>

            {hasMultipleCodes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 'bold' }}>Đổi mã đề:</span>
                <select 
                  value={selectedExamCode} 
                  onChange={e => setSelectedExamCode(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #0284c7', fontWeight: 'bold', fontSize: '14px', background: 'white', color: '#0284c7' }}
                >
                  {exam.mixedExamCodes.map(c => (
                    <option key={c.code} value={c.code}>Mã {c.code}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '14px', padding: '16px', marginBottom: '28px', color: '#92400e', fontSize: '13.5px', lineHeight: 1.6 }}>
            <strong>📌 Quy chế phòng thi trực tuyến:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Hệ thống tự động đếm ngược và tự động thu bài khi hết giờ.</li>
              <li>Mỗi câu trả lời được lưu lại tức thì tại máy, mất mạng mở lại không bị mất bài làm.</li>
              <li>Công thức Toán & Khoa học hiển thị chuẩn KaTeX siêu sắc nét trên mọi thiết bị.</li>
              <li>Bài thi gồm 3 phần: Trắc nghiệm 4 chọn 1, Đúng/Sai 4 ý và Trả lời ngắn.</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleStartExam}
              style={{ padding: '14px 40px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)' }}
            >
              🚀 BẮT ĐẦU LÀM BÀI THI (MÃ ĐỀ {selectedExamCode})
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Màn hình làm bài thi
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ padding: '20px', maxWidth: '1080px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Sticky Top Assessment Bar */}
      <div style={{ position: 'sticky', top: '16px', zIndex: 100, background: '#0f172a', color: 'white', borderRadius: '16px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.4)', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '15px' }}>{exam.title}</strong>
            <span style={{ background: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
              MÃ ĐỀ: {selectedExamCode}
            </span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
            {student?.full_name} ({student?.student_class}) • Đã làm: <strong>{answeredCount}/{activeQuestions.length} câu</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: timeLeft < 300 ? '#dc2626' : 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px' }}>
            <Clock size={18} /> {formatTimer(timeLeft)}
          </div>

          <button
            onClick={() => {
              if (window.confirm("Em có chắc chắn muốn nộp bài thi ngay bây giờ?")) {
                handleSubmitExam();
              }
            }}
            disabled={submitting}
            style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}
          >
            {submitting ? 'Đang chấm...' : 'NỘP BÀI THI'}
          </button>
        </div>
      </div>

      {/* Auto-save & Restored Progress notification */}
      {restoredProgress && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#16a34a" />
          <span>Hệ thống đã tự động khôi phục bài làm của em từ phiên làm việc trước. Mã đề: <strong>{selectedExamCode}</strong>.</span>
        </div>
      )}

      {/* Quick Question Navigation Palette */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '14px 18px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bookmark size={15} color="#0284c7" /> Bảng Chuyển Nhanh Câu Hỏi ({answeredCount}/{activeQuestions.length}):
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            🟢 Đã làm • ⚪ Chưa làm (Bấm để nhảy đến câu)
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {activeQuestions.map((q, idx) => {
            const hasAns = answers[q.id] !== undefined && answers[q.id] !== '';
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(`q-box-${q.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: hasAns ? '1px solid #16a34a' : '1px solid #cbd5e1',
                  background: hasAns ? '#16a34a' : '#f8fafc',
                  color: hasAns ? 'white' : '#475569',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions list with KaTeX Math rendering */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {activeQuestions.map((q, idx) => {
          const userAns = answers[q.id];

          return (
            <div 
              key={q.id} 
              id={`q-box-${q.id}`}
              style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0284c7', background: '#e0f2fe', padding: '4px 12px', borderRadius: '14px' }}>
                  Câu {idx + 1} ({q.part === 'part1' ? 'Trắc nghiệm 4 lựa chọn' : q.part === 'part2' ? 'Trắc nghiệm Đúng/Sai' : 'Trả lời ngắn'})
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mức: {q.level || 'Thông hiểu'}</span>
              </div>

              {/* Question Content with KaTeX */}
              <div style={{ fontSize: '15.5px', color: '#0f172a', fontWeight: '600', lineHeight: 1.6, marginBottom: '14px' }}>
                <MathView text={q.content} />
              </div>

              {/* Question Image / Diagram for Math, Physics, Chemistry */}
              {q.image_url && (
                <div style={{ textAlign: 'center', margin: '14px 0 20px 0' }}>
                  <div style={{ display: 'inline-block', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <img 
                      src={q.image_url} 
                      alt="Hình vẽ / Đồ thị câu hỏi" 
                      style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block', borderRadius: '8px', cursor: 'zoom-in' }} 
                      onClick={() => window.open(q.image_url, '_blank')}
                      title="Bấm để mở xem ảnh ở kích thước đầy đủ"
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>🔍 Bấm vào hình để mở ảnh lớn</div>
                  </div>
                </div>
              )}

              {/* PHẦN 1: 4 Options with KaTeX */}
              {q.part === 'part1' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {(q.shuffledOptions || q.options || []).map((opt, optIdx) => {
                    const isSelected = userAns === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectPart1(q.id, optIdx)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                          background: isSelected ? '#f0f9ff' : 'white',
                          color: isSelected ? '#0369a1' : '#334155',
                          fontSize: '14px',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? '#0284c7' : '#e2e8f0', color: isSelected ? 'white' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
                          {letter}
                        </span>
                        <span style={{ flex: 1 }}><MathView inline text={opt} /></span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PHẦN 2: True / False Sub-items with KaTeX */}
              {q.part === 'part2' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(q.shuffledSubItems || q.subItems || []).map((sub, sIdx) => {
                    const subKey = sub.newKey || sub.key || ['a', 'b', 'c', 'd'][sIdx];
                    const subChoice = userAns?.[subKey];
                    return (
                      <div key={subKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '14.5px', color: '#334155', flex: 1, display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                          <strong>{subKey})</strong> 
                          <MathView inline text={sub.text} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleSelectPart2(q.id, subKey, true)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: subChoice === true ? '2px solid #16a34a' : '1px solid #cbd5e1',
                              background: subChoice === true ? '#dcfce7' : 'white',
                              color: subChoice === true ? '#166534' : '#475569',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            ĐÚNG
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPart2(q.id, subKey, false)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: subChoice === false ? '2px solid #dc2626' : '1px solid #cbd5e1',
                              background: subChoice === false ? '#fee2e2' : 'white',
                              color: subChoice === false ? '#991b1b' : '#475569',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            SAI
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PHẦN 3: Short answer with KaTeX preview */}
              {q.part === 'part3' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                    Nhập câu trả lời ngắn của em (số hoặc từ khóa):
                  </label>
                  <input
                    type="text"
                    value={userAns || ''}
                    onChange={e => handleInputPart3(q.id, e.target.value)}
                    placeholder="VD: 50 hoặc 0.5"
                    style={{ width: '240px', padding: '10px 14px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: 'bold', color: '#0284c7' }}
                  />
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Bottom Submit Button */}
      <div style={{ textAlign: 'center', marginTop: '36px', marginBottom: '40px' }}>
        <button
          onClick={() => {
            if (window.confirm("Em có chắc chắn đã kiểm tra kỹ toàn bộ bài làm và muốn nộp bài thi?")) {
              handleSubmitExam();
            }
          }}
          disabled={submitting}
          style={{ padding: '16px 44px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)' }}
        >
          {submitting ? 'Hệ thống đang chấm điểm...' : `✓ HOÀN THÀNH VÀ NỘP BÀI THI (ĐÃ LÀM ${answeredCount}/${activeQuestions.length})`}
        </button>
      </div>

    </div>
  );
}
