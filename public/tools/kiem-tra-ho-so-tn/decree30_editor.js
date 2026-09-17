const Decree30Editor = (() => {
    let currentMode = 'giay_gioi_thieu';

    const init = () => {
        const container = document.getElementById('view-decree30-editor');
        if (!container) return;
        if (container.children.length === 0) {
            container.innerHTML = getTabHTML();
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            // Set initial state
            updateFormVisibility();
            initPads();
            generatePreview();
        }
    };

    let pads = { pad1: null, pad2: null };

    const initPads = () => {
        pads.pad1 = createSignaturePad('nd30-pad-1');
        pads.pad2 = createSignaturePad('nd30-pad-2');
        setTimeout(() => {
            if (pads.pad1) pads.pad1.resize();
            if (pads.pad2) pads.pad2.resize();
            toggleSignaturePads(); // Hide initially if unchecked
        }, 100);
    };

    const clearSignatures = () => {
        if (pads.pad1) pads.pad1.clear();
        if (pads.pad2) pads.pad2.clear();
        generatePreview();
    };

    const toggleSignaturePads = () => {
        const isEnabled = document.getElementById('nd30-use-signature').checked;
        const container = document.getElementById('nd30-signature-pads');
        if (container) container.style.display = isEnabled ? 'grid' : 'none';
        generatePreview();
    };

    // Vector Signature Canvas Logic
    function createSignaturePad(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        let drawing = false;

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
        resizeCanvas();

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }

        function startDraw(e) { drawing = true; const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); e.preventDefault(); }
        function draw(e) { if (!drawing) return; const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); e.preventDefault(); generatePreview(); }
        function stopDraw() { drawing = false; generatePreview(); }

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseleave', stopDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDraw);

        return {
            clear: () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; },
            getDataURL: () => { return canvas.toDataURL(); },
            resize: resizeCanvas
        };
    }

    const getTabHTML = () => {
        return `
            <div class="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-2 pb-12">
                <div class="page-header">
                    <h1 class="page-title">Soạn thảo Văn bản NĐ30</h1>
                    <p class="page-subtitle">Tạo và in các văn bản hành chính theo chuẩn thể thức Nghị định 30/2020/NĐ-CP.</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <!-- Trái: Form nhập liệu (4 cột) -->
                    <div class="lg:col-span-4 space-y-6">
                        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                            <h3 class="font-bold text-slate-800 flex items-center gap-2 border-b pb-2 mb-4">
                                <i data-lucide="file-text" style="width:18px"></i> Chọn Loại Văn Bản
                            </h3>
                            <select id="nd30-type" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none" onchange="Decree30Editor.updateFormVisibility()">
                                <optgroup label="Văn bản hành chính chung">
                                    <option value="quyet_dinh">Quyết Định (Cá biệt)</option>
                                    <option value="cong_van">Công Văn</option>
                                    <option value="to_trinh">Tờ Trình</option>
                                    <option value="bao_cao">Báo Cáo</option>
                                    <option value="ke_hoach">Kế Hoạch</option>
                                    <option value="thong_bao">Thông Báo</option>
                                    <option value="bien_ban">Biên Bản</option>
                                </optgroup>
                                <optgroup label="Các loại Giấy - Phiếu">
                                    <option value="giay_gioi_thieu">Giấy Giới Thiệu</option>
                                    <option value="giay_moi">Giấy Mời</option>
                                    <option value="giay_uy_quyen">Giấy Ủy Quyền</option>
                                    <option value="giay_nghi_phep">Giấy Nghỉ Phép</option>
                                    <option value="phieu_gui">Phiếu Gửi</option>
                                    <option value="phieu_chuyen">Phiếu Chuyển</option>
                                    <option value="phieu_bao">Phiếu Báo</option>
                                </optgroup>
                                <optgroup label="Quy phạm nội bộ & Hướng dẫn">
                                    <option value="nghi_quyet">Nghị Quyết (Cá biệt)</option>
                                    <option value="chi_thi">Chỉ Thị</option>
                                    <option value="quy_che">Quy Chế</option>
                                    <option value="quy_dinh">Quy Định</option>
                                    <option value="huong_dan">Hướng Dẫn</option>
                                    <option value="chuong_trinh">Chương Trình</option>
                                    <option value="phuong_an">Phương Án</option>
                                    <option value="de_an">Đề Án</option>
                                    <option value="du_an">Dự Án</option>
                                </optgroup>
                                <optgroup label="Giao dịch & Thỏa thuận">
                                    <option value="hop_dong">Hợp Đồng</option>
                                    <option value="ban_ghi_nho">Bản Ghi Nhớ</option>
                                    <option value="ban_thoa_thuan">Bản Thỏa Thuận</option>
                                </optgroup>
                                <optgroup label="Khác">
                                    <option value="thong_cao">Thông Cáo</option>
                                    <option value="cong_dien">Công Điện</option>
                                    <option value="thu_cong">Thư Công</option>
                                </optgroup>
                            </select>

                            <h3 class="font-bold text-slate-800 flex items-center gap-2 border-b pb-2 mt-6 mb-4">
                                <i data-lucide="edit-3" style="width:18px"></i> Nội Dung
                            </h3>

                            <div class="space-y-4">
                                <!-- Nhóm Generic Title -->
                                <div id="nd30-fields-generic_title" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Tên văn bản (VD: Về việc... / Sơ kết...)</label>
                                        <input type="text" id="nd30-gt-subject" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Nhập tên văn bản..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Nội dung</label>
                                        <textarea id="nd30-gt-content" rows="8" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="I. Mục đích...
II. Nội dung..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                </div>

                                <!-- Nhóm Generic Send -->
                                <div id="nd30-fields-generic_send" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Kính gửi (Nơi nhận)</label>
                                        <input type="text" id="nd30-gs-recipient" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Sở GD&ĐT..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Về việc (Trích yếu)</label>
                                        <input type="text" id="nd30-gs-subject" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Đề nghị..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Nội dung</label>
                                        <textarea id="nd30-gs-content" rows="6" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Thực hiện theo chỉ đạo..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                </div>

                                <!-- Nhóm Hợp đồng / Thỏa thuận -->
                                <div id="nd30-fields-contract" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Tên thỏa thuận / Hợp đồng</label>
                                        <input type="text" id="nd30-ct-subject" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Hợp đồng dịch vụ..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Thông tin Bên A</label>
                                        <textarea id="nd30-ct-partyA" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Đại diện: Ông...
Địa chỉ:..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Thông tin Bên B</label>
                                        <textarea id="nd30-ct-partyB" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Đại diện: Bà...
Địa chỉ:..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Điều khoản thỏa thuận</label>
                                        <textarea id="nd30-ct-content" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Điều 1. Nội dung công việc...
Điều 2. Trách nhiệm..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                </div>

                                <!-- Quyết định fields -->
                                <div id="nd30-fields-quyet_dinh" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Về việc (Trích yếu)</label>
                                        <input type="text" id="nd30-qd-subject" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Thành lập hội đồng..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Căn cứ pháp lý (Mỗi căn cứ 1 dòng)</label>
                                        <textarea id="nd30-qd-bases" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Căn cứ Luật...
Căn cứ Nghị định..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Nội dung Quyết định (Điều 1, 2...)</label>
                                        <textarea id="nd30-qd-articles" rows="6" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Điều 1. ...
Điều 2. ...
Điều 3. Chánh Văn phòng, các cá nhân..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                </div>

                                <!-- Biên bản fields -->
                                <div id="nd30-fields-bien_ban" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Tên biên bản</label>
                                        <input type="text" id="nd30-bb-subject" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Họp hội đồng..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Thời gian / Địa điểm</label>
                                        <input type="text" id="nd30-bb-time" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="08h00 ngày... tại Phòng..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Thành phần</label>
                                        <textarea id="nd30-bb-members" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Ông A - Hiệu trưởng...
Bà B - Thư ký..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Nội dung diễn biến</label>
                                        <textarea id="nd30-bb-content" rows="6" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="1. Ông A triển khai...
2. Các thành viên thảo luận..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                </div>

                                <!-- Giấy mời fields -->
                                <div id="nd30-fields-giay_moi" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Trân trọng kính mời</label>
                                        <input type="text" id="nd30-gm-invitee" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Ông/Bà..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Tới dự</label>
                                        <textarea id="nd30-gm-event" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none resize-none" placeholder="Họp chuyên môn..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Thời gian</label>
                                        <input type="text" id="nd30-gm-time" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="08 giờ 00, ngày 20/05/2026" oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Địa điểm</label>
                                        <input type="text" id="nd30-gm-location" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Phòng Hội đồng" oninput="Decree30Editor.generatePreview()">
                                    </div>
                                </div>

                                <!-- Giấy giới thiệu fields -->
                                <div id="nd30-fields-giay_gioi_thieu" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Trân trọng giới thiệu Ông/Bà</label>
                                        <input type="text" id="nd30-ggt-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Nguyễn Văn A" oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Chức vụ / Đơn vị</label>
                                        <input type="text" id="nd30-ggt-position" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Giáo viên" oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Được cử đến (Nơi đến)</label>
                                        <input type="text" id="nd30-ggt-destination" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Sở GD&ĐT..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Về việc</label>
                                        <textarea id="nd30-ggt-purpose" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none resize-none" placeholder="Liên hệ nộp hồ sơ..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Thời hạn giới thiệu</label>
                                        <input type="text" id="nd30-ggt-validity" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Hết ngày 30/12/2026" oninput="Decree30Editor.generatePreview()">
                                    </div>
                                </div>
                                
                                <!-- Giấy ủy quyền fields -->
                                <div id="nd30-fields-giay_uy_quyen" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Bên ủy quyền (Gồm Họ tên, chức vụ, CCCD...)</label>
                                        <textarea id="nd30-guq-partyA" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Ông/Bà:..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Bên được ủy quyền (Gồm Họ tên, chức vụ, CCCD...)</label>
                                        <textarea id="nd30-guq-partyB" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Ông/Bà:..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Nội dung ủy quyền</label>
                                        <textarea id="nd30-guq-content" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Thay mặt tôi giải quyết..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                </div>

                                <!-- Giấy nghỉ phép fields -->
                                <div id="nd30-fields-giay_nghi_phep" class="nd30-field-group space-y-4 hidden">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Họ và tên người xin phép</label>
                                        <input type="text" id="nd30-gnp-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Nguyễn Văn A" oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Đơn vị / Chức vụ</label>
                                        <input type="text" id="nd30-gnp-position" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Giáo viên Tổ Toán" oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Thời gian xin nghỉ</label>
                                        <input type="text" id="nd30-gnp-time" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Từ ngày... đến ngày..." oninput="Decree30Editor.generatePreview()">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Lý do nghỉ</label>
                                        <textarea id="nd30-gnp-reason" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none resize-none" placeholder="Giải quyết việc gia đình..." oninput="Decree30Editor.generatePreview()"></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-6 space-y-4 border-t pt-4">
                                <div class="flex items-center justify-between">
                                    <label class="checkbox-item" style="color: #2563eb; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="nd30-use-signature" checked onchange="Decree30Editor.toggleSignaturePads()">
                                        <span>Sử dụng chữ ký số (Canvas Signature Pads)</span>
                                    </label>
                                    <button onclick="Decree30Editor.clearSignatures()" class="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                                        <i data-lucide="eraser" style="width:12px"></i> XÓA CHỮ KÝ
                                    </button>
                                </div>
                                <div id="nd30-signature-pads" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <div class="text-[10px] font-bold text-slate-500">NGƯỜI KÝ 1 (BÊN A / HIỆU TRƯỞNG)</div>
                                        <div class="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center" style="height:120px; position:relative;">
                                            <canvas id="nd30-pad-1" class="w-full h-full cursor-crosshair block" style="touch-action: none; background:#fafafa; position:absolute; inset:0;"></canvas>
                                            <div class="pointer-events-none text-slate-200 font-sans text-[11px] uppercase tracking-widest absolute inset-0 flex items-center justify-center">Ký vào đây</div>
                                        </div>
                                    </div>
                                    <div class="space-y-2" id="nd30-pad-2-container">
                                        <div class="text-[10px] font-bold text-slate-500">NGƯỜI KÝ 2 (BÊN B / ĐỐI TÁC)</div>
                                        <div class="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center" style="height:120px; position:relative;">
                                            <canvas id="nd30-pad-2" class="w-full h-full cursor-crosshair block" style="touch-action: none; background:#fafafa; position:absolute; inset:0;"></canvas>
                                            <div class="pointer-events-none text-slate-200 font-sans text-[11px] uppercase tracking-widest absolute inset-0 flex items-center justify-center">Ký vào đây</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex gap-3 mt-6">
                                <button onclick="Decree30Editor.printA4()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                                    <i data-lucide="printer" style="width:20px; height:20px"></i> IN / PDF
                                </button>
                                <button onclick="Decree30Editor.exportWord()" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                                    <i data-lucide="file-text" style="width:20px; height:20px"></i> XUẤT WORD
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Phải: Preview A4 (8 cột) -->
                    <div class="lg:col-span-8 flex justify-center bg-slate-100 p-8 rounded-3xl border border-slate-200 overflow-x-auto">
                        <div id="nd30-a4-preview" class="bg-white shadow-2xl shrink-0" style="width: 210mm; min-height: 297mm; padding: 20mm 15mm 20mm 30mm; font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5; color: black; word-wrap: break-word; overflow-wrap: break-word;">
                            <!-- Content generated by JS -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const updateFormVisibility = () => {
        currentMode = document.getElementById('nd30-type').value;
        document.querySelectorAll('.nd30-field-group').forEach(el => el.classList.add('hidden'));

        const groupTitle = ['bao_cao', 'ke_hoach', 'thong_bao', 'nghi_quyet', 'chi_thi', 'quy_che', 'quy_dinh', 'huong_dan', 'chuong_trinh', 'phuong_an', 'de_an', 'du_an', 'thong_cao', 'cong_dien', 'thu_cong'];
        const groupSend = ['cong_van', 'to_trinh', 'phieu_gui', 'phieu_chuyen', 'phieu_bao'];
        const groupContract = ['hop_dong', 'ban_ghi_nho', 'ban_thoa_thuan'];

        let targetField = `nd30-fields-${currentMode}`;
        if (groupTitle.includes(currentMode)) targetField = 'nd30-fields-generic_title';
        if (groupSend.includes(currentMode)) targetField = 'nd30-fields-generic_send';
        if (groupContract.includes(currentMode)) targetField = 'nd30-fields-contract';
        
        // Show/hide second signature pad
        const pad2Container = document.getElementById('nd30-pad-2-container');
        if (pad2Container) {
            if (groupContract.includes(currentMode) || currentMode === 'bien_ban' || currentMode === 'giay_uy_quyen') {
                pad2Container.style.display = 'block';
            } else {
                pad2Container.style.display = 'none';
            }
        }

        const el = document.getElementById(targetField);
        if (el) el.classList.remove('hidden');
        generatePreview();
    };

    const generatePreview = () => {
        const preview = document.getElementById('nd30-a4-preview');
        if (!preview) return;

        const useSignature = document.getElementById('nd30-use-signature').checked;
        const deptName = document.getElementById('cfg-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
        const schoolName = document.getElementById('cfg-school-name')?.value || "TRƯỜNG THPT CAO BÁ QUÁT";
        
        let html = '';

        const abbrevs = {
            quyet_dinh: 'QĐ', cong_van: 'CV', to_trinh: 'TTr', bao_cao: 'BC', ke_hoach: 'KH', thong_bao: 'TB', bien_ban: 'BB',
            giay_gioi_thieu: 'GGT', giay_moi: 'GM', giay_uy_quyen: 'GUQ', giay_nghi_phep: 'GNP',
            phieu_gui: 'PG', phieu_chuyen: 'PC', phieu_bao: 'PB', nghi_quyet: 'NQ', chi_thi: 'CT', quy_che: 'QC',
            quy_dinh: 'QuyĐịnh', huong_dan: 'HD', chuong_trinh: 'CTr', phuong_an: 'PA', de_an: 'ĐA', du_an: 'DA',
            hop_dong: 'HĐ', ban_ghi_nho: 'BGN', ban_thoa_thuan: 'BTT', thong_cao: 'TC', cong_dien: 'CĐ', thu_cong: 'Thư'
        };
        const abbrev = abbrevs[currentMode] || 'VB';
        const docNum = `Số: ...../${abbrev}-${schoolName.split(' ').map(w => w[0]).join('')}`;

        const isContractType = ['hop_dong', 'ban_ghi_nho', 'ban_thoa_thuan'].includes(currentMode);

        // Phần Header chuẩn (Quốc hiệu, Cơ quan)
        if (isContractType) {
            html += `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="text-transform: uppercase; font-size: 13pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div style="font-size: 14pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
                    <div style="border-top: 1px solid black; width: 30%; margin: 5px auto 0;"></div>
                    <div style="margin-top: 5px; font-size: 14pt; font-style: italic; text-align: right;">..., ngày ... tháng ... năm 20...</div>
                </div>
            `;
        } else {
            html += `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                    <tr>
                    <!-- Cơ quan ban hành -->
                    <td width="50%" valign="top" style="text-align: center;">
                        <span style="text-transform: uppercase; font-size: 13pt; white-space: nowrap;">${deptName}</span><br>
                        <strong style="text-transform: uppercase; font-size: 13pt; white-space: nowrap;">${schoolName}</strong><br>
                        <div style="border-top: 1px solid black; width: 40%; margin: 5px auto 0;"></div>
                        <span style="font-size: 13pt;">${docNum}</span>
                    </td>
                    <!-- Quốc hiệu -->
                    <td width="50%" valign="top" style="text-align: center;">
                        <strong style="text-transform: uppercase; font-size: 13pt; white-space: nowrap;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
                        <strong style="font-size: 14pt; white-space: nowrap;">Độc lập - Tự do - Hạnh phúc</strong><br>
                        <div style="border-top: 1px solid black; width: 60%; margin: 5px auto 0;"></div>
                        <span style="font-size: 14pt; font-style: italic;">..., ngày ... tháng ... năm 20...</span>
                    </td>
                    </tr>
                </table>
            `;
        }

        const groupTitle = ['bao_cao', 'ke_hoach', 'thong_bao', 'nghi_quyet', 'chi_thi', 'quy_che', 'quy_dinh', 'huong_dan', 'chuong_trinh', 'phuong_an', 'de_an', 'du_an', 'thong_cao', 'cong_dien', 'thu_cong'];
        const groupSend = ['cong_van', 'to_trinh', 'phieu_gui', 'phieu_chuyen', 'phieu_bao'];
        const groupContract = ['hop_dong', 'ban_ghi_nho', 'ban_thoa_thuan'];

        const typeLabels = {
            nghi_quyet: 'NGHỊ QUYẾT', chi_thi: 'CHỈ THỊ', quy_che: 'QUY CHẾ', quy_dinh: 'QUY ĐỊNH', huong_dan: 'HƯỚNG DẪN',
            chuong_trinh: 'CHƯƠNG TRÌNH', ke_hoach: 'KẾ HOẠCH', phuong_an: 'PHƯƠNG ÁN', de_an: 'ĐỀ ÁN', du_an: 'DỰ ÁN',
            bao_cao: 'BÁO CÁO', thong_cao: 'THÔNG CÁO', thong_bao: 'THÔNG BÁO', cong_dien: 'CÔNG ĐIỆN', thu_cong: 'THƯ CÔNG',
            to_trinh: 'TỜ TRÌNH', phieu_gui: 'PHIẾU GỬI', phieu_chuyen: 'PHIẾU CHUYỂN', phieu_bao: 'PHIẾU BÁO',
            hop_dong: 'HỢP ĐỒNG', ban_ghi_nho: 'BẢN GHI NHỚ', ban_thoa_thuan: 'BẢN THỎA THUẬN'
        };

        if (groupTitle.includes(currentMode)) {
            const subject = document.getElementById('nd30-gt-subject')?.value || ".......................";
            const content = document.getElementById('nd30-gt-content')?.value || "Nội dung...";
            html += `
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">${typeLabels[currentMode]}</div>
                    <div style="font-size: 14pt; font-weight: bold; white-space: pre-wrap; word-wrap: break-word;">${subject}</div>
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; text-align: justify; white-space: pre-wrap; word-wrap: break-word;">${content}</div>
            `;
        }
        else if (groupSend.includes(currentMode)) {
            const recipient = document.getElementById('nd30-gs-recipient')?.value || ".......................";
            const subject = document.getElementById('nd30-gs-subject')?.value || ".......................";
            const content = document.getElementById('nd30-gs-content')?.value || "Nội dung...";
            
            if (currentMode === 'cong_van') {
                html += `
                    <div style="margin-bottom: 20px;">
                        <span style="font-weight: bold;">Kính gửi:</span> ${recipient}
                    </div>
                    <div style="margin-bottom: 20px;">
                        <span style="font-weight: bold;">V/v:</span> ${subject}
                    </div>
                    <div style="margin-bottom: 10px; line-height: 1.5; text-align: justify; white-space: pre-wrap; word-wrap: break-word;">${content}</div>
                `;
            } else {
                html += `
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">${typeLabels[currentMode]}</div>
                        <div style="font-size: 14pt; font-weight: bold; white-space: pre-wrap; word-wrap: break-word;">Về việc ${subject}</div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <span style="font-weight: bold;">Kính gửi:</span> ${recipient}
                    </div>
                    <div style="margin-bottom: 10px; line-height: 1.5; text-align: justify; white-space: pre-wrap; word-wrap: break-word;">${content}</div>
                `;
            }
        }
        else if (groupContract.includes(currentMode)) {
            const subject = document.getElementById('nd30-ct-subject')?.value || ".......................";
            const partyA = document.getElementById('nd30-ct-partyA')?.value || "...";
            const partyB = document.getElementById('nd30-ct-partyB')?.value || "...";
            const content = document.getElementById('nd30-ct-content')?.value || "Nội dung...";
            
            html += `
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">${typeLabels[currentMode]}</div>
                    <div style="font-size: 14pt; font-weight: bold; white-space: pre-wrap; word-wrap: break-word;">${subject}</div>
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;">
<span style="font-weight: bold; text-transform: uppercase;">BÊN A:</span>
${partyA}
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;">
<span style="font-weight: bold; text-transform: uppercase;">BÊN B:</span>
${partyB}
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; text-align: justify; white-space: pre-wrap; word-wrap: break-word;">
<span style="font-weight: bold;">NỘI DUNG:</span>
${content}
                </div>
            `;
        }
        else if (currentMode === 'quyet_dinh') {
            const subject = document.getElementById('nd30-qd-subject')?.value || ".......................";
            const bases = document.getElementById('nd30-qd-bases')?.value.split('\n').filter(x => x.trim() !== '') || [];
            const articles = document.getElementById('nd30-qd-articles')?.value.split('\n').filter(x => x.trim() !== '') || [];

            let basesHtml = bases.length > 0 ? bases.map(b => `<div style="font-style: italic; margin-bottom: 5px; white-space: pre-wrap; word-wrap: break-word;">${b};</div>`).join('') : '<div style="font-style: italic; margin-bottom: 5px;">Căn cứ...</div>';
            let articlesHtml = articles.length > 0 ? articles.map(a => `<div style="margin-bottom: 10px; text-align: justify; white-space: pre-wrap; word-wrap: break-word;">${a}</div>`).join('') : '<div style="margin-bottom: 10px;"><b>Điều 1.</b> ...</div>';

            html += `
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">QUYẾT ĐỊNH</div>
                    <div style="font-size: 14pt; font-weight: bold; white-space: pre-wrap; word-wrap: break-word;">Về việc ${subject}</div>
                </div>
                <div style="text-align: center; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; white-space: pre-wrap; word-wrap: break-word;">
                    HIỆU TRƯỞNG ${schoolName}
                </div>
                <div style="margin-bottom: 20px;">
                    ${basesHtml}
                    <div style="font-style: italic; margin-bottom: 5px;">Xét đề nghị của Văn phòng nhà trường,</div>
                </div>
                <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">QUYẾT ĐỊNH:</div>
                ${articlesHtml}
            `;
        }
        else if (currentMode === 'bien_ban') {
            const subject = document.getElementById('nd30-bb-subject')?.value || ".......................";
            const time = document.getElementById('nd30-bb-time')?.value || ".......................";
            const members = document.getElementById('nd30-bb-members')?.value || "...";
            const content = document.getElementById('nd30-bb-content')?.value || "Nội dung...";

            html += `
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">BIÊN BẢN</div>
                    <div style="font-size: 14pt; font-weight: bold; white-space: pre-wrap; word-wrap: break-word;">${subject}</div>
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5;">
                    <span style="font-weight: bold;">1. Thời gian, địa điểm:</span> ${time}
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;">
<span style="font-weight: bold;">2. Thành phần:</span>
${members}
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; text-align: justify; white-space: pre-wrap; word-wrap: break-word;">
<span style="font-weight: bold;">3. Nội dung diễn biến:</span>
${content}
                </div>
            `;
        }
        else if (currentMode === 'giay_gioi_thieu') {
            const name = document.getElementById('nd30-ggt-name')?.value || "..........................................................";
            const pos = document.getElementById('nd30-ggt-position')?.value || "..........................................................";
            const dest = document.getElementById('nd30-ggt-destination')?.value || "..........................................................";
            const purpose = document.getElementById('nd30-ggt-purpose')?.value || "..........................................................";
            const validity = document.getElementById('nd30-ggt-validity')?.value || "..........................................................";

            html += `
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">GIẤY GIỚI THIỆU</div>
                </div>
                <div style="margin-bottom: 20px;">
                    Hiệu trưởng ${schoolName.toLowerCase()} trân trọng giới thiệu:
                </div>
                <div style="margin-bottom: 10px;">Ông/Bà: <b>${name}</b></div>
                <div style="margin-bottom: 10px;">Chức vụ/Đơn vị công tác: ${pos}</div>
                <div style="margin-bottom: 10px;">Được cử đến: ${dest}</div>
                <div style="margin-bottom: 10px; white-space: pre-wrap; word-wrap: break-word;">Về việc: ${purpose}</div>
                <div style="margin-bottom: 10px;">Đề nghị Quý cơ quan tạo điều kiện để Ông/Bà ${name} hoàn thành nhiệm vụ.</div>
                <div style="margin-bottom: 10px;">Giấy này có giá trị đến: ${validity}</div>
            `;
        } 
        else if (currentMode === 'giay_moi') {
            const invitee = document.getElementById('nd30-gm-invitee')?.value || "..........................................................";
            const event = document.getElementById('nd30-gm-event')?.value || "..........................................................";
            const time = document.getElementById('nd30-gm-time')?.value || "..........................................................";
            const loc = document.getElementById('nd30-gm-location')?.value || "..........................................................";

            html += `
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">GIẤY MỜI</div>
                </div>
                <div style="text-align: center; font-style: italic; margin-bottom: 20px;">
                    Hiệu trưởng ${schoolName.toLowerCase()}
                </div>
                <div style="margin-bottom: 20px;">Trân trọng kính mời: <b>${invitee}</b></div>
                <div style="margin-bottom: 10px; white-space: pre-wrap; word-wrap: break-word;">Tới dự: ${event}</div>
                <div style="margin-bottom: 10px;">Thời gian: ${time}</div>
                <div style="margin-bottom: 10px;">Địa điểm: ${loc}</div>
                <div style="margin-bottom: 10px;">Rất mong ${invitee.includes('Ông') || invitee.includes('Bà') ? 'Ông/Bà' : 'Quý vị'} đến dự đúng giờ để cuộc họp thành công tốt đẹp.</div>
            `;
        }
        else if (currentMode === 'giay_uy_quyen') {
            const partyA = document.getElementById('nd30-guq-partyA')?.value || "...";
            const partyB = document.getElementById('nd30-guq-partyB')?.value || "...";
            const content = document.getElementById('nd30-guq-content')?.value || "...";

            html += `
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">GIẤY ỦY QUYỀN</div>
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;">
<span style="font-weight: bold; text-transform: uppercase;">I. BÊN ỦY QUYỀN:</span>
${partyA}
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;">
<span style="font-weight: bold; text-transform: uppercase;">II. BÊN ĐƯỢC ỦY QUYỀN:</span>
${partyB}
                </div>
                <div style="margin-bottom: 10px; line-height: 1.5; text-align: justify; white-space: pre-wrap; word-wrap: break-word;">
<span style="font-weight: bold; text-transform: uppercase;">III. NỘI DUNG ỦY QUYỀN:</span>
${content}
                </div>
            `;
        }
        else if (currentMode === 'giay_nghi_phep') {
            const name = document.getElementById('nd30-gnp-name')?.value || ".......................";
            const pos = document.getElementById('nd30-gnp-position')?.value || ".......................";
            const time = document.getElementById('nd30-gnp-time')?.value || ".......................";
            const reason = document.getElementById('nd30-gnp-reason')?.value || ".......................";

            html += `
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">ĐƠN XIN NGHỈ PHÉP</div>
                </div>
                <div style="margin-bottom: 20px;">
                    <span style="font-weight: bold;">Kính gửi:</span> Hiệu trưởng ${schoolName}
                </div>
                <div style="margin-bottom: 10px;">Tôi tên là: <b>${name}</b></div>
                <div style="margin-bottom: 10px;">Chức vụ/Đơn vị: ${pos}</div>
                <div style="margin-bottom: 10px;">Nay tôi làm đơn này xin phép được nghỉ từ ngày/đến ngày: ${time}</div>
                <div style="margin-bottom: 10px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;">Lý do nghỉ: ${reason}</div>
                <div style="margin-bottom: 10px;">Rất mong nhận được sự chấp thuận. Tôi xin chân thành cảm ơn!</div>
            `;
        }

        // Phần Footer chuẩn (Nơi nhận, Chữ ký)
        let signatureHtml = '';
        if (useSignature) {
            signatureHtml = `
                <span style="font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
                <div style="position: relative; height: 100px;">
                    <!-- Giả lập chữ ký số/con dấu đỏ -->
                    <div style="position: absolute; top: -10px; right: 20px; width: 120px; height: 120px; border-radius: 50%; border: 3px solid #dc2626; color: #dc2626; display: flex; align-items: center; justify-content: center; transform: rotate(-15deg); opacity: 0.7;">
                        <div style="text-align: center; font-size: 14px; font-weight: bold; font-family: 'Times New Roman', serif;">
                            TRƯỜNG<br>THPT<br>...
                        </div>
                    </div>
                    <div style="position: absolute; top: 20px; right: 30px; width: 160px; text-align: center; color: #2563eb; font-family: 'Brush Script MT', cursive; font-size: 40px; transform: rotate(-5deg);">
                        Đã ký
                    </div>
                </div>
            `;
        } else {
            signatureHtml = `<span style="font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</span><div style="height: 100px;"></div>`;
        }

        const twoSignatures = ['hop_dong', 'ban_ghi_nho', 'ban_thoa_thuan', 'giay_uy_quyen', 'bien_ban'];
        const signatureFooter = twoSignatures.includes(currentMode) ? `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 40px; page-break-inside: avoid;">
                <tr>
                <td width="50%" valign="top" style="text-align: center;">
                    <strong style="text-transform: uppercase;">ĐẠI DIỆN BÊN A</strong><br>
                    <span style="font-style: italic;">(Hoặc Thư ký)</span>
                    <div style="height: 100px;"></div>
                </td>
                <td width="50%" valign="top" style="text-align: center;">
                    <strong style="text-transform: uppercase;">ĐẠI DIỆN BÊN B</strong><br>
                    <span style="font-style: italic;">(Hoặc Chủ tọa)</span><br>
                    ${signatureHtml}
                </td>
                </tr>
            </table>
        ` : currentMode === 'giay_nghi_phep' ? `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 40px; page-break-inside: avoid;">
                <tr>
                <td width="50%" valign="top" style="text-align: center;">
                    <strong style="text-transform: uppercase;">HIỆU TRƯỞNG</strong><br>
                    ${signatureHtml}
                </td>
                <td width="50%" valign="top" style="text-align: center;">
                    <strong style="text-transform: uppercase;">NGƯỜI LÀM ĐƠN</strong><br>
                    <span style="font-style: italic;">(Ký, ghi rõ họ tên)</span>
                    <div style="height: 100px;"></div>
                </td>
                </tr>
            </table>
        ` : `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 40px; page-break-inside: avoid;">
                <tr>
                <td width="50%" valign="top">
                    <strong style="font-style: italic; font-size: 11pt;">Nơi nhận:</strong><br>
                    <span style="font-size: 11pt;">
                        - Như trên;<br>
                        - Lưu: VT.
                    </span>
                </td>
                <td width="50%" valign="top" style="text-align: center;">
                    <strong style="text-transform: uppercase;">HIỆU TRƯỞNG</strong><br>
                    ${signatureHtml}
                </td>
                </tr>
            </table>
        `;

        html += signatureFooter;

        preview.innerHTML = html;
    };

    const printA4 = () => {
        const previewEl = document.getElementById('nd30-a4-preview');
        
        const printWindow = window.open('', '', 'width=900,height=900');
        printWindow.document.write(`
            <html>
            <head>
                <title>In Văn Bản NĐ30</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; background: #fff; }
                    .a4-page {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 20mm 15mm 20mm 30mm;
                        font-family: "Times New Roman", Times, serif;
                        font-size: 14pt;
                        line-height: 1.5;
                        color: black;
                        box-sizing: border-box;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .a4-page { width: 100%; height: 100%; margin: 0; padding: 20mm 15mm 20mm 30mm; border: none; box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="a4-page">${previewEl.innerHTML}</div>
                <script>
                    setTimeout(() => { window.print(); window.close(); }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const exportWord = () => {
        const previewEl = document.getElementById('nd30-a4-preview');
        // Add CSS to reset margins because MS Word adds default paragraph spacing to divs
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Van Ban ND30</title><style>div { margin: 0; padding: 0; } p { margin: 0; padding: 0; }</style></head><body>";
        const postHtml = "</body></html>";
        
        // Add inline margin: 0 to all layout divs to be absolutely certain Word ignores paragraph spacing
        let contentHtml = previewEl.innerHTML.replace(/<div style="/g, '<div style="margin: 0; padding: 0; ');
        contentHtml = contentHtml.replace(/<div(?!\s+style)/g, '<div style="margin: 0; padding: 0;"');
        // MS Word ignores white-space: pre-wrap, so we must replace textarea newlines with <br>
        // But to avoid replacing HTML structural newlines, we only replace \n that are NOT inside HTML tags.
        // Actually, innerHTML usually strips non-essential newlines inside tags, but safely we can just replace all \n.
        // Wait, a better way: textareas generate \n in innerText. We can do a safe replace on content text nodes if we had time.
        // For now, replacing all \n with <br> inside the final body content string is safer if we strip HTML newlines first.
        // Let's strip structural newlines:
        contentHtml = contentHtml.replace(/>\s+</g, '><'); // remove structural whitespace
        contentHtml = contentHtml.replace(/\n/g, '<br>'); // replace remaining content newlines with <br>

        const html = preHtml + contentHtml + postHtml;

        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        });
        
        const downloadLink = document.createElement("a");
        downloadLink.download = 'van_ban_nd30.doc';
        downloadLink.href = URL.createObjectURL(blob);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    return {
        init,
        getTabHTML,
        updateFormVisibility,
        generatePreview,
        printA4,
        exportWord,
        clearSignatures,
        toggleSignaturePads
    };
})();
