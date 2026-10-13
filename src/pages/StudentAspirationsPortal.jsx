import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Send, ShieldCheck, Sparkles, AlertTriangle, CheckCircle2, 
  HelpCircle, MessageSquare, Phone, User, Users, Lock, Unlock,
  Building, BookOpen, Smile, ArrowLeft, Loader2
} from 'lucide-react';
import { 
  ASPIRATION_CATEGORIES, 
  submitStudentAspiration, 
  polishAspirationWithAi 
} from '../utils/aiPsychologyAdvisor';

export default function StudentAspirationsPortal() {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('co_so_vat_chat');
  const [urgency, setUrgency] = useState('Bình thường');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [phone, setPhone] = useState('');

  const [isPolishing, setIsPolishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePolish = async () => {
    if (!content.trim()) {
      alert('Em hãy viết vài câu nháp tâm tư hoặc ý kiến trước rồi nhờ AI trau chuốt nhé!');
      return;
    }
    setIsPolishing(true);
    try {
      const polished = await polishAspirationWithAi(content, category);
      if (polished) {
        setContent(polished);
      }
    } catch (err) {
      console.warn('Lỗi trau chuốt:', err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung tâm tư, ý kiến hoặc nguyện vọng của em!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await submitStudentAspiration({
        content: content.trim(),
        category,
        urgency,
        isAnonymous,
        studentName: studentName.trim(),
        className: className.trim(),
        phone: phone.trim()
      });

      setSuccess(true);
      setContent('');
      setStudentName('');
      setClassName('');
      setPhone('');
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg('Không thể gửi tâm tư lúc này: ' + err.message + '. Em hãy thử lại nhé!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '20px 16px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* NAVIGATION BACK LINK */}
      <div style={{ marginBottom: '16px' }}>
        <Link 
          to="/" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}
        >
          <ArrowLeft size={16} /> Quay về Trang chủ Cổng thông tin
        </Link>
      </div>

      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #fb7185 100%)',
        color: '#ffffff',
        padding: '30px 28px',
        borderRadius: '24px',
        marginBottom: '25px',
        boxShadow: '0 12px 30px rgba(225, 29, 72, 0.22)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
              <Heart size={32} color="#ffffff" fill="#ffffff" />
            </div>
            <div>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#ffffff', fontSize: '11.5px', fontWeight: '800', padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hòm Thư Số BGH & Đoàn Trường CBQ
              </span>
              <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '4px 0 0 0', letterSpacing: '-0.3px' }}>
                HÒM THƯ TÂM TƯ, NGUYỆN VỌNG & Ý KIẾN HỌC SINH
              </h1>
            </div>
          </div>
          <p style={{ margin: '10px 0 0 0', opacity: 0.95, fontSize: '14.5px', lineHeight: '1.6', maxWidth: '780px' }}>
            Kênh trực tuyến lắng nghe tâm tư, cảm xúc, nguyện vọng cơ sở vật chất, giải tỏa áp lực thi cử và tiếp nhận sáng kiến học đường từ học sinh toàn trường.
          </p>
        </div>
      </div>

      {/* CAM KẾT BẢO MẬT & ĐẶC QUYỀN HỌC SINH */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
        marginBottom: '25px'
      }}>
        <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#22c55e', color: '#ffffff', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#166534' }}>Bảo Mật Ẩn Danh 100%</div>
            <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>Em hoàn toàn có thể chọn ẩn danh. Hệ thống không lưu vết danh tính.</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#eff6ff', border: '1.5px solid #93c5fd', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#3b82f6', color: '#ffffff', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#1e40af' }}>Gửi Trực Tiếp Tới BGH & Đoàn Trường</div>
            <div style={{ fontSize: '12px', color: '#1d4ed8', marginTop: '2px' }}>Thầy Cô Lãnh đạo trường và Phòng tư vấn tâm lý sẽ trực tiếp đọc và xem xét.</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#faf5ff', border: '1.5px solid #d8b4fe', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#a855f7', color: '#ffffff', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#6b21a8' }}>Trợ Lý AI Trau Chuốt Câu Từ</div>
            <div style={{ fontSize: '12px', color: '#7e22ce', marginTop: '2px' }}>Có trợ lý AI hỗ trợ viết câu từ nhã nhặn, tự tin và mạch lạc hơn.</div>
          </div>
        </div>
      </div>

      {/* THÔNG BÁO GỬI THÀNH CÔNG */}
      {success && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '2px solid #10b981',
          padding: '24px',
          borderRadius: '18px',
          marginBottom: '25px',
          textAlign: 'center',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)'
        }}>
          <CheckCircle2 size={46} color="#059669" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#065f46', margin: '0 0 6px 0' }}>
            💌 TÂM TƯ CỦA EM ĐÃ ĐƯỢC CHUYỂN TỚI BAN GIÁM HIỆU THÀNH CÔNG!
          </h3>
          <p style={{ fontSize: '13.5px', color: '#047857', maxWidth: '600px', margin: '0 auto 16px auto', lineHeight: '1.6' }}>
            Thầy Cô Ban Giám Hiệu và Đoàn trường đã nhận được thông báo chuông và sẽ sớm xem xét, giải quyết ý kiến của em. Cảm ơn em rất nhiều vì đã tin tưởng và góp ý xây dựng nhà trường! 🌿
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            style={{
              padding: '8px 22px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '13.5px',
              cursor: 'pointer'
            }}
          >
            ✍️ Gửi thêm tâm tư khác
          </button>
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #f87171', color: '#991b1b', padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '13.5px' }}>
          {errorMsg}
        </div>
      )}

      {/* FORM SOẠN THẢO TÂM TƯ */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #cbd5e1',
        padding: '28px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
        marginBottom: '30px'
      }}>
        <form onSubmit={handleSubmit}>
          
          {/* BƯỚC 1: LỰA CHỌN DANH TÍNH */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>
              1. HÌNH THỨC GỬI THƯ BẢO MẬT:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <div 
                onClick={() => setIsAnonymous(true)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: isAnonymous ? '2.5px solid #059669' : '1.5px solid #e2e8f0',
                  backgroundColor: isAnonymous ? '#f0fdf4' : '#fafafa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: isAnonymous ? '0 4px 12px rgba(5,150,105,0.1)' : 'none'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: isAnonymous ? '6px solid #059669' : '2px solid #cbd5e1', boxSizing: 'border-box' }} />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: isAnonymous ? '#065f46' : '#334155' }}>
                    🔒 Gửi Ẩn Danh Hoàn Toàn (Khuyên Dùng)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Hệ thống không lưu danh tính. Em có thể thoải mái chia sẻ thật lòng.
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setIsAnonymous(false)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: !isAnonymous ? '2.5px solid #2563eb' : '1.5px solid #e2e8f0',
                  backgroundColor: !isAnonymous ? '#eff6ff' : '#fafafa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: !isAnonymous ? '0 4px 12px rgba(37,99,235,0.1)' : 'none'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: !isAnonymous ? '6px solid #2563eb' : '2px solid #cbd5e1', boxSizing: 'border-box' }} />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: !isAnonymous ? '#1e40af' : '#334155' }}>
                    👤 Ghi Rõ Họ Tên & Lớp
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Thầy Cô BGH có thể trực tiếp gặp gỡ, giải đáp hoặc hỗ trợ em tốt hơn.
                  </div>
                </div>
              </div>
            </div>

            {/* CÁC Ô NHẬP NẾU KHÔNG ẨN DANH HOẶC NHẬP LỚP ĐỂ TIỆN XỬ LÝ */}
            {!isAnonymous ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '14px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Họ và tên học sinh *</label>
                  <input 
                    type="text" 
                    placeholder="VD: Nguyễn Văn An"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Lớp *</label>
                  <input 
                    type="text" 
                    placeholder="VD: 10A1, 11B3, 12A2..."
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Số điện thoại (tùy chọn)</label>
                  <input 
                    type="tel" 
                    placeholder="VD: 0912345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Gợi ý: Em có thể ghi tên Khối/Lớp để Thầy Cô nắm rõ phạm vi vấn đề (không bắt buộc):</span>
                <input 
                  type="text" 
                  placeholder="Lớp (tùy chọn, vd: 12A1)"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  style={{ width: '160px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
            )}
          </div>

          {/* BƯỚC 2: CHỦ ĐỀ TÂM TƯ */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>
              2. CHỦ ĐỀ TÂM TƯ / KIẾN NGHỊ:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {ASPIRATION_CATEGORIES.map(c => {
                const isSelected = category === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #be123c' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#fff1f2' : '#ffffff',
                      color: isSelected ? '#be123c' : '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: '13px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{c.icon}</span>
                    <span>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BƯỚC 3: MỨC ĐỘ KHẨN CẤP */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>
              3. MỨC ĐỘ CẦN HỖ TRỢ:
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setUrgency('Bình thường')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: urgency === 'Bình thường' ? '2px solid #059669' : '1px solid #cbd5e1',
                  backgroundColor: urgency === 'Bình thường' ? '#ecfdf5' : '#ffffff',
                  color: urgency === 'Bình thường' ? '#065f46' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🟢 Bình thường (Chia sẻ tâm sự, góp ý xây dựng)
              </button>

              <button
                type="button"
                onClick={() => setUrgency('Cần BGH can thiệp gấp')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: urgency === 'Cần BGH can thiệp gấp' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                  backgroundColor: urgency === 'Cần BGH can thiệp gấp' ? '#fef2f2' : '#ffffff',
                  color: urgency === 'Cần BGH can thiệp gấp' ? '#991b1b' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔴 Cần BGH can thiệp gấp (Khủng hoảng tâm lý, mâu thuẫn khẩn cấp)
              </button>
            </div>
          </div>

          {/* BƯỚC 4: NỘI DUNG TÂM SỰ */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
                4. NỘI DUNG TÂM TƯ / Ý KIẾN / NGUYỆN VỌNG CỦA EM *
              </label>
              
              {/* NÚT AI TRAU CHUỐT */}
              <button
                type="button"
                onClick={handlePolish}
                disabled={isPolishing || !content.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isPolishing || !content.trim() ? '#e2e8f0' : '#8b5cf6',
                  color: isPolishing || !content.trim() ? '#94a3b8' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: isPolishing || !content.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: isPolishing || !content.trim() ? 'none' : '0 2px 8px rgba(139, 92, 246, 0.3)'
                }}
              >
                {isPolishing ? <Loader2 size={13} className="cbq-spin" /> : <Sparkles size={13} />}
                <span>{isPolishing ? 'AI đang trau chuốt...' : '✨ Nhờ AI trau chuốt câu từ'}</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Em có thể thoải mái chia sẻ những suy nghĩ, cảm xúc, băn khoăn về học tập, bạn bè, thầy cô hoặc kiến nghị cải thiện cơ sở vật chất nhà trường..."
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                lineHeight: '1.6',
                boxSizing: 'border-box',
                resize: 'vertical',
                outline: 'none'
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {content.length} ký tự
            </div>
          </div>

          {/* NÚT GỬI TÂM TƯ */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <Link 
              to="/"
              style={{ padding: '10px 18px', color: '#64748b', textDecoration: 'none', fontSize: '13.5px', fontWeight: 'bold' }}
            >
              Hủy bỏ
            </Link>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: submitting || !content.trim() ? '#cbd5e1' : '#be123c',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '900',
                cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
                boxShadow: submitting || !content.trim() ? 'none' : '0 4px 15px rgba(190, 18, 60, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {submitting ? <Loader2 size={18} className="cbq-spin" /> : <Send size={18} />}
              <span>{submitting ? 'Đang chuyển tới BGH...' : '💌 Gửi Tới Ban Giám Hiệu'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* THÔNG ĐIỆP TỪ BAN GIÁM HIỆU */}
      <div style={{
        backgroundColor: '#fffbeb',
        borderRadius: '16px',
        border: '1.5px solid #fde047',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{ fontSize: '28px', lineHeight: 1 }}>🌱</div>
        <div style={{ fontSize: '13.5px', color: '#78350f', lineHeight: '1.6' }}>
          <strong>Thông điệp từ Ban Giám Hiệu Trường THPT Cao Bá Quát:</strong>
          <p style={{ margin: '4px 0 0 0' }}>
            "Mỗi ý kiến đóng góp, mỗi trăn trở hay nguyện vọng của các em đều là thông tin quý giá giúp Nhà trường thấu hiểu và hoàn thiện môi trường học đường thân thiện, văn minh và an toàn hơn. Đừng ngần ngại lên tiếng — Thầy Cô luôn luôn lắng nghe các em!"
          </p>
          <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#92400e', fontWeight: '600' }}>
            📞 Tổng đài Quốc gia bảo vệ trẻ em & tư vấn tâm lý: <strong>111</strong> (miễn phí 24/7)
          </div>
        </div>
      </div>

    </div>
  );
}
