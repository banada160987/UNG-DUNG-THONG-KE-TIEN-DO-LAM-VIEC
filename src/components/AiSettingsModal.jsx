import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Key, CheckCircle2, AlertTriangle, ExternalLink, 
  Trash2, Save, X, Eye, EyeOff, RefreshCw, Cpu, ShieldCheck
} from 'lucide-react';
import { 
  getStoredAiKey, 
  saveStoredAiKey, 
  getAiKeySource, 
  getStoredAiModel, 
  AI_MODELS, 
  testGeminiConnection 
} from '../services/aiAssistantService';

export default function AiSettingsModal({ isOpen, onClose }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [keySource, setKeySource] = useState('none');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentKey = getStoredAiKey();
      setApiKeyInput(currentKey || '');
      setSelectedModel(getStoredAiModel());
      setKeySource(getAiKeySource());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({
        success: false,
        error: 'Vui lòng dán API Key trước khi kiểm tra.'
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection(apiKeyInput.trim(), selectedModel);
      setTestResult(res);
    } catch (e) {
      setTestResult({
        success: false,
        error: 'Có lỗi phát sinh khi kiểm tra kết nối: ' + (e?.message || e)
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    saveStoredAiKey(trimmed, selectedModel);
    setKeySource(getAiKeySource());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClearCustomKey = () => {
    saveStoredAiKey('', selectedModel);
    setApiKeyInput(getStoredAiKey() || '');
    setKeySource(getAiKeySource());
    setTestResult(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        border: '1.5px solid #cbd5e1',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
            }}>
              🤖
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#38bdf8' }}>
                CẤU HÌNH TRỢ LÝ AI SƯ PHẠM
              </h3>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Google Gemini API • Tự gán Key cá nhân hoặc dùng mặc định
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* TRẠNG THÁI HIỆN TẠI */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: keySource === 'custom' ? '#f0fdf4' : (keySource === 'env' ? '#eff6ff' : '#fffbeb'),
            border: `1.5px solid ${keySource === 'custom' ? '#86efac' : (keySource === 'env' ? '#93c5fd' : '#fde68a')}`,
            borderRadius: '12px',
            padding: '10px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>
                {keySource === 'custom' ? '🟢' : (keySource === 'env' ? '🔵' : '🟡')}
              </span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: keySource === 'custom' ? '#166534' : (keySource === 'env' ? '#1e40af' : '#92400e') }}>
                  {keySource === 'custom' ? 'Đang dùng Khóa Cá Nhân của Thầy/Cô' : (keySource === 'env' ? 'Đang dùng Khóa Mặc Định của Nhà Trường' : 'Chưa có Khóa API')}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  {keySource === 'custom' ? 'Ưu tiên cao nhất • Không lo nghẽn hạn mức toàn trường' : (keySource === 'env' ? 'Khóa dùng chung cấu hình sẵn' : 'Vui lòng gán Key cá nhân để sử dụng tính năng AI')}
                </div>
              </div>
            </div>
          </div>

          {/* CHỌN MÔ HÌNH AI */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Mô hình AI xử lý:
            </label>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                fontWeight: '600',
                color: '#0f172a',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            >
              {AI_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Ô NHẬP API KEY */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={15} color="#0284c7" /> Google Gemini API Key:
              </label>
              {keySource === 'custom' && (
                <button
                  type="button"
                  onClick={handleClearCustomKey}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Xóa khóa cá nhân để quay về dùng khóa hệ thống"
                >
                  <Trash2 size={13} /> Xóa khóa cá nhân
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="Dán mã khóa AIzaSy... vào đây"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #94a3b8',
                  fontSize: '13.5px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* KẾT QUẢ KIỂM TRA KẾT NỐI */}
          {testResult && (
            <div style={{
              backgroundColor: testResult.success ? '#ecfdf5' : '#fef2f2',
              border: `1.5px solid ${testResult.success ? '#6ee7b7' : '#fca5a5'}`,
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12.5px',
              color: testResult.success ? '#065f46' : '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {testResult.success ? <CheckCircle2 size={18} color="#059669" /> : <AlertTriangle size={18} color="#dc2626" />}
              <div>
                <strong>{testResult.success ? 'Kiểm tra thành công!' : 'Kiểm tra thất bại:'}</strong> {testResult.success ? testResult.message : testResult.error}
              </div>
            </div>
          )}

          {/* HƯỚNG DẪN LẤY KEY MIỄN PHÍ */}
          <div style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '12px',
            color: '#475569',
            lineHeight: '1.5'
          }}>
            <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>💡 Cách lấy API Key miễn phí (mất 30 giây):</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0284c7',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Mở Google AI Studio <ExternalLink size={12} />
              </a>
            </div>
            1. Bấm mở liên kết trên và đăng nhập bằng bất kỳ tài khoản Gmail nào.<br />
            2. Bấm nút màu xanh <strong>"Create API key"</strong> (Tạo khóa API).<br />
            3. Sao chép dòng mã dạng <code>AIzaSy...</code> và dán vào ô trên, sau đó bấm <strong>Lưu Cấu Hình</strong>.
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '13px',
              fontWeight: '700',
              cursor: testing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={testing ? 'spin' : ''} />
            {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối AI'}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: savedSuccess ? '#16a34a' : '#0284c7',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
              }}
            >
              {savedSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {savedSuccess ? 'Đã lưu thành công!' : 'Lưu Cấu Hình'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
