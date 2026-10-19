import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Clock, CheckCircle2, AlertTriangle, ArrowLeft, Send, Sparkles, 
  HelpCircle, CheckSquare, Award, BookOpen, User, Lock, RotateCcw 
} from 'lucide-react';
import { getPublishedExams, submitStudentExam } from '../../services/smartAssessmentService';

export default function StudentExamPortal() {
  const navigate = useNavigate();
  const { examId } = useParams();

  const [student, setStudent] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Exam taking state
  const [answers, setAnswers] = useState({}); // { qId: choiceIndex OR { a: true, b: false } OR text }
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 phút mặc định
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    try {
      const studentStr = localStorage.getItem('cbq_current_student');
      if (studentStr) {
        setStudent(JSON.parse(studentStr));
      }
    } catch (_) {}

    loadExam();
  }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    try {
      const allExams = await getPublishedExams();
      let found = allExams.find(e => e.id === examId);
      
      // Nếu chưa có id trên URL, lấy bài kiểm tra active đầu tiên
      if (!found && allExams.length > 0) {
        found = allExams[0];
      }

      setExam(found || null);

      if (found && found.duration_minutes) {
        setTimeLeft(found.duration_minutes * 60);
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
        timeSpentSeconds: totalSeconds
      });

      setSubmissionResult(res);
      setExamSubmitted(true);
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
    return <div style={{ textAlign: 'center', padding: '60px' }}>Đang nạp đề kiểm tra...</div>;
  }

  if (!exam) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center', background: 'white', padding: '40px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
        <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#0f172a' }}>Chưa Có Bài Kiểm Tra Nào</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Giáo viên bộ môn chưa xuất bản bài kiểm tra trực tuyến nào cho lớp em.</p>
        <Link to="/student-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0284c7', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={16} /> Quay lại Không Gian Học Sinh
        </Link>
      </div>
    );
  }

  // Màn hình xem kết quả sau khi nộp bài
  if (examSubmitted && submissionResult) {
    const { grade_result } = submissionResult;
    return (
      <div style={{ maxWidth: '850px', margin: '30px auto', padding: '16px', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <Award size={48} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>
            ✓ ĐÃ NỘP BÀI THÀNH CÔNG
          </div>

          <h2 style={{ fontSize: '26px', color: '#0f172a', fontWeight: '900', margin: '0 0 8px 0' }}>
            KẾT QUẢ KIỂM TRA TRỰC TUYẾN
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>
            {exam.title} • Môn {exam.subject} • Học sinh: <strong>{student.full_name} ({student.student_class})</strong>
          </p>

          {/* Big Score Box */}
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '2px solid #86efac', borderRadius: '20px', padding: '24px', maxWidth: '360px', margin: '0 auto 28px auto' }}>
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            <Link to="/student-dashboard" style={{ padding: '12px 24px', background: '#0284c7', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
              Quay Về Không Gian Học Sinh
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Màn hình chờ bắt đầu
  if (!examStarted) {
    return (
      <div style={{ maxWidth: '720px', margin: '40px auto', padding: '16px', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '14px' }}>
            <Sparkles size={13} color="#0284c7" /> PHÒNG THI TRỰC TUYẾN CHUẨN GDPT 2018
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0' }}>
            {exam.title}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '14px', marginBottom: '24px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
            <div>Môn học: <strong style={{ color: '#0284c7' }}>{exam.subject}</strong></div>
            <div>Khối lớp: <strong>{exam.grade || 'Toàn trường'}</strong></div>
            <div>Thời gian: <strong>{exam.duration_minutes || 45} phút</strong></div>
            <div>Số câu hỏi: <strong>{(exam.questions || []).length} câu</strong></div>
          </div>

          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '14px', padding: '16px', marginBottom: '28px', color: '#92400e', fontSize: '13.5px', lineHeight: 1.6 }}>
            <strong>📌 Quy chế phòng thi trực tuyến:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Hệ thống tự động đếm ngược và tự động thu bài khi hết giờ.</li>
              <li>Mỗi câu trả lời được lưu lại tức thì, mất mạng vào lại không mất bài.</li>
              <li>Bài thi gồm 3 phần: Trắc nghiệm 4 chọn 1, Đúng/Sai lũy tiến và Trả lời ngắn.</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleStartExam}
              style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)' }}
            >
              🚀 BẮT ĐẦU LÀM BÀI THI
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Màn hình làm bài thi
  const questions = exam.questions || [];

  return (
    <div style={{ padding: '20px', maxWidth: '980px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Sticky Timer Bar */}
      <div style={{ position: 'sticky', top: '16px', zIndex: 100, background: '#1e1b4b', color: 'white', borderRadius: '16px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(30, 27, 75, 0.3)', marginBottom: '24px' }}>
        <div>
          <strong style={{ fontSize: '15px' }}>{exam.title}</strong>
          <span style={{ fontSize: '12px', opacity: 0.8, marginLeft: '8px' }}>({student?.full_name} - {student?.student_class})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: timeLeft < 300 ? '#dc2626' : 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px' }}>
            <Clock size={18} /> {formatTimer(timeLeft)}
          </div>

          <button
            onClick={() => {
              if (window.confirm("Em có chắc chắn muốn nộp bài thi ngay bây giờ?")) {
                handleSubmitExam();
              }
            }}
            disabled={submitting}
            style={{ padding: '8px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
          >
            {submitting ? 'Đang chấm...' : 'NỘP BÀI THI'}
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {questions.map((q, idx) => {
          const userAns = answers[q.id];

          return (
            <div key={q.id} style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0284c7', background: '#e0f2fe', padding: '4px 10px', borderRadius: '14px' }}>
                  Câu {idx + 1} ({q.part === 'part1' ? 'Trắc nghiệm 4 lựa chọn' : q.part === 'part2' ? 'Trắc nghiệm Đúng/Sai' : 'Trả lời ngắn'})
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mức: {q.level || 'Thông hiểu'}</span>
              </div>

              <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600', lineHeight: 1.6, marginBottom: '16px' }}>
                {q.content}
              </div>

              {/* PHẦN 1: 4 Options */}
              {q.part === 'part1' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {(q.options || []).map((opt, optIdx) => {
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
                        <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: isSelected ? '#0284c7' : '#e2e8f0', color: isSelected ? 'white' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 'bold', flexShrink: 0 }}>
                          {letter}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PHẦN 2: True / False Sub-items */}
              {q.part === 'part2' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(q.subItems || []).map(sub => {
                    const subChoice = userAns?.[sub.key];
                    return (
                      <div key={sub.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '14px', color: '#334155', flex: 1 }}>
                          <strong>{sub.key})</strong> {sub.text}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleSelectPart2(q.id, sub.key, true)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: subChoice === true ? '2px solid #16a34a' : '1px solid #cbd5e1',
                              background: subChoice === true ? '#dcfce7' : 'white',
                              color: subChoice === true ? '#166534' : '#475569',
                              fontWeight: 'bold',
                              fontSize: '12.5px',
                              cursor: 'pointer'
                            }}
                          >
                            ĐÚNG
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPart2(q.id, sub.key, false)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: subChoice === false ? '2px solid #dc2626' : '1px solid #cbd5e1',
                              background: subChoice === false ? '#fee2e2' : 'white',
                              color: subChoice === false ? '#991b1b' : '#475569',
                              fontWeight: 'bold',
                              fontSize: '12.5px',
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

              {/* PHẦN 3: Short answer */}
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
                    style={{ width: '220px', padding: '10px 14px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold' }}
                  />
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Bottom Submit Button */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={() => {
            if (window.confirm("Em có chắc chắn đã kiểm tra kỹ và muốn nộp bài thi?")) {
              handleSubmitExam();
            }
          }}
          disabled={submitting}
          style={{ padding: '14px 40px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)' }}
        >
          {submitting ? 'Đang chấm điểm...' : '✓ HOÀN THÀNH VÀ NỘP BÀI THI'}
        </button>
      </div>

    </div>
  );
}
