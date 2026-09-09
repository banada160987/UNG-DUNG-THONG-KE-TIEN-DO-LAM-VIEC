import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase, supabase2Admin, supabase2, DualSupabaseService } from '../lib/supabase';
const adminClient = supabase2Admin || supabase2;
import { Plus, Save, Trash2, Edit3, Settings, Users, FileText, CheckCircle2, ListFilter, Download, Server } from 'lucide-react';
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
  
  // Form Builder states
  const [formSchema, setFormSchema] = useState([]);
  /* Schema item: { id: string, type: 'text'|'select'|'radio'|'checkbox', label: string, required: boolean, options: string[] } */

  // Results states
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

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
                      <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} style={styles.input} placeholder="Nhập mô tả chi tiết, hướng dẫn học sinh..." />
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
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontWeight: 'bold', color: '#334155' }}>Chọn đợt đăng ký:</label>
                  <select 
                    value={selectedCampaignId} 
                    onChange={e => setSelectedCampaignId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '250px' }}
                  >
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <button onClick={exportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}>
                  <Download size={16} /> Xuất file Excel
                </button>
              </div>

              {/* THỐNG KÊ NHANH */}
              {!loadingResults && results.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📊 Thống kê nhanh
                  </h4>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ background: '#fff', padding: '10px 15px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                      <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>TỔNG LƯỢT ĐĂNG KÝ</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#166534' }}>{results.length}</div>
                    </div>
                    
                    {/* Thống kê tự động theo các câu hỏi trắc nghiệm */}
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
                          <div key={field.id} style={{ background: '#fff', padding: '10px 15px', borderRadius: '6px', border: '1px solid #dcfce7', minWidth: '150px' }}>
                            <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold', marginBottom: '5px' }}>{field.label}</div>
                            {Object.entries(counts).map(([opt, count]) => (
                              <div key={opt} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', borderBottom: '1px dashed #e2e8f0', paddingBottom: '3px', marginBottom: '3px' }}>
                                <span>{opt}:</span>
                                <strong style={{ color: '#0f172a' }}>{count}</strong>
                              </div>
                            ))}
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              )}

              {loadingResults ? <p>Đang tải danh sách học sinh đăng ký...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                        <th style={{ padding: '10px' }}>Thời gian</th>
                        <th style={{ padding: '10px' }}>Mã HS</th>
                        <th style={{ padding: '10px' }}>Họ và Tên</th>
                        <th style={{ padding: '10px' }}>Lớp</th>
                        {/* Render dynamic columns based on campaign schema */}
                        {(campaigns.find(c => c.id === selectedCampaignId)?.form_schema || []).map(field => (
                          <th key={field.id} style={{ padding: '10px', color: '#0284c7' }}>{field.label}</th>
                        ))}
                        <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 ? (
                        <tr><td colSpan="10" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu đăng ký nào</td></tr>
                      ) : results.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', color: '#64748b' }}>{new Date(r.created_at).toLocaleString('vi-VN')}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{r.student_code}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{r.student_name}</td>
                          <td style={{ padding: '10px', color: '#be123c', fontWeight: 'bold' }}>{r.student_class}</td>
                          
                          {(campaigns.find(c => c.id === selectedCampaignId)?.form_schema || []).map(field => {
                            const ans = r.responses[field.id];
                            let displayAns = ans;
                            if (Array.isArray(ans)) displayAns = ans.join(', ');
                            return <td key={field.id} style={{ padding: '10px' }}>{displayAns || '-'}</td>;
                          })}
                          <td style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
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
              )}
            </div>
          )}
        </>
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
                      />
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
