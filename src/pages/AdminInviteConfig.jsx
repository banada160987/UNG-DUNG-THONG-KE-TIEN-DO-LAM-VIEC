import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function AdminInviteConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [config, setConfig] = useState({
    school_name: 'TRƯỜNG THPT CAO BÁ QUÁT',
    logo_url: '/logo-30-nam.jpg',
    invite_title1: 'Trân trọng kính mời',
    invite_title2: 'ĐẠI BIỂU THAM DỰ',
    event_name_main: 'LỄ KỶ NIỆM',
    event_name_sub: '30 NĂM THÀNH LẬP\nTRƯỜNG THPT CAO BÁ QUÁT\n(1996 - 2026)',
    time: '07 giờ 30, ngày 03 tháng 9 năm 2026',
    location: 'Trường THPT Cao Bá Quát\nTDP 9, phường Tân An, tỉnh Đắk Lắk',
    footer_message: 'Sự hiện diện của Quý vị là niềm vinh dự,\ngóp phần làm nên thành công của buổi lễ.',
    sign_date: 'Tân An, ngày 10 tháng 8 năm 2026',
    sign_title: 'TM. BAN TỔ CHỨC\nHIỆU TRƯỞNG',
    sign_name: 'Lê Thị Thảo',
    program_title: 'CHƯƠNG TRÌNH LỄ KỶ NIỆM',
    agenda_headers: ['Thời gian', 'Nội dung chương trình'],
    agenda: [
      { time: '7h00 - 8h00', content: 'Ổn định tổ chức, đón tiếp đại biểu và cựu học sinh.' },
      { time: '8h00 - 8h30', content: 'Chương trình nghệ thuật chào mừng.' },
      { time: '8h30 - 10h30', content: '❖ Chào cờ, tuyên bố lý do, giới thiệu đại biểu\n❖ Diễn văn Kỷ niệm 30 năm thành lập trường\n❖ Phát biểu của lãnh đạo cấp trên\n❖ Tặng hoa tri ân cho cựu CBQL, GV, NV của nhà trường và nhà tài trợ\n❖ Ra mắt Quỹ học bổng: "Chắp cánh ước mơ tuổi học trò"\n❖ Khen thưởng\n❖ Bế mạc và chụp hình lưu niệm' },
      { time: '10h30', content: '❖ Tham quan phòng Truyền thống\n❖ Mời đại biểu và cựu học sinh tham dự liên hoan thân mật' }
    ],
    ending_message: 'Rất hân hạnh được đón tiếp!',
    bg_music: '/nhacnen.mp3',
    gallery_images: [
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&q=80",
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500&q=80",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&q=80",
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&q=80"
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
        
        // Migrate old legacy agenda (array of strings) to new format
        if (parsed.agenda && parsed.agenda.length > 0 && typeof parsed.agenda[0] === 'string') {
          parsed.agenda = parsed.agenda.map(item => {
            const parts = item.split(': ');
            if (parts.length > 1) {
              return { time: parts[0], content: parts.slice(1).join(': ') };
            }
            return { time: '', content: item };
          });
        }
        
        setConfig(prev => ({ ...prev, ...parsed }));
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

  const handleAgendaChange = (index, field, value) => {
    const newAgenda = [...config.agenda];
    newAgenda[index][field] = value;
    setConfig(prev => ({ ...prev, agenda: newAgenda }));
  };

  const addAgendaItem = () => {
    setConfig(prev => ({ ...prev, agenda: [...prev.agenda, { time: '', content: '' }] }));
  };

  const removeAgendaItem = (index) => {
    const newAgenda = [...config.agenda];
    newAgenda.splice(index, 1);
    setConfig(prev => ({ ...prev, agenda: newAgenda }));
  };

  const handleGalleryChange = (index, value) => {
    const newGallery = [...(config.gallery_images || [])];
    newGallery[index] = value;
    setConfig(prev => ({ ...prev, gallery_images: newGallery }));
  };

  const addGalleryImage = () => {
    setConfig(prev => ({ ...prev, gallery_images: [...(prev.gallery_images || []), ''] }));
  };

  const removeGalleryImage = (index) => {
    const newGallery = [...(config.gallery_images || [])];
    newGallery.splice(index, 1);
    setConfig(prev => ({ ...prev, gallery_images: newGallery }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, file);

    if (uploadError) {
      alert("Lỗi upload ảnh: Khả năng cao bạn chưa chạy mã SQL tạo kho lưu trữ. Chi tiết lỗi: " + uploadError.message);
      setUploadingImage(false);
      return;
    }

    const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
    if (data && data.publicUrl) {
      setConfig(prev => ({ 
        ...prev, 
        gallery_images: [...(prev.gallery_images || []), data.publicUrl] 
      }));
    }
    
    setUploadingImage(false);
    e.target.value = ''; // Reset input
  };

  return (
    <Layout title="Cấu hình Thiệp Mời">
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <h3 style={{marginTop: 0}}>Tuỳ chỉnh nội dung Thiệp Mời Điện Tử</h3>
        <p style={{color: '#64748b', fontSize: '14px', marginBottom: '2rem'}}>Các thông tin dưới đây sẽ hiển thị trực tiếp trên Thiệp mời điện tử của đại biểu ở trang chủ.</p>
        
        {loading ? <p>Đang tải cấu hình...</p> : (
          <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'grid', gap: '2rem', marginBottom: '2rem' }}>
              
              {/* PHẦN 1: THÔNG TIN TRANG TRÁI */}
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Mặt Trái - Thông Tin Sự Kiện</h4>
                <div style={styles.grid2}>
                  <div>
                    <label style={styles.label}>Tên cơ quan/trường</label>
                    <input type="text" name="school_name" value={config.school_name} onChange={handleChange} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Link Logo (tùy chọn)</label>
                    <input type="text" name="logo_url" value={config.logo_url || ''} onChange={handleChange} style={styles.input} placeholder="/logo-30-nam.jpg" />
                  </div>
                  <div>
                    <label style={styles.label}>Tiêu đề mời (VD: Trân trọng kính mời)</label>
                    <input type="text" name="invite_title1" value={config.invite_title1} onChange={handleChange} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Chức danh/Thành phần (VD: ĐẠI BIỂU THAM DỰ)</label>
                    <input type="text" name="invite_title2" value={config.invite_title2} onChange={handleChange} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Tên sự kiện chính (VD: LỄ KỶ NIỆM)</label>
                    <input type="text" name="event_name_main" value={config.event_name_main} onChange={handleChange} style={styles.input} />
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.label}>Tên sự kiện phụ / Chủ đề (hỗ trợ xuống dòng)</label>
                  <textarea name="event_name_sub" value={config.event_name_sub} onChange={handleChange} style={{...styles.input, height: '80px'}} />
                </div>

                <div style={{ ...styles.grid2, marginTop: '1rem' }}>
                  <div>
                    <label style={styles.label}>Thời gian</label>
                    <input type="text" name="time" value={config.time} onChange={handleChange} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Địa điểm (hỗ trợ xuống dòng)</label>
                    <textarea name="location" value={config.location} onChange={handleChange} style={{...styles.input, height: '60px'}} />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.label}>Lời cảm ơn cuối mặt trái (hỗ trợ xuống dòng)</label>
                  <textarea name="footer_message" value={config.footer_message} onChange={handleChange} style={{...styles.input, height: '60px'}} />
                </div>

                <div style={{ ...styles.grid3, marginTop: '1rem' }}>
                  <div>
                    <label style={styles.label}>Ngày tháng ký</label>
                    <input type="text" name="sign_date" value={config.sign_date} onChange={handleChange} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Chức danh người ký</label>
                    <textarea name="sign_title" value={config.sign_title} onChange={handleChange} style={{...styles.input, height: '60px'}} />
                  </div>
                  <div>
                    <label style={styles.label}>Tên người ký</label>
                    <input type="text" name="sign_name" value={config.sign_name} onChange={handleChange} style={styles.input} />
                  </div>
                </div>
              </div>

              {/* PHẦN 2: THÔNG TIN TRANG PHẢI */}
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Mặt Phải - Chương Trình</h4>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={styles.label}>Tiêu đề chương trình</label>
                  <input type="text" name="program_title" value={config.program_title} onChange={handleChange} style={styles.input} />
                </div>

                <label style={styles.label}>Chi tiết chương trình (Agenda)</label>
                {config.agenda.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                    <input 
                      type="text" 
                      value={item.time} 
                      onChange={(e) => handleAgendaChange(index, 'time', e.target.value)} 
                      style={{...styles.input, width: '150px'}} 
                      placeholder="TG (7h00 - 8h00)"
                    />
                    <textarea 
                      value={item.content} 
                      onChange={(e) => handleAgendaChange(index, 'content', e.target.value)} 
                      style={{...styles.input, flex: 1, minHeight: '40px'}} 
                      placeholder="Nội dung"
                    />
                    <button onClick={() => removeAgendaItem(index)} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button onClick={addAgendaItem} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#f1f5f9', color: '#334155', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', marginTop: '5px' }}>
                  <Plus size={16} /> Thêm mục
                </button>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
                  <label style={styles.label}>Thư viện ảnh (Gallery Links)</label>
                  <p style={{fontSize: '12px', color: '#64748b', marginTop: '0', marginBottom: '10px'}}>Dán link ảnh (từ Google Drive, Imgur, Facebook, v.v...) vào đây. Ảnh sẽ hiển thị ở Trang 4 của thiệp.</p>
                  {(config.gallery_images || []).map((url, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={url} 
                        onChange={(e) => handleGalleryChange(index, e.target.value)} 
                        style={{...styles.input, flex: 1}} 
                        placeholder="Link ảnh (VD: https://imgur.com/anh.jpg)"
                      />
                      <button onClick={() => removeGalleryImage(index)} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '8px', cursor: 'pointer', margin: 0, fontWeight: 'bold' }}>
                        {uploadingImage ? '⏳ Đang tải lên...' : '📸 Tải ảnh lên từ máy'}
                        <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploadingImage} style={{position: 'absolute', opacity: 0, width: 0, height: 0}} />
                      </label>
                    </div>
                    <button onClick={addGalleryImage} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#f1f5f9', color: '#334155', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
                      <Plus size={16} /> Thêm link thủ công
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
                  <label style={styles.label}>Lời nhắn QR Code (hỗ trợ xuống dòng)</label>
                  <textarea name="qr_message" value={config.qr_message} onChange={handleChange} style={{...styles.input, height: '80px'}} />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.label}>Lời kết</label>
                  <input type="text" name="ending_message" value={config.ending_message} onChange={handleChange} style={styles.input} />
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.label}>Link Nhạc nền (Audio URL từ Internet)</label>
                  <input type="text" name="bg_music" value={config.bg_music} onChange={handleChange} style={styles.input} placeholder="VD: https://example.com/music.mp3" />
                  <p style={{fontSize: '12px', color: '#64748b', marginTop: '5px'}}>Bạn có thể copy link file nhạc .mp3 từ các trang web (như Zing MP3, NCT, Nhaccuatui) và dán vào đây.</p>
                </div>
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
    fontSize: '15px',
    fontFamily: 'inherit'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#334155',
    fontSize: '14px'
  },
  section: {
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '1.5rem',
    color: '#0f172a',
    borderBottom: '2px solid #cbd5e1',
    paddingBottom: '0.5rem'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1rem'
  }
};
