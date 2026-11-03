import ExcelJS from 'exceljs';
import { supabase } from '../lib/supabase';
import { normalizeClassName } from './sportsTournamentService';

// 34 Chi đoàn lớp chính thức của Trường THPT Cao Bá Quát
export const ALL_CBQ_CLASSES_34 = [
  // Khối 10: 15 lớp
  { id: '10A01', name: '10A01', grade: 'Khối 10', homeroom: '10A01' },
  { id: '10A02', name: '10A02', grade: 'Khối 10', homeroom: '10A02' },
  { id: '10A03', name: '10A03', grade: 'Khối 10', homeroom: '10A03' },
  { id: '10A04', name: '10A04', grade: 'Khối 10', homeroom: '10A04' },
  { id: '10A05', name: '10A05', grade: 'Khối 10', homeroom: '10A05' },
  { id: '10A06', name: '10A06', grade: 'Khối 10', homeroom: '10A06' },
  { id: '10A07', name: '10A07', grade: 'Khối 10', homeroom: '10A07' },
  { id: '10A08', name: '10A08', grade: 'Khối 10', homeroom: '10A08' },
  { id: '10A09', name: '10A09', grade: 'Khối 10', homeroom: '10A09' },
  { id: '10A10', name: '10A10', grade: 'Khối 10', homeroom: '10A10' },
  { id: '10A11', name: '10A11', grade: 'Khối 10', homeroom: '10A11' },
  { id: '10A12', name: '10A12', grade: 'Khối 10', homeroom: '10A12' },
  { id: '10A13', name: '10A13', grade: 'Khối 10', homeroom: '10A13' },
  { id: '10A14', name: '10A14', grade: 'Khối 10', homeroom: '10A14' },
  { id: '10A15', name: '10A15', grade: 'Khối 10', homeroom: '10A15' },

  // Khối 11: 9 lớp
  { id: '11A01', name: '11A01', grade: 'Khối 11', homeroom: '11A01' },
  { id: '11A02', name: '11A02', grade: 'Khối 11', homeroom: '11A02' },
  { id: '11A03', name: '11A03', grade: 'Khối 11', homeroom: '11A03' },
  { id: '11A04', name: '11A04', grade: 'Khối 11', homeroom: '11A04' },
  { id: '11A05', name: '11A05', grade: 'Khối 11', homeroom: '11A05' },
  { id: '11A06', name: '11A06', grade: 'Khối 11', homeroom: '11A06' },
  { id: '11A07', name: '11A07', grade: 'Khối 11', homeroom: '11A07' },
  { id: '11A08', name: '11A08', grade: 'Khối 11', homeroom: '11A08' },
  { id: '11A09', name: '11A09', grade: 'Khối 11', homeroom: '11A09' },

  // Khối 12: 10 lớp
  { id: '12A01', name: '12A01', grade: 'Khối 12', homeroom: '12A01' },
  { id: '12A02', name: '12A02', grade: 'Khối 12', homeroom: '12A02' },
  { id: '12A03', name: '12A03', grade: 'Khối 12', homeroom: '12A03' },
  { id: '12A04', name: '12A04', grade: 'Khối 12', homeroom: '12A04' },
  { id: '12A05', name: '12A05', grade: 'Khối 12', homeroom: '12A05' },
  { id: '12A06', name: '12A06', grade: 'Khối 12', homeroom: '12A06' },
  { id: '12A07', name: '12A07', grade: 'Khối 12', homeroom: '12A07' },
  { id: '12A08', name: '12A08', grade: 'Khối 12', homeroom: '12A08' },
  { id: '12A09', name: '12A09', grade: 'Khối 12', homeroom: '12A09' },
  { id: '12A10', name: '12A10', grade: 'Khối 12', homeroom: '12A10' }
];

/**
 * Thuật toán Shuffle Fisher-Yates công tâm ngẫu nhiên 100%
 */
export function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Chuẩn hóa danh sách các đội đã đăng ký (Loại bỏ 100% trùng lặp, giữ bản ghi mới nhất):
 */
export function prepareRegisteredTeams(inputTeams = []) {
  const map = new Map();
  // Sắp xếp theo created_at hoặc id để bản ghi mới nhất ghi đè bản ghi cũ
  const sorted = [...(inputTeams || [])].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeA - timeB;
  });

  sorted.forEach(t => {
    const raw = t.cohort_year || t.unit_name || t.full_name || t.name;
    const cleanName = normalizeClassName(raw);
    if (cleanName) {
      const grade = cleanName.startsWith('10') ? 'Khối 10' : (cleanName.startsWith('11') ? 'Khối 11' : 'Khối 12');
      map.set(cleanName, {
        id: t.id || cleanName,
        name: cleanName,
        fullName: `Chi đoàn ${cleanName}`,
        grade: grade,
        captain: t.full_name || t.captain_name || '',
        phone: t.phone || '',
        isRegistered: true,
        source: 'registered',
        created_at: t.created_at || null
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Chuẩn hóa danh sách 34 đội đầu vào:
 * Nếu danh sách đội đăng ký ít hơn 34, tự động bù đủ 34 lớp trường CBQ với nhãn (Chờ bổ sung).
 * Đảm bảo 100% không có đội nào bị lặp lại.
 */
export function prepare34Teams(inputTeams = []) {
  const map = new Map();
  
  // 1. Đưa các đội đăng ký hợp lệ vào trước (đã deduplicate theo tên lớp chuẩn)
  const registeredTeams = prepareRegisteredTeams(inputTeams);
  registeredTeams.forEach(team => {
    map.set(team.name, team);
  });

  // 2. Điền nốt các lớp CBQ còn thiếu để đủ 34 lớp toàn trường
  ALL_CBQ_CLASSES_34.forEach(cls => {
    if (!map.has(cls.name)) {
      map.set(cls.name, {
        id: cls.id,
        name: cls.name,
        fullName: `Chi đoàn ${cls.name} (Chờ bổ sung)`,
        grade: cls.grade,
        captain: 'Chưa nộp danh sách',
        phone: '',
        isRegistered: false,
        source: 'cbq_classes'
      });
    }
  });

  return Array.from(map.values()).slice(0, 34);
}

/**
 * Sinh cấu trúc Sơ Đồ Signmar 34 Đội chuẩn thể thao học đường:
 * - 34 đội:
 *   + 4 đội tham gia 2 trận Vòng Sơ Loại (Play-in 1: Nhánh Trên, Play-in 2: Nhánh Dưới)
 *   + 30 đội vào thẳng Vòng 32 (vé Bye ở sơ loại)
 *   + 2 đội thắng sơ loại bước vào hoàn thiện đủ 32 đội ở Vòng 1/16 (16 trận)
 *   + Vòng 16 (8 trận) -> Tứ kết (4 trận) -> Bán kết (2 trận) -> Chung kết (1 trận)
 */
export function createSignmar34Draw(inputTeams = [], options = {}) {
  let drawnTeams;

  if (options.shuffledTeams && options.shuffledTeams.length >= 34) {
    drawnTeams = options.shuffledTeams.map((team, idx) => ({
      ...team,
      drawNo: idx + 1,
      branch: (idx + 1) <= 17 ? 'Nhánh Trên (A)' : 'Nhánh Dưới (B)'
    }));
  } else {
    const prepared = prepare34Teams(inputTeams);
    const shuffled = shuffleArray(prepared);
    drawnTeams = shuffled.map((team, idx) => ({
      ...team,
      drawNo: idx + 1,
      branch: (idx + 1) <= 17 ? 'Nhánh Trên (A)' : 'Nhánh Dưới (B)'
    }));
  }

  /**
   * Phân bổ 34 đội vào sơ đồ Signmar:
   * 32 vị trí thi đấu chính (Slots 1 -> 32)
   * Slot 11 (Nhánh Trên): Được quyết định bởi Trận Sơ Loại 1 (Đội 11 gặp Đội 12)
   * Slot 27 (Nhánh Dưới): Được quyết định bởi Trận Sơ Loại 2 (Đội 27 gặp Đội 28)
   * 30 vị trí còn lại là các đội vào thẳng vòng 32!
   */

  // 4 đội thi đấu sơ loại
  const prelimTeam1 = drawnTeams[10]; // Đội số thăm 11
  const prelimTeam2 = drawnTeams[11]; // Đội số thăm 12
  const prelimTeam3 = drawnTeams[26]; // Đội số thăm 27
  const prelimTeam4 = drawnTeams[27]; // Đội số thăm 28

  // VÒNG SƠ LOẠI (PRELIMINARY ROUND - 2 TRẬN)
  const prelimMatches = [
    {
      id: 'prelim-1',
      round: 'prelim',
      roundName: 'Vòng Sơ Loại 1 (Nhánh Trên)',
      matchNumber: 1,
      teamA: prelimTeam1,
      teamB: prelimTeam2,
      scoreA: '',
      scoreB: '',
      winner: null,
      status: 'pending',
      nextMatchId: 'r32-6',
      nextSlot: 'teamB',
      note: 'Thắng vào Trận 6 Vòng 32'
    },
    {
      id: 'prelim-2',
      round: 'prelim',
      roundName: 'Vòng Sơ Loại 2 (Nhánh Dưới)',
      matchNumber: 2,
      teamA: prelimTeam3,
      teamB: prelimTeam4,
      scoreA: '',
      scoreB: '',
      winner: null,
      status: 'pending',
      nextMatchId: 'r32-14',
      nextSlot: 'teamB',
      note: 'Thắng vào Trận 14 Vòng 32'
    }
  ];

  // 32 slots của Vòng 32
  // Map 30 đội miễn đấu + 2 slot chờ người thắng sơ loại
  const r32Slots = [];
  let teamPointer = 0;

  for (let s = 1; s <= 32; s++) {
    if (s === 11) {
      // Slot 11: Đội thắng Trận Sơ Loại 1
      r32Slots.push({
        slotNo: s,
        isPrelimSlot: true,
        prelimMatchId: 'prelim-1',
        placeholder: 'Thắng Sơ Loại 1',
        team: null
      });
    } else if (s === 27) {
      // Slot 27: Đội thắng Trận Sơ Loại 2
      r32Slots.push({
        slotNo: s,
        isPrelimSlot: true,
        prelimMatchId: 'prelim-2',
        placeholder: 'Thắng Sơ Loại 2',
        team: null
      });
    } else {
      // Bỏ qua các đội đã xếp vào sơ loại (index 10, 11, 26, 27)
      while (teamPointer === 10 || teamPointer === 11 || teamPointer === 26 || teamPointer === 27) {
        teamPointer++;
      }
      r32Slots.push({
        slotNo: s,
        isPrelimSlot: false,
        placeholder: '',
        team: drawnTeams[teamPointer++] || null
      });
    }
  }

  // VÒNG 32 ĐỘI (ROUND OF 32 - 16 TRẬN)
  const r32Matches = [];
  for (let i = 0; i < 16; i++) {
    const slotA = r32Slots[i * 2];
    const slotB = r32Slots[i * 2 + 1];
    const nextMatchIdx = Math.floor(i / 2) + 1;
    const nextSlot = (i % 2 === 0) ? 'teamA' : 'teamB';

    r32Matches.push({
      id: `r32-${i + 1}`,
      round: 'round32',
      roundName: 'Vòng 32 Đội (1/16)',
      matchNumber: i + 3, // Bắt đầu sau 2 trận sơ loại
      teamA: slotA.team,
      teamB: slotB.team,
      placeholderA: slotA.placeholder || '',
      placeholderB: slotB.placeholder || '',
      scoreA: '',
      scoreB: '',
      winner: null,
      status: 'pending',
      nextMatchId: `r16-${nextMatchIdx}`,
      nextSlot: nextSlot
    });
  }

  // VÒNG 16 ĐỘI (ROUND OF 16 - 8 TRẬN)
  const r16Matches = [];
  for (let i = 0; i < 8; i++) {
    const nextMatchIdx = Math.floor(i / 2) + 1;
    const nextSlot = (i % 2 === 0) ? 'teamA' : 'teamB';
    r16Matches.push({
      id: `r16-${i + 1}`,
      round: 'round16',
      roundName: 'Vòng 16 Đội (1/8)',
      matchNumber: 19 + i,
      teamA: null,
      teamB: null,
      placeholderA: `Thắng Trận ${i * 2 + 3}`,
      placeholderB: `Thắng Trận ${i * 2 + 4}`,
      scoreA: '',
      scoreB: '',
      winner: null,
      status: 'pending',
      nextMatchId: `qtr-${nextMatchIdx}`,
      nextSlot: nextSlot
    });
  }

  // VÒNG TỨ KẾT (QUARTER-FINALS - 4 TRẬN)
  const qtrMatches = [];
  for (let i = 0; i < 4; i++) {
    const nextMatchIdx = Math.floor(i / 2) + 1;
    const nextSlot = (i % 2 === 0) ? 'teamA' : 'teamB';
    qtrMatches.push({
      id: `qtr-${i + 1}`,
      round: 'quarter',
      roundName: `Tứ Kết ${i + 1}`,
      matchNumber: 27 + i,
      teamA: null,
      teamB: null,
      placeholderA: `Thắng Trận ${19 + i * 2}`,
      placeholderB: `Thắng Trận ${20 + i * 2}`,
      scoreA: '',
      scoreB: '',
      winner: null,
      status: 'pending',
      nextMatchId: `semi-${nextMatchIdx}`,
      nextSlot: nextSlot
    });
  }

  // VÒNG BÁN KẾT (SEMI-FINALS - 2 TRẬN)
  const semiMatches = [
    {
      id: 'semi-1',
      round: 'semi',
      roundName: 'Bán Kết 1 (Nhánh Trên)',
      matchNumber: 31,
      teamA: null,
      teamB: null,
      placeholderA: 'Thắng Tứ Kết 1',
      placeholderB: 'Thắng Tứ Kết 2',
      scoreA: '',
      scoreB: '',
      winner: null,
      status: 'pending',
      nextMatchId: 'final-1',
      nextSlot: 'teamA'
    },
    {
      id: 'semi-2',
      round: 'semi',
      roundName: 'Bán Kết 2 (Nhánh Dưới)',
      matchNumber: 32,
      teamA: null,
      teamB: null,
      placeholderA: 'Thắng Tứ Kết 3',
      placeholderB: 'Thắng Tứ Kết 4',
      scoreA: '',
      scoreB: '',
      winner: null,
      status: 'pending',
      nextMatchId: 'final-1',
      nextSlot: 'teamB'
    }
  ];

  // TRẬN CHUNG KẾT (FINAL - 1 TRẬN)
  const finalMatch = {
    id: 'final-1',
    round: 'final',
    roundName: '🏆 TRẬN CHUNG KẾT TRANH CÚP VÔ ĐỊCH',
    matchNumber: 33,
    teamA: null,
    teamB: null,
    placeholderA: 'Thắng Bán Kết 1',
    placeholderB: 'Thắng Bán Kết 2',
    scoreA: '',
    scoreB: '',
    winner: null,
    status: 'pending',
    isChampionMatch: true
  };

  // TRẬN TRANH HẠNG BA (OPTIONAL)
  const thirdPlaceMatch = {
    id: 'third-1',
    round: 'third',
    roundName: '🥉 Trận Tranh Hạng Ba',
    matchNumber: 34,
    teamA: null,
    teamB: null,
    placeholderA: 'Thua Bán Kết 1',
    placeholderB: 'Thua Bán Kết 2',
    scoreA: '',
    scoreB: '',
    winner: null,
    status: 'pending'
  };

  return {
    type: 'signmar_34',
    drawnAt: new Date().toISOString(),
    totalTeams: 34,
    sportName: options.sportName || 'Bóng chuyền Nam - Nữ phối hợp',
    tournamentName: options.tournamentName || 'Giải Thể Thao Trường THPT Cao Bá Quát',
    drawnTeams: drawnTeams,
    r32Slots: r32Slots,
    matches: {
      prelim: prelimMatches,
      round32: r32Matches,
      round16: r16Matches,
      quarter: qtrMatches,
      semi: semiMatches,
      final: [finalMatch],
      thirdPlace: [thirdPlaceMatch]
    },
    champion: null,
    runnerUp: null,
    thirdPlace: null
  };
}

/**
 * Cập nhật tỷ số hoặc chọn đội thắng của một trận đấu trong sơ đồ Signmar:
 * Tự động đưa đội thắng tiến vào vòng thi đấu kế tiếp!
 */
export function updateSignmarMatch(bracket, matchId, updates) {
  if (!bracket || !bracket.matches) return bracket;

  const newBracket = JSON.parse(JSON.stringify(bracket));
  let targetMatch = null;
  let targetRoundKey = null;

  // Tìm trận đấu theo ID
  for (const [roundKey, list] of Object.entries(newBracket.matches)) {
    const found = list.find(m => m.id === matchId);
    if (found) {
      targetMatch = found;
      targetRoundKey = roundKey;
      break;
    }
  }

  if (!targetMatch) return bracket;

  // Cập nhật thông tin trận hiện tại
  Object.assign(targetMatch, updates);

  // Nếu có đội thắng
  if (updates.winner) {
    targetMatch.status = 'completed';

    // Đưa đội thắng vào trận kế tiếp
    if (targetMatch.nextMatchId && targetMatch.nextSlot) {
      for (const list of Object.values(newBracket.matches)) {
        const nextM = list.find(m => m.id === targetMatch.nextMatchId);
        if (nextM) {
          nextM[targetMatch.nextSlot] = updates.winner;
          break;
        }
      }
    }

    // Nếu trận chung kết có người thắng -> Phong VÔ ĐỊCH
    if (targetMatch.id === 'final-1') {
      newBracket.champion = updates.winner;
      const loser = (targetMatch.winner.id === targetMatch.teamA?.id) ? targetMatch.teamB : targetMatch.teamA;
      newBracket.runnerUp = loser;
    }

    // Nếu trận bán kết hoàn tất, đưa đội thua vào tranh hạng ba
    if (targetMatch.id === 'semi-1') {
      const loser = (targetMatch.winner.id === targetMatch.teamA?.id) ? targetMatch.teamB : targetMatch.teamA;
      newBracket.matches.thirdPlace[0].teamA = loser;
    }
    if (targetMatch.id === 'semi-2') {
      const loser = (targetMatch.winner.id === targetMatch.teamA?.id) ? targetMatch.teamB : targetMatch.teamA;
      newBracket.matches.thirdPlace[0].teamB = loser;
    }

    // Nếu trận tranh hạng ba có người thắng
    if (targetMatch.id === 'third-1') {
      newBracket.thirdPlace = updates.winner;
    }
  }

  return newBracket;
}

/**
 * Xuất Sơ Đồ Signmar 34 Đội ra file Excel chuẩn (kẻ sơ đồ xương cá nhị phân y hệt ảnh)
 * Đảm bảo quy tắc tên file [GEMINI.md]: 1-So_do_signmar_34_doi_[Ten_mon]...
 */
export async function exportSignmarToExcel(bracket, tournamentTitle = 'Giải Thể Thao CBQ', sportName = 'Bóng Chuyền') {
  if (!bracket || !bracket.drawnTeams) {
    throw new Error('Dữ liệu sơ đồ bốc thăm Signmar chưa được khởi tạo.');
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sơ Đồ Signmar 34 Đội', {
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToWidth: 1, fitToHeight: 1 }
  });

  // Cấu hình độ rộng các cột
  ws.columns = [
    { width: 3 },  // A: Margin
    { width: 5 },  // B: TT
    { width: 14 }, // C: Đội / Chi đoàn
    { width: 12 }, // D: Đơn vị
    { width: 3 },  // E: Khoảng cách
    { width: 5 },  // F: Số thăm
    { width: 15 }, // G: Vòng Sơ Loại
    { width: 16 }, // H: Vòng 32 (1/16)
    { width: 16 }, // I: Vòng 16 (1/8)
    { width: 16 }, // J: Tứ Kết (1/4)
    { width: 16 }, // K: Bán Kết
    { width: 16 }, // L: Chung Kết
    { width: 18 }  // M: 🏆 Vô Địch
  ];

  const thin = { style: 'thin', color: { argb: 'FF000000' } };
  const double = { style: 'double', color: { argb: 'FF000000' } };

  // 1. TIÊU ĐỀ BẢNG EXCEL
  ws.mergeCells('B2:D2');
  ws.getCell('B2').value = 'TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK';
  ws.getCell('B2').font = { bold: true, size: 11, color: { argb: 'FF1E3A8A' } };
  ws.getCell('B2').alignment = { horizontal: 'center' };

  ws.mergeCells('B3:D3');
  ws.getCell('B3').value = sportName.toUpperCase();
  ws.getCell('B3').font = { bold: true, size: 10, color: { argb: 'FFB91C1C' } };
  ws.getCell('B3').alignment = { horizontal: 'center' };

  // 2. HEADER BẢNG DANH SÁCH 34 ĐỘI (BÊN TRÁI)
  ws.getCell('B4').value = 'TT';
  ws.getCell('C4').value = 'Họ và tên / Đội';
  ws.getCell('D4').value = 'Đơn vị';
  ['B4', 'C4', 'D4'].forEach(a => {
    const c = ws.getCell(a);
    c.font = { bold: true, size: 9 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = { top: thin, bottom: thin, left: thin, right: thin };
  });

  // Điền danh sách 34 đội bốc thăm
  bracket.drawnTeams.forEach((team, i) => {
    const r = 5 + i;
    ws.getCell(`B${r}`).value = i + 1;
    ws.getCell(`C${r}`).value = team.name || team.fullName;
    ws.getCell(`D${r}`).value = team.grade || 'THPT CBQ';
    ['B', 'C', 'D'].forEach(col => {
      const c = ws.getCell(`${col}${r}`);
      c.font = { size: 9 };
      c.alignment = { horizontal: col === 'B' ? 'center' : 'left', vertical: 'middle' };
      c.border = { top: thin, bottom: thin, left: thin, right: thin };
    });
  });

  // TỔNG KẾT KẾT QUẢ Ở DƯỚI BẢNG TRÁI
  const resStartRow = 41;
  ws.mergeCells(`B${resStartRow}:D${resStartRow}`);
  ws.getCell(`B${resStartRow}`).value = 'KẾT QUẢ THI ĐẤU';
  ws.getCell(`B${resStartRow}`).font = { bold: true, size: 10, color: { argb: 'FF166534' } };
  ws.getCell(`B${resStartRow}`).alignment = { horizontal: 'center' };

  ws.getCell(`B${resStartRow + 1}`).value = '🥇 VÔ ĐỊCH:';
  ws.mergeCells(`C${resStartRow + 1}:D${resStartRow + 1}`);
  ws.getCell(`C${resStartRow + 1}`).value = bracket.champion?.name || '(Chưa xác định)';
  ws.getCell(`C${resStartRow + 1}`).font = { bold: true, color: { argb: 'FFB45309' } };

  ws.getCell(`B${resStartRow + 2}`).value = '🥈 Á QUÂN:';
  ws.mergeCells(`C${resStartRow + 2}:D${resStartRow + 2}`);
  ws.getCell(`C${resStartRow + 2}`).value = bracket.runnerUp?.name || '(Chưa xác định)';

  ws.getCell(`B${resStartRow + 3}`).value = '🥉 HẠNG BA:';
  ws.mergeCells(`C${resStartRow + 3}:D${resStartRow + 3}`);
  ws.getCell(`C${resStartRow + 3}`).value = bracket.thirdPlace?.name || '(Chưa xác định)';

  // 3. HEADER SƠ ĐỒ NHÁNH CÂY SIGNMAR (BÊN PHẢI)
  ws.getCell('F3').value = 'Số';
  ws.getCell('G3').value = 'Vòng Sơ Loại';
  ws.getCell('H3').value = 'Vòng 32 (1/16)';
  ws.getCell('I3').value = 'Vòng 16 (1/8)';
  ws.getCell('J3').value = 'Tứ Kết (1/4)';
  ws.getCell('K3').value = 'Bán Kết';
  ws.getCell('L3').value = 'Chung Kết';
  ws.getCell('M3').value = '🏆 Vô Địch';

  ['F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3'].forEach(a => {
    const c = ws.getCell(a);
    c.font = { bold: true, size: 8.5, color: { argb: 'FF1E293B' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = { top: thin, bottom: thin, left: thin, right: thin };
  });

  // TÍNH TOÁN CÁC HÀNG VẼ CÂY SIGNMAR (32 SLOTS CHÍNH TỪ ROW 4 ĐẾN ROW 66)
  const slotRows = [];
  for (let s = 0; s < 32; s++) {
    const r = 4 + s * 2;
    slotRows.push(r);
    ws.getCell(`F${r}`).value = s + 1;
    ws.getCell(`F${r}`).font = { size: 8, bold: true };
    ws.getCell(`F${r}`).alignment = { horizontal: 'center' };

    // Tên đội hoặc placeholder ở Vòng 32
    const slotData = bracket.r32Slots[s];
    if (slotData && slotData.team) {
      ws.getCell(`H${r}`).value = slotData.team.name;
      ws.getCell(`H${r}`).font = { size: 8.5, bold: true, color: { argb: 'FF0369A1' } };
    } else if (slotData && slotData.isPrelimSlot) {
      ws.getCell(`H${r}`).value = slotData.placeholder || '(Thắng Sơ Loại)';
      ws.getCell(`H${r}`).font = { size: 7.5, italic: true, color: { argb: 'FF64748B' } };
    }
  }

  // VÒNG 32 (Col H nối sang Col I)
  const r32Midpoints = [];
  for (let m = 0; m < 16; m++) {
    const rA = slotRows[m * 2];
    const rB = slotRows[m * 2 + 1];
    const rMid = (rA + rB) / 2;
    r32Midpoints.push(rMid);

    ws.getCell(`H${rA}`).border = { ...ws.getCell(`H${rA}`).border, bottom: thin, right: thin };
    for (let r = rA + 1; r < rB; r++) {
      ws.getCell(`H${r}`).border = { ...ws.getCell(`H${r}`).border, right: thin };
    }
    ws.getCell(`H${rB}`).border = { ...ws.getCell(`H${rB}`).border, bottom: thin, right: thin };
    ws.getCell(`I${rMid}`).border = { ...ws.getCell(`I${rMid}`).border, bottom: thin };

    // Nếu trận này có người thắng ở vòng 32
    const mData = bracket.matches.round32[m];
    if (mData && mData.winner) {
      ws.getCell(`I${rMid}`).value = mData.winner.name;
      ws.getCell(`I${rMid}`).font = { size: 8, bold: true, color: { argb: 'FF166534' } };
    }
  }

  // VÒNG 16 (Col I nối sang Col J)
  const r16Midpoints = [];
  for (let m = 0; m < 8; m++) {
    const rA = r32Midpoints[m * 2];
    const rB = r32Midpoints[m * 2 + 1];
    const rMid = (rA + rB) / 2;
    r16Midpoints.push(rMid);

    ws.getCell(`I${rA}`).border = { ...ws.getCell(`I${rA}`).border, bottom: thin, right: thin };
    for (let r = rA + 1; r < rB; r++) {
      ws.getCell(`I${r}`).border = { ...ws.getCell(`I${r}`).border, right: thin };
    }
    ws.getCell(`I${rB}`).border = { ...ws.getCell(`I${rB}`).border, bottom: thin, right: thin };
    ws.getCell(`J${rMid}`).border = { ...ws.getCell(`J${rMid}`).border, bottom: thin };

    const mData = bracket.matches.round16[m];
    if (mData && mData.winner) {
      ws.getCell(`J${rMid}`).value = mData.winner.name;
      ws.getCell(`J${rMid}`).font = { size: 8, bold: true, color: { argb: 'FF166534' } };
    }
  }

  // VÒNG TỨ KẾT (Col J nối sang Col K)
  const rQtrMidpoints = [];
  for (let m = 0; m < 4; m++) {
    const rA = r16Midpoints[m * 2];
    const rB = r16Midpoints[m * 2 + 1];
    const rMid = (rA + rB) / 2;
    rQtrMidpoints.push(rMid);

    ws.getCell(`J${rA}`).border = { ...ws.getCell(`J${rA}`).border, bottom: thin, right: thin };
    for (let r = rA + 1; r < rB; r++) {
      ws.getCell(`J${r}`).border = { ...ws.getCell(`J${r}`).border, right: thin };
    }
    ws.getCell(`J${rB}`).border = { ...ws.getCell(`J${rB}`).border, bottom: thin, right: thin };
    ws.getCell(`K${rMid}`).border = { ...ws.getCell(`K${rMid}`).border, bottom: thin };

    const mData = bracket.matches.quarter[m];
    if (mData && mData.winner) {
      ws.getCell(`K${rMid}`).value = mData.winner.name;
      ws.getCell(`K${rMid}`).font = { size: 8, bold: true, color: { argb: 'FF166534' } };
    }
  }

  // VÒNG BÁN KẾT (Col K nối sang Col L)
  const rSemiMidpoints = [];
  for (let m = 0; m < 2; m++) {
    const rA = rQtrMidpoints[m * 2];
    const rB = rQtrMidpoints[m * 2 + 1];
    const rMid = (rA + rB) / 2;
    rSemiMidpoints.push(rMid);

    ws.getCell(`K${rA}`).border = { ...ws.getCell(`K${rA}`).border, bottom: thin, right: thin };
    for (let r = rA + 1; r < rB; r++) {
      ws.getCell(`K${r}`).border = { ...ws.getCell(`K${r}`).border, right: thin };
    }
    ws.getCell(`K${rB}`).border = { ...ws.getCell(`K${rB}`).border, bottom: thin, right: thin };
    ws.getCell(`L${rMid}`).border = { ...ws.getCell(`L${rMid}`).border, bottom: thin };

    const mData = bracket.matches.semi[m];
    if (mData && mData.winner) {
      ws.getCell(`L${rMid}`).value = mData.winner.name;
      ws.getCell(`L${rMid}`).font = { size: 8, bold: true, color: { argb: 'FF166534' } };
    }
  }

  // TRẬN CHUNG KẾT (Col L nối sang Col M)
  const rFinalMid = (rSemiMidpoints[0] + rSemiMidpoints[1]) / 2;
  ws.getCell(`L${rSemiMidpoints[0]}`).border = { ...ws.getCell(`L${rSemiMidpoints[0]}`).border, bottom: thin, right: thin };
  for (let r = rSemiMidpoints[0] + 1; r < rSemiMidpoints[1]; r++) {
    ws.getCell(`L${r}`).border = { ...ws.getCell(`L${r}`).border, right: thin };
  }
  ws.getCell(`L${rSemiMidpoints[1]}`).border = { ...ws.getCell(`L${rSemiMidpoints[1]}`).border, bottom: thin, right: thin };

  // ĐƯỜNG NỐI RA CÚP VÔ ĐỊCH
  ws.getCell(`M${rFinalMid}`).border = { ...ws.getCell(`M${rFinalMid}`).border, bottom: double };
  if (bracket.champion) {
    ws.getCell(`M${rFinalMid}`).value = `🏆 ${bracket.champion.name}`;
    ws.getCell(`M${rFinalMid}`).font = { bold: true, color: { argb: 'FFD97706' }, size: 10 };
  } else {
    ws.getCell(`M${rFinalMid}`).value = '🏆 VÔ ĐỊCH';
    ws.getCell(`M${rFinalMid}`).font = { bold: true, color: { argb: 'FF64748B' }, size: 9 };
  }

  // 4. VẼ VÒNG SƠ LOẠI (PLAY-IN) TẠI CỘT G
  // Play-in 1 (Nhánh Trên) tại slot 11 (hàng 24)
  const p1 = bracket.matches.prelim[0];
  ws.getCell('G23').value = p1?.teamA?.name || 'Đội 11';
  ws.getCell('G23').font = { size: 7.5, italic: true, color: { argb: 'FF7C3AED' } };
  ws.getCell('G23').border = { bottom: thin, right: thin };
  ws.getCell('G24').border = { right: thin };
  ws.getCell('G25').value = p1?.teamB?.name || 'Đội 12';
  ws.getCell('G25').font = { size: 7.5, italic: true, color: { argb: 'FF7C3AED' } };
  ws.getCell('G25').border = { bottom: thin, right: thin };
  ws.getCell('H24').border = { ...ws.getCell('H24').border, bottom: thin };
  if (p1?.winner) {
    ws.getCell('H24').value = p1.winner.name;
    ws.getCell('H24').font = { size: 8, bold: true, color: { argb: 'FF166534' } };
  }

  // Play-in 2 (Nhánh Dưới) tại slot 27 (hàng 56)
  const p2 = bracket.matches.prelim[1];
  ws.getCell('G55').value = p2?.teamA?.name || 'Đội 27';
  ws.getCell('G55').font = { size: 7.5, italic: true, color: { argb: 'FF7C3AED' } };
  ws.getCell('G55').border = { bottom: thin, right: thin };
  ws.getCell('G56').border = { right: thin };
  ws.getCell('G57').value = p2?.teamB?.name || 'Đội 28';
  ws.getCell('G57').font = { size: 7.5, italic: true, color: { argb: 'FF7C3AED' } };
  ws.getCell('G57').border = { bottom: thin, right: thin };
  ws.getCell('H56').border = { ...ws.getCell('H56').border, bottom: thin };
  if (p2?.winner) {
    ws.getCell('H56').value = p2.winner.name;
    ws.getCell('H56').font = { size: 8, bold: true, color: { argb: 'FF166534' } };
  }

  // 5. XUẤT FILE TẢI VỀ THEO QUY TẮC TIỀN TỐ SỐ THỨ TỰ (GEMINI.md)
  const safeSport = (sportName || 'Mon_thi')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_');
  const fileName = `1-So_do_signmar_34_doi_${safeSport}_THPT_Cao_Ba_Quat.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, fileName };
}

/**
 * Tạo nội dung thông báo bốc thăm Sơ Đồ Signmar gửi nhóm Zalo giải đấu
 */
export function formatSignmarForZalo(bracket, tournamentTitle, sportName, zaloLink) {
  if (!bracket || !bracket.drawnTeams) return '';

  let text = `🏛️ TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK\n`;
  text += `🏆 KẾT QUẢ BỐC THĂM: ${tournamentTitle.toUpperCase()}\n`;
  text += `🏐 MÔN THI ĐẤU: ${sportName.toUpperCase()}\n`;
  text += `🎯 THỂ THỨC: SƠ ĐỒ NHÁNH SIGNMAR (34 ĐỘI - ĐẤU LOẠI TRỰC TIẾP)\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `📋 BẢNG THỨ TỰ BỐC THĂM 34 CHI ĐOÀN LỚP:\n`;
  bracket.drawnTeams.forEach(t => {
    const pad = t.drawNo < 10 ? `0${t.drawNo}` : `${t.drawNo}`;
    text += `  • Thăm [${pad}]: Lớp ${t.name} (${t.grade}) - ${t.branch}\n`;
  });

  text += `\n⚔️ 1. VÒNG SƠ LOẠI (PLAY-IN - 2 TRẬN SỚM):\n`;
  bracket.matches.prelim.forEach(m => {
    text += `  🔹 ${m.roundName}: Lớp ${m.teamA?.name || 'TBD'} ⚔️ Lớp ${m.teamB?.name || 'TBD'} (Đội thắng vào Vòng 32)\n`;
  });

  text += `\n⚔️ 2. VÒNG 32 ĐỘI (1/16 - 16 TRẬN ĐẤU):\n`;
  bracket.matches.round32.forEach(m => {
    const tA = m.teamA?.name || m.placeholderA || 'TBD';
    const tB = m.teamB?.name || m.placeholderB || 'TBD';
    text += `  🔹 Trận ${m.matchNumber}: Lớp ${tA} ⚔️ Lớp ${tB}\n`;
  });

  text += `\n📌 LƯU Ý DÀNH CHO CÁC ĐỘI BÓNG:\n`;
  text += `  - Có 30 đội được MIỄN vòng sơ loại để vào thẳng Vòng 32.\n`;
  text += `  - 4 đội bốc trúng số thăm 11, 12 và 27, 28 thi đấu 2 trận sơ loại để tranh 2 vé còn lại.\n`;
  text += `  - Các đội có mặt trước giờ thi đấu 15 phút tại sân bóng trường.\n`;
  text += `  - Trang phục thi đấu đúng quy định của Ban Tổ Chức.\n\n`;

  if (zaloLink) {
    text += `📲 Link nhóm Zalo BTC: ${zaloLink}\n`;
  }
  text += `⏰ Kính chúc các Chi đoàn thi đấu hết mình, đoàn kết và thành công rực rỡ!`;

  return text;
}

/**
 * Lưu sơ đồ Signmar lên Supabase / LocalStorage
 */
export async function saveSignmarBracket(tournamentId, sportName, bracketData) {
  const key = `cbq_signmar_${tournamentId}_${sportName}`;
  try {
    localStorage.setItem(key, JSON.stringify(bracketData));
  } catch (e) {
    console.warn("Lưu LocalStorage lỗi:", e);
  }

  try {
    const slug = `signmar-bracket-${tournamentId}-${encodeURIComponent(sportName)}`;
    await supabase.from('cbq_pages').delete().eq('slug', slug);
    const { error } = await supabase.from('cbq_pages').insert([{
      slug: slug,
      title: `Sơ đồ Signmar: ${tournamentId} - ${sportName}`,
      content: JSON.stringify(bracketData),
      updated_at: new Date().toISOString()
    }]);
    if (!error) return { success: true };
  } catch (err) {
    console.warn("Lưu Supabase Signmar fallback:", err);
  }

  return { success: true };
}

/**
 * Tải sơ đồ Signmar đã lưu
 */
export async function fetchSignmarBracket(tournamentId, sportName) {
  const key = `cbq_signmar_${tournamentId}_${sportName}`;
  const slug = `signmar-bracket-${tournamentId}-${encodeURIComponent(sportName)}`;

  try {
    const { data, error } = await supabase
      .from('cbq_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data && data.content) {
      const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      if (parsed) return parsed;
    }
  } catch (e) {}

  try {
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local);
  } catch (e) {}

  return null;
}

/**
 * Xuất Biên Bản Kết Quả Bốc Thăm (FIFA Live Draw) ra file Excel
 * Đảm bảo quy tắc GEMINI.md: Tiền tố số thứ tự 1-Bien_ban_boc_tham_hoi_thao_...
 */
export async function exportFifaDrawResultsExcel(tournament, sportName, matchups = []) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'THPT Cao Bá Quát - Ban Tổ Chức Hội Thao';
  wb.created = new Date();

  const ws = wb.addWorksheet('Bien_Ban_Boc_Tham', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 }
  });

  const tournTitle = tournament?.name || 'HỘI THAO TRƯỜNG THPT CAO BÁ QUÁT';
  const cleanSport = sportName || 'Bóng Chuyền';

  // Header Title
  ws.mergeCells('A1:F1');
  ws.getCell('A1').value = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK - TRƯỜNG THPT CAO BÁ QUÁT';
  ws.getCell('A1').font = { name: 'Times New Roman', size: 11, bold: true };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:F2');
  ws.getCell('A2').value = `BIÊN BẢN BỐC THĂM VÀ XẾP LỊCH THI ĐẤU - ${cleanSport.toUpperCase()}`;
  ws.getCell('A2').font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF1E3A8A' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.mergeCells('A3:F3');
  ws.getCell('A3').value = `Giải đấu: ${tournTitle} | Thời gian lập: ${new Date().toLocaleString('vi-VN')}`;
  ws.getCell('A3').font = { name: 'Times New Roman', size: 10, italic: true };
  ws.getCell('A3').alignment = { horizontal: 'center' };

  // Table Headers
  const headerRow = ws.getRow(5);
  headerRow.values = ['STT', 'Trận Đấu', 'Đội A (Mã Thăm)', 'Tỉ Số', 'Đội B (Mã Thăm)', 'Vòng Thi Đấu / Ghi Chú'];
  headerRow.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let c = 1; c <= 6; c++) {
    const cell = headerRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  // Rows
  matchups.forEach((m, idx) => {
    const row = ws.getRow(6 + idx);
    const teamAName = m.teamA ? (m.teamA.fullName || m.teamA.name) : 'Đang chờ';
    const teamBName = m.teamB ? (m.teamB.fullName || m.teamB.name) : (m.isBye ? 'Miễn đấu (Vé Bye)' : 'Đang chờ');
    const drawA = m.teamA?.drawNo ? ` (Thăm ${m.teamA.drawNo})` : '';
    const drawB = m.teamB?.drawNo ? ` (Thăm ${m.teamB.drawNo})` : '';

    row.values = [
      idx + 1,
      m.roundName || `Trận ${idx + 1}`,
      `${teamAName}${drawA}`,
      '- VS -',
      `${teamBName}${drawB}`,
      m.note || m.branchName || 'Đấu loại trực tiếp'
    ];
    row.font = { name: 'Times New Roman', size: 11 };
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center', bold: true };
    row.getCell(3).alignment = { horizontal: 'left', bold: true };
    row.getCell(4).alignment = { horizontal: 'center', bold: true, color: { argb: 'FFDC2626' } };
    row.getCell(5).alignment = { horizontal: 'left', bold: true };
    row.getCell(6).alignment = { horizontal: 'center', italic: true };

    for (let c = 1; c <= 6; c++) {
      row.getCell(c).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (idx % 2 === 1) {
        row.getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }
    }
  });

  // Footer Signatures
  const lastRow = 6 + matchups.length + 2;
  ws.getCell(`B${lastRow}`).value = 'ĐẠI DIỆN TỔ TRỌNG TÀI';
  ws.getCell(`B${lastRow}`).font = { name: 'Times New Roman', size: 11, bold: true };
  ws.getCell(`B${lastRow}`).alignment = { horizontal: 'center' };

  ws.getCell(`E${lastRow}`).value = 'TRƯỞNG BAN TỔ CHỨC';
  ws.getCell(`E${lastRow}`).font = { name: 'Times New Roman', size: 11, bold: true };
  ws.getCell(`E${lastRow}`).alignment = { horizontal: 'center' };

  ws.columns = [
    { width: 8 },
    { width: 22 },
    { width: 34 },
    { width: 12 },
    { width: 34 },
    { width: 28 }
  ];

  const safeSport = cleanSport.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `1-Bien_ban_boc_tham_${safeSport}_THPT_Cao_Ba_Quat.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, fileName };
}

/**
 * Xuất Bảng Lịch Thi Đấu Theo Sân Và Trọng Tài Chuẩn Đẹp (Khớp 100% mẫu ảnh người dùng yêu cầu)
 * Cột: Sân | Trận | Đội | gặp (tỷ số) | Đội | Trọng tài | Ghi chú
 * Tuân thủ quy tắc GEMINI.md: Tiền tố số thứ tự 1-Lich_thi_dau_theo_san_va_trong_tai_...
 */
export async function exportCourtMatchScheduleExcel({
  tournamentTitle = 'HỘI THAO TRƯỜNG THPT CAO BÁ QUÁT',
  sportName = 'Bóng Chuyền',
  matches = []
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Trường THPT Cao Bá Quát - Ban Tổ Chức Hội Thao';
  wb.created = new Date();

  const cleanSport = sportName || 'Bóng Chuyền';
  const tournName = tournamentTitle || 'Hội Thao Trường THPT Cao Bá Quát';

  // ==================== SHEET 1: BẢN IN TRANG TRỌNG A4 ====================
  const wsA4 = wb.addWorksheet('Lịch Thi Đấu (In A4)', {
    pageSetup: { 
      paperSize: 9, // A4
      orientation: 'portrait', 
      fitToPage: true, 
      fitToWidth: 1, 
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 }
    }
  });

  wsA4.columns = [
    { width: 8 },  // A: Sân
    { width: 8 },  // B: Trận
    { width: 14 }, // C: Đội (1)
    { width: 14 }, // D: gặp (tỷ số)
    { width: 14 }, // E: Đội (2)
    { width: 24 }, // F: Trọng tài
    { width: 22 }  // G: Ghi chú
  ];

  // Header hành chính
  wsA4.mergeCells('A1:C1');
  wsA4.getCell('A1').value = 'TRƯỜNG THPT CAO BÁ QUÁT';
  wsA4.getCell('A1').font = { name: 'Times New Roman', size: 10, bold: true };
  wsA4.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  wsA4.mergeCells('E1:G1');
  wsA4.getCell('E1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  wsA4.getCell('E1').font = { name: 'Times New Roman', size: 10, bold: true };
  wsA4.getCell('E1').alignment = { horizontal: 'center', vertical: 'middle' };

  wsA4.mergeCells('A2:C2');
  wsA4.getCell('A2').value = 'BAN TỔ CHỨC HỘI THAO';
  wsA4.getCell('A2').font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
  wsA4.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

  wsA4.mergeCells('E2:G2');
  wsA4.getCell('E2').value = 'Độc lập - Tự do - Hạnh phúc';
  wsA4.getCell('E2').font = { name: 'Times New Roman', size: 10, italic: true };
  wsA4.getCell('E2').alignment = { horizontal: 'center', vertical: 'middle' };

  // Tiêu đề chính
  wsA4.mergeCells('A4:G4');
  wsA4.getCell('A4').value = 'LỊCH THI ĐẤU VÀ PHÂN CÔNG TRỌNG TÀI';
  wsA4.getCell('A4').font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF1E3A8A' } };
  wsA4.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

  wsA4.mergeCells('A5:G5');
  wsA4.getCell('A5').value = `MÔN THI ĐẤU: ${cleanSport.toUpperCase()} | ${tournName.toUpperCase()}`;
  wsA4.getCell('A5').font = { name: 'Times New Roman', size: 11, bold: true, italic: true, color: { argb: 'FFB91C1C' } };
  wsA4.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

  // Tiêu đề bảng (Dòng 7)
  const headerA4 = wsA4.getRow(7);
  headerA4.height = 28;
  headerA4.values = ['Sân', 'Trận', 'Đội', 'gặp (tỷ số)', 'Đội', 'Trọng tài', 'Ghi chú'];
  headerA4.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerA4.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let c = 1; c <= 7; c++) {
    const cell = headerA4.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  }

  // Dữ liệu dòng (Sheet 1)
  matches.forEach((m, idx) => {
    const row = wsA4.getRow(8 + idx);
    row.height = 24;
    const teamAName = m.teamA ? (m.teamA.name || m.teamA.cohort_year || m.teamA) : '';
    const teamBName = m.teamB ? (m.teamB.name || m.teamB.cohort_year || m.teamB) : '';
    const scoreVal = m.score || (m.scoreA && m.scoreB ? `${m.scoreA} - ${m.scoreB}` : '');

    row.values = [
      m.court || (idx % 2 === 0 ? 1 : 2),
      m.matchNumber || (idx + 1),
      teamAName,
      scoreVal,
      teamBName,
      m.referee || 'Huỳnh Thanh Tú',
      m.note || ''
    ];

    row.font = { name: 'Times New Roman', size: 11 };
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { horizontal: 'center', bold: true };
    row.getCell(2).alignment = { horizontal: 'center', bold: true };
    row.getCell(3).alignment = { horizontal: 'center', bold: true, color: { argb: 'FF1D4ED8' } };
    row.getCell(4).alignment = { horizontal: 'center', bold: true, color: { argb: 'FFB91C1C' } };
    row.getCell(5).alignment = { horizontal: 'center', bold: true, color: { argb: 'FFB45309' } };
    row.getCell(6).alignment = { horizontal: 'left', bold: true };
    row.getCell(7).alignment = { horizontal: 'left', italic: true };

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
      if (idx % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }
    }
  });

  // Chữ ký (Sheet 1)
  const signRow = 8 + matches.length + 2;
  wsA4.mergeCells(`A${signRow}:C${signRow}`);
  wsA4.getCell(`A${signRow}`).value = 'ĐẠI DIỆN TỔ TRỌNG TÀI';
  wsA4.getCell(`A${signRow}`).font = { name: 'Times New Roman', size: 11, bold: true };
  wsA4.getCell(`A${signRow}`).alignment = { horizontal: 'center' };

  wsA4.mergeCells(`E${signRow}:G${signRow}`);
  wsA4.getCell(`E${signRow}`).value = 'TRƯỞNG BAN TỔ CHỨC';
  wsA4.getCell(`E${signRow}`).font = { name: 'Times New Roman', size: 11, bold: true };
  wsA4.getCell(`E${signRow}`).alignment = { horizontal: 'center' };

  wsA4.mergeCells(`A${signRow + 1}:C${signRow + 1}`);
  wsA4.getCell(`A${signRow + 1}`).value = '(Ký và ghi rõ họ tên)';
  wsA4.getCell(`A${signRow + 1}`).font = { name: 'Times New Roman', size: 10, italic: true };
  wsA4.getCell(`A${signRow + 1}`).alignment = { horizontal: 'center' };

  wsA4.mergeCells(`E${signRow + 1}:G${signRow + 1}`);
  wsA4.getCell(`E${signRow + 1}`).value = '(Ký và đóng dấu)';
  wsA4.getCell(`E${signRow + 1}`).font = { name: 'Times New Roman', size: 10, italic: true };
  wsA4.getCell(`E${signRow + 1}`).alignment = { horizontal: 'center' };

  wsA4.mergeCells(`A${signRow + 5}:C${signRow + 5}`);
  wsA4.getCell(`A${signRow + 5}`).value = 'Huỳnh Thanh Tú';
  wsA4.getCell(`A${signRow + 5}`).font = { name: 'Times New Roman', size: 11, bold: true };
  wsA4.getCell(`A${signRow + 5}`).alignment = { horizontal: 'center' };

  // ==================== SHEET 2: BẢN CHUẨN ĐÚNG 100% NHƯ ẢNH NGƯỜI DÙNG ====================
  // Hàng 1 bắt đầu trực tiếp: Sân | Trận | Đội | gặp (tỷ số) | Đội | Trọng tài | Ghi chú
  const wsExact = wb.addWorksheet('Lịch Sân Trận (Chuẩn)', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToWidth: 1 }
  });

  wsExact.columns = [
    { width: 10 }, // A: Sân
    { width: 10 }, // B: Trận
    { width: 16 }, // C: Đội
    { width: 16 }, // D: gặp (tỷ số)
    { width: 16 }, // E: Đội
    { width: 24 }, // F: Trọng tài
    { width: 22 }  // G: Ghi chú
  ];

  const headerRowExact = wsExact.getRow(1);
  headerRowExact.height = 26;
  headerRowExact.values = ['Sân', 'Trận', 'Đội', 'gặp (tỷ số)', 'Đội', 'Trọng tài', 'Ghi chú'];
  headerRowExact.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF000000' } };
  headerRowExact.alignment = { horizontal: 'left', vertical: 'middle' };

  // Kẻ viền và màu nền nhẹ cho header
  for (let c = 1; c <= 7; c++) {
    const cell = headerRowExact.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' } // Màu xám nhạt hiện đại, chuyên nghiệp
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  }

  // Dữ liệu dòng (Sheet 2)
  matches.forEach((m, idx) => {
    const row = wsExact.getRow(2 + idx);
    row.height = 24;
    const teamAName = m.teamA ? (m.teamA.name || m.teamA.cohort_year || m.teamA) : '';
    const teamBName = m.teamB ? (m.teamB.name || m.teamB.cohort_year || m.teamB) : '';
    const scoreVal = m.score || (m.scoreA && m.scoreB ? `${m.scoreA} - ${m.scoreB}` : '');

    row.values = [
      m.court || (idx % 2 === 0 ? 1 : 2),
      m.matchNumber || (idx + 1),
      teamAName,
      scoreVal,
      teamBName,
      m.referee || 'Huỳnh Thanh Tú',
      m.note || ''
    ];

    row.font = { name: 'Times New Roman', size: 11 };
    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { horizontal: 'right', bold: true }; // Sân (căn phải như Excel mặc định với số)
    row.getCell(2).alignment = { horizontal: 'right', bold: true }; // Trận
    row.getCell(3).alignment = { horizontal: 'left', bold: true };  // Đội 1 (ví dụ 10A07)
    row.getCell(4).alignment = { horizontal: 'center' };            // gặp (tỷ số)
    row.getCell(5).alignment = { horizontal: 'left', bold: true };  // Đội 2 (ví dụ 12A03)
    row.getCell(6).alignment = { horizontal: 'left' };              // Trọng tài (Huỳnh Thanh Tú)
    row.getCell(7).alignment = { horizontal: 'left' };              // Ghi chú

    for (let c = 1; c <= 7; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }
  });

  // Tải file tuân thủ quy tắc số thứ tự GEMINI.md
  const safeSport = cleanSport.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 30);
  const fileName = `1-Lich_thi_dau_theo_san_va_trong_tai_${safeSport}_THPT_Cao_Ba_Quat.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, fileName };
}
