import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FolderTree, BookOpen, Layers, Plus, Trash2, Edit3, Search, 
  Filter, Sparkles, Download, Upload, ArrowLeft, CheckCircle2, 
  HelpCircle, ChevronRight, ChevronDown, Award, Send, Save, Eye,
  Database, FileText, CheckSquare, RefreshCw, BarChart3, Clock,
  ShieldCheck, Check, FileUp, AlertCircle, Printer, X
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
  bulkUpsertBankQuestions,
  setQuestionApprovalStatus,
  bulkApproveQuestionsInLesson,
  deleteBankQuestion,
  queryBankQuestions,
  getQuestionStatsForNode
} from '../../services/questionBankService';
import { readExamFileAsText, parseExamText } from '../../services/examImportParser';
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
  const [filterStatus, setFilterStatus] = useState('all');
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
  const [qMaxScore, setQMaxScore] = useState('2.0');
  const [qExplanation, setQExplanation] = useState('');

  // Import Word / Text Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState('file'); // 'file' | 'paste'
  const [importFile, setImportFile] = useState(null);
  const [importRawText, setImportRawText] = useState('');
  const [importDefaultLevel, setImportDefaultLevel] = useState('Thông hiểu');
  const [importTargetStatus, setImportTargetStatus] = useState('approved'); // 'approved' | 'pending'
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState([]);
  const [selectedImportIndices, setSelectedImportIndices] = useState(new Set());
  const [importIsParsing, setImportIsParsing] = useState(false);

  // Coverage Matrix Modal states
  const [showCoverageModal, setShowCoverageModal] = useState(false);

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
      status: filterStatus,
      search: searchQuery
    });
  }, [selectedSubject, selectedGrade, selectedLessonId, selectedChapterId, filterLevel, filterPart, filterStatus, searchQuery, refreshKey]);

  // Thống kê bài học đang chọn
  const activeLessonStats = useMemo(() => {
    if (!selectedLessonId) return { total: 0, nb: 0, th: 0, vd: 0, vdc: 0, essay: 0 };
    return getQuestionStatsForNode(selectedLessonId);
  }, [selectedLessonId, refreshKey]);

  // Số lượng câu hỏi chờ thẩm định trong bài học đang chọn
  const pendingInActiveLesson = useMemo(() => {
    if (!selectedLessonId) return 0;
    const all = getAllBankQuestions();
    return all.filter(q => q.lessonId === selectedLessonId && q.status === 'pending').length;
  }, [selectedLessonId, refreshKey]);

  const activeLessonObj = useMemo(() => {
    return currentTaxonomy?.chapters
      ?.flatMap(c => c.lessons || [])
      ?.find(l => l.id === selectedLessonId);
  }, [currentTaxonomy, selectedLessonId]);

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
    setQMaxScore('2.0');
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
    setQMaxScore(q.maxScore ? String(q.maxScore) : '2.0');
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
      status: editingQuestion?.status || 'approved',
      createdAt: editingQuestion?.createdAt || new Date().toISOString()
    };

    if (qPart === 'part1') {
      payload.options = qOptions.map(o => o.trim());
      payload.correctAnswerIndex = qCorrectIndex;
    } else if (qPart === 'part2') {
      payload.subItems = qSubItems;
    } else if (qPart === 'part3') {
      payload.shortAnswer = qShortAnswer.trim();
    } else if (qPart === 'essay') {
      payload.maxScore = parseFloat(qMaxScore) || 2.0;
      payload.title = editingQuestion?.title || `Câu hỏi Tự luận (${payload.maxScore.toFixed(1)} điểm)`;
      payload.rubric = editingQuestion?.rubric || [
        { criteria: 'Ý 1: Nêu đúng bản chất lý thuyết hoặc căn cứ định luật', score: +(payload.maxScore / 2).toFixed(2) },
        { criteria: 'Ý 2: Lập luận logic và đưa ra kết luận chính xác', score: +(payload.maxScore / 2).toFixed(2) }
      ];
    }

    upsertBankQuestion(payload);
    setShowQuestionModal(false);
    setRefreshKey(k => k + 1);
  };

  // Duyệt / Chuyển trạng thái một câu hỏi
  const handleToggleQuestionStatus = (qId, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    setQuestionApprovalStatus(qId, nextStatus);
    setRefreshKey(k => k + 1);
  };

  // Duyệt toàn bộ câu hỏi trong bài học đang chọn
  const handleBulkApproveActiveLesson = () => {
    if (!selectedLessonId) return;
    const count = bulkApproveQuestionsInLesson(selectedLessonId);
    alert(`🎉 Đã phê duyệt chính thức toàn bộ ${count} câu hỏi trong bài: "${activeLessonObj?.title}"!`);
    setRefreshKey(k => k + 1);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (qId) => {
    if (window.confirm("Thầy/Cô có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng đề của Tổ?")) {
      deleteBankQuestion(qId);
      setRefreshKey(k => k + 1);
    }
  };

  // Mở modal Import Word / Text
  const handleOpenImportModal = () => {
    if (!selectedLessonId) {
      alert("Thầy/Cô vui lòng chọn một Bài học cụ thể trên Cây thư mục trước khi nhập đề.");
      return;
    }
    setImportRawText('');
    setImportFile(null);
    setParsedPreviewQuestions([]);
    setSelectedImportIndices(new Set());
    setShowImportModal(true);
  };

  // Đọc file Word (.docx) hoặc Text (.txt)
  const handleFileImportChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportIsParsing(true);
    try {
      const text = await readExamFileAsText(file);
      setImportRawText(text);
      // Tự động phân tích ngay
      const parsed = parseExamText(text, importDefaultLevel);
      setParsedPreviewQuestions(parsed);
      setSelectedImportIndices(new Set(parsed.map((_, idx) => idx)));
    } catch (err) {
      alert("Lỗi khi đọc file Word: " + err.message);
    } finally {
      setImportIsParsing(false);
    }
  };

  // Phân tích văn bản nhập tay
  const handleRunManualParse = () => {
    if (!importRawText.trim()) {
      alert("Vui lòng dán văn bản câu hỏi hoặc chọn file Word trước.");
      return;
    }
    setImportIsParsing(true);
    try {
      const parsed = parseExamText(importRawText, importDefaultLevel);
      if (parsed.length === 0) {
        alert("Không nhận diện được câu hỏi nào. Vui lòng kiểm tra định dạng (ví dụ: 'Câu 1:', 'A.', 'B.', '[NB]', 'Đáp án: A'...)");
      }
      setParsedPreviewQuestions(parsed);
      setSelectedImportIndices(new Set(parsed.map((_, idx) => idx)));
    } finally {
      setImportIsParsing(false);
    }
  };

  // Chọn / bỏ chọn câu hỏi khi import
  const handleToggleSelectImportQ = (index) => {
    setSelectedImportIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleToggleSelectAllImport = () => {
    if (selectedImportIndices.size === parsedPreviewQuestions.length) {
      setSelectedImportIndices(new Set());
    } else {
      setSelectedImportIndices(new Set(parsedPreviewQuestions.map((_, idx) => idx)));
    }
  };

  // Nạp câu hỏi đã chọn vào bài học
  const handleSaveImportedQuestions = () => {
    const toImport = parsedPreviewQuestions.filter((_, idx) => selectedImportIndices.has(idx));
    if (toImport.length === 0) {
      alert("Vui lòng chọn ít nhất 1 câu hỏi để nạp vào ngân hàng.");
      return;
    }

    const preparedList = toImport.map((q, idx) => ({
      ...q,
      id: `imported_bank_${Date.now()}_${idx}`,
      subject: selectedSubject,
      grade: selectedGrade,
      chapterId: selectedChapterId,
      lessonId: selectedLessonId,
      author: teacher?.full_name || 'Giáo viên bộ môn',
      status: importTargetStatus,
      createdAt: new Date().toISOString()
    }));

    bulkUpsertBankQuestions(preparedList);
    alert(`🎉 Đã nạp thành công ${preparedList.length} câu hỏi vào bài: "${activeLessonObj?.title}"!`);
    setShowImportModal(false);
    setRefreshKey(k => k + 1);
  };

  // Xuất ngân hàng câu hỏi môn này sang file Word (.doc) tuân thủ quy tắc tiền tố 1-... trong GEMINI.md
  const handleExportBankWord = () => {
    const bankQs = getAllBankQuestions().filter(q => q.subject === selectedSubject && q.grade === selectedGrade);
    if (bankQs.length === 0) {
      alert("Chưa có câu hỏi nào trong kho của môn và khối lớp này!");
      return;
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Ngân hàng câu hỏi - ${selectedSubject} ${selectedGrade}</title>
        <style>
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 1.5cm 2.0cm 2.5cm; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; color: #000; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 15px 0 5px 0; }
          .subtitle { font-size: 12pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
          .q-box { margin-bottom: 16px; }
          .q-head { font-weight: bold; margin-bottom: 4px; }
          .opt-grid { margin-left: 20px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div style="text-align: center; font-size: 11pt;">
            <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</strong><br/>
            <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
            <strong>TỔ CHUYÊN MÔN: ${selectedSubject.toUpperCase()}</strong>
          </div>
          <div class="title">NGÂN HÀNG CÂU HỎI & ĐỀ THI ĐỊNH KỲ CHUẨN GDPT 2018</div>
          <div class="subtitle">MÔN: ${selectedSubject.toUpperCase()} - ${selectedGrade.toUpperCase()} (TỔNG SỐ: ${bankQs.length} CÂU)</div>

          ${bankQs.map((q, idx) => `
            <div class="q-box">
              <div class="q-head">
                Câu ${idx + 1} [${q.part === 'part1' ? 'Phần I - 4 Lựa chọn' : q.part === 'part2' ? 'Phần II - Đúng/Sai' : q.part === 'part3' ? 'Phần III - Trả lời ngắn' : `Phần Tự Luận (${q.maxScore || 2.0}đ)`}] [Mức độ: ${q.level}] [${q.status === 'approved' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}]:
              </div>
              <div style="margin-left: 10px;">${q.content}</div>
              ${q.part === 'part1' && q.options ? `
                <div class="opt-grid">
                  ${q.options.map((opt, oIdx) => `<div><strong>${['A', 'B', 'C', 'D'][oIdx]}.</strong> ${opt} ${oIdx === q.correctAnswerIndex ? '<b>(ĐÁP ÁN ĐÚNG)</b>' : ''}</div>`).join('')}
                </div>
              ` : ''}
              ${q.part === 'part2' && q.subItems ? `
                <div class="opt-grid">
                  ${q.subItems.map(s => `<div><strong>${s.key})</strong> ${s.text} <b>[${s.isTrue ? 'ĐÚNG' : 'SAI'}]</b></div>`).join('')}
                </div>
              ` : ''}
              ${q.part === 'part3' ? `<div style="margin-left: 20px; color: blue; font-weight: bold;">Đáp số: ${q.shortAnswer}</div>` : ''}
              ${q.part === 'essay' && q.rubric ? `
                <div style="margin-left: 20px; margin-top: 4px;">
                  <strong>Bareme thang điểm (${q.maxScore || 2.0}đ):</strong>
                  ${q.rubric.map(r => `<div>- ${r.criteria}: <b>${r.score}đ</b></div>`).join('')}
                </div>
              ` : ''}
              ${q.explanation ? `<div style="margin-left: 10px; font-style: italic; color: #444; margin-top: 4px;">Lời giải: ${q.explanation}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1-Ngan_hang_cau_hoi_${selectedSubject.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedGrade.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Xuất Báo Cáo Ma Trận Độ Phủ Kho Câu Hỏi sang file Word (.doc) theo tiền tố 1-... trong GEMINI.md
  const handleExportCoverageReportWord = () => {
    if (!currentTaxonomy?.chapters || currentTaxonomy.chapters.length === 0) {
      alert("Chưa có chương trình môn học này để xuất báo cáo.");
      return;
    }

    const rows = [];
    let grandTotal = 0;
    let grandNb = 0;
    let grandTh = 0;
    let grandVd = 0;
    let grandVdc = 0;
    let grandEssay = 0;

    currentTaxonomy.chapters.forEach((ch, chIdx) => {
      (ch.lessons || []).forEach((less, lessIdx) => {
        const stats = getQuestionStatsForNode(less.id);
        grandTotal += stats.total;
        grandNb += stats.nb;
        grandTh += stats.th;
        grandVd += stats.vd;
        grandVdc += stats.vdc;
        grandEssay += (stats.essay || 0);

        let assessment = '🔴 Còn mỏng';
        if (stats.total >= 12) assessment = '🟢 Đạt chuẩn phong phú';
        else if (stats.total >= 6) assessment = '🟡 Cơ bản';

        rows.push({
          order: `${chIdx + 1}.${lessIdx + 1}`,
          chapterTitle: ch.title,
          lessonTitle: less.title,
          ...stats,
          assessment
        });
      });
    });

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Báo cáo ma trận độ phủ - ${selectedSubject} ${selectedGrade}</title>
        <style>
          @page Section1 { size: 29.7cm 21.0cm; margin: 1.5cm 1.5cm 1.5cm 2.0cm; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.3; color: #000; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 15px 0 5px 0; }
          .subtitle { font-size: 11.5pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px 8px; font-size: 10.5pt; }
          th { background-color: #f1f5f9; text-align: center; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table style="border: none; width: 100%; margin-bottom: 15px;">
            <tr style="border: none;">
              <td style="border: none; width: 45%; text-align: center; vertical-align: top;">
                <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</strong><br/>
                <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
                <strong>TỔ CHUYÊN MÔN: ${selectedSubject.toUpperCase()}</strong>
              </td>
              <td style="border: none; width: 55%; text-align: center; vertical-align: top;">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
                <i>Cư M'gar, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</i>
              </td>
            </tr>
          </table>

          <div class="title">BÁO CÁO PHÂN TÍCH MA TRẬN ĐỘ PHỦ KHO CÂU HỎI THEO BÀI HỌC</div>
          <div class="subtitle">MÔN: ${selectedSubject.toUpperCase()} - ${selectedGrade.toUpperCase()} (CHƯƠNG TRÌNH GDPT 2018)</div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">STT</th>
                <th>Chương / Chủ Đề & Tên Bài Học</th>
                <th style="width: 70px;">Nhận biết (NB)</th>
                <th style="width: 70px;">Thông hiểu (TH)</th>
                <th style="width: 70px;">Vận dụng (VD)</th>
                <th style="width: 70px;">Vận dụng cao (VDC)</th>
                <th style="width: 70px;">Tự luận (TL)</th>
                <th style="width: 70px;">Tổng số câu</th>
                <th style="width: 130px;">Đánh giá độ phủ</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td class="text-center">${r.order}</td>
                  <td><strong>${r.chapterTitle}</strong><br/>↳ ${r.lessonTitle}</td>
                  <td class="text-center">${r.nb}</td>
                  <td class="text-center">${r.th}</td>
                  <td class="text-center">${r.vd}</td>
                  <td class="text-center">${r.vdc}</td>
                  <td class="text-center font-bold" style="color: #7c3aed;">${r.essay || 0}</td>
                  <td class="text-center font-bold">${r.total}</td>
                  <td class="text-center">${r.assessment}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td colspan="2" class="text-center">TỔNG CỘNG TOÀN BỘ CHƯƠNG TRÌNH</td>
                <td class="text-center">${grandNb}</td>
                <td class="text-center">${grandTh}</td>
                <td class="text-center">${grandVd}</td>
                <td class="text-center">${grandVdc}</td>
                <td class="text-center">${grandEssay}</td>
                <td class="text-center">${grandTotal}</td>
                <td class="text-center">${grandTotal >= (rows.length * 8) ? '🟢 Đạt độ phủ toàn diện' : '🟡 Cần bổ sung'}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 25px; display: flex; justify-content: space-between;">
            <table style="border: none; width: 100%;">
              <tr style="border: none;">
                <td style="border: none; width: 50%; text-align: center;">
                  <strong>NGƯỜI LẬP BÁO CÁO</strong><br/>
                  <i>(Ký và ghi rõ họ tên)</i><br/><br/><br/><br/>
                  <strong>${teacher?.full_name || 'Giáo viên bộ môn'}</strong>
                </td>
                <td style="border: none; width: 50%; text-align: center;">
                  <strong>TỔ TRƯỞNG CHUYÊN MÔN</strong><br/>
                  <i>(Ký và ghi rõ họ tên)</i><br/><br/><br/><br/>
                  <strong>Tổ Chuyên Môn ${selectedSubject}</strong>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1-Bao_cao_do_phu_ngan_hang_cau_hoi_${selectedSubject.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedGrade.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            status: 'approved',
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

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
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

          <button
            type="button"
            onClick={() => setShowCoverageModal(true)}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #c7d2fe',
              background: '#eef2ff',
              color: '#4338ca',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(67, 56, 202, 0.08)'
            }}
            title="Xem bảng ma trận độ phủ câu hỏi toàn bộ chương trình môn học"
          >
            <BarChart3 size={16} /> Ma Trận Độ Phủ Kho
          </button>
          
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TỔNG CÂU HỎI TRONG KHO</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0284c7' }}>
              {getAllBankQuestions().filter(q => q.subject === selectedSubject && q.grade === selectedGrade).length} câu
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportBankWord}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Xuất toàn bộ ngân hàng câu hỏi môn này sang file Word (.doc)"
          >
            <Download size={15} /> Xuất Word (.doc)
          </button>

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
              currentTaxonomy.chapters.map((ch) => {
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
              {pendingInActiveLesson > 0 && (
                <button
                  type="button"
                  onClick={handleBulkApproveActiveLesson}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #86efac',
                    background: '#f0fdf4',
                    color: '#166534',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Phê duyệt toàn bộ các câu hỏi đang chờ thẩm định trong bài này"
                >
                  <ShieldCheck size={16} /> Duyệt Toàn Bộ ({pendingInActiveLesson} câu)
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenImportModal}
                disabled={!selectedLessonId}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: selectedLessonId ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                }}
                title="Nhập hàng loạt câu hỏi từ file Word (.docx) hoặc dán văn bản vào bài này"
              >
                <FileUp size={15} /> 📥 Nhập Word / Văn Bản
              </button>

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
                <Sparkles size={14} /> AI Soạn Thêm
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '20px' }}>
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '10.5px', color: '#0369a1', fontWeight: 'bold' }}>NHẬN BIẾT</div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#0284c7', marginTop: '2px' }}>
                  {activeLessonStats.nb} <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '10.5px', color: '#065f46', fontWeight: 'bold' }}>THÔNG HIỂU</div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
                  {activeLessonStats.th} <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '10.5px', color: '#92400e', fontWeight: 'bold' }}>VẬN DỤNG</div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#d97706', marginTop: '2px' }}>
                  {activeLessonStats.vd} <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '10.5px', color: '#6b21a8', fontWeight: 'bold' }}>VẬN DỤNG CAO</div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#9333ea', marginTop: '2px' }}>
                  {activeLessonStats.vdc} <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                <div style={{ fontSize: '10.5px', color: '#5b21b6', fontWeight: 'bold' }}>TỰ LUẬN</div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#7c3aed', marginTop: '2px' }}>
                  {activeLessonStats.essay || 0} <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 'bold' }}>TỔNG SỐ CÂU</div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                  {activeLessonStats.total} <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal' }}>câu</span>
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
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold', color: filterPart === 'essay' ? '#7c3aed' : 'inherit' }}
            >
              <option value="all">Mọi định dạng phần thi</option>
              <option value="part1">Phần I: 4 lựa chọn</option>
              <option value="part2">Phần II: Đúng / Sai</option>
              <option value="part3">Phần III: Trả lời ngắn</option>
              <option value="essay">Phần Tự Luận (Câu hỏi / Bài tập tự luận)</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold', color: filterStatus === 'pending' ? '#d97706' : filterStatus === 'approved' ? '#16a34a' : 'inherit' }}
            >
              <option value="all">Mọi trạng thái thẩm định</option>
              <option value="approved">✅ Đã thẩm định / Đã duyệt</option>
              <option value="pending">⏳ Chờ thẩm định của Tổ</option>
            </select>
          </div>

          {/* Questions List Render */}
          <div>
            {questionsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                <HelpCircle size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Chưa có câu hỏi nào thỏa mãn bộ lọc.</div>
                <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                  Thầy/Cô có thể bấm <strong>"📥 Nhập Word / Văn Bản"</strong>, <strong>"AI Soạn Thêm"</strong> hoặc <strong>"Thêm Câu Hỏi Mới"</strong>.
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                        Câu {idx + 1}
                      </span>
                      <span style={{
                        fontSize: '11.5px',
                        background: q.part === 'essay' ? '#f5f3ff' : '#e0f2fe',
                        color: q.part === 'essay' ? '#6b21a8' : '#0369a1',
                        border: q.part === 'essay' ? '1px solid #ddd6fe' : 'none',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 'bold'
                      }}>
                        {q.part === 'part1' ? 'Phần I (4 lựa chọn)' : 
                         q.part === 'part2' ? 'Phần II (Đúng/Sai)' : 
                         q.part === 'part3' ? 'Phần III (Trả lời ngắn)' : 
                         `Phần Tự Luận (${q.maxScore || 2.0} điểm)`}
                      </span>
                      <span style={{ fontSize: '11.5px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {q.level}
                      </span>
                      
                      {/* Trạng thái duyệt */}
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        background: (q.status || 'approved') === 'approved' ? '#dcfce7' : '#fef3c7',
                        color: (q.status || 'approved') === 'approved' ? '#166534' : '#b45309',
                        border: (q.status || 'approved') === 'approved' ? '1px solid #86efac' : '1px solid #fde68a'
                      }}>
                        {(q.status || 'approved') === 'approved' ? '✅ Đã duyệt' : '⏳ Chờ thẩm định'}
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
                        onClick={() => handleToggleQuestionStatus(q.id, q.status || 'approved')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: (q.status || 'approved') === 'approved' ? '1px solid #fed7aa' : '1px solid #86efac',
                          background: (q.status || 'approved') === 'approved' ? '#fff7ed' : '#f0fdf4',
                          color: (q.status || 'approved') === 'approved' ? '#c2410c' : '#166534',
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title={(q.status || 'approved') === 'approved' ? 'Chuyển về trạng thái chờ thẩm định' : 'Phê duyệt câu hỏi này vào ngân hàng chính thức'}
                      >
                        {(q.status || 'approved') === 'approved' ? <RefreshCw size={12} /> : <Check size={12} />}
                        {(q.status || 'approved') === 'approved' ? 'Chờ duyệt' : 'Duyệt'}
                      </button>

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

                  {/* Essay Rubric */}
                  {q.part === 'essay' && q.rubric && Array.isArray(q.rubric) && (
                    <div style={{ background: '#faf5ff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e9d5ff', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#6b21a8', marginBottom: '6px' }}>
                        📋 Bareme Tiêu Chí Chấm Điểm Chi Tiết (Tổng: {q.maxScore || 2.0}đ):
                      </div>
                      {q.rubric.map((r, rIdx) => (
                        <div key={rIdx} style={{ fontSize: '12.5px', display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed #f3e8ff' }}>
                          <span>• {r.criteria}</span>
                          <strong style={{ color: '#7c3aed' }}>{r.score}đ</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <div style={{ fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                      💡 {q.part === 'essay' ? 'Hướng dẫn chấm & Đáp án tự luận:' : 'Lời giải chi tiết:'} <MathView text={q.explanation} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* MODAL: NHẬP HÀNG LOẠT TỪ WORD (.DOCX) HOẶC DÁN VĂN BẢN VÀO BÀI HỌC */}
      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '980px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileUp color="#0284c7" size={22} /> Nhập Hàng Loạt Câu Hỏi Từ Word (.docx) / Văn Bản Vào Bài Học
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                  Nạp vào bài: <strong style={{ color: '#0284c7' }}>{activeLessonObj?.title}</strong> ({selectedSubject} - {selectedGrade})
                </div>
              </div>
              <button type="button" onClick={() => setShowImportModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {/* Guide Box */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', fontSize: '12.5px', lineHeight: 1.5, color: '#0369a1' }}>
              <strong>💡 Hướng Dẫn Định Dạng Chuẩn Thương Mại (Tương thích Word, Azota, McMIX):</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginTop: '6px' }}>
                <div>• <strong>Phần I (4 lựa chọn):</strong> <code>Câu 1 [NB]: ... A. ... *B. ... C. ... D. ...</code> (Dấu * hoặc [Đúng] ở đáp án đúng).</div>
                <div>• <strong>Phần II (Đúng/Sai):</strong> <code>Câu 2 [TH]: ... a) ... [Đúng] b) ... [Sai] c) ... d) ...</code></div>
                <div>• <strong>Phần III (Trả lời ngắn):</strong> <code>Câu 3 [VD]: ... Đáp số: 12.5</code></div>
                <div>• <strong>Phần Tự Luận:</strong> <code>Câu 4 [VDC] (2.0 điểm): ... - Ý 1: 1.0đ - Ý 2: 1.0đ Lời giải: ...</code></div>
              </div>
            </div>

            {/* Input Options Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setImportMode('file')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: importMode === 'file' ? '#0284c7' : '#ffffff',
                    color: importMode === 'file' ? '#ffffff' : '#475569',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  📁 Chọn File Word (.docx / .txt)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('paste')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: importMode === 'paste' ? '#0284c7' : '#ffffff',
                    color: importMode === 'paste' ? '#ffffff' : '#475569',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Dán Văn Bản Đề Thi
                </button>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '6px' }}>Mức độ mặc định:</span>
                <select
                  value={importDefaultLevel}
                  onChange={e => setImportDefaultLevel(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
                >
                  <option value="Nhận biết">Nhận biết</option>
                  <option value="Thông hiểu">Thông hiểu</option>
                  <option value="Vận dụng">Vận dụng</option>
                  <option value="Vận dụng cao">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '6px' }}>Trạng thái nạp:</span>
                <select
                  value={importTargetStatus}
                  onChange={e => setImportTargetStatus(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', color: importTargetStatus === 'approved' ? '#16a34a' : '#d97706' }}
                >
                  <option value="approved">✅ Phê duyệt chính thức ngay</option>
                  <option value="pending">⏳ Lưu vào danh sách chờ thẩm định</option>
                </select>
              </div>
            </div>

            {/* Input Controls */}
            {importMode === 'file' ? (
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  border: '2px dashed #0284c7',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}>
                  <FileUp size={36} color="#0284c7" style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    {importFile ? `Đã chọn: ${importFile.name}` : 'Nhấn để chọn file Word (.docx) hoặc kéo thả vào đây'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Hệ thống sẽ tự động quét toàn bộ câu hỏi [NB], [TH], [VD], [VDC], công thức và đáp án
                  </span>
                  <input
                    type="file"
                    accept=".docx,.txt,.doc"
                    onChange={handleFileImportChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            ) : (
              <div style={{ marginBottom: '18px' }}>
                <textarea
                  rows={6}
                  value={importRawText}
                  onChange={e => setImportRawText(e.target.value)}
                  placeholder="Dán nội dung đề thi hoặc ngân hàng câu hỏi vào đây... Ví dụ:&#10;Câu 1 [NB]: Cho hàm số y = f(x)...&#10;*A. Đồng biến.&#10;B. Nghịch biến.&#10;C. Không đổi.&#10;D. Cực trị.&#10;Lời giải: Ta có đạo hàm..."
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={handleRunManualParse}
                  disabled={importIsParsing}
                  style={{
                    marginTop: '8px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: importIsParsing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {importIsParsing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Bóc Tách & Nhận Diện Tự Động
                </button>
              </div>
            )}

            {/* PREVIEW BÓC TÁCH */}
            {parsedPreviewQuestions.length > 0 && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      📋 Kết Quả Phân Tích: Nhận diện thành công {parsedPreviewQuestions.length} câu hỏi
                    </span>
                    <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      Đã chọn {selectedImportIndices.size} / {parsedPreviewQuestions.length} câu
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSelectAllImport}
                    style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {selectedImportIndices.size === parsedPreviewQuestions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
                  {parsedPreviewQuestions.map((pq, pIdx) => {
                    const isSelected = selectedImportIndices.has(pIdx);
                    return (
                      <div
                        key={pIdx}
                        onClick={() => handleToggleSelectImportQ(pIdx)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          marginBottom: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.1s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>Câu {pIdx + 1}</strong>
                            <span style={{ fontSize: '11px', background: pq.part === 'essay' ? '#f5f3ff' : '#e0f2fe', color: pq.part === 'essay' ? '#6b21a8' : '#0369a1', padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold' }}>
                              {pq.part === 'part1' ? 'Phần I' : pq.part === 'part2' ? 'Phần II' : pq.part === 'part3' ? 'Phần III' : `Tự Luận (${pq.maxScore || 2.0}đ)`}
                            </span>
                            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold' }}>
                              {pq.level}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                          <MathView text={pq.content} />
                        </div>

                        {pq.part === 'part1' && pq.options && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', fontSize: '12px' }}>
                            {pq.options.map((opt, oIdx) => (
                              <div key={oIdx} style={{ color: oIdx === pq.correctAnswerIndex ? '#166534' : '#64748b', fontWeight: oIdx === pq.correctAnswerIndex ? 'bold' : 'normal' }}>
                                {['A', 'B', 'C', 'D'][oIdx]}. <MathView inline text={opt} /> {oIdx === pq.correctAnswerIndex && '✓'}
                              </div>
                            ))}
                          </div>
                        )}

                        {pq.part === 'part2' && pq.subItems && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {pq.subItems.map(s => (
                              <div key={s.key}>{s.key}) <MathView inline text={s.text} /> <strong>[{s.isTrue ? 'Đ' : 'S'}]</strong></div>
                            ))}
                          </div>
                        )}

                        {pq.part === 'part3' && (
                          <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold' }}>
                            👉 Đáp số: <MathView inline text={pq.shortAnswer} />
                          </div>
                        )}

                        {pq.part === 'essay' && pq.rubric && (
                          <div style={{ fontSize: '11.5px', color: '#6b21a8' }}>
                            Bareme: {pq.rubric.map(r => `${r.criteria} (${r.score}đ)`).join(' • ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                Hủy
              </button>
              
              <button
                type="button"
                onClick={handleSaveImportedQuestions}
                disabled={selectedImportIndices.size === 0}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedImportIndices.size > 0 ? '#16a34a' : '#cbd5e1',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: selectedImportIndices.size > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} /> Nạp {selectedImportIndices.size} Câu Hỏi Vào Bài Học
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: MA TRẬN ĐỘ PHỦ KHO CÂU HỎI TOÀN BỘ CHƯƠNG TRÌNH */}
      {showCoverageModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '1080px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 color="#4338ca" size={22} /> Ma Trận Độ Phủ Kho Câu Hỏi Của Tổ Chuyên Môn
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                  Môn: <strong>{selectedSubject}</strong> • Khối: <strong>{selectedGrade}</strong> (Chuẩn GDPT 2018)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleExportCoverageReportWord}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0284c7',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Xuất Báo cáo Ma trận độ phủ ra file Word (.doc)"
                >
                  <Download size={14} /> Xuất Báo Cáo (.doc)
                </button>
                
                <button type="button" onClick={() => setShowCoverageModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
              </div>
            </div>

            {/* Coverage Table */}
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: '800' }}>Chương & Tên Bài Học</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#0369a1', fontWeight: '800' }}>NB</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#065f46', fontWeight: '800' }}>TH</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#92400e', fontWeight: '800' }}>VD</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#6b21a8', fontWeight: '800' }}>VDC</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#5b21b6', fontWeight: '800' }}>Tự Luận</th>
                    <th style={{ padding: '10px 10px', textAlign: 'center', color: '#0f172a', fontWeight: '800' }}>Tổng Câu</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontWeight: '800' }}>Đánh Giá Độ Phủ</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontWeight: '800' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentTaxonomy?.chapters || []).map((ch) => (
                    <React.Fragment key={ch.id}>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                        <td colSpan={9} style={{ padding: '8px 12px', fontWeight: '800', color: '#0f172a' }}>
                          📂 {ch.title}
                        </td>
                      </tr>
                      {(ch.lessons || []).map(less => {
                        const stats = getQuestionStatsForNode(less.id);
                        let badgeBg = '#fef2f2';
                        let badgeBorder = '#fecaca';
                        let badgeColor = '#991b1b';
                        let badgeText = '🔴 Còn mỏng (<6 câu)';

                        if (stats.total >= 12) {
                          badgeBg = '#f0fdf4';
                          badgeBorder = '#86efac';
                          badgeColor = '#166534';
                          badgeText = '🟢 Đạt chuẩn phong phú (≥12 câu)';
                        } else if (stats.total >= 6) {
                          badgeBg = '#fffbeb';
                          badgeBorder = '#fde68a';
                          badgeColor = '#92400e';
                          badgeText = '🟡 Cơ bản (6-11 câu)';
                        }

                        return (
                          <tr key={less.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                            <td style={{ padding: '10px 12px', paddingLeft: '24px', color: '#334155', fontWeight: '500' }}>
                              ↳ {less.title}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#0284c7', fontWeight: 'bold' }}>{stats.nb}</td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>{stats.th}</td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#d97706', fontWeight: 'bold' }}>{stats.vd}</td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#9333ea', fontWeight: 'bold' }}>{stats.vdc}</td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#7c3aed', fontWeight: 'bold' }}>{stats.essay || 0}</td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#0f172a', fontWeight: '800' }}>{stats.total}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, fontWeight: 'bold' }}>
                                {badgeText}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChapterId(ch.id);
                                  setSelectedLessonId(less.id);
                                  setExpandedChapters(prev => ({ ...prev, [ch.id]: true }));
                                  setShowCoverageModal(false);
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#0284c7',
                                  fontSize: '11.5px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                Xem & Nạp câu
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCoverageModal(false)}
                style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

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
                <select value={qPart} onChange={e => setQPart(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: qPart === 'essay' ? '#7c3aed' : 'inherit' }}>
                  <option value="part1">Phần I: Trắc nghiệm 4 lựa chọn (A, B, C, D)</option>
                  <option value="part2">Phần II: Đúng / Sai (4 ý a, b, c, d)</option>
                  <option value="part3">Phần III: Trả lời ngắn (Short answer)</option>
                  <option value="essay">Phần Tự Luận (Câu hỏi tự luận / Bài tập tự luận)</option>
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

            {qPart === 'essay' && (
              <div style={{ marginBottom: '16px', background: '#faf5ff', padding: '14px', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#6b21a8' }}>
                    Thang Điểm Tối Đa Của Câu Tự Luận (*):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="10"
                      value={qMaxScore}
                      onChange={e => setQMaxScore(e.target.value)}
                      style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #c084fc', textAlign: 'center', fontWeight: 'bold', color: '#7c3aed', fontSize: '14px' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b21a8' }}>điểm</span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#7c3aed', fontStyle: 'italic' }}>
                  💡 Gợi ý: Thầy/Cô nhập yêu cầu cần đạt của bài tập tự luận ở trên, sau đó trình bày Bareme thang điểm chi tiết (ví dụ: Ý a: 0.5đ, Ý b: 1.0đ...) vào ô "Hướng Dẫn Chấm" bên dưới.
                </div>
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
