import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { 
  FileText, Download, Trash2, Search, Filter, RefreshCw, PlusCircle, 
  CheckCircle2, Clock, Building2, Layers, Edit, ToggleLeft, ToggleRight, 
  X, Lock, Unlock, CheckSquare, AlertTriangle, UserCheck, Eye, ExternalLink,
  FileCheck, FileSpreadsheet, Paperclip, BookOpen, Mail, Heart, Sparkles,
  MessageCircle, AlertOctagon, ShieldCheck, User
} from 'lucide-react';

const STUDENT_ASPIRATIONS_TOPIC_ID = 'e98a1000-cb00-4b9a-9000-00000000cb01';

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
  if (!item) return { items: [], cleanText: '', isStudent: false };
  
  const isStudent = item.topic_id === STUDENT_ASPIRATIONS_TOPIC_ID || 
                    (item.feedback_items?.[0]?.category !== undefined && item.feedback_items?.[0]?.docName === undefined);

  if (isStudent) {
    return {
      items: [], // Học sinh gửi tâm tư trực tiếp, không phải đóng góp điều khoản văn bản con
      studentMeta: item.feedback_items?.[0] || {},
      cleanText: item.feedback_content || '',
      isStudent: true
    };
  }

  if (item.feedback_items && Array.isArray(item.feedback_items) && item.feedback_items.length > 0) {
    return {
      items: item.feedback_items,
      cleanText: (item.feedback_content || '').replace(/<!--FEEDBACK_ITEMS_JSON:(.*?)-->/, '').trim(),
      isStudent: false
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
          cleanText: cleanText,
          isStudent: false
        };
      }
    } catch (e) {}
  }

  return {
    items: [],
    cleanText: raw.trim(),
    isStudent: false
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
  const [searchParams, setSearchParams] = useSearchParams();
  const topicIdFromUrl = searchParams.get('topicId');
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

  // Detail Modal State (Xem chi tiết bảng góp ý của 1 đơn vị hoặc phiếu tâm tư học sinh)
  const [viewingDetailResponse, setViewingDetailResponse] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (viewingDetailResponse) {
      const existingNote = viewingDetailResponse.feedback_items?.[0]?.admin_note || '';
      setAdminNoteInput(existingNote);
    } else {
      setAdminNoteInput('');
    }
  }, [viewingDetailResponse]);

  // Lưu ghi chú xử lý của BGH cho tâm tư học sinh
  const handleSaveAdminNote = async () => {
    if (!viewingDetailResponse) return;
    setIsSavingNote(true);
    try {
      const dbClient = supabaseAdmin || supabase;
      const currentItems = viewingDetailResponse.feedback_items && Array.isArray(viewingDetailResponse.feedback_items) && viewingDetailResponse.feedback_items.length > 0
        ? viewingDetailResponse.feedback_items
        : [{}];

      const updatedItems = [
        {
          ...(currentItems[0] || {}),
          admin_note: adminNoteInput.trim(),
          handled_at: new Date().toISOString()
        },
        ...currentItems.slice(1)
      ];

      await dbClient
        .from('cbq_feedback_responses')
        .update({ feedback_items: updatedItems, is_verified: true })
        .eq('id', viewingDetailResponse.id);

      const updatedResp = { ...viewingDetailResponse, feedback_items: updatedItems, is_verified: true };
      setViewingDetailResponse(updatedResp);
      setResponses(prev => prev.map(r => r.id === viewingDetailResponse.id ? updatedResp : r));

      const localKey = `cbq_local_feedback_res_${selectedTopicId}`;
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = local.map(r => r.id === viewingDetailResponse.id ? updatedResp : r);
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      alert('🎉 Đã lưu ghi chú xử lý & đánh dấu Đã tiếp nhận thành công!');
    } catch (err) {
      console.error('Lỗi lưu ghi chú BGH:', err);
      alert('Không thể lưu ghi chú: ' + err.message);
    } finally {
      setIsSavingNote(false);
    }
  };

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

  useEffect(() => {
    if (topicIdFromUrl && topicIdFromUrl !== selectedTopicId) {
      handleTopicChange(topicIdFromUrl);
    }
  }, [topicIdFromUrl]);

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
      const targetId = (topicIdFromUrl && activeTopics.some(t => t.id === topicIdFromUrl))
        ? topicIdFromUrl
        : (selectedTopicId || (activeTopics.length > 0 ? activeTopics[0].id : ''));

      setSelectedTopicId(targetId);
      if (targetId) {
        fetchResponses(targetId);
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

  // 🌟 XUẤT BÁO CÁO EXCEL ĐA SHEET CHUYÊN NGHIỆP & PRO (.XLSX)
  const exportExcel = () => {
    if (responses.length === 0) {
      alert("Không có dữ liệu đóng góp ý kiến để xuất file Excel!");
      return;
    }

    const currentTopicObj = topics.find(t => t.id === selectedTopicId) || topics[0];
    const today = new Date();
    const dayStr = today.getDate().toString().padStart(2, '0');
    const monthStr = (today.getMonth() + 1).toString().padStart(2, '0');
    const yearStr = today.getFullYear();

    // 1. Thống kê tiến độ & phân loại phản hồi
    const totalResp = filteredResponses.length;
    const countThongNhat = filteredResponses.filter(r => !r.agreement_level || r.agreement_level === 'thong_nhat').length;
    const countSuaDoi = filteredResponses.filter(r => r.agreement_level === 'sua_doi').length;
    const countKhongThongNhat = filteredResponses.filter(r => r.agreement_level === 'khong_thong_nhat').length;

    // Đếm tổng số mục góp ý chi tiết
    let totalDetailedItems = 0;
    filteredResponses.forEach(r => {
      const parsed = parseFeedbackData(r);
      if (parsed.items && parsed.items.length > 0) {
        totalDetailedItems += parsed.items.length;
      }
    });

    const workbook = XLSX.utils.book_new();

    // ==========================================
    // SHEET 1: TỔNG HỢP & TIẾN ĐỘ TỔ CHUYÊN MÔN
    // ==========================================
    const sheet1Rows = [
      ["SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", "", "", "", ""],
      ["TRƯỜNG THPT CAO BÁ QUÁT", "", "", "", "Độc lập - Tự do - Hạnh phúc", "", "", "", ""],
      [`Số: ... /BC-THPTCBQ`, "", "", "", `Đắk Lắk, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`, "", "", "", ""],
      [],
      ["BÁO CÁO TỔNG HỢP TIẾN ĐỘ & MỨC ĐỘ ĐỒNG THUẬN ĐÓNG GÓP Ý KIẾN DỰ THẢO"],
      [`Về việc: ${currentTopicObj?.title || 'Dự thảo văn bản'}`],
      [`Thời hạn tiếp nhận: ${currentTopicObj?.deadline ? new Date(currentTopicObj.deadline).toLocaleString('vi-VN') : 'Theo thông báo'} | Cán bộ phụ trách: ${currentTopicObj?.contact_info || 'Ban thư ký'}`],
      [],
      ["I. BẢNG TỔNG HỢP CHỈ SỐ TIẾN ĐỘ & MỨC ĐỘ ĐỒNG THUẬN"],
      ["STT", "Chỉ Số Đánh Giá", "Số Lượng", "Tỷ Lệ (%)", "Đánh Giá & Phân Loại"],
      [1, "Tổng số Tổ chuyên môn chính thức thuộc trường", officialDepts.length, "100%", "9 Tổ chuyên môn thực tế theo mô hình liên tổ"],
      [2, "Số Tổ chuyên môn ĐÃ NỘP ý kiến chính thức", submittedCount, `${officialDepts.length > 0 ? ((submittedCount / officialDepts.length) * 100).toFixed(1) : 0}%`, submittedCount === officialDepts.length ? "Đạt 100% tiến độ" : `Còn ${officialDepts.length - submittedCount} tổ chưa gửi`],
      [3, "Số Tổ chuyên môn CHƯA NỘP ý kiến", officialDepts.length - submittedCount, `${officialDepts.length > 0 ? (((officialDepts.length - submittedCount) / officialDepts.length) * 100).toFixed(1) : 0}%`, officialDepts.length - submittedCount === 0 ? "Đã nộp đầy đủ" : "Cần liên hệ đôn đốc gửi gấp"],
      [4, "Tổng số lượt phản hồi đã tiếp nhận (bao gồm cá nhân)", totalResp, "100%", "Tổng số phiếu nộp trên hệ thống"],
      [5, "Mức độ: Thống nhất hoàn toàn (Đồng ý 100%)", countThongNhat, `${totalResp > 0 ? ((countThongNhat / totalResp) * 100).toFixed(1) : 0}%`, "Nhất trí cao với toàn văn các dự thảo"],
      [6, "Mức độ: Thống nhất nhưng có đề xuất sửa đổi", countSuaDoi, `${totalResp > 0 ? ((countSuaDoi / totalResp) * 100).toFixed(1) : 0}%`, "Có ý kiến đề nghị điều chỉnh văn bản con"],
      [7, "Mức độ: Chưa thống nhất / Đề nghị xem xét lại", countKhongThongNhat, `${totalResp > 0 ? ((countKhongThongNhat / totalResp) * 100).toFixed(1) : 0}%`, "Cần giải trình và thảo luận tại Hội nghị"],
      [8, "Tổng số điều khoản / câu từ đề nghị điều chỉnh", totalDetailedItems, "-", "Chi tiết được tổng hợp tại Sheet 2"],
      [],
      ["II. THEO DÕI TIẾN ĐỘ & TỔNG HỢP THEO TỪNG TỔ CHUYÊN MÔN"],
      [
        "STT", 
        "Tên Tổ Chuyên Môn / Đơn Vị", 
        "Trạng Thái Nộp", 
        "Người Đại Diện / Giáo Viên", 
        "Số Điện Thoại", 
        "Email Liên Hệ", 
        "Mức Độ Đồng Thuận", 
        "Số Mục Góp Ý", 
        "Biên Bản Họp Tổ (Scan/Link Drive)", 
        "Thời Gian Gửi Phiếu"
      ]
    ];

    // Điền dữ liệu 9 tổ chuyên môn chính thức
    officialDepts.forEach((dept, idx) => {
      const resp = responses.find(r => r.organization_unit === dept);
      if (resp) {
        const parsed = parseFeedbackData(resp);
        const levelLabel = resp.agreement_level === 'sua_doi' 
          ? '🟡 Có đề xuất sửa đổi' 
          : (resp.agreement_level === 'khong_thong_nhat' ? '🔴 Chưa thống nhất' : '🟢 Thống nhất 100%');
        const itemCount = parsed.items ? parsed.items.length : 0;
        const fileUrl = resp.meeting_minutes_file_url || resp.attached_file_url || (resp.meeting_minutes_url ? 'Nộp qua Form tiếp nhận' : 'Chưa đính kèm');

        sheet1Rows.push([
          idx + 1,
          dept,
          "✅ ĐÃ NỘP",
          resp.representative_name || '',
          resp.phone || '',
          resp.email || '',
          levelLabel,
          itemCount,
          fileUrl,
          new Date(resp.created_at).toLocaleString('vi-VN')
        ]);
      } else {
        sheet1Rows.push([
          idx + 1,
          dept,
          "⏳ CHƯA NỘP",
          "-",
          "-",
          "-",
          "Chưa gửi",
          0,
          "Chưa có",
          "-"
        ]);
      }
    });

    // Thêm các đơn vị ngoài tổ hoặc cá nhân (nếu có)
    const extraResponses = filteredResponses.filter(r => !officialDepts.includes(r.organization_unit));
    if (extraResponses.length > 0) {
      sheet1Rows.push([]);
      sheet1Rows.push(["III. Ý KIẾN ĐÓNG GÓP TỪ CÁC ĐƠN VỊ KHÁC / CÁ NHÂN GIÁO VIÊN"]);
      sheet1Rows.push([
        "STT", 
        "Đơn Vị / Đối Tượng", 
        "Trạng Thái Nộp", 
        "Họ Và Tên Người Gửi", 
        "Số Điện Thoại", 
        "Email Liên Hệ", 
        "Mức Độ Đồng Thuận", 
        "Số Mục Góp Ý", 
        "Biên Bản / Tệp Đính Kèm", 
        "Thời Gian Gửi Phiếu"
      ]);

      extraResponses.forEach((resp, eIdx) => {
        const parsed = parseFeedbackData(resp);
        const levelLabel = resp.agreement_level === 'sua_doi' 
          ? '🟡 Có đề xuất sửa đổi' 
          : (resp.agreement_level === 'khong_thong_nhat' ? '🔴 Chưa thống nhất' : '🟢 Thống nhất 100%');
        const itemCount = parsed.items ? parsed.items.length : 0;
        const fileUrl = resp.meeting_minutes_file_url || resp.attached_file_url || 'Không';

        sheet1Rows.push([
          eIdx + 1,
          resp.organization_unit || 'Cá nhân',
          "✅ ĐÃ NỘP",
          resp.representative_name || '',
          resp.phone || '',
          resp.email || '',
          levelLabel,
          itemCount,
          fileUrl,
          new Date(resp.created_at).toLocaleString('vi-VN')
        ]);
      });
    }

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
    ws1['!cols'] = [
      { wch: 6 },  // STT
      { wch: 28 }, // Tên tổ
      { wch: 16 }, // Trạng thái
      { wch: 26 }, // Người đại diện
      { wch: 15 }, // SĐT
      { wch: 28 }, // Email
      { wch: 26 }, // Mức độ
      { wch: 14 }, // Số mục góp ý
      { wch: 45 }, // Biên bản
      { wch: 22 }  // Thời gian
    ];
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 0, c: 4 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 1, c: 4 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
      { s: { r: 2, c: 4 }, e: { r: 2, c: 8 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } },
      { s: { r: 6, c: 0 }, e: { r: 6, c: 8 } },
      { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } },
      { s: { r: 19, c: 0 }, e: { r: 19, c: 9 } }
    ];
    XLSX.utils.book_append_sheet(workbook, ws1, "TONG_HOP_TIEN_DO");

    // =========================================================================
    // SHEET 2: BẢNG GÓP Ý CHI TIẾT THEO VĂN BẢN CON (GOM NHÓM CHUẨN NGHỊ ĐỊNH 30)
    // =========================================================================
    const sheet2Rows = [
      ["SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", "", "", "", "", ""],
      ["TRƯỜNG THPT CAO BÁ QUÁT", "", "", "", "Độc lập - Tự do - Hạnh phúc", "", "", "", "", ""],
      [],
      ["BẢNG TỔNG HỢP CHI TIẾT Ý KIẾN ĐÓNG GÓP ĐIỀU CHỈNH THEO TỪNG VĂN BẢN DỰ THẢO"],
      ["(Phục vụ Ban Giám hiệu, Ban Soạn thảo và Đoàn Chủ tịch Hội nghị xem xét, tiếp thu & giải trình)"],
      [`Chủ đề: ${currentTopicObj?.title || 'Dự thảo văn bản'}`],
      [],
      [
        "STT",
        "Tên Dự Thảo Văn Bản Con / Quy Chế",
        "Vị Trí Cần Sửa (Trang / Dòng / Điều)",
        "Nội Dung Dự Thảo Hiện Tại (Trích dẫn)",
        "Nội Dung Đề Nghị Điều Chỉnh / Bổ Sung (Đề xuất)",
        "Lý Do Đề Nghị & Căn Cứ Thực Tiễn",
        "Đơn Vị Đề Xuất (Tổ chuyên môn)",
        "Người Đại Diện Góp Ý",
        "Ý Kiến Nhận Xét Chung Của Tổ",
        "Ý Kiến Tiếp Thu / Giải Trình Của Ban Soạn Thảo (Ghi chú)"
      ]
    ];

    // Gom dữ liệu theo từng mục
    let detailRowIndex = 1;
    let detailItemsList = [];

    filteredResponses.forEach(item => {
      const parsed = parseFeedbackData(item);
      if (parsed.items && parsed.items.length > 0) {
        parsed.items.forEach(subItem => {
          detailItemsList.push({
            docName: subItem.docName || currentTopicObj?.title || 'Dự thảo chung',
            pageLine: subItem.pageLine || 'Toàn văn',
            draftContent: subItem.draftContent || '(Không trích đoạn)',
            proposedChange: subItem.proposedChange || '(Không ghi nội dung sửa)',
            reason: subItem.reason || '(Không ghi lý do)',
            org: item.organization_unit || 'Chưa rõ',
            author: item.representative_name || '',
            generalComment: parsed.cleanText || item.generalComment || ''
          });
        });
      } else {
        // Những đơn vị thống nhất 100% hoặc chỉ có nhận xét chung
        detailItemsList.push({
          docName: currentTopicObj?.title || 'Toàn bộ các dự thảo',
          pageLine: 'Toàn văn',
          draftContent: 'Nhất trí toàn văn các dự thảo',
          proposedChange: item.agreement_level === 'thong_nhat' ? 'Thống nhất 100%, không có yêu cầu điều chỉnh' : (parsed.cleanText || 'Đồng ý'),
          reason: 'Đồng thuận cao trong toàn thể tổ',
          org: item.organization_unit || 'Chưa rõ',
          author: item.representative_name || '',
          generalComment: parsed.cleanText || item.generalComment || ''
        });
      }
    });

    // Sắp xếp các mục theo Tên văn bản con để các ý kiến của cùng một quy chế được gom lại với nhau
    detailItemsList.sort((a, b) => a.docName.localeCompare(b.docName, 'vi'));

    detailItemsList.forEach(di => {
      sheet2Rows.push([
        detailRowIndex++,
        di.docName,
        di.pageLine,
        di.draftContent,
        di.proposedChange,
        di.reason,
        di.org,
        di.author,
        di.generalComment,
        "" // Cột để trống cho Ban soạn thảo phê duyệt / ghi chú tiếp thu
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
    ws2['!cols'] = [
      { wch: 6 },  // STT
      { wch: 32 }, // Tên văn bản con
      { wch: 22 }, // Vị trí
      { wch: 45 }, // Nội dung dự thảo
      { wch: 48 }, // Nội dung điều chỉnh
      { wch: 40 }, // Lý do
      { wch: 25 }, // Đơn vị
      { wch: 22 }, // Người đại diện
      { wch: 30 }, // Ý kiến chung
      { wch: 36 }  // Ý kiến tiếp thu
    ];
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 0, c: 4 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 1, c: 4 }, e: { r: 1, c: 8 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 9 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 9 } }
    ];
    // Bật Auto-Filter cho bảng góp ý từ hàng tiêu đề
    if (detailItemsList.length > 0) {
      ws2['!autofilter'] = { ref: `A8:J${7 + detailItemsList.length}` };
    }
    XLSX.utils.book_append_sheet(workbook, ws2, "CHI_TIET_THEO_VAN_BAN");

    // =========================================================================
    // SHEET 3: DỮ LIỆU GỐC TẤT CẢ PHIẾU (RAW DATA VỚI ĐẦY ĐỦ THÔNG TIN LIÊN HỆ)
    // =========================================================================
    const sheet3Rows = [
      ["DANH SÁCH CHI TIẾT TẤT CẢ PHIẾU GÓP Ý TIẾP NHẬN TỪ HỆ THỐNG TRỰC TUYẾN"],
      [`Thời gian xuất: ${new Date().toLocaleString('vi-VN')} | Tổng số phiếu: ${filteredResponses.length} phiếu`],
      [],
      [
        "STT",
        "Mã Phiếu / ID",
        "Thời Gian Gửi",
        "Đơn Vị / Tổ Chuyên Môn",
        "Họ Và Tên Người Đại Diện",
        "Số Điện Thoại",
        "Email Liên Hệ",
        "Mức Độ Thống Nhất",
        "Số Lượng Mục Góp Ý",
        "Nội Dung Nhận Xét Chung Của Tổ",
        "Link File Scan Biên Bản Họp Tổ",
        "Trạng Thái Tiếp Nhận"
      ]
    ];

    filteredResponses.forEach((item, rIdx) => {
      const parsed = parseFeedbackData(item);
      const levelLabel = item.agreement_level === 'sua_doi' 
        ? 'Có đề xuất sửa đổi' 
        : (item.agreement_level === 'khong_thong_nhat' ? 'Không thống nhất' : 'Thống nhất hoàn toàn');
      const itemCount = parsed.items ? parsed.items.length : 0;
      const fileUrl = item.meeting_minutes_file_url || item.attached_file_url || '';

      sheet3Rows.push([
        rIdx + 1,
        item.id || `P-${rIdx + 1}`,
        new Date(item.created_at).toLocaleString('vi-VN'),
        item.organization_unit || '',
        item.representative_name || '',
        item.phone || '',
        item.email || '',
        levelLabel,
        itemCount,
        parsed.cleanText || item.generalComment || '',
        fileUrl,
        item.is_approved ? 'Đã duyệt' : 'Đã tiếp nhận'
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
    ws3['!cols'] = [
      { wch: 6 },  // STT
      { wch: 25 }, // Mã phiếu
      { wch: 20 }, // Thời gian gửi
      { wch: 28 }, // Đơn vị
      { wch: 24 }, // Người đại diện
      { wch: 15 }, // SĐT
      { wch: 26 }, // Email
      { wch: 22 }, // Mức độ
      { wch: 14 }, // Số lượng
      { wch: 40 }, // Nhận xét chung
      { wch: 40 }, // Link biên bản
      { wch: 18 }  // Trạng thái
    ];
    ws3['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }
    ];
    if (filteredResponses.length > 0) {
      ws3['!autofilter'] = { ref: `A4:L${3 + filteredResponses.length}` };
    }
    XLSX.utils.book_append_sheet(workbook, ws3, "DANH_SACH_PHIEU_GOP_Y");

    // Xuất file .xlsx
    const cleanTitle = (currentTopicObj?.title || 'CONG_VIEC')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 35);
    const fileName = `Bao_Cao_Tong_Hop_Gop_Y_${cleanTitle}_${yearStr}${monthStr}${dayStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const exportCSV = exportExcel;

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
            onClick={exportExcel}
            style={{ padding: '9px 16px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2,132,199,0.2)' }}
            title="Tải Báo Cáo Tổng Hợp Excel Chuyên Nghiệp (.xlsx Pro - 3 Sheet Đầy Đủ)"
          >
            <Download size={16} /> 📊 Xuất Bảng Tính Excel (.xlsx Pro)
          </button>
        </div>
      </div>

      {/* QUICK MODE SWITCHER: VĂN BẢN DỰ THẢO vs HÒM THƯ TÂM TƯ HỌC SINH */}
      {(() => {
        const isStudentTopic = selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID;
        const totalAspirations = responses.length;
        const urgentCount = responses.filter(r => (r.agreement_level === 'phan_anh_khan_cap' || (r.feedback_content || '').toLowerCase().includes('khẩn cấp') || r.feedback_items?.some(i => i.urgency === 'Khẩn cấp'))).length;
        const anonCount = responses.filter(r => (r.organization_unit || '').includes('Ẩn danh') || (r.representative_name || '').includes('Ẩn danh')).length;
        const namedCount = totalAspirations - anonCount;

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  if (isStudentTopic) {
                    const other = topics.find(t => t.id !== STUDENT_ASPIRATIONS_TOPIC_ID) || topics[0];
                    if (other) handleTopicChange(other.id);
                  }
                }}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: !isStudentTopic ? '2.5px solid #166534' : '1px solid #cbd5e1',
                  background: !isStudentTopic ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
                  color: !isStudentTopic ? '#166534' : '#64748b',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: !isStudentTopic ? '0 4px 14px rgba(22,101,52,0.15)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Layers size={18} />
                <span>📂 Các Đề Án & Dự Thảo Văn Bản Chung</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isStudentTopic) {
                    handleTopicChange(STUDENT_ASPIRATIONS_TOPIC_ID);
                  }
                }}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: isStudentTopic ? '2.5px solid #e11d48' : '1px solid #cbd5e1',
                  background: isStudentTopic ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' : '#ffffff',
                  color: isStudentTopic ? '#be123c' : '#64748b',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isStudentTopic ? '0 4px 14px rgba(225,29,72,0.18)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Mail size={18} color={isStudentTopic ? '#e11d48' : '#64748b'} />
                <span>💌 Hòm Thư Tâm Tư & Nguyện Vọng Học Sinh (AI)</span>
                {isStudentTopic && totalAspirations > 0 && (
                  <span style={{ backgroundColor: '#e11d48', color: '#ffffff', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '900' }}>
                    {totalAspirations} thư
                  </span>
                )}
              </button>
            </div>

            {/* CHỌN & ĐIỀU CHỈNH CÔNG VIỆC / ĐỀ ÁN CẦN TỔNG HỢP */}
            <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '16px', border: isStudentTopic ? '2px solid #fda4af' : '1.5px solid #cbd5e1', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: isStudentTopic ? '#be123c' : '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isStudentTopic ? <Mail size={18} color="#e11d48" /> : <Layers size={18} color="#166534" />}
                  {isStudentTopic ? 'ĐANG THEO DÕI: HÒM THƯ TÂM TƯ & NGUYỆN VỌNG HỌC SINH (TIẾP NHẬN TỪ TRỢ LÝ AI CBQ)' : 'CHỌN CÔNG VIỆC / ĐỀ ÁN CẦN TỔNG HỢP VÀ ĐIỀU CHỈNH:'}
                </div>

                {currentTopicObj && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {isStudentTopic ? (
                      <button
                        onClick={() => {
                          const text = `📢 HÒM THƯ TÂM TƯ & NGUYỆN VỌNG HỌC SINH TRƯỜNG THPT CAO BÁ QUÁT\n👉 Các em học sinh có thể gửi tâm sự, kiến nghị cơ sở vật chất hoặc ý kiến đóng góp cho Ban Giám Hiệu tại Trợ lý AI trên Cổng thông tin: https://thptcaobaquat.vercel.app/\n🔒 Bảo mật & Ẩn danh tuyệt đối 100%!`;
                          navigator.clipboard.writeText(text);
                          alert("📋 Đã copy link và mẫu thông báo Hòm thư học sinh vào bộ nhớ tạm!");
                        }}
                        style={{ padding: '6px 14px', background: '#e11d48', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(225,29,72,0.2)' }}
                      >
                        📢 Copy Link Hòm Thư
                      </button>
                    ) : (
                      <>
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
                      </>
                    )}

                    <button
                      onClick={openEditTopicModal}
                      style={{ padding: '6px 14px', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      title="Chỉnh sửa thông tin hòm thư / công việc..."
                    >
                      <Edit size={15} /> ✏️ Cấu Hình
                    </button>
                  </div>
                )}
              </div>

              <select
                value={selectedTopicId}
                onChange={e => handleTopicChange(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: isStudentTopic ? '2px solid #e11d48' : '2px solid #166534', fontSize: '14.5px', fontWeight: 'bold', color: isStudentTopic ? '#be123c' : '#14532d', background: isStudentTopic ? '#fff1f2' : '#f0fdf4' }}
              >
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id === STUDENT_ASPIRATIONS_TOPIC_ID ? '💌 ' : '📄 '}
                    {t.title} {t.dispatch_number ? `(${t.dispatch_number})` : ''} {!t.is_active ? ' [ĐÃ ĐÓNG]' : ''}
                  </option>
                ))}
              </select>

              {/* THÔNG TIN VĂN BẢN CON ĐỢT NÀY */}
              {currentSubDocs.length > 0 && !isStudentTopic && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#166534', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #86efac' }}>
                  <BookOpen size={16} />
                  <span>Đợt này có <strong>{currentSubDocs.length} văn bản / quy chế con</strong>. Giáo viên có thể chọn nhanh từ danh mục khi góp ý.</span>
                </div>
              )}
            </div>

            {/* DASHBOARD THỐNG KÊ (HỌC SINH vs TỔ CHUYÊN MÔN) */}
            {isStudentTopic ? (
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fecdd3', padding: '18px 20px', marginBottom: '20px', boxShadow: '0 4px 14px rgba(225,29,72,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#881337', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={18} color="#e11d48" /> THỐNG KÊ TỔNG QUAN TÂM TƯ & NGUYỆN VỌNG HỌC SINH CBQ:
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={14} color="#f59e0b" /> Tự động phân loại qua Trợ lý AI
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>💌 Tổng Số Thư Nhận Được</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{totalAspirations} thư</div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#fff1f2', borderRadius: '12px', border: '1.5px solid #fecdd3' }}>
                    <div style={{ fontSize: '12px', color: '#be123c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={14} /> 🚨 Cần BGH Can Thiệp Gấp
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#e11d48', marginTop: '4px' }}>
                      {urgentCount} thư
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #a7f3d0' }}>
                    <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} /> 🔒 Gửi Ẩn Danh Bảo Mật
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                      {anonCount} thư
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#eff6ff', borderRadius: '12px', border: '1.5px solid #bfdbfe' }}>
                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={14} /> 👤 Ghi Rõ Họ Tên & Lớp
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563eb', marginTop: '4px' }}>
                      {namedCount} thư
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </>
        );
      })()}

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
                <tr style={{ background: selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID ? '#be123c' : '#166534', color: '#ffffff' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '40px' }}>STT</th>
                  <th style={{ padding: '12px 10px' }}>{selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID ? 'HỌC SINH / LỚP' : 'ĐƠN VỊ / TỔ CHUYÊN MÔN'}</th>
                  <th style={{ padding: '12px 10px' }}>{selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID ? 'THỜI GIAN GỬI' : 'NGƯỜI ĐẠI DIỆN'}</th>
                  <th style={{ padding: '12px 10px' }}>{selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID ? 'CHỦ ĐỀ & MỨC ĐỘ' : 'MỨC ĐỘ THỐNG NHẤT'}</th>
                  <th style={{ padding: '12px 10px' }}>{selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID ? 'NỘI DUNG TÂM TƯ / KIẾN NGHỊ' : 'NỘI DUNG GÓP Ý DỰ THẢO'}</th>
                  {selectedTopicId !== STUDENT_ASPIRATIONS_TOPIC_ID && <th style={{ padding: '12px 10px' }}>BIÊN BẢN / FILE</th>}
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>{selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID ? 'XEM TÂM TƯ' : 'CHI TIẾT'}</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>{selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID ? 'TIẾP NHẬN' : 'DUYỆT BC'}</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>XÓA</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((item, idx) => {
                  const isVerified = item.is_verified !== false;
                  const parsed = parseFeedbackData(item);
                  const hasStructuredItems = parsed.items && parsed.items.length > 0;
                  const isStudentTopic = selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID;
                  const isAnonymous = (item.organization_unit || '').includes('Ẩn danh') || (item.representative_name || '').includes('Ẩn danh');
                  const isUrgent = item.agreement_level === 'phan_anh_khan_cap' || (item.feedback_content || '').toLowerCase().includes('khẩn cấp') || item.feedback_items?.[0]?.urgency === 'Khẩn cấp';
                  const isConcern = item.feedback_items?.[0]?.urgency === 'Cần quan tâm';

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: isUrgent ? '#fff1f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc') }}>
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                      
                      {/* Cột Đơn vị / Học sinh */}
                      <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>
                        {isStudentTopic ? (
                          <div>
                            {isAnonymous ? (
                              <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <ShieldCheck size={12} /> Ẩn danh bảo mật
                              </span>
                            ) : (
                              <span style={{ color: '#1e3a8a', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={13} color="#2563eb" /> {item.representative_name}
                              </span>
                            )}
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', fontWeight: 'normal' }}>
                              {item.organization_unit}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: item.organization_unit === 'Cá nhân Giáo viên / Nhân viên' ? '#0369a1' : '#166534' }}>
                            {item.organization_unit}
                          </span>
                        )}
                      </td>

                      {/* Cột Người đại diện / Thời gian */}
                      <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1e293b' }}>
                        {isStudentTopic ? (
                          <div>
                            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }}>
                              {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                              {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        ) : (
                          <>
                            {item.representative_name}
                            {item.phone && <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'normal' }}>SĐT: {item.phone}</div>}
                          </>
                        )}
                      </td>

                      {/* Cột Mức độ / Chủ đề */}
                      <td style={{ padding: '12px 10px' }}>
                        {isStudentTopic ? (
                          <div>
                            {isUrgent ? (
                              <span style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                🚨 KHẨN CẤP
                              </span>
                            ) : isConcern ? (
                              <span style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
                                🟡 Cần quan tâm
                              </span>
                            ) : (
                              <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
                                🟢 Bình thường
                              </span>
                            )}
                            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px', fontWeight: '600' }}>
                              {item.feedback_items?.[0]?.category || item.agreement_level}
                            </div>
                          </div>
                        ) : (
                          item.agreement_level === 'khong_thong_nhat' ? (
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
                          )
                        )}
                      </td>

                      {/* Cột Nội dung */}
                      <td style={{ padding: '12px 10px', color: '#334155', maxWidth: isStudentTopic ? '420px' : '340px' }}>
                        {hasStructuredItems && !isStudentTopic ? (
                          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '8px 10px' }}>
                            <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileSpreadsheet size={14} /> Có {parsed.items.length} mục góp ý chi tiết theo bảng
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Văn bản: <strong>{parsed.items[0].docName}</strong> ({parsed.items[0].proposedChange})
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: isStudentTopic ? '#fffdfa' : '#ffffff', padding: '8px 12px', borderRadius: '8px', border: isStudentTopic ? '1px solid #fecdd3' : '1px solid #e2e8f0', fontSize: '13px', lineHeight: '1.5', maxHeight: '85px', overflowY: 'auto', fontWeight: isStudentTopic ? '600' : 'normal', color: '#0f172a' }}>
                            {parsed.cleanText || item.feedback_content}
                          </div>
                        )}
                      </td>

                      {/* Cột Biên bản / File - Chỉ hiện với các công việc thường, ẩn với học sinh */}
                      {!isStudentTopic && (
                        <td style={{ padding: '12px 10px' }}>
                          {item.attached_file_url ? (
                            <a href={item.attached_file_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Paperclip size={13} /> Xem File
                            </a>
                          ) : '-'}
                        </td>
                      )}

                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => setViewingDetailResponse(item)}
                          style={{
                            padding: isStudentTopic ? '6px 12px' : '5px 10px',
                            borderRadius: '8px',
                            border: isStudentTopic ? '1.5px solid #fecdd3' : '1px solid #cbd5e1',
                            background: isStudentTopic ? '#fff1f2' : '#ffffff',
                            color: isStudentTopic ? '#be123c' : '#0f172a',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: isStudentTopic ? '0 2px 6px rgba(225,29,72,0.12)' : 'none'
                          }}
                          title={isStudentTopic ? 'Xem phiếu tâm tư chi tiết của học sinh' : 'Xem chi tiết toàn bộ bảng góp ý'}
                        >
                          {isStudentTopic ? <Mail size={13} color="#e11d48" /> : <Eye size={13} color="#0284c7" />}
                          <span>{isStudentTopic ? 'Xem Thư' : 'Xem'}</span>
                        </button>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleVerified(item.id, isVerified)}
                          style={{ padding: '4px 10px', borderRadius: '16px', border: 'none', background: isVerified ? '#dcfce7' : '#fef9c3', color: isVerified ? '#166534' : '#854d0e', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title={isStudentTopic ? 'Bấm để đánh dấu đã tiếp nhận hoặc chờ giải quyết' : 'Bấm để duyệt hoặc bỏ duyệt đưa vào Báo cáo Word'}
                        >
                          {isVerified ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {isVerified ? (isStudentTopic ? '✅ Đã nhận' : '✅ Đã duyệt') : '⏳ Chờ'}
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

      {/* MODAL XEM CHI TIẾT GÓP Ý HOẶC TÂM TƯ HỌC SINH */}
      {viewingDetailResponse && (() => {
        const parsed = parseFeedbackData(viewingDetailResponse);
        const isStudentResp = viewingDetailResponse.topic_id === STUDENT_ASPIRATIONS_TOPIC_ID || 
                              selectedTopicId === STUDENT_ASPIRATIONS_TOPIC_ID ||
                              parsed.isStudent;

        const isAnonymous = (viewingDetailResponse.organization_unit || '').includes('Ẩn danh') || 
                            (viewingDetailResponse.representative_name || '').includes('Ẩn danh');
        const isUrgent = viewingDetailResponse.agreement_level === 'phan_anh_khan_cap' || 
                         (viewingDetailResponse.feedback_content || '').toLowerCase().includes('khẩn cấp') || 
                         viewingDetailResponse.feedback_items?.[0]?.urgency === 'Khẩn cấp';
        const isConcern = viewingDetailResponse.feedback_items?.[0]?.urgency === 'Cần quan tâm';
        const categoryLabel = viewingDetailResponse.feedback_items?.[0]?.category || viewingDetailResponse.agreement_level || 'Chung';
        const currentAdminNote = viewingDetailResponse.feedback_items?.[0]?.admin_note || '';

        // NẾU LÀ HÒM THƯ TÂM TƯ HỌC SINH: HIỂN THỊ PHIẾU TIẾP NHẬN CHUẨN SƯ PHẠM
        if (isStudentResp) {
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                maxWidth: '720px',
                width: '100%',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                overflow: 'hidden'
              }}>
                {/* Header Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #881337 0%, #be123c 50%, #e11d48 100%)',
                  padding: '20px 24px',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 14px rgba(136, 19, 55, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      border: '1.5px solid rgba(255, 255, 255, 0.35)'
                    }}>
                      <Mail size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '0.3px', color: '#ffffff' }}>
                          PHIẾU TIẾP NHẬN TÂM TƯ & NGUYỆN VỌNG HỌC SINH
                        </h3>
                        <span style={{
                          fontSize: '11px',
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: '800'
                        }}>
                          BGH & ĐOÀN TRƯỜNG
                        </span>
                      </div>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.9)' }}>
                        Cổng Quản Trị & Lắng Nghe Trực Tuyến — Trường THPT Cao Bá Quát
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setViewingDetailResponse(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body chính */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  
                  {/* 4 Thẻ tổng quan */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>👤 Người Gửi:</div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>
                        {isAnonymous ? '🔒 Ẩn danh bảo mật' : (viewingDetailResponse.representative_name || 'Học sinh CBQ')}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>🏫 Chi Đoàn / Lớp:</div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>
                        {viewingDetailResponse.organization_unit || 'Toàn trường'}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>⚡ Mức Độ Cần Hỗ Trợ:</div>
                      <div style={{ marginTop: '3px' }}>
                        {isUrgent ? (
                          <span style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '2px 8px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '900' }}>
                            🚨 KHẨN CẤP
                          </span>
                        ) : isConcern ? (
                          <span style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '2px 8px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800' }}>
                            🟡 Cần quan tâm
                          </span>
                        ) : (
                          <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800' }}>
                            🟢 Bình thường
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>🕒 Thời Gian Tiếp Nhận:</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '3px' }}>
                        {new Date(viewingDetailResponse.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  {/* Thẻ Chủ đề */}
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '700' }}>
                      📌 Chủ đề tâm tư: <span style={{ color: '#1e3a8a', fontWeight: '900' }}>{categoryLabel}</span>
                    </div>
                    {viewingDetailResponse.phone && viewingDetailResponse.phone !== 'Bảo mật' && (
                      <div style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: '600' }}>
                        📞 SĐT / Zalo: <strong>{viewingDetailResponse.phone}</strong>
                      </div>
                    )}
                  </div>

                  {/* NỘI DUNG TÂM TƯ HỌC SINH */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#881337', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Heart size={16} color="#e11d48" />
                        NỘI DUNG TÂM TƯ / NGUYỆN VỌNG HỌC SINH GỬI BGH:
                      </div>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {(viewingDetailResponse.feedback_content || '').length} ký tự
                      </span>
                    </div>

                    <div style={{
                      background: '#fffdfa',
                      border: '2px solid #fecdd3',
                      borderRadius: '16px',
                      padding: '20px 22px',
                      boxShadow: '0 4px 15px rgba(225, 29, 72, 0.05)',
                      fontSize: '15.5px',
                      lineHeight: '1.8',
                      color: '#0f172a',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      fontWeight: '500'
                    }}>
                      {viewingDetailResponse.feedback_content || 'Không có nội dung'}
                    </div>
                  </div>

                  {/* TIẾN ĐỘ XỬ LÝ & GHI CHÚ NỘI BỘ BGH */}
                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} color="#166534" />
                        TIẾN ĐỘ XỬ LÝ CỦA BAN GIÁM HIỆU & ĐOÀN TRƯỜNG:
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleVerified(viewingDetailResponse.id, viewingDetailResponse.is_verified !== false)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: 'none',
                          background: viewingDetailResponse.is_verified !== false ? '#dcfce7' : '#fef9c3',
                          color: viewingDetailResponse.is_verified !== false ? '#166534' : '#854d0e',
                          fontWeight: '800',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {viewingDetailResponse.is_verified !== false ? '✅ Đã Tiếp Nhận' : '⏳ Đang Chờ Xử Lý'}
                      </button>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        Ghi chú nội bộ / Phân công xử lý (BGH):
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Nhập ghi chú xử lý (ví dụ: Đã giao thầy Nam - CSVC kiểm tra lại căng tin)..."
                          value={adminNoteInput}
                          onChange={e => setAdminNoteInput(e.target.value)}
                          style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveAdminNote}
                          disabled={isSavingNote}
                          style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 'bold', fontSize: '12.5px', cursor: isSavingNote ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {isSavingNote ? 'Đang Lưu...' : 'Lưu Ghi Chú'}
                        </button>
                      </div>
                      {currentAdminNote && (
                        <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#0369a1', background: '#e0f2fe', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                          📝 <strong>Ghi chú hiện tại:</strong> {currentAdminNote}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer Actions */}
                <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#334155', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🖨️ In Phiếu Tiếp Nhận
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingDetailResponse(null)}
                    style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#e11d48', color: '#ffffff', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer' }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // NẾU LÀ GÓP Ý DỰ THẢO VĂN BẢN (GIÁO VIÊN / TỔ CHUYÊN MÔN)
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
