/**
 * SMART SHUFFLER 2025
 * Trộn đề thi Trắc nghiệm từ file Word trực tiếp trên trình duyệt
 * Hỗ trợ định dạng 2025 của Bộ GD&ĐT (Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn)
 */

const ExamShuffler = (() => {
    let state = {
        file: null,
        zip: null,
        xmlDoc: null,
        parsedData: null,
        config: {
            title: '',
            subject: '',
            grade: 'Khối 12',
            duration: '50',
            numExams: 4,
            startCode: 101,
            reorderQuestions: true,
            fixQuestions: false,
            lowercaseTrueFalse: true,
            exportExcel: true
        }
    };

    const injectUI = () => {
        const container = document.getElementById('view-exam-shuffler');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header flex justify-between items-center mb-6">
                <div>
                    <h1 class="page-title flex items-center gap-2 text-2xl font-black">
                        <i data-lucide="shuffle" class="text-red-500" style="width:28px; height:28px;"></i> <span class="shuffler-header-gradient">SMART SHUFFLER PRO 2025</span>
                    </h1>
                    <p class="page-subtitle text-slate-500 mt-1 font-medium">Hệ thống trộn đề thi siêu tốc chuẩn cấu trúc Bộ GD&ĐT 2025</p>
                </div>
                <div class="flex gap-3">
                    <button class="btn btn-outline btn-sm text-blue-600 border-blue-300 font-bold shadow-sm" onclick="ExamShuffler.downloadSample()">
                        <i data-lucide="download" style="width:16px"></i> TẢI FILE MẪU
                    </button>
                    <button class="btn btn-primary btn-sm bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-none shadow-lg shadow-red-500/30 font-bold px-6 py-2 rounded-xl text-white transition-all transform hover:scale-105" onclick="ExamShuffler.runShuffle()">
                        <i data-lucide="zap" style="width:16px"></i> KHỞI ĐỘNG TRỘN ĐỀ
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Cột trái: Form & Config -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Khu vực Upload File -->
                    <div class="shuffler-pro-card p-6">
                        <h3 class="font-black text-slate-800 mb-4 text-sm uppercase tracking-widest flex items-center gap-2"><span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">1</span> Nạp dữ liệu gốc</h3>
                        <div id="shuffler-dropzone" class="shuffler-dropzone-pro rounded-2xl p-8 text-center cursor-pointer" onclick="document.getElementById('shuffler-file-input').click()">
                            <i data-lucide="file-up" class="mx-auto text-blue-500 mb-3" style="width:56px; height:56px; stroke-width: 1.5;"></i>
                            <p class="text-base font-black text-blue-800 mb-2">Click hoặc Kéo thả file Word (.docx)</p>
                            <div class="text-xs text-slate-500 font-medium space-y-1">
                                <p>Hỗ trợ thẻ <code class="bg-slate-100 text-pink-500 px-1 rounded">&lt;nhom&gt;</code> phân chia phần thi</p>
                                <p>Nhận diện câu hỏi bắt đầu bằng <code>Câu X:</code> hoặc <code>#</code></p>
                                <p>Đáp án đúng màu <b class="text-red-500">Đỏ</b> hoặc gạch chân</p>
                            </div>
                            <input type="file" id="shuffler-file-input" class="hidden" accept=".docx" onchange="ExamShuffler.handleFileUpload(event)">
                        </div>
                        <div id="shuffler-file-info" class="hidden mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i data-lucide="check-circle" style="width:16px;"></i>
                                <span id="shuffler-filename" class="font-bold truncate max-w-[150px]"></span>
                            </div>
                            <button class="text-red-500 hover:text-red-700" onclick="ExamShuffler.clearFile()"><i data-lucide="x" style="width:14px;"></i></button>
                        </div>
                    </div>

                    <!-- Cấu hình Đề -->
                    <div class="shuffler-pro-card p-6">
                        <h3 class="font-black text-slate-800 mb-4 text-sm uppercase tracking-widest flex items-center gap-2"><span class="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md">2</span> Thông tin xuất đề</h3>
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 mb-1">Số lượng đề</label>
                                    <input type="number" id="sf-num" class="form-control w-full text-sm font-bold" value="4">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 mb-1">Mã đề bắt đầu</label>
                                    <input type="number" id="sf-start-code" class="form-control w-full text-sm font-bold" value="101">
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-slate-100">
                                <label class="flex items-center gap-3 p-2 bg-indigo-50 border border-indigo-100 rounded-lg cursor-pointer mb-3">
                                    <input type="checkbox" id="sf-opt-auto-header" class="w-4 h-4 text-indigo-600 rounded" onchange="ExamShuffler.toggleAutoHeader()">
                                    <span class="text-sm font-bold text-indigo-700">Tự động sinh Bảng Tiêu Đề chuẩn</span>
                                </label>
                                <div id="auto-header-config" class="space-y-3 hidden">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-xs font-bold text-slate-500 mb-1">Sở GD&ĐT</label>
                                            <input type="text" id="sf-dept" class="form-control w-full text-xs" value="SỞ GD&ĐT ĐẮK LẮK">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-bold text-slate-500 mb-1">Tên Trường</label>
                                            <input type="text" id="sf-school" class="form-control w-full text-xs" value="TRƯỜNG THPT CAO BÁ QUÁT">
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-xs font-bold text-slate-500 mb-1">Tiêu đề kỳ thi</label>
                                            <input type="text" id="sf-exam-name" class="form-control w-full text-xs" value="ĐỀ THI THỬ TỐT NGHIỆP THPT">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-bold text-slate-500 mb-1">Năm học/Lần thi</label>
                                            <input type="text" id="sf-exam-time" class="form-control w-full text-xs" value="NĂM 2026_LẦN 02">
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <div class="col-span-1">
                                            <label class="block text-xs font-bold text-slate-500 mb-1">Môn thi</label>
                                            <input type="text" id="sf-subject" class="form-control w-full text-xs" value="MÔN ĐỊA LÍ">
                                        </div>
                                        <div class="col-span-1">
                                            <label class="block text-xs font-bold text-slate-500 mb-1">Khối lớp</label>
                                            <input type="text" id="sf-grade" class="form-control w-full text-xs" value="Khối lớp 12">
                                        </div>
                                        <div class="col-span-1">
                                            <label class="block text-xs font-bold text-slate-500 mb-1">Trang</label>
                                            <input type="text" id="sf-pages" class="form-control w-full text-xs" value="05">
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-xs font-bold text-slate-500 mb-1">Thời gian (phút)</label>
                                            <input type="number" id="sf-duration" class="form-control w-full text-xs" value="50">
                                        </div>
                                        <div></div>
                                    </div>
                                </div>
                                <div id="manual-header-config">
                                    <label class="block text-xs font-bold text-slate-500 mb-1 mt-3">Tiêu đề phụ (Chỉ dùng khi tự thiết kế bảng)</label>
                                    <input type="text" id="sf-title" class="form-control w-full text-sm" placeholder="VD: THI THỬ TỐT NGHIỆP 2025">
                                </div>
                            </div>
                            <div class="mt-4">
                                <label class="block text-xs font-bold text-slate-500 mb-1">Cỡ chữ xuất ra (pt)</label>
                                <select id="sf-font-size" class="form-control w-full text-sm">
                                    <option value="0">Giữ nguyên bản gốc</option>
                                    <option value="22">11 pt</option>
                                    <option value="24">12 pt</option>
                                    <option value="26">13 pt</option>
                                    <option value="28">14 pt</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Các tùy chọn chức năng -->
                    <div class="shuffler-pro-card p-6">
                        <h3 class="font-black text-slate-800 mb-4 text-sm uppercase tracking-widest flex items-center gap-2"><span class="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md">3</span> Chức năng trộn nâng cao</h3>
                        <div class="space-y-3">
                            <label class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                <input type="checkbox" id="sf-opt-reorder" class="w-4 h-4 rounded text-blue-600" checked>
                                <span class="text-sm font-medium text-slate-700">Đánh lại số câu tự động</span>
                            </label>
                            <label class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                <input type="checkbox" id="sf-opt-fix-q" class="w-4 h-4 rounded text-blue-600">
                                <span class="text-sm font-medium text-slate-700">Cố định vị trí câu hỏi (chỉ đảo đáp án)</span>
                            </label>
                            <label class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                <input type="checkbox" id="sf-opt-lowercase-tf" class="w-4 h-4 rounded text-blue-600" checked>
                                <span class="text-sm font-medium text-slate-700">Viết thường đáp án Đúng/Sai (a, b, c, d)</span>
                            </label>
                            <label class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                <input type="checkbox" id="sf-opt-excel" class="w-4 h-4 rounded text-blue-600" checked>
                                <span class="text-sm font-medium text-slate-700">Tự động xuất Bảng đáp án Excel</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Cột phải: Preview và Log -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="shuffler-pro-card p-0 overflow-hidden flex flex-col h-full" style="min-height: 550px;">
                        <div class="bg-white border-b border-slate-100 p-4 flex justify-between items-center shadow-sm relative z-10">
                            <h3 class="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="monitor-play" style="width:18px; color: #8b5cf6;"></i> Màn hình Giám sát
                            </h3>
                            <div class="flex items-center gap-2 text-xs font-bold">
                                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">Phần 1: <span id="count-p1">0</span></span>
                                <span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">Phần 2: <span id="count-p2">0</span></span>
                                <span class="px-2 py-1 bg-amber-100 text-amber-700 rounded-md">Phần 3: <span id="count-p3">0</span></span>
                            </div>
                        </div>
                        <div id="shuffler-preview" class="p-6 flex-1 overflow-y-auto bg-slate-50/80 text-sm font-medium text-slate-700 leading-relaxed">
                            <div class="text-center text-slate-400 mt-24">
                                <div class="inline-block p-4 bg-white rounded-full shadow-sm mb-4">
                                    <i data-lucide="file-search" class="text-blue-300" style="width:48px; height:48px;"></i>
                                </div>
                                <p class="font-bold">Hệ thống Shuffler Pro đang chờ dữ liệu.</p>
                                <p class="text-xs mt-1">Vui lòng nạp file Word gốc để tiến hành quét cấu trúc.</p>
                            </div>
                        </div>
                        <div id="shuffler-progress-container" class="hidden p-4 border-t border-slate-100 bg-white relative z-10">
                            <div class="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                <span id="shuffler-progress-text">Đang chuẩn bị...</span>
                                <span id="shuffler-progress-percent">0%</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2.5">
                                <div id="shuffler-progress-bar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div id="shuffler-logs" class="log-terminal p-4 text-xs max-h-48 overflow-y-auto hidden">
                            <span class="text-blue-400 font-bold">SMART SHUFFLER ENGINE v2025</span><br>
                            ================================<br>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const log = (msg) => {
        const logs = document.getElementById('shuffler-logs');
        if (logs) {
            logs.classList.remove('hidden');
            logs.innerHTML += `> ${msg}<br>`;
            logs.scrollTop = logs.scrollHeight;
        }
        console.log("[SmartShuffler]", msg);
    };

    const updateProgress = (percent, text) => {
        const container = document.getElementById('shuffler-progress-container');
        if (container) {
            container.classList.remove('hidden');
            document.getElementById('shuffler-progress-bar').style.width = `${percent}%`;
            document.getElementById('shuffler-progress-percent').innerText = `${percent}%`;
            if (text) document.getElementById('shuffler-progress-text').innerText = text;
        }
    };
    
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const toggleAutoHeader = () => {
        const isAuto = document.getElementById('sf-opt-auto-header').checked;
        if (isAuto) {
            document.getElementById('auto-header-config').classList.remove('hidden');
            document.getElementById('manual-header-config').classList.add('hidden');
        } else {
            document.getElementById('auto-header-config').classList.add('hidden');
            document.getElementById('manual-header-config').classList.remove('hidden');
        }
    };

    const clearFile = () => {
        state.file = null;
        state.zip = null;
        state.xmlDoc = null;
        state.parsedData = null;
        
        document.getElementById('shuffler-file-input').value = '';
        document.getElementById('shuffler-file-info').classList.add('hidden');
        document.getElementById('shuffler-dropzone').classList.remove('hidden');
        
        const preview = document.getElementById('shuffler-preview');
        preview.innerHTML = `
            <div class="text-center text-slate-400 mt-20">
                <i data-lucide="file-search" class="mx-auto mb-4 opacity-50" style="width:64px; height:64px;"></i>
                <p>Chưa có dữ liệu. Vui lòng nạp file Word để hệ thống phân tích cấu trúc đề thi.</p>
            </div>
        `;
        document.getElementById('count-p1').innerText = '0';
        document.getElementById('count-p2').innerText = '0';
        document.getElementById('count-p3').innerText = '0';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        state.file = file;
        document.getElementById('shuffler-filename').innerText = file.name;
        document.getElementById('shuffler-dropzone').classList.add('hidden');
        document.getElementById('shuffler-file-info').classList.remove('hidden');

        log(`Đang đọc file ${file.name}...`);
        
        try {
            if (typeof JSZip === 'undefined') {
                throw new Error("Thư viện JSZip chưa được tải.");
            }
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            state.zip = zip;
            
            const xmlString = await zip.file("word/document.xml").async("text");
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");
            state.xmlDoc = xmlDoc;
            
            log(`Giải nén thành công, đang phân tích cấu trúc XML...`);
            analyzeDocument(xmlDoc);

        } catch (error) {
            log(`<span class="text-red-500">Lỗi: ${error.message}</span>`);
            alert("Đã xảy ra lỗi khi đọc file Word: " + error.message);
        }
    };

    
    const parseDocxXML = (xmlDoc) => {
        const namespaces = {
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        };
        const body = xmlDoc.getElementsByTagNameNS(namespaces.w, "body")[0];
        if (!body) return null;
        
        const children = Array.from(body.childNodes);
        
        let headerNodes = [];
        let parts = [];
        let currentPart = -1;
        let currentQuestion = null;
        let stats = { p1: 0, p2: 0, p3: 0 };
        
        const getNodeText = (node) => {
            if (node.nodeType !== 1) return "";
            let text = "";
            const tNodes = node.getElementsByTagNameNS(namespaces.w, "t");
            for (let i = 0; i < tNodes.length; i++) {
                text += tNodes[i].textContent;
            }
            return text.trim();
        };

        const isCorrectAnswer = (node) => {
            if (node.nodeType !== 1) return false;
            const rNodes = node.getElementsByTagNameNS(namespaces.w, "r");
            for (let i = 0; i < rNodes.length; i++) {
                const rPr = rNodes[i].getElementsByTagNameNS(namespaces.w, "rPr")[0];
                if (rPr) {
                    if (rPr.getElementsByTagNameNS(namespaces.w, "u").length > 0) return true;
                    // Bỏ kiểm tra in đậm (b) vì các chữ A, B, C, D thường được in đậm sẽ gây lỗi nhận diện sai đáp án
                    const colorNodes = rPr.getElementsByTagNameNS(namespaces.w, "color");
                    if (colorNodes.length > 0) {
                        const val = colorNodes[0].getAttribute("w:val");
                        if (val === "FF0000" || val === "C00000" || val === "red") return true;
                    }
                }
            }
            return false;
        };

        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            
            if (node.nodeName === "w:sectPr") continue;
            
            const text = getNodeText(node);
            
            let hasNhom = text.includes("<nhom>");
            let hasEndNhom = text.includes("</nhom>");
            let prevPart = currentPart;
            
            if (hasNhom) {
                currentPart++;
                parts.push({ type: 'nhom', questions: [], partHeaderNodes: [] });
                currentQuestion = null;
            }
            if (hasEndNhom) {
                currentQuestion = null;
            }
            
            let strippedText = text.replace(/<nhom>/g, "").replace(/<\/nhom>/g, "").trim();
            if ((hasNhom || hasEndNhom) && strippedText.length === 0) {
                continue;
            }
            
            if (hasNhom || hasEndNhom) {
                const tNodes = node.getElementsByTagNameNS(namespaces.w, "t");
                for (let i = 0; i < tNodes.length; i++) {
                    let tc = tNodes[i].textContent;
                    if (tc.includes("<nhom>")) tNodes[i].textContent = tc.replace(/<nhom>/g, "");
                    if (tc.includes("</nhom>")) tNodes[i].textContent = tc.replace(/<\/nhom>/g, "");
                }
            }
            
            const isQuestionStart = (text.startsWith("#") || /^Câu\s*\d+\s*[:\.]/i.test(text)) && node.nodeName === "w:p";
            const isOption = (/^[A-D]\s*[\.\)]/.test(text) || /^[a-d]\s*[\.\)]/.test(text)) && node.nodeName === "w:p";
            
            if (isQuestionStart) {
                if (currentPart === -1) {
                    currentPart = 0;
                    parts.push({ type: 'nhom', questions: [], partHeaderNodes: [] });
                }
                currentQuestion = {
                    qNode: node,
                    qText: text,
                    options: [],
                    contentNodes: [],
                    shortAnswer: "",
                    shortAnswerNode: null
                };
                parts[currentPart].questions.push(currentQuestion);
                
                if (currentPart === 0) stats.p1++;
                else if (currentPart === 1) stats.p2++;
                else if (currentPart === 2) stats.p3++;
            } else if (isOption && currentQuestion) {
                currentQuestion.options.push({
                    oNode: node,
                    oText: text,
                    isCorrect: isCorrectAnswer(node)
                });
            } else if (currentQuestion) {
                if (currentPart === 2 && text.trim().startsWith("TNN:")) {
                    currentQuestion.shortAnswer = text.replace("TNN:", "").trim();
                    currentQuestion.shortAnswerNode = node;
                } else {
                    currentQuestion.contentNodes.push(node);
                }
            } else {
                if (currentPart === -1) {
                    headerNodes.push(node);
                } else if (hasNhom && prevPart === -1) {
                    if (node.nodeName === "w:tbl") headerNodes.push(node);
                    else parts[currentPart].partHeaderNodes.push(node);
                } else {
                    parts[currentPart].partHeaderNodes.push(node);
                }
            }
        }
        
        return { headerNodes, parts, stats };
    };

    const analyzeDocument = (xmlDoc) => {
        log("Đã nạp file XML vào bộ nhớ. Bắt đầu phân tích cấu trúc (Parsing Phase)...");
        
        state.parsedData = parseDocxXML(xmlDoc);
        const stats = state.parsedData.stats;
        
        document.getElementById('count-p1').innerText = stats.p1;
        document.getElementById('count-p2').innerText = stats.p2;
        document.getElementById('count-p3').innerText = stats.p3;
        
        log(`Đã quét xong: Phần 1 (${stats.p1} câu), Phần 2 (${stats.p2} câu), Phần 3 (${stats.p3} câu)`);
        
        const preview = document.getElementById('shuffler-preview');
        preview.innerHTML = `<div class="p-5 bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
            <h4 class="font-black text-emerald-700 mb-2 flex items-center gap-2"><i data-lucide="check-circle-2" style="width:18px;"></i> Quét cấu trúc thành công</h4>
            <div class="text-sm font-medium text-slate-700 space-y-2 mt-3">
                <div class="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span>Phần I: Trắc nghiệm nhiều lựa chọn</span>
                    <span class="font-bold text-emerald-600">${stats.p1} câu</span>
                </div>
                <div class="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span>Phần II: Trắc nghiệm Đúng/Sai</span>
                    <span class="font-bold text-blue-600">${stats.p2} câu</span>
                </div>
                <div class="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span>Phần III: Trắc nghiệm trả lời ngắn</span>
                    <span class="font-bold text-amber-600">${stats.p3} câu</span>
                </div>
            </div>
            <p class="text-slate-500 text-xs mt-4 bg-slate-50 p-2 rounded border border-slate-100"><i data-lucide="info" style="width:12px; display:inline"></i> Bấm "KHỞI ĐỘNG TRỘN ĐỀ" để bắt đầu hoán vị XML và sinh File Word.</p>
        </div>`;
        
        let warnings = [];
        for (let p = 0; p < state.parsedData.parts.length; p++) {
            let part = state.parsedData.parts[p];
            for (let q = 0; q < part.questions.length; q++) {
                let question = part.questions[q];
                let qNum = q + 1;
                let pName = p === 0 ? 'I' : (p === 1 ? 'II' : 'III');
                
                if (p === 0 || p === 1) {
                    if (question.options.length < 4) {
                        warnings.push(`Phần ${pName} - Câu ${qNum}: Chỉ có ${question.options.length}/4 phương án.`);
                    }
                    if (!question.options.some(o => o.isCorrect)) {
                        warnings.push(`Phần ${pName} - Câu ${qNum}: Thiếu đáp án đúng (chưa tô đỏ/gạch chân).`);
                    }
                } else if (p === 2) {
                    if (!question.shortAnswer) {
                        warnings.push(`Phần III - Câu ${qNum}: Thiếu đáp án (chưa có dòng TNN: ...).`);
                    }
                }
            }
        }
        
        if (warnings.length > 0) {
            const warningHTML = `
                <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h5 class="text-xs font-black text-red-600 mb-2 flex items-center gap-1"><i data-lucide="alert-triangle" style="width:14px"></i> CẢNH BÁO LỖI SOẠN THẢO</h5>
                    <ul class="text-xs text-red-700 space-y-1 list-disc pl-4">
                        ${warnings.slice(0, 5).map(w => `<li>${w}</li>`).join('')}
                        ${warnings.length > 5 ? `<li>...và ${warnings.length - 5} lỗi khác.</li>` : ''}
                    </ul>
                </div>
            `;
            preview.children[0].insertAdjacentHTML('beforeend', warningHTML);
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    
    // Helper to shuffle an array
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    // Helper to clear text in a run but keep formatting
    const setRunText = (rNode, newText, namespaces) => {
        const tNodes = rNode.getElementsByTagNameNS(namespaces.w, "t");
        for (let i = 0; i < tNodes.length; i++) {
            if (i === 0) {
                tNodes[i].textContent = newText;
            } else {
                tNodes[i].textContent = "";
            }
        }
    };

    // Replace prefix like "Câu 1:" with "Câu X:"
    const updateQuestionNumber = (pNode, newNum, namespaces) => {
        const rNodes = pNode.getElementsByTagNameNS(namespaces.w, "r");
        let fullText = "";
        let modified = false;
        
        for (let i = 0; i < rNodes.length; i++) {
            const tNodes = rNodes[i].getElementsByTagNameNS(namespaces.w, "t");
            for (let j = 0; j < tNodes.length; j++) {
                const text = tNodes[j].textContent;
                fullText += text;
                
                // If we haven't modified the prefix yet, and we have enough text
                if (!modified) {
                    const match = /^((?:#|Câu)\s*\d*\s*[:\.]?\s*)(.*)/i.exec(fullText);
                    if (match) {
                        // We found the prefix. We need to replace it in THIS tNode
                        // But wait, the prefix could span multiple tNodes.
                        // Safe approach: Clear all previous tNodes, put the new string in this one.
                        const newPrefix = `Câu ${newNum}: `;
                        
                        // Go back and clear
                        let tempText = "";
                        for (let r = 0; r <= i; r++) {
                            const ts = rNodes[r].getElementsByTagNameNS(namespaces.w, "t");
                            for (let t = 0; t < ts.length; t++) {
                                if (r === i && t === j) {
                                    // Put the new prefix + remaining text here
                                    ts[t].textContent = newPrefix + match[2];
                                } else {
                                    ts[t].textContent = "";
                                }
                            }
                        }
                        modified = true;
                    }
                }
            }
        }
    };

    // Update Option letter like "A." or "a)"
    const updateOptionLetter = (pNode, newLetter, isPart2, namespaces) => {
        const rNodes = pNode.getElementsByTagNameNS(namespaces.w, "r");
        let fullText = "";
        let modified = false;
        
        for (let i = 0; i < rNodes.length; i++) {
            const tNodes = rNodes[i].getElementsByTagNameNS(namespaces.w, "t");
            for (let j = 0; j < tNodes.length; j++) {
                const text = tNodes[j].textContent;
                fullText += text;
                
                if (!modified) {
                    const regex = isPart2 ? /^([a-d]\s*[\.\)]\s*)(.*)/i : /^([A-D]\s*[\.\)]\s*)(.*)/i;
                    const match = regex.exec(fullText);
                    if (match) {
                        const newPrefix = isPart2 ? `${newLetter.toLowerCase()}) ` : `${newLetter.toUpperCase()}. `;
                        
                        for (let r = 0; r <= i; r++) {
                            const ts = rNodes[r].getElementsByTagNameNS(namespaces.w, "t");
                            for (let t = 0; t < ts.length; t++) {
                                if (r === i && t === j) {
                                    ts[t].textContent = newPrefix + match[2];
                                } else {
                                    ts[t].textContent = "";
                                }
                            }
                        }
                        modified = true;
                    }
                }
            }
            
            // ALSO: Strip red color, bold, underline (since it's the final output)
            const rPr = rNodes[i].getElementsByTagNameNS(namespaces.w, "rPr")[0];
            if (rPr) {
                const colors = rPr.getElementsByTagNameNS(namespaces.w, "color");
                for (let c = colors.length - 1; c >= 0; c--) rPr.removeChild(colors[c]);
                const us = rPr.getElementsByTagNameNS(namespaces.w, "u");
                for (let u = us.length - 1; u >= 0; u--) rPr.removeChild(us[u]);
                const bs = rPr.getElementsByTagNameNS(namespaces.w, "b");
                for (let b = bs.length - 1; b >= 0; b--) rPr.removeChild(bs[b]);
            }
        }
    };

    const escapeXml = (unsafe) => {
        return (unsafe || "").toString().replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    };

    const generateAutoHeaderXML = (config, code) => {
        const c = {
            dept: escapeXml(config.dept),
            school: escapeXml(config.school),
            examName: escapeXml(config.examName),
            examTime: escapeXml(config.examTime),
            subject: escapeXml(config.subject),
            grade: escapeXml(config.grade),
            pages: escapeXml(config.pages),
            duration: escapeXml(config.duration)
        };
        
        return `
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="0" w:type="auto"/>
            <w:tblBorders>
              <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            </w:tblBorders>
            <w:tblLayout w:type="fixed"/>
          </w:tblPr>
          <w:tblGrid>
            <w:gridCol w:w="4500"/>
            <w:gridCol w:w="5500"/>
          </w:tblGrid>
          <w:tr>
            <w:tc>
              <w:tcPr><w:tcW w:w="4500" w:type="dxa"/></w:tcPr>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${c.dept}</w:t></w:r></w:p>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${c.school}</w:t></w:r></w:p>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>------------------------</w:t></w:r></w:p>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/></w:rPr><w:t>(Đề thi có ${c.pages} trang)</w:t></w:r></w:p>
            </w:tc>
            <w:tc>
              <w:tcPr><w:tcW w:w="5500" w:type="dxa"/></w:tcPr>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${c.examName}</w:t></w:r></w:p>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${c.examTime}</w:t></w:r></w:p>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${c.subject} – ${c.grade}</w:t></w:r></w:p>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/></w:rPr><w:t>Thời gian làm bài : ${c.duration} phút</w:t></w:r></w:p>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/></w:rPr><w:t>(không kể thời gian phát đề)</w:t></w:r></w:p>
            </w:tc>
          </w:tr>
        </w:tbl>
        <w:p><w:r><w:t></w:t></w:r></w:p>
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="0" w:type="auto"/>
            <w:tblBorders>
              <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
              <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            </w:tblBorders>
            <w:tblLayout w:type="fixed"/>
          </w:tblPr>
          <w:tblGrid>
            <w:gridCol w:w="3500"/>
            <w:gridCol w:w="3500"/>
            <w:gridCol w:w="3000"/>
          </w:tblGrid>
          <w:tr>
            <w:tc>
              <w:tcPr><w:tcW w:w="3500" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
              <w:p><w:r><w:t>Họ và tên học sinh :.................................</w:t></w:r></w:p>
            </w:tc>
            <w:tc>
              <w:tcPr><w:tcW w:w="3500" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
              <w:p><w:r><w:t>Số báo danh : ........................</w:t></w:r></w:p>
            </w:tc>
            <w:tc>
              <w:tcPr>
                <w:tcW w:w="3000" w:type="dxa"/>
                <w:tcBorders>
                  <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                  <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                  <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                </w:tcBorders>
                <w:vAlign w:val="center"/>
              </w:tcPr>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Mã đề ${code}</w:t></w:r></w:p>
            </w:tc>
          </w:tr>
        </w:tbl>
        <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="auto"/></w:pBdr></w:pPr><w:r><w:t></w:t></w:r></w:p>
        <w:p><w:r><w:t></w:t></w:r></w:p>
        `;
    };

    const runShuffle = async () => {
        if (!state.xmlDoc || !state.parsedData) {
            if (typeof showAlert === 'function') showAlert("Vui lòng tải lên file Word gốc chứa đề thi và chờ phân tích xong!", "warning");
            else alert("Vui lòng tải lên file Word gốc chứa đề thi!");
            return;
        }
        
        log("Bắt đầu khởi động thuật toán Smart Shuffler XML Engine...");
        document.getElementById('shuffler-logs').classList.remove('hidden');
        
        try {
        
        const numExams = parseInt(document.getElementById('sf-num').value) || 1;
        const startCode = parseInt(document.getElementById('sf-start-code').value) || 101;
        const examTitle = document.getElementById('sf-title').value;
        const isAutoRenumber = document.getElementById('sf-opt-reorder').checked;
        const isFixQuestions = document.getElementById('sf-opt-fix-q').checked;
        const isLowerCaseCorrect = document.getElementById('sf-opt-lowercase-tf').checked;
        const fontSize = parseInt(document.getElementById('sf-font-size').value) || 0;
        const isAutoHeader = document.getElementById('sf-opt-auto-header').checked;
        const autoHeaderConfig = isAutoHeader ? {
            dept: document.getElementById('sf-dept').value || "SỞ GD&ĐT",
            school: document.getElementById('sf-school').value || "TRƯỜNG THPT",
            examName: document.getElementById('sf-exam-name').value || "ĐỀ THI",
            examTime: document.getElementById('sf-exam-time').value || "",
            subject: document.getElementById('sf-subject').value || "MÔN THI",
            grade: document.getElementById('sf-grade').value || "Khối 12",
            pages: document.getElementById('sf-pages').value || "01",
            duration: document.getElementById('sf-duration').value || "50"
        } : null;
        
        updateProgress(0, "Đang chuẩn bị dữ liệu...");
        await sleep(50);
        log(`Tiến hành trộn ${numExams} mã đề (Bắt đầu từ mã ${startCode})`);
        
        const namespaces = { w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main" };
        const body = state.xmlDoc.getElementsByTagNameNS(namespaces.w, "body")[0];
        
        let zip = new JSZip();
        let excelData = [];
        let optionLettersPart1 = ["A", "B", "C", "D"];
        let optionLettersPart2 = ["A", "B", "C", "D"]; // In key it is usually ABCD for True/False too, but rendered as a, b, c, d
        
        for (let examIdx = 0; examIdx < numExams; examIdx++) {
            updateProgress(Math.round((examIdx / numExams) * 70), `Đang xử lý Mã đề ${startCode + examIdx}...`);
            await sleep(50);
            const currentExamCode = startCode + examIdx;
            log(`>> Đang xử lý Mã đề: ${currentExamCode}...`);
            
            let clonedParts = JSON.parse(JSON.stringify(state.parsedData.parts));
            for (let p = 0; p < clonedParts.length; p++) {
                if (state.parsedData.parts[p].partHeaderNodes) {
                    clonedParts[p].partHeaderNodes = state.parsedData.parts[p].partHeaderNodes.map(n => n.cloneNode(true));
                }
                for (let q = 0; q < clonedParts[p].questions.length; q++) {
                    clonedParts[p].questions[q].qNode = state.parsedData.parts[p].questions[q].qNode.cloneNode(true);
                    clonedParts[p].questions[q].contentNodes = state.parsedData.parts[p].questions[q].contentNodes.map(n => n.cloneNode(true));
                    for (let o = 0; o < clonedParts[p].questions[q].options.length; o++) {
                        clonedParts[p].questions[q].options[o].oNode = state.parsedData.parts[p].questions[q].options[o].oNode.cloneNode(true);
                    }
                }
            }
            
            let clonedHeader = state.parsedData.headerNodes.map(n => n.cloneNode(true));

            let examKey = { "Mã đề": currentExamCode };
            
            // SHUFFLE LOGIC
            for (let p = 0; p < clonedParts.length; p++) {
                if (!isFixQuestions) {
                    shuffleArray(clonedParts[p].questions);
                }
                
                for (let q = 0; q < clonedParts[p].questions.length; q++) {
                    let question = clonedParts[p].questions[q];
                    
                    // Re-number Question
                    if (isAutoRenumber || !isFixQuestions) {
                        updateQuestionNumber(question.qNode, q + 1, namespaces);
                    }
                    
                    // Shuffle options for Part 1 and Part 2
                    if (p === 0 || p === 1) {
                        let originalOptions = [...question.options];
                        shuffleArray(question.options);
                        
                        let correctAnswers = [];
                        for (let o = 0; o < question.options.length; o++) {
                            let opt = question.options[o];
                            let letter = p === 0 ? optionLettersPart1[o] : optionLettersPart2[o];
                            
                            // Re-letter the Option and strip colors
                            updateOptionLetter(opt.oNode, letter, p === 1, namespaces);
                            
                            if (opt.isCorrect) {
                                correctAnswers.push(letter);
                            }
                        }
                        
                        // Record to key
                        if (p === 0) {
                            examKey[`Câu ${q + 1} (P1)`] = correctAnswers.length > 0 ? correctAnswers[0] : "";
                        } else if (p === 1) {
                            // Part 2 usually has 4 true/false statements per question
                            // Let's just record the correct letters for True statements
                            examKey[`Câu ${q + 1} (P2) Đúng`] = correctAnswers.join(",");
                        }
                    } else if (p === 2) {
                        // Part 3: Short answer. We just re-number. No options to shuffle.
                        examKey[`Câu ${q + 1} (P3)`] = question.shortAnswer || "Manual"; 
                    }
                }
            }
            
            excelData.push(examKey);
            
            // RECONSTRUCT XML
            let newDoc = state.xmlDoc.cloneNode(true);
            let newBody = newDoc.getElementsByTagNameNS(namespaces.w, "body")[0];
            
            // Clear body but keep sectPr (last child usually)
            let sectPr = null;
            const children = Array.from(newBody.childNodes);
            for (let child of children) {
                if (child.nodeName === "w:sectPr") {
                    sectPr = child;
                }
                newBody.removeChild(child);
            }
            
            // Insert Header nodes first
            if (isAutoHeader) {
                const headerXML = generateAutoHeaderXML(autoHeaderConfig, currentExamCode);
                const tempDoc = new DOMParser().parseFromString(`<w:root xmlns:w="${namespaces.w}">${headerXML}</w:root>`, "application/xml");
                const nodesToInsert = Array.from(tempDoc.documentElement.childNodes);
                for (let n of nodesToInsert) {
                    newBody.appendChild(newDoc.importNode(n, true));
                }
            } else {
                for (let node of clonedHeader) {
                    // If it's the title paragraph, maybe replace a placeholder with Mã đề?
                    // For now, just append all header nodes exactly as they were (this preserves tables and images!)
                    newBody.appendChild(node);
                }
                
                // Add Title if any (simplified as a paragraph)
                if (examTitle && examTitle.trim() !== "") {
                    const titleP = newDoc.createElementNS(namespaces.w, "w:p");
                    const titleR = newDoc.createElementNS(namespaces.w, "w:r");
                    const titleT = newDoc.createElementNS(namespaces.w, "w:t");
                    titleT.textContent = `${examTitle} - MÃ ĐỀ: ${currentExamCode}`;
                    const rPr = newDoc.createElementNS(namespaces.w, "w:rPr");
                    const b = newDoc.createElementNS(namespaces.w, "w:b");
                    rPr.appendChild(b);
                    titleR.appendChild(rPr);
                    titleR.appendChild(titleT);
                    titleP.appendChild(titleR);
                    const pPr = newDoc.createElementNS(namespaces.w, "w:pPr");
                    const jc = newDoc.createElementNS(namespaces.w, "w:jc");
                    jc.setAttribute("w:val", "center");
                    pPr.appendChild(jc);
                    titleP.appendChild(pPr);
                    newBody.appendChild(titleP);
                }
            }

            // Insert parts
            for (let p = 0; p < clonedParts.length; p++) {
                // Thêm lại các dòng text của header Phần thi (nếu có)
                if (clonedParts[p].partHeaderNodes) {
                    for (let node of clonedParts[p].partHeaderNodes) {
                        newBody.appendChild(node);
                    }
                }
                
                // Insert questions
                for (let q = 0; q < clonedParts[p].questions.length; q++) {
                    let question = clonedParts[p].questions[q];
                    newBody.appendChild(question.qNode);
                    
                    // Insert content
                    for (let cNode of question.contentNodes) {
                        newBody.appendChild(cNode);
                    }
                    
                    // Insert options
                    for (let opt of question.options) {
                        newBody.appendChild(opt.oNode);
                    }
                }
            }
            
            const hetP = newDoc.createElementNS(namespaces.w, "w:p");
            const hetR = newDoc.createElementNS(namespaces.w, "w:r");
            const hetT = newDoc.createElementNS(namespaces.w, "w:t");
            hetT.textContent = "------ HẾT ------";
            const hetRPr = newDoc.createElementNS(namespaces.w, "w:rPr");
            const hetB = newDoc.createElementNS(namespaces.w, "w:b");
            const hetI = newDoc.createElementNS(namespaces.w, "w:i"); // italic
            hetRPr.appendChild(hetB);
            hetRPr.appendChild(hetI);
            hetR.appendChild(hetRPr);
            hetR.appendChild(hetT);
            hetP.appendChild(hetR);
            const hetPPr = newDoc.createElementNS(namespaces.w, "w:pPr");
            const hetJc = newDoc.createElementNS(namespaces.w, "w:jc");
            hetJc.setAttribute("w:val", "center");
            hetPPr.appendChild(hetJc);
            hetP.appendChild(hetPPr);
            newBody.appendChild(hetP);
            
            if (sectPr) newBody.appendChild(sectPr);
            
            // --- CHUẨN HÓA ĐỊNH DẠNG IN ẤN ---
            // 1. Chuẩn hóa Cỡ chữ và Font chữ (Times New Roman)
            const rNodes = newDoc.getElementsByTagNameNS(namespaces.w, "r");
            for (let i = 0; i < rNodes.length; i++) {
                let r = rNodes[i];
                let rPr = r.getElementsByTagNameNS(namespaces.w, "rPr")[0];
                if (!rPr) {
                    rPr = newDoc.createElementNS(namespaces.w, "w:rPr");
                    if (r.firstChild) r.insertBefore(rPr, r.firstChild);
                    else r.appendChild(rPr);
                }
                
                // Ép Font Times New Roman
                let rFonts = rPr.getElementsByTagNameNS(namespaces.w, "rFonts")[0];
                if (!rFonts) {
                    rFonts = newDoc.createElementNS(namespaces.w, "w:rFonts");
                    rPr.appendChild(rFonts);
                }
                rFonts.setAttribute("w:ascii", "Times New Roman");
                rFonts.setAttribute("w:hAnsi", "Times New Roman");
                rFonts.setAttribute("w:cs", "Times New Roman");
                rFonts.setAttribute("w:eastAsia", "Times New Roman");
                
                // Ép Cỡ chữ
                if (fontSize > 0) {
                    let sz = rPr.getElementsByTagNameNS(namespaces.w, "sz")[0];
                    if (!sz) {
                        sz = newDoc.createElementNS(namespaces.w, "w:sz");
                        rPr.appendChild(sz);
                    }
                    sz.setAttribute("w:val", fontSize.toString());
                    
                    let szCs = rPr.getElementsByTagNameNS(namespaces.w, "szCs")[0];
                    if (!szCs) {
                        szCs = newDoc.createElementNS(namespaces.w, "w:szCs");
                        rPr.appendChild(szCs);
                    }
                    szCs.setAttribute("w:val", fontSize.toString());
                }
            }
            
            // 2. Chuẩn hóa Đoạn văn (Justify - Căn đều 2 bên)
            const pNodes = newDoc.getElementsByTagNameNS(namespaces.w, "p");
            for (let i = 0; i < pNodes.length; i++) {
                let p = pNodes[i];
                // Bỏ qua nếu nằm trong Table
                let parent = p.parentNode;
                let inTable = false;
                while (parent) {
                    if (parent.nodeName === "w:tbl") { inTable = true; break; }
                    parent = parent.parentNode;
                }
                if (inTable) continue;
                
                let pPr = p.getElementsByTagNameNS(namespaces.w, "pPr")[0];
                if (!pPr) {
                    pPr = newDoc.createElementNS(namespaces.w, "w:pPr");
                    if (p.firstChild) p.insertBefore(pPr, p.firstChild);
                    else p.appendChild(pPr);
                }
                
                let jc = pPr.getElementsByTagNameNS(namespaces.w, "jc")[0];
                if (!jc) {
                    jc = newDoc.createElementNS(namespaces.w, "w:jc");
                    jc.setAttribute("w:val", "both");
                    pPr.appendChild(jc);
                } else {
                    let val = jc.getAttribute("w:val");
                    if (val !== "center" && val !== "right") {
                        jc.setAttribute("w:val", "both"); // Ép căn đều nếu đang left hoặc không có
                    }
                }
            }
            
            // 3. Chuẩn hóa Khổ giấy (A4) và Căn lề (Margins)
            if (sectPr) {
                let pgSz = sectPr.getElementsByTagNameNS(namespaces.w, "pgSz")[0];
                if (!pgSz) {
                    pgSz = newDoc.createElementNS(namespaces.w, "w:pgSz");
                    sectPr.appendChild(pgSz);
                }
                pgSz.setAttribute("w:w", "11906"); // Khổ A4
                pgSz.setAttribute("w:h", "16838");
                
                let pgMar = sectPr.getElementsByTagNameNS(namespaces.w, "pgMar")[0];
                if (!pgMar) {
                    pgMar = newDoc.createElementNS(namespaces.w, "w:pgMar");
                    sectPr.appendChild(pgMar);
                }
                // Chuẩn lề đề thi: Trái 2.0cm, Phải 1.5cm, Trên 1.5cm, Dưới 1.5cm (1cm = 567 twips)
                pgMar.setAttribute("w:top", "850");
                pgMar.setAttribute("w:bottom", "850");
                pgMar.setAttribute("w:left", "1134");
                pgMar.setAttribute("w:right", "850");
                pgMar.setAttribute("w:header", "708"); // Lề header 1.25cm
                pgMar.setAttribute("w:footer", "708"); // Lề footer 1.25cm
                pgMar.setAttribute("w:gutter", "0");
            }

            // Serialize XML
            const serializer = new XMLSerializer();
            let newXmlString = serializer.serializeToString(newDoc);
            
            if (isAutoHeader) {
                // Add footerReference via string manipulation to avoid namespace exceptions in DOM
                if (!newXmlString.includes("<w:sectPr>")) {
                    newXmlString = newXmlString.replace("</w:body>", "<w:sectPr/></w:body>");
                }
                newXmlString = newXmlString.replace(/<w:sectPr([^>]*)>/, '<w:sectPr$1><w:footerReference w:type="default" r:id="rIdFooterAuto1"/>');
            }
            
            // Regex to replace Mã đề \d+ inside XML strings even if split across tags
            const madeRegex = /(Mã\s*đề\s*(?:<[^>]+>\s*)*)\d{3,4}/ig;
            newXmlString = newXmlString.replace(madeRegex, `$1${currentExamCode}`);
            
            // Inject into zip
            const currentZip = new JSZip();
            // Load original zip
            const originalArrayBuffer = await state.file.arrayBuffer();
            await currentZip.loadAsync(originalArrayBuffer);
            
            // Handle headers and footers
            for (let filename of Object.keys(currentZip.files)) {
                if (filename.startsWith("word/header") || filename.startsWith("word/footer")) {
                    let xmlStr = await currentZip.file(filename).async("string");
                    xmlStr = xmlStr.replace(madeRegex, `$1${currentExamCode}`);
                    currentZip.file(filename, xmlStr);
                }
            }
            
            if (isAutoHeader) {
                const footerXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:jc w:val="center"/></w:pPr>
    <w:r><w:t xml:space="preserve">Trang </w:t></w:r>
    <w:fldSimple w:instr=" PAGE \\* MERGEFORMAT "/>
    <w:r><w:t xml:space="preserve">/${autoHeaderConfig.pages} - Mã đề ${currentExamCode}</w:t></w:r>
  </w:p>
</w:ftr>`;
                currentZip.file("word/footerAuto1.xml", footerXML);
                
                let contentTypes = await currentZip.file("[Content_Types].xml").async("string");
                if (!contentTypes.includes("/word/footerAuto1.xml")) {
                    contentTypes = contentTypes.replace("</Types>", `<Override PartName="/word/footerAuto1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`);
                    currentZip.file("[Content_Types].xml", contentTypes);
                }
                
                let relsFile = currentZip.file("word/_rels/document.xml.rels");
                if (relsFile) {
                    let rels = await relsFile.async("string");
                    if (!rels.includes("rIdFooterAuto1")) {
                        rels = rels.replace("</Relationships>", `<Relationship Id="rIdFooterAuto1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footerAuto1.xml"/></Relationships>`);
                        currentZip.file("word/_rels/document.xml.rels", rels);
                    }
                }
            }
            
            // Replace document.xml
            currentZip.file("word/document.xml", newXmlString);
            
            // Generate Blob
            const blob = await currentZip.generateAsync({ type: "blob" });
            zip.file(`De_Thi_${currentExamCode}.docx`, blob);
            log(`>> Đã tạo xong đề thi Mã: ${currentExamCode}`);
        }
        
        // Generate Excel Key
        updateProgress(80, "Đang tạo bảng Đáp án Excel...");
        await sleep(50);
        log("Đang tạo bảng Đáp án Excel (Answer Keys)...");
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DapAn");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        zip.file("Bang_Dap_An.xlsx", excelBuffer);
        
        // Download Zip
        updateProgress(90, "Đang nén file tải về...");
        await sleep(50);
        log("Đang nén file tải về...");
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Bo_De_Thi_Tron_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        updateProgress(100, "Hoàn tất! File đã được tải xuống.");
        log("HOÀN TẤT! Đã tải file nén chứa các mã đề và đáp án xuống máy tính.");
        if (typeof showAlert === 'function') showAlert(`Đã trộn xong ${numExams} mã đề. File đã được tải xuống!`, "success");
        else alert(`Đã trộn xong ${numExams} mã đề. File đã được tải xuống!`);
        setTimeout(() => {
            const container = document.getElementById('shuffler-progress-container');
            if (container) container.classList.add('hidden');
        }, 3000);
        } catch (error) {
            log(`<span class="text-red-500">Lỗi nghiêm trọng: ${error.message}</span>`);
            console.error(error);
            if (typeof showAlert === 'function') showAlert(`Lỗi xử lý: ${error.message}`, "error");
            else alert(`Lỗi xử lý: ${error.message}`);
        }
    };
    const downloadSample = () => {
        // Hàm tải file Word mẫu
        alert("Tính năng tải file mẫu đang được xây dựng.");
    };

    return {
        init: () => {
            injectUI();
            log("Sẵn sàng hoạt động.");
        },
        handleFileUpload,
        clearFile,
        runShuffle,
        downloadSample,
        toggleAutoHeader
    };
})();

// Auto-init if tab is clicked
document.addEventListener('DOMContentLoaded', () => {
    // Only init if the section is visible or requested
});
window.ExamShuffler = ExamShuffler;
document.addEventListener('DOMContentLoaded', () => ExamShuffler.init());
