import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Download, Bot } from 'lucide-react';
import { exportAiRulesToWordDecree30 } from '../utils/decree30AiRulesWord';

export default function AdminDocs() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', published_date: '', file_url: '' });
  const [aiRulesPublished, setAiRulesPublished] = useState(false);

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

  const handlePublishAiRules = async () => {
    if (window.confirm('Bạn có chắc chắn muốn BAN HÀNH CHÍNH THỨC Quyết định & Quy tắc sử dụng AI và cho phép hiển thị công khai tại trang /van-ban?')) {
      const docItem = {
        title: 'Quyết định số 158/QĐ-THPTCBQ: Ban hành Quy tắc sử dụng Trí tuệ Nhân tạo (AI) trong nhà trường năm học 2026 - 2027',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('cbq_documents').insert([formData]);
    if (!error) {
      setShowForm(false);
      setFormData({ title: '', published_date: '', file_url: '' });
      fetchDocs();
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
              <strong style={{ fontSize: '15.5px', color: '#0f172a' }}>Dự thảo: Quy tắc sử dụng Trí tuệ Nhân tạo (AI) trong nhà trường (Chuẩn NĐ 30)</strong>
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
                : 'Văn bản đang ở dạng DỰ THẢO. Chỉ hiển thị trong trang Admin để BGH xem trước, tải file Word và duyệt Ban hành khi sẵn sàng.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={() => exportAiRulesToWordDecree30()}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Danh sách Văn bản & Kế hoạch</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Plus size={20} /> Thêm Văn bản
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
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
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Lưu</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1.5rem' }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

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
                  <button onClick={() => handleDelete(d.id)} style={{color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer'}}>
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

