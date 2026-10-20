import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Escape plain HTML text to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safe LaTeX to HTML converter using KaTeX
 */
export function renderLatexToHtml(rawText, forceDisplayMode = false) {
  if (rawText === null || rawText === undefined) return '';
  const text = String(rawText);
  if (!text.trim()) return '';

  // Check if text is completely wrapped in display math or requested forceDisplayMode
  if (forceDisplayMode) {
    try {
      const cleanMath = text.replace(/^\$\$|\$\$$|^\\\[|\\\]$/g, '').trim();
      return katex.renderToString(cleanMath, {
        displayMode: true,
        throwOnError: false,
        output: 'htmlAndMathml'
      });
    } catch (_) {
      return escapeHtml(text);
    }
  }

  // Regex matches:
  // 1. $$ ... $$ (display math)
  // 2. \[ ... \] (display math)
  // 3. $ ... $ (inline math, cannot contain unescaped dollar or newline)
  // 4. \( ... \) (inline math)
  const mathTokenRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[^\$\n])+?\$|\\\([\s\S]*?\\\))/g;

  let lastIndex = 0;
  let htmlResult = '';
  let match;

  while ((match = mathTokenRegex.exec(text)) !== null) {
    // 1. Plain text before match
    if (match.index > lastIndex) {
      const plain = text.substring(lastIndex, match.index);
      htmlResult += escapeHtml(plain).replace(/\n/g, '<br/>');
    }

    const token = match[0];
    try {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const math = token.slice(2, -2).trim();
        htmlResult += katex.renderToString(math, {
          displayMode: true,
          throwOnError: false,
          output: 'htmlAndMathml'
        });
      } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
        const math = token.slice(2, -2).trim();
        htmlResult += katex.renderToString(math, {
          displayMode: true,
          throwOnError: false,
          output: 'htmlAndMathml'
        });
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const math = token.slice(1, -1).trim();
        htmlResult += katex.renderToString(math, {
          displayMode: false,
          throwOnError: false,
          output: 'htmlAndMathml'
        });
      } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
        const math = token.slice(2, -2).trim();
        htmlResult += katex.renderToString(math, {
          displayMode: false,
          throwOnError: false,
          output: 'htmlAndMathml'
        });
      }
    } catch (e) {
      // Fallback in case of rendering error
      htmlResult += escapeHtml(token);
    }

    lastIndex = mathTokenRegex.lastIndex;
  }

  // Plain text after last match
  if (lastIndex < text.length) {
    const trailing = text.substring(lastIndex);
    // If text had no dollar signs at all, but looks like a standalone LaTeX formula
    if (lastIndex === 0 && (
      trailing.includes('\\frac') || 
      trailing.includes('\\sqrt') || 
      trailing.includes('\\int') || 
      trailing.includes('\\lim') || 
      trailing.includes('\\vec') ||
      trailing.includes('\\sum') ||
      trailing.includes('^') ||
      trailing.includes('_')
    )) {
      try {
        return katex.renderToString(trailing.trim(), {
          displayMode: false,
          throwOnError: false,
          output: 'htmlAndMathml'
        });
      } catch (_) {
        return escapeHtml(trailing).replace(/\n/g, '<br/>');
      }
    }

    htmlResult += escapeHtml(trailing).replace(/\n/g, '<br/>');
  }

  return htmlResult;
}

/**
 * Universal MathView Component
 * Renders rich text containing LaTeX formulas inline or block seamlessly
 */
export default function MathView({ text, inline = false, displayMode = false, className = '', style = {} }) {
  const renderedHtml = useMemo(() => {
    return renderLatexToHtml(text, displayMode);
  }, [text, displayMode]);

  const Tag = inline ? 'span' : 'div';

  return (
    <Tag
      className={`cbq-math-view ${className}`}
      style={{
        display: inline ? 'inline' : 'block',
        lineHeight: 1.6,
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

/**
 * Quick Math Symbols & LaTeX Palette for Teachers
 * Allows 1-click insertion of common mathematical formulas
 */
export function MathToolbar({ onInsert, compact = false }) {
  const categories = [
    {
      name: 'Đại số & Giải tích',
      items: [
        { label: 'Phân số', latex: '$\\frac{a}{b}$', preview: 'a/b' },
        { label: 'Căn bậc 2', latex: '$\\sqrt{x}$', preview: '√x' },
        { label: 'Căn bậc n', latex: '$\\sqrt[n]{x}$', preview: 'ⁿ√x' },
        { label: 'Số mũ', latex: '$x^{2}$', preview: 'x²' },
        { label: 'Chỉ số', latex: '$x_{1}$', preview: 'x₁' },
        { label: 'Tích phân', latex: '$\\int_{a}^{b} f(x)dx$', preview: '∫' },
        { label: 'Giới hạn', latex: '$\\lim_{x \\to 0} f(x)$', preview: 'lim' },
        { label: 'Tổng xích-ma', latex: '$\\sum_{i=1}^{n} x_i$', preview: '∑' },
        { label: 'Logarit', latex: '$\\log_a b$', preview: 'log' },
        { label: 'Ln', latex: '$\\ln x$', preview: 'ln' },
        { label: 'Vô cùng', latex: '$\\infty$', preview: '∞' },
        { label: 'Hệ phương trình', latex: '$\\begin{cases} x + y = 1 \\\\ 2x - y = 3 \\end{cases}$', preview: '{' }
      ]
    },
    {
      name: 'Hình học & Vectơ',
      items: [
        { label: 'Vectơ', latex: '$\\vec{u}$', preview: 'u⃗' },
        { label: 'Đoạn thẳng / Vectơ AB', latex: '$\\vec{AB}$', preview: 'AB⃗' },
        { label: 'Góc', latex: '$\\widehat{ABC}$', preview: '∠' },
        { label: 'Độ', latex: '$90^\\circ$', preview: '90°' },
        { label: 'Vuông góc', latex: '$\\perp$', preview: '⊥' },
        { label: 'Song song', latex: '$\\parallel$', preview: '∥' },
        { label: 'Tam giác', latex: '$\\Delta ABC$', preview: '△' }
      ]
    },
    {
      name: 'Ký hiệu & Tập hợp',
      items: [
        { label: 'Thuộc', latex: '$\\in$', preview: '∈' },
        { label: 'Không thuộc', latex: '$\\notin$', preview: '∉' },
        { label: 'Tập con', latex: '$\\subset$', preview: '⊂' },
        { label: 'Hợp', latex: '$\\cup$', preview: '∪' },
        { label: 'Giao', latex: '$\\cap$', preview: '∩' },
        { label: 'Tập R', latex: '$\\mathbb{R}$', preview: 'ℝ' },
        { label: 'Tập N', latex: '$\\mathbb{N}$', preview: 'ℕ' },
        { label: 'Tương đương', latex: '$\\Leftrightarrow$', preview: '⇔' },
        { label: 'Suy ra', latex: '$\\Rightarrow$', preview: '⇒' },
        { label: 'Lớn hơn bằng', latex: '$\\ge$', preview: '≥' },
        { label: 'Nhỏ hơn bằng', latex: '$\\le$', preview: '≤' },
        { label: 'Khác', latex: '$\\ne$', preview: '≠' },
        { label: 'Cộng trừ', latex: '$\\pm$', preview: '±' },
        { label: 'Nhân', latex: '$\\cdot$', preview: '·' },
        { label: 'Alpha', latex: '$\\alpha$', preview: 'α' },
        { label: 'Beta', latex: '$\\beta$', preview: 'β' },
        { label: 'Pi', latex: '$\\pi$', preview: 'π' }
      ]
    }
  ];

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      padding: compact ? '8px' : '12px',
      marginBottom: '12px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '6px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⚡ Bảng Ký Hiệu Toán & Công Thức LaTeX Nhanh</span>
          <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>
            Bấm để chèn tự động
          </span>
        </div>
        <span style={{ fontSize: '11.5px', color: '#0369a1', fontStyle: 'italic' }}>
          💡 Có thể gõ trực tiếp công thức giữa 2 dấu $...$
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categories.map((cat, cIdx) => (
          <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', minWidth: '100px' }}>
              {cat.name}:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {cat.items.map((item, iIdx) => (
                <button
                  key={iIdx}
                  type="button"
                  onClick={() => onInsert && onInsert(item.latex)}
                  title={`${item.label} (${item.latex})`}
                  style={{
                    padding: '4px 8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0f172a',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0284c7';
                    e.currentTarget.style.background = '#f0f9ff';
                    e.currentTarget.style.color = '#0284c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                >
                  <span style={{ fontWeight: '600', fontFamily: 'KaTeX_Main, Times New Roman, serif' }}>{item.preview}</span>
                  {!compact && <span style={{ fontSize: '10.5px', color: '#64748b' }}>{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
