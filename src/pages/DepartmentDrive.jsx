import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Save, AlertCircle, ArrowLeft, FolderOpen } from 'lucide-react';

export default function DepartmentDrive() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const isTeacherPortal = location.pathname.includes('/teacher-dashboard');
  const isAdmin = role === 'admin' && !isTeacherPortal;

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]); // List of all departments (for admin)
  const [selectedDept, setSelectedDept] = useState(''); // Current viewing department
  
  const [teacherDept, setTeacherDept] = useState('');
  const [isTTCM, setIsTTCM] = useState(false);
  
  const [driveConfig, setDriveConfig] = useState(null); // The record from cbq_external_links
  const [folderIdInput, setFolderIdInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    init();
  }, [isTeacherPortal, isAdmin]);

  const init = async () => {
    setLoading(true);
    
    // Fetch unique departments from staff
    const { data: staffData } = await supabase.from('cbq_staff').select('department, name, title');
    let allDepts = [];
    if (staffData) {
      allDepts = [...new Set(staffData.map(s => s.department))].filter(Boolean);
      setDepartments(allDepts);
    }

    if (isAdmin) {
      if (allDepts.length > 0) {
        handleSelectDept(allDepts[0]);
      } else {
        setLoading(false);
      }
    } else if (isTeacherPortal) {
      // Find current teacher's department
      const teacherStr = localStorage.getItem('cbq_current_teacher');
      if (teacherStr) {
        const teacher = JSON.parse(teacherStr);
        // Match full_name in staffData
        const staffMatch = staffData?.find(s => s.name === teacher.full_name);
        if (staffMatch) {
          setTeacherDept(staffMatch.department);
          setIsTTCM(staffMatch.title && staffMatch.title.toLowerCase().includes('tổ trưởng'));
          handleSelectDept(staffMatch.department);
        } else {
          // Teacher not found in staff list
          setLoading(false);
        }
      } else {
        navigate('/dang-nhap-giao-vien');
      }
    }
  };

  const handleSelectDept = async (deptName) => {
    setSelectedDept(deptName);
    setLoading(true);
    setShowConfig(false);
    
    // Fetch drive link for this dept
    const { data } = await supabase
      .from('cbq_external_links')
      .select('*')
      .eq('type', 'department_drive')
      .eq('category', deptName)
      .maybeSingle();
      
    if (data) {
      setDriveConfig(data);
      setFolderIdInput(data.url || ''); // We use url to store folder ID
    } else {
      setDriveConfig(null);
      setFolderIdInput('');
    }
    
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!folderIdInput.trim()) {
      alert('Vui lòng nhập Folder ID!');
      return;
    }
    
    // Extract Folder ID if user pasted full URL
    let finalFolderId = folderIdInput.trim();
    if (finalFolderId.includes('folders/')) {
      finalFolderId = finalFolderId.split('folders/')[1].split('?')[0];
    } else if (finalFolderId.includes('id=')) {
      finalFolderId = finalFolderId.split('id=')[1].split('&')[0];
    }

    setLoading(true);
    if (driveConfig?.id) {
      // Update
      await supabase
        .from('cbq_external_links')
        .update({ url: finalFolderId, title: `Hồ sơ ${selectedDept}` })
        .eq('id', driveConfig.id);
    } else {
      // Insert
      await supabase
        .from('cbq_external_links')
        .insert([{
          type: 'department_drive',
          category: selectedDept,
          url: finalFolderId,
          title: `Hồ sơ ${selectedDept}`,
          is_active: true
        }]);
    }
    
    await handleSelectDept(selectedDept);
  };

  const canConfig = isAdmin || isTTCM;

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '5px', fontWeight: 'bold' }}>Hồ Sơ Tổ Chuyên Môn</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Lưu trữ và quản lý tài liệu trên Google Drive</p>
        </div>
        
        {canConfig && driveConfig && !showConfig && (
          <button 
            onClick={() => setShowConfig(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Settings size={16} /> Cài đặt Thư mục
          </button>
        )}
      </div>

      {isAdmin && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#475569' }}>Chọn Tổ:</span>
          <select 
            value={selectedDept} 
            onChange={(e) => handleSelectDept(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      {!isAdmin && !teacherDept && !loading && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fee2e2', borderRadius: '12px', color: '#ef4444' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 10px' }} />
          <h3>Không tìm thấy thông tin Tổ chuyên môn</h3>
          <p>Tài khoản của bạn chưa được liên kết với danh sách nhân sự (cbq_staff). Vui lòng liên hệ Admin.</p>
        </div>
      )}

      {(isAdmin || teacherDept) && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          {/* Header */}
          <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={18} color="#3b82f6" />
              Tài liệu: {selectedDept} {isTTCM && <span style={{ fontSize: '12px', background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px' }}>Quyền Tổ trưởng</span>}
            </h2>
          </div>
          
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>Đang tải thư mục...</div>
          ) : (
            <div style={{ padding: '20px' }}>
              {(!driveConfig || showConfig) && canConfig ? (
                // Setup Mode
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>Cấu hình Google Drive cho {selectedDept}</h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#64748b' }}>
                    1. Tạo thư mục trên Google Drive.<br/>
                    2. Chia sẻ thư mục với quyền <b>"Bất kỳ ai có liên kết đều có thể xem (hoặc sửa)"</b>.<br/>
                    3. Copy Link chia sẻ hoặc Folder ID dán vào ô bên dưới.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={folderIdInput}
                      onChange={e => setFolderIdInput(e.target.value)}
                      placeholder="Dán Link hoặc Folder ID vào đây..."
                      style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                    <button 
                      onClick={handleSaveConfig}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      <Save size={16} /> Lưu lại
                    </button>
                    {driveConfig && (
                      <button 
                        onClick={() => setShowConfig(false)}
                        style={{ padding: '0 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              ) : driveConfig?.url ? (
                // View Mode
                <div style={{ height: '600px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <iframe 
                    src={`https://drive.google.com/embeddedfolderview?id=${driveConfig.url}#grid`} 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={`Google Drive - ${selectedDept}`}
                  ></iframe>
                </div>
              ) : (
                // Empty state for normal teachers when TTCM hasn't setup
                <div style={{ padding: '50px', textAlign: 'center' }}>
                  <FolderOpen size={48} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <h3 style={{ color: '#475569', margin: '0 0 5px 0' }}>Thư mục chưa được cấu hình</h3>
                  <p style={{ color: '#94a3b8', margin: 0 }}>Vui lòng đợi Tổ trưởng chuyên môn hoặc Admin cài đặt liên kết Google Drive.</p>
                </div>
              )}
            </div>
          )}
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
