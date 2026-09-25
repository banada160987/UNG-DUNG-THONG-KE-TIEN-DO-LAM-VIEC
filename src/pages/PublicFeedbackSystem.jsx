import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase } from '../lib/supabase';
import { 
  FileText, Send, Calendar, Phone, CheckCircle2, AlertCircle, Building2, 
  Clock, Sparkles, FileCheck, Layers, Link as LinkIcon, FileEdit as FileEditIcon, 
  CheckSquare, AlertTriangle, XCircle, Plus, Trash2, ExternalLink, HelpCircle, 
  FileSpreadsheet, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';

// Danh sách tổ chuyên môn chuẩn từ CSDL trường THPT Cao Bá Quát (fallback nếu chưa nạp xong DB)
const DEFAULT_ORGANIZATIONS = [
  'Ban Giám Hiệu',
  'Tổ Toán',
  'Tổ Ngữ Văn',
  'Tổ Tin học - Ngoại Ngữ',
  'Tổ Vật Lý - Hóa học',
  'Tổ Sử - Địa - GDKT&PL',
  'Tổ GDTC - QPAN',
  'Tổ Văn Phòng',
  'Tổ Sinh học',
  'BCH Đảng ủy trường THPT Cao Bá Quát',
  'BCH Công đoàn trường',
  'Ban Thường vụ Đoàn trường THPT Cao Bá Quát',
  'Cá nhân Giáo viên / Nhân viên',
  'Đơn vị khác'
];

// Danh sách văn bản con chuẩn mực cho Hội nghị Viên chức & Người lao động (Ảnh 1)
const DEFAULT_HNVC_SUB_DOCS = [
  'Báo cáo đánh giá thực hiện Nghị quyết HNVC 2025-2026 & Phương hướng 2026-2027',
  'Quy chế làm việc của cơ quan, đơn vị trường học',
  'Quy chế thực hiện dân chủ trong hoạt động của nhà trường',
  'Quy chế phối hợp công tác giữa Ban Giám hiệu với BCH Công đoàn trường',
  'Quy chế chi tiêu nội bộ năm học 2026 - 2027 (hoặc năm 2027)',
  'Báo cáo công khai tài chính năm học 2025 - 2026 và Dự toán thu - chi ngân sách 2026 - 2027',
  'Quy chế quản lý, bảo quản và sử dụng cơ sở vật chất, thiết bị dạy học, phòng thí nghiệm và thư viện',
  'Quy chế (Quy định) thi đua, khen thưởng và đánh giá xếp loại viên chức, NLĐ năm học 2026 - 2027',
  'Báo cáo hoạt động của Ban Thanh tra nhân dân 2025 - 2026 và Kế hoạch giám sát 2026 - 2027',
  'Quy chế/Quy định về chuyển đổi số, an toàn thông tin mạng, ứng dụng AI và quản lý Học bạ số',
  'Quy tắc ứng xử văn hóa trong trường học (Quy chế văn hóa công sở)',
  'Quy chế phối hợp công tác giữa Lãnh đạo với Ban Thường vụ Đoàn TNCS Hồ Chí Minh trường',
  'Quy định về công tác chủ nhiệm lớp và phối hợp giáo dục giữa Nhà trường - Gia đình - Xã hội',
  'Kế hoạch đảm bảo an ninh trật tự, an toàn trường học và phòng, chống bạo lực học đường',
  'Dự thảo Nghị quyết Hội nghị Viên chức và Người lao động năm học 2026 - 2027'
];

const SEED_TOPIC_ID = 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';

const SEED_TOPIC = {
  id: SEED_TOPIC_ID,
  title: 'Dự thảo Đề án Thành lập Quỹ Học bổng "Chắp cánh ước mơ tuổi học trò" Trường THPT Cao Bá Quát',
  dispatch_number: 'Công văn số 409/SGDĐT-VP & Kế hoạch 53/KH-TrTHPTCBQ',
  description: 'Căn cứ Công văn 409/SGDĐT-VP ngày 11/02/2026 của Sở GD&ĐT và Kế hoạch 53/KH-TrTHPTCBQ ngày 12/3/2026. Đề nghị BCH Đảng ủy, BTV Đoàn trường, các Tổ chuyên môn & Tổ Văn phòng gửi góp ý về dự thảo Đề án Quỹ học bổng.',
  deadline: '2026-08-19T23:59:59+07:00',
  contact_info: 'Đồng chí Nghiêm Xuân Bảo – Nhân viên Tổ Văn phòng',
  meeting_minutes_url: 'https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform',
  sub_documents: [
    'Dự thảo Đề án Thành lập Quỹ Học bổng',
    'Dự thảo Quy chế Quản lý và Sử dụng Quỹ Học bổng',
    'Kế hoạch Vận động tài trợ và Trao học bổng'
  ],
  is_active: true
};

// Helper trích xuất danh sách văn bản con của 1 chủ đề
const getSubDocsList = (topic) => {
  if (!topic) return [];
  
  if (topic.sub_documents && Array.isArray(topic.sub_documents) && topic.sub_documents.length > 0) {
    return topic.sub_documents;
  }

  // Parse từ metadata trong description nếu có
  const desc = topic.description || '';
  const match = desc.match(/<!--SUB_DOCS_JSON:(.*?)-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  // Nếu tiêu đề là về Hội nghị Viên chức hoặc Người lao động
  const titleLower = (topic.title || '').toLowerCase();
  if (titleLower.includes('viên chức') || titleLower.includes('người lao động') || titleLower.includes('hội nghị')) {
    return DEFAULT_HNVC_SUB_DOCS;
  }

  return [];
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
  const [showSubDocsDrawer, setShowSubDocsDrawer] = useState(false);

  // Form State
  const [organizationsList, setOrganizationsList] = useState(DEFAULT_ORGANIZATIONS);
  const [organizationUnit, setOrganizationUnit] = useState(DEFAULT_ORGANIZATIONS[0]);
  const [representativeName, setRepresentativeName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agreementLevel, setAgreementLevel] = useState('thong_nhat'); // 'thong_nhat', 'sua_doi', 'khong_thong_nhat'
  
  // Cấu trúc bảng góp ý chi tiết theo chuẩn (Ảnh 1 & Ảnh 2)
  const [feedbackItems, setFeedbackItems] = useState([
    {
      id: 1,
      docName: '',
      pageLine: '',
      draftContent: '',
      proposedChange: '',
      reason: '',
      isCustomDoc: false
    }
  ]);
  const [generalComment, setGeneralComment] = useState('');
  const [attachedFileUrl, setAttachedFileUrl] = useState('');

  const currentSubDocs = getSubDocsList(selectedTopic);

  // Đồng bộ danh sách tổ chuyên môn từ CSDL cbq_departments
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('cbq_departments')
        .select('*')
        .or('is_active.eq.true,is_active.is.null')
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        const deptNames = data.map(d => d.name ? d.name.trim() : '').filter(Boolean);
        const extraOrgs = [
          'BCH Đảng ủy trường THPT Cao Bá Quát',
          'BCH Công đoàn trường',
          'Ban Thường vụ Đoàn trường THPT Cao Bá Quát',
          'Cá nhân Giáo viên / Nhân viên',
          'Đơn vị khác'
        ];
        const combined = [...deptNames];
        extraOrgs.forEach(org => {
          if (!combined.includes(org)) combined.push(org);
        });
        setOrganizationsList(combined);
        setOrganizationUnit(prev => combined.includes(prev) ? prev : combined[0]);
      }
    } catch (err) {
      console.warn("Lỗi nạp danh sách tổ chuyên môn từ DB:", err);
    }
  };

  useEffect(() => {
    fetchTopicsAndResponses(true);
    fetchDepartments();
  }, [topicIdFromUrl]);

  // Cập nhật tên văn bản mặc định cho dòng góp ý đầu tiên khi đổi chủ đề
  useEffect(() => {
    if (selectedTopic) {
      const availableSubDocs = getSubDocsList(selectedTopic);
      const defaultDocName = availableSubDocs.length > 0 ? availableSubDocs[0] : (selectedTopic.title || '');
      
      setFeedbackItems(prev => {
        if (prev.length === 1 && (!prev[0].docName || prev[0].docName === '')) {
          return [{
            ...prev[0],
            docName: defaultDocName,
            isCustomDoc: false
          }];
        }
        return prev;
      });
    }
  }, [selectedTopic]);

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
      
      const targetSubDocs = getSubDocsList(target);
      const defaultDoc = targetSubDocs.length > 0 ? targetSubDocs[0] : (target.title || '');

      setFeedbackItems([
        {
          id: Date.now(),
          docName: defaultDoc,
          pageLine: '',
          draftContent: '',
          proposedChange: '',
          reason: '',
          isCustomDoc: false
        }
      ]);
    }
  };

  // Thêm 1 dòng góp ý mới vào bảng
  const handleAddItem = (presetDocName = null) => {
    const defaultDoc = presetDocName || (currentSubDocs.length > 0 ? currentSubDocs[0] : (selectedTopic?.title || ''));
    setFeedbackItems(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        docName: defaultDoc,
        pageLine: '',
        draftContent: '',
        proposedChange: '',
        reason: '',
        isCustomDoc: false
      }
    ]);
  };

  // Xóa 1 dòng góp ý khỏi bảng
  const handleRemoveItem = (idToRemove) => {
    if (feedbackItems.length <= 1) {
      const defaultDoc = currentSubDocs.length > 0 ? currentSubDocs[0] : (selectedTopic?.title || '');
      setFeedbackItems([{
        id: Date.now(),
        docName: defaultDoc,
        pageLine: '',
        draftContent: '',
        proposedChange: '',
        reason: '',
        isCustomDoc: false
      }]);
      return;
    }
    setFeedbackItems(prev => prev.filter(item => item.id !== idToRemove));
  };

  // Cập nhật giá trị 1 trường trong bảng góp ý
  const handleUpdateItem = (id, field, value) => {
    setFeedbackItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return;
    if (!representativeName.trim() || !phone.trim()) {
      alert("Vui lòng điền đầy đủ Họ tên người đại diện và Số điện thoại liên hệ!");
      return;
    }

    // Lọc các dòng góp ý có nội dung thực tế
    const validItems = feedbackItems.filter(item => 
      (item.draftContent && item.draftContent.trim()) || 
      (item.proposedChange && item.proposedChange.trim()) || 
      (item.reason && item.reason.trim()) ||
      (item.pageLine && item.pageLine.trim())
    );

    // Kiểm tra tính hợp lệ nếu chọn đề xuất sửa đổi hoặc không thống nhất
    if ((agreementLevel === 'sua_doi' || agreementLevel === 'khong_thong_nhat') && validItems.length === 0 && !generalComment.trim()) {
      alert("Bạn đã chọn 'Đề xuất sửa đổi' hoặc 'Không thống nhất'. Vui lòng chọn văn bản và nhập ít nhất 1 nội dung góp ý chi tiết trong bảng hoặc nhập ý kiến đề xuất!");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    // Xây dựng chuỗi văn bản format chuẩn đẹp cho feedback_content
    let formattedContent = '';
    if (agreementLevel === 'thong_nhat' && validItems.length === 0) {
      formattedContent = generalComment.trim() || 'Thống nhất hoàn toàn 100% với toàn bộ nội dung của các dự thảo văn bản. Không có đề xuất sửa đổi bổ sung.';
    } else {
      let parts = [];
      if (validItems.length > 0) {
        parts.push(`=== BẢNG ĐÓNG GÓP Ý KIẾN CHI TIẾT THEO CÁC DỰ THẢO (${validItems.length} mục) ===\n`);
        validItems.forEach((item, idx) => {
          parts.push(`[MỤC ${idx + 1}]`);
          parts.push(`- Tên dự thảo văn bản: ${item.docName || selectedTopic.title || 'Dự thảo'}`);
          parts.push(`- Trang/dòng (Điều/Khoản): ${item.pageLine || 'Toàn văn'}`);
          parts.push(`- Nội dung dự thảo: ${item.draftContent || '(Không ghi)'}`);
          parts.push(`- Nội dung đề nghị điều chỉnh: ${item.proposedChange || '(Không ghi)'}`);
          parts.push(`- Lý do đề nghị: ${item.reason || '(Không ghi)'}`);
          parts.push('--------------------------------------------------\n');
        });
      }

      if (generalComment.trim()) {
        parts.push(`📌 Ý KIẾN NHẬN XÉT / KẾT LUẬN CHUNG CỦA TỔ:\n${generalComment.trim()}`);
      }

      formattedContent = parts.join('\n');
    }

    // Nhúng metadata JSON để hệ thống parse lại bảng khi hiển thị hoặc xuất Word
    const metadataString = `\n\n<!--FEEDBACK_ITEMS_JSON:${JSON.stringify(validItems)}-->`;
    const finalContentWithMeta = formattedContent + metadataString;

    const basePayload = {
      topic_id: selectedTopic.id,
      organization_unit: organizationUnit,
      representative_name: representativeName.trim(),
      phone: phone.trim(),
      email: email.trim() || '',
      agreement_level: agreementLevel || 'thong_nhat',
      feedback_content: finalContentWithMeta,
      attached_file_url: attachedFileUrl.trim() || '',
      created_at: new Date().toISOString()
    };

    try {
      let insertedRecord = null;

      try {
        const fullPayload = {
          ...basePayload,
          feedback_items: validItems,
          meeting_minutes_file_url: attachedFileUrl.trim() || null
        };
        const { data, error } = await supabase
          .from('cbq_feedback_responses')
          .insert([fullPayload])
          .select();

        if (!error && data && data.length > 0) {
          insertedRecord = data[0];
        } else if (error) {
          const { data: bData } = await supabase
            .from('cbq_feedback_responses')
            .insert([basePayload])
            .select();
          if (bData && bData.length > 0) insertedRecord = bData[0];
        }
      } catch (insertErr) {
        const { data: bData } = await supabase
          .from('cbq_feedback_responses')
          .insert([basePayload])
          .select();
        if (bData && bData.length > 0) insertedRecord = bData[0];
      }

      const itemToSave = insertedRecord || basePayload;
      const localKey = `cbq_local_feedback_res_${selectedTopic.id}`;
      const localRes = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = [itemToSave, ...localRes];
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      setResponses(prev => [itemToSave, ...prev.filter(r => r.organization_unit !== organizationUnit)]);
      setSuccessMsg(`🎉 Cảm ơn bạn! Ý kiến đóng góp của "${organizationUnit}" (Đại diện: ${representativeName}) đã được ghi nhận thành công vào cơ sở dữ liệu.`);
      
      window.scrollTo({ top: 150, behavior: 'smooth' });

      // Reset form
      setRepresentativeName('');
      setPhone('');
      setEmail('');
      setAgreementLevel('thong_nhat');
      setGeneralComment('');
      setAttachedFileUrl('');
      const defaultDoc = currentSubDocs.length > 0 ? currentSubDocs[0] : (selectedTopic.title || '');
      setFeedbackItems([
        {
          id: Date.now(),
          docName: defaultDoc,
          pageLine: '',
          draftContent: '',
          proposedChange: '',
          reason: '',
          isCustomDoc: false
        }
      ]);

    } catch (err) {
      console.error("Lỗi gửi góp ý:", err);
      alert("Không thể gửi góp ý: " + err.message + ". Vui lòng kiểm tra kết nối mạng!");
    } finally {
      setSubmitting(false);
    }
  };

  const isDeadlinePassed = selectedTopic ? new Date() > new Date(selectedTopic.deadline) : false;
  const minutesUrl = selectedTopic?.meeting_minutes_url || 'https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform';

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '20px 15px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', color: '#ffffff', padding: '24px 28px', borderRadius: '20px', marginBottom: '25px', boxShadow: '0 10px 25px rgba(22,101,52,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Building2 size={32} color="#86efac" />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.3px' }}>
            HỆ THỐNG GÓP Ý DỰ THẢO VĂN BẢN & CÔNG VIỆC
          </h1>
        </div>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14.5px', lineHeight: '1.5' }}>
          Trường THPT Cao Bá Quát - Cổng thông tin tiếp nhận đóng góp ý kiến đồng bộ, khoa học phục vụ tổng hợp tự động theo chuẩn Nghị định 30
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

      {/* COMPONENT 2: CHI TIẾT VĂN BẢN, DANH MỤC VĂN BẢN CON & BANNER BIÊN BẢN HỌP */}
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

          {/* 🌟 DANH MỤC CÁC VĂN BẢN / QUY CHẾ CON CẦN GÓP Ý (ẢNH 1) */}
          {currentSubDocs.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '14px 16px', marginBottom: '15px' }}>
              <div 
                onClick={() => setShowSubDocsDrawer(!showSubDocsDrawer)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '14px' }}>
                  <BookOpen size={18} />
                  <span>📚 DANH MỤC {currentSubDocs.length} VĂN BẢN / QUY CHẾ CON CẦN GÓP Ý (BẤM ĐỂ {showSubDocsDrawer ? 'THU GỌN' : 'XEM DANH SÁCH'})</span>
                </div>
                {showSubDocsDrawer ? <ChevronUp size={18} color="#166534" /> : <ChevronDown size={18} color="#166534" />}
              </div>

              {showSubDocsDrawer && (
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '8px', paddingTop: '10px', borderTop: '1px dashed #86efac' }}>
                  {currentSubDocs.map((subDoc, sIdx) => (
                    <div 
                      key={sIdx}
                      onClick={() => handleAddItem(subDoc)}
                      style={{ 
                        background: '#ffffff', 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid #bbf7d0', 
                        fontSize: '12.5px', 
                        color: '#1e293b', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                      title="Bấm để thêm mục góp ý cho văn bản này"
                    >
                      <span><strong>{sIdx + 1}.</strong> {subDoc}</span>
                      <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', background: '#dcfce7', padding: '2px 6px', borderRadius: '6px', whiteSpace: 'nowrap' }}>+ Góp ý</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                <LinkIcon size={14} /> 📄 Xem File / Thư Mục Văn Bản Dự Thảo Đính Kèm
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '25px', alignItems: 'start' }}>
        
        {/* COL 1: FORM NỘP GÓP Ý CHUẨN */}
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
                  {organizationsList.map(org => (
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
                  placeholder="VD: Thầy Nguyễn Văn A (Tổ trưởng / Thư ký)"
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  5. Mức Độ Thống Nhất Đối Với Các Dự Thảo *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: agreementLevel === 'thong_nhat' ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${agreementLevel === 'thong_nhat' ? '#86efac' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold', color: '#166534' }}>
                    <input
                      type="radio"
                      name="agreement_level"
                      value="thong_nhat"
                      checked={agreementLevel === 'thong_nhat'}
                      onChange={() => setAgreementLevel('thong_nhat')}
                    />
                    🟢 Thống nhất hoàn toàn (Đồng ý 100% tất cả các văn bản)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: agreementLevel === 'sua_doi' ? '#fef9c3' : '#f8fafc', border: `1.5px solid ${agreementLevel === 'sua_doi' ? '#fde047' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold', color: '#854d0e' }}>
                    <input
                      type="radio"
                      name="agreement_level"
                      value="sua_doi"
                      checked={agreementLevel === 'sua_doi'}
                      onChange={() => setAgreementLevel('sua_doi')}
                    />
                    🟡 Thống nhất nhưng có đề xuất sửa đổi / bổ sung văn bản con
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: agreementLevel === 'khong_thong_nhat' ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${agreementLevel === 'khong_thong_nhat' ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold', color: '#dc2626' }}>
                    <input
                      type="radio"
                      name="agreement_level"
                      value="khong_thong_nhat"
                      checked={agreementLevel === 'khong_thong_nhat'}
                      onChange={() => setAgreementLevel('khong_thong_nhat')}
                    />
                    🔴 Chưa thống nhất / Đề nghị xem xét lại
                  </label>
                </div>
              </div>

              {/* 🌟 MỤC 6: BẢNG GÓP Ý HOẶC XÁC NHẬN THỐNG NHẤT 100% */}
              {agreementLevel === 'thong_nhat' ? (
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: '14px', boxShadow: '0 2px 8px rgba(34,197,94,0.08)' }}>
                    <div style={{ background: '#16a34a', color: '#ffffff', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#166534', marginBottom: '4px' }}>
                        Đã chọn: Thống nhất hoàn toàn (Đồng ý 100% tất cả các văn bản)
                      </div>
                      <div style={{ fontSize: '13px', color: '#15803d', lineHeight: '1.5' }}>
                        Tập thể hoặc cá nhân nhất trí 100% với các văn bản dự thảo, không có đề xuất điều chỉnh hay sửa đổi câu chữ. Các ô góp ý chi tiết được <strong>tự động ẩn đi</strong> để bạn nộp phiếu nhanh chóng và thuận tiện nhất.
                      </div>
                    </div>
                  </div>

                  {/* Ý KIẾN NHẬN XÉT / GHI CHÚ CHUNG CỦA TỔ (Không bắt buộc) */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>
                      Ý kiến nhận xét / Ghi chú thêm của Tổ chuyên môn (Không bắt buộc):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Nếu có lời nhắn gửi hoặc nhận xét chung của tổ, bạn có thể ghi tại đây (hoặc để trống)..."
                      value={generalComment}
                      onChange={e => setGeneralComment(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', lineHeight: '1.4', background: '#f8fafc' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileSpreadsheet size={16} /> 6. Nội Dung Ý Kiến Đóng Góp Chi Tiết (Theo Mẫu Chuẩn) *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddItem()}
                      style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '5px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} /> Thêm Dòng Góp Ý
                    </button>
                  </div>

                {/* HƯỚNG DẪN CẤU TRÚC BẢNG */}
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  💡 Bạn chỉ cần <strong>chọn tên văn bản con từ danh sách xổ xuống</strong>, sau đó nhập <strong>Trang/dòng</strong>, <strong>Nội dung dự thảo</strong>, <strong>Đề nghị điều chỉnh</strong> và <strong>Lý do</strong>.
                </div>

                {/* DANH SÁCH CÁC MỤC GÓP Ý CHI TIẾT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {feedbackItems.map((item, idx) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        background: '#ffffff', 
                        border: '1.5px solid #bbf7d0', 
                        borderRadius: '12px', 
                        padding: '14px', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>
                        <span style={{ background: '#166534', color: '#ffffff', fontSize: '11.5px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px' }}>
                          Mục số {idx + 1}
                        </span>

                        {feedbackItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Xóa mục góp ý này"
                          >
                            <Trash2 size={13} /> Xóa mục
                          </button>
                        )}
                      </div>

                      {/* 🌟 CHỌN NHANH VĂN BẢN CON TỪ DROPDOWN HOẶC NHẬP TỰ DO */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                            Tên dự thảo văn bản con cần góp ý: *
                          </label>
                          
                          {currentSubDocs.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <select
                                value={currentSubDocs.includes(item.docName) ? item.docName : (item.isCustomDoc ? '__CUSTOM__' : item.docName || currentSubDocs[0])}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '__CUSTOM__') {
                                    handleUpdateItem(item.id, 'isCustomDoc', true);
                                    handleUpdateItem(item.id, 'docName', '');
                                  } else {
                                    handleUpdateItem(item.id, 'isCustomDoc', false);
                                    handleUpdateItem(item.id, 'docName', val);
                                  }
                                }}
                                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #166534', fontSize: '13px', fontWeight: 'bold', color: '#14532d', background: '#f0fdf4', boxSizing: 'border-box' }}
                              >
                                {currentSubDocs.map((doc, dIdx) => (
                                  <option key={dIdx} value={doc}>
                                    {dIdx + 1}. {doc}
                                  </option>
                                ))}
                                <option value="__CUSTOM__">✏️ Văn bản khác (Tự nhập tên riêng)...</option>
                              </select>

                              {item.isCustomDoc && (
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Gõ tên văn bản dự thảo khác..."
                                  value={item.docName}
                                  onChange={e => handleUpdateItem(item.id, 'docName', e.target.value)}
                                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #3b82f6', fontSize: '13px', boxSizing: 'border-box' }}
                                />
                              )}
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="VD: Dự thảo Đề án Quỹ học bổng..."
                              value={item.docName}
                              onChange={e => handleUpdateItem(item.id, 'docName', e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                            />
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                            Trang / dòng (hoặc Điều/Khoản):
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Trang 3, dòng 12 (Điều 4)"
                            value={item.pageLine}
                            onChange={e => handleUpdateItem(item.id, 'pageLine', e.target.value)}
                            style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                          Nội dung dự thảo (nội dung hiện tại trong văn bản):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Trích đoạn nội dung hiện tại trong bản dự thảo cần điều chỉnh..."
                          value={item.draftContent}
                          onChange={e => handleUpdateItem(item.id, 'draftContent', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', lineHeight: '1.4' }}
                        />
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                          Nội dung đề nghị điều chỉnh (nội dung sửa đổi, bổ sung mới):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ghi rõ nội dung đề xuất viết lại, chỉnh sửa hoặc bổ sung mới..."
                          value={item.proposedChange}
                          onChange={e => handleUpdateItem(item.id, 'proposedChange', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #86efac', background: '#f0fdf4', fontSize: '13px', boxSizing: 'border-box', lineHeight: '1.4' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                          Lý do đề nghị:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Nêu rõ lý do, căn cứ pháp lý hoặc tính khả thi thực tiễn..."
                          value={item.reason}
                          onChange={e => handleUpdateItem(item.id, 'reason', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', lineHeight: '1.4' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    style={{ background: '#f0fdf4', color: '#166534', border: '1.5px dashed #166534', padding: '9px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> ➕ Thêm Mục Góp Ý Cho Văn Bản Tiếp Theo (Mục số {feedbackItems.length + 1})
                  </button>
                </div>

                {/* Ý KIẾN NHẬN XÉT / KẾT LUẬN CHUNG CỦA TỔ */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>
                    Ý kiến nhận xét / Kết luận chung của Tổ chuyên môn (Không bắt buộc):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập ý kiến đánh giá chung của tập thể tổ chuyên môn đối với các dự thảo..."
                    value={generalComment}
                    onChange={e => setGeneralComment(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', lineHeight: '1.4' }}
                  />
                </div>
              </div>
            )}

              {/* MỤC 7: NỘP FILE BIÊN BẢN HỌP TỔ CHUYÊN MÔN (Scan / PDF có chữ ký) */}
              <div style={{ marginBottom: '22px', background: '#f8fafc', padding: '16px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FileCheck size={18} color="#166534" />
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    7. Nộp File / Tệp Scan Biên Bản Họp Tổ Chuyên Môn (Nếu có)
                  </label>
                </div>
                
                <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '12px', lineHeight: '1.5' }}>
                  Thư ký / Tổ trưởng chuyên môn nộp file Scan Biên bản họp (PDF kèm chữ ký của Tổ trưởng & Thư ký) bằng 1 trong 2 cách thuận tiện dưới đây:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Cách 1: Nộp qua Google Form tiếp nhận */}
                  <div style={{ background: '#ffffff', border: '1.5px solid #93c5fd', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e40af' }}>
                        Cách 1: Nộp file trực tiếp qua Google Form tiếp nhận của trường
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Tải lên file Scan/PDF biên bản họp có chữ ký của Tổ trưởng & Thư ký
                      </div>
                    </div>
                    <a
                      href={minutesUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: '#2563eb', color: '#ffffff', padding: '9px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}
                    >
                      <ExternalLink size={14} /> 📤 Mở Google Form Nộp File
                    </a>
                  </div>

                  {/* Cách 2: Dán link Google Drive */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                      Cách 2: Hoặc dán đường link file Google Drive / OneDrive của Tổ
                    </div>
                    <input
                      type="url"
                      placeholder="Dán link Google Drive chia sẻ file Word/PDF biên bản họp tổ tại đây (quyền xem)..."
                      value={attachedFileUrl}
                      onChange={e => setAttachedFileUrl(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#f8fafc' }}
                    />
                  </div>
                </div>
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
                <Send size={18} /> {submitting ? 'Đang gửi ý kiến lên hệ thống...' : '🚀 GỬI Ý KIẾN GÓP Ý CHÍNH THỨC'}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '650px', overflowY: 'auto', paddingRight: '4px' }}>
              {responses.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
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
                      Ngày gửi: {new Date(item.created_at).toLocaleDateString('vi-VN')} {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
