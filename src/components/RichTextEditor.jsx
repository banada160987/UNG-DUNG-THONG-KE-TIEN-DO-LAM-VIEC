import React, { useState, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3, Code, Eye, Type, Quote } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder = 'Nhập nội dung bài viết...' }) {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'code' | 'preview'
  const editorRef = useRef(null);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
      {/* Toolbar Header */}
      <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {/* Formatting Buttons */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => execCommand('bold')}
            style={btnStyle}
            title="In đậm (Bold)"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            style={btnStyle}
            title="In nghiêng (Italic)"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            style={btnStyle}
            title="Gạch chân (Underline)"
          >
            <Underline size={16} />
          </button>

          <div style={{ width: '1px', height: '20px', background: '#cbd5e1', margin: '0 4px' }} />

          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h2>')}
            style={btnStyle}
            title="Tiêu đề lớn (H2)"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h3>')}
            style={btnStyle}
            title="Tiêu đề vừa (H3)"
          >
            <Heading3 size={16} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<p>')}
            style={btnStyle}
            title="Đoạn văn (Paragraph)"
          >
            <Type size={16} />
          </button>

          <div style={{ width: '1px', height: '20px', background: '#cbd5e1', margin: '0 4px' }} />

          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            style={btnStyle}
            title="Danh sách dấu chấm"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            style={btnStyle}
            title="Danh sách số"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            style={btnStyle}
            title="Trích dẫn (Quote)"
          >
            <Quote size={16} />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            style={{ ...tabBtnStyle, background: activeTab === 'editor' ? 'white' : 'transparent', color: activeTab === 'editor' ? '#0f172a' : '#64748b' }}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            style={{ ...tabBtnStyle, background: activeTab === 'code' ? 'white' : 'transparent', color: activeTab === 'code' ? '#0f172a' : '#64748b' }}
          >
            <Code size={14} /> HTML
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{ ...tabBtnStyle, background: activeTab === 'preview' ? 'white' : 'transparent', color: activeTab === 'preview' ? '#0f172a' : '#64748b' }}
          >
            <Eye size={14} /> Xem trước
          </button>
        </div>
      </div>

      {/* Content Editor Body */}
      {activeTab === 'editor' && (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: value || '' }}
          style={{
            minHeight: '220px',
            padding: '16px',
            outline: 'none',
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#1e293b'
          }}
        />
      )}

      {activeTab === 'code' && (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="<h1>Tiêu đề</h1><p>Nội dung HTML...</p>"
          style={{
            width: '100%',
            minHeight: '220px',
            padding: '16px',
            border: 'none',
            outline: 'none',
            fontFamily: 'monospace',
            fontSize: '13px',
            background: '#0f172a',
            color: '#38bdf8',
            resize: 'vertical'
          }}
        />
      )}

      {activeTab === 'preview' && (
        <div 
          dangerouslySetInnerHTML={{ __html: value || '<p style="color:#94a3b8; font-style:italic">Chưa có nội dung để xem trước.</p>' }}
          style={{
            minHeight: '220px',
            padding: '16px',
            background: '#fafafa',
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#334155'
          }}
        />
      )}
    </div>
  );
}

const btnStyle = {
  padding: '6px 8px',
  background: 'white',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  cursor: 'pointer',
  color: '#475569',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const tabBtnStyle = {
  padding: '4px 10px',
  border: 'none',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
};
