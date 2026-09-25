import { useEffect, useState } from 'react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { 
  FileText, Download, Trash2, Search, Filter, RefreshCw, PlusCircle, 
  CheckCircle2, Clock, Building2, Layers, Edit, ToggleLeft, ToggleRight, 
  X, Lock, Unlock, CheckSquare, AlertTriangle, UserCheck, Eye, ExternalLink,
  FileCheck, FileSpreadsheet, Paperclip, BookOpen
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

// Helper làm sạch description loại bỏ mọi thẻ metadata ẩn
export const getCleanDescription = (desc) => {
  if (!desc) return '';
  return desc
    .replace(/<!--SUB_DOCS_JSON:[\s\S]*?-->/g, '')
    .replace(/<!--FEEDBACK_ITEMS_JSON:[\s\S]*?-->/g, '')
    .trim();
};

const getTopicSubDocs = (topic) => {
  if (!topic) return [];
  if (topic.sub_documents && Array.isArray(topic.sub_documents) && topic.sub_documents.length > 0) {
    return topic.sub_documents;
  }
  const desc = topic.description || '';
  const match = desc.match(/<!--SUB_DOCS_JSON:([\s\S]*?)-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  const titleLower = (topic.title || '').toLowerCase();
  if (titleLower.includes('viên chức') || titleLower.includes('người lao động') || titleLower.includes('hội nghị')) {
    return DEFAULT_HNVC_SUB_DOCS;
  }
  return [];
};

export default function AdminFeedbackSystem() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubDocFilter, setSelectedSubDocFilter] = useState('ALL');
  const [departmentsList, setDepartmentsList] = useState([]);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDispatchNo, setNewDispatchNo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-08-19T23:59');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [newAttachedDocUrl, setNewAttachedDocUrl] = useState('');
  const [newMeetingMinutesUrl, setNewMeetingMinutesUrl] = useState('https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform');
  const [newSubDocsText, setNewSubDocsText] = useState('');

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
  const [editSubDocsText, setEditSubDocsText] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Detail Modal State (Xem chi tiết bảng góp ý của 1 đơn vị)
  const [viewingDetailResponse, setViewingDetailResponse] = useState(null);

  // Đồng bộ danh sách tổ chuyên môn từ CSDL cbq_departments
  const fetchDepartments = async () => {
    try {
      const dbClient = supabaseAdmin || supabase;
      const { data, error } = await dbClient
        .from('cbq_departments')
        .select('*')
        .or('is_active.eq.true,is_active.is.null')
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        const deptNames = data.map(d => d.name ? d.name.trim() : '').filter(Boolean);
        setDepartmentsList(deptNames);
      }
    } catch (err) {
      console.warn("Lỗi nạp danh sách tổ chuyên môn từ DB:", err);
    }
  };

  useEffect(() => {
    fetchTopics(true);
    fetchDepartments();
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
    setSelectedSubDocFilter('ALL');
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

    // Chuyển newSubDocsText thành mảng các văn bản con
    const parsedSubDocs = newSubDocsText.split('\n').map(s => s.trim()).filter(Boolean);
    const cleanDesc = getCleanDescription(newDescription);

    const createdTopic = {
      id: generatedUuid,
      title: newTitle.trim(),
      dispatch_number: newDispatchNo.trim() || '',
      description: cleanDesc,
      deadline: new Date(newDeadline).toISOString(),
      contact_info: newContactInfo.trim() || 'Văn phòng nhà trường',
      attached_doc_url: newAttachedDocUrl.trim() || '',
      meeting_minutes_url: newMeetingMinutesUrl.trim() || '',
      sub_documents: parsedSubDocs,
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
          // Fallback bỏ các cột nâng cao nếu schema chưa có
          const metaSubDocs = parsedSubDocs.length > 0 ? `\n\n<!--SUB_DOCS_JSON:${JSON.stringify(parsedSubDocs)}-->` : '';
          const { meeting_minutes_url, sub_documents, ...legacyTopic } = createdTopic;
          legacyTopic.description = cleanDesc + metaSubDocs;
          const { data: d2 } = await dbClient.from('cbq_feedback_topics').insert([legacyTopic]).select();
          if (d2 && d2.length > 0) inserted = d2[0];
        }
      } catch (e) {
        const metaSubDocs = parsedSubDocs.length > 0 ? `\n\n<!--SUB_DOCS_JSON:${JSON.stringify(parsedSubDocs)}-->` : '';
        const { meeting_minutes_url, sub_documents, ...legacyTopic } = createdTopic;
        legacyTopic.description = cleanDesc + metaSubDocs;
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
      setNewSubDocsText('');
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
    
    // Tách clean description bỏ thẻ metadata
    const rawDesc = topicToEdit.description || '';
    setEditDescription(getCleanDescription(rawDesc));
    
    if (topicToEdit.deadline) {
      const d = new Date(topicToEdit.deadline);
      if (!isNaN(d.getTime())) {
        const formatted = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setEditDeadline(formatted);
      } else {
        setEditDeadline('2026-09-30T23:59');
      }
    } else {
      setEditDeadline('2026-09-30T23:59');
    }

    setEditContactInfo(topicToEdit.contact_info || '');
    setEditAttachedDocUrl(topicToEdit.attached_doc_url || '');
    setEditMeetingMinutesUrl(topicToEdit.meeting_minutes_url || 'https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform');
    
    const existingSubDocs = getTopicSubDocs(topicToEdit);
    setEditSubDocsText(existingSubDocs.join('\n'));
    setEditIsActive(topicToEdit.is_active !== false);

    setShowEditModal(true);
  };

  // SAVE EDITED TOPIC
  const handleSaveEditedTopic = async (e) => {
    e.preventDefault();
    if (!editingTopic) return;

    const parsedSubDocs = editSubDocsText.split('\n').map(s => s.trim()).filter(Boolean);
    const cleanDesc = getCleanDescription(editDescription);

    const updatedData = {
      title: editTitle.trim(),
      dispatch_number: editDispatchNo.trim(),
      description: cleanDesc,
      deadline: new Date(editDeadline).toISOString(),
      contact_info: editContactInfo.trim(),
      attached_doc_url: editAttachedDocUrl.trim(),
      meeting_minutes_url: editMeetingMinutesUrl.trim(),
      sub_documents: parsedSubDocs,
      is_active: editIsActive
    };

    try {
      const dbClient = supabaseAdmin || supabase;
      const { error } = await dbClient
        .from('cbq_feedback_topics')
        .update(updatedData)
        .eq('id', editingTopic.id);

      if (error) {
        const metaSubDocs = parsedSubDocs.length > 0 ? `\n\n<!--SUB_DOCS_JSON:${JSON.stringify(parsedSubDocs)}-->` : '';
        const { meeting_minutes_url, sub_documents, ...legacyData } = updatedData;
        legacyData.description = cleanDesc + metaSubDocs;
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

  // 🌟 XUẤT BÁO CÁO WORD TỰ ĐỘNG GOM NHÓM THEO TỪNG VĂN BẢN CON
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

    const deptResponses = filteredResponses.filter(r => r.organization_unit !== 'Cá nhân Giáo viên / Nhân viên' && r.organization_unit !== 'Đơn vị khác');
    const teacherResponses = filteredResponses.filter(r => r.organization_unit === 'Cá nhân Giáo viên / Nhân viên' || r.organization_unit === 'Đơn vị khác');

    // Thống kê
    const totalResp = filteredResponses.length;
    const countThongNhat = filteredResponses.filter(r => !r.agreement_level || r.agreement_level === 'thong_nhat').length;
    const countSuaDoi = filteredResponses.filter(r => r.agreement_level === 'sua_doi').length;
    const countKhongThongNhat = filteredResponses.filter(r => r.agreement_level === 'khong_thong_nhat').length;

    const percentThongNhat = totalResp > 0 ? Math.round((countThongNhat / totalResp) * 100) : 0;
    const percentSuaDoi = totalResp > 0 ? Math.round((countSuaDoi / totalResp) * 100) : 0;
    const percentKhongThongNhat = totalResp > 0 ? Math.round((countKhongThongNhat / totalResp) * 100) : 0;

    // Gom nhóm toàn bộ mục góp ý chi tiết theo từng Tên văn bản con
    const subDocsMap = new Map();

    deptResponses.forEach(resp => {
      const parsed = parseFeedbackData(resp);
      const orgInfo = `<strong>${resp.organization_unit}</strong><br/><span style="font-size: 10pt; color: #555;">Đại diện: ${resp.representative_name}</span>`;
      const fileLink = resp.attached_file_url ? `<a href="${resp.attached_file_url}" target="_blank">Xem File/BB</a>` : '-';

      if (parsed.items && parsed.items.length > 0) {
        parsed.items.forEach(sub => {
          const docKey = sub.docName || currentTopicObj?.title || 'Dự thảo chung';
          if (!subDocsMap.has(docKey)) subDocsMap.set(docKey, []);
          subDocsMap.get(docKey).push({
            pageLine: sub.pageLine || '-',
            draftContent: sub.draftContent || '-',
            proposedChange: sub.proposedChange || '-',
            reason: sub.reason || '-',
            orgInfo,
            fileLink
          });
        });
      } else {
        const docKey = currentTopicObj?.title || 'Dự thảo chung';
        if (!subDocsMap.has(docKey)) subDocsMap.set(docKey, []);
        subDocsMap.get(docKey).push({
          pageLine: 'Toàn văn',
          draftContent: resp.agreement_level === 'thong_nhat' ? 'Nhất trí 100%' : '-',
          proposedChange: parsed.cleanText || (resp.agreement_level === 'thong_nhat' ? 'Thống nhất toàn bộ' : '-'),
          reason: resp.agreement_level === 'thong_nhat' ? 'Đồng thuận cao' : '-',
          orgInfo,
          fileLink
        });
      }
    });

    // Tạo HTML các bảng theo từng văn bản con
    let groupedTablesHtml = '';
    let docIndex = 1;

    subDocsMap.forEach((items, docTitle) => {
      let rows = items.map((it, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: center; font-weight: bold; color: #0369a1;">${it.pageLine}</td>
          <td style="text-align: justify;">${it.draftContent.replace(/\n/g, '<br/>')}</td>
          <td style="text-align: justify; font-weight: bold; color: #166534; background-color: #f7fee7;">${it.proposedChange.replace(/\n/g, '<br/>')}</td>
          <td style="text-align: justify;">${it.reason.replace(/\n/g, '<br/>')}</td>
          <td>${it.orgInfo}</td>
          <td style="text-align: center;">${it.fileLink}</td>
        </tr>
      `).join('');

      groupedTablesHtml += `
        <h4 style="color: #166534; margin-top: 18px; margin-bottom: 6px; font-size: 12.5pt;">
          ${docIndex++}. VĂN BẢN: ${docTitle.toUpperCase()} (${items.length} lượt góp ý)
        </h4>
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">STT</th>
              <th style="width: 14%;">Trang/dòng (Điều/Khoản)</th>
              <th style="width: 23%;">Nội dung dự thảo</th>
              <th style="width: 25%;">Nội dung đề nghị điều chỉnh</th>
              <th style="width: 18%;">Lý do đề nghị</th>
              <th style="width: 11%;">Tổ chuyên môn & Đại diện</th>
              <th style="width: 5%;">File/BB</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
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
          size: 29.7cm 21.0cm; /* Khổ ngang A4 landscape */
          margin: 1.5cm 1.5cm 1.5cm 2.0cm;
          mso-header-margin: 36.0pt;
          mso-footer-margin: 36.0pt;
          mso-paper-source: 0;
        }
        div.WordSection1 { page: WordSection1; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; color: #000000; }
        table { border-collapse: collapse; width: 100%; margin-top: 8px; margin-bottom: 14px; }
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

        <div class="title">BÁO CÁO TỔNG HỢP Ý KIẾN ĐÓNG GÓP CÁC DỰ THẢO VĂN BẢN</div>
        <div class="subtitle">Về việc: ${currentTopicObj?.title || 'Dự thảo công việc'}<br/>${currentTopicObj?.dispatch_number ? `(${currentTopicObj.dispatch_number})` : ''}</div>

        <p><strong>Kính gửi:</strong> Ban Giám hiệu Trường THPT Cao Bá Quát</p>

        <p style="text-indent: 1cm; text-align: justify;">
          Căn cứ Kế hoạch công tác của Nhà trường, Tổ Văn phòng đã tiến hành thu nhận, tổng hợp và phân loại ý kiến đóng góp của BCH Đảng ủy, Ban Thường vụ Đoàn trường, các Tổ chuyên môn và cá nhân Giáo viên / Nhân viên đối với <strong>"${currentTopicObj?.title || 'Dự thảo công việc'}"</strong>. Kết quả tổng hợp phân loại theo từng văn bản cụ thể như sau:
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

        <h3>II. BẢNG TỔNG HỢP Ý KIẾN CHI TIẾT THEO TỪNG VĂN BẢN / QUY CHẾ CON</h3>
        <p style="font-style: italic; font-size: 10.5pt; color: #444;">(Các ý kiến được phân loại chi tiết theo từng văn bản, quy chế, điều khoản và trang dòng theo đúng quy chuẩn)</p>
        ${subDocsMap.size === 0 ? '<p><em>Chưa có ý kiến góp ý từ các Tổ chuyên môn.</em></p>' : groupedTablesHtml}

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
          Qua tổng hợp ý kiến từ các Tổ chuyên môn và cá nhân Giáo viên, hầu hết các ý kiến đóng góp đều thể hiện tinh thần trách nhiệm cao đối với công tác chung của Nhà trường. Tất cả các ý kiến chi tiết trên đã được phân loại theo từng văn bản để Kính trình Ban Giám Hiệu xem xét, chỉ đạo và hoàn thiện văn bản chính thức trước khi thông qua tại Hội nghị.
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
    let csvContent = "\uFEFFSTT,ĐƠN VỊ GÓP Ý,NGƯỜI ĐẠI DIỆN,SỐ ĐIỆN THOẠI,EMAIL,MỨC ĐỘ THỐNG NHẤT,TÊN VĂN BẢN CON,TRANG/DÒNG,NỘI DUNG DỰ THẢO,NỘI DUNG ĐỀ NGHỊ ĐIỀU CHỈNH,LÝ DO ĐỀ NGHỊ,Ý KIẾN CHUNG,LINK BIÊN BẢN/TỆP ĐÍNH KÈM,NGÀY GỬI\n";
    
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
          content: getCleanDescription(topicObj.description),
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
  const currentSubDocs = getTopicSubDocs(currentTopicObj);
  
  // Danh sách tổ chuyên môn chính thức để theo dõi tiến độ nộp (đồng bộ từ CSDL cbq_departments)
  const officialDepts = departmentsList.length > 0 
    ? departmentsList 
    : DEFAULT_ORGANIZATIONS.filter(org => org !== 'Cá nhân Giáo viên / Nhân viên' && org !== 'Đơn vị khác');

  // Submitted Count for Official Departments
  const submittedCount = officialDepts
    .filter(org => isOrgSubmitted(org, responses)).length;

  const filteredResponses = responses.filter(item => {
    const matchSearch = (item.organization_unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.representative_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.feedback_content || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchSearch) return false;

    if (selectedSubDocFilter !== 'ALL') {
      const parsed = parseFeedbackData(item);
      const matchDoc = parsed.items.some(sub => sub.docName === selectedSubDocFilter);
      return matchDoc;
    }

    return true;
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
            onClick={() => {
              setNewSubDocsText(DEFAULT_HNVC_SUB_DOCS.join('\n'));
              setShowCreateModal(true);
            }}
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
            title="Tải File Báo Cáo Gom Nhóm Từng Văn Bản Con (.doc chuẩn Nghị định 30)"
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
                title="Chỉnh sửa tên công việc, trích yếu, danh sách văn bản con..."
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

        {/* THÔNG TIN VĂN BẢN CON ĐỢT NÀY */}
        {currentSubDocs.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#166534', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #86efac' }}>
            <BookOpen size={16} />
            <span>Đợt này có <strong>{currentSubDocs.length} văn bản / quy chế con</strong>. Giáo viên có thể chọn nhanh từ danh mục khi góp ý.</span>
          </div>
        )}
      </div>

      {/* STATS CHECKLIST OF ORGANIZATIONS */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1.5px solid #cbd5e1', padding: '14px 18px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={16} color="#166534" /> TIẾN ĐỘ NỘP GÓP Ý CHÍNH THỨC CỦA CÁC ĐƠN VỊ & TỔ CHUYÊN MÔN:
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: submittedCount === officialDepts.length ? '#16a34a' : '#0369a1' }}>
            Đã nộp: {submittedCount} / {officialDepts.length} Đơn vị ({officialDepts.length > 0 ? Math.round((submittedCount / officialDepts.length) * 100) : 0}%)
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
          {officialDepts.map((org) => {
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

      {/* SEARCH BAR & FILTER THEO VĂN BẢN CON */}
      <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo Đơn vị, Người đại diện hoặc Nội dung góp ý..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
        </div>

        {/* 🌟 BỘ LỌC THEO VĂN BẢN CON */}
        {currentSubDocs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Lọc văn bản con:</span>
            <select
              value={selectedSubDocFilter}
              onChange={e => setSelectedSubDocFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #166534', fontSize: '13px', fontWeight: 'bold', color: '#166534', background: '#f0fdf4', maxWidth: '300px' }}
            >
              <option value="ALL">-- Tất cả văn bản ({filteredResponses.length} ý kiến) --</option>
              {currentSubDocs.map((sDoc, sIdx) => (
                <option key={sIdx} value={sDoc}>
                  {sIdx + 1}. {sDoc}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* RESPONSES TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách góp ý...</div>
        ) : filteredResponses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có ý kiến góp ý nào phù hợp với bộ lọc tìm kiếm.</div>
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
                              Văn bản: <strong>{parsed.items[0].docName}</strong> ({parsed.items[0].proposedChange})
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

      {/* MODAL XEM CHI TIẾT BẢNG GÓP Ý ĐIỀU CHỈNH THEO DỰ THẢO */}
      {viewingDetailResponse && (() => {
        const parsed = parseFeedbackData(viewingDetailResponse);
        const hasItems = parsed.items && parsed.items.length > 0;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' }}>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '25px', maxWidth: '880px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
              
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

              {hasItems ? (
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', marginBottom: '10px' }}>
                    BẢNG ĐÓNG GÓP Ý KIẾN CHI TIẾT THEO CÁC VĂN BẢN ({parsed.items.length} mục):
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: '16px', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#1e293b', borderBottom: '1.5px solid #cbd5e1' }}>
                          <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }}>STT</th>
                          <th style={{ padding: '8px 10px', width: '24%' }}>Tên dự thảo văn bản con</th>
                          <th style={{ padding: '8px 10px', width: '14%' }}>Trang/dòng</th>
                          <th style={{ padding: '8px 10px', width: '20%' }}>Nội dung dự thảo</th>
                          <th style={{ padding: '8px 10px', width: '23%' }}>Nội dung đề nghị điều chỉnh</th>
                          <th style={{ padding: '8px 10px', width: '15%' }}>Lý do đề nghị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.items.map((sub, sIdx) => (
                          <tr key={sIdx} style={{ borderBottom: '1px solid #e2e8f0', background: sIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 'bold' }}>{sIdx + 1}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#166534' }}>{sub.docName || currentTopicObj?.title || 'Dự thảo'}</td>
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
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '25px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
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
                  placeholder="VD: Góp ý dự thảo các văn bản chuẩn bị Hội nghị Viên chức & NLĐ 2026 - 2027"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Số Hiệu Văn Bản / Căn Cứ (Nếu có)</label>
                <input
                  type="text"
                  placeholder="VD: Kế hoạch số 53/KH-TrTHPTCBQ"
                  value={newDispatchNo}
                  onChange={e => setNewDispatchNo(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 🌟 CẤU HÌNH DANH SÁCH VĂN BẢN CON */}
              <div style={{ marginBottom: '14px', background: '#f0fdf4', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #86efac' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                  📚 Danh Sách Các Văn Bản / Quy Chế Con Cần Góp Ý (Mỗi dòng một văn bản):
                </label>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                  Giáo viên sẽ được chọn nhanh từ danh mục này khi góp ý thay vì phải gõ tay từng tên văn bản
                </div>
                <textarea
                  rows={5}
                  placeholder="Quy chế chi tiêu nội bộ năm học 2026 - 2027&#10;Quy chế thi đua, khen thưởng và xếp loại viên chức&#10;Quy chế quản lý CSVC và thiết bị dạy học..."
                  value={newSubDocsText}
                  onChange={e => setNewSubDocsText(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #86efac', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff', lineHeight: '1.4' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Trích Yếu Nội Dung & Hướng Dẫn Đóng Góp *</label>
                <textarea
                  rows={3}
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
                  placeholder="VD: https://drive.google.com/drive/folders/..."
                  value={newAttachedDocUrl}
                  onChange={e => setNewAttachedDocUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #93c5fd' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                  📁 Link Biểu Mẫu Tiếp Nhận Biên Bản Họp Tổ (Google Form / Drive)
                </label>
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
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '25px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
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

              {/* 🌟 CẤU HÌNH DANH SÁCH VĂN BẢN CON TRONG EDIT */}
              <div style={{ marginBottom: '14px', background: '#f0fdf4', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #86efac' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                  📚 Danh Sách Các Văn Bản / Quy Chế Con Cần Góp Ý (Mỗi dòng một văn bản):
                </label>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                  Chỉnh sửa danh mục văn bản con để giáo viên chọn nhanh từ dropdown
                </div>
                <textarea
                  rows={5}
                  value={editSubDocsText}
                  onChange={e => setEditSubDocsText(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #86efac', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff', lineHeight: '1.4' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Trích Yếu Nội Dung & Hướng Dẫn Đóng Góp *</label>
                <textarea
                  rows={3}
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

              <div style={{ marginBottom: '16px', background: '#eff6ff', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #93c5fd' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                  📁 Link Biểu Mẫu Tiếp Nhận Biên Bản Họp Tổ (Google Form / Drive)
                </label>
                <input
                  type="url"
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
