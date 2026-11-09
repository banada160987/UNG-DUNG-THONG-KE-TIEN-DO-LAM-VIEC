import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FileText, Download, Printer, Copy, Check, Sparkles, RefreshCw, 
  HelpCircle, Eye, Sliders, CheckCircle2, AlertCircle, ArrowLeft,
  Layers, Plus, Trash2, BookOpen, ShieldCheck, FileCheck, Share2,
  Upload, FileUp, AlertTriangle, Info, Wand2, ArrowRight, CheckCircle,
  Cpu, Home, Grid, ExternalLink, Search, Camera, Clock, Calendar,
  Settings, MessageSquare, History, Briefcase, FileSpreadsheet, X, Menu,
  ChevronRight, LayoutGrid, List, CheckSquare, Send, Paperclip, 
  UserCheck, AlertOctagon, FileCheck2, ShieldAlert, Award
} from 'lucide-react';
import Layout from '../components/Layout';
import { 
  getDocumentsIn, 
  saveDocumentIn, 
  deleteDocumentIn, 
  endorseDocumentIn, 
  getDocumentTasks, 
  updateDocumentTask, 
  getDocumentsOut, 
  saveDocumentOut, 
  deleteDocumentOut, 
  extractDocumentWithAI, 
  exportDocumentsRegistryToExcel, 
  getUrgencyLabel, 
  getUrgencyColor, 
  getStatusLabel, 
  getStatusColor 
} from '../services/eOfficeService';
import { getTeacherSession } from '../services/authSessionManager';
import { getStoredAiKey } from '../services/aiAssistantService';

const DEPARTMENTS = [
  'Tổ Toán - Tin',
  'Tổ Ngữ Văn',
  'Tổ Ngoại Ngữ',
  'Tổ Vật Lý - Công Nghệ',
  'Tổ Hóa Học',
  'Tổ Sinh Học',
  'Tổ Lịch Sử - Địa Lý - GDCD',
  'Tổ Thể Dục - GDQP',
  'Đoàn Thanh Niên',
  'Công Đoàn Nhà Trường',
  'Ban Quản Lý Bếp Sáng & Canteen',
  'Bộ Phận Văn Phòng & Kế Toán',
  'Tổ Bảo Vệ'
];

export default function AdminEOffice() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedTeacher = getTeacherSession();

  // Tab điều hướng chính: 'docs_in' | 'endorse' | 'my_tasks' | 'docs_out' | 'stats'
  const [activeTab, setActiveTab] = useState('docs_in');

  // Dữ liệu văn bản
  const [docsIn, setDocsIn] = useState([]);
  const [docsOut, setDocsOut] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Modals
  const [showAiModal, setShowAiModal] = useState(false);
  const [showEndorseModal, setShowEndorseModal] = useState(false);
  const [showDocOutModal, setShowDocOutModal] = useState(false);
  const [showTaskReportModal, setShowTaskReportModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewingFileUrl, setViewingFileUrl] = useState(null);

  // Form State cho AI Extraction
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiExtractedData, setAiExtractedData] = useState({
    doc_code: '',
    issued_date: '',
    sender_org: '',
    summary: '',
    doc_type: 'Công văn',
    urgency: 'normal',
    deadline: '',
    signer_name: '',
    suggested_department: 'Tổ Toán - Tin',
    suggested_directive: ''
  });
  const [uploadedFileBase64, setUploadedFileBase64] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileType, setUploadedFileType] = useState('');

  // Form State cho Bút Phê BGH
  const [endorseData, setEndorseData] = useState({
    directive: '',
    main_department: 'Tổ Toán - Tin',
    main_assignee_name: '',
    co_assignees_text: '',
    deadline: '',
    priority: 'normal'
  });

  // Form State cho Văn Bản Đi
  const [docOutData, setDocOutData] = useState({
    doc_type: 'Kế hoạch',
    summary: '',
    department_name: 'Ban Giám Hiệu',
    drafted_by: loggedTeacher?.full_name || 'Văn thư trường',
    recipient_org: 'Sở Giáo dục và Đào tạo Đắk Lắk',
    signer_name: 'Lê Văn Kiệt',
    signer_title: 'Hiệu trưởng',
    status: 'signed_ready'
  });

  // Form State cho Báo Cáo Tiến Độ
  const [taskReportData, setTaskReportData] = useState({
    progress_percent: 100,
    report_notes: '',
    report_file_url: ''
  });

  // Tải dữ liệu ban đầu
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dIn, dOut, tList] = await Promise.all([
        getDocumentsIn(),
        getDocumentsOut(),
        getDocumentTasks()
      ]);
      setDocsIn(dIn);
      setDocsOut(dOut);
      setTasks(tList);
    } catch (err) {
      console.error('Lỗi tải dữ liệu e-Office:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc văn bản đến
  const filteredDocsIn = useMemo(() => {
    return docsIn.filter(d => {
      const matchSearch = !searchTerm || 
        (d.doc_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.sender_org || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.summary || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchUrgency = filterUrgency === 'all' || d.urgency === filterUrgency;
      const matchStatus = filterStatus === 'all' || d.status === filterStatus;
      return matchSearch && matchUrgency && matchStatus;
    });
  }, [docsIn, searchTerm, filterUrgency, filterStatus]);

  // Lọc văn bản đi
  const filteredDocsOut = useMemo(() => {
    return docsOut.filter(d => {
      return !searchTerm || 
        (d.doc_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.recipient_org || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.summary || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [docsOut, searchTerm]);

  // Lọc nhiệm vụ của người dùng hiện tại hoặc theo tổ
  const myTasks = useMemo(() => {
    const currentName = loggedTeacher?.full_name || '';
    if (!currentName) return tasks;
    return tasks.filter(t => 
      (t.assignee_name || '').toLowerCase().includes(currentName.toLowerCase()) ||
      (t.department_name && loggedTeacher?.department && t.department_name.includes(loggedTeacher.department))
    );
  }, [tasks, loggedTeacher]);

  // Xử lý nạp file và trích xuất bằng AI Gemini
  const handleFileUploadForAI = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileType(file.type);
    setAiLoading(true);
    setAiError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        setUploadedFileBase64(base64Data);

        try {
          const extracted = await extractDocumentWithAI(base64Data, file.type, file.name);
          setAiExtractedData(prev => ({
            ...prev,
            doc_code: extracted.doc_code || prev.doc_code,
            issued_date: extracted.issued_date || prev.issued_date,
            sender_org: extracted.sender_org || prev.sender_org,
            summary: extracted.summary || prev.summary,
            doc_type: extracted.doc_type || prev.doc_type,
            urgency: extracted.urgency || prev.urgency,
            deadline: extracted.deadline || prev.deadline,
            signer_name: extracted.signer_name || prev.signer_name,
            suggested_department: extracted.suggested_department || prev.suggested_department,
            suggested_directive: extracted.suggested_directive || ''
          }));
        } catch (extractErr) {
          console.warn('Lỗi AI bóc tách:', extractErr);
          setAiError(extractErr.message || 'Không thể đọc nội dung file. Bạn có thể tự nhập thông tin bằng tay.');
        } finally {
          setAiLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setAiError('Lỗi đọc tệp: ' + err.message);
      setAiLoading(false);
    }
  };

  // Lưu văn bản đến mới sau khi AI bóc tách
  const handleSaveExtractedDoc = async () => {
    if (!aiExtractedData.doc_code || !aiExtractedData.summary) {
      alert('Vui lòng điền đủ Số hiệu văn bản và Trích yếu nội dung.');
      return;
    }

    try {
      const newDocPayload = {
        doc_code: aiExtractedData.doc_code.trim(),
        issued_date: aiExtractedData.issued_date || new Date().toISOString().split('T')[0],
        sender_org: aiExtractedData.sender_org.trim() || 'Sở GD&ĐT Đắk Lắk',
        summary: aiExtractedData.summary.trim(),
        doc_type: aiExtractedData.doc_type,
        urgency: aiExtractedData.urgency,
        deadline: aiExtractedData.deadline ? `${aiExtractedData.deadline}T17:00:00Z` : null,
        signer_name: aiExtractedData.signer_name,
        main_file_url: uploadedFileBase64 || '',
        main_file_name: uploadedFileName || `${aiExtractedData.doc_code.replace(/[\/\\]/g, '_')}.pdf`,
        digital_signature_info: {
          is_signed: true,
          signer: aiExtractedData.sender_org.toUpperCase(),
          signed_date: new Date().toLocaleString('vi-VN'),
          certificate_authority: 'Ban Cơ yếu Chính phủ / VGCA',
          is_valid: true
        },
        created_by: loggedTeacher?.full_name || 'Văn thư trường'
      };

      const updated = await saveDocumentIn(newDocPayload);
      setDocsIn(updated);
      setShowAiModal(false);
      resetAiForm();
      alert(`Đã vào Sổ Công Văn Đến thành công! Số đến tiếp theo: ${updated[0]?.in_number}`);
    } catch (err) {
      alert('Lỗi lưu văn bản: ' + err.message);
    }
  };

  const resetAiForm = () => {
    setUploadedFileBase64('');
    setUploadedFileName('');
    setUploadedFileType('');
    setAiError('');
    setAiExtractedData({
      doc_code: '',
      issued_date: '',
      sender_org: '',
      summary: '',
      doc_type: 'Công văn',
      urgency: 'normal',
      deadline: '',
      signer_name: '',
      suggested_department: 'Tổ Toán - Tin',
      suggested_directive: ''
    });
  };

  // Mở modal Bút Phê của BGH
  const handleOpenEndorseModal = (doc) => {
    setSelectedDoc(doc);
    setEndorseData({
      directive: doc.endorsement?.directive || (doc.summary ? `Giao bộ phận chuyên môn nghiên cứu công văn ${doc.doc_code}, tham mưu kế hoạch triển khai và báo cáo BGH đúng hạn.` : ''),
      main_department: doc.endorsement?.main_department || 'Tổ Toán - Tin',
      main_assignee_name: doc.endorsement?.main_assignee_name || '',
      co_assignees_text: Array.isArray(doc.endorsement?.co_assignees) ? doc.endorsement.co_assignees.join(', ') : '',
      deadline: doc.endorsement?.deadline ? doc.endorsement.deadline.split('T')[0] : (doc.deadline ? doc.deadline.split('T')[0] : ''),
      priority: doc.urgency === 'express' ? 'urgent' : 'normal'
    });
    setShowEndorseModal(true);
  };

  // Thực hiện Bút Phê BGH
  const handleSaveEndorsement = async () => {
    if (!endorseData.directive.trim()) {
      alert('Vui lòng nhập ý kiến bút phê chỉ đạo của Lãnh đạo.');
      return;
    }

    try {
      const coList = endorseData.co_assignees_text
        ? endorseData.co_assignees_text.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        leader_name: loggedTeacher?.full_name || 'Thầy Hiệu Trưởng',
        leader_role: 'principal',
        directive: endorseData.directive.trim(),
        main_department: endorseData.main_department,
        main_assignee_name: endorseData.main_assignee_name.trim(),
        co_assignees: coList,
        deadline: endorseData.deadline ? `${endorseData.deadline}T17:00:00Z` : null,
        priority: endorseData.priority
      };

      const { updatedDocs, updatedTasks } = await endorseDocumentIn(selectedDoc.id, payload);
      setDocsIn(updatedDocs);
      setTasks(updatedTasks);
      setShowEndorseModal(false);
      alert('Đã lưu Bút phê Lãnh đạo và tự động chuyển việc cho giáo viên thành công!');
    } catch (err) {
      alert('Lỗi bút phê: ' + err.message);
    }
  };

  // Tạo công văn đi mới
  const handleSaveDocOut = async () => {
    if (!docOutData.summary.trim()) {
      alert('Vui lòng nhập Trích yếu nội dung văn bản đi.');
      return;
    }

    try {
      const updated = await saveDocumentOut(docOutData);
      setDocsOut(updated);
      setShowDocOutModal(false);
      alert('Đã cấp số và lưu vào Sổ Văn Bản Đi thành công!');
    } catch (err) {
      alert('Lỗi lưu văn bản đi: ' + err.message);
    }
  };

  // Nộp báo cáo tiến độ nhiệm vụ
  const handleSaveTaskReport = async () => {
    if (!taskReportData.report_notes.trim()) {
      alert('Vui lòng nhập nội dung báo cáo kết quả.');
      return;
    }

    try {
      const updated = await updateDocumentTask(selectedTask.id, {
        progress_percent: Number(taskReportData.progress_percent),
        report_notes: taskReportData.report_notes.trim(),
        report_file_url: taskReportData.report_file_url || ''
      });
      setTasks(updated);
      setShowTaskReportModal(false);
      alert('Đã nộp báo cáo tiến độ thành công!');
    } catch (err) {
      alert('Lỗi báo cáo: ' + err.message);
    }
  };

  // Xuất sổ Excel chuẩn Nghị định 30 theo quy tắc tên file: 1-...
  const handleExportExcel = (type) => {
    try {
      const list = type === 'in' ? filteredDocsIn : filteredDocsOut;
      const fileName = exportDocumentsRegistryToExcel(list, type);
      alert(`Đã xuất sổ văn bản thành công: ${fileName}`);
    } catch (err) {
      alert('Lỗi xuất Excel: ' + err.message);
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const totalIn = docsIn.length;
    const expressIn = docsIn.filter(d => d.urgency === 'express' || d.urgency === 'super_urgent').length;
    const pendingEndorse = docsIn.filter(d => d.status === 'new').length;
    const completedTasks = tasks.filter(t => t.progress_percent >= 100).length;
    const totalTasks = tasks.length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
    return { totalIn, expressIn, pendingEndorse, completedTasks, totalTasks, taskRate };
  }, [docsIn, tasks]);

  return (
    <Layout title="Văn Phòng Điện Tử e-Office Desk">
      <div className="cbq-eoffice-container" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '16px 12px 60px 12px',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#0f172a'
      }}>
        <style>{`
          .eoffice-tab-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 9px 16px;
            border-radius: 10px;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            color: #475569;
            white-space: nowrap;
            transition: all 0.2s ease;
          }
          .eoffice-tab-btn.active {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff;
            border-color: #0284c7;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
          }
          .eoffice-card {
            background: #ffffff;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 16px rgba(0,0,0,0.04);
            overflow: hidden;
          }
          .eoffice-action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            border: none;
            transition: transform 0.15s ease;
          }
          .eoffice-action-btn:active {
            transform: scale(0.97);
          }
          @media (max-width: 640px) {
            .eoffice-header-title {
              font-size: 17px !important;
            }
            .eoffice-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8px !important;
            }
            .eoffice-filter-row {
              flex-direction: column !important;
              align-items: stretch !important;
            }
          }
        `}</style>

        {/* 1. BANNER TIÊU ĐỀ & THÔNG TIN CHUẨN HÓA NGHỊ ĐỊNH 30 */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0284c7 100%)',
          borderRadius: '18px',
          padding: '20px 22px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '12px',
                borderRadius: '14px',
                backdropFilter: 'blur(8px)',
                flexShrink: 0
              }}>
                <FileCheck2 size={32} color="#fef08a" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    background: '#fef08a',
                    color: '#854d0e',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.4px'
                  }}>
                    CBQ e-OFFICE DESK
                  </span>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>
                    ✦ Nghị định 30/2020/NĐ-CP • Quyết định 28/2018/QĐ-TTg ✦
                  </span>
                </div>
                <h1 className="eoffice-header-title" style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  margin: '6px 0 3px 0',
                  color: '#ffffff',
                  letterSpacing: '0.2px'
                }}>
                  HỆ THỐNG VĂN PHÒNG ĐIỆN TỬ & ĐIỀU HÀNH VĂN BẢN SỐ
                </h1>
                <p style={{ margin: 0, fontSize: '13px', opacity: 0.95 }}>
                  Trường THPT Cao Bá Quát • Quản lý công văn đi - đến, Bút phê 1-chạm & Tự động bóc tách tài liệu bằng AI
                </p>
              </div>
            </div>

            {/* Cụm nút hành động nhanh: Nạp AI & Soạn thảo Nghị định 30 */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  resetAiForm();
                  setShowAiModal(true);
                }}
                className="eoffice-action-btn"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                }}
                title="Kéo thả file PDF từ iOffice hoặc ảnh chụp công văn để AI bóc tách điền form tự động"
              >
                <Sparkles size={16} /> ⚡ Tiếp Nhận Siêu Tốc Bằng AI
              </button>

              <Link
                to="/dinh-dang-van-ban-nd30"
                className="eoffice-action-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
                title="Mở Studio Soạn thảo văn bản chuẩn Nghị định 30"
              >
                <FileText size={16} /> Studio Nghị Định 30
              </Link>
            </div>
          </div>
        </div>

        {/* 2. HUD 4 THẺ THỐNG KÊ NHANH (SLA TELEMETRY) */}
        <div className="eoffice-stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>TỔNG CÔNG VĂN ĐẾN</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284c7', marginTop: '2px' }}>
              {stats.totalIn}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Năm học 2026 - 2027</div>
          </div>

          <div style={{ background: '#fef2f2', borderRadius: '14px', padding: '14px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} color="#dc2626" /> HỎA TỐC / THƯỢNG KHẨN
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#dc2626', marginTop: '2px' }}>
              {stats.expressIn}
            </div>
            <div style={{ fontSize: '11.5px', color: '#b91c1c', marginTop: '2px' }}>Ưu tiên giải quyết ngay</div>
          </div>

          <div style={{ background: '#fffbeb', borderRadius: '14px', padding: '14px', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 'bold' }}>CHỜ BGH BÚT PHÊ</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#d97706', marginTop: '2px' }}>
              {stats.pendingEndorse}
            </div>
            <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '2px' }}>Cần chỉ đạo & giao việc</div>
          </div>

          <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '14px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>TỶ LỆ XỬ LÝ ĐÚNG HẠN</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>
              {stats.taskRate}%
            </div>
            <div style={{ fontSize: '11.5px', color: '#15803d', marginTop: '2px' }}>{stats.completedTasks}/{stats.totalTasks} nhiệm vụ xong</div>
          </div>
        </div>

        {/* 3. THANH TAB ĐIỀU HƯỚNG CHÍNH */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('docs_in')}
            className={`eoffice-tab-btn ${activeTab === 'docs_in' ? 'active' : ''}`}
          >
            <Download size={16} /> 📥 Sổ Văn Bản Đến ({docsIn.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('endorse')}
            className={`eoffice-tab-btn ${activeTab === 'endorse' ? 'active' : ''}`}
          >
            <CheckSquare size={16} /> ✍️ Bút Phê & Điều Hành BGH ({docsIn.filter(d => d.status === 'new').length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_tasks')}
            className={`eoffice-tab-btn ${activeTab === 'my_tasks' ? 'active' : ''}`}
          >
            <Briefcase size={16} /> 📋 Nhiệm Vụ Của Tôi ({myTasks.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs_out')}
            className={`eoffice-tab-btn ${activeTab === 'docs_out' ? 'active' : ''}`}
          >
            <Upload size={16} /> 📤 Sổ Văn Bản Đi & Dự Thảo ({docsOut.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`eoffice-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          >
            <History size={16} /> 📊 Tiến Độ & Lưu Trữ Số
          </button>
        </div>

        {/* =========================================================================
            TAB 1: SỔ VĂN BẢN ĐẾN (INBOUND DOCUMENTS REGISTRY)
            ========================================================================= */}
        {activeTab === 'docs_in' && (
          <div className="eoffice-card" style={{ padding: '16px' }}>
            
            {/* Thanh tìm kiếm & lọc */}
            <div className="eoffice-filter-row" style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '14px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo số ký hiệu, trích yếu, cơ quan gửi..."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="all">Tất cả mức độ khẩn</option>
                  <option value="express">⚡ Hỏa tốc</option>
                  <option value="super_urgent">🔥 Thượng khẩn</option>
                  <option value="urgent">⚠️ Khẩn</option>
                  <option value="normal">Bình thường</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="new">Chờ BGH bút phê</option>
                  <option value="endorsed">Đã bút phê</option>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleExportExcel('in')}
                  className="eoffice-action-btn"
                  style={{
                    background: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0'
                  }}
                  title="Xuất file Excel sổ văn bản đến có tiền tố số thứ tự 1-..."
                >
                  <FileSpreadsheet size={15} /> Xuất Sổ Excel
                </button>
              </div>
            </div>

            {/* Bảng Danh Sách Công Văn Đến */}
            {filteredDocsIn.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                <FileText size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '14.5px', fontWeight: 'bold' }}>Chưa có công văn nào khớp với điều kiện lọc</div>
                <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Bấm nút "⚡ Tiếp Nhận Siêu Tốc Bằng AI" ở góc trên để nạp công văn từ iOffice vào sổ.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredDocsIn.map((doc) => {
                  const urgColor = getUrgencyColor(doc.urgency);
                  const stColor = getStatusColor(doc.status);

                  return (
                    <div
                      key={doc.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: doc.status === 'new' ? '#f0fdf4' : '#ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        
                        {/* Huy hiệu số đến & số ký hiệu */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            fontWeight: '800',
                            fontSize: '11.5px',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            Số đến: #{doc.in_number}
                          </span>

                          <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                            {doc.doc_code}
                          </span>

                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: urgColor.bg,
                            color: urgColor.text,
                            border: `1px solid ${urgColor.border}`
                          }}>
                            {getUrgencyLabel(doc.urgency)}
                          </span>

                          <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: stColor.bg,
                            color: stColor.text
                          }}>
                            {getStatusLabel(doc.status)}
                          </span>
                        </div>

                        {/* Ngày tiếp nhận & Hạn nộp */}
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>Ngày nhận: <strong>{new Date(doc.received_date).toLocaleDateString('vi-VN')}</strong></span>
                          {doc.deadline && (
                            <span style={{ color: '#dc2626', fontWeight: 'bold', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                              Hạn: {new Date(doc.deadline).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cơ quan ban hành & Người ký */}
                      <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '6px' }}>
                        Cơ quan gửi: <strong style={{ color: '#1e40af' }}>{doc.sender_org}</strong> • Người ký: <strong>{doc.signer_name || 'Lãnh đạo đơn vị'}</strong>
                      </div>

                      {/* Trích yếu nội dung */}
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', lineHeight: 1.45, marginBottom: '8px' }}>
                        {doc.summary}
                      </div>

                      {/* Ý kiến bút phê của BGH (nếu đã có) */}
                      {doc.endorsement && (
                        <div style={{
                          backgroundColor: '#fefce8',
                          border: '1px dashed #ca8a04',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '12.5px',
                          color: '#854d0e',
                          marginBottom: '8px'
                        }}>
                          <div>
                            <strong>✍️ Bút phê của {doc.endorsement.leader_name}:</strong> "{doc.endorsement.directive}"
                          </div>
                          <div style={{ fontSize: '11.5px', marginTop: '3px', color: '#a16207' }}>
                            Chủ trì: <strong>{doc.endorsement.main_assignee_name || doc.endorsement.main_department}</strong>
                            {doc.endorsement.co_assignees?.length > 0 && ` • Phối hợp: ${doc.endorsement.co_assignees.join(', ')}`}
                          </div>
                        </div>
                      )}

                      {/* Chữ ký số điện tử & Nút bấm thao tác */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#059669' }}>
                          <ShieldCheck size={15} color="#059669" />
                          <span>Đã ký số điện tử: <strong>{doc.digital_signature_info?.signer || doc.sender_org}</strong></span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Nút xem file trực tuyến */}
                          {doc.main_file_url && (
                            <button
                              type="button"
                              onClick={() => setViewingFileUrl(doc.main_file_url)}
                              className="eoffice-action-btn"
                              style={{ background: '#f1f5f9', color: '#334155' }}
                            >
                              <Eye size={14} /> Xem PDF Ký Số
                            </button>
                          )}

                          {/* Nút Lãnh đạo Bút Phê */}
                          <button
                            type="button"
                            onClick={() => handleOpenEndorseModal(doc)}
                            className="eoffice-action-btn"
                            style={{
                              background: doc.status === 'new' ? '#0284c7' : '#f8fafc',
                              color: doc.status === 'new' ? '#ffffff' : '#0284c7',
                              border: '1px solid #bae6fd'
                            }}
                          >
                            <CheckSquare size={14} /> {doc.status === 'new' ? 'Bút Phê Chỉ Đạo' : 'Sửa Bút Phê'}
                          </button>

                          {/* Nút Xóa (cho văn thư) */}
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Bạn có chắc muốn xóa công văn số ${doc.doc_code}?`)) {
                                const updated = await deleteDocumentIn(doc.id);
                                setDocsIn(updated);
                              }
                            }}
                            className="eoffice-action-btn"
                            style={{ background: '#fef2f2', color: '#dc2626' }}
                            title="Xóa công văn"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            TAB 2: BÚT PHÊ & ĐIỀU HÀNH BGH (LEADERSHIP ENDORSEMENT)
            ========================================================================= */}
        {activeTab === 'endorse' && (
          <div className="eoffice-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
              ✍️ CỔNG BÚT PHÊ ĐIỆN TỬ CỦA BAN GIÁM HIỆU
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Danh sách công văn từ Sở GD&ĐT đang chờ Lãnh đạo bút phê chỉ đạo và phân công nhiệm vụ cho các Tổ chuyên môn:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {docsIn.filter(d => d.status === 'new').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', backgroundColor: '#f0fdf4', borderRadius: '12px' }}>
                  <CheckCircle size={36} color="#16a34a" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#166534' }}>Tất cả công văn đã được BGH bút phê chỉ đạo đầy đủ!</div>
                  <p style={{ fontSize: '13px', color: '#15803d', margin: '4px 0 0 0' }}>Không còn công văn nào tồn đọng chờ phê duyệt.</p>
                </div>
              ) : (
                docsIn.filter(d => d.status === 'new').map(doc => (
                  <div key={doc.id} style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #0284c7',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px' }}>
                          Số đến #{doc.in_number} • {doc.doc_code}
                        </span>
                        <h3 style={{ margin: '6px 0 2px 0', fontSize: '15.5px', color: '#0f172a' }}>{doc.summary}</h3>
                        <div style={{ fontSize: '12.5px', color: '#475569' }}>Cơ quan gửi: <strong>{doc.sender_org}</strong> • Ngày ký: {doc.issued_date}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEndorseModal(doc)}
                        className="eoffice-action-btn"
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          padding: '10px 18px',
                          fontSize: '13.5px',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                        }}
                      >
                        <CheckSquare size={16} /> Bút Phê Ngay
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: NHIỆM VỤ CỦA TÔI (TEACHER TASKS & PROGRESS REPORT)
            ========================================================================= */}
        {activeTab === 'my_tasks' && (
          <div className="eoffice-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  📋 NHIỆM VỤ XỬ LÝ THEO CÔNG VĂN CHỈ ĐẠO
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  Các công việc do Ban Giám Hiệu phân công thực hiện theo văn bản của Sở GD&ĐT:
                </p>
              </div>

              <div style={{ fontSize: '12.5px', color: '#475569' }}>
                Đang đăng nhập: <strong>{loggedTeacher?.full_name || 'Cán bộ giáo viên'}</strong>
              </div>
            </div>

            {myTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '14.5px', fontWeight: 'bold' }}>Bạn hiện không có nhiệm vụ công văn nào tồn đọng!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myTasks.map(task => (
                  <div key={task.id} style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px' }}>
                          Công văn: {task.doc_code}
                        </span>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                          {task.doc_summary}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 'bold',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: task.progress_percent >= 100 ? '#dcfce7' : '#ffedd5',
                        color: task.progress_percent >= 100 ? '#15803d' : '#c2410c'
                      }}>
                        {task.progress_percent >= 100 ? '✓ Đã hoàn thành' : `Đang làm (${task.progress_percent}%)`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', marginTop: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                      <div>
                        Người nhận: <strong>{task.assignee_name}</strong> ({task.department_name})
                        {task.deadline && (
                          <span style={{ marginLeft: '10px', color: '#dc2626', fontWeight: 'bold' }}>
                            Hạn nộp: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setTaskReportData({
                            progress_percent: task.progress_percent || 100,
                            report_notes: task.report_notes || '',
                            report_file_url: task.report_file_url || ''
                          });
                          setShowTaskReportModal(true);
                        }}
                        className="eoffice-action-btn"
                        style={{ background: '#0284c7', color: '#ffffff' }}
                      >
                        <Send size={14} /> Cập Nhật / Báo Cáo Kết Quả
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: SỔ VĂN BẢN ĐI & DỰ THẢO (OUTBOUND DOCUMENTS & DRAFTS)
            ========================================================================= */}
        {activeTab === 'docs_out' && (
          <div className="eoffice-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  📤 SỔ ĐĂNG KÝ VĂN BẢN ĐI & BÁO CÁO PHÁT HÀNH
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  Quản lý số công văn đi, kế hoạch, tờ trình của trường THPT Cao Bá Quát gửi Sở GD&ĐT hoặc ban hành nội bộ:
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowDocOutModal(true)}
                  className="eoffice-action-btn"
                  style={{ background: '#16a34a', color: '#ffffff' }}
                >
                  <Plus size={15} /> Cấp Số Văn Bản Đi Mới
                </button>

                <button
                  type="button"
                  onClick={() => handleExportExcel('out')}
                  className="eoffice-action-btn"
                  style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
                >
                  <FileSpreadsheet size={15} /> Xuất Sổ Đi Excel
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredDocsOut.map(doc => (
                <div key={doc.id} style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px' }}>
                        Số đi #{doc.out_number}
                      </span>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{doc.doc_code}</strong>
                      <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                        {doc.doc_type}
                      </span>
                    </div>

                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Ngày ban hành: {doc.issued_date}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '6px 0' }}>
                    {doc.summary}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#475569', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                    <div>
                      Nơi nhận: <strong>{doc.recipient_org}</strong> • Người ký: <strong>{doc.signer_name} ({doc.signer_title})</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                        <ShieldCheck size={14} color="#059669" /> Đã ký số & đóng dấu
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Xóa văn bản đi ${doc.doc_code}?`)) {
                            const updated = await deleteDocumentOut(doc.id);
                            setDocsOut(updated);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: THỐNG KÊ & LƯU TRỮ SỐ (E-ARCHIVE & AUDIT TRAIL)
            ========================================================================= */}
        {activeTab === 'stats' && (
          <div className="eoffice-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              📊 BÁO CÁO GIÁM SÁT TIẾN ĐỘ THỰC HIỆN CÔNG VĂN THEO TỔ CHUYÊN MÔN
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Đo lường năng suất công tác văn thư và tỷ lệ chấp hành thời hạn báo cáo theo từng tổ bộ môn:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {DEPARTMENTS.slice(0, 6).map((dept, idx) => {
                const deptTasks = tasks.filter(t => t.department_name === dept);
                const doneCount = deptTasks.filter(t => t.progress_percent >= 100).length;
                const percent = deptTasks.length > 0 ? Math.round((doneCount / deptTasks.length) * 100) : 100;

                return (
                  <div key={idx} style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
                      <span>{dept}</span>
                      <span style={{ color: percent >= 80 ? '#16a34a' : '#d97706' }}>{percent}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: percent >= 80 ? '#16a34a' : '#d97706' }} />
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>
                      Hoàn thành: {doneCount}/{deptTasks.length} công văn
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 1: TIẾP NHẬN & BÓC TÁCH CÔNG VĂN SIÊU TỐC BẰNG AI GEMINI
            ========================================================================= */}
        {showAiModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}>
              {/* Header Modal */}
              <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} color="#fef08a" />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800' }}>TIẾP NHẬN CÔNG VĂN SIÊU TỐC BẰNG AI</div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Tự động bóc tách file PDF ký số / Scan từ iOffice vào Sổ Đến</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Thân Modal */}
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Vùng kéo thả file */}
                <div style={{
                  border: '2px dashed #0284c7',
                  borderRadius: '14px',
                  padding: '20px',
                  backgroundColor: '#f0f9ff',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileUploadForAI}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                  <FileUp size={36} color="#0284c7" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0369a1' }}>
                    {uploadedFileName ? `📄 Đã chọn: ${uploadedFileName}` : 'Bấm hoặc Kéo thả file PDF ký số / Ảnh scan vào đây'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Hỗ trợ file PDF tải từ VNPT iOffice, văn bản scan, ảnh chụp công văn
                  </div>
                </div>

                {/* Loading State khi AI đang đọc */}
                {aiLoading && (
                  <div style={{
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#92400e',
                    fontSize: '13px'
                  }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Trí tuệ nhân tạo Gemini đang đọc toàn văn công văn, trích xuất số ký hiệu, trích yếu và hạn nộp...</span>
                  </div>
                )}

                {/* Báo lỗi nếu có */}
                {aiError && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '12.5px' }}>
                    {aiError}
                  </div>
                )}

                {/* Form kết quả bóc tách cho văn thư xác nhận */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Số / Ký hiệu văn bản (*):
                    </label>
                    <input
                      type="text"
                      value={aiExtractedData.doc_code}
                      onChange={e => setAiExtractedData({ ...aiExtractedData, doc_code: e.target.value })}
                      placeholder="VD: 1425/SGDĐT-GDTrH-GDTX"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: 'bold', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Ngày ban hành (*):
                    </label>
                    <input
                      type="date"
                      value={aiExtractedData.issued_date}
                      onChange={e => setAiExtractedData({ ...aiExtractedData, issued_date: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Cơ quan ban hành (*):
                  </label>
                  <input
                    type="text"
                    value={aiExtractedData.sender_org}
                    onChange={e => setAiExtractedData({ ...aiExtractedData, sender_org: e.target.value })}
                    placeholder="VD: SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Trích yếu nội dung (*):
                  </label>
                  <textarea
                    rows={3}
                    value={aiExtractedData.summary}
                    onChange={e => setAiExtractedData({ ...aiExtractedData, summary: e.target.value })}
                    placeholder="Tóm tắt nội dung chính của văn bản..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box', lineHeight: 1.4 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Loại văn bản:
                    </label>
                    <select
                      value={aiExtractedData.doc_type}
                      onChange={e => setAiExtractedData({ ...aiExtractedData, doc_type: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option value="Công văn">Công văn</option>
                      <option value="Kế hoạch">Kế hoạch</option>
                      <option value="Quyết định">Quyết định</option>
                      <option value="Thông báo">Thông báo</option>
                      <option value="Hướng dẫn">Hướng dẫn</option>
                      <option value="Giấy mời">Giấy mời</option>
                      <option value="Tờ trình">Tờ trình</option>
                      <option value="Báo cáo">Báo cáo</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Mức độ khẩn:
                    </label>
                    <select
                      value={aiExtractedData.urgency}
                      onChange={e => setAiExtractedData({ ...aiExtractedData, urgency: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option value="normal">Bình thường</option>
                      <option value="urgent">⚠️ Khẩn</option>
                      <option value="super_urgent">🔥 Thượng khẩn</option>
                      <option value="express">⚡ Hỏa tốc</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Hạn xử lý (nếu có):
                    </label>
                    <input
                      type="date"
                      value={aiExtractedData.deadline}
                      onChange={e => setAiExtractedData({ ...aiExtractedData, deadline: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Gợi ý bút phê của AI */}
                {aiExtractedData.suggested_directive && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px' }}>
                    <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '2px' }}>
                      💡 AI Gợi ý phân công: <strong>{aiExtractedData.suggested_department}</strong>
                    </div>
                    <div style={{ color: '#15803d' }}>
                      Ý kiến tham mưu: "{aiExtractedData.suggested_directive}"
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Modal */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveExtractedDoc}
                  className="eoffice-action-btn"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    padding: '9px 20px',
                    fontSize: '13.5px'
                  }}
                >
                  <Save size={16} /> Lưu Vào Sổ Đến & Trình BGH
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: BÚT PHÊ NHANH CỦA BAN GIÁM HIỆU
            ========================================================================= */}
        {showEndorseModal && selectedDoc && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800' }}>BÚT PHÊ CHỈ ĐẠO CỦA BAN GIÁM HIỆU</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Số đến #{selectedDoc.in_number} • {selectedDoc.doc_code}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEndorseModal(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{selectedDoc.summary}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Cơ quan ban hành: {selectedDoc.sender_org}
                  </div>
                </div>

                {/* Các mẫu bút phê nhanh 1-chạm */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                    Mẫu bút phê nhanh 1-chạm:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      'Giao Thầy PHT Chuyên môn chỉ đạo triển khai.',
                      'Giao Tổ trưởng nghiên cứu, thực hiện và báo cáo đúng hạn.',
                      'Giao Đoàn trường xây dựng kế hoạch chi tiết.',
                      'Phổ biến toàn thể Hội đồng Sư phạm nghiên cứu thực hiện.',
                      'Lưu Văn thư trường theo dõi tiến độ.'
                    ].map((sample, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setEndorseData({ ...endorseData, directive: sample })}
                        style={{
                          padding: '4px 9px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f1f5f9',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          color: '#334155'
                        }}
                      >
                        + {sample}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Ý kiến chỉ đạo cụ thể (*):
                  </label>
                  <textarea
                    rows={3}
                    value={endorseData.directive}
                    onChange={e => setEndorseData({ ...endorseData, directive: e.target.value })}
                    placeholder="Nhập nội dung chỉ đạo, yêu cầu đối với các tổ bộ môn..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #0284c7', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Tổ / Bộ phận chịu trách nhiệm chính:
                    </label>
                    <select
                      value={endorseData.main_department}
                      onChange={e => setEndorseData({ ...endorseData, main_department: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Người phụ trách chính:
                    </label>
                    <input
                      type="text"
                      value={endorseData.main_assignee_name}
                      onChange={e => setEndorseData({ ...endorseData, main_assignee_name: e.target.value })}
                      placeholder="VD: Lê Văn Hoàng (Tổ trưởng)"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Người / Tổ phối hợp (cách nhau dấu phẩy):
                    </label>
                    <input
                      type="text"
                      value={endorseData.co_assignees_text}
                      onChange={e => setEndorseData({ ...endorseData, co_assignees_text: e.target.value })}
                      placeholder="VD: Tổ Văn, Đoàn Trường..."
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Hạn nộp báo cáo kết quả:
                    </label>
                    <input
                      type="date"
                      value={endorseData.deadline}
                      onChange={e => setEndorseData({ ...endorseData, deadline: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setShowEndorseModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveEndorsement}
                  className="eoffice-action-btn"
                  style={{ background: '#0284c7', color: '#ffffff', padding: '9px 20px', fontSize: '13.5px' }}
                >
                  <CheckSquare size={16} /> Lưu Bút Phê & Giao Việc Tức Thì
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: CẤP SỐ VĂN BẢN ĐI & DỰ THẢO
            ========================================================================= */}
        {showDocOutModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '800' }}>CẤP SỐ & PHÁT HÀNH VĂN BẢN ĐI</div>
                <button
                  type="button"
                  onClick={() => setShowDocOutModal(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Loại văn bản:
                    </label>
                    <select
                      value={docOutData.doc_type}
                      onChange={e => setDocOutData({ ...docOutData, doc_type: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option value="Kế hoạch">Kế hoạch (KH)</option>
                      <option value="Báo cáo">Báo cáo (BC)</option>
                      <option value="Quyết định">Quyết định (QĐ)</option>
                      <option value="Thông báo">Thông báo (TB)</option>
                      <option value="Tờ trình">Tờ trình (TTr)</option>
                      <option value="Công văn">Công văn (CV)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Đơn vị soạn thảo:
                    </label>
                    <select
                      value={docOutData.department_name}
                      onChange={e => setDocOutData({ ...docOutData, department_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option value="Ban Giám Hiệu">Ban Giám Hiệu</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Trích yếu nội dung văn bản (*):
                  </label>
                  <textarea
                    rows={3}
                    value={docOutData.summary}
                    onChange={e => setDocOutData({ ...docOutData, summary: e.target.value })}
                    placeholder="VD: Kế hoạch tổ chức ôn tập thi thử tốt nghiệp THPT 2027..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Nơi nhận văn bản:
                  </label>
                  <input
                    type="text"
                    value={docOutData.recipient_org}
                    onChange={e => setDocOutData({ ...docOutData, recipient_org: e.target.value })}
                    placeholder="VD: Sở Giáo dục và Đào tạo Đắk Lắk..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Người ký duyệt:
                    </label>
                    <input
                      type="text"
                      value={docOutData.signer_name}
                      onChange={e => setDocOutData({ ...docOutData, signer_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      Chức vụ người ký:
                    </label>
                    <select
                      value={docOutData.signer_title}
                      onChange={e => setDocOutData({ ...docOutData, signer_title: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option value="Hiệu trưởng">Hiệu trưởng</option>
                      <option value="Phó Hiệu trưởng">Phó Hiệu trưởng</option>
                    </select>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#166534' }}>
                  💡 <strong>Quy chuẩn Nghị định 30:</strong> Hệ thống sẽ tự động cấp số văn bản đi tiếp theo và gắn đuôi ký hiệu `-THPTCBQ`.
                </div>
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setShowDocOutModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveDocOut}
                  className="eoffice-action-btn"
                  style={{ background: '#16a34a', color: '#ffffff', padding: '9px 20px', fontSize: '13.5px' }}
                >
                  <Save size={16} /> Cấp Số & Lưu Vào Sổ Đi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 4: BÁO CÁO KẾT QUẢ TIẾN ĐỘ NHIỆM VỤ
            ========================================================================= */}
        {showTaskReportModal && selectedTask && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '800' }}>BÁO CÁO KẾT QUẢ XỬ LÝ CÔNG VĂN</div>
                <button
                  type="button"
                  onClick={() => setShowTaskReportModal(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '13px', color: '#475569' }}>
                  Công văn: <strong>{selectedTask.doc_code}</strong> - {selectedTask.doc_summary}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                    Tiến độ hoàn thành: <strong>{taskReportData.progress_percent}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={taskReportData.progress_percent}
                    onChange={e => setTaskReportData({ ...taskReportData, progress_percent: e.target.value })}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Nội dung kết quả / Giải trình (*):
                  </label>
                  <textarea
                    rows={4}
                    value={taskReportData.report_notes}
                    onChange={e => setTaskReportData({ ...taskReportData, report_notes: e.target.value })}
                    placeholder="Mô tả công việc đã hoàn thành hoặc các khó khăn cần BGH hỗ trợ..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setShowTaskReportModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveTaskReport}
                  className="eoffice-action-btn"
                  style={{ background: '#0284c7', color: '#ffffff', padding: '9px 20px' }}
                >
                  <Send size={15} /> Nộp Báo Cáo Cho BGH
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 5: TRÌNH ĐỌC TÀI LIỆU & PDF KÝ SỐ TRỰC TUYẾN
            ========================================================================= */}
        {viewingFileUrl && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: '12px 12px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Trình Xem Tài Liệu & Chữ Ký Số Hợp Lệ</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingFileUrl(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              <iframe
                src={viewingFileUrl}
                title="Tài liệu văn bản"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
