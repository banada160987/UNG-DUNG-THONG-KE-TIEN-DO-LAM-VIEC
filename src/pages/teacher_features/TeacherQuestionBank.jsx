import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FolderTree, BookOpen, Layers, Plus, Trash2, Edit3, Search, 
  Filter, Sparkles, Download, Upload, ArrowLeft, CheckCircle2, 
  HelpCircle, ChevronRight, ChevronDown, Award, Send, Save, Eye,
  Database, FileText, CheckSquare, RefreshCw
} from 'lucide-react';
import MathView, { MathToolbar } from '../../components/MathView';
import { getTeacherSession } from '../../services/authSessionManager';
import { 
  SUBJECT_OPTIONS, 
  GRADE_OPTIONS 
} from '../../services/examPresetsService';
import {
  getTaxonomyTree,
  saveTaxonomyTree,
  getTaxonomyForSubject,
  upsertChapter,
  upsertLesson,
  getAllBankQuestions,
  upsertBankQuestion,
  deleteBankQuestion,
  queryBankQuestions,
  getQuestionStatsForNode
} from '../../services/questionBankService';
import { generate2025ExamQuestionsAi } from '../../services/aiAssistantService';
import AiStatusBadge from '../../components/AiStatusBadge';
import AiSettingsModal from '../../components/AiSettingsModal';

export default function TeacherQuestionBank() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(() => getTeacherSession() || { full_name: 'Giáo viên THPT Cao Bá Quát', username: 'giaovien' });

  // Filter & Active Tree states
  const [selectedSubject, setSelectedSubject] = useState('Toán');
  const [selectedGrade, setSelectedGrade] = useState('Khối 12');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // Search & Filter Questions
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterPart, setFilterPart] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [targetChapterForLesson, setTargetChapterForLesson] = useState(null);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Form question states
  const [qPart, setQPart] = useState('part1');
  const [qLevel, setQLevel] = useState('Thông hiểu');
  const [qContent, setQContent] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qSubItems, setQSubItems] = useState([
    { key: 'a', text: '', isTrue: true },
    { key: 'b', text: '', isTrue: true },
    { key: 'c', text: '', isTrue: false },
    { key: 'd', text: '', isTrue: false }
  ]);
  const [qShortAnswer, setQShortAnswer] = useState('');
  const [qExplanation, setQExplanation] = useState('');

  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCount, setAiCount] = useState(4);
  const [aiLevel, setAiLevel] = useState('Thông hiểu');

  // Trigger re-render when storage updates
  const [refreshKey, setRefreshKey] = useState(0);

  // Lấy cây thư mục hiện tại của môn & khối
  const currentTaxonomy = useMemo(() => {
    return getTaxonomyForSubject(selectedSubject, selectedGrade);
  }, [selectedSubject, selectedGrade, refreshKey]);

  // Tự động mở rộng chương đầu tiên khi đổi môn / khối
  useEffect(() => {
    if (currentTaxonomy?.chapters?.length > 0) {
      const firstCh = currentTaxonomy.chapters[0];
      setExpandedChapters({ [firstCh.id]: true });
      setSelectedChapterId(firstCh.id);
      if (firstCh.lessons?.length > 0) {
        setSelectedLessonId(firstCh.lessons[0].id);
      } else {
        setSelectedLessonId(null);
      }
    } else {
      setSelectedChapterId(null);
      setSelectedLessonId(null);
    }
  }, [currentTaxonomy]);

  const toggleChapter = (chId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chId]: !prev[chId]
    }));
  };

  // Danh sách câu hỏi hiển thị
  const questionsList = useMemo(() => {
    return queryBankQuestions({
      subject: selectedSubject,
      grade: selectedGrade,
      lessonId: selectedLessonId || undefined,
      chapterId: !selectedLessonId ? selectedChapterId || undefined : undefined,
      level: filterLevel,
      part: filterPart,
      search: searchQuery
    });
  }, [selectedSubject, selectedGrade, selectedLessonId, selectedChapterId, filterLevel, filterPart, searchQuery, refreshKey]);

  // Thống kê bài học đang chọn
  const activeLessonStats = useMemo(() => {
    if (!selectedLessonId) return { total: 0, nb: 0, th: 0, vd: 0, vdc: 0 };
    return getQuestionStatsForNode(selectedLessonId);
  }, [selectedLessonId, refreshKey]);

  // Thêm chương mới
  const handleSaveNewChapter = () => {
    if (!newChapterTitle.trim()) {
      alert("Vui lòng nhập tên chương.");
      return;
    }
    upsertChapter(selectedSubject, selectedGrade, {
      id: `ch_${Date.now()}`,
      title: newChapterTitle.trim(),
      lessons: []
    });
    setNewChapterTitle('');
    setShowAddChapterModal(false);
    setRefreshKey(k => k + 1);
  };

  // Thêm bài học mới
  const handleSaveNewLesson = () => {
    if (!newLessonTitle.trim() || !targetChapterForLesson) {
      alert("Vui lòng nhập tên bài học.");
      return;
    }
    upsertLesson(selectedSubject, selectedGrade, targetChapterForLesson, {
      id: `less_${Date.now()}`,
      title: newLessonTitle.trim()
    });
    setNewLessonTitle('');
    setShowAddLessonModal(false);
    setRefreshKey(k => k + 1);
  };

  // Mở modal thêm câu hỏi mới
  const handleOpenAddQuestion = () => {
    if (!selectedLessonId) {
      alert("Thầy/Cô vui lòng chọn một Bài học cụ thể trên Cây thư mục trước khi thêm câu hỏi.");
      return;
    }
    setEditingQuestion(null);
    setQPart('part1');
    setQLevel('Thông hiểu');
    setQContent('');
    setQOptions(['', '', '', '']);
    setQCorrectIndex(0);
    setQSubItems([
      { key: 'a', text: '', isTrue: true },
      { key: 'b', text: '', isTrue: true },
      { key: 'c', text: '', isTrue: false },
      { key: 'd', text: '', isTrue: false }
    ]);
    setQShortAnswer('');
    setQExplanation('');
    setShowQuestionModal(true);
  };

  // Mở modal sửa câu hỏi
  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setQPart(q.part || 'part1');
    setQLevel(q.level || 'Thông hiểu');
    setQContent(q.content || '');
    setQOptions(q.options || ['', '', '', '']);
    setQCorrectIndex(q.correctAnswerIndex ?? 0);
    setQSubItems(q.subItems || [
      { key: 'a', text: '', isTrue: true },
      { key: 'b', text: '', isTrue: true },
      { key: 'c', text: '', isTrue: false },
      { key: 'd', text: '', isTrue: false }
    ]);
    setQShortAnswer(q.shortAnswer || '');
    setQExplanation(q.explanation || '');
    setShowQuestionModal(true);
  };

  // Lưu câu hỏi vào ngân hàng
  const handleSaveQuestion = () => {
    if (!qContent.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    const payload = {
      id: editingQuestion?.id || `bank_${Date.now()}`,
      subject: selectedSubject,
      grade: selectedGrade,
      chapterId: selectedChapterId,
      lessonId: selectedLessonId,
      level: qLevel,
      part: qPart,
      content: qContent.trim(),
      explanation: qExplanation.trim(),
      author: teacher?.full_name || 'Giáo viên bộ môn',
      createdAt: editingQuestion?.createdAt || new Date().toISOString()
    };

    if (qPart === 'part1') {
      payload.options = qOptions.map(o => o.trim());
      payload.correctAnswerIndex = qCorrectIndex;
    } else if (qPart === 'part2') {
      payload.subItems = qSubItems;
    } else if (qPart === 'part3') {
      payload.shortAnswer = qShortAnswer.trim();
    }

    upsertBankQuestion(payload);
    setShowQuestionModal(false);
    setRefreshKey(k => k + 1);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (qId) => {
    if (window.confirm("Thầy/Cô có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng đề của Tổ?")) {
      deleteBankQuestion(qId);
      setRefreshKey(k => k + 1);
    }
  };

  // AI Sinh câu hỏi vào đúng Bài học đang chọn
  const handleAiGenerateIntoLesson = async () => {
    if (!selectedLessonId) return;
    const currentLesson = currentTaxonomy?.chapters
      ?.flatMap(c => c.lessons || [])
      ?.find(l => l.id === selectedLessonId);

    setAiLoading(true);
    try {
      const generated = await generate2025ExamQuestionsAi({
        subject: selectedSubject,
        grade: selectedGrade.replace('Khối ', ''),
        topic: currentLesson?.title || 'Kiến thức trọng tâm',
        part: 'mixed',
        count: Number(aiCount) || 4,
        level: aiLevel
      });

      if (generated && generated.length > 0) {
        generated.forEach((gq, idx) => {
          upsertBankQuestion({
            ...gq,
            id: `ai_bank_${Date.now()}_${idx}`,
            subject: selectedSubject,
            grade: selectedGrade,
            chapterId: selectedChapterId,
            lessonId: selectedLessonId,
            author: 'Trợ lý AI Gemini',
            createdAt: new Date().toISOString()
          });
        });
        alert(`🎉 Đã sinh và nạp thành công ${generated.length} câu hỏi AI vào bài: "${currentLesson?.title}"!`);
        setShowAiModal(false);
        setRefreshKey(k => k + 1);
      } else {
        alert("Không nhận được phản hồi từ AI. Vui lòng thử lại.");
      }
    } catch (e) {
      alert("Lỗi khi sinh câu hỏi AI: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const activeLessonObj = useMemo(() => {
    return currentTaxonomy?.chapters
      ?.flatMap(c => c.lessons || [])
      ?.find(l => l.id === selectedLessonId);
  }, [currentTaxonomy, selectedLessonId]);

  return (
    <div style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/giao-vien/ra-de-thi')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <ArrowLeft size={16} /> Quay lại Trang Ra Đề Thi
          </button>
          
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderTree color="#0284c7" size={24} /> Phân Hệ Ngân Hàng Đề Tổ Chuyên Môn
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <AiStatusBadge onOpenSettings={() => setShowAiSettings(true)} />
          
          <Link
            to="/giao-vien/ra-de-thi"
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(2,132,199,0.3)'
            }}
          >
            <Sparkles size={15} /> ⚡ Chuyển Sang Soạn & Trộn Đề Thi
          </Link>
        </div>
      </div>

      {/* Subject & Grade Filter Bar */}
      <div style={{
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Môn Học (*):
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                fontWeight: '700',
                color: '#0284c7',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {SUBJECT_OPTIONS.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.icon} {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Khối Lớp:
            </label>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                fontWeight: '700',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {GRADE_OPTIONS.map(g => (
                <option key={g} value={g}>{g} (GDPT 2018)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Bank Stats for this Subject & Grade */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TỔNG CÂU HỎI TRONG KHO</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0284c7' }}>
              {getAllBankQuestions().filter(q => q.subject === selectedSubject && q.grade === selectedGrade).length} câu
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTargetChapterForLesson(null);
              setShowAddChapterModal(true);
            }}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={15} /> Thêm Chương Mới
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (2 Columns: Tree & Question Bank) */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: CÂY THƯ MỤC PHÂN CẤP CHƯƠNG - BÀI */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} color="#0284c7" /> Cây Thư Mục Chương - Bài
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                {currentTaxonomy?.chapters?.length || 0} Chương của {selectedSubject} ({selectedGrade})
              </div>
            </div>
          </div>

          <div style={{ padding: '14px', maxHeight: '72vh', overflowY: 'auto' }}>
            {(!currentTaxonomy?.chapters || currentTaxonomy.chapters.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b', fontSize: '13px' }}>
                Chưa có chương nào. Thầy/Cô bấm "Thêm Chương Mới" để bắt đầu xây dựng cây thư mục.
              </div>
            ) : (
              currentTaxonomy.chapters.map((ch, idx) => {
                const isExpanded = !!expandedChapters[ch.id];
                const chStats = getQuestionStatsForNode(ch.id);

                return (
                  <div key={ch.id} style={{ marginBottom: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {/* Chapter Header */}
                    <div
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isExpanded ? '#f0f9ff' : '#ffffff',
                        borderBottom: isExpanded ? '1px solid #bae6fd' : 'none'
                      }}
                      onClick={() => {
                        toggleChapter(ch.id);
                        setSelectedChapterId(ch.id);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                        {isExpanded ? <ChevronDown size={16} color="#0284c7" /> : <ChevronRight size={16} color="#64748b" />}
                        <span style={{ fontSize: '13px', fontWeight: '700', color: isExpanded ? '#0369a1' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ch.title}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', background: '#e2e8f0', color: '#475569', padding: '1px 7px', borderRadius: '8px', fontWeight: 'bold' }}>
                          {chStats.total} câu
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetChapterForLesson(ch.id);
                            setShowAddLessonModal(true);
                          }}
                          style={{
                            border: 'none',
                            background: '#0284c7',
                            color: 'white',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                          title="Thêm bài học vào chương này"
                        >
                          + Bài
                        </button>
                      </div>
                    </div>

                    {/* Lessons list */}
                    {isExpanded && (
                      <div style={{ padding: '6px 8px', background: '#ffffff' }}>
                        {(ch.lessons || []).length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#94a3b8', padding: '8px', fontStyle: 'italic', textAlign: 'center' }}>
                            Chưa có bài học nào. Bấm "+ Bài" để thêm.
                          </div>
                        ) : (
                          ch.lessons.map(less => {
                            const isSelected = selectedLessonId === less.id;
                            const stats = getQuestionStatsForNode(less.id);

                            return (
                              <div
                                key={less.id}
                                onClick={() => {
                                  setSelectedLessonId(less.id);
                                  setSelectedChapterId(ch.id);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  margin: '3px 0',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  background: isSelected ? '#0284c7' : '#f8fafc',
                                  color: isSelected ? '#ffffff' : '#334155',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <span style={{ fontSize: '12.5px', fontWeight: isSelected ? '700' : '500', lineHeight: 1.3 }}>
                                  {less.title}
                                </span>
                                <span style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.7, fontWeight: 'bold' }}>
                                  {stats.total} câu
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHI TIẾT NGÂN HÀNG CÂU HỎI THUỘC BÀI ĐANG CHỌN */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          
          {/* Active Lesson Header & Quick Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 'bold' }}>
                ĐƠN VỊ KIẾN THỨC ĐANG CHỌN:
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0 0', color: '#0f172a' }}>
                {activeLessonObj?.title || 'Tất Cả Câu Hỏi Trong Chương'}
              </h2>
            </div>

            {/* Actions for this lesson */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                disabled={!selectedLessonId}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: selectedLessonId ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)'
                }}
              >
                <Sparkles size={14} /> AI Soạn Thêm Câu Hỏi
              </button>

              <button
                type="button"
                onClick={handleOpenAddQuestion}
                disabled={!selectedLessonId}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: selectedLessonId ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                }}
              >
                <Plus size={15} /> Thêm Câu Hỏi Mới
              </button>
            </div>
          </div>

          {/* Cognitive Level Stats for Active Lesson */}
          {selectedLessonId && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 'bold' }}>NHẬN BIẾT</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0284c7', marginTop: '2px' }}>
                  {activeLessonStats.nb} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 'bold' }}>THÔNG HIỂU</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
                  {activeLessonStats.th} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold' }}>VẬN DỤNG</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#d97706', marginTop: '2px' }}>
                  {activeLessonStats.vd} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: 'bold' }}>VẬN DỤNG CAO</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#9333ea', marginTop: '2px' }}>
                  {activeLessonStats.vdc} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>TỔNG SỐ CÂU</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                  {activeLessonStats.total} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filter within Active Lesson */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Tìm nhanh nội dung câu hỏi trong bài này..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            </div>

            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold' }}
            >
              <option value="all">Mọi mức độ nhận thức</option>
              <option value="Nhận biết">1. Nhận biết</option>
              <option value="Thông hiểu">2. Thông hiểu</option>
              <option value="Vận dụng">3. Vận dụng</option>
              <option value="Vận dụng cao">4. Vận dụng cao</option>
            </select>

            <select
              value={filterPart}
              onChange={e => setFilterPart(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold' }}
            >
              <option value="all">Mọi định dạng phần thi</option>
              <option value="part1">Phần I: 4 lựa chọn</option>
              <option value="part2">Phần II: Đúng / Sai</option>
              <option value="part3">Phần III: Trả lời ngắn</option>
            </select>
          </div>

          {/* Questions List Render */}
          <div>
            {questionsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                <HelpCircle size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Chưa có câu hỏi nào trong mục này.</div>
                <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                  Thầy/Cô có thể bấm <strong>"Thêm Câu Hỏi Mới"</strong> hoặc dùng <strong>"AI Soạn Thêm Câu Hỏi"</strong> để nạp vào kho.
                </div>
              </div>
            ) : (
              questionsList.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    marginBottom: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                        Câu {idx + 1}
                      </span>
                      <span style={{ fontSize: '11.5px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {q.part === 'part1' ? 'Phần I (4 lựa chọn)' : q.part === 'part2' ? 'Phần II (Đúng/Sai)' : 'Phần III (Trả lời ngắn)'}
                      </span>
                      <span style={{ fontSize: '11.5px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {q.level}
                      </span>
                      {q.author && (
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                          • Tác giả: <strong>{q.author}</strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditQuestion(q)}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0284c7', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit3 size={13} /> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#1e293b', marginBottom: '12px' }}>
                    <MathView text={q.content} />
                  </div>

                  {/* Part 1 Options */}
                  {q.part === 'part1' && q.options && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctAnswerIndex;
                        return (
                          <div
                            key={optIdx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              background: isCorrect ? '#dcfce7' : '#f8fafc',
                              border: isCorrect ? '1px solid #86efac' : '1px solid #e2e8f0',
                              fontSize: '13px',
                              fontWeight: isCorrect ? 'bold' : 'normal',
                              color: isCorrect ? '#166534' : '#334155'
                            }}
                          >
                            <strong>{['A', 'B', 'C', 'D'][optIdx]}.</strong> <MathView inline text={opt} /> {isCorrect && '✓'}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Part 2 Sub-items */}
                  {q.part === 'part2' && q.subItems && (
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                      {q.subItems.map(sub => (
                        <div key={sub.key} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                          <div><strong>{sub.key})</strong> <MathView inline text={sub.text} /></div>
                          <strong style={{ color: sub.isTrue ? '#16a34a' : '#dc2626' }}>[{sub.isTrue ? 'ĐÚNG' : 'SAI'}]</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Part 3 Short Answer */}
                  {q.part === 'part3' && (
                    <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 'bold', marginBottom: '8px' }}>
                      👉 Đáp số: <MathView inline text={q.shortAnswer} />
                    </div>
                  )}

                  {q.explanation && (
                    <div style={{ fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                      💡 Lời giải chi tiết: <MathView text={q.explanation} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* MODAL: THÊM CHƯƠNG MỚI */}
      {showAddChapterModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: '#0f172a', fontWeight: '800' }}>
              Thêm Chương / Chủ Đề Mới
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Môn: <strong>{selectedSubject}</strong> • Khối: <strong>{selectedGrade}</strong>
            </p>
            <input
              type="text"
              placeholder="VD: Chương I: Đạo hàm và Khảo sát hàm số..."
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowAddChapterModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
              <button type="button" onClick={handleSaveNewChapter} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#ffffff', cursor: 'pointer', fontWeight: '700' }}>Lưu Chương</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM BÀI HỌC MỚI */}
      {showAddLessonModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: '#0f172a', fontWeight: '800' }}>
              Thêm Bài Học Mới Vào Chương
            </h3>
            <input
              type="text"
              placeholder="VD: Bài 1: Tính đơn điệu của hàm số..."
              value={newLessonTitle}
              onChange={e => setNewLessonTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowAddLessonModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
              <button type="button" onClick={handleSaveNewLesson} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#ffffff', cursor: 'pointer', fontWeight: '700' }}>Lưu Bài Học</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / SỬA CÂU HỎI TRỰC QUAN CÓ KATEX */}
      {showQuestionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                {editingQuestion ? 'Chỉnh Sửa Câu Hỏi Ngân Hàng' : 'Thêm Câu Hỏi Mới Vào Ngân Hàng'}
              </h3>
              <button type="button" onClick={() => setShowQuestionModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Định Dạng Phần Thi:</label>
                <select value={qPart} onChange={e => setQPart(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                  <option value="part1">Phần I: Trắc nghiệm 4 lựa chọn (A, B, C, D)</option>
                  <option value="part2">Phần II: Đúng / Sai (4 ý a, b, c, d)</option>
                  <option value="part3">Phần III: Trả lời ngắn (Short answer)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Mức Độ Nhận Thức:</label>
                <select value={qLevel} onChange={e => setQLevel(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                  <option value="Nhận biết">1. Nhận biết (Cơ bản - 40%)</option>
                  <option value="Thông hiểu">2. Thông hiểu (Chuẩn kiến thức - 30%)</option>
                  <option value="Vận dụng">3. Vận dụng (Tình huống thực tế - 20%)</option>
                  <option value="Vận dụng cao">4. Vận dụng cao (Phân hóa sâu - 10%)</option>
                </select>
              </div>
            </div>

            {/* Content with MathToolbar */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Nội Dung Câu Hỏi (*):</label>
              <MathToolbar onInsertFormula={(f) => setQContent(prev => prev + f)} />
              <textarea
                rows={4}
                value={qContent}
                onChange={e => setQContent(e.target.value)}
                placeholder="Nhập nội dung câu hỏi... Kẹp công thức toán học giữa cặp dấu $...$ (VD: $x^2 - 3x + 2 = 0$)"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Options based on Part */}
            {qPart === 'part1' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>4 Phương Án Trả Lời (Chọn nút radio ở phương án đúng):</label>
                {['A', 'B', 'C', 'D'].map((optKey, idx) => (
                  <div key={optKey} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={qCorrectIndex === idx}
                      onChange={() => setQCorrectIndex(idx)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <strong style={{ width: '20px' }}>{optKey}.</strong>
                    <input
                      type="text"
                      value={qOptions[idx] || ''}
                      onChange={e => {
                        const nextOpts = [...qOptions];
                        nextOpts[idx] = e.target.value;
                        setQOptions(nextOpts);
                      }}
                      placeholder={`Nội dung phương án ${optKey}...`}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {qPart === 'part2' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>4 Mệnh Đề Đúng / Sai Lũy Tiến:</label>
                {qSubItems.map((sub, idx) => (
                  <div key={sub.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <strong style={{ width: '20px' }}>{sub.key})</strong>
                    <input
                      type="text"
                      value={sub.text}
                      onChange={e => {
                        const nextSubs = [...qSubItems];
                        nextSubs[idx] = { ...nextSubs[idx], text: e.target.value };
                        setQSubItems(nextSubs);
                      }}
                      placeholder={`Nội dung mệnh đề ${sub.key}...`}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <select
                      value={sub.isTrue ? 'true' : 'false'}
                      onChange={e => {
                        const nextSubs = [...qSubItems];
                        nextSubs[idx] = { ...nextSubs[idx], isTrue: e.target.value === 'true' };
                        setQSubItems(nextSubs);
                      }}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: sub.isTrue ? '#16a34a' : '#dc2626' }}
                    >
                      <option value="true">ĐÚNG</option>
                      <option value="false">SAI</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {qPart === 'part3' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Đáp Số / Kết Quả Ngắn Điền Phiếu Tô (*):</label>
                <input
                  type="text"
                  value={qShortAnswer}
                  onChange={e => setQShortAnswer(e.target.value)}
                  placeholder="VD: 50 hoặc -1.25..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: 'bold', color: '#0284c7' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Lời Giải Chi Tiết / Hướng Dẫn Chấm:</label>
              <textarea
                rows={3}
                value={qExplanation}
                onChange={e => setQExplanation(e.target.value)}
                placeholder="Nhập lời giải thích ngắn gọn, các bước suy luận..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowQuestionModal(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
              <button type="button" onClick={handleSaveQuestion} style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>Lưu Vào Ngân Hàng</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI SINH CÂU HỎI VÀO BÀI HỌC */}
      {showAiModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={20} color="#7c3aed" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                Trợ Lý AI: Soạn Câu Hỏi Vào Bài Học
              </h3>
            </div>
            
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Môn: <strong>{selectedSubject}</strong> • Bài: <strong>{activeLessonObj?.title}</strong>
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Mức Độ Nhận Thức:</label>
              <select value={aiLevel} onChange={e => setAiLevel(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                <option value="Nhận biết">1. Nhận biết (Cơ bản)</option>
                <option value="Thông hiểu">2. Thông hiểu (Chuẩn kiến thức)</option>
                <option value="Vận dụng">3. Vận dụng (Tình huống thực tế)</option>
                <option value="Vận dụng cao">4. Vận dụng cao (Phân hóa sâu)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Số Lượng Câu Hỏi Cần Sinh:</label>
              <select value={aiCount} onChange={e => setAiCount(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                <option value={2}>2 Câu</option>
                <option value={4}>4 Câu (Chuẩn)</option>
                <option value={6}>6 Câu</option>
                <option value={8}>8 Câu</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowAiModal(false)} disabled={aiLoading} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
              <button
                type="button"
                onClick={handleAiGenerateIntoLesson}
                disabled={aiLoading}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? 'Đang Tạo Câu Hỏi...' : 'Bắt Đầu Sinh Câu Hỏi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      <AiSettingsModal isOpen={showAiSettings} onClose={() => setShowAiSettings(false)} />

    </div>
  );
}
