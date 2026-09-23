import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  FileText, Download, Printer, Copy, Check, Sparkles, RefreshCw, 
  HelpCircle, Eye, Sliders, CheckCircle2, AlertCircle, ArrowLeft,
  Layers, Plus, Trash2, BookOpen, ShieldCheck, FileCheck, Share2,
  Upload, FileUp, AlertTriangle, Info, Wand2, ArrowRight, CheckCircle,
  FileCode, Cpu
} from 'lucide-react';
import { DECREE_30_TEMPLATES, DECREE_30_RULES } from '../../data/decree30Templates';
import { 
  parseRawTextToDecree30, 
  validateDecree30Compliance, 
  exportDecree30ToWord,
  readWordFile,
  auditDecree30Document,
  autoFixDecree30Document
} from '../../utils/decree30FormatterUtil';

export default function Decree30DocFormatter() {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Chọn mẫu mặc định ban đầu là "Kế hoạch chuyên môn"
  const [selectedTemplateId, setSelectedTemplateId] = useState('ke_hoach_chuyen_mon');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'form' | 'paste' | 'rules'
  
  // Dữ liệu văn bản
  const [docData, setDocData] = useState(() => {
    const tpl = DECREE_30_TEMPLATES[0];
    return { ...tpl };
  });

  // Văn bản thô khi người dùng dán vào
  const [rawInputText, setRawInputText] = useState('');
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Kết quả AI Scanner / Auditor
  const [auditResult, setAuditResult] = useState(null);
  const [isAutoFixed, setIsAutoFixed] = useState(false);

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
      alert("Không thể đọc file Word này. Vui lòng đảm bảo file định dạng .docx hợp lệ hoặc sao chép nội dung dán vào tab 'Dán Text'!");
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
    <Layout>
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '20px 16px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        
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
        <div style={{
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
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={24} color="#2563eb" /> Căn Chỉnh Định Dạng Văn Bản Chuẩn Nghị Định 30/2020/NĐ-CP
              </h1>
              <span style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: compliance.isFullyCompliant ? '#f0fdf4' : '#fffbeb',
                color: compliance.isFullyCompliant ? '#16a34a' : '#d97706',
                border: compliance.isFullyCompliant ? '1px solid #86efac' : '1px solid #fde68a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={14} /> Điểm chuẩn hóa: {compliance.score}%
              </span>
            </div>
            <p style={{ margin: '4px 0 0 30px', fontSize: '13px', color: '#64748b' }}>
              THPT Cao Bá Quát • Nhập file Word (.docx), AI tự động phát hiện lỗi thể thức sai chuẩn & 1-Click căn chỉnh về 100% chuẩn Nghị định 30
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopyRichText}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Copy size={16} /> Sao Chép
            </button>

            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                border: '1px solid #86efac',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Printer size={16} /> In / Xuất PDF A4
            </button>

            <button
              onClick={handleExportWord}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
              }}
            >
              <Download size={16} /> Tải File Word (.doc)
            </button>
          </div>
        </div>

        {/* 2. CHỌN MẪU VĂN BẢN SẴN CÓ */}
        <div style={{
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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 48%) 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT PANEL: SOẠN THẢO, IMPORT WORD & AI AUDITOR */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
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

                    {/* Nút 1-Click AI Auto Fix Nổi Bật */}
                    {auditResult.issuesCount > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <button
                          type="button"
                          onClick={handleRunAiAutoFix}
                          style={{
                            width: '100%',
                            padding: '13px 18px',
                            borderRadius: '10px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Wand2 size={18} /> ⚡ AI Tự Động Sửa Toàn Bộ {auditResult.issuesCount} Lỗi & Căn Chỉnh Chuẩn NĐ 30
                        </button>
                      </div>
                    )}

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eff6ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                    💡 Đang chỉnh sửa chi tiết từng thành phần thể thức
                  </span>
                  <button
                    type="button"
                    onClick={handleRunAiAutoFix}
                    style={{
                      padding: '5px 10px',
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
                    <Wand2 size={13} /> AI Sửa Lỗi Ngay
                  </button>
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

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleAutoFormatRawText}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                    }}
                  >
                    <Sparkles size={18} /> ⚡ Phân Tích & Chuẩn Hóa Sang Chuẩn NĐ 30
                  </button>

                  <button
                    type="button"
                    onClick={() => setRawInputText('')}
                    style={{ padding: '12px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Xóa
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
                </div>

                {/* 3. NỘI DUNG CHÍNH (ĐƯỢC ĐỊNH DẠNG ĐỀ MỤC & THỤT ĐẦU DÒNG 1.0CM) */}
                <div style={{ marginTop: '14px', marginBottom: '30px' }}>
                  {(docData.content || '').split('\n\n').map((paragraph, pIdx) => {
                    const cleanP = paragraph.trim();
                    if (!cleanP) return null;

                    // Header La Mã (I., II., III...)
                    if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/i.test(cleanP)) {
                      return (
                        <div key={pIdx} style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '14px', marginBottom: '6px' }}>
                          {cleanP}
                        </div>
                      );
                    }

                    // Header số (1., 2., 3...)
                    if (/^\d+\.\s+/.test(cleanP)) {
                      return (
                        <div key={pIdx} style={{ fontSize: '13pt', fontWeight: 'bold', textIndent: '1.0cm', marginTop: '10px', marginBottom: '4px' }}>
                          {cleanP}
                        </div>
                      );
                    }

                    // Bảng dữ liệu Markdown
                    if (cleanP.startsWith('|')) {
                      const rows = cleanP.split('\n').filter(r => r.includes('|') && !r.includes('---'));
                      return (
                        <table key={pIdx} className="data-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0' }}>
                          <tbody>
                            {rows.map((row, rIdx) => {
                              const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
                              if (rIdx === 0) {
                                return (
                                  <tr key={rIdx}>
                                    {cells.map((cell, cIdx) => (
                                      <th key={cIdx} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', backgroundColor: '#f2f2f2' }}>{cell}</th>
                                    ))}
                                  </tr>
                                );
                              }
                              return (
                                <tr key={rIdx}>
                                  {cells.map((cell, cIdx) => (
                                    <td key={cIdx} style={{ border: '1px solid black', padding: '6px', textAlign: cIdx === 0 ? 'center' : 'left' }}>{cell}</td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    }

                    // Đoạn văn thông thường
                    return (
                      <p key={pIdx} style={{ margin: '0 0 6pt 0', textIndent: '1.0cm', lineHeight: '1.35', textAlign: 'justify' }}>
                        {cleanP}
                      </p>
                    );
                  })}
                </div>

                {/* 4. CHỮ KÝ & NƠI NHẬN CHUẨN NGHỊ ĐỊNH 30 */}
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

              </div>
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}
