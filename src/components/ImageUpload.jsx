import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ImageUpload({ currentUrl, onUploadSuccess, onRemove }) {
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
      
      // Limit size to 2MB
      if (file.size > 2 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 2MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `user-upload-${Date.now()}.${fileExt}`;

      // Try uploading to 'gallery' bucket
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (!uploadError) {
        const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
        if (data && data.publicUrl) {
          onUploadSuccess(data.publicUrl, fileName);
          return;
        }
      }

      // Fallback: Convert image to Data URL (Base64) if storage bucket is unavailable
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          onUploadSuccess(e.target.result, fileName);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError('Có lỗi khi đọc file ảnh. Vui lòng chọn file khác.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUploading(true);
      // Assuming we stored the full URL and need to extract the path, 
      // or we expect currentUrl to be the path. 
      // For simplicity, if we have the full URL, we extract the filename:
      if (currentUrl) {
        const parts = currentUrl.split('/');
        const fileName = parts[parts.length - 1];
        await supabase.storage.from('gallery').remove([fileName]);
      }
      onRemove();
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa ảnh');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{marginTop: '10px', marginBottom: '10px'}}>
      {error && <div style={{color: 'red', fontSize: '13px', marginBottom: '5px'}}>{error}</div>}
      
      {currentUrl ? (
        <div style={{ position: 'relative', width: '200px' }}>
          <img src={currentUrl} alt="Uploaded" style={{width: '100%', borderRadius: '4px', border: '1px solid #ccc'}} />
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={uploading}
            style={{
              position: 'absolute', top: '5px', right: '5px',
              backgroundColor: 'red', color: 'white', border: 'none', 
              borderRadius: '4px', padding: '5px', cursor: 'pointer'
            }}
          >
            {uploading ? 'Đang xóa...' : 'Xóa ảnh'}
          </button>
        </div>
      ) : (
        <div>
          <label style={{
            display: 'inline-block', padding: '8px 12px', 
            backgroundColor: '#166534', color: 'white', 
            borderRadius: '4px', cursor: 'pointer'
          }}>
            {uploading ? 'Đang tải lên...' : 'Tải ảnh lên (Tối đa 2MB)'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleUpload}
              disabled={uploading}
              style={{display: 'none'}} 
            />
          </label>
        </div>
      )}
    </div>
  );
}
