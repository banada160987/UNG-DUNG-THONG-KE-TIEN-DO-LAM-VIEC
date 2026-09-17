import sys

with open('zalo_hub.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update the tabs in getModalHTML
tab_html_old = """            <div class="flex border-b bg-slate-50/50 p-2 gap-2" style="border-color: #e2e8f0;">
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('contacts')" style="border:none; cursor:pointer; transition: all 0.2s;">
                    <i data-lucide="book-open" style="width:18px"></i> Danh Bạ & Nhóm
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'errors' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('errors')" style="border:none; cursor:pointer; transition: all 0.2s;">
                    <i data-lucide="alert-triangle" style="width:18px"></i> Báo Lỗi Hồ Sơ
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'proctor' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('proctor')" style="border:none; cursor:pointer; transition: all 0.2s;">
                    <i data-lucide="calendar" style="width:18px"></i> Lịch Gác Thi
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('bulk')" style="border:none; cursor:pointer; transition: all 0.2s;">
                    <i data-lucide="send" style="width:18px"></i> Hàng Đợi Bulk (${bulkQueue.length})
                </button>
            </div>"""

tab_html_new = """            <div class="flex border-b bg-slate-50/50 p-2 gap-2 flex-wrap" style="border-color: #e2e8f0;">
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('contacts')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="book-open" style="width:18px"></i> Danh Bạ
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'media' ? 'bg-white shadow-md text-purple-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('media')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="image" style="width:18px"></i> Gửi Ảnh (Media)
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'errors' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('errors')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="alert-triangle" style="width:18px"></i> Báo Lỗi
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'proctor' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('proctor')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="calendar" style="width:18px"></i> Gác Thi
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('bulk')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="send" style="width:18px"></i> Hàng Đợi (${bulkQueue.length})
                </button>
            </div>"""

text = text.replace(tab_html_old, tab_html_new)


# 2. Update switchTab
switch_old = """    const switchTab = (tab) => {
        activeTab = tab;
        // Update tab button styles
        const btns = document.querySelectorAll('.zalo-tab-btn');
        btns[0].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`;
        btns[1].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'errors' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`;
        btns[2].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'proctor' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`;
        btns[3].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`;
        
        renderTabContent();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };"""

switch_new = """    const switchTab = (tab) => {
        activeTab = tab;
        const btns = document.querySelectorAll('.zalo-tab-btn');
        if (btns.length >= 5) {
            btns[0].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
            btns[1].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'media' ? 'bg-white shadow-md text-purple-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
            btns[2].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'errors' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
            btns[3].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'proctor' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
            btns[4].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
        }
        renderTabContent();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };"""

text = text.replace(switch_old, switch_new)


# 3. Update renderTabContent
render_old = """        if (activeTab === 'contacts') c.innerHTML = getContactsTabHTML();
        else if (activeTab === 'errors') c.innerHTML = getErrorsTabHTML(autoParam);
        else if (activeTab === 'proctor') c.innerHTML = getProctorTabHTML(autoParam);
        else if (activeTab === 'bulk') c.innerHTML = getBulkTabHTML();

        if (activeTab === 'errors') setupErrorsListeners(autoParam);
        if (activeTab === 'proctor') setupProctorListeners(autoParam);
        if (typeof lucide !== 'undefined') lucide.createIcons();"""

render_new = """        if (activeTab === 'contacts') c.innerHTML = getContactsTabHTML();
        else if (activeTab === 'media') c.innerHTML = getMediaTabHTML();
        else if (activeTab === 'errors') c.innerHTML = getErrorsTabHTML(autoParam);
        else if (activeTab === 'proctor') c.innerHTML = getProctorTabHTML(autoParam);
        else if (activeTab === 'bulk') c.innerHTML = getBulkTabHTML();

        if (activeTab === 'errors') setupErrorsListeners(autoParam);
        if (activeTab === 'proctor') setupProctorListeners(autoParam);
        if (activeTab === 'media') setupMediaListeners();
        if (typeof lucide !== 'undefined') lucide.createIcons();"""

text = text.replace(render_old, render_new)


# 4. Insert the huge Media Engine before "    // --- PUBLIC EXPORTS ---"
media_engine = """
    // ==========================================
    // MEDIA BROADCAST ENGINE (0 VND ZALO)
    // ==========================================
    let mediaState = {
        template: 'score', // 'score' or 'cert'
        selectedClass: '',
        students: [],
        currentIndex: 0,
        queue: [], // For bulk
        canvas: null
    };

    const getMediaTabHTML = () => {
        let classList = [];
        let lopKey = null;
        if (typeof activeFileName !== 'undefined' && dataStore[activeFileName] && dataStore[activeFileName].mapping) {
            lopKey = dataStore[activeFileName].mapping.lop;
            if (lopKey && typeof excelData !== 'undefined') {
                const classes = new Set();
                excelData.forEach(r => {
                    if (r[lopKey]) classes.add(typeof normalizeClass === 'function' ? normalizeClass(r[lopKey]) : r[lopKey].toString().trim().toUpperCase());
                });
                classList = Array.from(classes).sort();
            }
        }

        if (classList.length === 0) {
            return `<div class="p-12 text-center text-slate-400 italic">⚠️ Chưa có dữ liệu Lớp/Học sinh. Vui lòng tải lên File Excel Danh sách hoặc Hồ sơ thi trước!</div>`;
        }

        if (!mediaState.selectedClass) mediaState.selectedClass = classList[0];

        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- CỘT TRÁI: DANH SÁCH LỚP -->
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm max-h-96 flex flex-col">
                    <div class="text-xs font-bold text-slate-500 mb-3">CHỌN LỚP & HỌC SINH</div>
                    
                    <select class="form-control mb-3 rounded-xl border-slate-300 font-bold text-blue-600 bg-white" onchange="ZaloHub.mediaSelectClass(this.value)">
                        ${classList.map(c => `<option value="${c}" ${c === mediaState.selectedClass ? 'selected' : ''}>Lớp ${c}</option>`).join('')}
                    </select>

                    <div class="flex-1 overflow-y-auto space-y-2 pr-1" id="media-student-list">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- CỘT PHẢI: PREVIEW & ACTION -->
                <div class="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <div class="flex w-full justify-between items-center mb-4">
                        <select class="form-control rounded-xl border-slate-300 font-bold text-purple-600 bg-purple-50" onchange="ZaloHub.mediaSelectTemplate(this.value)" style="width: auto;">
                            <option value="score" ${mediaState.template === 'score' ? 'selected' : ''}>🎨 Mẫu: Phiếu Điểm Cá Nhân</option>
                            <option value="cert" ${mediaState.template === 'cert' ? 'selected' : ''}>🎨 Mẫu: Giấy Khen Sang Trọng</option>
                        </select>
                        <button class="btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-purple-500/30" onclick="ZaloHub.startMediaQueue()">
                            <i data-lucide="play" style="width:16px"></i> Gửi Toàn Lớp (${mediaState.selectedClass})
                        </button>
                    </div>

                    <!-- CANVAS RENDERER -->
                    <div class="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex justify-center items-center w-full relative overflow-hidden" style="min-height: 300px; background: repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px);">
                        <canvas id="media-canvas" class="max-w-full rounded shadow-md" style="height: auto; max-height: 400px;"></canvas>
                        
                        <!-- Lớp Overlay gửi tự động -->
                        <div id="media-queue-overlay" class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white hidden z-10 rounded-xl">
                            <h3 class="text-xl font-bold mb-2">Đang gửi: <span id="mq-student-name" class="text-yellow-400">Nguyễn Văn A</span></h3>
                            <p class="text-sm text-slate-300 mb-6">Trạng thái: <span id="mq-status" class="font-mono bg-slate-800 px-2 py-1 rounded">Chờ thao tác...</span></p>
                            
                            <div class="bg-white/10 p-4 rounded-xl border border-white/20 max-w-sm text-center mb-6">
                                <p class="text-sm mb-2 font-bold text-emerald-400">💡 HƯỚNG DẪN DÁN ẢNH (0 ĐỒNG)</p>
                                <p class="text-xs mb-1">1. Hệ thống đã copy ảnh vào bộ nhớ và tự bật Zalo.</p>
                                <p class="text-xs mb-1">2. Bạn chỉ cần nhấn <kbd class="bg-slate-800 px-1 rounded">Ctrl</kbd> + <kbd class="bg-slate-800 px-1 rounded">V</kbd> vào ô chat Zalo rồi nhấn Enter.</p>
                                <p class="text-xs text-yellow-300">3. Quay lại đây bấm "Tiếp Tục".</p>
                            </div>

                            <div class="flex gap-4">
                                <button class="btn bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-xl" onclick="ZaloHub.stopMediaQueue()">Dừng Lại</button>
                                <button class="btn bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-8 rounded-xl shadow-lg shadow-emerald-500/50" onclick="ZaloHub.nextMediaQueue()">Tiếp Tục <i data-lucide="arrow-right" class="inline" style="width:16px"></i></button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex w-full justify-center">
                        <button class="btn btn-outline py-2 px-4 rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100 flex items-center gap-2 text-sm" onclick="ZaloHub.copyCurrentMedia()">
                            <i data-lucide="copy" style="width:16px"></i> Copy Ảnh Hiện Tại
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    const setupMediaListeners = () => {
        mediaSelectClass(mediaState.selectedClass);
    };

    const mediaSelectClass = (cls) => {
        mediaState.selectedClass = cls;
        if (!cls) return;

        let lopKey = null, nameKey = null, sbdKey = null, phoneKey = null;
        if (typeof activeFileName !== 'undefined' && dataStore[activeFileName] && dataStore[activeFileName].mapping) {
            const map = dataStore[activeFileName].mapping;
            lopKey = map.lop; nameKey = map.ho_ten; sbdKey = map.sbd; phoneKey = map.dien_thoai;
        }

        mediaState.students = [];
        if (lopKey && nameKey && typeof excelData !== 'undefined') {
            excelData.forEach(r => {
                const cName = typeof normalizeClass === 'function' ? normalizeClass(r[lopKey]) : r[lopKey].toString().trim().toUpperCase();
                if (cName === cls) {
                    mediaState.students.push({
                        name: r[nameKey],
                        sbd: sbdKey ? r[sbdKey] : '',
                        phone: phoneKey ? r[phoneKey] : '',
                        raw: r
                    });
                }
            });
        }

        // Sort by name
        mediaState.students.sort((a, b) => {
            const getFirstName = n => n ? n.split(' ').pop() : '';
            return getFirstName(a.name).localeCompare(getFirstName(b.name), 'vi');
        });

        const listEl = document.getElementById('media-student-list');
        if (listEl) {
            listEl.innerHTML = mediaState.students.map((s, idx) => `
                <div class="p-2 rounded-lg cursor-pointer border transition-all ${idx === mediaState.currentIndex ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-md' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'}" onclick="ZaloHub.mediaSelectStudent(${idx})">
                    <div class="text-sm">${idx + 1}. ${escapeHTML(s.name)}</div>
                    ${s.phone ? `<div class="text-[10px] opacity-80"><i data-lucide="phone" class="inline" style="width:10px"></i> ${s.phone}</div>` : `<div class="text-[10px] text-amber-500">Thiếu SĐT (Sẽ gửi GVCN)</div>`}
                </div>
            `).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        mediaSelectStudent(0);
    };

    const mediaSelectStudent = (idx) => {
        if (idx < 0 || idx >= mediaState.students.length) return;
        mediaState.currentIndex = idx;
        
        // Update UI
        const listEl = document.getElementById('media-student-list');
        if (listEl) {
            Array.from(listEl.children).forEach((el, i) => {
                if (i === idx) el.className = 'p-2 rounded-lg cursor-pointer border transition-all bg-purple-600 text-white font-bold border-purple-600 shadow-md';
                else el.className = 'p-2 rounded-lg cursor-pointer border transition-all bg-white hover:bg-slate-100 text-slate-700 border-slate-200';
            });
        }

        renderMediaCanvas();
    };

    const mediaSelectTemplate = (tpl) => {
        mediaState.template = tpl;
        renderMediaCanvas();
    };

    const renderMediaCanvas = () => {
        const canvas = document.getElementById('media-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const student = mediaState.students[mediaState.currentIndex];
        if (!student) return;

        // High resolution setup (1200x800 for Cert, 800x1000 for Score)
        if (mediaState.template === 'cert') {
            canvas.width = 1200; canvas.height = 800;
            drawCertificate(ctx, canvas.width, canvas.height, student);
        } else {
            canvas.width = 800; canvas.height = 1000;
            drawScoreSheet(ctx, canvas.width, canvas.height, student);
        }
    };

    const drawCertificate = (ctx, w, h, student) => {
        // Background
        ctx.fillStyle = '#fffdf5'; // slight yellow tint
        ctx.fillRect(0, 0, w, h);
        
        // Outer Border
        ctx.strokeStyle = '#c49a45'; // Gold
        ctx.lineWidth = 20;
        ctx.strokeRect(30, 30, w-60, h-60);
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 60, w-120, h-120);

        // Header
        ctx.fillStyle = '#b81d13';
        ctx.font = 'bold 36px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', w/2, 140);
        ctx.font = 'bold 28px "Times New Roman"';
        ctx.fillText('Độc lập - Tự do - Hạnh phúc', w/2, 185);

        ctx.fillStyle = '#c49a45';
        ctx.font = 'bold 70px "Times New Roman"';
        ctx.fillText('GIẤY KHEN', w/2, 320);

        // Content
        ctx.fillStyle = '#1e293b';
        ctx.font = 'italic 32px "Times New Roman"';
        ctx.fillText('Khen tặng sinh viên / học sinh:', w/2, 400);

        ctx.fillStyle = '#b81d13';
        ctx.font = 'bold 55px "Times New Roman"';
        ctx.fillText((student.name || '').toUpperCase(), w/2, 480);

        ctx.fillStyle = '#1e293b';
        ctx.font = '30px "Times New Roman"';
        ctx.fillText(`Lớp: ${mediaState.selectedClass}   -   Khóa học: 2025 - 2026`, w/2, 550);
        
        ctx.font = 'italic 30px "Times New Roman"';
        ctx.fillText('Vì đã có thành tích xuất sắc trong học tập và rèn luyện.', w/2, 620);

        // Footer Sign
        ctx.font = 'italic 24px "Times New Roman"';
        ctx.fillText(`Ngày ${new Date().getDate()} tháng ${new Date().getMonth()+1} năm ${new Date().getFullYear()}`, w - 250, 680);
        ctx.font = 'bold 28px "Times New Roman"';
        ctx.fillText('HIỆU TRƯỞNG', w - 250, 720);
        
        // Fake Stamp & Sign
        ctx.save();
        ctx.translate(w - 250, 740);
        ctx.rotate(-0.1);
        ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
        ctx.font = '40px "Brush Script MT", cursive';
        ctx.fillText('Đã ký', 0, 0);
        ctx.beginPath();
        ctx.arc(-50, -10, 45, 0, Math.PI*2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)';
        ctx.stroke();
        ctx.restore();
    };

    const drawScoreSheet = (ctx, w, h, student) => {
        // Extract scores if available
        let scores = {};
        const sData = student.raw;
        // Try to guess score columns based on keys (Toan, Van, Anh, or score mappings)
        Object.keys(sData).forEach(k => {
            const kl = k.toLowerCase();
            if (kl.includes('toan') || kl.includes('toán') || kl === 't' || kl.includes('toan_')) scores['Toán'] = sData[k];
            else if (kl.includes('van') || kl.includes('văn') || kl === 'v' || kl.includes('van_')) scores['Ngữ Văn'] = sData[k];
            else if (kl.includes('anh') || kl.includes('ngoai_ngu') || kl === 'nn') scores['Tiếng Anh'] = sData[k];
            else if (kl.includes('ly') || kl.includes('lý') || kl === 'l') scores['Vật Lý'] = sData[k];
            else if (kl.includes('hoa') || kl.includes('hóa') || kl === 'h') scores['Hóa Học'] = sData[k];
            else if (kl.includes('sinh') || kl === 's') scores['Sinh Học'] = sData[k];
            else if (kl.includes('su') || kl.includes('sử')) scores['Lịch Sử'] = sData[k];
            else if (kl.includes('dia') || kl.includes('địa')) scores['Địa Lý'] = sData[k];
            else if (kl.includes('gdcd') || kl === 'cd') scores['GDCD'] = sData[k];
        });

        // Background
        ctx.fillStyle = '#f0f9ff'; // sky-50
        ctx.fillRect(0, 0, w, h);

        // Header Shape
        ctx.fillStyle = '#0284c7'; // sky-600
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, 200);
        ctx.bezierCurveTo(w/2, 280, w/2, 280, 0, 200);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 45px Arial';
        ctx.fillText('PHIẾU ĐIỂM CÁ NHÂN', w/2, 90);
        ctx.font = '24px Arial';
        ctx.fillText(`Kỳ Thi Đánh Giá Năng Lực 2026`, w/2, 140);

        // Student Info Card
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = "rgba(0,0,0,0.1)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
        ctx.beginPath();
        ctx.roundRect(50, 220, w-100, 160, 20);
        ctx.fill();
        ctx.shadowColor = "transparent";

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.font = 'bold 36px Arial';
        ctx.fillText((student.name || 'HỌC SINH').toUpperCase(), 90, 280);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#475569';
        ctx.fillText(`Lớp: ${mediaState.selectedClass}  |  SBD: ${student.sbd || 'N/A'}`, 90, 330);

        // Scores
        let currentY = 450;
        const keys = Object.keys(scores);
        if (keys.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('(Chưa có dữ liệu điểm chi tiết trong file Excel)', w/2, 600);
        } else {
            ctx.fillStyle = '#0284c7';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('BẢNG ĐIỂM CHI TIẾT', 50, 420);

            keys.forEach((subj, i) => {
                const score = parseFloat(scores[subj]) || 0;
                // Draw bar background
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath(); ctx.roundRect(250, currentY - 25, 450, 30, 15); ctx.fill();
                // Draw bar value
                const barWidth = Math.max(20, (score / 10) * 450);
                let barColor = score >= 8 ? '#10b981' : (score >= 5 ? '#3b82f6' : '#ef4444');
                ctx.fillStyle = barColor;
                ctx.beginPath(); ctx.roundRect(250, currentY - 25, barWidth, 30, 15); ctx.fill();

                // Text
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'left';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(subj, 50, currentY);

                // Score text
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'right';
                ctx.font = 'bold 20px Arial';
                if (barWidth > 40) ctx.fillText(score.toString(), 250 + barWidth - 10, currentY - 3);
                else {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillText(score.toString(), 250 + barWidth + 35, currentY - 3);
                }

                currentY += 60;
            });

            // Calculate total or avg
            const total = keys.reduce((acc, k) => acc + (parseFloat(scores[k]) || 0), 0);
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'right';
            ctx.font = 'bold 30px Arial';
            ctx.fillText(`TỔNG ĐIỂM: ${total.toFixed(2)}`, 700, currentY + 40);
        }

        // Footer
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.font = '18px Arial';
        ctx.fillText('Vui lòng phản hồi tin nhắn này nếu có thắc mắc. Trân trọng!', w/2, h - 40);
    };

    const copyCurrentMedia = async () => {
        const canvas = document.getElementById('media-canvas');
        if (!canvas) return;
        try {
            canvas.toBlob(async (blob) => {
                if (navigator.clipboard && window.ClipboardItem) {
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        if (typeof showAlert === 'function') showAlert('✅ Đã copy ảnh vào Bộ nhớ tạm. Vui lòng Ctrl+V vào Zalo!', 'success');
                    } catch(e) {
                        console.warn(e);
                        fallbackMediaCopy();
                    }
                } else {
                    fallbackMediaCopy();
                }
            }, 'image/png');
        } catch(e) {
            console.warn("Media copy failed", e);
        }
    };

    const fallbackMediaCopy = () => {
        if (typeof showAlert === 'function') showAlert('Trình duyệt không hỗ trợ copy ảnh trực tiếp. Vui lòng chuột phải vào ảnh > "Sao chép hình ảnh".', 'warning');
    };

    // --- Media Queue Logic ---
    const startMediaQueue = () => {
        if (mediaState.students.length === 0) return;
        mediaState.queue = [...mediaState.students];
        const overlay = document.getElementById('media-queue-overlay');
        if (overlay) overlay.classList.remove('hidden');
        processNextMedia();
    };

    const processNextMedia = async () => {
        if (mediaState.queue.length === 0) {
            stopMediaQueue();
            if (typeof showAlert === 'function') showAlert('🎉 Đã gửi xong toàn bộ danh sách lớp!', 'success');
            return;
        }

        const student = mediaState.queue[0];
        const origIdx = mediaState.students.findIndex(s => s === student);
        if (origIdx >= 0) {
            mediaState.currentIndex = origIdx;
            renderMediaCanvas();
        }

        document.getElementById('mq-student-name').innerText = student.name;
        document.getElementById('mq-status').innerText = "Đang copy ảnh...";

        // Copy to clipboard
        const canvas = document.getElementById('media-canvas');
        canvas.toBlob(async (blob) => {
            let copied = false;
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    copied = true;
                } catch(e) { console.warn(e); }
            }
            
            if (copied) {
                document.getElementById('mq-status').innerText = "Đã copy! Đang mở Zalo...";
                // Determine destination
                let dest = student.phone ? student.phone.replace(/[^0-9]/g, '') : contacts.classes[mediaState.selectedClass];
                if (!dest) {
                    document.getElementById('mq-status').innerText = "⚠️ Lỗi: Không có SĐT HS & GVCN";
                    return; // Wait for manual override
                }
                
                setTimeout(() => {
                    // Try desktop protocol
                    window.location.href = `zalo://conversation?phone=${dest}`;
                    setTimeout(() => {
                        if (document.hasFocus()) window.open(`https://zalo.me/${dest}`, '_blank');
                    }, 600);
                }, 500);

            } else {
                document.getElementById('mq-status').innerText = "⚠️ Trình duyệt chặn Copy. Hãy Copy tay!";
            }
        }, 'image/png');
    };

    const nextMediaQueue = () => {
        mediaState.queue.shift(); // remove current
        processNextMedia();
    };

    const stopMediaQueue = () => {
        mediaState.queue = [];
        const overlay = document.getElementById('media-queue-overlay');
        if (overlay) overlay.classList.add('hidden');
    };

"""

text = text.replace('    // --- PUBLIC EXPORTS ---', media_engine + '\n    // --- PUBLIC EXPORTS ---')

export_old = """    // --- PUBLIC EXPORTS ---
    return {
        openModal,
        closeModal,
        switchTab,
        updateClassPhone,
        updateGroupLink,
        selectErrorTarget,
        copyPreviewText,
        dispatchCurrentErrorTarget,
        queueAllErrors,
        selectProctorTarget,
        promptProctorPhone,
        copyProctorPreviewText,
        dispatchCurrentProctorTarget,
        queueAllProctors,
        toggleBulkSend,
        sendNextBulkItem,
        resetBulkQueue,
        setBulkQueue,
        attachAssignmentsToProctors,
        getResolvedProctorList
    };"""

export_new = """    // --- PUBLIC EXPORTS ---
    return {
        openModal,
        closeModal,
        switchTab,
        updateClassPhone,
        updateGroupLink,
        selectErrorTarget,
        copyPreviewText,
        dispatchCurrentErrorTarget,
        queueAllErrors,
        selectProctorTarget,
        promptProctorPhone,
        copyProctorPreviewText,
        dispatchCurrentProctorTarget,
        queueAllProctors,
        toggleBulkSend,
        sendNextBulkItem,
        resetBulkQueue,
        setBulkQueue,
        attachAssignmentsToProctors,
        getResolvedProctorList,
        mediaSelectClass,
        mediaSelectStudent,
        mediaSelectTemplate,
        startMediaQueue,
        nextMediaQueue,
        stopMediaQueue,
        copyCurrentMedia
    };"""

text = text.replace(export_old, export_new)

with open('zalo_hub.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch applied successfully.")
