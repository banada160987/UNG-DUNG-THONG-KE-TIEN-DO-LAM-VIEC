import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Save, Eye, EyeOff, LayoutDashboard, FileText } from 'lucide-react';

const DEFAULT_HOME_CONFIG = {
  show_announcement: true,
  show_gallery_slider: true,
  show_contact: true,
  show_external_links: true,
  show_services: true,
  show_calendar_widget: true,
  show_rsvp_search: true,
  show_gold_board: true
};

export default function AdminPages() {
  const [activeTab, setActiveTab] = useState('home-config');
  const [content, setContent] = useState('');
  const [homeConfig, setHomeConfig] = useState(DEFAULT_HOME_CONFIG);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Fetch Giới thiệu
    const { data: aboutData } = await supabase.from('cbq_pages').select('*').eq('slug', 'gioi-thieu').single();
    if (aboutData) {
      setContent(aboutData.content);
    }
    
    // Fetch Home Config
    const { data: configData } = await supabase.from('cbq_pages').select('*').eq('slug', 'home-config').single();
    if (configData && configData.content) {
      try {
        const parsed = typeof configData.content === 'string' ? JSON.parse(configData.content) : configData.content;
        setHomeConfig({ ...DEFAULT_HOME_CONFIG, ...parsed });
      } catch (err) {
        console.warn('Lỗi parse home-config', err);
      }
    }
    
    setLoading(false);
  }

  const handleSaveAbout = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('cbq_pages')
      .upsert({ slug: 'gioi-thieu', title: 'Giới thiệu Nhà trường', content, updated_at: new Date() }, { onConflict: 'slug' });
      
    setSaving(false);
    if (!error) {
      alert("Đã lưu nội dung Giới thiệu thành công!");
    } else {
      alert("Lỗi khi lưu: " + error.message);
    }
  };
  
  const handleSaveHomeConfig = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('cbq_pages')
      .upsert({ 
        slug: 'home-config', 
        title: 'Cấu hình Trang chủ', 
        content: JSON.stringify(homeConfig), 
        updated_at: new Date() 
      }, { onConflict: 'slug' });
      
    setSaving(false);
    if (!error) {
      alert("Đã lưu Cấu hình Giao diện Trang chủ thành công!");
    } else {
      alert("Lỗi khi lưu: " + error.message);
    }
  };
  
  const toggleConfig = (key) => {
    setHomeConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ConfigToggle = ({ label, configKey, icon: Icon = null }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: homeConfig[configKey] ? '#f0fdf4' : '#f8fafc', border: `1px solid ${homeConfig[configKey] ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '10px', marginBottom: '10px', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {Icon && <Icon size={20} color={homeConfig[configKey] ? '#16a34a' : '#94a3b8'} />}
        <span style={{ fontWeight: 'bold', color: homeConfig[configKey] ? '#166534' : '#475569', fontSize: '15px' }}>{label}</span>
      </div>
      <button 
        onClick={() => toggleConfig(configKey)}
        style={{
          padding: '8px 16px', borderRadius: '8px', border: 'none',
          backgroundColor: homeConfig[configKey] ? '#22c55e' : '#cbd5e1',
          color: 'white', fontWeight: 'bold', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
          boxShadow: homeConfig[configKey] ? '0 4px 6px rgba(34,197,94,0.2)' : 'none'
        }}
      >
        {homeConfig[configKey] ? <><Eye size={16}/> Đang hiện</> : <><EyeOff size={16}/> Đang ẩn</>}
      </button>
    </div>
  );

  return (
    <Layout title="Quản lý Giao diện & Nội dung">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('home-config')} 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'home-config' ? '#be123c' : '#ffffff', color: activeTab === 'home-config' ? '#ffffff' : '#334155' }}
        >
          <LayoutDashboard size={18} /> Cấu hình Giao diện Trang chủ
        </button>
        <button 
          onClick={() => setActiveTab('about')} 
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'about' ? '#be123c' : '#ffffff', color: activeTab === 'about' ? '#ffffff' : '#334155' }}
        >
          <FileText size={18} /> Bài viết Giới thiệu
        </button>
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : (
        <>
          {activeTab === 'home-config' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>Cấu hình Hiển thị Khối Nội dung Trang chủ</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                    Tắt bớt các khối giao diện đã cũ (ví dụ: thiệp mời đại lễ) để giao diện thoáng hơn và tập trung vào các chức năng vận hành hiện tại.
                  </p>
                </div>
                <button 
                  onClick={handleSaveHomeConfig} 
                  disabled={saving}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#be123c' }}
                >
                  <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ color: '#be123c', borderBottom: '2px solid #fecdd3', paddingBottom: '8px', marginBottom: '15px' }}>📌 Cột Trái (Left Column)</h4>
                  <ConfigToggle label="Thông báo Đại Lễ (Banner xanh lá)" configKey="show_announcement" />
                  <ConfigToggle label="Slider Hình Ảnh Tiêu Biểu" configKey="show_gallery_slider" />
                  <ConfigToggle label="Thông tin Liên hệ (SĐT, Email)" configKey="show_contact" />
                  <ConfigToggle label="Danh sách Liên kết Website ngoài" configKey="show_external_links" />
                </div>
                <div>
                  <h4 style={{ color: '#1d4ed8', borderBottom: '2px solid #bfdbfe', paddingBottom: '8px', marginBottom: '15px' }}>📌 Cột Giữa (Center Column)</h4>
                  <ConfigToggle label="Danh mục Cổng Dịch Vụ Giáo Dục (Grid 6 nút)" configKey="show_services" />
                  <ConfigToggle label="Tiện ích Lịch Công Tác Tuần BGH" configKey="show_calendar_widget" />
                  <ConfigToggle label="Khối Tra cứu Thiệp mời & Lưu trữ 30 Năm" configKey="show_rsvp_search" />
                  <ConfigToggle label="Khối Bảng Vàng Thủ Khoa (Leaderboard)" configKey="show_gold_board" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>Nội dung bài viết Giới thiệu Nhà trường</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Nội dung này sẽ hiển thị trực tiếp ở mục "Giới thiệu" ngoài trang chủ. Hỗ trợ HTML.</p>
                </div>
                <button 
                  onClick={handleSaveAbout} 
                  disabled={saving}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#be123c' }}
                >
                  <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu Nội Dung'}
                </button>
              </div>
              
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: '100%', minHeight: '400px', padding: '15px',
                  borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '15px', lineHeight: '1.6', fontFamily: 'inherit'
                }}
              />
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

const styles = {
  tabBtn: { padding: '12px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
};
