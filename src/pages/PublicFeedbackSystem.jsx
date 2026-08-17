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

const SEED_TOPIC_ID = 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';

const SEED_TOPIC = {
  id: SEED_TOPIC_ID,
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
      let combined = [];

      // 1. Fetch from cbq_feedback_responses
      const validTopicId = (topicId && topicId.length === 36 && topicId.includes('-')) ? topicId : SEED_TOPIC_ID;
      const { data: respData } = await supabase
        .from('cbq_feedback_responses')
        .select('*')
        .eq('topic_id', validTopicId)
        .order('created_at', { ascending: false });

      if (respData && respData.length > 0) {
        combined = [...respData];
      }

      // 2. Fetch from legacy cbq_scholarship_feedback
      if (topicId === SEED_TOPIC_ID || topicId === 'default-topic-1' || combined.length === 0) {
        const { data: legacyData } = await supabase
          .from('cbq_scholarship_feedback')
          .select('*')
          .order('created_at', { ascending: false });

        if (legacyData && legacyData.length > 0) {
          const existingIds = new Set(combined.map(c => c.id));
          legacyData.forEach(item => {
            if (!existingIds.has(item.id)) {
              combined.push(item);
            }
          });
        }
      }

      // 3. LocalStorage fallback merge
      const localKey = `cbq_local_feedback_res_${topicId}`;
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const legacyLocal = JSON.parse(localStorage.getItem('cbq_local_scholarship_feedbacks') || '[]');
      const allLocal = [...local, ...legacyLocal];

      const existingIds = new Set(combined.map(c => c.id || (c.organization_unit + c.created_at)));
      allLocal.forEach(item => {
        const itemKey = item.id || (item.organization_unit + item.created_at);
        if (!existingIds.has(itemKey)) {
          combined.push(item);
          existingIds.add(itemKey);
        }
      });

      setResponses(combined);
    } catch (err) {
      console.warn("Fallback LocalStorage cho Phản hồi:", err);
      const localKey = `cbq_local_feedback_res_${topicId}`;
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const legacyLocal = JSON.parse(localStorage.getItem('cbq_local_scholarship_feedbacks') || '[]');
      setResponses([...local, ...legacyLocal]);
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

    const validTopicUuid = (selectedTopic.id && selectedTopic.id.length === 36 && selectedTopic.id.includes('-')) 
      ? selectedTopic.id 
      : SEED_TOPIC_ID;

    const newResponse = {
      topic_id: validTopicUuid,
      organization_unit: organizationUnit,
      representative_name: representativeName.trim(),
      phone: phone.trim(),
      email: email.trim() || '',
      feedback_content: feedbackContent.trim(),
      attached_file_url: attachedFileUrl.trim() || '',
      created_at: new Date().toISOString()
    };

    try {
      let isInsertedToSupabase = false;
      let insertedRecord = null;

      // 1. Dual Insert into Supabase table cbq_feedback_responses
      const { data: data1, error: err1 } = await supabase
        .from('cbq_feedback_responses')
        .insert([newResponse])
        .select();

      if (!err1 && data1 && data1.length > 0) {
        isInsertedToSupabase = true;
        insertedRecord = data1[0];
      }

      // 2. Fallback / Dual Insert into cbq_scholarship_feedback table
      const legacyObj = {
        organization_unit: organizationUnit,
        representative_name: representativeName.trim(),
        phone: phone.trim(),
        email: email.trim() || '',
        feedback_content: feedbackContent.trim(),
        attached_file_url: attachedFileUrl.trim() || '',
        created_at: newResponse.created_at
      };

      const { data: data2, error: err2 } = await supabase
        .from('cbq_scholarship_feedback')
        .insert([legacyObj])
        .select();

      if (!isInsertedToSupabase && !err2 && data2 && data2.length > 0) {
        isInsertedToSupabase = true;
        insertedRecord = data2[0];
      }

      // 3. LocalStorage sync & state update
      const localKey = `cbq_local_feedback_res_${selectedTopic.id}`;
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = [insertedRecord || newResponse, ...local];
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      const legacyLocal = JSON.parse(localStorage.getItem('cbq_local_scholarship_feedbacks') || '[]');
      localStorage.setItem('cbq_local_scholarship_feedbacks', JSON.stringify([insertedRecord || legacyObj, ...legacyLocal]));

      setResponses(prev => [insertedRecord || newResponse, ...prev]);

      setSuccessMsg(`🎉 GỬI Ý KIẾN GÓP Ý THÀNH CÔNG!\nHệ thống đã ghi nhận ý kiến của ${organizationUnit} (Đại diện: ${representativeName}) lên Cơ sở Dữ liệu Nhà trường.`);
      
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

      {/* COMPONENT 2: CHI TIẾT VĂN BẢN VÀ ĐẾM HẠN CHÓT */}
      {selectedTopic && (
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '22px', border: '1.5px solid #bbf7d0', marginBottom: '25px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '8px' }}>
                📄 {selectedTopic.dispatch_number || 'VĂN BẢN DỰ THẢO CHÍNH THỨC'}
              </span>
              <h2 style={{ fontSize: '19px', fontWeight: 'bold', color: '#14532d', margin: 0, lineHeight: '1.4' }}>
                {selectedTopic.title}
              </h2>
            </div>

            {/* BOX ĐẾM THỜI GIAN */}
            <div style={{ background: isDeadlinePassed ? '#fef2f2' : '#f0fdf4', border: `1.5px solid ${isDeadlinePassed ? '#fca5a5' : '#86efac'}`, padding: '12px 18px', borderRadius: '14px', textAlign: 'right', minWidth: '200px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                <Clock size={14} color={isDeadlinePassed ? '#dc2626' : '#166534'} /> HẠN CHÓT NHẬN GÓP Ý:
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDeadlinePassed ? '#dc2626' : '#15803d', marginTop: '3px' }}>
                {new Date(selectedTopic.deadline).toLocaleDateString('vi-VN')} ({new Date(selectedTopic.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
              </div>
              {isDeadlinePassed ? (
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>⚠️ ĐÃ HẾT THỜI HẠN NHẬN GÓP Ý</span>
              ) : (
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>🟢 ĐANG MỞ NHẬN GÓP Ý TRỰC TUYẾN</span>
              )}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#334155', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>📌 CĂN CỨ VÀ HƯỚNG DẪN ĐÓNG GÓP:</div>
            {selectedTopic.description}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '13px' }}>
            <div style={{ color: '#475569' }}>
              📞 Cán bộ phụ trách tiếp nhận: <strong style={{ color: '#166534' }}>{selectedTopic.contact_info}</strong>
            </div>

            {selectedTopic.attached_doc_url && (
              <a
                href={selectedTopic.attached_doc_url}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#0284c7', color: '#ffffff', padding: '7px 16px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <LinkIcon size={14} /> Xem File Văn Bản Đính Kèm
              </a>
            )}
          </div>
        </div>
      )}

      {/* SUCCESS NOTIFICATION */}
      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '16px', padding: '18px 22px', marginBottom: '25px', display: 'flex', alignItems: 'flex-start', gap: '14px', boxShadow: '0 4px 14px rgba(34,197,94,0.15)' }}>
          <CheckCircle2 size={28} color="#166534" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ whiteSpace: 'pre-line', color: '#14532d', fontSize: '14.5px', fontWeight: 'bold', lineHeight: '1.6' }}>
            {successMsg}
          </div>
        </div>
      )}

      {/* GRID LAYOUT: FORM & LIST OF SUBMITTED FEEDBACK */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px', alignItems: 'start' }}>
        
        {/* COL 1: FORM NỘP GÓP Ý */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
            <FileEditIcon size={22} color="#166534" />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#166534' }}>
              PHIẾU GÓP Ý TỔ / ĐƠN VỊ
            </h3>
          </div>

          {!selectedTopic?.is_active || isDeadlinePassed ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#dc2626' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>ĐÃ KHÓA NHẬN GÓP Ý</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Công việc này đã hết thời hạn tiếp nhận hoặc đã được Admin khóa lại.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  1. Tổ Chuyên Môn / Đơn Vị Góp Ý *
                </label>
                <select
                  value={organizationUnit}
                  onChange={e => setOrganizationUnit(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '600', color: '#1e293b', background: '#f8fafc' }}
                >
                  {DEFAULT_ORGANIZATIONS.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  2. Họ và Tên Người Đại Diện / Tổ Trưởng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thầy Nguyễn Văn A (Tổ trưởng)"
                  value={representativeName}
                  onChange={e => setRepresentativeName(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    3. Số Điện Thoại *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0912345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    4. Email Liên Hệ
                  </label>
                  <input
                    type="email"
                    placeholder="thayA@thptcaobaquat.edu.vn"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  5. Nội Dung Ý Kiến Đóng Góp Chi Tiết *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Nhập ý kiến góp ý chi tiết của đơn vị đối với các điều khoản, kế hoạch hoặc dự thảo..."
                  value={feedbackContent}
                  onChange={e => setFeedbackContent(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', lineHeight: '1.5', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  6. Link Văn Bản / Tệp Đính Kèm (Nếu có)
                </label>
                <input
                  type="url"
                  placeholder="Link Google Drive, Dropbox chứa file Word/PDF..."
                  value={attachedFileUrl}
                  onChange={e => setAttachedFileUrl(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '15.5px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(22,101,52,0.3)'
                }}
              >
                {submitting ? '⏳ Đang gửi lên Cơ sở Dữ liệu...' : '🚀 XÁC NHẬN GỬI Ý KIẾN GÓP Ý'}
              </button>
            </form>
          )}
        </div>

        {/* COL 2: DANH SÁCH CÁC ĐƠN VỊ ĐÃ GÓP Ý */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={22} color="#166534" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#166534' }}>
                TỔNG HỢP CÁC ĐƠN VỊ ĐÃ GÓP Ý ({responses.length})
              </h3>
            </div>
          </div>

          <div style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {responses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '13.5px' }}>
                Chưa có đơn vị nào gửi ý kiến cho chủ đề này. Hãy là đơn vị đầu tiên đóng góp ý kiến!
              </div>
            ) : (
              responses.map((item, idx) => (
                <div key={item.id || idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '14px' }}>
                      {item.organization_unit}
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>
                    Đại diện: <strong>{item.representative_name}</strong> ({item.phone})
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#1e293b', fontStyle: 'italic', lineHeight: '1.5' }}>
                    "{item.feedback_content}"
                  </div>

                  {item.attached_file_url && (
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      <a href={item.attached_file_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'underline' }}>
                        🔗 Xem tệp đính kèm của đơn vị
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function FileEditIcon(props) {
  return <FileText {...props} />;
}
