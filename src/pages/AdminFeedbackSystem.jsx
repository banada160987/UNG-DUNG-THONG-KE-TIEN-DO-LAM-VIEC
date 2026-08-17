import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Trash2, Search, Filter, RefreshCw, PlusCircle, CheckCircle2, Clock, Building2, Layers, ToggleLeft, ToggleRight, X } from 'lucide-react';

const DEFAULT_ORGANIZATIONS = [
  'BCH Đảng ủy trường THPT Cao Bá Quát',
  'Ban Thường vụ Đoàn trường THPT Cao Bá Quát',
  'Tổ Ngữ văn',
  'Tổ Toán',
  'Tổ Tin học',
  'Tổ Vật lí',
  'Tổ Hóa học',
  'Tổ Sinh học',
  'Tổ Sử - Địa - GDKTPL',
  'Tổ Ngoại ngữ',
  'Tổ GDTC - QPAN',
  'Tổ Văn phòng'
];

const SEED_TOPIC = {
  id: 'default-topic-1',
  title: 'Dự thảo Đề án Thành lập Quỹ Học bổng "Chắp cánh ước mơ tuổi học trò" Trường THPT Cao Bá Quát',
  dispatch_number: 'Công văn số 409/SGDĐT-VP & Kế hoạch 53/KH-TrTHPTCBQ',
  description: 'Căn cứ Công văn 409/SGDĐT-VP ngày 11/02/2026 của Sở GD&ĐT và Kế hoạch 53/KH-TrTHPTCBQ ngày 12/3/2026. Đề nghị BCH Đảng ủy, BTV Đoàn trường, các Tổ chuyên môn & Tổ Văn phòng gửi góp ý về dự thảo Đề án Quỹ học bổng.',
  deadline: '2026-08-19T23:59:59+07:00',
  contact_info: 'Đồng chí Nghiêm Xuân Bảo – Nhân viên Tổ Văn phòng',
  is_active: true
};

export default function AdminFeedbackSystem() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDispatchNo, setNewDispatchNo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-08-19T23:59');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [newAttachedDocUrl, setNewAttachedDocUrl] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_feedback_topics')
        .select('*')
        .order('created_at', { ascending: false });

      let activeTopics = data || [];
      if (error || activeTopics.length === 0) {
        console.warn("Fallback LocalStorage cho Admin Chủ đề");
        const localTopics = JSON.parse(localStorage.getItem('cbq_local_feedback_topics') || '[]');
        if (localTopics.length === 0) {
          activeTopics = [SEED_TOPIC];
          localStorage.setItem('cbq_local_feedback_topics', JSON.stringify([SEED_TOPIC]));
        } else {
          activeTopics = localTopics;
        }
      }

      setTopics(activeTopics);
      if (activeTopics.length > 0) {
        const firstId = activeTopics[0].id;
        setSelectedTopicId(firstId);
        fetchResponses(firstId);
      }
    } catch (err) {
      console.warn("Lỗi tải chủ đề Admin:", err);
      setTopics([SEED_TOPIC]);
      setSelectedTopicId(SEED_TOPIC.id);
      fetchResponses(SEED_TOPIC.id);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (topicId) => {
    try {
      const { data, error } = await supabase
        .from('cbq_feedback_responses')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.warn("Fallback LocalStorage cho Admin Phản hồi:", err);
      const local = JSON.parse(localStorage.getItem(`cbq_local_feedback_res_${topicId}`) || '[]');
      setResponses(local);
    }
  };

  const handleTopicChange = (newId) => {
    setSelectedTopicId(newId);
    fetchResponses(newId);
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDeadline) {
      alert("Vui lòng điền tên công việc, trích yếu và hạn chót!");
      return;
    }

    const createdTopic = {
      id: 'topic-' + Date.now(),
      title: newTitle.trim(),
      dispatch_number: newDispatchNo.trim() || '',
      description: newDescription.trim(),
      deadline: new Date(newDeadline).toISOString(),
      contact_info: newContactInfo.trim() || 'Văn phòng nhà trường',
      attached_doc_url: newAttachedDocUrl.trim() || '',
      is_active: true,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('cbq_feedback_topics')
        .insert([createdTopic])
        .select();

      if (error) {
        console.warn("Supabase insert topic fallback sang LocalStorage:", error);
        const local = JSON.parse(localStorage.getItem('cbq_local_feedback_topics') || '[]');
        const updated = [createdTopic, ...local];
        localStorage.setItem('cbq_local_feedback_topics', JSON.stringify(updated));
        setTopics(updated);
      } else if (data) {
        setTopics(prev => [data[0], ...prev]);
      }

      alert("🎉 Cấu hình Công việc Lấy Ý kiến mới thành công!");
      setShowCreateModal(false);
      setSelectedTopicId(createdTopic.id);
      fetchResponses(createdTopic.id);

      // Reset form
      setNewTitle('');
      setNewDispatchNo('');
      setNewDescription('');
      setNewContactInfo('');
      setNewAttachedDocUrl('');

    } catch (err) {
      console.error("Lỗi tạo công việc:", err);
      alert("Không thể tạo công việc. Vui lòng thử lại!");
    }
  };

  const handleDeleteResponse = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ý kiến đóng góp này không?")) return;

    try {
      await supabase.from('cbq_feedback_responses').delete().eq('id', id);
      setResponses(prev => prev.filter(item => item.id !== id));

      const localKey = `cbq_local_feedback_res_${selectedTopicId}`;
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = local.filter(item => item.id !== id);
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));
    } catch (err) {
      console.error("Lỗi xóa ý kiến:", err);
      alert("Không thể xóa. Vui lòng thử lại!");
    }
  };

  const exportCSV = () => {
    if (responses.length === 0) {
      alert("Không có dữ liệu đóng góp ý kiến để xuất file!");
      return;
    }

    const currentTopicObj = topics.find(t => t.id === selectedTopicId);
    let csvContent = "\uFEFFSTT,ĐƠN VỊ GÓP Ý,NGƯỜI ĐẠI DIỆN,SỐ ĐIỆN THOẠI,EMAIL,NỘI DUNG GÓP Ý CHI TIẾT,LINK TỆP ĐÍNH KÈM,NGÀY GỬI\n";
    
    filteredResponses.forEach((item, idx) => {
      const row = [
        idx + 1,
        `"${item.organization_unit || ''}"`,
        `"${item.representative_name || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.email || ''}"`,
        `"${(item.feedback_content || '').replace(/"/g, '""')}"`,
        `"${item.attached_file_url || ''}"`,
        `"${new Date(item.created_at).toLocaleDateString('vi-VN')}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BÁO_CÁO_TỔNG_HỢP_GÓP_Ý_${(currentTopicObj?.title || 'CÔNG_VIỆC').slice(0,30)}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentTopicObj = topics.find(t => t.id === selectedTopicId) || topics[0];
  const submittedOrgNames = responses.map(r => r.organization_unit);
  const submittedCount = DEFAULT_ORGANIZATIONS.filter(org => submittedOrgNames.some(name => name.includes(org))).length;

  const filteredResponses = responses.filter(item => {
    const matchSearch = (item.organization_unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.representative_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.feedback_content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1250px', margin: '0 auto' }}>
      
      {/* TITLE & MAIN TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={26} color="#166534" /> TỔNG HỢP & QUẢN LÝ GÓP Ý CÔNG VIỆC
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Hệ thống cấu hình các dự thảo/công việc và tổng hợp ý kiến từ BCH Đảng ủy, Đoàn trường & các Tổ chuyên môn
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '9px 16px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22,101,52,0.2)' }}
          >
            <PlusCircle size={16} /> ➕ Cấu Hình Công Việc Mới
          </button>

          <button
            onClick={() => fetchResponses(selectedTopicId)}
            style={{ padding: '9px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} /> Tải Lại
          </button>
          
          <button
            onClick={exportCSV}
            style={{ padding: '9px 16px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2,132,199,0.2)' }}
          >
            <Download size={16} /> Xuất File Tổng Hợp (Excel / CSV)
          </button>
        </div>
      </div>

      {/* CHỌN CÔNG VIỆC ĐỂ XEM BÁO CÁO */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1.5px solid #cbd5e1', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={16} color="#166534" /> CHỌN CÔNG VIỆC / ĐỀ ÁN CẦN TỔNG HỢP:
        </div>
        <select
          value={selectedTopicId}
          onChange={e => handleTopicChange(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #166534', fontSize: '14px', fontWeight: 'bold', color: '#14532d', background: '#f0fdf4' }}
        >
          {topics.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} {t.dispatch_number ? `(${t.dispatch_number})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* STATS CHECKLIST OF ORGANIZATIONS FOR SELECTED TASK */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', padding: '18px', marginBottom: '22px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="#166534" /> TIẾN ĐỘ THU NHẬP Ý KIẾN THEO TỔ/ĐƠN VỊ ({submittedCount} / {DEFAULT_ORGANIZATIONS.length} ĐÃ NỘP)
          </div>
          {currentTopicObj && (
            <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600' }}>
              Hạn chót: <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{new Date(currentTopicObj.deadline).toLocaleDateString('vi-VN')}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {DEFAULT_ORGANIZATIONS.map(org => {
            const hasSubmitted = submittedOrgNames.some(name => name.includes(org));
            return (
              <div key={org} style={{ background: hasSubmitted ? '#f0fdf4' : '#f8fafc', border: `1px solid ${hasSubmitted ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ fontWeight: 'bold', color: hasSubmitted ? '#166534' : '#64748b' }}>{org}</span>
                {hasSubmitted ? (
                  <span style={{ color: '#166534', fontWeight: 'bold', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Đã gửi
                  </span>
                ) : (
                  <span style={{ color: '#854d0e', fontWeight: '600', background: '#fef9c3', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Chưa gửi
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo Đơn vị, Người đại diện hoặc Nội dung góp ý..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
        </div>
      </div>

      {/* RESPONSES TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách góp ý...</div>
        ) : filteredResponses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có đơn vị nào gửi ý kiến góp ý cho công việc này.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#166534', color: '#ffffff' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '50px' }}>STT</th>
                  <th style={{ padding: '12px 10px' }}>ĐƠN VỊ GÓP Ý</th>
                  <th style={{ padding: '12px 10px' }}>NGƯỜI ĐẠI DIỆN / TỔ TRƯỞNG</th>
                  <th style={{ padding: '12px 10px' }}>SỐ ĐIỆN THOẠI</th>
                  <th style={{ padding: '12px 10px' }}>NỘI DUNG GÓP Ý CHI TIẾT</th>
                  <th style={{ padding: '12px 10px' }}>TỆP ĐÍNH KÈM</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#166534' }}>
                      {item.organization_unit}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1e293b' }}>{item.representative_name}</td>
                    <td style={{ padding: '12px 10px', color: '#0369a1', fontFamily: 'monospace' }}>{item.phone}</td>
                    <td style={{ padding: '12px 10px', color: '#334155', maxWidth: '380px' }}>
                      <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: '1.5' }}>
                        {item.feedback_content}
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {item.attached_file_url ? (
                        <a href={item.attached_file_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'underline' }}>
                          Xem File
                        </a>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteResponse(item.id)}
                        style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        title="Xóa ý kiến này"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CẤU HÌNH CÔNG VIỆC LẤY Ý KIẾN MỚI */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '25px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '18px' }}>
                <PlusCircle size={22} color="#166534" /> CẤU HÌNH CÔNG VIỆC / ĐỀ ÁN LẤY Ý KIẾN MỚI
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Tên Công Việc / Đề Án / Kế Hoạch *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Dự thảo Kế hoạch Tổ chức Lễ Kỷ niệm 30 năm thành lập trường"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Số Hiệu Văn Bản / Căn Cứ (Nếu có)</label>
                <input
                  type="text"
                  placeholder="VD: Công văn 123/SGDĐT-VP & Kế hoạch 53/KH-TrTHPTCBQ"
                  value={newDispatchNo}
                  onChange={e => setNewDispatchNo(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Trích Yếu Nội Dung & Hướng Dẫn Đóng Góp *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nêu rõ các căn cứ pháp lý, yêu cầu góp ý từ Đảng ủy, Đoàn trường và các Tổ chuyên môn..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Hạn Chót Nhận Góp Ý *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Cán Bộ Phụ Trách Tiếp Nhận *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Đ/c Nghiêm Xuân Bảo - Tổ Văn phòng"
                    value={newContactInfo}
                    onChange={e => setNewContactInfo(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Link Tệp Văn Bản / Dự Thảo Kèm Theo (Google Drive/Dropbox)</label>
                <input
                  type="url"
                  placeholder="VD: https://drive.google.com/file/d/..."
                  value={newAttachedDocUrl}
                  onChange={e => setNewAttachedDocUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '12px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                🚀 XÁC NHẬN TẠO CÔNG VIỆC MỚI
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
