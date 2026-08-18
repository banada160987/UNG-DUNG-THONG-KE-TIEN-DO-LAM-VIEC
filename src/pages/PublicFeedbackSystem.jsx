import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase } from '../lib/supabase';
import { FileText, Send, Calendar, Phone, CheckCircle2, AlertCircle, Building2, Clock, Sparkles, FileCheck, Layers, Link as LinkIcon, FileEdit as FileEditIcon, CheckSquare, AlertTriangle, XCircle } from 'lucide-react';

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
  'Cá nhân Giáo viên / Nhân viên',
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
  const [agreementLevel, setAgreementLevel] = useState('thong_nhat');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [attachedFileUrl, setAttachedFileUrl] = useState('');

  useEffect(() => {
    fetchTopicsAndResponses(true);
  }, [topicIdFromUrl]);

  // Tự động tải lại dữ liệu mới sau mỗi 60 giây (Realtime Auto Polling)
  useAutoRefresh(() => {
    fetchTopicsAndResponses(false);
  }, 60000);

  const fetchTopicsAndResponses = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      // 1. Fetch Topics
      const { data: topicData, error: topicErr } = await supabase
        .from('cbq_feedback_topics')
        .select('*')
        .order('created_at', { ascending: false });

      let activeTopics = topicData || [];
      if (topicErr || activeTopics.length === 0) {
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
      if (isFirstLoad) setLoading(false);
    }
  };

  const fetchResponses = async (topicId) => {
    try {
      let combined = [];
      const validTopicId = (topicId && topicId.length === 36 && topicId.includes('-')) ? topicId : SEED_TOPIC_ID;
      
      const { data: respData } = await supabase
        .from('cbq_feedback_responses')
        .select('*')
        .eq('topic_id', validTopicId)
        .order('created_at', { ascending: false });

      if (respData && respData.length > 0) {
        combined = [...respData];
      }

      // LocalStorage fallback merge for offline support
      const localKey = `cbq_local_feedback_res_${topicId}`;
      const localRes = JSON.parse(localStorage.getItem(localKey) || '[]');
      const existingIds = new Set(combined.map(c => c.id || (c.organization_unit + c.created_at)));
      
      localRes.forEach(item => {
        const itemKey = item.id || (item.organization_unit + item.created_at);
        if (!existingIds.has(itemKey)) {
          combined.push(item);
          existingIds.add(itemKey);
        }
      });

      setResponses(combined);
    } catch (err) {
      console.warn("Lỗi tải danh sách phản hồi:", err);
      const localKey = `cbq_local_feedback_res_${topicId}`;
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
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
      agreement_level: agreementLevel || 'thong_nhat',
      feedback_content: feedbackContent.trim(),
      attached_file_url: attachedFileUrl.trim() || '',
      created_at: new Date().toISOString()
    };

    try {
      let insertedRecord = null;

      // Insert directly into single table cbq_feedback_responses
      const { data, error } = await supabase
        .from('cbq_feedback_responses')
        .insert([newResponse])
        .select();

      if (!error && data && data.length > 0) {
        insertedRecord = data[0];
      }

      const itemToSave = insertedRecord || newResponse;
      const localKey = `cbq_local_feedback_res_${selectedTopic.id}`;
      const localRes = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = [itemToSave, ...localRes];
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      setResponses(prev => [itemToSave, ...prev.filter(r => r.organization_unit !== organizationUnit)]);
      setSuccessMsg(`🎉 Cảm ơn bạn! Ý kiến đóng góp của ${organizationUnit} (Đại diện: ${representativeName}) đã được ghi nhận lên hệ thống.`);
      
      // Reset form
      setRepresentativeName('');
      setPhone('');
      setEmail('');
      setAgreementLevel('thong_nhat');
      setFeedbackContent('');
      setAttachedFileUrl('');

    } catch (err) {
      console.error("Lỗi gửi góp ý:", err);
      alert("Không thể gửi góp ý. Vui lòng kiểm tra kết nối!");
    } finally {
      setSubmitting(false);
    }
  };

  const isDeadlinePassed = selectedTopic ? new Date() > new Date(selectedTopic.deadline) : false;

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '20px 15px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', color: '#ffffff', padding: '24px 28px', borderRadius: '20px', marginBottom: '25px', boxShadow: '0 10px 25px rgba(22,101,52,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Building2 size={32} color="#86efac" />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.3px' }}>
            HỆ THỐNG GÓP Ý DỰ THẢO VĂN BẢN & CÔNG VIỆC
          </h1>
        </div>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14.5px', lineHeight: '1.5' }}>
          Trường THPT Cao Bá Quát - Thu nhận ý kiến đóng góp từ BCH Đảng ủy, Đoàn trường, các Tổ chuyên môn & Giáo viên
        </p>
      </div>

      {/* COMPONENT 1: CHỌN CÔNG VIỆC / DỰ THẢO CẦN GÓP Ý */}
      <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '16px', border: '1.5px solid #cbd5e1', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', color: '#166534', marginBottom: '8px' }}>
          📌 CHỌN VĂN BẢN / CÔNG VIỆC BẠN MUỐN ĐÓNG GÓP Ý KIẾN:
        </label>
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
              PHIẾU GÓP Ý TỔ / ĐƠN VỊ / CÁ NHÂN
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
                  1. Tổ Chuyên Môn / Đơn Vị / Cá Nhân Góp Ý *
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
                  2. Họ và Tên Người Đại Diện / Giáo Viên Góp Ý *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thầy Nguyễn Văn A (Giáo viên / Tổ trưởng)"
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

              {/* MỨC ĐỘ THỐNG NHẤT */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  5. Mức Độ Thống Nhất Đối Với Dự Thảo *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: agreementLevel === 'thong_nhat' ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${agreementLevel === 'thong_nhat' ? '#86efac' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold', color: '#166534' }}>
                    <input
                      type="radio"
                      name="agreement_level"
                      value="thong_nhat"
                      checked={agreementLevel === 'thong_nhat'}
                      onChange={() => setAgreementLevel('thong_nhat')}
                    />
                    🟢 Thống nhất hoàn toàn (Đồng ý 100%)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: agreementLevel === 'sua_doi' ? '#fef9c3' : '#f8fafc', border: `1.5px solid ${agreementLevel === 'sua_doi' ? '#fde047' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold', color: '#854d0e' }}>
                    <input
                      type="radio"
                      name="agreement_level"
                      value="sua_doi"
                      checked={agreementLevel === 'sua_doi'}
                      onChange={() => setAgreementLevel('sua_doi')}
                    />
                    🟡 Thống nhất nhưng có đề xuất sửa đổi / bổ sung
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: agreementLevel === 'khong_thong_nhat' ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${agreementLevel === 'khong_thong_nhat' ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold', color: '#dc2626' }}>
                    <input
                      type="radio"
                      name="agreement_level"
                      value="khong_thong_nhat"
                      checked={agreementLevel === 'khong_thong_nhat'}
                      onChange={() => setAgreementLevel('khong_thong_nhat')}
                    />
                    🔴 Không thống nhất / Đề nghị xem xét lại
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  6. Nội Dung Ý Kiến Đóng Góp Chi Tiết *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Nhập ý kiến góp ý chi tiết của đơn vị hoặc cá nhân đối với các điều khoản, kế hoạch hoặc dự thảo..."
                  value={feedbackContent}
                  onChange={e => setFeedbackContent(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', lineHeight: '1.5', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  7. Link Văn Bản / Tệp Đính Kèm (Nếu có)
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
                  boxShadow: '0 6px 16px rgba(22,101,52,0.25)'
                }}
              >
                <Send size={18} /> {submitting ? 'Đang gửi ý kiến...' : '🚀 GỬI Ý KIẾN GÓP Ý CHÍNH THỨC'}
              </button>
            </form>
          )}
        </div>

        {/* COL 2: DANH SÁCH ĐƠN VỊ ĐÃ NỘP GÓP Ý */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCheck size={22} color="#166534" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#166534' }}>
                DANH SÁCH ĐƠN VỊ ĐÃ NỘP ({responses.length})
              </h3>
            </div>
            <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
              Bảo mật nội dung
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải danh sách...</div>
          ) : responses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '14px' }}>
              Chưa có đơn vị nào gửi ý kiến cho công việc này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
              {responses.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '14.5px', marginBottom: '2px' }}>
                      {item.organization_unit}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      Đại diện: <strong>{item.representative_name}</strong>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                      Ngày gửi: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {item.agreement_level === 'khong_thong_nhat' ? (
                      <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                        🔴 Không thống nhất
                      </span>
                    ) : item.agreement_level === 'sua_doi' ? (
                      <span style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                        🟡 Đề xuất sửa đổi
                      </span>
                    ) : (
                      <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                        🟢 Thống nhất
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
