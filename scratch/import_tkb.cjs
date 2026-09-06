const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = xlsx.readFile('TKBCBQ 2026-2027.xls');

const SUBJECT_MAP = {
  'TOAN': 'Toán',
  'VAN': 'Ngữ văn',
  'NN': 'Tiếng Anh',
  'LY': 'Vật lý',
  'HOA': 'Hóa học',
  'SINH': 'Sinh học',
  'SU': 'Lịch sử',
  'DIA': 'Địa lý',
  'TIN': 'Tin học',
  'CN': 'Công nghệ',
  'GDTC': 'Thể dục',
  'QPAN': 'GDQP-AN',
  'GD': 'GDCD/KTLP',
  'TrNg': 'HĐ Trải nghiệm',
  'GDĐP': 'GD Địa phương',
  'CC': 'Chào cờ',
  'SH': 'Sinh hoạt lớp',
  'Chào cờ': 'Chào cờ'
};

const normalizeClassName = (cls) => {
  if (!cls) return '';
  const clean = String(cls).trim().toUpperCase();
  // Transform 10A01 -> 10A1, 10A09 -> 10A9, keep 10A10 -> 10A10
  return clean.replace('A0', 'A');
};

const parseClassSheet = (sheetName, isAfternoon = false) => {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  
  let headerRowIndex = -1;
  let classNames = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r && (r.includes('10A01') || r.includes('10A1') || r.includes('10A02'))) {
      headerRowIndex = i;
      classNames = r;
      break;
    }
  }

  if (headerRowIndex === -1) return [];

  const items = [];
  let currentDay = 'Thứ 2';

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    if (row[0] && String(row[0]).trim().startsWith('Thứ')) {
      currentDay = String(row[0]).trim();
    }

    const rawPeriod = Number(row[1]);
    if (isNaN(rawPeriod) || rawPeriod <= 0) continue;

    let period = rawPeriod;
    if (isAfternoon && period <= 5) {
      period = period + 5;
    }

    for (let c = 2; c < classNames.length; c++) {
      let rawClassName = String(classNames[c] || '').trim();
      if (!rawClassName) continue;

      const normalizedClass = normalizeClassName(rawClassName);
      const cellVal = String(row[c] || '').trim();
      if (!cellVal) continue;

      let subject = cellVal;
      let teacher = 'BGH & GVCN';

      if (cellVal.includes('-')) {
        const parts = cellVal.split('-').map(p => p.trim());
        const subCode = parts[0];
        subject = SUBJECT_MAP[subCode] || subCode;
        teacher = parts.slice(1).join(' - ');
      } else if (SUBJECT_MAP[cellVal]) {
        subject = SUBJECT_MAP[cellVal];
      }

      items.push({
        id: 'tkb-' + normalizedClass + '-' + currentDay + '-' + period,
        student_class: normalizedClass,
        day_of_week: currentDay,
        period: period,
        subject: subject,
        teacher_name: teacher,
        room: 'Phòng ' + normalizedClass
      });
    }
  }

  return items;
};

const sangItems = parseClassSheet('TKB_Lop_Sang', false);
const chieuItems = parseClassSheet('TKB_Lop_Chieu', true);
const allItems = [...sangItems, ...chieuItems];

console.log('Parsed total lessons:', allItems.length);
console.log('Morning lessons:', sangItems.length);
console.log('Afternoon lessons:', chieuItems.length);

const classes = Array.from(new Set(allItems.map(i => i.student_class))).sort();
const teachers = Array.from(new Set(allItems.map(i => i.teacher_name))).sort();

console.log('Total unique classes (' + classes.length + '):', classes);
console.log('Total unique teachers (' + teachers.length + '):', teachers);

const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'master_timetable.json'), JSON.stringify(allItems, null, 2));
console.log('Saved to src/data/master_timetable.json successfully!');
