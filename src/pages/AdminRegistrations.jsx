import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase, supabase2Admin, supabase2, DualSupabaseService } from '../lib/supabase';
const adminClient = supabase2Admin || supabase2;
import { Plus, Save, Trash2, Edit3, Settings, Users, FileText, CheckCircle2, ListFilter, Download, Server, Printer, Filter, X, ArrowUpDown, Lock, Unlock, Clock, MessageSquare, Copy, Check, ExternalLink, Search, CalendarCheck, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import ClubAttendanceManager from '../components/ClubAttendanceManager';
import { CLUB_SUB_DISCIPLINES, getSubDisciplinesForClub } from '../data/clubSubDisciplines';

export default function AdminRegistrations() {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'results'
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for Campaign
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetGrades, setTargetGrades] = useState([]); // ['Khối 10', 'Khối 11', 'Khối 12']
  const [prerequisiteClub, setPrerequisiteClub] = useState(''); // Ràng buộc CLB mẹ
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [closedNotice, setClosedNotice] = useState('');
  const [targetDb, setTargetDb] = useState('sb2'); // 'sb1' | 'sb2'

  // Zalo Campaign Reminder Modal States
  const [showZaloCampaignModal, setShowZaloCampaignModal] = useState(false);
  const [zaloCampaign, setZaloCampaign] = useState(null);
  const [zaloAllStudents, setZaloAllStudents] = useState([]);
  const [zaloCampaignRegistrations, setZaloCampaignRegistrations] = useState([]);
  const [loadingZaloData, setLoadingZaloData] = useState(false);
  const [zaloTargetClass, setZaloTargetClass] = useState('ALL');
  const [zaloTargetGrade, setZaloTargetGrade] = useState('ALL');
  const [zaloTemplateType, setZaloTemplateType] = useState('class_group'); // 'class_group' | 'school_report' | 'simple_list'
  const [zaloCopiedToast, setZaloCopiedToast] = useState(false);

  // Results & Filtering & Sorting & Report States
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedOptionFilter, setSelectedOptionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_at'); // 'created_at' | 'student_class' | 'student_name' | 'student_code'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Form Builder states
  const [formSchema, setFormSchema] = useState([]);
  /* Schema item: { id: string, type: 'text'|'select'|'radio'|'checkbox', label: string, required: boolean, options: string[] } */

  // Edit result states
  const [showEditResultModal, setShowEditResultModal] = useState(false);
  const [editingResultData, setEditingResultData] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (activeTab === 'results' && selectedCampaignId) {
      fetchResults(selectedCampaignId);
    }
  }, [activeTab, selectedCampaignId]);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await DualSupabaseService.selectSmart(
        'cbq_registration_campaigns',
        (q) => q.order('created_at', { ascending: false }),
        'id'
      );
      const allData = res.data || [];
      setCampaigns(allData);
      
      if (allData.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(allData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchResults(campaignId) {
    setLoadingResults(true);
    try {
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      const client = campaign?._source === 'sb1' ? supabase : adminClient;
      
      let allRegs = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await client
          .from('cbq_student_registrations')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .range(from, from + step - 1);

        if (!error && data && data.length > 0) {
          allRegs = [...allRegs, ...data];
          from += step;
          if (data.length < step) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }

      setResults(allRegs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  }

  const handleToggleGrade = (grade) => {
    if (targetGrades.includes(grade)) {
      setTargetGrades(targetGrades.filter(g => g !== grade));
    } else {
      setTargetGrades([...targetGrades, grade]);
    }
  };

  const handleAddField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Câu hỏi mới',
      required: true,
      options: []
    };
    setFormSchema([...formSchema, newField]);
  };

  const handleUpdateField = (id, key, value) => {
    setFormSchema(formSchema.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const handleRemoveField = (id) => {
    setFormSchema(formSchema.filter(f => f.id !== id));
  };

  const handleAddOption = (fieldId) => {
    setFormSchema(formSchema.map(f => {
      if (f.id === fieldId) {
        return { ...f, options: [...(f.options || []), `Lựa chọn ${f.options.length + 1}`] };
      }
      return f;
    }));
  };

  const handleUpdateOption = (fieldId, optionIndex, value) => {
    setFormSchema(formSchema.map(f => {
      if (f.id === fieldId) {
        const newOptions = [...f.options];
        newOptions[optionIndex] = value;
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const handleRemoveOption = (fieldId, optionIndex) => {
    setFormSchema(formSchema.map(f => {
      if (f.id === fieldId) {
        const newOptions = f.options.filter((_, idx) => idx !== optionIndex);
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const handleEdit = (cam) => {
    setEditingId(cam.id);
    setTitle(cam.title || '');
    setDescription(cam.description || '');
    setTargetGrades(cam.target_grades || []);
    setPrerequisiteClub(cam.prerequisite_club || (cam.form_schema && !Array.isArray(cam.form_schema) ? cam.form_schema.prerequisite_club : '') || '');
    setIsActive(cam.is_active);
    setStartDate(cam.start_date ? new Date(new Date(cam.start_date).getTime() - (new Date(cam.start_date).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');
    setEndDate(cam.end_date ? new Date(new Date(cam.end_date).getTime() - (new Date(cam.end_date).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');
    
    // Extract closed notice if stored in form_schema metadata
    let notice = cam.closed_notice || '';
    if (!notice && cam.form_schema && !Array.isArray(cam.form_schema)) {
      notice = cam.form_schema.closed_notice || '';
    }
    setClosedNotice(notice);

    const schemaFields = Array.isArray(cam.form_schema) ? cam.form_schema : (cam.form_schema?.fields || []);
    setFormSchema(schemaFields);
    setTargetDb(cam._source || 'sb2');
    setShowForm(true);
    setActiveTab('campaigns');
    window.scrollTo(0, 0);
  };

  const handleDelete = async (cam) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Đợt đăng ký này? Toàn bộ dữ liệu học sinh đăng ký trong đợt này cũng sẽ bị xóa vĩnh viễn!")) return;
    try {
      await DualSupabaseService.delete('cbq_registration_campaigns', 'id', cam.id);
      fetchCampaigns();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleQuickToggleLock = async (cam) => {
    try {
      const nextActive = !cam.is_active;
      await DualSupabaseService.update('cbq_registration_campaigns', { is_active: nextActive }, 'id', cam.id);
      setCampaigns(campaigns.map(c => c.id === cam.id ? { ...c, is_active: nextActive } : c));
    } catch (err) {
      alert("Lỗi khi đổi trạng thái khóa: " + err.message);
    }
  };

  const handleBulkToggleLock = async (targetActive) => {
    const actionName = targetActive ? "MỞ ĐĂNG KÝ TẤT CẢ" : "KHÓA TẤT CẢ";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} các cuộc đăng ký?`)) return;
    try {
      for (const cam of campaigns) {
        await DualSupabaseService.update('cbq_registration_campaigns', { is_active: targetActive }, 'id', cam.id);
      }
      setCampaigns(campaigns.map(c => ({ ...c, is_active: targetActive })));
      alert(`Đã ${actionName} thành công!`);
    } catch (err) {
      alert("Lỗi khi thao tác hàng loạt: " + err.message);
    }
  };

  const getStudentGradeLevel = (studentClass) => {
    if (!studentClass) return 'Khối 10';
    const clean = String(studentClass).trim().toUpperCase();
    if (clean.startsWith('10')) return 'Khối 10';
    if (clean.startsWith('11')) return 'Khối 11';
    if (clean.startsWith('12')) return 'Khối 12';
    return 'Khối 10';
  };

  const openZaloCampaignReminderModal = async (cam) => {
    const targetCam = cam || campaigns.find(c => c.id === selectedCampaignId);
    if (!targetCam) return alert("Vui lòng chọn đợt đăng ký!");
    
    setZaloCampaign(targetCam);
    setShowZaloCampaignModal(true);
    setLoadingZaloData(true);
    setZaloTargetClass('ALL');
    setZaloTargetGrade('ALL');
    setZaloTemplateType('class_group');
    setZaloCopiedToast(false);

    try {
      // 1. Fetch all master students with pagination loop (overcoming Supabase 1000 row limit)
      let masterStudents = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const studRes = await DualSupabaseService.selectSmart(
          'cbq_students',
          (q) => q.order('student_class', { ascending: true }).order('student_name', { ascending: true }).range(from, from + step - 1),
          'student_code'
        );
        const chunk = studRes.data || [];
        if (chunk.length > 0) {
          masterStudents = [...masterStudents, ...chunk];
          from += step;
          if (chunk.length < step) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }

      // Fallback to localStorage if Supabase returns empty
      if (masterStudents.length === 0) {
        try {
          const cached = localStorage.getItem('cbq_students_data');
          if (cached) masterStudents = JSON.parse(cached);
        } catch (e) {
          console.warn(e);
        }
      }

      setZaloAllStudents(masterStudents);

      // 2. Fetch campaign registrations with pagination loop
      let campaignRegs = [];
      let regFrom = 0;
      let fetchMoreRegs = true;

      while (fetchMoreRegs) {
        const regRes = await DualSupabaseService.selectSmart(
          'cbq_student_registrations',
          (q) => q.eq('campaign_id', targetCam.id).range(regFrom, regFrom + step - 1),
          'id'
        );
        const chunk = regRes.data || [];
        if (chunk.length > 0) {
          campaignRegs = [...campaignRegs, ...chunk];
          regFrom += step;
          if (chunk.length < step) fetchMoreRegs = false;
        } else {
          fetchMoreRegs = false;
        }
      }

      setZaloCampaignRegistrations(campaignRegs);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu đôn đốc Zalo:", err);
    } finally {
      setLoadingZaloData(false);
    }
  };

  const generateZaloCampaignReminderMessage = () => {
    if (!zaloCampaign) return '';

    const currentDomain = window.location.origin;
    const registerUrl = `${currentDomain}/dang-ky-hoat-dong`;
    const campaignTitle = (zaloCampaign.title || 'ĐỢT ĐĂNG KÝ').trim().toUpperCase();
    const endDateStr = zaloCampaign.end_date 
      ? new Date(zaloCampaign.end_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) 
      : 'Theo thông báo của nhà trường';

    const targetGradesStr = zaloCampaign.target_grades && zaloCampaign.target_grades.length > 0
      ? zaloCampaign.target_grades.join(', ')
      : 'Tất cả các khối';

    // Eligible students pool based on campaign target_grades
    const eligibleStudents = zaloAllStudents.filter(s => {
      if (!zaloCampaign.target_grades || zaloCampaign.target_grades.length === 0) return true;
      const sGrade = s.grade_level || getStudentGradeLevel(s.student_class);
      return zaloCampaign.target_grades.includes(sGrade);
    });

    // Set of registered student codes
    const regCodeSet = new Set(
      zaloCampaignRegistrations
        .map(r => String(r.student_code || r.responses?.student_code || '').trim().toUpperCase())
        .filter(Boolean)
    );

    // Unregistered students pool
    const unregisteredPool = eligibleStudents.filter(s => {
      const code = String(s.student_code || '').trim().toUpperCase();
      return !regCodeSet.has(code);
    });

    // Filtered by target class & grade selection
    const unregisteredInSelection = unregisteredPool.filter(s => {
      const sClass = (s.student_class || '').trim();
      const sGrade = s.grade_level || getStudentGradeLevel(sClass);
      const matchClass = zaloTargetClass === 'ALL' || sClass === zaloTargetClass;
      const matchGrade = zaloTargetGrade === 'ALL' || sGrade === zaloTargetGrade;
      return matchClass && matchGrade;
    });

    if (zaloTemplateType === 'class_group') {
      const classNameLabel = zaloTargetClass !== 'ALL' ? `LỚP ${zaloTargetClass}` : 'CÁC LỚP';
      let msg = `📢 [THPT CAO BÁ QUÁT - THÔNG BÁO TỪ GVCN ${classNameLabel}]\n`;
      msg += `📌 THÔNG BÁO ĐÔN ĐỐC ĐĂNG KÝ: ${campaignTitle}\n`;
      msg += `🎯 Đối tượng áp dụng: ${targetGradesStr}\n`;
      msg += `⏰ Hạn chót đăng ký: ${endDateStr}\n\n`;
      msg += `Kính gửi Phụ huynh và các em Học sinh ${zaloTargetClass !== 'ALL' ? `lớp ${zaloTargetClass}` : ''},\n`;
      msg += `Nhà trường triển khai đợt đăng ký trực tuyến nội dung: "${zaloCampaign.title}".\n\n`;

      if (unregisteredInSelection.length === 0) {
        msg += `🎉 CHÚC MỪNG: 100% Học sinh ${zaloTargetClass !== 'ALL' ? `lớp ${zaloTargetClass}` : ''} đã hoàn tất đăng ký!\n`;
        msg += `Xin chân thành cảm ơn Quý Phụ huynh và các em Học sinh đã tích cực hợp tác.\n`;
      } else {
        msg += `📌 Hiện tại hệ thống ghi nhận còn ${unregisteredInSelection.length} học sinh CHƯA HOÀN THÀNH ĐĂNG KÝ:\n`;
        unregisteredInSelection.forEach((s, idx) => {
          const sName = s.student_name || s.full_name || '';
          const sCode = s.student_code ? ` (Mã HS: ${s.student_code})` : '';
          const sClass = zaloTargetClass === 'ALL' ? ` [Lớp ${s.student_class}]` : '';
          msg += `${idx + 1}. ${sName}${sClass}${sCode}\n`;
        });
        msg += `\n👉 Các em chưa đăng ký vui lòng truy cập ngay link bên dưới để hoàn tất:\n`;
        msg += `🔗 Link đăng ký: ${registerUrl}\n`;
      }
      msg += `\nTrân trọng cảm ơn!`;
      return msg;
    }

    if (zaloTemplateType === 'school_report') {
      const allUniqueClasses = Array.from(new Set(eligibleStudents.map(s => s.student_class).filter(Boolean))).sort();
      const totalEligible = eligibleStudents.length;
      const totalRegistered = totalEligible - unregisteredPool.length;
      const percent = totalEligible > 0 ? Math.round((totalRegistered / totalEligible) * 100) : 0;

      let msg = `📊 [BÁO CÁO TIẾN ĐỘ ĐĂNG KÝ: ${campaignTitle}]\n`;
      msg += `📅 Cập nhật lúc: ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${new Date().toLocaleDateString('vi-VN')}\n`;
      msg += `🎯 Đối tượng: ${targetGradesStr} | Hạn chót: ${endDateStr}\n\n`;
      msg += `🎯 TỔNG QUAN TOÀN TRƯỜNG:\n`;
      msg += `• Tổng số học sinh thuộc đối tượng: ${totalEligible} học sinh\n`;
      msg += `• Đã hoàn thành đăng ký: ${totalRegistered} học sinh (${percent}%)\n`;
      msg += `• CHƯA ĐĂNG KÝ: ${unregisteredPool.length} học sinh\n\n`;
      msg += `📋 TIẾN ĐỘ THỐNG KÊ THEO TỪNG LỚP HỌC:\n`;

      allUniqueClasses.forEach(cls => {
        const classStudents = eligibleStudents.filter(s => s.student_class === cls);
        const unregInClass = unregisteredPool.filter(s => s.student_class === cls);
        const regInClass = classStudents.length - unregInClass.length;
        const statusStr = unregInClass.length === 0 ? '🟢 Hoàn thành (100%)' : `🔴 Còn ${unregInClass.length} HS chưa đăng ký`;
        msg += `- Lớp ${cls}: ${regInClass}/${classStudents.length} HS -> ${statusStr}\n`;
      });

      msg += `\n👉 Đề nghị Quý Thầy/Cô GVCN các lớp chưa hoàn thành nhắc nhở học sinh truy cập link đăng ký:\n`;
      msg += `🔗 Link đăng ký: ${registerUrl}\n\n`;
      msg += `Trân trọng cảm ơn Thầy/Cô!`;
      return msg;
    }

    // Simple List Template
    let msg = `📋 DANH SÁCH HỌC SINH CHƯA ĐĂNG KÝ: ${campaignTitle} (${unregisteredInSelection.length} HS):\n\n`;
    unregisteredInSelection.forEach((s, idx) => {
      const sName = s.student_name || s.full_name || '';
      const sCode = s.student_code ? ` (Mã: ${s.student_code})` : '';
      msg += `${idx + 1}. ${sName} - Lớp ${s.student_class}${sCode}\n`;
    });
    msg += `\n🔗 Link đăng ký: ${registerUrl}`;
    return msg;
  };

  const exportUnregisteredCampaignToExcel = () => {
    if (!zaloCampaign) return;
    
    const eligibleStudents = zaloAllStudents.filter(s => {
      if (!zaloCampaign.target_grades || zaloCampaign.target_grades.length === 0) return true;
      const sGrade = s.grade_level || getStudentGradeLevel(s.student_class);
      return zaloCampaign.target_grades.includes(sGrade);
    });

    const regCodeSet = new Set(
      zaloCampaignRegistrations
        .map(r => String(r.student_code || r.responses?.student_code || '').trim().toUpperCase())
        .filter(Boolean)
    );

    const unregisteredPool = eligibleStudents.filter(s => {
      const code = String(s.student_code || '').trim().toUpperCase();
      return !regCodeSet.has(code);
    });

    const unregisteredInSelection = unregisteredPool.filter(s => {
      const sClass = (s.student_class || '').trim();
      const sGrade = s.grade_level || getStudentGradeLevel(sClass);
      const matchClass = zaloTargetClass === 'ALL' || sClass === zaloTargetClass;
      const matchGrade = zaloTargetGrade === 'ALL' || sGrade === zaloTargetGrade;
      return matchClass && matchGrade;
    });

    if (unregisteredInSelection.length === 0) {
      return alert("Không có học sinh chưa đăng ký trong danh sách đã chọn!");
    }

    const excelData = unregisteredInSelection.map((s, idx) => ({
      'STT': idx + 1,
      'Mã Học Sinh': s.student_code || '',
      'Họ và Tên': s.student_name || s.full_name || '',
      'Lớp': s.student_class || '',
      'Khối': s.grade_level || getStudentGradeLevel(s.student_class),
      'Đợt Đăng Ký': zaloCampaign.title,
      'Trạng Thái': 'Chưa đăng ký'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const colWidths = [
      { wch: 6 },
      { wch: 15 },
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chua_Dang_Ky");

    const cleanTitle = (zaloCampaign.title || 'Dot_Dang_Ky').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `Danh_sach_CHUA_DANG_KY_${cleanTitle}.xlsx`);
  };

  const handleCopyZaloCampaignMessage = () => {
    const message = generateZaloCampaignReminderMessage();
    navigator.clipboard.writeText(message).then(() => {
      setZaloCopiedToast(true);
      setTimeout(() => setZaloCopiedToast(false), 3000);
    }).catch(() => {
      alert("Không thể tự động sao chép. Vui lòng chọn văn bản và nhấn Ctrl+C!");
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert("Vui lòng nhập tên đợt đăng ký");

    try {
      const schemaWithNotice = {
        fields: formSchema,
        closed_notice: closedNotice.trim(),
        prerequisite_club: prerequisiteClub || null
      };

      const payload = {
        title,
        description,
        target_grades: targetGrades.length > 0 ? targetGrades : null,
        is_active: isActive,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        form_schema: schemaWithNotice
      };

      if (editingId) {
        await DualSupabaseService.update('cbq_registration_campaigns', payload, 'id', editingId);
      } else {
        await DualSupabaseService.insert('cbq_registration_campaigns', [payload]);
      }

      alert("Lưu đợt đăng ký thành công!");
      setShowForm(false);
      setEditingId(null);
      setPrerequisiteClub('');
      fetchCampaigns();
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredAndSortedResults.length > 0 ? filteredAndSortedResults : results;
    if (dataToExport.length === 0) {
      alert("Không có dữ liệu để xuất Excel!");
      return;
    }
    
    const campaign = campaigns.find(c => c.id === selectedCampaignId);
    const schema = campaign?.form_schema || [];
    
    const currentClubName = (selectedOptionFilter && selectedOptionFilter !== 'all') 
      ? selectedOptionFilter 
      : (campaign?.title || 'Câu lạc bộ');

    // ==========================================
    // SHEET 1: SỔ ĐIỂM DANH & ĐÁNH GIÁ TỰ ĐỘNG
    // ==========================================
    const attendanceHeaderRows = [
      ['SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['TRƯỜNG THPT CAO BÁ QUÁT', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['SỔ THEO DÕI ĐIỂM DANH VÀ ĐÁNH GIÁ CHUYÊN CẦN THÀNH VIÊN - NĂM HỌC 2026 - 2027', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`Đơn vị / Câu lạc bộ: ${currentClubName.toUpperCase()}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['(Quy ước điểm danh: Nhập 1 = Có mặt, Nhập P = Nghỉ có phép [tính 0.5 buổi], Để trống hoặc 0 = Vắng không phép)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [
        'STT', 'Mã Học Sinh', 'Họ và Tên', 'Lớp', 'Nội dung / Chuyên môn đăng ký',
        'B1 (HK1)', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8 (HK1)',
        'B9 (HK2)', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16 (HK2)',
        'Tổng buổi tham gia', 'Tỷ lệ chuyên cần', 'Điểm chuyên cần (100)', 'Tự động Xếp loại', 'Đề xuất Khen thưởng', 'Điểm cộng Hạnh kiểm GVCN', 'Ghi chú'
      ]
    ];

    // Build data rows for attendance
    const attendanceDataRows = dataToExport.map((r, index) => {
      let majorOrAnswers = '';
      if (r.responses) {
        const ansList = [];
        schema.forEach(field => {
          const ans = r.responses[field.id];
          if (ans !== undefined && ans !== null && ans !== '') {
            const valStr = Array.isArray(ans) ? ans.join(', ') : String(ans);
            if (valStr !== selectedOptionFilter) {
              ansList.push(valStr);
            }
          }
        });
        majorOrAnswers = ansList.length > 0 ? ansList.join(' | ') : '';
      }

      return [
        index + 1,
        r.student_code || '',
        r.student_name || '',
        r.student_class || '',
        majorOrAnswers,
        '', '', '', '', '', '', '', '', // HK1: B1 -> B8
        '', '', '', '', '', '', '', '', // HK2: B9 -> B16
        null, null, null, null, null, null, '' // Formulas will be inserted
      ];
    });

    const startStudentRow = 7; // 1-indexed row number in Excel
    const lastStudentRow = startStudentRow + dataToExport.length - 1;

    // Summary Statistics Rows
    const summaryRows = [
      [],
      ['BẢNG TỔNG HỢP VÀ THỐNG KÊ KẾT QUẢ SINH HOẠT CLB', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Tổng số thành viên tham gia CLB:', null, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Số lượng thành viên xếp loại Xuất sắc (>= 90%):', null, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Số lượng thành viên xếp loại Tốt (80% - 89%):', null, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Số lượng thành viên xếp loại Đạt (65% - 79%):', null, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Số lượng thành viên xếp loại Chưa đạt (< 65%):', null, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Tổng số thành viên đủ điều kiện Đề xuất Khen thưởng:', null, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    ];

    const allAttendanceGrid = [...attendanceHeaderRows, ...attendanceDataRows, ...summaryRows];
    const wsAttendance = XLSX.utils.aoa_to_sheet(allAttendanceGrid);

    // Apply Excel formulas to each student row
    dataToExport.forEach((_, idx) => {
      const r = startStudentRow + idx;
      // Col V: Tổng số buổi = COUNTIF(F{r}:U{r}, 1) + COUNTIF(F{r}:U{r}, "P")*0.5 + COUNTIF(F{r}:U{r}, "p")*0.5
      wsAttendance['V' + r] = { t: 'n', f: `COUNTIF(F${r}:U${r},1)+COUNTIF(F${r}:U${r},"P")*0.5+COUNTIF(F${r}:U${r},"p")*0.5` };
      // Col W: Tỷ lệ chuyên cần = IF(V{r}>0, V{r}/16, 0)
      wsAttendance['W' + r] = { t: 'n', f: `IF(V${r}>0,V${r}/16,0)`, z: '0.0%' };
      // Col X: Điểm chuyên cần (100) = ROUND(W{r}*100,0)
      wsAttendance['X' + r] = { t: 'n', f: `ROUND(W${r}*100,0)` };
      // Col Y: Tự động Xếp loại = IF(X{r}>=90,"Xuất sắc",IF(X{r}>=80,"Tốt",IF(X{r}>=65,"Đạt","Chưa đạt")))
      wsAttendance['Y' + r] = { t: 's', f: `IF(X${r}>=90,"Xuất sắc",IF(X${r}>=80,"Tốt",IF(X${r}>=65,"Đạt","Chưa đạt")))` };
      // Col Z: Đề xuất Khen thưởng = IF(Y{r}="Xuất sắc","Đề xuất Khen thưởng","")
      wsAttendance['Z' + r] = { t: 's', f: `IF(Y${r}="Xuất sắc","Đề xuất Khen thưởng","")` };
      // Col AA: Điểm cộng Hạnh kiểm GVCN = IF(Y{r}="Xuất sắc",10,IF(Y{r}="Tốt",5,IF(Y{r}="Đạt",2,0)))
      wsAttendance['AA' + r] = { t: 'n', f: `IF(Y${r}="Xuất sắc",10,IF(Y${r}="Tốt",5,IF(Y${r}="Đạt",2,0)))` };
    });

    // Apply summary formulas
    const statTotalRow = lastStudentRow + 3;
    const statXsRow = statTotalRow + 1;
    const statTotRow = statTotalRow + 2;
    const statDatRow = statTotalRow + 3;
    const statChuaDatRow = statTotalRow + 4;
    const statKhenThuongRow = statTotalRow + 5;

    wsAttendance['B' + statTotalRow] = { t: 'n', f: `COUNTA(C${startStudentRow}:C${lastStudentRow})` };
    wsAttendance['B' + statXsRow] = { t: 'n', f: `COUNTIF(Y${startStudentRow}:Y${lastStudentRow},"Xuất sắc")` };
    wsAttendance['B' + statTotRow] = { t: 'n', f: `COUNTIF(Y${startStudentRow}:Y${lastStudentRow},"Tốt")` };
    wsAttendance['B' + statDatRow] = { t: 'n', f: `COUNTIF(Y${startStudentRow}:Y${lastStudentRow},"Đạt")` };
    wsAttendance['B' + statChuaDatRow] = { t: 'n', f: `COUNTIF(Y${startStudentRow}:Y${lastStudentRow},"Chưa đạt")` };
    wsAttendance['B' + statKhenThuongRow] = { t: 'n', f: `COUNTIF(Z${startStudentRow}:Z${lastStudentRow},"Đề xuất Khen thưởng")` };

    // Column widths for attendance sheet
    wsAttendance['!cols'] = [
      { wch: 6 },  // A: STT
      { wch: 14 }, // B: Mã HS
      { wch: 24 }, // C: Họ và Tên
      { wch: 10 }, // D: Lớp
      { wch: 30 }, // E: Chuyên môn / Nguyện vọng
      { wch: 9 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 9 }, // F-M: B1-B8
      { wch: 9 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 9 }, // N-U: B9-B16
      { wch: 18 }, // V: Tổng buổi tham gia
      { wch: 16 }, // W: Tỷ lệ chuyên cần
      { wch: 20 }, // X: Điểm chuyên cần (100)
      { wch: 18 }, // Y: Tự động Xếp loại
      { wch: 22 }, // Z: Đề xuất Khen thưởng
      { wch: 24 }, // AA: Điểm cộng Hạnh kiểm GVCN
      { wch: 20 }  // AB: Ghi chú
    ];

    // ==========================================
    // SHEET 2: DỮ LIỆU ĐĂNG KÝ CHI TIẾT
    // ==========================================
    const excelDetailData = dataToExport.map((r, index) => {
      const row = {
        'STT': index + 1,
        'Thời gian đăng ký': new Date(r.created_at).toLocaleString('vi-VN'),
        'Mã Học Sinh': r.student_code || '',
        'Họ và Tên': r.student_name || '',
        'Lớp': r.student_class || ''
      };
      
      schema.forEach(field => {
        const ans = r.responses ? r.responses[field.id] : '';
        let ansStr = '';
        if (Array.isArray(ans)) {
          ansStr = ans.join('; ');
        } else if (ans !== undefined && ans !== null) {
          ansStr = String(ans);
        }
        row[field.label || field.id] = ansStr;
      });
      return row;
    });

    const wsDetail = XLSX.utils.json_to_sheet(excelDetailData);
    const detailColWidths = Object.keys(excelDetailData[0]).map(key => {
      const maxLen = Math.max(
        key.length,
        ...excelDetailData.map(row => (row[key] ? row[key].toString().length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
    });
    wsDetail['!cols'] = detailColWidths;

    // Create Workbook and append worksheets
    const workbook = XLSX.utils.book_new();
    
    // Add Sheet 1: Sổ Điểm danh & Đánh giá tự động
    XLSX.utils.book_append_sheet(workbook, wsAttendance, "Diem_Danh_Tu_Dong");
    
    // Add Sheet 2: Toàn bộ dữ liệu đăng ký chi tiết
    XLSX.utils.book_append_sheet(workbook, wsDetail, "Du_Lieu_Dang_Ky_Chi_Tiet");
    
    // Đặt tên file theo tên CLB khi đang chọn / lọc, hoặc tên đợt nếu chọn tất cả
    let fileName = '';
    if (selectedOptionFilter && selectedOptionFilter !== 'all') {
      const cleanClubName = selectedOptionFilter
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_')
        .trim();
      fileName = `Danh_sach_${cleanClubName}`;
    } else {
      const cleanTitle = (campaign?.title || 'x')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_')
        .trim();
      fileName = `Danh_sach_dang_ky_${cleanTitle}`;
    }
    
    // Download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // 🟢 LỌC VÀ SẮP XẾP DANH SÁCH HỌC SINH ĐĂNG KÝ (DÙNG CHO BẢNG & BÁO CÁO)
  const filteredAndSortedResults = useMemo(() => {
    let list = [...results];
    
    // 1. Lọc theo Tìm kiếm Họ tên / Mã HS / Lớp / Câu trả lời (Hỗ trợ tiếng Việt có dấu & không dấu)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const normalize = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
      const qNorm = normalize(q);

      list = list.filter(r => {
        const name = r.student_name || '';
        const nameNorm = normalize(name);
        const code = (r.student_code || '').toLowerCase();
        const sClass = (r.student_class || '').toLowerCase();

        // Khớp họ tên, mã HS, lớp
        if (name.toLowerCase().includes(q) || nameNorm.includes(qNorm) || code.includes(q) || sClass.includes(q)) {
          return true;
        }

        // Khớp nội dung câu trả lời (CLB, options)
        const responses = r.responses || {};
        return Object.values(responses).some(val => {
          if (Array.isArray(val)) {
            return val.some(v => String(v).toLowerCase().includes(q) || normalize(String(v)).includes(qNorm));
          }
          return String(val).toLowerCase().includes(q) || normalize(String(val)).includes(qNorm);
        });
      });
    }

    // 2. Lọc theo Lựa chọn / Câu lạc bộ
    if (selectedOptionFilter !== 'all') {
      list = list.filter(r => {
        const responses = r.responses || {};
        return Object.values(responses).some(val => {
          if (Array.isArray(val)) return val.includes(selectedOptionFilter);
          return String(val) === String(selectedOptionFilter);
        });
      });
    }

    // 3. Sắp xếp
    list.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'created_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (sortField === 'student_class') {
        // Tự động phân loại lớp: Khối 10, 11, 12 và số lớp
        valA = String(valA).toUpperCase();
        valB = String(valB).toUpperCase();
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [results, searchQuery, selectedOptionFilter, sortField, sortOrder]);

  // 📄 XUẤT BÁO CÁO FILE WORD (.DOC) THEO CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP
  const exportToWordDecree30 = () => {
    const reportElement = document.getElementById('decree30-report-content');
    if (!reportElement) return;

    const currentCampaign = campaigns.find(c => c.id === selectedCampaignId);
    const campaignTitle = currentCampaign?.title || 'CLB';

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Báo cáo theo Nghị định 30/2020/NĐ-CP</title>
        <style>
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 2.0cm 2.0cm 3.0cm; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; mso-paper-source: 0; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000000; }
          h2, h3, h4 { text-align: center; text-transform: uppercase; font-family: 'Times New Roman', serif; margin-top: 10px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 12px; }
          th, td { border: 1pt solid windowtext; padding: 6px 8px; font-size: 11pt; text-align: left; vertical-align: middle; }
          th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .header-table { width: 100%; border: none !important; margin-bottom: 15px; }
          .header-table td { border: none !important; text-align: center; vertical-align: top; padding: 0; }
          .footer-table { width: 100%; border: none !important; margin-top: 30px; }
          .footer-table td { border: none !important; text-align: center; vertical-align: top; padding: 0; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${reportElement.innerHTML}
        </div>
      </body>
      </html>
    `;

    let reportDocTitle = campaignTitle;
    if (selectedOptionFilter && selectedOptionFilter !== 'all') {
      reportDocTitle = `${selectedOptionFilter}`;
    }
    const cleanDocName = reportDocTitle.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_').trim();
    a.download = `Bao_cao_Nghi_dinh_30_${cleanDocName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteResult = async (r) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng ký này?")) return;
    try {
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      const client = campaign?._source === 'sb1' ? supabase : adminClient;
      
      const { error } = await client.from('cbq_student_registrations').delete().eq('id', r.id);
      if (error) throw error;
      fetchResults(selectedCampaignId);
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleEditResult = (r) => {
    setEditingResultData(r);
    setEditFormData(r.responses || {});
    setShowEditResultModal(true);
  };

  const handleSaveResult = async (e) => {
    e.preventDefault();
    try {
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      const client = campaign?._source === 'sb1' ? supabase : adminClient;
      
      const { error } = await client
        .from('cbq_student_registrations')
        .update({ responses: editFormData })
        .eq('id', editingResultData.id);
        
      if (error) throw error;
      alert("Cập nhật bài đăng ký thành công!");
      setShowEditResultModal(false);
      fetchResults(selectedCampaignId);
    } catch (err) {
      alert("Lỗi khi cập nhật: " + err.message);
    }
  };

  return (
    <Layout title="Quản lý Đăng ký Nội dung">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} color="#be123c" /> Quản Lý Đăng Ký Nội Dung Động
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Tạo các form đăng ký linh hoạt cho học sinh (CLB, đồng phục, ngoại khóa...)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/dang-ky-hoat-dong" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', textDecoration: 'none', padding: '10px 18px' }}
          >
            <Users size={18} /> Xem Cổng Đăng Ký
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('campaigns')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'campaigns' ? '3px solid #be123c' : '3px solid transparent', color: activeTab === 'campaigns' ? '#be123c' : '#475569' }}
        >
          <Settings size={18} /> Quản Lý Đợt Đăng Ký
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'results' ? '3px solid #be123c' : '3px solid transparent', color: activeTab === 'results' ? '#be123c' : '#475569' }}
        >
          <ListFilter size={18} /> Danh Sách Học Sinh Nộp
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'attendance' ? '3px solid #be123c' : '3px solid transparent', color: activeTab === 'attendance' ? '#be123c' : '#475569' }}
        >
          <CalendarCheck size={18} /> 🎯 Sổ Điểm Danh CLB Thông Minh (AI & Zalo)
        </button>
      </div>

      {loading ? <p>Đang nạp dữ liệu...</p> : (
        <>
          {activeTab === 'campaigns' && (
            <div>
              {!showForm && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                  <button 
                    onClick={() => {
                      setEditingId(null);
                      setTitle('');
                      setDescription('');
                      setTargetGrades([]);
                      setIsActive(true);
                      setFormSchema([]);
                      setShowForm(true);
                    }} 
                    className="btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', backgroundColor: '#be123c' }}
                  >
                    <Plus size={18} /> Tạo Đợt Đăng Ký Mới
                  </button>
                </div>
              )}

              {showForm && (
                <form onSubmit={handleSubmit} className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '2rem' }}>
                  <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                    {editingId ? '📝 Cập nhật Đợt đăng ký' : '➕ Tạo Đợt đăng ký mới'}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={styles.label}>Tên / Tiêu đề Đợt đăng ký (*)</label>
                      <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={styles.input} placeholder="VD: Đăng ký câu lạc bộ Hè 2026" />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={styles.label}>Mô tả / Ghi chú</label>
                      <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} style={styles.input} placeholder="Nhập mô tả chi tiết, hướng dẫn học sinh..."></textarea>
                    </div>

                    <div>
                      <label style={styles.label}>Đối tượng áp dụng (Mặc định: Tất cả học sinh toàn trường)</label>
                      <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                        {['Khối 10', 'Khối 11', 'Khối 12'].map(grade => (
                          <label key={grade} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={targetGrades.includes(grade)}
                              onChange={() => handleToggleGrade(grade)}
                            />
                            {grade}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* RÀNG BUỘC ĐIỀU KIỆN TIÊN QUYẾT: ĐÃ ĐĂNG KÝ CÂU LẠC BỘ MẸ */}
                    <div style={{ gridColumn: '1 / -1', background: '#eff6ff', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #bfdbfe' }}>
                      <label style={{ ...styles.label, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="#2563eb" /> Ràng buộc tư cách thành viên Câu lạc bộ (Chỉ cho HS đã đăng ký CLB chọn môn phụ):
                      </label>
                      <select
                        value={prerequisiteClub}
                        onChange={(e) => setPrerequisiteClub(e.target.value)}
                        style={{ ...styles.input, marginTop: '4px', borderColor: '#93c5fd', backgroundColor: '#ffffff', fontWeight: '600' }}
                      >
                        <option value="">-- Không ràng buộc (Mọi học sinh thuộc khối đều đăng ký được) --</option>
                        {Object.keys(CLUB_SUB_DISCIPLINES).map(clubKey => (
                          <option key={clubKey} value={clubKey}>
                            {clubKey} (Bắt buộc HS phải có tên trong danh sách đăng ký CLB này)
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#3b82f6', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                        * Nếu chọn CLB, hệ thống sẽ tự động đối soát CSDL Supabase 2 khi học sinh nhập tên. Chỉ học sinh đã đăng ký CLB này ở đợt 1 mới được nộp đơn!
                      </small>
                    </div>

                    <div>
                      <label style={styles.label}>Nơi lưu trữ máy chủ (Cân bằng tải)</label>
                      <select 
                        value={targetDb}
                        onChange={(e) => setTargetDb(e.target.value)}
                        style={{ ...styles.input, marginTop: '5px' }}
                        disabled={!!editingId} // Cannot change DB after creation
                      >
                        <option value="sb1">Supabase 1 (Server Chính)</option>
                        <option value="sb2">Supabase 2 (Server Phụ - Khuyên dùng)</option>
                      </select>
                      {editingId && <small style={{ color: '#64748b', fontSize: '11px' }}>*Không thể đổi máy chủ sau khi tạo.</small>}
                    </div>

                    <div>
                      <label style={styles.label}>Trạng thái Khóa / Mở</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                        <input 
                          type="checkbox" 
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#16a34a' : '#ef4444', fontSize: '14px' }}>
                          {isActive ? '🟢 Mở đăng ký (Hợp lệ)' : '🔴 Đã khóa (Tạm dừng đăng ký)'}
                        </span>
                      </label>
                    </div>

                    {/* HẠN CHÓT & HẸN GIỜ ĐÓNG MỞ TỰ ĐỘNG */}
                    <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 'bold' }}>
                        <Clock size={16} color="#0284c7" /> Lịch Đóng / Mở Đăng Ký Tự Động (Tùy chọn)
                      </div>
                      
                      <div>
                        <label style={styles.label}>Thời gian mở tự động (Start Date)</label>
                        <input 
                          type="datetime-local" 
                          value={startDate} 
                          onChange={e => setStartDate(e.target.value)} 
                          style={styles.input} 
                        />
                        <small style={{ color: '#64748b', fontSize: '11px' }}>Để trống nếu muốn mở ngay lập tức</small>
                      </div>

                      <div>
                        <label style={styles.label}>Hạn chót tự động đóng (End Date)</label>
                        <input 
                          type="datetime-local" 
                          value={endDate} 
                          onChange={e => setEndDate(e.target.value)} 
                          style={styles.input} 
                        />
                        <small style={{ color: '#64748b', fontSize: '11px' }}>Tự động chuyển sang trạng thái ⏰ Đã hết hạn</small>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={styles.label}>Thông báo hiển thị khi đợt bị Khóa / Hết hạn (Notice Message)</label>
                        <textarea 
                          rows={2} 
                          value={closedNotice} 
                          onChange={e => setClosedNotice(e.target.value)} 
                          style={styles.input} 
                          placeholder="VD: Đợt đăng ký này đã đóng lúc 17:00 ngày 15/10. Vui lòng liên hệ Thầy/Cô GVCN để biết thêm chi tiết."
                        />
                      </div>
                    </div>
                  </div>

                  {/* FORM BUILDER */}
                  <div style={{ marginTop: '30px', borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>🛠 Xây Dựng Câu Hỏi / Form (Tuỳ chỉnh)</h4>
                      <button type="button" onClick={handleAddField} style={{ padding: '6px 12px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                        + Thêm Câu Hỏi
                      </button>
                    </div>

                    {formSchema.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '13.5px', fontStyle: 'italic' }}>Chưa có câu hỏi nào. Học sinh sẽ chỉ cần xác thực Tên và Mã học sinh để hoàn tất.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {formSchema.map((field, index) => (
                          <div key={field.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative' }}>
                            <button type="button" onClick={() => handleRemoveField(field.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Xóa câu hỏi này">
                              <Trash2 size={16} />
                            </button>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Loại dữ liệu</label>
                                <select value={field.type} onChange={(e) => handleUpdateField(field.id, 'type', e.target.value)} style={{ ...styles.input, padding: '4px 8px', fontSize: '12px' }}>
                                  <option value="text">Văn bản ngắn (Text)</option>
                                  <option value="select">Chọn 1 từ danh sách (Dropdown)</option>
                                  <option value="radio">Chọn 1 phương án (Radio)</option>
                                  <option value="checkbox">Chọn nhiều phương án (Checkbox)</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tên câu hỏi / Nhãn câu hỏi (*)</label>
                                <input type="text" value={field.label} onChange={(e) => handleUpdateField(field.id, 'label', e.target.value)} style={{ ...styles.input, padding: '4px 8px', fontSize: '12px' }} required />
                              </div>
                            </div>

                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input type="checkbox" id={`req_${field.id}`} checked={field.required} onChange={(e) => handleUpdateField(field.id, 'required', e.target.checked)} />
                              <label htmlFor={`req_${field.id}`} style={{ fontSize: '12px', cursor: 'pointer', color: '#475569' }}>Bắt buộc nhập câu hỏi này</label>
                            </div>

                            {/* Options manager for select, radio, checkbox */}
                            {['select', 'radio', 'checkbox'].includes(field.type) && (
                              <div style={{ marginTop: '10px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Các lựa chọn (Options):</div>
                                {(!field.options || field.options.length === 0) && (
                                  <div style={{ fontSize: '12px', color: '#ef4444' }}>Vui lòng thêm ít nhất 1 lựa chọn!</div>
                                )}
                                {(field.options || []).map((opt, optIdx) => (
                                  <div key={optIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                    <input 
                                      type="text" 
                                      value={opt} 
                                      onChange={(e) => handleUpdateOption(field.id, optIdx, e.target.value)} 
                                      style={{ ...styles.input, padding: '4px 8px', fontSize: '12px' }} 
                                      placeholder={`Lựa chọn ${optIdx + 1}`}
                                      required
                                    />
                                    <button type="button" onClick={() => handleRemoveOption(field.id, optIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                                  </div>
                                ))}
                                <button type="button" onClick={() => handleAddOption(field.id)} style={{ fontSize: '11px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }}>
                                  + Thêm lựa chọn
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 24px', backgroundColor: '#be123c' }}>
                      <Save size={18} /> Lưu Cấu Hình
                    </button>
                  </div>
                </form>
              )}

              <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin: 0, color: '#be123c' }}>
                    📋 Danh sách các Đợt đăng ký ({campaigns.length})
                  </h3>

                  {/* NÚT THAO TÁC HÀNG LOẠT */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleBulkToggleLock(false)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Khóa tất cả các đợt đăng ký"
                    >
                      <Lock size={14} /> Khóa Tất Cả
                    </button>
                    <button 
                      onClick={() => handleBulkToggleLock(true)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #86efac', background: '#f0fdf4', color: '#16a34a', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Mở lại tất cả các đợt đăng ký"
                    >
                      <Unlock size={14} /> Mở Tất Cả
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                        <th style={{ padding: '10px' }}>Tiêu đề</th>
                        <th style={{ padding: '10px' }}>Khối áp dụng</th>
                        <th style={{ padding: '10px' }}>Nơi lưu</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                        <th style={{ padding: '10px' }}>Hạn chót</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.length === 0 ? (
                        <tr><td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>Chưa có đợt đăng ký nào</td></tr>
                      ) : campaigns.map(cam => {
                        const now = new Date();
                        const isExpired = cam.end_date && now > new Date(cam.end_date);
                        const isPending = cam.start_date && now < new Date(cam.start_date);
                        const schemaFields = Array.isArray(cam.form_schema) ? cam.form_schema : (cam.form_schema?.fields || []);

                        return (
                          <tr key={cam.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>
                              {cam.title}
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>
                                ({schemaFields.length} câu hỏi form)
                              </div>
                              {(cam.prerequisite_club || (cam.form_schema && !Array.isArray(cam.form_schema) && cam.form_schema.prerequisite_club)) && (
                                <div style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px', fontWeight: 'bold' }}>
                                  <ShieldCheck size={12} /> Yêu cầu: {cam.prerequisite_club || cam.form_schema?.prerequisite_club}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px', color: '#64748b' }}>
                              {!cam.target_grades || cam.target_grades.length === 0 ? 'Toàn trường' : cam.target_grades.join(', ')}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: cam._source === 'sb1' ? '#f1f5f9' : '#e0f2fe', color: cam._source === 'sb1' ? '#475569' : '#0369a1', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Server size={12} /> {cam._source === 'sb1' ? 'Server 1' : 'Server 2'}
                              </span>
                            </td>
                            <td style={{ padding: '10px' }}>
                              {!cam.is_active ? (
                                <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                  <Lock size={12} /> Đã khóa
                                </span>
                              ) : isPending ? (
                                <span style={{ color: '#d97706', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                  <Clock size={12} /> Chờ đến giờ
                                </span>
                              ) : isExpired ? (
                                <span style={{ color: '#ea580c', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff7ed', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                  <Clock size={12} /> Đã hết hạn
                                </span>
                              ) : (
                                <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                  🟢 Đang mở
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>
                              {cam.end_date ? new Date(cam.end_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Không có'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                {/* NÚT QUICK LOCK TOGGLE */}
                                <button 
                                  onClick={() => handleQuickToggleLock(cam)} 
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: cam.is_active ? '1px solid #fca5a5' : '1px solid #86efac', background: cam.is_active ? '#fef2f2' : '#f0fdf4', color: cam.is_active ? '#ef4444' : '#16a34a', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title={cam.is_active ? 'Bấm để Khóa đợt này' : 'Bấm để Mở lại đợt này'}
                                >
                                  {cam.is_active ? <Lock size={13} /> : <Unlock size={13} />}
                                  {cam.is_active ? 'Khóa' : 'Mở'}
                                </button>

                                {/* NÚT SOẠN TIN NHẮN ZALO & BÁO CÁO HS CHƯA ĐĂNG KÝ */}
                                <button 
                                  onClick={() => openZaloCampaignReminderModal(cam)} 
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0369a1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="Tạo tin nhắn Zalo đôn đốc và báo cáo danh sách học sinh chưa đăng ký cho GVCN"
                                >
                                  <MessageSquare size={13} /> 📲 Nhắc Zalo & Báo cáo
                                </button>

                                <button onClick={() => { setSelectedCampaignId(cam.id); setActiveTab('results'); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0284c7', cursor: 'pointer', fontSize: '12px' }}>
                                  Kết quả
                                </button>

                                <button onClick={() => handleEdit(cam)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer', fontSize: '12px' }}>
                                  <Edit3 size={13} /> Sửa
                                </button>

                                <button onClick={() => handleDelete(cam)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>
                                  <Trash2 size={13} /> Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontWeight: 'bold', color: '#334155', fontSize: '13.5px', whiteSpace: 'nowrap' }}>Chọn đợt đăng ký:</label>
                    <select 
                      value={selectedCampaignId} 
                      onChange={e => {
                        setSelectedCampaignId(e.target.value);
                        setSelectedOptionFilter('all');
                        setSearchQuery('');
                      }}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '220px', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}
                    >
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>

                  {/* Sắp xếp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowUpDown size={16} color="#64748b" />
                    <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>Xếp theo:</span>
                    <select 
                      value={sortField} 
                      onChange={e => setSortField(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="created_at">Thời gian nộp</option>
                      <option value="student_class">Lớp học</option>
                      <option value="student_name">Tên học sinh</option>
                      <option value="student_code">Mã học sinh</option>
                    </select>

                    <button 
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {sortOrder === 'asc' ? '⬆️ Tăng dần' : '⬇️ Giảm dần'}
                    </button>
                  </div>

                  {/* 🔍 Ô Tìm kiếm trực tiếp theo Tên / Mã HS / Lớp */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: '260px', flex: '1 1 260px' }}>
                    <Search size={16} color="#0284c7" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
                    <input 
                      type="text"
                      placeholder="🔍 Tìm theo Họ Tên, Mã HS, Lớp hoặc CLB..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 32px 7px 32px',
                        borderRadius: '6px',
                        border: '1.5px solid #0284c7',
                        backgroundColor: '#f0f9ff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="Xóa tìm kiếm"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => openZaloCampaignReminderModal(campaigns.find(c => c.id === selectedCampaignId))} 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#be123c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(190,18,60,0.3)' }}
                    title="Tạo tin nhắn Zalo đôn đốc và báo cáo danh sách học sinh chưa đăng ký cho đợt này"
                  >
                    <MessageSquare size={16} /> 📲 Xuất Tin Nhắn Zalo Nhắc Nhở
                  </button>

                  <button 
                    onClick={() => setShowReportModal(true)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(2,132,199,0.3)' }}
                  >
                    <Printer size={16} /> Xuất Báo Cáo (Nghị định 30)
                  </button>

                  <button 
                    onClick={exportToExcel} 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}
                    title={selectedOptionFilter !== 'all' ? `Xuất danh sách Excel riêng cho: ${selectedOptionFilter}` : 'Xuất toàn bộ danh sách Excel'}
                  >
                    <Download size={16} /> Xuất Excel {selectedOptionFilter !== 'all' ? `(${selectedOptionFilter})` : ''}
                  </button>
                </div>
              </div>

              {/* THỐNG KÊ NHANH & BỘ LỌC THEO LỰA CHỌN */}
              {!loadingResults && results.length > 0 && (() => {
                const currentCampaign = campaigns.find(c => c.id === selectedCampaignId);
                const campaignTitle = currentCampaign?.title || 'Đợt đăng ký';
                return (
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                        📊 Thống kê nhanh & Bộ lọc: <span style={{ color: '#047857', fontWeight: '800' }}>{campaignTitle}</span> (Bấm vào từng mục để lọc danh sách)
                      </h4>
                      {selectedOptionFilter !== 'all' && (
                        <button 
                          onClick={() => setSelectedOptionFilter('all')} 
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          <X size={14} /> Bỏ lọc ({selectedOptionFilter})
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      {/* Tổng số */}
                      <div 
                        onClick={() => setSelectedOptionFilter('all')}
                        style={{ 
                          background: selectedOptionFilter === 'all' ? '#166534' : '#fff', 
                          color: selectedOptionFilter === 'all' ? '#fff' : '#166534', 
                          padding: '10px 16px', 
                          borderRadius: '8px', 
                          border: '1px solid #dcfce7',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: '110px'
                        }}
                      >
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9 }}>TỔNG ĐĂNG KÝ</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{results.length}</div>
                      </div>
                      
                      {/* Thống kê từng lựa chọn */}
                      {(currentCampaign?.form_schema || [])
                        .filter(f => ['select', 'radio', 'checkbox'].includes(f.type))
                        .map(field => {
                          const counts = {};
                          results.forEach(r => {
                            const ans = r.responses[field.id];
                            if (Array.isArray(ans)) {
                              ans.forEach(a => counts[a] = (counts[a] || 0) + 1);
                            } else if (ans) {
                              counts[ans] = (counts[ans] || 0) + 1;
                            }
                          });

                          return (
                            <div key={field.id} style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', flex: 1, minWidth: '260px' }}>
                              <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                                {field.label}
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {Object.entries(counts).map(([opt, count]) => {
                                  const isSelected = selectedOptionFilter === opt;
                                  return (
                                    <div 
                                      key={opt} 
                                      onClick={() => setSelectedOptionFilter(isSelected ? 'all' : opt)}
                                      style={{ 
                                        display: 'flex', 
                                        justify: 'space-between', 
                                        alignItems: 'center',
                                        fontSize: '13px', 
                                        padding: '5px 8px',
                                        borderRadius: '5px',
                                        backgroundColor: isSelected ? '#15803d' : '#f8fafc',
                                        color: isSelected ? '#ffffff' : '#334155',
                                        cursor: 'pointer',
                                        fontWeight: isSelected ? 'bold' : 'normal',
                                        border: isSelected ? '1px solid #166534' : '1px solid #f1f5f9',
                                        transition: 'all 0.15s'
                                      }}
                                    >
                                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>{opt}</span>
                                      <span style={{ 
                                        backgroundColor: isSelected ? '#ffffff' : '#e2e8f0', 
                                        color: isSelected ? '#15803d' : '#0f172a',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                      }}>
                                        {count}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                );
              })()}

              {/* BẢNG DANH SÁCH HỌC SINH NỘP */}
              {loadingResults ? <p>Đang tải danh sách học sinh đăng ký...</p> : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>Hiển thị <strong>{filteredAndSortedResults.length}</strong> / <strong>{results.length}</strong> học sinh</span>
                      
                      {searchQuery && (
                        <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bae6fd' }}>
                          🔍 Tìm: "{searchQuery}"
                          <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} title="Bỏ tìm kiếm"><X size={12} /></button>
                        </span>
                      )}

                      {selectedOptionFilter !== 'all' && (
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                          📌 Lựa chọn: {selectedOptionFilter}
                          <button onClick={() => setSelectedOptionFilter('all')} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} title="Bỏ lọc"><X size={12} /></button>
                        </span>
                      )}

                      {(searchQuery || selectedOptionFilter !== 'all') && (
                        <button 
                          onClick={() => { setSearchQuery(''); setSelectedOptionFilter('all'); }}
                          style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: '2px 6px', fontWeight: 'bold' }}
                        >
                          ✕ Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', background: '#f8fafc' }}>
                          <th style={{ padding: '10px 12px', whiteSpace: 'nowrap', width: '50px', textAlign: 'center' }}>STT</th>
                          <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Thời gian</th>
                          <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Mã HS</th>
                          <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Họ và Tên</th>
                          <th style={{ padding: '10px 14px', whiteSpace: 'nowrap', minWidth: '75px', textAlign: 'center' }}>Lớp</th>
                          {/* Render dynamic columns based on campaign schema */}
                          {(campaigns.find(c => c.id === selectedCampaignId)?.form_schema || []).map(field => (
                            <th key={field.id} style={{ padding: '10px 12px', color: '#0284c7' }}>{field.label}</th>
                          ))}
                          <th style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap', width: '80px' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedResults.length === 0 ? (
                          <tr><td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy học sinh nào phù hợp với từ khóa hoặc bộ lọc</td></tr>
                        ) : filteredAndSortedResults.map((r, idx) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                            <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString('vi-VN')}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{r.student_code}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>{r.student_name}</td>
                            <td style={{ padding: '10px 14px', color: '#be123c', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>{r.student_class}</td>
                            
                            {(campaigns.find(c => c.id === selectedCampaignId)?.form_schema || []).map(field => {
                              const ans = r.responses[field.id];
                              let displayAns = ans;
                              if (Array.isArray(ans)) displayAns = ans.join(', ');
                              return <td key={field.id} style={{ padding: '10px 12px', fontWeight: (selectedOptionFilter && displayAns?.includes(selectedOptionFilter)) || (searchQuery && displayAns?.toLowerCase().includes(searchQuery.toLowerCase())) ? 'bold' : 'normal', color: selectedOptionFilter && displayAns?.includes(selectedOptionFilter) ? '#166534' : 'inherit' }}>{displayAns || '-'}</td>;
                            })}
                            <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button onClick={() => handleEditResult(r)} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', marginRight: '10px' }} title="Sửa">
                                <Edit3 size={16} />
                              </button>
                              <button onClick={() => handleDeleteResult(r)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Xóa">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <ClubAttendanceManager 
              userRole="admin" 
              campaigns={campaigns} 
              registrations={results} 
            />
          )}
        </>
      )}

      {/* 📄 MODAL XUẤT BÁO CÁO THEO CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 Xuất Báo Cáo Chuẩn Định Dạng Văn Bản (Nghị định 30/2020/NĐ-CP)
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={exportToWordDecree30} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <Download size={16} /> Tải File Word (.doc)
                </button>

                <button 
                  onClick={() => window.print()} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <Printer size={16} /> In Văn Bản / Xuất PDF
                </button>

                <button 
                  onClick={() => setShowReportModal(false)} 
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Khung Xem Trước Báo Cáo Chuẩn A4 Nghị Định 30 */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #cbd5e1', padding: '30px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              
              <div 
                id="decree30-report-content"
                style={{ 
                  backgroundColor: '#ffffff', 
                  padding: '40px 50px', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
                  fontFamily: '"Times New Roman", Times, serif', 
                  fontSize: '13pt', 
                  lineHeight: '1.4', 
                  color: '#000000',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}
              >
                {/* 1. KHUNG QUỐC HIỆU - TIÊU NGỮ HÀNH CHÍNH CHUẨN NĐ 30 */}
                <table className="header-table" style={{ width: '100%', border: 'none', marginBottom: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%', textStyle: 'none', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'normal', textTransform: 'uppercase' }}>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</div>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'underline' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                        <div style={{ fontSize: '12pt', fontStyle: 'italic', marginTop: '4px' }}>Số: ..... /BC-CBQ</div>
                      </td>
                      <td style={{ width: '55%', textStyle: 'none', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div style={{ fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</div>
                        <div style={{ fontSize: '13pt', fontStyle: 'italic', marginTop: '6px' }}>Tân An, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. TÊN LOẠI VĂN BẢN VÀ TRÍCH YẾU NỘI DUNG */}
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '25px' }}>
                  <h2 style={{ fontSize: '15pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 8px 0' }}>BÁO CÁO</h2>
                  <div style={{ fontSize: '13.5pt', fontWeight: 'bold' }}>
                    Về việc tổng hợp danh sách học sinh đăng ký tham gia {(campaigns.find(c => c.id === selectedCampaignId)?.title || 'Hoạt động học đường').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12pt', fontStyle: 'italic', marginTop: '4px' }}>Năm học 2026 - 2027</div>
                </div>

                <div style={{ marginBottom: '15px', textIndent: '1cm' }}>
                  Kính gửi: Ban Giám hiệu Trường THPT Cao Bá Quát.
                </div>

                <div style={{ marginBottom: '15px', textIndent: '1cm' }}>
                  Căn cứ Kế hoạch tổ chức các hoạt động giáo dục, rèn luyện kỹ năng và phong trào học đường năm học 2026 - 2027; Ban Tổ chức xin báo cáo tổng hợp kết quả đăng ký của học sinh như sau:
                </div>

                {/* I. ĐÁNH GIÁ TỔNG QUAN */}
                <div style={{ fontWeight: 'bold', fontSize: '13pt', marginTop: '15px', marginBottom: '8px' }}>
                  I. KHÁI QUÁT CHUNG
                </div>
                <div style={{ textIndent: '1cm', marginBottom: '10px' }}>
                  Tính đến ngày {new Date().toLocaleDateString('vi-VN')}, Hệ thống Cổng thông tin học đường đã ghi nhận tổng cộng <strong>{results.length}</strong> lượt học sinh hoàn tất đăng ký thông tin hợp lệ.
                </div>

                {/* II. BẢNG THỐNG KÊ CHI TIẾT SỐ LƯỢNG */}
                <div style={{ fontWeight: 'bold', fontSize: '13pt', marginTop: '15px', marginBottom: '8px' }}>
                  II. BẢNG THỐNG KÊ SỐ LƯỢNG THEO TỪNG CÂU LẠC BỘ / NỘI DUNG
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '50px' }}>STT</th>
                      <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left' }}>Tên Nội dung / Câu lạc bộ đăng ký</th>
                      <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '100px' }}>Số lượng</th>
                      <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '100px' }}>Tỷ lệ (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const schema = campaigns.find(c => c.id === selectedCampaignId)?.form_schema || [];
                      const selectField = schema.find(f => ['select', 'radio', 'checkbox'].includes(f.type));
                      if (!selectField) return <tr><td colSpan="4" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>Không có bảng thống kê phân loại</td></tr>;

                      const counts = {};
                      results.forEach(r => {
                        const ans = r.responses[selectField.id];
                        if (Array.isArray(ans)) {
                          ans.forEach(a => counts[a] = (counts[a] || 0) + 1);
                        } else if (ans) {
                          counts[ans] = (counts[ans] || 0) + 1;
                        }
                      });

                      const totalCount = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

                      return Object.entries(counts).map(([opt, count], i) => (
                        <tr key={opt}>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>{opt}</td>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{count}</td>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{((count / totalCount) * 100).toFixed(1)}%</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>

                {/* III. DANH SÁCH CHI TIẾT HỌC SINH ĐĂNG KÝ */}
                <div style={{ fontWeight: 'bold', fontSize: '13pt', marginTop: '20px', marginBottom: '8px' }}>
                  III. DANH SÁCH CHI TIẾT HỌC SINH ĐĂNG KÝ {selectedOptionFilter !== 'all' ? `(${selectedOptionFilter.toUpperCase()})` : ''}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '40px' }}>STT</th>
                      <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '110px' }}>Mã Học Sinh</th>
                      <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Họ và Tên Học Sinh</th>
                      <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '60px' }}>Lớp</th>
                      <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Nội dung / Câu lạc bộ đã chọn</th>
                      <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '90px' }}>Ngày Đăng Ký</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedResults.map((r, i) => {
                      const schema = campaigns.find(c => c.id === selectedCampaignId)?.form_schema || [];
                      const ansStr = schema.map(f => {
                        const a = r.responses[f.id];
                        return Array.isArray(a) ? a.join(', ') : (a || '');
                      }).filter(Boolean).join('; ');

                      return (
                        <tr key={r.id}>
                          <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{r.student_code}</td>
                          <td style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold' }}>{r.student_name}</td>
                          <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>{r.student_class}</td>
                          <td style={{ border: '1px solid black', padding: '5px' }}>{ansStr || '-'}</td>
                          <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center', fontSize: '10pt' }}>{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* IV. CHỮ KÝ & THẨM QUYỀN BAN HÀNH CHUẨN NĐ 30 */}
                <table className="footer-table" style={{ width: '100%', border: 'none', marginTop: '35px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%', border: 'none', textAlign: 'left', verticalAlign: 'top', padding: 0 }}>
                        <div style={{ fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic' }}>Nơi nhận:</div>
                        <div style={{ fontSize: '11pt' }}>- Ban Giám hiệu (để b/c);</div>
                        <div style={{ fontSize: '11pt' }}>- Các Ban/Tổ Chuyên môn;</div>
                        <div style={{ fontSize: '11pt' }}>- Lưu: VT, BTC.</div>
                      </td>
                      <td style={{ width: '55%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>TM. BAN TỔ CHỨC</div>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '60px' }}>TRƯỞNG BAN</div>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>(Ký, đóng dấu và ghi rõ họ tên)</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* EDIT RESULT MODAL */}
      {showEditResultModal && editingResultData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={handleSaveResult} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              ✏️ Sửa thông tin đăng ký
            </h3>
            
            <div style={{ marginBottom: '16px', fontSize: '13.5px', color: '#475569' }}>
              <strong>Học sinh:</strong> {editingResultData.student_name} ({editingResultData.student_class}) <br/>
              <strong>Mã HS:</strong> {editingResultData.student_code}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {(campaigns.find(c => c.id === selectedCampaignId)?.form_schema || []).map(field => {
                const value = editFormData[field.id] || (field.type === 'checkbox' ? [] : '');
                
                return (
                  <div key={field.id}>
                    <label style={styles.label}>{field.label}</label>
                    
                    {field.type === 'text' && (
                      <input 
                        type="text" 
                        value={value} 
                        onChange={e => setEditFormData({...editFormData, [field.id]: e.target.value})} 
                        style={styles.input} 
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <textarea 
                        value={value} 
                        rows={3}
                        onChange={e => setEditFormData({...editFormData, [field.id]: e.target.value})} 
                        style={styles.input} 
                      ></textarea>
                    )}
                    
                    {field.type === 'select' && (
                      <select 
                        value={value} 
                        onChange={e => setEditFormData({...editFormData, [field.id]: e.target.value})} 
                        style={styles.input}
                      >
                        <option value="">-- Chọn --</option>
                        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    
                    {field.type === 'radio' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                        {(field.options || []).map(opt => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name={`field_${field.id}`}
                              value={opt}
                              checked={value === opt}
                              onChange={e => setEditFormData({...editFormData, [field.id]: e.target.value})}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {field.type === 'checkbox' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                        {(field.options || []).map(opt => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={Array.isArray(value) && value.includes(opt)}
                              onChange={e => {
                                let newArr = Array.isArray(value) ? [...value] : [];
                                if (e.target.checked) newArr.push(opt);
                                else newArr = newArr.filter(item => item !== opt);
                                setEditFormData({...editFormData, [field.id]: newArr});
                              }}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowEditResultModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
                Hủy
              </button>
              <button type="submit" style={{ padding: '8px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}
      {/* 📲 MODAL ZALO REMINDER & UNREGISTERED REPORT FOR DYNAMIC CAMPAIGNS */}
      {showZaloCampaignModal && zaloCampaign && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '750px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#be123c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                  <MessageSquare size={22} color="#be123c" /> Xuất Tin Nhắn Zalo Nhắc Nhở & Báo Cáo HS Chưa Đăng Ký
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Đợt đăng ký: <strong>{zaloCampaign.title}</strong>
                </p>
              </div>
              <button onClick={() => setShowZaloCampaignModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {loadingZaloData ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#be123c', fontWeight: 'bold' }}>
                ⏳ Đang tải danh sách học sinh và tổng hợp dữ liệu chưa đăng ký...
              </div>
            ) : (
              <div>
                {/* Filters Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px', background: '#fff1f2', padding: '12px', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                  <div>
                    <label style={{ ...styles.label, color: '#9f1239' }}>1. Lọc Theo Lớp:</label>
                    <select 
                      value={zaloTargetClass} 
                      onChange={e => setZaloTargetClass(e.target.value)}
                      style={{ ...styles.input, backgroundColor: 'white', fontWeight: 'bold' }}
                    >
                      <option value="ALL">-- Tất cả các Lớp --</option>
                      {Array.from(new Set(zaloAllStudents.map(s => s.student_class).filter(Boolean)))
                        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                        .map(cls => (
                          <option key={cls} value={cls}>Lớp {cls}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ ...styles.label, color: '#9f1239' }}>2. Lọc Theo Khối:</label>
                    <select 
                      value={zaloTargetGrade} 
                      onChange={e => setZaloTargetGrade(e.target.value)}
                      style={{ ...styles.input, backgroundColor: 'white', fontWeight: 'bold' }}
                    >
                      <option value="ALL">-- Tất cả Khối --</option>
                      <option value="Khối 10">Khối 10</option>
                      <option value="Khối 11">Khối 11</option>
                      <option value="Khối 12">Khối 12</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ ...styles.label, color: '#9f1239' }}>3. Mẫu Tin Nhắn Zalo:</label>
                    <select 
                      value={zaloTemplateType} 
                      onChange={e => setZaloTemplateType(e.target.value)}
                      style={{ ...styles.input, backgroundColor: 'white', fontWeight: 'bold' }}
                    >
                      <option value="class_group">💬 Mẫu 1: Nhóm Zalo Lớp (GVCN)</option>
                      <option value="school_report">📊 Mẫu 2: Tiến Độ Toàn Trường</option>
                      <option value="simple_list">📋 Mẫu 3: Danh Sách Rút Gọn</option>
                    </select>
                  </div>
                </div>

                {/* Textarea displaying message */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ ...styles.label, margin: 0 }}>Nội dung tin nhắn Zalo (Đã tự động tổng hợp & sẵn sàng copy):</label>
                    {zaloCopiedToast && (
                      <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Đã sao chép vào bộ nhớ tạm!
                      </span>
                    )}
                  </div>
                  <textarea 
                    rows={12} 
                    readOnly
                    value={generateZaloCampaignReminderMessage()} 
                    style={{ ...styles.input, fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5', background: '#f8fafc', color: '#0f172a', resize: 'vertical' }}
                  />
                </div>

                {/* Footer Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <a 
                    href="https://chat.zalo.me" 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#0284c7', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    <ExternalLink size={16} /> Mở Zalo Web (chat.zalo.me)
                  </a>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      onClick={exportUnregisteredCampaignToExcel} 
                      style={{ padding: '9px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                      title="Tải file Excel danh sách học sinh chưa hoàn thành đăng ký"
                    >
                      <Download size={16} /> Xuất Excel Chưa Đăng Ký
                    </button>

                    <button 
                      type="button" 
                      onClick={handleCopyZaloCampaignMessage} 
                      style={{ padding: '9px 20px', background: zaloCopiedToast ? '#16a34a' : '#be123c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', transition: 'all 0.2s' }}
                    >
                      {zaloCopiedToast ? <Check size={16} /> : <Copy size={16} />}
                      {zaloCopiedToast ? 'Đã Sao Chép!' : 'Sao Chép Tin Nhắn Zalo'}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setShowZaloCampaignModal(false)} 
                      style={{ padding: '9px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', fontSize: '13px' }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  tabBtn: { padding: '12px 20px', background: 'none', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};
