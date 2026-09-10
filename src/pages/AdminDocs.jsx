import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Download, Bot, Edit3, Settings, Save, X } from 'lucide-react';
import { exportAiRulesToWordDecree30 } from '../utils/decree30AiRulesWord';

export default function AdminDocs() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', published_date: '', file_url: '' });
  const [aiRulesPublished, setAiRulesPublished] = useState(false);

  // Form chỉnh sửa thể thức & nội dung Dự thảo AI
  const [showAiEditModal, setShowAiEditModal] = useState(false);
  const [aiForm, setAiForm] = useState(() => {
    const saved = localStorage.getItem('cbq_ai_rules_custom_data');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return {
      departmentName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK',
      schoolName: 'TRƯỜNG THPT CAO BÁ QUÁT',
      docNumber: '158/QĐ-THPTCBQ',
      releaseDateStr: 'Tân An, ngày 10 tháng 09 năm 2026',
      signerTitle: 'HIỆU TRƯỜNG',
      signerName: 'Lê Thị Thảo',
      lessonsCount: '12',
      schoolYear: '2026 - 2027'
    };
  });

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    const { data } = await supabase.from('cbq_documents').select('*').order('published_date', { ascending: false });
    if (data) {
      setDocs(data);
      const hasAiDoc = data.some(d => d.file_url === 'ai_rules_decree30' || (d.title && d.title.includes('Trí tuệ Nhân tạo')));
      const localStatus = localStorage.getItem('cbq_ai_rules_status');
      if (hasAiDoc || localStatus === 'published') {
        setAiRulesPublished(true);
      } else {
        setAiRulesPublished(false);
      }
    }
    setLoading(false);
  };

  const handleExportAiWord = () => {
    exportAiRulesToWordDecree30(aiForm);
  };

  const handleSaveAiConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('cbq_ai_rules_custom_data', JSON.stringify(aiForm));
    setShowAiEditModal(false);
    alert('Đã lưu cấu hình và nội dung Dự thảo Quy tắc AI!');
  };

  const handlePublishAiRules = async () => {
    if (window.confirm('Bạn có chắc chắn muốn BAN HÀNH CHÍNH THỨC Quyết định & Quy tắc sử dụng AI và cho phép hiển thị công khai tại trang /van-ban?')) {
      const docItem = {
        title: `Quyết định số ${aiForm.docNumber}: Ban hành Quy tắc sử dụng Trí tuệ Nhân tạo (AI) trong nhà trường năm học ${aiForm.schoolYear}`,
        published_date: new Date().toISOString().split('T')[0],
        file_url: 'ai_rules_decree30'
      };
      await supabase.from('cbq_documents').insert([docItem]);
      localStorage.setItem('cbq_ai_rules_status', 'published');
      setAiRulesPublished(true);
      fetchDocs();
    }
  };

  const handleUnpublishAiRules = async () => {
    if (window.confirm('Bạn muốn chuyển văn bản này về dạng DỰ THẢO và ẨN KHỎI trang Văn bản công khai (/van-ban)?')) {
      await supabase.from('cbq_documents').delete().eq('file_url', 'ai_rules_decree30');
      localStorage.setItem('cbq_ai_rules_status', 'draft');
      setAiRulesPublished(false);
      fetchDocs();
    }
  };

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData({ title: '', published_date: '', file_url: '' });
    setShowForm(true);
  };

  const handleOpenEditForm = (doc) => {
    setEditingId(doc.id);
    setFormData({
      title: doc.title || '',
      published_date: doc.published_date || '',
      file_url: doc.file_url || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('cbq_documents').update(formData).eq('id', editingId);
      if (!error) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ title: '', published_date: '', file_url: '' });
        fetchDocs();
      }
    } else {
      const { error } = await supabase.from('cbq_documents').insert([formData]);
      if (!error) {
        setShowForm(false);
        setFormData({ title: '', published_date: '', file_url: '' });
        fetchDocs();
      }
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Xóa văn bản này?')) {
      await supabase.from('cbq_documents').delete().eq('id', id);
      fetchDocs();
    }
  };

  return (
    <Layout title="Văn bản & Kế hoạch">
      {/* BẢNG QUẢN LÝ DỰ THẢO / BAN HÀNH QUY TẮC AI */}
      <div style={{
        background: '#f8fafc',
        border: '1.5px solid #cbd5e1',
        borderRadius: '14px',
        padding: '18px 22px',
        marginBottom: '22px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <Bot size={22} color="#0284c7" />
              <strong style={{ fontSize: '15.5px', color: '#0f172a' }}>
                Quyết định số {aiForm.docNumber}: Quy tắc sử dụng AI ({aiForm.schoolName})
              </strong>
              <span style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: aiRulesPublished ? '#dcfce7' : '#fef3c7',
                color: aiRulesPublished ? '#15803d' : '#b45309',
                border: aiRulesPublished ? '1px solid #86efac' : '1px solid #fde68a'
              }}>
                {aiRulesPublished ? '🟢 ĐÃ BAN HÀNH (Công khai tại /van-ban)' : '🟡 DỰ THẢO (Chưa ban hành - Đang ẩn)'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              {aiRulesPublished 
                ? 'Văn bản đã được Admin duyệt Ban hành chính thức và đang hiển thị tại trang Văn bản công khai (/van-ban).'
                : 'Văn bản đang ở dạng DỰ THẢO. Bạn có thể bấm "Sửa Nội dung", chỉnh sửa các thông số, tải file Word kiểm tra và bấm "Chấp nhận Ban hành" khi sẵn sàng.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={() => setShowAiEditModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              <Settings size={16} /> ✏️ Sửa Nội dung & Thể thức
            </button>

            <button 
              onClick={handleExportAiWord}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)' }}
            >
              <Download size={16} /> 🤖 Tải Word (.doc NĐ 30)
            </button>

            {aiRulesPublished ? (
              <button 
                onClick={handleUnpublishAiRules}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                🔒 Chuyển về Dự thảo (Ẩn khỏi Public)
              </button>
            ) : (
              <button 
                onClick={handlePublishAiRules}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)' }}
              >
                📢 Chấp nhận Ban hành (Phổ biến Công khai)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CẤU HÌNH / CHỈNH SỬA CHI TIẾT NỘI DUNG DỰ THẢO AI */}
      {showAiEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <Settings size={20} /> Chỉnh sửa Thể thức & Nội dung Dự thảo Quy tắc AI
              </h3>
              <button onClick={() => setShowAiEditModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveAiConfig} style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Tên Cơ quan cấp trên</label>
                  <input type="text" value={aiForm.departmentName} onChange={e => setAiForm({...aiForm, departmentName: e.target.value})} required style={styles.input} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Tên Trường</label>
                  <input type="text" value={aiForm.schoolName} onChange={e => setAiForm({...aiForm, schoolName: e.target.value})} required style={styles.input} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Số hiệu Quyết định</label>
                  <input type="text" value={aiForm.docNumber} onChange={e => setAiForm({...aiForm, docNumber: e.target.value})} required style={styles.input} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Năm học áp dụng</label>
                  <input type="text" value={aiForm.schoolYear} onChange={e => setAiForm({...aiForm, schoolYear: e.target.value})} required style={styles.input} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Địa danh & Ngày ký ban hành</label>
                  <input type="text" value={aiForm.releaseDateStr} onChange={e => setAiForm({...aiForm, releaseDateStr: e.target.value})} required style={styles.input} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Số tiết AI cốt lõi tối thiểu/năm</label>
                  <input type="text" value={aiForm.lessonsCount} onChange={e => setAiForm({...aiForm, lessonsCount: e.target.value})} required style={styles.input} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Chức vụ Người ký</label>
                  <input type="text" value={aiForm.signerTitle} onChange={e => setAiForm({...aiForm, signerTitle: e.target.value})} required style={styles.input} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Họ và tên Người ký</label>
                  <input type="text" value={aiForm.signerName} onChange={e => setAiForm({...aiForm, signerName: e.target.value})} required style={styles.input} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button type="button" onClick={() => setShowAiEditModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#0284c7', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> Lưu Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIÊU ĐỀ & NÚT THÊM VĂN BẢN KHÁC */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Danh sách Văn bản & Kế hoạch Khác</h3>
        <button onClick={handleOpenCreateForm} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Plus size={20} /> Thêm Văn bản
        </button>
      </div>

      {/* FORM THÊM / SỬA VĂN BẢN THÔNG THƯỜNG */}
      {showForm && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>{editingId ? '✏️ Chỉnh sửa thông tin Văn bản' : '➕ Thêm Văn bản mới'}</h4>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label>Tên văn bản / Trích yếu</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={styles.input} />
            </div>
            <div>
              <label>Ngày ban hành</label>
              <input type="date" value={formData.published_date} onChange={e => setFormData({...formData, published_date: e.target.value})} required style={styles.input} />
            </div>
            <div>
              <label>Link tải File (Link Google Drive, PDF...)</label>
              <input type="text" value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})} style={styles.input} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                {editingId ? 'Lưu thay đổi' : 'Lưu mới'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ padding: '0.5rem 1.5rem' }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* BẢNG DANH SÁCH VĂN BẢN */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white', overflowX: 'auto' }}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>
              <th style={{padding: '12px'}}>Ngày ban hành</th>
              <th style={{padding: '12px'}}>Tên văn bản</th>
              <th style={{padding: '12px'}}>Link File</th>
              <th style={{padding: '12px'}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {docs.map(d => (
              <tr key={d.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                <td style={{padding: '12px'}}>{new Date(d.published_date).toLocaleDateString('vi-VN')}</td>
                <td style={{padding: '12px', fontWeight: '500'}}>{d.title}</td>
                <td style={{padding: '12px'}}>
                  {d.file_url ? <a href={d.file_url} target="_blank" rel="noreferrer" style={{color: '#3b82f6'}}>Xem file</a> : '-'}
                </td>
                <td style={{padding: '12px'}}>
                  <button onClick={() => handleOpenEditForm(d)} title="Sửa văn bản này" style={{color: '#0284c7', border: 'none', background: 'transparent', cursor: 'pointer', marginRight: '10px'}}>
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(d.id)} title="Xóa văn bản này" style={{color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer'}}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>Chưa có văn bản nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

const styles = {
  input: { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '5px' }
};


