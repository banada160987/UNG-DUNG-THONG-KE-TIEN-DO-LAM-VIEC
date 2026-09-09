import fs from 'fs';

const code = fs.readFileSync('src/pages/AdminRegistrations.jsx', 'utf-8');

const lines = code.split('\n');
const stack = [];

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  // match JSX opening tags <Tag or <Tag ... > (excluding self-closing <Tag /> or <br/> or <img /> or <input />)
  const openMatches = line.matchAll(/<([A-Za-z0-9]+)(\s+[^>]*)?>(?!\s*<\/\1>)/g);
  // match JSX closing tags </Tag>
  const closeMatches = line.matchAll(/<\/([A-Za-z0-9]+)>/g);

  // We can track tags specifically like div, table, tbody, tr, td, form, Layout
  const selfClosing = ['input', 'img', 'br', 'hr', 'Plus', 'Save', 'Trash2', 'Edit3', 'Settings', 'Users', 'FileText', 'CheckCircle2', 'ListFilter', 'Download', 'Server', 'Printer', 'Filter', 'X', 'ArrowUpDown', 'QrCode', 'Calendar', 'Bike', 'Bus'];

  const tagsInLine = [];
  
  // Find all tags in order
  const tagRegex = /<\/?([A-Za-z0-9]+)[^>]*>/g;
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const full = match[0];
    const tagName = match[1];
    if (selfClosing.includes(tagName) || full.endsWith('/>')) continue;
    
    if (full.startsWith('</')) {
      if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
        stack.pop();
      } else {
        console.log(`Mismatch at line ${lineNum}: closing </${tagName}> but stack top is`, stack[stack.length - 1]);
      }
    } else {
      stack.push({ tag: tagName, line: lineNum });
    }
  }
});

console.log("Remaining unclosed tags in stack:", stack);
