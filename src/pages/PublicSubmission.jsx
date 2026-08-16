import { useState } from 'react';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import { Upload, CheckCircle2, Trophy, Sparkles, Send, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicSubmission() {
  const [formData, setFormData] = useState({
    title: '',
    author_name: '',
    student_class: '',
    phone: '',
    category: 'Tranh vẽ',
    image_url: '',
    image_url_angle2: '',
    video_url: '',
    model_3d_url: '',
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = ['Tranh vẽ', 'Video / Short Clip', 'Mô hình / Sáng tạo', 'Thơ & Bài viết', 'Chung'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author_name || !formData.student_class) {
      alert("Vui lòng nhập Tên tác phẩm, Họ tên tác giả và Lớp/Khóa.");
      return;
    }

    setSubmitting(true);
    try {
      const fullAuthor = `${formData.author_name.trim()} (${formData.student_class.trim()})`;

      const { error } = await supabase
        .from('cbq_voting_entries')
        .insert([{
          title: formData.title.trim(),
          author_name: fullAuthor,
          category: formData.category,
          image_url: formData.image_url,
          image_url_angle2: formData.image_url_angle2,
          video_url: formData.video_url,
          model_3d_url: formData.model_3d_url,
          description: formData.description.trim(),
          is_active: false, // Default pending approval by Admin
          votes_count: 0
        }]);

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi bài dự thi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 16px' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #b45309 100%)',
        borderRadius: '20px',
        padding: '30px 20px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(30, 27, 75, 0.25)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '30px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={16} color="#fde047" /> KỶ NIỆM 30 NĂM THPT CAO BÁ QUÁT
        </div>

        <h1 style={{ margin: '0 0 10px 0', fontSize: '26px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 10px rgba(0,0,0,0.7)', fontWeight: '800' }}>
          📤 CỔNG NỘP BÀI THI & SẢN PHẨM SÁNG TẠO ONLINE
        </h1>
        <p style={{ margin: '0 auto', maxWidth: '650px', fontSize: '14px', color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.5)', fontWeight: '500', lineHeight: '1.6' }}>
          Học sinh các lớp và cựu học sinh gửi trực tiếp sản phẩm dự thi (Tranh vẽ, Video, Mô hình, Thơ bài viết) lên hệ thống chào mừng 30 năm thành lập Trường.
        </p>
      </div>

      {/* SUBMISSION FORM OR SUCCESS SCREEN */}
      {success ? (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #bbf7d0', padding: '40px 24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '70px', height: '70px', background: '#dcfce7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <CheckCircle2 size={40} />
          </div>

          <h2 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '22px' }}>
            GỬI BÀI DỰ THI THÀNH CÔNG! 🎉
          </h2>
          <p style={{ color: '#475569', fontSize: '14px', maxWidth: '550px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            Cảm ơn bạn/tập thể lớp đã gửi bài dự thi <strong>"{formData.title}"</strong>. Ban Tổ Chức sẽ duyệt bài và hiển thị lên Cổng Bình Chọn công khai trong thời gian sớm nhất!
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                setSuccess(false);
                setFormData({ title: '', author_name: '', student_class: '', phone: '', category: 'Tranh vẽ', image_url: '', description: '' });
              }}
              style={{ padding: '10px 20px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📤 Nộp Thêm Bài Thi Khác
            </button>

            <Link 
              to="/binh-chon"
              style={{ padding: '10px 24px', background: '#be123c', color: 'white', borderRadius: '10px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Trophy size={18} /> Xem Cổng Bình Chọn
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#be123c" /> PHIẾU ĐĂNG KÝ NỘP BÀI DỰ THI
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Tên Tác Phẩm / Sản Phẩm Dự Thi (*)
              </label>
              <input 
                type="text" 
                required 
                placeholder="VD: Tranh vẽ 'Trường THPT Cao Bá Quát 30 Năm Trong Tim'"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Họ và Tên Tác Giả / Tập Thể (*)
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="VD: Nguyễn Văn Anh hoặc Tập thể 12A1"
                  value={formData.author_name}
                  onChange={e => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Lớp / Niên Khóa (*)
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="VD: Lớp 12A1 hoặc Khóa 2002-2005"
                  value={formData.student_class}
                  onChange={e => setFormData(prev => ({ ...prev, student_class: e.target.value }))}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Phân Loại Thể Loại Dự Thi (*)
                </label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Số Điện Thoại / Zalo Liên Hệ
                </label>
                <input 
                  type="text" 
                  placeholder="VD: 0901234567"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                📷 Ảnh Tác Phẩm Chính Diện (Mặt Trước *)
              </label>
              <ImageUpload 
                currentUrl={formData.image_url}
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  📐 Ảnh Góc Nghiêng / Mặt Sau (Để xem 360°)
                </label>
                <ImageUpload 
                  currentUrl={formData.image_url_angle2}
                  onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image_url_angle2: url }))}
                  onRemove={() => setFormData(prev => ({ ...prev, image_url_angle2: '' }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  🎥 Link Video / YouTube / Shorts Thuyết Minh
                </label>
                <input 
                  type="url" 
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.video_url}
                  onChange={e => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Bài Thuyết Minh Ý Nghĩa / Nội Dung Tác Phẩm
              </label>
              <textarea 
                rows={5}
                placeholder="Nhập nội dung thuyết minh về tác phẩm, ý tưởng sáng tạo hoặc bài thơ, bài cảm nghĩ chào mừng 30 năm..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Link to="/binh-chon" style={{ padding: '11px 20px', background: '#f1f5f9', color: '#475569', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Quay lại
              </Link>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.3)' }}
              >
                <Send size={18} /> {submitting ? 'Đang gửi bài...' : 'GỬI BÀI DỰ THI'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
