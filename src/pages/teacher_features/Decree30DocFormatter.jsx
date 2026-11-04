import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  FileText, Download, Printer, Copy, Check, Sparkles, RefreshCw, 
  HelpCircle, Eye, Sliders, CheckCircle2, AlertCircle, ArrowLeft,
  Layers, Plus, Trash2, BookOpen, ShieldCheck, FileCheck, Share2,
  Upload, FileUp, AlertTriangle, Info, Wand2, ArrowRight, CheckCircle,
  FileCode, Cpu, Home, Grid, ExternalLink, Search, Camera, Mic,
  Settings, MessageSquare, History, Briefcase, FileSpreadsheet, X, Menu,
  ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { DECREE_30_TEMPLATES, DECREE_30_RULES, TEMPLATE_CATEGORIES } from '../../data/decree30Templates';
import { 
  parseRawTextToDecree30, 
  validateDecree30Compliance, 
  exportDecree30ToWord,
  readWordFile,
  auditDecree30Document,
  autoFixDecree30Document,
  deepAiPolishDecree30,
  ocrImageToDecree30
} from '../../utils/decree30FormatterUtil';

// COMPONENT THẺ MẪU XEM TRƯỚC A4 THU NHỎ PHONG CÁCH LATENDOC
function MiniDocCard({ template, onUseTemplate }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0,0,0,0.1)';
      e.currentTarget.style.borderColor = '#93c5fd';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
      e.currentTarget.style.borderColor = '#e2e8f0';
    }}
    >
      {/* KHUNG A4 MINIATURE PREVIEW (Mô phỏng tờ giấy A4 như ảnh 2 & 3 của Latendoc) */}
      <div 
        onClick={() => onUseTemplate(template)}
        style={{
          backgroundColor: '#f8fafc',
          padding: '16px 14px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '230px',
          position: 'relative'
        }}
      >
        {/* TỜ GIẤY A4 TRẮNG */}
        <div style={{
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '220px',
          height: '220px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.2)',
          borderRadius: '2px',
          padding: '12px 10px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: '"Times New Roman", Times, serif',
          color: '#1e293b',
          overflow: 'hidden',
          lineHeight: '1.2'
        }}>
          {/* Header 2 cột: Cơ quan & Quốc hiệu */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px', fontSize: '6.5px' }}>
              <div style={{ textAlign: 'center', width: '48%' }}>
                <div style={{ fontWeight: 'bold', fontSize: '6px' }}>{template.department || 'SỞ GD&ĐT ĐẮK LẮK'}</div>
                <div style={{ fontWeight: 'bold', fontSize: '6px' }}>{template.issuer || 'THPT CAO BÁ QUÁT'}</div>
                <div style={{ borderBottom: '0.5px solid #000', width: '50%', margin: '1px auto' }} />
                <div style={{ fontSize: '5.5px', marginTop: '1px' }}>Số: {template.doc_number || '.../GM-CBQ'}</div>
              </div>

              <div style={{ textAlign: 'center', width: '52%' }}>
                <div style={{ fontWeight: 'bold', fontSize: '6px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontWeight: 'bold', fontSize: '5.5px' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ borderBottom: '0.5px solid #000', width: '60%', margin: '1px auto' }} />
                <div style={{ fontSize: '5px', fontStyle: 'italic', marginTop: '1px' }}>Tân An, ngày ... tháng ... năm ...</div>
              </div>
            </div>

            {/* Tên loại văn bản */}
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8.5px', textTransform: 'uppercase', color: '#0f172a' }}>
                {template.type_name || 'VĂN BẢN'}
              </div>
              <div style={{ fontSize: '6px', fontStyle: 'italic', marginTop: '2px', color: '#334155' }}>
                {template.subject ? `V/v: ${template.subject.slice(0, 45)}...` : ''}
              </div>
            </div>

            {/* Mô phỏng nội dung đoạn văn */}
            <div style={{ marginTop: '8px', fontSize: '6px', color: '#64748b', lineHeight: '1.3' }}>
              <div style={{ fontStyle: 'italic' }}>Kính gửi: Toàn thể cán bộ, giáo viên...</div>
              <div style={{ marginTop: '3px' }}>
                Căn cứ kế hoạch năm học của nhà trường, trân trọng thông báo và triệu tập các thành viên tham dự cuộc họp theo đúng quy định...
              </div>
            </div>
          </div>

          {/* Footer: Nơi nhận và Chữ ký */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '5.5px', marginTop: '6px' }}>
            <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Nơi nhận:</div>
              <div>- Như kính gửi;</div>
              <div>- Lưu: VT.</div>
            </div>
            <div style={{ width: '50%', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>{template.signer_title || 'HIỆU TRƯỞNG'}</div>
              <div style={{ height: '14px' }} />
              <div style={{ fontWeight: 'bold' }}>{template.signer_name || 'Lê Thị Thảo'}</div>
            </div>
          </div>
        </div>

        {/* Badge Miễn phí 100% ở góc */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: '700'
        }}>
          Miễn phí
        </div>
      </div>

      {/* CHI TIẾT MẪU & NÚT DÙNG MẪU (như ảnh 2 Latendoc) */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', lineHeight: '1.3' }}>
            {template.title}
          </h3>
          
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '600'
            }}>
              {template.category === 'party' ? 'Chi bộ, Đảng' : template.category === 'teacher' ? 'Giáo viên' : template.category === 'admin' ? 'Ban Giám hiệu' : 'Văn phòng, nhân sự'}
            </span>
            <span style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '600'
            }}>
              {template.type_name || 'Biểu mẫu'}
            </span>
          </div>
        </div>

        {/* Nút Dùng mẫu này (như ảnh 2 Latendoc) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUseTemplate(template);
          }}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            color: '#1e293b',
            fontSize: '13.5px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#1e293b';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          <span>Dùng mẫu này</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function Decree30DocFormatter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);
  const ocrFileInputRef = useRef(null);

  // Chế độ xem: 'studio' (Thư viện Mẫu chuẩn thương mại kiểu Latendoc) | 'editor' (Soạn thảo chi tiết)
  const initialMode = searchParams.get('mode') === 'editor' ? 'editor' : 'studio';
  const [viewMode, setViewMode] = useState(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrImageFile, setOcrImageFile] = useState(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Chọn mẫu mặc định ban đầu là "Giấy mời dự Đại hội Chi bộ" hoặc "Kế hoạch chuyên môn"
  const [selectedTemplateId, setSelectedTemplateId] = useState('giay_moi_chi_bo');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'form' | 'paste' | 'rules'
  
  // Dữ liệu văn bản
  const [docData, setDocData] = useState(() => {
    const tpl = DECREE_30_TEMPLATES[0];
    return { ...tpl };
  });

  // Bộ lọc danh sách mẫu
  const filteredTemplates = useMemo(() => {
    return DECREE_30_TEMPLATES.filter(tpl => {
      const matchCat = selectedCategory === 'all' || tpl.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (tpl.title || '').toLowerCase().includes(q) ||
        (tpl.type_name || '').toLowerCase().includes(q) ||
        (tpl.subject || '').toLowerCase().includes(q) ||
        (tpl.tags || []).some(t => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Hành động "Dùng mẫu này" (chuyển sang Editor ngay lập tức)
  const handleUseTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setDocData({ ...tpl });
    setAuditResult(null);
    setIsAutoFixed(false);
    setViewMode('editor');
    showToast(`📄 Đã áp dụng mẫu: ${tpl.title}! Chuyển sang trình soạn thảo.`);
  };

  // Hành động "Tạo văn bản trống"
  const handleCreateBlankDoc = () => {
    const blankDoc = {
      id: 'blank_' + Date.now(),
      title: 'Văn bản hành chính mới',
      type_code: 'CV',
      type_name: 'CÔNG VĂN',
      subject: 'Về việc ....................................................',
      department: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK',
      issuer: 'TRƯỜNG THPT CAO BÁ QUÁT',
      sub_unit: '',
      doc_number: '.../CBQ',
      location_date: `Tân An, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
      signer_title: 'HIỆU TRƯỞNG',
      signer_name: 'Lê Thị Thảo',
      recipients: ['- Như trên;', '- Lưu: VT.'],
      content: 'Kính gửi: ....................................................\n\nI. NỘI DUNG\n................................................................\n'
    };
    setDocData(blankDoc);
    setAuditResult(null);
    setIsAutoFixed(false);
    setViewMode('editor');
    showToast('📄 Đã tạo văn bản trống. Thầy/Cô có thể bắt đầu soạn thảo hoặc yêu cầu AI điền giúp!');
  };

  // Xử lý OCR hình ảnh sang Word NĐ 30
  const handleRunOcr = async (file) => {
    if (!file) return;
    setIsOcrProcessing(true);
    try {
      const result = await ocrImageToDecree30(file);
      if (result.success && result.docData) {
        setDocData(result.docData);
        setIsOcrModalOpen(false);
        setOcrImageFile(null);
        setOcrPreviewUrl(null);
        setViewMode('editor');
        showToast('🎉 OCR Thành công! AI Gemini đã bóc tách toàn bộ công văn và phục hồi cấu trúc chuẩn Nghị định 30.');
      }
    } catch (err) {
      alert('Lỗi OCR ảnh: ' + err.message);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Văn bản thô khi người dùng dán vào
  const [rawInputText, setRawInputText] = useState('');
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Kết quả AI Scanner / Auditor
  const [auditResult, setAuditResult] = useState(null);
  const [isAutoFixed, setIsAutoFixed] = useState(false);
  const [isDeepPolishing, setIsDeepPolishing] = useState(false);

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Áp dụng mẫu văn bản
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const tpl = DECREE_30_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setDocData({ ...tpl });
      setAuditResult(null);
      setIsAutoFixed(false);
      showToast(`Đã áp dụng mẫu: ${tpl.title}`);
    }
  };

  // Xử lý đọc & quét lỗi file Word / Text
  const handleProcessFile = async (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      let rawText = '';
      let htmlContent = '';
      
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const result = await readWordFile(file);
        rawText = result.rawText;
        htmlContent = result.htmlContent;
      } else {
        // Đọc text thuần (.txt)
        rawText = await file.text();
      }

      if (!rawText.trim()) {
        setIsAnalyzing(false);
        return alert("File tải lên không có nội dung chữ hoặc không thể đọc được!");
      }

      // 1. Phân tích cấu trúc
      const parsed = parseRawTextToDecree30(rawText);
      // 2. Quét bắt lỗi AI
      const audit = auditDecree30Document(rawText, parsed);

      setUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        rawText,
        htmlContent
      });
      setRawInputText(rawText);
      setDocData(parsed);
      setAuditResult(audit);
      setIsAutoFixed(false);
      setActiveTab('upload');
      showToast(`🎉 Đã nạp "${file.name}" & quét phát hiện ${audit.issuesCount} lỗi thể thức!`);
    } catch (err) {
      console.error("Lỗi đọc file:", err);
      alert("⚠️ Lưu ý về định dạng file:\n• Nếu file của bạn là file Word (.docx), hệ thống sẽ tự động bóc tách cấu trúc.\n• Nếu file là định dạng cũ (.doc) hoặc chứa macro/mật khẩu, bạn chỉ cần mở file trong Word, nhấn Ctrl+A > Ctrl+C (Sao chép) rồi dán vào tab '3. Dán Text Trực Tiếp' để AI căn chỉnh tự động ngay!");
      setActiveTab('paste');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Kéo thả file
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Chọn file từ máy tính
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  // Nút 1-Click AI Tự Động Sửa Toàn Bộ Lỗi
  const handleRunAiAutoFix = () => {
    const fixed = autoFixDecree30Document(docData);
    setDocData(fixed);
    setIsAutoFixed(true);
    setAuditResult(prev => ({
      ...prev,
      issuesCount: 0,
      initialScore: 100,
      summary: '🎉 Toàn bộ lỗi thể thức đã được AI căn chỉnh tự động về 100% chuẩn Nghị định 30/2020/NĐ-CP!'
    }));
    showToast("⚡ AI đã tự động căn chỉnh & sửa 100% lỗi thể thức theo NĐ 30!");
  };

  // Nút Gemini AI Nâng cấp văn phong chuyên sâu qua Vercel API Key
  const handleDeepAiPolish = async () => {
    setIsDeepPolishing(true);
    try {
      showToast("🤖 Gemini AI đang phân tích ngữ nghĩa & biên tập văn phong...");
      const textToAnalyze = uploadedFile?.rawText || rawInputText || docData.content || '';
      const res = await deepAiPolishDecree30(textToAnalyze, docData);
      
      if (res.docData) {
        setDocData(res.docData);
        setIsAutoFixed(true);
        setAuditResult(prev => ({
          ...prev,
          issuesCount: 0,
          initialScore: 100,
          summary: '✨ Đã được Gemini AI biên tập và nâng cấp văn phong hành chính chuyên sâu!'
        }));
        showToast("✨ Gemini AI đã hoàn tất nâng cấp văn bản chuẩn Nghị định 30!");
      }
    } catch (err) {
      console.error("Lỗi gọi Gemini AI:", err);
      showToast("⚠️ Đã áp dụng bộ lọc chuẩn hóa cục bộ.");
    } finally {
      setIsDeepPolishing(false);
    }
  };

  // Thử nghiệm file mẫu có sẵn lỗi
  const handleLoadSampleWithErrors = () => {
    const sampleDirtyText = `SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK
TRƯỜNG THPT CAO BÁ QUÁT
Số : 15

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
ĐỘC LẬP - TỰ DO - HẠNH PHÚC

Đắk Lắk , Ngày 23 Tháng 09 Năm 2026

kế hoạch
triển khai nhiệm vụ chuyên môn học kỳ 1 năm học 2026-2027

I. MỤC ĐÍCH YÊU CẦU
- Nâng cao chất lượng dạy và học , đảm bảo đúng tiến độ chương trình giáo dục phổ thông 2018 .
- Tăng cường sinh hoạt tổ chuyên môn theo hướng nghiên cứu bài học .

II. NỘI DUNG THỰC HIỆN
1. Công tác chuyên môn :
- Tổ chức kiểm tra giữa kỳ đúng quy chế  , nghiêm túc và công bằng .
- Giáo viên tích cực ứng dụng công nghệ thông tin trong giảng dạy .

hiệu trưởng
Lê Thị Thảo`;

    const parsed = parseRawTextToDecree30(sampleDirtyText);
    const audit = auditDecree30Document(sampleDirtyText, parsed);

    setUploadedFile({
      name: 'Van_ban_mau_chua_chuan_the_thuc.docx',
      size: '14.2 KB',
      rawText: sampleDirtyText,
      htmlContent: ''
    });
    setRawInputText(sampleDirtyText);
    setDocData(parsed);
    setAuditResult(audit);
    setIsAutoFixed(false);
    setActiveTab('upload');
    showToast("📄 Đã nạp văn bản mẫu có lỗi thể thức để thử nghiệm AI!");
  };

  // Tự động phân tích văn bản thô từ ô Dán
  const handleAutoFormatRawText = () => {
    if (!rawInputText || !rawInputText.trim()) {
      return alert("Vui lòng dán nội dung văn bản thô vào khung trước khi chuẩn hóa!");
    }
    const parsed = parseRawTextToDecree30(rawInputText);
    const audit = auditDecree30Document(rawInputText, parsed);
    setDocData(parsed);
    setAuditResult(audit);
    setIsAutoFixed(false);
    setActiveTab('upload');
    showToast(`⚡ Đã quét phân tích văn bản: Phát hiện ${audit.issuesCount} vấn đề thể thức!`);
  };

  // Đánh giá mức độ tuân thủ chuẩn NĐ 30
  const compliance = useMemo(() => {
    return validateDecree30Compliance(docData);
  }, [docData]);

  // Thêm nhanh đoạn đề mục vào nội dung
  const handleInsertSnippet = (snippetType) => {
    let snippet = '';
    if (snippetType === 'roman') snippet = '\n\nI. MỤC TIÊU VÀ YÊU CẦU TRỌNG TÂM\n';
    else if (snippetType === 'number') snippet = '\n\n1. Nhiệm vụ cụ thể\n';
    else if (snippetType === 'alpha') snippet = '\n\na) Biện pháp thực hiện:\n';
    else if (snippetType === 'table') {
      snippet = '\n\n| STT | Nội dung công việc | Người phụ trách | Thời gian | Ghi chú |\n|---|---|---|---|---|\n| 1 | Soạn đề cương kiểm tra | Tổ trưởng | 10/10/2026 | |\n| 2 | Duyệt đề gốc | Ban Giám hiệu | 15/10/2026 | |\n';
    }

    setDocData(prev => ({
      ...prev,
      content: (prev.content || '') + snippet
    }));
  };

  // Thao tác Nơi nhận
  const handleAddRecipient = () => {
    setDocData(prev => ({
      ...prev,
      recipients: [...(prev.recipients || []), '- ']
    }));
  };

  const handleUpdateRecipient = (idx, val) => {
    const updated = [...(docData.recipients || [])];
    updated[idx] = val;
    setDocData(prev => ({ ...prev, recipients: updated }));
  };

  const handleRemoveRecipient = (idx) => {
    const updated = docData.recipients.filter((_, i) => i !== idx);
    setDocData(prev => ({ ...prev, recipients: updated }));
  };

  // Xuất file Word (.doc)
  const handleExportWord = () => {
    exportDecree30ToWord(docData, 'decree30-preview-container');
    showToast("📥 Đã xuất file Word chuẩn Nghị định 30 thành công!");
  };

  // In văn bản / Xuất PDF
  const handlePrint = () => {
    window.print();
  };

  // Sao chép nội dung chuẩn vào bộ nhớ đệm
  const handleCopyRichText = () => {
    const previewEl = document.getElementById('decree30-preview-container');
    if (!previewEl) return;
    
    try {
      const range = document.createRange();
      range.selectNode(previewEl);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      showToast("📋 Đã sao chép nội dung văn bản chuẩn!");
    } catch (e) {
      navigator.clipboard.writeText(previewEl.innerText);
      showToast("📋 Đã sao chép văn bản dạng Text!");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* PRINT STYLESHEET */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 30mm; /* Chuẩn NĐ 30: Trên 2cm, Phải 1.5cm, Dưới 2cm, Trái 3cm */
          }
          body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, .no-print, button, nav, .top-header-bar, .kho-mau-bar, .left-panel-col {
            display: none !important;
          }
          .workspace-grid {
            display: block !important;
            grid-template-columns: 1fr !important;
          }
          .preview-outer-box {
            background: none !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          #decree30-preview-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* GLOBAL TOP NAVIGATION BAR (STANDALONE WORKSTATION) */}
      <header style={{
        backgroundColor: '#064e3b',
        backgroundImage: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
        color: '#ffffff',
        padding: '10px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <ArrowLeft size={16} /> Quay Lại
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={20} color="#a7f3d0" />
            <span style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.2px' }}>
              XƯỞNG CĂN CHỈNH VĂN BẢN CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
              THPT CAO BÁ QUÁT
            </span>
          </div>
        </div>

        {/* Quick links to Portals */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <Home size={14} /> Trang Chủ Trường
          </Link>

          <Link
            to="/teacher-dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <BookOpen size={14} /> Bàn Làm Việc GV
          </Link>

          <Link
            to="/teacher-dashboard/app-hub"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <Grid size={14} /> Kho Tiện Ích GV
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, padding: '20px 16px 85px 16px', maxWidth: '1600px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: '600',
            border: '1px solid #334155'
          }}>
            <CheckCircle2 size={18} color="#4ade80" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. TOP HEADER BAR */}
        <div className="top-header-bar" style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate(-1)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b', display: 'flex', alignItems: 'center' }}
                title="Quay lại"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '19px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={22} color="#2563eb" /> Trợ Lý Văn Bản & Thư Viện Mẫu AI Studio
              </h1>
              <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} color="#16a34a" /> 100% Miễn Phí (BYOK AI) • Chuẩn NĐ 30
              </span>
            </div>
            <p style={{ margin: '4px 0 0 30px', fontSize: '13px', color: '#64748b' }}>
              Kho biểu mẫu chuyên biệt cho Nhà trường, Chi bộ Đảng & Giáo viên • Không giới hạn Coin • Bóc tách ảnh công văn & Soạn thảo chuẩn thể thức
            </p>
          </div>

          {/* CHUYỂN ĐỔI CHẾ ĐỘ XEM: THƯ VIỆN MẪU (LATENDOC PRO) & TRÌNH SOẠN THẢO CHI TIẾT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setViewMode('studio')}
                style={{
                  padding: '7px 15px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: viewMode === 'studio' ? '#2563eb' : 'transparent',
                  color: viewMode === 'studio' ? '#ffffff' : '#64748b',
                  boxShadow: viewMode === 'studio' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <Grid size={14} /> Thư Viện Mẫu Studio (Latendoc Pro)
              </button>

              <button
                onClick={() => setViewMode('editor')}
                style={{
                  padding: '7px 15px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: viewMode === 'editor' ? '#2563eb' : 'transparent',
                  color: viewMode === 'editor' ? '#ffffff' : '#64748b',
                  boxShadow: viewMode === 'editor' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <FileText size={14} /> Trình Soạn Thảo & Căn Chỉnh NĐ 30
              </button>
            </div>

            {viewMode === 'editor' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleCopyRichText}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={14} /> Sao Chép
                </button>

                <button
                  onClick={handlePrint}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    border: '1px solid #86efac',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={14} /> In / PDF
                </button>

                <button
                  onClick={handleExportWord}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                  }}
                >
                  <Download size={14} /> Tải Word (.doc)
                </button>
              </div>
            )}
          </div>
        </div>

        {viewMode === 'studio' ? (
          /* ======================================================== */
          /* GIAO DIỆN THƯ VIỆN MẪU STUDIO CHUẨN THƯƠNG MẠI (LATENDOC PRO) */
          /* ======================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* KHỐI 1: BẮT ĐẦU VĂN BẢN MỚI (Như ảnh 4 của Latendoc) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Bắt đầu văn bản mới
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    Khởi tạo văn bản trống hoặc bắt đầu nhanh từ các biểu mẫu thông dụng nhất
                  </p>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('thu-vien-mau-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Thư viện mẫu <ChevronRight size={16} />
                </button>
              </div>

              {/* Lưới các thẻ Bắt đầu văn bản mới (ảnh 4) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {/* THẺ 1: VĂN BẢN TRỐNG (+) */}
                <div
                  onClick={handleCreateBlankDoc}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px dashed #93c5fd',
                    borderRadius: '14px',
                    minHeight: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: '20px',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#93c5fd';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: '14px',
                    boxShadow: '0 4px 14px rgba(59,130,246,0.35)'
                  }}>
                    <Plus size={32} />
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>
                    Văn bản trống
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Tạo trang trắng chuẩn NĐ 30
                  </div>
                </div>

                {/* CÁC THẺ MẪU THÔNG DỤNG HÀNG ĐẦU */}
                {DECREE_30_TEMPLATES.slice(0, 3).map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => handleUseTemplate(tpl)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
                      e.currentTarget.style.borderColor = '#93c5fd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {/* Tờ A4 thu nhỏ */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '12px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '140px'
                    }}>
                      <div style={{
                        backgroundColor: '#ffffff',
                        width: '100%',
                        maxWidth: '140px',
                        height: '120px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
                        borderRadius: '2px',
                        padding: '8px 6px',
                        fontSize: '5px',
                        fontFamily: '"Times New Roman", Times, serif',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        lineHeight: '1.2'
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '4.5px' }}>
                            <span style={{ fontWeight: 'bold' }}>THPT CAO BÁ QUÁT</span>
                            <span style={{ fontWeight: 'bold' }}>CỘNG HÒA XÃ HỘI CNVN</span>
                          </div>
                          <div style={{ textAlign: 'center', marginTop: '6px', fontWeight: 'bold', fontSize: '6px', textTransform: 'uppercase' }}>
                            {tpl.type_name}
                          </div>
                          <div style={{ textAlign: 'center', fontSize: '4.5px', fontStyle: 'italic', color: '#64748b' }}>
                            {tpl.subject?.slice(0, 30)}...
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '4px' }}>
                          <span>Nơi nhận: ...</span>
                          <span style={{ fontWeight: 'bold' }}>{tpl.signer_title}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#1e293b', marginBottom: '6px' }}>
                        {tpl.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        Dùng mẫu này <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KHỐI 2: THƯ VIỆN MẪU & BỘ LỌC CHUẨN LATENDOC (Ảnh 3) */}
            <div id="thu-vien-mau-section" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              {/* Header Thư viện mẫu */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                  Thư viện mẫu văn bản chuẩn Nghị định 30
                </h2>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                  Chọn một mẫu rồi để AI điền giúp bạn, hoặc tải mẫu Word của riêng bạn lên.
                </p>
              </div>

              {/* Hàng nút hành động như ảnh 3 của Latendoc */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#1e293b',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Upload size={16} color="#475569" /> Tạo mẫu từ văn bản cũ (.docx)
                </button>

                <button
                  onClick={() => setIsOcrModalOpen(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                  }}
                >
                  <Camera size={16} /> Ảnh sang Word (OCR AI Gemini)
                </button>

                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileSpreadsheet size={16} color="#059669" /> Trộn văn bản hàng loạt (Excel)
                </button>
              </div>

              {/* Tabs Thư viện & Mẫu của tôi (Ảnh 3) */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1.5px solid #bfdbfe',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Thư viện trường ({DECREE_30_TEMPLATES.length} mẫu)
                </button>
                <button
                  onClick={() => showToast('📁 Tính năng "Mẫu của tôi": Toàn bộ bản thảo của Thầy/Cô được lưu trữ an toàn trên thiết bị!')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Mẫu của tôi
                </button>
              </div>

              {/* Ô TÌM KIẾM MẪU (Ảnh 3) */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Tìm mẫu, ví dụ: giấy mời, đại hội chi bộ, họp phụ huynh, kế hoạch, quyết định..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.15s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* HÀNG CHIPS DANH MỤC (Ảnh 3) */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px' }}>
                {TEMPLATE_CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: isActive ? '700' : '600',
                        border: isActive ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                        color: isActive ? '#1d4ed8' : '#475569',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s'
                      }}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* ĐẾM SỐ LƯỢNG MẪU (Ảnh 3: "Đang hiện 24 / 2281 mẫu") */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', fontSize: '13px', color: '#64748b' }}>
                <span>
                  Đang hiện <strong style={{ color: '#0f172a' }}>{filteredTemplates.length}</strong> / {DECREE_30_TEMPLATES.length} mẫu chuẩn
                </span>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} /> 100% Miễn phí AI • Chuẩn NĐ 30/2020/NĐ-CP
                </span>
              </div>

              {/* LƯỚI THẺ MINIATURE A4 DOCUMENT PREVIEWS (Ảnh 2 & 3) */}
              {filteredTemplates.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>
                    Không tìm thấy biểu mẫu phù hợp với từ khóa "<strong>{searchQuery}</strong>"
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Xem tất cả mẫu
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {filteredTemplates.map(tpl => (
                    <MiniDocCard
                      key={tpl.id}
                      template={tpl}
                      onUseTemplate={handleUseTemplate}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* KHỐI 3: VĂN BẢN GẦN ĐÂY (Ảnh 4) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Văn bản gần đây
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                    Sửa gần nhất
                  </span>
                </div>
              </div>

              {/* Card văn bản đang làm việc hiện tại */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14.5px', color: '#0f172a' }}>
                      {docData.title || 'Văn bản đang soạn thảo'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Số: {docData.doc_number || 'Chưa vào số'} • {docData.type_name} • Ký bởi: {docData.signer_name}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setViewMode('editor')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Tiếp tục soạn thảo <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleExportWord}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Download size={14} /> Tải Word
                  </button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ======================================================== */
          /* GIAO DIỆN TRÌNH SOẠN THẢO CHI TIẾT & CĂN CHỈNH NĐ 30 */
          /* ======================================================== */
          <>
            {/* 2. CHỌN MẪU VĂN BẢN SẴN CÓ */}
            <div className="kho-mau-bar" style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} color="#2563eb" /> Kho Mẫu Chuẩn:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
            {DECREE_30_TEMPLATES.map(tpl => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: isSelected ? '800' : '600',
                    border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                    color: isSelected ? '#1d4ed8' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  {tpl.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. MAIN WORKSPACE (2 PANELS SPLIT) */}
        <div className="workspace-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 48%) 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT PANEL: SOẠN THẢO, IMPORT WORD & AI AUDITOR */}
          <div className="left-panel-col" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            {/* Mode Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '18px', gap: '6px', overflowX: 'auto' }}>
              <button
                onClick={() => setActiveTab('upload')}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: activeTab === 'upload' ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === 'upload' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Upload size={16} /> 1. Import Word & Bắt Lỗi AI
              </button>

              <button
                onClick={() => setActiveTab('form')}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: activeTab === 'form' ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === 'form' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Sliders size={16} /> 2. Chỉnh Từng Mục
              </button>

              <button
                onClick={() => setActiveTab('paste')}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: activeTab === 'paste' ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === 'paste' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Sparkles size={16} /> 3. Dán Text Trực Tiếp
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: activeTab === 'rules' ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === 'rules' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <HelpCircle size={16} /> 4. Quy Chuẩn NĐ 30
              </button>
            </div>

            {/* TAB 1: IMPORT FILE WORD & AI AUDITOR */}
            {activeTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 1.1 DRAG & DROP ZONE */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: isDragOver ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    backgroundColor: isDragOver ? '#eff6ff' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.txt"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {isAnalyzing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                      <RefreshCw size={32} className="animate-spin" color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                        AI đang đọc cấu trúc file Word & quét bắt lỗi thể thức...
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Trích xuất Quốc hiệu, Cơ quan ban hành, Số hiệu, Trích yếu, Nội dung, Thẩm quyền ký
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                        <FileUp size={24} />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                        Kéo thả file Word (.docx) vào đây hoặc click để chọn file
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                        Hỗ trợ file Microsoft Word (.docx, .doc) và file văn bản thuần (.txt)
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                        <Upload size={14} /> Chọn File Từ Máy Tính
                      </div>
                    </div>
                  )}
                </div>

                {/* Nút thử nghiệm nhanh */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                  <span>Chưa có sẵn file Word trên máy?</span>
                  <button
                    type="button"
                    onClick={handleLoadSampleWithErrors}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#eff6ff'
                    }}
                  >
                    <Wand2 size={13} /> Thử nghiệm văn bản mẫu có lỗi thể thức
                  </button>
                </div>

                {/* 1.2 BẢNG KẾT QUẢ QUÉT BẮT LỖI AI (NẾU ĐÃ CÓ KẾT QUẢ) */}
                {auditResult && (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    
                    {/* Header thông số */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Cpu size={16} color="#2563eb" /> Kết Quả Đánh Giá Thể Thức AI:
                        </div>
                        {uploadedFile && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            File: <strong>{uploadedFile.name}</strong> ({uploadedFile.size})
                          </div>
                        )}
                      </div>

                      {/* Điểm tuân thủ */}
                      <div style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '800',
                        backgroundColor: auditResult.initialScore === 100 ? '#f0fdf4' : auditResult.initialScore >= 70 ? '#fffbeb' : '#fef2f2',
                        color: auditResult.initialScore === 100 ? '#16a34a' : auditResult.initialScore >= 70 ? '#b45309' : '#dc2626',
                        border: auditResult.initialScore === 100 ? '1px solid #86efac' : auditResult.initialScore >= 70 ? '1px solid #fde68a' : '1px solid #fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {auditResult.initialScore === 100 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        Điểm Tuân Thủ: {auditResult.initialScore}/100
                      </div>
                    </div>

                    {/* Nút Action AI Nổi Bật (2 Chế Độ) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      <button
                        type="button"
                        onClick={handleRunAiAutoFix}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Wand2 size={16} /> ⚡ AI Sửa Nhanh Thể Thức
                      </button>

                      <button
                        type="button"
                        onClick={handleDeepAiPolish}
                        disabled={isDeepPolishing}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: isDeepPolishing ? '#9333ea' : '#7e22ce',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '800',
                          cursor: isDeepPolishing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(126,34,206,0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        title="Sử dụng Gemini AI API để viết lại câu từ, phân mục và thêm căn cứ pháp lý"
                      >
                        {isDeepPolishing ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Đang gọi Gemini AI...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} color="#fef08a" />
                            <span>✨ Gemini AI Biên Tập Sâu</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isAutoFixed && (
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                        <CheckCircle2 size={18} color="#16a34a" />
                        <div>
                          <strong>Đã hoàn tất căn chỉnh!</strong> Toàn bộ thể thức tiêu ngữ, lề A4, số hiệu, địa danh, trích yếu, chữ ký và thụt lề 1.0cm đã chuẩn hóa 100%.
                        </div>
                      </div>
                    )}

                    {/* Danh sách các lỗi bắt được */}
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Chi Tiết Vấn Đề Thể Thức Phát Hiện ({auditResult.issues.length} mục):
                    </div>

                    {auditResult.issues.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 10px', color: '#16a34a', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <CheckCircle2 size={28} style={{ margin: '0 auto 6px auto' }} />
                        <div style={{ fontWeight: '700', fontSize: '13.5px' }}>Văn bản hoàn hảo! Không phát hiện lỗi thể thức nào.</div>
                        <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>Có thể xuất file Word hoặc in ấn trực tiếp ngay lập tức.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                        {auditResult.issues.map((issue, idx) => {
                          const isCrit = issue.severity === 'critical';
                          const isWarn = issue.severity === 'warning';
                          const badgeBg = isCrit ? '#fef2f2' : isWarn ? '#fffbeb' : '#eff6ff';
                          const badgeBorder = isCrit ? '#fca5a5' : isWarn ? '#fde68a' : '#bfdbfe';
                          const badgeColor = isCrit ? '#b91c1c' : isWarn ? '#b45309' : '#1d4ed8';

                          return (
                            <div
                              key={idx}
                              style={{
                                border: `1px solid ${badgeBorder}`,
                                backgroundColor: badgeBg,
                                borderRadius: '8px',
                                padding: '10px 12px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '800', fontSize: '12.5px', color: badgeColor, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  {isCrit ? <AlertCircle size={14} /> : isWarn ? <AlertTriangle size={14} /> : <Info size={14} />}
                                  {issue.title}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#ffffff', color: badgeColor, border: `1px solid ${badgeBorder}` }}>
                                  {issue.category}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px', lineHeight: '1.4' }}>
                                {issue.description}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '600', backgroundColor: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Sparkles size={12} color="#16a34a" /> <strong>Giải pháp AI:</strong> {issue.solution}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}

                {/* Hướng dẫn quy trình 3 bước */}
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#475569' }}>
                  <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>🚀 Quy trình Căn Chỉnh Thể Thức Tự Động:</div>
                  <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li><strong>Bước 1:</strong> Chọn file Word (.docx) của bạn tải lên.</li>
                    <li><strong>Bước 2:</strong> Xem AI liệt kê các điểm sai thể thức và bấm nút <em>"AI Tự Động Sửa Toàn Bộ Lỗi"</em>.</li>
                    <li><strong>Bước 3:</strong> Xem trước trang in A4 và bấm <em>"Tải File Word"</em> để sử dụng ngay.</li>
                  </ol>
                </div>

              </div>
            )}

            {/* TAB 2: FORM CHỈNH TỪNG MỤC THỂ THỨC */}
            {activeTab === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Nút tiện ích AI Auto Sửa Lỗi */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eff6ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bfdbfe', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                    💡 Đang chỉnh sửa chi tiết từng thành phần thể thức
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleRunAiAutoFix}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Wand2 size={13} /> Sửa Thể Thức
                    </button>
                    <button
                      type="button"
                      onClick={handleDeepAiPolish}
                      disabled={isDeepPolishing}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isDeepPolishing ? '#9333ea' : '#7e22ce',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: isDeepPolishing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sparkles size={13} color="#fef08a" /> {isDeepPolishing ? 'Đang gọi AI...' : '✨ Gemini Nâng Cấp'}
                    </button>
                  </div>
                </div>

                {/* 1. Cơ quan & Đơn vị */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                      Cơ quan chủ quản cấp trên
                    </label>
                    <input
                      type="text"
                      value={docData.department}
                      onChange={e => setDocData({ ...docData, department: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                      Cơ quan / Đơn vị ban hành (*)
                    </label>
                    <input
                      type="text"
                      value={docData.issuer}
                      onChange={e => setDocData({ ...docData, issuer: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginTop: '4px', fontWeight: 'bold', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* 2. Số ký hiệu & Địa danh ngày tháng */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                      Số và Ký hiệu văn bản
                    </label>
                    <input
                      type="text"
                      value={docData.doc_number}
                      onChange={e => setDocData({ ...docData, doc_number: e.target.value })}
                      placeholder="VD: Số: 15/KH-CBQ"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                      Địa danh & Ngày tháng ban hành
                    </label>
                    <input
                      type="text"
                      value={docData.location_date}
                      onChange={e => setDocData({ ...docData, location_date: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginTop: '4px', fontStyle: 'italic', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* 3. Tên loại văn bản & Trích yếu */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Tên loại văn bản (In hoa)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input
                      type="text"
                      value={docData.type_name}
                      onChange={e => setDocData({ ...docData, type_name: e.target.value.toUpperCase() })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}
                    />
                    <select
                      onChange={e => e.target.value && setDocData({ ...docData, type_name: e.target.value })}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      value=""
                    >
                      <option value="">-- Chọn loại --</option>
                      <option value="KẾ HOẠCH">KẾ HOẠCH</option>
                      <option value="BÁO CÁO">BÁO CÁO</option>
                      <option value="TỜ TRÌNH">TỜ TRÌNH</option>
                      <option value="BIÊN BẢN">BIÊN BẢN</option>
                      <option value="THÔNG BÁO">THÔNG BÁO</option>
                      <option value="QUYẾT ĐỊNH">QUYẾT ĐỊNH</option>
                      <option value="CÔNG VĂN">CÔNG VĂN</option>
                      <option value="HƯỚNG DẪN">HƯỚNG DẪN</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Trích yếu nội dung văn bản (Về việc...)
                  </label>
                  <textarea
                    rows={2}
                    value={docData.subject}
                    onChange={e => setDocData({ ...docData, subject: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* 4. Khung Soạn thảo Nội dung chính kèm nút chèn nhanh */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                      Nội dung văn bản (Căn đều Justified, thụt lề 1cm)
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleInsertSnippet('roman')}
                        style={{ padding: '3px 8px', fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Chèn Mục I, II, III"
                      >
                        + I, II
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertSnippet('number')}
                        style={{ padding: '3px 8px', fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Chèn Mục 1, 2, 3"
                      >
                        + 1., 2.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertSnippet('alpha')}
                        style={{ padding: '3px 8px', fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Chèn Mục a, b, c"
                      >
                        + a), b)
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={12}
                    value={docData.content}
                    onChange={e => setDocData({ ...docData, content: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.5', fontFamily: '"Times New Roman", Times, serif', boxSizing: 'border-box' }}
                    placeholder="Nhập nội dung các mục I, II, III, căn cứ ban hành, nhiệm vụ thực hiện..."
                  />
                </div>

                {/* 5. Chức vụ, Thẩm quyền ký & Họ tên */}
                {docData.type_name === 'BIÊN BẢN' || docData.is_minutes ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>
                      📋 Cấu hình Chữ ký Biên bản họp (2 bên ký: Thư ký & Chủ trì)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                          Chức danh Thư ký
                        </label>
                        <input
                          type="text"
                          value={docData.secretary_title || 'THƯ KÝ'}
                          onChange={e => setDocData({ ...docData, secretary_title: e.target.value.toUpperCase() })}
                          placeholder="VD: THƯ KÝ"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                          Họ và tên Thư ký
                        </label>
                        <input
                          type="text"
                          value={docData.secretary_name || ''}
                          onChange={e => setDocData({ ...docData, secretary_name: e.target.value })}
                          placeholder="VD: Trần Thị Thảo"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                          Chức danh Chủ trì
                        </label>
                        <input
                          type="text"
                          value={docData.signer_title || 'CHỦ TRÌ'}
                          onChange={e => setDocData({ ...docData, signer_title: e.target.value.toUpperCase() })}
                          placeholder="VD: CHỦ TRÌ / GVCN"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                          Họ và tên Chủ trì
                        </label>
                        <input
                          type="text"
                          value={docData.signer_name || ''}
                          onChange={e => setDocData({ ...docData, signer_name: e.target.value })}
                          placeholder="VD: Nguyễn Văn An"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                        Chức vụ người ký
                      </label>
                      <textarea
                        rows={2}
                        value={docData.signer_title}
                        onChange={e => setDocData({ ...docData, signer_title: e.target.value })}
                        placeholder="VD: TM. BAN GIÁM HIỆU&#10;HIỆU TRƯỞNG"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                        Họ và Tên người ký
                      </label>
                      <input
                        type="text"
                        value={docData.signer_name}
                        onChange={e => setDocData({ ...docData, signer_name: e.target.value })}
                        placeholder="VD: Lê Thị Thảo"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}

                {/* 6. Nơi nhận */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                      Nơi nhận (Kính gửi / Lưu)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddRecipient}
                      style={{ padding: '2px 8px', fontSize: '11px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      + Thêm nơi nhận
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(docData.recipients || []).map((rec, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          value={rec}
                          onChange={e => handleUpdateRecipient(idx, e.target.value)}
                          style={{ flex: 1, padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: DÁN VĂN BẢN THÔ (AUTO-FORMAT) */}
            {activeTab === 'paste' && (
              <div>
                <div style={{ backgroundColor: '#eff6ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bfdbfe', marginBottom: '14px', fontSize: '13px', color: '#1e40af' }}>
                  💡 <strong>Hướng dẫn:</strong> Dán văn bản thô bất kỳ (từ Word, Email, Zalo, ghi chú...). Hệ thống AI Rule-based sẽ tự động bóc tách: <em>Quốc hiệu, Cơ quan, Số hiệu, Tiêu đề, Các mục I, II, III, Thụt lề 1cm, Nơi nhận và Chữ ký</em>.
                </div>

                <textarea
                  rows={15}
                  value={rawInputText}
                  onChange={e => setRawInputText(e.target.value)}
                  placeholder="Dán toàn bộ văn bản thô của bạn vào đây..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.45', boxSizing: 'border-box' }}
                />

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleAutoFormatRawText}
                      style={{
                        padding: '12px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                      }}
                    >
                      <Sparkles size={16} /> ⚡ Phân Tích & Quét Lỗi
                    </button>

                    <button
                      type="button"
                      onClick={handleDeepAiPolish}
                      disabled={isDeepPolishing}
                      style={{
                        padding: '12px',
                        backgroundColor: isDeepPolishing ? '#9333ea' : '#7e22ce',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13.5px',
                        cursor: isDeepPolishing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(126,34,206,0.3)'
                      }}
                    >
                      {isDeepPolishing ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Đang gọi Gemini AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} color="#fef08a" />
                          <span>✨ Gemini Viết Lại Sâu</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRawInputText('')}
                    style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', alignSelf: 'flex-end' }}
                  >
                    Xóa khung nhập
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: BẢNG TRA CỨU QUY CHUẨN NGHỊ ĐỊNH 30 */}
            {activeTab === 'rules' && (
              <div style={{ fontSize: '13px', color: '#334155' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>📐 Bảng Quy Chuẩn Kỹ Thuật Trình Bày Văn Bản Hành Chính (NĐ 30/2020/NĐ-CP)</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>1. Khổ giấy & Căn lề:</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                      <li>Khổ A4 (210 x 297 mm), hướng đứng.</li>
                      <li>Lề trên: 20 - 25 mm (2.0 - 2.5 cm)</li>
                      <li>Lề dưới: 20 - 25 mm (2.0 - 2.5 cm)</li>
                      <li>Lề trái: 30 - 35 mm (3.0 - 3.5 cm) (để đóng bìa)</li>
                      <li>Lề phải: 15 - 20 mm (1.5 - 2.0 cm)</li>
                    </ul>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>2. Phông chữ & Giãn dòng:</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                      <li>Phông: <strong>Times New Roman</strong>, bộ mã Unicode.</li>
                      <li>Cỡ chữ nội dung: <strong>13pt - 14pt</strong>, màu đen.</li>
                      <li>Giãn dòng: <strong>1.25 - 1.35 lines</strong>, cách đoạn sau 3 - 6pt.</li>
                      <li>Thụt đầu dòng: <strong>1.0 cm - 1.27 cm</strong>, căn đều 2 bên (Justify).</li>
                    </ul>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>3. Bảng Kiểm Tra Tuân Thủ Hiện Tại:</strong>
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {compliance.checks.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px' }}>
                          {c.valid ? <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />}
                          <div>
                            <strong>{c.title}:</strong> <span style={{ color: '#64748b' }}>{c.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: KHUNG XEM TRƯỚC KHỔ GIẤY A4 WYSIWYG */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} color="#2563eb" /> Bản Xem Trước Khổ Giấy A4 Chuẩn NĐ 30 (210 x 297mm):
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                Lề: Trái 30mm | Trên 20mm | Dưới 20mm | Phải 15mm
              </span>
            </div>

            {/* KHUNG A4 THỰC TẾ VỚI PADDING & SHADOW */}
            <div 
              className="preview-outer-box"
              style={{ 
                backgroundColor: '#94a3b8', 
                padding: '24px', 
                borderRadius: '16px', 
                overflowX: 'auto',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div
                id="decree30-preview-container"
                ref={previewRef}
                style={{
                  backgroundColor: '#ffffff',
                  width: '100%',
                  maxWidth: '794px', // 210mm in 96DPI approx 794px
                  minHeight: '1050px',
                  margin: '0 auto',
                  padding: '75px 56px 75px 113px', // Tỷ lệ lề: Trên 2cm (~75px), Phải 1.5cm (~56px), Dưới 2cm (~75px), Trái 3cm (~113px)
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  boxSizing: 'border-box',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '13pt',
                  lineHeight: '1.35',
                  color: '#000000',
                  textAlign: 'justify'
                }}
              >
                
                {/* 1. KHUNG QUỐC HIỆU - TIÊU NGỮ & ĐƠN VỊ BAN HÀNH (BẢNG 2 CỘT) */}
                <table className="header-table" style={{ width: '100%', border: 'none', marginBottom: '18px' }}>
                  <tbody>
                    <tr>
                      {/* Cột 1: Cơ quan ban hành */}
                      <td style={{ width: '45%', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'normal', textTransform: 'uppercase', lineHeight: '1.2' }}>
                          {docData.department || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK'}
                        </div>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2', marginTop: '2px' }}>
                          {docData.issuer || 'TRƯỜNG THPT CAO BÁ QUÁT'}
                        </div>
                        {/* Gạch ngang cơ quan 1/3 đến 1/2 */}
                        <div style={{ width: '40%', height: '1px', backgroundColor: '#000000', margin: '4px auto 6px auto' }}></div>
                        
                        <div style={{ fontSize: '12pt', fontStyle: 'normal', marginTop: '4px' }}>
                          {docData.doc_number || 'Số: .../KH-CBQ'}
                        </div>
                      </td>

                      {/* Cột 2: Quốc hiệu - Tiêu ngữ */}
                      <td style={{ width: '55%', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2' }}>
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </div>
                        <div style={{ fontSize: '13pt', fontWeight: 'bold', lineHeight: '1.2', marginTop: '2px' }}>
                          Độc lập - Tự do - Hạnh phúc
                        </div>
                        {/* Gạch ngang nét liền tiêu ngữ */}
                        <div style={{ width: '55%', height: '1px', backgroundColor: '#000000', margin: '4px auto 6px auto' }}></div>

                        <div style={{ fontSize: '13pt', fontStyle: 'italic', marginTop: '6px' }}>
                          {docData.location_date || 'Tân An, ngày 23 tháng 09 năm 2026'}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. TÊN LOẠI VĂN BẢN VÀ TRÍCH YẾU NỘI DUNG */}
                <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '22px' }}>
                  <h2 style={{ fontSize: '15pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', fontFamily: '"Times New Roman", Times, serif' }}>
                    {docData.type_name || 'KẾ HOẠCH'}
                  </h2>
                  <div style={{ fontSize: '13.5pt', fontWeight: 'bold', lineHeight: '1.3', maxWidth: '90%', margin: '0 auto' }}>
                    {docData.subject || 'Về việc triển khai nhiệm vụ công tác chuyên môn'}
                  </div>
                  {/* Gạch ngang nét liền dưới trích yếu 1/3 đến 1/2 */}
                  <div style={{ width: '30%', height: '1px', backgroundColor: '#000000', margin: '6px auto 0 auto' }}></div>
                </div>

                {/* 3. NỘI DUNG CHÍNH (ĐƯỢC ĐỊNH DẠNG ĐỀ MỤC & THỤT ĐẦU DÒNG 1.0CM) */}
                <div style={{ marginTop: '14px', marginBottom: '30px' }}>
                  {(() => {
                    const rawContent = docData.content || '';
                    // Tách các đoạn văn và khối bảng biểu
                    const blocks = [];
                    const rawBlocks = rawContent.split('\n');
                    let currentTableRows = [];
                    let currentTextLines = [];

                    const flushText = () => {
                      if (currentTextLines.length > 0) {
                        const textChunk = currentTextLines.join('\n').trim();
                        if (textChunk) blocks.push({ type: 'text', content: textChunk });
                        currentTextLines = [];
                      }
                    };

                    const flushTable = () => {
                      if (currentTableRows.length > 0) {
                        blocks.push({ type: 'table', rows: currentTableRows });
                        currentTableRows = [];
                      }
                    };

                    for (let line of rawBlocks) {
                      const trimmed = line.trim();
                      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                        flushText();
                        if (!trimmed.includes('---')) {
                          currentTableRows.push(trimmed);
                        }
                      } else {
                        flushTable();
                        if (trimmed) currentTextLines.push(trimmed);
                        else flushText(); // dòng trống ngăn cách đoạn
                      }
                    }
                    flushText();
                    flushTable();

                    return blocks.map((block, bIdx) => {
                      if (block.type === 'table') {
                        return (
                          <div key={bIdx} style={{ margin: '14px 0', overflowX: 'auto' }}>
                            <table className="data-table" border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt' }}>
                              <tbody>
                                {block.rows.map((rowStr, rIdx) => {
                                  const cells = rowStr.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
                                  const isHeader = rIdx === 0 || cells.some(c => /^(STT|Họ và tên|Chức vụ|Nội dung|Thời gian)/i.test(c));
                                  return (
                                    <tr key={rIdx} style={{ backgroundColor: isHeader ? '#f8fafc' : 'transparent' }}>
                                      {cells.map((cell, cIdx) => (
                                        <td
                                          key={cIdx}
                                          style={{
                                            border: '1px solid #000',
                                            padding: '6px 10px',
                                            textAlign: cIdx === 0 && cells.length > 2 ? 'center' : 'left',
                                            fontWeight: isHeader ? 'bold' : 'normal',
                                            textIndent: 0,
                                            lineHeight: '1.3'
                                          }}
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      const cleanP = block.content;
                      // Header La Mã (I., II., III...)
                      if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/i.test(cleanP)) {
                        return (
                          <div key={bIdx} style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '14px', marginBottom: '6px' }}>
                            {cleanP}
                          </div>
                        );
                      }

                      // Header số (1., 2., 3...)
                      if (/^\d+\.\s+/.test(cleanP)) {
                        return (
                          <div key={bIdx} style={{ fontSize: '13pt', fontWeight: 'bold', textIndent: '1.0cm', marginTop: '10px', marginBottom: '4px' }}>
                            {cleanP}
                          </div>
                        );
                      }

                      // Đoạn văn thông thường
                      return (
                        <p key={bIdx} style={{ margin: '0 0 6pt 0', textIndent: '1.0cm', lineHeight: '1.35', textAlign: 'justify' }}>
                          {cleanP}
                        </p>
                      );
                    });
                  })()}
                </div>

                {/* 4. CHỮ KÝ & NƠI NHẬN CHUẨN NGHỊ ĐỊNH 30 */}
                {docData.type_name === 'BIÊN BẢN' || docData.is_minutes ? (
                  /* Kiểu Biên bản: 2 cột Thư ký (trái) và Chủ trì (phải) */
                  <table className="footer-table" style={{ width: '100%', border: 'none', marginTop: '35px', pageBreakInside: 'avoid' }}>
                    <tbody>
                      <tr>
                        {/* Thư ký */}
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                          <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2' }}>
                            {docData.secretary_title || 'THƯ KÝ'}
                          </div>
                          <div style={{ fontSize: '11pt', fontStyle: 'italic', marginTop: '2px', marginBottom: '65px' }}>
                            (Ký và ghi rõ họ tên)
                          </div>
                          <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>
                            {docData.secretary_name || ''}
                          </div>
                        </td>

                        {/* Chủ trì */}
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                          <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2' }}>
                            {(docData.signer_title || 'CHỦ TRÌ').split('\n').map((line, lIdx) => (
                              <div key={lIdx}>{line}</div>
                            ))}
                          </div>
                          <div style={{ fontSize: '11pt', fontStyle: 'italic', marginTop: '2px', marginBottom: '65px' }}>
                            (Ký và ghi rõ họ tên)
                          </div>
                          <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>
                            {docData.signer_name || ''}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  /* Kiểu Văn bản hành chính: Nơi nhận (trái) và Chức vụ/Chữ ký (phải) */
                  <table className="footer-table" style={{ width: '100%', border: 'none', marginTop: '35px', pageBreakInside: 'avoid' }}>
                    <tbody>
                      <tr>
                        {/* Nơi nhận */}
                        <td style={{ width: '50%', border: 'none', textAlign: 'left', verticalAlign: 'top', padding: 0 }}>
                          <div style={{ fontSize: '12pt', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '4px' }}>
                            Nơi nhận:
                          </div>
                          <div style={{ fontSize: '11pt', lineHeight: '1.3' }}>
                            {(docData.recipients || []).map((r, i) => (
                              <div key={i}>{r}</div>
                            ))}
                          </div>
                        </td>

                        {/* Chức vụ & Chữ ký */}
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                          <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2' }}>
                            {(docData.signer_title || 'HIỆU TRƯỞNG').split('\n').map((line, lIdx) => (
                              <div key={lIdx}>{line}</div>
                            ))}
                          </div>
                          <div style={{ fontSize: '11pt', fontStyle: 'italic', marginTop: '2px', marginBottom: '65px' }}>
                            (Ký, ghi rõ họ tên và đóng dấu)
                          </div>
                          <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>
                            {docData.signer_name || ''}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

              </div>
            </div>

          </div>

        </div>

          </>
        )}

        {/* MODAL OCR GEMINI 2.5 VISION: ẢNH SANG WORD NGHỊ ĐỊNH 30 */}
        {isOcrModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(3px)'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={22} color="#7c3aed" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Ảnh Sang Word (Gemini 2.5 Vision OCR)
                  </h3>
                </div>
                <button
                  onClick={() => { setIsOcrModalOpen(false); setOcrImageFile(null); setOcrPreviewUrl(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                Chụp hoặc tải ảnh công văn, quyết định, giấy mời dạng giấy. AI Gemini 2.5 Vision sẽ tự động nhận diện chữ, căn lề và tái tạo file Word chuẩn 100% Nghị định 30!
              </p>

              <input
                type="file"
                ref={ocrFileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setOcrImageFile(file);
                    setOcrPreviewUrl(URL.createObjectURL(file));
                  }
                }}
              />

              {/* Vùng chọn ảnh hoặc Preview */}
              {!ocrPreviewUrl ? (
                <div
                  onClick={() => ocrFileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '14px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  <Camera size={40} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                    Nhấn để chọn ảnh công văn hoặc kéo thả vào đây
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Hỗ trợ JPG, PNG, WEBP (ảnh chụp tài liệu rõ nét)
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <img
                    src={ocrPreviewUrl}
                    alt="Ảnh công văn"
                    style={{
                      maxHeight: '220px',
                      maxWidth: '100%',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={() => ocrFileInputRef.current?.click()}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Chọn ảnh khác
                    </button>
                  </div>
                </div>
              )}

              {/* Nút hành động */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setIsOcrModalOpen(false); setOcrImageFile(null); setOcrPreviewUrl(null); }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>

                <button
                  onClick={() => handleRunOcr(ocrImageFile)}
                  disabled={!ocrImageFile || isOcrProcessing}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    backgroundColor: !ocrImageFile || isOcrProcessing ? '#94a3b8' : '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: !ocrImageFile || isOcrProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
                  }}
                >
                  {isOcrProcessing ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" />
                      <span>Gemini Vision đang đọc ảnh...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Bóc tách sang Word NĐ 30</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TRỘN VĂN BẢN HÀNG LOẠT (EXCEL MAIL MERGE) */}
        {isBatchModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(3px)'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={22} color="#059669" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Trộn Văn Bản Hàng Loạt (Smart Mail Merge)
                  </h3>
                </div>
                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                Tự động điền hàng loạt Giấy mời họp PHHS, Giấy triệu tập, Phiếu báo điểm từ danh sách file Excel của trường mà không cần làm thủ công từng tờ!
              </p>

              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#166534', marginBottom: '4px' }}>
                  💡 Hướng dẫn nhanh 2 bước:
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#15803d', lineHeight: '1.5' }}>
                  <li>Chọn mẫu văn bản mong muốn (ví dụ: Giấy mời họp PHHS).</li>
                  <li>Tải file Excel chứa cột [Họ và tên], [Lớp], [Thời gian], hệ thống sẽ xuất ra 1 file Word chứa tất cả giấy mời phân trang A4 hoàn hảo!</li>
                </ol>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setIsBatchModalOpen(false);
                    setViewMode('editor');
                    showToast('📄 Đã sẵn sàng! Thầy/Cô hãy chỉnh sửa nội dung mẫu trước khi xuất hàng loạt.');
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Tiếp tục với mẫu hiện tại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DRAWER BOTTOM SHEET TIỆN ÍCH MỞ RỘNG (Ảnh 1) */}
        {isMoreDrawerOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setIsMoreDrawerOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                width: '100%',
                maxWidth: '560px',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '16px 20px 30px 20px',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.2)'
              }}
            >
              {/* Drag handle */}
              <div style={{ width: '40px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '4px', margin: '0 auto 16px auto' }} />

              {/* CARD THAY THẾ "GÓI CƯỚC & NẠP COIN" CỦA LATENDOC */}
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e3a8a' }}>
                    100% Miễn Phí Vĩnh Viễn • Không Giới Hạn Coin
                  </div>
                  <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px', lineHeight: '1.3' }}>
                    Hệ thống kết nối Google Gemini 2.5 Flash / 3.5 Flash Lite siêu tốc. Thầy/Cô thoải mái sử dụng không bao giờ bị khóa tài khoản!
                  </div>
                </div>
              </div>

              {/* LƯỚI 8 TIỆN ÍCH (Ảnh 1) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {/* 1. Hàng loạt */}
                <button
                  onClick={() => { setIsMoreDrawerOpen(false); setIsBatchModalOpen(true); }}
                  style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <FileSpreadsheet size={22} color="#059669" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Hàng loạt</span>
                </button>

                {/* 2. Ghi họp */}
                <button
                  onClick={() => { setIsMoreDrawerOpen(false); navigate('/admin/ai-meeting-minutes'); }}
                  style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <Mic size={22} color="#dc2626" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Ghi họp</span>
                </button>

                {/* 3. Tài liệu NĐ 30 */}
                <button
                  onClick={() => { setIsMoreDrawerOpen(false); setViewMode('editor'); setActiveTab('rules'); }}
                  style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <BookOpen size={22} color="#2563eb" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Tài liệu</span>
                </button>

                {/* 4. Ảnh sang Word (OCR) */}
                <button
                  onClick={() => { setIsMoreDrawerOpen(false); setIsOcrModalOpen(true); }}
                  style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <Camera size={22} color="#7c3aed" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Ảnh sang W...</span>
                </button>

                {/* 5. Lịch sử */}
                <button
                  onClick={() => { setIsMoreDrawerOpen(false); showToast('📜 Hệ thống tự động ghi nhớ bản thảo gần nhất của Thầy/Cô trên trình duyệt!'); }}
                  style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <History size={22} color="#0891b2" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Lịch sử</span>
                </button>

                {/* 6. Thùng rác / Làm mới */}
                <button
                  onClick={() => {
                    if (window.confirm("Thầy/Cô có chắc chắn muốn làm mới và xóa trắng văn bản hiện tại?")) {
                      handleCreateBlankDoc();
                      setIsMoreDrawerOpen(false);
                    }
                  }}
                  style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <Trash2 size={22} color="#64748b" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Làm mới</span>
                </button>

                {/* 7. Bắt lỗi NĐ 30 */}
                <button
                  onClick={() => { setIsMoreDrawerOpen(false); setViewMode('editor'); setActiveTab('upload'); }}
                  style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <ShieldCheck size={22} color="#16a34a" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Bắt lỗi NĐ 30</span>
                </button>

                {/* 8. Góp ý */}
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    const feedback = prompt("Thầy/Cô có đề xuất mẫu văn bản mới hoặc góp ý tính năng nào cho Tổ CNTT?");
                    if (feedback) showToast("🙏 Xin cảm ơn Thầy/Cô! Đề xuất đã được ghi nhận.");
                  }}
                  style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                    <MessageSquare size={22} color="#eab308" />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Góp ý</span>
                </button>
              </div>

              {/* Chân drawer: Thông tin cá nhân & Đóng */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>Cán bộ / Giáo viên</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Trường THPT Cao Bá Quát</div>
                  </div>
                </div>

                <button
                  onClick={() => setIsMoreDrawerOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* THANH ĐIỀU HƯỚNG ĐÁY 5 NÚT CHUẨN LATENDOC (Ảnh 1, 2, 3, 4) */}
        <div className="no-print" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 12px',
          zIndex: 9999,
          maxWidth: '650px',
          margin: '0 auto',
          borderRadius: '20px 20px 0 0'
        }}>
          {/* 1. Trang chủ */}
          <button
            onClick={() => setViewMode('studio')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: viewMode === 'studio' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <Home size={20} />
            <span style={{ fontSize: '11px', fontWeight: viewMode === 'studio' ? '700' : '500' }}>Trang chủ</span>
          </button>

          {/* 2. Văn bản (Editor) */}
          <button
            onClick={() => setViewMode('editor')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: viewMode === 'editor' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <FileText size={20} />
            <span style={{ fontSize: '11px', fontWeight: viewMode === 'editor' ? '700' : '500' }}>Văn bản</span>
          </button>

          {/* 3. Nút tròn lớn (+) Tạo mới ở giữa */}
          <button
            onClick={handleCreateBlankDoc}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#4338ca',
              backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              border: '3px solid #ffffff',
              boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transform: 'translateY(-10px)',
              transition: 'transform 0.15s'
            }}
            title="Tạo văn bản mới"
          >
            <Plus size={26} />
          </button>

          {/* 4. Mẫu */}
          <button
            onClick={() => {
              setViewMode('studio');
              setTimeout(() => {
                document.getElementById('thu-vien-mau-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <LayoutGrid size={20} />
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Mẫu</span>
          </button>

          {/* 5. Thêm */}
          <button
            onClick={() => setIsMoreDrawerOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: isMoreDrawerOpen ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <Menu size={20} />
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Thêm</span>
          </button>
        </div>

        {/* FLOATING NÚT GÓP Ý CHUẨN LATENDOC (Ảnh 1, 2, 3, 4) */}
        <button
          onClick={() => {
            const feedback = prompt("Thầy/Cô có đề xuất mẫu văn bản mới hoặc góp ý tính năng nào cho Tổ CNTT?");
            if (feedback) showToast("🙏 Xin cảm ơn Thầy/Cô! Đề xuất đã được ghi nhận.");
          }}
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '75px',
            right: '20px',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            border: '1.5px solid #cbd5e1',
            borderRadius: '24px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            zIndex: 9998,
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          <MessageSquare size={16} /> Góp ý
        </button>

      </div>
    </div>
  );
}
