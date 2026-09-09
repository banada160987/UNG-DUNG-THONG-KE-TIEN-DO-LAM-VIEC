import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase, supabase2Admin, supabase2, DualSupabaseService } from '../lib/supabase';
const adminClient = supabase2Admin || supabase2;
import { Plus, Save, Trash2, Edit3, Settings, Users, FileText, CheckCircle2, ListFilter, Download, Server, Printer, Filter, X, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  const [isActive, setIsActive] = useState(true);
  const [targetDb, setTargetDb] = useState('sb2'); // 'sb1' | 'sb2'

  // Results & Filtering & Sorting & Report States
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedOptionFilter, setSelectedOptionFilter] = useState('all');
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
      const campaign = campaigns.find(c => c.id === campaignId);
      const client = campaign?._source === 'sb1' ? supabase : adminClient;
      
      const { data, error } = await client
        .from('cbq_student_registrations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setResults(data);
      }
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
    setIsActive(cam.is_active);
    setFormSchema(cam.form_schema || []);
    setTargetDb(cam._source || 'sb2');
    setShowForm(true);
    setActiveTab('campaigns');
    window.scrollTo(0, 0);
  };

  const handleDelete = async (cam) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Đợt đăng ký này? Toàn bộ dữ liệu học sinh đăng ký trong đợt này cũng sẽ bị xóa vĩnh viễn!")) return;
    try {
      const client = cam._source === 'sb1' ? supabase : adminClient;
      const { error } = await client.from('cbq_registration_campaigns').delete().eq('id', cam.id);
      if (error) throw error;
      fetchCampaigns();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert("Vui lòng nhập tên đợt đăng ký");

    try {
      const payload = {
        title,
        description,
        target_grades: targetGrades.length > 0 ? targetGrades : null, // null means all
        is_active: isActive,
        form_schema: formSchema
      };

      if (editingId) {
        const client = targetDb === 'sb1' ? supabase : adminClient;
        const { error } = await client.from('cbq_registration_campaigns').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const client = targetDb === 'sb1' ? supabase : adminClient;
        const { error } = await client.from('cbq_registration_campaigns').insert([payload]);
        if (error) throw error;
      }

      alert("Lưu thành công!");
      setShowForm(false);
      setEditingId(null);
      fetchCampaigns();
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  const exportToExcel = () => {
    if (results.length === 0) return;
    
    const campaign = campaigns.find(c => c.id === selectedCampaignId);
    const schema = campaign?.form_schema || [];
    
    // Prepare Data
    const excelData = results.map(r => {
      const row = {
        'Thời gian': new Date(r.created_at).toLocaleString('vi-VN'),
        'Mã Học Sinh': r.student_code,
        'Họ và Tên': r.student_name,
        'Lớp': r.student_class
      };
      
      schema.forEach(field => {
        const ans = r.responses[field.id];
        let ansStr = '';
        if (Array.isArray(ans)) {
          ansStr = ans.join('; ');
        } else if (ans) {
          ansStr = String(ans);
        }
        row[field.label] = ansStr;
      });
      return row;
    });

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Auto size columns based on content
    const colWidths = Object.keys(excelData[0]).map(key => {
      const maxLen = Math.max(
        key.length,
        ...excelData.map(row => (row[key] ? row[key].toString().length : 0))
      );
      return { wch: maxLen + 2 };
    });
    worksheet['!cols'] = colWidths;

    // Create Workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh_sach");
    
    // Download
    XLSX.writeFile(workbook, `Danh_sach_dang_ky_${campaign?.title || 'x'}.xlsx`);
  };

  // 🟢 LỌC VÀ SẮP XẾP DANH SÁCH HỌC SINH ĐĂNG KÝ (DÙNG CHO BẢNG & BÁO CÁO)
  const filteredAndSortedResults = useMemo(() => {
    let list = [...results];
    
    // Lọc theo Lựa chọn / Câu lạc bộ
    if (selectedOptionFilter !== 'all') {
      list = list.filter(r => {
        const responses = r.responses || {};
        return Object.values(responses).some(val => {
          if (Array.isArray(val)) return val.includes(selectedOptionFilter);
          return String(val) === String(selectedOptionFilter);
        });
      });
    }

    // Sắp xếp
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
  }, [results, selectedOptionFilter, sortField, sortOrder]);

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

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_Nghi_dinh_30_${campaignTitle.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
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

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
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
                      <label style={styles.label}>Trạng thái</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginTop: '5px' }}>
                        <input 
                          type="checkbox" 
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#16a34a' : '#94a3b8' }}>
                          {isActive ? '🟢 Đang mở đăng ký' : '🔴 Đã đóng'}
                        </span>
                      </label>
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
                                <select value={field.type} onChange={(e) => handleUpdateField(field.id, 'type', e.target.value)} style={{ ...styles.input, padding: '6px', fontSize: '13px' }}>
                                  <option value="text">Văn bản ngắn (Text)</option>
                                  <option value="textarea">Văn bản dài (Textarea)</option>
                                  <option value="select">Hộp thoại chọn 1 (Dropdown)</option>
                                  <option value="radio">Trắc nghiệm chọn 1 (Radio)</option>
                                  <option value="checkbox">Trắc nghiệm chọn nhiều (Checkbox)</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Bắt buộc trả lời?</label>
                                <div style={{ marginTop: '5px' }}>
                                  <input type="checkbox" checked={field.required} onChange={(e) => handleUpdateField(field.id, 'required', e.target.checked)} />
                                </div>
                              </div>
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tiêu đề câu hỏi / Nội dung (*)</label>
                                <input type="text" value={field.label} onChange={(e) => handleUpdateField(field.id, 'label', e.target.value)} style={{ ...styles.input, padding: '6px', fontSize: '13px' }} placeholder="VD: Đăng ký size áo" required />
                              </div>
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
                <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                  📋 Danh sách các Đợt đăng ký ({campaigns.length})
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                        <th style={{ padding: '10px' }}>Tiêu đề</th>
                        <th style={{ padding: '10px' }}>Khối áp dụng</th>
                        <th style={{ padding: '10px' }}>Nơi lưu</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                        <th style={{ padding: '10px' }}>Số Form fields</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>Chưa có đợt đăng ký nào</td></tr>
                      ) : campaigns.map(cam => (
                        <tr key={cam.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{cam.title}</td>
                          <td style={{ padding: '10px', color: '#64748b' }}>
                            {!cam.target_grades || cam.target_grades.length === 0 ? 'Toàn trường' : cam.target_grades.join(', ')}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: cam._source === 'sb1' ? '#f1f5f9' : '#e0f2fe', color: cam._source === 'sb1' ? '#475569' : '#0369a1', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Server size={12} /> {cam._source === 'sb1' ? 'Server 1' : 'Server 2'}
                            </span>
                          </td>
                          <td style={{ padding: '10px' }}>
                            {cam.is_active ? <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🟢 Mở</span> : <span style={{ color: '#ef4444' }}>🔴 Đóng</span>}
                          </td>
                          <td style={{ padding: '10px' }}>{(cam.form_schema || []).length} câu</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button onClick={() => { setSelectedCampaignId(cam.id); setActiveTab('results'); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0284c7', cursor: 'pointer' }}>
                                Xem kết quả
                              </button>
                              <button onClick={() => handleEdit(cam)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                                <Edit3 size={14} /> Sửa
                              </button>
                                <button onClick={() => handleDelete(cam)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                                <Trash2 size={14} /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <label style={{ fontWeight: 'bold', color: '#334155' }}>Chọn đợt đăng ký:</label>
                  <select 
                    value={selectedCampaignId} 
                    onChange={e => {
                      setSelectedCampaignId(e.target.value);
                      setSelectedOptionFilter('all');
                    }}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '250px', fontWeight: 'bold', color: '#0f172a' }}
                  >
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>

                  {/* Sắp xếp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
                    <ArrowUpDown size={16} color="#64748b" />
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Xếp theo:</span>
                    <select 
                      value={sortField} 
                      onChange={e => setSortField(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="created_at">Thời gian nộp</option>
                      <option value="student_class">Lớp học</option>
                      <option value="student_name">Tên học sinh</option>
                      <option value="student_code">Mã học sinh</option>
                    </select>

                    <button 
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {sortOrder === 'asc' ? '⬆️ Tăng dần' : '⬇️ Giảm dần'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setShowReportModal(true)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(2,132,199,0.3)' }}
                  >
                    <Printer size={16} /> Xuất Báo Cáo (Nghị định 30)
                  </button>

                  <button 
                    onClick={exportToExcel} 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}
                  >
                    <Download size={16} /> Xuất Excel
                  </button>
                </div>
              </div>

              {/* THỐNG KÊ NHANH (CLICK-TO-FILTER THEO CÂU LẠC BỘ) */}
              {!loadingResults && results.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                      📊 Thống kê nhanh & Bộ lọc Câu lạc bộ (Bấm vào CLB để lọc danh sách)
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
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9 }}>TỔNG ĐĂNG KÝ</div>
                      <div style={{ fontSize: '24px', fontWeight: '900' }}>{results.length}</div>
                    </div>
                    
                    {/* Thống kê từng câu lạc bộ/lựa chọn */}
                    {(campaigns.find(c => c.id === selectedCampaignId)?.form_schema || [])
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
              )}

              {/* BẢNG DANH SÁCH HỌC SINH NỘP */}
              {loadingResults ? <p>Đang tải danh sách học sinh đăng ký...</p> : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13.5px', color: '#475569' }}>
                      Hiển thị <strong>{filteredAndSortedResults.length}</strong> / <strong>{results.length}</strong> học sinh 
                      {selectedOptionFilter !== 'all' && <span style={{ color: '#0284c7', fontWeight: 'bold' }}> (Đang lọc: {selectedOptionFilter})</span>}
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', background: '#f8fafc' }}>
                          <th style={{ padding: '10px 12px' }}>STT</th>
                          <th style={{ padding: '10px 12px' }}>Thời gian</th>
                          <th style={{ padding: '10px 12px' }}>Mã HS</th>
                          <th style={{ padding: '10px 12px' }}>Họ và Tên</th>
                          <th style={{ padding: '10px 12px' }}>Lớp</th>
                          {/* Render dynamic columns based on campaign schema */}
                          {(campaigns.find(c => c.id === selectedCampaignId)?.form_schema || []).map(field => (
                            <th key={field.id} style={{ padding: '10px 12px', color: '#0284c7' }}>{field.label}</th>
                          ))}
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedResults.length === 0 ? (
                          <tr><td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu phù hợp với bộ lọc</td></tr>
                        ) : filteredAndSortedResults.map((r, idx) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                            <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{new Date(r.created_at).toLocaleString('vi-VN')}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 'bold', fontFamily: 'monospace' }}>{r.student_code}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{r.student_name}</td>
                            <td style={{ padding: '10px 12px', color: '#be123c', fontWeight: 'bold' }}>{r.student_class}</td>
                            
                            {(campaigns.find(c => c.id === selectedCampaignId)?.form_schema || []).map(field => {
                              const ans = r.responses[field.id];
                              let displayAns = ans;
                              if (Array.isArray(ans)) displayAns = ans.join(', ');
                              return <td key={field.id} style={{ padding: '10px 12px', fontWeight: selectedOptionFilter && displayAns?.includes(selectedOptionFilter) ? 'bold' : 'normal', color: selectedOptionFilter && displayAns?.includes(selectedOptionFilter) ? '#166534' : 'inherit' }}>{displayAns || '-'}</td>;
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
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  tabBtn: { padding: '12px 20px', background: 'none', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};
