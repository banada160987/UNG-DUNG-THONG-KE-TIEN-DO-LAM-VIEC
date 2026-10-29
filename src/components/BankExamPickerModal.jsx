import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderTree, BookOpen, Layers, CheckSquare, Sparkles, Plus, Trash2, 
  Search, Filter, CheckCircle2, ChevronRight, ChevronDown, Check,
  Sliders, AlertTriangle, ArrowRight, HelpCircle, Eye
} from 'lucide-react';
import MathView from './MathView';
import { 
  getTaxonomyForSubject, 
  queryBankQuestions, 
  getQuestionStatsForNode, 
  generateExamFromMatrix,
  getAllBankQuestions 
} from '../services/questionBankService';

export default function BankExamPickerModal({
  isOpen,
  onClose,
  subject = 'Toán',
  grade = 'Khối 12',
  onInsertQuestions
}) {
  const [mode, setMode] = useState('matrix'); // 'matrix' | 'manual'
  const [taxonomy, setTaxonomy] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // Matrix Generator States
  // { [lessonId]: { nb: 0, th: 0, vd: 0, vdc: 0 } }
  const [matrixConfig, setMatrixConfig] = useState({});
  const [matrixLogs, setMatrixLogs] = useState(null);

  // Manual Selection States
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
  const [manualFilterLevel, setManualFilterLevel] = useState('all');
  const [manualFilterPart, setManualFilterPart] = useState('all');
  const [manualSearch, setManualSearch] = useState('');

  // Tải dữ liệu cây thư mục khi mở modal
  useEffect(() => {
    if (isOpen) {
      const tree = getTaxonomyForSubject(subject, grade);
      setTaxonomy(tree);
      
      // Tự động mở rộng chương đầu tiên và chọn bài đầu tiên
      if (tree?.chapters?.length > 0) {
        const firstCh = tree.chapters[0];
        setExpandedChapters({ [firstCh.id]: true });
        if (firstCh.lessons?.length > 0) {
          setSelectedLessonId(firstCh.lessons[0].id);
        }
      }
    }
  }, [isOpen, subject, grade]);

  const toggleChapter = (chId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chId]: !prev[chId]
    }));
  };

  // Cập nhật cấu hình Ma trận số lượng câu cho 1 bài học
  const handleMatrixCountChange = (lessonId, levelKey, value) => {
    const count = Math.max(0, parseInt(value, 10) || 0);
    setMatrixConfig(prev => ({
      ...prev,
      [lessonId]: {
        ...(prev[lessonId] || { nb: 0, th: 0, vd: 0, vdc: 0, essay: 0 }),
        [levelKey]: count
      }
    }));
  };

  // Tính tổng số câu hỏi yêu cầu trong Ma trận
  const matrixSummary = useMemo(() => {
    let totalNb = 0, totalTh = 0, totalVd = 0, totalVdc = 0, totalEssay = 0;
    Object.values(matrixConfig).forEach(item => {
      totalNb += item.nb || 0;
      totalTh += item.th || 0;
      totalVd += item.vd || 0;
      totalVdc += item.vdc || 0;
      totalEssay += item.essay || 0;
    });
    const total = totalNb + totalTh + totalVd + totalVdc + totalEssay;
    return { total, totalNb, totalTh, totalVd, totalVdc, totalEssay };
  }, [matrixConfig]);

  // Thực hiện Bốc đề tự động từ Ma trận
  const handleRunMatrixGenerator = () => {
    const specs = [];
    if (!taxonomy?.chapters) return;

    taxonomy.chapters.forEach(ch => {
      (ch.lessons || []).forEach(less => {
        const cfg = matrixConfig[less.id];
        if (cfg && (cfg.nb > 0 || cfg.th > 0 || cfg.vd > 0 || cfg.vdc > 0 || cfg.essay > 0)) {
          specs.push({
            lessonId: less.id,
            lessonTitle: less.title,
            ...cfg
          });
        }
      });
    });

    if (specs.length === 0) {
      alert("⚠️ Thầy/Cô vui lòng nhập số lượng câu hỏi cần bốc cho ít nhất một bài học trong Ma trận.");
      return;
    }

    const { selectedQuestions, missingLogs } = generateExamFromMatrix(specs, subject, grade);
    
    if (missingLogs && missingLogs.length > 0) {
      setMatrixLogs(missingLogs);
    } else {
      setMatrixLogs([]);
    }

    if (selectedQuestions.length === 0) {
      alert("❌ Ngân hàng câu hỏi chưa có câu hỏi nào khớp với Ma trận này. Thầy/Cô vui lòng kiểm tra lại số lượng tồn trong kho.");
      return;
    }

    if (onInsertQuestions) {
      onInsertQuestions(selectedQuestions);
      alert(`🎉 Đã bốc thành công ${selectedQuestions.length} câu hỏi từ Ngân hàng Tổ chuyên môn vào Đề thi!`);
      onClose();
    }
  };

  // Danh sách câu hỏi hiển thị trong Chế độ Chọn câu thủ công
  const manualQuestionsList = useMemo(() => {
    if (!selectedLessonId) return [];
    return queryBankQuestions({
      subject,
      grade,
      lessonId: selectedLessonId,
      level: manualFilterLevel,
      part: manualFilterPart,
      search: manualSearch
    });
  }, [subject, grade, selectedLessonId, manualFilterLevel, manualFilterPart, manualSearch]);

  const toggleSelectQuestion = (qId) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const handleSelectAllInCurrentLesson = () => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      manualQuestionsList.forEach(q => next.add(q.id));
      return next;
    });
  };

  const handleInsertManualSelected = () => {
    if (selectedQuestionIds.size === 0) {
      alert("⚠️ Thầy/Cô chưa tích chọn câu hỏi nào.");
      return;
    }

    const allBank = getAllBankQuestions();
    const pickedQuestions = allBank.filter(q => selectedQuestionIds.has(q.id));

    if (onInsertQuestions) {
      onInsertQuestions(pickedQuestions);
      alert(`🎉 Đã thêm ${pickedQuestions.length} câu hỏi đã chọn vào Đề thi!`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '1180px',
        width: '100%',
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        
        {/* Header Modal */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderTree size={22} color="#38bdf8" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                Ngân Hàng Câu Hỏi Tổ Chuyên Môn - {subject.toUpperCase()} ({grade.toUpperCase()})
              </h2>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
              Bốc đề tự động theo Ma trận Chương - Bài chuẩn GDPT 2018 hoặc duyệt chọn từng câu hỏi
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setMode('matrix')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'matrix' ? '#0284c7' : 'transparent',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Sliders size={14} /> 1. Ra Đề Theo Ma Trận
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'manual' ? '#0284c7' : 'transparent',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <CheckSquare size={14} /> 2. Duyệt & Tích Chọn Từng Câu ({selectedQuestionIds.size})
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '6px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT SIDEBAR: CÂY THƯ MỤC CHƯƠNG - BÀI */}
          <div style={{
            width: '320px',
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} color="#0284c7" /> Cấu Trúc Chương Trình SGK
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                {taxonomy?.chapters?.length || 0} Chương • GDPT 2018
              </div>
            </div>

            <div style={{ padding: '12px', flex: 1 }}>
              {(!taxonomy?.chapters || taxonomy.chapters.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                  Chưa có cây thư mục cho môn này.
                </div>
              ) : (
                taxonomy.chapters.map((ch, chIdx) => {
                  const isExpanded = !!expandedChapters[ch.id];
                  const chStats = getQuestionStatsForNode(ch.id);

                  return (
                    <div key={ch.id} style={{ marginBottom: '8px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      {/* Chapter Header */}
                      <div
                        onClick={() => toggleChapter(ch.id)}
                        style={{
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isExpanded ? '#f0f9ff' : '#ffffff',
                          borderBottom: isExpanded ? '1px solid #bae6fd' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                          {isExpanded ? <ChevronDown size={15} color="#0284c7" /> : <ChevronRight size={15} color="#64748b" />}
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: isExpanded ? '#0369a1' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ch.title}
                          </span>
                        </div>
                        <span style={{ fontSize: '10.5px', background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold' }}>
                          {chStats.total} câu
                        </span>
                      </div>

                      {/* Lessons List */}
                      {isExpanded && (
                        <div style={{ padding: '4px 6px' }}>
                          {(ch.lessons || []).map((less, lessIdx) => {
                            const isSelected = selectedLessonId === less.id;
                            const lessStats = getQuestionStatsForNode(less.id);
                            const cfg = matrixConfig[less.id] || { nb: 0, th: 0, vd: 0, vdc: 0, essay: 0 };
                            const hasConfig = cfg.nb > 0 || cfg.th > 0 || cfg.vd > 0 || cfg.vdc > 0 || cfg.essay > 0;

                            return (
                              <div
                                key={less.id}
                                onClick={() => setSelectedLessonId(less.id)}
                                style={{
                                  padding: '8px 10px',
                                  margin: '3px 0',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: isSelected ? '#0284c7' : '#ffffff',
                                  color: isSelected ? '#ffffff' : '#334155',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '6px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <span style={{ fontSize: '12px', fontWeight: isSelected ? '700' : '500', lineHeight: 1.3 }}>
                                  {less.title}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {hasConfig && mode === 'matrix' && (
                                    <span style={{ fontSize: '10px', background: isSelected ? '#ffffff' : '#dcfce7', color: isSelected ? '#0284c7' : '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                      Đã chọn {cfg.nb + cfg.th + cfg.vd + cfg.vdc + (cfg.essay || 0)}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '10.5px', opacity: isSelected ? 0.9 : 0.6, fontWeight: 'bold' }}>
                                    {lessStats.total}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT CONTENT: TÙY THEO CHẾ ĐỘ RA ĐỀ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: '#ffffff' }}>

            {/* CHẾ ĐỘ 1: RA ĐỀ THEO MA TRẬN */}
            {mode === 'matrix' && (
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Summary Banner */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>
                      Thiết Lập Ma Trận Phân Bổ Câu Hỏi Theo Từng Bài Học
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                      Nhập số lượng câu hỏi cần bốc cho mỗi mức độ. Hệ thống sẽ bốc ngẫu nhiên từ ngân hàng câu hỏi của tổ.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>TỔNG CÂU YÊU CẦU:</div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7' }}>
                        {matrixSummary.total} câu
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunMatrixGenerator}
                      disabled={matrixSummary.total === 0}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: matrixSummary.total > 0 ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#cbd5e1',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '13.5px',
                        cursor: matrixSummary.total > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: matrixSummary.total > 0 ? '0 4px 12px rgba(2,132,199,0.3)' : 'none'
                      }}
                    >
                      <Sparkles size={16} /> ⚡ Bốc Đề Tự Động Từ Ngân Hàng
                    </button>
                  </div>
                </div>

                {/* Cognitive Distribution Pills */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 14px', borderRadius: '8px', background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: '12.5px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#0369a1', fontWeight: 'bold' }}>Nhận biết (NB):</span>
                    <strong style={{ color: '#0284c7' }}>{matrixSummary.totalNb} câu</strong>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '12.5px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#065f46', fontWeight: 'bold' }}>Thông hiểu (TH):</span>
                    <strong style={{ color: '#059669' }}>{matrixSummary.totalTh} câu</strong>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '12.5px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#92400e', fontWeight: 'bold' }}>Vận dụng (VD):</span>
                    <strong style={{ color: '#d97706' }}>{matrixSummary.totalVd} câu</strong>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: '8px', background: '#faf5ff', border: '1px solid #e9d5ff', fontSize: '12.5px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#6b21a8', fontWeight: 'bold' }}>Vận dụng cao (VDC):</span>
                    <strong style={{ color: '#9333ea' }}>{matrixSummary.totalVdc} câu</strong>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '12.5px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#6d28d9', fontWeight: 'bold' }}>Tự luận (TL):</span>
                    <strong style={{ color: '#7c3aed' }}>{matrixSummary.totalEssay} câu</strong>
                  </div>
                </div>

                {/* Matrix Lessons Table */}
                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', width: '34%' }}>Chương & Bài Học Trong Cây Thư Mục</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '18%' }}>Kho Có Sẵn</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '9%', color: '#0284c7' }}>Nhận Biết</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '9%', color: '#059669' }}>Thông Hiểu</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '9%', color: '#d97706' }}>Vận Dụng</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '9%', color: '#9333ea' }}>Vận Dụng Cao</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '12%', color: '#7c3aed' }}>Tự Luận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(taxonomy?.chapters || []).map(ch => (
                        <React.Fragment key={ch.id}>
                          {/* Chapter Section Bar */}
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td colSpan={7} style={{ padding: '10px 16px', fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>
                              📂 {ch.title}
                            </td>
                          </tr>

                          {/* Lessons Rows */}
                          {(ch.lessons || []).map(less => {
                            const stats = getQuestionStatsForNode(less.id);
                            const cfg = matrixConfig[less.id] || { nb: 0, th: 0, vd: 0, vdc: 0, essay: 0 };

                            return (
                              <tr key={less.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 16px 10px 32px' }}>
                                  <div style={{ fontWeight: '600', color: '#334155' }}>{less.title}</div>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '11px', background: stats.total > 0 ? '#dcfce7' : '#fee2e2', color: stats.total > 0 ? '#15803d' : '#b91c1c', padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold', display: 'inline-block' }}>
                                    {stats.total} câu ({stats.nb} NB - {stats.th} TH - {stats.vd} VD - {stats.vdc} VDC - {stats.essay || 0} TL)
                                  </span>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    max={stats.nb || 99}
                                    value={cfg.nb || ''}
                                    placeholder="0"
                                    onChange={e => handleMatrixCountChange(less.id, 'nb', e.target.value)}
                                    style={{ width: '48px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: cfg.nb > stats.nb ? '1px solid #ef4444' : '1px solid #cbd5e1', fontWeight: 'bold', color: '#0284c7' }}
                                  />
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    max={stats.th || 99}
                                    value={cfg.th || ''}
                                    placeholder="0"
                                    onChange={e => handleMatrixCountChange(less.id, 'th', e.target.value)}
                                    style={{ width: '48px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: cfg.th > stats.th ? '1px solid #ef4444' : '1px solid #cbd5e1', fontWeight: 'bold', color: '#059669' }}
                                  />
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    max={stats.vd || 99}
                                    value={cfg.vd || ''}
                                    placeholder="0"
                                    onChange={e => handleMatrixCountChange(less.id, 'vd', e.target.value)}
                                    style={{ width: '48px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: cfg.vd > stats.vd ? '1px solid #ef4444' : '1px solid #cbd5e1', fontWeight: 'bold', color: '#d97706' }}
                                  />
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    max={stats.vdc || 99}
                                    value={cfg.vdc || ''}
                                    placeholder="0"
                                    onChange={e => handleMatrixCountChange(less.id, 'vdc', e.target.value)}
                                    style={{ width: '48px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: cfg.vdc > stats.vdc ? '1px solid #ef4444' : '1px solid #cbd5e1', fontWeight: 'bold', color: '#9333ea' }}
                                  />
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    max={stats.essay || 99}
                                    value={cfg.essay || ''}
                                    placeholder="0"
                                    onChange={e => handleMatrixCountChange(less.id, 'essay', e.target.value)}
                                    style={{ width: '48px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: (cfg.essay || 0) > (stats.essay || 0) ? '1px solid #ef4444' : '1px solid #ddd6fe', fontWeight: 'bold', color: '#7c3aed', background: '#faf5ff' }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Missing Questions Warning Logs */}
                {matrixLogs && matrixLogs.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12.5px', color: '#991b1b' }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <AlertTriangle size={15} /> Lưu ý số lượng câu hỏi trong kho:
                    </div>
                    {matrixLogs.map((log, idx) => (
                      <div key={idx}>
                        • <strong>{log.lessonTitle}</strong> ({log.level}): Yêu cầu {log.requested} câu nhưng kho chỉ có {log.found} câu (thiếu {log.missing} câu).
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHẾ ĐỘ 2: DUYỆT & TÍCH CHỌN TỪNG CÂU THỦ CÔNG */}
            {mode === 'manual' && (
              <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Filters & Cart Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Tìm kiếm nội dung câu hỏi..."
                        value={manualSearch}
                        onChange={e => setManualSearch(e.target.value)}
                        style={{ padding: '7px 12px 7px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '220px' }}
                      />
                      <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    </div>

                    <select
                      value={manualFilterLevel}
                      onChange={e => setManualFilterLevel(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold' }}
                    >
                      <option value="all">Tất cả mức độ</option>
                      <option value="Nhận biết">Nhận biết</option>
                      <option value="Thông hiểu">Thông hiểu</option>
                      <option value="Vận dụng">Vận dụng</option>
                      <option value="Vận dụng cao">Vận dụng cao</option>
                    </select>

                    <select
                      value={manualFilterPart}
                      onChange={e => setManualFilterPart(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold' }}
                    >
                      <option value="all">Tất cả phần thi</option>
                      <option value="part1">Phần I (4 lựa chọn)</option>
                      <option value="part2">Phần II (Đúng/Sai)</option>
                      <option value="part3">Phần III (Trả lời ngắn)</option>
                      <option value="essay">Phần Tự Luận</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleSelectAllInCurrentLesson}
                      style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Chọn tất cả bài này
                    </button>
                  </div>

                  {/* Cart Summary & Confirm Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      Đã chọn: <strong style={{ color: '#0284c7', fontSize: '16px' }}>{selectedQuestionIds.size}</strong> câu
                    </div>

                    <button
                      type="button"
                      onClick={handleInsertManualSelected}
                      disabled={selectedQuestionIds.size === 0}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selectedQuestionIds.size > 0 ? '#16a34a' : '#cbd5e1',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: selectedQuestionIds.size > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} /> Nạp {selectedQuestionIds.size} Câu Vào Đề Thi
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {manualQuestionsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                      <HelpCircle size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Không có câu hỏi nào trong bài học này khớp với bộ lọc.</div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>Thầy/Cô vui lòng chọn bài học khác trên cây thư mục bên trái hoặc thêm mới câu hỏi vào kho.</div>
                    </div>
                  ) : (
                    manualQuestionsList.map((q, idx) => {
                      const isChecked = selectedQuestionIds.has(q.id);

                      return (
                        <div
                          key={q.id}
                          style={{
                            padding: '16px',
                            marginBottom: '14px',
                            borderRadius: '12px',
                            border: isChecked ? '2px solid #0284c7' : '1px solid #e2e8f0',
                            background: isChecked ? '#f0f9ff' : '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectQuestion(q.id)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <span style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                                Câu {idx + 1}
                              </span>
                              <span style={{ 
                                fontSize: '11px', 
                                background: q.part === 'essay' ? '#f5f3ff' : '#e0f2fe', 
                                color: q.part === 'essay' ? '#7c3aed' : '#0369a1', 
                                padding: '2px 8px', 
                                borderRadius: '10px', 
                                fontWeight: 'bold' 
                              }}>
                                {q.part === 'part1' ? 'Phần I (4 lựa chọn)' : q.part === 'part2' ? 'Phần II (Đúng/Sai)' : q.part === 'part3' ? 'Phần III (Trả lời ngắn)' : `Phần Tự Luận (${q.maxScore || 2.0}đ)`}
                              </span>
                              <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                {q.level}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleSelectQuestion(q.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: isChecked ? '#0284c7' : '#e2e8f0',
                                color: isChecked ? '#ffffff' : '#475569',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {isChecked ? '✓ Đã chọn' : '+ Chọn câu này'}
                            </button>
                          </div>

                          {/* Content */}
                          <div style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#1e293b', marginBottom: '10px' }}>
                            <MathView text={q.content} />
                          </div>

                          {/* Options if Part 1 */}
                          {q.part === 'part1' && q.options && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '10px' }}>
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

                          {/* Sub items if Part 2 */}
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

                          {/* Short Answer if Part 3 */}
                          {q.part === 'part3' && (
                            <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 'bold', marginBottom: '8px' }}>
                              👉 Đáp số: <MathView inline text={q.shortAnswer} />
                            </div>
                          )}

                          {/* Essay Details & Rubric */}
                          {q.part === 'essay' && (
                            <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <strong style={{ color: '#86198f', fontSize: '13px' }}>📋 Hướng dẫn chấm & Thang điểm (Tối đa: {q.maxScore || 2.0} điểm):</strong>
                              </div>
                              {q.rubric && q.rubric.length > 0 && (
                                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginTop: '4px', background: '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
                                  <thead>
                                    <tr style={{ background: '#fae8ff', color: '#701a75' }}>
                                      <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #f0abfc' }}>Nội dung / Tiêu chí yêu cầu</th>
                                      <th style={{ padding: '6px 10px', width: '80px', textAlign: 'center', border: '1px solid #f0abfc' }}>Điểm</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {q.rubric.map((r, rIdx) => (
                                      <tr key={rIdx}>
                                        <td style={{ padding: '6px 10px', border: '1px solid #f0abfc', color: '#334155' }}><MathView inline text={r.criteria} /></td>
                                        <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', color: '#86198f', border: '1px solid #f0abfc' }}>{r.score}đ</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}

                          {q.explanation && (
                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px' }}>
                              💡 Lời giải: <MathView text={q.explanation} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
