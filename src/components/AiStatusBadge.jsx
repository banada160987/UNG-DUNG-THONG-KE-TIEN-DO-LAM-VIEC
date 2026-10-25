import React, { useState, useEffect } from 'react';
import { Sparkles, Key } from 'lucide-react';
import { getAiKeySource } from '../services/aiAssistantService';
import AiSettingsModal from './AiSettingsModal';

export default function AiStatusBadge({ style = {}, showLabel = true }) {
  const [keySource, setKeySource] = useState('none');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setKeySource(getAiKeySource());

    const handleUpdate = () => {
      setKeySource(getAiKeySource());
    };

    window.addEventListener('cbq_ai_key_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('cbq_ai_key_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const badgeConfig = {
    custom: {
      dot: '🟢',
      label: 'AI: Khóa Cá Nhân',
      sub: 'Đã kích hoạt',
      bg: '#f0fdf4',
      border: '#86efac',
      text: '#166534'
    },
    env: {
      dot: '🔵',
      label: 'AI: Hệ Thống Trường',
      sub: 'Sẵn sàng',
      bg: '#eff6ff',
      border: '#93c5fd',
      text: '#1e40af'
    },
    none: {
      dot: '🟡',
      label: 'AI: Chưa kích hoạt',
      sub: 'Bấm để gán Key',
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e'
    }
  }[keySource] || {
    dot: '🟡',
    label: 'AI: Chưa kích hoạt',
    sub: 'Bấm để gán Key',
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#92400e'
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title="Bấm để cấu hình Google Gemini API Key hoặc chọn mô hình AI"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 11px',
          borderRadius: '20px',
          border: `1.5px solid ${badgeConfig.border}`,
          backgroundColor: badgeConfig.bg,
          color: badgeConfig.text,
          fontSize: '12px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          ...style
        }}
      >
        <span style={{ fontSize: '11px' }}>{badgeConfig.dot}</span>
        {showLabel && <span>{badgeConfig.label}</span>}
        <Sparkles size={13} />
      </button>

      <AiSettingsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
