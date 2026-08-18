import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminDocs() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', published_date: '', file_url: '' });

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    const { data } = await supabase.from('cbq_documents').select('*').order('published_date', { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
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

