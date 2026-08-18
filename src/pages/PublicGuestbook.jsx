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
      fetchEntries(); 
    }
  };

  const handleLike = async (id, currentLikes) => {
    setEntries(entries.map(e => e.id === id ? { ...e, likes_count: currentLikes + 1 } : e));
    const { error } = await supabase
      .from('cbq_guestbook')
      .update({ likes_count: currentLikes + 1 })
      .eq('id', id);
    if (error) fetchEntries();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <div className="glass-page-wrapper">
      <div className="glass-container">
        {/* Hero Section */}
        <div className="glass-hero">
          <h1 className="glass-hero-title">Sổ Lưu Bút Kỷ Niệm 30 Năm</h1>
          <p className="glass-hero-subtitle">
            Nơi lưu giữ những dòng cảm xúc, kỷ niệm đẹp và lời chúc ý nghĩa gửi đến mái trường THPT Cao Bá Quát.
          </p>
          <button className="glass-btn primary" onClick={() => setShowForm(true)}>
            <PenTool size={22} />
            Viết Lưu Bút
          </button>
        </div>

        {/* Masonry Grid */}
        <div className="masonry-grid-custom">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', width: '100%', color: '#fff' }}>
              <div className="glass-spinner"></div>
              <p style={{ marginTop: '1rem', fontWeight: 500 }}>Đang tải những dòng lưu bút...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="glass-empty">
              <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.7 }} />
              <h3>Chưa có lưu bút nào</h3>
              <p>Hãy là người đầu tiên viết lên những dòng cảm xúc của mình nhé!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="glass-card">
                {entry.image_url && (
                  <div className="glass-image-container">
                    <img src={entry.image_url} alt="Kỷ niệm" loading="lazy" />
                  </div>
                )}
                <div className="glass-card-body">
                  <p className="glass-card-content">"{entry.content}"</p>
                  
                  <div className="glass-card-footer">
                    <div className="author-info">
                      <div className="author-avatar">
                        {(entry.author_name || 'V').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="author-name">{entry.author_name || 'Vô danh'}</div>
                        <div className="author-meta">
                          <span className="glass-badge">{entry.author_category || 'Khách'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                            <Clock size={12} /> {formatDate(entry.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className={`glass-like-btn ${entry.likes_count > 0 ? 'liked' : ''}`}
                      onClick={() => handleLike(entry.id, entry.likes_count)}
                    >
                      <Heart size={18} fill={entry.likes_count > 0 ? '#fb7185' : 'none'} />
                      <span>{entry.likes_count > 0 ? entry.likes_count : 'Thích'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="glass-modal-overlay">
            <div className="glass-modal-content">
              <div className="glass-modal-header">
                <h3>Viết Lưu Bút Kỷ Niệm</h3>
                <button className="glass-close-btn" onClick={() => setShowForm(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="glass-form">
                <div className="glass-form-group">
                  <label>Họ và tên của bạn <span style={{color: '#fda4af'}}>*</span></label>
                  <div className="glass-input-wrapper">
                    <User size={18} className="glass-input-icon" />
                    <input 
                      type="text" 
                      name="author_name" 
                      value={formData.author_name} 
                      onChange={handleInputChange} 
                      placeholder="Nhập họ tên đầy đủ..." 
                      required 
                      className="glass-input" 
                    />
                  </div>
                </div>
                
                <div className="glass-form-group">
                  <label>Bạn là</label>
                  <select 
                    name="author_category" 
                    value={formData.author_category} 
                    onChange={handleInputChange} 
                    className="glass-input"
                  >
                    <option value="Cựu học sinh" style={{color: '#000'}}>Cựu học sinh</option>
                    <option value="Học sinh đang học" style={{color: '#000'}}>Học sinh đang học</option>
                    <option value="Cựu giáo viên" style={{color: '#000'}}>Cựu giáo viên</option>
                    <option value="Giáo viên đang dạy" style={{color: '#000'}}>Giáo viên đang dạy</option>
                    <option value="Phụ huynh" style={{color: '#000'}}>Phụ huynh</option>
                    <option value="Khách mời" style={{color: '#000'}}>Khách mời khác</option>
                  </select>
                </div>
                
                <div className="glass-form-group">
                  <label>Nội dung lưu bút <span style={{color: '#fda4af'}}>*</span></label>
                  <textarea 
                    name="content" 
                    value={formData.content} 
                    onChange={handleInputChange} 
                    placeholder="Hãy chia sẻ những kỷ niệm đẹp, cảm nghĩ hoặc lời chúc của bạn..." 
                    required 
                    rows={4}
                    className="glass-input glass-textarea"
                  ></textarea>
                </div>
                
                <div className="glass-form-group">
                  <label>Hình ảnh đính kèm (Tùy chọn)</label>
                  <div className="glass-upload-area">
                    <ImageUpload 
                      currentUrl={formData.image_url} 
                      onUploadSuccess={handleUploadSuccess} 
                      onRemove={handleRemoveImage} 
                    />
                    {!formData.image_url && (
                      <p style={{fontSize: '13px', opacity: 0.7, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <ImageIcon size={16} /> Chọn một bức ảnh kỷ niệm thật đẹp nhé.
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="glass-form-actions">
                  <button type="button" onClick={() => setShowForm(false)} className="glass-btn secondary">
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting} className="glass-btn primary">
                    {submitting ? 'Đang gửi...' : 'Đăng Lưu Bút'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Advanced Glassmorphism CSS */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

          /* Full page gradient wrapper to override PublicLayout background for this page only */
          .glass-page-wrapper {
            margin: -20px -20px -40px -20px;
            min-height: calc(100vh - 80px);
            background: linear-gradient(-45deg, #0f172a, #312e81, #831843, #064e3b);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            font-family: 'Outfit', sans-serif;
            color: #f8fafc;
          }

          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .glass-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px 80px;
          }

          .glass-hero {
            text-align: center;
            padding: 40px 20px 60px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .glass-hero-title {
            font-size: clamp(36px, 6vw, 64px);
            font-weight: 800;
            background: linear-gradient(to right, #fde047, #fef08a, #fff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
          }

          .glass-hero-subtitle {
            font-size: clamp(16px, 2.5vw, 20px);
            max-width: 700px;
            margin: 0 auto 40px;
            opacity: 0.9;
            line-height: 1.6;
            font-weight: 400;
          }

          /* Glass Buttons */
          .glass-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 32px;
            border-radius: 50px;
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            margin: 0 auto;
          }

          .glass-btn.primary {
            background: rgba(253, 224, 71, 0.2);
            border: 1px solid rgba(253, 224, 71, 0.5);
            color: #fde047;
            box-shadow: 0 8px 32px 0 rgba(253, 224, 71, 0.15);
          }

          .glass-btn.primary:hover {
            background: rgba(253, 224, 71, 0.35);
            border-color: rgba(253, 224, 71, 0.8);
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 15px 30px rgba(253, 224, 71, 0.3), 0 0 20px rgba(253, 224, 71, 0.2);
            color: #fff;
          }

          .glass-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
          }

          .glass-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.4);
            transform: translateY(-2px);
          }

          /* Masonry Grid */
          .masonry-grid-custom {
            column-count: 3;
            column-gap: 24px;
            width: 100%;
          }
          
          @media (max-width: 992px) { .masonry-grid-custom { column-count: 2; } }
          @media (max-width: 600px) { .masonry-grid-custom { column-count: 1; } }

          /* Glass Cards */
          .glass-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 24px;
            break-inside: avoid;
            box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.2);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            animation: fadeIn 0.6s ease-out forwards;
            position: relative;
            overflow: hidden;
          }

          .glass-card::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
            transform: skewX(-25deg);
            transition: 0.5s;
          }

          .glass-card:hover {
            transform: translateY(-8px);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.1);
            background: rgba(255, 255, 255, 0.12);
          }

          .glass-card:hover::before {
            left: 200%;
          }

          .glass-image-container {
            width: 100%;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          }

          .glass-image-container img {
            width: 100%;
            height: auto;
            display: block;
            transition: transform 0.5s ease;
          }

          .glass-card:hover .glass-image-container img {
            transform: scale(1.05);
          }

          .glass-card-content {
            font-size: 17px;
            line-height: 1.6;
            margin-bottom: 24px;
            font-weight: 300;
            color: #f1f5f9;
            letter-spacing: 0.3px;
          }

          .glass-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .author-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .author-avatar {
            width: 44px; height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fde047, #f59e0b);
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          }

          .author-name {
            font-weight: 600;
            font-size: 15px;
            color: #fff;
            margin-bottom: 4px;
          }

          .glass-badge {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 500;
            backdrop-filter: blur(4px);
          }

          .glass-like-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(4px);
          }

          .glass-like-btn:hover {
            background: rgba(255,255,255,0.15);
            border-color: rgba(255,255,255,0.3);
            transform: scale(1.05);
          }
          
          .glass-like-btn.liked {
            color: #fb7185;
            border-color: rgba(251, 113, 133, 0.4);
            background: rgba(251, 113, 133, 0.1);
          }

          /* Modal Styling */
          .glass-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease-out;
          }

          .glass-modal-content {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 24px;
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
            padding-bottom: 24px;
            color: #fff;
          }
          
          /* Custom Scrollbar for modal */
          .glass-modal-content::-webkit-scrollbar { width: 8px; }
          .glass-modal-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 8px; }
          .glass-modal-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 8px; }

          .glass-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 32px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            position: sticky;
            top: 0;
            background: rgba(30, 41, 59, 0.85);
            backdrop-filter: blur(10px);
            z-index: 10;
          }
          
          .glass-modal-header h3 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(to right, #fff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .glass-close-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            width: 36px; height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .glass-close-btn:hover {
            background: rgba(239, 68, 68, 0.8);
            border-color: #ef4444;
            transform: rotate(90deg);
          }

          .glass-form {
            padding: 24px 32px;
          }

          .glass-form-group {
            margin-bottom: 24px;
          }

          .glass-form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 15px;
            color: #e2e8f0;
            letter-spacing: 0.5px;
          }

          .glass-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .glass-input-icon {
            position: absolute;
            left: 16px;
            color: #94a3b8;
          }

          .glass-input {
            width: 100%;
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 12px;
            color: #fff;
            padding: 14px 16px;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            transition: all 0.3s;
            box-sizing: border-box;
          }
          
          .glass-input-wrapper .glass-input {
            padding-left: 44px;
          }

          .glass-input:focus {
            outline: none;
            border-color: #fde047;
            background: rgba(15, 23, 42, 0.6);
            box-shadow: 0 0 0 4px rgba(253, 224, 71, 0.1);
          }
          
          .glass-input::placeholder {
            color: #64748b;
          }
          
          .glass-textarea {
            resize: vertical;
            line-height: 1.5;
          }

          .glass-upload-area {
            border: 1px dashed rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.02);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s;
          }
          
          .glass-upload-area:hover {
            border-color: rgba(255,255,255,0.6);
            background: rgba(255,255,255,0.05);
          }

          .glass-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 16px;
            margin-top: 32px;
          }
          
          .glass-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(255,255,255,0.1);
            border-left-color: #fde047;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          
          .glass-empty {
            text-align: center;
            padding: 60px 20px;
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            border: 1px dashed rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
