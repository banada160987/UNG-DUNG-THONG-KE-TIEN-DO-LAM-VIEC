import React, { useState, useEffect } from 'react';
import { 
  HardDrive, CheckCircle2, AlertTriangle, Copy, Check, ExternalLink, 
  Save, X, RefreshCw, FolderOpen, ShieldCheck, Sparkles 
} from 'lucide-react';
import { 
  UNIVERSAL_GOOGLE_APPS_SCRIPT_CODE, 
  getSchoolDriveConfig, 
  saveSchoolDriveConfig, 
  testDriveScriptConnection 
} from '../services/googleDriveService';

export default function GoogleDriveConfigModal({ isOpen, onClose, onConfigSaved }) {
  const [scriptUrl, setScriptUrl] = useState('');
  const [folderId, setFolderId] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: boolean, message: string }
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    const config = await getSchoolDriveConfig();
    setScriptUrl(config.scriptUrl || '');
    setFolderId(config.folderId || '');
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!scriptUrl.trim()) {
      alert("Vui lòng nhập URL Web App Google Apps Script trước khi kiểm tra!");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testDriveScriptConnection(scriptUrl.trim());
      setTestResult(res);
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSchoolDriveConfig({ scriptUrl, folderId });
      alert("Đã lưu cấu hình Google Drive toàn trường thành công! Toàn bộ các phân hệ sẽ tự động lưu file qua Google Drive.");
      if (onConfigSaved) onConfigSaved({ scriptUrl, folderId });
      onClose();
    } catch (err) {
      alert("Lỗi khi lưu cấu hình: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(UNIVERSAL_GOOGLE_APPS_SCRIPT_CODE).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '800px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0284c7, #1d4ed8)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <HardDrive size={22} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Cấu Hình Google Drive Lưu Trữ Toàn Trường</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Tự động lưu & phân loại Văn bằng số, Hồ sơ giáo viên, Công văn & Đơn học sinh</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', padding: '6px', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Status banner */}
          <div style={{ 
            backgroundColor: scriptUrl ? '#f0fdf4' : '#fffbeb', 
            border: scriptUrl ? '1px solid #86efac' : '1px solid #fde68a', 
            borderRadius: '12px', 
            padding: '14px 16px', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            {scriptUrl ? (
              <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
              <strong style={{ color: scriptUrl ? '#166534' : '#b45309' }}>
                {scriptUrl ? '🟢 Hệ sinh thái Google Drive đã sẵn sàng!' : '🟡 Chưa thiết lập Web App Google Drive'}
              </strong>
              <div style={{ color: scriptUrl ? '#15803d' : '#92400e', marginTop: '2px' }}>
                {scriptUrl 
                  ? 'Toàn bộ hồ sơ số hóa, giáo án và tài liệu tải lên sẽ được tự động phân về đúng cây thư mục trên Google Drive của trường.'
                  : 'Hãy dán URL Web App Google Apps Script vào ô bên dưới. Nếu chưa tạo script, hãy xem hướng dẫn 1 phút phía dưới.'}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
                1. URL Web App Google Apps Script (*):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="url" 
                  required
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={scriptUrl}
                  onChange={e => setScriptUrl(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '13.5px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !scriptUrl.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: testing || !scriptUrl.trim() ? 'not-allowed' : 'pointer',
                    opacity: testing || !scriptUrl.trim() ? 0.7 : 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <RefreshCw size={15} className={testing ? 'spin' : ''} />
                  {testing ? 'Đang test...' : 'Kiểm tra kết nối'}
                </button>
              </div>

              {testResult && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  fontSize: '12.5px',
                  backgroundColor: testResult.ok ? '#dcfce7' : '#fee2e2',
                  color: testResult.ok ? '#15803d' : '#b91c1c',
                  border: testResult.ok ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {testResult.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
                2. ID Thư Mục Google Drive Cha Của Trường (Tùy chọn):
              </label>
              <input 
                type="text" 
                placeholder="Ví dụ: 1a2B3c4D5e... (Nếu để trống, script sẽ tự tạo thư mục gốc tên HE_THONG_HO_SO_THPT_CAO_BA_QUAT)"
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '13.5px',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                💡 Mẹo: Bạn có thể mở thư mục cha trên Google Drive, sao chép chuỗi mã sau chữ <code>folders/</code> trên thanh địa chỉ rồi dán vào đây.
              </span>
            </div>

            {/* Tree Diagram */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderOpen size={16} color="#0284c7" /> Cây Thư Mục Drive Sẽ Được Tự Động Phân Loại:
              </div>
              <div style={{ fontSize: '12.5px', color: '#334155', fontFamily: 'monospace', lineHeight: '1.7', paddingLeft: '8px' }}>
                <div>📁 <strong>THƯ MỤC GỐC NHÀ TRƯỜNG</strong></div>
                <div>├── 📁 <strong>01_SO_HOA_VAN_BANG</strong> (Ảnh scan Bằng tốt nghiệp, Giấy khen theo từng Lớp)</div>
                <div>├── 📁 <strong>02_HO_SO_GIAO_VIEN</strong> (Giáo án, Kế hoạch bài dạy theo Tổ Chuyên Môn)</div>
                <div>├── 📁 <strong>03_VAN_BAN_NHA_TRUONG</strong> (Công văn, Quyết định, Báo cáo theo Năm học)</div>
                <div>├── 📁 <strong>04_DON_DANG_KY_HOC_SINH</strong> (Đơn học thêm, CLB có chữ ký tự động theo Lớp)</div>
                <div>└── 📁 <strong>05_TAI_LIEU_CHUNG</strong> (Các tệp đính kèm học đường khác)</div>
              </div>
            </div>

            {/* Code Box Toggle */}
            <div style={{ marginBottom: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={16} />
                  {showCode ? 'Ẩn mã Google Apps Script' : 'Xem & Sao chép mã Google Apps Script Cho Toàn Trường'}
                </button>

                {showCode && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      backgroundColor: copiedCode ? '#16a34a' : '#1e293b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'Đã sao chép!' : 'Sao chép mã'}
                  </button>
                )}
              </div>

              {showCode && (
                <div>
                  <textarea
                    readOnly
                    value={UNIVERSAL_GOOGLE_APPS_SCRIPT_CODE}
                    rows={12}
                    style={{
                      width: '100%',
                      fontFamily: 'Consolas, monospace',
                      fontSize: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#0f172a',
                      color: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    📌 Các bước triển khai: Mở <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 'bold' }}>script.google.com</a> &gt; Dự án mới &gt; Dán mã &gt; Bấm <strong>Triển khai</strong> (Deploy) &gt; Chọn <strong>Ứng dụng web</strong> &gt; Ai có quyền: <strong>Bất kỳ ai (Anyone)</strong> &gt; Sao chép URL dán vào ô số 1 ở trên.
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '9px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 22px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={16} />
                {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Drive'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
