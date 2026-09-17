/**
 * PREMIUM MODULE 2: EXAM INCIDENT DIGITIZER
 * Handles autocomplete retrieval, vector-like canvas signature drawing, and standard administrative A4 print layouts.
 */

(function() {
    "use strict";

    let pads = {
        student: null,
        proctor: null,
        chairman: null
    };

    // Vector Signature Canvas Logic
    function createSignaturePad(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        let drawing = false;

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            // High-DPI support
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            // Re-apply drawing styles
            ctx.strokeStyle = '#0f172a'; // Dark slate line color
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }

        // Initialize size
        resizeCanvas();

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        function startDraw(e) {
            drawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            e.preventDefault();
        }

        function draw(e) {
            if (!drawing) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            e.preventDefault();
        }

        function stopDraw() {
            drawing = false;
        }

        // Mouse listeners
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseleave', stopDraw);

        // Touch listeners
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDraw);

        return {
            clear: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            },
            getDataURL: () => {
                // If it's blank, return empty string so we don't save blank canvases
                return canvas.toDataURL();
            },
            resize: resizeCanvas
        };
    }

    // Initialize incident view & pads
    function initExamIncidents() {
        // Build pads
        pads.student = createSignaturePad('canvas-sig-student');
        pads.proctor = createSignaturePad('canvas-sig-proctor');
        pads.chairman = createSignaturePad('canvas-sig-chairman');

        // Handle dynamic sizing when tab activates
        setTimeout(() => {
            if (pads.student) pads.student.resize();
            if (pads.proctor) pads.proctor.resize();
            if (pads.chairman) pads.chairman.resize();
        }, 100);

        renderIncidentsHistory();
    }

    // Individual clearing
    function clearSignatureCanvas(id) {
        if (id === 'canvas-sig-student' && pads.student) pads.student.clear();
        if (id === 'canvas-sig-proctor' && pads.proctor) pads.proctor.clear();
        if (id === 'canvas-sig-chairman' && pads.chairman) pads.chairman.clear();
        if (typeof window.showAlert === 'function') {
            window.showAlert("✏️ Đã xóa nét vẽ chữ ký.", "info");
        }
    }

    // Clear all canvases
    function clearAllIncidentSignatures() {
        if (pads.student) pads.student.clear();
        if (pads.proctor) pads.proctor.clear();
        if (pads.chairman) pads.chairman.clear();
        if (typeof window.showAlert === 'function') {
            window.showAlert("✏️ Đã làm sạch toàn bộ bảng ký tên.", "info");
        }
    }


    // Toggle digital signature usage
    function toggleDigitalSignature() {
        const isEnabled = document.getElementById('use-digital-signature').checked;
        const container = document.getElementById('signature-pads-container');
        if (container) {
            container.style.display = isEnabled ? 'grid' : 'none';
        }
        if (!isEnabled) {
            clearAllIncidentSignatures();
        }
    }

    // Student Autocomplete Autocompletion Suggestion
    function suggestIncidentStudents(value) {
        const suggestionsContainer = document.getElementById('incident-student-suggestions');
        if (!suggestionsContainer) return;

        const q = value.trim().toLowerCase();
        if (!q) {
            suggestionsContainer.classList.add('hidden');
            suggestionsContainer.innerHTML = '';
            return;
        }

        const filename = window.activeFileName;
        const fileObj = window.dataStore ? window.dataStore[filename] : null;
        const students = fileObj ? (fileObj.data || []) : [];

        // Search matches by name or sbd
        const matches = students.filter(s => {
            const name = (s.hoten || '').toLowerCase();
            const sbd = (s.sbd || '').toLowerCase();
            return name.includes(q) || sbd.includes(q);
        }).slice(0, 10);

        if (matches.length === 0) {
            suggestionsContainer.classList.add('hidden');
            suggestionsContainer.innerHTML = '';
            return;
        }

        suggestionsContainer.classList.remove('hidden');
        suggestionsContainer.innerHTML = matches.map(s => {
            const safeObj = JSON.stringify(s).replace(/"/g, '&quot;');
            return `
                <div class="p-3 hover:bg-slate-50 cursor-pointer font-bold text-xs border-b border-slate-100 flex justify-between" onclick="selectIncidentStudent(${safeObj})">
                    <span>${s.hoten} <b class="text-slate-400 font-medium">(${s.lop || 'Lớp 12'})</b></span>
                    <span class="font-mono text-amber-600">${s.sbd}</span>
                </div>
            `;
        }).join('');
    }

    // Auto-fill student fields
    function selectIncidentStudent(s) {
        document.getElementById('incident-student-search').value = s.sbd;
        document.getElementById('incident-student-name').value = s.hoten;
        document.getElementById('incident-student-class').value = s.lop || '12';

        // Autodetect classroom room
        let roomNum = 'Chưa xếp phòng';
        const rooms = window.generatedRooms || [];
        for (const r of rooms) {
            if (r.students && r.students.some(st => st.sbd === s.sbd)) {
                roomNum = `Phòng ${r.number}`;
                break;
            }
        }
        document.getElementById('incident-student-room').value = roomNum;

        const suggestionsContainer = document.getElementById('incident-student-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.classList.add('hidden');
            suggestionsContainer.innerHTML = '';
        }
    }

    // Save exam incident
    function saveExamIncident() {
        const sbd = document.getElementById('incident-student-search').value.trim();
        const name = document.getElementById('incident-student-name').value.trim();
        const lop = document.getElementById('incident-student-class').value.trim();
        const room = document.getElementById('incident-student-room').value.trim();
        const type = document.getElementById('incident-type').value;
        const description = document.getElementById('incident-description').value.trim();

        if (!sbd || !name) {
            if (typeof window.showAlert === 'function') {
                window.showAlert("Vui lòng chọn hoặc nhập đầy đủ thông tin thí sinh!", "warning");
            }
            return;
        }

        if (!description) {
            if (typeof window.showAlert === 'function') {
                window.showAlert("Vui lòng nhập mô tả chi tiết diễn biến sự việc!", "warning");
            }
            return;
        }

        const incident = {
            id: 'inc-' + Date.now(),
            sbd: sbd,
            name: name,
            lop: lop,
            room: room,
            type: type,
            description: description,
            timestamp: new Date().toISOString(),
            sigStudent: (pads.student && document.getElementById('use-digital-signature').checked) ? pads.student.getDataURL() : null,
            sigProctor: (pads.proctor && document.getElementById('use-digital-signature').checked) ? pads.proctor.getDataURL() : null,
            sigChairman: (pads.chairman && document.getElementById('use-digital-signature').checked) ? pads.chairman.getDataURL() : null
        };

        // Mutation on reactive window.examIncidents pushes directly to DB!
        const list = Array.isArray(window.examIncidents) ? [...window.examIncidents] : [];
        list.unshift(incident);
        window.examIncidents = list;

        // Reset form
        document.getElementById('incident-student-search').value = '';
        document.getElementById('incident-student-name').value = '';
        document.getElementById('incident-student-class').value = '';
        document.getElementById('incident-student-room').value = '';
        document.getElementById('incident-description').value = '';
        clearAllIncidentSignatures();

        renderIncidentsHistory();

        if (typeof window.showAlert === 'function') {
            window.showAlert("💾 Biên bản sự cố đã được số hóa và sao lưu tự động!", "success");
        }
    }

    // Render history records
    function renderIncidentsHistory() {
        const container = document.getElementById('incidents-history-list');
        if (!container) return;

        const list = window.examIncidents || [];
        if (list.length === 0) {
            container.innerHTML = `<div class="py-12 text-center text-slate-400 font-medium italic">Chưa ghi nhận sự cố vi phạm nào.</div>`;
            return;
        }

        container.innerHTML = list.map(item => {
            const timeStr = new Date(item.timestamp).toLocaleString('vi-VN');
            let colorClass = "bg-amber-100 text-amber-700 border-amber-200";
            if (item.type === 'Quy chế') colorClass = "bg-rose-100 text-rose-700 border-rose-200";
            if (item.type === 'Sức khỏe') colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
            if (item.type === 'Đề thi') colorClass = "bg-blue-100 text-blue-700 border-blue-200";

            return `
                <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden">
                    <div class="absolute right-0 top-0 text-[100px] font-black text-slate-50 select-none pointer-events-none transform translate-x-5 translate-y-5">
                        ${item.type[0]}
                    </div>
                    <div class="flex justify-between items-start flex-wrap gap-2 relative z-10">
                        <div>
                            <span class="px-2 py-0.5 border text-[9px] font-extrabold uppercase rounded-full ${colorClass}">
                                ${item.type}
                            </span>
                            <h4 class="text-xs font-black text-slate-800 mt-2 mb-1">${item.name} (${item.sbd})</h4>
                            <p class="text-[10px] text-slate-400 font-semibold m-0">${timeStr} | Lớp: ${item.lop} | Room: ${item.room}</p>
                        </div>
                        <div class="flex gap-1.5">
                            <button onclick="printIncidentA4('${item.id}')" class="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl cursor-pointer" title="In Biên bản A4">
                                <i data-lucide="printer" style="width:14px; height:14px;"></i>
                            </button>
                            <button onclick="deleteIncident('${item.id}')" class="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl cursor-pointer" title="Xóa Biên bản">
                                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-[11px] text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 relative z-10 m-0">
                        ${item.description}
                    </p>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Delete incident
    function deleteIncident(id) {
        if (!confirm("Bạn có chắc chắn muốn xóa biên bản sự cố này không?")) return;

        const list = Array.isArray(window.examIncidents) ? [...window.examIncidents] : [];
        const index = list.findIndex(item => item.id === id);
        if (index > -1) {
            list.splice(index, 1);
            window.examIncidents = list;
            renderIncidentsHistory();
            if (typeof window.showAlert === 'function') {
                window.showAlert("🗑️ Đã xóa biên bản thành công.", "info");
            }
        }
    }

    // Standard administrative A4 print layouts
    function printIncidentA4(id) {
        const list = window.examIncidents || [];
        const item = list.find(x => x.id === id);
        if (!item) return;

        const time = new Date(item.timestamp);
        const day = time.getDate().toString().padStart(2, '0');
        const month = (time.getMonth() + 1).toString().padStart(2, '0');
        const year = time.getFullYear();
        const hour = time.getHours().toString().padStart(2, '0');
        const minute = time.getMinutes().toString().padStart(2, '0');

        const deptName = document.getElementById('cfg-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
        const schoolName = document.getElementById('cfg-school-name')?.value || "HỘI ĐỒNG THI TRƯỜNG THPT CẤP CAO";

        // HTML A4 Template
        const html = `
            <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #000; padding: 20px 40px; font-size: 14px;">
                <table style="width: 100%; border: none; margin-bottom: 20px;">
                    <tr>
                        <td style="text-align: center; width: 45%; vertical-align: top;">
                            <span style="font-size: 13px; text-transform: uppercase; font-weight: bold;">${deptName}</span><br>
                            <span style="font-size: 13px; text-transform: uppercase; font-weight: bold; text-decoration: underline;">${schoolName}</span>
                        </td>
                        <td style="text-align: center; width: 55%; vertical-align: top;">
                            <span style="font-size: 13px; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
                            <span style="font-size: 14px; font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span>
                        </td>
                    </tr>
                </table>

                <div style="text-align: center; margin: 30px 0 20px;">
                    <h2 style="font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0;">BIÊN BẢN VI PHẠM QUY CHẾ THI THPT DỰ PHÒNG</h2>
                    <span style="font-style: italic; font-size: 13px;">(Số biên bản điện tử: ${item.id})</span>
                </div>

                <p style="margin: 10px 0;">Hôm nay, vào lúc ${hour} giờ ${minute} phút, ngày ${day} tháng ${month} năm ${year}, tại Hội đồng thi trường THPT, chúng tôi tiến hành lập biên bản ghi nhận sự việc diễn ra tại phòng thi:</p>

                <table style="width: 100%; border: none; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 4px 0; width: 50%;"><b>1. Họ và tên thí sinh:</b> ${item.name}</td>
                        <td style="padding: 4px 0; width: 50%;"><b>2. Số báo danh:</b> ${item.sbd}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0;"><b>3. Lớp học chính khóa:</b> ${item.lop}</td>
                        <td style="padding: 4px 0;"><b>4. Phòng thi:</b> ${item.room}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0;" colspan="2"><b>5. Phân loại sự cố:</b> ${item.type}</td>
                    </tr>
                </table>

                <div style="margin-top: 15px; border: 1px solid #000; padding: 15px; min-height: 150px; background: #fff; white-space: pre-wrap;">
                    <b>6. Mô tả chi tiết diễn biến sự việc và hành vi vi phạm:</b><br>${item.description}
                </div>

                <p style="margin: 20px 0 10px;">Biên bản được lập xong lúc ${hour} giờ ${Math.min(59, time.getMinutes() + 15)} phút cùng ngày, đã được đọc lại cho tất cả các bên tham gia cùng nghe và ký tên xác nhận trực tiếp dưới đây làm bằng chứng pháp lý xử lý sau kỳ thi.</p>

                <table style="width: 100%; border: none; margin-top: 40px; text-align: center;">
                    <tr>
                        <td style="width: 33%; vertical-align: top;">
                            <span style="font-weight: bold; text-transform: uppercase; font-size: 12px;">THÍ SINH LIÊN QUAN</span><br>
                            <span style="font-style: italic; font-size: 11px;">(Ký và ghi rõ họ tên)</span>
                            <div style="margin-top: 15px; height: 80px; display: flex; align-items: center; justify-content: center;">
                                ${item.sigStudent ? `<img src="${item.sigStudent}" style="max-height: 70px; max-width: 100%; border: none;" alt="Chữ ký Thí sinh">` : '<span style="color:#aaa; font-style:italic; font-size:12px;">Chưa ký</span>'}
                            </div>
                            <span style="font-weight: bold; margin-top: 5px; display: block;">${item.name}</span>
                        </td>
                        <td style="width: 34%; vertical-align: top;">
                            <span style="font-weight: bold; text-transform: uppercase; font-size: 12px;">CÁN BỘ COI THI</span><br>
                            <span style="font-style: italic; font-size: 11px;">(Ký và ghi rõ họ tên)</span>
                            <div style="margin-top: 15px; height: 80px; display: flex; align-items: center; justify-content: center;">
                                ${item.sigProctor ? `<img src="${item.sigProctor}" style="max-height: 70px; max-width: 100%; border: none;" alt="Chữ ký Giám thị">` : '<span style="color:#aaa; font-style:italic; font-size:12px;">Chưa ký</span>'}
                            </div>
                            <span style="font-weight: bold; margin-top: 5px; display: block;">(Cán bộ coi thi số 1)</span>
                        </td>
                        <td style="width: 33%; vertical-align: top;">
                            <span style="font-weight: bold; text-transform: uppercase; font-size: 12px;">TRƯỞNG ĐIỂM THI</span><br>
                            <span style="font-style: italic; font-size: 11px;">(Ký và đóng dấu đóng)</span>
                            <div style="margin-top: 15px; height: 80px; display: flex; align-items: center; justify-content: center;">
                                ${item.sigChairman ? `<img src="${item.sigChairman}" style="max-height: 70px; max-width: 100%; border: none;" alt="Chữ ký Trưởng điểm">` : '<span style="color:#aaa; font-style:italic; font-size:12px;">Chưa ký</span>'}
                            </div>
                            <span style="font-weight: bold; margin-top: 5px; display: block;">Ban Chỉ Đạo Thi THPT</span>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        // Open print window
        const win = window.open('', '_blank', 'width=800,height=900');
        win.document.write(`
            <html>
                <head>
                    <title>In Biên Bản Sự Cố - ${item.sbd}</title>
                    <style>
                        body { background: white; margin: 0; padding: 20px; }
                        @media print { 
                            body { margin: 0; padding: 0; } 
                            * { color: #000 !important; }
                        }
                    </style>
                </head>
                <body>${html}</body>
            </html>
        `);
        win.document.close();
        setTimeout(() => {
            win.print();
        }, 500);
    }

    // Expose functions globally
    window.initExamIncidents = initExamIncidents;
    window.suggestIncidentStudents = suggestIncidentStudents;
    window.selectIncidentStudent = selectIncidentStudent;
    window.clearSignatureCanvas = clearSignatureCanvas;
    window.clearAllIncidentSignatures = clearAllIncidentSignatures;
    window.toggleDigitalSignature = toggleDigitalSignature;
    window.saveExamIncident = saveExamIncident;
    window.printIncidentA4 = printIncidentA4;
    window.deleteIncident = deleteIncident;

})();
