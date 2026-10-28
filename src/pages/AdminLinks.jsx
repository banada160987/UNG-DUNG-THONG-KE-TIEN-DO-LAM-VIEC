import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Plus, Trash2, Edit2, Check, X, ExternalLink, Link2, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({ id: null, title: '', url: '', order_index: 0, is_active: true });

  const getDb = () => supabaseAdmin || supabase;

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data, error } = await getDb()
        .from('cbq_external_links')
        .select('*')
        .order('order_index', { ascending: true });
        
      if (error) {
        console.warn('Lỗi khi nạp dữ liệu liên kết:', error);
        setErrorMessage(error.message || 'Không thể tải danh sách liên kết từ máy chủ.');
        setLinks([]);
      } else if (Array.isArray(data)) {
        setLinks(data.filter(Boolean));
      } else {
        setLinks([]);
      }
    } catch (err) {
      console.error('Lỗi ngoại lệ nạp liên kết:', err);
      setErrorMessage(err.message || 'Lỗi không xác định khi tải dữ liệu.');
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Vui lòng nhập tên/tiêu đề liên kết!');
      return;
    }
    if (!formData.url?.trim()) {
      alert('Vui lòng nhập đường dẫn URL!');
      return;
    }

    setSaving(true);
    // Payload CHỈ gửi các cột thực tế có trong DB: title, url, order_index, is_active
    // Tuyệt đối không gửi cột 'type' vì schema database không có cột này
    const payload = {
      title: formData.title.trim(),
      url: formData.url.trim(),
      order_index: Number(formData.order_index) || 0,
      is_active: formData.is_active !== false
    };

    try {
      const db = getDb();
      if (formData.id) {
        // Cập nhật
        const { error } = await db.from('cbq_external_links').update(payload).eq('id', formData.id);
        if (error) throw error;
        alert('Cập nhật liên kết thành công!');
      } else {
        // Thêm mới
        const { error } = await db.from('cbq_external_links').insert([payload]);
        if (error) throw error;
        alert('Thêm liên kết mới thành công!');
      }
      setShowForm(false);
      resetForm();
      await fetchLinks();
    } catch (err) {
      console.error('Lỗi khi lưu liên kết:', err);
      alert('Có lỗi xảy ra: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa liên kết này?')) {
      try {
        const { error } = await getDb().from('cbq_external_links').delete().eq('id', id);
        if (error) throw error;
        await fetchLinks();
      } catch (err) {
        alert('Lỗi khi xóa: ' + (err.message || 'Không thể xóa'));
      }
    }
  };

  const toggleActive = async (link) => {
    if (!link?.id) return;
    try {
      const { error } = await getDb()
        .from('cbq_external_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id);
      if (error) throw error;
      await fetchLinks();
    } catch (err) {
      alert('Lỗi đổi trạng thái: ' + (err.message || 'Không thể đổi'));
    }
  };

  const handleEdit = (link) => {
    if (!link) return;
    setFormData({
      id: link.id || null,
      title: link.title || '',
      url: link.url || '',
      order_index: Number(link.order_index) || 0,
      is_active: link.is_active !== false
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ id: null, title: '', url: '', order_index: 0, is_active: true });
  };

  return (
    <Layout title="Cấu hình Liên kết trang">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>
            🔗 Quản Lý Danh Sách Liên Kết Ngoài & Cổng Thông Tin
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Các liên kết được kích hoạt sẽ tự động xuất hiện tại Menu Cổng Thông Tin và Chân trang Toàn Trường.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button"
            onClick={fetchLinks}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.65rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            <RefreshCw size={15} /> Làm mới
          </button>
          <button 
            type="button"
            onClick={() => { resetForm(); setShowForm(!showForm); }} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
          >
            <Plus size={18} /> {showForm ? 'Đóng Biểu Mẫu' : 'Thêm Liên Kết'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {showForm && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>
            {formData.id ? '✏️ Cập Nhật Liên Kết' : '➕ Thêm Liên Kết Mới'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Tên liên kết (Tiêu đề hiển thị) *</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="VD: Quỹ &quot;Chắp cánh ước mơ&quot; THPT CBQ"
                required 
                style={styles.input} 
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Đường dẫn (URL đầy đủ) *</label>
              <input 
                type="url" 
                value={formData.url} 
                onChange={e => setFormData({...formData, url: e.target.value})} 
                placeholder="https://..."
                required 
                style={styles.input} 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Vị trí sắp xếp (số nhỏ xếp trước)</label>
                <input 
                  type="number" 
                  value={formData.order_index} 
                  onChange={e => setFormData({...formData, order_index: Number(e.target.value) || 0})} 
                  style={styles.input} 
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1.75rem' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                  id="isActive" 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  Hiển thị liên kết này công khai
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                disabled={saving}
                style={{ padding: '0.6rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                {saving ? 'Đang lưu...' : (formData.id ? 'Cập Nhật' : 'Lưu Liên Kết')}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); resetForm(); }} 
                style={{ padding: '0.6rem 1.5rem', background: '#e2e8f0', color: '#475569', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass" style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f8fafc', color: '#475569' }}>
              <th style={{ padding: '12px 14px', width: '60px' }}>STT</th>
              <th style={{ padding: '12px 14px' }}>Tên Liên Kết</th>
              <th style={{ padding: '12px 14px' }}>Địa Chỉ URL</th>
              <th style={{ padding: '12px 14px', width: '110px', textAlign: 'center' }}>Hiển Thị</th>
              <th style={{ padding: '12px 14px', width: '120px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  Đang tải danh sách liên kết...
                </td>
              </tr>
            ) : links.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                  Chưa có liên kết nào được cấu hình trong hệ thống.
                </td>
              </tr>
            ) : (
              links.map((link, idx) => {
                const urlStr = String(link?.url || '');
                const titleStr = String(link?.title || 'Chưa đặt tên');
                return (
                  <tr key={link?.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#64748b' }}>
                      {Number(link?.order_index) || idx + 1}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Link2 size={15} style={{ color: '#0284c7', flexShrink: 0 }} />
                        <span>{titleStr}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {urlStr ? (
                        <a 
                          href={urlStr} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>{urlStr.length > 40 ? urlStr.substring(0, 40) + '...' : urlStr}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button 
                        type="button"
                        onClick={() => toggleActive(link)} 
                        title={link?.is_active ? 'Đang bật (Bấm để ẩn)' : 'Đang ẩn (Bấm để hiện)'}
                        style={{ 
                          background: link?.is_active ? '#dcfce7' : '#f1f5f9', 
                          border: `1px solid ${link?.is_active ? '#86efac' : '#cbd5e1'}`, 
                          cursor: 'pointer', 
                          color: link?.is_active ? '#15803d' : '#94a3b8',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11.5px',
                          fontWeight: 'bold'
                        }}
                      >
                        {link?.is_active ? <Check size={14} /> : <X size={14} />}
                        <span>{link?.is_active ? 'Hiện' : 'Ẩn'}</span>
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button 
                          type="button"
                          onClick={() => handleEdit(link)} 
                          style={{ color: '#0284c7', background: '#e0f2fe', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }} 
                          title="Chỉnh sửa liên kết"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDelete(link?.id)} 
                          style={{ color: '#ef4444', background: '#fee2e2', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }} 
                          title="Xóa liên kết"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

const styles = {
  input: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    marginTop: '0.35rem',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  }
};
