/**
 * PREMIUM MODULE 4: ROOM SEATING ARRANGEMENT & ANTI-CHEAT
 * Features visual drag-and-drop 4x6 grid, custom seats persistence, and same-class adjacent warning engine.
 */

(function() {
    "use strict";

    let activeRoomNumber = null;
    let dragSourceIndex = null;

    // Helper to get rooms
    function getRooms() {
        let list = (typeof window.generatedRooms !== 'undefined') ? window.generatedRooms : [];
        if (!list || list.length === 0) {
            if (typeof window.ProctorStore !== 'undefined' && typeof window.ProctorStore.getState === 'function') {
                list = window.ProctorStore.getState().rooms;
            }
        }
        return list || [];
    }

    // Initialize Seating Tab View
    function initSeatingChart() {
        populateRoomDropdown();
        
        // Auto reload active room if selected
        const dropdown = document.getElementById('seating-room-select-dropdown');
        if (dropdown && activeRoomNumber) {
            dropdown.value = activeRoomNumber;
            loadRoomSeatingChart(activeRoomNumber);
        } else {
            renderEmptyState();
        }
    }

    // Fill the room dropdown options
    function populateRoomDropdown() {
        const dropdown = document.getElementById('seating-room-select-dropdown');
        if (!dropdown) return;

        const rooms = getRooms();
        
        // Keep existing selection if possible
        const prevValue = dropdown.value;
        
        dropdown.innerHTML = '<option value="">-- Chọn phòng thi --</option>' + 
            rooms.map(r => `<option value="${r.number}">Phòng thi số ${r.number} (${r.students ? r.students.length : 0} TS)</option>`).join('');

        if (rooms.some(r => r.number === prevValue)) {
            dropdown.value = prevValue;
        }
    }

    // Empty state rendering
    function renderEmptyState() {
        const grid = document.getElementById('seating-grid-layout');
        if (grid) {
            grid.innerHTML = `<div class="col-span-4 text-center py-20 text-slate-500 italic text-sm">Vui lòng chọn một phòng thi từ danh mục bên trái để hiển thị sơ đồ.</div>`;
        }
        const headerLabel = document.getElementById('seating-room-label-header');
        if (headerLabel) headerLabel.textContent = "Vui lòng chọn phòng thi...";
        
        const conflictCard = document.getElementById('seating-conflict-card');
        if (conflictCard) conflictCard.classList.add('hidden');
    }

    // Load Room Seating Chart Layout
    function loadRoomSeatingChart(roomNumber) {
        if (!roomNumber) {
            activeRoomNumber = null;
            renderEmptyState();
            return;
        }

        activeRoomNumber = roomNumber;
        const rooms = getRooms();
        const room = rooms.find(r => r.number === roomNumber);

        if (!room) {
            renderEmptyState();
            return;
        }

        // Set room header label
        const headerLabel = document.getElementById('seating-room-label-header');
        if (headerLabel) {
            headerLabel.textContent = `PHÒNG THI SỐ ${room.number} | TỔNG SỐ: ${room.students ? room.students.length : 0} THÍ SINH`;
        }

        // Initialize seats if not present in window.roomSeats
        let seatsList = window.roomSeats[roomNumber];
        if (!seatsList) {
            // Fill initial list
            seatsList = room.students ? [...room.students] : [];
            while (seatsList.length < 24) {
                seatsList.push(null);
            }
            // Save state
            const updated = { ...window.roomSeats };
            updated[roomNumber] = seatsList;
            window.roomSeats = updated; // Sync IndexedDB
        }

        renderSeatingGrid(seatsList);
    }

    // Render Grid DOM Elements
    function renderSeatingGrid(seatsList) {
        const grid = document.getElementById('seating-grid-layout');
        if (!grid) return;

        // Perform Anti-Cheat Scan for same-class adjacent neighbors
        const conflicts = scanSeatingConflicts(seatsList);

        let html = "";
        for (let i = 0; i < 24; i++) {
            const student = seatsList[i];
            const seatNumber = (i + 1).toString().padStart(2, '0');
            const isConflicting = conflicts.indices.has(i);

            let contentHTML = "";
            let draggableAttr = "";
            let conflictClass = isConflicting ? "border-red-500 bg-red-950/20 text-red-100 shadow-lg shadow-red-500/20 animate-pulse" : "border-slate-800 bg-slate-950 text-slate-300";

            if (student) {
                draggableAttr = `draggable="true" ondragstart="handleSeatDragStart(event, ${i})"`;
                contentHTML = `
                    <div class="space-y-1 relative z-10 select-none">
                        <div class="text-[9px] font-black text-blue-400 tracking-wider font-mono">SBD: ${student.sbd || '---'}</div>
                        <div class="text-xs font-black text-slate-100 truncate" title="${student.hoten}">${student.hoten}</div>
                        <div class="flex justify-between items-center text-[10px] font-extrabold text-slate-400">
                            <span>Lớp: ${student.lop || '12'}</span>
                            <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[8px] font-black uppercase">TS</span>
                        </div>
                    </div>
                `;
            } else {
                contentHTML = `
                    <div class="py-3 text-center text-[10px] font-bold text-slate-600 uppercase select-none italic relative z-10">
                        Ghế trống
                    </div>
                `;
            }

            html += `
                <div class="border rounded-2xl p-3 relative overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing hover:border-blue-500 ${conflictClass}"
                     ${draggableAttr}
                     ondragover="handleSeatDragOver(event)"
                     ondrop="handleSeatDrop(event, ${i})">
                    <div class="absolute -right-3 -top-3 text-3xl font-black text-slate-900/40 select-none pointer-events-none font-mono">
                        ${seatNumber}
                    </div>
                    ${contentHTML}
                </div>
            `;
        }

        grid.innerHTML = html;

        // Render Conflict Warnings Card
        const conflictCard = document.getElementById('seating-conflict-card');
        const conflictMsgContainer = document.getElementById('seating-conflict-messages');

        if (conflictCard && conflictMsgContainer) {
            if (conflicts.messages.length > 0) {
                conflictCard.classList.remove('hidden');
                conflictMsgContainer.innerHTML = conflicts.messages.map(m => `
                    <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-1.5">
                        <i data-lucide="shield-alert" class="text-rose-600 flex-shrink-0 mt-0.5" style="width:14px"></i>
                        <span>${m}</span>
                    </div>
                `).join('');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                conflictCard.classList.add('hidden');
                conflictMsgContainer.innerHTML = "";
            }
        }
    }

    // Drag start handler
    function handleSeatDragStart(e, index) {
        dragSourceIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        // Set drag ghost image styling if needed
        e.dataTransfer.setData('text/plain', index);
    }

    // Drag over handler
    function handleSeatDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    // Drop swap handler
    function handleSeatDrop(e, targetIndex) {
        e.preventDefault();
        if (dragSourceIndex === null || dragSourceIndex === targetIndex) return;

        const roomNumber = activeRoomNumber;
        if (!roomNumber) return;

        const seatsList = [...window.roomSeats[roomNumber]];
        
        // Swap values
        const temp = seatsList[dragSourceIndex];
        seatsList[dragSourceIndex] = seatsList[targetIndex];
        seatsList[targetIndex] = temp;

        // Save and Sync IndexedDB
        const updated = { ...window.roomSeats };
        updated[roomNumber] = seatsList;
        window.roomSeats = updated; 

        // Reset state
        dragSourceIndex = null;

        // Re-render
        renderSeatingGrid(seatsList);

        if (typeof window.showAlert === 'function') {
            window.showAlert(`🔄 Đã đổi chỗ ngồi giữa Ghế ${dragSourceIndex + 1} và Ghế ${targetIndex + 1}!`, "info");
        }
    }

    // Anti-Cheat neighbor scan logic (Adjacent/Diagonal same class detection)
    function scanSeatingConflicts(seatsList) {
        const conflictingIndices = new Set();
        const warningMessages = [];

        // Grid details: 4 columns, 6 rows (24 total seats)
        const colsCount = 4;
        const rowsCount = 6;

        // 8-directional neighbor search
        const neighborDirections = [
            { dr: -1, dc: -1, label: "chéo trên-trái" },
            { dr: -1, dc: 0,  label: "phía trên" },
            { dr: -1, dc: 1,  label: "chéo trên-phải" },
            { dr: 0,  dc: -1, label: "bên trái" },
            { dr: 0,  dc: 1,  label: "bên phải" },
            { dr: 1,  dc: -1, label: "chéo dưới-trái" },
            { dr: 1,  dc: 0,  label: "phía dưới" },
            { dr: 1,  dc: 1,  label: "chéo dưới-phải" }
        ];

        for (let i = 0; i < 24; i++) {
            const studentA = seatsList[i];
            if (!studentA || !studentA.lop) continue;

            const r = Math.floor(i / colsCount);
            const c = i % colsCount;

            neighborDirections.forEach(dir => {
                const nr = r + dir.dr;
                const nc = c + dir.dc;

                if (nr >= 0 && nr < rowsCount && nc >= 0 && nc < colsCount) {
                    const ni = nr * colsCount + nc;
                    const studentB = seatsList[ni];

                    if (studentB && studentB.lop && studentA.sbd !== studentB.sbd) {
                        // Compare normalized class values
                        const classA = studentA.lop.trim().toLowerCase();
                        const classB = studentB.lop.trim().toLowerCase();

                        if (classA === classB) {
                            conflictingIndices.add(i);
                            conflictingIndices.add(ni);
                            
                            // Deduplicate warning messages (only record each pair once)
                            if (i < ni) {
                                warningMessages.push(
                                    `Ghế <b>${(i + 1).toString().padStart(2, '0')}</b> (${studentA.hoten}) và Ghế <b>${(ni + 1).toString().padStart(2, '0')}</b> (${studentB.hoten}) cùng học lớp <b>${studentA.lop}</b> ngồi sát cạnh nhau (${dir.label}).`
                                );
                            }
                        }
                    }
                }
            });
        }

        return {
            indices: conflictingIndices,
            messages: warningMessages
        };
    }

    // Expose functions globally
    window.initSeatingChart = initSeatingChart;
    window.loadRoomSeatingChart = loadRoomSeatingChart;
    window.handleSeatDragStart = handleSeatDragStart;
    window.handleSeatDragOver = handleSeatDragOver;
    window.handleSeatDrop = handleSeatDrop;

})();
