import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';

export default function AdminPages() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    setLoading(true);
    const { data } = await supabase.from('cbq_pages').select('*').eq('slug', 'gioi-thieu').single();
    if (data) {
      setContent(data.content);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('cbq_pages')
      .update({ content, updated_at: new Date() })
      .eq('slug', 'gioi-thieu');
      
    setSaving(false);
    if (!error) {
      alert("Đã lưu thành công!");
    } else {
      alert("Lỗi khi lưu: " + error.message);
    }
  };

  return (
    <Layout title="Quản lý trang Giới thiệu">
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <h3 style={{marginTop: 0}}>Nội dung bài viết giới thiệu</h3>
        <p style={{color: '#64748b', fontSize: '14px', marginBottom: '1rem'}}>Nội dung này sẽ hiển thị trực tiếp ở mục "Giới thiệu" ngoài trang chủ. Hỗ trợ nhập văn bản bình thường hoặc HTML.</p>
        
        {loading ? <p>Đang tải...</p> : (
          <div>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%', minHeight: '300px', padding: '15px',
                borderRadius: '8px', border: '1px solid #cbd5e1',
                fontSize: '15px', lineHeight: '1.6', fontFamily: 'inherit'
              }}
            />
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu nội dung'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
