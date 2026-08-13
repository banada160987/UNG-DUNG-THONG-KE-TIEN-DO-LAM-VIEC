import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Trophy, Download, Trash2, Plus, CheckCircle, Edit3, MessageSquare, Star, Sparkles, Settings, Clock } from 'lucide-react';

export default function AdminQuiz() {
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' | 'questions'
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchQuizConfig = async () => {
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
      if (quizConfig.id) {
        await supabase.from('cbq_quizzes').update({
          title: quizConfig.title,
          description: quizConfig.description,
          time_limit_minutes: Number(quizConfig.time_limit_minutes) || 15,
          start_time: quizConfig.start_time,
          end_time: quizConfig.end_time,
          is_active: quizConfig.is_active
        }).eq('id', quizConfig.id);
      } else {
        const newQ = await supabase.from('cbq_quizzes').insert([{
          title: quizConfig.title,
          description: quizConfig.description,
          time_limit_minutes: Number(quizConfig.time_limit_minutes) || 15,
          start_time: quizConfig.start_time,
          end_time: quizConfig.end_time,
          is_active: quizConfig.is_active
        }]).select().single();
        if (newQ.data) setQuizConfig(newQ.data);
      }
      alert("Đã lưu cấu hình thời gian & thông tin cuộc thi thành công!");
    } catch (err) {
      alert("Lỗi lưu cấu hình: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cbq_quiz_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('cbq_quiz_questions')
      .select('*')
      .order('order_index', { ascending: true });
    if (data) setQuestions(data);
  };

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài nộp này?")) return;
    await supabase.from('cbq_quiz_submissions').delete().eq('id', id);
    fetchSubmissions();
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

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const options = qType === 'multiple_choice' ? [optA, optB, optC, optD] : [];

    await supabase.from('cbq_quiz_questions').insert([{
      question_text: qText.trim(),
      question_type: qType,
      options: options,
      correct_option_index: Number(correctIdx),
      points: Number(points),
      order_index: questions.length
    }]);

    fetchQuestions();
    setShowQuestionModal(false);
    setQText('');
    setOptA(''); setOptB(''); setOptC(''); setOptD('');
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
            <button onClick={() => setShowQuestionModal(true)} style={styles.addBtn}>
              <Plus size={18} /> Thêm Câu Hỏi Mới
            </button>
          )}
          <button onClick={exportToExcel} style={styles.exportBtn}>
            <Download size={18} /> Xuất Excel / CSV (Thí Sinh)
          </button>
        </div>
      </div>

      {/* QUESTION MODAL */}
      {showQuestionModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ margin: '0 0 15px 0', color: '#be123c' }}>Thêm câu hỏi mới</h3>
            <form onSubmit={handleAddQuestion}>
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
                <button type="submit" style={styles.submitBtn}>Lưu Câu Hỏi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: SUBMISSIONS TABLE */}
      {activeTab === 'submissions' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', fontSize: '12px', color: '#475569' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Thí sinh / Lớp</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Điểm Trắc Nghiệm</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Điểm Tự Luận</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Tổng Điểm</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Bài Làm Tự Luận</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{sub.student_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{sub.student_group} • 📞 {sub.phone || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#166534' }}>
                    {sub.score || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="number"
                      defaultValue={sub.essay_score || 0}
                      onBlur={(e) => handleGradeEssay(sub.id, e.target.value)}
                      style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#be123c', fontSize: '15px' }}>
                    {sub.total_score || sub.score}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '300px', fontSize: '12.5px', color: '#334155' }}>
                    {sub.essay_answer ? (
                      <div style={{ background: '#fff7ed', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                        "{sub.essay_answer}"
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không viết tự luận</span>
                    )}
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
                    {q.question_type === 'essay' ? 'Tự luận' : `Trắc nghiệm (${q.points || 10}đ)`}
                  </span>
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
              <button onClick={() => handleDeleteQuestion(q.id)} style={{ padding: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
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
