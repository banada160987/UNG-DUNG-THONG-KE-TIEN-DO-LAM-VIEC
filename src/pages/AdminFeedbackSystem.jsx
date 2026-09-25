import { useEffect, useState } from 'react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { 
  FileText, Download, Trash2, Search, Filter, RefreshCw, PlusCircle, 
  CheckCircle2, Clock, Building2, Layers, Edit, ToggleLeft, ToggleRight, 
  X, Lock, Unlock, CheckSquare, AlertTriangle, UserCheck, Eye, ExternalLink,
  FileCheck, FileSpreadsheet, Paperclip
} from 'lucide-react';

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
  meeting_minutes_url: 'https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform',
  is_active: true
};

const normalizeOrg = (str) => {
  if (!str) return '';
  return str
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]+/g, ' ')
    .trim();
};

const isOrgSubmitted = (orgName, responseList) => {
  const normOrg = normalizeOrg(orgName);
  if (!normOrg) return false;
  return responseList.some(r => {
    const normResp = normalizeOrg(r.organization_unit);
    return normResp.includes(normOrg) || normOrg.includes(normResp);
  });
};

// Helper trích xuất các dòng góp ý chi tiết từ bản ghi phản hồi
const parseFeedbackData = (item) => {
  if (!item) return { items: [], cleanText: '' };
  
  if (item.feedback_items && Array.isArray(item.feedback_items) && item.feedback_items.length > 0) {
    return {
      items: item.feedback_items,
      cleanText: (item.feedback_content || '').replace(/<!--FEEDBACK_ITEMS_JSON:(.*?)-->/, '').trim()
    };
  }

  const raw = item.feedback_content || '';
  const metaMatch = raw.match(/<!--FEEDBACK_ITEMS_JSON:(.*?)-->/);
  if (metaMatch && metaMatch[1]) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleanText = raw.replace(/<!--FEEDBACK_ITEMS_JSON:(.*?)-->/, '').trim();
        return {
          items: parsed,
          cleanText: cleanText
        };
      }
    } catch (e) {}
  }

  return {
    items: [],
    cleanText: raw.trim()
  };
};

export default function AdminFeedbackSystem() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDispatchNo, setNewDispatchNo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-08-19T23:59');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [newAttachedDocUrl, setNewAttachedDocUrl] = useState('');
  const [newMeetingMinutesUrl, setNewMeetingMinutesUrl] = useState('https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDispatchNo, setEditDispatchNo] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editAttachedDocUrl, setEditAttachedDocUrl] = useState('');
  const [editMeetingMinutesUrl, setEditMeetingMinutesUrl] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Detail Modal State (Xem chi tiết bảng góp ý của 1 đơn vị)
  const [viewingDetailResponse, setViewingDetailResponse] = useState(null);

  useEffect(() => {
    fetchTopics(true);
  }, [selectedTopicId]);

  // Tự động đồng bộ dữ liệu mới sau mỗi 60 giây (Realtime Auto-Sync)
  useAutoRefresh(() => {
    fetchTopics(false);
    if (selectedTopicId) {
      fetchResponses(selectedTopicId);
    }
  }, 60000);

  const fetchTopics = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      const dbClient = supabaseAdmin || supabase;
      const { data, error } = await dbClient
        .from('cbq_feedback_topics')
        .select('*')
        .order('created_at', { ascending: false });

      let activeTopics = data || [];
      if (error || activeTopics.length === 0) {
        const localTopics = JSON.parse(localStorage.getItem('cbq_local_feedback_topics') || '[]');
        if (localTopics.length === 0) {
          activeTopics = [SEED_TOPIC];
          localStorage.setItem('cbq_local_feedback_topics', JSON.stringify([SEED_TOPIC]));
        } else {
          activeTopics = localTopics;
        }
      }

      setTopics(activeTopics);
      if (activeTopics.length > 0 && !selectedTopicId) {
        const firstId = activeTopics[0].id;
        setSelectedTopicId(firstId);
        fetchResponses(firstId);
      }
    } catch (err) {
      console.warn("Lỗi tải chủ đề Admin:", err);
      setTopics([SEED_TOPIC]);
      setSelectedTopicId(SEED_TOPIC.id);
      fetchResponses(SEED_TOPIC.id);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  };

  const fetchResponses = async (topicId) => {
    try {
      let combined = [];
      const dbClient = supabaseAdmin || supabase;

      const { data: respData } = await dbClient
        .from('cbq_feedback_responses')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false });

      if (respData && respData.length > 0) {
        combined = [...respData];
      }

      // LocalStorage fallback merge
      const localResKey = `cbq_local_feedback_res_${topicId}`;
      const localRes = JSON.parse(localStorage.getItem(localResKey) || '[]');
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
      console.warn("Lỗi tải danh sách phản hồi Admin:", err);
      const localResKey = `cbq_local_feedback_res_${topicId}`;
      const localRes = JSON.parse(localStorage.getItem(localResKey) || '[]');
      setResponses(localRes);
    }
  };

  const handleTopicChange = (newId) => {
    setSelectedTopicId(newId);
    fetchResponses(newId);
  };

  // TOGGLE VERIFIED (ADMIN APPROVAL)
  const handleToggleVerified = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const dbClient = supabaseAdmin || supabase;
      await dbClient
        .from('cbq_feedback_responses')
        .update({ is_verified: newStatus })
        .eq('id', id);

      setResponses(prev => prev.map(r => r.id === id ? { ...r, is_verified: newStatus } : r));

      const localKey = `cbq_local_feedback_res_${selectedTopicId}`;
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = local.map(r => r.id === id ? { ...r, is_verified: newStatus } : r);
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

    } catch (err) {
      console.error("Lỗi duyệt ý kiến:", err);
    }
  };

  // CREATE TOPIC
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDeadline) {
      alert("Vui lòng điền tên công việc, trích yếu và hạn chót!");
      return;
    }

    const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'b' + Date.now().toString(16) + '-1234-4567-89ab-' + Math.floor(Math.random()*1000000000000).toString(16).padStart(12, '0');

    const createdTopic = {
      id: generatedUuid,
      title: newTitle.trim(),
      dispatch_number: newDispatchNo.trim() || '',
      description: newDescription.trim(),
      deadline: new Date(newDeadline).toISOString(),
      contact_info: newContactInfo.trim() || 'Văn phòng nhà trường',
      attached_doc_url: newAttachedDocUrl.trim() || '',
      meeting_minutes_url: newMeetingMinutesUrl.trim() || '',
      is_active: true,
      created_at: new Date().toISOString()
    };

    try {
      const dbClient = supabaseAdmin || supabase;
      let inserted = null;

      try {
        const { data, error } = await dbClient
          .from('cbq_feedback_topics')
          .insert([createdTopic])
          .select();
        
        if (!error && data && data.length > 0) {
          inserted = data[0];
        } else if (error) {
          // Fallback bỏ trường meeting_minutes_url nếu cột chưa được thêm vào Supabase
          const { meeting_minutes_url, ...legacyTopic } = createdTopic;
          const { data: d2 } = await dbClient.from('cbq_feedback_topics').insert([legacyTopic]).select();
          if (d2 && d2.length > 0) inserted = d2[0];
        }
      } catch (e) {
        const { meeting_minutes_url, ...legacyTopic } = createdTopic;
        const { data: d2 } = await dbClient.from('cbq_feedback_topics').insert([legacyTopic]).select();
        if (d2 && d2.length > 0) inserted = d2[0];
      }

      const itemToSave = inserted || createdTopic;
      const local = JSON.parse(localStorage.getItem('cbq_local_feedback_topics') || '[]');
      const updated = [itemToSave, ...local];
      localStorage.setItem('cbq_local_feedback_topics', JSON.stringify(updated));
      setTopics(updated);

      alert("🎉 Cấu hình Công việc Lấy Ý kiến mới thành công!");
      setShowCreateModal(false);
      setSelectedTopicId(itemToSave.id);
      fetchResponses(itemToSave.id);

      setNewTitle('');
      setNewDispatchNo('');
      setNewDescription('');
      setNewContactInfo('');
      setNewAttachedDocUrl('');
      setNewMeetingMinutesUrl('https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform');

    } catch (err) {
      console.error("Lỗi tạo công việc:", err);
      alert("Không thể tạo công việc. Vui lòng thử lại!");
    }
  };

  // OPEN EDIT MODAL
  const openEditTopicModal = () => {
    const topicToEdit = topics.find(t => t.id === selectedTopicId) || topics[0];
    if (!topicToEdit) return;

    setEditingTopic(topicToEdit);
    setEditTitle(topicToEdit.title || '');
    setEditDispatchNo(topicToEdit.dispatch_number || '');
    setEditDescription(topicToEdit.description || '');
    
    if (topicToEdit.deadline) {
      const d = new Date(topicToEdit.deadline);
      const formatted = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setEditDeadline(formatted);
    } else {
      setEditDeadline('2026-08-19T23:59');
    }

    setEditContactInfo(topicToEdit.contact_info || '');
    setEditAttachedDocUrl(topicToEdit.attached_doc_url || '');
    setEditMeetingMinutesUrl(topicToEdit.meeting_minutes_url || 'https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform');
    setEditIsActive(topicToEdit.is_active !== false);

    setShowEditModal(true);
  };

  // SAVE EDITED TOPIC
  const handleSaveEditedTopic = async (e) => {
    e.preventDefault();
    if (!editingTopic) return;

    const updatedData = {
      title: editTitle.trim(),
      dispatch_number: editDispatchNo.trim(),
      description: editDescription.trim(),
      deadline: new Date(editDeadline).toISOString(),
      contact_info: editContactInfo.trim(),
      attached_doc_url: editAttachedDocUrl.trim(),
      meeting_minutes_url: editMeetingMinutesUrl.trim(),
      is_active: editIsActive
    };

    try {
      const dbClient = supabaseAdmin || supabase;
      const { error } = await dbClient
        .from('cbq_feedback_topics')
        .update(updatedData)
        .eq('id', editingTopic.id);

      if (error) {
        // Fallback bỏ meeting_minutes_url nếu schema chưa có
        const { meeting_minutes_url, ...legacyData } = updatedData;
        await dbClient.from('cbq_feedback_topics').update(legacyData).eq('id', editingTopic.id);
      }

      const updatedTopics = topics.map(t => t.id === editingTopic.id ? { ...t, ...updatedData } : t);
      setTopics(updatedTopics);
      localStorage.setItem('cbq_local_feedback_topics', JSON.stringify(updatedTopics));

      alert("🎉 ĐÃ CẬP NHẬT THÔNG TIN CÔNG VIỆC THÀNH CÔNG!");
      setShowEditModal(false);

    } catch (err) {
      console.error("Lỗi cập nhật công việc:", err);
      alert("Không thể cập nhật. Vui lòng thử lại!");
    }
  };

  // DELETE TOPIC
  const handleDeleteTopic = async () => {
    const topicToDelete = topics.find(t => t.id === selectedTopicId);
    if (!topicToDelete) return;

    if (!window.confirm(`⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA CÔNG VIỆC:\n"${topicToDelete.title}"?\n\nTất cả ý kiến đóng góp của công việc này sẽ bị xóa khỏi hệ thống.`)) {
      return;
    }

    try {
      const dbClient = supabaseAdmin || supabase;
      await dbClient.from('cbq_feedback_topics').delete().eq('id', selectedTopicId);

      const updatedTopics = topics.filter(t => t.id !== selectedTopicId);
      setTopics(updatedTopics);
      localStorage.setItem('cbq_local_feedback_topics', JSON.stringify(updatedTopics));

      alert("🗑️ Đã xóa công việc khỏi hệ thống!");
      if (updatedTopics.length > 0) {
        setSelectedTopicId(updatedTopics[0].id);
        fetchResponses(updatedTopics[0].id);
      } else {
        setSelectedTopicId('');
        setResponses([]);
      }
    } catch (err) {
      console.error("Lỗi xóa công việc:", err);
      alert("Không thể xóa. Vui lòng thử lại!");
    }
  };

  const handleDeleteResponse = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ý kiến đóng góp này không?")) return;

    try {
      const dbClient = supabaseAdmin || supabase;
      await dbClient.from('cbq_feedback_responses').delete().eq('id', id);
      setResponses(prev => prev.filter(item => item.id !== id));

      const localKey = `cbq_local_feedback_res_${selectedTopicId}`;
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = local.filter(item => item.id !== id);
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

    } catch (err) {
      console.error("Lỗi xóa ý kiến:", err);
      alert("Không thể xóa. Vui lòng thử lại!");
    }
  };

  // 🌟 XUẤT FILE BÁO CÁO WORD THEO CHUẨN NGHỊ ĐỊNH 30 VỚI BẢNG CỘT ĐẦY ĐỦ NHƯ ẢNH 1
  const exportWordDoc = () => {
    if (responses.length === 0) {
      alert("Không có dữ liệu đóng góp ý kiến để xuất file Word!");
      return;
    }

    const currentTopicObj = topics.find(t => t.id === selectedTopicId) || topics[0];
    const today = new Date();
    const dayStr = today.getDate().toString().padStart(2, '0');
    const monthStr = (today.getMonth() + 1).toString().padStart(2, '0');
    const yearStr = today.getFullYear();

    // Lọc danh sách ý kiến chính thức (đã duyệt hoặc tất cả)
    const deptResponses = filteredResponses.filter(r => r.organization_unit !== 'Cá nhân Giáo viên / Nhân viên' && r.organization_unit !== 'Đơn vị khác');
    const teacherResponses = filteredResponses.filter(r => r.organization_unit === 'Cá nhân Giáo viên / Nhân viên' || r.organization_unit === 'Đơn vị khác');

    // Thống kê mức độ thống nhất
    const totalResp = filteredResponses.length;
    const countThongNhat = filteredResponses.filter(r => !r.agreement_level || r.agreement_level === 'thong_nhat').length;
    const countSuaDoi = filteredResponses.filter(r => r.agreement_level === 'sua_doi').length;
    const countKhongThongNhat = filteredResponses.filter(r => r.agreement_level === 'khong_thong_nhat').length;

    const percentThongNhat = totalResp > 0 ? Math.round((countThongNhat / totalResp) * 100) : 0;
    const percentSuaDoi = totalResp > 0 ? Math.round((countSuaDoi / totalResp) * 100) : 0;
    const percentKhongThongNhat = totalResp > 0 ? Math.round((countKhongThongNhat / totalResp) * 100) : 0;

    // Xây dựng hàng cho bảng chuẩn (Ảnh 1): STT | Tên dự thảo văn bản góp ý | Trang/dòng | Nội dung dự thảo | Nội dung đề nghị điều chỉnh | Lý do đề nghị | Tổ góp ý
    let structuredRowsHtml = '';
    let globalStt = 1;

    deptResponses.forEach((resp) => {
      const parsed = parseFeedbackData(resp);
      const orgInfo = `<strong>${resp.organization_unit}</strong><br/><span style="font-size: 10pt; color: #555;">Đại diện: ${resp.representative_name} (${resp.phone || ''})</span>`;
      const fileLink = resp.attached_file_url ? `<a href="${resp.attached_file_url}" target="_blank">Xem File/Biên bản</a>` : '-';

      if (parsed.items && parsed.items.length > 0) {
        parsed.items.forEach((subItem) => {
          structuredRowsHtml += `
            <tr>
              <td style="text-align: center; font-weight: bold;">${globalStt++}</td>
              <td>${subItem.docName || currentTopicObj?.title || 'Dự thảo'}</td>
              <td style="text-align: center;">${subItem.pageLine || '-'}</td>
              <td style="text-align: justify;">${(subItem.draftContent || '').replace(/\n/g, '<br/>')}</td>
              <td style="text-align: justify; font-weight: bold; color: #166534;">${(subItem.proposedChange || '').replace(/\n/g, '<br/>')}</td>
              <td style="text-align: justify;">${(subItem.reason || '').replace(/\n/g, '<br/>')}</td>
              <td>${orgInfo}</td>
              <td style="text-align: center;">${fileLink}</td>
            </tr>
          `;
        });
      } else {
        // Nếu không có mảng chi tiết (Thống nhất 100% hoặc ý kiến chung dạng văn bản)
        const is100 = resp.agreement_level === 'thong_nhat';
        structuredRowsHtml += `
          <tr>
            <td style="text-align: center; font-weight: bold;">${globalStt++}</td>
            <td>${currentTopicObj?.title || 'Dự thảo'}</td>
            <td style="text-align: center;">Toàn văn</td>
            <td style="text-align: center;"><em>${is100 ? 'Thống nhất toàn bộ' : '-'}</em></td>
            <td style="text-align: justify;">${(parsed.cleanText || (is100 ? 'Nhất trí 100% không có sửa đổi' : '')).replace(/\n/g, '<br/>')}</td>
            <td style="text-align: center;"><em>${is100 ? 'Đồng thuận' : '-'}</em></td>
            <td>${orgInfo}</td>
            <td style="text-align: center;">${fileLink}</td>
          </tr>
        `;
      }
    });

    const teacherRowsHtml = teacherResponses.map((item, idx) => {
      const parsed = parseFeedbackData(item);
      const levelLabel = item.agreement_level === 'sua_doi' ? '🟡 Đề xuất sửa đổi' : (item.agreement_level === 'khong_thong_nhat' ? '🔴 Không thống nhất' : '🟢 Thống nhất');
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td><strong>${item.representative_name || ''}</strong><br/><span style="color: #475569; font-size: 10pt;">${item.organization_unit || ''}</span></td>
          <td style="text-align: center; font-family: monospace;">${item.phone || ''}</td>
          <td style="text-align: center;">${levelLabel}</td>
          <td style="text-align: justify;">${(parsed.cleanText || item.feedback_content || '').replace(/\n/g, '<br/>')}</td>
          <td style="text-align: center;">${item.attached_file_url ? `<a href="${item.attached_file_url}" target="_blank">Xem File</a>` : '-'}</td>
        </tr>
      `;
    }).join('');

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
      <meta charset='utf-8'>
      <title>BÁO CÁO TỔNG HỢP Ý KIẾN GÓP Ý CHÍNH THỨC</title>
      <style>
        @page WordSection1 {
          size: 29.7cm 21.0cm; /* Khổ ngang A4 landscape để bảng hiển thị rộng rãi, chuẩn báo cáo dự thảo */
          margin: 1.5cm 1.5cm 1.5cm 2.0cm;
          mso-header-margin: 36.0pt;
          mso-footer-margin: 36.0pt;
          mso-paper-source: 0;
        }
        div.WordSection1 { page: WordSection1; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; color: #000000; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 14px; }
        th, td { border: 1px solid #000000; padding: 5pt 6pt; vertical-align: top; font-size: 11pt; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .header-table { border: none; width: 100%; margin-bottom: 15px; }
        .header-table td { border: none; padding: 0; text-align: center; }
        .title { font-size: 15pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-top: 15px; margin-bottom: 4px; }
        .subtitle { font-size: 12pt; font-style: italic; text-align: center; margin-bottom: 16px; }
        .signature-table { border: none; width: 100%; margin-top: 25px; }
        .signature-table td { border: none; padding: 0; text-align: center; vertical-align: top; }
      </style>
      </head>
      <body>
      <div class="WordSection1">
        <table class="header-table">
          <tr>
            <td style="width: 45%; text-align: center;">
              <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</strong><br/>
              <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
              -------------------<br/>
              Số: ...... /BC-TrTHPTCBQ
            </td>
            <td style="width: 55%; text-align: center;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
              -----------------------------------<br/>
              <em>Đắk Lắk, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</em>
            </td>
          </tr>
        </table>

        <div class="title">BÁO CÁO TỔNG HỢP Ý KIẾN ĐÓNG GÓP DỰ THẢO VĂN BẢN</div>
        <div class="subtitle">Về việc: ${currentTopicObj?.title || 'Dự thảo công việc'}<br/>${currentTopicObj?.dispatch_number ? `(${currentTopicObj.dispatch_number})` : ''}</div>

        <p><strong>Kính gửi:</strong> Ban Giám hiệu Trường THPT Cao Bá Quát</p>

        <p style="text-indent: 1cm; text-align: justify;">
          Căn cứ Kế hoạch công tác của Nhà trường, Tổ Văn phòng đã tiến hành thu nhận, tổng hợp và phân loại ý kiến đóng góp của BCH Đảng ủy, Ban Thường vụ Đoàn trường, các Tổ chuyên môn và cá nhân Giáo viên / Nhân viên đối với <strong>"${currentTopicObj?.title || 'Dự thảo công việc'}"</strong>. Kết quả tổng hợp cụ thể như sau:
        </p>

        <h3>I. THỐNG KÊ TIẾN ĐỘ THU NHẬN Ý KIẾN VÀ MỨC ĐỘ THỐNG NHẤT</h3>
        <p style="margin-left: 0.5cm;">
          - <strong>Tổng số Đơn vị / Tổ chuyên môn chính thức:</strong> 12 đơn vị.<br/>
          - <strong>Số lượng Đơn vị đã gửi góp ý chính thức:</strong> ${submittedCount} / 12 đơn vị (${Math.round((submittedCount/12)*100)}%).<br/>
          - <strong>Tổng số lượt góp ý đã ghi nhận trên hệ thống:</strong> ${totalResp} lượt đóng góp.<br/>
          - <strong>Tỷ lệ Thống nhất hoàn toàn (Đồng ý 100%):</strong> ${countThongNhat} / ${totalResp} lượt (${percentThongNhat}%).<br/>
          - <strong>Tỷ lệ Thống nhất nhưng có Đề xuất sửa đổi, bổ sung:</strong> ${countSuaDoi} / ${totalResp} lượt (${percentSuaDoi}%).<br/>
          - <strong>Tỷ lệ Chưa thống nhất:</strong> ${countKhongThongNhat} / ${totalResp} lượt (${percentKhongThongNhat}%).
        </p>

        <h3>II. BẢNG TỔNG HỢP Ý KIẾN ĐIỀU CHỈNH CHÍNH THỨC CỦA CÁC TỔ CHUYÊN MÔN / ĐƠN VỊ</h3>
        <p style="font-style: italic; font-size: 10.5pt; color: #444;">(Bảng tổng hợp chi tiết theo từng điều khoản, trang dòng và lý do đề nghị theo quy chuẩn)</p>
        ${deptResponses.length === 0 ? '<p><em>Chưa có ý kiến góp ý từ các Tổ chuyên môn.</em></p>' : `
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">STT</th>
              <th style="width: 18%;">Tên dự thảo văn bản góp ý</th>
              <th style="width: 10%;">Trang/dòng (Điều/Khoản)</th>
              <th style="width: 18%;">Nội dung dự thảo</th>
              <th style="width: 20%;">Nội dung đề nghị điều chỉnh</th>
              <th style="width: 14%;">Lý do đề nghị</th>
              <th style="width: 11%;">Tổ chuyên môn & Đại diện</th>
              <th style="width: 5%;">File/BB</th>
            </tr>
          </thead>
          <tbody>
            ${structuredRowsHtml}
          </tbody>
        </table>
        `}

        <h3>III. BẢNG TỔNG HỢP Ý KIẾN ĐÓNG GÓP CÁ NHÂN CỦA GIÁO VIÊN / NHÂN VIÊN</h3>
        ${teacherResponses.length === 0 ? '<p><em>Không có đóng góp ý kiến cá nhân riêng lẻ.</em></p>' : `
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 25%;">Họ và tên Giáo viên / Đơn vị</th>
              <th style="width: 15%;">Số điện thoại</th>
              <th style="width: 15%;">Mức độ thống nhất</th>
              <th style="width: 32%;">Nội dung đóng góp chi tiết</th>
              <th style="width: 8%;">File đính kèm</th>
            </tr>
          </thead>
          <tbody>
            ${teacherRowsHtml}
          </tbody>
        </table>
        `}

        <h3>IV. ĐÁNH GIÁ CHUNG VÀ ĐỀ XUẤT HƯỚNG XỬ LÝ</h3>
        <p style="text-indent: 1cm; text-align: justify;">
          Qua tổng hợp ý kiến từ các Tổ chuyên môn và cá nhân Giáo viên, hầu hết các ý kiến đóng góp đều thể hiện tinh thần trách nhiệm cao đối với công tác chung của Nhà trường. Tất cả các ý kiến chi tiết trên đã được phân loại đầy đủ để Kính trình Ban Giám Hiệu xem xét, chỉ đạo và hoàn thiện văn bản chính thức.
        </p>

        <table class="signature-table">
          <tr>
            <td style="width: 50%; text-align: left;">
              <strong>Nơi nhận:</strong><br/>
              - Ban Giám hiệu (để b/c);<br/>
              - Các Tổ chuyên môn;<br/>
              - Lưu: VT, Tổ VP.
            </td>
            <td style="width: 50%; text-align: center;">
              <strong>NGƯỜI LẬP BÁO CÁO</strong><br/>
              <em>(Ký, ghi rõ họ tên)</em><br/><br/><br/><br/><br/>
              <strong>Đ/c Nghiêm Xuân Bảo</strong>
            </td>
          </tr>
        </table>
      </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BAO_CAO_GOP_Y_${(currentTopicObj?.title || 'CONG_VIEC').slice(0,30)}_${yearStr}${monthStr}${dayStr}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
    if (responses.length === 0) {
      alert("Không có dữ liệu đóng góp ý kiến để xuất file!");
      return;
    }

    const currentTopicObj = topics.find(t => t.id === selectedTopicId);
    let csvContent = "\uFEFFSTT,ĐƠN VỊ GÓP Ý,NGƯỜI ĐẠI DIỆN,SỐ ĐIỆN THOẠI,EMAIL,MỨC ĐỘ THỐNG NHẤT,TÊN DỰ THẢO,TRANG/DÒNG,NỘI DUNG DỰ THẢO,NỘI DUNG ĐỀ NGHỊ ĐIỀU CHỈNH,LÝ DO ĐỀ NGHỊ,Ý KIẾN CHUNG,LINK BIÊN BẢN/TỆP ĐÍNH KÈM,NGÀY GỬI\n";
    
    let csvStt = 1;
    filteredResponses.forEach((item) => {
      const levelLabel = item.agreement_level === 'sua_doi' ? 'Đề xuất sửa đổi' : (item.agreement_level === 'khong_thong_nhat' ? 'Không thống nhất' : 'Thống nhất hoàn toàn');
      const parsed = parseFeedbackData(item);

      if (parsed.items && parsed.items.length > 0) {
        parsed.items.forEach((subItem) => {
          const row = [
            csvStt++,
            `"${item.organization_unit || ''}"`,
            `"${item.representative_name || ''}"`,
            `"${item.phone || ''}"`,
            `"${item.email || ''}"`,
            `"${levelLabel}"`,
            `"${(subItem.docName || currentTopicObj?.title || '').replace(/"/g, '""')}"`,
            `"${(subItem.pageLine || '').replace(/"/g, '""')}"`,
            `"${(subItem.draftContent || '').replace(/"/g, '""')}"`,
            `"${(subItem.proposedChange || '').replace(/"/g, '""')}"`,
            `"${(subItem.reason || '').replace(/"/g, '""')}"`,
            `"${(parsed.cleanText || '').replace(/"/g, '""')}"`,
            `"${item.attached_file_url || ''}"`,
            `"${new Date(item.created_at).toLocaleDateString('vi-VN')}"`
          ];
          csvContent += row.join(",") + "\n";
        });
      } else {
        const row = [
          csvStt++,
          `"${item.organization_unit || ''}"`,
          `"${item.representative_name || ''}"`,
          `"${item.phone || ''}"`,
          `"${item.email || ''}"`,
          `"${levelLabel}"`,
          `"${(currentTopicObj?.title || '').replace(/"/g, '""')}"`,
          `"Toàn văn"`,
          `"-"`,
          `"-"`,
          `"-"`,
          `"${(parsed.cleanText || item.feedback_content || '').replace(/"/g, '""')}"`,
          `"${item.attached_file_url || ''}"`,
          `"${new Date(item.created_at).toLocaleDateString('vi-VN')}"`
        ];
        csvContent += row.join(",") + "\n";
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BÁO_CÁO_GÓP_Ý_CHI_TIẾT_${(currentTopicObj?.title || 'CÔNG_VIỆC').slice(0,30)}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproveTopic = async () => {
    if (!selectedTopicId) return;
    if (currentTopicObj?.is_approved) {
      alert("Văn bản này đã được duyệt và ban hành rồi.");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn CHUYỂN TRẠNG THÁI thành ĐÃ DUYỆT & BAN HÀNH văn bản này không?")) return;
    
    try {
      setLoading(true);
      const dbClient = supabaseAdmin || supabase;
      const { error: updateError } = await dbClient
        .from('cbq_feedback_topics')
        .update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: 'Hiệu trưởng' })
        .eq('id', selectedTopicId);
      
      if (updateError) throw updateError;
      
      const topicObj = topics.find(t => t.id === selectedTopicId);
      if (topicObj) {
        await dbClient.from('cbq_docs').insert([{
          title: topicObj.title,
          category: 'Quyết định / Ban hành',
          content: topicObj.description,
          author: 'Hiệu trưởng',
          reference_number: topicObj.dispatch_number
        }]);
      }

      alert("Phê duyệt và ban hành văn bản thành công!");
      fetchTopics();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi duyệt văn bản: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentTopicObj = topics.find(t => t.id === selectedTopicId) || topics[0];
  
  // Submitted Count for Official Departments
  const submittedCount = DEFAULT_ORGANIZATIONS
    .filter(org => org !== 'Cá nhân Giáo viên / Nhân viên' && org !== 'Đơn vị khác')
    .filter(org => isOrgSubmitted(org, responses)).length;

  const filteredResponses = responses.filter(item => {
    const matchSearch = (item.organization_unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.representative_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.feedback_content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* TITLE & MAIN TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={26} color="#166534" /> TỔNG HỢP & QUẢN LÝ GÓP Ý CÔNG VIỆC
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Hệ thống cấu hình các dự thảo/công việc và tổng hợp ý kiến từ BCH Đảng ủy, Đoàn trường, Tổ chuyên môn & Giáo viên
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '9px 16px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22,101,52,0.2)' }}
          >
            <PlusCircle size={16} /> ➕ Cấu Hình Công Việc Mới
          </button>

          <button
            onClick={() => fetchResponses(selectedTopicId)}
            style={{ padding: '9px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} /> Tải Lại
          </button>
          
          <button
            onClick={exportWordDoc}
            style={{ padding: '9px 16px', background: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
            title="Tải File Báo Cáo Chuẩn Nghị Định 30 (.doc)"
          >
            <FileText size={16} /> 📄 Xuất Báo Cáo Word (.doc)
          </button>

          <button
            onClick={exportCSV}
            style={{ padding: '9px 16px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2,132,199,0.2)' }}
            title="Tải File Bảng Tính Excel (.csv)"
          >
            <Download size={16} /> 📊 Xuất Bảng Tính Excel
          </button>
        </div>
      </div>

      {/* CHỌN & ĐIỀU CHỈNH CÔNG VIỆC / ĐỀ ÁN CẦN TỔNG HỢP */}
      <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '16px', border: '1.5px solid #cbd5e1', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={18} color="#166534" /> CHỌN CÔNG VIỆC / ĐỀ ÁN CẦN TỔNG HỢP VÀ ĐIỀU CHỈNH:
          </div>

          {currentTopicObj && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const text = `📢 THÔNG BÁO GỬI Ý KIẾN GÓP Ý DỰ THẢO CÔNG VIỆC\n📌 ${currentTopicObj?.title || 'Dự thảo công việc'}\n🕒 Hạn chót: ${new Date(currentTopicObj?.deadline).toLocaleDateString('vi-VN')} (${new Date(currentTopicObj?.deadline).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})})\n👉 Kính mời các đồng chí Tổ trưởng & Giáo viên gửi góp ý tại: https://thptcaobaquat.vercel.app/gop-y`;
                  navigator.clipboard.writeText(text);
                  alert("📋 Đã copy mẫu thông báo Zalo/Email vào bộ nhớ tạm! Bạn có thể dán (Ctrl+V) gửi cho các Tổ chuyên môn.");
                }}
                style={{ padding: '6px 14px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(5,150,105,0.2)' }}
                title="Copy Mẫu Thông Báo Nhắc Nộp Góp Ý Gửi Group Zalo Trường"
              >
                💬 Copy Mẫu Zalo
              </button>

              <button
                onClick={handleApproveTopic}
                disabled={currentTopicObj?.is_approved}
                style={{ padding: '6px 14px', background: currentTopicObj?.is_approved ? '#16a34a' : '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: currentTopicObj?.is_approved ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Duyệt và ban hành thành văn bản chính thức"
              >
                <CheckCircle2 size={15} /> {currentTopicObj?.is_approved ? '✅ Đã Ban Hành' : '✍️ Duyệt & Ban Hành'}
              </button>

              <button
                onClick={openEditTopicModal}
                style={{ padding: '6px 14px', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Chỉnh sửa tên công việc, trích yếu, hạn chót, link nộp biên bản..."
              >
                <Edit size={15} /> ✏️ Cấu Hình / Chỉnh Sửa
              </button>

              <button
                onClick={handleDeleteTopic}
                style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Xóa công việc này khỏi hệ thống"
              >
                <Trash2 size={15} /> 🗑️ Xóa
              </button>
            </div>
          )}
        </div>

        <select
          value={selectedTopicId}
          onChange={e => handleTopicChange(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #166534', fontSize: '14.5px', fontWeight: 'bold', color: '#14532d', background: '#f0fdf4' }}
        >
          {topics.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} {t.dispatch_number ? `(${t.dispatch_number})` : ''} {!t.is_active ? ' [ĐÃ ĐÓNG]' : ''}
            </option>
          ))}
        </select>

        {/* THÔNG TIN LINK NỘP BIÊN BẢN HỌP HIỆN TẠI */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12.5px', color: '#475569', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
          <div>
            📁 Link Google Form Nộp Biên Bản Họp Tổ: <strong>{currentTopicObj?.meeting_minutes_url || 'https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform'}</strong>
          </div>
          <a
            href={currentTopicObj?.meeting_minutes_url || 'https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform'}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ExternalLink size={13} /> Kiểm tra mở link Form
          </a>
        </div>
      </div>

      {/* STATS CHECKLIST OF ORGANIZATIONS FOR SELECTED TASK */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1.5px solid #cbd5e1', padding: '14px 18px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={16} color="#166534" /> TIẾN ĐỘ NỘP GÓP Ý CHÍNH THỨC CỦA CÁC ĐƠN VỊ & TỔ CHUYÊN MÔN:
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: submittedCount === 12 ? '#16a34a' : '#0369a1' }}>
            Đã nộp: {submittedCount} / 12 Đơn vị ({Math.round((submittedCount / 12) * 100)}%)
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
          {DEFAULT_ORGANIZATIONS.filter(org => org !== 'Cá nhân Giáo viên / Nhân viên' && org !== 'Đơn vị khác').map((org) => {
            const submitted = isOrgSubmitted(org, responses);
            return (
              <div 
                key={org}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: submitted ? '#f0fdf4' : '#fff1f2',
                  border: `1px solid ${submitted ? '#bbf7d0' : '#fecdd3'}`,
                  fontSize: '12px'
                }}
              >
                {submitted ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#e11d48" />}
                <span style={{ fontWeight: submitted ? 'bold' : 'normal', color: submitted ? '#166534' : '#9f1239', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {org}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo Đơn vị, Người đại diện hoặc Nội dung góp ý..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
        </div>
      </div>

      {/* RESPONSES TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách góp ý...</div>
        ) : filteredResponses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có đơn vị hay giáo viên nào gửi ý kiến góp ý cho công việc này.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#166534', color: '#ffffff' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '40px' }}>STT</th>
                  <th style={{ padding: '12px 10px' }}>ĐƠN VỊ / TỔ CHUYÊN MÔN</th>
                  <th style={{ padding: '12px 10px' }}>NGƯỜI ĐẠI DIỆN</th>
                  <th style={{ padding: '12px 10px' }}>MỨC ĐỘ THỐNG NHẤT</th>
                  <th style={{ padding: '12px 10px' }}>NỘI DUNG GÓP Ý DỰ THẢO</th>
                  <th style={{ padding: '12px 10px' }}>BIÊN BẢN / FILE</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>CHI TIẾT</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>DUYỆT BC</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>XÓA</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((item, idx) => {
                  const isVerified = item.is_verified !== false;
                  const parsed = parseFeedbackData(item);
                  const hasStructuredItems = parsed.items && parsed.items.length > 0;

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: item.organization_unit === 'Cá nhân Giáo viên / Nhân viên' ? '#0369a1' : '#166534' }}>
                        {item.organization_unit}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1e293b' }}>
                        {item.representative_name}
                        {item.phone && <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'normal' }}>SĐT: {item.phone}</div>}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {item.agreement_level === 'khong_thong_nhat' ? (
                          <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 'bold', display: 'inline-block' }}>
                            🔴 Không thống nhất
                          </span>
                        ) : item.agreement_level === 'sua_doi' ? (
                          <span style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 'bold', display: 'inline-block' }}>
                            🟡 Đề xuất sửa đổi
                          </span>
                        ) : (
                          <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 'bold', display: 'inline-block' }}>
                            🟢 Thống nhất 100%
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#334155', maxWidth: '340px' }}>
                        {hasStructuredItems ? (
                          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '8px 10px' }}>
                            <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileSpreadsheet size={14} /> Có {parsed.items.length} mục góp ý chi tiết theo bảng
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Mục 1: {parsed.items[0].proposedChange || parsed.items[0].draftContent}
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', lineHeight: '1.4', maxHeight: '70px', overflowY: 'auto' }}>
                            {parsed.cleanText || item.feedback_content}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {item.attached_file_url ? (
                          <a href={item.attached_file_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Paperclip size={13} /> Xem File
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => setViewingDetailResponse(item)}
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Xem chi tiết toàn bộ bảng góp ý"
                        >
                          <Eye size={13} color="#0284c7" /> Xem
                        </button>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleVerified(item.id, isVerified)}
                          style={{ padding: '4px 10px', borderRadius: '16px', border: 'none', background: isVerified ? '#dcfce7' : '#fef9c3', color: isVerified ? '#166534' : '#854d0e', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Bấm để duyệt hoặc bỏ duyệt đưa vào Báo cáo Word"
                        >
                          {isVerified ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {isVerified ? '✅ Đã duyệt' : '⏳ Chờ'}
                        </button>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteResponse(item.id)}
                          style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          title="Xóa ý kiến này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🌟 MODAL XEM CHI TIẾT BẢNG GÓP Ý ĐIỀU CHỈNH THEO DỰ THẢO (ẢNH 1) */}
      {viewingDetailResponse && (() => {
        const parsed = parseFeedbackData(viewingDetailResponse);
        const hasItems = parsed.items && parsed.items.length > 0;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' }}>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '25px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet size={22} color="#166534" /> CHI TIẾT Ý KIẾN GÓP Ý: {viewingDetailResponse.organization_unit}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                    Người đại diện: <strong>{viewingDetailResponse.representative_name}</strong> | SĐT: {viewingDetailResponse.phone} | Ngày gửi: {new Date(viewingDetailResponse.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
                <button onClick={() => setViewingDetailResponse(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={22} color="#64748b" />
                </button>
              </div>

              {/* BẢNG CỘT THEO ĐÚNG CẤU TRÚC ẢNH 1 */}
              {hasItems ? (
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', marginBottom: '10px' }}>
                    BẢNG ĐÓNG GÓP Ý KIẾN CHI TIẾT THEO DỰ THẢO ({parsed.items.length} mục):
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: '16px', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#1e293b', borderBottom: '1.5px solid #cbd5e1' }}>
                          <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }}>STT</th>
                          <th style={{ padding: '8px 10px', width: '22%' }}>Tên dự thảo văn bản góp ý</th>
                          <th style={{ padding: '8px 10px', width: '15%' }}>Trang/dòng</th>
                          <th style={{ padding: '8px 10px', width: '20%' }}>Nội dung dự thảo</th>
                          <th style={{ padding: '8px 10px', width: '23%' }}>Nội dung đề nghị điều chỉnh</th>
                          <th style={{ padding: '8px 10px', width: '16%' }}>Lý do đề nghị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.items.map((sub, sIdx) => (
                          <tr key={sIdx} style={{ borderBottom: '1px solid #e2e8f0', background: sIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 'bold' }}>{sIdx + 1}</td>
                            <td style={{ padding: '10px' }}>{sub.docName || currentTopicObj?.title || 'Dự thảo'}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#0369a1' }}>{sub.pageLine || '-'}</td>
                            <td style={{ padding: '10px', color: '#475569' }}>{sub.draftContent || '-'}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#166534', background: '#f0fdf4' }}>{sub.proposedChange || '-'}</td>
                            <td style={{ padding: '10px', color: '#475569' }}>{sub.reason || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>Nội Dung Ý Kiến Đóng Góp:</div>
                  <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '13.5px', color: '#1e293b' }}>
                    {parsed.cleanText || viewingDetailResponse.feedback_content}
                  </div>
                </div>
              )}

              {/* TỆP ĐÍNH KÈM / BIÊN BẢN */}
              {viewingDetailResponse.attached_file_url && (
                <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#1e40af' }}>
                    📎 File Đính Kèm / Biên Bản Họp: <strong>{viewingDetailResponse.attached_file_url}</strong>
                  </div>
                  <a
                    href={viewingDetailResponse.attached_file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: '#2563eb', color: '#ffffff', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={14} /> Mở Tệp
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setViewingDetailResponse(null)}
                  style={{ padding: '9px 18px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL CẤU HÌNH CÔNG VIỆC LẤY Ý KIẾN MỚI */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '25px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '18px' }}>
                <PlusCircle size={22} color="#166534" /> CẤU HÌNH CÔNG VIỆC / ĐỀ ÁN LẤY Ý KIẾN MỚI
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Tên Công Việc / Đề Án / Kế Hoạch *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Dự thảo Kế hoạch Tổ chức Lễ Kỷ niệm 30 năm thành lập trường"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Số Hiệu Văn Bản / Căn Cứ (Nếu có)</label>
                <input
                  type="text"
                  placeholder="VD: Công văn 123/SGDĐT-VP & Kế hoạch 53/KH-TrTHPTCBQ"
                  value={newDispatchNo}
                  onChange={e => setNewDispatchNo(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Trích Yếu Nội Dung & Hướng Dẫn Đóng Góp *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nêu rõ các căn cứ pháp lý, yêu cầu góp ý từ Đảng ủy, Đoàn trường và các Tổ chuyên môn..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Hạn Chót Nhận Góp Ý *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Cán Bộ Phụ Trách Tiếp Nhận *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Đ/c Nghiêm Xuân Bảo - Tổ Văn phòng"
                    value={newContactInfo}
                    onChange={e => setNewContactInfo(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Link Tệp Văn Bản / Dự Thảo Kèm Theo (Google Drive/Dropbox)</label>
                <input
                  type="url"
                  placeholder="VD: https://drive.google.com/file/d/..."
                  value={newAttachedDocUrl}
                  onChange={e => setNewAttachedDocUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 🌟 CẤU HÌNH LINK TIẾP NHẬN BIÊN BẢN HỌP TỔ (ẢNH 3) */}
              <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #93c5fd' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                  📁 Link Biểu Mẫu Tiếp Nhận Biên Bản Họp Tổ (Google Form / Drive)
                </label>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                  Đường link để Thư ký / Tổ trưởng nộp file scan biên bản họp tổ trực tuyến
                </div>
                <input
                  type="url"
                  placeholder="VD: https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform"
                  value={newMeetingMinutesUrl}
                  onChange={e => setNewMeetingMinutesUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #93c5fd', fontSize: '13.5px', boxSizing: 'border-box', background: '#ffffff' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '12px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                🚀 XÁC NHẬN TẠO CÔNG VIỆC MỚI
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA CÔNG VIỆC ĐÃ TẠO */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '25px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#854d0e', fontWeight: 'bold', fontSize: '18px' }}>
                <Edit size={22} color="#854d0e" /> ✏️ CHỈNH SỬA THÔNG TIN CÔNG VIỆC / ĐỀ ÁN
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTopic}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Tên Công Việc / Đề Án / Kế Hoạch *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Số Hiệu Văn Bản / Căn Cứ</label>
                <input
                  type="text"
                  value={editDispatchNo}
                  onChange={e => setEditDispatchNo(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Trích Yếu Nội Dung & Hướng Dẫn Đóng Góp *</label>
                <textarea
                  rows={4}
                  required
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Hạn Chót Nhận Góp Ý *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editDeadline}
                    onChange={e => setEditDeadline(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Cán Bộ Phụ Trách Tiếp Nhận *</label>
                  <input
                    type="text"
                    required
                    value={editContactInfo}
                    onChange={e => setEditContactInfo(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Link Tệp Văn Bản / Dự Thảo Kèm Theo</label>
                <input
                  type="url"
                  value={editAttachedDocUrl}
                  onChange={e => setEditAttachedDocUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 🌟 CẤU HÌNH LINK TIẾP NHẬN BIÊN BẢN HỌP TỔ TRONG EDIT (ẢNH 3) */}
              <div style={{ marginBottom: '16px', background: '#eff6ff', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #93c5fd' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                  📁 Link Biểu Mẫu Tiếp Nhận Biên Bản Họp Tổ (Google Form / Drive)
                </label>
                <input
                  type="url"
                  placeholder="VD: https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform"
                  value={editMeetingMinutesUrl}
                  onChange={e => setEditMeetingMinutesUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #93c5fd', fontSize: '13.5px', boxSizing: 'border-box', background: '#ffffff' }}
                />
              </div>

              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#334155' }}>Trạng Thái Nhận Góp Ý:</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Cho phép hoặc ngưng nhận ý kiến đóng góp mới</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', background: editIsActive ? '#dcfce7' : '#fee2e2', color: editIsActive ? '#166534' : '#dc2626', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {editIsActive ? <Unlock size={15} /> : <Lock size={15} />}
                  {editIsActive ? '🟢 ĐANG MỞ NHẬN GÓP Ý' : '🔴 ĐÃ ĐÓNG GÓP Ý'}
                </button>
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '12px', background: '#854d0e', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                💾 LƯU THAY ĐỔI CÔNG VIỆC
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
