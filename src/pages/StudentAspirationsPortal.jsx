import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Send, ShieldCheck, Sparkles, AlertTriangle, CheckCircle2, 
  HelpCircle, MessageSquare, Phone, User, Users, Lock, Unlock,
  Building, BookOpen, Smile, ArrowLeft, Loader2, BrainCircuit,
  Activity, HeartPulse, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import { 
  ASPIRATION_CATEGORIES, 
  submitStudentAspiration, 
  polishAspirationWithAi 
} from '../utils/aiPsychologyAdvisor';

const DASS21_QUESTIONS = [
  { id: 1, type: 'stress', text: 'Tôi cảm thấy khó mà thư giãn hay nghỉ ngơi được' },
  { id: 2, type: 'anxiety', text: 'Tôi bị khô miệng dù không khát nước' },
  { id: 3, type: 'depression', text: 'Tôi không cảm thấy có chút cảm xúc tích cực hay vui vẻ nào' },
  { id: 4, type: 'anxiety', text: 'Tôi bị rối loạn nhịp thở (thở gấp, hụt hơi dù không vận động)' },
  { id: 5, type: 'depression', text: 'Tôi thấy khó bắt đầu để làm một việc gì đó (học tập, sinh hoạt)' },
  { id: 6, type: 'stress', text: 'Tôi có xu hướng phản ứng thái quá trước các tình huống' },
  { id: 7, type: 'anxiety', text: 'Tôi bị run rẩy (run tay, run chân hoặc bủn rủn)' },
  { id: 8, type: 'stress', text: 'Tôi thấy mình đang tiêu hao quá nhiều năng lượng thần kinh, căng thẳng' },
  { id: 9, type: 'anxiety', text: 'Tôi lo lắng về những tình huống có thể làm tôi hoảng sợ hoặc lúng túng' },
  { id: 10, type: 'depression', text: 'Tôi thấy mình chẳng có gì để hy vọng hay trông đợi ở tương lai' },
  { id: 11, type: 'stress', text: 'Tôi thấy mình dễ bị kích động, bồn chồn, đứng ngồi không yên' },
  { id: 12, type: 'stress', text: 'Tôi thấy khó thư giãn đầu óc sau giờ học' },
  { id: 13, type: 'depression', text: 'Tôi cảm thấy buồn rầu, chán nản và kiệt sức' },
  { id: 14, type: 'stress', text: 'Tôi không thể chịu đựng được những điều cản trở việc tôi đang làm' },
  { id: 15, type: 'anxiety', text: 'Tôi cảm thấy mình gần như bị hoảng loạn, sợ hãi vô cớ' },
  { id: 16, type: 'depression', text: 'Tôi không thể cảm thấy hăng hái đối với bất kỳ môn học hay hoạt động nào' },
  { id: 17, type: 'depression', text: 'Tôi cảm thấy mình không có nhiều giá trị với tư cách là một con người' },
  { id: 18, type: 'stress', text: 'Tôi thấy mình khá dễ chạm tự ái, dễ cáu gắt và nóng giận' },
  { id: 19, type: 'anxiety', text: 'Tôi nghe rõ nhịp tim đập nhanh, đánh trống ngực dù không vận động' },
  { id: 20, type: 'anxiety', text: 'Tôi cảm thấy sợ hãi mà không có lý do chính đáng' },
  { id: 21, type: 'depression', text: 'Tôi cảm thấy cuộc sống này vô nghĩa và trống rỗng' }
];

const DASS_OPTIONS = [
  { val: 0, label: '0 - Không đúng chút nào' },
  { val: 1, label: '1 - Đúng một phần / Thỉnh thoảng' },
  { val: 2, label: '2 - Đúng phần nhiều / Thường xuyên' },
  { val: 3, label: '3 - Hoàn toàn đúng / Hầu như luôn luôn' }
];

export default function StudentAspirationsPortal() {
  const [activeTab, setActiveTab] = useState('aspiration'); // 'aspiration' | 'dass21'
  
  // Aspiration Form State
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

  // DASS-21 State
  const [dassAnswers, setDassAnswers] = useState({});
  const [dassSubmitted, setDassSubmitted] = useState(false);

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

  // Tính điểm DASS-21 (x 2 chuẩn DASS-42)
  const dassScore = useMemo(() => {
    let dep = 0;
    let anx = 0;
    let str = 0;

    DASS21_QUESTIONS.forEach(q => {
      const val = dassAnswers[q.id] || 0;
      if (q.type === 'depression') dep += val;
      else if (q.type === 'anxiety') anx += val;
      else if (q.type === 'stress') str += val;
    });

    const depTotal = dep * 2;
    const anxTotal = anx * 2;
    const strTotal = str * 2;

    const getLevel = (val, thresholds) => {
      if (val <= thresholds[0]) return { text: 'Bình thường', color: '#16a34a', bg: '#dcfce7' };
      if (val <= thresholds[1]) return { text: 'Nhẹ', color: '#0284c7', bg: '#e0f2fe' };
      if (val <= thresholds[2]) return { text: 'Vừa', color: '#d97706', bg: '#fef3c7' };
      if (val <= thresholds[3]) return { text: 'Nặng', color: '#ea580c', bg: '#ffedd5' };
      return { text: 'Rất Nặng', color: '#dc2626', bg: '#fee2e2' };
    };

    return {
      depression: { score: depTotal, level: getLevel(depTotal, [9, 13, 20, 27]) },
      anxiety: { score: anxTotal, level: getLevel(anxTotal, [7, 9, 14, 19]) },
      stress: { score: strTotal, level: getLevel(strTotal, [14, 18, 25, 33]) }
    };
  }, [dassAnswers]);

  const handleDassOptionChange = (qId, val) => {
    setDassAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSendDassToCounselor = async () => {
    const summary = `[KẾT QUẢ SÀNG LỌC TÂM LÝ DASS-21]
- Trầm cảm: ${dassScore.depression.score}đ (${dassScore.depression.level.text})
- Lo âu: ${dassScore.anxiety.score}đ (${dassScore.anxiety.level.text})
- Căng thẳng (Stress): ${dassScore.stress.score}đ (${dassScore.stress.level.text})

Em mong muốn nhận được sự lắng nghe, hướng dẫn giải tỏa áp lực từ Thầy/Cô Tổ Tư Vấn Tâm Lý Học Đường THPT Cao Bá Quát.`;

    setContent(summary);
    setCategory('tam_ly_ban_be');
    setUrgency('Khẩn cấp');
    setActiveTab('aspiration');
    window.scrollTo({ top: 300, behavior: 'smooth' });
    alert("🌱 Đã chuyển kết quả DASS-21 vào hòm thư tâm tư. Em hãy nhấn 'Gửi Tới Ban Giám Hiệu' để nhận hỗ trợ bảo mật nhé!");
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '20px 16px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* NAVIGATION BACK LINK */}
      <div style={{ marginBottom: '16px' }}>
        <Link 
          to="/student-dashboard" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}
        >
          <ArrowLeft size={16} /> Quay về Không gian Học sinh
        </Link>
      </div>

      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #fb7185 100%)',
        color: '#ffffff',
        padding: '30px 28px',
        borderRadius: '24px',
        marginBottom: '20px',
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
                Hòm Thư Số BGH & Chăm Sóc Sức Khỏe Tinh Thần CBQ
              </span>
              <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '4px 0 0 0', letterSpacing: '-0.3px' }}>
                CỔNG TÂM TƯ, Ý KIẾN & THAM VẤN HỌC ĐƯỜNG
              </h1>
            </div>
          </div>
          <p style={{ margin: '10px 0 0 0', opacity: 0.95, fontSize: '14px', lineHeight: '1.6', maxWidth: '780px' }}>
            Lắng nghe tâm tư, cảm xúc, giải tỏa áp lực thi cử và tiếp nhận sáng kiến học đường từ học sinh toàn trường.
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('aspiration')}
          style={{
            flex: 1,
            padding: '13px 16px',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: activeTab === 'aspiration' ? '#be123c' : '#ffffff',
            color: activeTab === 'aspiration' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'aspiration' ? '0 4px 12px rgba(190, 18, 60, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
            border: activeTab === 'aspiration' ? 'none' : '1px solid #e2e8f0',
            transition: 'all 0.15s'
          }}
        >
          <Heart size={18} /> Hòm Thư Tâm Tư & Sáng Kiến BGH
        </button>
        <button
          onClick={() => setActiveTab('dass21')}
          style={{
            flex: 1,
            padding: '13px 16px',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: activeTab === 'dass21' ? '#7c3aed' : '#ffffff',
            color: activeTab === 'dass21' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'dass21' ? '0 4px 12px rgba(124, 58, 237, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
            border: activeTab === 'dass21' ? 'none' : '1px solid #e2e8f0',
            transition: 'all 0.15s'
          }}
        >
          <BrainCircuit size={18} /> Sàng Lọc Sức Khỏe Tinh Thần (DASS-21)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FORM GỬI TÂM TƯ NGUYỆN VỌNG BGH */}
      {/* ========================================================================= */}
      {activeTab === 'aspiration' && (
        <>
          {/* CAM KẾT BẢO MẬT & ĐẶC QUYỀN HỌC SINH */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '25px' }}>
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
                <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#1e40af' }}>BGH Trực Tiếp Tiếp Nhận</div>
                <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '2px' }}>Thầy Hiệu trưởng và Ban Giám Hiệu xử lý trong các kỳ giao ban tuần.</div>
              </div>
            </div>
          </div>

          {/* SUCCESS NOTICE */}
          {success && (
            <div style={{ backgroundColor: '#ecfdf5', border: '2px solid #34d399', borderRadius: '16px', padding: '24px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#10b981', color: '#ffffff', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#065f46', fontSize: '17px', fontWeight: '800' }}>
                  🎉 Đã gửi tâm tư tới Ban Giám Hiệu thành công!
                </h3>
                <p style={{ margin: 0, color: '#047857', fontSize: '13.5px', lineHeight: '1.5' }}>
                  Cảm ơn em đã tin tưởng sẻ chia. Ý kiến của em đã được chuyển vào chuyên mục quản trị bảo mật của BGH.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #f87171', color: '#991b1b', padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '13.5px' }}>
              {errorMsg}
            </div>
          )}

          {/* FORM SOẠN THẢO TÂM TƯ */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid #cbd5e1', padding: '28px', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', marginBottom: '30px' }}>
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
                      gap: '12px'
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
                      gap: '12px'
                    }}
                  >
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: !isAnonymous ? '6px solid #2563eb' : '2px solid #cbd5e1', boxSizing: 'border-box' }} />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: !isAnonymous ? '#1e40af' : '#334155' }}>
                        🙋 Gửi Kèm Thông Tin Cá Nhân
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Để BGH hoặc Thầy/Cô có thể liên hệ trực tiếp hỗ trợ em.
                      </div>
                    </div>
                  </div>
                </div>

                {!isAnonymous && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Họ và tên của em (*)</label>
                      <input type="text" placeholder="VD: Nguyễn Văn A" value={studentName} onChange={e => setStudentName(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Lớp (*)</label>
                      <input type="text" placeholder="VD: 12A01" value={className} onChange={e => setClassName(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Số điện thoại (tùy chọn)</label>
                      <input type="text" placeholder="VD: 0912345678" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* BƯỚC 2: CHỦ ĐỀ NGUYỆN VỌNG */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>
                  2. CHỦ ĐỀ NGUYỆN VỌNG:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {ASPIRATION_CATEGORIES.map(cat => {
                    const isSelected = category === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #be123c' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#fff1f2' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13.5px', color: isSelected ? '#9f1239' : '#1e293b' }}>
                          <span>{cat.icon}</span> {cat.label}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                          {cat.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BƯỚC 3: MỨC ĐỘ KHẨN CẤP */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                  3. MỨC ĐỘ KHẨN CẤP:
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['Bình thường', 'Khẩn cấp', 'Cực kỳ khẩn cấp'].map(level => {
                    const isSelected = urgency === level;
                    return (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setUrgency(level)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '700',
                          border: isSelected ? 'none' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? (level === 'Bình thường' ? '#0284c7' : '#dc2626') : '#ffffff',
                          color: isSelected ? '#ffffff' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {level === 'Khẩn cấp' && '⚠️ '}
                        {level === 'Cực kỳ khẩn cấp' && '🚨 '}
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BƯỚC 4: NỘI DUNG TÂM TƯ */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
                    4. NỘI DUNG CHIA SẺ, TÂM TƯ HOẶC SÁNG KIẾN:
                  </label>
                  <button
                    type="button"
                    onClick={handlePolish}
                    disabled={isPolishing}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={14} /> {isPolishing ? 'AI đang trau chuốt...' : '✨ Nhờ AI trau chuốt câu từ'}
                  </button>
                </div>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Em hãy viết những suy nghĩ, cảm xúc, khó khăn trong học tập hoặc đề xuất cải thiện nhà trường tại đây..."
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    borderRadius: '12px',
                    backgroundColor: '#be123c',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14.5px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(190, 18, 60, 0.3)'
                  }}
                >
                  {submitting ? <Loader2 size={18} className="cbq-spin" /> : <Send size={18} />}
                  <span>{submitting ? 'Đang chuyển tới BGH...' : '💌 Gửi Tới Ban Giám Hiệu'}</span>
                </button>
              </div>

            </form>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BÀI TRẮC NGHIỆM SÀNG LỌC TÂM LÝ DASS-21 */}
      {/* ========================================================================= */}
      {activeTab === 'dass21' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0', padding: '28px', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', marginBottom: '30px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#ede9fe', padding: '10px', borderRadius: '12px' }}>
              <BrainCircuit size={28} color="#7c3aed" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#5b21b6', margin: 0 }}>
                Thang Đo Sức Khỏe Tinh Thần DASS-21 (Chuẩn Y Khoa Quốc Tế)
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Đánh giá mức độ Trầm cảm (Depression), Lo âu (Anxiety) và Căng thẳng (Stress) trong tuần vừa qua.
              </p>
            </div>
          </div>

          {/* DASS-21 SCORE CARD (IF SUBMITTED) */}
          {dassSubmitted && (
            <div style={{ backgroundColor: '#faf5ff', border: '2px solid #d8b4fe', borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 'bold', color: '#6b21a8' }}>
                📊 KẾT QUẢ ĐÁNH GIÁ SỨC KHỎE TINH THẦN CỦA BẠN:
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>Trầm Cảm (Depression)</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: dassScore.depression.level.color, marginTop: '4px' }}>
                    {dassScore.depression.score}đ
                  </div>
                  <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', backgroundColor: dassScore.depression.level.bg, color: dassScore.depression.level.color }}>
                    {dassScore.depression.level.text}
                  </span>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>Lo Âu (Anxiety)</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: dassScore.anxiety.level.color, marginTop: '4px' }}>
                    {dassScore.anxiety.score}đ
                  </div>
                  <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', backgroundColor: dassScore.anxiety.level.bg, color: dassScore.anxiety.level.color }}>
                    {dassScore.anxiety.level.text}
                  </span>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>Căng Thẳng (Stress)</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: dassScore.stress.level.color, marginTop: '4px' }}>
                    {dassScore.stress.score}đ
                  </div>
                  <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', backgroundColor: dassScore.stress.level.bg, color: dassScore.stress.level.color }}>
                    {dassScore.stress.level.text}
                  </span>
                </div>
              </div>

              {/* ACTION RECOMMENDER */}
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                  🌱 Gợi ý phương pháp cân bằng tâm lý tức thời:
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                  <li><strong>Bài tập thở 4-7-8:</strong> Hít sâu bằng mũi 4 giây, giữ hơi 7 giây, thở chậm bằng miệng 8 giây (lặp lại 4 lần).</li>
                  <li><strong>Kỹ thuật neo chánh niệm 5-4-3-2-1:</strong> Tìm 5 vật em nhìn thấy, 4 thứ em chạm được, 3 âm thanh em nghe thấy, 2 mùi hương và 1 cảm nhận tốt đẹp.</li>
                  <li><strong>Giãn cơ và ngủ đủ giấc:</strong> Hạn chế màn hình điện thoại 30 phút trước khi ngủ để não bộ hồi phục.</li>
                </ul>
              </div>

              {/* SEND TO COUNSELOR BUTTON */}
              <button
                onClick={handleSendDassToCounselor}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                💌 Gửi Kết Quả Này Tới Tổ Tư Vấn Tâm Lý Trường Để Được Hỗ Trợ Ẩn Danh
              </button>
            </div>
          )}

          {/* QUESTIONS LIST */}
          <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '18px', fontStyle: 'italic' }}>
            Hãy đọc từng câu và chọn mức độ phù hợp nhất với trải nghiệm của em trong <strong>01 tuần vừa qua</strong>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {DASS21_QUESTIONS.map((q, idx) => {
              const currentVal = dassAnswers[q.id] ?? null;
              return (
                <div key={q.id} style={{ padding: '16px', borderRadius: '12px', backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                    Câu {q.id}: {q.text}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                    {DASS_OPTIONS.map(opt => {
                      const isChosen = currentVal === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => handleDassOptionChange(q.id, opt.val)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: isChosen ? 'bold' : 'normal',
                            border: isChosen ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                            backgroundColor: isChosen ? '#ede9fe' : '#ffffff',
                            color: isChosen ? '#5b21b6' : '#334155',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <button
              onClick={() => {
                if (Object.keys(dassAnswers).length < 21) {
                  if (!window.confirm(`Em mới trả lời ${Object.keys(dassAnswers).length}/21 câu. Em có muốn xem điểm ước tính với các câu đã trả lời không?`)) return;
                }
                setDassSubmitted(true);
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 32px',
                borderRadius: '12px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
              }}
            >
              <Activity size={18} /> Hoàn Tất & Xem Kết Quả Sàng Lọc
            </button>
          </div>

        </div>
      )}

      {/* THÔNG ĐIỆP TỪ BAN GIÁM HIỆU */}
      <div style={{ backgroundColor: '#fffbeb', borderRadius: '16px', border: '1.5px solid #fde047', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
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
