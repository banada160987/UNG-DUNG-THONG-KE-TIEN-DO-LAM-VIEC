import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  FolderOpen, Settings, Save, AlertCircle, ArrowLeft, Plus, CheckCircle2, 
  XCircle, Clock, FileText, ExternalLink, Filter, Eye, Check, RefreshCw, MessageSquare, ShieldCheck 
} from 'lucide-react';
import FileUpload from '../components/FileUpload';

export default function DepartmentDrive() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const isTeacherPortal = location.pathname.includes('/teacher-dashboard');
  const isAdmin = role === 'admin' && !isTeacherPortal;

  // Navigation & View Mode
  const [activeMainTab, setActiveMainTab] = useState('dossiers'); // 'dossiers' | 'drive'
  const [loading, setLoading] = useState(true);
  
  // Department & User Info
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [teacherDept, setTeacherDept] = useState('');
  const [isTTCM, setIsTTCM] = useState(false);
  
  // Google Drive Iframe Config
  const [driveConfig, setDriveConfig] = useState(null);
  const [folderIdInput, setFolderIdInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // Workflow & Dossiers State
  const [categories, setCategories] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);

  // Submit Form State
  const [submitForm, setSubmitForm] = useState({
    category_id: '',
    week_number: 1,
    title: '',
    file_url: '',
    drive_url: '',
    school_year: '2025-2026',
    term: 'HK1'
  });
  const [submitting, setSubmitting] = useState(false);

  // Review & Inspection Form State
  const [reviewNote, setReviewNote] = useState('');
  const [inspectionData, setInspectionData] = useState({
    rating_score: 'Tốt',
    comments: ''
  });
  const [inspectionsList, setInspectionsList] = useState([]);

  // Fetch Initial Data
  const handleSelectDept = useCallback(async (deptName) => {
    setSelectedDept(deptName);
    setLoading(true);
    setShowConfig(false);
    
    try {
      // 1. Fetch Drive Config for Google Drive Tab
      const { data: driveData } = await supabase
        .from('cbq_external_links')
        .select('*')
        .eq('type', 'department_drive')
        .eq('category', deptName)
        .maybeSingle();
        
      if (driveData) {
        setDriveConfig(driveData);
        setFolderIdInput(driveData.url || '');
      } else {
        setDriveConfig(null);
        setFolderIdInput('');
      }

      // 2. Fetch Dossiers for this Department
      let query = supabase.from('cbq_dossiers').select('*').order('created_at', { ascending: false });
      if (deptName && deptName !== 'ALL') {
        query = query.eq('department_name', deptName);
      }
      const { data: dossierData } = await query;
      setDossiers(dossierData || []);

    } catch (err) {
      console.warn("Lỗi nạp dữ liệu Tổ chuyên môn:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('cbq_dossier_categories').select('*').order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setCategories(data);
        setSubmitForm(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      console.warn("Nạp danh mục hồ sơ:", err);
    }
  };

  const init = useCallback(async () => {
    setLoading(true);
    await fetchCategories();
    
    // Fetch unique departments from staff
    const { data: staffData } = await supabase.from('cbq_staff').select('department, name, title');
    let allDepts = [];
    if (staffData) {
      allDepts = [...new Set(staffData.map(s => s.department))].filter(Boolean);
      setDepartments(allDepts);
    }

    if (isAdmin) {
      if (allDepts.length > 0) {
        handleSelectDept(allDepts[0]);
      } else {
        setLoading(false);
      }
    } else if (isTeacherPortal) {
      const teacherStr = localStorage.getItem('cbq_current_teacher');
      if (teacherStr) {
        const teacher = JSON.parse(teacherStr);
        setCurrentTeacher(teacher);
        const staffMatch = staffData?.find(s => s.name === teacher.full_name);
        if (staffMatch) {
          setTeacherDept(staffMatch.department);
          const isLead = staffMatch.title && (
            staffMatch.title.toLowerCase().includes('tổ trưởng') || 
            staffMatch.title.toLowerCase().includes('ttcm')
          );
          setIsTTCM(isLead);
          handleSelectDept(staffMatch.department);
        } else {
          setLoading(false);
        }
      } else {
        navigate('/dang-nhap-giao-vien');
      }
    }
  }, [isAdmin, isTeacherPortal, handleSelectDept, navigate]);

  useEffect(() => {
    init();
  }, [init]);

  // Google Drive Save Config
  const handleSaveConfig = async () => {
    if (!folderIdInput.trim()) {
      alert('Vui lòng nhập Folder ID!');
      return;
    }
    
    let finalFolderId = folderIdInput.trim();
    if (finalFolderId.includes('folders/')) {
      finalFolderId = finalFolderId.split('folders/')[1].split('?')[0];
    } else if (finalFolderId.includes('id=')) {
      finalFolderId = finalFolderId.split('id=')[1].split('&')[0];
    }

    setLoading(true);
    if (driveConfig?.id) {
      await supabase
        .from('cbq_external_links')
        .update({ url: finalFolderId, title: `Hồ sơ ${selectedDept}` })
        .eq('id', driveConfig.id);
    } else {
      await supabase
        .from('cbq_external_links')
        .insert([{
          type: 'department_drive',
          category: selectedDept,
          url: finalFolderId,
          title: `Hồ sơ ${selectedDept}`,
          is_active: true
        }]);
    }
    
    await handleSelectDept(selectedDept);
  };

  // Submit Dossier Logic
  const handleSubmitDossier = async (e) => {
    e.preventDefault();
    if (!submitForm.title.trim()) {
      alert("Vui lòng nhập Tên bài dạy / Tên hồ sơ!");
      return;
    }
    if (!submitForm.file_url && !submitForm.drive_url) {
      alert("Vui lòng Upload tệp PDF/Word hoặc Dán Link Google Drive!");
      return;
    }

    setSubmitting(true);
    try {
      const selectedCategory = categories.find(c => c.id === submitForm.category_id);
      const payload = {
        category_id: submitForm.category_id,
        category_code: selectedCategory?.code || 'GIAO_AN_TUAN',
        department_name: selectedDept || teacherDept,
        teacher_name: currentTeacher?.full_name || (isAdmin ? 'Ban Giám Hiệu' : 'Giáo viên'),
        teacher_code: currentTeacher?.username || 'GV',
        school_year: submitForm.school_year,
        term: submitForm.term,
        week_number: Number(submitForm.week_number) || 1,
        title: submitForm.title.trim(),
        file_url: submitForm.file_url,
        drive_url: submitForm.drive_url.trim(),
        status: 'pending'
      };

      const { error } = await supabase.from('cbq_dossiers').insert([payload]);
      if (error) throw error;

      alert("🎉 Nộp hồ sơ / giáo án thành công! Đã gửi thông báo tới Tổ trưởng chuyên môn.");
      setShowSubmitModal(false);
      setSubmitForm({
        category_id: categories[0]?.id || '',
        week_number: 1,
        title: '',
        file_url: '',
        drive_url: '',
        school_year: '2025-2026',
        term: 'HK1'
      });
      handleSelectDept(selectedDept || teacherDept);
    } catch (err) {
      alert("Lỗi khi nộp hồ sơ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // TTCM Review Logic (Approve / Reject)
  const handleReviewDossier = async (newStatus) => {
    if (!selectedDossier) return;
    setSubmitting(true);
    try {
      const reviewerName = currentTeacher?.full_name || 'Tổ trưởng Chuyên môn';
      const { error } = await supabase
        .from('cbq_dossiers')
        .update({
          status: newStatus,
          reviewer_name: reviewerName,
          reviewer_note: reviewNote.trim(),
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedDossier.id);

      if (error) throw error;

      alert(`✅ Đã cập nhật trạng thái hồ sơ thành: ${newStatus === 'approved' ? 'ĐÃ DUYỆT' : 'YÊU CẦU SỬA LẠI'}`);
      setShowReviewModal(false);
      setSelectedDossier(null);
      setReviewNote('');
      handleSelectDept(selectedDept || teacherDept);
    } catch (err) {
      alert("Lỗi cập nhật đánh giá: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // BGH Inspection Logic
  const openInspectModal = async (dossier) => {
    setSelectedDossier(dossier);
    setShowInspectModal(true);
    setInspectionData({ rating_score: 'Tốt', comments: '' });
    try {
      const { data } = await supabase
        .from('cbq_dossier_inspections')
        .select('*')
        .eq('dossier_id', dossier.id)
        .order('created_at', { ascending: false });
      setInspectionsList(data || []);
    } catch (err) {
      console.warn("Nạp nhật ký thanh tra:", err);
    }
  };

  const handleAddInspection = async (e) => {
    e.preventDefault();
    if (!selectedDossier) return;
    setSubmitting(true);
    try {
      const inspectorName = currentTeacher?.full_name || 'Lãnh đạo BGH';
      const payload = {
        dossier_id: selectedDossier.id,
        inspector_name: inspectorName,
        inspector_role: isAdmin ? 'BGH' : (isTTCM ? 'TTCM' : 'Thanh_tra'),
        rating_score: inspectionData.rating_score,
        comments: inspectionData.comments.trim()
      };

      const { error } = await supabase.from('cbq_dossier_inspections').insert([payload]);
      if (error) throw error;

      alert("🎉 Ghi nhận kết quả kiểm tra / thanh tra thành công!");
      const { data } = await supabase
        .from('cbq_dossier_inspections')
        .select('*')
        .eq('dossier_id', selectedDossier.id)
        .order('created_at', { ascending: false });
      setInspectionsList(data || []);
      setInspectionData({ rating_score: 'Tốt', comments: '' });
    } catch (err) {
      alert("Lỗi lưu nhận xét thanh tra: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Dossier
  const handleDeleteDossier = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ / giáo án này không?")) return;
    try {
      await supabase.from('cbq_dossiers').delete().eq('id', id);
      setDossiers(dossiers.filter(d => d.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const canConfigDrive = isAdmin || isTTCM;
  const canReview = isTTCM || isAdmin;

  // Filtered Dossiers
  const filteredDossiers = dossiers.filter(d => {
    if (selectedWeekFilter !== 'ALL' && d.week_number !== Number(selectedWeekFilter)) return false;
    if (selectedStatusFilter !== 'ALL' && d.status !== selectedStatusFilter) return false;
    return true;
  });

  // Calculate Metrics Summary
  const totalCount = filteredDossiers.length;
  const pendingCount = filteredDossiers.filter(d => d.status === 'pending').length;
  const approvedCount = filteredDossiers.filter(d => d.status === 'approved').length;
  const rejectedCount = filteredDossiers.filter(d => d.status === 'rejected').length;

  const content = (
    <div style={{ padding: '20px', maxWidth: '1280px', margin: '0 auto', fontFamily: '"Inter", system-ui, sans-serif' }}>
      {/* Header Bar */}
      {isTeacherPortal && (
        <button 
          onClick={() => navigate('/teacher-dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px', color: '#475569', fontWeight: 'bold' }}
        >
          <ArrowLeft size={16} /> Quay lại Bảng điều khiển
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 4px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderOpen color="#2563eb" size={28} />
            Hồ Sơ & Giáo Án Tổ Chuyên Môn
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            Quy trình quản lý, phê duyệt giáo án & kiểm tra hồ sơ từ Giáo viên ➔ Tổ trưởng ➔ Ban Giám Hiệu
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
          >
            <Plus size={18} /> Nộp Hồ Sơ / Giáo Án
          </button>

          {canConfigDrive && activeMainTab === 'drive' && driveConfig && !showConfig && (
            <button 
              onClick={() => setShowConfig(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Settings size={16} /> Cài đặt Google Drive
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveMainTab('dossiers')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeMainTab === 'dossiers' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeMainTab === 'dossiers' ? '#2563eb' : '#64748b',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={18} /> 📑 Quản Lý & Duyệt Giáo Án
        </button>
        <button
          onClick={() => setActiveMainTab('drive')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeMainTab === 'drive' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeMainTab === 'drive' ? '#2563eb' : '#64748b',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FolderOpen size={18} /> 🌐 Thư Mục Google Drive Dùng Chung
        </button>
      </div>

      {/* Admin Department Switcher */}
      {isAdmin && (
        <div style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>🏛️ Chọn Tổ Chuyên Môn:</span>
          <select 
            value={selectedDept} 
            onChange={(e) => handleSelectDept(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 'bold', color: '#1e293b', background: 'white' }}
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      {/* TAB 1: WORKFLOW DOSSIERS */}
      {activeMainTab === 'dossiers' && (
        <div>
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>TỔNG SỐ HỒ SƠ / GIÁO ÁN</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{totalCount}</div>
            </div>

            <div style={{ background: '#fffbe6', padding: '16px 20px', borderRadius: '12px', border: '1px solid #ffe58f', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ color: '#d48806', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> CHỜ DUYỆT (TTCM)
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#d48806' }}>{pendingCount}</div>
            </div>

            <div style={{ background: '#f6ffed', padding: '16px 20px', borderRadius: '12px', border: '1px solid #b7eb8f', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ color: '#389e0d', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> ĐÃ DUYỆT OK
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#389e0d' }}>{approvedCount}</div>
            </div>

            <div style={{ background: '#fff2f0', padding: '16px 20px', borderRadius: '12px', border: '1px solid #ffccc7', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ color: '#cf1322', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <XCircle size={16} /> YÊU CẦU SỬA LẠI
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#cf1322' }}>{rejectedCount}</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={16} color="#64748b" />
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Lọc theo Tuần:</span>
                <select 
                  value={selectedWeekFilter}
                  onChange={e => setSelectedWeekFilter(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="ALL">Tất cả các Tuần</option>
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Tuần {w}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Trạng thái:</span>
                <select 
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="pending">⏳ Chờ duyệt</option>
                  <option value="approved">✅ Đã duyệt</option>
                  <option value="rejected">❌ Yêu cầu sửa lại</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => handleSelectDept(selectedDept || teacherDept)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>

          {/* Dossiers Table */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            {loading ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>Đang nạp hồ sơ...</div>
            ) : filteredDossiers.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>
                <FileText size={48} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <h3>Chưa có hồ sơ / giáo án nào được nộp</h3>
                <p>Nhấn nút "Nộp Hồ Sơ / Giáo Án" phía trên để nộp bài dạy mới.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Tuần</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Tên Bài Dạy / Hồ Sơ</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Giáo Viên Nộp</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>File / Drive Link</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Trạng Thái Duyệt</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Nhận Xét Tổ Trưởng</th>
                      <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDossiers.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2563eb' }}>
                          Tuần {d.week_number}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{d.title}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{d.school_year} • {d.term}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 'bold', color: '#334155' }}>{d.teacher_name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{d.department_name}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {d.file_url && (
                            <a href={d.file_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'none', marginRight: '10px' }}>
                              <FileText size={14} /> Tệp PDF/Doc
                            </a>
                          )}
                          {d.drive_url && (
                            <a href={d.drive_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>
                              <ExternalLink size={14} /> Google Drive
                            </a>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {d.status === 'approved' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                              <CheckCircle2 size={14} /> Đã duyệt
                            </span>
                          )}
                          {d.status === 'rejected' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#fff2f0', color: '#cf1322', border: '1px solid #ffccc7', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                              <XCircle size={14} /> Yêu cầu sửa
                            </span>
                          )}
                          {(!d.status || d.status === 'pending') && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#fffbe6', color: '#d48806', border: '1px solid #ffe58f', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                              <Clock size={14} /> Chờ duyệt
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>
                          {d.reviewer_note ? (
                            <div>
                              <div>{d.reviewer_note}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>bởi {d.reviewer_name}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1', italic: 'true' }}>Chưa có nhận xét</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {canReview && (
                              <button
                                onClick={() => {
                                  setSelectedDossier(d);
                                  setReviewNote(d.reviewer_note || '');
                                  setShowReviewModal(true);
                                }}
                                style={{ padding: '4px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                title="Đánh giá & Phê duyệt"
                              >
                                Duyệt
                              </button>
                            )}

                            <button
                              onClick={() => openInspectModal(d)}
                              style={{ padding: '4px 10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                              title="Thanh tra BGH"
                            >
                              Thanh tra
                            </button>

                            {(isAdmin || d.teacher_name === currentTeacher?.full_name) && (
                              <button
                                onClick={() => handleDeleteDossier(d.id)}
                                style={{ padding: '4px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE DRIVE IFRAME */}
      {activeMainTab === 'drive' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={18} color="#3b82f6" />
              Thư mục Google Drive Dùng Chung: {selectedDept}
            </h2>
          </div>

          <div style={{ padding: '20px' }}>
            {(!driveConfig || showConfig) && canConfigDrive ? (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>Cấu hình Google Drive cho {selectedDept}</h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#64748b' }}>
                  1. Tạo thư mục trên Google Drive.<br/>
                  2. Chia sẻ thư mục với quyền <b>"Bất kỳ ai có liên kết đều có thể xem (hoặc sửa)"</b>.<br/>
                  3. Copy Link chia sẻ hoặc Folder ID dán vào ô bên dưới.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    value={folderIdInput}
                    onChange={e => setFolderIdInput(e.target.value)}
                    placeholder="Dán Link hoặc Folder ID vào đây..."
                    style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                  <button 
                    onClick={handleSaveConfig}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <Save size={16} /> Lưu lại
                  </button>
                  {driveConfig && (
                    <button 
                      onClick={() => setShowConfig(false)}
                      style={{ padding: '0 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            ) : driveConfig?.url ? (
              <div style={{ height: '600px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <iframe 
                  src={`https://drive.google.com/embeddedfolderview?id=${driveConfig.url}#grid`} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={`Google Drive - ${selectedDept}`}
                ></iframe>
              </div>
            ) : (
              <div style={{ padding: '50px', textAlign: 'center' }}>
                <FolderOpen size={48} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ color: '#475569', margin: '0 0 5px 0' }}>Thư mục chưa được cấu hình</h3>
                <p style={{ color: '#94a3b8', margin: 0 }}>Vui lòng đợi Tổ trưởng chuyên môn hoặc Admin cài đặt liên kết Google Drive.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: SUBMIT DOSSIER */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', background: '#2563eb', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Nộp Hồ Sơ / Kế Hoạch Bài Dạy</h3>
              <button onClick={() => setShowSubmitModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitDossier} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Loại Hồ Sơ (*):</label>
                <select 
                  value={submitForm.category_id}
                  onChange={e => setSubmitForm({ ...submitForm, category_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Tuần nộp (*):</label>
                  <select 
                    value={submitForm.week_number}
                    onChange={e => setSubmitForm({ ...submitForm, week_number: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>Tuần {w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Học kỳ:</label>
                  <select 
                    value={submitForm.term}
                    onChange={e => setSubmitForm({ ...submitForm, term: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="HK1">Học kỳ 1</option>
                    <option value="HK2">Học kỳ 2</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Tên Bài Dạy / Tiêu Đề Hồ Sơ (*):</label>
                <input 
                  type="text"
                  value={submitForm.title}
                  onChange={e => setSubmitForm({ ...submitForm, title: e.target.value })}
                  placeholder="Ví dụ: Giáo án Tuần 5 - Bài 3: Cấp số cộng (Lớp 11A1)"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Upload File (PDF/Docx):</label>
                <FileUpload 
                  onUploadComplete={(url) => setSubmitForm({ ...submitForm, file_url: url })}
                />
                {submitForm.file_url && <div style={{ color: '#059669', fontSize: '13px', marginTop: '4px' }}>✓ Đã tải lên file thành công!</div>}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>HOẶC Dán Link Google Drive / Docs:</label>
                <input 
                  type="text"
                  value={submitForm.drive_url}
                  onChange={e => setSubmitForm({ ...submitForm, drive_url: e.target.value })}
                  placeholder="https://docs.google.com/document/d/..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {submitting ? 'Đang gửi...' : 'Nộp Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TTCM REVIEW MODAL */}
      {showReviewModal && selectedDossier && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Đánh Giá & Phê Duyệt Hồ Sơ (TTCM)</h3>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{selectedDossier.title}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Giáo viên: <b>{selectedDossier.teacher_name}</b> ({selectedDossier.department_name}) • Tuần {selectedDossier.week_number}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Tệp Hồ sơ:</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {selectedDossier.file_url && (
                    <a href={selectedDossier.file_url} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
                      📄 Mở File PDF/Doc
                    </a>
                  )}
                  {selectedDossier.drive_url && (
                    <a href={selectedDossier.drive_url} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: '#ecfdf5', color: '#059669', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
                      🌐 Xem Google Drive
                    </a>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Lời Nhận Xét / Góp Ý Của Tổ Trưởng:</label>
                <textarea 
                  rows={4}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Nhập lời nhận xét về cấu trúc giáo án, phương pháp giảng dạy..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleReviewDossier('rejected')}
                  style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <XCircle size={16} /> Yêu Cầu Sửa Lại
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleReviewDossier('approved')}
                  style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} /> Đồng Ý Phê Duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BGH INSPECTION MODAL */}
      {showInspectModal && selectedDossier && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '650px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', background: '#d97706', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} /> Thanh Tra & Đánh Giá Của Lãnh Đạo (BGH)
              </h3>
              <button onClick={() => setShowInspectModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', color: '#d48806' }}>{selectedDossier.title}</div>
                <div style={{ fontSize: '13px', color: '#8c6800' }}>Giáo viên: {selectedDossier.teacher_name} ({selectedDossier.department_name})</div>
              </div>

              {/* Add New Inspection Form */}
              <form onSubmit={handleAddInspection} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>Ghi nhận kết quả thanh tra:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>Mức xếp loại:</label>
                    <select
                      value={inspectionData.rating_score}
                      onChange={e => setInspectionData({ ...inspectionData, rating_score: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="Tốt">Tốt ⭐⭐⭐</option>
                      <option value="Đạt">Đạt ⭐⭐</option>
                      <option value="Cần bổ sung">Cần bổ sung ⚠️</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>Ý kiến nhận xét:</label>
                    <input
                      type="text"
                      value={inspectionData.comments}
                      onChange={e => setInspectionData({ ...inspectionData, comments: e.target.value })}
                      placeholder="Nhập nội dung chỉ đạo / nhận xét của BGH..."
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Lưu Kết Quả Thanh Tra
                  </button>
                </div>
              </form>

              {/* Inspection History */}
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} /> Lịch sử thanh tra & chỉ đạo:
              </h4>
              {inspectionsList.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Chưa có lượt thanh tra nào.</div>
              ) : (
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {inspectionsList.map(insp => (
                    <div key={insp.id} style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', marginBottom: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span style={{ color: '#0f172a' }}>{insp.inspector_name} ({insp.inspector_role})</span>
                        <span style={{ color: '#d97706' }}>{insp.rating_score}</span>
                      </div>
                      <div style={{ color: '#475569', marginTop: '4px' }}>{insp.comments}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isTeacherPortal) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {content}
      </div>
    );
  }

  return (
    <Layout>
      {content}
    </Layout>
  );
}
