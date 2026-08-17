import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Send, Calendar, Phone, CheckCircle2, AlertCircle, Building2, User, FileCheck, Sparkles } from 'lucide-react';

const ORGANIZATIONS = [
  'BCH Đảng ủy trường THPT Cao Bá Quát',
  'Ban Thường vụ Đoàn trường THPT Cao Bá Quát',
  'Tổ Ngữ văn',
  'Tổ Toán',
  'Tổ Tin học',
  'Tổ Vật lí',
  'Tổ Hóa học',
  'Tổ Sinh học',
  'Tổ Sử - Địa - GDKTPL',
  'Tổ Ngoại ngữ',
  'Tổ GDTC - QPAN',
  'Tổ Văn phòng',
  'Đơn vị khác'
];

export default function PublicScholarshipFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [organizationUnit, setOrganizationUnit] = useState(ORGANIZATIONS[0]);
  const [representativeName, setRepresentativeName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [attachedFileUrl, setAttachedFileUrl] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_scholarship_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err) {
      console.warn("Fallback LocalStorage:", err);
      const local = JSON.parse(localStorage.getItem('cbq_local_scholarship_feedbacks') || '[]');
      setFeedbacks(local);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!representativeName.trim() || !phone.trim() || !feedbackContent.trim()) {
      alert("Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const newFeedback = {
      organization_unit: organizationUnit,
      representative_name: representativeName.trim(),
      phone: phone.trim(),
      email: email.trim() || '',
      feedback_content: feedbackContent.trim(),
      attached_file_url: attachedFileUrl.trim() || '',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('cbq_scholarship_feedback')
        .insert([newFeedback])
        .select();

      if (error) {
        console.warn("Supabase insert fallback sang LocalStorage:", error);
        const local = JSON.parse(localStorage.getItem('cbq_local_scholarship_feedbacks') || '[]');
        const updatedLocal = [newFeedback, ...local];
        localStorage.setItem('cbq_local_scholarship_feedbacks', JSON.stringify(updatedLocal));
        setFeedbacks(updatedLocal);
      } else if (data) {
        setFeedbacks(prev => [data[0], ...prev]);
      }

      setSuccessMsg(`🎉 GỬI Ý KIẾN GÓP Ý THÀNH CÔNG!\nVăn phòng nhà trường đã tiếp nhận ý kiến đóng góp của ${organizationUnit} (Người đại diện: ${representativeName}). Ý kiến sẽ được tổng hợp gửi Hiệu trưởng trình Sở GD&ĐT phê duyệt.`);
      
      // Reset form
      setRepresentativeName('');
      setPhone('');
      setEmail('');
      setFeedbackContent('');
      setAttachedFileUrl('');

    } catch (err) {
      console.error("Lỗi gửi góp ý:", err);
      alert("Không thể gửi góp ý. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 15px' }}>
      
      {/* HEADER BANNER CÔNG VĂN GÓP Ý */}
      <div style={{
        background: 'linear-gradient(135deg, #166534 0%, #14532d 50%, #064e3b 100%)',
        borderRadius: '20px',
        padding: '30px 22px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(22, 101, 52, 0.25)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={16} color="#fde047" /> KỶ NIỆM 30 NĂM THÀNH LẬP THPT CAO BÁ QUÁT (1996 - 2026)
        </div>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 8px rgba(0,0,0,0.5)', lineHeight: '1.4' }}>
          📜 CÔNG VĂN LẤY Ý KIẾN GÓP Ý DỰ THẢO ĐỀ ÁN THÀNH LẬP QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ TUỔI HỌC TRÒ"
        </h1>
        <p style={{ margin: '0 auto 15px auto', maxWidth: '850px', fontSize: '14.5px', color: '#dcfce7', lineHeight: '1.6' }}>
          Căn cứ Công văn 409/SGDĐT-VP ngày 11/02/2026 của Sở GD&ĐT & Kế hoạch 53/KH-TrTHPTCBQ ngày 12/3/2026 về việc lấy ý kiến đóng góp dự thảo trình Sở GD&ĐT phê duyệt.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(6px)', padding: '14px 18px', borderRadius: '14px', textAlign: 'left', border: '1px solid rgba(253,224,71,0.4)', fontSize: '13.5px' }}>
          <div><Calendar size={16} color="#fde047" style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Thời hạn gửi góp ý:</strong> <span style={{ color: '#fde047', fontWeight: 'bold' }}>Trước ngày 19/8/2026</span></div>
          <div><Phone size={16} color="#fde047" style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Cán bộ phụ trách Văn phòng:</strong> Đ/c <strong>Nghiêm Xuân Bảo</strong></div>
        </div>
      </div>

      {/* TẬP BẢN SAO VĂN BẢN CHÍNH THỨC */}
      <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '22px', marginBottom: '25px', color: '#1e293b', lineHeight: '1.7', fontSize: '14px' }}>
        <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="#166534" /> NỘI DUNG CÔNG VĂN TRÍCH YẾU CỦA HIỆU TRƯỞNG
        </div>
        
        <p style={{ margin: '0 0 10px 0' }}>
          Căn cứ chủ trương thống nhất của Sở Giáo dục và Đào tạo tại <strong>Công văn số 409/SGDĐT-VP ngày 11/02/2026</strong> về việc cho phép trường THPT Cao Bá Quát tổ chức Lễ Kỷ niệm 30 năm thành lập trường (1996-2026); căn cứ Nghị quyết tháng 3 năm 2026 của Đảng ủy trường THPT Cao Bá Quát và <strong>Kế hoạch số 53/KH-TrTHPTCBQ ngày 12/3/2026</strong> về việc tổ chức Kỷ niệm 30 năm thành lập trường THPT Cao Bá Quát (1996-2026);
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          Căn cứ tình hình thực tế và khả năng vận động, ủng hộ quyên góp thành lập <strong>Quỹ học bổng “Chắp cánh ước mơ tuổi học trò”</strong> của Trường THPT Cao Bá Quát; nhằm đảm bảo thực hiện đúng các quy định của pháp luật và của ngành Giáo dục về công tác khuyến học, khuyến tài, xây dựng xã hội học tập, trường THPT Cao Bá Quát đã xây dựng dự thảo Đề án Thành lập Quỹ học bổng “Chắp cánh ước mơ tuổi học trò” của Trường THPT Cao Bá Quát (có dự thảo kèm theo).
        </p>
        <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #166534', margin: '14px 0' }}>
          <strong style={{ color: '#166534' }}>Để kịp thời trình Sở Giáo dục và Đào tạo phê duyệt Đề án, Hiệu trưởng đề nghị:</strong>
          <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
            <li><strong>1. BCH Đảng ủy & BTV Đoàn trường:</strong> Cho ý kiến góp ý dự thảo bằng văn bản có dấu đỏ gửi về Văn phòng nhà trường để tổng hợp.</li>
            <li><strong>2. Các Tổ chuyên môn & Tổ Văn phòng:</strong> Triển khai đến các thành viên trong tổ cho ý kiến góp ý trực tiếp qua đường link hệ thống này và gửi văn bản có chữ ký Tổ trưởng về Văn phòng trước ngày <strong>19/8/2026</strong>.</li>
          </ol>
        </div>
      </div>

      {/* MAIN FORM & SUBMITTED ENTRIES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '25px', alignItems: 'start' }}>
        
        {/* FORM ĐÓNG GÓP Ý KIẾN TRỰC TUYẾN */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontWeight: 'bold', fontSize: '17px', marginBottom: '16px', borderBottom: '1.5px solid #dcfce7', paddingBottom: '10px' }}>
            <Send size={22} color="#166534" /> FORM GỬI Ý KIẾN GÓP Ý DỰ THẢO (*)
          </div>

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '14px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '18px', whiteSpace: 'pre-line' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Đơn vị góp ý */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Tổ Chuyên Môn / Đơn Vị Góp Ý *</label>
              <select
                value={organizationUnit}
                onChange={e => setOrganizationUnit(e.target.value)}
                style={styles.select}
              >
                {ORGANIZATIONS.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>

            {/* Họ và Tên */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Họ và Tên Người Đại Diện / Tổ Trưởng *</label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn A - Tổ trưởng Tổ Toán"
                value={representativeName}
                onChange={e => setRepresentativeName(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Số Điện Thoại */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Số Điện Thoại Liên Hệ *</label>
              <input
                type="tel"
                required
                placeholder="VD: 0912 345 678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Email Liên Hệ (Nếu có)</label>
              <input
                type="email"
                placeholder="VD: totruongtoan@caobaquat.edu.vn"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Nội dung Góp ý */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Nội Dung Góp Ý Chi Tiết Cho Dự Thảo Đề Án *</label>
              <textarea
                rows={5}
                required
                placeholder="VD: Nhất trí cao với các nội dung dự thảo. Góp ý bổ sung quy định về đối tượng ưu tiên nhận học bổng chắp cánh ước mơ..."
                value={feedbackContent}
                onChange={e => setFeedbackContent(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            {/* File đính kèm / Link văn bản có dấu đỏ */}
            <div style={{ marginBottom: '18px' }}>
              <label style={styles.label}>Link Tệp Văn Bản Có Chữ Ký / Dấu Đỏ (Google Drive/Dropbox)</label>
              <input
                type="url"
                placeholder="VD: https://drive.google.com/file/d/..."
                value={attachedFileUrl}
                onChange={e => setAttachedFileUrl(e.target.value)}
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={styles.submitBtn}
            >
              {submitting ? 'Đang gửi góp ý...' : '🚀 XÁC NHẬN GỬI Ý KIẾN GÓP Ý'}
            </button>
          </form>
        </div>

        {/* TỔNG HỢP CÁC Ý KIẾN ĐÃ GỬI CÔNG KHAI */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '16.5px', marginBottom: '16px', borderBottom: '1.5px solid #dcfce7', paddingBottom: '10px' }}>
            <FileCheck size={20} color="#166534" /> TỔNG HỢP ĐƠN VỊ ĐÃ GỬI GÓP Ý ({feedbacks.length})
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải danh sách góp ý...</div>
          ) : feedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 15px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
              Chưa có đơn vị nào gửi ý kiến trực tuyến.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {feedbacks.map((fb, idx) => (
                <div key={fb.id || idx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: '#166534', fontSize: '13.5px' }}>{fb.organization_unit}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(fb.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    Đại diện: {fb.representative_name} ({fb.phone})
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: '6px 0 0 0', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    "{fb.feedback_content}"
                  </p>
                  {fb.attached_file_url && (
                    <div style={{ marginTop: '6px', fontSize: '12px' }}>
                      📎 <a href={fb.attached_file_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 'bold' }}>Xem Tệp Đính Kèm</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '5px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '14px',
    background: '#ffffff',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '15.5px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(22, 101, 52, 0.3)',
    transition: 'all 0.2s ease'
  }
};
