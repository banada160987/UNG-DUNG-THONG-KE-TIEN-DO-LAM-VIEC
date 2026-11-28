// =========================================================================
// TRANG CÔNG KHAI: MẠNG LƯỚI CỐ VẤN ĐỒNG HÀNH 1-1 (MENTORSHIP NETWORK)
// QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ" - TRƯỜNG THPT CAO BÁ QUÁT
// Kết nối Cựu học sinh thành đạt, Sinh viên ưu tú & Thầy cô giáo với học sinh nghèo hiếu học
// =========================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, Heart, Users, Award, BookOpen, CheckCircle2, 
  Sparkles, Star, Home, ChevronRight, Send, ArrowRight, 
  HelpCircle, ShieldCheck, Mail, Phone, Building, Briefcase
} from 'lucide-react';
import { 
  fetchScholarshipMentors, 
  registerScholarshipMentor 
} from '../services/scholarshipFundService';

const EXPERTISE_TAGS = [
  'Ôn thi ĐH Khối A00 (Toán-Lý-Hóa)',
  'Ôn thi ĐH Khối A01 (Toán-Lý-Anh)',
  'Ôn thi ĐH Khối B00 (Toán-Hóa-Sinh)',
  'Ôn thi ĐH Khối D01 (Toán-Văn-Anh)',
  'Ôn thi Đánh giá Năng lực (ĐHQG / ĐHBK)',
  'Định hướng ngành Công nghệ thông tin / AI',
  'Định hướng ngành Kinh tế / Tài chính / Ngoại thương',
  'Định hướng ngành Y Dược / Sư phạm',
  'Tư vấn Tâm lý & Kỹ năng sống'
];

export default function PublicMentorshipNetwork() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form đăng ký Cố vấn
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    mentor_type: 'alumni', // 'alumni' | 'teacher' | 'university_student' | 'expert'
    alumni_class_year: '',
    current_organization: '',
    selectedExpertise: ['Ôn thi ĐH Khối A00 (Toán-Lý-Hóa)', 'Định hướng ngành Công nghệ thông tin / AI'],
    bio: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMentors();
  }, []);

  async function loadMentors() {
    setLoading(true);
    try {
      const data = await fetchScholarshipMentors('active');
      setMentors(data || []);
    } catch (e) {
      console.warn("Lỗi nạp danh sách Cố vấn:", e);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpertise = (tag) => {
    const list = [...formData.selectedExpertise];
    const idx = list.indexOf(tag);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(tag);
    }
    setFormData({ ...formData, selectedExpertise: list });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) {
      alert("Vui lòng điền Họ tên và Số điện thoại liên hệ!");
      return;
    }

    setSubmitting(true);
    try {
      await registerScholarshipMentor({
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        mentor_type: formData.mentor_type,
        alumni_class_year: formData.alumni_class_year,
        current_organization: formData.current_organization,
        expertise_areas: formData.selectedExpertise,
        bio: formData.bio
      });

      alert(`Đăng ký Cố vấn thành công! Trân trọng cảm ơn ${formData.full_name} đã sẵn sàng tiếp lửa và đồng hành cùng các em học sinh có hoàn cảnh khó khăn của trường.`);
      setShowRegisterModal(false);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        mentor_type: 'alumni',
        alumni_class_year: '',
        current_organization: '',
        selectedExpertise: ['Ôn thi ĐH Khối A00 (Toán-Lý-Hóa)', 'Định hướng ngành Công nghệ thông tin / AI'],
        bio: ''
      });
      loadMentors();
    } catch (err) {
      alert("Lỗi đăng ký Cố vấn: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.pageWrap}>
      {/* BREADCRUMB */}
      <div style={styles.breadcrumbBar}>
        <div style={styles.container}>
          <div style={styles.breadcrumb}>
            <Link to="/" style={styles.breadLink}><Home size={14} /> Trang chủ</Link>
            <ChevronRight size={14} color="#94a3b8" />
            <Link to="/chap-canh-uoc-mo" style={styles.breadLink}>🕊️ Quỹ "Chắp Cánh Ước Mơ"</Link>
            <ChevronRight size={14} color="#94a3b8" />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Mạng Lưới Cố Vấn Mentorship</span>
          </div>
        </div>
      </div>

      {/* HERO BANNER */}
      <div style={styles.heroBanner}>
        <div style={styles.container}>
          <div style={styles.badgeTop}>
            <Sparkles size={16} color="#fbbf24" />
            <span>ĐỒNG HÀNH TOÀN DIỆN • TIẾP LỬA ƯỚC MƠ</span>
          </div>
          <h1 style={styles.heroTitle}>MẠNG LƯỚI CỐ VẤN ĐỒNG HÀNH 1-1 (MENTORSHIP)</h1>
          <p style={styles.heroSubtitle}>
            Nơi kết nối các Anh/Chị Cựu học sinh thành đạt, các Thủ khoa/Á khoa Đại học và Thầy Cô giáo giàu kinh nghiệm 
            nhằm cố vấn phương pháp học tập, định hướng chọn ngành thi Đại học và tiếp thêm nghị lực vươn lên cho các em học sinh có hoàn cảnh khó khăn.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowRegisterModal(true)} style={styles.primaryBtn}>
              <Heart size={16} fill="#ffffff" /> Đăng Ký Trở Thành Cố Vấn
            </button>
            <a href="#danh-sach-co-van" style={styles.secondaryBtn}>
              <Compass size={16} /> Xem Đội Ngũ Cố Vấn
            </a>
          </div>
        </div>
      </div>

      {/* GIỚI THIỆU TÔN CHỈ MENTORSHIP */}
      <div style={styles.container}>
        <div style={styles.pillarsGrid}>
          <div style={styles.pillarCard}>
            <div style={{ ...styles.pillarIcon, background: '#eff6ff' }}>
              <BookOpen size={24} color="#2563eb" />
            </div>
            <h3 style={styles.pillarTitle}>Cố Vấn Phương Pháp Học Tập</h3>
            <p style={styles.pillarDesc}>
              Chia sẻ bí quyết tự học, phương pháp giải toán trắc nghiệm nhanh, tài liệu luyện thi ĐGNL/ĐGTD và kỹ năng học tiếng Anh đạt điểm cao.
            </p>
          </div>

          <div style={styles.pillarCard}>
            <div style={{ ...styles.pillarIcon, background: '#ecfdf5' }}>
              <Briefcase size={24} color="#059669" />
            </div>
            <h3 style={styles.pillarTitle}>Định Hướng Ngành Nghề & Đại Học</h3>
            <p style={styles.pillarDesc}>
              Tư vấn thực tế về các ngành nghề (Công nghệ thông tin, Bác sĩ, Kinh tế, Ngoại ngữ...), giải đáp thắc mắc về cơ hội việc làm và học bổng ĐH.
            </p>
          </div>

          <div style={styles.pillarCard}>
            <div style={{ ...styles.pillarIcon, background: '#fef3c7' }}>
              <Heart size={24} color="#d97706" />
            </div>
            <h3 style={styles.pillarTitle}>Chỗ Dựa Tinh Thần Ấm Áp</h3>
            <p style={styles.pillarDesc}>
              Lắng nghe những khó khăn, bế tắc của các em học sinh có hoàn cảnh gia đình éo le để kịp thời động viên, tiếp thêm niềm tin và nghị lực.
            </p>
          </div>
        </div>

        {/* DANH SÁCH ĐỘI NGŨ CỐ VẤN */}
        <div id="danh-sach-co-van" style={{ margin: '50px 0 70px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              Đội Ngũ Cố Vấn Đồng Hành Đang Hoạt Động
            </h2>
            <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
              Các Thầy Cô và Cựu học sinh tình nguyện dành thời gian quý báu đồng hành 1-1 cùng học trò nghèo THPT Cao Bá Quát.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang nạp danh sách Cố vấn...</div>
          ) : mentors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              Chưa có Cố vấn nào. Hãy là người đầu tiên đăng ký tham gia mạng lưới!
            </div>
          ) : (
            <div style={styles.mentorsGrid}>
              {mentors.map(m => (
                <div key={m.id} style={styles.mentorCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={styles.mentorAvatar}>
                      {m.mentor_type === 'teacher' ? '👨‍🏫' : '🎓'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: 700 }}>
                        {m.full_name}
                      </h4>
                      <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: 600 }}>
                        {m.alumni_class_year || (m.mentor_type === 'teacher' ? 'Giáo viên nhà trường' : 'Cựu học sinh CBQ')}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '3px' }}>Công tác / Học tập:</div>
                    <div>{m.current_organization || 'Cựu học sinh THPT Cao Bá Quát'}</div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Lĩnh vực hỗ trợ:</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {Array.isArray(m.expertise_areas) && m.expertise_areas.map((exp, ei) => (
                        <span key={ei} style={styles.expPill}>
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', fontStyle: 'italic', lineHeight: 1.5, marginTop: 'auto' }}>
                    "{m.bio || 'Sẵn sàng tiếp sức và chia sẻ kinh nghiệm cùng đàn em vươn lên trong cuộc sống.'}"
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#059669', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Đang hỗ trợ {m.assigned_students_count || 1} học sinh
                    </span>
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>Mentorship 1-1</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL ĐĂNG KÝ CỐ VẤN ===================== */}
      {showRegisterModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Heart size={20} color="#e11d48" />
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  Đăng Ký Tham Gia Mạng Lưới Cố Vấn Đồng Hành
                </h3>
              </div>
              <button onClick={() => setShowRegisterModal(false)} style={styles.closeBtn}>×</button>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={styles.row2}>
                <div>
                  <label style={styles.label}>Họ và tên của Quý vị (*)</label>
                  <input 
                    required
                    type="text"
                    placeholder="VD: Nguyễn Đăng Quang"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Số điện thoại liên hệ (*)</label>
                  <input 
                    required
                    type="tel"
                    placeholder="VD: 0988.123.456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.row2}>
                <div>
                  <label style={styles.label}>Địa chỉ Email</label>
                  <input 
                    type="email"
                    placeholder="VD: quang@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Tư cách tham gia</label>
                  <select 
                    value={formData.mentor_type}
                    onChange={(e) => setFormData({ ...formData, mentor_type: e.target.value })}
                    style={styles.select}
                  >
                    <option value="alumni">Cựu học sinh THPT Cao Bá Quát</option>
                    <option value="university_student">Sinh viên Đại học ưu tú</option>
                    <option value="teacher">Giáo viên nhà trường / Tình nguyện</option>
                    <option value="expert">Chuyên gia / Doanh nhân</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.label}>Khóa học / Niên khóa tại trường (Nếu là Cựu HS)</label>
                <input 
                  type="text"
                  placeholder="VD: Cựu học sinh Khóa 2017-2020 (Lớp 12A01)"
                  value={formData.alumni_class_year}
                  onChange={(e) => setFormData({ ...formData, alumni_class_year: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Đơn vị công tác / Học tập hiện nay</label>
                <input 
                  type="text"
                  placeholder="VD: Sinh viên năm 4 ĐH Bách Khoa Hà Nội / Kỹ sư phần mềm Viettel"
                  value={formData.current_organization}
                  onChange={(e) => setFormData({ ...formData, current_organization: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Lĩnh vực Quý vị có thể cố vấn, hỗ trợ học trò:</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {EXPERTISE_TAGS.map(tag => {
                    const active = formData.selectedExpertise.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleExpertise(tag)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          border: active ? '1px solid #059669' : '1px solid #cbd5e1',
                          background: active ? '#ecfdf5' : '#ffffff',
                          color: active ? '#047857' : '#475569',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {active ? '✓ ' : '+ '}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={styles.label}>Thông điệp gửi tới các em học sinh có hoàn cảnh khó khăn</label>
                <textarea 
                  rows={3}
                  placeholder="Lời nhắn nhủ, kinh nghiệm vượt khó hoặc thời gian Quý vị có thể dành cho các em..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  style={styles.textarea}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowRegisterModal(false)} style={styles.cancelBtn}>
                  Hủy
                </button>
                <button type="submit" disabled={submitting} style={styles.submitBtn}>
                  <Heart size={16} fill="#ffffff" />
                  <span>{submitting ? 'Đang gửi...' : 'Gửi Đăng Ký Cố Vấn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  breadcrumbBar: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '12px 0'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748b'
  },
  breadLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0d9488 100%)',
    color: '#ffffff',
    padding: '52px 0 58px 0',
    textAlign: 'center'
  },
  badgeTop: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    marginBottom: '16px'
  },
  heroTitle: {
    margin: '0 0 12px 0',
    fontSize: '28px',
    fontWeight: 900,
    letterSpacing: '-0.5px'
  },
  heroSubtitle: {
    margin: '0 auto 28px auto',
    maxWidth: '780px',
    fontSize: '15px',
    color: '#e2e8f0',
    lineHeight: 1.6
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14.5px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    fontSize: '14.5px',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer'
  },
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    marginTop: '-30px',
    marginBottom: '40px'
  },
  pillarCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
  },
  pillarIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  pillarTitle: {
    margin: '0 0 8px 0',
    fontSize: '17px',
    fontWeight: 700,
    color: '#0f172a'
  },
  pillarDesc: {
    margin: 0,
    fontSize: '13.5px',
    color: '#64748b',
    lineHeight: 1.6
  },
  mentorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px'
  },
  mentorCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
  },
  mentorAvatar: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px'
  },
  expPill: {
    fontSize: '11.5px',
    background: '#ecfdf5',
    color: '#047857',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600,
    border: '1px solid #a7f3d0'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalContent: {
    background: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '22px',
    color: '#64748b',
    cursor: 'pointer'
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  cancelBtn: {
    padding: '10px 18px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
