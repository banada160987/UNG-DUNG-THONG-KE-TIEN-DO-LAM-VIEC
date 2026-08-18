import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import ImageUpload from '../components/ImageUpload';
import { Heart, MessageSquare, PenTool, X, Clock, User, Image as ImageIcon } from 'lucide-react';

export default function PublicGuestbook() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    author_name: '',
    author_category: 'Cựu học sinh',
    content: '',
    image_url: ''
  });
  
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = async () => {
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

  // Tự động làm mới dữ liệu mỗi 60 giây
  useAutoRefresh(fetchEntries, 60000);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadSuccess = (url) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.author_name.trim() || !formData.content.trim()) {
      alert('Vui lòng điền tên và nội dung lưu bút!');
      return;
    }
    
    setSubmitting(true);
    const { error } = await supabase.from('cbq_guestbook').insert([formData]);
    setSubmitting(false);
    
    if (error) {
      alert('Lỗi khi gửi lưu bút: ' + error.message);
    } else {
      setShowForm(false);
      setFormData({
        author_name: '',
        author_category: 'Cựu học sinh',
        content: '',
        image_url: ''
      });
      fetchEntries(); // Tải lại ngay lập tức
    }
  };

  const handleLike = async (id, currentLikes) => {
    // Tạm thời tăng UI ngay lập tức để tạo cảm giác mượt mà
    setEntries(entries.map(e => e.id === id ? { ...e, likes_count: currentLikes + 1 } : e));
    
    // Gọi API để cập nhật
    const { error } = await supabase
      .from('cbq_guestbook')
      .update({ likes_count: currentLikes + 1 })
      .eq('id', id);
      
    if (error) {
      // Nếu lỗi thì revert lại (hoặc fetch lại)
      fetchEntries();
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Sổ Lưu Bút Kỷ Niệm 30 Năm</h1>
          <p style={styles.heroSubtitle}>
            Nơi lưu giữ những dòng cảm xúc, những kỷ niệm đẹp và những lời chúc ý nghĩa gửi đến trường THPT Cao Bá Quát.
          </p>
          <button className="write-btn-hover" style={styles.writeBtn} onClick={() => setShowForm(true)}>
            <PenTool size={22} />
            Viết Lưu Bút
          </button>
        </div>
      </div>

      {/* Masonry Grid */}
      <div style={styles.masonryContainer}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', width: '100%', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            Đang tải những dòng lưu bút...
          </div>
        ) : entries.length === 0 ? (
          <div style={styles.emptyState}>
            <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h3>Chưa có lưu bút nào</h3>
            <p>Hãy là người đầu tiên viết lên những dòng cảm xúc của mình nhé!</p>
          </div>
        ) : (
          <div style={styles.masonryGrid}>
            {entries.map((entry) => (
              <div key={entry.id} style={styles.card}>
                {entry.image_url && (
                  <div style={styles.cardImageContainer}>
                    <img src={entry.image_url} alt="Kỷ niệm" style={styles.cardImage} loading="lazy" />
                  </div>
                )}
                <div style={styles.cardBody}>
                  <p style={styles.cardContent}>"{entry.content}"</p>
                  
                  <div style={styles.cardFooter}>
                    <div style={styles.authorInfo}>
                      <div style={styles.authorAvatar}>
                        {entry.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.authorName}>{entry.author_name}</div>
                        <div style={styles.authorMeta}>
                          <span style={styles.badge}>{entry.author_category}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {formatDate(entry.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      style={styles.likeBtn} 
                      onClick={() => handleLike(entry.id, entry.likes_count)}
                      title="Thích lưu bút này"
                    >
                      <Heart size={18} fill={entry.likes_count > 0 ? '#ef4444' : 'none'} color={entry.likes_count > 0 ? '#ef4444' : '#64748b'} />
                      <span style={{ color: entry.likes_count > 0 ? '#ef4444' : '#64748b', fontWeight: entry.likes_count > 0 ? 'bold' : 'normal' }}>
                        {entry.likes_count > 0 ? entry.likes_count : 'Thích'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Viết Lưu Bút Kỷ Niệm</h3>
              <button style={styles.closeBtn} onClick={() => setShowForm(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Họ và tên của bạn <span style={{color: 'red'}}>*</span></label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input 
                    type="text" 
                    name="author_name" 
                    value={formData.author_name} 
                    onChange={handleInputChange} 
                    placeholder="Nhập họ tên đầy đủ..." 
                    required 
                    style={styles.input} 
                  />
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Bạn là</label>
                <select 
                  name="author_category" 
                  value={formData.author_category} 
                  onChange={handleInputChange} 
                  style={styles.select}
                >
                  <option value="Cựu học sinh">Cựu học sinh</option>
                  <option value="Học sinh đang học">Học sinh đang học</option>
                  <option value="Cựu giáo viên">Cựu giáo viên</option>
                  <option value="Giáo viên đang dạy">Giáo viên đang dạy</option>
                  <option value="Phụ huynh">Phụ huynh</option>
                  <option value="Khách mời">Khách mời khác</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Nội dung lưu bút <span style={{color: 'red'}}>*</span></label>
                <textarea 
                  name="content" 
                  value={formData.content} 
                  onChange={handleInputChange} 
                  placeholder="Hãy chia sẻ những kỷ niệm đẹp, cảm nghĩ hoặc lời chúc của bạn dành cho nhà trường..." 
                  required 
                  rows={5}
                  style={styles.textarea}
                ></textarea>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Hình ảnh đính kèm (Tùy chọn)</label>
                <div style={styles.uploadArea}>
                  <ImageUpload 
                    currentUrl={formData.image_url} 
                    onUploadSuccess={handleUploadSuccess} 
                    onRemove={handleRemoveImage} 
                  />
                  {!formData.image_url && (
                    <p style={{fontSize: '12px', color: '#64748b', marginTop: '8px'}}>
                      <ImageIcon size={14} style={{verticalAlign: 'middle', marginRight: '4px'}} />
                      Chọn một bức ảnh kỷ niệm thật đẹp để lưu bút thêm phần sinh động nhé.
                    </p>
                  )}
                </div>
              </div>
              
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                  Hủy
                </button>
                <button type="submit" disabled={submitting} style={styles.submitBtn}>
                  {submitting ? 'Đang gửi...' : 'Đăng Lưu Bút'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* CSS for Masonry & Animations */}
      <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(22, 101, 52, 0.2);
          border-left-color: #166534;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Cột masonry sử dụng CSS Columns */
        .masonry-grid-custom {
          column-count: 3;
          column-gap: 20px;
        }
        
        .write-btn-hover:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 30px rgba(253, 224, 71, 0.5) !important;
          background-color: #fef08a !important;
        }
        
        @media (max-width: 992px) {
          .masonry-grid-custom { column-count: 2; }
        }
        
        @media (max-width: 600px) {
          .masonry-grid-custom { column-count: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px 40px',
  },
  hero: {
    position: 'relative',
    borderRadius: '20px',
    overflow: 'hidden',
    marginTop: '20px',
    marginBottom: '30px',
    padding: '40px 20px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #166534 0%, #064e3b 100%)',
    boxShadow: '0 10px 25px rgba(22, 101, 52, 0.2)',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
    opacity: 0.3,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#fde047',
    fontSize: 'clamp(24px, 4vw, 36px)',
    fontWeight: '800',
    marginBottom: '12px',
    fontFamily: '"Playfair Display", "Times New Roman", serif',
    textShadow: '0 2px 6px rgba(0,0,0,0.4)',
    letterSpacing: '0.5px',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    color: '#e2e8f0',
    fontSize: 'clamp(14px, 1.8vw, 16px)',
    lineHeight: '1.6',
    marginBottom: '24px',
    fontWeight: '500',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  writeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fde047',
    color: '#064e3b',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(253, 224, 71, 0.25)',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  
  masonryContainer: {
    width: '100%',
  },
  masonryGrid: {
    columnCount: 3,
    columnGap: '20px',
    // We'll rely on the CSS class 'masonry-grid-custom' via media queries
  },
  card: {
    display: 'inline-block',
    width: '100%',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.3s, box-shadow 0.3s',
    animation: 'fadeIn 0.5s ease-out forwards',
    breakInside: 'avoid',
  },
  cardImageContainer: {
    width: '100%',
    maxHeight: '350px',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'cover',
  },
  cardBody: {
    padding: '24px',
  },
  cardContent: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#334155',
    margin: '0 0 24px 0',
    fontStyle: 'italic',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  authorAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#166534',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  authorName: {
    fontWeight: 'bold',
    color: '#0f172a',
    fontSize: '14px',
    marginBottom: '2px',
  },
  authorMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#64748b',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  likeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '20px',
    transition: 'background 0.2s',
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: '16px',
    border: '2px dashed #cbd5e1',
    color: '#64748b',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    animation: 'fadeIn 0.3s ease-out',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    backgroundColor: '#ffffff',
    zIndex: 10,
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#0f172a',
    fontWeight: 'bold',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '50%',
    transition: 'background 0.2s, color 0.2s',
  },
  form: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#334155',
    fontSize: '14px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 38px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  uploadArea: {
    border: '1px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f8fafc',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '32px',
  },
  cancelBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '15px',
  },
  submitBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#166534',
    color: '#ffffff',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '15px',
    boxShadow: '0 4px 6px rgba(22, 101, 52, 0.2)',
  }
};
