import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: '', url: '', order_index: 0, is_active: true });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const { data } = await supabase.from('cbq_external_links').select('*').order('order_index', { ascending: true });
    if (data) setLinks(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.id) {
      // Update
      const { id, ...updateData } = formData;
      const { error } = await supabase.from('cbq_external_links').update(updateData).eq('id', id);
      if (!error) {
        setShowForm(false);
        resetForm();
        fetchLinks();
      } else {
          alert('Có lỗi xảy ra!');
      }
    } else {
      // Insert
      const { id, ...insertData } = formData;
      const { error } = await supabase.from('cbq_external_links').insert([insertData]);
      if (!error) {
        setShowForm(false);
        resetForm();
        fetchLinks();
      } else {
          alert('Có lỗi xảy ra!');
      }
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Xóa liên kết này?')) {
      await supabase.from('cbq_external_links').delete().eq('id', id);
      fetchLinks();
    }
  };

  const toggleActive = async (link) => {
    await supabase.from('cbq_external_links').update({ is_active: !link.is_active }).eq('id', link.id);
    fetchLinks();
  };

  const handleEdit = (link) => {
    setFormData(link);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ id: null, title: '', url: '', order_index: 0, is_active: true });
  }

  return (
    <Layout title="Cấu hình Liên kết trang">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Plus size={20} /> Thêm Liên kết
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label>Tên liên kết (Tiêu đề)</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={styles.input} />
            </div>
            <div>
              <label>Đường dẫn (URL)</label>
              <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required style={styles.input} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Vị trí sắp xếp (số nhỏ xếp trước)</label>
                <input type="number" value={formData.order_index} onChange={e => setFormData({...formData, order_index: Number(e.target.value)})} style={styles.input} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1.5rem' }}>
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} id="isActive" />
                <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Hiển thị liên kết này</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Lưu</button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: '0.5rem 1.5rem', background: '#e2e8f0', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white', overflowX: 'auto' }}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>
              <th style={{padding: '12px'}}>STT</th>
              <th style={{padding: '12px'}}>Tên Liên kết</th>
              <th style={{padding: '12px'}}>URL</th>
              <th style={{padding: '12px'}}>Hiển thị</th>
              <th style={{padding: '12px'}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center'}}>Đang tải...</td></tr> : 
              links.map(link => (
              <tr key={link.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                <td style={{padding: '12px'}}>{link.order_index}</td>
                <td style={{padding: '12px', fontWeight: 'bold'}}>{link.title}</td>
                <td style={{padding: '12px'}}><a href={link.url} target="_blank" rel="noreferrer" style={{color: '#0284c7'}}>{link.url.length > 30 ? link.url.substring(0,30)+'...' : link.url}</a></td>
                <td style={{padding: '12px'}}>
                  <button onClick={() => toggleActive(link)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: link.is_active ? '#10b981' : '#94a3b8' }}>
                    {link.is_active ? <Check size={20} /> : <X size={20} />}
                  </button>
                </td>
                <td style={{padding: '12px', display: 'flex', gap: '0.5rem'}}>
                  <button onClick={() => handleEdit(link)} style={{color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer'}} title="Sửa"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(link.id)} style={{color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer'}} title="Xóa"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {!loading && links.length === 0 && <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center', color: '#64748b'}}>Chưa có liên kết nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

const styles = {
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    marginTop: '0.25rem',
    fontFamily: 'inherit'
  }
};
