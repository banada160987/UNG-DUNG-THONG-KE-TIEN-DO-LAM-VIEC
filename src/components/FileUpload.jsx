import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Paperclip, X, Loader2 } from 'lucide-react';

export default function FileUpload({ currentUrl, onUploadSuccess, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (event) => {
    try {
      setUploading(true);
      setError(null);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      
      // Limit size to 10MB for documents
      if (file.size > 10 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 10MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      // Keep original file name but add random string to avoid collision
      const fileName = `${file.name.replace(`.${fileExt}`, '')}_${Math.floor(Math.random()*1000)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images') // Reusing images bucket as requested in the plan
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      
      onUploadSuccess(data.publicUrl, file.name);
    } catch (err) {
      console.error(err);
      setError('Lỗi tải file lên. Vui lòng kiểm tra quyền Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUploading(true);
      if (currentUrl) {
        const parts = currentUrl.split('/');
        const fileName = parts[parts.length - 1];
        await supabase.storage.from('images').remove([fileName]);
      }
      onRemove();
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
      {error && <div style={{ color: 'red', fontSize: '13px', marginBottom: '5px' }}>{error}</div>}
      
      {currentUrl ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: 'fit-content' }}>
          <Paperclip size={16} color="#64748b" />
          <a href={currentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#0ea5e9', textDecoration: 'none', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Xem file đính kèm
          </a>
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={uploading}
            style={{
              background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center'
            }}
            title="Xóa file"
          >
            {uploading ? <Loader2 size={16} className="spin" /> : <X size={16} />}
          </button>
        </div>
      ) : (
        <div>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', 
            backgroundColor: '#e2e8f0', color: '#475569', fontSize: '13px',
            borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e1'
          }}>
            <Paperclip size={14} />
            {uploading ? 'Đang tải lên...' : 'Đính kèm file'}
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
