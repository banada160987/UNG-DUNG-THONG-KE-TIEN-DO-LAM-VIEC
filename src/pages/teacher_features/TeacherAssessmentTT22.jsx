import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Award, Sparkles, Save, Download, Search, Check, RefreshCw, Filter, FileSpreadsheet, UserCheck, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

// 🤖 Preset Pedagogical Comment Engine (Chuẩn 5 Phẩm chất & 3 Năng lực Thông tư 22)
const PRESET_COMMENTS = {
  'Xuất sắc': [
    'Nắm vững toàn bộ kiến thức môn học, có tư duy sáng tạo vượt trội. Tích cực phát biểu, luôn hoàn thành xuất sắc các bài tập nhóm và dự án.',
    'Chăm chỉ, trung thực, có năng lực tự học cao. Thường xuyên hỗ trợ bạn bè trong lớp cùng tiến bộ.',
    'Có khả năng phản biện xuất sắc, đạt kết quả cao trong các kỳ thi kiểm tra định kỳ. Rất có trách nhiệm trong các hoạt động tập thể.'
  ],
  'Tốt': [
    'Kiến thức chắc chắn, có ý thức học tập tốt, hoàn thành đầy đủ các nhiệm vụ học tập được giao.',
    'Chăm chỉ nghe giảng, có năng lực tự học và giải quyết vấn đề tốt. Cần phát huy hơn nữa tinh thần rèn luyện.',
    'Ngoan ngoãn, hòa đồng, hoàn thành tốt bài tập trên lớp và bài tập về nhà. Điểm số ổn định qua các đợt kiểm tra.'
  ],
  'Khá': [
    'Có cố gắng trong học tập, hiểu bài cơ bản nhưng cần cẩn thận hơn trong các bài kiểm tra tự luận.',
    'Ngoan ngoãn, chấp hành tốt nội quy lớp học. Cần chủ động hơn trong việc phát biểu xây dựng bài.',
    'Nắm được các kiến thức trọng tâm, tiếp thu bài tốt nhưng đôi lúc chưa tập trung cao độ.'
  ],
  'Đạt': [
    'Hoàn thành các yêu cầu cơ bản của môn học. Cần dành thêm thời gian ôn tập lý thuyết và luyện tập bài tập ở nhà.',
    'Có tiến bộ ở các tuần cuối kỳ. Cần tích cực tương tác hơn với giáo viên và các bạn trong nhóm.'
  ],
  'Cần cố gắng': [
    'Còn hổng kiến thức căn bản, chưa tập trung trong giờ học. Cần sự phối hợp chặt chẽ từ phía gia đình để đôn đốc việc học ở nhà.'
  ]
};

export default function TeacherAssessmentTT22() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState('12A01');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStudent, setAiStudent] = useState(null);
  const [selectedRank, setSelectedRank] = useState('Tốt');
  const [selectedQualities, setSelectedQualities] = useState(['Chăm chỉ', 'Trách nhiệm']);
  const [selectedCompetencies, setSelectedCompetencies] = useState(['Tự chủ và tự học']);
  const [generatedComment, setGeneratedComment] = useState('');

  // Assessment Records State (Map by student_code)
  const [assessmentMap, setAssessmentMap] = useState({});

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    const tData = JSON.parse(currentTeacherStr);
    setTeacher(tData);
    if (tData.homeroom_class) {
      setSelectedClass(tData.homeroom_class);
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchClassStudents = async (cls) => {
    setLoading(true);
    try {
      const cleanClass = cls.trim();
      const { data } = await supabase
        .from('cbq_students')
        .select('*')
        .eq('student_class', cleanClass)
        .order('student_name', { ascending: true });

      let list = data || [];
      if (list.length === 0) {
        const localData = JSON.parse(localStorage.getItem('cbq_students_data') || '[]');
        list = localData.filter(s => s.student_class === cleanClass);
      }

      setStudents(list);

      // Load saved assessments
      const savedMap = JSON.parse(localStorage.getItem(`cbq_assessment_tt22_${cleanClass}`) || '{}');
      setAssessmentMap(savedMap);
    } catch (err) {
      console.warn("Lỗi nạp danh sách học sinh:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = (studentCode, field, value) => {
    const updated = {
      ...assessmentMap,
      [studentCode]: {
        ...(assessmentMap[studentCode] || {}),
        [field]: value
      }
    };
    setAssessmentMap(updated);
  };

  const handleOpenAiModal = (student) => {
    setAiStudent(student);
    setShowAiModal(true);
    generateAiPedagogicalComment('Tốt', ['Chăm chỉ', 'Trách nhiệm'], ['Tự chủ và tự học']);
  };

  const generateAiPedagogicalComment = (rank, qualities, comps) => {
    const presets = PRESET_COMMENTS[rank] || PRESET_COMMENTS['Tốt'];
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    
    let qualStr = qualities.length > 0 ? ` Thể hiện rõ phẩm chất ${qualities.join(', ').toLowerCase()}.` : '';
    let compStr = comps.length > 0 ? ` Có năng lực ${comps.join(', ').toLowerCase()} phát triển tốt.` : '';

    const finalComment = `${randomPreset}${qualStr}${compStr}`;
    setGeneratedComment(finalComment);
  };

  const handleApplyAiComment = () => {
    if (!aiStudent) return;
    handleUpdateScore(aiStudent.student_code, 'comment', generatedComment);
    setShowAiModal(false);
  };

  const handleSaveAllAssessments = () => {
    localStorage.setItem(`cbq_assessment_tt22_${selectedClass}`, JSON.stringify(assessmentMap));
    alert(`🎉 Đã lưu toàn bộ Bảng đánh giá & Nhận xét Thông tư 22 cho Lớp ${selectedClass}!`);
  };

  const handleExportExcelTT22 = () => {
    if (students.length === 0) return alert("Không có dữ liệu học sinh!");

    const excelData = students.map((s, idx) => {
      const rec = assessmentMap[s.student_code] || {};
      return {
        'STT': idx + 1,
        'Mã Học Sinh': s.student_code,
        'Họ và Tên': s.student_name || s.full_name,
        'Lớp': selectedClass,
        'Điểm ĐTX 1': rec.dtx1 || '',
        'Điểm ĐTX 2': rec.dtx2 || '',
        'Điểm ĐGK': rec.dgk || '',
        'Điểm ĐCK': rec.dck || '',
        'Đánh giá ĐTNK / HĐTN': rec.statusPass || 'Đạt',
        'Lời Nhận Xét Sư Phạm (TT 22)': rec.comment || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 24 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 20 }, { wch: 45 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Danh_Gia_TT22_${selectedClass}`);
    XLSX.writeFile(wb, `Bang_Danh_Gia_TT22_Lop_${selectedClass}.xlsx`);
  };

  if (!teacher) return null;

  const filteredStudents = students.filter(s => {
    const name = (s.student_name || s.full_name || '').toLowerCase();
    const code = (s.student_code || '').toLowerCase();
    return !searchTerm || name.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={20} /> Bảng điều khiển Giáo viên
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSaveAllAssessments} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(22,163,74,0.3)' }}>
            <Save size={18} /> Lưu Bảng Đánh Giá TT22
          </button>

          <button onClick={handleExportExcelTT22} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(2,132,199,0.3)' }}>
            <FileSpreadsheet size={18} /> Xuất Excel Nộp CSDL
          </button>
        </div>
      </div>

      {/* Title Card */}
      <div style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', padding: '24px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(21,128,61,0.2)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={28} /> Trợ Lý AI Đánh Giá & Nhận Xét Học Sinh (Thông Tư 22/2021/TT-BGDĐT)
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Tự động sinh nhận xét sư phạm cá thể hóa dựa trên 5 Phẩm chất & 3 Năng lực cốt lõi theo Chương trình GDPT 2018.
        </p>
      </div>

      {/* Main Table Container */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Class Filter & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#334155' }}>Lớp chủ nhiệm / Bộ môn:</span>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#166534' }}>
              <option value="12A01">Lớp 12A01</option>
              <option value="12A02">Lớp 12A02</option>
              <option value="11A01">Lớp 11A01</option>
              <option value="10A01">Lớp 10A01</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '260px' }}>
            <Search size={16} color="#64748b" />
            <input type="text" placeholder="Tìm theo Tên hoặc Mã HS..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }} />
          </div>
        </div>

        {/* Table Roster */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#15803d', fontWeight: 'bold' }}>⏳ Đang tải danh sách học sinh lớp {selectedClass}...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f0fdf4', borderBottom: '2px solid #bbf7d0', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>STT</th>
                  <th style={{ padding: '10px' }}>Mã HS</th>
                  <th style={{ padding: '10px' }}>Họ và Tên Học Sinh</th>
                  <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>ĐTX1</th>
                  <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>ĐTX2</th>
                  <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>ĐGK</th>
                  <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>ĐCK</th>
                  <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>ĐH/Chế độ</th>
                  <th style={{ padding: '10px' }}>Lời Nhận Xét Sư Phạm (TT 22)</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác AI</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Không tìm thấy học sinh</td></tr>
                ) : filteredStudents.map((s, idx) => {
                  const rec = assessmentMap[s.student_code] || {};
                  return (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>{s.student_code}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>{s.student_name || s.full_name}</td>
                      
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <input type="text" value={rec.dtx1 || ''} onChange={e => handleUpdateScore(s.student_code, 'dtx1', e.target.value)} style={styles.scoreInput} />
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <input type="text" value={rec.dtx2 || ''} onChange={e => handleUpdateScore(s.student_code, 'dtx2', e.target.value)} style={styles.scoreInput} />
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <input type="text" value={rec.dgk || ''} onChange={e => handleUpdateScore(s.student_code, 'dgk', e.target.value)} style={styles.scoreInput} />
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <input type="text" value={rec.dck || ''} onChange={e => handleUpdateScore(s.student_code, 'dck', e.target.value)} style={styles.scoreInput} />
                      </td>

                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <select value={rec.statusPass || 'Đạt'} onChange={e => handleUpdateScore(s.student_code, 'statusPass', e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                          <option value="Đạt">🟢 Đạt</option>
                          <option value="Chưa đạt">🔴 Chưa đạt</option>
                        </select>
                      </td>

                      <td style={{ padding: '6px' }}>
                        <input 
                          type="text" 
                          value={rec.comment || ''} 
                          onChange={e => handleUpdateScore(s.student_code, 'comment', e.target.value)} 
                          style={styles.commentInput} 
                          placeholder="Chưa có nhận xét..." 
                        />
                      </td>

                      <td style={{ padding: '6px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleOpenAiModal(s)}
                          style={{ padding: '6px 10px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '6px', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Tự động sinh nhận xét sư phạm AI"
                        >
                          <Sparkles size={13} /> AI Nhận xét
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🤖 AI COMMENT GENERATOR MODAL */}
      {showAiModal && aiStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px' }}>
                <Sparkles size={20} color="#16a34a" /> 🤖 AI Trợ Lý Nhận Xét Sư Phạm (TT 22)
              </h3>
              <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
              Học sinh: <strong>{aiStudent.student_name || aiStudent.full_name}</strong> (Mã HS: {aiStudent.student_code} - Lớp {selectedClass})
            </div>

            {/* Config Selectors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div>
                <label style={styles.label}>1. Xếp loại lực học / tiến bộ:</label>
                <select value={selectedRank} onChange={e => { setSelectedRank(e.target.value); generateAiPedagogicalComment(e.target.value, selectedQualities, selectedCompetencies); }} style={styles.input}>
                  <option value="Xuất sắc">⭐ Xuất sắc (Rất tích cực & sáng tạo)</option>
                  <option value="Tốt">🟢 Tốt (Nắm vững kiến thức, hoàn thành bài)</option>
                  <option value="Khá">🔵 Khá (Tiếp thu khá, cần rèn luyện thêm)</option>
                  <option value="Đạt">🟡 Đạt (Hoàn thành yêu cầu cơ bản)</option>
                  <option value="Cần cố gắng">🔴 Cần cố gắng (Cần gia đình đôn đốc thêm)</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>2. Phẩm chất tiêu biểu (GDPT 2018):</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {['Yêu nước', 'Nhân ái', 'Chăm chỉ', 'Trung thực', 'Trách nhiệm'].map(q => (
                    <label key={q} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedQualities.includes(q)}
                        onChange={e => {
                          const newQ = e.target.checked ? [...selectedQualities, q] : selectedQualities.filter(item => item !== q);
                          setSelectedQualities(newQ);
                          generateAiPedagogicalComment(selectedRank, newQ, selectedCompetencies);
                        }}
                      />
                      {q}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.label}>3. Năng lực tiêu biểu (GDPT 2018):</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {['Tự chủ và tự học', 'Giao tiếp và hợp tác', 'Giải quyết vấn đề và sáng tạo'].map(c => (
                    <label key={c} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedCompetencies.includes(c)}
                        onChange={e => {
                          const newC = e.target.checked ? [...selectedCompetencies, c] : selectedCompetencies.filter(item => item !== c);
                          setSelectedCompetencies(newC);
                          generateAiPedagogicalComment(selectedRank, selectedQualities, newC);
                        }}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Comment Box */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ ...styles.label, margin: 0 }}>Lời nhận xét AI đã tổng hợp:</label>
                <button onClick={() => generateAiPedagogicalComment(selectedRank, selectedQualities, selectedCompetencies)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} /> Đổi mẫu khác
                </button>
              </div>
              <textarea 
                rows={4} 
                value={generatedComment} 
                onChange={e => setGeneratedComment(e.target.value)} 
                style={{ ...styles.textarea, fontWeight: 'bold', color: '#0f172a', background: '#fafafa' }} 
              />
            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowAiModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>
                Hủy
              </button>
              <button onClick={handleApplyAiComment} style={{ padding: '8px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> Áp Dụng Lời Nhận Xét
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' },
  input: { width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' },
  scoreInput: { width: '45px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '13px' },
  commentInput: { width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }
};
