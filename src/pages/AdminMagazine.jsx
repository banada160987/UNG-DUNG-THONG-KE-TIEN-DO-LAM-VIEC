import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, Plus, Save, Trash2, Edit3, Eye, FileText, CheckCircle2, 
  AlertCircle, ArrowUp, ArrowDown, Upload, Image as ImageIcon, FolderPlus, RefreshCw
} from 'lucide-react';

export default function AdminMagazine() {
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [pages, setPages] = useState([]);
  const [toc, setToc] = useState([]);

  // New Single Page State
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageImageUrl, setNewPageImageUrl] = useState('');
  
  // New TOC State
  const [newTocTitle, setNewTocTitle] = useState('');
  const [newTocPage, setNewTocPage] = useState(1);

  // Edit Page Row State
  const [editingIndex, setEditingIndex] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  useEffect(() => {
    fetchMagazine();
  }, []);

  async function fetchMagazine() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_magazines')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setMagazine(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPdfUrl(data.pdf_url || '');
        setCoverImage(data.cover_image || '');
        setIsPublished(data.is_published ?? true);
        setPages(data.pages || []);
        setToc(data.toc || []);
      }
    } catch (err) {
      console.error("Lỗi nạp thông tin tập san:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- FILE UPLOAD HELPER (Supabase Storage with Base64 Fallback) ---
  const uploadSingleFile = async (file) => {
    if (!file) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `magazine-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (!uploadError) {
        const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
        if (data && data.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch (err) {
      console.warn("Storage upload warn, fallback Base64:", err);
    }

    // Fallback to Base64 Data URL if Supabase Storage bucket is not available
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  // Upload Cover Image
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgressText('Đang tải ảnh bìa lên...');
    try {
      const url = await uploadSingleFile(file);
      if (url) {
        setCoverImage(url);
        alert("Đã tải ảnh bìa lên thành công!");
      }
    } catch (err) {
      alert("Lỗi tải ảnh bìa: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Upload PDF File
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgressText('Đang tải file PDF tập san...');
    try {
      const url = await uploadSingleFile(file);
      if (url) {
        setPdfUrl(url);
        alert("Đã tải tệp PDF lên thành công!");
      }
    } catch (err) {
      alert("Lỗi tải PDF: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Upload Single Image for "Thêm Trang Mới"
  const handleNewPageImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgressText('Đang nạp ảnh trang...');
    try {
      const url = await uploadSingleFile(file);
      if (url) {
        setNewPageImageUrl(url);
        if (!newPageTitle) {
          setNewPageTitle(`Trang ${pages.length + 1}`);
        }
      }
    } catch (err) {
      alert("Lỗi tải ảnh: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Replace image for an EXISTING page row
  const handleReplaceRowImage = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgressText(`Đang thay ảnh Trang ${index + 1}...`);
    try {
      const url = await uploadSingleFile(file);
      if (url) {
        const updated = [...pages];
        updated[index] = { ...updated[index], image_url: url };
        setPages(updated);
        alert(`Đã thay thế ảnh cho Trang ${index + 1} thành công!`);
      }
    } catch (err) {
      alert("Lỗi thay ảnh: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Batch Upload Multiple Files at Once (Select 10-50 images)
  const handleBatchImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Sort files by name naturally (e.g. page1, page2, page10...)
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    setUploading(true);
    setUploadProgressText(`Đang xử lý ${files.length} ảnh tập san...`);

    try {
      const newPagesList = [];
      let startNum = pages.length + 1;

      for (let i = 0; i < files.length; i++) {
        setUploadProgressText(`Đang tải trang ${i + 1} / ${files.length}...`);
        const url = await uploadSingleFile(files[i]);
        if (url) {
          const pageTitle = files[i].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          newPagesList.push({
            page_number: startNum + i,
            title: pageTitle || `Trang ${startNum + i}`,
            image_url: url
          });
        }
      }

      setPages(prev => [...prev, ...newPagesList]);
      alert(`🎉 ĐÃ TẢI LÊN THÀNH CÔNG BỘ ${newPagesList.length} TRANG TẬP SAN!`);
    } catch (err) {
      alert("Lỗi khi tải bộ ảnh: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  const handleSaveMagazine = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        pdf_url: pdfUrl,
        cover_image: coverImage,
        pages,
        toc,
        is_published: isPublished,
        updated_at: new Date().toISOString()
      };

      if (magazine?.id) {
        const { error } = await supabase
          .from('cbq_magazines')
          .update(payload)
          .eq('id', magazine.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('cbq_magazines')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setMagazine(data);
      }

      alert("🎉 ĐÃ LƯU & CẬP NHẬT TẬP SAN THÀNH CÔNG!");
      fetchMagazine();
    } catch (err) {
      console.error("Lỗi khi lưu tập san:", err);
      alert("Lỗi khi lưu: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPage = () => {
    if (!newPageImageUrl.trim()) {
      alert("Vui lòng tải ảnh từ máy tính hoặc dán đường dẫn ảnh!");
      return;
    }
    const nextNum = pages.length + 1;
    const newPage = {
      page_number: nextNum,
      title: newPageTitle.trim() || `Trang ${nextNum}`,
      image_url: newPageImageUrl.trim()
    };
    setPages([...pages, newPage]);
    setNewPageTitle('');
    setNewPageImageUrl('');
  };

  const handleDeletePage = (index) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Trang ${index + 1}?`)) return;
    const updated = pages.filter((_, idx) => idx !== index).map((p, idx) => ({
      ...p,
      page_number: idx + 1
    }));
    setPages(updated);
  };

  const handleMovePage = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const reindexed = updated.map((p, idx) => ({
      ...p,
      page_number: idx + 1
    }));
    setPages(reindexed);
  };

  const startEditRow = (index) => {
    setEditingIndex(index);
    setEditTitle(pages[index].title);
    setEditImageUrl(pages[index].image_url);
  };

  const saveEditRow = (index) => {
    const updated = [...pages];
    updated[index] = {
      ...updated[index],
      title: editTitle.trim() || `Trang ${index + 1}`,
      image_url: editImageUrl.trim()
    };
    setPages(updated);
    setEditingIndex(null);
  };

  const handleAddToc = () => {
    if (!newTocTitle.trim()) {
      alert("Vui lòng nhập tên chương / bài viết cho Mục lục!");
      return;
    }
    const newTocItem = {
      title: newTocTitle.trim(),
      page: Number(newTocPage) || 1
    };
    setToc([...toc, newTocItem].sort((a, b) => a.page - b.page));
    setNewTocTitle('');
  };

  const handleDeleteToc = (index) => {
    setToc(toc.filter((_, idx) => idx !== index));
  };

  return (
    <Layout title="Quản lý Biên tập Tập san Kỷ niệm 30 năm">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={24} color="#be123c" /> Biên tập & Xuất bản Tập san Kỷ niệm
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Hỗ trợ Tải ảnh trực tiếp từ máy tính (từng trang hoặc cả bộ ảnh), chỉnh sửa & xuất bản Tập san 3D.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/tap-san" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', textDecoration: 'none', padding: '10px 18px' }}
          >
            <Eye size={18} /> Xem trước Tập san 3D
          </a>
          <button 
            onClick={handleSaveMagazine} 
            disabled={saving || uploading}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', backgroundColor: '#be123c' }}
          >
            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu & Xuất Bản'}
          </button>
        </div>
      </div>

      {uploading && (
        <div style={{ padding: '12px 20px', background: '#dbeafe', color: '#1e40af', borderRadius: '10px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <RefreshCw size={20} className="animate-spin" /> {uploadProgressText || 'Đang xử lý tải tệp...'}
        </div>
      )}

      {loading ? <p>Đang nạp dữ liệu tập san...</p> : (
        <form onSubmit={handleSaveMagazine} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECTION 1: GENERAL INFO */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              📌 1. Thông tin chung về Tập san
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={styles.label}>Tiêu đề Tập san (*)</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  style={styles.input} 
                  placeholder="VD: TẬP SAN KỶ NIỆM 30 NĂM THÀNH LẬP TRƯỜNG THPT CAO BÁ QUÁT"
                />
              </div>

              <div>
                <label style={styles.label}>Trạng thái Xuất bản</label>
                <select 
                  value={isPublished ? 'published' : 'draft'} 
                  onChange={e => setIsPublished(e.target.value === 'published')}
                  style={{ ...styles.input, fontWeight: 'bold', color: isPublished ? '#166534' : '#b45309' }}
                >
                  <option value="published">Đã Xuất bản (Công khai)</option>
                  <option value="draft">Bản nháp (Ẩn công khai)</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.label}>Mô tả / Lời giới thiệu tập san</label>
                <textarea 
                  rows={2} 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  style={styles.input} 
                  placeholder="Nhập mô tả tóm tắt về nội dung tập san..."
                />
              </div>

              <div>
                <label style={styles.label}>File PDF Tập san HD (Link tải về)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={pdfUrl} 
                    onChange={e => setPdfUrl(e.target.value)}
                    style={styles.input} 
                    placeholder="Dán link PDF hoặc bấm Tải File bên cạnh ->"
                  />
                  <label style={{ padding: '8px 14px', background: '#0284c7', color: 'white', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Upload size={16} /> Tải PDF
                    <input type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div>
                <label style={styles.label}>Ảnh Bìa tập san</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={coverImage} 
                    onChange={e => setCoverImage(e.target.value)}
                    style={styles.input} 
                    placeholder="Link ảnh bìa hoặc chọn file bên cạnh ->"
                  />
                  <label style={{ padding: '8px 14px', background: '#166534', color: 'white', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Upload size={16} /> Chọn Ảnh
                    <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PAGES MANAGEMENT WITH DIRECT FILE UPLOADS */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#be123c' }}>
                  📄 2. Danh sách các Trang Tập san ({pages.length} trang)
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Hỗ trợ nạp từng trang hoặc tải lên cả bộ ảnh từ máy tính</span>
              </div>

              {/* BATCH MULTIPLE FILE UPLOAD BUTTON */}
              <label style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #166534, #15803d)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderPlus size={18} /> 📁 TẢI HÀNG LOẠT BỘ ẢNH (Chọn nhiều ảnh cùng lúc)
                <input type="file" accept="image/*" multiple onChange={handleBatchImagesUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Add Single New Page Form */}
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={styles.label}>Tên / Tiêu đề trang</label>
                <input 
                  type="text" 
                  value={newPageTitle} 
                  onChange={e => setNewPageTitle(e.target.value)}
                  placeholder={`Trang ${pages.length + 1}: Lời mở đầu...`}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Hình ảnh trang HD (Chọn file từ máy HOẶC Dán link)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={newPageImageUrl} 
                    onChange={e => setNewPageImageUrl(e.target.value)}
                    placeholder="Dán link ảnh hoặc chọn file từ máy tính bên cạnh ->"
                    style={styles.input}
                  />
                  <label style={{ padding: '8px 14px', background: '#475569', color: 'white', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Upload size={16} /> Chọn File
                    <input type="file" accept="image/*" onChange={handleNewPageImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleAddPage}
                className="btn-primary" 
                style={{ padding: '10px 18px', backgroundColor: '#be123c', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={18} /> Thêm Trang
              </button>
            </div>

            {/* Pages Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '13.5px', background: '#f8fafc' }}>
                    <th style={{ padding: '12px 10px' }}>STT</th>
                    <th style={{ padding: '12px 10px' }}>Hình ảnh xem trước</th>
                    <th style={{ padding: '12px 10px' }}>Tên trang</th>
                    <th style={{ padding: '12px 10px' }}>Thay thế & Đường dẫn ảnh HD</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#be123c' }}>Trang {page.page_number}</td>
                      <td style={{ padding: '10px' }}>
                        <img 
                          src={page.image_url} 
                          alt={page.title} 
                          style={{ width: '55px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} 
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x140?text=No+Image'; }}
                        />
                      </td>
                      
                      {/* EDITING MODE VS DISPLAY MODE */}
                      {editingIndex === index ? (
                        <>
                          <td style={{ padding: '10px' }}>
                            <input 
                              type="text" 
                              value={editTitle} 
                              onChange={e => setEditTitle(e.target.value)}
                              style={styles.input}
                            />
                          </td>
                          <td style={{ padding: '10px' }}>
                            <input 
                              type="text" 
                              value={editImageUrl} 
                              onChange={e => setEditImageUrl(e.target.value)}
                              style={styles.input}
                            />
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <button 
                              type="button" 
                              onClick={() => saveEditRow(index)}
                              style={{ padding: '6px 12px', background: '#166534', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginRight: '6px' }}
                            >
                              Lưu
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingIndex(null)}
                              style={{ padding: '6px 12px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              Hủy
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{page.title}</td>
                          <td style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* DIRECT FILE REPLACEMENT BUTTON FOR THIS ROW */}
                              <label 
                                style={{
                                  padding: '5px 10px',
                                  background: '#fff1f2',
                                  color: '#be123c',
                                  border: '1px solid #fecdd3',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Bấm vào đây để chọn ảnh từ máy tính thay thế cho trang này"
                              >
                                <Upload size={13} /> 📸 Tải Ảnh Thay Thế
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={(e) => handleReplaceRowImage(index, e)} 
                                  style={{ display: 'none' }} 
                                />
                              </label>

                              <span style={{ fontSize: '11px', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {page.image_url}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button 
                                type="button" 
                                onClick={() => startEditRow(index)}
                                style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}
                                title="Sửa tiêu đề & URL"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleMovePage(index, -1)}
                                disabled={index === 0}
                                style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: index === 0 ? 'not-allowed' : 'pointer' }}
                                title="Di chuyển lên trên"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleMovePage(index, 1)}
                                disabled={index === pages.length - 1}
                                style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: index === pages.length - 1 ? 'not-allowed' : 'pointer' }}
                                title="Di chuyển xuống dưới"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDeletePage(index)}
                                style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                                title="Xóa trang này"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {pages.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '25px', textAlign: 'center', color: '#64748b' }}>Chưa có trang tập san nào được thêm. Hãy chọn <b>"TẢI HÀNG LOẠT BỘ ẢNH"</b> hoặc <b>"Thêm Trang"</b> ở trên.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: TABLE OF CONTENTS (TOC) MANAGEMENT */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              📚 3. Quản lý Mục lục Chương / Bài viết
            </h3>

            {/* Add TOC Form */}
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', marginBottom: '20px', display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={styles.label}>Tên chương / Bài viết (*)</label>
                <input 
                  type="text" 
                  value={newTocTitle} 
                  onChange={e => setNewTocTitle(e.target.value)}
                  placeholder="VD: 3. Lịch sử 30 năm hình thành & phát triển"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Nằm ở Trang số (*)</label>
                <input 
                  type="number" 
                  min="1"
                  max={pages.length || 100}
                  value={newTocPage} 
                  onChange={e => setNewTocPage(e.target.value)}
                  style={styles.input}
                />
              </div>

              <button 
                type="button" 
                onClick={handleAddToc}
                className="btn-primary" 
                style={{ padding: '10px 18px', backgroundColor: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={18} /> Thêm Mục lục
              </button>
            </div>

            {/* TOC Items List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
              {toc.map((item, index) => (
                <div key={index} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#1e293b', fontSize: '13.5px' }}>{item.title}</strong>
                    <div style={{ fontSize: '11.5px', color: '#be123c', fontWeight: 'bold' }}>Trang {item.page}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteToc(index)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {toc.length === 0 && (
                <p style={{ color: '#64748b', fontSize: '14px', gridColumn: '1 / -1' }}>Chưa có mục lục nào.</p>
              )}
            </div>
          </div>

        </form>
      )}
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13.5px', marginBottom: '5px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }
};
