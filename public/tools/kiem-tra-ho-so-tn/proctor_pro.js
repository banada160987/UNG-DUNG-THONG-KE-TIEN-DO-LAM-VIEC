/**
 * PROCTOR PRO (View & Reporting Service)
 * Role: Render the Proctor Board and Export Reports
 */

const ProctorPro = (() => {
    "use strict";

    // --- PRIVATE STATE ---
    let _activeSessions = [];

    // --- PRIVATE HELPERS ---
    const Helpers = {
        escapeHTML: (str) => {
            if (str == null) return '';
            return str.toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },
        getProctorList: () => {
            const list = (typeof window.proctorList !== 'undefined') ? window.proctorList : ((typeof proctorList !== 'undefined') ? proctorList : []);
            if (list.length === 0 && typeof ProctorStore !== 'undefined') return ProctorStore.getState().proctors;
            return list;
        },
        getGeneratedRooms: () => {
            const list = (typeof window.generatedRooms !== 'undefined') ? window.generatedRooms : ((typeof generatedRooms !== 'undefined') ? generatedRooms : []);
            if (list.length === 0 && typeof ProctorStore !== 'undefined') return ProctorStore.getState().rooms;
            return list;
        },
        getStoreSessions: () => {
            if (typeof ProctorStore !== 'undefined') return ProctorStore.getState().sessions;
            return [];
        },
        matchProctor: (ap, pr) => {
            if (ap.id && pr.id) return ap.id === pr.id;
            const apName = (ap.name || "").toString().toLowerCase().trim();
            const prName = (pr.name || "").toString().toLowerCase().trim();
            const apUnit = (ap.unit || "").toString().toLowerCase().trim();
            const prUnit = (pr.unit || "").toString().toLowerCase().trim();
            if (ap.unit && pr.unit) return apName === prName && apUnit === prUnit;
            return apName === prName;
        }
    };

    return {
        // --- PUBLIC PROPERTIES ---
        get activeSessions() { return _activeSessions; },
        set activeSessions(val) { _activeSessions = val; },

        // --- CORE RENDERING ---
        renderBoard: function(manualSessions = null) {
            const body = document.getElementById('proctor-board-body');
            const headerRow = document.querySelector('#view-proctor-board thead tr');
            if (!body || !headerRow) return;

            // 1. Resolve Sessions to display
            let sessions = manualSessions || _activeSessions;
            if (!sessions || sessions.length === 0) {
                sessions = Helpers.getStoreSessions();
            }

            // Fallback: If still no sessions, look into rooms for keys
            if (sessions.length === 0) {
                const rooms = Helpers.getGeneratedRooms();
                const sessionIds = new Set();
                rooms.forEach(r => {
                    Object.keys(r).forEach(k => {
                        if (k.startsWith('proctors_')) sessionIds.add(k.replace('proctors_', ''));
                    });
                });
                sessions = Array.from(sessionIds).map(id => ({ id: id, name: id }));
            }

            _activeSessions = sessions;

            // 2. Render Headers
            headerRow.innerHTML = `
                <th style="width:50px; background:#f8fafc">STT</th>
                <th style="background:#f8fafc; min-width:180px">Giám thị</th>
                <th style="background:#f8fafc; width:120px">SĐT Zalo</th>
                <th style="background:#f8fafc">Đơn vị / Tổ</th>
                <th style="background:#f8fafc; width:100px">Lớp CN</th>
                ${sessions.map((s, i) => `
                    <th class="session-header" style="background: ${i % 2 === 0 ? '#fff7ed' : '#f0fdf4'}; min-width:120px">
                        <div class="text-[10px] opacity-50 font-normal uppercase">${Helpers.escapeHTML(s.date || '')}</div>
                        <div class="font-bold text-primary">${Helpers.escapeHTML(s.name)}</div>
                    </th>
                `).join('')}
            `;

            // 3. Render Body
            const rooms = Helpers.getGeneratedRooms();
            const proctors = Helpers.getProctorList();

            if (proctors.length === 0) {
                body.innerHTML = `<tr><td colspan="${4 + sessions.length}" style="text-align:center; padding:60px; color:var(--text-muted)">
                    <div class="flex flex-col items-center gap-4">
                        <i data-lucide="users" style="width:48px; height:48px; opacity:0.2"></i>
                        <p>Vào mục <b>Cấu hình Kỳ thi</b> để nhập danh sách giám thị.</p>
                    </div>
                </td></tr>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }

            // Map assignments to proctors
            const proctorMap = {};
            proctors.forEach((p, idx) => {
                const key = p.id || `P${idx}`;
                proctorMap[key] = {};
                sessions.forEach(s => {
                    proctorMap[key][s.id] = [];
                    if (s.name) proctorMap[key][s.name] = []; // Support name-based lookup
                });
            });

            rooms.forEach(room => {
                sessions.forEach(session => {
                    const sessId = session.id;
                    const sessName = session.name;
                    const assigned = room[`proctors_${sessId}`] || room[`proctors_${sessName}`] || [];
                    
                    assigned.forEach(p => {
                        let targetKey = null;
                        
                        // Priority 1: Direct ID match
                        if (p.id && proctorMap[p.id]) {
                            targetKey = p.id;
                        } 
                        // Priority 2: Precise Name & Unit match
                        else {
                            const match = proctors.find(pr => Helpers.matchProctor(p, pr));
                            if (match) {
                                targetKey = match.id || `P${proctors.indexOf(match)}`;
                            }
                        }

                        if (targetKey && proctorMap[targetKey]) {
                            // Logic hiển thị phòng thông minh: 
                            // Tự động đổi tiền tố theo Khối của ca thi (Session Grade)
                            let rNum = (room.number || room.name || "").toString();
                            
                            // Nếu tên phòng có dấu gạch ngang (VD: 10.10-P01), lấy phần số phòng phía sau (P01)
                            if (rNum.includes('-')) {
                                rNum = rNum.split('-').pop();
                            }
                            
                            // Ưu tiên lấy Khối từ Ca thi (session), nếu không có mới dùng Khối từ Phòng
                            const currentGrade = session.grade || room.grade || "";
                            const finalRoomName = currentGrade ? `${currentGrade}-${rNum}` : rNum;
                            
                            // Lưu vào cả ID và Name để đảm bảo hiển thị đúng
                            if (proctorMap[targetKey][sessId]) {
                                if (!proctorMap[targetKey][sessId].includes(finalRoomName)) proctorMap[targetKey][sessId].push(finalRoomName);
                            }
                            if (sessName && proctorMap[targetKey][sessName]) {
                                if (!proctorMap[targetKey][sessName].includes(finalRoomName)) proctorMap[targetKey][sessName].push(finalRoomName);
                            }
                        }
                    });
                });
            });

            // Sorting: Priority to those who have assignments in the first session
            const firstSessId = sessions[0]?.id;
            const firstSessName = sessions[0]?.name;
            const sortedProctors = [...proctors].sort((a, b) => {
                const aKey = a.id || `P${proctors.indexOf(a)}`;
                const bKey = b.id || `P${proctors.indexOf(b)}`;
                const schedA = proctorMap[aKey];
                const schedB = proctorMap[bKey];
                const rA = (schedA && (schedA[firstSessId]?.length > 0 ? String(schedA[firstSessId][0]) : (schedA[firstSessName]?.length > 0 ? String(schedA[firstSessName][0]) : 'ZZZ')));
                const rB = (schedB && (schedB[firstSessId]?.length > 0 ? String(schedB[firstSessId][0]) : (schedB[firstSessName]?.length > 0 ? String(schedB[firstSessName][0]) : 'ZZZ')));
                return rA.localeCompare(rB, undefined, {numeric: true});
            });

            body.innerHTML = sortedProctors.map((p, idx) => {
                const key = p.id || `P${idx}`;
                const sched = proctorMap[key];
                let sessionHtml = '';
                
                const pairIndex = Math.floor(idx / 2);
                const bgColor = pairIndex % 2 === 0 ? 'transparent' : '#f8fafc';

                sessions.forEach((s, i) => {
                    // Collect from all possible keys (ID, Name, Full Name)
                    const roomList = [];
                    if (sched) {
                        if (sched[s.id]) roomList.push(...sched[s.id]);
                        if (s.name && sched[s.name]) {
                            sched[s.name].forEach(r => { if (!roomList.includes(r)) roomList.push(r); });
                        }
                    }
                    const color = i % 2 === 0 ? '#1e40af' : '#047857'; 
                    const cellBg = roomList.length > 0 ? (i % 2 === 0 ? '#eff6ff' : '#f0fdf4') : 'transparent';
                    
                    sessionHtml += `
                        <td class="session-cell" style="background-color: ${cellBg}; color:${color}; font-weight:700; text-align:center; border: 1px solid #e2e8f0;">
                            ${roomList.length > 0 ? roomList.map(r => Helpers.escapeHTML(r)).join(', ') : '<span style="color:#cbd5e1; font-weight:normal">vắng</span>'}
                        </td>`;
                });

                return `
                    <tr class="hover-row transition-all" style="background-color: ${bgColor}">
                        <td style="text-align:center; color:#94a3b8; font-size:11px; border: 1px solid #e2e8f0;">${idx + 1}</td>
                        <td class="font-bold text-primary" style="border: 1px solid #e2e8f0; border-left: 4px solid ${pairIndex % 2 === 0 ? '#3b82f6' : '#10b981'}">
                            <div class="flex flex-col">
                                <span>${Helpers.escapeHTML(p.name)}</span>
                                <span class="text-[10px] font-normal text-gray-400">${Helpers.escapeHTML(p.gender || '')}</span>
                            </div>
                        </td>
                        <td style="font-size:11px; border: 1px solid #e2e8f0; text-align:center;">
                            <div class="flex items-center justify-center gap-1">
                                <span class="${p.phone ? 'text-slate-800 font-mono font-semibold' : 'text-amber-500 italic'}">${Helpers.escapeHTML(p.phone || 'Chưa nhập')}</span>
                                <button class="btn-refresh-mini p-0.5 text-blue-500 hover:text-blue-700" onclick="ZaloHub.promptProctorPhone('${Helpers.escapeHTML(p.id || p.name).replace(/'/g, "\\'")}')" title="Sửa SĐT">
                                    <i data-lucide="edit-3" style="width:12px"></i>
                                </button>
                            </div>
                        </td>
                        <td style="font-size:12px; border: 1px solid #e2e8f0;">${Helpers.escapeHTML(p.unit || '-')}</td>
                        <td style="font-size:11px; color:var(--text-muted); border: 1px solid #e2e8f0;">${(p.classes || []).map(c => Helpers.escapeHTML(c)).join(', ') || '-'}</td>
                        ${sessionHtml}
                    </tr>
                `;
            }).join('');

            if (typeof lucide !== 'undefined') lucide.createIcons();
        },

        // --- EXCEL EXPORT ---
        exportExcel: async function() {
            const rooms = Helpers.getGeneratedRooms();
            if (rooms.length === 0) {
                if (typeof window.showAlert === 'function') window.showAlert("⚠️ Không có dữ liệu để xuất!", 'warning');
                return;
            }

            let sessions = _activeSessions;
            if (sessions.length === 0) sessions = Helpers.getStoreSessions();

            try {
                const workbook = new ExcelJS.Workbook();
                const ws = workbook.addWorksheet('PHÂN CÔNG GIÁM THỊ');

                // Styles
                const headerStyle = {
                    font: { bold: true, color: { argb: 'FFFFFFFF' } },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } },
                    alignment: { horizontal: 'center', vertical: 'middle' },
                    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                };

                // 1. Header & Title (Decree 30 Standard)
                const colCount = 4 + sessions.length;
                if (typeof window.applyDecree30Header === 'function') {
                    window.applyDecree30Header(ws, 'BẢNG PHÂN CÔNG GIÁM THỊ COI THI', colCount);
                    ws.addRow([]); // Spacing
                } else {
                    ws.mergeCells(1, 1, 1, colCount);
                    const titleCell = ws.getCell(1, 1);
                    titleCell.value = 'BẢNG PHÂN CÔNG GIÁM THỊ COI THI';
                    titleCell.font = { size: 16, bold: true };
                    titleCell.alignment = { horizontal: 'center' };
                    ws.addRow([]);
                }

                // 2. Table Header Row
                const head = ['STT', 'Họ và Tên', 'SĐT Zalo', 'Đơn vị/Tổ', 'Lớp CN', ...sessions.map(s => s.name)];
                const headerRow = ws.addRow(head);
                headerRow.eachCell(cell => {
                    cell.style = headerStyle;
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });
                headerRow.height = 35;

                // Data Rows
                const proctors = Helpers.getProctorList();
                
                // Re-calculate mapping for Excel
                const proctorMap = {};
                proctors.forEach((p, idx) => {
                    const key = p.id || `P${idx}`;
                    proctorMap[key] = {};
                    sessions.forEach(s => proctorMap[key][s.id] = []);
                });

                rooms.forEach(room => {
                    sessions.forEach(session => {
                        const assigned = room[`proctors_${session.id}`] || [];
                        assigned.forEach(p => {
                            let key = p.id;
                            if (!proctorMap[key]) {
                                const match = proctors.find(pl => Helpers.matchProctor(p, pl));
                                key = match ? (match.id || match.name) : p.name;
                            }
                            if (proctorMap[key]) {
                                // Smart Naming: Sync with UI logic (Session Grade aware)
                                let rNum = room.number.toString();
                                if (rNum.includes('-')) rNum = rNum.split('-').pop();
                                
                                const currentGrade = session.grade || room.grade || "";
                                const finalRoomName = currentGrade ? `${currentGrade}-${rNum}` : rNum;
                                
                                if (!proctorMap[key][session.id].includes(finalRoomName)) {
                                    proctorMap[key][session.id].push(finalRoomName);
                                }
                            }
                        });
                    });
                });

                proctors.forEach((p, idx) => {
                    const key = p.id || `P${idx}`;
                    const rowData = [
                        idx + 1,
                        p.name,
                        p.phone || '',
                        p.unit || '',
                        (p.classes || []).join(', '),
                        ...sessions.map(s => (proctorMap[key][s.id] || []).join(', '))
                    ];
                    const r = ws.addRow(rowData);
                    r.alignment = { vertical: 'middle', horizontal: 'center' };
                    r.getCell(2).alignment = { horizontal: 'left' };
                });

                // Auto-fit columns
                ws.columns.forEach(col => col.width = 15);
                ws.getColumn(2).width = 25;

                // 3. Add Signatures (Decree 30 Standard)
                if (typeof window.addExcelSignatures === 'function') {
                    window.addExcelSignatures(ws, ws.rowCount + 2, colCount);
                }

                // --- ADD INDIVIDUAL SESSION SHEETS (DECREE 30 STANDARD) ---
                sessions.forEach((sess, sIdx) => {
                    const sessId = sess.id;
                    const sessName = sess.name || `Buổi_${sIdx + 1}`;
                    let cleanSheetName = sessName.replace(/[\/\\\?\*\:\[\]]/g, '_').substring(0, 25);
                    let sName = cleanSheetName;
                    let counter = 1;
                    while (workbook.worksheets.some(w => w.name === sName)) {
                        sName = `${cleanSheetName}_${counter++}`;
                    }
                    const wsSess = workbook.addWorksheet(sName);

                    // 1. Title Block
                    wsSess.mergeCells(1, 1, 1, 4);
                    const title1 = wsSess.getCell(1, 1);
                    title1.value = "DANH SÁCH GIÁO VIÊN COI THI THỬ TỐT NGHIỆP THPT";
                    title1.font = { name: 'Times New Roman', size: 14, bold: true };
                    title1.alignment = { horizontal: 'center', vertical: 'middle' };
                    wsSess.getRow(1).height = 25;

                    wsSess.mergeCells(2, 1, 2, 4);
                    const title2 = wsSess.getCell(2, 1);
                    title2.value = "NĂM HỌC 2025 - 2026";
                    title2.font = { name: 'Times New Roman', size: 12, bold: true };
                    title2.alignment = { horizontal: 'center', vertical: 'middle' };
                    wsSess.getRow(2).height = 20;

                    wsSess.mergeCells(3, 1, 3, 4);
                    const title3 = wsSess.getCell(3, 1);
                    title3.value = `Thời gian: ${sess.date || '........................'}`;
                    title3.font = { name: 'Times New Roman', size: 11, italic: true };
                    title3.alignment = { horizontal: 'center', vertical: 'middle' };
                    wsSess.getRow(3).height = 20;

                    wsSess.mergeCells(4, 1, 4, 4);
                    const title4 = wsSess.getCell(4, 1);
                    title4.value = `BÀI THI MÔN: ${sessName.toUpperCase()}`;
                    title4.font = { name: 'Times New Roman', size: 13, bold: true };
                    title4.alignment = { horizontal: 'center', vertical: 'middle' };
                    wsSess.getRow(4).height = 25;

                    wsSess.addRow([]); // Row 5 empty

                    // 2. Table Headers
                    const headRow = wsSess.addRow(['Phòng thi số', 'Cán bộ coi thi 1', 'Cán bộ coi thi 2', 'Cán bộ Giám sát']);
                    headRow.height = 32;
                    headRow.eachCell(cell => {
                        cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    });

                    // 3. Separate Normal vs Special Rooms
                    const isSpecialRoom = (rName) => {
                        const n = String(rName || '').toUpperCase();
                        return n.includes('GIÁM SÁT') || n.includes('GIAMSAT') || n.includes('GS') || 
                               n.includes('HỘI ĐỒNG') || n.includes('HOI DONG') || n.includes('HD') || n.includes('TRỰC') || n.includes('SÁT');
                    };

                    const normalRooms = rooms.filter(r => !isSpecialRoom(r.name || r.number));
                    const supervisors = [];
                    rooms.filter(r => isSpecialRoom(r.name || r.number)).forEach(r => {
                        const assigned = r[`proctors_${sessId}`] || r[`proctors_${sessName}`] || [];
                        assigned.forEach(p => { if (p && p.name) supervisors.push(p.name); });
                    });

                    // 4. Data Rows
                    const startDataRow = 7;
                    normalRooms.forEach((r, rIdx) => {
                        const assigned = r[`proctors_${sessId}`] || r[`proctors_${sessName}`] || [];
                        const cb1 = assigned[0] ? assigned[0].name : '';
                        const cb2 = assigned[1] ? assigned[1].name : '';
                        
                        let rNum = (r.number || r.name || "").toString();
                        if (rNum.includes('-')) rNum = rNum.split('-').pop();
                        const currentGrade = sess.grade || r.grade || "";
                        const finalRoomName = currentGrade ? `${currentGrade}-${rNum}` : rNum;

                        const row = wsSess.addRow([finalRoomName, cb1, cb2, '']);
                        row.height = 26;
                        row.eachCell((cell, colIdx) => {
                            cell.font = { name: 'Times New Roman', size: 11 };
                            cell.alignment = { vertical: 'middle', horizontal: colIdx === 1 ? 'center' : 'left' };
                            if (colIdx === 1) cell.font = { name: 'Times New Roman', size: 11, bold: true };
                            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        });
                    });

                    // 5. Merge & Distribute Supervisors Vertical Cells
                    const N = normalRooms.length;
                    const K = supervisors.length;
                    if (N > 0 && K > 0) {
                        const groupSize = Math.max(1, Math.ceil(N / K));
                        for (let sIdx = 0; sIdx < K; sIdx++) {
                            const startR = startDataRow + sIdx * groupSize;
                            const endR = Math.min(startDataRow + N - 1, startDataRow + (sIdx + 1) * groupSize - 1);
                            if (startR <= endR && startR <= wsSess.rowCount) {
                                const gsCell = wsSess.getCell(startR, 4);
                                gsCell.value = supervisors[sIdx];
                                gsCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E40AF' } };
                                gsCell.alignment = { vertical: 'middle', horizontal: 'center' };
                                if (startR < endR) {
                                    wsSess.mergeCells(startR, 4, endR, 4);
                                }
                            }
                        }
                    }

                    // Columns width
                    wsSess.getColumn(1).width = 16;
                    wsSess.getColumn(2).width = 30;
                    wsSess.getColumn(3).width = 30;
                    wsSess.getColumn(4).width = 28;

                    // 6. Signatures at bottom
                    const sigRowIdx = startDataRow + N + 2;
                    wsSess.mergeCells(sigRowIdx, 3, sigRowIdx, 4);
                    const sigTitle = wsSess.getCell(sigRowIdx, 3);
                    sigTitle.value = "TRƯỞNG BAN COI THI";
                    sigTitle.font = { name: 'Times New Roman', size: 11, bold: true };
                    sigTitle.alignment = { horizontal: 'center', vertical: 'middle' };
                });

                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Phan_Cong_Giam_Thi_${new Date().getTime()}.xlsx`;
                a.click();
            } catch (err) {
                console.error("Export failed", err);
                if (typeof window.showAlert === 'function') window.showAlert("❌ Xuất Excel thất bại!", 'danger');
            }
        },

        // --- FAIRNESS STATISTICS ---
        showFairnessStats: function() {
            const proctors = Helpers.getProctorList();
            const rooms = Helpers.getGeneratedRooms();
            const sessions = _activeSessions.length > 0 ? _activeSessions : Helpers.getStoreSessions();

            if (proctors.length === 0 || rooms.length === 0) {
                if (typeof window.showAlert === 'function') window.showAlert("⚠️ Chưa có dữ liệu phân công để thống kê!", 'warning');
                return;
            }

            const stats = proctors.map(p => {
                let count = 0;
                rooms.forEach(r => {
                    sessions.forEach(s => {
                        const assigned = r[`proctors_${s.id}`] || [];
                        if (assigned.some(ap => Helpers.matchProctor(ap, p))) count++;
                    });
                });
                return { name: p.name, count: count, unit: p.unit };
            });

            stats.sort((a, b) => b.count - a.count);
            const max = Math.max(...stats.map(s => s.count)) || 1;

            const html = `
                <div class="pro-section-title mb-4">Thống kê mật độ trực (Fairness)</div>
                <div class="max-h-[400px] overflow-y-auto pr-2">
                    <table class="w-full text-sm">
                        <thead class="sticky top-0 bg-white">
                            <tr class="border-b">
                                <th class="p-2 text-left">Giám thị</th>
                                <th class="p-2 text-center w-24">Số ca trực</th>
                                <th class="p-2 text-left">Mật độ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.map(s => `
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="p-2 font-medium">${Helpers.escapeHTML(s.name)} ${s.unit ? `(<span class="text-xs text-gray-500">${Helpers.escapeHTML(s.unit)}</span>)` : ''}</td>
                                    <td class="p-2 text-center font-bold text-blue-600">${s.count}</td>
                                    <td class="p-2">
                                        <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div class="bg-blue-500 h-full" style="width: ${(s.count / max) * 100}%"></div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            const overlay = document.createElement('div');
            overlay.className = 'custom-alert-overlay';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '10000';
            overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
            
            overlay.innerHTML = `
                <div class="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
                    ${html}
                    <div class="mt-6 flex justify-end">
                        <button class="btn btn-primary px-8" onclick="this.closest('.custom-alert-overlay').remove()">ĐÓNG</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        },

        // --- INDIVIDUAL DUTY CARDS ---
        exportDutyCards: async function() {
            const proctors = Helpers.getProctorList();
            const rooms = Helpers.getGeneratedRooms();
            const sessions = _activeSessions.length > 0 ? _activeSessions : Helpers.getStoreSessions();

            if (proctors.length === 0 || rooms.length === 0) {
                if (typeof window.showAlert === 'function') window.showAlert("⚠️ Không có dữ liệu để xuất phiếu!", 'warning');
                return;
            }

            try {
                const workbook = new ExcelJS.Workbook();
                const ws = workbook.addWorksheet('PHIEU_CA_NHAN');

                let currentRow = 1;
                proctors.forEach((p, idx) => {
                    const schedule = [];
                    sessions.forEach(s => {
                        rooms.forEach(r => {
                            const assigned = r[`proctors_${s.id}`] || [];
                            if (assigned.some(ap => Helpers.matchProctor(ap, p))) {
                                schedule.push({ session: s.name, room: r.number });
                            }
                        });
                    });

                    if (schedule.length > 0) {
                        ws.mergeCells(currentRow, 1, currentRow, 3);
                        const cell = ws.getCell(currentRow, 1);
                        cell.value = `PHIẾU PHÂN CÔNG: ${p.name.toUpperCase()} ${p.unit ? `(${p.unit.toUpperCase()})` : ''}`;
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                        cell.alignment = { horizontal: 'center' };
                        
                        currentRow++;
                        ws.getCell(currentRow, 1).value = 'STT';
                        ws.getCell(currentRow, 2).value = 'Buổi thi / Môn thi';
                        ws.getCell(currentRow, 3).value = 'Phòng thi';
                        ws.getRow(currentRow).font = { bold: true };
                        ws.getRow(currentRow).alignment = { horizontal: 'center' };

                        schedule.forEach((item, i) => {
                            currentRow++;
                            ws.getCell(currentRow, 1).value = i + 1;
                            ws.getCell(currentRow, 2).value = item.session;
                            ws.getCell(currentRow, 3).value = item.room;
                            ws.getRow(currentRow).alignment = { horizontal: 'center' };
                        });

                        currentRow += 2;
                    }
                });

                ws.getColumn(1).width = 10;
                ws.getColumn(2).width = 40;
                ws.getColumn(3).width = 20;

                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Phieu_Giam_Thi_Ca_Nhan_${new Date().getTime()}.xlsx`;
                a.click();
            } catch (err) {
                console.error(err);
                if (typeof window.showAlert === 'function') window.showAlert("❌ Lỗi xuất phiếu cá nhân!", 'danger');
            }
        }
    };
})();

window.ProctorPro = ProctorPro;
window.renderProctorBoard = ProctorPro.renderBoard;
window.exportIndependentProctorExcel = ProctorPro.exportExcel;
window.showProctorFairnessStats = ProctorPro.showFairnessStats;
window.exportProctorDutyCards = ProctorPro.exportDutyCards;
window.filterProctorBoard = () => ProctorPro.renderBoard(); // Simple filter proxy


