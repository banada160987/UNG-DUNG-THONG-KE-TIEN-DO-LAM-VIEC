import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { BookOpen, Plus, Save, Trash2, Edit3, Eye, FileText, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, Upload } from 'lucide-react';

export default function AdminMagazine() {
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [pages, setPages] = useState([]);
  const [toc, setToc] = useState([]);

  // New Item States
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageImageUrl, setNewPageImageUrl] = useState('');
  const [newTocTitle, setNewTocTitle] = useState('');
  const [newTocPage, setNewTocPage] = useState(1);

  // Editing State
  const [editingPageIdx, setEditingPageIdx] = useState(null);

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

  const handleSaveMagazine = async (e) => {
    e.preventDefault();
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
      alert("Vui lòng nhập đường dẫn hình ảnh cho trang tập san!");
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa trang này khỏi tập san?")) return;
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

    // Re-index page numbers
    const reindexed = updated.map((p, idx) => ({
      ...p,
      page_number: idx + 1
    }));
    setPages(reindexed);
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
            Dành cho Tiểu ban Nội dung, biên tập tập san và Ban Giám Hiệu duyệt ấn phẩm.
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
            disabled={saving}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', backgroundColor: '#be123c' }}
          >
            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu & Xuất Bản'}
          </button>
        </div>
      </div>

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
                <label style={styles.label}>Đường dẫn File PDF Tập san HD (Link tải về)</label>
                <input 
                  type="text" 
                  value={pdfUrl} 
                  onChange={e => setPdfUrl(e.target.value)}
                  style={styles.input} 
                  placeholder="https://.../tap-san-30-nam.pdf hoặc /tap-san-30-nam.pdf"
                />
              </div>

              <div>
                <label style={styles.label}>Đường dẫn Ảnh Bìa tập san</label>
                <input 
                  type="text" 
                  value={coverImage} 
                  onChange={e => setCoverImage(e.target.value)}
                  style={styles.input} 
                  placeholder="https://.../cover.jpg"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PAGES MANAGEMENT */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#be123c' }}>
                📄 2. Danh sách các Trang Tập san ({pages.length} trang)
              </h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Hệ thống tự sắp xếp trang theo thứ tự từ 1 đến hết</span>
            </div>

            {/* Add New Page Form */}
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
                <label style={styles.label}>Đường dẫn hình ảnh trang HD (*)</label>
                <input 
                  type="text" 
                  value={newPageImageUrl} 
                  onChange={e => setNewPageImageUrl(e.target.value)}
                  placeholder="Dán link ảnh trang (VD: https://.../trang-1.jpg)"
                  style={styles.input}
                />
              </div>

              <button 
                type="button" 
                onClick={handleAddPage}
                className="btn-primary" 
                style={{ padding: '10px 18px', backgroundColor: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={18} /> Thêm Trang
              </button>
            </div>

            {/* Pages Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '13.5px' }}>
                    <th style={{ padding: '10px' }}>STT</th>
                    <th style={{ padding: '10px' }}>Hình ảnh xem trước</th>
                    <th style={{ padding: '10px' }}>Tên trang</th>
                    <th style={{ padding: '10px' }}>Đường dẫn ảnh HD</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>Trang {page.page_number}</td>
                      <td style={{ padding: '10px' }}>
                        <img 
                          src={page.image_url} 
                          alt={page.title} 
                          style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} 
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x140?text=No+Image'; }}
                        />
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{page.title}</td>
                      <td style={{ padding: '10px', color: '#3b82f6', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page.image_url}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            onClick={() => handleMovePage(index, -1)}
                            disabled={index === 0}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: index === 0 ? 'not-allowed' : 'pointer' }}
                            title="Lên trên"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleMovePage(index, 1)}
                            disabled={index === pages.length - 1}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: index === pages.length - 1 ? 'not-allowed' : 'pointer' }}
                            title="Xuống dưới"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeletePage(index)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                            title="Xóa trang"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pages.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có trang tập san nào được thêm.</td></tr>
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
