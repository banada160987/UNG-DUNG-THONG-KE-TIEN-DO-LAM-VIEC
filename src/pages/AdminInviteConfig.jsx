import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function AdminInviteConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    time: '08:00, Chủ nhật, 15/11/2026',
    location: 'Sân trường THPT Cao Bá Quát',
    event_name: 'Lễ Kỷ Niệm 30 Năm Thành Lập Trường',
    agenda: [
      '08:00 - 08:30: Đón tiếp đại biểu',
      '08:30 - 10:30: Lễ mít tinh kỷ niệm',
      '10:30 - 11:30: Giao lưu các thế hệ',
      '11:30: Tiệc thân mật'
    ]
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cbq_pages').select('*').eq('slug', 'invite-config').single();
    if (data && data.content) {
      try {
        const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        setConfig(parsed);
      } catch (e) {
        console.error("Error parsing config", e);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('cbq_pages')
      .upsert({ slug: 'invite-config', title: 'Cấu hình Thiệp Mời Điện Tử', content: JSON.stringify(config), updated_at: new Date() }, { onConflict: 'slug' });
      
    setSaving(false);
    if (!error) {
      alert("Đã lưu cấu hình thiệp thành công!");
    } else {
      alert("Lỗi khi lưu: " + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleAgendaChange = (index, value) => {
    const newAgenda = [...config.agenda];
    newAgenda[index] = value;
    setConfig(prev => ({ ...prev, agenda: newAgenda }));
  };

  const addAgendaItem = () => {
    setConfig(prev => ({ ...prev, agenda: [...prev.agenda, ''] }));
  };

  const removeAgendaItem = (index) => {
    const newAgenda = [...config.agenda];
    newAgenda.splice(index, 1);
    setConfig(prev => ({ ...prev, agenda: newAgenda }));
  };

  return (
    <Layout title="Cấu hình Thiệp Mời">
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <h3 style={{marginTop: 0}}>Tuỳ chỉnh nội dung Thiệp Mời Điện Tử</h3>
        <p style={{color: '#64748b', fontSize: '14px', marginBottom: '2rem'}}>Các thông tin dưới đây sẽ hiển thị trực tiếp trên Thiệp mời điện tử của đại biểu ở trang chủ.</p>
        
        {loading ? <p>Đang tải cấu hình...</p> : (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={styles.label}>Tên Sự Kiện</label>
                <input type="text" name="event_name" value={config.event_name} onChange={handleChange} style={styles.input} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={styles.label}>Thời gian (Ngày, giờ)</label>
                  <input type="text" name="time" value={config.time} onChange={handleChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Địa điểm</label>
                  <input type="text" name="location" value={config.location} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div>
                <label style={styles.label}>Chương trình dự kiến (Agenda)</label>
                {config.agenda.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      value={item} 
                      onChange={(e) => handleAgendaChange(index, e.target.value)} 
                      style={styles.input} 
                      placeholder="VD: 08:00 - 08:30: Đón tiếp đại biểu"
                    />
                    <button onClick={() => removeAgendaItem(index)} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button onClick={addAgendaItem} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#f1f5f9', color: '#334155', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', marginTop: '5px' }}>
                  <Plus size={16} /> Thêm mục
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid #cbd5e1',
    fontSize: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#334155'
  }
};
