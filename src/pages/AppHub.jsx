import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as LucideIcons from 'lucide-react';

// Common Icons
const { 
  ArrowLeft, Plus, Trash2, Edit2, ExternalLink, AppWindow
} = LucideIcons;

// Helpers to auto-generate colors
const colorPresets = [
  { bg: '#fee2e2', border: '#fca5a5', icon: '#dc2626' }, // red
  { bg: '#dbeafe', border: '#93c5fd', icon: '#2563eb' }, // blue
  { bg: '#dcfce7', border: '#86efac', icon: '#16a34a' }, // green
  { bg: '#fef3c7', border: '#fcd34d', icon: '#d97706' }, // yellow
  { bg: '#ccfbf1', border: '#5eead4', icon: '#0d9488' }, // teal
  { bg: '#e0e7ff', border: '#a5b4fc', icon: '#4f46e5' }, // indigo
  { bg: '#f3e8ff', border: '#d8b4fe', icon: '#9333ea' }, // purple
  { bg: '#ffe4e6', border: '#fda4af', icon: '#e11d48' }, // rose
];

const getRandomColorPreset = () => colorPresets[Math.floor(Math.random() * colorPresets.length)];

// Dynamic Icon Component
const DynamicIcon = ({ name, size = 32, color = "#000" }) => {
  const IconComponent = LucideIcons[name];
  if (!IconComponent) {
    return <LucideIcons.AppWindow size={size} color={color} />;
  }
  return <IconComponent size={size} color={color} />;
};

export default function AppHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const isTeacherPortal = location.pathname.includes('/teacher-dashboard');
  const isAdmin = role === 'admin' && !isTeacherPortal;
  
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: '', url: '', category: 'Tiện ích Cá nhân', description: '', type: 'hub_personal' });

  useEffect(() => {
    let currentTeacher = null;
    if (isTeacherPortal) {
      const teacherStr = localStorage.getItem('cbq_current_teacher');
      if (teacherStr) {
        currentTeacher = JSON.parse(teacherStr);
        setTeacher(currentTeacher);
      } else {
        navigate('/dang-nhap-giao-vien');
        return;
      }
    }
    
    fetchApps(currentTeacher);
  }, [isTeacherPortal, navigate]);

  const fetchApps = async (currentTeacher) => {
    setLoading(true);
    let query = supabase.from('cbq_external_links').select('*').in('type', ['hub_global', 'hub_personal']).order('order_index', { ascending: true });
    
    const { data, error } = await query;
    if (data) {
      // Lọc dữ liệu: Nếu là giáo viên, lấy hub_global và hub_personal của riêng giáo viên đó
      // Nếu là Admin, chỉ lấy hub_global
      let filtered = data.filter(app => app.type === 'hub_global');
      if (isTeacherPortal && currentTeacher) {
        const personalApps = data.filter(app => app.type === 'hub_personal' && app.owner_id === currentTeacher.username);
        filtered = [...filtered, ...personalApps];
      }
      setApps(filtered);
    }
    setLoading(false);
  };

  const handleSaveApp = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
        alert('Vui lòng nhập Tên ứng dụng và Đường dẫn!');
        return;
    }

    const payload = { ...formData };
    
    // Auto-generate colors and icon if new personal app
    if (!payload.id) {
        const preset = getRandomColorPreset();
        payload.bg_color = preset.bg;
        payload.border_color = preset.border;
        payload.icon = payload.icon || 'AppWindow';
        
        if (isTeacherPortal && teacher) {
            payload.type = 'hub_personal';
            payload.owner_id = teacher.username;
            payload.category = 'Tiện ích Cá nhân';
            payload.is_active = true;
            payload.order_index = 99; // append to end
        } else if (isAdmin) {
            payload.type = 'hub_global';
            payload.is_active = true;
        }
    }

    if (payload.id) {
        await supabase.from('cbq_external_links').update(payload).eq('id', payload.id);
    } else {
        await supabase.from('cbq_external_links').insert([payload]);
    }
    
    setShowModal(false);
    fetchApps(teacher);
  };

  const handleDeleteApp = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Xóa ứng dụng này khỏi Cổng Tiện Ích?')) {
        await supabase.from('cbq_external_links').delete().eq('id', id);
        fetchApps(teacher);
    }
  };

  const handleEditApp = (e, app) => {
    e.preventDefault();
    e.stopPropagation();
    setFormData(app);
    setShowModal(true);
  };
  
  const openAddModal = () => {
      setFormData({ id: null, title: '', url: '', category: isTeacherPortal ? 'Tiện ích Cá nhân' : '', description: '', icon: 'AppWindow' });
      setShowModal(true);
  };

  // Group apps by category
  const groupedApps = apps.reduce((acc, app) => {
      const cat = app.category || 'Khác';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(app);
      return acc;
  }, {});

  const renderAppCard = (app) => {
      const canEdit = (isTeacherPortal && app.type === 'hub_personal') || (isAdmin && app.type === 'hub_global');
      
      // Determine icon color based on preset border or generic
      let iconColor = app.border_color ? app.border_color.replace('a5', '6').replace('fca', 'dc2') : "#475569"; 
      // It's tricky to map border to text color, so we use a fallback if not perfect, but dynamic icon will just use a generic dark color or preset.
      const presetMatch = colorPresets.find(p => p.bg === app.bg_color);
      if (presetMatch) iconColor = presetMatch.icon;

      return (
          <a 
            key={app.id}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '20px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
            }}
          >
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '12px', 
              background: app.bg_color || '#f1f5f9',
              border: `1px solid ${app.border_color || '#cbd5e1'}`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '16px',
              flexShrink: 0
            }}>
              <DynamicIcon name={app.icon} size={32} color={iconColor} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{app.title}</h3>
                <ExternalLink size={16} color="#94a3b8" />
              </div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                {app.description || (app.type === 'hub_personal' ? 'Ứng dụng cá nhân' : 'Phần mềm tiện ích')}
              </p>
            </div>
            
            {canEdit && (
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                    <button onClick={(e) => handleEditApp(e, app)} style={{ background: '#f1f5f9', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer', color: '#475569' }}>
                        <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => handleDeleteApp(e, app.id)} style={{ background: '#fee2e2', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
          </a>
      );
  };

  const content = (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {isTeacherPortal && (
        <button 
          onClick={() => navigate('/teacher-dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', color: '#475569', fontWeight: 'bold' }}
        >
          <ArrowLeft size={16} /> Quay lại Bảng điều khiển
        </button>
      )}

      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '10px', fontWeight: 'bold' }}>Cổng Tiện Ích</h1>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Danh bạ tổng hợp các phần mềm và hệ thống ứng dụng dành cho Giáo viên</p>
      </div>

      {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Đang tải danh bạ ứng dụng...</p>
      ) : (
          Object.entries(groupedApps).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', color: '#334155', fontWeight: '600', margin: 0 }}>
                    {category}
                  </h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {items.map(app => renderAppCard(app))}
                
                {/* Nút thêm ứng dụng cá nhân nếu category là 'Tiện ích Cá nhân' */}
                {isTeacherPortal && category === 'Tiện ích Cá nhân' && (
                    <button 
                        onClick={openAddModal}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', color: '#64748b', transition: '0.2s', minHeight: '102px' }}
                        onMouseOver={e => e.currentTarget.style.borderColor = '#94a3b8'}
                        onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                    >
                        <Plus size={24} style={{ marginBottom: '8px' }} />
                        <span style={{ fontWeight: 'bold' }}>Thêm lối tắt cá nhân</span>
                    </button>
                )}
              </div>
            </div>
          ))
      )}
      
      {/* Nếu giáo viên chưa có ứng dụng cá nhân nào, hiển thị nút tạo mới độc lập */}
      {isTeacherPortal && !groupedApps['Tiện ích Cá nhân'] && !loading && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', color: '#334155', fontWeight: '600', margin: 0 }}>Tiện ích Cá nhân</h2>
              </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                <button 
                    onClick={openAddModal}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', color: '#64748b', transition: '0.2s', minHeight: '102px' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#94a3b8'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                    <Plus size={24} style={{ marginBottom: '8px' }} />
                    <span style={{ fontWeight: 'bold' }}>Thêm lối tắt cá nhân</span>
                </button>
            </div>
          </div>
      )}
      
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc', 
        border: '1px dashed #cbd5e1', 
        borderRadius: '8px', 
        padding: '20px', 
        marginTop: '40px'
      }}>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
          💡 Cổng tiện ích được quản lý tập trung. Nếu thầy/cô cần bổ sung thêm phần mềm nào khác, vui lòng liên hệ với Ban Quản trị.
        </p>
        
        {isAdmin && (
            <button 
                onClick={openAddModal}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                <Plus size={16} /> Thêm Phần mềm (Admin)
            </button>
        )}
      </div>

      {/* Modal */}
      {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#0f172a' }}>
                      {formData.id ? 'Cập nhật Ứng dụng' : 'Thêm Ứng dụng mới'}
                  </h3>
                  
                  <form onSubmit={handleSaveApp}>
                      <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Tên hiển thị</label>
                          <input 
                            type="text" 
                            required
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            placeholder="VD: Canva, ChatGPT..."
                          />
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Đường dẫn (URL)</label>
                          <input 
                            type="url" 
                            required
                            value={formData.url} 
                            onChange={e => setFormData({...formData, url: e.target.value})} 
                            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            placeholder="https://..."
                          />
                      </div>

                      {isAdmin && (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Nhóm danh mục</label>
                                <input 
                                  type="text" 
                                  required
                                  value={formData.category} 
                                  onChange={e => setFormData({...formData, category: e.target.value})} 
                                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                />
                            </div>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Mô tả ngắn</label>
                                <input 
                                  type="text" 
                                  value={formData.description || ''} 
                                  onChange={e => setFormData({...formData, description: e.target.value})} 
                                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                />
                            </div>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Tên Icon (Lucide React)</label>
                                <input 
                                  type="text" 
                                  value={formData.icon || 'AppWindow'} 
                                  onChange={e => setFormData({...formData, icon: e.target.value})} 
                                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Màu nền (HEX)</label>
                                    <input 
                                      type="text" 
                                      value={formData.bg_color || ''} 
                                      onChange={e => setFormData({...formData, bg_color: e.target.value})} 
                                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: 'bold' }}>Màu viền (HEX)</label>
                                    <input 
                                      type="text" 
                                      value={formData.border_color || ''} 
                                      onChange={e => setFormData({...formData, border_color: e.target.value})} 
                                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                    />
                                </div>
                            </div>
                        </>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                          <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy bỏ</button>
                          <button type="submit" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu ứng dụng</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );

  if (isTeacherPortal) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>
        {content}
      </div>
    );
  }

  return (
    <Layout>
      {content}
    </Layout>
  );
}
