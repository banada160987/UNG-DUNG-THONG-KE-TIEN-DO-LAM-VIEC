import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import {
  Video, Plus, Search, Filter, Trash2, Edit3, Eye, Download,
  ExternalLink, Sparkles, CheckCircle, AlertCircle, Play, X,
  GraduationCap, Brain, Compass, Heart, Briefcase, RefreshCw, FileText
} from 'lucide-react';
import { VIDEO_CATEGORIES } from '../data/eduVideoHubData';
import {
  getEduVideos,
  createEduVideo,
  updateEduVideo,
  deleteEduVideo,
  extractYouTubeId
} from '../services/eduVideoService';
import * as XLSX from 'xlsx';

export default function AdminEduVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    channel: 'Ban Chuyên Môn THPT Cao Bá Quát',
    category: 'exam_prep',
    targetAudience: 'student',
    grade: 'Khối 12',
    duration: '15:00',
    description: '',
    keyTakeawaysText: ''
  });

  // Load Videos
  const loadVideos = async () => {
    setLoading(true);
    try {
      const list = await getEduVideos();
      setVideos(list);
    } catch (err) {
      console.error('Lỗi tải video:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Filtered List
  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      const matchCat = filterCategory === 'all' || v.category === filterCategory;
      const matchGrade = filterGrade === 'all' || v.grade === filterGrade;
      const matchAud = filterAudience === 'all' || v.targetAudience === filterAudience || v.targetAudience === 'all';
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (v.title && v.title.toLowerCase().includes(q)) ||
        (v.channel && v.channel.toLowerCase().includes(q)) ||
        (v.description && v.description.toLowerCase().includes(q));
      return matchCat && matchGrade && matchAud && matchSearch;
    });
  }, [videos, filterCategory, filterGrade, filterAudience, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = videos.length;
    const examPrep = videos.filter(v => v.category === 'exam_prep').length;
    const studyMethods = videos.filter(v => v.category === 'study_methods').length;
    const teacherPd = videos.filter(v => v.category === 'teacher_pd').length;
    return { total, examPrep, studyMethods, teacherPd };
  }, [videos]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      url: '',
      title: '',
      channel: 'Ban Chuyên Môn THPT Cao Bá Quát',
      category: 'exam_prep',
      targetAudience: 'student',
      grade: 'Khối 12',
      duration: '15:00',
      description: '',
      keyTakeawaysText: ''
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (v) => {
    setEditingId(v.id);
    const takeawaysStr = Array.isArray(v.keyTakeaways) ? v.keyTakeaways.join('\n') : '';
    setFormData({
      url: v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : (v.embedUrl || ''),
      title: v.title || '',
      channel: v.channel || '',
      category: v.category || 'exam_prep',
      targetAudience: v.targetAudience || 'student',
      grade: v.grade || 'Toàn trường',
      duration: v.duration || 'Tự chọn',
      description: v.description || '',
      keyTakeawaysText: takeawaysStr
    });
    setShowModal(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.url.trim() || !formData.title.trim()) {
      alert('Vui lòng nhập đường link YouTube và Tiêu đề bài giảng.');
      return;
    }

    const keyTakeaways = formData.keyTakeawaysText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      url: formData.url.trim(),
      title: formData.title.trim(),
      channel: formData.channel.trim(),
      category: formData.category,
      targetAudience: formData.targetAudience,
      grade: formData.grade,
      duration: formData.duration.trim(),
      description: formData.description.trim(),
      keyTakeaways
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await updateEduVideo(editingId, payload);
        alert('Cập nhật video học liệu thành công!');
      } else {
        await createEduVideo(payload, { name: 'Quản trị viên' });
        alert('Thêm video học liệu mới thành công!');
      }
      setShowModal(false);
      loadVideos();
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi lưu video.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Video
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài giảng/video "${title}" không?`)) {
      return;
    }
    try {
      await deleteEduVideo(id);
      setVideos(prev => prev.filter(v => v.id !== id));
      alert('Đã xóa video thành công!');
    } catch (err) {
      alert('Không thể xóa video: ' + err.message);
    }
  };

  // Export Excel with "1-" prefix (GEMINI.md rule)
  const handleExportExcel = () => {
    if (videos.length === 0) {
      alert('Không có dữ liệu video để xuất.');
      return;
    }

    const exportData = filteredVideos.map((v, idx) => ({
      'STT': idx + 1,
      'Mã Video': v.id || v.youtubeId,
      'Tiêu Đề Bài Giảng': v.title,
      'Kênh / Tổ Chuyên Môn': v.channel,
      'Thể Loại': VIDEO_CATEGORIES.find(c => c.id === v.category)?.label || v.category,
      'Khối Lớp': v.grade,
      'Đối Tượng': v.targetAudience === 'student' ? 'Học sinh' : v.targetAudience === 'teacher' ? 'Giáo viên' : 'Toàn trường',
      'Thời Lượng': v.duration,
      'Lượt Xem': v.views,
      'Link YouTube': v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : v.embedUrl
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kho_Video_EduHub');
    
    // Tên file bắt buộc có tiền tố số thứ tự theo GEMINI.md
    const fileName = `1-Danh_Sach_Video_Hoc_Lieu_So_THPT_Cao_Ba_Quat_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Helper icon by category
  const getCategoryInfo = (catId) => {
    return VIDEO_CATEGORIES.find(c => c.id === catId) || { label: catId, color: '#6366f1' };
  };

  return (
    <Layout title="Quản Trị Video & Học Liệu Số (EduHub 4.0)">
      <div style={{ padding: '0 4px', maxWidth: '1360px', margin: '0 auto' }}>

        {/* 1. TOP STATS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5' }}>
              <Video size={24} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Tổng Video Học Liệu</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.examPrep}</div>
              <div style={styles.statLabel}>Ôn Thi TN THPT 2025/26</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Brain size={24} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.studyMethods}</div>
              <div style={styles.statLabel}>Phương Pháp & Kỹ Năng</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Briefcase size={24} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.teacherPd}</div>
              <div style={styles.statLabel}>Góc Sư Phạm & AI Giáo Dục</div>
            </div>
          </div>
        </div>

        {/* 2. TOOLBAR & ACTIONS */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Search & Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: '1 1 500px' }}>
            <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 auto' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm bài giảng, Thầy Cô, chủ đề..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">-- Tất Cả Chủ Đề --</option>
              {VIDEO_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">-- Khối Lớp --</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
              <option value="Toàn trường">Toàn trường</option>
            </select>

            <select
              value={filterAudience}
              onChange={e => setFilterAudience(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">-- Đối Tượng --</option>
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportExcel}
              style={styles.exportBtn}
              title="Xuất danh mục video ra file Excel (tiền tố 1- theo quy chuẩn)"
            >
              <Download size={16} /> Xuất Excel (1-)
            </button>

            <a
              href="/hoc-lieu-so"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.previewHubBtn}
            >
              <ExternalLink size={16} /> Xem EduHub Ngoài
            </a>

            <button
              onClick={handleOpenAdd}
              style={styles.addBtn}
            >
              <Plus size={18} /> Thêm Video Mới
            </button>
          </div>
        </div>

        {/* 3. VIDEO TABLE / LIST */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <div>Đang nạp kho video học liệu số...</div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Video size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>Không tìm thấy video nào</div>
              <div style={{ fontSize: '13.5px' }}>Hãy thử điều chỉnh từ khóa hoặc bộ lọc tìm kiếm.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                    <th style={{ padding: '14px 16px', width: '50px' }}>STT</th>
                    <th style={{ padding: '14px 16px', width: '130px' }}>Ảnh Thu Nhỏ</th>
                    <th style={{ padding: '14px 16px' }}>Tiêu Đề & Kênh Giảng Dạy</th>
                    <th style={{ padding: '14px 16px', width: '180px' }}>Chủ Đề & Khối Lớp</th>
                    <th style={{ padding: '14px 16px', width: '110px' }}>Thời Lượng</th>
                    <th style={{ padding: '14px 16px', width: '120px' }}>Ý Chính</th>
                    <th style={{ padding: '14px 16px', width: '150px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((v, index) => {
                    const cat = getCategoryInfo(v.category);
                    return (
                      <tr key={v.id || index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#94a3b8' }}>
                          {index + 1}
                        </td>
                        
                        <td style={{ padding: '14px 16px' }}>
                          <div 
                            style={{ position: 'relative', width: '110px', height: '62px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', backgroundColor: '#0f172a' }}
                            onClick={() => setPreviewVideo(v)}
                          >
                            <img 
                              src={v.thumbnail || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} 
                              alt={v.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff'
                            }}>
                              <Play size={20} fill="#ffffff" />
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px', lineHeight: '1.4' }}>
                            {v.title}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>👨‍🏫 {v.channel || 'THPT Cao Bá Quát'}</span>
                            {v.views && <span>• 👁️ {v.views}</span>}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                            border: `1px solid ${cat.color}35`,
                            marginBottom: '4px'
                          }}>
                            {cat.label}
                          </span>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            🏷️ {v.grade || 'Toàn trường'} ({v.targetAudience === 'student' ? 'Học sinh' : v.targetAudience === 'teacher' ? 'Giáo viên' : 'Chung'})
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#334155' }}>
                          ⏱️ {v.duration || 'Tùy chỉnh'}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#0284c7',
                            backgroundColor: '#e0f2fe',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}>
                            <CheckCircle size={13} /> {Array.isArray(v.keyTakeaways) ? v.keyTakeaways.length : 0} mục
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => setPreviewVideo(v)}
                              style={{ ...styles.iconBtn, color: '#0284c7', background: '#f0f9ff' }}
                              title="Xem thử video"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(v)}
                              style={{ ...styles.iconBtn, color: '#4f46e5', background: '#eef2ff' }}
                              title="Chỉnh sửa bài giảng"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id, v.title)}
                              style={{ ...styles.iconBtn, color: '#e11d48', background: '#fff1f2' }}
                              title="Xóa bài giảng"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. MODAL THÊM / SỬA VIDEO */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                    {editingId ? 'Cập Nhật Bài Giảng Video' : 'Thêm Bài Giảng / Video Số Mới'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  
                  {/* YouTube URL */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.label}>
                      Đường Link YouTube (*)
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', marginLeft: '6px' }}>
                        (Chấp nhận dạng: youtube.com/watch?v=..., youtu.be/..., shorts/...)
                      </span>
                    </label>
                    <input
                      type="text"
                      name="url"
                      required
                      placeholder="Ví dụ: https://www.youtube.com/watch?v=kJQP7kiw5Fk"
                      value={formData.url}
                      onChange={handleChange}
                      style={styles.formInput}
                    />
                  </div>

                  {/* Title */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Tiêu Đề Bài Giảng / Kỹ Năng Số (*)</label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="Ví dụ: Chiến Thuật Làm Câu Hỏi Đúng/Sai Thi TN THPT 2025"
                      value={formData.title}
                      onChange={handleChange}
                      style={styles.formInput}
                    />
                  </div>

                  {/* Channel / Author */}
                  <div>
                    <label style={styles.label}>Kênh / Thầy Cô / Tổ Chuyên Môn (*)</label>
                    <input
                      type="text"
                      name="channel"
                      required
                      placeholder="Ví dụ: Tổ Toán - THPT Cao Bá Quát"
                      value={formData.channel}
                      onChange={handleChange}
                      style={styles.formInput}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label style={styles.label}>Chủ Đề / Nhóm Nội Dung (*)</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      style={styles.formInput}
                    >
                      {VIDEO_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grade */}
                  <div>
                    <label style={styles.label}>Khối Lớp Áp Dụng</label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      style={styles.formInput}
                    >
                      <option value="Khối 10">Khối 10</option>
                      <option value="Khối 11">Khối 11</option>
                      <option value="Khối 12">Khối 12</option>
                      <option value="Khối 10, 11, 12">Khối 10, 11, 12</option>
                      <option value="Toàn trường">Toàn trường</option>
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label style={styles.label}>Đối Tượng Thụ Hưởng</label>
                    <select
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleChange}
                      style={styles.formInput}
                    >
                      <option value="student">Dành cho Học sinh</option>
                      <option value="teacher">Dành cho Giáo viên (Sư phạm & AI)</option>
                      <option value="all">Toàn trường (Học sinh & Thầy Cô)</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label style={styles.label}>Thời Lượng Ước Tính</label>
                    <input
                      type="text"
                      name="duration"
                      placeholder="Ví dụ: 18:30"
                      value={formData.duration}
                      onChange={handleChange}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={styles.label}>Tóm Tắt Giới Thiệu Bài Giảng</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Giới thiệu nội dung trọng tâm bài học giúp học sinh và đồng nghiệp nắm bắt nhanh..."
                    value={formData.description}
                    onChange={handleChange}
                    style={{ ...styles.formInput, resize: 'vertical' }}
                  />
                </div>

                {/* Key Takeaways */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={styles.label}>
                    Các Ý Chính Cần Ghi Nhớ (Mỗi dòng một ý - hiển thị dưới video)
                  </label>
                  <textarea
                    name="keyTakeawaysText"
                    rows={3}
                    placeholder="Ví dụ:&#10;Quy tắc làm bài thi 4 mức độ nhận thức&#10;Không làm tròn sai quy ước ở câu trả lời ngắn"
                    value={formData.keyTakeawaysText}
                    onChange={handleChange}
                    style={{ ...styles.formInput, resize: 'vertical' }}
                  />
                </div>

                {/* Submit buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={styles.cancelBtn}
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={styles.submitBtn}
                  >
                    {submitting ? 'Đang xử lý...' : (editingId ? 'Lưu Thay Đổi' : 'Thêm Bài Giảng')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. MODAL XEM THỬ VIDEO */}
        {previewVideo && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalCard, maxWidth: '820px' }}>
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} color="#0284c7" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    {previewVideo.title}
                  </h3>
                </div>
                <button onClick={() => setPreviewVideo(null)} style={styles.closeBtn}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000000', marginBottom: '16px' }}>
                  <iframe
                    src={previewVideo.embedUrl || `https://www.youtube.com/embed/${previewVideo.youtubeId}`}
                    title={previewVideo.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    Kênh: {previewVideo.channel}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ fontSize: '13px', color: '#475569' }}>
                    Thời lượng: {previewVideo.duration}
                  </span>
                </div>

                <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                  {previewVideo.description}
                </p>

                {previewVideo.keyTakeaways && previewVideo.keyTakeaways.length > 0 && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534', marginBottom: '8px' }}>
                      💡 CÁC ĐIỂM CỐT LÕI CỦA BÀI HỌC:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#15803d', lineHeight: '1.6' }}>
                      {previewVideo.keyTakeaways.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

const styles = {
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 1.1
  },
  statLabel: {
    fontSize: '12.5px',
    color: '#64748b',
    fontWeight: '600',
    marginTop: '2px'
  },
  searchInput: {
    width: '100%',
    padding: '9px 12px 9px 36px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    outline: 'none'
  },
  selectInput: {
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: '#334155',
    outline: 'none',
    cursor: 'pointer'
  },
  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    cursor: 'pointer'
  },
  previewHubBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0369a1',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    textDecoration: 'none'
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#4f46e5',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.15s ease'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    animation: 'fadeIn 0.2s ease-in-out'
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px'
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  cancelBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    border: 'none',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 22px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#4f46e5',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
  }
};
