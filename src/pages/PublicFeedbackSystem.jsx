import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Send, Calendar, Phone, CheckCircle2, AlertCircle, Building2, Clock, Sparkles, FileCheck, Layers, Link as LinkIcon } from 'lucide-react';

const DEFAULT_ORGANIZATIONS = [
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

const SEED_TOPIC = {
  id: 'default-topic-1',
  title: 'Dự thảo Đề án Thành lập Quỹ Học bổng "Chắp cánh ước mơ tuổi học trò" Trường THPT Cao Bá Quát',
  dispatch_number: 'Công văn số 409/SGDĐT-VP & Kế hoạch 53/KH-TrTHPTCBQ',
  description: 'Căn cứ Công văn 409/SGDĐT-VP ngày 11/02/2026 của Sở GD&ĐT và Kế hoạch 53/KH-TrTHPTCBQ ngày 12/3/2026. Đề nghị BCH Đảng ủy, BTV Đoàn trường, các Tổ chuyên môn & Tổ Văn phòng gửi góp ý về dự thảo Đề án Quỹ học bổng.',
  deadline: '2026-08-19T23:59:59+07:00',
  contact_info: 'Đồng chí Nghiêm Xuân Bảo – Nhân viên Tổ Văn phòng',
  is_active: true
};

export default function PublicFeedbackSystem() {
  const [searchParams, setSearchParams] = useSearchParams();
  const topicIdFromUrl = searchParams.get('topicId');

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [organizationUnit, setOrganizationUnit] = useState(DEFAULT_ORGANIZATIONS[0]);
  const [representativeName, setRepresentativeName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [attachedFileUrl, setAttachedFileUrl] = useState('');

  useEffect(() => {
    fetchTopicsAndResponses();
  }, [topicIdFromUrl]);

  const fetchTopicsAndResponses = async () => {
    setLoading(true);
    try {
      // 1. Fetch Topics
      const { data: topicData, error: topicErr } = await supabase
        .from('cbq_feedback_topics')
        .select('*')
        .order('created_at', { ascending: false });

      let activeTopics = topicData || [];
      if (topicErr || activeTopics.length === 0) {
        console.warn("Dùng fallback LocalStorage cho Chủ đề công việc");
        const localTopics = JSON.parse(localStorage.getItem('cbq_local_feedback_topics') || '[]');
        if (localTopics.length === 0) {
          activeTopics = [SEED_TOPIC];
          localStorage.setItem('cbq_local_feedback_topics', JSON.stringify([SEED_TOPIC]));
        } else {
          activeTopics = localTopics;
        }
      }

      setTopics(activeTopics);

      // Select Topic
      const currentTopic = activeTopics.find(t => t.id === topicIdFromUrl) || activeTopics[0];
      setSelectedTopic(currentTopic);

      // 2. Fetch Responses for selected topic
      if (currentTopic) {
        fetchResponses(currentTopic.id);
      }

    } catch (err) {
      console.warn("Lỗi tải chủ đề:", err);
      setTopics([SEED_TOPIC]);
      setSelectedTopic(SEED_TOPIC);
      fetchResponses(SEED_TOPIC.id);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (topicId) => {
    try {
      const { data, error } = await supabase
        .from('cbq_feedback_responses')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.warn("Fallback LocalStorage cho Phản hồi:", err);
      const local = JSON.parse(localStorage.getItem(`cbq_local_feedback_res_${topicId}`) || '[]');
      setResponses(local);
    }
  };

  const handleTopicChange = (newTopicId) => {
    setSearchParams({ topicId: newTopicId });
    const target = topics.find(t => t.id === newTopicId);
    if (target) {
      setSelectedTopic(target);
      fetchResponses(target.id);
      setSuccessMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return;
    if (!representativeName.trim() || !phone.trim() || !feedbackContent.trim()) {
      alert("Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const newResponse = {
      topic_id: selectedTopic.id,
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
        .from('cbq_feedback_responses')
        .insert([newResponse])
        .select();

      if (error) {
        console.warn("Supabase insert fallback sang LocalStorage:", error);
        const localKey = `cbq_local_feedback_res_${selectedTopic.id}`;
        const local = JSON.parse(localStorage.getItem(localKey) || '[]');
        const updatedLocal = [newResponse, ...local];
        localStorage.setItem(localKey, JSON.stringify(updatedLocal));
        setResponses(updatedLocal);
      } else if (data) {
        setResponses(prev => [data[0], ...prev]);
      }

      setSuccessMsg(`🎉 GỬI Ý KIẾN GÓP Ý THÀNH CÔNG!\nHệ thống đã ghi nhận ý kiến của ${organizationUnit} (Đại diện: ${representativeName}) cho nội dung "${selectedTopic.title}".`);
      
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Đang tải hệ thống góp ý công việc...</div>;
  }

  const isDeadlinePassed = selectedTopic ? new Date(selectedTopic.deadline) < new Date() : false;

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '20px 15px' }}>
      
      {/* HEADER BANNER CHÍNH THỨC */}
      <div style={{
        background: 'linear-gradient(135deg, #166534 0%, #14532d 50%, #064e3b 100%)',
        borderRadius: '20px',
        padding: '28px 22px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(22, 101, 52, 0.25)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={16} color="#fde047" /> HỆ THỐNG THU THẬP & TỔNG HỢP Ý KIẾN GÓP Ý CÔNG VIỆC
        </div>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 8px rgba(0,0,0,0.5)', lineHeight: '1.4' }}>
          ✍️ CỔNG ĐÓNG GÓP Ý KIẾN CHỦ ĐỀ CÔNG VIỆC & ĐỀ ÁN TRƯỜNG THPT CAO BÁ QUÁT
        </h1>
        <p style={{ margin: '0 auto', maxWidth: '850px', fontSize: '14px', color: '#dcfce7', lineHeight: '1.6' }}>
          Gửi đóng góp ý kiến từ BCH Đảng ủy, BTV Đoàn trường, các Tổ chuyên môn & Tổ Văn phòng cho các văn bản, kế hoạch, đề án của Nhà trường.
        </p>
      </div>

      {/* COMPONENT 1: CHỌN CÔNG VIỆC / CHỦ ĐỀ CẦN GÓP Ý */}
      <div style={{ background: '#ffffff', padding: '18px 22px', borderRadius: '16px', border: '1.5px solid #cbd5e1', marginBottom: '22px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={18} color="#166534" /> CHỌN CÔNG VIỆC / VĂN BẢN CẦN GÓP Ý ({topics.length} ĐỀ ÁN VÀNG HỆ THỐNG):
        </div>
        <select
          value={selectedTopic?.id || ''}
          onChange={e => handleTopicChange(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #166534', fontSize: '14.5px', fontWeight: 'bold', color: '#14532d', background: '#f0fdf4' }}
        >
          {topics.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} {t.dispatch_number ? `(${t.dispatch_number})` : ''} {!t.is_active ? ' [ĐÃ ĐÓNG]' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* COMPONENT 2: CHI TIẾT CÔNG VIỆC ĐƯỢC CHỌN */}
      {selectedTopic && (
        <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '22px', marginBottom: '25px', color: '#1e293b', lineHeight: '1.7', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '14px' }}>
            <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#166534" /> {selectedTopic.title}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isDeadlinePassed ? (
                <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  🚫 Hạn chót đã qua ({new Date(selectedTopic.deadline).toLocaleDateString('vi-VN')})
                </span>
              ) : (
                <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  ⏳ Đang mở nhận góp ý (Đến {new Date(selectedTopic.deadline).toLocaleDateString('vi-VN')})
                </span>
              )}
            </div>
          </div>

          {selectedTopic.dispatch_number && (
            <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: 'bold', marginBottom: '8px' }}>
              📌 Căn cứ / Số hiệu văn bản: {selectedTopic.dispatch_number}
            </div>
          )}

          <p style={{ margin: '0 0 12px 0', color: '#334155' }}>
            {selectedTopic.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#ffffff', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid #166534', fontSize: '13px' }}>
            <div><Phone size={15} color="#166534" style={{ verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Cán bộ / Đơn vị phụ trách:</strong> {selectedTopic.contact_info || 'Văn phòng nhà trường'}</div>
            {selectedTopic.attached_doc_url && (
              <a href={selectedTopic.attached_doc_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LinkIcon size={14} /> Xem File Văn Bản / Dự Thảo Kèm Theo
              </a>
            )}
          </div>
        </div>
      )}

      {/* COMPONENT 3: MAIN FORM & SUBMITTED RESPONSES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '25px', alignItems: 'start' }}>
        
        {/* FORM ĐÓNG GÓP Ý KIẾN */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontWeight: 'bold', fontSize: '17px', marginBottom: '16px', borderBottom: '1.5px solid #dcfce7', paddingBottom: '10px' }}>
            <Send size={22} color="#166534" /> FORM ĐÓNG GÓP Ý KIẾN CHO CÔNG VIỆC (*)
          </div>

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '14px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '18px', whiteSpace: 'pre-line' }}>
              {successMsg}
            </div>
          )}

          {isDeadlinePassed ? (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '16px', borderRadius: '12px', textAlign: 'center', fontSize: '14px' }}>
              ⛔ <strong>CÔNG VIỆC ĐÃ HẾT THỜI HẠN NHẬN GÓP Ý.</strong><br />
              Cảm ơn các đơn vị đã quan tâm đóng góp ý kiến.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Đơn vị góp ý */}
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Tổ Chuyên Môn / Đơn Vị Góp Ý *</label>
                <select
                  value={organizationUnit}
                  onChange={e => setOrganizationUnit(e.target.value)}
                  style={styles.select}
                >
                  {DEFAULT_ORGANIZATIONS.map(org => (
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
                  placeholder="VD: Nguyễn Văn A - Tổ trưởng"
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
                  placeholder="VD: totruong@caobaquat.edu.vn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>

              {/* Nội dung Góp ý */}
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Nội Dung Góp Ý Chi Tiết Cho Công Việc *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="VD: Nhất trí cao với các nội dung dự thảo. Đề nghị bổ sung thêm..."
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
          )}
        </div>

        {/* TỔNG HỢP CÁC Ý KIẾN ĐÃ GỬI CỦA CÔNG VIỆC NÀY */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '16.5px', marginBottom: '16px', borderBottom: '1.5px solid #dcfce7', paddingBottom: '10px' }}>
            <FileCheck size={20} color="#166534" /> TỔNG HỢP CÁC ĐƠN VỊ ĐÃ GÓP Ý ({responses.length})
          </div>

          {responses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 15px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
              Chưa có đơn vị nào gửi ý kiến trực tuyến cho công việc này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {responses.map((fb, idx) => (
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
