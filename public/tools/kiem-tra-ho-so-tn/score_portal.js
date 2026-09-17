/**
 * MOCK EXAM SCORE DIGITAL PORTAL & ZALO DISPATCHER (v2.0 Advanced)
 * Intelligent Accent Normalization & Interactive Column Mapping
 */

const ScorePortal = (() => {
    "use strict";

    let activeTab = 'kiosk';
    const escapeHTML = (str) => {
        if (str == null) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    let activeFileName = '';
    let currentRole = 'ADMIN'; // Unlimited full system access by default
    let teacherPassword = 'gv123';
    let adminPassword = 'admin123';
    let ownerDepartment = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK';
    let ownerSchool = 'TRƯỜNG THPT CAO BÁ QUÁT';
    let detectedMapping = {
        sbd: '', name: '', lop: '',
        toan: '', van: '', ngoaingu: '',
        ly: '', hoa: '', sinh: '',
        su: '', dia: '', gdkt: '',
        tin: '', cnc: '', cnn: '',
        tong: ''
    };
    let currentSearchTerm = '';
    let selectedClass = '';
    let selectedSubject = '';
    let statsSubject = 'toan';

    // --- VIETNAMESE ACCENT REMOVER ---
    const removeVietnameseAccents = (str) => {
        if (!str) return '';
        return str.toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    };

    // --- AUTO DETECT SCORE COLUMNS ---
    const detectScoreColumns = () => {
        if (typeof columnNames === 'undefined' || !columnNames || columnNames.length === 0) {
            if (typeof excelData !== 'undefined' && excelData && excelData.length > 0) {
                columnNames = Object.keys(excelData[0]);
            } else {
                return false;
            }
        }

        const normCols = columnNames.map(c => {
            const noAccent = removeVietnameseAccents(c).toLowerCase().trim();
            const alphaNum = noAccent.replace(/[^a-z0-9]/g, '');
            return { orig: c, norm: alphaNum, noAccent: noAccent };
        });

        const findCol = (keywords, exclusions = []) => {
            const isExcluded = (c) => exclusions.some(ex => c.norm.includes(ex) || c.noAccent.includes(ex));

            // 1. Exact match on normalized alphanumeric string
            for (let kw of keywords) {
                const found = normCols.find(c => !isExcluded(c) && c.norm === kw);
                if (found) return found.orig;
            }
            // 2. Word boundary match on unaccented words
            for (let kw of keywords) {
                const found = normCols.find(c => {
                    if (isExcluded(c)) return false;
                    const words = c.noAccent.split(/[\s_\-\(\)\[\]]+/);
                    return words.includes(kw);
                });
                if (found) return found.orig;
            }
            // 3. Substring match only for specific or longer keywords (length >= 4)
            for (let kw of keywords) {
                if (kw.length >= 4) {
                    const found = normCols.find(c => !isExcluded(c) && (c.norm.includes(kw) || c.noAccent.includes(kw)));
                    if (found) return found.orig;
                }
            }
            return '';
        };

        detectedMapping.sbd = findCol(['sbd', 'sobaodanh', 'baodanh', 'madingdanh']);
        detectedMapping.name = findCol(['hoten', 'hovaten', 'name', 'tensinh', 'hovatenhocsinh', 'thisinh', 'ten']);
        detectedMapping.lop = findCol(['lop', 'class', 'phong', 'donvi', 'lophoc', 'phongthi', 'khoi']);
        detectedMapping.toan = findCol(['toan', 'math', 'diemtoan', 'montoan', 'toanhoc']);
        detectedMapping.van = findCol(['van', 'nguvan', 'diemvan', 'monvan']);
        detectedMapping.ngoaingu = findCol(['ngoaingu', 'anh', 'tienganh', 'diemanh', 'nn', 'tieng', 'english']);
        detectedMapping.ly = findCol(['vatly', 'vatli', 'ly', 'li', 'diemly', 'monly'], ['dia']);
        detectedMapping.hoa = findCol(['hoahoc', 'hoa', 'diemhoa', 'monhoa']);
        detectedMapping.sinh = findCol(['sinhhoc', 'sinh', 'diemsinh', 'monsinh'], ['thisinh', 'ngaysinh', 'noisinh', 'gioitinh']);
        detectedMapping.su = findCol(['lichsu', 'su', 'diemsu', 'monsu']);
        detectedMapping.dia = findCol(['diali', 'dia', 'diemdia', 'mondia', 'dialy'], ['vatly', 'vatli']);
        detectedMapping.gdkt = findCol(['gdcd', 'gdkte', 'gdkthp', 'diemgdcd', 'gdkt', 'gdktpl', 'congdan', 'kinhtephapluat']);
        detectedMapping.tin = findCol(['tinhoc', 'tin', 'diemtinhoc', 'montinhoc', 'informatics']);
        detectedMapping.cnc = findCol(['congnghecongnghiep', 'cnc', 'congnghecong', 'cncn']);
        detectedMapping.cnn = findCol(['congnghenongnghiep', 'cnn', 'congnghenong', 'cnnn', 'cong nghe']);
        detectedMapping.tong = findCol(['tong', 'tongdiem', 'diemtong', 'tongxettn', 'diemxettotnghiep']);

        return true;
    };

    const updateMapping = (fieldKey, colName) => {
        detectedMapping[fieldKey] = colName;
        renderSearchResults();
    };

    // --- MODAL CONTAINER ---
    const ensureModalContainer = () => {
        let container = document.getElementById('score-portal-overlay');
        if (!container) {
            container = document.createElement('div');
            container.id = 'score-portal-overlay';
            container.className = 'custom-alert-overlay';
            container.style.zIndex = '999999';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.background = 'rgba(15, 23, 42, 0.75)';
            container.style.backdropFilter = 'blur(12px)';
            container.onclick = (e) => { if (e.target === container) closeModal(); };
            document.body.appendChild(container);
        }
        container.style.display = 'flex';
        return container;
    };

    const openModal = () => {
        detectScoreColumns();
        activeTab = 'kiosk';
        const container = ensureModalContainer();
        container.innerHTML = getModalHTML();
        document.body.style.overflow = 'hidden';

        renderTabContent();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const closeModal = () => {
        const container = document.getElementById('score-portal-overlay');
        if (container) container.remove();
        document.body.style.overflow = '';
    };

    const switchTab = (tab) => {
        activeTab = tab;
        const btns = document.querySelectorAll('.score-tab-btn');
        btns.forEach(btn => {
            const isAct = btn.dataset.tab === activeTab;
            btn.className = `score-tab-btn flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${isAct ? 'bg-white shadow-md text-emerald-600' : 'text-slate-600 hover:bg-slate-100'}`;
        });
        renderTabContent();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const getModalHTML = () => {
        const tabsHTML = `
            <button data-tab="kiosk" class="score-tab-btn flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'kiosk' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ScorePortal.switchTab('kiosk')" style="border:none;">
                <i data-lucide="search" style="width:18px"></i> Kiosk Tra Cứu
            </button>
            <button data-tab="stats" class="score-tab-btn flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'stats' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ScorePortal.switchTab('stats')" style="border:none;">
                <i data-lucide="bar-chart-3" style="width:18px"></i> Phổ Điểm & Thống Kê
            </button>
            <button data-tab="zalo" class="score-tab-btn flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'zalo' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ScorePortal.switchTab('zalo')" style="border:none;">
                <i data-lucide="send" style="width:18px"></i> Gửi Tin Zalo
            </button>
            <button data-tab="export" class="score-tab-btn flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'export' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ScorePortal.switchTab('export')" style="border:none;">
                <i data-lucide="globe" style="width:18px"></i> Tạo Trang Web
            </button>
            <button data-tab="data" class="score-tab-btn flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'data' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ScorePortal.switchTab('data')" style="border:none;">
                <i data-lucide="database" style="width:18px"></i> Nguồn Điểm & Cấu Hinh
            </button>
        `;

        return `
            <div class="modal-container pro-card shadow-2xl font-sans relative" onclick="event.stopPropagation()" style="max-width: 1050px; width: 95%; border-radius: 28px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5);">
                <!-- Header -->
                <div class="modal-header flex justify-between items-center p-6 border-b" style="border-color: #e2e8f0; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-top-left-radius: 28px; border-top-right-radius: 28px; color: white;">
                    <div class="flex items-center gap-3">
                        <div class="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner flex items-center justify-center">
                            <i data-lucide="graduation-cap" style="width:32px; height:32px; color: white;"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-black tracking-wide" style="margin:0;">CỔNG TRA CỨU & BÁO ĐIỂM THI THỬ THPT</h2>
                            <p class="text-xs text-emerald-100 font-semibold mt-0.5" style="margin:0;">Trường THPT Cao Bá Quát — Hệ thống quản trị viên</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="btn-refresh-mini bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-all" onclick="ScorePortal.closeModal()" style="border:none; cursor:pointer;">
                            <i data-lucide="x" style="width:22px; height:22px;"></i>
                        </button>
                    </div>
                </div>

                <!-- TABS -->
                <div class="flex border-b bg-slate-50/70 p-2 gap-2 shadow-inner overflow-x-auto" style="border-color: #e2e8f0;">
                    ${tabsHTML}
                </div>

                <!-- CONTENT BODY -->
                <div id="score-portal-content" class="p-6" style="min-height: 480px; max-height: 72vh; overflow-y: auto;">
                </div>
            </div>
        `;
    };

    const renderTabContent = () => {
        const c = document.getElementById('score-portal-content');
        if (!c) return;

        if (activeTab === 'kiosk') c.innerHTML = getKioskTabHTML();
        else if (activeTab === 'stats') c.innerHTML = getStatsTabHTML();
        else if (activeTab === 'zalo') c.innerHTML = getZaloTabHTML();
        else if (activeTab === 'export') c.innerHTML = getExportTabHTML();
        else if (activeTab === 'data') c.innerHTML = getDataTabHTML();

        if (activeTab === 'kiosk') {
            const inp = document.getElementById('score-search-inp');
            if (inp) {
                inp.value = currentSearchTerm;
                inp.addEventListener('input', (e) => {
                    currentSearchTerm = e.target.value.trim().toLowerCase();
                    renderSearchResults();
                });
            }
            const sel = document.getElementById('score-class-select');
            if (sel) {
                sel.value = selectedClass;
                sel.addEventListener('change', (e) => {
                    selectedClass = e.target.value;
                    renderSearchResults();
                });
            }
            const selSub = document.getElementById('score-subject-select');
            if (selSub) {
                selSub.value = selectedSubject;
                selSub.addEventListener('change', (e) => {
                    selectedSubject = e.target.value;
                    renderSearchResults();
                });
            }
            renderSearchResults();
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // --- SCORE BADGE HELPER ---
    const getScoreBadge = (scoreNum) => {
        if (scoreNum === "" || scoreNum === null || scoreNum === undefined || isNaN(scoreNum)) return '<span class="text-slate-400 font-normal">--</span>';
        const num = parseFloat(scoreNum);
        const disp = num.toString();
        if (num <= 1.0) return `<span class="bg-red-100 text-red-700 font-black px-2.5 py-1 rounded-lg border border-red-200">💥 ${disp} (Liệt)</span>`;
        if (num < 5.0) return `<span class="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-lg">${disp}</span>`;
        if (num >= 8.0) return `<span class="bg-emerald-100 text-emerald-700 font-black px-2.5 py-1 rounded-lg border border-emerald-300">✨ ${disp}</span>`;
        return `<span class="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg">${disp}</span>`;
    };

    // --- TAB 1: KIOSK LIVE SEARCH ---
    const getKioskTabHTML = () => {
        const lops = new Set();
        if (typeof excelData !== 'undefined' && excelData && excelData.length > 0) {
            const m = detectedMapping;
            excelData.forEach(r => {
                if (r[m.lop]) {
                    const l = String(r[m.lop]).trim();
                    if (l) lops.add(l);
                }
            });
        }

        if (typeof window.generatedRooms !== 'undefined' && window.generatedRooms) {
            window.generatedRooms.forEach(room => {
                (room.students || []).forEach(std => {
                    if (std.lop) {
                        const l = String(std.lop).trim();
                        if (l) lops.add(l);
                    }
                });
            });
        }

        const sortedLops = Array.from(lops).sort();
        const classOptions = sortedLops.map(l => `<option value="${l}" ${l === selectedClass ? 'selected' : ''}>${l}</option>`).join('');

        return `
            <div class="max-w-4xl mx-auto space-y-6 font-sans">
                <!-- Branding Header -->
                <div class="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                    <div class="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <div class="space-y-1 relative z-10">
                        <div class="text-[10px] font-black uppercase tracking-widest text-emerald-300 opacity-90">${ownerDepartment.toUpperCase()}</div>
                        <div class="text-sm font-extrabold uppercase tracking-wide text-white">${ownerSchool.toUpperCase()}</div>
                        <h1 class="text-xl font-black uppercase tracking-wider text-white mt-1">CỔNG TRA CỨU ĐIỂM THI TRỰC TUYẾN</h1>
                    </div>
                    <div class="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-wider whitespace-nowrap text-emerald-200">
                        KỲ THI THỬ TN THPT
                    </div>
                </div>

                <!-- Search & Filter Controls -->
                <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-4">
                    <div class="flex items-center gap-2 text-slate-800 font-black text-base mb-1">
                        <i data-lucide="filter" style="width:20px; color:#059669"></i>
                        <span>Bộ lọc tra cứu dữ liệu</span>
                    </div>
                    <div class="grid grid-cols-1 ${currentRole === 'STUDENT' ? '' : 'md:grid-cols-3'} gap-4">
                        <!-- Search Bar -->
                        <div class="relative bg-slate-100 p-2.5 rounded-2xl border border-slate-200 shadow-inner flex items-center">
                            <i data-lucide="search" style="width:20px; color:#059669; margin-left:8px"></i>
                            <input id="score-search-inp" type="text" class="bg-transparent form-control border-none shadow-none flex-1 font-bold text-slate-800 focus:outline-none" style="padding-left:12px;" placeholder="Nhập SBD hoặc Họ tên để tra cứu...">
                        </div>
                        
                        ${currentRole === 'STUDENT' ? '' : `
                        <!-- Class Selector Dropdown -->
                        <div class="relative bg-slate-100 p-2.5 rounded-2xl border border-slate-200 shadow-inner flex items-center">
                            <i data-lucide="users" style="width:20px; color:#059669; margin-left:8px"></i>
                            <select id="score-class-select" class="bg-transparent border-none outline-none flex-1 font-bold text-slate-800 cursor-pointer" style="padding-left:12px;">
                                <option value="">-- Tất cả lớp / Tra cứu cá nhân --</option>
                                ${classOptions}
                            </select>
                        </div>

                        <!-- Subject Selector Dropdown -->
                        <div class="relative bg-slate-100 p-2.5 rounded-2xl border border-slate-200 shadow-inner flex items-center">
                            <i data-lucide="book-open" style="width:20px; color:#059669; margin-left:8px"></i>
                            <select id="score-subject-select" class="bg-transparent border-none outline-none flex-1 font-bold text-slate-800 cursor-pointer" style="padding-left:12px;">
                                <option value="">-- Tất cả môn thi --</option>
                                <option value="toan" ${selectedSubject === 'toan' ? 'selected' : ''}>Toán học</option>
                                <option value="van" ${selectedSubject === 'van' ? 'selected' : ''}>Ngữ văn</option>
                                <option value="ngoaingu" ${selectedSubject === 'ngoaingu' ? 'selected' : ''}>Ngoại ngữ</option>
                                <option value="ly" ${selectedSubject === 'ly' ? 'selected' : ''}>Vật lý</option>
                                <option value="hoa" ${selectedSubject === 'hoa' ? 'selected' : ''}>Hóa học</option>
                                <option value="sinh" ${selectedSubject === 'sinh' ? 'selected' : ''}>Sinh học</option>
                                <option value="su" ${selectedSubject === 'su' ? 'selected' : ''}>Lịch sử</option>
                                <option value="dia" ${selectedSubject === 'dia' ? 'selected' : ''}>Địa lý</option>
                                <option value="gdkt" ${selectedSubject === 'gdkt' ? 'selected' : ''}>GDKTPL</option>
                                <option value="tin" ${selectedSubject === 'tin' ? 'selected' : ''}>Tin học</option>
                                <option value="cnc" ${selectedSubject === 'cnc' ? 'selected' : ''}>CN Công nghiệp</option>
                                <option value="cnn" ${selectedSubject === 'cnn' ? 'selected' : ''}>CN Nông nghiệp</option>
                            </select>
                        </div>
                        `}
                    </div>
                </div>

                <!-- Result Container -->
                <div id="score-kiosk-result-area" class="space-y-6">
                </div>
            </div>
        `;
    };

    // --- LOOKUP REGISTERED SUBJECTS HELPER ---
    const getRegisteredSubjectsForStudent = (sbd, scoreRow) => {
        if (!sbd) return ['Chưa xác định'];
        const cleanSBD = String(sbd).trim().toLowerCase();

        if (typeof window !== 'undefined' && window.dataStore) {
            for (let fn of Object.keys(window.dataStore)) {
                const fileObj = window.dataStore[fn];
                const d = fileObj?.data || [];
                const mp = fileObj?.mapping || null;
                if (d.length > 0 && mp && mp.sbd) {
                    const found = d.find(r => String(r[mp.sbd]).trim().toLowerCase() === cleanSBD);
                    if (found && typeof window.getFullStudentSubjects === 'function') {
                        const subs = window.getFullStudentSubjects(found, mp);
                        if (subs && subs.length > 0) return subs;
                    }
                }
            }
        }

        if (typeof window !== 'undefined' && typeof window.getFullStudentSubjects === 'function') {
            const subs = window.getFullStudentSubjects(scoreRow, detectedMapping);
            if (subs && subs.length > 0) return subs;
        }

        const m = detectedMapping;
        const inferred = [];
        const check = (key, label) => {
            if (m[key] && scoreRow[m[key]] !== undefined && scoreRow[m[key]] !== "" && scoreRow[m[key]] !== null && !isNaN(parseFloat(scoreRow[m[key]]))) {
                inferred.push(label);
            }
        };
        check('toan', 'Toán'); check('van', 'Ngữ văn'); check('ngoaingu', 'Ngoại ngữ');
        check('ly', 'Vật lý'); check('hoa', 'Hóa học'); check('sinh', 'Sinh học');
        check('su', 'Lịch sử'); check('dia', 'Địa lý'); check('gdkt', 'GDKTPL');
        check('tin', 'Tin học'); check('cnc', 'CN Công nghiệp'); check('cnn', 'CN Nông nghiệp');

        return inferred.length > 0 ? inferred : ['Chưa xác định'];
    };

    const renderSearchResults = () => {
        const area = document.getElementById('score-kiosk-result-area');
        if (!area) return;

        if (currentRole === 'STUDENT') {
            selectedClass = '';
            selectedSubject = '';
        }

        if (currentRole !== 'STUDENT' && (selectedClass || selectedSubject || !currentSearchTerm)) {
            renderClassGradebook();
            return;
        }

        if (!currentSearchTerm) {
            area.innerHTML = `
                <div class="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                    <i data-lucide="award" style="width:48px; height:48px; color:#94a3b8; margin: 0 auto 12px auto;"></i>
                    <div class="font-bold text-slate-600 text-lg">Kiosk Tra Cứu Trực Tuyến Sẵn Sàng</div>
                    <div class="text-slate-400 text-sm mt-1">Gõ Số báo danh hoặc tên học sinh ở khung trên để xem ngay Phiếu Báo Điểm Kỹ Thuật Số.</div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        let matches = [];
        const m = detectedMapping;

        // 1. Tìm trong excelData (Điểm)
        if (typeof excelData !== 'undefined' && excelData && excelData.length > 0) {
            excelData.forEach(row => {
                const sbd = String(row[m.sbd] || '').toLowerCase().trim();
                const name = String(row[m.name] || '').toLowerCase().trim();
                if (sbd.includes(currentSearchTerm) || name.includes(currentSearchTerm)) {
                    matches.push({ type: 'score', data: row, sbdStr: sbd, nameStr: name });
                }
            });
        }

        // 2. Tìm trong generatedRooms (Phòng thi)
        if (typeof window.generatedRooms !== 'undefined' && window.generatedRooms) {
            window.generatedRooms.forEach(room => {
                (room.students || []).forEach(std => {
                    const sbd = String(std.sbd || '').toLowerCase().trim();
                    const name = String(std.hoten || '').toLowerCase().trim();
                    if (sbd.includes(currentSearchTerm) || name.includes(currentSearchTerm)) {
                        let existing = matches.find(x => x.sbdStr === sbd);
                        if (existing) {
                            existing.examInfo = { room: room.number, profile: std };
                        } else {
                            matches.push({ type: 'exam', data: {}, sbdStr: sbd, nameStr: name, examInfo: { room: room.number, profile: std } });
                        }
                    }
                });
            });
        }

        if (matches.length === 0) {
            area.innerHTML = `
                <div class="text-center py-12 bg-red-50 rounded-3xl border border-red-200 text-red-600">
                    <i data-lucide="user-x" style="width:48px; height:48px; margin: 0 auto 12px auto;"></i>
                    <div class="font-black text-lg">Không tìm thấy học sinh phù hợp!</div>
                    <div class="text-sm text-red-500 mt-1">Vui lòng kiểm tra lại Số báo danh hoặc Họ và tên chính xác.</div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        area.innerHTML = matches.map(match => {
            let sbd = '---';
            let name = 'Chưa có tên';
            let lop = '---';
            let cccd = '';

            if (match.type === 'score' || match.data) {
                sbd = match.data[m.sbd] || '---';
                name = match.data[m.name] || 'Chưa có tên';
                lop = match.data[m.lop] || '---';
            }

            if (match.examInfo) {
                sbd = match.examInfo.profile.sbd || sbd;
                name = match.examInfo.profile.hoten || name;
                lop = match.examInfo.profile.lop || lop;
                cccd = match.examInfo.profile.cccd || match.examInfo.profile.ngaysinh || cccd;
            }

            const rawSbd = sbd;
            sbd = escapeHTML(sbd);
            name = escapeHTML(name);
            lop = escapeHTML(lop);
            cccd = escapeHTML(cccd);

            const regSubs = getRegisteredSubjectsForStudent(rawSbd, match.data || {});

            let scoresHtml = '';
            let universityHtml = '';
            let scoreTitleHtml = '';
            let hasScores = false;

            if (match.type === 'score' || (match.data && Object.keys(match.data).length > 0)) {
                const std = match.data;
                const toan = parseFloat(std[m.toan] || 0) || 0;
                const van = parseFloat(std[m.van] || 0) || 0;
                const anh = parseFloat(std[m.ngoaingu] || 0) || 0;
                const ly = parseFloat(std[m.ly] || 0) || 0;
                const hoa = parseFloat(std[m.hoa] || 0) || 0;
                const sinh = parseFloat(std[m.sinh] || 0) || 0;
                const su = parseFloat(std[m.su] || 0) || 0;
                const dia = parseFloat(std[m.dia] || 0) || 0;
                const gdkt = parseFloat(std[m.gdkt] || 0) || 0;
                const tin = parseFloat(std[m.tin] || 0) || 0;
                const cnc = parseFloat(std[m.cnc] || 0) || 0;
                const cnn = parseFloat(std[m.cnn] || 0) || 0;

                const scoresArr = [toan, van, anh, ly, hoa, sinh, su, dia, gdkt, tin, cnc, cnn].filter(s => s > 0);
                if (scoresArr.length > 0) hasScores = true;

                if (hasScores) {
                    const isLiet = scoresArr.some(s => s <= 1.0);
                    const kA00 = (toan + ly + hoa).toFixed(2);
                    const kB00 = (toan + hoa + sinh).toFixed(2);
                    const kC00 = (van + su + dia).toFixed(2);
                    const kD01 = (toan + van + anh).toFixed(2);
                    const kA01 = (toan + ly + anh).toFixed(2);

                    scoreTitleHtml = `
                        <div class="text-right flex items-center gap-4">
                            <div class="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-center">
                                <div class="text-xs uppercase font-extrabold text-emerald-200">XẾP LOẠI</div>
                                <div class="text-xl font-black mt-1 ${isLiet ? 'text-red-300' : 'text-yellow-300'}">${isLiet ? '⚠️ ĐIỂM LIỆT' : '✨ ĐẠT'}</div>
                            </div>
                        </div>
                    `;

                    scoresHtml = `
                        <div>
                            <div class="flex items-center gap-2 text-slate-700 font-extrabold text-sm uppercase tracking-wider mb-4 border-b pb-2">
                                <i data-lucide="book-check" style="width:18px; color:#059669"></i>
                                <span>Bảng Điểm Môn Thi Chi Tiết</span>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Toán học:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.toan])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Ngữ văn:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.van])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Ngoại ngữ:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.ngoaingu])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Vật lý:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.ly])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Hóa học:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.hoa])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Sinh học:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.sinh])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Lịch sử:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.su])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Địa lý:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.dia])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">GDKTPL:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.gdkt])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">Tin học:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.tin])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">CN Công nghiệp:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.cnc])}</span>
                                </div>
                                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <span class="font-bold text-slate-600">CN Nông nghiệp:</span>
                                    <span class="text-lg">${getScoreBadge(std[m.cnn])}</span>
                                </div>
                            </div>
                        </div>
                    `;

                    universityHtml = `
                        <div>
                            <div class="flex items-center gap-2 text-slate-700 font-extrabold text-sm uppercase tracking-wider mb-4 border-b pb-2">
                                <i data-lucide="calculator" style="width:18px; color:#2563eb"></i>
                                <span>Điểm Khối Xét Tuyển Đại Học (Tự Động Tính)</span>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-2xl text-center shadow-md">
                                    <div class="font-black text-lg">A00</div>
                                    <div class="text-xs text-blue-100 mt-0.5">(Toán, Lý, Hóa)</div>
                                    <div class="text-2xl font-black mt-2 tracking-wide">${kA00 > 0 ? kA00 : '--'}</div>
                                </div>
                                <div class="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-2xl text-center shadow-md">
                                    <div class="font-black text-lg">B00</div>
                                    <div class="text-xs text-emerald-100 mt-0.5">(Toán, Hóa, Sinh)</div>
                                    <div class="text-2xl font-black mt-2 tracking-wide">${kB00 > 0 ? kB00 : '--'}</div>
                                </div>
                                <div class="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 rounded-2xl text-center shadow-md">
                                    <div class="font-black text-lg">C00</div>
                                    <div class="text-xs text-amber-100 mt-0.5">(Văn, Sử, Địa)</div>
                                    <div class="text-2xl font-black mt-2 tracking-wide">${kC00 > 0 ? kC00 : '--'}</div>
                                </div>
                                <div class="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-4 rounded-2xl text-center shadow-md">
                                    <div class="font-black text-lg">D01</div>
                                    <div class="text-xs text-rose-100 mt-0.5">(Toán, Văn, Anh)</div>
                                    <div class="text-2xl font-black mt-2 tracking-wide">${kD01 > 0 ? kD01 : '--'}</div>
                                </div>
                                <div class="bg-gradient-to-br from-purple-500 to-violet-600 text-white p-4 rounded-2xl text-center shadow-md">
                                    <div class="font-black text-lg">A01</div>
                                    <div class="text-xs text-purple-100 mt-0.5">(Toán, Lý, Anh)</div>
                                    <div class="text-2xl font-black mt-2 tracking-wide">${kA01 > 0 ? kA01 : '--'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            // Check if we already have exam room info, else mock one
            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SBD:' + encodeURIComponent(rawSbd);
            let roomNumber = 'Chưa xếp';
            let seatNumber = 'Chưa xếp';
            let examLocation = ownerSchool;

            if (match.examInfo) {
                roomNumber = match.examInfo.room || roomNumber;
                seatNumber = match.examInfo.profile.sbd ? (parseInt(match.examInfo.profile.sbd.slice(-2)) || 12) : 12;
            } else {
                // Generate standard mock seat/room for students who don't have mapped room data
                const sbdNum = parseInt(rawSbd.replace(/[^0-9]/g, '')) || 99;
                roomNumber = String(Math.floor(sbdNum / 24) + 1).padStart(2, '0');
                seatNumber = String((sbdNum % 24) + 1).padStart(2, '0');
            }

            const examCardHtml = `
                <div class="bg-amber-50/50 p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                    
                    <div class="flex flex-col md:flex-row gap-6 items-center">
                        <div class="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 relative flex items-center justify-center">
                            <img src="${qrUrl}" alt="QR Code" class="w-24 h-24 object-contain rounded-lg">
                        </div>
                        <div class="flex-1 space-y-2 text-center md:text-left">
                            <div class="text-amber-800 font-extrabold uppercase text-xs tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                                <i data-lucide="contact" class="w-4 h-4 text-amber-600"></i>
                                <span>THẺ DỰ THI ĐIỆN TỬ (CHỨNG NHẬN SỐ)</span>
                            </div>
                            <h4 class="text-2xl font-black text-slate-800">PHÒNG THI SỐ ${escapeHTML(roomNumber)}</h4>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600 font-semibold mt-2">
                                <div class="bg-white/80 p-2 rounded-xl border border-slate-200">Mã Số Thí Sinh: <b class="text-slate-900 block text-sm font-black mt-0.5">${sbd}</b></div>
                                <div class="bg-white/80 p-2 rounded-xl border border-slate-200">Số Ghế Ngồi: <b class="text-amber-700 block text-sm font-black mt-0.5">${escapeHTML(seatNumber)}</b></div>
                                <div class="bg-white/80 p-2 rounded-xl border border-slate-200 col-span-2 md:col-span-1">Điểm Thi: <b class="text-slate-900 block text-sm font-black mt-0.5 truncate">${escapeHTML(examLocation)}</b></div>
                            </div>
                        </div>
                        <div class="text-center md:text-right w-full md:w-auto">
                            <button onclick="window.printDigitalCard('${rawSbd.replace(/'/g, "\\'")}')" class="px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl text-xs font-black shadow-md border-0 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto md:ml-auto cursor-pointer" style="border:none;">
                                <i data-lucide="printer" class="w-4 h-4"></i>
                                <span>IN THẺ DỰ THI</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            let aiAdvisorHtml = '';
            if (hasScores) {
                const std = match.data;
                const toan = parseFloat(std[m.toan] || 0) || 0;
                const van = parseFloat(std[m.van] || 0) || 0;
                const anh = parseFloat(std[m.ngoaingu] || 0) || 0;
                const ly = parseFloat(std[m.ly] || 0) || 0;
                const hoa = parseFloat(std[m.hoa] || 0) || 0;
                const sinh = parseFloat(std[m.sinh] || 0) || 0;
                const su = parseFloat(std[m.su] || 0) || 0;
                const dia = parseFloat(std[m.dia] || 0) || 0;
                const gdkt = parseFloat(std[m.gdkt] || 0) || 0;
                const tin = parseFloat(std[m.tin] || 0) || 0;
                const cnc = parseFloat(std[m.cnc] || 0) || 0;
                const cnn = parseFloat(std[m.cnn] || 0) || 0;

                const blocks = [
                    { name: 'A00', score: toan + ly + hoa, subjects: 'Toán, Lý, Hóa' },
                    { name: 'B00', score: toan + hoa + sinh, subjects: 'Toán, Hóa, Sinh' },
                    { name: 'C00', score: van + su + dia, subjects: 'Văn, Sử, Địa' },
                    { name: 'D01', score: toan + van + anh, subjects: 'Toán, Văn, Anh' },
                    { name: 'A01', score: toan + ly + anh, subjects: 'Toán, Lý, Anh' }
                ];

                blocks.sort((a, b) => b.score - a.score);
                const bestBlock = blocks[0];

                let advice = '';
                let careers = [];
                if (bestBlock.score >= 27) {
                    advice = `Mức điểm ${bestBlock.name} cực kỳ xuất sắc (${bestBlock.score.toFixed(2)}đ). Bạn nằm trong Top những thí sinh xuất sắc nhất trường. Hãy tự tin ứng tuyển vào các ngành học hot và có tính cạnh tranh cao nhất tại các trường đại học top đầu Việt Nam!`;
                    careers = ['Y Khoa, Dược học', 'Khoa học máy tính, AI', 'Kinh tế đối ngoại, Logistic', 'Quan hệ quốc tế'];
                } else if (bestBlock.score >= 24) {
                    advice = `Mức điểm ${bestBlock.name} rất ấn tượng (${bestBlock.score.toFixed(2)}đ). Cơ hội trúng tuyển vào các trường đại học uy tín là rất lớn. Hãy lựa chọn các ngành thế mạnh của bạn.`;
                    careers = ['Công nghệ thông tin', 'Quản trị kinh doanh, Marketing', 'Ngôn ngữ Anh', 'Kỹ thuật ô tô'];
                } else if (bestBlock.score >= 20) {
                    advice = `Điểm số khối ${bestBlock.name} đạt mức Khá tốt (${bestBlock.score.toFixed(2)}đ). Đây là ngưỡng điểm an toàn để chọn ngành học triển vọng. Hãy cân đối giữa các trường top giữa.`;
                    careers = ['Kế toán, Tài chính ngân hàng', 'Sư phạm, Tâm lý học', 'Quản trị du lịch & lữ hành', 'Công nghệ thực phẩm'];
                } else if (bestBlock.score >= 15) {
                    advice = `Ngưỡng điểm khối ${bestBlock.name} ở mức Trung bình khá (${bestBlock.score.toFixed(2)}đ). Phù hợp xét tuyển vào các trường đại học ứng dụng, đại học địa phương hoặc xét tuyển học bạ kết hợp.`;
                    careers = ['Quản trị văn phòng', 'Kỹ thuật xây dựng', 'Nông lâm nghiệp, Thú y', 'Đất đai'];
                } else {
                    advice = `Điểm số khối ${bestBlock.name} đang ở mức trung bình (${bestBlock.score.toFixed(2)}đ). Hãy tăng cường ôn tập để cải thiện trong kỳ thi tốt nghiệp chính thức sắp tới.`;
                    careers = ['Kỹ thuật - Công nghệ (Cao đẳng)', 'Quản trị khách sạn', 'Thiết kế đồ họa', 'Thương mại điện tử'];
                }

                aiAdvisorHtml = `
                    <div class="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 rounded-3xl border border-emerald-500/20 space-y-4">
                        <div class="flex items-center gap-2.5 text-emerald-800 font-black text-base">
                            <div class="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <i data-lucide="sparkles" class="w-4 h-4 animate-pulse"></i>
                            </div>
                            <span>TRỢ LÝ HƯỚNG NGHIỆP AI (AI ADVISOR)</span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div class="bg-white p-4.5 rounded-2xl border border-emerald-500/20 shadow-xs text-center space-y-2" style="border:1px solid rgba(16,185,129,0.2); padding:16px;">
                                <div class="text-[10px] font-black text-slate-400 uppercase">Khối xét tuyển ưu thế nhất</div>
                                <div class="text-3xl font-black text-emerald-700">${bestBlock.name}</div>
                                <div class="text-[11px] font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full inline-block">${bestBlock.score.toFixed(2)} Điểm</div>
                            </div>
                            <div class="md:col-span-2 space-y-3 text-left">
                                <div class="text-xs text-slate-700 font-medium leading-relaxed italic">
                                    "${advice}"
                                </div>
                                <div class="space-y-1.5">
                                    <div class="text-[10px] font-black text-slate-400 uppercase tracking-wide">Ngành nghề gợi ý phù hợp:</div>
                                    <div class="flex flex-wrap gap-1.5">
                                        ${careers.map(c => `<span class="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-xl">${c}</span>`).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 font-sans">
                    <!-- Student Header -->
                    <div class="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 p-6 text-white flex justify-between items-center flex-wrap gap-4">
                        <div class="text-left">
                            <div class="text-xs font-extrabold uppercase tracking-widest text-emerald-200">CỔNG THÔNG TIN THÍ SINH</div>
                            <h3 class="text-2xl font-black mt-1 uppercase tracking-wide">${name}</h3>
                            <div class="flex items-center gap-4 mt-2 text-sm font-semibold text-emerald-100">
                                <span class="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md text-white font-extrabold">SBD: ${sbd}</span>
                                <span class="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md text-white font-extrabold">Lớp: ${lop}</span>
                            </div>
                            <div class="mt-3.5 bg-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md border border-white/20 text-xs text-white inline-flex items-center gap-2 shadow-inner">
                                <span class="text-emerald-200 font-extrabold uppercase">Môn đăng ký:</span>
                                <span class="font-bold text-white tracking-wide">${regSubs.join(', ')}</span>
                            </div>
                        </div>
                        ${scoreTitleHtml}
                    </div>

                    <div class="p-8 space-y-8 bg-slate-50/50">
                        <!-- Exam Info Section (Always render) -->
                        ${examCardHtml}
                        
                        <!-- Scores Grid -->
                        ${hasScores ? scoresHtml : ''}
                        
                        <!-- University Block Combinations -->
                        ${hasScores ? universityHtml : ''}

                        <!-- AI Advisor -->
                        ${aiAdvisorHtml}
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const renderClassGradebook = () => {
        const area = document.getElementById('score-kiosk-result-area');
        if (!area) return;

        const m = detectedMapping;
        const studentsMap = new Map();

        if (typeof excelData !== 'undefined' && excelData && excelData.length > 0) {
            excelData.forEach(row => {
                const sClass = String(row[m.lop] || '').trim().toUpperCase();
                const matchesClass = !selectedClass || sClass === selectedClass.toUpperCase();
                if (matchesClass) {
                    const sbd = String(row[m.sbd] || '').trim();
                    studentsMap.set(sbd, { sbd, name: row[m.name] || '', lop: row[m.lop] || '', scoreData: row });
                }
            });
        }

        if (typeof window.generatedRooms !== 'undefined' && window.generatedRooms) {
            window.generatedRooms.forEach(room => {
                (room.students || []).forEach(std => {
                    const sClass = String(std.lop || '').trim().toUpperCase();
                    const matchesClass = !selectedClass || sClass === selectedClass.toUpperCase();
                    if (matchesClass) {
                        const sbd = String(std.sbd || '').trim();
                        if (studentsMap.has(sbd)) {
                            studentsMap.get(sbd).profile = std;
                            studentsMap.get(sbd).room = room.number;
                        } else {
                            studentsMap.set(sbd, { sbd, name: std.hoten || '', lop: std.lop || '', profile: std, room: room.number, scoreData: {} });
                        }
                    }
                });
            });
        }

        let filtered = Array.from(studentsMap.values());

        if (selectedSubject) {
            filtered = filtered.filter(s => {
                const val = s.scoreData[m[selectedSubject]];
                return val !== undefined && val !== "" && val !== null && !isNaN(parseFloat(val));
            });
        }

        if (currentSearchTerm) {
            filtered = filtered.filter(s =>
                String(s.sbd).toLowerCase().includes(currentSearchTerm) ||
                String(s.name).toLowerCase().includes(currentSearchTerm)
            );
        }

        let titleStr = '';
        if (selectedClass) titleStr += `LỚP ${selectedClass}`;
        if (selectedSubject) {
            const labelMap = { toan: 'TOÁN', van: 'VĂN', ngoaingu: 'NGOẠI NGỮ', ly: 'VẬT LÝ', hoa: 'HÓA HỌC', sinh: 'SINH HỌC', su: 'LỊCH SỬ', dia: 'ĐỊA LÝ', gdkt: 'GDKTPL', tin: 'TIN HỌC', cnc: 'CN CÔNG NGHIỆP', cnn: 'CN NÔNG NGHIỆP' };
            titleStr += (titleStr ? ' - ' : '') + `MÔN ${labelMap[selectedSubject] || selectedSubject.toUpperCase()}`;
        }
        if (!titleStr) titleStr = 'TẤT CẢ HỌC SINH';

        if (filtered.length === 0) {
            area.innerHTML = `
                <div class="text-center py-12 bg-red-50 rounded-3xl border border-red-200 text-red-600">
                    <i data-lucide="user-x" style="width:48px; height:48px; margin: 0 auto 12px auto;"></i>
                    <div class="font-black text-lg">Không tìm thấy học sinh phù hợp!</div>
                    <div class="text-sm text-red-500 mt-1">Không tìm thấy học sinh nào khớp với bộ lọc ${titleStr}.</div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const activeCols = {
            toan: false, van: false, ngoaingu: false,
            ly: false, hoa: false, sinh: false,
            su: false, dia: false, gdkt: false,
            tin: false, cnc: false, cnn: false
        };

        filtered.forEach(s => {
            Object.keys(activeCols).forEach(k => {
                const val = s.scoreData[m[k]];
                if (val !== undefined && val !== "" && val !== null && !isNaN(parseFloat(val))) {
                    activeCols[k] = true;
                }
            });
        });

        const colDefinitions = [
            { key: 'toan', label: 'Toán' },
            { key: 'van', label: 'Văn' },
            { key: 'ngoaingu', label: 'Ngoại ngữ' },
            { key: 'ly', label: 'Vật lý' },
            { key: 'hoa', label: 'Hóa học' },
            { key: 'sinh', label: 'Sinh học' },
            { key: 'su', label: 'Lịch sử' },
            { key: 'dia', label: 'Địa lý' },
            { key: 'gdkt', label: 'GDKTPL' },
            { key: 'tin', label: 'Tin học' },
            { key: 'cnc', label: 'CN Công nghiệp' },
            { key: 'cnn', label: 'CN Nông nghiệp' }
        ];

        const headersToDisplay = colDefinitions.filter(d => activeCols[d.key]);

        let tableHtml = `
            <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
                <div class="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 p-6 text-white flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <div class="text-xs font-extrabold uppercase tracking-widest text-emerald-200">BẢNG ĐIỂM CHI TIẾT</div>
                        <h3 class="text-2xl font-black mt-1 uppercase tracking-wide">BẢNG ĐIỂM ${titleStr}</h3>
                        <p class="text-xs text-emerald-100 font-semibold mt-1">Sỹ số hiển thị: ${filtered.length} học sinh</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm shadow-black/10 cursor-pointer" onclick="ScorePortal.printClassGradebook('${selectedClass}', '${selectedSubject}')">
                            <i data-lucide="printer" style="width:14px"></i> In Bảng Điểm
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-slate-700">
                        <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100 font-extrabold">
                            <tr>
                                <th class="px-4 py-4 text-center">STT</th>
                                <th class="px-6 py-4">Họ và tên</th>
                                <th class="px-4 py-4 text-center">SBD</th>
                                <th class="px-4 py-4 text-center">Phòng</th>
                                ${headersToDisplay.map(h => `<th class="px-4 py-4 text-center font-bold">${h.label}</th>`).join('')}
                                <th class="px-4 py-4 text-center">Tổ hợp Đại học</th>
                                <th class="px-4 py-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 font-medium">
        `;

        tableHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        area.innerHTML = tableHtml;
        
        // --- PHASE 3 DOM OPTIMIZATION: DocumentFragment ---
        const tbody = area.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
            const frag = document.createDocumentFragment();
            
            filtered.forEach((s, idx) => {
                const t = parseFloat(s.scoreData[m.toan] || 0) || 0;
                const v = parseFloat(s.scoreData[m.van] || 0) || 0;
                const a = parseFloat(s.scoreData[m.ngoaingu] || 0) || 0;
                const l = parseFloat(s.scoreData[m.ly] || 0) || 0;
                const h = parseFloat(s.scoreData[m.hoa] || 0) || 0;
                const si = parseFloat(s.scoreData[m.sinh] || 0) || 0;
                const su = parseFloat(s.scoreData[m.su] || 0) || 0;
                const dia = parseFloat(s.scoreData[m.dia] || 0) || 0;

                const a00 = (t + l + h).toFixed(2);
                const b00 = (t + h + si).toFixed(2);
                const c00 = (v + su + dia).toFixed(2);
                const d01 = (t + v + a).toFixed(2);
                const a01 = (t + l + a).toFixed(2);

                const blocks = [];
                if (a00 > 0 && (t > 0 && l > 0 && h > 0)) blocks.push(`A00: ${a00}`);
                if (b00 > 0 && (t > 0 && h > 0 && si > 0)) blocks.push(`B00: ${b00}`);
                if (c00 > 0 && (v > 0 && su > 0 && dia > 0)) blocks.push(`C00: ${c00}`);
                if (d01 > 0 && (t > 0 && v > 0 && a > 0)) blocks.push(`D01: ${d01}`);
                if (a01 > 0 && (t > 0 && l > 0 && a > 0)) blocks.push(`A01: ${a01}`);

                const bestBlock = blocks.length > 0 ? blocks.sort((x, y) => parseFloat(y.split(': ')[1]) - parseFloat(x.split(': ')[1]))[0] : '--';
                
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/80 transition-all";
                tr.innerHTML = `
                    <td class="px-4 py-3.5 text-center text-slate-400 font-semibold">${idx + 1}</td>
                    <td class="px-6 py-3.5 font-bold text-slate-900">${escapeHTML(s.name)}</td>
                    <td class="px-4 py-3.5 text-center font-mono font-bold text-blue-700">${escapeHTML(s.sbd)}</td>
                    <td class="px-4 py-3.5 text-center"><span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg text-xs font-extrabold">${escapeHTML(s.room || '--')}</span></td>
                    ${headersToDisplay.map(h => {
                        const val = s.scoreData[m[h.key]];
                        return `<td class="px-4 py-3.5 text-center font-bold">${getScoreBadge(val)}</td>`;
                    }).join('')}
                    <td class="px-4 py-3.5 text-center">
                        <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-xl text-xs font-black">${escapeHTML(bestBlock)}</span>
                    </td>
                    <td class="px-4 py-3.5 text-center">
                        <button class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 mx-auto transition-all border border-emerald-100 shadow-xs cursor-pointer" onclick="ScorePortal.showStudentDetail('${escapeHTML(s.sbd).replace(/'/g, "\\'")}')">
                            <i data-lucide="eye" style="width:12px"></i> Xem chi tiết
                        </button>
                    </td>`;
                frag.appendChild(tr);
            });
            tbody.appendChild(frag);
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const showStudentDetail = (sbd) => {
        selectedClass = '';
        currentSearchTerm = sbd;
        const classSel = document.getElementById('score-class-select');
        if (classSel) classSel.value = '';
        const inp = document.getElementById('score-search-inp');
        if (inp) inp.value = sbd;
        renderTabContent();
    };

    const printClassGradebook = (className, subjectName) => {
        const table = document.querySelector('.overflow-x-auto').innerHTML;
        const win = window.open('', '_blank');
        let titleStr = '';
        if (className) titleStr += `LỚP ${className}`;
        if (subjectName) {
            const labelMap = { toan: 'TOÁN', van: 'VĂN', ngoaingu: 'NGOẠI NGỮ', ly: 'VẬT LÝ', hoa: 'HÓA HỌC', sinh: 'SINH HỌC', su: 'LỊCH SỬ', dia: 'ĐỊA LÝ', gdkt: 'GDKTPL', tin: 'TIN HỌC', cnc: 'CN CÔNG NGHIỆP', cnn: 'CN NÔNG NGHIỆP' };
            titleStr += (titleStr ? ' - ' : '') + `MÔN ${labelMap[subjectName] || subjectName.toUpperCase()}`;
        }
        win.document.write(`
            <html>
            <head>
                <title>BẢNG ĐIỂM ${titleStr}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; }
                    th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; }
                    button, .bg-gradient-to-r, td:last-child, th:last-child { display: none !important; }
                </style>
            </head>
            <body class="p-8">
                <div class="text-center mb-6">
                    <div class="text-xs font-black uppercase tracking-widest text-slate-500">${ownerDepartment}</div>
                    <div class="text-sm font-extrabold uppercase text-slate-800">${ownerSchool}</div>
                    <div class="w-12 h-0.5 bg-slate-400 mx-auto my-1.5"></div>
                    <h1 class="text-2xl font-black uppercase text-emerald-800 mt-1.5">BẢNG ĐIỂM THI THỬ TỐT NGHIỆP THPT</h1>
                    <h2 class="text-xl font-bold uppercase mt-1">${titleStr}</h2>
                </div>
                ${table}
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        win.document.close();
    };

    // --- TAB 2: ZALO DISPATCH ---
    const getZaloTabHTML = () => {
        if (typeof excelData === 'undefined' || !excelData || excelData.length === 0) {
            return `<div class="p-12 text-center text-slate-400 italic">⚠️ Không có dữ liệu học sinh để gửi Zalo.</div>`;
        }

        const lops = new Set();
        excelData.forEach(r => { if (r[detectedMapping.lop]) lops.add(String(r[detectedMapping.lop]).trim().toUpperCase()); });

        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 font-sans">
                <!-- Cột Lớp -->
                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm max-h-96 overflow-y-auto">
                    <div class="text-xs font-extrabold uppercase text-slate-500 mb-4 flex justify-between items-center">
                        <span>CHỌN LỚP GỬI ZALO</span>
                        <span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-xs">${lops.size} Lớp</span>
                    </div>
                    <div class="space-y-2">
                        <div class="p-3.5 rounded-xl cursor-pointer border flex justify-between items-center transition-all bg-emerald-600 text-white font-bold shadow-md" onclick="ScorePortal.queueAllZalo()">
                            <span>Toàn bộ trường (${excelData.length} HS)</span>
                            <i data-lucide="check-circle" style="width:18px"></i>
                        </div>
                        ${Array.from(lops).sort().map(l => `
                            <div class="p-3 rounded-xl cursor-pointer border flex justify-between items-center bg-white hover:bg-slate-100 text-slate-700 border-slate-200 transition-all" onclick="ScorePortal.queueClassZalo('${l}')">
                                <span class="font-bold">Lớp ${l}</span>
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">${excelData.filter(x => String(x[detectedMapping.lop]).trim().toUpperCase() === l).length} HS</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Cột Mẫu Tin Nhắn -->
                <div class="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 text-slate-800 font-extrabold mb-4">
                            <i data-lucide="message-square" style="width:22px; color:#10b981"></i>
                            <h3 class="text-lg" style="margin:0">Mẫu Tin Báo Điểm Tự Động (Personalized Template)</h3>
                        </div>
                        <p class="text-xs text-slate-500 mb-4">Hệ thống sẽ thay thế tự động thông tin Họ tên, Số báo danh và từng cột điểm cho từng học sinh và chuyển trực tiếp vào hàng đợi ZaloHub.</p>
                        <div class="bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono space-y-2 text-slate-700 shadow-inner">
                            <div>📢 <b>PHIẾU BÁO ĐIỂM THI THỬ TỐT NGHIỆP THPT</b></div>
                            <div>Kính gửi Phụ huynh em: <b class="text-blue-600">[HỌ VÀ TÊN HỌC SINH]</b></div>
                            <div>Số báo danh: <b class="text-blue-600">[SBD]</b> - Lớp: <b class="text-blue-600">[LỚP]</b></div>
                            <div class="border-t border-b py-2 my-2 border-slate-200 space-y-1">
                                <div>🔹 Toán: <b>[Điểm Toán]</b> | 🔹 Ngữ văn: <b>[Điểm Văn]</b> | 🔹 Ngoại ngữ: <b>[Điểm Anh]</b></div>
                                <div>🔹 Vật lý: <b>[Lý]</b> | 🔹 Hóa: <b>[Hóa]</b> | 🔹 Sinh: <b>[Sinh]</b></div>
                                <div>🔹 Lịch sử: <b>[Sử]</b> | 🔹 Địa lý: <b>[Địa]</b> | 🔹 GDKTPL: <b>[GDKTPL]</b></div>
                                <div>🔹 Tin học: <b>[Tin]</b> | 🔹 CN Công nghiệp: <b>[CNC]</b> | 🔹 CN Nông nghiệp: <b>[CNN]</b></div>
                            </div>
                            <div>🏆 Khối A00: <b>[A00]</b> | Khối B00: <b>[B00]</b> | Khối D01: <b>[D01]</b></div>
                            <div class="text-emerald-700 font-bold mt-2">GVCN trân trọng thông báo để gia đình nắm bắt và đôn đốc em ôn tập!</div>
                        </div>
                    </div>

                    <div class="mt-8 pt-4 border-t border-slate-200 text-center">
                        <button class="btn bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 w-full text-base transition-all" onclick="ScorePortal.queueAllZalo()">
                            <i data-lucide="send-to-back" style="width:24px; height:24px"></i> TẠO HÀNG ĐỢI GỬI ZALO (${excelData.length} HỌC SINH)
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    const queueClassZalo = (lop) => {
        const matches = excelData.filter(x => String(x[detectedMapping.lop]).trim().toUpperCase() === lop);
        pushStudentsToZaloHub(matches, `Lớp ${lop}`);
    };

    const queueAllZalo = () => {
        pushStudentsToZaloHub(excelData, "Toàn trường");
    };

    const pushStudentsToZaloHub = (studentList, groupName) => {
        if (!studentList || studentList.length === 0) return;
        const m = detectedMapping;

        if (typeof ZaloHub === 'undefined') {
            alert("⚠️ Hệ thống ZaloHub chưa sẵn sàng!");
            return;
        }

        let phoneMapping = {};
        if (typeof localStorage !== 'undefined') {
            try {
                const zSaved = localStorage.getItem('vtool_zalo_contacts');
                if (zSaved) phoneMapping = JSON.parse(zSaved)?.classes || {};
            } catch (e) { }
        }

        const newItems = studentList.map(std => {
            const name = std[m.name] || 'Học sinh';
            const sbd = std[m.sbd] || 'SBD';
            const lop = std[m.lop] || '';
            const phone = std.phone || std.sdt || std.dienthoai || phoneMapping[lop] || '';

            const t = std[m.toan] || '--'; const v = std[m.van] || '--'; const a = std[m.ngoaingu] || '--';
            const l = std[m.ly] || '--'; const h = std[m.hoa] || '--'; const s = std[m.sinh] || '--';
            const su = std[m.su] || '--'; const dia = std[m.dia] || '--';
            const gd = std[m.gdkt] || '--';
            const tin = std[m.tin] || '--';
            const cnc = std[m.cnc] || '--';
            const cnn = std[m.cnn] || '--';

            const msg = `📢 PHIẾU BÁO ĐIỂM THI THỬ TỐT NGHIỆP THPT\nKính gửi Phụ huynh em: ${name.toUpperCase()}\nSố báo danh: ${sbd} - Lớp: ${lop}\n\nĐiểm thi chi tiết:\n🔹 Toán: ${t} | Ngữ văn: ${v} | Ngoại ngữ: ${a}\n🔹 Vật lý: ${l} | Hóa học: ${h} | Sinh học: ${s}\n🔹 Lịch sử: ${su} | Địa lý: ${dia} | GDKTPL: ${gd}\n🔹 Tin học: ${tin} | CN Công nghiệp: ${cnc} | CN Nông nghiệp: ${cnn}\n\nTrân trọng kính báo để gia đình phối hợp đôn đốc em ôn tập chuẩn bị kỳ thi chính thức!`;

            return { id: sbd, title: `${name} (${lop})`, dest: phone, msg };
        });

        // Inject into ZaloHub queue
        if (typeof ZaloHub !== 'undefined' && typeof ZaloHub.openModal === 'function') {
            closeModal();
            ZaloHub.openModal('bulk');
            setTimeout(() => {
                if (typeof ZaloHub.setBulkQueue === 'function') {
                    ZaloHub.setBulkQueue(newItems);
                    alert(`🎉 Đã chuyển ${newItems.length} phiếu báo điểm (${groupName}) vào Hàng đợi ZaloHub thành công! Bấm "Tiếp Tục Gửi" để gửi lần lượt.`);
                }
            }, 300);
        }
    };

    // --- TAB 3: STANDALONE WEB GENERATOR ---
    const getExportTabHTML = () => {
        if (typeof excelData === 'undefined' || !excelData || excelData.length === 0) {
            return `<div class="p-12 text-center text-slate-400 italic">⚠️ Không có dữ liệu để xuất Kiosk Web.</div>`;
        }

        return `
            <div class="max-w-2xl mx-auto text-center p-8 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm font-sans space-y-6">
                <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <i data-lucide="globe" style="width:40px; height:40px"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-800">Xuất Trang Web Kiosk Tra Cứu Độc Lập</h3>
                <p class="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
                    Tính năng này tạo ra duy nhất <b>01 tệp HTML</b> hoàn chỉnh chứa toàn bộ dữ liệu điểm thi của <b>${excelData.length} học sinh</b> cùng công cụ tìm kiếm siêu tốc.
                    Thầy/Cô có thể gửi thẳng tệp này vào Zalo nhóm phụ huynh hoặc tải lên website trường để học sinh tra cứu online/offline không cần máy chủ!
                </p>
                <div class="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-left font-mono space-y-2 shadow-inner">
                    <div class="text-slate-500 font-bold uppercase">📦 Gói xuất bao gồm:</div>
                    <div>✅ Bộ máy tra cứu thông minh (Tìm theo SBD, Họ tên)</div>
                    <div>✅ Giao diện Phiếu Báo Điểm Kỹ Thuật Số kèm Môn đăng ký dự thi</div>
                    <div>✅ Tính toán điểm khối A00, B00, C00, D01... tự động</div>
                </div>
                <button class="btn bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl w-full text-base flex items-center justify-center gap-3 transition-all" onclick="ScorePortal.exportStandaloneHTML()">
                    <i data-lucide="download-cloud" style="width:24px; height:24px"></i> TẢI XUỐNG TRANG WEB TRA CỨU (.HTML)
                </button>
            </div>
        `;
    };

    const exportStandaloneHTML = () => {
        try {
            if (!excelData || excelData.length === 0) {
                alert('⚠️ Chưa có dữ liệu điểm thi để xuất bản. Vui lòng tải tệp Excel trong tab Nguồn Điểm & Cấu Hình trước!');
                return;
            }
            const m = detectedMapping;
            const cleanData = excelData.map(r => ({
                sbd: String(r[m.sbd] || ''),
                name: String(r[m.name] || ''),
                lop: String(r[m.lop] || ''),
                toan: r[m.toan] || '',
                van: r[m.van] || '',
                anh: r[m.ngoaingu] || '',
                ly: r[m.ly] || '',
                hoa: r[m.hoa] || '',
                sinh: r[m.sinh] || '',
                su: r[m.su] || '',
                dia: r[m.dia] || '',
                gdkt: r[m.gdkt] || '',
                tin: r[m.tin] || '',
                cnc: r[m.cnc] || '',
                cnn: r[m.cnn] || '',
                tong: r[m.tong] || '',
                regSubs: getRegisteredSubjectsForStudent(r[m.sbd], r).join(', ')
            }));

            const htmlStr = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tra Cứu Điểm Thi Thử Tốt Nghiệp THPT</title>
    <!-- TailwindCSS & Lucide Icons -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
    <style> body { font-family: 'Inter', sans-serif; background-color: #f8fafc; } </style>
</head>
<body class="bg-slate-100 min-h-screen p-4 sm:p-8">
    <div class="max-w-4xl mx-auto space-y-6 font-sans">
        <!-- Header -->
        <div class="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 rounded-3xl p-8 text-white shadow-xl text-center relative overflow-hidden">
            <!-- Decorative light effects -->
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>
            
            <div class="absolute right-4 top-4 z-20 flex items-center gap-2">
                <span id="role-badge" class="bg-slate-900/60 text-emerald-300 text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider border border-emerald-500/20">QUYỀN: HỌC SINH</span>
                <button id="auth-btn" onclick="openAuthModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 border-none cursor-pointer transition-all shadow-md">
                    <i data-lucide="lock" class="w-3 h-3"></i>
                    <span>ĐĂNG NHẬP GV</span>
                </button>
            </div>
            
            <div class="space-y-1.5 relative z-10">
                <div class="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-300 opacity-90">${ownerDepartment.toUpperCase()}</div>
                <div class="text-base sm:text-lg font-extrabold uppercase tracking-wide text-white">${ownerSchool.toUpperCase()}</div>
                
                <!-- Divider line -->
                <div class="w-16 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 mx-auto my-3 rounded-full"></div>
                
                <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">CỔNG TRA CỨU ĐIỂM THI TRỰC TUYẾN</h1>
                <p class="text-emerald-200/90 text-xs sm:text-sm font-semibold mt-2">Kỳ thi Thử Tốt nghiệp THPT năm 2026</p>
            </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 space-y-4">
            <div class="flex items-center gap-2 text-slate-800 font-black text-lg mb-1">
                <i data-lucide="filter" class="w-5 h-5 text-emerald-600"></i>
                <span>Bộ lọc tra cứu dữ liệu</span>
            </div>
            <div id="controls-grid" class="grid grid-cols-1 gap-4 transition-all duration-300">
                <!-- Search Bar -->
                <div class="relative bg-slate-100 p-2 rounded-2xl border border-slate-200 flex items-center">
                    <i data-lucide="search" class="absolute left-4 w-5 h-5 text-emerald-600"></i>
                    <input id="search-inp" type="text" class="w-full pl-10 pr-4 py-2.5 bg-transparent text-base font-bold border-none outline-none focus:ring-0" placeholder="Số báo danh hoặc Họ và tên...">
                </div>
                
                <!-- Class Selector Dropdown -->
                <div id="class-container" class="relative bg-slate-100 p-2 rounded-2xl border border-slate-200 items-center hidden">
                    <i data-lucide="users" class="absolute left-4 w-5 h-5 text-emerald-600"></i>
                    <select id="class-select" class="w-full pl-10 pr-4 py-2.5 bg-transparent text-base font-bold border-none outline-none cursor-pointer" onchange="handleClassChange(this.value)">
                        <option value="">-- Tất cả lớp / Tra cứu cá nhân --</option>
                    </select>
                </div>

                <!-- Subject Selector Dropdown -->
                <div id="subject-container" class="relative bg-slate-100 p-2 rounded-2xl border border-slate-200 items-center hidden">
                    <i data-lucide="book-open" class="absolute left-4 w-5 h-5 text-emerald-600"></i>
                    <select id="subject-select" class="w-full pl-10 pr-4 py-2.5 bg-transparent text-base font-bold border-none outline-none cursor-pointer" onchange="handleSubjectChange(this.value)">
                        <option value="">-- Tất cả môn thi --</option>
                        <option value="toan">Toán học</option>
                        <option value="van">Ngữ văn</option>
                        <option value="anh">Ngoại ngữ</option>
                        <option value="ly">Vật lý</option>
                        <option value="hoa">Hóa học</option>
                        <option value="sinh">Sinh học</option>
                        <option value="su">Lịch sử</option>
                        <option value="dia">Địa lý</option>
                        <option value="gdkt">GDKTPL</option>
                        <option value="tin">Tin học</option>
                        <option value="cnc">CN Công nghiệp</option>
                        <option value="cnn">CN Nông nghiệp</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Result Container -->
        <div id="result-area" class="space-y-6">
            <div class="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400 font-bold">
                <i data-lucide="graduation-cap" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
                Hãy nhập Số báo danh hoặc Họ tên để tra cứu kết quả thi thử!
            </div>
        </div>
    </div>

    <!-- Auth Modal -->
    <div id="auth-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm hidden items-center justify-center z-50 p-4" style="display:none">
        <div class="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl relative">
            <button onclick="closeAuthModal()" class="absolute right-4 top-4 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                    <i data-lucide="shield-check" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="text-lg font-black text-slate-800">Xác thực Giáo viên</h3>
                    <p class="text-xs text-slate-500">Mở khóa bộ lọc lớp & môn thi</p>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="text-xs font-black text-slate-600 block mb-2">VAI TRÒ (ROLE)</label>
                    <select id="auth-role" class="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none">
                        <option value="gvcn">Giáo viên Chủ nhiệm (GVCN)</option>
                        <option value="gvbm">Giáo viên Bộ môn (GVBM)</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs font-black text-slate-600 block mb-2">MẬT KHẨU (PASSWORD)</label>
                    <input id="auth-pass" type="password" placeholder="Nhập mật khẩu..." class="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none" onkeydown="if(event.key === 'Enter') submitAuth()">
                </div>
                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                    <span class="font-extrabold text-emerald-700 block mb-0.5">💡 Mật khẩu truy cập:</span>
                    • GVCN: mật khẩu <b class="text-slate-800 font-mono">${teacherPassword}</b> (Mở bộ lọc lớp)<br>
                    • GVBM: mật khẩu <b class="text-slate-800 font-mono">${adminPassword}</b> (Mở bộ lọc lớp & môn)
                </div>
                <button onclick="submitAuth()" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-3.5 rounded-xl shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all text-sm mt-2 border-none cursor-pointer">
                    XÁC THỰC QUYỀN TRUY CẬP
                </button>
            </div>
        </div>
    </div>

    <script>
        const studentData = ${JSON.stringify(cleanData)};
        let selectedClass = '';
        let selectedSubject = '';
        let currentSearch = '';
        let userRole = 'student'; // 'student', 'gvcn', 'gvbm'

        // Build class options on load
        const removeVietnameseAccents = (str) => {
            if (!str) return '';
            return str.toString().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
        };

        window.onload = function() {
            const classes = new Set();
            studentData.forEach(s => { if (s.lop) classes.add(s.lop.trim().toUpperCase()); });
            const sortedClasses = Array.from(classes).sort();
            const select = document.getElementById('class-select');
            sortedClasses.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                select.appendChild(opt);
            });
            
            document.getElementById('search-inp').addEventListener('input', function(e) {
                currentSearch = removeVietnameseAccents(e.target.value.trim().toLowerCase());
                renderAll();
            });
            
            lucide.createIcons();
        };

        function openAuthModal() {
            if (userRole !== 'student') {
                // Log out
                userRole = 'student';
                document.getElementById('role-badge').textContent = 'QUYỀN: HỌC SINH';
                document.getElementById('role-badge').className = 'bg-slate-900/60 text-emerald-300 text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider border border-emerald-500/20';
                document.getElementById('auth-btn').innerHTML = '<i data-lucide="lock" class="w-3 h-3"></i><span>ĐĂNG NHẬP GV</span>';
                
                document.getElementById('class-container').classList.add('hidden');
                document.getElementById('class-container').classList.remove('flex');
                document.getElementById('subject-container').classList.add('hidden');
                document.getElementById('subject-container').classList.remove('flex');
                
                document.getElementById('controls-grid').className = 'grid grid-cols-1 gap-4 transition-all duration-300';
                
                selectedClass = '';
                selectedSubject = '';
                document.getElementById('class-select').value = '';
                document.getElementById('subject-select').value = '';
                
                renderAll();
                lucide.createIcons();
                alert('Đã đăng xuất tài khoản giáo viên!');
                return;
            }
            document.getElementById('auth-modal').style.display = 'flex';
            document.getElementById('auth-modal').classList.remove('hidden');
            document.getElementById('auth-pass').value = '';
            document.getElementById('auth-pass').focus();
        }

        function closeAuthModal() {
            document.getElementById('auth-modal').style.display = 'none';
            document.getElementById('auth-modal').classList.add('hidden');
        }

        function submitAuth() {
            const role = document.getElementById('auth-role').value;
            const pass = document.getElementById('auth-pass').value;
            
            if (role === 'gvcn' && pass === '${teacherPassword}') {
                userRole = 'gvcn';
                document.getElementById('role-badge').textContent = 'QUYỀN: GVCN';
                document.getElementById('role-badge').className = 'bg-amber-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm';
                document.getElementById('auth-btn').innerHTML = '<i data-lucide="log-out" class="w-3 h-3"></i><span>ĐĂNG XUẤT</span>';
                
                // Show class selector only
                document.getElementById('class-container').classList.remove('hidden');
                document.getElementById('class-container').classList.add('flex');
                document.getElementById('subject-container').classList.add('hidden');
                document.getElementById('subject-container').classList.remove('flex');
                
                document.getElementById('controls-grid').className = 'grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300';
                
                closeAuthModal();
                renderAll();
                lucide.createIcons();
            } else if (role === 'gvbm' && pass === '${adminPassword}') {
                userRole = 'gvbm';
                document.getElementById('role-badge').textContent = 'QUYỀN: GVBM';
                document.getElementById('role-badge').className = 'bg-blue-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm';
                document.getElementById('auth-btn').innerHTML = '<i data-lucide="log-out" class="w-3 h-3"></i><span>ĐĂNG XUẤT</span>';
                
                // Show both selectors
                document.getElementById('class-container').classList.remove('hidden');
                document.getElementById('class-container').classList.add('flex');
                document.getElementById('subject-container').classList.remove('hidden');
                document.getElementById('subject-container').classList.add('flex');
                
                document.getElementById('controls-grid').className = 'grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300';
                
                closeAuthModal();
                renderAll();
                lucide.createIcons();
            } else {
                alert('Sai mật khẩu! Vui lòng thử lại.');
            }
        }

        function getBadge(numStr) {
            if (numStr === "" || numStr === null || numStr === undefined || isNaN(numStr)) return '<span class="text-slate-400">--</span>';
            const num = parseFloat(numStr);
            const disp = num.toString();
            if (num <= 1.0) return '<span class="bg-red-100 text-red-700 font-black px-2 py-1 rounded-lg">💥 ' + disp + '</span>';
            if (num < 5.0) return '<span class="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded-lg">' + disp + '</span>';
            if (num >= 8.0) return '<span class="bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded-lg">✨ ' + disp + '</span>';
            return '<span class="bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-lg">' + disp + '</span>';
        }

        function handleClassChange(val) {
            if (userRole === 'student') return;
            selectedClass = val;
            renderAll();
        }

        function handleSubjectChange(val) {
            if (userRole === 'student') return;
            selectedSubject = val;
            renderAll();
        }

        function viewIndividualCard(sbd) {
            selectedClass = '';
            selectedSubject = '';
            currentSearch = sbd.toLowerCase();
            document.getElementById('class-select').value = '';
            document.getElementById('subject-select').value = '';
            document.getElementById('search-inp').value = sbd;
            renderAll();
        }

        function printIndividualDigitalCard(sbd, name, lop, roomNum, seatNum) {
            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SBD:' + sbd;
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(\`
                <html>
                <head>
                    <title>Thẻ Dự Thi Điện Tử - \${name}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');
                        body {
                            font-family: 'Outfit', sans-serif;
                            padding: 40px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            background-color: #f1f5f9;
                        }
                        .card {
                            width: 500px;
                            background: white;
                            border: 4px double #d97706;
                            border-radius: 24px;
                            padding: 28px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                            position: relative;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px solid #f59e0b;
                            padding-bottom: 12px;
                            margin-bottom: 20px;
                        }
                        .header h3 {
                            margin: 0;
                            font-size: 11px;
                            font-weight: 800;
                            color: #d97706;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                        }
                        .header h2 {
                            margin: 2px 0 0 0;
                            font-size: 14px;
                            font-weight: 900;
                            color: #1e293b;
                            text-transform: uppercase;
                        }
                        .title {
                            font-size: 18px;
                            font-weight: 900;
                            color: #b45309;
                            text-align: center;
                            margin: 15px 0;
                            letter-spacing: 1px;
                        }
                        .content {
                            display: flex;
                            gap: 20px;
                            align-items: center;
                        }
                        .qr-area {
                            border: 1px solid #e2e8f0;
                            padding: 8px;
                            border-radius: 16px;
                            background: #fdfaf6;
                            text-align: center;
                        }
                        .qr-area img {
                            width: 110px;
                            height: 110px;
                        }
                        .info-area {
                            flex: 1;
                        }
                        .info-row {
                            font-size: 13px;
                            margin: 8px 0;
                            color: #475569;
                        }
                        .info-row b {
                            color: #0f172a;
                        }
                        .stamp-area {
                            display: flex;
                            justify-content: flex-end;
                            margin-top: 20px;
                            text-align: center;
                        }
                        .stamp-box {
                            font-size: 11px;
                            color: #475569;
                            position: relative;
                        }
                        .stamp-signature {
                            font-family: 'Playball', cursive, sans-serif;
                            font-size: 20px;
                            color: #ef4444;
                            margin: 10px 0;
                            font-weight: bold;
                            transform: rotate(-5deg);
                        }
                        .red-stamp {
                            position: absolute;
                            width: 80px;
                            height: 80px;
                            border: 3px solid rgba(239, 68, 68, 0.7);
                            border-radius: 50px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            color: rgba(239, 68, 68, 0.7);
                            font-weight: 900;
                            font-size: 8px;
                            text-transform: uppercase;
                            top: -5px;
                            right: 15px;
                            transform: rotate(15deg);
                            pointer-events: none;
                        }
                        @media print {
                            body {
                                background: white;
                                padding: 0;
                            }
                            .card {
                                box-shadow: none;
                                border: 3px double #d97706;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="header">
                            <h3>${ownerDepartment}</h3>
                            <h2>${ownerSchool}</h2>
                        </div>
                        <div class="title">THẺ DỰ THI ĐIỆN TỬ</div>
                        <div class="content">
                            <div class="qr-area">
                                <img src="\${qrUrl}">
                                <div style="font-size: 8px; font-weight: 800; color: #94a3b8; margin-top: 4px;">SECURE ENTRY</div>
                            </div>
                            <div class="info-area">
                                <div class="info-row">Họ và tên: <b style="font-size:15px; text-transform:uppercase;">\${name}</b></div>
                                <div class="info-row">Số báo danh: <b style="color:#d97706; font-size:14px;">\${sbd}</b></div>
                                <div class="info-row">Lớp đăng ký: <b>\${lop}</b></div>
                                <div class="info-row">Phòng thi số: <b style="color:#059669; font-size:14px;">\${roomNum}</b></div>
                                <div class="info-row">Số ghế ngồi: <b style="color:#2563eb; font-size:14px;">\${seatNum}</b></div>
                            </div>
                        </div>
                        <div class="stamp-area">
                            <div class="stamp-box">
                                <div>Dak Lak, Ngày 19 tháng 05 năm 2026</div>
                                <div style="font-weight: 800; margin-top: 2px;">HIỆU TRƯỞNG</div>
                                <div class="stamp-signature">Nguyễn Văn A</div>
                                <div class="red-stamp">
                                    <div style="text-align:center;">TRƯỜNG THPT<br>CAO BÁ QUÁT<br>★</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        };
                    <\\/script>
                </body>
                </html>
            \`);
            printWindow.document.close();
        }

        function printClass() {
            if (userRole === 'student') return;
            const table = document.querySelector('.overflow-x-auto').innerHTML;
            const win = window.open('', '_blank');
            let titleStr = '';
            if (selectedClass) titleStr += 'LỚP ' + selectedClass;
            if (selectedSubject) titleStr += (titleStr ? ' - ' : '') + 'MÔN ' + selectedSubject.toUpperCase();

            win.document.write('<html><head><title>BẢNG ĐIỂM ' + titleStr + '</title><script src="https://cdn.tailwindcss.com"><\\/script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet"><style>body{font-family:\\'Inter\\',sans-serif;} th,td{border:1px solid #cbd5e1!important; padding:8px 12px!important;} button,th:last-child,td:last-child{display:none!important;}</style></head><body class="p-8"><div class="text-center mb-6"><div class="text-xs font-black uppercase tracking-widest text-slate-500">${ownerDepartment.toUpperCase()}</div><div class="text-sm font-extrabold uppercase text-slate-800">${ownerSchool.toUpperCase()}</div><div class="w-12 h-0.5 bg-slate-400 mx-auto my-1.5"></div><h1 class="text-2xl font-black uppercase text-emerald-800 mt-1.5">BẢNG ĐIỂM THI THỬ TỐT NGHIỆP THPT</h1><h2 class="text-xl font-bold uppercase mt-1">' + titleStr + '</h2></div>' + table + '<script>window.onload=function(){window.print();}<\\/script></body></html>');
            win.document.close();
        }

        function renderAll() {
            const area = document.getElementById('result-area');
            if (userRole !== 'student' && (selectedClass || selectedSubject || !currentSearch)) {
                renderClassTable(area);
                return;
            }

            if (!currentSearch) {
                area.innerHTML = '<div class="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400 font-bold"><i data-lucide="graduation-cap" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>Hãy nhập Số báo danh hoặc Họ tên để tra cứu kết quả thi thử!</div>';
                lucide.createIcons();
                return;
            }

            const matches = studentData.filter(s => (s.sbd && removeVietnameseAccents(String(s.sbd).toLowerCase()).includes(currentSearch)) || (s.name && removeVietnameseAccents(String(s.name).toLowerCase()).includes(currentSearch)));
            if (matches.length === 0) { area.innerHTML = '<div class="text-center py-12 bg-red-50 text-red-600 font-black rounded-3xl border border-red-200">Không tìm thấy học sinh!</div>'; return; }

            area.innerHTML = matches.map(s => {
                const t = parseFloat(s.toan)||0; const v = parseFloat(s.van)||0; const a = parseFloat(s.anh)||0;
                const l = parseFloat(s.ly)||0; const h = parseFloat(s.hoa)||0; const si = parseFloat(s.sinh)||0;
                const su = parseFloat(s.su)||0; const dia = parseFloat(s.dia)||0; 
                const gd = parseFloat(s.gdkt)||0;
                const tin = parseFloat(s.tin)||0;
                const cnc = parseFloat(s.cnc)||0;
                const cnn = parseFloat(s.cnn)||0;

                const a00 = (t+l+h).toFixed(2); const b00 = (t+h+si).toFixed(2); const c00 = (v+su+dia).toFixed(2);
                const d01 = (t+v+a).toFixed(2); const a01 = (t+l+a).toFixed(2);

                const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SBD:' + s.sbd;

                // Mock room/seat numbers for standalone kiosk HTML
                const sbdNum = parseInt(s.sbd.replace(/[^0-9]/g, '')) || 99;
                const roomNumber = String(Math.floor(sbdNum / 24) + 1).padStart(2, '0');
                const seatNumber = String((sbdNum % 24) + 1).padStart(2, '0');

                const examCardHtml = \`
                    <div class="bg-amber-50/50 p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4 relative overflow-hidden mt-6 text-left">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                        
                        <div class="flex flex-col md:flex-row gap-6 items-center">
                            <div class="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 relative flex items-center justify-center">
                                <img src="\${qrUrl}" alt="QR Code" class="w-24 h-24 object-contain rounded-lg">
                            </div>
                            <div class="flex-1 space-y-2 text-center md:text-left">
                                <div class="text-amber-800 font-extrabold uppercase text-xs tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                                    <i data-lucide="contact" class="w-4 h-4 text-amber-600"></i>
                                    <span>THẺ DỰ THI ĐIỆN TỬ (CHỨNG NHẬN SỐ)</span>
                                </div>
                                <h4 class="text-2xl font-black text-slate-800">PHÒNG THI SỐ \${roomNumber}</h4>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600 font-semibold mt-2">
                                    <div class="bg-white/80 p-2 rounded-xl border border-slate-200">Mã Số Thí Sinh: <b class="text-slate-900 block text-sm font-black mt-0.5">\${s.sbd}</b></div>
                                    <div class="bg-white/80 p-2 rounded-xl border border-slate-200">Số Ghế Ngồi: <b class="text-amber-700 block text-sm font-black mt-0.5">\${seatNumber}</b></div>
                                    <div class="bg-white/80 p-2 rounded-xl border border-slate-200 col-span-2 md:col-span-1">Điểm Thi: <b class="text-slate-900 block text-sm font-black mt-0.5 truncate">${ownerSchool}</b></div>
                                </div>
                            </div>
                            <div class="text-center md:text-right w-full md:w-auto">
                                <button onclick="printIndividualDigitalCard('\${s.sbd}', '\${s.name}', '\${s.lop}', '\${roomNumber}', '\${seatNumber}')" class="px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl text-xs font-black shadow-md border-0 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto md:ml-auto cursor-pointer" style="border:none;">
                                    <i data-lucide="printer" class="w-4 h-4"></i>
                                    <span>IN THẺ DỰ THI</span>
                                </button>
                            </div>
                        </div>
                    </div>
                \`;

                // Calculate best block & AI advice
                const blocks = [
                    { name: 'A00', score: t+l+h },
                    { name: 'B00', score: t+h+si },
                    { name: 'C00', score: v+su+dia },
                    { name: 'D01', score: t+v+a },
                    { name: 'A01', score: t+l+a }
                ];
                blocks.sort((x, y) => y.score - x.score);
                const bestBlock = blocks[0];

                let advice = '';
                let careers = [];
                if (bestBlock.score >= 27) {
                    advice = 'Mức điểm ' + bestBlock.name + ' cực kỳ xuất sắc (' + bestBlock.score.toFixed(2) + 'đ). Bạn nằm trong Top thí sinh tốt nhất. Hãy tự tin ứng tuyển các ngành hot tại trường ĐH top đầu!';
                    careers = ['Y Khoa', 'Khoa học máy tính', 'Kinh tế đối ngoại', 'Quan hệ quốc tế'];
                } else if (bestBlock.score >= 24) {
                    advice = 'Mức điểm ' + bestBlock.name + ' rất ấn tượng (' + bestBlock.score.toFixed(2) + 'đ). Cơ hội trúng tuyển đại học uy tín cực kỳ lớn.';
                    careers = ['Công nghệ thông tin', 'Quản trị kinh doanh', 'Ngôn ngữ Anh', 'Kỹ thuật ô tô'];
                } else if (bestBlock.score >= 20) {
                    advice = 'Điểm số khối ' + bestBlock.name + ' đạt mức Khá tốt (' + bestBlock.score.toFixed(2) + 'đ). Phù hợp xét tuyển vào các ngành nghề triển vọng trường top giữa.';
                    careers = ['Kế toán', 'Sư phạm', 'Quản trị du lịch', 'Công nghệ thực phẩm'];
                } else {
                    advice = 'Điểm số khối ' + bestBlock.name + ' ở mức trung bình (' + bestBlock.score.toFixed(2) + 'đ). Hãy tăng cường ôn tập ôn thi chính thức thật tốt!';
                    careers = ['Kỹ thuật (Cao đẳng)', 'Thiết kế đồ họa', 'Thương mại điện tử'];
                }

                const aiAdvisorHtml = \`
                    <div class="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 rounded-3xl border border-emerald-500/20 space-y-4 mt-6 text-left">
                        <div class="flex items-center gap-2.5 text-emerald-800 font-black text-base">
                            <div class="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <i data-lucide="sparkles" class="w-4 h-4"></i>
                            </div>
                            <span>TRỢ LÝ HƯỚNG NGHIỆP AI (AI ADVISOR)</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div class="bg-white p-4.5 rounded-2xl border border-emerald-500/20 shadow-xs text-center space-y-2" style="border:1px solid rgba(16,185,129,0.2); padding:16px;">
                                <div class="text-[10px] font-black text-slate-400 uppercase">Khối xét tuyển ưu thế</div>
                                <div class="text-3xl font-black text-emerald-700">\` + bestBlock.name + \`</div>
                                <div class="text-[11px] font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full inline-block">\` + bestBlock.score.toFixed(2) + \` Điểm</div>
                            </div>
                            <div class="md:col-span-2 space-y-3 text-left">
                                <div class="text-xs text-slate-700 font-medium leading-relaxed italic">"\` + advice + \`"</div>
                                <div class="space-y-1.5">
                                    <div class="text-[10px] font-black text-slate-400 uppercase tracking-wide">Ngành nghề gợi ý:</div>
                                    <div class="flex flex-wrap gap-1.5">
                                        \` + careers.map(c => '<span class="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-xl">' + c + '</span>').join('') + \`
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;

                return '<div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 font-sans text-left">' +
                    '<div class="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 p-6 text-white flex justify-between items-center">' +
                        '<div class="text-left"><div class="text-xs font-bold text-emerald-200 uppercase">HỌ VÀ TÊN</div><h2 class="text-2xl font-black">' + s.name.toUpperCase() + '</h2><div class="mt-1 text-sm text-emerald-100">SBD: <b>' + s.sbd + '</b> | Lớp: <b>' + s.lop + '</b></div>' +
                        '<div class="mt-3.5 bg-white/20 px-3.5 py-1.5 rounded-xl text-xs text-white font-semibold inline-block border border-white/20 shadow-inner">Môn đăng ký thi: <b class="font-extrabold text-white">' + (s.regSubs || '---') + '</b></div></div>' +
                    '</div>' +
                    '<div class="p-6 sm:p-8 space-y-6 bg-slate-50/50">' +
                        examCardHtml +
                        '<div class="text-sm font-extrabold uppercase text-slate-500 border-b pb-2">Bảng Điểm Môn Thi</div>' +
                        '<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Toán:</span><span>' + getBadge(s.toan) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Văn:</span><span>' + getBadge(s.van) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Ngoại ngữ:</span><span>' + getBadge(s.anh) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Vật lý:</span><span>' + getBadge(s.ly) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Hóa:</span><span>' + getBadge(s.hoa) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Sinh:</span><span>' + getBadge(s.sinh) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Lịch sử:</span><span>' + getBadge(s.su) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Địa lý:</span><span>' + getBadge(s.dia) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>GDKTPL:</span><span>' + getBadge(s.gdkt) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>Tin học:</span><span>' + getBadge(s.tin) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>CN Công nghiệp:</span><span>' + getBadge(s.cnc) + '</span></div>' +
                            '<div class="bg-white p-4 rounded-2xl flex justify-between items-center font-bold border border-slate-200 shadow-sm"><span>CN Nông nghiệp:</span><span>' + getBadge(s.cnn) + '</span></div>' +
                        '</div>' +
                        '<div class="text-sm font-extrabold uppercase text-slate-500 border-b pb-2 pt-4">Tổ Hợp Xét Tuyển Đại Học</div>' +
                        '<div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">' +
                            '<div class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-3 rounded-2xl shadow-sm"><div class="font-black">A00</div><div class="text-xl font-bold mt-1">' + (a00 > 0 ? a00 : '--') + '</div></div>' +
                            '<div class="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-3 rounded-2xl shadow-sm"><div class="font-black">B00</div><div class="text-xl font-bold mt-1">' + (b00 > 0 ? b00 : '--') + '</div></div>' +
                            '<div class="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-3 rounded-2xl shadow-sm"><div class="font-black">C00</div><div class="text-xl font-bold mt-1">' + (c00 > 0 ? c00 : '--') + '</div></div>' +
                            '<div class="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-3 rounded-2xl shadow-sm"><div class="font-black">D01</div><div class="text-xl font-bold mt-1">' + (d01 > 0 ? d01 : '--') + '</div></div>' +
                            '<div class="bg-gradient-to-br from-purple-500 to-violet-600 text-white p-3 rounded-2xl shadow-sm"><div class="font-black">A01</div><div class="text-xl font-bold mt-1">' + (a01 > 0 ? a01 : '--') + '</div></div>' +
                        '</div>' +
                        aiAdvisorHtml +
                    '</div>' +
                '</div>';
            }).join('');
            lucide.createIcons();
        }

        function renderClassTable(area) {
            if (userRole === 'student') return;
            let filtered = studentData;
            if (selectedClass) {
                filtered = filtered.filter(s => s.lop && s.lop.trim().toUpperCase() === selectedClass.toUpperCase());
            }
            if (selectedSubject) {
                filtered = filtered.filter(s => {
                    const val = s[selectedSubject];
                    return val !== undefined && val !== "" && val !== null && !isNaN(parseFloat(val));
                });
            }

            if (currentSearch) {
                filtered = filtered.filter(s => 
                    (s.sbd && removeVietnameseAccents(String(s.sbd).toLowerCase()).includes(currentSearch)) || 
                    (s.name && removeVietnameseAccents(String(s.name).toLowerCase()).includes(currentSearch))
                );
            }

            let titleStr = '';
            if (selectedClass) titleStr += 'LỚP ' + selectedClass;
            if (selectedSubject) titleStr += (titleStr ? ' - ' : '') + 'MÔN ' + selectedSubject.toUpperCase();
            if (!titleStr) titleStr = 'TẤT CẢ HỌC SINH';

            if (filtered.length === 0) {
                area.innerHTML = '<div class="text-center py-12 bg-red-50 text-red-600 font-black rounded-3xl border border-red-200 font-sans">Không tìm thấy học sinh nào khớp với bộ lọc ' + titleStr + '!</div>';
                return;
            }

            const activeCols = { toan:false, van:false, anh:false, ly:false, hoa:false, sinh:false, su:false, dia:false, gdkt:false, tin:false, cnc:false, cnn:false };
            filtered.forEach(s => {
                Object.keys(activeCols).forEach(k => {
                    const val = s[k];
                    if (val !== undefined && val !== "" && val !== null && !isNaN(parseFloat(val))) {
                        activeCols[k] = true;
                    }
                });
            });

            const colDefs = [
                { key: 'toan', label: 'Toán' }, { key: 'van', label: 'Văn' }, { key: 'anh', label: 'Ngoại ngữ' },
                { key: 'ly', label: 'Vật lý' }, { key: 'hoa', label: 'Hóa học' }, { key: 'sinh', label: 'Sinh học' },
                { key: 'su', label: 'Lịch sử' }, { key: 'dia', label: 'Địa lý' }, { key: 'gdkt', label: 'GDKTPL' },
                { key: 'tin', label: 'Tin học' }, { key: 'cnc', label: 'CN Công nghiệp' }, { key: 'cnn', label: 'CN Nông nghiệp' }
            ];

            const activeHeaders = colDefs.filter(d => activeCols[d.key]);

            let html = '<div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 font-sans">' +
                '<div class="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 p-6 text-white flex justify-between items-center flex-wrap gap-4">' +
                    '<div>' +
                        '<div class="text-xs font-bold text-emerald-200 uppercase">BẢNG ĐIỂM CHI TIẾT</div>' +
                        '<h3 class="text-2xl font-black mt-1 uppercase">' + titleStr + '</h3>' +
                        '<p class="text-xs text-emerald-100 mt-1">Sỹ số hiển thị: ' + filtered.length + ' học sinh</p>' +
                    '</div>' +
                    '<button onclick="printClass()" class="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm shadow-black/10"><i data-lucide="printer" class="w-4 h-4"></i> In Bảng Điểm</button>' +
                '</div>' +
                '<div class="overflow-x-auto">' +
                    '<table class="w-full text-sm text-left text-slate-700">' +
                        '<thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-extrabold">' +
                            '<tr>' +
                                '<th class="px-4 py-4 text-center">STT</th>' +
                                '<th class="px-6 py-4">Họ và tên</th>' +
                                '<th class="px-4 py-4 text-center">SBD</th>' +
                                activeHeaders.map(h => '<th class="px-4 py-4 text-center font-bold">' + h.label + '</th>').join('') +
                                '<th class="px-4 py-4 text-center">Tổ hợp Đại học</th>' +
                                '<th class="px-4 py-4 text-center">Hành động</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody class="divide-y divide-slate-100 font-semibold">';

            filtered.forEach((s, idx) => {
                const t = parseFloat(s.toan)||0; const v = parseFloat(s.van)||0; const a = parseFloat(s.anh)||0;
                const l = parseFloat(s.ly)||0; const h = parseFloat(s.hoa)||0; const si = parseFloat(s.sinh)||0;
                const su = parseFloat(s.su)||0; const dia = parseFloat(s.dia)||0;

                const a00 = (t+l+h).toFixed(2); const b00 = (t+h+si).toFixed(2); const c00 = (v+su+dia).toFixed(2);
                const d01 = (t+v+a).toFixed(2); const a01 = (t+l+a).toFixed(2);

                const blocks = [];
                if (a00 > 0 && (t > 0 && l > 0 && h > 0)) blocks.push("A00: " + a00);
                if (b00 > 0 && (t > 0 && h > 0 && si > 0)) blocks.push("B00: " + b00);
                if (c00 > 0 && (v > 0 && su > 0 && dia > 0)) blocks.push("C00: " + c00);
                if (d01 > 0 && (t > 0 && v > 0 && a > 0)) blocks.push("D01: " + d01);
                if (a01 > 0 && (t > 0 && l > 0 && a > 0)) blocks.push("A01: " + a01);
                const bestBlock = blocks.length > 0 ? blocks.sort((x, y) => parseFloat(y.split(": ")[1]) - parseFloat(x.split(": ")[1]))[0] : '--';

                html += '<tr class="hover:bg-slate-50 transition-all">' +
                    '<td class="px-4 py-3.5 text-center text-slate-400 font-semibold">' + (idx+1) + '</td>' +
                    '<td class="px-6 py-3.5 font-bold text-slate-900">' + s.name + '</td>' +
                    '<td class="px-4 py-3.5 text-center font-mono font-bold text-blue-700">' + s.sbd + '</td>' +
                    activeHeaders.map(h => {
                        const val = s[h.key];
                        return '<td class="px-4 py-3.5 text-center font-bold">' + getBadge(val) + '</td>';
                    }).join('') +
                    '<td class="px-4 py-3.5 text-center"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-xl text-xs font-black">' + bestBlock + '</span></td>' +
                    '<td class="px-4 py-3.5 text-center"><button onclick="viewIndividualCard(\\\'' + s.sbd + '\\\')" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 mx-auto transition-all border border-emerald-100 cursor-pointer shadow-xs"><i data-lucide="eye" class="w-3.5 h-3.5"></i> Xem chi tiết</button></td>' +
                '</tr>';
            });

            html += '</tbody></table></div></div>';
            area.innerHTML = html;
            lucide.createIcons();
        }

    </script>
</body>
</html>`;

            const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            let safeName = '2026';
            if (activeFileName) {
                let base = activeFileName.split('.')[0];
                safeName = base.trim()
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/[^a-z0-9_-]/g, '_')
                    .replace(/_+/g, '_');
            }
            link.download = 'tracuu_' + safeName + '.html';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert('✅ Đã tạo và tải xuống trang tra cứu thành công! Có ' + cleanData.length + ' học sinh.');
        } catch(e) {
            console.error('Export error:', e);
            alert('❌ Lỗi khi xuất bản: ' + e.message);
        }
    };


    // --- HELPER TO GENERATE DROPDOWN SELECT ---
    const makeColSelect = (fieldKey, label, badgeClass) => {
        const currentVal = detectedMapping[fieldKey] || '';
        const opts = columnNames.map(c => `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('');
        return `
            <div class="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div class="text-xs font-extrabold text-slate-500 uppercase mb-1.5 flex justify-between items-center">
                    <span>${label}:</span>
                    ${currentVal ? `<span class="${badgeClass} px-2 py-0.5 rounded-full text-[10px] font-black">OK</span>` : `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-black">⚠️ Thiếu</span>`}
                </div>
                <select class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer" onchange="ScorePortal.updateMapping('${fieldKey}', this.value)">
                    <option value="">-- Bỏ qua / Không chọn --</option>
                    ${opts}
                </select>
            </div>
        `;
    };

    // --- TAB 4: DATA SOURCE & COLUMNS ---
    const getDataTabHTML = () => {
        return `
            <div class="max-w-4xl mx-auto space-y-6 font-sans">
                <!-- Dropzone / Input for new Excel file -->
                <div class="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-emerald-400 text-center relative overflow-hidden transition-all hover:bg-slate-100 cursor-pointer">
                    <input type="file" id="score-file-input" class="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx, .xls, .csv" onchange="ScorePortal.handleFileUpload(event)">
                    <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <i data-lucide="file-spreadsheet" style="width:32px; height:32px"></i>
                    </div>
                    <div class="text-lg font-black text-slate-800">Tải Lên Tệp Điểm Thi Khác (.XLSX, .XLS)</div>
                    <p class="text-xs text-slate-500 mt-1">Bấm hoặc kéo thả file bảng điểm Excel vào đây để nạp và thay thế dữ liệu tra cứu</p>
                </div>

                <!-- Config Owner Info -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div class="flex items-center gap-2 border-b pb-3 text-slate-800 font-black text-base">
                        <i data-lucide="building-2" style="width:22px; color:#059669"></i>
                        <span>Cấu Hình Tên Đơn Vị Chủ Quản & Trường Học</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-extrabold text-slate-500 uppercase">Sở GD&ĐT / Đơn vị chủ quản:</label>
                            <input type="text" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all outline-none" value="${ownerDepartment}" oninput="ScorePortal.updateOwnerConfig('department', this.value)">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-extrabold text-slate-500 uppercase">Tên Trường THPT / Trung tâm:</label>
                            <input type="text" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all outline-none" value="${ownerSchool}" oninput="ScorePortal.updateOwnerConfig('school', this.value)">
                        </div>
                    </div>
                </div>

                <!-- Config Passwords & Roles -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div class="flex items-center gap-2 border-b pb-3 text-slate-800 font-black text-base">
                        <i data-lucide="shield-check" style="width:22px; color:#059669"></i>
                        <span>Bảo Mật & Phân Quyền Truy Cập Kiosk</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-extrabold text-slate-500 uppercase">Mật khẩu tĩnh Giáo Viên (Xem điểm lớp/môn):</label>
                            <div class="relative flex items-center">
                                <input type="text" class="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all outline-none" value="${teacherPassword}" oninput="ScorePortal.updatePasswords('teacher', this.value)">
                                <i data-lucide="key" class="absolute right-4 w-4 h-4 text-slate-400" style="position:absolute; right:16px;"></i>
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-extrabold text-slate-500 uppercase">Mật khẩu tĩnh Admin (Ghép cột/Zalo/Web):</label>
                            <div class="relative flex items-center">
                                <input type="text" class="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all outline-none" value="${adminPassword}" oninput="ScorePortal.updatePasswords('admin', this.value)">
                                <i data-lucide="shield" class="absolute right-4 w-4 h-4 text-slate-400" style="position:absolute; right:16px;"></i>
                            </div>
                        </div>
                    </div>
                    <p class="text-[11px] text-slate-500 italic">Mặc định: Học sinh mở trang tra cứu sẽ chỉ tìm kiếm được kết quả cá nhân của mình bằng SBD/Tên. Giáo viên/Admin muốn xem toàn trường cần bấm vào nút khóa 🔑 trên thanh tiêu đề và nhập mật khẩu tương ứng để mở khóa tính năng nâng cao.</p>
                </div>

                <!-- Detected Mapping Info & Dropdown Selectors -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div class="flex items-center justify-between border-b pb-3">
                        <div class="flex items-center gap-2 text-slate-800 font-black text-base">
                            <i data-lucide="columns" style="width:22px; color:#059669"></i>
                            <span>Cấu Hình Ghép Cột (Tự Động & Chỉnh Thủ Công)</span>
                        </div>
                        <span class="text-xs font-bold bg-white px-3 py-1.5 rounded-full text-slate-700 border shadow-xs">Tệp đang dùng: <b class="text-emerald-700 font-extrabold">${activeFileName || 'Chưa có'}</b> (${excelData?.length || 0} dòng)</span>
                    </div>

                    <p class="text-xs text-slate-500">Hệ thống đã tự động phân tích và khử dấu tiếng Việt để ghép cột. Thầy/Cô có thể bấm vào từng ô dưới đây để chỉnh lại cột chính xác nếu chưa chuẩn:</p>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                        ${makeColSelect('sbd', 'Số Báo Danh', 'bg-slate-200 text-slate-800')}
                        ${makeColSelect('name', 'Họ Và Tên', 'bg-slate-200 text-slate-800')}
                        ${makeColSelect('lop', 'Lớp / Đơn Vị', 'bg-slate-200 text-slate-800')}

                        ${makeColSelect('toan', 'Môn Toán', 'bg-emerald-100 text-emerald-800')}
                        ${makeColSelect('van', 'Môn Ngữ Văn', 'bg-emerald-100 text-emerald-800')}
                        ${makeColSelect('ngoaingu', 'Môn Ngoại Ngữ', 'bg-emerald-100 text-emerald-800')}

                        ${makeColSelect('ly', 'Môn Vật Lý', 'bg-blue-100 text-blue-800')}
                        ${makeColSelect('hoa', 'Môn Hóa Học', 'bg-blue-100 text-blue-800')}
                        ${makeColSelect('sinh', 'Môn Sinh Học', 'bg-blue-100 text-blue-800')}

                        ${makeColSelect('su', 'Môn Lịch Sử', 'bg-amber-100 text-amber-800')}
                        ${makeColSelect('dia', 'Môn Địa Lý', 'bg-amber-100 text-amber-800')}
                        ${makeColSelect('gdkt', 'Môn GDKTPL', 'bg-amber-100 text-amber-800')}

                        ${makeColSelect('tin', 'Môn Tin Học', 'bg-purple-100 text-purple-800')}
                        ${makeColSelect('cnc', 'CN Công nghiệp', 'bg-rose-100 text-rose-800')}
                        ${makeColSelect('cnn', 'CN Nông nghiệp', 'bg-rose-100 text-rose-800')}
                    </div>
                </div>
            </div>
        `;
    };

    // --- TAB 5: STATS & HISTOGRAM DASHBOARD ---
    const getStatsTabHTML = () => {
        if (typeof excelData === 'undefined' || !excelData || excelData.length === 0) {
            return `<div class="p-12 text-center text-slate-400 italic">⚠️ Không có dữ liệu học sinh để hiển thị phổ điểm & thống kê. Vui lòng nạp Excel tại Tab Nguồn Điểm.</div>`;
        }

        const m = detectedMapping;
        
        // Find if selected statsSubject column is mapped
        const colName = m[statsSubject];
        if (!colName) {
            return `
                <div class="max-w-4xl mx-auto p-8 space-y-6 text-center">
                    <div class="text-slate-400 italic">⚠️ Môn thi này chưa được ghép cột trong hệ thống. Hãy cấu hình ghép cột ở Tab Nguồn Điểm để hiển thị phổ điểm.</div>
                    <div class="flex justify-center gap-2">
                        ${['toan','van','ngoaingu','ly','hoa','sinh','su','dia','gdkt','tin','cnc','cnn'].map(s => {
                            const lbls = {toan:'Toán', van:'Văn', ngoaingu:'Anh', ly:'Lý', hoa:'Hóa', sinh:'Sinh', su:'Sử', dia:'Địa', gdkt:'GDKT', tin:'Tin', cnc:'CN CN', cnn:'CN NN'};
                            const isAct = s === statsSubject;
                            return `<button onclick="ScorePortal.changeStatsSubject('${s}')" class="px-3 py-1.5 rounded-lg text-xs font-bold ${isAct ? 'bg-emerald-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}" style="border:none; cursor:pointer;">${lbls[s]}</button>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Get all scores for the statsSubject
        const scores = [];
        let totalCount = 0;
        let failCount = 0; // <= 1.0
        let gioiCount = 0; // >= 8.0
        let khaCount = 0;  // >= 6.5 and < 8.0
        let tbCount = 0;   // >= 5.0 and < 6.5
        let yeuCount = 0;  // < 5.0
        let sumScores = 0;

        excelData.forEach(row => {
            const scoreVal = row[colName];
            if (scoreVal !== undefined && scoreVal !== "" && scoreVal !== null) {
                const s = parseFloat(scoreVal);
                if (!isNaN(s)) {
                    scores.push(s);
                    totalCount++;
                    sumScores += s;
                    if (s <= 1.0) failCount++;
                    if (s >= 8.0) gioiCount++;
                    else if (s >= 6.5) khaCount++;
                    else if (s >= 5.0) tbCount++;
                    else yeuCount++;
                }
            }
        });

        const avgScore = totalCount > 0 ? (sumScores / totalCount).toFixed(2) : 0;

        // Bands for histogram
        const bands = [
            { name: '0.0 - 1.0', min: 0, max: 1.0, count: 0 },
            { name: '1.1 - 2.0', min: 1.0, max: 2.0, count: 0 },
            { name: '2.1 - 3.0', min: 2.0, max: 3.0, count: 0 },
            { name: '3.1 - 4.0', min: 3.0, max: 4.0, count: 0 },
            { name: '4.1 - 5.0', min: 4.0, max: 5.0, count: 0 },
            { name: '5.1 - 6.0', min: 5.0, max: 6.0, count: 0 },
            { name: '6.1 - 7.0', min: 6.0, max: 7.0, count: 0 },
            { name: '7.1 - 8.0', min: 7.0, max: 8.0, count: 0 },
            { name: '8.1 - 9.0', min: 8.0, max: 9.0, count: 0 },
            { name: '9.1 - 10.0', min: 9.0, max: 10.0, count: 0 }
        ];

        scores.forEach(s => {
            for (let i = 0; i < bands.length; i++) {
                const b = bands[i];
                if (i === 0) {
                    if (s >= b.min && s <= b.max) { b.count++; break; }
                } else {
                    if (s > b.min && s <= b.max) { b.count++; break; }
                }
            }
        });

        const maxBandCount = Math.max(...bands.map(b => b.count), 1);

        // Quality stats percentages
        const pGioi = totalCount > 0 ? ((gioiCount / totalCount) * 100).toFixed(1) : 0;
        const pKha = totalCount > 0 ? ((khaCount / totalCount) * 100).toFixed(1) : 0;
        const pTb = totalCount > 0 ? ((tbCount / totalCount) * 100).toFixed(1) : 0;
        const pYeu = totalCount > 0 ? ((yeuCount / totalCount) * 100).toFixed(1) : 0;

        // Mapped subject labels for selector
        const subLabels = {
            toan: 'Toán học', van: 'Ngữ văn', ngoaingu: 'Ngoại ngữ',
            ly: 'Vật lý', hoa: 'Hóa học', sinh: 'Sinh học',
            su: 'Lịch sử', dia: 'Địa lý', gdkt: 'GDKTPL',
            tin: 'Tin học', cnc: 'CN Công nghiệp', cnn: 'CN Nông nghiệp'
        };

        const subButtons = Object.keys(subLabels).map(s => {
            const mapped = m[s];
            if (!mapped) return '';
            const isAct = s === statsSubject;
            return `<button onclick="ScorePortal.changeStatsSubject('${s}')" class="px-3.5 py-2 rounded-xl text-xs font-black shadow-xs border transition-all ${isAct ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}" style="border:1px solid; cursor:pointer;">${subLabels[s]}</button>`;
        }).join('');

        // CẢNH BÁO ĐIỂM LIỆT (<= 1.0)
        let failListHTML = '';
        const dangerStudents = [];
        excelData.forEach(row => {
            const itemSBD = row[m.sbd] || '';
            const itemName = row[m.name] || '';
            const itemClass = row[m.lop] || '';
            
            // Check all mapped subjects for this student
            Object.keys(subLabels).forEach(s => {
                const subCol = m[s];
                if (subCol && row[subCol] !== undefined && row[subCol] !== "" && row[subCol] !== null) {
                    const score = parseFloat(row[subCol]);
                    if (!isNaN(score) && score <= 1.0) {
                        dangerStudents.push({ sbd: itemSBD, name: itemName, class: itemClass, subject: subLabels[s], score });
                    }
                }
            });
        });

        if (dangerStudents.length > 0) {
            failListHTML = `
                <div class="bg-red-50 p-6 rounded-3xl border border-red-200 space-y-4">
                    <div class="flex items-center gap-2.5 text-red-700 font-black text-base">
                        <i data-lucide="alert-triangle" class="w-5 h-5 animate-bounce" style="color:#ef4444"></i>
                        <span>CẢNH BÁO BÁO ĐỘNG ĐỎ: CÓ HỌC SINH ĐIỂM LIỆT (≤ 1.0)</span>
                    </div>
                    <p class="text-xs text-red-600">Phát hiện <b>${dangerStudents.length}</b> trường hợp có nguy cơ trượt tốt nghiệp do bị điểm liệt. Giáo viên cần lưu ý ôn tập gấp!</p>
                    <div class="overflow-x-auto max-h-60 rounded-2xl border border-red-200 bg-white">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-red-100 text-red-800 font-bold border-b border-red-200">
                                    <th class="p-3">SBD</th>
                                    <th class="p-3">Họ và Tên</th>
                                    <th class="p-3">Lớp</th>
                                    <th class="p-3">Môn bị liệt</th>
                                    <th class="p-3 text-center">Điểm số</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dangerStudents.map(ds => `
                                    <tr class="border-b border-red-100 hover:bg-red-50 text-slate-700">
                                        <td class="p-3 font-bold">${ds.sbd}</td>
                                        <td class="p-3 font-bold">${ds.name}</td>
                                        <td class="p-3">${ds.class || '---'}</td>
                                        <td class="p-3 text-red-600 font-bold">${ds.subject}</td>
                                        <td class="p-3 text-center text-red-700 font-black">${ds.score.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            failListHTML = `
                <div class="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 flex items-center gap-4 text-emerald-800">
                    <div class="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
                        <i data-lucide="check-circle-2" class="w-7 h-7" style="color:#10b981"></i>
                    </div>
                    <div>
                        <div class="font-black text-base">AN TOÀN TUYỆT ĐỐI!</div>
                        <div class="text-xs text-emerald-600 mt-0.5">Không phát hiện học sinh nào bị điểm liệt (≤ 1.0) trên toàn trường trong đợt thi thử này. Xin chúc mừng!</div>
                    </div>
                </div>
            `;
        }

        // BẢNG VÀNG THỦ KHOA (HALL OF FAME)
        // Calculate dynamic blocks
        const calculateBlockScore = (row, s1, s2, s3) => {
            const sc1 = row[m[s1]];
            const sc2 = row[m[s2]];
            const sc3 = row[m[s3]];
            if (sc1 !== undefined && sc2 !== undefined && sc3 !== undefined && sc1 !== "" && sc2 !== "" && sc3 !== "") {
                const sum = parseFloat(sc1) + parseFloat(sc2) + parseFloat(sc3);
                return isNaN(sum) ? 0 : sum;
            }
            return 0;
        };

        const rankingA00 = [];
        const rankingB00 = [];
        const rankingC00 = [];
        const rankingD01 = [];
        const rankingA01 = [];

        excelData.forEach(row => {
            const stdSBD = row[m.sbd] || '';
            const stdName = row[m.name] || '';
            const stdClass = row[m.lop] || '';

            const a00 = calculateBlockScore(row, 'toan', 'ly', 'hoa');
            const b00 = calculateBlockScore(row, 'toan', 'hoa', 'sinh');
            const c00 = calculateBlockScore(row, 'van', 'su', 'dia');
            const d01 = calculateBlockScore(row, 'toan', 'van', 'ngoaingu');
            const a01 = calculateBlockScore(row, 'toan', 'ly', 'ngoaingu');

            if (a00 > 0) rankingA00.push({ sbd: stdSBD, name: stdName, class: stdClass, score: a00 });
            if (b00 > 0) rankingB00.push({ sbd: stdSBD, name: stdName, class: stdClass, score: b00 });
            if (c00 > 0) rankingC00.push({ sbd: stdSBD, name: stdName, class: stdClass, score: c00 });
            if (d01 > 0) rankingD01.push({ sbd: stdSBD, name: stdName, class: stdClass, score: d01 });
            if (a01 > 0) rankingA01.push({ sbd: stdSBD, name: stdName, class: stdClass, score: a01 });
        });

        const getTop5 = (list) => list.sort((a, b) => b.score - a.score).slice(0, 5);

        const renderTopCard = (title, list) => {
            const top5 = getTop5(list);
            if (top5.length === 0) return '';
            return `
                <div class="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm space-y-3" style="border:1px solid #e2e8f0; padding:18px;">
                    <div class="font-black text-slate-800 text-sm flex items-center justify-between border-b pb-2 text-emerald-800">
                        <span>🏆 KHỐI ${title}</span>
                        <span class="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-black uppercase">Top 5</span>
                    </div>
                    <div class="space-y-2">
                        ${top5.map((std, index) => {
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                            return `
                                <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-2">
                                    <div class="flex items-center gap-2 min-w-0">
                                        <span class="font-extrabold w-5 text-center">${medal}</span>
                                        <div class="min-w-0 flex-1">
                                            <div class="font-extrabold text-slate-800 truncate">${std.name}</div>
                                            <div class="text-[10px] text-slate-400 font-semibold">${std.class} • SBD: ${std.sbd}</div>
                                        </div>
                                    </div>
                                    <span class="font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg text-[11px]">${std.score.toFixed(2)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        };

        return `
            <div class="max-w-4xl mx-auto space-y-6 font-sans">
                <!-- Branding Header Stats -->
                <div class="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                    <div class="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <div class="space-y-1 relative z-10">
                        <div class="text-[10px] font-black uppercase tracking-widest text-emerald-300 opacity-90">${ownerDepartment.toUpperCase()}</div>
                        <div class="text-sm font-extrabold uppercase tracking-wide text-white">${ownerSchool.toUpperCase()}</div>
                        <h1 class="text-xl font-black uppercase tracking-wider text-white mt-1">📊 PHỔ ĐIỂM & BẢNG VÀNG THỦ KHOA</h1>
                    </div>
                    <div class="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-wider whitespace-nowrap text-emerald-200">
                        DỮ LIỆU THỐNG KÊ
                    </div>
                </div>

                <!-- Subject selector -->
                <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div class="text-xs font-black text-slate-500 uppercase tracking-wider">Chọn môn học để xem phổ điểm:</div>
                    <div class="flex flex-wrap gap-2">
                        ${subButtons}
                    </div>
                </div>

                <!-- Phổ điểm & Tóm tắt -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Tóm tắt số liệu -->
                    <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4" style="border:1px solid #e2e8f0; padding:24px;">
                        <div class="space-y-3">
                            <div class="text-xs font-extrabold text-slate-500 uppercase">TÓM TẮT MÔN: ${subLabels[statsSubject].toUpperCase()}</div>
                            <div class="text-4xl font-black text-emerald-700 mt-1">${avgScore}</div>
                            <div class="text-xs text-slate-400 font-semibold">Điểm trung bình đợt thi thử</div>
                        </div>
                        <div class="w-full h-px bg-slate-100"></div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <div class="text-[10px] font-extrabold text-slate-400 uppercase">Tổng số bài thi</div>
                                <div class="text-lg font-black text-slate-800 mt-0.5">${totalCount}</div>
                            </div>
                            <div>
                                <div class="text-[10px] font-extrabold text-slate-400 uppercase">Số bài bị điểm liệt</div>
                                <div class="text-lg font-black text-red-600 mt-0.5">${failCount}</div>
                            </div>
                        </div>
                    </div>

                    <!-- CSS Histogram Chart -->
                    <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-2 space-y-4" style="border:1px solid #e2e8f0; padding:24px;">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-black text-slate-800 uppercase tracking-wider">Biểu đồ phân bố điểm số (Phổ điểm)</span>
                            <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">Môn: ${subLabels[statsSubject]}</span>
                        </div>
                        
                        <!-- Chart container -->
                        <div class="flex items-end justify-between gap-1 sm:gap-2 h-44 border-b border-slate-200 pb-2 pt-4">
                            ${bands.map(b => {
                                const heightPercent = b.count > 0 ? (b.count / maxBandCount) * 100 : 0;
                                const barColor = b.max <= 1.0 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : b.max <= 5.0 
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : b.max <= 8.0
                                            ? 'bg-sky-500 hover:bg-sky-600'
                                            : 'bg-emerald-500 hover:bg-emerald-600';
                                return `
                                    <div class="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer">
                                        <!-- Tooltip -->
                                        <div class="absolute bottom-full mb-2 bg-slate-800 text-white text-[9px] font-black py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-20" style="position:absolute; bottom:100%; transition: opacity 0.2s;">
                                            ${b.count} bài (${((b.count / (totalCount || 1)) * 100).toFixed(1)}%)
                                        </div>
                                        <!-- Bar -->
                                        <div class="${barColor} w-full rounded-t-md transition-all shadow-inner" style="height: ${heightPercent}%;"></div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        <!-- Axis Labels -->
                        <div class="flex justify-between text-[8px] sm:text-[9px] font-black text-slate-400 pt-1">
                            ${bands.map(b => `<div class="flex-1 text-center truncate">${b.name}</div>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- Chất lượng học lực môn -->
                <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4" style="border:1px solid #e2e8f0; padding:24px;">
                    <div class="text-xs font-black text-slate-800 uppercase tracking-wider">Đánh giá chất lượng học lực môn: ${subLabels[statsSubject]}</div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <!-- Giỏi -->
                        <div class="space-y-1">
                            <div class="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>Giỏi (≥ 8.0)</span>
                                <span class="font-extrabold text-emerald-600">${gioiCount} bài (${pGioi}%)</span>
                            </div>
                            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                <div class="bg-emerald-500 h-full rounded-full" style="width: ${pGioi}%;"></div>
                            </div>
                        </div>

                        <!-- Khá -->
                        <div class="space-y-1">
                            <div class="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>Khá (6.5 - 7.9)</span>
                                <span class="font-extrabold text-sky-600">${khaCount} bài (${pKha}%)</span>
                            </div>
                            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                <div class="bg-sky-500 h-full rounded-full" style="width: ${pKha}%;"></div>
                            </div>
                        </div>

                        <!-- Trung bình -->
                        <div class="space-y-1">
                            <div class="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>Trung bình (5.0 - 6.4)</span>
                                <span class="font-extrabold text-amber-600">${tbCount} bài (${pTb}%)</span>
                            </div>
                            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                <div class="bg-amber-500 h-full rounded-full" style="width: ${pTb}%;"></div>
                            </div>
                        </div>

                        <!-- Yếu/Kém -->
                        <div class="space-y-1">
                            <div class="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>Yếu / Kém (< 5.0)</span>
                                <span class="font-extrabold text-rose-600">${yeuCount} bài (${pYeu}%)</span>
                            </div>
                            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                <div class="bg-rose-500 h-full rounded-full" style="width: ${pYeu}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BẢNG VÀNG THỦ KHOA (TOP STUDENTS) -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 text-slate-800 font-black text-base border-b pb-2">
                        <i data-lucide="crown" class="w-5 h-5" style="color:#f59e0b"></i>
                        <span>🏆 BẢNG VÀNG THỦ KHOA TRƯỜNG TA</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        ${renderTopCard('A00 (Toán - Lý - Hóa)', rankingA00)}
                        ${renderTopCard('B00 (Toán - Hóa - Sinh)', rankingB00)}
                        ${renderTopCard('C00 (Văn - Sử - Địa)', rankingC00)}
                        ${renderTopCard('D01 (Toán - Văn - Anh)', rankingD01)}
                        ${renderTopCard('A01 (Toán - Lý - Anh)', rankingA01)}
                    </div>
                </div>

                <!-- FAIL ZONE WARNING -->
                ${failListHTML}
            </div>
        `;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            if (typeof XLSX === 'undefined') { alert("⚠️ Không tìm thấy thư viện đọc Excel!"); return; }
            try {
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheet];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                if (rows.length > 0) {
                    activeFileName = file.name;
                    excelData = rows;
                    columnNames = Object.keys(rows[0]);
                    detectScoreColumns();
                    renderTabContent();
                    alert(`🎉 Đã nạp thành công tệp điểm thi: ${file.name} (${rows.length} thí sinh).`);
                }
            } catch (err) {
                console.error("ScorePortal file upload error:", err);
                alert("⚠️ Đã xảy ra lỗi khi đọc tệp Excel. Vui lòng kiểm tra lại định dạng file.");
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const updateOwnerConfig = (key, val) => {
        if (key === 'department') ownerDepartment = val;
        if (key === 'school') ownerSchool = val;
    };
    
    const updatePasswords = (key, val) => {
        if (key === 'teacher') teacherPassword = val.trim();
        if (key === 'admin') adminPassword = val.trim();
    };

    const loginRole = () => {
        const password = prompt("🔑 Nhập mật khẩu truy cập dành cho Giáo viên / Quản trị viên:");
        if (!password) return;
        if (password === adminPassword) {
            currentRole = 'ADMIN';
            activeTab = 'kiosk';
            openModal();
            alert("🎉 Đăng nhập thành công với quyền QUẢN TRỊ VIÊN!");
        } else if (password === teacherPassword) {
            currentRole = 'TEACHER';
            activeTab = 'kiosk';
            openModal();
            alert("🎉 Đăng nhập thành công với quyền GIÁO VIÊN!");
        } else {
            alert("⚠️ Mật khẩu không chính xác!");
        }
    };

    const logoutRole = () => {
        currentRole = 'STUDENT';
        activeTab = 'kiosk';
        openModal();
        alert("🔒 Đã đăng xuất về quyền Học sinh.");
    };

    const changeStatsSubject = (subj) => {
        statsSubject = subj;
        renderTabContent();
    };

    return {
        openModal,
        closeModal,
        switchTab,
        renderSearchResults,
        queueClassZalo,
        queueAllZalo,
        exportStandaloneHTML,
        handleFileUpload,
        updateMapping,
        updateOwnerConfig,
        updatePasswords,
        loginRole,
        logoutRole,
        changeStatsSubject
    };
})();

function openScorePortal() {
    ScorePortal.openModal();
}

window.printDigitalCard = function(sbd) {
    let student = null;
    let excelRow = null;
    let roomNum = '01';
    let seatNum = '12';

    if (typeof excelData !== 'undefined' && excelData) {
        const m = detectedMapping;
        const row = excelData.find(r => String(r[m.sbd]).trim().toLowerCase() === String(sbd).trim().toLowerCase());
        if (row) {
            excelRow = row;
            student = {
                sbd: String(row[m.sbd]).trim(),
                name: String(row[m.name]).trim(),
                lop: String(row[m.lop]).trim()
            };
        }
    }

    if (typeof window.generatedRooms !== 'undefined' && window.generatedRooms) {
        for (let room of window.generatedRooms) {
            const found = (room.students || []).find(std => String(std.sbd).trim().toLowerCase() === String(sbd).trim().toLowerCase());
            if (found) {
                student = student || found;
                roomNum = room.number;
                seatNum = String((room.students.indexOf(found) + 1)).padStart(2, '0');
                break;
            }
        }
    }

    if (!student) {
        alert("⚠️ Không tìm thấy thông tin thí sinh!");
        return;
    }

    if (!seatNum || seatNum === '12') {
        const sbdNum = parseInt(sbd.replace(/[^0-9]/g, '')) || 99;
        roomNum = String(Math.floor(sbdNum / 24) + 1).padStart(2, '0');
        seatNum = String((sbdNum % 24) + 1).padStart(2, '0');
    }

    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SBD:' + sbd;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Thẻ Dự Thi Điện Tử - ${student.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');
                body {
                    font-family: 'Outfit', sans-serif;
                    padding: 40px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: #f1f5f9;
                }
                .card {
                    width: 500px;
                    background: white;
                    border: 4px double #d97706;
                    border-radius: 24px;
                    padding: 28px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    position: relative;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #f59e0b;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                }
                .header h3 {
                    margin: 0;
                    font-size: 11px;
                    font-weight: 800;
                    color: #d97706;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .header h2 {
                    margin: 2px 0 0 0;
                    font-size: 14px;
                    font-weight: 900;
                    color: #1e293b;
                    text-transform: uppercase;
                }
                .title {
                    font-size: 18px;
                    font-weight: 900;
                    color: #b45309;
                    text-align: center;
                    margin: 15px 0;
                    letter-spacing: 1px;
                }
                .content {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }
                .qr-area {
                    border: 1px solid #e2e8f0;
                    padding: 8px;
                    border-radius: 16px;
                    background: #fdfaf6;
                    text-align: center;
                }
                .qr-area img {
                    width: 110px;
                    height: 110px;
                }
                .info-area {
                    flex: 1;
                }
                .info-row {
                    font-size: 13px;
                    margin: 8px 0;
                    color: #475569;
                }
                .info-row b {
                    color: #0f172a;
                }
                .stamp-area {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 20px;
                    text-align: center;
                }
                .stamp-box {
                    font-size: 11px;
                    color: #475569;
                    position: relative;
                }
                .stamp-signature {
                    font-family: 'Playball', cursive, sans-serif;
                    font-size: 20px;
                    color: #ef4444;
                    margin: 10px 0;
                    font-weight: bold;
                    transform: rotate(-5deg);
                }
                .red-stamp {
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    border: 3px solid rgba(239, 68, 68, 0.7);
                    border-radius: 50px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: rgba(239, 68, 68, 0.7);
                    font-weight: 900;
                    font-size: 8px;
                    text-transform: uppercase;
                    top: -5px;
                    right: 15px;
                    transform: rotate(15deg);
                    pointer-events: none;
                }
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .card {
                        box-shadow: none;
                        border: 3px double #d97706;
                    }
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h3>${ownerDepartment}</h3>
                    <h2>${ownerSchool}</h2>
                </div>
                <div class="title">THẺ DỰ THI ĐIỆN TỬ</div>
                <div class="content">
                    <div class="qr-area">
                        <img src="${qrUrl}">
                        <div style="font-size: 8px; font-weight: 800; color: #94a3b8; margin-top: 4px;">SECURE ENTRY</div>
                    </div>
                    <div class="info-area">
                        <div class="info-row">Họ và tên: <b style="font-size:15px; text-transform:uppercase;">${student.name}</b></div>
                        <div class="info-row">Số báo danh: <b style="color:#d97706; font-size:14px;">${student.sbd}</b></div>
                        <div class="info-row">Lớp đăng ký: <b>${student.lop}</b></div>
                        <div class="info-row">Phòng thi số: <b style="color:#059669; font-size:14px;">${roomNum}</b></div>
                        <div class="info-row">Số ghế ngồi: <b style="color:#2563eb; font-size:14px;">${seatNum}</b></div>
                    </div>
                </div>
                <div class="stamp-area">
                    <div class="stamp-box">
                        <div>Dak Lak, Ngày 19 tháng 05 năm 2026</div>
                        <div style="font-weight: 800; margin-top: 2px;">HIỆU TRƯỞNG</div>
                        <div class="stamp-signature">Nguyễn Văn A</div>
                        <div class="red-stamp">
                            <div style="text-align:center;">TRƯỜNG THPT<br>CAO BÁ QUÁT<br>★</div>
                        </div>
                    </div>
                </div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};
