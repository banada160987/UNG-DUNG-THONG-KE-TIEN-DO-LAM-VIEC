import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function AdminInviteConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [config, setConfig] = useState({
    school_name: 'TRƯỜNG THPT CAO BÁ QUÁT',
    logo_url: '/logo.jpg',
    invite_title1: 'Trân trọng kính mời',
    invite_title2: 'ĐẠI BIỂU THAM DỰ',
    event_name_main: 'LỄ KỶ NIỆM',
    event_name_sub: '30 NĂM THÀNH LẬP\nTRƯỜNG THPT CAO BÁ QUÁT\n(1996 - 2026)',
    time: '07 giờ 30, ngày 03 tháng 9 năm 2026',
    event_target_date: '2026-09-03T07:30',
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
    bg_image: '',
    bank_name: 'MBBank',
    bank_account_no: '0966888999',
    bank_account_holder: 'TRUONG THPT CAO BA QUAT',
    gallery_images: [
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&q=80",
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500&q=80",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&q=80",
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&q=80"
    ]
  });

  const [wishesList, setWishesList] = useState([]);
  const [loadingWishes, setLoadingWishes] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchWishesList();
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

  const fetchWishesList = async () => {
    setLoadingWishes(true);
    const { data } = await supabase.from('cbq_wishes').select('*').order('created_at', { ascending: false });
    if (data) {
      setWishesList(data);
    }
    setLoadingWishes(false);
  };

  const handleDeleteWishAdmin = async (wish) => {
    const confirmDelete = window.confirm(`🗑️ XÁC NHẬN XÓA LỜI CHÚC:\n\nBạn có chắc chắn muốn xóa lời chúc của "${wish.guest_name}"?\nNội dung: "${wish.message}"`);
    if (!confirmDelete) return;

    let error = null;
    if (wish.id) {
      const res = await supabase.from('cbq_wishes').delete().eq('id', wish.id);
      error = res.error;
    } else {
      const res = await supabase.from('cbq_wishes').delete().eq('guest_name', wish.guest_name).eq('message', wish.message);
      error = res.error;
    }

    if (!error) {
      alert("Đã xóa lời chúc thành công!");
      setWishesList(prev => prev.filter(w => (wish.id ? w.id !== wish.id : w.message !== wish.message)));
    } else {
      alert("Lỗi khi xóa lời chúc: " + error.message);
    }
  };

  const handleClearAllDemoWishes = async () => {
    const confirmClear = window.confirm("⚠️ XÁC NHẬN XÓA TẤT CẢ LỜI CHÚC THỬ NGHIỆM:\n\nBạn có chắc chắn muốn xóa TẤT CẢ lời chúc mẫu (chứa tên 'Nguyễn Văn B' hoặc 'Khách mời') khỏi hệ thống không?");
    if (!confirmClear) return;

    const { error } = await supabase
      .from('cbq_wishes')
      .delete()
      .or('guest_name.eq.Nguyễn Văn B,guest_name.ilike.%Nguyễn Văn B%,guest_name.eq.Khách mời');

    if (!error) {
      alert("🎉 ĐÃ XÓA SẠCH TOÀN BỘ LỜI CHÚC THỬ NGHIỆM THÀNH CÔNG!");
      fetchWishesList();
    } else {
      alert("Lỗi khi xóa lời chúc mẫu: " + error.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('cbq_pages')
      .update({ title: 'Cấu hình Thiệp Mời Điện Tử', content: JSON.stringify(config) })
      .eq('slug', 'invite-config');
      
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('gallery').upload(fileName, file);

    if (uploadError) {
      alert("Lỗi upload logo: " + uploadError.message);
      setUploadingLogo(false);
      return;
    }

    const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
    if (data && data.publicUrl) {
      setConfig(prev => ({ ...prev, logo_url: data.publicUrl }));
    }
    
    setUploadingLogo(false);
    e.target.value = ''; // Reset input
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBg(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `bg-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('gallery').upload(fileName, file);

    if (uploadError) {
      alert("Lỗi upload ảnh nền: " + uploadError.message);
      setUploadingBg(false);
      return;
    }

    const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
    if (data && data.publicUrl) {
      setConfig(prev => ({ ...prev, bg_image: data.publicUrl }));
    }
    
    setUploadingBg(false);
    e.target.value = ''; // Reset input
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingQr(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `vietqr-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('gallery').upload(fileName, file);

    if (uploadError) {
      alert("Lỗi upload mã QR: " + uploadError.message);
      setUploadingQr(false);
      return;
    }

    const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
    if (data && data.publicUrl) {
      setConfig(prev => ({ ...prev, bank_qr_image: data.publicUrl }));
    }
    
    setUploadingQr(false);
    e.target.value = ''; // Reset input
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

                {/* THÔNG TIN TÀI KHOẢN & MÃ VIETQR */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
                  <h4 style={styles.sectionTitle}>Thông Tin Tài Khoản & Mã VietQR Tài Trợ</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={styles.label}>Tên Ngân hàng (VD: MBBank, Vietcombank, BIDV)</label>
                      <input type="text" name="bank_name" value={config.bank_name || ''} onChange={handleChange} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.label}>Số tài khoản</label>
                      <input type="text" name="bank_account_no" value={config.bank_account_no || ''} onChange={handleChange} style={styles.input} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={styles.label}>Tên chủ tài khoản</label>
                    <input type="text" name="bank_account_holder" value={config.bank_account_holder || ''} onChange={handleChange} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Tải ảnh Mã VietQR tùy chỉnh lên (Nếu có ảnh thiết kế sẵn)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="text" name="bank_qr_image" value={config.bank_qr_image || ''} onChange={handleChange} style={{...styles.input, flex: 1}} placeholder="Link ảnh QR tự chọn hoặc tải ảnh từ máy bên dưới" />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer', margin: 0, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {uploadingQr ? '⏳ Đang tải...' : '📲 Upload Ảnh VietQR'}
                        <input type="file" accept="image/*" onChange={handleQrUpload} disabled={uploadingQr} style={{position: 'absolute', opacity: 0, width: 0, height: 0}} />
                      </label>
                    </div>
                    {config.bank_qr_image && (
                      <div style={{marginTop: '8px'}}>
                        <img src={getDirectImageUrl(config.bank_qr_image)} alt="VietQR Preview" style={{maxHeight: '130px', borderRadius: '8px', border: '1px solid #ddd'}} />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.label}>Lời kết</label>
                  <input type="text" name="ending_message" value={config.ending_message} onChange={handleChange} style={styles.input} />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.label}>Logo Trường (Link ảnh hoặc Tải lên)</label>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <input type="text" name="logo_url" value={config.logo_url} onChange={handleChange} style={{...styles.input, flex: 1, margin: 0}} placeholder="Nhập link ảnh logo..." />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '8px', cursor: 'pointer', margin: 0, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {uploadingLogo ? '⏳ Đang tải...' : '📸 Tải lên'}
                      <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} style={{position: 'absolute', opacity: 0, width: 0, height: 0}} />
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.label}>Ảnh Nền Thiệp Mời (Tùy chọn - Link hoặc Tải lên)</label>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <input type="text" name="bg_image" value={config.bg_image || ''} onChange={handleChange} style={{...styles.input, flex: 1, margin: 0}} placeholder="Nhập link ảnh nền tùy chỉnh..." />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '8px', cursor: 'pointer', margin: 0, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {uploadingBg ? '⏳ Đang tải...' : '📸 Tải ảnh nền'}
                      <input type="file" accept="image/*" onChange={handleBgUpload} disabled={uploadingBg} style={{position: 'absolute', opacity: 0, width: 0, height: 0}} />
                    </label>
                  </div>
                  <p style={{fontSize: '12px', color: '#64748b', marginTop: '5px'}}>Nếu để trống, hệ thống sẽ tự dùng họa tiết phông nền mặc định sang trọng.</p>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
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

        {/* WISHES MANAGEMENT SECTION FOR BTC ADMIN */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#be123c', fontFamily: 'Playfair Display, serif' }}>
              💌 Quản Lý Sổ Vàng Lời Chúc ({wishesList.length} lời chúc)
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleClearAllDemoWishes} 
                style={{ padding: '6px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                title="Xóa tất cả các lời chúc mẫu thử nghiệm chứa tên Nguyễn Văn B"
              >
                🗑️ Xóa Lời Chúc Mẫu
              </button>
              <button 
                onClick={fetchWishesList} 
                style={{ padding: '6px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                🔄 Làm mới danh sách
              </button>
            </div>
          </div>

          <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0, marginBottom: '1rem' }}>
            Dưới đây là danh sách lời chúc do cựu học sinh & đại biểu gửi tới nhà trường. Admin có thể xóa những lời chúc nhập nhầm hoặc vi phạm.
          </p>

          {loadingWishes ? <p>Đang tải danh sách lời chúc...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '12px', fontSize: '14px', width: '22%' }}>Người Gửi</th>
                    <th style={{ padding: '12px', fontSize: '14px' }}>Nội Dung Lời Chúc</th>
                    <th style={{ padding: '12px', fontSize: '14px', width: '20%' }}>Thời Gian</th>
                    <th style={{ padding: '12px', fontSize: '14px', textAlign: 'center', width: '100px' }}>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {wishesList.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#be123c' }}>
                        {w.guest_name || 'Khách mời'}
                      </td>
                      <td style={{ padding: '12px', color: '#1e293b', lineHeight: '1.5' }}>
                        {w.message}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>
                        {w.created_at ? new Date(w.created_at).toLocaleString('vi-VN') : 'Mới đây'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDeleteWishAdmin(w)}
                          style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                          title="Xóa lời chúc này khỏi hệ thống"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {wishesList.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Chưa có lời chúc nào trong hệ thống.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
