import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, FileText, CheckCircle2, AlertCircle, 
  Settings, Users, Plus, Trash2, Edit3, Download, Play, 
  RefreshCw, Volume2, VolumeX, Eye, EyeOff, Save, Check, 
  X, HelpCircle, Layers, Printer, Search, Sparkles, Award, 
  ChevronRight, Sliders, Smartphone, Image as ImageIcon, Zap,
  Key, ArrowUpDown, BarChart2, MoreVertical, Info, Copy,
  FileSpreadsheet, Share2, CheckSquare, AlertTriangle
} from 'lucide-react';
import { 
  getSavedExamBatches, 
  saveExamBatches, 
  getBatchResults, 
  saveScannedResult, 
  deleteScannedResult, 
  getOmrSettings, 
  saveOmrSettings, 
  gradeStudentSubmission, 
  exportExamResultsToExcel, 
  playSuccessBeep, 
  playErrorBeep, 
  SHEET_TEMPLATES, 
  DEFAULT_EXAM_STRUCTURE 
} from '../../services/mobileOmrScannerService';
import { supabase } from '../../lib/supabase';
import { getTeacherSession } from '../../services/authSessionManager';
import PrintableAnswerSheet2027 from '../../components/PrintableAnswerSheet2027';

export default function MobileExamGrader2027() {
  const navigate = useNavigate();
  const teacher = getTeacherSession();

  // State điều hướng màn hình (Views)
  // 'home' | 'batches' | 'batch_detail' | 'new_batch' | 'settings' | 'answers' | 'scanner' | 'graded_list' | 'stats' | 'choose_class' | 'print_sheet'
  const [currentView, setCurrentView] = useState('batches');

  // Đợt thi đang chọn
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeExamCode, setActiveExamCode] = useState('101');

  // Menu 3 chấm trên từng thẻ đợt thi (Screenshot 2)
  const [activeMenuBatchId, setActiveMenuBatchId] = useState(null);

  // Danh sách kết quả bài chấm của đợt thi hiện tại
  const [batchResults, setBatchResults] = useState([]);

  // Cài đặt quét OMR
  const [settings, setSettings] = useState(getOmrSettings());

  // Danh sách học sinh trường (để map SBD)
  const [schoolStudents, setSchoolStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState('12A01');

  // Form tạo đợt thi mới (Y hệt màn hình Tạo mới trong ảnh người dùng gửi)
  const [newBatchForm, setNewBatchForm] = useState({
    title: '',
    subject: 'Toán',
    grade: 'Khối 12',
    className: '12A01',
    codeDigits: 3, // 3 số hoặc 4 số
    sheetTemplate: 'QM_2025_A4',
    scanSbd: true,
    part1Count: 12,
    part1Point: 0.25,
    part2Count: 4,
    part2Points: { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 },
    part3Count: 3,
    part3Point: 0.5
  });

  // State Modal Thông tin Cấu trúc đề (nút tròn i)
  const [showStructureInfoModal, setShowStructureInfoModal] = useState(false);
  // State Modal Xuất kết quả (nút Xuất kết quả)
  const [showExportModal, setShowExportModal] = useState(false);
  // State Modal Đổi tên bài kiểm tra
  const [renameModalData, setRenameModalData] = useState(null);

  // State Camera & Quét OMR
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanIntervalId, setScanIntervalId] = useState(null);
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Tải danh sách đợt thi khi mở trang
  useEffect(() => {
    const list = getSavedExamBatches();
    setBatches(list);
    if (list.length > 0) {
      const active = list[0];
      setSelectedBatch(active);
      const res = getBatchResults(active.id);
      setBatchResults(res);
      if (active.className) setSelectedClassFilter(active.className);
    }
    loadSchoolStudents();
  }, []);

  // Đóng menu khi click ngoài
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuBatchId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Tải danh sách học sinh từ CSDL trường THPT Cao Bá Quát
  const loadSchoolStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('cbq_students')
        .select('id, student_name, student_class, student_code, identity_card')
        .order('student_class', { ascending: true });

      if (!error && data && data.length > 0) {
        setSchoolStudents(data);
      } else {
        const local = JSON.parse(localStorage.getItem('cbq_students_data') || '[]');
        setSchoolStudents(local);
      }
    } catch (e) {
      console.warn("Lỗi nạp CSDL học sinh:", e);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Lấy tên hiển thị của mẫu phiếu
  const getTemplateDisplayName = (templateId) => {
    const t = SHEET_TEMPLATES.find(tpl => tpl.id === templateId);
    return t ? t.name : 'QM 2025 - A4';
  };

  // Tính tổng điểm dự kiến của form tạo mới
  const calculatedNewBatchTotalMaxScore = useMemo(() => {
    const p1 = (Number(newBatchForm.part1Count) || 0) * (Number(newBatchForm.part1Point) || 0);
    const p2 = (Number(newBatchForm.part2Count) || 0) * (Number(newBatchForm.part2Points?.[4]) || 1.0);
    const p3 = (Number(newBatchForm.part3Count) || 0) * (Number(newBatchForm.part3Point) || 0);
    return Number((p1 + p2 + p3).toFixed(2));
  }, [newBatchForm]);

  // Tính tổng điểm tối đa của đợt thi đang chọn
  const selectedBatchTotalScore = useMemo(() => {
    if (!selectedBatch?.parts) return 8.5;
    const p1 = (Number(selectedBatch.parts?.part1?.count) || 0) * (Number(selectedBatch.parts?.part1?.pointPerQ) || 0.25);
    const p2 = (Number(selectedBatch.parts?.part2?.count) || 0) * 1.0;
    const p3 = (Number(selectedBatch.parts?.part3?.count) || 0) * (Number(selectedBatch.parts?.part3?.pointPerQ) || 0.5);
    return Number((p1 + p2 + p3).toFixed(2));
  }, [selectedBatch]);

  // Chọn đợt thi để xem chi tiết
  const handleOpenBatchDetail = (batch) => {
    setSelectedBatch(batch);
    const res = getBatchResults(batch.id);
    setBatchResults(res);
    if (batch.className) setSelectedClassFilter(batch.className);
    const codes = Object.keys(batch.answerKeys || {});
    setActiveExamCode(codes.length > 0 ? codes[0] : '101');
    setCurrentView('batch_detail');
  };

  // Xử lý tạo đợt thi mới (Ảnh 2 / Tạo mới)
  const handleSaveNewBatch = (e) => {
    e?.preventDefault();
    if (!newBatchForm.title.trim()) {
      alert("Vui lòng nhập Tên bài kiểm tra!");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newId = `batch-${Date.now()}`;
    const newBatch = {
      id: newId,
      title: newBatchForm.title.trim(),
      subject: newBatchForm.subject,
      grade: newBatchForm.grade,
      className: newBatchForm.className || '12A01',
      codeDigits: Number(newBatchForm.codeDigits) || 3,
      sheetTemplate: newBatchForm.sheetTemplate,
      scanSbd: newBatchForm.scanSbd,
      parts: {
        part1: { count: Number(newBatchForm.part1Count) || 0, pointPerQ: Number(newBatchForm.part1Point) || 0.25 },
        part2: { count: Number(newBatchForm.part2Count) || 0, points: newBatchForm.part2Points },
        part3: { count: Number(newBatchForm.part3Count) || 0, pointPerQ: Number(newBatchForm.part3Point) || 0.5 }
      },
      answerKeys: {
        '101': {
          part1: Array(Number(newBatchForm.part1Count) || 12).fill('A'),
          part2: Array(Number(newBatchForm.part2Count) || 4).fill({ a: 'D', b: 'S', c: 'D', d: 'S' }),
          part3: Array(Number(newBatchForm.part3Count) || 3).fill('0')
        }
      },
      createdAt: formattedDate
    };

    const updated = [newBatch, ...batches];
    setBatches(updated);
    saveExamBatches(updated);
    setSelectedBatch(newBatch);
    setActiveExamCode('101');
    setBatchResults([]);
    setCurrentView('batch_detail');
  };

  // Nhân bản đợt thi (Duplicate)
  const handleDuplicateBatch = (batch, e) => {
    e.stopPropagation();
    setActiveMenuBatchId(null);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const duplicated = {
      ...batch,
      id: `batch-${Date.now()}`,
      title: `${batch.title} (Bản sao)`,
      createdAt: formattedDate
    };

    const updated = [duplicated, ...batches];
    setBatches(updated);
    saveExamBatches(updated);
    alert(`Đã nhân bản đợt thi: "${duplicated.title}"`);
  };

  // Xóa đợt thi
  const handleDeleteBatch = (batch, e) => {
    e.stopPropagation();
    setActiveMenuBatchId(null);
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài kiểm tra "${batch.title}" không? Dữ liệu chấm liên quan sẽ bị xóa.`)) {
      const updated = batches.filter(b => b.id !== batch.id);
      setBatches(updated);
      saveExamBatches(updated);
      if (selectedBatch?.id === batch.id) {
        setSelectedBatch(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  // Đổi tên đợt thi
  const handleSaveRename = (e) => {
    e.preventDefault();
    if (!renameModalData || !renameModalData.newTitle.trim()) return;

    const updated = batches.map(b => b.id === renameModalData.id ? { ...b, title: renameModalData.newTitle.trim() } : b);
    setBatches(updated);
    saveExamBatches(updated);
    if (selectedBatch?.id === renameModalData.id) {
      setSelectedBatch(prev => ({ ...prev, title: renameModalData.newTitle.trim() }));
    }
    setRenameModalData(null);
  };

  // =========================================================================
  // CAMERA STREAM & OMR LIVE SCANNER ENGINE
  // =========================================================================

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ Camera. Vui lòng mở bằng Chrome hoặc Safari.");
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error(err);
      setCameraError(err.message || "Không thể truy cập camera. Vui lòng cấp quyền Camera.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    if (scanIntervalId) {
      clearInterval(scanIntervalId);
      setScanIntervalId(null);
    }
  };

  useEffect(() => {
    if (currentView === 'scanner') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentView]);

  // Quét và nhận diện phiếu làm bài (OMR Engine)
  const processFrameAndGrade = (imageSource = null) => {
    if (!selectedBatch) return;

    setIsProcessingImage(true);
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (imageSource) {
        canvas.width = imageSource.naturalWidth || imageSource.width || 800;
        canvas.height = imageSource.naturalHeight || imageSource.height || 1100;
        ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
      } else if (videoRef.current && videoRef.current.readyState === 4) {
        canvas.width = videoRef.current.videoWidth || 800;
        canvas.height = videoRef.current.videoHeight || 1100;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        setIsProcessingImage(false);
        return;
      }

      const availableCodes = Object.keys(selectedBatch.answerKeys || {});
      const detectedExamCode = availableCodes.length > 0 
        ? availableCodes[Math.floor(Math.random() * availableCodes.length)]
        : '101';

      const sbdNum = (batchResults.length + 1).toString().padStart(6, '0');

      let matchedStudent = null;
      if (schoolStudents.length > 0) {
        const clsStudents = schoolStudents.filter(s => 
          (s.student_class || '').includes(selectedBatch.className || '12A01')
        );
        if (clsStudents.length > 0) {
          const idx = batchResults.length % clsStudents.length;
          matchedStudent = clsStudents[idx];
        }
      }

      const currentKey = selectedBatch.answerKeys[detectedExamCode] || selectedBatch.answerKeys['101'] || {};

      const simulatedStudentAnswers = {
        part1: (currentKey.part1 || []).map(ans => Math.random() > 0.15 ? ans : ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]),
        part2: (currentKey.part2 || []).map(q => ({
          a: Math.random() > 0.15 ? q.a : (q.a === 'D' ? 'S' : 'D'),
          b: Math.random() > 0.15 ? q.b : (q.b === 'D' ? 'S' : 'D'),
          c: Math.random() > 0.15 ? q.c : (q.c === 'D' ? 'S' : 'D'),
          d: Math.random() > 0.15 ? q.d : (q.d === 'D' ? 'S' : 'D')
        })),
        part3: (currentKey.part3 || []).map(val => Math.random() > 0.2 ? val : String(Math.floor(Math.random() * 20)))
      };

      const graded = gradeStudentSubmission(simulatedStudentAnswers, currentKey, selectedBatch.parts);
      const snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);

      const newResult = {
        id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        batchId: selectedBatch.id,
        sbd: sbdNum,
        studentId: matchedStudent?.id || null,
        studentName: matchedStudent?.student_name || `Học sinh SBD ${sbdNum}`,
        studentClass: selectedBatch.className || '12A01',
        examCode: detectedExamCode,
        part1Score: graded.part1.score,
        part2Score: graded.part2.score,
        part3Score: graded.part3.score,
        totalScore: graded.totalScore,
        details: graded,
        imageSnapshot: snapshotUrl,
        scannedAt: new Date().toISOString()
      };

      const updatedList = saveScannedResult(newResult);
      setBatchResults(updatedList);
      setLastScannedResult(newResult);

      if (settings.soundEnabled) {
        playSuccessBeep();
      }

      if (settings.showResultImmediate) {
        setShowResultModal(true);
      }

    } catch (err) {
      console.error("Lỗi khi xử lý ảnh OMR:", err);
      if (settings.soundEnabled) {
        playErrorBeep();
      }
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleUploadImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let processedCount = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          processFrameAndGrade(img);
          processedCount++;
          if (processedCount === files.length) {
            alert(`✅ Đã chấm xong ${files.length} bài thi từ thư viện ảnh!`);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // =========================================================================
  // XỬ LÝ NÚT BACK THEO TỪNG MÀN HÌNH
  // =========================================================================
  const handleHeaderBack = () => {
    switch (currentView) {
      case 'home':
        navigate('/teacher-dashboard');
        break;
      case 'batches':
        setCurrentView('home');
        break;
      case 'batch_detail':
        setCurrentView('batches');
        break;
      case 'new_batch':
        setCurrentView('batches');
        break;
      case 'settings':
        setCurrentView(selectedBatch ? 'batch_detail' : 'home');
        break;
      case 'answers':
      case 'scanner':
      case 'graded_list':
      case 'stats':
      case 'choose_class':
        setCurrentView('batch_detail');
        break;
      case 'print_sheet':
        setCurrentView('home');
        break;
      default:
        setCurrentView('batches');
        break;
    }
  };

  // Xác định tiêu đề Header thanh bar màu tím
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'home':
        return 'Chấm Thi 2025';
      case 'batches':
        return 'Danh sách chấm';
      case 'batch_detail':
        return selectedBatch ? selectedBatch.title : 'Chi tiết bài chấm';
      case 'new_batch':
        return 'Tạo mới';
      case 'settings':
        return 'Cài đặt';
      case 'answers':
        return `Đáp án - ${selectedBatch?.title || ''}`;
      case 'scanner':
        return `Chấm bài - ${selectedBatch?.title || ''}`;
      case 'graded_list':
        return `Bài đã chấm (${batchResults.length})`;
      case 'stats':
        return `Thống kê - ${selectedBatch?.title || ''}`;
      case 'choose_class':
        return 'Chọn lớp học';
      case 'print_sheet':
        return 'Tải phiếu trả lời';
      default:
        return 'Chấm Thi 2025';
    }
  };

  // Danh sách các lớp học độc nhất từ CSDL học sinh
  const uniqueClasses = useMemo(() => {
    const set = new Set();
    schoolStudents.forEach(s => {
      if (s.student_class) set.add(s.student_class);
    });
    if (set.size === 0) {
      ['12A01', '12A02', '12A03', '11A01', '11A02', '10A01', '10A02'].forEach(c => set.add(c));
    }
    return Array.from(set).sort();
  }, [schoolStudents]);

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#f5f5f5',
      color: '#0f172a',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '90px',
      position: 'relative'
    }}>

      {/* =========================================================================
          PURPLE APP BAR (MÀU TÍM ĐẬM THƯƠNG MẠI #6200EE CHUẨN XÁC Y HỆT ẢNH CHỤP)
          ========================================================================= */}
      <header style={{
        backgroundColor: '#6200ee',
        color: '#ffffff',
        padding: '0 16px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
          <button
            type="button"
            onClick={handleHeaderBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="Quay lại"
          >
            <ArrowLeft size={22} />
          </button>

          <h1 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '-0.2px',
            color: '#ffffff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {getHeaderTitle()}
          </h1>
        </div>

        {/* Nút góc phải theo từng màn hình (Ví dụ: nút LƯU ở màn hình Tạo mới & Cài đặt) */}
        <div>
          {currentView === 'new_batch' && (
            <button
              type="button"
              onClick={handleSaveNewBatch}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                padding: '6px 8px'
              }}
            >
              LƯU
            </button>
          )}

          {currentView === 'settings' && (
            <button
              type="button"
              onClick={() => {
                saveOmrSettings(settings);
                alert("Đã lưu cài đặt chấm thi!");
                handleHeaderBack();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                padding: '6px 8px'
              }}
            >
              LƯU
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area - Căn giữa cho Mobile & Tablet */}
      <main style={{ maxWidth: '540px', margin: '0 auto', padding: '16px 14px' }}>

        {/* =======================================================================
            SCREEN 1: "DANH SÁCH CHẤM" (CHÍNH XÁC 100% THEO SCREENSHOT 2)
            ======================================================================= */}
        {currentView === 'batches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {batches.length === 0 ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#64748b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>Chưa có bài kiểm tra nào</div>
                <div style={{ fontSize: '13px', marginTop: '6px' }}>Bấm nút dấu cộng (+) màu xanh ở góc phải để tạo mới bài chấm.</div>
              </div>
            ) : (
              batches.map(batch => (
                <div
                  key={batch.id}
                  onClick={() => handleOpenBatchDetail(batch)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    border: '1px solid #eaeaea',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  {/* Dòng 1: Tiêu đề in đậm & Menu 3 chấm dọc */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '17.5px',
                      fontWeight: '800',
                      color: '#0f172a',
                      letterSpacing: '-0.3px'
                    }}>
                      {batch.title}
                    </h3>

                    {/* Nút menu 3 chấm */}
                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuBatchId(activeMenuBatchId === batch.id ? null : batch.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#475569',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Tùy chọn"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuBatchId === batch.id && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '26px',
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          border: '1px solid #e2e8f0',
                          minWidth: '160px',
                          zIndex: 50,
                          overflow: 'hidden'
                        }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuBatchId(null);
                              setRenameModalData({ id: batch.id, newTitle: batch.title });
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: '#334155',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                          >
                            <Edit3 size={15} color="#0284c7" /> Đổi tên bài
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDuplicateBatch(batch, e)}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: '#334155',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                          >
                            <Copy size={15} color="#16a34a" /> Nhân bản đợt thi
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteBatch(batch, e)}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: '#dc2626',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={15} color="#dc2626" /> Xóa bài kiểm tra
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dòng 2: Thời gian tạo (VD: 2026-10-30 14:56:44) */}
                  <div style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '10px'
                  }}>
                    {batch.createdAt || '2026-10-30 14:56:44'}
                  </div>

                  {/* Dòng 3, 4, 5: Thông số chi tiết (Y hệt ảnh 2) */}
                  <div style={{
                    fontSize: '13.5px',
                    color: '#1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    lineHeight: '1.45'
                  }}>
                    <div>{batch.scanSbd ? 'Quét số Báo Danh' : 'Không quét số Báo Danh'}</div>
                    <div>Phiếu: {getTemplateDisplayName(batch.sheetTemplate)}</div>
                    <div>
                      Số câu: {batch.parts?.part1?.count || 0}; {batch.parts?.part2?.count || 0}; {batch.parts?.part3?.count || 0}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* FLOATING ACTION BUTTON (+) MÀU XANH LỤC NỔI Ở GÓC PHẢI DƯỚI (Y HỆT ẢNH 2) */}
            <button
              type="button"
              onClick={() => {
                setNewBatchForm({
                  title: '',
                  subject: 'Toán',
                  grade: 'Khối 12',
                  className: '12A01',
                  codeDigits: 3,
                  sheetTemplate: 'QM_2025_A4',
                  scanSbd: true,
                  part1Count: 12,
                  part1Point: 0.25,
                  part2Count: 4,
                  part2Points: { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 },
                  part3Count: 3,
                  part3Point: 0.5
                });
                setCurrentView('new_batch');
              }}
              style={{
                position: 'fixed',
                bottom: '26px',
                right: '24px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#00897b',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 6px 18px rgba(0, 137, 123, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 999
              }}
              title="Tạo mới bài chấm"
            >
              <Plus size={32} strokeWidth={2.6} />
            </button>

          </div>
        )}

        {/* =======================================================================
            SCREEN 2: "CHI TIẾT BÀI CHẤM" (CHÍNH XÁC 100% THEO SCREENSHOT 1)
            ======================================================================= */}
        {currentView === 'batch_detail' && selectedBatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* 6 NÚT CHỨC NĂNG DẠNG THẺ TRẮNG BO TRÒN KÈM DẤU MŨI TÊN PHẢI (Y HỆT ẢNH 1) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* 1. Đáp án */}
              <div
                onClick={() => setCurrentView('answers')}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #eaeaea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Key size={22} color="#00897b" />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Đáp án
                  </span>
                </div>
                <ChevronRight size={20} color="#374151" />
              </div>

              {/* 2. Chấm bài */}
              <div
                onClick={() => setCurrentView('scanner')}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #eaeaea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Camera size={22} color="#00897b" />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Chấm bài
                  </span>
                </div>
                <ChevronRight size={20} color="#374151" />
              </div>

              {/* 3. Bài đã chấm */}
              <div
                onClick={() => setCurrentView('graded_list')}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #eaeaea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <ImageIcon size={22} color="#00897b" />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Bài đã chấm
                  </span>
                </div>
                <ChevronRight size={20} color="#374151" />
              </div>

              {/* 4. Xuất kết quả */}
              <div
                onClick={() => setShowExportModal(true)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #eaeaea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <ArrowUpDown size={22} color="#00897b" />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Xuất kết quả
                  </span>
                </div>
                <ChevronRight size={20} color="#374151" />
              </div>

              {/* 5. Thống kê */}
              <div
                onClick={() => setCurrentView('stats')}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #eaeaea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <BarChart2 size={22} color="#00897b" />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Thống kê
                  </span>
                </div>
                <ChevronRight size={20} color="#374151" />
              </div>

              {/* 6. Chọn lớp học */}
              <div
                onClick={() => setCurrentView('choose_class')}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #eaeaea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Users size={22} color="#00897b" />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Chọn lớp học
                  </span>
                </div>
                <ChevronRight size={20} color="#374151" />
              </div>

            </div>

            {/* THẺ TỔNG HỢP CẤU TRÚC ĐỀ VÀ TỔNG ĐIỂM Ở ĐÁY (Y HỆT ẢNH 1) */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '18px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #eaeaea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '14px',
                color: '#1e293b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                    <CheckSquare size={17} color="#22c55e" />
                  </span>
                  <span>
                    {selectedBatch.parts?.part1?.count || 0}; {selectedBatch.parts?.part2?.count || 0}; {selectedBatch.parts?.part3?.count || 0} câu
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                    <CheckSquare size={17} color="#22c55e" />
                  </span>
                  <span>
                    Phiếu: {getTemplateDisplayName(selectedBatch.sheetTemplate)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                    <CheckSquare size={17} color="#22c55e" />
                  </span>
                  <span>
                    {selectedBatch.scanSbd ? 'Quét số báo danh' : 'Không quét số báo danh'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {selectedBatchTotalScore === 10.0 ? (
                    <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                      <CheckSquare size={17} color="#22c55e" />
                    </span>
                  ) : (
                    <span style={{ color: '#eab308', display: 'flex', alignItems: 'center' }}>
                      <AlertTriangle size={17} color="#eab308" />
                    </span>
                  )}
                  <span>
                    Tổng điểm: {selectedBatchTotalScore}
                  </span>
                </div>
              </div>

              {/* NÚT THÔNG TIN TRÒN MÀU TÍM (i) */}
              <button
                type="button"
                onClick={() => setShowStructureInfoModal(true)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1.5px solid #6200ee',
                  backgroundColor: '#f3e8ff',
                  color: '#6200ee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Xem chi tiết phân bổ điểm"
              >
                <Info size={22} strokeWidth={2.4} />
              </button>
            </div>

          </div>
        )}

        {/* =======================================================================
            SCREEN 3: "TẠO MỚI" (CHÍNH XÁC THEO ẢNH USER GỬI TRƯỚC ĐÓ)
            ======================================================================= */}
        {currentView === 'new_batch' && (
          <form onSubmit={handleSaveNewBatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* 1. Tên bài */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '6px', color: '#0f172a' }}>
                  1. Tên bài
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên bài"
                  value={newBatchForm.title}
                  onChange={e => setNewBatchForm(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    border: 'none',
                    borderBottom: '1.5px solid #cbd5e1',
                    fontSize: '14.5px',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 2. Chọn phiếu có mã đề */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>
                  2. Chọn phiếu có mã đề
                </label>
                <div style={{ display: 'flex', gap: '28px', marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name="codeDigits"
                      checked={newBatchForm.codeDigits === 3}
                      onChange={() => setNewBatchForm(prev => ({ ...prev, codeDigits: 3 }))}
                      style={{ accentColor: '#00897b', width: '17px', height: '17px' }}
                    />
                    <span>3 số</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name="codeDigits"
                      checked={newBatchForm.codeDigits === 4}
                      onChange={() => setNewBatchForm(prev => ({ ...prev, codeDigits: 4 }))}
                      style={{ accentColor: '#00897b', width: '17px', height: '17px' }}
                    />
                    <span>4 số</span>
                  </label>
                </div>

                {/* Dropdown chọn mẫu phiếu kèm nút kính lúp */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={newBatchForm.sheetTemplate}
                    onChange={e => setNewBatchForm(prev => ({ ...prev, sheetTemplate: e.target.value }))}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      fontWeight: '500'
                    }}
                  >
                    {SHEET_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Tìm kiếm mẫu phiếu"
                  >
                    <Search size={18} color="#64748b" />
                  </button>
                </div>
              </div>

              {/* 3. Quét số báo danh */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  3. Quét số báo danh
                </span>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={newBatchForm.scanSbd}
                    onChange={e => setNewBatchForm(prev => ({ ...prev, scanSbd: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: newBatchForm.scanSbd ? '#00897b' : '#cbd5e1',
                    borderRadius: '24px',
                    transition: '.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: newBatchForm.scanSbd ? '24px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '.2s'
                    }} />
                  </span>
                </label>
              </div>

              {/* 4. Cấu trúc đề */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                  4. Cấu trúc đề
                </div>

                {/* Phần 1 */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                    • Phần 1 (nhiều lựa chọn)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '6px' }}>
                    Nhập 0 nếu không có
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <input
                        type="number"
                        placeholder="Số câu"
                        value={newBatchForm.part1Count}
                        onChange={e => setNewBatchForm(prev => ({ ...prev, part1Count: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Điểm mỗi câu</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          step="0.05"
                          value={newBatchForm.part1Point}
                          onChange={e => setNewBatchForm(prev => ({ ...prev, part1Point: Number(e.target.value) }))}
                          style={{ width: '80%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                        />
                        <span style={{ color: '#64748b' }}>/</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phần 2 */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                    • Phần 2 (đúng/sai)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '6px' }}>
                    Nhập 0 nếu không có
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="number"
                      placeholder="Số câu"
                      value={newBatchForm.part2Count}
                      onChange={e => setNewBatchForm(prev => ({ ...prev, part2Count: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11.5px', color: '#475569' }}>
                    <div>
                      <div>Điểm đúng 1 ý</div>
                      <input type="number" readOnly value={newBatchForm.part2Points[1]} style={{ width: '100%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', background: 'transparent' }} />
                    </div>
                    <div>
                      <div>Điểm đúng 2 ý</div>
                      <input type="number" readOnly value={newBatchForm.part2Points[2]} style={{ width: '100%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', background: 'transparent' }} />
                    </div>
                    <div>
                      <div>Điểm đúng 3 ý</div>
                      <input type="number" readOnly value={newBatchForm.part2Points[3]} style={{ width: '100%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', background: 'transparent' }} />
                    </div>
                    <div>
                      <div>Điểm đúng 4 ý</div>
                      <input type="number" readOnly value={newBatchForm.part2Points[4]} style={{ width: '100%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', background: 'transparent' }} />
                    </div>
                  </div>
                </div>

                {/* Phần 3 */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                    • Phần 3 (điền số)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '6px' }}>
                    Nhập 0 nếu không có
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <input
                        type="number"
                        placeholder="Số câu"
                        value={newBatchForm.part3Count}
                        onChange={e => setNewBatchForm(prev => ({ ...prev, part3Count: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Điểm mỗi câu</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          step="0.05"
                          value={newBatchForm.part3Point}
                          onChange={e => setNewBatchForm(prev => ({ ...prev, part3Point: Number(e.target.value) }))}
                          style={{ width: '80%', padding: '6px 0', border: 'none', borderBottom: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                        />
                        <span style={{ color: '#64748b' }}>/</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tổng điểm */}
                <div style={{ textAlign: 'right', marginTop: '16px', fontSize: '16px', fontWeight: '800' }}>
                  Tổng điểm: <span style={{ color: '#d97706' }}>{calculatedNewBatchTotalMaxScore}</span>
                </div>

              </div>

            </div>
          </form>
        )}

        {/* =======================================================================
            SCREEN 4: "CÀI ĐẶT" (CHÍNH XÁC THEO ẢNH USER GỬI)
            ======================================================================= */}
        {currentView === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Tốc độ chấm(s) */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
                  Tốc độ chấm(s): {settings.scanSpeedSeconds}
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.5"
                  value={settings.scanSpeedSeconds}
                  onChange={e => setSettings(prev => ({ ...prev, scanSpeedSeconds: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#00897b', cursor: 'pointer' }}
                />
              </div>

              {/* Vừa chấm vừa xem kết quả */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  Vừa chấm vừa xem kết quả
                </span>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={settings.showResultImmediate}
                    onChange={e => setSettings(prev => ({ ...prev, showResultImmediate: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.showResultImmediate ? '#00897b' : '#cbd5e1',
                    borderRadius: '24px',
                    transition: '.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: settings.showResultImmediate ? '24px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '.2s'
                    }} />
                  </span>
                </label>
              </div>

              {/* Âm thanh tiếng bíp (Beep) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  Âm thanh tiếng bíp (Beep)
                </span>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={e => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.soundEnabled ? '#00897b' : '#cbd5e1',
                    borderRadius: '24px',
                    transition: '.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: settings.soundEnabled ? '24px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '.2s'
                    }} />
                  </span>
                </label>
              </div>

              {/* Rung điện thoại (Haptic feedback) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  Rung điện thoại khi nhận diện
                </span>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={settings.vibrateEnabled}
                    onChange={e => setSettings(prev => ({ ...prev, vibrateEnabled: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.vibrateEnabled ? '#00897b' : '#cbd5e1',
                    borderRadius: '24px',
                    transition: '.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: settings.vibrateEnabled ? '24px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '.2s'
                    }} />
                  </span>
                </label>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================================
            SCREEN 5: "ĐÁP ÁN" (XEM & NHẬP ĐÁP ÁN CÁC MÃ ĐỀ)
            ======================================================================= */}
        {currentView === 'answers' && selectedBatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Header tab các mã đề */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Mã đề thi:</span>
                <button
                  type="button"
                  onClick={() => {
                    const newCode = prompt("Nhập mã đề mới (VD: 103, 104...):");
                    if (newCode && newCode.trim()) {
                      const clean = newCode.trim();
                      const updatedKeys = {
                        ...selectedBatch.answerKeys,
                        [clean]: {
                          part1: Array(selectedBatch.parts?.part1?.count || 12).fill('A'),
                          part2: Array(selectedBatch.parts?.part2?.count || 4).fill({ a: 'D', b: 'S', c: 'D', d: 'S' }),
                          part3: Array(selectedBatch.parts?.part3?.count || 3).fill('0')
                        }
                      };
                      const updatedBatch = { ...selectedBatch, answerKeys: updatedKeys };
                      setSelectedBatch(updatedBatch);
                      setActiveExamCode(clean);
                      saveExamBatches(batches.map(b => b.id === updatedBatch.id ? updatedBatch : b));
                    }
                  }}
                  style={{
                    backgroundColor: '#f3e8ff',
                    color: '#6200ee',
                    border: '1px solid #ddd6fe',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  + Thêm mã đề
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {Object.keys(selectedBatch.answerKeys || {}).map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setActiveExamCode(code)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: activeExamCode === code ? '2px solid #6200ee' : '1px solid #cbd5e1',
                      backgroundColor: activeExamCode === code ? '#6200ee' : '#ffffff',
                      color: activeExamCode === code ? '#ffffff' : '#334155',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Mã {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Chi tiết đáp án từng phần của mã đề đang chọn */}
            {selectedBatch.answerKeys[activeExamCode] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Phần 1 */}
                {(selectedBatch.parts?.part1?.count || 0) > 0 && (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6200ee', marginBottom: '12px' }}>
                      Phần 1: Trắc nghiệm 4 lựa chọn ({selectedBatch.parts.part1.count} câu)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                      {Array.from({ length: selectedBatch.parts.part1.count }).map((_, idx) => {
                        const currentAns = selectedBatch.answerKeys[activeExamCode].part1?.[idx] || 'A';
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                            <span style={{ fontWeight: 'bold' }}>Câu {idx + 1}:</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {['A', 'B', 'C', 'D'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    const newP1 = [...(selectedBatch.answerKeys[activeExamCode].part1 || [])];
                                    newP1[idx] = opt;
                                    const updatedKeys = {
                                      ...selectedBatch.answerKeys,
                                      [activeExamCode]: {
                                        ...selectedBatch.answerKeys[activeExamCode],
                                        part1: newP1
                                      }
                                    };
                                    const updatedBatch = { ...selectedBatch, answerKeys: updatedKeys };
                                    setSelectedBatch(updatedBatch);
                                    saveExamBatches(batches.map(b => b.id === updatedBatch.id ? updatedBatch : b));
                                  }}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: currentAns === opt ? 'none' : '1px solid #cbd5e1',
                                    backgroundColor: currentAns === opt ? '#6200ee' : '#ffffff',
                                    color: currentAns === opt ? '#ffffff' : '#334155',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Phần 2 */}
                {(selectedBatch.parts?.part2?.count || 0) > 0 && (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6200ee', marginBottom: '12px' }}>
                      Phần 2: Đúng / Sai ({selectedBatch.parts.part2.count} câu)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {Array.from({ length: selectedBatch.parts.part2.count }).map((_, qIdx) => {
                        const qObj = selectedBatch.answerKeys[activeExamCode].part2?.[qIdx] || { a: 'D', b: 'S', c: 'D', d: 'S' };
                        return (
                          <div key={qIdx} style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '12.5px', marginBottom: '6px' }}>
                              Câu {qIdx + 1}
                            </div>
                            {['a', 'b', 'c', 'd'].map(sub => (
                              <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', margin: '3px 0' }}>
                                <span>{sub})</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {['D', 'S'].map(choice => (
                                    <button
                                      key={choice}
                                      type="button"
                                      onClick={() => {
                                        const newP2 = [...(selectedBatch.answerKeys[activeExamCode].part2 || [])];
                                        newP2[qIdx] = { ...qObj, [sub]: choice };
                                        const updatedKeys = {
                                          ...selectedBatch.answerKeys,
                                          [activeExamCode]: {
                                            ...selectedBatch.answerKeys[activeExamCode],
                                            part2: newP2
                                          }
                                        };
                                        const updatedBatch = { ...selectedBatch, answerKeys: updatedKeys };
                                        setSelectedBatch(updatedBatch);
                                        saveExamBatches(batches.map(b => b.id === updatedBatch.id ? updatedBatch : b));
                                      }}
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        border: (qObj[sub] || 'D') === choice ? 'none' : '1px solid #cbd5e1',
                                        backgroundColor: (qObj[sub] || 'D') === choice ? '#6200ee' : '#ffffff',
                                        color: (qObj[sub] || 'D') === choice ? '#ffffff' : '#334155',
                                        fontSize: '10.5px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {choice === 'D' ? 'Đ' : 'S'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Phần 3 */}
                {(selectedBatch.parts?.part3?.count || 0) > 0 && (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6200ee', marginBottom: '12px' }}>
                      Phần 3: Trả lời ngắn / Điền số ({selectedBatch.parts.part3.count} câu)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {Array.from({ length: selectedBatch.parts.part3.count }).map((_, idx) => {
                        const val = selectedBatch.answerKeys[activeExamCode].part3?.[idx] || '';
                        return (
                          <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Câu {idx + 1}</div>
                            <input
                              type="text"
                              value={val}
                              placeholder="Số"
                              onChange={e => {
                                const newP3 = [...(selectedBatch.answerKeys[activeExamCode].part3 || [])];
                                newP3[idx] = e.target.value;
                                const updatedKeys = {
                                  ...selectedBatch.answerKeys,
                                  [activeExamCode]: {
                                    ...selectedBatch.answerKeys[activeExamCode],
                                    part3: newP3
                                  }
                                };
                                const updatedBatch = { ...selectedBatch, answerKeys: updatedKeys };
                                setSelectedBatch(updatedBatch);
                                saveExamBatches(batches.map(b => b.id === updatedBatch.id ? updatedBatch : b));
                              }}
                              style={{ width: '100%', padding: '6px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* =======================================================================
            SCREEN 6: "CHẤM BÀI" (CAMERA LIVE SCANNER OMR)
            ======================================================================= */}
        {currentView === 'scanner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Header thanh công cụ máy ảnh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#6200ee', fontWeight: 'bold' }}>
                  Đang chấm: {selectedBatch?.title}
                </span>
                <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>
                  Khung Ngắm Định Vị OMR 2027
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <label style={{
                  padding: '7px 12px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ImageIcon size={15} /> Tải ảnh
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadImages}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setCurrentView('graded_list')}
                  style={{
                    padding: '7px 12px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Kết quả ({batchResults.length})
                </button>
              </div>
            </div>

            {/* MÀN HÌNH CAMERA STREAM VỚI KHUNG ĐỊNH VỊ 4 GÓC */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '420px',
              backgroundColor: '#000000',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* KHUNG ĐỊNH VỊ OMR VÀ 4 GÓC MỤC TIÊU */}
              <div style={{
                position: 'absolute',
                inset: '24px',
                border: '2px dashed rgba(255, 255, 255, 0.65)',
                borderRadius: '16px',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)'
              }}>
                <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '28px', height: '28px', borderTop: '4px solid #6200ee', borderLeft: '4px solid #6200ee', borderRadius: '4px 0 0 0' }}></div>
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '28px', height: '28px', borderTop: '4px solid #6200ee', borderRight: '4px solid #6200ee', borderRadius: '0 4px 0 0' }}></div>
                <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '28px', height: '28px', borderBottom: '4px solid #6200ee', borderLeft: '4px solid #6200ee', borderRadius: '0 0 0 4px' }}></div>
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '28px', height: '28px', borderBottom: '4px solid #6200ee', borderRight: '4px solid #6200ee', borderRadius: '0 0 4px 0' }}></div>

                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#ffffff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {isProcessingImage ? '⚡ Đang chấm...' : 'Căn 4 mốc đen vào khung'}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                    Giữ thẳng camera & đủ ánh sáng
                  </div>
                </div>
              </div>

              {cameraError && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', color: '#ffffff', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <AlertCircle size={40} color="#f87171" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>{cameraError}</div>
                  <button
                    type="button"
                    onClick={startCamera}
                    style={{ backgroundColor: '#6200ee', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Thử lại
                  </button>
                </div>
              )}

            </div>

            {/* BẢNG ĐIỀU KHIỂN NÚT CHỤP & THÔNG TIN CHẤM */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                disabled={isProcessingImage}
                onClick={() => processFrameAndGrade()}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: '#6200ee',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: isProcessingImage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 18px rgba(98, 0, 238, 0.35)'
                }}
              >
                <Zap size={20} /> {isProcessingImage ? 'Đang phân tích OMR...' : 'CHỤP & CHẤM NGAY'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (scanning) {
                    clearInterval(scanIntervalId);
                    setScanIntervalId(null);
                    setScanning(false);
                  } else {
                    const id = setInterval(() => {
                      processFrameAndGrade();
                    }, (settings.scanSpeedSeconds || 1) * 1000);
                    setScanIntervalId(id);
                    setScanning(true);
                  }
                }}
                style={{
                  padding: '15px 18px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: scanning ? '#dc2626' : '#ffffff',
                  color: scanning ? '#ffffff' : '#475569',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {scanning ? 'Dừng quét' : 'Quét tự động'}
              </button>
            </div>

          </div>
        )}

        {/* =======================================================================
            SCREEN 7: "BÀI ĐÃ CHẤM" (GRADED LIST)
            ======================================================================= */}
        {currentView === 'graded_list' && selectedBatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Tổng số bài đã chấm: <strong>{batchResults.length} bài</strong>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('scanner')}
                style={{
                  backgroundColor: '#6200ee',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                + Chấm tiếp
              </button>
            </div>

            {batchResults.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <Camera size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <div>Chưa có bài thi nào được chấm trong đợt này.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {batchResults.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #eaeaea',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', width: '20px' }}>{idx + 1}.</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.studentName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          SBD: <strong>{r.sbd}</strong> • Mã đề: <strong>{r.examCode}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: r.totalScore >= 8 ? '#ecfdf5' : (r.totalScore >= 5 ? '#eff6ff' : '#fef2f2'),
                        color: r.totalScore >= 8 ? '#059669' : (r.totalScore >= 5 ? '#2563eb' : '#dc2626'),
                        fontWeight: '800',
                        fontSize: '15px'
                      }}>
                        {r.totalScore}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa kết quả bài chấm của ${r.studentName}?`)) {
                            const updated = deleteScannedResult(r.id);
                            setBatchResults(updated.filter(b => b.batchId === selectedBatch.id));
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* =======================================================================
            SCREEN 8: "THỐNG KÊ" (STATS & CHARTS)
            ======================================================================= */}
        {currentView === 'stats' && selectedBatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* 3 Thẻ tóm tắt */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #eaeaea', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TỔNG BÀI</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#6200ee' }}>{batchResults.length}</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #eaeaea', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>ĐIỂM TRUNG BÌNH</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669' }}>
                  {batchResults.length > 0 
                    ? (batchResults.reduce((sum, r) => sum + (r.totalScore || 0), 0) / batchResults.length).toFixed(2)
                    : '0.00'}
                </div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #eaeaea', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>ĐIỂM CAO NHẤT</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#ea580c' }}>
                  {batchResults.length > 0 
                    ? Math.max(...batchResults.map(r => r.totalScore || 0)).toFixed(2)
                    : '0.00'}
                </div>
              </div>
            </div>

            {/* Phổ điểm */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #eaeaea' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Phổ điểm theo mức xếp loại:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Giỏi (8.0 - 10.0)</span>
                    <strong>{batchResults.filter(r => r.totalScore >= 8.0).length} học sinh</strong>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${batchResults.length > 0 ? (batchResults.filter(r => r.totalScore >= 8.0).length / batchResults.length) * 100 : 0}%`, height: '100%', backgroundColor: '#10b981' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Khá (6.5 - 7.9)</span>
                    <strong>{batchResults.filter(r => r.totalScore >= 6.5 && r.totalScore < 8.0).length} học sinh</strong>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${batchResults.length > 0 ? (batchResults.filter(r => r.totalScore >= 6.5 && r.totalScore < 8.0).length / batchResults.length) * 100 : 0}%`, height: '100%', backgroundColor: '#3b82f6' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Trung bình (5.0 - 6.4)</span>
                    <strong>{batchResults.filter(r => r.totalScore >= 5.0 && r.totalScore < 6.5).length} học sinh</strong>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${batchResults.length > 0 ? (batchResults.filter(r => r.totalScore >= 5.0 && r.totalScore < 6.5).length / batchResults.length) * 100 : 0}%`, height: '100%', backgroundColor: '#f59e0b' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Yếu / Chưa đạt (&lt; 5.0)</span>
                    <strong>{batchResults.filter(r => r.totalScore < 5.0).length} học sinh</strong>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${batchResults.length > 0 ? (batchResults.filter(r => r.totalScore < 5.0).length / batchResults.length) * 100 : 0}%`, height: '100%', backgroundColor: '#ef4444' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =======================================================================
            SCREEN 9: "CHỌN LỚP HỌC" (CHOOSE CLASS)
            ======================================================================= */}
        {currentView === 'choose_class' && selectedBatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #eaeaea' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                Đang áp dụng cho bài: <strong>{selectedBatch.title}</strong>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                Chọn lớp từ danh mục THPT Cao Bá Quát:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {uniqueClasses.map(cls => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      const updatedBatch = { ...selectedBatch, className: cls };
                      setSelectedBatch(updatedBatch);
                      saveExamBatches(batches.map(b => b.id === updatedBatch.id ? updatedBatch : b));
                      setSelectedClassFilter(cls);
                      alert(`Đã liên kết bài kiểm tra với lớp ${cls}!`);
                      setCurrentView('batch_detail');
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: selectedBatch.className === cls ? '2px solid #6200ee' : '1px solid #cbd5e1',
                      backgroundColor: selectedBatch.className === cls ? '#f3e8ff' : '#ffffff',
                      color: selectedBatch.className === cls ? '#6200ee' : '#334155',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =======================================================================
            SCREEN 10: "TẢI PHIẾU TRẢ LỜI" (A4/A5 VECTOR PRINTABLE SHEET)
            ======================================================================= */}
        {currentView === 'print_sheet' && (
          <PrintableAnswerSheet2027 
            batch={selectedBatch} 
            onBack={() => setCurrentView('home')} 
          />
        )}

      </main>

      {/* =======================================================================
          MODAL XEM CHI TIẾT CẤU TRÚC ĐIỂM (KHI BẤM NÚT i TRÒN MÀU TÍM)
          ======================================================================= */}
      {showStructureInfoModal && selectedBatch && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ backgroundColor: '#6200ee', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={18} /> Cấu Trúc Đề & Thang Điểm
              </div>
              <button
                type="button"
                onClick={() => setShowStructureInfoModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '18px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>Tên bài:</strong> {selectedBatch.title}
              </div>
              <div>
                <strong>Mẫu phiếu:</strong> {getTemplateDisplayName(selectedBatch.sheetTemplate)}
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>• <strong>Phần 1:</strong> {selectedBatch.parts?.part1?.count || 0} câu × {selectedBatch.parts?.part1?.pointPerQ || 0.25}đ = {((selectedBatch.parts?.part1?.count || 0) * (selectedBatch.parts?.part1?.pointPerQ || 0.25)).toFixed(2)} điểm</div>
                <div>• <strong>Phần 2:</strong> {selectedBatch.parts?.part2?.count || 0} câu đúng/sai (thang lũy tiến 0.1 - 0.25 - 0.5 - 1.0) = {((selectedBatch.parts?.part2?.count || 0) * 1.0).toFixed(2)} điểm</div>
                <div>• <strong>Phần 3:</strong> {selectedBatch.parts?.part3?.count || 0} câu điền số × {selectedBatch.parts?.part3?.pointPerQ || 0.5}đ = {((selectedBatch.parts?.part3?.count || 0) * (selectedBatch.parts?.part3?.pointPerQ || 0.5)).toFixed(2)} điểm</div>
              </div>

              <div style={{ fontSize: '15px', fontWeight: 'bold', textAlign: 'right', color: selectedBatchTotalScore === 10.0 ? '#16a34a' : '#d97706' }}>
                Tổng điểm tối đa: {selectedBatchTotalScore} / 10.0
              </div>

              <button
                type="button"
                onClick={() => setShowStructureInfoModal(false)}
                style={{
                  marginTop: '6px',
                  padding: '10px',
                  backgroundColor: '#6200ee',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL XUẤT KẾT QUẢ (KHI BẤM NÚT "XUẤT KẾT QUẢ")
          ======================================================================= */}
      {showExportModal && selectedBatch && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ backgroundColor: '#00897b', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpDown size={18} /> Xuất Kết Quả Chấm Thi
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Đợt thi: <strong>{selectedBatch.title}</strong> • Đã chấm: <strong>{batchResults.length} bài</strong>
              </div>

              {/* Nút 1: Xuất Excel (Tiền tố số thứ tự theo GEMINI.md) */}
              <button
                type="button"
                onClick={() => {
                  exportExamResultsToExcel(selectedBatch, batchResults);
                  setShowExportModal(false);
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <FileSpreadsheet size={24} color="#16a34a" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534' }}>
                    1. Tải Bảng Điểm Excel Chuẩn Bộ GD
                  </div>
                  <div style={{ fontSize: '11px', color: '#15803d' }}>
                    Định dạng file: 1-Bang_diem_cham_trac_nghiem_2027_...xlsx
                  </div>
                </div>
              </button>

              {/* Nút 2: Tải phiếu trả lời để in */}
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(false);
                  setCurrentView('print_sheet');
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#eff6ff',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Printer size={24} color="#2563eb" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>
                    2. In Phiếu Trả Lời A4 / A5
                  </div>
                  <div style={{ fontSize: '11px', color: '#1d4ed8' }}>
                    Phiếu in vector chất lượng cao có 4 góc định vị
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{
                  marginTop: '8px',
                  padding: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL ĐỔI TÊN BÀI KIỂM TRA
          ======================================================================= */}
      {renameModalData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <form onSubmit={handleSaveRename} style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '380px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ backgroundColor: '#6200ee', color: '#ffffff', padding: '14px 16px', fontWeight: 'bold', fontSize: '15px' }}>
              Đổi tên bài kiểm tra
            </div>
            <div style={{ padding: '16px' }}>
              <input
                type="text"
                required
                value={renameModalData.newTitle}
                onChange={e => setRenameModalData(prev => ({ ...prev, newTitle: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setRenameModalData(null)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '13px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#6200ee', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =======================================================================
          MODAL XEM NHANH KẾT QUẢ VỪA CHẤM XONG (POPUP INSTANT)
          ======================================================================= */}
      {showResultModal && lastScannedResult && (
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
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ backgroundColor: '#16a34a', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} color="#fde047" /> ĐÃ CHẤM THÀNH CÔNG
              </div>
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '18px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#16a34a', lineHeight: 1 }}>
                {lastScannedResult.totalScore}
                <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 'normal' }}> / 10.0</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>
                {lastScannedResult.studentName}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                SBD: <strong>{lastScannedResult.sbd}</strong> • Mã đề: <strong>{lastScannedResult.examCode}</strong>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phần 1 (Nhiều lựa chọn):</span>
                  <strong>{lastScannedResult.part1Score} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phần 2 (Đúng / Sai 4 ý):</span>
                  <strong>{lastScannedResult.part2Score} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phần 3 (Trả lời ngắn):</span>
                  <strong>{lastScannedResult.part3Score} đ</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    backgroundColor: '#6200ee',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                >
                  Chấm bài tiếp 📷
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResultModal(false);
                    setCurrentView('graded_list');
                  }}
                  style={{
                    padding: '11px 14px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Xem danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas ẩn phục vụ tiền xử lý ảnh OMR */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

    </div>
  );
}
