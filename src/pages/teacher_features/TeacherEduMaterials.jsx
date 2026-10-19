import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Plus, Save, Trash2, Edit3, Lock, Unlock, 
  CreditCard, QrCode, CheckCircle2, AlertCircle, Users, ExternalLink, 
  Sparkles, FileText, Video, Layers, Search, RefreshCw, Send, Check, X
} from 'lucide-react';
import { 
  getAllEduMaterials, 
  createEduMaterial, 
  getClassesTaughtByTeacher,
  getAccessRequestsForTeacher,
  resolveAccessRequest,
  POPULAR_VIETNAMESE_BANKS
} from '../../services/eduMaterialService';

const HIGH_SCHOOL_SUBJECTS = [
  'Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lí', 'Hóa học', 'Sinh học',
  'Lịch sử', 'Địa lí', 'GDKT & PL', 'Tin học', 'Công nghệ', 'HĐ Trải nghiệm'
];

const ALL_CLASSES = [
  '10A01', '10A02', '10A03', '10A04', '10A05', '10A06', '10A07', '10A08', '10A09', '10A10', '10A11', '10A12',
  '11A01', '11A02', '11A03', '11A04', '11A05', '11A06', '11A07', '11A08', '11A09', '11A10', '11A11', '11A12',
  '12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10', '12A11', '12A12'
];

export default function TeacherEduMaterials() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'requests'

  const [materials, setMaterials] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Toán',
    grade: 'Khối 10',
    target_classes: [],
    material_type: 'document', // 'document' | 'video' | 'quiz' | 'package'
    content_url: '',
    file_size: '',
    description: '',
    is_free_for_target_classes: true,
    is_monetized: false,
    price: 20000,
    bankCode: 'ICB',
    accountNumber: '',
    accountName: ''
  });

  useEffect(() => {
    const teacherStr = localStorage.getItem('cbq_current_teacher');
    if (!teacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    const t = JSON.parse(teacherStr);
    setTeacher(t);

    // Tự động điền các lớp giáo viên dạy từ thời khóa biểu
    const autoClasses = getClassesTaughtByTeacher(t.full_name || t.username);
    setFormData(prev => ({
      ...prev,
      target_classes: autoClasses.length > 0 ? autoClasses : ['10A01'],
      accountName: (t.full_name || '').toUpperCase()
    }));

    loadData(t.full_name || t.username);
  }, [navigate]);

  const loadData = async (teacherName) => {
    setLoading(true);
    try {
      const allMats = await getAllEduMaterials();
      // Lọc tài liệu của giáo viên hiện tại
      const myMats = allMats.filter(m => 
        !m.teacher_name || 
        (teacherName && m.teacher_name.toLowerCase().includes(teacherName.toLowerCase())) ||
        (m.teacher_id && teacher?.id && m.teacher_id === teacher.id)
      );
      setMaterials(myMats.length > 0 ? myMats : allMats);

      const reqs = getAccessRequestsForTeacher(teacherName);
      setRequests(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClass = (cls) => {
    setFormData(prev => {
      const exists = prev.target_classes.includes(cls);
      if (exists) {
        return { ...prev, target_classes: prev.target_classes.filter(c => c !== cls) };
      } else {
        return { ...prev, target_classes: [...prev.target_classes, cls].sort() };
      }
    });
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content_url.trim()) {
      alert("Vui lòng nhập Tiêu đề và Liên kết nội dung (Google Drive hoặc YouTube)!");
      return;
    }

    try {
      const newMat = {
        teacher_id: teacher?.id || 'gv-cbq',
        teacher_name: teacher?.full_name || teacher?.username || 'Giáo viên THPT Cao Bá Quát',
        subject: formData.subject,
        grade: formData.grade,
        target_classes: formData.target_classes,
        title: formData.title.trim(),
        description: formData.description.trim(),
        material_type: formData.material_type,
        content_url: formData.content_url.trim(),
        file_size: formData.file_size || 'Tài liệu số',
        is_free_for_target_classes: true,
        is_monetized: formData.is_monetized,
        price: formData.is_monetized ? parseInt(formData.price, 10) || 0 : 0,
        bank_info: formData.is_monetized ? {
          bankCode: formData.bankCode,
          accountNumber: formData.accountNumber.trim(),
          accountName: formData.accountName.trim()
        } : null
      };

      await createEduMaterial(newMat);
      alert("🎉 Đã xuất bản học liệu số thành công!");
      setShowAddModal(false);
      loadData(teacher?.full_name || teacher?.username);
    } catch (err) {
      alert("Lỗi khi tạo học liệu: " + err.message);
    }
  };

  const handleResolveRequest = (requestId, approved) => {
    const success = resolveAccessRequest(requestId, approved, teacher?.full_name);
    if (success) {
      alert(approved ? "✓ Đã cấp quyền truy cập miễn phí cho học sinh!" : "Đã từ chối yêu cầu.");
      loadData(teacher?.full_name || teacher?.username);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#16a34a', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> Quay lại Cổng Giáo Viên
        </Link>

        {teacher && (
          <span style={{ fontSize: '13px', background: '#dcfce7', color: '#166534', padding: '5px 14px', borderRadius: '20px', fontWeight: 'bold' }}>
            👨‍🏫 {teacher.full_name} ({teacher.subject || 'Giáo viên bộ môn'})
          </span>
        )}
      </div>

      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)', borderRadius: '24px', padding: '32px 28px', color: 'white', marginBottom: '28px', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.3)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={14} color="#fde047" /> KÊNH HỌC LIỆU SỐ PHÂN QUYỀN & MỞ KHÓA VIETQR
        </div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen size={36} /> Quản Lý Bài Giảng & Học Liệu Chuyên Đề
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14.5px', maxWidth: '750px', lineHeight: 1.5 }}>
          Cung cấp tài liệu bổ trợ, video bài giảng phân quyền theo lớp giảng dạy. Hỗ trợ phê duyệt học sinh lớp ngoài xin học hoặc mở khóa trả phí trực tiếp qua mã VietQR.
        </p>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('materials')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13.5px',
              cursor: 'pointer',
              background: activeTab === 'materials' ? 'white' : 'transparent',
              color: activeTab === 'materials' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'materials' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            📚 Danh Sách Học Liệu ({materials.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13.5px',
              cursor: 'pointer',
              background: activeTab === 'requests' ? 'white' : 'transparent',
              color: activeTab === 'requests' ? '#16a34a' : '#64748b',
              boxShadow: activeTab === 'requests' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={14} /> Yêu Cầu Xin Quyền ({requests.filter(r => r.status === 'pending').length})
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Plus size={18} /> Xuất Bản Học Liệu Mới
        </button>
      </div>

      {/* TAB 1: MATERIALS LIST */}
      {activeTab === 'materials' && (
        <div>
          {loading ? (
            <p>Đang tải dữ liệu học liệu...</p>
          ) : materials.length === 0 ? (
            <div style={{ textAlign: 'center', background: 'white', padding: '50px 20px', borderRadius: '18px', border: '1px dashed #cbd5e1' }}>
              <BookOpen size={48} color="#94a3b8" style={{ marginBottom: '14px' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>Chưa có học liệu số nào</h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>Bấm nút "Xuất Bản Học Liệu Mới" để chia sẻ tài liệu đầu tiên cho các lớp của Thầy/Cô.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {materials.map(mat => (
                <div key={mat.id} style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Card Header */}
                  <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                        Môn {mat.subject} • {mat.grade}
                      </span>
                      {mat.is_monetized ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                          <QrCode size={13} /> VietQR: {(mat.price || 0).toLocaleString('vi-VN')} đ
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                          <CheckCircle2 size={13} /> Miễn phí
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16.5px', color: '#0f172a', lineHeight: 1.4, fontWeight: '800' }}>
                      {mat.title}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {mat.description && (
                        <p style={{ margin: '0 0 14px 0', color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                          {mat.description}
                        </p>
                      )}

                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9', fontSize: '12.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>
                          <strong>Lớp áp dụng:</strong>{' '}
                          {(mat.target_classes || []).map(c => (
                            <span key={c} style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', marginRight: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                        <div>
                          <strong>Định dạng:</strong> {mat.material_type === 'video' ? '📺 Video bài giảng' : '📄 Tệp tài liệu'} ({mat.file_size || 'Chuẩn'})
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <a
                        href={mat.content_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', background: '#eff6ff', color: '#0284c7', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} /> Mở Tệp / Video
                      </a>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACCESS REQUESTS */}
      {activeTab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: 0, color: '#334155' }}>Không có yêu cầu xin cấp quyền nào đang chờ</h4>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {requests.map(req => (
                <div key={req.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{req.student_name}</strong>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        Lớp {req.student_class}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        (Mã HS: {req.student_code})
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#1e3a8a', marginBottom: '6px' }}>
                      Xin học tài liệu: <strong>{req.material_title}</strong>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#475569', fontStyle: 'italic', borderLeft: '3px solid #0284c7' }}>
                      "{req.student_message}"
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleResolveRequest(req.id, true)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          <Check size={16} /> Phê Duyệt Cấp Quyền
                        </button>
                        <button
                          onClick={() => handleResolveRequest(req.id, false)}
                          style={{ padding: '8px 14px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Từ Chối
                        </button>
                      </>
                    ) : (
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', background: req.status === 'approved' ? '#dcfce7' : '#fee2e2', color: req.status === 'approved' ? '#166534' : '#991b1b' }}>
                        {req.status === 'approved' ? '✓ Đã Phê Duyệt' : '✗ Đã Từ Chối'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL XUẤT BẢN HỌC LIỆU MỚI */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                  Xuất Bản Học Liệu Số Mới
                </h2>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Cấu hình phân quyền lớp và thanh toán VietQR</span>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Tiêu Đề Học Liệu / Chuyên Đề (*)
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="VD: Tổng hợp đề thi HSG môn Toán 10 kèm lời giải chi tiết"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Môn học</label>
                  <select 
                    value={formData.subject}
                    onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    {HIGH_SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Khối</label>
                  <select 
                    value={formData.grade}
                    onChange={e => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Định dạng</label>
                  <select 
                    value={formData.material_type}
                    onChange={e => setFormData(prev => ({ ...prev, material_type: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    <option value="document">📄 Tệp PDF / Word</option>
                    <option value="video">📺 Video bài giảng</option>
                    <option value="package">📦 Bộ chuyên đề</option>
                  </select>
                </div>
              </div>

              {/* Lớp mục tiêu */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Lớp Được Học Miễn Phí (Học sinh lớp này tự động mở khóa)
                </label>
                <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px', background: '#f8fafc' }}>
                  {ALL_CLASSES.map(cls => {
                    const isChecked = formData.target_classes.includes(cls);
                    return (
                      <button
                        type="button"
                        key={cls}
                        onClick={() => handleToggleClass(cls)}
                        style={{
                          padding: '4px 6px',
                          border: isChecked ? '1px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: isChecked ? '#0284c7' : 'white',
                          color: isChecked ? 'white' : '#475569',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Liên Kết Nội Dung (Google Drive / YouTube Link) (*)
                </label>
                <input 
                  type="url" 
                  required
                  placeholder="https://drive.google.com/... hoặc https://youtube.com/..."
                  value={formData.content_url}
                  onChange={e => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Bật VietQR mở khóa lớp ngoài */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <QrCode size={16} /> Thu Phí Mở Khóa Cho Học Sinh Lớp Ngoài (Tùy chọn)
                    </strong>
                    <span style={{ fontSize: '12px', color: '#475569' }}>
                      Học sinh lớp ngoài có thể chuyển khoản trực tiếp vào tài khoản ngân hàng của Thầy/Cô.
                    </span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={formData.is_monetized}
                    onChange={e => setFormData(prev => ({ ...prev, is_monetized: e.target.checked }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                {formData.is_monetized && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '10px', borderTop: '1px dashed #bbf7d0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Ngân hàng thụ hưởng</label>
                      <select 
                        value={formData.bankCode}
                        onChange={e => setFormData(prev => ({ ...prev, bankCode: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        {POPULAR_VIETNAMESE_BANKS.map(b => <option key={b.code} value={b.code}>{b.shortName}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Số tài khoản ngân hàng</label>
                      <input 
                        type="text"
                        placeholder="Số tài khoản nhận tiền"
                        value={formData.accountNumber}
                        onChange={e => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Tên chủ tài khoản (In hoa)</label>
                      <input 
                        type="text"
                        placeholder="NGUYEN VAN A"
                        value={formData.accountName}
                        onChange={e => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Mức phí mở khóa (VNĐ)</label>
                      <input 
                        type="number"
                        step={5000}
                        min={0}
                        placeholder="20000"
                        value={formData.price}
                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Xác Nhận Xuất Bản
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
