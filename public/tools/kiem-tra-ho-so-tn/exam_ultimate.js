/**
 * EXAM ULTIMATE SERVICE (SaaS Ultimate 3.0)
 * Flagship Operations: Kiosk Site Map, Live Attendance, Exam Bag Sealing & Handover
 */

const ExamUltimate = (() => {
    "use strict";

    // --- STATE ---
    let liveAttendanceState = {}; // { sbd: { absent: true, reason: "Ốm" } }
    let activeKioskRoom = null;
    let activeAttendanceRoom = null;
    let activeSealingRoom = null;

    // --- HELPERS ---
    const escapeHTML = (str) => {
        if (str == null) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const getRooms = () => {
        let list = (typeof window.generatedRooms !== 'undefined') ? window.generatedRooms : [];
        if (!list || list.length === 0) {
            if (typeof ProctorStore !== 'undefined' && ProctorStore.getState()?.rooms) {
                list = ProctorStore.getState().rooms;
            }
        }
        return list || [];
    };

    const getDeptSchool = () => {
        const dept = document.getElementById('cfg-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
        const school = document.getElementById('cfg-school-name')?.value || "HỘI ĐỒNG THI TRƯỜNG THPT CẤP KỲ THI";
        return { dept, school };
    };

    const getProctorNamesForRoom = (room) => {
        if (!room) return "Chưa phân công";
        const proctors = [];
        Object.keys(room).forEach(k => {
            if (k.startsWith('proctors_')) {
                const arr = room[k] || [];
                arr.forEach(p => {
                    const n = p.name ? p.name.toString() : "";
                    if (n && !proctors.includes(n)) proctors.push(n);
                });
            }
        });
        if (proctors.length === 0) return "Chưa phân công";
        return proctors.join(', ');
    };

    // --- 1. KIOSK SITE MAP & SEARCH ---
    const renderKioskMap = (searchQuery = "") => {
        const container = document.getElementById('kiosk-map-container');
        const countDisplay = document.getElementById('kiosk-total-rooms');
        const alertBox = document.getElementById('kiosk-search-alert');
        if (!container) return;

        const rooms = getRooms();
        if (countDisplay) countDisplay.innerText = rooms.length;

        if (rooms.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-20 text-center bg-white rounded-3xl border border-amber-200 shadow-sm p-12">
                    <div class="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-inner">
                        <i data-lucide="map-pin" style="width:36px; height:36px"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 mb-2">Chưa có Sơ đồ Điểm thi kỹ thuật số</h3>
                    <p class="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">Vui lòng nạp dữ liệu hồ sơ và chạy chức năng "Xếp phòng thi" trước để tự động tạo sơ đồ trực quan.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const queryNorm = searchQuery.toString().toLowerCase().trim();
        let highlightedRoomNumber = null;
        let matchedStudent = null;

        if (queryNorm) {
            rooms.forEach(r => {
                const students = r.students || [];
                const found = students.find(s => 
                    (s.sbd && s.sbd.toString().toLowerCase().includes(queryNorm)) ||
                    (s.cccd && s.cccd.toString().toLowerCase().includes(queryNorm)) ||
                    (s.hoten && s.hoten.toString().toLowerCase().includes(queryNorm))
                );
                if (found) {
                    highlightedRoomNumber = r.number;
                    matchedStudent = found;
                }
            });
        }

        if (alertBox) {
            if (matchedStudent && highlightedRoomNumber) {
                alertBox.innerHTML = `
                    <div class="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-bounce border border-amber-300">
                        <div class="flex items-center gap-3">
                            <div class="bg-white/20 p-2.5 rounded-xl"><i data-lucide="bell-ring" style="width:24px; color:white"></i></div>
                            <div>
                                <div class="text-xs font-semibold text-amber-100 uppercase tracking-wider">Đã tìm thấy Thí sinh</div>
                                <div class="text-base font-extrabold">${escapeHTML(matchedStudent.hoten)} | SBD: ${escapeHTML(matchedStudent.sbd)} | Lớp: ${escapeHTML(matchedStudent.lop || '12')}</div>
                            </div>
                        </div>
                        <div class="bg-white text-slate-900 font-black px-5 py-2.5 rounded-xl text-lg shadow-md flex items-center gap-2">
                            <i data-lucide="map-pin" style="width:20px; color:#f59e0b"></i> PHÒNG THI: ${escapeHTML(highlightedRoomNumber)}
                        </div>
                    </div>
                `;
            } else if (queryNorm) {
                alertBox.innerHTML = `
                    <div class="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-200 flex items-center gap-3 font-semibold">
                        <i data-lucide="alert-circle" style="width:20px flex-shrink-0"></i> Không tìm thấy thí sinh nào khớp với thông tin tra cứu "${escapeHTML(searchQuery)}". Vui lòng kiểm tra lại số báo danh.
                    </div>
                `;
            } else {
                alertBox.innerHTML = "";
            }
        }

        container.innerHTML = rooms.map((r, idx) => {
            const isMatch = highlightedRoomNumber && r.number === highlightedRoomNumber;
            const floorNum = Math.floor(idx / 8) + 1;
            const bldName = idx < 12 ? "KHU A" : "KHU B";
            const proctorsStr = getProctorNamesForRoom(r);
            const studentCount = (r.students || []).length;

            return `
                <div onclick="ExamUltimate.openKioskModal('${escapeHTML(r.number).replace(/'/g, "\\'")}')" class="cursor-pointer bg-white rounded-3xl p-6 border ${isMatch ? 'ring-4 ring-amber-500 bg-amber-50/70 shadow-2xl scale-102 z-10 animate-pulse' : 'border-slate-200 shadow-md hover:shadow-xl'} transition-all relative overflow-hidden group">
                    <div class="absolute top-0 right-0 bg-gradient-to-l ${isMatch ? 'from-amber-500 to-orange-500' : 'from-slate-700 to-slate-800'} text-white font-extrabold text-[10px] px-4 py-1 rounded-bl-2xl uppercase tracking-wider shadow">
                        ${escapeHTML(bldName)} - TẦNG ${floorNum}
                    </div>
                    <div class="flex items-start justify-between gap-4 mt-2">
                        <div>
                            <span class="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">PHÒNG THI</span>
                            <h3 class="text-2xl font-black ${isMatch ? 'text-amber-600' : 'text-slate-800'} m-0 leading-tight group-hover:text-amber-600 transition-colors">PHÒNG ${escapeHTML(r.number)}</h3>
                        </div>
                        <div class="bg-slate-100 px-3 py-1.5 rounded-xl font-bold text-xs text-slate-700 border border-slate-200 flex items-center gap-1.5">
                            <i data-lucide="users" style="width:14px; color:#64748b"></i> ${studentCount} TS
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span class="truncate max-w-[200px]" title="Giám thị: ${escapeHTML(proctorsStr)}"><b>GT:</b> ${escapeHTML(proctorsStr)}</span>
                        <span class="text-amber-600 font-bold group-hover:underline flex items-center gap-1">Chi tiết <i data-lucide="chevron-right" style="width:14px"></i></span>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const openKioskModal = (roomNumber) => {
        const rooms = getRooms();
        const room = rooms.find(r => r.number === roomNumber);
        if (!room) return;
        activeKioskRoom = room;

        const modal = document.getElementById('kiosk-room-modal');
        const title = document.getElementById('kiosk-modal-title');
        const body = document.getElementById('kiosk-modal-body');
        if (!modal || !title || !body) return;

        title.innerText = `DANH SÁCH THÍ SINH - PHÒNG THI SỐ ${room.number}`;
        const students = room.students || [];

        body.innerHTML = students.map((s, i) => `
            <tr class="border-b hover:bg-slate-50 transition-colors">
                <td class="p-3 text-center font-semibold text-slate-500">${i + 1}</td>
                <td class="p-3 text-center font-extrabold text-blue-600">${escapeHTML(s.sbd || '---')}</td>
                <td class="p-3 font-bold text-slate-800">${escapeHTML(s.hoten || '---')}</td>
                <td class="p-3 text-center text-slate-600">${escapeHTML(s.ngaysinh || s.cccd || '---')}</td>
                <td class="p-3 text-center font-semibold text-slate-700">${escapeHTML(s.lop || '12')}</td>
                <td class="p-3 text-center"><span class="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-lg font-bold">Đủ điều kiện</span></td>
            </tr>
        `).join('');
                <td class="p-3 text-center"><span class="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-lg font-bold">Đủ điều kiện</span></td>
            </tr>
        `).join('');

        modal.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const closeKioskModal = () => {
        const modal = document.getElementById('kiosk-room-modal');
        if (modal) modal.style.display = 'none';
        activeKioskRoom = null;
    };

    // --- 2. LIVE ATTENDANCE & ABSENTEE REPORT ---
    const renderLiveAttendance = () => {
        const select = document.getElementById('attendance-room-select');
        const container = document.getElementById('attendance-students-body');
        const totalStat = document.getElementById('attendance-stat-total');
        const presentStat = document.getElementById('attendance-stat-present');
        const absentStat = document.getElementById('attendance-stat-absent');
        const rateStat = document.getElementById('attendance-stat-rate');
        if (!select || !container) return;

        const rooms = getRooms();
        if (rooms.length === 0) {
            container.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400 italic font-semibold">Chưa có danh sách phòng thi để điểm danh.</td></tr>`;
            return;
        }

        // Initialize room selector options if empty
        if (select.options.length <= 1) {
            select.innerHTML = `<option value="">-- Chọn phòng thi cần điểm danh --</option>` + rooms.map(r => `
                <option value="${r.number}">Phòng thi số ${r.number}</option>
            `).join('');
            if (activeAttendanceRoom) select.value = activeAttendanceRoom.number;
            else { select.value = rooms[0].number; activeAttendanceRoom = rooms[0]; }
        } else if (!activeAttendanceRoom && select.value) {
            activeAttendanceRoom = rooms.find(r => r.number === select.value);
        }

        // Calculate Global KPI Stats
        let totalStudents = 0;
        let totalAbsent = 0;
        rooms.forEach(r => {
            (r.students || []).forEach(s => {
                totalStudents++;
                if (liveAttendanceState[s.sbd] && liveAttendanceState[s.sbd].absent) totalAbsent++;
            });
        });
        const totalPresent = totalStudents - totalAbsent;
        const presentRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 100;

        if (totalStat) totalStat.innerText = totalStudents;
        if (presentStat) presentStat.innerText = totalPresent;
        if (absentStat) absentStat.innerText = totalAbsent;
        if (rateStat) rateStat.innerText = `${presentRate}%`;

        if (!activeAttendanceRoom) {
            container.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400 italic font-semibold">Vui lòng chọn một phòng thi phía trên để tiến hành điểm danh.</td></tr>`;
            return;
        }

        const students = activeAttendanceRoom.students || [];
        container.innerHTML = students.map((s, i) => {
            const att = liveAttendanceState[s.sbd] || { absent: false, reason: "Ốm" };
            const escapedSbd = escapeHTML(s.sbd || '---');
            const safeSbdParam = escapedSbd.replace(/'/g, "\\'");
            return `
                <tr class="border-b hover:bg-slate-50 transition-colors ${att.absent ? 'bg-rose-50/50' : ''}">
                    <td class="p-3 text-center font-semibold text-slate-500">${i + 1}</td>
                    <td class="p-3 text-center font-extrabold text-slate-800">${escapedSbd}</td>
                    <td class="p-3 font-bold text-slate-900">${escapeHTML(s.hoten || '---')}</td>
                    <td class="p-3 text-center text-slate-600">${escapeHTML(s.ngaysinh || s.cccd || '---')}</td>
                    <td class="p-3 text-center font-semibold text-slate-700">${escapeHTML(s.lop || '12')}</td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="ExamUltimate.toggleAttendance('${safeSbdParam}', false)" class="px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${!att.absent ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                CÓ MẶT
                            </button>
                            <button onclick="ExamUltimate.toggleAttendance('${safeSbdParam}', true)" class="px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${att.absent ? 'bg-rose-600 text-white shadow-md animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600'}">
                                VẮNG MẶT
                            </button>
                        </div>
                    </td>
                    <td class="p-3 text-center">
                        ${att.absent ? `
                            <select onchange="ExamUltimate.updateAbsentReason('${safeSbdParam}', this.value)" class="form-control text-xs font-semibold bg-white border border-rose-300 text-rose-700 p-1.5 rounded-xl" style="width:160px">
                                <option value="Ốm" ${att.reason === 'Ốm' ? 'selected' : ''}>Ốm / Nhập viện</option>
                                <option value="Đến muộn quá 15 phút" ${att.reason === 'Đến muộn quá 15 phút' ? 'selected' : ''}>Đến muộn quá 15 phút</option>
                                <option value="Không có lý do" ${att.reason === 'Không có lý do' ? 'selected' : ''}>Không có lý do</option>
                                <option value="Miễn thi tốt nghiệp" ${att.reason === 'Miễn thi tốt nghiệp' ? 'selected' : ''}>Miễn thi tốt nghiệp</option>
                            </select>
                        ` : `<span class="text-xs text-slate-400 italic">Không có</span>`}
                    </td>
                </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const selectAttendanceRoom = (roomNumber) => {
        const rooms = getRooms();
        activeAttendanceRoom = rooms.find(r => r.number === roomNumber);
        renderLiveAttendance();
    };

    const toggleAttendance = (sbd, isAbsent) => {
        if (!liveAttendanceState[sbd]) {
            liveAttendanceState[sbd] = { absent: isAbsent, reason: "Ốm" };
        } else {
            liveAttendanceState[sbd].absent = isAbsent;
        }
        renderLiveAttendance();
    };

    const updateAbsentReason = (sbd, reason) => {
        if (liveAttendanceState[sbd]) {
            liveAttendanceState[sbd].reason = reason;
        }
    };

    const exportAbsenteeReportExcel = async () => {
        const rooms = getRooms();
        const absentees = [];
        rooms.forEach(r => {
            (r.students || []).forEach(s => {
                if (liveAttendanceState[s.sbd] && liveAttendanceState[s.sbd].absent) {
                    absentees.push({
                        roomNumber: r.number,
                        sbd: s.sbd,
                        hoten: s.hoten,
                        ngaysinh: s.ngaysinh || s.cccd || '',
                        lop: s.lop || '12',
                        reason: liveAttendanceState[s.sbd].reason || "Ốm"
                    });
                }
            });
        });

        if (absentees.length === 0) {
            if (typeof window.showAlert === 'function') window.showAlert("✨ Báo cáo hoàn hảo: Không có thí sinh nào vắng mặt!", 'success');
            return;
        }

        const { dept, school } = getDeptSchool();
        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('DANH_SACH_VANG_MAT');

        // Style
        ws.mergeCells(1, 1, 1, 6);
        const titleCell = ws.getCell(1, 1);
        titleCell.value = `${dept.toUpperCase()} - ${school.toUpperCase()}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };

        ws.mergeCells(2, 1, 2, 6);
        const subCell = ws.getCell(2, 1);
        subCell.value = "DANH SÁCH THÍ SINH VẮNG MẶT (BÁO CÁO KHẨN SAU 15 PHÚT TÍNH GIỜ)";
        subCell.font = { bold: true, size: 16, color: { argb: 'FF990000' } };
        subCell.alignment = { horizontal: 'center' };

        ws.addRow([]);
        const headerRow = ws.addRow(['STT', 'Mã Phòng', 'Số Báo Danh', 'Họ và Tên', 'Lớp / CCCD', 'Lý do vắng mặt']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell(c => {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            c.alignment = { horizontal: 'center' };
        });

        absentees.forEach((a, i) => {
            const row = ws.addRow([
                i + 1,
                `P.${a.roomNumber}`,
                a.sbd,
                a.hoten,
                `${a.lop} / ${a.ngaysinh}`,
                a.reason
            ]);
            row.eachCell(c => c.alignment = { horizontal: 'center' });
            row.getCell(4).alignment = { horizontal: 'left' };
        });

        ws.columns.forEach(col => col.width = 22);
        ws.getColumn(4).width = 32;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Bao_Cao_Thi_Sinh_Vang_Mat_THPT_2026.xlsx`;
        link.click();
    };

    // --- 3. EXAM BAG SEALING & FORMS ---
    let activeSealingMode = 'bag';

    const renderExamSealing = () => {
        const select = document.getElementById('sealing-room-select');
        const container = document.getElementById('sealing-preview-container');
        if (!select || !container) return;

        const rooms = getRooms();
        if (rooms.length === 0) {
            container.innerHTML = `<div class="py-20 text-center text-slate-400 italic font-semibold">Chưa có dữ liệu phòng thi để sinh nhãn niêm phong.</div>`;
            return;
        }

        if (select.options.length <= 1) {
            select.innerHTML = rooms.map(r => `<option value="${r.number}">Phòng thi số ${r.number}</option>`).join('');
            select.value = rooms[0].number;
            activeSealingRoom = rooms[0];
        } else if (!activeSealingRoom && select.value) {
            activeSealingRoom = rooms.find(r => r.number === select.value);
        }

        const { dept: rawDept, school: rawSchool } = getDeptSchool();
        const dept = escapeHTML(rawDept);
        const school = escapeHTML(rawSchool);
        const rNum = escapeHTML(activeSealingRoom.number);
        const students = activeSealingRoom.students || [];
        const totalCount = students.length;

        const absentees = students.filter(s => liveAttendanceState[s.sbd] && liveAttendanceState[s.sbd].absent);
        const presentCount = totalCount - absentees.length;
        const absentSbdsStr = absentees.length > 0 ? absentees.map(s => escapeHTML(s.sbd)).join(', ') : "Không có thí sinh vắng mặt";

        if (activeSealingMode === 'bag') {
            container.innerHTML = `
                <div class="bg-white rounded-3xl shadow-2xl border-2 border-slate-800 p-12 max-w-3xl mx-auto relative overflow-hidden font-sans" style="font-family: 'Inter', sans-serif;">
                    <div class="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>
                    <div class="text-center border-b-2 border-slate-800 pb-6 mb-8 px-4">
                        <div class="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-600 truncate max-w-full">${dept}</div>
                        <div class="text-base sm:text-lg font-black uppercase text-slate-900 mt-1 truncate max-w-full">${school}</div>
                        <h2 class="text-3xl font-extrabold text-red-700 mt-6 tracking-wide">NHÃN NIÊM PHONG TÚI ĐỰNG BÀI THI</h2>
                        <div class="text-xs text-slate-500 mt-1 font-semibold">Kỳ thi Tốt nghiệp THPT năm 2026</div>
                    </div>
                    
                    <div class="space-y-6 text-slate-800 text-lg leading-relaxed mb-12">
                        <div class="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 font-sans">
                            <div><span class="text-slate-500 font-medium">Phòng thi số:</span> <b class="text-xl text-slate-900 font-black">PHÒNG ${rNum}</b></div>
                            <div><span class="text-slate-500 font-medium">Buổi thi / Môn thi:</span> <b class="text-xl text-slate-900 font-black border-b border-dashed border-slate-400 pb-1 px-4 inline-block min-w-[160px]">....................</b></div>
                        </div>
                        <div class="space-y-4 pt-2 font-sans">
                            <div class="flex items-end gap-2">
                                <span class="font-bold flex-shrink-0">Số bài thi thu được:</span>
                                <span class="flex-1 border-b border-dashed border-slate-400 pb-1 font-black text-blue-700 px-2">${presentCount} bài (bằng chữ: ........................................................)</span>
                            </div>
                            <div class="flex items-end gap-2">
                                <span class="font-bold flex-shrink-0">Tổng số tờ giấy thi:</span>
                                <span class="flex-1 border-b border-dashed border-slate-400 pb-1 font-black text-blue-700 px-2">........... tờ (bằng chữ: ........................................................)</span>
                            </div>
                            <div class="flex items-start gap-2 pt-2">
                                <span class="font-bold flex-shrink-0">Danh sách SBD vắng:</span>
                                <span class="flex-1 border-b border-dashed border-slate-400 pb-1 text-rose-600 font-bold leading-loose">${absentSbdsStr}</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-4 gap-6 pt-8 border-t-2 border-slate-800 text-center font-sans text-sm font-semibold">
                        <div class="space-y-16">
                            <div class="font-black text-slate-800">CÁN BỘ COI THI 1</div>
                            <div class="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                        </div>
                        <div class="space-y-16">
                            <div class="font-black text-slate-800">CÁN BỘ COI THI 2</div>
                            <div class="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                        </div>
                        <div class="space-y-16">
                            <div class="font-black text-slate-800">THƯ KÝ ĐIỂM THI</div>
                            <div class="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                        </div>
                        <div class="space-y-16">
                            <div class="font-black text-slate-900">TRƯỞNG ĐIỂM THI</div>
                            <div class="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (activeSealingMode === 'question') {
            const questionCount = totalCount + 1;
            container.innerHTML = `
                <div class="bg-white rounded-3xl shadow-2xl border-2 border-slate-800 p-12 max-w-3xl mx-auto relative overflow-hidden font-sans" style="font-family: 'Inter', sans-serif;">
                    <div class="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-blue-700 via-cyan-500 to-blue-700"></div>
                    <div class="text-center border-b-2 border-slate-800 pb-6 mb-8 px-4">
                        <div class="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-600 truncate max-w-full">${dept}</div>
                        <div class="text-base sm:text-lg font-black uppercase text-slate-900 mt-1 truncate max-w-full">${school}</div>
                        <h2 class="text-3xl font-extrabold text-blue-800 mt-6 tracking-wide">NHÃN TÚI ĐỀ THI</h2>
                        <div class="text-xs text-slate-500 mt-1 font-semibold">Kỳ thi Tốt nghiệp THPT năm 2026</div>
                    </div>
                    
                    <div class="space-y-6 text-slate-800 text-lg leading-relaxed mb-12">
                        <div class="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 font-sans">
                            <div><span class="text-slate-500 font-medium">Phòng thi số:</span> <b class="text-xl text-blue-900 font-black">PHÒNG ${rNum}</b></div>
                            <div><span class="text-slate-500 font-medium">Buổi thi / Môn thi:</span> <b class="text-xl text-slate-900 font-black border-b border-dashed border-slate-400 pb-1 px-4 inline-block min-w-[160px]">....................</b></div>
                        </div>
                        <div class="space-y-4 pt-2 font-sans">
                            <div class="flex items-end gap-2">
                                <span class="font-bold flex-shrink-0">Số lượng đề thi bên trong:</span>
                                <span class="flex-1 border-b border-dashed border-slate-400 pb-1 font-black text-rose-700 px-2">${questionCount} đề <span class="text-sm text-slate-500 font-normal">(Đã gồm 1 đề dự phòng)</span></span>
                            </div>
                            <div class="flex items-start gap-2 pt-2">
                                <span class="font-bold flex-shrink-0">Quy chế bắt buộc:</span>
                                <span class="flex-1 border-b border-dashed border-slate-400 pb-1 text-slate-600 font-semibold text-base italic leading-relaxed">Giám thị chỉ được bóc/cắt túi đề thi trước sự chứng kiến của thí sinh lúc ....... giờ ....... phút.</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-6 pt-8 border-t-2 border-slate-800 text-center font-sans text-sm font-semibold">
                        <div class="space-y-16">
                            <div class="font-black text-slate-800">BÀN GIAO ĐỀ THI</div>
                            <div class="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                        </div>
                        <div class="space-y-16">
                            <div class="font-black text-slate-800">CÁN BỘ COI THI 1</div>
                            <div class="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                        </div>
                        <div class="space-y-16">
                            <div class="font-black text-slate-800">CÁN BỘ COI THI 2</div>
                            <div class="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (activeSealingMode === 'master_question') {
            container.innerHTML = `
                <div class="bg-white rounded-3xl shadow-2xl border-2 border-slate-800 p-8 max-w-4xl mx-auto relative overflow-hidden font-sans space-y-8" style="font-family: 'Inter', sans-serif;">
                    <div class="text-center pb-4 border-b border-slate-200">
                        <h2 class="text-2xl font-black text-rose-700">XEM TRƯỚC NHÃN TÚI ĐỀ CHÍNH THỨC & DỰ PHÒNG</h2>
                        <p class="text-sm font-semibold text-slate-500 mt-1">Dành cho Trưởng điểm thi lưu trữ và bảo mật đề thi theo từng môn/ca thi</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Official Preview -->
                        <div class="border-2 border-slate-800 p-6 rounded-2xl flex flex-col justify-between bg-white shadow-md relative overflow-hidden">
                            <div class="absolute top-0 left-0 right-0 h-2 bg-rose-600"></div>
                            <div class="text-center border-b border-slate-800 pb-4 mb-4 mt-2">
                                <div class="text-xs font-bold uppercase text-slate-600">${dept}</div>
                                <div class="text-sm font-black uppercase text-slate-900 mt-1">${school}</div>
                                <div class="font-black text-rose-600 text-xl mt-3 tracking-wide">TÚI ĐỀ THI CHÍNH THỨC</div>
                            </div>
                            <div class="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center my-4">
                                <div class="text-xs font-bold text-rose-800 uppercase">MÔN THI (NGỮ VĂN)</div>
                                <div class="text-2xl font-black text-rose-900 mt-1">NGỮ VĂN</div>
                            </div>
                            <div class="text-sm font-semibold text-slate-800 space-y-2 py-2">
                                <div class="flex justify-between"><span>Số phòng thi:</span> <b class="text-base">Các phòng thi</b></div>
                                <div class="flex justify-between"><span>Số lượng đề bên trong:</span> <b class="text-rose-600 font-black text-base">01 bộ đề gốc</b></div>
                                <div class="pt-2 text-xs italic text-slate-500">⚠️ Bảo mật tuyệt đối theo quy định.</div>
                            </div>
                        </div>

                        <!-- Backup Preview -->
                        <div class="border-2 border-slate-800 p-6 rounded-2xl flex flex-col justify-between bg-white shadow-md relative overflow-hidden">
                            <div class="absolute top-0 left-0 right-0 h-2 bg-blue-600"></div>
                            <div class="text-center border-b border-slate-800 pb-4 mb-4 mt-2">
                                <div class="text-xs font-bold uppercase text-slate-600">${dept}</div>
                                <div class="text-sm font-black uppercase text-slate-900 mt-1">${school}</div>
                                <div class="font-black text-blue-600 text-xl mt-3 tracking-wide">TÚI ĐỀ THI DỰ PHÒNG</div>
                            </div>
                            <div class="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center my-4">
                                <div class="text-xs font-bold text-blue-800 uppercase">MÔN THI (NGỮ VĂN)</div>
                                <div class="text-2xl font-black text-blue-900 mt-1">NGỮ VĂN</div>
                            </div>
                            <div class="text-sm font-semibold text-slate-800 space-y-2 py-2">
                                <div class="flex justify-between"><span>Số lượng đề dự phòng:</span> <b class="text-base">.............. đề</b></div>
                                <div class="pt-2 text-xs italic text-slate-500">⚠️ Chỉ mở khi có lệnh của Trưởng điểm thi.</div>
                            </div>
                        </div>
                    </div>
                    <div class="text-center pt-4">
                        <button onclick="ExamUltimate.printSealingForms()" class="btn bg-gradient-to-r from-rose-600 to-red-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:from-rose-700 hover:to-red-700 inline-flex items-center gap-2 text-base">
                            <i data-lucide="printer" style="width:24px"></i> IN TOÀN BỘ NHÃN ĐỀ CHÍNH / DỰ PHÒNG (A4)
                        </button>
                    </div>
                </div>
            `;
        } else if (activeSealingMode === 'door') {
            container.innerHTML = `
                <div class="bg-white rounded-3xl shadow-2xl border-4 border-blue-900 p-16 max-w-4xl mx-auto text-center relative overflow-hidden font-sans">
                    <div class="absolute top-0 left-0 right-0 bg-blue-900 text-white py-3 text-sm font-extrabold tracking-widest">KỲ THI TỐT NGHIỆP THPT NĂM 2026</div>
                    <div class="mt-8 mb-6 uppercase text-slate-500 font-bold tracking-widest">${dept} | ${school}</div>
                    <h1 class="text-7xl font-black text-blue-900 my-8 py-6 bg-blue-50/50 rounded-3xl border border-blue-100 shadow-inner">PHÒNG THI SỐ ${rNum}</h1>
                    <div class="text-2xl font-extrabold text-slate-700 my-6 flex justify-center items-center gap-6">
                        <span class="bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200">Từ SBD: <b class="text-blue-700">${escapeHTML(students[0]?.sbd || '---')}</b></span>
                        <i data-lucide="arrow-right" style="width:32px; color:#334155"></i>
                        <span class="bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200">Đến SBD: <b class="text-blue-700">${escapeHTML(students[students.length-1]?.sbd || '---')}</b></span>
                    </div>
                    <div class="text-slate-500 font-semibold mt-12 text-sm italic border-t border-slate-100 pt-6">Thí sinh để toàn bộ tư trang, balo ngoài khu vực quy định trước khi vào phòng thi.</div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 max-w-4xl mx-auto font-sans">
                    <div class="text-center border-b border-slate-200 pb-6 mb-8">
                        <h2 class="text-2xl font-black text-slate-900">DANH SÁCH THÍ SINH PHÒNG THI SỐ ${rNum}</h2>
                        <div class="text-sm font-bold text-slate-500 mt-1">${dept} - ${school}</div>
                    </div>
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="bg-slate-100 text-slate-700">
                                <th class="p-3 text-center w-16">STT</th>
                                <th class="p-3 text-center">Số Báo Danh</th>
                                <th class="p-3">Họ và Tên</th>
                                <th class="p-3 text-center">Ngày sinh</th>
                                <th class="p-3 text-center">Lớp</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map((s, i) => `
                                <tr class="border-b">
                                    <td class="p-3 text-center font-bold text-slate-500">${i + 1}</td>
                                    <td class="p-3 text-center font-extrabold text-blue-700">${escapeHTML(s.sbd)}</td>
                                    <td class="p-3 font-bold text-slate-900">${escapeHTML(s.hoten)}</td>
                                    <td class="p-3 text-center text-slate-600">${escapeHTML(s.ngaysinh || s.cccd)}</td>
                                    <td class="p-3 text-center font-semibold text-slate-700">${escapeHTML(s.lop || '12')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const selectSealingRoom = (roomNumber) => {
        const rooms = getRooms();
        activeSealingRoom = rooms.find(r => r.number === roomNumber);
        renderExamSealing();
    };

    const switchSealingMode = (mode) => {
        activeSealingMode = mode;
        document.querySelectorAll('.sealing-tab-btn').forEach(btn => btn.classList.remove('active', 'bg-blue-600', 'text-white'));
        document.querySelectorAll('.sealing-tab-btn text-slate-600').forEach(btn => btn.classList.add('text-slate-600'));
        
        const actBtn = document.getElementById(`sealing-btn-${mode}`);
        if (actBtn) {
            actBtn.className = "sealing-tab-btn active px-6 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg flex items-center gap-2 transition-all";
        }
        renderExamSealing();
    };

    const printSealingForms = () => {
        if (activeSealingMode === 'bag' && typeof openPrintPreview === 'function') {
            openPrintPreview('labels');
            return;
        }
        if (activeSealingMode === 'question' && typeof openPrintPreview === 'function') {
            openPrintPreview('question_labels');
            return;
        }
        if (activeSealingMode === 'master_question' && typeof openPrintPreview === 'function') {
            openPrintPreview('master_question_labels');
            return;
        }
        const container = document.getElementById('sealing-preview-container');
        if (!container) return;
        const html = container.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>In Biểu Mẫu Phòng Thi</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print { 
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
                            * { color: #000000 !important; border-color: #000000 !important; }
                            .bg-slate-50, .bg-blue-50, .bg-slate-100, .bg-blue-900, .bg-gradient-to-r { background: transparent !important; box-shadow: none !important; }
                        }
                    </style>
                </head>
                <body class="p-12 bg-white" style="font-family: 'Inter', sans-serif;">${html}</body>
            </html>
        `);
        win.document.close();
        setTimeout(() => win.print(), 800);
    };

    // --- PUBLIC EXPORTS ---
    return {
        renderKioskMap,
        openKioskModal,
        closeKioskModal,
        renderLiveAttendance,
        selectAttendanceRoom,
        toggleAttendance,
        updateAbsentReason,
        exportAbsenteeReportExcel,
        renderExamSealing,
        selectSealingRoom,
        switchSealingMode,
        printSealingForms,
        getLiveAttendanceState: () => liveAttendanceState
    };
})();

// Link to Window
window.ExamUltimate = ExamUltimate;
