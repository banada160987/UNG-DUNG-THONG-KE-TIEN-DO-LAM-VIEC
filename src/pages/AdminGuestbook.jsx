import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Trash2, Heart, Search } from 'lucide-react';

export default function AdminGuestbook() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cbq_guestbook')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lưu bút này không? Hành động này không thể hoàn tác.')) {
      return;
    }

    const { error } = await supabase.from('cbq_guestbook').delete().eq('id', id);
    if (!error) {
      alert('Đã xóa thành công!');
      fetchEntries();
    } else {
      alert('Lỗi khi xóa: ' + error.message);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.author_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Quản lý Sổ Lưu Bút">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{color: '#64748b', margin: 0}}>Quản lý danh sách các bài viết lưu bút, xóa các bài viết không phù hợp.</p>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc nội dung..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '250px' }}
          />
        </div>
      </div>

      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : filteredEntries.length === 0 ? (
          <p>Không có bài lưu bút nào phù hợp.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: '#475569' }}>Tác giả & Thời gian</th>
                  <th style={{ padding: '1rem', color: '#475569' }}>Nội dung</th>
                  <th style={{ padding: '1rem', color: '#475569', textAlign: 'center' }}>Tương tác</th>
                  <th style={{ padding: '1rem', color: '#475569', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', verticalAlign: 'top', width: '200px' }}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>{entry.author_name}</strong>
                      <span style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                        {entry.author_category}
                      </span>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                        {new Date(entry.created_at).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-line' }}>{entry.content}</p>
                      {entry.image_url && (
                        <a href={entry.image_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '13px', textDecoration: 'underline' }}>
                          [Xem ảnh đính kèm]
                        </a>
                      )}
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top', textAlign: 'center', width: '100px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#ef4444' }}>
                        <Heart size={16} fill="#ef4444" />
                        <strong>{entry.likes_count}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top', textAlign: 'right', width: '100px' }}>
                      <button 
                        onClick={() => handleDelete(entry.id)}
                        style={{ padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
