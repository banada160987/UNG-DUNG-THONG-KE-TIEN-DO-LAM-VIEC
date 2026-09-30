import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Paperclip, X, Loader2, HardDrive, CheckCircle2, ExternalLink } from 'lucide-react';
import { getSchoolDriveConfig, uploadToSchoolDrive } from '../services/googleDriveService';

export default function FileUpload({ 
  currentUrl, 
  onUploadSuccess, 
  onUploadComplete, 
  onRemove,
  category = 'chung',
  subFolder = '',
  entityName = '',
  maxSizeMB = 20
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadSource, setUploadSource] = useState(null); // 'drive' | 'supabase'
  const [error, setError] = useState(null);

  const notifySuccess = (url, fileName) => {
    if (onUploadSuccess) onUploadSuccess(url, fileName);
    if (onUploadComplete) onUploadComplete(url, fileName);
  };

  const handleUpload = async (event) => {
    try {
      setUploading(true);
      setError(null);
      setUploadSource(null);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Kích thước file không được vượt quá ${maxSizeMB}MB`);
        return;
      }

      // 1. ƯU TIÊN LƯU VÀO GOOGLE DRIVE NẾU ĐÃ CẤU HÌNH WEB APP
      const driveConfig = await getSchoolDriveConfig();
      if (driveConfig.scriptUrl && driveConfig.scriptUrl.startsWith('http')) {
        try {
          const driveResult = await uploadToSchoolDrive({
            file,
            category,
            subFolder,
            entityName
          });

          if (driveResult && (driveResult.previewUrl || driveResult.fileUrl)) {
            const finalUrl = driveResult.previewUrl || driveResult.fileUrl;
            setUploadSource('drive');
            notifySuccess(finalUrl, driveResult.fileName || file.name);
            setUploading(false);
            return;
          }
        } catch (driveErr) {
          console.warn("Upload Google Drive không thành công, tự động chuyển phương án dự phòng:", driveErr.message);
        }
      }

      // 2. PHƯƠNG ÁN DỰ PHÒNG: LƯU TẠM VÀO SUPABASE STORAGE
      const fileExt = file.name.split('.').pop();
      const fileName = `${file.name.replace(`.${fileExt}`, '')}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setUploadSource('supabase');
      notifySuccess(data.publicUrl, file.name);

    } catch (err) {
      console.error(err);
      setError('Lỗi tải file lên: ' + (err.message || 'Vui lòng kiểm tra quyền lưu trữ.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUploading(true);
      if (currentUrl && !currentUrl.includes('drive.google.com')) {
        const parts = currentUrl.split('/');
        const fileName = parts[parts.length - 1];
        await supabase.storage.from('images').remove([`uploads/${fileName}`, fileName]);
      }
      if (onRemove) onRemove();
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa file');
    } finally {
      setUploading(false);
    }
  };

  const isDriveUrl = currentUrl && currentUrl.includes('drive.google.com');

  return (
    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
      {error && <div style={{ color: '#dc2626', fontSize: '12.5px', marginBottom: '6px' }}>⚠️ {error}</div>}
      
      {currentUrl ? (
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          backgroundColor: isDriveUrl ? '#f0fdf4' : '#f1f5f9', 
          padding: '6px 12px', 
          borderRadius: '8px', 
          border: isDriveUrl ? '1px solid #86efac' : '1px solid #cbd5e1',
          maxWidth: '100%'
        }}>
          {isDriveUrl ? (
            <HardDrive size={16} color="#16a34a" />
          ) : (
            <Paperclip size={16} color="#64748b" />
          )}
          
          <a 
            href={currentUrl} 
            target="_blank" 
            rel="noreferrer" 
            style={{ 
              fontSize: '13px', 
              color: isDriveUrl ? '#15803d' : '#0284c7', 
              textDecoration: 'none', 
              fontWeight: '600',
              maxWidth: '240px', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={currentUrl}
          >
            {isDriveUrl ? 'Xem trên Google Drive' : 'Xem file đính kèm'} <ExternalLink size={12} />
          </a>

          {isDriveUrl && (
            <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
              Drive
            </span>
          )}

          {onRemove && (
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={uploading}
              style={{
                background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', marginLeft: '4px'
              }}
              title="Xóa / Thay đổi file"
            >
              {uploading ? <Loader2 size={15} className="spin" /> : <X size={15} />}
            </button>
          )}
        </div>
      ) : (
        <div>
          <label style={{
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '7px 14px', 
            backgroundColor: '#f8fafc', 
            color: '#334155', 
            fontSize: '13px',
            fontWeight: '600',
            borderRadius: '8px', 
            cursor: uploading ? 'wait' : 'pointer', 
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            {uploading ? (
              <Loader2 size={15} className="spin" color="#0284c7" />
            ) : (
              <HardDrive size={15} color="#16a34a" />
            )}
            {uploading ? 'Đang tải lên Drive...' : 'Tải file đính kèm lên Drive'}
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" 
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      )}
    </div>
  );
}
