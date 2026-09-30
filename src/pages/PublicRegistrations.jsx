import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase, supabase2, DualSupabaseService, fetchStudentsByClass, searchStudentsByName } from '../lib/supabase';
import { 
  FileText, CheckCircle2, User, Search, Navigation, Lock, Clock, AlertTriangle, 
  ShieldCheck, ShieldAlert, Users, QrCode, ExternalLink, Calendar, MapPin, 
  Award, X, GraduationCap, Sparkles, BookOpen, Download, Printer, UploadCloud, 
  Paperclip, HardDrive, Link as LinkIcon, FolderOpen, FileCheck, Check, Eye,
  PenTool, RefreshCw
} from 'lucide-react';
import html2canvas from 'html2canvas';
import SignaturePadModal from '../components/SignaturePadModal';
import { CLUB_SUB_DISCIPLINES, getSubDisciplinesForClub } from '../data/clubSubDisciplines';
import {
  isTuitionCampaign,
  isCoreSubject,
  isSubjectAllowedForStudent,
  fetchStudentElectives,
  normalizeSubjectName,
  ALL_TUITION_SUBJECTS,
  SUBJECT_METADATA,
  isCampaignHidden,
  downloadTuitionApplicationDoc,
  printTuitionApplicationDoc,
  uploadFileToGoogleDrive,
  isTuitionSubjectField
} from '../utils/tuitionElectiveService';

export default function PublicRegistrations() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open'); // 'open' | 'closed' | 'all'
  
  // Verification States
  const [studentRoster, setStudentRoster] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Prerequisite Club Verification States
  const [checkingClubEligibility, setCheckingClubEligibility] = useState(false);
  const [clubEligibility, setClubEligibility] = useState(null); 
  // { eligible: boolean, requiredClub: string, registeredClubs: string[] }

  // Tuition & Elective Subjects States (GDPT 2018 - Khối 12)
  const [checkingElectives, setCheckingElectives] = useState(false);
  const [studentElectives, setStudentElectives] = useState([]);
  const [electiveSource, setElectiveSource] = useState('');

  // Signed Document Application States (Tải mẫu, ký tên, nộp minh chứng)
  const [signedDocFile, setSignedDocFile] = useState(null);
  const [signedDocUrl, setSignedDocUrl] = useState('');
  const [signedDocFileName, setSignedDocFileName] = useState('');
  const [signedDocDriveLink, setSignedDocDriveLink] = useState('');
  const [signedDocClassFolderUrl, setSignedDocClassFolderUrl] = useState('');
  const [signedDocSource, setSignedDocSource] = useState(''); // 'google_drive' | 'supabase' | 'e_signature'
  const [uploadMethod, setUploadMethod] = useState('sign'); // 'sign' | 'file' | 'drive'
  const [uploadingSignedDoc, setUploadingSignedDoc] = useState(false);
  const [signedDocError, setSignedDocError] = useState('');
  const [previewDocModal, setPreviewDocModal] = useState(false);

  // E-Signature States (Ký trực tiếp trên màn hình)
  const [activeSignerModal, setActiveSignerModal] = useState(null); // 'parent' | 'student' | null
  const [parentSignature, setParentSignature] = useState(null);
  const [studentSignature, setStudentSignature] = useState(null);
  const [parentOpinion, setParentOpinion] = useState('Tôi hoàn toàn đồng ý và tạo điều kiện cho con tham gia học thêm.');
  const [isGeneratingESignedDoc, setIsGeneratingESignedDoc] = useState(false);
  const paperRef = useRef(null);

  // QR Modal State
  const [qrModalItem, setQrModalItem] = useState(null);

  // Class Autocomplete States
  const [classSuggestions, setClassSuggestions] = useState([]);
  const [showClassSuggestions, setShowClassSuggestions] = useState(false);

  // Form Submission States
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const dropdownRef = useRef(null);
  const classDropdownRef = useRef(null);

  useEffect(() => {
    fetchActiveCampaigns();
    fetchStudentRoster();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setShowClassSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchActiveCampaigns() {
    try {
      const res = await DualSupabaseService.selectSmart(
        'cbq_registration_campaigns',
        (q) => q.order('created_at', { ascending: false }),
        'id'
      );
      setCampaigns(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  const getClosedNotice = (cam) => {
    if (!cam) return '';
    if (cam.closed_notice) return cam.closed_notice;
    if (cam.form_schema && !Array.isArray(cam.form_schema) && cam.form_schema.closed_notice) {
      return cam.form_schema.closed_notice;
    }
    return '';
  };

  const getPrerequisiteClub = (cam) => {
    if (!cam) return null;
    if (cam.prerequisite_club) return cam.prerequisite_club;
    if (cam.form_schema && !Array.isArray(cam.form_schema) && cam.form_schema.prerequisite_club) {
      return cam.form_schema.prerequisite_club;
    }
    // Fallback nhận diện theo tiêu đề
    const title = (cam.title || '').toLowerCase();
    if (title.includes('thể dục') || title.includes('thể thao') || title.includes('tdtt')) {
      if (title.includes('môn phụ') || title.includes('phân môn') || title.includes('bộ môn')) {
        return '2) Câu lạc bộ Thể duc - Thể thao';
      }
    }
    return null;
  };

  const getCampaignStatus = (cam) => {
    if (!cam) return { code: 'open', label: '🟢 Đang mở', isLocked: false, message: '' };
    const now = new Date();
    
    if (cam.is_active === false) {
      return { 
        code: 'locked', 
        label: '🔴 Đã khóa', 
        isLocked: true, 
        message: getClosedNotice(cam) || 'Đợt đăng ký này hiện đã bị khóa bởi Quản trị viên.' 
      };
    }
    if (cam.start_date && now < new Date(cam.start_date)) {
      const timeStr = new Date(cam.start_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
      return { 
        code: 'not_started', 
        label: '🟡 Chờ mở đăng ký', 
        isLocked: true, 
        message: `Đợt đăng ký sẽ mở vào lúc ${timeStr}. Vui lòng quay lại sau.` 
      };
    }
    if (cam.end_date && now > new Date(cam.end_date)) {
      const timeStr = new Date(cam.end_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
      return { 
        code: 'expired', 
        label: '⏰ Đã hết hạn', 
        isLocked: true, 
        message: getClosedNotice(cam) || `Đợt đăng ký đã chính thức kết thúc vào lúc ${timeStr}.` 
      };
    }
    return { code: 'open', label: '🟢 Đang mở', isLocked: false, message: '' };
  };

  async function fetchStudentRoster() {}

  const getUniqueClassesList = () => {
    const defaults = [];
    ['10', '11', '12'].forEach(g => {
      for (let i = 1; i <= 15; i++) {
        const num = String(i).padStart(2, '0');
        defaults.push(`${g}A${num}`);
      }
    });
    return defaults;
  };

  const filterNameSuggestions = async (nameVal, classVal = studentClass) => {
    const cleanName = (nameVal || '').trim();
    const cleanClass = (classVal || '').trim();

    if (cleanClass) {
      const studentsInClass = await fetchStudentsByClass(cleanClass);
      let matches = studentsInClass;
      if (cleanName) {
        matches = matches.filter(s => 
          s.student_name.toLowerCase().includes(cleanName.toLowerCase()) ||
          s.student_code.toLowerCase().includes(cleanName.toLowerCase())
        );
      }
      setSuggestions(matches.slice(0, 10));
      setShowSuggestions(matches.length > 0);
    } else if (cleanName.length >= 2) {
      const matches = await searchStudentsByName(cleanName);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const filterClassSuggestions = (val) => {
    const allUnique = getUniqueClassesList();
    const clean = (val || '').trim().toUpperCase();
    if (!clean) {
      setClassSuggestions(allUnique.slice(0, 15));
      setShowClassSuggestions(true);
      return;
    }
    const filtered = allUnique.filter(c => c.toUpperCase().includes(clean)).slice(0, 15);
    setClassSuggestions(filtered);
    setShowClassSuggestions(filtered.length > 0);
  };

  const handleNameChange = (val) => {
    setStudentName(val);
    setIsVerified(false);
    setClubEligibility(null);
    setStudentElectives([]);
    setElectiveSource('');
    filterNameSuggestions(val);
  };

  const handleClassChange = (val) => {
    setStudentClass(val);
    setClubEligibility(null);
    setStudentElectives([]);
    setElectiveSource('');
    filterClassSuggestions(val);
    if (val) fetchStudentsByClass(val);
  };

  const handleSelectClassSuggestion = (clsName) => {
    setStudentClass(clsName);
    setShowClassSuggestions(false);
    setClubEligibility(null);
    setStudentElectives([]);
    setElectiveSource('');
    fetchStudentsByClass(clsName);
    filterNameSuggestions(studentName, clsName);
  };

  // KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT: Học sinh đã đăng ký CLB mẹ hay chưa
  const verifyClubPrerequisite = async (studentCodeVal, targetCampaign) => {
    const requiredClub = getPrerequisiteClub(targetCampaign);
    if (!requiredClub) {
      setClubEligibility({ eligible: true, requiredClub: null, registeredClubs: [] });
      return true;
    }

    setCheckingClubEligibility(true);
    try {
      // Tìm đợt đăng ký CLB mẹ
      const client = targetCampaign._source === 'sb1' && supabase ? supabase : (supabase2 || supabase);
      
      // Truy vấn kết quả đăng ký của học sinh trong đợt CLB
      const { data: regRecords, error } = await client
        .from('cbq_student_registrations')
        .select('*')
        .eq('student_code', studentCodeVal);

      if (error) throw error;

      // Trích xuất toàn bộ CLB mà học sinh này đã từng đăng ký
      const registeredClubs = [];
      (regRecords || []).forEach(rec => {
        if (!rec.responses) return;
        Object.values(rec.responses).forEach(ans => {
          if (Array.isArray(ans)) {
            ans.forEach(item => {
              if (typeof item === 'string' && (item.includes('Câu lạc bộ') || item.includes('CLB'))) {
                registeredClubs.push(item);
              }
            });
          } else if (typeof ans === 'string' && (ans.includes('Câu lạc bộ') || ans.includes('CLB'))) {
            registeredClubs.push(ans);
          }
        });
      });

      // Kiểm tra xem có khớp requiredClub không (hỗ trợ so sánh chuẩn hóa)
      const cleanReq = requiredClub.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isEligible = registeredClubs.some(club => {
        const cleanClub = club.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanClub.includes(cleanReq) || cleanReq.includes(cleanClub) || 
          (cleanReq.includes('theduc') && cleanClub.includes('theduc')) ||
          (cleanReq.includes('thethao') && cleanClub.includes('thethao'));
      });

      const eligibilityResult = {
        eligible: isEligible,
        requiredClub: requiredClub,
        registeredClubs: registeredClubs
      };

      setClubEligibility(eligibilityResult);
      return isEligible;
    } catch (err) {
      console.error('Lỗi khi kiểm tra tư cách thành viên CLB:', err);
      // Mặc định cho qua nếu mạng lỗi
      setClubEligibility({ eligible: true, requiredClub, registeredClubs: [] });
      return true;
    } finally {
      setCheckingClubEligibility(false);
    }
  };

  const handleSelectSuggestion = async (student) => {
    setStudentName(student.student_name);
    setStudentClass(student.student_class);
    setStudentCode(student.student_code);
    setIsVerified(true);
    setShowSuggestions(false);
    setShowClassSuggestions(false);

    // Kiểm tra tính hợp lệ về khối của Campaign
    if (selectedCampaign && selectedCampaign.target_grades && selectedCampaign.target_grades.length > 0) {
      const matchPrefix = student.student_class.trim().toUpperCase().match(/^(10|11|12)/);
      const gradeStr = matchPrefix ? `Khối ${matchPrefix[1]}` : null;
      if (!selectedCampaign.target_grades.includes(gradeStr)) {
        alert(`Lỗi: Đợt đăng ký này chỉ áp dụng cho ${selectedCampaign.target_grades.join(', ')}.`);
        setIsVerified(false);
        setStudentName('');
        setStudentCode('');
        return;
      }
    }

    // Kiểm tra điều kiện CLB
    await verifyClubPrerequisite(student.student_code, selectedCampaign);

    // Kiểm tra điều kiện Môn tự chọn nếu là đợt Đăng ký học thêm GDPT 2018 (Khối 12)
    if (isTuitionCampaign(selectedCampaign)) {
      setCheckingElectives(true);
      try {
        const res = await fetchStudentElectives({
          studentCode: student.student_code,
          studentName: student.student_name,
          studentClass: student.student_class,
          targetCampaign: selectedCampaign
        });
        setStudentElectives(res.electives || []);
        setElectiveSource(res.source || '');
      } catch (err) {
        console.error("Lỗi khi tra cứu môn tự chọn học sinh:", err);
      } finally {
        setCheckingElectives(false);
      }
    }
  };

  const selectCampaign = (cam) => {
    setSelectedCampaign(cam);
    setSuccess(false);
    setIsVerified(false);
    setStudentName('');
    setStudentClass('');
    setStudentCode('');
    setClubEligibility(null);
    setStudentElectives([]);
    setElectiveSource('');
    setCheckingElectives(false);
    setSubmittedData(null);
    setSignedDocFile(null);
    setSignedDocUrl('');
    setSignedDocFileName('');
    setSignedDocDriveLink('');
    setSignedDocClassFolderUrl('');
    setSignedDocSource('');
    setSignedDocError('');
    setUploadMethod('sign');
    setParentSignature(null);
    setStudentSignature(null);
    setParentOpinion('Tôi hoàn toàn đồng ý và tạo điều kiện cho con tham gia học thêm.');
    setIsGeneratingESignedDoc(false);
    
    // Init default responses
    const initialResponses = {};
    const schemaFields = Array.isArray(cam.form_schema) ? cam.form_schema : (cam.form_schema?.fields || []);
    schemaFields.forEach(f => {
      if (f.type === 'checkbox' || f.id === 'field_tuition_commitment') initialResponses[f.id] = [];
      else initialResponses[f.id] = '';
    });
    setResponses(initialResponses);
    window.scrollTo(0, 0);
  };

  const handleResponseChange = (fieldId, value, type) => {
    if (type === 'checkbox') {
      const current = Array.isArray(responses[fieldId]) ? responses[fieldId] : (responses[fieldId] ? [responses[fieldId]] : []);
      if (current.includes(value)) {
        setResponses({ ...responses, [fieldId]: current.filter(v => v !== value) });
      } else {
        setResponses({ ...responses, [fieldId]: [...current, value] });
      }
    } else {
      setResponses({ ...responses, [fieldId]: value });
    }
  };

  const currentSchemaFields = useMemo(() => {
    if (!selectedCampaign) return [];
    const fields = Array.isArray(selectedCampaign.form_schema) 
      ? selectedCampaign.form_schema 
      : (selectedCampaign.form_schema?.fields || []);

    return fields.map(f => {
      // Làm sạch trường cam kết học thêm: loại bỏ lựa chọn thừa "Không có nguyện vọng", chuyển sang dạng checkbox xác nhận tích chọn
      if (f.id === 'field_tuition_commitment' || (f.label && f.label.toLowerCase().includes('cam kết') && isTuitionCampaign(selectedCampaign))) {
        const cleanedOpts = (f.options || []).filter(
          opt => !opt.toLowerCase().includes('không có nguyện vọng') && !opt.toLowerCase().includes('khong co nguyen vong')
        );
        return {
          ...f,
          type: 'checkbox',
          options: cleanedOpts.length > 0 ? cleanedOpts : ['Em và gia đình kính đề nghị nhà trường cho phép tham gia học thêm và cam kết chấp hành nghiêm túc nội quy'],
          description: f.description || 'Học sinh tích chọn để xác nhận sự đồng thuận và cam kết tự nguyện học thêm của em và gia đình.'
        };
      }
      return f;
    });
  }, [selectedCampaign]);

  const requiredClubName = useMemo(() => {
    return getPrerequisiteClub(selectedCampaign);
  }, [selectedCampaign]);

  const subDisciplinesList = useMemo(() => {
    if (!requiredClubName) return [];
    return getSubDisciplinesForClub(requiredClubName);
  }, [requiredClubName]);

  // Kiểm tra xem đợt đăng ký có yêu cầu nộp đơn có chữ ký không
  const requiresSignedDocument = useMemo(() => {
    if (!selectedCampaign) return false;
    if (isTuitionCampaign(selectedCampaign)) return true;
    if (selectedCampaign.form_schema && !Array.isArray(selectedCampaign.form_schema)) {
      if (selectedCampaign.form_schema.requires_signed_document === true) return true;
      if (selectedCampaign.form_schema.is_tuition_registration === true) return true;
    }
    return false;
  }, [selectedCampaign]);

  // Lấy link thư mục Google Drive của nhà trường nếu có
  const schoolDriveUrl = useMemo(() => {
    if (!selectedCampaign) return '';
    if (selectedCampaign.school_drive_url) return selectedCampaign.school_drive_url;
    if (selectedCampaign.form_schema && !Array.isArray(selectedCampaign.form_schema)) {
      return selectedCampaign.form_schema.school_drive_url || '';
    }
    return '';
  }, [selectedCampaign]);

  // Trích xuất các môn học đã chọn từ responses để in vào đơn
  const getSelectedTuitionSubjectsList = () => {
    let chosen = responses['field_tuition_subjects'];
    if (Array.isArray(chosen) && chosen.length > 0) return chosen;
    if (typeof chosen === 'string' && chosen) return [chosen];
    
    // Tìm trong currentSchemaFields (chỉ lấy từ các trường chọn môn học)
    for (const f of currentSchemaFields) {
      if (!isTuitionSubjectField(f)) continue;
      const val = responses[f.id];
      if (Array.isArray(val) && val.length > 0) return val;
      if (typeof val === 'string' && val) return [val];
    }
    return [];
  };

  // Hàm tải file Word (.doc) đơn đăng ký học thêm đã điền thông tin học sinh
  const handleDownloadApplication = () => {
    if (!studentName || !studentClass) {
      return alert("Vui lòng nhập và chọn đúng họ tên học sinh ở Bước 1 trước khi tải đơn.");
    }

    const chosenSubjects = getSelectedTuitionSubjectsList();
    if (chosenSubjects.length === 0) {
      if (!window.confirm("Em chưa tích chọn môn học nào ở Bước 2. Em có chắc chắn muốn tải mẫu đơn trắng để tự viết tay không?")) {
        return;
      }
    }

    const category = responses['field_tuition_category'] || '';
    const preferredTeacher = responses['field_preferred_teacher'] || '';
    const parentName = responses['field_parent_name'] || '';

    downloadTuitionApplicationDoc({
      studentName,
      studentClass,
      schoolYear: selectedCampaign?.form_schema?.school_year || '2026 - 2027',
      schoolName: selectedCampaign?.form_schema?.school_name || 'Trường THPT Cao Bá Quát',
      subjects: chosenSubjects,
      category,
      preferredTeacher,
      parentName
    });
  };

  // Hàm in trực tiếp hoặc xuất PDF đơn đăng ký
  const handlePrintApplication = () => {
    if (!studentName || !studentClass) {
      return alert("Vui lòng nhập và chọn đúng họ tên học sinh ở Bước 1 trước khi in đơn.");
    }

    const chosenSubjects = getSelectedTuitionSubjectsList();
    const category = responses['field_tuition_category'] || '';
    const preferredTeacher = responses['field_preferred_teacher'] || '';
    const parentName = responses['field_parent_name'] || '';

    printTuitionApplicationDoc({
      studentName,
      studentClass,
      schoolYear: selectedCampaign?.form_schema?.school_year || '2026 - 2027',
      schoolName: selectedCampaign?.form_schema?.school_name || 'Trường THPT Cao Bá Quát',
      subjects: chosenSubjects,
      category,
      preferredTeacher,
      parentName
    });
  };

  // Xử lý upload file đơn đã ký (ảnh chụp hoặc PDF) - Hỗ trợ nộp trực tiếp lên Google Drive gom nhóm theo Lớp
  const handleSignedDocFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setSignedDocError("Kích thước file không được vượt quá 20MB.");
      return;
    }

    setSignedDocError('');
    setUploadingSignedDoc(true);

    try {
      const cleanClass = (studentClass || '12').replace(/[^a-zA-Z0-9]/g, '');
      const cleanCode = (studentCode || 'HS').replace(/[^a-zA-Z0-9]/g, '');
      const schema = selectedCampaign?.form_schema;
      const googleDriveScriptUrl = selectedCampaign?.google_drive_script_url || 
        (schema && typeof schema === 'object' && !Array.isArray(schema) ? schema.google_drive_script_url : '');
      const parentFolderId = selectedCampaign?.google_drive_folder_id || 
        (schema && typeof schema === 'object' && !Array.isArray(schema) ? schema.google_drive_folder_id : '');

      // 1. NẾU CÓ CẤU HÌNH GOOGLE APPS SCRIPT -> TẢI TRỰC TIẾP LÊN GOOGLE DRIVE CỦA TRƯỜNG & TỰ ĐỘNG GOM VÀO THƯ MỤC LỚP
      if (googleDriveScriptUrl && googleDriveScriptUrl.startsWith('http')) {
        try {
          const driveResult = await uploadFileToGoogleDrive({
            scriptUrl: googleDriveScriptUrl,
            file,
            studentClass: studentClass || 'Khối 12',
            studentName: studentName || 'Học sinh',
            studentCode: studentCode || '',
            campaignTitle: selectedCampaign?.title || 'Đơn đăng ký học thêm',
            parentFolderId
          });

          if (driveResult && driveResult.fileUrl) {
            setSignedDocUrl(driveResult.previewUrl || driveResult.fileUrl);
            setSignedDocDriveLink(driveResult.fileUrl);
            setSignedDocClassFolderUrl(driveResult.classFolderUrl || '');
            setSignedDocFileName(driveResult.fileName || file.name);
            setSignedDocFile(file);
            setSignedDocSource('google_drive');
            setUploadingSignedDoc(false);
            return;
          }
        } catch (gasErr) {
          console.warn("Upload Google Drive qua Google Apps Script gặp sự cố, tự động kích hoạt lưu trữ dự phòng:", gasErr);
          // Không throw để fallback tiếp tục sang Supabase
        }
      }

      // 2. PHƯƠNG ÁN DỰ PHÒNG: TẢI LÊN SUPABASE STORAGE THEO CẤU TRÚC THƯ MỤC THEO LỚP
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `don_hoc_them_${cleanClass}_${cleanCode}_${Date.now()}.${fileExt}`;
      const campaignKey = selectedCampaign?.id || 'dot_chung';
      const filePath = `tuition_applications/${campaignKey}/${cleanClass}/${fileName}`;

      const client = (selectedCampaign?._source === 'sb1' && supabase) ? supabase : (supabase2 || supabase);
      let uploadSuccess = false;
      let publicUrl = '';

      try {
        const { data, error: uploadErr } = await client.storage
          .from('images')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (!uploadErr && data) {
          const { data: urlData } = client.storage.from('images').getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
            uploadSuccess = true;
          }
        }
      } catch (err) {
        console.warn("Storage upload failed, trying fallback:", err);
      }

      if (!uploadSuccess) {
        if (file.size <= 2.5 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = (readEvent) => {
            const base64Data = readEvent.target.result;
            setSignedDocUrl(base64Data);
            setSignedDocFileName(file.name);
            setSignedDocFile(file);
            setSignedDocSource('data_url');
            setUploadingSignedDoc(false);
          };
          reader.readAsDataURL(file);
          return;
        } else {
          throw new Error("Không thể tải file tự động. Bạn vui lòng tải file lên Google Drive của mình rồi dán link chia sẻ vào ô bên dưới nhé!");
        }
      } else {
        setSignedDocUrl(publicUrl);
        setSignedDocFileName(file.name);
        setSignedDocFile(file);
        setSignedDocSource('supabase');
      }
    } catch (err) {
      console.error("Lỗi khi tải file đơn:", err);
      setSignedDocError(err.message || "Lỗi khi tải file lên. Bạn có thể chuyển sang chọn dán link Google Drive.");
    } finally {
      setUploadingSignedDoc(false);
    }
  };

  const handleRemoveSignedDoc = () => {
    setSignedDocFile(null);
    setSignedDocUrl('');
    setSignedDocFileName('');
    setSignedDocDriveLink('');
    setSignedDocClassFolderUrl('');
    setSignedDocSource('');
    setSignedDocError('');
    setParentSignature(null);
    setStudentSignature(null);
  };

  // Mở modal ký tên cho Cha/Mẹ hoặc Học sinh
  const handleOpenSignModal = (signer) => {
    if (!studentName || !studentClass) {
      return alert("Vui lòng nhập và chọn đúng họ tên học sinh ở Bước 1 trước khi thực hiện ký tên.");
    }
    setActiveSignerModal(signer);
  };

  // Tải ảnh đơn đăng ký đã ký về máy tính / điện thoại
  const handleDownloadSignedDocImage = () => {
    if (!signedDocUrl) return;
    const a = document.createElement('a');
    a.href = signedDocUrl;
    const cleanClass = (studentClass || '12').replace(/^Lớp\s*/i, '').trim();
    const cleanName = (studentName || 'HocSinh').replace(/[/\\?%*:|"<>]/g, '_').trim();
    a.download = signedDocFileName || `[${cleanClass}] - ${cleanName} - Don_Dang_Ky_Online.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Tự động ghép chữ ký vào mẫu A4 và nộp thẳng lên Google Drive
  const handleGenerateAndUploadESignedDoc = async () => {
    if (!studentName || !studentClass) {
      return alert("Vui lòng nhập và chọn đúng họ tên học sinh ở Bước 1 trước khi tạo đơn.");
    }
    if (!parentSignature) {
      return alert("⚠️ Cha Mẹ / Người giám hộ chưa ký tên. Vui lòng bấm vào ô 'Bấm để Ký tên (Cha/Mẹ)' ở trên!");
    }
    if (!studentSignature) {
      return alert("⚠️ Học sinh chưa ký tên. Vui lòng bấm vào ô 'Bấm để Ký tên (Học sinh)' ở trên!");
    }

    const chosenSubjects = getSelectedTuitionSubjectsList();
    if (chosenSubjects.length === 0) {
      if (!window.confirm("Em chưa tích chọn môn học nào ở Bước 2. Em có chắc chắn muốn tiếp tục tạo đơn không?")) {
        return;
      }
    }

    setIsGeneratingESignedDoc(true);
    setSignedDocError('');

    try {
      // Đợi DOM cập nhật nội dung văn bản
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!paperRef.current) {
        throw new Error("Không tìm thấy khung mẫu văn bản.");
      }

      // Render thành Canvas ảnh chất lượng cao 2x
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const base64Data = canvas.toDataURL('image/png');
      const cleanClass = (studentClass || '12').replace(/^Lớp\s*/i, '').trim();
      const cleanName = (studentName || 'HocSinh').replace(/[/\\?%*:|"<>]/g, '_').trim();
      const cleanCode = (studentCode || 'HS').trim();
      const fileName = `[${cleanClass}] - ${cleanName} (${cleanCode}) - Don_Dang_Ky_Online.png`;

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const fileObj = new File([blob], fileName, { type: 'image/png' });

      let driveSuccess = false;
      const scriptUrl = selectedCampaign?.google_drive_script_url || selectedCampaign?.form_schema?.google_drive_script_url;
      const parentFolderId = selectedCampaign?.google_drive_folder_id || selectedCampaign?.form_schema?.google_drive_folder_id;

      if (scriptUrl) {
        try {
          const driveRes = await uploadFileToGoogleDrive({
            scriptUrl,
            file: fileObj,
            studentClass: cleanClass,
            studentName,
            studentCode: cleanCode,
            campaignTitle: selectedCampaign?.title || 'Đăng ký học thêm',
            parentFolderId
          });

          if (driveRes && driveRes.status === 'success') {
            setSignedDocDriveLink(driveRes.fileUrl);
            setSignedDocClassFolderUrl(driveRes.classFolderUrl);
            setSignedDocSource('google_drive');
            driveSuccess = true;
          }
        } catch (driveErr) {
          console.warn("Lưu Google Drive gặp sự cố, chuyển sang lưu trực tiếp:", driveErr);
        }
      }

      if (!driveSuccess) {
        setSignedDocSource('e_signature');
      }

      setSignedDocUrl(base64Data);
      setSignedDocFileName(fileName);
      setSignedDocFile(fileObj);

      alert(`🎉 KÝ TÊN & TẠO ĐƠN THÀNH CÔNG!\n\nĐơn đăng ký học thêm của em đã được tự động ghép chữ ký của Cha Mẹ và Học sinh${driveSuccess ? ` và đã lưu thẳng vào Thư mục Lớp ${cleanClass} trên Google Drive!` : '!'}\n\nEm vui lòng kiểm tra lại đơn và bấm nút "GỬI ĐĂNG KÝ" bên dưới để hoàn tất.`);
    } catch (err) {
      console.error("Lỗi khi tạo đơn ký điện tử:", err);
      setSignedDocError(err.message || "Lỗi khi tạo đơn ký điện tử. Vui lòng thử lại!");
      alert("Lỗi khi tạo đơn ký điện tử: " + err.message);
    } finally {
      setIsGeneratingESignedDoc(false);
    }
  };

  // Lọc các đợt không bị ẩn bởi Quản trị viên
  const visibleCampaigns = useMemo(() => {
    return campaigns.filter(c => !isCampaignHidden(c));
  }, [campaigns]);

  const openCampaignsCount = useMemo(() => {
    return visibleCampaigns.filter(c => !getCampaignStatus(c).isLocked).length;
  }, [visibleCampaigns]);

  const closedCampaignsCount = useMemo(() => {
    return visibleCampaigns.filter(c => getCampaignStatus(c).isLocked).length;
  }, [visibleCampaigns]);

  const displayedCampaigns = useMemo(() => {
    if (statusFilter === 'open') {
      return visibleCampaigns.filter(c => !getCampaignStatus(c).isLocked);
    }
    if (statusFilter === 'closed') {
      return visibleCampaigns.filter(c => getCampaignStatus(c).isLocked);
    }
    return visibleCampaigns;
  }, [visibleCampaigns, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      return alert("Bạn phải chọn đúng họ tên và mã học sinh từ danh sách gợi ý để đăng ký.");
    }
    if (!studentCode) {
      return alert("Lỗi: Không tìm thấy Mã học sinh.");
    }

    // Kiểm tra điều kiện CLB
    if (clubEligibility && clubEligibility.eligible === false) {
      return alert(`⛔ Bạn không đủ điều kiện đăng ký đợt này vì chưa có tên trong danh sách đăng ký ${clubEligibility.requiredClub}.`);
    }

    // Kiểm tra điều kiện Môn tự chọn (đối với Đăng ký Học thêm Khối 12)
    if (isTuitionCampaign(selectedCampaign)) {
      for (const field of currentSchemaFields) {
        // CHỈ kiểm tra các trường chọn môn học thêm, bỏ qua trường cam kết, ý kiến, v.v.
        if (!isTuitionSubjectField(field)) continue;

        const val = responses[field.id];
        const chosenList = Array.isArray(val) ? val : [val].filter(Boolean);
        for (const chosen of chosenList) {
          const norm = normalizeSubjectName(chosen);
          if (ALL_TUITION_SUBJECTS.includes(norm)) {
            if (!isSubjectAllowedForStudent(norm, studentElectives)) {
              return alert(`⛔ Môn "${chosen}" không hợp lệ!\n\nTheo quy định của nhà trường, em chỉ được đăng ký môn Toán, Ngữ Văn (toàn khối 12) và 02 môn tự chọn mà em đã đăng ký (${studentElectives.join(', ') || 'Chưa có dữ liệu môn tự chọn'}).`);
            }
          }
        }
      }
    }

    // Validate required fields
    for (const field of currentSchemaFields) {
      if (field.required) {
        const val = responses[field.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          return alert(`Vui lòng chọn hoặc trả lời: "${field.label}"`);
        }
      }
    }

    // Kiểm tra điều kiện nộp đơn có chữ ký (đối với Đăng ký Học thêm / requires_signed_document)
    if (requiresSignedDocument) {
      const hasUploadedFile = Boolean(signedDocUrl);
      const hasDriveUrl = Boolean(signedDocDriveLink && signedDocDriveLink.trim().length > 6);
      if (!hasUploadedFile && !hasDriveUrl) {
        alert("⛔ BƯỚC BẮT BUỘC: Em chưa hoàn tất nộp Đơn đăng ký có chữ ký!\n\nTheo quy định của nhà trường:\n1. Em cần bấm nút [Tải Đơn Đăng Ký (Word)] hoặc [Xem & In Trực Tiếp].\n2. In hoặc xin chữ ký của Cha Mẹ học sinh và ký tên em.\n3. Chụp ảnh rõ nét / scan file PDF tải lên, HOẶC dán link Google Drive của đơn vào ô Bước 3 bên dưới để hoàn tất đăng ký.");
        const sectionEl = document.getElementById('step-signed-doc-section');
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
    }

    setSubmitting(true);
    try {
      const finalResponses = {
        ...responses,
        field_signed_doc_url: signedDocUrl || '',
        field_signed_doc_name: signedDocFileName || '',
        field_drive_link: (signedDocDriveLink || '').trim(),
        field_class_folder_url: (signedDocClassFolderUrl || '').trim(),
        field_doc_storage_type: signedDocSource || (signedDocDriveLink ? 'google_drive' : 'supabase'),
        field_has_signed_doc: Boolean(signedDocUrl || signedDocDriveLink?.trim())
      };

      const payload = {
        campaign_id: selectedCampaign.id,
        student_code: studentCode,
        student_name: studentName,
        student_class: studentClass,
        responses: finalResponses
      };

      const targetClient = (selectedCampaign._source === 'sb1' && supabase) ? supabase : (supabase2 || supabase);
      const { error } = await targetClient.from('cbq_student_registrations').insert([payload]);

      if (error) {
        if (error.code === '23505') {
          alert("Bạn đã đăng ký đợt này rồi. Mỗi học sinh chỉ được nộp 1 lần.");
        } else {
          throw error;
        }
      } else {
        setSubmittedData({
          studentName,
          studentClass,
          studentCode,
          responses: finalResponses,
          campaignTitle: selectedCampaign.title,
          signedDocUrl,
          signedDocFileName,
          signedDocDriveLink,
          signedDocClassFolderUrl,
          signedDocSource,
          isTuition: isTuitionCampaign(selectedCampaign)
        });
        setSuccess(true);
      }
    } catch (err) {
      alert("Lỗi khi nộp: " + (err.message || 'Không thể lưu bản ghi'));
    } finally {
      setSubmitting(false);
    }
  };

  // Quay lại Cổng Đăng Ký từ màn hình thành công
  const handleBackToPortal = () => {
    setSuccess(false);
    setSelectedCampaign(null);
    setSubmittedData(null);
    setIsVerified(false);
    setStudentName('');
    setStudentClass('');
    setStudentCode('');
    setSuggestions([]);
    setShowSuggestions(false);
    setShowClassSuggestions(false);
    setClubEligibility(null);
    setStudentElectives([]);
    setElectiveSource('');
    setCheckingElectives(false);
    setSignedDocFile(null);
    setSignedDocUrl('');
    setSignedDocFileName('');
    setSignedDocDriveLink('');
    setSignedDocClassFolderUrl('');
    setSignedDocSource('');
    setSignedDocError('');
    setUploadMethod('sign');
    setParentSignature(null);
    setStudentSignature(null);
    setResponses({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trích xuất môn phụ đã chọn sau khi nộp thành công để hiện nút Zalo
  const submittedSubDiscipline = useMemo(() => {
    if (!submittedData || !subDisciplinesList || subDisciplinesList.length === 0) return null;
    const ansValues = Object.values(submittedData.responses || {}).flat();
    for (const sub of subDisciplinesList) {
      if (ansValues.some(v => String(v).includes(sub.name) || String(v).includes(sub.code))) {
        return sub;
      }
    }
    return subDisciplinesList[0] || null;
  }, [submittedData, subDisciplinesList]);

  if (success) {
    const hasSignedProof = Boolean(submittedData?.signedDocUrl || submittedData?.signedDocDriveLink);

    return (
      <div style={{ maxWidth: '650px', margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '36px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
          <CheckCircle2 size={68} color="#10b981" style={{ margin: '0 auto', marginBottom: '16px' }} />
          <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0' }}>Đăng Ký Thành Công!</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            Chúc mừng em <strong>{submittedData?.studentName}</strong> (Lớp <strong>{submittedData?.studentClass}</strong>) đã hoàn tất đăng ký <strong>"{selectedCampaign?.title}"</strong>.
          </p>

          {/* XÁC NHẬN MINH CHỨNG ĐƠN ĐÃ NỘP (DÀNH CHO ĐỢT HỌC THÊM) */}
          {hasSignedProof && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '2px solid #86efac',
              borderRadius: '16px',
              padding: '18px',
              textAlign: 'left',
              marginBottom: '22px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#166534', fontWeight: '800', fontSize: '15px' }}>
                <FileCheck size={20} color="#15803d" />
                <span>Minh Chứng Đơn Đăng Ký Có Chữ Ký: Đã Ghi Nhận</span>
              </div>

              <div style={{ fontSize: '13px', color: '#334155', background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {submittedData.signedDocUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} color="#16a34a" />
                      <strong>File đơn đã nộp:</strong> {submittedData.signedDocFileName || 'Đơn đăng ký có chữ ký'}
                    </span>
                    <a
                      href={submittedData.signedDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '4px 10px',
                        background: '#0284c7',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={13} /> Xem lại file đơn
                    </a>
                  </div>
                )}

                {submittedData.signedDocDriveLink && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HardDrive size={16} color="#0284c7" />
                      <strong>Link Google Drive:</strong>
                      <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0284c7' }}>
                        {submittedData.signedDocDriveLink}
                      </span>
                    </span>
                    <a
                      href={submittedData.signedDocDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '4px 10px',
                        background: '#0284c7',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ExternalLink size={13} /> Mở Drive
                    </a>
                  </div>
                )}

                {submittedData.signedDocClassFolderUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                      <FolderOpen size={15} color="#15803d" />
                      <strong>Thư mục lưu trữ:</strong> Lớp {submittedData.studentClass}
                    </span>
                    <a
                      href={submittedData.signedDocClassFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '4px 10px',
                        background: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #86efac',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FolderOpen size={13} /> Mở Thư Mục Lớp
                    </a>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Cần lưu lại bản mềm đơn đã điền thông tin?</span>
                  <button
                    type="button"
                    onClick={handleDownloadApplication}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline'
                    }}
                  >
                    <Download size={13} /> 📥 Tải lại đơn Word (.doc)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NẾU ĐĂNG KÝ MÔN PHỤ -> HIỆN THÔNG TIN NHÓM ZALO VÀ LỊCH TẬP NGAY */}
          {submittedSubDiscipline && (
            <div style={{ 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', 
              border: '2px solid #86efac', 
              borderRadius: '16px', 
              padding: '20px', 
              textAlign: 'left',
              marginBottom: '25px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>{submittedSubDiscipline.icon}</span>
                <div>
                  <h4 style={{ margin: 0, color: '#166534', fontSize: '17px', fontWeight: '800' }}>
                    Phân môn: {submittedSubDiscipline.name}
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#15803d', fontWeight: '600' }}>
                    Thuộc {requiredClubName || 'Câu lạc bộ'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: '#334155', background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="#059669" /> <strong>Địa điểm:</strong> {submittedSubDiscipline.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="#059669" /> <strong>Thời gian:</strong> {submittedSubDiscipline.schedule}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} color="#059669" /> <strong>Phụ trách:</strong> {submittedSubDiscipline.coaches.join(', ')}
                </div>
              </div>

              {submittedSubDiscipline.zaloUrl ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13.5px', color: '#166534', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                    👉 BƯỚC TIẾP THEO: Em vui lòng bấm nút dưới đây để tham gia ngay nhóm Zalo môn {submittedSubDiscipline.name}:
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                      href={submittedSubDiscipline.zaloUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '11px 22px',
                        background: '#0284c7',
                        color: '#ffffff',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <ExternalLink size={16} /> Vào Nhóm Zalo Môn {submittedSubDiscipline.name}
                    </a>
                    <button
                      onClick={() => setQrModalItem(submittedSubDiscipline)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '11px 18px',
                        background: '#ffffff',
                        color: '#0369a1',
                        border: '1.5px solid #0284c7',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <QrCode size={16} /> Quét QR Zalo
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#166534', textAlign: 'center', fontStyle: 'italic' }}>
                  Giáo viên phụ trách sẽ liên hệ và thêm em vào nhóm Zalo sinh hoạt qua số điện thoại em đã cung cấp.
                </p>
              )}
            </div>
          )}

          <button 
            type="button"
            onClick={handleBackToPortal} 
            style={{ 
              padding: '12px 28px', 
              background: '#be123c', 
              color: 'white', 
              borderRadius: '10px', 
              border: 'none', 
              fontWeight: 'bold', 
              fontSize: '14.5px', 
              cursor: 'pointer', 
              boxShadow: '0 4px 15px rgba(190, 18, 60, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s'
            }}
          >
            ← Quay lại Cổng Đăng Ký
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '750px', margin: '40px auto', padding: '0 16px' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0284c7 100%)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(30, 27, 75, 0.2)'
      }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '25px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 10px rgba(0,0,0,0.6)', fontWeight: '800' }}>
          📝 CỔNG ĐĂNG KÝ HOẠT ĐỘNG
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#e0f2fe', fontWeight: '500' }}>
          Trường THPT Cao Bá Quát - Tân An
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '0 0 20px 20px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderTop: 'none' }}>
        
        {!selectedCampaign ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, color: '#334155' }}>
                Danh sách đợt đăng ký ({displayedCampaigns.length})
              </h3>

              {/* BỘ LỌC TRẠNG THÁI: ĐANG MỞ (MẶC ĐỊNH) / ĐÃ ĐÓNG / TẤT CẢ */}
              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setStatusFilter('open')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: statusFilter === 'open' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'open' ? '#16a34a' : '#64748b',
                    fontWeight: statusFilter === 'open' ? '800' : '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'open' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}
                  title="Chỉ hiển thị các đợt đang mở tiếp nhận hồ sơ"
                >
                  <span>🟢 Đang mở</span>
                  <span style={{ fontSize: '11px', background: statusFilter === 'open' ? '#dcfce7' : '#e2e8f0', color: statusFilter === 'open' ? '#15803d' : '#475569', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {openCampaignsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('closed')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: statusFilter === 'closed' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'closed' ? '#dc2626' : '#64748b',
                    fontWeight: statusFilter === 'closed' ? '800' : '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'closed' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}
                  title="Xem các đợt đã tạm khóa hoặc kết thúc"
                >
                  <span>🔴 Đã khóa</span>
                  <span style={{ fontSize: '11px', background: statusFilter === 'closed' ? '#fee2e2' : '#e2e8f0', color: statusFilter === 'closed' ? '#b91c1c' : '#475569', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {closedCampaignsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: statusFilter === 'all' ? '#ffffff' : 'transparent',
                    color: statusFilter === 'all' ? '#0f172a' : '#64748b',
                    fontWeight: statusFilter === 'all' ? '800' : '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}
                  title="Hiển thị toàn bộ các đợt"
                >
                  <span>Tất cả</span>
                  <span style={{ fontSize: '11px', background: statusFilter === 'all' ? '#e2e8f0' : '#cbd5e1', color: '#334155', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {visibleCampaigns.length}
                  </span>
                </button>
              </div>
            </div>

            {/* CHÚ THÍCH GỢI Ý KHI ĐANG ẨN ĐỢT ĐÃ KHÓA */}
            {statusFilter === 'open' && closedCampaignsCount > 0 && (
              <div style={{ marginBottom: '14px', fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span>✨ Đang ẩn <strong>{closedCampaignsCount} đợt đã khóa</strong> để giao diện gọn gàng.</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('closed')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  Xem đợt đã khóa →
                </button>
              </div>
            )}

            {displayedCampaigns.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '600', color: '#475569' }}>
                  {statusFilter === 'open' ? 'Hiện tại không có đợt đăng ký nào đang mở.' : statusFilter === 'closed' ? 'Không có đợt nào đang bị khóa.' : 'Hiện tại chưa có đợt đăng ký nào.'}
                </p>
                {statusFilter === 'open' && closedCampaignsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    style={{ padding: '6px 14px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Xem tất cả ({visibleCampaigns.length} đợt)
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {displayedCampaigns.map(cam => {
                  const status = getCampaignStatus(cam);
                  const reqClub = getPrerequisiteClub(cam);
                  return (
                    <div 
                      key={cam.id} 
                      onClick={() => selectCampaign(cam)} 
                      style={{ 
                        border: status.isLocked ? '1px solid #fca5a5' : '1px solid #cbd5e1', 
                        borderRadius: '12px', 
                        padding: '16px', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s', 
                        background: status.isLocked ? '#fff5f5' : '#ffffff',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', color: status.isLocked ? '#991b1b' : '#0284c7', fontSize: '16px' }}>
                            {cam.title}
                          </h4>
                          {reqClub && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', marginBottom: '8px' }}>
                              <ShieldCheck size={13} /> Yêu cầu thành viên: {reqClub}
                            </span>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          whiteSpace: 'nowrap',
                          background: status.code === 'open' ? '#f0fdf4' : status.code === 'locked' ? '#fef2f2' : '#fff7ed',
                          color: status.code === 'open' ? '#16a34a' : status.code === 'locked' ? '#ef4444' : '#ea580c',
                          border: status.code === 'open' ? '1px solid #86efac' : '1px solid #fca5a5'
                        }}>
                          {status.label}
                        </span>
                      </div>
                      
                      {cam.description && <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#64748b' }}>{cam.description}</p>}
                      
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ padding: '3px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          Đối tượng: {!cam.target_grades || cam.target_grades.length === 0 ? 'Tất cả học sinh' : cam.target_grades.join(', ')}
                        </div>
                        {cam.end_date && (
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Hạn chót: {new Date(cam.end_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedCampaign(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '15px', padding: 0 }}>
              ← Quay lại danh sách
            </button>
            <h3 style={{ margin: '0 0 10px 0', color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              {selectedCampaign.title}
            </h3>
            {selectedCampaign.description && (
              <p style={{ fontSize: '14px', color: '#475569', background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                {selectedCampaign.description}
              </p>
            )}

            {/* CẢNH BÁO YÊU CẦU ĐÃ ĐĂNG KÝ CLB NẾU CÓ */}
            {requiredClubName && (
              <div style={{ 
                background: '#fffbeb', 
                border: '1.5px solid #fde68a', 
                borderRadius: '10px', 
                padding: '12px 16px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#92400e',
                fontSize: '13.5px'
              }}>
                <ShieldCheck size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Lưu ý điều kiện tham gia:</strong> Đợt đăng ký này chỉ dành cho các học sinh <strong>đã đăng ký tham gia {requiredClubName}</strong> ở đợt 1.
                </div>
              </div>
            )}

            {/* HIỂN THỊ CẢNH BÁO NẾU ĐỢT ĐĂNG KÝ BỊ KHÓA / HẾT HẠN */}
            {getCampaignStatus(selectedCampaign).isLocked ? (
              <div style={{ 
                background: '#fef2f2', 
                border: '2px solid #fca5a5', 
                borderRadius: '16px', 
                padding: '30px 20px', 
                textAlign: 'center', 
                marginTop: '20px',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.08)'
              }}>
                <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <Lock size={32} color="#ef4444" />
                </div>
                <h3 style={{ color: '#991b1b', margin: '0 0 10px 0', fontSize: '20px', fontWeight: 'bold' }}>
                  Đợt Đăng Ký Đã Tạm Khóa Hoặc Hết Hạn
                </h3>
                <div style={{ color: '#7f1d1d', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px auto', background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                  {getCampaignStatus(selectedCampaign).message}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
                  Nếu có thắc mắc hoặc cần bổ sung thông tin, em vui lòng liên hệ Văn phòng nhà trường hoặc Giáo viên chủ nhiệm để được hỗ trợ.
                </p>
                <button 
                  onClick={() => setSelectedCampaign(null)} 
                  style={{ padding: '10px 24px', background: '#475569', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  ← Quay lại danh sách đợt đăng ký
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
              
              {/* PHẦN XÁC THỰC DANH TÍNH */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="#0284c7" /> 1. Xác thực học sinh
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                  <div style={{ position: 'relative' }} ref={classDropdownRef}>
                    <label style={styles.label}>Lớp học (*)</label>
                    <input 
                      type="text" 
                      value={studentClass} 
                      onChange={e => handleClassChange(e.target.value)} 
                      onFocus={() => filterClassSuggestions(studentClass)}
                      style={styles.input} 
                      placeholder="Gõ tìm lớp... (VD: 12A01)" 
                      disabled={isVerified}
                    />
                    {showClassSuggestions && (
                      <ul style={styles.dropdown}>
                        {classSuggestions.map((cls, i) => (
                          <li key={i} style={styles.dropdownItem} onClick={() => handleSelectClassSuggestion(cls)}>
                            {cls}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <label style={styles.label}>Họ và Tên Học sinh (*)</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        value={studentName} 
                        onChange={e => handleNameChange(e.target.value)} 
                        onFocus={() => filterNameSuggestions(studentName)}
                        style={{ ...styles.input, paddingLeft: '34px' }} 
                        placeholder="Gõ tìm họ tên hoặc mã HS..." 
                        disabled={isVerified}
                      />
                    </div>
                    {showSuggestions && (
                      <ul style={styles.dropdown}>
                        {suggestions.length === 0 ? (
                          <li style={{ padding: '10px', color: '#94a3b8', fontSize: '13px' }}>Không tìm thấy học sinh phù hợp</li>
                        ) : suggestions.map((stu) => (
                          <li key={stu.id} style={styles.dropdownItem} onClick={() => handleSelectSuggestion(stu)}>
                            <strong style={{ color: '#0f172a' }}>{stu.student_name}</strong> - Lớp <span style={{ color: '#be123c' }}>{stu.student_class}</span> (Mã HS: {stu.student_code})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {checkingClubEligibility && (
                    <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} className="animate-spin" /> Đang kiểm tra tư cách thành viên câu lạc bộ trên CSDL...
                    </div>
                  )}

                  {checkingElectives && (
                    <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #86efac', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} className="animate-spin" /> Đang tra cứu danh sách 02 môn tự chọn đã đăng ký của em trên CSDL...
                    </div>
                  )}

                  {/* THÔNG BÁO XÁC THỰC THÀNH CÔNG VÀ ĐỦ ĐIỀU KIỆN CLB */}
                  {isVerified && clubEligibility?.eligible === true && (
                    <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '10px', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '13.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '4px' }}>
                        <CheckCircle2 size={18} color="#059669" /> Đã xác thực danh tính hợp lệ
                        <button type="button" onClick={() => { setIsVerified(false); setClubEligibility(null); setStudentElectives([]); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#059669', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>Đổi học sinh khác</button>
                      </div>
                      {clubEligibility.requiredClub && (
                        <div style={{ fontSize: '12.5px', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <ShieldCheck size={15} /> Xác nhận: Học sinh đã đăng ký <strong>{clubEligibility.requiredClub}</strong> ở đợt 1.
                        </div>
                      )}
                    </div>
                  )}

                  {/* THẺ ĐỊNH DANH MÔN TỰ CHỌN GDPT 2018 (ĐỐI VỚI ĐỢT HỌC THÊM KHỐI 12) */}
                  {isVerified && isTuitionCampaign(selectedCampaign) && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                      border: '2px solid #86efac',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <GraduationCap size={22} color="#059669" />
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#065f46' }}>
                          Quy định Đăng ký Học thêm Khối 12 (Chương trình GDPT 2018)
                        </span>
                      </div>

                      <div style={{ background: '#ffffff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #bbf7d0', marginBottom: '10px' }}>
                        <div style={{ fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                          🎯 <strong>02 Môn tự chọn em đã đăng ký:</strong>
                        </div>
                        {studentElectives.length > 0 ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {studentElectives.map(s => {
                              const meta = SUBJECT_METADATA[normalizeSubjectName(s)] || {};
                              return (
                                <span key={s} style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 12px',
                                  borderRadius: '999px',
                                  backgroundColor: meta.bg || '#eff6ff',
                                  color: meta.color || '#1e40af',
                                  border: `1.5px solid ${meta.border || '#bfdbfe'}`,
                                  fontWeight: '700',
                                  fontSize: '13px'
                                }}>
                                  <span>{meta.icon || '📚'}</span>
                                  <span>{s}</span>
                                  <CheckCircle2 size={14} color={meta.color || '#16a34a'} />
                                </span>
                              );
                            })}
                            <span style={{ fontSize: '12px', color: '#059669', fontStyle: 'italic', marginLeft: '6px' }}>
                              (Đã xác thực từ hệ thống CSDL môn tự chọn)
                            </span>
                          </div>
                        ) : (
                          <div style={{ color: '#b45309', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertTriangle size={16} color="#d97706" />
                            <span>Chưa tìm thấy dữ liệu đăng ký 02 môn tự chọn của em. Em vẫn có thể đăng ký 2 môn chung (Toán, Văn).</span>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#166534', lineHeight: '1.6', background: 'rgba(255,255,255,0.7)', padding: '10px 12px', borderRadius: '8px' }}>
                        <div>📘 <strong>Môn Toán & Ngữ Văn:</strong> Mở cho <strong>toàn bộ học sinh Khối 12</strong> (Môn thi bắt buộc).</div>
                        <div>⚡ <strong>Môn tự chọn:</strong> Em <strong>chỉ được phép chọn học thêm đúng 02 môn tự chọn đã đăng ký</strong> ({studentElectives.length > 0 ? studentElectives.join(' & ') : 'theo hồ sơ của em'}). Hệ thống tự động khóa các môn khác.</div>
                      </div>
                    </div>
                  )}

                  {/* THÔNG BÁO KHÔNG ĐỦ ĐIỀU KIỆN (CHƯA ĐĂNG KÝ CLB MẸ) */}
                  {isVerified && clubEligibility?.eligible === false && (
                    <div style={{ 
                      background: '#fef2f2', 
                      border: '2px solid #fca5a5', 
                      borderRadius: '12px', 
                      padding: '16px', 
                      color: '#991b1b' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                        <ShieldAlert size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800' }}>
                            Không đủ điều kiện đăng ký môn phụ này
                          </h5>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13.5px', lineHeight: '1.5' }}>
                            Em <strong>{studentName}</strong> (Lớp <strong>{studentClass}</strong>) <strong>chưa đăng ký tham gia {clubEligibility.requiredClub}</strong> trong đợt đăng ký câu lạc bộ trước đó.
                          </p>
                          <div style={{ fontSize: '13px', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '8px' }}>
                            <strong>Các câu lạc bộ em đã đăng ký:</strong>
                            {clubEligibility.registeredClubs.length > 0 ? (
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {clubEligibility.registeredClubs.map((c, i) => (
                                  <li key={i} style={{ color: '#0284c7', fontWeight: '600' }}>{c}</li>
                                ))}
                              </ul>
                            ) : (
                              <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>Em chưa đăng ký tham gia câu lạc bộ nào trong năm học này.</span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '12.5px', color: '#7f1d1d' }}>
                            💡 Em chỉ có thể chọn môn phụ của những câu lạc bộ mà em đã đăng ký. Vui lòng liên hệ Thầy/Cô Ban Chủ nhiệm nếu cần đăng ký bổ sung.
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setIsVerified(false); setClubEligibility(null); setStudentName(''); setStudentCode(''); }} 
                        style={{ padding: '6px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', display: 'block', margin: '10px auto 0 auto' }}
                      >
                        Chọn học sinh khác
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* DYNAMIC FORM FIELDS (CHỈ HIỆN KHI ĐÃ XÁC THỰC VÀ ĐỦ ĐIỀU KIỆN) */}
              {isVerified && clubEligibility?.eligible === true && (
                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#be123c" /> 2. Nhập thông tin đăng ký
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {currentSchemaFields.map(field => {
                      // Kiểm tra xem field này có phải là chọn môn phụ không
                      const isSubDisciplineField = field.id === 'field_sub_discipline' || 
                        (field.label && (field.label.toLowerCase().includes('môn phụ') || field.label.toLowerCase().includes('phân môn') || field.label.toLowerCase().includes('bộ môn')));

                      return (
                        <div key={field.id}>
                          <label style={styles.label}>
                            {field.label} {field.required && <span style={{ color: '#ef4444' }}>(*)</span>}
                          </label>
                          
                          {/* NẾU LÀ MÔN PHỤ -> HIỂN THỊ THẺ MÔN TRỰC QUAN KÈM LỊCH TẬP & NHÓM ZALO */}
                          {isSubDisciplineField && subDisciplinesList.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '8px' }}>
                              {subDisciplinesList.map(sub => {
                                const isSelected = (responses[field.id] || '').includes(sub.name) || responses[field.id] === sub.name;
                                return (
                                  <div
                                    key={sub.id}
                                    onClick={() => handleResponseChange(field.id, sub.name, 'select')}
                                    style={{
                                      border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                                      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                      borderRadius: '14px',
                                      padding: '16px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      boxShadow: isSelected ? '0 4px 15px rgba(2, 132, 199, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                                      position: 'relative'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '26px' }}>{sub.icon}</span>
                                        <div>
                                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: isSelected ? '#0369a1' : '#0f172a' }}>
                                            {sub.name}
                                          </h4>
                                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            {sub.description}
                                          </span>
                                        </div>
                                      </div>

                                      <input 
                                        type="radio"
                                        name={field.id}
                                        checked={isSelected}
                                        onChange={() => handleResponseChange(field.id, sub.name, 'select')}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7', marginTop: '4px' }}
                                      />
                                    </div>

                                    {/* THÔNG TIN LỊCH TẬP & ĐỊA ĐIỂM & GIÁO VIÊN */}
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                      gap: '8px', 
                                      marginTop: '12px', 
                                      padding: '10px 12px', 
                                      background: isSelected ? '#e0f2fe' : '#f8fafc', 
                                      borderRadius: '10px',
                                      fontSize: '12.5px',
                                      color: '#334155'
                                    }}>
                                      <div>
                                        <MapPin size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#0284c7' }} />
                                        <strong>Địa điểm:</strong> {sub.location}
                                      </div>
                                      <div>
                                        <Calendar size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#0284c7' }} />
                                        <strong>Thời gian:</strong> {sub.schedule}
                                      </div>
                                      <div>
                                        <Users size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#0284c7' }} />
                                        <strong>Phụ trách:</strong> {sub.coaches.join(', ')}
                                      </div>
                                    </div>

                                    {/* NÚT THAM GIA ZALO & MÃ QR */}
                                    {sub.zaloUrl && (
                                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                                        <a 
                                          href={sub.zaloUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '6px 12px',
                                            background: '#0284c7',
                                            color: '#ffffff',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            textDecoration: 'none'
                                          }}
                                        >
                                          <ExternalLink size={13} /> Nhóm Zalo
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => setQrModalItem(sub)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '6px 10px',
                                            background: '#ffffff',
                                            color: '#0369a1',
                                            border: '1px solid #0284c7',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <QrCode size={13} /> Xem QR
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <>
                              {field.type === 'text' && (
                                <input 
                                  type="text" 
                                  style={styles.input} 
                                  value={responses[field.id] || ''}
                                  onChange={(e) => handleResponseChange(field.id, e.target.value, 'text')}
                                  required={field.required}
                                  placeholder={field.label.includes('điện thoại') ? 'Nhập số điện thoại (VD: 0912345678)' : ''}
                                />
                              )}

                              {field.type === 'textarea' && (
                                <textarea 
                                  rows={3}
                                  style={styles.input} 
                                  value={responses[field.id] || ''}
                                  onChange={(e) => handleResponseChange(field.id, e.target.value, 'textarea')}
                                  required={field.required}
                                />
                              )}

                              {field.type === 'select' && (
                                <select 
                                  style={styles.input}
                                  value={responses[field.id] || ''}
                                  onChange={(e) => handleResponseChange(field.id, e.target.value, 'select')}
                                  required={field.required}
                                >
                                  <option value="">-- Lựa chọn --</option>
                                  {(field.options || []).map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}

                              {field.type === 'radio' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                  {(field.options || []).map((opt, idx) => (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                                      <input 
                                        type="radio" 
                                        name={field.id}
                                        value={opt}
                                        checked={responses[field.id] === opt}
                                        onChange={(e) => handleResponseChange(field.id, e.target.value, 'radio')}
                                        required={field.required}
                                      />
                                      {opt}
                                    </label>
                                  ))}
                                </div>
                              )}

                              {field.type === 'checkbox' && (() => {
                                const isTuitionSubjField = isTuitionCampaign(selectedCampaign) && isTuitionSubjectField(field);

                                if (!isTuitionSubjField) {
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                      {(field.options || []).map((opt, idx) => {
                                        const isChecked = (responses[field.id] || []).includes(opt);
                                        const isCommitment = field.id === 'field_tuition_commitment' || field.label?.toLowerCase().includes('cam kết');
                                        return (
                                          <label 
                                            key={idx} 
                                            style={{ 
                                              display: 'flex', 
                                              alignItems: 'flex-start', 
                                              gap: '10px', 
                                              fontSize: '13.5px', 
                                              cursor: 'pointer',
                                              padding: isCommitment ? '10px 14px' : '0',
                                              backgroundColor: isCommitment ? (isChecked ? '#f0fdf4' : '#f8fafc') : 'transparent',
                                              border: isCommitment ? (isChecked ? '1.5px solid #86efac' : '1px solid #e2e8f0') : 'none',
                                              borderRadius: isCommitment ? '10px' : '0',
                                              transition: 'all 0.15s ease'
                                            }}
                                          >
                                            <input 
                                              type="checkbox" 
                                              value={opt}
                                              checked={isChecked}
                                              onChange={(e) => handleResponseChange(field.id, e.target.value, 'checkbox')}
                                              style={{ marginTop: '3px', accentColor: '#16a34a', cursor: 'pointer', width: '17px', height: '17px' }}
                                            />
                                            <span style={{ fontWeight: isCommitment && isChecked ? '600' : 'normal', color: isCommitment && isChecked ? '#15803d' : '#334155', lineHeight: '1.45' }}>
                                              {opt}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  );
                                }

                                // GIAO DIỆN CHỌN MÔN HỌC THÊM THÔNG MINH CHO KHỐI 12
                                return (
                                  <div style={{ marginTop: '8px' }}>
                                    {/* Thanh phím tắt chọn nhanh */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const allowedNames = ['Toán', 'Ngữ Văn', ...studentElectives].map(normalizeSubjectName);
                                          const matchingOpts = (field.options || []).filter(o => allowedNames.includes(normalizeSubjectName(o)));
                                          setResponses({ ...responses, [field.id]: matchingOpts });
                                        }}
                                        style={{
                                          padding: '7px 14px',
                                          borderRadius: '8px',
                                          backgroundColor: '#f0fdf4',
                                          border: '1.5px solid #86efac',
                                          color: '#166534',
                                          fontWeight: '700',
                                          fontSize: '12.5px',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        ⚡ Chọn nhanh tất cả môn của em ({['Toán', 'Văn', ...(studentElectives.length > 0 ? studentElectives : ['2 môn tự chọn'])].join(' + ')})
                                      </button>

                                      {(responses[field.id] || []).length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setResponses({ ...responses, [field.id]: [] })}
                                          style={{
                                            padding: '7px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #cbd5e1',
                                            color: '#64748b',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Bỏ chọn
                                        </button>
                                      )}
                                    </div>

                                    {/* Danh sách từng môn học */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                                      {(field.options || []).map((opt, idx) => {
                                        const normOpt = normalizeSubjectName(opt);
                                        const isCore = isCoreSubject(normOpt);
                                        const isElective = studentElectives.map(normalizeSubjectName).includes(normOpt);
                                        const isAllowed = isCore || isElective;
                                        const isChecked = (responses[field.id] || []).includes(opt);
                                        const meta = SUBJECT_METADATA[normOpt] || { icon: '📘', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };

                                        return (
                                          <div
                                            key={idx}
                                            onClick={() => {
                                              if (isAllowed) {
                                                handleResponseChange(field.id, opt, 'checkbox');
                                              } else {
                                                alert(`⛔ Môn "${opt}" không thuộc 02 môn tự chọn của em!\n\nTheo quy định của nhà trường, em chỉ được đăng ký môn Toán, Ngữ Văn (toàn khối 12) và 02 môn tự chọn đã đăng ký (${studentElectives.join(', ') || 'Chưa có dữ liệu môn tự chọn'}).`);
                                              }
                                            }}
                                            style={{
                                              border: isChecked ? `2px solid ${meta.color}` : isAllowed ? `1.5px solid #cbd5e1` : '1px dashed #cbd5e1',
                                              backgroundColor: isChecked ? meta.bg : isAllowed ? '#ffffff' : '#f8fafc',
                                              opacity: isAllowed ? 1 : 0.5,
                                              cursor: isAllowed ? 'pointer' : 'not-allowed',
                                              borderRadius: '10px',
                                              padding: '12px 14px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              gap: '10px',
                                              transition: 'all 0.15s',
                                              boxShadow: isChecked ? `0 2px 8px ${meta.border}` : 'none'
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                                              <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: isChecked ? meta.color : isAllowed ? '#1e293b' : '#94a3b8' }}>
                                                  {opt}
                                                </div>
                                                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                                                  {isCore ? (
                                                    <span style={{ color: '#0369a1', fontWeight: '700' }}>📘 Môn chung toàn Khối 12</span>
                                                  ) : isElective ? (
                                                    <span style={{ color: '#166534', fontWeight: '700' }}>✅ 02 Môn tự chọn của em</span>
                                                  ) : (
                                                    <span style={{ color: '#64748b' }}>🔒 Không thuộc 02 môn tự chọn</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <input 
                                              type="checkbox" 
                                              value={opt}
                                              disabled={!isAllowed}
                                              checked={isChecked}
                                              onChange={() => {}}
                                              style={{ width: '18px', height: '18px', cursor: isAllowed ? 'pointer' : 'not-allowed', accentColor: meta.color }}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* BƯỚC 3: TẢI ĐƠN ĐĂNG KÝ, KÝ TÊN VÀ NỘP MINH CHỨNG (*BẮT BUỘC KHI LÀ ĐỢT HỌC THÊM) */}
                  {requiresSignedDocument && (
                    <div id="step-signed-doc-section" style={{
                      marginTop: '30px',
                      padding: '22px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '16px',
                      border: (signedDocUrl || signedDocDriveLink?.trim()) ? '2px solid #86efac' : '2px solid #f59e0b',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '800' }}>
                          <FileCheck size={22} color="#be123c" />
                          3. Tải Đơn Đăng Ký, Ký Tên & Nộp File Minh Chứng
                          <span style={{ color: '#ef4444', fontSize: '13px' }}>(*Bắt buộc)</span>
                        </h4>
                        
                        {(signedDocUrl || signedDocDriveLink?.trim()) ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '800', backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', border: '1px solid #86efac' }}>
                            <CheckCircle2 size={14} /> Đã đính kèm đơn ký
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '800', backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                            <AlertTriangle size={14} /> Chưa nộp file minh chứng
                          </span>
                        )}
                      </div>

                      <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                        Theo quy định của Bộ GD&ĐT, học sinh đăng ký học thêm bắt buộc phải có <strong>Đơn đăng ký có ý kiến, chữ ký của Cha Mẹ học sinh và chữ ký của học sinh</strong>. Em hãy chọn 1 trong 3 cách thuận tiện nhất dưới đây:
                      </p>

                      {/* TAB CHUYỂN ĐỔI PHƯƠNG THỨC HOÀN TẤT ĐƠN */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                        <button
                          type="button"
                          onClick={() => setUploadMethod('sign')}
                          style={{
                            padding: '11px 12px',
                            borderRadius: '10px',
                            border: uploadMethod === 'sign' ? '2px solid #be123c' : '1px solid #cbd5e1',
                            background: uploadMethod === 'sign' ? '#fff1f2' : '#ffffff',
                            color: uploadMethod === 'sign' ? '#9f1239' : '#475569',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: uploadMethod === 'sign' ? '0 2px 8px rgba(190, 18, 60, 0.15)' : 'none',
                            transition: 'all 0.15s'
                          }}
                        >
                          <PenTool size={16} color={uploadMethod === 'sign' ? '#be123c' : '#64748b'} />
                          <span>✍️ Cách 1: Ký Trực Tiếp Trên Màn Hình</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUploadMethod('file')}
                          style={{
                            padding: '11px 12px',
                            borderRadius: '10px',
                            border: uploadMethod === 'file' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: uploadMethod === 'file' ? '#e0f2fe' : '#ffffff',
                            color: uploadMethod === 'file' ? '#0369a1' : '#475569',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: uploadMethod === 'file' ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none',
                            transition: 'all 0.15s'
                          }}
                        >
                          <UploadCloud size={16} color={uploadMethod === 'file' ? '#0284c7' : '#64748b'} />
                          <span>📄 Cách 2: In Ra Giấy & Tải Ảnh / PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUploadMethod('drive')}
                          style={{
                            padding: '11px 12px',
                            borderRadius: '10px',
                            border: uploadMethod === 'drive' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: uploadMethod === 'drive' ? '#e0f2fe' : '#ffffff',
                            color: uploadMethod === 'drive' ? '#0369a1' : '#475569',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: uploadMethod === 'drive' ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none',
                            transition: 'all 0.15s'
                          }}
                        >
                          <HardDrive size={16} color={uploadMethod === 'drive' ? '#0284c7' : '#64748b'} />
                          <span>🔗 Cách 3: Dán Link Google Drive</span>
                        </button>
                      </div>

                      {/* NỘI DUNG CÁCH 1: KÝ TRỰC TIẾP TRÊN MÀN HÌNH */}
                      {uploadMethod === 'sign' && (
                        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1.5px solid #fecdd3', padding: '16px' }}>
                          <div style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecdd3', marginBottom: '16px' }}>
                            <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <Sparkles size={16} color="#be123c" /> Ký điện tử 100% online — Nhanh chóng, không cần in giấy!
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#881337', lineHeight: '1.5' }}>
                              Cha Mẹ và Học sinh ký trực tiếp bằng <strong>ngón tay trên điện thoại</strong> hoặc <strong>chuột máy tính</strong>. Hệ thống sẽ tự động ghép thông tin và chữ ký vào tờ đơn A4 chuẩn Bộ GD&ĐT rồi lưu thẳng vào Thư mục Lớp trên Google Drive của trường.
                            </div>
                          </div>

                          {/* KHUNG Ý KIẾN VÀ 2 Ô CHỮ KÝ */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                            
                            {/* KHUNG 1: Ý KIẾN VÀ CHỮ KÝ CHA MẸ HỌC SINH */}
                            <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>👨‍👩‍👦 1. Ý kiến & Chữ ký của Cha/Mẹ học sinh:</span>
                                {parentSignature && (
                                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', marginLeft: 'auto' }}>
                                    ✓ Đã ký
                                  </span>
                                )}
                              </div>

                              <label style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Ý kiến của Cha Mẹ / Người giám hộ:</label>
                              <textarea
                                rows={2}
                                value={parentOpinion}
                                onChange={(e) => setParentOpinion(e.target.value)}
                                placeholder="Nhập ý kiến của Cha Mẹ..."
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '12.5px',
                                  boxSizing: 'border-box',
                                  marginBottom: '10px',
                                  fontFamily: 'inherit',
                                  resize: 'vertical'
                                }}
                              />

                              <div style={{ flex: 1, minHeight: '110px', background: '#ffffff', borderRadius: '8px', border: parentSignature ? '1.5px solid #86efac' : '1.5px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', position: 'relative' }}>
                                {parentSignature ? (
                                  <div style={{ width: '100%', textAlign: 'center' }}>
                                    <img 
                                      src={parentSignature} 
                                      alt="Chữ ký Cha Mẹ" 
                                      style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} 
                                    />
                                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSignModal('parent')}
                                        style={{
                                          padding: '4px 10px',
                                          fontSize: '12px',
                                          color: '#0369a1',
                                          background: '#f0f9ff',
                                          border: '1px solid #bae6fd',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontWeight: '600',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <RefreshCw size={12} /> Ký lại
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSignModal('parent')}
                                    style={{
                                      background: '#eff6ff',
                                      border: '1.5px solid #93c5fd',
                                      borderRadius: '8px',
                                      padding: '10px 14px',
                                      color: '#1d4ed8',
                                      fontWeight: '700',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: '0 2px 4px rgba(29, 78, 216, 0.1)'
                                    }}
                                  >
                                    <PenTool size={15} /> ✍️ Bấm để Cha/Mẹ Ký Tên
                                  </button>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                                (Chạm tay ký trên điện thoại hoặc di chuột trên máy tính)
                              </div>
                            </div>

                            {/* KHUNG 2: CHỮ KÝ HỌC SINH */}
                            <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🧑‍🎓 2. Chữ ký của Học sinh (Người làm đơn):</span>
                                {studentSignature && (
                                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', marginLeft: 'auto' }}>
                                    ✓ Đã ký
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
                                Học sinh: <strong>{studentName || '...'}</strong> - Lớp <strong>{studentClass || '...'}</strong>
                              </div>

                              <div style={{ flex: 1, minHeight: '110px', background: '#ffffff', borderRadius: '8px', border: studentSignature ? '1.5px solid #86efac' : '1.5px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', position: 'relative' }}>
                                {studentSignature ? (
                                  <div style={{ width: '100%', textAlign: 'center' }}>
                                    <img 
                                      src={studentSignature} 
                                      alt="Chữ ký Học sinh" 
                                      style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} 
                                    />
                                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSignModal('student')}
                                        style={{
                                          padding: '4px 10px',
                                          fontSize: '12px',
                                          color: '#0369a1',
                                          background: '#f0f9ff',
                                          border: '1px solid #bae6fd',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontWeight: '600',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <RefreshCw size={12} /> Ký lại
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSignModal('student')}
                                    style={{
                                      background: '#eff6ff',
                                      border: '1.5px solid #93c5fd',
                                      borderRadius: '8px',
                                      padding: '10px 14px',
                                      color: '#1d4ed8',
                                      fontWeight: '700',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: '0 2px 4px rgba(29, 78, 216, 0.1)'
                                    }}
                                  >
                                    <PenTool size={15} /> ✍️ Bấm để Học Sinh Ký Tên
                                  </button>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                                (Học sinh ký tên xác nhận nguyện vọng)
                              </div>
                            </div>

                          </div>

                          {/* KHUNG NÚT HOÀN TẤT KÝ & LƯU HOẶC HIỂN THỊ KẾT QUẢ ĐÃ TẠO */}
                          {signedDocUrl ? (
                            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
                                <CheckCircle2 size={20} color="#16a34a" />
                                <span>{signedDocSource === 'google_drive' ? 'Đã ghép chữ ký & lưu vào Google Drive: ' : 'Đã ghép chữ ký thành công: '}</span>
                                <span style={{ color: '#0f172a' }}>{signedDocFileName || 'Đơn đăng ký có chữ ký'}</span>
                              </div>

                              {signedDocClassFolderUrl && (
                                <div style={{ fontSize: '12.5px', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '10px' }}>
                                  <FolderOpen size={14} /> Tự động gom vào Thư mục: <strong>Lớp {studentClass}</strong> trên Google Drive trường
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocModal(true)}
                                  style={{
                                    padding: '7px 14px',
                                    backgroundColor: '#0284c7',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Eye size={14} /> 👁️ Xem lại tờ đơn đã ký
                                </button>

                                <button
                                  type="button"
                                  onClick={handleDownloadSignedDocImage}
                                  style={{
                                    padding: '7px 14px',
                                    backgroundColor: '#ffffff',
                                    color: '#0284c7',
                                    border: '1.5px solid #0284c7',
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Download size={14} /> 📥 Tải ảnh đơn về máy
                                </button>

                                {signedDocDriveLink && (
                                  <a
                                    href={signedDocDriveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: '7px 14px',
                                      backgroundColor: '#f0fdf4',
                                      color: '#15803d',
                                      border: '1px solid #86efac',
                                      borderRadius: '6px',
                                      fontSize: '12.5px',
                                      fontWeight: '600',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <ExternalLink size={14} /> Mở file trên Drive
                                  </a>
                                )}

                                {signedDocClassFolderUrl && (
                                  <a
                                    href={signedDocClassFolderUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: '7px 14px',
                                      backgroundColor: '#eff6ff',
                                      color: '#1d4ed8',
                                      border: '1px solid #bfdbfe',
                                      borderRadius: '6px',
                                      fontSize: '12.5px',
                                      fontWeight: '600',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <FolderOpen size={14} /> Mở Thư Mục Lớp
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={handleRemoveSignedDoc}
                                  style={{
                                    padding: '7px 14px',
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fecdd3',
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <RefreshCw size={14} /> Ký lại / Làm mới
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={handleGenerateAndUploadESignedDoc}
                                disabled={isGeneratingESignedDoc || !parentSignature || !studentSignature}
                                style={{
                                  width: '100%',
                                  maxWidth: '460px',
                                  padding: '12px 20px',
                                  backgroundColor: (parentSignature && studentSignature) ? '#be123c' : '#94a3b8',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  fontWeight: '800',
                                  fontSize: '14.5px',
                                  cursor: (parentSignature && studentSignature && !isGeneratingESignedDoc) ? 'pointer' : 'not-allowed',
                                  boxShadow: (parentSignature && studentSignature) ? '0 4px 14px rgba(190, 18, 60, 0.35)' : 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                {isGeneratingESignedDoc ? (
                                  <>
                                    <RefreshCw size={18} className="animate-spin" /> Đang ghép chữ ký & nộp lên Google Drive...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={18} /> GHÉP CHỮ KÝ VÀO ĐƠN & LƯU LÊN HỆ THỐNG
                                  </>
                                )}
                              </button>

                              {(!parentSignature || !studentSignature) && (
                                <div style={{ fontSize: '12px', color: '#b45309', marginTop: '8px' }}>
                                  ⚠️ Vui lòng hoàn tất cả 2 chữ ký của <strong>Cha Mẹ</strong> và <strong>Học sinh</strong> ở trên trước khi bấm nộp đơn.
                                </div>
                              )}
                            </div>
                          )}

                          {signedDocError && (
                            <div style={{ marginTop: '10px', color: '#dc2626', fontSize: '12.5px', fontWeight: '600', textAlign: 'center' }}>
                              ⚠️ {signedDocError}
                            </div>
                          )}
                        </div>
                      )}

                      {/* NỘI DUNG CÁCH 2: IN RA GIẤY & TẢI ẢNH / PDF TRUYỀN THỐNG */}
                      {uploadMethod === 'file' && (
                        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '16px' }}>
                          {/* Bước A: Tải đơn */}
                          <div style={{
                            background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
                            border: '1.5px solid #bfdbfe',
                            borderRadius: '10px',
                            padding: '14px',
                            marginBottom: '14px'
                          }}>
                            <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '8px' }}>
                              📄 <strong>Bước A: Xuất mẫu đơn chuẩn Bộ GD&ĐT</strong> (Hệ thống đã tự động điền sẵn tên: <strong>{studentName}</strong>, lớp: <strong>{studentClass}</strong> và các môn em chọn):
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              <button
                                type="button"
                                onClick={handleDownloadApplication}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '9px 16px',
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(2,132,199,0.25)'
                                }}
                              >
                                <Download size={15} /> 📥 Tải Đơn Đăng Ký (Word .doc)
                              </button>

                              <button
                                type="button"
                                onClick={handlePrintApplication}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '9px 15px',
                                  backgroundColor: '#ffffff',
                                  color: '#0369a1',
                                  border: '1.5px solid #0284c7',
                                  borderRadius: '8px',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Printer size={15} /> 🖨️ Xem & In Trực Tiếp
                              </button>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#0369a1', fontStyle: 'italic' }}>
                              💡 Mẹo: Bấm "Tải Đơn Đăng Ký" để tải file Word về máy tính/điện thoại, hoặc bấm "Xem & In Trực Tiếp" để in ra máy in ngay.
                            </div>
                          </div>

                          {/* Bước B: Ký trên giấy */}
                          <div style={{ fontSize: '12.5px', color: '#334155', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                            <strong>✍️ Bước B: Xin chữ ký của Cha Mẹ và Học sinh:</strong>
                            <div style={{ marginTop: '4px', lineHeight: '1.5', color: '#475569' }}>
                              In đơn ra giấy, đưa cho <strong>Cha/Mẹ/Người giám hộ ký ghi rõ họ tên</strong> vào mục <em>Ý kiến của cha mẹ học sinh</em> và <strong>em ký ghi rõ họ tên</strong> vào mục <em>Người làm đơn</em>.
                            </div>
                          </div>

                          {/* Bước C: Upload ảnh / PDF */}
                          <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1.5px dashed #cbd5e1', padding: '16px', textAlign: 'center' }}>
                            {(selectedCampaign?.google_drive_script_url || selectedCampaign?.form_schema?.google_drive_script_url) && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: '#15803d', fontWeight: 'bold', marginBottom: '12px' }}>
                                <HardDrive size={14} color="#16a34a" /> Hệ thống tự động phân loại vào Thư mục: Lớp {studentClass || 'của em'}
                              </div>
                            )}

                            {signedDocUrl ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '14px' }}>
                                  <CheckCircle2 size={20} color="#16a34a" />
                                  {signedDocSource === 'google_drive' ? 'Đã lưu trên Google Drive: ' : 'Đã tải lên: '}
                                  <span style={{ color: '#0f172a' }}>{signedDocFileName || 'Đơn đăng ký có chữ ký'}</span>
                                </div>

                                {signedDocClassFolderUrl && (
                                  <div style={{ fontSize: '12px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FolderOpen size={13} /> Thư mục: <strong>Lớp {studentClass}</strong> trên Google Drive trường
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDocModal(true)}
                                    style={{
                                      padding: '6px 14px',
                                      backgroundColor: '#0284c7',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '12.5px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Eye size={14} /> Xem lại file đơn
                                  </button>

                                  {signedDocDriveLink && (
                                    <a
                                      href={signedDocDriveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '6px 14px',
                                        backgroundColor: '#f0fdf4',
                                        color: '#15803d',
                                        border: '1px solid #86efac',
                                        borderRadius: '6px',
                                        fontSize: '12.5px',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <ExternalLink size={14} /> Mở file trên Drive
                                    </a>
                                  )}

                                  {signedDocClassFolderUrl && (
                                    <a
                                      href={signedDocClassFolderUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '6px 14px',
                                        backgroundColor: '#eff6ff',
                                        color: '#1d4ed8',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '6px',
                                        fontSize: '12.5px',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <FolderOpen size={14} /> Mở Thư Mục Lớp
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={handleRemoveSignedDoc}
                                    style={{
                                      padding: '6px 14px',
                                      backgroundColor: '#f1f5f9',
                                      color: '#dc2626',
                                      border: '1px solid #fca5a5',
                                      borderRadius: '6px',
                                      fontSize: '12.5px',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ✕ Đổi file khác
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <UploadCloud size={34} color="#0284c7" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                                <label style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#0284c7', color: '#ffffff', borderRadius: '8px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(2,132,199,0.25)' }}>
                                  {uploadingSignedDoc ? `Đang tải tệp vào Thư mục Lớp ${studentClass || ''}...` : `📁 Bấm để chọn Ảnh chụp hoặc File PDF đơn đã ký`}
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleSignedDocFileUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploadingSignedDoc}
                                  />
                                </label>
                                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '8px' }}>
                                  {(selectedCampaign?.google_drive_script_url || selectedCampaign?.form_schema?.google_drive_script_url)
                                    ? `Tệp sẽ được tự động đưa vào Thư mục Lớp ${studentClass || 'của em'} trên Google Drive của Trường.` 
                                    : 'Hỗ trợ file ảnh JPG, PNG hoặc file PDF (Tối đa 20MB). Hãy chụp rõ nét phần chữ ký.'}
                                </div>
                              </div>
                            )}

                            {signedDocError && (
                              <div style={{ marginTop: '8px', color: '#dc2626', fontSize: '12.5px', fontWeight: '600' }}>
                                ⚠️ {signedDocError}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* NỘI DUNG CÁCH 3: DÁN LINK GOOGLE DRIVE */}
                      {uploadMethod === 'drive' && (
                        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <LinkIcon size={14} color="#0284c7" /> Dán đường link Google Drive của đơn đã ký:
                            </label>

                            {schoolDriveUrl && (
                              <a
                                href={schoolDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  textDecoration: 'none',
                                  border: '1px solid #86efac'
                                }}
                              >
                                <FolderOpen size={13} /> 📁 Mở Thư Mục Google Drive Của Nhà Trường
                              </a>
                            )}
                          </div>

                          <input
                            type="url"
                            value={signedDocDriveLink}
                            onChange={(e) => setSignedDocDriveLink(e.target.value)}
                            placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '13.5px',
                              boxSizing: 'border-box'
                            }}
                          />

                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                            📌 <strong>Lưu ý:</strong> Vui lòng bật quyền truy cập là <em>"Bất kỳ ai có đường liên kết đều có thể xem"</em> để Thầy/Cô và Ban Giám hiệu có thể kiểm tra chữ ký.
                          </div>
                        </div>
                      )}

                      {/* TRẠNG THÁI TỔNG HỢP MINH CHỨNG */}
                      <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', backgroundColor: (signedDocUrl || signedDocDriveLink?.trim()) ? '#ecfdf5' : '#fffbeb', border: (signedDocUrl || signedDocDriveLink?.trim()) ? '1px solid #86efac' : '1px solid #fde68a', color: (signedDocUrl || signedDocDriveLink?.trim()) ? '#166534' : '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(signedDocUrl || signedDocDriveLink?.trim()) ? (
                          <>
                            <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                            <span><strong>Đã sẵn sàng:</strong> Em đã hoàn tất đơn đăng ký có chữ ký. Hãy kiểm tra lại thông tin và bấm nút "GỬI ĐĂNG KÝ" bên dưới.</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                            <span><strong>Bắt buộc:</strong> Em cần hoàn tất ký đơn hoặc nộp file minh chứng để có thể gửi đăng ký.</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #be123c, #9f1239)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.3)' }}
                  >
                    {submitting ? 'ĐANG GỬI...' : 'GỬI ĐĂNG KÝ'}
                  </button>
                </div>
              )}

            </form>
            )}
          </div>
        )}
      </div>

      {/* POPUP XEM MÃ QR ZALO CỦA TỪNG MÔN PHỤ */}
      {qrModalItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '380px', width: '100%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setQrModalItem(null)}
              style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <span style={{ fontSize: '36px' }}>{qrModalItem.icon}</span>
            <h3 style={{ margin: '8px 0 4px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>
              Môn: {qrModalItem.name}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Quét mã QR bằng ứng dụng Zalo để tham gia nhóm
            </p>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'inline-block', marginBottom: '16px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModalItem.zaloUrl)}`}
                alt={`QR Zalo ${qrModalItem.name}`}
                style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }}
              />
            </div>

            <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '16px', textAlign: 'left', background: '#f0f9ff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
              <div><strong>📍 Địa điểm:</strong> {qrModalItem.location}</div>
              <div><strong>⏰ Thời gian:</strong> {qrModalItem.schedule}</div>
              <div><strong>👨‍🏫 Phụ trách:</strong> {qrModalItem.coaches.join(', ')}</div>
            </div>

            <a
              href={qrModalItem.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                padding: '11px 0',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none',
                boxSizing: 'border-box'
              }}
            >
              Mở Trực Tiếp Trên Zalo
            </a>
          </div>
        </div>
      )}

      {/* POPUP XEM LẠI FILE ĐƠN ĐĂNG KÝ ĐÃ TẢI LÊN */}
      {previewDocModal && signedDocUrl && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>
                <FileCheck size={18} color="#0284c7" />
                <span>Xem lại file đơn: {signedDocFileName || 'Đơn đăng ký có chữ ký'}</span>
              </div>
              <button 
                onClick={() => setPreviewDocModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', textAlign: 'center', background: '#334155' }}>
              {signedDocUrl.startsWith('data:application/pdf') || signedDocUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={signedDocUrl} 
                  title="PDF Preview"
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <img 
                  src={signedDocUrl} 
                  alt="Ảnh đơn có chữ ký"
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                />
              )}
            </div>

            <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setPreviewDocModal(false)}
                style={{ padding: '8px 18px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BẢNG VẼ CHỮ KÝ ĐIỆN TỬ CHO CHA MẸ HOẶC HỌC SINH */}
      <SignaturePadModal
        isOpen={Boolean(activeSignerModal)}
        onClose={() => setActiveSignerModal(null)}
        signerTitle={activeSignerModal === 'parent' ? 'Cha/Mẹ / Người Giám Hộ' : 'Học Sinh'}
        signerName={
          activeSignerModal === 'parent' 
            ? (responses['field_parent_name'] || (studentName ? `Phụ huynh em ${studentName}` : 'Cha/Mẹ học sinh'))
            : (studentName || 'Học sinh')
        }
        initialSignature={activeSignerModal === 'parent' ? parentSignature : studentSignature}
        onSaveSignature={(signatureDataUrl) => {
          if (activeSignerModal === 'parent') {
            setParentSignature(signatureDataUrl);
          } else if (activeSignerModal === 'student') {
            setStudentSignature(signatureDataUrl);
          }
          setActiveSignerModal(null);
        }}
      />

      {/* BẢN IN ĐƠN A4 ẨN ĐỂ RENDER THÀNH CANVAS & XUẤT ẢNH PNG RETINA CÓ CHỮ KÝ */}
      <div 
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: '0', 
          width: '794px', 
          height: 'auto', 
          overflow: 'visible', 
          opacity: 1, 
          zIndex: -9999, 
          pointerEvents: 'none' 
        }}
      >
        <div 
          ref={paperRef}
          style={{
            width: '794px',
            minHeight: '1123px',
            padding: '45px 52px',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: '"Times New Roman", Times, serif',
            boxSizing: 'border-box',
            lineHeight: '1.45',
            fontSize: '13pt'
          }}
        >
          {/* Quốc hiệu & Tiêu ngữ */}
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '18px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13pt', textTransform: 'uppercase', textAlign: 'center' }}>
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '14pt', textAlign: 'center' }}>
              Độc lập - Tự do - Hạnh phúc
            </p>
            <p style={{ margin: '5px 0 0 0', letterSpacing: '2px', fontWeight: 'bold', textAlign: 'center' }}>
              -------***-------
            </p>
          </div>

          {/* Tiêu đề */}
          <div style={{ textAlign: 'center', fontSize: '15pt', fontWeight: 'bold', margin: '15px 0 20px 0', textTransform: 'uppercase' }}>
            ĐƠN ĐĂNG KÍ HỌC THÊM
          </div>

          {/* Kính gửi */}
          <div style={{ marginLeft: '45px', marginBottom: '18px', fontWeight: 'bold' }}>
            <p style={{ margin: 0 }}>Kính gửi:</p>
            <p style={{ margin: '4px 0 0 20px' }}>- Hiệu trưởng {selectedCampaign?.form_schema?.school_name || 'Trường THPT Cao Bá Quát'};</p>
            <p style={{ margin: '4px 0 0 20px' }}>- Giáo viên chủ nhiệm Lớp {studentClass || '........'}.</p>
          </div>

          {/* Nội dung */}
          <p style={{ textIndent: '1cm', textAlign: 'justify', margin: '7px 0' }}>
            Tên em là: <strong>{(studentName || '').toUpperCase()}</strong>
          </p>
          <p style={{ textIndent: '1cm', textAlign: 'justify', margin: '7px 0' }}>
            Học sinh lớp: <strong>{studentClass || '...........'}</strong> (tên lớp đang học chính khóa tại nhà trường).
          </p>
          <p style={{ textIndent: '1cm', textAlign: 'justify', margin: '7px 0' }}>
            Em viết đơn này kính mong nhà trường cho phép em được đăng kí học thêm trong năm học <strong>{selectedCampaign?.form_schema?.school_year || '2026 - 2027'}</strong><sup>1</sup>, cụ thể như sau:
          </p>

          <p style={{ marginLeft: '0.5cm', textAlign: 'justify', margin: '8px 0' }}>
            <strong>1. Môn học đăng kí học thêm:</strong>{' '}
            <span style={{ color: '#000080', fontWeight: 'bold' }}>
              {getSelectedTuitionSubjectsList().length > 0 ? getSelectedTuitionSubjectsList().join(', ') : '...........................................................................'}
            </span>{' '}
            (ghi tên môn học theo chương trình giáo dục), lớp <strong>{(studentClass || '').match(/^(10|11|12)/) ? `Khối ${(studentClass || '').match(/^(10|11|12)/)[1]}` : 'Khối 12'}</strong> (ghi khối lớp đăng kí học thêm).
          </p>

          <p style={{ marginLeft: '0.5cm', textAlign: 'justify', margin: '8px 0' }}>
            <strong>2. Đối tượng đăng kí học thêm<sup>2</sup>:</strong>{' '}
            <span>
              {responses['field_tuition_category'] || 'Học sinh có nguyện vọng học thêm để củng cố, nâng cao kiến thức, rèn luyện kỹ năng và ôn thi tốt nghiệp THPT.'}
            </span>
          </p>

          <p style={{ marginLeft: '0.5cm', textAlign: 'justify', margin: '8px 0' }}>
            <strong>3. Nguyện vọng đăng kí giáo viên (nếu có):</strong>{' '}
            <span>
              {responses['field_preferred_teacher'] || 'Kính nhờ Nhà trường và Ban Giám hiệu phân công giáo viên giảng dạy theo kế hoạch của trường.'}
            </span>
          </p>

          <p style={{ textIndent: '1cm', textAlign: 'justify', margin: '7px 0' }}>
            Em xin trân trọng cảm ơn!
          </p>

          {/* Bảng chữ ký 2 cột */}
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', marginTop: '24px' }}>
            <tbody>
              <tr>
                {/* CỘT 1: CHA MẸ HỌC SINH */}
                <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', padding: '0 10px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Ý KIẾN CỦA CHA MẸ HỌC SINH
                  </p>
                  <p style={{ margin: '3px 0 0 0', fontStyle: 'italic', fontSize: '11pt' }}>
                    (Đối với người chưa thành niên)
                  </p>
                  <div style={{ margin: '6px 0 2px 0', fontSize: '11pt', fontStyle: 'italic', color: '#1e293b', minHeight: '36px', textAlign: 'center' }}>
                    "{parentOpinion || 'Tôi hoàn toàn đồng ý và tạo điều kiện cho con tham gia học thêm.'}"
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontStyle: 'italic', fontSize: '10.5pt', color: '#475569' }}>
                    (Kí và ghi rõ họ tên)
                  </p>
                  <div style={{ height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
                    {parentSignature ? (
                      <img 
                        src={parentSignature} 
                        alt="Chữ ký Cha Mẹ" 
                        style={{ maxHeight: '72px', maxWidth: '190px', objectFit: 'contain' }} 
                      />
                    ) : (
                      <div style={{ height: '70px' }}></div>
                    )}
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>
                    {responses['field_parent_name'] || (studentName ? `Phụ huynh em ${studentName}` : '')}
                  </p>
                </td>

                {/* CỘT 2: HỌC SINH */}
                <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', padding: '0 10px' }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>
                    Đắk Lắk, ngày {String(new Date().getDate()).padStart(2, '0')} tháng {String(new Date().getMonth() + 1).padStart(2, '0')} năm {new Date().getFullYear()}
                  </p>
                  <p style={{ margin: '3px 0 0 0', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    NGƯỜI LÀM ĐƠN
                  </p>
                  <p style={{ margin: '3px 0 0 0', fontStyle: 'italic', fontSize: '10.5pt', color: '#475569' }}>
                    (Kí và ghi rõ họ tên)
                  </p>
                  <div style={{ height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
                    {studentSignature ? (
                      <img 
                        src={studentSignature} 
                        alt="Chữ ký Học sinh" 
                        style={{ maxHeight: '72px', maxWidth: '190px', objectFit: 'contain' }} 
                      />
                    ) : (
                      <div style={{ height: '70px' }}></div>
                    )}
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>
                    {studentName || ''}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Chú thích chân trang */}
          <div style={{ marginTop: '35px', borderTop: '1pt solid #000000', paddingTop: '6px', fontSize: '10pt', fontStyle: 'italic' }}>
            <p style={{ margin: '2px 0' }}><sup>1</sup> Ghi năm học học sinh có nguyện vọng đăng kí học thêm</p>
            <p style={{ margin: '2px 0' }}><sup>2</sup> Ghi rõ 1 trong 3 đối tượng quy định tại khoản 1 Điều 5 Thông tư này</p>
          </div>
        </div>
      </div>

    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  dropdownItem: { padding: '10px 12px', fontSize: '13.5px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }
};
